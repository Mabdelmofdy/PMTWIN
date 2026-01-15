/**
 * Form Validation Utility
 * Provides real-time validation, error messages, and visual feedback
 */

(function() {
  'use strict';

  /**
   * Validation rules
   */
  const validators = {
    required(value) {
      return value !== null && value !== undefined && String(value).trim() !== '';
    },
    
    email(value) {
      if (!value) return true; // Use required for mandatory check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    
    minLength(value, min) {
      if (!value) return true;
      return String(value).length >= min;
    },
    
    maxLength(value, max) {
      if (!value) return true;
      return String(value).length <= max;
    },
    
    pattern(value, regex) {
      if (!value) return true;
      const pattern = new RegExp(regex);
      return pattern.test(value);
    },
    
    min(value, min) {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num >= min;
    },
    
    max(value, max) {
      if (!value) return true;
      const num = Number(value);
      return !isNaN(num) && num <= max;
    },
    
    password(value) {
      if (!value) return true;
      // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      return passwordRegex.test(value);
    },
    
    phone(value) {
      if (!value) return true;
      // Basic phone validation (allows +, digits, spaces, dashes, parentheses)
      const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/;
      return phoneRegex.test(value.replace(/\s/g, ''));
    },
    
    url(value) {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    }
  };

  /**
   * Get validation message for a rule
   */
  function getValidationMessage(field, rule, params) {
    const messages = {
      required: `${field} is required`,
      email: `${field} must be a valid email address`,
      minLength: `${field} must be at least ${params[0]} characters`,
      maxLength: `${field} must be no more than ${params[0]} characters`,
      pattern: `${field} format is invalid`,
      min: `${field} must be at least ${params[0]}`,
      max: `${field} must be no more than ${params[0]}`,
      password: `${field} must be at least 8 characters with uppercase, lowercase, and number`,
      phone: `${field} must be a valid phone number`,
      url: `${field} must be a valid URL`
    };
    
    return messages[rule] || `${field} is invalid`;
  }

  /**
   * Validate a single field
   */
  function validateField(input, rules) {
    const value = input.value;
    const fieldName = input.getAttribute('data-label') || input.name || input.id || 'This field';
    const formGroup = input.closest('.form-group') || input.parentElement;
    
    // Remove previous validation state
    formGroup.classList.remove('has-error', 'has-success');
    const existingFeedback = formGroup.querySelector('.form-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    // If field is empty and not required, it's valid
    if (!value && !rules.required) {
      return { valid: true };
    }
    
    // Check each rule
    for (const [rule, params] of Object.entries(rules)) {
      if (rule === 'required' && !validators.required(value)) {
        return showFieldError(formGroup, input, getValidationMessage(fieldName, rule, params));
      }
      
      if (rule !== 'required' && value) {
        const validator = validators[rule];
        if (validator && !validator(value, ...(Array.isArray(params) ? params : [params]))) {
          return showFieldError(formGroup, input, getValidationMessage(fieldName, rule, Array.isArray(params) ? params : [params]));
        }
      }
    }
    
    // Field is valid
    formGroup.classList.add('has-success');
    return { valid: true };
  }

  /**
   * Show field error
   */
  function showFieldError(formGroup, input, message) {
    formGroup.classList.add('has-error');
    
    const feedback = document.createElement('div');
    feedback.className = 'form-feedback form-feedback-error';
    feedback.textContent = message;
    feedback.setAttribute('role', 'alert');
    
    formGroup.appendChild(feedback);
    input.setAttribute('aria-invalid', 'true');
    
    return { valid: false, message };
  }

  /**
   * Validate entire form
   */
  function validateForm(form) {
    if (!form) return { valid: false, errors: [] };
    
    const inputs = form.querySelectorAll('input, textarea, select');
    const errors = [];
    let isValid = true;
    
    inputs.forEach(input => {
      const rules = getFieldRules(input);
      if (Object.keys(rules).length > 0) {
        const result = validateField(input, rules);
        if (!result.valid) {
          isValid = false;
          errors.push({
            field: input.name || input.id,
            message: result.message
          });
        }
      }
    });
    
    return { valid: isValid, errors };
  }

  /**
   * Get validation rules from input attributes
   */
  function getFieldRules(input) {
    const rules = {};
    
    if (input.hasAttribute('required')) {
      rules.required = true;
    }
    
    if (input.type === 'email') {
      rules.email = true;
    }
    
    if (input.hasAttribute('minlength')) {
      rules.minLength = [parseInt(input.getAttribute('minlength'))];
    }
    
    if (input.hasAttribute('maxlength')) {
      rules.maxLength = [parseInt(input.getAttribute('maxlength'))];
    }
    
    if (input.hasAttribute('min')) {
      rules.min = [parseFloat(input.getAttribute('min'))];
    }
    
    if (input.hasAttribute('max')) {
      rules.max = [parseFloat(input.getAttribute('max'))];
    }
    
    if (input.hasAttribute('pattern')) {
      rules.pattern = input.getAttribute('pattern');
    }
    
    if (input.hasAttribute('data-validate')) {
      const customRules = input.getAttribute('data-validate').split(',');
      customRules.forEach(rule => {
        const [ruleName, ...params] = rule.trim().split(':');
        if (validators[ruleName]) {
          rules[ruleName] = params.length > 0 ? params : true;
        }
      });
    }
    
    return rules;
  }

  /**
   * Initialize real-time validation for a form
   */
  function initFormValidation(form) {
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    
    inputs.forEach(input => {
      // Validate on blur
      input.addEventListener('blur', function() {
        const rules = getFieldRules(input);
        if (Object.keys(rules).length > 0) {
          validateField(input, rules);
        }
      });
      
      // Clear error state on input
      input.addEventListener('input', function() {
        const formGroup = input.closest('.form-group') || input.parentElement;
        if (formGroup.classList.contains('has-error')) {
          const rules = getFieldRules(input);
          if (Object.keys(rules).length > 0) {
            validateField(input, rules);
          }
        }
      });
    });
    
    // Validate on submit
    form.addEventListener('submit', function(e) {
      const result = validateForm(form);
      if (!result.valid) {
        e.preventDefault();
        
        // Focus first error field
        const firstError = form.querySelector('.has-error input, .has-error textarea, .has-error select');
        if (firstError) {
          firstError.focus();
          firstError.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        
        // Show notification
        if (typeof window.Notifications !== 'undefined') {
          window.Notifications.error(
            'Form Validation Error',
            `Please fix ${result.errors.length} error${result.errors.length > 1 ? 's' : ''} before submitting.`
          );
        }
        
        return false;
      }
    });
  }

  /**
   * Initialize validation for all forms on page
   */
  function initAllForms() {
    const forms = document.querySelectorAll('form[data-validate]');
    forms.forEach(form => {
      initFormValidation(form);
    });
  }

  // Auto-initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllForms);
  } else {
    initAllForms();
  }

  // Export
  window.FormValidation = {
    validateField,
    validateForm,
    initFormValidation,
    initAllForms,
    validators
  };

})();
