/**
 * PMTwin User Portal Logic
 * Handles role-adaptive dashboards, project creation, proposals, pipeline, and profile management
 */

(function() {
  'use strict';

  let currentUser = null;
  let currentRoute = 'dashboard';

  // ============================================
  // Initialization
  // ============================================
  function init() {
    try {
      // Check if required modules are loaded
      if (typeof PMTwinData === 'undefined') {
        console.error('PMTwinData not loaded!');
        showError('Error: Required scripts not loaded. Please refresh the page.');
        return;
      }

      if (typeof PMTwinAuth === 'undefined') {
        console.error('PMTwinAuth not loaded!');
        showError('Error: Required scripts not loaded. Please refresh the page.');
        return;
      }

      // Ensure accounts exist
      if (PMTwinData.verifyAndCreateAccounts) {
        PMTwinData.verifyAndCreateAccounts();
      } else if (PMTwinData.autoCreateTestAccounts) {
        PMTwinData.autoCreateTestAccounts();
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
      if (loginSection) loginSection.style.display = 'none';
      if (mainContent) mainContent.style.display = 'block';
      if (navbar) navbar.style.display = 'block';

      // Show/hide navigation based on role
      if (currentUser.role === 'entity') {
        const navProjects = document.getElementById('navProjects');
        const navCreateProject = document.getElementById('navCreateProject');
        if (navProjects) navProjects.style.display = 'block';
        if (navCreateProject) navCreateProject.style.display = 'block';
      }

      // Initialize routing
      initRouting();

      // Initialize collaboration models UI if available
      if (typeof window.CollaborationModelsUI !== 'undefined') {
        window.CollaborationModelsUI.init(currentUser);
      }

      // Load dashboard by default
      loadRoute('dashboard');
    } catch (error) {
      console.error('Error initializing user portal:', error);
      showError('Error loading portal. Please check the console and refresh the page.');
    }
  }

  function showError(message) {
    const loginSection = document.getElementById('loginSection');
    const mainContent = document.getElementById('mainContent');
    
    if (loginSection) {
      loginSection.style.display = 'block';
      const errorEl = document.getElementById('userLoginError');
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
      // Handle initial hash
      const initialHash = window.location.hash.slice(1) || 'dashboard';
      // Parse hash for collaboration-models/1 format
      const hashParts = initialHash.split('/');
      const initialRoute = hashParts[0];
      loadRoute(initialRoute);

      window.addEventListener('hashchange', function() {
        try {
          const hash = window.location.hash.slice(1) || 'dashboard';
          // Parse hash for collaboration-models/1 format
          const hashParts = hash.split('/');
          const route = hashParts[0];
          loadRoute(route);
        } catch (error) {
          console.error('Error handling hash change:', error);
          // Fallback to dashboard
          try {
            loadRoute('dashboard');
          } catch (e) {
            console.error('Error loading dashboard fallback:', e);
          }
        }
      });

      // Update active nav
      const navLinks = document.querySelectorAll('.navbar-link[data-route]');
      if (navLinks && navLinks.length > 0) {
        navLinks.forEach(link => {
          link.addEventListener('click', function(e) {
            try {
              e.preventDefault();
              const route = this.getAttribute('data-route');
              if (route) {
                window.location.hash = route;
                // Don't call updateActiveNav here - loadRoute will handle it
              }
            } catch (error) {
              console.error('Error handling nav click:', error);
            }
          });
        });
      }

      // Mobile nav toggle
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

      // Hide all sections
      const sections = document.querySelectorAll('.route-section');
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          if (section) section.style.display = 'none';
        });
      }

      // Handle collaboration-models with category ID (e.g., collaboration-models/1)
      const hashParts = window.location.hash.slice(1).split('/');
      if (hashParts.length > 1 && hashParts[0] === 'collaboration-models') {
        // Show category detail section
        const categorySection = document.getElementById('collaboration-category');
        if (categorySection) {
          categorySection.style.display = 'block';
        }
        // Hide main collaboration models section
        const mainSection = document.getElementById('collaboration-models');
        if (mainSection) {
          mainSection.style.display = 'none';
        }
      } else {
        // Show appropriate section
        const section = document.getElementById(route);
        if (section) {
          section.style.display = 'block';
        } else {
          // If section doesn't exist, show dashboard as fallback
          console.warn(`Route section not found: ${route}, showing dashboard`);
          const dashboardSection = document.getElementById('dashboard');
          if (dashboardSection) {
            dashboardSection.style.display = 'block';
            route = 'dashboard';
          }
        }
      }

      // Load route content with access control
      try {
        switch(route) {
        case 'dashboard':
          loadDashboard();
          break;
        case 'projects':
          if (canAccessFeature('create_projects')) {
            loadProjects();
          } else {
            showAccessRestricted('projects');
          }
          break;
        case 'create-project':
          if (canAccessFeature('create_projects')) {
            loadCreateProject();
          } else {
            showAccessRestricted('create_projects');
          }
          break;
        case 'opportunities':
          // Try new renderer first
          if (typeof Renderer !== 'undefined' && Renderer.renderOpportunities) {
            try {
              Renderer.renderOpportunities();
            } catch (e) {
              console.warn('Renderer failed, using legacy:', e);
              loadOpportunities();
            }
          } else {
            loadOpportunities();
          }
          break;
        case 'proposals':
          if (canAccessFeature('submit_proposals')) {
            // Try new renderer first
            if (typeof Renderer !== 'undefined' && Renderer.renderProposals) {
              try {
                Renderer.renderProposals();
              } catch (e) {
                console.warn('Renderer failed, using legacy:', e);
                loadProposals();
              }
            } else {
              loadProposals();
            }
          } else {
            showAccessRestricted('submit_proposals');
          }
          break;
        case 'pipeline':
          if (canAccessFeature('view_pipeline')) {
            // Try new renderer first
            if (typeof Renderer !== 'undefined' && Renderer.renderServicePipeline) {
              try {
                Renderer.renderServicePipeline();
              } catch (e) {
                console.warn('Renderer failed, using legacy:', e);
                loadPipeline();
              }
            } else {
              loadPipeline();
            }
          } else {
            showAccessRestricted('view_pipeline');
          }
          break;
        case 'profile':
          loadProfile();
          break;
        case 'onboarding':
          loadOnboarding();
          break;
      case 'collaboration-models':
        // Check if there's a category ID in the hash (e.g., collaboration-models/1)
        const hashParts = window.location.hash.slice(1).split('/');
        if (hashParts.length > 1 && hashParts[0] === 'collaboration-models') {
          const categoryId = hashParts[1];
          loadCollaborationCategory(categoryId);
        } else {
          loadCollaborationModels();
        }
        break;
      case 'collaboration-category':
        // Alternative route format
        const categoryIdFromHash = window.location.hash.match(/collaboration-category\/(\d+)/);
        if (categoryIdFromHash) {
          loadCollaborationCategory(categoryIdFromHash[1]);
        }
        break;
      case 'create-collaboration':
          // Form will be loaded by CollaborationModelsUI.selectModel
          if (typeof window.CollaborationModelsUI !== 'undefined') {
            window.CollaborationModelsUI.init(currentUser);
          }
          break;
        case 'collaboration-opportunities':
          loadCollaborationOpportunities();
          break;
        case 'my-collaborations':
          loadMyCollaborations();
          break;
        case 'collaboration-applications':
          loadCollaborationApplications();
          break;
        default:
          // Unknown route, load dashboard
          console.warn(`Unknown route: ${route}, loading dashboard`);
          loadDashboard();
        }
      } catch (routeError) {
        console.error('Error loading route content:', route, routeError);
        // Show error message in the section
        const routeSection = document.getElementById(route);
        if (routeSection) {
          // Try to find content container
          let container = routeSection.querySelector('[id$="Content"]') || 
                         document.getElementById(route.replace('-', '')) ||
                         routeSection;
          if (container) {
            container.innerHTML = `
              <div class="alert alert-error">
                <h3>Error Loading Content</h3>
                <p>There was an error loading this page. Please try again.</p>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">Error: ${routeError.message}</p>
                <button class="btn btn-primary" onclick="window.location.hash='dashboard'">Go to Dashboard</button>
              </div>
            `;
          }
        }
      }

      updateActiveNav(route);
    } catch (error) {
      console.error('Error loading route:', route, error);
      // Ensure at least dashboard is visible
      const dashboardSection = document.getElementById('dashboard');
      if (dashboardSection) {
        dashboardSection.style.display = 'block';
        try {
          loadDashboard();
        } catch (e) {
          console.error('Error loading dashboard fallback:', e);
        }
      }
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
    let container = document.getElementById('userDashboard');
    if (!container) {
      container = document.getElementById('dashboardContent');
    }
    
    // If using new renderer system, use it
    if (container && typeof Renderer !== 'undefined' && Renderer.renderUserDashboard) {
      try {
        Renderer.renderUserDashboard();
        // Still add onboarding banner if needed
        const user = PMTwinData.Users.getById(currentUser.id);
        if (user) {
          currentUser = user;
        }
        if (currentUser && currentUser.onboardingStage && 
            !['active', 'approved'].includes(currentUser.onboardingStage)) {
          const statusBanner = renderOnboardingStatusBanner(currentUser);
          if (statusBanner && container) {
            const existingContent = container.innerHTML;
            container.innerHTML = statusBanner + existingContent;
          }
        }
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
    
    // Refresh user data
    const user = PMTwinData.Users.getById(currentUser.id);
    if (user) {
      currentUser = user; // Update current user with latest data
    }
    
    // Show onboarding status banner if not fully active
    let statusBanner = '';
    if (currentUser && currentUser.onboardingStage && 
        !['active', 'approved'].includes(currentUser.onboardingStage)) {
      statusBanner = renderOnboardingStatusBanner(currentUser);
    }
    
    if (currentUser.role === 'entity') {
      loadEntityDashboard(container);
    } else {
      loadIndividualDashboard(container);
    }
    
    // Prepend status banner if exists
    if (statusBanner && container) {
      const existingContent = container.innerHTML;
      container.innerHTML = statusBanner + existingContent;
    }
  }

  // ============================================
  // Onboarding Progress Tracker
  // ============================================
  function renderOnboardingProgressTracker(user) {
    const progress = user.onboardingProgress || PMTwinData.calculateOnboardingProgress(user.userType, user.onboardingStage);
    const percentage = progress.percentage || 0;
    const nextSteps = progress.nextSteps || [];
    const currentStage = progress.currentStage || user.onboardingStage;

    const stageLabels = {
      'account_created': 'Account Created',
      'email_verified': 'Email Verified',
      'profile_setup': 'Profile Setup',
      'profile_submitted': 'Profile Submitted',
      'documents_submitted': 'Documents Submitted',
      'pending_verification': 'Pending Verification',
      'approved': 'Approved',
      'active': 'Active',
      'rejected': 'Rejected',
      'suspended': 'Suspended'
    };

    const userTypeLabels = {
      'company': 'Company',
      'consultant': 'Consultant',
      'individual': 'Individual'
    };

    let statusMessage = '';
    let statusClass = 'alert-info';
    
    if (currentStage === 'pending_verification') {
      statusMessage = 'Your account is pending verification. You can browse but some features are restricted until approval (typically 24-48 hours).';
      statusClass = 'alert-info';
    } else if (currentStage === 'rejected') {
      statusMessage = user.verificationRejectionReason || 'Your account verification was rejected. Please contact support.';
      statusClass = 'alert-error';
    } else if (currentStage === 'suspended') {
      statusMessage = 'Your account has been suspended. Please contact support for assistance.';
      statusClass = 'alert-error';
    } else if (currentStage === 'email_verified' && user.userType !== 'individual') {
      statusMessage = 'Please complete your profile to unlock full access.';
      statusClass = 'alert-warning';
    }

    return `
      <div class="card" style="margin-bottom: var(--spacing-6); border-left: 4px solid var(--color-primary);">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-4);">
            <h3 style="margin: 0;">Onboarding Progress</h3>
            <span class="badge badge-primary">${userTypeLabels[user.userType] || 'User'}</span>
          </div>
          
          <div style="margin-bottom: var(--spacing-4);">
            <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-2);">
              <span style="font-weight: 600;">${percentage}% Complete</span>
              <span style="color: var(--text-secondary); font-size: 0.9rem;">${stageLabels[currentStage] || currentStage}</span>
            </div>
            <div style="background: var(--bg-secondary); border-radius: var(--radius); height: 12px; overflow: hidden;">
              <div style="background: linear-gradient(90deg, var(--color-primary), var(--color-primary-light)); height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
            </div>
          </div>

          ${statusMessage ? `
            <div class="alert ${statusClass}" style="margin-bottom: var(--spacing-4);">
              ${statusMessage}
            </div>
          ` : ''}

          ${nextSteps.length > 0 ? `
            <div>
              <strong style="display: block; margin-bottom: var(--spacing-2);">What's Next?</strong>
              <ul style="margin: 0; padding-left: var(--spacing-4);">
                ${nextSteps.map(step => `<li style="margin-bottom: var(--spacing-1);">${step}</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          ${user.userType === 'consultant' && currentStage !== 'approved' ? `
            <div style="margin-top: var(--spacing-4); padding-top: var(--spacing-4); border-top: 1px solid var(--border-color);">
              <strong style="display: block; margin-bottom: var(--spacing-2);">Profile Strength</strong>
              <div style="background: var(--bg-secondary); border-radius: var(--radius); padding: var(--spacing-2);">
                ${calculateProfileStrength(user)}%
              </div>
              <small style="color: var(--text-secondary);">Complete your profile to increase your match score</small>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  function calculateProfileStrength(user) {
    if (!user.profile) return 0;
    
    let score = 0;
    const profile = user.profile;
    
    // Basic info (30%)
    if (profile.name) score += 10;
    if (profile.phone) score += 10;
    if (profile.location) score += 10;
    
    // Professional info (40%)
    if (profile.professionalTitle) score += 15;
    if (profile.skills && profile.skills.length > 0) score += 15;
    if (profile.experienceLevel) score += 10;
    
    // Documents (30%)
    if (profile.credentials && profile.credentials.length > 0) {
      score += 30;
    }
    
    return Math.min(100, score);
  }

  // ============================================
  // Access Control (Type-Specific Restrictions)
  // ============================================
  function canAccessFeature(feature) {
    if (!currentUser) return false;
    
    // Use the centralized access check from data.js
    if (typeof PMTwinData !== 'undefined' && PMTwinData.checkFeatureAccess) {
      const accessCheck = PMTwinData.checkFeatureAccess(currentUser, feature);
      return accessCheck.allowed;
    }
    
    // Fallback to legacy check
    const userType = currentUser.userType;
    const stage = currentUser.onboardingStage;
    
    // Individual users have limited access
    if (userType === 'individual') {
      const allowedFeatures = ['browse_opportunities', 'view_profile', 'view_dashboard'];
      return allowedFeatures.includes(feature);
    }
    
    // Check onboarding stage
    const allowedStages = ['approved', 'active'];
    if (allowedStages.includes(stage)) {
      return true; // Full access
    }
    
    // Limited access for profile_in_progress
    if (stage === 'profile_in_progress') {
      const limitedFeatures = ['browse_opportunities', 'view_profile', 'view_dashboard', 'view_onboarding'];
      return limitedFeatures.includes(feature);
    }
    
    // Very limited access for registered/under_review
    if (stage === 'registered' || stage === 'under_review') {
      const veryLimitedFeatures = ['view_dashboard', 'view_onboarding', 'view_profile'];
      return veryLimitedFeatures.includes(feature);
    }
    
    // Rejected users can only view rejection reason
    if (stage === 'rejected') {
      return feature === 'view_dashboard' || feature === 'view_onboarding' || feature === 'view_profile';
    }
    
    // Admin has full access
    if (userType === 'admin') {
      return true;
    }
    
    return false;
  }

  function showAccessRestricted(feature) {
    const container = document.getElementById('dashboardContent') || document.getElementById('mainContent');
    if (!container) return;
    
    // Get access check reason
    let message = '';
    let nextAction = '';
    
    if (typeof PMTwinData !== 'undefined' && PMTwinData.checkFeatureAccess) {
      const accessCheck = PMTwinData.checkFeatureAccess(currentUser, feature);
      message = accessCheck.reason || 'This feature is not available for your account.';
    } else {
      const stage = currentUser.onboardingStage;
      switch (stage) {
        case 'registered':
          message = 'Please verify your email and mobile number to continue.';
          nextAction = 'Complete verification';
          break;
        case 'profile_in_progress':
          message = 'Please complete your profile to access this feature.';
          nextAction = 'Complete Profile';
          break;
        case 'under_review':
          message = 'Your profile is under review. You will gain access once approved (typically 24-48 hours).';
          nextAction = 'View Status';
          break;
        case 'rejected':
          message = 'Your profile was rejected. Please review the feedback and resubmit.';
          nextAction = 'View Rejection Reason';
          break;
        default:
          message = `This feature requires account approval.`;
      }
    }
    
    const featureLabels = {
      'create_projects': 'Create Projects',
      'submit_proposals': 'Submit Proposals',
      'view_pipeline': 'View Pipeline',
      'projects': 'Projects',
      'collaboration-models': 'Collaboration Models'
    };
    
    const featureName = featureLabels[feature] || feature;
    
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-body" style="text-align: center;">
          <div style="font-size: 4rem; margin-bottom: var(--spacing-4);">🔒</div>
          <h2 style="margin-bottom: var(--spacing-4);">Access Restricted</h2>
          <p class="card-text" style="margin-bottom: var(--spacing-6);">
            ${message}
          </p>
          ${renderOnboardingStatusBanner(currentUser)}
          <div style="margin-top: var(--spacing-4);">
            <a href="#onboarding" class="btn btn-primary">${nextAction || 'Complete Onboarding'}</a>
            <a href="#dashboard" class="btn btn-outline" style="margin-left: var(--spacing-2);">Go to Dashboard</a>
          </div>
        </div>
      </div>
    `;
  }

  function renderOnboardingStatusBanner(user) {
    if (!user) return '';
    
    const stage = user.onboardingStage || 'registered';
    const progress = user.onboardingProgress || { percentage: 0 };
    const percentage = typeof progress === 'object' ? progress.percentage : progress;
    
    let statusText = '';
    let statusClass = '';
    let nextSteps = [];
    
    switch (stage) {
      case 'registered':
        statusText = 'Account Created - Verification Required';
        statusClass = 'warning';
        nextSteps = ['Verify email address', 'Verify mobile number'];
        break;
      case 'profile_in_progress':
        statusText = 'Profile In Progress';
        statusClass = 'info';
        nextSteps = ['Complete profile sections', 'Upload required documents', 'Submit for review'];
        break;
      case 'under_review':
        statusText = 'Under Review';
        statusClass = 'info';
        nextSteps = ['Awaiting admin approval (typically 24-48 hours)'];
        break;
      case 'approved':
        statusText = 'Approved';
        statusClass = 'success';
        nextSteps = [];
        break;
      case 'active':
        statusText = 'Active';
        statusClass = 'success';
        nextSteps = [];
        break;
      case 'rejected':
        statusText = 'Rejected';
        statusClass = 'error';
        nextSteps = ['Review rejection reason', 'Update information', 'Resubmit'];
        break;
    }
    
    return `
      <div class="onboarding-status-banner ${statusClass}" style="margin-bottom: var(--spacing-4); padding: var(--spacing-4); border-radius: var(--radius-md); background: var(--color-${statusClass === 'success' ? 'success' : statusClass === 'error' ? 'danger' : 'info'}-light); border-left: 4px solid var(--color-${statusClass === 'success' ? 'success' : statusClass === 'error' ? 'danger' : 'info'});">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-2);">
          <strong>Status: ${statusText}</strong>
          ${percentage > 0 ? `<span>${percentage}% Complete</span>` : ''}
        </div>
        ${stage === 'profile_in_progress' ? `
          <div class="progress-bar" style="height: 8px; background: rgba(0,0,0,0.1); border-radius: 4px; margin-bottom: var(--spacing-2);">
            <div class="progress-fill" style="height: 100%; width: ${percentage}%; background: var(--color-primary); border-radius: 4px; transition: width 0.3s;"></div>
          </div>
        ` : ''}
        ${nextSteps.length > 0 ? `
          <div style="margin-top: var(--spacing-2);">
            <strong>Next Steps:</strong>
            <ul style="margin: var(--spacing-2) 0 0 var(--spacing-4); text-align: left;">
              ${nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    `;
  }

  function loadEntityDashboard(container) {
    if (!container) {
      console.error('loadEntityDashboard: container is null');
      return;
    }
    
    const projects = PMTwinData.Projects.getByCreator(currentUser.id);
    const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'in_progress');
    const proposals = PMTwinData.Proposals.getAll().filter(p => {
      const project = PMTwinData.Projects.getById(p.projectId);
      return project && project.creatorId === currentUser.id;
    });
    const pendingProposals = proposals.filter(p => p.status === 'in_review' || p.status === 'evaluation');

    container.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${activeProjects.length}</div>
          <div class="stat-label">Active Projects</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${pendingProposals.length}</div>
          <div class="stat-label">Pending Proposals</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${proposals.length}</div>
          <div class="stat-label">Total Proposals</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${projects.length}</div>
          <div class="stat-label">All Projects</div>
        </div>
      </div>
      
      <div class="card" style="margin-top: var(--spacing-6);">
        <div class="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div class="card-body">
          <a href="#create-project" class="btn btn-primary">Create New Project</a>
          <a href="#projects" class="btn btn-outline" style="margin-left: var(--spacing-2);">View All Projects</a>
        </div>
      </div>

      <div class="card" style="margin-top: var(--spacing-6);">
        <div class="card-header">
          <h3>Recent Proposals Received</h3>
        </div>
        <div class="card-body">
          ${pendingProposals.slice(0, 5).map(proposal => {
            const project = PMTwinData.Projects.getById(proposal.projectId);
            const provider = PMTwinData.Users.getById(proposal.providerId);
            return `
              <div class="card" style="margin-bottom: var(--spacing-3);">
                <div class="card-body">
                  <h4>${escapeHtml(project?.title || 'Unknown Project')}</h4>
                  <p><strong>Provider:</strong> ${escapeHtml(provider?.profile?.name || 'Unknown')}</p>
                  <p><strong>Type:</strong> <span class="badge badge-primary">${escapeHtml(proposal.type)}</span></p>
                  <p><strong>Status:</strong> <span class="badge badge-warning">${escapeHtml(proposal.status)}</span></p>
                  <a href="#pipeline" class="btn btn-sm btn-outline">View Details</a>
                </div>
              </div>
            `;
          }).join('') || '<p>No recent proposals</p>'}
        </div>
      </div>
    `;
  }

  function loadIndividualDashboard(container) {
    if (!container) {
      console.error('loadIndividualDashboard: container is null');
      return;
    }
    
    const matches = PMTwinData.Matches.getByProvider(currentUser.id)
      .filter(m => m.score >= 80)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
    const activeProposals = proposals.filter(p => 
      p.status === 'in_review' || p.status === 'evaluation' || p.status === 'approved'
    );

    container.innerHTML = `
      <div class="dashboard-stats">
        <div class="stat-card">
          <div class="stat-value">${matches.length}</div>
          <div class="stat-label">High Matches</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${activeProposals.length}</div>
          <div class="stat-label">Active Proposals</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${proposals.length}</div>
          <div class="stat-label">Total Proposals</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${proposals.filter(p => p.status === 'completed').length}</div>
          <div class="stat-label">Completed</div>
        </div>
      </div>

      <div class="card" style="margin-top: var(--spacing-6);">
        <div class="card-header">
          <h3>Task-Based Opportunities</h3>
        </div>
        <div class="card-body">
          ${matches.map(match => {
            const project = PMTwinData.Projects.getById(match.projectId);
            return `
              <div class="card" style="margin-bottom: var(--spacing-3);">
                <div class="card-body">
                  <h4>${escapeHtml(project?.title || 'Unknown Project')}</h4>
                  <p><strong>Match Score:</strong> <span class="badge badge-success">${match.score}%</span></p>
                  <p><strong>Category:</strong> ${escapeHtml(project?.category || 'N/A')}</p>
                  <a href="#opportunities" class="btn btn-sm btn-primary">View Details</a>
                </div>
              </div>
            `;
          }).join('') || '<p>No matches found. Complete your profile to get matched!</p>'}
        </div>
      </div>

      <div class="card" style="margin-top: var(--spacing-6);">
        <div class="card-header">
          <h3>Active Proposals</h3>
        </div>
        <div class="card-body">
          ${activeProposals.slice(0, 5).map(proposal => {
            const project = PMTwinData.Projects.getById(proposal.projectId);
            return `
              <div class="card" style="margin-bottom: var(--spacing-3);">
                <div class="card-body">
                  <h4>${escapeHtml(project?.title || 'Unknown Project')}</h4>
                  <p><strong>Type:</strong> <span class="badge badge-primary">${escapeHtml(proposal.type)}</span></p>
                  <p><strong>Status:</strong> <span class="badge badge-warning">${escapeHtml(proposal.status)}</span></p>
                  <a href="#pipeline" class="btn btn-sm btn-outline">View Details</a>
                </div>
              </div>
            `;
          }).join('') || '<p>No active proposals</p>'}
        </div>
      </div>
    `;
  }

  // ============================================
  // Projects (Entity only)
  // ============================================
  function loadProjects() {
    const projects = PMTwinData.Projects.getByCreator(currentUser.id);
    const container = document.getElementById('projectsContent');

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No projects yet</h3>
          <p class="empty-state-text">Create your first mega-project to get started!</p>
          <a href="#create-project" class="btn btn-primary">Create Project</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 grid-cols-md-2 gap-6">
        ${projects.map(project => `
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">${escapeHtml(project.title)}</h3>
              <p class="card-text">
                <strong>Category:</strong> ${escapeHtml(project.category)}<br>
                <strong>Location:</strong> ${escapeHtml(project.location?.city || 'N/A')}<br>
                <strong>Status:</strong> <span class="badge badge-primary">${escapeHtml(project.status)}</span><br>
                <strong>Proposals:</strong> ${project.proposalsReceived || 0}
              </p>
              <div style="margin-top: var(--spacing-4);">
                <button class="btn btn-sm btn-outline" onclick="UserPortal.viewProject('${project.id}')">View Details</button>
                ${project.status === 'draft' ? `
                  <button class="btn btn-sm btn-primary" onclick="UserPortal.publishProject('${project.id}')">Publish</button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // ============================================
  // Create Project (Entity only)
  // ============================================
  function loadCreateProject() {
    const form = document.getElementById('projectForm');
    form.innerHTML = `
      <h3>Basic Information</h3>
      <div class="form-group">
        <label for="projectTitle" class="form-label required">Project Title</label>
        <input type="text" id="projectTitle" class="form-control" required>
      </div>
      <div class="form-group">
        <label for="projectDescription" class="form-label required">Description</label>
        <textarea id="projectDescription" class="form-control" rows="4" required></textarea>
      </div>
      <div class="grid grid-cols-1 grid-cols-md-2 gap-4">
        <div class="form-group">
          <label for="projectCategory" class="form-label required">Category</label>
          <select id="projectCategory" class="form-control" required>
            <option value="">Select Category</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Residential">Residential</option>
            <option value="Commercial">Commercial</option>
            <option value="Industrial">Industrial</option>
          </select>
        </div>
        <div class="form-group">
          <label for="projectType" class="form-label required">Project Type</label>
          <select id="projectType" class="form-control" required>
            <option value="">Select Type</option>
            <option value="jv">Joint Venture (JV)</option>
            <option value="consortium">Consortium</option>
            <option value="service_provider">Service Provider</option>
            <option value="mixed">Mixed</option>
          </select>
        </div>
      </div>
      <div class="grid grid-cols-1 grid-cols-md-3 gap-4">
        <div class="form-group">
          <label for="projectCity" class="form-label required">City</label>
          <input type="text" id="projectCity" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="projectRegion" class="form-label required">Region</label>
          <input type="text" id="projectRegion" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="projectCountry" class="form-label required">Country</label>
          <input type="text" id="projectCountry" class="form-control" value="Saudi Arabia" required>
        </div>
      </div>

      <h3 style="margin-top: var(--spacing-8);">Scope & Requirements</h3>
      <div class="form-group">
        <label for="projectScope" class="form-label required">Core Scope Description</label>
        <textarea id="projectScope" class="form-control" rows="3" required></textarea>
      </div>
      <div class="form-group">
        <label for="projectSkills" class="form-label">Required Skills (comma-separated)</label>
        <input type="text" id="projectSkills" class="form-control" placeholder="e.g., Project Management, Civil Engineering">
      </div>
      <div class="grid grid-cols-1 grid-cols-md-2 gap-4">
        <div class="form-group">
          <label for="projectExperience" class="form-label">Experience Level</label>
          <select id="projectExperience" class="form-control">
            <option value="intermediate">Intermediate</option>
            <option value="senior">Senior</option>
            <option value="expert">Expert</option>
          </select>
        </div>
        <div class="form-group">
          <label for="projectMinExperience" class="form-label">Minimum Experience (years)</label>
          <input type="number" id="projectMinExperience" class="form-control" min="0" value="0">
        </div>
      </div>

      <h3 style="margin-top: var(--spacing-8);">Financial Details</h3>
      <div class="grid grid-cols-1 grid-cols-md-2 gap-4">
        <div class="form-group">
          <label for="projectBudgetMin" class="form-label required">Min Budget (SAR)</label>
          <input type="number" id="projectBudgetMin" class="form-control" required min="0">
        </div>
        <div class="form-group">
          <label for="projectBudgetMax" class="form-label required">Max Budget (SAR)</label>
          <input type="number" id="projectBudgetMax" class="form-control" required min="0">
        </div>
      </div>
      <div class="form-group">
        <div class="form-check">
          <input type="checkbox" id="projectBarter" class="form-check-input">
          <label for="projectBarter" class="form-check-label">Accept Barter Proposals</label>
        </div>
      </div>

      <h3 style="margin-top: var(--spacing-8);">Timeline</h3>
      <div class="grid grid-cols-1 grid-cols-md-2 gap-4">
        <div class="form-group">
          <label for="projectStartDate" class="form-label required">Start Date</label>
          <input type="date" id="projectStartDate" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="projectDuration" class="form-label required">Duration (months)</label>
          <input type="number" id="projectDuration" class="form-control" required min="1">
        </div>
      </div>

      <div id="projectError" class="alert alert-error" style="display: none;"></div>
      <div style="margin-top: var(--spacing-6);">
        <button type="submit" class="btn btn-primary">Create Project</button>
        <button type="button" class="btn btn-outline" onclick="window.location.hash='projects'">Cancel</button>
      </div>
    `;
  }

  function handleCreateProject(event) {
    event.preventDefault();

    const title = document.getElementById('projectTitle').value;
    const description = document.getElementById('projectDescription').value;
    const category = document.getElementById('projectCategory').value;
    const projectType = document.getElementById('projectType').value;
    const city = document.getElementById('projectCity').value;
    const region = document.getElementById('projectRegion').value;
    const country = document.getElementById('projectCountry').value;
    const scope = document.getElementById('projectScope').value;
    const skills = document.getElementById('projectSkills').value;
    const experience = document.getElementById('projectExperience').value;
    const minExperience = parseInt(document.getElementById('projectMinExperience').value) || 0;
    const budgetMin = parseFloat(document.getElementById('projectBudgetMin').value);
    const budgetMax = parseFloat(document.getElementById('projectBudgetMax').value);
    const barterAvailable = document.getElementById('projectBarter').checked;
    const startDate = document.getElementById('projectStartDate').value;
    const duration = parseInt(document.getElementById('projectDuration').value);

    // Validation
    if (budgetMin >= budgetMax) {
      showError('projectError', 'Max budget must be greater than min budget');
      return false;
    }

    const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);

    const project = PMTwinData.Projects.create({
      creatorId: currentUser.id,
      title: title,
      description: description,
      category: category,
      projectType: projectType,
      location: {
        city: city,
        region: region,
        country: country
      },
      scope: {
        coreDescription: scope,
        skillRequirements: skillsArray,
        experienceLevel: experience,
        minimumExperience: minExperience
      },
      budget: {
        min: budgetMin,
        max: budgetMax,
        currency: 'SAR'
      },
      barterAvailable: barterAvailable,
      timeline: {
        startDate: startDate,
        expectedDuration: duration,
        milestones: []
      },
      status: 'draft',
      visibility: 'public'
    });

    if (project) {
      alert('Project created successfully! You can publish it from the Projects page.');
      window.location.hash = 'projects';
    } else {
      showError('projectError', 'Failed to create project');
    }

    return false;
  }

  function publishProject(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    if (confirm('Publish this project? It will be visible to all users and matching will begin.')) {
      PMTwinData.Projects.update(projectId, { status: 'active' });
      PMTwinMatching.triggerMatching(projectId);
      loadProjects();
      alert('Project published! Matching algorithm is running.');
    }
  }

  function viewProject(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    showModal('Project Details', `
      <h3>${escapeHtml(project.title)}</h3>
      <p><strong>Category:</strong> ${escapeHtml(project.category)}</p>
      <p><strong>Location:</strong> ${escapeHtml(project.location?.city || 'N/A')}, ${escapeHtml(project.location?.region || '')}</p>
      <p><strong>Budget:</strong> ${project.budget?.min?.toLocaleString() || 'N/A'} - ${project.budget?.max?.toLocaleString() || 'N/A'} SAR</p>
      <p><strong>Status:</strong> <span class="badge badge-primary">${escapeHtml(project.status)}</span></p>
      <p><strong>Description:</strong></p>
      <p>${escapeHtml(project.description)}</p>
      <p><strong>Proposals Received:</strong> ${project.proposalsReceived || 0}</p>
      <p><strong>Matches Generated:</strong> ${project.matchesGenerated || 0}</p>
    `);
  }

  // ============================================
  // Opportunities
  // ============================================
  function loadOpportunities() {
    const container = document.getElementById('opportunitiesContent');
    
    if (currentUser.role === 'entity') {
      // Entities see their projects and matches
      const projects = PMTwinData.Projects.getByCreator(currentUser.id);
      container.innerHTML = `
        <h2>Your Projects - Matches</h2>
        ${projects.map(project => {
          const matches = PMTwinData.Matches.getByProject(project.id)
            .sort((a, b) => b.score - a.score);
          return `
            <div class="card" style="margin-bottom: var(--spacing-4);">
              <div class="card-body">
                <h3>${escapeHtml(project.title)}</h3>
                <p>${matches.length} matches found</p>
                ${matches.map(match => {
                  const provider = PMTwinData.Users.getById(match.providerId);
                  return `
                    <div class="card" style="margin-top: var(--spacing-3); background: var(--bg-secondary);">
                      <div class="card-body">
                        <h4>${escapeHtml(provider?.profile?.name || 'Unknown')}</h4>
                        <p><strong>Match Score:</strong> <span class="badge badge-success">${match.score}%</span></p>
                        <p><strong>Role:</strong> ${escapeHtml(provider?.role || 'N/A')}</p>
                        <button class="btn btn-sm btn-primary" onclick="UserPortal.viewMatch('${match.id}')">View Details</button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('') || '<p>No projects with matches yet.</p>'}
      `;
    } else {
      // Individuals see their matches
      const matches = PMTwinData.Matches.getByProvider(currentUser.id)
        .sort((a, b) => b.score - a.score);
      
      if (matches.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">🔍</div>
            <h3 class="empty-state-title">No matches found</h3>
            <p class="empty-state-text">Complete your profile to get matched with projects!</p>
            <a href="#profile" class="btn btn-primary">Update Profile</a>
          </div>
        `;
        return;
      }

      container.innerHTML = matches.map(match => {
        const project = PMTwinData.Projects.getById(match.projectId);
        return `
          <div class="card" style="margin-bottom: var(--spacing-4);">
            <div class="card-body">
              <h3>${escapeHtml(project?.title || 'Unknown Project')}</h3>
              <p><strong>Match Score:</strong> <span class="badge badge-success">${match.score}%</span></p>
              <p><strong>Category:</strong> ${escapeHtml(project?.category || 'N/A')}</p>
              <p><strong>Location:</strong> ${escapeHtml(project?.location?.city || 'N/A')}</p>
              <p><strong>Description:</strong> ${escapeHtml(project?.description?.substring(0, 200) || '')}...</p>
              <div style="margin-top: var(--spacing-4);">
                <button class="btn btn-primary" onclick="UserPortal.viewMatch('${match.id}')">View Details</button>
                <button class="btn btn-outline" onclick="UserPortal.createProposal('${match.projectId}')">Submit Proposal</button>
              </div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  function viewMatch(matchId) {
    const details = PMTwinMatching.getMatchDetails(matchId);
    if (!details) return;

    const { match, project, breakdown } = details;

    showModal('Match Details', `
      <h3>${escapeHtml(project?.title || 'Unknown Project')}</h3>
      <p><strong>Overall Match Score:</strong> <span class="badge badge-success">${match.score}%</span></p>
      
      <h4 style="margin-top: var(--spacing-4);">Score Breakdown</h4>
      <ul>
        <li><strong>Category:</strong> ${breakdown.category.score}% (weight: ${(breakdown.category.weight * 100).toFixed(0)}%)</li>
        <li><strong>Skills:</strong> ${breakdown.skills.score}% (weight: ${(breakdown.skills.weight * 100).toFixed(0)}%)</li>
        <li><strong>Experience:</strong> ${breakdown.experience.score}% (weight: ${(breakdown.experience.weight * 100).toFixed(0)}%)</li>
        <li><strong>Location:</strong> ${breakdown.location.score}% (weight: ${(breakdown.location.weight * 100).toFixed(0)}%)</li>
      </ul>

      <h4 style="margin-top: var(--spacing-4);">Project Details</h4>
      <p><strong>Category:</strong> ${escapeHtml(project?.category || 'N/A')}</p>
      <p><strong>Location:</strong> ${escapeHtml(project?.location?.city || 'N/A')}, ${escapeHtml(project?.location?.region || '')}</p>
      <p><strong>Budget:</strong> ${project?.budget?.min?.toLocaleString() || 'N/A'} - ${project?.budget?.max?.toLocaleString() || 'N/A'} SAR</p>
      <p><strong>Description:</strong></p>
      <p>${escapeHtml(project?.description || '')}</p>

      <div style="margin-top: var(--spacing-4);">
        <button class="btn btn-primary" onclick="UserPortal.createProposal('${project.id}'); UserPortal.closeModal();">Submit Proposal</button>
      </div>
    `);
  }

  // ============================================
  // Proposals
  // ============================================
  function loadProposals() {
    const container = document.getElementById('proposalsContent');
    
    let proposals = [];
    if (currentUser.role === 'entity') {
      // Entities see proposals received on their projects
      const projects = PMTwinData.Projects.getByCreator(currentUser.id);
      proposals = PMTwinData.Proposals.getAll().filter(p => 
        projects.some(proj => proj.id === p.projectId)
      );
    } else {
      // Individuals see proposals they sent
      proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
    }

    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📄</div>
          <h3 class="empty-state-title">No proposals yet</h3>
          <p class="empty-state-text">${currentUser.role === 'entity' ? 'Proposals on your projects will appear here.' : 'Submit proposals on matched projects to see them here.'}</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-responsive">
        <table class="table">
          <thead>
            <tr>
              <th>Project</th>
              <th>${currentUser.role === 'entity' ? 'Provider' : 'Type'}</th>
              <th>Type</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${proposals.map(proposal => {
              const project = PMTwinData.Projects.getById(proposal.projectId);
              const provider = currentUser.role === 'entity' ? 
                PMTwinData.Users.getById(proposal.providerId) : null;
              return `
                <tr>
                  <td>${escapeHtml(project?.title || 'Unknown')}</td>
                  <td>${currentUser.role === 'entity' ? escapeHtml(provider?.profile?.name || 'Unknown') : escapeHtml(proposal.type)}</td>
                  <td><span class="badge badge-primary">${escapeHtml(proposal.type)}</span></td>
                  <td><span class="badge badge-warning">${escapeHtml(proposal.status)}</span></td>
                  <td>${new Date(proposal.submittedAt).toLocaleDateString()}</td>
                  <td>
                    <button class="btn btn-sm btn-outline" onclick="UserPortal.viewProposal('${proposal.id}')">View</button>
                    ${currentUser.role === 'entity' && proposal.status === 'in_review' ? `
                      <button class="btn btn-sm btn-primary" onclick="UserPortal.approveProposal('${proposal.id}')">Approve</button>
                      <button class="btn btn-sm btn-danger" onclick="UserPortal.rejectProposal('${proposal.id}')">Reject</button>
                    ` : ''}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  function createProposal(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) return;

    showModal('Submit Proposal', `
      <form id="proposalForm" onsubmit="return UserPortal.handleSubmitProposal(event, '${projectId}')">
        <div class="form-group">
          <label class="form-label required">Proposal Type</label>
          <select id="proposalType" class="form-control" required onchange="UserPortal.updateProposalForm()">
            <option value="">Select Type</option>
            <option value="cash">Cash Proposal</option>
            ${project.barterAvailable ? '<option value="barter">Barter Proposal</option>' : ''}
          </select>
        </div>
        <div id="proposalFormContent">
          <!-- Form content loaded dynamically -->
        </div>
        <div id="proposalError" class="alert alert-error" style="display: none;"></div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Submit Proposal</button>
          <button type="button" class="btn btn-outline" onclick="UserPortal.closeModal()">Cancel</button>
        </div>
      </form>
    `, true);
  }

  function updateProposalForm() {
    const type = document.getElementById('proposalType').value;
    const container = document.getElementById('proposalFormContent');
    
    if (!type) {
      container.innerHTML = '';
      return;
    }

    if (type === 'cash') {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label required">Service Description</label>
          <textarea id="proposalServiceDesc" class="form-control" rows="4" required></textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">Total Amount (SAR)</label>
          <input type="number" id="proposalTotal" class="form-control" required min="0" step="0.01">
        </div>
        <div class="form-group">
          <label class="form-label">Timeline (months)</label>
          <input type="number" id="proposalTimeline" class="form-control" min="1">
        </div>
        <div class="form-group">
          <label class="form-label">Terms & Conditions</label>
          <textarea id="proposalTerms" class="form-control" rows="3"></textarea>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="form-group">
          <label class="form-label required">Services Offered</label>
          <textarea id="proposalOffered" class="form-control" rows="3" required placeholder="Describe services you can provide"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">Value Offered (SAR)</label>
          <input type="number" id="proposalOfferedValue" class="form-control" required min="0">
        </div>
        <div class="form-group">
          <label class="form-label required">Services Requested</label>
          <textarea id="proposalRequested" class="form-control" rows="3" required placeholder="Describe services you need in exchange"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">Value Requested (SAR)</label>
          <input type="number" id="proposalRequestedValue" class="form-control" required min="0">
        </div>
        <div class="form-group">
          <label class="form-label">Barter Terms</label>
          <textarea id="proposalTerms" class="form-control" rows="3"></textarea>
        </div>
      `;
    }
  }

  function handleSubmitProposal(event, projectId) {
    event.preventDefault();

    const type = document.getElementById('proposalType').value;
    
    let proposalData = {
      projectId: projectId,
      providerId: currentUser.id,
      type: type
    };

    if (type === 'cash') {
      proposalData.cashDetails = {
        serviceDescription: document.getElementById('proposalServiceDesc').value,
        total: parseFloat(document.getElementById('proposalTotal').value),
        currency: 'SAR',
        pricing: [],
        subtotal: parseFloat(document.getElementById('proposalTotal').value),
        taxes: { vat: 0, other: 0 }
      };
      proposalData.timeline = {
        duration: parseInt(document.getElementById('proposalTimeline').value) || 0
      };
      proposalData.terms = document.getElementById('proposalTerms').value;
    } else {
      const offeredValue = parseFloat(document.getElementById('proposalOfferedValue').value);
      const requestedValue = parseFloat(document.getElementById('proposalRequestedValue').value);
      
      proposalData.barterDetails = {
        servicesOffered: [{
          description: document.getElementById('proposalOffered').value,
          value: offeredValue,
          timeline: ''
        }],
        servicesRequested: [{
          description: document.getElementById('proposalRequested').value,
          value: requestedValue,
          timeline: ''
        }],
        totalOffered: offeredValue,
        totalRequested: requestedValue,
        balance: offeredValue - requestedValue,
        cashComponent: 0
      };
      proposalData.terms = document.getElementById('proposalTerms').value;
    }

    const proposal = PMTwinData.Proposals.create(proposalData);

    if (proposal) {
      // Create notification for project creator
      const project = PMTwinData.Projects.getById(projectId);
      if (project) {
        PMTwinData.Notifications.create({
          userId: project.creatorId,
          type: 'proposal_received',
          title: 'New Proposal Received',
          message: `You have received a new ${type} proposal for "${project.title}"`,
          relatedEntityType: 'proposal',
          relatedEntityId: proposal.id,
          actionUrl: '#proposals',
          actionLabel: 'View Proposal'
        });
      }

      closeModal();
      alert('Proposal submitted successfully!');
      loadProposals();
      loadPipeline();
    } else {
      showError('proposalError', 'Failed to submit proposal');
    }

    return false;
  }

  function viewProposal(proposalId) {
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) return;

    const project = PMTwinData.Projects.getById(proposal.projectId);
    const provider = PMTwinData.Users.getById(proposal.providerId);

    let content = `
      <h3>Proposal Details</h3>
      <p><strong>Project:</strong> ${escapeHtml(project?.title || 'Unknown')}</p>
      <p><strong>${currentUser.role === 'entity' ? 'Provider' : 'Type'}:</strong> ${currentUser.role === 'entity' ? escapeHtml(provider?.profile?.name || 'Unknown') : escapeHtml(proposal.type)}</p>
      <p><strong>Type:</strong> <span class="badge badge-primary">${escapeHtml(proposal.type)}</span></p>
      <p><strong>Status:</strong> <span class="badge badge-warning">${escapeHtml(proposal.status)}</span></p>
      <p><strong>Submitted:</strong> ${new Date(proposal.submittedAt).toLocaleString()}</p>
    `;

    if (proposal.type === 'cash') {
      content += `
        <h4 style="margin-top: var(--spacing-4);">Cash Details</h4>
        <p><strong>Service Description:</strong></p>
        <p>${escapeHtml(proposal.cashDetails?.serviceDescription || '')}</p>
        <p><strong>Total Amount:</strong> ${proposal.cashDetails?.total?.toLocaleString() || 'N/A'} ${proposal.cashDetails?.currency || 'SAR'}</p>
      `;
    } else {
      content += `
        <h4 style="margin-top: var(--spacing-4);">Barter Details</h4>
        <p><strong>Services Offered:</strong></p>
        <p>${escapeHtml(proposal.barterDetails?.servicesOffered?.[0]?.description || '')}</p>
        <p><strong>Value Offered:</strong> ${proposal.barterDetails?.totalOffered?.toLocaleString() || 'N/A'} SAR</p>
        <p><strong>Services Requested:</strong></p>
        <p>${escapeHtml(proposal.barterDetails?.servicesRequested?.[0]?.description || '')}</p>
        <p><strong>Value Requested:</strong> ${proposal.barterDetails?.totalRequested?.toLocaleString() || 'N/A'} SAR</p>
        <p><strong>Balance:</strong> ${(proposal.barterDetails?.balance || 0).toLocaleString()} SAR</p>
      `;
    }

    if (currentUser.role === 'entity' && proposal.status === 'in_review') {
      content += `
        <div style="margin-top: var(--spacing-4);">
          <button class="btn btn-primary" onclick="UserPortal.approveProposal('${proposalId}'); UserPortal.closeModal();">Approve</button>
          <button class="btn btn-danger" onclick="UserPortal.rejectProposal('${proposalId}'); UserPortal.closeModal();">Reject</button>
        </div>
      `;
    }

    showModal('Proposal Details', content);
  }

  function approveProposal(proposalId) {
    if (!confirm('Approve this proposal?')) return;

    PMTwinData.Proposals.update(proposalId, { status: 'approved' });
    
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (proposal) {
      PMTwinData.Notifications.create({
        userId: proposal.providerId,
        type: 'proposal_approved',
        title: 'Proposal Approved!',
        message: `Your proposal has been approved!`,
        relatedEntityType: 'proposal',
        relatedEntityId: proposalId,
        actionUrl: '#pipeline',
        actionLabel: 'View Pipeline'
      });
    }

    loadProposals();
    loadPipeline();
    alert('Proposal approved!');
  }

  function rejectProposal(proposalId) {
    const reason = prompt('Enter rejection reason (optional):');
    
    PMTwinData.Proposals.update(proposalId, { 
      status: 'rejected',
      rejectionReason: reason || null
    });
    
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (proposal) {
      PMTwinData.Notifications.create({
        userId: proposal.providerId,
        type: 'proposal_rejected',
        title: 'Proposal Rejected',
        message: `Your proposal has been rejected.${reason ? ' Reason: ' + reason : ''}`,
        relatedEntityType: 'proposal',
        relatedEntityId: proposalId,
        actionUrl: '#proposals',
        actionLabel: 'View Proposal'
      });
    }

    loadProposals();
    loadPipeline();
    alert('Proposal rejected.');
  }

  // ============================================
  // Pipeline
  // ============================================
  function loadPipeline() {
    const container = document.getElementById('pipelineContent');
    
    let proposals = [];
    if (currentUser.role === 'entity') {
      const projects = PMTwinData.Projects.getByCreator(currentUser.id);
      proposals = PMTwinData.Proposals.getAll().filter(p => 
        projects.some(proj => proj.id === p.projectId)
      );
    } else {
      proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
    }

    const statuses = ['in_review', 'evaluation', 'approved', 'rejected', 'completed'];
    const statusLabels = {
      'in_review': 'In Review',
      'evaluation': 'Evaluation',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'completed': 'Completed'
    };

    container.innerHTML = `
      <div class="pipeline">
        ${statuses.map(status => {
          const statusProposals = proposals.filter(p => p.status === status);
          return `
            <div class="pipeline-column">
              <div class="pipeline-column-header">
                ${statusLabels[status]} (${statusProposals.length})
              </div>
              ${statusProposals.map(proposal => {
                const project = PMTwinData.Projects.getById(proposal.projectId);
                return `
                  <div class="pipeline-card" onclick="UserPortal.viewProposal('${proposal.id}')">
                    <h4>${escapeHtml(project?.title || 'Unknown')}</h4>
                    <p><strong>Type:</strong> <span class="badge badge-primary">${escapeHtml(proposal.type)}</span></p>
                    <p><small>${new Date(proposal.submittedAt).toLocaleDateString()}</small></p>
                  </div>
                `;
              }).join('')}
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============================================
  // Profile
  // ============================================
  function loadProfile() {
    const container = document.getElementById('profileContent');
    const user = PMTwinData.Users.getById(currentUser.id);
    
    container.innerHTML = `
      <div class="card">
        <div class="card-body">
          <h3>Profile Information</h3>
          <form id="profileForm" onsubmit="return UserPortal.handleUpdateProfile(event)">
            <div class="form-group">
              <label class="form-label required">${user.role === 'entity' ? 'Company Name' : 'Full Name'}</label>
              <input type="text" id="profileName" class="form-control" value="${escapeHtml(user.profile?.name || '')}" required>
            </div>
            <div class="form-group">
              <label class="form-label required">Email</label>
              <input type="email" id="profileEmail" class="form-control" value="${escapeHtml(user.email || '')}" disabled>
            </div>
            ${user.role === 'entity' ? `
              <div class="form-group">
                <label class="form-label">Phone</label>
                <input type="tel" id="profilePhone" class="form-control" value="${escapeHtml(user.profile?.phone || '')}">
              </div>
              <div class="form-group">
                <label class="form-label">Website</label>
                <input type="url" id="profileWebsite" class="form-control" value="${escapeHtml(user.profile?.website || '')}">
              </div>
            ` : ''}
            ${user.role === 'individual' ? `
              <div class="form-group">
                <label class="form-label">Skills (comma-separated)</label>
                <input type="text" id="profileSkills" class="form-control" value="${escapeHtml((user.profile?.skills || []).join(', '))}">
              </div>
            ` : `
              <div class="form-group">
                <label class="form-label">Services (comma-separated)</label>
                <input type="text" id="profileServices" class="form-control" value="${escapeHtml((user.profile?.services || []).join(', '))}">
              </div>
            `}
            <div id="profileError" class="alert alert-error" style="display: none;"></div>
            <button type="submit" class="btn btn-primary">Update Profile</button>
          </form>
        </div>
      </div>
    `;
  }

  function handleUpdateProfile(event) {
    event.preventDefault();

    const name = document.getElementById('profileName').value;
    const phone = document.getElementById('profilePhone')?.value || '';
    const website = document.getElementById('profileWebsite')?.value || '';
    const skills = document.getElementById('profileSkills')?.value || '';
    const services = document.getElementById('profileServices')?.value || '';

    const updates = {
      profile: {
        ...currentUser.profile,
        name: name,
        phone: phone,
        website: website
      }
    };

    if (currentUser.role === 'individual') {
      updates.profile.skills = skills.split(',').map(s => s.trim()).filter(s => s);
    } else {
      updates.profile.services = services.split(',').map(s => s.trim()).filter(s => s);
    }

    const updated = PMTwinData.Users.update(currentUser.id, updates);
    
    if (updated) {
      currentUser = updated;
      alert('Profile updated successfully!');
      loadProfile();
    } else {
      showError('profileError', 'Failed to update profile');
    }

    return false;
  }

  // ============================================
  // Modal Functions
  // ============================================
  function showModal(title, body, showFooter = false) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = body;
    document.getElementById('modalFooter').innerHTML = showFooter ? '' : '<button class="btn btn-outline" onclick="UserPortal.closeModal()">Close</button>';
    
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

  function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('userLoginEmail').value;
    const password = document.getElementById('userLoginPassword').value;
    
    // Ensure test accounts exist before attempting login
    if (typeof PMTwinData !== 'undefined' && PMTwinData.verifyAndCreateAccounts) {
      PMTwinData.verifyAndCreateAccounts();
    }
    
    const result = PMTwinAuth.login(email, password);
    
    if (result.success) {
      // Check if user has correct role
      if (result.user.role !== 'individual' && result.user.role !== 'entity') {
        showError('userLoginError', 'This portal is for Individual and Entity users only. Please use the Admin Portal for admin accounts.');
        return false;
      }
      
      // Success - reload the page to show authenticated content
      window.location.reload();
    } else {
      let errorMsg = result.error;
      
      // Add helpful message if accounts might not exist
      if (errorMsg.includes('Invalid email or password')) {
        // Check if account exists
        const user = PMTwinData.Users.getByEmail(email);
        if (!user) {
          errorMsg += '<br><br><strong>Account not found.</strong> Try:<br>' +
            '1. Open console (F12) and run: <code>PMTwinData.forceCreateTestAccounts()</code><br>' +
            '2. Or refresh the page to auto-create accounts';
        } else {
          // Account exists but password wrong
          errorMsg += '<br><br>Make sure you\'re using the correct password:<br>' +
            '- Individual: User123<br>' +
            '- Entity: Entity123';
        }
      }
      
      const errorEl = document.getElementById('userLoginError');
      if (errorEl) {
        errorEl.innerHTML = errorMsg;
        errorEl.style.display = 'block';
      }
    }
    
    return false;
  }

  function logout() {
    PMTwinAuth.logout();
    window.location.href = 'index.html';
  }

  // ============================================
  // Collaboration Models Functions
  // ============================================
  function loadCollaborationModels() {
    try {
      // Hide category detail section
      const categorySection = document.getElementById('collaboration-category');
      if (categorySection) {
        categorySection.style.display = 'none';
      }
      
      // Show main section
      const mainSection = document.getElementById('collaboration-models');
      if (mainSection) {
        mainSection.style.display = 'block';
      }

      const container = document.getElementById('collaborationModelsContent');
      if (!container) {
        console.error('collaborationModelsContent container not found');
        return;
      }

      // Check if CollaborationModels is available
      if (typeof window.CollaborationModels === 'undefined') {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Collaboration models definitions not loaded. Please refresh the page.</p>
            <p>Available objects: ${Object.keys(window).filter(k => k.includes('Collaboration')).join(', ') || 'None'}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
        return;
      }

      // Check if CollaborationModelsUI is available
      if (typeof window.CollaborationModelsUI === 'undefined') {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Collaboration models UI not loaded. Please refresh the page.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
        return;
      }

      // Initialize and render
      try {
        window.CollaborationModelsUI.init(currentUser);
        window.CollaborationModelsUI.renderModelSelection();
      } catch (renderError) {
        console.error('Error rendering model selection:', renderError);
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error rendering collaboration models: ${renderError.message}</p>
            <button class="btn btn-primary" onclick="window.location.hash='collaboration-models'">Retry</button>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading collaboration models:', error);
      const container = document.getElementById('collaborationModelsContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error loading collaboration models: ${error.message}</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
      }
    }
  }

  function loadCollaborationCategory(categoryId) {
    try {
      // Hide main section
      const mainSection = document.getElementById('collaboration-models');
      if (mainSection) {
        mainSection.style.display = 'none';
      }
      
      // Show category detail section
      const categorySection = document.getElementById('collaboration-category');
      if (categorySection) {
        categorySection.style.display = 'block';
      }

      const container = document.getElementById('collaborationCategoryContent');
      if (!container) {
        console.error('collaborationCategoryContent container not found');
        return;
      }

      // Check if CollaborationModels is available
      if (typeof window.CollaborationModels === 'undefined') {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Collaboration models definitions not loaded. Please refresh the page.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
        return;
      }

      // Check if CollaborationModelsUI is available
      if (typeof window.CollaborationModelsUI === 'undefined') {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Collaboration models UI not loaded. Please refresh the page.</p>
            <button class="btn btn-primary" onclick="window.location.reload()">Refresh Page</button>
          </div>
        `;
        return;
      }

      // Initialize and render category detail
      try {
        window.CollaborationModelsUI.init(currentUser);
        window.CollaborationModelsUI.renderCategoryDetail(categoryId);
      } catch (renderError) {
        console.error('Error rendering category detail:', renderError);
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error rendering category: ${renderError.message}</p>
            <button class="btn btn-primary" onclick="window.location.hash='collaboration-models'">Back to Categories</button>
          </div>
        `;
      }
    } catch (error) {
      console.error('Error loading collaboration category:', error);
      const container = document.getElementById('collaborationCategoryContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error loading category: ${error.message}</p>
            <button class="btn btn-primary" onclick="window.location.hash='collaboration-models'">Back to Categories</button>
          </div>
        `;
      }
    }
  }

  function loadCollaborationOpportunities() {
    try {
      const container = document.getElementById('collaborationOpportunitiesContent');
      if (!container) {
        console.error('collaborationOpportunitiesContent container not found');
        return;
      }

      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
        container.innerHTML = '<p class="alert alert-error">Collaboration features not available. Please refresh the page.</p>';
        return;
      }

      const opportunities = PMTwinData.CollaborationOpportunities.getActive();
      
      if (opportunities.length === 0) {
        container.innerHTML = '<p>No active collaboration opportunities found.</p>';
        return;
      }

      let html = '<div class="opportunities-grid">';
      opportunities.forEach(opp => {
        try {
          const model = window.CollaborationModels?.getModel(opp.modelType);
          html += `
            <div class="opportunity-card card">
              <div class="card-body">
                <h3>${model?.name || opp.modelType}</h3>
                <p class="text-muted">${model?.category || ''}</p>
                <p>${opp.attributes?.taskTitle || opp.attributes?.projectTitle || opp.attributes?.allianceTitle || 'No title'}</p>
                <div class="opportunity-meta">
                  <span class="badge badge-primary">${opp.relationshipType}</span>
                  <span class="badge badge-secondary">${opp.status}</span>
                </div>
                <button class="btn btn-primary btn-sm" onclick="if(window.UserPortal && UserPortal.viewCollaborationOpportunity) { UserPortal.viewCollaborationOpportunity('${opp.id}'); } else { alert('Function not available'); }">
                  View Details
                </button>
              </div>
            </div>
          `;
        } catch (e) {
          console.error('Error rendering opportunity:', opp.id, e);
        }
      });
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading collaboration opportunities:', error);
      const container = document.getElementById('collaborationOpportunitiesContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error loading opportunities. Please try again.</p>
            <button class="btn btn-primary" onclick="window.location.hash='collaboration-opportunities'">Retry</button>
          </div>
        `;
      }
    }
  }

  function loadMyCollaborations() {
    try {
      const container = document.getElementById('myCollaborationsContent');
      if (!container) {
        console.error('myCollaborationsContent container not found');
        return;
      }
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not logged in.</p>';
        return;
      }

      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
        container.innerHTML = '<p class="alert alert-error">Collaboration features not available. Please refresh the page.</p>';
        return;
      }

      const opportunities = PMTwinData.CollaborationOpportunities.getByCreator(currentUser.id);
      
      if (opportunities.length === 0) {
        container.innerHTML = `
          <p>You haven\'t created any collaboration opportunities yet.</p>
          <a href="#collaboration-models" class="btn btn-primary">Create One Now</a>
        `;
        return;
      }

      let html = '<div class="collaborations-list">';
      html += '<table class="table">';
      html += '<thead><tr><th>Model</th><th>Title</th><th>Status</th><th>Applications</th><th>Actions</th></tr></thead>';
      html += '<tbody>';
      opportunities.forEach(opp => {
        try {
          const model = window.CollaborationModels?.getModel(opp.modelType);
          html += `
            <tr>
              <td>${model?.name || opp.modelType}</td>
              <td>${opp.attributes?.taskTitle || opp.attributes?.projectTitle || opp.attributes?.allianceTitle || 'No title'}</td>
              <td><span class="badge badge-${opp.status}">${opp.status}</span></td>
              <td>${opp.applicationsReceived || 0}</td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="if(window.UserPortal && UserPortal.viewCollaborationOpportunity) { UserPortal.viewCollaborationOpportunity('${opp.id}'); }">View</button>
                ${opp.status === 'draft' ? `
                  <button class="btn btn-sm btn-success" onclick="if(window.UserPortal && UserPortal.publishCollaboration) { UserPortal.publishCollaboration('${opp.id}'); }">Publish</button>
                ` : ''}
              </td>
            </tr>
          `;
        } catch (e) {
          console.error('Error rendering collaboration:', opp.id, e);
        }
      });
      html += '</tbody></table>';
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading my collaborations:', error);
      const container = document.getElementById('myCollaborationsContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error loading collaborations. Please try again.</p>
            <button class="btn btn-primary" onclick="window.location.hash='my-collaborations'">Retry</button>
          </div>
        `;
      }
    }
  }

  function loadCollaborationApplications() {
    try {
      const container = document.getElementById('collaborationApplicationsContent');
      if (!container) {
        console.error('collaborationApplicationsContent container not found');
        return;
      }
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not logged in.</p>';
        return;
      }

      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationApplications) {
        container.innerHTML = '<p class="alert alert-error">Collaboration features not available. Please refresh the page.</p>';
        return;
      }

      const applications = PMTwinData.CollaborationApplications.getByApplicant(currentUser.id);
      
      if (applications.length === 0) {
        container.innerHTML = '<p>You haven\'t submitted any applications yet.</p>';
        return;
      }

      let html = '<div class="applications-list">';
      html += '<table class="table">';
      html += '<thead><tr><th>Opportunity</th><th>Model</th><th>Status</th><th>Submitted</th><th>Actions</th></tr></thead>';
      html += '<tbody>';
      applications.forEach(app => {
        try {
          const opp = PMTwinData.CollaborationOpportunities.getById(app.opportunityId);
          const model = window.CollaborationModels?.getModel(opp?.modelType);
          html += `
            <tr>
              <td>${opp?.attributes?.taskTitle || opp?.attributes?.projectTitle || 'N/A'}</td>
              <td>${model?.name || 'N/A'}</td>
              <td><span class="badge badge-${app.status}">${app.status}</span></td>
              <td>${app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'N/A'}</td>
              <td>
                <button class="btn btn-sm btn-primary" onclick="if(window.UserPortal && UserPortal.viewCollaborationApplication) { UserPortal.viewCollaborationApplication('${app.id}'); }">View</button>
              </td>
            </tr>
          `;
        } catch (e) {
          console.error('Error rendering application:', app.id, e);
        }
      });
      html += '</tbody></table>';
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading collaboration applications:', error);
      const container = document.getElementById('collaborationApplicationsContent');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p>Error loading applications. Please try again.</p>
            <button class="btn btn-primary" onclick="window.location.hash='collaboration-applications'">Retry</button>
          </div>
        `;
      }
    }
  }

  function viewCollaborationOpportunity(opportunityId) {
    try {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
        alert('Collaboration features not available. Please refresh the page.');
        return;
      }

      const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
      if (!opportunity) {
        alert('Opportunity not found');
        return;
      }

      const model = window.CollaborationModels?.getModel(opportunity.modelType);
      let html = `
        <h2>${model?.name || opportunity.modelType}</h2>
        <p><strong>Category:</strong> ${model?.category || ''}</p>
        <p><strong>Status:</strong> ${opportunity.status}</p>
        <p><strong>Relationship Type:</strong> ${opportunity.relationshipType}</p>
        <hr>
        <h3>Details</h3>
      `;

      // Display attributes
      Object.keys(opportunity.attributes || {}).forEach(key => {
        const value = opportunity.attributes[key];
        if (value !== null && value !== undefined && value !== '') {
          html += `<p><strong>${key}:</strong> ${typeof value === 'object' ? JSON.stringify(value) : value}</p>`;
        }
      });

      html += `
        <hr>
        <div class="modal-actions">
          ${opportunity.creatorId !== currentUser?.id ? `
            <button class="btn btn-primary" onclick="if(window.UserPortal && UserPortal.applyToCollaboration) { UserPortal.applyToCollaboration('${opportunityId}'); }">Apply</button>
          ` : ''}
          <button class="btn btn-secondary" onclick="if(window.UserPortal && UserPortal.closeModal) { UserPortal.closeModal(); }">Close</button>
        </div>
      `;

      showModal('Collaboration Opportunity', html);
    } catch (error) {
      console.error('Error viewing collaboration opportunity:', error);
      alert('Error loading opportunity details. Please try again.');
    }
  }

  function applyToCollaboration(opportunityId) {
    try {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities || !PMTwinData.CollaborationApplications) {
        alert('Collaboration features not available. Please refresh the page.');
        return;
      }

      const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
      if (!opportunity) {
        alert('Opportunity not found');
        return;
      }

      if (!currentUser || !currentUser.id) {
        alert('User not logged in');
        return;
      }

      // Create application
      const application = PMTwinData.CollaborationApplications.create({
        opportunityId: opportunityId,
        applicantId: currentUser.id,
        status: 'in_review'
      });

      if (application) {
        alert('Application submitted successfully!');
        closeModal();
        // Reload applications if on that page
        if (currentRoute === 'collaboration-applications') {
          loadCollaborationApplications();
        }
      } else {
        alert('Error submitting application. Please try again.');
      }
    } catch (error) {
      console.error('Error applying to collaboration:', error);
      alert('Error submitting application. Please try again.');
    }
  }

  function publishCollaboration(opportunityId) {
    try {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
        alert('Collaboration features not available. Please refresh the page.');
        return;
      }

      const updated = PMTwinData.CollaborationOpportunities.update(opportunityId, { status: 'active' });
      if (updated) {
        // Trigger matching
        if (typeof window.CollaborationMatching !== 'undefined') {
          window.CollaborationMatching.triggerCollaborationMatching(opportunityId);
        }
        alert('Collaboration opportunity published! Matching will begin shortly.');
        // Reload if on my-collaborations page
        if (currentRoute === 'my-collaborations') {
          loadMyCollaborations();
        }
      } else {
        alert('Error publishing opportunity. Please try again.');
      }
    } catch (error) {
      console.error('Error publishing collaboration:', error);
      alert('Error publishing opportunity. Please try again.');
    }
  }

  function viewCollaborationApplication(applicationId) {
    try {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationApplications) {
        alert('Collaboration features not available. Please refresh the page.');
        return;
      }

      const application = PMTwinData.CollaborationApplications.getById(applicationId);
      if (!application) {
        alert('Application not found');
        return;
      }

      const opportunity = PMTwinData.CollaborationOpportunities.getById(application.opportunityId);
      const model = window.CollaborationModels?.getModel(opportunity?.modelType);

      let html = `
        <h2>Application Details</h2>
        <p><strong>Opportunity:</strong> ${model?.name || 'N/A'}</p>
        <p><strong>Status:</strong> ${application.status}</p>
        <p><strong>Submitted:</strong> ${application.submittedAt ? new Date(application.submittedAt).toLocaleString() : 'N/A'}</p>
        ${application.approvedAt ? `<p><strong>Approved:</strong> ${new Date(application.approvedAt).toLocaleString()}</p>` : ''}
        ${application.rejectedAt ? `<p><strong>Rejected:</strong> ${new Date(application.rejectedAt).toLocaleString()}</p>` : ''}
        <button class="btn btn-secondary" onclick="if(window.UserPortal && UserPortal.closeModal) { UserPortal.closeModal(); }">Close</button>
      `;

      showModal('Application Details', html);
    } catch (error) {
      console.error('Error viewing collaboration application:', error);
      alert('Error loading application details. Please try again.');
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.UserPortal = {
    init,
    logout,
    handleLogin,
    viewProject,
    publishProject,
    createProposal,
    viewMatch,
    viewProposal,
    approveProposal,
    rejectProposal,
    handleCreateProject,
    handleSubmitProposal,
    handleUpdateProfile,
    updateProposalForm,
    showModal,
    closeModal,
    viewCollaborationOpportunity,
    applyToCollaboration,
    publishCollaboration,
    viewCollaborationApplication
  };

  // Setup form listener
  function setupFormListener() {
    const form = document.getElementById('userLoginForm');
    if (form) {
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Form submitted, calling handleLogin...');
        UserPortal.handleLogin(e);
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

