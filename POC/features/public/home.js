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
    if (!container || typeof PMTwinData === 'undefined') return;

    try {
      const projects = PMTwinData.Projects.getActive().slice(0, 6);
      
      if (projects.length === 0) {
        container.innerHTML = '<p style="text-align: center;">No active projects at the moment.</p>';
        return;
      }

      let html = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">';
      
      projects.forEach(project => {
        html += `
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: 0.5rem;">${project.title || 'Untitled Project'}</h3>
              <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                ${project.category || 'General'} • ${project.location?.city || 'Location TBD'}
              </p>
              <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 150)}...</p>
              <a href="../project/?id=${project.id}" class="btn btn-primary btn-sm">View Details</a>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading projects preview:', error);
      container.innerHTML = '<p style="text-align: center;">Error loading projects.</p>';
    }
  }

  // Export
  if (!window.public) window.public = {};
  window.public.home = { init };

})();


