/**
 * Proposal Validator
 * Validates proposals based on user roles and business rules
 */

(function() {
  'use strict';

  // ============================================
  // Validate Vendor Proposal Scope
  // ============================================
  async function validateVendorProposalScope(proposalData, project) {
    if (!proposalData || !project) {
      return { valid: false, error: 'Proposal data and project are required' };
    }

    const currentUser = PMTwinData?.Sessions?.getCurrentUser();
    if (!currentUser) {
      return { valid: false, error: 'User not authenticated' };
    }

    // Get user role
    let userRole = currentUser.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      userRole = await PMTwinRBAC.getCurrentUserRole();
    }

    // Only validate for vendors
    if (userRole !== 'vendor' && userRole !== 'service_provider') {
      return { valid: true }; // Not a vendor, skip validation
    }

    // Check if proposal is for a complete subproject or full project
    const scopeType = proposalData.scopeType || 'full_project';
    const subprojectId = proposalData.subprojectId;

    // If bidding on a subproject, verify it exists and is complete
    if (subprojectId) {
      if (!project.subProjects || !Array.isArray(project.subProjects)) {
        return { valid: false, error: 'Project does not have subprojects defined' };
      }

      const subproject = project.subProjects.find(sp => sp.id === subprojectId);
      if (!subproject) {
        return { valid: false, error: 'Subproject not found' };
      }

      // Validate subproject is complete (has all required fields)
      if (!validateSubprojectCompleteness(subproject).valid) {
        return { valid: false, error: 'Cannot bid on incomplete subproject. Subprojects must have complete, independent scope definitions.' };
      }

      return { valid: true, scopeType: 'subproject', subproject: subproject };
    }

    // If bidding on full project, verify it's a complete project
    if (scopeType === 'full_project') {
      if (project.projectType === 'mega' && project.subProjects && project.subProjects.length > 0) {
        // For megaprojects, vendors can bid on the full project
        return { valid: true, scopeType: 'full_project' };
      }
      return { valid: true, scopeType: 'full_project' };
    }

    // Vendors cannot bid on partial work
    if (scopeType === 'minor_scope' || scopeType === 'partial') {
      return { 
        valid: false, 
        error: 'Vendors cannot submit proposals for partial work. You can only bid on complete subprojects or full projects.' 
      };
    }

    return { valid: true };
  }

  // ============================================
  // Validate Sub_Contractor Proposal
  // ============================================
  async function validateSubContractorProposal(proposalData) {
    if (!proposalData) {
      return { valid: false, error: 'Proposal data is required' };
    }

    const currentUser = PMTwinData?.Sessions?.getCurrentUser();
    if (!currentUser) {
      return { valid: false, error: 'User not authenticated' };
    }

    // Get user role
    let userRole = currentUser.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      userRole = await PMTwinRBAC.getCurrentUserRole();
    }

    // Only validate for sub_contractors
    if (userRole !== 'sub_contractor') {
      return { valid: true }; // Not a sub_contractor, skip validation
    }

    // Sub_contractors must submit to vendors, not entities
    if (!proposalData.vendorId) {
      return { 
        valid: false, 
        error: 'Sub_contractors can only submit proposals to vendors. Please select a vendor.' 
      };
    }

    // Verify vendor exists
    const vendor = PMTwinData?.Users?.getById?.(proposalData.vendorId);
    if (!vendor) {
      return { valid: false, error: 'Vendor not found' };
    }

    // Verify vendor role
    let vendorRole = vendor.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      vendorRole = await PMTwinRBAC.getUserRole(vendor.id, vendor.email);
    }

    if (vendorRole !== 'vendor' && vendorRole !== 'service_provider') {
      return { valid: false, error: 'Selected user is not a vendor' };
    }

    // Sub_contractors cannot bid on full projects or subprojects
    if (proposalData.scopeType === 'full_project' || proposalData.scopeType === 'subproject') {
      return { 
        valid: false, 
        error: 'Sub_contractors can only work on minor scope work, not full projects or subprojects.' 
      };
    }

    // Ensure proposal type is set correctly
    if (proposalData.proposalType !== 'sub_contractor_to_vendor') {
      proposalData.proposalType = 'sub_contractor_to_vendor';
    }

    // Ensure scope type is minor_scope
    if (!proposalData.scopeType || proposalData.scopeType !== 'minor_scope') {
      proposalData.scopeType = 'minor_scope';
    }

    return { valid: true, proposalData: proposalData };
  }

  // ============================================
  // Validate Subproject Completeness
  // ============================================
  function validateSubprojectCompleteness(subproject) {
    if (!subproject) {
      return { valid: false, error: 'Subproject is required' };
    }

    // Required fields for a complete subproject
    const requiredFields = ['title', 'description', 'category', 'scope', 'budget'];
    const missingFields = [];

    for (const field of requiredFields) {
      if (!subproject[field]) {
        missingFields.push(field);
      }
    }

    // Validate scope has required services or skills
    if (subproject.scope) {
      if ((!subproject.scope.requiredServices || subproject.scope.requiredServices.length === 0) &&
          (!subproject.scope.skillRequirements || subproject.scope.skillRequirements.length === 0)) {
        missingFields.push('scope.requiredServices or scope.skillRequirements');
      }
    }

    // Validate budget
    if (subproject.budget) {
      if (!subproject.budget.min && !subproject.budget.max && !subproject.budget.total) {
        missingFields.push('budget (min, max, or total)');
      }
    }

    if (missingFields.length > 0) {
      return { 
        valid: false, 
        error: `Subproject is incomplete. Missing required fields: ${missingFields.join(', ')}` 
      };
    }

    return { valid: true };
  }

  // ============================================
  // Validate Proposal Based on Role
  // ============================================
  async function validateProposal(proposalData, project = null) {
    if (!proposalData) {
      return { valid: false, error: 'Proposal data is required' };
    }

    const currentUser = PMTwinData?.Sessions?.getCurrentUser();
    if (!currentUser) {
      return { valid: false, error: 'User not authenticated' };
    }

    // Get user role
    let userRole = currentUser.role;
    if (typeof PMTwinRBAC !== 'undefined') {
      userRole = await PMTwinRBAC.getCurrentUserRole();
    }

    // Load project if not provided
    if (!project && proposalData.projectId) {
      project = PMTwinData?.Projects?.getById?.(proposalData.projectId);
    }

    // Role-specific validations
    if (userRole === 'vendor' || userRole === 'service_provider') {
      if (!project) {
        return { valid: false, error: 'Project is required for vendor proposals' };
      }
      return await validateVendorProposalScope(proposalData, project);
    }

    if (userRole === 'sub_contractor') {
      return await validateSubContractorProposal(proposalData);
    }

    if (userRole === 'entity') {
      return { 
        valid: false, 
        error: 'Entities cannot submit proposals. They only receive proposals.' 
      };
    }

    // Default: allow other roles (for backward compatibility)
    return { valid: true };
  }

  // ============================================
  // Public API
  // ============================================
  window.ProposalValidator = {
    validateVendorProposalScope,
    validateSubContractorProposal,
    validateSubprojectCompleteness,
    validateProposal
  };

})();

