package com.techtechnicworld.smart_quiz.repository;

import com.techtechnicworld.smart_quiz.entities.QuizAttempt;
import com.techtechnicworld.smart_quiz.enums.AttemptStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long> {
    Page<QuizAttempt> findByUserIdOrderByStartedAtDesc(Long userId, Pageable pageable);
    Optional<QuizAttempt> findByIdAndUserId(Long id, Long userId);
    Optional<QuizAttempt> findByUserIdAndQuizIdAndStatus(Long userId, Long quizId, AttemptStatus status);
}
