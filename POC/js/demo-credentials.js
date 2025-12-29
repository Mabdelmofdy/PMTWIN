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
    'admin': ['admin'],
    'user': ['individual', 'entity'],
    'mobile': ['individual', 'entity'],
    'public': ['admin', 'individual', 'entity'] // Show all in public portal
  };

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
      const response = await fetch('../data/demo-users.json');
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
      'admin': { text: 'Admin', class: 'badge-error' },
      'individual': { text: 'Individual', class: 'badge-info' },
      'entity': { text: 'Entity', class: 'badge-success' }
    };

    const badge = roleLabels[role] || { text: role, class: 'badge' };
    return `<span class="badge ${badge.class}">${badge.text}</span>`;
  }

  // ============================================
  // Select Demo User (Auto-fill)
  // ============================================
  function selectDemoUser(user, emailInputId, passwordInputId) {
    const emailInput = document.getElementById(emailInputId);
    const passwordInput = document.getElementById(passwordInputId);

    if (!emailInput || !passwordInput) {
      console.error('Form inputs not found:', { emailInputId, passwordInputId });
      alert('Error: Could not find form fields. Please check the console.');
      return false;
    }

    // Fill the form fields
    emailInput.value = user.email;
    passwordInput.value = user.password;

    // Focus on password field
    passwordInput.focus();

    // Close modal
    closeDemoCredentialsModal();

    console.log(`✅ Auto-filled credentials for: ${user.name} (${user.email})`);

    return true;
  }

  // ============================================
  // Show Demo Credentials Modal
  // ============================================
  async function showDemoCredentialsModal(portalType, emailInputId, passwordInputId) {
    // Load demo users first
    await loadDemoUsers();

    // Get filtered users for this portal
    const filteredUsers = getFilteredUsers(portalType);

    if (filteredUsers.length === 0) {
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
        <div class="demo-user-card" data-user-id="${user.userId}" data-user-data="${userData}">
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
            Use This Account
          </button>
        </div>
      `;
    });

    html += '</div>';
    
    // Add event listeners after content is inserted
    setTimeout(() => {
      document.querySelectorAll('.demo-user-select-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const card = this.closest('.demo-user-card');
          const userDataStr = card.getAttribute('data-user-data');
          if (userDataStr) {
            try {
              // Decode HTML entities and parse JSON
              const user = JSON.parse(userDataStr.replace(/&quot;/g, '"'));
              const emailInputId = this.getAttribute('data-email-input');
              const passwordInputId = this.getAttribute('data-password-input');
              selectDemoUser(user, emailInputId, passwordInputId);
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
          <h2 class="modal-title">Demo User Credentials</h2>
          <button class="modal-close" onclick="DemoCredentials.closeModal()" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body" id="demoCredentialsModalBody">
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
    selectDemoUser: selectDemoUser,
    loadDemoUsers: loadDemoUsers,
    getFilteredUsers: getFilteredUsers
  };

  // Preload demo users on module load
  loadDemoUsers().catch(err => {
    console.warn('Could not preload demo users:', err);
  });

})();

