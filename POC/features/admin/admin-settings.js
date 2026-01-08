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
    
    // Render role management
    renderRoleManagement();
    
    // Render feature flags
    renderFeatureFlags();
  }

  function renderPlatformSettings() {
    const container = document.getElementById('platformSettings');
    if (!container || !currentSettings) return;

    const platform = currentSettings.platform || {};
    
    container.innerHTML = `
      <form id="platformSettingsForm">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div>
            <h3 style="margin-bottom: 1rem;">Basic Information</h3>
            <div class="form-group">
              <label for="platformName">Platform Name</label>
              <input type="text" id="platformName" value="${platform.name || 'PMTwin'}" class="form-control">
            </div>
            <div class="form-group">
              <label for="platformDescription">Platform Description</label>
              <textarea id="platformDescription" class="form-control" rows="3">${platform.description || ''}</textarea>
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
              <label for="supportEmail">Support Email</label>
              <input type="email" id="supportEmail" value="${platform.supportEmail || ''}" class="form-control">
            </div>
          </div>
          
          <div>
            <h3 style="margin-bottom: 1rem;">System Configuration</h3>
            <div class="form-group">
              <label for="maxFileSize">Max File Upload Size (MB)</label>
              <input type="number" id="maxFileSize" min="1" max="100" value="${platform.maxFileSize || 10}" class="form-control">
            </div>
            <div class="form-group">
              <label for="sessionTimeout">Session Timeout (minutes)</label>
              <input type="number" id="sessionTimeout" min="5" max="1440" value="${platform.sessionTimeout || 60}" class="form-control">
            </div>
            <div class="form-group">
              <label for="maxUsersPerProject">Max Users Per Project</label>
              <input type="number" id="maxUsersPerProject" min="1" max="1000" value="${platform.maxUsersPerProject || 50}" class="form-control">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="allowPublicRegistration" ${platform.allowPublicRegistration !== false ? 'checked' : ''}>
                Allow Public Registration
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="requireEmailVerification" ${platform.requireEmailVerification !== false ? 'checked' : ''}>
                Require Email Verification
              </label>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
          <h3 style="margin-bottom: 1rem;">Maintenance Mode</h3>
          <div class="form-group">
            <label>
              <input type="checkbox" id="maintenanceMode" ${platform.maintenanceMode ? 'checked' : ''}>
              Enable Maintenance Mode
            </label>
            <small class="form-text">When enabled, only admins can access the platform</small>
          </div>
          <div class="form-group" id="maintenanceMessageGroup" style="${platform.maintenanceMode ? '' : 'display: none;'}">
            <label for="maintenanceMessage">Maintenance Message</label>
            <textarea id="maintenanceMessage" class="form-control" rows="3" placeholder="Enter maintenance message to display to users...">${platform.maintenanceMessage || ''}</textarea>
          </div>
        </div>
        
        <div style="margin-top: 2rem;">
          <button type="button" class="btn btn-primary" data-save="platform">
            <i class="ph ph-floppy-disk"></i> Save Platform Settings
          </button>
        </div>
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
    const totalWeight = (parseFloat(matching.skillWeight || 0.4) + 
                        parseFloat(matching.locationWeight || 0.2) + 
                        parseFloat(matching.experienceWeight || 0.3) + 
                        parseFloat(matching.financialWeight || 0.1)).toFixed(1);
    
    container.innerHTML = `
      <form id="matchingSettingsForm">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div>
            <h3 style="margin-bottom: 1rem;">Matching Threshold</h3>
            <div class="form-group">
              <label for="matchThreshold">Match Threshold (%)</label>
              <input type="number" id="matchThreshold" min="0" max="100" value="${matching.threshold || 80}" class="form-control">
              <small class="form-text">Minimum match score percentage to show results (default: 80%)</small>
              <div style="background: var(--bg-secondary); height: 8px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.5rem;">
                <div style="background: var(--color-primary); height: 100%; width: ${matching.threshold || 80}%;"></div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 style="margin-bottom: 1rem;">Matching Behavior</h3>
            <div class="form-group">
              <label>
                <input type="checkbox" id="enableAutoMatching" ${matching.enableAutoMatching !== false ? 'checked' : ''}>
                Enable Auto Matching
              </label>
              <small class="form-text">Automatically match projects with service providers</small>
            </div>
            <div class="form-group">
              <label for="matchingFrequency">Matching Frequency</label>
              <select id="matchingFrequency" class="form-control">
                <option value="realtime" ${matching.matchingFrequency === 'realtime' ? 'selected' : ''}>Real-time</option>
                <option value="hourly" ${matching.matchingFrequency === 'hourly' ? 'selected' : ''}>Hourly</option>
                <option value="daily" ${matching.matchingFrequency === 'daily' ? 'selected' : ''}>Daily</option>
              </select>
            </div>
            <div class="form-group">
              <label for="maxMatchesPerProject">Max Matches Per Project</label>
              <input type="number" id="maxMatchesPerProject" min="1" max="100" value="${matching.maxMatchesPerProject || 10}" class="form-control">
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
          <h3 style="margin-bottom: 1rem;">Matching Algorithm Weights</h3>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">
            Configure the relative importance of different factors in matching. Total weight: <strong>${totalWeight}</strong>
            ${totalWeight != 1.0 ? '<span style="color: var(--color-warning);"> (Should equal 1.0)</span>' : ''}
          </p>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div class="form-group">
              <label for="skillWeight">Skill Weight</label>
              <input type="number" id="skillWeight" min="0" max="1" step="0.05" value="${matching.skillWeight || 0.4}" class="form-control">
              <small class="form-text">Weight for skill matching (0.0 - 1.0)</small>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                <div style="background: var(--color-primary); height: 100%; width: ${(matching.skillWeight || 0.4) * 100}%;"></div>
              </div>
            </div>
            <div class="form-group">
              <label for="locationWeight">Location Weight</label>
              <input type="number" id="locationWeight" min="0" max="1" step="0.05" value="${matching.locationWeight || 0.2}" class="form-control">
              <small class="form-text">Weight for location proximity (0.0 - 1.0)</small>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                <div style="background: var(--color-info); height: 100%; width: ${(matching.locationWeight || 0.2) * 100}%;"></div>
              </div>
            </div>
            <div class="form-group">
              <label for="experienceWeight">Experience Weight</label>
              <input type="number" id="experienceWeight" min="0" max="1" step="0.05" value="${matching.experienceWeight || 0.3}" class="form-control">
              <small class="form-text">Weight for experience level (0.0 - 1.0)</small>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                <div style="background: var(--color-success); height: 100%; width: ${(matching.experienceWeight || 0.3) * 100}%;"></div>
              </div>
            </div>
            <div class="form-group">
              <label for="financialWeight">Financial Weight</label>
              <input type="number" id="financialWeight" min="0" max="1" step="0.05" value="${matching.financialWeight || 0.1}" class="form-control">
              <small class="form-text">Weight for financial capacity (0.0 - 1.0)</small>
              <div style="background: var(--bg-secondary); height: 6px; border-radius: var(--radius-full); overflow: hidden; margin-top: 0.25rem;">
                <div style="background: var(--color-warning); height: 100%; width: ${(matching.financialWeight || 0.1) * 100}%;"></div>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem;">
          <button type="button" class="btn btn-primary" data-save="matching">
            <i class="ph ph-floppy-disk"></i> Save Matching Settings
          </button>
        </div>
      </form>
    `;
  }

  function renderNotificationSettings() {
    const container = document.getElementById('notificationSettings');
    if (!container || !currentSettings) return;

    const notifications = currentSettings.notifications || {};
    const templates = notifications.emailTemplates || {};
    
    container.innerHTML = `
      <form id="notificationSettingsForm">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
          <div>
            <h3 style="margin-bottom: 1rem;">Notification Channels</h3>
            <div class="form-group">
              <label>
                <input type="checkbox" id="emailEnabled" ${notifications.emailEnabled !== false ? 'checked' : ''}>
                Enable Email Notifications
              </label>
              <small class="form-text">Send notifications via email</small>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="smsEnabled" ${notifications.smsEnabled ? 'checked' : ''}>
                Enable SMS Notifications
              </label>
              <small class="form-text">Send notifications via SMS (requires SMS provider)</small>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="pushEnabled" ${notifications.pushEnabled !== false ? 'checked' : ''}>
                Enable Push Notifications
              </label>
              <small class="form-text">Send browser and mobile push notifications</small>
            </div>
            <div class="form-group">
              <label for="notificationFrequency">Default Notification Frequency</label>
              <select id="notificationFrequency" class="form-control">
                <option value="immediate" ${notifications.notificationFrequency === 'immediate' ? 'selected' : ''}>Immediate</option>
                <option value="daily_digest" ${notifications.notificationFrequency === 'daily_digest' ? 'selected' : ''}>Daily Digest</option>
                <option value="weekly_digest" ${notifications.notificationFrequency === 'weekly_digest' ? 'selected' : ''}>Weekly Digest</option>
              </select>
              <small class="form-text">Default frequency for new users</small>
            </div>
          </div>
          
          <div>
            <h3 style="margin-bottom: 1rem;">Email Configuration</h3>
            <div class="form-group">
              <label for="emailFrom">From Email Address</label>
              <input type="email" id="emailFrom" value="${notifications.emailFrom || 'noreply@pmtwin.com'}" class="form-control">
            </div>
            <div class="form-group">
              <label for="emailFromName">From Name</label>
              <input type="text" id="emailFromName" value="${notifications.emailFromName || 'PMTwin'}" class="form-control">
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" id="requireEmailVerification" ${notifications.requireEmailVerification !== false ? 'checked' : ''}>
                Require Email Verification
              </label>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border-color);">
          <h3 style="margin-bottom: 1rem;">Email Templates</h3>
          <div style="display: grid; gap: 1rem;">
            <div class="form-group">
              <label for="welcomeTemplate">Welcome Email Template</label>
              <textarea id="welcomeTemplate" class="form-control" rows="4" placeholder="Welcome email template...">${templates.welcome || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="approvalTemplate">Approval Email Template</label>
              <textarea id="approvalTemplate" class="form-control" rows="4" placeholder="Approval email template...">${templates.approval || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="rejectionTemplate">Rejection Email Template</label>
              <textarea id="rejectionTemplate" class="form-control" rows="4" placeholder="Rejection email template...">${templates.rejection || ''}</textarea>
            </div>
            <div class="form-group">
              <label for="matchFoundTemplate">Match Found Email Template</label>
              <textarea id="matchFoundTemplate" class="form-control" rows="4" placeholder="Match found email template...">${templates.matchFound || ''}</textarea>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem;">
          <button type="button" class="btn btn-primary" data-save="notifications">
            <i class="ph ph-floppy-disk"></i> Save Notification Settings
          </button>
        </div>
      </form>
    `;
  }

  function renderRoleManagement() {
    const container = document.getElementById('roleManagement');
    if (!container) return;

    // Get roles from RBAC if available, otherwise use defaults
    let roles = [];
    if (typeof PMTwinRBAC !== 'undefined' && PMTwinRBAC.getAllRoles) {
      roles = PMTwinRBAC.getAllRoles();
    } else {
      // Default roles
      roles = [
        { id: 'platform_admin', name: 'Platform Admin', description: 'Full system access' },
        { id: 'admin', name: 'Admin', description: 'Administrative access' },
        { id: 'entity', name: 'Entity', description: 'Company/Organization users' },
        { id: 'individual', name: 'Individual', description: 'Professional users' },
        { id: 'consultant', name: 'Consultant', description: 'Consultant users' },
        { id: 'service_provider', name: 'Service Provider', description: 'Service provider users' }
      ];
    }

    let html = `
      <div style="margin-bottom: 2rem;">
        <p style="color: var(--text-secondary);">Manage user roles and their permissions. Roles define what users can access and do on the platform.</p>
      </div>
      
      <div style="display: grid; gap: 1rem;">
    `;

    roles.forEach(role => {
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${role.name}</h3>
                <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary);">${role.description || 'No description'}</p>
                <span class="badge badge-secondary">${role.id}</span>
              </div>
              <button type="button" class="btn btn-outline btn-sm" onclick="if(window.admin && window.admin['admin-settings']) { window.admin['admin-settings'].editRole('${role.id}'); }">
                <i class="ph ph-pencil"></i> Edit
              </button>
            </div>
            
            ${role.permissions && role.permissions.length > 0 ? `
              <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                <strong style="font-size: 0.9rem;">Permissions:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                  ${role.permissions.map(p => `<span class="badge badge-info">${p}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            ${role.features && role.features.length > 0 ? `
              <div style="margin-top: 1rem;">
                <strong style="font-size: 0.9rem;">Features:</strong>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                  ${role.features.map(f => `<span class="badge badge-success">${f}</span>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });

    html += `
      </div>
      
      <div style="margin-top: 2rem;">
        <button type="button" class="btn btn-primary" onclick="if(window.admin && window.admin['admin-settings']) { window.admin['admin-settings'].createRole(); }">
          <i class="ph ph-plus"></i> Create New Role
        </button>
      </div>
    `;

    container.innerHTML = html;
  }

  function editRole(roleId) {
    alert(`Edit role functionality for ${roleId} - This would open a modal to edit role permissions and features.`);
    // TODO: Implement role editing modal
  }

  function createRole() {
    const roleName = prompt('Enter role name:');
    if (!roleName) return;
    
    const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
    alert(`Create role functionality - Would create role: ${roleId}`);
    // TODO: Implement role creation
    // After creation, reload role management
    renderRoleManagement();
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
          description: document.getElementById('platformDescription')?.value || '',
          contactEmail: document.getElementById('contactEmail')?.value || '',
          contactPhone: document.getElementById('contactPhone')?.value || '',
          supportEmail: document.getElementById('supportEmail')?.value || '',
          maxFileSize: parseInt(document.getElementById('maxFileSize')?.value || 10),
          sessionTimeout: parseInt(document.getElementById('sessionTimeout')?.value || 60),
          maxUsersPerProject: parseInt(document.getElementById('maxUsersPerProject')?.value || 50),
          allowPublicRegistration: document.getElementById('allowPublicRegistration')?.checked !== false,
          requireEmailVerification: document.getElementById('requireEmailVerification')?.checked !== false,
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
          matchingFrequency: document.getElementById('matchingFrequency')?.value || 'realtime',
          maxMatchesPerProject: parseInt(document.getElementById('maxMatchesPerProject')?.value || 10)
        };
      } else if (category === 'notifications') {
        settingsData = {
          emailEnabled: document.getElementById('emailEnabled')?.checked !== false,
          smsEnabled: document.getElementById('smsEnabled')?.checked || false,
          pushEnabled: document.getElementById('pushEnabled')?.checked !== false,
          notificationFrequency: document.getElementById('notificationFrequency')?.value || 'immediate',
          emailFrom: document.getElementById('emailFrom')?.value || 'noreply@pmtwin.com',
          emailFromName: document.getElementById('emailFromName')?.value || 'PMTwin',
          requireEmailVerification: document.getElementById('requireEmailVerification')?.checked !== false,
          emailTemplates: {
            welcome: document.getElementById('welcomeTemplate')?.value || '',
            approval: document.getElementById('approvalTemplate')?.value || '',
            rejection: document.getElementById('rejectionTemplate')?.value || '',
            matchFound: document.getElementById('matchFoundTemplate')?.value || ''
          }
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
  window.admin['admin-settings'] = { 
    init,
    editRole,
    createRole
  };

})();

