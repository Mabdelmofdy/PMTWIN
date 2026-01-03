/**
 * Service Offering Service
 * Handles service offering-related operations with role-based access control
 */

(function() {
  'use strict';

  let serviceProvidersData = null;

  // ============================================
  // Helper: Get Base Path for Data Files
  // ============================================
  function getDataBasePath() {
    const currentPath = window.location.pathname;
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    const depth = segments.length;
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

  // ============================================
  // Save Data to localStorage
  // ============================================
  function saveServiceProvidersData(data) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
    }
    serviceProvidersData = data;
  }

  // ============================================
  // Get Provider by User ID
  // ============================================
  async function getProviderByUserId(userId) {
    const data = await loadServiceProvidersData();
    const provider = data.serviceProviders.find(p => p.userId === userId);
    return provider || null;
  }

  // ============================================
  // Validate Offering Data
  // ============================================
  function validateOfferingData(offeringData, isUpdate = false) {
    const errors = [];
    
    // Required fields validation
    if (!isUpdate || offeringData.title !== undefined) {
      if (!offeringData.title || offeringData.title.trim().length === 0) {
        errors.push('Title is required');
      } else if (offeringData.title.length > 200) {
        errors.push('Title must be 200 characters or less');
      }
    }
    
    if (!isUpdate || offeringData.category !== undefined) {
      if (!offeringData.category) {
        errors.push('Category is required');
      }
      // Validate category against allowed values
      const allowedCategories = [
        'legal', 'logistics', 'design', 'engineering', 'consulting',
        'construction', 'project_management', 'quality_control', 'other'
      ];
      if (offeringData.category && !allowedCategories.includes(offeringData.category)) {
        errors.push(`Category must be one of: ${allowedCategories.join(', ')}`);
      }
    }
    
    if (!isUpdate || offeringData.description !== undefined) {
      if (!offeringData.description || offeringData.description.trim().length === 0) {
        errors.push('Description is required');
      } else if (offeringData.description.length < 50) {
        errors.push('Description must be at least 50 characters');
      } else if (offeringData.description.length > 5000) {
        errors.push('Description must be 5000 characters or less');
      }
    }
    
    // Pricing validation
    if (offeringData.price_min !== undefined && offeringData.price_max !== undefined) {
      if (offeringData.price_min < 0) {
        errors.push('Minimum price cannot be negative');
      }
      if (offeringData.price_max < 0) {
        errors.push('Maximum price cannot be negative');
      }
      if (offeringData.price_min > offeringData.price_max) {
        errors.push('Minimum price cannot be greater than maximum price');
      }
    }
    
    // Skills validation
    if (offeringData.skills !== undefined) {
      if (!Array.isArray(offeringData.skills)) {
        errors.push('Skills must be an array');
      } else if (offeringData.skills.length === 0) {
        errors.push('At least one skill is required');
      } else if (offeringData.skills.length > 20) {
        errors.push('Maximum 20 skills allowed');
      }
    }
    
    // Status validation
    if (offeringData.status !== undefined) {
      const allowedStatuses = ['Draft', 'Active', 'Paused', 'Archived'];
      if (!allowedStatuses.includes(offeringData.status)) {
        errors.push(`Status must be one of: ${allowedStatuses.join(', ')}`);
      }
    }
    
    // Delivery mode validation
    if (offeringData.delivery_mode !== undefined) {
      const allowedModes = ['On-site', 'Remote', 'Hybrid'];
      if (!allowedModes.includes(offeringData.delivery_mode)) {
        errors.push(`Delivery mode must be one of: ${allowedModes.join(', ')}`);
      }
    }
    
    // Exchange type validation
    if (offeringData.exchange_type !== undefined) {
      const allowedTypes = ['Cash', 'Barter', 'Mixed'];
      if (!allowedTypes.includes(offeringData.exchange_type)) {
        errors.push(`Exchange type must be one of: ${allowedTypes.join(', ')}`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }

  // ============================================
  // Create Offering (Enhanced per BRD)
  // ============================================
  async function createOffering(offeringData) {
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
    const provider = await getProviderByUserId(currentUser.id);
    if (!provider) {
      return { success: false, error: 'Service provider profile not found. Please complete your profile first.' };
    }
    
    // Validate offering data
    const validation = validateOfferingData(offeringData);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }
    
    // Get provider profile for additional data
    const providerProfile = typeof PMTwinData !== 'undefined' ? 
      PMTwinData.Users.getById(currentUser.id) : null;
    
    // Build comprehensive offering object per BRD patterns
    const now = new Date().toISOString();
    const offering = {
      // Identification
      id: 'so_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      provider_user_id: currentUser.id,
      providerId: provider.id,
      providerName: provider.name || providerProfile?.profile?.name || providerProfile?.name || 'Unknown Provider',
      
      // Basic Information
      title: offeringData.title.trim(),
      category: offeringData.category,
      subcategory: offeringData.subcategory || null,
      description: offeringData.description.trim(),
      shortDescription: offeringData.shortDescription || offeringData.description.substring(0, 200).trim(),
      
      // Skills & Expertise
      skills: offeringData.skills || [],
      experienceLevel: offeringData.experienceLevel || 'intermediate', // junior | intermediate | senior | expert
      minimumExperience: offeringData.minimumExperience || 0, // years
      certifications: offeringData.certifications || [],
      specializations: offeringData.specializations || [],
      
      // Service Details
      serviceType: offeringData.serviceType || 'general', // general | specialized | consulting | legal | logistics | design
      delivery_mode: offeringData.delivery_mode || 'Hybrid', // On-site | Remote | Hybrid
      estimatedDuration: offeringData.estimatedDuration || null, // days or "TBD"
      deliverables: offeringData.deliverables || [],
      
      // Location & Coverage
      location: {
        city: offeringData.location?.city || provider.location?.city || '',
        region: offeringData.location?.region || provider.location?.region || '',
        country: offeringData.location?.country || provider.location?.country || 'Saudi Arabia',
        coordinates: offeringData.location?.coordinates || null, // { lat, lng } for future GPS features
        radius: offeringData.location?.radius || 0, // km service radius
        serviceAreas: offeringData.location?.serviceAreas || [] // Array of cities/regions
      },
      
      // Pricing & Payment
      pricing_type: offeringData.pricing_type || 'Fixed', // Fixed | Hourly | Daily | Project-based | Milestone-based
      price_min: offeringData.price_min || 0,
      price_max: offeringData.price_max || 0,
      currency: offeringData.currency || 'SAR',
      exchange_type: offeringData.exchange_type || 'Cash', // Cash | Barter | Mixed
      paymentTerms: offeringData.paymentTerms || '30_days', // 30_days | 60_days | milestone_based | upfront
      barterPreferences: offeringData.barterPreferences || [], // What they accept in barter
      
      // Availability & Capacity
      availability: {
        start_date: offeringData.availability?.start_date || null,
        end_date: offeringData.availability?.end_date || null,
        capacity: offeringData.availability?.capacity || 1, // Number of concurrent engagements
        currentLoad: 0, // Track current active engagements
        lead_time: offeringData.availability?.lead_time || null, // e.g., "2-4 weeks"
        responseTime: offeringData.availability?.responseTime || null, // e.g., "24-48 hours"
        workingHours: offeringData.availability?.workingHours || null // e.g., "9 AM - 5 PM AST"
      },
      
      // Portfolio & Credentials
      portfolio_links: offeringData.portfolio_links || [],
      portfolioItems: offeringData.portfolioItems || [], // Array of portfolio objects
      attachments: offeringData.attachments || [], // Supporting documents
      credentials: offeringData.credentials || [], // Certifications, licenses
      endorsements: offeringData.endorsements || [], // Client testimonials
      
      // Collaboration Model Support
      supportedCollaborationModels: offeringData.supportedCollaborationModels || ['1.1'], // Task-Based by default
      // Model 1.1: Task-Based Engagement support
      taskBasedEngagement: {
        supported: offeringData.taskBasedEngagement?.supported !== false, // Default true for service providers
        taskTypes: offeringData.taskBasedEngagement?.taskTypes || ['Design', 'Engineering', 'Consultation'],
        preferredEngagementTypes: offeringData.taskBasedEngagement?.preferredEngagementTypes || []
      },
      // Model 2.2: Strategic Alliances support
      strategicAlliance: {
        supported: offeringData.strategicAlliance?.supported || false,
        allianceTypes: offeringData.strategicAlliance?.allianceTypes || [],
        targetSectors: offeringData.strategicAlliance?.targetSectors || []
      },
      
      // Status & Visibility
      status: offeringData.status || 'Draft', // Draft | Active | Paused | Archived
      visibility: offeringData.visibility || 'public', // public | registered_only
      featured: offeringData.featured || false,
      flagged: false,
      flagReason: null,
      qualityScore: 0, // Auto-calculated (0-100) based on completeness
      
      // Statistics & Tracking
      views: 0,
      inquiries: 0,
      matchesGenerated: 0,
      proposalsReceived: 0,
      proposalsAccepted: 0,
      completedEngagements: 0,
      averageRating: null, // 0-5 stars
      totalRatings: 0,
      
      // Timestamps
      createdAt: now,
      updatedAt: now,
      publishedAt: null,
      lastViewedAt: null,
      
      // Admin fields
      approvedAt: null,
      approvedBy: null,
      rejectedAt: null,
      rejectedBy: null,
      rejectionReason: null,
      
      // Metadata
      tags: offeringData.tags || [],
      metadata: {
        language: offeringData.metadata?.language || 'ar', // ar | en | both
        lastQualityCheck: null,
        version: 1
      }
    };
    
    // Calculate initial quality score
    offering.qualityScore = calculateQualityScore(offering);
    
    // Save to localStorage
    const data = await loadServiceProvidersData();
    if (!data.serviceOfferings) {
      data.serviceOfferings = [];
    }
    data.serviceOfferings.push(offering);
    saveServiceProvidersData(data);
    
    // Update index
    if (typeof PMTwinData !== 'undefined' && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.updateOfferingIndex(offering.id);
    }
    
    // Log audit trail if available
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Audit) {
      PMTwinData.Audit.log({
        action: 'service_offering_creation',
        entityType: 'service_offering',
        entityId: offering.id,
        description: `Created service offering: ${offering.title}`,
        metadata: {
          category: offering.category,
          status: offering.status
        }
      });
    }
    
    return { success: true, offering: offering };
  }
  
  // ============================================
  // Calculate Quality Score
  // ============================================
  function calculateQualityScore(offering) {
    let score = 0;
    let maxScore = 100;
    
    // Basic information (30 points)
    if (offering.title && offering.title.length > 10) score += 10;
    if (offering.description && offering.description.length > 100) score += 10;
    if (offering.shortDescription) score += 5;
    if (offering.category) score += 5;
    
    // Skills & Expertise (25 points)
    if (offering.skills && offering.skills.length > 0) score += 10;
    if (offering.skills && offering.skills.length >= 3) score += 5;
    if (offering.experienceLevel) score += 5;
    if (offering.certifications && offering.certifications.length > 0) score += 5;
    
    // Pricing (15 points)
    if (offering.price_min > 0 && offering.price_max > 0) score += 10;
    if (offering.pricing_type) score += 5;
    
    // Location (10 points)
    if (offering.location && offering.location.city) score += 5;
    if (offering.location && offering.location.country) score += 5;
    
    // Portfolio & Credentials (15 points)
    if (offering.portfolio_links && offering.portfolio_links.length > 0) score += 5;
    if (offering.portfolioItems && offering.portfolioItems.length > 0) score += 5;
    if (offering.credentials && offering.credentials.length > 0) score += 5;
    
    // Availability (5 points)
    if (offering.availability && offering.availability.start_date) score += 5;
    
    return Math.min(score, maxScore);
  }

  // ============================================
  // Update Offering (Enhanced per BRD)
  // ============================================
  async function updateOffering(offeringId, offeringData) {
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
    if (offering.provider_user_id !== currentUser.id) {
      return { success: false, error: 'You do not have permission to edit this service offering' };
    }
    
    // Validate updated data
    const validation = validateOfferingData(offeringData, true);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join('; ') };
    }
    
    // Track changes for audit
    const changes = {
      before: JSON.parse(JSON.stringify(offering)),
      after: {}
    };
    
    // Update fields (preserve immutable fields)
    const immutableFields = ['id', 'provider_user_id', 'providerId', 'createdAt', 'created_at'];
    const now = new Date().toISOString();
    
    Object.keys(offeringData).forEach(key => {
      if (offeringData[key] !== undefined && !immutableFields.includes(key)) {
        // Handle nested objects
        if (typeof offeringData[key] === 'object' && offeringData[key] !== null && !Array.isArray(offeringData[key])) {
          offering[key] = { ...offering[key], ...offeringData[key] };
        } else {
          offering[key] = offeringData[key];
        }
        changes.after[key] = offeringData[key];
      }
    });
    
    // Update timestamps
    offering.updatedAt = now;
    offering.updated_at = now; // Keep for backward compatibility
    
    // Update short description if description changed
    if (offeringData.description !== undefined) {
      offering.shortDescription = offering.description.substring(0, 200).trim();
    }
    
    // Recalculate quality score
    offering.qualityScore = calculateQualityScore(offering);
    
    // Handle status changes
    if (offeringData.status && offeringData.status !== offering.status) {
      if (offeringData.status === 'Active' && !offering.publishedAt) {
        offering.publishedAt = now;
      }
    }
    
    // Increment version
    if (offering.metadata) {
      offering.metadata.version = (offering.metadata.version || 1) + 1;
      offering.metadata.lastQualityCheck = now;
    }
    
    // Save to localStorage
    saveServiceProvidersData(data);
    
    // Update index
    if (typeof PMTwinData !== 'undefined' && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.updateOfferingIndex(offeringId);
    }
    
    // Log audit trail
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Audit) {
      PMTwinData.Audit.log({
        action: 'service_offering_update',
        entityType: 'service_offering',
        entityId: offering.id,
        description: `Updated service offering: ${offering.title}`,
        changes: changes,
        metadata: {
          version: offering.metadata?.version,
          qualityScore: offering.qualityScore
        }
      });
    }
    
    return { success: true, offering: offering };
  }

  // ============================================
  // Delete Offering
  // ============================================
  async function deleteOffering(offeringId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('service_offering:delete');
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
    if (offering.provider_user_id !== currentUser.id) {
      return { success: false, error: 'You do not have permission to delete this service offering' };
    }
    
    // Delete offering
    data.serviceOfferings.splice(offeringIndex, 1);
    saveServiceProvidersData(data);
    
    // Remove from index
    if (typeof PMTwinData !== 'undefined' && PMTwinData.IndexManager) {
      PMTwinData.IndexManager.removeFromIndex(offeringId, 'offering');
    }
    
    return { success: true };
  }

  // ============================================
  // Get My Offerings
  // ============================================
  async function getMyOfferings() {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    const data = await loadServiceProvidersData();
    const offerings = (data.serviceOfferings || []).filter(o => o.provider_user_id === currentUser.id);
    
    return { success: true, offerings: offerings };
  }

  // ============================================
  // Get Offerings (with filters for discovery)
  // ============================================
  async function getOfferings(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    
    // Check permission for viewing offerings
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('service_offering:view');
      if (!hasPermission && currentUser) {
        // If user is logged in but doesn't have view permission, only show their own
        const myOfferings = await getMyOfferings();
        return myOfferings;
      }
    }
    
    const data = await loadServiceProvidersData();
    let offerings = [...(data.serviceOfferings || [])];
    
    // Filter by status - only show Active for marketplace, unless user owns them
    if (!filters.includeAll) {
      offerings = offerings.filter(o => {
        if (o.status === 'Active') return true;
        if (currentUser && o.provider_user_id === currentUser.id) return true;
        return false;
      });
    }
    
    // Apply filters
    if (filters.category) {
      offerings = offerings.filter(o => o.category === filters.category);
    }
    
    if (filters.skills && filters.skills.length > 0) {
      offerings = offerings.filter(o => {
        const offeringSkills = (o.skills || []).map(s => s.toLowerCase());
        return filters.skills.some(skill => 
          offeringSkills.some(os => os.includes(skill.toLowerCase()) || skill.toLowerCase().includes(os))
        );
      });
    }
    
    if (filters.location) {
      const locationLower = filters.location.toLowerCase();
      offerings = offerings.filter(o => {
        const city = (o.location?.city || '').toLowerCase();
        const country = (o.location?.country || '').toLowerCase();
        return city.includes(locationLower) || country.includes(locationLower);
      });
    }
    
    if (filters.price_min !== undefined) {
      offerings = offerings.filter(o => o.price_max >= filters.price_min);
    }
    
    if (filters.price_max !== undefined) {
      offerings = offerings.filter(o => o.price_min <= filters.price_max);
    }
    
    if (filters.exchange_type) {
      offerings = offerings.filter(o => o.exchange_type === filters.exchange_type);
    }
    
    if (filters.delivery_mode) {
      offerings = offerings.filter(o => o.delivery_mode === filters.delivery_mode);
    }
    
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      offerings = offerings.filter(o => {
        const title = (o.title || '').toLowerCase();
        const desc = (o.description || '').toLowerCase();
        const category = (o.category || '').toLowerCase();
        return title.includes(searchLower) || desc.includes(searchLower) || category.includes(searchLower);
      });
    }
    
    if (filters.status) {
      offerings = offerings.filter(o => o.status === filters.status);
    }
    
    // Sort by updated_at (most recent first)
    offerings.sort((a, b) => new Date(b.updated_at || b.updatedAt || 0) - new Date(a.updated_at || a.updatedAt || 0));
    
    return { success: true, offerings: offerings };
  }

  // ============================================
  // Get Offering by ID
  // ============================================
  async function getOfferingById(offeringId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (!offering) {
      return { success: false, error: 'Service offering not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    
    // Check if user can view this offering
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('service_offering:view');
      if (!hasPermission) {
        // Only allow viewing own offerings
        if (!currentUser || offering.provider_user_id !== currentUser.id) {
          return { success: false, error: 'You do not have permission to view this service offering' };
        }
      }
    }
    
    return { success: true, offering: offering };
  }

  // ============================================
  // Toggle Status (Active/Paused/Archived)
  // ============================================
  async function toggleStatus(offeringId, status) {
    if (!['Active', 'Paused', 'Draft', 'Archived'].includes(status)) {
      return { success: false, error: 'Invalid status. Must be Active, Paused, Draft, or Archived' };
    }
    
    return await updateOffering(offeringId, { status: status });
  }
  
  // ============================================
  // Publish Offering (Draft -> Active)
  // ============================================
  async function publishOffering(offeringId) {
    const result = await getOfferingById(offeringId);
    if (!result.success) {
      return result;
    }
    
    const offering = result.offering;
    
    // Validate that offering is ready to publish
    if (offering.status !== 'Draft') {
      return { success: false, error: `Cannot publish offering with status: ${offering.status}` };
    }
    
    // Check quality score (optional requirement)
    if (offering.qualityScore < 50) {
      return { 
        success: false, 
        error: 'Offering quality score is too low. Please complete more fields before publishing.',
        qualityScore: offering.qualityScore
      };
    }
    
    return await updateOffering(offeringId, { 
      status: 'Active',
      publishedAt: new Date().toISOString()
    });
  }
  
  // ============================================
  // Increment View Count
  // ============================================
  async function incrementViews(offeringId) {
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (offering) {
      offering.views = (offering.views || 0) + 1;
      offering.lastViewedAt = new Date().toISOString();
      saveServiceProvidersData(data);
    }
    
    return { success: true };
  }

  // ============================================
  // Increment Inquiry Count
  // ============================================
  async function incrementInquiries(offeringId) {
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (offering) {
      offering.inquiries = (offering.inquiries || 0) + 1;
      saveServiceProvidersData(data);
    }
    
    return { success: true };
  }

  // ============================================
  // Increment Matches Generated
  // ============================================
  async function incrementMatches(offeringId) {
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (offering) {
      offering.matchesGenerated = (offering.matchesGenerated || 0) + 1;
      saveServiceProvidersData(data);
    }
    
    return { success: true };
  }

  // ============================================
  // Increment Proposals Received
  // ============================================
  async function incrementProposals(offeringId) {
    const data = await loadServiceProvidersData();
    const offering = data.serviceOfferings.find(o => o.id === offeringId);
    
    if (offering) {
      offering.proposalsReceived = (offering.proposalsReceived || 0) + 1;
      saveServiceProvidersData(data);
    }
    
    return { success: true };
  }

  // ============================================
  // Get Provider Statistics
  // ============================================
  async function getProviderStatistics(userId) {
    const data = await loadServiceProvidersData();
    const offerings = (data.serviceOfferings || []).filter(o => o.provider_user_id === userId);
    
    const statistics = {
      totalOfferings: offerings.length,
      activeOfferings: offerings.filter(o => o.status === 'Active').length,
      totalViews: offerings.reduce((sum, o) => sum + (o.views || 0), 0),
      totalInquiries: offerings.reduce((sum, o) => sum + (o.inquiries || 0), 0),
      totalMatches: offerings.reduce((sum, o) => sum + (o.matchesGenerated || 0), 0),
      totalProposals: offerings.reduce((sum, o) => sum + (o.proposalsReceived || 0), 0),
      averageRating: null,
      averageQualityScore: 0
    };
    
    // Calculate average rating
    const ratedOfferings = offerings.filter(o => o.averageRating && o.averageRating > 0);
    if (ratedOfferings.length > 0) {
      statistics.averageRating = ratedOfferings.reduce((sum, o) => sum + o.averageRating, 0) / ratedOfferings.length;
    }
    
    // Calculate average quality score
    const scoredOfferings = offerings.filter(o => o.qualityScore && o.qualityScore > 0);
    if (scoredOfferings.length > 0) {
      statistics.averageQualityScore = scoredOfferings.reduce((sum, o) => sum + o.qualityScore, 0) / scoredOfferings.length;
    }
    
    return { success: true, statistics: statistics };
  }
  
  // ============================================
  // Get Offerings by Collaboration Model
  // ============================================
  async function getOfferingsByCollaborationModel(modelId) {
    const result = await getOfferings({ includeAll: false });
    if (!result.success) {
      return result;
    }
    
    // Filter offerings that support the specified collaboration model
    const filtered = result.offerings.filter(offering => {
      return offering.supportedCollaborationModels && 
             offering.supportedCollaborationModels.includes(modelId);
    });
    
    return { success: true, offerings: filtered };
  }
  
  // ============================================
  // Get Provider Statistics
  // ============================================
  async function getProviderStatistics(userId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Verify user can view these statistics
    if (userId !== currentUser.id) {
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('view_service_providers');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to view provider statistics' };
        }
      }
    }
    
    const result = await getMyOfferings();
    if (!result.success) {
      return result;
    }
    
    const offerings = result.offerings;
    const stats = {
      totalOfferings: offerings.length,
      activeOfferings: offerings.filter(o => o.status === 'Active').length,
      pausedOfferings: offerings.filter(o => o.status === 'Paused').length,
      draftOfferings: offerings.filter(o => o.status === 'Draft').length,
      totalViews: offerings.reduce((sum, o) => sum + (o.views || 0), 0),
      totalInquiries: offerings.reduce((sum, o) => sum + (o.inquiries || 0), 0),
      totalMatches: offerings.reduce((sum, o) => sum + (o.matchesGenerated || 0), 0),
      totalProposals: offerings.reduce((sum, o) => sum + (o.proposalsReceived || 0), 0),
      completedEngagements: offerings.reduce((sum, o) => sum + (o.completedEngagements || 0), 0),
      averageQualityScore: offerings.length > 0 
        ? offerings.reduce((sum, o) => sum + (o.qualityScore || 0), 0) / offerings.length 
        : 0,
      averageRating: offerings.length > 0
        ? offerings.reduce((sum, o) => sum + (o.averageRating || 0), 0) / offerings.length
        : null
    };
    
    return { success: true, statistics: stats };
  }

  // ============================================
  // Public API
  // ============================================
  window.ServiceOfferingService = {
    createOffering,
    updateOffering,
    deleteOffering,
    getMyOfferings,
    getOfferings,
    getOfferingById,
    toggleStatus,
    publishOffering,
    incrementViews,
    incrementInquiries,
    incrementMatches,
    incrementProposals,
    getOfferingsByCollaborationModel,
    getProviderStatistics,
    validateOfferingData,
    calculateQualityScore
  };

})();

