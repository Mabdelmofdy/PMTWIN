/**
 * PMTwin Mobile App Logic
 * Handles biometric approval, site logging, notifications, and offline mode
 */

(function() {
  'use strict';

  let currentUser = null;
  let currentRoute = 'dashboard';
  let isOffline = false;
  let pendingUploads = [];

  // ============================================
  // Initialization
  // ============================================
  function init() {
    // Check authentication
    const isAuth = PMTwinAuth.isAuthenticated();
    currentUser = PMTwinData.Sessions.getCurrentUser();

    if (!isAuth || !currentUser) {
      // Show login form, hide main content
      document.getElementById('loginSection').style.display = 'block';
      document.getElementById('mainContent').style.display = 'none';
      document.getElementById('bottomNav').style.display = 'none';
      document.querySelector('.mobile-header').style.display = 'block';
      return;
    }

    // Check if user has correct role (individual or entity)
    if (currentUser.role !== 'individual' && currentUser.role !== 'entity') {
      // Redirect to appropriate portal based on role
      if (currentUser.role === 'admin') {
        window.location.href = 'admin-portal.html';
        return;
      } else {
        // Unknown role, redirect to public portal
        window.location.href = 'public-portal.html';
        return;
      }
    }

    // User is authenticated - show main content, hide login
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    document.getElementById('bottomNav').style.display = 'block';

    // Initialize routing
    initRouting();

    // Initialize offline detection
    initOfflineDetection();

    // Load dashboard by default
    loadRoute('dashboard');

    // Update notification badge
    updateNotificationBadge();
  }

  // ============================================
  // Routing
  // ============================================
  function initRouting() {
    window.addEventListener('hashchange', function() {
      const hash = window.location.hash.slice(1) || 'dashboard';
      loadRoute(hash);
    });

    document.querySelectorAll('.bottom-nav-item[data-route]').forEach(item => {
      item.addEventListener('click', function(e) {
        const route = this.getAttribute('data-route');
        if (route) {
          window.location.hash = route;
          updateActiveNav(route);
        }
      });
    });
  }

  function loadRoute(route) {
    currentRoute = route;

    document.querySelectorAll('.route-section').forEach(section => {
      section.style.display = 'none';
    });

    const section = document.getElementById(route);
    if (section) {
      section.style.display = 'block';
    }

    switch(route) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'approval':
        loadApproval();
        break;
      case 'site-log':
        loadSiteLog();
        break;
      case 'notifications':
        loadNotifications();
        break;
      case 'sync':
        loadSync();
        break;
    }

    updateActiveNav(route);
  }

  function updateActiveNav(route) {
    document.querySelectorAll('.bottom-nav-item').forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-route') === route) {
        item.classList.add('active');
      }
    });
  }

  // ============================================
  // Dashboard
  // ============================================
  function loadDashboard() {
    const container = document.getElementById('dashboardContent');
    
    const proposals = PMTwinData.Proposals.getByProvider(currentUser.id)
      .filter(p => p.status === 'approved');
    const notifications = PMTwinData.Notifications.getUnread(currentUser.id);

    container.innerHTML = `
      <div class="card" style="margin-bottom: var(--spacing-4);">
        <div class="card-body">
          <h3>Active Projects</h3>
          ${proposals.length === 0 ? '<p>No active projects</p>' : proposals.map(proposal => {
            const project = PMTwinData.Projects.getById(proposal.projectId);
            return `
              <div class="card" style="margin-top: var(--spacing-3); background: var(--bg-secondary);">
                <div class="card-body">
                  <h4>${escapeHtml(project?.title || 'Unknown Project')}</h4>
                  <p><strong>Type:</strong> ${escapeHtml(proposal.type)}</p>
                  <a href="#approval" class="btn btn-sm btn-primary">Approve Milestone</a>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-body">
          <h3>Quick Actions</h3>
          <a href="#site-log" class="btn btn-primary btn-block" style="margin-bottom: var(--spacing-2);">Log Site Activity</a>
          <a href="#notifications" class="btn btn-outline btn-block">View Notifications (${notifications.length})</a>
        </div>
      </div>
    `;
  }

  // ============================================
  // Biometric Approval
  // ============================================
  function loadApproval() {
    const container = document.getElementById('approvalContent');
    const proposals = PMTwinData.Proposals.getByProvider(currentUser.id)
      .filter(p => p.status === 'approved');

    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✍️</div>
          <h3 class="empty-state-title">No approvals pending</h3>
          <p class="empty-state-text">You don't have any approved projects requiring milestone approval.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>Select Project</h3>
          ${proposals.map(proposal => {
            const project = PMTwinData.Projects.getById(proposal.projectId);
            return `
              <div class="card" style="margin-top: var(--spacing-3); background: var(--bg-secondary);">
                <div class="card-body">
                  <h4>${escapeHtml(project?.title || 'Unknown Project')}</h4>
                  <button class="btn btn-primary btn-block" onclick="MobileApp.showApprovalForm('${proposal.id}')">Approve Milestone</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function showApprovalForm(proposalId) {
    const proposal = PMTwinData.Proposals.getById(proposalId);
    const project = PMTwinData.Projects.getById(proposal.projectId);

    const container = document.getElementById('approvalContent');
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>${escapeHtml(project?.title || 'Unknown Project')}</h3>
          <form id="approvalForm" onsubmit="return MobileApp.handleApproval(event, '${proposalId}')">
            <div class="form-group">
              <label class="form-label required">Approval Type</label>
              <select id="approvalType" class="form-control" required>
                <option value="">Select Type</option>
                <option value="milestone">Milestone Sign-off</option>
                <option value="work_order">Work Order Approval</option>
                <option value="material_receipt">Material Receipt</option>
                <option value="quality_check">Quality Check</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Comments</label>
              <textarea id="approvalComments" class="form-control" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Biometric Verification</label>
              <div style="text-align: center; padding: var(--spacing-8); background: var(--bg-secondary); border-radius: var(--border-radius);">
                <div id="biometricArea" style="width: 150px; height: 150px; margin: 0 auto; border: 3px solid var(--color-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="MobileApp.captureBiometric()">
                  <span style="font-size: 3rem;">👆</span>
                </div>
                <p style="margin-top: var(--spacing-2);">Tap to capture biometric</p>
                <div id="biometricStatus" style="display: none; margin-top: var(--spacing-2);">
                  <span class="badge badge-success">✓ Verified</span>
                </div>
              </div>
            </div>
            <div id="approvalError" class="alert alert-error" style="display: none;"></div>
            <button type="submit" class="btn btn-primary btn-block" id="approvalSubmit" disabled>Submit Approval</button>
            <button type="button" class="btn btn-outline btn-block" onclick="MobileApp.loadApproval()" style="margin-top: var(--spacing-2);">Cancel</button>
          </form>
        </div>
      </div>
    `;
  }

  let biometricCaptured = false;

  function captureBiometric() {
    // Simulate biometric capture
    const area = document.getElementById('biometricArea');
    const status = document.getElementById('biometricStatus');
    const submit = document.getElementById('approvalSubmit');

    area.innerHTML = '<span style="font-size: 3rem; color: var(--color-success);">✓</span>';
    status.style.display = 'block';
    submit.disabled = false;
    biometricCaptured = true;

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: currentUser.role,
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'User',
      action: 'biometric_capture',
      actionCategory: 'mobile',
      entityType: 'approval',
      entityId: 'mobile',
      description: 'Biometric captured for approval',
      context: {
        portal: 'mobile_app',
        device: 'mobile'
      }
    });
  }

  function handleApproval(event, proposalId) {
    event.preventDefault();

    if (!biometricCaptured) {
      showError('approvalError', 'Please capture biometric verification');
      return false;
    }

    const type = document.getElementById('approvalType').value;
    const comments = document.getElementById('approvalComments').value;

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: currentUser.role,
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'User',
      action: 'milestone_approval',
      actionCategory: 'mobile',
      entityType: 'proposal',
      entityId: proposalId,
      description: `Milestone approved: ${type}. ${comments}`,
      context: {
        portal: 'mobile_app',
        approvalType: type,
        comments: comments
      }
    });

    alert('Approval submitted successfully!');
    loadApproval();
    return false;
  }

  // ============================================
  // Site Log
  // ============================================
  function loadSiteLog() {
    const container = document.getElementById('siteLogContent');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>Preliminaries Verification</h3>
          <form id="preliminariesForm" onsubmit="return MobileApp.handlePreliminaries(event)">
            <div class="form-check">
              <input type="checkbox" id="prelim_site_office" class="form-check-input">
              <label for="prelim_site_office" class="form-check-label">Site Office Ready</label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="prelim_utilities" class="form-check-input">
              <label for="prelim_utilities" class="form-check-label">Utilities Connected</label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="prelim_access" class="form-check-input">
              <label for="prelim_access" class="form-check-label">Access Roads Clear</label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="prelim_safety" class="form-check-input">
              <label for="prelim_safety" class="form-check-label">Safety Measures in Place</label>
            </div>
            <div class="form-check">
              <input type="checkbox" id="prelim_equipment" class="form-check-input">
              <label for="prelim_equipment" class="form-check-label">Equipment Delivered</label>
            </div>
            <div class="form-group" style="margin-top: var(--spacing-4);">
              <label class="form-label">Photos</label>
              <input type="file" id="sitePhotos" class="form-control" accept="image/*" multiple>
            </div>
            <button type="submit" class="btn btn-primary btn-block" style="margin-top: var(--spacing-4);">Submit Verification</button>
          </form>
        </div>
      </div>

      <div class="card" style="margin-top: var(--spacing-4);">
        <div class="card-body">
          <h3>Progress Log</h3>
          <form id="progressForm" onsubmit="return MobileApp.handleProgressLog(event)">
            <div class="form-group">
              <label class="form-label required">Date</label>
              <input type="date" id="logDate" class="form-control" required value="${new Date().toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
              <label class="form-label required">Activity Description</label>
              <textarea id="logActivity" class="form-control" rows="3" required></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Category</label>
              <select id="logCategory" class="form-control">
                <option value="construction">Construction</option>
                <option value="logistics">Logistics</option>
                <option value="safety">Safety</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Photos/Videos</label>
              <input type="file" id="logMedia" class="form-control" accept="image/*,video/*" multiple>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Save Log Entry</button>
          </form>
        </div>
      </div>
    `;
  }

  function handlePreliminaries(event) {
    event.preventDefault();

    const checks = {
      siteOffice: document.getElementById('prelim_site_office').checked,
      utilities: document.getElementById('prelim_utilities').checked,
      access: document.getElementById('prelim_access').checked,
      safety: document.getElementById('prelim_safety').checked,
      equipment: document.getElementById('prelim_equipment').checked
    };

    const photos = document.getElementById('sitePhotos').files;

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: currentUser.role,
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'User',
      action: 'preliminaries_verification',
      actionCategory: 'mobile',
      entityType: 'site',
      entityId: 'preliminaries',
      description: `Preliminaries verified: ${JSON.stringify(checks)}`,
      context: {
        portal: 'mobile_app',
        checks: checks,
        photoCount: photos.length
      }
    });

    alert('Preliminaries verification submitted!');
    return false;
  }

  function handleProgressLog(event) {
    event.preventDefault();

    const date = document.getElementById('logDate').value;
    const activity = document.getElementById('logActivity').value;
    const category = document.getElementById('logCategory').value;
    const media = document.getElementById('logMedia').files;

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: currentUser.role,
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'User',
      action: 'progress_log',
      actionCategory: 'mobile',
      entityType: 'site',
      entityId: 'progress',
      description: `Progress logged: ${activity}`,
      context: {
        portal: 'mobile_app',
        date: date,
        category: category,
        mediaCount: media.length
      }
    });

    alert('Progress log saved!');
    document.getElementById('progressForm').reset();
    return false;
  }

  // ============================================
  // Notifications
  // ============================================
  function loadNotifications() {
    const container = document.getElementById('notificationsContent');
    const notifications = PMTwinData.Notifications.getByUser(currentUser.id);

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔔</div>
          <h3 class="empty-state-title">No notifications</h3>
          <p class="empty-state-text">You're all caught up!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = notifications.map(notification => `
      <div class="card" style="margin-bottom: var(--spacing-3); ${notification.read ? '' : 'border-left: 4px solid var(--color-primary);'}">
        <div class="card-body">
          <h4>${escapeHtml(notification.title)}</h4>
          <p>${escapeHtml(notification.message)}</p>
          <p><small>${new Date(notification.createdAt).toLocaleString()}</small></p>
          ${!notification.read ? `
            <button class="btn btn-sm btn-primary" onclick="MobileApp.markAsRead('${notification.id}')">Mark as Read</button>
          ` : ''}
        </div>
      </div>
    `).join('');

    updateNotificationBadge();
  }

  function markAsRead(notificationId) {
    PMTwinData.Notifications.markAsRead(notificationId);
    loadNotifications();
  }

  function updateNotificationBadge() {
    const unread = PMTwinData.Notifications.getUnread(currentUser.id).length;
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (unread > 0) {
        badge.textContent = unread;
        badge.style.display = 'inline-block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  // ============================================
  // Sync
  // ============================================
  function loadSync() {
    const container = document.getElementById('syncContent');
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>Sync Status</h3>
          <p><strong>Connection:</strong> <span class="badge ${isOffline ? 'badge-error' : 'badge-success'}">${isOffline ? 'Offline' : 'Online'}</span></p>
          <p><strong>Pending Uploads:</strong> ${pendingUploads.length}</p>
          ${pendingUploads.length > 0 ? `
            <div style="margin-top: var(--spacing-4);">
              <h4>Pending Items</h4>
              ${pendingUploads.map((item, index) => `
                <div class="card" style="margin-top: var(--spacing-2); background: var(--bg-secondary);">
                  <div class="card-body">
                    <p><strong>${escapeHtml(item.type)}</strong></p>
                    <p><small>${new Date(item.timestamp).toLocaleString()}</small></p>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <button class="btn btn-primary btn-block" onclick="MobileApp.syncNow()" style="margin-top: var(--spacing-4);" ${isOffline ? 'disabled' : ''}>
            ${isOffline ? 'Sync (Offline)' : 'Sync Now'}
          </button>
        </div>
      </div>
    `;
  }

  function syncNow() {
    if (isOffline) {
      alert('Cannot sync while offline. Data will sync automatically when connection is restored.');
      return;
    }

    // Simulate sync
    alert(`Syncing ${pendingUploads.length} items...`);
    pendingUploads = [];
    loadSync();
    alert('Sync complete!');
  }

  // ============================================
  // Offline Detection
  // ============================================
  function initOfflineDetection() {
    // Simulate offline detection
    window.addEventListener('online', function() {
      isOffline = false;
      document.getElementById('offlineIndicator').style.display = 'none';
      syncNow();
    });

    window.addEventListener('offline', function() {
      isOffline = true;
      document.getElementById('offlineIndicator').style.display = 'block';
    });

    // Check initial state
    if (!navigator.onLine) {
      isOffline = true;
      document.getElementById('offlineIndicator').style.display = 'block';
    }
  }

  // ============================================
  // Login Handler
  // ============================================
  function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('mobileLoginEmail').value;
    const password = document.getElementById('mobileLoginPassword').value;
    
    // Ensure test accounts exist before attempting login
    if (typeof PMTwinData !== 'undefined' && PMTwinData.verifyAndCreateAccounts) {
      PMTwinData.verifyAndCreateAccounts();
    }
    
    const result = PMTwinAuth.login(email, password);
    
    if (result.success) {
      // Check if user has correct role
      if (result.user.role !== 'individual' && result.user.role !== 'entity') {
        showError('mobileLoginError', 'This app is for Individual and Entity users only. Please use the Admin Portal for admin accounts.');
        return false;
      }
      
      // Success - reload the page to show authenticated content
      window.location.reload();
    } else {
      let errorMsg = result.error;
      
      // Add helpful message if accounts might not exist
      if (errorMsg.includes('Invalid email or password')) {
        const user = PMTwinData.Users.getByEmail(email);
        if (!user) {
          errorMsg += '\n\nAccount not found. Try:\n' +
            '1. Open console (F12) and run: PMTwinData.forceCreateTestAccounts()\n' +
            '2. Or refresh the page to auto-create accounts';
        } else {
          errorMsg += '\n\nMake sure you\'re using:\n' +
            '- Individual: User123\n' +
            '- Entity: Entity123';
        }
      }
      
      showError('mobileLoginError', errorMsg);
    }
    
    return false;
  }

  // ============================================
  // Utility Functions
  // ============================================
  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Public API
  // ============================================
  window.MobileApp = {
    init,
    handleLogin,
    loadApproval,
    showApprovalForm,
    captureBiometric,
    handleApproval,
    handlePreliminaries,
    handleProgressLog,
    markAsRead,
    syncNow
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

