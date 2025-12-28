/**
 * Profile Component
 */

(function() {
  'use strict';

  function init(params) {
    loadProfile();
  }

  function loadProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    try {
      const currentUser = PMTwinData?.Sessions.getCurrentUser();
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
        return;
      }

      renderProfile(container, currentUser);
    } catch (error) {
      console.error('Error loading profile:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading profile. Please try again.</p>';
    }
  }

  function renderProfile(container, user) {
    const profile = user.profile || {};
    const identity = user.identity || {};
    const documents = user.documents || [];

    let html = `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-body">
          <h2 style="margin-bottom: 1rem;">Basic Information</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
            <div>
              <p><strong>Name:</strong> ${profile.name || user.email}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Mobile:</strong> ${user.mobile || 'Not provided'}</p>
              <p><strong>Role:</strong> ${user.role || 'N/A'}</p>
              <p><strong>User Type:</strong> ${user.userType || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Status:</strong> <span class="badge badge-${profile.status === 'approved' ? 'success' : 'warning'}">${profile.status || 'pending'}</span></p>
              <p><strong>Onboarding Stage:</strong> ${user.onboardingStage || 'N/A'}</p>
              <p><strong>Profile Completion:</strong> ${user.profileCompletionScore || 0}%</p>
              <p><strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Mobile Verified:</strong> ${user.mobileVerified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </div>
    `;

    // Identity Information
    if (Object.keys(identity).length > 0) {
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Identity Information</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
      `;
      
      Object.keys(identity).forEach(key => {
        if (identity[key]) {
          html += `<p><strong>${key.replace(/([A-Z])/g, ' $1').trim()}:</strong> ${identity[key]}</p>`;
        }
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    }

    // Documents
    if (documents.length > 0) {
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 style="margin-bottom: 1rem;">Documents</h2>
            <div style="display: grid; gap: 1rem;">
      `;
      
      documents.forEach(doc => {
        html += `
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: 4px;">
            <div>
              <p style="margin: 0;"><strong>${doc.type || 'Document'}</strong></p>
              <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                ${doc.fileName || 'N/A'} • ${doc.fileSize ? (doc.fileSize / 1024).toFixed(2) + ' KB' : 'N/A'}
              </p>
            </div>
            <span class="badge badge-${doc.verified ? 'success' : 'warning'}">
              ${doc.verified ? 'Verified' : 'Pending'}
            </span>
          </div>
        `;
      });
      
      html += `
            </div>
          </div>
        </div>
      `;
    }

    // Action Buttons
    html += `
      <div style="display: flex; gap: 1rem;">
        <button onclick="profileComponent.editProfile()" class="btn btn-primary">Edit Profile</button>
        ${user.onboardingStage !== 'approved' ? `
          <a href="#onboarding" class="btn btn-success">Complete Profile</a>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  function editProfile() {
    // Navigate to profile edit page or show edit form
    alert('Profile editing feature coming soon!');
  }

  // Export
  if (!window.profile) window.profile = {};
  window.profile.profile = {
    init,
    loadProfile,
    editProfile
  };

  // Global reference for onclick handlers
  window.profileComponent = window.profile.profile;

})();

