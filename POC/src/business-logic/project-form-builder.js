/**
 * Project Form Builder
 * Dynamic form generation based on project category
 * Supports construction scope and extensible to other types
 */

(function() {
  'use strict';

  let categoryConfig = null;
  let commonFieldsConfig = null;

  // ============================================
  // Load Category Configuration
  // ============================================
  async function loadCategoryConfig() {
    if (categoryConfig) {
      return categoryConfig;
    }

    try {
      const basePath = getBasePath();
      const response = await fetch(basePath + 'data/project-categories.json');
      if (!response.ok) {
        throw new Error(`Failed to load category config: ${response.status}`);
      }
      
      const data = await response.json();
      categoryConfig = data.categories;
      commonFieldsConfig = data.commonFields;
      console.log('[ProjectFormBuilder] Category configuration loaded');
      return data;
    } catch (error) {
      console.error('[ProjectFormBuilder] Error loading category config:', error);
      return null;
    }
  }

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    
    // Count how many directory levels deep we are (excluding POC root and filename)
    // For example: /POC/admin/users-management/ = 2 levels deep, need ../../ to reach POC root
    // For example: /POC/dashboard/ = 1 level deep, need ../ to reach POC root
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Render Dynamic Form Sections
  // ============================================
  function renderCategoryDetails(containerId, category) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[ProjectFormBuilder] Container not found:', containerId);
      return;
    }

    if (!categoryConfig || !categoryConfig[category]) {
      console.warn('[ProjectFormBuilder] Category not found:', category);
      return;
    }

    const categoryData = categoryConfig[category];
    let html = '';

    // Render each detail section
    categoryData.detailSections.forEach(section => {
      html += `
        <div class="category-detail-section" data-section-id="${section.id}">
          <div class="section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--border-color);">
            <h3 style="margin: 0;">${section.label}</h3>
            <button type="button" class="btn btn-sm btn-secondary toggle-section" data-section="${section.id}">
              <i class="ph ph-chevron-down"></i>
            </button>
          </div>
          <div class="section-content" id="section-${section.id}">
      `;

      // Render fields in this section
      section.fields.forEach(field => {
        html += renderField(field, section.id);
      });

      html += `
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add toggle functionality
    document.querySelectorAll('.toggle-section').forEach(btn => {
      btn.addEventListener('click', function() {
        const sectionId = this.getAttribute('data-section');
        const content = document.getElementById(`section-${sectionId}`);
        const icon = this.querySelector('i');
        
        if (content.style.display === 'none') {
          content.style.display = 'block';
          icon.className = 'ph ph-chevron-down';
        } else {
          content.style.display = 'none';
          icon.className = 'ph ph-chevron-up';
        }
      });
    });
  }

  // ============================================
  // Render Common Fields
  // ============================================
  function renderCommonFields(containerId) {
    const container = document.getElementById(containerId);
    if (!container || !commonFieldsConfig) return;

    let html = '';

    Object.values(commonFieldsConfig).forEach(section => {
      html += `
        <div class="common-field-section" data-section-id="${section.id}">
          <h3 style="margin-bottom: 1rem;">${section.label}</h3>
      `;

      section.fields.forEach(field => {
        if (field.type === 'dynamic_list') {
          html += renderDynamicList(field, section.id);
        } else if (field.type === 'checkbox' && field.subFields) {
          html += renderCheckboxWithSubFields(field, section.id);
        } else {
          html += renderField(field, section.id);
        }
      });

      html += `</div>`;
    });

    container.innerHTML = html;

    // Initialize dynamic lists
    initializeDynamicLists();
  }

  // ============================================
  // Render Field
  // ============================================
  function renderField(field, sectionId) {
    const fieldId = `${sectionId}_${field.id}`;
    const fieldName = `projectDetails[${sectionId}][${field.id}]`;

    switch (field.type) {
      case 'text':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <input type="text" id="${fieldId}" name="${fieldName}" class="form-control" placeholder="${field.placeholder || ''}">
          </div>
        `;

      case 'textarea':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <textarea id="${fieldId}" name="${fieldName}" class="form-control" rows="3" placeholder="${field.placeholder || ''}"></textarea>
          </div>
        `;

      case 'number':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <input type="number" id="${fieldId}" name="${fieldName}" class="form-control" placeholder="${field.placeholder || ''}" min="0" step="0.01">
          </div>
        `;

      case 'date':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <input type="date" id="${fieldId}" name="${fieldName}" class="form-control">
          </div>
        `;

      case 'select':
        const options = field.options.map(opt => 
          `<option value="${opt}">${opt}</option>`
        ).join('');
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <select id="${fieldId}" name="${fieldName}" class="form-control">
              <option value="">Select ${field.label}</option>
              ${options}
            </select>
          </div>
        `;

      case 'file':
        return `
          <div class="form-group">
            <label for="${fieldId}" class="form-label">${field.label}</label>
            <input type="file" id="${fieldId}" name="${fieldName}" class="form-control" 
                   accept="${field.accept || '*'}" ${field.multiple ? 'multiple' : ''}>
            <small class="form-text">${field.accept ? `Accepted formats: ${field.accept}` : 'Any file type'}</small>
          </div>
        `;

      default:
        return '';
    }
  }

  // ============================================
  // Render Dynamic List
  // ============================================
  function renderDynamicList(field, sectionId) {
    const listId = `${sectionId}_${field.id}`;
    const listName = `projectDetails[${sectionId}][${field.id}]`;

    let html = `
      <div class="form-group dynamic-list-group" data-list-id="${listId}">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <label class="form-label">${field.label}</label>
          <button type="button" class="btn btn-sm btn-primary add-list-item" data-list="${listId}" data-fields='${JSON.stringify(field.fields)}'>
            <i class="ph ph-plus"></i> Add ${field.itemLabel || 'Item'}
          </button>
        </div>
        <div id="${listId}-items" class="dynamic-list-items">
          <!-- Items will be added here dynamically -->
        </div>
      </div>
    `;

    return html;
  }

  // ============================================
  // Render Checkbox with Sub-Fields
  // ============================================
  function renderCheckboxWithSubFields(field, sectionId) {
    const checkboxId = `${sectionId}_${field.id}`;
    const checkboxName = `projectDetails[${sectionId}][${field.id}]`;
    const subFieldsId = `${checkboxId}_subfields`;

    let html = `
      <div class="form-group checkbox-with-subfields">
        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
          <input type="checkbox" id="${checkboxId}" name="${checkboxName}" class="toggle-subfields" data-target="${subFieldsId}">
          <span>${field.label}</span>
        </label>
        <div id="${subFieldsId}" class="subfields-container" style="display: none; margin-top: 1rem; padding-left: 1.5rem; border-left: 2px solid var(--border-color);">
    `;

    field.subFields.forEach(subField => {
      const subFieldId = `${subFieldsId}_${subField.id}`;
      const subFieldName = `projectDetails[${sectionId}][${field.id}][${subField.id}]`;
      const subFieldHtml = renderField({ ...subField, id: subFieldId }, sectionId);
      // Replace the name attribute with the correct one for subfields
      html += subFieldHtml.replace(/name="[^"]*"/, `name="${subFieldName}"`);
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // ============================================
  // Initialize Dynamic Lists
  // ============================================
  function initializeDynamicLists() {
    // Add item button handlers
    document.querySelectorAll('.add-list-item').forEach(btn => {
      btn.addEventListener('click', function() {
        const listId = this.getAttribute('data-list');
        const fields = JSON.parse(this.getAttribute('data-fields'));
        addListItem(listId, fields);
      });
    });

    // Toggle subfields handlers
    document.querySelectorAll('.toggle-subfields').forEach(checkbox => {
      checkbox.addEventListener('change', function() {
        const targetId = this.getAttribute('data-target');
        const container = document.getElementById(targetId);
        if (container) {
          container.style.display = this.checked ? 'block' : 'none';
        }
      });
    });
  }

  // ============================================
  // Add List Item
  // ============================================
  function addListItem(listId, fields) {
    const container = document.getElementById(`${listId}-items`);
    if (!container) return;

    const itemIndex = container.children.length;
    const itemId = `${listId}_item_${itemIndex}`;

    let html = `
      <div class="dynamic-list-item card" style="margin-bottom: 1rem; padding: 1rem;" data-item-id="${itemId}">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
          <strong>${fields[0]?.label || 'Item'} ${itemIndex + 1}</strong>
          <button type="button" class="btn btn-sm btn-danger remove-list-item" data-item="${itemId}">
            <i class="ph ph-trash"></i>
          </button>
        </div>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
    `;

    fields.forEach(field => {
      const fieldId = `${itemId}_${field.id}`;
      const fieldName = `${listId}[${itemIndex}][${field.id}]`;
      const fieldHtml = renderField({ ...field, id: fieldId }, '');
      // Replace the name attribute with the correct one for dynamic lists
      html += fieldHtml.replace(/name="[^"]*"/, `name="${fieldName}"`);
    });

    html += `
        </div>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', html);

    // Add remove button handler
    const removeBtn = container.querySelector(`[data-item="${itemId}"]`);
    if (removeBtn) {
      removeBtn.addEventListener('click', function() {
        const item = this.closest('.dynamic-list-item');
        if (item) {
          item.remove();
          // Re-index remaining items
          reindexListItems(listId);
        }
      });
    }
  }

  // ============================================
  // Re-index List Items
  // ============================================
  function reindexListItems(listId) {
    const container = document.getElementById(`${listId}-items`);
    if (!container) return;

    container.querySelectorAll('.dynamic-list-item').forEach((item, index) => {
      const inputs = item.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        const name = input.name;
        if (name) {
          // Update name to reflect new index
          const newName = name.replace(/\[\d+\]/, `[${index}]`);
          input.name = newName;
        }
      });
    });
  }

  // ============================================
  // Collect Form Data
  // ============================================
  function collectFormData() {
    const formData = {
      basic: {
        title: document.getElementById('projectTitle')?.value || '',
        description: document.getElementById('projectDescription')?.value || '',
        category: document.getElementById('projectCategory')?.value || '',
        city: document.getElementById('projectCity')?.value || '',
        region: document.getElementById('projectRegion')?.value || ''
      },
      scope: {
        requiredServices: document.getElementById('requiredServices')?.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s) || [],
        skillRequirements: document.getElementById('requiredSkills')?.value
          .split(',')
          .map(s => s.trim())
          .filter(s => s) || []
      },
      budget: {
        min: parseFloat(document.getElementById('minBudget')?.value) || 0,
        max: parseFloat(document.getElementById('maxBudget')?.value) || 0,
        currency: 'SAR'
      },
      details: {},
      timeline: {},
      facilities: {},
      attachments: {}
    };

    // Collect category-specific details
    document.querySelectorAll('.category-detail-section').forEach(section => {
      const sectionId = section.getAttribute('data-section-id');
      formData.details[sectionId] = {};
      
      section.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.name && input.name.startsWith(`projectDetails[${sectionId}]`)) {
          const fieldName = input.name.match(/\[([^\]]+)\]$/)?.[1];
          if (fieldName) {
            if (input.type === 'checkbox') {
              formData.details[sectionId][fieldName] = input.checked;
            } else if (input.type === 'number') {
              formData.details[sectionId][fieldName] = parseFloat(input.value) || 0;
            } else {
              formData.details[sectionId][fieldName] = input.value;
            }
          }
        }
      });
    });

    // Collect common fields (timeline, facilities, attachments)
    document.querySelectorAll('.common-field-section').forEach(section => {
      const sectionId = section.getAttribute('data-section-id');
      formData[sectionId] = {};
      
      // Handle dynamic lists
      section.querySelectorAll('.dynamic-list-group').forEach(listGroup => {
        const listId = listGroup.getAttribute('data-list-id');
        const items = [];
        
        listGroup.querySelectorAll('.dynamic-list-item').forEach((item, index) => {
          const itemData = {};
          item.querySelectorAll('input, select, textarea').forEach(input => {
            if (input.name && input.name.includes(`[${index}]`)) {
              const fieldName = input.name.match(/\[([^\]]+)\]$/)?.[1];
              if (fieldName) {
                if (input.type === 'number') {
                  itemData[fieldName] = parseFloat(input.value) || 0;
                } else {
                  itemData[fieldName] = input.value;
                }
              }
            }
          });
          if (Object.keys(itemData).length > 0) {
            items.push(itemData);
          }
        });
        
        const fieldName = listId.split('_').pop();
        formData[sectionId][fieldName] = items;
      });

      // Handle regular fields
      section.querySelectorAll('input, select, textarea').forEach(input => {
        if (input.name && input.name.startsWith(`projectDetails[${sectionId}]`)) {
          const fieldName = input.name.match(/\[([^\]]+)\]$/)?.[1];
          if (fieldName && !input.closest('.dynamic-list-item')) {
            if (input.type === 'checkbox') {
              formData[sectionId][fieldName] = input.checked;
            } else if (input.type === 'number') {
              formData[sectionId][fieldName] = parseFloat(input.value) || 0;
            } else if (input.type === 'date') {
              formData[sectionId][fieldName] = input.value;
            } else {
              formData[sectionId][fieldName] = input.value;
            }
          }
        }
      });
    });

    // Collect collaboration models data
    if (typeof CollaborationModelsSelector !== 'undefined' && typeof CollaborationModelFields !== 'undefined') {
      const selectedModels = CollaborationModelsSelector.getSelectedModels();
      const modelData = CollaborationModelFields.collectModelData();
      
      if (selectedModels.length > 0) {
        formData.collaborationModels = {
          selectedModels: selectedModels,
          modelData: modelData
        };
      }
    }

    return formData;
  }

  // ============================================
  // Public API
  // ============================================
  window.ProjectFormBuilder = {
    loadCategoryConfig,
    renderCategoryDetails,
    renderCommonFields,
    collectFormData,
    addListItem
  };

})();

