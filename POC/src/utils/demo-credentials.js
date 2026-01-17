/**
 * PMTwin Demo Credentials Module
 * Provides demo user credentials modal for quick login demonstrations
 */

(function() {
  'use strict';

  let demoUsers = [];
  let isLoading = false;

  // Portal type to role mapping
  // Updated to include all RBAC roles and mapped OpportunityStore roles
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
  // Map OpportunityStore Role to RBAC Role
  // ============================================
  function mapOpportunityStoreRoleToRBAC(user) {
    // Map OpportunityStore simplified roles to RBAC roles first
    if (user.role === 'beneficiary') {
      return 'project_lead'; // Beneficiaries are project leads in RBAC system
    }
    
    if (user.role === 'provider') {
      // Map based on userType
      switch(user.userType) {
        case 'vendor_corporate':
          return 'vendor';
        case 'service_provider':
          return 'skill_service_provider';
        case 'consultant':
          return 'consultant';
        case 'supplier':
          return 'supplier';
        default:
          return 'service_provider'; // Default fallback
      }
    }
    
    // If user already has a valid RBAC role (and not beneficiary/provider), use it
    const validRBACRoles = ['platform_admin', 'admin', 'auditor', 'project_lead', 'entity', 
                            'vendor', 'professional', 'supplier', 'service_provider', 'skill_service_provider', 
                            'consultant', 'sub_contractor', 'mentor', 'individual'];
    
    if (validRBACRoles.includes(user.role)) {
      return user.role;
    }
    
    // Fallback to original role
    return user.role;
  }

  // ============================================
  // Load Users from OpportunityStore
  // ============================================
  function loadOpportunityStoreUsers() {
    try {
      if (!window.OpportunityStore) {
        console.warn('[DemoCredentials] OpportunityStore not available');
        return [];
      }

      const oppUsers = window.OpportunityStore.getAllUsers();
      console.log(`✅ Loaded ${oppUsers.length} users from OpportunityStore`);

      // Convert OpportunityStore format to DemoCredentials format
      const convertedUsers = oppUsers.map(user => {
        const rbacRole = mapOpportunityStoreRoleToRBAC(user);
        
        // Generate description based on mapped RBAC role and user info
        let description = '';
        const bio = user.bio || '';
        
        // Generate role-specific description
        switch(rbacRole) {
          case 'project_lead':
            description = `Project Lead - Creates opportunities, reviews proposals, accepts service offers. Manages project lifecycle and collaborates with providers. ${bio}`;
            break;
          case 'vendor':
            description = `Vendor - Executes project contracts, manages sub-contractors. Provides full project services. ${bio}`;
            break;
          case 'skill_service_provider':
            const skills = user.skills && user.skills.length > 0 
              ? user.skills.slice(0, 3).join(', ') + (user.skills.length > 3 ? '...' : '')
              : 'various services';
            description = `Service Provider - Offers ${skills}. Submits proposals, manages service engagements. ${bio}`;
            break;
          case 'consultant':
            description = `Consultant - Provides advisory services, feasibility studies, expert reviews. ${bio}`;
            break;
          case 'supplier':
            description = `Supplier - Provides materials and resources. Participates in bulk purchasing, manages inventory. ${bio}`;
            break;
          default:
            description = bio || user.description || 'User account for testing workflows.';
        }

        return {
          userId: user.id,
          email: user.email,
          password: 'Demo123!', // Standard demo password
          role: rbacRole,
          name: user.name,
          description: description.trim()
        };
      });

      return convertedUsers;
    } catch (error) {
      console.error('[DemoCredentials] Error loading OpportunityStore users:', error);
      return [];
    }
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
      // Load users from demo-users.json
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/demo-users.json');
      let jsonUsers = [];
      
      if (response.ok) {
        const data = await response.json();
        jsonUsers = data.users || [];
        console.log(`✅ Loaded ${jsonUsers.length} users from demo-users.json`);
      } else {
        console.warn(`⚠️ Failed to load demo-users.json: ${response.status}`);
      }

      // Load users from OpportunityStore
      const oppUsers = loadOpportunityStoreUsers();
      
      // Merge users, removing duplicates by email (prefer demo-users.json entries)
      const userMap = new Map();
      
      // First, add OpportunityStore users
      oppUsers.forEach(user => {
        userMap.set(user.email.toLowerCase(), user);
      });
      
      // Then, add demo-users.json users (these will overwrite duplicates)
      jsonUsers.forEach(user => {
        userMap.set(user.email.toLowerCase(), user);
      });
      
      // Convert map back to array
      demoUsers = Array.from(userMap.values());
      
      // Log user breakdown by role
      const roleCounts = {};
      demoUsers.forEach(user => {
        roleCounts[user.role] = (roleCounts[user.role] || 0) + 1;
      });
      
      console.log(`✅ Total demo users loaded: ${demoUsers.length} (${jsonUsers.length} from JSON, ${oppUsers.length} from OpportunityStore)`);
      console.log(`✅ Users by role:`, roleCounts);
      console.log(`✅ User list:`, demoUsers.map(u => ({ name: u.name, email: u.email, role: u.role })));
      
      return demoUsers;
    } catch (error) {
      console.error('Error loading demo users:', error);
      // Try to load from OpportunityStore as fallback
      const oppUsers = loadOpportunityStoreUsers();
      demoUsers = oppUsers;
      return demoUsers;
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
    
    // CRITICAL: Early check for Platform Administrator - if email is admin@pmtwin.com, 
    // we know it's admin and will redirect to admin portal
    const isPlatformAdmin = user.email === 'admin@pmtwin.com';
    if (isPlatformAdmin) {
      console.log('✅ Platform Administrator detected early - will redirect to admin portal');
    }
    
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
      // CRITICAL: Early check for Platform Administrator
      const isPlatformAdmin = user.email === 'admin@pmtwin.com';
      console.log('🔍🔍🔍 PRE-LOGIN CHECK 🔍🔍🔍');
      console.log('🔍 Pre-login check - Platform Administrator:', isPlatformAdmin, 'Email:', user.email);
      console.log('🔍 User object:', user);
      
      // Check if user is from OpportunityStore (users not in demo-users.json)
      // Check by userId first, then by email as fallback
      let isOpportunityStoreUser = false;
      let oppUser = null;
      
      if (window.OpportunityStore && window.OpportunityStore.getUserById) {
        oppUser = window.OpportunityStore.getUserById(user.userId);
        if (oppUser) {
          isOpportunityStoreUser = true;
        } else {
          // Try finding by email as fallback
          const allOppUsers = window.OpportunityStore.getAllUsers();
          oppUser = allOppUsers.find(u => u.email.toLowerCase() === user.email.toLowerCase());
          if (oppUser) {
            isOpportunityStoreUser = true;
            console.log('🔍 Found OpportunityStore user by email:', user.email);
          }
        }
      }
      
      console.log('🔍 Is OpportunityStore user:', isOpportunityStoreUser, 'UserId:', user.userId, 'Email:', user.email);
      
      let result;
      
      // If user is from OpportunityStore, create session directly
      if (isOpportunityStoreUser && oppUser) {
        console.log('🔐 Creating session directly for OpportunityStore user:', user.email);
        
        // Ensure userId is a string (not an object) - do this once at the start
        const userIdString = String(oppUser.id);
        const userRole = user.role || 'individual'; // Ensure role is set
        
        // Step 1: Register user in PMTwinData.Users if not already registered
        let registeredUser = null;
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Users) {
          try {
            // Check if user already exists
            registeredUser = PMTwinData.Users.getByEmail(oppUser.email);
            
            if (!registeredUser) {
              // Create user in PMTwinData.Users
              console.log('📝 Registering OpportunityStore user in PMTwinData.Users:', oppUser.email, 'with ID:', userIdString);
              const userData = {
                id: userIdString,
                email: oppUser.email,
                password: btoa(user.password || 'Demo123!'), // Store password hash
                role: user.role, // Use mapped RBAC role
                userType: oppUser.userType || user.role,
                name: oppUser.name,
                phone: oppUser.phone || null,
                mobile: oppUser.phone || null,
                onboardingStage: 'approved', // Demo users are pre-approved
                emailVerified: true,
                mobileVerified: oppUser.phone ? true : false,
                profile: {
                  name: oppUser.name,
                  status: 'approved',
                  bio: oppUser.bio || '',
                  companyInfo: oppUser.companyInfo || null,
                  createdAt: new Date().toISOString(),
                  approvedAt: new Date().toISOString(),
                  approvedBy: 'system'
                },
                location: oppUser.location || null,
                skills: oppUser.skills || [],
                paymentPreferences: oppUser.paymentPreferences || null
              };
              
              registeredUser = PMTwinData.Users.create(userData);
              console.log('✅ User registered in PMTwinData.Users:', registeredUser.id, 'Type:', typeof registeredUser.id);
            } else {
              console.log('✅ User already exists in PMTwinData.Users:', registeredUser.id);
              // Update role if it has changed
              if (registeredUser.role !== userRole) {
                console.log(`🔄 Updating user role from ${registeredUser.role} to ${userRole}`);
                PMTwinData.Users.update(registeredUser.id, { role: userRole });
                registeredUser.role = userRole;
              }
            }
          } catch (e) {
            console.error('❌ Error registering user in PMTwinData.Users:', e);
          }
        }
        
        // Step 2: Assign RBAC role
        if (typeof PMTwinRBAC !== 'undefined' && PMTwinRBAC.assignRoleToUser) {
          try {
            console.log('🔐 Assigning RBAC role:', userRole, 'to user:', userIdString);
            await PMTwinRBAC.assignRoleToUser(userIdString, userRole, 'system', oppUser.email);
            console.log('✅ RBAC role assigned successfully');
          } catch (e) {
            console.error('❌ Error assigning RBAC role:', e);
          }
        }
        
        // Step 3: Create session with string userId
        const userType = oppUser.userType || user.role || 'individual';
        
        console.log('🔐 Creating session with userId:', userIdString, 'role:', userRole, 'userType:', userType);
        
        // Step 4: Create session using PMTwinData.Sessions.create() with correct signature
        let session = null;
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
          try {
            // Sessions.create(userId, role, userType, onboardingStage)
            session = PMTwinData.Sessions.create(
              userIdString,
              userRole,
              userType,
              'approved' // Demo users are pre-approved
            );
            console.log('✅ Session created in PMTwinData:', session);
          } catch (e) {
            console.error('❌ Error creating session in PMTwinData:', e);
            // Fallback: create minimal session object
            session = {
              userId: userIdString,
              email: oppUser.email,
              userEmail: oppUser.email,
              role: userRole,
              name: oppUser.name,
              loginTime: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
            };
          }
        } else {
          // Fallback: create minimal session object
          session = {
            userId: userIdString,
            email: oppUser.email,
            userEmail: oppUser.email,
            role: userRole,
            name: oppUser.name,
            loginTime: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
          };
        }
        
        // Store in localStorage (compatible with existing auth system)
        localStorage.setItem('pmtwin_current_user', JSON.stringify({
          userId: userIdString,
          email: oppUser.email,
          userEmail: oppUser.email,
          role: userRole,
          name: oppUser.name
        }));
        localStorage.setItem('pmtwin_session', JSON.stringify(session));
        
        // Update window.currentUser if it exists
        if (typeof window !== 'undefined') {
          window.currentUser = {
            id: userIdString,
            userId: userIdString,
            email: oppUser.email,
            role: userRole,
            name: oppUser.name
          };
        }
        
        // Create result object matching auth service format
        // Use registeredUser if available, otherwise create minimal user object
        const resultUser = registeredUser || {
          id: userIdString,
          userId: userIdString,
          email: oppUser.email,
          role: userRole,
          name: oppUser.name
        };
        
        result = {
          success: true,
          user: resultUser,
          session: session
        };
        
        console.log('✅ Session created for OpportunityStore user:', {
          userId: userIdString,
          email: oppUser.email,
          role: userRole,
          sessionCreated: !!session
        });
      } else {
        // Try AuthService first, then fallback to PMTwinAuth for demo-users.json users
        if (typeof AuthService !== 'undefined') {
          console.log('🔐 Using AuthService.login for:', user.email);
          result = await AuthService.login(user.email, user.password);
        } else if (typeof PMTwinAuth !== 'undefined') {
          console.log('🔐 Using PMTwinAuth.login for:', user.email);
          result = await PMTwinAuth.login(user.email, user.password);
        } else {
          console.error('❌ No auth service available!');
          // Fallback: try to find and submit form
          return fallbackToFormFill(user);
        }
      }
      
      console.log('🔍 Login result:', {
        success: result?.success,
        error: result?.error,
        user: result?.user,
        userEmail: result?.user?.email,
        userRole: result?.user?.role
      });
      
      if (!result || !result.success) {
        console.error('❌ Login failed:', result?.error || 'Unknown error');
        console.error('❌ Login result object:', result);
        if (card) {
          card.classList.remove('logging-in');
          const button = card.querySelector('.demo-user-select-btn');
          if (button) {
            button.disabled = false;
            button.innerHTML = '<span class="login-icon"><i class="ph ph-lock"></i></span> Login Now';
          }
          // Re-enable all cards
          document.querySelectorAll('.demo-user-card').forEach(c => {
            c.style.pointerEvents = 'auto';
          });
        }
        alert('Login failed: ' + (result?.error || 'Unknown error') + '\n\nPlease check console for details.');
        return false;
      }
      
      // Trigger userLoggedIn event for OpportunityStore users
      if (isOpportunityStoreUser && result.success) {
        window.dispatchEvent(new CustomEvent('userLoggedIn', { detail: result.session }));
      }

      // Login succeeded - proceed with redirect logic
      if (result.success) {
        console.log('✅ Login successful:', result);
        console.log('🔍 Login result details:', {
          success: result.success,
          user: result.user,
          userEmail: result.user?.email,
          userRole: result.user?.role,
          session: result.session
        });

    // Close modal
    closeDemoCredentialsModal();

        // CRITICAL: Check if this is Platform Administrator BEFORE any other logic
        const isPlatformAdminEmail = user.email === 'admin@pmtwin.com' || result.user?.email === 'admin@pmtwin.com';
        console.log('🔍 Platform Administrator check:', {
          userEmail: user.email,
          resultUserEmail: result.user?.email,
          isPlatformAdminEmail: isPlatformAdminEmail,
          loginSuccess: result.success
        });
        
        if (isPlatformAdminEmail) {
          console.log('🚀🚀🚀 Platform Administrator detected IMMEDIATELY after login success - FORCING redirect 🚀🚀🚀');
          // Platform admin - use NAV_ROUTES
          const adminRedirectPath = getNormalizedRoute('admin');
          
          console.log('🔄 IMMEDIATE redirect to admin portal:', adminRedirectPath);
          console.log('🔄 Current location:', window.location.href);
          console.log('🔄 Window location object:', {
            href: window.location.href,
            pathname: window.location.pathname,
            host: window.location.host,
            port: window.location.port
          });
          
          // Close modal first
          closeDemoCredentialsModal();
          
          // CRITICAL: Use multiple redirect attempts to ensure it works
          console.log('🔄 Starting redirect sequence...');
          
          // First attempt - immediate
          setTimeout(() => {
            console.log('🔄 Attempt 1: Redirecting to:', adminRedirectPath);
            try {
              window.location.replace(adminRedirectPath);
            } catch (e) {
              console.error('❌ Attempt 1 failed:', e);
              try {
                window.location.href = adminRedirectPath;
              } catch (e2) {
                console.error('❌ Attempt 1 href also failed:', e2);
              }
            }
          }, 200);
          
          // Backup attempt
          setTimeout(() => {
            if (window.location.href !== adminRedirectPath && !window.location.href.includes('admin')) {
              console.log('🔄 Attempt 2: Still not redirected, forcing again:', adminRedirectPath);
              window.location.href = adminRedirectPath;
            }
          }, 500);
          
          // Final backup attempt
          setTimeout(() => {
            if (window.location.href !== adminRedirectPath && !window.location.href.includes('admin')) {
              console.log('🔄 Attempt 3: Final redirect attempt:', adminRedirectPath);
              window.location.replace(adminRedirectPath);
            }
          }, 1000);
          
          return true;
        }

        // Wait a moment for session to be stored, then verify it
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Get the actual user from login result or session
        let loggedInUser = result.user || PMTwinData?.Sessions?.getCurrentUser();
        let session = PMTwinData?.Sessions?.getCurrentSession();
        
        // If session/user not found, wait a bit more and retry
        if (!loggedInUser || !session) {
          console.warn('⚠️ Session not found immediately, retrying...');
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
            loggedInUser = result.user || PMTwinData?.Sessions?.getCurrentUser();
            session = PMTwinData?.Sessions?.getCurrentSession();
            if (loggedInUser && session) break;
          }
        }
        
        // Verify role is set correctly in session
        if (loggedInUser && loggedInUser.role && session && session.role !== loggedInUser.role) {
          console.warn('⚠️ Role mismatch between user and session, updating session...');
          console.log('User role:', loggedInUser.role, 'Session role:', session.role);
          // Try to update session role
          if (PMTwinData?.Sessions?.update) {
            PMTwinData.Sessions.update(session.id, { role: loggedInUser.role });
          }
        }
        
        // Get role from multiple sources (prioritize logged-in user, then session, then demo user)
        // IMPORTANT: Use result.user first as it's the most reliable source
        const role = result.user?.role || loggedInUser?.role || session?.role || user.role;
        const roleLower = role?.toLowerCase()?.trim();
        
        // Check email as primary indicator for admin (most reliable)
        const userEmail = result.user?.email || loggedInUser?.email || user.email;
        const isAdminEmail = userEmail === 'admin@pmtwin.com';
        
        console.log('🔍 Email check:', { userEmail, isAdminEmail, resultUserEmail: result.user?.email, loggedInUserEmail: loggedInUser?.email, demoUserEmail: user.email });
        
        console.log('🔍 Demo credentials role detection:', {
          demoUserRole: user.role,
          resultUserRole: result.user?.role,
          loggedInUserRole: loggedInUser?.role,
          sessionRole: session?.role,
          finalRole: role,
          roleLower: roleLower,
          userEmail: userEmail,
          isAdminEmail: isAdminEmail,
          resultUser: result.user,
          loggedInUser: loggedInUser
        });
        
        // Determine redirect based on user role - ALWAYS use full absolute URLs
        // Helper to get normalized route using NAV_ROUTES
        function getNormalizedRoute(routeKey) {
          if (typeof window.NavRoutes !== 'undefined') {
            // Use NavRoutes.getRoute which handles Live Server URLs automatically
            const route = window.NavRoutes.getRoute(routeKey, { useLiveServer: true });
            if (route && route !== routeKey) {
              return route; // Valid route returned
            }
            // If routeKey not found, try toHtmlUrl
            if (window.NavRoutes.toHtmlUrl) {
              return window.NavRoutes.toHtmlUrl(`/POC/pages/${routeKey}/index.html`);
            }
          }
          // Final fallback: construct from NAV_ROUTES if available
          if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES) {
            const baseRoute = window.NavRoutes.NAV_ROUTES[routeKey] || `/POC/pages/${routeKey}/index.html`;
            // Convert to Live Server URL if needed
            if (window.location.port === '5503' || window.location.hostname === '127.0.0.1') {
              return `http://127.0.0.1:5503${baseRoute}`;
            }
            return baseRoute;
          }
          // Absolute last fallback
          return `/POC/pages/${routeKey}/index.html`;
        }
        
        // Check for admin roles (case-insensitive)
        const adminRoles = ['admin', 'platform_admin', 'auditor'];
        // CRITICAL: Check email FIRST - if admin@pmtwin.com, ALWAYS treat as admin
        const isAdminByEmail = isAdminEmail || userEmail === 'admin@pmtwin.com' || user.email === 'admin@pmtwin.com';
        let isAdmin = (roleLower && adminRoles.some(r => r.toLowerCase() === roleLower)) || isAdminByEmail;
        
        // If email is admin@pmtwin.com, force admin detection regardless of role
        if (isAdminByEmail && !isAdmin) {
          console.warn('⚠️ Admin email detected but role not admin, forcing admin redirect');
          isAdmin = true;
        }
        
        console.log('🔍 Demo credentials admin check:', {
          role: role,
          roleLower: roleLower,
          isAdmin: isAdmin,
          adminRoles: adminRoles,
          matches: adminRoles.map(r => ({ role: r, matches: r.toLowerCase() === roleLower }))
        });
        
        // Determine redirect path - ALWAYS use full absolute URLs
        let redirectPath;
        
        if (isAdmin) {
          // Platform admin - use NAV_ROUTES
          redirectPath = getNormalizedRoute('admin');
          console.log('🔐 Admin user detected in demo credentials, redirecting to admin portal:', redirectPath);
        } else if (roleLower === 'beneficiary' || roleLower === 'entity' || roleLower === 'project_lead' ||
                   roleLower === 'vendor' || roleLower === 'service_provider' || roleLower === 'skill_service_provider' ||
                   roleLower === 'consultant' || roleLower === 'sub_contractor' || roleLower === 'professional' ||
                   roleLower === 'supplier' || roleLower === 'individual') {
          // Regular users redirect to dashboard - use NAV_ROUTES
          redirectPath = getNormalizedRoute('dashboard');
          console.log('👤 User detected in demo credentials, redirecting to dashboard:', redirectPath);
        } else if (isAdminEmail) {
          // Email-based admin detection (fallback if role detection fails)
          console.warn('⚠️ Admin detected by email but not by role, forcing admin redirect');
          redirectPath = getNormalizedRoute('admin');
          console.log('🔐 Admin email detected, forcing admin redirect:', redirectPath);
          isAdmin = true; // Update flag
        } else {
          console.warn('⚠️ Unknown role in demo credentials. Role:', role, 'RoleLower:', roleLower, 'DemoUserRole:', user.role, 'Email:', userEmail);
          // Default to dashboard for unknown roles - use NAV_ROUTES
          redirectPath = getNormalizedRoute('dashboard');
        }
        
        console.log(`🔄 Redirecting to: ${redirectPath}`);
        console.log('User role:', role, 'Is Admin:', isAdmin);
        console.log('Redirect path type:', typeof redirectPath, 'Value:', redirectPath);
        
        // Ensure redirect path is valid and normalized
        if (!redirectPath || redirectPath === 'undefined' || redirectPath.includes('undefined')) {
          console.error('❌ Invalid redirect path:', redirectPath);
          redirectPath = isAdmin 
            ? getNormalizedRoute('admin')
            : getNormalizedRoute('dashboard');
          console.log('🔄 Using fallback redirect path:', redirectPath);
        }
        
        // Normalize redirect path to ensure it ends with .html
        if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.toHtmlUrl) {
          redirectPath = window.NavRoutes.toHtmlUrl(redirectPath);
        }
        
        // Double-check: If admin was detected but redirect path doesn't contain 'admin', fix it
        if (isAdmin && !redirectPath.includes('admin')) {
          console.warn('⚠️ Admin detected but redirect path incorrect, fixing...');
          redirectPath = getNormalizedRoute('admin');
          console.log('🔄 Fixed admin redirect path:', redirectPath);
        }
        
        // Final safety check: If result.user has admin role but we didn't detect it, force admin redirect
        const resultUserRole = result.user?.role?.toLowerCase()?.trim();
        const resultIsAdmin = resultUserRole && ['admin', 'platform_admin', 'auditor'].includes(resultUserRole);
        
        // Also check if email matches admin email as additional verification
        const resultUserEmail = result.user?.email || loggedInUser?.email || user.email;
        const resultIsAdminEmail = resultUserEmail === 'admin@pmtwin.com';
        
        // CRITICAL: If email is admin@pmtwin.com, ALWAYS redirect to admin (most reliable check)
        if (resultIsAdminEmail || isAdminEmail || userEmail === 'admin@pmtwin.com') {
          if (!redirectPath.includes('admin')) {
            console.warn('⚠️ Admin email detected but redirect path incorrect, forcing admin redirect...');
            redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
            console.log('🔄 Forced admin redirect based on email:', redirectPath);
            isAdmin = true;
          } else {
            console.log('✅ Admin email confirmed, redirect path is correct:', redirectPath);
          }
        } else if ((resultIsAdmin || isAdmin) && !redirectPath.includes('admin')) {
          console.warn('⚠️ Admin detected (role) but redirect path incorrect, forcing admin redirect...');
          redirectPath = 'http://127.0.0.1:5503/POC/pages/admin/index.html';
          console.log('🔄 Forced admin redirect path:', redirectPath);
          isAdmin = true;
        }
        
        // CRITICAL: If admin email detected, ALWAYS redirect to admin portal immediately
        const adminEmailCheck = isAdminEmail || resultIsAdminEmail || userEmail === 'admin@pmtwin.com' || user.email === 'admin@pmtwin.com' || loggedInUser?.email === 'admin@pmtwin.com';
        
        if (adminEmailCheck) {
          // Platform admin - use NAV_ROUTES
          const adminRedirectPath = getNormalizedRoute('admin');
          
          console.log('🚀 Platform Administrator detected - FORCING admin redirect');
          console.log('🔍 Admin email check (ALL SOURCES):', { 
            isAdminEmail, 
            resultIsAdminEmail, 
            userEmail, 
            demoUserEmail: user.email,
            loggedInUserEmail: loggedInUser?.email,
            adminEmailCheck: adminEmailCheck,
            redirectPath: adminRedirectPath,
            currentLocation: window.location.href
          });
          
          // Close modal if not already closed
          closeDemoCredentialsModal();
          
          // Longer delay to ensure session is fully saved, then redirect
          setTimeout(() => {
            try {
              console.log('🔄 FINAL redirect to admin portal:', adminRedirectPath);
              console.log('🔄 Current location before redirect:', window.location.href);
              // Use replace to avoid back button issues
              window.location.replace(adminRedirectPath);
            } catch (e) {
              console.error('❌ Redirect error, trying href instead:', e);
              window.location.href = adminRedirectPath;
            }
          }, 400);
          return true;
        }
        
        // For other users, add a delay to ensure session is saved, then redirect
        setTimeout(() => {
          // Verify session was saved before redirecting
          const savedSession = PMTwinData?.Sessions?.getCurrentSession();
          const savedUser = PMTwinData?.Sessions?.getCurrentUser();
          
          console.log('🔍 Pre-redirect session check:', {
            hasSession: !!savedSession,
            hasUser: !!savedUser,
            userRole: savedUser?.role,
            userRoleLower: savedUser?.role?.toLowerCase(),
            userEmail: savedUser?.email,
            sessionRole: savedSession?.role,
            isAdmin: isAdmin,
            expectedAdminRole: roleLower
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
              console.warn('⚠️ Session not properly saved for admin user. Saved role:', savedUser?.role, 'Saved email:', savedEmail, 'Expected role:', roleLower);
              
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
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
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

