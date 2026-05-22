package com.techtechnicworld.smart_quiz.controller;

import com.techtechnicworld.smart_quiz.dto.ApiResponseDto;
import com.techtechnicworld.smart_quiz.dto.SubmitAnswerRequest;
import com.techtechnicworld.smart_quiz.entities.QuizAttempt;
import com.techtechnicworld.smart_quiz.entities.User;
import com.techtechnicworld.smart_quiz.entities.UserAnswer;
import com.techtechnicworld.smart_quiz.repository.UserRepository;
import com.techtechnicworld.smart_quiz.services.QuizAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final QuizAttemptService quizAttemptService;
    private final UserRepository userRepository;

    @PostMapping("/start")
    public ResponseEntity<ApiResponseDto<Map<String, Object>>> startAttempt(
            @RequestBody Map<String, Long> request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        Long quizId = request.get("quizId");
        QuizAttempt attempt = quizAttemptService.startAttempt(quizId, user);
        Map<String, Object> data = Map.of(
                "attemptId", attempt.getId(),
                "quizId", attempt.getQuiz().getId(),
                "quizTitle", attempt.getQuiz().getTitle(),
                "totalQuestions", attempt.getTotalQuestions(),
                "timePerQuestion", attempt.getQuiz().getTimePerQuestion(),
                "status", attempt.getStatus().name(),
                "startedAt", attempt.getStartedAt().toString()
        );
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Attempt started successfully", data));
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<ApiResponseDto<Map<String, Object>>> submitAnswer(
            @PathVariable Long attemptId,
            @Valid @RequestBody SubmitAnswerRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        UserAnswer answer = quizAttemptService.submitAnswer(attemptId, request, user);
        Map<String, Object> data = Map.of(
                "answerId", answer.getId(),
                "isCorrect", answer.getIsCorrect(),
                "questionId", answer.getQuestion().getId()
        );
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Answer submitted successfully", data));
    }

    @PostMapping("/{attemptId}/complete")
    public ResponseEntity<ApiResponseDto<Map<String, Object>>> completeAttempt(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        QuizAttempt attempt = quizAttemptService.completeAttempt(attemptId, user);
        Map<String, Object> data = Map.of(
                "attemptId", attempt.getId(),
                "totalScore", attempt.getTotalScore(),
                "totalQuestions", attempt.getTotalQuestions(),
                "status", attempt.getStatus().name()
        );
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Attempt completed successfully", data));
    }
}
