/**
 * PMTwin Public Portal Logic
 * Handles routing, discovery engine, wizard, knowledge hub, signup, and login
 */

(function() {
  'use strict';

  // ============================================
  // Routing
  // ============================================
  function initRouting() {
    // Check if user is already authenticated and redirect to appropriate portal
    const isAuth = typeof PMTwinAuth !== 'undefined' && PMTwinAuth.isAuthenticated();
    if (isAuth) {
      const currentUser = typeof PMTwinData !== 'undefined' && PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        if (currentUser.role === 'admin') {
          window.location.href = 'admin-portal.html';
          return;
        } else if (currentUser.role === 'individual' || currentUser.role === 'entity') {
          window.location.href = 'user-portal.html';
          return;
        }
      }
    }

    // Handle hash changes
    window.addEventListener('hashchange', handleRoute);
    // Handle initial load
    handleRoute();

    // Update active nav links
    document.querySelectorAll('.navbar-link[data-route]').forEach(link => {
      link.addEventListener('click', function(e) {
        const route = this.getAttribute('data-route');
        if (route) {
          window.location.hash = route;
          updateActiveNav(route);
        }
      });
    });
  }

  function handleRoute() {
    const hash = window.location.hash.slice(1) || 'discovery';
    const parts = hash.split('/');
    const route = parts[0];
    const subRoute = parts[1];

    // Hide all sections
    document.querySelectorAll('.route-section').forEach(section => {
      section.style.display = 'none';
    });

    // Show appropriate section
    const section = document.getElementById(route);
    if (section) {
      section.style.display = 'block';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Load route content
    switch(route) {
      case 'discovery':
        loadDiscoveryEngine();
        break;
      case 'wizard':
        loadWizard();
        break;
      case 'knowledge':
        loadKnowledgeHub(subRoute);
        break;
      case 'signup':
        loadSignup(subRoute);
        break;
      case 'login':
        // Login form is already in HTML
        break;
      default:
        loadDiscoveryEngine();
    }

    updateActiveNav(route);
  }

  function updateActiveNav(route) {
    document.querySelectorAll('.navbar-link').forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('data-route') === route || 
          (route === 'discovery' && link.getAttribute('href') === '#discovery')) {
        link.classList.add('active');
      }
    });
  }

  // ============================================
  // Discovery Engine
  // ============================================
  function loadDiscoveryEngine() {
    const projects = PMTwinData.Projects.getActive();
    renderProjects(projects);
  }

  function filterProjects() {
    const category = document.getElementById('filterCategory')?.value || '';
    const location = document.getElementById('filterLocation')?.value || '';
    
    let projects = PMTwinData.Projects.getActive();
    
    if (category) {
      projects = projects.filter(p => p.category === category);
    }
    
    if (location) {
      projects = projects.filter(p => p.location?.city === location);
    }
    
    renderProjects(projects);
  }

  function renderProjects(projects) {
    const container = document.getElementById('projectsGrid');
    
    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <div class="empty-state-icon">📋</div>
          <h3 class="empty-state-title">No projects found</h3>
          <p class="empty-state-text">Try adjusting your filters or check back later.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => `
      <div class="card project-card" style="position: relative; overflow: hidden;">
        <div class="card-body">
          <h3 class="card-title">${escapeHtml(project.title)}</h3>
          <p class="card-text">
            <strong>Category:</strong> ${escapeHtml(project.category)}<br>
            <strong>Location:</strong> ${escapeHtml(project.location?.city || 'N/A')}, ${escapeHtml(project.location?.region || '')}<br>
            <strong>Budget:</strong> Sign up to see details<br>
            <strong>Status:</strong> <span class="badge badge-primary">${escapeHtml(project.status)}</span>
          </p>
        </div>
        <div class="project-card-overlay">
          <a href="#signup" class="btn btn-primary" style="color: white;">Sign Up to View Details</a>
        </div>
      </div>
    `).join('');
  }

  // ============================================
  // PMTwin Wizard
  // ============================================
  let wizardStep = 1;
  let wizardData = {};

  function loadWizard() {
    wizardStep = 1;
    wizardData = {};
    renderWizardStep();
  }

  function renderWizardStep() {
    const container = document.getElementById('wizardSteps');
    
    switch(wizardStep) {
      case 1:
        container.innerHTML = `
          <div class="user-type-selection-fullwidth">
            <div class="modern-bg-gradient"></div>
            
            <div class="glassmorphism-container">
              <div class="step-indicator">
                <div class="step-indicator-item active"></div>
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item"></div>
                <span class="step-indicator-label">Step 1 of 4</span>
              </div>
              
              <h1 class="modern-page-title">What are you looking for?</h1>
              <p class="modern-page-subtitle">
                Let us guide you to the right collaboration model for your needs.
              </p>
              
              <div class="wizard-options-grid">
                <button class="wizard-option-card" onclick="PublicPortal.wizardSelect('intent', 'findPartners')">
                  <div class="wizard-option-icon">🤝</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Find Partners</h3>
                    <p class="wizard-option-description">Looking for JV or Consortium partners</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
                
                <button class="wizard-option-card" onclick="PublicPortal.wizardSelect('intent', 'findProjects')">
                  <div class="wizard-option-icon">🏗️</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Find Projects</h3>
                    <p class="wizard-option-description">Looking for project opportunities</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
                
                <button class="wizard-option-card" onclick="PublicPortal.wizardSelect('intent', 'learnMore')">
                  <div class="wizard-option-icon">📚</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Learn More</h3>
                    <p class="wizard-option-description">Want to understand collaboration models</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
                
                <button class="wizard-option-card" onclick="PublicPortal.wizardSelect('intent', 'other')">
                  <div class="wizard-option-icon">💡</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Other</h3>
                    <p class="wizard-option-description">Something else</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
              </div>
            </div>
          </div>
        `;
        break;
      case 2:
        container.innerHTML = `
          <div class="user-type-selection-fullwidth">
            <div class="modern-bg-gradient"></div>
            
            <div class="glassmorphism-container">
              <div class="step-indicator">
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item active"></div>
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item"></div>
                <span class="step-indicator-label">Step 2 of 4</span>
              </div>
              
              <h1 class="modern-page-title">Are you representing a company or yourself?</h1>
              <p class="modern-page-subtitle">
                Help us understand your role to provide the best recommendations.
              </p>
              
              <div class="wizard-options-grid wizard-options-two">
                <button class="wizard-option-card wizard-option-large" onclick="PublicPortal.wizardSelect('entityType', 'entity')">
                  <div class="wizard-option-icon">🏢</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Company/Entity</h3>
                    <p class="wizard-option-description">I represent a business organization</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
                
                <button class="wizard-option-card wizard-option-large" onclick="PublicPortal.wizardSelect('entityType', 'individual')">
                  <div class="wizard-option-icon">👤</div>
                  <div class="wizard-option-content">
                    <h3 class="wizard-option-title">Individual Professional</h3>
                    <p class="wizard-option-description">I'm an independent professional</p>
                  </div>
                  <div class="wizard-option-arrow">→</div>
                </button>
              </div>
              
              <div class="modern-form-footer">
                <button class="modern-back-button" onclick="PublicPortal.wizardBack()">
                  <span>←</span> Back
                </button>
              </div>
            </div>
          </div>
        `;
        break;
      case 3:
        if (wizardData.entityType === 'entity') {
          container.innerHTML = `
            <div class="user-type-selection-fullwidth">
              <div class="modern-bg-gradient"></div>
              
              <div class="glassmorphism-container">
                <div class="step-indicator">
                  <div class="step-indicator-item"></div>
                  <div class="step-indicator-item"></div>
                  <div class="step-indicator-item active"></div>
                  <div class="step-indicator-item"></div>
                  <span class="step-indicator-label">Step 3 of 4</span>
                </div>
                
                <h1 class="modern-page-title">What type of collaboration interests you?</h1>
                <p class="modern-page-subtitle">
                  Choose the collaboration model that best fits your needs.
                </p>
                
                <div class="wizard-options-list">
                  <button class="wizard-option-card wizard-option-horizontal" onclick="PublicPortal.wizardSelect('collaboration', 'jv')">
                    <div class="wizard-option-icon">🤝</div>
                    <div class="wizard-option-content">
                      <h3 class="wizard-option-title">Joint Venture (JV)</h3>
                      <p class="wizard-option-description">Form a new entity with partners for a specific project</p>
                    </div>
                    <div class="wizard-option-arrow">→</div>
                  </button>
                  
                  <button class="wizard-option-card wizard-option-horizontal" onclick="PublicPortal.wizardSelect('collaboration', 'consortium')">
                    <div class="wizard-option-icon">👥</div>
                    <div class="wizard-option-content">
                      <h3 class="wizard-option-title">Consortium</h3>
                      <p class="wizard-option-description">Collaborate with multiple partners without forming a new entity</p>
                    </div>
                    <div class="wizard-option-arrow">→</div>
                  </button>
                  
                  <button class="wizard-option-card wizard-option-horizontal" onclick="PublicPortal.wizardSelect('collaboration', 'serviceProvider')">
                    <div class="wizard-option-icon">🔧</div>
                    <div class="wizard-option-content">
                      <h3 class="wizard-option-title">Service Provider</h3>
                      <p class="wizard-option-description">Provide services to project owners</p>
                    </div>
                    <div class="wizard-option-arrow">→</div>
                  </button>
                  
                  <button class="wizard-option-card wizard-option-horizontal" onclick="PublicPortal.wizardSelect('collaboration', 'barter')">
                    <div class="wizard-option-icon">🔄</div>
                    <div class="wizard-option-content">
                      <h3 class="wizard-option-title">Barter Exchange</h3>
                      <p class="wizard-option-description">Exchange services instead of cash payments</p>
                    </div>
                    <div class="wizard-option-arrow">→</div>
                  </button>
                </div>
                
                <div class="modern-form-footer">
                  <button class="modern-back-button" onclick="PublicPortal.wizardBack()">
                    <span>←</span> Back
                  </button>
                </div>
              </div>
            </div>
          `;
        } else {
          // Individual - go to recommendation
          wizardStep = 4;
          renderWizardStep();
        }
        break;
      case 4:
        container.innerHTML = `
          <div class="user-type-selection-fullwidth">
            <div class="modern-bg-gradient"></div>
            
            <div class="glassmorphism-container">
              <div class="step-indicator">
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item"></div>
                <div class="step-indicator-item active"></div>
                <span class="step-indicator-label">Step 4 of 4</span>
              </div>
              
              <div class="wizard-recommendation">
                <div class="wizard-recommendation-icon">✨</div>
                <h1 class="modern-page-title">Our Recommendation</h1>
                <p class="modern-page-subtitle">
                  Based on your selections, here's what we recommend:
                </p>
                
                <div class="wizard-recommendation-card">
                  <div class="wizard-recommendation-content">
                    ${getWizardRecommendation()}
                  </div>
                </div>
                
                <div style="margin-top: var(--spacing-8); text-align: center;">
                  <a href="#signup/${wizardData.entityType || 'individual'}" class="modern-submit-button" style="text-decoration: none; display: inline-flex; max-width: 400px;">
                    <span>Start Registration</span>
                    <span class="button-arrow">→</span>
                  </a>
                </div>
                
                <div class="modern-form-footer">
                  <button class="modern-back-button" onclick="PublicPortal.wizardBack()">
                    <span>←</span> Back
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
        break;
    }
  }

  function wizardSelect(key, value) {
    wizardData[key] = value;
    
    if (wizardStep === 1 && value === 'learnMore') {
      window.location.hash = 'knowledge';
      return;
    }
    
    if (wizardStep === 2 && value === 'individual') {
      wizardStep = 4;
    } else {
      wizardStep++;
    }
    
    renderWizardStep();
  }

  function wizardBack() {
    if (wizardStep > 1) {
      wizardStep--;
      renderWizardStep();
    }
  }

  function getWizardRecommendation() {
    const entityType = wizardData.entityType || 'individual';
    const collaboration = wizardData.collaboration || '';
    
    if (entityType === 'individual') {
      return 'As an individual professional, you should register as an Individual. You\'ll have access to task-based opportunities, skill-matched projects, and can build your reputation through endorsements.';
    }
    
    if (collaboration === 'jv') {
      return 'Based on your interest in Joint Ventures, you should register as an Entity. You\'ll be able to create mega-projects, find JV partners through our matching algorithm, and manage multiple collaboration opportunities.';
    }
    
    if (collaboration === 'consortium') {
      return 'Based on your interest in Consortia, you should register as an Entity. You can create projects and invite multiple partners to form consortia, sharing resources and expertise.';
    }
    
    if (collaboration === 'barter') {
      return 'Based on your interest in Barter Exchange, you should register as an Entity. Our platform supports service-for-service transactions, allowing you to exchange services without cash payments.';
    }
    
    return 'You should register as an Entity to access all collaboration features including project creation, partner matching, and flexible engagement models.';
  }

  // ============================================
  // Knowledge Hub
  // ============================================
  function loadKnowledgeHub(subRoute) {
    const container = document.getElementById('knowledgeContent');
    
    if (subRoute === 'spv') {
      container.innerHTML = `
        <article class="card">
          <div class="card-body">
            <h2>What is an SPV?</h2>
            <p>A Special Purpose Vehicle (SPV) is a legal entity created for a specific project or business purpose. In construction, SPVs are commonly used for:</p>
            <ul>
              <li><strong>Risk Isolation:</strong> Separating project risks from the parent company</li>
              <li><strong>Joint Ventures:</strong> Creating a new entity for multiple partners to collaborate</li>
              <li><strong>Project Financing:</strong> Isolating project assets and liabilities for financing purposes</li>
              <li><strong>Tax Optimization:</strong> Structuring projects for tax efficiency</li>
            </ul>
            <h3>Benefits of SPVs in Construction</h3>
            <p>SPVs provide several advantages in construction projects:</p>
            <ul>
              <li>Limited liability for parent companies</li>
              <li>Clear ownership structure for multiple partners</li>
              <li>Easier project-specific financing</li>
              <li>Simplified project accounting and reporting</li>
            </ul>
            <p><a href="#knowledge">← Back to Knowledge Hub</a></p>
          </div>
        </article>
      `;
    } else if (subRoute === 'barter') {
      container.innerHTML = `
        <article class="card">
          <div class="card-body">
            <h2>Barter Guide for Construction</h2>
            <p>Barter exchanges allow construction companies to trade services instead of using cash. PMTwin facilitates these exchanges through our innovative platform.</p>
            <h3>How Barter Works on PMTwin</h3>
            <ol>
              <li><strong>Identify Needs:</strong> Define what services you need for your project</li>
              <li><strong>Offer Services:</strong> Specify what services you can provide in exchange</li>
              <li><strong>Value Matching:</strong> Our system helps match equivalent value exchanges</li>
              <li><strong>Agreement:</strong> Both parties agree to the barter terms</li>
              <li><strong>Execution:</strong> Services are exchanged according to the agreement</li>
            </ol>
            <h3>Benefits of Barter</h3>
            <ul>
              <li>Preserve cash flow for other expenses</li>
              <li>Utilize excess capacity or resources</li>
              <li>Build relationships with other companies</li>
              <li>Access services you might not otherwise afford</li>
            </ul>
            <h3>Example</h3>
            <p>A construction company needs engineering services worth 500,000 SAR. Instead of paying cash, they offer construction services of equivalent value. Both parties benefit without cash exchange.</p>
            <p><a href="#knowledge">← Back to Knowledge Hub</a></p>
          </div>
        </article>
      `;
    } else {
      container.innerHTML = `
        <div class="grid grid-cols-1 grid-cols-md-2 gap-6">
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">What is an SPV?</h3>
              <p class="card-text">Learn about Special Purpose Vehicles and how they're used in construction projects for risk management and project structuring.</p>
              <a href="#knowledge/spv" class="btn btn-outline">Read Article</a>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h3 class="card-title">Barter Guide for Construction</h3>
              <p class="card-text">Discover how barter exchanges work in the construction industry and how PMTwin facilitates service-for-service transactions.</p>
              <a href="#knowledge/barter" class="btn btn-outline">Read Guide</a>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top: var(--spacing-6);">
          <div class="card-body">
            <h3>Frequently Asked Questions</h3>
            <div style="margin-top: var(--spacing-4);">
              <h4>How does the matching algorithm work?</h4>
              <p>Our algorithm matches projects with providers based on service categories, required skills, experience level, and location. Providers with a match score above 80% receive automatic notifications.</p>
              
              <h4>What credentials do I need to register?</h4>
              <p>Individuals need professional licenses and CVs. Entities need Commercial Registration (CR), VAT certificates, and company profile documents.</p>
              
              <h4>How long does approval take?</h4>
              <p>Account approval typically takes 2-3 business days after credential submission. Our admin team verifies all documents against Saudi standards.</p>
              
              <h4>Can I submit both cash and barter proposals?</h4>
              <p>Yes! You can submit either type of proposal, or both, depending on what the project owner accepts.</p>
            </div>
          </div>
        </div>
      `;
    }
  }

  // ============================================
  // Signup (Unified Onboarding Entry Point)
  // ============================================
  let signupStep = 1;
  let signupData = {};

  function loadSignup(subRoute) {
    signupStep = 1;
    signupData = { userType: subRoute || null };
    
    // Map subRoute to userType if provided
    if (subRoute === 'individual') {
      signupData.userType = 'individual';
      signupData.role = 'individual';
      signupStep = 2;
    } else if (subRoute === 'entity' || subRoute === 'company') {
      signupData.userType = 'company';
      signupData.role = 'entity';
      signupStep = 2;
    } else if (subRoute === 'consultant') {
      signupData.userType = 'consultant';
      signupData.role = 'individual';
      signupStep = 2;
    }
    
    renderSignupStep();
  }

  function renderSignupStep() {
    const container = document.getElementById('signupContent');
    
    if (signupStep === 1) {
      // Step 1: Unified Entry Point - User Type Selection (Mandatory) - Full-Width Modern Design
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <!-- Modern Background with Gradient -->
          <div class="modern-bg-gradient"></div>
          
          <!-- Glassmorphism Main Container -->
          <div class="glassmorphism-container">
            <!-- Step Indicator -->
            <div class="step-indicator">
              <div class="step-indicator-item active"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <span class="step-indicator-label">Step 1 of 6</span>
            </div>
            
            <!-- Main Heading -->
            <h1 class="modern-page-title">
              Select Your User Type
            </h1>
            <p class="modern-page-subtitle">
              Choose the account type that best describes you. <strong>This cannot be changed after registration.</strong><br>
              <small style="opacity: 0.8;">You'll complete verification, identity information, and profile setup in the following steps.</small>
            </p>
            
            <!-- User Type Cards - Full Width Grid -->
            <div class="user-type-cards-grid">
              <!-- Company Card -->
              <div class="user-type-card company" onclick="PublicPortal.signupSelectUserType('company')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') PublicPortal.signupSelectUserType('company')">
                <div class="card-body" style="text-align: center; display: flex; flex-direction: column; height: 100%;">
                  <div class="user-type-icon-container company">
                    <div class="user-type-icon">🏢</div>
                  </div>
                  <h3 class="user-type-title">Company</h3>
                  <p class="user-type-description">For companies, contractors, and suppliers</p>
                  <ul class="user-type-features">
                    <li>Create mega-projects</li>
                    <li>Find partners (JV/Consortium)</li>
                    <li>Bulk purchasing</li>
                    <li>Document upload (CR, VAT, Certifications)</li>
                    <li>Full platform access after approval</li>
                  </ul>
                  <button class="btn user-type-button btn-block" style="margin-top: auto;">Select Company</button>
                </div>
              </div>
              
              <!-- Consultant Card -->
              <div class="user-type-card consultant" onclick="PublicPortal.signupSelectUserType('consultant')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') PublicPortal.signupSelectUserType('consultant')">
                <div class="card-body" style="text-align: center; display: flex; flex-direction: column; height: 100%;">
                  <div class="user-type-icon-container consultant">
                    <div class="user-type-icon">👔</div>
                  </div>
                  <h3 class="user-type-title">Consultant</h3>
                  <p class="user-type-description">For professional consultants and experts</p>
                  <ul class="user-type-features">
                    <li>Apply to projects</li>
                    <li>Skill-matched opportunities</li>
                    <li>Profile endorsements</li>
                    <li>Document upload (License, CV, Certifications)</li>
                    <li>Full platform access after approval</li>
                  </ul>
                  <button class="btn user-type-button btn-block" style="margin-top: auto;">Select Consultant</button>
                </div>
              </div>
              
              <!-- Individual Card -->
              <div class="user-type-card individual" onclick="PublicPortal.signupSelectUserType('individual')" role="button" tabindex="0" onkeypress="if(event.key==='Enter') PublicPortal.signupSelectUserType('individual')">
                <div class="card-body" style="text-align: center; display: flex; flex-direction: column; height: 100%;">
                  <div class="user-type-icon-container individual">
                    <div class="user-type-icon">👤</div>
                  </div>
                  <h3 class="user-type-title">Individual</h3>
                  <p class="user-type-description">For individuals and professionals</p>
                  <ul class="user-type-features">
                    <li>Browse opportunities</li>
                    <li>Apply to projects</li>
                    <li>Basic profile setup</li>
                    <li>Document upload (Certifications, Resume)</li>
                    <li>Full platform access after approval</li>
                  </ul>
                  <button class="btn user-type-button btn-block" style="margin-top: auto;">Select Individual</button>
                </div>
              </div>
            </div>
            
            <!-- Approval Help & Tips Section -->
            <div class="onboarding-info-section" style="margin-top: var(--spacing-8); padding: var(--spacing-6); background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(139, 92, 246, 0.2)); backdrop-filter: blur(10px); border-radius: var(--radius-lg); border: 1px solid rgba(255, 255, 255, 0.3);">
              <div style="text-align: center; margin-bottom: var(--spacing-6);">
                <div style="font-size: 3rem; margin-bottom: var(--spacing-3);">💡</div>
                <h3 style="color: var(--color-white); margin-bottom: var(--spacing-2); font-size: 1.75rem;">Approval Help & Tips</h3>
                <p style="color: var(--color-white); opacity: 0.9; font-size: 1rem;">Everything you need to know to get approved quickly</p>
              </div>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-5); margin-bottom: var(--spacing-6);">
                <!-- Required Documents -->
                <div style="background: rgba(255, 255, 255, 0.1); padding: var(--spacing-4); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.2);">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📋</div>
                  <h4 style="color: var(--color-white); margin-bottom: var(--spacing-3); font-size: 1.1rem;">Required Documents</h4>
                  <div style="font-size: 0.9rem; opacity: 0.9; line-height: 1.6;">
                    <p style="color: var(--color-white); margin-bottom: var(--spacing-2);"><strong>Company:</strong></p>
                    <ul style="text-align: left; margin: 0; padding-left: var(--spacing-4); color: var(--color-white);">
                      <li>Commercial Registration (CR)</li>
                      <li>VAT Certificate</li>
                      <li>Company Profile Document</li>
                      <li>Certifications (if applicable)</li>
                    </ul>
                    <p style="color: var(--color-white); margin-top: var(--spacing-3); margin-bottom: var(--spacing-2);"><strong>Consultant:</strong></p>
                    <ul style="text-align: left; margin: 0; padding-left: var(--spacing-4); color: var(--color-white);">
                      <li>Professional License</li>
                      <li>CV/Resume</li>
                      <li>Certifications</li>
                    </ul>
                    <p style="color: var(--color-white); margin-top: var(--spacing-3); margin-bottom: var(--spacing-2);"><strong>Individual:</strong></p>
                    <ul style="text-align: left; margin: 0; padding-left: var(--spacing-4); color: var(--color-white);">
                      <li>Certifications</li>
                      <li>Resume/CV (recommended)</li>
                    </ul>
                  </div>
                </div>
                
                <!-- Tips for Faster Approval -->
                <div style="background: rgba(255, 255, 255, 0.1); padding: var(--spacing-4); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.2);">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">⚡</div>
                  <h4 style="color: var(--color-white); margin-bottom: var(--spacing-3); font-size: 1.1rem;">Tips for Faster Approval</h4>
                  <ul style="text-align: left; margin: 0; padding-left: var(--spacing-4); color: var(--color-white); font-size: 0.9rem; opacity: 0.9; line-height: 1.8;">
                    <li>Complete all profile sections thoroughly</li>
                    <li>Upload clear, readable documents (PDF preferred)</li>
                    <li>Ensure all documents are valid and up-to-date</li>
                    <li>Provide accurate identity information</li>
                    <li>Double-check all information before submission</li>
                    <li>Include relevant certifications and credentials</li>
                  </ul>
                </div>
                
                <!-- What to Expect -->
                <div style="background: rgba(255, 255, 255, 0.1); padding: var(--spacing-4); border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.2);">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">⏱️</div>
                  <h4 style="color: var(--color-white); margin-bottom: var(--spacing-3); font-size: 1.1rem;">Review Timeline</h4>
                  <div style="font-size: 0.9rem; opacity: 0.9; line-height: 1.8; color: var(--color-white);">
                    <p style="margin-bottom: var(--spacing-3);">
                      <strong>Typical Review Time:</strong><br>
                      24-48 hours after submission
                    </p>
                    <p style="margin-bottom: var(--spacing-3);">
                      <strong>What Happens:</strong><br>
                      Our admin team reviews your profile, documents, and credentials to ensure compliance and authenticity.
                    </p>
                    <p style="margin-bottom: var(--spacing-3);">
                      <strong>After Approval:</strong><br>
                      You'll receive an email notification and can immediately access all platform features.
                    </p>
                    <p>
                      <strong>If More Info Needed:</strong><br>
                      We'll contact you via email with specific requests.
                    </p>
                  </div>
                </div>
              </div>
              
              <!-- Support Information -->
              <div style="margin-top: var(--spacing-6); padding-top: var(--spacing-4); border-top: 1px solid rgba(255, 255, 255, 0.2); text-align: center;">
                <p style="color: var(--color-white); opacity: 0.9; font-size: 0.95rem; margin-bottom: var(--spacing-2);">
                  <strong>Need Help?</strong> If you have questions about the approval process or required documents, please contact our support team.
                </p>
                <p style="color: var(--color-white); opacity: 0.8; font-size: 0.85rem;">
                  We're here to help you get approved and start using PMTwin!
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add full-width class to parent section
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    } else if (signupStep === 2) {
      // Step 2: Basic Information (Email & Password) - Full-Width Modern Design
      const userType = signupData.userType;
      const totalSteps = (userType === 'company' || userType === 'consultant') ? 5 : 4;
      
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="step-indicator">
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item active"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              ${totalSteps === 5 ? '<div class="step-indicator-item"></div>' : ''}
              <span class="step-indicator-label">Step 2 of ${totalSteps}</span>
            </div>
            
            <h1 class="modern-page-title">Create Your Account</h1>
            <p class="modern-page-subtitle">
              Enter your email and password. We'll send you a verification code to get started.
            </p>
            
            <div class="modern-form-container">
              <form id="signupForm" onsubmit="return PublicPortal.handleSignup(event)">
                <div class="modern-form-group">
                  <label for="signupEmail" class="modern-form-label">
                    <span class="label-text">Email Address</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="modern-input-wrapper">
                    <input type="email" id="signupEmail" class="modern-form-input" required placeholder="your.email@example.com">
                    <span class="input-icon">✉️</span>
                  </div>
                  <div class="modern-form-help">We'll send a verification code to this email</div>
                </div>
                
                <div class="modern-form-group">
                  <label for="signupMobile" class="modern-form-label">
                    <span class="label-text">Mobile Number</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="modern-input-wrapper">
                    <input type="tel" id="signupMobile" class="modern-form-input" required placeholder="+966501234567">
                    <span class="input-icon">📱</span>
                  </div>
                  <div class="modern-form-help">We'll send a verification code to this mobile number</div>
                </div>
                
                <div class="modern-form-group">
                  <label for="signupPassword" class="modern-form-label">
                    <span class="label-text">Password</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="modern-input-wrapper">
                    <input type="password" id="signupPassword" class="modern-form-input" required placeholder="Create a strong password">
                    <span class="input-icon">🔒</span>
                  </div>
                  <div class="modern-form-help">Must be at least 8 characters with uppercase, lowercase, and number</div>
                  <div id="passwordStrength" class="password-strength-indicator"></div>
                </div>
                
                <div class="modern-form-group">
                  <label for="signupConfirmPassword" class="modern-form-label">
                    <span class="label-text">Confirm Password</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="modern-input-wrapper">
                    <input type="password" id="signupConfirmPassword" class="modern-form-input" required placeholder="Confirm your password">
                    <span class="input-icon">🔒</span>
                  </div>
                </div>
                
                <div class="modern-form-group">
                  <div class="modern-checkbox-wrapper">
                    <input type="checkbox" id="signupTerms" class="modern-checkbox" required>
                    <label for="signupTerms" class="modern-checkbox-label">
                      I agree to the <a href="#" style="color: var(--color-white); text-decoration: underline;">Terms & Conditions</a> and <a href="#" style="color: var(--color-white); text-decoration: underline;">Privacy Policy</a>
                    </label>
                  </div>
                </div>
                
                <div id="signupError" class="modern-alert modern-alert-error" style="display: none;"></div>
                
                <button type="submit" class="modern-submit-button">
                  <span>Continue</span>
                  <span class="button-arrow">→</span>
                </button>
              </form>
              
              <div class="modern-form-footer">
                <button class="modern-back-button" onclick="PublicPortal.signupBack()">
                  <span>←</span> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Add password strength indicator
      const passwordInput = document.getElementById('signupPassword');
      if (passwordInput) {
        passwordInput.addEventListener('input', function() {
          updatePasswordStrength(this.value);
        });
      }
      
      // Ensure full-width class is applied
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    } else if (signupStep === 3) {
      // Step 3: OTP Verification - Full-Width Modern Design
      // Check which verification step we're on
      const emailVerified = signupData.emailVerified || false;
      const mobileVerified = signupData.mobileVerified || false;
      const verifyingEmail = !emailVerified;
      const verifyingMobile = emailVerified && !mobileVerified;
      
      const userType = signupData.userType;
      const totalSteps = (userType === 'company' || userType === 'consultant') ? 6 : 5;
      
      const verificationType = verifyingEmail ? 'email' : 'mobile';
      const contactInfo = verifyingEmail ? signupData.email : signupData.mobile;
      const otpCode = verifyingEmail ? signupData.emailOTP : signupData.mobileOTP;
      
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="step-indicator">
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item active"></div>
              <div class="step-indicator-item"></div>
              ${totalSteps === 6 ? '<div class="step-indicator-item"></div>' : ''}
              ${totalSteps === 6 ? '<div class="step-indicator-item"></div>' : ''}
              <span class="step-indicator-label">Step 3${emailVerified ? 'b' : 'a'} of ${totalSteps}</span>
            </div>
            
            <h1 class="modern-page-title">Verify Your ${verifyingEmail ? 'Email' : 'Mobile Number'}</h1>
            <p class="modern-page-subtitle">
              We've sent a 6-digit code to <strong style="color: var(--color-white);">${contactInfo || (verifyingEmail ? 'your email' : 'your mobile')}</strong>. 
              Please check ${verifyingEmail ? 'your email' : 'your messages'} and enter the code below.
            </p>
            
            ${emailVerified ? `
              <div class="modern-alert modern-alert-success" style="margin-bottom: var(--spacing-4);">
                ✓ Email verified successfully
              </div>
            ` : ''}
            
            <div class="modern-form-container">
              <form id="otpForm" onsubmit="return PublicPortal.handleOTPVerification(event, '${verificationType}')">
                <div class="modern-form-group">
                  <label class="modern-form-label">
                    <span class="label-text">Verification Code</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="otp-input-container">
                    <input type="text" id="otpCode" class="otp-input" maxlength="6" pattern="[0-9]{6}" required 
                           placeholder="000000" autocomplete="off">
                  </div>
                  <div class="modern-form-help">Enter the 6-digit code from your ${verifyingEmail ? 'email' : 'mobile'}</div>
                  ${otpCode ? `
                    <div class="modern-info-box" style="margin-top: var(--spacing-2); background: rgba(255, 255, 255, 0.1); padding: var(--spacing-2); border-radius: var(--radius-sm);">
                      <small><strong>POC:</strong> Your ${verificationType} OTP is: <code style="background: rgba(0,0,0,0.3); padding: 2px 6px; border-radius: 4px;">${otpCode}</code></small>
                    </div>
                  ` : ''}
                  <div id="otpTimer" class="otp-timer"></div>
                </div>
                
                <div id="otpError" class="modern-alert modern-alert-error" style="display: none;"></div>
                <div id="otpSuccess" class="modern-alert modern-alert-success" style="display: none;"></div>
                
                <button type="submit" class="modern-submit-button">
                  <span>Verify ${verifyingEmail ? 'Email' : 'Mobile'}</span>
                  <span class="button-arrow">→</span>
                </button>
              </form>
              
              <div class="modern-form-footer">
                <button class="modern-link-button" onclick="PublicPortal.resendOTP('${verificationType}')">
                  Resend Code
                </button>
                <span style="color: rgba(255, 255, 255, 0.5); margin: 0 var(--spacing-2);">|</span>
                <button class="modern-back-button" onclick="PublicPortal.signupBack()">
                  <span>←</span> Back
                </button>
              </div>
              
              <div class="modern-info-box">
                <small>
                  <strong>POC Note:</strong> Check the browser console (F12) for the OTP code during testing.
                </small>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Setup OTP input with auto-focus and digit separation
      setTimeout(() => {
        const otpInput = document.getElementById('otpCode');
        if (otpInput) {
          otpInput.focus();
          otpInput.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
            if (this.value.length === 6) {
              // Auto-submit when 6 digits entered
              const form = document.getElementById('otpForm');
              if (form) {
                setTimeout(() => form.requestSubmit(), 300);
              }
            }
          });
        }
        
        // Start OTP timer
        startOTPTimer();
      }, 100);
      
      // Ensure full-width class is applied
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    } else if (signupStep === 4) {
      // Step 4: Identity & Compliance Data Collection - Full-Width Modern Design
      const userType = signupData.userType;
      const isCompany = userType === 'company';
      const isConsultant = userType === 'consultant';
      const isIndividual = userType === 'individual';
      const totalSteps = (isCompany || isConsultant) ? 6 : 5;
      
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="step-indicator">
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item active"></div>
              ${totalSteps === 6 ? '<div class="step-indicator-item"></div>' : ''}
              ${totalSteps === 6 ? '<div class="step-indicator-item"></div>' : ''}
              <span class="step-indicator-label">Step 4 of ${totalSteps}</span>
            </div>
            
            <h1 class="modern-page-title">Identity & Compliance Information</h1>
            <p class="modern-page-subtitle">
              ${isCompany ? 'Please provide your company\'s legal and compliance information.' : isConsultant ? 'Please provide your professional identity information.' : 'Please provide your identity information.'}
            </p>
            
            <div class="modern-form-container">
              <form id="identityForm" onsubmit="return PublicPortal.handleIdentity(event)">
                ${isCompany ? `
                  <div class="modern-form-group">
                    <label for="legalEntityName" class="modern-form-label">
                      <span class="label-text">Legal Entity Name</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="legalEntityName" class="modern-form-input" required 
                             placeholder="Enter legal entity name as per registration">
                      <span class="input-icon">🏢</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label for="crNumber" class="modern-form-label">
                      <span class="label-text">Commercial Registration (CR) Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="crNumber" class="modern-form-input" required 
                             placeholder="Enter CR number">
                      <span class="input-icon">📋</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label for="taxNumber" class="modern-form-label">
                      <span class="label-text">Tax Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="taxNumber" class="modern-form-input" required 
                             placeholder="Enter tax/VAT number">
                      <span class="input-icon">🧾</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label for="authorizedRepNID" class="modern-form-label">
                      <span class="label-text">National ID of Authorized Representative</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="authorizedRepNID" class="modern-form-input" required 
                             placeholder="Enter National ID">
                      <span class="input-icon">🆔</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label for="scaClassification" class="modern-form-label">
                      <span class="label-text">SCA Classification</span>
                      <span class="label-optional">(Optional)</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="scaClassification" class="modern-form-input" 
                             placeholder="Enter SCA classification if applicable">
                      <span class="input-icon">📊</span>
                    </div>
                  </div>
                ` : `
                  <div class="modern-form-group">
                    <label for="fullLegalName" class="modern-form-label">
                      <span class="label-text">Full Legal Name</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="fullLegalName" class="modern-form-input" required 
                             placeholder="Enter your full legal name">
                      <span class="input-icon">👤</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">Identification Type</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-radio-group">
                      <label class="modern-radio-label">
                        <input type="radio" name="idType" value="nationalId" checked onchange="PublicPortal.toggleIdType('nationalId')">
                        <span>National ID</span>
                      </label>
                      <label class="modern-radio-label">
                        <input type="radio" name="idType" value="passport" onchange="PublicPortal.toggleIdType('passport')">
                        <span>Passport</span>
                      </label>
                    </div>
                  </div>
                  
                  <div class="modern-form-group" id="nationalIdGroup">
                    <label for="nationalId" class="modern-form-label">
                      <span class="label-text">National ID Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="nationalId" class="modern-form-input" required 
                             placeholder="Enter National ID number">
                      <span class="input-icon">🆔</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group" id="passportGroup" style="display: none;">
                    <label for="passportNumber" class="modern-form-label">
                      <span class="label-text">Passport Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="passportNumber" class="modern-form-input" 
                             placeholder="Enter passport number">
                      <span class="input-icon">📘</span>
                    </div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label for="contactInfo" class="modern-form-label">
                      <span class="label-text">Contact Information</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="contactInfo" class="modern-form-input" required 
                             placeholder="Phone number or additional contact">
                      <span class="input-icon">📞</span>
                    </div>
                  </div>
                `}
                
                <div id="identityError" class="modern-alert modern-alert-error" style="display: none;"></div>
                
                <button type="submit" class="modern-submit-button">
                  <span>Continue</span>
                  <span class="button-arrow">→</span>
                </button>
              </form>
              
              <div class="modern-form-footer">
                <button class="modern-back-button" onclick="PublicPortal.signupBack()">
                  <span>←</span> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Ensure full-width class is applied
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    } else if (signupStep === 5) {
      // Step 5: Profile Information - Full-Width Modern Design
      const userType = signupData.userType;
      const isCompany = userType === 'company';
      const isConsultant = userType === 'consultant';
      const isIndividual = userType === 'individual';
      
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="step-indicator">
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item active"></div>
              ${(isCompany || isConsultant) ? '<div class="step-indicator-item"></div>' : ''}
              <span class="step-indicator-label">Step 5 of 6</span>
            </div>
            
            <h1 class="modern-page-title">Complete Your Profile</h1>
            <p class="modern-page-subtitle">
              ${isIndividual ? 'Tell us a bit about yourself to personalize your experience.' : 'Provide your basic information to complete your account setup.'}
            </p>
            
            <div class="modern-form-container">
              <form id="profileForm" onsubmit="return PublicPortal.handleProfile(event)">
                <div class="modern-form-group">
                  <label for="signupName" class="modern-form-label">
                    <span class="label-text">${isCompany ? 'Company Name' : 'Full Name'}</span>
                    <span class="label-required">*</span>
                  </label>
                  <div class="modern-input-wrapper">
                    <input type="text" id="signupName" class="modern-form-input" required 
                           placeholder="${isCompany ? 'Enter your company name' : 'Enter your full name'}">
                    <span class="input-icon">${isCompany ? '🏢' : '👤'}</span>
                  </div>
                </div>
                
                ${isCompany ? `
                  <div class="modern-form-group">
                    <label for="signupPhone" class="modern-form-label">
                      <span class="label-text">Phone Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="tel" id="signupPhone" class="modern-form-input" required placeholder="+966 5X XXX XXXX">
                      <span class="input-icon">📞</span>
                    </div>
                  </div>
                  <div class="modern-form-group">
                    <label for="signupWebsite" class="modern-form-label">
                      <span class="label-text">Website</span>
                      <span class="label-optional">(Optional)</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="url" id="signupWebsite" class="modern-form-input" placeholder="https://www.example.com">
                      <span class="input-icon">🌐</span>
                    </div>
                  </div>
                ` : isConsultant ? `
                  <div class="modern-form-group">
                    <label for="signupPhone" class="modern-form-label">
                      <span class="label-text">Phone Number</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="tel" id="signupPhone" class="modern-form-input" required placeholder="+966 5X XXX XXXX">
                      <span class="input-icon">📞</span>
                    </div>
                  </div>
                  <div class="modern-form-group">
                    <label for="signupTitle" class="modern-form-label">
                      <span class="label-text">Professional Title</span>
                      <span class="label-optional">(Optional)</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="text" id="signupTitle" class="modern-form-input" placeholder="e.g., Senior Engineer, Project Manager">
                      <span class="input-icon">💼</span>
                    </div>
                  </div>
                ` : `
                  <div class="modern-form-group">
                    <label for="signupPhone" class="modern-form-label">
                      <span class="label-text">Phone Number</span>
                      <span class="label-optional">(Optional)</span>
                    </label>
                    <div class="modern-input-wrapper">
                      <input type="tel" id="signupPhone" class="modern-form-input" placeholder="+966 5X XXX XXXX">
                      <span class="input-icon">📞</span>
                    </div>
                  </div>
                `}
                
                <div id="profileError" class="modern-alert modern-alert-error" style="display: none;"></div>
                
                <button type="submit" class="modern-submit-button">
                  <span>Continue</span>
                  <span class="button-arrow">→</span>
                </button>
              </form>
              
              <div class="modern-form-footer">
                <button class="modern-back-button" onclick="PublicPortal.signupBack()">
                  <span>←</span> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Ensure full-width class is applied
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    } else if (signupStep === 5) {
      // Step 6: Upload Credentials / Submit for Review - Full-Width Modern Design
      const userType = signupData.userType;
      const isCompany = userType === 'company';
      const isConsultant = userType === 'consultant';
      const isIndividual = userType === 'individual';
      
      // All user types go through this step
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="step-indicator">
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item"></div>
              <div class="step-indicator-item active"></div>
              <span class="step-indicator-label">Step 6 of 6</span>
            </div>
            
            <h1 class="modern-page-title">${isCompany ? 'Upload Credentials' : isConsultant ? 'Upload Credentials' : 'Submit for Review'}</h1>
            <p class="modern-page-subtitle">
              ${isCompany ? 'Upload your company documents for verification. This helps us verify your business credentials.' : isConsultant ? 'Upload your professional credentials for verification. This helps us verify your expertise.' : 'Review your information and submit your profile for admin approval.'}
            </p>
            
            <div class="modern-form-container">
              <form id="credentialsForm" onsubmit="return PublicPortal.handleCredentials(event)">
                ${isCompany ? `
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">Commercial Registration (CR)</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-file-upload">
                      <input type="file" id="crFile" class="modern-file-input" accept=".pdf,.jpg,.jpeg,.png" required>
                      <label for="crFile" class="modern-file-label">
                        <div class="file-upload-icon">📄</div>
                        <div class="file-upload-text">
                          <span class="file-upload-main">Click to upload or drag and drop</span>
                          <span class="file-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    <div id="crPreview" class="file-preview"></div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">VAT Certificate</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-file-upload">
                      <input type="file" id="vatFile" class="modern-file-input" accept=".pdf,.jpg,.jpeg,.png" required>
                      <label for="vatFile" class="modern-file-label">
                        <div class="file-upload-icon">📄</div>
                        <div class="file-upload-text">
                          <span class="file-upload-main">Click to upload or drag and drop</span>
                          <span class="file-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    <div id="vatPreview" class="file-preview"></div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">Company Profile Document</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-file-upload">
                      <input type="file" id="profileFile" class="modern-file-input" accept=".pdf,.jpg,.jpeg,.png" required>
                      <label for="profileFile" class="modern-file-label">
                        <div class="file-upload-icon">📄</div>
                        <div class="file-upload-text">
                          <span class="file-upload-main">Click to upload or drag and drop</span>
                          <span class="file-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    <div id="profilePreview" class="file-preview"></div>
                  </div>
                ` : isConsultant ? `
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">Professional License/Certification</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-file-upload">
                      <input type="file" id="licenseFile" class="modern-file-input" accept=".pdf,.jpg,.jpeg,.png" required>
                      <label for="licenseFile" class="modern-file-label">
                        <div class="file-upload-icon">📜</div>
                        <div class="file-upload-text">
                          <span class="file-upload-main">Click to upload or drag and drop</span>
                          <span class="file-upload-hint">PDF, JPG, PNG (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    <div id="licensePreview" class="file-preview"></div>
                  </div>
                  
                  <div class="modern-form-group">
                    <label class="modern-form-label">
                      <span class="label-text">CV/Resume</span>
                      <span class="label-required">*</span>
                    </label>
                    <div class="modern-file-upload">
                      <input type="file" id="cvFile" class="modern-file-input" accept=".pdf,.doc,.docx" required>
                      <label for="cvFile" class="modern-file-label">
                        <div class="file-upload-icon">📋</div>
                        <div class="file-upload-text">
                          <span class="file-upload-main">Click to upload or drag and drop</span>
                          <span class="file-upload-hint">PDF, DOC, DOCX (Max 5MB)</span>
                        </div>
                      </label>
                    </div>
                    <div id="cvPreview" class="file-preview"></div>
                  </div>
                ` : `
                  <div class="modern-form-group">
                    <p style="color: var(--color-white); opacity: 0.9; margin-bottom: var(--spacing-4);">
                      You can optionally upload supporting documents (resume, certifications, etc.) to strengthen your profile.
                    </p>
                    <div class="modern-form-group">
                      <label class="modern-form-label">
                        <span class="label-text">Supporting Documents (Optional)</span>
                        <span class="label-optional">(Optional)</span>
                      </label>
                      <div class="modern-file-upload">
                        <input type="file" id="supportingDocs" class="modern-file-input" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" multiple>
                        <label for="supportingDocs" class="modern-file-label">
                          <div class="file-upload-icon">📄</div>
                          <div class="file-upload-text">
                            <span class="file-upload-main">Click to upload or drag and drop</span>
                            <span class="file-upload-hint">PDF, Images, DOC (Max 5MB each)</span>
                          </div>
                        </label>
                      </div>
                    </div>
                  </div>
                `}
                
                <div id="credentialsError" class="modern-alert modern-alert-error" style="display: none;"></div>
                
                <button type="submit" class="modern-submit-button">
                  <span>${isCompany || isConsultant ? 'Submit Registration' : 'Submit for Review'}</span>
                  <span class="button-arrow">→</span>
                </button>
              </form>
              
              <div class="modern-form-footer">
                <button class="modern-back-button" onclick="PublicPortal.signupBack()">
                  <span>←</span> Back
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
        setupFileUploads();
        
        // Ensure full-width class is applied
        const signupSection = document.getElementById('signup');
        if (signupSection) {
          signupSection.classList.add('signup-section');
        }
    } else if (signupStep === 7) {
      // Step 7: Success/Completion - Full-Width Modern Design
      const userType = signupData.userType;
      
      container.innerHTML = `
        <div class="user-type-selection-fullwidth">
          <div class="modern-bg-gradient"></div>
          
          <div class="glassmorphism-container">
            <div class="success-content">
              <div class="success-icon">✅</div>
              <h1 class="modern-page-title">Registration Successful!</h1>
              <p class="modern-page-subtitle">
                Your account has been created and your profile has been submitted for review.<br>
                Our admin team will review your information and you'll receive a notification once your account is approved (typically 24-48 hours).
              </p>
              
              <div class="success-info-box">
                <h3 style="color: var(--color-white); margin-bottom: var(--spacing-3); font-size: var(--font-size-xl);">What's Next?</h3>
                <ul class="success-next-steps">
                  <li>Check your email for verification and status updates</li>
                  <li>You'll receive a notification when your account is approved</li>
                  <li>Once approved, you can log in and access the full platform</li>
                  <li>If additional information is needed, you'll be notified</li>
                </ul>
              </div>
              
              <a href="#login" class="modern-submit-button" style="text-decoration: none; display: inline-flex; max-width: 300px; margin-top: var(--spacing-8);">
                <span>Go to Login</span>
                <span class="button-arrow">→</span>
              </a>
            </div>
          </div>
        </div>
      `;
      
      // Ensure full-width class is applied
      const signupSection = document.getElementById('signup');
      if (signupSection) {
        signupSection.classList.add('signup-section');
      }
    }
  }

  function signupSelectUserType(userType) {
    signupData.userType = userType;
    // Map userType to role
    if (userType === 'company') {
      signupData.role = 'entity';
    } else {
      signupData.role = 'individual'; // Both consultant and individual use 'individual' role
    }
    signupStep = 2;
    renderSignupStep();
  }

  // Keep backward compatibility
  function signupSelectRole(role) {
    if (role === 'entity') {
      signupSelectUserType('company');
    } else {
      signupSelectUserType('consultant');
    }
  }

  function signupBack() {
    if (signupStep > 1) {
      signupStep--;
      renderSignupStep();
    }
  }

  function handleSignup(event) {
    event.preventDefault();
    
    const email = document.getElementById('signupEmail').value;
    const mobile = document.getElementById('signupMobile').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    // Validation
    if (password !== confirmPassword) {
      showError('signupError', 'Passwords do not match');
      return false;
    }
    
    if (!PMTwinAuth.validatePassword(password)) {
      showError('signupError', 'Password must be at least 8 characters with uppercase, lowercase, and number');
      return false;
    }
    
    if (!mobile || mobile.trim() === '') {
      showError('signupError', 'Mobile number is required');
      return false;
    }
    
    // Store signup data
    signupData.email = email;
    signupData.mobile = mobile;
    signupData.password = password;
    
    // Register user (creates account and sends OTPs)
    const result = PMTwinAuth.register({
      email: email,
      mobile: mobile,
      password: password,
      role: signupData.role,
      userType: signupData.userType,
      profile: {}
    });
    
    if (result.success) {
      // Store OTPs for display
      signupData.emailOTP = result.emailOTP;
      signupData.mobileOTP = result.mobileOTP;
      signupStep = 3; // Move to OTP verification
      renderSignupStep();
    } else {
      showError('signupError', result.error);
    }
    
    return false;
  }

  function handleOTPVerification(event, type = 'email') {
    event.preventDefault();
    
    const otpCode = document.getElementById('otpCode').value;
    
    if (!otpCode || otpCode.length !== 6) {
      showError('otpError', 'Please enter a valid 6-digit code');
      return false;
    }
    
    const result = PMTwinAuth.verifyOTP(signupData.email, otpCode, type);
    
    if (result.success) {
      // Mark verification as complete
      if (type === 'email') {
        signupData.emailVerified = true;
      } else if (type === 'mobile') {
        signupData.mobileVerified = true;
      }
      
      document.getElementById('otpError').style.display = 'none';
      const successMsg = type === 'email' ? 'Email verified successfully!' : 'Mobile number verified successfully!';
      document.getElementById('otpSuccess').textContent = successMsg;
      document.getElementById('otpSuccess').style.display = 'block';
      
      // If both verified, check next step
      if (result.allVerified) {
        // All users move to identity collection step
        setTimeout(() => {
          signupStep = 4; // Move to identity & compliance data collection
          renderSignupStep();
        }, 1000);
      } else {
        // Need to verify the other one
        setTimeout(() => {
          renderSignupStep(); // Re-render to show mobile verification
        }, 1000);
      }
    } else {
      showError('otpError', result.error);
    }
    
    return false;
  }

  function resendOTP(type = 'email') {
    const result = PMTwinAuth.requestOTP(signupData.email, type);
    if (result.success) {
      // Update stored OTP
      if (type === 'email') {
        signupData.emailOTP = result.otpCode;
      } else if (type === 'mobile') {
        signupData.mobileOTP = result.otpCode;
      }
      
      const errorEl = document.getElementById('otpError');
      if (errorEl) {
        errorEl.textContent = `New ${type} OTP code sent`;
        errorEl.className = 'alert alert-success';
        errorEl.style.display = 'block';
        setTimeout(() => {
          errorEl.style.display = 'none';
          errorEl.className = 'alert alert-error';
        }, 3000);
      }
    } else {
      showError('otpError', result.error);
    }
  }

  function handleIdentity(event) {
    event.preventDefault();
    
    const user = PMTwinData.Users.getByEmail(signupData.email);
    if (!user) {
      showError('identityError', 'User not found. Please start over.');
      return false;
    }
    
    const userType = signupData.userType;
    const identity = {};
    
    if (userType === 'company') {
      identity.legalEntityName = document.getElementById('legalEntityName').value;
      identity.crNumber = document.getElementById('crNumber').value;
      identity.taxNumber = document.getElementById('taxNumber').value;
      identity.authorizedRepresentativeNID = document.getElementById('authorizedRepNID').value;
      const scaClassification = document.getElementById('scaClassification').value;
      if (scaClassification) {
        identity.scaClassification = scaClassification;
      }
    } else {
      identity.fullLegalName = document.getElementById('fullLegalName').value;
      const idType = document.querySelector('input[name="idType"]:checked').value;
      if (idType === 'nationalId') {
        identity.nationalId = document.getElementById('nationalId').value;
      } else {
        identity.passportNumber = document.getElementById('passportNumber').value;
      }
      identity.contactInfo = document.getElementById('contactInfo').value;
    }
    
    // Update user identity
    PMTwinData.Users.update(user.id, {
      identity: identity
    });
    
    // Move to next step (profile information)
    signupStep = 5;
    renderSignupStep();
    
    return false;
  }

  function toggleIdType(type) {
    const nationalIdGroup = document.getElementById('nationalIdGroup');
    const passportGroup = document.getElementById('passportGroup');
    const nationalIdInput = document.getElementById('nationalId');
    const passportInput = document.getElementById('passportNumber');
    
    if (type === 'nationalId') {
      nationalIdGroup.style.display = 'block';
      passportGroup.style.display = 'none';
      nationalIdInput.required = true;
      passportInput.required = false;
      passportInput.value = '';
    } else {
      nationalIdGroup.style.display = 'none';
      passportGroup.style.display = 'block';
      nationalIdInput.required = false;
      passportInput.required = true;
      nationalIdInput.value = '';
    }
  }

  function handleProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value;
    const phone = document.getElementById('signupPhone')?.value || '';
    const website = document.getElementById('signupWebsite')?.value || '';
    const title = document.getElementById('signupTitle')?.value || '';
    
    // Update user profile
    const user = PMTwinData.Users.getByEmail(signupData.email);
    if (!user) {
      showError('profileError', 'User not found. Please start over.');
      return false;
    }
    
    const profileUpdates = {
      name: name,
      phone: phone
    };
    
    if (signupData.userType === 'company') {
      profileUpdates.website = website;
      profileUpdates.companyName = name;
    } else if (signupData.userType === 'consultant') {
      profileUpdates.professionalTitle = title;
    }
    
    // Update user profile
    PMTwinData.Users.update(user.id, {
      profile: {
        ...user.profile,
        ...profileUpdates
      }
    });
    
    // Update onboarding stage - should be profile_in_progress
    PMTwinData.Users.update(user.id, {
      onboardingStage: 'profile_in_progress',
      onboardingProgress: PMTwinData.calculateOnboardingProgress(signupData.userType, 'profile_in_progress', user)
    });
    
    // Move to next step - all users go to credentials/review submission
    signupStep = 6; // Move to credentials upload (or review submission for Individual)
    renderSignupStep();
    
    return false;
  }

  function handleCredentials(event) {
    event.preventDefault();
    
    const userType = signupData.userType;
    const isCompany = userType === 'company';
    const credentials = [];
    
    if (isCompany) {
      const crFile = document.getElementById('crFile').files[0];
      const vatFile = document.getElementById('vatFile').files[0];
      const profileFile = document.getElementById('profileFile').files[0];
      
      if (!crFile || !vatFile || !profileFile) {
        showError('credentialsError', 'Please upload all required files');
        return false;
      }
      
      credentials.push(
        { type: 'cr', fileName: crFile.name, fileSize: crFile.size, uploadedAt: new Date().toISOString() },
        { type: 'vat', fileName: vatFile.name, fileSize: vatFile.size, uploadedAt: new Date().toISOString() },
        { type: 'profile', fileName: profileFile.name, fileSize: profileFile.size, uploadedAt: new Date().toISOString() }
      );
    } else {
      // Consultant
      const licenseFile = document.getElementById('licenseFile').files[0];
      const cvFile = document.getElementById('cvFile').files[0];
      
      if (!licenseFile || !cvFile) {
        showError('credentialsError', 'Please upload all required files');
        return false;
      }
      
      credentials.push(
        { type: 'license', fileName: licenseFile.name, fileSize: licenseFile.size, uploadedAt: new Date().toISOString() },
        { type: 'cv', fileName: cvFile.name, fileSize: cvFile.size, uploadedAt: new Date().toISOString() }
      );
    }
    
    // Update user with credentials and submit for review
    const user = PMTwinData.Users.getByEmail(signupData.email);
    if (!user) {
      showError('credentialsError', 'User not found. Please start over.');
      return false;
    }
    
    // Upload documents if provided (for Company/Consultant)
    if (credentials.length > 0) {
      const existingDocs = user.documents || [];
      credentials.forEach(cred => {
        existingDocs.push({
          id: PMTwinData.generateId('doc'),
          type: cred.type,
          fileName: cred.fileName,
          fileSize: cred.fileSize,
          fileType: 'application/pdf',
          base64Data: null, // Would be populated by actual file upload
          uploadedAt: cred.uploadedAt,
          verified: false
        });
      });
      PMTwinData.Users.update(user.id, {
        documents: existingDocs,
        profile: {
          ...user.profile,
          credentials: credentials // Legacy support
        }
      });
    }
    
    // Submit profile for review (all user types)
    const submitResult = PMTwinData.submitProfileForReview(user.id);
    if (!submitResult.success) {
      showError('credentialsError', submitResult.errors ? submitResult.errors.join(', ') : submitResult.error || 'Failed to submit for review. Please check that all required information is complete.');
      return false;
    }
    
    // Move to success page
    signupStep = 7; // Move to success
    renderSignupStep();
    
    return false;
  }

  function setupFileUploads() {
    document.querySelectorAll('.modern-file-input, .file-upload-input').forEach(input => {
      input.addEventListener('change', function() {
        const file = this.files[0];
        if (file) {
          const previewId = this.id.replace('File', 'Preview');
          const preview = document.getElementById(previewId);
          if (preview) {
            const fileSize = file.size > 1024 * 1024 
              ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
              : `${(file.size / 1024).toFixed(2)} KB`;
            
            preview.innerHTML = `
              <div style="display: flex; align-items: center; gap: var(--spacing-2); color: var(--color-white);">
                <span>✅</span>
                <span><strong>${escapeHtml(file.name)}</strong> (${fileSize})</span>
              </div>
            `;
            preview.style.display = 'block';
            
            // Update label to show file selected
            const label = this.closest('.modern-file-upload')?.querySelector('.modern-file-label');
            if (label) {
              label.style.borderColor = 'rgba(0, 170, 68, 0.6)';
              label.style.background = 'rgba(0, 170, 68, 0.1)';
            }
          }
        }
      });
      
      // Drag and drop support
      const label = this.closest('.modern-file-upload')?.querySelector('.modern-file-label');
      if (label) {
        label.addEventListener('dragover', function(e) {
          e.preventDefault();
          this.style.borderColor = 'rgba(255, 255, 255, 0.7)';
          this.style.background = 'rgba(255, 255, 255, 0.25)';
        });
        
        label.addEventListener('dragleave', function(e) {
          e.preventDefault();
          this.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          this.style.background = 'rgba(255, 255, 255, 0.15)';
        });
        
        label.addEventListener('drop', function(e) {
          e.preventDefault();
          this.style.borderColor = 'rgba(255, 255, 255, 0.4)';
          this.style.background = 'rgba(255, 255, 255, 0.15)';
          
          const files = e.dataTransfer.files;
          if (files.length > 0) {
            input.files = files;
            input.dispatchEvent(new Event('change'));
          }
        });
      }
    });
  }

  // ============================================
  // Login (Smart Login with Status Detection)
  // ============================================
  function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Auto-detect user type after email entry (for display purposes)
    const user = PMTwinData.Users.getByEmail(email);
    if (user) {
      displayUserTypeHint(user);
    }
    
    const result = PMTwinAuth.login(email, password);
    
    if (result.success) {
      // Show onboarding status if not fully approved
      if (result.onboardingStage && result.onboardingStage !== 'approved' && result.userType !== 'individual') {
        showOnboardingStatus(result);
        // Still allow login but show status
        setTimeout(() => {
          redirectToPortal(result.user);
        }, 2000);
      } else {
        redirectToPortal(result.user);
      }
    } else {
      let errorMsg = result.error;
      
      // Status-aware messaging
      if (result.status) {
        errorMsg = getStatusMessage(result.status, result.userType, result.requiresAction);
      }
      
      // Add helpful setup instructions if no accounts exist
      if (errorMsg.includes('No accounts found')) {
        errorMsg += '<br><br><strong>Quick Setup:</strong><br>' +
          '1. Open browser console (F12)<br>' +
          '2. Run: <code>const s=document.createElement("script");s.src="js/setup-accounts.js";document.head.appendChild(s);</code><br>' +
          '3. Or refresh the page - accounts will be created automatically on first load';
      }
      
      const errorEl = document.getElementById('loginError');
      if (errorEl) {
        errorEl.innerHTML = errorMsg;
        errorEl.style.display = 'block';
      }
    }
    
    return false;
  }

  function displayUserTypeHint(user) {
    // Show user type hint (optional enhancement)
    // Could display a small badge or hint
  }

  function showOnboardingStatus(result) {
    const errorEl = document.getElementById('loginError');
    if (errorEl) {
      errorEl.className = 'alert alert-info';
      errorEl.innerHTML = `
        <strong>Login successful!</strong><br>
        ${getStatusMessage(result.onboardingStage, result.userType, null, true)}
        <div style="margin-top: var(--spacing-2);">
          <small>Redirecting to your dashboard...</small>
        </div>
      `;
      errorEl.style.display = 'block';
    }
  }

  function getStatusMessage(stage, userType, requiresAction, isSuccess = false) {
    if (isSuccess) {
      if (stage === 'pending_verification') {
        return 'You\'re almost there! Your account is pending verification. You can browse but some features are restricted until approval.';
      }
      if (stage === 'email_verified') {
        return 'Please complete your profile to unlock full access.';
      }
      return 'Welcome back!';
    }

    switch(requiresAction) {
      case 'verify_email':
        return 'Please verify your email address first. Check your inbox for the OTP code, or <a href="#signup">complete registration</a>.';
      case 'contact_support':
        return 'Your account requires attention. Please <a href="mailto:support@pmtwin.com">contact support</a> for assistance.';
      default:
        if (stage === 'pending_verification') {
          return 'Your account is pending verification. You can still log in to browse, but some features are restricted until approval.';
        }
        if (stage === 'rejected') {
          return 'Your account verification was rejected. Please contact support for assistance.';
        }
        if (stage === 'suspended') {
          return 'Your account has been suspended. Please contact support for assistance.';
        }
        return 'Unable to log in. Please check your credentials or contact support.';
    }
  }

  function redirectToPortal(user) {
    if (user.role === 'admin') {
      window.location.href = 'admin-portal.html';
    } else {
      window.location.href = 'user-portal.html';
    }
  }

  function detectUserType(email) {
    if (!email) return;
    
    const user = PMTwinData.Users.getByEmail(email);
    const hintEl = document.getElementById('loginUserTypeHint');
    const hintTextEl = document.getElementById('userTypeHintText');
    
    if (user && hintEl && hintTextEl) {
      const userTypeLabels = {
        'company': 'Company Account',
        'consultant': 'Consultant Account',
        'individual': 'Individual Account',
        'admin': 'Admin Account'
      };
      
      hintTextEl.textContent = `Detected: ${userTypeLabels[user.userType] || 'User Account'}`;
      hintEl.style.display = 'block';
    } else if (hintEl) {
      hintEl.style.display = 'none';
    }
  }

  function showDemoMode() {
    const container = document.getElementById('loginContent') || document.getElementById('mainContent');
    if (!container) {
      alert('Demo mode: Use the demo credentials button (!) above to see test accounts.');
      return;
    }
    
    container.innerHTML = `
      <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-body">
          <h2 style="margin-bottom: var(--spacing-4); text-align: center;">Try Demo Mode</h2>
          <p style="text-align: center; color: var(--text-secondary); margin-bottom: var(--spacing-6);">
            Experience PMTwin without creating an account. Choose a demo role to explore the platform.
          </p>
          
          <div class="grid grid-cols-1 grid-cols-md-3 gap-4">
            <div class="card" style="border: 2px solid var(--color-primary); cursor: pointer;" onclick="PublicPortal.startDemo('company')">
              <div class="card-body" style="text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: var(--spacing-2);">🏢</div>
                <h3 class="card-title" style="font-size: 1.1rem;">Company Demo</h3>
                <p class="card-text" style="font-size: 0.85rem;">Create projects, find partners</p>
                <button class="btn btn-primary btn-sm btn-block">Try as Company</button>
              </div>
            </div>
            
            <div class="card" style="border: 2px solid var(--color-primary); cursor: pointer;" onclick="PublicPortal.startDemo('consultant')">
              <div class="card-body" style="text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: var(--spacing-2);">👔</div>
                <h3 class="card-title" style="font-size: 1.1rem;">Consultant Demo</h3>
                <p class="card-text" style="font-size: 0.85rem;">Browse opportunities, apply</p>
                <button class="btn btn-primary btn-sm btn-block">Try as Consultant</button>
              </div>
            </div>
            
            <div class="card" style="border: 2px solid var(--color-primary); cursor: pointer;" onclick="PublicPortal.startDemo('individual')">
              <div class="card-body" style="text-align: center;">
                <div style="font-size: 2.5rem; margin-bottom: var(--spacing-2);">👤</div>
                <h3 class="card-title" style="font-size: 1.1rem;">Individual Demo</h3>
                <p class="card-text" style="font-size: 0.85rem;">Browse, learn, explore</p>
                <button class="btn btn-primary btn-sm btn-block">Try as Individual</button>
              </div>
            </div>
          </div>
          
          <div style="margin-top: var(--spacing-6); padding: var(--spacing-4); background: var(--bg-secondary); border-radius: var(--radius);">
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
              <strong>Note:</strong> Demo mode uses pre-loaded test data. Your actions won't be saved permanently.
            </p>
          </div>
          
          <div style="margin-top: var(--spacing-4); text-align: center;">
            <button class="btn btn-ghost" onclick="window.location.hash = 'login'">← Back to Login</button>
          </div>
        </div>
      </div>
    `;
  }

  function startDemo(userType) {
    // Create a demo session with pre-loaded data
    const demoUsers = {
      'company': {
        email: 'demo-company@pmtwin.com',
        password: 'Demo123',
        role: 'entity',
        userType: 'company'
      },
      'consultant': {
        email: 'demo-consultant@pmtwin.com',
        password: 'Demo123',
        role: 'individual',
        userType: 'consultant'
      },
      'individual': {
        email: 'demo-individual@pmtwin.com',
        password: 'Demo123',
        role: 'individual',
        userType: 'individual'
      }
    };
    
    const demoUser = demoUsers[userType];
    if (!demoUser) return;
    
    // Check if demo user exists, create if not
    let user = PMTwinData.Users.getByEmail(demoUser.email);
    if (!user) {
      // Create demo user
      user = PMTwinData.Users.create({
        email: demoUser.email,
        password: btoa(demoUser.password),
        role: demoUser.role,
        userType: demoUser.userType,
        onboardingStage: 'approved', // Demo users are pre-approved
        emailVerified: true,
        profile: {
          name: `Demo ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString()
        },
        onboardingProgress: {
          percentage: 100,
          currentStage: 'approved',
          nextSteps: []
        }
      });
    }
    
    // Auto-login with demo credentials
    const result = PMTwinAuth.login(demoUser.email, demoUser.password);
    if (result.success) {
      redirectToPortal(result.user);
    } else {
      alert('Demo login failed. Please try again.');
    }
  }

  // ============================================
  // Utility Functions
  // ============================================
  function showError(elementId, message) {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.style.display = 'block';
      errorEl.className = errorEl.className.replace(/modern-alert-\w+/g, '') + ' modern-alert modern-alert-error';
    }
  }

  function updatePasswordStrength(password) {
    const strengthEl = document.getElementById('passwordStrength');
    if (!strengthEl) return;
    
    let strength = 0;
    let feedback = [];
    
    if (password.length >= 8) strength++;
    else feedback.push('At least 8 characters');
    
    if (/[A-Z]/.test(password)) strength++;
    else feedback.push('One uppercase letter');
    
    if (/[a-z]/.test(password)) strength++;
    else feedback.push('One lowercase letter');
    
    if (/[0-9]/.test(password)) strength++;
    else feedback.push('One number');
    
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
    const strengthColors = ['#CC0000', '#FF6600', '#FFAA00', '#00AA44', '#0066CC', '#7B2CBF'];
    
    if (password.length === 0) {
      strengthEl.innerHTML = '';
      strengthEl.style.display = 'none';
      return;
    }
    
    strengthEl.style.display = 'block';
    strengthEl.innerHTML = `
      <div class="password-strength-bar">
        <div class="password-strength-fill" style="width: ${(strength / 5) * 100}%; background: ${strengthColors[strength]}"></div>
      </div>
      <div class="password-strength-text" style="color: ${strengthColors[strength]}">
        ${strengthLabels[strength]} ${feedback.length > 0 ? '• ' + feedback.join(', ') : ''}
      </div>
    `;
  }

  function startOTPTimer() {
    const timerEl = document.getElementById('otpTimer');
    if (!timerEl) return;
    
    let timeLeft = 600; // 10 minutes in seconds
    
    const updateTimer = () => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      timerEl.innerHTML = `
        <div class="otp-timer-content">
          <span class="otp-timer-icon">⏱️</span>
          <span>Code expires in ${minutes}:${seconds.toString().padStart(2, '0')}</span>
        </div>
      `;
      
      if (timeLeft > 0) {
        timeLeft--;
        setTimeout(updateTimer, 1000);
      } else {
        timerEl.innerHTML = `
          <div class="otp-timer-content expired">
            <span>Code expired. Please request a new one.</span>
          </div>
        `;
      }
    };
    
    updateTimer();
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Public API
  // ============================================
  window.PublicPortal = {
    init: initRouting,
    filterProjects,
    wizardSelect,
    wizardBack,
    signupSelectUserType,
    signupSelectRole, // Backward compatibility
    signupBack,
    handleSignup,
    handleOTPVerification,
    resendOTP,
    handleIdentity,
    toggleIdType,
    handleProfile,
    handleCredentials,
    handleLogin,
    detectUserType,
    showDemoMode,
    startDemo,
    updatePasswordStrength,
    startOTPTimer
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initRouting();
      // Mobile nav toggle
      document.getElementById('navbarToggle')?.addEventListener('click', function() {
        const nav = document.getElementById('navbarNav');
        nav.classList.toggle('show');
      });
    });
  } else {
    initRouting();
    // Mobile nav toggle
    document.getElementById('navbarToggle')?.addEventListener('click', function() {
      const nav = document.getElementById('navbarNav');
      nav.classList.toggle('show');
    });
  }

})();



