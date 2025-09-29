// Notification system for the Visual Programming Compiler

class NotificationManager {
    constructor() {
        this.container = document.getElementById('notifications');
        this.notifications = new Map();
        this.defaultDuration = 5000; // 5 seconds
    }

    show(message, type = 'info', duration = null, actions = null) {
        const id = Utils.generateId();
        const notification = this.create(id, message, type, duration || this.defaultDuration, actions);
        
        this.container.appendChild(notification);
        this.notifications.set(id, notification);

        // Trigger animation
        requestAnimationFrame(() => {
            notification.classList.add('show');
        });

        // Auto-dismiss if duration is set
        if (duration !== 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration || this.defaultDuration);
        }

        return id;
    }

    create(id, message, type, duration, actions) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.setAttribute('data-id', id);

        // Create header
        const header = document.createElement('div');
        header.className = 'notification-header';

        const title = document.createElement('div');
        title.className = 'notification-title';
        title.textContent = this.getTitle(type);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification-close';
        closeBtn.innerHTML = '<i class="fas fa-times"></i>';
        closeBtn.onclick = () => this.dismiss(id);

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create message
        const messageEl = document.createElement('div');
        messageEl.className = 'notification-message';
        
        if (typeof message === 'string') {
            messageEl.textContent = message;
        } else {
            messageEl.appendChild(message);
        }

        notification.appendChild(header);
        notification.appendChild(messageEl);

        // Add actions if provided
        if (actions && actions.length > 0) {
            const actionsEl = document.createElement('div');
            actionsEl.className = 'notification-actions';
            
            actions.forEach(action => {
                const btn = document.createElement('button');
                btn.className = `btn btn-small ${action.type || 'btn-secondary'}`;
                btn.textContent = action.label;
                btn.onclick = () => {
                    action.handler();
                    if (action.dismissOnClick !== false) {
                        this.dismiss(id);
                    }
                };
                actionsEl.appendChild(btn);
            });
            
            notification.appendChild(actionsEl);
        }

        return notification;
    }

    dismiss(id) {
        const notification = this.notifications.get(id);
        if (!notification) return;

        notification.classList.remove('show');
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
            this.notifications.delete(id);
        }, 300); // Match CSS transition duration
    }

    dismissAll() {
        this.notifications.forEach((notification, id) => {
            this.dismiss(id);
        });
    }

    getTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    // Convenience methods
    success(message, duration, actions) {
        return this.show(message, 'success', duration, actions);
    }

    error(message, duration, actions) {
        return this.show(message, 'error', duration || 8000, actions); // Longer duration for errors
    }

    warning(message, duration, actions) {
        return this.show(message, 'warning', duration, actions);
    }

    info(message, duration, actions) {
        return this.show(message, 'info', duration, actions);
    }

    // Show compilation result notification
    showCompilationResult(result) {
        if (result.success) {
            this.success('Code compiled successfully! Check the output panels for results.');
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.innerHTML = `
                <div>Compilation failed at stage: <strong>${result.stage}</strong></div>
                <ul style="margin: 0.5rem 0 0 1rem;">
                    ${result.errors.map(error => `<li>${Utils.sanitizeHtml(error)}</li>`).join('')}
                </ul>
            `;
            
            this.error(errorMessage, 10000, [
                {
                    label: 'Show Details',
                    type: 'btn-primary',
                    handler: () => {
                        console.error('Compilation errors:', result.errors);
                        // Could open a detailed error modal here
                    }
                }
            ]);
        }
    }

    // Show API connection status
    showApiStatus(isConnected) {
        if (isConnected) {
            this.success('Successfully connected to Gemini AI API');
        } else {
            this.error('Failed to connect to Gemini AI API. Please check your configuration.', 0);
        }
    }

    // Show save status
    showSaveStatus(success, filename = 'program') {
        if (success) {
            this.success(`Program "${filename}" saved successfully`);
        } else {
            this.error(`Failed to save program "${filename}"`);
        }
    }

    // Show validation results
    showValidationResult(result) {
        if (result.isValid) {
            this.success(`Program is valid! Found ${result.block_count} blocks and ${result.connection_count} connections.`);
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.innerHTML = `
                <div>Program validation failed:</div>
                <ul style="margin: 0.5rem 0 0 1rem;">
                    ${result.errors.map(error => `<li>${Utils.sanitizeHtml(error)}</li>`).join('')}
                </ul>
            `;
            this.warning(errorMessage, 8000);
        }
    }

    // Show copy status
    showCopyStatus(success, type = 'content') {
        if (success) {
            this.success(`${Utils.camelToTitle(type)} copied to clipboard`);
        } else {
            this.error(`Failed to copy ${type} to clipboard`);
        }
    }

    // Show download status
    showDownloadStatus(success, filename) {
        if (success) {
            this.success(`File "${filename}" downloaded successfully`);
        } else {
            this.error(`Failed to download file "${filename}"`);
        }
    }

    // Show loading operation with progress
    showProgress(message, progress = 0) {
        const id = 'progress-notification';
        
        // Remove existing progress notification
        if (this.notifications.has(id)) {
            this.dismiss(id);
        }

        const progressEl = document.createElement('div');
        progressEl.innerHTML = `
            <div style="margin-bottom: 0.5rem;">${message}</div>
            <div style="background: var(--background); height: 4px; border-radius: 2px; overflow: hidden;">
                <div style="background: var(--primary-color); height: 100%; width: ${progress}%; transition: width 0.3s ease;"></div>
            </div>
        `;

        const notificationId = this.show(progressEl, 'info', 0); // Don't auto-dismiss
        this.notifications.set(id, this.notifications.get(notificationId));
        this.notifications.delete(notificationId);
        
        return {
            update: (newMessage, newProgress) => {
                const notification = this.notifications.get(id);
                if (notification) {
                    const messageEl = notification.querySelector('.notification-message > div');
                    const progressBar = notification.querySelector('[style*="background: var(--primary-color)"]');
                    if (messageEl && newMessage) messageEl.textContent = newMessage;
                    if (progressBar && typeof newProgress === 'number') {
                        progressBar.style.width = `${newProgress}%`;
                    }
                }
            },
            complete: (finalMessage) => {
                setTimeout(() => {
                    this.dismiss(id);
                    if (finalMessage) {
                        this.success(finalMessage);
                    }
                }, 500);
            }
        };
    }
}

// Create global instance
const notifications = new NotificationManager();

// Export for module usage if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NotificationManager;
}