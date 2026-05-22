package com.techtechnicworld.smart_quiz.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

@Entity
@Table(name = "user_answers")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attempt_id", nullable = false)
    private QuizAttempt attempt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(name = "selected_option_key")
    private String selectedOptionKey;

    @Column(nullable = false, name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "timed_out")
    @Builder.Default
    private Boolean timedOut = false;

    @Column(nullable = false, name = "answered_at")
    private LocalDateTime answeredAt;

    @PrePersist
    private void beforeInsert() {
        if (this.answeredAt == null) {
            this.answeredAt = LocalDateTime.now(ZoneOffset.UTC);
        }
    }
}
