/**
 * Unified Marketplace Service
 * Bridges service requests/offerings with collaboration opportunities
 * Supports intentType: REQUEST_SERVICE | OFFER_SERVICE | BOTH
 */

(function() {
  'use strict';

  /**
   * Create service request as opportunity
   * @param {Object} requestData - Service request data
   * @returns {Object} - Created opportunity or error
   */
  function createServiceRequest(requestData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return { success: false, error: 'Data service not available' };
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Create opportunity with REQUEST_SERVICE intent
    const opportunityData = {
      intentType: 'REQUEST_SERVICE',
      paymentMode: requestData.paymentMode || 'Cash',
      modelType: '1.1', // Default to Task-Based for service requests
      modelId: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      creatorId: currentUser.id,
      creatorType: currentUser.role || 'entity',
      title: requestData.title,
      description: requestData.description,
      status: 'active',
      // Map service request fields to opportunity attributes
      attributes: {
        taskTitle: requestData.title,
        taskType: requestData.category || 'Other',
        detailedScope: requestData.description,
        requiredSkills: requestData.requiredSkills || [],
        budgetRange: requestData.budget || { min: 0, max: 0, currency: 'SAR' },
        duration: requestData.timeline?.duration || 30,
        startDate: requestData.timeline?.startDate || null
      },
      // Link to original service request if exists
      serviceRequestId: requestData.id || null
    };

    // Add barter settlement rule if barter/hybrid
    if (opportunityData.paymentMode === 'Barter' || opportunityData.paymentMode === 'Hybrid') {
      opportunityData.barterSettlementRule = requestData.barterSettlementRule || 'ALLOW_DIFFERENCE_WITH_CASH';
    }

    const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);

    if (opportunity) {
      return { success: true, opportunity: opportunity };
    }

    return { success: false, error: 'Failed to create service request opportunity' };
  }

  /**
   * Create service offering as opportunity
   * @param {Object} offeringData - Service offering data
   * @returns {Object} - Created opportunity or error
   */
  function createServiceOffering(offeringData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return { success: false, error: 'Data service not available' };
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Map exchange_type to paymentMode
    const paymentMode = offeringData.exchange_type === 'Mixed' ? 'Hybrid' : 
                       (offeringData.exchange_type || 'Cash');

    // Create opportunity with OFFER_SERVICE intent
    const opportunityData = {
      intentType: 'OFFER_SERVICE',
      paymentMode: paymentMode,
      modelType: '1.1', // Default to Task-Based for service offerings
      modelId: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      creatorId: currentUser.id,
      creatorType: currentUser.role || 'service_provider',
      title: offeringData.title,
      description: offeringData.description,
      status: offeringData.status === 'Active' ? 'active' : 'draft',
      // Map service offering fields to opportunity attributes
      attributes: {
        taskTitle: offeringData.title,
        taskType: offeringData.category || 'Other',
        detailedScope: offeringData.description,
        requiredSkills: offeringData.skills || [],
        budgetRange: {
          min: offeringData.price_min || 0,
          max: offeringData.price_max || 0,
          currency: offeringData.currency || 'SAR'
        },
        duration: offeringData.estimatedDuration || 30,
        locationRequirement: offeringData.delivery_mode || 'Hybrid'
      },
      // Link to original service offering if exists
      serviceOfferingId: offeringData.id || null
    };

    // Add barter settlement rule if barter/hybrid
    if (opportunityData.paymentMode === 'Barter' || opportunityData.paymentMode === 'Hybrid') {
      opportunityData.barterSettlementRule = offeringData.barterSettlementRule || 'ALLOW_DIFFERENCE_WITH_CASH';
      opportunityData.attributes.barterOffer = offeringData.barterPreferences?.join(', ') || offeringData.barterOffer || '';
    }

    const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);

    if (opportunity) {
      return { success: true, opportunity: opportunity };
    }

    return { success: false, error: 'Failed to create service offering opportunity' };
  }

  /**
   * Create bidirectional opportunity (BOTH intent)
   * @param {Object} opportunityData - Opportunity data with both request and offer
   * @returns {Object} - Created opportunity or error
   */
  function createBidirectionalOpportunity(opportunityData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return { success: false, error: 'Data service not available' };
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Ensure intentType is BOTH
    opportunityData.intentType = 'BOTH';
    opportunityData.creatorId = currentUser.id;
    opportunityData.creatorType = currentUser.role || 'entity';

    const opportunity = PMTwinData.CollaborationOpportunities.create(opportunityData);

    if (opportunity) {
      return { success: true, opportunity: opportunity };
    }

    return { success: false, error: 'Failed to create bidirectional opportunity' };
  }

  /**
   * Search unified marketplace (all opportunity types)
   * @param {Object} filters - Search filters
   * @returns {Array} - Array of matching opportunities
   */
  function searchMarketplace(filters = {}) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return [];
    }

    let opportunities = PMTwinData.CollaborationOpportunities.getAll();

    // Filter by intentType
    if (filters.intentType) {
      opportunities = opportunities.filter(o => o.intentType === filters.intentType);
    }

    // Filter by paymentMode
    if (filters.paymentMode) {
      opportunities = opportunities.filter(o => o.paymentMode === filters.paymentMode);
    }

    // Filter by status
    if (filters.status) {
      opportunities = opportunities.filter(o => o.status === filters.status);
    } else {
      // Default to active only
      opportunities = opportunities.filter(o => o.status === 'active');
    }

    // Filter by category
    if (filters.category) {
      opportunities = opportunities.filter(o => o.category === filters.category);
    }

    // Filter by modelType
    if (filters.modelType) {
      opportunities = opportunities.filter(o => 
        o.modelType === filters.modelType || o.modelId === filters.modelType
      );
    }

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      opportunities = opportunities.filter(o => 
        (o.title && o.title.toLowerCase().includes(searchLower)) ||
        (o.description && o.description.toLowerCase().includes(searchLower)) ||
        (o.attributes?.taskTitle && o.attributes.taskTitle.toLowerCase().includes(searchLower))
      );
    }

    // Location filter
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      opportunities = opportunities.filter(o => 
        (o.attributes?.location && o.attributes.location.toLowerCase().includes(locationLower)) ||
        (o.attributes?.projectLocation && o.attributes.projectLocation.toLowerCase().includes(locationLower))
      );
    }

    // Price range filter
    if (filters.priceMin || filters.priceMax) {
      opportunities = opportunities.filter(o => {
        const budget = o.attributes?.budgetRange;
        if (!budget) return false;
        const min = budget.min || 0;
        const max = budget.max || 0;
        if (filters.priceMin && max < filters.priceMin) return false;
        if (filters.priceMax && min > filters.priceMax) return false;
        return true;
      });
    }

    return opportunities;
  }

  /**
   * Get unified marketplace opportunities by intent type
   * @param {string} intentType - REQUEST_SERVICE | OFFER_SERVICE | BOTH
   * @param {Object} filters - Additional filters
   * @returns {Array} - Array of opportunities
   */
  function getOpportunitiesByIntent(intentType, filters = {}) {
    return searchMarketplace({
      ...filters,
      intentType: intentType
    });
  }

  /**
   * Get service requests (as opportunities)
   * @param {Object} filters - Filters
   * @returns {Array} - Array of service request opportunities
   */
  function getServiceRequests(filters = {}) {
    return getOpportunitiesByIntent('REQUEST_SERVICE', filters);
  }

  /**
   * Get service offerings (as opportunities)
   * @param {Object} filters - Filters
   * @returns {Array} - Array of service offering opportunities
   */
  function getServiceOfferings(filters = {}) {
    return getOpportunitiesByIntent('OFFER_SERVICE', filters);
  }

  /**
   * Match service requests with service offerings
   * @param {string} requestOpportunityId - Request opportunity ID
   * @returns {Array} - Array of matched offering opportunities
   */
  function matchRequestToOfferings(requestOpportunityId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return [];
    }

    const request = PMTwinData.CollaborationOpportunities.getById(requestOpportunityId);
    if (!request || request.intentType !== 'REQUEST_SERVICE') {
      return [];
    }

    // Get all service offerings
    const offerings = getServiceOfferings({ status: 'active' });

    // Match based on skills, category, payment mode compatibility
    const matches = offerings.map(offering => {
      let score = 0;
      const factors = {};

      // Category match
      if (request.attributes?.taskType === offering.attributes?.taskType) {
        factors.categoryMatch = 100;
        score += 30;
      } else {
        factors.categoryMatch = 0;
      }

      // Skills match
      const requestSkills = request.attributes?.requiredSkills || [];
      const offeringSkills = offering.attributes?.requiredSkills || offering.attributes?.skills || [];
      if (requestSkills.length > 0 && offeringSkills.length > 0) {
        const matchedSkills = requestSkills.filter(skill => 
          offeringSkills.some(os => os.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(os.toLowerCase()))
        );
        factors.skillsMatch = (matchedSkills.length / requestSkills.length) * 100;
        score += factors.skillsMatch * 0.4;
      } else {
        factors.skillsMatch = 0;
      }

      // Payment mode compatibility
      if (request.paymentMode === offering.paymentMode) {
        factors.paymentMatch = 100;
        score += 20;
      } else if (
        (request.paymentMode === 'Hybrid' && offering.paymentMode === 'Cash') ||
        (request.paymentMode === 'Cash' && offering.paymentMode === 'Hybrid')
      ) {
        factors.paymentMatch = 50; // Partial match
        score += 10;
      } else {
        factors.paymentMatch = 0;
      }

      // Location match (if available)
      if (request.attributes?.location && offering.attributes?.location) {
        if (request.attributes.location === offering.attributes.location) {
          factors.locationMatch = 100;
          score += 10;
        } else {
          factors.locationMatch = 0;
        }
      } else {
        factors.locationMatch = 50; // Neutral if not specified
        score += 5;
      }

      return {
        offering: offering,
        score: Math.min(100, Math.round(score)),
        factors: factors,
        meetsThreshold: score >= 70
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  /**
   * Match service offerings with service requests
   * @param {string} offeringOpportunityId - Offering opportunity ID
   * @returns {Array} - Array of matched request opportunities
   */
  function matchOfferingToRequests(offeringOpportunityId) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      return [];
    }

    const offering = PMTwinData.CollaborationOpportunities.getById(offeringOpportunityId);
    if (!offering || offering.intentType !== 'OFFER_SERVICE') {
      return [];
    }

    // Get all service requests
    const requests = getServiceRequests({ status: 'active' });

    // Match based on skills, category, payment mode compatibility
    const matches = requests.map(request => {
      let score = 0;
      const factors = {};

      // Category match
      if (request.attributes?.taskType === offering.attributes?.taskType) {
        factors.categoryMatch = 100;
        score += 30;
      } else {
        factors.categoryMatch = 0;
      }

      // Skills match
      const requestSkills = request.attributes?.requiredSkills || [];
      const offeringSkills = offering.attributes?.requiredSkills || offering.attributes?.skills || [];
      if (requestSkills.length > 0 && offeringSkills.length > 0) {
        const matchedSkills = requestSkills.filter(skill => 
          offeringSkills.some(os => os.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(os.toLowerCase()))
        );
        factors.skillsMatch = (matchedSkills.length / requestSkills.length) * 100;
        score += factors.skillsMatch * 0.4;
      } else {
        factors.skillsMatch = 0;
      }

      // Payment mode compatibility
      if (request.paymentMode === offering.paymentMode) {
        factors.paymentMatch = 100;
        score += 20;
      } else if (
        (request.paymentMode === 'Hybrid' && offering.paymentMode === 'Cash') ||
        (request.paymentMode === 'Cash' && offering.paymentMode === 'Hybrid')
      ) {
        factors.paymentMatch = 50;
        score += 10;
      } else {
        factors.paymentMatch = 0;
      }

      // Location match
      if (request.attributes?.location && offering.attributes?.location) {
        if (request.attributes.location === offering.attributes.location) {
          factors.locationMatch = 100;
          score += 10;
        } else {
          factors.locationMatch = 0;
        }
      } else {
        factors.locationMatch = 50;
        score += 5;
      }

      return {
        request: request,
        score: Math.min(100, Math.round(score)),
        factors: factors,
        meetsThreshold: score >= 70
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);

    return matches;
  }

  // ============================================
  // Export
  // ============================================

  window.UnifiedMarketplaceService = {
    createServiceRequest: createServiceRequest,
    createServiceOffering: createServiceOffering,
    createBidirectionalOpportunity: createBidirectionalOpportunity,
    searchMarketplace: searchMarketplace,
    getOpportunitiesByIntent: getOpportunitiesByIntent,
    getServiceRequests: getServiceRequests,
    getServiceOfferings: getServiceOfferings,
    matchRequestToOfferings: matchRequestToOfferings,
    matchOfferingToRequests: matchOfferingToRequests
  };

})();
