/**
 * Project Create Component - HTML triggers for ProjectService functions
 */

(function() {
  'use strict';

  function init(params) {
    // Check if editing existing project
    if (params && params.id) {
      loadProjectForEdit(params.id);
    }
  }

  // ============================================
  // HTML Triggers for ProjectService Functions
  // ============================================

  // Trigger: createProject(projectData) - Create new project
  async function handleSubmit(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('projectCreateMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
      messageDiv.className = '';
    }

    try {
      // Collect form data
      const projectData = {
        title: document.getElementById('projectTitle').value,
        description: document.getElementById('projectDescription').value,
        category: document.getElementById('projectCategory').value,
        location: {
          city: document.getElementById('projectCity').value,
          region: document.getElementById('projectRegion').value,
          country: 'Saudi Arabia'
        },
        scope: {
          requiredServices: document.getElementById('requiredServices').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s),
          skillRequirements: document.getElementById('requiredSkills').value
            .split(',')
            .map(s => s.trim())
            .filter(s => s)
        },
        budget: {
          min: parseFloat(document.getElementById('minBudget').value) || 0,
          max: parseFloat(document.getElementById('maxBudget').value) || 0,
          currency: 'SAR'
        },
        status: document.getElementById('projectStatus').value,
        visibility: 'public'
      };

      // Call service
      let result;
      if (typeof ProjectService !== 'undefined') {
        result = await ProjectService.createProject(projectData);
      } else {
        showMessage('Project service not available', 'error');
        return false;
      }

      if (result.success) {
        showMessage('Project created successfully!', 'success');
        setTimeout(() => {
          window.location.href = `project.html?id=${result.project.id}`;
        }, 1500);
      } else {
        showMessage(result.error || 'Failed to create project', 'error');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showMessage('An error occurred while creating the project', 'error');
    }

    return false;
  }

  // Trigger: getProjectById(projectId) - Load project for editing
  async function loadProjectForEdit(projectId) {
    try {
      if (typeof ProjectService === 'undefined') {
        showMessage('Project service not available', 'error');
        return;
      }

      const result = await ProjectService.getProjectById(projectId);
      
      if (result.success && result.project) {
        populateForm(result.project);
      } else {
        showMessage(result.error || 'Failed to load project', 'error');
      }
    } catch (error) {
      console.error('Error loading project:', error);
      showMessage('Error loading project for editing', 'error');
    }
  }

  // Trigger: updateProject(projectId, updates) - Update project
  async function updateProject(projectId, updates) {
    try {
      if (typeof ProjectService === 'undefined') {
        return { success: false, error: 'Project service not available' };
      }

      const result = await ProjectService.updateProject(projectId, updates);
      return result;
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error: 'Error updating project' };
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
        window.location.href = 'projects.html';
      } else {
        alert(result.error || 'Failed to delete project');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error deleting project');
    }
  }

  // ============================================
  // Helper Functions
  // ============================================

  function populateForm(project) {
    document.getElementById('projectTitle').value = project.title || '';
    document.getElementById('projectDescription').value = project.description || '';
    document.getElementById('projectCategory').value = project.category || '';
    document.getElementById('projectCity').value = project.location?.city || '';
    document.getElementById('projectRegion').value = project.location?.region || '';
    document.getElementById('requiredServices').value = project.scope?.requiredServices?.join(', ') || '';
    document.getElementById('requiredSkills').value = project.scope?.skillRequirements?.join(', ') || '';
    document.getElementById('minBudget').value = project.budget?.min || '';
    document.getElementById('maxBudget').value = project.budget?.max || '';
    document.getElementById('projectStatus').value = project.status || 'draft';
  }

  function showMessage(message, type) {
    const messageDiv = document.getElementById('projectCreateMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      messageDiv.style.display = 'block';
    }
  }

  // Export
  if (!window.projects) window.projects = {};
  window.projects['project-create'] = {
    init,
    handleSubmit,
    loadProjectForEdit,
    updateProject,
    deleteProject
  };

  // Global reference for form onsubmit
  window.projectCreateComponent = window.projects['project-create'];

})();

