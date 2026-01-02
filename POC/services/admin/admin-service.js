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
    
    // Special case: show all vetting-related statuses
    if (filters.status === 'all_vetting' || filters.status === '') {
      // Show all users that need vetting: pending, under_review, rejected
      users = PMTwinData.Users.getAll().filter(u => 
        u.profile?.status === 'pending' || 
        u.profile?.status === 'rejected' ||
        u.onboardingStage === 'registered' || 
        u.onboardingStage === 'under_review' ||
        u.onboardingStage === 'profile_in_progress' ||
        u.onboardingStage === 'rejected'
      );
    } else if (filters.status) {
      users = PMTwinData.Users.getByStatus(filters.status);
      
      // If status is pending, also include registered and under_review stages
      if (filters.status === 'pending') {
        users = users.filter(u => 
          u.profile?.status === 'pending' || 
          u.onboardingStage === 'registered' || 
          u.onboardingStage === 'under_review' ||
          u.onboardingStage === 'profile_in_progress'
        );
      }
    } else {
      users = PMTwinData.Users.getAll();
    }
    
    // Filter by onboarding stage if needed
    if (filters.onboardingStage) {
      users = users.filter(u => u.onboardingStage === filters.onboardingStage);
    }
    
    // Filter by user type if needed
    if (filters.userType) {
      users = users.filter(u => u.userType === filters.userType);
    }
    
    // Filter by date range if provided
    if (filters.dateFrom) {
      users = users.filter(u => {
        const regDate = new Date(u.profile?.createdAt || u.createdAt);
        return regDate >= new Date(filters.dateFrom);
      });
    }
    if (filters.dateTo) {
      users = users.filter(u => {
        const regDate = new Date(u.profile?.createdAt || u.createdAt);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include entire day
        return regDate <= toDate;
      });
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

  async function getAllUsers(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to view all users' };
    }
    
    let users = PMTwinData.Users.getAll();
    
    // Apply filters
    if (filters.role) {
      users = users.filter(u => u.role === filters.role);
    }
    if (filters.status) {
      if (filters.status === 'approved') {
        // For approved status, check both profile.status and onboardingStage
        users = users.filter(u => 
          (u.profile?.status === 'approved' || u.onboardingStage === 'approved') &&
          u.profile?.status !== 'rejected' &&
          u.profile?.status !== 'suspended'
        );
      } else {
        users = users.filter(u => u.profile?.status === filters.status || u.onboardingStage === filters.status);
      }
    }
    if (filters.userType) {
      users = users.filter(u => u.userType === filters.userType);
    }
    if (filters.dateFrom) {
      users = users.filter(u => new Date(u.profile?.createdAt || u.createdAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      users = users.filter(u => new Date(u.profile?.createdAt || u.createdAt) <= new Date(filters.dateTo));
    }
    
    return { success: true, users: users };
  }

  async function updateUserStatus(userId, status, reason = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to update user status' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const updates = {
      onboardingStage: status,
      profile: {
        ...user.profile,
        status: status
      }
    };
    
    if (status === 'rejected' && reason) {
      updates.verificationRejectionReason = reason;
      updates.profile.rejectionReason = reason;
      updates.profile.rejectedAt = new Date().toISOString();
    } else if (status === 'approved') {
      updates.profile.approvedAt = new Date().toISOString();
      updates.profile.approvedBy = currentUser.id;
    }
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      return { success: true, user: updated };
    }
    
    return { success: false, error: 'Failed to update user status' };
  }

  async function bulkApproveUsers(userIds, notes = null) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to bulk approve users' };
    }
    
    const results = [];
    for (const userId of userIds) {
      const result = await approveUser(userId, notes);
      results.push({ userId, ...result });
    }
    
    return { success: true, results: results };
  }

  async function addCommentToUser(userId, comment) {
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
        return { success: false, error: 'You do not have permission to add comments' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to add comments' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const commentEntry = {
      id: 'comment_' + Date.now(),
      comment: comment,
      addedBy: currentUser.id,
      addedByName: currentUser.profile?.name || currentUser.email,
      addedAt: new Date().toISOString()
    };
    
    const existingComments = user.vettingComments || [];
    const updates = {
      vettingComments: [...existingComments, commentEntry]
    };
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      // Create audit log
      PMTwinData.Audit.create({
        userId: currentUser.id,
        userRole: currentUser.role,
        userEmail: currentUser.email,
        userName: currentUser.profile?.name || currentUser.email,
        action: 'add_vetting_comment',
        actionCategory: 'admin',
        entityType: 'user',
        entityId: userId,
        description: `Added comment to user ${user.email}`,
        context: { comment: comment }
      });
      
      return { success: true, comment: commentEntry };
    }
    
    return { success: false, error: 'Failed to add comment' };
  }

  async function verifyDocument(userId, documentType, verified = true, notes = null) {
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
        return { success: false, error: 'You do not have permission to verify documents' };
      }
    } else if (currentUser.role !== 'admin') {
      return { success: false, error: 'You do not have permission to verify documents' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const documentVerification = {
      documentType: documentType,
      verified: verified,
      verifiedBy: currentUser.id,
      verifiedByName: currentUser.profile?.name || currentUser.email,
      verifiedAt: new Date().toISOString(),
      notes: notes
    };
    
    const existingVerifications = user.documentVerifications || {};
    const updates = {
      documentVerifications: {
        ...existingVerifications,
        [documentType]: documentVerification
      }
    };
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      // Create audit log
      PMTwinData.Audit.create({
        userId: currentUser.id,
        userRole: currentUser.role,
        userEmail: currentUser.email,
        userName: currentUser.profile?.name || currentUser.email,
        action: verified ? 'verify_document' : 'reject_document',
        actionCategory: 'admin',
        entityType: 'user',
        entityId: userId,
        description: `${verified ? 'Verified' : 'Rejected'} document ${documentType} for user ${user.email}`,
        context: { documentType, verified, notes }
      });
      
      return { success: true, verification: documentVerification };
    }
    
    return { success: false, error: 'Failed to verify document' };
  }

  async function requestAdditionalDocuments(userId, requestedDocuments, message) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }
    
    const updates = {
      onboardingStage: 'pending',
      pendingDocuments: requestedDocuments,
      documentRequestMessage: message,
      documentRequestedAt: new Date().toISOString(),
      documentRequestedBy: currentUser.id
    };
    
    const updated = PMTwinData.Users.update(userId, updates);
    if (updated) {
      // Create notification
      PMTwinData.Notifications.create({
        userId: userId,
        type: 'document_request',
        title: 'Additional Documents Required',
        message: message || 'Please upload additional documents to complete your registration.',
        relatedEntityType: 'user',
        relatedEntityId: userId
      });
      
      return { success: true, user: updated };
    }
    
    return { success: false, error: 'Failed to request documents' };
  }

  window.AdminService = {
    getUsersForVetting,
    approveUser,
    rejectUser,
    getAuditTrail,
    getAllUsers,
    updateUserStatus,
    bulkApproveUsers,
    addCommentToUser,
    verifyDocument,
    requestAdditionalDocuments
  };

})();


