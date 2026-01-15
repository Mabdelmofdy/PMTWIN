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
      'Admin': { email: 'admin@pmtwin.com', password: 'Admin123', role: 'Admin' },
      'Beneficiary (NEOM)': { email: 'beneficiary@pmtwin.com', password: 'Beneficiary123', role: 'Beneficiary' },
      'Beneficiary (Real Estate)': { email: 'entity2@pmtwin.com', password: 'Entity123', role: 'Project Lead' },
      'Vendor (Alpha)': { email: 'vendor.alpha@pmtwin.com', password: 'Vendor123', role: 'Vendor' },
      'Vendor (Beta)': { email: 'vendor.beta@pmtwin.com', password: 'Vendor123', role: 'Vendor' },
      'Service Provider (BIM)': { email: 'bim@pmtwin.com', password: 'Service123', role: 'Service Provider' },
      'Service Provider (QA)': { email: 'qa@pmtwin.com', password: 'Service123', role: 'Service Provider' },
      'Service Provider (Scheduler)': { email: 'scheduler@pmtwin.com', password: 'Service123', role: 'Service Provider' },
      'Consultant': { email: 'consultant@pmtwin.com', password: 'Consultant123', role: 'Consultant' },
      'SubContractor (MEP)': { email: 'mep.sub@pmtwin.com', password: 'SubContractor123', role: 'SubContractor' },
      'SubContractor (Steel)': { email: 'steel.sub@pmtwin.com', password: 'SubContractor123', role: 'SubContractor' }
    };
    
    let message = '📋 Demo User Credentials - Golden Seed Dataset:\n\n';
    Object.keys(credentials).forEach(role => {
      const cred = credentials[role];
      message += `${role}:\n`;
      message += `  📧 Email: ${cred.email}\n`;
      message += `  🔑 Password: ${cred.password}\n\n`;
    });
    
    // Create a modal-like display
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 10000; overflow-y: auto; padding: 2rem;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 600px; width: 100%; position: relative; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Quick Login - Demo Accounts</h2>
            <button onclick="this.closest('.card').parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
          </div>
          <p style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 1.5rem;">
            Click on any account to fill the login form, or copy credentials manually.
          </p>
          <div style="display: grid; gap: 1rem;">
            ${Object.keys(credentials).map(role => {
              const cred = credentials[role];
              const roleBadge = cred.role === 'Admin' ? 'badge-error' : 
                               cred.role === 'Beneficiary' || cred.role === 'Project Lead' ? 'badge-success' :
                               cred.role === 'Vendor' ? 'badge-warning' :
                               cred.role === 'Service Provider' ? 'badge-primary' :
                               cred.role === 'Consultant' ? 'badge-secondary' :
                               cred.role === 'SubContractor' ? 'badge-purple' : 'badge';
              return `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: 8px; border: 1px solid var(--border-color); cursor: pointer;" 
                     onclick="
                       const emailInput = document.getElementById('loginEmail');
                       const passwordInput = document.getElementById('loginPassword');
                       if (emailInput) emailInput.value = '${cred.email}';
                       if (passwordInput) passwordInput.value = '${cred.password}';
                       this.closest('.card').parentElement.remove();
                     "
                     onmouseover="this.style.background='var(--bg-hover)'"
                     onmouseout="this.style.background='var(--bg-secondary)'">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                    <h3 style="margin: 0; font-size: 1rem;">${role}</h3>
                    <span class="badge ${roleBadge}" style="font-size: 0.75rem;">${cred.role}</span>
                  </div>
                  <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Email:</strong> <code style="font-size: 0.875rem;">${cred.email}</code></p>
                  <p style="margin: 0.25rem 0; font-size: 0.875rem;"><strong>Password:</strong> <code style="font-size: 0.875rem;">${cred.password}</code></p>
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

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail')?.value?.trim();
    const password = document.getElementById('loginPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    // Clear previous errors
    showError('');
    
    if (!email || !password) {
      showError('Please enter email and password');
      return;
    }
    
    // Show loading state
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add('btn-loading');
      const originalText = submitButton.textContent;
      submitButton.setAttribute('data-original-text', originalText);
      submitButton.textContent = 'Logging in...';
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
        
        // Verify session was created - use result.session if available, otherwise check
        let session = result.session || PMTwinData.Sessions.getCurrentSession();
        let currentUser = result.user || PMTwinData.Sessions.getCurrentUser();
        
        // If session not found, try multiple times with increasing delays
        if (!session || !currentUser) {
          console.warn('Session not found immediately, retrying...');
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            session = PMTwinData.Sessions.getCurrentSession();
            currentUser = PMTwinData.Sessions.getCurrentUser();
            if (session && currentUser) break;
          }
        }
        
        // Final verification - if still no session, try to get user directly
        if (!session && result.user) {
          // Session might not be set yet, but user exists - create session manually
          try {
            session = PMTwinData.Sessions.create(
              result.user.id,
              result.user.role || result.user.userType,
              result.user.userType,
              result.user.onboardingStage
            );
            currentUser = result.user;
            console.log('✅ Created session manually after login');
          } catch (err) {
            console.error('Failed to create session manually:', err);
          }
        }
        
        console.log('Session check:', { 
          session: session ? 'found' : 'not found',
          currentUser: currentUser ? currentUser.email : 'not found',
          allSessions: PMTwinData.Sessions.getAll().length
        });
        
        if (!session || !currentUser) {
          console.error('❌ Session not created properly after login');
          console.log('Available sessions:', PMTwinData.Sessions.getAll());
          console.log('PMTwinAuth.isAuthenticated():', typeof PMTwinAuth !== 'undefined' ? PMTwinAuth.isAuthenticated() : 'N/A');
          showError('Session creation failed. Please refresh the page and try again.');
          return;
        }
        
        console.log('✅ Login successful. User:', currentUser.email, 'Role:', currentUser.role);
        
        // Check for stored redirect (from AuthCheck)
        const storedRedirect = typeof AuthCheck !== 'undefined' ? AuthCheck.getLoginRedirect() : null;
        if (storedRedirect) {
          console.log('🚀 Using stored redirect:', storedRedirect);
          window.location.replace(storedRedirect);
          return;
        }
        
        // Get base path for proper navigation
        const basePath = getBasePath();
        
        // Use the user from result if available, otherwise get from session
        const user = result.user || currentUser;
        const userEmail = user?.email;
        
        // Get role from multiple sources (user object, session, result)
        const role = user?.role || session?.role || result.user?.role || currentUser?.role;
        const userType = user?.userType || session?.userType || currentUser?.userType;
        
        // Check email as primary indicator for admin (most reliable)
        const isAdminEmail = userEmail === 'admin@pmtwin.com';
        
        console.log('🔍 Login redirect check:', {
          userEmail: userEmail,
          role: role,
          roleType: typeof role,
          userType: userType,
          sessionRole: session?.role,
          resultUserRole: result.user?.role,
          currentUserRole: currentUser?.role,
          isAdminEmail: isAdminEmail,
          userObject: user
        });
        
        // Determine redirect path based on user role
        // Use NAV_ROUTES if available, otherwise fallback to basePath
        let redirectPath = typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['dashboard']
          ? window.NavRoutes.getRoute('dashboard', { useLiveServer: true })
          : `${basePath}dashboard/`; // Default to dashboard
        
        // Simple role-based redirect (more reliable than RBAC for now)
        // Check for admin roles (case-insensitive check)
        const adminRoles = ['admin', 'platform_admin', 'auditor'];
        const roleLower = role?.toLowerCase()?.trim();
        let isAdmin = (roleLower && adminRoles.some(r => r.toLowerCase() === roleLower)) || isAdminEmail;
        
        // If email is admin@pmtwin.com, force admin detection regardless of role
        if (isAdminEmail && !isAdmin) {
          console.warn('⚠️ Admin email detected but role not admin, forcing admin redirect');
          isAdmin = true;
        }
        
        console.log('🔍 Admin check:', {
          roleLower: roleLower,
          isAdmin: isAdmin,
          adminRoles: adminRoles,
          matches: adminRoles.map(r => ({ role: r, matches: r.toLowerCase() === roleLower }))
        });
        
        if (isAdmin) {
          // Platform admin ALWAYS redirects to full Live Server URL
          redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
          console.log('🔐 Admin user detected, redirecting to admin portal:', redirectPath);
        } else if (isAdminEmail) {
          // Email-based admin detection (fallback if role detection fails)
          console.warn('⚠️ Admin detected by email but not by role, forcing admin redirect');
          // Platform admin ALWAYS redirects to full Live Server URL
          redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
          console.log('🔐 Admin email detected, forcing admin redirect:', redirectPath);
          isAdmin = true; // Update flag
        } else if (role === 'beneficiary' || role === 'entity' || role === 'individual' || role === 'project_lead' || 
                   role === 'professional' || role === 'supplier' || role === 'service_provider' || 
                   role === 'skill_service_provider' || role === 'consultant' || role === 'mentor' ||
                   role === 'vendor' || role === 'sub_contractor' || userType === 'beneficiary' ||
                   userType === 'vendor_corporate' || userType === 'vendor_individual' ||
                   userType === 'service_provider' || userType === 'consultant' || userType === 'sub_contractor') {
          redirectPath = typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['dashboard']
            ? window.NavRoutes.getRoute('dashboard', { useLiveServer: true })
            : `${basePath}dashboard/`;
          console.log('👤 User detected, redirecting to user portal (dashboard)');
        } else {
          redirectPath = typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['home']
            ? window.NavRoutes.getRoute('home', { useLiveServer: true })
            : `${basePath}home/`;
          console.log('🏠 Unknown role "' + role + '", redirecting to home');
        }
        
        // Perform redirect
        console.log('🚀 Redirecting to:', redirectPath);
        console.log('Current location:', window.location.href);
        console.log('User role:', role, 'Is Admin:', isAdmin);
        console.log('Redirect path type:', typeof redirectPath, 'Value:', redirectPath);
        
        // Ensure redirect path is valid
        if (!redirectPath || redirectPath === 'undefined' || redirectPath.includes('undefined')) {
          console.error('❌ Invalid redirect path:', redirectPath);
          const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
          // Use NAV_ROUTES if available
          if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES) {
            redirectPath = isAdmin 
              ? window.NavRoutes.getRoute('admin', { useLiveServer: true })
              : window.NavRoutes.getRoute('dashboard', { useLiveServer: true });
          } else {
            const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
            const isLiveServer = currentPort === '5503' || window.location.host.includes(':5503');
            redirectPath = isAdmin 
              ? (isLiveServer ? 'http://127.0.0.1:5503/POC/pages/admin/index.html' : `${basePath}admin/`)
              : `${basePath}dashboard/`;
          }
          console.log('🔄 Using fallback redirect path:', redirectPath);
        }
        
        // Final safety check: If email is admin@pmtwin.com, ALWAYS redirect to admin
        if (isAdminEmail && !redirectPath.includes('admin')) {
          console.warn('⚠️ Admin email detected but redirect path incorrect, forcing admin redirect...');
          // Platform admin ALWAYS redirects to full Live Server URL
          redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
          console.log('🔄 Forced admin redirect based on email:', redirectPath);
          isAdmin = true; // Update flag
        }
        
        // Ensure admin redirects always use full Live Server URL
        if (isAdmin && !redirectPath.includes('http://127.0.0.1:5503/POC/pages/admin/index.html')) {
          redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
          console.log('🔄 Ensuring admin redirect uses full Live Server URL:', redirectPath);
        }
        
        // Use replace to avoid back button issues
        // Add a delay to ensure session is saved and persisted
        setTimeout(() => {
          // Verify session was saved before redirecting
          const savedSession = PMTwinData?.Sessions?.getCurrentSession();
          const savedUser = PMTwinData?.Sessions?.getCurrentUser();
          
          console.log('🔍 Pre-redirect session check:', {
            hasSession: !!savedSession,
            hasUser: !!savedUser,
            userRole: savedUser?.role,
            userEmail: savedUser?.email,
            sessionRole: savedSession?.role,
            isAdmin: isAdmin,
            isAdminEmail: isAdminEmail
          });
          
          // Verify admin role is saved correctly, but allow redirect if email matches admin
          if (isAdmin) {
            const savedRoleLower = savedUser?.role?.toLowerCase()?.trim();
            const savedEmail = savedUser?.email;
            const isSavedAdmin = savedRoleLower && ['admin', 'platform_admin', 'auditor'].includes(savedRoleLower);
            const isSavedAdminEmail = savedEmail === 'admin@pmtwin.com';
            
            // If email matches admin, always allow redirect (role might not be saved yet)
            if (isSavedAdminEmail) {
              console.log('✅ Admin email confirmed in session, proceeding with redirect');
            } else if (!savedUser || !isSavedAdmin) {
              console.warn('⚠️ Session not properly saved for admin user. Saved role:', savedUser?.role, 'Saved email:', savedEmail);
              
              // If we detected admin from email or role earlier, still redirect
              if (isAdminEmail || (roleLower && ['admin', 'platform_admin', 'auditor'].includes(roleLower))) {
                console.warn('⚠️ Admin detected earlier but session incomplete, proceeding with redirect anyway');
              } else {
                console.warn('⚠️ Retrying redirect after additional delay...');
                // Retry after another delay
                setTimeout(() => {
                  try {
                    console.log('🔄 Executing redirect to:', redirectPath);
                    window.location.replace(redirectPath);
                  } catch (e) {
                    console.error('❌ Redirect error, trying href instead:', e);
                    window.location.href = redirectPath;
                  }
                }, 300);
                return;
              }
            }
          }
          
          try {
            console.log('🔄 Executing redirect to:', redirectPath);
            window.location.replace(redirectPath);
          } catch (e) {
            console.error('❌ Redirect error, trying href instead:', e);
            try {
              window.location.href = redirectPath;
            } catch (e2) {
              console.error('❌ Both redirect methods failed:', e2);
              alert('Redirect failed. Please navigate manually to: ' + redirectPath);
            }
          }
        }, 300);
      } else {
        console.error('❌ Login failed:', result.error);
        showError(result.error || 'Login failed. Please check your credentials and try again.');
        // Show notification
        if (typeof window.Notifications !== 'undefined') {
          window.Notifications.error('Login Failed', result.error || 'Please check your credentials and try again.');
        }
        // Restore button
        if (submitButton) {
          submitButton.disabled = false;
          submitButton.classList.remove('btn-loading');
          submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Login';
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMsg = 'An error occurred during login. Please try again or refresh the page.';
      showError(errorMsg);
      // Show notification
      if (typeof window.Notifications !== 'undefined') {
        window.Notifications.error('Login Error', errorMsg);
      }
      // Restore button
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove('btn-loading');
        submitButton.textContent = submitButton.getAttribute('data-original-text') || 'Login';
      }
    }
  }

  function showError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
      if (message) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.classList.add('alert-error');
        // Scroll to error
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        errorDiv.textContent = '';
        errorDiv.style.display = 'none';
      }
    }
  }

  // Export
  if (!window.auth) window.auth = {};
  window.auth.login = { init };

})();


