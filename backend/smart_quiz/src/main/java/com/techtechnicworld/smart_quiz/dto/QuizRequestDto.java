package com.techtechnicworld.smart_quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class QuizRequestDto {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Time per question is required")
    private Integer timePerQuestion;

    private String status; // PUBLISHED or DRAFT
}
