// Canvas management for the visual programming interface

class CanvasManager {
    constructor() {
        this.canvas = document.getElementById('canvas');
        this.canvasContent = document.getElementById('canvasContent');
        this.canvasInfo = document.getElementById('canvasInfo');
        
        // Canvas state
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.dragData = null;
        this.selectedBlock = null;
        
        // Block management
        this.blocks = new Map();
        this.connections = [];
        this.blockCounter = 0;
        
        // History for undo/redo
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGrid();
        this.setupConnectionSVG();
        this.updateCanvasInfo();
    }

    setupConnectionSVG() {
        this.connectionSVG = document.getElementById('canvasConnections');
        // Add arrow marker definition
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
        this.connectionSVG.appendChild(defs);
    }

    setupEventListeners() {
        // Canvas panning and zooming
        this.canvas.addEventListener('mousedown', this.onCanvasMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onCanvasMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onCanvasMouseUp.bind(this));
        this.canvas.addEventListener('wheel', this.onCanvasWheel.bind(this));
        
        // Prevent context menu on canvas
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Handle window resize
        window.addEventListener('resize', Utils.debounce(this.updateCanvasSize.bind(this), 250));
        
        // Handle canvas tools
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.zoomOut());
        document.getElementById('resetZoomBtn').addEventListener('click', () => this.resetZoom());
        
        // Handle drag and drop from sidebar
        this.canvasContent.addEventListener('dragover', this.onDragOver.bind(this));
        this.canvasContent.addEventListener('drop', this.onDrop.bind(this));
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    setupGrid() {
        const grid = this.canvas.querySelector('.canvas-grid');
        if (grid) {
            this.updateGrid();
        }
    }

    updateGrid() {
        const grid = this.canvas.querySelector('.canvas-grid');
        if (!grid) return;
        
        const gridSize = 20 * this.zoom;
        grid.style.backgroundSize = `${gridSize}px ${gridSize}px`;
        grid.style.backgroundPosition = `${this.panX}px ${this.panY}px`;
    }

    updateCanvasSize() {
        // Update canvas content transform
        this.applyTransform();
    }

