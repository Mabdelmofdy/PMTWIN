/**
 * Collaboration Models Selector Component
 * Renders collaboration models in a card grid with multiple selection support
 */

(function() {
  'use strict';

  let selectedModels = [];
  let onSelectionChange = null;

  // ============================================
  // Initialize
  // ============================================
  function init(callback) {
    onSelectionChange = callback;
    loadAndRenderModels();
  }

  // ============================================
  // Load and Render Models
  // ============================================
  function loadAndRenderModels() {
    const container = document.getElementById('collaborationModelsGrid');
    if (!container) {
      console.error('[CollaborationModelsSelector] Container not found');
      return;
    }

    // Check if CollaborationModels is available
    if (typeof window.CollaborationModels === 'undefined') {
      container.innerHTML = `
        <div class="alert alert-info">
          <p>Collaboration models definitions are loading...</p>
        </div>
      `;
      // Retry after a short delay
      setTimeout(loadAndRenderModels, 500);
      return;
    }

    try {
      const categories = window.CollaborationModels.getAllCategories();
      let allModels = [];
      
      categories.forEach(category => {
        const categoryModels = window.CollaborationModels.getModelsByCategory(category.id);
        allModels = allModels.concat(categoryModels);
      });

      if (allModels.length === 0) {
        container.innerHTML = `
          <div class="alert alert-info">
            <p>No collaboration models available.</p>
          </div>
        `;
        return;
      }

      renderModels(container, allModels);
    } catch (error) {
      console.error('[CollaborationModelsSelector] Error loading models:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Error loading collaboration models. Please refresh the page.</p>
        </div>
      `;
    }
  }

  // ============================================
  // Render Models
  // ============================================
  function renderModels(container, models) {
    let html = '';

    models.forEach(model => {
      const isSelected = selectedModels.includes(model.id);
      // Get category name
      let categoryName = model.category;
      if (typeof window.CollaborationModels !== 'undefined') {
        const categories = window.CollaborationModels.getAllCategories();
        const category = categories.find(cat => cat.name === model.category || cat.subModels.includes(model.id));
        if (category) {
          categoryName = category.name;
        }
      }
      
      html += `
        <div class="card collaboration-model-card ${isSelected ? 'selected' : ''}" 
             data-model-id="${model.id}"
             style="cursor: pointer; transition: all 0.2s; ${isSelected ? 'border: 2px solid var(--primary-color); background: var(--bg-secondary);' : ''}"
             onclick="CollaborationModelsSelector.toggleSelection('${model.id}')">
          <div class="card-body" style="padding: 1.5rem;">
            <div style="display: flex; align-items: start; gap: 1rem;">
              <input type="checkbox" 
                     class="model-checkbox" 
                     data-model-id="${model.id}"
                     ${isSelected ? 'checked' : ''}
                     onclick="event.stopPropagation(); CollaborationModelsSelector.toggleSelection('${model.id}')"
                     style="margin-top: 0.25rem; cursor: pointer;">
              <div style="flex: 1;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: var(--font-weight-semibold);">
                  ${model.name || 'Untitled Model'}
                </h4>
                <p style="margin: 0 0 0.5rem 0; color: var(--text-secondary); font-size: 0.875rem;">
                  ${categoryName}
                </p>
                <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5;">
                  ${model.description || 'No description available.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ============================================
  // Toggle Selection
  // ============================================
  function toggleSelection(modelId) {
    const index = selectedModels.indexOf(modelId);
    
    if (index > -1) {
      // Deselect
      selectedModels.splice(index, 1);
    } else {
      // Select
      selectedModels.push(modelId);
    }

    // Update UI
    updateSelectionUI();
    
    // Notify callback
    if (onSelectionChange) {
      onSelectionChange(selectedModels);
    }
  }

  // ============================================
  // Update Selection UI
  // ============================================
  function updateSelectionUI() {
    document.querySelectorAll('.collaboration-model-card').forEach(card => {
      const modelId = card.getAttribute('data-model-id');
      const isSelected = selectedModels.includes(modelId);
      const checkbox = card.querySelector('.model-checkbox');
      
      if (isSelected) {
        card.classList.add('selected');
        card.style.border = '2px solid var(--primary-color)';
        card.style.background = 'var(--bg-secondary)';
        if (checkbox) checkbox.checked = true;
      } else {
        card.classList.remove('selected');
        card.style.border = '';
        card.style.background = '';
        if (checkbox) checkbox.checked = false;
      }
    });
  }

  // ============================================
  // Get Selected Models
  // ============================================
  function getSelectedModels() {
    return [...selectedModels];
  }

  // ============================================
  // Set Selected Models
  // ============================================
  function setSelectedModels(modelIds) {
    selectedModels = [...(modelIds || [])];
    updateSelectionUI();
  }

  // ============================================
  // Clear Selection
  // ============================================
  function clearSelection() {
    selectedModels = [];
    updateSelectionUI();
    if (onSelectionChange) {
      onSelectionChange(selectedModels);
    }
  }

  // ============================================
  // Export
  // ============================================
  window.CollaborationModelsSelector = {
    init,
    toggleSelection,
    getSelectedModels,
    setSelectedModels,
    clearSelection
  };

})();

