/**
 * Opportunity Create Component - Unified Opportunity Creation Wizard
 * Supports REQUEST_SERVICE, OFFER_SERVICE, and BOTH intents
 * Includes Location, Service Items, Payment Terms with Barter Rules
 */

(function() {
  'use strict';

  let currentStep = 0;
  const totalSteps = 5; // Step 0: Intent, Step 1: Model, Step 2: Details, Step 3: Payment, Step 3.5: Location, Step 4: Review
  let formData = {
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
    if (step === 3.5) return 4;
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
    renderWizard();
    updateProgressIndicator();
    attachEventListeners();
    
    // Sync Basic Info location fields after a short delay to ensure DOM is ready
    setTimeout(() => {
      syncBasicInfoLocationFields();
    }, 300);
  }

  // ============================================
  // Render Wizard
  // ============================================
  function renderWizard() {
    const container = document.getElementById('opportunityWizardContainer');
    if (!container) return;

    // Calculate progress percentage based on visible steps (5 total: 0,1,2,3,4)
    const totalVisibleSteps = 5; // Intent, Model, Details, Payment, Review
    let adjustedStepIndex;
    const stepNum = Number(currentStep);
    
    // Map currentStep to display step index (1-5)
    if (stepNum === 0) adjustedStepIndex = 1;
    else if (stepNum === 1) adjustedStepIndex = 2;
    else if (stepNum === 2) adjustedStepIndex = 3;
    else if (stepNum === 3) adjustedStepIndex = 4;
    else if (stepNum === 4) adjustedStepIndex = 5;
    else adjustedStepIndex = Math.min(stepNum + 1, totalVisibleSteps); // Fallback, clamp to max
    
    const progressPercent = (adjustedStepIndex / totalVisibleSteps) * 100;
    const stepNames = ['Intent', 'Model', 'Details', 'Payment', 'Location', 'Review'];
    const stepIcons = ['ph-handshake', 'ph-stack', 'ph-clipboard-text', 'ph-currency-circle-dollar', 'ph-map-pin', 'ph-check-circle'];
    
    // Map currentStep to step name index (handles 3.5 for Location)
    let stepNameIndex;
    if (currentStep === 3.5) {
      stepNameIndex = 4; // Location
    } else if (currentStep === 4) {
      stepNameIndex = 5; // Review
    } else {
      stepNameIndex = Math.floor(currentStep);
    }
    const currentStepName = stepNames[stepNameIndex] || stepNames[0];
    const currentStepIcon = stepIcons[stepNameIndex] || stepIcons[0];

    // Step configuration matching signup style (Location removed from topbar as it's in Basic Information)
    const steps = [
      { num: 0, label: 'Intent', icon: 'ph-handshake' },
      { num: 1, label: 'Model', icon: 'ph-stack' },
      { num: 2, label: 'Details', icon: 'ph-clipboard-text' },
      { num: 3, label: 'Payment', icon: 'ph-currency-circle-dollar' },
      { num: 4, label: 'Review', icon: 'ph-check-circle' }
      // Note: Location (3.5) is integrated into Basic Information section, not shown in topbar
    ];

    let html = `
      <div class="wizard-container">
        <!-- Enhanced Tab Navigation (like signup) -->
        <div class="tab-container" style="margin-bottom: 2rem;">
          <div class="tab-nav" id="opportunityWizardTabs" style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: nowrap; overflow-x: auto;">
            ${steps.map((step, index) => {
              const stepNum = step.num;
              // Handle Location step (3.5) - treat as completed when on Review (4)
              const isActive = stepNum === currentStep || (stepNum === 4 && currentStep === 3.5);
              const isCompleted = (currentStep > stepNum && currentStep !== 3.5) || (currentStep === 4 && stepNum < 4);
              const isFuture = currentStep < stepNum && currentStep !== 3.5;
              
              return `
                <button type="button" 
                        class="tab-nav-item ${isActive ? 'active' : isCompleted ? 'completed' : isFuture ? 'disabled' : ''}" 
                        data-step="${stepNum}" 
                        onclick="${stepNum < currentStep ? `opportunityCreate.switchToStep(${stepNum})` : `return false;`}"
                        style="position: relative; flex: 1; min-width: 0; max-width: 100%; padding: var(--spacing-3) var(--spacing-2); border-radius: 12px; transition: all 0.3s ease; border: 2px solid transparent; ${stepNum > currentStep ? 'cursor: not-allowed; opacity: 0.6;' : ''}"
                        ${stepNum > currentStep ? 'disabled' : ''}
                        title="${stepNum > currentStep ? 'Please use Next button to proceed' : ''}">
                  <div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem; width: 100%;">
                    <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; width: 100%;">
                      <i class="ph ${step.icon}" style="font-size: 1.5rem; flex-shrink: 0; transition: all 0.3s ease;"></i>
                      <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-size: 0.95rem; letter-spacing: 0.01em;">${step.label}</span>
                    </div>
                    ${isCompleted ? `
                      <div style="display: flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--color-success); color: white;">
                        <i class="ph ph-check" style="font-size: 0.875rem;"></i>
                      </div>
                    ` : isActive ? `
                      <div style="width: 100%; height: 3px; background: var(--color-primary); border-radius: 2px; margin-top: 0.25rem;"></div>
                    ` : ''}
                  </div>
                </button>
              `;
            }).join('')}
          </div>
          
          <!-- Progress Bar -->
          <div style="margin-top: 1.5rem; padding: 0 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span id="wizardProgressText" style="font-size: 0.875rem; color: var(--text-secondary); font-weight: 500;">
                ${currentStep === 4 ? 'Step 5 of 5' : `Step ${Math.floor(currentStep) + 1} of ${steps.length}`}
              </span>
              <span id="wizardProgressPercentage" style="font-size: 0.875rem; color: var(--color-primary); font-weight: 600;">
                ${Math.round(progressPercent)}%
              </span>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-secondary); border-radius: 10px; overflow: hidden; box-shadow: inset 0 2px 4px rgba(0,0,0,0.06);">
              <div id="wizardProgressBar" style="height: 100%; width: ${progressPercent}%; background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary-light) 100%); border-radius: 10px; transition: width 0.4s ease; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);"></div>
            </div>
          </div>
        </div>

        <!-- Current Step Header -->
        <div class="wizard-step-header" style="margin: 2rem 0 1.5rem; text-align: center;">
          <h2 class="section-title" style="margin-bottom: 0.5rem; font-size: 1.75rem;">
            <i class="ph ${currentStepIcon}" style="margin-right: 0.5rem; color: var(--color-primary);"></i>
            ${currentStepName}
          </h2>
          <p class="section-description" style="color: var(--text-secondary); font-size: 1rem;">
            ${getStepDescription(currentStep)}
          </p>
        </div>

        <div class="wizard-content">
          ${renderStep()}
        </div>

        <div class="wizard-actions">
          <div style="flex: 1;">
            ${currentStep > 0 ? '<button type="button" class="btn btn-secondary" id="wizardPrevBtn" onclick="opportunityCreate.previousStep()"><i class="ph ph-arrow-left"></i> Previous</button>' : '<div></div>'}
          </div>
          <div style="display: flex; gap: 1rem;">
            ${currentStep < 4 ? `
              <button type="button" class="btn btn-outline" onclick="opportunityCreate.saveDraft()" title="Save as draft">
                <i class="ph ph-floppy-disk"></i> Save Draft
              </button>
              <button type="button" class="btn btn-primary" id="wizardNextBtn" onclick="opportunityCreate.nextStep()">
                Next <i class="ph ph-arrow-right"></i>
              </button>
            ` : `
              <button type="button" class="btn btn-outline" onclick="opportunityCreate.saveDraft()" title="Save as draft">
                <i class="ph ph-floppy-disk"></i> Save Draft
              </button>
                  <button type="button" class="btn btn-success btn-lg" id="wizardSubmitBtn" onclick="opportunityCreate.submitOpportunity()">
                        <i class="ph ph-paper-plane-tilt"></i> Publish Opportunity
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
    
    // Initialize model selector if on step 1
    if (currentStep === 1 && typeof CollaborationModelsSelector !== 'undefined') {
      setTimeout(() => {
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
                console.log('[OpportunityCreate] Restoring selected model:', formData.subModel);
                CollaborationModelsSelector.setSelectedModels([formData.subModel]);
                // Trigger the callback to render fields with existing data
                // Use a small delay to ensure UI is updated
                setTimeout(() => {
                  handleModelSelection([formData.subModel]);
                }, 50);
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
          setTimeout(checkModelsRendered, 100);
        }
      }, 100);
    }
  }

  // ============================================
  // Get Step Description
  // ============================================
  function getStepDescription(step) {
    const descriptions = {
      0: 'Choose whether you want to request services, offer services, or both',
      1: 'Select the collaboration model that best fits your opportunity type',
      2: 'Define service items, skills, and availability details',
      3: 'Set payment terms including cash, barter, or hybrid options',
      3.5: 'Specify the location where the opportunity will be executed',
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
    
    console.log('[OpportunityCreate] Rendering step:', step, 'type:', typeof step);
    
    switch (step) {
      case 0:
        return renderIntentStep();
      case 1:
        return renderModelStep();
      case 2:
        return renderDetailsStep();
      case 3:
        return renderPaymentStep();
      case 3.5:
        return renderLocationStep();
      case 4:
        return renderReviewStep();
      default:
        console.error('[OpportunityCreate] Invalid step value:', step, 'type:', typeof step);
        // Fallback to Review step instead of showing error
        currentStep = 4;
        return renderReviewStep();
    }
  }

  // ============================================
  // Step 0: Intent Selection
  // ============================================
  function renderIntentStep() {
    return `
      <div class="wizard-panel">
        <div class="intent-options" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 2rem; margin-top: 1rem;">
          <div class="intent-card ${formData.intent === 'REQUEST_SERVICE' ? 'selected' : ''}" 
               data-intent="REQUEST_SERVICE"
               onclick="opportunityCreate.selectIntent('REQUEST_SERVICE')">
            <div class="intent-card-header">
              <div class="intent-icon" style="font-size: 4rem; margin-bottom: 1rem; color: ${formData.intent === 'REQUEST_SERVICE' ? 'var(--color-primary)' : 'var(--text-secondary)'}; text-align: center; display: flex; justify-content: center; align-items: center;">
                <i class="ph ph-shopping-cart"></i>
              </div>
              ${formData.intent === 'REQUEST_SERVICE' ? '<div class="intent-badge"><i class="ph ph-check"></i> Selected</div>' : ''}
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: var(--text-primary); text-align: center;">Request Service</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">I need someone to provide a service for me</p>
            <div class="intent-features" style="text-align: left; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Post your service requirements</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Receive proposals from providers</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Choose the best match</span>
              </div>
            </div>
          </div>
          
          <div class="intent-card ${formData.intent === 'OFFER_SERVICE' ? 'selected' : ''}" 
               data-intent="OFFER_SERVICE"
               onclick="opportunityCreate.selectIntent('OFFER_SERVICE')">
            <div class="intent-card-header">
              <div class="intent-icon" style="font-size: 4rem; margin-bottom: 1rem; color: ${formData.intent === 'OFFER_SERVICE' ? 'var(--color-primary)' : 'var(--text-secondary)'}; text-align: center; display: flex; justify-content: center; align-items: center;">
                <i class="ph ph-storefront"></i>
              </div>
              ${formData.intent === 'OFFER_SERVICE' ? '<div class="intent-badge"><i class="ph ph-check"></i> Selected</div>' : ''}
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: var(--text-primary); text-align: center;">Offer Service</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">I want to offer my services to others</p>
            <div class="intent-features" style="text-align: left; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Showcase your services</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Get discovered by buyers</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Expand your business</span>
              </div>
            </div>
          </div>
          
          <div class="intent-card ${formData.intent === 'BOTH' ? 'selected' : ''}" 
               data-intent="BOTH"
               onclick="opportunityCreate.selectIntent('BOTH')">
            <div class="intent-card-header">
              <div class="intent-icon" style="font-size: 4rem; margin-bottom: 1rem; color: ${formData.intent === 'BOTH' ? 'var(--color-primary)' : 'var(--text-secondary)'}; text-align: center; display: flex; justify-content: center; align-items: center;">
                <i class="ph ph-handshake"></i>
              </div>
              ${formData.intent === 'BOTH' ? '<div class="intent-badge"><i class="ph ph-check"></i> Selected</div>' : ''}
            </div>
            <h3 style="font-size: 1.5rem; margin-bottom: 0.75rem; color: var(--text-primary); text-align: center;">Both</h3>
            <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">I want to both request and offer services</p>
            <div class="intent-features" style="text-align: left; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Maximum flexibility</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Request and offer simultaneously</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                <i class="ph ph-check-circle" style="color: var(--color-success);"></i>
                <span>Full marketplace access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 1: Model/Sub-model Selection
  // ============================================
  function renderModelStep() {
    return `
      <div class="wizard-panel">
        <h2 class="section-title">Select Collaboration Model</h2>
        <p class="section-description">Choose the collaboration model that best fits your needs</p>
        
        <div id="collaborationModelsGrid" class="collaboration-models-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-top: 2rem;">
          <!-- Models will be loaded by CollaborationModelsSelector -->
        </div>
        
        <div id="collaborationModelFields" class="collaboration-model-fields" style="margin-top: 2rem;">
          <!-- Dynamic fields will be rendered here -->
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 2: Details (Service Items + Skills)
  // ============================================
  function renderDetailsStep() {
    return `
      <div class="wizard-panel">
        <h2 class="section-title">Service Details</h2>
        
        <div class="form-section" style="margin-bottom: 2rem;">
          <h3 class="subsection-title">Service Items</h3>
          <p class="form-text">Define the services you're requesting or offering</p>
          
          <div id="serviceItemsContainer">
            ${renderServiceItems()}
          </div>
          
          <button type="button" class="btn btn-secondary btn-sm" onclick="opportunityCreate.addServiceItem()" style="margin-top: 1rem;">
            <i class="ph ph-plus"></i> Add Service Item
          </button>
        </div>
        
        <div class="form-section">
          <h3 class="subsection-title">Required Skills</h3>
          <div class="form-group">
            <label for="skillsInput" class="form-label">Required Skills *</label>
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
        
        ${formData.intent === 'OFFER_SERVICE' || formData.intent === 'BOTH' ? `
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
  // Step 3: Payment Terms
  // ============================================
  function renderPaymentStep() {
    return `
      <div class="wizard-panel">
        <h2 class="section-title">Payment Terms</h2>
        
        <div class="form-section">
          <div class="form-group">
            <label class="form-label">Payment Mode *</label>
            <div class="radio-group" style="display: flex; gap: 1.5rem; margin-top: 0.5rem;">
              <label class="radio-option">
                <input type="radio" name="paymentMode" value="CASH" ${formData.paymentTerms.mode === 'CASH' ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('CASH')">
                <span>Cash</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="paymentMode" value="BARTER" ${formData.paymentTerms.mode === 'BARTER' ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('BARTER')">
                <span>Barter</span>
              </label>
              <label class="radio-option">
                <input type="radio" name="paymentMode" value="HYBRID" ${formData.paymentTerms.mode === 'HYBRID' ? 'checked' : ''} 
                       onchange="opportunityCreate.updatePaymentMode('HYBRID')">
                <span>Hybrid</span>
              </label>
            </div>
          </div>
          
          ${formData.paymentTerms.mode === 'BARTER' || formData.paymentTerms.mode === 'HYBRID' ? `
            <div class="form-group" style="margin-top: 1.5rem;">
              <label for="barterRule" class="form-label">Barter Settlement Rule *</label>
              <select id="barterRule" class="form-control" onchange="opportunityCreate.updateBarterRule(this.value)">
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
            </div>
            
            ${formData.paymentTerms.mode === 'HYBRID' || formData.paymentTerms.barterRule === 'ALLOW_DIFFERENCE_CASH' ? `
              <div class="form-group" style="margin-top: 1rem;">
                <label for="cashSettlement" class="form-label">Cash Settlement Amount (SAR)</label>
                <input type="number" id="cashSettlement" class="form-control" 
                       value="${formData.paymentTerms.cashSettlement || 0}" 
                       min="0" step="0.01"
                       onchange="opportunityCreate.updateCashSettlement(this.value)">
                <small class="form-text">Additional cash payment to balance value difference</small>
              </div>
            ` : ''}
            
            ${formData.paymentTerms.barterRule === 'ACCEPT_AS_IS' ? `
              <div class="form-group" style="margin-top: 1rem;">
                <label class="checkbox-label">
                  <input type="checkbox" id="acknowledgedDifference" 
                         ${formData.paymentTerms.acknowledgedDifference ? 'checked' : ''}
                         onchange="opportunityCreate.updateAcknowledgedDifference(this.checked)">
                  <span>I acknowledge and accept the value difference</span>
                </label>
              </div>
            ` : ''}
          ` : ''}
        </div>
      </div>
    `;
  }

  // ============================================
  // Step 3.5: Location
  // ============================================
  function renderLocationStep() {
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
    const title = document.getElementById('opportunityTitle')?.value || 'Untitled Opportunity';
    const description = document.getElementById('opportunityDescription')?.value || '';
    
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
        'OFFER_SERVICE': 'Offer Service',
        'BOTH': 'Both Request & Offer'
      };
      return labels[intent] || intent;
    };

    const getPaymentModeLabel = (mode) => {
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
            <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('opportunityTitle')?.scrollIntoView({behavior: 'smooth'});">
              <i class="ph ph-pencil"></i> Edit Basic Info
            </button>
            <button type="button" class="btn btn-sm btn-outline" onclick="document.getElementById('basicInfoCountry')?.scrollIntoView({behavior: 'smooth'});">
              <i class="ph ph-map-pin"></i> Edit Location
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
          <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(1);" style="margin-top: 0.75rem;">
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
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(2);" style="margin-top: 1rem;">
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
            <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(2);" style="margin-top: 0.75rem;">
              <i class="ph ph-pencil"></i> Edit Skills
            </button>
          ` : '<div style="color: var(--text-secondary); padding: 1rem; background: var(--bg-secondary); border-radius: 8px; text-align: center;">No skills specified</div>'}
        </div>
        
        <div class="review-section">
          <h3><i class="ph ph-currency-circle-dollar"></i> Payment Terms</h3>
          <div style="background: var(--bg-secondary); padding: 1.5rem; border-radius: 8px; margin-top: 1rem;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
              <div>
                <p style="margin-bottom: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);">Payment Mode</p>
                <p><span class="badge badge-success" style="font-size: 0.875rem; padding: 0.5rem 0.75rem;">${getPaymentModeLabel(formData.paymentTerms.mode)}</span></p>
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
          <button type="button" class="btn btn-sm btn-outline" onclick="opportunityCreate.switchToStep(3.5);" style="margin-top: 0.5rem;">
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
    } else if (!formData.paymentTerms.barterRule) {
      formData.paymentTerms.barterRule = 'ALLOW_DIFFERENCE_CASH';
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
    
    // Before validation, collect model field data from DOM if on Model step
    if (currentStep === 1 && typeof CollaborationModelFields !== 'undefined' && formData.subModel) {
      collectModelFieldData();
    }
    
    if (!validateStep()) {
      console.log('[OpportunityCreate] Validation failed, staying on step:', currentStep);
      return;
    }
    
    // Explicit step navigation to ensure correct flow:
    // Step 0 → Step 1 (Intent → Model)
    // Step 1 → Step 2 (Model → Details)
    // Step 2 → Step 3 (Details → Payment)
    // Step 3 → Step 4 (Payment → Review)
    if (currentStep === 0) {
      currentStep = 1; // Step 0 → Step 1 (Intent → Model)
    } else if (currentStep === 1) {
      currentStep = 2; // Step 1 → Step 2 (Model → Details)
    } else if (currentStep === 2) {
      currentStep = 3; // Step 2 → Step 3 (Details → Payment)
    } else if (currentStep === 3) {
      currentStep = 4; // Step 3 → Step 4 (Payment → Review)
    } else {
      // Fallback: increment (should not reach here in normal flow)
      console.warn('[OpportunityCreate] Unexpected step transition from:', currentStep);
      currentStep++;
    }
    
    console.log('[OpportunityCreate] Moving to step:', currentStep);
    
    renderWizard();
    updateProgressIndicator();
    attachEventListeners(); // Re-attach listeners after re-render
    
    // Initialize model selector if on step 1
    if (currentStep === 1 && typeof CollaborationModelsSelector !== 'undefined') {
      CollaborationModelsSelector.init(handleModelSelection);
      // Restore selected model state if we have one
      if (formData.subModel) {
        setTimeout(() => {
          if (typeof CollaborationModelsSelector.setSelectedModels === 'function') {
            CollaborationModelsSelector.setSelectedModels([formData.subModel]);
            // Trigger the callback to render fields
            handleModelSelection([formData.subModel]);
          }
        }, 200);
      }
    }
  }

  function previousStep() {
    console.log('[OpportunityCreate] Previous clicked, current step:', currentStep);
    
    // Backward navigation transitions:
    // Step 4 → Step 3 (Review → Payment)
    // Step 3 → Step 2 (Payment → Details)
    // Step 2 → Step 1 (Details → Model)
    // Step 1 → Step 0 (Model → Intent)
    if (currentStep === 4) {
      currentStep = 3; // Step 4 → Step 3 (Review → Payment)
    } else if (currentStep === 3) {
      currentStep = 2; // Step 3 → Step 2 (Payment → Details)
    } else if (currentStep === 2) {
      currentStep = 1; // Step 2 → Step 1 (Details → Model)
    } else if (currentStep === 1) {
      currentStep = 0; // Step 1 → Step 0 (Model → Intent)
    } else {
      // Already at step 0, can't go back further
      console.log('[OpportunityCreate] Already at first step');
      return;
    }
    
    renderWizard();
    updateProgressIndicator();
    attachEventListeners(); // Re-attach listeners after re-render
    
    // Initialize model selector if going back to step 1
    if (currentStep === 1 && typeof CollaborationModelsSelector !== 'undefined') {
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
              CollaborationModelsSelector.setSelectedModels([formData.subModel]);
              // Trigger the callback to render fields with existing data
              // Use a small delay to ensure UI is updated
              setTimeout(() => {
                handleModelSelection([formData.subModel]);
              }, 50);
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
    // Skip Location step (3.5) - redirect to Review (4) if trying to access Location
    if (step === 3.5) {
      step = 4; // Redirect Location step to Review
    }
    
    // Only allow switching to previous steps (going back) - prevent forward navigation via tabs
    // Forward navigation must be done via Next button only
    if (step < currentStep) {
      // Allow going back without validation
      currentStep = step;
      renderWizard();
      updateProgressIndicator();
      attachEventListeners(); // Re-attach listeners after re-render
      
      // Initialize model selector if going back to step 1
      if (currentStep === 1 && typeof CollaborationModelsSelector !== 'undefined') {
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
                  CollaborationModelsSelector.setSelectedModels([formData.subModel]);
                  setTimeout(() => {
                    handleModelSelection([formData.subModel]);
                  }, 50);
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
    // Update tab navigation (enhanced design without step numbers)
    document.querySelectorAll('#opportunityWizardTabs .tab-nav-item').forEach((tabEl) => {
      const tabStep = parseFloat(tabEl.getAttribute('data-step'));
      const iconEl = tabEl.querySelector('i.ph');
      const labelEl = tabEl.querySelector('span');
      const progressLine = tabEl.querySelector('div[style*="height: 3px"]');
      const checkmarkEl = tabEl.querySelector('div[style*="border-radius: 50%"]');
      
      // Handle Location step (3.5) - treat as completed when on Review (4)
      // Handle step states - Location (3.5) is skipped, so Payment (3) directly leads to Review (4)
      const isActive = tabStep === currentStep;
      const isCompleted = currentStep > tabStep;
      const isFuture = currentStep < tabStep;
      
      if (isActive) {
        // Active step
        tabEl.classList.add('active');
        tabEl.classList.remove('completed', 'disabled');
        tabEl.style.background = 'var(--color-primary)';
        tabEl.style.color = 'white';
        tabEl.style.borderColor = 'var(--color-primary)';
        tabEl.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.25)';
        if (iconEl) iconEl.style.color = 'white';
        if (labelEl) labelEl.style.color = 'white';
        if (progressLine) progressLine.style.display = 'block';
        if (checkmarkEl) checkmarkEl.style.display = 'none';
      } else if (isCompleted) {
        // Completed step
        tabEl.classList.remove('active', 'disabled');
        tabEl.classList.add('completed');
        tabEl.style.background = 'var(--bg-primary)';
        tabEl.style.color = 'var(--text-primary)';
        tabEl.style.borderColor = 'var(--color-success)';
        tabEl.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.15)';
        if (iconEl) iconEl.style.color = 'var(--color-success)';
        if (labelEl) labelEl.style.color = 'var(--text-primary)';
        if (progressLine) progressLine.style.display = 'none';
        if (checkmarkEl) checkmarkEl.style.display = 'flex';
      } else {
        // Future step
        tabEl.classList.remove('active', 'completed');
        tabEl.classList.add('disabled');
        tabEl.style.background = 'var(--bg-secondary)';
        tabEl.style.color = 'var(--text-secondary)';
        tabEl.style.borderColor = 'var(--border-color)';
        tabEl.style.boxShadow = 'none';
        tabEl.style.opacity = '0.6';
        if (iconEl) iconEl.style.color = 'var(--text-secondary)';
        if (labelEl) labelEl.style.color = 'var(--text-secondary)';
        if (progressLine) progressLine.style.display = 'none';
        if (checkmarkEl) checkmarkEl.style.display = 'none';
      }
    });
    
    // Update progress bar and text
    const progressBar = document.getElementById('wizardProgressBar');
    const progressText = document.getElementById('wizardProgressText');
    const progressPercentage = document.getElementById('wizardProgressPercentage');
    
    // Calculate percentage based on visible steps (5 total: 0,1,2,3,4)
    const totalVisibleSteps = 5; // Intent, Model, Details, Payment, Review
    let adjustedStepIndex;
    const stepNum = Number(currentStep);
    
    // Map currentStep to display step index (1-5)
    if (stepNum === 0) adjustedStepIndex = 1;
    else if (stepNum === 1) adjustedStepIndex = 2;
    else if (stepNum === 2) adjustedStepIndex = 3;
    else if (stepNum === 3) adjustedStepIndex = 4;
    else if (stepNum === 4) adjustedStepIndex = 5;
    else adjustedStepIndex = Math.min(stepNum + 1, totalVisibleSteps); // Fallback, clamp to max
    
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
        if (!formData.intent) {
          errorMessage = 'Please select an intent to continue';
          isValid = false;
        }
        break;
      case 1:
        if (!formData.subModel) {
          errorMessage = 'Please select a collaboration model';
          isValid = false;
        } else {
          // First, collect current field values from DOM to ensure we have latest data
          const container = document.getElementById('collaborationModelFields');
          if (container && formData.subModel) {
            const modelId = formData.subModel;
            const collectedData = {};
            const rangeFields = {};
            
            // Read field values from DOM and build modelData object
            document.querySelectorAll('.collaboration-field').forEach(field => {
              const fieldModelId = field.getAttribute('data-model-id');
              const attrName = field.getAttribute('data-attr-name');
              
              if (fieldModelId === modelId && attrName) {
                // Handle currency range fields
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
            
            // Merge range fields
            Object.keys(rangeFields).forEach(baseName => {
              collectedData[baseName] = rangeFields[baseName];
            });
            
          // Update modelData before validation
          if (typeof CollaborationModelFields !== 'undefined' && typeof CollaborationModelFields.setModelData === 'function') {
            const existingData = CollaborationModelFields.getModelData(modelId) || {};
            CollaborationModelFields.setModelData(modelId, { ...existingData, ...collectedData });
          }
        }
        
        // Note: Model-specific fields are optional - no required field validation
        }
        break;
      case 2:
        // Allow proceeding even without service items (no confirmation required)
        // Service items are optional and can be added later
        break;
      case 3:
        // Validate payment terms
        if (!formData.paymentTerms.mode) {
          errorMessage = 'Please select a payment mode';
          isValid = false;
        } else if ((formData.paymentTerms.mode === 'BARTER' || formData.paymentTerms.mode === 'HYBRID') && !formData.paymentTerms.barterRule) {
          errorMessage = 'Please select a barter settlement rule';
          isValid = false;
        }
        
        // Also validate location (from Basic Information section) since Location step is skipped
        if (isValid && !formData.location.country) {
          errorMessage = 'Please select a country in Basic Information section';
          isValid = false;
        } else if (isValid && typeof window.LocationConfig !== 'undefined' && 
                   !window.LocationConfig.isCountryAllowed(formData.location.country)) {
          errorMessage = 'Selected country is not allowed';
          isValid = false;
        }
        
        if (isValid && !formData.location.city) {
          errorMessage = 'Please select a city in Basic Information section';
          isValid = false;
        } else if (isValid && typeof window.LocationConfig !== 'undefined' && 
                   !window.LocationConfig.isCityInCountry(formData.location.country, formData.location.city)) {
          errorMessage = 'Selected city is not available in the selected country';
          isValid = false;
        }
        
        if (isValid && typeof formData.location.isRemoteAllowed !== 'boolean') {
          formData.location.isRemoteAllowed = false; // Default to false
        }
        break;
      case 3.5:
        // Validate country
        if (!formData.location.country) {
          errorMessage = 'Please select a country';
          isValid = false;
        } else if (typeof window.LocationConfig !== 'undefined' && 
                   !window.LocationConfig.isCountryAllowed(formData.location.country)) {
          errorMessage = 'Selected country is not allowed';
          isValid = false;
        }
        
        // Validate city
        if (isValid && !formData.location.city) {
          errorMessage = 'Please select a city';
          isValid = false;
        } else if (isValid && typeof window.LocationConfig !== 'undefined' && 
                   !window.LocationConfig.isCityInCountry(formData.location.country, formData.location.city)) {
          errorMessage = 'Selected city is not available in the selected country';
          isValid = false;
        }
        
        // Validate isRemoteAllowed is explicitly set
        if (isValid && typeof formData.location.isRemoteAllowed !== 'boolean') {
          formData.location.isRemoteAllowed = false; // Default to false
        }
        
        // Validate geo coordinates if provided
        if (isValid && formData.location.geo) {
          const lat = formData.location.geo.lat;
          const lng = formData.location.geo.lng;
          if ((lat !== null && lat !== undefined) || (lng !== null && lng !== undefined)) {
            if (lat === null || lat === undefined || lng === null || lng === undefined) {
              errorMessage = 'Both latitude and longitude must be provided together';
              isValid = false;
            } else if (lat < -90 || lat > 90) {
              errorMessage = 'Latitude must be between -90 and 90';
              isValid = false;
            } else if (lng < -180 || lng > 180) {
              errorMessage = 'Longitude must be between -180 and 180';
              isValid = false;
            }
          }
        }
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
  function handleModelSelection(selectedModels) {
    console.log('[OpportunityCreate] handleModelSelection called, selectedModels:', selectedModels, 'currentStep:', currentStep);
    
    if (selectedModels && selectedModels.length > 0) {
      const firstModel = selectedModels[0];
      formData.subModel = firstModel;
      formData.model = firstModel.split('.')[0];
      
      console.log('[OpportunityCreate] Model saved:', firstModel, 'formData.subModel:', formData.subModel);

      // Render model-specific fields on the Model step (don't auto-advance, stay on Model step)
      // Only render fields if we're on the Model step
      if (currentStep === 1 && typeof CollaborationModelFields !== 'undefined') {
        // Defensive check: ensure container exists before rendering
        const container = document.getElementById('collaborationModelFields');
        if (!container) {
          console.warn('[OpportunityCreate] Container #collaborationModelFields not found, retrying...');
          // Retry after a short delay with exponential backoff
          let retryCount = 0;
          const maxRetries = 5;
          const retryDelay = 100;
          
          const retryRender = () => {
            retryCount++;
            const retryContainer = document.getElementById('collaborationModelFields');
            if (retryContainer) {
              console.log('[OpportunityCreate] Container found on retry', retryCount);
              renderModelFieldsWithRestore(selectedModels);
            } else if (retryCount < maxRetries) {
              setTimeout(retryRender, retryDelay * retryCount);
            } else {
              console.error('[OpportunityCreate] Failed to find container after', maxRetries, 'retries');
            }
          };
          setTimeout(retryRender, retryDelay);
          return;
        }
        
        renderModelFieldsWithRestore(selectedModels);
      }
    } else {
      console.log('[OpportunityCreate] No models selected');
      // Clear model fields if no model selected
      if (currentStep === 1 && typeof CollaborationModelFields !== 'undefined') {
        const container = document.getElementById('collaborationModelFields');
        if (container) {
          CollaborationModelFields.renderFields([]);
        }
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
      paymentTerms: formData.paymentTerms,
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
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
        alert('Opportunities service not available');
        return;
      }

      const opportunity = PMTwinData.Opportunities.create(opportunityData);
      
      if (opportunity) {
        alert('Opportunity created successfully!');
        // Redirect to opportunity view
        if (typeof window.NavRoutes !== 'undefined') {
          const viewUrl = window.NavRoutes.getRouteWithQuery('opportunities', { id: opportunity.id });
          window.location.href = viewUrl;
        } else {
          window.location.href = `/POC/pages/opportunities/index.html?id=${opportunity.id}`;
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
    const title = document.getElementById('opportunityTitle')?.value || 'Untitled Opportunity';
    const description = document.getElementById('opportunityDescription')?.value || '';
    
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
  // Public API
  // ============================================
  window.opportunityCreate = {
    init,
    selectIntent,
    updatePaymentMode,
    updateBarterRule,
    updateCashSettlement,
    updateAcknowledgedDifference,
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
    syncBasicInfoLocationFields
  };

})();
