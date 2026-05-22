// Quiz Edit page logic

let currentQuizId = null;
let currentQuiz = null;

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkAuth())) return;

    // Get quiz ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const quizId = urlParams.get('id');

    if (!quizId) {
        showError('No quiz ID provided');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }

    if (getUserRole() !== 'ADMIN') {
        showError('Access denied');
        setTimeout(() => window.location.href = 'dashboard.html', 2000);
        return;
    }

    currentQuizId = parseInt(quizId);
    loadQuizDetails();

    // Edit Quiz Form
    document.getElementById('editQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('editQuizTitle').value,
            description: document.getElementById('editQuizDescription').value,
            timePerQuestion: parseInt(document.getElementById('editQuizTime').value),
            status: document.getElementById('editQuizStatus').value,
        };

        try {
            await updateQuiz(currentQuizId, data);
            bootstrap.Modal.getInstance(document.getElementById('editQuizModal')).hide();
            loadQuizDetails();
            showSuccess('Quiz updated successfully!');
        } catch (error) {
            showError(error.message);
        }
    });

    // Add/Edit Question Form
    document.getElementById('questionForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get selected correct options (by letter)
        const correctCheckboxes = document.querySelectorAll('.correct-option:checked');
        const selectedLetters = Array.from(correctCheckboxes).map(cb => cb.value);

        if (selectedLetters.length === 0) {
            showError('Please select at least one correct answer');
            return;
        }

        const editQuestionId = document.getElementById('editQuestionId').value;

        // Build options with IDs
        const optionItems = document.querySelectorAll('.option-item');
        const options = [];

        optionItems.forEach((item) => {
            const idInput = item.querySelector('.option-id');
            const textInput = item.querySelector('.option-text');

            if (textInput.value.trim()) {
                options.push({
                    id: idInput.value ? parseInt(idInput.value) : null,
                    optionText: textInput.value,
                });
            }
        });

        if (options.length < 2) {
            showError('Please add at least 2 options');
            return;
        }

        // Map selected letters to option IDs
        const correctOptionIds = selectedLetters.map(letter => {
            const index = letter.charCodeAt(0) - 65;
            const opt = options[index];
            return opt ? opt.id : null;
        }).filter(id => id !== null);

        // Build options data for backend
        const optionsData = options.map(opt => ({
            id: opt.id || null,
            optionText: opt.optionText,
        }));

        const data = {
            questionText: document.getElementById('questionText').value,
            questionOrder: parseInt(document.getElementById('questionOrder').value),
            correctOptionIds: correctOptionIds,
            options: optionsData,
        };

        try {
            if (editQuestionId) {
                await updateQuestion(parseInt(editQuestionId), data);
                showSuccess('Question updated successfully!');
            } else {
                await addQuestion(currentQuizId, data);
                showSuccess('Question added successfully!');
            }
            bootstrap.Modal.getInstance(document.getElementById('questionModal')).hide();
            document.getElementById('questionForm').reset();
            // Reset checkboxes
            document.querySelectorAll('.correct-option').forEach(cb => cb.checked = false);
            loadQuizDetails();
        } catch (error) {
            showError(error.message);
        }
    });
});

async function loadQuizDetails() {
    try {
        const result = await getQuizWithQuestions(currentQuizId);
        currentQuiz = result.quiz;
        const questions = result.questions;

        // Update quiz info
        document.getElementById('quizTitle').textContent = currentQuiz.title;
        document.getElementById('quizDescription').textContent = currentQuiz.description || 'No description';
        document.getElementById('quizTime').textContent = `${currentQuiz.timePerQuestion} seconds`;
        document.getElementById('quizQuestions').textContent = currentQuiz.totalQuestions;
        document.getElementById('quizCreatedBy').textContent = currentQuiz.createdBy;

        // Update status badge and publish button
        const statusBadge = document.getElementById('quizStatusBadge');
        const publishBtn = document.getElementById('publishBtn');

        if (currentQuiz.status === 'PUBLISHED') {
            statusBadge.textContent = 'Published';
            statusBadge.className = 'status-badge published';
            publishBtn.textContent = 'Unpublish';
            publishBtn.className = 'btn btn-warning';
        } else {
            statusBadge.textContent = 'Draft';
            statusBadge.className = 'status-badge draft';
            publishBtn.textContent = 'Publish';
            publishBtn.className = 'btn btn-success';
        }

        // Populate edit form
        document.getElementById('editQuizId').value = currentQuiz.id;
        document.getElementById('editQuizTitle').value = currentQuiz.title;
        document.getElementById('editQuizDescription').value = currentQuiz.description || '';
        document.getElementById('editQuizTime').value = currentQuiz.timePerQuestion;
        document.getElementById('editQuizStatus').value = currentQuiz.status;

        // Render questions
        renderQuestions(questions);
    } catch (error) {
        showError(error.message);
        setTimeout(() => window.location.href = 'dashboard.html', 3000);
    }
}

