// Main application controller

class VisualProgrammingApp {
    constructor() {
        this.currentLanguage = null;
        this.isInitialized = false;
        this.apiConnected = false;
        
        this.init();
    }

    async init() {
        try {
            // Show initial loading
            Utils.showLoading('Initializing Visual Programming Compiler...');
            
            // Initialize components
            this.setupEventListeners();
            
            // Load available languages
            await this.loadLanguages();
            
            // Test API connection
            await this.testApiConnection();
            
            // Restore user preferences
            this.restorePreferences();
            
            // Initial UI updates
            this.updateUI();
            
            this.isInitialized = true;
            
            // Show welcome message
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('App initialization failed:', error);
            notifications.error(`Failed to initialize application: ${error.message}`);
        } finally {
            Utils.hideLoading();
        }
    }

    setupEventListeners() {
        // Language selector
        const languageSelect = document.getElementById('languageSelect');
        languageSelect.addEventListener('change', this.onLanguageChange.bind(this));
        
        // Clear button
        const clearBtn = document.getElementById('clearBtn');
        clearBtn.addEventListener('click', this.onClearCanvas.bind(this));
        
        // Help shortcuts
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        
        // Window events
        window.addEventListener('beforeunload', this.onBeforeUnload.bind(this));
        window.addEventListener('resize', Utils.debounce(this.onWindowResize.bind(this), 250));
        
        // Canvas events to update compile button
        canvas.canvas.addEventListener('DOMSubtreeModified', () => {
            compiler.updateCompileButton();
        });
        
        // Observe canvas for changes (modern approach)
        if (window.MutationObserver) {
            const observer = new MutationObserver(() => {
                compiler.updateCompileButton();
            });
            observer.observe(canvas.canvasContent, {
                childList: true,
                subtree: true
            });
        }
    }

    async loadLanguages() {
        try {
            const response = await fetch('/api/languages');
            const data = await response.json();
            
            if (data.success) {
                this.populateLanguageSelector(data.languages);
            } else {
                throw new Error(data.error || 'Failed to load languages');
            }
        } catch (error) {
            console.error('Error loading languages:', error);
            notifications.error(`Failed to load programming languages: ${error.message}`);
        }
    }

