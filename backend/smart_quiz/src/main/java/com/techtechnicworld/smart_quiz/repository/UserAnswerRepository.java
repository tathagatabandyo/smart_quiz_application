package com.techtechnicworld.smart_quiz.repository;

import com.techtechnicworld.smart_quiz.entities.UserAnswer;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAnswerRepository extends JpaRepository<UserAnswer, Long> {
    List<UserAnswer> findByAttemptId(Long attemptId);
    Optional<UserAnswer> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);
    boolean existsByAttemptIdAndQuestionId(Long attemptId, Long questionId);
}
