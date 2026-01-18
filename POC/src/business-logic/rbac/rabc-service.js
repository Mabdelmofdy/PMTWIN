/**
 * RABC Service
 * Roles & Responsibilities framework implementation
 * BRD Section 12: RABC Matrix
 */

(function() {
  'use strict';

  // RABC Role Types
  const RABC_ROLES = {
    RESPONSIBLE: 'R',
    ACCOUNTABLE: 'A',
    BENEFICIARY: 'B',
    CONSULTED: 'C'
  };

  // RABC Matrix (BRD Section 12)
  const RABC_MATRIX = {
    user_registration: {
      R: 'Platform Admin',
      A: 'Legal/Compliance',
      B: ['Need Owner', 'Offer Owner'],
      C: ['AI Engine']
    },
    profile_verification: {
      R: 'Platform Admin',
      A: 'Legal/Compliance',
      B: ['Need Owner', 'Offer Owner'],
      C: ['AI Engine']
    },
    post_need: {
      R: 'Need Owner',
      A: 'Need Owner',
      B: ['Legal/Compliance'],
      C: ['Platform Admin', 'AI Engine']
    },
    post_offer: {
      R: 'Offer Owner',
      A: 'Offer Owner',
      B: ['Legal/Compliance'],
      C: ['Platform Admin', 'AI Engine']
    },
    select_collaboration_model: {
      R: 'Need Owner',
      A: 'Need Owner',
      B: ['Legal/Compliance'],
      C: ['Platform Admin', 'AI Engine']
    },
    matching_scoring: {
      R: 'AI Engine',
      A: 'AI Engine',
      B: ['Need Owner', 'Offer Owner'],
      C: ['Platform Admin', 'Legal/Compliance']
    },
    shortlisting: {
      R: 'Need Owner',
      A: 'Need Owner',
      B: ['Legal/Compliance'],
      C: ['Platform Admin', 'AI Engine']
    },
    negotiation: {
      R: 'Need Owner',
      A: 'Need Owner',
      B: ['Platform Admin'],
      C: ['Legal/Compliance', 'AI Engine']
    },
    agreement_creation: {
      R: 'Need Owner',
      A: 'Legal/Compliance',
      B: ['Need Owner', 'Offer Owner'],
      C: ['Platform Admin', 'AI Engine']
    },
    review_rating: {
      R: 'Need Owner',
      A: 'Need Owner',
      B: ['Legal/Compliance'],
      C: ['AI Engine']
    }
  };

  /**
   * Get RABC assignment for an activity
   * @param {string} activity - Activity name
   * @returns {Object|null} - RABC assignment or null
   */
  function getAssignment(activity) {
    return RABC_MATRIX[activity] || null;
  }

  /**
   * Check if user can perform action (is Responsible)
   * @param {string} activity - Activity name
   * @param {string} userId - User ID
   * @param {string} userRole - User role
   * @returns {boolean} - True if user can perform
   */
  function canPerform(activity, userId, userRole) {
    const assignment = getAssignment(activity);
    if (!assignment) {
      return false;
    }

    const responsible = assignment.R;
    
    // Map user roles to RABC roles
    const roleMapping = {
      'admin': 'Platform Admin',
      'platform_admin': 'Platform Admin',
      'entity': 'Need Owner',
      'beneficiary': 'Need Owner',
      'project_lead': 'Need Owner',
      'vendor': 'Offer Owner',
      'service_provider': 'Offer Owner',
      'individual': 'Need Owner', // Can be both, but default to Need Owner
      'consultant': 'Offer Owner'
    };

    const userRABC = roleMapping[userRole] || 'Need Owner';
    
    // Check if user role matches Responsible role
    if (responsible === 'Need Owner' && (userRABC === 'Need Owner' || userRABC === 'Offer Owner')) {
      // For need/offer activities, check if user owns the entity
      return true;
    }
    
    if (responsible === 'Offer Owner' && userRABC === 'Offer Owner') {
      return true;
    }
    
    if (responsible === 'Platform Admin' && userRABC === 'Platform Admin') {
      return true;
    }
    
    if (responsible === 'AI Engine') {
      // AI Engine actions are automatic
      return false; // Users cannot perform AI Engine actions directly
    }

    return false;
  }

  /**
   * Check if user is accountable for activity
   * @param {string} activity - Activity name
   * @param {string} userRole - User role
   * @returns {boolean} - True if user is accountable
   */
  function isAccountable(activity, userRole) {
    const assignment = getAssignment(activity);
    if (!assignment) {
      return false;
    }

    const accountable = assignment.A;
    const roleMapping = {
      'admin': 'Platform Admin',
      'platform_admin': 'Platform Admin',
      'legal': 'Legal/Compliance',
      'compliance': 'Legal/Compliance',
      'entity': 'Need Owner',
      'beneficiary': 'Need Owner',
      'project_lead': 'Need Owner',
      'vendor': 'Offer Owner',
      'service_provider': 'Offer Owner'
    };

    const userRABC = roleMapping[userRole] || 'Need Owner';
    return accountable === userRABC;
  }

  /**
   * Check if user is beneficiary of activity
   * @param {string} activity - Activity name
   * @param {string} userRole - User role
   * @returns {boolean} - True if user is beneficiary
   */
  function isBeneficiary(activity, userRole) {
    const assignment = getAssignment(activity);
    if (!assignment) {
      return false;
    }

    const beneficiaries = assignment.B || [];
    const roleMapping = {
      'admin': 'Platform Admin',
      'platform_admin': 'Platform Admin',
      'legal': 'Legal/Compliance',
      'compliance': 'Legal/Compliance',
      'entity': 'Need Owner',
      'beneficiary': 'Need Owner',
      'project_lead': 'Need Owner',
      'vendor': 'Offer Owner',
      'service_provider': 'Offer Owner',
      'individual': 'Need Owner'
    };

    const userRABC = roleMapping[userRole] || 'Need Owner';
    return beneficiaries.includes(userRABC);
  }

  /**
   * Check if user should be consulted for activity
   * @param {string} activity - Activity name
   * @param {string} userRole - User role
   * @returns {boolean} - True if user should be consulted
   */
  function shouldBeConsulted(activity, userRole) {
    const assignment = getAssignment(activity);
    if (!assignment) {
      return false;
    }

    const consulted = assignment.C || [];
    const roleMapping = {
      'admin': 'Platform Admin',
      'platform_admin': 'Platform Admin',
      'legal': 'Legal/Compliance',
      'compliance': 'Legal/Compliance',
      'ai': 'AI Engine',
      'ai_engine': 'AI Engine'
    };

    const userRABC = roleMapping[userRole] || null;
    return userRABC && consulted.includes(userRABC);
  }

  /**
   * Get RABC indicator for UI display
   * @param {string} activity - Activity name
   * @param {string} userRole - User role
   * @returns {string|null} - RABC indicator (R, A, B, C) or null
   */
  function getIndicator(activity, userRole) {
    if (canPerform(activity, null, userRole)) {
      return RABC_ROLES.RESPONSIBLE;
    }
    if (isAccountable(activity, userRole)) {
      return RABC_ROLES.ACCOUNTABLE;
    }
    if (isBeneficiary(activity, userRole)) {
      return RABC_ROLES.BENEFICIARY;
    }
    if (shouldBeConsulted(activity, userRole)) {
      return RABC_ROLES.CONSULTED;
    }
    return null;
  }

  /**
   * Get all activities for a role
   * @param {string} userRole - User role
   * @returns {Object} - Activities grouped by RABC role
   */
  function getActivitiesForRole(userRole) {
    const activities = {
      responsible: [],
      accountable: [],
      beneficiary: [],
      consulted: []
    };

    Object.keys(RABC_MATRIX).forEach(activity => {
      if (canPerform(activity, null, userRole)) {
        activities.responsible.push(activity);
      }
      if (isAccountable(activity, userRole)) {
        activities.accountable.push(activity);
      }
      if (isBeneficiary(activity, userRole)) {
        activities.beneficiary.push(activity);
      }
      if (shouldBeConsulted(activity, userRole)) {
        activities.consulted.push(activity);
      }
    });

    return activities;
  }

  // ============================================
  // Export
  // ============================================

  window.RABCService = {
    ROLES: RABC_ROLES,
    getAssignment: getAssignment,
    canPerform: canPerform,
    isAccountable: isAccountable,
    isBeneficiary: isBeneficiary,
    shouldBeConsulted: shouldBeConsulted,
    getIndicator: getIndicator,
    getActivitiesForRole: getActivitiesForRole
  };

})();
