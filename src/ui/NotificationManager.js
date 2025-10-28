/**
 * NotificationManager - Display notifications for important events
 * 
 * Manages a queue of notifications that appear on screen and auto-fade.
 * Supports different notification types with appropriate styling.
 * 
 * Requirements: 9.5, 13.1, 13.2, 13.3, 13.4, 13.5
 */

/**
 * Notification types with their styling
 */
const NOTIFICATION_TYPES = {
    INFO: {
        background: '#2196F3',
        icon: 'ℹ️'
    },
    EXTINCTION: {
        background: '#D32F2F',
        icon: '💀'
    },
    MILESTONE: {
        background: '#FFD700',
        icon: '🎉'
    },
    WARNING: {
        background: '#FF9800',
        icon: '⚠️'
    },
    QUALITY: {
        background: '#9C27B0',
        icon: '🎨'
    }
};

/**
 * Notification configuration
 */
const NOTIFICATION_CONFIG = {
    DURATION: 5000,           // Default duration in ms
    FADE_DURATION: 300,       // Fade animation duration in ms
    STACK_SPACING: 10,        // Vertical spacing between notifications
    MAX_NOTIFICATIONS: 5,     // Maximum notifications shown at once
    POSITION_TOP: 20,         // Top position from viewport
    POSITION_RIGHT: 20        // Right position from viewport
};

export class NotificationManager {
    constructor() {
        this.notifications = [];
        this.nextId = 0;
        this.container = null;
        
        // Create notification container
        this.createContainer();
    }
    
    /**
     * Create the notification container element
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: ${NOTIFICATION_CONFIG.POSITION_TOP}px;
            right: ${NOTIFICATION_CONFIG.POSITION_RIGHT}px;
            z-index: 10002;
            pointer-events: none;
        `;
        document.body.appendChild(this.container);
    }
    
    /**
     * Show a notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (INFO, SUCCESS, WARNING, ERROR, QUALITY)
     * @param {number} duration - Duration in ms (default: 5000)
     * @returns {number} Notification ID
     */
    notify(message, type = 'INFO', duration = NOTIFICATION_CONFIG.DURATION) {
        const typeConfig = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.INFO;
        
        const notification = {
            id: this.nextId++,
            message,
            type,
            typeConfig,
            duration,
            createdAt: performance.now(),
            element: null
        };
        
        // Create notification element
        notification.element = this.createNotificationElement(notification);
        
        // Add to notifications array
        this.notifications.push(notification);
        
        // Remove oldest if exceeding max
        if (this.notifications.length > NOTIFICATION_CONFIG.MAX_NOTIFICATIONS) {
            this.removeNotification(this.notifications[0].id);
        }
        
        // Add to DOM
        this.container.appendChild(notification.element);
        
        // Trigger animation
        requestAnimationFrame(() => {
            notification.element.classList.add('show');
        });
        
        // Update positions
        this.updatePositions();
        
        // Auto-remove after duration
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
        
        return notification.id;
    }
    
    /**
     * Create notification DOM element
     * @param {Object} notification - Notification object
     * @returns {HTMLElement} Notification element
     */
    createNotificationElement(notification) {
        const element = document.createElement('div');
        element.className = 'notification';
        element.style.cssText = `
            background: ${notification.typeConfig.background};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            margin-bottom: ${NOTIFICATION_CONFIG.STACK_SPACING}px;
            opacity: 0;
            transform: translateX(400px);
            transition: all ${NOTIFICATION_CONFIG.FADE_DURATION}ms ease;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
            pointer-events: auto;
            cursor: pointer;
            min-width: 250px;
            max-width: 400px;
        `;
        
        // Add icon
        const icon = document.createElement('span');
        icon.textContent = notification.typeConfig.icon;
        icon.style.fontSize = '18px';
        element.appendChild(icon);
        
        // Add message
        const messageSpan = document.createElement('span');
        messageSpan.textContent = notification.message;
        messageSpan.style.flex = '1';
        element.appendChild(messageSpan);
        
        // Click to dismiss
        element.addEventListener('click', () => {
            this.removeNotification(notification.id);
        });
        
        return element;
    }
    
    /**
     * Remove a notification
     * @param {number} id - Notification ID
     */
    removeNotification(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index === -1) return;
        
        const notification = this.notifications[index];
        
        // Fade out
        notification.element.classList.remove('show');
        notification.element.style.opacity = '0';
        notification.element.style.transform = 'translateX(400px)';
        
        // Remove from DOM after animation
        setTimeout(() => {
            if (notification.element.parentNode) {
                notification.element.parentNode.removeChild(notification.element);
            }
            
            // Remove from array
            const currentIndex = this.notifications.findIndex(n => n.id === id);
            if (currentIndex !== -1) {
                this.notifications.splice(currentIndex, 1);
            }
            
            // Update positions
            this.updatePositions();
        }, NOTIFICATION_CONFIG.FADE_DURATION);
    }
    
    /**
     * Update positions of all notifications
     */
    updatePositions() {
        // Notifications are stacked vertically using margin-bottom
        // No need to manually position each one
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        const ids = this.notifications.map(n => n.id);
        ids.forEach(id => this.removeNotification(id));
    }
    
    /**
     * Show quality change notification
     * @param {string} newQuality - New quality level
     * @param {string} oldQuality - Previous quality level
     * @param {boolean} manual - Whether change was manual
     */
    notifyQualityChange(newQuality, oldQuality, manual = false) {
        const isUpgrade = this.isQualityUpgrade(newQuality, oldQuality);
        const action = isUpgrade ? 'increased' : 'reduced';
        const reason = manual ? 'manually' : 'automatically';
        
        let message;
        if (manual) {
            message = `Quality set to ${newQuality}`;
        } else {
            message = `Quality ${action} to ${newQuality}`;
            if (!isUpgrade) {
                message += ' to maintain performance';
            }
        }
        
        this.notify(message, 'QUALITY', 4000);
    }
    
    /**
     * Check if quality change is an upgrade
     * @param {string} newQuality - New quality level
     * @param {string} oldQuality - Old quality level
     * @returns {boolean} True if upgrade
     */
    isQualityUpgrade(newQuality, oldQuality) {
        const qualityOrder = ['LOW', 'MEDIUM', 'HIGH'];
        const newIndex = qualityOrder.indexOf(newQuality);
        const oldIndex = qualityOrder.indexOf(oldQuality);
        return newIndex > oldIndex;
    }
    
    /**
     * Show extinction notification
     * @param {string} speciesName - Name of extinct species
     */
    notifyExtinction(speciesName) {
        this.notify(`${speciesName} has gone extinct!`, 'EXTINCTION', 7000);
    }
    
    /**
     * Show milestone notification
     * @param {string} message - Milestone message
     */
    notifyMilestone(message) {
        this.notify(message, 'MILESTONE', 6000);
    }
    
    /**
     * Show warning notification
     * @param {string} message - Warning message
     */
    notifyWarning(message) {
        this.notify(message, 'WARNING', 5000);
    }
    
    /**
     * Show info notification
     * @param {string} message - Info message
     */
    notifyInfo(message) {
        this.notify(message, 'INFO', 4000);
    }
    
    /**
     * Update notification system (called each frame)
     * @param {number} dt - Delta time
     */
    update(dt) {
        // Currently notifications auto-remove via setTimeout
        // This method is here for future enhancements
    }
}

// Add CSS class for show state
const style = document.createElement('style');
style.textContent = `
    .notification.show {
        opacity: 1 !important;
        transform: translateX(0) !important;
    }
`;
document.head.appendChild(style);
