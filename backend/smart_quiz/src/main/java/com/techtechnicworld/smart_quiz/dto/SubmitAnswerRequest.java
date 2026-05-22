package com.techtechnicworld.smart_quiz.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class SubmitAnswerRequest {

    @NotNull(message = "Question ID is required")
    private Long questionId;

    private List<Long> selectedOptionIds;

    private Boolean timedOut = false;
}
