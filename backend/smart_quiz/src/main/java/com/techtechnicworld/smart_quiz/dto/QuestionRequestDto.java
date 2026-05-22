package com.techtechnicworld.smart_quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class QuestionRequestDto {

    @NotBlank(message = "Question text is required")
    private String questionText;

    @NotNull(message = "Question order is required")
    private Integer questionOrder;

    @NotEmpty(message = "At least one correct option is required")
    private List<Long> correctOptionIds;

    @Valid
    @NotEmpty(message = "At least 2 options are required")
    private List<OptionDto> options;

    @Data
    public static class OptionDto {
        private Long id; // Database ID
        private String uniqueInsertId; // Client-generated UUID
        private String optionText;
    }
}