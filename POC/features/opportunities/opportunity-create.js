/**
 * Opportunity Create Component - Unified Opportunity Creation Wizard
 * Supports REQUEST_SERVICE and OFFER_SERVICE intents
 * Includes Location, Service Items, Payment Terms with Barter Rules
 */

(function() {
  'use strict';

  let currentStep = 0;
  const totalSteps = 5; // Step 0: Intent, Step 1: Details, Step 2: Model, Step 3: Payment, Step 4: Review
  let formData = {
    basicInfo: {
      title: '',
      description: ''
    },
    intent: null,
    model: null,
    subModel: null,
    serviceItems: [],
    skills: [],
    paymentTerms: {
      mode: 'CASH',
      barterRule: null,
      cashSettlement: 0,
      acknowledgedDifference: false
    },
    location: {
      country: null, // Will be set from config default
      city: '',
      area: '',
      address: '',
      geo: {
        lat: null,
        lng: null
      },
      isRemoteAllowed: false
    }
  };

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    const depth = segments.length;
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Helper to get step index for progress calculation
  // ============================================
  function getStepIndex(step) {
    return step + 1;
  }

  // ============================================
  // Initialize Component
  // ============================================
  function init() {
    // Initialize location with default country from config
    if (typeof window.LocationConfig !== 'undefined') {
      const defaultCountry = window.LocationConfig.getDefaultCountry();
      if (defaultCountry && !formData.location.country) {
        formData.location.country = defaultCountry;
      }
    }
    // Hide standalone Basic Information section (now integrated into Basic Info step)
    const standaloneBasicInfo = document.getElementById('standaloneBasicInfo');
    if (standaloneBasicInfo) {
      standaloneBasicInfo.style.display = 'none';
    }
    
    renderWizard();
    updateProgressIndicator();
    attachEventListeners();
    
    // Initialize location dropdowns for Details step (step 1) if already on that step
    if (currentStep === 1 && typeof window.LocationConfig !== 'undefined') {
      setTimeout(() => {
        const countrySelect = document.getElementById('basicInfoCountry');
        const citySelect = document.getElementById('basicInfoCity');
        if (countrySelect && citySelect) {
          // Populate countries
          const countries = window.LocationConfig.getAllowedCountries();
          const defaultCountry = window.LocationConfig.getDefaultCountry();
          countrySelect.innerHTML = '<option value="">Select Country</option>' + 
            countries.map(country => `<option value="${country}" ${formData.location.country === country ? 'selected' : ''}>${country}</option>`).join('');
          
          // Set default country if available
          if (defaultCountry && !formData.location.country) {
            formData.location.country = defaultCountry;
            countrySelect.value = defaultCountry;
          }
          
          // Update city dropdown based on selected country
          if (formData.location.country) {
            const cities = window.LocationConfig.getCitiesByCountry(formData.location.country);
            citySelect.innerHTML = '<option value="">Select City</option>' + 
              cities.map(city => `<option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>`).join('');
            citySelect.disabled = false;
          }
        }
        syncBasicInfoLocationFields();
      }, 300);
    }
  }

  // ============================================
  // Render Wizard
  // ============================================
  function renderWizard() {
    const container = document.getElementById('opportunityWizardContainer');
    if (!container) return;

    // Calculate progress percentage based on visible steps (5 total: 0,1,2,3,4)
    const totalVisibleSteps = 5; // Intent, Model, Details, Payment, Review
    const stepNum = Number(currentStep);
    const adjustedStepIndex = stepNum + 1; // Step 0 = index 1, Step 4 = index 5
    
    const progressPercent = (adjustedStepIndex / totalVisibleSteps) * 100;
    const stepNames = ['Intent', 'Model', 'Details', 'Payment', 'Review'];
    const stepIcons = ['ph-handshake', 'ph-stack', 'ph-clipboard-text', 'ph-currency-circle-dollar', 'ph-check-circle'];
    
    // Map currentStep to step name index
    let stepNameIndex = Math.floor(currentStep);
    if (stepNameIndex < 0 || stepNameIndex >= stepNames.length) {
      stepNameIndex = 0;
    }
    const currentStepName = stepNames[stepNameIndex] || stepNames[0];
    const currentStepIcon = stepIcons[stepNameIndex] || stepIcons[0];

    // Step configuration - 5 steps total (new order: Intent → Details → Model → Payment → Review)
    const steps = [
      { num: 0, label: 'Intent', icon: 'ph-handshake' },
      { num: 1, label: 'Details', icon: 'ph-clipboard-text' },
      { num: 2, label: 'Model', icon: 'ph-stack' },
      { num: 3, label: 'Payment', icon: 'ph-currency-circle-dollar' },
      { num: 4, label: 'Review', icon: 'ph-check-circle' }
    ];

    let html = `
      <div class="wizard-container">
        <!-- Enhanced Tab Navigation (like signup) -->
        <div class="tab-container" style="margin-bottom: 2rem;">
          <div class="tab-nav" id="opportunityWizardTabs" style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: nowrap; overflow-x: auto;">
            ${steps.map((step, index) => {
              const stepNum = step.num;
              const stepDisplayNum = stepNum + 1; // Display as 1-5 instead of 0-4
              const isActive = stepNum === currentStep;
              const isCompleted = currentStep > stepNum;
              const isFuture = currentStep < stepNum;
              
              return `
                <button type="button" 
                        class="tab-nav-item ${isActive ? 'active' : isCompleted ? 'completed' : isFuture ? 'disabled' : ''}" 
                        data-step="${stepNum}" 
                        onclick="${stepNum <= currentStep ? `opportunityCreate.switchToStep(${stepNum})` : `return false;`}"
                        style="position: relative; flex: 1; min-width: 0; max-width: 100%; padding: var(--spacing-3) var(--spacing-2); border-radius: 12px; transition: all 0.3s ease; border: 2px solid transparent; ${stepNum > currentStep ? 'cursor: not-allowed; opacity: 0.6;' : ''}"
                        ${stepNum > currentStep ? 'disabled' : ''}
                        title="${stepNum > currentStep ? 'Please use Next button to proceed' : ''}">
                  <div style="display: flex; align-items: center; gap: 0.5rem; justify-content: center; width: 100%;">
                    <div class="tab-step-number" style="display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: ${isActive ? 'rgba(255, 255, 255, 0.2)' : isCompleted ? 'var(--color-success, #10b981)' : 'rgba(0, 0, 0, 0.05)'}; font-weight: 600; font-size: 0.85rem; color: ${isActive ? 'white' : isCompleted ? 'white' : 'var(--color-gray-600, #6b7280)'}; flex-shrink: 0;">
                      ${isCompleted ? '<i class="ph ph-check" style="font-size: 0.9rem;"></i>' : stepDisplayNum}
                    </div>
                    <i class="ph ${step.icon}" style="font-size: 1.1rem; flex-shrink: 0;"></i>
                    <span style="font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.9rem;">${step.label}</span>
                  </div>
                  ${isCompleted ? `
                    <div class="tab-completion-indicator" style="display: block; position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);">
                      <i class="ph ph-check" style="font-size: 1rem; color: var(--color-success, #10b981);"></i>
                    </div>
                  ` : `
                    <div class="tab-completion-indicator" style="display: none; position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);">
                      <i class="ph ph-check" style="font-size: 1rem;"></i>
                    </div>
                  `}
                </button>
              `;
            }).join('')}
          </div>
          
          <!-- Progress Bar -->
          <div style="margin-top: 1rem; padding: 0 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
              <span id="wizardProgressText" style="font-size: 0.875rem; color: var(--color-gray-600, #6b7280); font-weight: 500;">
                Step ${adjustedStepIndex} of ${totalVisibleSteps}
              </span>
              <span id="wizardProgressPercentage" style="font-size: 0.875rem; color: var(--color-primary, #2563eb); font-weight: 600;">
                ${Math.round(progressPercent)}%
              </span>
            </div>
            <div style="width: 100%; height: 6px; background: var(--color-gray-200, #e5e7eb); border-radius: 10px; overflow: hidden;">
              <div id="wizardProgressBar" style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, var(--color-primary, #2563eb) 0%, var(--color-primary-light, #60a5fa) 100%); border-radius: 10px; transition: width 0.4s ease;"></div>
            </div>
          </div>
        </div>

        <!-- Current Step Header -->
        <div class="wizard-step-header" style="margin-bottom: 2rem;">
          <h2 class="section-title" style="margin-bottom: 0.5rem; font-size: 1.75rem; font-weight: 600; color: var(--color-primary, #2563eb);">
            ${currentStepName}
          </h2>
          <p class="section-description" style="color: var(--text-secondary, #6b7280); font-size: 1rem; line-height: 1.6;">
            ${getStepDescription(currentStep)}
          </p>
        </div>

        <div class="wizard-content">
          ${renderStep()}
        </div>

        <!-- Enhanced Wizard Actions -->
        <div class="wizard-actions" style="margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border-color, #e5e7eb); display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
          <div style="flex: 1;">
            ${currentStep > 0 ? `
              <button type="button" class="btn btn-secondary" id="wizardPrevBtn" onclick="opportunityCreate.previousStep()" 
                      style="padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 500; transition: all 0.2s ease;">
                <i class="ph ph-arrow-left" style="margin-right: 0.5rem;"></i> Previous
              </button>
            ` : '<div></div>'}
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            ${currentStep < 4 ? `
              <button type="button" class="btn btn-outline" onclick="opportunityCreate.saveDraft()" title="Save as draft"
                      style="padding: 0.75rem 1.5rem; border-radius: 8px; border: 2px solid var(--color-primary, #2563eb); color: var(--color-primary, #2563eb); background: white; font-weight: 500; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem;">
                <i class="ph ph-floppy-disk" style="font-size: 1.1rem;"></i> Save Draft
              </button>
              <button type="button" class="btn btn-primary" id="wizardNextBtn" onclick="opportunityCreate.nextStep()"
                      style="padding: 0.75rem 1.5rem; border-radius: 8px; background: var(--color-primary, #2563eb); color: white; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);">
                Next <i class="ph ph-arrow-right" style="font-size: 1.1rem;"></i>
              </button>
            ` : `
              <button type="button" class="btn btn-outline" onclick="opportunityCreate.saveDraft()" title="Save as draft"
                      style="padding: 0.75rem 1.5rem; border-radius: 8px; border: 2px solid var(--color-primary, #2563eb); color: var(--color-primary, #2563eb); background: white; font-weight: 500; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem;">
                <i class="ph ph-floppy-disk" style="font-size: 1.1rem;"></i> Save Draft
              </button>
              <button type="button" class="btn btn-success btn-lg" id="wizardSubmitBtn" onclick="opportunityCreate.submitOpportunity()"
                      style="padding: 0.875rem 2rem; border-radius: 8px; background: var(--color-success, #10b981); color: white; font-weight: 600; transition: all 0.2s ease; display: flex; align-items: center; gap: 0.5rem; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                <i class="ph ph-paper-plane-tilt" style="font-size: 1.1rem;"></i> Publish Opportunity
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    
    // Update progress indicator after rendering
    setTimeout(() => {
      updateProgressIndicator();
    }, 50);
    
    // Initialize model selector if on Model step (step 2)
    if (currentStep === 2 && typeof CollaborationModelsSelector !== 'undefined') {
      setTimeout(() => {
        // Initialize the selector with callback
        CollaborationModelsSelector.init(handleModelSelection);
        
        // Restore selected model state if we have one
        if (formData.subModel) {
          isRestoringModel = true; // Set flag to prevent infinite loop
          const checkModelsRendered = () => {
            const modelsGrid = document.getElementById('collaborationModelsGrid');
            const modelCards = modelsGrid?.querySelectorAll('.collaboration-model-card');
            if (modelCards && modelCards.length > 0) {
              // Models are rendered, restore state without triggering callback
              if (typeof CollaborationModelsSelector.setSelectedModels === 'function') {
                console.log('[OpportunityCreate] Restoring selected model:', formData.subModel);
                // Set selected models without triggering callback (skipCallback = true)
                CollaborationModelsSelector.setSelectedModels([formData.subModel], true);
                
                // Render fields directly without triggering callback
                setTimeout(() => {
                  isRestoringModel = false; // Clear flag
                  if (typeof CollaborationModelFields !== 'undefined') {
                    const container = document.getElementById('collaborationModelFields');
                    if (container) {
                      renderModelFieldsWithRestore([formData.subModel]);
                    }
                  }
                }, 100);
              }
            } else {
              // Models not yet rendered, retry after a short delay (max 15 retries)
              const retryCount = parseInt(modelsGrid?.getAttribute('data-retry-count') || '0');
              if (retryCount < 15) {
                if (modelsGrid) modelsGrid.setAttribute('data-retry-count', (retryCount + 1).toString());
                setTimeout(checkModelsRendered, 200);
              } else {
                console.warn('[OpportunityCreate] Failed to restore model selector state after 15 retries');
                isRestoringModel = false; // Clear flag on failure
              }
            }
          };
          setTimeout(checkModelsRendered, 300);
        } else {
          isRestoringModel = false; // Clear flag if no model to restore
        }
      }, 200);
    }
  }

  // ============================================
  // Get Step Description
  // ============================================
  function getStepDescription(step) {
    const descriptions = {
      0: 'Choose whether you want to request services or offer services',
      1: 'Enter basic information, location, service items, and required skills',
      2: 'Select the collaboration model and sub-model that best fits your opportunity type',
      3: 'Set payment terms including cash, barter, or hybrid options',
      4: 'Review all details before publishing your opportunity'
    };
    return descriptions[step] || 'Complete this step to continue';
  }

  // ============================================
  // Render Current Step
  // ============================================
  function renderStep() {
    // Ensure currentStep is a number and clamp to valid range
    let step = Number(currentStep);
    
    // Prevent invalid step values (e.g., 5 or higher)
    if (step > 4) {
      console.warn('[OpportunityCreate] Invalid step value detected:', step, '- redirecting to Review (4)');
      step = 4; // Redirect to Review step
      currentStep = 4;
    }
    if (step < 0) {
      console.warn('[OpportunityCreate] Invalid step value detected:', step, '- redirecting to Intent (0)');
      step = 0;
      currentStep = 0;
    }
    
    console.log('[OpportunityCreate] Rendering step:', step, 'type:', typeof step);
    
    switch (step) {
      case 0:
        return renderIntentStep();
      case 1:
        return renderDetailsStep();
      case 2:
        return renderModelStep();
      case 3:
        return renderPaymentStep();
      case 4:
        return renderReviewStep();
      default:
        console.error('[OpportunityCreate] Invalid step value:', step, 'type:', typeof step);
        // Fallback to Intent step instead of showing error
        currentStep = 0;
        return renderIntentStep();
    }
  }

  // ============================================
  // renderBasicInfoStep - DEPRECATED: Basic Info is now merged into Details step (step 2)
  // ============================================
  function renderBasicInfoStep() {
    // Get countries and cities from LocationConfig
    const allowedCountries = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getAllowedCountries() 
      : ['Saudi Arabia'];
    
    const selectedCountry = formData.location.country || (typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getDefaultCountry() 
      : 'Saudi Arabia');
    
    const citiesForCountry = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getCitiesByCountry(selectedCountry) 
      : [];
    
    // KSA Cities and Areas (keep for backward compatibility with areas)
    const ksaCities = {
      'Riyadh': ['Olaya', 'Al Malaz', 'Al Nakheel'],
      'Jeddah': ['Al Hamra', 'Al Rawdah'],
      'Dammam': ['Al Faisaliyah'],
      'Khobar': ['Al Ulaya'],
      'Makkah': ['Al Aziziyah'],
      'Madinah': ['Qurban'],
      'Tabuk (NEOM)': ['NEOM Region', 'Tabuk Region']
    };

    const selectedCity = formData.location.city || '';
    const availableAreas = selectedCity && ksaCities[selectedCity] ? ksaCities[selectedCity] : [];
    
    // Get current title and description from formData
    const currentTitle = formData.basicInfo?.title || '';
    const currentDescription = formData.basicInfo?.description || '';
    
    return `
      <div class="wizard-panel">
        <h2 class="section-title">Basic Information</h2>
        <p class="section-description">Enter the basic details about your opportunity</p>
        
        <div class="form-section" style="margin-bottom: 2rem;">
          <div class="form-group">
                <label for="opportunityTitle" class="form-label">Opportunity Title</label>
            <input type="text" id="opportunityTitle" class="form-control" 
                   placeholder="e.g. Structural Engineering Review for Metro Station"
                   value="${escapeHtml(currentTitle)}"
                   onchange="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('title', this.value); }">
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label for="opportunityDescription" class="form-label">Description</label>
            <textarea id="opportunityDescription" class="form-control" rows="4"
                      placeholder="Provide a detailed description of the opportunity..."
                      oninput="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('description', this.value); }"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('description', this.value); }">${escapeHtml(currentDescription)}</textarea>
          </div>
        </div>
        
        <!-- Location Section -->
        <div class="form-section" style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem;">
          <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
            <i class="ph ph-map-pin" style="color: var(--color-primary);"></i>
            Location
          </h3>
          
          <div class="content-grid-2">
            <div class="form-group">
                <label for="basicInfoCountry" class="form-label">Country</label>
              <select id="basicInfoCountry" class="form-control"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.onCountryChange(this.value); }">
                <option value="">Select Country</option>
                ${allowedCountries.map(country => `
                  <option value="${country}" ${formData.location.country === country ? 'selected' : ''}>${country}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
                <label for="basicInfoCity" class="form-label">City</label>
              <select id="basicInfoCity" class="form-control"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('city', this.value); window.opportunityCreate.updateCityAreas(this.value); }"
                      ${!selectedCountry ? 'disabled' : ''}>
                <option value="">Select City</option>
                ${citiesForCountry.map(city => `
                  <option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>
                `).join('')}
              </select>
              ${!selectedCountry ? '<small class="form-text" style="color: var(--color-danger);">Please select a country first</small>' : ''}
            </div>
          </div>
          
          <div class="content-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label for="basicInfoArea" class="form-label">Area (Optional)</label>
              <select id="basicInfoArea" class="form-control"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('area', this.value); }">
                <option value="">Select Area</option>
                ${availableAreas.map(area => `
                  <option value="${area}" ${formData.location.area === area ? 'selected' : ''}>${area}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="basicInfoAddress" class="form-label">Address (Optional)</label>
              <input type="text" id="basicInfoAddress" class="form-control"
                     placeholder="Enter full address"
                     value="${escapeHtml(formData.location.address || '')}"
                     onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('address', this.value); }">
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="checkbox-label">
              <input type="checkbox" id="basicInfoRemoteAllowed"
                     ${formData.location.isRemoteAllowed ? 'checked' : ''}
                     onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('isRemoteAllowed', this.checked); }">
              <span>Remote work allowed</span>
            </label>
            <small class="form-text">Check this if the work can be done remotely</small>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 0: Intent Selection
  // ============================================
  function renderIntentStep() {
    return `
      <div class="wizard-panel">
        <div class="intent-options" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 2rem; margin-top: 2rem; max-width: 800px; margin-left: auto; margin-right: auto;">
          <!-- Request Service Card -->
          <div class="intent-card ${formData.intent === 'REQUEST_SERVICE' ? 'selected' : ''}" 
               data-intent="REQUEST_SERVICE"
               onclick="opportunityCreate.selectIntent('REQUEST_SERVICE')"
               style="background: white; border: 2px solid ${formData.intent === 'REQUEST_SERVICE' ? 'var(--color-primary, #2563eb)' : 'var(--border-color, #e5e7eb)'}; border-radius: 12px; padding: 2.5rem; cursor: pointer; transition: all 0.3s ease; text-align: center; ${formData.intent === 'REQUEST_SERVICE' ? 'box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);' : ''}"
               onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'"
               onmouseout="if('${formData.intent}' !== 'REQUEST_SERVICE') { this.style.transform='translateY(0)'; this.style.boxShadow='none'; }">
            <div class="intent-icon" style="font-size: 4rem; margin-bottom: 1.5rem; color: ${formData.intent === 'REQUEST_SERVICE' ? 'var(--color-primary, #2563eb)' : 'var(--text-secondary, #6b7280)'}; display: flex; justify-content: center; align-items: center;">
              <i class="ph ph-shopping-cart"></i>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.75rem; color: var(--text-primary, #111827); font-weight: 600;">Request Service</h3>
            <p style="color: var(--text-secondary, #6b7280); line-height: 1.6; margin: 0; font-size: 0.95rem;">I need someone to provide a service for me.</p>
          </div>
          
          <!-- Offer Service Card -->
          <div class="intent-card ${formData.intent === 'OFFER_SERVICE' ? 'selected' : ''}" 
               data-intent="OFFER_SERVICE"
               onclick="opportunityCreate.selectIntent('OFFER_SERVICE')"
               style="background: white; border: 2px solid ${formData.intent === 'OFFER_SERVICE' ? 'var(--color-primary, #2563eb)' : 'var(--border-color, #e5e7eb)'}; border-radius: 12px; padding: 2.5rem; cursor: pointer; transition: all 0.3s ease; text-align: center; ${formData.intent === 'OFFER_SERVICE' ? 'box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);' : ''}"
               onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'"
               onmouseout="if('${formData.intent}' !== 'OFFER_SERVICE') { this.style.transform='translateY(0)'; this.style.boxShadow='none'; }">
            <div class="intent-icon" style="font-size: 4rem; margin-bottom: 1.5rem; color: ${formData.intent === 'OFFER_SERVICE' ? 'var(--color-primary, #2563eb)' : 'var(--text-secondary, #6b7280)'}; display: flex; justify-content: center; align-items: center;">
              <i class="ph ph-storefront"></i>
            </div>
            <h3 style="font-size: 1.25rem; margin-bottom: 0.75rem; color: var(--text-primary, #111827); font-weight: 600;">Offer Service</h3>
            <p style="color: var(--text-secondary, #6b7280); line-height: 1.6; margin: 0; font-size: 0.95rem;">I want to offer my services to others.</p>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 2: Model/Sub-model Selection (after Details)
  // ============================================
  function renderModelStep() {
    // Get selected model info for display
    let selectedModelInfo = null;
    if (formData.subModel && typeof window.CollaborationModels !== 'undefined') {
      const model = window.CollaborationModels.getModel(formData.subModel);
      if (model) {
        selectedModelInfo = model;
      }
    }
    
    return `
      <div class="wizard-panel">
        
        <!-- Sub-Models Grid - Enhanced UI -->
        <div style="margin-bottom: ${formData.subModel ? '2rem' : '0'};">
          <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #111827);">
            <i class="ph ph-list-bullets" style="color: var(--color-primary, #2563eb);"></i>
            Available Sub-Models
          </h3>
          <div id="collaborationModelsGrid" class="collaboration-models-grid" 
               style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
            <!-- Models will be loaded by CollaborationModelsSelector -->
          </div>
        </div>
        
        <!-- Model Details Section - Shows when sub-model is selected -->
        ${formData.subModel && selectedModelInfo ? `
          <div id="selectedModelInfo" style="margin-top: 2.5rem; padding: 2rem; background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.02) 100%); border-radius: 16px; border: 2px solid var(--color-primary, #2563eb); box-shadow: 0 4px 12px rgba(37, 99, 235, 0.1);">
            <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1.5rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                  <div style="display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 50%; background: var(--color-primary, #2563eb); color: white; font-size: 1.5rem; flex-shrink: 0;">
                    <i class="ph ph-check-circle"></i>
                  </div>
                  <div style="flex: 1;">
                    <h3 class="subsection-title" style="margin: 0 0 0.25rem 0; font-size: 1.5rem; color: var(--color-primary, #2563eb); font-weight: 700;">
                      ${selectedModelInfo.name || formData.subModel}
                    </h3>
                    <p style="margin: 0; color: var(--text-secondary, #6b7280); font-size: 0.875rem; font-weight: 500;">
                      ${selectedModelInfo.category || 'Collaboration Model'}
                    </p>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" onclick="if(window.opportunityCreate) { window.opportunityCreate.clearModelSelection(); }" 
                          style="white-space: nowrap; padding: 0.5rem 1rem; border-radius: 8px; border: 2px solid var(--border-color, #e5e7eb); color: var(--text-secondary, #6b7280); background: white; font-weight: 500; transition: all 0.2s ease;"
                          onmouseover="this.style.borderColor='var(--color-primary, #2563eb)'; this.style.color='var(--color-primary, #2563eb)'"
                          onmouseout="this.style.borderColor='var(--border-color, #e5e7eb)'; this.style.color='var(--text-secondary, #6b7280)'">
                    <i class="ph ph-x" style="margin-right: 0.25rem;"></i> Change Selection
                  </button>
                </div>
                
                <div style="background: white; padding: 1.5rem; border-radius: 12px; margin-top: 1rem;">
                  <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary, #111827);">Description</h4>
                  <p style="color: var(--text-secondary, #6b7280); margin: 0 0 1.5rem 0; line-height: 1.7; font-size: 0.95rem;">
                    ${selectedModelInfo.description || 'No description available'}
                  </p>
                  
                  ${selectedModelInfo.applicability && selectedModelInfo.applicability.length > 0 ? `
                    <div style="border-top: 1px solid var(--border-color, #e5e7eb); padding-top: 1rem;">
                      <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary, #111827);">Applicability</h4>
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${selectedModelInfo.applicability.map(rel => `
                          <span class="badge badge-primary" style="padding: 0.5rem 0.875rem; border-radius: 6px; font-size: 0.875rem; background: var(--color-primary, #2563eb); color: white; font-weight: 500;">
                            ${rel}
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                  
                  ${selectedModelInfo.supportedPaymentModes && selectedModelInfo.supportedPaymentModes.length > 0 ? `
                    <div style="border-top: 1px solid var(--border-color, #e5e7eb); padding-top: 1rem; margin-top: 1rem;">
                      <h4 style="margin: 0 0 0.75rem 0; font-size: 1rem; font-weight: 600; color: var(--text-primary, #111827);">Supported Payment Modes</h4>
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                        ${selectedModelInfo.supportedPaymentModes.map(mode => `
                          <span class="badge" style="padding: 0.5rem 0.875rem; border-radius: 6px; font-size: 0.875rem; background: var(--bg-secondary, #f3f4f6); color: var(--text-primary, #111827); font-weight: 500;">
                            ${mode}
                          </span>
                        `).join('')}
                      </div>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        ` : ''}
        
        <!-- Model-Specific Fields - Enhanced Container -->
        <div id="collaborationModelFields" class="collaboration-model-fields" 
             style="margin-top: ${formData.subModel ? '2rem' : '0'}; 
                    display: ${formData.subModel ? 'block' : 'none'};
                    padding: ${formData.subModel ? '2rem' : '0'};
                    background: ${formData.subModel ? 'var(--bg-primary, #ffffff)' : 'transparent'};
                    border-radius: ${formData.subModel ? '12px' : '0'};
                    border: ${formData.subModel ? '2px solid var(--border-color, #e5e7eb)' : 'none'};
                    transition: all 0.3s ease;">
          ${formData.subModel ? `
            <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; font-size: 1.1rem; font-weight: 600; color: var(--text-primary, #111827);">
              <i class="ph ph-clipboard-text" style="color: var(--color-primary, #2563eb);"></i>
              Model-Specific Details
            </h3>
            <p class="form-text" style="margin-bottom: 1.5rem; color: var(--text-secondary, #6b7280); font-size: 0.95rem;">
              Configure the specific details for the selected collaboration model.
            </p>
          ` : ''}
          <!-- Dynamic fields will be rendered here by CollaborationModelFields when a model is selected -->
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 1: Details (Basic Info + Location + Service Items + Skills)
  // ============================================
  function renderDetailsStep() {
    // Get countries and cities from LocationConfig for Basic Info section
    const allowedCountries = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getAllowedCountries() 
      : ['Saudi Arabia'];
    
    const selectedCountry = formData.location.country || (typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getDefaultCountry() 
      : 'Saudi Arabia');
    
    const citiesForCountry = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getCitiesByCountry(selectedCountry) 
      : [];
    
    // KSA Cities and Areas (keep for backward compatibility with areas)
    const ksaCities = {
      'Riyadh': ['Olaya', 'Al Malaz', 'Al Nakheel'],
      'Jeddah': ['Al Hamra', 'Al Rawdah'],
      'Dammam': ['Al Faisaliyah'],
      'Khobar': ['Al Ulaya'],
      'Makkah': ['Al Aziziyah'],
      'Madinah': ['Qurban'],
      'Tabuk (NEOM)': ['NEOM Region', 'Tabuk Region']
    };

    const selectedCity = formData.location.city || '';
    const availableAreas = selectedCity && ksaCities[selectedCity] ? ksaCities[selectedCity] : [];
    
    // Get current title and description from formData
    const currentTitle = formData.basicInfo?.title || '';
    const currentDescription = formData.basicInfo?.description || '';
    
    return `
      <div class="wizard-panel">
        <!-- Basic Information Section -->
        <div class="form-section" style="margin-bottom: 2rem; border-bottom: 2px solid var(--border-color); padding-bottom: 2rem;">
          <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
            <i class="ph ph-file-text" style="color: var(--color-primary);"></i>
            Basic Information
          </h3>
          
          <div class="form-group">
            <label for="opportunityTitle" class="form-label">Opportunity Title <span style="color: var(--color-danger);">*</span></label>
            <input type="text" id="opportunityTitle" class="form-control" required 
                   placeholder="e.g. Structural Engineering Review for Metro Station"
                   ${currentTitle ? `value="${escapeHtml(currentTitle)}"` : ''}
                   oninput="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('title', this.value); }"
                   onchange="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('title', this.value); }">
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label for="opportunityDescription" class="form-label">Description <span style="color: var(--color-danger);">*</span></label>
            <textarea id="opportunityDescription" class="form-control" rows="4" required
                      placeholder="Provide a detailed description of the opportunity..."
                      oninput="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('description', this.value); }"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateBasicInfo('description', this.value); }">${escapeHtml(currentDescription)}</textarea>
          </div>
        </div>
        
        <!-- Location Section -->
        <div class="form-section" style="margin-bottom: 2rem; border-bottom: 2px solid var(--border-color); padding-bottom: 2rem;">
          <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
            <i class="ph ph-map-pin" style="color: var(--color-primary);"></i>
            Location
          </h3>
          
          <div class="content-grid-2">
            <div class="form-group">
              <label for="basicInfoCountry" class="form-label">Country <span style="color: var(--color-danger);">*</span></label>
              <select id="basicInfoCountry" class="form-control" required
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.onCountryChange(this.value); }">
                <option value="">Select Country</option>
                ${allowedCountries.map(country => `
                  <option value="${country}" ${formData.location.country === country ? 'selected' : ''}>${country}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="basicInfoCity" class="form-label">City <span style="color: var(--color-danger);">*</span></label>
              <select id="basicInfoCity" class="form-control" required
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('city', this.value); window.opportunityCreate.updateCityAreas(this.value); }"
                      ${!selectedCountry ? 'disabled' : ''}>
                <option value="">Select City</option>
                ${citiesForCountry.map(city => `
                  <option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>
                `).join('')}
              </select>
              ${!selectedCountry ? '<small class="form-text" style="color: var(--color-danger);">Please select a country first</small>' : ''}
            </div>
          </div>
          
          <div class="content-grid-2" style="margin-top: 1rem;">
            <div class="form-group">
              <label for="basicInfoArea" class="form-label">Area (Optional)</label>
              <select id="basicInfoArea" class="form-control"
                      onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('area', this.value); }">
                <option value="">Select Area</option>
                ${availableAreas.map(area => `
                  <option value="${area}" ${formData.location.area === area ? 'selected' : ''}>${area}</option>
                `).join('')}
              </select>
            </div>
            
            <div class="form-group">
              <label for="basicInfoAddress" class="form-label">Address (Optional)</label>
              <input type="text" id="basicInfoAddress" class="form-control"
                     placeholder="Enter full address"
                     value="${escapeHtml(formData.location.address || '')}"
                     onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('address', this.value); }">
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="checkbox-label">
              <input type="checkbox" id="basicInfoRemoteAllowed"
                     ${formData.location.isRemoteAllowed ? 'checked' : ''}
                     onchange="if(window.opportunityCreate) { window.opportunityCreate.updateLocation('isRemoteAllowed', this.checked); }">
              <span>Remote work allowed</span>
            </label>
            <small class="form-text">Check this if the work can be done remotely</small>
          </div>
        </div>
        
        <!-- Service Items Section -->
        <div class="form-section" style="margin-bottom: 2rem;">
          <h3 class="subsection-title">Service Items <span style="color: var(--color-danger);">*</span></h3>
          <p class="form-text">Define the services you're requesting or offering (at least one required)</p>
          
          <div id="serviceItemsContainer">
            ${renderServiceItems()}
          </div>
          
          <button type="button" class="btn btn-secondary btn-sm" onclick="opportunityCreate.addServiceItem()" style="margin-top: 1rem;">
            <i class="ph ph-plus"></i> Add Service Item
          </button>
        </div>
        
        <!-- Skills Section -->
        <div class="form-section">
          <h3 class="subsection-title">Required Skills <span style="color: var(--color-danger);">*</span></h3>
          <div class="form-group">
            <label for="skillsInput" class="form-label">Required Skills <span style="color: var(--color-danger);">*</span></label>
            <div style="display: flex; gap: 0.5rem; align-items: flex-start;">
              <input type="text" id="skillsInput" class="form-control" 
                     placeholder="e.g. Structural Engineering, BIM Coordination (comma-separated or press Enter)"
                     style="flex: 1;"
                     onkeypress="if(event.key === 'Enter') { event.preventDefault(); opportunityCreate.addSkillFromInput(); }">
              <button type="button" class="btn btn-primary" onclick="opportunityCreate.addSkillFromInput()" style="white-space: nowrap; min-width: 120px;">
                <i class="ph ph-plus"></i> Add Skill
              </button>
            </div>
            <small class="form-text" style="margin-top: 0.5rem; display: block; color: var(--text-secondary);">
              <i class="ph ph-info"></i> Enter skills separated by commas or press Enter after each skill. Click "Add Skill" to add the current input.
            </small>
            <div id="skillsTags" class="skills-tags" style="margin-top: 1rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${renderSkillsTags()}
            </div>
          </div>
        </div>
        
        ${formData.intent === 'OFFER_SERVICE' ? `
          <div class="form-section" style="margin-top: 2rem;">
            <h3 class="subsection-title">Availability</h3>
            <div class="form-group">
              <label for="availabilityStart" class="form-label">Available From</label>
              <input type="date" id="availabilityStart" class="form-control">
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  // ============================================
  // Helper: Escape HTML
  // ============================================
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  // ============================================
  // Update Basic Info
  // ============================================
  function updateBasicInfo(field, value) {
    // Store title and description in formData for persistence (trim whitespace)
    if (!formData.basicInfo) {
      formData.basicInfo = {};
    }
    formData.basicInfo[field] = typeof value === 'string' ? value.trim() : value;
    console.log('[OpportunityCreate] Updated basicInfo.' + field + ':', formData.basicInfo[field]);
  }

  // ============================================
  // Step 3: Payment Terms
  // ============================================
  function renderPaymentStep() {
    const paymentMode = formData.paymentTerms.mode || 'CASH';
    const isBarter = paymentMode === 'BARTER';
    const isHybrid = paymentMode === 'HYBRID';
    const isCash = paymentMode === 'CASH';
    const isEquity = paymentMode === 'EQUITY';
    const isProfitSharing = paymentMode === 'PROFIT_SHARING';
    
    return `
      <div class="wizard-panel">
        <h2 class="section-title">Preferred Payment Terms</h2>
        <p class="form-text" style="margin-bottom: 2rem; color: var(--text-secondary); font-size: 0.875rem;">
          These are your preferred payment terms. Final terms will be confirmed during engagement/proposal negotiation.
        </p>
        
        <div class="form-section">
          <!-- Payment Mode Selection - Enhanced Card Layout -->
          <div class="form-group" style="margin-bottom: 2rem;">
            <label class="form-label" style="margin-bottom: 1rem; display: block; font-weight: 600;">
              Payment Mode <span style="color: var(--color-danger);">*</span>
            </label>
            <div class="payment-mode-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <!-- Cash Option -->
              <label class="payment-mode-card ${isCash ? 'selected' : ''}" 
                     style="border: 2px solid ${isCash ? 'var(--color-primary)' : 'var(--border-color)'}; 
                            border-radius: 12px; padding: 1.5rem; cursor: pointer; 
                            background: ${isCash ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-primary, #ffffff)'};
                            transition: all 0.3s ease; position: relative;">
                <input type="radio" name="paymentMode" value="CASH" ${isCash ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('CASH')"
                       style="position: absolute; opacity: 0; width: 0; height: 0;">
                <div style="text-align: center;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: ${isCash ? 'var(--color-primary)' : 'var(--text-secondary)'};">
                    <i class="ph ph-currency-circle-dollar"></i>
                  </div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Cash</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                    Traditional cash payment
                  </div>
                  ${isCash ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; color: var(--color-primary);"><i class="ph ph-check-circle" style="font-size: 1.25rem;"></i></div>' : ''}
                </div>
              </label>
              
              <!-- Barter Option -->
              <label class="payment-mode-card ${isBarter ? 'selected' : ''}" 
                     style="border: 2px solid ${isBarter ? 'var(--color-primary)' : 'var(--border-color)'}; 
                            border-radius: 12px; padding: 1.5rem; cursor: pointer; 
                            background: ${isBarter ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-primary, #ffffff)'};
                            transition: all 0.3s ease; position: relative;">
                <input type="radio" name="paymentMode" value="BARTER" ${isBarter ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('BARTER')"
                       style="position: absolute; opacity: 0; width: 0; height: 0;">
                <div style="text-align: center;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: ${isBarter ? 'var(--color-primary)' : 'var(--text-secondary)'};">
                    <i class="ph ph-arrows-clockwise"></i>
                  </div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Barter</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                    Service-for-service exchange
                  </div>
                  ${isBarter ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; color: var(--color-primary);"><i class="ph ph-check-circle" style="font-size: 1.25rem;"></i></div>' : ''}
                </div>
              </label>
              
              <!-- Equity Option -->
              <label class="payment-mode-card ${isEquity ? 'selected' : ''}" 
                     style="border: 2px solid ${isEquity ? 'var(--color-primary)' : 'var(--border-color)'}; 
                            border-radius: 12px; padding: 1.5rem; cursor: pointer; 
                            background: ${isEquity ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-primary, #ffffff)'};
                            transition: all 0.3s ease; position: relative;">
                <input type="radio" name="paymentMode" value="EQUITY" ${isEquity ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('EQUITY')"
                       style="position: absolute; opacity: 0; width: 0; height: 0;">
                <div style="text-align: center;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: ${isEquity ? 'var(--color-primary)' : 'var(--text-secondary)'};">
                    <i class="ph ph-chart-line-up"></i>
                  </div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Equity</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                    Equity stake with vesting
                  </div>
                  ${isEquity ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; color: var(--color-primary);"><i class="ph ph-check-circle" style="font-size: 1.25rem;"></i></div>' : ''}
                </div>
              </label>
              
              <!-- Profit-Sharing Option -->
              <label class="payment-mode-card ${isProfitSharing ? 'selected' : ''}" 
                     style="border: 2px solid ${isProfitSharing ? 'var(--color-primary)' : 'var(--border-color)'}; 
                            border-radius: 12px; padding: 1.5rem; cursor: pointer; 
                            background: ${isProfitSharing ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-primary, #ffffff)'};
                            transition: all 0.3s ease; position: relative;">
                <input type="radio" name="paymentMode" value="PROFIT_SHARING" ${isProfitSharing ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('PROFIT_SHARING')"
                       style="position: absolute; opacity: 0; width: 0; height: 0;">
                <div style="text-align: center;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: ${isProfitSharing ? 'var(--color-primary)' : 'var(--text-secondary)'};">
                    <i class="ph ph-share-network"></i>
                  </div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Profit-Sharing</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                    Share of profits
                  </div>
                  ${isProfitSharing ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; color: var(--color-primary);"><i class="ph ph-check-circle" style="font-size: 1.25rem;"></i></div>' : ''}
                </div>
              </label>
              
              <!-- Hybrid Option -->
              <label class="payment-mode-card ${isHybrid ? 'selected' : ''}" 
                     style="border: 2px solid ${isHybrid ? 'var(--color-primary)' : 'var(--border-color)'}; 
                            border-radius: 12px; padding: 1.5rem; cursor: pointer; 
                            background: ${isHybrid ? 'var(--color-primary-light, #eff6ff)' : 'var(--bg-primary, #ffffff)'};
                            transition: all 0.3s ease; position: relative;">
                <input type="radio" name="paymentMode" value="HYBRID" ${isHybrid ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('HYBRID')"
                       style="position: absolute; opacity: 0; width: 0; height: 0;">
                <div style="text-align: center;">
                  <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: ${isHybrid ? 'var(--color-primary)' : 'var(--text-secondary)'};">
                    <i class="ph ph-handshake"></i>
                  </div>
                  <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">Hybrid</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.4;">
                    Combination of barter and cash
                  </div>
                  ${isHybrid ? '<div style="position: absolute; top: 0.75rem; right: 0.75rem; color: var(--color-primary);"><i class="ph ph-check-circle" style="font-size: 1.25rem;"></i></div>' : ''}
                </div>
              </label>
            </div>
          </div>
          
          <!-- Dynamic Fields Section - Enhanced with Animation -->
          ${isEquity ? `
            <div id="equityDetailsSection" class="equity-details-section" 
                 style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem; 
                        animation: slideDown 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                <i class="ph ph-chart-line-up" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                <h3 class="subsection-title" style="margin: 0;">Equity Details</h3>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="equityPercentage" class="form-label">Equity Percentage (%) *</label>
                <input type="number" id="equityPercentage" class="form-control" 
                       min="0" max="100" step="0.01"
                       value="${formData.equityDetails?.percentage || 0}"
                       onchange="opportunityCreate.updateEquityDetails('percentage', this.value)">
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="equityValuation" class="form-label">Company Valuation (SAR)</label>
                <input type="number" id="equityValuation" class="form-control" 
                       min="0" step="1000"
                       value="${formData.equityDetails?.valuation || 0}"
                       onchange="opportunityCreate.updateEquityDetails('valuation', this.value)">
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="vestingType" class="form-label">Vesting Schedule</label>
                <select id="vestingType" class="form-control" 
                        onchange="opportunityCreate.updateEquityDetails('vestingType', this.value)">
                  <option value="Immediate" ${formData.equityDetails?.vestingSchedule?.type === 'Immediate' ? 'selected' : ''}>Immediate</option>
                  <option value="Cliff" ${formData.equityDetails?.vestingSchedule?.type === 'Cliff' ? 'selected' : ''}>Cliff</option>
                  <option value="Gradual" ${formData.equityDetails?.vestingSchedule?.type === 'Gradual' ? 'selected' : ''}>Gradual</option>
                  <option value="Milestone" ${formData.equityDetails?.vestingSchedule?.type === 'Milestone' ? 'selected' : ''}>Milestone-Based</option>
                </select>
              </div>
            </div>
          ` : ''}
          
          ${isProfitSharing ? `
            <div id="profitSharingDetailsSection" class="profit-sharing-details-section" 
                 style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem; 
                        animation: slideDown 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                <i class="ph ph-share-network" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                <h3 class="subsection-title" style="margin: 0;">Profit-Sharing Details</h3>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="profitSharingMethod" class="form-label">Calculation Method *</label>
                <select id="profitSharingMethod" class="form-control" 
                        onchange="opportunityCreate.updateProfitSharingDetails('method', this.value)">
                  <option value="Percentage" ${formData.profitSharingDetails?.calculationMethod === 'Percentage' ? 'selected' : ''}>Percentage</option>
                  <option value="Fixed" ${formData.profitSharingDetails?.calculationMethod === 'Fixed' ? 'selected' : ''}>Fixed Amount</option>
                  <option value="Tiered" ${formData.profitSharingDetails?.calculationMethod === 'Tiered' ? 'selected' : ''}>Tiered</option>
                  <option value="Performance" ${formData.profitSharingDetails?.calculationMethod === 'Performance' ? 'selected' : ''}>Performance-Based</option>
                </select>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="profitSharingFrequency" class="form-label">Distribution Frequency</label>
                <select id="profitSharingFrequency" class="form-control" 
                        onchange="opportunityCreate.updateProfitSharingDetails('frequency', this.value)">
                  <option value="Monthly" ${formData.profitSharingDetails?.distributionFrequency === 'Monthly' ? 'selected' : ''}>Monthly</option>
                  <option value="Quarterly" ${formData.profitSharingDetails?.distributionFrequency === 'Quarterly' ? 'selected' : ''}>Quarterly</option>
                  <option value="Annually" ${formData.profitSharingDetails?.distributionFrequency === 'Annually' ? 'selected' : ''}>Annually</option>
                </select>
              </div>
              
              <div class="alert alert-info" style="margin-top: 1rem;">
                <p style="margin: 0; font-size: 0.875rem;">
                  <i class="ph ph-info"></i> Profit-sharing shares will be configured during negotiation.
                </p>
              </div>
            </div>
          ` : ''}
          
          ${isBarter || isHybrid ? `
            <div id="barterDetailsSection" class="barter-details-section" 
                 style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem; 
                        animation: slideDown 0.3s ease;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
                <i class="ph ph-gear" style="font-size: 1.5rem; color: var(--color-primary);"></i>
                <h3 class="subsection-title" style="margin: 0;">Barter Configuration</h3>
              </div>
              
              <div class="form-group" style="margin-bottom: 1.5rem;">
                <label for="barterRule" class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                  <i class="ph ph-list-checks" style="color: var(--color-primary);"></i>
                  Barter Settlement Rule <span style="color: var(--color-danger);">*</span>
                </label>
                <select id="barterRule" class="form-control" required
                        onchange="opportunityCreate.updateBarterRule(this.value)"
                        style="padding: 0.75rem; font-size: 1rem;">
                  <option value="">Select a settlement rule</option>
                  <option value="EQUAL_ONLY" ${formData.paymentTerms.barterRule === 'EQUAL_ONLY' ? 'selected' : ''}>
                    Equal Value Only - Services must be of equal value
                  </option>
                  <option value="ALLOW_DIFFERENCE_CASH" ${formData.paymentTerms.barterRule === 'ALLOW_DIFFERENCE_CASH' ? 'selected' : ''}>
                    Allow Difference with Cash - Cash component allowed for imbalance
                  </option>
                  <option value="ACCEPT_AS_IS" ${formData.paymentTerms.barterRule === 'ACCEPT_AS_IS' ? 'selected' : ''}>
                    Accept As-Is - Accept value difference without compensation
                  </option>
                </select>
                <small class="form-text" style="margin-top: 0.5rem; display: block; color: var(--text-secondary);">
                  <i class="ph ph-info"></i> Choose how to handle value differences in barter exchanges
                </small>
              </div>
              
              ${isHybrid || formData.paymentTerms.barterRule === 'ALLOW_DIFFERENCE_CASH' ? `
                <div class="form-group" style="margin-bottom: 1.5rem; 
                     background: var(--bg-secondary, #f9fafb); 
                     padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--color-primary);">
                  <label for="cashSettlement" class="form-label" style="display: flex; align-items: center; gap: 0.5rem;">
                    <i class="ph ph-currency-circle-dollar" style="color: var(--color-primary);"></i>
                    Cash Settlement Amount (SAR)
                  </label>
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.5rem;">
                    <input type="number" id="cashSettlement" class="form-control" 
                           value="${formData.paymentTerms.cashSettlement || 0}" 
                           min="0" step="0.01" placeholder="0.00"
                           onchange="opportunityCreate.updateCashSettlement(this.value)"
                           style="max-width: 300px;">
                    <span style="color: var(--text-secondary); font-weight: 500;">SAR</span>
                  </div>
                  <small class="form-text" style="margin-top: 0.5rem; display: block; color: var(--text-secondary);">
                    <i class="ph ph-info"></i> Additional cash payment to balance any value difference between exchanged services
                  </small>
                </div>
              ` : ''}
              
              ${formData.paymentTerms.barterRule === 'ACCEPT_AS_IS' ? `
                <div class="form-group" style="margin-bottom: 1.5rem; 
                     background: var(--bg-secondary, #f9fafb); 
                     padding: 1.5rem; border-radius: 8px; border-left: 4px solid var(--color-warning, #f59e0b);">
                  <label class="checkbox-label" style="display: flex; align-items: flex-start; gap: 0.75rem; cursor: pointer;">
                    <input type="checkbox" id="acknowledgedDifference" 
                           ${formData.paymentTerms.acknowledgedDifference ? 'checked' : ''}
                           onchange="opportunityCreate.updateAcknowledgedDifference(this.checked)"
                           style="margin-top: 0.25rem; cursor: pointer;">
                    <div>
                      <div style="font-weight: 600; margin-bottom: 0.25rem; color: var(--text-primary);">
                        <i class="ph ph-warning" style="color: var(--color-warning, #f59e0b);"></i> Value Difference Acknowledgment
                      </div>
                      <div style="color: var(--text-secondary); font-size: 0.875rem; line-height: 1.5;">
                        I acknowledge and accept that the services exchanged may have different values, and I agree to proceed without additional compensation.
                      </div>
                    </div>
                  </label>
                </div>
              ` : ''}
            </div>
          ` : isCash ? `
            <div id="cashDetailsSection" class="cash-details-section" 
                 style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem;
                        background: var(--bg-secondary, #f9fafb); 
                        padding: 1.5rem; border-radius: 8px;">
              <div style="display: flex; align-items: center; gap: 0.75rem; color: var(--text-secondary);">
                <i class="ph ph-info" style="font-size: 1.25rem; color: var(--color-primary);"></i>
                <div>
                  <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">Cash Payment Selected</div>
                  <div style="font-size: 0.875rem;">Standard cash payment terms apply. No additional configuration required.</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      
      <style>
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .payment-mode-card:hover {
          border-color: var(--color-primary) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        .payment-mode-card.selected {
          box-shadow: 0 4px 16px rgba(37, 99, 235, 0.15);
        }
      </style>
    `;
  }

  // ============================================
  // Step 3.5: Location (REMOVED - Now part of Details step)
  // ============================================
  function renderLocationStep() {
    // This function is deprecated - Location is now part of Details step
    console.warn('[OpportunityCreate] renderLocationStep called but Location is now part of Details step');
    return renderDetailsStep();
    // Get countries and cities from LocationConfig
    const allowedCountries = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getAllowedCountries() 
      : ['Saudi Arabia'];
    
    const selectedCountry = formData.location.country || (typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getDefaultCountry() 
      : 'Saudi Arabia');
    
    const citiesForCountry = typeof window.LocationConfig !== 'undefined' 
      ? window.LocationConfig.getCitiesByCountry(selectedCountry) 
      : [];
    
    // KSA Cities and Areas (keep for backward compatibility with areas)
    const ksaCities = {
      'Riyadh': ['Olaya', 'Al Malaz', 'Al Nakheel'],
      'Jeddah': ['Al Hamra', 'Al Rawdah'],
      'Dammam': ['Al Faisaliyah'],
      'Khobar': ['Al Ulaya'],
      'Makkah': ['Al Aziziyah'],
      'Madinah': ['Qurban'],
      'Tabuk (NEOM)': ['NEOM Region', 'Tabuk Region']
    };

    const selectedCity = formData.location.city || '';
    const availableAreas = selectedCity && ksaCities[selectedCity] ? ksaCities[selectedCity] : [];

    return `
      <div class="wizard-panel">
        <h2 class="section-title">Location Details</h2>
        
        <div class="form-section">
          <div class="content-grid-2">
            <div class="form-group">
              <label for="locationCountry" class="form-label">Country *</label>
              <select id="locationCountry" class="form-control" required 
                      onchange="opportunityCreate.onCountryChange(this.value)">
                <option value="">Select Country</option>
                ${allowedCountries.map(country => `
                  <option value="${country}" ${formData.location.country === country ? 'selected' : ''}>${country}</option>
                `).join('')}
              </select>
              <small class="form-text">Select the country where the opportunity is located</small>
            </div>
            
            <div class="form-group">
              <label for="locationCity" class="form-label">City *</label>
              <select id="locationCity" class="form-control" required
                      onchange="opportunityCreate.updateLocation('city', this.value); opportunityCreate.updateCityAreas(this.value);"
                      ${!selectedCountry ? 'disabled' : ''}>
                <option value="">Select City</option>
                ${citiesForCountry.map(city => `
                  <option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>
                `).join('')}
              </select>
              ${!selectedCountry ? '<small class="form-text" style="color: var(--color-danger);">Please select a country first</small>' : ''}
            </div>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label for="locationArea" class="form-label">Area (Optional)</label>
            <select id="locationArea" class="form-control"
                    onchange="opportunityCreate.updateLocation('area', this.value)">
              <option value="">Select Area</option>
              ${availableAreas.map(area => `
                <option value="${area}" ${formData.location.area === area ? 'selected' : ''}>${area}</option>
              `).join('')}
            </select>
            <small class="form-text">Select area within the chosen city</small>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label for="locationAddress" class="form-label">Address (Optional)</label>
            <textarea id="locationAddress" class="form-control" rows="2"
                      placeholder="Full street address"
                      onchange="opportunityCreate.updateLocation('address', this.value)">${formData.location.address || ''}</textarea>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="checkbox-label">
              <input type="checkbox" id="isRemoteAllowed" 
                     ${formData.location.isRemoteAllowed ? 'checked' : ''}
                     onchange="opportunityCreate.updateLocation('isRemoteAllowed', this.checked)">
              <span>Remote work allowed</span>
            </label>
            <small class="form-text">Check this if the work can be done remotely</small>
          </div>
          
          <div class="form-group" style="margin-top: 1rem;">
            <label class="form-label">Geographic Coordinates (Optional)</label>
            <div class="content-grid-2">
              <input type="number" id="locationLat" class="form-control" 
                     step="0.000001" placeholder="Latitude"
                     value="${formData.location.geo.lat || ''}"
                     onchange="opportunityCreate.updateLocation('geo.lat', parseFloat(this.value))">
              <input type="number" id="locationLng" class="form-control" 
                     step="0.000001" placeholder="Longitude"
                     value="${formData.location.geo.lng || ''}"
                     onchange="opportunityCreate.updateLocation('geo.lng', parseFloat(this.value))">
            </div>
            <small class="form-text">Optional: Provide GPS coordinates for precise location</small>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 4: Review & Publish
  // ============================================
  function renderReviewStep() {
    const totalValue = formData.serviceItems.reduce((sum, item) => sum + (item.totalRef || 0), 0);
    // Get title and description from formData.basicInfo or DOM (fallback)
    const titleEl = document.getElementById('opportunityTitle');
    const descriptionEl = document.getElementById('opportunityDescription');
    const title = (titleEl?.value || formData.basicInfo?.title || '').trim() || 'Untitled Opportunity';
    const description = (descriptionEl?.value || formData.basicInfo?.description || '').trim() || '';
    
    // Get collaboration model name from ID
    let modelName = formData.subModel || 'Not selected';
    let modelCategory = '';
    if (formData.subModel && typeof window.CollaborationModels !== 'undefined') {
      const model = window.CollaborationModels.getModel(formData.subModel);
      if (model) {
        modelName = model.name || formData.subModel;
        modelCategory = model.category || '';
      }
    }
    
    const getIntentLabel = (intent) => {
      const labels = {
        'REQUEST_SERVICE': 'Request Service',
        'OFFER_SERVICE': 'Offer Service'
      };
      return labels[intent] || intent;
    };

    const getPaymentModeLabel = (mode) => {
      const labels = {
        'CASH': 'Cash',
        'EQUITY': 'Equity',
        'PROFIT_SHARING': 'Profit-Sharing',
        'BARTER': 'Barter',
        'HYBRID': 'Hybrid'
      };
      return labels[mode] || mode;
    };
    
    const getPaymentModeLabelOld = (mode) => {
      const labels = {
        'CASH': 'Cash Payment',
        'BARTER': 'Barter Exchange',
        'HYBRID': 'Hybrid (Barter + Cash)'
      };
      return labels[mode] || mode;
    };

    const getBarterRuleLabel = (rule) => {
      const labels = {
        'EQUAL_ONLY': 'Equal Value Only',
        'ALLOW_DIFFERENCE_CASH': 'Allow Difference with Cash',
        'ACCEPT_AS_IS': 'Accept As-Is'
      };
      return labels[rule] || rule;
    };
    
    return `
      <div class="wizard-panel">
        <div class="review-summary-card" style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; border: 1px solid rgba(37, 99, 235, 0.2);">
          <h3 style="margin-bottom: 1rem; color: var(--color-primary); display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-file-text"></i> Opportunity Summary
          </h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div>
              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Total Value</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${totalValue.toLocaleString()} SAR</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Service Items</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${formData.serviceItems.length}</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Skills Required</div>
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary);">${formData.skills.length}</div>
            </div>
            <div>
              <div style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Location</div>
              <div style="font-size: 1rem; font-weight: 600; color: var(--text-primary);">
                ${formData.location.city && formData.location.country 
                  ? `${formData.location.city}, ${formData.location.country}` 
                  : 'Not set'}
              </div>
            </div>
          </div>
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-file-text"></i> Basic Information</h3>
          <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
            <div style="margin-bottom: 1rem;">
              <div style="margin-bottom: 1rem;">
                <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Title</p>
                <p style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">${title || '<span style="color: var(--color-danger);">Not provided</span>'}</p>
              </div>
              <div>
                <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Description</p>
                <p style="color: var(--text-primary); line-height: 1.6; white-space: pre-wrap;">${description || '<span style="color: var(--color-danger);">Not provided</span>'}</p>
              </div>
            </div>
            
            <div style="border-top: 1px solid var(--border-color); padding-top: 1rem; margin-top: 1rem;">
              <p style="margin-bottom: 0.75rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                <i class="ph ph-map-pin" style="color: var(--color-primary);"></i> Location
              </p>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem;">
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Country & City</p>
                  <p style="font-weight: 600; color: var(--text-primary);">
                    ${formData.location.city && formData.location.country 
                      ? `${formData.location.city}, ${formData.location.country}` 
                      : '<span style="color: var(--color-danger);">Not set</span>'}
                  </p>
                </div>
                ${formData.location.area ? `
                  <div>
                    <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Area</p>
                    <p style="font-weight: 600; color: var(--text-primary);">${formData.location.area}</p>
                  </div>
                ` : ''}
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Work Type</p>
                  <p>
                    ${formData.location.isRemoteAllowed 
                      ? '<span class="badge badge-success"><i class="ph ph-globe"></i> Remote Work Allowed</span>' 
                      : '<span class="badge badge-secondary"><i class="ph ph-buildings"></i> On-site Only</span>'}
                  </p>
                </div>
                ${formData.location.address ? `
                  <div style="grid-column: 1 / -1;">
                    <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Address</p>
                    <p style="font-weight: 500; color: var(--text-primary);">${formData.location.address}</p>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
          <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(1);">
              <i class="ph ph-pencil"></i> Edit Basic Info
            </button>
          </div>
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-handshake"></i> Intent</h3>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <span class="badge badge-primary" style="font-size: 1rem; padding: 0.5rem 1rem;">${getIntentLabel(formData.intent)}</span>
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(0);">
              <i class="ph ph-pencil"></i> Change
            </button>
          </div>
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-stack"></i> Collaboration Model</h3>
          <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px;">
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div>
                <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Model Name</p>
                <p style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">${modelName}</p>
              </div>
              ${modelCategory ? `
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Category</p>
                  <p style="color: var(--text-primary);"><span class="badge badge-info" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;">${modelCategory}</span></p>
                </div>
              ` : ''}
              ${formData.subModel ? `
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Model Reference</p>
                  <p style="color: var(--text-secondary); font-size: 0.875rem; font-family: monospace;">${formData.subModel}</p>
                </div>
              ` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(2);" style="margin-top: 0.75rem;">
            <i class="ph ph-pencil"></i> Change Model
          </button>
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-clipboard-text"></i> Service Items (${formData.serviceItems.length})</h3>
          ${formData.serviceItems.length > 0 ? `
            <div style="overflow-x: auto; margin-top: 1rem;">
              <table class="table" style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr style="background: var(--bg-secondary);">
                    <th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color);">Name</th>
                    <th style="padding: 1rem; text-align: left; font-weight: 600; border-bottom: 2px solid var(--border-color);">Description</th>
                    <th style="padding: 1rem; text-align: center; font-weight: 600; border-bottom: 2px solid var(--border-color);">Quantity</th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; border-bottom: 2px solid var(--border-color);">Unit Price</th>
                    <th style="padding: 1rem; text-align: right; font-weight: 600; border-bottom: 2px solid var(--border-color);">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${formData.serviceItems.map((item, idx) => `
                    <tr style="border-bottom: 1px solid var(--border-color); ${idx % 2 === 0 ? 'background: var(--bg-primary);' : ''}">
                      <td style="padding: 1rem; font-weight: 500;">${item.name || 'Unnamed'}</td>
                      <td style="padding: 1rem; color: var(--text-secondary); font-size: 0.875rem;">${item.description || '-'}</td>
                      <td style="padding: 1rem; text-align: center;">${item.qty || 1} ${item.unit || 'unit'}</td>
                      <td style="padding: 1rem; text-align: right;">${(item.unitPriceRef || 0).toLocaleString()} SAR</td>
                      <td style="padding: 1rem; text-align: right; font-weight: 600; color: var(--color-primary);">${(item.totalRef || 0).toLocaleString()} SAR</td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot style="background: linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%); border-top: 2px solid var(--color-primary);">
                  <tr>
                    <td colspan="4" style="padding: 1.25rem; text-align: right; font-weight: 700; font-size: 1.125rem;">Total Value:</td>
                    <td style="padding: 1.25rem; text-align: right; font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${totalValue.toLocaleString()} SAR</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(1);" style="margin-top: 1rem;">
              <i class="ph ph-pencil"></i> Edit Service Items
            </button>
          ` : '<div style="color: var(--text-secondary); padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; text-align: center;"><i class="ph ph-info" style="font-size: 1.5rem; margin-bottom: 0.5rem; display: block;"></i>No service items added</div>'}
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-star"></i> Required Skills (${formData.skills.length})</h3>
          ${formData.skills.length > 0 ? `
            <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px; margin-top: 1rem;">
              <div class="skills-tags" style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                ${formData.skills.map(skill => `
                  <span class="badge badge-primary" style="font-size: 0.875rem; padding: 0.5rem 0.75rem;">
                    <i class="ph ph-check-circle" style="margin-right: 0.25rem;"></i>${skill}
                  </span>
                `).join('')}
              </div>
            </div>
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(3);" style="margin-top: 0.75rem;">
              <i class="ph ph-pencil"></i> Edit Skills
            </button>
          ` : '<div style="color: var(--text-secondary); padding: 1rem; background: var(--bg-secondary); border-radius: 8px; text-align: center;">No skills specified</div>'}
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-currency-circle-dollar"></i> Preferred Payment Terms</h3>
          <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-top: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div>
                <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Payment Mode</p>
                <p><span class="badge badge-success" style="font-size: 0.875rem; padding: 0.5rem 0.75rem;">${getPaymentModeLabel(formData.paymentTerms.mode)}</span></p>
                ${formData.paymentTerms.mode === 'BARTER' && formData.intent === 'REQUEST_SERVICE' ? `
                  <p style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                    <i class="ph ph-info"></i> After creating this need, you can use the Offer Register to link compatible offers.
                  </p>
                ` : ''}
              </div>
              ${formData.paymentTerms.barterRule ? `
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Barter Rule</p>
                  <p style="font-weight: 500; color: var(--text-primary);">${getBarterRuleLabel(formData.paymentTerms.barterRule)}</p>
                </div>
              ` : ''}
              ${formData.paymentTerms.cashSettlement > 0 ? `
                <div>
                  <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Cash Settlement</p>
                  <p style="font-size: 1.25rem; font-weight: 700; color: var(--color-primary);">${formData.paymentTerms.cashSettlement.toLocaleString()} SAR</p>
                </div>
              ` : ''}
            </div>
          </div>
          <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(3);" style="margin-top: 0.75rem;">
            <i class="ph ph-pencil"></i> Edit Payment Terms
          </button>
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-map-pin"></i> Location</h3>
          <div style="background: var(--bg-secondary); padding: 1rem; border-radius: 8px;">
            <p style="margin-bottom: 0.5rem;"><strong>Location:</strong> ${formData.location.city && formData.location.country ? `${formData.location.city}, ${formData.location.country}` : 'Not set'}</p>
            ${formData.location.area ? `<p style="margin-bottom: 0.5rem;"><strong>Area:</strong> ${formData.location.area}</p>` : ''}
            ${formData.location.isRemoteAllowed ? '<p><span class="badge badge-success"><i class="ph ph-globe"></i> Remote Work Allowed</span></p>' : '<p><span class="badge badge-secondary"><i class="ph ph-buildings"></i> On-site Only</span></p>'}
          </div>
          <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(1);" style="margin-top: 0.5rem;">
            <i class="ph ph-pencil"></i> Edit Location
          </button>
        </div>
        
        <div class="review-section" style="border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem;">
          <h3><i class="ph ph-paper-plane-tilt"></i> Publication Status</h3>
          <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(5, 150, 105, 0.05) 100%); padding: 1.5rem; border-radius: 8px; border: 1px solid rgba(16, 185, 129, 0.2); margin-top: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label for="opportunityStatus" class="form-label" style="font-weight: 600; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.5rem;">
                <i class="ph ph-paper-plane-tilt" style="color: var(--color-success);"></i>
                Choose how to publish this opportunity
              </label>
              <select id="opportunityStatus" class="form-control" style="padding: 0.75rem; font-size: 1rem;">
                <option value="draft">Save as Draft</option>
                <option value="published" selected>Publish Immediately</option>
              </select>
              <div style="margin-top: 1rem; padding: 0.75rem; background: rgba(255, 255, 255, 0.5); border-radius: 6px;">
                <p style="margin: 0; font-size: 0.875rem; color: var(--text-secondary); display: flex; align-items: start; gap: 0.5rem;">
                  <i class="ph ph-info" style="color: var(--color-info); margin-top: 0.125rem;"></i>
                  <span><strong>Published opportunities</strong> will be visible to all users in the marketplace and can receive proposals from providers.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: 8px; border-left: 4px solid var(--color-primary);">
          <p style="margin: 0; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-check-circle" style="color: var(--color-success); font-size: 1.25rem;"></i>
            Review Complete - Ready to Publish
          </p>
          <p style="margin: 0.5rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
            Please review all details above. Click "Publish Opportunity" below to make it live in the marketplace.
          </p>
        </div>
      </div>
    `;
  }

  // ============================================
  // Helper: Render Service Items
  // ============================================
  function renderServiceItems() {
    if (formData.serviceItems.length === 0) {
      return '<p class="text-muted">No service items added yet. Click "Add Service Item" to get started.</p>';
    }
    
    return formData.serviceItems.map((item, index) => `
      <div class="service-item-card" data-index="${index}" style="border: 1px solid var(--border-color); padding: 1rem; margin-bottom: 1rem; border-radius: var(--border-radius);">
        <div class="flex justify-between align-center" style="margin-bottom: 0.5rem;">
          <h4>${item.name || 'Service Item ' + (index + 1)}</h4>
          <button type="button" class="btn btn-sm btn-danger" onclick="opportunityCreate.removeServiceItem(${index})">
            <i class="ph ph-trash"></i>
          </button>
        </div>
        <div class="content-grid-2">
          <div class="form-group">
            <label>Name *</label>
            <input type="text" class="form-control" value="${item.name || ''}" 
                   onchange="opportunityCreate.updateServiceItem(${index}, 'name', this.value)" required>
          </div>
          <div class="form-group">
            <label>Description *</label>
            <input type="text" class="form-control" value="${item.description || ''}" 
                   onchange="opportunityCreate.updateServiceItem(${index}, 'description', this.value)" required>
          </div>
        </div>
        <div class="content-grid-4">
          <div class="form-group">
            <label>Unit</label>
            <select class="form-control" onchange="opportunityCreate.updateServiceItem(${index}, 'unit', this.value)">
              <option value="hour" ${item.unit === 'hour' ? 'selected' : ''}>Hour</option>
              <option value="day" ${item.unit === 'day' ? 'selected' : ''}>Day</option>
              <option value="project" ${item.unit === 'project' ? 'selected' : ''}>Project</option>
              <option value="unit" ${item.unit === 'unit' ? 'selected' : ''}>Unit</option>
            </select>
          </div>
          <div class="form-group">
            <label>Quantity</label>
            <input type="number" class="form-control" value="${item.qty || 1}" min="1"
                   onchange="opportunityCreate.updateServiceItem(${index}, 'qty', parseFloat(this.value))">
          </div>
          <div class="form-group">
            <label>Unit Price (SAR)</label>
            <input type="number" class="form-control" value="${item.unitPriceRef || 0}" min="0" step="0.01"
                   onchange="opportunityCreate.updateServiceItem(${index}, 'unitPriceRef', parseFloat(this.value))">
          </div>
          <div class="form-group">
            <label>Total (SAR)</label>
            <input type="number" class="form-control" value="${item.totalRef || 0}" readonly
                   style="background: var(--bg-secondary);">
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============================================
  // Helper: Render Skills Tags
  // ============================================
  function renderSkillsTags() {
    if (formData.skills.length === 0) {
      return '<p class="text-muted">No skills added yet</p>';
    }
    
    return formData.skills.map((skill, index) => `
      <span class="badge badge-primary" style="display: inline-flex; align-items: center; gap: 0.5rem;">
        ${skill}
        <button type="button" class="btn-remove-tag" onclick="opportunityCreate.removeSkill(${index})" style="background: none; border: none; color: inherit; cursor: pointer;">
          <i class="ph ph-x"></i>
        </button>
      </span>
    `).join('');
  }

  // ============================================
  // Intent Selection
  // ============================================
  function selectIntent(intent) {
    console.log('[OpportunityCreate] selectIntent called with:', intent);
    formData.intent = intent;
    renderWizard();
    attachEventListeners(); // Re-attach listeners after re-render
  }

  // ============================================
  // Payment Mode Update
  // ============================================
  function updatePaymentMode(mode) {
    formData.paymentTerms.mode = mode;
    if (mode === 'CASH') {
      formData.paymentTerms.barterRule = null;
      formData.paymentTerms.cashSettlement = 0;
      formData.paymentTerms.acknowledgedDifference = false;
      formData.equityDetails = null;
      formData.profitSharingDetails = null;
    } else if (mode === 'EQUITY') {
      formData.paymentTerms.barterRule = null;
      formData.paymentTerms.cashSettlement = 0;
      formData.paymentTerms.acknowledgedDifference = false;
      formData.profitSharingDetails = null;
      // Initialize equity details if not present
      if (!formData.equityDetails) {
        formData.equityDetails = {
          percentage: 0,
          valuation: 0,
          currency: 'SAR',
          vestingSchedule: { type: 'Immediate' }
        };
      }
    } else if (mode === 'PROFIT_SHARING') {
      formData.paymentTerms.barterRule = null;
      formData.paymentTerms.cashSettlement = 0;
      formData.paymentTerms.acknowledgedDifference = false;
      formData.equityDetails = null;
      // Initialize profit-sharing details if not present
      if (!formData.profitSharingDetails) {
        formData.profitSharingDetails = {
          calculationMethod: 'Percentage',
          shares: [],
          currency: 'SAR',
          distributionFrequency: 'Annually'
        };
      }
    } else if (mode === 'BARTER' || mode === 'HYBRID') {
      if (!formData.paymentTerms.barterRule) {
        formData.paymentTerms.barterRule = 'ALLOW_DIFFERENCE_CASH';
      }
      formData.equityDetails = null;
      formData.profitSharingDetails = null;
      
      // BRD Section 14.3: Offer Register opens when Barter is selected
      // Show option to open Offer Register after opportunity is created
      if (mode === 'BARTER' && formData.intent === 'REQUEST_SERVICE') {
        // Note: Offer Register will be accessible after opportunity creation
        // We'll add a button/link in the review step or after creation
      }
    }
    renderWizard();
  }

  // ============================================
  // Barter Rule Update
  // ============================================
  function updateBarterRule(rule) {
    formData.paymentTerms.barterRule = rule;
    if (rule === 'EQUAL_ONLY') {
      formData.paymentTerms.cashSettlement = 0;
      formData.paymentTerms.acknowledgedDifference = false;
    } else if (rule === 'ACCEPT_AS_IS') {
      formData.paymentTerms.cashSettlement = 0;
    }
    renderWizard();
  }

  // ============================================
  // Cash Settlement Update
  // ============================================
  function updateCashSettlement(amount) {
    formData.paymentTerms.cashSettlement = parseFloat(amount) || 0;
  }

  // ============================================
  // Acknowledged Difference Update
  // ============================================
  function updateAcknowledgedDifference(acknowledged) {
    formData.paymentTerms.acknowledgedDifference = acknowledged;
  }

  // ============================================
  // Equity Details Update
  // ============================================
  function updateEquityDetails(field, value) {
    if (!formData.equityDetails) {
      formData.equityDetails = {};
    }
    if (field === 'percentage') {
      formData.equityDetails.percentage = parseFloat(value) || 0;
    } else if (field === 'valuation') {
      formData.equityDetails.valuation = parseFloat(value) || 0;
    } else if (field === 'vestingType') {
      if (!formData.equityDetails.vestingSchedule) {
        formData.equityDetails.vestingSchedule = {};
      }
      formData.equityDetails.vestingSchedule.type = value;
    }
  }

  // ============================================
  // Profit-Sharing Details Update
  // ============================================
  function updateProfitSharingDetails(field, value) {
    if (!formData.profitSharingDetails) {
      formData.profitSharingDetails = {};
    }
    if (field === 'method') {
      formData.profitSharingDetails.calculationMethod = value;
    } else if (field === 'frequency') {
      formData.profitSharingDetails.distributionFrequency = value;
    }
  }

  // ============================================
  // Location Update
  // ============================================
  function updateLocation(field, value) {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (!formData.location[parent]) formData.location[parent] = {};
      formData.location[parent][child] = value;
    } else {
      formData.location[field] = value;
    }
    // Sync with Basic Info location fields
    syncBasicInfoLocationFields();
  }

  // ============================================
  // Country Change Handler
  // ============================================
  function onCountryChange(country) {
    // Update country
    formData.location.country = country;
    
    // Reset city when country changes
    formData.location.city = '';
    formData.location.area = '';
    
    // Update city dropdown
    const citySelect = document.getElementById('locationCity');
    if (citySelect) {
      if (!country) {
        citySelect.disabled = true;
        citySelect.innerHTML = '<option value="">Select City</option>';
      } else {
        citySelect.disabled = false;
        const cities = typeof window.LocationConfig !== 'undefined' 
          ? window.LocationConfig.getCitiesByCountry(country) 
          : [];
        citySelect.innerHTML = '<option value="">Select City</option>' + 
          cities.map(city => `<option value="${city}">${city}</option>`).join('');
      }
    }
    
    // Clear area dropdown
    const areaSelect = document.getElementById('locationArea');
    if (areaSelect) {
      areaSelect.innerHTML = '<option value="">Select Area</option>';
    }
    
    // Also update Basic Info city dropdown
    const basicInfoCitySelect = document.getElementById('basicInfoCity');
    if (basicInfoCitySelect) {
      basicInfoCitySelect.innerHTML = '<option value="">Select City</option>' + 
        cities.map(city => `<option value="${city}">${city}</option>`).join('');
      basicInfoCitySelect.disabled = false;
    }
    
    // Sync Basic Info location fields
    syncBasicInfoLocationFields();
    
    renderWizard();
  }

  // ============================================
  // Update City Areas Dropdown
  // ============================================
  function updateCityAreas(city) {
    // KSA Cities and Areas (keep for backward compatibility)
    const ksaCities = {
      'Riyadh': ['Olaya', 'Al Malaz', 'Al Nakheel'],
      'Jeddah': ['Al Hamra', 'Al Rawdah'],
      'Dammam': ['Al Faisaliyah'],
      'Khobar': ['Al Ulaya'],
      'Makkah': ['Al Aziziyah'],
      'Madinah': ['Qurban'],
      'Tabuk (NEOM)': ['NEOM Region', 'Tabuk Region']
    };

    const areaSelect = document.getElementById('locationArea');
    if (areaSelect && city) {
      const areas = ksaCities[city] || [];
      areaSelect.innerHTML = '<option value="">Select Area</option>' + 
        areas.map(area => `<option value="${area}">${area}</option>`).join('');
      // Clear area if city changes
      formData.location.area = '';
    }
  }

  // ============================================
  // Service Item Management
  // ============================================
  function addServiceItem() {
    formData.serviceItems.push({
      id: `item_${Date.now()}`,
      name: '',
      description: '',
      unit: 'unit',
      qty: 1,
      unitPriceRef: 0,
      totalRef: 0
    });
    renderWizard();
  }

  function removeServiceItem(index) {
    formData.serviceItems.splice(index, 1);
    renderWizard();
  }

  function updateServiceItem(index, field, value) {
    if (formData.serviceItems[index]) {
      formData.serviceItems[index][field] = value;
      // Recalculate total
      const item = formData.serviceItems[index];
      item.totalRef = (item.qty || 1) * (item.unitPriceRef || 0);
      renderWizard();
    }
  }

  // ============================================
  // Skills Management
  // ============================================
  function addSkill(skill) {
    const trimmed = skill.trim();
    if (trimmed && !formData.skills.includes(trimmed)) {
      formData.skills.push(trimmed);
      renderWizard();
    }
  }

  function addSkillFromInput() {
    const skillsInput = document.getElementById('skillsInput');
    if (skillsInput && skillsInput.value) {
      const value = skillsInput.value.trim();
      if (value) {
        // Handle comma-separated skills
        const skills = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
        skills.forEach(skill => {
          if (skill && !formData.skills.includes(skill)) {
            formData.skills.push(skill);
          }
        });
        skillsInput.value = ''; // Clear input
        renderWizard();
      }
    }
  }

  function removeSkill(index) {
    formData.skills.splice(index, 1);
    renderWizard();
  }

  // ============================================
  // Navigation
  // ============================================
  function nextStep() {
    console.log('[OpportunityCreate] Next clicked, current step:', currentStep);
    
    // Before validation, collect basic info and location data from DOM if on Details step (step 1)
    if (currentStep === 1) {
      const titleEl = document.getElementById('opportunityTitle');
      const descriptionEl = document.getElementById('opportunityDescription');
      const countryEl = document.getElementById('basicInfoCountry');
      const cityEl = document.getElementById('basicInfoCity');
      const areaEl = document.getElementById('basicInfoArea');
      const addressEl = document.getElementById('basicInfoAddress');
      const remoteEl = document.getElementById('basicInfoRemoteAllowed');
      
      // Collect title and description (trim whitespace) - read directly from DOM, fallback to formData
      if (titleEl) {
        let titleValue = String(titleEl.value || '').trim();
        // If DOM is empty but formData has a value, use formData and restore to DOM
        if (!titleValue && formData.basicInfo?.title) {
          titleValue = String(formData.basicInfo.title).trim();
          if (titleValue) {
            titleEl.value = titleValue;
            console.log('[OpportunityCreate] Restored title from formData to DOM:', titleValue);
          }
        }
        formData.basicInfo.title = titleValue;
        console.log('[OpportunityCreate] Collected title:', titleValue, 'length:', titleValue.length, 'from DOM:', !!titleEl.value);
      } else if (formData.basicInfo?.title) {
        // Element doesn't exist, but formData has value - keep it
        formData.basicInfo.title = String(formData.basicInfo.title).trim();
      }
      
      if (descriptionEl) {
        let descValue = String(descriptionEl.value || '').trim();
        // If DOM is empty but formData has a value, use formData and restore to DOM
        if (!descValue && formData.basicInfo?.description) {
          descValue = String(formData.basicInfo.description).trim();
          if (descValue) {
            descriptionEl.value = descValue;
            console.log('[OpportunityCreate] Restored description from formData to DOM:', descValue);
          }
        }
        formData.basicInfo.description = descValue;
        console.log('[OpportunityCreate] Collected description:', descValue, 'length:', descValue.length, 'from DOM:', !!descriptionEl.value);
      } else if (formData.basicInfo?.description) {
        // Element doesn't exist, but formData has value - keep it
        formData.basicInfo.description = String(formData.basicInfo.description).trim();
      }
      
      // Collect location data
      if (countryEl) {
        formData.location.country = countryEl.value || null;
      }
      if (cityEl) {
        formData.location.city = cityEl.value || '';
      }
      if (areaEl) {
        formData.location.area = areaEl.value || '';
      }
      if (addressEl) {
        formData.location.address = addressEl.value || '';
      }
      if (remoteEl) {
        formData.location.isRemoteAllowed = remoteEl.checked || false;
      }
      
      console.log('[OpportunityCreate] Collected Basic Info and Location data:', {
        title: formData.basicInfo.title,
        description: formData.basicInfo.description,
        location: formData.location
      });
    }
    
    if (!validateStep()) {
      console.log('[OpportunityCreate] Validation failed, staying on step:', currentStep);
      return;
    }
    
    // Before validation, collect model field data from DOM if on Model step (step 2)
    if (currentStep === 2 && typeof CollaborationModelFields !== 'undefined' && formData.subModel) {
      collectModelFieldData();
    }
    
    // Explicit step navigation to ensure correct flow:
    // Step 0 → Step 1 (Intent → Details)
    // Step 1 → Step 2 (Details → Model)
    // Step 2 → Step 3 (Model → Payment)
    // Step 3 → Step 4 (Payment → Review)
    const previousStep = currentStep;
    if (currentStep === 0) {
      currentStep = 1; // Step 0 → Step 1 (Intent → Details)
    } else if (currentStep === 1) {
      currentStep = 2; // Step 1 → Step 2 (Details → Model)
    } else if (currentStep === 2) {
      currentStep = 3; // Step 2 → Step 3 (Model → Payment)
    } else if (currentStep === 3) {
      currentStep = 4; // Step 3 → Step 4 (Payment → Review)
    } else {
      // Fallback: increment (should not reach here in normal flow)
      console.warn('[OpportunityCreate] Unexpected step transition from:', currentStep);
      currentStep++;
    }
    
    console.log('[OpportunityCreate] Step transition:', previousStep, '→', currentStep);
    console.log('[OpportunityCreate] Moving to step:', currentStep);
    
    renderWizard();
    updateProgressIndicator();
    attachEventListeners(); // Re-attach listeners after re-render
    
    // Initialize location dropdowns if on Details step (step 1)
    if (currentStep === 1 && typeof window.LocationConfig !== 'undefined') {
      setTimeout(() => {
        const countrySelect = document.getElementById('basicInfoCountry');
        const citySelect = document.getElementById('basicInfoCity');
        if (countrySelect && citySelect) {
          // Populate countries if not already populated
          if (countrySelect.options.length <= 1) {
            const countries = window.LocationConfig.getAllowedCountries();
            const defaultCountry = window.LocationConfig.getDefaultCountry();
            countrySelect.innerHTML = '<option value="">Select Country</option>' + 
              countries.map(country => `<option value="${country}" ${formData.location.country === country ? 'selected' : ''}>${country}</option>`).join('');
            if (defaultCountry && !formData.location.country) {
              formData.location.country = defaultCountry;
              countrySelect.value = defaultCountry;
            }
          }
          // Update city dropdown
          if (formData.location.country) {
            const cities = window.LocationConfig.getCitiesByCountry(formData.location.country);
            citySelect.innerHTML = '<option value="">Select City</option>' + 
              cities.map(city => `<option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>`).join('');
            citySelect.disabled = false;
          }
        }
        syncBasicInfoLocationFields();
      }, 100);
    }
    
    // Initialize model selector if on Model step (step 1)
    if (currentStep === 1 && typeof CollaborationModelsSelector !== 'undefined') {
      CollaborationModelsSelector.init(handleModelSelection);
      // Restore selected model state if we have one
      if (formData.subModel) {
        isRestoringModel = true;
        setTimeout(() => {
          if (typeof CollaborationModelsSelector.setSelectedModels === 'function') {
            CollaborationModelsSelector.setSelectedModels([formData.subModel], true);
            // Render fields directly without triggering callback
            setTimeout(() => {
              isRestoringModel = false;
              if (typeof CollaborationModelFields !== 'undefined') {
                const container = document.getElementById('collaborationModelFields');
                if (container) {
                  renderModelFieldsWithRestore([formData.subModel]);
                }
              }
            }, 100);
          }
        }, 200);
      }
    }
  }

  function previousStep() {
    console.log('[OpportunityCreate] Previous clicked, current step:', currentStep);
    
    // Backward navigation transitions:
    // Step 4 → Step 3 (Review → Payment)
    // Step 3 → Step 2 (Payment → Model)
    // Step 2 → Step 1 (Model → Details)
    // Step 1 → Step 0 (Details → Intent)
    const previousStep = currentStep;
    if (currentStep === 4) {
      currentStep = 3; // Step 4 → Step 3 (Review → Payment)
    } else if (currentStep === 3) {
      currentStep = 2; // Step 3 → Step 2 (Payment → Model)
    } else if (currentStep === 2) {
      currentStep = 1; // Step 2 → Step 1 (Model → Details)
    } else if (currentStep === 1) {
      currentStep = 0; // Step 1 → Step 0 (Details → Intent)
    } else {
      // Already at step 0, can't go back further
      console.log('[OpportunityCreate] Already at first step');
      return;
    }
    
    console.log('[OpportunityCreate] Step transition (backward):', previousStep, '→', currentStep);
    
    renderWizard();
    updateProgressIndicator();
    attachEventListeners(); // Re-attach listeners after re-render
    
    // Initialize model selector if going back to Model step (step 2)
    if (currentStep === 2 && typeof CollaborationModelsSelector !== 'undefined') {
      CollaborationModelsSelector.init(handleModelSelection);
      // Restore selected model state if we have one
      // Wait for models to be rendered before restoring state
      if (formData.subModel) {
        const checkModelsRendered = () => {
          const modelsGrid = document.getElementById('collaborationModelsGrid');
          const modelCards = modelsGrid?.querySelectorAll('.collaboration-model-card');
          if (modelCards && modelCards.length > 0) {
            // Models are rendered, restore state
            if (typeof CollaborationModelsSelector.setSelectedModels === 'function') {
              console.log('[OpportunityCreate] Restoring selected model on previous step:', formData.subModel);
              isRestoringModel = true;
              CollaborationModelsSelector.setSelectedModels([formData.subModel], true);
              // Render fields directly without triggering callback
              setTimeout(() => {
                isRestoringModel = false;
                if (typeof CollaborationModelFields !== 'undefined') {
                  const container = document.getElementById('collaborationModelFields');
                  if (container) {
                    renderModelFieldsWithRestore([formData.subModel]);
                  }
                }
              }, 100);
            }
          } else {
            // Models not yet rendered, retry after a short delay (max 10 retries)
            const retryCount = parseInt(modelsGrid?.getAttribute('data-retry-count') || '0');
            if (retryCount < 10) {
              if (modelsGrid) modelsGrid.setAttribute('data-retry-count', (retryCount + 1).toString());
              setTimeout(checkModelsRendered, 100);
            } else {
              console.warn('[OpportunityCreate] Failed to restore model selector state after 10 retries');
            }
          }
        };
        setTimeout(checkModelsRendered, 200);
      }
    }
  }

  // ============================================
  // Switch to Step (like signup)
  // ============================================
  function switchToStep(step) {
    // Ensure step is valid (0-4)
    if (step < 0 || step > 4) {
      console.warn('[OpportunityCreate] Invalid step:', step);
      return false;
    }
    
    // Only allow switching to previous steps (going back) - prevent forward navigation via tabs
    // Forward navigation must be done via Next button only
    if (step < currentStep) {
      // Allow going back without validation
      console.log('[OpportunityCreate] Stepper click: Step', currentStep, '→ Step', step);
      currentStep = step;
      renderWizard();
      updateProgressIndicator();
      attachEventListeners(); // Re-attach listeners after re-render
      
      // Initialize location dropdowns if going back to Details step (step 2)
      if (currentStep === 2 && typeof window.LocationConfig !== 'undefined') {
        setTimeout(() => {
          syncBasicInfoLocationFields();
        }, 100);
      }
      
      // Initialize model selector if going back to Model step (step 2)
      if (currentStep === 2 && typeof CollaborationModelsSelector !== 'undefined') {
        CollaborationModelsSelector.init(handleModelSelection);
        // Restore selected model state if we have one
        if (formData.subModel) {
          setTimeout(() => {
            const checkModelsRendered = () => {
              const modelsGrid = document.getElementById('collaborationModelsGrid');
              const modelCards = modelsGrid?.querySelectorAll('.collaboration-model-card');
              if (modelCards && modelCards.length > 0) {
                if (typeof CollaborationModelsSelector.setSelectedModels === 'function') {
                  console.log('[OpportunityCreate] Restoring selected model on switch:', formData.subModel);
                  isRestoringModel = true;
                  CollaborationModelsSelector.setSelectedModels([formData.subModel], true);
                  setTimeout(() => {
                    isRestoringModel = false;
                    if (typeof CollaborationModelFields !== 'undefined') {
                      const container = document.getElementById('collaborationModelFields');
                      if (container) {
                        renderModelFieldsWithRestore([formData.subModel]);
                      }
                    }
                  }, 100);
                }
              } else {
                const retryCount = parseInt(modelsGrid?.getAttribute('data-retry-count') || '0');
                if (retryCount < 10) {
                  if (modelsGrid) modelsGrid.setAttribute('data-retry-count', (retryCount + 1).toString());
                  setTimeout(checkModelsRendered, 100);
                }
              }
            };
            setTimeout(checkModelsRendered, 100);
          }, 100);
        }
      }
      
      // Initialize location dropdowns if going back to Details step (step 1)
      if (currentStep === 1 && typeof window.LocationConfig !== 'undefined') {
        setTimeout(() => {
          syncBasicInfoLocationFields();
        }, 100);
      }
    } else if (step === currentStep) {
      // Already on this step
      return true;
    } else {
      // Prevent forward navigation via tabs - must use Next button
      // This ensures users can only go forward by clicking Next button
      return false;
    }
    return true;
  }

  // ============================================
  // Update Progress Indicator (like signup)
  // ============================================
  function updateProgressIndicator() {
    // Update tab navigation (matching signup style)
    document.querySelectorAll('#opportunityWizardTabs .tab-nav-item').forEach((tabEl) => {
      const tabStep = parseInt(tabEl.getAttribute('data-step'));
      const stepNumber = tabEl.querySelector('.tab-step-number');
      const completionIndicator = tabEl.querySelector('.tab-completion-indicator');
      const stepDisplayNum = tabStep + 1; // Display as 1-5 instead of 0-4
      
      if (tabStep === currentStep) {
        // Active step
        tabEl.classList.add('active');
        tabEl.classList.remove('completed', 'disabled');
        if (stepNumber) {
          stepNumber.style.background = 'rgba(255, 255, 255, 0.2)';
          stepNumber.style.color = 'white';
          stepNumber.innerHTML = stepDisplayNum.toString();
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'none';
        }
      } else if (tabStep < currentStep) {
        // Completed step
        tabEl.classList.remove('active', 'disabled');
        tabEl.classList.add('completed');
        if (stepNumber) {
          stepNumber.style.background = 'var(--color-success, #10b981)';
          stepNumber.style.color = 'white';
          stepNumber.innerHTML = '<i class="ph ph-check" style="font-size: 0.9rem;"></i>';
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'block';
          completionIndicator.innerHTML = '<i class="ph ph-check" style="font-size: 1.1rem; color: var(--color-success, #10b981);"></i>';
        }
      } else {
        // Future step
        tabEl.classList.remove('active', 'completed');
        tabEl.classList.add('disabled');
        if (stepNumber) {
          stepNumber.style.background = 'rgba(0, 0, 0, 0.05)';
          stepNumber.style.color = 'var(--color-gray-600, #6b7280)';
          stepNumber.innerHTML = stepDisplayNum.toString();
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'none';
        }
      }
    });
    
    // Update progress bar and text
    const progressBar = document.getElementById('wizardProgressBar');
    const progressText = document.getElementById('wizardProgressText');
    const progressPercentage = document.getElementById('wizardProgressPercentage');
    
    // Calculate percentage based on visible steps (5 total: 0,1,2,3,4)
    const totalVisibleSteps = 5; // Intent, Details, Model, Payment, Review
    const stepNum = Number(currentStep);
    const adjustedStepIndex = stepNum + 1; // Step 0 = index 1, Step 4 = index 5
    
    const percentage = (adjustedStepIndex / totalVisibleSteps) * 100;
    
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
    
    if (progressText) {
      progressText.textContent = `Step ${adjustedStepIndex} of ${totalVisibleSteps}`;
    }
    
    if (progressPercentage) {
      progressPercentage.textContent = Math.round(percentage) + '%';
    }
  }

  // ============================================
  // Validation with Visual Feedback
  // ============================================
  function validateStep() {
    let isValid = true;
    let errorMessage = '';
    
    // Remove previous error messages
    document.querySelectorAll('.validation-error').forEach(el => el.remove());
    
    switch (currentStep) {
      case 0:
        // Intent selection - required
        if (!formData.intent) {
          errorMessage = 'Please select an intent (Request Service or Offer Service) to continue';
          isValid = false;
        }
        break;
      case 1:
        // Details - Basic Info + Location + Service Items + Skills (required fields)
        // Collect Basic Information and Location data
        const titleEl = document.getElementById('opportunityTitle');
        const descriptionEl = document.getElementById('opportunityDescription');
        const countryEl = document.getElementById('basicInfoCountry');
        const cityEl = document.getElementById('basicInfoCity');
        const areaEl = document.getElementById('basicInfoArea');
        const addressEl = document.getElementById('basicInfoAddress');
        const remoteEl = document.getElementById('basicInfoRemoteAllowed');
        
        // Collect values from DOM first (most up-to-date), then fallback to formData
        // Always read directly from DOM elements if they exist
        let titleValue = '';
        if (titleEl) {
          // Read directly from DOM element - this is the most reliable source
          const domValue = titleEl.value || '';
          titleValue = String(domValue).trim();
          // Always update formData to keep it in sync, even if empty
          formData.basicInfo.title = titleValue;
        }
        // Fallback to formData if DOM element doesn't exist or was empty
        // This handles cases where the input was reset during re-render
        if ((!titleValue || titleValue.length === 0) && formData.basicInfo?.title) {
          const formDataValue = String(formData.basicInfo.title).trim();
          if (formDataValue && formDataValue.length > 0) {
            titleValue = formDataValue;
            // Update DOM if it exists but was empty
            if (titleEl) {
              titleEl.value = formDataValue;
            }
          }
        }
        
        let descriptionValue = '';
        if (descriptionEl) {
          const domValue = descriptionEl.value || '';
          descriptionValue = String(domValue).trim();
          formData.basicInfo.description = descriptionValue;
        }
        // Fallback to formData if DOM was empty
        if ((!descriptionValue || descriptionValue.length === 0) && formData.basicInfo?.description) {
          const formDataValue = String(formData.basicInfo.description).trim();
          if (formDataValue && formDataValue.length > 0) {
            descriptionValue = formDataValue;
            if (descriptionEl) {
              descriptionEl.value = formDataValue;
            }
          }
        }
        
        let countryValue = null;
        if (countryEl && countryEl.value) {
          countryValue = countryEl.value;
        } else if (formData.location?.country) {
          countryValue = formData.location.country;
        }
        
        let cityValue = '';
        if (cityEl && cityEl.value) {
          cityValue = String(cityEl.value).trim();
        } else if (formData.location?.city) {
          cityValue = String(formData.location.city).trim();
        }
        
        // Debug logging
        console.log('[OpportunityCreate] Step 1 Validation - Values:', {
          titleValue: titleValue || '(empty)',
          titleValueLength: titleValue.length,
          descriptionValue: descriptionValue || '(empty)',
          countryValue: countryValue || '(empty)',
          cityValue: cityValue || '(empty)',
          titleElExists: !!titleEl,
          titleElValue: titleEl?.value || '(no element)',
          titleElValueLength: titleEl?.value?.length || 0,
          formDataTitle: formData.basicInfo?.title || '(not set)'
        });
        
        // Update formData with collected values
        formData.basicInfo.title = titleValue;
        formData.basicInfo.description = descriptionValue;
        formData.location.country = countryValue;
        formData.location.city = cityValue;
        if (areaEl) formData.location.area = areaEl.value || '';
        if (addressEl) formData.location.address = addressEl.value || '';
        if (remoteEl) formData.location.isRemoteAllowed = remoteEl.checked || false;
        
        // Validate required fields - check both existence and non-empty after trim
        const isTitleEmpty = !titleValue || titleValue.length === 0;
        const isDescriptionEmpty = !descriptionValue || descriptionValue.length === 0;
        
        if (isTitleEmpty) {
          errorMessage = 'Please enter an opportunity title';
          isValid = false;
          console.warn('[OpportunityCreate] Validation failed - Title is empty.', {
            titleElExists: !!titleEl,
            titleElValue: titleEl?.value,
            titleElValueType: typeof titleEl?.value,
            titleValue: titleValue,
            titleValueLength: titleValue.length,
            formDataTitle: formData.basicInfo?.title
          });
        } else if (isDescriptionEmpty) {
          errorMessage = 'Please enter an opportunity description';
          isValid = false;
        } else if (!countryValue) {
          errorMessage = 'Please select a country';
          isValid = false;
        } else if (!cityValue || cityValue.length === 0) {
          errorMessage = 'Please select a city';
          isValid = false;
        } else if (!formData.serviceItems || formData.serviceItems.length === 0) {
          errorMessage = 'Please add at least one service item';
          isValid = false;
        } else if (!formData.skills || formData.skills.length === 0) {
          errorMessage = 'Please add at least one required skill';
          isValid = false;
        }
        
        // Validate location using LocationConfig if available
        if (isValid && typeof window.LocationConfig !== 'undefined') {
          if (!window.LocationConfig.isCountryAllowed(countryValue)) {
            errorMessage = 'Selected country is not allowed';
            isValid = false;
          } else if (!window.LocationConfig.isCityInCountry(countryValue, cityValue)) {
            errorMessage = 'Selected city is not available in the selected country';
            isValid = false;
          }
        }
        break;
      case 2:
        // Model selection - optional
        // Collect model field data if model is selected
        if (formData.subModel) {
          const container = document.getElementById('collaborationModelFields');
          if (container) {
            const modelId = formData.subModel;
            const collectedData = {};
            const rangeFields = {};
            
            document.querySelectorAll('.collaboration-field').forEach(field => {
              const fieldModelId = field.getAttribute('data-model-id');
              const attrName = field.getAttribute('data-attr-name');
              
              if (fieldModelId === modelId && attrName) {
                if (field.name && (field.name.includes('[min]') || field.name.includes('[max]'))) {
                  const baseName = attrName;
                  if (!rangeFields[baseName]) {
                    rangeFields[baseName] = {};
                  }
                  if (field.name.includes('[min]')) {
                    rangeFields[baseName].min = parseFloat(field.value) || 0;
                  } else {
                    rangeFields[baseName].max = parseFloat(field.value) || 0;
                  }
                } else {
                  let value;
                  if (field.type === 'checkbox') {
                    value = field.checked;
                  } else if (field.type === 'number') {
                    value = parseFloat(field.value) || 0;
                  } else {
                    value = field.value || '';
                  }
                  collectedData[attrName] = value;
                }
              }
            });
            
            Object.keys(rangeFields).forEach(baseName => {
              collectedData[baseName] = rangeFields[baseName];
            });
            
            if (typeof CollaborationModelFields !== 'undefined' && typeof CollaborationModelFields.setModelData === 'function') {
              const existingData = CollaborationModelFields.getModelData(modelId) || {};
              CollaborationModelFields.setModelData(modelId, { ...existingData, ...collectedData });
            }
          }
        }
        // All fields optional - no validation required
        isValid = true;
        break;
      case 3:
        // Payment terms - all fields optional
        // Payment mode and barter rules are optional - no validation required
        isValid = true;
        break;
      case 4:
        // Review step - no validation (display only)
        isValid = true;
        break;
      default:
        isValid = true;
    }
    
    // Show error message if validation failed
    if (!isValid && errorMessage) {
      showValidationError(errorMessage);
    }
    
    return isValid;
  }

  // ============================================
  // Show Validation Error
  // ============================================
  function showValidationError(message) {
    const wizardContent = document.querySelector('.wizard-content');
    if (!wizardContent) return;
    
    // Remove any existing error messages
    document.querySelectorAll('.validation-error').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'validation-error';
    errorDiv.style.cssText = `
      background: #fee2e2;
      border: 1px solid #fca5a5;
      color: #991b1b;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      animation: slideDown 0.3s ease;
    `;
    errorDiv.innerHTML = `
      <i class="ph ph-warning" style="font-size: 1.5rem;"></i>
      <span style="font-weight: 500;">${message}</span>
    `;
    
    wizardContent.insertBefore(errorDiv, wizardContent.firstChild);
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      errorDiv.style.opacity = '0';
      errorDiv.style.transition = 'opacity 0.3s';
      setTimeout(() => errorDiv.remove(), 300);
    }, 5000);
  }

  // ============================================
  // Highlight Invalid Fields
  // ============================================
  function highlightInvalidFields(errorMessages) {
    // Remove previous highlights
    document.querySelectorAll('.collaboration-field').forEach(field => {
      field.style.borderColor = '';
      field.style.borderWidth = '';
      field.classList.remove('field-error');
    });
    
    // Extract field names from error messages
    const fieldNames = new Set();
    errorMessages.forEach(errorMsg => {
      // Error format: "Model Name: Field Name is required"
      const match = errorMsg.match(/:\s*(.+?)\s+is required/);
      if (match) {
        fieldNames.add(match[1]);
      }
    });
    
    // Highlight fields
    if (formData.subModel) {
      const modelId = formData.subModel;
      document.querySelectorAll('.collaboration-field').forEach(field => {
        const fieldModelId = field.getAttribute('data-model-id');
        const attrName = field.getAttribute('data-attr-name');
        
        if (fieldModelId === modelId && attrName) {
          // Check if this field's label matches any error field name
          const fieldLabel = field.closest('.form-group')?.querySelector('label');
          const labelText = fieldLabel?.textContent?.trim() || '';
          
          // Check if field name or label matches error
          const matchesError = Array.from(fieldNames).some(errorFieldName => {
            return labelText.includes(errorFieldName) || attrName === errorFieldName;
          });
          
          if (matchesError || fieldNames.has(attrName)) {
            field.style.borderColor = '#ef4444';
            field.style.borderWidth = '2px';
            field.classList.add('field-error');
            
            // Add error icon if possible
            const formGroup = field.closest('.form-group');
            if (formGroup && !formGroup.querySelector('.field-error-icon')) {
              const errorIcon = document.createElement('i');
              errorIcon.className = 'ph ph-warning field-error-icon';
              errorIcon.style.cssText = 'color: #ef4444; margin-left: 0.5rem;';
              if (fieldLabel) {
                fieldLabel.appendChild(errorIcon);
              }
            }
          }
        }
      });
    }
  }

  // ============================================
  // Collect Model Field Data from DOM
  // ============================================
  function collectModelFieldData() {
    if (!formData.subModel || typeof CollaborationModelFields === 'undefined') {
      return;
    }
    
    const container = document.getElementById('collaborationModelFields');
    if (!container) {
      console.warn('[OpportunityCreate] Container not found when collecting model field data');
      return;
    }
    
    // Read all field values from DOM and build modelData object
    const modelId = formData.subModel;
    const collectedData = {};
    const rangeFields = {}; // Track range fields separately
    
    document.querySelectorAll('.collaboration-field').forEach(field => {
      const fieldModelId = field.getAttribute('data-model-id');
      const attrName = field.getAttribute('data-attr-name');
      
      if (fieldModelId === modelId && attrName) {
        // Handle currency range fields (min/max)
        if (field.name && (field.name.includes('[min]') || field.name.includes('[max]'))) {
          const baseName = attrName;
          if (!rangeFields[baseName]) {
            rangeFields[baseName] = {};
          }
          if (field.name.includes('[min]')) {
            rangeFields[baseName].min = parseFloat(field.value) || 0;
          } else {
            rangeFields[baseName].max = parseFloat(field.value) || 0;
          }
        } else {
          // Regular fields
          let value;
          if (field.type === 'checkbox') {
            value = field.checked;
          } else if (field.type === 'number') {
            value = parseFloat(field.value) || 0;
          } else {
            value = field.value || '';
          }
          collectedData[attrName] = value;
        }
      }
    });
    
    // Merge range fields into collectedData
    Object.keys(rangeFields).forEach(baseName => {
      collectedData[baseName] = rangeFields[baseName];
    });
    
    // Update modelData if we have collected data
    if (typeof CollaborationModelFields.setModelData === 'function') {
      // Get existing data and merge
      const existingData = CollaborationModelFields.getModelData(modelId) || {};
      CollaborationModelFields.setModelData(modelId, { ...existingData, ...collectedData });
      console.log('[OpportunityCreate] Model field data collected:', collectedData);
    }
  }

  // ============================================
  // Model Selection Handler
  // ============================================
  let isRestoringModel = false; // Flag to prevent infinite loops
  
  function handleModelSelection(selectedModels) {
    console.log('[OpportunityCreate] handleModelSelection called, selectedModels:', selectedModels, 'currentStep:', currentStep, 'isRestoringModel:', isRestoringModel);
    
    // Prevent infinite loop during restoration
    if (isRestoringModel) {
      console.log('[OpportunityCreate] Skipping handleModelSelection during restoration');
      return;
    }
    
    if (selectedModels && selectedModels.length > 0) {
      const firstModel = selectedModels[0];
      const previousModel = formData.subModel;
      formData.subModel = firstModel;
      formData.model = firstModel.split('.')[0];
      
      console.log('[OpportunityCreate] Model saved:', firstModel, 'formData.subModel:', formData.subModel);

      // Only re-render if model actually changed
      if (previousModel !== firstModel && currentStep === 2) {
        renderWizard();
        updateProgressIndicator();
        attachEventListeners();
        
        // Wait for wizard to re-render, then render model fields
        setTimeout(() => {
          // Render model-specific fields on the Model step (step 2) - show details under selected sub-model
          if (typeof CollaborationModelFields !== 'undefined') {
            const container = document.getElementById('collaborationModelFields');
            if (container) {
              renderModelFieldsWithRestore(selectedModels);
            } else {
              console.warn('[OpportunityCreate] Container #collaborationModelFields not found after re-render');
              // Retry after a short delay
              setTimeout(() => {
                const retryContainer = document.getElementById('collaborationModelFields');
                if (retryContainer) {
                  renderModelFieldsWithRestore(selectedModels);
                }
              }, 200);
            }
          }
        }, 100);
      } else if (previousModel === firstModel && currentStep === 2) {
        // Model didn't change, just ensure fields are rendered
        setTimeout(() => {
          if (typeof CollaborationModelFields !== 'undefined') {
            const container = document.getElementById('collaborationModelFields');
            if (container && container.style.display === 'none') {
              renderModelFieldsWithRestore(selectedModels);
            }
          }
        }, 50);
      }
    } else {
      console.log('[OpportunityCreate] No models selected');
      // Clear formData
      formData.subModel = null;
      formData.model = null;
      
      // Re-render wizard to hide selected model info
      if (currentStep === 2) {
        renderWizard();
        updateProgressIndicator();
        attachEventListeners();
        
        // Clear model fields if no model selected
        setTimeout(() => {
          if (typeof CollaborationModelFields !== 'undefined') {
            const container = document.getElementById('collaborationModelFields');
            if (container) {
              container.style.display = 'none';
              CollaborationModelFields.renderFields([]);
            }
          }
        }, 100);
      }
    }
  }

  // ============================================
  // Helper: Render Model Fields with Data Restore
  // ============================================
  function renderModelFieldsWithRestore(selectedModels) {
    const container = document.getElementById('collaborationModelFields');
    if (!container) {
      console.error('[OpportunityCreate] Container not found in renderModelFieldsWithRestore');
      return;
    }
    
    // Ensure container is visible when fields are rendered
    container.style.display = 'block';
    
    // Add header if not already present
    if (!container.querySelector('.subsection-title')) {
      const headerDiv = document.createElement('div');
      headerDiv.style.cssText = 'border-top: 2px solid var(--border-color); padding-top: 2rem; margin-top: 2rem;';
      headerDiv.innerHTML = `
        <h3 class="subsection-title" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem;">
          <i class="ph ph-clipboard-text" style="color: var(--color-primary);"></i>
          Model Details
        </h3>
        <p class="form-text" style="margin-bottom: 1.5rem; color: var(--text-secondary);">
          Configure the specific details for the selected collaboration model.
        </p>
      `;
      container.insertBefore(headerDiv, container.firstChild);
    }

    // Get existing model data before rendering (to restore after render)
    const existingModelData = formData.subModel && typeof CollaborationModelFields.getModelData === 'function'
      ? CollaborationModelFields.getModelData(formData.subModel)
      : null;
    
    // Render fields
    CollaborationModelFields.renderFields(selectedModels);
    
    // Restore field values if they exist
    if (existingModelData && Object.keys(existingModelData).length > 0) {
      setTimeout(() => {
        Object.keys(existingModelData).forEach(attrName => {
          const value = existingModelData[attrName];
          
          // Handle range fields (currency range with min/max)
          if (value && typeof value === 'object' && (value.min !== undefined || value.max !== undefined)) {
            const minField = document.querySelector(`input[name="collaborationModels[${formData.subModel}][${attrName}][min]"]`);
            const maxField = document.querySelector(`input[name="collaborationModels[${formData.subModel}][${attrName}][max]"]`);
            if (minField && value.min !== undefined) {
              minField.value = value.min;
              minField.dispatchEvent(new Event('change', { bubbles: true }));
            }
            if (maxField && value.max !== undefined) {
              maxField.value = value.max;
              maxField.dispatchEvent(new Event('change', { bubbles: true }));
            }
          } else {
            // Regular fields
            const field = document.querySelector(`.collaboration-field[data-model-id="${formData.subModel}"][data-attr-name="${attrName}"]`);
            if (field) {
              if (field.type === 'checkbox') {
                field.checked = value === true || value === 'true';
              } else {
                field.value = value || '';
              }
              field.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        });
      }, 150);
    }
    
    // Ensure field listeners are attached after rendering
    // CollaborationModelFields.renderFields() already calls initializeFieldListeners(),
    // but we also call attachEventListeners() to ensure all listeners are set up
    attachEventListeners();
    console.log('[OpportunityCreate] Model fields rendered successfully');
  }

  // ============================================
  // Submit Opportunity
  // ============================================
  async function submitOpportunity() {
    if (!validateStep()) {
      return;
    }

    const status = document.getElementById('opportunityStatus')?.value || 'draft';
    const title = document.getElementById('opportunityTitle')?.value || 'Untitled Opportunity';
    const description = document.getElementById('opportunityDescription')?.value || '';

    if (!title || !description) {
      alert('Please provide title and description');
      return;
    }

    // Validate service items
    if (typeof ServiceItemModel !== 'undefined') {
      const validation = ServiceItemModel.validateArray(formData.serviceItems);
      if (!validation.valid) {
        alert('Service items validation failed: ' + validation.errors.join(', '));
        return;
      }
    }

    // Use location from formData (already validated)
    const location = {
      ...formData.location
    };

    const opportunityData = {
      title: title,
      description: description,
      intent: formData.intent,
      model: formData.model || '1',
      subModel: formData.subModel || '1.1',
      skills: formData.skills,
      serviceItems: formData.serviceItems,
      preferredPaymentTerms: formData.paymentTerms, // Save as preferredPaymentTerms (new field)
      paymentTerms: formData.paymentTerms, // Also keep for backward compatibility
      location: location,
      status: status
    };

    // Collect model-specific attributes if available
    if (typeof CollaborationModelFields !== 'undefined') {
      const modelData = CollaborationModelFields.collectModelData();
      if (modelData) {
        opportunityData.attributes = modelData;
      }
    }

    try {
      // Get current user ID
      let createdByUserId = null;
      try {
        const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          createdByUserId = session.userId || session.id;
        }
      } catch (e) {
        console.error('Error getting current user:', e);
      }

      opportunityData.createdByUserId = createdByUserId;
      opportunityData.skillsTags = formData.skills || []; // Map skills to skillsTags
      opportunityData.paymentTerms = {
        type: formData.paymentTerms?.mode || formData.paymentTerms?.type || 'CASH',
        barterRule: formData.paymentTerms?.barterRule || null
      };

      let opportunity = null;

      // Save to PMTwinData first (persistent storage), then sync to OpportunityStore
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
        // Ensure proper field mapping for PMTwinData
        const pmtwinData = {
          ...opportunityData,
          createdBy: opportunityData.createdByUserId || opportunityData.createdBy,
          creatorId: opportunityData.createdByUserId || opportunityData.createdBy,
          skillsTags: opportunityData.skillsTags || [],
          paymentTerms: opportunityData.paymentTerms || { mode: 'CASH', type: 'CASH' },
          equityDetails: formData.equityDetails || null,
          profitSharingDetails: formData.profitSharingDetails || null,
          linkedOffers: [],
          matchingModel: null
        };
        opportunity = PMTwinData.Opportunities.create(pmtwinData);
        console.log('[OpportunityCreate] Created in PMTwinData:', opportunity?.id);
        
        // Also sync to OpportunityStore for backward compatibility
        if (opportunity && typeof window.OpportunityStore !== 'undefined') {
          try {
            const storeOpp = window.OpportunityStore.createOpportunity({
              ...opportunityData,
              id: opportunity.id // Use same ID
            });
            console.log('[OpportunityCreate] Synced to OpportunityStore:', storeOpp?.id);
          } catch (e) {
            console.warn('[OpportunityCreate] Could not sync to OpportunityStore:', e);
          }
        }
      } else if (typeof window.OpportunityStore !== 'undefined') {
        // Fallback to OpportunityStore if PMTwinData not available
        opportunity = window.OpportunityStore.createOpportunity(opportunityData);
        console.warn('[OpportunityCreate] Using OpportunityStore (not persistent)');
      } else {
        alert('Opportunities service not available');
        return;
      }
      
      if (opportunity) {
        // BRD Section 14.3: If Barter mode selected for Need, offer to open Offer Register
        const isBarterNeed = (formData.paymentTerms.mode === 'BARTER' || formData.paymentTerms.mode === 'Barter') && 
                            formData.intent === 'REQUEST_SERVICE';
        
        // If status is PUBLISHED, publish it in both stores
        if (status === 'published' || status === 'PUBLISHED') {
          if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
            PMTwinData.Opportunities.update(opportunity.id, { status: 'PUBLISHED' });
          }
          if (typeof window.OpportunityStore !== 'undefined') {
            window.OpportunityStore.publishOpportunity(opportunity.id);
          }
        }

        // BRD Section 14.3: Offer Register opens when Barter is selected
        if (isBarterNeed) {
          const openRegister = confirm('Opportunity created successfully!\n\nWould you like to open the Offer Register to link compatible offers?');
          if (openRegister) {
            // Redirect to Offer Register
            if (typeof window.UrlHelper !== 'undefined') {
              const registerUrl = window.UrlHelper.buildUrlWithQuery('pages/barter/offer-register/index.html', { needId: opportunity.id });
              window.location.href = registerUrl;
            } else {
              const basePath = getBasePath();
              window.location.href = `${basePath}pages/barter/offer-register/index.html?needId=${opportunity.id}`;
            }
            return;
          }
        } else {
          alert('Opportunity created successfully!');
        }
        
        // Redirect to opportunity details
        if (typeof window.UrlHelper !== 'undefined') {
          const detailsUrl = window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opportunity.id });
          window.location.href = detailsUrl;
        } else if (typeof window.NavRoutes !== 'undefined') {
          const viewUrl = window.NavRoutes.getRouteWithQuery('opportunities/details', { id: opportunity.id });
          window.location.href = viewUrl;
        } else {
          window.location.href = `/pages/opportunities/details.html?id=${opportunity.id}`;
        }
      } else {
        alert('Failed to create opportunity');
      }
    } catch (error) {
      console.error('Error creating opportunity:', error);
      alert('An error occurred: ' + error.message);
    }
  }

  // ============================================
  // Attach Event Listeners
  // ============================================
  function attachEventListeners() {
    setTimeout(() => {
      const nextBtn = document.getElementById('wizardNextBtn');
      const prevBtn = document.getElementById('wizardPrevBtn');
      const submitBtn = document.getElementById('wizardSubmitBtn');

      if (nextBtn) {
        nextBtn.addEventListener('click', nextStep);
      }
      if (prevBtn) {
        prevBtn.addEventListener('click', previousStep);
      }
      if (submitBtn) {
        submitBtn.addEventListener('click', submitOpportunity);
      }
    }, 100);
  }

  // ============================================
  // Save Draft
  // ============================================
  function saveDraft() {
    // Get title and description from formData.basicInfo or DOM (fallback)
    const titleEl = document.getElementById('opportunityTitle');
    const descriptionEl = document.getElementById('opportunityDescription');
    const title = (titleEl?.value || formData.basicInfo?.title || '').trim() || 'Untitled Opportunity';
    const description = (descriptionEl?.value || formData.basicInfo?.description || '').trim() || '';
    
    const draftData = {
      ...formData,
      title,
      description,
      status: 'draft',
      savedAt: new Date().toISOString()
    };

    try {
      // Save to localStorage as draft
      const drafts = JSON.parse(localStorage.getItem('pmtwin_opportunity_drafts') || '[]');
      const draftId = `draft_${Date.now()}`;
      drafts.push({ id: draftId, ...draftData });
      localStorage.setItem('pmtwin_opportunity_drafts', JSON.stringify(drafts));
      
      // Show success message
      const message = document.createElement('div');
      message.className = 'alert alert-success';
      message.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 1rem 1.5rem; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);';
      message.innerHTML = '<i class="ph ph-check-circle"></i> Draft saved successfully!';
      document.body.appendChild(message);
      
      setTimeout(() => {
        message.style.opacity = '0';
        message.style.transition = 'opacity 0.3s';
        setTimeout(() => message.remove(), 300);
      }, 3000);
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  }

  // ============================================
  // Get Form Data (for external access)
  // ============================================
  function getFormData() {
    return formData;
  }

  // ============================================
  // Sync Basic Info Location Fields
  // ============================================
  function syncBasicInfoLocationFields() {
    const countrySelect = document.getElementById('basicInfoCountry');
    const citySelect = document.getElementById('basicInfoCity');
    const areaSelect = document.getElementById('basicInfoArea');
    const addressInput = document.getElementById('basicInfoAddress');
    const remoteCheckbox = document.getElementById('basicInfoRemoteAllowed');
    
    if (!countrySelect || !citySelect) return;
    
    // Update fields from formData
    if (formData.location.country) {
      countrySelect.value = formData.location.country;
      // Update city dropdown
      if (typeof window.LocationConfig !== 'undefined') {
        const cities = window.LocationConfig.getCitiesByCountry(formData.location.country);
        citySelect.innerHTML = '<option value="">Select City</option>' + 
          cities.map(city => `<option value="${city}" ${formData.location.city === city ? 'selected' : ''}>${city}</option>`).join('');
        citySelect.disabled = false;
      }
    }
    
    if (formData.location.city && citySelect) {
      citySelect.value = formData.location.city;
    }
    
    if (formData.location.area && areaSelect) {
      areaSelect.value = formData.location.area;
    }
    
    if (formData.location.address && addressInput) {
      addressInput.value = formData.location.address;
    }
    
    if (remoteCheckbox) {
      remoteCheckbox.checked = formData.location.isRemoteAllowed || false;
    }
  }

  // ============================================
  // Clear Model Selection
  // ============================================
  function clearModelSelection() {
    formData.subModel = null;
    formData.model = null;
    // Clear model fields
    if (typeof CollaborationModelFields !== 'undefined') {
      const container = document.getElementById('collaborationModelFields');
      if (container) {
        container.style.display = 'none';
        CollaborationModelFields.renderFields([]);
      }
    }
    // Clear selection in selector
    if (typeof CollaborationModelsSelector !== 'undefined' && typeof CollaborationModelsSelector.setSelectedModels === 'function') {
      isRestoringModel = true;
      CollaborationModelsSelector.setSelectedModels([], true);
      isRestoringModel = false;
    }
    // Re-render wizard to update UI
    renderWizard();
    updateProgressIndicator();
    attachEventListeners();
    // Re-initialize model selector
    if (typeof CollaborationModelsSelector !== 'undefined') {
      setTimeout(() => {
        CollaborationModelsSelector.init(handleModelSelection);
      }, 100);
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.opportunityCreate = {
    init,
    selectIntent,
    updatePaymentMode,
    updateBarterRule,
    updateCashSettlement,
    updateAcknowledgedDifference,
    updateEquityDetails,
    updateProfitSharingDetails,
    updateBasicInfo,
    updateLocation,
    onCountryChange,
    updateCityAreas,
    addServiceItem,
    removeServiceItem,
    updateServiceItem,
    addSkill,
    addSkillFromInput,
    removeSkill,
    nextStep,
    previousStep,
    switchToStep,
    updateProgressIndicator,
    submitOpportunity,
    saveDraft,
    getFormData,
    syncBasicInfoLocationFields,
    clearModelSelection
  };

})();
