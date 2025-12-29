/**
 * Admin Settings Component
 * Handles system settings UI for admin portal
 */

(function() {
  'use strict';

  let currentSettings = null;
  let activeTab = 'platform';

  function init(params) {
    loadSettings();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Tab navigation
    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const tabName = this.getAttribute('data-tab');
        switchTab(tabName);
      });
    });

    // Save buttons
    const saveButtons = document.querySelectorAll('[data-save]');
    saveButtons.forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.getAttribute('data-save');
        saveSettings(category);
      });
    });

    // Reset button
    const resetBtn = document.getElementById('resetSettings');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetSettings);
    }
  }

  async function loadSettings() {
    try {
      if (typeof SettingsService === 'undefined') {
        showError('Settings service not available');
        return;
      }

      const result = await SettingsService.getSettings();
      
      if (result.success) {
        currentSettings = result.settings;
        renderSettings();
      } else {
        showError(result.error || 'Failed to load settings');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showError('Error loading settings');
    }
  }

  function renderSettings() {
    if (!currentSettings) return;

    // Render platform settings
    renderPlatformSettings();
    
    // Render matching settings
    renderMatchingSettings();
    
    // Render notification settings
    renderNotificationSettings();
    
    // Render feature flags
    renderFeatureFlags();
  }

  function renderPlatformSettings() {
    const container = document.getElementById('platformSettings');
    if (!container || !currentSettings) return;

    const platform = currentSettings.platform || {};
    
    container.innerHTML = `
      <form id="platformSettingsForm">
        <div class="form-group">
          <label for="platformName">Platform Name</label>
          <input type="text" id="platformName" value="${platform.name || 'PMTwin'}" class="form-control">
        </div>
        <div class="form-group">
          <label for="contactEmail">Contact Email</label>
          <input type="email" id="contactEmail" value="${platform.contactEmail || ''}" class="form-control">
        </div>
        <div class="form-group">
          <label for="contactPhone">Contact Phone</label>
          <input type="tel" id="contactPhone" value="${platform.contactPhone || ''}" class="form-control">
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="maintenanceMode" ${platform.maintenanceMode ? 'checked' : ''}>
            Maintenance Mode
          </label>
        </div>
        <div class="form-group" id="maintenanceMessageGroup" style="${platform.maintenanceMode ? '' : 'display: none;'}">
          <label for="maintenanceMessage">Maintenance Message</label>
          <textarea id="maintenanceMessage" class="form-control" rows="3">${platform.maintenanceMessage || ''}</textarea>
        </div>
        <button type="button" class="btn btn-primary" data-save="platform">Save Platform Settings</button>
      </form>
    `;

    // Show/hide maintenance message based on checkbox
    const maintenanceCheckbox = document.getElementById('maintenanceMode');
    if (maintenanceCheckbox) {
      maintenanceCheckbox.addEventListener('change', function() {
        const messageGroup = document.getElementById('maintenanceMessageGroup');
        if (messageGroup) {
          messageGroup.style.display = this.checked ? 'block' : 'none';
        }
      });
    }
  }

  function renderMatchingSettings() {
    const container = document.getElementById('matchingSettings');
    if (!container || !currentSettings) return;

    const matching = currentSettings.matching || {};
    
    container.innerHTML = `
      <form id="matchingSettingsForm">
        <div class="form-group">
          <label for="matchThreshold">Match Threshold (%)</label>
          <input type="number" id="matchThreshold" min="0" max="100" value="${matching.threshold || 80}" class="form-control">
          <small class="form-text">Minimum match score percentage (default: 80%)</small>
        </div>
        <div class="form-group">
          <label for="skillWeight">Skill Weight</label>
          <input type="number" id="skillWeight" min="0" max="1" step="0.1" value="${matching.skillWeight || 0.4}" class="form-control">
          <small class="form-text">Weight for skill matching (0.0 - 1.0)</small>
        </div>
        <div class="form-group">
          <label for="locationWeight">Location Weight</label>
          <input type="number" id="locationWeight" min="0" max="1" step="0.1" value="${matching.locationWeight || 0.2}" class="form-control">
          <small class="form-text">Weight for location proximity (0.0 - 1.0)</small>
        </div>
        <div class="form-group">
          <label for="experienceWeight">Experience Weight</label>
          <input type="number" id="experienceWeight" min="0" max="1" step="0.1" value="${matching.experienceWeight || 0.3}" class="form-control">
          <small class="form-text">Weight for experience level (0.0 - 1.0)</small>
        </div>
        <div class="form-group">
          <label for="financialWeight">Financial Weight</label>
          <input type="number" id="financialWeight" min="0" max="1" step="0.1" value="${matching.financialWeight || 0.1}" class="form-control">
          <small class="form-text">Weight for financial capacity (0.0 - 1.0)</small>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="enableAutoMatching" ${matching.enableAutoMatching !== false ? 'checked' : ''}>
            Enable Auto Matching
          </label>
        </div>
        <div class="form-group">
          <label for="matchingFrequency">Matching Frequency</label>
          <select id="matchingFrequency" class="form-control">
            <option value="realtime" ${matching.matchingFrequency === 'realtime' ? 'selected' : ''}>Real-time</option>
            <option value="hourly" ${matching.matchingFrequency === 'hourly' ? 'selected' : ''}>Hourly</option>
            <option value="daily" ${matching.matchingFrequency === 'daily' ? 'selected' : ''}>Daily</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" data-save="matching">Save Matching Settings</button>
      </form>
    `;
  }

  function renderNotificationSettings() {
    const container = document.getElementById('notificationSettings');
    if (!container || !currentSettings) return;

    const notifications = currentSettings.notifications || {};
    
    container.innerHTML = `
      <form id="notificationSettingsForm">
        <div class="form-group">
          <label>
            <input type="checkbox" id="emailEnabled" ${notifications.emailEnabled !== false ? 'checked' : ''}>
            Enable Email Notifications
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="smsEnabled" ${notifications.smsEnabled ? 'checked' : ''}>
            Enable SMS Notifications
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="pushEnabled" ${notifications.pushEnabled !== false ? 'checked' : ''}>
            Enable Push Notifications
          </label>
        </div>
        <div class="form-group">
          <label for="notificationFrequency">Notification Frequency</label>
          <select id="notificationFrequency" class="form-control">
            <option value="immediate" ${notifications.notificationFrequency === 'immediate' ? 'selected' : ''}>Immediate</option>
            <option value="daily_digest" ${notifications.notificationFrequency === 'daily_digest' ? 'selected' : ''}>Daily Digest</option>
            <option value="weekly_digest" ${notifications.notificationFrequency === 'weekly_digest' ? 'selected' : ''}>Weekly Digest</option>
          </select>
        </div>
        <button type="button" class="btn btn-primary" data-save="notifications">Save Notification Settings</button>
      </form>
    `;
  }

  function renderFeatureFlags() {
    const container = document.getElementById('featureFlags');
    if (!container || !currentSettings) return;

    const features = currentSettings.features || {};
    
    container.innerHTML = `
      <form id="featureFlagsForm">
        <div class="form-group">
          <label>
            <input type="checkbox" id="barterEnabled" ${features.barterEnabled !== false ? 'checked' : ''}>
            Barter System Enabled
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="bulkPurchasingEnabled" ${features.bulkPurchasingEnabled !== false ? 'checked' : ''}>
            Bulk Purchasing Enabled
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="mentorshipEnabled" ${features.mentorshipEnabled !== false ? 'checked' : ''}>
            Mentorship Program Enabled
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="spvEnabled" ${features.spvEnabled !== false ? 'checked' : ''}>
            SPV Model Enabled
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="competitionEnabled" ${features.competitionEnabled !== false ? 'checked' : ''}>
            Competition Model Enabled
          </label>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" id="mobileAppEnabled" ${features.mobileAppEnabled !== false ? 'checked' : ''}>
            Mobile App Enabled
          </label>
        </div>
        <button type="button" class="btn btn-primary" data-save="features">Save Feature Flags</button>
      </form>
    `;
  }

  function switchTab(tabName) {
    activeTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('[data-tab]').forEach(tab => {
      if (tab.getAttribute('data-tab') === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Show/hide tab content
    document.querySelectorAll('[data-tab-content]').forEach(content => {
      if (content.getAttribute('data-tab-content') === tabName) {
        content.style.display = 'block';
      } else {
        content.style.display = 'none';
      }
    });
  }

  async function saveSettings(category) {
    try {
      if (typeof SettingsService === 'undefined') {
        showError('Settings service not available');
        return;
      }

      let settingsData = {};

      if (category === 'platform') {
        settingsData = {
          name: document.getElementById('platformName')?.value || 'PMTwin',
          contactEmail: document.getElementById('contactEmail')?.value || '',
          contactPhone: document.getElementById('contactPhone')?.value || '',
          maintenanceMode: document.getElementById('maintenanceMode')?.checked || false,
          maintenanceMessage: document.getElementById('maintenanceMessage')?.value || null
        };
      } else if (category === 'matching') {
        settingsData = {
          threshold: parseInt(document.getElementById('matchThreshold')?.value || 80),
          skillWeight: parseFloat(document.getElementById('skillWeight')?.value || 0.4),
          locationWeight: parseFloat(document.getElementById('locationWeight')?.value || 0.2),
          experienceWeight: parseFloat(document.getElementById('experienceWeight')?.value || 0.3),
          financialWeight: parseFloat(document.getElementById('financialWeight')?.value || 0.1),
          enableAutoMatching: document.getElementById('enableAutoMatching')?.checked !== false,
          matchingFrequency: document.getElementById('matchingFrequency')?.value || 'realtime'
        };
      } else if (category === 'notifications') {
        settingsData = {
          emailEnabled: document.getElementById('emailEnabled')?.checked !== false,
          smsEnabled: document.getElementById('smsEnabled')?.checked || false,
          pushEnabled: document.getElementById('pushEnabled')?.checked !== false,
          notificationFrequency: document.getElementById('notificationFrequency')?.value || 'immediate'
        };
      } else if (category === 'features') {
        settingsData = {
          barterEnabled: document.getElementById('barterEnabled')?.checked !== false,
          bulkPurchasingEnabled: document.getElementById('bulkPurchasingEnabled')?.checked !== false,
          mentorshipEnabled: document.getElementById('mentorshipEnabled')?.checked !== false,
          spvEnabled: document.getElementById('spvEnabled')?.checked !== false,
          competitionEnabled: document.getElementById('competitionEnabled')?.checked !== false,
          mobileAppEnabled: document.getElementById('mobileAppEnabled')?.checked !== false
        };
      }

      const result = await SettingsService.updateSettings(category, settingsData);
      
      if (result.success) {
        currentSettings = result.settings;
        showSuccess(`${category.charAt(0).toUpperCase() + category.slice(1)} settings saved successfully`);
      } else {
        showError(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Error saving settings');
    }
  }

  async function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      if (typeof SettingsService === 'undefined') {
        showError('Settings service not available');
        return;
      }

      const result = await SettingsService.resetSettings();
      
      if (result.success) {
        currentSettings = result.settings;
        renderSettings();
        showSuccess('Settings reset to defaults successfully');
      } else {
        showError(result.error || 'Failed to reset settings');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      showError('Error resetting settings');
    }
  }

  function showSuccess(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-success';
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 3000);
  }

  function showError(message) {
    const alert = document.createElement('div');
    alert.className = 'alert alert-error';
    alert.textContent = message;
    alert.style.position = 'fixed';
    alert.style.top = '20px';
    alert.style.right = '20px';
    alert.style.zIndex = '9999';
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-settings'] = { init };

})();

