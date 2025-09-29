// Compiler integration and output management

class CompilerManager {
    constructor() {
        this.currentLanguage = null;
        this.lastCompileResult = null;
        this.isCompiling = false;
        
        // Output elements
        this.outputTabs = document.querySelectorAll('.tab-btn');
        this.outputContent = document.querySelectorAll('.tab-content');
        this.codeContainer = document.getElementById('generatedCode');
        this.explanationContainer = document.getElementById('explanationContent');
        this.astContainer = document.getElementById('astView');
        this.codeLanguageSpan = document.getElementById('codeLanguage');
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupOutputTabs();
    }

    setupEventListeners() {
        // Compile button
        const compileBtn = document.getElementById('compileBtn');
        compileBtn.addEventListener('click', this.compile.bind(this));
        
        // Copy and download buttons
        document.getElementById('copyCodeBtn').addEventListener('click', this.copyCode.bind(this));
        document.getElementById('downloadCodeBtn').addEventListener('click', this.downloadCode.bind(this));
        
        // Keyboard shortcut for compile (Ctrl+Enter)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.compile();
            }
        });
    }

    setupOutputTabs() {
        this.outputTabs.forEach((tab, index) => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.outputTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // Update tab content
        this.outputContent.forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}Tab`);
        });
        
        // Track tab usage
        Utils.storage.set('lastActiveTab', tabName);
    }

    setLanguage(language) {
        this.currentLanguage = language;
        this.updateCompileButton();
        
        // Clear previous results when language changes
        if (this.lastCompileResult && this.lastCompileResult.language !== language) {
            this.clearOutput();
        }
    }

    updateCompileButton() {
        const compileBtn = document.getElementById('compileBtn');
        const hasBlocks = canvas.blocks.size > 0;
        const hasLanguage = !!this.currentLanguage;
        
        compileBtn.disabled = !hasBlocks || !hasLanguage || this.isCompiling;
        
        if (this.isCompiling) {
            compileBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Compiling...';
        } else if (!hasLanguage) {
            compileBtn.innerHTML = '<i class="fas fa-play"></i> Select Language First';
        } else if (!hasBlocks) {
            compileBtn.innerHTML = '<i class="fas fa-play"></i> Add Blocks First';
        } else {
            compileBtn.innerHTML = '<i class="fas fa-play"></i> Compile & Run';
        }
    }

    async compile() {
        if (this.isCompiling || !this.currentLanguage) return;
        
        try {
            // Validate that we have blocks
            if (canvas.blocks.size === 0) {
                notifications.warning('Please add some blocks to the canvas first');
                return;
            }
            
            this.isCompiling = true;
            this.updateCompileButton();
            
            // Show loading
            Utils.showLoading('Compiling your visual program...');
            
            // Prepare blocks data for compilation
            const blocksData = this.prepareBlocksData();
            const connectionsData = this.prepareConnectionsData();
            
            // Validate program structure
            const validation = await this.validateProgram(blocksData, connectionsData);
            if (!validation.isValid) {
                notifications.showValidationResult(validation);
                return;
            }
            
            // Send compilation request
            const compileRequest = {
                blocks: blocksData,
                connections: connectionsData,
                language: this.currentLanguage
            };
            
            const response = await fetch('/api/compile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(compileRequest)
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.lastCompileResult = result;
                this.displayCompileResult(result);
                notifications.showCompilationResult(result);
                
                // Auto-switch to code tab if compilation successful
                this.switchTab('code');
            } else {
                notifications.showCompilationResult(result);
                this.displayCompileError(result);
            }
            
        } catch (error) {
            console.error('Compilation error:', error);
            notifications.error(`Compilation failed: ${error.message}`);
            this.displayCompileError({ 
                success: false, 
                error: error.message, 
                stage: 'network' 
            });
        } finally {
            this.isCompiling = false;
            this.updateCompileButton();
            Utils.hideLoading();
        }
    }

    prepareBlocksData() {
        return Array.from(canvas.blocks.values()).map(block => ({
            id: block.id,
            type: block.type,
            x: block.x,
            y: block.y,
            properties: block.properties || {}
        }));
    }

    prepareConnectionsData() {
        // For now, we'll create simple sequential connections
        // This could be enhanced to support actual visual connections
        const blocks = Array.from(canvas.blocks.values()).sort((a, b) => {
            if (a.y === b.y) return a.x - b.x;
            return a.y - b.y;
        });
        
        const connections = [];
        for (let i = 0; i < blocks.length - 1; i++) {
            connections.push({
                from: blocks[i].id,
                to: blocks[i + 1].id
            });
        }
        
        return connections;
    }

    async validateProgram(blocks, connections) {
        try {
            const response = await fetch('/api/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ blocks, connections })
            });
            
            return await response.json();
        } catch (error) {
            return {
                success: false,
                isValid: false,
                errors: [`Validation failed: ${error.message}`]
            };
        }
    }

    displayCompileResult(result) {
        // Display generated code
        this.displayCode(result.code, result.language);
        
        // Display explanation
        this.displayExplanation(result.explanation);
        
        // Display AST
        if (result.ast) {
            this.displayAST(result.ast);
        }
        
        // Update code language indicator
        this.codeLanguageSpan.textContent = `${result.language.toUpperCase()} code generated successfully`;
        
        // Enable copy and download buttons
        this.updateActionButtons(true);
    }

    displayCode(code, language) {
        if (!code) {
            this.codeContainer.textContent = 'No code generated';
            this.codeContainer.className = 'language-none';
            return;
        }
        
        // Set language class for syntax highlighting
        const languageMap = {
            'c': 'language-c',
            'cpp': 'language-cpp',
            'python': 'language-python',
            'java': 'language-java'
        };
        
        this.codeContainer.className = languageMap[language] || 'language-none';
        this.codeContainer.textContent = code;
        
        // Apply syntax highlighting if Prism is available
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(this.codeContainer);
        }
    }

    displayExplanation(explanation) {
        if (!explanation) {
            this.explanationContainer.innerHTML = `
                <div class="explanation-placeholder">
                    <i class="fas fa-lightbulb"></i>
                    <p>No explanation available</p>
                </div>
            `;
            return;
        }
        
        // Process and format explanation
        const formattedExplanation = this.formatExplanation(explanation);
        this.explanationContainer.innerHTML = formattedExplanation;
    }

    formatExplanation(explanation) {
        // Convert plain text explanation to formatted HTML
        let formatted = Utils.sanitizeHtml(explanation);
        
        // Convert line breaks to paragraphs
        formatted = formatted
            .split('\n\n')
            .map(paragraph => paragraph.trim())
            .filter(paragraph => paragraph.length > 0)
            .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
            .join('');
        
        // Enhance with better formatting
        formatted = formatted
            // Bold important terms
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Italic emphasis
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // Code snippets
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // Step headers
            .replace(/^(\d+\.\s)/gm, '<strong class="step-number">$1</strong>');
        
        return `<div class="explanation-content">${formatted}</div>`;
    }

    displayAST(ast) {
        if (!ast) {
            this.astContainer.textContent = 'No AST data available';
            return;
        }
        
        // Format AST as JSON
        const formattedAST = JSON.stringify(ast, null, 2);
        this.astContainer.textContent = formattedAST;
        this.astContainer.className = 'language-json';
        
        // Apply syntax highlighting
        if (typeof Prism !== 'undefined') {
            Prism.highlightElement(this.astContainer);
        }
    }

    displayCompileError(result) {
        // Show error in code panel
        this.codeContainer.className = 'language-none';
        this.codeContainer.textContent = `Compilation Error:\n\nStage: ${result.stage}\n\nErrors:\n${result.errors?.join('\n') || result.error}`;
        
        // Show error explanation
        this.explanationContainer.innerHTML = `
            <div class="explanation-content">
                <h3 style="color: var(--error-color);">Compilation Failed</h3>
                <p>Your visual program could not be compiled due to the following issues:</p>
                <ul>
                    ${(result.errors || [result.error]).map(error => 
                        `<li>${Utils.sanitizeHtml(error)}</li>`
                    ).join('')}
                </ul>
                <p>Please fix these issues and try compiling again.</p>
            </div>
        `;
        
        // Clear AST
        this.astContainer.textContent = 'AST not available due to compilation errors';
        
        // Update status
        this.codeLanguageSpan.textContent = 'Compilation failed';
        
        // Disable action buttons
        this.updateActionButtons(false);
    }

    updateActionButtons(enabled) {
        const copyBtn = document.getElementById('copyCodeBtn');
        const downloadBtn = document.getElementById('downloadCodeBtn');
        
        copyBtn.disabled = !enabled;
        downloadBtn.disabled = !enabled;
    }

    async copyCode() {
        if (!this.lastCompileResult || !this.lastCompileResult.code) {
            notifications.warning('No code available to copy');
            return;
        }
        
        try {
            await Utils.copyToClipboard(this.lastCompileResult.code);
            notifications.showCopyStatus(true, 'code');
        } catch (error) {
            notifications.showCopyStatus(false, 'code');
        }
    }

    downloadCode() {
        if (!this.lastCompileResult || !this.lastCompileResult.code) {
            notifications.warning('No code available to download');
            return;
        }
        
        try {
            const extensions = {
                'c': '.c',
                'cpp': '.cpp',
                'python': '.py',
                'java': '.java'
            };
            
            const extension = extensions[this.lastCompileResult.language] || '.txt';
            const filename = `visual_program_${Date.now()}${extension}`;
            
            Utils.downloadFile(
                this.lastCompileResult.code,
                filename,
                'text/plain'
            );
            
            notifications.showDownloadStatus(true, filename);
        } catch (error) {
            notifications.showDownloadStatus(false, 'program file');
        }
    }

    clearOutput() {
        this.codeContainer.textContent = 'Compile your visual program to see the generated code here.';
        this.codeContainer.className = 'language-none';
        
        this.explanationContainer.innerHTML = `
            <div class="explanation-placeholder">
                <i class="fas fa-lightbulb"></i>
                <p>Compile your program to see detailed explanations here.</p>
            </div>
        `;
        
        this.astContainer.textContent = 'AST will be displayed here after compilation.';
        this.astContainer.className = 'language-json';
        
        this.codeLanguageSpan.textContent = 'No code generated';
        
        this.lastCompileResult = null;
        this.updateActionButtons(false);
    }

    // Get compilation statistics
    getStats() {
        if (!this.lastCompileResult) return null;
        
        return {
            language: this.lastCompileResult.language,
            blockCount: canvas.blocks.size,
            connectionCount: canvas.connections.length,
            codeLines: this.lastCompileResult.code ? this.lastCompileResult.code.split('\n').length : 0,
            success: this.lastCompileResult.success,
            timestamp: new Date().toISOString()
        };
    }

    // Export compilation result
    exportResult() {
        if (!this.lastCompileResult) {
            notifications.warning('No compilation result to export');
            return;
        }
        
        const exportData = {
            ...this.lastCompileResult,
            canvas: canvas.export(),
            stats: this.getStats(),
            exportedAt: new Date().toISOString()
        };
        
        const filename = `visual_program_result_${Date.now()}.json`;
        Utils.downloadFile(
            JSON.stringify(exportData, null, 2),
            filename,
            'application/json'
        );
        
        notifications.showDownloadStatus(true, filename);
    }
}

// Create global instance
const compiler = new CompilerManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CompilerManager;
}