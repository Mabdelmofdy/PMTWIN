/**
 * Service Provider Profile Feature
 * Handles service provider profile creation and management
 */

(function() {
  'use strict';

  const ServiceProviderProfile = {
    async init() {
      // Check guard
      if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireServiceProvider()) {
        document.getElementById('serviceProviderProfileContent').innerHTML = 
          '<div class="alert alert-error">Only Service Providers can access this page.</div>';
        return;
      }

      await this.loadProfile();
      this.setupEventListeners();
    },

    async loadProfile() {
      const contentEl = document.getElementById('serviceProviderProfileContent');
      if (!contentEl) return;

      // Get current profile
      let profile = null;
      if (typeof ServiceProviderService !== 'undefined') {
        profile = ServiceProviderService.getMyProfile();
      }

      // Render form
      this.renderProfileForm(profile);
    },

    renderProfileForm(profile) {
      const contentEl = document.getElementById('serviceProviderProfileContent');
      if (!contentEl) return;

      const isEdit = !!profile;
      const formData = profile || {
        providerType: 'INDIVIDUAL',
        skills: [],
        certifications: [],
        availabilityStatus: 'AVAILABLE',
        pricingModel: 'HOURLY',
        hourlyRate: null
      };

      contentEl.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>${isEdit ? 'Edit' : 'Create'} Service Provider Profile</h2>
          </div>
          <div class="card-body">
            <form id="serviceProviderProfileForm">
              <div class="form-group">
                <label for="providerType">Provider Type *</label>
                <select id="providerType" name="providerType" required>
                  <option value="INDIVIDUAL" ${formData.providerType === 'INDIVIDUAL' ? 'selected' : ''}>Individual</option>
                  <option value="CONSULTANT" ${formData.providerType === 'CONSULTANT' ? 'selected' : ''}>Consultant</option>
                  <option value="FIRM" ${formData.providerType === 'FIRM' ? 'selected' : ''}>Firm</option>
                </select>
              </div>

              <div class="form-group">
                <label for="skills">Skills *</label>
                <textarea id="skills" name="skills" rows="3" placeholder="Enter skills separated by commas" required>${(formData.skills || []).join(', ')}</textarea>
                <small>Enter skills separated by commas (e.g., Project Management, Legal Review, Quality Assurance)</small>
              </div>

              <div class="form-group">
                <label for="certifications">Certifications</label>
                <textarea id="certifications" name="certifications" rows="2" placeholder="Enter certifications separated by commas">${(formData.certifications || []).join(', ')}</textarea>
                <small>Enter certifications separated by commas (e.g., PMP, ISO 9001)</small>
              </div>

              <div class="form-group">
                <label for="availabilityStatus">Availability Status *</label>
                <select id="availabilityStatus" name="availabilityStatus" required>
                  <option value="AVAILABLE" ${formData.availabilityStatus === 'AVAILABLE' ? 'selected' : ''}>Available</option>
                  <option value="BUSY" ${formData.availabilityStatus === 'BUSY' ? 'selected' : ''}>Busy</option>
                  <option value="UNAVAILABLE" ${formData.availabilityStatus === 'UNAVAILABLE' ? 'selected' : ''}>Unavailable</option>
                </select>
              </div>

              <div class="form-group">
                <label for="pricingModel">Pricing Model *</label>
                <select id="pricingModel" name="pricingModel" required>
                  <option value="HOURLY" ${formData.pricingModel === 'HOURLY' ? 'selected' : ''}>Hourly</option>
                  <option value="FIXED" ${formData.pricingModel === 'FIXED' ? 'selected' : ''}>Fixed</option>
                  <option value="RETAINER" ${formData.pricingModel === 'RETAINER' ? 'selected' : ''}>Retainer</option>
                </select>
              </div>

              <div class="form-group" id="hourlyRateGroup" style="${formData.pricingModel === 'HOURLY' ? '' : 'display: none;'}">
                <label for="hourlyRate">Hourly Rate (SAR) *</label>
                <input type="number" id="hourlyRate" name="hourlyRate" min="0" step="0.01" value="${formData.hourlyRate || ''}" ${formData.pricingModel === 'HOURLY' ? 'required' : ''}>
              </div>

              <div class="form-actions">
                <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Create'} Profile</button>
                <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      `;

      // Show/hide hourly rate based on pricing model
      const pricingModelSelect = document.getElementById('pricingModel');
      const hourlyRateGroup = document.getElementById('hourlyRateGroup');
      if (pricingModelSelect && hourlyRateGroup) {
        pricingModelSelect.addEventListener('change', function() {
          if (this.value === 'HOURLY') {
            hourlyRateGroup.style.display = 'block';
            document.getElementById('hourlyRate').required = true;
          } else {
            hourlyRateGroup.style.display = 'none';
            document.getElementById('hourlyRate').required = false;
          }
        });
      }
    },

    setupEventListeners() {
      const form = document.getElementById('serviceProviderProfileForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmit();
        });
      }
    },

    async handleSubmit() {
      const form = document.getElementById('serviceProviderProfileForm');
      if (!form) return;

      const formData = new FormData(form);
      const profileData = {
        providerType: formData.get('providerType'),
        skills: formData.get('skills').split(',').map(s => s.trim()).filter(s => s.length > 0),
        certifications: formData.get('certifications') ? 
          formData.get('certifications').split(',').map(c => c.trim()).filter(c => c.length > 0) : [],
        availabilityStatus: formData.get('availabilityStatus'),
        pricingModel: formData.get('pricingModel'),
        hourlyRate: formData.get('pricingModel') === 'HOURLY' ? 
          parseFloat(formData.get('hourlyRate')) : null
      };

      if (typeof ServiceProviderService !== 'undefined') {
        const result = ServiceProviderService.createProfile(profileData);
        if (result.success) {
          alert('Profile saved successfully!');
          await this.loadProfile();
        } else {
          alert('Error: ' + (result.error || result.errors?.join(', ') || 'Failed to save profile'));
        }
      }
    }
  };

  window.ServiceProviderProfile = ServiceProviderProfile;

})();

