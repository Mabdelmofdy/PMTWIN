/**
 * PMTwin Collaboration Models UI
 * Handles model selection, form generation, and collaboration management
 */

(function() {
  'use strict';

  let currentUser = null;
  let currentModel = null;
  let formMode = 'inline'; // 'inline' or 'wizard'

  // Check dependencies helper
  function checkDependencies() {
    if (typeof window.CollaborationModels === 'undefined') {
      console.error('CollaborationModels not loaded!');
      return false;
    }
    if (typeof window.PMTwinData === 'undefined') {
      console.error('PMTwinData not loaded!');
      return false;
    }
    return true;
  }

  // ============================================
  // Model Selection UI
  // ============================================
  function renderModelSelection() {
    if (!checkDependencies()) {
      const container = document.getElementById('collaborationModelsContent');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Collaboration models feature is not available. Please refresh the page.</p>';
      }
      return;
    }

    const container = document.getElementById('collaborationModelsContent');
    if (!container) {
      console.error('collaborationModelsContent container not found');
      return;
    }

    try {
      const categories = window.CollaborationModels.getAllCategories();
      
      // Category icons mapping
      const categoryIcons = {
        '1': '🏗️',
        '2': '🤝',
        '3': '💼',
        '4': '👥',
        '5': '🏆'
      };
      
      let html = '<div class="collaboration-models-grid">';

      categories.forEach((category, categoryIndex) => {
        const subModels = CollaborationModels.getModelsByCategory(category.id);
        const icon = categoryIcons[category.id] || '📋';
        const subModelCount = subModels.length;
        
        html += `
          <div class="model-category-card clickable-category-card" 
               style="animation-delay: ${categoryIndex * 0.1}s"
               onclick="if(window.CollaborationModelsUI && CollaborationModelsUI.viewCategory) { CollaborationModelsUI.viewCategory('${category.id}'); }"
               role="button"
               tabindex="0"
               onkeypress="if(event.key === 'Enter' && window.CollaborationModelsUI && CollaborationModelsUI.viewCategory) { CollaborationModelsUI.viewCategory('${category.id}'); }">
            <h3>
              <span style="font-size: 1.5em; margin-right: var(--spacing-2);">${icon}</span>
              ${category.name}
            </h3>
            <p class="category-description">${category.description}</p>
            <div class="category-footer">
              <div class="category-meta">
                <span class="sub-model-count">${subModelCount} ${subModelCount === 1 ? 'Model' : 'Models'}</span>
              </div>
              <button class="btn btn-primary" onclick="event.stopPropagation(); if(window.CollaborationModelsUI && CollaborationModelsUI.viewCategory) { CollaborationModelsUI.viewCategory('${category.id}'); }">
                <span>View Models</span>
                <span style="margin-left: var(--spacing-2);">→</span>
              </button>
            </div>
          </div>
        `;
      });

      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error rendering model selection:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Error loading collaboration models. Please refresh the page.</p>
          <button class="btn btn-primary" onclick="window.location.reload()">Refresh</button>
        </div>
      `;
    }
  }

  // ============================================
  // Category Detail View
  // ============================================
  function renderCategoryDetail(categoryId) {
    if (!checkDependencies()) {
      const container = document.getElementById('collaborationCategoryContent');
      if (container) {
        container.innerHTML = '<p class="alert alert-error">Collaboration models feature is not available. Please refresh the page.</p>';
      }
      return;
    }

    const container = document.getElementById('collaborationCategoryContent');
    if (!container) {
      console.error('collaborationCategoryContent container not found');
      return;
    }

    try {
      const category = window.CollaborationModels.getCategory(categoryId);
      if (!category) {
        container.innerHTML = '<p class="alert alert-error">Category not found.</p>';
        return;
      }

      const subModels = window.CollaborationModels.getModelsByCategory(categoryId);
      
      console.log('Category ID:', categoryId);
      console.log('Category:', category);
      console.log('Sub-models:', subModels);
      
      // Category icons mapping
      const categoryIcons = {
        '1': '🏗️',
        '2': '🤝',
        '3': '💼',
        '4': '👥',
        '5': '🏆'
      };
      
      const icon = categoryIcons[categoryId] || '📋';

      let html = `
        <div class="category-detail-header">
          <button class="btn btn-outline btn-back" onclick="if(window.CollaborationModelsUI && CollaborationModelsUI.backToCategories) { CollaborationModelsUI.backToCategories(); }">
            <span>←</span> Back to Categories
          </button>
          <div class="category-header-content">
            <h2>
              <span style="font-size: 2em; margin-right: var(--spacing-3);">${icon}</span>
              ${category.name}
            </h2>
            <p class="category-detail-description">${category.description}</p>
          </div>
        </div>
      `;

      if (!subModels || subModels.length === 0) {
        html += `
          <div class="alert alert-warning">
            <p>No collaboration models found for this category.</p>
            <button class="btn btn-primary" onclick="if(window.CollaborationModelsUI && CollaborationModelsUI.backToCategories) { CollaborationModelsUI.backToCategories(); }">Back to Categories</button>
          </div>
        `;
      } else {
        html += '<div class="sub-models-grid">';
        subModels.forEach((model, modelIndex) => {
          if (!model) {
            console.warn('Null model at index', modelIndex);
            return;
          }
          html += `
            <div class="sub-model-card" style="animation-delay: ${modelIndex * 0.1}s">
              <div class="sub-model-header">
                <h3>${model.id}: ${model.name}</h3>
              </div>
              <p class="sub-model-description">${model.description || 'No description available'}</p>
              <div class="applicability-badges">
                ${(model.applicability || []).map(rel => `<span class="badge badge-${rel.toLowerCase()}" title="${rel} relationship type">${rel}</span>`).join('')}
              </div>
              <button class="btn btn-primary btn-block" onclick="if(window.CollaborationModelsUI && CollaborationModelsUI.selectModel) { CollaborationModelsUI.selectModel('${model.id}'); }">
                <span>Create ${model.name}</span>
              </button>
            </div>
          `;
        });
        html += '</div>';
      }

      container.innerHTML = html;
    } catch (error) {
      console.error('Error rendering category detail:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          <p>Error loading category details. Please try again.</p>
          <button class="btn btn-primary" onclick="if(window.CollaborationModelsUI && CollaborationModelsUI.backToCategories) { CollaborationModelsUI.backToCategories(); }">Back to Categories</button>
        </div>
      `;
    }
  }

  // ============================================
  // Form Generation
  // ============================================
  function generateFormField(attribute, formData = {}) {
    const value = formData[attribute.name] || '';
    const fieldId = `collab_${attribute.name}`;
    let html = '';

    // Label
    html += `<label for="${fieldId}" class="form-label">${attribute.question}${attribute.required ? ' <span class="required">*</span>' : ''}</label>`;

    // Field based on type
    switch (attribute.type) {
      case 'String':
        html += `
          <input type="text" 
                 id="${fieldId}" 
                 name="${attribute.name}" 
                 class="form-control" 
                 maxlength="${attribute.maxLength || ''}"
                 placeholder="${attribute.placeholder || ''}"
                 value="${value}"
                 ${attribute.required ? 'required' : ''}
                 ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
        `;
        break;

      case 'Text':
        html += `
          <textarea id="${fieldId}" 
                    name="${attribute.name}" 
                    class="form-control" 
                    rows="4"
                    maxlength="${attribute.maxLength || ''}"
                    placeholder="${attribute.placeholder || ''}"
                    ${attribute.required ? 'required' : ''}
                    ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>${value}</textarea>
        `;
        break;

      case 'Integer':
        html += `
          <input type="number" 
                 id="${fieldId}" 
                 name="${attribute.name}" 
                 class="form-control" 
                 min="${attribute.min || 0}"
                 placeholder="${attribute.placeholder || ''}"
                 value="${value}"
                 ${attribute.required ? 'required' : ''}
                 ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
        `;
        break;

      case 'Currency':
        html += `
          <div class="input-group">
            <span class="input-group-text">${attribute.currency || 'SAR'}</span>
            <input type="number" 
                   id="${fieldId}" 
                   name="${attribute.name}" 
                   class="form-control" 
                   min="${attribute.min || 0}"
                   step="0.01"
                   placeholder="${attribute.placeholder || ''}"
                   value="${value}"
                   ${attribute.required ? 'required' : ''}
                   ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
          </div>
        `;
        break;

      case 'CurrencyRange':
        html += `
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Minimum</label>
              <div class="input-group">
                <span class="input-group-text">${attribute.currency || 'SAR'}</span>
                <input type="number" 
                       id="${fieldId}_min" 
                       name="${attribute.name}_min" 
                       class="form-control" 
                       min="0"
                       step="0.01"
                       placeholder="Min"
                       value="${formData[`${attribute.name}_min`] || ''}"
                       ${attribute.required ? 'required' : ''}>
              </div>
            </div>
            <div class="col-md-6">
              <label class="form-label">Maximum</label>
              <div class="input-group">
                <span class="input-group-text">${attribute.currency || 'SAR'}</span>
                <input type="number" 
                       id="${fieldId}_max" 
                       name="${attribute.name}_max" 
                       class="form-control" 
                       min="0"
                       step="0.01"
                       placeholder="Max"
                       value="${formData[`${attribute.name}_max`] || ''}"
                       ${attribute.required ? 'required' : ''}>
              </div>
            </div>
          </div>
        `;
        break;

      case 'Decimal':
        html += `
          <input type="number" 
                 id="${fieldId}" 
                 name="${attribute.name}" 
                 class="form-control" 
                 min="${attribute.min || 0}"
                 max="${attribute.max || 100}"
                 step="0.01"
                 placeholder="${attribute.placeholder || ''}"
                 value="${value}"
                 ${attribute.required ? 'required' : ''}
                 ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
        `;
        break;

      case 'Percentage':
        html += `
          <div class="input-group">
            <input type="number" 
                   id="${fieldId}" 
                   name="${attribute.name}" 
                   class="form-control" 
                   min="${attribute.min || 0}"
                   max="${attribute.max || 100}"
                   step="0.01"
                   placeholder="${attribute.placeholder || ''}"
                   value="${value}"
                   ${attribute.required ? 'required' : ''}
                   ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
            <span class="input-group-text">%</span>
          </div>
        `;
        break;

      case 'Date':
        html += `
          <input type="date" 
                 id="${fieldId}" 
                 name="${attribute.name}" 
                 class="form-control" 
                 value="${value}"
                 ${attribute.required ? 'required' : ''}
                 ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
        `;
        break;

      case 'DateRange':
        html += `
          <div class="row">
            <div class="col-md-6">
              <label class="form-label">Start Date</label>
              <input type="date" 
                     id="${fieldId}_start" 
                     name="${attribute.name}_start" 
                     class="form-control" 
                     value="${formData[`${attribute.name}_start`] || ''}"
                     ${attribute.required ? 'required' : ''}>
            </div>
            <div class="col-md-6">
              <label class="form-label">End Date</label>
              <input type="date" 
                     id="${fieldId}_end" 
                     name="${attribute.name}_end" 
                     class="form-control" 
                     value="${formData[`${attribute.name}_end`] || ''}"
                     ${attribute.required ? 'required' : ''}>
            </div>
          </div>
        `;
        break;

      case 'Enum':
        html += `
          <select id="${fieldId}" 
                  name="${attribute.name}" 
                  class="form-control"
                  ${attribute.required ? 'required' : ''}
                  ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
            <option value="">${attribute.placeholder || 'Select...'}</option>
            ${(attribute.options || []).map(opt => 
              `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
            ).join('')}
          </select>
        `;
        break;

      case 'Boolean':
        html += `
          <div class="form-check">
            <input type="checkbox" 
                   id="${fieldId}" 
                   name="${attribute.name}" 
                   class="form-check-input" 
                   value="true"
                   ${value === true || value === 'true' ? 'checked' : ''}
                   ${attribute.required ? 'required' : ''}
                   ${attribute.conditional ? `data-conditional="${JSON.stringify(attribute.conditional)}"` : ''}>
            <label class="form-check-label" for="${fieldId}">Yes</label>
          </div>
        `;
        break;

      case 'Array':
        if (attribute.itemType === 'String' || attribute.itemType === 'Enum') {
          // Multi-select or tag input
          html += `
            <div class="array-input-container">
              <div id="${fieldId}_items" class="array-items-list"></div>
              <div class="input-group">
                ${attribute.itemType === 'Enum' ? `
                  <select id="${fieldId}_input" class="form-control">
                    <option value="">Select...</option>
                    ${(attribute.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                ` : `
                  <input type="text" id="${fieldId}_input" class="form-control" placeholder="Add item...">
                `}
                <button type="button" class="btn btn-secondary" onclick="CollaborationModelsUI.addArrayItem('${fieldId}')">Add</button>
              </div>
              <input type="hidden" id="${fieldId}" name="${attribute.name}" value="${Array.isArray(value) ? JSON.stringify(value) : '[]'}">
            </div>
          `;
        } else if (attribute.itemType === 'Object') {
          // Complex array - render as expandable sections
          html += `
            <div class="object-array-container">
              <div id="${fieldId}_items"></div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="CollaborationModelsUI.addObjectItem('${fieldId}', ${JSON.stringify(attribute.schema || {})})">
                Add ${attribute.name}
              </button>
              <input type="hidden" id="${fieldId}" name="${attribute.name}" value="${Array.isArray(value) ? JSON.stringify(value) : '[]'}">
            </div>
          `;
        }
        break;

      default:
        html += `<input type="text" id="${fieldId}" name="${attribute.name}" class="form-control" value="${value}">`;
    }

    return html;
  }

  function generateForm(modelId, formData = {}) {
    if (!checkDependencies()) {
      return '<p class="alert alert-error">Collaboration models feature is not available.</p>';
    }

    const model = window.CollaborationModels.getModel(modelId);
    if (!model) {
      console.error('Model not found:', modelId);
      return '<p class="alert alert-error">Model not found.</p>';
    }

    currentModel = model;
    const attributes = model.attributes || [];
    let html = '';

    if (formMode === 'wizard') {
      // Group attributes into steps
      const steps = [];
      let currentStep = { title: 'Basic Information', fields: [] };
      
      attributes.forEach(attr => {
        currentStep.fields.push(attr);
        // Create new step every 5-7 fields
        if (currentStep.fields.length >= 6) {
          steps.push(currentStep);
          currentStep = { title: 'Additional Details', fields: [] };
        }
      });
      if (currentStep.fields.length > 0) {
        steps.push(currentStep);
      }

      // Render wizard
      html += '<div class="wizard-container">';
      html += '<div class="wizard-progress">';
      steps.forEach((step, index) => {
        html += `<div class="wizard-step ${index === 0 ? 'active' : ''}" data-step="${index}">
          <div class="step-number">${index + 1}</div>
          <div class="step-title">${step.title}</div>
        </div>`;
      });
      html += '</div>';

      steps.forEach((step, stepIndex) => {
        html += `<div class="wizard-panel" data-panel="${stepIndex}" style="display: ${stepIndex === 0 ? 'block' : 'none'}">`;
        step.fields.forEach(attr => {
          html += `<div class="form-group">${generateFormField(attr, formData)}</div>`;
        });
        html += '</div>';
      });

      html += '<div class="wizard-navigation">';
      html += '<button type="button" class="btn btn-secondary" onclick="CollaborationModelsUI.wizardPrevious()">Previous</button>';
      html += '<button type="button" class="btn btn-primary" onclick="CollaborationModelsUI.wizardNext()">Next</button>';
      html += '</div>';
      html += '</div>';
    } else {
      // Inline form - single page
      attributes.forEach(attr => {
        html += `<div class="form-group" data-field="${attr.name}">${generateFormField(attr, formData)}</div>`;
      });
    }

    return html;
  }

  // ============================================
  // Form Handling
  // ============================================
  function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!checkDependencies()) {
      alert('Collaboration features not available. Please refresh the page.');
      return false;
    }
    
    if (!currentModel) {
      alert('No model selected');
      return false;
    }

    const form = event.target;
    const formData = new FormData(form);
    const opportunityData = {
      modelType: currentModel.id,
      modelName: currentModel.name,
      creatorId: currentUser.id,
      relationshipType: formData.get('relationshipType') || 'B2B',
      attributes: {},
      status: 'draft'
    };

    // Collect all form values
    currentModel.attributes.forEach(attr => {
      if (attr.type === 'Boolean') {
        opportunityData.attributes[attr.name] = formData.get(attr.name) === 'true';
      } else if (attr.type === 'CurrencyRange') {
        opportunityData.attributes[attr.name] = {
          min: parseFloat(formData.get(`${attr.name}_min`)) || 0,
          max: parseFloat(formData.get(`${attr.name}_max`)) || 0,
          currency: attr.currency || 'SAR'
        };
      } else if (attr.type === 'DateRange') {
        opportunityData.attributes[attr.name] = {
          start: formData.get(`${attr.name}_start`),
          end: formData.get(`${attr.name}_end`)
        };
      } else if (attr.type === 'Array') {
        const hiddenInput = document.getElementById(`collab_${attr.name}`);
        if (hiddenInput) {
          try {
            opportunityData.attributes[attr.name] = JSON.parse(hiddenInput.value || '[]');
          } catch (e) {
            opportunityData.attributes[attr.name] = [];
          }
        } else {
          opportunityData.attributes[attr.name] = [];
        }
      } else {
        const value = formData.get(attr.name);
        if (value !== null && value !== '') {
          if (attr.type === 'Integer') {
            opportunityData.attributes[attr.name] = parseInt(value);
          } else if (attr.type === 'Currency' || attr.type === 'Decimal') {
            opportunityData.attributes[attr.name] = parseFloat(value);
          } else {
            opportunityData.attributes[attr.name] = value;
          }
        }
      }
    });

    // Validate required fields
    const missingFields = currentModel.attributes
      .filter(attr => attr.required && !opportunityData.attributes[attr.name])
      .map(attr => attr.question);

    if (missingFields.length > 0) {
      alert(`Please fill in all required fields:\n${missingFields.join('\n')}`);
      return false;
    }

    // Create opportunity
    const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);
    
    if (opportunity) {
      alert('Collaboration opportunity created successfully!');
      // Redirect to view opportunity or list
      window.location.hash = '#my-collaborations';
      return true;
    } else {
      alert('Error creating opportunity. Please try again.');
      return false;
    }
  }

  // ============================================
  // Array Input Helpers
  // ============================================
  function addArrayItem(fieldId) {
    const input = document.getElementById(`${fieldId}_input`);
    const hiddenInput = document.getElementById(fieldId);
    const itemsContainer = document.getElementById(`${fieldId}_items`);
    
    if (!input || !hiddenInput || !itemsContainer) return;

    const value = input.value.trim();
    if (!value) return;

    try {
      const items = JSON.parse(hiddenInput.value || '[]');
      if (!items.includes(value)) {
        items.push(value);
        hiddenInput.value = JSON.stringify(items);
        renderArrayItems(fieldId, items);
        input.value = '';
      }
    } catch (e) {
      console.error('Error parsing array:', e);
    }
  }

  function removeArrayItem(fieldId, index) {
    const hiddenInput = document.getElementById(fieldId);
    if (!hiddenInput) return;

    try {
      const items = JSON.parse(hiddenInput.value || '[]');
      items.splice(index, 1);
      hiddenInput.value = JSON.stringify(items);
      renderArrayItems(fieldId, items);
    } catch (e) {
      console.error('Error removing array item:', e);
    }
  }

  function renderArrayItems(fieldId, items) {
    const container = document.getElementById(`${fieldId}_items`);
    if (!container) return;

    container.innerHTML = items.map((item, index) => `
      <span class="badge badge-secondary array-item">
        ${item}
        <button type="button" class="btn-close btn-close-sm" onclick="CollaborationModelsUI.removeArrayItem('${fieldId}', ${index})" aria-label="Remove"></button>
      </span>
    `).join('');
  }

  function addObjectItem(fieldId, schema) {
    const hiddenInput = document.getElementById(fieldId);
    const container = document.getElementById(`${fieldId}_items`);
    
    if (!hiddenInput || !container) return;

    try {
      const items = JSON.parse(hiddenInput.value || '[]');
      const newItem = {};
      Object.keys(schema).forEach(key => {
        newItem[key] = schema[key].type === 'Boolean' ? false : '';
      });
      items.push(newItem);
      hiddenInput.value = JSON.stringify(items);
      renderObjectItems(fieldId, items, schema);
    } catch (e) {
      console.error('Error adding object item:', e);
    }
  }

  function renderObjectItems(fieldId, items, schema) {
    const container = document.getElementById(`${fieldId}_items`);
    if (!container) return;

    container.innerHTML = items.map((item, index) => {
      let html = `<div class="object-item-card">`;
      Object.keys(schema).forEach(key => {
        const fieldSchema = schema[key];
        html += `<div class="form-group">
          <label>${key}</label>
          ${fieldSchema.type === 'Enum' ? `
            <select class="form-control" onchange="CollaborationModelsUI.updateObjectItem('${fieldId}', ${index}, '${key}', this.value)">
              <option value="">Select...</option>
              ${(fieldSchema.options || []).map(opt => 
                `<option value="${opt}" ${item[key] === opt ? 'selected' : ''}>${opt}</option>`
              ).join('')}
            </select>
          ` : `
            <input type="text" class="form-control" value="${item[key] || ''}" 
                   onchange="CollaborationModelsUI.updateObjectItem('${fieldId}', ${index}, '${key}', this.value)">
          `}
        </div>`;
      });
      html += `<button type="button" class="btn btn-danger btn-sm" onclick="CollaborationModelsUI.removeObjectItem('${fieldId}', ${index})">Remove</button>`;
      html += `</div>`;
      return html;
    }).join('');
  }

  function updateObjectItem(fieldId, index, key, value) {
    const hiddenInput = document.getElementById(fieldId);
    if (!hiddenInput) return;

    try {
      const items = JSON.parse(hiddenInput.value || '[]');
      if (items[index]) {
        items[index][key] = value;
        hiddenInput.value = JSON.stringify(items);
      }
    } catch (e) {
      console.error('Error updating object item:', e);
    }
  }

  function removeObjectItem(fieldId, index) {
    const hiddenInput = document.getElementById(fieldId);
    if (!hiddenInput) return;

    try {
      const items = JSON.parse(hiddenInput.value || '[]');
      items.splice(index, 1);
      hiddenInput.value = JSON.stringify(items);
      const model = CollaborationModels.getModel(currentModel?.id);
      const attr = model?.attributes.find(a => a.name === fieldId.replace('collab_', ''));
      if (attr && attr.schema) {
        renderObjectItems(fieldId, items, attr.schema);
      }
    } catch (e) {
      console.error('Error removing object item:', e);
    }
  }

  // ============================================
  // Conditional Field Display
  // ============================================
  function setupConditionalFields() {
    document.querySelectorAll('[data-conditional]').forEach(field => {
      const conditional = JSON.parse(field.getAttribute('data-conditional'));
      const triggerField = document.querySelector(`[name="${conditional.field}"]`);
      
      if (triggerField) {
        const checkCondition = () => {
          const triggerValue = triggerField.type === 'checkbox' ? triggerField.checked : triggerField.value;
          const shouldShow = Array.isArray(conditional.value) 
            ? conditional.value.includes(triggerValue)
            : triggerValue === conditional.value;
          
          const formGroup = field.closest('.form-group');
          if (formGroup) {
            formGroup.style.display = shouldShow ? 'block' : 'none';
            if (!shouldShow) {
              field.value = '';
              field.required = false;
            } else if (field.hasAttribute('data-required')) {
              field.required = true;
            }
          }
        };

        triggerField.addEventListener('change', checkCondition);
        checkCondition(); // Initial check
      }
    });
  }

  // ============================================
  // Wizard Navigation
  // ============================================
  function wizardNext() {
    const panels = document.querySelectorAll('.wizard-panel');
    const currentPanel = document.querySelector('.wizard-panel[style*="block"]');
    if (!currentPanel) return;

    const currentIndex = parseInt(currentPanel.getAttribute('data-panel'));
    if (currentIndex < panels.length - 1) {
      currentPanel.style.display = 'none';
      panels[currentIndex + 1].style.display = 'block';
      
      // Update progress
      document.querySelectorAll('.wizard-step').forEach((step, idx) => {
        step.classList.toggle('active', idx <= currentIndex + 1);
      });
    }
  }

  function wizardPrevious() {
    const panels = document.querySelectorAll('.wizard-panel');
    const currentPanel = document.querySelector('.wizard-panel[style*="block"]');
    if (!currentPanel) return;

    const currentIndex = parseInt(currentPanel.getAttribute('data-panel'));
    if (currentIndex > 0) {
      currentPanel.style.display = 'none';
      panels[currentIndex - 1].style.display = 'block';
      
      // Update progress
      document.querySelectorAll('.wizard-step').forEach((step, idx) => {
        step.classList.toggle('active', idx <= currentIndex - 1);
      });
    }
  }

  // ============================================
  // Public API
  // ============================================
  // Always define the object, even if dependencies aren't loaded
  window.CollaborationModelsUI = {
    init(user) {
      currentUser = user;
      // Try to initialize if dependencies are now available
      if (checkDependencies() && user) {
        console.log('CollaborationModelsUI initialized');
      }
    },

    selectModel(modelId) {
      if (!checkDependencies()) {
        alert('Collaboration models feature is not available. Please refresh the page.');
        return;
      }

      const model = window.CollaborationModels.getModel(modelId);
      if (!model) {
        alert('Model not found');
        return;
      }

      // Check if user can create this model type
      const userRole = currentUser?.role || '';
      const relationshipType = userRole === 'entity' ? 'B2B' : 'P2P';
      
      if (!model.applicability.includes(relationshipType) && 
          !model.applicability.includes('B2P') && 
          !model.applicability.includes('P2B')) {
        alert('This collaboration model is not available for your account type.');
        return;
      }

      // Render form
      const container = document.getElementById('createCollaborationContent');
      if (container) {
        container.innerHTML = `
          <div class="card">
            <div class="card-header">
              <h2>Create ${model.name}</h2>
              <p>${model.description}</p>
            </div>
            <div class="card-body">
              <form id="collaborationForm" onsubmit="if(window.CollaborationModelsUI && CollaborationModelsUI.handleFormSubmit) { return CollaborationModelsUI.handleFormSubmit(event); } return false;">
                <input type="hidden" name="relationshipType" value="${relationshipType}">
                ${generateForm(model.id)}
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Create Opportunity</button>
                  <button type="button" class="btn btn-secondary" onclick="window.location.hash='#collaboration-models'">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        `;

        // Setup conditional fields
        setTimeout(setupConditionalFields, 100);
      }

      window.location.hash = '#create-collaboration';
    },

    renderModelSelection,
    renderCategoryDetail,
    viewCategory(categoryId) {
      window.location.hash = `collaboration-models/${categoryId}`;
    },
    backToCategories() {
      window.location.hash = 'collaboration-models';
    },
    generateForm,
    handleFormSubmit,
    addArrayItem,
    removeArrayItem,
    addObjectItem,
    updateObjectItem,
    removeObjectItem,
    wizardNext,
    wizardPrevious
  };

})();

