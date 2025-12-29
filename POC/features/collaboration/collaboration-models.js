/**
 * Collaboration Models Component
 */

(function() {
  'use strict';

  function init(params) {
    loadModels();
  }

  async function loadModels() {
    const container = document.getElementById('collaborationModelsGrid');
    if (!container) return;

    try {
      // Use CollaborationModels if available, otherwise use static data
      let models = [];
      
      if (typeof window.CollaborationModels !== 'undefined') {
        const categories = window.CollaborationModels.getAllCategories();
        categories.forEach(category => {
          const categoryModels = window.CollaborationModels.getModelsByCategory(category.id);
          models = models.concat(categoryModels);
        });
      } else {
        // Fallback static models
        models = [
          {
            id: '1.4',
            name: 'Special Purpose Vehicle (SPV)',
            category: 'Legal Structures',
            description: 'Create a separate legal entity for a specific project',
            icon: '🏗️'
          },
          {
            id: '1.3',
            name: 'Joint Venture',
            category: 'Partnerships',
            description: 'Collaborate with partners on shared projects',
            icon: '🤝'
          },
          {
            id: '3.3',
            name: 'Resource Marketplace',
            category: 'Resource Exchange',
            description: 'Exchange services without cash transactions',
            icon: '🔄'
          },
          {
            id: '1.2',
            name: 'Consortium',
            category: 'Partnerships',
            description: 'Join multiple partners for large-scale projects',
            icon: '👥'
          }
        ];
      }

      // Filter models by role if RBAC is available
      if (typeof window.PMTwinRBAC !== 'undefined') {
        models = await window.PMTwinRBAC.filterModelsByRole(models);
      }

      renderModels(container, models);
    } catch (error) {
      console.error('Error loading collaboration models:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading collaboration models. Please try again.</p>';
    }
  }

  function renderModels(container, models) {
    if (models.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No collaboration models available.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem;">';
    
    models.forEach(model => {
      html += `
        <div class="card" style="cursor: pointer;" onclick="collaborationModelsComponent.viewModel('${model.id}')">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">${model.icon || '📋'}</div>
            <h3 style="margin: 0 0 0.5rem 0;">${model.name || 'Untitled Model'}</h3>
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">${model.category || 'General'}</p>
            <p style="margin: 0 0 1rem 0;">${model.description || 'No description available.'}</p>
            <button class="btn btn-primary btn-sm">Learn More</button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function viewModel(modelId) {
    window.location.hash = `#collaboration/${modelId}`;
  }

  // Export
  if (!window.collaboration) window.collaboration = {};
  window.collaboration['collaboration-models'] = {
    init,
    loadModels,
    viewModel
  };

  // Global reference for onclick handlers
  window.collaborationModelsComponent = window.collaboration['collaboration-models'];

})();