    applyTransform() {
        this.canvasContent.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        // Also transform the connections SVG
        if (this.connectionSVG) {
            this.connectionSVG.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.zoom})`;
        }
        this.updateGrid();
        this.updateCanvasInfo();
    }

    updateCanvasInfo() {
        const blockCount = this.blocks.size;
        const connectionCount = this.connections.length;
        this.canvasInfo.textContent = `${blockCount} blocks, ${connectionCount} connections • Zoom: ${Math.round(this.zoom * 100)}%`;
    }

    // Canvas interaction handlers
    onCanvasMouseDown(e) {
        if (e.target === this.canvas || e.target === this.canvas.querySelector('.canvas-grid')) {
            this.isDragging = true;
            this.dragData = {
                startX: e.clientX - this.panX,
                startY: e.clientY - this.panY,
                type: 'pan'
            };
            this.canvas.style.cursor = 'grabbing';
            
            // Deselect any selected block
            this.deselectBlock();
        }
    }

    onCanvasMouseMove(e) {
        if (!this.isDragging || !this.dragData) return;
        
        if (this.dragData.type === 'pan') {
            this.panX = e.clientX - this.dragData.startX;
            this.panY = e.clientY - this.dragData.startY;
            this.applyTransform();
        }
    }

    onCanvasMouseUp(e) {
        if (this.isDragging && this.dragData?.type === 'pan') {
            this.isDragging = false;
            this.dragData = null;
            this.canvas.style.cursor = '';
        }
    }

    onCanvasWheel(e) {
        e.preventDefault();
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(0.1, Math.min(3, this.zoom * delta));
        
        if (newZoom !== this.zoom) {
            // Zoom towards mouse position
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            // Calculate the point in canvas coordinates
            const canvasX = (mouseX - this.panX) / this.zoom;
            const canvasY = (mouseY - this.panY) / this.zoom;
            
            this.zoom = newZoom;
            
            // Adjust pan to keep the same point under the mouse
            this.panX = mouseX - canvasX * this.zoom;
            this.panY = mouseY - canvasY * this.zoom;
            
            this.applyTransform();
        }
    }

    onKeyDown(e) {
        // Handle keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    this.zoomIn();
                    break;
                case '-':
                    e.preventDefault();
                    this.zoomOut();
                    break;
                case '0':
                    e.preventDefault();
                    this.resetZoom();
                    break;
            }
        }
        
        // Delete selected block
        if (e.key === 'Delete' || e.key === 'Backspace') {
            if (this.selectedBlock) {
                e.preventDefault();
                this.removeBlock(this.selectedBlock.id);
            }
        }
    }

    // Drag and drop handlers
    onDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }

    onDrop(e) {
        e.preventDefault();
        
        const blockType = e.dataTransfer.getData('text/block-type');
        const blockDefinition = JSON.parse(e.dataTransfer.getData('text/block-definition') || '{}');
        
        if (blockType) {
            // Calculate drop position in canvas coordinates
            const rect = this.canvasContent.getBoundingClientRect();
            const x = (e.clientX - rect.left - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - this.panY) / this.zoom;
            
            this.addBlock(blockType, { x, y }, blockDefinition);
        }
    }

    // Block management
    addBlock(type, position, definition = {}) {
        const blockId = `block_${++this.blockCounter}`;
        
        const block = {
            id: blockId,
            type: type,
            x: Math.round(position.x / 20) * 20, // Snap to grid
            y: Math.round(position.y / 20) * 20,
            properties: {},
            definition: definition
        };
        
        // Auto-connect to the last block if it exists
        this.autoConnectNewBlock(block);
        
        // Create DOM element
        const blockElement = this.createBlockElement(block);
        this.canvasContent.appendChild(blockElement);
        
        // Store block data
        this.blocks.set(blockId, block);
        
        // Save state for undo
        this.saveState();
        
        // Update info
        this.updateCanvasInfo();
        
        // Show properties modal if block has inputs
        if (definition.inputs && definition.inputs.length > 0) {
            this.editBlockProperties(blockId);
        }
        
        notifications.info(`Added ${Utils.camelToTitle(type)} block to canvas`);
        
        return blockId;
    }

    autoConnectNewBlock(newBlock) {
        // Find the last added block (excluding the new one)
        const existingBlocks = Array.from(this.blocks.values());
        
        if (existingBlocks.length === 0) {
            // This is the first block, no connection needed
            return;
        }
        
        // Sort blocks by creation order (blockCounter in ID)
        existingBlocks.sort((a, b) => {
            const aNum = parseInt(a.id.split('_')[1]);
            const bNum = parseInt(b.id.split('_')[1]);
            return bNum - aNum; // Descending to get the most recent first
        });
        
        const lastBlock = existingBlocks[0];
        
        // Don't connect if the last block is an 'end' block
        if (lastBlock.type === 'end') {
            return;
        }
        
        // Don't connect if the new block is a 'start' block and there are already blocks
        if (newBlock.type === 'start' && existingBlocks.length > 0) {
            return;
        }
        
        // Create connection
        this.connections.push({
            from: lastBlock.id,
            to: newBlock.id
        });

        // Render the new connection
        this.renderConnections();

        console.log(`Auto-connected ${lastBlock.type} (${lastBlock.id}) to ${newBlock.type} (${newBlock.id})`);
    }

    renderConnections() {
        // Clear existing connections
        const existingLines = this.connectionSVG.querySelectorAll('.canvas-connection-line');
        existingLines.forEach(line => line.remove());
        
        // Render each connection
        this.connections.forEach(connection => {
            const fromBlock = this.blocks.get(connection.from);
            const toBlock = this.blocks.get(connection.to);
            
            if (fromBlock && toBlock) {
                this.drawConnection(fromBlock, toBlock);
            }
        });
    }

    drawConnection(fromBlock, toBlock) {
        // Calculate connection points (center of blocks)
        const fromX = fromBlock.x + 60; // Block width/2
        const fromY = fromBlock.y + 20; // Block height/2
        const toX = toBlock.x + 60;
        const toY = toBlock.y + 20;
        
        // Create curved path for better visual
        const midX = (fromX + toX) / 2;
        const controlY1 = fromY + 50;
        const controlY2 = toY - 50;
        
        const pathData = `M ${fromX} ${fromY} C ${midX} ${controlY1}, ${midX} ${controlY2}, ${toX} ${toY}`;
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('class', 'canvas-connection-line');
        
        this.connectionSVG.appendChild(path);
    }

    createBlockElement(block) {
        const element = document.createElement('div');
        element.className = `canvas-block ${block.type} ${this.getBlockCategory(block.type)}`;
        element.id = `canvas-${block.id}`;
        element.style.left = `${block.x}px`;
        element.style.top = `${block.y}px`;
        
        // Create block header
        const header = document.createElement('div');
        header.className = 'block-header';
        
        const icon = document.createElement('i');
        icon.className = Utils.getBlockIcon(block.type);
        
        const title = document.createElement('span');
        title.className = 'block-title';
        title.textContent = Utils.camelToTitle(block.type);
        
        header.appendChild(icon);
        header.appendChild(title);
        
        // Create block body
        const body = document.createElement('div');
        body.className = 'block-body';
        body.textContent = block.definition.description || '';
        
        element.appendChild(header);
        element.appendChild(body);
        
        // Add properties display if any
        if (Object.keys(block.properties).length > 0) {
            const properties = document.createElement('div');
            properties.className = 'block-properties';
            this.updateBlockPropertiesDisplay(element, block.properties);
            element.appendChild(properties);
        }
        
        // Add event listeners
        this.addBlockEventListeners(element, block.id);
        
        return element;
    }

    addBlockEventListeners(element, blockId) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };
        
        // Mouse down - start dragging
        element.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            this.selectBlock(blockId);
            
            isDragging = true;
            const block = this.blocks.get(blockId);
            const rect = element.getBoundingClientRect();
            const canvasRect = this.canvasContent.getBoundingClientRect();
            
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            
            element.classList.add('dragging');
            document.body.style.cursor = 'grabbing';
        });
        
        // Mouse move - update position during drag
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const rect = this.canvasContent.getBoundingClientRect();
            const x = (e.clientX - rect.left - dragOffset.x - this.panX) / this.zoom;
            const y = (e.clientY - rect.top - dragOffset.y - this.panY) / this.zoom;
            
            // Snap to grid
            const snappedX = Math.round(x / 20) * 20;
            const snappedY = Math.round(y / 20) * 20;
            
            element.style.left = `${snappedX}px`;
            element.style.top = `${snappedY}px`;
            
            // Update block data
            const block = this.blocks.get(blockId);
            if (block) {
                block.x = snappedX;
                block.y = snappedY;
            }
        });
        
        // Mouse up - stop dragging
        document.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                element.classList.remove('dragging');
                document.body.style.cursor = '';
                
                // Save state for undo
                this.saveState();
            }
        });
        
        // Double click - edit properties
        element.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editBlockProperties(blockId);
        });
        
        // Right click - context menu
        element.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showBlockContextMenu(blockId, e.clientX, e.clientY);
        });
    }

    selectBlock(blockId) {
        // Deselect previous block
        this.deselectBlock();
        
        const element = document.getElementById(`canvas-${blockId}`);
        if (element) {
            element.classList.add('selected');
            this.selectedBlock = this.blocks.get(blockId);
        }
    }

    deselectBlock() {
        if (this.selectedBlock) {
            const element = document.getElementById(`canvas-${this.selectedBlock.id}`);
            if (element) {
                element.classList.remove('selected');
            }
            this.selectedBlock = null;
        }
    }

    removeBlock(blockId) {
        const block = this.blocks.get(blockId);
        if (!block) return;
        
        // Remove from DOM
        const element = document.getElementById(`canvas-${blockId}`);
        if (element) {
            element.remove();
        }
        
        // Remove from blocks map
        this.blocks.delete(blockId);
        
        // Remove any connections involving this block
        this.connections = this.connections.filter(conn => 
            conn.from !== blockId && conn.to !== blockId
        );
        
        // Deselect if this was the selected block
        if (this.selectedBlock && this.selectedBlock.id === blockId) {
            this.selectedBlock = null;
        }
        
        // Save state for undo
        this.saveState();
        
        // Update info
        this.updateCanvasInfo();
        
        notifications.info(`Removed ${Utils.camelToTitle(block.type)} block`);
    }

    editBlockProperties(blockId) {
        const block = this.blocks.get(blockId);
        if (!block || !block.definition.inputs) return;
        
        modal.show('blockProperties', {
            blockType: block.type,
            blockDefinition: block.definition,
            currentProperties: block.properties,
            onSave: (newProperties) => {
                block.properties = { ...block.properties, ...newProperties };
                
                // Update visual display
                const element = document.getElementById(`canvas-${blockId}`);
                if (element) {
                    this.updateBlockPropertiesDisplay(element, block.properties);
                }
                
                // Save state for undo
                this.saveState();
                
                notifications.success('Block properties updated');
            }
        });
    }

    updateBlockPropertiesDisplay(element, properties) {
        let propertiesEl = element.querySelector('.block-properties');
        if (!propertiesEl) {
            propertiesEl = document.createElement('div');
            propertiesEl.className = 'block-properties';
            element.appendChild(propertiesEl);
        }
        
        propertiesEl.innerHTML = '';
        
        Object.entries(properties).forEach(([key, value]) => {
            if (value && value.toString().trim()) {
                const item = document.createElement('div');
                item.className = 'property-item';
                
                const keyEl = document.createElement('span');
                keyEl.className = 'property-key';
                keyEl.textContent = `${key}:`;
                
                const valueEl = document.createElement('span');
                valueEl.className = 'property-value';
                valueEl.textContent = value.toString();
                valueEl.title = value.toString();
                
                item.appendChild(keyEl);
                item.appendChild(valueEl);
                propertiesEl.appendChild(item);
            }
        });
    }

    showBlockContextMenu(blockId, x, y) {
        // Simple context menu implementation
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 5000;
            min-width: 150px;
        `;
        
