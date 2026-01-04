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

    // Load projects preview (with delay to ensure siteData is loaded)
    setTimeout(() => {
      loadProjectsPreview();
    }, 100);
    
    // Also try loading after data is loaded event
    window.addEventListener('pmtwinDataLoaded', function() {
      loadProjectsPreview();
    }, { once: true });
  }

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


