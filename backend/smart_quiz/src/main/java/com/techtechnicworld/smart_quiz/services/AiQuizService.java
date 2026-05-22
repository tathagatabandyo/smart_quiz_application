package com.techtechnicworld.smart_quiz.services;

import com.techtechnicworld.smart_quiz.dto.AiQuizRequestDto;
import com.techtechnicworld.smart_quiz.dto.QuizResponseDto;
import com.techtechnicworld.smart_quiz.entities.Question;
import com.techtechnicworld.smart_quiz.entities.QuestionOption;
import com.techtechnicworld.smart_quiz.entities.Quiz;
import com.techtechnicworld.smart_quiz.entities.User;
import com.techtechnicworld.smart_quiz.enums.QuizStatus;
import com.techtechnicworld.smart_quiz.repository.QuestionRepository;
import com.techtechnicworld.smart_quiz.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiQuizService {

    private final QuizRepository quizRepository;
    private final QuestionRepository questionRepository;
    private final ChatClient.Builder chatClientBuilder;

    @Transactional
    public QuizResponseDto generateQuiz(AiQuizRequestDto request, User admin) {
        String userPrompt = String.format("""
                Generate a quiz with exactly %d multiple-choice questions on the topic: "%s".

                For each question provide:
                1. Clear question text
                2. Exactly 4 options labeled A, B, C, D (can have 1 or more correct answers)
                3. Use "correctOptionKeys" as an array of option keys that are correct (e.g., ["A"] or ["A", "C"])

                Return ONLY valid JSON array with no markdown or explanation.

                Example format:
                [
                  {
                    "questionText": "What is Java?",
                    "questionOrder": 1,
                    "correctOptionKeys": ["A"],
                    "options": [
                      { "optionKey": "A", "optionText": "Programming Language" },
                      { "optionKey": "B", "optionText": "Database" },
                      { "optionKey": "C", "optionText": "Browser" },
                      { "optionKey": "D", "optionText": "OS" }
                    ]
                  },
                  {
                    "questionText": "Which are OOP concepts?",
                    "questionOrder": 2,
                    "correctOptionKeys": ["A", "B", "C"],
                    "options": [
                      { "optionKey": "A", "optionText": "Encapsulation" },
                      { "optionKey": "B", "optionText": "Inheritance" },
                      { "optionKey": "C", "optionText": "Polymorphism" },
                      { "optionKey": "D", "optionText": "Compilation" }
                    ]
                  }
                ]

                Generate %d questions.
                """,
                request.getNumberOfQuestions(), request.getPrompt(),
                request.getNumberOfQuestions());

        String systemPrompt = "You are a quiz generator. Always respond with valid JSON only, no markdown, no code blocks, no explanation.";

        try {
            ChatClient chatClient = chatClientBuilder.build();
            List<QuestionData> questions = chatClient.prompt()
                    .system(systemPrompt)
                    .user(userPrompt)
                    .call()
                    .entity(new ParameterizedTypeReference<List<QuestionData>>() {});

            log.debug("AI response received: {} questions", questions.size());

            Quiz quiz = new Quiz();
            quiz.setTitle(request.getTitle());
            quiz.setDescription(request.getDescription() != null
                    ? request.getDescription()
                    : "AI Generated - " + request.getPrompt());
            quiz.setTimePerQuestion(request.getTimePerQuestion());
            quiz.setStatus(QuizStatus.DRAFT);
            quiz.setCreatedBy(admin);
            quiz.setCreatedAt(LocalDateTime.now(ZoneOffset.UTC));
            quiz.setUpdatedAt(LocalDateTime.now(ZoneOffset.UTC));
            quiz.setQuestions(new ArrayList<>());

            quiz = quizRepository.save(quiz);

            // Build all questions with their options (generate uniqueInsertId for each option)
            List<Question> questionEntities = new ArrayList<>();
            for (QuestionData qd : questions) {
                Question question = new Question();
                question.setQuestionText(qd.questionText());
                question.setQuestionOrder(qd.questionOrder());
                question.setQuiz(quiz);
                question.setOptions(new ArrayList<>());

                // Map optionKey (A, B, C) -> uniqueInsertId
                Map<String, String> keyToUniqueId = new java.util.HashMap<>();

                for (OptionData opt : qd.options()) {
                    String uniqueId = UUID.randomUUID().toString();
                    keyToUniqueId.put(opt.optionKey(), uniqueId);

                    QuestionOption option = new QuestionOption();
                    option.setUniqueInsertId(uniqueId);
                    option.setOptionText(opt.optionText());
                    option.setQuestion(question);
                    question.getOptions().add(option);
                }
                questionEntities.add(question);
            }

            // Batch save all questions (options saved via cascade)
            questionRepository.saveAll(questionEntities);

            // Map correct option keys to option IDs using uniqueInsertId
            for (int i = 0; i < questionEntities.size(); i++) {
                Question question = questionEntities.get(i);
                QuestionData qd = questions.get(i);

                if (qd.correctOptionKeys() != null && !qd.correctOptionKeys().isEmpty()) {
                    // Build map of uniqueInsertId -> option ID
                    Map<String, Long> uniqueIdToOptionId = question.getOptions().stream()
                            .collect(java.util.stream.Collectors.toMap(
                                    QuestionOption::getUniqueInsertId,
                                    QuestionOption::getId,
                                    (a, b) -> a
                            ));

                    // Map optionKey -> uniqueInsertId for this question
                    Map<String, String> keyToUniqueId = new java.util.HashMap<>();
                    for (int j = 0; j < qd.options().size(); j++) {
                        OptionData opt = qd.options().get(j);
                        String uniqueId = question.getOptions().get(j).getUniqueInsertId();
                        keyToUniqueId.put(opt.optionKey(), uniqueId);
                    }

                    // Map correct option keys to option IDs using uniqueInsertId
                    List<Long> correctIds = qd.correctOptionKeys().stream()
                            .map(key -> {
                                String uniqueId = keyToUniqueId.get(key);
                                return uniqueId != null ? uniqueIdToOptionId.get(uniqueId) : null;
                            })
                            .filter(id -> id != null)
                            .toList();
                    question.setCorrectOptionIdsList(correctIds);
                }
            }
            questionRepository.saveAll(questionEntities);

            quiz = quizRepository.findById(quiz.getId()).orElse(quiz);

            return toQuizResponseDto(quiz);

        } catch (Exception e) {
            log.error("Failed to generate quiz with AI", e);
            throw new RuntimeException("Failed to generate quiz with AI: " + e.getMessage());
        }
    }

    private QuizResponseDto toQuizResponseDto(Quiz quiz) {
        return QuizResponseDto.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .timePerQuestion(quiz.getTimePerQuestion())
                .totalQuestions(quiz.getQuestions().size())
                .createdBy(quiz.getCreatedBy().getName())
                .status(quiz.getStatus().name())
                .createdAt(quiz.getCreatedAt())
                .build();
    }

    // Records for JSON mapping
    public record QuestionData(
            String questionText,
            int questionOrder,
            List<String> correctOptionKeys,
            List<OptionData> options
    ) {}

    public record OptionData(String optionKey, String optionText, String uniqueInsertId) {}
}