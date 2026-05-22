package com.techtechnicworld.smart_quiz.repository;

import com.techtechnicworld.smart_quiz.entities.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
}
