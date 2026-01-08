/**
 * Admin Users Management Component
 * Handles enhanced user management UI for admin portal
 */

(function() {
  'use strict';

  let currentFilters = { status: 'approved_and_suspended' }; // Default: show approved and suspended users
  let selectedUsers = new Set(); // Track selected users for bulk operations

  function init(params) {
    // Set default status filter to approved_and_suspended
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.value = 'approved_and_suspended';
    }
    setupEventListeners();
    // Wait a bit for PMTwinData to be ready, then create test data and load users
    setTimeout(async () => {
      await createTestDataIfNeeded();
      loadUsers();
      renderStatistics();
    }, 500);
  }

  function setupEventListeners() {
    // Filter form - auto-apply on change
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', applyFilters);
    }

    const userTypeFilter = document.getElementById('userTypeFilter');
    if (userTypeFilter) {
      userTypeFilter.addEventListener('change', applyFilters);
    }

    const roleFilter = document.getElementById('roleFilter');
    if (roleFilter) {
      roleFilter.addEventListener('change', applyFilters);
    }

    const verificationFilter = document.getElementById('verificationFilter');
    if (verificationFilter) {
      verificationFilter.addEventListener('change', applyFilters);
    }

    const activityFilter = document.getElementById('activityFilter');
    if (activityFilter) {
      activityFilter.addEventListener('change', applyFilters);
    }

    const dateFromFilter = document.getElementById('dateFromFilter');
    if (dateFromFilter) {
      dateFromFilter.addEventListener('change', applyFilters);
    }

    const dateToFilter = document.getElementById('dateToFilter');
    if (dateToFilter) {
      dateToFilter.addEventListener('change', applyFilters);
    }

    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
      sortBy.addEventListener('change', applyFilters);
    }

    const sortOrder = document.getElementById('sortOrder');
    if (sortOrder) {
      sortOrder.addEventListener('change', applyFilters);
    }

    // Clear filters button
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
      clearBtn.addEventListener('click', clearFilters);
    }

    // Search input
    const searchInput = document.getElementById('userSearch');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
  }

  async function loadUsers() {
    const container = document.getElementById('usersList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading users...</p>';

      if (typeof AdminService === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Admin service not available</p>';
        return;
      }

      let result;
      // Handle approved_and_suspended filter
      if (currentFilters.status === 'approved_and_suspended') {
        // Get all users and filter for approved and suspended
        const allUsersResult = await AdminService.getAllUsers({});
        if (allUsersResult.success && allUsersResult.users) {
          const filtered = allUsersResult.users.filter(user => {
            const status = user.profile?.status || user.onboardingStage;
            return status === 'approved' || status === 'suspended';
          });
          result = { success: true, users: filtered };
        } else {
          result = allUsersResult;
        }
      } else {
        result = await AdminService.getAllUsers(currentFilters);
      }
      
      if (result.success && result.users) {
        let users = result.users;
        
        // Apply verification filter
        if (currentFilters.verification) {
          users = users.filter(user => {
            const isVerified = user.emailVerified && (user.mobileVerified || !user.mobile);
            if (currentFilters.verification === 'verified') return isVerified;
            if (currentFilters.verification === 'unverified') return !user.emailVerified;
            if (currentFilters.verification === 'pending_verification') return user.emailVerified && !user.mobileVerified && user.mobile;
            return true;
          });
        }
        
        // Apply activity filter
        if (currentFilters.activity) {
          const now = new Date();
          const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          users = users.filter(user => {
            const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt) : null;
            if (currentFilters.activity === 'active') return lastLogin && lastLogin >= thirtyDaysAgo;
            if (currentFilters.activity === 'inactive') return lastLogin && lastLogin < thirtyDaysAgo;
            if (currentFilters.activity === 'never_logged_in') return !lastLogin || !user.lastLoginAt;
            return true;
          });
        }
        
        // Apply sorting
        if (currentFilters.sortBy) {
          users.sort((a, b) => {
            let aVal, bVal;
            const order = currentFilters.sortOrder === 'desc' ? -1 : 1;
            
            switch (currentFilters.sortBy) {
              case 'name':
                aVal = (a.profile?.name || a.email || '').toLowerCase();
                bVal = (b.profile?.name || b.email || '').toLowerCase();
                break;
              case 'email':
                aVal = (a.email || '').toLowerCase();
                bVal = (b.email || '').toLowerCase();
                break;
              case 'registration_date':
                aVal = new Date(a.profile?.createdAt || a.createdAt || 0);
                bVal = new Date(b.profile?.createdAt || b.createdAt || 0);
                break;
              case 'last_login':
                aVal = a.lastLoginAt ? new Date(a.lastLoginAt) : new Date(0);
                bVal = b.lastLoginAt ? new Date(b.lastLoginAt) : new Date(0);
                break;
              case 'status':
                aVal = (a.profile?.status || a.onboardingStage || '').toLowerCase();
                bVal = (b.profile?.status || b.onboardingStage || '').toLowerCase();
                break;
              default:
                return 0;
            }
            
            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
            return 0;
          });
        }
        
        renderUsers(container, users);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load users'}</p>`;
      }
    } catch (error) {
      console.error('Error loading users:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading users</p>';
    }
  }

  function renderUsers(container, users) {
    if (users.length === 0) {
      container.innerHTML = '<p class="alert alert-info">No users found</p>';
      return;
    }

    // Separate users by status for better organization
    const approvedUsers = users.filter(u => {
      const status = u.profile?.status || u.onboardingStage;
      return status === 'approved';
    });
    
    const suspendedUsers = users.filter(u => {
      const status = u.profile?.status || u.onboardingStage;
      return status === 'suspended';
    });

    // If showing approved_and_suspended, organize by sections
    let html = '';
    
    if (currentFilters.status === 'approved_and_suspended' || currentFilters.status === '') {
      // Show Approved Users Section
      if (approvedUsers.length > 0) {
        html += `
          <div style="margin-bottom: 2.5rem;">
            <h2 style="margin-bottom: 1rem; color: var(--color-success); display: flex; align-items: center; gap: 0.5rem;">
              <i class="ph ph-check-circle"></i> Approved Users (${approvedUsers.length})
            </h2>
            <div style="overflow-x: auto;">
              <table class="table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 40px;"><input type="checkbox" id="selectAllApprovedCheckbox" onchange="if(window.admin && window.admin['admin-users-management']) { window.admin['admin-users-management'].toggleSelectAll(this.checked, 'approved'); }"></th>
                    <th>Name/Email</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Registration Date</th>
                    <th>Last Login</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
        `;
        
        approvedUsers.forEach(user => {
          html += renderUserRow(user);
        });
        
        html += `
                </tbody>
              </table>
            </div>
          </div>
        `;
      }
      
      // Show Suspended Users Section (always show, even if empty)
      html += `
        <div style="margin-bottom: 2.5rem;">
          <h2 style="margin-bottom: 1rem; color: var(--color-error); display: flex; align-items: center; gap: 0.5rem;">
            <i class="ph ph-lock"></i> Suspended Users (${suspendedUsers.length})
          </h2>
          ${suspendedUsers.length > 0 ? `
            <div style="overflow-x: auto;">
              <table class="table" style="width: 100%;">
                <thead>
                  <tr>
                    <th style="width: 40px;"><input type="checkbox" id="selectAllSuspendedCheckbox" onchange="if(window.admin && window.admin['admin-users-management']) { window.admin['admin-users-management'].toggleSelectAll(this.checked, 'suspended'); }"></th>
                    <th>Name/Email</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Verification</th>
                    <th>Suspended Date</th>
                    <th>Suspension Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
          ` : `
            <div class="card">
              <div class="card-body" style="text-align: center; padding: 2rem; color: var(--text-secondary);">
                <i class="ph ph-lock" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                <p style="margin: 0;">No suspended users found</p>
              </div>
            </div>
          `}
      `;
      
      if (suspendedUsers.length > 0) {
        suspendedUsers.forEach(user => {
          html += renderSuspendedUserRow(user);
        });
        
        html += `
                </tbody>
              </table>
            </div>
          `;
      }
      
      html += `</div>`;
    } else {
      // Show all users in single table (for other filters)
      html = `
        <div style="overflow-x: auto;">
          <table class="table" style="width: 100%;">
            <thead>
              <tr>
                <th style="width: 40px;"><input type="checkbox" id="selectAllCheckbox" onchange="if(window.admin && window.admin['admin-users-management']) { window.admin['admin-users-management'].toggleSelectAll(this.checked); }"></th>
                <th>Name/Email</th>
                <th>Type</th>
                <th>Role</th>
                <th>Status</th>
                <th>Verification</th>
                <th>Registration Date</th>
                <th>Last Login</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
      `;

      users.forEach(user => {
        html += renderUserRow(user);
      });
      
      html += `
            </tbody>
          </table>
        </div>
      `;
    }

    container.innerHTML = html;
  }

  function renderUserRow(user) {
    const name = user.profile?.name || user.email || 'Unknown';
    const userType = user.userType || user.role || 'unknown';
    const status = user.profile?.status || user.onboardingStage || 'unknown';
    const registrationDate = user.profile?.createdAt || user.createdAt || 'N/A';
    const lastLogin = user.lastLoginAt || 'Never';
    const isSelected = selectedUsers.has(user.id);
    const isVerified = user.emailVerified && (user.mobileVerified || !user.mobile);
    const verificationStatus = isVerified ? 'verified' : (user.emailVerified ? 'partial' : 'unverified');
    
    return `
      <tr>
        <td>
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="if(window.admin && window.admin['admin-users-management']) { window.admin['admin-users-management'].toggleUserSelection('${user.id}', this.checked); }">
        </td>
        <td>
          <div>
            <strong>${name}</strong>
            <br>
            <small style="color: var(--text-secondary);">${user.email}</small>
          </div>
        </td>
        <td><span class="badge badge-info">${userType}</span></td>
        <td><span class="badge badge-secondary">${user.role || 'N/A'}</span></td>
        <td><span class="badge badge-${getStatusColor(status)}">${status}</span></td>
        <td>
          ${verificationStatus === 'verified' ? '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Verified</span>' : ''}
          ${verificationStatus === 'partial' ? '<span class="badge badge-warning"><i class="ph ph-warning"></i> Partial</span>' : ''}
          ${verificationStatus === 'unverified' ? '<span class="badge badge-error"><i class="ph ph-x-circle"></i> Unverified</span>' : ''}
        </td>
        <td>${new Date(registrationDate).toLocaleDateString()}</td>
        <td>${lastLogin !== 'Never' ? new Date(lastLogin).toLocaleDateString() : 'Never'}</td>
        <td>
          <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
            <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user.id}')" title="View Details">
              <i class="ph ph-eye"></i>
            </button>
            <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')" title="Edit">
              <i class="ph ph-pencil"></i>
            </button>
            ${!isVerified ? `<button class="btn btn-sm btn-info" onclick="verifyCredentials('${user.id}')" title="Verify Credentials">
              <i class="ph ph-shield-check"></i>
            </button>` : ''}
            ${status === 'pending' || status === 'under_review' ? `
              <button class="btn btn-sm btn-success" onclick="approveUser('${user.id}')" title="Approve">
                <i class="ph ph-check"></i>
              </button>
              <button class="btn btn-sm btn-error" onclick="rejectUser('${user.id}')" title="Reject">
                <i class="ph ph-x"></i>
              </button>
            ` : ''}
            ${status === 'approved' ? `
              <button class="btn btn-sm btn-warning" onclick="suspendUser('${user.id}')" title="Suspend">
                <i class="ph ph-lock"></i>
              </button>
            ` : ''}
            ${status === 'suspended' ? `
              <button class="btn btn-sm btn-success" onclick="unsuspendUser('${user.id}')" title="Unsuspend">
                <i class="ph ph-lock-open"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function renderSuspendedUserRow(user) {
    const name = user.profile?.name || user.email || 'Unknown';
    const userType = user.userType || user.role || 'unknown';
    const status = user.profile?.status || user.onboardingStage || 'unknown';
    const suspendedDate = user.profile?.suspendedAt || user.updatedAt || 'N/A';
    const suspensionReason = user.profile?.suspensionReason || 'No reason provided';
    const isSelected = selectedUsers.has(user.id);
    const isVerified = user.emailVerified && (user.mobileVerified || !user.mobile);
    const verificationStatus = isVerified ? 'verified' : (user.emailVerified ? 'partial' : 'unverified');
    
    return `
      <tr style="background: ${status === 'suspended' ? 'rgba(220, 53, 69, 0.05)' : 'transparent'};">
        <td>
          <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="if(window.admin && window.admin['admin-users-management']) { window.admin['admin-users-management'].toggleUserSelection('${user.id}', this.checked); }">
        </td>
        <td>
          <div>
            <strong>${name}</strong>
            <br>
            <small style="color: var(--text-secondary);">${user.email}</small>
          </div>
        </td>
        <td><span class="badge badge-info">${userType}</span></td>
        <td><span class="badge badge-secondary">${user.role || 'N/A'}</span></td>
        <td><span class="badge badge-error">${status}</span></td>
        <td>
          ${verificationStatus === 'verified' ? '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Verified</span>' : ''}
          ${verificationStatus === 'partial' ? '<span class="badge badge-warning"><i class="ph ph-warning"></i> Partial</span>' : ''}
          ${verificationStatus === 'unverified' ? '<span class="badge badge-error"><i class="ph ph-x-circle"></i> Unverified</span>' : ''}
        </td>
        <td>${new Date(suspendedDate).toLocaleDateString()}</td>
        <td><small style="color: var(--text-secondary);">${suspensionReason}</small></td>
        <td>
          <div style="display: flex; gap: 0.25rem;">
            <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user.id}')" title="View Details">
              <i class="ph ph-eye"></i>
            </button>
            <button class="btn btn-sm btn-success" onclick="unsuspendUser('${user.id}')" title="Unsuspend">
              <i class="ph ph-lock-open"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }


  async function applyFilters(event) {
    if (event) event.preventDefault();
    
    const filters = {};
    
    const role = document.getElementById('roleFilter')?.value;
    if (role) filters.role = role;
    
    const status = document.getElementById('statusFilter')?.value;
    // Default to approved if no status selected
    filters.status = status || 'approved';
    
    const userType = document.getElementById('userTypeFilter')?.value;
    if (userType) filters.userType = userType;
    
    const verification = document.getElementById('verificationFilter')?.value;
    if (verification) filters.verification = verification;
    
    const activity = document.getElementById('activityFilter')?.value;
    if (activity) filters.activity = activity;
    
    const dateFrom = document.getElementById('dateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('dateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
    const sortBy = document.getElementById('sortBy')?.value;
    if (sortBy) filters.sortBy = sortBy;
    
    const sortOrder = document.getElementById('sortOrder')?.value;
    if (sortOrder) filters.sortOrder = sortOrder;
    
    currentFilters = filters;
    await loadUsers();
    renderStatistics(); // Update statistics when filters change
  }

  function clearFilters() {
    currentFilters = { status: 'approved' }; // Reset to approved only
    const form = document.getElementById('usersFilterForm');
    if (form) {
      form.reset();
      // Set status back to approved after reset
      const statusFilter = document.getElementById('statusFilter');
      if (statusFilter) {
        statusFilter.value = 'approved';
      }
    }
    // Hide advanced filters
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      advancedFilters.style.display = 'none';
    }
    loadUsers();
    renderStatistics(); // Update statistics when filters are cleared
  }

  function toggleAdvancedFilters() {
    const advancedFilters = document.getElementById('advancedFilters');
    if (advancedFilters) {
      const isVisible = advancedFilters.style.display !== 'none';
      advancedFilters.style.display = isVisible ? 'none' : 'block';
    }
  }

  function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase();
    if (searchTerm.length < 2) {
      loadUsers();
      return;
    }

    // Filter users by search term
    const container = document.getElementById('usersList');
    if (!container) return;

    // Re-load and filter client-side for now
    if (typeof AdminService !== 'undefined') {
      // Handle approved_and_suspended filter in search
      let usersPromise;
      if (currentFilters.status === 'approved_and_suspended') {
        usersPromise = AdminService.getAllUsers({}).then(result => {
          if (result.success && result.users) {
            return result.users.filter(user => {
              const status = user.profile?.status || user.onboardingStage;
              return status === 'approved' || status === 'suspended';
            });
          }
          return [];
        });
      } else {
        usersPromise = AdminService.getAllUsers(currentFilters).then(result => {
          return result.success && result.users ? result.users : [];
        });
      }

      usersPromise.then(users => {
        // Apply other filters
        let filtered = users;
        if (currentFilters.role) {
          filtered = filtered.filter(u => u.role === currentFilters.role);
        }
        if (currentFilters.userType) {
          filtered = filtered.filter(u => u.userType === currentFilters.userType);
        }
        
        // Apply search filter
        filtered = filtered.filter(user => {
          const name = (user.profile?.name || '').toLowerCase();
          const email = (user.email || '').toLowerCase();
          return name.includes(searchTerm) || email.includes(searchTerm);
        });
        
        renderUsers(container, filtered);
      });
    }
  }

  async function viewUserDetails(userId) {
    if (typeof AdminService === 'undefined') {
      alert('Admin service not available');
      return;
    }

    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      alert('User not found');
      return;
    }

    // Show user details modal
    showUserModal(user);
  }

  function showUserModal(user) {
    // Get activity history
    const activityHistory = getUserActivityHistory(user.id);
    const credentialStatus = getCredentialStatus(user);
    
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.innerHTML = `
      <div class="modal show" style="max-width: 900px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">User Details</h2>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 2rem;">
            <div>
              <h3>${user.profile?.name || user.email}</h3>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>Mobile:</strong> ${user.mobile || 'Not provided'}</p>
              <p><strong>Type:</strong> ${user.userType || user.role}</p>
              <p><strong>Role:</strong> ${user.role}</p>
              <p><strong>Status:</strong> <span class="badge badge-${getStatusColor(user.profile?.status || user.onboardingStage)}">${user.profile?.status || user.onboardingStage}</span></p>
            </div>
            <div>
              <h4>Credential Verification</h4>
              <p><strong>Email:</strong> ${user.emailVerified ? '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Verified</span>' : '<span class="badge badge-error"><i class="ph ph-x-circle"></i> Unverified</span>'}</p>
              <p><strong>Mobile:</strong> ${user.mobile ? (user.mobileVerified ? '<span class="badge badge-success"><i class="ph ph-check-circle"></i> Verified</span>' : '<span class="badge badge-warning"><i class="ph ph-warning"></i> Pending</span>') : '<span class="badge badge-secondary">Not provided</span>'}</p>
              ${!credentialStatus.allVerified ? `
                <button class="btn btn-sm btn-primary" onclick="verifyCredentials('${user.id}'); this.closest('.modal-backdrop').remove();" style="margin-top: 0.5rem;">
                  <i class="ph ph-shield-check"></i> Verify Credentials
                </button>
              ` : ''}
              <h4 style="margin-top: 1rem;">Account Information</h4>
              <p><strong>Registration Date:</strong> ${new Date(user.profile?.createdAt || user.createdAt).toLocaleString()}</p>
              <p><strong>Last Login:</strong> ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
            </div>
          </div>
          
          <div style="border-top: 1px solid var(--border-color); padding-top: 1.5rem;">
            <h4>Activity History</h4>
            <div id="userActivityHistory" style="max-height: 400px; overflow-y: auto; margin-top: 1rem;">
              ${renderActivityHistory(activityHistory)}
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
          <button class="btn btn-primary" onclick="editUser('${user.id}'); this.closest('.modal-backdrop').remove();">Edit User</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  function getUserActivityHistory(userId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Audit) return [];
    
    const allLogs = PMTwinData.Audit.getAll();
    const userLogs = allLogs.filter(log => 
      log.userId === userId || log.userEmail === PMTwinData.Users.getById(userId)?.email
    );
    
    // Get user's projects, proposals, and collaborations
    const user = PMTwinData.Users.getById(userId);
    if (!user) return userLogs;
    
    const projects = PMTwinData.Projects.getByCreator(userId) || [];
    const proposals = PMTwinData.Proposals.getAll().filter(p => p.creatorId === userId) || [];
    const opportunities = PMTwinData.CollaborationOpportunities.getAll().filter(o => o.creatorId === userId) || [];
    
    // Create activity entries from these
    const activities = [];
    
    projects.forEach(project => {
      activities.push({
        type: 'project',
        action: 'Created Project',
        description: `Created project: ${project.title}`,
        timestamp: project.createdAt,
        metadata: { projectId: project.id }
      });
    });
    
    proposals.forEach(proposal => {
      activities.push({
        type: 'proposal',
        action: 'Submitted Proposal',
        description: `Submitted proposal for project`,
        timestamp: proposal.createdAt,
        metadata: { proposalId: proposal.id }
      });
    });
    
    opportunities.forEach(opp => {
      activities.push({
        type: 'collaboration',
        action: 'Created Opportunity',
        description: `Created collaboration opportunity`,
        timestamp: opp.createdAt,
        metadata: { opportunityId: opp.id }
      });
    });
    
    // Combine and sort by timestamp
    const allActivities = [...userLogs, ...activities].sort((a, b) => {
      const aTime = new Date(a.timestamp || a.createdAt || 0);
      const bTime = new Date(b.timestamp || b.createdAt || 0);
      return bTime - aTime;
    });
    
    return allActivities.slice(0, 50); // Return last 50 activities
  }

  function renderActivityHistory(activities) {
    if (activities.length === 0) {
      return '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">No activity history available</p>';
    }
    
    let html = '<div style="display: grid; gap: 0.75rem;">';
    
    activities.forEach(activity => {
      const time = new Date(activity.timestamp || activity.createdAt || Date.now());
      const relativeTime = getRelativeTime(time);
      const icon = getActivityIcon(activity.type || activity.action);
      
      html += `
        <div style="display: flex; gap: 1rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
          <div style="flex-shrink: 0; width: 2.5rem; height: 2.5rem; border-radius: 50%; background: var(--color-primary-light); display: flex; align-items: center; justify-content: center;">
            <i class="${icon}" style="font-size: 1.25rem; color: var(--color-primary);"></i>
          </div>
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.25rem;">
              <strong style="font-size: 0.9rem;">${activity.action || 'Activity'}</strong>
              <span style="color: var(--text-secondary); font-size: 0.85rem;">${relativeTime}</span>
            </div>
            <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem;">${activity.description || 'No description'}</p>
            <span style="color: var(--text-secondary); font-size: 0.8rem;">${time.toLocaleString()}</span>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  function getActivityIcon(type) {
    const icons = {
      'project': 'ph ph-folder',
      'proposal': 'ph ph-file-text',
      'collaboration': 'ph ph-handshake',
      'login': 'ph ph-sign-in',
      'logout': 'ph ph-sign-out',
      'create': 'ph ph-plus-circle',
      'update': 'ph ph-pencil',
      'delete': 'ph ph-trash'
    };
    return icons[type] || 'ph ph-circle';
  }

  function getRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }

  function getCredentialStatus(user) {
    return {
      emailVerified: user.emailVerified || false,
      mobileVerified: user.mobileVerified || false,
      allVerified: user.emailVerified && (user.mobileVerified || !user.mobile)
    };
  }

  async function approveUser(userId) {
    if (!confirm('Are you sure you want to approve this user?')) return;

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.approveUser(userId);
      
      if (result.success) {
        alert('User approved successfully');
        loadUsers();
        renderStatistics();
      } else {
        alert(result.error || 'Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  }

  async function rejectUser(userId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.rejectUser(userId, reason);
      
      if (result.success) {
        alert('User rejected successfully');
        loadUsers();
        renderStatistics();
      } else {
        alert(result.error || 'Failed to reject user');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      alert('Error rejecting user');
    }
  }

  async function suspendUser(userId) {
    if (!confirm('Are you sure you want to suspend this user?')) return;

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.updateUserStatus(userId, 'suspended');
      
      if (result.success) {
        alert('User suspended successfully');
        loadUsers();
        renderStatistics();
      } else {
        alert(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
    }
  }

  async function unsuspendUser(userId) {
    if (!confirm('Are you sure you want to unsuspend this user?')) return;

    try {
      if (typeof AdminService === 'undefined') {
        alert('Admin service not available');
        return;
      }

      const result = await AdminService.updateUserStatus(userId, 'approved');
      
      if (result.success) {
        alert('User unsuspended successfully');
        loadUsers();
        renderStatistics();
      } else {
        alert(result.error || 'Failed to unsuspend user');
      }
    } catch (error) {
      console.error('Error unsuspending user:', error);
      alert('Error unsuspending user');
    }
  }

  function editUser(userId) {
    // Navigate to edit page or show edit modal
    alert('Edit user functionality - to be implemented');
  }

  function getStatusColor(status) {
    const colors = {
      'approved': 'success',
      'pending': 'warning',
      'under_review': 'warning',
      'rejected': 'error',
      'suspended': 'error',
      'active': 'success'
    };
    return colors[status] || 'secondary';
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

  // ============================================
  // Test Data Creation
  // ============================================

  async function createTestDataIfNeeded() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      // Retry after a short delay if PMTwinData is not ready
      setTimeout(() => createTestDataIfNeeded(), 500);
      return;
    }

    const users = PMTwinData.Users.getAll();
    const approvedUsers = users.filter(u => {
      const status = u.profile?.status || u.onboardingStage;
      return status === 'approved';
    });
    
    const suspendedUsers = users.filter(u => {
      const status = u.profile?.status || u.onboardingStage;
      return status === 'suspended';
    });

    console.log(`[UserManagement] Current users - Approved: ${approvedUsers.length}, Suspended: ${suspendedUsers.length}`);

    // Create test data if we have less than 3 approved users
    if (approvedUsers.length < 3) {
      console.log('[UserManagement] Creating approved test users...');
      await createTestUsers();
    }
    
    // Always ensure we have at least 4 suspended users for testing
    if (suspendedUsers.length < 4) {
      console.log('[UserManagement] Creating suspended test users...');
      await createSuspendedTestUsers();
    } else {
      console.log(`[UserManagement] Already have ${suspendedUsers.length} suspended users`);
    }
  }

  async function createTestUsers() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) return;

    const testUsers = [
      {
        email: 'test.approved1@pmtwin.com',
        password: btoa('Test123!'),
        role: 'project_lead',
        userType: 'entity',
        profile: {
          name: 'Al-Rashid Construction Co.',
          status: 'approved',
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'approved',
        emailVerified: true,
        mobile: '+966501234567',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.approved2@pmtwin.com',
        password: btoa('Test123!'),
        role: 'professional',
        userType: 'individual',
        profile: {
          name: 'Ahmed Al-Mansouri',
          status: 'approved',
          createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'approved',
        emailVerified: true,
        mobile: '+966502345678',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.approved3@pmtwin.com',
        password: btoa('Test123!'),
        role: 'supplier',
        userType: 'entity',
        profile: {
          name: 'Saudi Materials Supply',
          status: 'approved',
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        onboardingStage: 'approved',
        emailVerified: true,
        mobile: '+966503456789',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended1@pmtwin.com',
        password: btoa('Test123!'),
        role: 'service_provider',
        userType: 'entity',
        profile: {
          name: 'Suspended Services LLC',
          status: 'suspended',
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Violation of terms of service'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966504567890',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended2@pmtwin.com',
        password: btoa('Test123!'),
        role: 'consultant',
        userType: 'individual',
        profile: {
          name: 'Dr. Fatima Al-Zahra',
          status: 'suspended',
          createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Pending investigation'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966505678901',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended3@pmtwin.com',
        password: btoa('Test123!'),
        role: 'project_lead',
        userType: 'entity',
        profile: {
          name: 'Suspended Construction Co.',
          status: 'suspended',
          createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Multiple policy violations - Account under review'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966509012345',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended4@pmtwin.com',
        password: btoa('Test123!'),
        role: 'professional',
        userType: 'individual',
        profile: {
          name: 'Suspended Professional',
          status: 'suspended',
          createdAt: new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Inappropriate behavior reported'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966510123456',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existing = PMTwinData.Users.getByEmail(userData.email);
      if (!existing) {
        try {
          PMTwinData.Users.create(userData);
        } catch (error) {
          console.error('Error creating test user:', userData.email, error);
        }
      }
    }

    // Reload users after creating test data
    setTimeout(() => {
      loadUsers();
      renderStatistics();
    }, 500);
  }

  async function createSuspendedTestUsers() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      console.warn('PMTwinData not available, cannot create suspended test users');
      return;
    }

    // Check existing suspended users to avoid duplicates
    const existingUsers = PMTwinData.Users.getAll();
    const existingSuspended = existingUsers.filter(u => {
      const status = u.profile?.status || u.onboardingStage;
      return status === 'suspended';
    });
    
    // If we already have 4+ suspended users, don't create more
    if (existingSuspended.length >= 4) {
      console.log(`Already have ${existingSuspended.length} suspended users, skipping creation`);
      // Still reload to show existing users
      setTimeout(() => {
        loadUsers();
        renderStatistics();
      }, 100);
      return;
    }
    
    console.log(`Creating suspended test users. Current count: ${existingSuspended.length}`);

    const additionalSuspendedUsers = [
      {
        email: 'test.suspended5@pmtwin.com',
        password: btoa('Test123!'),
        role: 'supplier',
        userType: 'entity',
        profile: {
          name: 'Suspended Supplier Inc.',
          status: 'suspended',
          createdAt: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Quality issues with delivered materials'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966511234567',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended6@pmtwin.com',
        password: btoa('Test123!'),
        role: 'service_provider',
        userType: 'entity',
        profile: {
          name: 'Suspended Services Group',
          status: 'suspended',
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Non-compliance with platform policies'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966512345678',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended7@pmtwin.com',
        password: btoa('Test123!'),
        role: 'consultant',
        userType: 'individual',
        profile: {
          name: 'Dr. Suspended Consultant',
          status: 'suspended',
          createdAt: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Professional misconduct - Under investigation'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966513456789',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended8@pmtwin.com',
        password: btoa('Test123!'),
        role: 'project_lead',
        userType: 'entity',
        profile: {
          name: 'Suspended Projects Ltd.',
          status: 'suspended',
          createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Repeated contract violations and payment issues'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966514567890',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended9@pmtwin.com',
        password: btoa('Test123!'),
        role: 'professional',
        userType: 'individual',
        profile: {
          name: 'Suspended Engineer',
          status: 'suspended',
          createdAt: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Incomplete project deliverables - Multiple complaints'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966515678901',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended10@pmtwin.com',
        password: btoa('Test123!'),
        role: 'auditor',
        userType: 'individual',
        profile: {
          name: 'Suspended Auditor',
          status: 'suspended',
          createdAt: new Date(Date.now() - 110 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Conflict of interest - Violation of audit standards'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966516789012',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended11@pmtwin.com',
        password: btoa('Test123!'),
        role: 'mentor',
        userType: 'individual',
        profile: {
          name: 'Suspended Mentor',
          status: 'suspended',
          createdAt: new Date(Date.now() - 85 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Inappropriate conduct during mentorship sessions'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966517890123',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        email: 'test.suspended12@pmtwin.com',
        password: btoa('Test123!'),
        role: 'supplier',
        userType: 'entity',
        profile: {
          name: 'Suspended Materials Co.',
          status: 'suspended',
          createdAt: new Date(Date.now() - 130 * 24 * 60 * 60 * 1000).toISOString(),
          suspendedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          suspensionReason: 'Delayed shipments and poor communication'
        },
        onboardingStage: 'suspended',
        emailVerified: true,
        mobile: '+966518901234',
        mobileVerified: true,
        lastLoginAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    for (const userData of additionalSuspendedUsers) {
      // Check if user already exists
      const existing = PMTwinData.Users.getByEmail(userData.email);
      if (!existing) {
        try {
          PMTwinData.Users.create(userData);
        } catch (error) {
          console.error('Error creating suspended test user:', userData.email, error);
        }
      }
    }

    // Reload users after creating test data
    setTimeout(() => {
      loadUsers();
      renderStatistics();
    }, 500);
  }

  // ============================================
  // Statistics Section
  // ============================================

  async function renderStatistics() {
    const container = document.getElementById('usersStatistics');
    if (!container) return;

    try {
      if (typeof AdminService === 'undefined') {
        return;
      }

      // Get all users for statistics
      const allUsersResult = await AdminService.getAllUsers({});
      if (!allUsersResult.success || !allUsersResult.users) {
        return;
      }

      const allUsers = allUsersResult.users;
      const approvedUsers = allUsers.filter(u => {
        const status = u.profile?.status || u.onboardingStage;
        return status === 'approved';
      });
      const suspendedUsers = allUsers.filter(u => {
        const status = u.profile?.status || u.onboardingStage;
        return status === 'suspended';
      });

      // Apply current filters to get displayed users count
      let displayedUsers = allUsers;
      if (currentFilters.status === 'approved_and_suspended') {
        displayedUsers = allUsers.filter(u => {
          const status = u.profile?.status || u.onboardingStage;
          return status === 'approved' || status === 'suspended';
        });
      } else if (currentFilters.status) {
        displayedUsers = allUsers.filter(u => {
          const status = u.profile?.status || u.onboardingStage;
          return status === currentFilters.status;
        });
      }

      if (currentFilters.role) {
        displayedUsers = displayedUsers.filter(u => u.role === currentFilters.role);
      }
      if (currentFilters.userType) {
        displayedUsers = displayedUsers.filter(u => u.userType === currentFilters.userType);
      }

      const html = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; color: var(--color-primary);">${displayedUsers.length}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Displayed Users</p>
            </div>
          </div>
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; color: var(--color-success);">${approvedUsers.length}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Approved Users</p>
            </div>
          </div>
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; color: var(--color-error);">${suspendedUsers.length}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Suspended Users</p>
            </div>
          </div>
          <div class="card">
            <div class="card-body" style="text-align: center;">
              <h3 style="margin: 0 0 0.5rem 0; font-size: 2rem; color: var(--color-info);">${allUsers.length}</h3>
              <p style="margin: 0; color: var(--text-secondary);">Total Users</p>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = html;
    } catch (error) {
      console.error('Error rendering statistics:', error);
    }
  }

  // ============================================
  // Bulk Operations
  // ============================================

  function toggleUserSelection(userId, checked) {
    if (checked) {
      selectedUsers.add(userId);
    } else {
      selectedUsers.delete(userId);
    }
    updateBulkOperationsUI();
  }

  function toggleSelectAll(checked, section = null) {
    const container = document.getElementById('usersList');
    if (!container) return;
    
    let checkboxes;
    if (section === 'approved') {
      checkboxes = container.querySelectorAll('input[type="checkbox"]:not(#selectAllApprovedCheckbox)');
    } else if (section === 'suspended') {
      checkboxes = container.querySelectorAll('input[type="checkbox"]:not(#selectAllSuspendedCheckbox)');
    } else {
      checkboxes = container.querySelectorAll('input[type="checkbox"]:not(#selectAllCheckbox)');
    }
    
    checkboxes.forEach(checkbox => {
      checkbox.checked = checked;
      const userId = checkbox.getAttribute('onchange')?.match(/'([^']+)'/)?.[1];
      if (userId) {
        if (checked) {
          selectedUsers.add(userId);
        } else {
          selectedUsers.delete(userId);
        }
      }
    });
    
    updateBulkOperationsUI();
  }

  function selectAll() {
    toggleSelectAll(true);
  }

  function deselectAll() {
    toggleSelectAll(false);
    selectedUsers.clear();
    updateBulkOperationsUI();
  }

  function updateBulkOperationsUI() {
    const count = selectedUsers.size;
    const countElement = document.getElementById('selectedCount');
    const bulkSection = document.getElementById('bulkOperationsSection');
    
    if (countElement) {
      countElement.textContent = count;
    }
    
    if (bulkSection) {
      bulkSection.style.display = count > 0 ? 'block' : 'none';
    }
  }

  function hideBulkOperations() {
    selectedUsers.clear();
    const checkboxes = document.querySelectorAll('#usersList input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    updateBulkOperationsUI();
  }

  async function bulkApprove() {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    
    if (!confirm(`Are you sure you want to approve ${selectedUsers.size} user(s)?`)) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of selectedUsers) {
        const result = await AdminService.approveUser(userId);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      alert(`Approved ${successCount} user(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`);
      hideBulkOperations();
      loadUsers();
      renderStatistics();
    } catch (error) {
      console.error('Error in bulk approve:', error);
      alert('Error approving users');
    }
  }

  async function bulkSuspend() {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    
    const reason = prompt(`Please provide a reason for suspending ${selectedUsers.size} user(s):`);
    if (!reason) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of selectedUsers) {
        const result = await AdminService.updateUserStatus(userId, 'suspended', reason);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      alert(`Suspended ${successCount} user(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`);
      hideBulkOperations();
      loadUsers();
      renderStatistics();
    } catch (error) {
      console.error('Error in bulk suspend:', error);
      alert('Error suspending users');
    }
  }

  async function bulkReject() {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    
    const reason = prompt(`Please provide a reason for rejecting ${selectedUsers.size} user(s):`);
    if (!reason) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of selectedUsers) {
        const result = await AdminService.rejectUser(userId, reason);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
        }
      }
      
      alert(`Rejected ${successCount} user(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`);
      hideBulkOperations();
      loadUsers();
      renderStatistics();
    } catch (error) {
      console.error('Error in bulk reject:', error);
      alert('Error rejecting users');
    }
  }

  function bulkExport() {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    
    try {
      const users = Array.from(selectedUsers).map(id => PMTwinData.Users.getById(id)).filter(u => u);
      const exportData = users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.profile?.name || user.email,
        type: user.userType || user.role,
        role: user.role,
        status: user.profile?.status || user.onboardingStage,
        emailVerified: user.emailVerified,
        mobileVerified: user.mobileVerified,
        registrationDate: user.profile?.createdAt || user.createdAt,
        lastLogin: user.lastLoginAt
      }));
      
      const csv = [
        ['ID', 'Email', 'Name', 'Type', 'Role', 'Status', 'Email Verified', 'Mobile Verified', 'Registration Date', 'Last Login'],
        ...exportData.map(u => [
          u.id,
          u.email,
          u.name,
          u.type,
          u.role,
          u.status,
          u.emailVerified ? 'Yes' : 'No',
          u.mobileVerified ? 'Yes' : 'No',
          u.registrationDate ? new Date(u.registrationDate).toLocaleDateString() : '',
          u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'
        ])
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      alert(`Exported ${exportData.length} user(s) to CSV`);
    } catch (error) {
      console.error('Error exporting users:', error);
      alert('Error exporting users');
    }
  }

  async function bulkAssignRole() {
    if (selectedUsers.size === 0) {
      alert('Please select at least one user');
      return;
    }
    
    const role = prompt(`Enter role to assign to ${selectedUsers.size} user(s):\n\nAvailable roles: admin, entity, individual, consultant, service_provider, supplier`);
    if (!role) return;
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (const userId of selectedUsers) {
        const user = PMTwinData.Users.getById(userId);
        if (user) {
          user.role = role;
          PMTwinData.Users.update(userId, user);
          successCount++;
        } else {
          failCount++;
        }
      }
      
      alert(`Assigned role "${role}" to ${successCount} user(s). ${failCount > 0 ? `Failed: ${failCount}` : ''}`);
      hideBulkOperations();
      loadUsers();
      renderStatistics();
    } catch (error) {
      console.error('Error in bulk role assignment:', error);
      alert('Error assigning roles');
    }
  }

  async function verifyCredentials(userId) {
    if (!confirm('Are you sure you want to verify this user\'s credentials?')) return;
    
    try {
      const user = PMTwinData.Users.getById(userId);
      if (!user) {
        alert('User not found');
        return;
      }
      
      user.emailVerified = true;
      if (user.mobile) {
        user.mobileVerified = true;
      }
      
      PMTwinData.Users.update(userId, user);
      
      // Create audit log
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Audit) {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        PMTwinData.Audit.create({
          action: 'Verify Credentials',
          description: `Admin verified credentials for user: ${user.email}`,
          userId: currentUser?.id,
          userName: currentUser?.profile?.name || currentUser?.email,
          userEmail: currentUser?.email,
          timestamp: new Date().toISOString()
        });
      }
      
      alert('Credentials verified successfully');
      loadUsers();
    } catch (error) {
      console.error('Error verifying credentials:', error);
      alert('Error verifying credentials');
    }
  }

  // Export functions to window for onclick handlers
  window.viewUserDetails = viewUserDetails;
  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.suspendUser = suspendUser;
  window.unsuspendUser = unsuspendUser;
  window.editUser = editUser;
  window.verifyCredentials = verifyCredentials;

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-users-management'] = { 
    init,
    applyFilters,
    clearFilters,
    toggleAdvancedFilters,
    createTestUsers,
    createSuspendedTestUsers,
    renderStatistics,
    toggleUserSelection,
    toggleSelectAll,
    selectAll,
    deselectAll,
    hideBulkOperations,
    bulkApprove,
    bulkSuspend,
    bulkReject,
    bulkExport,
    bulkAssignRole
  };

})();

