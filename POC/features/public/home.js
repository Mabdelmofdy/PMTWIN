/**
 * Home Component
 */

(function() {
  'use strict';

  function init(params) {
    loadHomeContent();
  }

  function loadHomeContent() {
    // Load about content
    if (typeof Renderer !== 'undefined' && Renderer.renderAbout) {
      Renderer.renderAbout();
    } else {
      const aboutContent = document.getElementById('aboutContent');
      if (aboutContent) {
        aboutContent.innerHTML = `
          <p style="text-align: center; max-width: 800px; margin: 0 auto;">
            PMTwin is a comprehensive platform designed to digitize the lifecycle of construction 
            collaboration in the MENA region. We facilitate data-driven matching and flexible 
            resource exchange.
          </p>
        `;
      }
    }

    // Load services content
    if (typeof Renderer !== 'undefined' && Renderer.renderServices) {
      Renderer.renderServices();
    } else {
      const servicesContent = document.getElementById('servicesContent');
      if (servicesContent) {
        servicesContent.innerHTML = `
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 2rem;">
            <div class="card">
              <div class="card-body">
                <h3>Project Discovery</h3>
                <p>Browse active mega-projects and find opportunities</p>
              </div>
            </div>
            <div class="card">
              <div class="card-body">
                <h3>Smart Matching</h3>
                <p>AI-powered matching algorithm connects you with the right partners</p>
              </div>
            </div>
            <div class="card">
              <div class="card-body">
                <h3>Collaboration Models</h3>
                <p>Choose from various collaboration models including SPVs and barter</p>
              </div>
            </div>
          </div>
        `;
      }
    }

    // Load statistics
    loadStatistics();

    // Load knowledge hub links
    loadKnowledgeHubLinks();

    // Load FAQ
    loadFAQ();

    // Load projects preview (with delay to ensure siteData is loaded)
    setTimeout(() => {
      loadProjectsPreview();
    }, 100);
    
    // Also try loading after data is loaded event
    window.addEventListener('pmtwinDataLoaded', function() {
      loadProjectsPreview();
    }, { once: true });
  }

  function loadStatistics() {
    const container = document.getElementById('statisticsContent');
    if (!container) return;

    let stats = {
      activeProjects: 0,
      totalUsers: 0,
      totalProposals: 0,
      activeCollaborations: 0
    };

    // Try to get real data if available
    if (typeof PMTwinData !== 'undefined') {
      try {
        stats.activeProjects = PMTwinData.Projects.getActive().length;
        stats.totalUsers = PMTwinData.Users.getAll().length;
        stats.totalProposals = PMTwinData.Proposals.getAll().length;
        stats.activeCollaborations = PMTwinData.CollaborationOpportunities.getAll().filter(o => o.status === 'active').length;
      } catch (e) {
        console.warn('Error loading statistics:', e);
      }
    }

    // Use default values if no data
    if (stats.activeProjects === 0) stats.activeProjects = 50;
    if (stats.totalUsers === 0) stats.totalUsers = 250;
    if (stats.totalProposals === 0) stats.totalProposals = 180;
    if (stats.activeCollaborations === 0) stats.activeCollaborations = 35;

    container.innerHTML = `
      <div class="stat-card" style="text-align: center; padding: 2rem;">
        <div class="stat-value" style="font-size: 3rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem;">
          <span class="counter" data-target="${stats.activeProjects}">0</span>+
        </div>
        <div class="stat-label" style="color: var(--text-secondary); font-size: 1.1rem;">Active Projects</div>
      </div>
      <div class="stat-card" style="text-align: center; padding: 2rem;">
        <div class="stat-value" style="font-size: 3rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem;">
          <span class="counter" data-target="${stats.totalUsers}">0</span>+
        </div>
        <div class="stat-label" style="color: var(--text-secondary); font-size: 1.1rem;">Registered Users</div>
      </div>
      <div class="stat-card" style="text-align: center; padding: 2rem;">
        <div class="stat-value" style="font-size: 3rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem;">
          <span class="counter" data-target="${stats.totalProposals}">0</span>+
        </div>
        <div class="stat-label" style="color: var(--text-secondary); font-size: 1.1rem;">Proposals Submitted</div>
      </div>
      <div class="stat-card" style="text-align: center; padding: 2rem;">
        <div class="stat-value" style="font-size: 3rem; font-weight: 700; color: var(--color-primary); margin-bottom: 0.5rem;">
          <span class="counter" data-target="${stats.activeCollaborations}">0</span>+
        </div>
        <div class="stat-label" style="color: var(--text-secondary); font-size: 1.1rem;">Active Collaborations</div>
      </div>
    `;

    // Animate counters
    animateCounters();
  }

  function animateCounters() {
    const counters = document.querySelectorAll('.counter');
    counters.forEach(counter => {
      const target = parseInt(counter.getAttribute('data-target'));
      const duration = 2000;
      const increment = target / (duration / 16);
      let current = 0;

      const updateCounter = () => {
        current += increment;
        if (current < target) {
          counter.textContent = Math.floor(current);
          requestAnimationFrame(updateCounter);
        } else {
          counter.textContent = target;
        }
      };

      // Start animation when element is visible
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            updateCounter();
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(counter);
    });
  }

  function loadKnowledgeHubLinks() {
    const container = document.getElementById('knowledgeHubContent');
    if (!container) return;

    container.innerHTML = `
      <div class="card" style="padding: 2rem; transition: transform 0.3s ease;" 
           onmouseover="this.style.transform='translateY(-8px)';" 
           onmouseout="this.style.transform='';">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <i class="ph ph-building-office" style="font-size: 2.5rem; color: var(--color-primary);"></i>
          <h3 style="margin: 0;">What is an SPV?</h3>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
          Learn about Special Purpose Vehicles (SPVs) and how they're used in construction mega-projects for risk management and project structuring.
        </p>
        <a href="../knowledge/?article=spv" class="btn btn-outline" style="text-decoration: none; display: inline-block;">
          Read Article <i class="ph ph-arrow-right"></i>
        </a>
      </div>
      <div class="card" style="padding: 2rem; transition: transform 0.3s ease;" 
           onmouseover="this.style.transform='translateY(-8px)';" 
           onmouseout="this.style.transform='';">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <i class="ph ph-arrows-clockwise" style="font-size: 2.5rem; color: var(--color-primary);"></i>
          <h3 style="margin: 0;">Barter Guide</h3>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
          Discover how barter exchange works in construction, value equivalence calculation, and best practices for successful barter transactions.
        </p>
        <a href="../knowledge/?article=barter" class="btn btn-outline" style="text-decoration: none; display: inline-block;">
          Read Guide <i class="ph ph-arrow-right"></i>
        </a>
      </div>
      <div class="card" style="padding: 2rem; transition: transform 0.3s ease;" 
           onmouseover="this.style.transform='translateY(-8px)';" 
           onmouseout="this.style.transform='';">
        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
          <i class="ph ph-question" style="font-size: 2.5rem; color: var(--color-primary);"></i>
          <h3 style="margin: 0;">FAQ</h3>
        </div>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.6;">
          Find answers to common questions about the platform, registration process, matching algorithm, and collaboration models.
        </p>
        <a href="../knowledge/?section=faq" class="btn btn-outline" style="text-decoration: none; display: inline-block;">
          View FAQ <i class="ph ph-arrow-right"></i>
        </a>
      </div>
    `;
  }

  function loadFAQ() {
    const container = document.getElementById('faqContent');
    if (!container) return;

    const faqs = [
      {
        question: 'How does the matching algorithm work?',
        answer: 'Our AI-powered matching algorithm analyzes project requirements, service provider capabilities, skills, experience, and location to find the best matches. Matches with scores above 80% are automatically highlighted.'
      },
      {
        question: 'What collaboration models are available?',
        answer: 'PMTwin offers 5 main collaboration models: Project-Based (Task-Based, Consortium, JV, SPV), Strategic Partnerships (Strategic JV, Alliance, Mentorship), Resource Pooling (Bulk Purchasing, Co-Ownership, Barter), Hiring (Professional, Consultant), and Competition/RFP.'
      },
      {
        question: 'How do I get my account approved?',
        answer: 'After registration, you\'ll need to upload required credentials (CR/VAT for entities, professional licenses for individuals). Our admin team reviews applications within 2-3 business days. You\'ll receive a notification once approved.'
      },
      {
        question: 'Can I use barter instead of cash?',
        answer: 'Yes! PMTwin supports barter transactions where you can exchange services instead of cash. The platform calculates value equivalence to ensure fair exchanges.'
      },
      {
        question: 'What is an SPV and when is it used?',
        answer: 'A Special Purpose Vehicle (SPV) is a separate legal entity created for a specific project. On PMTwin, SPVs are automatically suggested for projects with budgets exceeding 50M SAR to manage risk and provide legal separation.'
      },
      {
        question: 'How do I create a mega-project?',
        answer: 'After your account is approved, navigate to "Create Project" from your dashboard. Fill in project details, requirements, budget, and timeline. Once published, our matching algorithm will find suitable partners.'
      }
    ];

    let html = '';
    faqs.forEach((faq, index) => {
      html += `
        <div class="faq-item" style="margin-bottom: 1.5rem; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden;">
          <button class="faq-question" onclick="toggleFAQ(${index})" style="width: 100%; padding: 1.5rem; background: var(--bg-primary); border: none; text-align: left; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 1.1rem; font-weight: 600;">
            <span>${faq.question}</span>
            <i class="ph ph-caret-down faq-icon" id="faqIcon${index}" style="transition: transform 0.3s ease;"></i>
          </button>
          <div class="faq-answer" id="faqAnswer${index}" style="display: none; padding: 0 1.5rem 1.5rem 1.5rem; color: var(--text-secondary); line-height: 1.6;">
            ${faq.answer}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Global function for FAQ toggle
  window.toggleFAQ = function(index) {
    const answer = document.getElementById(`faqAnswer${index}`);
    const icon = document.getElementById(`faqIcon${index}`);
    
    if (answer.style.display === 'none') {
      answer.style.display = 'block';
      icon.style.transform = 'rotate(180deg)';
    } else {
      answer.style.display = 'none';
      icon.style.transform = 'rotate(0deg)';
    }
  };

  function loadProjectsPreview() {
    const container = document.getElementById('projectsPreview');
    if (!container) return;

    // Check if user is authenticated
    const isAuthenticated = typeof PMTwinData !== 'undefined' && 
                           typeof PMTwinData.Sessions !== 'undefined' && 
                           PMTwinData.Sessions.getCurrentUser() !== null;

    // For public users, show featured projects from portfolio data
    if (!isAuthenticated || typeof PMTwinData === 'undefined') {
      // Get portfolio data from siteData
      let portfolioProjects = [];
      if (typeof siteData !== 'undefined' && siteData.portfolio && Array.isArray(siteData.portfolio)) {
        portfolioProjects = siteData.portfolio.slice(0, 6); // Show up to 6 projects
      }

      if (portfolioProjects.length > 0) {
        // Show actual project cards
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; margin-bottom: 2rem;">';
        
        portfolioProjects.forEach(project => {
          html += `
            <div class="card enhanced-card" style="transition: transform 0.3s ease, box-shadow 0.3s ease; height: 100%; display: flex; flex-direction: column;" 
                 onmouseover="this.style.transform='translateY(-8px)'; this.style.boxShadow='0 12px 24px rgba(0,0,0,0.15)';" 
                 onmouseout="this.style.transform=''; this.style.boxShadow='';">
              ${project.image ? `
                <div style="width: 100%; height: 220px; overflow: hidden; border-radius: var(--radius) var(--radius) 0 0;">
                  <img src="${project.image}" alt="${project.title || ''}" style="width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s ease;" 
                       onmouseover="this.style.transform='scale(1.05)';" 
                       onmouseout="this.style.transform='scale(1)';">
                </div>
              ` : ''}
              <div class="card-body" style="flex: 1; display: flex; flex-direction: column; padding: var(--spacing-5);">
                <div style="margin-bottom: var(--spacing-3);">
                  <span class="badge badge-primary" style="font-size: 0.85rem; padding: 0.35rem 0.75rem;">${project.category || 'Mega Project'}</span>
                </div>
                <h3 style="margin-bottom: var(--spacing-3); font-size: 1.35rem; font-weight: 600; color: var(--text-primary); line-height: 1.3;">
                  ${project.title || 'Untitled Project'}
                </h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-4); line-height: 1.6; flex: 1; font-size: 0.95rem;">
                  ${project.description || 'No description available.'}
                </p>
                <div style="margin-top: auto;">
                  <a href="${project.link || '../discovery/'}" class="btn btn-primary" style="width: 100%; text-decoration: none; display: inline-block; text-align: center;">
                    <i class="ph ph-arrow-right"></i> View Project Details
                  </a>
                </div>
              </div>
            </div>
          `;
        });
        
        html += '</div>';
        
        // Add signup CTA below projects
        html += `
          <div class="card enhanced-card" style="text-align: center; padding: 2.5rem; background: linear-gradient(135deg, var(--color-primary-light, #e3f2fd) 0%, var(--bg-secondary) 100%); border: 2px solid var(--color-primary, #3b82f6);">
            <h3 style="margin-bottom: 1rem; color: var(--text-primary);">Want to See More Projects?</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.05rem;">
              Sign up to access detailed project information, budgets, and collaboration opportunities.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="../signup/" class="btn btn-primary btn-lg">Sign Up to View All Projects</a>
              <a href="../discovery/" class="btn btn-secondary btn-lg">Explore Discovery Engine</a>
            </div>
          </div>
        `;
        
        container.innerHTML = html;
        return;
      } else {
        // Fallback: show CTA if no portfolio data
        container.innerHTML = `
          <div class="card enhanced-card" style="text-align: center; padding: 3rem;">
            <h3 style="margin-bottom: 1rem;">Discover Active Mega-Projects</h3>
            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
              Sign up to browse and explore active construction projects in the MENA region.
            </p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="../signup/" class="btn btn-primary">Sign Up to View Projects</a>
              <a href="../discovery/" class="btn btn-secondary">Explore Discovery</a>
            </div>
          </div>
        `;
        return;
      }
    }

    try {
      const projects = PMTwinData.Projects.getActive().slice(0, 6);
      
      if (projects.length === 0) {
        container.innerHTML = `
          <div class="card enhanced-card" style="text-align: center; padding: 3rem;">
            <p style="color: var(--text-secondary);">No active projects at the moment. Check back soon!</p>
            <a href="../discovery/" class="btn btn-primary" style="margin-top: 1rem;">Browse All Projects</a>
          </div>
        `;
        return;
      }

      let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';
      
      projects.forEach(project => {
        html += `
          <div class="card enhanced-card" style="transition: transform 0.2s, box-shadow 0.2s;" 
               onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)';" 
               onmouseout="this.style.transform=''; this.style.boxShadow='';">
            <div class="card-body">
              <h3 style="margin-bottom: 0.5rem; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${project.title || 'Untitled Project'}</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: var(--font-size-sm);">
                <i class="ph ph-folder"></i> ${project.category || 'General'} • 
                <i class="ph ph-map-pin"></i> ${project.location?.city || 'Location TBD'}
              </p>
              <p style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.6;">
                ${(project.description || 'No description available.').substring(0, 150)}${project.description && project.description.length > 150 ? '...' : ''}
              </p>
              <a href="../project/?id=${project.id}" class="btn btn-primary btn-sm" style="text-decoration: none; width: 100%;">View Details</a>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading projects preview:', error);
      container.innerHTML = `
        <div class="card enhanced-card" style="text-align: center; padding: 3rem;">
          <p style="color: var(--text-secondary);">Error loading projects. Please try again later.</p>
          <a href="../discovery/" class="btn btn-primary" style="margin-top: 1rem;">Browse Projects</a>
        </div>
      `;
    }
  }

  // Export
  if (!window.public) window.public = {};
  window.public.home = { init };

})();


