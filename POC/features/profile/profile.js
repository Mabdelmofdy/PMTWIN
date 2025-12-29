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
              <p><strong>Profile Score:</strong> ${user.profileCompletionScore || 0}%</p>
              ${renderProfileScoreBreakdown(user)}
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
          <a href="../onboarding/" class="btn btn-success">Complete Profile</a>
        ` : ''}
      </div>
    `;

    container.innerHTML = html;
  }

  function editProfile() {
    // Navigate to profile edit page or show edit form
    alert('Profile editing feature coming soon!');
  }

  function renderProfileScoreBreakdown(user) {
    if (!user || !PMTwinData) return '';
    
    try {
      const scoreData = PMTwinData.calculateProfileCompletionScore(user);
      if (typeof scoreData !== 'object' || !scoreData) return '';
      
      const completionScore = scoreData.completionScore || 0;
      const verificationScore = scoreData.verificationScore || 0;
      const totalScore = scoreData.score || 0;
      
      return `
        <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: 4px;">
          <h3 style="margin: 0 0 1rem 0; font-size: 1rem;">Profile Score Breakdown</h3>
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>Completion Score (60%):</span>
              <strong>${completionScore}%</strong>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
              <div style="width: ${completionScore}%; height: 100%; background: var(--primary); transition: width 0.3s;"></div>
            </div>
          </div>
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
              <span>Verification Score (40%):</span>
              <strong>${verificationScore}%</strong>
            </div>
            <div style="width: 100%; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;">
              <div style="width: ${verificationScore}%; height: 100%; background: var(--success); transition: width 0.3s;"></div>
            </div>
          </div>
          <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <div style="display: flex; justify-content: space-between;">
              <span><strong>Total Profile Score:</strong></span>
              <strong style="font-size: 1.2rem; color: ${totalScore >= 80 ? 'var(--success)' : totalScore >= 60 ? 'var(--warning)' : 'var(--error)'};">${totalScore}%</strong>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering profile score breakdown:', error);
      return '';
    }
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

