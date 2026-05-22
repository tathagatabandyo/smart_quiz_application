package com.techtechnicworld.smart_quiz.controller;

import com.techtechnicworld.smart_quiz.dto.ApiResponseDto;
import com.techtechnicworld.smart_quiz.dto.QuestionResponseDto;
import com.techtechnicworld.smart_quiz.dto.QuizResponseDto;
import com.techtechnicworld.smart_quiz.services.QuizService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;

    @GetMapping
    public ResponseEntity<ApiResponseDto<List<QuizResponseDto>>> getAllQuizzes(
            @RequestParam(required = false) String status) {
        List<QuizResponseDto> quizzes = quizService.getAllQuizzes(status);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quizzes fetched successfully", quizzes));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponseDto<List<QuizResponseDto>>> getAllQuizzesAdmin() {
        List<QuizResponseDto> quizzes = quizService.getAllQuizzesForAdmin();
        return ResponseEntity.ok(new ApiResponseDto<>(false, "All quizzes fetched successfully", quizzes));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponseDto<QuizResponseDto>> getQuizById(@PathVariable Long id) {
        QuizResponseDto quiz = quizService.getQuizById(id);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Quiz fetched successfully", quiz));
    }

    @GetMapping("/{quizId}/questions")
    public ResponseEntity<ApiResponseDto<Page<QuestionResponseDto>>> getQuestions(
            @PathVariable Long quizId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "1") int size) {
        Page<QuestionResponseDto> questions = quizService.getQuestionsByQuiz(quizId, page, size);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Questions fetched successfully", questions));
    }

    @GetMapping("/{quizId}/questions/all")
    public ResponseEntity<ApiResponseDto<List<QuestionResponseDto>>> getAllQuestions(
            @PathVariable Long quizId) {
        List<QuestionResponseDto> questions = quizService.getAllQuestionsByQuiz(quizId);
        return ResponseEntity.ok(new ApiResponseDto<>(false, "All questions fetched successfully", questions));
    }
}
