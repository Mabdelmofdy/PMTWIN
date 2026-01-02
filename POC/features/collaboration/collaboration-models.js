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
      let categories = [];
      let allModels = [];
      
      if (typeof window.CollaborationModels !== 'undefined') {
        categories = window.CollaborationModels.getAllCategories();
        categories.forEach(category => {
          const categoryModels = window.CollaborationModels.getModelsByCategory(category.id);
          allModels = allModels.concat(categoryModels);
        });
      } else {
        // Fallback static data
        categories = [
          { id: '1', name: 'Project-Based Collaboration', description: 'Short-term project collaborations' },
          { id: '2', name: 'Strategic Partnerships', description: 'Long-term strategic alliances' },
          { id: '3', name: 'Resource Pooling & Sharing', description: 'Resource sharing and exchange' },
          { id: '4', name: 'Hiring a Resource', description: 'Professional and consultant hiring' },
          { id: '5', name: 'Call for Competition', description: 'Competitions and RFPs' }
        ];
        allModels = [
          {
            id: '1.4',
            name: 'Special Purpose Vehicle (SPV)',
            category: 'Project-Based Collaboration',
            description: 'Create a separate legal entity for a specific project',
            icon: '<i class="ph ph-buildings"></i>'
          },
          {
            id: '1.3',
            name: 'Joint Venture',
            category: 'Strategic Partnerships',
            description: 'Collaborate with partners on shared projects',
            icon: '<i class="ph ph-handshake"></i>'
          },
          {
            id: '3.3',
            name: 'Resource Sharing & Exchange',
            category: 'Resource Pooling & Sharing',
            description: 'Marketplace for sharing, trading, buying, selling, or bartering services, materials, or equipment',
            icon: '<i class="ph ph-arrow-clockwise"></i>'
          },
          {
            id: '1.2',
            name: 'Consortium',
            category: 'Project-Based Collaboration',
            description: 'Join multiple partners for large-scale projects',
            icon: '<i class="ph ph-users"></i>'
          }
        ];
      }

      // Filter models by role if RBAC is available
      if (typeof window.PMTwinRBAC !== 'undefined') {
        allModels = await window.PMTwinRBAC.filterModelsByRole(allModels);
      }

      renderModelsByCategory(container, categories, allModels);
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

  function renderModelsByCategory(container, categories, allModels) {
    if (categories.length === 0 || allModels.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No collaboration models available.</p>
          </div>
        </div>
      `;
      return;
    }

    // Category icons mapping
    const categoryIcons = {
      '1': '<i class="ph ph-buildings"></i>',
      '2': '<i class="ph ph-handshake"></i>',
      '3': '<i class="ph ph-briefcase"></i>',
      '4': '<i class="ph ph-users"></i>',
      '5': '<i class="ph ph-trophy"></i>'
    };

    let html = '';
    
    categories.forEach((category, categoryIndex) => {
      // Get models for this category using getModelsByCategory
      let categoryModels = [];
      if (typeof window.CollaborationModels !== 'undefined') {
        categoryModels = window.CollaborationModels.getModelsByCategory(category.id);
      } else {
        // Fallback: filter by category name or model ID prefix
        categoryModels = allModels.filter(model => {
          // Check if model ID starts with category ID (e.g., '1.1' starts with '1')
          return model.id && model.id.startsWith(category.id + '.') || model.category === category.name;
        });
      }

      if (categoryModels.length === 0) return; // Skip empty categories

      const icon = categoryIcons[category.id] || '<i class="ph ph-clipboard-text"></i>';
      
      html += `
        <div class="card" style="margin-bottom: 2.5rem;">
          <div class="card-body">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color);">
              <div style="font-size: 2.5rem; color: var(--color-primary);">${icon}</div>
              <div style="flex: 1;">
                <h2 style="margin: 0 0 0.5rem 0; font-size: 1.5rem;">Model ${category.id}: ${category.name}</h2>
                ${category.description ? `<p style="margin: 0; color: var(--text-secondary);">${category.description}</p>` : ''}
              </div>
              <div style="text-align: right;">
                <span class="badge badge-primary" style="font-size: 1rem; padding: 0.5rem 1rem;">${categoryModels.length} ${categoryModels.length === 1 ? 'Sub-Model' : 'Sub-Models'}</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
      `;
      
      categoryModels.forEach(model => {
        html += `
          <div class="card" style="cursor: pointer; border: 1px solid var(--border-color); transition: all 0.3s ease;" 
               onmouseover="this.style.boxShadow='0 4px 12px rgba(0,0,0,0.1)'; this.style.transform='translateY(-2px)'"
               onmouseout="this.style.boxShadow=''; this.style.transform=''"
               onclick="collaborationModelsComponent.showModelDetails('${model.id}')">
            <div class="card-body" style="text-align: center; padding: 1.5rem;">
              <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-primary);">
                ${model.icon || '<i class="ph ph-clipboard"></i>'}
              </div>
              <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${model.name || 'Untitled Model'}</h3>
              <p style="margin: 0 0 1rem 0; color: var(--text-secondary); font-size: 0.9rem; min-height: 3rem;">
                ${model.description || 'No description available.'}
              </p>
              <button class="btn btn-primary btn-sm" 
                      onclick="event.stopPropagation(); collaborationModelsComponent.showModelDetails('${model.id}')">
                Learn More
              </button>
            </div>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    });
    
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
                <button class="btn btn-secondary" onclick="this.closest('.modal-backdrop').remove(); collaborationModelsComponent.createOpportunityFromModel('${modelId}');">Create Opportunity</button>
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

  function createOpportunityFromModel(modelId) {
    // Navigate to collaboration opportunities page with model pre-selected
    if (typeof window.collaboration !== 'undefined' && window.collaboration['collaboration-opportunities']) {
      window.location.href = '../collaboration-opportunities/?modelId=' + modelId;
    } else {
      // Fallback: show create form directly
      showCreateOpportunityForm(modelId);
    }
  }

  function showCreateOpportunityForm(modelId) {
    if (typeof CollaborationService === 'undefined') {
      alert('Collaboration service not available');
      return;
    }

    // Get model details
    let model = null;
    if (typeof window.CollaborationModels !== 'undefined') {
      model = window.CollaborationModels.getModel(modelId);
    }

    const modelName = model ? model.name : modelId;
    const modelCategory = model ? model.category : 'General';

    // Create modal for opportunity creation
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop show';
    modalBackdrop.id = 'createOpportunityModalBackdrop';

    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.style.cssText = 'max-width: 700px; max-height: 90vh; overflow-y: auto;';

    modal.innerHTML = `
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="modal-title">Create Collaboration Opportunity</h2>
        <button class="modal-close" onclick="document.getElementById('createOpportunityModalBackdrop').remove()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="card" style="margin-bottom: 1.5rem; background: var(--bg-secondary, #f5f5f5);">
          <div class="card-body">
            <p style="margin: 0;"><strong>Selected Model:</strong> ${modelName}</p>
            <p style="margin: 0; color: var(--text-secondary, #666);"><strong>Category:</strong> ${modelCategory}</p>
          </div>
        </div>
        <form id="createOpportunityForm">
          <input type="hidden" id="oppModelId" value="${modelId}">
          <div class="form-group">
            <label for="oppTitle" class="form-label">Opportunity Title *</label>
            <input type="text" id="oppTitle" class="form-control" required placeholder="Enter opportunity title">
          </div>
          <div class="form-group">
            <label for="oppDescription" class="form-label">Description *</label>
            <textarea id="oppDescription" class="form-control" rows="4" required placeholder="Describe the collaboration opportunity..."></textarea>
          </div>
          <div class="form-group">
            <label for="oppStatus" class="form-label">Initial Status</label>
            <select id="oppStatus" class="form-control">
              <option value="draft">Draft</option>
              <option value="active" selected>Active (Publish Now)</option>
              <option value="pending">Pending Review</option>
            </select>
          </div>
          ${model && model.attributes && model.attributes.length > 0 ? `
            <div class="form-group">
              <label class="form-label">Additional Details</label>
              <div class="card" style="background: var(--bg-secondary, #f5f5f5);">
                <div class="card-body">
                  <p style="font-size: 0.9rem; color: var(--text-secondary, #666);">
                    This opportunity uses the <strong>${modelName}</strong> model. 
                    You'll be able to add model-specific attributes when editing the opportunity.
                  </p>
                </div>
              </div>
            </div>
          ` : ''}
          <div id="createOppMessage" style="display: none; margin-top: 1rem;"></div>
          <div class="modal-footer" style="display: flex; gap: 0.5rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
            <button type="button" class="btn btn-outline" onclick="document.getElementById('createOpportunityModalBackdrop').remove()">Cancel</button>
            <button type="submit" class="btn btn-primary">Create Opportunity</button>
          </div>
        </form>
      </div>
    `;

    modalBackdrop.appendChild(modal);
    document.body.appendChild(modalBackdrop);

    // Handle form submission
    const form = document.getElementById('createOpportunityForm');
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      await handleCreateOpportunitySubmit(modelId);
    });

    // Close on backdrop click
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    });
  }

  async function handleCreateOpportunitySubmit(modelId) {
    const messageDiv = document.getElementById('createOppMessage');
    const form = document.getElementById('createOpportunityForm');

    const title = document.getElementById('oppTitle').value;
    const description = document.getElementById('oppDescription').value;
    const status = document.getElementById('oppStatus').value;

    if (!title || !description) {
      if (messageDiv) {
        messageDiv.textContent = 'Please fill in all required fields';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
      return;
    }

    // Get model details for the opportunity
    let model = null;
    if (typeof window.CollaborationModels !== 'undefined') {
      model = window.CollaborationModels.getModel(modelId);
    }

    const opportunityData = {
      modelId: modelId,
      modelType: modelId,
      modelName: model ? model.name : modelId,
      title: title,
      description: description,
      status: status,
      category: model ? model.category : 'General',
      attributes: {} // Will be filled when editing
    };

    try {
      if (typeof CollaborationService === 'undefined') {
        throw new Error('Collaboration service not available');
      }

      const result = await CollaborationService.createCollaborationOpportunity(opportunityData);

      if (result.success) {
        if (messageDiv) {
          messageDiv.textContent = 'Opportunity created successfully!';
          messageDiv.className = 'alert alert-success';
          messageDiv.style.display = 'block';
        }
        setTimeout(() => {
          document.getElementById('createOpportunityModalBackdrop').remove();
          // Navigate to opportunities page or reload
          if (window.location.pathname.includes('collaboration')) {
            window.location.reload();
          } else {
            window.location.href = '../collaboration-opportunities/';
          }
        }, 1500);
      } else {
        if (messageDiv) {
          messageDiv.textContent = result.error || 'Failed to create opportunity';
          messageDiv.className = 'alert alert-error';
          messageDiv.style.display = 'block';
        }
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      if (messageDiv) {
        messageDiv.textContent = 'Error creating opportunity. Please try again.';
        messageDiv.className = 'alert alert-error';
        messageDiv.style.display = 'block';
      }
    }
  }

  // Export
  if (!window.collaboration) window.collaboration = {};
  window.collaboration['collaboration-models'] = {
    init,
    loadModels,
    viewModel,
    showModelDetails,
    createOpportunityFromModel,
    showCreateOpportunityForm
  };

  // Global reference for onclick handlers
  window.collaborationModelsComponent = window.collaboration['collaboration-models'];

})();

