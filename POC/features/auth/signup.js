/**
 * Signup Component - Multi-Step Onboarding Wizard
 * Handles step-by-step registration flow according to User Authentication requirements
 */

(function() {
  'use strict';

  let currentStep = 1;
  const totalSteps = 4;
  let formData = {
    documents: {},
    emailVerified: false,
    mobileVerified: false,
    tempUserId: null
  };
  let registrationResult = null;

  // Sub-types for each user type (aligned with golden seed data)
  const subTypes = {
    beneficiary: [
      { value: 'government_entity', label: 'Government Entity' },
      { value: 'development_authority', label: 'Development Authority' },
      { value: 'real_estate_company', label: 'Real Estate Company' },
      { value: 'project_owner', label: 'Project Owner' },
      { value: 'other', label: 'Other Beneficiary' }
    ],
    vendor: [
      { value: 'general_contractor', label: 'General Contractor' },
      { value: 'infrastructure_contractor', label: 'Infrastructure Contractor' },
      { value: 'construction_company', label: 'Construction Company' },
      { value: 'mega_project_contractor', label: 'MegaProject Contractor' },
      { value: 'other', label: 'Other Vendor' }
    ],
    skill_service_provider: [
      { value: 'bim_services', label: 'BIM Services' },
      { value: 'qa_qc', label: 'QA/QC Services' },
      { value: 'project_planning', label: 'Project Planning & Scheduling' },
      { value: 'engineering_services', label: 'Engineering Services' },
      { value: 'other', label: 'Other Service Provider' }
    ],
    sub_contractor: [
      { value: 'mep', label: 'MEP (Mechanical, Electrical, Plumbing)' },
      { value: 'steel_fabrication', label: 'Steel Fabrication' },
      { value: 'electrical', label: 'Electrical' },
      { value: 'plumbing', label: 'Plumbing' },
      { value: 'hvac', label: 'HVAC' },
      { value: 'other', label: 'Other Trade' }
    ],
    consultant: [
      { value: 'sustainability', label: 'Sustainability Consultant' },
      { value: 'leed', label: 'LEED Certification' },
      { value: 'environmental', label: 'Environmental Compliance' },
      { value: 'energy_efficiency', label: 'Energy Efficiency' },
      { value: 'other', label: 'Other Consultant' }
    ]
  };

  function init(params) {
    // Initialize step 1
    updateProgressIndicator();
    setupUserTypeSelection();
    setupSubTypeSelection();
    setupFileUploads();
    setupPasswordStrength();
    initializeLocationDropdowns();
    
    // Initialize tab states
    setTimeout(() => {
      updateProgressIndicator();
    }, 100);
  }

  // ============================================
  // Step Navigation
  // ============================================

  function nextStep() {
    if (!validateCurrentStep()) {
      return false;
    }

    if (currentStep < totalSteps) {
      // Save current step data
      saveStepData();
      
      // Reset progress bar to 0% before moving to next step
      const progressBar = document.getElementById('progressBar');
      const progressPercentage = document.getElementById('progressPercentage');
      if (progressBar) {
        progressBar.style.width = '0%';
      }
      if (progressPercentage) {
        progressPercentage.textContent = '0%';
      }
      
      // Move to next step
      currentStep++;
      showStep(currentStep);
      
      // Update progress indicator with animation after a brief delay
      setTimeout(() => {
        updateProgressIndicator();
      }, 50);

      // Special handling for step 4 (Review & Submit)
      if (currentStep === 4) {
        // Registration already handled in Step 2 during verification
        // Just show review page
      }
    }
  }

  function prevStep() {
    if (currentStep > 1) {
      currentStep--;
      showStep(currentStep);
      updateProgressIndicator();
    }
  }

  function switchToStep(step) {
    // Only allow switching to previous steps or if current step is validated
    if (step < currentStep) {
      // Allow going back without validation
      currentStep = step;
      showStep(currentStep);
      updateProgressIndicator();
    } else if (step === currentStep) {
      // Already on this step
      return;
    } else if (step === currentStep + 1) {
      // Moving forward - validate first
      if (validateCurrentStep()) {
        saveStepData();
        currentStep = step;
        showStep(currentStep);
        updateProgressIndicator();
      }
    } else {
      // Can't skip steps
      showMessage('Please complete the current step before proceeding', 'error');
      return false;
    }
    return true;
  }

  function showStep(step) {
    // Hide all steps
    document.querySelectorAll('.onboarding-step').forEach(stepEl => {
      stepEl.style.display = 'none';
    });

    // Show current step
    const stepEl = document.getElementById(`step${step}`);
    if (stepEl) {
      stepEl.style.display = 'block';
    }

    // Restore location selections if returning to step 2
    if (step === 2 && formData.location) {
      setTimeout(() => restoreLocationSelections(), 100);
    }

    // Update verification status display in step 4
    if (step === 4) {
      updateVerificationStatusDisplay();
    }
  }

  function updateVerificationStatusDisplay() {
    const statusDiv = document.getElementById('verificationStatusDisplay');
    const warningDiv = document.getElementById('verificationWarning');
    
    if (!statusDiv) return;

    let html = '';
    
    // Email verification status
    html += `
      <span class="badge badge-${formData.emailVerified ? 'success' : 'warning'}">
        <i class="ph ph-${formData.emailVerified ? 'check-circle' : 'clock'}"></i> 
        Email ${formData.emailVerified ? 'Verified' : 'Pending'}
      </span>
    `;
    
    // Mobile verification status (if mobile provided)
    if (formData.mobile) {
      html += `
        <span class="badge badge-${formData.mobileVerified ? 'success' : 'warning'}">
          <i class="ph ph-${formData.mobileVerified ? 'check-circle' : 'clock'}"></i> 
          Mobile ${formData.mobileVerified ? 'Verified' : 'Pending'}
        </span>
      `;
    }
    
    statusDiv.innerHTML = html;
    
    // Show warning if not all verified
    if (warningDiv) {
      const userType = document.querySelector('input[name="userType"]:checked')?.value;
      const needsMobileVerification = userType === 'entity' && formData.mobile && !formData.mobileVerified;
      
      if (!formData.emailVerified || needsMobileVerification) {
        warningDiv.style.display = 'block';
      } else {
        warningDiv.style.display = 'none';
      }
    }
  }

  async function restoreLocationSelections() {
    if (!formData.location || !window.LocationService) return;

    const countrySelect = document.getElementById('signupCountry');
    const regionSelect = document.getElementById('signupRegion');
    const citySelect = document.getElementById('signupCity');

    if (!countrySelect || !regionSelect || !citySelect) return;

    // Restore country
    if (formData.location.countryCode) {
      countrySelect.value = formData.location.countryCode;
      await onCountryChange();
      
      // Restore region
      if (formData.location.regionCode) {
        regionSelect.value = formData.location.regionCode;
        await onRegionChange();
        
        // Restore city
        if (formData.location.city) {
          citySelect.value = formData.location.city;
        }
      }
    } else if (formData.location.country) {
      // Try to find country by name
      const countries = await LocationService.getCountries();
      const country = countries.find(c => c.name === formData.location.country);
      if (country) {
        countrySelect.value = country.code;
        await onCountryChange();
        
        // Try to restore region
        if (formData.location.region) {
          const regions = await LocationService.getRegions(country.code);
          const region = regions.find(r => r.name === formData.location.region);
          if (region) {
            regionSelect.value = region.code;
            await onRegionChange();
            
            // Restore city
            if (formData.location.city) {
              citySelect.value = formData.location.city;
            }
          }
        }
      }
    }
  }

  // ============================================
  // Location Management
  // ============================================

  async function initializeLocationDropdowns() {
    if (!window.LocationService) {
      console.warn('[Signup] LocationService not available');
      return;
    }

    const countrySelect = document.getElementById('signupCountry');
    const regionSelect = document.getElementById('signupRegion');
    const citySelect = document.getElementById('signupCity');

    if (!countrySelect || !regionSelect || !citySelect) return;

    try {
      // Load countries
      const countries = await LocationService.getCountries();
      countrySelect.innerHTML = '<option value="">Select Country</option>';
      countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country.code;
        option.textContent = country.name;
        countrySelect.appendChild(option);
      });
    } catch (error) {
      console.error('[Signup] Error initializing location dropdowns:', error);
    }
  }

  async function onCountryChange() {
    const countrySelect = document.getElementById('signupCountry');
    const regionSelect = document.getElementById('signupRegion');
    const citySelect = document.getElementById('signupCity');

    if (!countrySelect || !regionSelect || !citySelect) return;

    const countryCode = countrySelect.value;

    // Clear region and city
    regionSelect.innerHTML = '<option value="">Select Region</option>';
    citySelect.innerHTML = '<option value="">Select City</option>';

    if (!countryCode || !window.LocationService) return;

    try {
      const regions = await LocationService.getRegions(countryCode);
      regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.code;
        option.textContent = region.name;
        regionSelect.appendChild(option);
      });
    } catch (error) {
      console.error('[Signup] Error loading regions:', error);
    }
  }

  async function onRegionChange() {
    const countrySelect = document.getElementById('signupCountry');
    const regionSelect = document.getElementById('signupRegion');
    const citySelect = document.getElementById('signupCity');

    if (!countrySelect || !regionSelect || !citySelect) return;

    const countryCode = countrySelect.value;
    const regionCode = regionSelect.value;

    // Clear city
    citySelect.innerHTML = '<option value="">Select City</option>';

    if (!countryCode || !regionCode || !window.LocationService) return;

    try {
      const cities = await LocationService.getCities(countryCode, regionCode);
      cities.forEach(city => {
        const option = document.createElement('option');
        option.value = city;
        option.textContent = city;
        citySelect.appendChild(option);
      });
    } catch (error) {
      console.error('[Signup] Error loading cities:', error);
    }
  }

  function updateProgressIndicator() {
    // Update tab navigation
    document.querySelectorAll('.tab-nav-item').forEach((tabEl) => {
      const tabStep = parseInt(tabEl.getAttribute('data-step'));
      const stepNumber = tabEl.querySelector('.tab-step-number');
      const completionIndicator = tabEl.querySelector('.tab-completion-indicator');
      
      if (tabStep === currentStep) {
        // Active step
        tabEl.classList.add('active');
        tabEl.classList.remove('completed', 'disabled');
        if (stepNumber) {
          stepNumber.style.background = 'rgba(255, 255, 255, 0.2)';
          stepNumber.style.color = 'white';
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'none';
        }
      } else if (tabStep < currentStep) {
        // Completed step
        tabEl.classList.remove('active', 'disabled');
        tabEl.classList.add('completed');
        if (stepNumber) {
          stepNumber.style.background = 'var(--color-success)';
          stepNumber.style.color = 'white';
          stepNumber.innerHTML = '<i class="ph ph-check" style="font-size: 0.9rem;"></i>';
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'block';
          completionIndicator.innerHTML = '<i class="ph ph-check" style="font-size: 1.1rem; color: var(--color-success);"></i>';
        }
      } else {
        // Future step
        tabEl.classList.remove('active', 'completed');
        tabEl.classList.add('disabled');
        if (stepNumber) {
          stepNumber.style.background = 'rgba(0, 0, 0, 0.05)';
          stepNumber.style.color = 'var(--color-gray-600)';
          stepNumber.innerHTML = tabStep.toString();
        }
        if (completionIndicator) {
          completionIndicator.style.display = 'none';
        }
      }
    });
    
    // Update progress bar and text
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const progressPercentage = document.getElementById('progressPercentage');
    
    const percentage = (currentStep / totalSteps) * 100;
    
    if (progressBar) {
      progressBar.style.width = percentage + '%';
    }
    
    if (progressText) {
      progressText.textContent = `Step ${currentStep} of ${totalSteps}`;
    }
    
    if (progressPercentage) {
      progressPercentage.textContent = Math.round(percentage) + '%';
    }
  }

  // ============================================
  // Step Validation
  // ============================================

  function validateCurrentStep() {
    switch (currentStep) {
      case 1:
        return validateStep1();
      case 2:
        return validateStep2();
      case 3:
        return validateStep3();
      case 4:
        return validateStep4();
      default:
        return true;
    }
  }

  function validateStep1() {
    const userType = document.querySelector('input[name="userType"]:checked');
    if (!userType) {
      showMessage('Please select a user type', 'error');
      return false;
    }
    
    // Validate sub-type selection
    const subTypeSelect = document.getElementById('signupSubType');
    if (subTypeSelect && subTypeSelect.offsetParent !== null) { // Check if visible
      const subType = subTypeSelect.value;
      if (!subType) {
        showMessage('Please select a sub-type', 'error');
        return false;
      }
    }
    
    return true;
  }

  function validateStep2() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
      // Validate role-specific required fields
      const companyName = document.getElementById('signupCompanyName')?.value.trim();
      if (!companyName) {
        showMessage('Please enter company/organization name', 'error');
        return false;
      }
      
      if (userType === 'sub_contractor') {
        const trade = document.getElementById('signupTrade')?.value.trim();
        if (!trade) {
          showMessage('Please enter your trade/specialty', 'error');
          return false;
        }
      } else if (userType === 'consultant') {
        const expertise = document.getElementById('signupExpertise')?.value.trim();
        if (!expertise) {
          showMessage('Please enter your expertise areas', 'error');
          return false;
        }
      }

    const email = document.getElementById('signupEmail').value.trim();
    if (!email || !isValidEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }

    // Require email verification
    if (!formData.emailVerified) {
      showMessage('Please verify your email address before proceeding', 'error');
      return false;
    }

    // Require mobile verification for certain roles
    const requiresMobile = ['beneficiary', 'vendor', 'skill_service_provider', 'sub_contractor'].includes(userType);
    if (requiresMobile) {
      const mobile = document.getElementById('signupMobile').value.trim();
      if (!mobile) {
        showMessage('Mobile number is required', 'error');
        return false;
      }
      // Require mobile verification
      if (!formData.mobileVerified) {
        showMessage('Please verify your mobile number before proceeding', 'error');
        return false;
      }
    }

    const password = document.getElementById('signupPassword').value;
    if (password.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return false;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(password)) {
      showMessage('Password must contain uppercase, lowercase, and number', 'error');
      return false;
    }

    const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
    if (password !== passwordConfirm) {
      showMessage('Passwords do not match', 'error');
      return false;
    }

    // Validate location (country is required)
    const country = document.getElementById('signupCountry')?.value;
    if (!country) {
      showMessage('Please select your country', 'error');
      return false;
    }

    return true;
  }

  function validateStep3() {
    // Validate documents based on user type
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    if (userType === 'beneficiary' || userType === 'vendor') {
      const cr = formData.documents.cr;
      const vat = formData.documents.vat;
      const companyProfile = formData.documents.companyProfile;
      
      if (!cr || cr.length === 0) {
        showMessage('Please upload Commercial Registration (CR)', 'error');
        return false;
      }
      
      if (!vat || vat.length === 0) {
        showMessage('Please upload VAT Certificate', 'error');
        return false;
      }
      
      if (!companyProfile || companyProfile.length === 0) {
        showMessage('Please upload Company Profile Document', 'error');
        return false;
      }
    } else if (userType === 'skill_service_provider') {
      const cr = formData.documents.cr;
      const certifications = formData.documents.certifications;
      const companyProfile = formData.documents.companyProfile;
      
      if (!cr || cr.length === 0) {
        showMessage('Please upload Commercial Registration (CR)', 'error');
        return false;
      }
      
      if (!certifications || certifications.length === 0) {
        showMessage('Please upload Service Certifications', 'error');
        return false;
      }
      
      if (!companyProfile || companyProfile.length === 0) {
        showMessage('Please upload Company Profile Document', 'error');
        return false;
      }
    } else if (userType === 'sub_contractor') {
      const cr = formData.documents.cr;
      const tradeLicense = formData.documents.tradeLicense;
      
      if (!cr || cr.length === 0) {
        showMessage('Please upload Commercial Registration (CR)', 'error');
        return false;
      }
      
      if (!tradeLicense || tradeLicense.length === 0) {
        showMessage('Please upload Trade License', 'error');
        return false;
      }
    } else if (userType === 'consultant') {
      const professionalLicense = formData.documents.professionalLicense;
      
      if (!professionalLicense || professionalLicense.length === 0) {
        showMessage('Please upload your professional license/certification', 'error');
        return false;
      }
    }

    // Validate terms acceptance
    const acceptTerms = document.getElementById('acceptTerms').checked;
    if (!acceptTerms) {
      showMessage('Please accept the Terms & Conditions to continue', 'error');
      return false;
    }
    return true;
  }

  function validateStep4() {
    // Step 4 is just review, no validation needed
    return true;
  }

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // ============================================
  // Data Management
  // ============================================

  function saveStepData() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    if (currentStep === 1) {
      formData.userType = userType;
      updateFormFieldsVisibility();
      
      // Save sub-type
      const subTypeSelect = document.getElementById('signupSubType');
      if (subTypeSelect) {
        formData.subType = subTypeSelect.value;
      }
      
      // Save basic info from Step 1 (now includes user type + basic info)
      formData.companyName = document.getElementById('signupCompanyName')?.value.trim();
      formData.website = document.getElementById('signupWebsite')?.value.trim();
      
      // Role-specific fields
      if (userType === 'sub_contractor') {
        formData.trade = document.getElementById('signupTrade')?.value.trim();
      } else if (userType === 'consultant') {
        formData.expertise = document.getElementById('signupExpertise')?.value.trim();
      }
      formData.email = document.getElementById('signupEmail')?.value.trim();
      formData.mobile = document.getElementById('signupMobile')?.value.trim();
      formData.password = document.getElementById('signupPassword')?.value;
      
      // Save location data synchronously (values only, names will be resolved later)
      const countrySelect = document.getElementById('signupCountry');
      const regionSelect = document.getElementById('signupRegion');
      const citySelect = document.getElementById('signupCity');
      
      if (countrySelect && regionSelect && citySelect) {
        formData.location = {
          countryCode: countrySelect.value,
          regionCode: regionSelect.value,
          city: citySelect.value || ''
        };
      }
    } else if (currentStep === 2) {
      // Step 2 is basic information - data saved during form filling
    } else if (currentStep === 3) {
      // Step 3 is documents and terms - data already saved during file uploads
      // Terms acceptance is validated but not saved here (saved on submit)
    }
  }

  async function saveLocationData() {
    if (!window.LocationService) {
      // Fallback: use codes if service not available
      const countrySelect = document.getElementById('signupCountry');
      const regionSelect = document.getElementById('signupRegion');
      const citySelect = document.getElementById('signupCity');
      
      if (countrySelect && regionSelect && citySelect) {
        formData.location = {
          country: countrySelect.options[countrySelect.selectedIndex]?.text || '',
          region: regionSelect.options[regionSelect.selectedIndex]?.text || '',
          city: citySelect.value || ''
        };
      }
      return;
    }
    
    const countrySelect = document.getElementById('signupCountry');
    const regionSelect = document.getElementById('signupRegion');
    const citySelect = document.getElementById('signupCity');
    
    if (!countrySelect || !regionSelect || !citySelect) return;
    
    const countryCode = countrySelect.value;
    const regionCode = regionSelect.value;
    const cityValue = citySelect.value;
    
    // Get country name
    let countryName = '';
    if (countryCode) {
      const countries = await LocationService.getCountries();
      const country = countries.find(c => c.code === countryCode);
      countryName = country ? country.name : countryCode;
    }
    
    // Get region name
    let regionName = '';
    if (regionCode && countryCode) {
      const regions = await LocationService.getRegions(countryCode);
      const region = regions.find(r => r.code === regionCode);
      regionName = region ? region.name : regionCode;
    }
    
    formData.location = {
      country: countryName,
      region: regionName,
      city: cityValue || ''
    };
  }

  function updateFormFieldsVisibility() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    // Hide all fields first
    const allFieldGroups = ['beneficiaryFields', 'vendorFields', 'serviceProviderFields', 'subContractorFields', 'consultantFields'];
    const allDocumentGroups = ['beneficiaryDocuments', 'vendorDocuments', 'serviceProviderDocuments', 'subContractorDocuments', 'consultantDocuments'];
    
    allFieldGroups.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    
    allDocumentGroups.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
    
    // Show relevant fields based on user type
    const mobileRequired = document.getElementById('mobileRequired');
    const requiresMobile = ['beneficiary', 'vendor', 'skill_service_provider', 'sub_contractor'].includes(userType);
    
    if (userType === 'beneficiary') {
      const fields = document.getElementById('beneficiaryFields');
      const docs = document.getElementById('beneficiaryDocuments');
      if (fields) fields.style.display = 'block';
      if (docs) docs.style.display = 'block';
    } else if (userType === 'vendor') {
      const fields = document.getElementById('vendorFields');
      const docs = document.getElementById('vendorDocuments');
      if (fields) fields.style.display = 'block';
      if (docs) docs.style.display = 'block';
    } else if (userType === 'skill_service_provider') {
      const fields = document.getElementById('serviceProviderFields');
      const docs = document.getElementById('serviceProviderDocuments');
      if (fields) fields.style.display = 'block';
      if (docs) docs.style.display = 'block';
    } else if (userType === 'sub_contractor') {
      const fields = document.getElementById('subContractorFields');
      const docs = document.getElementById('subContractorDocuments');
      if (fields) fields.style.display = 'block';
      if (docs) docs.style.display = 'block';
    } else if (userType === 'consultant') {
      const fields = document.getElementById('consultantFields');
      const docs = document.getElementById('consultantDocuments');
      if (fields) fields.style.display = 'block';
      if (docs) docs.style.display = 'block';
    }
    
    // Update mobile requirement
    if (mobileRequired) {
      mobileRequired.style.display = requiresMobile ? 'inline' : 'none';
    }
    
    // Update sub-type dropdown
    updateSubTypeDropdown(userType);
  }

  // ============================================
  // User Type Selection
  // ============================================

  function setupUserTypeSelection() {
    const userTypeCards = document.querySelectorAll('.user-type-card');
    userTypeCards.forEach(card => {
      card.addEventListener('click', function() {
        // Update radio button
        const radio = this.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
        }
        
        // Update card styles
        userTypeCards.forEach(c => {
          c.style.borderColor = 'var(--color-gray-300)';
          c.style.backgroundColor = '';
        });
        this.style.borderColor = 'var(--color-primary)';
        this.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
        
        // Update form visibility
        updateFormFieldsVisibility();
      });
    });

    // Also listen to radio button changes directly
    document.querySelectorAll('input[name="userType"]').forEach(radio => {
      radio.addEventListener('change', function() {
        updateFormFieldsVisibility();
      });
    });

    // Initialize
    const checkedCard = document.querySelector('.user-type-card input[type="radio"]:checked')?.closest('.user-type-card');
    if (checkedCard) {
      checkedCard.style.borderColor = 'var(--color-primary)';
      checkedCard.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
    }
    
    // Initialize sub-type dropdown
    const initialUserType = document.querySelector('input[name="userType"]:checked')?.value;
    if (initialUserType) {
      updateSubTypeDropdown(initialUserType);
    }
  }

  // ============================================
  // Sub-Type Selection
  // ============================================

  function setupSubTypeSelection() {
    const subTypeSelect = document.getElementById('signupSubType');
    if (subTypeSelect) {
      subTypeSelect.addEventListener('change', function() {
        formData.subType = this.value;
      });
    }
  }

  function updateSubTypeDropdown(userType) {
    const subTypeContainer = document.getElementById('subTypeContainer');
    const subTypeSelect = document.getElementById('signupSubType');
    
    if (!subTypeContainer || !subTypeSelect) return;
    
    if (userType && subTypes[userType]) {
      // Show sub-type container
      subTypeContainer.style.display = 'block';
      
      // Clear existing options
      subTypeSelect.innerHTML = '<option value="">Select Sub-Type</option>';
      
      // Populate with sub-types for selected user type
      subTypes[userType].forEach(subType => {
        const option = document.createElement('option');
        option.value = subType.value;
        option.textContent = subType.label;
        subTypeSelect.appendChild(option);
      });
      
      // Reset selection
      subTypeSelect.value = '';
      formData.subType = '';
    } else {
      // Hide sub-type container if no user type selected
      subTypeContainer.style.display = 'none';
      subTypeSelect.value = '';
      formData.subType = '';
    }
  }

  // ============================================
  // File Upload Handling
  // ============================================

  function setupFileUploads() {
    document.querySelectorAll('.file-upload-area').forEach(area => {
      const input = area.querySelector('input[type="file"]');
      const docType = area.getAttribute('data-doc-type');
      
      if (!input) return;

      // Click to upload
      area.addEventListener('click', () => input.click());

      // Drag and drop
      area.addEventListener('dragover', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--color-primary)';
        area.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
      });

      area.addEventListener('dragleave', () => {
        area.style.borderColor = 'var(--color-gray-300)';
        area.style.backgroundColor = '';
      });

      area.addEventListener('drop', (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--color-gray-300)';
        area.style.backgroundColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
          handleFileUpload(files, docType, input);
        }
      });

      // File input change
      input.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleFileUpload(e.target.files, docType, input);
        }
      });
    });
  }

  function handleFileUpload(files, docType, input) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const fileArray = Array.from(files);
    
    // Validate file sizes
    const invalidFiles = fileArray.filter(file => file.size > maxSize);
    if (invalidFiles.length > 0) {
      showMessage(`Some files exceed 5MB limit: ${invalidFiles.map(f => f.name).join(', ')}`, 'error');
      return;
    }

    // Store files
    if (input.multiple) {
      formData.documents[docType] = formData.documents[docType] || [];
      formData.documents[docType].push(...fileArray);
    } else {
      formData.documents[docType] = [fileArray[0]];
    }

    // Show preview
    showFilePreview(docType, formData.documents[docType]);
  }

  function showFilePreview(docType, files) {
    const previewId = `${docType}Preview`;
    const preview = document.getElementById(previewId);
    if (!preview) return;

    preview.style.display = 'block';
    preview.innerHTML = '';

    files.forEach((file, index) => {
      const fileItem = document.createElement('div');
      fileItem.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;';
      
      const fileInfo = document.createElement('div');
      fileInfo.style.cssText = 'display: flex; align-items: center; gap: 0.5rem; flex: 1;';
      
      const icon = document.createElement('i');
      icon.className = 'ph ph-file-text';
      icon.style.fontSize = '1.5rem';
      
      const details = document.createElement('div');
      details.innerHTML = `
        <div style="font-weight: 500;">${file.name}</div>
        <div style="font-size: 0.85rem; color: var(--color-gray-600);">${(file.size / 1024).toFixed(2)} KB</div>
      `;
      
      fileInfo.appendChild(icon);
      fileInfo.appendChild(details);
      
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'btn btn-sm btn-secondary';
      removeBtn.textContent = 'Remove';
      removeBtn.onclick = () => {
        files.splice(index, 1);
        if (files.length === 0) {
          formData.documents[docType] = [];
          preview.style.display = 'none';
        } else {
          showFilePreview(docType, files);
        }
      };
      
      fileItem.appendChild(fileInfo);
      fileItem.appendChild(removeBtn);
      preview.appendChild(fileItem);
    });
  }

  // ============================================
  // Password Strength
  // ============================================

  function setupPasswordStrength() {
    const passwordInput = document.getElementById('signupPassword');
    const strengthBar = document.getElementById('passwordStrengthBar');
    
    if (!passwordInput || !strengthBar) return;

    passwordInput.addEventListener('input', function() {
      const password = this.value;
      let strength = 0;
      
      if (password.length >= 8) strength += 25;
      if (password.length >= 12) strength += 10;
      if (/[a-z]/.test(password)) strength += 20;
      if (/[A-Z]/.test(password)) strength += 20;
      if (/[0-9]/.test(password)) strength += 15;
      if (/[^a-zA-Z0-9]/.test(password)) strength += 10;

      strength = Math.min(strength, 100);
      strengthBar.style.width = strength + '%';
      
      if (strength < 40) {
        strengthBar.style.backgroundColor = 'var(--color-error)';
      } else if (strength < 70) {
        strengthBar.style.backgroundColor = 'var(--color-warning)';
      } else {
        strengthBar.style.backgroundColor = 'var(--color-success)';
      }
    });
  }

  // ============================================
  // Registration & OTP Verification
  // ============================================

  async function initiateRegistration() {
    // If user already exists (from Step 2 verification), update it instead of creating new
    if (formData.tempUserId) {
      // User already created during verification, just update with final data
      await saveLocationData();
      
      const userType = formData.userType;
      const user = PMTwinData.Users.getById(formData.tempUserId);
      
      if (user) {
        // Update user with final registration data
        const encodePassword = (typeof PMTwinAuth !== 'undefined' && PMTwinAuth.encodePassword) 
          ? PMTwinAuth.encodePassword 
          : (pwd) => btoa(pwd); // Fallback encoding
        
        const updates = {
          password: encodePassword(formData.password),
          mobile: formData.mobile || user.mobile,
          subType: formData.subType || user.subType || null,
          profile: {
            ...user.profile,
            name: userType === 'individual' ? formData.name : formData.companyName,
            location: formData.location || {},
            phone: formData.mobile || null,
            ...(userType === 'individual' && formData.professionalTitle ? { professionalTitle: formData.professionalTitle } : {}),
            ...(userType === 'entity' && formData.website ? { website: formData.website } : {}),
            ...(userType === 'entity' && formData.companyName ? { companyName: formData.companyName } : {}),
            ...(userType === 'individual' && formData.portfolioLink ? { portfolioLink: formData.portfolioLink } : {}),
            ...(formData.subType ? { subType: formData.subType } : {})
          },
          documents: formData.documents,
          emailVerified: formData.emailVerified || user.emailVerified,
          mobileVerified: formData.mobileVerified || user.mobileVerified
        };
        
        PMTwinData.Users.update(formData.tempUserId, updates);
        
        // Assign RBAC role if available
        if (typeof PMTwinRBAC !== 'undefined') {
          try {
            await PMTwinRBAC.assignRoleToUser(formData.tempUserId, role, 'system', formData.email);
            console.log(`[Signup] Assigned RBAC role ${role} to user ${formData.email}`);
          } catch (rbacError) {
            console.warn('[Signup] Failed to assign RBAC role:', rbacError);
          }
        }
        
        registrationResult = { success: true, userId: formData.tempUserId };
        showOTPMessage('Registration complete. Proceeding to document upload...', 'success');
        return;
      }
    }

    // Prepare user data for new registration
    const userType = formData.userType;
    // Map userType to role (aligned with golden seed data)
    const roleMapping = {
      'beneficiary': 'beneficiary',
      'vendor': 'vendor',
      'skill_service_provider': 'skill_service_provider',
      'sub_contractor': 'sub_contractor',
      'consultant': 'consultant'
    };
    const role = roleMapping[userType] || userType;
    
    // Map role to userType for data layer
    const userTypeMapping = {
      'beneficiary': 'beneficiary',
      'vendor': 'vendor_corporate',
      'skill_service_provider': 'service_provider',
      'sub_contractor': 'sub_contractor',
      'consultant': 'consultant'
    };
    const finalUserType = userTypeMapping[role] || userType;

    // Ensure location data is saved with proper names
    await saveLocationData();
    
    const userData = {
      email: formData.email,
      mobile: formData.mobile || null,
      password: formData.password,
      role: role,
      userType: finalUserType,
      subType: formData.subType || null,
      emailVerified: formData.emailVerified || false,
      mobileVerified: formData.mobileVerified || false,
      profile: {
        name: formData.companyName || formData.email.split('@')[0],
        companyName: formData.companyName || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        location: formData.location || {},
        phone: formData.mobile || null,
        ...(formData.website ? { website: formData.website } : {}),
        ...(formData.trade ? { trade: formData.trade } : {}),
        ...(formData.expertise ? { expertiseAreas: formData.expertise.split(',').map(e => e.trim()) } : {}),
        ...(formData.subType ? { subType: formData.subType } : {})
      },
      documents: formData.documents
    };

    // Call registration service
    try {
      let result;
      if (typeof AuthService !== 'undefined') {
        result = await AuthService.register(userData);
      } else if (typeof PMTwinAuth !== 'undefined') {
        result = PMTwinAuth.register(userData);
      } else {
        showMessage('Authentication service not available', 'error');
        return;
      }

      if (result.success) {
        registrationResult = result;
        
        // Assign RBAC role if available
        if (typeof PMTwinRBAC !== 'undefined' && result.userId) {
          try {
            await PMTwinRBAC.assignRoleToUser(result.userId, role, 'system', formData.email);
            console.log(`[Signup] Assigned RBAC role ${role} to user ${formData.email}`);
          } catch (rbacError) {
            console.warn('[Signup] Failed to assign RBAC role:', rbacError);
          }
        }
        
        showOTPMessage('Verification codes have been sent to your email' + (formData.mobile ? ' and mobile' : '') + '.', 'success');
        
        // Pre-fill OTP if available (for demo/testing)
        if (result.emailOTP) {
          document.getElementById('emailOTP').value = result.emailOTP;
        }
        if (result.mobileOTP && formData.mobile) {
          document.getElementById('mobileOTP').value = result.mobileOTP;
        }
      } else {
        showOTPMessage(result.error || 'Registration failed', 'error');
        // Go back to step 2
        currentStep = 2;
        showStep(currentStep);
        updateProgressIndicator();
      }
    } catch (error) {
      console.error('Error during registration:', error);
      showOTPMessage('An error occurred during registration', 'error');
      currentStep = 2;
      showStep(currentStep);
      updateProgressIndicator();
    }
  }

  async function verifyOTP() {
    if (!registrationResult) {
      showOTPMessage('Please complete registration first', 'error');
      return;
    }

    const emailOTP = document.getElementById('emailOTP').value.trim();
    const mobileOTP = document.getElementById('mobileOTP').value.trim();
    const userType = formData.userType;

    if (!emailOTP || emailOTP.length !== 6) {
      showOTPMessage('Please enter a valid 6-digit email verification code', 'error');
      return;
    }

    // Verify OTP
    try {
      let verifyResult;
      if (typeof AuthService !== 'undefined') {
        verifyResult = await AuthService.verifyOTP(formData.email, emailOTP, 'email');
      } else if (typeof PMTwinAuth !== 'undefined') {
        verifyResult = PMTwinAuth.verifyOTP(formData.email, emailOTP, 'email');
      } else {
        showOTPMessage('Authentication service not available', 'error');
        return;
      }

      if (verifyResult && verifyResult.success) {
        // Verify mobile OTP if provided
        if (mobileOTP && formData.mobile) {
          let mobileVerifyResult;
          if (typeof AuthService !== 'undefined') {
            mobileVerifyResult = await AuthService.verifyOTP(formData.mobile, mobileOTP, 'mobile');
          } else if (typeof PMTwinAuth !== 'undefined') {
            mobileVerifyResult = PMTwinAuth.verifyOTP(formData.mobile, mobileOTP, 'mobile');
          }

          if (!mobileVerifyResult || !mobileVerifyResult.success) {
            showOTPMessage('Mobile verification code is incorrect', 'error');
            return;
          }
        }

        // OTP verified, proceed to next step
        nextStep();
      } else {
        showOTPMessage('Email verification code is incorrect', 'error');
      }
    } catch (error) {
      console.error('Error during OTP verification:', error);
      showOTPMessage('An error occurred during verification', 'error');
    }
  }

  function showOTPMessage(message, type) {
    const messageDiv = document.getElementById('otpMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      messageDiv.style.display = 'block';
    }
  }

  // ============================================
  // Final Submission
  // ============================================

  async function handleSubmit(event) {
    event.preventDefault();
    
    if (!validateStep5()) {
      return false;
    }

    const messageDiv = document.getElementById('signupMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
      messageDiv.className = '';
    }

    try {
      showMessage('Submitting your registration...', 'info');
      
      // Registration and OTP verification should already be done
      // This step is just final confirmation
      
      showMessage('Registration successful! Your profile is pending admin review. You will be notified once approved.', 'success');
      
      // Redirect to onboarding page or login
      setTimeout(() => {
        window.location.href = '../onboarding/';
      }, 3000);
      
    } catch (error) {
      console.error('Error during final submission:', error);
      showMessage('An error occurred during submission', 'error');
    }

    return false;
  }

  function showMessage(message, type) {
    const messageDiv = document.getElementById('signupMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : type === 'success' ? 'success' : 'info'}`;
      messageDiv.style.display = 'block';
    }
  }

  // ============================================
  // Email & Phone Verification Functions
  // ============================================
  
  async function onEmailBlur() {
    const email = document.getElementById('signupEmail')?.value.trim();
    if (email && isValidEmail(email)) {
      // Check if email already exists
      if (PMTwinData && PMTwinData.Users) {
        const existing = PMTwinData.Users.getByEmail(email);
        if (existing) {
          showVerificationMessage('emailVerificationMessage', 'This email is already registered', 'error');
          return;
        }
      }
      // Enable send OTP button
      const sendBtn = document.getElementById('sendEmailOTP');
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    }
  }

  async function onMobileBlur() {
    const mobile = document.getElementById('signupMobile')?.value.trim();
    if (mobile) {
      // Enable send OTP button
      const sendBtn = document.getElementById('sendMobileOTP');
      if (sendBtn) {
        sendBtn.disabled = false;
      }
    }
  }

  async function sendEmailOTP() {
    const email = document.getElementById('signupEmail')?.value.trim();
    if (!email || !isValidEmail(email)) {
      showVerificationMessage('emailVerificationMessage', 'Please enter a valid email address', 'error');
      return;
    }

    try {
      // Check if user already exists
      let user = null;
      if (PMTwinData && PMTwinData.Users) {
        user = PMTwinData.Users.getByEmail(email);
        
        // If user exists and is already verified/approved, show error
        if (user && (user.emailVerified || user.onboardingStage === 'approved')) {
          showVerificationMessage('emailVerificationMessage', 'This email is already registered', 'error');
          return;
        }
        
        // If user exists but not verified, use it
        if (user) {
          formData.tempUserId = user.id;
        } else {
          // Create temporary user account for OTP verification
          const userType = document.querySelector('input[name="userType"]:checked')?.value;
          const roleMapping = {
            'beneficiary': 'beneficiary',
            'vendor': 'vendor',
            'skill_service_provider': 'skill_service_provider',
            'sub_contractor': 'sub_contractor',
            'consultant': 'consultant'
          };
          const role = roleMapping[userType] || userType;

          // Create temporary user with minimal data
          const subTypeSelect = document.getElementById('signupSubType');
          const subType = subTypeSelect ? subTypeSelect.value : null;
          
          const tempUser = PMTwinData.Users.create({
            email: email,
            mobile: document.getElementById('signupMobile')?.value.trim() || null,
            password: 'temp_password_' + Date.now(), // Temporary password, will be updated later
            role: role,
            userType: userType,
            subType: subType,
            emailVerified: false,
            mobileVerified: false,
            onboardingStage: 'registered',
            profile: {
              name: email.split('@')[0], // Temporary name
              status: 'pending',
              createdAt: new Date().toISOString(),
              ...(subType ? { subType: subType } : {})
            }
          });

          if (tempUser) {
            formData.tempUserId = tempUser.id;
            user = tempUser;
          }
        }
      }

      if (!user) {
        showVerificationMessage('emailVerificationMessage', 'Failed to initialize user account', 'error');
        return;
      }

      // Request OTP
      let result;
      if (typeof AuthService !== 'undefined' && AuthService.requestOTP) {
        result = await AuthService.requestOTP(email, 'email');
      } else if (typeof PMTwinAuth !== 'undefined' && PMTwinAuth.requestOTP) {
        result = PMTwinAuth.requestOTP(email, 'email');
      } else {
        showVerificationMessage('emailVerificationMessage', 'OTP service not available', 'error');
        return;
      }

      if (result && result.success) {
        // Show OTP input
        const statusDiv = document.getElementById('emailVerificationStatus');
        if (statusDiv) {
          statusDiv.style.display = 'block';
        }
        showVerificationMessage('emailVerificationMessage', 'Verification code sent to your email. Check your inbox.', 'success');
        
        // Show OTP in console for POC
        if (result.otpCode) {
          console.log(`[Signup] Email OTP for ${email}: ${result.otpCode}`);
        }
      } else {
        showVerificationMessage('emailVerificationMessage', result?.error || 'Failed to send verification code', 'error');
      }
    } catch (error) {
      console.error('Error sending email OTP:', error);
      showVerificationMessage('emailVerificationMessage', 'An error occurred. Please try again.', 'error');
    }
  }

  async function sendMobileOTP() {
    const mobile = document.getElementById('signupMobile')?.value.trim();
    if (!mobile) {
      showVerificationMessage('mobileVerificationMessage', 'Please enter a mobile number', 'error');
      return;
    }

    try {
      // Ensure temp user exists
      if (!formData.tempUserId) {
        const email = document.getElementById('signupEmail')?.value.trim();
        if (!email) {
          showVerificationMessage('mobileVerificationMessage', 'Please enter email first', 'error');
          return;
        }
        await sendEmailOTP(); // This will create temp user
      }

      const email = document.getElementById('signupEmail')?.value.trim();
      if (!email) {
        showVerificationMessage('mobileVerificationMessage', 'Email is required', 'error');
        return;
      }

      // Request OTP
      let result;
      if (typeof AuthService !== 'undefined' && AuthService.requestOTP) {
        result = await AuthService.requestOTP(email, 'mobile');
      } else if (typeof PMTwinAuth !== 'undefined' && PMTwinAuth.requestOTP) {
        result = PMTwinAuth.requestOTP(email, 'mobile');
      } else {
        showVerificationMessage('mobileVerificationMessage', 'OTP service not available', 'error');
        return;
      }

      if (result && result.success) {
        // Show OTP input
        const statusDiv = document.getElementById('mobileVerificationStatus');
        if (statusDiv) {
          statusDiv.style.display = 'block';
        }
        showVerificationMessage('mobileVerificationMessage', 'Verification code sent to your mobile. Check your messages.', 'success');
        
        // Show OTP in console for POC
        if (result.otpCode) {
          console.log(`[Signup] Mobile OTP for ${mobile}: ${result.otpCode}`);
        }
      } else {
        showVerificationMessage('mobileVerificationMessage', result?.error || 'Failed to send verification code', 'error');
      }
    } catch (error) {
      console.error('Error sending mobile OTP:', error);
      showVerificationMessage('mobileVerificationMessage', 'An error occurred. Please try again.', 'error');
    }
  }

  async function verifyEmailOTP() {
    const email = document.getElementById('signupEmail')?.value.trim();
    const otpCode = document.getElementById('emailOTPInput')?.value.trim();

    if (!email) {
      showVerificationMessage('emailVerificationMessage', 'Email is required', 'error');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      showVerificationMessage('emailVerificationMessage', 'Please enter a valid 6-digit code', 'error');
      return;
    }

    try {
      let result;
      if (typeof AuthService !== 'undefined' && AuthService.verifyOTP) {
        result = await AuthService.verifyOTP(email, otpCode, 'email');
      } else if (typeof PMTwinAuth !== 'undefined' && PMTwinAuth.verifyOTP) {
        result = PMTwinAuth.verifyOTP(email, otpCode, 'email');
      } else {
        showVerificationMessage('emailVerificationMessage', 'Verification service not available', 'error');
        return;
      }

      if (result && result.success) {
        formData.emailVerified = true;
        showVerificationMessage('emailVerificationMessage', 'Email verified successfully!', 'success');
        
        // Hide OTP input, show verified badge
        const statusDiv = document.getElementById('emailVerificationStatus');
        if (statusDiv) {
          statusDiv.style.display = 'none';
        }
        const badge = document.getElementById('emailVerifiedBadge');
        if (badge) {
          badge.style.display = 'block';
        }
        const sendBtn = document.getElementById('sendEmailOTP');
        if (sendBtn) {
          sendBtn.disabled = true;
        }
      } else {
        showVerificationMessage('emailVerificationMessage', result?.error || 'Invalid verification code', 'error');
        const resendBtn = document.getElementById('resendEmailOTP');
        if (resendBtn) {
          resendBtn.style.display = 'inline-block';
        }
      }
    } catch (error) {
      console.error('Error verifying email OTP:', error);
      showVerificationMessage('emailVerificationMessage', 'An error occurred during verification', 'error');
    }
  }

  async function verifyMobileOTP() {
    const email = document.getElementById('signupEmail')?.value.trim();
    const mobile = document.getElementById('signupMobile')?.value.trim();
    const otpCode = document.getElementById('mobileOTPInput')?.value.trim();

    if (!mobile) {
      showVerificationMessage('mobileVerificationMessage', 'Mobile number is required', 'error');
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      showVerificationMessage('mobileVerificationMessage', 'Please enter a valid 6-digit code', 'error');
      return;
    }

    if (!email) {
      showVerificationMessage('mobileVerificationMessage', 'Email is required', 'error');
      return;
    }

    try {
      let result;
      if (typeof AuthService !== 'undefined' && AuthService.verifyOTP) {
        result = await AuthService.verifyOTP(email, otpCode, 'mobile');
      } else if (typeof PMTwinAuth !== 'undefined' && PMTwinAuth.verifyOTP) {
        result = PMTwinAuth.verifyOTP(email, otpCode, 'mobile');
      } else {
        showVerificationMessage('mobileVerificationMessage', 'Verification service not available', 'error');
        return;
      }

      if (result && result.success) {
        formData.mobileVerified = true;
        showVerificationMessage('mobileVerificationMessage', 'Mobile number verified successfully!', 'success');
        
        // Hide OTP input, show verified badge
        const statusDiv = document.getElementById('mobileVerificationStatus');
        if (statusDiv) {
          statusDiv.style.display = 'none';
        }
        const badge = document.getElementById('mobileVerifiedBadge');
        if (badge) {
          badge.style.display = 'block';
        }
        const sendBtn = document.getElementById('sendMobileOTP');
        if (sendBtn) {
          sendBtn.disabled = true;
        }
      } else {
        showVerificationMessage('mobileVerificationMessage', result?.error || 'Invalid verification code', 'error');
        const resendBtn = document.getElementById('resendMobileOTP');
        if (resendBtn) {
          resendBtn.style.display = 'inline-block';
        }
      }
    } catch (error) {
      console.error('Error verifying mobile OTP:', error);
      showVerificationMessage('mobileVerificationMessage', 'An error occurred during verification', 'error');
    }
  }

  function showVerificationMessage(elementId, message, type) {
    const messageDiv = document.getElementById(elementId);
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = type === 'error' ? 'text-danger' : type === 'success' ? 'text-success' : 'text-info';
      messageDiv.style.display = 'block';
    }
  }

  // ============================================
  // Public API
  // ============================================

  if (!window.auth) window.auth = {};
  window.auth.signup = {
    init,
    nextStep,
    prevStep,
    switchToStep,
    verifyOTP,
    handleSubmit,
    onCountryChange,
    onRegionChange,
    onEmailBlur,
    onMobileBlur,
    sendEmailOTP,
    sendMobileOTP,
    verifyEmailOTP,
    verifyMobileOTP
  };

  // Global reference for form onsubmit and onclick handlers
  window.signupComponent = window.auth.signup;

})();
