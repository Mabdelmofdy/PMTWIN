/**
 * PMTwin Data Management Layer
 * Handles all localStorage CRUD operations
 */

(function() {
  'use strict';

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
    VERSION: 'pmtwin_data_version'
  };

  const DATA_VERSION = '2.1.0'; // Updated for progressive onboarding system

  // ============================================
  // User Type & Role Mapping
  // ============================================
  function mapRoleToUserType(role, explicitUserType = null) {
    // If explicit userType is provided, use it (allows for individual type)
    if (explicitUserType && ['company', 'consultant', 'individual', 'admin'].includes(explicitUserType)) {
      return explicitUserType;
    }
    
    // Map new roles to user types
    const mapping = {
      'platform_admin': 'admin',
      'admin': 'admin', // Legacy
      'project_lead': 'company',
      'supplier': 'company',
      'service_provider': 'company',
      'entity': 'company', // Legacy
      'professional': 'individual',
      'consultant': 'consultant',
      'mentor': 'individual',
      'individual': 'consultant', // Legacy
      'auditor': 'admin'
    };
    return mapping[role] || 'consultant';
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
    
    // Load sample projects if none exist
    loadSampleProjects();
    
    // Load sample collaboration opportunities if none exist
    loadSampleCollaborationOpportunities();
    
    // Load sample proposals if none exist
    loadSampleProposals();
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

  // Calculate profile completion score based on section completeness
  // Profile Score = (Completion Score × 0.6) + (Verification Score × 0.4)
  function calculateProfileCompletionScore(user) {
    if (!user) return 0;

    const userType = user.userType || mapRoleToUserType(user.role);
    const profileSections = user.profileSections || {};
    const identity = user.identity || {};
    const documents = Array.isArray(user.documents) ? user.documents : [];
    const profile = user.profile || {};

    // ============================================
    // COMPLETION SCORE (60% weight)
    // ============================================
    let completionTotalWeight = 0;
    let completionCompletedWeight = 0;

    // Basic Information (15%)
    if (userType === 'company') {
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
    if (userType === 'company') {
      const professionalFields = ['services', 'yearsInBusiness', 'teamSize'];
      const professionalWeight = 20 / professionalFields.length;
      professionalFields.forEach(field => {
        completionTotalWeight += professionalWeight;
        if (profile[field]) completionCompletedWeight += professionalWeight;
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
    if (profile.bio || profile.description || profileSections.additional?.completed) {
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
    if (userType === 'company') {
      // Entity: CR verification
      const crDoc = documents.find(doc => doc.type === 'cr' && doc.verified);
      if (crDoc || (identity.crNumber && identity.crVerified)) {
        verificationCompletedWeight += identityWeight;
      }
    } else {
      // Individual: National ID verification
      const idDoc = documents.find(doc => (doc.type === 'national_id' || doc.type === 'passport') && doc.verified);
      if (idDoc || (identity.nationalId && identity.nationalIdVerified)) {
        verificationCompletedWeight += identityWeight;
      }
    }

    // Professional Certifications (30%)
    const profCertWeight = 30;
    verificationTotalWeight += profCertWeight;
    const verifiedCerts = documents.filter(doc => 
      (doc.type === 'certification' || doc.type === 'license') && doc.verified
    );
    if (verifiedCerts.length > 0) {
      verificationCompletedWeight += profCertWeight;
    }

    // Portfolio Documents (20%)
    const portfolioDocWeight = 20;
    verificationTotalWeight += portfolioDocWeight;
    const verifiedPortfolio = documents.filter(doc => 
      (doc.type === 'portfolio' || doc.type === 'case_study') && doc.verified
    );
    if (verifiedPortfolio.length > 0) {
      verificationCompletedWeight += portfolioDocWeight;
    }

    // Safety Certifications (20%)
    const safetyWeight = 20;
    verificationTotalWeight += safetyWeight;
    const verifiedSafety = documents.filter(doc => 
      doc.type === 'safety_certification' && doc.verified
    );
    if (verifiedSafety.length > 0) {
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
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html') && p !== 'POC' && p !== '');
    
    // Count how many directory levels deep we are (excluding POC root and filename)
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
        n.userId === 'demo_individual_001' || 
        n.userId === 'demo_entity_001'
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
          'demo_admin_001': 'admin@pmtwin.com',
          'demo_individual_001': 'individual@pmtwin.com',
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
        this.createAuditLog('profile_update', id, {
          description: `User profile updated: ${users[index].email}`,
          changes: { before: oldUser, after: users[index] }
        });
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
      set(STORAGE_KEYS.AUDIT, auditLogs);
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
      return proposals.filter(p => p.providerId === providerId);
    },

    getByStatus(status) {
      const proposals = this.getAll();
      return proposals.filter(p => p.status === status);
    },

    create(proposalData) {
      const proposals = this.getAll();
      const proposal = {
        id: generateId('proposal'),
        ...proposalData,
        status: 'in_review',
        submittedAt: new Date().toISOString()
      };
      proposals.push(proposal);
      if (set(STORAGE_KEYS.PROPOSALS, proposals)) {
        // Update project proposal count
        const project = Projects.getById(proposal.projectId);
        if (project) {
          project.proposalsReceived = (project.proposalsReceived || 0) + 1;
          Projects.update(proposal.projectId, { proposalsReceived: project.proposalsReceived });
        }
        this.createAuditLog('proposal_submission', proposal.id, {
          description: `Proposal submitted for project: ${project?.title || proposal.projectId}`,
          projectId: proposal.projectId,
          providerId: proposal.providerId,
          type: proposal.type
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
      const logs = this.getAll();
      const log = {
        id: generateId('audit'),
        ...logData,
        timestamp: new Date().toISOString()
      };
      logs.push(log);
      // Keep only last 1000 logs to prevent storage overflow
      const limited = logs.slice(-1000);
      return set(STORAGE_KEYS.AUDIT, limited) ? log : null;
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
    
    // Only load if no opportunities exist, unless forceReload is true
    if (existingOpportunities.length > 0 && !forceReload) {
      return;
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
      }
    ];

    if (forceReload) {
      // Clear existing opportunities
      set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, []);
    }

    let loaded = 0;
    sampleOpportunities.forEach(oppData => {
      // Check if opportunity already exists
      const existing = CollaborationOpportunities.getAll().find(o => 
        o.modelId === oppData.modelId && 
        (o.attributes?.taskTitle === oppData.attributes?.taskTitle ||
         o.attributes?.projectTitle === oppData.attributes?.projectTitle ||
         o.attributes?.competitionTitle === oppData.attributes?.competitionTitle)
      );
      
      if (!existing) {
        const opportunity = CollaborationOpportunities.create(oppData);
        if (opportunity) {
          loaded++;
        }
      }
    });

    if (loaded > 0) {
      console.log(`✅ Loaded ${loaded} sample collaboration opportunities`);
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
        status: applicationData.status || 'in_review',
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
  // Public API
  // ============================================
  window.PMTwinData = {
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
    loadSampleProposals: () => loadSampleProposals(true)
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

