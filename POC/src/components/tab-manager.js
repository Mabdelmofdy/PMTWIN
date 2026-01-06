/**
 * Tab Manager
 * Handles tab navigation and form progress tracking
 */

(function() {
  'use strict';

  const tabs = ['basic', 'scope', 'details', 'timeline', 'review'];
  let currentTabIndex = 0;

  // ============================================
  // Initialize Tabs
  // ============================================
  function init() {
    // Set up tab navigation
    document.querySelectorAll('.tab-nav-item').forEach((tab, index) => {
      tab.addEventListener('click', () => switchTab(index));
    });

    // Set up navigation buttons
    const prevBtn = document.getElementById('prevTabBtn');
    const nextBtn = document.getElementById('nextTabBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => switchTab(currentTabIndex - 1));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (validateCurrentTab()) {
          switchTab(currentTabIndex + 1);
        }
      });
    }

    // Update UI on initial load
    updateTabUI();
  }

  // ============================================
  // Switch Tab
  // ============================================
  function switchTab(index) {
    if (index < 0 || index >= tabs.length) {
      return;
    }

    // Validate before leaving current tab (except when going back)
    if (index > currentTabIndex && !validateCurrentTab()) {
      return;
    }

    // Save current sub-project data if in mega-project mode
    if (typeof SubProjectManager !== 'undefined' && SubProjectManager.getProjectMode() === 'mega') {
      SubProjectManager.saveCurrentSubProject();
    }

    currentTabIndex = index;
    const tabId = tabs[index];

    // Update tab navigation
    document.querySelectorAll('.tab-nav-item').forEach((tab, i) => {
      if (i === index) {
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach((content, i) => {
      if (i === index) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // Update UI
    updateTabUI();

    // Special handling for details tab
    if (tabId === 'details') {
      handleDetailsTab();
      
      // If category is selected, ensure details are rendered
      const category = document.getElementById('projectCategory');
      if (category && category.value && typeof ProjectFormBuilder !== 'undefined') {
        // Trigger category change to render details if not already rendered
        const detailsContainer = document.getElementById('categoryDetails');
        if (detailsContainer && detailsContainer.children.length === 0) {
          ProjectFormBuilder.renderCategoryDetails('categoryDetails', category.value);
        }
      }
    }

    // Special handling for review tab
    if (tabId === 'review') {
      const projectMode = typeof SubProjectManager !== 'undefined' ? SubProjectManager.getProjectMode() : 'single';
      if (projectMode === 'mega') {
        updateMegaProjectSummary();
      } else {
        updateProjectSummary();
      }
    }
  }

  // ============================================
  // Update Tab UI
  // ============================================
  function updateTabUI() {
    const prevBtn = document.getElementById('prevTabBtn');
    const nextBtn = document.getElementById('nextTabBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');

    // Show/hide navigation buttons
    if (prevBtn) {
      prevBtn.style.display = currentTabIndex > 0 ? 'flex' : 'none';
    }

    if (nextBtn) {
      nextBtn.style.display = currentTabIndex < tabs.length - 1 ? 'flex' : 'none';
    }

    if (submitBtn) {
      submitBtn.style.display = currentTabIndex === tabs.length - 1 ? 'flex' : 'none';
    }

    // Update progress
    const progress = ((currentTabIndex + 1) / tabs.length) * 100;
    if (progressFill) {
      progressFill.style.width = `${progress}%`;
    }

    if (progressText) {
      progressText.textContent = `Step ${currentTabIndex + 1} of ${tabs.length}`;
    }
  }

  // ============================================
  // Validate Current Tab
  // ============================================
  function validateCurrentTab() {
    const tabId = tabs[currentTabIndex];
    const tabContent = document.getElementById(`tab-${tabId}`);

    if (!tabContent) {
      return true;
    }

    // Get all required fields in current tab
    const requiredFields = tabContent.querySelectorAll('[required]');
    let isValid = true;
    const firstInvalid = [];

    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        isValid = false;
        field.classList.add('error');
        if (firstInvalid.length === 0) {
          firstInvalid.push(field);
        }
      } else {
        field.classList.remove('error');
      }
    });

    // Special validation for basic tab
    if (tabId === 'basic') {
      const category = document.getElementById('projectCategory');
      if (!category || !category.value) {
        isValid = false;
        if (category) category.classList.add('error');
      }
    }

    // Special validation for details tab
    if (tabId === 'details') {
      const category = document.getElementById('projectCategory');
      if (!category || !category.value) {
        showMessage('Please select a category in the Basic Info tab first.', 'error');
        return false;
      }
    }

    if (!isValid) {
      showMessage('Please fill in all required fields before proceeding.', 'error');
      if (firstInvalid.length > 0) {
        firstInvalid[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalid[0].focus();
      }
    } else {
      // Clear any error messages
      const messageDiv = document.getElementById('projectCreateMessage');
      if (messageDiv) {
        messageDiv.style.display = 'none';
      }
    }

    return isValid;
  }

  // ============================================
  // Handle Details Tab
  // ============================================
  function handleDetailsTab() {
    const category = document.getElementById('projectCategory');
    const categoryDetailsContainer = document.getElementById('categoryDetailsContainer');
    const noCategoryMessage = document.getElementById('noCategoryMessage');

    if (!category || !category.value) {
      if (categoryDetailsContainer) {
        categoryDetailsContainer.style.display = 'none';
      }
      if (noCategoryMessage) {
        noCategoryMessage.style.display = 'block';
      }
    } else {
      if (noCategoryMessage) {
        noCategoryMessage.style.display = 'none';
      }
      if (categoryDetailsContainer) {
        categoryDetailsContainer.style.display = 'block';
      }
    }
  }

  // ============================================
  // Update Project Summary
  // ============================================
  function updateProjectSummary() {
    const summaryDiv = document.getElementById('projectSummary');
    if (!summaryDiv) return;

    const title = document.getElementById('projectTitle')?.value || 'Not specified';
    const description = document.getElementById('projectDescription')?.value || 'Not specified';
    const category = document.getElementById('projectCategory')?.value || 'Not selected';
    const city = document.getElementById('projectCity')?.value || 'Not specified';
    const region = document.getElementById('projectRegion')?.value || 'Not specified';
    const services = document.getElementById('requiredServices')?.value || 'None';
    const skills = document.getElementById('requiredSkills')?.value || 'None';
    const minBudget = document.getElementById('minBudget')?.value || '0';
    const maxBudget = document.getElementById('maxBudget')?.value || '0';
    const status = document.getElementById('projectStatus')?.value || 'draft';

    summaryDiv.innerHTML = `
      <div style="display: grid; gap: 1rem;">
        <div>
          <strong>Project Title:</strong> ${title}
        </div>
        <div>
          <strong>Category:</strong> ${category}
        </div>
        <div>
          <strong>Location:</strong> ${city}, ${region}
        </div>
        <div>
          <strong>Description:</strong> ${description.substring(0, 200)}${description.length > 200 ? '...' : ''}
        </div>
        <div>
          <strong>Required Services:</strong> ${services || 'None'}
        </div>
        <div>
          <strong>Required Skills:</strong> ${skills || 'None'}
        </div>
        <div>
          <strong>Budget Range:</strong> ${minBudget ? parseFloat(minBudget).toLocaleString() : '0'} - ${maxBudget ? parseFloat(maxBudget).toLocaleString() : '0'} SAR
        </div>
        <div>
          <strong>Status:</strong> ${status === 'draft' ? 'Draft (Save for later)' : 'Active (Publish immediately)'}
        </div>
      </div>
    `;
  }

  // ============================================
  // Update Mega-Project Summary
  // ============================================
  function updateMegaProjectSummary() {
    const summaryDiv = document.getElementById('projectSummary');
    if (!summaryDiv || typeof SubProjectManager === 'undefined') {
      updateProjectSummary(); // Fallback to single project summary
      return;
    }

    // Save current sub-project
    SubProjectManager.saveCurrentSubProject();

    const subProjects = SubProjectManager.getAllSubProjects();
    const status = document.getElementById('projectStatus')?.value || 'draft';

    // Calculate totals
    let totalMinBudget = 0;
    let totalMaxBudget = 0;
    const allServices = new Set();
    const allSkills = new Set();

    subProjects.forEach(sp => {
      if (sp.budget) {
        totalMinBudget += sp.budget.min || 0;
        totalMaxBudget += sp.budget.max || 0;
      }
      if (sp.scope) {
        if (sp.scope.requiredServices) {
          sp.scope.requiredServices.forEach(s => allServices.add(s));
        }
        if (sp.scope.skillRequirements) {
          sp.scope.skillRequirements.forEach(s => allSkills.add(s));
        }
      }
    });

    let html = `
      <div style="display: grid; gap: 1.5rem;">
        <div>
          <h4 style="margin-bottom: 1rem; color: var(--color-primary);">Mega-Project Overview</h4>
          <div style="display: grid; gap: 0.75rem;">
            <div>
              <strong>Total Sub-Projects:</strong> ${subProjects.length}
            </div>
            <div>
              <strong>Total Budget Range:</strong> ${totalMinBudget.toLocaleString()} - ${totalMaxBudget.toLocaleString()} SAR
            </div>
            <div>
              <strong>Aggregated Services:</strong> ${Array.from(allServices).join(', ') || 'None'}
            </div>
            <div>
              <strong>Aggregated Skills:</strong> ${Array.from(allSkills).join(', ') || 'None'}
            </div>
            <div>
              <strong>Status:</strong> ${status === 'draft' ? 'Draft (Save for later)' : 'Active (Publish immediately)'}
            </div>
          </div>
        </div>
        <div>
          <h4 style="margin-bottom: 1rem; color: var(--color-primary);">Sub-Projects Details</h4>
          <div style="display: grid; gap: 1rem;">
    `;

    subProjects.forEach((sp, index) => {
      html += `
        <div class="card" style="padding: 1rem; background: var(--bg-secondary);">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
            <h5 style="margin: 0; color: var(--text-primary);">Sub-Project ${index + 1}: ${sp.title || 'Untitled'}</h5>
            <span class="badge badge-info">${sp.category || 'No category'}</span>
          </div>
          <div style="display: grid; gap: 0.5rem; font-size: var(--font-size-sm);">
            <div><strong>Location:</strong> ${sp.location?.city || 'N/A'}, ${sp.location?.region || 'N/A'}</div>
            <div><strong>Budget:</strong> ${(sp.budget?.min || 0).toLocaleString()} - ${(sp.budget?.max || 0).toLocaleString()} SAR</div>
            ${sp.description ? `<div><strong>Description:</strong> ${sp.description.substring(0, 100)}${sp.description.length > 100 ? '...' : ''}</div>` : ''}
          </div>
        </div>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    summaryDiv.innerHTML = html;
  }

  // ============================================
  // Show Message
  // ============================================
  function showMessage(message, type) {
    const messageDiv = document.getElementById('projectCreateMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      messageDiv.style.display = 'block';
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        messageDiv.style.display = 'none';
      }, 5000);
    }
  }

  // ============================================
  // Get Current Tab
  // ============================================
  function getCurrentTab() {
    return tabs[currentTabIndex];
  }

  // ============================================
  // Go to Specific Tab
  // ============================================
  function goToTab(tabName) {
    const index = tabs.indexOf(tabName);
    if (index !== -1) {
      switchTab(index);
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.TabManager = {
    init,
    switchTab,
    getCurrentTab,
    goToTab,
    validateCurrentTab,
    updateProjectSummary
  };

})();