    populateLanguageSelector(languages) {
        const select = document.getElementById('languageSelect');
        
        // Clear existing options (except the first placeholder)
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add language options
        languages.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang.id;
            option.textContent = lang.name;
            select.appendChild(option);
        });
        
        // Restore previously selected language
        const savedLanguage = Utils.storage.get('selectedLanguage');
        if (savedLanguage && languages.some(l => l.id === savedLanguage)) {
            select.value = savedLanguage;
            this.setLanguage(savedLanguage);
        }
    }

    async testApiConnection() {
        try {
            const response = await fetch('/api/test');
            const data = await response.json();
            
            this.apiConnected = data.success;
            
            if (data.success) {
                notifications.showApiStatus(data.gemini_connected);
                console.log('API Status:', data);
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            this.apiConnected = false;
            notifications.showApiStatus(false);
            console.error('API connection test failed:', error);
        }
    }

    onLanguageChange(e) {
        const languageId = e.target.value;
        if (languageId) {
            this.setLanguage(languageId);
        } else {
            this.clearLanguage();
        }
    }

    async setLanguage(languageId) {
        if (this.currentLanguage === languageId) return;
        
        this.currentLanguage = languageId;
        
        // Update components
        compiler.setLanguage(languageId);
        await blockManager.loadBlocksForLanguage(languageId);
        
        // Save preference
        Utils.storage.set('selectedLanguage', languageId);
        
        // Update UI
        this.updateUI();
    }

    clearLanguage() {
        this.currentLanguage = null;
        compiler.setLanguage(null);
        blockManager.showNoLanguageMessage();
        this.updateUI();
    }

    async onClearCanvas() {
        if (canvas.blocks.size === 0) {
            notifications.info('Canvas is already empty');
            return;
        }
        
        const confirmed = await modal.confirmClear();
        if (confirmed) {
            canvas.clear();
            compiler.clearOutput();
        }
    }

    onKeyDown(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'o':
                    e.preventDefault();
                    this.loadProject();
                    break;
                case 'e':
                    e.preventDefault();
                    this.exportProject();
                    break;
                case ',':
                    e.preventDefault();
                    this.showSettings();
                    break;
            }
        }
        
        // Help
        if (e.key === 'F1') {
            e.preventDefault();
            this.showHelp();
        }
    }

    onBeforeUnload(e) {
        // Warn user if they have unsaved work
        if (canvas.blocks.size > 0) {
            const message = 'You have unsaved work. Are you sure you want to leave?';
            e.returnValue = message;
            return message;
        }
    }

    onWindowResize() {
        // Handle responsive layout changes
        if (window.innerWidth < 768) {
            // Mobile layout adjustments
            if (!document.body.classList.contains('mobile-layout')) {
                document.body.classList.add('mobile-layout');
                notifications.info('Switched to mobile layout');
            }
        } else {
            // Desktop layout
            if (document.body.classList.contains('mobile-layout')) {
                document.body.classList.remove('mobile-layout');
            }
        }
    }

    updateUI() {
        // Update compile button state
        compiler.updateCompileButton();
        
        // Update title with current language
        if (this.currentLanguage) {
            document.title = `Visual Programming Compiler - ${this.currentLanguage.toUpperCase()}`;
        } else {
            document.title = 'Visual Programming Compiler';
        }
        
        // Update canvas info
        canvas.updateCanvasInfo();
    }

    restorePreferences() {
        // Restore sidebar state
        const sidebarCollapsed = Utils.storage.get('sidebarCollapsed', false);
        if (sidebarCollapsed) {
            document.getElementById('sidebar').classList.add('collapsed');
        }
        
        // Restore active output tab
        const lastActiveTab = Utils.storage.get('lastActiveTab', 'code');
        compiler.switchTab(lastActiveTab);
        
        // Restore theme if implemented
        const theme = Utils.storage.get('theme', 'light');
        this.setTheme(theme);
    }

    setTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        Utils.storage.set('theme', theme);
    }

    // Project management
    saveProject() {
        try {
            const projectData = {
                language: this.currentLanguage,
                canvas: canvas.export(),
                blocks: blockManager.exportBlocksConfig(),
                metadata: {
                    name: 'Visual Program',
                    version: '1.0',
                    createdAt: new Date().toISOString(),
                    savedAt: new Date().toISOString()
                }
            };
            
            const filename = `visual_program_${Date.now()}.json`;
            Utils.downloadFile(
                JSON.stringify(projectData, null, 2),
                filename,
                'application/json'
            );
            
            notifications.showSaveStatus(true, filename);
        } catch (error) {
            notifications.showSaveStatus(false);
            console.error('Save failed:', error);
        }
    }

    loadProject() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const projectData = JSON.parse(e.target.result);
                        this.importProject(projectData);
                    } catch (error) {
                        notifications.error(`Failed to load project: ${error.message}`);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    async importProject(projectData) {
        try {
            // Validate project data
            if (!projectData.canvas || !projectData.language) {
                throw new Error('Invalid project file format');
            }
            
            // Confirm if canvas has content
            if (canvas.blocks.size > 0) {
                const confirmed = await modal.confirm(
                    'Loading this project will replace your current work. Continue?',
                    { title: 'Load Project', confirmText: 'Load', danger: true }
                );
                if (!confirmed) return;
            }
            
            // Set language first
            if (projectData.language) {
                document.getElementById('languageSelect').value = projectData.language;
                await this.setLanguage(projectData.language);
            }
            
            // Import canvas
            if (projectData.canvas) {
                canvas.import(projectData.canvas);
            }
            
            notifications.success('Project loaded successfully');
            
        } catch (error) {
            notifications.error(`Failed to import project: ${error.message}`);
            console.error('Import failed:', error);
        }
    }

    exportProject() {
        if (compiler.lastCompileResult) {
            compiler.exportResult();
        } else {
            this.saveProject();
        }
    }

    // Help and settings
    showHelp() {
        modal.show('about');
    }

    showSettings() {
        // Could implement settings modal here
        notifications.info('Settings feature coming soon!');
    }

    // Example and tutorial
    async loadExample() {
        try {
            const response = await fetch('/api/example');
            const data = await response.json();
            
            if (data.success) {
                await this.importProject(data.example);
                notifications.success('Example program loaded');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            notifications.error(`Failed to load example: ${error.message}`);
        }
    }

    showWelcomeMessage() {
        if (Utils.storage.get('welcomeShown', false)) {
            return; // Don't show welcome again
        }
        
        const welcomeActions = [
            {
                label: 'Load Example',
                type: 'btn-primary',
                handler: () => this.loadExample()
            },
            {
                label: 'Show Help',
                type: 'btn-secondary',
                handler: () => this.showHelp()
            }
        ];
        
        const welcomeMessage = document.createElement('div');
        welcomeMessage.innerHTML = `
            <div>
                <strong>Welcome to Visual Programming Compiler!</strong>
            </div>
            <div style="margin-top: 0.5rem;">
                1. Select a programming language<br>
                2. Drag blocks from the sidebar to the canvas<br>
                3. Configure block properties<br>
                4. Click "Compile & Run" to generate code
            </div>
        `;
        
        notifications.show(welcomeMessage, 'info', 10000, welcomeActions);
        
        Utils.storage.set('welcomeShown', true);
    }

    // Diagnostic methods
    getDiagnostics() {
        return {
            initialized: this.isInitialized,
            apiConnected: this.apiConnected,
            currentLanguage: this.currentLanguage,
            blockCount: canvas.blocks.size,
            connectionCount: canvas.connections.length,
            hasCompileResult: !!compiler.lastCompileResult,
            canvasZoom: canvas.zoom,
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };
    }

    // Debug helpers (for development)
    debug() {
        console.group('Visual Programming Compiler Debug');
        console.log('App State:', this.getDiagnostics());
        console.log('Canvas State:', canvas.export());
        console.log('Compiler State:', compiler.getStats());
        console.log('Block Manager:', blockManager.exportBlocksConfig());
        console.groupEnd();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create global app instance
    window.app = new VisualProgrammingApp();
    
    // Add debug helper to window for development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        window.debug = () => app.debug();
        console.log('Debug mode enabled. Type debug() to see app state.');
    }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    notifications.error('An unexpected error occurred. Please try again.');
});

// Handle JavaScript errors
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    notifications.error('A JavaScript error occurred. Please refresh the page.');
});

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VisualProgrammingApp;
}