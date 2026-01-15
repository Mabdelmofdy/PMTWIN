/**
 * Notification/Toast System
 * Provides user feedback for actions (success, error, warning, info)
 */

(function() {
  'use strict';

  let notificationContainer = null;
  let notificationIdCounter = 0;

  /**
   * Initialize notification container
   */
  function init() {
    if (notificationContainer) return;
    
    notificationContainer = document.createElement('div');
    notificationContainer.className = 'notification-container';
    notificationContainer.setAttribute('aria-live', 'polite');
    notificationContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(notificationContainer);
  }

  /**
   * Show a notification
   * @param {Object} options - Notification options
   * @param {string} options.type - 'success', 'error', 'warning', 'info'
   * @param {string} options.title - Notification title
   * @param {string} options.message - Notification message
   * @param {number} options.duration - Auto-dismiss duration in ms (default: 5000, 0 = no auto-dismiss)
   * @param {boolean} options.dismissible - Whether notification can be dismissed (default: true)
   * @returns {string} - Notification ID
   */
  function show(options) {
    init();
    
    const {
      type = 'info',
      title = '',
      message = '',
      duration = 5000,
      dismissible = true
    } = options;

    const notificationId = `notification-${++notificationIdCounter}`;
    const icons = {
      success: 'ph-check-circle',
      error: 'ph-x-circle',
      warning: 'ph-warning',
      info: 'ph-info'
    };

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.id = notificationId;
    notification.setAttribute('role', 'alert');

    let closeButton = '';
    if (dismissible) {
      closeButton = `
        <button class="notification-close" aria-label="Close notification" onclick="window.Notifications.dismiss('${notificationId}')">
          <i class="ph ph-x"></i>
        </button>
      `;
    }

    let progressBar = '';
    if (duration > 0) {
      progressBar = `
        <div class="notification-progress">
          <div class="notification-progress-bar" style="animation-duration: ${duration}ms;"></div>
        </div>
      `;
    }

    notification.innerHTML = `
      <div class="notification-icon">
        <i class="ph ${icons[type] || icons.info}"></i>
      </div>
      <div class="notification-content">
        ${title ? `<div class="notification-title">${title}</div>` : ''}
        <p class="notification-message">${message}</p>
      </div>
      ${closeButton}
      ${progressBar}
    `;

    notificationContainer.appendChild(notification);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => {
        dismiss(notificationId);
      }, duration);
    }

    return notificationId;
  }

  /**
   * Dismiss a notification
   * @param {string} notificationId - Notification ID
   */
  function dismiss(notificationId) {
    const notification = document.getElementById(notificationId);
    if (!notification) return;

    notification.classList.add('fade-out');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  /**
   * Dismiss all notifications
   */
  function dismissAll() {
    if (!notificationContainer) return;
    const notifications = notificationContainer.querySelectorAll('.notification');
    notifications.forEach(notification => {
      dismiss(notification.id);
    });
  }

  /**
   * Convenience methods
   */
  function success(title, message, duration) {
    return show({ type: 'success', title, message, duration });
  }

  function error(title, message, duration) {
    return show({ type: 'error', title, message, duration: duration || 7000 });
  }

  function warning(title, message, duration) {
    return show({ type: 'warning', title, message, duration });
  }

  function info(title, message, duration) {
    return show({ type: 'info', title, message, duration });
  }

  // Export
  window.Notifications = {
    init,
    show,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info
  };

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
