/**
 * Quick Login Modal Component
 * Reusable component for displaying Quick Login modal with users from OpportunityStore
 */

(function() {
  'use strict';

  const QuickLoginModal = {
    modalId: 'quickLoginModal',
    containerId: 'quickLoginAccountsList',
    isInitialized: false,

    /**
     * Initialize the Quick Login modal
     * @param {Object} options - Configuration options
     * @param {string} options.modalId - Custom modal ID (default: 'quickLoginModal')
     * @param {string} options.containerId - Custom container ID (default: 'quickLoginAccountsList')
     * @param {Function} options.onLogin - Callback function after successful login
     * @param {string} options.redirectUrl - URL to redirect after login (default: dashboard)
     */
    init(options = {}) {
      if (this.isInitialized) {
        console.warn('[QuickLoginModal] Already initialized');
        return;
      }

      this.modalId = options.modalId || 'quickLoginModal';
      this.containerId = options.containerId || 'quickLoginAccountsList';
      this.onLogin = options.onLogin || null;
      this.redirectUrl = options.redirectUrl || null;

      // Create modal HTML if it doesn't exist
      this.createModalHTML();

      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('[QuickLoginModal] Initialized');
    },

    /**
     * Create modal HTML structure
     */
    createModalHTML() {
      // Check if modal already exists
      if (document.getElementById(this.modalId)) {
        return;
      }

      const modalHTML = `
        <div id="${this.modalId}" class="quick-login-modal-overlay" style="display: none;">
            <div class="quick-login-modal-container">
                <div class="quick-login-modal-header">
                    <h2>Quick Login - Demo Accounts</h2>
                    <button class="quick-login-modal-close" onclick="QuickLoginModal.close()">
                        <i class="ph ph-x"></i>
                    </button>
                </div>
                <div class="quick-login-modal-body" id="${this.containerId}">
                    <!-- Demo accounts will be loaded here -->
                </div>
                <div class="quick-login-modal-footer">
                    <button class="btn btn-secondary" onclick="QuickLoginModal.close()">Close</button>
                </div>
            </div>
        </div>
      `;

      // Append modal to body
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = modalHTML;
      document.body.appendChild(tempDiv.firstElementChild);

      // Inject CSS if not already present
      this.injectCSS();
    },

    /**
     * Inject CSS styles for the modal
     */
    injectCSS() {
      if (document.getElementById('quick-login-modal-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'quick-login-modal-styles';
      style.textContent = `
        /* Quick Login Modal Styles */
        .quick-login-modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            padding: var(--spacing-4);
        }
        
        .quick-login-modal-container {
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .quick-login-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: var(--spacing-4) var(--spacing-5);
            border-bottom: 1px solid var(--border-color);
            background: var(--bg-primary);
        }
        
        .quick-login-modal-header h2 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .quick-login-modal-close {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: var(--spacing-1);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: var(--radius-sm);
            transition: all 0.2s ease;
        }
        
        .quick-login-modal-close:hover {
            background: var(--bg-secondary);
            color: var(--text-primary);
        }
        
        .quick-login-modal-body {
            padding: var(--spacing-4) var(--spacing-5);
            overflow-y: auto;
            flex: 1;
        }
        
        .quick-login-modal-footer {
            padding: var(--spacing-4) var(--spacing-5);
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            background: var(--bg-secondary);
        }
        
        /* Demo Account Card Styles */
        .quick-login-account-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            padding: var(--spacing-4);
            margin-bottom: var(--spacing-4);
        }
        
        .quick-login-account-card:last-child {
            margin-bottom: 0;
        }
        
        .quick-login-account-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: var(--spacing-2);
            gap: var(--spacing-2);
        }
        
        .quick-login-account-name {
            margin: 0;
            font-size: 1.1rem;
            font-weight: 600;
            color: var(--text-primary);
            flex: 1;
        }
        
        .quick-login-account-description {
            margin: 0 0 var(--spacing-3) 0;
            font-size: 0.9rem;
            color: var(--text-secondary);
            line-height: 1.5;
        }
        
        .quick-login-account-fields {
            margin-bottom: var(--spacing-3);
        }
        
        .quick-login-field {
            margin-bottom: var(--spacing-2);
        }
        
        .quick-login-field:last-child {
            margin-bottom: 0;
        }
        
        .quick-login-field label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-1);
        }
        
        .quick-login-input {
            width: 100%;
            padding: var(--spacing-2) var(--spacing-3);
            border: 1px solid var(--border-color);
            border-radius: var(--radius-sm);
            font-size: 0.9rem;
            background: var(--bg-primary);
            color: var(--text-primary);
            font-family: 'Courier New', monospace;
        }
        
        .quick-login-input:focus {
            outline: none;
            border-color: var(--color-primary);
            box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
        }
        
        .quick-login-btn {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: var(--spacing-2);
        }
        
        @media (max-width: 768px) {
            .quick-login-modal-container {
                max-width: 100%;
                max-height: 100vh;
                border-radius: 0;
            }
            
            .quick-login-modal-header,
            .quick-login-modal-body,
            .quick-login-modal-footer {
                padding: var(--spacing-3);
            }
        }
      `;

      document.head.appendChild(style);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Close modal when clicking outside
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            this.close();
          }
        });
      }
    },

    /**
     * Open the Quick Login modal
     */
    open() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.style.display = 'flex';
        this.loadAccounts();
      } else {
        console.error('[QuickLoginModal] Modal not found. Call init() first.');
      }
    },

    /**
     * Close the Quick Login modal
     */
    close() {
      const modal = document.getElementById(this.modalId);
      if (modal) {
        modal.style.display = 'none';
      }
    },

    /**
     * Load and render demo accounts
     */
    loadAccounts() {
      const container = document.getElementById(this.containerId);
      if (!container) {
        console.error('[QuickLoginModal] Container not found');
        return;
      }

      // Check if OpportunityStore is available
      if (!window.OpportunityStore) {
        console.error('[QuickLoginModal] OpportunityStore not available. Make sure opportunityStore.js is loaded.');
        container.innerHTML = '<p class="alert alert-error">OpportunityStore not loaded. Please refresh the page.</p>';
        return;
      }

      // Get demo users from OpportunityStore
      const users = window.OpportunityStore.getAllUsers();

      // Debug logging
      console.log('[QuickLoginModal] Total users loaded:', users.length);
      if (users.length > 0) {
        console.log('[QuickLoginModal] Users:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
        
        // Verify expected count
        if (users.length !== 14) {
          console.warn('[QuickLoginModal] Expected 14 users but found', users.length, 'users');
        }
      }

      if (users.length === 0) {
        container.innerHTML = '<p class="alert alert-warning">No demo users available. Please ensure OpportunityStore is loaded and seeded.</p>';
        return;
      }

      // Group users by role for better organization
      const beneficiaries = users.filter(u => u.role === 'beneficiary');
      const providers = users.filter(u => u.role === 'provider');

      // Render accounts with grouping
      let accountsHTML = '';
      
      if (beneficiaries.length > 0) {
        accountsHTML += '<div style="margin-bottom: var(--spacing-4);"><h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-3);">Beneficiaries</h3>';
        accountsHTML += beneficiaries.map(user => this.renderUserCard(user)).join('');
        accountsHTML += '</div>';
      }
      
      if (providers.length > 0) {
        accountsHTML += '<div><h3 style="font-size: 1rem; font-weight: 600; color: var(--text-primary); margin-bottom: var(--spacing-3);">Service Providers</h3>';
        accountsHTML += providers.map(user => this.renderUserCard(user)).join('');
        accountsHTML += '</div>';
      }

      container.innerHTML = accountsHTML;
    },

    /**
     * Render a single user card
     */
    renderUserCard(user) {
      const email = this.escapeHtml(user.email);
      const password = this.getDemoPassword(user.email);
      const description = this.getUserDescription(user);
      const roleBadge = this.getRoleBadge(user.role);

      return `
        <div class="quick-login-account-card">
            <div class="quick-login-account-header">
                <h3 class="quick-login-account-name">${this.escapeHtml(user.name)}</h3>
                ${roleBadge}
            </div>
            <p class="quick-login-account-description">${this.escapeHtml(description)}</p>
            <div class="quick-login-account-fields">
                <div class="quick-login-field">
                    <label>Email:</label>
                    <input type="email" class="quick-login-input" value="${email}" readonly>
                </div>
                <div class="quick-login-field">
                    <label>Password:</label>
                    <input type="password" class="quick-login-input" value="${password}" readonly>
                </div>
            </div>
            <button class="btn btn-primary quick-login-btn" onclick="QuickLoginModal.loginAsUser('${user.id}')">
                <i class="ph ph-lock"></i> Login Now
            </button>
        </div>
      `;
    },

    /**
     * Get role badge HTML
     */
    getRoleBadge(role) {
      const badges = {
        'beneficiary': '<span class="badge badge-success">BENEFICIARY</span>',
        'provider': '<span class="badge badge-info">PROVIDER</span>',
        'admin': '<span class="badge badge-error">ADMIN</span>'
      };
      return badges[role] || '<span class="badge badge-secondary">' + role.toUpperCase() + '</span>';
    },

    /**
     * Get user description
     */
    getUserDescription(user) {
      if (user.role === 'beneficiary') {
        return 'Beneficiary - Creates opportunities, reviews proposals, accepts service offers. Manages project lifecycle and collaborates with providers.';
      } else if (user.role === 'provider') {
        const skills = user.skills && user.skills.length > 0 
          ? user.skills.slice(0, 3).join(', ') + (user.skills.length > 3 ? '...' : '')
          : 'various services';
        return `Service Provider - Offers ${skills}. Submits proposals, manages service engagements, and collaborates with beneficiaries.`;
      } else if (user.role === 'admin') {
        return 'Platform Administrator - Full system access for vetting, moderation, reports, audit trail, and user management.';
      }
      return 'User account for testing workflows.';
    },

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    },

    /**
     * Generate demo password
     */
    getDemoPassword(email) {
      return 'Demo123!';
    },

    /**
     * Login as a specific user
     */
    loginAsUser(userId) {
      // Get user from OpportunityStore
      const user = window.OpportunityStore ? window.OpportunityStore.getUserById(userId) : null;
      if (!user) {
        alert('User not found');
        return;
      }

      // Create session object compatible with existing auth system
      const session = {
        userId: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        loginTime: new Date().toISOString()
      };

      // Store in localStorage (compatible with existing auth system)
      localStorage.setItem('pmtwin_current_user', JSON.stringify(session));
      localStorage.setItem('pmtwin_session', JSON.stringify(session));

      // Update window.currentUser if it exists
      if (typeof window !== 'undefined') {
        window.currentUser = session;
      }

      // Trigger auth update event
      window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: session }));

      // Close modal
      this.close();

      // Call custom onLogin callback if provided
      if (this.onLogin && typeof this.onLogin === 'function') {
        this.onLogin(session);
        return;
      }

      // Default redirect behavior
      if (this.redirectUrl) {
        window.location.href = this.redirectUrl;
      } else {
        // Redirect to dashboard or reload page
        const dashboardUrl = window.UrlHelper ? 
          window.UrlHelper.buildUrl('pages/dashboard/index.html') : 
          '/pages/dashboard/index.html';
        window.location.href = dashboardUrl;
      }
    }
  };

  // Expose to global scope
  window.QuickLoginModal = QuickLoginModal;

})();