        const menuItems = [
            { text: 'Edit Properties', icon: 'fas fa-edit', action: () => this.editBlockProperties(blockId) },
            { text: 'Duplicate', icon: 'fas fa-copy', action: () => this.duplicateBlock(blockId) },
            { text: 'Delete', icon: 'fas fa-trash', action: () => this.removeBlock(blockId), danger: true }
        ];
        
        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'context-menu-item';
            menuItem.style.cssText = `
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                ${item.danger ? 'color: var(--error-color);' : ''}
            `;
            
            menuItem.innerHTML = `<i class="${item.icon}"></i> ${item.text}`;
            menuItem.onclick = () => {
                item.action();
                menu.remove();
            };
            
            menuItem.onmouseenter = () => {
                menuItem.style.background = 'var(--surface-hover)';
            };
            menuItem.onmouseleave = () => {
                menuItem.style.background = '';
            };
            
            menu.appendChild(menuItem);
        });
        
        document.body.appendChild(menu);
        
        // Remove menu when clicking outside
        const removeMenu = (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
                document.removeEventListener('click', removeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', removeMenu);
        }, 0);
    }

    duplicateBlock(blockId) {
        const originalBlock = this.blocks.get(blockId);
        if (!originalBlock) return;
        
        const newPosition = {
            x: originalBlock.x + 40,
            y: originalBlock.y + 40
        };
        
        const newBlockId = this.addBlock(originalBlock.type, newPosition, originalBlock.definition);
        const newBlock = this.blocks.get(newBlockId);
        
        if (newBlock) {
            newBlock.properties = Utils.deepClone(originalBlock.properties);
            
            const element = document.getElementById(`canvas-${newBlockId}`);
            if (element) {
                this.updateBlockPropertiesDisplay(element, newBlock.properties);
            }
        }
    }

    getBlockCategory(blockType) {
        const categories = {
            start: 'flow',
            end: 'flow',
            variable: 'data',
            assign: 'data',
            print: 'io',
            input: 'io',
            if: 'control',
            while: 'control',
            for: 'control'
        };
        return categories[blockType] || 'other';
    }

    // Zoom and pan controls
    zoomIn() {
        this.zoom = Math.min(3, this.zoom * 1.2);
        this.applyTransform();
    }

    zoomOut() {
        this.zoom = Math.max(0.1, this.zoom / 1.2);
        this.applyTransform();
    }

    resetZoom() {
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.applyTransform();
    }

    // History management
    saveState() {
        const state = {
            blocks: Utils.deepClone(Array.from(this.blocks.entries())),
            connections: Utils.deepClone(this.connections),
            zoom: this.zoom,
            panX: this.panX,
            panY: this.panY
        };
        
        // Remove future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        
        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
        
        this.updateUndoRedoButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            notifications.info('Undid last action');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            notifications.info('Redid action');
        }
    }

    restoreState(state) {
        // Clear current blocks
        this.canvasContent.innerHTML = '<div class="canvas-grid"></div>';
        this.blocks.clear();
        
        // Restore blocks
        state.blocks.forEach(([id, block]) => {
            this.blocks.set(id, block);
            const element = this.createBlockElement(block);
            this.canvasContent.appendChild(element);
        });
        
        // Restore connections and view
        this.connections = Utils.deepClone(state.connections);
        this.zoom = state.zoom;
        this.panX = state.panX;
        this.panY = state.panY;
        
        this.applyTransform();
        this.updateCanvasInfo();
        this.updateUndoRedoButtons();
    }

    updateUndoRedoButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        undoBtn.disabled = this.historyIndex <= 0;
        redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    // Clear canvas
    clear() {
        this.canvasContent.innerHTML = '<div class="canvas-grid"></div>';
        this.blocks.clear();
        this.connections = [];
        this.selectedBlock = null;
        this.saveState();
        this.updateCanvasInfo();
        notifications.success('Canvas cleared');
    }

    // Export canvas data
    export() {
        return {
            blocks: Array.from(this.blocks.values()),
            connections: this.connections,
            metadata: {
                zoom: this.zoom,
                panX: this.panX,
                panY: this.panY,
                timestamp: new Date().toISOString()
            }
        };
    }

    // Import canvas data
    import(data) {
        if (!data || !data.blocks) {
            throw new Error('Invalid canvas data');
        }
        
        this.clear();
        
        // Import blocks
        data.blocks.forEach(block => {
            this.blocks.set(block.id, block);
            const element = this.createBlockElement(block);
            this.canvasContent.appendChild(element);
        });
        
        // Import connections
        if (data.connections) {
            this.connections = data.connections;
        }
        
        // Restore view if metadata exists
        if (data.metadata) {
            this.zoom = data.metadata.zoom || 1;
            this.panX = data.metadata.panX || 0;
            this.panY = data.metadata.panY || 0;
        }
        
        this.applyTransform();
        this.updateCanvasInfo();
        this.saveState();
        
        notifications.success('Canvas imported successfully');
    }
}

// Create global instance
const canvas = new CanvasManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}