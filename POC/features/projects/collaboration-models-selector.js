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
             style="cursor: pointer; transition: all 0.3s ease; 
                    border: 2px solid ${isSelected ? 'var(--color-primary, #2563eb)' : 'var(--border-color, #e5e7eb)'}; 
                    background: ${isSelected ? 'rgba(37, 99, 235, 0.05)' : 'white'}; 
                    border-radius: 12px; 
                    overflow: hidden;
                    ${isSelected ? 'box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);' : 'box-shadow: 0 2px 4px rgba(0,0,0,0.05);'}
                    ${!isSelected ? 'hover:border-color: var(--color-primary, #2563eb); hover:box-shadow: 0 4px 8px rgba(37, 99, 235, 0.1);' : ''}"
             onmouseover="if(!this.classList.contains('selected')) { this.style.borderColor='var(--color-primary, #2563eb)'; this.style.boxShadow='0 4px 8px rgba(37, 99, 235, 0.1)'; this.style.transform='translateY(-2px)'; }"
             onmouseout="if(!this.classList.contains('selected')) { this.style.borderColor='var(--border-color, #e5e7eb)'; this.style.boxShadow='0 2px 4px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)'; }"
             onclick="CollaborationModelsSelector.toggleSelection('${model.id}')">
          <div class="card-body" style="padding: 1.5rem;">
            <div style="display: flex; align-items: start; gap: 1rem;">
              <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${isSelected ? 'var(--color-primary, #2563eb)' : 'var(--border-color, #d1d5db)'}; background: ${isSelected ? 'var(--color-primary, #2563eb)' : 'white'}; flex-shrink: 0; margin-top: 0.25rem; transition: all 0.2s ease;">
                ${isSelected ? '<i class="ph ph-check" style="color: white; font-size: 0.875rem;"></i>' : ''}
              </div>
              <div style="flex: 1;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1.125rem; font-weight: 600; color: ${isSelected ? 'var(--color-primary, #2563eb)' : 'var(--text-primary, #111827)'};">
                  ${model.name || 'Untitled Model'}
                </h4>
                <p style="margin: 0 0 0.75rem 0; color: var(--text-secondary, #6b7280); font-size: 0.875rem; font-weight: 500;">
                  ${categoryName}
                </p>
                <p style="margin: 0; color: var(--text-secondary, #6b7280); font-size: 0.875rem; line-height: 1.6;">
                  ${model.description || 'No description available.'}
                </p>
                ${model.applicability && model.applicability.length > 0 ? `
                  <div style="display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.75rem;">
                    ${model.applicability.slice(0, 3).map(rel => `
                      <span class="badge" style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; background: var(--bg-secondary, #f3f4f6); color: var(--text-secondary, #6b7280);">
                        ${rel}
                      </span>
                    `).join('')}
                    ${model.applicability.length > 3 ? `<span style="font-size: 0.75rem; color: var(--text-secondary, #6b7280);">+${model.applicability.length - 3} more</span>` : ''}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // ============================================
  // Toggle Selection (Single Selection Mode)
  // ============================================
  function toggleSelection(modelId) {
    const index = selectedModels.indexOf(modelId);
    
    if (index > -1) {
      // Deselect
      selectedModels.splice(index, 1);
    } else {
      // Select (single selection - clear previous selection)
      selectedModels = [modelId];
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
      const checkIcon = card.querySelector('.ph-check');
      const titleEl = card.querySelector('h4');
      
      if (isSelected) {
        card.classList.add('selected');
        card.style.border = '2px solid var(--color-primary, #2563eb)';
        card.style.background = 'rgba(37, 99, 235, 0.05)';
        card.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.15)';
        if (checkIcon) {
          checkIcon.parentElement.style.background = 'var(--color-primary, #2563eb)';
          checkIcon.parentElement.style.borderColor = 'var(--color-primary, #2563eb)';
          checkIcon.style.display = 'block';
        }
        if (titleEl) titleEl.style.color = 'var(--color-primary, #2563eb)';
      } else {
        card.classList.remove('selected');
        card.style.border = '2px solid var(--border-color, #e5e7eb)';
        card.style.background = 'white';
        card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        if (checkIcon) {
          checkIcon.parentElement.style.background = 'white';
          checkIcon.parentElement.style.borderColor = 'var(--border-color, #d1d5db)';
          checkIcon.style.display = 'none';
        }
        if (titleEl) titleEl.style.color = 'var(--text-primary, #111827)';
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
  function setSelectedModels(modelIds, skipCallback = false) {
    selectedModels = [...(modelIds || [])];
    updateSelectionUI();
    
    // Only trigger callback if not skipping (used during restoration)
    if (!skipCallback && onSelectionChange) {
      onSelectionChange(selectedModels);
    }
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

