package com.techtechnicworld.smart_quiz.controller;

import com.techtechnicworld.smart_quiz.dto.ApiResponseDto;
import com.techtechnicworld.smart_quiz.dto.AttemptSummaryDto;
import com.techtechnicworld.smart_quiz.dto.QuizResultResponseDto;
import com.techtechnicworld.smart_quiz.entities.User;
import com.techtechnicworld.smart_quiz.repository.UserRepository;
import com.techtechnicworld.smart_quiz.services.ResultService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
public class ResultController {

    private final ResultService resultService;
    private final UserRepository userRepository;

    @GetMapping("/{attemptId}")
    public ResponseEntity<ApiResponseDto<QuizResultResponseDto>> getResult(
            @PathVariable Long attemptId,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        QuizResultResponseDto result = resultService.getResult(attemptId, user.getId());
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Result fetched successfully", result));
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponseDto<Page<AttemptSummaryDto>>> getMyAttempts(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("USER_NOT_FOUND"));
        Page<AttemptSummaryDto> attempts = resultService.getUserAttempts(user.getId(), PageRequest.of(page, size));
        return ResponseEntity.ok(new ApiResponseDto<>(false, "Attempts fetched successfully", attempts));
    }
}
