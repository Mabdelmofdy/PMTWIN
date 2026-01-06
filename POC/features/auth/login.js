/**
 * Login Component
 */

(function() {
  'use strict';

  function init(params) {
    const form = document.getElementById('loginForm');
    if (form) {
      form.onsubmit = handleLogin;
    }
    
    // Setup demo credentials button
    setupDemoCredentialsButton();
  }

  function setupDemoCredentialsButton() {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const demoButton = document.getElementById('demoCredentialsBtn');
      if (!demoButton) {
        console.warn('Demo credentials button not found');
        return;
      }

      console.log('✅ Demo credentials button found, setting up handler');

      // Remove any existing handlers
      demoButton.onclick = null;
      
      // Set up click handler
      demoButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('🔘 Demo credentials button clicked');
        console.log('DemoCredentials available:', typeof window.DemoCredentials !== 'undefined');
        console.log('showModal available:', typeof window.DemoCredentials !== 'undefined' && window.DemoCredentials.showModal);
        
        // Check if DemoCredentials is available
        if (typeof window.DemoCredentials !== 'undefined' && window.DemoCredentials.showModal) {
          try {
            console.log('📋 Opening demo credentials modal...');
            // Use 'public' to show all demo users on login page
            window.DemoCredentials.showModal('public', 'loginEmail', 'loginPassword');
            console.log('✅ Modal opened successfully');
          } catch (error) {
            console.error('❌ Error showing demo credentials modal:', error);
            showFallbackCredentials();
          }
        } else {
          // Fallback: show credentials in alert
          console.warn('⚠️ DemoCredentials not available, using fallback');
          showFallbackCredentials();
        }
      });
      
      console.log('✅ Demo credentials button handler set up');
    }, 100);
  }

  function showFallbackCredentials() {
    const credentials = {
      'Individual': { email: 'individual@pmtwin.com', password: 'User123' },
      'Entity/Company': { email: 'entity@pmtwin.com', password: 'Entity123' },
      'Admin': { email: 'admin@pmtwin.com', password: 'Admin123' }
    };
    
    let message = '📋 Demo User Credentials:\n\n';
    Object.keys(credentials).forEach(role => {
      const cred = credentials[role];
      message += `${role}:\n`;
      message += `  📧 Email: ${cred.email}\n`;
      message += `  🔑 Password: ${cred.password}\n\n`;
    });
    
    // Create a modal-like display
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 500px; width: 90%; position: relative;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Demo User Credentials</h2>
            <button onclick="this.closest('.card').parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
          <div style="display: grid; gap: 1.5rem;">
            ${Object.keys(credentials).map(role => {
              const cred = credentials[role];
              return `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 4px;">
                  <h3 style="margin: 0 0 0.5rem 0;">${role}</h3>
                  <p style="margin: 0.25rem 0;"><strong>Email:</strong> <code>${cred.email}</code></p>
                  <p style="margin: 0.25rem 0;"><strong>Password:</strong> <code>${cred.password}</code></p>
                  <button onclick="
                    document.getElementById('loginEmail').value = '${cred.email}';
                    document.getElementById('loginPassword').value = '${cred.password}';
                    this.closest('.card').parentElement.remove();
                  " class="btn btn-primary btn-sm" style="margin-top: 0.5rem;">Use This Account</button>
                </div>
              `;
            }).join('')}
          </div>
          <button onclick="this.closest('.card').parentElement.remove()" class="btn btn-secondary" style="margin-top: 1rem; width: 100%;">Close</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value;
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }

    try {
      let result;
      if (typeof AuthService !== 'undefined') {
        result = await AuthService.login(email, password);
      } else if (typeof PMTwinAuth !== 'undefined') {
        result = PMTwinAuth.login(email, password);
      } else {
        showError('Authentication service not available');
        return;
      }

      if (result.success) {
        console.log('✅ Login result:', result);
        
        // Wait a moment to ensure session is stored in localStorage
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Verify session was created - check multiple times if needed
        let session = PMTwinData.Sessions.getCurrentSession();
        let currentUser = PMTwinData.Sessions.getCurrentUser();
        
        // If session not found, try again after a short delay
        if (!session || !currentUser) {
          console.warn('Session not found immediately, retrying...');
          await new Promise(resolve => setTimeout(resolve, 200));
          session = PMTwinData.Sessions.getCurrentSession();
          currentUser = PMTwinData.Sessions.getCurrentUser();
        }
        
        console.log('Session check:', { 
          session: session ? 'found' : 'not found',
          currentUser: currentUser ? currentUser.email : 'not found',
          allSessions: PMTwinData.Sessions.getAll().length
        });
        
        if (!session || !currentUser) {
          console.error('❌ Session not created properly after login');
          console.log('Available sessions:', PMTwinData.Sessions.getAll());
          console.log('PMTwinAuth.isAuthenticated():', PMTwinAuth.isAuthenticated());
          showError('Session creation failed. Please try again.');
          return;
        }
        
        console.log('✅ Login successful. User:', currentUser.email, 'Role:', currentUser.role);
        
        // Determine redirect path based on user role
        // From pages/auth/login/, we need ../../ to reach pages/ level
        let redirectPath = '../../dashboard/'; // Default to dashboard
        
        // Use the user from result if available, otherwise get from session
        const user = result.user || currentUser;
        const userRole = user.role;
        
        console.log('User role for redirect:', userRole);
        
        // Simple role-based redirect (more reliable than RBAC for now)
        if (userRole === 'admin' || userRole === 'platform_admin') {
          redirectPath = '../../admin/';
          console.log('🔐 Admin user detected, redirecting to admin portal');
        } else if (userRole === 'entity' || userRole === 'individual' || userRole === 'project_lead' || userRole === 'professional' || userRole === 'supplier' || userRole === 'service_provider' || userRole === 'consultant' || userRole === 'mentor') {
          redirectPath = '../../dashboard/';
          console.log('👤 User detected, redirecting to user portal (dashboard)');
        } else {
          redirectPath = '../../home/';
          console.log('🏠 Unknown role, redirecting to home');
        }
        
        // Perform redirect
        console.log('🚀 Redirecting to:', redirectPath);
        console.log('Current location:', window.location.href);
        
        // Use replace to avoid back button issues
        window.location.replace(redirectPath);
      } else {
        console.error('❌ Login failed:', result.error);
        showError(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      showError('An error occurred during login');
    }
  }

  function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
    }
  }

  // Export
  if (!window.auth) window.auth = {};
  window.auth.login = { init };

})();


