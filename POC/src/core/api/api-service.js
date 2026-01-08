/**
 * PMTwin API Service
 * High-level API service that abstracts data access
 * Automatically falls back to localStorage when API is not available
 */

(function() {
  'use strict';

  // ============================================
  // API Service Base Class
  // ============================================
  class ApiService {
    constructor(resourceName, localStorageKey) {
      this.resourceName = resourceName;
      this.localStorageKey = localStorageKey;
      this.apiClient = window.ApiClient || null;
    }

    /**
     * Check if API is available
     */
    isApiAvailable() {
      return this.apiClient && this.apiClient.isApiAvailable();
    }

    /**
     * Get from localStorage
     */
    getFromLocalStorage() {
      if (typeof localStorage === 'undefined') {
        return [];
      }
      try {
        const data = localStorage.getItem(this.localStorageKey);
        return data ? JSON.parse(data) : [];
      } catch (error) {
        console.error(`Error reading from localStorage (${this.localStorageKey}):`, error);
        return [];
      }
    }

    /**
     * Save to localStorage
     */
    saveToLocalStorage(data) {
      if (typeof localStorage === 'undefined') {
        return false;
      }
      try {
        localStorage.setItem(this.localStorageKey, JSON.stringify(data));
        return true;
      } catch (error) {
        console.error(`Error writing to localStorage (${this.localStorageKey}):`, error);
        return false;
      }
    }

    /**
     * Get all items
     */
    async getAll() {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.get(this.resourceName);
          if (response && response.success) {
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      return this.getFromLocalStorage();
    }

    /**
     * Get item by ID
     */
    async getById(id) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.get(`${this.resourceName}/${id}`);
          if (response && response.success) {
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      const items = this.getFromLocalStorage();
      return items.find(item => item.id === id) || null;
    }

    /**
     * Create new item
     */
    async create(data) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.post(this.resourceName, data);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const newItem = {
        ...data,
        id: data.id || this.generateId(),
        createdAt: data.createdAt || new Date().toISOString()
      };
      items.push(newItem);
      this.saveToLocalStorage(items);
      return newItem;
    }

    /**
     * Update item
     */
    async update(id, data) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.put(`${this.resourceName}/${id}`, data);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            this.apiClient.clearCache(`${this.resourceName}/${id}`);
            return response.data;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const index = items.findIndex(item => item.id === id);
      if (index === -1) {
        return null;
      }
      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      this.saveToLocalStorage(items);
      return items[index];
    }

    /**
     * Delete item
     */
    async delete(id) {
      if (this.isApiAvailable()) {
        try {
          const response = await this.apiClient.delete(`${this.resourceName}/${id}`);
          if (response && response.success) {
            // Invalidate cache
            this.apiClient.clearCache(this.resourceName);
            return true;
          }
        } catch (error) {
          console.warn(`API request failed, falling back to localStorage:`, error);
        }
      }
      // Fallback to localStorage
      const items = this.getFromLocalStorage();
      const filtered = items.filter(item => item.id !== id);
      this.saveToLocalStorage(filtered);
      return true;
    }

    /**
     * Generate unique ID
     */
    generateId(prefix = 'id') {
      return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }

  // ============================================
  // Specific API Services
  // ============================================
  const ApiServices = {
    users: new ApiService('users', 'pmtwin_users'),
    sessions: new ApiService('sessions', 'pmtwin_sessions'),
    projects: new ApiService('projects', 'pmtwin_projects'),
    proposals: new ApiService('proposals', 'pmtwin_proposals'),
    matches: new ApiService('matches', 'pmtwin_matches'),
    notifications: new ApiService('notifications', 'pmtwin_notifications'),
    audit: new ApiService('audit', 'pmtwin_audit'),
    collaborationOpportunities: new ApiService('collaboration-opportunities', 'pmtwin_collaboration_opportunities'),
    collaborationApplications: new ApiService('collaboration-applications', 'pmtwin_collaboration_applications'),
    serviceProviderProfiles: new ApiService('service-providers', 'pmtwin_service_provider_profiles'),
    serviceRequests: new ApiService('service-requests', 'pmtwin_service_requests'),
    serviceOffers: new ApiService('service-offers', 'pmtwin_service_offers'),
    serviceEngagements: new ApiService('service-engagements', 'pmtwin_service_engagements'),
    contracts: new ApiService('contracts', 'pmtwin_contracts'),
    engagements: new ApiService('engagements', 'pmtwin_engagements')
  };

  // ============================================
  // Service Provider API Methods
  // ============================================
  ApiServices.serviceProviderProfiles.getMyProfile = async function() {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/me`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Sessions && PMTwinData.ServiceProviderProfiles) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (currentUser) {
        return PMTwinData.ServiceProviderProfiles.getByUserId(currentUser.id);
      }
    }
    return null;
  };

  ApiServices.serviceProviderProfiles.search = async function(filters) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/search`, filters);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceProviderService !== 'undefined') {
      return ServiceProviderService.searchProviders(filters);
    }
    return [];
  };

  ApiServices.serviceProviderProfiles.searchSkills = async function(skillFilters) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/skills/search`, skillFilters);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceProviderService !== 'undefined') {
      return ServiceProviderService.searchProviderSkills(skillFilters);
    }
    return [];
  };

  // ============================================
  // Service Request API Methods
  // ============================================
  ApiServices.serviceRequests.getMyRequests = async function() {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/my`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceRequestService !== 'undefined') {
      return ServiceRequestService.getMyServiceRequests();
    }
    return [];
  };

  ApiServices.serviceRequests.getAvailable = async function() {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/available`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceRequestService !== 'undefined') {
      return ServiceRequestService.getAvailableServiceRequests();
    }
    return [];
  };

  ApiServices.serviceRequests.bid = async function(id, bidData) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/bid`, bidData);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceRequestService !== 'undefined') {
      return ServiceRequestService.bidOnServiceRequest(id, bidData);
    }
    return { success: false, error: 'Service not available' };
  };

  // ============================================
  // Service Offer API Methods
  // ============================================
  ApiServices.serviceOffers.getForRequest = async function(serviceRequestId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/request/${serviceRequestId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceOfferService !== 'undefined') {
      return ServiceOfferService.getOffersForRequest(serviceRequestId);
    }
    return [];
  };

  ApiServices.serviceOffers.getMyOffers = async function() {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/my`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceOfferService !== 'undefined') {
      return ServiceOfferService.getMyOffers();
    }
    return [];
  };

  ApiServices.serviceOffers.accept = async function(id) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/accept`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceOfferService !== 'undefined') {
      return ServiceOfferService.acceptOffer(id);
    }
    return { success: false, error: 'Service not available' };
  };

  ApiServices.serviceOffers.reject = async function(id, reason) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/reject`, { reason });
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceOfferService !== 'undefined') {
      return ServiceOfferService.rejectOffer(id, reason);
    }
    return { success: false, error: 'Service not available' };
  };

  // ============================================
  // Service Engagement API Methods
  // ============================================
  ApiServices.serviceEngagements.getMy = async function() {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/my`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceEngagementService !== 'undefined') {
      return ServiceEngagementService.getMyEngagements();
    }
    return [];
  };

  ApiServices.serviceEngagements.linkSubProject = async function(id, subProjectId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/link-subproject`, { subProjectId });
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceEngagementService !== 'undefined') {
      return ServiceEngagementService.linkEngagementToSubProject(id, subProjectId);
    }
    return { success: false, error: 'Service not available' };
  };

  ApiServices.serviceEngagements.getForSubProject = async function(subProjectId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/subproject/${subProjectId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ServiceEngagementService !== 'undefined') {
      return ServiceEngagementService.getEngagementsForSubProject(subProjectId);
    }
    return [];
  };

  // ============================================
  // Contract API Methods
  // ============================================
  ApiServices.contracts.sign = async function(id, signerId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/sign`, { signerId });
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.signContract(id, signerId);
    }
    return { success: false, error: 'Service not available' };
  };

  ApiServices.contracts.getByScope = async function(scopeType, scopeId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/scope/${scopeType}/${scopeId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.getContractsByScope(scopeType, scopeId);
    }
    return [];
  };

  ApiServices.contracts.getByParty = async function(partyId, partyType) {
    if (this.isApiAvailable()) {
      try {
        const url = partyType 
          ? `${this.resourceName}/party/${partyId}?type=${partyType}`
          : `${this.resourceName}/party/${partyId}`;
        const response = await this.apiClient.get(url);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.getContractsByParty(partyId, partyType);
    }
    return [];
  };

  ApiServices.contracts.getSubContracts = async function(parentContractId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/${parentContractId}/sub-contracts`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.getSubContracts(parentContractId);
    }
    return [];
  };

  ApiServices.contracts.createFromProposal = async function(proposalId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/from-proposal/${proposalId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.createContractFromProposal(proposalId);
    }
    return { success: false, error: 'Service not available' };
  };

  ApiServices.contracts.createFromServiceOffer = async function(serviceOfferId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/from-service-offer/${serviceOfferId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof ContractService !== 'undefined') {
      return ContractService.createContractFromServiceOffer(serviceOfferId);
    }
    return { success: false, error: 'Service not available' };
  };

  // ============================================
  // Engagement API Methods
  // ============================================
  ApiServices.engagements.getByContract = async function(contractId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/contract/${contractId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof EngagementService !== 'undefined') {
      return EngagementService.getEngagementsByContract(contractId);
    }
    return [];
  };

  ApiServices.engagements.getByScope = async function(scopeType, scopeId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.get(`${this.resourceName}/scope/${scopeType}/${scopeId}`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof EngagementService !== 'undefined') {
      return EngagementService.getEngagementsByScope(scopeType, scopeId);
    }
    return [];
  };

  ApiServices.engagements.assignToScope = async function(id, scopeType, scopeId) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/assign-scope`, { scopeType, scopeId });
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof EngagementService !== 'undefined') {
      return EngagementService.assignEngagementToScope(id, scopeType, scopeId);
    }
    return { success: false, error: 'Service not available' };
  };

  ApiServices.engagements.complete = async function(id) {
    if (this.isApiAvailable()) {
      try {
        const response = await this.apiClient.post(`${this.resourceName}/${id}/complete`);
        if (response && response.success) {
          return response.data;
        }
      } catch (error) {
        console.warn(`API request failed, falling back to localStorage:`, error);
      }
    }
    // Fallback to localStorage
    if (typeof EngagementService !== 'undefined') {
      return EngagementService.completeEngagement(id);
    }
    return { success: false, error: 'Service not available' };
  };

  // ============================================
  // Export
  // ============================================
  window.ApiService = ApiService;
  window.ApiServices = ApiServices;

})();

