package com.techtechnicworld.smart_quiz.services;

import com.techtechnicworld.smart_quiz.dto.AttemptSummaryDto;
import com.techtechnicworld.smart_quiz.dto.QuizResultResponseDto;
import com.techtechnicworld.smart_quiz.entities.*;
import com.techtechnicworld.smart_quiz.exceptions.QuizNotFoundException;
import com.techtechnicworld.smart_quiz.repository.QuizAttemptRepository;
import com.techtechnicworld.smart_quiz.repository.UserAnswerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResultService {

    private final QuizAttemptRepository quizAttemptRepository;
    private final UserAnswerRepository userAnswerRepository;

    @Transactional(readOnly = true)
    public QuizResultResponseDto getResult(Long attemptId, Long userId) {
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUserId(attemptId, userId)
                .orElseThrow(() -> new QuizNotFoundException("ATTEMPT_NOT_FOUND"));

        List<UserAnswer> answers = userAnswerRepository.findByAttemptId(attemptId);

        List<QuizResultResponseDto.AnswerSummaryDto> answerSummaries = answers.stream()
                .map(answer -> {
                    Question question = answer.getQuestion();
                    List<Long> correctIds = question.getCorrectOptionIdsList();

                    // Provide full option details in order so frontend can display them
                    List<QuizResultResponseDto.OptionDetailDto> optionDetails = question.getOptions().stream()
                            .map(opt -> QuizResultResponseDto.OptionDetailDto.builder()
                                    .id(opt.getId())
                                    .optionText(opt.getOptionText())
                                    .build())
                            .toList();

                    return QuizResultResponseDto.AnswerSummaryDto.builder()
                            .questionText(question.getQuestionText())
                            .selectedOptionKey(answer.getSelectedOptionKey())
                            .correctOptionIds(correctIds)
                            .options(optionDetails)
                            .isCorrect(answer.getIsCorrect())
                            .timedOut(answer.getTimedOut() != null && answer.getTimedOut())
                            .build();
                })
                .collect(Collectors.toList());

        double percentage = attempt.getTotalQuestions() > 0
                ? (double) attempt.getTotalScore() / attempt.getTotalQuestions() * 100
                : 0;

        return QuizResultResponseDto.builder()
                .attemptId(attempt.getId())
                .quizTitle(attempt.getQuiz().getTitle())
                .userName(attempt.getUser().getName())
                .totalScore(attempt.getTotalScore())
                .totalQuestions(attempt.getTotalQuestions())
                .percentage(Math.round(percentage * 100.0) / 100.0)
                .status(attempt.getStatus().name())
                .startedAt(attempt.getStartedAt())
                .completedAt(attempt.getCompletedAt())
                .answers(answerSummaries)
                .build();
    }

    public Page<AttemptSummaryDto> getUserAttempts(Long userId, Pageable pageable) {
        return quizAttemptRepository.findByUserIdOrderByStartedAtDesc(userId, pageable)
                .map(attempt -> {
                    double percentage = attempt.getTotalQuestions() > 0
                            ? (double) attempt.getTotalScore() / attempt.getTotalQuestions() * 100
                            : 0;
                    return AttemptSummaryDto.builder()
                            .attemptId(attempt.getId())
                            .quizTitle(attempt.getQuiz().getTitle())
                            .totalScore(attempt.getTotalScore())
                            .totalQuestions(attempt.getTotalQuestions())
                            .percentage(Math.round(percentage * 100.0) / 100.0)
                            .status(attempt.getStatus().name())
                            .startedAt(attempt.getStartedAt())
                            .completedAt(attempt.getCompletedAt())
                            .build();
                });
    }
}
