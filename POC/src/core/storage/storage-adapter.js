/**
 * Unified Storage Adapter
 * Single source of truth for all localStorage operations
 * Only supports: opportunities, proposals, contracts, users
 */

(function() {
  'use strict';

  // ============================================
  // Unified Storage Keys (ONLY these allowed)
  // ============================================
  const UNIFIED_STORAGE_KEYS = {
    OPPORTUNITIES: 'pmtwin_opportunities',
    PROPOSALS: 'pmtwin_proposals',
    CONTRACTS: 'pmtwin_contracts',
    USERS: 'pmtwin_users',
    SESSIONS: 'pmtwin_sessions',
    AUDIT: 'pmtwin_audit',
    NOTIFICATIONS: 'pmtwin_notifications',
    COLLABORATION_APPLICATIONS: 'pmtwin_collaboration_applications',
    SYSTEM_SETTINGS: 'pmtwin_system_settings',
    ENGAGEMENTS: 'pmtwin_engagements',
    MILESTONES: 'pmtwin_milestones',
    VERSION: 'pmtwin_data_version'
  };

  // ============================================
  // Legacy Keys to Remove (ALL legacy workflow keys)
  // ============================================
  const LEGACY_KEYS_TO_REMOVE = [
    'pmtwin_projects',
    'pmtwin_tasks',
    'pmtwin_requests',
    'pmtwin_service_requests',
    'pmtwin_offers',
    'pmtwin_service_offers',
    'pmtwin_matches',
    'pmtwin_matches_old',
    'pmtwin_pipeline',
    'pmtwin_pipeline_old'
  ];

  // ============================================
  // Storage Operations
  // ============================================
  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error(`Error reading ${key}:`, e);
      return [];
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.error(`Error writing ${key}:`, e);
      return false;
    }
  }

  function remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      console.error(`Error removing ${key}:`, e);
      return false;
    }
  }

  // ============================================
  // Migration: Convert Legacy Data to Opportunities
  // ============================================
  function migrateLegacyDataToOpportunities() {
    console.log('🔄 Migrating legacy data to unified Opportunities model...');
    
    let migratedCount = 0;
    
    // Migrate Projects
    const legacyProjects = localStorage.getItem('pmtwin_projects');
    if (legacyProjects) {
      try {
        const projects = JSON.parse(legacyProjects);
        const opportunities = get(UNIFIED_STORAGE_KEYS.OPPORTUNITIES);
        
        projects.forEach(project => {
          // Check if already migrated
          if (!opportunities.find(o => o.id === project.id)) {
            const opportunity = {
              id: project.id,
              title: project.title || project.name || '',
              description: project.description || '',
              intent: 'REQUEST_SERVICE',
              model: project.projectType === 'mega' ? '1' : '1',
              subModel: project.projectType === 'mega' ? '1.4' : '1.1',
              modelName: project.projectType === 'mega' ? 'Special Purpose Vehicle (SPV)' : 'Task-Based Engagement',
              category: project.category || 'Project-Based Collaboration',
              status: project.status === 'active' ? 'published' : (project.status || 'draft'),
              skills: project.scope?.skillRequirements || project.scope?.requiredServices || [],
              serviceItems: [],
              paymentTerms: {
                mode: 'CASH',
                barterRule: null,
                cashSettlement: 0,
                acknowledgedDifference: false
              },
              location: project.location || {
                country: 'Saudi Arabia',
                city: project.location?.city || '',
                area: project.location?.area || null,
                address: project.location?.address || null,
                geo: project.location?.geo || null,
                isRemoteAllowed: false
              },
              createdBy: project.ownerCompanyId || project.creatorId,
              createdAt: project.createdAt || new Date().toISOString(),
              updatedAt: project.updatedAt || new Date().toISOString(),
              attributes: project.scope || {}
            };
            opportunities.push(opportunity);
            migratedCount++;
          }
        });
        
        set(UNIFIED_STORAGE_KEYS.OPPORTUNITIES, opportunities);
      } catch (e) {
        console.error('Error migrating projects:', e);
      }
    }
    
    // Migrate ServiceRequests
    const legacyRequests = localStorage.getItem('pmtwin_service_requests');
    if (legacyRequests) {
      try {
        const requests = JSON.parse(legacyRequests);
        const opportunities = get(UNIFIED_STORAGE_KEYS.OPPORTUNITIES);
        
        requests.forEach(request => {
          if (!opportunities.find(o => o.id === request.id)) {
            const opportunity = {
              id: request.id,
              title: request.title || '',
              description: request.description || '',
              intent: 'REQUEST_SERVICE',
              model: '1',
              subModel: '1.1',
              modelName: 'Task-Based Engagement',
              category: 'Project-Based Collaboration',
              status: request.status === 'OPEN' ? 'published' : 'draft',
              skills: request.requiredSkills || [],
              serviceItems: [],
              paymentTerms: {
                mode: request.exchangeType === 'Barter' ? 'BARTER' : 
                      request.exchangeType === 'Mixed' ? 'HYBRID' : 'CASH',
                barterRule: request.exchangeType === 'Barter' || request.exchangeType === 'Mixed'
                  ? 'ALLOW_DIFFERENCE_CASH' : null,
                cashSettlement: request.cashComponent || 0,
                acknowledgedDifference: false
              },
              location: request.location || {
                country: 'Saudi Arabia',
                city: '',
                area: null,
                address: null,
                geo: null,
                isRemoteAllowed: request.deliveryMode === 'Remote' || request.deliveryMode === 'Hybrid'
              },
              createdBy: request.ownerCompanyId || request.requesterId,
              createdAt: request.createdAt || new Date().toISOString(),
              updatedAt: request.updatedAt || new Date().toISOString(),
              attributes: {
                requestType: request.requestType || 'NORMAL'
              }
            };
            opportunities.push(opportunity);
            migratedCount++;
          }
        });
        
        set(UNIFIED_STORAGE_KEYS.OPPORTUNITIES, opportunities);
      } catch (e) {
        console.error('Error migrating service requests:', e);
      }
    }
    
    // Migrate ServiceOffers
    const legacyOffers = localStorage.getItem('pmtwin_service_offers');
    if (legacyOffers) {
      try {
        const offers = JSON.parse(legacyOffers);
        const opportunities = get(UNIFIED_STORAGE_KEYS.OPPORTUNITIES);
        
        offers.forEach(offer => {
          if (!offer.serviceRequestId && !opportunities.find(o => o.id === offer.id)) {
            const opportunity = {
              id: offer.id,
              title: offer.title || '',
              description: offer.description || '',
              intent: 'OFFER_SERVICE',
              model: '1',
              subModel: '1.1',
              modelName: 'Task-Based Engagement',
              category: 'Project-Based Collaboration',
              status: offer.status === 'Active' ? 'published' : 'draft',
              skills: offer.skills || [],
              serviceItems: [],
              paymentTerms: {
                mode: offer.exchange_type === 'Barter' ? 'BARTER' :
                      offer.exchange_type === 'Mixed' ? 'HYBRID' : 'CASH',
                barterRule: offer.exchange_type === 'Barter' || offer.exchange_type === 'Mixed'
                  ? 'ALLOW_DIFFERENCE_CASH' : null,
                cashSettlement: 0,
                acknowledgedDifference: false
              },
              location: offer.location || {
                country: 'Saudi Arabia',
                city: '',
                area: null,
                address: null,
                geo: null,
                isRemoteAllowed: offer.delivery_mode === 'Remote' || offer.delivery_mode === 'Hybrid'
              },
              createdBy: offer.providerId,
              createdAt: offer.createdAt || new Date().toISOString(),
              updatedAt: offer.updatedAt || new Date().toISOString(),
              attributes: {}
            };
            opportunities.push(opportunity);
            migratedCount++;
          }
        });
        
        set(UNIFIED_STORAGE_KEYS.OPPORTUNITIES, opportunities);
      } catch (e) {
        console.error('Error migrating service offers:', e);
      }
    }
    
    console.log(`✅ Migrated ${migratedCount} legacy items to Opportunities`);
    return migratedCount;
  }

  // ============================================
  // Cleanup: Remove All Legacy Keys
  // ============================================
  function removeLegacyKeys() {
    console.log('🧹 Removing legacy storage keys...');
    let removedCount = 0;
    const detectedKeys = [];
    
    // Check all localStorage keys for legacy patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pmtwin_')) {
        // Check if it's a legacy key
        const isLegacy = LEGACY_KEYS_TO_REMOVE.includes(key) ||
                        key.includes('_projects') ||
                        key.includes('_tasks') ||
                        key.includes('_requests') ||
                        key.includes('_offers') ||
                        key.includes('_matches') ||
                        key.includes('_pipeline');
        
        if (isLegacy && !Object.values(UNIFIED_STORAGE_KEYS).includes(key)) {
          detectedKeys.push(key);
        }
      }
    }
    
    // Remove all detected legacy keys
    [...LEGACY_KEYS_TO_REMOVE, ...detectedKeys].forEach(key => {
      if (localStorage.getItem(key)) {
        remove(key);
        removedCount++;
        console.warn(`  ⚠️ Removed legacy key: ${key}`);
      }
    });
    
    if (removedCount > 0) {
      console.warn(`⚠️ Removed ${removedCount} legacy storage keys. All workflows now use Opportunity model only.`);
    } else {
      console.log(`✅ No legacy storage keys found`);
    }
    return removedCount;
  }

  // ============================================
  // Migration and Cleanup (Run Once at Boot)
  // ============================================
  function migrateAndCleanup() {
    const version = localStorage.getItem(UNIFIED_STORAGE_KEYS.VERSION) || '0.0.0';

    // Only migrate if version is less than 3.0.0
    if (compareVersions(version, '3.0.0') < 0) {
      console.log('🔄 Running unified storage migration...');

      // Step 1: Migrate legacy data to opportunities
      migrateLegacyDataToOpportunities();

      // Step 2: Remove legacy keys
      removeLegacyKeys();

      // Step 3: Update version
      set(UNIFIED_STORAGE_KEYS.VERSION, '3.0.0');

      console.log('✅ Storage migration completed');
    } else {
      // Still check for and remove legacy keys (in case they were added back)
      removeLegacyKeys();
    }
  }

  // ============================================
  // Migrate and Cleanup Legacy Workflow Data
  // Explicitly removes ALL legacy workflow keys
  // ============================================
  function migrateAndCleanupLegacyWorkflowData() {
    console.log('🧹 Cleaning up legacy workflow test data...');
    
    // Remove all legacy workflow keys explicitly
    const legacyWorkflowKeys = [
      'pmtwin_projects',
      'pmtwin_tasks',
      'pmtwin_requests',
      'pmtwin_service_requests',
      'pmtwin_offers',
      'pmtwin_service_offers',
      'pmtwin_matches',
      'pmtwin_matches_old',
      'pmtwin_pipeline',
      'pmtwin_pipeline_old'
    ];
    
    let removedCount = 0;
    legacyWorkflowKeys.forEach(key => {
      if (localStorage.getItem(key)) {
        remove(key);
        removedCount++;
        console.warn(`  ⚠️ Removed legacy workflow key: ${key}`);
      }
    });
    
    // Also scan for any other legacy patterns
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pmtwin_')) {
        const isLegacyWorkflow = key.includes('_projects') ||
                                key.includes('_tasks') ||
                                key.includes('_requests') ||
                                key.includes('_offers') ||
                                key.includes('_matches') ||
                                key.includes('_pipeline');
        
        if (isLegacyWorkflow && !Object.values(UNIFIED_STORAGE_KEYS).includes(key)) {
          remove(key);
          removedCount++;
          console.warn(`  ⚠️ Removed legacy workflow key: ${key}`);
        }
      }
    }
    
    if (removedCount > 0) {
      console.warn(`⚠️ Removed ${removedCount} legacy workflow storage keys`);
    } else {
      console.log(`✅ No legacy workflow keys found`);
    }
    
    return removedCount;
  }

  // ============================================
  // Clear All (for testing)
  // ============================================
  function clearAll() {
    console.log('🗑️ Clearing all unified storage keys...');
    Object.values(UNIFIED_STORAGE_KEYS).forEach(key => {
      if (key !== UNIFIED_STORAGE_KEYS.VERSION) {
        remove(key);
      }
    });
    console.log('✅ All storage cleared');
  }

  // ============================================
  // Helper: Compare Versions
  // ============================================
  function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      if (part1 < part2) return -1;
      if (part1 > part2) return 1;
    }
    return 0;
  }

  // ============================================
  // Public API
  // ============================================
  window.UnifiedStorage = {
    KEYS: UNIFIED_STORAGE_KEYS,
    get,
    set,
    remove,
    migrateAndCleanup,
    migrateAndCleanupLegacyWorkflowData,
    clearAll,
    removeLegacyKeys
  };

  // Also export as StorageAdapter for backward compatibility
  window.StorageAdapter = window.UnifiedStorage;

  // Auto-run migration on load
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', migrateAndCleanup);
    } else {
      migrateAndCleanup();
    }
  }

})();
