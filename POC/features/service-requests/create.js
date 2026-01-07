/**
 * Create Service Request Feature
 */

(function() {
  'use strict';

  const CreateServiceRequest = {
    async init() {
      // Check guard
      if (typeof ServiceTrackGuards !== 'undefined' && !ServiceTrackGuards.guardServiceRequestCreation()) {
        document.getElementById('createServiceRequestContent').innerHTML = 
          '<div class="alert alert-error">Only Entity, Beneficiary, or Vendor can create service requests.</div>';
        return;
      }

      this.renderForm();
      this.setupEventListeners();
    },

    renderForm() {
      const contentEl = document.getElementById('createServiceRequestContent');
      if (!contentEl) return;

      // Check if coming from skill search
      const providerInfo = this.getProviderInfoFromSession();
      const prefillSkills = providerInfo ? providerInfo.requiredSkills.join(', ') : '';

      contentEl.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>Create Service Request</h2>
            ${providerInfo ? `
              <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                Creating request based on provider skill search
              </p>
            ` : ''}
          </div>
          <div class="card-body">
            <form id="createServiceRequestForm">
              <div class="form-group">
                <label for="title">Title *</label>
                <input type="text" id="title" name="title" required minlength="5">
              </div>

              <div class="form-group">
                <label for="description">Description *</label>
                <textarea id="description" name="description" rows="5" required minlength="20"></textarea>
              </div>

              <div class="form-group">
                <label for="requiredSkills">Required Skills *</label>
                <textarea id="requiredSkills" name="requiredSkills" rows="3" placeholder="Enter skills separated by commas" required>${prefillSkills}</textarea>
                <small>Enter required skills separated by commas</small>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="budgetMin">Budget Min (SAR) *</label>
                  <input type="number" id="budgetMin" name="budgetMin" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                  <label for="budgetMax">Budget Max (SAR) *</label>
                  <input type="number" id="budgetMax" name="budgetMax" min="0" step="0.01" required>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="startDate">Start Date</label>
                  <input type="date" id="startDate" name="startDate">
                </div>
                <div class="form-group">
                  <label for="duration">Duration (days)</label>
                  <input type="number" id="duration" name="duration" min="1">
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Create Request</button>
                <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;
    },

    getProviderInfoFromSession() {
      try {
        const providerInfoStr = sessionStorage.getItem('serviceRequestProvider');
        if (providerInfoStr) {
          const providerInfo = JSON.parse(providerInfoStr);
          // Clear it after reading
          sessionStorage.removeItem('serviceRequestProvider');
          return providerInfo;
        }
      } catch (error) {
        console.error('Error reading provider info from session:', error);
      }
      return null;
    },

    setupEventListeners() {
      const form = document.getElementById('createServiceRequestForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmit();
        });
      }
    },

    async handleSubmit() {
      const form = document.getElementById('createServiceRequestForm');
      if (!form) return;

      const formData = new FormData(form);
      const requestData = {
        title: formData.get('title'),
        description: formData.get('description'),
        requiredSkills: formData.get('requiredSkills').split(',').map(s => s.trim()).filter(s => s.length > 0),
        budget: {
          min: parseFloat(formData.get('budgetMin')),
          max: parseFloat(formData.get('budgetMax')),
          currency: 'SAR'
        },
        timeline: {
          startDate: formData.get('startDate') || null,
          duration: formData.get('duration') ? parseInt(formData.get('duration')) : 0
        }
      };

      if (typeof ServiceRequestService !== 'undefined') {
        const result = ServiceRequestService.createServiceRequest(requestData);
        if (result.success) {
          alert('Service request created successfully!');
          window.location.href = '../';
        } else {
          alert('Error: ' + (result.error || result.errors?.join(', ') || 'Failed to create request'));
        }
      }
    }
  };

  window.CreateServiceRequest = CreateServiceRequest;

})();

