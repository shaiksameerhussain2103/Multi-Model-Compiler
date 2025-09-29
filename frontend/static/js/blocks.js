// Block management and sidebar functionality

class BlockManager {
    constructor() {
        this.sidebar = document.getElementById('sidebar');
        this.blocksContainer = document.getElementById('blocksContainer');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        
        this.currentLanguage = null;
        this.availableBlocks = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showNoLanguageMessage();
    }

    setupEventListeners() {
        // Sidebar toggle
        this.sidebarToggle.addEventListener('click', this.toggleSidebar.bind(this));
        
        // Handle window resize for responsive sidebar
        window.addEventListener('resize', Utils.debounce(this.handleResize.bind(this), 250));
    }

    toggleSidebar() {
        this.sidebar.classList.toggle('collapsed');
        const icon = this.sidebarToggle.querySelector('i');
        
        if (this.sidebar.classList.contains('collapsed')) {
            icon.className = 'fas fa-chevron-right';
        } else {
            icon.className = 'fas fa-chevron-left';
        }
        
        // Store preference
        Utils.storage.set('sidebarCollapsed', this.sidebar.classList.contains('collapsed'));
    }

    handleResize() {
        // Auto-collapse sidebar on mobile
        if (window.innerWidth < 768) {
            this.sidebar.classList.add('collapsed');
        } else {
            // Restore sidebar state on desktop
            const collapsed = Utils.storage.get('sidebarCollapsed', false);
            if (collapsed) {
                this.sidebar.classList.add('collapsed');
            } else {
                this.sidebar.classList.remove('collapsed');
            }
        }
    }

    async loadBlocksForLanguage(languageId) {
        try {
            Utils.showLoading('Loading programming blocks...');
            
            const response = await fetch(`/api/languages/${languageId}/blocks`);
            const data = await response.json();
            
            if (data.success) {
                this.currentLanguage = languageId;
                this.availableBlocks = data.blocks;
                this.renderBlocks();
                notifications.success(`Loaded blocks for ${languageId.toUpperCase()}`);
            } else {
                throw new Error(data.error || 'Failed to load blocks');
            }
        } catch (error) {
            console.error('Error loading blocks:', error);
            notifications.error(`Failed to load blocks: ${error.message}`);
            this.showErrorMessage(error.message);
        } finally {
            Utils.hideLoading();
        }
    }

    renderBlocks() {
        if (!this.availableBlocks.length) {
            this.showNoLanguageMessage();
            return;
        }

        // Group blocks by category
        const blocksByCategory = this.groupBlocksByCategory();
        
        // Clear container
        this.blocksContainer.innerHTML = '';
        
        // Render each category
        Object.entries(blocksByCategory).forEach(([category, blocks]) => {
            const categorySection = this.createCategorySection(category, blocks);
            this.blocksContainer.appendChild(categorySection);
        });
        
        // Add drag and drop event listeners
        this.addDragEventListeners();
    }

    groupBlocksByCategory() {
        const groups = {};
        
        this.availableBlocks.forEach(block => {
            const category = block.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(block);
        });
        
        // Sort categories in preferred order
        const categoryOrder = ['flow', 'data', 'io', 'control', 'math', 'logic', 'other'];
        const sortedGroups = {};
        
        categoryOrder.forEach(category => {
            if (groups[category]) {
                sortedGroups[category] = groups[category];
            }
        });
        
        // Add any remaining categories
        Object.keys(groups).forEach(category => {
            if (!sortedGroups[category]) {
                sortedGroups[category] = groups[category];
            }
        });
        
        return sortedGroups;
    }

    createCategorySection(category, blocks) {
        const section = document.createElement('div');
        section.className = 'block-category';
        section.setAttribute('data-category', category);
        
        // Category title
        const title = document.createElement('div');
        title.className = 'category-title';
        title.textContent = Utils.camelToTitle(category);
        section.appendChild(title);
        
        // Block items
        blocks.forEach(block => {
            const blockItem = this.createBlockItem(block);
            section.appendChild(blockItem);
        });
        
        return section;
    }

    createBlockItem(block) {
        const item = document.createElement('div');
        item.className = 'block-item';
        item.setAttribute('data-block-type', block.id);
        item.draggable = true;
        
        // Block icon
        const icon = document.createElement('div');
        icon.className = 'block-icon';
        icon.innerHTML = `<i class="${Utils.getBlockIcon(block.id)}"></i>`;
        icon.style.backgroundColor = Utils.getCategoryColor(block.category);
        
        // Block info
        const info = document.createElement('div');
        info.className = 'block-info';
        
        const name = document.createElement('div');
        name.className = 'block-name';
        name.textContent = block.name;
        
        const description = document.createElement('div');
        description.className = 'block-description';
        description.textContent = block.description;
        
        info.appendChild(name);
        info.appendChild(description);
        
        item.appendChild(icon);
        item.appendChild(info);
        
        // Add tooltip
        this.addTooltip(item, block);
        
        return item;
    }

