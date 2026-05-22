package com.techtechnicworld.smart_quiz.repository;

import com.techtechnicworld.smart_quiz.entities.Quiz;
import com.techtechnicworld.smart_quiz.enums.QuizStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuizRepository extends JpaRepository<Quiz, Long> {
    List<Quiz> findByStatusAndDeletedFalseOrderByCreatedAtDesc(QuizStatus status);
    List<Quiz> findAllByDeletedFalseOrderByCreatedAtDesc();
    List<Quiz> findByStatusOrderByCreatedAtDesc(QuizStatus status);
    List<Quiz> findAllByOrderByCreatedAtDesc();
}