// Dashboard page logic

let currentQuizId = null;
let isAdminViewAll = false;
let manageQuizId = null;
let quizzes = [];

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkAuth())) return;

    // Show admin section if user is admin
    if (getUserRole() === 'ADMIN') {
        document.getElementById('adminSection').classList.remove('d-none');
    }

    loadQuizzes();

    // Create Quiz Form
    document.getElementById('createQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById('quizTitle').value,
            description: document.getElementById('quizDescription').value,
            timePerQuestion: parseInt(document.getElementById('quizTime').value),
            status: document.getElementById('quizStatus').value,
        };

        try {
            await createQuiz(data);
            bootstrap.Modal.getInstance(document.getElementById('createQuizModal')).hide();
            document.getElementById('createQuizForm').reset();
            loadQuizzes();
            showSuccess('Quiz created successfully!');
        } catch (error) {
            showError(error.message);
        }
    });

    // Edit Quiz Form
    document.getElementById('editQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('editQuizId').value;
        const data = {
            title: document.getElementById('editQuizTitle').value,
            description: document.getElementById('editQuizDescription').value,
            timePerQuestion: parseInt(document.getElementById('editQuizTime').value),
            status: document.getElementById('editQuizStatus').value,
        };

        try {
            await updateQuiz(id, data);
            bootstrap.Modal.getInstance(document.getElementById('editQuizModal')).hide();
            loadQuizzes();
            showSuccess('Quiz updated successfully!');
        } catch (error) {
            showError(error.message);
        }
    });

    // AI Quiz Generation Form
    document.getElementById('aiQuizForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            title: document.getElementById('aiQuizTitle').value,
            description: document.getElementById('aiQuizDescription').value,
            prompt: document.getElementById('aiPrompt').value,
            numberOfQuestions: parseInt(document.getElementById('aiNumQuestions').value),
            timePerQuestion: parseInt(document.getElementById('aiTimePerQuestion').value),
            model: document.getElementById('aiModel').value,
        };

        const btn = document.getElementById('aiGenerateBtn');
        const loading = document.getElementById('aiLoading');
        const errorAlert = document.getElementById('aiErrorAlert');

        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Generating...';
        loading.classList.remove('d-none');
        errorAlert.classList.add('d-none');

        try {
            const result = await generateQuizWithAi(data);
            bootstrap.Modal.getInstance(document.getElementById('aiQuizModal')).hide();
            document.getElementById('aiQuizForm').reset();
            loadQuizzes();
            showSuccess(`Quiz "${result.data.title}" generated successfully with ${result.data.totalQuestions} questions!`);
        } catch (error) {
            errorAlert.textContent = error.message;
            errorAlert.classList.remove('d-none');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '🤖 Generate Quiz';
            loading.classList.add('d-none');
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

        const quizId = document.getElementById('questionQuizId').value;
        const editQuestionId = document.getElementById('editQuestionId').value;

        // Build options with IDs (for new options, ID will be assigned after save)
        const optionItems = document.querySelectorAll('.option-item');
        const options = [];

        optionItems.forEach((item, index) => {
            const idInput = item.querySelector('.option-id');
            const textInput = item.querySelector('.option-text');
            const letter = optionLabels[index];

            if (textInput.value.trim()) {
                options.push({
                    id: idInput.value ? parseInt(idInput.value) : null,
                    optionKey: letter,
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
            const opt = options.find(o => o.optionKey === letter);
            return opt ? opt.id : null;
        }).filter(id => id !== null);

        if (correctOptionIds.length === 0 && editQuestionId === '') {
            // For new questions, use option order (backend will assign IDs after save)
            // For now, we'll use the index approach
            const newCorrectIds = selectedLetters.map(letter => {
                const idx = optionLabels.indexOf(letter);
                return -(idx + 1); // Negative index for new options
            });
            correctOptionIds.push(...newCorrectIds.filter(id => id < 0));
        }

        const data = {
            questionText: document.getElementById('questionText').value,
            questionOrder: parseInt(document.getElementById('questionOrder').value),
            correctOptionIds: correctOptionIds,
            options: options,
        };

        try {
            if (editQuestionId) {
                await updateQuestion(editQuestionId, data);
                showSuccess('Question updated successfully!');
            } else {
                await addQuestion(quizId, data);
                showSuccess('Question added successfully!');
            }
            bootstrap.Modal.getInstance(document.getElementById('questionModal')).hide();
            document.getElementById('questionForm').reset();
            document.querySelectorAll('.correct-option').forEach(cb => cb.checked = false);
            // Refresh the manage questions modal
            if (manageQuizId) {
                loadManageQuestions(manageQuizId);
            }
            loadQuizzes();
        } catch (error) {
            showError(error.message);
        }
    });
});

