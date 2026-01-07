/**
 * Service Engagements Feature
 * Handles service engagement listing and management
 */

(function() {
  'use strict';

  const ServiceEngagements = {
    async init() {
      await this.loadEngagements();
    },

    async loadEngagements() {
      const contentEl = document.getElementById('serviceEngagementsContent');
      if (!contentEl) return;

      let engagements = [];
      if (typeof ServiceEngagementService !== 'undefined') {
        engagements = ServiceEngagementService.getMyEngagements();
      }

      this.renderEngagements(engagements);
    },

    renderEngagements(engagements) {
      const contentEl = document.getElementById('serviceEngagementsContent');
      if (!contentEl) return;

      if (engagements.length === 0) {
        contentEl.innerHTML = '<div class="alert alert-info">No service engagements found.</div>';
        return;
      }

      const engagementsHtml = engagements.map(engagement => {
        const request = PMTwinData?.ServiceRequests?.getById?.(engagement.serviceRequestId);
        const provider = PMTwinData?.Users?.getById?.(engagement.serviceProviderUserId);
        const requester = request ? PMTwinData?.Users?.getById?.(request.requesterId) : null;

        const statusClass = {
          'ACTIVE': 'status-progress',
          'COMPLETED': 'status-completed',
          'TERMINATED': 'status-cancelled'
        }[engagement.status] || '';

        // Get linked projects info
        const linkedProjectsInfo = this.getLinkedProjectsInfo(engagement);
        
        return `
          <div class="card">
            <div class="card-header">
              <h3>${request?.title || 'Service Engagement'}</h3>
              <span class="status-badge ${statusClass}">${engagement.status}</span>
            </div>
            <div class="card-body">
              <div class="engagement-details">
                <div><strong>Service Request:</strong> ${request?.title || 'N/A'}</div>
                <div><strong>Service Provider:</strong> ${provider?.profile?.name || provider?.email || 'N/A'}</div>
                <div><strong>Requester:</strong> ${requester?.profile?.name || requester?.email || 'N/A'}</div>
                <div><strong>Started:</strong> ${new Date(engagement.startedAt).toLocaleDateString()}</div>
                ${engagement.completedAt ? `<div><strong>Completed:</strong> ${new Date(engagement.completedAt).toLocaleDateString()}</div>` : ''}
              </div>
              
              ${linkedProjectsInfo.length > 0 ? `
                <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary, #f5f5f5); border-radius: var(--radius, 8px);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <strong>Linked Projects:</strong>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${linkedProjectsInfo.map(projectInfo => `
                      <span class="badge badge-info" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                        ${projectInfo.title}
                        ${engagement.status === 'ACTIVE' ? `
                          <button onclick="ServiceEngagements.unlinkProject('${engagement.id}', '${projectInfo.id}', '${projectInfo.type}')" 
                                  style="background: none; border: none; color: inherit; cursor: pointer; padding: 0; margin-left: 0.25rem; font-size: 0.9em;" 
                                  title="Unlink">×</button>
                        ` : ''}
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${engagement.status === 'ACTIVE' ? `
                <div class="card-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <button class="btn btn-primary" onclick="ServiceEngagements.showLinkProjectModal('${engagement.id}')">
                    <i class="ph ph-link"></i> Link to Project
                  </button>
                  <button class="btn btn-success" onclick="ServiceEngagements.completeEngagement('${engagement.id}')">Mark as Completed</button>
                </div>
              ` : ''}
            </div>
          </div>
        `;
      }).join('');

      contentEl.innerHTML = engagementsHtml;
    },

    async completeEngagement(engagementId) {
      if (!confirm('Are you sure you want to mark this engagement as completed?')) return;

      if (typeof ServiceEngagementService !== 'undefined') {
        const result = ServiceEngagementService.completeEngagement(engagementId);
        if (result.success) {
          alert('Engagement marked as completed!');
          await this.loadEngagements();
        } else {
          alert('Error: ' + (result.error || 'Failed to complete engagement'));
        }
      }
    },

    getLinkedProjectsInfo(engagement) {
      const projectsInfo = [];
      
      // Get linked mega-project
      if (engagement.linkedMegaProjectId) {
        const megaProject = PMTwinData?.Projects?.getById?.(engagement.linkedMegaProjectId);
        if (megaProject) {
          projectsInfo.push({
            id: megaProject.id,
            title: megaProject.title || 'Mega-Project',
            type: 'megaproject'
          });
        }
      }
      
      // Get linked sub-projects
      if (engagement.linkedSubProjectIds && engagement.linkedSubProjectIds.length > 0) {
        engagement.linkedSubProjectIds.forEach(subProjectId => {
          // Find sub-project in all projects
          const allProjects = PMTwinData?.Projects?.getAll() || [];
          for (const project of allProjects) {
            if (project.subProjects) {
              const subProject = project.subProjects.find(sp => sp.id === subProjectId);
              if (subProject) {
                projectsInfo.push({
                  id: subProject.id,
                  title: subProject.title || 'Sub-Project',
                  type: 'subproject',
                  parentProjectId: project.id,
                  parentProjectTitle: project.title
                });
                break;
              }
            }
          }
        });
      }
      
      return projectsInfo;
    },

    async showLinkProjectModal(engagementId) {
      // Create modal
      const modal = document.createElement('div');
      modal.id = 'linkProjectModal';
      modal.style.cssText = `
        position: fixed; top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(0,0,0,0.5); z-index: 1000;
        display: flex; align-items: center; justify-content: center;
      `;
      
      // Get available projects
      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      let availableProjects = [];
      if (currentUser && PMTwinData?.Projects) {
        if (currentUser.role === 'entity' || currentUser.role === 'beneficiary' || currentUser.role === 'project_lead') {
          availableProjects = PMTwinData.Projects.getByCreator(currentUser.id);
        } else {
          availableProjects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public');
        }
      }
      
      // Build project options HTML
      let projectOptionsHtml = '<option value="">Select a project...</option>';
      availableProjects.forEach(project => {
        if (project.projectType === 'mega' || project.subProjects) {
          projectOptionsHtml += `<option value="mega_${project.id}">Mega-Project: ${project.title || 'Untitled'}</option>`;
          if (project.subProjects) {
            project.subProjects.forEach((subProject, index) => {
              projectOptionsHtml += `<option value="sub_${subProject.id || index}">  └ Sub-Project: ${subProject.title || `Sub-Project ${index + 1}`}</option>`;
            });
          }
        } else {
          projectOptionsHtml += `<option value="project_${project.id}">Project: ${project.title || 'Untitled'}</option>`;
        }
      });
      
      modal.innerHTML = `
        <div style="background: white; padding: 2rem; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h2 style="margin-top: 0;">Link to Project</h2>
          <form id="linkProjectForm">
            <div class="form-group">
              <label for="linkProjectSelect">Select Project or Sub-Project:</label>
              <select id="linkProjectSelect" class="form-control" required>
                ${projectOptionsHtml}
              </select>
            </div>
            <div class="form-actions" style="margin-top: 1rem; display: flex; gap: 0.5rem; justify-content: flex-end;">
              <button type="button" class="btn btn-secondary" onclick="ServiceEngagements.closeLinkProjectModal()">Cancel</button>
              <button type="submit" class="btn btn-primary">Link Project</button>
            </div>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Handle form submission
      const form = document.getElementById('linkProjectForm');
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const select = document.getElementById('linkProjectSelect');
        const value = select.value;
        
        if (!value) {
          alert('Please select a project or sub-project');
          return;
        }
        
        const [type, id] = value.split('_');
        
        if (type === 'mega') {
          await this.linkToMegaProject(engagementId, id);
        } else if (type === 'sub') {
          await this.linkToSubProject(engagementId, id);
        }
        
        this.closeLinkProjectModal();
      });
      
      // Close on background click
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeLinkProjectModal();
        }
      });
    },

    closeLinkProjectModal() {
      const modal = document.getElementById('linkProjectModal');
      if (modal) {
        modal.remove();
      }
    },

    async linkToSubProject(engagementId, subProjectId) {
      if (typeof ServiceEngagementService !== 'undefined') {
        const result = ServiceEngagementService.linkEngagementToSubProject(engagementId, subProjectId);
        if (result.success) {
          alert('Engagement linked to sub-project successfully!');
          await this.loadEngagements();
        } else {
          alert('Error: ' + (result.error || 'Failed to link engagement'));
        }
      }
    },

    async linkToMegaProject(engagementId, megaProjectId) {
      if (typeof ServiceEngagementService !== 'undefined') {
        const result = ServiceEngagementService.linkEngagementToMegaProject(engagementId, megaProjectId);
        if (result.success) {
          alert('Engagement linked to mega-project successfully!');
          await this.loadEngagements();
        } else {
          alert('Error: ' + (result.error || 'Failed to link engagement'));
        }
      }
    },

    async unlinkProject(engagementId, projectId, projectType) {
      if (!confirm('Are you sure you want to unlink this project?')) return;
      
      if (typeof ServiceEngagementService !== 'undefined') {
        const engagement = ServiceEngagementService.getEngagement(engagementId);
        if (!engagement) {
          alert('Engagement not found');
          return;
        }
        
        let result = null;
        if (projectType === 'subproject') {
          const updatedSubProjectIds = (engagement.linkedSubProjectIds || []).filter(id => id !== projectId);
          result = ServiceEngagementService.updateEngagementStatus(engagementId, engagement.status, {
            linkedSubProjectIds: updatedSubProjectIds
          });
        } else if (projectType === 'megaproject') {
          result = ServiceEngagementService.updateEngagementStatus(engagementId, engagement.status, {
            linkedMegaProjectId: null
          });
        }
        
        if (result && result.success) {
          alert('Project unlinked successfully!');
          await this.loadEngagements();
        } else {
          alert('Error: ' + (result?.error || 'Failed to unlink project'));
        }
      }
    }
  };

  window.ServiceEngagements = ServiceEngagements;

})();

