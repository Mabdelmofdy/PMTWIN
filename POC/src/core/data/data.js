/**
 * PMTwin Data Management Layer
 * Handles all localStorage CRUD operations
 */

(function() {
  'use strict';

  // Flag to skip audit logs during initialization
  let skipAuditLogs = false;
  
  // Function to enable/disable audit logging
  function setSkipAuditLogs(value) {
    skipAuditLogs = value;
  }

  // Storage keys
  const STORAGE_KEYS = {
    USERS: 'pmtwin_users',
    SESSIONS: 'pmtwin_sessions',
    PROJECTS: 'pmtwin_projects',
    PROPOSALS: 'pmtwin_proposals',
    MATCHES: 'pmtwin_matches',
    AUDIT: 'pmtwin_audit',
    NOTIFICATIONS: 'pmtwin_notifications',
    COLLABORATION_OPPORTUNITIES: 'pmtwin_collaboration_opportunities',
    COLLABORATION_APPLICATIONS: 'pmtwin_collaboration_applications',
    SYSTEM_SETTINGS: 'pmtwin_system_settings',
    SERVICE_PROVIDERS_INDEX: 'pmtwin_service_providers_index',
    BENEFICIARIES_INDEX: 'pmtwin_beneficiaries_index',
    SERVICE_EVALUATIONS: 'pmtwin_service_evaluations',
    SERVICE_OFFERINGS_INDEX: 'pmtwin_service_offerings_index',
    VENDOR_SUBCONTRACTOR_RELATIONSHIPS: 'pmtwin_vendor_subcontractor_relationships',
    SERVICE_PROVIDER_PROFILES: 'pmtwin_service_provider_profiles',
    SERVICE_REQUESTS: 'pmtwin_service_requests',
    SERVICE_OFFERS: 'pmtwin_service_offers',
    SERVICE_ENGAGEMENTS: 'pmtwin_service_engagements',
    CONTRACTS: 'pmtwin_contracts',
    ENGAGEMENTS: 'pmtwin_engagements',
    MILESTONES: 'pmtwin_milestones',
    VERSION: 'pmtwin_data_version'
  };

  const DATA_VERSION = '2.4.0'; // Updated for Contract-Driven Workflow implementation

  // ============================================
  // User Type & Role Mapping
  // ============================================
  // User Type Constants
  const USER_TYPE = {
    BENEFICIARY: 'beneficiary',
    VENDOR_CORPORATE: 'vendor_corporate',
    VENDOR_INDIVIDUAL: 'vendor_individual',
    SERVICE_PROVIDER: 'service_provider',
    CONSULTANT: 'consultant',
    SUB_CONTRACTOR: 'sub_contractor',
    ADMIN: 'admin'
  };

  function mapRoleToUserType(role, explicitUserType = null) {
    // If explicit userType is provided, use it (allows for individual type)
    if (explicitUserType && ['company', 'consultant', 'individual', 'admin', 'beneficiary', 'vendor_corporate', 'vendor_individual', 'service_provider', 'sub_contractor'].includes(explicitUserType)) {
      return explicitUserType;
    }
    
    // Map roles to new user types
    const mapping = {
      'platform_admin': USER_TYPE.ADMIN,
      'admin': USER_TYPE.ADMIN, // Legacy
      'project_lead': USER_TYPE.BENEFICIARY,
      'entity': USER_TYPE.BENEFICIARY,
      'beneficiary': USER_TYPE.BENEFICIARY,
      'vendor': USER_TYPE.VENDOR_CORPORATE, // Default to corporate, can be overridden
      'supplier': USER_TYPE.VENDOR_CORPORATE,
      'service_provider': USER_TYPE.VENDOR_CORPORATE, // Legacy - mapped to vendor
      'skill_service_provider': USER_TYPE.SERVICE_PROVIDER,
      'sub_contractor': USER_TYPE.SUB_CONTRACTOR,
      'professional': USER_TYPE.SUB_CONTRACTOR, // Legacy
      'consultant': USER_TYPE.CONSULTANT,
      'mentor': USER_TYPE.CONSULTANT,
      'individual': USER_TYPE.CONSULTANT, // Legacy
      'auditor': USER_TYPE.ADMIN
    };
    return mapping[role] || USER_TYPE.CONSULTANT;
  }

  function getUserTypeFromRole(role) {
    return mapRoleToUserType(role);
  }

  function getInitialOnboardingStage(userType) {
    const stages = {
      'admin': 'approved',
      'company': 'registered',
      'consultant': 'registered',
      'individual': 'registered'
    };
    return stages[userType] || 'registered';
  }

  // Initialize data structure if not exists
  function initStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.VERSION)) {
      localStorage.setItem(STORAGE_KEYS.VERSION, DATA_VERSION);
    }

    // Initialize empty arrays if they don't exist
    const keys = Object.values(STORAGE_KEYS).filter(k => k !== STORAGE_KEYS.VERSION);
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });

    // Auto-create test accounts if none exist (first time setup)
    autoCreateTestAccounts();
    
    // Migrate existing users to new data model
    migrateUsersToOnboardingModel();
    
    // Load sample notifications if none exist
    loadSampleNotifications();
    
    // Load golden seed data (replaces old sample data loaders)
    // Golden seed script should be loaded before data.js in templates
    if (typeof GoldenSeedData !== 'undefined') {
      GoldenSeedData.load();
    } else {
      // Fallback: Load script dynamically if not in template
      const script = document.createElement('script');
      script.src = getDataBasePath() + 'src/core/data/golden-seed-data.js';
      script.onload = function() {
        if (typeof GoldenSeedData !== 'undefined') {
          GoldenSeedData.load();
        }
      };
      document.head.appendChild(script);
    }
    
    // Load sample collaboration opportunities if none exist (keep for now)
    loadSampleCollaborationOpportunities();
    
    // Load sample collaboration applications if none exist (after opportunities are loaded)
    setTimeout(() => {
      loadSampleCollaborationApplications();
    }, 100);
    
    // Initialize service index (migration still needed)
    migrateServiceIndex();
    
    // Migrate Service Provider model
    migrateServiceProviderModel();
    migrateToContractDrivenWorkflow();
    
    // Migrate creatorId to ownerCompanyId
    migrateCreatorIdToOwnerCompanyId();
    
    // Migrate proposals to new model
    migrateProposalsToNewModel();
    
    // Ensure golden seed projects are public
    migrateGoldenSeedProjectsVisibility();
    
    // Run workflow validation (after data is loaded)
    setTimeout(() => {
      if (typeof WorkflowValidator !== 'undefined') {
        WorkflowValidator.validate();
      }
    }, 3000);
  }

  // ============================================
  // Migration: Add ownerCompanyId to Opportunities
  // ============================================
  function migrateCreatorIdToOwnerCompanyId() {
    try {
      let projectsUpdated = 0;
      let serviceRequestsUpdated = 0;
      
      // Migrate Projects and MegaProjects
      const projects = Projects.getAll();
      projects.forEach(project => {
        if (!project.ownerCompanyId && project.creatorId) {
          // Users represent companies, so ownerCompanyId = creatorId
          project.ownerCompanyId = project.creatorId;
          Projects.update(project.id, { ownerCompanyId: project.ownerCompanyId });
          projectsUpdated++;
        }
      });
      
      // Migrate ServiceRequests
      const serviceRequests = ServiceRequests.getAll();
      serviceRequests.forEach(request => {
        if (!request.ownerCompanyId && request.requesterId) {
          // requesterId is the company owner
          request.ownerCompanyId = request.requesterId;
          ServiceRequests.update(request.id, { ownerCompanyId: request.ownerCompanyId });
          serviceRequestsUpdated++;
        }
      });
      
      if (projectsUpdated > 0 || serviceRequestsUpdated > 0) {
        console.log(`✅ Migrated ownerCompanyId: ${projectsUpdated} projects, ${serviceRequestsUpdated} service requests`);
      }
    } catch (error) {
      console.error('Error migrating ownerCompanyId:', error);
    }
  }

  // ============================================
  // Migration: Update Proposals to New Model
  // ============================================
  function migrateProposalsToNewModel() {
    try {
      let proposalsUpdated = 0;
      const proposals = Proposals.getAll();
      
      // Status mapping from old to new enum
      const statusMapping = {
        'in_review': 'UNDER_REVIEW',
        'evaluation': 'UNDER_REVIEW',
        'approved': 'AWARDED',
        'rejected': 'REJECTED',
        'completed': 'COMPLETED',
        'draft': 'DRAFT',
        'submitted': 'SUBMITTED',
        'shortlisted': 'SHORTLISTED',
        'negotiation': 'NEGOTIATION',
        'withdrawn': 'WITHDRAWN'
      };
      
      proposals.forEach(proposal => {
        let needsUpdate = false;
        const updates = {};
        
        // Migrate status to new enum
        if (proposal.status && statusMapping[proposal.status.toLowerCase()]) {
          const newStatus = statusMapping[proposal.status.toLowerCase()];
          if (proposal.status !== newStatus) {
            updates.status = newStatus;
            needsUpdate = true;
          }
        } else if (proposal.status && !['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'SHORTLISTED', 'NEGOTIATION', 'AWARDED', 'REJECTED', 'WITHDRAWN'].includes(proposal.status)) {
          // Default to SUBMITTED if unknown status
          updates.status = 'SUBMITTED';
          needsUpdate = true;
        }
        
        // Add proposalType if missing
        if (!proposal.proposalType) {
          if (proposal.projectId) {
            const project = Projects.getById(proposal.projectId);
            if (project && project.projectType === 'mega') {
              updates.proposalType = 'PROJECT_BID';
            } else {
              updates.proposalType = 'PROJECT_BID';
            }
          } else if (proposal.serviceRequestId || proposal.serviceOfferingId) {
            updates.proposalType = 'SERVICE_OFFER';
          } else {
            updates.proposalType = 'PROJECT_BID'; // Default
          }
          needsUpdate = true;
        }
        
        // Add targetType and targetId if missing
        if (!proposal.targetType || !proposal.targetId) {
          if (proposal.projectId) {
            const project = Projects.getById(proposal.projectId);
            updates.targetType = project && project.projectType === 'mega' ? 'MEGA_PROJECT' : 'PROJECT';
            updates.targetId = proposal.projectId;
          } else if (proposal.serviceRequestId) {
            updates.targetType = 'SERVICE_REQUEST';
            updates.targetId = proposal.serviceRequestId;
          }
          needsUpdate = true;
        }
        
        // Add bidderCompanyId if missing
        if (!proposal.bidderCompanyId && proposal.providerId) {
          updates.bidderCompanyId = proposal.providerId;
          needsUpdate = true;
        }
        
        // Add ownerCompanyId if missing
        if (!proposal.ownerCompanyId) {
          if (proposal.targetId && proposal.targetType) {
            if (proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
              const project = Projects.getById(proposal.targetId);
              updates.ownerCompanyId = project?.ownerCompanyId || project?.creatorId;
            } else if (proposal.targetType === 'SERVICE_REQUEST') {
              const serviceRequest = ServiceRequests.getById(proposal.targetId);
              updates.ownerCompanyId = serviceRequest?.ownerCompanyId || serviceRequest?.requesterId;
            }
          } else if (proposal.projectId) {
            const project = Projects.getById(proposal.projectId);
            updates.ownerCompanyId = project?.ownerCompanyId || project?.creatorId;
          }
          if (updates.ownerCompanyId) {
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          Proposals.update(proposal.id, updates);
          proposalsUpdated++;
        }
      });
      
      if (proposalsUpdated > 0) {
        console.log(`✅ Migrated ${proposalsUpdated} proposals to new model`);
      }
    } catch (error) {
      console.error('Error migrating proposals:', error);
    }
  }

  // ============================================
  // Migration: Ensure golden seed projects are public
  // ============================================
  function migrateGoldenSeedProjectsVisibility() {
    try {
      const projects = PMTwinData.Projects.getAll();
      const goldenProjectIds = ['megaproject_neom_001', 'project_residential_001'];
      let updated = 0;
      
      projects.forEach(project => {
        if (goldenProjectIds.includes(project.id) && project.visibility !== 'public') {
          project.visibility = 'public';
          PMTwinData.Projects.update(project.id, project);
          updated++;
        }
      });
      
      if (updated > 0) {
        console.log(`✅ Updated ${updated} golden seed project(s) to be public`);
      }
    } catch (error) {
      console.error('Error migrating golden seed projects visibility:', error);
    }
  }

  // ============================================
  // Migration: Add onboarding fields to existing users
  // ============================================
  function migrateUsersToOnboardingModel() {
    const users = Users.getAll();
    let migrated = 0;

    users.forEach(user => {
      const needsMigration = !user.userType || !user.onboardingStage || user.emailVerified === undefined ||
        !user.identity || !user.profileSections || !user.documents || !user.review;
      
      if (needsMigration) {
        const userType = user.userType || mapRoleToUserType(user.role);
        // Map old stages to new stages
        let onboardingStage = user.onboardingStage;
        if (!onboardingStage) {
          if (user.profile?.status === 'approved') {
            onboardingStage = 'approved';
          } else if (user.profile?.status === 'pending') {
            onboardingStage = 'under_review';
          } else {
            onboardingStage = getInitialOnboardingStage(userType);
          }
        }
        // Map legacy stages to new stages
        if (onboardingStage === 'account_created') onboardingStage = 'registered';
        if (onboardingStage === 'email_verified') onboardingStage = 'profile_in_progress';
        if (onboardingStage === 'profile_submitted' || onboardingStage === 'documents_submitted') onboardingStage = 'under_review';
        if (onboardingStage === 'pending_verification') onboardingStage = 'under_review';
        
        const emailVerified = user.emailVerified !== undefined ? user.emailVerified : (user.profile?.status === 'approved' ? true : false);
        
        const updates = {
          userType: userType,
          onboardingStage: onboardingStage,
          emailVerified: emailVerified,
          mobileVerified: user.mobileVerified !== undefined ? user.mobileVerified : false,
          mobile: user.mobile || null,
          emailOTP: null,
          mobileOTP: null,
          otpCode: null, // Legacy field
          otpExpiresAt: null,
          verificationRejectionReason: user.verificationRejectionReason || null,
          deviceFingerprint: user.deviceFingerprint || null,
          // Initialize new structures if missing
          identity: user.identity || {},
          profileSections: user.profileSections || {},
          documents: user.documents || (user.profile?.credentials ? user.profile.credentials.map(c => ({
            id: generateId('doc'),
            type: c.type,
            fileName: c.fileName,
            fileSize: c.fileSize,
            fileType: c.fileType || 'application/pdf',
            base64Data: c.base64Data || null,
            uploadedAt: c.uploadedAt || new Date().toISOString(),
            verified: c.verified || false
          })) : []),
          review: user.review || {
            submittedAt: user.profile?.submittedAt || null,
            reviewedAt: user.profile?.reviewedAt || (user.profile?.approvedAt || null),
            reviewedBy: user.profile?.reviewedBy || user.profile?.approvedBy || null,
            status: onboardingStage === 'under_review' ? 'pending' : (onboardingStage === 'approved' ? 'approved' : 'pending'),
            rejectionReason: user.profile?.rejectionReason || user.verificationRejectionReason || null,
            reviewNotes: null
          }
        };

        // Calculate initial onboarding progress and profile completion
        if (!user.onboardingProgress) {
          updates.onboardingProgress = calculateOnboardingProgress(userType, onboardingStage, { ...user, ...updates });
        }
        if (!user.profileCompletionScore) {
          const scoreData = calculateProfileCompletionScore({ ...user, ...updates });
          updates.profileCompletionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
        }

        Users.update(user.id, updates);
        migrated++;
      }
    });

    if (migrated > 0) {
      console.log(`✅ Migrated ${migrated} user(s) to enhanced onboarding model`);
    }
  }

  // ============================================
  // Load Test Data for Service Index Models
  // ============================================
  function loadServiceIndexTestData() {
    // Only load if no data exists
    const existingProviders = ServiceProviders.getAll();
    const existingBeneficiaries = Beneficiaries.getAll();
    const existingEvaluations = ServiceEvaluations.getAll();
    
    if (existingProviders.length > 0 && existingBeneficiaries.length > 0) {
      // Data already exists, just rebuild index
      IndexManager.rebuildIndex();
      return;
    }

    // Get demo users
    const users = Users.getAll();
    const demoUsers = users.filter(u => u.email && u.email.includes('@pmtwin.com'));
    
    if (demoUsers.length === 0) {
      console.warn('No demo users found for test data');
      return;
    }

    let createdProviders = 0;
    let createdBeneficiaries = 0;
    let createdEvaluations = 0;

    // Create test service providers
    const testProviders = [
      {
        userId: demoUsers.find(u => u.role === 'service_provider' || u.role === 'consultant')?.id || demoUsers[0].id,
        providerType: 'company',
        name: 'Legal & Logistics Services',
        companyName: 'Legal & Logistics Services',
        description: 'Comprehensive B2B services specializing in legal consultation and logistics management for construction projects in the MENA region.',
        categories: ['legal', 'logistics'],
        skills: ['Contract Review', 'Legal Consultation', 'Supply Chain Management', 'Procurement'],
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        serviceAreas: ['Riyadh', 'Jeddah', 'Dammam', 'Dubai'],
        availability: 'available',
        responseTime: '24 hours',
        profileScore: 85,
        certifications: ['ISO 9001', 'Legal Practice License'],
        establishedYear: 2015,
        contact: { email: 'service@pmtwin.com', phone: '+966 11 123 4567' },
        status: 'active'
      },
      {
        userId: demoUsers.find(u => u.role === 'consultant')?.id || demoUsers[1]?.id || demoUsers[0].id,
        providerType: 'consultant',
        name: 'Ahmed Al-Saud',
        companyName: null,
        description: 'Senior Civil Engineer with 10+ years of experience in mega-projects and infrastructure development.',
        categories: ['engineering', 'design'],
        skills: ['Project Management', 'Civil Engineering', 'Construction Planning', 'Quality Control'],
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        serviceAreas: ['Riyadh', 'NEOM', 'Qiddiya'],
        availability: 'available',
        responseTime: '48 hours',
        profileScore: 92,
        certifications: ['PMP Certification', 'Saudi Council of Engineers'],
        establishedYear: null,
        contact: { email: 'ahmed@pmtwin.com', phone: '+966 50 123 4567' },
        status: 'active'
      }
    ];

    testProviders.forEach(providerData => {
      const provider = ServiceProviders.create(providerData);
      if (provider) createdProviders++;
    });

    // Create test beneficiaries (project leads/entities)
    const projectLeads = demoUsers.filter(u => ['project_lead', 'entity', 'company'].includes(u.role) || u.userType === 'company');
    const projects = Projects.getAll();
    
    projectLeads.forEach(user => {
      const userProjects = projects.filter(p => p.creatorId === user.id);
      if (userProjects.length > 0) {
        const beneficiary = Beneficiaries.create({
          userId: user.id,
          name: user.profile?.name || user.email,
          companyName: user.profile?.companyName || null,
          location: user.profile?.location || { city: 'Riyadh', country: 'Saudi Arabia' },
          requiredServices: ['legal', 'engineering', 'logistics'],
          requiredSkills: ['Project Management', 'Contract Review', 'Engineering'],
          budgetRange: { min: 100000, max: 5000000, currency: 'SAR' },
          projectIds: userProjects.map(p => p.id),
          preferences: {
            deliveryMode: ['On-site', 'Hybrid'],
            paymentTerms: ['30_days', 'milestone_based'],
            exchangeType: ['Cash', 'Mixed']
          },
          status: 'active'
        });
        if (beneficiary) createdBeneficiaries++;
      }
    });

    // Create test evaluations (if we have offerings and beneficiaries)
    const offerings = [];
    try {
      const storedData = localStorage.getItem('pmtwin_service_providers');
      if (storedData) {
        const data = JSON.parse(storedData);
        offerings.push(...(data.serviceOfferings || []));
      }
    } catch (e) {
      console.warn('Error loading offerings for test evaluations:', e);
    }

    if (offerings.length > 0) {
      const beneficiaries = Beneficiaries.getAll();
      if (beneficiaries.length > 0) {
        const firstBeneficiary = beneficiaries[0];
        const firstOffering = offerings[0];
        
        if (firstOffering && firstBeneficiary) {
          const evaluation = ServiceEvaluations.create({
            serviceOfferingId: firstOffering.id,
            providerId: firstOffering.provider_user_id,
            beneficiaryId: firstBeneficiary.userId,
            projectId: firstBeneficiary.projectIds?.[0] || null,
            rating: 4.5,
            review: 'Excellent service! Very professional and delivered on time. Highly recommended.',
            performanceMetrics: {
              onTimeDelivery: true,
              qualityScore: 4.5,
              communicationScore: 4.0,
              valueScore: 4.5
            }
          });
          if (evaluation) createdEvaluations++;
        }
      }
    }

    // Rebuild index
    IndexManager.rebuildIndex();

    if (createdProviders > 0 || createdBeneficiaries > 0 || createdEvaluations > 0) {
      console.log(`✅ Created test data: ${createdProviders} providers, ${createdBeneficiaries} beneficiaries, ${createdEvaluations} evaluations`);
    }
    
    // Add test statistics to service offerings
    addTestStatisticsToOfferings();
  }

  // ============================================
  // Migration: Service Index
  // ============================================
  function migrateServiceIndex() {
    // Check if migration is needed
    const existingProviders = ServiceProviders.getAll();
    const existingBeneficiaries = Beneficiaries.getAll();
    
    // If we already have data, skip migration
    if (existingProviders.length > 0 || existingBeneficiaries.length > 0) {
      // Rebuild index to ensure it's up to date
      IndexManager.rebuildIndex();
      return;
    }

    // Migrate service providers from service-providers.json structure
    try {
      const storedData = localStorage.getItem('pmtwin_service_providers');
      if (storedData) {
        const data = JSON.parse(storedData);
        let migratedProviders = 0;
        let migratedBeneficiaries = 0;

        // Migrate service providers
        (data.serviceProviders || []).forEach(sp => {
          const provider = ServiceProviders.create({
            id: sp.id,
            userId: sp.userId,
            providerType: sp.providerType || 'company', // Default to company for existing providers
            name: sp.companyName || sp.name || '',
            companyName: sp.companyName || null,
            description: sp.description || '',
            categories: sp.categories || [],
            skills: [], // Will be populated from offerings
            location: sp.location || {},
            serviceAreas: sp.serviceAreas || [],
            availability: sp.availability || 'available',
            responseTime: sp.responseTime || null,
            profileScore: sp.profileScore || 0,
            certifications: sp.certifications || [],
            establishedYear: sp.establishedYear || null,
            contact: sp.contact || {},
            status: 'active',
            createdAt: sp.createdAt || new Date().toISOString()
          });
          if (provider) migratedProviders++;
        });

        // Migrate users to beneficiaries (project leads and entities needing services)
        const users = Users.getAll();
        users.forEach(user => {
          const userType = user.userType || mapRoleToUserType(user.role);
          // Project leads, suppliers, and entities are beneficiaries
          if (['project_lead', 'supplier', 'entity'].includes(user.role) || userType === 'company') {
            // Check if user has projects
            const userProjects = Projects.getAll().filter(p => p.creatorId === user.id);
            if (userProjects.length > 0) {
              const beneficiary = Beneficiaries.create({
                userId: user.id,
                name: user.profile?.name || user.email,
                companyName: user.profile?.companyName || null,
                location: user.profile?.location || {},
                requiredServices: [], // Will be populated from projects
                requiredSkills: [], // Will be populated from projects
                budgetRange: { min: 0, max: 0, currency: 'SAR' },
                projectIds: userProjects.map(p => p.id),
                preferences: {
                  deliveryMode: [],
                  paymentTerms: [],
                  exchangeType: []
                },
                status: 'active',
                createdAt: user.createdAt || new Date().toISOString()
              });
              if (beneficiary) migratedBeneficiaries++;
            }
          }
        });

        if (migratedProviders > 0 || migratedBeneficiaries > 0) {
          console.log(`✅ Migrated ${migratedProviders} service provider(s) and ${migratedBeneficiaries} beneficiary(ies) to indexed structure`);
        }

        // Rebuild index
        IndexManager.rebuildIndex();
      }
    } catch (error) {
      console.error('Error migrating service index:', error);
      // Initialize empty index structure
      IndexManager.initializeIndex();
    }
    
    // Load additional test data if needed
    loadServiceIndexTestData();
  }

  // ============================================
  // Load Test Data for Service Index Models
  // ============================================
  function loadServiceIndexTestData() {
    // Only load if no data exists (migration already created some)
    const existingProviders = ServiceProviders.getAll();
    const existingBeneficiaries = Beneficiaries.getAll();
    const existingEvaluations = ServiceEvaluations.getAll();
    
    // If we already have enough data, skip
    if (existingProviders.length >= 2 && existingBeneficiaries.length >= 1) {
      return;
    }

    // Get demo users
    const users = Users.getAll();
    const demoUsers = users.filter(u => u.email && u.email.includes('@pmtwin.com'));
    
    if (demoUsers.length === 0) {
      return;
    }

    let createdProviders = 0;
    let createdBeneficiaries = 0;
    let createdEvaluations = 0;

    // Create additional test service providers if needed
    if (existingProviders.length < 3) {
      // Find Individual users
      const individualUsers = demoUsers.filter(u => 
        u.userType === 'individual' || 
        u.role === 'individual' ||
        (u.profile && u.profile.userType === 'individual')
      );
      
      const testProviders = [
        {
          userId: demoUsers.find(u => u.role === 'consultant' || u.role === 'professional')?.id || demoUsers[0].id,
          providerType: 'individual',
          name: 'Sarah Al-Mansouri',
          companyName: null,
          description: 'Freelance project management consultant specializing in construction project planning and execution.',
          categories: ['consulting', 'project_management'],
          skills: ['Project Planning', 'Risk Management', 'Stakeholder Management', 'Agile Methodology'],
          location: { city: 'Jeddah', region: 'Makkah Province', country: 'Saudi Arabia' },
          serviceAreas: ['Jeddah', 'Makkah', 'Riyadh'],
          availability: 'available',
          responseTime: '24 hours',
          profileScore: 88,
          certifications: ['PMP', 'PRINCE2'],
          establishedYear: null,
          contact: { email: 'sarah@pmtwin.com', phone: '+966 50 987 6543' },
          status: 'active'
        }
      ];
      
      // Add Individual users as providers if they don't exist
      if (individualUsers.length > 0) {
        individualUsers.slice(0, 2).forEach((user, index) => {
          const existing = ServiceProviders.getByUserId(user.id);
          if (!existing) {
            testProviders.push({
              userId: user.id,
              providerType: 'individual',
              name: user.profile?.name || user.email?.split('@')[0] || `Individual User ${index + 1}`,
              companyName: null,
              description: `Individual service provider offering various professional services.`,
              categories: ['consulting', 'design'],
              skills: user.profile?.skills || ['Consultation', 'Design', 'Writing'],
              location: user.profile?.location || { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
              serviceAreas: [user.profile?.location?.city || 'Riyadh'],
              availability: 'available',
              responseTime: '48 hours',
              profileScore: 75,
              certifications: [],
              establishedYear: null,
              contact: { email: user.email, phone: user.profile?.phone || '' },
              status: 'active'
            });
          }
        });
      }

      testProviders.forEach(providerData => {
        // Check if provider already exists
        const existing = ServiceProviders.getByUserId(providerData.userId);
        if (!existing) {
          const provider = ServiceProviders.create(providerData);
          if (provider) createdProviders++;
        }
      });
    }

    // Create additional test beneficiaries if needed
    if (existingBeneficiaries.length < 1) {
      const projectLeads = demoUsers.filter(u => ['project_lead', 'entity', 'company'].includes(u.role) || u.userType === 'company');
      const projects = Projects.getAll();
      
      projectLeads.forEach(user => {
        const existing = Beneficiaries.getByUserId(user.id);
        if (!existing) {
          const userProjects = projects.filter(p => p.creatorId === user.id);
          if (userProjects.length > 0) {
            const beneficiary = Beneficiaries.create({
              userId: user.id,
              name: user.profile?.name || user.email,
              companyName: user.profile?.companyName || null,
              location: user.profile?.location || { city: 'Riyadh', country: 'Saudi Arabia' },
              requiredServices: ['legal', 'engineering', 'logistics'],
              requiredSkills: ['Project Management', 'Contract Review', 'Engineering'],
              budgetRange: { min: 100000, max: 5000000, currency: 'SAR' },
              projectIds: userProjects.map(p => p.id),
              preferences: {
                deliveryMode: ['On-site', 'Hybrid'],
                paymentTerms: ['30_days', 'milestone_based'],
                exchangeType: ['Cash', 'Mixed']
              },
              status: 'active'
            });
            if (beneficiary) createdBeneficiaries++;
          }
        }
      });
    }

    // Create test evaluations if we have offerings and beneficiaries
    if (existingEvaluations.length === 0) {
      const offerings = [];
      try {
        const storedData = localStorage.getItem('pmtwin_service_providers');
        if (storedData) {
          const data = JSON.parse(storedData);
          offerings.push(...(data.serviceOfferings || []));
        }
      } catch (e) {
        console.warn('Error loading offerings for test evaluations:', e);
      }

      if (offerings.length > 0) {
        const beneficiaries = Beneficiaries.getAll();
        if (beneficiaries.length > 0) {
          const firstBeneficiary = beneficiaries[0];
          const firstOffering = offerings[0];
          
          if (firstOffering && firstBeneficiary) {
            const evaluation = ServiceEvaluations.create({
              serviceOfferingId: firstOffering.id,
              providerId: firstOffering.provider_user_id,
              beneficiaryId: firstBeneficiary.userId,
              projectId: firstBeneficiary.projectIds?.[0] || null,
              rating: 4.5,
              review: 'Excellent service! Very professional and delivered on time. Highly recommended.',
              performanceMetrics: {
                onTimeDelivery: true,
                qualityScore: 4.5,
                communicationScore: 4.0,
                valueScore: 4.5
              }
            });
            if (evaluation) createdEvaluations++;
          }
        }
      }
    }

    // Rebuild index if we created new data
    if (createdProviders > 0 || createdBeneficiaries > 0 || createdEvaluations > 0) {
      IndexManager.rebuildIndex();
      console.log(`✅ Created test data: ${createdProviders} providers, ${createdBeneficiaries} beneficiaries, ${createdEvaluations} evaluations`);
    }
    
    // Create test service offerings if they don't exist
    createTestServiceOfferings();
    
    // Create test service offerings if they don't exist
    createTestServiceOfferings();
    
    // Add test statistics to service offerings
    addTestStatisticsToOfferings();
    
    // Ensure Barter exchange type offerings exist
    ensureBarterOfferingsExist();
    
    console.log('✅ Service index test data loaded successfully');
  }

  // ============================================
  // Create Test Service Offerings
  // ============================================
  function createTestServiceOfferings() {
    try {
      let storedData = localStorage.getItem('pmtwin_service_providers');
      let data;
      
      if (!storedData) {
        // Initialize data structure if it doesn't exist
        data = {
          serviceProviders: [],
          serviceOfferings: [],
          beneficiaries: []
        };
      } else {
        data = JSON.parse(storedData);
      }
      
      const offerings = data.serviceOfferings || [];
      
      // Check if we already have enough offerings (at least 5)
      if (offerings.length >= 5) {
        return; // Already have enough offerings
      }
      
      // Get demo users and providers
      const users = Users.getAll();
      const demoUsers = users.filter(u => u.email && u.email.includes('@pmtwin.com'));
      if (demoUsers.length === 0) return;
      
      const providers = data.serviceProviders || [];
      if (providers.length === 0) return;
      
      // Get categories
      const categories = ['engineering', 'design', 'legal', 'logistics', 'consulting', 'construction'];
      
      let created = 0;
      
      // Create diverse test offerings
      const testOfferings = [
        {
          id: 'so_test_001',
          provider_user_id: providers[0]?.userId || demoUsers[0]?.id,
          providerId: providers[0]?.id || 'sp_001',
          title: 'Architectural Design Services',
          category: 'design',
          skills: ['Architectural Design', '3D Visualization', 'Project Planning', 'CAD Design'],
          description: 'Professional architectural design services for residential and commercial projects. Specialized in modern and sustainable design solutions.',
          delivery_mode: 'Hybrid',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 500 },
          pricing_type: 'Fixed',
          price_min: 50000,
          price_max: 500000,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'expert',
          supportedCollaborationModels: ['1.1', '2.2'],
          taskBasedEngagement: { supported: true, taskTypes: ['Design', 'Consultation'] },
          strategicAlliance: { supported: true, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 5, lead_time: '2-3 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_test_002',
          provider_user_id: providers[1]?.userId || demoUsers[1]?.id || demoUsers[0]?.id,
          providerId: providers[1]?.id || 'sp_002',
          title: 'Civil Engineering Consultation',
          category: 'engineering',
          skills: ['Civil Engineering', 'Project Management', 'Quality Control', 'Construction Planning'],
          description: 'Expert civil engineering consultation for infrastructure and construction projects. Over 10 years of experience in mega-projects.',
          delivery_mode: 'Onsite',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 300 },
          pricing_type: 'Hourly',
          price_min: 500,
          price_max: 1500,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'expert',
          supportedCollaborationModels: ['1.1'],
          taskBasedEngagement: { supported: true, taskTypes: ['Engineering', 'Consultation'] },
          strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 3, lead_time: '1-2 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_test_003',
          provider_user_id: providers[0]?.userId || demoUsers[0]?.id,
          providerId: providers[0]?.id || 'sp_001',
          title: 'Legal Consultation Services',
          category: 'legal',
          skills: ['Contract Review', 'Legal Consultation', 'Compliance', 'Risk Assessment'],
          description: 'Comprehensive legal consultation services for construction and business contracts. Specialized in MENA region regulations.',
          delivery_mode: 'Remote',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 1000 },
          pricing_type: 'Fixed',
          price_min: 10000,
          price_max: 100000,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'expert',
          supportedCollaborationModels: ['1.1', '2.2'],
          taskBasedEngagement: { supported: true, taskTypes: ['Consultation'] },
          strategicAlliance: { supported: true, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 10, lead_time: '3-5 days' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_test_004',
          provider_user_id: providers[1]?.userId || demoUsers[1]?.id || demoUsers[0]?.id,
          providerId: providers[1]?.id || 'sp_002',
          title: 'Project Management Services',
          category: 'consulting',
          skills: ['Project Management', 'Agile Methodology', 'Risk Management', 'Stakeholder Management'],
          description: 'Professional project management services for construction and infrastructure projects. PMP certified with extensive experience.',
          delivery_mode: 'Hybrid',
          location: { city: 'Jeddah', country: 'Saudi Arabia', radius: 400 },
          pricing_type: 'Daily',
          price_min: 2000,
          price_max: 5000,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'advanced',
          supportedCollaborationModels: ['1.1'],
          taskBasedEngagement: { supported: true, taskTypes: ['Project Management'] },
          strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 2, lead_time: '1 week' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_test_005',
          provider_user_id: providers[0]?.userId || demoUsers[0]?.id,
          providerId: providers[0]?.id || 'sp_001',
          title: 'Supply Chain & Logistics Management',
          category: 'logistics',
          skills: ['Supply Chain Management', 'Procurement', 'Logistics Planning', 'Inventory Management'],
          description: 'End-to-end supply chain and logistics management services for construction projects. Optimized for MENA region operations.',
          delivery_mode: 'Onsite',
          location: { city: 'Dammam', country: 'Saudi Arabia', radius: 600 },
          pricing_type: 'Milestone',
          price_min: 50000,
          price_max: 300000,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'advanced',
          supportedCollaborationModels: ['2.2'],
          taskBasedEngagement: { supported: false, taskTypes: [] },
          strategicAlliance: { supported: true, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 4, lead_time: '2-4 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_test_006',
          provider_user_id: providers[1]?.userId || demoUsers[1]?.id || demoUsers[0]?.id,
          providerId: providers[1]?.id || 'sp_002',
          title: 'Construction Quality Control Services',
          category: 'construction',
          skills: ['Quality Control', 'Inspection', 'Compliance', 'Safety Management'],
          description: 'Professional quality control and inspection services for construction projects. Ensuring compliance with international standards.',
          delivery_mode: 'Onsite',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 400 },
          pricing_type: 'Fixed',
          price_min: 25000,
          price_max: 150000,
          currency: 'SAR',
          exchange_type: 'Cash',
          experienceLevel: 'intermediate',
          supportedCollaborationModels: ['1.1'],
          taskBasedEngagement: { supported: true, taskTypes: ['Inspection', 'Quality Control'] },
          strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 6, lead_time: '1-2 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      testOfferings.forEach(offering => {
        // Check if offering with same ID already exists
        const exists = offerings.find(o => o.id === offering.id);
        if (!exists) {
          offerings.push(offering);
          created++;
        }
      });
      
      // Create additional offerings for Individual users
      const individualUsers = demoUsers.filter(u => 
        u.userType === 'individual' || 
        u.role === 'individual' || 
        (u.profile && u.profile.userType === 'individual')
      );
      
      if (individualUsers.length > 0 && providers.length > 0) {
        const individualOfferings = [
          {
            id: 'so_individual_001',
            provider_user_id: individualUsers[0]?.id || demoUsers.find(u => u.role === 'individual')?.id || demoUsers[0]?.id,
            providerId: providers[0]?.id || 'sp_001',
            title: 'Freelance Graphic Design Services',
            category: 'design',
            skills: ['Graphic Design', 'Brand Identity', 'Logo Design', 'Digital Marketing'],
            description: 'Creative graphic design services for businesses and individuals. Specialized in brand identity, logo design, and digital marketing materials.',
            delivery_mode: 'Remote',
            location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 1000 },
            pricing_type: 'Fixed',
            price_min: 5000,
            price_max: 50000,
            currency: 'SAR',
            exchange_type: 'Cash',
            experienceLevel: 'intermediate',
            supportedCollaborationModels: ['1.1'],
            taskBasedEngagement: { supported: true, taskTypes: ['Design'] },
            strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
            availability: { start_date: new Date().toISOString().split('T')[0], capacity: 8, lead_time: '1 week' },
            portfolio_links: [],
            attachments: [],
            status: 'Active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'so_individual_002',
            provider_user_id: individualUsers[1]?.id || individualUsers[0]?.id || demoUsers.find(u => u.role === 'individual')?.id || demoUsers[0]?.id,
            providerId: providers[1]?.id || providers[0]?.id || 'sp_002',
            title: 'Content Writing & Translation Services',
            category: 'consulting',
            skills: ['Content Writing', 'Translation', 'Copywriting', 'Technical Writing'],
            description: 'Professional content writing and translation services in Arabic and English. Specialized in technical documentation and marketing content.',
            delivery_mode: 'Remote',
            location: { city: 'Jeddah', country: 'Saudi Arabia', radius: 1000 },
            pricing_type: 'Hourly',
            price_min: 100,
            price_max: 300,
            currency: 'SAR',
            exchange_type: 'Cash',
            experienceLevel: 'intermediate',
            supportedCollaborationModels: ['1.1'],
            taskBasedEngagement: { supported: true, taskTypes: ['Writing', 'Translation'] },
            strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
            availability: { start_date: new Date().toISOString().split('T')[0], capacity: 10, lead_time: '2-3 days' },
            portfolio_links: [],
            attachments: [],
            status: 'Active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 'so_individual_003',
            provider_user_id: individualUsers[0]?.id || demoUsers.find(u => u.role === 'individual')?.id || demoUsers[0]?.id,
            providerId: providers[0]?.id || 'sp_001',
            title: 'Photography & Videography Services',
            category: 'consulting',
            skills: ['Photography', 'Videography', 'Event Coverage', 'Product Photography'],
            description: 'Professional photography and videography services for events, products, and corporate needs. High-quality visual content creation.',
            delivery_mode: 'Onsite',
            location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 200 },
            pricing_type: 'Fixed',
            price_min: 2000,
            price_max: 15000,
            currency: 'SAR',
            exchange_type: 'Cash',
            experienceLevel: 'intermediate',
            supportedCollaborationModels: ['1.1'],
            taskBasedEngagement: { supported: true, taskTypes: ['Photography', 'Videography'] },
            strategicAlliance: { supported: false, allianceTypes: [], targetSectors: [] },
            availability: { start_date: new Date().toISOString().split('T')[0], capacity: 5, lead_time: '3-5 days' },
            portfolio_links: [],
            attachments: [],
            status: 'Active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        individualOfferings.forEach(offering => {
          const exists = offerings.find(o => o.id === offering.id);
          if (!exists) {
            offerings.push(offering);
            created++;
          }
        });
      }
      
      // Always save the data structure, even if no new offerings were created
      data.serviceOfferings = offerings;
      localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
      
      if (created > 0) {
        console.log(`✅ Created ${created} test service offering(s) for marketplace (including Individual users)`);
        
        // Rebuild index
        if (typeof IndexManager !== 'undefined') {
          IndexManager.rebuildIndex();
        }
      }
    } catch (error) {
      console.error('Error creating test service offerings:', error);
    }
  }

  // ============================================
  // Add Test Statistics to Service Offerings
  // ============================================
  function addTestStatisticsToOfferings() {
    try {
      const storedData = localStorage.getItem('pmtwin_service_providers');
      if (!storedData) return;
      
      const data = JSON.parse(storedData);
      const offerings = data.serviceOfferings || [];
      
      if (offerings.length === 0) return;
      
      let updated = 0;
      
      offerings.forEach(offering => {
        // Only add test data if statistics are missing or zero
        if (!offering.views && !offering.inquiries && !offering.matchesGenerated && !offering.proposalsReceived) {
          // Generate random but realistic test data
          const baseViews = Math.floor(Math.random() * 500) + 50; // 50-550 views
          const views = baseViews;
          const inquiries = Math.floor(views * (0.1 + Math.random() * 0.2)); // 10-30% of views
          const matches = Math.floor(inquiries * (0.3 + Math.random() * 0.4)); // 30-70% of inquiries
          const proposals = Math.floor(matches * (0.2 + Math.random() * 0.3)); // 20-50% of matches
          
          offering.views = views;
          offering.inquiries = inquiries || 0;
          offering.matchesGenerated = matches || 0;
          offering.proposalsReceived = proposals || 0;
          
          // Add average rating if offering is active and has some proposals
          if (offering.status === 'Active' && proposals > 0) {
            offering.averageRating = 3.5 + Math.random() * 1.5; // 3.5-5.0 rating
            offering.totalRatings = proposals;
          }
          
          updated++;
        }
      });
      
      if (updated > 0) {
        localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
        console.log(`✅ Added test statistics to ${updated} service offering(s)`);
      }
    } catch (error) {
      console.error('Error adding test statistics to offerings:', error);
    }
  }

  // ============================================
  // Ensure Barter Exchange Type Offerings Exist
  // ============================================
  function ensureBarterOfferingsExist() {
    try {
      const storedData = localStorage.getItem('pmtwin_service_providers');
      if (!storedData) return;
      
      const data = JSON.parse(storedData);
      const offerings = data.serviceOfferings || [];
      
      // Check if we already have Barter offerings
      const hasBarterOfferings = offerings.some(o => o.exchange_type === 'Barter');
      if (hasBarterOfferings) {
        return; // Already have Barter offerings
      }
      
      // Get demo users for providers
      const users = Users.getAll();
      const demoUsers = users.filter(u => u.email && u.email.includes('@pmtwin.com'));
      if (demoUsers.length === 0) return;
      
      // Get existing providers
      const providers = data.serviceProviders || [];
      if (providers.length === 0) return;
      
      let created = 0;
      
      // Create Barter offerings if they don't exist
      const barterOfferings = [
        {
          id: 'so_barter_001',
          provider_user_id: providers[0]?.userId || demoUsers[0]?.id,
          providerId: providers[0]?.id || 'sp_001',
          title: 'Construction Materials Trading - Barter Exchange',
          category: 'logistics',
          skills: ['Material Trading', 'Barter Exchange', 'Supply Chain', 'Material Sourcing'],
          description: 'Barter-based construction materials trading service. Exchange your materials or services for construction supplies.',
          delivery_mode: 'Onsite',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 200 },
          pricing_type: 'Barter',
          price_min: 0,
          price_max: 0,
          currency: 'SAR',
          exchange_type: 'Barter',
          barter_details: {
            accepts: ['Construction Materials', 'Equipment Rental', 'Labor Services'],
            offers: ['Steel', 'Cement', 'Electrical Supplies'],
            valuation_method: 'Market Value'
          },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 10, lead_time: '1-2 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'so_barter_002',
          provider_user_id: providers[1]?.userId || demoUsers[1]?.id || demoUsers[0]?.id,
          providerId: providers[1]?.id || 'sp_002',
          title: 'Design Services for Equipment/Resources',
          category: 'design',
          skills: ['Architectural Design', '3D Visualization', 'Barter Exchange'],
          description: 'Offering architectural and design services in exchange for construction equipment or office space.',
          delivery_mode: 'Hybrid',
          location: { city: 'Riyadh', country: 'Saudi Arabia', radius: 300 },
          pricing_type: 'Barter',
          price_min: 0,
          price_max: 0,
          currency: 'SAR',
          exchange_type: 'Barter',
          barter_details: {
            accepts: ['Construction Equipment', 'Office Space', 'Marketing Services'],
            offers: ['Architectural Design', '3D Modeling', 'Interior Design'],
            valuation_method: 'Hourly Rate Equivalent'
          },
          availability: { start_date: new Date().toISOString().split('T')[0], capacity: 3, lead_time: '2-3 weeks' },
          portfolio_links: [],
          attachments: [],
          status: 'Active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      barterOfferings.forEach(offering => {
        // Check if offering with same ID already exists
        const exists = offerings.find(o => o.id === offering.id);
        if (!exists) {
          offerings.push(offering);
          created++;
        }
      });
      
      if (created > 0) {
        data.serviceOfferings = offerings;
        localStorage.setItem('pmtwin_service_providers', JSON.stringify(data));
        console.log(`✅ Created ${created} Barter exchange type service offering(s)`);
        
        // Rebuild index
        if (typeof IndexManager !== 'undefined') {
          IndexManager.rebuildIndex();
        }
      }
    } catch (error) {
      console.error('Error ensuring Barter offerings exist:', error);
    }
  }

  // Calculate profile completion score based on section completeness
  // Profile Score = (Completion Score × 0.6) + (Verification Score × 0.4)
  function calculateProfileCompletionScore(user) {
    if (!user) return 0;

    const userType = user.userType || mapRoleToUserType(user.role);
    const profileSections = user.profileSections || {};
    const identity = user.identity || {};
    
    // Handle documents as both array and object structure
    let documents = [];
    if (Array.isArray(user.documents)) {
      documents = user.documents;
    } else if (user.documents && typeof user.documents === 'object') {
      // Convert object structure to array for compatibility
      Object.keys(user.documents).forEach(key => {
        if (Array.isArray(user.documents[key])) {
          user.documents[key].forEach(doc => {
            documents.push({
              type: key,
              ...doc,
              verified: user.documentVerifications?.[key]?.verified || false
            });
          });
        }
      });
    }
    
    const documentVerifications = user.documentVerifications || {};
    const profile = user.profile || {};

    // Determine if user is company-like (beneficiary, vendor, entity, etc.)
    const isCompanyType = ['company', 'beneficiary', 'vendor_corporate', 'entity'].includes(userType);

    // ============================================
    // COMPLETION SCORE (60% weight)
    // ============================================
    let completionTotalWeight = 0;
    let completionCompletedWeight = 0;

    // Basic Information (15%)
    if (isCompanyType) {
      const basicFields = ['legalEntityName', 'companyName', 'phone', 'website'];
      const basicWeight = 15 / basicFields.length;
      basicFields.forEach(field => {
        completionTotalWeight += basicWeight;
        if (profile[field] || identity[field]) completionCompletedWeight += basicWeight;
      });
    } else {
      const basicFields = ['fullLegalName', 'professionalTitle', 'phone', 'email'];
      const basicWeight = 15 / basicFields.length;
      basicFields.forEach(field => {
        completionTotalWeight += basicWeight;
        if (profile[field] || identity[field]) completionCompletedWeight += basicWeight;
      });
    }

    // Professional Details (20%)
    if (isCompanyType) {
      const professionalFields = ['services', 'yearsInBusiness', 'employeeCount'];
      const professionalWeight = 20 / professionalFields.length;
      professionalFields.forEach(field => {
        completionTotalWeight += professionalWeight;
        if (profile[field] || (field === 'employeeCount' && profile.teamSize)) completionCompletedWeight += professionalWeight;
      });
    } else {
      const professionalFields = ['skills', 'experienceLevel', 'certifications'];
      const professionalWeight = 20 / 3;
      professionalFields.forEach(field => {
        completionTotalWeight += professionalWeight;
        if (profile[field] || profileSections[field]?.completed) completionCompletedWeight += professionalWeight;
      });
    }

    // Portfolio/Experience (25%)
    const portfolioWeight = 25;
    completionTotalWeight += portfolioWeight;
    if (profileSections.portfolio?.completed || profileSections.experience?.completed || 
        (profile.portfolio && profile.portfolio.length > 0)) {
      completionCompletedWeight += portfolioWeight;
    }

    // Certifications (15%)
    const certWeight = 15;
    completionTotalWeight += certWeight;
    if (profileSections.certifications?.completed || 
        (profile.certifications && profile.certifications.length > 0) ||
        (documents.some(doc => doc.type === 'certification'))) {
      completionCompletedWeight += certWeight;
    }

    // References (10%)
    const refWeight = 10;
    completionTotalWeight += refWeight;
    if (profileSections.references?.completed || 
        (profile.references && profile.references.length > 0)) {
      completionCompletedWeight += refWeight;
    }

    // Additional Information (15%)
    const additionalWeight = 15;
    completionTotalWeight += additionalWeight;
    if (profile.bio || profile.description || profile.companyDescription || profileSections.additional?.completed) {
      completionCompletedWeight += additionalWeight;
    }

    const completionScore = completionTotalWeight > 0 
      ? (completionCompletedWeight / completionTotalWeight) * 100 
      : 0;

    // ============================================
    // VERIFICATION SCORE (40% weight)
    // ============================================
    let verificationTotalWeight = 0;
    let verificationCompletedWeight = 0;

    // Identity Verification (30%)
    const identityWeight = 30;
    verificationTotalWeight += identityWeight;
    if (isCompanyType) {
      // Entity: CR verification - check documentVerifications or identity
      const crVerified = documentVerifications.cr?.verified || 
                        (identity.crNumber && identity.crVerified) ||
                        documents.some(doc => doc.type === 'cr' && doc.verified);
      if (crVerified) {
        verificationCompletedWeight += identityWeight;
      }
    } else {
      // Individual: National ID verification
      const idVerified = documentVerifications.nationalId?.verified ||
                         (identity.nationalId && identity.nationalIdVerified) ||
                         documents.some(doc => (doc.type === 'national_id' || doc.type === 'passport') && doc.verified);
      if (idVerified) {
        verificationCompletedWeight += identityWeight;
      }
    }

    // Professional Certifications (30%)
    const profCertWeight = 30;
    verificationTotalWeight += profCertWeight;
    const verifiedCerts = documentVerifications.professionalLicense?.verified ||
                         documentVerifications.additionalCerts?.verified ||
                         documents.some(doc => 
                           (doc.type === 'certification' || doc.type === 'license' || doc.type === 'professionalLicense') && doc.verified
                         );
    if (verifiedCerts) {
      verificationCompletedWeight += profCertWeight;
    }

    // Portfolio Documents (20%)
    const portfolioDocWeight = 20;
    verificationTotalWeight += portfolioDocWeight;
    const verifiedPortfolio = documentVerifications.portfolio?.verified ||
                             documentVerifications.companyProfile?.verified ||
                             documents.some(doc => 
                               (doc.type === 'portfolio' || doc.type === 'case_study' || doc.type === 'companyProfile') && doc.verified
                             );
    if (verifiedPortfolio) {
      verificationCompletedWeight += portfolioDocWeight;
    }

    // Safety Certifications (20%)
    const safetyWeight = 20;
    verificationTotalWeight += safetyWeight;
    const verifiedSafety = documentVerifications.safetyCertification?.verified ||
                          documents.some(doc => 
                            doc.type === 'safety_certification' && doc.verified
                          );
    if (verifiedSafety) {
      verificationCompletedWeight += safetyWeight;
    }

    const verificationScore = verificationTotalWeight > 0 
      ? (verificationCompletedWeight / verificationTotalWeight) * 100 
      : 0;

    // ============================================
    // FINAL SCORE: (Completion × 0.6) + (Verification × 0.4)
    // ============================================
    const finalScore = Math.round((completionScore * 0.6) + (verificationScore * 0.4));
    
    return {
      score: finalScore,
      completionScore: Math.round(completionScore),
      verificationScore: Math.round(verificationScore),
      breakdown: {
        completion: {
          basicInfo: completionTotalWeight > 0 ? Math.round((completionCompletedWeight / completionTotalWeight) * 100) : 0,
          total: Math.round(completionScore)
        },
        verification: {
          identity: identityWeight > 0 ? Math.round((verificationCompletedWeight / verificationTotalWeight) * 100) : 0,
          total: Math.round(verificationScore)
        }
      }
    };
  }

  // Legacy function for backward compatibility - returns just the score number
  function getProfileScore(user) {
    const scoreData = calculateProfileCompletionScore(user);
    return typeof scoreData === 'object' ? scoreData.score : scoreData;
  }

  // Calculate onboarding progress percentage
  function calculateOnboardingProgress(userType, stage, user = null) {
    // If user object provided, calculate based on profile completion
    if (user) {
      const scoreData = calculateProfileCompletionScore(user);
      const profileScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
      const stageWeights = {
        'registered': 0,
        'profile_in_progress': Math.min(profileScore, 80),
        'under_review': 80,
        'approved': 100,
        'active': 100,
        'rejected': Math.min(profileScore, 60)
      };
      const basePercentage = stageWeights[stage] || 0;
      return {
        percentage: basePercentage,
        profileCompletionScore: profileScore,
        profileScoreData: typeof scoreData === 'object' ? scoreData : null,
        currentStage: stage,
        nextSteps: getNextStepsForStage(userType, stage)
      };
    }

    // Legacy calculation for backward compatibility
    const stageWeights = {
      'company': {
        'registered': 0,
        'profile_in_progress': 20,
        'under_review': 80,
        'approved': 100,
        'active': 100,
        'rejected': 60
      },
      'consultant': {
        'registered': 0,
        'profile_in_progress': 20,
        'under_review': 80,
        'approved': 100,
        'active': 100,
        'rejected': 60
      },
      'individual': {
        'registered': 0,
        'profile_in_progress': 20,
        'under_review': 80,
        'approved': 100,
        'active': 100,
        'rejected': 60
      },
      'admin': {
        'approved': 100,
        'active': 100
      }
    };

    const percentage = stageWeights[userType]?.[stage] || 0;
    const nextSteps = getNextStepsForStage(userType, stage);

    return {
      percentage: percentage,
      currentStage: stage,
      nextSteps: nextSteps
    };
  }

  function getNextStepsForStage(userType, stage) {
    const nextStepsMap = {
      'company': {
        'registered': ['Verify your email address', 'Verify your mobile number'],
        'profile_in_progress': ['Complete identity information', 'Complete company profile', 'Upload CR and VAT documents', 'Add branches and team members'],
        'under_review': ['Awaiting admin verification (typically 24-48 hours)'],
        'approved': ['Account activated - Full access granted'],
        'active': [],
        'rejected': ['Review rejection reason', 'Update documents and information', 'Resubmit for verification']
      },
      'consultant': {
        'registered': ['Verify your email address', 'Verify your mobile number'],
        'profile_in_progress': ['Complete identity information', 'Complete professional profile', 'Upload professional license and CV', 'Add skills and certifications'],
        'under_review': ['Awaiting admin verification (typically 24-48 hours)'],
        'approved': ['Account activated - Full access granted'],
        'active': [],
        'rejected': ['Review rejection reason', 'Update credentials and information', 'Resubmit for verification']
      },
      'individual': {
        'registered': ['Verify your email address', 'Verify your mobile number'],
        'profile_in_progress': ['Complete identity information', 'Complete basic profile'],
        'under_review': ['Awaiting admin verification (typically 24-48 hours)'],
        'approved': ['Account activated - Full access granted'],
        'active': [],
        'rejected': ['Review rejection reason', 'Update information', 'Resubmit for verification']
      },
      'admin': {
        'approved': [],
        'active': []
      }
    };

    return nextStepsMap[userType]?.[stage] || [];
  }

  // Auto-create test accounts on first load
  // Now uses UserManager for centralized user management
  function autoCreateTestAccounts() {
    // Use UserManager if available (loads all users from demo-users.json)
    if (typeof UserManager !== 'undefined' && UserManager.initializeAllUsers) {
      console.log('[Data] Using UserManager for centralized user initialization');
      UserManager.initializeAllUsers().catch(err => {
        console.error('[Data] Error initializing users via UserManager:', err);
        // Fallback to legacy method
        createLegacyTestAccounts();
      });
    } else {
      // Fallback to legacy method if UserManager not loaded yet
      console.log('[Data] UserManager not available, using legacy method');
      createLegacyTestAccounts();
    }
  }

  // Legacy method (kept for backward compatibility)
  function createLegacyTestAccounts() {
    const users = Users.getAll();
    
    // Check which accounts exist
    const adminExists = users.some(u => u.email === 'admin@pmtwin.com');
    const individualExists = users.some(u => u.email === 'individual@pmtwin.com');
    const entityExists = users.some(u => u.email === 'entity@pmtwin.com');
    
    let created = 0;
    
    // Create Admin if doesn't exist
    if (!adminExists) {
      Users.create({
        email: 'admin@pmtwin.com',
        password: btoa('Admin123'),
        role: 'admin',
        userType: 'admin',
        onboardingStage: 'approved',
        emailVerified: true,
        profile: {
          name: 'Admin User',
          status: 'approved',
          department: 'Operations',
          permissions: ['vet_users', 'moderate_projects', 'view_reports', 'manage_audit_trail'],
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system'
        }
      });
      created++;
    }

    // Create Consultant (Individual) if doesn't exist
    if (!individualExists) {
      const individualCreatedAt = new Date();
      individualCreatedAt.setDate(individualCreatedAt.getDate() - 5); // 5 days ago
      
      Users.create({
        email: 'individual@pmtwin.com',
        password: btoa('User123'),
        role: 'individual',
        userType: 'individual',
        mobile: '+966501234567',
        onboardingStage: 'approved',
        emailVerified: true,
        mobileVerified: true,
        identity: {
          fullLegalName: 'John Doe',
          nationalId: '1234567890',
          nationalIdVerified: true,
          nationalIdVerifiedAt: new Date().toISOString(),
          passportNumber: null,
          professionalCertifications: [
            {
              name: 'PMP Certification',
              issuer: 'PMI',
              issueDate: '2020-01-15',
              expiryDate: '2026-01-15',
              credentialId: 'PMP-123456'
            },
            {
              name: 'Professional Engineer License',
              issuer: 'Saudi Council of Engineers',
              issueDate: '2018-03-20',
              expiryDate: '2025-03-20',
              credentialId: 'PE-SA-789012'
            }
          ]
        },
        profile: {
          name: 'John Doe',
          professionalTitle: 'Senior Civil Engineer',
          phone: '+966501234567',
          bio: 'Experienced civil engineer with over 10 years in construction project management, specializing in infrastructure development and quality control.',
          location: {
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          },
          skills: ['Project Management', 'Civil Engineering', 'Construction Planning', 'Quality Control', 'Budget Management', 'Team Leadership'],
          experienceLevel: 'senior',
          certifications: [
            {
              name: 'PMP Certification',
              issuer: 'PMI',
              issueDate: '2020-01-15',
              expiryDate: '2026-01-15',
              credentialId: 'PMP-123456'
            },
            {
              name: 'Professional Engineer License',
              issuer: 'Saudi Council of Engineers',
              issueDate: '2018-03-20',
              expiryDate: '2025-03-20',
              credentialId: 'PE-SA-789012'
            }
          ],
          portfolio: [
            {
              id: 'portfolio_1',
              title: 'Highway Infrastructure Project',
              description: 'Led construction of 50km highway connecting Riyadh to Dammam',
              completionDate: '2023-06-01',
              link: 'https://portfolio.example.com/project1',
              value: 50000000
            },
            {
              id: 'portfolio_2',
              title: 'Commercial Building Complex',
              description: 'Project manager for 20-story commercial building in King Fahd District',
              completionDate: '2022-12-15',
              link: 'https://portfolio.example.com/project2',
              value: 35000000
            }
          ],
          status: 'approved',
          createdAt: individualCreatedAt.toISOString(),
          approvedAt: new Date(individualCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(), // Approved 2 days after registration
          approvedBy: 'system'
        },
        documents: {
          professionalLicense: [
            {
              name: 'professional_license.pdf',
              size: 2048000,
              type: 'application/pdf',
              uploadedAt: individualCreatedAt.toISOString()
            }
          ],
          resume: [
            {
              name: 'john_doe_resume.pdf',
              size: 1536000,
              type: 'application/pdf',
              uploadedAt: individualCreatedAt.toISOString()
            }
          ],
          additionalCerts: [
            {
              name: 'pmp_certificate.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: individualCreatedAt.toISOString()
            }
          ]
        },
        documentVerifications: {
          professionalLicense: {
            documentType: 'professionalLicense',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: new Date(individualCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'License verified and valid'
          },
          resume: {
            documentType: 'resume',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: new Date(individualCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'CV reviewed and approved'
          }
        },
        vettingComments: [
          {
            id: 'comment_1',
            comment: 'Professional credentials verified. License is valid and in good standing.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: new Date(individualCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        review: {
          submittedAt: new Date(individualCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(individualCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'system',
          status: 'approved',
          reviewNotes: 'All documents verified. Profile complete and approved.'
        }
      });
      created++;
    }

    // Create Company (Entity) if doesn't exist
    if (!entityExists) {
      const entityCreatedAt = new Date();
      entityCreatedAt.setDate(entityCreatedAt.getDate() - 7); // 7 days ago
      
      Users.create({
        email: 'entity@pmtwin.com',
        password: btoa('Entity123'),
        role: 'entity',
        userType: 'entity',
        mobile: '+966112345678',
        onboardingStage: 'approved',
        emailVerified: true,
        mobileVerified: true,
        identity: {
          legalEntityName: 'ABC Construction Company Ltd.',
          crNumber: 'CR-1234567890',
          crVerified: true,
          crVerifiedAt: new Date(entityCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          crIssueDate: '2010-05-15',
          crExpiryDate: '2025-05-15',
          taxNumber: 'VAT-123456789012345',
          taxNumberVerified: true,
          authorizedRepresentativeNID: '9876543210',
          authorizedRepresentativeName: 'Ahmed Al-Saud',
          scaClassifications: ['General Contracting', 'Infrastructure Development'],
          scaVerified: true
        },
        profile: {
          name: 'ABC Construction Co.',
          companyName: 'ABC Construction Company Ltd.',
          legalName: 'ABC Construction Company Ltd.',
          phone: '+966112345678',
          website: 'https://www.abcconstruction.com',
          companyDescription: 'Leading construction company specializing in large-scale infrastructure projects across Saudi Arabia. Established in 2009 with a proven track record of delivering quality projects on time and within budget.',
          location: {
            headquarters: {
              address: 'King Fahd Road, Al Olaya District',
              city: 'Riyadh',
              region: 'Riyadh Province',
              country: 'Saudi Arabia'
            }
          },
          hqAddress: 'King Fahd Road, Al Olaya District',
          hqCity: 'Riyadh',
          hqRegion: 'Riyadh Province',
          hqCountry: 'Saudi Arabia',
          branches: [
            {
              id: 'branch_1',
              name: 'Jeddah Branch',
              address: 'Corniche Road, Al Hamra District',
              city: 'Jeddah',
              region: 'Makkah Province',
              country: 'Saudi Arabia',
              phone: '+966122345678'
            }
          ],
          commercialRegistration: {
            number: 'CR-1234567890',
            verified: true,
            issueDate: '2010-05-15',
            expiryDate: '2025-05-15'
          },
          vatNumber: {
            number: 'VAT-123456789012345',
            verified: true
          },
          services: ['General Contracting', 'Infrastructure Development', 'Project Management', 'Design-Build'],
          serviceDescriptions: {
            'General Contracting': 'Full-service general contracting for commercial and residential projects',
            'Infrastructure Development': 'Highway, bridge, and public infrastructure construction',
            'Project Management': 'Comprehensive project management services'
          },
          yearsInBusiness: 15,
          employeeCount: '100-500',
          annualRevenueRange: '50M-100M',
          maxProjectValue: 100000000,
          concurrentProjects: 5,
          keyProjects: [
            {
              id: 'project_1',
              title: 'Riyadh Metro Station Construction',
              description: 'Construction of 3 metro stations as part of Riyadh Metro project',
              completionDate: '2023-08-30',
              value: 85000000
            },
            {
              id: 'project_2',
              title: 'King Abdullah Financial District',
              description: 'Multi-building complex in KAFD',
              completionDate: '2022-11-15',
              value: 120000000
            }
          ],
          status: 'approved',
          createdAt: entityCreatedAt.toISOString(),
          approvedAt: new Date(entityCreatedAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // Approved 3 days after registration
          approvedBy: 'system'
        },
        documents: {
          cr: [
            {
              name: 'commercial_registration.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: entityCreatedAt.toISOString()
            }
          ],
          vat: [
            {
              name: 'vat_certificate.pdf',
              size: 896000,
              type: 'application/pdf',
              uploadedAt: entityCreatedAt.toISOString()
            }
          ],
          companyProfile: [
            {
              name: 'company_profile.pdf',
              size: 2560000,
              type: 'application/pdf',
              uploadedAt: entityCreatedAt.toISOString()
            }
          ]
        },
        documentVerifications: {
          cr: {
            documentType: 'cr',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: new Date(entityCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'CR verified and valid until 2025-05-15'
          },
          vat: {
            documentType: 'vat',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: new Date(entityCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'VAT certificate verified'
          },
          companyProfile: {
            documentType: 'companyProfile',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: new Date(entityCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Company profile document reviewed and approved'
          }
        },
        vettingComments: [
          {
            id: 'comment_1',
            comment: 'Commercial Registration verified. Company is in good standing.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: new Date(entityCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_2',
            comment: 'VAT certificate confirmed. All financial documents in order.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: new Date(entityCreatedAt.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        review: {
          submittedAt: new Date(entityCreatedAt.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: new Date(entityCreatedAt.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          reviewedBy: 'system',
          status: 'approved',
          reviewNotes: 'All documents verified. Company profile complete. Approved for full platform access.'
        }
      });
      created++;
    }

    // Create comprehensive test users for vetting (new registrations with different stages)
    const testUsers = [
      // Individual - Registered (just signed up)
      {
        email: 'new.individual@pmtwin.com',
        password: 'Pending123',
        role: 'individual',
        userType: 'individual',
        mobile: '+966502345678',
        onboardingStage: 'registered',
        emailVerified: true,
        mobileVerified: false,
        daysAgo: 1,
        identity: {
          fullLegalName: 'Sarah Al-Mansouri',
          nationalId: '2345678901',
          nationalIdVerified: false
        },
        profile: {
          name: 'Sarah Al-Mansouri',
          professionalTitle: 'Junior Project Manager',
          phone: '+966502345678',
          bio: 'Recent graduate with passion for construction project management. Eager to contribute to infrastructure projects.',
          location: {
            city: 'Jeddah',
            region: 'Makkah Province',
            country: 'Saudi Arabia'
          },
          skills: ['Project Management', 'Communication', 'Team Coordination', 'MS Project'],
          experienceLevel: 'junior',
          status: 'pending',
          createdAt: null // Will be set
        },
        documents: {
          resume: [
            {
              name: 'sarah_resume.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        review: {
          submittedAt: null,
          status: 'pending'
        }
      },
      // Individual - Profile In Progress
      {
        email: 'profile.individual@pmtwin.com',
        password: 'Pending123',
        role: 'individual',
        userType: 'individual',
        mobile: '+966503456789',
        onboardingStage: 'profile_in_progress',
        emailVerified: true,
        mobileVerified: true,
        daysAgo: 3,
        identity: {
          fullLegalName: 'Mohammed Al-Rashid',
          nationalId: '3456789012',
          nationalIdVerified: false
        },
        profile: {
          name: 'Mohammed Al-Rashid',
          professionalTitle: 'Structural Engineer',
          phone: '+966503456789',
          bio: 'Experienced structural engineer with 5 years in building design and analysis.',
          location: {
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          },
          skills: ['Structural Engineering', 'AutoCAD', 'ETABS', 'Building Design', 'Code Compliance'],
          experienceLevel: 'intermediate',
          certifications: [
            {
              name: 'Structural Engineer License',
              issuer: 'Saudi Council of Engineers',
              issueDate: '2020-06-15',
              expiryDate: '2025-06-15',
              credentialId: 'SE-SA-456789'
            }
          ],
          status: 'pending',
          createdAt: null
        },
        documents: {
          professionalLicense: [
            {
              name: 'mohammed_license.pdf',
              size: 1536000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          resume: [
            {
              name: 'mohammed_resume.pdf',
              size: 1280000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        review: {
          submittedAt: null,
          status: 'pending'
        }
      },
      // Consultant - Under Review
      {
        email: 'review.consultant@pmtwin.com',
        password: 'Pending123',
        role: 'consultant',
        userType: 'consultant',
        mobile: '+966504567890',
        onboardingStage: 'under_review',
        emailVerified: true,
        mobileVerified: true,
        daysAgo: 5,
        identity: {
          fullLegalName: 'Fatima Al-Zahra',
          nationalId: '4567890123',
          nationalIdVerified: true,
          nationalIdVerifiedAt: null,
          professionalCertifications: [
            {
              name: 'PMP Certification',
              issuer: 'PMI',
              issueDate: '2021-03-10',
              expiryDate: '2027-03-10',
              credentialId: 'PMP-789012'
            }
          ]
        },
        profile: {
          name: 'Fatima Al-Zahra',
          professionalTitle: 'Senior Project Management Consultant',
          phone: '+966504567890',
          bio: 'Certified PMP with 12 years of experience managing large-scale construction projects. Specialized in infrastructure and commercial developments.',
          location: {
            city: 'Dammam',
            region: 'Eastern Province',
            country: 'Saudi Arabia'
          },
          skills: ['Project Management', 'Risk Management', 'Stakeholder Management', 'Agile Methodologies', 'Budget Control'],
          experienceLevel: 'senior',
          certifications: [
            {
              name: 'PMP Certification',
              issuer: 'PMI',
              issueDate: '2021-03-10',
              expiryDate: '2027-03-10',
              credentialId: 'PMP-789012'
            },
            {
              name: 'PRINCE2 Practitioner',
              issuer: 'AXELOS',
              issueDate: '2019-11-20',
              expiryDate: '2025-11-20',
              credentialId: 'PR2-345678'
            }
          ],
          portfolio: [
            {
              id: 'portfolio_1',
              title: 'Airport Terminal Expansion',
              description: 'Managed $200M airport terminal expansion project',
              completionDate: '2023-09-30',
              link: 'https://portfolio.example.com/airport',
              value: 200000000
            }
          ],
          status: 'pending',
          createdAt: null
        },
        documents: {
          professionalLicense: [
            {
              name: 'fatima_license.pdf',
              size: 2048000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          resume: [
            {
              name: 'fatima_resume.pdf',
              size: 1792000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          additionalCerts: [
            {
              name: 'pmp_certificate.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: null
            },
            {
              name: 'prince2_certificate.pdf',
              size: 896000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        review: {
          submittedAt: null,
          reviewedAt: null,
          status: 'pending'
        },
        vettingComments: [
          {
            id: 'comment_1',
            comment: 'Professional certifications verified. PMP and PRINCE2 are valid.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: null
          }
        ]
      },
      // Entity/Company - Registered
      {
        email: 'new.company@pmtwin.com',
        password: 'Pending123',
        role: 'entity',
        userType: 'entity',
        mobile: '+966123456789',
        onboardingStage: 'registered',
        emailVerified: true,
        mobileVerified: true,
        daysAgo: 2,
        identity: {
          legalEntityName: 'New Build Construction LLC',
          crNumber: 'CR-9876543210',
          crVerified: false,
          crIssueDate: '2023-01-15',
          crExpiryDate: '2028-01-15',
          taxNumber: 'VAT-987654321098765',
          taxNumberVerified: false,
          authorizedRepresentativeNID: '1112223334',
          authorizedRepresentativeName: 'Khalid Al-Otaibi',
          scaClassifications: ['General Contracting'],
          scaVerified: false
        },
        profile: {
          name: 'New Build Construction',
          companyName: 'New Build Construction LLC',
          legalName: 'New Build Construction LLC',
          phone: '+966123456789',
          website: 'https://www.newbuild.com',
          companyDescription: 'New construction company established in 2023, focusing on residential and commercial projects.',
          location: {
            headquarters: {
              address: 'Al Khobar Corniche, Building 45',
              city: 'Al Khobar',
              region: 'Eastern Province',
              country: 'Saudi Arabia'
            }
          },
          hqAddress: 'Al Khobar Corniche, Building 45',
          hqCity: 'Al Khobar',
          hqRegion: 'Eastern Province',
          hqCountry: 'Saudi Arabia',
          services: ['General Contracting', 'Residential Construction'],
          serviceDescriptions: {
            'General Contracting': 'Full-service general contracting for residential and commercial projects',
            'Residential Construction': 'Single-family homes and apartment complexes'
          },
          yearsInBusiness: 1,
          employeeCount: '10-50',
          annualRevenueRange: '5M-10M',
          maxProjectValue: 10000000,
          concurrentProjects: 2,
          status: 'pending',
          createdAt: null
        },
        documents: {
          cr: [
            {
              name: 'cr_newbuild.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          vat: [
            {
              name: 'vat_newbuild.pdf',
              size: 896000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        review: {
          submittedAt: null,
          status: 'pending'
        }
      },
      // Entity/Company - Profile In Progress
      {
        email: 'profile.company@pmtwin.com',
        password: 'Pending123',
        role: 'entity',
        userType: 'entity',
        mobile: '+966124567890',
        onboardingStage: 'profile_in_progress',
        emailVerified: true,
        mobileVerified: true,
        daysAgo: 4,
        identity: {
          legalEntityName: 'Elite Infrastructure Group',
          crNumber: 'CR-1122334455',
          crVerified: false,
          crIssueDate: '2018-06-20',
          crExpiryDate: '2026-06-20',
          taxNumber: 'VAT-112233445566778',
          taxNumberVerified: false,
          authorizedRepresentativeNID: '5556667778',
          authorizedRepresentativeName: 'Omar Al-Shehri',
          scaClassifications: ['Infrastructure Development', 'General Contracting'],
          scaVerified: false
        },
        profile: {
          name: 'Elite Infrastructure Group',
          companyName: 'Elite Infrastructure Group',
          legalName: 'Elite Infrastructure Group Ltd.',
          phone: '+966124567890',
          website: 'https://www.eliteinfra.com',
          companyDescription: 'Established infrastructure development company specializing in roads, bridges, and public works projects.',
          location: {
            headquarters: {
              address: 'King Abdullah Road, Al Malaz District',
              city: 'Riyadh',
              region: 'Riyadh Province',
              country: 'Saudi Arabia'
            }
          },
          hqAddress: 'King Abdullah Road, Al Malaz District',
          hqCity: 'Riyadh',
          hqRegion: 'Riyadh Province',
          hqCountry: 'Saudi Arabia',
          branches: [
            {
              id: 'branch_1',
              name: 'Jeddah Office',
              address: 'Prince Sultan Street',
              city: 'Jeddah',
              region: 'Makkah Province',
              country: 'Saudi Arabia',
              phone: '+966125678901'
            }
          ],
          commercialRegistration: {
            number: 'CR-1122334455',
            verified: false,
            issueDate: '2018-06-20',
            expiryDate: '2026-06-20'
          },
          vatNumber: {
            number: 'VAT-112233445566778',
            verified: false
          },
          services: ['Infrastructure Development', 'General Contracting', 'Road Construction', 'Bridge Construction'],
          serviceDescriptions: {
            'Infrastructure Development': 'Comprehensive infrastructure projects including roads, bridges, and utilities',
            'General Contracting': 'Full-service general contracting for public and private projects',
            'Road Construction': 'Highway and road construction and maintenance',
            'Bridge Construction': 'Design and construction of bridges and overpasses'
          },
          yearsInBusiness: 6,
          employeeCount: '50-100',
          annualRevenueRange: '25M-50M',
          maxProjectValue: 50000000,
          concurrentProjects: 4,
          keyProjects: [
            {
              id: 'project_1',
              title: 'Highway 40 Expansion',
              description: '20km highway expansion project',
              completionDate: '2023-12-15',
              value: 35000000
            }
          ],
          status: 'pending',
          createdAt: null
        },
        documents: {
          cr: [
            {
              name: 'cr_elite.pdf',
              size: 1536000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          vat: [
            {
              name: 'vat_elite.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          companyProfile: [
            {
              name: 'elite_company_profile.pdf',
              size: 3072000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        review: {
          submittedAt: null,
          status: 'pending'
        }
      },
      // Entity/Company - Under Review
      {
        email: 'review.company@pmtwin.com',
        password: 'Pending123',
        role: 'entity',
        userType: 'entity',
        mobile: '+966125678901',
        onboardingStage: 'under_review',
        emailVerified: true,
        mobileVerified: true,
        daysAgo: 6,
        identity: {
          legalEntityName: 'Mega Construction International',
          crNumber: 'CR-9988776655',
          crVerified: true,
          crVerifiedAt: null,
          crIssueDate: '2015-03-10',
          crExpiryDate: '2025-03-10',
          taxNumber: 'VAT-998877665544332',
          taxNumberVerified: true,
          authorizedRepresentativeNID: '9998887776',
          authorizedRepresentativeName: 'Faisal Al-Mutairi',
          scaClassifications: ['General Contracting', 'Infrastructure Development', 'Project Management'],
          scaVerified: true
        },
        profile: {
          name: 'Mega Construction International',
          companyName: 'Mega Construction International',
          legalName: 'Mega Construction International Ltd.',
          phone: '+966125678901',
          website: 'https://www.megaconstruction.com',
          companyDescription: 'Leading construction company with 10+ years of experience in mega infrastructure projects. Specialized in airports, ports, and transportation infrastructure.',
          location: {
            headquarters: {
              address: 'King Fahd Road, Al Olaya, Tower 200',
              city: 'Riyadh',
              region: 'Riyadh Province',
              country: 'Saudi Arabia'
            }
          },
          hqAddress: 'King Fahd Road, Al Olaya, Tower 200',
          hqCity: 'Riyadh',
          hqRegion: 'Riyadh Province',
          hqCountry: 'Saudi Arabia',
          branches: [
            {
              id: 'branch_1',
              name: 'Jeddah Branch',
              address: 'Corniche Road, Al Hamra',
              city: 'Jeddah',
              region: 'Makkah Province',
              country: 'Saudi Arabia',
              phone: '+966126789012'
            },
            {
              id: 'branch_2',
              name: 'Dammam Branch',
              address: 'King Faisal Road',
              city: 'Dammam',
              region: 'Eastern Province',
              country: 'Saudi Arabia',
              phone: '+966127890123'
            }
          ],
          commercialRegistration: {
            number: 'CR-9988776655',
            verified: true,
            issueDate: '2015-03-10',
            expiryDate: '2025-03-10'
          },
          vatNumber: {
            number: 'VAT-998877665544332',
            verified: true
          },
          services: ['General Contracting', 'Infrastructure Development', 'Project Management', 'Design-Build', 'Airport Construction'],
          serviceDescriptions: {
            'General Contracting': 'Full-service general contracting for large-scale projects',
            'Infrastructure Development': 'Airports, ports, highways, and public infrastructure',
            'Project Management': 'Comprehensive project management and consulting services',
            'Design-Build': 'Integrated design and construction services',
            'Airport Construction': 'Specialized airport terminal and runway construction'
          },
          yearsInBusiness: 10,
          employeeCount: '500-1000',
          annualRevenueRange: '100M-500M',
          maxProjectValue: 500000000,
          concurrentProjects: 10,
          keyProjects: [
            {
              id: 'project_1',
              title: 'King Khalid International Airport Terminal 5',
              description: 'Design and construction of new terminal building',
              completionDate: '2023-11-20',
              value: 250000000
            },
            {
              id: 'project_2',
              title: 'Riyadh-Dammam High-Speed Rail Stations',
              description: 'Construction of 3 high-speed rail stations',
              completionDate: '2022-08-10',
              value: 180000000
            },
            {
              id: 'project_3',
              title: 'Jeddah Port Expansion',
              description: 'Port infrastructure expansion project',
              completionDate: '2024-01-15',
              value: 320000000
            }
          ],
          status: 'pending',
          createdAt: null
        },
        documents: {
          cr: [
            {
              name: 'cr_mega.pdf',
              size: 2048000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          vat: [
            {
              name: 'vat_mega.pdf',
              size: 1536000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          companyProfile: [
            {
              name: 'mega_company_profile.pdf',
              size: 5120000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ],
          scaLicense: [
            {
              name: 'sca_license_mega.pdf',
              size: 1024000,
              type: 'application/pdf',
              uploadedAt: null
            }
          ]
        },
        documentVerifications: {
          cr: {
            documentType: 'cr',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: null,
            notes: 'CR verified and valid until 2025-03-10'
          },
          vat: {
            documentType: 'vat',
            verified: true,
            verifiedBy: 'system',
            verifiedByName: 'System Admin',
            verifiedAt: null,
            notes: 'VAT certificate verified'
          }
        },
        review: {
          submittedAt: null,
          reviewedAt: null,
          reviewedBy: 'system',
          status: 'pending',
          reviewNotes: 'Documents verified. Company profile comprehensive. Awaiting final approval.'
        },
        vettingComments: [
          {
            id: 'comment_1',
            comment: 'Commercial Registration verified. Company is in good standing with SCA.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: null
          },
          {
            id: 'comment_2',
            comment: 'VAT certificate confirmed. Financial documents in order.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: null
          },
          {
            id: 'comment_3',
            comment: 'Impressive portfolio of mega projects. Company has strong track record.',
            addedBy: 'system',
            addedByName: 'System Admin',
            addedAt: null
          }
        ]
      }
    ];

    // Create all test users
    testUsers.forEach(userData => {
      const exists = users.some(u => u.email === userData.email);
      if (!exists) {
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - userData.daysAgo);
        const submittedAt = new Date(createdAt.getTime() + (userData.daysAgo > 1 ? 1 * 24 * 60 * 60 * 1000 : 0));
        const reviewedAt = userData.onboardingStage === 'under_review' ? new Date(submittedAt.getTime() + 1 * 24 * 60 * 60 * 1000) : null;
        
        // Set dates in profile
        if (userData.profile) {
          userData.profile.createdAt = createdAt.toISOString();
        }
        
        // Set dates in documents
        Object.keys(userData.documents || {}).forEach(docType => {
          userData.documents[docType].forEach(doc => {
            doc.uploadedAt = createdAt.toISOString();
          });
        });
        
        // Set dates in review
        if (userData.review) {
          userData.review.submittedAt = submittedAt.toISOString();
          if (reviewedAt) {
            userData.review.reviewedAt = reviewedAt.toISOString();
          }
        }
        
        // Set dates in vetting comments
        if (userData.vettingComments) {
          userData.vettingComments.forEach(comment => {
            if (!comment.addedAt) {
              comment.addedAt = reviewedAt ? reviewedAt.toISOString() : submittedAt.toISOString();
            }
          });
        }
        
        // Set dates in document verifications
        if (userData.documentVerifications) {
          Object.keys(userData.documentVerifications).forEach(docType => {
            const verification = userData.documentVerifications[docType];
            if (verification.verifiedAt === null) {
              verification.verifiedAt = reviewedAt ? reviewedAt.toISOString() : submittedAt.toISOString();
            }
          });
        }
        
        // Set identity verification dates
        if (userData.identity) {
          if (userData.identity.nationalIdVerifiedAt === null && userData.identity.nationalIdVerified) {
            userData.identity.nationalIdVerifiedAt = reviewedAt ? reviewedAt.toISOString() : submittedAt.toISOString();
          }
          if (userData.identity.crVerifiedAt === null && userData.identity.crVerified) {
            userData.identity.crVerifiedAt = reviewedAt ? reviewedAt.toISOString() : submittedAt.toISOString();
          }
        }
        
        Users.create({
          email: userData.email,
          password: btoa(userData.password),
          role: userData.role,
          userType: userData.userType,
          mobile: userData.mobile,
          onboardingStage: userData.onboardingStage,
          emailVerified: userData.emailVerified,
          mobileVerified: userData.mobileVerified,
          identity: userData.identity,
          profile: userData.profile,
          documents: userData.documents,
          documentVerifications: userData.documentVerifications || {},
          vettingComments: userData.vettingComments || [],
          review: userData.review
        });
        created++;
      }
    });

    if (created > 0) {
      console.log(`✅ Created ${created} test account(s) automatically!`);
      console.log('📋 Login credentials:');
      console.log('   Admin: admin@pmtwin.com / Admin123');
      console.log('   Individual: individual@pmtwin.com / User123');
      console.log('   Entity: entity@pmtwin.com / Entity123');
      console.log('');
      console.log('📋 New Registration Test Accounts (for Vetting):');
      console.log('   Individual - Registered: new.individual@pmtwin.com / Pending123');
      console.log('   Individual - Profile In Progress: profile.individual@pmtwin.com / Pending123');
      console.log('   Consultant - Under Review: review.consultant@pmtwin.com / Pending123');
      console.log('   Company - Registered: new.company@pmtwin.com / Pending123');
      console.log('   Company - Profile In Progress: profile.company@pmtwin.com / Pending123');
      console.log('   Company - Under Review: review.company@pmtwin.com / Pending123');
    }
  }
  
  // Force create/update test accounts (ensures correct passwords and status)
  async function forceCreateTestAccounts() {
    // Use UserManager if available (centralized user management)
    if (typeof UserManager !== 'undefined' && UserManager.forceReinitializeUsers) {
      console.log('🔧 Force reinitializing all users via UserManager...');
      await UserManager.forceReinitializeUsers();
      console.log('✅ All users reinitialized!');
      return;
    }
    
    // Fallback: Remove existing test accounts and recreate
    const users = Users.getAll();
    const testEmails = ['admin@pmtwin.com', 'individual@pmtwin.com', 'entity@pmtwin.com'];
    const filteredUsers = users.filter(u => !testEmails.includes(u.email));
    set(STORAGE_KEYS.USERS, filteredUsers);
    
    // Now create fresh accounts
    console.log('🔧 Force creating test accounts...');
    autoCreateTestAccounts();
    console.log('✅ Test accounts ready!');
  }

  // Helper: Get base path for data files
  function getDataBasePath() {
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  // Load sample notifications from notification.json file
  async function loadSampleNotifications(forceReload = false) {
    const existingNotifications = Notifications.getAll();
    
    // Only load if no notifications exist, unless forceReload is true
    if (existingNotifications.length > 0 && !forceReload) {
      // Check if notifications have old demo user IDs that need to be remapped
      const hasOldIds = existingNotifications.some(n => 
        n.userId === 'demo_admin_001' || 
        n.userId === 'demo_platform_admin_001' ||
        n.userId === 'demo_individual_001' || 
        n.userId === 'demo_professional_001' ||
        n.userId === 'demo_entity_001' ||
        n.userId === 'demo_project_lead_001'
      );
      if (!hasOldIds) {
        return; // Notifications already loaded with correct IDs
      }
      // Clear old notifications with wrong IDs
      console.log('🔄 Found notifications with old user IDs, reloading...');
      set(STORAGE_KEYS.NOTIFICATIONS, []);
    }
    
    // Wait a bit for users to be created first
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/notification.json');
      if (!response.ok) {
        console.warn('⚠️ Could not load notification.json file');
        return;
      }
      
      const data = await response.json();
      if (data.notifications && Array.isArray(data.notifications)) {
        // Map userIds from JSON to actual user IDs based on email
        const userIdMapping = {
          // New user IDs
          'demo_platform_admin_001': 'admin@pmtwin.com',
          'demo_professional_001': 'professional@pmtwin.com',
          'demo_project_lead_001': 'entity@pmtwin.com',
          'demo_supplier_001': 'supplier@pmtwin.com',
          'demo_service_provider_001': 'service@pmtwin.com',
          'demo_consultant_001': 'consultant@pmtwin.com',
          'demo_mentor_001': 'mentor@pmtwin.com',
          'demo_auditor_001': 'auditor@pmtwin.com',
          // Legacy user IDs (for backward compatibility)
          'demo_admin_001': 'admin@pmtwin.com',
          'demo_individual_001': 'professional@pmtwin.com',
          'demo_entity_001': 'entity@pmtwin.com'
        };
        
        // Get users - retry if not found yet
        let users = Users.getAll();
        let retries = 0;
        while (users.length === 0 && retries < 5) {
          await new Promise(resolve => setTimeout(resolve, 200));
          users = Users.getAll();
          retries++;
        }
        
        if (users.length === 0) {
          console.warn('⚠️ No users found, skipping notification loading');
          return;
        }
        
        const mappedNotifications = data.notifications.map(notif => {
          // Find the actual user ID by email
          const email = userIdMapping[notif.userId];
          if (email) {
            const user = users.find(u => u.email === email);
            if (user) {
              return {
                ...notif,
                userId: user.id
              };
            } else {
              console.warn(`⚠️ User not found for email: ${email}, skipping notification ${notif.id}`);
              return null;
            }
          }
          // If mapping not found, skip this notification
          console.warn(`⚠️ No mapping found for userId: ${notif.userId}, skipping notification ${notif.id}`);
          return null;
        }).filter(notif => notif !== null); // Remove null entries
        
        if (mappedNotifications.length > 0) {
          // Store all notifications
          set(STORAGE_KEYS.NOTIFICATIONS, mappedNotifications);
          console.log(`✅ Loaded ${mappedNotifications.length} sample notifications from notification.json`);
        } else {
          console.warn('⚠️ No notifications could be mapped to existing users');
        }
      }
    } catch (error) {
      console.warn('⚠️ Error loading sample notifications:', error);
      // Silently fail - notifications are optional
    }
  }

  // Generic get function
  function get(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return [];
    }
  }

  // Generic set function
  function set(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Error writing to localStorage:', e);
      return false;
    }
  }

  // Generate unique ID
  function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // Users CRUD
  // ============================================
  const Users = {
    getAll() {
      return get(STORAGE_KEYS.USERS);
    },

    getById(id) {
      const users = this.getAll();
      return users.find(u => u.id === id) || null;
    },

    getByEmail(email) {
      const users = this.getAll();
      return users.find(u => u.email === email) || null;
    },

    create(userData) {
      const users = this.getAll();
      
      // Determine userType if not provided (map from role, but allow explicit userType override)
      const userType = userData.userType || (userData.role ? mapRoleToUserType(userData.role, userData.userType) : 'consultant');
      
      // Determine initial onboarding stage
      const onboardingStage = userData.onboardingStage || getInitialOnboardingStage(userType);
      
      // Set defaults for new onboarding fields
      const onboardingDefaults = {
        userType: userType,
        onboardingStage: onboardingStage,
        emailVerified: userData.emailVerified !== undefined ? userData.emailVerified : false,
        mobileVerified: userData.mobileVerified !== undefined ? userData.mobileVerified : false,
        mobile: userData.mobile || null,
        emailOTP: null,
        mobileOTP: null,
        otpCode: null, // Legacy field for backward compatibility
        otpExpiresAt: null,
        verificationRejectionReason: null,
        deviceFingerprint: userData.deviceFingerprint || null,
        // Identity & Compliance fields
        identity: userData.identity || {},
        // Profile sections completion tracking
        profileSections: userData.profileSections || {},
        // Documents storage
        documents: userData.documents || [],
        // Review metadata
        review: userData.review || {
          submittedAt: null,
          reviewedAt: null,
          reviewedBy: null,
          status: 'pending',
          rejectionReason: null,
          reviewNotes: null
        },
        // Calculate initial progress
        onboardingProgress: userData.onboardingProgress || calculateOnboardingProgress(userType, onboardingStage)
      };

      const user = {
        id: generateId('user'),
        ...userData,
        ...onboardingDefaults,
        createdAt: new Date().toISOString()
      };

      // Calculate profile completion score
      const scoreData = calculateProfileCompletionScore(user);
      user.profileCompletionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
      
      users.push(user);
      if (set(STORAGE_KEYS.USERS, users)) {
        this.createAuditLog('user_registration', user.id, {
          description: `User registered: ${user.email}`,
          role: user.role,
          userType: user.userType,
          onboardingStage: user.onboardingStage
        });
        return user;
      }
      return null;
    },

    update(id, updates) {
      const users = this.getAll();
      const index = users.findIndex(u => u.id === id);
      if (index === -1) return null;

      const oldUser = { ...users[index] };
      users[index] = {
        ...users[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Recalculate profile completion score if relevant fields changed
      const relevantFields = ['profileSections', 'identity', 'documents', 'profile'];
      const shouldRecalculate = Object.keys(updates).some(key => 
        relevantFields.includes(key) || key.startsWith('profile')
      );

      if (shouldRecalculate) {
        const scoreData = calculateProfileCompletionScore(users[index]);
        users[index].profileCompletionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
        // Also update onboarding progress if user object is available
        if (users[index].onboardingStage) {
          users[index].onboardingProgress = calculateOnboardingProgress(
            users[index].userType || mapRoleToUserType(users[index].role),
            users[index].onboardingStage,
            users[index]
          );
        }
      }

      if (set(STORAGE_KEYS.USERS, users)) {
        // Only create audit log if not skipping (during initialization)
        if (!skipAuditLogs) {
          this.createAuditLog('profile_update', id, {
            description: `User profile updated: ${users[index].email}`,
            changes: { before: oldUser, after: users[index] }
          });
        }
        return users[index];
      }
      return null;
    },

    delete(id) {
      const users = this.getAll();
      const filtered = users.filter(u => u.id !== id);
      return set(STORAGE_KEYS.USERS, filtered);
    },

    getByRole(role) {
      const users = this.getAll();
      return users.filter(u => u.role === role);
    },

    getByStatus(status) {
      const users = this.getAll();
      return users.filter(u => u.profile?.status === status);
    },

    createAuditLog(action, entityId, details) {
      // Skip audit logs during initialization to prevent localStorage quota issues
      if (skipAuditLogs) {
        return; // Skip if flag is set
      }
      
      // Check if we're in initialization phase (no current user or system user)
      const currentUser = Sessions.getCurrentUser();
      if (!currentUser || currentUser.id === 'system' || currentUser.email === 'system') {
        return; // Skip audit logs during initialization
      }
      
      // Use Audit.create() which already handles log limiting (keeps only last 1000)
      try {
        Audit.create({
          userId: currentUser.id,
          userRole: currentUser.role,
          userEmail: currentUser.email,
          userName: currentUser.profile?.name || 'Unknown',
          action: action,
          actionCategory: 'user',
          entityType: 'user',
          entityId: entityId,
          description: details.description,
          changes: details.changes || null,
          context: {
            portal: 'user_portal',
            ipAddress: null,
            userAgent: navigator.userAgent
          },
          metadata: details.metadata || {}
        });
      } catch (e) {
        // Silently fail if localStorage quota is exceeded
        console.warn('Could not create audit log (storage quota may be exceeded):', e.message);
      }
    },

    // ============================================
    // Verification Workflow Functions
    // ============================================
    
    /**
     * Verify entity (Commercial Registration and SCA classifications)
     * @param {string} userId - User ID
     * @param {string} reviewerId - Admin reviewer ID
     * @param {object} verificationData - Verification data
     * @returns {object|null} Updated user or null
     */
    verifyEntity(userId, reviewerId, verificationData) {
      const user = this.getById(userId);
      if (!user || user.userType !== 'company') {
        return null;
      }

      const updates = {
        identity: {
          ...user.identity,
          crNumber: verificationData.crNumber || user.identity.crNumber,
          crVerified: verificationData.crVerified || false,
          crVerifiedAt: verificationData.crVerified ? new Date().toISOString() : null,
          crVerifiedBy: verificationData.crVerified ? reviewerId : null,
          scaClassifications: verificationData.scaClassifications || user.identity.scaClassifications || [],
          scaVerified: verificationData.scaVerified || false,
          scaVerifiedAt: verificationData.scaVerified ? new Date().toISOString() : null,
          scaVerifiedBy: verificationData.scaVerified ? reviewerId : null
        }
      };

      // Update document verification status
      if (verificationData.crVerified && Array.isArray(user.documents)) {
        const crDoc = user.documents.find(doc => doc.type === 'cr');
        if (crDoc) {
          crDoc.verified = true;
          crDoc.verifiedAt = new Date().toISOString();
          crDoc.verifiedBy = reviewerId;
        }
      }

      const updated = this.update(userId, updates);
      
      // Recalculate profile score after verification
      if (updated) {
        const scoreData = calculateProfileCompletionScore(updated);
        updated.profileCompletionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
        this.update(userId, { profileCompletionScore: updated.profileCompletionScore });
      }

      this.createAuditLog('entity_verification', userId, {
        description: `Entity verification ${verificationData.crVerified ? 'approved' : 'updated'}: ${user.email}`,
        reviewerId: reviewerId,
        verificationData: verificationData
      });

      return updated;
    },

    /**
     * Verify individual (National ID and professional certifications)
     * @param {string} userId - User ID
     * @param {string} reviewerId - Admin reviewer ID
     * @param {object} verificationData - Verification data
     * @returns {object|null} Updated user or null
     */
    verifyIndividual(userId, reviewerId, verificationData) {
      const user = this.getById(userId);
      if (!user || (user.userType !== 'individual' && user.userType !== 'consultant')) {
        return null;
      }

      const updates = {
        identity: {
          ...user.identity,
          nationalId: verificationData.nationalId || user.identity.nationalId,
          nationalIdVerified: verificationData.nationalIdVerified || false,
          nationalIdVerifiedAt: verificationData.nationalIdVerified ? new Date().toISOString() : null,
          nationalIdVerifiedBy: verificationData.nationalIdVerified ? reviewerId : null,
          passportNumber: verificationData.passportNumber || user.identity.passportNumber,
          passportVerified: verificationData.passportVerified || false,
          professionalCertifications: verificationData.professionalCertifications || user.identity.professionalCertifications || []
        }
      };

      // Update document verification status
      if (verificationData.nationalIdVerified && Array.isArray(user.documents)) {
        const idDoc = user.documents.find(doc => doc.type === 'national_id' || doc.type === 'passport');
        if (idDoc) {
          idDoc.verified = true;
          idDoc.verifiedAt = new Date().toISOString();
          idDoc.verifiedBy = reviewerId;
        }
      }

      // Update certification documents
      if (verificationData.certifications && Array.isArray(user.documents)) {
        verificationData.certifications.forEach(cert => {
          const certDoc = user.documents.find(doc => doc.type === 'certification' && doc.fileName === cert.fileName);
          if (certDoc) {
            certDoc.verified = cert.verified || false;
            certDoc.verifiedAt = cert.verified ? new Date().toISOString() : null;
            certDoc.verifiedBy = cert.verified ? reviewerId : null;
          }
        });
      }

      const updated = this.update(userId, updates);
      
      // Recalculate profile score after verification
      if (updated) {
        const scoreData = calculateProfileCompletionScore(updated);
        updated.profileCompletionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
        this.update(userId, { profileCompletionScore: updated.profileCompletionScore });
      }

      this.createAuditLog('individual_verification', userId, {
        description: `Individual verification ${verificationData.nationalIdVerified ? 'approved' : 'updated'}: ${user.email}`,
        reviewerId: reviewerId,
        verificationData: verificationData
      });

      return updated;
    },

    /**
     * Approve user profile
     * @param {string} userId - User ID
     * @param {string} reviewerId - Admin reviewer ID
     * @param {string} notes - Optional review notes
     * @returns {object|null} Updated user or null
     */
    approveUser(userId, reviewerId, notes = null) {
      const user = this.getById(userId);
      if (!user) return null;

      const updates = {
        onboardingStage: 'approved',
        review: {
          ...user.review,
          status: 'approved',
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewerId,
          reviewNotes: notes || user.review.reviewNotes || null
        }
      };

      const updated = this.update(userId, updates);

      this.createAuditLog('user_approved', userId, {
        description: `User profile approved: ${user.email}`,
        reviewerId: reviewerId,
        notes: notes
      });

      // Create notification
      Notifications.create({
        userId: userId,
        type: 'profile_approved',
        title: 'Profile Approved',
        message: 'Your profile has been approved and is now active.',
        read: false
      });

      return updated;
    },

    /**
     * Reject user profile
     * @param {string} userId - User ID
     * @param {string} reviewerId - Admin reviewer ID
     * @param {string} reason - Rejection reason
     * @param {string} notes - Optional review notes
     * @returns {object|null} Updated user or null
     */
    rejectUser(userId, reviewerId, reason, notes = null) {
      const user = this.getById(userId);
      if (!user) return null;

      const updates = {
        onboardingStage: 'rejected',
        review: {
          ...user.review,
          status: 'rejected',
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewerId,
          rejectionReason: reason,
          reviewNotes: notes || user.review.reviewNotes || null
        }
      };

      const updated = this.update(userId, updates);

      this.createAuditLog('user_rejected', userId, {
        description: `User profile rejected: ${user.email}`,
        reviewerId: reviewerId,
        reason: reason,
        notes: notes
      });

      // Create notification
      Notifications.create({
        userId: userId,
        type: 'profile_rejected',
        title: 'Profile Rejected',
        message: `Your profile was rejected: ${reason}`,
        read: false
      });

      return updated;
    },

    /**
     * Request clarification from user
     * @param {string} userId - User ID
     * @param {string} reviewerId - Admin reviewer ID
     * @param {array} questions - Array of clarification questions
     * @returns {object|null} Updated user or null
     */
    requestClarification(userId, reviewerId, questions) {
      const user = this.getById(userId);
      if (!user) return null;

      const updates = {
        onboardingStage: 'clarification_requested',
        review: {
          ...user.review,
          status: 'clarification_requested',
          reviewedAt: new Date().toISOString(),
          reviewedBy: reviewerId,
          clarificationQuestions: questions,
          reviewNotes: `Clarification requested: ${questions.join(', ')}`
        }
      };

      const updated = this.update(userId, updates);

      this.createAuditLog('clarification_requested', userId, {
        description: `Clarification requested for user: ${user.email}`,
        reviewerId: reviewerId,
        questions: questions
      });

      // Create notification
      Notifications.create({
        userId: userId,
        type: 'clarification_requested',
        title: 'Clarification Requested',
        message: `Please provide additional information: ${questions.join(', ')}`,
        read: false
      });

      return updated;
    }
  };

  // ============================================
  // Sessions CRUD
  // ============================================
  const Sessions = {
    getAll() {
      return get(STORAGE_KEYS.SESSIONS);
    },

    getCurrentSession() {
      const sessions = this.getAll();
      const now = new Date().toISOString();
      return sessions.find(s => s.expiresAt > now) || null;
    },

    getCurrentUser() {
      const session = this.getCurrentSession();
      if (!session) return null;
      return Users.getById(session.userId);
    },

    create(userId, role, userType = null, onboardingStage = null) {
      const sessions = this.getAll();
      // Remove expired sessions
      const now = new Date().toISOString();
      const active = sessions.filter(s => s.expiresAt > now);

      // Get user data if not provided
      const user = Users.getById(userId);
      const finalUserType = userType || (user ? user.userType : mapRoleToUserType(role));
      const finalOnboardingStage = onboardingStage || (user ? user.onboardingStage : null);

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hour expiry

      const session = {
        userId: userId,
        token: generateId('token'),
        role: role, // Keep for backward compatibility
        userType: finalUserType,
        onboardingStage: finalOnboardingStage,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      active.push(session);
      set(STORAGE_KEYS.SESSIONS, active);
      return session;
    },

    delete(token) {
      const sessions = this.getAll();
      const filtered = sessions.filter(s => s.token !== token);
      return set(STORAGE_KEYS.SESSIONS, filtered);
    },

    deleteAll() {
      return set(STORAGE_KEYS.SESSIONS, []);
    },

    cleanup() {
      const sessions = this.getAll();
      const now = new Date().toISOString();
      const active = sessions.filter(s => s.expiresAt > now);
      return set(STORAGE_KEYS.SESSIONS, active);
    }
  };

  // ============================================
  // Load Sample Projects
  // ============================================
  async function loadSampleProjects(forceReload = false) {
    const existingProjects = Projects.getAll();
    
    // Only load if no projects exist, unless forceReload is true
    if (existingProjects.length > 0 && !forceReload) {
      return;
    }

    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/sample-projects.json');
      if (!response.ok) {
        console.warn('Could not load sample projects:', response.status);
        return;
      }
      
      const data = await response.json();
      const sampleProjects = data.projects || [];
      
      if (forceReload) {
        // Clear existing projects
        set(STORAGE_KEYS.PROJECTS, []);
      }
      
      let loaded = 0;
      sampleProjects.forEach(projectData => {
        // Check if project already exists
        const existing = Projects.getById(projectData.id);
        if (!existing) {
          const project = Projects.create(projectData);
          if (project) {
            loaded++;
          }
        }
      });
      
      if (loaded > 0) {
        console.log(`✅ Loaded ${loaded} sample projects`);
      }
    } catch (error) {
      console.error('Error loading sample projects:', error);
    }
  }

  // ============================================
  // Company Skills Helper
  // ============================================
  function getCompanySkills(companyId) {
    // Users represent companies, so get user skills
    const user = Users.getById(companyId);
    if (!user) return [];
    
    // Return skills from user profile
    return user.profile?.skills || [];
  }

  // ============================================
  // Projects CRUD
  // ============================================
  const Projects = {
    getAll() {
      return get(STORAGE_KEYS.PROJECTS);
    },

    getById(id) {
      const projects = this.getAll();
      return projects.find(p => p.id === id) || null;
    },

    getByCreator(creatorId) {
      const projects = this.getAll();
      return projects.filter(p => p.creatorId === creatorId);
    },

    getByOwnerCompany(ownerCompanyId) {
      const projects = this.getAll();
      return projects.filter(p => p.ownerCompanyId === ownerCompanyId);
    },

    getByStatus(status) {
      const projects = this.getAll();
      return projects.filter(p => p.status === status);
    },

    getActive() {
      return this.getByStatus('active');
    },

    create(projectData) {
      const projects = this.getAll();
      const project = {
        id: generateId('project'),
        ...projectData,
        status: projectData.status || 'draft',
        views: 0,
        matchesGenerated: 0,
        proposalsReceived: 0,
        proposalsApproved: 0,
        // Set ownerCompanyId from creatorId if not provided (users represent companies)
        ownerCompanyId: projectData.ownerCompanyId || projectData.creatorId,
        createdAt: new Date().toISOString()
      };
      projects.push(project);
      if (set(STORAGE_KEYS.PROJECTS, projects)) {
        this.createAuditLog('project_creation', project.id, {
          description: `Project created: ${project.title}`,
          creatorId: project.creatorId
        });
        return project;
      }
      return null;
    },

    update(id, updates) {
      const projects = this.getAll();
      const index = projects.findIndex(p => p.id === id);
      if (index === -1) return null;

      const oldProject = { ...projects[index] };
      projects[index] = {
        ...projects[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (set(STORAGE_KEYS.PROJECTS, projects)) {
        if (updates.status === 'active' && oldProject.status === 'draft') {
          projects[index].publishedAt = new Date().toISOString();
          set(STORAGE_KEYS.PROJECTS, projects);
        }
        this.createAuditLog('project_update', id, {
          description: `Project updated: ${projects[index].title}`,
          changes: { before: oldProject, after: projects[index] }
        });
        return projects[index];
      }
      return null;
    },

    delete(id) {
      const projects = this.getAll();
      const filtered = projects.filter(p => p.id !== id);
      return set(STORAGE_KEYS.PROJECTS, filtered);
    },

    incrementViews(id) {
      const project = this.getById(id);
      if (project) {
        project.views = (project.views || 0) + 1;
        return this.update(id, { views: project.views });
      }
      return null;
    },

    createAuditLog(action, entityId, details) {
      const auditLogs = Audit.getAll();
      const currentUser = Sessions.getCurrentUser();
      auditLogs.push({
        id: generateId('audit'),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userRole: currentUser?.role || 'system',
        userEmail: currentUser?.email || 'system',
        userName: currentUser?.profile?.name || 'System',
        action: action,
        actionCategory: 'project',
        entityType: 'project',
        entityId: entityId,
        description: details.description,
        changes: details.changes || null,
        context: {
          portal: 'user_portal',
          projectId: entityId,
          creatorId: details.creatorId
        },
        metadata: {}
      });
      set(STORAGE_KEYS.AUDIT, auditLogs);
    }
  };

  // ============================================
  // Load Sample Projects
  // ============================================
  async function loadSampleProjects(forceReload = false) {
    const existingProjects = Projects.getAll();
    
    // Only load if no projects exist, unless forceReload is true
    if (existingProjects.length > 0 && !forceReload) {
      return;
    }

    try {
      const basePath = getDataBasePath();
      const response = await fetch(basePath + 'data/sample-projects.json');
      if (!response.ok) {
        console.warn('Could not load sample projects:', response.status);
        return;
      }
      
      const data = await response.json();
      const sampleProjects = data.projects || [];
      
      if (forceReload) {
        // Clear existing projects
        set(STORAGE_KEYS.PROJECTS, []);
      }
      
      let loaded = 0;
      sampleProjects.forEach(projectData => {
        // Check if project already exists
        const existing = Projects.getById(projectData.id);
        if (!existing) {
          const project = Projects.create(projectData);
          if (project) {
            loaded++;
          }
        }
      });
      
      if (loaded > 0) {
        console.log(`✅ Loaded ${loaded} sample projects`);
      }
    } catch (error) {
      console.error('Error loading sample projects:', error);
    }
  }

  // ============================================
  // Proposals CRUD
  // ============================================
  const Proposals = {
    getAll() {
      return get(STORAGE_KEYS.PROPOSALS);
    },

    getById(id) {
      const proposals = this.getAll();
      return proposals.find(p => p.id === id) || null;
    },

    getByProject(projectId) {
      const proposals = this.getAll();
      return proposals.filter(p => p.projectId === projectId);
    },

    getByProvider(providerId) {
      const proposals = this.getAll();
      return proposals.filter(p => p.providerId === providerId || p.bidderCompanyId === providerId);
    },

    getByBidderCompany(bidderCompanyId) {
      const proposals = this.getAll();
      return proposals.filter(p => p.bidderCompanyId === bidderCompanyId);
    },

    getByOwnerCompany(ownerCompanyId) {
      const proposals = this.getAll();
      return proposals.filter(p => p.ownerCompanyId === ownerCompanyId);
    },

    getByStatus(status) {
      const proposals = this.getAll();
      return proposals.filter(p => p.status === status);
    },

    create(proposalData) {
      const proposals = this.getAll();
      
      // Determine ownerCompanyId from target opportunity
      let ownerCompanyId = proposalData.ownerCompanyId;
      if (!ownerCompanyId && proposalData.targetId) {
        if (proposalData.targetType === 'PROJECT' || proposalData.targetType === 'MEGA_PROJECT') {
          const project = Projects.getById(proposalData.targetId);
          ownerCompanyId = project?.ownerCompanyId || project?.creatorId;
        } else if (proposalData.targetType === 'SERVICE_REQUEST') {
          const serviceRequest = ServiceRequests.getById(proposalData.targetId);
          ownerCompanyId = serviceRequest?.ownerCompanyId || serviceRequest?.requesterId;
        }
      }
      
      // Fallback: use projectId for backward compatibility
      if (!ownerCompanyId && proposalData.projectId) {
        const project = Projects.getById(proposalData.projectId);
        ownerCompanyId = project?.ownerCompanyId || project?.creatorId;
      }
      
      const proposal = {
        id: generateId('proposal'),
        ...proposalData,
        serviceOfferingId: proposalData.serviceOfferingId || null, // Link to service offering
        // New fields for role-aware proposals
        proposalType: proposalData.proposalType || (proposalData.projectId ? 'PROJECT_BID' : 'SERVICE_OFFER'),
        targetType: proposalData.targetType || (proposalData.projectId ? 'PROJECT' : 'SERVICE_REQUEST'),
        targetId: proposalData.targetId || proposalData.projectId,
        bidderCompanyId: proposalData.bidderCompanyId || proposalData.providerId,
        ownerCompanyId: ownerCompanyId,
        // Status: DRAFT | SUBMITTED | UNDER_REVIEW | SHORTLISTED | NEGOTIATION | AWARDED | REJECTED | WITHDRAWN
        status: proposalData.status || 'SUBMITTED',
        submittedAt: proposalData.status === 'DRAFT' ? null : (proposalData.submittedAt || new Date().toISOString())
      };
      
      // Validate: bidderCompanyId must not equal ownerCompanyId
      if (proposal.bidderCompanyId === proposal.ownerCompanyId) {
        console.error('Cannot create proposal: bidderCompanyId cannot equal ownerCompanyId');
        return null;
      }
      
      proposals.push(proposal);
      if (set(STORAGE_KEYS.PROPOSALS, proposals)) {
        // Update project proposal count (backward compatibility)
        if (proposal.projectId || proposal.targetType === 'PROJECT' || proposal.targetType === 'MEGA_PROJECT') {
          const projectId = proposal.projectId || proposal.targetId;
          const project = Projects.getById(projectId);
          if (project) {
            project.proposalsReceived = (project.proposalsReceived || 0) + 1;
            Projects.update(projectId, { proposalsReceived: project.proposalsReceived });
          }
        }
        this.createAuditLog('proposal_submission', proposal.id, {
          description: `Proposal submitted: ${proposal.proposalType} for ${proposal.targetType}`,
          projectId: proposal.projectId || proposal.targetId,
          providerId: proposal.providerId || proposal.bidderCompanyId,
          type: proposal.type || proposal.proposalType
        });
        return proposal;
      }
      return null;
    },

    update(id, updates) {
      const proposals = this.getAll();
      const index = proposals.findIndex(p => p.id === id);
      if (index === -1) return null;

      const oldProposal = { ...proposals[index] };
      proposals[index] = {
        ...proposals[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'approved' && oldProposal.status !== 'approved') {
        proposals[index].approvedAt = new Date().toISOString();
      }
      if (updates.status === 'rejected' && oldProposal.status !== 'rejected') {
        proposals[index].rejectedAt = new Date().toISOString();
      }
      if (updates.status === 'completed' && oldProposal.status !== 'completed') {
        proposals[index].completedAt = new Date().toISOString();
      }

      if (set(STORAGE_KEYS.PROPOSALS, proposals)) {
        this.createAuditLog('proposal_status_change', id, {
          description: `Proposal status changed: ${oldProposal.status} → ${updates.status}`,
          changes: { before: oldProposal, after: proposals[index] }
        });
        return proposals[index];
      }
      return null;
    },

    delete(id) {
      const proposals = this.getAll();
      const filtered = proposals.filter(p => p.id !== id);
      return set(STORAGE_KEYS.PROPOSALS, filtered);
    },

    createAuditLog(action, entityId, details) {
      const auditLogs = Audit.getAll();
      const currentUser = Sessions.getCurrentUser();
      auditLogs.push({
        id: generateId('audit'),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userRole: currentUser?.role || 'system',
        userEmail: currentUser?.email || 'system',
        userName: currentUser?.profile?.name || 'System',
        action: action,
        actionCategory: 'proposal',
        entityType: 'proposal',
        entityId: entityId,
        description: details.description,
        changes: details.changes || null,
        context: {
          portal: 'user_portal',
          projectId: details.projectId,
          providerId: details.providerId
        },
        metadata: {
          proposalType: details.type
        }
      });
      set(STORAGE_KEYS.AUDIT, auditLogs);
    }
  };

  // ============================================
  // Load Sample Proposals
  // ============================================
  function loadSampleProposals(forceReload = false) {
    const existingProposals = Proposals.getAll();
    
    // Only load if no proposals exist, unless forceReload is true
    if (existingProposals.length > 0 && !forceReload) {
      return;
    }

    // Get test users and projects
    const users = Users.getAll();
    const projects = Projects.getAll();
    
    if (projects.length === 0) {
      console.warn('No projects found for proposals. Please load sample projects first.');
      return;
    }

    const testProviders = users.filter(u => ['entity', 'company', 'individual', 'consultant'].includes(u.role));
    if (testProviders.length === 0) {
      console.warn('No test providers found for proposals');
      return;
    }

    // Get project creators
    const projectCreators = users.filter(u => projects.some(p => p.creatorId === u.id));
    
    const sampleProposals = [
      // Proposal 1: In Review
      {
        projectId: projects[0]?.id || 'project-1',
        providerId: testProviders[0]?.id || 'user-1',
        type: 'cash',
        serviceDescription: 'Comprehensive structural engineering services including foundation design, seismic analysis, and shop drawing review. Our team of 3 senior engineers will ensure compliance with Saudi Building Code and international standards.',
        pricing: [
          {
            id: 'item_1',
            item: 'Structural Design Services',
            description: 'Complete structural design and calculations',
            quantity: 1,
            unit: 'project',
            unitPrice: 500000,
            total: 500000
          },
          {
            id: 'item_2',
            item: 'Shop Drawing Review',
            description: 'Review and approval of contractor shop drawings',
            quantity: 1,
            unit: 'project',
            unitPrice: 150000,
            total: 150000
          },
          {
            id: 'item_3',
            item: 'Site Supervision',
            description: 'Monthly site visits and quality control',
            quantity: 12,
            unit: 'months',
            unitPrice: 25000,
            total: 300000
          }
        ],
        subtotal: 950000,
        taxes: {
          vat: 142500,
          other: 0
        },
        total: 1092500,
        currency: 'SAR',
        timeline: {
          startDate: '2024-03-01',
          completionDate: '2024-08-01',
          duration: 5,
          milestones: [
            { name: 'Design Phase Complete', date: '2024-05-01', paymentPercentage: 40 },
            { name: 'Shop Drawing Review Complete', date: '2024-07-01', paymentPercentage: 40 },
            { name: 'Final Handover', date: '2024-08-01', paymentPercentage: 20 }
          ]
        },
        terms: {
          paymentSchedule: 'Milestone-based payments as outlined above',
          deliverables: [
            'Complete structural designs',
            'Shop drawing review reports',
            'Site inspection reports'
          ],
          warranties: '12-month warranty on all designs',
          penalties: '5% penalty for delays exceeding 30 days'
        },
        attachments: [
          {
            fileName: 'technical_proposal.pdf',
            fileSize: 2048000,
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            fileName: 'company_profile.pdf',
            fileSize: 1536000,
            uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        status: 'in_review',
        submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'comment_1',
            comment: 'Thank you for your proposal. We are currently reviewing all submissions and will get back to you within 2 weeks.',
            addedBy: projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_2',
            comment: 'We have extensive experience with similar projects in the GCC region. Please let us know if you need any additional information.',
            addedBy: testProviders[0]?.id || 'user-1',
            addedByName: testProviders[0]?.profile?.name || 'Provider',
            addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      // Proposal 2: Approved
      {
        projectId: projects[0]?.id || 'project-1',
        providerId: testProviders[1]?.id || testProviders[0]?.id || 'user-1',
        type: 'cash',
        serviceDescription: 'Expert MEP design and engineering services with focus on energy efficiency and sustainability. Our team includes LEED-certified engineers with 15+ years of experience.',
        pricing: [
          {
            id: 'item_1',
            item: 'MEP Design Services',
            description: 'Complete MEP design including HVAC, electrical, and plumbing',
            quantity: 1,
            unit: 'project',
            unitPrice: 800000,
            total: 800000
          },
          {
            id: 'item_2',
            item: 'Energy Analysis',
            description: 'Energy modeling and optimization',
            quantity: 1,
            unit: 'project',
            unitPrice: 200000,
            total: 200000
          }
        ],
        subtotal: 1000000,
        taxes: {
          vat: 150000,
          other: 0
        },
        total: 1150000,
        currency: 'SAR',
        timeline: {
          startDate: '2024-03-15',
          completionDate: '2024-09-15',
          duration: 6,
          milestones: [
            { name: 'Design Phase Complete', date: '2024-06-15', paymentPercentage: 50 },
            { name: 'Final Handover', date: '2024-09-15', paymentPercentage: 50 }
          ]
        },
        terms: {
          paymentSchedule: 'Milestone-based payments',
          deliverables: [
            'Complete MEP designs',
            'Energy analysis report',
            'As-built drawings'
          ],
          warranties: '18-month warranty on all designs'
        },
        attachments: [
          {
            fileName: 'mep_proposal.pdf',
            fileSize: 3072000,
            uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        status: 'approved',
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'comment_3',
            comment: 'Excellent proposal with strong technical approach. We appreciate the focus on energy efficiency.',
            addedBy: projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_4',
            comment: 'Thank you! We are excited to work on this project. We will begin preparations immediately.',
            addedBy: testProviders[1]?.id || testProviders[0]?.id || 'user-1',
            addedByName: testProviders[1]?.profile?.name || testProviders[0]?.profile?.name || 'Provider',
            addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_5',
            comment: 'Proposal approved. Contract will be sent for signature within 2 business days.',
            addedBy: projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      // Proposal 3: Rejected
      {
        projectId: projects[0]?.id || 'project-1',
        providerId: testProviders[2]?.id || testProviders[0]?.id || 'user-1',
        type: 'cash',
        serviceDescription: 'General construction services with focus on quality and timely delivery.',
        pricing: [
          {
            id: 'item_1',
            item: 'Construction Services',
            description: 'Full construction services',
            quantity: 1,
            unit: 'project',
            unitPrice: 5000000,
            total: 5000000
          }
        ],
        subtotal: 5000000,
        taxes: {
          vat: 750000,
          other: 0
        },
        total: 5750000,
        currency: 'SAR',
        timeline: {
          startDate: '2024-04-01',
          completionDate: '2025-04-01',
          duration: 12,
          milestones: [
            { name: 'Foundation Complete', date: '2024-07-01', paymentPercentage: 30 },
            { name: 'Structure Complete', date: '2024-12-01', paymentPercentage: 40 },
            { name: 'Final Handover', date: '2025-04-01', paymentPercentage: 30 }
          ]
        },
        terms: {
          paymentSchedule: 'Milestone-based payments',
          deliverables: ['Completed construction project']
        },
        attachments: [
          {
            fileName: 'construction_proposal.pdf',
            fileSize: 4096000,
            uploadedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        status: 'rejected',
        submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        rejectedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        rejectionReason: 'Proposal does not meet the technical requirements specified in the project scope.',
        comments: [
          {
            id: 'comment_6',
            comment: 'Thank you for your interest. However, after careful review, we have decided to proceed with another proposal that better aligns with our technical requirements.',
            addedBy: projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      // Proposal 4: In Review (Different Project)
      {
        projectId: projects[1]?.id || projects[0]?.id || 'project-1',
        providerId: testProviders[0]?.id || 'user-1',
        type: 'barter',
        serviceDescription: 'We offer architectural design services in exchange for construction materials. Our team specializes in sustainable building design.',
        barterOffer: {
          servicesOffered: ['Architectural Design', '3D Visualization', 'Interior Design'],
          servicesNeeded: ['Construction Materials', 'Steel Beams', 'Cement'],
          estimatedValue: 600000,
          currency: 'SAR'
        },
        timeline: {
          startDate: '2024-04-01',
          completionDate: '2024-10-01',
          duration: 6,
          milestones: [
            { name: 'Concept Design Complete', date: '2024-06-01', paymentPercentage: 30 },
            { name: 'Detailed Design Complete', date: '2024-08-01', paymentPercentage: 40 },
            { name: 'Final Deliverables', date: '2024-10-01', paymentPercentage: 30 }
          ]
        },
        terms: {
          paymentSchedule: 'Barter exchange: Materials to be provided at project milestones',
          deliverables: [
            'Complete architectural designs',
            '3D renderings',
            'Construction documents'
          ]
        },
        attachments: [
          {
            fileName: 'barter_proposal.pdf',
            fileSize: 2560000,
            uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        status: 'in_review',
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'comment_7',
            comment: 'Interesting barter proposal. We need to evaluate the materials we can provide. Will get back to you soon.',
            addedBy: projectCreators[1]?.id || projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[1]?.profile?.name || projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      // Proposal 5: Completed
      {
        projectId: projects[1]?.id || projects[0]?.id || 'project-1',
        providerId: testProviders[1]?.id || testProviders[0]?.id || 'user-1',
        type: 'cash',
        serviceDescription: 'Quantity surveying services including bill of quantities, cost estimation, and contract administration.',
        pricing: [
          {
            id: 'item_1',
            item: 'Bill of Quantities',
            description: 'Detailed BOQ preparation',
            quantity: 1,
            unit: 'project',
            unitPrice: 150000,
            total: 150000
          },
          {
            id: 'item_2',
            item: 'Cost Estimation',
            description: 'Detailed cost estimation and analysis',
            quantity: 1,
            unit: 'project',
            unitPrice: 100000,
            total: 100000
          }
        ],
        subtotal: 250000,
        taxes: {
          vat: 37500,
          other: 0
        },
        total: 287500,
        currency: 'SAR',
        timeline: {
          startDate: '2024-01-01',
          completionDate: '2024-02-15',
          duration: 1.5,
          milestones: [
            { name: 'BOQ Complete', date: '2024-01-20', paymentPercentage: 60 },
            { name: 'Final Deliverables', date: '2024-02-15', paymentPercentage: 40 }
          ]
        },
        terms: {
          paymentSchedule: 'Milestone-based payments',
          deliverables: [
            'Complete Bill of Quantities',
            'Cost estimation report',
            'Tender documentation'
          ]
        },
        attachments: [
          {
            fileName: 'qs_proposal.pdf',
            fileSize: 1536000,
            uploadedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        status: 'completed',
        submittedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        approvedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        comments: [
          {
            id: 'comment_8',
            comment: 'Proposal looks good. Approved!',
            addedBy: projectCreators[1]?.id || projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[1]?.profile?.name || projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_9',
            comment: 'Work completed successfully. All deliverables have been submitted. Thank you for the opportunity!',
            addedBy: testProviders[1]?.id || testProviders[0]?.id || 'user-1',
            addedByName: testProviders[1]?.profile?.name || testProviders[0]?.profile?.name || 'Provider',
            addedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'comment_10',
            comment: 'Excellent work! All deliverables received and reviewed. Project marked as completed.',
            addedBy: projectCreators[1]?.id || projectCreators[0]?.id || 'user-1',
            addedByName: projectCreators[1]?.profile?.name || projectCreators[0]?.profile?.name || 'Project Owner',
            addedAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];

    if (forceReload) {
      // Clear existing proposals
      set(STORAGE_KEYS.PROPOSALS, []);
    }

    let loaded = 0;
    sampleProposals.forEach(propData => {
      // Check if proposal already exists (by project and provider combination)
      const existing = Proposals.getAll().find(p => 
        p.projectId === propData.projectId && 
        p.providerId === propData.providerId &&
        p.type === propData.type
      );
      
      if (!existing) {
        const proposal = Proposals.create(propData);
        if (proposal) {
          // Update status and comments if needed (since create sets status to in_review)
          if (propData.status && propData.status !== 'in_review') {
            const updates = { 
              status: propData.status,
              comments: propData.comments || []
            };
            if (propData.approvedAt) updates.approvedAt = propData.approvedAt;
            if (propData.rejectedAt) updates.rejectedAt = propData.rejectedAt;
            if (propData.completedAt) updates.completedAt = propData.completedAt;
            if (propData.rejectionReason) updates.rejectionReason = propData.rejectionReason;
            Proposals.update(proposal.id, updates);
          } else if (propData.comments) {
            Proposals.update(proposal.id, { comments: propData.comments });
          }
          loaded++;
        }
      }
    });

    if (loaded > 0) {
      console.log(`✅ Loaded ${loaded} sample proposals`);
    }
  }

  // ============================================
  // Matches CRUD
  // ============================================
  const Matches = {
    getAll() {
      return get(STORAGE_KEYS.MATCHES);
    },

    getById(id) {
      const matches = this.getAll();
      return matches.find(m => m.id === id) || null;
    },

    getByProject(projectId) {
      const matches = this.getAll();
      return matches.filter(m => m.projectId === projectId);
    },

    getByProvider(providerId) {
      const matches = this.getAll();
      return matches.filter(m => m.providerId === providerId);
    },

    getHighMatches(threshold = 80) {
      const matches = this.getAll();
      return matches.filter(m => m.score >= threshold && !m.notified);
    },

    create(matchData) {
      const matches = this.getAll();
      const match = {
        id: generateId('match'),
        ...matchData,
        notified: false,
        viewed: false,
        proposalSubmitted: false,
        createdAt: new Date().toISOString()
      };
      matches.push(match);
      if (set(STORAGE_KEYS.MATCHES, matches)) {
        // Update project or collaboration opportunity match count
        if (match.opportunityType === 'collaboration' && match.opportunityId) {
          const opportunity = CollaborationOpportunities.getById(match.opportunityId);
          if (opportunity) {
            opportunity.matchesGenerated = (opportunity.matchesGenerated || 0) + 1;
            CollaborationOpportunities.update(match.opportunityId, { matchesGenerated: opportunity.matchesGenerated });
          }
        } else {
          const project = Projects.getById(match.projectId);
          if (project) {
            project.matchesGenerated = (project.matchesGenerated || 0) + 1;
            Projects.update(match.projectId, { matchesGenerated: project.matchesGenerated });
          }
        }
        return match;
      }
      return null;
    },

    update(id, updates) {
      const matches = this.getAll();
      const index = matches.findIndex(m => m.id === id);
      if (index === -1) return null;

      matches[index] = {
        ...matches[index],
        ...updates
      };

      if (updates.notified && !matches[index].notifiedAt) {
        matches[index].notifiedAt = new Date().toISOString();
      }
      if (updates.viewed && !matches[index].viewedAt) {
        matches[index].viewedAt = new Date().toISOString();
      }

      return set(STORAGE_KEYS.MATCHES, matches) ? matches[index] : null;
    },

    delete(id) {
      const matches = this.getAll();
      const filtered = matches.filter(m => m.id !== id);
      return set(STORAGE_KEYS.MATCHES, filtered);
    },

    markAsNotified(id) {
      return this.update(id, { notified: true });
    },

    markAsViewed(id) {
      return this.update(id, { viewed: true });
    }
  };

  // ============================================
  // Audit Trail CRUD
  // ============================================
  const Audit = {
    getAll() {
      return get(STORAGE_KEYS.AUDIT);
    },

    getById(id) {
      const logs = this.getAll();
      return logs.find(l => l.id === id) || null;
    },

    getByUser(userId) {
      const logs = this.getAll();
      return logs.filter(l => l.userId === userId);
    },

    getByAction(action) {
      const logs = this.getAll();
      return logs.filter(l => l.action === action);
    },

    getByEntity(entityType, entityId) {
      const logs = this.getAll();
      return logs.filter(l => l.entityType === entityType && l.entityId === entityId);
    },

    getRecent(limit = 50) {
      const logs = this.getAll();
      return logs
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    },

    create(logData) {
      try {
        const logs = this.getAll();
        const log = {
          id: generateId('audit'),
          ...logData,
          timestamp: new Date().toISOString()
        };
        logs.push(log);
        // Keep only last 500 logs to prevent storage overflow (reduced from 1000)
        const limited = logs.slice(-500);
        const success = set(STORAGE_KEYS.AUDIT, limited);
        if (!success) {
          // If write failed, try with even fewer logs
          const minimal = logs.slice(-250);
          set(STORAGE_KEYS.AUDIT, minimal);
        }
        return success ? log : null;
      } catch (e) {
        // Silently fail if localStorage quota is exceeded
        console.warn('Could not create audit log (storage quota exceeded):', e.message);
        return null;
      }
    }
  };

  // ============================================
  // Notifications CRUD
  // ============================================
  const Notifications = {
    getAll() {
      return get(STORAGE_KEYS.NOTIFICATIONS);
    },

    getByUser(userId) {
      const notifications = this.getAll();
      return notifications
        .filter(n => n.userId === userId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },

    getUnread(userId) {
      const notifications = this.getByUser(userId);
      return notifications.filter(n => !n.read);
    },

    create(notificationData) {
      const notifications = this.getAll();
      const notification = {
        id: generateId('notification'),
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString()
      };
      notifications.push(notification);
      // Keep only last 500 notifications per user
      const userNotifications = notifications.filter(n => n.userId === notification.userId);
      if (userNotifications.length > 500) {
        const toKeep = userNotifications.slice(-500);
        const others = notifications.filter(n => n.userId !== notification.userId);
        set(STORAGE_KEYS.NOTIFICATIONS, [...others, ...toKeep]);
      } else {
        set(STORAGE_KEYS.NOTIFICATIONS, notifications);
      }
      return notification;
    },

    markAsRead(id) {
      const notifications = this.getAll();
      const index = notifications.findIndex(n => n.id === id);
      if (index === -1) return null;

      notifications[index] = {
        ...notifications[index],
        read: true,
        readAt: new Date().toISOString()
      };

      return set(STORAGE_KEYS.NOTIFICATIONS, notifications) ? notifications[index] : null;
    },

    markAllAsRead(userId) {
      const notifications = this.getAll();
      notifications.forEach(n => {
        if (n.userId === userId && !n.read) {
          n.read = true;
          n.readAt = new Date().toISOString();
        }
      });
      return set(STORAGE_KEYS.NOTIFICATIONS, notifications);
    },

    delete(id) {
      const notifications = this.getAll();
      const filtered = notifications.filter(n => n.id !== id);
      return set(STORAGE_KEYS.NOTIFICATIONS, filtered);
    }
  };

  // ============================================
  // Helper Functions
  // ============================================
  function verifyAndCreateAccounts() {
    const users = Users.getAll();
    const adminExists = users.some(u => u.email === 'admin@pmtwin.com');
    const individualExists = users.some(u => u.email === 'individual@pmtwin.com');
    const entityExists = users.some(u => u.email === 'entity@pmtwin.com');
    
    if (!adminExists || !individualExists || !entityExists) {
      autoCreateTestAccounts();
      return true; // Accounts were created
    }
    return false; // All accounts already exist
  }
  
  // Debug function to check account status
  function checkAccounts() {
    const users = Users.getAll();
    const testAccounts = users.filter(u => 
      ['admin@pmtwin.com', 'individual@pmtwin.com', 'entity@pmtwin.com'].includes(u.email)
    );
    
    console.log('📊 Test Accounts Status:');
    testAccounts.forEach(user => {
      const decoded = atob(user.password);
      console.log(`   ${user.email}:`);
      console.log(`     Role: ${user.role}`);
      console.log(`     Status: ${user.profile?.status || 'unknown'}`);
      console.log(`     Password (decoded): ${decoded}`);
      console.log(`     Password (encoded): ${user.password}`);
    });
    
    if (testAccounts.length === 0) {
      console.log('   ⚠️ No test accounts found!');
    }
    
    return testAccounts;
  }

  // ============================================
  // Device Fingerprint Helper
  // ============================================
  function generateDeviceFingerprint() {
    // Simple device fingerprint for POC (not cryptographically secure)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
    
    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      canvas.toDataURL().substring(0, 50)
    ].join('|');
    
    // Simple hash (not secure, for POC only)
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // ============================================
  // Collaboration Opportunities CRUD
  // ============================================
  // ============================================
  // Collaboration Opportunities CRUD
  // ============================================
  const CollaborationOpportunities = {
    getAll() {
      return get(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES);
    },

    getById(id) {
      const opportunities = this.getAll();
      return opportunities.find(o => o.id === id) || null;
    },

    getByCreator(creatorId) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.creatorId === creatorId);
    },

    getByModelType(modelType) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.modelType === modelType);
    },

    getByStatus(status) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.status === status);
    },

    create(opportunityData) {
      const opportunities = this.getAll();
      const opportunity = {
        id: generateId('collab'),
        ...opportunityData,
        status: opportunityData.status || 'draft',
        views: 0,
        matchesGenerated: 0,
        applicationsReceived: 0,
        applicationsApproved: 0,
        createdAt: new Date().toISOString()
      };
      opportunities.push(opportunity);
      if (set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, opportunities)) {
        this.createAuditLog('collaboration_opportunity_creation', opportunity.id, {
          description: `Collaboration opportunity created: ${opportunity.modelName || opportunity.modelType}`,
          creatorId: opportunity.creatorId,
          modelType: opportunity.modelType
        });
        return opportunity;
      }
      return null;
    },

    update(id, updates) {
      const opportunities = this.getAll();
      const index = opportunities.findIndex(o => o.id === id);
      if (index === -1) return null;

      const oldOpportunity = { ...opportunities[index] };
      opportunities[index] = {
        ...opportunities[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, opportunities)) {
        this.createAuditLog('collaboration_opportunity_update', id, {
          description: `Collaboration opportunity updated: ${opportunities[index].modelName || opportunities[index].modelType}`,
          changes: updates
        });
        return opportunities[index];
      }
      return null;
    },

    getByModelType(modelType) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.modelType === modelType);
    },

    getByStatus(status) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.status === status);
    },

    getActive() {
      return this.getByStatus('active');
    },

    getByRelationshipType(relationshipType) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.relationshipType === relationshipType);
    },

    getByModel(modelId) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.modelId === modelId || o.modelType === modelId);
    },

    getByCategory(category) {
      const opportunities = this.getAll();
      return opportunities.filter(o => o.category === category);
    },

    getWithFilters(filters = {}) {
      let opportunities = this.getAll();
      
      if (filters.modelId) {
        opportunities = opportunities.filter(o => o.modelId === filters.modelId || o.modelType === filters.modelId);
      }
      if (filters.category) {
        opportunities = opportunities.filter(o => o.category === filters.category);
      }
      if (filters.status) {
        opportunities = opportunities.filter(o => o.status === filters.status);
      }
      if (filters.creatorId) {
        opportunities = opportunities.filter(o => o.creatorId === filters.creatorId);
      }
      if (filters.dateFrom) {
        opportunities = opportunities.filter(o => new Date(o.createdAt) >= new Date(filters.dateFrom));
      }
      if (filters.dateTo) {
        opportunities = opportunities.filter(o => new Date(o.createdAt) <= new Date(filters.dateTo));
      }
      
      return opportunities;
    },

    getStatistics(modelId = null) {
      const opportunities = modelId ? this.getByModel(modelId) : this.getAll();
      const applications = CollaborationApplications.getAll();
      
      const stats = {
        total: opportunities.length,
        byStatus: {
          draft: 0,
          pending: 0,
          active: 0,
          closed: 0,
          rejected: 0,
          cancelled: 0
        },
        byModel: {},
        totalApplications: 0,
        approvedApplications: 0,
        totalValue: 0,
        averageValue: 0
      };
      
      opportunities.forEach(opp => {
        // Count by status
        stats.byStatus[opp.status] = (stats.byStatus[opp.status] || 0) + 1;
        
        // Count by model
        const model = opp.modelId || opp.modelType || 'unknown';
        stats.byModel[model] = (stats.byModel[model] || 0) + 1;
        
        // Calculate value if available
        if (opp.attributes && opp.attributes.budgetRange) {
          const value = opp.attributes.budgetRange.max || opp.attributes.budgetRange.min || 0;
          stats.totalValue += value;
        }
        
        // Count applications
        const oppApplications = applications.filter(a => a.opportunityId === opp.id);
        stats.totalApplications += oppApplications.length;
        stats.approvedApplications += oppApplications.filter(a => a.status === 'approved').length;
      });
      
      stats.averageValue = stats.total > 0 ? stats.totalValue / stats.total : 0;
      
      return stats;
    },

    delete(id) {
      const opportunities = this.getAll();
      const filtered = opportunities.filter(o => o.id !== id);
      return set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, filtered);
    },

    incrementViews(id) {
      const opportunity = this.getById(id);
      if (opportunity) {
        opportunity.views = (opportunity.views || 0) + 1;
        return this.update(id, { views: opportunity.views });
      }
      return null;
    },

    createAuditLog(action, entityId, details) {
      const auditLogs = Audit.getAll();
      const currentUser = Sessions.getCurrentUser();
      auditLogs.push({
        id: generateId('audit'),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userRole: currentUser?.role || 'system',
        userEmail: currentUser?.email || 'system',
        userName: currentUser?.profile?.name || 'System',
        action: action,
        actionCategory: 'collaboration',
        entityType: 'collaboration_opportunity',
        entityId: entityId,
        description: details.description,
        changes: details.changes || null,
        context: {
          portal: 'user_portal',
          opportunityId: entityId,
          creatorId: details.creatorId,
          modelType: details.modelType
        },
        metadata: {}
      });
      set(STORAGE_KEYS.AUDIT, auditLogs);
    }
  };

  // ============================================
  // Load Sample Collaboration Opportunities
  // ============================================
  function loadSampleCollaborationOpportunities(forceReload = false) {
    const existingOpportunities = CollaborationOpportunities.getAll();
    const expectedCount = 65; // Total test opportunities (5 per model × 13 models)
    
    // Only load if no opportunities exist or insufficient data exists (less than expected), unless forceReload is true
    // This ensures we have enough test data for all models (65 opportunities total)
    if (existingOpportunities.length >= expectedCount && !forceReload) {
      console.log(`[Data] ${existingOpportunities.length} opportunities already exist (expected ${expectedCount}). Use forceReload=true to reload test data.`);
      // Update existing opportunities with test data if they don't have views/applications
      updateOpportunitiesWithTestData();
      return;
    }
    
    // If we have some but not enough, reload to get full test dataset
    if (existingOpportunities.length > 0 && existingOpportunities.length < expectedCount && !forceReload) {
      console.log(`[Data] Only ${existingOpportunities.length} opportunities found (expected ${expectedCount}). Loading full test dataset...`);
      forceReload = true;
    }

    // Get test users for creators
    const users = Users.getAll();
    const testUsers = users.filter(u => ['entity', 'company', 'individual', 'admin'].includes(u.role));
    if (testUsers.length === 0) {
      console.warn('No test users found for collaboration opportunities');
      return;
    }

    const sampleOpportunities = [
      // Model 1.1: Task-Based Engagement
      {
        modelId: '1.1',
        modelType: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          taskTitle: 'Structural Engineering Review for Riyadh Metro Station',
          taskType: 'Engineering',
          detailedScope: 'Review and approve shop drawings for structural elements including foundations, columns, beams, and slabs. Provide structural calculations and ensure compliance with Saudi Building Code.',
          duration: 45,
          budgetRange: { min: 50000, max: 80000, currency: 'SAR' },
          budgetType: 'Fixed Price',
          requiredSkills: ['Structural Engineering', 'Foundation Design', 'Seismic Analysis', 'SBC Code'],
          experienceLevel: 'Senior',
          locationRequirement: 'Hybrid',
          startDate: '2024-03-01',
          deliverableFormat: 'PDF Reports, CAD Files, Excel Calculations',
          paymentTerms: 'Milestone-Based',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 45,
        matchesGenerated: 8,
        applicationsReceived: 12,
        applicationsApproved: 3
      },
      // Model 1.2: Consortium
      {
        modelId: '1.2',
        modelType: '1.2',
        modelName: 'Consortium',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'NEOM Industrial Zone Infrastructure Development',
          projectType: 'Infrastructure',
          projectValue: 500000000,
          projectDuration: 36,
          projectLocation: 'Tabuk, Saudi Arabia',
          leadMember: true,
          requiredMembers: 4,
          memberRoles: [
            { role: 'Civil Works', scope: 'Roads, bridges, and site preparation' },
            { role: 'MEP Systems', scope: 'Electrical, plumbing, and HVAC installation' },
            { role: 'Structural Engineering', scope: 'Building structures and foundations' },
            { role: 'Project Management', scope: 'Overall coordination and delivery' }
          ],
          scopeDivision: 'By Trade',
          liabilityStructure: 'Joint & Several',
          clientType: 'Government',
          tenderDeadline: '2024-04-15',
          prequalificationRequired: true,
          minimumRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 100M SAR annual revenue' },
            { requirement: 'Experience', value: 'At least 3 similar projects completed' },
            { requirement: 'Certifications', value: 'ISO 9001, ISO 14001' }
          ],
          consortiumAgreement: true,
          paymentDistribution: 'Per Scope'
        },
        views: 78,
        matchesGenerated: 15,
        applicationsReceived: 8,
        applicationsApproved: 4
      },
      // Model 1.3: Project-Specific Joint Venture
      {
        modelId: '1.3',
        modelType: '1.3',
        modelName: 'Project-Specific Joint Venture',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Riyadh Financial District Tower',
          projectType: 'Building',
          projectValue: 250000000,
          projectDuration: 30,
          projectLocation: 'Riyadh, Saudi Arabia',
          jvStructure: 'Incorporated LLC',
          equitySplit: [50, 50],
          capitalContribution: 50000000,
          partnerRoles: [
            { partner: 'Partner 1', contribution: 'Capital, Market Access' },
            { partner: 'Partner 2', contribution: 'Expertise, Equipment' }
          ],
          managementStructure: 'Equal Management',
          profitDistribution: 'Proportional to Equity',
          riskAllocation: 'Risks shared proportionally. Construction risks allocated to construction partner, financial risks to capital partner.',
          exitStrategy: 'Dissolution',
          governance: 'Board of 4 directors (2 from each partner), decisions require majority vote.',
          disputeResolution: 'Arbitration',
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 50M SAR net worth' },
            { requirement: 'Experience', value: 'Completed at least 2 high-rise projects' }
          ]
        },
        views: 92,
        matchesGenerated: 12,
        applicationsReceived: 6,
        applicationsApproved: 2
      },
      // Model 1.4: Special Purpose Vehicle (SPV)
      {
        modelId: '1.4',
        modelType: '1.4',
        modelName: 'Special Purpose Vehicle (SPV)',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Riyadh-Dammam High-Speed Rail PPP',
          projectType: 'Infrastructure',
          projectValue: 8000000000,
          projectDuration: 300,
          projectLocation: 'Riyadh to Dammam, Saudi Arabia',
          spvLegalForm: 'LLC',
          sponsors: [
            { name: 'Saudi Infrastructure Fund', equity: 40 },
            { name: 'International Rail Consortium', equity: 35 },
            { name: 'Local Construction Group', equity: 25 }
          ],
          equityStructure: [
            { sponsor: 'Saudi Infrastructure Fund', percentage: 40 },
            { sponsor: 'International Rail Consortium', percentage: 35 },
            { sponsor: 'Local Construction Group', percentage: 25 }
          ],
          debtFinancing: 5600000000,
          debtType: 'Non-Recourse',
          lenders: ['Saudi National Bank', 'Saudi Investment Bank', 'IFC'],
          projectPhase: 'Financing',
          revenueModel: 'User Fees',
          riskAllocation: 'Construction risks to contractor, operational risks to operator, demand risks shared.',
          governanceStructure: 'Board of 7 directors, independent chairman, professional management team.',
          regulatoryApprovals: ['Ministry of Transport', 'SAMA', 'Ministry of Commerce'],
          exitStrategy: 'Asset Transfer',
          professionalServicesNeeded: ['Legal', 'Financial', 'Technical', 'Environmental']
        },
        views: 156,
        matchesGenerated: 25,
        applicationsReceived: 10,
        applicationsApproved: 5
      },
      // Model 2.1: Strategic Joint Venture
      {
        modelId: '2.1',
        modelType: '2.1',
        modelName: 'Strategic Joint Venture',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jvName: 'Saudi Smart Buildings JV',
          strategicObjective: 'Create a leading smart building solutions provider in Saudi Arabia, combining local market knowledge with international technology expertise.',
          businessScope: 'Design, develop, and implement smart building systems including IoT integration, energy management, and building automation across multiple projects.',
          targetSectors: ['Construction', 'Technology', 'Real Estate'],
          geographicScope: ['Saudi Arabia', 'GCC'],
          duration: '15-20 years',
          jvStructure: 'Incorporated LLC',
          equitySplit: [60, 40],
          initialCapital: 20000000,
          ongoingFunding: 'Mixed',
          partnerContributions: [
            { partner: 'Partner 1', contribution: 'Capital, Market Access, Brand' },
            { partner: 'Partner 2', contribution: 'Technology, Expertise' }
          ],
          managementStructure: 'Professional CEO',
          governance: 'Board of 5 directors (3 from majority partner, 2 from minority), CEO reports to board.',
          profitDistribution: 'Proportional to Equity',
          exitOptions: ['Buyout', 'IPO', 'Sale to Third Party'],
          nonCompete: true,
          technologyTransfer: true,
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 100M SAR annual revenue' },
            { requirement: 'Market Presence', value: 'Established operations in target markets' },
            { requirement: 'Technology', value: 'Proven smart building technology portfolio' }
          ]
        },
        views: 134,
        matchesGenerated: 18,
        applicationsReceived: 7,
        applicationsApproved: 3
      },
      // Model 2.2: Long-Term Strategic Alliance
      {
        modelId: '2.2',
        modelType: '2.2',
        modelName: 'Long-Term Strategic Alliance',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          allianceTitle: 'Preferred Materials Supplier Alliance',
          allianceType: 'Preferred Supplier',
          strategicObjective: 'Establish long-term preferred supplier relationship for construction materials with volume discounts and priority delivery.',
          scopeOfCollaboration: 'Supply of cement, steel, and ready-mix concrete for all projects. Joint R&D for sustainable materials.',
          duration: 5,
          exclusivity: false,
          geographicScope: ['Saudi Arabia'],
          financialTerms: 'Volume-based pricing: 10% discount for orders over 10M SAR, 15% for orders over 50M SAR. Payment terms: 30 days net.',
          performanceMetrics: [
            { metric: 'Volume', target: '100M SAR annually' },
            { metric: 'Quality', target: 'Zero defects' },
            { metric: 'Response Time', target: 'Within 48 hours' }
          ],
          governance: 'Quarterly review meetings, joint steering committee with 2 members from each party.',
          terminationConditions: 'Termination with 90 days notice. Immediate termination for material breach.',
          partnerRequirements: [
            { requirement: 'Capacity', value: 'Minimum 500K tons annual production' },
            { requirement: 'Quality Standards', value: 'ISO 9001, ISO 14001 certified' },
            { requirement: 'Geographic Presence', value: 'Operations in Saudi Arabia' }
          ]
        },
        views: 67,
        matchesGenerated: 10,
        applicationsReceived: 5,
        applicationsApproved: 2
      },
      // Model 2.3: Mentorship Program
      {
        modelId: '2.3',
        modelType: '2.3',
        modelName: 'Mentorship Program',
        category: 'Strategic Partnerships',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          mentorshipTitle: 'Senior Project Manager Mentorship',
          mentorshipType: 'Project Management',
          experienceLevel: 'Junior',
          targetSkills: ['Project Planning', 'Stakeholder Management', 'Risk Management', 'Budget Control'],
          duration: 12,
          frequency: 'Bi-Weekly',
          format: 'Hybrid',
          compensation: 'Unpaid',
          barterOffer: '',
          mentorRequirements: [
            { requirement: 'Experience', value: 'Minimum 15 years in project management' },
            { requirement: 'Certifications', value: 'PMP certified' },
            { requirement: 'Industry', value: 'Construction industry experience' }
          ],
          menteeBackground: 'Junior project manager with 2 years experience seeking guidance on complex project delivery.',
          successMetrics: ['Skill Development', 'Project Completion', 'Career Advancement']
        },
        views: 34,
        matchesGenerated: 6,
        applicationsReceived: 4,
        applicationsApproved: 1
      },
      // Model 3.1: Bulk Purchasing
      {
        modelId: '3.1',
        modelType: '3.1',
        modelName: 'Bulk Purchasing',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          productService: 'Portland Cement Type I',
          category: 'Materials',
          quantityNeeded: 5000,
          unitOfMeasure: 'Tons',
          targetPrice: 250,
          currentMarketPrice: 280,
          expectedSavings: 10.7,
          deliveryTimeline: { start: '2024-03-15', end: '2024-04-15' },
          deliveryLocation: 'Riyadh, Saudi Arabia',
          paymentStructure: 'Upfront Collection',
          participantsNeeded: 5,
          minimumOrder: 1000,
          leadOrganizer: true,
          supplier: 'Saudi Cement Company',
          distributionMethod: 'Centralized Pickup'
        },
        views: 89,
        matchesGenerated: 12,
        applicationsReceived: 8,
        applicationsApproved: 5
      },
      // Model 3.2: Co-Ownership Pooling
      {
        modelId: '3.2',
        modelType: '3.2',
        modelName: 'Co-Ownership Pooling',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          assetDescription: 'Tower Crane 200 Ton Capacity',
          assetType: 'Heavy Equipment',
          purchasePrice: 2500000,
          ownershipStructure: 'Equal Shares',
          numberCoOwners: 3,
          equityPerOwner: 33.33,
          initialInvestment: 833333,
          ongoingCosts: [
            { cost: 'Maintenance', amount: 50000, frequency: 'Annual' },
            { cost: 'Insurance', amount: 30000, frequency: 'Annual' },
            { cost: 'Storage', amount: 20000, frequency: 'Annual' }
          ],
          costSharing: 'Equally',
          usageSchedule: 'Booking System',
          assetLocation: 'Riyadh Construction Yard',
          maintenanceResponsibility: 'Shared',
          insurance: true,
          exitStrategy: 'Sell Share to Other Owners',
          disputeResolution: 'Mediation'
        },
        views: 56,
        matchesGenerated: 8,
        applicationsReceived: 4,
        applicationsApproved: 2
      },
      // Model 3.3: Resource Sharing & Exchange
      {
        modelId: '3.3',
        modelType: '3.3',
        modelName: 'Resource Sharing & Exchange',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          resourceTitle: 'Excess Steel Beams - H-Beams 400x400',
          resourceType: 'Materials',
          transactionType: 'Sell',
          detailedDescription: 'Surplus steel beams from completed project. Grade S355, 400x400mm H-beams, total 50 tons. Excellent condition, stored in covered warehouse.',
          quantity: 50,
          unitOfMeasure: 'Tons',
          condition: 'Good',
          location: 'Jeddah, Saudi Arabia',
          availability: { start: '2024-03-01', end: '2024-04-30' },
          price: 3500,
          barterOffer: '',
          barterPreferences: [],
          delivery: 'Buyer Pickup',
          paymentTerms: 'On Delivery',
          urgency: 'Within 1 Month'
        },
        views: 123,
        matchesGenerated: 15,
        applicationsReceived: 9,
        applicationsApproved: 3
      },
      // Model 4.1: Professional Hiring
      {
        modelId: '4.1',
        modelType: '4.1',
        modelName: 'Professional Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jobTitle: 'Senior Civil Engineer',
          jobCategory: 'Engineering',
          employmentType: 'Full-Time',
          contractDuration: null,
          jobDescription: 'Lead civil engineering team for infrastructure projects. Responsible for design review, site supervision, and quality assurance. Manage team of 5 engineers.',
          requiredQualifications: ['Bachelor in Civil Engineering', 'Saudi Council of Engineers License', 'PMP Certification'],
          requiredExperience: 8,
          requiredSkills: ['Structural Design', 'Project Management', 'AutoCAD', 'ETABS', 'SAP2000'],
          preferredSkills: ['BIM', 'Sustainability Design', 'LEED AP'],
          location: 'Riyadh, Saudi Arabia',
          workMode: 'On-Site',
          salaryRange: { min: 15000, max: 20000, currency: 'SAR' },
          benefits: ['Health Insurance', 'Housing Allowance', 'Transportation', 'Annual Leave'],
          startDate: '2024-04-01',
          reportingTo: 'Engineering Manager',
          teamSize: 5,
          applicationDeadline: '2024-03-25'
        },
        views: 234,
        matchesGenerated: 28,
        applicationsReceived: 18,
        applicationsApproved: 5
      },
      // Model 4.2: Consultant Hiring
      {
        modelId: '4.2',
        modelType: '4.2',
        modelName: 'Consultant Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          consultationTitle: 'LEED Certification Consultant',
          consultationType: 'Sustainability',
          scopeOfWork: 'Provide LEED certification consulting services for green building project. Conduct energy audits, prepare documentation, and guide certification process.',
          deliverables: ['LEED Documentation', 'Energy Analysis Report', 'Certification Application', 'Training Sessions'],
          duration: 90,
          requiredExpertise: ['LEED Certification', 'Energy Modeling', 'Green Building Design', 'Sustainability'],
          requiredCertifications: ['LEED AP BD+C'],
          experienceLevel: 'Expert',
          locationRequirement: 'Hybrid',
          budget: { min: 80000, max: 120000, currency: 'SAR' },
          paymentTerms: 'Milestone-Based',
          startDate: '2024-03-15',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 167,
        matchesGenerated: 14,
        applicationsReceived: 7,
        applicationsApproved: 2
      },
      // Model 5.1: Competition/RFP
      {
        modelId: '5.1',
        modelType: '5.1',
        modelName: 'Competition/RFP',
        category: 'Call for Competition',
        relationshipType: 'B2B',
        creatorId: testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          competitionTitle: 'Sustainable Building Design Competition - NEOM',
          competitionType: 'Design Competition',
          competitionScope: 'Design a sustainable, net-zero energy residential building for NEOM. Must incorporate renewable energy, water conservation, and smart building technologies.',
          participantType: 'Both',
          competitionFormat: 'Open to All',
          eligibilityCriteria: [
            { criterion: 'Experience', value: 'Minimum 5 years in sustainable design' },
            { criterion: 'Certifications', value: 'LEED AP or equivalent' },
            { criterion: 'Financial Capacity', value: 'Able to execute if selected' }
          ],
          submissionRequirements: ['Design Proposal', 'Technical Drawings', 'Sustainability Analysis', 'Cost Estimate', 'Timeline'],
          evaluationCriteria: [
            { criterion: 'Technical Quality', weight: 40 },
            { criterion: 'Innovation', weight: 25 },
            { criterion: 'Sustainability', weight: 20 },
            { criterion: 'Cost Efficiency', weight: 15 }
          ],
          evaluationWeights: [40, 25, 20, 15],
          prizeContractValue: 5000000,
          numberWinners: 3,
          submissionDeadline: '2024-05-30',
          announcementDate: '2024-06-15',
          competitionRules: 'All submissions become property of client. Winners must execute project within 24 months. Non-winners retain IP but grant client usage rights.',
          intellectualProperty: 'Winner Transfers',
          submissionFee: 0
        },
        views: 289,
        matchesGenerated: 35,
        applicationsReceived: 22,
        applicationsApproved: 3
      },
      // Additional Test Data - Model 1.1: Task-Based Engagement (More Examples)
      {
        modelId: '1.1',
        modelType: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2P',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          taskTitle: 'BIM Modeling for Residential Complex',
          taskType: 'Design',
          detailedScope: 'Create comprehensive BIM models for 200-unit residential complex including architectural, structural, and MEP models.',
          duration: 60,
          budgetRange: { min: 120000, max: 180000, currency: 'SAR' },
          budgetType: 'Fixed Price',
          requiredSkills: ['BIM', 'Revit', 'Navisworks', 'Architecture'],
          experienceLevel: 'Senior',
          locationRequirement: 'Remote',
          startDate: '2024-04-01',
          deliverableFormat: 'Revit Files, PDF Drawings, Clash Reports',
          paymentTerms: '50% Advance, 50% on Completion',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 67,
        matchesGenerated: 12,
        applicationsReceived: 8,
        applicationsApproved: 3
      },
      // Additional Test Data - Model 1.2: Consortium (More Examples)
      {
        modelId: '1.2',
        modelType: '1.2',
        modelName: 'Consortium',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Red Sea Project - Luxury Resort Development',
          projectType: 'Hospitality',
          projectValue: 1200000000,
          projectDuration: 48,
          projectLocation: 'Red Sea, Saudi Arabia',
          leadMember: true,
          requiredMembers: 5,
          memberRoles: [
            { role: 'Architecture & Design', scope: 'Master planning and architectural design' },
            { role: 'Construction', scope: 'Main construction works' },
            { role: 'MEP & Utilities', scope: 'All MEP systems and utilities' },
            { role: 'Landscaping', scope: 'Landscape design and implementation' },
            { role: 'Interior Design', scope: 'Interior design and fit-out' }
          ],
          scopeDivision: 'By Trade',
          liabilityStructure: 'Joint & Several',
          clientType: 'Private',
          tenderDeadline: '2024-05-01',
          prequalificationRequired: true,
          minimumRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 200M SAR annual revenue' },
            { requirement: 'Experience', value: 'At least 5 luxury hospitality projects' }
          ],
          consortiumAgreement: true,
          paymentDistribution: 'Per Scope'
        },
        views: 145,
        matchesGenerated: 22,
        applicationsReceived: 12,
        applicationsApproved: 5
      },
      // Model 1.3: Project-Specific Joint Venture (Additional Example)
      {
        modelId: '1.3',
        modelType: '1.3',
        modelName: 'Project-Specific Joint Venture',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          projectTitle: 'Jeddah Waterfront Development Phase 2',
          projectType: 'Infrastructure',
          projectValue: 180000000,
          projectDuration: 24,
          projectLocation: 'Jeddah, Saudi Arabia',
          jvStructure: 'Unincorporated Partnership',
          equitySplit: [60, 40],
          capitalContribution: 36000000,
          partnerRoles: [
            { partner: 'Local Partner', contribution: 'Market Access, Permits, Local Expertise' },
            { partner: 'International Partner', contribution: 'Technology, Capital, Design' }
          ],
          managementStructure: 'Joint Management',
          profitDistribution: 'Proportional to Equity',
          riskAllocation: 'Local partner handles regulatory and market risks, international partner handles technical and financial risks.',
          exitStrategy: 'Project Completion',
          governance: 'Management committee with equal representation, major decisions require unanimous consent.',
          disputeResolution: 'Mediation then Arbitration',
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 30M SAR net worth' },
            { requirement: 'Experience', value: 'Completed at least 1 waterfront project' }
          ]
        },
        views: 23,
        matchesGenerated: 5,
        applicationsReceived: 2,
        applicationsApproved: 0
      },
      // Model 1.4: Special Purpose Vehicle (Additional Example)
      {
        modelId: '1.4',
        modelType: '1.4',
        modelName: 'Special Purpose Vehicle (SPV)',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'pending',
        attributes: {
          projectTitle: 'Solar Power Plant - Qassim Region',
          projectType: 'Energy',
          projectValue: 1200000000,
          projectDuration: 180,
          projectLocation: 'Qassim, Saudi Arabia',
          spvLegalForm: 'LLC',
          sponsors: [
            { name: 'Renewable Energy Fund', equity: 50 },
            { name: 'Local Developer', equity: 30 },
            { name: 'Technology Provider', equity: 20 }
          ],
          equityStructure: [
            { sponsor: 'Renewable Energy Fund', percentage: 50 },
            { sponsor: 'Local Developer', percentage: 30 },
            { sponsor: 'Technology Provider', percentage: 20 }
          ],
          debtFinancing: 840000000,
          debtType: 'Limited Recourse',
          lenders: ['Saudi Development Bank', 'Green Energy Fund'],
          projectPhase: 'Development',
          revenueModel: 'Power Purchase Agreement',
          riskAllocation: 'Technology risks to technology provider, operational risks to operator, market risks shared.',
          governanceStructure: 'Board of 5 directors, independent chairman, professional management.',
          regulatoryApprovals: ['Ministry of Energy', 'SAMA', 'Ministry of Commerce'],
          exitStrategy: 'Refinancing or Sale',
          professionalServicesNeeded: ['Legal', 'Financial', 'Technical', 'Environmental', 'Regulatory']
        },
        views: 45,
        matchesGenerated: 8,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 2.1: Strategic Joint Venture (Additional Example)
      {
        modelId: '2.1',
        modelType: '2.1',
        modelName: 'Strategic Joint Venture',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jvName: 'GCC Construction Technology JV',
          strategicObjective: 'Establish leading construction technology solutions provider across GCC, combining regional expertise with global innovation.',
          businessScope: 'Develop and deploy construction technology platforms, digital transformation services, and smart construction solutions.',
          targetSectors: ['Construction', 'Real Estate', 'Infrastructure'],
          geographicScope: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
          duration: '10-15 years',
          jvStructure: 'Incorporated LLC',
          equitySplit: [55, 45],
          initialCapital: 15000000,
          ongoingFunding: 'Equity and Revenue',
          partnerContributions: [
            { partner: 'Regional Partner', contribution: 'Market Access, Regional Network, Local Expertise' },
            { partner: 'Technology Partner', contribution: 'Technology Platform, R&D, Innovation' }
          ],
          managementStructure: 'Co-CEOs',
          governance: 'Board of 6 directors (3 from each partner), strategic decisions require board approval.',
          profitDistribution: 'Proportional to Equity',
          exitOptions: ['Buyout', 'IPO', 'Strategic Sale'],
          nonCompete: true,
          technologyTransfer: true,
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 80M SAR annual revenue' },
            { requirement: 'Market Presence', value: 'Active in at least 3 GCC countries' },
            { requirement: 'Technology', value: 'Proven construction technology solutions' }
          ]
        },
        views: 98,
        matchesGenerated: 14,
        applicationsReceived: 6,
        applicationsApproved: 2
      },
      // Model 2.2: Long-Term Strategic Alliance (Additional Example)
      {
        modelId: '2.2',
        modelType: '2.2',
        modelName: 'Long-Term Strategic Alliance',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'closed',
        attributes: {
          allianceTitle: 'Equipment Rental Partnership',
          allianceType: 'Service Partnership',
          strategicObjective: 'Establish preferred equipment rental partnership with priority access and discounted rates for long-term projects.',
          scopeOfCollaboration: 'Exclusive equipment rental services for all construction projects. Joint maintenance and equipment optimization programs.',
          duration: 3,
          exclusivity: true,
          geographicScope: ['Saudi Arabia'],
          financialTerms: 'Monthly retainer of 50K SAR plus usage-based pricing at 15% discount. Minimum commitment: 500K SAR annually.',
          performanceMetrics: [
            { metric: 'Equipment Availability', target: '95% uptime' },
            { metric: 'Response Time', target: 'Within 24 hours' },
            { metric: 'Customer Satisfaction', target: '4.5/5 rating' }
          ],
          governance: 'Monthly operational reviews, quarterly strategic reviews, joint steering committee.',
          terminationConditions: 'Termination with 60 days notice. Immediate termination for material breach or non-payment.',
          partnerRequirements: [
            { requirement: 'Fleet Size', value: 'Minimum 100 units' },
            { requirement: 'Service Coverage', value: 'Nationwide service capability' },
            { requirement: 'Quality Standards', value: 'ISO 9001 certified operations' }
          ]
        },
        views: 34,
        matchesGenerated: 6,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 2.3: Mentorship Program (Additional Example)
      {
        modelId: '2.3',
        modelType: '2.3',
        modelName: 'Mentorship Program',
        category: 'Strategic Partnerships',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[1]?.id || 'user-1',
        status: 'active',
        attributes: {
          mentorshipTitle: 'Construction Project Management Mentorship',
          mentorshipType: 'Project Management',
          experienceLevel: 'Mid-Level',
          targetSkills: ['Cost Management', 'Schedule Control', 'Quality Assurance', 'Team Leadership'],
          duration: 18,
          frequency: 'Weekly',
          format: 'On-Site',
          compensation: 'Unpaid',
          barterOffer: '',
          mentorRequirements: [
            { requirement: 'Experience', value: 'Minimum 20 years in construction project management' },
            { requirement: 'Certifications', value: 'PMP, PMI-ACP certified' },
            { requirement: 'Industry', value: 'Large-scale construction project experience' }
          ],
          menteeBackground: 'Mid-level project manager with 5 years experience seeking advanced skills in mega-project management.',
          successMetrics: ['Skill Certification', 'Project Success Rate', 'Career Progression']
        },
        views: 28,
        matchesGenerated: 4,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 3.1: Bulk Purchasing (Additional Example)
      {
        modelId: '3.1',
        modelType: '3.1',
        modelName: 'Bulk Purchasing',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          productService: 'Reinforcement Steel Bars Grade 60',
          category: 'Materials',
          quantityNeeded: 8000,
          unitOfMeasure: 'Tons',
          targetPrice: 3200,
          currentMarketPrice: 3600,
          expectedSavings: 11.1,
          deliveryTimeline: { start: '2024-04-01', end: '2024-05-15' },
          deliveryLocation: 'Multiple Sites - Riyadh, Jeddah, Dammam',
          paymentStructure: 'Upfront Collection',
          participantsNeeded: 8,
          minimumOrder: 500,
          leadOrganizer: true,
          supplier: 'SABIC Steel',
          distributionMethod: 'Direct to Site'
        },
        views: 112,
        matchesGenerated: 18,
        applicationsReceived: 12,
        applicationsApproved: 7
      },
      // Model 3.2: Co-Ownership Pooling (Additional Example)
      {
        modelId: '3.2',
        modelType: '3.2',
        modelName: 'Co-Ownership Pooling',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          assetDescription: 'Concrete Batching Plant 120 m³/h',
          assetType: 'Heavy Equipment',
          purchasePrice: 3500000,
          ownershipStructure: 'Proportional Shares',
          numberCoOwners: 4,
          equityPerOwner: 25,
          initialInvestment: 875000,
          ongoingCosts: [
            { cost: 'Maintenance', amount: 80000, frequency: 'Annual' },
            { cost: 'Insurance', amount: 50000, frequency: 'Annual' },
            { cost: 'Utilities', amount: 60000, frequency: 'Annual' }
          ],
          costSharing: 'Proportional to Ownership',
          usageSchedule: 'Priority Booking System',
          assetLocation: 'Dammam Industrial Area',
          maintenanceResponsibility: 'Shared with Rotation',
          insurance: true,
          exitStrategy: 'Right of First Refusal',
          disputeResolution: 'Arbitration'
        },
        views: 78,
        matchesGenerated: 11,
        applicationsReceived: 6,
        applicationsApproved: 3
      },
      // Model 3.3: Resource Sharing & Exchange (Additional Example)
      {
        modelId: '3.3',
        modelType: '3.3',
        modelName: 'Resource Sharing & Exchange',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          resourceTitle: 'Excess Concrete Formwork - Various Sizes',
          resourceType: 'Equipment',
          transactionType: 'Rent',
          detailedDescription: 'High-quality steel formwork system available for rent. Includes wall forms, column forms, and beam forms. Total 500 sqm. Excellent condition, recently used on high-rise project.',
          quantity: 500,
          unitOfMeasure: 'Square Meters',
          condition: 'Excellent',
          location: 'Riyadh, Saudi Arabia',
          availability: { start: '2024-03-20', end: '2024-06-30' },
          price: 25,
          barterOffer: '',
          barterPreferences: ['Construction Services', 'Materials'],
          delivery: 'Renter Pickup',
          paymentTerms: 'Monthly in Advance',
          urgency: 'Within 2 Months'
        },
        views: 89,
        matchesGenerated: 12,
        applicationsReceived: 7,
        applicationsApproved: 2
      },
      // Model 4.1: Professional Hiring (Additional Example)
      {
        modelId: '4.1',
        modelType: '4.1',
        modelName: 'Professional Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jobTitle: 'BIM Manager',
          jobCategory: 'Technology',
          employmentType: 'Full-Time',
          contractDuration: null,
          jobDescription: 'Lead BIM implementation across all projects. Manage BIM team, develop standards, coordinate with design teams, and ensure quality deliverables.',
          requiredQualifications: ['Bachelor in Engineering or Architecture', 'BIM Certification', 'Project Management Certification'],
          requiredExperience: 6,
          requiredSkills: ['Revit', 'Navisworks', 'BIM 360', 'Team Management', 'Standards Development'],
          preferredSkills: ['Dynamo', 'Python', 'BIM Execution Planning'],
          location: 'Riyadh, Saudi Arabia',
          workMode: 'Hybrid',
          salaryRange: { min: 18000, max: 25000, currency: 'SAR' },
          benefits: ['Health Insurance', 'Housing Allowance', 'Transportation', 'Annual Leave', 'Training Budget'],
          startDate: '2024-05-01',
          reportingTo: 'Technical Director',
          teamSize: 8,
          applicationDeadline: '2024-04-20'
        },
        views: 189,
        matchesGenerated: 24,
        applicationsReceived: 15,
        applicationsApproved: 4
      },
      // Model 4.2: Consultant Hiring (Additional Example)
      {
        modelId: '4.2',
        modelType: '4.2',
        modelName: 'Consultant Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          consultationTitle: 'Project Controls and Scheduling Consultant',
          consultationType: 'Project Management',
          scopeOfWork: 'Develop comprehensive project controls system including scheduling, cost control, risk management, and reporting. Train team on system usage.',
          deliverables: ['Project Controls System', 'Schedule Baseline', 'Cost Baseline', 'Risk Register', 'Training Materials', 'Monthly Reports'],
          duration: 120,
          requiredExpertise: ['Project Controls', 'Primavera P6', 'Cost Management', 'Risk Management', 'Earned Value Management'],
          requiredCertifications: ['PMP', 'PMI-SP'],
          experienceLevel: 'Expert',
          locationRequirement: 'Hybrid',
          budget: { min: 150000, max: 200000, currency: 'SAR' },
          paymentTerms: 'Milestone-Based',
          startDate: '2024-04-15',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 134,
        matchesGenerated: 18,
        applicationsReceived: 9,
        applicationsApproved: 2
      },
      // Model 5.1: Competition/RFP (Additional Example)
      {
        modelId: '5.1',
        modelType: '5.1',
        modelName: 'Competition/RFP',
        category: 'Call for Competition',
        relationshipType: 'B2B',
        creatorId: testUsers[1]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          competitionTitle: 'Innovative Bridge Design Competition - King Fahd Causeway',
          competitionType: 'Design Competition',
          competitionScope: 'Design an innovative, sustainable bridge solution for King Fahd Causeway expansion. Must incorporate advanced materials, smart monitoring systems, and environmental considerations.',
          participantType: 'Both',
          competitionFormat: 'Invited Only',
          eligibilityCriteria: [
            { criterion: 'Experience', value: 'Minimum 10 years in bridge design' },
            { criterion: 'Certifications', value: 'Professional Engineering License' },
            { criterion: 'Financial Capacity', value: 'Able to execute 500M+ SAR project' },
            { criterion: 'Track Record', value: 'Completed at least 3 major bridge projects' }
          ],
          submissionRequirements: ['Design Proposal', 'Technical Drawings', 'Structural Analysis', 'Environmental Impact Assessment', 'Cost Estimate', 'Construction Methodology', 'Timeline'],
          evaluationCriteria: [
            { criterion: 'Technical Excellence', weight: 35 },
            { criterion: 'Innovation', weight: 25 },
            { criterion: 'Sustainability', weight: 20 },
            { criterion: 'Cost Efficiency', weight: 15 },
            { criterion: 'Feasibility', weight: 5 }
          ],
          evaluationWeights: [35, 25, 20, 15, 5],
          prizeContractValue: 8000000,
          numberWinners: 2,
          submissionDeadline: '2024-06-30',
          announcementDate: '2024-07-15',
          competitionRules: 'All submissions become property of client. Winners must execute project within 30 months. Non-winners retain IP but grant client usage rights for 5 years.',
          intellectualProperty: 'Winner Transfers',
          submissionFee: 5000
        },
        views: 156,
        matchesGenerated: 22,
        applicationsReceived: 14,
        applicationsApproved: 2
      },
      // Model 1.1: Task-Based Engagement (3rd Example)
      {
        modelId: '1.1',
        modelType: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        relationshipType: 'P2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          taskTitle: 'Geotechnical Investigation Report',
          taskType: 'Analysis',
          detailedScope: 'Conduct comprehensive geotechnical investigation for proposed high-rise building site. Include soil testing, foundation recommendations, and seismic analysis.',
          duration: 30,
          budgetRange: { min: 35000, max: 50000, currency: 'SAR' },
          budgetType: 'Fixed Price',
          requiredSkills: ['Geotechnical Engineering', 'Soil Analysis', 'Foundation Design', 'Seismic Analysis'],
          experienceLevel: 'Senior',
          locationRequirement: 'On-Site',
          startDate: '2024-04-15',
          deliverableFormat: 'PDF Report, CAD Drawings, Excel Data',
          paymentTerms: '30% Advance, 70% on Completion',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 52,
        matchesGenerated: 9,
        applicationsReceived: 6,
        applicationsApproved: 2
      },
      // Model 1.1: Task-Based Engagement (4th Example)
      {
        modelId: '1.1',
        modelType: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          taskTitle: 'MEP Design Review and Optimization',
          taskType: 'Review',
          detailedScope: 'Review existing MEP designs for commercial building, identify optimization opportunities, and provide recommendations for energy efficiency improvements.',
          duration: 20,
          budgetRange: { min: 25000, max: 35000, currency: 'SAR' },
          budgetType: 'Fixed Price',
          requiredSkills: ['MEP Design', 'Energy Efficiency', 'HVAC Systems', 'Electrical Systems'],
          experienceLevel: 'Senior',
          locationRequirement: 'Hybrid',
          startDate: '2024-05-01',
          deliverableFormat: 'PDF Review Report, Marked Drawings, Recommendations',
          paymentTerms: '50% Advance, 50% on Completion',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 18,
        matchesGenerated: 4,
        applicationsReceived: 2,
        applicationsApproved: 0
      },
      // Model 1.1: Task-Based Engagement (5th Example)
      {
        modelId: '1.1',
        modelType: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[2]?.id || 'user-1',
        status: 'active',
        attributes: {
          taskTitle: 'Construction Site Photography and Documentation',
          taskType: 'Other',
          detailedScope: 'Provide professional photography services for construction progress documentation. Weekly site visits, drone photography, and progress reports.',
          duration: 52,
          budgetRange: { min: 15000, max: 25000, currency: 'SAR' },
          budgetType: 'Per Visit',
          requiredSkills: ['Photography', 'Drone Operation', 'Construction Documentation'],
          experienceLevel: 'Mid-Level',
          locationRequirement: 'On-Site',
          startDate: '2024-03-20',
          deliverableFormat: 'High-Resolution Photos, Progress Reports, Video Clips',
          paymentTerms: 'Monthly',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 41,
        matchesGenerated: 7,
        applicationsReceived: 5,
        applicationsApproved: 1
      },
      // Model 1.2: Consortium (3rd Example)
      {
        modelId: '1.2',
        modelType: '1.2',
        modelName: 'Consortium',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'King Salman Park - Phase 1 Infrastructure',
          projectType: 'Infrastructure',
          projectValue: 800000000,
          projectDuration: 42,
          projectLocation: 'Riyadh, Saudi Arabia',
          leadMember: true,
          requiredMembers: 6,
          memberRoles: [
            { role: 'Civil Works', scope: 'Earthworks, roads, and utilities' },
            { role: 'Landscaping', scope: 'Landscape design and implementation' },
            { role: 'Irrigation Systems', scope: 'Complete irrigation network' },
            { role: 'Electrical Systems', scope: 'Lighting and power distribution' },
            { role: 'Water Features', scope: 'Fountains and water systems' },
            { role: 'Project Management', scope: 'Overall coordination' }
          ],
          scopeDivision: 'By Trade',
          liabilityStructure: 'Joint & Several',
          clientType: 'Government',
          tenderDeadline: '2024-05-15',
          prequalificationRequired: true,
          minimumRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 150M SAR annual revenue' },
            { requirement: 'Experience', value: 'At least 4 similar park/infrastructure projects' }
          ],
          consortiumAgreement: true,
          paymentDistribution: 'Per Scope'
        },
        views: 167,
        matchesGenerated: 28,
        applicationsReceived: 15,
        applicationsApproved: 6
      },
      // Model 1.2: Consortium (4th Example)
      {
        modelId: '1.2',
        modelType: '1.2',
        modelName: 'Consortium',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'pending',
        attributes: {
          projectTitle: 'Smart City Infrastructure - Digital Transformation',
          projectType: 'Technology',
          projectValue: 600000000,
          projectDuration: 36,
          projectLocation: 'NEOM, Saudi Arabia',
          leadMember: true,
          requiredMembers: 4,
          memberRoles: [
            { role: 'IoT Infrastructure', scope: 'Sensor networks and IoT platform' },
            { role: 'Data Analytics', scope: 'Data platform and analytics' },
            { role: 'Network Infrastructure', scope: '5G and fiber networks' },
            { role: 'System Integration', scope: 'Integration and project management' }
          ],
          scopeDivision: 'By System',
          liabilityStructure: 'Joint & Several',
          clientType: 'Government',
          tenderDeadline: '2024-06-01',
          prequalificationRequired: true,
          minimumRequirements: [
            { requirement: 'Technical Capability', value: 'Proven smart city solutions' },
            { requirement: 'Financial Capacity', value: 'Minimum 100M SAR annual revenue' }
          ],
          consortiumAgreement: true,
          paymentDistribution: 'Per Milestone'
        },
        views: 89,
        matchesGenerated: 16,
        applicationsReceived: 9,
        applicationsApproved: 4
      },
      // Model 1.2: Consortium (5th Example)
      {
        modelId: '1.2',
        modelType: '1.2',
        modelName: 'Consortium',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Healthcare Facility - Design and Build',
          projectType: 'Building',
          projectValue: 450000000,
          projectDuration: 30,
          projectLocation: 'Jeddah, Saudi Arabia',
          leadMember: true,
          requiredMembers: 5,
          memberRoles: [
            { role: 'Architecture & Design', scope: 'Complete architectural design' },
            { role: 'MEP Systems', scope: 'Medical gas, HVAC, electrical' },
            { role: 'Medical Equipment', scope: 'Procurement and installation' },
            { role: 'Construction', scope: 'Main construction works' },
            { role: 'Project Management', scope: 'Overall coordination' }
          ],
          scopeDivision: 'By Trade',
          liabilityStructure: 'Joint & Several',
          clientType: 'Private',
          tenderDeadline: '2024-04-30',
          prequalificationRequired: true,
          minimumRequirements: [
            { requirement: 'Experience', value: 'At least 3 healthcare facility projects' },
            { requirement: 'Certifications', value: 'Healthcare construction certification' }
          ],
          consortiumAgreement: true,
          paymentDistribution: 'Per Scope'
        },
        views: 134,
        matchesGenerated: 20,
        applicationsReceived: 11,
        applicationsApproved: 5
      },
      // Model 1.3: Project-Specific Joint Venture (3rd Example)
      {
        modelId: '1.3',
        modelType: '1.3',
        modelName: 'Project-Specific Joint Venture',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Mixed-Use Development - Downtown Riyadh',
          projectType: 'Building',
          projectValue: 1200000000,
          projectDuration: 48,
          projectLocation: 'Riyadh, Saudi Arabia',
          jvStructure: 'Incorporated LLC',
          equitySplit: [70, 30],
          capitalContribution: 240000000,
          partnerRoles: [
            { partner: 'Developer Partner', contribution: 'Land, Permits, Market Access' },
            { partner: 'Construction Partner', contribution: 'Construction Expertise, Equipment' }
          ],
          managementStructure: 'Majority Partner Management',
          profitDistribution: 'Proportional to Equity',
          riskAllocation: 'Development risks to developer, construction risks to construction partner.',
          exitStrategy: 'Project Completion',
          governance: 'Board of 5 directors (3 from majority, 2 from minority), strategic decisions require majority vote.',
          disputeResolution: 'Arbitration',
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 200M SAR net worth' },
            { requirement: 'Experience', value: 'Completed at least 3 mixed-use developments' }
          ]
        },
        views: 201,
        matchesGenerated: 32,
        applicationsReceived: 18,
        applicationsApproved: 6
      },
      // Model 1.3: Project-Specific Joint Venture (4th Example)
      {
        modelId: '1.3',
        modelType: '1.3',
        modelName: 'Project-Specific Joint Venture',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          projectTitle: 'Industrial Warehouse Complex',
          projectType: 'Industrial',
          projectValue: 180000000,
          projectDuration: 18,
          projectLocation: 'Dammam, Saudi Arabia',
          jvStructure: 'Unincorporated Partnership',
          equitySplit: [50, 50],
          capitalContribution: 36000000,
          partnerRoles: [
            { partner: 'Local Partner', contribution: 'Land, Local Expertise, Permits' },
            { partner: 'International Partner', contribution: 'Capital, Design, Technology' }
          ],
          managementStructure: 'Equal Management',
          profitDistribution: 'Equal Split',
          riskAllocation: 'Risks shared equally. Market risks to local partner, technical risks to international partner.',
          exitStrategy: 'Buyout Option',
          governance: 'Management committee with equal representation, major decisions require unanimous consent.',
          disputeResolution: 'Mediation',
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 40M SAR net worth' },
            { requirement: 'Experience', value: 'Completed at least 2 industrial projects' }
          ]
        },
        views: 34,
        matchesGenerated: 7,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 1.3: Project-Specific Joint Venture (5th Example)
      {
        modelId: '1.3',
        modelType: '1.3',
        modelName: 'Project-Specific Joint Venture',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Educational Campus - University Expansion',
          projectType: 'Building',
          projectValue: 350000000,
          projectDuration: 36,
          projectLocation: 'Riyadh, Saudi Arabia',
          jvStructure: 'Incorporated LLC',
          equitySplit: [60, 40],
          capitalContribution: 70000000,
          partnerRoles: [
            { partner: 'Educational Institution', contribution: 'Land, Requirements, Endorsement' },
            { partner: 'Construction Company', contribution: 'Construction, Design, Management' }
          ],
          managementStructure: 'Joint Management',
          profitDistribution: 'Proportional to Equity',
          riskAllocation: 'Design and quality risks to construction partner, operational risks to institution.',
          exitStrategy: 'Project Completion',
          governance: 'Board of 6 directors (3 from each partner), academic decisions to institution, construction decisions to construction partner.',
          disputeResolution: 'Arbitration',
          partnerRequirements: [
            { requirement: 'Experience', value: 'Completed at least 2 educational facility projects' },
            { requirement: 'Reputation', value: 'Strong track record in educational construction' }
          ]
        },
        views: 145,
        matchesGenerated: 24,
        applicationsReceived: 12,
        applicationsApproved: 4
      },
      // Model 1.4: Special Purpose Vehicle (3rd Example)
      {
        modelId: '1.4',
        modelType: '1.4',
        modelName: 'Special Purpose Vehicle (SPV)',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Waste-to-Energy Plant - Riyadh',
          projectType: 'Energy',
          projectValue: 2000000000,
          projectDuration: 240,
          projectLocation: 'Riyadh, Saudi Arabia',
          spvLegalForm: 'LLC',
          sponsors: [
            { name: 'Saudi Energy Fund', equity: 45 },
            { name: 'International Technology Provider', equity: 30 },
            { name: 'Local Waste Management Company', equity: 25 }
          ],
          equityStructure: [
            { sponsor: 'Saudi Energy Fund', percentage: 45 },
            { sponsor: 'International Technology Provider', percentage: 30 },
            { sponsor: 'Local Waste Management Company', percentage: 25 }
          ],
          debtFinancing: 1400000000,
          debtType: 'Non-Recourse',
          lenders: ['Saudi National Bank', 'SIDF', 'International Development Bank'],
          projectPhase: 'Development',
          revenueModel: 'Power Purchase Agreement + Waste Disposal Fees',
          riskAllocation: 'Technology risks to technology provider, operational risks to operator, regulatory risks shared.',
          governanceStructure: 'Board of 7 directors, independent chairman, professional management team.',
          regulatoryApprovals: ['Ministry of Energy', 'Ministry of Environment', 'SAMA', 'Ministry of Commerce'],
          exitStrategy: 'Refinancing or Sale',
          professionalServicesNeeded: ['Legal', 'Financial', 'Technical', 'Environmental', 'Regulatory']
        },
        views: 178,
        matchesGenerated: 30,
        applicationsReceived: 14,
        applicationsApproved: 6
      },
      // Model 1.4: Special Purpose Vehicle (4th Example)
      {
        modelId: '1.4',
        modelType: '1.4',
        modelName: 'Special Purpose Vehicle (SPV)',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'pending',
        attributes: {
          projectTitle: 'Desalination Plant - Red Sea Coast',
          projectType: 'Infrastructure',
          projectValue: 3000000000,
          projectDuration: 300,
          projectLocation: 'Red Sea Coast, Saudi Arabia',
          spvLegalForm: 'LLC',
          sponsors: [
            { name: 'Saudi Water Authority', equity: 40 },
            { name: 'International Water Technology', equity: 35 },
            { name: 'Local Infrastructure Fund', equity: 25 }
          ],
          equityStructure: [
            { sponsor: 'Saudi Water Authority', percentage: 40 },
            { sponsor: 'International Water Technology', percentage: 35 },
            { sponsor: 'Local Infrastructure Fund', percentage: 25 }
          ],
          debtFinancing: 2100000000,
          debtType: 'Limited Recourse',
          lenders: ['Saudi Development Bank', 'IFC', 'Regional Development Bank'],
          projectPhase: 'Financing',
          revenueModel: 'Water Purchase Agreement',
          riskAllocation: 'Technology risks to technology provider, operational risks to operator, demand risks to off-taker.',
          governanceStructure: 'Board of 8 directors, independent chairman, professional management.',
          regulatoryApprovals: ['Ministry of Environment', 'SAMA', 'Ministry of Commerce', 'Water Authority'],
          exitStrategy: 'Asset Transfer or Refinancing',
          professionalServicesNeeded: ['Legal', 'Financial', 'Technical', 'Environmental', 'Regulatory', 'Water Quality']
        },
        views: 112,
        matchesGenerated: 19,
        applicationsReceived: 8,
        applicationsApproved: 3
      },
      // Model 1.4: Special Purpose Vehicle (5th Example)
      {
        modelId: '1.4',
        modelType: '1.4',
        modelName: 'Special Purpose Vehicle (SPV)',
        category: 'Project-Based Collaboration',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          projectTitle: 'Airport Terminal Expansion - Dammam',
          projectType: 'Infrastructure',
          projectValue: 5000000000,
          projectDuration: 360,
          projectLocation: 'Dammam, Saudi Arabia',
          spvLegalForm: 'LLC',
          sponsors: [
            { name: 'GACA', equity: 35 },
            { name: 'International Airport Operator', equity: 30 },
            { name: 'Local Construction Consortium', equity: 20 },
            { name: 'Aviation Services Provider', equity: 15 }
          ],
          equityStructure: [
            { sponsor: 'GACA', percentage: 35 },
            { sponsor: 'International Airport Operator', percentage: 30 },
            { sponsor: 'Local Construction Consortium', percentage: 20 },
            { sponsor: 'Aviation Services Provider', percentage: 15 }
          ],
          debtFinancing: 3500000000,
          debtType: 'Non-Recourse',
          lenders: ['Saudi National Bank', 'SIDF', 'International Export Credit Agencies'],
          projectPhase: 'Construction',
          revenueModel: 'Aeronautical Charges + Commercial Revenue',
          riskAllocation: 'Construction risks to construction partner, operational risks to operator, regulatory risks to GACA.',
          governanceStructure: 'Board of 9 directors, independent chairman, professional management team.',
          regulatoryApprovals: ['GACA', 'SAMA', 'Ministry of Commerce', 'Customs Authority'],
          exitStrategy: 'Long-term Operation or Refinancing',
          professionalServicesNeeded: ['Legal', 'Financial', 'Technical', 'Aviation', 'Regulatory', 'Security']
        },
        views: 234,
        matchesGenerated: 38,
        applicationsReceived: 20,
        applicationsApproved: 8
      },
      // Model 2.1: Strategic Joint Venture (3rd Example)
      {
        modelId: '2.1',
        modelType: '2.1',
        modelName: 'Strategic Joint Venture',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jvName: 'Saudi Prefabrication Solutions JV',
          strategicObjective: 'Establish leading prefabricated construction solutions provider in Saudi Arabia, combining local manufacturing with international design expertise.',
          businessScope: 'Design, manufacture, and install prefabricated building components including modular units, precast elements, and panelized systems.',
          targetSectors: ['Construction', 'Manufacturing', 'Real Estate'],
          geographicScope: ['Saudi Arabia', 'GCC'],
          duration: '15-20 years',
          jvStructure: 'Incorporated LLC',
          equitySplit: [65, 35],
          initialCapital: 25000000,
          ongoingFunding: 'Equity and Revenue',
          partnerContributions: [
            { partner: 'Local Manufacturing Partner', contribution: 'Manufacturing Facility, Market Access, Local Expertise' },
            { partner: 'International Design Partner', contribution: 'Design Technology, R&D, Innovation' }
          ],
          managementStructure: 'Professional CEO',
          governance: 'Board of 5 directors (3 from majority partner, 2 from minority), CEO reports to board.',
          profitDistribution: 'Proportional to Equity',
          exitOptions: ['Buyout', 'IPO', 'Strategic Sale'],
          nonCompete: true,
          technologyTransfer: true,
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 120M SAR annual revenue' },
            { requirement: 'Manufacturing Capacity', value: 'Existing manufacturing facility' },
            { requirement: 'Technology', value: 'Proven prefabrication technology' }
          ]
        },
        views: 156,
        matchesGenerated: 22,
        applicationsReceived: 9,
        applicationsApproved: 3
      },
      // Model 2.1: Strategic Joint Venture (4th Example)
      {
        modelId: '2.1',
        modelType: '2.1',
        modelName: 'Strategic Joint Venture',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'closed',
        attributes: {
          jvName: 'GCC Logistics and Supply Chain JV',
          strategicObjective: 'Create integrated logistics and supply chain solutions provider across GCC, combining regional network with global logistics expertise.',
          businessScope: 'Provide end-to-end logistics services including warehousing, transportation, customs clearance, and supply chain management.',
          targetSectors: ['Logistics', 'Construction', 'Retail', 'Manufacturing'],
          geographicScope: ['Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman'],
          duration: '10-15 years',
          jvStructure: 'Incorporated LLC',
          equitySplit: [60, 40],
          initialCapital: 30000000,
          ongoingFunding: 'Equity and Revenue',
          partnerContributions: [
            { partner: 'Regional Logistics Partner', contribution: 'Regional Network, Warehouses, Local Expertise' },
            { partner: 'International Logistics Partner', contribution: 'Global Network, Technology, Best Practices' }
          ],
          managementStructure: 'Co-CEOs',
          governance: 'Board of 6 directors (3 from each partner), strategic decisions require board approval.',
          profitDistribution: 'Proportional to Equity',
          exitOptions: ['Buyout', 'IPO'],
          nonCompete: true,
          technologyTransfer: true,
          partnerRequirements: [
            { requirement: 'Network', value: 'Operations in at least 4 GCC countries' },
            { requirement: 'Financial Capacity', value: 'Minimum 150M SAR annual revenue' }
          ]
        },
        views: 67,
        matchesGenerated: 11,
        applicationsReceived: 5,
        applicationsApproved: 2
      },
      // Model 2.1: Strategic Joint Venture (5th Example)
      {
        modelId: '2.1',
        modelType: '2.1',
        modelName: 'Strategic Joint Venture',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jvName: 'Saudi Green Building Materials JV',
          strategicObjective: 'Develop and market sustainable building materials in Saudi Arabia, combining local production with international green technology.',
          businessScope: 'Manufacture and distribute eco-friendly building materials including recycled concrete, sustainable insulation, and green roofing systems.',
          targetSectors: ['Construction', 'Manufacturing', 'Real Estate'],
          geographicScope: ['Saudi Arabia'],
          duration: '20-25 years',
          jvStructure: 'Incorporated LLC',
          equitySplit: [55, 45],
          initialCapital: 18000000,
          ongoingFunding: 'Equity and Revenue',
          partnerContributions: [
            { partner: 'Local Materials Producer', contribution: 'Manufacturing Facility, Market Access, Distribution' },
            { partner: 'Green Technology Partner', contribution: 'Green Technology, R&D, Certifications' }
          ],
          managementStructure: 'Professional CEO',
          governance: 'Board of 5 directors (3 from majority partner, 2 from minority), CEO reports to board.',
          profitDistribution: 'Proportional to Equity',
          exitOptions: ['Buyout', 'Strategic Sale'],
          nonCompete: true,
          technologyTransfer: true,
          partnerRequirements: [
            { requirement: 'Financial Capacity', value: 'Minimum 80M SAR annual revenue' },
            { requirement: 'Manufacturing', value: 'Existing materials manufacturing facility' },
            { requirement: 'Green Certifications', value: 'LEED or equivalent certifications' }
          ]
        },
        views: 123,
        matchesGenerated: 18,
        applicationsReceived: 7,
        applicationsApproved: 3
      },
      // Model 2.2: Long-Term Strategic Alliance (3rd Example)
      {
        modelId: '2.2',
        modelType: '2.2',
        modelName: 'Long-Term Strategic Alliance',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          allianceTitle: 'IT and Digital Solutions Partnership',
          allianceType: 'Technology Partnership',
          strategicObjective: 'Establish long-term technology partnership for digital transformation services including ERP, project management systems, and business intelligence.',
          scopeOfCollaboration: 'Exclusive technology services for all digital transformation needs. Joint development of custom solutions. Priority support and training.',
          duration: 5,
          exclusivity: false,
          geographicScope: ['Saudi Arabia'],
          financialTerms: 'Annual retainer of 200K SAR plus project-based pricing at 20% discount. Minimum commitment: 1M SAR annually.',
          performanceMetrics: [
            { metric: 'System Uptime', target: '99.5%' },
            { metric: 'Response Time', target: 'Within 4 hours' },
            { metric: 'Customer Satisfaction', target: '4.5/5 rating' },
            { metric: 'Project Delivery', target: 'On-time delivery 95%' }
          ],
          governance: 'Quarterly business reviews, monthly technical reviews, joint steering committee with 3 members from each party.',
          terminationConditions: 'Termination with 90 days notice. Immediate termination for material breach or data security issues.',
          partnerRequirements: [
            { requirement: 'Technical Capability', value: 'Proven ERP and digital solutions' },
            { requirement: 'Support Coverage', value: '24/7 support capability' },
            { requirement: 'Security Standards', value: 'ISO 27001 certified' }
          ]
        },
        views: 89,
        matchesGenerated: 13,
        applicationsReceived: 6,
        applicationsApproved: 2
      },
      // Model 2.2: Long-Term Strategic Alliance (4th Example)
      {
        modelId: '2.2',
        modelType: '2.2',
        modelName: 'Long-Term Strategic Alliance',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          allianceTitle: 'Safety Training and Certification Partnership',
          allianceType: 'Training Partnership',
          strategicObjective: 'Establish preferred safety training provider relationship with comprehensive training programs and certification services.',
          scopeOfCollaboration: 'Provide all safety training needs including OSHA, first aid, fire safety, and specialized construction safety. Joint development of custom training programs.',
          duration: 3,
          exclusivity: false,
          geographicScope: ['Saudi Arabia'],
          financialTerms: 'Per-participant pricing at 15% discount. Annual commitment: minimum 500 participants. Group discounts available.',
          performanceMetrics: [
            { metric: 'Certification Pass Rate', target: '90%' },
            { metric: 'Training Quality', target: '4.5/5 rating' },
            { metric: 'Schedule Flexibility', target: 'Within 2 weeks notice' }
          ],
          governance: 'Semi-annual review meetings, joint training committee, annual program evaluation.',
          terminationConditions: 'Termination with 60 days notice. Immediate termination for certification fraud or safety violations.',
          partnerRequirements: [
            { requirement: 'Accreditation', value: 'OSHA or equivalent accreditation' },
            { requirement: 'Instructors', value: 'Certified safety instructors' },
            { requirement: 'Facilities', value: 'Training facilities in major cities' }
          ]
        },
        views: 56,
        matchesGenerated: 9,
        applicationsReceived: 4,
        applicationsApproved: 2
      },
      // Model 2.2: Long-Term Strategic Alliance (5th Example)
      {
        modelId: '2.2',
        modelType: '2.2',
        modelName: 'Long-Term Strategic Alliance',
        category: 'Strategic Partnerships',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          allianceTitle: 'Quality Assurance and Testing Services',
          allianceType: 'Service Partnership',
          strategicObjective: 'Establish preferred quality assurance and testing services partnership for construction materials and systems.',
          scopeOfCollaboration: 'Provide comprehensive QA/QC services including material testing, system testing, and quality audits. Priority scheduling and discounted rates.',
          duration: 4,
          exclusivity: false,
          geographicScope: ['Saudi Arabia'],
          financialTerms: 'Volume-based pricing: 10% discount for annual volume over 500K SAR, 15% for over 1M SAR. Payment terms: 30 days net.',
          performanceMetrics: [
            { metric: 'Test Accuracy', target: '99.9%' },
            { metric: 'Turnaround Time', target: 'Within 5 business days' },
            { metric: 'Customer Satisfaction', target: '4.5/5 rating' }
          ],
          governance: 'Quarterly review meetings, joint quality committee, annual service evaluation.',
          terminationConditions: 'Termination with 90 days notice. Immediate termination for test fraud or quality violations.',
          partnerRequirements: [
            { requirement: 'Accreditation', value: 'ISO 17025 accredited laboratory' },
            { requirement: 'Capabilities', value: 'Full range of construction material testing' },
            { requirement: 'Geographic Coverage', value: 'Labs in major cities' }
          ]
        },
        views: 23,
        matchesGenerated: 5,
        applicationsReceived: 2,
        applicationsApproved: 0
      },
      // Model 2.3: Mentorship Program (3rd Example)
      {
        modelId: '2.3',
        modelType: '2.3',
        modelName: 'Mentorship Program',
        category: 'Strategic Partnerships',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[2]?.id || 'user-1',
        status: 'active',
        attributes: {
          mentorshipTitle: 'Structural Engineering Mentorship',
          mentorshipType: 'Engineering',
          experienceLevel: 'Junior',
          targetSkills: ['Structural Analysis', 'Design Software', 'Code Compliance', 'Report Writing'],
          duration: 12,
          frequency: 'Bi-Weekly',
          format: 'Hybrid',
          compensation: 'Unpaid',
          barterOffer: '',
          mentorRequirements: [
            { requirement: 'Experience', value: 'Minimum 12 years in structural engineering' },
            { requirement: 'Certifications', value: 'Professional Engineering License' },
            { requirement: 'Industry', value: 'High-rise and complex structure experience' }
          ],
          menteeBackground: 'Junior structural engineer with 1 year experience seeking guidance on complex structural design and analysis.',
          successMetrics: ['Skill Development', 'Design Competency', 'Career Growth']
        },
        views: 45,
        matchesGenerated: 8,
        applicationsReceived: 5,
        applicationsApproved: 2
      },
      // Model 2.3: Mentorship Program (4th Example)
      {
        modelId: '2.3',
        modelType: '2.3',
        modelName: 'Mentorship Program',
        category: 'Strategic Partnerships',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[2]?.id || 'user-1',
        status: 'active',
        attributes: {
          mentorshipTitle: 'Construction Site Management Mentorship',
          mentorshipType: 'Site Management',
          experienceLevel: 'Mid-Level',
          targetSkills: ['Site Coordination', 'Safety Management', 'Quality Control', 'Team Leadership'],
          duration: 18,
          frequency: 'Weekly',
          format: 'On-Site',
          compensation: 'Unpaid',
          barterOffer: '',
          mentorRequirements: [
            { requirement: 'Experience', value: 'Minimum 18 years in construction site management' },
            { requirement: 'Certifications', value: 'Safety certifications, PMP preferred' },
            { requirement: 'Industry', value: 'Large-scale construction project experience' }
          ],
          menteeBackground: 'Mid-level site engineer with 4 years experience seeking advanced skills in managing large construction sites.',
          successMetrics: ['Site Management Skills', 'Safety Performance', 'Career Advancement']
        },
        views: 38,
        matchesGenerated: 6,
        applicationsReceived: 4,
        applicationsApproved: 1
      },
      // Model 2.3: Mentorship Program (5th Example)
      {
        modelId: '2.3',
        modelType: '2.3',
        modelName: 'Mentorship Program',
        category: 'Strategic Partnerships',
        relationshipType: 'P2P',
        creatorId: testUsers.find(u => u.role === 'individual')?.id || testUsers[2]?.id || 'user-1',
        status: 'closed',
        attributes: {
          mentorshipTitle: 'Cost Estimation and Budgeting Mentorship',
          mentorshipType: 'Cost Management',
          experienceLevel: 'Junior',
          targetSkills: ['Cost Estimation', 'Budget Development', 'Cost Control', 'Financial Analysis'],
          duration: 10,
          frequency: 'Bi-Weekly',
          format: 'Remote',
          compensation: 'Unpaid',
          barterOffer: '',
          mentorRequirements: [
            { requirement: 'Experience', value: 'Minimum 15 years in cost estimation' },
            { requirement: 'Certifications', value: 'CCE or equivalent certification' },
            { requirement: 'Industry', value: 'Construction cost estimation experience' }
          ],
          menteeBackground: 'Junior estimator with 2 years experience seeking comprehensive guidance on accurate cost estimation and budget management.',
          successMetrics: ['Estimation Accuracy', 'Budget Management', 'Professional Growth']
        },
        views: 19,
        matchesGenerated: 3,
        applicationsReceived: 2,
        applicationsApproved: 1
      },
      // Model 3.1: Bulk Purchasing (3rd Example)
      {
        modelId: '3.1',
        modelType: '3.1',
        modelName: 'Bulk Purchasing',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          productService: 'Aluminum Windows and Doors',
          category: 'Materials',
          quantityNeeded: 2000,
          unitOfMeasure: 'Units',
          targetPrice: 850,
          currentMarketPrice: 950,
          expectedSavings: 10.5,
          deliveryTimeline: { start: '2024-04-10', end: '2024-05-30' },
          deliveryLocation: 'Riyadh, Saudi Arabia',
          paymentStructure: 'Upfront Collection',
          participantsNeeded: 6,
          minimumOrder: 200,
          leadOrganizer: true,
          supplier: 'Saudi Aluminum Company',
          distributionMethod: 'Centralized Warehouse'
        },
        views: 134,
        matchesGenerated: 20,
        applicationsReceived: 14,
        applicationsApproved: 8
      },
      // Model 3.1: Bulk Purchasing (4th Example)
      {
        modelId: '3.1',
        modelType: '3.1',
        modelName: 'Bulk Purchasing',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          productService: 'Electrical Cables and Wires',
          category: 'Materials',
          quantityNeeded: 50000,
          unitOfMeasure: 'Meters',
          targetPrice: 12,
          currentMarketPrice: 14,
          expectedSavings: 14.3,
          deliveryTimeline: { start: '2024-05-01', end: '2024-06-15' },
          deliveryLocation: 'Multiple Sites - Jeddah, Dammam',
          paymentStructure: 'Upfront Collection',
          participantsNeeded: 10,
          minimumOrder: 3000,
          leadOrganizer: true,
          supplier: 'Saudi Cable Company',
          distributionMethod: 'Direct to Site'
        },
        views: 178,
        matchesGenerated: 26,
        applicationsReceived: 18,
        applicationsApproved: 10
      },
      // Model 3.1: Bulk Purchasing (5th Example)
      {
        modelId: '3.1',
        modelType: '3.1',
        modelName: 'Bulk Purchasing',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          productService: 'Insulation Materials - Rockwool',
          category: 'Materials',
          quantityNeeded: 3000,
          unitOfMeasure: 'Square Meters',
          targetPrice: 45,
          currentMarketPrice: 52,
          expectedSavings: 13.5,
          deliveryTimeline: { start: '2024-06-01', end: '2024-07-31' },
          deliveryLocation: 'Riyadh, Saudi Arabia',
          paymentStructure: '50% Advance, 50% on Delivery',
          participantsNeeded: 7,
          minimumOrder: 300,
          leadOrganizer: true,
          supplier: 'Saudi Insulation Company',
          distributionMethod: 'Centralized Pickup'
        },
        views: 28,
        matchesGenerated: 6,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 3.2: Co-Ownership Pooling (3rd Example)
      {
        modelId: '3.2',
        modelType: '3.2',
        modelName: 'Co-Ownership Pooling',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          assetDescription: 'Mobile Concrete Laboratory',
          assetType: 'Equipment',
          purchasePrice: 1800000,
          ownershipStructure: 'Equal Shares',
          numberCoOwners: 4,
          equityPerOwner: 25,
          initialInvestment: 450000,
          ongoingCosts: [
            { cost: 'Maintenance', amount: 40000, frequency: 'Annual' },
            { cost: 'Insurance', amount: 25000, frequency: 'Annual' },
            { cost: 'Calibration', amount: 15000, frequency: 'Annual' }
          ],
          costSharing: 'Equally',
          usageSchedule: 'Booking System',
          assetLocation: 'Mobile - Various Sites',
          maintenanceResponsibility: 'Shared with Rotation',
          insurance: true,
          exitStrategy: 'Sell Share to Other Owners',
          disputeResolution: 'Mediation'
        },
        views: 67,
        matchesGenerated: 10,
        applicationsReceived: 5,
        applicationsApproved: 3
      },
      // Model 3.2: Co-Ownership Pooling (4th Example)
      {
        modelId: '3.2',
        modelType: '3.2',
        modelName: 'Co-Ownership Pooling',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          assetDescription: 'Heavy-Duty Excavator 50 Ton',
          assetType: 'Heavy Equipment',
          purchasePrice: 3200000,
          ownershipStructure: 'Proportional Shares',
          numberCoOwners: 5,
          equityPerOwner: 20,
          initialInvestment: 640000,
          ongoingCosts: [
            { cost: 'Maintenance', amount: 120000, frequency: 'Annual' },
            { cost: 'Insurance', amount: 80000, frequency: 'Annual' },
            { cost: 'Storage', amount: 30000, frequency: 'Annual' }
          ],
          costSharing: 'Proportional to Ownership',
          usageSchedule: 'Priority Booking System',
          assetLocation: 'Riyadh Equipment Yard',
          maintenanceResponsibility: 'Shared',
          insurance: true,
          exitStrategy: 'Right of First Refusal',
          disputeResolution: 'Arbitration'
        },
        views: 145,
        matchesGenerated: 22,
        applicationsReceived: 12,
        applicationsApproved: 5
      },
      // Model 3.2: Co-Ownership Pooling (5th Example)
      {
        modelId: '3.2',
        modelType: '3.2',
        modelName: 'Co-Ownership Pooling',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          assetDescription: 'Survey Equipment Package - Total Station & GPS',
          assetType: 'Equipment',
          purchasePrice: 450000,
          ownershipStructure: 'Equal Shares',
          numberCoOwners: 3,
          equityPerOwner: 33.33,
          initialInvestment: 150000,
          ongoingCosts: [
            { cost: 'Maintenance', amount: 15000, frequency: 'Annual' },
            { cost: 'Insurance', amount: 10000, frequency: 'Annual' },
            { cost: 'Calibration', amount: 8000, frequency: 'Annual' }
          ],
          costSharing: 'Equally',
          usageSchedule: 'Booking System',
          assetLocation: 'Jeddah Office',
          maintenanceResponsibility: 'Shared',
          insurance: true,
          exitStrategy: 'Sell Share to Other Owners',
          disputeResolution: 'Mediation'
        },
        views: 34,
        matchesGenerated: 6,
        applicationsReceived: 3,
        applicationsApproved: 1
      },
      // Model 3.3: Resource Sharing & Exchange (3rd Example)
      {
        modelId: '3.3',
        modelType: '3.3',
        modelName: 'Resource Sharing & Exchange',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          resourceTitle: 'Excess Rebar - Grade 60, Various Sizes',
          resourceType: 'Materials',
          transactionType: 'Sell',
          detailedDescription: 'Surplus reinforcement steel bars from completed project. Grade 60, various sizes (12mm, 16mm, 20mm, 25mm). Total 80 tons. Excellent condition, stored in covered warehouse.',
          quantity: 80,
          unitOfMeasure: 'Tons',
          condition: 'Excellent',
          location: 'Dammam, Saudi Arabia',
          availability: { start: '2024-04-01', end: '2024-05-31' },
          price: 3200,
          barterOffer: '',
          barterPreferences: [],
          delivery: 'Buyer Pickup',
          paymentTerms: 'On Delivery',
          urgency: 'Within 1 Month'
        },
        views: 167,
        matchesGenerated: 21,
        applicationsReceived: 12,
        applicationsApproved: 4
      },
      // Model 3.3: Resource Sharing & Exchange (4th Example)
      {
        modelId: '3.3',
        modelType: '3.3',
        modelName: 'Resource Sharing & Exchange',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          resourceTitle: 'Scaffolding System - Frame Scaffold',
          resourceType: 'Equipment',
          transactionType: 'Rent',
          detailedDescription: 'Complete frame scaffolding system available for rent. Includes frames, cross braces, planks, and safety equipment. Total 5000 sqm coverage. Excellent condition, recently inspected.',
          quantity: 5000,
          unitOfMeasure: 'Square Meters',
          condition: 'Excellent',
          location: 'Riyadh, Saudi Arabia',
          availability: { start: '2024-03-25', end: '2024-08-31' },
          price: 8,
          barterOffer: '',
          barterPreferences: ['Construction Services'],
          delivery: 'Renter Pickup',
          paymentTerms: 'Monthly in Advance',
          urgency: 'Within 2 Months'
        },
        views: 234,
        matchesGenerated: 28,
        applicationsReceived: 16,
        applicationsApproved: 5
      },
      // Model 3.3: Resource Sharing & Exchange (5th Example)
      {
        modelId: '3.3',
        modelType: '3.3',
        modelName: 'Resource Sharing & Exchange',
        category: 'Resource Pooling & Sharing',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          resourceTitle: 'Excess Tiles - Ceramic Floor Tiles',
          resourceType: 'Materials',
          transactionType: 'Sell',
          detailedDescription: 'Surplus ceramic floor tiles from completed project. Various sizes and colors. Total 5000 sqm. Brand new, original packaging. Stored in warehouse.',
          quantity: 5000,
          unitOfMeasure: 'Square Meters',
          condition: 'New',
          location: 'Jeddah, Saudi Arabia',
          availability: { start: '2024-04-10', end: '2024-06-30' },
          price: 45,
          barterOffer: '',
          barterPreferences: ['Other Materials'],
          delivery: 'Buyer Pickup',
          paymentTerms: 'On Delivery',
          urgency: 'Within 2 Months'
        },
        views: 98,
        matchesGenerated: 14,
        applicationsReceived: 8,
        applicationsApproved: 3
      },
      // Model 4.1: Professional Hiring (3rd Example)
      {
        modelId: '4.1',
        modelType: '4.1',
        modelName: 'Professional Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jobTitle: 'Quantity Surveyor',
          jobCategory: 'Cost Management',
          employmentType: 'Full-Time',
          contractDuration: null,
          jobDescription: 'Prepare cost estimates, manage budgets, track project costs, and provide financial reporting. Work closely with project managers and procurement team.',
          requiredQualifications: ['Bachelor in Quantity Surveying or Civil Engineering', 'Saudi Council of Engineers License'],
          requiredExperience: 5,
          requiredSkills: ['Cost Estimation', 'Budget Management', 'Contract Administration', 'Excel', 'CostX'],
          preferredSkills: ['BIM', 'Primavera', 'Financial Analysis'],
          location: 'Jeddah, Saudi Arabia',
          workMode: 'On-Site',
          salaryRange: { min: 12000, max: 16000, currency: 'SAR' },
          benefits: ['Health Insurance', 'Housing Allowance', 'Transportation', 'Annual Leave'],
          startDate: '2024-05-15',
          reportingTo: 'Project Director',
          teamSize: 3,
          applicationDeadline: '2024-05-01'
        },
        views: 201,
        matchesGenerated: 30,
        applicationsReceived: 19,
        applicationsApproved: 6
      },
      // Model 4.1: Professional Hiring (4th Example)
      {
        modelId: '4.1',
        modelType: '4.1',
        modelName: 'Professional Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          jobTitle: 'Safety Manager',
          jobCategory: 'Safety',
          employmentType: 'Full-Time',
          contractDuration: null,
          jobDescription: 'Develop and implement safety programs, conduct safety inspections, train staff, and ensure compliance with safety regulations. Manage safety team.',
          requiredQualifications: ['Bachelor in Safety Engineering or related field', 'OSHA or NEBOSH Certification'],
          requiredExperience: 7,
          requiredSkills: ['Safety Management', 'Risk Assessment', 'Training', 'Regulatory Compliance', 'Incident Investigation'],
          preferredSkills: ['ISO 45001', 'Safety Auditing', 'Emergency Response'],
          location: 'Riyadh, Saudi Arabia',
          workMode: 'On-Site',
          salaryRange: { min: 14000, max: 19000, currency: 'SAR' },
          benefits: ['Health Insurance', 'Housing Allowance', 'Transportation', 'Annual Leave', 'Safety Allowance'],
          startDate: '2024-06-01',
          reportingTo: 'Operations Manager',
          teamSize: 6,
          applicationDeadline: '2024-05-15'
        },
        views: 178,
        matchesGenerated: 26,
        applicationsReceived: 16,
        applicationsApproved: 5
      },
      // Model 4.1: Professional Hiring (5th Example)
      {
        modelId: '4.1',
        modelType: '4.1',
        modelName: 'Professional Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          jobTitle: 'MEP Coordinator',
          jobCategory: 'Engineering',
          employmentType: 'Full-Time',
          contractDuration: null,
          jobDescription: 'Coordinate MEP systems installation, manage MEP team, resolve conflicts, and ensure quality standards. Interface with design and construction teams.',
          requiredQualifications: ['Bachelor in Mechanical or Electrical Engineering', 'Saudi Council of Engineers License'],
          requiredExperience: 6,
          requiredSkills: ['MEP Coordination', 'AutoCAD', 'Revit MEP', 'Team Management', 'Quality Control'],
          preferredSkills: ['BIM Coordination', 'Navisworks', 'Clash Detection'],
          location: 'Dammam, Saudi Arabia',
          workMode: 'On-Site',
          salaryRange: { min: 13000, max: 18000, currency: 'SAR' },
          benefits: ['Health Insurance', 'Housing Allowance', 'Transportation', 'Annual Leave'],
          startDate: '2024-07-01',
          reportingTo: 'Project Manager',
          teamSize: 4,
          applicationDeadline: '2024-06-15'
        },
        views: 45,
        matchesGenerated: 8,
        applicationsReceived: 4,
        applicationsApproved: 1
      },
      // Model 4.2: Consultant Hiring (3rd Example)
      {
        modelId: '4.2',
        modelType: '4.2',
        modelName: 'Consultant Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          consultationTitle: 'Value Engineering Consultant',
          consultationType: 'Cost Optimization',
          scopeOfWork: 'Conduct value engineering study for project, identify cost optimization opportunities, and provide recommendations. Review design and suggest alternatives.',
          deliverables: ['Value Engineering Report', 'Cost-Benefit Analysis', 'Alternative Solutions', 'Implementation Plan', 'Savings Estimate'],
          duration: 60,
          requiredExpertise: ['Value Engineering', 'Cost Analysis', 'Design Optimization', 'Construction Methods'],
          requiredCertifications: ['VE Certification preferred'],
          experienceLevel: 'Expert',
          locationRequirement: 'Hybrid',
          budget: { min: 100000, max: 150000, currency: 'SAR' },
          paymentTerms: 'Milestone-Based',
          startDate: '2024-05-01',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 112,
        matchesGenerated: 15,
        applicationsReceived: 8,
        applicationsApproved: 2
      },
      // Model 4.2: Consultant Hiring (4th Example)
      {
        modelId: '4.2',
        modelType: '4.2',
        modelName: 'Consultant Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          consultationTitle: 'Claims and Dispute Resolution Consultant',
          consultationType: 'Legal',
          scopeOfWork: 'Review contract claims, provide dispute resolution services, prepare claim documentation, and represent in negotiations or arbitration.',
          deliverables: ['Claim Analysis', 'Documentation Package', 'Negotiation Strategy', 'Settlement Agreement', 'Final Report'],
          duration: 90,
          requiredExpertise: ['Construction Law', 'Claims Management', 'Dispute Resolution', 'Contract Administration'],
          requiredCertifications: ['Legal qualification or construction claims certification'],
          experienceLevel: 'Expert',
          locationRequirement: 'Hybrid',
          budget: { min: 200000, max: 300000, currency: 'SAR' },
          paymentTerms: 'Milestone-Based',
          startDate: '2024-04-20',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 145,
        matchesGenerated: 19,
        applicationsReceived: 10,
        applicationsApproved: 3
      },
      // Model 4.2: Consultant Hiring (5th Example)
      {
        modelId: '4.2',
        modelType: '4.2',
        modelName: 'Consultant Hiring',
        category: 'Hiring a Resource',
        relationshipType: 'B2P',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'draft',
        attributes: {
          consultationTitle: 'BIM Implementation Consultant',
          consultationType: 'Technology',
          scopeOfWork: 'Develop BIM implementation strategy, establish BIM standards, train team, and provide ongoing support. Ensure successful BIM adoption across projects.',
          deliverables: ['BIM Implementation Plan', 'BIM Standards Document', 'Training Program', 'Support Documentation', 'Progress Reports'],
          duration: 180,
          requiredExpertise: ['BIM Implementation', 'BIM Standards', 'Training', 'Change Management', 'Technology Integration'],
          requiredCertifications: ['BIM Professional Certification'],
          experienceLevel: 'Expert',
          locationRequirement: 'Hybrid',
          budget: { min: 180000, max: 250000, currency: 'SAR' },
          paymentTerms: 'Milestone-Based',
          startDate: '2024-06-01',
          exchangeType: 'Cash',
          barterOffer: ''
        },
        views: 34,
        matchesGenerated: 6,
        applicationsReceived: 3,
        applicationsApproved: 0
      },
      // Model 5.1: Competition/RFP (3rd Example)
      {
        modelId: '5.1',
        modelType: '5.1',
        modelName: 'Competition/RFP',
        category: 'Call for Competition',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          competitionTitle: 'Innovative Facade Design Competition - Iconic Tower',
          competitionType: 'Design Competition',
          competitionScope: 'Design an innovative, energy-efficient facade system for 300m iconic tower. Must incorporate smart glass technology, solar integration, and aesthetic excellence.',
          participantType: 'Both',
          competitionFormat: 'Open to All',
          eligibilityCriteria: [
            { criterion: 'Experience', value: 'Minimum 8 years in facade design' },
            { criterion: 'Certifications', value: 'Professional license or equivalent' },
            { criterion: 'Financial Capacity', value: 'Able to execute if selected' }
          ],
          submissionRequirements: ['Design Proposal', 'Technical Drawings', 'Energy Analysis', 'Cost Estimate', 'Material Specifications', 'Timeline'],
          evaluationCriteria: [
            { criterion: 'Design Excellence', weight: 30 },
            { criterion: 'Energy Efficiency', weight: 25 },
            { criterion: 'Innovation', weight: 20 },
            { criterion: 'Cost Efficiency', weight: 15 },
            { criterion: 'Feasibility', weight: 10 }
          ],
          evaluationWeights: [30, 25, 20, 15, 10],
          prizeContractValue: 6000000,
          numberWinners: 2,
          submissionDeadline: '2024-07-15',
          announcementDate: '2024-08-01',
          competitionRules: 'All submissions become property of client. Winners must execute project within 30 months. Non-winners retain IP but grant client usage rights.',
          intellectualProperty: 'Winner Transfers',
          submissionFee: 0
        },
        views: 189,
        matchesGenerated: 28,
        applicationsReceived: 18,
        applicationsApproved: 2
      },
      // Model 5.1: Competition/RFP (4th Example)
      {
        modelId: '5.1',
        modelType: '5.1',
        modelName: 'Competition/RFP',
        category: 'Call for Competition',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'active',
        attributes: {
          competitionTitle: 'Smart Building Systems RFP',
          competitionType: 'RFP',
          competitionScope: 'Design and implement comprehensive smart building systems including IoT sensors, building automation, energy management, and security systems.',
          participantType: 'Both',
          competitionFormat: 'Invited Only',
          eligibilityCriteria: [
            { criterion: 'Experience', value: 'Minimum 5 years in smart building systems' },
            { criterion: 'Certifications', value: 'Relevant technology certifications' },
            { criterion: 'Financial Capacity', value: 'Able to execute 10M+ SAR project' }
          ],
          submissionRequirements: ['Technical Proposal', 'System Architecture', 'Implementation Plan', 'Cost Proposal', 'Timeline', 'Support Plan'],
          evaluationCriteria: [
            { criterion: 'Technical Solution', weight: 40 },
            { criterion: 'Cost', weight: 30 },
            { criterion: 'Implementation Timeline', weight: 15 },
            { criterion: 'Support and Maintenance', weight: 15 }
          ],
          evaluationWeights: [40, 30, 15, 15],
          prizeContractValue: 10000000,
          numberWinners: 1,
          submissionDeadline: '2024-06-30',
          announcementDate: '2024-07-15',
          competitionRules: 'Selected vendor must execute project within 18 months. Performance guarantees required.',
          intellectualProperty: 'Client Owns',
          submissionFee: 0
        },
        views: 167,
        matchesGenerated: 24,
        applicationsReceived: 12,
        applicationsApproved: 1
      },
      // Model 5.1: Competition/RFP (5th Example)
      {
        modelId: '5.1',
        modelType: '5.1',
        modelName: 'Competition/RFP',
        category: 'Call for Competition',
        relationshipType: 'B2B',
        creatorId: testUsers[2]?.id || testUsers[0]?.id || 'user-1',
        status: 'pending',
        attributes: {
          competitionTitle: 'Landscape Design Competition - Public Park',
          competitionType: 'Design Competition',
          competitionScope: 'Design comprehensive landscape solution for 50-hectare public park including hardscape, softscape, water features, and recreational facilities.',
          participantType: 'Both',
          competitionFormat: 'Open to All',
          eligibilityCriteria: [
            { criterion: 'Experience', value: 'Minimum 5 years in landscape design' },
            { criterion: 'Certifications', value: 'Landscape architecture license preferred' },
            { criterion: 'Portfolio', value: 'At least 3 public park projects' }
          ],
          submissionRequirements: ['Design Proposal', 'Master Plan', 'Planting Plan', 'Irrigation Design', 'Cost Estimate', 'Maintenance Plan', 'Timeline'],
          evaluationCriteria: [
            { criterion: 'Design Quality', weight: 35 },
            { criterion: 'Sustainability', weight: 25 },
            { criterion: 'Maintenance', weight: 20 },
            { criterion: 'Cost Efficiency', weight: 20 }
          ],
          evaluationWeights: [35, 25, 20, 20],
          prizeContractValue: 4000000,
          numberWinners: 3,
          submissionDeadline: '2024-08-30',
          announcementDate: '2024-09-15',
          competitionRules: 'All submissions become property of client. Winners must execute project within 24 months.',
          intellectualProperty: 'Winner Transfers',
          submissionFee: 2000
        },
        views: 78,
        matchesGenerated: 12,
        applicationsReceived: 7,
        applicationsApproved: 0
      }
    ];

    if (forceReload) {
      // Clear existing opportunities
      set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, []);
    }

    // Helper function to generate random views and applications
    function generateTestMetrics(index) {
      // Generate varied but realistic numbers
      const baseViews = 10 + (index % 50); // 10-60 base views
      const views = baseViews + Math.floor(Math.random() * 100); // Add random 0-100
      
      const baseApplications = Math.floor(views * 0.15); // ~15% of views become applications
      const applicationsReceived = baseApplications + Math.floor(Math.random() * 10);
      const applicationsApproved = Math.floor(applicationsReceived * (0.2 + Math.random() * 0.3)); // 20-50% approval rate
      
      return {
        views: views,
        matchesGenerated: Math.floor(views * 0.3), // ~30% of views generate matches
        applicationsReceived: applicationsReceived,
        applicationsApproved: applicationsApproved
      };
    }

    let loaded = 0;
    let skipped = 0;
    sampleOpportunities.forEach((oppData, index) => {
      // Ensure all opportunities have views and applications
      if (!oppData.views && oppData.views !== 0) {
        const metrics = generateTestMetrics(index);
        oppData.views = metrics.views;
        oppData.matchesGenerated = metrics.matchesGenerated;
        oppData.applicationsReceived = metrics.applicationsReceived;
        oppData.applicationsApproved = metrics.applicationsApproved;
      }
      
      // Skip duplicate check if forceReload is true (we already cleared the data)
      if (!forceReload) {
        // Check if opportunity already exists (more strict check to avoid false duplicates)
        const existing = CollaborationOpportunities.getAll().find(o => {
        // Must match modelId
        if (o.modelId !== oppData.modelId) return false;
        
        // Check for exact title match based on model type
        if (oppData.attributes?.taskTitle) {
          return o.attributes?.taskTitle === oppData.attributes?.taskTitle;
        }
        if (oppData.attributes?.projectTitle) {
          return o.attributes?.projectTitle === oppData.attributes?.projectTitle;
        }
        if (oppData.attributes?.competitionTitle) {
          return o.attributes?.competitionTitle === oppData.attributes?.competitionTitle;
        }
        if (oppData.attributes?.jvName) {
          return o.attributes?.jvName === oppData.attributes?.jvName;
        }
        if (oppData.attributes?.allianceTitle) {
          return o.attributes?.allianceTitle === oppData.attributes?.allianceTitle;
        }
        if (oppData.attributes?.mentorshipTitle) {
          return o.attributes?.mentorshipTitle === oppData.attributes?.mentorshipTitle;
        }
        if (oppData.attributes?.productService) {
          return o.attributes?.productService === oppData.attributes?.productService &&
                 o.attributes?.quantityNeeded === oppData.attributes?.quantityNeeded;
        }
        if (oppData.attributes?.assetDescription) {
          return o.attributes?.assetDescription === oppData.attributes?.assetDescription;
        }
        if (oppData.attributes?.resourceTitle) {
          return o.attributes?.resourceTitle === oppData.attributes?.resourceTitle;
        }
        if (oppData.attributes?.jobTitle) {
          return o.attributes?.jobTitle === oppData.attributes?.jobTitle;
        }
        if (oppData.attributes?.consultationTitle) {
          return o.attributes?.consultationTitle === oppData.attributes?.consultationTitle;
        }
        
        return false;
        });
        
        if (existing) {
          skipped++;
          return; // Skip this opportunity
        }
      }
      
      // Create the opportunity
      const opportunity = CollaborationOpportunities.create(oppData);
      if (opportunity) {
        loaded++;
      }
    });

    if (loaded > 0) {
      console.log(`✅ Loaded ${loaded} sample collaboration opportunities${skipped > 0 ? ` (${skipped} skipped as duplicates)` : ''}`);
    } else if (skipped > 0) {
      console.log(`ℹ️ All ${skipped} opportunities already exist. Use forceReload=true to reload.`);
    }
    
    // Update all opportunities with views and applications test data
    updateOpportunitiesWithTestData();
  }
  
  // ============================================
  // Update All Opportunities with Views and Applications Test Data
  // ============================================
  function updateOpportunitiesWithTestData() {
    const opportunities = CollaborationOpportunities.getAll();
    if (opportunities.length === 0) {
      console.log('No opportunities found to update');
      return;
    }
    
    let updated = 0;
    opportunities.forEach(opportunity => {
      let needsUpdate = false;
      const updates = {};
      
      // Generate realistic test data based on opportunity status and type
      const isActive = opportunity.status === 'active';
      const baseViews = isActive ? Math.floor(Math.random() * 100) + 20 : Math.floor(Math.random() * 30) + 5;
      const baseApplications = isActive ? Math.floor(Math.random() * 15) + 3 : Math.floor(Math.random() * 5);
      
      // Update views (if 0 or missing)
      if (!opportunity.views || opportunity.views === 0) {
        updates.views = baseViews;
        needsUpdate = true;
      }
      
      // Update applications (if 0 or missing)
      if (!opportunity.applicationsReceived || opportunity.applicationsReceived === 0) {
        updates.applicationsReceived = baseApplications;
        needsUpdate = true;
        
        // Set approved applications (typically 20-40% of received)
        if (!opportunity.applicationsApproved || opportunity.applicationsApproved === 0) {
          updates.applicationsApproved = Math.floor(baseApplications * (0.2 + Math.random() * 0.2));
        }
      }
      
      // Update matches generated (typically 50-80% of views)
      if (!opportunity.matchesGenerated || opportunity.matchesGenerated === 0) {
        const currentViews = updates.views || opportunity.views || baseViews;
        updates.matchesGenerated = Math.floor(currentViews * (0.5 + Math.random() * 0.3));
        needsUpdate = true;
      }
      
      // Save updated opportunity if needed
      if (needsUpdate) {
        CollaborationOpportunities.update(opportunity.id, updates);
        updated++;
      }
    });
    
    if (updated > 0) {
      console.log(`✅ Updated ${updated} opportunities with views and applications test data`);
    } else {
      console.log(`ℹ️ All opportunities already have views and applications data`);
    }
  }

  // ============================================
  // Load Sample Collaboration Applications
  // ============================================
  function loadSampleCollaborationApplications(forceReload = false) {
    const existingApplications = CollaborationApplications.getAll();
    
    // Only load if no applications exist, unless forceReload is true
    if (existingApplications.length > 0 && !forceReload) {
      return;
    }

    // Get test users for applicants
    const users = Users.getAll();
    const testUsers = users.filter(u => ['entity', 'company', 'individual', 'admin'].includes(u.role));
    if (testUsers.length === 0) {
      console.warn('No test users found for collaboration applications');
      return;
    }

    // Get existing opportunities to link applications to
    const opportunities = CollaborationOpportunities.getAll();
    if (opportunities.length === 0) {
      console.warn('No opportunities found. Please load opportunities first.');
      return;
    }

    // Create sample applications for various opportunities
    const sampleApplications = [];
    const statuses = ['pending', 'reviewing', 'approved', 'rejected', 'withdrawn'];
    const applicationNotes = [
      'We have extensive experience in similar projects and believe we can deliver excellent results.',
      'Our team has the required skills and certifications. We are excited about this opportunity.',
      'We have successfully completed multiple projects of this nature and can provide references.',
      'We are interested in this collaboration and can start immediately upon approval.',
      'Our company has a strong track record and we are confident in our ability to meet all requirements.',
      'We have the necessary resources and expertise to contribute effectively to this project.',
      'This opportunity aligns perfectly with our capabilities and strategic goals.',
      'We are committed to delivering high-quality results and meeting all project objectives.'
    ];

    // Create applications for at least 50% of opportunities
    const opportunitiesToUse = opportunities.slice(0, Math.ceil(opportunities.length * 0.6));
    
    opportunitiesToUse.forEach((opportunity, oppIndex) => {
      // Create 2-4 applications per opportunity
      const numApplications = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < numApplications; i++) {
        const applicantIndex = (oppIndex + i) % testUsers.length;
        const applicant = testUsers[applicantIndex];
        
        // Don't create application if applicant is the creator
        if (applicant.id === opportunity.creatorId) {
          continue;
        }

        // Distribute statuses: more pending/reviewing, fewer approved/rejected
        let status;
        const rand = Math.random();
        if (rand < 0.4) {
          status = 'pending';
        } else if (rand < 0.7) {
          status = 'reviewing';
        } else if (rand < 0.85) {
          status = 'approved';
        } else if (rand < 0.95) {
          status = 'rejected';
        } else {
          status = 'withdrawn';
        }

        // Create submission date (within last 30 days)
        const daysAgo = Math.floor(Math.random() * 30);
        const submittedDate = new Date();
        submittedDate.setDate(submittedDate.getDate() - daysAgo);

        sampleApplications.push({
          opportunityId: opportunity.id,
          applicantId: applicant.id,
          status: status === 'reviewing' ? 'in_review' : status, // Map reviewing to in_review for compatibility
          notes: applicationNotes[Math.floor(Math.random() * applicationNotes.length)],
          submittedAt: submittedDate.toISOString()
        });
      }
    });

    if (forceReload) {
      // Clear existing applications
      set(STORAGE_KEYS.COLLABORATION_APPLICATIONS, []);
    }

    let loaded = 0;
    sampleApplications.forEach(appData => {
      // Check if application already exists
      const existing = CollaborationApplications.getAll().find(a => 
        a.opportunityId === appData.opportunityId && 
        a.applicantId === appData.applicantId
      );
      
      if (!existing) {
        const application = CollaborationApplications.create(appData);
        if (application) {
          loaded++;
        }
      }
    });

    if (loaded > 0) {
      console.log(`✅ Loaded ${loaded} sample collaboration applications`);
    }
  }

  // ============================================
  // Collaboration Applications CRUD
  // ============================================
  const CollaborationApplications = {
    getAll() {
      return get(STORAGE_KEYS.COLLABORATION_APPLICATIONS);
    },

    getById(id) {
      const applications = this.getAll();
      return applications.find(a => a.id === id) || null;
    },

    getByOpportunity(opportunityId) {
      const applications = this.getAll();
      return applications.filter(a => a.opportunityId === opportunityId);
    },

    getByApplicant(applicantId) {
      const applications = this.getAll();
      return applications.filter(a => a.applicantId === applicantId);
    },

    getByStatus(status) {
      const applications = this.getAll();
      return applications.filter(a => a.status === status);
    },

    create(applicationData) {
      const applications = this.getAll();
      const application = {
        id: generateId('collab_app'),
        ...applicationData,
        status: applicationData.status || 'pending',
        submittedAt: new Date().toISOString()
      };
      applications.push(application);
      if (set(STORAGE_KEYS.COLLABORATION_APPLICATIONS, applications)) {
        // Update opportunity application count
        const opportunity = CollaborationOpportunities.getById(application.opportunityId);
        if (opportunity) {
          opportunity.applicationsReceived = (opportunity.applicationsReceived || 0) + 1;
          CollaborationOpportunities.update(application.opportunityId, { 
            applicationsReceived: opportunity.applicationsReceived 
          });
        }
        this.createAuditLog('collaboration_application_submission', application.id, {
          description: `Application submitted for collaboration: ${opportunity?.modelName || application.opportunityId}`,
          opportunityId: application.opportunityId,
          applicantId: application.applicantId,
          modelType: opportunity?.modelType
        });
        return application;
      }
      return null;
    },

    update(id, updates) {
      const applications = this.getAll();
      const index = applications.findIndex(a => a.id === id);
      if (index === -1) return null;

      const oldApplication = { ...applications[index] };
      applications[index] = {
        ...applications[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'approved' && oldApplication.status !== 'approved') {
        applications[index].approvedAt = new Date().toISOString();
        // Update opportunity approved count
        const opportunity = CollaborationOpportunities.getById(applications[index].opportunityId);
        if (opportunity) {
          opportunity.applicationsApproved = (opportunity.applicationsApproved || 0) + 1;
          CollaborationOpportunities.update(applications[index].opportunityId, { 
            applicationsApproved: opportunity.applicationsApproved 
          });
        }
      }
      if (updates.status === 'rejected' && oldApplication.status !== 'rejected') {
        applications[index].rejectedAt = new Date().toISOString();
      }
      if (updates.status === 'completed' && oldApplication.status !== 'completed') {
        applications[index].completedAt = new Date().toISOString();
      }

      if (set(STORAGE_KEYS.COLLABORATION_APPLICATIONS, applications)) {
        this.createAuditLog('collaboration_application_status_change', id, {
          description: `Application status changed: ${oldApplication.status} → ${updates.status}`,
          changes: { before: oldApplication, after: applications[index] }
        });
        return applications[index];
      }
      return null;
    },

    delete(id) {
      const applications = this.getAll();
      const filtered = applications.filter(a => a.id !== id);
      return set(STORAGE_KEYS.COLLABORATION_APPLICATIONS, filtered);
    },

    createAuditLog(action, entityId, details) {
      const auditLogs = Audit.getAll();
      const currentUser = Sessions.getCurrentUser();
      auditLogs.push({
        id: generateId('audit'),
        timestamp: new Date().toISOString(),
        userId: currentUser?.id || 'system',
        userRole: currentUser?.role || 'system',
        userEmail: currentUser?.email || 'system',
        userName: currentUser?.profile?.name || 'System',
        action: action,
        actionCategory: 'collaboration',
        entityType: 'collaboration_application',
        entityId: entityId,
        description: details.description,
        changes: details.changes || null,
        context: {
          portal: 'user_portal',
          opportunityId: details.opportunityId,
          applicantId: details.applicantId,
          modelType: details.modelType
        },
        metadata: {}
      });
      set(STORAGE_KEYS.AUDIT, auditLogs);
    }
  };

  // ============================================
  // Migration: Service Provider Model
  // ============================================
  function migrateServiceProviderModel() {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION) || '0.0.0';
    
    // Only migrate if version is less than 2.3.0
    if (compareVersions(currentVersion, '2.3.0') < 0) {
      console.log('🔄 Migrating to Service Provider model (v2.3.0)...');
      
      // Initialize new storage keys
      if (!localStorage.getItem(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES)) {
        localStorage.setItem(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SERVICE_REQUESTS)) {
        localStorage.setItem(STORAGE_KEYS.SERVICE_REQUESTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SERVICE_OFFERS)) {
        localStorage.setItem(STORAGE_KEYS.SERVICE_OFFERS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.SERVICE_ENGAGEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.SERVICE_ENGAGEMENTS, JSON.stringify([]));
      }
      
      // Create ServiceProviderProfile for users with skill_service_provider role
      const users = Users.getAll();
      let profilesCreated = 0;
      
      users.forEach(user => {
        if (user.role === 'skill_service_provider') {
          // Check if profile already exists
          const existingProfiles = get(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES);
          const existingProfile = existingProfiles.find(p => p.userId === user.id);
          
          if (!existingProfile) {
            const profile = {
              id: generateId('sp_profile'),
              userId: user.id,
              providerType: user.userType === 'consultant' ? 'CONSULTANT' : 
                           user.userType === 'individual' ? 'INDIVIDUAL' : 'FIRM',
              skills: user.profile?.skills || [],
              certifications: user.profile?.certifications || [],
              availabilityStatus: 'AVAILABLE',
              pricingModel: 'HOURLY',
              hourlyRate: null,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
            
            existingProfiles.push(profile);
            set(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES, existingProfiles);
            profilesCreated++;
          }
        }
      });
      
      if (profilesCreated > 0) {
        console.log(`✅ Created ${profilesCreated} Service Provider profile(s)`);
      }
      
      // Update version
      localStorage.setItem(STORAGE_KEYS.VERSION, '2.3.0');
      console.log('✅ Service Provider model migration completed');
    }
  }

  // ============================================
  // Migration: Contract-Driven Workflow
  // ============================================
  function migrateToContractDrivenWorkflow() {
    const currentVersion = localStorage.getItem(STORAGE_KEYS.VERSION) || '0.0.0';
    
    // Only migrate if version is less than 2.4.0
    if (compareVersions(currentVersion, '2.4.0') < 0) {
      console.log('🔄 Migrating to Contract-Driven Workflow (v2.4.0)...');
      
      // Initialize new storage keys
      if (!localStorage.getItem(STORAGE_KEYS.CONTRACTS)) {
        localStorage.setItem(STORAGE_KEYS.CONTRACTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.ENGAGEMENTS)) {
        localStorage.setItem(STORAGE_KEYS.ENGAGEMENTS, JSON.stringify([]));
      }
      if (!localStorage.getItem(STORAGE_KEYS.MILESTONES)) {
        localStorage.setItem(STORAGE_KEYS.MILESTONES, JSON.stringify([]));
      }

      let contractsCreated = 0;
      let engagementsCreated = 0;

      // Step 1: Migrate Approved Proposals → Contracts
      const approvedProposals = Proposals.getAll().filter(p => p.status === 'approved');
      console.log(`📋 Found ${approvedProposals.length} approved proposals to migrate`);

      approvedProposals.forEach(proposal => {
        const project = Projects.getById(proposal.projectId);
        if (!project) return;

        // Determine contract type
        const contractType = project.projectType === 'mega' 
          ? 'MEGA_PROJECT_CONTRACT' 
          : 'PROJECT_CONTRACT';

        // Get provider party type
        let providerPartyType = 'VENDOR_CORPORATE';
        if (typeof Users !== 'undefined') {
          const providerUser = Users.getById(proposal.providerId);
          if (providerUser) {
            const userType = mapRoleToUserType(providerUser.role, providerUser.userType);
            if (userType === 'vendor_corporate') {
              providerPartyType = 'VENDOR_CORPORATE';
            } else if (userType === 'vendor_individual') {
              providerPartyType = 'VENDOR_INDIVIDUAL';
            }
          }
        }

        // Create contract
        const contract = Contracts.create({
          contractType: contractType,
          scopeType: project.projectType === 'mega' ? 'MEGA_PROJECT' : 'PROJECT',
          scopeId: project.id,
          buyerPartyId: project.creatorId,
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: proposal.providerId,
          providerPartyType: providerPartyType,
          status: 'SIGNED', // Auto-sign migrated contracts
          startDate: proposal.timeline?.startDate || proposal.createdAt || new Date().toISOString(),
          endDate: proposal.timeline?.completionDate || null,
          termsJSON: {
            pricing: proposal.cashDetails || proposal.barterDetails || { amount: 0, currency: 'SAR' },
            paymentTerms: project.paymentTerms || 'milestone_based',
            deliverables: [],
            milestones: []
          },
          sourceProposalId: proposal.id,
          signedAt: proposal.approvedAt || proposal.createdAt || new Date().toISOString(),
          signedBy: project.creatorId
        });

        // Create engagement
        if (contract) {
          contractsCreated++;
          const engagement = Engagements.create({
            contractId: contract.id,
            engagementType: 'PROJECT_EXECUTION',
            status: proposal.status === 'completed' ? 'COMPLETED' : 'ACTIVE',
            startedAt: proposal.approvedAt || proposal.createdAt || new Date().toISOString()
          });
          if (engagement) {
            engagementsCreated++;
          }
        }
      });

      // Step 2: Migrate Service Engagements → Contracts + Engagements
      const serviceEngagements = ServiceEngagements.getAll();
      console.log(`📋 Found ${serviceEngagements.length} service engagements to migrate`);

      serviceEngagements.forEach(se => {
        const serviceRequest = ServiceRequests.getById(se.serviceRequestId);
        const serviceOffer = ServiceOffers.getById(se.serviceOfferId);

        if (!serviceRequest || !serviceOffer) return;

        // Determine buyer party type
        let buyerPartyType = 'BENEFICIARY';
        if (serviceRequest.requesterType === 'VENDOR') {
          buyerPartyType = 'VENDOR_CORPORATE';
        }

        // Create service contract
        const contract = Contracts.create({
          contractType: 'SERVICE_CONTRACT',
          scopeType: 'SERVICE_REQUEST',
          scopeId: serviceRequest.id,
          buyerPartyId: serviceRequest.requesterId,
          buyerPartyType: buyerPartyType,
          providerPartyId: se.serviceProviderUserId,
          providerPartyType: 'SERVICE_PROVIDER',
          status: 'SIGNED',
          startDate: se.startedAt || new Date().toISOString(),
          endDate: serviceRequest.requiredBy || null,
          termsJSON: {
            pricing: serviceOffer.proposedPricing || { amount: 0, currency: 'SAR' },
            paymentTerms: 'milestone_based',
            deliverables: [],
            milestones: []
          },
          sourceServiceOfferId: se.serviceOfferId,
          signedAt: se.startedAt || new Date().toISOString(),
          signedBy: serviceRequest.requesterId
        });

        // Create engagement
        if (contract) {
          contractsCreated++;
          const engagement = Engagements.create({
            contractId: contract.id,
            engagementType: 'SERVICE_DELIVERY',
            status: se.status === 'COMPLETED' ? 'COMPLETED' : 'ACTIVE',
            startedAt: se.startedAt,
            assignedToScopeType: se.linkedSubProjectIds?.length > 0 ? 'SUB_PROJECT' : null,
            assignedToScopeId: se.linkedSubProjectIds?.[0] || null
          });
          if (engagement) {
            engagementsCreated++;
          }
        }
      });

      // Step 3: Migrate Vendor-SubContractor Relationships → SubContracts
      const relationships = VendorSubContractorRelationships.getAll()
        .filter(r => r.status === 'active');
      console.log(`📋 Found ${relationships.length} active vendor-subcontractor relationships to migrate`);

      relationships.forEach(rel => {
        // Find vendor's active contracts
        const vendorContracts = Contracts.getAll()
          .filter(c => c.providerPartyId === rel.vendorId && 
                       (c.status === 'SIGNED' || c.status === 'ACTIVE'));

        // Create sub-contract for each vendor contract
        vendorContracts.forEach(vendorContract => {
          const subContract = Contracts.create({
            contractType: 'SUB_CONTRACT',
            scopeType: vendorContract.scopeType,
            scopeId: vendorContract.scopeId,
            buyerPartyId: rel.vendorId,
            buyerPartyType: 'VENDOR_CORPORATE',
            providerPartyId: rel.subContractorId,
            providerPartyType: 'SUB_CONTRACTOR',
            parentContractId: vendorContract.id,
            status: 'SIGNED',
            startDate: vendorContract.startDate,
            endDate: vendorContract.endDate,
            termsJSON: {
              pricing: { amount: 0, currency: 'SAR' }, // To be filled by vendor
              paymentTerms: 'milestone_based',
              deliverables: [],
              milestones: []
            },
            signedAt: rel.approvedAt || new Date().toISOString(),
            signedBy: rel.vendorId
          });
          if (subContract) {
            contractsCreated++;
          }
        });
      });

      // Update version
      localStorage.setItem(STORAGE_KEYS.VERSION, '2.4.0');
      console.log(`✅ Contract-Driven Workflow migration completed:`);
      console.log(`   - ${contractsCreated} contracts created`);
      console.log(`   - ${engagementsCreated} engagements created`);
    }
  }
  
  // Helper function to compare versions
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
  // Service Provider Profiles CRUD
  // ============================================
  const ServiceProviderProfiles = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES);
    },

    getById(id) {
      const profiles = this.getAll();
      return profiles.find(p => p.id === id) || null;
    },

    getByUserId(userId) {
      const profiles = this.getAll();
      return profiles.find(p => p.userId === userId) || null;
    },

    create(profileData) {
      const profiles = this.getAll();
      // Check if profile already exists for this user
      const existing = profiles.find(p => p.userId === profileData.userId);
      if (existing) {
        return this.update(existing.id, profileData);
      }
      
      const profile = {
        id: generateId('sp_profile'),
        userId: profileData.userId,
        providerType: profileData.providerType || 'INDIVIDUAL',
        skills: profileData.skills || [],
        certifications: profileData.certifications || [],
        availabilityStatus: profileData.availabilityStatus || 'AVAILABLE',
        pricingModel: profileData.pricingModel || 'HOURLY',
        hourlyRate: profileData.hourlyRate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      profiles.push(profile);
      if (set(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES, profiles)) {
        return profile;
      }
      return null;
    },

    update(id, updates) {
      const profiles = this.getAll();
      const index = profiles.findIndex(p => p.id === id);
      if (index === -1) return null;

      profiles[index] = {
        ...profiles[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      if (set(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES, profiles)) {
        return profiles[index];
      }
      return null;
    },

    delete(id) {
      const profiles = this.getAll();
      const filtered = profiles.filter(p => p.id !== id);
      return set(STORAGE_KEYS.SERVICE_PROVIDER_PROFILES, filtered);
    }
  };

  // ============================================
  // Service Requests CRUD
  // ============================================
  const ServiceRequests = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_REQUESTS);
    },

    getById(id) {
      const requests = this.getAll();
      return requests.find(r => r.id === id) || null;
    },

    getByRequester(requesterId) {
      const requests = this.getAll();
      return requests.filter(r => r.requesterId === requesterId);
    },

    getByOwnerCompany(ownerCompanyId) {
      const requests = this.getAll();
      return requests.filter(r => r.ownerCompanyId === ownerCompanyId);
    },

    getByStatus(status) {
      const requests = this.getAll();
      return requests.filter(r => r.status === status);
    },

    create(requestData) {
      const requests = this.getAll();
      const request = {
        id: generateId('sr'),
        requesterType: requestData.requesterType,
        requesterId: requestData.requesterId,
        title: requestData.title,
        description: requestData.description,
        requiredSkills: requestData.requiredSkills || [],
        status: 'OPEN',
        budget: requestData.budget || { min: 0, max: 0, currency: 'SAR' },
        timeline: requestData.timeline || { startDate: null, duration: 0 },
        bids: requestData.bids || [], // Array of bids from entities/vendors
        // Set ownerCompanyId from requesterId if not provided (users represent companies)
        ownerCompanyId: requestData.ownerCompanyId || requestData.requesterId,
        requestType: requestData.requestType || 'NORMAL', // NORMAL | ADVISORY
        scopeType: requestData.scopeType || null, // PROJECT | MEGA_PROJECT | SUB_PROJECT
        scopeId: requestData.scopeId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      requests.push(request);
      if (set(STORAGE_KEYS.SERVICE_REQUESTS, requests)) {
        return request;
      }
      return null;
    },

    update(id, updates) {
      const requests = this.getAll();
      const index = requests.findIndex(r => r.id === id);
      if (index === -1) return null;

      requests[index] = {
        ...requests[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      if (set(STORAGE_KEYS.SERVICE_REQUESTS, requests)) {
        return requests[index];
      }
      return null;
    },

    delete(id) {
      const requests = this.getAll();
      const filtered = requests.filter(r => r.id !== id);
      return set(STORAGE_KEYS.SERVICE_REQUESTS, filtered);
    }
  };

  // ============================================
  // Service Offers CRUD
  // ============================================
  const ServiceOffers = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_OFFERS);
    },

    getById(id) {
      const offers = this.getAll();
      return offers.find(o => o.id === id) || null;
    },

    getByServiceRequest(serviceRequestId) {
      const offers = this.getAll();
      return offers.filter(o => o.serviceRequestId === serviceRequestId);
    },

    getByServiceProvider(serviceProviderUserId) {
      const offers = this.getAll();
      return offers.filter(o => o.serviceProviderUserId === serviceProviderUserId);
    },

    getByStatus(status) {
      const offers = this.getAll();
      return offers.filter(o => o.status === status);
    },

    create(offerData) {
      const offers = this.getAll();
      const offer = {
        id: generateId('so'),
        serviceRequestId: offerData.serviceRequestId,
        serviceProviderUserId: offerData.serviceProviderUserId,
        proposedPricing: offerData.proposedPricing || {
          model: 'HOURLY',
          amount: 0,
          currency: 'SAR',
          breakdown: null
        },
        message: offerData.message || '',
        status: 'SUBMITTED',
        submittedAt: new Date().toISOString(),
        respondedAt: null,
        respondedBy: null
      };
      offers.push(offer);
      if (set(STORAGE_KEYS.SERVICE_OFFERS, offers)) {
        return offer;
      }
      return null;
    },

    update(id, updates) {
      const offers = this.getAll();
      const index = offers.findIndex(o => o.id === id);
      if (index === -1) return null;

      const oldOffer = { ...offers[index] };
      offers[index] = {
        ...offers[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set respondedAt when status changes
      if (updates.status && updates.status !== oldOffer.status && 
          (updates.status === 'ACCEPTED' || updates.status === 'REJECTED')) {
        offers[index].respondedAt = new Date().toISOString();
        const currentUser = Sessions.getCurrentUser();
        if (currentUser) {
          offers[index].respondedBy = currentUser.id;
        }
      }

      if (set(STORAGE_KEYS.SERVICE_OFFERS, offers)) {
        return offers[index];
      }
      return null;
    },

    delete(id) {
      const offers = this.getAll();
      const filtered = offers.filter(o => o.id !== id);
      return set(STORAGE_KEYS.SERVICE_OFFERS, filtered);
    }
  };

  // ============================================
  // Service Engagements CRUD
  // ============================================
  const ServiceEngagements = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_ENGAGEMENTS);
    },

    getById(id) {
      const engagements = this.getAll();
      return engagements.find(e => e.id === id) || null;
    },

    getByServiceRequest(serviceRequestId) {
      const engagements = this.getAll();
      return engagements.filter(e => e.serviceRequestId === serviceRequestId);
    },

    getByServiceProvider(serviceProviderUserId) {
      const engagements = this.getAll();
      return engagements.filter(e => e.serviceProviderUserId === serviceProviderUserId);
    },

    getByStatus(status) {
      const engagements = this.getAll();
      return engagements.filter(e => e.status === status);
    },

    getBySubProject(subProjectId) {
      const engagements = this.getAll();
      return engagements.filter(e => 
        e.linkedSubProjectIds && e.linkedSubProjectIds.includes(subProjectId)
      );
    },

    getByMegaProject(megaProjectId) {
      const engagements = this.getAll();
      return engagements.filter(e => e.linkedMegaProjectId === megaProjectId);
    },

    create(engagementData) {
      const engagements = this.getAll();
      const engagement = {
        id: generateId('se'),
        serviceRequestId: engagementData.serviceRequestId,
        serviceProviderUserId: engagementData.serviceProviderUserId,
        serviceOfferId: engagementData.serviceOfferId,
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        completedAt: null,
        terminatedAt: null,
        terminationReason: null,
        linkedSubProjectIds: engagementData.linkedSubProjectIds || [],
        linkedMegaProjectId: engagementData.linkedMegaProjectId || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      engagements.push(engagement);
      if (set(STORAGE_KEYS.SERVICE_ENGAGEMENTS, engagements)) {
        return engagement;
      }
      return null;
    },

    update(id, updates) {
      const engagements = this.getAll();
      const index = engagements.findIndex(e => e.id === id);
      if (index === -1) return null;

      const oldEngagement = { ...engagements[index] };
      engagements[index] = {
        ...engagements[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'COMPLETED' && oldEngagement.status !== 'COMPLETED') {
        engagements[index].completedAt = new Date().toISOString();
      }
      if (updates.status === 'TERMINATED' && oldEngagement.status !== 'TERMINATED') {
        engagements[index].terminatedAt = new Date().toISOString();
      }

      if (set(STORAGE_KEYS.SERVICE_ENGAGEMENTS, engagements)) {
        return engagements[index];
      }
      return null;
    },

    delete(id) {
      const engagements = this.getAll();
      const filtered = engagements.filter(e => e.id !== id);
      return set(STORAGE_KEYS.SERVICE_ENGAGEMENTS, filtered);
    }
  };

  // ============================================
  // Contracts CRUD
  // ============================================
  const Contracts = {
    getAll() {
      return get(STORAGE_KEYS.CONTRACTS);
    },

    getById(id) {
      const contracts = this.getAll();
      return contracts.find(c => c.id === id) || null;
    },

    getByScope(scopeType, scopeId) {
      const contracts = this.getAll();
      return contracts.filter(c => c.scopeType === scopeType && c.scopeId === scopeId);
    },

    getByBuyer(buyerPartyId) {
      const contracts = this.getAll();
      return contracts.filter(c => c.buyerPartyId === buyerPartyId);
    },

    getByProvider(providerPartyId) {
      const contracts = this.getAll();
      return contracts.filter(c => c.providerPartyId === providerPartyId);
    },

    getByContractType(contractType) {
      const contracts = this.getAll();
      return contracts.filter(c => c.contractType === contractType);
    },

    getByStatus(status) {
      const contracts = this.getAll();
      return contracts.filter(c => c.status === status);
    },

    getSubContracts(parentContractId) {
      const contracts = this.getAll();
      return contracts.filter(c => c.parentContractId === parentContractId);
    },

    getByParty(partyId) {
      const contracts = this.getAll();
      return contracts.filter(c => 
        c.buyerPartyId === partyId || c.providerPartyId === partyId
      );
    },

    create(contractData) {
      const contracts = this.getAll();
      const contract = {
        id: contractData.id || generateId('contract'),
        contractType: contractData.contractType, // PROJECT_CONTRACT, MEGA_PROJECT_CONTRACT, SERVICE_CONTRACT, ADVISORY_CONTRACT, SUB_CONTRACT
        scopeType: contractData.scopeType, // PROJECT, MEGA_PROJECT, SUB_PROJECT, SERVICE_REQUEST
        scopeId: contractData.scopeId,
        buyerPartyId: contractData.buyerPartyId,
        buyerPartyType: contractData.buyerPartyType, // BENEFICIARY, VENDOR_CORPORATE, VENDOR_INDIVIDUAL
        providerPartyId: contractData.providerPartyId,
        providerPartyType: contractData.providerPartyType, // VENDOR_CORPORATE, VENDOR_INDIVIDUAL, SERVICE_PROVIDER, CONSULTANT, SUB_CONTRACTOR
        parentContractId: contractData.parentContractId || null, // For SUB_CONTRACT only
        status: contractData.status || 'DRAFT', // DRAFT, SENT, SIGNED, ACTIVE, COMPLETED, TERMINATED
        startDate: contractData.startDate || null,
        endDate: contractData.endDate || null,
        signedAt: contractData.signedAt || null,
        signedBy: contractData.signedBy || null,
        termsJSON: contractData.termsJSON || {
          pricing: { amount: 0, currency: 'SAR' },
          paymentTerms: 'milestone_based',
          deliverables: [],
          milestones: []
        },
        sourceProposalId: contractData.sourceProposalId || null,
        sourceServiceOfferId: contractData.sourceServiceOfferId || null,
        createdAt: contractData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: contractData.createdBy || contractData.buyerPartyId
      };
      contracts.push(contract);
      if (set(STORAGE_KEYS.CONTRACTS, contracts)) {
        Audit.create({
          type: 'contract_created',
          entityId: contract.id,
          userId: contract.createdBy,
          description: `Contract created: ${contract.contractType}`,
          metadata: {
            contractType: contract.contractType,
            scopeType: contract.scopeType,
            scopeId: contract.scopeId,
            buyerPartyId: contract.buyerPartyId,
            providerPartyId: contract.providerPartyId
          }
        });
        return contract;
      }
      return null;
    },

    update(id, updates) {
      const contracts = this.getAll();
      const index = contracts.findIndex(c => c.id === id);
      if (index === -1) return null;

      const oldContract = { ...contracts[index] };
      contracts[index] = {
        ...contracts[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'SIGNED' && oldContract.status !== 'SIGNED' && !contracts[index].signedAt) {
        contracts[index].signedAt = new Date().toISOString();
      }
      if (updates.status === 'ACTIVE' && oldContract.status !== 'ACTIVE') {
        // Contract becomes active after signing
      }
      if (updates.status === 'COMPLETED' && oldContract.status !== 'COMPLETED') {
        // Contract completed
      }
      if (updates.status === 'TERMINATED' && oldContract.status !== 'TERMINATED') {
        // Contract terminated
      }

      if (set(STORAGE_KEYS.CONTRACTS, contracts)) {
        Audit.create({
          type: 'contract_updated',
          entityId: id,
          userId: contracts[index].createdBy,
          description: `Contract updated: ${contracts[index].contractType}`,
          metadata: updates
        });
        return contracts[index];
      }
      return null;
    },

    delete(id) {
      const contracts = this.getAll();
      const filtered = contracts.filter(c => c.id !== id);
      if (set(STORAGE_KEYS.CONTRACTS, filtered)) {
        Audit.create({
          type: 'contract_deleted',
          entityId: id,
          userId: null,
          description: `Contract deleted: ${id}`
        });
        return true;
      }
      return false;
    }
  };

  // ============================================
  // Engagements CRUD (Unified - replaces ServiceEngagements)
  // ============================================
  const Engagements = {
    getAll() {
      return get(STORAGE_KEYS.ENGAGEMENTS);
    },

    getById(id) {
      const engagements = this.getAll();
      return engagements.find(e => e.id === id) || null;
    },

    getByContract(contractId) {
      const engagements = this.getAll();
      return engagements.filter(e => e.contractId === contractId);
    },

    getByEngagementType(engagementType) {
      const engagements = this.getAll();
      return engagements.filter(e => e.engagementType === engagementType);
    },

    getByStatus(status) {
      const engagements = this.getAll();
      return engagements.filter(e => e.status === status);
    },

    getByScope(scopeType, scopeId) {
      const engagements = this.getAll();
      return engagements.filter(e => 
        e.assignedToScopeType === scopeType && e.assignedToScopeId === scopeId
      );
    },

    create(engagementData) {
      const engagements = this.getAll();
      const engagement = {
        id: engagementData.id || generateId('eng'),
        contractId: engagementData.contractId, // REQUIRED - must have signed contract
        engagementType: engagementData.engagementType, // PROJECT_EXECUTION, SERVICE_DELIVERY, ADVISORY
        status: engagementData.status || 'PLANNED', // PLANNED, ACTIVE, PAUSED, COMPLETED, CANCELED
        assignedToScopeType: engagementData.assignedToScopeType || null, // SUB_PROJECT, PHASE, WORK_PACKAGE
        assignedToScopeId: engagementData.assignedToScopeId || null,
        milestoneIds: engagementData.milestoneIds || [],
        startedAt: engagementData.startedAt || null,
        completedAt: engagementData.completedAt || null,
        pausedAt: engagementData.pausedAt || null,
        createdAt: engagementData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      engagements.push(engagement);
      if (set(STORAGE_KEYS.ENGAGEMENTS, engagements)) {
        Audit.create({
          type: 'engagement_created',
          entityId: engagement.id,
          userId: null,
          description: `Engagement created: ${engagement.engagementType}`,
          metadata: {
            contractId: engagement.contractId,
            engagementType: engagement.engagementType,
            status: engagement.status
          }
        });
        return engagement;
      }
      return null;
    },

    update(id, updates) {
      const engagements = this.getAll();
      const index = engagements.findIndex(e => e.id === id);
      if (index === -1) return null;

      const oldEngagement = { ...engagements[index] };
      engagements[index] = {
        ...engagements[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'ACTIVE' && oldEngagement.status !== 'ACTIVE' && !engagements[index].startedAt) {
        engagements[index].startedAt = new Date().toISOString();
      }
      if (updates.status === 'COMPLETED' && oldEngagement.status !== 'COMPLETED') {
        engagements[index].completedAt = new Date().toISOString();
      }
      if (updates.status === 'PAUSED' && oldEngagement.status !== 'PAUSED') {
        engagements[index].pausedAt = new Date().toISOString();
      }
      if (updates.status === 'ACTIVE' && oldEngagement.status === 'PAUSED' && engagements[index].pausedAt) {
        engagements[index].pausedAt = null; // Resume from pause
      }

      if (set(STORAGE_KEYS.ENGAGEMENTS, engagements)) {
        return engagements[index];
      }
      return null;
    },

    delete(id) {
      const engagements = this.getAll();
      const filtered = engagements.filter(e => e.id !== id);
      return set(STORAGE_KEYS.ENGAGEMENTS, filtered);
    }
  };

  // ============================================
  // Milestones CRUD
  // ============================================
  const Milestones = {
    getAll() {
      return get(STORAGE_KEYS.MILESTONES);
    },

    getById(id) {
      const milestones = this.getAll();
      return milestones.find(m => m.id === id) || null;
    },

    getByEngagement(engagementId) {
      const milestones = this.getAll();
      return milestones.filter(m => m.engagementId === engagementId);
    },

    getByContract(contractId) {
      const milestones = this.getAll();
      return milestones.filter(m => m.contractId === contractId);
    },

    getByStatus(status) {
      const milestones = this.getAll();
      return milestones.filter(m => m.status === status);
    },

    getByType(type) {
      const milestones = this.getAll();
      return milestones.filter(m => m.type === type);
    },

    create(milestoneData) {
      const milestones = this.getAll();
      const milestone = {
        id: milestoneData.id || generateId('milestone'),
        engagementId: milestoneData.engagementId, // FK
        contractId: milestoneData.contractId, // FK (for reference)
        title: milestoneData.title,
        description: milestoneData.description || '',
        type: milestoneData.type || 'MILESTONE', // MILESTONE, DELIVERABLE
        status: milestoneData.status || 'PENDING', // PENDING, IN_PROGRESS, COMPLETED, APPROVED, REJECTED
        dueDate: milestoneData.dueDate || null,
        completedAt: milestoneData.completedAt || null,
        approvedAt: milestoneData.approvedAt || null,
        approvedBy: milestoneData.approvedBy || null,
        paymentAmount: milestoneData.paymentAmount || 0,
        paymentCurrency: milestoneData.paymentCurrency || 'SAR',
        createdAt: milestoneData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      milestones.push(milestone);
      if (set(STORAGE_KEYS.MILESTONES, milestones)) {
        return milestone;
      }
      return null;
    },

    update(id, updates) {
      const milestones = this.getAll();
      const index = milestones.findIndex(m => m.id === id);
      if (index === -1) return null;

      const oldMilestone = { ...milestones[index] };
      milestones[index] = {
        ...milestones[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      // Set timestamps for status changes
      if (updates.status === 'COMPLETED' && oldMilestone.status !== 'COMPLETED' && !milestones[index].completedAt) {
        milestones[index].completedAt = new Date().toISOString();
      }
      if (updates.status === 'APPROVED' && oldMilestone.status !== 'APPROVED' && !milestones[index].approvedAt) {
        milestones[index].approvedAt = new Date().toISOString();
      }

      if (set(STORAGE_KEYS.MILESTONES, milestones)) {
        return milestones[index];
      }
      return null;
    },

    delete(id) {
      const milestones = this.getAll();
      const filtered = milestones.filter(m => m.id !== id);
      return set(STORAGE_KEYS.MILESTONES, filtered);
    }
  };

  // ============================================
  // Profile Submission & Review Functions
  // ============================================
  
  // Validate if profile can be submitted for review
  function validateProfileSubmission(user) {
    if (!user) return { valid: false, errors: ['User not found'] };

    const userType = user.userType || mapRoleToUserType(user.role);
    const errors = [];

    // Check email and mobile verification
    if (!user.emailVerified) {
      errors.push('Email address must be verified');
    }
    if (!user.mobileVerified) {
      errors.push('Mobile number must be verified');
    }

    // Check identity information
    const identity = user.identity || {};
    if (userType === 'company') {
      if (!identity.legalEntityName) errors.push('Legal Entity Name is required');
      if (!identity.crNumber) errors.push('Commercial Registration (CR) Number is required');
      if (!identity.taxNumber) errors.push('Tax Number is required');
      if (!identity.authorizedRepresentativeNID) errors.push('National ID of Authorized Representative is required');
    } else {
      if (!identity.fullLegalName) errors.push('Full Legal Name is required');
      if (!identity.nationalId && !identity.passportNumber) {
        errors.push('National ID or Passport Number is required');
      }
    }

    // Check required documents (only for Company and Consultant)
    const documents = Array.isArray(user.documents) ? user.documents : [];
    if (userType === 'company') {
      if (!documents.some(doc => doc.type === 'cr' && doc.base64Data)) {
        errors.push('Commercial Registration document is required');
      }
      if (!documents.some(doc => doc.type === 'vat' && doc.base64Data)) {
        errors.push('VAT certificate is required');
      }
    } else if (userType === 'consultant') {
      if (!documents.some(doc => doc.type === 'license' && doc.base64Data)) {
        errors.push('Professional license is required');
      }
      if (!documents.some(doc => doc.type === 'cv' && doc.base64Data)) {
        errors.push('Resume/CV is required');
      }
    }
    // Individual users don't require documents (optional)

    // Check profile completion score (minimum 70%)
    const scoreData = calculateProfileCompletionScore(user);
    const completionScore = typeof scoreData === 'object' ? scoreData.score : scoreData;
    if (completionScore < 70) {
      errors.push(`Profile completion must be at least 70% (currently ${completionScore}%)`);
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      completionScore: completionScore
    };
  }

  // Submit profile for review
  function submitProfileForReview(userId) {
    const user = Users.getById(userId);
    if (!user) return { success: false, error: 'User not found' };

    // Validate submission
    const validation = validateProfileSubmission(user);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }

    // Update status to under_review
    const updated = Users.update(userId, {
      onboardingStage: 'under_review',
      review: {
        ...user.review,
        submittedAt: new Date().toISOString(),
        status: 'pending'
      },
      onboardingProgress: calculateOnboardingProgress(
        user.userType || mapRoleToUserType(user.role),
        'under_review',
        user
      )
    });

    if (updated) {
      // Create notification for admin
      Notifications.create({
        userId: 'admin', // Will be handled by admin portal
        type: 'user_review_pending',
        title: 'New User Pending Review',
        message: `${user.email} (${user.userType}) has submitted their profile for review`,
        relatedEntityType: 'user',
        relatedEntityId: userId,
        actionUrl: '#vetting',
        actionLabel: 'Review User'
      });

      // Create audit log
      Users.createAuditLog('profile_submitted_for_review', userId, {
        description: `User submitted profile for review: ${user.email}`,
        completionScore: validation.completionScore
      });

      return { success: true, user: updated };
    }

    return { success: false, error: 'Failed to update user status' };
  }

  // Upload document
  function uploadDocument(userId, file, type) {
    return new Promise((resolve, reject) => {
      if (!file) {
        reject(new Error('No file provided'));
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        reject(new Error('File size exceeds 5MB limit'));
        return;
      }

      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        reject(new Error('Invalid file type. Only PDF and images are allowed'));
        return;
      }

      // Read file as base64
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64Data = e.target.result;
        const user = Users.getById(userId);
        if (!user) {
          reject(new Error('User not found'));
          return;
        }

        const documents = user.documents || [];
        const newDocument = {
          id: generateId('doc'),
          type: type,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          base64Data: base64Data,
          uploadedAt: new Date().toISOString(),
          verified: false
        };

        documents.push(newDocument);

        const updated = Users.update(userId, {
          documents: documents
        });

        if (updated) {
          Users.createAuditLog('document_uploaded', userId, {
            description: `Document uploaded: ${file.name} (${type})`,
            documentType: type
          });
          resolve(newDocument);
        } else {
          reject(new Error('Failed to save document'));
        }
      };

      reader.onerror = function() {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  // Generate OTP (simulated)
  function generateOTP(type = 'email') {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutes expiry

    return {
      code: otp,
      expiresAt: expiresAt.toISOString()
    };
  }

  // Check feature access based on onboarding stage
  function checkFeatureAccess(user, feature) {
    if (!user) return { allowed: false, reason: 'User not found' };

    const stage = user.onboardingStage;
    const allowedStages = ['approved', 'active'];

    if (allowedStages.includes(stage)) {
      return { allowed: true };
    }

    let reason = '';
    switch (stage) {
      case 'registered':
        reason = 'Please verify your email and mobile number to continue';
        break;
      case 'profile_in_progress':
        reason = 'Please complete your profile to access this feature';
        break;
      case 'under_review':
        reason = 'Your profile is under review. You will gain access once approved';
        break;
      case 'rejected':
        reason = 'Your profile was rejected. Please review the feedback and resubmit';
        break;
      default:
        reason = 'Your account is not active';
    }

    return { allowed: false, reason: reason, stage: stage };
  }

  // ============================================
  // System Settings CRUD
  // ============================================
  const SystemSettings = {
    get() {
      const settings = get(STORAGE_KEYS.SYSTEM_SETTINGS);
      if (!settings || settings.length === 0) {
        // Return default settings
        return this.getDefaults();
      }
      return settings[0]; // Single settings object
    },

    getDefaults() {
      return {
        id: 'settings_001',
        platform: {
          name: 'PMTwin',
          logo: null,
          contactEmail: 'contact@pmtwin.com',
          contactPhone: '+966501234567',
          maintenanceMode: false,
          maintenanceMessage: null
        },
        matching: {
          threshold: 80,
          skillWeight: 0.4,
          locationWeight: 0.2,
          experienceWeight: 0.3,
          financialWeight: 0.1,
          enableAutoMatching: true,
          matchingFrequency: 'realtime'
        },
        notifications: {
          emailEnabled: true,
          smsEnabled: false,
          pushEnabled: true,
          emailTemplates: {},
          notificationFrequency: 'immediate'
        },
        features: {
          barterEnabled: true,
          bulkPurchasingEnabled: true,
          mentorshipEnabled: true,
          spvEnabled: true,
          competitionEnabled: true,
          mobileAppEnabled: true
        },
        roles: {},
        updatedAt: new Date().toISOString(),
        updatedBy: null
      };
    },

    update(category, settings) {
      const current = this.get();
      const updated = {
        ...current,
        [category]: {
          ...current[category],
          ...settings
        },
        updatedAt: new Date().toISOString(),
        updatedBy: Sessions.getCurrentUser()?.id || 'system'
      };
      
      if (set(STORAGE_KEYS.SYSTEM_SETTINGS, [updated])) {
        Audit.create({
          userId: Sessions.getCurrentUser()?.id || 'system',
          userRole: Sessions.getCurrentUser()?.role || 'admin',
          userEmail: Sessions.getCurrentUser()?.email || 'system',
          userName: Sessions.getCurrentUser()?.profile?.name || 'System',
          action: 'settings_update',
          actionCategory: 'admin',
          entityType: 'system_settings',
          entityId: 'settings_001',
          description: `System settings updated: ${category}`,
          context: {
            portal: 'admin_portal',
            category: category,
            changes: settings
          }
        });
        return updated;
      }
      return null;
    },

    updateAll(settings) {
      const updated = {
        ...settings,
        id: 'settings_001',
        updatedAt: new Date().toISOString(),
        updatedBy: Sessions.getCurrentUser()?.id || 'system'
      };
      
      if (set(STORAGE_KEYS.SYSTEM_SETTINGS, [updated])) {
        Audit.create({
          userId: Sessions.getCurrentUser()?.id || 'system',
          userRole: Sessions.getCurrentUser()?.role || 'admin',
          userEmail: Sessions.getCurrentUser()?.email || 'system',
          userName: Sessions.getCurrentUser()?.profile?.name || 'System',
          action: 'settings_update_all',
          actionCategory: 'admin',
          entityType: 'system_settings',
          entityId: 'settings_001',
          description: 'All system settings updated',
          context: {
            portal: 'admin_portal'
          }
        });
        return updated;
      }
      return null;
    },

    reset() {
      const defaults = this.getDefaults();
      return this.updateAll(defaults);
    }
  };

  // ============================================
  // Service Providers CRUD
  // ============================================
  const ServiceProviders = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_PROVIDERS_INDEX);
    },

    getById(id) {
      const providers = this.getAll();
      return providers.find(p => p.id === id) || null;
    },

    getByUserId(userId) {
      const providers = this.getAll();
      return providers.find(p => p.userId === userId) || null;
    },

    getByType(providerType) {
      const providers = this.getAll();
      return providers.filter(p => p.providerType === providerType);
    },

    getByCategory(category) {
      const providers = this.getAll();
      return providers.filter(p => (p.categories || []).includes(category));
    },

    create(providerData) {
      const providers = this.getAll();
      const provider = {
        id: providerData.id || generateId('sp'),
        userId: providerData.userId,
        providerType: providerData.providerType || 'consultant', // individual, consultant, company
        name: providerData.name || '',
        companyName: providerData.companyName || null,
        description: providerData.description || '',
        categories: providerData.categories || [],
        skills: providerData.skills || [],
        location: providerData.location || {},
        serviceAreas: providerData.serviceAreas || [],
        availability: providerData.availability || 'available',
        responseTime: providerData.responseTime || null,
        profileScore: providerData.profileScore || 0,
        certifications: providerData.certifications || [],
        establishedYear: providerData.establishedYear || null,
        contact: providerData.contact || {},
        status: providerData.status || 'active',
        createdAt: providerData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      providers.push(provider);
      if (set(STORAGE_KEYS.SERVICE_PROVIDERS_INDEX, providers)) {
        // Update index
        IndexManager.updateProviderIndex(provider.id);
        return provider;
      }
      return null;
    },

    update(id, updates) {
      const providers = this.getAll();
      const index = providers.findIndex(p => p.id === id);
      if (index === -1) return null;

      providers[index] = {
        ...providers[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (set(STORAGE_KEYS.SERVICE_PROVIDERS_INDEX, providers)) {
        // Update index
        IndexManager.updateProviderIndex(id);
        return providers[index];
      }
      return null;
    },

    delete(id) {
      const providers = this.getAll();
      const filtered = providers.filter(p => p.id !== id);
      if (set(STORAGE_KEYS.SERVICE_PROVIDERS_INDEX, filtered)) {
        // Remove from index
        IndexManager.removeFromIndex(id, 'provider');
        return true;
      }
      return false;
    }
  };

  // ============================================
  // Beneficiaries CRUD
  // ============================================
  const Beneficiaries = {
    getAll() {
      return get(STORAGE_KEYS.BENEFICIARIES_INDEX);
    },

    getById(id) {
      const beneficiaries = this.getAll();
      return beneficiaries.find(b => b.id === id) || null;
    },

    getByUserId(userId) {
      const beneficiaries = this.getAll();
      return beneficiaries.find(b => b.userId === userId) || null;
    },

    getByProject(projectId) {
      const beneficiaries = this.getAll();
      return beneficiaries.filter(b => (b.projectIds || []).includes(projectId));
    },

    create(beneficiaryData) {
      const beneficiaries = this.getAll();
      const beneficiary = {
        id: beneficiaryData.id || generateId('ben'),
        userId: beneficiaryData.userId,
        name: beneficiaryData.name || '',
        companyName: beneficiaryData.companyName || null,
        location: beneficiaryData.location || {},
        requiredServices: beneficiaryData.requiredServices || [],
        requiredSkills: beneficiaryData.requiredSkills || [],
        budgetRange: beneficiaryData.budgetRange || { min: 0, max: 0, currency: 'SAR' },
        projectIds: beneficiaryData.projectIds || [],
        preferences: beneficiaryData.preferences || {
          deliveryMode: [], // On-site, Remote, Hybrid
          paymentTerms: [],
          exchangeType: [] // Cash, Barter, Mixed
        },
        status: beneficiaryData.status || 'active',
        createdAt: beneficiaryData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      beneficiaries.push(beneficiary);
      if (set(STORAGE_KEYS.BENEFICIARIES_INDEX, beneficiaries)) {
        // Update index
        IndexManager.updateBeneficiaryIndex(beneficiary.id);
        return beneficiary;
      }
      return null;
    },

    update(id, updates) {
      const beneficiaries = this.getAll();
      const index = beneficiaries.findIndex(b => b.id === id);
      if (index === -1) return null;

      beneficiaries[index] = {
        ...beneficiaries[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (set(STORAGE_KEYS.BENEFICIARIES_INDEX, beneficiaries)) {
        // Update index
        IndexManager.updateBeneficiaryIndex(id);
        return beneficiaries[index];
      }
      return null;
    },

    delete(id) {
      const beneficiaries = this.getAll();
      const filtered = beneficiaries.filter(b => b.id !== id);
      if (set(STORAGE_KEYS.BENEFICIARIES_INDEX, filtered)) {
        // Remove from index
        IndexManager.removeFromIndex(id, 'beneficiary');
        return true;
      }
      return false;
    }
  };

  // ============================================
  // Service Evaluations CRUD
  // ============================================
  const ServiceEvaluations = {
    getAll() {
      return get(STORAGE_KEYS.SERVICE_EVALUATIONS);
    },

    getById(id) {
      const evaluations = this.getAll();
      return evaluations.find(e => e.id === id) || null;
    },

    getByProvider(providerId) {
      const evaluations = this.getAll();
      return evaluations.filter(e => e.providerId === providerId);
    },

    getByOffering(offeringId) {
      const evaluations = this.getAll();
      return evaluations.filter(e => e.serviceOfferingId === offeringId);
    },

    getByBeneficiary(beneficiaryId) {
      const evaluations = this.getAll();
      return evaluations.filter(e => e.beneficiaryId === beneficiaryId);
    },

    getByProject(projectId) {
      const evaluations = this.getAll();
      return evaluations.filter(e => e.projectId === projectId);
    },

    create(evaluationData) {
      const evaluations = this.getAll();
      const evaluation = {
        id: evaluationData.id || generateId('eval'),
        serviceOfferingId: evaluationData.serviceOfferingId,
        providerId: evaluationData.providerId,
        beneficiaryId: evaluationData.beneficiaryId,
        projectId: evaluationData.projectId || null,
        rating: evaluationData.rating, // 1-5
        review: evaluationData.review || '',
        performanceMetrics: evaluationData.performanceMetrics || {
          onTimeDelivery: null,
          qualityScore: null, // 1-5
          communicationScore: null, // 1-5
          valueScore: null // 1-5
        },
        createdAt: evaluationData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      evaluations.push(evaluation);
      if (set(STORAGE_KEYS.SERVICE_EVALUATIONS, evaluations)) {
        return evaluation;
      }
      return null;
    },

    update(id, updates) {
      const evaluations = this.getAll();
      const index = evaluations.findIndex(e => e.id === id);
      if (index === -1) return null;

      evaluations[index] = {
        ...evaluations[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (set(STORAGE_KEYS.SERVICE_EVALUATIONS, evaluations)) {
        return evaluations[index];
      }
      return null;
    },

    delete(id) {
      const evaluations = this.getAll();
      const filtered = evaluations.filter(e => e.id !== id);
      return set(STORAGE_KEYS.SERVICE_EVALUATIONS, filtered);
    },

    getAggregateRating(providerId) {
      const evaluations = this.getByProvider(providerId);
      if (evaluations.length === 0) {
        return { averageRating: 0, totalReviews: 0, performanceMetrics: null };
      }

      const ratings = evaluations.map(e => e.rating).filter(r => r != null);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      // Aggregate performance metrics
      const metrics = evaluations
        .map(e => e.performanceMetrics)
        .filter(m => m != null);
      
      const aggregateMetrics = metrics.length > 0 ? {
        onTimeDelivery: metrics.filter(m => m.onTimeDelivery === true).length / metrics.length,
        averageQualityScore: metrics
          .map(m => m.qualityScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0,
        averageCommunicationScore: metrics
          .map(m => m.communicationScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0,
        averageValueScore: metrics
          .map(m => m.valueScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0
      } : null;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: evaluations.length,
        performanceMetrics: aggregateMetrics
      };
    },

    getAggregateRatingByOffering(offeringId) {
      const evaluations = this.getByOffering(offeringId);
      if (evaluations.length === 0) {
        return { averageRating: 0, totalReviews: 0, performanceMetrics: null };
      }

      const ratings = evaluations.map(e => e.rating).filter(r => r != null);
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
        : 0;

      const metrics = evaluations
        .map(e => e.performanceMetrics)
        .filter(m => m != null);
      
      const aggregateMetrics = metrics.length > 0 ? {
        onTimeDelivery: metrics.filter(m => m.onTimeDelivery === true).length / metrics.length,
        averageQualityScore: metrics
          .map(m => m.qualityScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0,
        averageCommunicationScore: metrics
          .map(m => m.communicationScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0,
        averageValueScore: metrics
          .map(m => m.valueScore)
          .filter(s => s != null)
          .reduce((sum, s, _, arr) => sum + s / arr.length, 0) || 0
      } : null;

      return {
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews: evaluations.length,
        performanceMetrics: aggregateMetrics
      };
    }
  };

  // ============================================
  // Index Manager
  // ============================================
  const IndexManager = {
    // Get or initialize index structure
    getIndex() {
      const stored = localStorage.getItem('pmtwin_service_index');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.warn('Error parsing service index:', e);
        }
      }
      return this.initializeIndex();
    },

    // Initialize empty index structure
    initializeIndex() {
      const index = {
        byCategory: {},
        bySkills: {},
        byLocation: {},
        byAvailability: {},
        byProviderType: {},
        offeringsByCategory: {},
        offeringsBySkills: {},
        offeringsByLocation: {},
        beneficiariesByRequiredServices: {},
        beneficiariesByLocation: {},
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
      return index;
    },

    // Rebuild entire index from current data
    rebuildIndex() {
      const index = this.initializeIndex();
      
      // Index service providers
      const providers = ServiceProviders.getAll();
      providers.forEach(provider => {
        this._indexProvider(provider, index);
      });

      // Index service offerings (from service-providers.json structure)
      if (typeof ServiceOfferingService !== 'undefined') {
        // Will be updated when service offering service is available
        // For now, we'll index from localStorage if available
        const storedOfferings = localStorage.getItem('pmtwin_service_providers');
        if (storedOfferings) {
          try {
            const data = JSON.parse(storedOfferings);
            (data.serviceOfferings || []).forEach(offering => {
              this._indexOffering(offering, index);
            });
          } catch (e) {
            console.warn('Error parsing service offerings for index:', e);
          }
        }
      }

      // Index beneficiaries
      const beneficiaries = Beneficiaries.getAll();
      beneficiaries.forEach(beneficiary => {
        this._indexBeneficiary(beneficiary, index);
      });

      index.lastUpdated = new Date().toISOString();
      localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
      return index;
    },

    // Index a single provider
    _indexProvider(provider, index) {
      if (!provider || !provider.id) return;

      // Index by category
      (provider.categories || []).forEach(category => {
        if (!index.byCategory[category]) {
          index.byCategory[category] = [];
        }
        if (!index.byCategory[category].includes(provider.id)) {
          index.byCategory[category].push(provider.id);
        }
      });

      // Index by skills
      (provider.skills || []).forEach(skill => {
        const skillKey = skill.toLowerCase();
        if (!index.bySkills[skillKey]) {
          index.bySkills[skillKey] = [];
        }
        if (!index.bySkills[skillKey].includes(provider.id)) {
          index.bySkills[skillKey].push(provider.id);
        }
      });

      // Index by location
      if (provider.location) {
        const city = (provider.location.city || '').toLowerCase();
        if (city) {
          if (!index.byLocation[city]) {
            index.byLocation[city] = [];
          }
          if (!index.byLocation[city].includes(provider.id)) {
            index.byLocation[city].push(provider.id);
          }
        }
      }

      // Index by availability
      const availability = provider.availability || 'unknown';
      if (!index.byAvailability[availability]) {
        index.byAvailability[availability] = [];
      }
      if (!index.byAvailability[availability].includes(provider.id)) {
        index.byAvailability[availability].push(provider.id);
      }

      // Index by provider type
      const providerType = provider.providerType || 'consultant';
      if (!index.byProviderType[providerType]) {
        index.byProviderType[providerType] = [];
      }
      if (!index.byProviderType[providerType].includes(provider.id)) {
        index.byProviderType[providerType].push(provider.id);
      }
    },

    // Index a single offering
    _indexOffering(offering, index) {
      if (!offering || !offering.id) return;

      // Index by category
      if (offering.category) {
        const categoryKey = offering.category.toLowerCase();
        if (!index.offeringsByCategory[categoryKey]) {
          index.offeringsByCategory[categoryKey] = [];
        }
        if (!index.offeringsByCategory[categoryKey].includes(offering.id)) {
          index.offeringsByCategory[categoryKey].push(offering.id);
        }
      }

      // Index by skills
      (offering.skills || []).forEach(skill => {
        const skillKey = skill.toLowerCase();
        if (!index.offeringsBySkills[skillKey]) {
          index.offeringsBySkills[skillKey] = [];
        }
        if (!index.offeringsBySkills[skillKey].includes(offering.id)) {
          index.offeringsBySkills[skillKey].push(offering.id);
        }
      });

      // Index by location
      if (offering.location && offering.location.city) {
        const city = offering.location.city.toLowerCase();
        if (!index.offeringsByLocation[city]) {
          index.offeringsByLocation[city] = [];
        }
        if (!index.offeringsByLocation[city].includes(offering.id)) {
          index.offeringsByLocation[city].push(offering.id);
        }
      }
    },

    // Index a single beneficiary
    _indexBeneficiary(beneficiary, index) {
      if (!beneficiary || !beneficiary.id) return;

      // Index by required services
      (beneficiary.requiredServices || []).forEach(service => {
        const serviceKey = service.toLowerCase();
        if (!index.beneficiariesByRequiredServices[serviceKey]) {
          index.beneficiariesByRequiredServices[serviceKey] = [];
        }
        if (!index.beneficiariesByRequiredServices[serviceKey].includes(beneficiary.id)) {
          index.beneficiariesByRequiredServices[serviceKey].push(beneficiary.id);
        }
      });

      // Index by location
      if (beneficiary.location && beneficiary.location.city) {
        const city = beneficiary.location.city.toLowerCase();
        if (!index.beneficiariesByLocation[city]) {
          index.beneficiariesByLocation[city] = [];
        }
        if (!index.beneficiariesByLocation[city].includes(beneficiary.id)) {
          index.beneficiariesByLocation[city].push(beneficiary.id);
        }
      }
    },

    // Update provider in index
    updateProviderIndex(providerId) {
      const provider = ServiceProviders.getById(providerId);
      if (!provider) {
        this.removeFromIndex(providerId, 'provider');
        return;
      }

      const index = this.getIndex();
      // Remove old entries
      this.removeFromIndex(providerId, 'provider');
      // Add new entries
      this._indexProvider(provider, index);
      index.lastUpdated = new Date().toISOString();
      localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
    },

    // Update offering in index
    updateOfferingIndex(offeringId) {
      // Get offering from service offering service or localStorage
      let offering = null;
      if (typeof ServiceOfferingService !== 'undefined') {
        // Will be handled by service offering service
        return;
      }
      
      const storedOfferings = localStorage.getItem('pmtwin_service_providers');
      if (storedOfferings) {
        try {
          const data = JSON.parse(storedOfferings);
          offering = (data.serviceOfferings || []).find(o => o.id === offeringId);
        } catch (e) {
          console.warn('Error parsing service offerings:', e);
        }
      }

      if (!offering) {
        this.removeFromIndex(offeringId, 'offering');
        return;
      }

      const index = this.getIndex();
      // Remove old entries
      this.removeFromIndex(offeringId, 'offering');
      // Add new entries
      this._indexOffering(offering, index);
      index.lastUpdated = new Date().toISOString();
      localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
    },

    // Update beneficiary in index
    updateBeneficiaryIndex(beneficiaryId) {
      const beneficiary = Beneficiaries.getById(beneficiaryId);
      if (!beneficiary) {
        this.removeFromIndex(beneficiaryId, 'beneficiary');
        return;
      }

      const index = this.getIndex();
      // Remove old entries
      this.removeFromIndex(beneficiaryId, 'beneficiary');
      // Add new entries
      this._indexBeneficiary(beneficiary, index);
      index.lastUpdated = new Date().toISOString();
      localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
    },

    // Remove from index
    removeFromIndex(id, type) {
      const index = this.getIndex();
      let removed = false;

      if (type === 'provider') {
        // Remove from all provider indexes
        Object.keys(index.byCategory).forEach(key => {
          index.byCategory[key] = index.byCategory[key].filter(pid => pid !== id);
          if (index.byCategory[key].length === 0) delete index.byCategory[key];
        });
        Object.keys(index.bySkills).forEach(key => {
          index.bySkills[key] = index.bySkills[key].filter(pid => pid !== id);
          if (index.bySkills[key].length === 0) delete index.bySkills[key];
        });
        Object.keys(index.byLocation).forEach(key => {
          index.byLocation[key] = index.byLocation[key].filter(pid => pid !== id);
          if (index.byLocation[key].length === 0) delete index.byLocation[key];
        });
        Object.keys(index.byAvailability).forEach(key => {
          index.byAvailability[key] = index.byAvailability[key].filter(pid => pid !== id);
          if (index.byAvailability[key].length === 0) delete index.byAvailability[key];
        });
        Object.keys(index.byProviderType).forEach(key => {
          index.byProviderType[key] = index.byProviderType[key].filter(pid => pid !== id);
          if (index.byProviderType[key].length === 0) delete index.byProviderType[key];
        });
        removed = true;
      } else if (type === 'offering') {
        // Remove from all offering indexes
        Object.keys(index.offeringsByCategory).forEach(key => {
          index.offeringsByCategory[key] = index.offeringsByCategory[key].filter(oid => oid !== id);
          if (index.offeringsByCategory[key].length === 0) delete index.offeringsByCategory[key];
        });
        Object.keys(index.offeringsBySkills).forEach(key => {
          index.offeringsBySkills[key] = index.offeringsBySkills[key].filter(oid => oid !== id);
          if (index.offeringsBySkills[key].length === 0) delete index.offeringsBySkills[key];
        });
        Object.keys(index.offeringsByLocation).forEach(key => {
          index.offeringsByLocation[key] = index.offeringsByLocation[key].filter(oid => oid !== id);
          if (index.offeringsByLocation[key].length === 0) delete index.offeringsByLocation[key];
        });
        removed = true;
      } else if (type === 'beneficiary') {
        // Remove from all beneficiary indexes
        Object.keys(index.beneficiariesByRequiredServices).forEach(key => {
          index.beneficiariesByRequiredServices[key] = index.beneficiariesByRequiredServices[key].filter(bid => bid !== id);
          if (index.beneficiariesByRequiredServices[key].length === 0) delete index.beneficiariesByRequiredServices[key];
        });
        Object.keys(index.beneficiariesByLocation).forEach(key => {
          index.beneficiariesByLocation[key] = index.beneficiariesByLocation[key].filter(bid => bid !== id);
          if (index.beneficiariesByLocation[key].length === 0) delete index.beneficiariesByLocation[key];
        });
        removed = true;
      }

      if (removed) {
        index.lastUpdated = new Date().toISOString();
        localStorage.setItem('pmtwin_service_index', JSON.stringify(index));
      }
    },

    // Query index for providers matching criteria
    queryProviders(criteria) {
      const index = this.getIndex();
      let providerIds = new Set();

      // Start with all providers if no criteria
      if (!criteria || Object.keys(criteria).length === 0) {
        const providers = ServiceProviders.getAll();
        return providers.map(p => p.id);
      }

      // Filter by category
      if (criteria.category) {
        const categoryKey = criteria.category.toLowerCase();
        const ids = index.byCategory[categoryKey] || [];
        if (providerIds.size === 0) {
          ids.forEach(id => providerIds.add(id));
        } else {
          providerIds = new Set([...providerIds].filter(id => ids.includes(id)));
        }
      }

      // Filter by skills
      if (criteria.skills && criteria.skills.length > 0) {
        const skillIds = new Set();
        criteria.skills.forEach(skill => {
          const skillKey = skill.toLowerCase();
          (index.bySkills[skillKey] || []).forEach(id => skillIds.add(id));
        });
        if (providerIds.size === 0) {
          skillIds.forEach(id => providerIds.add(id));
        } else {
          providerIds = new Set([...providerIds].filter(id => skillIds.has(id)));
        }
      }

      // Filter by location
      if (criteria.location) {
        const locationKey = criteria.location.toLowerCase();
        const ids = index.byLocation[locationKey] || [];
        if (providerIds.size === 0) {
          ids.forEach(id => providerIds.add(id));
        } else {
          providerIds = new Set([...providerIds].filter(id => ids.includes(id)));
        }
      }

      // Filter by availability
      if (criteria.availability) {
        const ids = index.byAvailability[criteria.availability] || [];
        if (providerIds.size === 0) {
          ids.forEach(id => providerIds.add(id));
        } else {
          providerIds = new Set([...providerIds].filter(id => ids.includes(id)));
        }
      }

      // Filter by provider type
      if (criteria.providerType) {
        const ids = index.byProviderType[criteria.providerType] || [];
        if (providerIds.size === 0) {
          ids.forEach(id => providerIds.add(id));
        } else {
          providerIds = new Set([...providerIds].filter(id => ids.includes(id)));
        }
      }

      // If no filters matched, return all
      if (providerIds.size === 0) {
        const providers = ServiceProviders.getAll();
        return providers.map(p => p.id);
      }

      return Array.from(providerIds);
    }
  };

  // ============================================
  // Public API
  // ============================================
  // ============================================
  // Vendor-Sub_Contractor Relationships
  // ============================================
  const VendorSubContractorRelationships = {
    getAll() {
      return get(STORAGE_KEYS.VENDOR_SUBCONTRACTOR_RELATIONSHIPS);
    },

    getById(id) {
      const relationships = this.getAll();
      return relationships.find(r => r.id === id) || null;
    },

    getByVendor(vendorId) {
      const relationships = this.getAll();
      return relationships.filter(r => r.vendorId === vendorId);
    },

    getBySubContractor(subContractorId) {
      const relationships = this.getAll();
      return relationships.filter(r => r.subContractorId === subContractorId);
    },

    getByStatus(status) {
      const relationships = this.getAll();
      return relationships.filter(r => r.status === status);
    },

    create(relationshipData) {
      const relationships = this.getAll();
      const relationship = {
        id: generateId('relationship'),
        ...relationshipData,
        status: relationshipData.status || 'pending',
        createdAt: relationshipData.createdAt || new Date().toISOString(),
        approvedAt: relationshipData.approvedAt || null
      };
      relationships.push(relationship);
      if (set(STORAGE_KEYS.VENDOR_SUBCONTRACTOR_RELATIONSHIPS, relationships)) {
        Audit.create({
          type: 'vendor_subcontractor_relationship_created',
          entityId: relationship.id,
          userId: relationship.vendorId,
          description: `Vendor-sub_contractor relationship created`,
          metadata: {
            vendorId: relationship.vendorId,
            subContractorId: relationship.subContractorId,
            status: relationship.status
          }
        });
        return relationship;
      }
      return null;
    },

    update(id, updates) {
      const relationships = this.getAll();
      const index = relationships.findIndex(r => r.id === id);
      if (index === -1) return null;

      const updated = {
        ...relationships[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      relationships[index] = updated;
      if (set(STORAGE_KEYS.VENDOR_SUBCONTRACTOR_RELATIONSHIPS, relationships)) {
        Audit.create({
          type: 'vendor_subcontractor_relationship_updated',
          entityId: id,
          userId: updated.vendorId,
          description: `Vendor-sub_contractor relationship updated`,
          metadata: updates
        });
        return updated;
      }
      return null;
    },

    delete(id) {
      const relationships = this.getAll();
      const index = relationships.findIndex(r => r.id === id);
      if (index === -1) return false;

      const relationship = relationships[index];
      relationships.splice(index, 1);
      if (set(STORAGE_KEYS.VENDOR_SUBCONTRACTOR_RELATIONSHIPS, relationships)) {
        Audit.create({
          type: 'vendor_subcontractor_relationship_deleted',
          entityId: id,
          userId: relationship.vendorId,
          description: `Vendor-sub_contractor relationship deleted`
        });
        return true;
      }
      return false;
    }
  };

  // ============================================
  // Public API
  // ============================================
  // Export setSkipAuditLogs function
  window.PMTwinData = {
    setSkipAuditLogs,
    init: initStorage,
    Users,
    Sessions,
    Projects,
    Proposals,
    Matches,
    Audit,
    Notifications,
    CollaborationOpportunities,
    CollaborationApplications,
    SystemSettings,
    ServiceProviders,
    Beneficiaries,
    ServiceEvaluations,
    VendorSubContractorRelationships,
    ServiceProviderProfiles,
    ServiceRequests,
    ServiceOffers,
    ServiceEngagements,
    Contracts,
    Engagements,
    Milestones,
    getCompanySkills,
    IndexManager,
    generateId,
    generateDeviceFingerprint,
    verifyAndCreateAccounts,
    forceCreateTestAccounts,
    checkAccounts,
    calculateOnboardingProgress,
    calculateProfileCompletionScore,
    getProfileScore,
    getNextStepsForStage,
    validateProfileSubmission,
    submitProfileForReview,
    uploadDocument,
    generateOTP,
    checkFeatureAccess,
    loadSampleNotifications: () => loadSampleNotifications(true),
    loadSampleCollaborationOpportunities: () => loadSampleCollaborationOpportunities(true),
    loadSampleCollaborationApplications: () => loadSampleCollaborationApplications(true),
    loadSampleProposals: () => loadSampleProposals(true),
    loadServiceIndexTestData: () => loadServiceIndexTestData(),
    updateOpportunitiesWithTestData: updateOpportunitiesWithTestData,
    
    // Golden Seed Data
    loadGoldenSeedData: (forceReload = false) => {
      if (typeof GoldenSeedData !== 'undefined') {
        return GoldenSeedData.load(forceReload);
      } else {
        console.warn('GoldenSeedData not available. Make sure golden-seed-data.js is loaded.');
        return null;
      }
    },
    
    // Test Data Helpers
    getServiceTestDataStats() {
      const providers = ServiceProviders.getAll();
      const beneficiaries = Beneficiaries.getAll();
      const evaluations = ServiceEvaluations.getAll();
      
      let offerings = [];
      try {
        const storedData = localStorage.getItem('pmtwin_service_providers');
        if (storedData) {
          const data = JSON.parse(storedData);
          offerings = data.serviceOfferings || [];
        }
      } catch (e) {
        console.warn('Error loading offerings:', e);
      }
      
      const activeOfferings = offerings.filter(o => o.status === 'Active');
      const barterOfferings = offerings.filter(o => o.exchange_type === 'Barter' || o.exchange_type === 'Mixed');
      
      return {
        providers: providers.length,
        beneficiaries: beneficiaries.length,
        offerings: offerings.length,
        activeOfferings: activeOfferings.length,
        barterOfferings: barterOfferings.length,
        evaluations: evaluations.length,
        details: {
          providers: providers.map(p => ({ id: p.id, name: p.name || p.companyName, type: p.providerType })),
          offerings: offerings.map(o => ({ id: o.id, title: o.title, status: o.status, exchangeType: o.exchange_type }))
        }
      };
    },
    
    // Test Data Helper Functions
    getCollaborationTestDataStats() {
      const opportunities = CollaborationOpportunities.getAll();
      const applications = CollaborationApplications.getAll();
      
      const modelCounts = {};
      opportunities.forEach(opp => {
        const model = opp.modelType || opp.modelId || 'unknown';
        modelCounts[model] = (modelCounts[model] || 0) + 1;
      });
      
      const statusCounts = {
        opportunities: {},
        applications: {}
      };
      
      opportunities.forEach(opp => {
        const status = opp.status || 'unknown';
        statusCounts.opportunities[status] = (statusCounts.opportunities[status] || 0) + 1;
      });
      
      applications.forEach(app => {
        const status = app.status || 'unknown';
        statusCounts.applications[status] = (statusCounts.applications[status] || 0) + 1;
      });
      
      return {
        opportunities: {
          total: opportunities.length,
          byModel: modelCounts,
          byStatus: statusCounts.opportunities
        },
        applications: {
          total: applications.length,
          byStatus: statusCounts.applications
        },
        coverage: {
          modelsWithData: Object.keys(modelCounts).length,
          totalModels: 13,
          opportunitiesWithApplications: new Set(applications.map(a => a.opportunityId)).size
        }
      };
    },
    
    resetCollaborationTestData() {
      set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, []);
      set(STORAGE_KEYS.COLLABORATION_APPLICATIONS, []);
      loadSampleCollaborationOpportunities(true);
      setTimeout(() => {
        loadSampleCollaborationApplications(true);
      }, 100);
      return { success: true, message: 'Collaboration test data reset successfully' };
    },
    
    validateCollaborationTestData() {
      const opportunities = CollaborationOpportunities.getAll();
      const applications = CollaborationApplications.getAll();
      const errors = [];
      const warnings = [];
      
      // Validate opportunities
      opportunities.forEach((opp, index) => {
        if (!opp.id) errors.push(`Opportunity ${index}: Missing ID`);
        if (!opp.modelType && !opp.modelId) errors.push(`Opportunity ${index}: Missing model type`);
        if (!opp.creatorId) errors.push(`Opportunity ${index}: Missing creator ID`);
        if (!opp.status) warnings.push(`Opportunity ${index}: Missing status`);
      });
      
      // Validate applications
      applications.forEach((app, index) => {
        if (!app.id) errors.push(`Application ${index}: Missing ID`);
        if (!app.opportunityId) errors.push(`Application ${index}: Missing opportunity ID`);
        if (!app.applicantId) errors.push(`Application ${index}: Missing applicant ID`);
        
        // Check if opportunity exists
        const opportunity = CollaborationOpportunities.getById(app.opportunityId);
        if (!opportunity) {
          errors.push(`Application ${index}: Linked opportunity ${app.opportunityId} does not exist`);
        }
      });
      
      // Check model coverage
      const modelIds = ['1.1', '1.2', '1.3', '1.4', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3', '4.1', '4.2', '5.1'];
      const coveredModels = new Set(opportunities.map(o => o.modelType || o.modelId));
      modelIds.forEach(modelId => {
        if (!coveredModels.has(modelId)) {
          warnings.push(`Model ${modelId} has no test opportunities`);
        }
      });
      
      return {
        valid: errors.length === 0,
        errors: errors,
        warnings: warnings,
        summary: {
          opportunities: opportunities.length,
          applications: applications.length,
          modelsCovered: coveredModels.size,
          totalModels: modelIds.length
        }
      };
    }
  };

  // Initialize on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStorage);
  } else {
    initStorage();
  }

  // Cleanup expired sessions periodically
  setInterval(() => {
    Sessions.cleanup();
  }, 60000); // Every minute

})();

