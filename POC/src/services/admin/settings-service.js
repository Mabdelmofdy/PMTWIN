/**
 * Settings Service
 * Handles system settings management for admin portal
 */

(function() {
  'use strict';

  async function getSettings() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view settings' };
    }
    
    const settings = PMTwinData.SystemSettings.get();
    
    return { success: true, settings: settings };
  }

  async function updateSettings(category, settings) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to update settings' };
    }
    
    const updated = PMTwinData.SystemSettings.update(category, settings);
    
    if (updated) {
      return { success: true, settings: updated };
    }
    
    return { success: false, error: 'Failed to update settings' };
  }

  async function updateAllSettings(settings) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to update settings' };
    }
    
    const updated = PMTwinData.SystemSettings.updateAll(settings);
    
    if (updated) {
      return { success: true, settings: updated };
    }
    
    return { success: false, error: 'Failed to update settings' };
  }

  async function getMatchingParameters() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view settings' };
    }
    
    const settings = PMTwinData.SystemSettings.get();
    
    return { success: true, parameters: settings.matching || {} };
  }

  async function updateMatchingParameters(parameters) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to update settings' };
    }
    
    return await updateSettings('matching', parameters);
  }

  async function getNotificationSettings() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view settings' };
    }
    
    const settings = PMTwinData.SystemSettings.get();
    
    return { success: true, settings: settings.notifications || {} };
  }

  async function updateNotificationSettings(notificationSettings) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to update settings' };
    }
    
    return await updateSettings('notifications', notificationSettings);
  }

  async function resetSettings() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to reset settings' };
    }
    
    const reset = PMTwinData.SystemSettings.reset();
    
    if (reset) {
      return { success: true, settings: reset };
    }
    
    return { success: false, error: 'Failed to reset settings' };
  }

  window.SettingsService = {
    getSettings,
    updateSettings,
    updateAllSettings,
    getMatchingParameters,
    updateMatchingParameters,
    getNotificationSettings,
    updateNotificationSettings,
    resetSettings
  };

})();

