/**
 * PMTwin Onboarding Module
 * Handles progressive profile completion, profile sections management, and onboarding UI
 */

(function() {
  'use strict';

  let currentUser = null;

  // ============================================
  // Profile Completion Dashboard
  // ============================================
  function renderProfileCompletionDashboard(user) {
    if (!user) {
      console.error('User not provided for profile completion dashboard');
      return '';
    }

    const userType = user.userType || (user.role === 'entity' ? 'company' : 'consultant');
    const completionScore = PMTwinData.calculateProfileCompletionScore(user);
    const progress = user.onboardingProgress || PMTwinData.calculateOnboardingProgress(userType, user.onboardingStage, user);

    // Get section completion status
    const sections = getProfileSections(userType);
    const sectionStatus = sections.map(section => ({
      ...section,
      completed: user.profileSections?.[section.id]?.completed || false,
      completionDate: user.profileSections?.[section.id]?.completionDate || null
    }));

    let html = `
      <div class="onboarding-dashboard">
        <div class="dashboard-header">
          <h2>Complete Your Profile</h2>
          <p>Your profile is ${completionScore}% complete</p>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${completionScore}%"></div>
          </div>
          <div class="progress-text">${completionScore}% Complete</div>
        </div>

        <div class="sections-grid">
    `;

    sectionStatus.forEach((section, index) => {
      const icon = section.completed ? '✓' : '○';
      const statusClass = section.completed ? 'completed' : 'incomplete';
      const requiredBadge = section.required ? '<span class="badge badge-required">Required</span>' : '<span class="badge badge-optional">Optional</span>';

      html += `
        <div class="section-card ${statusClass}" data-section="${section.id}">
          <div class="section-header">
            <div class="section-icon">${icon}</div>
            <div class="section-title-group">
              <h3>${section.name}</h3>
              ${requiredBadge}
            </div>
          </div>
          <p class="section-description">${section.description}</p>
          ${section.completed ? `
            <div class="section-completed">
              <span>Completed on ${new Date(section.completionDate).toLocaleDateString()}</span>
            </div>
          ` : `
            <button class="btn btn-primary btn-sm" onclick="OnboardingUI.openSection('${section.id}')">
              Complete Section
            </button>
          `}
        </div>
      `;
    });

    html += `
        </div>

        ${completionScore >= 70 ? `
          <div class="submit-section">
            <button class="btn btn-success btn-lg" onclick="OnboardingUI.submitForReview()">
              Submit Profile for Review
            </button>
            <p class="submit-help">Your profile meets the minimum requirements for submission</p>
          </div>
        ` : `
          <div class="submit-section">
            <button class="btn btn-secondary btn-lg" disabled>
              Complete More Sections to Submit
            </button>
            <p class="submit-help">You need at least 70% completion to submit for review</p>
          </div>
        `}
      </div>
    `;

    return html;
  }

  // ============================================
  // Profile Sections Configuration
  // ============================================
  function getProfileSections(userType) {
    if (userType === 'company') {
      return [
        {
          id: 'basicInfo',
          name: 'Basic Company Information',
          description: 'Company name, description, location, website',
          required: true
        },
        {
          id: 'branches',
          name: 'Branches and Locations',
          description: 'Add branch offices and locations',
          required: false
        },
        {
          id: 'teamMembers',
          name: 'Team Members',
          description: 'Add team members and assigned roles',
          required: false
        },
        {
          id: 'certifications',
          name: 'Safety and Compliance Certifications',
          description: 'Upload safety and compliance certifications',
          required: false
        },
        {
          id: 'portfolio',
          name: 'Portfolio',
          description: 'Add portfolio items and project descriptions',
          required: false
        },
        {
          id: 'projects',
          name: 'Past Projects',
          description: 'Add detailed project history',
          required: false
        },
        {
          id: 'references',
          name: 'Client References',
          description: 'Add client reference contacts',
          required: false
        }
      ];
    } else {
      return [
        {
          id: 'basicInfo',
          name: 'Basic Information',
          description: 'Name, contact information, bio',
          required: true
        },
        {
          id: 'skills',
          name: 'Skills and Competencies',
          description: 'Add your skills and expertise areas',
          required: true
        },
        {
          id: 'certifications',
          name: 'Certifications',
          description: 'Add professional certifications',
          required: false
        },
        {
          id: 'resume',
          name: 'Resume/CV',
          description: 'Upload your resume or CV',
          required: true
        },
        {
          id: 'experience',
          name: 'Years of Experience',
          description: 'Enter your years of professional experience',
          required: true
        },
        {
          id: 'portfolio',
          name: 'Portfolio',
          description: 'Add portfolio items and project descriptions',
          required: false
        },
        {
          id: 'projects',
          name: 'Past Projects',
          description: 'Add detailed project history',
          required: false
        },
        {
          id: 'references',
          name: 'Client References',
          description: 'Add client reference contacts',
          required: false
        }
      ];
    }
  }

  // ============================================
  // Section Management
  // ============================================
  function openSection(sectionId) {
    if (!currentUser) {
      alert('Please log in to complete your profile');
      return;
    }

    // This will be handled by the user portal to show the appropriate form
    window.location.hash = `#profile?section=${sectionId}`;
  }

  function markSectionComplete(sectionId) {
    if (!currentUser) return false;

    const user = PMTwinData.Users.getById(currentUser.id);
    if (!user) return false;

    const profileSections = user.profileSections || {};
    profileSections[sectionId] = {
      completed: true,
      completionDate: new Date().toISOString()
    };

    const updated = PMTwinData.Users.update(user.id, {
      profileSections: profileSections
    });

    return updated !== null;
  }

  // ============================================
  // Submit for Review
  // ============================================
  function submitForReview() {
    if (!currentUser) {
      alert('Please log in to submit your profile');
      return;
    }

    const user = PMTwinData.Users.getById(currentUser.id);
    if (!user) {
      alert('User not found');
      return;
    }

    // Validate submission
    const validation = PMTwinData.validateProfileSubmission(user);
    if (!validation.valid) {
      alert('Cannot submit profile:\n' + validation.errors.join('\n'));
      return;
    }

    // Confirm submission
    if (!confirm('Are you sure you want to submit your profile for review? You will not be able to edit it while under review.')) {
      return;
    }

    // Submit
    const result = PMTwinData.submitProfileForReview(user.id);
    if (result.success) {
      alert('Profile submitted successfully! You will be notified once it is reviewed.');
      // Refresh the page or update UI
      if (window.location.hash.includes('profile')) {
        window.location.hash = '#onboarding';
      }
      if (typeof window.OnboardingUI !== 'undefined' && window.OnboardingUI.renderDashboard) {
        window.OnboardingUI.renderDashboard();
      }
    } else {
      alert('Failed to submit profile: ' + (result.error || result.errors?.join(', ') || 'Unknown error'));
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.OnboardingUI = {
    init(user) {
      currentUser = user;
    },

    renderDashboard() {
      if (!currentUser) {
        const container = document.getElementById('onboardingContent');
        if (container) {
          container.innerHTML = '<p>Please log in to view your onboarding progress.</p>';
        }
        return;
      }

      const user = PMTwinData.Users.getById(currentUser.id);
      if (!user) {
        const container = document.getElementById('onboardingContent');
        if (container) {
          container.innerHTML = '<p>User not found.</p>';
        }
        return;
      }

      const container = document.getElementById('onboardingContent');
      if (container) {
        container.innerHTML = renderProfileCompletionDashboard(user);
      }
    },

    openSection,
    markSectionComplete,
    submitForReview,
    getProfileSections
  };

})();

