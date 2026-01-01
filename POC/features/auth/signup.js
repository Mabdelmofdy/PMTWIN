/**
 * Signup Component - Multi-Step Onboarding Wizard
 * Handles step-by-step registration flow according to User Authentication requirements
 */

(function() {
  'use strict';

  let currentStep = 1;
  const totalSteps = 5;
  let formData = {
    documents: {}
  };
  let registrationResult = null;

  function init(params) {
    // Initialize step 1
    updateProgressIndicator();
    setupUserTypeSelection();
    setupFileUploads();
    setupPasswordStrength();
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
      
      // Move to next step
      currentStep++;
      showStep(currentStep);
      updateProgressIndicator();

      // Special handling for step 4 (OTP)
      if (currentStep === 4) {
        initiateRegistration();
        // Show/hide mobile OTP field based on whether mobile was provided
        const mobileOTPGroup = document.getElementById('mobileOTPGroup');
        if (mobileOTPGroup && !formData.mobile) {
          mobileOTPGroup.style.display = 'none';
        } else if (mobileOTPGroup) {
          mobileOTPGroup.style.display = 'block';
        }
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
  }

  function updateProgressIndicator() {
    document.querySelectorAll('.progress-step').forEach((stepEl, index) => {
      const stepNum = index + 1;
      if (stepNum < currentStep) {
        stepEl.classList.add('completed');
        stepEl.classList.remove('active');
      } else if (stepNum === currentStep) {
        stepEl.classList.add('active');
        stepEl.classList.remove('completed');
      } else {
        stepEl.classList.remove('active', 'completed');
      }
    });
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
        return true; // OTP validation handled separately
      case 5:
        return validateStep5();
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
    return true;
  }

  function validateStep2() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    if (userType === 'individual') {
      const name = document.getElementById('signupName').value.trim();
      if (!name) {
        showMessage('Please enter your full name', 'error');
        return false;
      }
    } else {
      const companyName = document.getElementById('signupCompanyName').value.trim();
      if (!companyName) {
        showMessage('Please enter company name', 'error');
        return false;
      }
    }

    const email = document.getElementById('signupEmail').value.trim();
    if (!email || !isValidEmail(email)) {
      showMessage('Please enter a valid email address', 'error');
      return false;
    }

    if (userType === 'entity') {
      const mobile = document.getElementById('signupMobile').value.trim();
      if (!mobile) {
        showMessage('Mobile number is required for entities', 'error');
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

    return true;
  }

  function validateStep3() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    if (userType === 'individual') {
      const professionalLicense = formData.documents.professionalLicense;
      const resume = formData.documents.resume;
      
      if (!professionalLicense || professionalLicense.length === 0) {
        showMessage('Please upload your professional license/certification', 'error');
        return false;
      }
      
      if (!resume || resume.length === 0) {
        showMessage('Please upload your CV/Resume', 'error');
        return false;
      }
    } else {
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
    }

    return true;
  }

  function validateStep5() {
    const acceptTerms = document.getElementById('acceptTerms').checked;
    if (!acceptTerms) {
      showMessage('Please accept the Terms & Conditions to continue', 'error');
      return false;
    }
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
    } else if (currentStep === 2) {
      if (userType === 'individual') {
        formData.name = document.getElementById('signupName').value.trim();
        formData.professionalTitle = document.getElementById('signupProfessionalTitle').value.trim();
      } else {
        formData.companyName = document.getElementById('signupCompanyName').value.trim();
        formData.website = document.getElementById('signupWebsite').value.trim();
      }
      formData.email = document.getElementById('signupEmail').value.trim();
      formData.mobile = document.getElementById('signupMobile').value.trim();
      formData.password = document.getElementById('signupPassword').value;
    }
  }

  function updateFormFieldsVisibility() {
    const userType = document.querySelector('input[name="userType"]:checked')?.value;
    
    // Show/hide individual vs entity fields
    const individualFields = document.getElementById('individualFields');
    const entityFields = document.getElementById('entityFields');
    const individualDocuments = document.getElementById('individualDocuments');
    const entityDocuments = document.getElementById('entityDocuments');
    const mobileRequired = document.getElementById('mobileRequired');
    
    if (userType === 'individual') {
      if (individualFields) individualFields.style.display = 'block';
      if (entityFields) entityFields.style.display = 'none';
      if (individualDocuments) individualDocuments.style.display = 'block';
      if (entityDocuments) entityDocuments.style.display = 'none';
      if (mobileRequired) mobileRequired.style.display = 'none';
    } else {
      if (individualFields) individualFields.style.display = 'none';
      if (entityFields) entityFields.style.display = 'block';
      if (individualDocuments) individualDocuments.style.display = 'none';
      if (entityDocuments) entityDocuments.style.display = 'block';
      if (mobileRequired) mobileRequired.style.display = 'inline';
    }
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

    // Initialize
    const checkedCard = document.querySelector('.user-type-card input[type="radio"]:checked')?.closest('.user-type-card');
    if (checkedCard) {
      checkedCard.style.borderColor = 'var(--color-primary)';
      checkedCard.style.backgroundColor = 'rgba(0, 123, 255, 0.05)';
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
    // Prepare user data
    const userType = formData.userType;
    const roleMapping = {
      'individual': 'individual',
      'entity': 'entity'
    };
    const role = roleMapping[userType] || 'individual';

    const userData = {
      email: formData.email,
      mobile: formData.mobile || null,
      password: formData.password,
      role: role,
      userType: userType,
      profile: {
        name: userType === 'individual' ? formData.name : formData.companyName,
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...(userType === 'individual' && formData.professionalTitle ? { professionalTitle: formData.professionalTitle } : {}),
        ...(userType === 'entity' && formData.website ? { website: formData.website } : {}),
        ...(userType === 'individual' && formData.portfolioLink ? { portfolioLink: formData.portfolioLink } : {})
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
  // Public API
  // ============================================

  if (!window.auth) window.auth = {};
  window.auth.signup = {
    init,
    nextStep,
    prevStep,
    verifyOTP,
    handleSubmit
  };

  // Global reference for form onsubmit and onclick handlers
  window.signupComponent = window.auth.signup;

})();
