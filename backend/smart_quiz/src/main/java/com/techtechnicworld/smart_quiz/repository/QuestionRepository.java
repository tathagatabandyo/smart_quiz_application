package com.techtechnicworld.smart_quiz.repository;

import com.techtechnicworld.smart_quiz.entities.Question;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    Page<Question> findByQuizIdOrderByQuestionOrderAsc(Long quizId, Pageable pageable);
    List<Question> findByQuizIdOrderByQuestionOrderAsc(Long quizId);
    long countByQuizId(Long quizId);
    Page<Question> findByQuizIdAndDeletedFalseOrderByQuestionOrderAsc(Long quizId, Pageable pageable);
    List<Question> findByQuizIdAndDeletedFalseOrderByQuestionOrderAsc(Long quizId);
    long countByQuizIdAndDeletedFalse(Long quizId);
}
