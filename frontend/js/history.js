// History page logic

let currentPage = 0;
let totalPages = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!(await checkAuth())) return;
    loadHistory(0);
});

async function loadHistory(page) {
    try {
        const result = await getMyAttempts(page, 10);
        const pageData = result.data;
        
        const tbody = document.getElementById('historyBody');
        tbody.innerHTML = '';
        
        if (!pageData.content || pageData.content.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No attempts yet.</td></tr>';
            document.getElementById('paginationSection').classList.add('d-none');
            return;
        }

        pageData.content.forEach(attempt => {
            const tr = document.createElement('tr');
            const date = attempt.completedAt
                ? new Date(attempt.completedAt + 'Z').toLocaleString('en-IN', {
                    year: 'numeric', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })
                : 'In Progress';
            tr.innerHTML = `
                <td>${attempt.quizTitle}</td>
                <td>${attempt.totalScore}/${attempt.totalQuestions}</td>
                <td>${attempt.percentage}%</td>
                <td><span class="badge bg-${attempt.status === 'COMPLETED' ? 'success' : attempt.status === 'CANCELLED' ? 'secondary' : 'warning'}">${attempt.status === 'IN_PROGRESS' ? 'In Progress' : attempt.status === 'CANCELLED' ? 'Cancelled' : 'Completed'}</span></td>
                <td>${date}</td>
                <td>
                    <a href="result.html?attemptId=${attempt.attemptId}" class="btn btn-sm btn-outline-primary">
                        View
                    </a>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Pagination
        currentPage = pageData.number;
        totalPages = pageData.totalPages;
        setupPagination();
    } catch (error) {
        showError(error.message);
    }
}

function setupPagination() {
    const paginationSection = document.getElementById('paginationSection');
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';

    if (totalPages <= 1) {
        paginationSection.classList.add('d-none');
        return;
    }

    paginationSection.classList.remove('d-none');

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 0 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage - 1})">Previous</a>`;
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 0; i < totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${i})">${i + 1}</a>`;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages - 1 ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="goToPage(${currentPage + 1})">Next</a>`;
    pagination.appendChild(nextLi);
}

function goToPage(page) {
    if (page < 0 || page >= totalPages) return;
    loadHistory(page);
}

function showError(message) {
    const alert = document.getElementById('errorAlert');
    alert.textContent = message;
    alert.classList.remove('d-none');
    setTimeout(() => alert.classList.add('d-none'), 5000);
}
