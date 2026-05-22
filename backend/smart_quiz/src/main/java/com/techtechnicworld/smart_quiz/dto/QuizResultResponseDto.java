package com.techtechnicworld.smart_quiz.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizResultResponseDto {
    private Long attemptId;
    private String quizTitle;
    private String userName;
    private Integer totalScore;
    private Integer totalQuestions;
    private Double percentage;
    private String status;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<AnswerSummaryDto> answers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AnswerSummaryDto {
        private String questionText;
        private String selectedOptionKey;
        private List<Long> correctOptionIds;
        private List<OptionDetailDto> options;
        private Boolean isCorrect;
        private Boolean timedOut;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDetailDto {
        private Long id;
        private String optionText;
    }
}
