/**
 * Notification Service
 * Handles user notifications with role-based filtering
 */

(function() {
  'use strict';

  async function getNotifications(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserSeeFeature('notifications');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to view notifications' };
      }
    }
    
    let notifications = PMTwinData.Notifications.getByUser(currentUser.id);
    
    // Apply filters
    if (filters.unread !== undefined) {
      if (filters.unread) {
        notifications = PMTwinData.Notifications.getUnread(currentUser.id);
      } else {
        notifications = notifications.filter(n => n.read);
      }
    }
    if (filters.type) {
      notifications = notifications.filter(n => n.type === filters.type);
    }
    
    return { success: true, notifications: notifications };
  }

  async function markAsRead(notificationId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const notification = PMTwinData.Notifications.getAll().find(n => n.id === notificationId);
    if (!notification) {
      return { success: false, error: 'Notification not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || notification.userId !== currentUser.id) {
      return { success: false, error: 'You do not have permission to modify this notification' };
    }
    
    const updated = PMTwinData.Notifications.markAsRead(notificationId);
    if (updated) {
      return { success: true, notification: updated };
    }
    
    return { success: false, error: 'Failed to update notification' };
  }

  async function markAllAsRead() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const updated = PMTwinData.Notifications.markAllAsRead(currentUser.id);
    if (updated) {
      return { success: true };
    }
    
    return { success: false, error: 'Failed to update notifications' };
  }

  window.NotificationService = {
    getNotifications,
    markAsRead,
    markAllAsRead
  };

})();


