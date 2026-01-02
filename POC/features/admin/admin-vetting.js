/**
 * Admin Vetting Component - HTML triggers for AdminService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    // Set default filter to show all vetting statuses (pending, under_review, rejected)
    currentFilters = {
      status: 'all_vetting', // Special status to show all vetting-related users
      onboardingStage: '' // Show all stages
    };
    setupEventListeners();
    createRejectedTestDataIfNeeded();
    loadUsers();
  }

  function setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    // Update currentFilters with search term
    if (searchTerm.length >= 2) {
      currentFilters.search = searchTerm;
    } else {
      delete currentFilters.search;
    }
    
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
      container.innerHTML = '<p style="text-align: center; padding: 2rem;"><i class="ph ph-spinner ph-spin"></i> Loading users...</p>';

      let result;
      if (typeof AdminService !== 'undefined') {
        result = await AdminService.getUsersForVetting(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Admin service not available</p>';
        return;
      }

      if (result.success && result.users) {
        // Apply search filter if present
        let filteredUsers = result.users;
        if (currentFilters.search) {
          const searchTerm = currentFilters.search.toLowerCase();
          filteredUsers = result.users.filter(user => {
            const name = (user.profile?.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
          });
        }
        
        // Sort users: new registrations first, then by date
        const sortedUsers = filteredUsers.sort((a, b) => {
          const aIsNew = (a.onboardingStage === 'registered' || a.onboardingStage === 'under_review' || a.profile?.status === 'pending') && a.profile?.status !== 'approved';
          const bIsNew = (b.onboardingStage === 'registered' || b.onboardingStage === 'under_review' || b.profile?.status === 'pending') && b.profile?.status !== 'approved';
          
          if (aIsNew && !bIsNew) return -1;
          if (!aIsNew && bIsNew) return 1;
          
          // Both new or both not new, sort by date
          const aDate = new Date(a.profile?.createdAt || a.createdAt);
          const bDate = new Date(b.profile?.createdAt || b.createdAt);
          return bDate - aDate; // Newest first
        });
        
        renderUsers(container, sortedUsers);
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
    // If "All Vetting Statuses" is selected or empty, use all_vetting
    if (status === '' || status === 'all_vetting') {
      filters.status = 'all_vetting';
    } else if (status) {
      filters.status = status;
    } else {
      filters.status = 'all_vetting'; // Default to all vetting statuses
    }
    
    const stage = document.getElementById('onboardingStageFilter')?.value;
    if (stage) filters.onboardingStage = stage;
    
    const userType = document.getElementById('userTypeFilter')?.value;
    if (userType) filters.userType = userType;
    
    const dateFrom = document.getElementById('dateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('dateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    currentFilters = filters;
    await loadUsers();
  }

  function clearFilters() {
    currentFilters = { status: 'all_vetting' }; // Reset to show all vetting statuses
    const form = document.getElementById('vettingFiltersForm');
    if (form) {
      form.reset();
      // Set status back to all_vetting after reset
      const statusFilter = document.getElementById('userStatusFilter');
      if (statusFilter) {
        statusFilter.value = 'all_vetting';
      }
      // Clear search input
      const searchInput = document.getElementById('userSearch');
      if (searchInput) {
        searchInput.value = '';
      }
    }
    // Hide advanced filters
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      advancedFilters.style.display = 'none';
    }
    loadUsers();
  }

  function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
    }
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
        // Close modal if open
        const modal = document.getElementById('userReviewModal');
        if (modal) {
          modal.remove();
        }
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
        // Close modal if open
        const modal = document.getElementById('userReviewModal');
        if (modal) {
          modal.remove();
        }
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

    // Organize users by status: Pending, Under Review, Rejected
    // Priority: Rejected > Under Review > Pending
    
    const rejectedUsers = users.filter(u => 
      u.profile?.status === 'rejected' ||
      u.onboardingStage === 'rejected'
    );
    
    const underReviewUsers = users.filter(u => 
      (u.onboardingStage === 'under_review' ||
       (u.profile?.status === 'pending' && u.onboardingStage === 'under_review')) &&
      u.profile?.status !== 'rejected' &&
      u.onboardingStage !== 'rejected'
    );
    
    const pendingUsers = users.filter(u => 
      (u.profile?.status === 'pending' || 
       u.onboardingStage === 'registered' || 
       u.onboardingStage === 'profile_in_progress') &&
      u.profile?.status !== 'rejected' &&
      u.profile?.status !== 'approved' &&
      u.onboardingStage !== 'rejected' &&
      u.onboardingStage !== 'under_review'
    );

    let html = '';
    
    // Show Pending users first
    if (pendingUsers.length > 0) {
      html += `
        <div style="margin-bottom: 2.5rem;">
          <h2 style="margin-bottom: 1rem; color: var(--color-warning); display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-clock"></i> Pending Review (${pendingUsers.length})
          </h2>
          <div style="display: grid; gap: 1.5rem;">
            ${renderUserCards(pendingUsers, 'pending')}
          </div>
        </div>
      `;
    }
    
    // Show Under Review users
    if (underReviewUsers.length > 0) {
      html += `
        <div style="margin-bottom: 2.5rem;">
          <h2 style="margin-bottom: 1rem; color: var(--color-info); display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-file-magnifying-glass"></i> Under Review (${underReviewUsers.length})
          </h2>
          <div style="display: grid; gap: 1.5rem;">
            ${renderUserCards(underReviewUsers, 'under_review')}
          </div>
        </div>
      `;
    }
    
    // Show Rejected users section (always show, even if empty)
    html += `
      <div style="margin-bottom: 2.5rem;">
        <h2 style="margin-bottom: 1rem; color: var(--color-error); display: flex; align-items: center; gap: 0.5rem;">
          <i class="ph ph-x-circle"></i> Rejected Users (${rejectedUsers.length})
        </h2>
        ${rejectedUsers.length > 0 ? `
          <div style="display: grid; gap: 1.5rem;">
            ${renderUserCards(rejectedUsers, 'rejected')}
          </div>
        ` : `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
              <i class="ph ph-x-circle" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
              <p style="margin: 0;">No rejected users found</p>
            </div>
          </div>
        `}
      </div>
    `;
    
    container.innerHTML = html;
  }

  function renderUserCards(users, sectionStatus = null) {
    return users.map(user => {
      const statusColors = {
        'approved': 'success',
        'rejected': 'error',
        'pending': 'warning',
        'under_review': 'info',
        'registered': 'warning'
      };
      
      // Format status display text
      const getStatusDisplay = (status) => {
        const statusMap = {
          'pending': 'PENDING',
          'under_review': 'UNDER REVIEW',
          'rejected': 'REJECTED',
          'approved': 'APPROVED',
          'registered': 'PENDING',
          'profile_in_progress': 'PENDING'
        };
        return statusMap[status] || status.toUpperCase();
      };
      
      // Use section status if provided, otherwise use user's status
      const status = sectionStatus || user.profile?.status || user.onboardingStage || 'unknown';
      const statusDisplay = getStatusDisplay(status);
      const documents = user.documents || {};
      const documentVerifications = user.documentVerifications || {};
      const comments = user.vettingComments || [];
      
      // Count verified documents
      const requiredDocs = user.userType === 'entity' 
        ? ['cr', 'vat', 'companyProfile']
        : ['professionalLicense', 'resume'];
      
      const verifiedCount = requiredDocs.filter(docType => 
        documentVerifications[docType]?.verified === true
      ).length;
      
      const totalDocs = requiredDocs.length;
      const hasDocuments = requiredDocs.some(docType => 
        documents[docType] && documents[docType].length > 0
      );
      
      return `
        <div class="card" style="border-left: 4px solid var(--color-${statusColors[status] || 'secondary'});">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${user.profile?.name || user.email}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${user.email} • ${user.userType || user.role} • Stage: ${user.onboardingStage || 'N/A'}
                </p>
                <div style="margin: 0.5rem 0 0 0; font-size: 0.85rem; display: flex; flex-wrap: wrap; gap: 1rem;">
                  <div>
                    <strong>Registered:</strong> ${formatDate(user.profile?.createdAt || user.createdAt)}
                  </div>
                  ${user.review?.submittedAt ? `
                    <div>
                      <strong>Submitted:</strong> ${formatDate(user.review.submittedAt)}
                    </div>
                  ` : ''}
                  ${user.review?.reviewedAt ? `
                    <div>
                      <strong>Last Reviewed:</strong> ${formatDate(user.review.reviewedAt)}
                    </div>
                  ` : ''}
                  ${user.profile?.approvedAt ? `
                    <div style="color: var(--color-success);">
                      <strong>Approved:</strong> ${formatDate(user.profile.approvedAt)}
                    </div>
                  ` : ''}
                  ${user.profile?.rejectedAt ? `
                    <div style="color: var(--color-error);">
                      <strong>Rejected:</strong> ${formatDate(user.profile.rejectedAt)}
                      ${user.profile?.rejectionReason ? `<br><small>Reason: ${user.profile.rejectionReason}</small>` : ''}
                    </div>
                  ` : ''}
                  ${user.updatedAt ? `
                    <div>
                      <strong>Last Updated:</strong> ${formatDate(user.updatedAt)}
                    </div>
                  ` : ''}
                </div>
              </div>
              <span class="badge badge-${statusColors[status] || 'secondary'}">
                ${statusDisplay}
              </span>
            </div>
            
            ${sectionStatus === 'rejected' && user.profile?.rejectionReason ? `
              <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(220, 53, 69, 0.1); border-left: 4px solid var(--color-error); border-radius: var(--radius-sm);">
                <strong style="color: var(--color-error); display: block; margin-bottom: 0.5rem;">
                  <i class="ph ph-warning"></i> Rejection Reason:
                </strong>
                <p style="margin: 0; color: var(--text-secondary);">${user.profile.rejectionReason}</p>
                ${user.profile?.rejectedBy ? `
                  <small style="color: var(--text-secondary); margin-top: 0.5rem; display: block;">
                    Rejected by: ${PMTwinData?.Users?.getById(user.profile.rejectedBy)?.profile?.name || user.profile.rejectedBy || 'Admin'}
                  </small>
                ` : ''}
              </div>
            ` : ''}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-sm);">
              <div>
                <strong>Profile Completion:</strong><br>
                <span style="font-size: 1.2rem; font-weight: bold;">${user.profileCompletionScore || 0}%</span>
              </div>
              <div>
                <strong>Email Verified:</strong><br>
                <span class="badge badge-${user.emailVerified ? 'success' : 'warning'}">
                  ${user.emailVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <strong>Mobile Verified:</strong><br>
                <span class="badge badge-${user.mobileVerified ? 'success' : 'warning'}">
                  ${user.mobileVerified ? 'Yes' : 'No'}
                </span>
              </div>
              <div>
                <strong>Documents:</strong><br>
                <span>${verifiedCount}/${totalDocs} Verified</span>
                ${!hasDocuments ? '<br><small style="color: var(--color-error);">Missing documents</small>' : ''}
              </div>
              ${comments.length > 0 ? `
                <div>
                  <strong>Comments:</strong><br>
                  <span class="badge badge-info">${comments.length}</span>
                </div>
              ` : ''}
            </div>
            
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              <button onclick="adminVettingComponent.viewUserDetails('${user.id}')" class="btn btn-primary btn-sm">
                <i class="ph ph-eye"></i> Review Details
              </button>
              ${(user.onboardingStage === 'under_review' || user.profile?.status === 'pending' || user.onboardingStage === 'registered') ? `
                <button onclick="adminVettingComponent.approveUser('${user.id}')" class="btn btn-success btn-sm">
                  <i class="ph ph-check-circle"></i> Approve
                </button>
                <button onclick="adminVettingComponent.rejectUser('${user.id}')" class="btn btn-danger btn-sm">
                  <i class="ph ph-x-circle"></i> Reject
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  async function viewUserDetails(userId) {
    // Check RBAC permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('vet_users');
      if (!hasPermission) {
        alert('You do not have permission to view user details');
        return;
      }
    } else {
      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'platform_admin')) {
        alert('You do not have permission to view user details');
        return;
      }
    }

    // Show detailed user review modal
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found');
      return;
    }
    
    showUserReviewModal(user);
  }

  function showUserReviewModal(user) {
    // Remove existing modal if present
    const existingModal = document.getElementById('userReviewModal');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop show';
    modalBackdrop.id = 'userReviewModalBackdrop';
    
    // Create modal for detailed user review
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'userReviewModal';
    
    const documents = user.documents || {};
    const documentVerifications = user.documentVerifications || {};
    const comments = Array.isArray(user.vettingComments) ? user.vettingComments : [];
    
    // Determine required documents based on user type
    const requiredDocs = user.userType === 'entity' 
      ? ['cr', 'vat', 'companyProfile']
      : ['professionalLicense', 'resume'];
    
    let documentsHtml = '';
    requiredDocs.forEach(docType => {
      const docFiles = Array.isArray(documents[docType]) ? documents[docType] : (documents[docType] ? [documents[docType]] : []);
      const verification = documentVerifications[docType];
      const isVerified = verification?.verified === true;
      const isRejected = verification?.verified === false;
      
      documentsHtml += `
        <div class="card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <h4 style="margin: 0;">${getDocumentLabel(docType)}</h4>
              ${verification ? `
                <span class="badge badge-${isVerified ? 'success' : 'error'}">
                  ${isVerified ? 'Verified' : 'Rejected'}
                </span>
              ` : '<span class="badge badge-warning">Pending Review</span>'}
            </div>
            ${docFiles.length > 0 ? `
              <div style="margin-bottom: 0.5rem;">
                ${docFiles.map((file, idx) => `
                  <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
                    <div>
                      <i class="ph ph-file-text"></i> ${file.name || 'Document ' + (idx + 1)}
                      ${file.size ? ` <small>(${formatFileSize(file.size)})</small>` : ''}
                    </div>
                    <button onclick="adminVettingComponent.viewDocument('${user.id}', '${docType}', ${idx})" class="btn btn-sm btn-primary">
                      View
                    </button>
                  </div>
                `).join('')}
              </div>
            ` : '<p style="color: var(--text-secondary);">No documents uploaded</p>'}
            ${verification ? `
              <div style="padding: 0.5rem; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-top: 0.5rem;">
                <small>
                  <strong>Verified by:</strong> ${verification.verifiedByName || 'Admin'}<br>
                  <strong>Date:</strong> ${formatDate(verification.verifiedAt)}<br>
                  ${verification.notes ? `<strong>Notes:</strong> ${verification.notes}` : ''}
                </small>
              </div>
            ` : ''}
            <div style="display: flex; gap: 0.5rem; margin-top: 0.5rem;">
              <button onclick="adminVettingComponent.verifyDocument('${user.id}', '${docType}', true)" class="btn btn-sm btn-success">
                <i class="ph ph-check"></i> Verify
              </button>
              <button onclick="adminVettingComponent.verifyDocument('${user.id}', '${docType}', false)" class="btn btn-sm btn-danger">
                <i class="ph ph-x"></i> Reject
              </button>
            </div>
          </div>
        </div>
      `;
    });
    
    let commentsHtml = '';
    if (comments.length > 0) {
      commentsHtml = comments.map(comment => `
        <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-sm); margin-bottom: 0.5rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <strong>${comment.addedByName || 'Admin'}</strong>
            <small style="color: var(--text-secondary);">
              ${formatDate(comment.addedAt)}
              ${getDaysSince(comment.addedAt) !== null ? ` (${getDaysSince(comment.addedAt)} days ago)` : ''}
            </small>
          </div>
          <p style="margin: 0;">${escapeHtml(comment.comment)}</p>
        </div>
      `).join('');
    }
    
    modal.innerHTML = `
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h2 class="modal-title">Review User: ${user.profile?.name || user.email}</h2>
        <button class="modal-close" onclick="document.getElementById('userReviewModalBackdrop').remove()">&times;</button>
      </div>
        
        <div class="modal-body">
          <!-- User Information -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-body">
              <h3 style="margin-bottom: 1rem;">User Information</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem;">
                <div>
                  <strong>Name:</strong> ${user.profile?.name || 'N/A'}<br>
                  <strong>Email:</strong> ${user.email}<br>
                  <strong>Mobile:</strong> ${user.mobile || 'N/A'}<br>
                  <strong>User Type:</strong> ${user.userType || user.role}
                </div>
                <div>
                  <strong>Status:</strong> <span class="badge badge-${getStatusColor(user.profile?.status || user.onboardingStage)}">${user.profile?.status || user.onboardingStage}</span><br>
                  <strong>Email Verified:</strong> ${user.emailVerified ? 'Yes' : 'No'}<br>
                  <strong>Mobile Verified:</strong> ${user.mobileVerified ? 'Yes' : 'No'}<br>
                  <strong>Onboarding Stage:</strong> ${user.onboardingStage || 'N/A'}
                </div>
              </div>
              
              <!-- Date Information -->
              <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
                <h4 style="margin-bottom: 0.75rem; font-size: 1rem;">Timeline</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.9rem;">
                  <div>
                    <strong>Registration Date:</strong><br>
                    ${formatDate(user.profile?.createdAt || user.createdAt)}
                    ${getDaysSince(user.profile?.createdAt || user.createdAt) !== null ? `
                      <br><small style="color: var(--text-secondary);">${getDaysSince(user.profile?.createdAt || user.createdAt)} days ago</small>
                    ` : ''}
                  </div>
                  ${user.review?.submittedAt ? `
                    <div>
                      <strong>Submitted for Review:</strong><br>
                      ${formatDate(user.review.submittedAt)}
                      ${getDaysSince(user.review.submittedAt) !== null ? `
                        <br><small style="color: var(--text-secondary);">${getDaysSince(user.review.submittedAt)} days ago</small>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${user.review?.reviewedAt ? `
                    <div>
                      <strong>Last Reviewed:</strong><br>
                      ${formatDate(user.review.reviewedAt)}
                      ${user.review?.reviewedBy ? `
                        <br><small style="color: var(--text-secondary);">By: ${getReviewerName(user.review.reviewedBy)}</small>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${user.profile?.approvedAt ? `
                    <div style="color: var(--color-success);">
                      <strong>Approved:</strong><br>
                      ${formatDate(user.profile.approvedAt)}
                      ${user.profile?.approvedBy ? `
                        <br><small>By: ${getReviewerName(user.profile.approvedBy)}</small>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${user.profile?.rejectedAt ? `
                    <div style="color: var(--color-error);">
                      <strong>Rejected:</strong><br>
                      ${formatDate(user.profile.rejectedAt)}
                      ${user.profile?.rejectionReason ? `
                        <br><small>Reason: ${user.profile.rejectionReason}</small>
                      ` : ''}
                    </div>
                  ` : ''}
                  ${user.updatedAt ? `
                    <div>
                      <strong>Last Updated:</strong><br>
                      ${formatDate(user.updatedAt)}
                      ${getDaysSince(user.updatedAt) !== null ? `
                        <br><small style="color: var(--text-secondary);">${getDaysSince(user.updatedAt)} days ago</small>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
          
          <!-- Documents Review -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-body">
              <h3 style="margin-bottom: 1rem;">Documents Review</h3>
              ${documentsHtml || '<p>No documents to review</p>'}
            </div>
          </div>
          
          <!-- Comments Section -->
          <div class="card" style="margin-bottom: 1.5rem;">
            <div class="card-body">
              <h3 style="margin-bottom: 1rem;">Comments</h3>
              <div id="commentsList" style="margin-bottom: 1rem;">
                ${commentsHtml || '<p style="color: var(--text-secondary);">No comments yet</p>'}
              </div>
              <div style="display: flex; gap: 0.5rem;">
                <input type="text" id="newCommentInput" class="form-control" placeholder="Add a comment..." style="flex: 1;">
                <button onclick="adminVettingComponent.addComment('${user.id}')" class="btn btn-primary">
                  <i class="ph ph-plus"></i> Add Comment
                </button>
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: 1rem;">Actions</h3>
              <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button onclick="adminVettingComponent.approveUser('${user.id}')" class="btn btn-success">
                  <i class="ph ph-check-circle"></i> Approve User
                </button>
                <button onclick="adminVettingComponent.rejectUser('${user.id}')" class="btn btn-danger">
                  <i class="ph ph-x-circle"></i> Reject User
                </button>
                <button onclick="adminVettingComponent.requestDocuments('${user.id}')" class="btn btn-warning">
                  <i class="ph ph-file-plus"></i> Request Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to backdrop
    modalBackdrop.appendChild(modal);
    
    // Append backdrop to body
    document.body.appendChild(modalBackdrop);
    
    // Close on backdrop click
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    });
  }

  function getDocumentLabel(docType) {
    const labels = {
      'cr': 'Commercial Registration (CR)',
      'vat': 'VAT Certificate',
      'companyProfile': 'Company Profile',
      'professionalLicense': 'Professional License',
      'resume': 'CV/Resume',
      'additionalCerts': 'Additional Certifications',
      'additionalLicenses': 'Additional Licenses',
      'portfolioLink': 'Portfolio Link'
    };
    return labels[docType] || docType;
  }

  function getStatusColor(status) {
    const colors = {
      'approved': 'success',
      'rejected': 'error',
      'pending': 'warning',
      'under_review': 'info'
    };
    return colors[status] || 'secondary';
  }

  function formatFileSize(bytes) {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  }

  function formatDateShort(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  }

  function getDaysSince(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (e) {
      return null;
    }
  }

  function getReviewerName(reviewerId) {
    if (!reviewerId || !PMTwinData) return 'Unknown';
    const reviewer = PMTwinData.Users.getById(reviewerId);
    if (reviewer) {
      return reviewer.profile?.name || reviewer.email || 'Admin';
    }
    return 'Admin';
  }

  async function addComment(userId) {
    const input = document.getElementById('newCommentInput');
    if (!input || !input.value.trim()) {
      alert('Please enter a comment');
      return;
    }
    
    const comment = input.value.trim();
    
    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }
      
      const result = await AdminService.addCommentToUser(userId, comment);
      
      if (result.success) {
        input.value = '';
        // Reload user details to show new comment
        const user = PMTwinData.Users.getById(userId);
        if (user) {
          showUserReviewModal(user);
        }
      } else {
        alert(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error adding comment');
    }
  }

  async function verifyDocument(userId, documentType, verified) {
    const notes = prompt(verified ? 'Add verification notes (optional):' : 'Please provide rejection reason:');
    if (verified && notes === null) return; // User cancelled
    if (!verified && !notes) {
      alert('Rejection reason is required');
      return;
    }
    
    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }
      
      const result = await AdminService.verifyDocument(userId, documentType, verified, notes || null);
      
      if (result.success) {
        alert(verified ? 'Document verified successfully' : 'Document rejected');
        // Reload user details
        const user = PMTwinData.Users.getById(userId);
        if (user) {
          showUserReviewModal(user);
        }
      } else {
        alert(result.error || 'Failed to verify document');
      }
    } catch (error) {
      console.error('Error verifying document:', error);
      alert('Error verifying document');
    }
  }

  function viewDocument(userId, documentType, fileIndex) {
    const user = PMTwinData.Users.getById(userId);
    if (!user || !user.documents || !user.documents[documentType]) {
      alert('Document not found');
      return;
    }
    
    const file = user.documents[documentType][fileIndex];
    if (!file) {
      alert('File not found');
      return;
    }
    
    // For POC, show file info in alert. In production, this would open the file
    alert(`Document: ${file.name}\nType: ${file.type || 'Unknown'}\nSize: ${file.size ? formatFileSize(file.size) : 'Unknown'}\n\nNote: In production, this would open the document for viewing.`);
  }

  async function requestDocuments(userId) {
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found');
      return;
    }
    
    const requiredDocs = user.userType === 'entity' 
      ? ['cr', 'vat', 'companyProfile']
      : ['professionalLicense', 'resume'];
    
    const message = prompt('Enter message for the user requesting additional documents:');
    if (!message) {
      return;
    }
    
    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }
      
      const result = await AdminService.requestAdditionalDocuments(userId, requiredDocs, message);
      
      if (result.success) {
        alert('Document request sent to user');
        // Reload user details
        showUserReviewModal(user);
      } else {
        alert(result.error || 'Failed to request documents');
      }
    } catch (error) {
      console.error('Error requesting documents:', error);
      alert('Error requesting documents');
    }
  }

  // ============================================
  // Test Data Creation for Rejected Users
  // ============================================

  async function createRejectedTestDataIfNeeded() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) return;

    const users = PMTwinData.Users.getAll();
    const rejectedUsers = users.filter(u => 
      u.profile?.status === 'rejected' || u.onboardingStage === 'rejected'
    );

    // Only create test data if we have less than 3 rejected users
    if (rejectedUsers.length < 3) {
      await createRejectedTestUsers();
    }
  }

  async function createRejectedTestUsers() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) return;

    const testRejectedUsers = [
      {
        email: 'test.rejected1@pmtwin.com',
        password: btoa('Test123!'),
        role: 'professional',
        userType: 'individual',
        profile: {
          name: 'Rejected User 1',
          status: 'rejected',
          rejectedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          rejectedBy: 'admin@pmtwin.com',
          rejectionReason: 'Incomplete documentation - Missing professional license',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'rejected',
        emailVerified: true,
        mobile: '+966506789012',
        mobileVerified: false
      },
      {
        email: 'test.rejected2@pmtwin.com',
        password: btoa('Test123!'),
        role: 'supplier',
        userType: 'entity',
        profile: {
          name: 'Rejected Company LLC',
          status: 'rejected',
          rejectedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          rejectedBy: 'admin@pmtwin.com',
          rejectionReason: 'Invalid Commercial Registration - Document expired',
          createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'rejected',
        emailVerified: true,
        mobile: '+966507890123',
        mobileVerified: true
      },
      {
        email: 'test.rejected3@pmtwin.com',
        password: btoa('Test123!'),
        role: 'consultant',
        userType: 'individual',
        profile: {
          name: 'Dr. Rejected Consultant',
          status: 'rejected',
          rejectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          rejectedBy: 'admin@pmtwin.com',
          rejectionReason: 'Profile information does not match submitted documents',
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'rejected',
        emailVerified: true,
        mobile: '+966508901234',
        mobileVerified: true
      }
    ];

    for (const userData of testRejectedUsers) {
      // Check if user already exists
      const existing = PMTwinData.Users.getByEmail(userData.email);
      if (!existing) {
        try {
          PMTwinData.Users.create(userData);
        } catch (error) {
          console.error('Error creating rejected test user:', userData.email, error);
        }
      }
    }

    // Reload users after creating test data
    setTimeout(() => {
      loadUsers();
    }, 500);
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-vetting'] = {
    init,
    loadUsers,
    applyFilters,
    clearFilters,
    toggleAdvancedFilters,
    approveUser,
    rejectUser,
    viewUserDetails,
    showUserReviewModal,
    addComment,
    verifyDocument,
    viewDocument,
    requestDocuments,
    createRejectedTestUsers
  };

  // Global reference for onclick handlers
  window.adminVettingComponent = window.admin['admin-vetting'];

})();

