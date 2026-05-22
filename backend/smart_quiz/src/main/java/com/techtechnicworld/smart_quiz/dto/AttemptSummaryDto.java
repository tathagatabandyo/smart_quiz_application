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
public class AttemptSummaryDto {
    private Long attemptId;
    private String quizTitle;
    private Integer totalScore;
    private Integer totalQuestions;
    private Double percentage;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
}
