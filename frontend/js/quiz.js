// Quiz taking page logic

let attemptData = null;
let currentQuestion = null;
let timerInterval = null;
let timeRemaining = 0;
let selectedOptions = []; // Array for multiple selections

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkAuth())) return;

    // Get attempt data from sessionStorage
    const stored = sessionStorage.getItem('currentAttempt');
    if (!stored) {
        window.location.href = 'dashboard.html';
        return;
    }

    attemptData = JSON.parse(stored);
    document.getElementById('quizTitle').textContent = attemptData.quizTitle;
    updateProgress();
    updateScore();

    loadQuestion(attemptData.currentPage);
});

async function loadQuestion(page) {
    try {
        const result = await getQuestions(attemptData.quizId, page, 1);
        const pageData = result.data;

        if (!pageData.content || pageData.content.length === 0) {
            // No more questions - complete the quiz
            await completeQuiz();
            return;
        }

        currentQuestion = pageData.content[0];
        attemptData.currentPage = page;
        sessionStorage.setItem('currentAttempt', JSON.stringify(attemptData));

        displayQuestion(currentQuestion);
        startTimer(attemptData.timePerQuestion);
        updateProgress();
    } catch (error) {
        showError(error.message);
    }
}

function displayQuestion(question) {
    document.getElementById('questionText').textContent = question.questionText;
    const optionsList = document.getElementById('optionsList');
    optionsList.innerHTML = '';
    selectedOptions = []; // Stores option IDs
    document.getElementById('submitBtn').disabled = true;

    question.options.forEach((option, index) => {
        const optionKey = String.fromCharCode(65 + index); // A, B, C...
        const btn = document.createElement('button');
        btn.className = 'list-group-item list-group-item-action option-btn';
        btn.dataset.optionId = option.id;
        btn.dataset.optionKey = optionKey;
        btn.innerHTML = `<strong>${optionKey}.</strong> ${option.optionText}`;
        btn.onclick = () => toggleOption(option.id, btn);
        optionsList.appendChild(btn);
    });
}

function toggleOption(optionId, btnElement) {
    // Toggle selection using option ID
    if (selectedOptions.includes(optionId)) {
        selectedOptions = selectedOptions.filter(id => id !== optionId);
        btnElement.classList.remove('selected');
    } else {
        selectedOptions.push(optionId);
        btnElement.classList.add('selected');
    }

    // Enable submit if any option selected
    document.getElementById('submitBtn').disabled = selectedOptions.length === 0;
}

function startTimer(seconds) {
    timeRemaining = seconds;
    updateTimerDisplay();
    
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            // Auto-submit when time expires
            autoSubmit();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const timerEl = document.getElementById('timerDisplay');
    timerEl.textContent = timeRemaining;
    
    timerEl.classList.remove('warning', 'danger');
    if (timeRemaining <= 5) {
        timerEl.classList.add('danger');
    } else if (timeRemaining <= 10) {
        timerEl.classList.add('warning');
    }
}

function updateProgress() {
    const current = (attemptData.currentPage || 0) + 1;
    document.getElementById('questionProgress').textContent = 
        `Question ${current} of ${attemptData.totalQuestions}`;
}

function updateScore() {
    document.getElementById('scoreDisplay').textContent = `Score: ${attemptData.score || 0}`;
}

// Submit button click
document.getElementById('submitBtn').addEventListener('click', () => {
    if (selectedOptions.length > 0) {
        submitCurrentAnswer();
    }
});

async function submitCurrentAnswer() {
    if (selectedOptions.length === 0 || !currentQuestion) return;

    clearInterval(timerInterval);
    document.getElementById('submitBtn').disabled = true;

    try {
        const result = await submitAnswer(attemptData.attemptId, currentQuestion.id, selectedOptions, false);

        if (result.data.isCorrect) {
            attemptData.score = (attemptData.score || 0) + 1;
            sessionStorage.setItem('currentAttempt', JSON.stringify(attemptData));
            updateScore();
        }

        // Show correct/incorrect feedback
        showFeedback(result.data.isCorrect);

        // Load next question after delay
        setTimeout(() => {
            loadQuestion(attemptData.currentPage + 1);
        }, 1000);
    } catch (error) {
        showError(error.message);
        // If time expired, move to next question
        if (error.message === 'TIME_EXPIRED') {
            setTimeout(() => {
                loadQuestion(attemptData.currentPage + 1);
            }, 1000);
        }
    }
}

async function autoSubmit() {
    // Clear timer first
    clearInterval(timerInterval);

    // Submit with timedOut flag - either with selected options or empty
    document.getElementById('submitBtn').disabled = true;

    try {
        await submitAnswer(attemptData.attemptId, currentQuestion.id, selectedOptions, true);
    } catch (error) {
        // Ignore error, continue to next question
    }

    // Show feedback (will show timed out)
    showFeedback(false, true);

    // Move to next question after delay
    setTimeout(() => {
        loadQuestion(attemptData.currentPage + 1);
    }, 1500);
}

function showFeedback(isCorrect, timedOut = false) {
    const optionsList = document.getElementById('optionsList');
    const allBtns = optionsList.querySelectorAll('.option-btn');

    const correctOptionIds = currentQuestion.correctOptionIds || [];

    allBtns.forEach((btn) => {
        btn.style.pointerEvents = 'none';
        const optionId = parseInt(btn.dataset.optionId);

        if (btn.classList.contains('selected')) {
            btn.classList.add(isCorrect ? 'correct' : 'incorrect');
        }

        // Highlight all correct options
        if (correctOptionIds.includes(optionId)) {
            btn.classList.add('correct');
            btn.innerHTML += ' <span class="badge bg-success ms-1">Correct</span>';
        }

        // Show timed out style
        if (timedOut && !btn.classList.contains('selected')) {
            btn.classList.add('timeout');
        }
    });
}

async function completeQuiz() {
    clearInterval(timerInterval);
    
    try {
        const result = await completeAttempt(attemptData.attemptId);
        const { totalScore, totalQuestions } = result.data;
        
        // Store result info for result page
        sessionStorage.setItem('lastAttemptId', attemptData.attemptId);
        sessionStorage.removeItem('currentAttempt');
        
        // Show completion screen
        document.getElementById('questionCard').classList.add('d-none');
        document.getElementById('timerSection').classList.add('d-none');
        document.getElementById('quizInfo').classList.add('d-none');
        document.getElementById('completeSection').classList.remove('d-none');
        
        document.getElementById('finalScore').textContent = `${totalScore}/${totalQuestions}`;
        const percentage = totalQuestions > 0 ? Math.round((totalScore / totalQuestions) * 100) : 0;
        document.getElementById('finalPercentage').textContent = `${percentage}%`;
        document.getElementById('viewResultBtn').href = `result.html?attemptId=${attemptData.attemptId}`;
    } catch (error) {
        showError(error.message);
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 3000);
}
