package com.techtechnicworld.smart_quiz.services;

import com.techtechnicworld.smart_quiz.dto.SubmitAnswerRequest;
import com.techtechnicworld.smart_quiz.entities.*;
import com.techtechnicworld.smart_quiz.enums.AttemptStatus;
import com.techtechnicworld.smart_quiz.exceptions.QuizNotFoundException;
import com.techtechnicworld.smart_quiz.exceptions.TimeExpiredException;
import com.techtechnicworld.smart_quiz.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class QuizAttemptService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final UserAnswerRepository userAnswerRepository;

    @Transactional
    public QuizAttempt startAttempt(Long quizId, User user) {
        Quiz quiz = quizRepository.findById(quizId)
                .orElseThrow(() -> new QuizNotFoundException("QUIZ_NOT_FOUND"));

        long totalQuestions = questionRepository.countByQuizIdAndDeletedFalse(quizId);

        // Cancel any existing in-progress attempt for this user + quiz
        quizAttemptRepository.findByUserIdAndQuizIdAndStatus(user.getId(), quizId, AttemptStatus.IN_PROGRESS)
                .ifPresent(existing -> {
                    existing.setStatus(AttemptStatus.CANCELLED);
                    quizAttemptRepository.save(existing);
                });

        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .quiz(quiz)
                .totalQuestions((int) totalQuestions)
                .status(AttemptStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        return quizAttemptRepository.save(attempt);
    }

    @Transactional
    public UserAnswer submitAnswer(Long attemptId, SubmitAnswerRequest request, User user) {
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new QuizNotFoundException("ATTEMPT_NOT_FOUND"));

        if (attempt.getStatus() == AttemptStatus.COMPLETED) {
            throw new IllegalArgumentException("ATTEMPT_ALREADY_COMPLETED");
        }

        // Check if already answered this question
        if (userAnswerRepository.existsByAttemptIdAndQuestionId(attemptId, request.getQuestionId())) {
            throw new IllegalArgumentException("QUESTION_ALREADY_ANSWERED");
        }

        Question question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new QuizNotFoundException("QUESTION_NOT_FOUND"));

        // Validate timer (skip if already timed out)
        boolean isTimedOut = request.getTimedOut() != null && request.getTimedOut();
        if (!isTimedOut) {
            validateTimer(attempt, question);
        }

        boolean isCorrect = false;
        String selectedOptionKeysStr = "";

        // Check answer correctness only if not timed out and options were selected
        List<Long> selectedOptionIds = request.getSelectedOptionIds();
        if (!isTimedOut && selectedOptionIds != null && !selectedOptionIds.isEmpty()) {
            List<Long> correctOptionIds = question.getCorrectOptionIdsList();

            // Check if all correct options are selected and no wrong options
            boolean allCorrectSelected = selectedOptionIds.containsAll(correctOptionIds);
            boolean noWrongSelected = selectedOptionIds.size() == correctOptionIds.size();
            isCorrect = allCorrectSelected && noWrongSelected;

            if (isCorrect) {
                attempt.setTotalScore(attempt.getTotalScore() + 1);
            }

        // Store selected option IDs as comma-separated values
        selectedOptionKeysStr = selectedOptionIds.stream()
                .map(String::valueOf)
                .collect(Collectors.joining(","));
        }

        UserAnswer answer = UserAnswer.builder()
                .attempt(attempt)
                .question(question)
                .selectedOptionKey(selectedOptionKeysStr)
                .isCorrect(isCorrect)
                .timedOut(isTimedOut)
                .answeredAt(LocalDateTime.now(ZoneOffset.UTC))
                .build();

        userAnswerRepository.save(answer);

        return answer;
    }

    @Transactional
    public QuizAttempt completeAttempt(Long attemptId, User user) {
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, user.getId())
                .orElseThrow(() -> new QuizNotFoundException("ATTEMPT_NOT_FOUND"));

        if (attempt.getStatus() == AttemptStatus.COMPLETED) {
            throw new IllegalArgumentException("ATTEMPT_ALREADY_COMPLETED");
        }

        attempt.setStatus(AttemptStatus.COMPLETED);
        attempt.setCompletedAt(LocalDateTime.now(ZoneOffset.UTC));

        return quizAttemptRepository.save(attempt);
    }

    private void validateTimer(QuizAttempt attempt, Question question) {
        int timePerQuestion = attempt.getQuiz().getTimePerQuestion();
        int questionNumber = question.getQuestionOrder();

        // Total allowed time = timePerQuestion * questionNumber (in seconds)
        long totalAllowedSeconds = (long) timePerQuestion * questionNumber;

        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        long elapsedSeconds = Duration.between(attempt.getStartedAt(), now).getSeconds();

        if (elapsedSeconds > totalAllowedSeconds) {
            throw new TimeExpiredException("TIME_EXPIRED");
        }
    }
}
