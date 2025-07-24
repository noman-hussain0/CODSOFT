// Global Variables
let currentUser = null;
let quizzes = [];
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = [];
let questionCount = 1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
});

function initializeApp() {
    // Load data from memory (simulating localStorage functionality)
    loadUserData();
    loadQuizData();

    // Set up event listeners
    setupEventListeners();

    // Show home section by default
    showHome();

    // Load sample data if no quizzes exist
    if (quizzes.length === 0) {
        loadSampleQuizzes();
    }
}

function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchQuizzes');
    if (searchInput) {
        searchInput.addEventListener('input', filterQuizzes);
    }

    // Quiz creation form
    const quizForm = document.getElementById('quizCreationForm');
    if (quizForm) {
        quizForm.addEventListener('submit', handleQuizCreation);
    }
}

// Navigation Functions
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });

    // Show target section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
}

function showHome() {
    showSection('homeSection');
}

function showLogin() {
    showSection('authSection');
    showLoginForm();
}

function showRegister() {
    showSection('authSection');
    showRegisterForm();
}

function showCreateQuiz() {
    if (!currentUser) {
        showNotification('Please login to create quizzes', 'error');
        showLogin();
        return;
    }
    showSection('createQuizSection');
    resetQuizCreationForm();
}

function showQuizList() {
    showSection('quizListSection');
    displayQuizzes();
}

// Authentication Functions
function showLoginForm() {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('registerForm').classList.remove('active');
}

function showRegisterForm() {
    document.getElementById('registerForm').classList.add('active');
    document.getElementById('loginForm').classList.remove('active');
}

function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    // Simple validation (in real app, this would be server-side)
    const users = getUsersFromMemory();
    const user = users.find(u => u.email === email && u.password === password);

    if (user) {
        currentUser = user;
        updateAuthUI();
        showNotification('Login successful!', 'success');
        showHome();
    } else {
        showNotification('Invalid email or password', 'error');
    }
}

function handleRegister(event) {
    event.preventDefault();

    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    const users = getUsersFromMemory();

    // Check if user already exists
    if (users.find(u => u.email === email)) {
        showNotification('User already exists with this email', 'error');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        email: email,
        password: password,
        createdAt: new Date().toISOString()
    };

    users.push(newUser);
    saveUsersToMemory(users);

    currentUser = newUser;
    updateAuthUI();
    showNotification('Registration successful!', 'success');
    showHome();
}

function logout() {
    currentUser = null;
    updateAuthUI();
    showNotification('Logged out successfully', 'success');
    showHome();
}

function updateAuthUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userWelcome = document.getElementById('userWelcome');

    if (currentUser) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'block';
        userWelcome.style.display = 'block';
        userWelcome.textContent = `Welcome, ${currentUser.name}!`;
    } else {
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'block';
        logoutBtn.style.display = 'none';
        userWelcome.style.display = 'none';
    }
}

// Quiz Creation Functions
function addQuestion() {
    questionCount++;
    const questionsSection = document.getElementById('questionsSection');

    const questionHTML = `
        <div class="question-item" data-question="${questionCount}">
            <div class="question-header">
                <h4>Question ${questionCount}</h4>
                <button type="button" class="btn-danger small" onclick="removeQuestion(${questionCount})">Remove</button>
            </div>
            <div class="form-group">
                <label>Question Text</label>
                <input type="text" class="question-text" placeholder="Enter your question" required>
            </div>
            <div class="options-container">
                <label>Answer Options</label>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option A" required>
                    <input type="radio" name="correct-${questionCount}" value="0" required>
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option B" required>
                    <input type="radio" name="correct-${questionCount}" value="1">
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option C" required>
                    <input type="radio" name="correct-${questionCount}" value="2">
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option D" required>
                    <input type="radio" name="correct-${questionCount}" value="3">
                    <label class="radio-label">Correct</label>
                </div>
            </div>
        </div>
    `;

    questionsSection.insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(questionNumber) {
    const questionItem = document.querySelector(`[data-question="${questionNumber}"]`);
    if (questionItem) {
        questionItem.remove();
        updateQuestionNumbers();
    }
}

function updateQuestionNumbers() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const newNumber = index + 1;
        item.setAttribute('data-question', newNumber);
        item.querySelector('h4').textContent = `Question ${newNumber}`;

        // Update radio button names
        const radioButtons = item.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
            radio.name = `correct-${newNumber}`;
        });

        // Update remove button
        const removeBtn = item.querySelector('.btn-danger');
        removeBtn.setAttribute('onclick', `removeQuestion(${newNumber})`);
    });

    questionCount = questionItems.length;
}

