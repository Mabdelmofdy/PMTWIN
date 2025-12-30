/**
 * Sub-Project Manager
 * Handles creation and management of multiple sub-projects/phases for mega-projects
 */

(function() {
  'use strict';

  let subProjects = [];
  let currentSubProjectIndex = -1;

  // ============================================
  // Initialize Sub-Project Manager
  // ============================================
  function init() {
    // Set up event listeners
    const addSubProjectBtn = document.getElementById('addSubProjectBtn');
    if (addSubProjectBtn) {
      addSubProjectBtn.addEventListener('click', addSubProject);
    }

    // Initialize with first sub-project if in mega-project mode
    const projectMode = getProjectMode();
    if (projectMode === 'mega') {
      addSubProject();
    }
  }

  // ============================================
  // Get Project Mode
  // ============================================
  function getProjectMode() {
    const modeSelect = document.getElementById('projectMode');
    return modeSelect ? modeSelect.value : 'single';
  }

  // ============================================
  // Add Sub-Project
  // ============================================
  function addSubProject() {
    const index = subProjects.length;
    const subProject = {
      id: `subproject_${Date.now()}_${index}`,
      index: index,
      title: '',
      description: '',
      category: '',
      location: {
        city: '',
        region: ''
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
      status: 'draft'
    };

    subProjects.push(subProject);
    renderSubProjectList();
    selectSubProject(index);
    
    return subProject;
  }

  // ============================================
  // Remove Sub-Project
  // ============================================
  function removeSubProject(index) {
    if (subProjects.length <= 1) {
      alert('At least one sub-project is required for mega-projects.');
      return;
    }

    if (confirm('Are you sure you want to remove this sub-project? This action cannot be undone.')) {
      subProjects.splice(index, 1);
      
      // Re-index remaining sub-projects
      subProjects.forEach((sp, i) => {
        sp.index = i;
      });

      renderSubProjectList();
      
      // Select the first sub-project if current was removed
      if (currentSubProjectIndex >= subProjects.length) {
        selectSubProject(0);
      } else if (currentSubProjectIndex === index) {
        selectSubProject(Math.max(0, index - 1));
      }
    }
  }

  // ============================================
  // Select Sub-Project
  // ============================================
  function selectSubProject(index) {
    if (index < 0 || index >= subProjects.length) {
      return;
    }

    // Save current sub-project before switching
    if (currentSubProjectIndex >= 0 && currentSubProjectIndex < subProjects.length) {
      saveCurrentSubProject();
    }

    currentSubProjectIndex = index;
    const subProject = subProjects[index];

    // Update UI
    document.querySelectorAll('.sub-project-item').forEach((item, i) => {
      if (i === index) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Populate form with sub-project data
    populateFormFromSubProject(subProject);

    // Update sub-project title in form
    updateSubProjectFormTitle();
    
    // Reset to first tab when switching sub-projects
    if (typeof TabManager !== 'undefined') {
      TabManager.goToTab('basic');
    }
  }

  // ============================================
  // Save Current Sub-Project Data
  // ============================================
  function saveCurrentSubProject() {
    if (currentSubProjectIndex < 0 || currentSubProjectIndex >= subProjects.length) {
      return;
    }

    const subProject = subProjects[currentSubProjectIndex];
    
    // Collect form data
    if (typeof ProjectFormBuilder !== 'undefined') {
      const formData = ProjectFormBuilder.collectFormData();
      
      // Update sub-project with form data
      subProject.title = formData.basic.title || '';
      subProject.description = formData.basic.description || '';
      subProject.category = formData.basic.category || '';
      subProject.location = {
        city: formData.basic.city || '',
        region: formData.basic.region || '',
        country: 'Saudi Arabia'
      };
      subProject.scope = formData.scope || {};
      subProject.budget = formData.budget || {};
      subProject.details = formData.details || {};
      subProject.timeline = formData.timeline || {};
      subProject.facilities = formData.facilities || {};
      subProject.attachments = formData.attachments || {};
      subProject.status = document.getElementById('projectStatus')?.value || 'draft';
    } else {
      // Fallback to manual collection
      subProject.title = document.getElementById('projectTitle')?.value || '';
      subProject.description = document.getElementById('projectDescription')?.value || '';
      subProject.category = document.getElementById('projectCategory')?.value || '';
      subProject.location = {
        city: document.getElementById('projectCity')?.value || '',
        region: document.getElementById('projectRegion')?.value || '',
        country: 'Saudi Arabia'
      };
    }

    // Update sub-project list display
    updateSubProjectListItem(currentSubProjectIndex);
  }

  // ============================================
  // Populate Form from Sub-Project
  // ============================================
  function populateFormFromSubProject(subProject) {
    // Populate form fields
    const titleField = document.getElementById('projectTitle');
    const descField = document.getElementById('projectDescription');
    const categoryField = document.getElementById('projectCategory');
    const cityField = document.getElementById('projectCity');
    const regionField = document.getElementById('projectRegion');
    const servicesField = document.getElementById('requiredServices');
    const skillsField = document.getElementById('requiredSkills');
    const minBudgetField = document.getElementById('minBudget');
    const maxBudgetField = document.getElementById('maxBudget');
    const statusField = document.getElementById('projectStatus');

    if (titleField) titleField.value = subProject.title || '';
    if (descField) descField.value = subProject.description || '';
    if (categoryField) categoryField.value = subProject.category || '';
    if (cityField) cityField.value = subProject.location?.city || '';
    if (regionField) regionField.value = subProject.location?.region || '';
    if (servicesField) servicesField.value = subProject.scope?.requiredServices?.join(', ') || '';
    if (skillsField) skillsField.value = subProject.scope?.skillRequirements?.join(', ') || '';
    if (minBudgetField) minBudgetField.value = subProject.budget?.min || '';
    if (maxBudgetField) maxBudgetField.value = subProject.budget?.max || '';
    if (statusField) statusField.value = subProject.status || 'draft';

    // Trigger category change if category is set
    if (subProject.category && categoryField) {
      const event = new Event('change');
      categoryField.dispatchEvent(event);
      
      // Wait for form to render, then populate details
      setTimeout(() => {
        populateSubProjectDetails(subProject);
      }, 500);
    }

    // Populate timeline and facilities
    populateSubProjectCommonFields(subProject);
  }

  // ============================================
  // Populate Sub-Project Details
  // ============================================
  function populateSubProjectDetails(subProject) {
    if (!subProject.details) return;

    Object.keys(subProject.details).forEach(sectionId => {
      const sectionData = subProject.details[sectionId];
      Object.keys(sectionData).forEach(fieldId => {
        const fieldElement = document.querySelector(`[name="projectDetails[${sectionId}][${fieldId}]"]`);
        if (fieldElement) {
          fieldElement.value = sectionData[fieldId];
        }
      });
    });
  }

  // ============================================
  // Populate Sub-Project Common Fields
  // ============================================
  function populateSubProjectCommonFields(subProject) {
    // Timeline
    if (subProject.timeline) {
      if (subProject.timeline.start_date) {
        const startDateField = document.querySelector('[name*="timeline"][name*="start_date"]');
        if (startDateField) startDateField.value = subProject.timeline.start_date;
      }
      if (subProject.timeline.duration) {
        const durationField = document.querySelector('[name*="timeline"][name*="duration"]');
        if (durationField) durationField.value = subProject.timeline.duration;
      }
    }

    // Facilities
    if (subProject.facilities) {
      Object.keys(subProject.facilities).forEach(fieldId => {
        const fieldElement = document.querySelector(`[name*="facilities"][name*="${fieldId}"]`);
        if (fieldElement) {
          if (fieldElement.type === 'checkbox') {
            fieldElement.checked = subProject.facilities[fieldId];
          } else {
            fieldElement.value = subProject.facilities[fieldId];
          }
        }
      });
    }
  }

  // ============================================
  // Render Sub-Project List
  // ============================================
  function renderSubProjectList() {
    const container = document.getElementById('subProjectsList');
    if (!container) return;

    if (subProjects.length === 0) {
      container.innerHTML = '<p style="color: var(--text-secondary); padding: 1rem; text-align: center;">No sub-projects added yet. Click "Add Sub-Project" to get started.</p>';
      return;
    }

    let html = '<div class="sub-projects-list">';
    
    subProjects.forEach((subProject, index) => {
      const title = subProject.title || `Sub-Project ${index + 1}`;
      const category = subProject.category || 'Not selected';
      const isActive = index === currentSubProjectIndex;
      
      html += `
        <div class="sub-project-item ${isActive ? 'active' : ''}" data-index="${index}">
          <div class="sub-project-header" onclick="SubProjectManager.selectSubProject(${index})">
            <div class="sub-project-info">
              <div class="sub-project-title">${title}</div>
              <div class="sub-project-meta">
                <span class="sub-project-category">${category}</span>
                ${subProject.budget?.min || subProject.budget?.max ? 
                  `<span class="sub-project-budget">${(subProject.budget.min || 0).toLocaleString()} - ${(subProject.budget.max || 0).toLocaleString()} SAR</span>` : 
                  ''}
              </div>
            </div>
            <div class="sub-project-actions">
              <button type="button" class="btn btn-sm btn-icon" onclick="event.stopPropagation(); SubProjectManager.selectSubProject(${index})" title="Edit">
                <i class="ph ph-pencil"></i>
              </button>
              <button type="button" class="btn btn-sm btn-icon btn-danger" onclick="event.stopPropagation(); SubProjectManager.removeSubProject(${index})" title="Remove">
                <i class="ph ph-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  // ============================================
  // Update Sub-Project List Item
  // ============================================
  function updateSubProjectListItem(index) {
    if (index < 0 || index >= subProjects.length) return;

    const subProject = subProjects[index];
    const item = document.querySelector(`.sub-project-item[data-index="${index}"]`);
    if (!item) return;

    const titleEl = item.querySelector('.sub-project-title');
    const categoryEl = item.querySelector('.sub-project-category');
    const budgetEl = item.querySelector('.sub-project-budget');

    if (titleEl) {
      titleEl.textContent = subProject.title || `Sub-Project ${index + 1}`;
    }
    if (categoryEl) {
      categoryEl.textContent = subProject.category || 'Not selected';
    }
    if (budgetEl) {
      if (subProject.budget?.min || subProject.budget?.max) {
        budgetEl.textContent = `${(subProject.budget.min || 0).toLocaleString()} - ${(subProject.budget.max || 0).toLocaleString()} SAR`;
        budgetEl.style.display = 'inline';
      } else {
        budgetEl.style.display = 'none';
      }
    }
  }

  // ============================================
  // Update Sub-Project Form Title
  // ============================================
  function updateSubProjectFormTitle() {
    const formTitle = document.getElementById('projectFormTitle');
    if (formTitle) {
      if (currentSubProjectIndex >= 0 && currentSubProjectIndex < subProjects.length) {
        const subProject = subProjects[currentSubProjectIndex];
        const title = subProject.title || 'Untitled';
        formTitle.textContent = `Sub-Project ${currentSubProjectIndex + 1}: ${title}`;
        formTitle.style.display = 'block';
      } else {
        formTitle.style.display = 'none';
      }
    }
  }

  // ============================================
  // Get All Sub-Projects
  // ============================================
  function getAllSubProjects() {
    // Save current sub-project before returning
    saveCurrentSubProject();
    return subProjects;
  }

  // ============================================
  // Get Current Sub-Project
  // ============================================
  function getCurrentSubProject() {
    if (currentSubProjectIndex >= 0 && currentSubProjectIndex < subProjects.length) {
      saveCurrentSubProject();
      return subProjects[currentSubProjectIndex];
    }
    return null;
  }

  // ============================================
  // Clear All Sub-Projects
  // ============================================
  function clearAll() {
    subProjects = [];
    currentSubProjectIndex = -1;
    renderSubProjectList();
  }

  // ============================================
  // Validate All Sub-Projects
  // ============================================
  function validateAll() {
    saveCurrentSubProject();
    
    const errors = [];
    subProjects.forEach((subProject, index) => {
      if (!subProject.title) {
        errors.push(`Sub-Project ${index + 1}: Title is required`);
      }
      if (!subProject.category) {
        errors.push(`Sub-Project ${index + 1}: Category is required`);
      }
      if (!subProject.location?.city || !subProject.location?.region) {
        errors.push(`Sub-Project ${index + 1}: Location (city and region) is required`);
      }
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ============================================
  // Public API
  // ============================================
  window.SubProjectManager = {
    init,
    addSubProject,
    removeSubProject,
    selectSubProject,
    saveCurrentSubProject,
    getAllSubProjects,
    getCurrentSubProject,
    clearAll,
    validateAll,
    getProjectMode,
    updateSubProjectFormTitle
  };

})();

