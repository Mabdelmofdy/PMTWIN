/**
 * Admin Service
 * Handles administrative operations with role-based access control
 */

(function() {
  'use strict';

  async function getUsersForVetting(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('vet_users');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to vet users' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to vet users' };
    }
    
    let users = [];
    
    if (filters.status) {
      users = PMTwinData.Users.getByStatus(filters.status);
    } else {
      users = PMTwinData.Users.getAll();
    }
    
    // Filter by onboarding stage if needed
    if (filters.onboardingStage) {
      users = users.filter(u => u.onboardingStage === filters.onboardingStage);
    }
    
    return { success: true, users: users };
  }

  async function approveUser(userId, notes = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('approve_users');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to approve users' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to approve users' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const updates = {
      onboardingStage: 'approved',
      review: {
        ...user.review,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        status: 'approved',
        reviewNotes: notes
      },
      profile: {
        ...user.profile,
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: currentUser.id
      }
    };
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      // Create notification
      PMTwinData.Notifications.create({
        userId: userId,
        type: 'account_approved',
        title: 'Account Approved',
        message: 'Your account has been approved. You now have full access to the platform.',
        relatedEntityType: 'user',
        relatedEntityId: userId
      });
      
      return { success: true, user: updated };
    }
    
    return { success: false, error: 'Failed to approve user' };
  }

  async function rejectUser(userId, reason, notes = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('reject_users');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to reject users' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to reject users' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const updates = {
      onboardingStage: 'rejected',
      verificationRejectionReason: reason,
      review: {
        ...user.review,
        reviewedAt: new Date().toISOString(),
        reviewedBy: currentUser.id,
        status: 'rejected',
        rejectionReason: reason,
        reviewNotes: notes
      },
      profile: {
        ...user.profile,
        status: 'rejected',
        rejectedAt: new Date().toISOString(),
        rejectionReason: reason
      }
    };
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      // Create notification
      PMTwinData.Notifications.create({
        userId: userId,
        type: 'account_rejected',
        title: 'Account Rejected',
        message: `Your account has been rejected. Reason: ${reason}`,
        relatedEntityType: 'user',
        relatedEntityId: userId
      });
      
      return { success: true, user: updated };
    }
    
    return { success: false, error: 'Failed to reject user' };
  }

  async function getAuditTrail(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_audit_trail');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to view audit trail' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view audit trail' };
    }
    
    let logs = PMTwinData.Audit.getRecent(filters.limit || 100);
    
    // Apply filters
    if (filters.action) {
      logs = logs.filter(l => l.action === filters.action);
    }
    if (filters.userId) {
      logs = logs.filter(l => l.userId === filters.userId);
    }
    if (filters.entityType) {
      logs = logs.filter(l => l.entityType === filters.entityType);
    }
    
    return { success: true, logs: logs };
  }

  window.AdminService = {
    getUsersForVetting,
    approveUser,
    rejectUser,
    getAuditTrail
  };

})();


