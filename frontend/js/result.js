// Result page logic

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkAuth())) return;

    const urlParams = new URLSearchParams(window.location.search);
    let attemptId = urlParams.get('attemptId');
    
    if (!attemptId) {
        attemptId = sessionStorage.getItem('lastAttemptId');
    }

    if (!attemptId) {
        window.location.href = 'dashboard.html';
        return;
    }

    loadResult(attemptId);
});

function idToKey(id, options) {
    const idx = options.findIndex(o => o.id === id);
    return idx >= 0 ? String.fromCharCode(65 + idx) : '';
}

function getSelectedIds(selectedOptionKey) {
    if (!selectedOptionKey) return [];
    return selectedOptionKey.split(',').map(idStr => parseInt(idStr.trim())).filter(id => !isNaN(id));
}

async function loadResult(attemptId) {
    try {
        const result = await getResult(attemptId);
        const data = result.data;

        document.getElementById('resultQuizTitle').textContent = data.quizTitle;
        document.getElementById('resultScore').textContent = `${data.totalScore}/${data.totalQuestions}`;
        document.getElementById('resultPercentage').textContent = `${data.percentage}%`;
        
        const statusBadge = document.getElementById('resultStatus');
        statusBadge.textContent = data.status;
        statusBadge.className = `badge bg-${data.status === 'COMPLETED' ? 'success' : 'warning'}`;

        // Display answer summary
        const answersList = document.getElementById('answersList');
        answersList.innerHTML = '';

        if (data.answers && data.answers.length > 0) {
            data.answers.forEach((answer, index) => {
                const options = answer.options || [];
                const selectedIds = getSelectedIds(answer.selectedOptionKey);
                const correctIds = answer.correctOptionIds || [];
                const isTimeout = answer.timedOut === true;

                let statusIcon, statusLabel, statusClass;
                if (isTimeout) {
                    statusIcon = '⏱';
                    statusLabel = 'Time Ran Out';
                    statusClass = 'timeout';
                } else if (answer.isCorrect) {
                    statusIcon = '✓';
                    statusLabel = 'Correct';
                    statusClass = 'correct';
                } else {
                    statusIcon = '✗';
                    statusLabel = 'Incorrect';
                    statusClass = 'incorrect';
                }

                const card = document.createElement('div');
                card.className = `question-review-card ${statusClass}`;

                const isOverallCorrect = answer.isCorrect;
                
                // Build options HTML
                let optionsHtml = '';
                options.forEach((opt, optIdx) => {
                    const letter = String.fromCharCode(65 + optIdx);
                    const isSelected = selectedIds.includes(opt.id);
                    const isCorrectOption = correctIds.includes(opt.id);
                    
                    let optionClass = 'option-review';
                    let badgeHtml = '';
                    
                    if (isSelected && isCorrectOption) {
                        if (isOverallCorrect) {
                            optionClass += ' correct-selected';
                            badgeHtml = `<span class="option-badge correct-badge">Your answer ✓ Correct</span>`;
                        } else {
                            optionClass += ' partial-selected';
                            badgeHtml = `<span class="option-badge partial-badge">Your answer ✓ (Missed other)</span>`;
                        }
                    } else if (isSelected && !isCorrectOption) {
                        optionClass += ' incorrect-selected';
                        badgeHtml = `<span class="option-badge incorrect-badge">Your answer ✗ Wrong</span>`;
                    } else if (!isSelected && isCorrectOption) {
                        optionClass += ' correct-unselected';
                        badgeHtml = `<span class="option-badge correct-badge">✓ Correct answer</span>`;
                    }
                    
                    optionsHtml += `
                        <div class="${optionClass}">
                            <div class="option-letter">${letter}</div>
                            <div class="option-review-text">${opt.optionText}</div>
                            ${badgeHtml}
                        </div>
                    `;
                });

                card.innerHTML = `
                    <div class="question-review-header">
                        <div class="question-number-badge">Q${index + 1}</div>
                        <div class="question-review-text">${answer.questionText}</div>
                        <div class="status-indicator ${statusClass}">
                            <span class="status-icon">${statusIcon}</span>
                            <span>${statusLabel}</span>
                        </div>
                    </div>
                    <div class="question-review-body">
                        ${optionsHtml}
                    </div>
                `;
                
                answersList.appendChild(card);
            });
        } else {
            answersList.innerHTML = '<div class="text-center text-muted py-5"><p>No answers recorded.</p></div>';
        }
    } catch (error) {
        showError(error.message);
    }
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
}