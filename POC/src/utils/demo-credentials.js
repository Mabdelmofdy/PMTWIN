/**
 * PMTwin Demo Credentials Module
 * Provides demo user credentials modal for quick login demonstrations
 */

(function() {
  'use strict';

  let demoUsers = [];
  let isLoading = false;

  // Portal type to role mapping
  const PORTAL_ROLE_MAP = {
    'admin': ['platform_admin', 'admin', 'auditor'],
    'user': ['beneficiary', 'project_lead', 'entity', 'vendor', 'professional', 'supplier', 'service_provider', 'skill_service_provider', 'consultant', 'sub_contractor', 'mentor', 'individual'],
    'mobile': ['beneficiary', 'project_lead', 'entity', 'vendor', 'professional', 'supplier', 'service_provider', 'skill_service_provider', 'consultant', 'sub_contractor', 'mentor', 'individual'],
    'public': ['platform_admin', 'admin', 'beneficiary', 'project_lead', 'entity', 'vendor', 'professional', 'supplier', 'service_provider', 'skill_service_provider', 'consultant', 'sub_contractor', 'mentor', 'auditor', 'individual'] // Show all in public portal
  };

  // ============================================
  // Helper: Get Base Path for Data Files
  // ============================================
  function getDataBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    const depth = segments.length;
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Load Demo Users
  // ============================================
  async function loadDemoUsers() {
    if (demoUsers.length > 0) {
      return demoUsers; // Already loaded
    }

    if (isLoading) {
      // Wait for ongoing load
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!isLoading && demoUsers.length > 0) {
            clearInterval(checkInterval);
            resolve(demoUsers);
          }
        }, 100);
      });
    }

    isLoading = true;

    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/demo-users.json');
      if (!response.ok) {
        throw new Error(`Failed to load demo users: ${response.status}`);
      }
      const data = await response.json();
      demoUsers = data.users || [];
      console.log(`✅ Loaded ${demoUsers.length} demo users`);
      return demoUsers;
    } catch (error) {
      console.error('Error loading demo users:', error);
      // Return empty array on error
      return [];
    } finally {
      isLoading = false;
    }
  }

  // ============================================
  // Filter Users by Portal Type
  // ============================================
  function getFilteredUsers(portalType) {
    const allowedRoles = PORTAL_ROLE_MAP[portalType] || [];
    return demoUsers.filter(user => allowedRoles.includes(user.role));
  }

  // ============================================
  // Get Role Badge HTML
  // ============================================
  function getRoleBadge(role) {
    const roleLabels = {
      'platform_admin': { text: 'Platform Admin', class: 'badge-error' },
      'admin': { text: 'Admin', class: 'badge-error' },
      'beneficiary': { text: 'Beneficiary', class: 'badge-success' },
      'project_lead': { text: 'Project Lead', class: 'badge-success' },
      'entity': { text: 'Entity', class: 'badge-success' },
      'vendor': { text: 'Vendor', class: 'badge-warning' },
      'professional': { text: 'Professional', class: 'badge-info' },
      'individual': { text: 'Individual', class: 'badge-info' },
      'supplier': { text: 'Supplier', class: 'badge-warning' },
      'service_provider': { text: 'Service Provider', class: 'badge-primary' },
      'skill_service_provider': { text: 'Service Provider', class: 'badge-primary' },
      'consultant': { text: 'Consultant', class: 'badge-secondary' },
      'sub_contractor': { text: 'SubContractor', class: 'badge-purple' },
      'mentor': { text: 'Mentor', class: 'badge-purple' },
      'auditor': { text: 'Auditor', class: 'badge-dark' }
    };

    const badge = roleLabels[role] || { text: role, class: 'badge' };
    return `<span class="badge ${badge.class}">${badge.text}</span>`;
  }

  // ============================================
  // Login with Demo User (One-Click Login)
  // ============================================
  async function loginWithDemoUser(user) {
    console.log(`🔐 Logging in with demo user: ${user.name} (${user.email})`);
    
    // Show loading state
    const card = document.querySelector(`[data-user-id="${user.userId}"]`);
    if (card) {
      card.classList.add('logging-in');
      const button = card.querySelector('.demo-user-select-btn');
      if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="ph ph-circle-notch ph-spin" style="animation: spin 1s linear infinite;"></i> Logging in...';
      }
      
      // Disable all cards to prevent multiple clicks
      document.querySelectorAll('.demo-user-card').forEach(c => {
        c.style.pointerEvents = 'none';
      });
    }

    try {
      // Try AuthService first, then fallback to PMTwinAuth
      let result;
      if (typeof AuthService !== 'undefined') {
        result = await AuthService.login(user.email, user.password);
      } else if (typeof PMTwinAuth !== 'undefined') {
        result = await PMTwinAuth.login(user.email, user.password);
      } else {
        // Fallback: try to find and submit form
        return fallbackToFormFill(user);
      }

      if (result.success) {
        console.log('✅ Login successful:', result);

    // Close modal
    closeDemoCredentialsModal();

        // Wait a moment for session to be stored
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Redirect to dashboard
        const basePath = getBasePath();
        const currentPath = window.location.pathname;
        
        // Determine redirect based on user role
        let redirectPath = `${basePath}dashboard/`;
        
        // Check for admin roles (case-insensitive)
        const role = user.role?.toLowerCase();
        const adminRoles = ['admin', 'platform_admin', 'auditor'];
        const isAdmin = adminRoles.some(r => r.toLowerCase() === role);
        
        if (isAdmin) {
          redirectPath = `${basePath}admin/`;
          console.log('🔐 Admin user detected in demo credentials, redirecting to admin portal');
        } else if (role === 'beneficiary' || role === 'entity' || role === 'project_lead' ||
                   role === 'vendor' || role === 'service_provider' || role === 'skill_service_provider' ||
                   role === 'consultant' || role === 'sub_contractor' || role === 'professional' ||
                   role === 'supplier' || role === 'individual') {
          redirectPath = `${basePath}dashboard/`;
          console.log('👤 User detected in demo credentials, redirecting to dashboard');
        } else {
          console.warn('⚠️ Unknown role in demo credentials:', user.role);
        }
        
        console.log(`🔄 Redirecting to: ${redirectPath}`);
        window.location.href = redirectPath;

    return true;
      } else {
        // Login failed
        console.error('❌ Login failed:', result.error);
        showLoginError(card, result.error || 'Login failed. Please try again.');
        return false;
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
      showLoginError(card, 'An error occurred during login. Please try again.');
      return false;
    }
  }

  // ============================================
  // Fallback: Fill Form Fields
  // ============================================
  function fallbackToFormFill(user) {
    // Try to find form inputs
    const emailInput = document.getElementById('loginEmail') || document.querySelector('input[type="email"]');
    const passwordInput = document.getElementById('loginPassword') || document.querySelector('input[type="password"]');

    if (emailInput && passwordInput) {
      emailInput.value = user.email;
      passwordInput.value = user.password;
      
      // Try to submit the form
      const form = emailInput.closest('form');
      if (form) {
        closeDemoCredentialsModal();
        // Trigger form submit after a short delay
        setTimeout(() => {
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
        }, 100);
        return true;
      }
    }
    
    // If no form found, show error
    alert('Could not find login form. Please use the login form on this page.');
    return false;
  }

  // ============================================
  // Show Login Error
  // ============================================
  function showLoginError(card, errorMessage) {
    if (!card) return;
    
    // Remove loading state
    card.classList.remove('logging-in');
    const button = card.querySelector('.demo-user-select-btn');
    if (button) {
      button.disabled = false;
      button.innerHTML = '<span class="login-icon"><i class="ph ph-lock"></i></span> Login Now';
    }
    
    // Re-enable all cards
    document.querySelectorAll('.demo-user-card').forEach(c => {
      c.style.pointerEvents = '';
    });
    
    // Show error message
    let errorDiv = card.querySelector('.demo-login-error');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.className = 'demo-login-error';
      card.appendChild(errorDiv);
    }
    errorDiv.textContent = errorMessage;
    errorDiv.style.display = 'block';
    
    // Hide error after 5 seconds
    setTimeout(() => {
      if (errorDiv) {
        errorDiv.style.display = 'none';
      }
    }, 5000);
  }

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    // Calculate depth from POC root (count segments after 'pages')
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC');
    const pagesIndex = segments.indexOf('pages');
    
    if (pagesIndex >= 0) {
      // Calculate depth: number of segments after 'pages' (excluding filename)
      const depth = segments.length - pagesIndex - 1;
      return depth > 0 ? '../'.repeat(depth) : '';
    }
    
    // Fallback: if no 'pages' found, calculate based on total segments
    const depth = segments.length - 1; // -1 for filename
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Show Demo Credentials Modal
  // ============================================
  async function showDemoCredentialsModal(portalType, emailInputId, passwordInputId) {
    console.log('📋 showDemoCredentialsModal called with:', { portalType, emailInputId, passwordInputId });
    
    // Load demo users first
    await loadDemoUsers();
    console.log('📦 Demo users loaded:', demoUsers.length);

    // Get filtered users for this portal
    const filteredUsers = getFilteredUsers(portalType);
    console.log('🔍 Filtered users for portal type "' + portalType + '":', filteredUsers.length);

    if (filteredUsers.length === 0) {
      console.warn('⚠️ No demo users available for portal type:', portalType);
      alert('No demo users available for this portal type.');
      return;
    }

    // Check if modal elements exist
    let modalBackdrop = document.getElementById('demoCredentialsModalBackdrop');
    let modal = document.getElementById('demoCredentialsModal');

    // Create modal if it doesn't exist
    if (!modalBackdrop || !modal) {
      createModalStructure();
      modalBackdrop = document.getElementById('demoCredentialsModalBackdrop');
      modal = document.getElementById('demoCredentialsModal');
    }

    // Build modal content
    const modalContent = buildModalContent(filteredUsers, emailInputId, passwordInputId);

    // Set modal content
    const modalBody = document.getElementById('demoCredentialsModalBody');
    if (modalBody) {
      modalBody.innerHTML = modalContent;
    }

    // Show modal
    if (modalBackdrop && modal) {
      modalBackdrop.classList.add('show');
      modal.classList.add('show');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
      console.log('✅ Modal displayed successfully');
    } else {
      console.error('❌ Modal elements not found after creation');
    }
  }

  // ============================================
  // Build Modal Content
  // ============================================
  function buildModalContent(users, emailInputId, passwordInputId) {
    let html = '<div class="demo-credentials-list">';

    users.forEach((user, index) => {
      // Store user data in data attributes for safe access
      const userData = JSON.stringify(user).replace(/"/g, '&quot;');
      html += `
        <div class="demo-user-card clickable" data-user-id="${user.userId}" data-user-data="${userData}">
          <div class="demo-user-header">
            <h3 class="demo-user-name">${user.name}</h3>
            ${getRoleBadge(user.role)}
          </div>
          <p class="demo-user-description">${user.description}</p>
          <div class="demo-user-credentials">
            <div class="demo-credential-item">
              <label>Email:</label>
              <code class="demo-credential-value">${user.email}</code>
            </div>
            <div class="demo-credential-item">
              <label>Password:</label>
              <code class="demo-credential-value">${user.password}</code>
            </div>
          </div>
          <button 
            class="btn btn-primary btn-block demo-user-select-btn" 
            data-email-input="${emailInputId}"
            data-password-input="${passwordInputId}"
            style="margin-top: var(--spacing-4);"
          >
            <span class="login-icon"><i class="ph ph-lock"></i></span> Login Now
          </button>
        </div>
      `;
    });

    html += '</div>';
    
    // Add event listeners after content is inserted
    setTimeout(() => {
      // Make entire card clickable
      document.querySelectorAll('.demo-user-card').forEach(card => {
        card.addEventListener('click', function(e) {
          // Don't trigger if clicking on the button (button has its own handler)
          if (e.target.closest('.demo-user-select-btn')) {
            return;
          }
          
          const userDataStr = this.getAttribute('data-user-data');
          if (userDataStr) {
            try {
              const user = JSON.parse(userDataStr.replace(/&quot;/g, '"'));
              loginWithDemoUser(user);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
        });
      });
      
      // Button click handler (also triggers login)
      document.querySelectorAll('.demo-user-select-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
          e.stopPropagation(); // Prevent card click
          const card = this.closest('.demo-user-card');
          const userDataStr = card.getAttribute('data-user-data');
          if (userDataStr) {
            try {
              const user = JSON.parse(userDataStr.replace(/&quot;/g, '"'));
              loginWithDemoUser(user);
            } catch (e) {
              console.error('Error parsing user data:', e);
            }
          }
        });
      });
    }, 0);
    
    return html;
  }

  // ============================================
  // Create Modal Structure
  // ============================================
  function createModalStructure() {
    // Check if already exists
    if (document.getElementById('demoCredentialsModal')) {
      return;
    }

    const modalHTML = `
      <div id="demoCredentialsModalBackdrop" class="modal-backdrop" onclick="DemoCredentials.closeModal()"></div>
      <div id="demoCredentialsModal" class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Quick Login - Demo Accounts</h2>
          <button class="modal-close" onclick="DemoCredentials.closeModal()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" id="demoCredentialsModalBody">
          <p style="margin-bottom: var(--spacing-4); color: var(--text-secondary); font-size: var(--font-size-sm); text-align: center;">
            👆 Click on any account card to login instantly
          </p>
          <!-- Content loaded here -->
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="DemoCredentials.closeModal()">Close</button>
        </div>
      </div>
    `;

    // Append to body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  // ============================================
  // Close Modal
  // ============================================
  function closeDemoCredentialsModal() {
    const modalBackdrop = document.getElementById('demoCredentialsModalBackdrop');
    const modal = document.getElementById('demoCredentialsModal');

    if (modalBackdrop && modal) {
      modalBackdrop.classList.remove('show');
      modal.classList.remove('show');
      document.body.style.overflow = ''; // Restore scrolling
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.DemoCredentials = {
    showModal: showDemoCredentialsModal,
    closeModal: closeDemoCredentialsModal,
    loginWithDemoUser: loginWithDemoUser,
    loadDemoUsers: loadDemoUsers,
    getFilteredUsers: getFilteredUsers
  };

  // Preload demo users on module load
  loadDemoUsers().catch(err => {
    console.warn('Could not preload demo users:', err);
  });

})();

