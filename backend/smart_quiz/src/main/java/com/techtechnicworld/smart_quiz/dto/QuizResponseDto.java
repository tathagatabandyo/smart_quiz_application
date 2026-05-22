package com.techtechnicworld.smart_quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResponseDto {
    private Long id;
    private String title;
    private String description;
    private Integer timePerQuestion;
    private Integer totalQuestions;
    private String createdBy;
    private String status;
    private LocalDateTime createdAt;
}
