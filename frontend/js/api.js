// API Configuration
// Use a runtime override if configured, fallback to the Vite dev proxy.
const API_BASE = window.API_BASE_URL || '';

// Helper to get auth headers
function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
    };
}

// Helper to handle API responses
async function handleResponse(response) {
    // Auto logout on 401/403
    if (response.status === 401 || response.status === 403) {
        logout();
        return;
    }
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
}

// Generic API request
async function apiRequest(endpoint, options = {}) {
    const config = {
        headers: getAuthHeaders(),
        ...options,
    };

    const response = await fetch(`${API_BASE}/api${endpoint}`, config);
    return handleResponse(response);
}

// Auth APIs
async function login(email, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
}

async function signup(name, email, password) {
    const response = await fetch(`${API_BASE}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(response);
}

// Quiz APIs
async function getQuizzes() {
    return apiRequest('/quizzes');
}

async function getAllQuizzes() {
    return apiRequest('/quizzes/all');
}

async function getQuizzesByStatus(status) {
    return apiRequest(`/quizzes?status=${status}`);
}

async function getQuizWithQuestions(quizId) {
    const quiz = await getQuizById(quizId);
    const questions = await getAllQuestions(quizId);
    return { quiz: quiz.data, questions: questions.data };
}

async function getQuizById(id) {
    return apiRequest(`/quizzes/${id}`);
}

async function getQuestions(quizId, page = 0, size = 1) {
    return apiRequest(`/quizzes/${quizId}/questions?page=${page}&size=${size}`);
}

async function getAllQuestions(quizId) {
    return apiRequest(`/quizzes/${quizId}/questions/all`);
}

// Admin APIs
async function createQuiz(data) {
    return apiRequest('/admin/quizzes', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function updateQuiz(id, data) {
    return apiRequest(`/admin/quizzes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function addQuestion(quizId, data) {
    return apiRequest(`/admin/quizzes/${quizId}/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

async function updateQuestion(questionId, data) {
    return apiRequest(`/admin/questions/${questionId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

async function deleteQuestion(questionId) {
    return apiRequest(`/admin/questions/${questionId}`, {
        method: 'DELETE',
    });
}

async function deleteQuiz(id) {
    return apiRequest(`/admin/quizzes/${id}`, {
        method: 'DELETE',
    });
}

async function generateQuizWithAi(data) {
    return apiRequest('/admin/quizzes/ai-generate', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

// Attempt APIs
async function startAttempt(quizId) {
    return apiRequest('/attempts/start', {
        method: 'POST',
        body: JSON.stringify({ quizId }),
    });
}

async function submitAnswer(attemptId, questionId, selectedOptionIds, timedOut = false) {
    return apiRequest(`/attempts/${attemptId}/submit`, {
        method: 'POST',
        body: JSON.stringify({ questionId, selectedOptionIds, timedOut }),
    });
}

async function completeAttempt(attemptId) {
    return apiRequest(`/attempts/${attemptId}/complete`, {
        method: 'POST',
    });
}

// Result APIs
async function getResult(attemptId) {
    return apiRequest(`/results/${attemptId}`);
}

async function getMyAttempts(page = 0, size = 10) {
    return apiRequest(`/results/my?page=${page}&size=${size}`);
}

// Current user data (in memory, not localStorage)
let currentUser = null;

// Auth helpers
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

async function getCurrentUser() {
    if (currentUser) return currentUser;
    return apiRequest('/auth/me').then(res => {
        currentUser = res.data;
        return currentUser;
    });
}

function getUserRole() {
    return currentUser?.role || null;
}

function getUserName() {
    return currentUser?.name || null;
}

function getUserEmail() {
    return currentUser?.email || null;
}

function logout() {
    localStorage.removeItem('token');
    currentUser = null;
    window.location.href = 'index.html';
}

// Check auth on page load
async function checkAuth() {
    if (!isLoggedIn()) {
        window.location.href = 'index.html';
        return false;
    }
    try {
        await getCurrentUser();
    } catch (e) {
        logout();
        return false;
    }
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = `Welcome, ${getUserName()}`;
    }
    return true;
}
