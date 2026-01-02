/**
 * Admin Users Management Component
 * Handles enhanced user management UI for admin portal
 */

(function() {
  'use strict';

  let currentFilters = { status: 'approved_and_suspended' }; // Default: show approved and suspended users

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

    const dateFromFilter = document.getElementById('dateFromFilter');
    if (dateFromFilter) {
      dateFromFilter.addEventListener('change', applyFilters);
    }

    const dateToFilter = document.getElementById('dateToFilter');
    if (dateToFilter) {
      dateToFilter.addEventListener('change', applyFilters);
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
        renderUsers(container, result.users);
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
                    <th>Name/Email</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Status</th>
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
                    <th>Name/Email</th>
                    <th>Type</th>
                    <th>Role</th>
                    <th>Status</th>
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
                <th>Name/Email</th>
                <th>Type</th>
                <th>Role</th>
                <th>Status</th>
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
    
    return `
      <tr>
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
        <td>${new Date(registrationDate).toLocaleDateString()}</td>
        <td>${lastLogin !== 'Never' ? new Date(lastLogin).toLocaleDateString() : 'Never'}</td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user.id}')">View</button>
          <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')">Edit</button>
          ${status === 'pending' || status === 'under_review' ? `
            <button class="btn btn-sm btn-success" onclick="approveUser('${user.id}')">Approve</button>
            <button class="btn btn-sm btn-error" onclick="rejectUser('${user.id}')">Reject</button>
          ` : ''}
          ${status === 'approved' ? `
            <button class="btn btn-sm btn-warning" onclick="suspendUser('${user.id}')">Suspend</button>
          ` : ''}
          ${status === 'suspended' ? `
            <button class="btn btn-sm btn-success" onclick="unsuspendUser('${user.id}')">Unsuspend</button>
          ` : ''}
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
    
    return `
      <tr style="background: ${status === 'suspended' ? 'rgba(220, 53, 69, 0.05)' : 'transparent'};">
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
        <td>${new Date(suspendedDate).toLocaleDateString()}</td>
        <td><small style="color: var(--text-secondary);">${suspensionReason}</small></td>
        <td>
          <button class="btn btn-sm btn-primary" onclick="viewUserDetails('${user.id}')">View</button>
          <button class="btn btn-sm btn-success" onclick="unsuspendUser('${user.id}')">Unsuspend</button>
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
    
    const dateFrom = document.getElementById('dateFromFilter')?.value;
    if (dateFrom) filters.dateFrom = dateFrom;
    
    const dateTo = document.getElementById('dateToFilter')?.value;
    if (dateTo) filters.dateTo = dateTo;
    
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
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop show';
    modal.innerHTML = `
      <div class="modal show" style="max-width: 800px; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header">
          <h2 class="modal-title">User Details</h2>
          <button class="modal-close" onclick="this.closest('.modal-backdrop').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <h3>${user.profile?.name || user.email}</h3>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Type:</strong> ${user.userType || user.role}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p><strong>Status:</strong> <span class="badge badge-${getStatusColor(user.profile?.status || user.onboardingStage)}">${user.profile?.status || user.onboardingStage}</span></p>
          <p><strong>Registration Date:</strong> ${new Date(user.profile?.createdAt || user.createdAt).toLocaleString()}</p>
          <p><strong>Last Login:</strong> ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : 'Never'}</p>
          <h4 style="margin-top: 1.5rem;">Activity History</h4>
          <p>Activity history will be displayed here</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" onclick="this.closest('.modal-backdrop').remove()">Close</button>
          <button class="btn btn-primary" onclick="editUser('${user.id}'); this.closest('.modal-backdrop').remove();">Edit User</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
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

  // Export functions to window for onclick handlers
  window.viewUserDetails = viewUserDetails;
  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.suspendUser = suspendUser;
  window.unsuspendUser = unsuspendUser;
  window.editUser = editUser;

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-users-management'] = { 
    init,
    applyFilters,
    clearFilters,
    toggleAdvancedFilters,
    createTestUsers,
    createSuspendedTestUsers,
    renderStatistics
  };

})();

