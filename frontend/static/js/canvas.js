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
        
        // Session management
        this.currentSessionId = null;
        this.autoSaveTimeout = null;
        this.autoSaveDelay = 1000; // 1 second
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupGrid();
        this.setupConnectionSVG();
        this.updateCanvasInfo();
        
        // Load the most recent session on startup
        this.loadFromJSON();
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
        blockElement.blockData = block; // Store block data on the element
        this.canvasContent.appendChild(blockElement);
        
        // Store DOM element in blocks map
        this.blocks.set(blockId, blockElement);
        
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

    drawConnection(fromBlockElement, toBlockElement) {
        // Get block data from DOM elements
        const fromBlock = fromBlockElement.blockData || { x: 0, y: 0 };
        const toBlock = toBlockElement.blockData || { x: 0, y: 0 };
        
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
        const blockElement = this.blocks.get(blockId);
        if (!blockElement) return;
        
        // Get block type for notification
        const blockType = blockElement.blockData ? blockElement.blockData.type : 'unknown';
        
        // Remove from DOM
        if (blockElement.parentNode) {
            blockElement.parentNode.removeChild(blockElement);
        }
        
        // Remove from blocks map
        this.blocks.delete(blockId);
        
        // Remove any connections involving this block
        this.connections = this.connections.filter(conn => 
            conn.from !== blockId && conn.to !== blockId
        );
        
        // Deselect if this was the selected block
        if (this.selectedBlock && this.selectedBlock.blockData && this.selectedBlock.blockData.id === blockId) {
            this.selectedBlock = null;
        }
        
        // Save state for undo
        this.saveState();
        
        // Update info
        this.updateCanvasInfo();
        
        notifications.info(`Removed ${Utils.camelToTitle(blockType)} block`);
    }

    deleteBlock(blockElement) {
        if (!blockElement || !blockElement.blockData) return;
        this.removeBlock(blockElement.blockData.id);
    }

    editBlockProperties(blockIdOrElement) {
        let block, blockElement, blockId;
        
        // Handle both blockId (string) and blockElement (DOM element) parameters
        if (typeof blockIdOrElement === 'string') {
            blockId = blockIdOrElement;
            blockElement = this.blocks.get(blockId);
            if (blockElement && blockElement.blockData) {
                block = blockElement.blockData;
            }
        } else if (blockIdOrElement && blockIdOrElement.blockData) {
            blockElement = blockIdOrElement;
            block = blockElement.blockData;
            blockId = block.id;
        }
        
        if (!block || !blockElement) {
            console.error('Block not found for editing properties');
            return;
        }
        
        // Find the block type definition
        const blockType = blockManager.getBlockDefinition(block.type);
        if (!blockType || !blockType.inputs) {
            console.warn('No properties defined for block type:', block.type);
            return;
        }
        
        modal.show('blockProperties', {
            blockType: block.type,
            blockDefinition: blockType,
            currentProperties: block.properties || {},
            onSave: (newProperties) => {
                try {
                    // Update block properties
                    block.properties = { ...block.properties, ...newProperties };
                    
                    // Update visual display
                    this.updateBlockPropertiesDisplay(blockElement);
                    
                    // Save state for undo
                    this.saveState();
                    
                    notifications.success('Block properties updated');
                } catch (error) {
                    console.error('Error updating block properties:', error);
                    notifications.error('Failed to update block properties');
                }
            }
        });
    }

    updateBlockPropertiesDisplay(blockElement) {
        if (!blockElement || !blockElement.blockData) {
            return;
        }
        
        const blockData = blockElement.blockData;
        const properties = blockData.properties || {};
        
        // Update block title if it has a custom label
        const titleElement = blockElement.querySelector('.block-title');
        if (titleElement && properties.label) {
            titleElement.textContent = properties.label;
        }
        
        // Create or update properties display
        let propertiesEl = blockElement.querySelector('.block-properties');
        if (!propertiesEl) {
            propertiesEl = document.createElement('div');
            propertiesEl.className = 'block-properties';
            const content = blockElement.querySelector('.block-content');
            if (content) {
                content.appendChild(propertiesEl);
            }
        }
        
        // Clear existing content
        propertiesEl.innerHTML = '';
        
        // Add properties that have values (excluding empty strings)
        Object.entries(properties).forEach(([key, value]) => {
            if (value && value.toString().trim()) {
                const item = document.createElement('div');
                item.className = 'property-item';
                item.innerHTML = `<span class="property-key">${key}:</span> <span class="property-value">${value.toString()}</span>`;
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
        const originalBlockElement = this.blocks.get(blockId);
        if (!originalBlockElement || !originalBlockElement.blockData) return;
        
        const originalBlock = originalBlockElement.blockData;
        const newPosition = {
            x: originalBlock.x + 40,
            y: originalBlock.y + 40
        };
        
        const newBlockId = this.addBlock(originalBlock.type, newPosition, originalBlock.definition);
        const newBlockElement = this.blocks.get(newBlockId);
        
        if (newBlockElement && newBlockElement.blockData) {
            newBlockElement.blockData.properties = Utils.deepClone(originalBlock.properties);
            this.updateBlockPropertiesDisplay(newBlockElement);
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

    // Canvas management helpers
    clearCanvas() {
        // Remove all blocks from DOM and clear the blocks map
        this.blocks.forEach(block => {
            if (block.parentNode) {
                block.parentNode.removeChild(block);
            }
        });
        this.blocks.clear();
        
        // Clear connections
        this.connections = [];
        this.renderConnections();
        
        // Reset counter
        this.blockCounter = 0;
    }

    setupBlockContent(blockElement, blockType) {
        // Create block structure
        const header = document.createElement('div');
        header.className = 'block-header';
        
        const title = document.createElement('div');
        title.className = 'block-title';
        title.textContent = blockType.label;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'block-delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.title = 'Delete block';
        
        header.appendChild(title);
        header.appendChild(deleteBtn);
        
        const content = document.createElement('div');
        content.className = 'block-content';
        
        // Add input ports
        if (blockType.inputs && blockType.inputs.length > 0) {
            const inputPorts = document.createElement('div');
            inputPorts.className = 'block-ports input-ports';
            blockType.inputs.forEach(input => {
                const port = document.createElement('div');
                port.className = 'port input-port';
                port.dataset.portName = input.name;
                port.title = input.label;
                inputPorts.appendChild(port);
            });
            content.appendChild(inputPorts);
        }
        
        // Add output ports
        if (blockType.outputs && blockType.outputs.length > 0) {
            const outputPorts = document.createElement('div');
            outputPorts.className = 'block-ports output-ports';
            blockType.outputs.forEach(output => {
                const port = document.createElement('div');
                port.className = 'port output-port';
                port.dataset.portName = output.name;
                port.title = output.label;
                outputPorts.appendChild(port);
            });
            content.appendChild(outputPorts);
        }
        
        blockElement.appendChild(header);
        blockElement.appendChild(content);
        
        // Set up delete button
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.deleteBlock(blockElement);
        });
    }

    setupBlockEventListeners(blockElement) {
        // Make block draggable
        blockElement.draggable = false; // We'll handle this manually
        
        // Block selection and dragging
        blockElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('block-delete-btn')) return;
            
            e.stopPropagation();
            this.selectBlock(blockElement);
            
            this.isDragging = true;
            this.dragData = {
                block: blockElement,
                offsetX: e.clientX - blockElement.offsetLeft,
                offsetY: e.clientY - blockElement.offsetTop
            };
        });
        
        // Double-click to edit properties
        blockElement.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            this.editBlockProperties(blockElement);
        });
    }

    updateBlockPropertiesDisplay(blockElement) {
        const blockData = blockElement.blockData;
        if (!blockData || !blockData.properties) return;
        
        // Update any visual representations of properties
        // This is a placeholder - you can extend this based on your block types
        const title = blockElement.querySelector('.block-title');
        if (title && blockData.properties.label) {
            title.textContent = blockData.properties.label;
        }
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
        
        // Schedule auto-save to JSON
        this.scheduleAutoSave();
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
        if (!state) return;
        
        // Store the connection SVG to avoid removing it
        const connectionSVG = this.connectionSVG;
        
        // Clear existing blocks more carefully
        this.blocks.forEach(blockElement => {
            if (blockElement && blockElement.parentNode === this.canvasContent) {
                this.canvasContent.removeChild(blockElement);
            }
        });
        this.blocks.clear();
        
        // Restore blocks from state data
        if (state.blocks) {
            state.blocks.forEach(([id, blockData]) => {
                try {
                    // Recreate the block element
                    const blockElement = document.createElement('div');
                    blockElement.className = 'canvas-block';
                    blockElement.dataset.blockType = blockData.type;
                    blockElement.dataset.blockId = id;
                    blockElement.blockData = Utils.deepClone(blockData);
                    
                    // Position the block
                    blockElement.style.left = `${blockData.x || 0}px`;
                    blockElement.style.top = `${blockData.y || 0}px`;
                    
                    // Find the block type definition
                    const blockType = blockManager.getBlockDefinition(blockData.type);
                    if (blockType) {
                        this.setupBlockContent(blockElement, blockType);
                        this.setupBlockEventListeners(blockElement);
                        this.updateBlockPropertiesDisplay(blockElement);
                    }
                    
                    // Add to canvas and map
                    this.canvasContent.appendChild(blockElement);
                    this.blocks.set(id, blockElement);
                } catch (error) {
                    console.error('Error restoring block:', id, error);
                }
            });
        }
        
        // Restore connections and view
        this.connections = Utils.deepClone(state.connections || []);
        this.zoom = state.zoom || 1;
        this.panX = state.panX || 0;
        this.panY = state.panY || 0;
        
        // Re-render connections
        this.renderConnections();
        
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
            blocks: Array.from(this.blocks.values()).map(blockElement => {
                if (blockElement.blockData) {
                    // DOM element with blockData
                    const block = blockElement.blockData;
                    const rect = blockElement.getBoundingClientRect();
                    const canvasRect = this.canvasContent.getBoundingClientRect();
                    
                    return {
                        id: block.id,
                        type: block.type,
                        x: (rect.left - canvasRect.left - this.panX) / this.zoom,
                        y: (rect.top - canvasRect.top - this.panY) / this.zoom,
                        properties: block.properties || {},
                        definition: block.definition || {}
                    };
                } else if (blockElement.id && blockElement.type) {
                    // Plain block object (fallback)
                    return blockElement;
                }
                return null;
            }).filter(block => block !== null),
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
            const element = this.createBlockElement(block);
            element.blockData = block; // Store block data on the element
            this.blocks.set(block.id, element);
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

    // JSON Persistence Methods
    async saveToJSON() {
        try {
            const canvasState = {
                session_id: this.currentSessionId,
                blocks: Array.from(this.blocks.values()).map(blockElement => {
                    // Handle both DOM elements and plain block objects
                    if (blockElement.blockData) {
                        // DOM element with blockData
                        const block = blockElement.blockData;
                        const rect = blockElement.getBoundingClientRect();
                        const canvasRect = this.canvasContent.getBoundingClientRect();
                        
                        return {
                            id: block.id,
                            type: block.type,
                            x: (rect.left - canvasRect.left - this.panX) / this.zoom,
                            y: (rect.top - canvasRect.top - this.panY) / this.zoom,
                            properties: block.properties || {},
                            language: block.language || this.currentLanguage
                        };
                    } else if (blockElement.id && blockElement.type) {
                        // Plain block object
                        return {
                            id: blockElement.id,
                            type: blockElement.type,
                            x: blockElement.x || 0,
                            y: blockElement.y || 0,
                            properties: blockElement.properties || {},
                            language: blockElement.language || this.currentLanguage
                        };
                    } else {
                        console.warn('Invalid block found:', blockElement);
                        return null;
                    }
                }).filter(block => block !== null), // Remove any null blocks
                connections: this.connections.map(conn => ({
                    from: conn.from,
                    to: conn.to,
                    fromPort: conn.fromPort,
                    toPort: conn.toPort
                })),
                zoom: this.zoom,
                panX: this.panX,
                panY: this.panY,
                language: this.currentLanguage
            };

            const response = await fetch('/api/canvas/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(canvasState)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success) {
                this.currentSessionId = result.session_id;
                console.log('Canvas saved successfully:', result.session_id);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error saving canvas:', error);
            notifications.error('Failed to save canvas state');
        }
    }

    async loadFromJSON(sessionId = null) {
        try {
            const url = sessionId ? `/api/canvas/load/${sessionId}` : '/api/canvas/load';
            const response = await fetch(url);

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('No saved session found');
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            if (result.success && result.canvas_state) {
                this.restoreFromJSONState(result.canvas_state);
                this.currentSessionId = result.canvas_state.session_id;
                notifications.success('Canvas loaded successfully');
            } else if (result.message) {
                console.log(result.message);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error loading canvas:', error);
            notifications.error('Failed to load canvas state');
        }
    }

    restoreFromJSONState(canvasState) {
        // Clear existing blocks and connections
        this.clearCanvas();

        // Restore blocks
        if (canvasState.blocks) {
            canvasState.blocks.forEach(blockData => {
                try {
                    this.createBlockFromData(blockData);
                } catch (error) {
                    console.error('Error creating block:', blockData, error);
                }
            });
        }

        // Restore connections
        if (canvasState.connections) {
            this.connections = canvasState.connections.map(connData => ({
                from: connData.from,
                to: connData.to,
                fromPort: connData.fromPort,
                toPort: connData.toPort
            }));
            this.renderConnections();
        }

        // Restore view state
        this.zoom = canvasState.zoom || 1;
        this.panX = canvasState.panX || 0;
        this.panY = canvasState.panY || 0;
        this.currentLanguage = canvasState.language || 'python';

        // Update UI
        this.applyTransform();
        this.updateCanvasInfo();

        console.log('Canvas state restored from JSON');
    }

    scheduleAutoSave() {
        if (this.autoSaveTimeout) {
            clearTimeout(this.autoSaveTimeout);
        }
        
        this.autoSaveTimeout = setTimeout(() => {
            this.saveToJSON();
        }, this.autoSaveDelay);
    }

    createBlockFromData(blockData) {
        // Find the block type definition
        const blockType = blockManager.getBlockDefinition(blockData.type);
        if (!blockType) {
            console.warn('Unknown block type:', blockData.type);
            return null;
        }

        // Create the block element
        const blockElement = document.createElement('div');
        blockElement.className = 'canvas-block';
        blockElement.dataset.blockType = blockData.type;
        blockElement.dataset.blockId = blockData.id;

        // Set up block data
        blockElement.blockData = {
            id: blockData.id,
            type: blockData.type,
            properties: blockData.properties || {},
            language: blockData.language || this.currentLanguage
        };

        // Create block content
        this.setupBlockContent(blockElement, blockType);

        // Position the block
        blockElement.style.left = `${blockData.x}px`;
        blockElement.style.top = `${blockData.y}px`;

        // Add to canvas and blocks map
        this.canvasContent.appendChild(blockElement);
        this.blocks.set(blockData.id, blockElement);

        // Set up block event listeners
        this.setupBlockEventListeners(blockElement);

        // Update block display with properties
        this.updateBlockPropertiesDisplay(blockElement);

        return blockElement;
    }
}

// Create global instance
const canvas = new CanvasManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CanvasManager;
}