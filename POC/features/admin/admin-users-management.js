/**
 * Admin Users Management Component
 * Handles enhanced user management UI for admin portal
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadUsers();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Filter form
    const filterForm = document.getElementById('usersFilterForm');
    if (filterForm) {
      filterForm.addEventListener('submit', applyFilters);
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

      const result = await AdminService.getAllUsers(currentFilters);
      
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

    let html = `
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
      const name = user.profile?.name || user.email || 'Unknown';
      const userType = user.userType || user.role || 'unknown';
      const status = user.profile?.status || user.onboardingStage || 'unknown';
      const registrationDate = user.profile?.createdAt || user.createdAt || 'N/A';
      const lastLogin = user.lastLoginAt || 'Never';
      
      html += `
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
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;

    container.innerHTML = html;
  }

  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const role = document.getElementById('roleFilter')?.value;
    if (role) filters.role = role;
    
    const status = document.getElementById('statusFilter')?.value;
    if (status) filters.status = status;
    
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
    currentFilters = {};
    document.getElementById('usersFilterForm')?.reset();
    loadUsers();
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
      AdminService.getAllUsers(currentFilters).then(result => {
        if (result.success && result.users) {
          const filtered = result.users.filter(user => {
            const name = (user.profile?.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            return name.includes(searchTerm) || email.includes(searchTerm);
          });
          renderUsers(container, filtered);
        }
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
      } else {
        alert(result.error || 'Failed to suspend user');
      }
    } catch (error) {
      console.error('Error suspending user:', error);
      alert('Error suspending user');
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

  // Export functions to window for onclick handlers
  window.viewUserDetails = viewUserDetails;
  window.approveUser = approveUser;
  window.rejectUser = rejectUser;
  window.suspendUser = suspendUser;
  window.editUser = editUser;

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-users-management'] = { init };

})();