    addTooltip(element, block) {
        let tooltip = null;
        let showTimeout = null;
        let hideTimeout = null;
        
        const showTooltip = (e) => {
            if (hideTimeout) {
                clearTimeout(hideTimeout);
                hideTimeout = null;
            }
            
            showTimeout = setTimeout(() => {
                tooltip = this.createTooltip(block);
                document.body.appendChild(tooltip);
                this.positionTooltip(tooltip, e);
                
                requestAnimationFrame(() => {
                    tooltip.classList.add('show');
                });
            }, 500);
        };
        
        const hideTooltip = () => {
            if (showTimeout) {
                clearTimeout(showTimeout);
                showTimeout = null;
            }
            
            if (tooltip) {
                tooltip.classList.remove('show');
                hideTimeout = setTimeout(() => {
                    if (tooltip && tooltip.parentNode) {
                        tooltip.parentNode.removeChild(tooltip);
                    }
                    tooltip = null;
                }, 200);
            }
        };
        
        const updateTooltipPosition = (e) => {
            if (tooltip) {
                this.positionTooltip(tooltip, e);
            }
        };
        
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
        element.addEventListener('mousemove', updateTooltipPosition);
    }

    createTooltip(block) {
        const tooltip = document.createElement('div');
        tooltip.className = 'block-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            padding: 0.75rem;
            box-shadow: var(--shadow-lg);
            z-index: 6000;
            max-width: 250px;
            font-size: 0.875rem;
            opacity: 0;
            transform: translateY(5px);
            transition: all 0.2s ease;
            pointer-events: none;
        `;
        
        // Tooltip content
        const content = document.createElement('div');
        
        // Block name and category
        const header = document.createElement('div');
        header.style.cssText = 'font-weight: 600; margin-bottom: 0.25rem; color: var(--primary-color);';
        header.textContent = `${block.name} (${Utils.camelToTitle(block.category)})`;
        content.appendChild(header);
        
        // Description
        const desc = document.createElement('div');
        desc.style.cssText = 'margin-bottom: 0.5rem; color: var(--text-secondary); line-height: 1.4;';
        desc.textContent = block.description;
        content.appendChild(desc);
        
        // Inputs (if any)
        if (block.inputs && block.inputs.length > 0) {
            const inputsTitle = document.createElement('div');
            inputsTitle.style.cssText = 'font-weight: 500; margin-bottom: 0.25rem; font-size: 0.75rem;';
            inputsTitle.textContent = 'Configuration:';
            content.appendChild(inputsTitle);
            
            const inputsList = document.createElement('ul');
            inputsList.style.cssText = 'margin: 0; padding-left: 1rem; font-size: 0.75rem; color: var(--text-muted);';
            
            block.inputs.forEach(input => {
                const li = document.createElement('li');
                li.textContent = `${Utils.camelToTitle(input.name)} (${input.type})`;
                if (input.required) {
                    li.innerHTML += ' <span style="color: var(--error-color);">*</span>';
                }
                inputsList.appendChild(li);
            });
            
            content.appendChild(inputsList);
        }
        
        // Usage hint
        const hint = document.createElement('div');
        hint.style.cssText = 'margin-top: 0.5rem; font-size: 0.6875rem; color: var(--text-muted); font-style: italic;';
        hint.textContent = 'Drag to canvas to add this block';
        content.appendChild(hint);
        
        tooltip.appendChild(content);
        tooltip.classList.add('animate-fade-in');
        
        return tooltip;
    }

    positionTooltip(tooltip, mouseEvent) {
        const margin = 10;
        const rect = tooltip.getBoundingClientRect();
        
        let left = mouseEvent.clientX + margin;
        let top = mouseEvent.clientY - rect.height / 2;
        
        // Adjust if tooltip would go off screen
        if (left + rect.width > window.innerWidth) {
            left = mouseEvent.clientX - rect.width - margin;
        }
        
        if (top < 0) {
            top = margin;
        } else if (top + rect.height > window.innerHeight) {
            top = window.innerHeight - rect.height - margin;
        }
        
        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    }

    addDragEventListeners() {
        const blockItems = this.blocksContainer.querySelectorAll('.block-item[draggable="true"]');
        
        blockItems.forEach(item => {
            item.addEventListener('dragstart', this.onDragStart.bind(this));
            item.addEventListener('dragend', this.onDragEnd.bind(this));
        });
    }

    onDragStart(e) {
        const blockType = e.target.getAttribute('data-block-type');
        const blockDefinition = this.availableBlocks.find(block => block.id === blockType);
        
        // Set drag data
        e.dataTransfer.setData('text/block-type', blockType);
        e.dataTransfer.setData('text/block-definition', JSON.stringify(blockDefinition));
        e.dataTransfer.effectAllowed = 'copy';
        
        // Visual feedback
        e.target.classList.add('dragging');
        
        // Create drag image (optional)
        const dragImage = e.target.cloneNode(true);
        dragImage.style.cssText = `
            position: absolute;
            top: -1000px;
            left: -1000px;
            transform: rotate(5deg);
            opacity: 0.8;
            pointer-events: none;
        `;
        document.body.appendChild(dragImage);
        e.dataTransfer.setDragImage(dragImage, 60, 30);
        
        setTimeout(() => {
            if (dragImage.parentNode) {
                dragImage.parentNode.removeChild(dragImage);
            }
        }, 0);
    }

    onDragEnd(e) {
        e.target.classList.remove('dragging');
    }

    showNoLanguageMessage() {
        this.blocksContainer.innerHTML = `
            <div class="no-language-message">
                <i class="fas fa-info-circle"></i>
                <p>Select a programming language to see available blocks</p>
            </div>
        `;
    }

    showErrorMessage(error) {
        this.blocksContainer.innerHTML = `
            <div class="no-language-message">
                <i class="fas fa-exclamation-triangle" style="color: var(--error-color);"></i>
                <p>Error loading blocks:</p>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.5rem;">${Utils.sanitizeHtml(error)}</p>
                <button class="btn btn-small btn-primary" style="margin-top: 1rem;" onclick="blockManager.loadBlocksForLanguage('${this.currentLanguage}')">
                    <i class="fas fa-refresh"></i> Retry
                </button>
            </div>
        `;
    }

    // Search and filter functionality
    searchBlocks(query) {
        if (!query.trim()) {
            this.renderBlocks();
            return;
        }
        
        const filteredBlocks = this.availableBlocks.filter(block => {
            const searchText = `${block.name} ${block.description} ${block.category}`.toLowerCase();
            return searchText.includes(query.toLowerCase());
        });
        
        if (filteredBlocks.length === 0) {
            this.showNoResults(query);
        } else {
            this.renderFilteredBlocks(filteredBlocks, query);
        }
    }

    renderFilteredBlocks(blocks, query) {
        this.blocksContainer.innerHTML = '';
        
        // Add search info
        const searchInfo = document.createElement('div');
        searchInfo.className = 'search-info';
        searchInfo.style.cssText = `
            padding: 0.5rem;
            margin-bottom: 1rem;
            background: var(--background);
            border-radius: var(--radius-sm);
            font-size: 0.75rem;
            color: var(--text-secondary);
        `;
        searchInfo.textContent = `Found ${blocks.length} blocks for "${query}"`;
        this.blocksContainer.appendChild(searchInfo);
        
        // Render filtered blocks
        blocks.forEach(block => {
            const blockItem = this.createBlockItem(block);
            this.blocksContainer.appendChild(blockItem);
        });
        
        this.addDragEventListeners();
    }

    showNoResults(query) {
        this.blocksContainer.innerHTML = `
            <div class="no-language-message">
                <i class="fas fa-search"></i>
                <p>No blocks found for "${Utils.sanitizeHtml(query)}"</p>
                <button class="btn btn-small btn-secondary" style="margin-top: 1rem;" onclick="blockManager.renderBlocks()">
                    <i class="fas fa-times"></i> Clear Search
                </button>
            </div>
        `;
    }

    // Get block definition by ID
    getBlockDefinition(blockId) {
        return this.availableBlocks.find(block => block.id === blockId);
    }

    // Get blocks by category
    getBlocksByCategory(category) {
        return this.availableBlocks.filter(block => block.category === category);
    }

    // Export current blocks configuration
    exportBlocksConfig() {
        return {
            language: this.currentLanguage,
            blocks: this.availableBlocks,
            timestamp: new Date().toISOString()
        };
    }
}

// Create global instance
const blockManager = new BlockManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockManager;
}