function renderQuestions(questions) {
    const questionsList = document.getElementById('questionsList');
    const noQuestionsMsg = document.getElementById('noQuestionsMsg');

    if (!questions || questions.length === 0) {
        questionsList.classList.add('d-none');
        noQuestionsMsg.classList.remove('d-none');
        return;
    }

    questionsList.classList.remove('d-none');
    noQuestionsMsg.classList.add('d-none');

    questionsList.innerHTML = questions.map((q, index) => {
        const correctOptionIds = q.correctOptionIds || [];
        const optionsHtml = q.options.map((o, idx) => {
            const optionKey = String.fromCharCode(65 + idx); // A, B, C...
            const isCorrect = correctOptionIds.includes(o.id);
            return `
            <div class="d-flex align-items-center mb-1">
                <span class="badge ${isCorrect ? 'bg-success' : 'bg-secondary'} me-2">${optionKey}</span>
                <span class="${isCorrect ? 'text-success fw-bold' : ''}">${o.optionText}</span>
            </div>
        `}).join('');

        return `
            <div class="question-card">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="d-flex align-items-start gap-3">
                        <span class="question-number">${index + 1}</span>
                        <div>
                            <p class="mb-2 fw-medium">${q.questionText}</p>
                            <div class="small">${optionsHtml}</div>
                        </div>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-warning btn-sm" onclick="openEditQuestion(${q.id})">Edit</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteQuestion(${q.id})">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function togglePublish() {
    if (!currentQuiz) return;

    const newStatus = currentQuiz.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';

    try {
        await updateQuiz(currentQuizId, {
            title: currentQuiz.title,
            description: currentQuiz.description,
            timePerQuestion: currentQuiz.timePerQuestion,
            status: newStatus,
        });
        showSuccess(newStatus === 'PUBLISHED' ? 'Quiz published!' : 'Quiz unpublished!');
        loadQuizDetails();
    } catch (error) {
        showError(error.message);
    }
}

function openAddQuestion() {
    document.getElementById('questionModalTitle').textContent = 'Add Question';
    document.getElementById('questionSubmitBtn').textContent = 'Add Question';
    document.getElementById('questionQuizId').value = currentQuizId;
    document.getElementById('editQuestionId').value = '';
    document.getElementById('questionForm').reset();
    document.getElementById('questionOrder').value = (currentQuiz?.totalQuestions || 0) + 1;

    // Reset to 2 options
    const optionsContainer = document.getElementById('optionsContainer');
    optionsContainer.innerHTML = `
        <div class="option-item d-flex align-items-center gap-2 mb-2">
            <span class="option-letter fw-bold text-primary" style="width: 24px;">A</span>
            <input type="hidden" class="option-id" value="">
            <input type="text" class="form-control option-text" placeholder="Option A text" required>
            <button type="button" class="btn btn-sm btn-outline-danger delete-btn" onclick="removeOption(this)" title="Remove">✕</button>
        </div>
        <div class="option-item d-flex align-items-center gap-2 mb-2">
            <span class="option-letter fw-bold text-primary" style="width: 24px;">B</span>
            <input type="hidden" class="option-id" value="">
            <input type="text" class="form-control option-text" placeholder="Option B text" required>
            <button type="button" class="btn btn-sm btn-outline-danger delete-btn" onclick="removeOption(this)" title="Remove">✕</button>
        </div>
    `;
    initCorrectOptions(2);
    updateDeleteButtons();
    new bootstrap.Modal(document.getElementById('questionModal')).show();
}

function initCorrectOptions(count) {
    const container = document.getElementById('correctOptionsContainer');
    container.innerHTML = '';
    const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    for (let i = 0; i < count; i++) {
        const label = optionLabels[i];
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'form-check';
        checkboxDiv.innerHTML = `
            <input class="form-check-input correct-option" type="checkbox" value="${label}" id="correct${label}">
            <label class="form-check-label" for="correct${label}">${label}</label>
        `;
        container.appendChild(checkboxDiv);
    }
}

async function openEditQuestion(questionId) {
    try {
        const result = await getAllQuestions(currentQuizId);
        const questions = result.data;
        const question = questions.find(q => q.id === questionId);

        if (!question) return;

        document.getElementById('questionModalTitle').textContent = 'Edit Question';
        document.getElementById('questionSubmitBtn').textContent = 'Update Question';
        document.getElementById('questionQuizId').value = currentQuizId;
        document.getElementById('editQuestionId').value = question.id;
        document.getElementById('questionText').value = question.questionText;
        document.getElementById('questionOrder').value = question.questionOrder;

        // Build correct option keys from correctOptionIds (generate from index)
        const correctOptionKeys = question.options
            .filter(opt => question.correctOptionIds && question.correctOptionIds.includes(opt.id))
            .map((opt, idx) => String.fromCharCode(65 + idx)); // A, B, C...

        // Set correct options checkboxes
        document.querySelectorAll('.correct-option').forEach(cb => {
            cb.checked = correctOptionKeys && correctOptionKeys.includes(cb.value);
        });

        // Build options HTML with correct structure
        const optionsContainer = document.getElementById('optionsContainer');
        optionsContainer.innerHTML = question.options.map((opt, index) => {
            const letter = String.fromCharCode(65 + index);
            return `
            <div class="option-item d-flex align-items-center gap-2 mb-2">
                <span class="option-letter fw-bold text-primary" style="width: 24px;">${letter}</span>
                <input type="hidden" class="option-id" value="${opt.id || ''}">
                <input type="text" class="form-control option-text" placeholder="Option ${letter} text" value="${opt.optionText || ''}" required>
                <button type="button" class="btn btn-sm btn-outline-danger delete-btn ${question.options.length <= 2 ? '' : 'visible'}" onclick="removeOption(this)" title="Remove">✕</button>
            </div>
        `}).join('');

        // Initialize correct options checkboxes for the right number
        initCorrectOptions(question.options.length);

        // Re-check the correct options after init
        document.querySelectorAll('.correct-option').forEach(cb => {
            cb.checked = correctOptionKeys && correctOptionKeys.includes(cb.value);
        });

        updateDeleteButtons();
        new bootstrap.Modal(document.getElementById('questionModal')).show();
    } catch (error) {
        showError(error.message);
    }
}

async function confirmDeleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            await deleteQuestion(questionId);
            loadQuizDetails();
            showSuccess('Question deleted successfully!');
        } catch (error) {
            showError(error.message);
        }
    }
}

async function confirmDeleteQuiz() {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        try {
            await deleteQuiz(currentQuizId);
            window.location.href = 'dashboard.html';
        } catch (error) {
            showError(error.message);
        }
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 5000);
}

function showSuccess(message) {
    const alert = document.getElementById('successAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 3000);
}

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function addOption() {
    const container = document.getElementById('optionsContainer');
    const currentCount = container.querySelectorAll('.option-row').length;
    if (currentCount >= 10) {
        showError('Maximum 10 options allowed');
        return;
    }

    const label = optionLabels[currentCount];
    const div = document.createElement('div');
    div.className = 'row mb-2 option-row';
    div.innerHTML = `
        <div class="col-2">
            <input type="text" class="form-control option-key" value="${label}" readonly>
        </div>
        <div class="col-10">
            <input type="text" class="form-control option-text" placeholder="Option ${label} text" required>
        </div>
    `;
    container.appendChild(div);

    // Add checkbox for this option
    const checkboxContainer = document.getElementById('correctOptionsContainer');
    const checkboxDiv = document.createElement('div');
    checkboxDiv.className = 'form-check';
    checkboxDiv.innerHTML = `
        <input class="form-check-input correct-option" type="checkbox" value="${label}" id="correct${label}">
        <label class="form-check-label" for="correct${label}">${label}</label>
    `;
    checkboxContainer.appendChild(checkboxDiv);

    updateDeleteButtons();
}

function removeOption(btn) {
    const container = document.getElementById('optionsContainer');
    const items = container.querySelectorAll('.option-item');
    if (items.length <= 2) {
        showError('Minimum 2 options required');
        return;
    }
    btn.closest('.option-item').remove();

    // Update letters and remove last checkbox
    updateOptionLetters();
    const checkboxContainer = document.getElementById('correctOptionsContainer');
    const checkboxes = checkboxContainer.querySelectorAll('.form-check');
    if (checkboxes.length > 0) {
        checkboxes[checkboxes.length - 1].remove();
    }

    updateDeleteButtons();
}

function updateOptionLetters() {
    const items = document.querySelectorAll('.option-item');
    items.forEach((item, index) => {
        const letter = optionLabels[index];
        item.querySelector('.option-letter').textContent = letter;
    });
}

function updateDeleteButtons() {
    const items = document.querySelectorAll('.option-item');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.style.display = items.length <= 2 ? 'none' : 'inline-block';
    });
}