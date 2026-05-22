package com.techtechnicworld.smart_quiz.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "questions")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Question {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false, name = "question_order")
    private Integer questionOrder;

    @Column(name = "correct_option_ids", columnDefinition = "TEXT")
    private String correctOptionIds; // Comma-separated option IDs

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<QuestionOption> options = new ArrayList<>();

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    public List<Long> getCorrectOptionIdsList() {
        if (correctOptionIds == null || correctOptionIds.isEmpty()) {
            return List.of();
        }
        return java.util.Arrays.stream(correctOptionIds.split(","))
                .map(Long::parseLong)
                .toList();
    }

    public void setCorrectOptionIdsList(List<Long> ids) {
        this.correctOptionIds = ids != null ? String.join(",", ids.stream().map(String::valueOf).toList()) : "";
    }
}