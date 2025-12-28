/**
 * Admin Vetting Component - HTML triggers for AdminService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadUsers();
  }

  // ============================================
  // HTML Triggers for AdminService Functions
  // ============================================

  // Trigger: getUsersForVetting(filters) - Load users for vetting
  async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading users...</p>';

      let result;
      if (typeof AdminService !== 'undefined') {
        result = await AdminService.getUsersForVetting(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Admin service not available</p>';
        return;
      }

      if (result.success && result.users) {
        renderUsers(container, result.users);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load users'}</p>`;
      }
    } catch (error) {
      console.error('Error loading users:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading users. Please try again.</p>';
    }
  }

  // Trigger: getUsersForVetting(filters) - Apply filters
  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const status = document.getElementById('userStatusFilter')?.value;
    if (status) filters.status = status;
    
    const stage = document.getElementById('onboardingStageFilter')?.value;
    if (stage) filters.onboardingStage = stage;
    
    currentFilters = filters;
    await loadUsers();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('vettingFiltersForm')?.reset();
    loadUsers();
  }

  // Trigger: approveUser(userId, notes) - Approve user
  async function approveUser(userId) {
    const notes = prompt('Add approval notes (optional):');
    if (notes === null && notes !== '') return; // User cancelled

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.approveUser(userId, notes || null);
      
      if (result.success) {
        alert('User approved successfully!');
        await loadUsers();
      } else {
        alert(result.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  }

  // Trigger: rejectUser(userId, reason, notes) - Reject user
  async function rejectUser(userId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) {
      alert('Rejection reason is required');
      return;
    }

    const notes = prompt('Add additional notes (optional):');
    if (notes === null && reason) return; // User cancelled notes but reason provided

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.rejectUser(userId, reason, notes || null);
      
      if (result.success) {
        alert('User rejected');
        await loadUsers();
      } else {
        alert(result.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderUsers(container, users) {
    if (users.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No users found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    users.forEach(user => {
      const statusColors = {
        'approved': 'success',
        'rejected': 'error',
        'pending': 'warning'
      };
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${user.profile?.name || user.email}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${user.email} • ${user.userType || user.role} • Stage: ${user.onboardingStage || 'N/A'}
                </p>
              </div>
              <span class="badge badge-${statusColors[user.profile?.status || user.onboardingStage] || 'secondary'}">
                ${user.profile?.status || user.onboardingStage || 'unknown'}
              </span>
            </div>
            
            <div style="margin-bottom: 1rem;">
              <p><strong>Profile Completion:</strong> ${user.profileCompletionScore || 0}%</p>
              <p><strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}</p>
              <p><strong>Mobile Verified:</strong> ${user.mobileVerified ? 'Yes' : 'No'}</p>
            </div>
            
            ${user.onboardingStage === 'under_review' || user.profile?.status === 'pending' ? `
              <div style="display: flex; gap: 1rem;">
                <button onclick="adminVettingComponent.approveUser('${user.id}')" class="btn btn-success btn-sm">
                  Approve
                </button>
                <button onclick="adminVettingComponent.rejectUser('${user.id}')" class="btn btn-danger btn-sm">
                  Reject
                </button>
                <button onclick="adminVettingComponent.viewUserDetails('${user.id}')" class="btn btn-primary btn-sm">
                  View Details
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function viewUserDetails(userId) {
    window.location.hash = `#admin-user/${userId}`;
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-vetting'] = {
    init,
    loadUsers,
    applyFilters,
    clearFilters,
    approveUser,
    rejectUser,
    viewUserDetails
  };

  // Global reference for onclick handlers
  window.adminVettingComponent = window.admin['admin-vetting'];

})();

