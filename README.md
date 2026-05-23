# Smart Quiz Application

A full-stack quiz platform with AI-powered quiz generation, real-time scoring, role-based access control, and a responsive web interface.

**[📹 Watch Demo Video](https://drive.google.com/file/d/13zGS0vhhWeAd7nV8E3zgLbFkuSMhm4Ct/view)**

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [Database Setup](#database-setup)
  - [AI Configuration](#ai-configuration)
- [API Endpoints](#api-endpoints)
- [Screenshots / Pages](#screenshots--pages)
- [Architecture](#architecture)
- [License](#license)

---

## Overview

Smart Quiz is a modern quiz application built with **Spring Boot** (backend) and **vanilla HTML/CSS/JS** (frontend). It supports both manual and AI-generated quiz creation, timed quiz attempts, detailed result analytics, and a clean Bootstrap-based responsive UI.

---

## Features

### Authentication & Authorization
- JWT-based stateless authentication
- Role-based access control (`ADMIN`, `USER`)
- Secure password hashing with BCrypt

### Quiz Management (Admin)
- Create, update, delete quizzes
- Add/edit/delete questions with multiple-choice options
- Support for **multiple correct answers** per question
- Publish or save quizzes as drafts
- **AI-powered quiz generation** via DeepSeek API — generate full quizzes from a topic prompt

### Quiz Taking (User)
- Browse and take published quizzes
- **Per-question timer** with visual countdown
- Immediate score tracking during the quiz
- Auto-submit when time expires
- Detailed result review with correct/incorrect/missed answer indicators

### History & Analytics
- View all past quiz attempts with scores and timestamps
- Pagination for large attempt histories
- Detailed per-question answer breakdown

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| **Spring Boot 4.0.6** | Application framework |
| **Java 26** | Programming language |
| **Spring Data JPA** | ORM / database access |
| **Spring Security** | Authentication & authorization |
| **JWT (jjwt 0.12.6)** | Token-based authentication |
| **MariaDB** | Relational database |
| **Spring AI (OpenAI starter 2.0.0-M6)** | AI quiz generation (DeepSeek) |
| **Lombok** | Boilerplate reduction |
| **Maven** | Build tool |

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML5 / CSS3 / JavaScript** | Core frontend stack |
| **Bootstrap 5.3.3** | UI framework |
| **Vite 6.x** | Dev server & build tool |

---

## Project Structure

```
smart_quiz_app/
├── backend/
│   └── smart_quiz/
│       ├── pom.xml
│       └── src/main/java/com/techtechnicworld/smart_quiz/
│           ├── SmartQuizApplication.java
│           ├── config/
│           │   ├── SecurityConfig.java
│           │   ├── JwtAuthFilter.java
│           │   └── JwtUtil.java
│           ├── controller/
│           │   ├── AuthController.java
│           │   ├── QuizController.java
│           │   ├── AdminQuizController.java
│           │   ├── AttemptController.java
│           │   └── ResultController.java
│           ├── dto/                    # Request/Response DTOs
│           ├── entities/               # JPA Entities
│           │   ├── User.java
│           │   ├── Quiz.java
│           │   ├── Question.java
│           │   ├── QuestionOption.java
│           │   ├── QuizAttempt.java
│           │   └── UserAnswer.java
│           ├── enums/                # Role, QuizStatus, AttemptStatus
│           ├── exceptions/             # Custom exceptions & global handler
│           ├── repository/             # Spring Data JPA Repositories
│           └── services/               # Business logic
│               ├── AuthService.java
│               ├── QuizService.java
│               ├── AiQuizService.java
│               ├── QuizAttemptService.java
│               ├── ResultService.java
│               └── CustomUserDetailsService.java
│       └── src/main/resources/
│           ├── application.properties
│           └── static/ & templates/
│
└── frontend/
    ├── index.html              # Login page
    ├── signup.html             # Registration page
    ├── dashboard.html          # Quiz listing & admin panel
    ├── quiz.html               # Quiz taking interface
    ├── result.html             # Detailed result review
    ├── history.html            # Attempt history
    ├── quiz-edit.html          # Quiz editing page
    ├── package.json
    ├── vite.config.js
    ├── css/
    │   └── style.css
    └── js/
        ├── api.js              # API client / fetch helpers
        ├── auth.js             # Auth logic (login/signup)
        ├── dashboard.js        # Dashboard & admin quiz management
        ├── quiz.js             # Quiz taking & timer
        ├── result.js           # Result display
        ├── history.js          # Attempt history
        └── quiz-edit.js        # Quiz editing
```

---

## Getting Started

### Prerequisites

- **Java 26** (or compatible JDK)
- **Maven 3.9+**
- **Node.js 18+** and **npm**
- **MariaDB** (running on port 3307 or update config)
- **DeepSeek API key** (for AI quiz generation)

### Database Setup

1. Start MariaDB and create the database:
   ```sql
   CREATE DATABASE smart_quiz;
   ```

2. Update `backend/smart_quiz/src/main/resources/application.properties` with your credentials if different:
   ```properties
   spring.datasource.url=jdbc:mariadb://127.0.0.1:3307/smart_quiz
   spring.datasource.username=root
   spring.datasource.password=root
   ```

### AI Configuration

Set your DeepSeek API key as an environment variable:

```bash
export DEEPSEEK_API_KEY="your-deepseek-api-key"
```

Or update the placeholder in `application.properties`:
```properties
spring.ai.openai.api-key=${DEEPSEEK_API_KEY:your-key-here}
```

### Backend Setup

```bash
cd backend/smart_quiz
./mvnw spring-boot:run
```

The backend will start on **http://localhost:8085**.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend dev server will start on **http://localhost:5173** with a proxy to the backend.

---

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/signup` | Public | User registration |
| POST | `/api/auth/login` | Public | User login (returns JWT) |
| GET | `/api/auth/me` | Authenticated | Get current user |

### Quizzes (`/api/quizzes`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/quizzes` | Authenticated | List published quizzes |
| GET | `/api/quizzes/all` | Authenticated | List all quizzes (admin view) |
| GET | `/api/quizzes/{id}` | Authenticated | Get quiz by ID |
| GET | `/api/quizzes/{id}/questions` | Authenticated | Paginated questions |
| GET | `/api/quizzes/{id}/questions/all` | Authenticated | All questions |

### Admin (`/api/admin`) — Requires `ADMIN` role
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/quizzes` | Create quiz |
| PUT | `/api/admin/quizzes/{id}` | Update quiz |
| DELETE | `/api/admin/quizzes/{id}` | Delete quiz |
| POST | `/api/admin/quizzes/{id}/questions` | Add question |
| PUT | `/api/admin/questions/{id}` | Update question |
| DELETE | `/api/admin/questions/{id}` | Delete question |
| POST | `/api/admin/quizzes/ai-generate` | Generate quiz with AI |

### Attempts (`/api/attempts`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/attempts/start` | Authenticated | Start a quiz attempt |
| POST | `/api/attempts/{id}/submit` | Authenticated | Submit an answer |
| POST | `/api/attempts/{id}/finish` | Authenticated | Finish the attempt |

### Results (`/api/results`)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/results` | Authenticated | List my results |
| GET | `/api/results/{attemptId}` | Authenticated | Detailed result |

---

## Screenshots / Pages

| Page | Description |
|------|-------------|
| **Login** (`index.html`) | User authentication with email/password |
| **Signup** (`signup.html`) | New user registration |
| **Dashboard** (`dashboard.html`) | Browse quizzes, admin panel, create/edit quizzes, AI generation |
| **Quiz** (`quiz.html`) | Interactive quiz taking with timer and live scoring |
| **Result** (`result.html`) | Score summary and per-question answer review |
| **History** (`history.html`) | Paginated list of all past attempts |

---

## Architecture

- **Stateless JWT Authentication**: Each request carries a Bearer token. The `JwtAuthFilter` validates it before reaching controllers.
- **Role-Based Authorization**: Spring Security intercepts requests — `/api/admin/**` requires `ADMIN` role; `/api/quizzes/**` and `/api/attempts/**` require any authenticated user.
- **AI Integration**: `AiQuizService` uses Spring AI's `ChatClient` to call DeepSeek's API. It sends a structured prompt and parses JSON into quiz questions with mapped correct answers.
- **CORS**: Configured to allow `localhost:5173` and `localhost:3000` for frontend development.
- **DTO Pattern**: All API inputs/outputs use validated DTOs to decouple entities from the wire format.

---

## License

This project is open-source and available under the [MIT License](LICENSE).

---

**[📹 Watch Demo Video](https://drive.google.com/file/d/13zGS0vhhWeAd7nV8E3zgLbFkuSMhm4Ct/view)**
