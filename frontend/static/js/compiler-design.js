// Compiler Design Module JavaScript

class CompilerDesignHub {
    constructor() {
        this.currentTab = 'resources';
        this.qaHistory = [];
        this.resources = {};
        this.quizData = null;
        this.currentQuestion = 0;
        this.userAnswers = [];
        
        this.init();
    }

    init() {
        this.setupTabNavigation();
        this.setupEventListeners();
        this.loadResources();
        this.checkAPIStatus();
    }

    setupTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                
                // Update active states
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.remove('active'));
                
                btn.classList.add('active');
                document.getElementById(tabId).classList.add('active');
                
                this.currentTab = tabId;
                
                // Initialize tab content if needed
                this.initializeTab(tabId);
            });
        });
    }

    setupEventListeners() {
        // Q&A Section
        const askBtn = document.getElementById('askBtn');
        const questionInput = document.getElementById('questionInput');
        const quickQuestionBtns = document.querySelectorAll('.quick-q-btn');

        if (askBtn) {
            askBtn.addEventListener('click', () => this.askQuestion());
        }

        if (questionInput) {
            questionInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.askQuestion();
                }
            });
        }

        quickQuestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                questionInput.value = btn.textContent;
                this.askQuestion();
            });
        });

        // Code Analyzer Section
        const analyzeBtn = document.getElementById('analyzeCodeBtn');
        const codeInput = document.getElementById('codeInput');
        const sampleCodeBtns = document.querySelectorAll('.sample-code-btn');

        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeCode());
        }

        if (codeInput) {
            codeInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                    this.analyzeCode();
                }
            });
        }

        sampleCodeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                codeInput.value = btn.dataset.code;
            });
        });

        // Quiz Section
        const startQuizBtn = document.getElementById('startQuizBtn');
        if (startQuizBtn) {
            startQuizBtn.addEventListener('click', () => this.startQuiz());
        }
    }

    initializeTab(tabId) {
        switch (tabId) {
            case 'resources':
                this.renderResources();
                break;
            case 'qa':
                this.loadQAHistory();
                break;
            case 'analyzer':
                this.initializeAnalyzer();
                break;
            case 'quiz':
                this.initializeQuiz();
                break;
        }
    }

    async checkAPIStatus() {
        try {
            const response = await fetch('/api/status');
            const data = await response.json();
            
            const statusElement = document.querySelector('.api-status');
            if (data.status === 'connected') {
                statusElement.classList.add('connected');
                statusElement.classList.remove('disconnected');
                statusElement.innerHTML = '<i class="fas fa-check-circle"></i> AI Connected';
            } else {
                statusElement.classList.add('disconnected');
                statusElement.classList.remove('connected');
                statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> AI Disconnected';
            }
        } catch (error) {
            console.error('Error checking API status:', error);
            const statusElement = document.querySelector('.api-status');
            statusElement.classList.add('disconnected');
            statusElement.classList.remove('connected');
            statusElement.innerHTML = '<i class="fas fa-exclamation-circle"></i> AI Disconnected';
        }
    }

    async loadResources() {
        try {
            console.log('Loading resources...');
            const response = await fetch('/api/compiler-design/resources');
            const data = await response.json();
            console.log('Resources loaded:', data);
            this.resources = data.resources;
            this.renderResources();
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError('Failed to load resources');
        }
    }

    renderResources() {
        console.log('Rendering resources:', this.resources);
        const categories = ['youtube', 'books', 'online'];
        
        categories.forEach(category => {
            const container = document.getElementById(`${category}Resources`);
            if (!container || !this.resources[category]) {
                console.error(`Container not found for ${category}Resources or no resources data`);
                return;
            }

            console.log(`Rendering ${category} with ${this.resources[category].length} items`);
            container.innerHTML = '';
            
            this.resources[category].forEach(resource => {
                const card = this.createResourceCard(resource, category);
                container.appendChild(card);
            });

            // Update count
            const countElement = document.getElementById(`${category}Count`);
            if (countElement) {
                countElement.textContent = this.resources[category].length;
            }
        });
    }

    createResourceCard(resource, category) {
        const card = document.createElement('div');
        card.className = 'resource-card';
        
        let metaInfo = '';
        let topicsHtml = '';
        let actionsHtml = '';

        switch (category) {
            case 'youtube':
                metaInfo = `
                    <div class="resource-meta">
                        <span><i class="fab fa-youtube"></i> ${resource.channel}</span>
                        <span><i class="fas fa-video"></i> ${resource.videos} videos</span>
                    </div>
                `;
                topicsHtml = resource.topics.map(topic => 
                    `<span class="topic-tag">${topic}</span>`
                ).join('');
                actionsHtml = `
                    <a href="${resource.url}" target="_blank" class="btn-resource">
                        <i class="fab fa-youtube"></i> Watch Playlist
                    </a>
                `;
                break;
                
            case 'books':
                metaInfo = `
                    <div class="resource-meta">
                        <span><i class="fas fa-user"></i> ${resource.authors.join(', ')}</span>
                        <span><i class="fas fa-calendar"></i> ${resource.year}</span>
                    </div>
                `;
                topicsHtml = resource.topics.map(topic => 
                    `<span class="topic-tag">${topic}</span>`
                ).join('');
                actionsHtml = `
                    <a href="${resource.pdf_url}" target="_blank" class="btn-resource">
                        <i class="fas fa-file-pdf"></i> Read PDF
                    </a>
                `;
                break;
                
            case 'online':
                metaInfo = `
                    <div class="resource-meta">
                        <span><i class="fas fa-globe"></i> ${resource.type}</span>
                    </div>
                `;
                topicsHtml = resource.features.map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('');
                actionsHtml = `
                    <a href="${resource.url}" target="_blank" class="btn-resource">
                        <i class="fas fa-external-link-alt"></i> Visit Site
                    </a>
                `;
                break;
        }

        card.innerHTML = `
            <div class="resource-card-header">
                <div>
                    <h4 class="resource-title">${resource.title}</h4>
                    ${metaInfo}
                </div>
            </div>
            <p class="resource-description">${resource.description}</p>
            <div class="resource-topics">
                ${topicsHtml}
            </div>
            <div class="resource-actions">
                ${actionsHtml}
            </div>
        `;

        return card;
    }

    async askQuestion() {
        const questionInput = document.getElementById('questionInput');
        const question = questionInput.value.trim();
        
        if (!question) {
            this.showError('Please enter a question');
            return;
        }

        this.showLoading('Getting AI response...');
        
        try {
            const response = await fetch('/api/compiler-design/qa', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question })
            });

            const data = await response.json();
            
            if (data.success) {
                this.addQAResult(question, data.answer);
                questionInput.value = '';
            } else {
                this.showError(data.error || 'Failed to get answer');
            }
        } catch (error) {
            console.error('Error asking question:', error);
            this.showError('Failed to get AI response');
        } finally {
            this.hideLoading();
        }
    }

    addQAResult(question, answer) {
        const qaResults = document.getElementById('qaResults');
        
        const resultDiv = document.createElement('div');
        resultDiv.className = 'qa-result';
        
        resultDiv.innerHTML = `
            <div class="qa-question">
                <i class="fas fa-question-circle"></i>
                ${question}
            </div>
            <div class="qa-answer">
                ${this.formatAnswer(answer)}
            </div>
        `;
        
        qaResults.appendChild(resultDiv);
        resultDiv.scrollIntoView({ behavior: 'smooth' });
        
        // Save to history
        this.qaHistory.push({ question, answer, timestamp: new Date().toISOString() });
    }

    formatAnswer(answer) {
        // Basic markdown-like formatting
        return answer
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/\n/g, '<br>');
    }

    async analyzeCode() {
        console.log('=== ANALYZE CODE DEBUG START ===');
        console.log('Analyze code button clicked');
        
        const codeInput = document.getElementById('codeInput');
        console.log('codeInput element:', codeInput);
        
        const analysisType = document.querySelector('input[name="analysisType"]:checked');
        console.log('analysisType element:', analysisType);
        
        const code = codeInput ? codeInput.value.trim() : '';
        console.log('Code input value:', code);
        console.log('Code length:', code.length);
        
        if (!code) {
            console.log('ERROR: No code provided');
            this.showError('Please enter code to analyze');
            return;
        }

        const analysisTypeValue = analysisType ? analysisType.value : 'lexical';
        console.log('Analysis type value:', analysisTypeValue);

        this.showLoading('Analyzing code...');
        
        try {
            const requestData = { 
                code,
                analysis_type: analysisTypeValue
            };
            console.log('Request data to send:', requestData);
            
            const response = await fetch('/api/compiler-design/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            const data = await response.json();
            console.log('Full response data:', data);
            
            if (data.success) {
                console.log('SUCCESS: Calling displayAnalysisResults');
                this.displayAnalysisResults(data.analysis);
            } else {
                console.log('ERROR: API returned success=false');
                console.log('Error message:', data.error);
                this.showError(data.error || 'Failed to analyze code');
            }
        } catch (error) {
            console.error('EXCEPTION: Error analyzing code:', error);
            this.showError('Failed to analyze code - Network or server error');
        } finally {
            console.log('=== ANALYZE CODE DEBUG END ===');
            this.hideLoading();
        }
    }

    displayAnalysisResults(analysis) {
        console.log('=== DISPLAY ANALYSIS RESULTS START ===');
        console.log('Analysis data received:', analysis);
        console.log('Analysis type:', typeof analysis);
        console.log('Analysis length:', analysis ? analysis.length : 'null/undefined');
        
        const resultsContainer = document.getElementById('analysisResults');
        console.log('Results container element:', resultsContainer);
        
        if (!resultsContainer) {
            console.error('ERROR: Analysis results container not found');
            this.showError('Analysis results container not found');
            return;
        }
        
        if (!analysis) {
            console.error('ERROR: No analysis data provided');
            this.showError('No analysis data received');
            return;
        }
        
        try {
            const formattedAnalysis = this.formatAnswer(analysis);
            console.log('Formatted analysis length:', formattedAnalysis.length);
            
            resultsContainer.innerHTML = `
                <h3><i class="fas fa-search"></i> Analysis Results</h3>
                <div class="analysis-content">
                    ${formattedAnalysis}
                </div>
            `;
            
            console.log('SUCCESS: Analysis results displayed successfully');
            console.log('Container innerHTML length:', resultsContainer.innerHTML.length);
        } catch (error) {
            console.error('ERROR: Failed to display analysis results:', error);
            this.showError('Failed to display analysis results');
        }
        
        console.log('=== DISPLAY ANALYSIS RESULTS END ===');
    }

    loadQAHistory() {
        const qaResults = document.getElementById('qaResults');
        
        if (this.qaHistory.length === 0) {
            qaResults.innerHTML = `
                <div class="qa-result">
                    <div class="qa-answer">
                        <p style="text-align: center; color: var(--text-muted);">
                            <i class="fas fa-comments"></i><br>
                            No questions asked yet. Start by asking a question about compiler design!
                        </p>
                    </div>
                </div>
            `;
        } else {
            qaResults.innerHTML = '';
            this.qaHistory.forEach(qa => {
                this.addQAResult(qa.question, qa.answer);
            });
        }
    }

    initializeAnalyzer() {
        const analysisResults = document.getElementById('analysisResults');
        analysisResults.innerHTML = `
            <div style="text-align: center; color: var(--text-muted); padding: 2rem;">
                <i class="fas fa-code" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <h3>Code Analysis</h3>
                <p>Enter your code above and select analysis type to get started.</p>
            </div>
        `;
    }

    async startQuiz() {
        this.showLoading('Loading quiz questions...');
        
        try {
            // For now, we'll use predefined questions
            // In the future, this could fetch from an API
            this.quizData = this.getQuizQuestions();
            this.currentQuestion = 0;
            this.userAnswers = [];
            
            this.renderQuizQuestion();
        } catch (error) {
            console.error('Error starting quiz:', error);
            this.showError('Failed to load quiz');
        } finally {
            this.hideLoading();
        }
    }

    getQuizQuestions() {
        return [
            {
                question: "What is the first phase of a compiler?",
                options: [
                    "Syntax Analysis",
                    "Lexical Analysis", 
                    "Semantic Analysis",
                    "Code Generation"
                ],
                correct: 1,
                explanation: "Lexical Analysis is the first phase where the source code is broken down into tokens."
            },
            {
                question: "Which data structure is commonly used in syntax analysis?",
                options: [
                    "Hash Table",
                    "Array",
                    "Parse Tree",
                    "Linked List"
                ],
                correct: 2,
                explanation: "Parse trees represent the syntactic structure of the input according to the grammar."
            },
            {
                question: "What does a symbol table store?",
                options: [
                    "Keywords only",
                    "Variable names and their attributes",
                    "Operators only",
                    "Comments"
                ],
                correct: 1,
                explanation: "Symbol tables store information about identifiers like variables, functions, and their attributes."
            }
        ];
    }

    renderQuizQuestion() {
        const quizContent = document.querySelector('.quiz-content');
        const question = this.quizData[this.currentQuestion];
        
        quizContent.innerHTML = `
            <div class="quiz-question">
                <h3>Question ${this.currentQuestion + 1} of ${this.quizData.length}</h3>
                <p class="question-text">${question.question}</p>
                <div class="quiz-options">
                    ${question.options.map((option, index) => `
                        <label class="quiz-option">
                            <input type="radio" name="quizAnswer" value="${index}">
                            <span>${option}</span>
                        </label>
                    `).join('')}
                </div>
                <div class="quiz-actions">
                    <button class="btn btn-primary" onclick="compilerHub.submitAnswer()">
                        ${this.currentQuestion === this.quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
                    </button>
                </div>
            </div>
        `;
        
        this.updateQuizStatus();
    }

    submitAnswer() {
        const selectedAnswer = document.querySelector('input[name="quizAnswer"]:checked');
        
        if (!selectedAnswer) {
            this.showError('Please select an answer');
            return;
        }
        
        const answerIndex = parseInt(selectedAnswer.value);
        this.userAnswers.push(answerIndex);
        
        if (this.currentQuestion < this.quizData.length - 1) {
            this.currentQuestion++;
            this.renderQuizQuestion();
        } else {
            this.showQuizResults();
        }
    }

    showQuizResults() {
        const score = this.calculateScore();
        const percentage = Math.round((score / this.quizData.length) * 100);
        
        const quizContent = document.querySelector('.quiz-content');
        quizContent.innerHTML = `
            <div class="quiz-results">
                <h3><i class="fas fa-trophy"></i> Quiz Complete!</h3>
                <div class="score-display">
                    <div class="score-circle">
                        <span class="score-percentage">${percentage}%</span>
                        <span class="score-fraction">${score}/${this.quizData.length}</span>
                    </div>
                </div>
                <div class="results-breakdown">
                    ${this.quizData.map((q, index) => `
                        <div class="result-item ${this.userAnswers[index] === q.correct ? 'correct' : 'incorrect'}">
                            <h4>Question ${index + 1}</h4>
                            <p>${q.question}</p>
                            <p><strong>Your answer:</strong> ${q.options[this.userAnswers[index]]}</p>
                            ${this.userAnswers[index] !== q.correct ? `
                                <p><strong>Correct answer:</strong> ${q.options[q.correct]}</p>
                                <p class="explanation">${q.explanation}</p>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-primary" onclick="compilerHub.restartQuiz()">Take Quiz Again</button>
            </div>
        `;
    }

    calculateScore() {
        return this.userAnswers.reduce((score, answer, index) => {
            return score + (answer === this.quizData[index].correct ? 1 : 0);
        }, 0);
    }

    updateQuizStatus() {
        document.getElementById('currentQuestion').textContent = this.currentQuestion + 1;
        document.getElementById('totalQuestions').textContent = this.quizData.length;
        document.getElementById('quizScore').textContent = this.userAnswers.length > 0 ? this.calculateScore() : 0;
    }

    restartQuiz() {
        this.currentQuestion = 0;
        this.userAnswers = [];
        this.renderQuizQuestion();
    }

    initializeQuiz() {
        const quizContent = document.querySelector('.quiz-content');
        quizContent.innerHTML = `
            <div class="start-quiz">
                <h3><i class="fas fa-play-circle"></i> Compiler Design Quiz</h3>
                <p>Test your knowledge of compiler design concepts with our interactive quiz. 
                   You'll be asked questions about lexical analysis, syntax analysis, semantic analysis, 
                   and code generation.</p>
                <button id="startQuizBtn" class="btn btn-primary">Start Quiz</button>
            </div>
        `;
        
        document.getElementById('startQuizBtn').addEventListener('click', () => this.startQuiz());
    }

    showLoading(message = 'Loading...') {
        const overlay = document.querySelector('.loading-overlay');
        const loadingText = overlay.querySelector('.loading-text');
        loadingText.textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        overlay.classList.remove('active');
    }

    showError(message) {
        // Create a simple toast notification
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            ${message}
        `;
        
        // Add toast styles if not already present
        if (!document.getElementById('toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .error-toast {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: var(--error-color);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: var(--radius);
                    box-shadow: var(--shadow-lg);
                    z-index: 1001;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 5000);
    }
}

// Initialize the compiler design hub when the page loads
let compilerHub;
document.addEventListener('DOMContentLoaded', () => {
    compilerHub = new CompilerDesignHub();
});

// Sample code snippets for the analyzer
const SAMPLE_CODES = {
    'if (x > 0)': `if (x > 0) {
    print("positive");
} else {
    print("not positive");
}`,
    
    'for (i=0; i<n; i++)': `for (i = 0; i < n; i++) {
    sum = sum + arr[i];
}`,
    
    'int factorial(int n)': `int factorial(int n) {
    if (n <= 1)
        return 1;
    else
        return n * factorial(n-1);
}`,
    
    'while (x != 0)': `while (x != 0) {
    digit = x % 10;
    reverse = reverse * 10 + digit;
    x = x / 10;
}`
};

// Add sample code to buttons
document.addEventListener('DOMContentLoaded', () => {
    const sampleCodeBtns = document.querySelectorAll('.sample-code-btn');
    sampleCodeBtns.forEach(btn => {
        const key = btn.textContent;
        if (SAMPLE_CODES[key]) {
            btn.dataset.code = SAMPLE_CODES[key];
        }
    });
});