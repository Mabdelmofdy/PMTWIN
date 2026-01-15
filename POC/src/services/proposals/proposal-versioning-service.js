/**
 * Proposal Versioning Service
 * Handles proposal versioning, negotiation tracking, and counteroffers
 */

(function() {
  'use strict';

  /**
   * Create a new version of a proposal
   * @param {string} proposalId - Original proposal ID
   * @param {Object} updates - Updates to apply (must include comment)
   * @param {string} updatedBy - User ID making the update
   * @returns {Object} - Result { success: boolean, proposal: Object, error: string }
   */
  function createProposalVersion(proposalId, updates, updatedBy) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const originalProposal = PMTwinData.Proposals.getById(proposalId);
    if (!originalProposal) {
      return { success: false, error: 'Original proposal not found' };
    }

    // Validate comment is required (min 10 characters)
    const comment = updates.comment || updates.commentText || '';
    if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
      return { success: false, error: 'Comment is required and must be at least 10 characters long' };
    }

    // Determine new version number
    const currentVersion = originalProposal.currentVersion || originalProposal.version || originalProposal.versions?.length || 1;
    const newVersion = currentVersion + 1;

    // Get version history
    const versionHistory = originalProposal.versionHistory || [];
    
    // Create version snapshot of original
    const versionSnapshot = {
      version: currentVersion,
      proposalData: JSON.parse(JSON.stringify(originalProposal)),
      createdAt: originalProposal.updatedAt || originalProposal.createdAt,
      createdBy: originalProposal.providerId || originalProposal.bidderCompanyId
    };

    // Add to history if not already there
    if (versionHistory.length === 0 || versionHistory[versionHistory.length - 1].version !== currentVersion) {
      versionHistory.push(versionSnapshot);
    }

    // Create new version proposal
    const newProposalData = {
      ...originalProposal,
      ...updates,
      version: newVersion,
      parentProposalId: originalProposal.parentProposalId || proposalId, // Root proposal ID
      versionHistory: versionHistory,
      negotiationStatus: determineNegotiationStatus(originalProposal, updates),
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy
    };

    // Update negotiation thread
    if (!newProposalData.negotiationThread) {
      newProposalData.negotiationThread = [];
    }

    newProposalData.negotiationThread.push({
      version: newVersion,
      action: updates.status === 'NEGOTIATION' ? 'COUNTEROFFER' : 'REVISION',
      updatedBy: updatedBy,
      changes: getChangedFields(originalProposal, newProposalData),
      timestamp: new Date().toISOString(),
      notes: updates.negotiationNotes || null
    });

    // Update the proposal
    const updatedProposal = PMTwinData.Proposals.update(proposalId, newProposalData);

    if (updatedProposal) {
      return {
        success: true,
        proposal: updatedProposal,
        version: newVersion
      };
    }

    return { success: false, error: 'Failed to create proposal version' };
  }

  /**
   * Create a counteroffer
   * @param {string} proposalId - Original proposal ID
   * @param {Object} counterofferData - Counteroffer data
   * @param {string} updatedBy - User ID making the counteroffer
   * @returns {Object} - Result { success: boolean, proposal: Object, error: string }
   */
  function createCounteroffer(proposalId, counterofferData, updatedBy) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const originalProposal = PMTwinData.Proposals.getById(proposalId);
    if (!originalProposal) {
      return { success: false, error: 'Original proposal not found' };
    }

    // Validate that counteroffer can be created
    // Only owner can create counteroffer to provider's proposal
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const ownerCompanyId = originalProposal.ownerCompanyId;
    const bidderCompanyId = originalProposal.bidderCompanyId;

    // Check if user is the owner (can counteroffer)
    if (currentUser.id !== ownerCompanyId) {
      return { success: false, error: 'Only the opportunity owner can create counteroffers' };
    }

    // Set negotiation status
    const updates = {
      ...counterofferData,
      status: 'NEGOTIATION',
      negotiationStatus: 'COUNTEROFFER',
      negotiationNotes: counterofferData.negotiationNotes || null
    };

    return createProposalVersion(proposalId, updates, updatedBy);
  }

  /**
   * Get all versions of a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Array} - Array of proposal versions
   */
  function getProposalVersions(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return [];
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return [];
    }

    // Get root proposal ID
    const rootProposalId = proposal.parentProposalId || proposalId;

    // Get all proposals with same parentProposalId
    const allProposals = PMTwinData.Proposals.getAll();
    const versions = allProposals.filter(p => 
      (p.parentProposalId === rootProposalId || p.id === rootProposalId) &&
      p.id !== rootProposalId // Exclude root if it's not the current one
    );

    // Add current proposal if not in versions
    if (proposal.id !== rootProposalId) {
      versions.push(proposal);
    }

    // Sort by version number
    versions.sort((a, b) => (a.version || 1) - (b.version || 1));

    return versions;
  }

  /**
   * Get latest version of a proposal
   * @param {string} proposalId - Proposal ID (can be any version)
   * @returns {Object|null} - Latest proposal version
   */
  function getLatestProposalVersion(proposalId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return null;
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return null;
    }

    // Get root proposal ID
    const rootProposalId = proposal.parentProposalId || proposalId;

    // Get all versions
    const versions = getProposalVersions(rootProposalId);

    if (versions.length === 0) {
      return proposal; // Return original if no versions
    }

    // Return version with highest version number
    return versions.reduce((latest, current) => {
      const currentVersion = current.version || 1;
      const latestVersion = latest.version || 1;
      return currentVersion > latestVersion ? current : latest;
    });
  }

  /**
   * Compare two proposal versions
   * @param {Object} version1 - First proposal version
   * @param {Object} version2 - Second proposal version
   * @returns {Object} - Comparison result { changes: Object, summary: string }
   */
  function compareProposalVersions(version1, version2) {
    const changes = {
      pricing: {},
      timeline: {},
      terms: {},
      services: {},
      other: {}
    };

    // Compare pricing
    if (version1.total !== version2.total) {
      changes.pricing.total = { from: version1.total, to: version2.total };
    }
    if (version1.currency !== version2.currency) {
      changes.pricing.currency = { from: version1.currency, to: version2.currency };
    }

    // Compare timeline
    if (JSON.stringify(version1.timeline) !== JSON.stringify(version2.timeline)) {
      changes.timeline = {
        from: version1.timeline,
        to: version2.timeline
      };
    }

    // Compare terms
    if (JSON.stringify(version1.terms) !== JSON.stringify(version2.terms)) {
      changes.terms = {
        from: version1.terms,
        to: version2.terms
      };
    }

    // Compare services (for barter/hybrid)
    if (JSON.stringify(version1.servicesOffered) !== JSON.stringify(version2.servicesOffered)) {
      changes.services.servicesOffered = {
        from: version1.servicesOffered,
        to: version2.servicesOffered
      };
    }
    if (JSON.stringify(version1.servicesRequested) !== JSON.stringify(version2.servicesRequested)) {
      changes.services.servicesRequested = {
        from: version1.servicesRequested,
        to: version2.servicesRequested
      };
    }

    // Generate summary
    const changeCount = Object.keys(changes.pricing).length +
                       Object.keys(changes.timeline).length +
                       Object.keys(changes.terms).length +
                       Object.keys(changes.services).length;

    const summary = changeCount > 0 
      ? `${changeCount} field(s) changed between version ${version1.version || 1} and ${version2.version || 1}`
      : 'No changes detected';

    return {
      changes: changes,
      summary: summary,
      changeCount: changeCount
    };
  }

  /**
   * Determine negotiation status based on updates
   * @param {Object} original - Original proposal
   * @param {Object} updates - Updates being applied
   * @returns {string} - Negotiation status
   */
  function determineNegotiationStatus(original, updates) {
    if (updates.status === 'ACCEPTED') {
      return 'ACCEPTED';
    }
    if (updates.status === 'REJECTED') {
      return 'REJECTED';
    }
    if (updates.status === 'NEGOTIATION') {
      return 'COUNTEROFFER';
    }
    if (original.negotiationStatus === 'COUNTEROFFER' && updates.status !== 'REJECTED') {
      return 'REVISION';
    }
    return original.negotiationStatus || 'INITIAL';
  }

  /**
   * Get changed fields between two proposals
   * @param {Object} original - Original proposal
   * @param {Object} updated - Updated proposal
   * @returns {Array} - Array of changed field names
   */
  function getChangedFields(original, updated) {
    const changedFields = [];
    const fieldsToCheck = ['total', 'currency', 'timeline', 'terms', 'status', 'servicesOffered', 'servicesRequested', 'cashDetails', 'barterDetails'];

    fieldsToCheck.forEach(field => {
      if (JSON.stringify(original[field]) !== JSON.stringify(updated[field])) {
        changedFields.push(field);
      }
    });

    return changedFields;
  }

  /**
   * Create a new version with payment terms changes and comment
   * @param {string} proposalId - Proposal ID
   * @param {Object} paymentTermsUpdates - Updated payment terms
   * @param {string} comment - MANDATORY comment explaining changes (min 10 chars)
   * @param {Array} serviceItems - Optional service items overrides
   * @returns {Object} - Result { success: boolean, proposal: Object, error: string }
   */
  function createVersionWithChanges(proposalId, paymentTermsUpdates, comment, serviceItems = null) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      return { success: false, error: 'Data service not available' };
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // Validate comment is required (min 10 characters)
    if (!comment || typeof comment !== 'string' || comment.trim().length < 10) {
      return { success: false, error: 'Comment is required and must be at least 10 characters long' };
    }

    // Get current version payment terms
    const currentVersion = proposal.versions && proposal.versions.length > 0 
      ? proposal.versions[proposal.versions.length - 1] 
      : null;
    const currentPaymentTerms = currentVersion?.paymentTerms || {};

    // Merge payment terms updates
    const updatedPaymentTerms = {
      ...currentPaymentTerms,
      ...paymentTermsUpdates
    };

    // Prepare updates for new version
    const updates = {
      paymentTerms: updatedPaymentTerms,
      comment: comment.trim(),
      status: 'CHANGES_REQUESTED'
    };

    if (serviceItems) {
      updates.serviceItems = serviceItems;
    }

    // Use Proposals.createVersion if available
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const updatedBy = currentUser?.id || 'system';

    if (PMTwinData.Proposals.createVersion) {
      const updated = PMTwinData.Proposals.createVersion(proposalId, updates, updatedBy);
      if (updated) {
        return { success: true, proposal: updated };
      }
    }

    // Fallback: use createProposalVersion
    return createProposalVersion(proposalId, updates, updatedBy);
  }

  /**
   * Get negotiation thread for a proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Array} - Negotiation thread entries
   */
  function getNegotiationThread(proposalId) {
    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      return [];
    }

    return proposal.negotiationThread || [];
  }

  // ============================================
  // Export
  // ============================================

  window.ProposalVersioningService = {
    createVersion: createProposalVersion,
    createCounteroffer: createCounteroffer,
    createVersionWithChanges: createVersionWithChanges,
    getVersions: getProposalVersions,
    getLatestVersion: getLatestProposalVersion,
    compareVersions: compareProposalVersions,
    getNegotiationThread: getNegotiationThread
  };

  // Backward compatibility alias
  window.ProposalVersioning = window.ProposalVersioningService;

})();
