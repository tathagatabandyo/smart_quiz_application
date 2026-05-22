package com.techtechnicworld.smart_quiz.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "question_options")
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unique_insert_id", nullable = false, unique = true)
    private String uniqueInsertId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionText;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "question_id", nullable = false)
    private Question question;

    @Column(nullable = false)
    @Builder.Default
    private Boolean deleted = false;

    @PrePersist
    public void generateUniqueInsertId() {
        if (this.uniqueInsertId == null) {
            this.uniqueInsertId = UUID.randomUUID().toString();
        }
    }
}