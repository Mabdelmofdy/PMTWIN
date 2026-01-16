/**
 * RBAC Navigation Configuration
 * Defines sidebar menu items per role
 */

(function() {
  'use strict';

  // Navigation items configuration per role
  const NAV_CONFIG = {
    project_lead: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
        { id: 'opportunities-my', label: 'My Opportunities', route: 'opportunities/my', feature: 'project_management', icon: '<i class="ph ph-folder"></i>' },
        { id: 'opportunities-create', label: 'Create Opportunity', route: 'opportunities/create', feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>' },
        { id: 'matches', label: 'Matches', route: 'matches', feature: 'view_matches', icon: '<i class="ph ph-link"></i>' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      ]
    },
    supplier: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: 'opportunities/create', feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', filter: 'own' }
      ]
    },
    service_provider: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: 'opportunities/create', feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      ]
    },
    consultant: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', filter: 'OFFER_SERVICE' },
        { id: 'opportunities-create', label: 'Create Offer', route: 'opportunities/create', feature: 'project_creation', icon: '<i class="ph ph-plus-circle"></i>' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>' },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>' }
      ]
    },
    professional: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', conditional: true },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', filter: 'own' }
      ]
    },
    mentor: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'collaboration', label: 'Mentorship', route: 'collab-mentorship', feature: 'collaboration_opportunities', icon: '<i class="ph ph-graduation-cap"></i>' }
        // Contracts hidden unless specified
      ]
    },
    platform_admin: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'admin', label: 'Admin Dashboard', route: 'admin', feature: 'admin_dashboard', icon: '<i class="ph ph-gear"></i>' },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', access: 'monitor' },
        { id: 'opportunities-my', label: 'My Opportunities', route: 'opportunities/my', feature: 'project_management', icon: '<i class="ph ph-folder"></i>', access: 'monitor' },
        { id: 'pipeline', label: 'Pipeline', route: 'pipeline', feature: 'pipeline_management', icon: '<i class="ph ph-flow-arrow"></i>', access: 'monitor' },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', access: 'monitor' },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', access: 'monitor' },
        { id: 'admin-vetting', label: 'User Vetting', route: 'admin-vetting', feature: 'user_vetting', icon: '<i class="ph ph-check-circle"></i>' },
        { id: 'admin-users-management', label: 'User Management', route: 'admin-users-management', feature: 'user_management', icon: '<i class="ph ph-users"></i>' },
        { id: 'admin-moderation', label: 'Project Moderation', route: 'admin-moderation', feature: 'project_moderation', icon: '<i class="ph ph-shield-check"></i>' },
        { id: 'admin-audit', label: 'Audit Trail', route: 'admin-audit', feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>' },
        { id: 'admin-reports', label: 'Reports', route: 'admin-reports', feature: 'reports', icon: '<i class="ph ph-chart-bar"></i>' }
      ]
    },
    auditor: {
      menuItems: [
        { id: 'dashboard', label: 'Dashboard', route: 'dashboard', feature: 'user_dashboard', icon: '<i class="ph ph-gauge"></i>' },
        { id: 'audit', label: 'Audit Dashboard', route: 'admin-audit', feature: 'audit_trail', icon: '<i class="ph ph-clipboard"></i>', readOnly: true },
        { id: 'opportunities', label: 'Opportunities', route: 'opportunities', feature: 'matches_view', icon: '<i class="ph ph-sparkle"></i>', readOnly: true },
        { id: 'proposals', label: 'Proposals', route: 'proposals', feature: 'proposal_management', icon: '<i class="ph ph-file-text"></i>', readOnly: true },
        { id: 'contracts', label: 'Contracts', route: 'contracts', feature: 'contract_management', icon: '<i class="ph ph-file-doc"></i>', readOnly: true }
      ]
    }
  };

  /**
   * Get navigation items for a role
   * @param {string} roleId - Role ID
   * @returns {Array} Array of menu items
   */
  function getNavItemsForRole(roleId) {
    return NAV_CONFIG[roleId]?.menuItems || [];
  }

  /**
   * Check if role has access to a feature
   * @param {string} roleId - Role ID
   * @param {string} feature - Feature name
   * @returns {boolean} True if role has access
   */
  function hasFeatureAccess(roleId, feature) {
    const navItems = getNavItemsForRole(roleId);
    return navItems.some(item => item.feature === feature);
  }

  // Export
  window.RBACNavConfig = {
    NAV_CONFIG,
    getNavItemsForRole,
    hasFeatureAccess
  };

})();
