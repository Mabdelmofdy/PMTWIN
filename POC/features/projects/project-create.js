/**
 * Project Create Component - HTML triggers for ProjectService functions
 */

(function() {
  'use strict';

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

  async function init(params) {
    // Load category configuration
    if (typeof ProjectFormBuilder !== 'undefined') {
      await ProjectFormBuilder.loadCategoryConfig();
      
      // Render common fields (timeline, facilities, attachments)
      ProjectFormBuilder.renderCommonFields('commonFields');
      
      // Listen for category changes
      const categorySelect = document.getElementById('projectCategory');
      if (categorySelect) {
        categorySelect.addEventListener('change', handleCategoryChange);
        
        // Also update details badge when category is selected
        categorySelect.addEventListener('change', function() {
          const detailsBadge = document.getElementById('detailsBadge');
          if (detailsBadge && this.value) {
            detailsBadge.style.display = 'inline-flex';
          } else if (detailsBadge) {
            detailsBadge.style.display = 'none';
          }
        });
      }
    }

    // Initialize collaboration models selector
    if (typeof CollaborationModelsSelector !== 'undefined') {
      CollaborationModelsSelector.init(handleCollaborationModelSelection);
    }

    // Check if editing existing project - try query params first, then params
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('id') || (params && params.id);
    if (projectId) {
      loadProjectForEdit(projectId);
    }
  }

  // ============================================
  // Handle Collaboration Model Selection
  // ============================================
  function handleCollaborationModelSelection(selectedModelIds) {
    if (typeof CollaborationModelFields !== 'undefined') {
      CollaborationModelFields.renderFields(selectedModelIds);
    }
  }

  // ============================================
  // Handle Category Change
  // ============================================
  async function handleCategoryChange(event) {
    const category = event.target.value;
    const container = document.getElementById('categoryDetailsContainer');
    const detailsDiv = document.getElementById('categoryDetails');
    const noCategoryMessage = document.getElementById('noCategoryMessage');
    const detailsBadge = document.getElementById('detailsBadge');

    if (!category || !container || !detailsDiv) {
      // Hide details if no category selected
      if (container) container.style.display = 'none';
      if (noCategoryMessage) noCategoryMessage.style.display = 'block';
      if (detailsBadge) detailsBadge.style.display = 'none';
      return;
    }

    if (typeof ProjectFormBuilder === 'undefined') {
      console.error('[ProjectCreate] ProjectFormBuilder not available');
      return;
    }

    // Show container and render category-specific details
    container.style.display = 'block';
    if (noCategoryMessage) noCategoryMessage.style.display = 'none';
    if (detailsBadge) detailsBadge.style.display = 'inline-flex';
    
    ProjectFormBuilder.renderCategoryDetails('categoryDetails', category);
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
      // Check project mode
      const projectMode = document.getElementById('projectMode')?.value || 'single';
      
      if (projectMode === 'mega') {
        // Handle mega-project with sub-projects
        return await handleMegaProjectSubmit();
      } else {
        // Handle single project
        return await handleSingleProjectSubmit();
      }
    } catch (error) {
      console.error('Error creating project:', error);
      showMessage('An error occurred while creating the project', 'error');
      return false;
    }
  }

  // ============================================
  // Handle Single Project Submit
  // ============================================
  async function handleSingleProjectSubmit() {
    // Collect form data using ProjectFormBuilder if available
    let formData;
    if (typeof ProjectFormBuilder !== 'undefined') {
      formData = ProjectFormBuilder.collectFormData();
    } else {
      // Fallback to basic data collection
      formData = {
        basic: {
          title: document.getElementById('projectTitle').value,
          description: document.getElementById('projectDescription').value,
          category: document.getElementById('projectCategory').value,
          city: document.getElementById('projectCity').value,
          region: document.getElementById('projectRegion').value
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
        details: {},
        timeline: {},
        facilities: {},
        attachments: {}
      };
    }

    // Collect collaboration models data
    let collaborationModels = null;
    if (typeof CollaborationModelsSelector !== 'undefined' && typeof CollaborationModelFields !== 'undefined') {
      const selectedModels = CollaborationModelsSelector.getSelectedModels();
      const modelData = CollaborationModelFields.collectModelData();
      
      if (selectedModels.length > 0) {
        collaborationModels = {
          selectedModels: selectedModels,
          modelData: modelData
        };
      }
    }

    // Build project data structure
    const projectData = {
      title: formData.basic.title,
      description: formData.basic.description,
      category: formData.basic.category,
      location: {
        city: formData.basic.city,
        region: formData.basic.region,
        country: 'Saudi Arabia'
      },
      scope: {
        requiredServices: formData.scope.requiredServices || [],
        skillRequirements: formData.scope.skillRequirements || []
      },
      budget: {
        min: formData.budget.min || 0,
        max: formData.budget.max || 0,
        currency: formData.budget.currency || 'SAR'
      },
      // Include category-specific details
      details: formData.details || {},
      // Include timeline
      timeline: formData.timeline || {},
      // Include facilities
      facilities: formData.facilities || {},
      // Include attachments metadata (files will be handled separately)
      attachments: formData.attachments || {},
      // Include collaboration models
      collaborationModels: collaborationModels,
      status: document.getElementById('projectStatus').value,
      visibility: 'public',
      projectType: 'single'
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
        window.location.href = `${getBasePath()}project/?id=${result.project.id}`;
      }, 1500);
    } else {
      showMessage(result.error || 'Failed to create project', 'error');
    }

    return false;
  }

  // ============================================
  // Handle Mega-Project Submit
  // ============================================
  async function handleMegaProjectSubmit() {
    // Validate all sub-projects
    if (typeof SubProjectManager === 'undefined') {
      showMessage('Sub-project manager not available', 'error');
      return false;
    }

    const validation = SubProjectManager.validateAll();
    if (!validation.valid) {
      showMessage('Please fix the following errors:\n' + validation.errors.join('\n'), 'error');
      return false;
    }

    // Get all sub-projects
    const subProjects = SubProjectManager.getAllSubProjects();
    if (subProjects.length === 0) {
      showMessage('Please add at least one sub-project', 'error');
      return false;
    }

    // Collect mega-project parent data (from first sub-project or form)
    const firstSubProject = subProjects[0];
    
    // Build mega-project data structure
    const megaProjectData = {
      title: firstSubProject.title || 'Mega-Project',
      description: `Mega-project with ${subProjects.length} sub-project(s)`,
      category: firstSubProject.category || 'Infrastructure',
      location: firstSubProject.location || {
        city: '',
        region: '',
        country: 'Saudi Arabia'
      },
      scope: {
        requiredServices: [],
        skillRequirements: []
      },
      budget: {
        min: 0,
        max: 0,
        currency: 'SAR'
      },
      details: {},
      timeline: {},
      facilities: {},
      attachments: {},
      status: document.getElementById('projectStatus')?.value || 'draft',
      visibility: 'public',
      projectType: 'mega',
      subProjects: subProjects.map((sp, index) => ({
        id: sp.id,
        index: index,
        title: sp.title,
        description: sp.description,
        category: sp.category,
        location: sp.location,
        scope: sp.scope,
        budget: sp.budget,
        details: sp.details,
        timeline: sp.timeline,
        facilities: sp.facilities,
        attachments: sp.attachments,
        status: sp.status
      }))
    };

    // Calculate total budget from all sub-projects
    subProjects.forEach(sp => {
      if (sp.budget) {
        megaProjectData.budget.min += sp.budget.min || 0;
        megaProjectData.budget.max += sp.budget.max || 0;
      }
    });

    // Aggregate required services and skills
    subProjects.forEach(sp => {
      if (sp.scope) {
        if (sp.scope.requiredServices) {
          megaProjectData.scope.requiredServices = [
            ...new Set([...megaProjectData.scope.requiredServices, ...sp.scope.requiredServices])
          ];
        }
        if (sp.scope.skillRequirements) {
          megaProjectData.scope.skillRequirements = [
            ...new Set([...megaProjectData.scope.skillRequirements, ...sp.scope.skillRequirements])
          ];
        }
      }
    });

    // Collect collaboration models data for mega-project
    if (typeof CollaborationModelsSelector !== 'undefined' && typeof CollaborationModelFields !== 'undefined') {
      const selectedModels = CollaborationModelsSelector.getSelectedModels();
      const modelData = CollaborationModelFields.collectModelData();
      
      if (selectedModels.length > 0) {
        megaProjectData.collaborationModels = {
          selectedModels: selectedModels,
          modelData: modelData
        };
      }
    }

    // Call service
    let result;
    if (typeof ProjectService !== 'undefined') {
      result = await ProjectService.createProject(megaProjectData);
    } else {
      showMessage('Project service not available', 'error');
      return false;
    }

    if (result.success) {
      showMessage(`Mega-project created successfully with ${subProjects.length} sub-project(s)!`, 'success');
      setTimeout(() => {
        window.location.href = `${getBasePath()}project/?id=${result.project.id}`;
      }, 1500);
    } else {
      showMessage(result.error || 'Failed to create mega-project', 'error');
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
  // Helper Functions
  // ============================================

  async function populateForm(project) {
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

    // Trigger category change to load dynamic fields
    if (project.category) {
      const categorySelect = document.getElementById('projectCategory');
      if (categorySelect) {
        // Create and dispatch change event
        const event = new Event('change');
        categorySelect.dispatchEvent(event);
        
        // Wait a bit for form to render, then populate details
        setTimeout(() => {
          populateDetails(project);
        }, 500);
      }
    }
  }

  function populateDetails(project) {
    // Populate category-specific details
    if (project.details) {
      Object.keys(project.details).forEach(sectionId => {
        const sectionData = project.details[sectionId];
        Object.keys(sectionData).forEach(fieldId => {
          const fieldElement = document.querySelector(`[name="projectDetails[${sectionId}][${fieldId}]"]`);
          if (fieldElement) {
            fieldElement.value = sectionData[fieldId];
          }
        });
      });
    }

    // Populate timeline
    if (project.timeline) {
      if (project.timeline.start_date) {
        const startDateField = document.querySelector('[name*="timeline"][name*="start_date"]');
        if (startDateField) startDateField.value = project.timeline.start_date;
      }
      if (project.timeline.duration) {
        const durationField = document.querySelector('[name*="timeline"][name*="duration"]');
        if (durationField) durationField.value = project.timeline.duration;
      }
      // Handle milestones dynamically
      if (project.timeline.milestones && Array.isArray(project.timeline.milestones)) {
        // This would require adding items dynamically
        // For now, we'll handle it in a future enhancement
      }
    }

    // Populate facilities
    if (project.facilities) {
      // Handle facilities fields
      Object.keys(project.facilities).forEach(fieldId => {
        const fieldElement = document.querySelector(`[name*="facilities"][name*="${fieldId}"]`);
        if (fieldElement) {
          if (fieldElement.type === 'checkbox') {
            fieldElement.checked = project.facilities[fieldId];
          } else {
            fieldElement.value = project.facilities[fieldId];
          }
        }
      });
    }
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

