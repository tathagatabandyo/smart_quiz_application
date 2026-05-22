package com.techtechnicworld.smart_quiz.controller;

import com.techtechnicworld.smart_quiz.dto.*;
import com.techtechnicworld.smart_quiz.entities.User;
import com.techtechnicworld.smart_quiz.repository.UserRepository;
import com.techtechnicworld.smart_quiz.services.AiQuizService;
import com.techtechnicworld.smart_quiz.services.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminQuizController {

    private final QuizService quizService;
    private final AiQuizService aiQuizService;
    private final UserRepository userRepository;

    @PostMapping("/quizzes")
    public ResponseEntity<ApiResponseDto<QuizResponseDto>> createQuiz(
            @Valid @RequestBody QuizRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        QuizResponseDto response = quizService.createQuiz(request, admin);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quiz created successfully", response));
    }

    @PutMapping("/quizzes/{id}")
    public ResponseEntity<ApiResponseDto<QuizResponseDto>> updateQuiz(
            @PathVariable Long id,
            @Valid @RequestBody QuizRequestDto request) {
        QuizResponseDto response = quizService.updateQuiz(id, request);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quiz updated successfully", response));
    }

    @DeleteMapping("/quizzes/{id}")
    public ResponseEntity<ApiResponseDto<Void>> deleteQuiz(@PathVariable Long id) {
        quizService.deleteQuiz(id);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quiz deleted successfully"));
    }

    @PostMapping("/quizzes/{quizId}/questions")
    public ResponseEntity<ApiResponseDto<QuestionResponseDto>> addQuestion(
            @PathVariable Long quizId,
            @Valid @RequestBody QuestionRequestDto request) {
        QuestionResponseDto response = quizService.addQuestion(quizId, request);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Question added successfully", response));
    }

    @PutMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponseDto<QuestionResponseDto>> updateQuestion(
            @PathVariable Long questionId,
            @Valid @RequestBody QuestionRequestDto request) {
        QuestionResponseDto response = quizService.updateQuestion(questionId, request);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Question updated successfully", response));
    }

    @DeleteMapping("/questions/{questionId}")
    public ResponseEntity<ApiResponseDto<Void>> deleteQuestion(@PathVariable Long questionId) {
        quizService.deleteQuestion(questionId);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Question deleted successfully"));
    }

    @PostMapping("/quizzes/ai-generate")
    public ResponseEntity<ApiResponseDto<QuizResponseDto>> generateQuizWithAi(
            @Valid @RequestBody AiQuizRequestDto request,
            @AuthenticationPrincipal UserDetails userDetails) {
        User admin = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        QuizResponseDto response = aiQuizService.generateQuiz(request, admin);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quiz generated successfully with AI", response));
    }
}
