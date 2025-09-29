// Modal system for block properties and other dialogs

class ModalManager {
    constructor() {
        this.activeModal = null;
        this.modalData = {};
        this.init();
    }

    init() {
        // Handle escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.activeModal) {
                this.close();
            }
        });

        // Handle click outside to close modal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                this.close();
            }
        });
    }

    show(type, data = {}) {
        this.modalData = data;
        
        switch (type) {
            case 'blockProperties':
                this.showBlockPropertiesModal(data);
                break;
            case 'confirm':
                this.showConfirmModal(data);
                break;
            case 'about':
                this.showAboutModal();
                break;
            default:
                console.warn('Unknown modal type:', type);
        }
    }

    showBlockPropertiesModal(data) {
        const modal = document.getElementById('blockPropertiesModal');
        const titleEl = document.getElementById('modalTitle');
        const inputsEl = document.getElementById('modalInputs');
        const form = document.getElementById('blockPropertiesForm');

        // Set title
        titleEl.textContent = `${Utils.camelToTitle(data.blockType)} Properties`;

        // Clear previous inputs
        inputsEl.innerHTML = '';

        // Create inputs based on block definition
        if (data.blockDefinition && data.blockDefinition.inputs) {
            data.blockDefinition.inputs.forEach(input => {
                const formGroup = this.createFormGroup(input, data.currentProperties);
                inputsEl.appendChild(formGroup);
            });
        }

        // Handle form submission
        const handleSubmit = (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const properties = {};
            
            for (let [key, value] of formData.entries()) {
                properties[key] = value;
            }

            // Validate form
            const validation = Utils.validateForm(form);
            if (!validation.isValid) {
                notifications.warning('Please fix the following errors:\n' + validation.errors.join('\n'));
                return;
            }

            // Call callback with new properties
            if (data.onSave) {
                data.onSave(properties);
            }

            this.close();
        };

        // Remove existing event listeners
        form.removeEventListener('submit', this.currentSubmitHandler);
        this.currentSubmitHandler = handleSubmit;
        form.addEventListener('submit', handleSubmit);

        // Setup cancel and close buttons
        const cancelBtn = document.getElementById('modalCancel');
        const closeBtn = document.getElementById('modalClose');
        
        cancelBtn.onclick = () => this.close();
        closeBtn.onclick = () => this.close();

        // Show modal
        this.activeModal = modal;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus first input
        const firstInput = inputsEl.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
    }

    showConfirmModal(data) {
        const modalHtml = `
            <div class="modal-overlay active" id="confirmModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>${data.title || 'Confirm Action'}</h3>
                        <button class="modal-close" onclick="modal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <p>${data.message || 'Are you sure you want to continue?'}</p>
                        <div class="modal-actions" style="margin-top: 1.5rem;">
                            <button type="button" class="btn btn-secondary" onclick="modal.close()">
                                ${data.cancelText || 'Cancel'}
                            </button>
                            <button type="button" class="btn ${data.dangerAction ? 'btn-danger' : 'btn-primary'}" id="confirmBtn">
                                ${data.confirmText || 'Confirm'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing confirm modal
        const existingModal = document.getElementById('confirmModal');
        if (existingModal) {
            existingModal.remove();
        }

        // Add to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';

        const modal = document.getElementById('confirmModal');
        const confirmBtn = document.getElementById('confirmBtn');
        
        confirmBtn.onclick = () => {
            if (data.onConfirm) {
                data.onConfirm();
            }
            this.close();
        };

        this.activeModal = modal;
    }

    showAboutModal() {
        const modalHtml = `
            <div class="modal-overlay active" id="aboutModal">
                <div class="modal">
                    <div class="modal-header">
                        <h3>About Visual Programming Compiler</h3>
                        <button class="modal-close" onclick="modal.close()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 1rem;">
                            <i class="fas fa-puzzle-piece" style="font-size: 3rem; color: var(--primary-color);"></i>
                        </div>
                        <h4>Multi-Modal Visual Programming Compiler</h4>
                        <p>A visual programming environment that teaches programming concepts through drag-and-drop blocks.</p>
                        
                        <h5 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">Features:</h5>
                        <ul>
                            <li>Visual block-based programming</li>
                            <li>Support for C, C++, Python, and Java</li>
                            <li>AI-powered code generation</li>
                            <li>Step-by-step explanations</li>
                            <li>Real-time syntax validation</li>
                        </ul>

                        <h5 style="margin-top: 1.5rem; margin-bottom: 0.5rem;">How to Use:</h5>
                        <ol>
                            <li>Select a programming language</li>
                            <li>Drag blocks from the sidebar to the canvas</li>
                            <li>Configure block properties as needed</li>
                            <li>Connect blocks in logical order</li>
                            <li>Click "Compile & Run" to generate code</li>
                        </ol>

                        <div class="modal-actions" style="margin-top: 1.5rem;">
                            <button type="button" class="btn btn-primary" onclick="modal.close()">
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal
        const existingModal = document.getElementById('aboutModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';
        this.activeModal = document.getElementById('aboutModal');
    }

    createFormGroup(inputConfig, currentProperties = {}) {
        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        // Create label
        const label = document.createElement('label');
        label.textContent = Utils.camelToTitle(inputConfig.name);
        label.setAttribute('for', inputConfig.name);
        formGroup.appendChild(label);

        // Create input based on type
        let input;
        const currentValue = currentProperties[inputConfig.name] || '';

        switch (inputConfig.type) {
            case 'select':
                input = document.createElement('select');
                input.name = inputConfig.name;
                input.id = inputConfig.name;

                // Add default option if no value
                if (!currentValue && inputConfig.placeholder) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = inputConfig.placeholder;
                    input.appendChild(defaultOption);
                }

                // Add options
                inputConfig.options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option;
                    optionEl.textContent = Utils.camelToTitle(option);
                    if (option === currentValue) {
                        optionEl.selected = true;
                    }
                    input.appendChild(optionEl);
                });
                break;

            case 'textarea':
                input = document.createElement('textarea');
                input.name = inputConfig.name;
                input.id = inputConfig.name;
                input.placeholder = inputConfig.placeholder || '';
                input.value = currentValue;
                input.rows = 3;
                break;

            case 'number':
                input = document.createElement('input');
                input.type = 'number';
                input.name = inputConfig.name;
                input.id = inputConfig.name;
                input.placeholder = inputConfig.placeholder || '';
                input.value = currentValue;
                if (inputConfig.min !== undefined) input.min = inputConfig.min;
                if (inputConfig.max !== undefined) input.max = inputConfig.max;
                break;

            case 'checkbox':
                input = document.createElement('input');
                input.type = 'checkbox';
                input.name = inputConfig.name;
                input.id = inputConfig.name;
                input.checked = currentValue === 'true' || currentValue === true;
                break;

            default: // text
                input = document.createElement('input');
                input.type = 'text';
                input.name = inputConfig.name;
                input.id = inputConfig.name;
                input.placeholder = inputConfig.placeholder || '';
                input.value = currentValue;
        }

        // Add required attribute if specified
        if (inputConfig.required) {
            input.required = true;
        }

        formGroup.appendChild(input);

        // Add description if provided
        if (inputConfig.description) {
            const description = document.createElement('small');
            description.style.color = 'var(--text-muted)';
            description.style.display = 'block';
            description.style.marginTop = '0.25rem';
            description.textContent = inputConfig.description;
            formGroup.appendChild(description);
        }

        return formGroup;
    }

    close() {
        if (!this.activeModal) return;

        this.activeModal.classList.remove('active');
        document.body.style.overflow = '';

        // Remove dynamically created modals
        setTimeout(() => {
            if (this.activeModal.id === 'confirmModal' || this.activeModal.id === 'aboutModal') {
                this.activeModal.remove();
            }
        }, 300);

        this.activeModal = null;
        this.modalData = {};
    }

    // Quick methods for common modals
    confirm(message, options = {}) {
        return new Promise((resolve) => {
            this.show('confirm', {
                message,
                title: options.title,
                confirmText: options.confirmText,
                cancelText: options.cancelText,
                dangerAction: options.danger,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });
    }

    async confirmDelete(itemName = 'item') {
        return this.confirm(
            `Are you sure you want to delete this ${itemName}? This action cannot be undone.`,
            {
                title: 'Confirm Delete',
                confirmText: 'Delete',
                danger: true
            }
        );
    }

    async confirmClear() {
        return this.confirm(
            'Are you sure you want to clear the canvas? All blocks will be removed.',
            {
                title: 'Clear Canvas',
                confirmText: 'Clear All',
                danger: true
            }
        );
    }
}

// Create global instance
const modal = new ModalManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}