/**
 * PMTwin Admin Portal Logic
 * Handles vetting, moderation, reporting, and audit trail
 */

(function() {
  'use strict';

  let currentUser = null;
  let currentRoute = 'dashboard';

  // ============================================
  // Initialization
  // ============================================
  function init() {
    // Ensure accounts exist
    if (typeof PMTwinData !== 'undefined') {
      if (PMTwinData.verifyAndCreateAccounts) {
        PMTwinData.verifyAndCreateAccounts();
      } else if (PMTwinData.autoCreateTestAccounts) {
        PMTwinData.autoCreateTestAccounts();
      }
      
      // Double-check admin account exists and is correct
      const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
      if (!admin) {
        console.warn('Admin account not found, creating...');
        if (PMTwinData.forceCreateTestAccounts) {
          PMTwinData.forceCreateTestAccounts();
        }
      } else {
        // Verify password and status
        try {
          const decoded = atob(admin.password);
          if (decoded !== 'Admin123' || admin.profile?.status !== 'approved') {
            console.log('Fixing admin account...');
            PMTwinData.Users.update(admin.id, {
              password: btoa('Admin123'),
              profile: {
                ...admin.profile,
                status: 'approved',
                approvedAt: admin.profile?.approvedAt || new Date().toISOString()
              }
            });
          }
        } catch (e) {
          console.error('Error checking admin account:', e);
        }
      }
    }
    
    // Check if required modules are loaded
    if (typeof PMTwinAuth === 'undefined') {
      console.error('PMTwinAuth not loaded!');
      showError('Error: Required scripts not loaded. Please refresh the page.');
      return;
    }
    
    // Check authentication
    const isAuth = PMTwinAuth.isAuthenticated();
    currentUser = PMTwinData.Sessions.getCurrentUser();

    const loginSection = document.getElementById('loginSection');
    const mainContent = document.getElementById('mainContent');
    const navbar = document.querySelector('.navbar');

    if (!isAuth || !currentUser) {
      // Show login form, hide main content
      if (loginSection) loginSection.style.display = 'block';
      if (mainContent) mainContent.style.display = 'none';
      if (navbar) navbar.style.display = 'none';
      return;
    }

    // If user is authenticated but not admin, redirect to appropriate portal
    if (currentUser.role !== 'admin') {
      if (currentUser.role === 'individual' || currentUser.role === 'entity') {
        window.location.href = 'user-portal.html';
        return;
      } else {
        // Unknown role, redirect to public portal
        window.location.href = 'public-portal.html';
        return;
      }
    }

    // User is authenticated as admin - show main content, hide login
    if (loginSection) loginSection.style.display = 'none';
    if (mainContent) mainContent.style.display = 'block';
    if (navbar) navbar.style.display = 'block';

    // Initialize routing
    initRouting();

    // Load dashboard by default
    loadRoute('dashboard');
  }

  function showError(message) {
    const loginSection = document.getElementById('loginSection');
    const mainContent = document.getElementById('mainContent');
    
    if (loginSection) {
      loginSection.style.display = 'block';
      const errorEl = document.getElementById('adminLoginError');
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
      }
    }
    if (mainContent) mainContent.style.display = 'none';
  }

  // ============================================
  // Routing
  // ============================================
  function initRouting() {
    try {
      window.addEventListener('hashchange', function() {
        try {
          const hash = window.location.hash.slice(1) || 'dashboard';
          loadRoute(hash);
        } catch (error) {
          console.error('Error handling hash change:', error);
        }
      });

      const navLinks = document.querySelectorAll('.navbar-link[data-route]');
      if (navLinks && navLinks.length > 0) {
        navLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            try {
              const route = this.getAttribute('data-route');
              if (route) {
                window.location.hash = route;
                updateActiveNav(route);
              }
            } catch (error) {
              console.error('Error handling nav click:', error);
            }
          });
        });
      }

      const navbarToggle = document.getElementById('navbarToggle');
      if (navbarToggle) {
        navbarToggle.addEventListener('click', function() {
          try {
            const nav = document.getElementById('navbarNav');
            if (nav) {
              nav.classList.toggle('show');
            }
          } catch (error) {
            console.error('Error toggling navbar:', error);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing routing:', error);
    }
  }

  function loadRoute(route) {
    try {
      currentRoute = route;

      const sections = document.querySelectorAll('.route-section');
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          if (section) section.style.display = 'none';
        });
      }

      const section = document.getElementById(route);
      if (section) {
        section.style.display = 'block';
      }

      switch(route) {
      case 'dashboard':
        loadDashboard();
        break;
      case 'vetting':
        loadVetting();
        break;
      case 'moderation':
        loadModeration();
        break;
      case 'reports':
        loadReports();
        break;
      case 'audit':
        loadAudit();
        break;
      }

      updateActiveNav(route);
    } catch (error) {
      console.error('Error loading route:', route, error);
    }
  }

  function updateActiveNav(route) {
    document.querySelectorAll('.navbar-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === route) {
        link.classList.add('active');
      }
    });
  }

  // ============================================
  // Dashboard
  // ============================================
  function loadDashboard() {
    // Try new container first, then fallback to old one
    let container = document.getElementById('adminDashboard');
    if (!container) {
      container = document.getElementById('dashboardContent');
    }
    
    // If using new renderer system, use it
    if (container && typeof Renderer !== 'undefined' && Renderer.renderAdminDashboard) {
      try {
        Renderer.renderAdminDashboard();
        return;
      } catch (e) {
        console.warn('Renderer failed, falling back to legacy dashboard:', e);
      }
    }
    
    // Fallback to legacy dashboard rendering
    if (!container) {
      console.error('Dashboard container not found');
      return;
    }
    
    const pendingUsers = PMTwinData.Users.getByStatus('pending');
    const flaggedProjects = PMTwinData.Projects.getAll().filter(p => p.flagged);
    const allProjects = PMTwinData.Projects.getAll();
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress');
    const allProposals = PMTwinData.Proposals.getAll();
    const approvedProposals = allProposals.filter(p => p.status === 'approved');
    
    // Calculate platform volume
    const platformVolume = allProjects.reduce((sum, p) => {
      return sum + (p.budget?.max || 0);
    }, 0);

    container.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${pendingUsers.length}</div>
          <div class="stat-label">Pending Verifications</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${flaggedProjects.length}</div>
          <div class="stat-label">Flagged Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeProjects.length}</div>
          <div class="stat-label">Active Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(platformVolume / 1000000).toFixed(1)}M</div>
          <div class="stat-label">Platform Volume (SAR)</div>
        </div>
      </div>

      <div class="grid grid-cols-1 grid-cols-md-2 gap-6" style="margin-top: var(--spacing-6);">
        <div class="card">
          <div class="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div class="card-body">
            <a href="#vetting" class="btn btn-primary btn-block">Review Pending Users</a>
            <a href="#moderation" class="btn btn-outline btn-block" style="margin-top: var(--spacing-2);">Moderate Projects</a>
            <a href="#reports" class="btn btn-outline btn-block" style="margin-top: var(--spacing-2);">View Reports</a>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Recent Activity</h3>
          </div>
          <div class="card-body">
            ${PMTwinData.Audit.getRecent(5).map(log => `
              <div style="margin-bottom: var(--spacing-2); padding-bottom: var(--spacing-2); border-bottom: 1px solid var(--border-color);">
                <strong>${escapeHtml(log.description)}</strong><br>
                <small>${new Date(log.timestamp).toLocaleString()}</small>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Vetting
  // ============================================
  function loadVetting() {
    const container = document.getElementById('vettingContent');
    // Get users in under_review status (new onboarding system)
    const allUsers = PMTwinData.Users.getAll();
    const pendingUsers = allUsers.filter(user => 
      user.onboardingStage === 'under_review' || 
      (user.profile?.status === 'pending' && !user.onboardingStage) // Legacy support
    );

    if (pendingUsers.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3 class="empty-state-title">No pending verifications</h3>
          <p class="empty-state-text">All users have been reviewed.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="vetting-queue">
        ${pendingUsers.map(user => {
          const userType = user.userType || (user.role === 'entity' ? 'company' : 'consultant');
          const identity = user.identity || {};
          const documents = user.documents || [];
          const completionScore = PMTwinData.calculateProfileCompletionScore ? PMTwinData.calculateProfileCompletionScore(user) : 0;
          const review = user.review || {};
          
          return `
          <div class="card user-card pending" style="margin-bottom: var(--spacing-4);">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-4);">
                <div>
                  <h3>${escapeHtml(user.profile?.name || user.email)}</h3>
                  <p><strong>Email:</strong> ${escapeHtml(user.email)}</p>
                  <p><strong>Mobile:</strong> ${escapeHtml(user.mobile || 'Not provided')}</p>
                  <p><strong>User Type:</strong> <span class="badge badge-primary">${escapeHtml(userType)}</span></p>
                  <p><strong>Role:</strong> <span class="badge badge-secondary">${escapeHtml(user.role)}</span></p>
                  <p><strong>Registered:</strong> ${new Date(user.createdAt).toLocaleDateString()}</p>
                  ${review.submittedAt ? `<p><strong>Submitted for Review:</strong> ${new Date(review.submittedAt).toLocaleDateString()}</p>` : ''}
                  ${completionScore > 0 ? `<p><strong>Profile Completion:</strong> ${completionScore}%</p>` : ''}
                </div>
              </div>

              ${userType === 'company' ? `
                <div style="margin-top: var(--spacing-4);">
                  <h4>Identity & Compliance Information:</h4>
                  <ul>
                    <li><strong>Legal Entity Name:</strong> ${escapeHtml(identity.legalEntityName || 'Not provided')}</li>
                    <li><strong>CR Number:</strong> ${escapeHtml(identity.crNumber || 'Not provided')}</li>
                    <li><strong>Tax Number:</strong> ${escapeHtml(identity.taxNumber || 'Not provided')}</li>
                    <li><strong>Authorized Rep NID:</strong> ${escapeHtml(identity.authorizedRepresentativeNID || 'Not provided')}</li>
                    ${identity.scaClassification ? `<li><strong>SCA Classification:</strong> ${escapeHtml(identity.scaClassification)}</li>` : ''}
                  </ul>
                </div>
              ` : `
                <div style="margin-top: var(--spacing-4);">
                  <h4>Identity Information:</h4>
                  <ul>
                    <li><strong>Full Legal Name:</strong> ${escapeHtml(identity.fullLegalName || 'Not provided')}</li>
                    <li><strong>National ID/Passport:</strong> ${escapeHtml(identity.nationalId || identity.passportNumber || 'Not provided')}</li>
                    <li><strong>Contact Info:</strong> ${escapeHtml(identity.contactInfo || 'Not provided')}</li>
                  </ul>
                </div>
              `}
              
              <h4 style="margin-top: var(--spacing-4);">Documents:</h4>
              ${documents.length > 0 ? `
                <ul>
                  ${documents.map(doc => `
                    <li>
                      <strong>${escapeHtml(doc.type.toUpperCase())}:</strong> ${escapeHtml(doc.fileName)} 
                      (${(doc.fileSize / 1024).toFixed(2)} KB)
                      <button class="btn btn-sm btn-outline" onclick="AdminPortal.previewDocument('${user.id}', '${doc.id}')" style="margin-left: var(--spacing-2);">
                        Preview
                      </button>
                      <button class="btn btn-sm btn-outline" onclick="AdminPortal.downloadDocument('${user.id}', '${doc.id}')" style="margin-left: var(--spacing-1);">
                        Download
                      </button>
                    </li>
                  `).join('')}
                </ul>
              ` : `
                <p class="text-muted">No documents uploaded</p>
              `}
              
              ${(user.profile?.credentials || []).length > 0 ? `
                <h5 style="margin-top: var(--spacing-2);">Legacy Credentials:</h5>
                <ul>
                  ${(user.profile.credentials || []).map(cred => `
                    <li>${escapeHtml(cred.type)}: ${escapeHtml(cred.fileName)} (${(cred.fileSize / 1024).toFixed(2)} KB)</li>
                  `).join('')}
                </ul>
              ` : ''}

              <div style="margin-top: var(--spacing-4);">
                <h4>Verification Checklist:</h4>
                <div class="form-check">
                  <input type="checkbox" id="check_cr_${user.id}" ${user.role === 'entity' ? '' : 'disabled'}>
                  <label for="check_cr_${user.id}">CR Valid (for entities)</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="check_vat_${user.id}" ${user.role === 'entity' ? '' : 'disabled'}>
                  <label for="check_vat_${user.id}">VAT Valid (for entities)</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="check_license_${user.id}" ${user.role === 'individual' ? '' : 'disabled'}>
                  <label for="check_license_${user.id}">Professional License Valid (for individuals)</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="check_docs_${user.id}">
                  <label for="check_docs_${user.id}">Documents Complete</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="check_info_${user.id}">
                  <label for="check_info_${user.id}">Information Matches Documents</label>
                </div>
                <div class="form-check">
                  <input type="checkbox" id="check_flags_${user.id}">
                  <label for="check_flags_${user.id}">No Red Flags</label>
                </div>
              </div>

              <div class="form-group" style="margin-top: var(--spacing-4);">
                <label class="form-label">Comments/Notes</label>
                <textarea id="notes_${user.id}" class="form-control" rows="3"></textarea>
              </div>

              <div style="margin-top: var(--spacing-4);">
                <button class="btn btn-success" onclick="AdminPortal.approveUser('${user.id}')">Approve</button>
                <button class="btn btn-danger" onclick="AdminPortal.rejectUser('${user.id}')">Reject</button>
                <button class="btn btn-outline" onclick="AdminPortal.requestClarification('${user.id}')">Request Clarification</button>
                <button class="btn btn-primary" onclick="AdminPortal.loginAsUser('${user.id}')" style="margin-top: var(--spacing-2);" title="Login as this user to test their experience">Login as User</button>
              </div>
            </div>
          </div>
        `;
        }).join('')}
      </div>
    `;
  }

  function previewDocument(userId, docId) {
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found');
      return;
    }

    const doc = (user.documents || []).find(d => d.id === docId);
    if (!doc || !doc.base64Data) {
      alert('Document not found or not available');
      return;
    }

    // Create a new window to preview the document
    const previewWindow = window.open('', '_blank');
    if (doc.fileType === 'application/pdf') {
      previewWindow.document.write(`
        <html>
          <head><title>${doc.fileName}</title></head>
          <body style="margin:0; padding:0;">
            <embed src="${doc.base64Data}" type="application/pdf" width="100%" height="100%" style="position:absolute; top:0; left:0;"/>
          </body>
        </html>
      `);
    } else {
      previewWindow.document.write(`
        <html>
          <head><title>${doc.fileName}</title></head>
          <body style="margin:0; padding:20px; text-align:center; background:#f5f5f5;">
            <img src="${doc.base64Data}" style="max-width:100%; max-height:90vh; border:1px solid #ddd; box-shadow:0 2px 8px rgba(0,0,0,0.1);"/>
          </body>
        </html>
      `);
    }
  }

  function downloadDocument(userId, docId) {
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found');
      return;
    }

    const doc = (user.documents || []).find(d => d.id === docId);
    if (!doc || !doc.base64Data) {
      alert('Document not found or not available');
      return;
    }

    // Convert base64 to blob and download
    const byteCharacters = atob(doc.base64Data.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: doc.fileType });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function approveUser(userId) {
    if (!confirm('Approve this user?')) return;

    const user = PMTwinData.Users.getById(userId);
    if (!user) return;

    const notes = document.getElementById(`notes_${userId}`)?.value || '';

    // Update using new onboarding system
    PMTwinData.Users.update(userId, {
      onboardingStage: 'approved',
      profile: {
        ...user.profile,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.id
      },
      review: {
        ...user.review,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        status: 'approved',
        reviewNotes: notes
      },
      onboardingProgress: PMTwinData.calculateOnboardingProgress(
        user.userType || (user.role === 'entity' ? 'company' : 'consultant'),
        'approved',
        user
      )
    });

    // After approval, activate the account
    setTimeout(() => {
      PMTwinData.Users.update(userId, {
        onboardingStage: 'active'
      });
    }, 100);

    // Create notification
    PMTwinData.Notifications.create({
      userId: userId,
      type: 'account_approved',
      title: 'Account Approved!',
      message: 'Your account has been approved. You can now access the User Portal.',
      relatedEntityType: 'user',
      relatedEntityId: userId,
      actionUrl: '#login',
      actionLabel: 'Login'
    });

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: 'admin',
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'Admin',
      action: 'vetting_approval',
      actionCategory: 'admin',
      entityType: 'user',
      entityId: userId,
      description: `User approved: ${user.email}`,
      context: {
        portal: 'admin_portal'
      }
    });

    loadVetting();
    alert('User approved!');
  }

  function rejectUser(userId) {
    const reason = prompt('Enter rejection reason (required):');
    if (!reason || reason.trim() === '') {
      alert('Rejection reason is required');
      return;
    }

    const user = PMTwinData.Users.getById(userId);
    if (!user) return;

    const notes = document.getElementById(`notes_${userId}`)?.value || '';

    // Update using new onboarding system
    PMTwinData.Users.update(userId, {
      onboardingStage: 'rejected',
      verificationRejectionReason: reason,
      profile: {
        ...user.profile,
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date().toISOString(),
        rejectedBy: currentUser.id
      },
      review: {
        ...user.review,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        status: 'rejected',
        rejectionReason: reason,
        reviewNotes: notes
      },
      onboardingProgress: PMTwinData.calculateOnboardingProgress(
        user.userType || (user.role === 'entity' ? 'company' : 'consultant'),
        'rejected',
        user
      )
    });

    // Create notification
    PMTwinData.Notifications.create({
      userId: userId,
      type: 'account_rejected',
      title: 'Account Rejected',
      message: `Your account has been rejected. Reason: ${reason}`,
      relatedEntityType: 'user',
      relatedEntityId: userId,
      actionUrl: '#signup',
      actionLabel: 'Reapply'
    });

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: 'admin',
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'Admin',
      action: 'vetting_rejection',
      actionCategory: 'admin',
      entityType: 'user',
      entityId: userId,
      description: `User rejected: ${user.email}. Reason: ${reason}`,
      context: {
        portal: 'admin_portal',
        rejectionReason: reason
      }
    });

    loadVetting();
    alert('User rejected.');
  }

  function requestMoreInfo(userId) {
    // Legacy function - redirect to new function
    requestClarification(userId);
  }

  function requestClarification(userId) {
    const message = prompt('Enter message requesting clarification:');
    if (!message || message.trim() === '') {
      alert('Message is required');
      return;
    }

    const user = PMTwinData.Users.getById(userId);
    if (!user) return;

    const notes = document.getElementById(`notes_${userId}`)?.value || '';

    // Update review status to clarification_requested
    PMTwinData.Users.update(userId, {
      review: {
        ...user.review,
        status: 'clarification_requested',
        reviewNotes: notes + (notes ? '\n\n' : '') + `Clarification requested: ${message}`
      }
    });

    // Create notification
    PMTwinData.Notifications.create({
      userId: userId,
      type: 'account_update_required',
      title: 'Clarification Required',
      message: message,
      relatedEntityType: 'user',
      relatedEntityId: userId,
      actionUrl: '#onboarding',
      actionLabel: 'Update Profile'
    });

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: 'admin',
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'Admin',
      action: 'vetting_clarification_requested',
      actionCategory: 'admin',
      entityType: 'user',
      entityId: userId,
      description: `Clarification requested for user: ${user.email}`,
      context: {
        portal: 'admin_portal',
        message: message
      }
    });

    alert('Clarification request sent to user.');
    loadVetting();
  }

  function loginAsUser(userId) {
    // Confirmation dialog for security
    if (!confirm('Are you sure you want to log in as this user? This action will be logged in the audit trail.')) {
      return;
    }

    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found.');
      return;
    }

    // Check if user is admin (prevent logging in as admin)
    if (user.role === 'admin') {
      alert('Cannot log in as admin user. This feature is for testing regular user accounts only.');
      return;
    }

    try {
      // Decode password from base64
      let password;
      try {
        password = atob(user.password);
      } catch (e) {
        console.error('Error decoding password:', e);
        alert('Error: Could not decode user password. The account may need to be reset.');
        return;
      }

      // Attempt to log in as the user
      const result = PMTwinAuth.login(user.email, password);

      if (result.success) {
        // Create audit log entry for security tracking
        PMTwinData.Audit.create({
          userId: currentUser.id,
          userRole: 'admin',
          userEmail: currentUser.email,
          userName: currentUser.profile?.name || 'Admin',
          action: 'admin_impersonation',
          actionCategory: 'admin',
          entityType: 'user',
          entityId: userId,
          description: `Admin logged in as user: ${user.email} (${user.profile?.name || 'Unknown'})`,
          context: {
            portal: 'admin_portal',
            impersonatedUserId: userId,
            impersonatedUserEmail: user.email,
            impersonatedUserRole: user.role
          }
        });

        // Redirect to user portal
        window.location.href = 'user-portal.html';
      } else {
        alert('Failed to log in as user: ' + (result.error || 'Unknown error'));
        console.error('Login as user failed:', result);
      }
    } catch (error) {
      console.error('Error logging in as user:', error);
      alert('An error occurred while trying to log in as user: ' + error.message);
    }
  }

  // ============================================
  // Moderation
  // ============================================
  function loadModeration() {
    const container = document.getElementById('moderationContent');
    const flaggedProjects = PMTwinData.Projects.getAll().filter(p => p.flagged);
    const allProjects = PMTwinData.Projects.getAll();

    container.innerHTML = `
      <div class="card" style="margin-bottom: var(--spacing-6);">
        <div class="card-header">
          <h3>Flagged Projects (${flaggedProjects.length})</h3>
        </div>
        <div class="card-body">
          ${flaggedProjects.length === 0 ? '<p>No flagged projects.</p>' : flaggedProjects.map(project => {
            const creator = PMTwinData.Users.getById(project.creatorId);
            return `
              <div class="card" style="margin-bottom: var(--spacing-4);">
                <div class="card-body">
                  <h4>${escapeHtml(project.title)}</h4>
                  <p><strong>Creator:</strong> ${escapeHtml(creator?.profile?.name || 'Unknown')}</p>
                  <p><strong>Flag Reason:</strong> ${escapeHtml(project.flagReason || 'Not specified')}</p>
                  <p><strong>Category:</strong> ${escapeHtml(project.category)}</p>
                  <p><strong>Quality Score:</strong> ${project.qualityScore || 'N/A'}</p>
                  <div style="margin-top: var(--spacing-4);">
                    <button class="btn btn-success" onclick="AdminPortal.approveProject('${project.id}')">Approve Project</button>
                    <button class="btn btn-danger" onclick="AdminPortal.removeProject('${project.id}')">Remove Project</button>
                    <button class="btn btn-outline" onclick="AdminPortal.viewProject('${project.id}')">View Details</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3>All Projects (${allProjects.length})</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Quality Score</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${allProjects.slice(0, 20).map(project => {
                  const creator = PMTwinData.Users.getById(project.creatorId);
                  return `
                    <tr>
                      <td>${escapeHtml(project.title)}</td>
                      <td>${escapeHtml(creator?.profile?.name || 'Unknown')}</td>
                      <td>${escapeHtml(project.category)}</td>
                      <td><span class="badge badge-primary">${escapeHtml(project.status)}</span></td>
                      <td>${project.qualityScore || 'N/A'}</td>
                      <td>
                        <button class="btn btn-sm btn-outline" onclick="AdminPortal.viewProject('${project.id}')">View</button>
                        ${!project.flagged ? `
                          <button class="btn btn-sm btn-danger" onclick="AdminPortal.flagProject('${project.id}')">Flag</button>
                        ` : ''}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  function approveProject(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    PMTwinData.Projects.update(projectId, {
      flagged: false,
      flagReason: null
    });

    loadModeration();
    alert('Project approved and unflagged.');
  }

  function removeProject(projectId) {
    const reason = prompt('Enter removal reason:');
    if (!reason) return;

    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    // Create notification for creator
    PMTwinData.Notifications.create({
      userId: project.creatorId,
      type: 'project_removed',
      title: 'Project Removed',
      message: `Your project "${project.title}" has been removed. Reason: ${reason}`,
      relatedEntityType: 'project',
      relatedEntityId: projectId,
      actionUrl: '#projects',
      actionLabel: 'View Projects'
    });

    // Create audit log
    PMTwinData.Audit.create({
      userId: currentUser.id,
      userRole: 'admin',
      userEmail: currentUser.email,
      userName: currentUser.profile?.name || 'Admin',
      action: 'project_removal',
      actionCategory: 'admin',
      entityType: 'project',
      entityId: projectId,
      description: `Project removed: ${project.title}. Reason: ${reason}`,
      context: {
        portal: 'admin_portal',
        removalReason: reason
      }
    });

    PMTwinData.Projects.delete(projectId);
    loadModeration();
    alert('Project removed.');
  }

  function flagProject(projectId) {
    const reason = prompt('Enter flag reason:');
    if (!reason) return;

    PMTwinData.Projects.update(projectId, {
      flagged: true,
      flagReason: reason
    });

    loadModeration();
    alert('Project flagged.');
  }

  function viewProject(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    const creator = PMTwinData.Users.getById(project.creatorId);

    showModal('Project Details', `
      <h3>${escapeHtml(project.title)}</h3>
      <p><strong>Creator:</strong> ${escapeHtml(creator?.profile?.name || 'Unknown')}</p>
      <p><strong>Category:</strong> ${escapeHtml(project.category)}</p>
      <p><strong>Location:</strong> ${escapeHtml(project.location?.city || 'N/A')}, ${escapeHtml(project.location?.region || '')}</p>
      <p><strong>Budget:</strong> ${project.budget?.min?.toLocaleString() || 'N/A'} - ${project.budget?.max?.toLocaleString() || 'N/A'} SAR</p>
      <p><strong>Status:</strong> <span class="badge badge-primary">${escapeHtml(project.status)}</span></p>
      <p><strong>Quality Score:</strong> ${project.qualityScore || 'N/A'}</p>
      ${project.flagged ? `<p><strong>Flag Reason:</strong> ${escapeHtml(project.flagReason || 'N/A')}</p>` : ''}
      <p><strong>Description:</strong></p>
      <p>${escapeHtml(project.description || '')}</p>
      <p><strong>Proposals Received:</strong> ${project.proposalsReceived || 0}</p>
      <p><strong>Matches Generated:</strong> ${project.matchesGenerated || 0}</p>
    `);
  }

  // ============================================
  // Reports
  // ============================================
  function loadReports() {
    const container = document.getElementById('reportsContent');
    
    const allProjects = PMTwinData.Projects.getAll();
    const activeProjects = allProjects.filter(p => p.status === 'active' || p.status === 'in_progress');
    const allProposals = PMTwinData.Proposals.getAll();
    const barterProposals = allProposals.filter(p => p.type === 'barter');
    
    // Calculate platform volume
    const platformVolume = allProjects.reduce((sum, p) => sum + (p.budget?.max || 0), 0);
    const completedVolume = allProjects
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.budget?.max || 0), 0);
    
    // Calculate barter values
    const barterValue = barterProposals.reduce((sum, p) => {
      return sum + (p.barterDetails?.totalOffered || 0);
    }, 0);

    // Calculate average savings (simulated - 10% for bulk purchasing)
    const bulkDeals = allProposals.filter(p => p.type === 'cash').length;
    const avgSavings = bulkDeals > 0 ? 10 : 0; // 10% average savings

    container.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${(platformVolume / 1000000).toFixed(1)}M</div>
          <div class="stat-label">Total Platform Volume (SAR)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(completedVolume / 1000000).toFixed(1)}M</div>
          <div class="stat-label">Completed Projects Volume (SAR)</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${avgSavings}%</div>
          <div class="stat-label">Avg. Bulk Purchasing Savings</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(barterValue / 1000000).toFixed(1)}M</div>
          <div class="stat-label">Barter Transaction Value (SAR)</div>
        </div>
      </div>

      <div class="grid grid-cols-1 grid-cols-md-2 gap-6" style="margin-top: var(--spacing-6);">
        <div class="card">
          <div class="card-header">
            <h3>Projects by Category</h3>
          </div>
          <div class="card-body">
            ${getCategoryBreakdown(allProjects)}
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Proposals Breakdown</h3>
          </div>
          <div class="card-body">
            <p><strong>Total Proposals:</strong> ${allProposals.length}</p>
            <p><strong>Cash Proposals:</strong> ${allProposals.filter(p => p.type === 'cash').length}</p>
            <p><strong>Barter Proposals:</strong> ${barterProposals.length}</p>
            <p><strong>Approved:</strong> ${allProposals.filter(p => p.status === 'approved').length}</p>
            <p><strong>Completed:</strong> ${allProposals.filter(p => p.status === 'completed').length}</p>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--spacing-6);">
        <div class="card-header">
          <h3>Export Report</h3>
        </div>
        <div class="card-body">
          <button class="btn btn-primary" onclick="AdminPortal.exportReport()">Export as JSON</button>
          <button class="btn btn-outline" onclick="AdminPortal.exportReportCSV()" style="margin-left: var(--spacing-2);">Export as CSV</button>
        </div>
      </div>
    `;
  }

  function getCategoryBreakdown(projects) {
    const categories = {};
    projects.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });

    return Object.entries(categories).map(([cat, count]) => `
      <p><strong>${escapeHtml(cat)}:</strong> ${count}</p>
    `).join('');
  }

  function exportReport() {
    const data = {
      platformVolume: PMTwinData.Projects.getAll().reduce((sum, p) => sum + (p.budget?.max || 0), 0),
      activeProjects: PMTwinData.Projects.getActive().length,
      totalProposals: PMTwinData.Proposals.getAll().length,
      barterValue: PMTwinData.Proposals.getAll()
        .filter(p => p.type === 'barter')
        .reduce((sum, p) => sum + (p.barterDetails?.totalOffered || 0), 0),
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmtwin-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportReportCSV() {
    const projects = PMTwinData.Projects.getAll();
    const csv = [
      ['Title', 'Category', 'Status', 'Budget Max', 'Proposals Received'].join(','),
      ...projects.map(p => [
        `"${p.title}"`,
        p.category,
        p.status,
        p.budget?.max || 0,
        p.proposalsReceived || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmtwin-report-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Audit Trail
  // ============================================
  function loadAudit() {
    const container = document.getElementById('auditContent');
    const logs = PMTwinData.Audit.getRecent(100);

    container.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3>Audit Trail (Last 100 entries)</h3>
        </div>
        <div class="card-body">
          <div class="table-responsive">
            <table class="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Entity</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                ${logs.map(log => `
                  <tr>
                    <td>${new Date(log.timestamp).toLocaleString()}</td>
                    <td>${escapeHtml(log.userName || log.userEmail || 'System')}</td>
                    <td><span class="badge badge-info">${escapeHtml(log.action)}</span></td>
                    <td>${escapeHtml(log.entityType)}: ${escapeHtml(log.entityId)}</td>
                    <td>${escapeHtml(log.description)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Modal Functions
  // ============================================
  function showModal(title, body) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = '<button class="btn btn-outline" onclick="AdminPortal.closeModal()">Close</button>';
    
    document.getElementById('modalBackdrop').classList.add('show');
    document.getElementById('modal').classList.add('show');
  }

  function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
    document.getElementById('modal').classList.remove('show');
  }

  // ============================================
  // Utility Functions
  // ============================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function handleLogin(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const emailInput = document.getElementById('adminLoginEmail');
    const passwordInput = document.getElementById('adminLoginPassword');
    const errorEl = document.getElementById('adminLoginError');
    
    if (!emailInput || !passwordInput) {
      console.error('Login form elements not found');
      return false;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    
    // Clear previous errors
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    
    // Validate inputs
    if (!email || !password) {
      if (errorEl) {
        errorEl.textContent = 'Please enter both email and password';
        errorEl.style.display = 'block';
      }
      return false;
    }
    
    // Ensure test accounts exist and are properly initialized before attempting login
    if (typeof PMTwinData !== 'undefined') {
      if (PMTwinData.verifyAndCreateAccounts) {
        PMTwinData.verifyAndCreateAccounts();
      } else if (PMTwinData.autoCreateTestAccounts) {
        PMTwinData.autoCreateTestAccounts();
      }
      
      // Ensure the admin account exists and has correct fields
      const user = PMTwinData.Users.getByEmail(email);
      if (user) {
        // Fix missing fields for test accounts
        if (user.profile?.status === 'approved' && (!user.emailVerified || user.onboardingStage !== 'approved')) {
          PMTwinData.Users.update(user.id, {
            emailVerified: true,
            onboardingStage: 'approved'
          });
        }
        
        // Fix password if it's not properly encoded
        try {
          const decoded = atob(user.password);
          // If decoding works, password is fine
        } catch (e) {
          // Password might not be base64 encoded, fix it
          if (user.email === 'admin@pmtwin.com') {
            PMTwinData.Users.update(user.id, { password: btoa('Admin123') });
          } else if (user.email === 'individual@pmtwin.com') {
            PMTwinData.Users.update(user.id, { password: btoa('User123') });
          } else if (user.email === 'entity@pmtwin.com') {
            PMTwinData.Users.update(user.id, { password: btoa('Entity123') });
          }
        }
      }
    }
    
    // Attempt login
    const result = PMTwinAuth.login(email, password);
    
    if (result.success) {
      // Check if user is admin
      if (result.user.role !== 'admin') {
        // Redirect to appropriate portal based on role
        if (result.user.role === 'individual' || result.user.role === 'entity') {
          window.location.href = 'user-portal.html';
        } else {
          window.location.href = 'public-portal.html';
        }
        return false;
      }
      
      // Success - reload the page to show authenticated content
      console.log('Login successful, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
      return false;
    } else {
      // Login failed - show error
      let errorMsg = result.error;
      
      // Add helpful message if accounts might not exist
      if (errorMsg.includes('Invalid email or password')) {
        const user = PMTwinData.Users.getByEmail(email);
        if (!user) {
          errorMsg = 'Account not found. The account may not exist.<br><br>' +
            '<strong>Quick Fix:</strong><br>' +
            '1. Open browser console (F12)<br>' +
            '2. Run: <code>PMTwinData.forceCreateTestAccounts()</code><br>' +
            '3. Try logging in again<br><br>' +
            'Or visit: <a href="fix-accounts.html">fix-accounts.html</a>';
        } else {
          // Account exists - check password
          try {
            const decoded = atob(user.password);
            errorMsg = 'Invalid password.<br><br>' +
              '<strong>Expected password:</strong> Admin123<br>' +
              'Make sure you typed: <code>Admin123</code> (case-sensitive)<br><br>' +
              'Account status: ' + (user.profile?.status || 'unknown');
          } catch (e) {
            errorMsg = 'Password encoding error. Account may need to be recreated.';
          }
        }
      }
      
      if (errorEl) {
        errorEl.innerHTML = errorMsg;
        errorEl.style.display = 'block';
      } else {
        alert('Login Error: ' + errorMsg.replace(/<br>/g, '\n').replace(/<[^>]*>/g, ''));
      }
      
      console.error('Login failed:', result);
    }
    
    return false;
  }

  function testLogin() {
    // Auto-fill and test login
    const emailInput = document.getElementById('adminLoginEmail');
    const passwordInput = document.getElementById('adminLoginPassword');
    const errorEl = document.getElementById('adminLoginError');
    
    if (emailInput) emailInput.value = 'admin@pmtwin.com';
    if (passwordInput) passwordInput.value = 'Admin123';
    
    // Clear previous errors
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }
    
    console.log('🔍 Testing admin login...');
    
    // Ensure accounts exist
    if (typeof PMTwinData !== 'undefined' && PMTwinData.forceCreateTestAccounts) {
      PMTwinData.forceCreateTestAccounts();
    }
    
    // Check if account exists
    const user = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    
    if (!user) {
      const msg = 'Admin account not found! Creating account...';
      console.error('❌', msg);
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = 'block';
      }
      
      // Try to create manually
      PMTwinData.Users.create({
        email: 'admin@pmtwin.com',
        password: btoa('Admin123'),
        role: 'admin',
        profile: {
          name: 'Admin User',
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        }
      });
      
      // Try again
      setTimeout(() => {
        const result = PMTwinAuth.login('admin@pmtwin.com', 'Admin123');
        if (result.success) {
          window.location.reload();
        } else {
          if (errorEl) {
            errorEl.textContent = 'Login failed: ' + result.error;
            errorEl.style.display = 'block';
          }
        }
      }, 100);
      return;
    }
    
    console.log('✅ Admin account found');
    console.log('  Status:', user.profile?.status);
    console.log('  Role:', user.role);
    console.log('  Password (encoded):', user.password);
    
    // Fix password if wrong
    try {
      const decoded = atob(user.password);
      console.log('  Password (decoded):', decoded);
      console.log('  Expected: Admin123');
      
      if (decoded !== 'Admin123') {
        console.warn('⚠️ Password mismatch! Fixing...');
        PMTwinData.Users.update(user.id, {
          password: btoa('Admin123')
        });
        console.log('✅ Password fixed');
      }
    } catch (e) {
      console.error('❌ Password decode error:', e);
      // Fix password
      PMTwinData.Users.update(user.id, {
        password: btoa('Admin123')
      });
    }
    
    // Fix status if not approved
    if (user.profile?.status !== 'approved') {
      console.warn('⚠️ Status not approved! Fixing...');
      PMTwinData.Users.update(user.id, {
        profile: {
          ...user.profile,
          status: 'approved',
          approvedAt: new Date().toISOString()
        }
      });
      console.log('✅ Status fixed');
    }
    
    // Try to login
    console.log('🔐 Attempting login...');
    const result = PMTwinAuth.login('admin@pmtwin.com', 'Admin123');
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('  User:', result.user.email);
      console.log('  Session created:', result.session ? 'Yes' : 'No');
      
      // Verify session
      const session = PMTwinData.Sessions.getCurrentSession();
      console.log('  Current session:', session);
      
      if (session) {
        alert('✅ Login successful! Reloading page...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        alert('⚠️ Login succeeded but session not found. Try refreshing manually.');
        if (errorEl) {
          errorEl.textContent = 'Session issue. Please refresh the page.';
          errorEl.style.display = 'block';
        }
      }
    } else {
      console.error('❌ Login failed:', result.error);
      if (errorEl) {
        errorEl.textContent = result.error;
        errorEl.style.display = 'block';
      }
      alert('Login failed: ' + result.error);
    }
  }
  
  function fixAccounts() {
    console.log('🔧 Fixing accounts...');
    
    if (typeof PMTwinData === 'undefined') {
      alert('PMTwinData not loaded. Please refresh the page.');
      return;
    }
    
    // Force create accounts
    if (PMTwinData.forceCreateTestAccounts) {
      PMTwinData.forceCreateTestAccounts();
    }
    
    // Verify and fix admin account specifically
    const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    if (admin) {
      // Ensure password is correct
      try {
        const decoded = atob(admin.password);
        if (decoded !== 'Admin123') {
          console.log('Fixing admin password...');
          PMTwinData.Users.update(admin.id, {
            password: btoa('Admin123')
          });
        }
      } catch (e) {
        console.log('Fixing admin password (encoding error)...');
        PMTwinData.Users.update(admin.id, {
          password: btoa('Admin123')
        });
      }
      
      // Ensure status is approved
      if (admin.profile?.status !== 'approved') {
        console.log('Fixing admin status...');
        PMTwinData.Users.update(admin.id, {
          profile: {
            ...admin.profile,
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: 'system'
          }
        });
      }
    } else {
      // Create admin if doesn't exist
      console.log('Creating admin account...');
      PMTwinData.Users.create({
        email: 'admin@pmtwin.com',
        password: btoa('Admin123'),
        role: 'admin',
        profile: {
          name: 'Admin User',
          status: 'approved',
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        }
      });
    }
    
    console.log('✅ Accounts fixed!');
    alert('✅ Accounts fixed! Try logging in again with:\nEmail: admin@pmtwin.com\nPassword: Admin123');
    
    // Show account status
    const fixedAdmin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    if (fixedAdmin) {
      console.log('Admin account verified:');
      console.log('  Email:', fixedAdmin.email);
      console.log('  Role:', fixedAdmin.role);
      console.log('  Status:', fixedAdmin.profile?.status);
      console.log('  Password check:', atob(fixedAdmin.password) === 'Admin123' ? '✅ Correct' : '❌ Wrong');
    }
    
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  function logout() {
    PMTwinAuth.logout();
    window.location.href = 'index.html';
  }

  // ============================================
  // Public API
  // ============================================
  window.AdminPortal = {
    init,
    logout,
    handleLogin,
    testLogin,
    fixAccounts,
    approveUser,
    rejectUser,
    requestMoreInfo,
    requestClarification,
    previewDocument,
    downloadDocument,
    loginAsUser,
    approveProject,
    removeProject,
    flagProject,
    viewProject,
    exportReport,
    exportReportCSV,
    showModal,
    closeModal
  };

  // Setup form listener
  function setupFormListener() {
    const form = document.getElementById('adminLoginForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted, calling handleLogin...');
        AdminPortal.handleLogin(e);
        return false;
      });
      console.log('✅ Login form listener attached');
    }
  }

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      init();
      setTimeout(setupFormListener, 200);
    });
  } else {
    init();
    setTimeout(setupFormListener, 200);
  }

})();

