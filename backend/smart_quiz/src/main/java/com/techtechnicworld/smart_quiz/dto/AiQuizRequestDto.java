package com.techtechnicworld.smart_quiz.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiQuizRequestDto {

    @NotBlank(message = "Quiz title is required")
    private String title;

    private String description;

    @NotNull(message = "Number of questions is required")
    @Min(value = 1, message = "Minimum 1 question required")
    @Max(value = 30, message = "Maximum 30 questions allowed")
    private Integer numberOfQuestions;

    @NotNull(message = "Time per question is required")
    @Min(value = 5, message = "Minimum 5 seconds per question")
    private Integer timePerQuestion;

    @NotBlank(message = "Prompt/topic is required")
    private String prompt;

    private String model; // defaults to deepseek-v4-flash
}
