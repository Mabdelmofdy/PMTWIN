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

    // Load projects preview
    loadProjectsPreview();
  }

  function loadProjectsPreview() {
    const container = document.getElementById('projectsPreview');
    if (!container) return;

    // Check if user is authenticated
    const isAuthenticated = typeof PMTwinData !== 'undefined' && 
                           typeof PMTwinData.Sessions !== 'undefined' && 
                           PMTwinData.Sessions.getCurrentUser() !== null;

    if (!isAuthenticated || typeof PMTwinData === 'undefined') {
      // For public users, show a call-to-action
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