function handleQuizCreation(event) {
    event.preventDefault();

    if (!currentUser) {
        showNotification('Please login to create quizzes', 'error');
        return;
    }

    const title = document.getElementById('quizTitle').value;
    const description = document.getElementById('quizDescription').value;

    const questionItems = document.querySelectorAll('.question-item');
    const questions = [];

    questionItems.forEach((item, index) => {
        const questionText = item.querySelector('.question-text').value;
        const optionTexts = Array.from(item.querySelectorAll('.option-text')).map(input => input.value);
        const correctAnswer = parseInt(item.querySelector('input[type="radio"]:checked').value);

        questions.push({
            id: index + 1,
            question: questionText,
            options: optionTexts,
            correctAnswer: correctAnswer
        });
    });

    const newQuiz = {
        id: Date.now(),
        title: title,
        description: description,
        questions: questions,
        createdBy: currentUser.id,
        createdByName: currentUser.name,
        createdAt: new Date().toISOString(),
        attempts: 0
    };

    quizzes.push(newQuiz);
    saveQuizData();

    showNotification('Quiz created successfully!', 'success');
    showQuizList();
}

function resetQuizCreationForm() {
    document.getElementById('quizCreationForm').reset();

    // Reset questions to just one
    const questionsSection = document.getElementById('questionsSection');
    questionsSection.innerHTML = `
        <div class="question-item" data-question="1">
            <div class="question-header">
                <h4>Question 1</h4>
                <button type="button" class="btn-danger small" onclick="removeQuestion(1)">Remove</button>
            </div>
            <div class="form-group">
                <label>Question Text</label>
                <input type="text" class="question-text" placeholder="Enter your question" required>
            </div>
            <div class="options-container">
                <label>Answer Options</label>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option A" required>
                    <input type="radio" name="correct-1" value="0" required>
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option B" required>
                    <input type="radio" name="correct-1" value="1">
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option C" required>
                    <input type="radio" name="correct-1" value="2">
                    <label class="radio-label">Correct</label>
                </div>
                <div class="option-group">
                    <input type="text" class="option-text" placeholder="Option D" required>
                    <input type="radio" name="correct-1" value="3">
                    <label class="radio-label">Correct</label>
                </div>
            </div>
        </div>
    `;

    questionCount = 1;
}

// Quiz Display Functions
function displayQuizzes() {
    const quizzesGrid = document.getElementById('quizzesGrid');
    quizzesGrid.innerHTML = '';

    if (quizzes.length === 0) {
        quizzesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No quizzes available. Create one to get started!</p>';
        return;
    }

    quizzes.forEach(quiz => {
        const quizCard = createQuizCard(quiz);
        quizzesGrid.appendChild(quizCard);
    });
}

function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.onclick = () => startQuiz(quiz.id);

    card.innerHTML = `
        <h3>${quiz.title}</h3>
        <p>${quiz.description || 'No description available'}</p>
        <div class="quiz-meta">
            <span><i class="fas fa-question-circle"></i> ${quiz.questions.length} Questions</span>
            <span><i class="fas fa-user"></i> ${quiz.createdByName}</span>
        </div>
    `;

    return card;
}

function filterQuizzes() {
    const searchTerm = document.getElementById('searchQuizzes').value.toLowerCase();
    const filteredQuizzes = quizzes.filter(quiz =>
        quiz.title.toLowerCase().includes(searchTerm) ||
        quiz.description.toLowerCase().includes(searchTerm) ||
        quiz.createdByName.toLowerCase().includes(searchTerm)
    );

    const quizzesGrid = document.getElementById('quizzesGrid');
    quizzesGrid.innerHTML = '';

    if (filteredQuizzes.length === 0) {
        quizzesGrid.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">No quizzes found matching your search.</p>';
        return;
    }

    filteredQuizzes.forEach(quiz => {
        const quizCard = createQuizCard(quiz);
        quizzesGrid.appendChild(quizCard);
    });
}

// Quiz Taking Functions
function startQuiz(quizId) {
    currentQuiz = quizzes.find(q => q.id === quizId);
    if (!currentQuiz) return;

    currentQuestionIndex = 0;
    userAnswers = new Array(currentQuiz.questions.length).fill(null);

    showSection('takeQuizSection');
    displayCurrentQuestion();
    updateProgress();
}

function displayCurrentQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];

    document.getElementById('currentQuizTitle').textContent = currentQuiz.title;
    document.getElementById('currentQuestion').textContent = question.question;

    const optionsContainer = document.getElementById('currentOptions');
    optionsContainer.innerHTML = '';

    question.options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.className = 'option-item';
        optionElement.textContent = option;
        optionElement.onclick = () => selectOption(index);

        if (userAnswers[currentQuestionIndex] === index) {
            optionElement.classList.add('selected');
        }

        optionsContainer.appendChild(optionElement);
    });

    updateNavigationButtons();
}

function selectOption(optionIndex) {
    userAnswers[currentQuestionIndex] = optionIndex;

    // Update visual selection
    const options = document.querySelectorAll('.option-item');
    options.forEach((option, index) => {
        option.classList.toggle('selected', index === optionIndex);
    });

    updateNavigationButtons();
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    const progress = ((currentQuestionIndex + 1) / currentQuiz.questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressText.textContent = `Question ${currentQuestionIndex + 1} of ${currentQuiz.questions.length}`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.disabled = currentQuestionIndex === 0;

    if (currentQuestionIndex === currentQuiz.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    }
}

function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayCurrentQuestion();
        updateProgress();
    }
}

function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayCurrentQuestion();
        updateProgress();
    }
}

function submitQuiz() {
    // Calculate score
    let correctAnswers = 0;
    currentQuiz.questions.forEach((question, index) => {
        if (userAnswers[index] === question.correctAnswer) {
            correctAnswers++;
        }
    });

    const score = {
        correct: correctAnswers,
        total: currentQuiz.questions.length,
        percentage: Math.round((correctAnswers / currentQuiz.questions.length) * 100)
    };

    // Update quiz attempts
    const quizIndex = quizzes.findIndex(q => q.id === currentQuiz.id);
    if (quizIndex !== -1) {
        quizzes[quizIndex].attempts++;
        saveQuizData();
    }

    displayResults(score);
}

function displayResults(score) {
    showSection('resultsSection');

    document.getElementById('scorePercentage').textContent = `${score.percentage}%`;
    document.getElementById('scoreText').textContent = `${score.correct} out of ${score.total}`;

    // Score message
    const scoreMessage = document.getElementById('scoreMessage');
    if (score.percentage >= 90) {
        scoreMessage.textContent = 'Excellent! Outstanding performance!';
    } else if (score.percentage >= 70) {
        scoreMessage.textContent = 'Great job! Well done!';
    } else if (score.percentage >= 50) {
        scoreMessage.textContent = 'Good effort! Keep practicing!';
    } else {
        scoreMessage.textContent = 'Don\'t give up! Try again!';
    }

    // Question review
    const reviewContainer = document.getElementById('questionReview');
    reviewContainer.innerHTML = '';

    currentQuiz.questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.correctAnswer;
        const reviewItem = document.createElement('div');
        reviewItem.className = `question-review-item ${isCorrect ? 'correct' : 'incorrect'}`;

        reviewItem.innerHTML = `
            <div class="review-question">${question.question}</div>
            <div class="review-answer">
                Your answer: ${userAnswers[index] !== null ? question.options[userAnswers[index]] : 'Not answered'}<br>
                Correct answer: ${question.options[question.correctAnswer]}
            </div>
        `;

        reviewContainer.appendChild(reviewItem);
    });
}

function retakeQuiz() {
    if (currentQuiz) {
        startQuiz(currentQuiz.id);
    }
}

// Data Management Functions
function loadUserData() {
    // In a real app, this would load from a server or localStorage
    // For demo purposes, we'll use in-memory storage
    if (!window.quizAppData) {
        window.quizAppData = {
            users: [],
            quizzes: []
        };
    }
}

function loadQuizData() {
    if (window.quizAppData && window.quizAppData.quizzes) {
        quizzes = window.quizAppData.quizzes;
    }
}

function saveQuizData() {
    if (!window.quizAppData) {
        window.quizAppData = {};
    }
    window.quizAppData.quizzes = quizzes;
}

function getUsersFromMemory() {
    if (!window.quizAppData) {
        window.quizAppData = { users: [] };
    }
    return window.quizAppData.users;
}

function saveUsersToMemory(users) {
    if (!window.quizAppData) {
        window.quizAppData = {};
    }
    window.quizAppData.users = users;
}