async function loadQuizzes() {
    try {
        let result;
        if (getUserRole() === 'ADMIN') {
            // Admin always sees all quizzes with the new status filter
            result = await getQuizzesByStatus('ALL');
            document.getElementById('pageTitle').textContent = 'All Quizzes (Admin View)';
        } else {
            result = await getQuizzes();
            document.getElementById('pageTitle').textContent = 'Available Quizzes';
        }

        quizzes = result.data;

        // For non-admin users, only show published quizzes (defensive filter)
        if (getUserRole() !== 'ADMIN') {
            quizzes = quizzes.filter(q => q.status === 'PUBLISHED');
        }

        const quizList = document.getElementById('quizList');
        quizList.innerHTML = '';

        if (quizzes.length === 0) {
            quizList.innerHTML = '<div class="col-12"><p class="text-center text-muted">No quizzes available yet.</p></div>';
            return;
        }

        quizzes.forEach(quiz => {
            const col = document.createElement('div');
            col.className = 'col-lg-6 col-xl-4 mb-4';

            const statusToggleLabel = quiz.status === 'PUBLISHED' ? 'Unpublish' : 'Publish';
            const canStart = quiz.status === 'PUBLISHED' || getUserRole() === 'ADMIN';

            const isAdmin = getUserRole() === 'ADMIN';

            col.innerHTML = `
                <div class="card quiz-card h-100">
                    <div class="card-header bg-gradient ${quiz.status === 'PUBLISHED' ? 'status-published' : 'status-draft'}">
                        <div class="d-flex justify-content-between align-items-center">
                            ${isAdmin ? `<span class="status-badge ${quiz.status === 'PUBLISHED' ? 'published' : 'draft'}">${quiz.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span>` : ''}
                            <span class="badge bg-white bg-opacity-25">${quiz.totalQuestions} Qs</span>
                        </div>
                    </div>
                    <div class="card-body">
                        <h5 class="card-title mb-2">${quiz.title}</h5>
                        <p class="card-text text-muted small">${quiz.description || 'No description'}</p>

                        <div class="d-flex gap-2 mb-3">
                            <span class="quiz-badge time">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                ${quiz.timePerQuestion}s/question
                            </span>
                            <span class="quiz-badge questions">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                ${quiz.totalQuestions} questions
                            </span>
                        </div>

                        <div class="d-flex align-items-center text-muted small mb-3">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                            ${quiz.createdBy}
                        </div>
                    </div>
                    <div class="card-footer bg-transparent border-0 pt-0">
                        ${isAdmin ? `
                        <div class="d-flex gap-2 mb-2">
                            <button class="btn btn-sm btn-outline-primary flex-grow-1" onclick="toggleQuizStatus(${quiz.id}, '${quiz.status}')" title="Toggle status">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                                ${statusToggleLabel}
                            </button>
                            <button class="btn btn-sm btn-outline-success flex-grow-1" onclick="manageQuiz(${quiz.id})" title="Manage Quiz">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                                Edit
                            </button>
                        </div>
                        <div class="d-flex gap-2">
                            ${canStart ? `
                                <button class="btn btn-primary btn-sm flex-grow-1" onclick="startQuiz(${quiz.id})">
                                    Start Quiz
                                </button>
                            ` : `
                                <button class="btn btn-secondary btn-sm flex-grow-1" disabled>
                                    Draft
                                </button>
                            `}
                            <button class="btn btn-sm btn-outline-danger" onclick="confirmDeleteQuiz(${quiz.id})" title="Delete">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                        ` : `
                        <button class="btn btn-primary w-100" onclick="startQuiz(${quiz.id})">
                            Start Quiz
                        </button>
                        `}
                    </div>
                </div>
            `;
            quizList.appendChild(col);
        });
    } catch (error) {
        showError(error.message);
    }
}

function manageQuiz(quizId) {
    window.location.href = `quiz-edit.html?id=${quizId}`;
}

async function toggleQuizStatus(quizId, currentStatus) {
    const newStatus = currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED';
    try {
        // Get current quiz data
        const quiz = quizzes.find(q => q.id === quizId);
        if (!quiz) return;

        await updateQuiz(quizId, {
            title: quiz.title,
            description: quiz.description,
            timePerQuestion: quiz.timePerQuestion,
            status: newStatus,
        });
        showSuccess(`Quiz ${newStatus === 'PUBLISHED' ? 'published' : 'unpublished'} successfully!`);
        loadQuizzes();
    } catch (error) {
        showError(error.message);
    }
}

function toggleAdminView() {
    isAdminViewAll = !isAdminViewAll;
    document.getElementById('adminViewToggle').textContent = 
        isAdminViewAll ? 'Show Published Only' : 'Switch to All Quizzes';
    loadQuizzes();
}

async function startQuiz(quizId) {
    try {
        const result = await startAttempt(quizId);
        const { attemptId, quizTitle, totalQuestions, timePerQuestion } = result.data;
        
        // Store attempt info in sessionStorage
        sessionStorage.setItem('currentAttempt', JSON.stringify({
            attemptId,
            quizId,
            quizTitle,
            totalQuestions,
            timePerQuestion,
            currentPage: 0,
            score: 0,
        }));
        
        window.location.href = 'quiz.html';
    } catch (error) {
        showError(error.message);
    }
}

function openEditQuiz(id, title, description, timePerQuestion, status) {
    document.getElementById('editQuizId').value = id;
    document.getElementById('editQuizTitle').value = title;
    document.getElementById('editQuizDescription').value = description;
    document.getElementById('editQuizTime').value = timePerQuestion;
    document.getElementById('editQuizStatus').value = status;
    new bootstrap.Modal(document.getElementById('editQuizModal')).show();
}

function openManageQuestions(quizId, quizTitle) {
    manageQuizId = quizId;
    document.getElementById('manageQuestionsTitle').textContent = `Manage Questions - ${quizTitle}`;
    loadManageQuestions(quizId);
    new bootstrap.Modal(document.getElementById('manageQuestionsModal')).show();
}

async function loadManageQuestions(quizId) {
    try {
        const result = await getAllQuestions(quizId);
        const questions = result.data;
        const tbody = document.getElementById('questionsBody');
        const noMsg = document.getElementById('noQuestionsMsg');
        const questionsList = document.getElementById('questionsList');
        
        tbody.innerHTML = '';

        if (!questions || questions.length === 0) {
            questionsList.classList.add('d-none');
            noMsg.classList.remove('d-none');
            return;
        }

        questionsList.classList.remove('d-none');
        noMsg.classList.add('d-none');

        questions.forEach((q, index) => {
            const optionsHtml = q.options.map(o => `${o.optionKey}: ${o.optionText}`).join('<br>');
            const correctKeys = q.correctOptionKeys ? q.correctOptionKeys.join(', ') : '';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${q.questionOrder}</td>
                <td>${q.questionText}</td>
                <td><small>${optionsHtml}</small></td>
                <td><span class="badge bg-success">${correctKeys}</span></td>
                <td>
                    <button class="btn btn-warning btn-sm me-1" onclick="openEditQuestion(${quizId}, ${q.id})">Edit</button>
                    <button class="btn btn-danger btn-sm" onclick="confirmDeleteQuestion(${q.id})">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        showError(error.message);
    }
}

function openAddQuestion() {
    document.getElementById('questionModalTitle').textContent = 'Add Question';
    document.getElementById('questionSubmitBtn').textContent = 'Add Question';
    document.getElementById('questionQuizId').value = manageQuizId;
    document.getElementById('editQuestionId').value = '';
    document.getElementById('questionForm').reset();

    // Reset to 4 options
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

async function openEditQuestion(quizId, questionId) {
    try {
        const result = await getAllQuestions(quizId);
        const questions = result.data;
        const question = questions.find(q => q.id === questionId);
        
        if (!question) return;

        document.getElementById('questionModalTitle').textContent = 'Edit Question';
        document.getElementById('questionSubmitBtn').textContent = 'Update Question';
        document.getElementById('questionQuizId').value = quizId;
        document.getElementById('editQuestionId').value = question.id;
        document.getElementById('questionText').value = question.questionText;
        document.getElementById('questionOrder').value = question.questionOrder;

        // Set correct options checkboxes
        document.querySelectorAll('.correct-option').forEach(cb => {
            cb.checked = question.correctOptionKeys?.includes(cb.value);
        });

        // Ensure enough option rows exist
        const optionsContainer = document.getElementById('optionsContainer');
        const currentOptionCount = optionsContainer.querySelectorAll('.row').length;
        const questionOptionCount = question.options.length;

        while (currentOptionCount < questionOptionCount) {
            addOption();
        }

        const optionKeys = document.querySelectorAll('.option-key');
        const optionTexts = document.querySelectorAll('.option-text');
        question.options.forEach((opt, index) => {
            if (optionKeys[index]) optionKeys[index].value = opt.optionKey;
            if (optionTexts[index]) optionTexts[index].value = opt.optionText;
        });

        new bootstrap.Modal(document.getElementById('questionModal')).show();
    } catch (error) {
        showError(error.message);
    }
}

async function confirmDeleteQuestion(questionId) {
    if (confirm('Are you sure you want to delete this question?')) {
        try {
            await deleteQuestion(questionId);
            if (manageQuizId) {
                loadManageQuestions(manageQuizId);
            }
            loadQuizzes();
            showSuccess('Question deleted successfully!');
        } catch (error) {
            showError(error.message);
        }
    }
}

async function confirmDeleteQuiz(quizId) {
    if (confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        try {
            await deleteQuiz(quizId);
            loadQuizzes();
            showSuccess('Quiz deleted successfully!');
        } catch (error) {
            showError(error.message);
        }
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    alert.classList.remove('alert-success');
    alert.classList.add('alert-danger');
    setTimeout(() => alert.classList.add('d-none'), 5000);
}

function showSuccess(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    alert.classList.remove('alert-danger');
    alert.classList.add('alert-success');
    setTimeout(() => {
        alert.classList.add('d-none');
        alert.classList.remove('alert-success');
        alert.classList.add('alert-danger');
    }, 3000);
}

const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

function addOption() {
    const container = document.getElementById('optionsContainer');
    const currentCount = container.querySelectorAll('.row').length;
    if (currentCount >= 10) {
        showError('Maximum 10 options allowed');
        return;
    }

    const label = optionLabels[currentCount];
    const div = document.createElement('div');
    div.className = 'option-item d-flex align-items-center gap-2 mb-2';
    div.innerHTML = `
        <span class="option-letter fw-bold text-primary" style="width: 24px;">${label}</span>
        <input type="hidden" class="option-id" value="">
        <input type="text" class="form-control option-text" placeholder="Option ${label} text" required>
        <button type="button" class="btn btn-sm btn-outline-danger delete-btn" onclick="removeOption(this)" title="Remove">✕</button>
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
        const checkbox = item.querySelector('.correct-option');
        if (checkbox) {
            checkbox.value = letter;
            checkbox.id = 'correct' + letter;
            checkbox.nextElementSibling.setAttribute('for', 'correct' + letter);
        }
    });
}

function updateDeleteButtons() {
    const items = document.querySelectorAll('.option-item');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    deleteBtns.forEach(btn => {
        btn.style.display = items.length <= 2 ? 'none' : 'inline-block';
    });
}
