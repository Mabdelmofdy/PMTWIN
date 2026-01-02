/**
 * PMTwin Collaboration Workflows
 * Complete workflow handlers for all collaboration models
 */

(function() {
  'use strict';

  // ============================================
  // Base Workflow Handler
  // ============================================
  class CollaborationWorkflow {
    constructor(modelId, modelName) {
      this.modelId = modelId;
      this.modelName = modelName;
      this.formData = {};
      this.currentStep = 0;
      this.totalSteps = 1;
    }

    async init() {
      console.log(`[Workflow] Initializing ${this.modelName} workflow`);
      
      // Check dependencies
      if (typeof window.CollaborationModels === 'undefined') {
        console.error('[Workflow] CollaborationModels not available');
        return false;
      }

      if (typeof CollaborationService === 'undefined') {
        console.error('[Workflow] CollaborationService not available');
        return false;
      }

      // Get model definition
      const model = window.CollaborationModels.getModel(this.modelId);
      if (!model) {
        console.error(`[Workflow] Model ${this.modelId} not found`);
        return false;
      }

      this.model = model;
      return true;
    }

    async validateForm() {
      // Override in subclasses
      return { valid: true, errors: [] };
    }

    async submitForm() {
      // Override in subclasses
      return { success: false, error: 'Not implemented' };
    }

    collectFormData() {
      // Override in subclasses
      return {};
    }
  }

  // ============================================
  // Model 1.1: Task-Based Engagement Workflow
  // ============================================
  class TaskBasedWorkflow extends CollaborationWorkflow {
    constructor() {
      super('1.1', 'Task-Based Engagement');
      this.totalSteps = 1;
    }

    collectFormData() {
      const form = document.getElementById('collaborationForm');
      if (!form) return {};

      return {
        modelId: this.modelId,
        modelName: this.modelName,
        taskTitle: form.querySelector('#taskTitle')?.value || '',
        taskType: form.querySelector('#taskType')?.value || '',
        detailedScope: form.querySelector('#detailedScope')?.value || '',
        duration: parseInt(form.querySelector('#duration')?.value) || 0,
        budgetRange: {
          min: parseFloat(form.querySelector('#minBudget')?.value) || 0,
          max: parseFloat(form.querySelector('#maxBudget')?.value) || 0
        },
        budgetType: form.querySelector('#budgetType')?.value || '',
        requiredSkills: this.getArrayValue('requiredSkills'),
        experienceLevel: form.querySelector('#experienceLevel')?.value || '',
        locationRequirement: form.querySelector('#locationRequirement')?.value || '',
        startDate: form.querySelector('#startDate')?.value || '',
        deliverableFormat: form.querySelector('#deliverableFormat')?.value || '',
        paymentTerms: form.querySelector('#paymentTerms')?.value || '',
        exchangeType: form.querySelector('#exchangeType')?.value || '',
        barterOffer: form.querySelector('#barterOffer')?.value || ''
      };
    }

    getArrayValue(fieldId) {
      const container = document.getElementById(`${fieldId}Container`);
      if (!container) return [];
      
      const items = container.querySelectorAll('.array-item');
      return Array.from(items).map(item => {
        const input = item.querySelector('input');
        return input ? input.value.trim() : '';
      }).filter(val => val.length > 0);
    }

    async validateForm() {
      const errors = [];
      const data = this.collectFormData();

      if (!data.taskTitle || data.taskTitle.trim().length === 0) {
        errors.push('Task title is required');
      }

      if (!data.taskType) {
        errors.push('Task type is required');
      }

      if (!data.detailedScope || data.detailedScope.trim().length < 50) {
        errors.push('Detailed scope must be at least 50 characters');
      }

      if (!data.duration || data.duration < 1) {
        errors.push('Duration must be at least 1 day');
      }

      if (!data.budgetRange || data.budgetRange.min < 0) {
        errors.push('Valid budget range is required');
      }

      if (data.requiredSkills.length === 0) {
        errors.push('At least one required skill must be specified');
      }

      if (!data.startDate) {
        errors.push('Start date is required');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    }

    async submitForm() {
      const validation = await this.validateForm();
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const formData = this.collectFormData();
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      
      if (!currentUser) {
        return {
          success: false,
          error: 'User session not found'
        };
      }

      // Determine relationship type
      const userRole = currentUser.role || '';
      const relationshipType = userRole === 'entity' || userRole === 'company' ? 'B2B' : 'P2P';

      const opportunityData = {
        ...formData,
        relationshipType: relationshipType,
        createdBy: currentUser.id,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      try {
        const result = await CollaborationService.createCollaborationOpportunity(opportunityData);
        
        if (result.success) {
          // Show success message
          this.showSuccess('Task-Based Engagement opportunity created successfully!');
          
          // Redirect after delay
          setTimeout(() => {
            window.location.href = '../../collaboration/';
          }, 2000);
        }
        
        return result;
      } catch (error) {
        console.error('[Workflow] Error submitting form:', error);
        return {
          success: false,
          error: error.message || 'Failed to create opportunity'
        };
      }
    }

    showSuccess(message) {
      const container = document.getElementById('collaborationFormContainer');
      if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `<p>${message}</p>`;
        container.insertBefore(alert, container.firstChild);
      }
    }

    showError(message) {
      const container = document.getElementById('collaborationFormContainer');
      if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `<p>${message}</p>`;
        container.insertBefore(alert, container.firstChild);
      }
    }
  }

  // ============================================
  // Model 1.2: Consortium Workflow
  // ============================================
  class ConsortiumWorkflow extends CollaborationWorkflow {
    constructor() {
      super('1.2', 'Consortium');
    }

    collectFormData() {
      const form = document.getElementById('collaborationForm');
      if (!form) return {};

      return {
        modelId: this.modelId,
        modelName: this.modelName,
        projectTitle: form.querySelector('#projectTitle')?.value || '',
        projectType: form.querySelector('#projectType')?.value || '',
        projectValue: parseFloat(form.querySelector('#projectValue')?.value) || 0,
        projectDuration: parseInt(form.querySelector('#projectDuration')?.value) || 0,
        projectLocation: form.querySelector('#projectLocation')?.value || '',
        leadMember: form.querySelector('#leadMember')?.checked || false,
        requiredMembers: parseInt(form.querySelector('#requiredMembers')?.value) || 0,
        memberRoles: this.getObjectArrayValue('memberRoles'),
        scopeDivision: form.querySelector('#scopeDivision')?.value || '',
        liabilityStructure: form.querySelector('#liabilityStructure')?.value || '',
        clientType: form.querySelector('#clientType')?.value || '',
        tenderDeadline: form.querySelector('#tenderDeadline')?.value || '',
        prequalificationRequired: form.querySelector('#prequalificationRequired')?.checked || false,
        minimumRequirements: this.getObjectArrayValue('minimumRequirements'),
        consortiumAgreement: form.querySelector('#consortiumAgreement')?.checked || false,
        paymentDistribution: form.querySelector('#paymentDistribution')?.value || ''
      };
    }

    getObjectArrayValue(fieldId) {
      const container = document.getElementById(`${fieldId}Container`);
      if (!container) return [];
      
      const items = container.querySelectorAll('.object-item-card');
      return Array.from(items).map(item => {
        const obj = {};
        item.querySelectorAll('input, select, textarea').forEach(input => {
          const key = input.name || input.id.replace(fieldId, '').replace(/[^a-zA-Z]/g, '');
          if (key) {
            obj[key] = input.type === 'checkbox' ? input.checked : input.value;
          }
        });
        return obj;
      }).filter(obj => Object.keys(obj).length > 0);
    }

    async validateForm() {
      const errors = [];
      const data = this.collectFormData();

      if (!data.projectTitle || data.projectTitle.trim().length === 0) {
        errors.push('Project title is required');
      }

      if (!data.projectType) {
        errors.push('Project type is required');
      }

      if (!data.projectValue || data.projectValue < 0) {
        errors.push('Valid project value is required');
      }

      if (!data.requiredMembers || data.requiredMembers < 1) {
        errors.push('At least one consortium member is required');
      }

      if (data.memberRoles.length === 0) {
        errors.push('At least one member role must be specified');
      }

      return {
        valid: errors.length === 0,
        errors: errors
      };
    }

    async submitForm() {
      const validation = await this.validateForm();
      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      const formData = this.collectFormData();
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      
      if (!currentUser) {
        return {
          success: false,
          error: 'User session not found'
        };
      }

      const relationshipType = currentUser.role === 'entity' || currentUser.role === 'company' ? 'B2B' : 'P2P';

      const opportunityData = {
        ...formData,
        relationshipType: relationshipType,
        createdBy: currentUser.id,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      try {
        const result = await CollaborationService.createCollaborationOpportunity(opportunityData);
        
        if (result.success) {
          this.showSuccess('Consortium opportunity created successfully!');
          setTimeout(() => {
            window.location.href = '../../collaboration/';
          }, 2000);
        }
        
        return result;
      } catch (error) {
        console.error('[Workflow] Error submitting form:', error);
        return {
          success: false,
          error: error.message || 'Failed to create opportunity'
        };
      }
    }

    showSuccess(message) {
      const container = document.getElementById('collaborationFormContainer');
      if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-success';
        alert.innerHTML = `<p>${message}</p>`;
        container.insertBefore(alert, container.firstChild);
      }
    }

    showError(message) {
      const container = document.getElementById('collaborationFormContainer');
      if (container) {
        const alert = document.createElement('div');
        alert.className = 'alert alert-error';
        alert.innerHTML = `<p>${message}</p>`;
        container.insertBefore(alert, container.firstChild);
      }
    }
  }

  // ============================================
  // Workflow Factory
  // ============================================
  const workflowMap = {
    '1.1': TaskBasedWorkflow,
    '1.2': ConsortiumWorkflow,
    '1.3': CollaborationWorkflow, // Project-Specific JV
    '1.4': CollaborationWorkflow, // SPV
    '2.1': CollaborationWorkflow, // Strategic JV
    '2.2': CollaborationWorkflow, // Strategic Alliance
    '2.3': CollaborationWorkflow, // Mentorship
    '3.1': CollaborationWorkflow, // Bulk Purchasing
    '3.2': CollaborationWorkflow, // Co-Ownership
    '3.3': CollaborationWorkflow, // Resource Exchange
    '4.1': CollaborationWorkflow, // Professional Hiring
    '4.2': CollaborationWorkflow, // Consultant Hiring
    '5.1': CollaborationWorkflow  // Competition
  };

  function createWorkflow(modelId) {
    const WorkflowClass = workflowMap[modelId] || CollaborationWorkflow;
    return new WorkflowClass();
  }

  // ============================================
  // Global Workflow Handler
  // ============================================
  async function handleFormSubmit(modelId, event) {
    event.preventDefault();
    
    const workflow = createWorkflow(modelId);
    const initialized = await workflow.init();
    
    if (!initialized) {
      alert('Failed to initialize workflow. Please refresh the page.');
      return false;
    }

    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="spinner" style="width: 16px; height: 16px; margin: 0 auto;"></div> Creating...';
    }

    try {
      const result = await workflow.submitForm();
      
      if (!result.success) {
        workflow.showError(result.error || 'Failed to create opportunity');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalText;
        }
      }
      
      return result.success;
    } catch (error) {
      console.error('[Workflow] Error:', error);
      workflow.showError('An unexpected error occurred. Please try again.');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
      return false;
    }
  }

  // ============================================
  // Export
  // ============================================
  window.CollaborationWorkflows = {
    createWorkflow,
    handleFormSubmit,
    TaskBasedWorkflow,
    ConsortiumWorkflow
  };

})();

