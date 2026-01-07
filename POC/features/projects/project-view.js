/**
 * Project View Component - HTML triggers for ProjectService.getProjectById, updateProject, deleteProject
 */

(function() {
  'use strict';

  function init(params) {
    // Get project ID from params or URL
    const projectId = params?.params?.[0] || params?.id || getProjectIdFromHash();
    if (projectId) {
      loadProject(projectId);
    } else {
      showError('Project ID not provided');
    }
  }

  function getProjectIdFromHash() {
    // Try to get from URL query parameter first
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id');
    if (projectId) return projectId;
    
    // Fallback to hash for backward compatibility
    const hash = window.location.hash;
    const match = hash.match(/project\/([^\/]+)/);
    return match ? match[1] : null;
  }

  // ============================================
  // HTML Triggers for ProjectService Functions
  // ============================================

  // Trigger: getProjectById(projectId) - Load project details
  async function loadProject(projectId) {
    const container = document.getElementById('projectViewContent');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading project...</p>';

      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.getProjectById(projectId);
      } else if (typeof PMTwinData !== 'undefined') {
        // Fallback: load directly from PMTwinData
        const project = PMTwinData.Projects.getById(projectId);
        if (project) {
          result = { success: true, project: project };
        } else {
          result = { success: false, error: 'Project not found' };
        }
      } else {
        container.innerHTML = '<p class="alert alert-error">Data service not available</p>';
        return;
      }

      if (result.success && result.project) {
        renderProject(container, result.project);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load project'}</p>`;
      }
    } catch (error) {
      console.error('Error loading project:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading project. Please try again.</p>';
    }
  }

  // Trigger: updateProject(projectId, updates) - Update project status
  async function updateProjectStatus(projectId, newStatus) {
    try {
      if (typeof ProjectService === 'undefined') {
        alert('Project service not available');
        return;
      }

      const result = await ProjectService.updateProject(projectId, { status: newStatus });
      
      if (result.success) {
        alert(`Project status updated to ${newStatus}`);
        await loadProject(projectId);
      } else {
        alert(result.error || 'Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Error updating project');
    }
  }

  // Trigger: deleteProject(projectId) - Delete project
  async function deleteProject(projectId) {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      if (typeof ProjectService === 'undefined') {
        alert('Project service not available');
        return;
      }

      const result = await ProjectService.deleteProject(projectId);
      
      if (result.success) {
        alert('Project deleted successfully');
        window.location.href = '../projects/';
      } else {
        alert(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderProject(container, project) {
    const currentUser = PMTwinData?.Sessions.getCurrentUser();
    const canEdit = currentUser && (currentUser.id === project.creatorId || currentUser.role === 'admin' || currentUser.role === 'platform_admin');
    const canDelete = currentUser && (currentUser.id === project.creatorId || currentUser.role === 'admin' || currentUser.role === 'platform_admin');
    const isMegaProject = project.projectType === 'mega' || project.subProjects;

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 2rem;">
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
            <h1 style="margin: 0;">${project.title || 'Untitled Project'}</h1>
            ${isMegaProject ? 
              `<span class="badge badge-info" title="Mega-Project with ${project.subProjects?.length || 0} sub-project(s)">
                <i class="ph ph-stack"></i> Mega-Project
              </span>` : 
              `<span class="badge badge-secondary" title="Single Project">
                <i class="ph ph-file-text"></i> Single Project
              </span>`
            }
            <span class="badge badge-${project.status === 'active' ? 'success' : project.status === 'draft' ? 'secondary' : 'info'}">
              ${project.status || 'draft'}
            </span>
          </div>
          <p style="margin: 0; color: var(--text-secondary);">
            <i class="ph ph-buildings"></i> ${project.category || 'General'} • 
            <i class="ph ph-map-pin"></i> ${project.location?.city || 'Location TBD'}, ${project.location?.region || ''}
            ${project.location?.country ? `, ${project.location.country}` : ''}
          </p>
          ${project.createdAt ? `
            <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
              Created: ${new Date(project.createdAt).toLocaleDateString()}
            </p>
          ` : ''}
        </div>
      </div>

      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2 style="margin-bottom: 1rem;">Description</h2>
          <p style="white-space: pre-wrap;">${project.description || 'No description provided.'}</p>
        </div>
      </div>

      ${isMegaProject && project.subProjects && project.subProjects.length > 0 ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">
              <i class="ph ph-stack"></i> Sub-Projects / Phases (${project.subProjects.length})
            </h2>
            <div style="display: grid; gap: 1rem;">
              ${project.subProjects.map((subProject, index) => `
                <div class="card" style="background: var(--bg-secondary); padding: 1rem;">
                  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                    <div>
                      <h3 style="margin: 0 0 0.5rem 0; font-size: var(--font-size-lg);">
                        Phase ${index + 1}: ${subProject.title || 'Untitled'}
                      </h3>
                      <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm);">
                        <i class="ph ph-buildings"></i> ${subProject.category || 'N/A'} • 
                        <i class="ph ph-map-pin"></i> ${subProject.location?.city || 'N/A'}, ${subProject.location?.region || 'N/A'}
                      </p>
                    </div>
                    <span class="badge badge-${subProject.status === 'active' ? 'success' : 'secondary'}">
                      ${subProject.status || 'draft'}
                    </span>
                  </div>
                  ${subProject.description ? `
                    <p style="margin-bottom: 0.75rem; color: var(--text-secondary);">
                      ${subProject.description.substring(0, 200)}${subProject.description.length > 200 ? '...' : ''}
                    </p>
                  ` : ''}
                  ${subProject.budget ? `
                    <p style="margin: 0; font-size: var(--font-size-sm);">
                      <strong>Budget:</strong> ${(subProject.budget.min || 0).toLocaleString()} - ${(subProject.budget.max || 0).toLocaleString()} ${subProject.budget.currency || 'SAR'}
                    </p>
                  ` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      ` : ''}

      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2 style="margin-bottom: 1rem;">Scope & Requirements</h2>
          ${project.scope?.requiredServices && project.scope.requiredServices.length > 0 ? `
            <div style="margin-bottom: 1rem;">
              <strong><i class="ph ph-list-bullets"></i> Required Services:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                ${project.scope.requiredServices.map(service => `
                  <span class="badge badge-info">${service}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${project.scope?.skillRequirements && project.scope.skillRequirements.length > 0 ? `
            <div>
              <strong><i class="ph ph-lightning"></i> Required Skills:</strong>
              <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
                ${project.scope.skillRequirements.map(skill => `
                  <span class="badge badge-secondary">${skill}</span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${(!project.scope?.requiredServices || project.scope.requiredServices.length === 0) && 
            (!project.scope?.skillRequirements || project.scope.skillRequirements.length === 0) ? `
            <p style="color: var(--text-secondary);">No specific requirements specified.</p>
          ` : ''}
        </div>
      </div>

      ${project.budget ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;"><i class="ph ph-currency-circle-dollar"></i> Budget</h2>
            <p style="font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">
              ${project.budget.min ? project.budget.min.toLocaleString() : 'N/A'} - 
              ${project.budget.max ? project.budget.max.toLocaleString() : 'N/A'} 
              ${project.budget.currency || 'SAR'}
            </p>
          </div>
        </div>
      ` : ''}

      ${project.timeline ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;"><i class="ph ph-calendar"></i> Timeline</h2>
            ${project.timeline.start_date ? `
              <p><strong>Start Date:</strong> ${new Date(project.timeline.start_date).toLocaleDateString()}</p>
            ` : ''}
            ${project.timeline.duration ? `
              <p><strong>Duration:</strong> ${project.timeline.duration} months</p>
            ` : ''}
            ${project.timeline.milestones && project.timeline.milestones.length > 0 ? `
              <div style="margin-top: 1rem;">
                <strong>Key Milestones:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                  ${project.timeline.milestones.map(milestone => `
                    <li>
                      <strong>${milestone.name}:</strong> 
                      ${milestone.date ? new Date(milestone.date).toLocaleDateString() : 'TBD'}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      ${project.details && Object.keys(project.details).length > 0 ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;"><i class="ph ph-clipboard-text"></i> Project Details</h2>
            ${Object.keys(project.details).map(sectionId => {
              const section = project.details[sectionId];
              if (!section || Object.keys(section).length === 0) return '';
              
              const sectionLabels = {
                'site_preparation': 'Site Preparation',
                'foundation': 'Foundation & Structure',
                'utilities': 'Utilities & Services',
                'road_works': 'Road Works',
                'bridge_works': 'Bridge Works',
                'environmental': 'Environmental & Compliance',
                'quality_control': 'Quality Control & Testing',
                'building_specs': 'Building Specifications',
                'amenities': 'Amenities & Facilities',
                'finishes': 'Finishes & Materials',
                'building_type': 'Building Type & Use',
                'commercial_features': 'Commercial Features',
                'facility_type': 'Facility Type',
                'industrial_systems': 'Industrial Systems',
                'safety_compliance': 'Safety & Compliance'
              };
              
              return `
                <div style="margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
                  <h3 style="margin-bottom: 0.75rem; font-size: var(--font-size-lg);">
                    ${sectionLabels[sectionId] || sectionId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h3>
                  <div style="display: grid; gap: 0.75rem;">
                    ${Object.keys(section).map(fieldId => {
                      const value = section[fieldId];
                      if (value === null || value === undefined || value === '') return '';
                      
                      const fieldLabels = {
                        'land_clearing': 'Land Clearing',
                        'excavation': 'Excavation',
                        'site_survey': 'Site Survey & Layout',
                        'foundation_type': 'Foundation Type',
                        'foundation_details': 'Foundation Details',
                        'structural_system': 'Structural System',
                        'water_supply': 'Water Supply',
                        'sewerage': 'Sewerage System',
                        'electrical': 'Electrical',
                        'telecommunications': 'Telecommunications',
                        'road_length': 'Road Length (km)',
                        'road_width': 'Road Width (m)',
                        'lanes': 'Number of Lanes',
                        'pavement_type': 'Pavement Type',
                        'bridge_type': 'Bridge Type',
                        'span_length': 'Span Length (m)',
                        'bridge_width': 'Bridge Width (m)',
                        'load_capacity': 'Load Capacity'
                      };
                      
                      return `
                        <div>
                          <strong>${fieldLabels[fieldId] || fieldId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong>
                          <span style="color: var(--text-secondary);">${typeof value === 'object' ? JSON.stringify(value) : value}</span>
                        </div>
                      `;
                    }).filter(Boolean).join('')}
                  </div>
                </div>
              `;
            }).filter(Boolean).join('')}
          </div>
        </div>
      ` : ''}

      ${project.facilities && Object.keys(project.facilities).length > 0 ? `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;"><i class="ph ph-buildings"></i> Required Facilities</h2>
            ${project.facilities.site_office ? `
              <div style="margin-bottom: 1rem;">
                <strong>Site Office:</strong> Required
                ${project.facilities.site_office.office_size ? ` (${project.facilities.site_office.office_size} sqm)` : ''}
              </div>
            ` : ''}
            ${project.facilities.vehicles && project.facilities.vehicles.length > 0 ? `
              <div style="margin-bottom: 1rem;">
                <strong>Vehicles:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                  ${project.facilities.vehicles.map(v => `
                    <li>${v.type || 'Vehicle'}: ${v.quantity || 0}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            ${project.facilities.equipment && project.facilities.equipment.length > 0 ? `
              <div>
                <strong>Equipment:</strong>
                <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                  ${project.facilities.equipment.map(e => `
                    <li>${e.name || 'Equipment'}: ${e.specifications || 'N/A'}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}

      <div style="display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap;">
        ${canEdit ? `
          <a href="../projects/create/?id=${project.id}" class="btn btn-primary">
            <i class="ph ph-pencil"></i> Edit Project
          </a>
        ` : ''}
        ${project.status === 'draft' && canEdit ? `
          <button onclick="projectViewComponent.updateProjectStatus('${project.id}', 'active')" class="btn btn-success">
            <i class="ph ph-check"></i> Publish Project
          </button>
        ` : ''}
        ${canDelete ? `
          <button onclick="projectViewComponent.deleteProject('${project.id}')" class="btn btn-danger">
            <i class="ph ph-trash"></i> Delete Project
          </button>
        ` : ''}
        <a href="../create-proposal/?projectId=${project.id}" class="btn btn-primary">
          <i class="ph ph-file-text"></i> Submit Proposal
        </a>
        <a href="../projects/" class="btn btn-secondary">
          <i class="ph ph-arrow-left"></i> Back to Projects
        </a>
      </div>
    `;

    container.innerHTML = html;
  }

  function showError(message) {
    const container = document.getElementById('projectViewContent');
    if (container) {
      container.innerHTML = `<p class="alert alert-error">${message}</p>`;
    }
  }

  // Export
  if (!window.projects) window.projects = {};
  window.projects['project-view'] = {
    init,
    loadProject,
    updateProjectStatus,
    deleteProject
  };

  // Global reference for onclick handlers
  window.projectViewComponent = window.projects['project-view'];

})();

