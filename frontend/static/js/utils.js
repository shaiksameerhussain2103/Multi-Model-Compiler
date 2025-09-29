// Utility functions for the Visual Programming Compiler

class Utils {
    // Generate unique ID
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    // Debounce function
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== "object") return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => Utils.deepClone(item));
        if (typeof obj === "object") {
            const copy = {};
            Object.keys(obj).forEach(key => {
                copy[key] = Utils.deepClone(obj[key]);
            });
            return copy;
        }
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format date
    static formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }

    // Sanitize HTML
    static sanitizeHtml(str) {
        const temp = document.createElement('div');
        temp.textContent = str;
        return temp.innerHTML;
    }

    // Get icon for block type
    static getBlockIcon(blockType) {
        const icons = {
            start: 'fas fa-play',
            end: 'fas fa-stop',
            variable: 'fas fa-box',
            print: 'fas fa-print',
            input: 'fas fa-keyboard',
            assign: 'fas fa-equals',
            if: 'fas fa-code-branch',
            while: 'fas fa-repeat',
            for: 'fas fa-rotate-right',
            math: 'fas fa-calculator',
            compare: 'fas fa-balance-scale',
            logical: 'fas fa-sitemap'
        };
        return icons[blockType] || 'fas fa-cube';
    }

    // Get category color
    static getCategoryColor(category) {
        const colors = {
            flow: '#10b981',      // green
            data: '#4f46e5',      // indigo
            io: '#6366f1',        // purple
            control: '#f59e0b',   // amber
            math: '#06b6d4',      // cyan
            logic: '#8b5cf6'      // violet
        };
        return colors[category] || '#6b7280';
    }

    // Calculate distance between two points
    static distance(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Check if point is inside rectangle
    static pointInRect(point, rect) {
        return point.x >= rect.x && 
               point.x <= rect.x + rect.width &&
               point.y >= rect.y && 
               point.y <= rect.y + rect.height;
    }

    // Get mouse position relative to element
    static getMousePos(event, element) {
        const rect = element.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    // Create SVG arrow marker
    static createArrowMarker(svg) {
        const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'));
        
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
        marker.setAttribute('id', 'arrowhead');
        marker.setAttribute('markerWidth', '10');
        marker.setAttribute('markerHeight', '7');
        marker.setAttribute('refX', '9');
        marker.setAttribute('refY', '3.5');
        marker.setAttribute('orient', 'auto');
        
        const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        polygon.setAttribute('points', '0 0, 10 3.5, 0 7');
        polygon.setAttribute('fill', 'var(--primary-color)');
        
        marker.appendChild(polygon);
        defs.appendChild(marker);
    }

    // Download file
    static downloadFile(content, filename, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            return true;
        }
    }

    // Show/hide loading
    static showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const messageEl = document.getElementById('loadingMessage');
        if (messageEl) messageEl.textContent = message;
        if (overlay) {
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    static hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Validate form inputs
    static validateForm(formElement) {
        const errors = [];
        const inputs = formElement.querySelectorAll('input[required], select[required], textarea[required]');
        
        inputs.forEach(input => {
            if (!input.value.trim()) {
                errors.push(`${input.previousElementSibling?.textContent || 'Field'} is required`);
                input.classList.add('error');
            } else {
                input.classList.remove('error');
            }
        });

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Format code with syntax highlighting
    static highlightCode(code, language = 'javascript') {
        if (typeof Prism !== 'undefined') {
            const grammar = Prism.languages[language] || Prism.languages.javascript;
            return Prism.highlight(code, grammar, language);
        }
        return Utils.sanitizeHtml(code);
    }

    // Convert camelCase to Title Case
    static camelToTitle(str) {
        return str
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    // Event emitter class
    static createEventEmitter() {
        const events = {};
        
        return {
            on(event, callback) {
                if (!events[event]) events[event] = [];
                events[event].push(callback);
            },
            
            off(event, callback) {
                if (!events[event]) return;
                events[event] = events[event].filter(cb => cb !== callback);
            },
            
            emit(event, data) {
                if (!events[event]) return;
                events[event].forEach(callback => callback(data));
            }
        };
    }

    // Local storage helpers
    static storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Unable to save to localStorage:', e);
                return false;
            }
        },
        
        get(key, defaultValue = null) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Unable to read from localStorage:', e);
                return defaultValue;
            }
        },
        
        remove(key) {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('Unable to remove from localStorage:', e);
                return false;
            }
        },
        
        clear() {
            try {
                localStorage.clear();
                return true;
            } catch (e) {
                console.warn('Unable to clear localStorage:', e);
                return false;
            }
        }
    };
}

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}