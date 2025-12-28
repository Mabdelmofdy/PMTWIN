/**
 * Notifications Component - HTML triggers for NotificationService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  async function init(params) {
    // Wait a bit for data to be ready, then try to load sample notifications if none exist
    if (typeof PMTwinData !== 'undefined') {
      const existingNotifications = PMTwinData.Notifications.getAll();
      if (existingNotifications.length === 0) {
        // Try to load sample notifications
        try {
          await PMTwinData.loadSampleNotifications();
        } catch (error) {
          console.warn('Could not auto-load sample notifications:', error);
        }
      }
    }
    
    // Load and display notifications
    await loadNotifications();
  }

  // ============================================
  // HTML Triggers for NotificationService Functions
  // ============================================

  // Trigger: getNotifications(filters) - Load notifications
  async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading notifications...</p>';

      let result;
      if (typeof NotificationService !== 'undefined') {
        result = await NotificationService.getNotifications(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Notification service not available</p>';
        return;
      }

      if (result.success && result.notifications) {
        renderNotifications(container, result.notifications);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load notifications'}</p>`;
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading notifications. Please try again.</p>';
    }
  }

  // Trigger: getNotifications(filters) - Apply filters
  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const type = document.getElementById('notificationTypeFilter')?.value;
    if (type) filters.type = type;
    
    const unread = document.getElementById('notificationReadFilter')?.value;
    if (unread !== '') filters.unread = unread === 'false';
    
    currentFilters = filters;
    await loadNotifications();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('notificationFiltersForm')?.reset();
    loadNotifications();
  }

  // Trigger: markAsRead(notificationId) - Mark notification as read
  async function markAsRead(notificationId) {
    try {
      if (typeof NotificationService === 'undefined') {
        alert('Notification service not available');
        return;
      }

      const result = await NotificationService.markAsRead(notificationId);
      
      if (result.success) {
        await loadNotifications();
      } else {
        alert(result.error || 'Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Error updating notification');
    }
  }

  // Trigger: markAllAsRead() - Mark all notifications as read
  async function markAllAsRead() {
    if (!confirm('Mark all notifications as read?')) {
      return;
    }

    try {
      if (typeof NotificationService === 'undefined') {
        alert('Notification service not available');
        return;
      }

      const result = await NotificationService.markAllAsRead();
      
      if (result.success) {
        alert('All notifications marked as read');
        await loadNotifications();
      } else {
        alert(result.error || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      alert('Error updating notifications');
    }
  }

  // Reload sample notifications from notification.json
  async function reloadSampleNotifications() {
    if (!confirm('This will clear all existing notifications and reload sample notifications from notification.json. Continue?')) {
      return;
    }

    const container = document.getElementById('notificationsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Reloading sample notifications...</p>';

      if (typeof PMTwinData === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Data service not available</p>';
        return;
      }

      // Clear existing notifications
      localStorage.setItem('pmtwin_notifications', JSON.stringify([]));
      
      // Reload sample notifications
      await PMTwinData.loadSampleNotifications();
      
      // Reload the notifications list
      await loadNotifications();
      
      alert('Sample notifications reloaded successfully!');
    } catch (error) {
      console.error('Error reloading sample notifications:', error);
      container.innerHTML = '<p class="alert alert-error">Error reloading notifications. Please check the console for details.</p>';
      alert('Error reloading notifications. Please check the console.');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderNotifications(container, notifications) {
    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No notifications found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1rem;">';
    
    notifications.forEach(notification => {
      const isUnread = !notification.read;
      html += `
        <div class="card" style="${isUnread ? 'border-left: 4px solid var(--primary);' : ''}">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0; ${isUnread ? 'font-weight: bold;' : ''}">
                  ${notification.title || 'Notification'}
                  ${isUnread ? '<span class="badge badge-primary" style="margin-left: 0.5rem;">New</span>' : ''}
                </h3>
                <p style="margin: 0; color: var(--text-secondary);">${notification.message || ''}</p>
              </div>
              <span style="color: var(--text-secondary); font-size: 0.9rem; white-space: nowrap; margin-left: 1rem;">
                ${new Date(notification.createdAt).toLocaleString()}
              </span>
            </div>
            
            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
              ${notification.actionUrl ? `
                <a href="${notification.actionUrl}" class="btn btn-primary btn-sm">
                  ${notification.actionLabel || 'View'}
                </a>
              ` : ''}
              ${isUnread ? `
                <button onclick="notificationsComponent.markAsRead('${notification.id}')" class="btn btn-secondary btn-sm">
                  Mark as Read
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export
  if (!window.notifications) window.notifications = {};
  window.notifications.notifications = {
    init,
    loadNotifications,
    applyFilters,
    clearFilters,
    markAsRead,
    markAllAsRead,
    reloadSampleNotifications
  };

  // Global reference for onclick handlers
  window.notificationsComponent = window.notifications.notifications;

})();

