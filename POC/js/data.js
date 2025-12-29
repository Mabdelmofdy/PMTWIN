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
    const documents = user.documents || [];
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
  function autoCreateTestAccounts() {
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
      Users.create({
        email: 'individual@pmtwin.com',
        password: btoa('User123'),
        role: 'individual',
        userType: 'consultant',
        onboardingStage: 'approved',
        emailVerified: true,
        profile: {
          name: 'John Doe',
          professionalTitle: 'Senior Civil Engineer',
          phone: '+966501234567',
          location: {
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          },
          skills: ['Project Management', 'Civil Engineering', 'Construction Planning', 'Quality Control'],
          experienceLevel: 'senior',
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          credentials: [
            {
              type: 'license',
              fileName: 'professional_license.pdf',
              fileSize: 2048000,
              uploadedAt: new Date().toISOString(),
              verified: true
            }
          ]
        }
      });
      created++;
    }

    // Create Company (Entity) if doesn't exist
    if (!entityExists) {
      Users.create({
        email: 'entity@pmtwin.com',
        password: btoa('Entity123'),
        role: 'entity',
        userType: 'company',
        onboardingStage: 'approved',
        emailVerified: true,
        profile: {
          name: 'ABC Construction Co.',
          companyName: 'ABC Construction Company Ltd.',
          phone: '+966112345678',
          website: 'https://www.abcconstruction.com',
          location: {
            headquarters: {
              city: 'Riyadh',
              region: 'Riyadh Province',
              country: 'Saudi Arabia'
            }
          },
          commercialRegistration: {
            number: 'CR-1234567890',
            verified: true
          },
          vatNumber: {
            number: 'VAT-123456789012345',
            verified: true
          },
          services: ['General Contracting', 'Infrastructure Development', 'Project Management'],
          yearsInBusiness: 15,
          status: 'approved',
          createdAt: new Date().toISOString(),
          approvedAt: new Date().toISOString(),
          approvedBy: 'system',
          credentials: [
            {
              type: 'cr',
              fileName: 'commercial_registration.pdf',
              fileSize: 1024000,
              uploadedAt: new Date().toISOString(),
              verified: true
            }
          ]
        }
      });
      created++;
    }

    if (created > 0) {
      console.log(`✅ Created ${created} test account(s) automatically!`);
      console.log('📋 Login credentials:');
      console.log('   Admin: admin@pmtwin.com / Admin123');
      console.log('   Individual: individual@pmtwin.com / User123');
      console.log('   Entity: entity@pmtwin.com / Entity123');
    }
  }
  
  // Force create/update test accounts (ensures correct passwords and status)
  function forceCreateTestAccounts() {
    const users = Users.getAll();
    
    // Remove existing test accounts if they exist (to recreate with correct data)
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
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    return segments.length > 0 ? '../' : '';
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
      if (verificationData.crVerified && user.documents) {
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
      if (verificationData.nationalIdVerified && user.documents) {
        const idDoc = user.documents.find(doc => doc.type === 'national_id' || doc.type === 'passport');
        if (idDoc) {
          idDoc.verified = true;
          idDoc.verifiedAt = new Date().toISOString();
          idDoc.verifiedBy = reviewerId;
        }
      }

      // Update certification documents
      if (verificationData.certifications && user.documents) {
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
        if (updates.status === 'active' && oldOpportunity.status === 'draft') {
          opportunities[index].publishedAt = new Date().toISOString();
          set(STORAGE_KEYS.COLLABORATION_OPPORTUNITIES, opportunities);
        }
        this.createAuditLog('collaboration_opportunity_update', id, {
          description: `Collaboration opportunity updated: ${opportunities[index].modelName || opportunities[index].modelType}`,
          changes: { before: oldOpportunity, after: opportunities[index] }
        });
        return opportunities[index];
      }
      return null;
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
    const documents = user.documents || [];
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
    loadSampleNotifications: () => loadSampleNotifications(true)
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