function loadSampleQuizzes() {
    const sampleQuizzes = [
        {
            id: 1,
            title: 'JavaScript Basics',
            description: 'Test your knowledge of JavaScript fundamentals',
            questions: [
                {
                    id: 1,
                    question: 'What is the correct way to declare a variable in JavaScript?',
                    options: ['var myVar;', 'variable myVar;', 'v myVar;', 'declare myVar;'],
                    correctAnswer: 0
                },
                {
                    id: 2,
                    question: 'Which method is used to add an element to the end of an array?',
                    options: ['append()', 'push()', 'add()', 'insert()'],
                    correctAnswer: 1
                },
                {
                    id: 3,
                    question: 'What does "DOM" stand for?',
                    options: ['Document Object Model', 'Data Object Management', 'Dynamic Object Manipulation', 'Document Oriented Markup'],
                    correctAnswer: 0
                }
            ],
            createdBy: 'system',
            createdByName: 'QuizMaster',
            createdAt: new Date().toISOString(),
            attempts: 0
        },
        {
            id: 2,
            title: 'General Knowledge',
            description: 'Test your general knowledge with these questions',
            questions: [
                {
                    id: 1,
                    question: 'What is the capital of France?',
                    options: ['London', 'Berlin', 'Paris', 'Madrid'],
                    correctAnswer: 2
                },
                {
                    id: 2,
                    question: 'Which planet is known as the Red Planet?',
                    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
                    correctAnswer: 1
                },
                {
                    id: 3,
                    question: 'Who painted the Mona Lisa?',
                    options: ['Vincent van Gogh', 'Pablo Picasso', 'Leonardo da Vinci', 'Michelangelo'],
                    correctAnswer: 2
                }
            ],
            createdBy: 'system',
            createdByName: 'QuizMaster',
            createdAt: new Date().toISOString(),
            attempts: 0
        },
        {
            id: 3,
            title: 'Science Quiz',
            description: 'Challenge yourself with these science questions',
            questions: [
                {
                    id: 1,
                    question: 'What is the chemical symbol for water?',
                    options: ['H2O', 'CO2', 'NaCl', 'O2'],
                    correctAnswer: 0
                },
                {
                    id: 2,
                    question: 'How many bones are there in an adult human body?',
                    options: ['195', '206', '215', '230'],
                    correctAnswer: 1
                },
                {
                    id: 3,
                    question: 'What is the speed of light in vacuum?',
                    options: ['300,000 km/s', '299,792,458 m/s', '186,000 miles/s', 'All of the above'],
                    correctAnswer: 3
                }
            ],
            createdBy: 'system',
            createdByName: 'QuizMaster',
            createdAt: new Date().toISOString(),
            attempts: 0
        }
    ];

    quizzes = sampleQuizzes;
    saveQuizData();
}

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');

    notificationText.textContent = message;
    notification.className = `notification ${type}`;
    notification.style.display = 'flex';

    // Auto hide after 3 seconds
    setTimeout(() => {
        hideNotification();
    }, 3000);
}

function hideNotification() {
    const notification = document.getElementById('notification');
    notification.style.display = 'none';
}

function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Keyboard navigation
document.addEventListener('keydown', function (event) {
    // Handle keyboard shortcuts in quiz taking mode
    if (document.getElementById('takeQuizSection').classList.contains('active')) {
        switch (event.key) {
            case '1':
            case '2':
            case '3':
            case '4':
                const optionIndex = parseInt(event.key) - 1;
                const options = document.querySelectorAll('.option-item');
                if (options[optionIndex]) {
                    selectOption(optionIndex);
                }
                break;
            case 'ArrowLeft':
                if (!document.getElementById('prevBtn').disabled) {
                    previousQuestion();
                }
                break;
            case 'ArrowRight':
                if (document.getElementById('nextBtn').style.display !== 'none') {
                    nextQuestion();
                }
                break;
            case 'Enter':
                if (document.getElementById('submitBtn').style.display !== 'none') {
                    submitQuiz();
                }
                break;
        }
    }

    // ESC to close notifications
    if (event.key === 'Escape') {
        hideNotification();
    }
});

// Handle window resize for responsive design
window.addEventListener('resize', function () {
    // Adjust layout if needed
    if (window.innerWidth <= 768) {
        // Mobile optimizations
        const heroButtons = document.querySelector('.hero-buttons');
        if (heroButtons) {
            heroButtons.style.flexDirection = 'column';
        }
    } else {
        // Desktop optimizations
        const heroButtons = document.querySelector('.hero-buttons');
        if (heroButtons) {
            heroButtons.style.flexDirection = 'row';
        }
    }
});

// Service Worker registration for PWA (optional enhancement)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        // Service worker code would go here for offline functionality
        console.log('Quiz Maker app loaded successfully!');
    });
}