/**
 * Collaboration Model Fields Renderer
 * Dynamically renders fields based on selected collaboration models
 */

(function() {
  'use strict';

  let modelData = {}; // Stores field values by model ID

  // ============================================
  // Render Fields for Selected Models
  // ============================================
  function renderFields(selectedModelIds) {
    const container = document.getElementById('collaborationModelFields');
    if (!container) {
      console.error('[CollaborationModelFields] Container not found');
      return;
    }

    if (!selectedModelIds || selectedModelIds.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Check if CollaborationModels is available
    if (typeof window.CollaborationModels === 'undefined') {
      container.innerHTML = `
        <div class="alert alert-info">
          <p>Loading collaboration model fields...</p>
        </div>
      `;
      setTimeout(() => renderFields(selectedModelIds), 500);
      return;
    }

    let html = '';

    selectedModelIds.forEach(modelId => {
      const model = window.CollaborationModels.getModel(modelId);
      if (!model || !model.attributes) {
        return;
      }

      // Initialize model data if not exists
      if (!modelData[modelId]) {
        modelData[modelId] = {};
      }

      // Get category name
      let categoryName = model.category;
      if (typeof window.CollaborationModels !== 'undefined') {
        const categories = window.CollaborationModels.getAllCategories();
        const category = categories.find(cat => cat.name === model.category || cat.subModels.includes(modelId));
        if (category) {
          categoryName = category.name;
        }
      }

      html += `
        <div class="collaboration-model-fields-group card enhanced-card" data-model-id="${modelId}" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h3 class="section-title spacing-section" style="display: flex; align-items: center; gap: 0.5rem;">
              <span>${model.name}</span>
              <span style="font-size: 0.875rem; font-weight: normal; color: var(--text-secondary);">
                (${categoryName})
              </span>
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">${model.description}</p>
            
            <div class="model-fields-container" data-model-id="${modelId}">
      `;

      // Render each attribute as a field
      model.attributes.forEach(attr => {
        // Check conditional fields
        if (attr.conditional) {
          const conditionField = attr.conditional.field;
          const conditionValue = attr.conditional.value;
          const currentValue = modelData[modelId][conditionField];
          
          // Check if condition is met
          if (Array.isArray(conditionValue)) {
            if (!conditionValue.includes(currentValue)) {
              return; // Skip this field
            }
          } else if (currentValue !== conditionValue) {
            return; // Skip this field
          }
        }

        html += renderField(attr, modelId);
      });

      html += `
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Initialize field event listeners
    initializeFieldListeners(selectedModelIds);
  }

  // ============================================
  // Render Single Field
  // ============================================
  function renderField(attr, modelId) {
    const fieldId = `collab_${modelId}_${attr.name}`;
    const fieldName = `collaborationModels[${modelId}][${attr.name}]`;
    const currentValue = modelData[modelId][attr.name] || '';
    const requiredAttr = attr.required ? 'required' : '';
    const requiredClass = attr.required ? 'required' : '';

    switch (attr.type) {
      case 'String':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <input type="text" 
                   id="${fieldId}" 
                   name="${fieldName}" 
                   class="form-control collaboration-field" 
                   data-model-id="${modelId}"
                   data-attr-name="${attr.name}"
                   placeholder="${attr.placeholder || ''}"
                   maxlength="${attr.maxLength || ''}"
                   value="${escapeHtml(currentValue)}"
                   ${requiredAttr}>
            ${attr.maxLength ? `<small class="form-text">Max ${attr.maxLength} characters</small>` : ''}
          </div>
        `;

      case 'Text':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <textarea id="${fieldId}" 
                      name="${fieldName}" 
                      class="form-control collaboration-field" 
                      data-model-id="${modelId}"
                      data-attr-name="${attr.name}"
                      rows="4"
                      placeholder="${attr.placeholder || ''}"
                      maxlength="${attr.maxLength || ''}"
                      ${requiredAttr}>${escapeHtml(currentValue)}</textarea>
            ${attr.maxLength ? `<small class="form-text">Max ${attr.maxLength} characters</small>` : ''}
          </div>
        `;

      case 'Integer':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <input type="number" 
                   id="${fieldId}" 
                   name="${fieldName}" 
                   class="form-control collaboration-field" 
                   data-model-id="${modelId}"
                   data-attr-name="${attr.name}"
                   placeholder="${attr.placeholder || ''}"
                   min="${attr.min || 0}"
                   max="${attr.max || ''}"
                   value="${currentValue}"
                   ${requiredAttr}>
          </div>
        `;

      case 'Currency':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="number" 
                     id="${fieldId}" 
                     name="${fieldName}" 
                     class="form-control collaboration-field" 
                     data-model-id="${modelId}"
                     data-attr-name="${attr.name}"
                     placeholder="${attr.placeholder || ''}"
                     min="0"
                     step="0.01"
                     value="${currentValue}"
                     ${requiredAttr}>
              <span style="color: var(--text-secondary);">${attr.currency || 'SAR'}</span>
            </div>
          </div>
        `;

      case 'CurrencyRange':
        const minFieldId = `${fieldId}_min`;
        const maxFieldId = `${fieldId}_max`;
        const minValue = (typeof currentValue === 'object' && currentValue.min) ? currentValue.min : '';
        const maxValue = (typeof currentValue === 'object' && currentValue.max) ? currentValue.max : '';
        return `
          <div class="form-group">
            <label class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <div class="content-grid-2">
              <div>
                <label for="${minFieldId}" class="form-label" style="font-size: 0.875rem;">Min</label>
                <input type="number" 
                       id="${minFieldId}" 
                       name="${fieldName}[min]" 
                       class="form-control collaboration-field" 
                       data-model-id="${modelId}"
                       data-attr-name="${attr.name}"
                       placeholder="Min ${attr.currency || 'SAR'}"
                       min="0"
                       step="0.01"
                       value="${minValue}"
                       ${requiredAttr}>
              </div>
              <div>
                <label for="${maxFieldId}" class="form-label" style="font-size: 0.875rem;">Max</label>
                <input type="number" 
                       id="${maxFieldId}" 
                       name="${fieldName}[max]" 
                       class="form-control collaboration-field" 
                       data-model-id="${modelId}"
                       data-attr-name="${attr.name}"
                       placeholder="Max ${attr.currency || 'SAR'}"
                       min="0"
                       step="0.01"
                       value="${maxValue}"
                       ${requiredAttr}>
              </div>
            </div>
            <small class="form-text">Currency: ${attr.currency || 'SAR'}</small>
          </div>
        `;

      case 'Enum':
        const options = (attr.options || []).map(opt => {
          const selected = currentValue === opt ? 'selected' : '';
          return `<option value="${escapeHtml(opt)}" ${selected}>${escapeHtml(opt)}</option>`;
        }).join('');
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <select id="${fieldId}" 
                    name="${fieldName}" 
                    class="form-control collaboration-field" 
                    data-model-id="${modelId}"
                    data-attr-name="${attr.name}"
                    ${requiredAttr}>
              <option value="">${attr.placeholder || 'Select an option'}</option>
              ${options}
            </select>
          </div>
        `;

      case 'Boolean':
        const checked = currentValue === true || currentValue === 'true' ? 'checked' : '';
        return `
          <div class="form-group">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" 
                     id="${fieldId}" 
                     name="${fieldName}" 
                     class="collaboration-field" 
                     data-model-id="${modelId}"
                     data-attr-name="${attr.name}"
                     value="true"
                     ${checked}
                     ${requiredAttr}>
              <span class="form-label ${requiredClass}">
                ${attr.question || attr.name} ${attr.required ? '*' : ''}
              </span>
            </label>
          </div>
        `;

      case 'Date':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <input type="date" 
                   id="${fieldId}" 
                   name="${fieldName}" 
                   class="form-control collaboration-field" 
                   data-model-id="${modelId}"
                   data-attr-name="${attr.name}"
                   value="${currentValue}"
                   ${requiredAttr}>
          </div>
        `;

      case 'Array':
        // For arrays, render as a tag input or comma-separated input
        const arrayValue = Array.isArray(currentValue) ? currentValue.join(', ') : currentValue;
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label ${requiredClass}">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <input type="text" 
                   id="${fieldId}" 
                   name="${fieldName}" 
                   class="form-control collaboration-field" 
                   data-model-id="${modelId}"
                   data-attr-name="${attr.name}"
                   placeholder="${attr.placeholder || 'Enter values separated by commas'}"
                   value="${escapeHtml(arrayValue)}"
                   ${requiredAttr}>
            <small class="form-text">Enter multiple values separated by commas</small>
          </div>
        `;

      default:
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">
              ${attr.question || attr.name} ${attr.required ? '*' : ''}
            </label>
            <input type="text" 
                   id="${fieldId}" 
                   name="${fieldName}" 
                   class="form-control collaboration-field" 
                   data-model-id="${modelId}"
                   data-attr-name="${attr.name}"
                   placeholder="${attr.placeholder || ''}"
                   value="${escapeHtml(currentValue)}"
                   ${requiredAttr}>
          </div>
        `;
    }
  }

  // ============================================
  // Initialize Field Listeners
  // ============================================
  function initializeFieldListeners(selectedModelIds) {
    // Listen for field changes
    document.querySelectorAll('.collaboration-field').forEach(field => {
      field.addEventListener('change', handleFieldChange);
      field.addEventListener('input', handleFieldChange);
    });

    // Handle conditional fields - re-render when condition field changes
    selectedModelIds.forEach(modelId => {
      const model = window.CollaborationModels.getModel(modelId);
      if (!model || !model.attributes) return;

      model.attributes.forEach(attr => {
        if (attr.conditional) {
          const conditionField = document.querySelector(
            `.collaboration-field[data-model-id="${modelId}"][data-attr-name="${attr.conditional.field}"]`
          );
          if (conditionField) {
            conditionField.addEventListener('change', () => {
              // Re-render fields for this model to show/hide conditional fields
              renderFields(selectedModelIds);
            });
          }
        }
      });
    });
  }

  // ============================================
  // Handle Field Change
  // ============================================
  function handleFieldChange(event) {
    const field = event.target;
    const modelId = field.getAttribute('data-model-id');
    const attrName = field.getAttribute('data-attr-name');

    if (!modelId || !attrName) return;

    // Initialize model data if needed
    if (!modelData[modelId]) {
      modelData[modelId] = {};
    }

    // Store field value
    if (field.type === 'checkbox') {
      modelData[modelId][attrName] = field.checked;
    } else if (field.type === 'number') {
      modelData[modelId][attrName] = parseFloat(field.value) || 0;
    } else if (field.name && field.name.includes('[min]') || field.name.includes('[max]')) {
      // Handle currency range
      const baseName = attrName;
      if (!modelData[modelId][baseName]) {
        modelData[modelId][baseName] = {};
      }
      if (field.name.includes('[min]')) {
        modelData[modelId][baseName].min = parseFloat(field.value) || 0;
      } else {
        modelData[modelId][baseName].max = parseFloat(field.value) || 0;
      }
    } else {
      modelData[modelId][attrName] = field.value;
    }
  }

  // ============================================
  // Collect Model Data
  // ============================================
  function collectModelData() {
    const collected = {};

    Object.keys(modelData).forEach(modelId => {
      const model = modelData[modelId];
      collected[modelId] = { ...model };
    });

    return collected;
  }

  // ============================================
  // Get Model Data
  // ============================================
  function getModelData(modelId) {
    return modelData[modelId] || {};
  }

  // ============================================
  // Set Model Data
  // ============================================
  function setModelData(modelId, data) {
    modelData[modelId] = { ...data };
  }

  // ============================================
  // Validate Model Fields
  // ============================================
  function validateModelFields(selectedModelIds) {
    const errors = [];

    selectedModelIds.forEach(modelId => {
      const model = window.CollaborationModels.getModel(modelId);
      if (!model || !model.attributes) return;

      model.attributes.forEach(attr => {
        // Check conditional fields
        if (attr.conditional) {
          const conditionField = attr.conditional.field;
          const conditionValue = attr.conditional.value;
          const currentValue = modelData[modelId]?.[conditionField];
          
          if (Array.isArray(conditionValue)) {
            if (!conditionValue.includes(currentValue)) {
              return; // Skip validation for this field
            }
          } else if (currentValue !== conditionValue) {
            return; // Skip validation for this field
          }
        }

        // Validate required fields
        if (attr.required) {
          const value = modelData[modelId]?.[attr.name];
          if (value === undefined || value === null || value === '' || 
              (Array.isArray(value) && value.length === 0)) {
            errors.push(`${model.name}: ${attr.question || attr.name} is required`);
          }
        }

        // Validate field types
        const value = modelData[modelId]?.[attr.name];
        if (value !== undefined && value !== null && value !== '') {
          if (attr.type === 'Integer' && isNaN(parseInt(value))) {
            errors.push(`${model.name}: ${attr.question || attr.name} must be a number`);
          }
          if (attr.maxLength && value.length > attr.maxLength) {
            errors.push(`${model.name}: ${attr.question || attr.name} exceeds maximum length`);
          }
        }
      });
    });

    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ============================================
  // Clear Model Data
  // ============================================
  function clearModelData() {
    modelData = {};
  }

  // ============================================
  // Escape HTML
  // ============================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Export
  // ============================================
  window.CollaborationModelFields = {
    renderFields,
    collectModelData,
    getModelData,
    setModelData,
    validateModelFields,
    clearModelData
  };

})();

