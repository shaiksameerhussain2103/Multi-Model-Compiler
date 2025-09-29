// Resizable sidebar functionality
class ResizableSidebar {
    constructor() {
        this.isResizing = false;
        this.currentResizer = null;
        this.startX = 0;
        this.startWidth = 0;
        this.minWidth = 200;
        this.maxWidth = 600;
        
        this.initializeResizers();
    }
    
    initializeResizers() {
        // Initialize left sidebar resizer
        const leftResizeHandle = document.getElementById('leftResizeHandle');
        const leftSidebar = document.getElementById('sidebar');
        
        if (leftResizeHandle && leftSidebar) {
            this.setupResizer(leftResizeHandle, leftSidebar, 'left');
        }
        
        // Initialize right sidebar resizer
        const rightResizeHandle = document.getElementById('rightResizeHandle');
        const rightSidebar = document.getElementById('outputPanel');
        
        if (rightResizeHandle && rightSidebar) {
            this.setupResizer(rightResizeHandle, rightSidebar, 'right');
        }
        
        // Global mouse events
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    }
    
    setupResizer(resizeHandle, sidebar, side) {
        resizeHandle.addEventListener('mousedown', (e) => {
            this.startResize(e, sidebar, side);
        });
        
        // Add hover effects
        resizeHandle.addEventListener('mouseenter', () => {
            if (!this.isResizing) {
                resizeHandle.style.backgroundColor = 'var(--primary-color)';
            }
        });
        
        resizeHandle.addEventListener('mouseleave', () => {
            if (!this.isResizing) {
                resizeHandle.style.backgroundColor = '';
            }
        });
    }
    
    startResize(e, sidebar, side) {
        e.preventDefault();
        
        this.isResizing = true;
        this.currentSidebar = sidebar;
        this.currentSide = side;
        this.startX = e.clientX;
        this.startWidth = parseInt(window.getComputedStyle(sidebar).width, 10);
        
        // Add visual feedback
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        
        // Add resizing class to the resize handle
        const resizeHandle = side === 'left' 
            ? document.getElementById('leftResizeHandle')
            : document.getElementById('rightResizeHandle');
        resizeHandle.classList.add('resizing');
        
        // Prevent text selection and add overlay
        this.addResizeOverlay();
    }
    
    handleMouseMove(e) {
        if (!this.isResizing || !this.currentSidebar) return;
        
        e.preventDefault();
        
        let newWidth;
        
        if (this.currentSide === 'left') {
            // For left sidebar, width increases when moving right
            const diff = e.clientX - this.startX;
            newWidth = this.startWidth + diff;
        } else {
            // For right sidebar, width increases when moving left
            const diff = this.startX - e.clientX;
            newWidth = this.startWidth + diff;
        }
        
        // Apply constraints
        newWidth = Math.max(this.minWidth, Math.min(newWidth, this.maxWidth));
        
        // Special handling for collapsed sidebar
        if (this.currentSidebar.classList.contains('collapsed')) {
            if (newWidth > 100) {
                this.currentSidebar.classList.remove('collapsed');
            }
        } else {
            if (newWidth < 100) {
                this.currentSidebar.classList.add('collapsed');
                newWidth = 60;
            }
        }
        
        // Apply the new width
        this.currentSidebar.style.width = newWidth + 'px';
        
        // Update the canvas layout if needed
        this.updateCanvasLayout();
    }
    
    handleMouseUp() {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        // Reset cursor and selection
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        
        // Remove resizing class
        const resizeHandle = this.currentSide === 'left'
            ? document.getElementById('leftResizeHandle')
            : document.getElementById('rightResizeHandle');
        resizeHandle.classList.remove('resizing');
        resizeHandle.style.backgroundColor = '';
        
        // Remove overlay
        this.removeResizeOverlay();
        
        // Clear current references
        this.currentSidebar = null;
        this.currentSide = null;
    }
    
    addResizeOverlay() {
        // Add a transparent overlay to prevent interference with canvas and other elements
        const overlay = document.createElement('div');
        overlay.id = 'resize-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100vw';
        overlay.style.height = '100vh';
        overlay.style.zIndex = '9999';
        overlay.style.cursor = 'col-resize';
        overlay.style.backgroundColor = 'transparent';
        
        document.body.appendChild(overlay);
    }
    
    removeResizeOverlay() {
        const overlay = document.getElementById('resize-overlay');
        if (overlay) {
            overlay.remove();
        }
    }
    
    updateCanvasLayout() {
        // Trigger canvas update if the canvas manager exists
        if (window.canvasManager && window.canvasManager.updateCanvasSize) {
            window.canvasManager.updateCanvasSize();
        }
    }
    
    // Public method to toggle sidebar collapse
    toggleSidebar(side) {
        const sidebar = side === 'left' 
            ? document.getElementById('sidebar')
            : document.getElementById('outputPanel');
            
        if (sidebar) {
            sidebar.classList.toggle('collapsed');
            
            if (sidebar.classList.contains('collapsed')) {
                sidebar.style.width = '60px';
            } else {
                sidebar.style.width = side === 'left' ? '320px' : '400px';
            }
            
            this.updateCanvasLayout();
        }
    }
}

// Initialize resizable sidebars when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resizableSidebar = new ResizableSidebar();
});

// Export for use in other modules
window.ResizableSidebar = ResizableSidebar;