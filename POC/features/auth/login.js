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

      // Remove any existing handlers
      demoButton.onclick = null;
      
      // Set up click handler
      demoButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if DemoCredentials is available
        if (typeof window.DemoCredentials !== 'undefined' && window.DemoCredentials.showModal) {
          try {
            window.DemoCredentials.showModal('user', 'loginEmail', 'loginPassword');
          } catch (error) {
            console.error('Error showing demo credentials modal:', error);
            showFallbackCredentials();
          }
        } else {
          // Fallback: show credentials in alert
          showFallbackCredentials();
        }
      });
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
        // Redirect based on user role
        if (typeof PMTwinRBAC !== 'undefined') {
          const userRole = await PMTwinRBAC.getCurrentUserRole();
          const roleDef = await PMTwinRBAC.getRoleDefinition(userRole);
          
          if (roleDef && roleDef.portals.includes('admin_portal')) {
            window.location.href = '../admin/';
          } else if (roleDef && roleDef.portals.includes('user_portal')) {
            window.location.href = '../dashboard/';
          } else {
            window.location.href = '../home/';
          }
        } else {
          // Fallback
          const user = PMTwinData.Sessions.getCurrentUser();
          if (user && user.role === 'admin') {
            window.location.href = '../admin/';
          } else {
            window.location.href = '../dashboard/';
          }
        }
        
        // Update navigation
        if (window.AppRouter) {
          window.AppRouter.updateNavigation();
        }
      } else {
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


