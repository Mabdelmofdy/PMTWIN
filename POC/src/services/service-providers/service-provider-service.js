/**
 * Service Provider Service
 * Handles service provider-related operations with role-based access control
 */

(function() {
  'use strict';

  let serviceProvidersData = null;
  let serviceCategoriesData = null;

  // ============================================
  // Helper: Get Base Path for Data Files
  // ============================================
  function getDataBasePath() {
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    
    // Count how many directory levels deep we are (excluding POC root and filename)
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // ============================================
  // Data Loading
  // ============================================
  async function loadServiceProvidersData() {
    if (serviceProvidersData) return serviceProvidersData;
    
    // Check localStorage first (for POC persistence)
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('pmtwin_service_providers');
      if (stored) {
        try {
          serviceProvidersData = JSON.parse(stored);
          return serviceProvidersData;
        } catch (e) {
          console.warn('Error parsing stored service providers data:', e);
        }
      }
    }
    
    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/service-providers.json');
      serviceProvidersData = await response.json();
      
      // Store in localStorage for persistence
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('pmtwin_service_providers', JSON.stringify(serviceProvidersData));
      }
      
      return serviceProvidersData;
    } catch (error) {
      console.error('Error loading service providers data:', error);
      return { serviceProviders: [], serviceOfferings: [] };
    }
  }

  async function loadServiceCategoriesData() {
    if (serviceCategoriesData) return serviceCategoriesData;
    
    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/service-categories.json');
      serviceCategoriesData = await response.json();
      return serviceCategoriesData;
    } catch (error) {
      console.error('Error loading service categories data:', error);
      return { categories: [] };
    }
  }

  // ============================================
  // Service Provider Operations
  // ============================================
  async function getServiceProviders(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    // Use index for faster queries if available
    let providerIds = null;
    if (PMTwinData.IndexManager && (filters.category || filters.location || filters.availability || filters.providerType || filters.skills)) {
      providerIds = PMTwinData.IndexManager.queryProviders({
        category: filters.category,
        location: filters.location,
        availability: filters.availability,
        providerType: filters.providerType,
        skills: filters.skills
      });
    }
    
    // Get providers from indexed structure
    let providers = [];
    if (providerIds && providerIds.length > 0) {
      providers = providerIds.map(id => PMTwinData.ServiceProviders.getById(id)).filter(p => p != null);
    } else {
      providers = PMTwinData.ServiceProviders.getAll();
    }
    
    // Apply additional filters that can't be indexed
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      providers = providers.filter(p => {
        const name = (p.companyName || p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        return name.includes(searchLower) || desc.includes(searchLower);
      });
    }
    
    // Sort
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'name':
          providers.sort((a, b) => (a.companyName || a.name || '').localeCompare(b.companyName || b.name || ''));
          break;
        case 'profileScore':
          providers.sort((a, b) => (b.profileScore || 0) - (a.profileScore || 0));
          break;
        case 'responseTime':
          providers.sort((a, b) => {
            const aTime = parseInt(a.responseTime) || 999;
            const bTime = parseInt(b.responseTime) || 999;
            return aTime - bTime;
          });
          break;
      }
    }
    
    return { success: true, providers };
  }

  async function getServiceProviderById(providerId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const provider = PMTwinData.ServiceProviders.getById(providerId);
    
    if (!provider) {
      return { success: false, error: 'Service provider not found' };
    }
    
    return { success: true, provider };
  }

  async function getServiceProviderByUserId(userId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const provider = PMTwinData.ServiceProviders.getByUserId(userId);
    
    if (!provider) {
      return { success: false, error: 'Service provider not found' };
    }
    
    return { success: true, provider };
  }

  async function getServiceOfferings(providerId = null, filters = {}) {
    const data = await loadServiceProvidersData();
    let offerings = [...(data.serviceOfferings || [])];
    
    if (providerId) {
      offerings = offerings.filter(o => o.providerId === providerId);
    }
    
    // Apply filters
    if (filters.category) {
      offerings = offerings.filter(o => o.category === filters.category);
    }
    
    if (filters.availability) {
      offerings = offerings.filter(o => o.availability === filters.availability);
    }
    
    if (filters.pricingModel) {
      offerings = offerings.filter(o => o.pricingModel === filters.pricingModel);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      offerings = offerings.filter(o => {
        const title = (o.title || '').toLowerCase();
        const desc = (o.description || '').toLowerCase();
        return title.includes(searchLower) || desc.includes(searchLower);
      });
    }
    
    return { success: true, offerings };
  }

  async function getServiceOfferingById(offeringId) {
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (!offering) {
      return { success: false, error: 'Service offering not found' };
    }
    
    return { success: true, offering };
  }

  async function searchServiceProviders(query, filters = {}) {
    const searchFilters = { ...filters, search: query };
    return await getServiceProviders(searchFilters);
  }

  // ============================================
  // Create/Update Service Provider
  // ============================================
  async function createServiceProvider(providerData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_service_provider');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create service provider profile' };
      }
    }

    // Set userId from current user
    providerData.userId = currentUser.id;

    const provider = PMTwinData.ServiceProviders.create(providerData);
    
    if (provider) {
      return { success: true, provider: provider };
    }
    
    return { success: false, error: 'Failed to create service provider' };
  }

  async function updateServiceProvider(providerId, providerData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const provider = PMTwinData.ServiceProviders.getById(providerId);
    if (!provider) {
      return { success: false, error: 'Service provider not found' };
    }

    // Verify ownership
    if (provider.userId !== currentUser.id) {
      // Check admin permission
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_service_providers');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to update this service provider' };
        }
      } else {
        return { success: false, error: 'You do not have permission to update this service provider' };
      }
    }

    const updated = PMTwinData.ServiceProviders.update(providerId, providerData);
    
    if (updated) {
      return { success: true, provider: updated };
    }
    
    return { success: false, error: 'Failed to update service provider' };
  }

  // ============================================
  // Service Offering CRUD Operations
  // ============================================
  async function createServiceOffering(offeringData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_service_offerings');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create service offerings' };
      }
    }
    
    // Get provider for current user
    const providerResult = await getServiceProviderByUserId(currentUser.id);
    if (!providerResult.success) {
      return { success: false, error: 'Service provider profile not found. Please complete your profile first.' };
    }
    
    const offering = {
      id: 'so_' + Date.now(),
      providerId: providerResult.provider.id,
      category: offeringData.category,
      title: offeringData.title,
      description: offeringData.description,
      pricingModel: offeringData.pricingModel || 'project',
      priceRange: offeringData.priceRange || { min: 0, max: 0, currency: 'SAR' },
      availability: offeringData.availability || 'available',
      serviceAreas: offeringData.serviceAreas || [],
      certifications: offeringData.certifications || [],
      portfolioItems: offeringData.portfolioItems || [],
      estimatedDuration: offeringData.estimatedDuration || 'TBD',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Save to localStorage (in production, this would be an API call)
    const data = await loadServiceProvidersData();
    data.serviceOfferings.push(offering);
    
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
    }
    
    serviceProvidersData = data;
    
    // Update index
    if (PMTwinData && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.updateOfferingIndex(offering.id);
    }
    
    return { success: true, offering };
  }

  async function updateServiceOffering(offeringId, offeringData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('edit_own_service_offerings');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to edit service offerings' };
      }
    }
    
    const data = await loadServiceProvidersData();
    const offeringIndex = data.serviceOfferings.findIndex(o => o.id === offeringId);
    
    if (offeringIndex === -1) {
      return { success: false, error: 'Service offering not found' };
    }
    
    const offering = data.serviceOfferings[offeringIndex];
    
    // Verify ownership
    const providerResult = await getServiceProviderByUserId(currentUser.id);
    if (!providerResult.success || providerResult.provider.id !== offering.providerId) {
      return { success: false, error: 'You do not have permission to edit this service offering' };
    }
    
    // Update offering
    Object.keys(offeringData).forEach(key => {
      if (offeringData[key] !== undefined) {
        offering[key] = offeringData[key];
      }
    });
    offering.updatedAt = new Date().toISOString();
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
    }
    
    serviceProvidersData = data;
    
    // Update index
    if (PMTwinData && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.updateOfferingIndex(offeringId);
    }
    
    return { success: true, offering };
  }

  async function deleteServiceOffering(offeringId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('edit_own_service_offerings');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to delete service offerings' };
      }
    }
    
    const data = await loadServiceProvidersData();
    const offeringIndex = data.serviceOfferings.findIndex(o => o.id === offeringId);
    
    if (offeringIndex === -1) {
      return { success: false, error: 'Service offering not found' };
    }
    
    const offering = data.serviceOfferings[offeringIndex];
    
    // Verify ownership
    const providerResult = await getServiceProviderByUserId(currentUser.id);
    if (!providerResult.success || providerResult.provider.id !== offering.providerId) {
      return { success: false, error: 'You do not have permission to delete this service offering' };
    }
    
    // Delete offering
    data.serviceOfferings.splice(offeringIndex, 1);
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
    }
    
    serviceProvidersData = data;
    
    // Remove from index
    if (PMTwinData && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.removeFromIndex(offeringId, 'offering');
    }
    
    return { success: true };
  }

  // ============================================
  // Service Categories
  // ============================================
  async function getServiceCategories() {
    const data = await loadServiceCategoriesData();
    return { success: true, categories: data.categories || [] };
  }

  async function getServiceCategoryById(categoryId) {
    const data = await loadServiceCategoriesData();
    const category = data.categories.find(c => c.id === categoryId);
    
    if (!category) {
      return { success: false, error: 'Service category not found' };
    }
    
    return { success: true, category };
  }

  // ============================================
  // Public API
  // ============================================
  window.ServiceProviderService = {
    // Service Providers
    getServiceProviders,
    getServiceProviderById,
    getServiceProviderByUserId,
    createServiceProvider,
    updateServiceProvider,
    searchServiceProviders,
    
    // Service Offerings
    getServiceOfferings,
    getServiceOfferingById,
    createServiceOffering,
    updateServiceOffering,
    deleteServiceOffering,
    
    // Categories
    getServiceCategories,
    getServiceCategoryById,
    
    // Data Loading
    loadServiceProvidersData,
    loadServiceCategoriesData
  };

})();

