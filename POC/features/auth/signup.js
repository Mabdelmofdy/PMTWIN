/**
 * Signup Component - HTML trigger for AuthService.register()
 */

(function() {
  'use strict';

  function init(params) {
    // Form submission is handled by handleSubmit
  }

  // ============================================
  // HTML Trigger for AuthService.register()
  // ============================================

  // Trigger: register(userData) - Register new user
  async function handleSubmit(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('signupMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
      messageDiv.className = '';
    }

    try {
      // Get form values
      const userType = document.querySelector('input[name="userType"]:checked')?.value;
      const email = document.getElementById('signupEmail').value;
      const mobile = document.getElementById('signupMobile').value;
      const password = document.getElementById('signupPassword').value;
      const passwordConfirm = document.getElementById('signupPasswordConfirm').value;

      // Validation
      if (password !== passwordConfirm) {
        showMessage('Passwords do not match', 'error');
        return false;
      }

      if (password.length < 8) {
        showMessage('Password must be at least 8 characters', 'error');
        return false;
      }

      // Map userType to role
      const roleMapping = {
        'individual': 'individual',
        'entity': 'entity'
      };
      const role = roleMapping[userType] || 'individual';

      // Prepare user data
      const userData = {
        email: email,
        mobile: mobile || null,
        password: password,
        role: role,
        userType: userType,
        profile: {
          name: email.split('@')[0], // Default name from email
          status: 'pending',
          createdAt: new Date().toISOString()
        }
      };

      // Call service
      let result;
      if (typeof AuthService !== 'undefined') {
        result = await AuthService.register(userData);
      } else if (typeof PMTwinAuth !== 'undefined') {
        result = PMTwinAuth.register(userData);
      } else {
        showMessage('Authentication service not available', 'error');
        return false;
      }

      if (result.success) {
        showMessage('Registration successful! Please check your email for verification code.', 'success');
        
        // If OTP is required, redirect to verification page
        if (result.requiresOTP) {
          setTimeout(() => {
            window.location.href = 'onboarding.html';
          }, 2000);
        } else {
          // Auto-login and redirect
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 2000);
        }
      } else {
        showMessage(result.error || 'Registration failed', 'error');
      }
    } catch (error) {
      console.error('Error during registration:', error);
      showMessage('An error occurred during registration', 'error');
    }

    return false;
  }

  function showMessage(message, type) {
    const messageDiv = document.getElementById('signupMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      messageDiv.style.display = 'block';
    }
  }

  // Export
  if (!window.auth) window.auth = {};
  window.auth.signup = {
    init,
    handleSubmit
  };

  // Global reference for form onsubmit
  window.signupComponent = window.auth.signup;

})();

