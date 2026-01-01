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
            icon: '<i class="ph ph-buildings"></i>'
          },
          {
            id: '1.3',
            name: 'Joint Venture',
            category: 'Partnerships',
            description: 'Collaborate with partners on shared projects',
            icon: '<i class="ph ph-handshake"></i>'
          },
          {
            id: '3.3',
            name: 'Resource Marketplace',
            category: 'Resource Exchange',
            description: 'Exchange services without cash transactions',
            icon: '<i class="ph ph-arrow-clockwise"></i>'
          },
          {
            id: '1.2',
            name: 'Consortium',
            category: 'Partnerships',
            description: 'Join multiple partners for large-scale projects',
            icon: '<i class="ph ph-users"></i>'
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
        <div class="card" style="cursor: pointer;" onclick="collaborationModelsComponent.showModelDetails('${model.id}')">
          <div class="card-body" style="text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">${model.icon || '<i class="ph ph-clipboard" style="font-size: 3rem;"></i>'}</div>
            <h3 style="margin: 0 0 0.5rem 0;">${model.name || 'Untitled Model'}</h3>
            <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">${model.category || 'General'}</p>
            <p style="margin: 0 0 1rem 0;">${model.description || 'No description available.'}</p>
            <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); collaborationModelsComponent.showModelDetails('${model.id}')">Learn More</button>
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

  function showModelDetails(modelId) {
    try {
      // Get model details from CollaborationModels if available
      let model = null;
      if (typeof window.CollaborationModels !== 'undefined') {
        model = window.CollaborationModels.getModel(modelId);
      }

      if (!model) {
        // Fallback: try to find in the rendered models
        const container = document.getElementById('collaborationModelsGrid');
        if (container) {
          const cards = container.querySelectorAll('.card');
          cards.forEach(card => {
            const button = card.querySelector('button');
            if (button && button.getAttribute('onclick') && button.getAttribute('onclick').includes(modelId)) {
              const name = card.querySelector('h3')?.textContent || 'Unknown Model';
              const category = card.querySelectorAll('p')[0]?.textContent || 'General';
              const description = card.querySelectorAll('p')[1]?.textContent || 'No description available.';
              
              model = {
                id: modelId,
                name: name,
                category: category,
                description: description
              };
            }
          });
        }
      }

      if (!model) {
        alert('Model details not found. Please try again.');
        return;
      }

      // Build modal HTML
      let modalHTML = `
        <div class="modal-backdrop show" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;">
          <div class="modal show" style="max-width: 800px; width: 90%; max-height: 90vh; overflow-y: auto; background: white; border-radius: var(--radius-lg, 8px); box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
            <div class="modal-header" style="padding: 1.5rem; border-bottom: 1px solid var(--border-color, #e0e0e0); display: flex; justify-content: space-between; align-items: center;">
              <h2 class="modal-title" style="margin: 0; font-size: 1.5rem;">${model.name || 'Collaboration Model'}</h2>
              <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary, #666);">&times;</button>
            </div>
            <div class="modal-body" style="padding: 1.5rem;">
      `;

      // Add category
      if (model.category) {
        modalHTML += `
          <div style="margin-bottom: 1rem;">
            <span class="badge badge-primary" style="padding: 0.25rem 0.75rem; border-radius: 4px; background: var(--color-primary, #0066cc); color: white;">${model.category}</span>
          </div>
        `;
      }

      // Add description
      if (model.description) {
        modalHTML += `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Description</h3>
            <p style="color: var(--text-secondary, #666); line-height: 1.6;">${model.description}</p>
          </div>
        `;
      }

      // Add applicability if available
      if (model.applicability && Array.isArray(model.applicability) && model.applicability.length > 0) {
        modalHTML += `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Applicability</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${model.applicability.map(app => `<span class="badge badge-outline" style="padding: 0.25rem 0.75rem; border-radius: 4px; border: 1px solid var(--border-color, #e0e0e0);">${app}</span>`).join('')}
            </div>
          </div>
        `;
      }

      // Add use cases if available
      if (model.useCases && Array.isArray(model.useCases) && model.useCases.length > 0) {
        modalHTML += `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Use Cases</h3>
            <ul style="color: var(--text-secondary, #666); line-height: 1.8; padding-left: 1.5rem;">
              ${model.useCases.map(useCase => `<li>${useCase}</li>`).join('')}
            </ul>
          </div>
        `;
      }

      // Add key attributes if available
      if (model.attributes && Array.isArray(model.attributes) && model.attributes.length > 0) {
        modalHTML += `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Key Attributes</h3>
            <ul style="color: var(--text-secondary, #666); line-height: 1.8; padding-left: 1.5rem;">
              ${model.attributes.slice(0, 5).map(attr => `<li>${attr.question || attr.name}</li>`).join('')}
              ${model.attributes.length > 5 ? `<li style="color: var(--color-primary, #0066cc);"><em>... and ${model.attributes.length - 5} more attributes</em></li>` : ''}
            </ul>
          </div>
        `;
      }

      // Add matching info if available
      if (model.matchingMetrics && Array.isArray(model.matchingMetrics) && model.matchingMetrics.length > 0) {
        modalHTML += `
          <div style="margin-bottom: 1.5rem;">
            <h3 style="margin-bottom: 0.5rem; font-size: 1.1rem;">Matching Criteria</h3>
            <div style="color: var(--text-secondary, #666);">
              ${model.matchingMetrics.map(metric => `<p style="margin: 0.25rem 0;"><strong>${metric.name}:</strong> ${(metric.weight * 100).toFixed(0)}%</p>`).join('')}
              ${model.threshold ? `<p style="margin-top: 0.5rem;"><strong>Minimum Match Threshold:</strong> ${model.threshold}%</p>` : ''}
            </div>
          </div>
        `;
      }

      modalHTML += `
            </div>
            <div class="modal-footer" style="padding: 1rem 1.5rem; border-top: 1px solid var(--border-color, #e0e0e0); display: flex; justify-content: flex-end; gap: 0.5rem;">
              <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
              ${typeof window.CollaborationService !== 'undefined' ? `
                <button class="btn btn-primary" onclick="this.closest('.modal-backdrop').remove(); window.location.href = '../create-project/?modelId=${modelId}';">Create Project</button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      // Remove any existing modal
      const existingModal = document.querySelector('.modal-backdrop');
      if (existingModal) {
        existingModal.remove();
      }

      // Add modal to page
      document.body.insertAdjacentHTML('beforeend', modalHTML);

      // Close on backdrop click
      const backdrop = document.querySelector('.modal-backdrop:last-of-type');
      if (backdrop) {
        backdrop.addEventListener('click', function(e) {
          if (e.target === backdrop) {
            backdrop.remove();
          }
        });
      }

    } catch (error) {
      console.error('Error showing model details:', error);
      alert('Error loading model details. Please try again.');
    }
  }

  // Export
  if (!window.collaboration) window.collaboration = {};
  window.collaboration['collaboration-models'] = {
    init,
    loadModels,
    viewModel,
    showModelDetails
  };

  // Global reference for onclick handlers
  window.collaborationModelsComponent = window.collaboration['collaboration-models'];

})();

