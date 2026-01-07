/**
 * Service Request Service
 * Business logic for Service Request management
 */

(function() {
  'use strict';

  /**
   * Create service request
   * @param {Object} requestData - Request data
   * @returns {Object} - Created request or error
   */
  function createServiceRequest(requestData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard
    if (typeof ServiceTrackGuards !== 'undefined' && !ServiceTrackGuards.guardServiceRequestCreation()) {
      return { success: false, error: 'Only Entity, Beneficiary, or Vendor can create service requests' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Set requester info
    requestData.requesterId = currentUser.id;
    if (!requestData.requesterType) {
      if (currentUser.role === 'entity' || currentUser.role === 'beneficiary') {
        requestData.requesterType = 'ENTITY';
      } else if (currentUser.role === 'vendor') {
        requestData.requesterType = 'VENDOR';
      }
    }

    // Validate
    if (typeof ServiceRequestValidator !== 'undefined') {
      const validation = ServiceRequestValidator.validateServiceRequest(requestData);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    // Create request
    const request = PMTwinData.ServiceRequests.create(requestData);
    if (request) {
      return { success: true, request: request };
    }

    return { success: false, error: 'Failed to create service request' };
  }

  /**
   * Get service request by ID
   * @param {string} id - Request ID
   * @returns {Object} - Request or null
   */
  function getServiceRequest(id) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests) {
      return null;
    }

    return PMTwinData.ServiceRequests.getById(id);
  }

  /**
   * Get current user's service requests
   * @returns {Array} - Array of requests
   */
  function getMyServiceRequests() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Sessions || !PMTwinData.ServiceRequests) {
      return [];
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return [];
    }

    return PMTwinData.ServiceRequests.getByRequester(currentUser.id);
  }

  /**
   * Update service request status
   * @param {string} id - Request ID
   * @param {string} status - New status
   * @returns {Object} - Updated request or error
   */
  function updateServiceRequestStatus(id, status) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests) {
      return { success: false, error: 'Data service not available' };
    }

    const request = PMTwinData.ServiceRequests.getById(id);
    if (!request) {
      return { success: false, error: 'Service request not found' };
    }

    // Validate status update
    if (typeof ServiceRequestValidator !== 'undefined') {
      const validation = ServiceRequestValidator.validateStatusUpdate(request.status, status);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }
    }

    const updated = PMTwinData.ServiceRequests.update(id, { status: status });
    if (updated) {
      return { success: true, request: updated };
    }

    return { success: false, error: 'Failed to update service request status' };
  }

  /**
   * Get available service requests for providers
   * @returns {Array} - Array of open requests
   */
  function getAvailableServiceRequests() {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests) {
      return [];
    }

    return PMTwinData.ServiceRequests.getByStatus('OPEN');
  }

  /**
   * Bid on service request (Entity/Vendor can bid when they need services)
   * @param {string} serviceRequestId - Service request ID
   * @param {Object} bidData - Bid data
   * @returns {Object} - Result
   */
  function bidOnServiceRequest(serviceRequestId, bidData) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.ServiceRequests) {
      return { success: false, error: 'Data service not available' };
    }

    // Check guard - Entity/Vendor can bid
    if (typeof TrackGuards !== 'undefined' && !TrackGuards.requireEntityOrVendor()) {
      return { success: false, error: 'Only Entity, Beneficiary, or Vendor can bid on service requests' };
    }

    // Get current user
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check if request exists
    const request = PMTwinData.ServiceRequests.getById(serviceRequestId);
    if (!request) {
      return { success: false, error: 'Service request not found' };
    }

    // Check if request is open
    if (request.status !== 'OPEN') {
      return { success: false, error: 'Service request must be OPEN to bid' };
    }

    // Check if user already bid on this request
    const existingBids = request.bids || [];
    const hasExistingBid = existingBids.some(bid => bid.bidderId === currentUser.id);
    if (hasExistingBid) {
      return { success: false, error: 'You have already bid on this service request' };
    }

    // Create bid object
    const bid = {
      id: 'bid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      bidderId: currentUser.id,
      bidderType: currentUser.role === 'entity' || currentUser.role === 'beneficiary' ? 'ENTITY' : 'VENDOR',
      message: bidData.message || '',
      requirements: bidData.requirements || '',
      submittedAt: new Date().toISOString()
    };

    // Add bid to request
    const updatedBids = [...existingBids, bid];
    const updated = PMTwinData.ServiceRequests.update(serviceRequestId, {
      bids: updatedBids
    });

    if (updated) {
      return { success: true, message: 'Bid submitted successfully', bid: bid };
    }

    return { success: false, error: 'Failed to submit bid' };
  }

  // Export
  window.ServiceRequestService = {
    createServiceRequest,
    getServiceRequest,
    getMyServiceRequests,
    updateServiceRequestStatus,
    getAvailableServiceRequests,
    bidOnServiceRequest
  };

})();

