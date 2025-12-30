/**
 * Onboarding Component
 */

(function() {
  'use strict';

  function init(params) {
    loadOnboarding();
  }

  function loadOnboarding() {
    const progressContainer = document.getElementById('onboardingProgress');
    const stepsContainer = document.getElementById('onboardingSteps');
    
    if (!progressContainer || !stepsContainer) return;

    try {
      const currentUser = PMTwinData?.Sessions.getCurrentUser();
      if (!currentUser) {
        stepsContainer.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
        return;
      }

      // Show progress
      const progress = currentUser.onboardingProgress || { percentage: 0 };
      progressContainer.innerHTML = `
        <h3 style="margin-bottom: 1rem;">Profile Completion: ${progress.percentage || 0}%</h3>
        <div style="background: var(--bg-secondary); height: 20px; border-radius: 10px; overflow: hidden;">
          <div style="background: var(--primary); height: 100%; width: ${progress.percentage || 0}%; transition: width 0.3s;"></div>
        </div>
        ${progress.nextSteps && progress.nextSteps.length > 0 ? `
          <div style="margin-top: 1rem;">
            <p><strong>Next Steps:</strong></p>
            <ul>
              ${progress.nextSteps.map(step => `<li>${step}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      `;

      // Show onboarding steps based on user type
      renderOnboardingSteps(stepsContainer, currentUser);
    } catch (error) {
      console.error('Error loading onboarding:', error);
      stepsContainer.innerHTML = '<p class="alert alert-error">Error loading onboarding. Please try again.</p>';
    }
  }

  function renderOnboardingSteps(container, user) {
    const userType = user.userType || user.role;
    const steps = getStepsForUserType(userType);

    let html = '<div style="display: grid; gap: 1.5rem;">';

    steps.forEach((step, index) => {
      const isCompleted = checkStepCompletion(user, step.id);
      html += `
        <div class="card" style="${isCompleted ? 'border-left: 4px solid var(--success);' : ''}">
          <div class="card-body">
            <div style="display: flex; align-items: start; gap: 1rem;">
              <div style="font-size: 2rem;">${isCompleted ? '<i class="ph ph-check-circle" style="color: var(--success, #10b981);"></i>' : '<i class="ph ph-hourglass" style="color: var(--text-secondary, #6b7280);"></i>'}</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">Step ${index + 1}: ${step.title}</h3>
                <p style="margin: 0 0 1rem 0; color: var(--text-secondary);">${step.description}</p>
                ${!isCompleted ? `
                  <button onclick="onboardingComponent.completeStep('${step.id}')" class="btn btn-primary btn-sm">
                    ${step.actionLabel || 'Complete'}
                  </button>
                ` : '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Completed</span>'}
              </div>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function getStepsForUserType(userType) {
    const stepsMap = {
      'company': [
        { id: 'verify_email', title: 'Verify Email', description: 'Verify your email address', actionLabel: 'Verify Email' },
        { id: 'verify_mobile', title: 'Verify Mobile', description: 'Verify your mobile number', actionLabel: 'Verify Mobile' },
        { id: 'identity', title: 'Complete Identity', description: 'Provide legal entity name, CR number, tax number', actionLabel: 'Complete Identity' },
        { id: 'documents', title: 'Upload Documents', description: 'Upload CR and VAT certificates', actionLabel: 'Upload Documents' },
        { id: 'profile', title: 'Complete Profile', description: 'Fill in company profile information', actionLabel: 'Complete Profile' },
        { id: 'submit', title: 'Submit for Review', description: 'Submit your profile for admin approval', actionLabel: 'Submit for Review' }
      ],
      'individual': [
        { id: 'verify_email', title: 'Verify Email', description: 'Verify your email address', actionLabel: 'Verify Email' },
        { id: 'verify_mobile', title: 'Verify Mobile', description: 'Verify your mobile number', actionLabel: 'Verify Mobile' },
        { id: 'identity', title: 'Complete Identity', description: 'Provide your full legal name and ID', actionLabel: 'Complete Identity' },
        { id: 'profile', title: 'Complete Profile', description: 'Fill in your professional profile', actionLabel: 'Complete Profile' },
        { id: 'submit', title: 'Submit for Review', description: 'Submit your profile for admin approval', actionLabel: 'Submit for Review' }
      ],
      'consultant': [
        { id: 'verify_email', title: 'Verify Email', description: 'Verify your email address', actionLabel: 'Verify Email' },
        { id: 'verify_mobile', title: 'Verify Mobile', description: 'Verify your mobile number', actionLabel: 'Verify Mobile' },
        { id: 'identity', title: 'Complete Identity', description: 'Provide your full legal name and ID', actionLabel: 'Complete Identity' },
        { id: 'documents', title: 'Upload Documents', description: 'Upload professional license and CV', actionLabel: 'Upload Documents' },
        { id: 'profile', title: 'Complete Profile', description: 'Fill in your professional profile', actionLabel: 'Complete Profile' },
        { id: 'submit', title: 'Submit for Review', description: 'Submit your profile for admin approval', actionLabel: 'Submit for Review' }
      ]
    };

    return stepsMap[userType] || stepsMap['individual'];
  }

  function checkStepCompletion(user, stepId) {
    switch (stepId) {
      case 'verify_email':
        return user.emailVerified === true;
      case 'verify_mobile':
        return user.mobileVerified === true;
      case 'identity':
        const identity = user.identity || {};
        if (user.userType === 'company') {
          return identity.legalEntityName && identity.crNumber && identity.taxNumber;
        } else {
          return identity.fullLegalName && (identity.nationalId || identity.passportNumber);
        }
      case 'documents':
        const documents = user.documents || [];
        if (user.userType === 'company') {
          return documents.some(d => d.type === 'cr') && documents.some(d => d.type === 'vat');
        } else {
          return documents.some(d => d.type === 'license') && documents.some(d => d.type === 'cv');
        }
      case 'profile':
        return user.profileCompletionScore >= 70;
      case 'submit':
        return user.onboardingStage === 'under_review' || user.onboardingStage === 'approved';
      default:
        return false;
    }
  }

  function completeStep(stepId) {
    const currentUser = PMTwinData?.Sessions.getCurrentUser();
    if (!currentUser) {
      alert('User not authenticated');
      return;
    }

    switch (stepId) {
      case 'verify_email':
        alert('Please check your email for verification code');
        // Email verification handled in onboarding flow
        break;
      case 'verify_mobile':
        alert('Please check your mobile for verification code');
        // Mobile verification handled in onboarding flow
        break;
      case 'identity':
      case 'documents':
      case 'profile':
        alert('Please complete this section in your profile');
        window.location.href = '../profile/';
        break;
      case 'submit':
        if (typeof PMTwinData !== 'undefined' && PMTwinData.submitProfileForReview) {
          const result = PMTwinData.submitProfileForReview(currentUser.id);
          if (result.success) {
            alert('Profile submitted for review!');
            loadOnboarding();
          } else {
            alert(result.errors ? result.errors.join(', ') : 'Failed to submit profile');
          }
        } else {
          alert('Profile submission service not available');
        }
        break;
      default:
        alert('Step not recognized');
    }
  }

  // Export
  if (!window.onboarding) window.onboarding = {};
  window.onboarding.onboarding = {
    init,
    loadOnboarding,
    completeStep
  };

  // Global reference for onclick handlers
  window.onboardingComponent = window.onboarding.onboarding;

})();

