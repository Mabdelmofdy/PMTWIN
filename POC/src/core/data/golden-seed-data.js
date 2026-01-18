/**
 * PMTwin Golden Seed Data
 * Comprehensive dataset demonstrating the complete contract-driven workflow
 * Covers all roles: Beneficiary, Vendor, SubContractor, ServiceProvider, Consultant
 * Covers all contract types: MEGA_PROJECT_CONTRACT, PROJECT_CONTRACT, SERVICE_CONTRACT, ADVISORY_CONTRACT, SUB_CONTRACT
 */

(function() {
  'use strict';

  // ============================================
  // Main Golden Seed Data Loader
  // ============================================
  function loadGoldenSeedData(forceReload = false) {
    try {
      // Skip audit logs during seed data loading to prevent localStorage quota issues
      if (typeof PMTwinData !== 'undefined' && PMTwinData.setSkipAuditLogs) {
        PMTwinData.setSkipAuditLogs(true);
      }
      if (typeof PMTwinData === 'undefined') {
        console.error('PMTwinData not available');
        return;
      }

      console.log('🌱 Loading Golden Seed Data...');

      // Check if golden data already exists (merge-safe approach)
      const existingUsers = PMTwinData.Users.getAll();
      const goldenUserExists = existingUsers.some(u => 
        u.email === 'beneficiary@pmtwin.com' || 
        u.email === 'vendor.alpha@pmtwin.com'
      );

      // Always update existing users with enhanced profile data (unless forceReload)
      // This ensures profiles are always up to date
      if (goldenUserExists && !forceReload) {
        console.log('✅ Golden seed data exists. Updating existing users with enhanced profiles...');
        // Continue to create/update users with enhanced data
      }

      // Create data in correct order (dependencies first)
      // SEED v2 - KSA Opportunity Workflow Only
      const seedResults = {
        users: createGoldenUsers(forceReload),
        opportunityWorkflow: SeedNewOpportunityWorkflow(forceReload), // NEW: Comprehensive KSA-only workflow
        // Legacy seed functions disabled - using SeedNewOpportunityWorkflow instead
        // opportunities: createGoldenOpportunities(forceReload), // DEPRECATED
        // proposals: createGoldenProposals(forceReload), // DEPRECATED
        // contracts: createGoldenContracts(forceReload), // DEPRECATED
        engagements: createGoldenEngagements(forceReload),
        milestones: createGoldenMilestones(forceReload),
        serviceProviderProfiles: createGoldenServiceProviderProfiles(forceReload),
        beneficiaries: createGoldenBeneficiaries(forceReload),
        collaborationOpportunities: createCollaborationOpportunitiesForAllModels(forceReload), // NEW: All 13 collaboration models
        collaborationApplications: createCollaborationApplications(forceReload), // NEW: Applications for collaboration opportunities
        matchingResults: createMatchingResults(forceReload), // NEW: Matching algorithm results
        notifications: createNotifications(forceReload), // NEW: User notifications
        adminTestData: createAdminTestData(forceReload) // NEW: Admin portal test data
        // REMOVED: projects, serviceRequests, serviceOffers (legacy - use opportunities instead)
      };
      
      // Remove legacy storage keys after seeding
      if (typeof UnifiedStorage !== 'undefined') {
        UnifiedStorage.removeLegacyKeys();
      }

      console.log('✅ Golden Seed Data Loaded:', seedResults);
      
      // Re-enable audit logs after seed data loading
      if (typeof PMTwinData !== 'undefined' && PMTwinData.setSkipAuditLogs) {
        PMTwinData.setSkipAuditLogs(false);
      }
      
      return seedResults;
    } catch (error) {
      console.error('❌ Error loading Golden Seed Data:', error);
      console.error('Error stack:', error.stack);
      
      // Re-enable audit logs even on error
      if (typeof PMTwinData !== 'undefined' && PMTwinData.setSkipAuditLogs) {
        PMTwinData.setSkipAuditLogs(false);
      }
      
      // Return empty results so page can still load
      return {
        users: { created: 0, skipped: 0 },
        opportunityWorkflow: { created: 0, skipped: 0 },
        engagements: { created: 0, skipped: 0 },
        milestones: { created: 0, skipped: 0 },
        serviceProviderProfiles: { created: 0, skipped: 0 },
        beneficiaries: { created: 0, skipped: 0 },
        collaborationOpportunities: { created: 0, skipped: 0 },
        collaborationApplications: { created: 0, skipped: 0 },
        matchingResults: { created: 0, skipped: 0 },
        notifications: { created: 0, skipped: 0 },
        adminTestData: { created: 0, skipped: 0 },
        error: error.message
      };
    }
  }

  // ============================================
  // A) Users + Profiles
  // ============================================
  function createGoldenUsers(forceReload = false) {
    const users = PMTwinData.Users.getAll();
    const created = [];
    const skipped = [];

    // Helper to create or update user
    function createUserIfNotExists(userData) {
      const existingUser = users.find(u => u.email === userData.email);
      
      if (existingUser && !forceReload) {
        // Update existing user with enhanced profile data
        const updated = PMTwinData.Users.update(existingUser.id, {
          identity: userData.identity,
          documents: userData.documents,
          documentVerifications: userData.documentVerifications,
          review: userData.review,
          profileSections: userData.profileSections,
          onboardingProgress: userData.onboardingProgress,
          vettingComments: userData.vettingComments,
          profile: {
            ...existingUser.profile,
            ...userData.profile
          }
        });
        if (updated) {
          created.push(userData.email);
        } else {
          skipped.push(userData.email);
        }
        return updated || existingUser;
      }
      
      if (existingUser && forceReload) {
        // Remove existing user
        PMTwinData.Users.delete(existingUser.id);
      }

      const user = PMTwinData.Users.create(userData);
      if (user) {
        created.push(user.email);
      }
      return user;
    }

    const now = new Date();
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // 0. Admin User
    const adminUser = createUserIfNotExists({
      id: 'user-admin-001',
      email: 'admin@pmtwin.com',
      password: btoa('Admin123'),
      role: 'admin',
      userType: 'admin',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966500000000',
      mobileVerified: true,
      identity: {
        fullLegalName: 'Platform Administrator',
        nationalId: '0000000000',
        nationalIdVerified: true
      },
      profile: {
        name: 'Platform Administrator',
        status: 'approved',
        department: 'Operations',
        permissions: ['vet_users', 'moderate_projects', 'view_reports', 'manage_audit_trail', 'manage_users', 'system_settings'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString(),
        approvedBy: 'system'
      },
      profileSections: {
        basicInfo: true,
        professionalDetails: true,
        documents: true
      },
      onboardingProgress: 100,
      review: {
        submittedAt: baseDate.toISOString(),
        reviewedAt: baseDate.toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'System administrator account'
      },
      createdAt: baseDate.toISOString()
    });

    // 1. Beneficiaries (2)
    const beneficiaryA = createUserIfNotExists({
      email: 'beneficiary@pmtwin.com',
      password: btoa('Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966501234567',
      mobileVerified: true,
      identity: {
        legalEntityName: 'NEOM Development Authority',
        crNumber: 'CR-NEOM-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2020-01-01',
        crExpiryDate: '2030-01-01',
        taxNumber: 'VAT-NEOM-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '1111111111',
        authorizedRepresentativeName: 'Ahmed Al-NEOM',
        scaClassifications: ['MegaProjects', 'Infrastructure Development', 'Sustainable Development'],
        scaVerified: true
      },
      profile: {
        name: 'NEOM Development Authority',
        companyName: 'NEOM Development Authority',
        legalName: 'NEOM Development Authority',
        phone: '+966501234567',
        website: 'https://www.neom.com',
        companyDescription: 'Leading authority for NEOM mega-project development, responsible for sustainable infrastructure and innovative urban development in the Tabuk region.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'NEOM City Center',
            city: 'NEOM',
            region: 'Tabuk Province',
            country: 'Saudi Arabia'
          }
        },
        portfolioTags: ['MegaProjects', 'Infrastructure', 'Sustainable Development'],
        commercialRegistration: {
          number: 'CR-NEOM-001',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
          verified: true
        },
        vatNumber: {
          number: 'VAT-NEOM-001',
          verified: true
        },
        services: ['MegaProject Development', 'Infrastructure Planning', 'Sustainable Development'],
        serviceDescriptions: {
          'MegaProject Development': 'Comprehensive mega-project planning and execution',
          'Infrastructure Planning': 'Large-scale infrastructure development and management',
          'Sustainable Development': 'Environmentally responsible development initiatives'
        },
        yearsInBusiness: 5,
        employeeCount: '1000-5000',
        annualRevenueRange: '500M-1B',
        capacity: {
          maxProjectValue: 10000000000,
          concurrentProjects: 20
        },
        keyProjects: [
          {
            id: 'neom_project_1',
            title: 'NEOM City Infrastructure Phase 1',
            description: 'Initial infrastructure development for NEOM city',
            completionDate: '2023-12-31',
            value: 5000000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'neom_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'neom_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        companyProfile: [
          {
            name: 'neom_company_profile.pdf',
            size: 2560000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2030-01-01'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        companyProfile: {
          documentType: 'companyProfile',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Company profile document reviewed and approved'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'NEOM Development Authority verified. All documents in order. Authorized for mega-project creation.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. NEOM Development Authority profile complete. Approved for full platform access including mega-project creation.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        services: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 95,
      createdAt: baseDate.toISOString()
    });

    const beneficiaryB = createUserIfNotExists({
      email: 'entity2@pmtwin.com',
      password: btoa('Entity123'),
      role: 'project_lead',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966502345678',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Saudi Real Estate Company',
        crNumber: 'CR-SREC-002',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2015-01-01',
        crExpiryDate: '2025-01-01',
        taxNumber: 'VAT-SREC-002',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '2222222222',
        authorizedRepresentativeName: 'Mohammed Al-Riyadh',
        scaClassifications: ['Residential Development', 'Commercial Development', 'Mixed-Use Development'],
        scaVerified: true
      },
      profile: {
        name: 'Saudi Real Estate Company',
        companyName: 'Saudi Real Estate Company',
        legalName: 'Saudi Real Estate Company Ltd.',
        phone: '+966502345678',
        website: 'https://www.srec.com.sa',
        companyDescription: 'Premier real estate development company specializing in residential, commercial, and mixed-use projects across Saudi Arabia. Established in 2015 with a strong track record in urban development.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'King Fahd Road, Al Olaya',
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        branches: [
          {
            id: 'branch_1',
            name: 'Jeddah Branch',
            address: 'Corniche Road, Al Hamra',
            city: 'Jeddah',
            region: 'Makkah Province',
            country: 'Saudi Arabia',
            phone: '+966122345678'
          }
        ],
        portfolioTags: ['Residential', 'Commercial', 'Mixed-Use'],
        commercialRegistration: {
          number: 'CR-SREC-002',
          issueDate: '2015-01-01',
          expiryDate: '2025-01-01',
          verified: true
        },
        vatNumber: {
          number: 'VAT-SREC-002',
          verified: true
        },
        services: ['Residential Development', 'Commercial Development', 'Mixed-Use Projects', 'Property Management'],
        serviceDescriptions: {
          'Residential Development': 'Luxury residential towers and communities',
          'Commercial Development': 'Office buildings and retail centers',
          'Mixed-Use Projects': 'Integrated mixed-use developments'
        },
        yearsInBusiness: 10,
        employeeCount: '500-1000',
        annualRevenueRange: '200M-500M',
        capacity: {
          maxProjectValue: 500000000,
          concurrentProjects: 10
        },
        keyProjects: [
          {
            id: 'srec_project_1',
            title: 'King Fahd District Residential Tower',
            description: '30-story luxury residential tower in King Fahd District',
            completionDate: '2023-06-30',
            value: 150000000
          },
          {
            id: 'srec_project_2',
            title: 'Al Olaya Commercial Complex',
            description: 'Mixed-use commercial complex with retail and offices',
            completionDate: '2022-12-15',
            value: 200000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'srec_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'srec_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        companyProfile: [
          {
            name: 'srec_company_profile.pdf',
            size: 2560000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2025-01-01'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        companyProfile: {
          documentType: 'companyProfile',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Company profile document reviewed and approved'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Saudi Real Estate Company verified. All documents in order. Authorized for project creation.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Saudi Real Estate Company profile complete. Approved for full platform access including project creation.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        services: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 92,
      createdAt: baseDate.toISOString()
    });

    // 2. Vendors (2)
    const vendorAlpha = createUserIfNotExists({
      email: 'vendor.alpha@pmtwin.com',
      password: btoa('Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966503456789',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Alpha Construction Group',
        crNumber: 'CR-ALPHA-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2010-05-15',
        crExpiryDate: '2025-05-15',
        taxNumber: 'VAT-ALPHA-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '3333333333',
        authorizedRepresentativeName: 'Khalid Al-Alpha',
        scaClassifications: ['General Contracting', 'Infrastructure Development', 'MegaProjects'],
        scaVerified: true
      },
      profile: {
        name: 'Alpha Construction Group',
        companyName: 'Alpha Construction Group',
        legalName: 'Alpha Construction Group Ltd.',
        phone: '+966503456789',
        website: 'https://www.alphaconstruction.com.sa',
        companyDescription: 'Leading construction company specializing in mega-projects and large-scale infrastructure development. Established in 2010 with extensive experience in complex construction projects across Saudi Arabia.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'King Abdullah Road, Al Malqa',
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        branches: [
          {
            id: 'branch_1',
            name: 'Jeddah Branch',
            address: 'Prince Sultan Street, Al Hamra',
            city: 'Jeddah',
            region: 'Makkah Province',
            country: 'Saudi Arabia',
            phone: '+966123456789'
          }
        ],
        registrationNo: 'CR-ALPHA-001',
        capacityScore: 95,
        categories: ['General Contracting', 'Infrastructure', 'MegaProjects'],
        services: ['General Contracting', 'Infrastructure Development', 'MegaProject Management', 'Civil Engineering'],
        serviceDescriptions: {
          'General Contracting': 'Full-service general contracting for large-scale projects',
          'Infrastructure Development': 'Highway, bridge, and public infrastructure construction',
          'MegaProject Management': 'Comprehensive management of mega-projects',
          'Civil Engineering': 'Advanced civil engineering services'
        },
        yearsInBusiness: 15,
        employeeCount: '1000-5000',
        annualRevenueRange: '500M-1B',
        capacity: {
          maxProjectValue: 1000000000,
          concurrentProjects: 15
        },
        insurance: {
          policyNumber: 'INS-ALPHA-001',
          coverage: 1000000000,
          expiryDate: '2025-12-31'
        },
        liability: {
          coverage: 500000000,
          expiryDate: '2025-12-31'
        },
        keyProjects: [
          {
            id: 'alpha_project_1',
            title: 'Riyadh Metro Line 3',
            description: 'Construction of metro line 3 including stations and infrastructure',
            completionDate: '2023-09-30',
            value: 800000000
          },
          {
            id: 'alpha_project_2',
            title: 'King Abdullah Financial District Phase 2',
            description: 'Multi-building complex in KAFD',
            completionDate: '2022-11-15',
            value: 1200000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'alpha_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'alpha_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        companyProfile: [
          {
            name: 'alpha_company_profile.pdf',
            size: 2560000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2025-05-15'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        companyProfile: {
          documentType: 'companyProfile',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Company profile document reviewed and approved'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Alpha Construction Group verified. High capacity score. Authorized for mega-project proposals.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Alpha Construction Group profile complete. Approved for full platform access including mega-project proposals.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        services: true,
        documents: true,
        portfolio: true,
        insurance: true
      },
      onboardingProgress: 96,
      createdAt: baseDate.toISOString()
    });

    const vendorBeta = createUserIfNotExists({
      email: 'vendor.beta@pmtwin.com',
      password: btoa('Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966504567890',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Beta Infrastructure Ltd',
        crNumber: 'CR-BETA-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2012-03-20',
        crExpiryDate: '2027-03-20',
        taxNumber: 'VAT-BETA-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '4444444444',
        authorizedRepresentativeName: 'Omar Al-Beta',
        scaClassifications: ['Infrastructure Development', 'Residential Construction', 'Commercial Construction'],
        scaVerified: true
      },
      profile: {
        name: 'Beta Infrastructure Ltd',
        companyName: 'Beta Infrastructure Ltd',
        legalName: 'Beta Infrastructure Limited',
        phone: '+966504567890',
        website: 'https://www.betainfrastructure.com.sa',
        companyDescription: 'Established infrastructure and construction company specializing in residential and commercial projects. Known for quality execution and timely delivery across the Makkah region.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'Prince Sultan Street, Al Hamra',
            city: 'Jeddah',
            region: 'Makkah Province',
            country: 'Saudi Arabia'
          }
        },
        registrationNo: 'CR-BETA-001',
        capacityScore: 88,
        categories: ['Infrastructure', 'Residential', 'Commercial'],
        services: ['Infrastructure Development', 'Residential Construction', 'Commercial Construction', 'Project Management'],
        serviceDescriptions: {
          'Infrastructure Development': 'Roads, bridges, and public infrastructure',
          'Residential Construction': 'Residential buildings and communities',
          'Commercial Construction': 'Commercial buildings and retail centers',
          'Project Management': 'Comprehensive project management services'
        },
        yearsInBusiness: 13,
        employeeCount: '500-1000',
        annualRevenueRange: '200M-500M',
        capacity: {
          maxProjectValue: 500000000,
          concurrentProjects: 10
        },
        insurance: {
          policyNumber: 'INS-BETA-001',
          coverage: 500000000,
          expiryDate: '2025-12-31'
        },
        liability: {
          coverage: 250000000,
          expiryDate: '2025-12-31'
        },
        keyProjects: [
          {
            id: 'beta_project_1',
            title: 'Jeddah Corniche Development',
            description: 'Infrastructure development along Jeddah Corniche',
            completionDate: '2023-05-30',
            value: 300000000
          },
          {
            id: 'beta_project_2',
            title: 'Al Hamra Residential Complex',
            description: 'Residential complex with 500 units',
            completionDate: '2022-10-15',
            value: 250000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'beta_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'beta_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        companyProfile: [
          {
            name: 'beta_company_profile.pdf',
            size: 2560000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2027-03-20'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        companyProfile: {
          documentType: 'companyProfile',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Company profile document reviewed and approved'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Beta Infrastructure Ltd verified. Good capacity score. Authorized for project proposals.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Beta Infrastructure Ltd profile complete. Approved for full platform access including project proposals.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        services: true,
        documents: true,
        portfolio: true,
        insurance: true
      },
      onboardingProgress: 94,
      createdAt: baseDate.toISOString()
    });

    // 3. Service Providers (3)
    const bimProvider = createUserIfNotExists({
      email: 'bim@pmtwin.com',
      password: btoa('Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966505678901',
      mobileVerified: true,
      identity: {
        legalEntityName: 'BIM Solutions Co',
        crNumber: 'CR-BIM-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2018-06-10',
        crExpiryDate: '2028-06-10',
        taxNumber: 'VAT-BIM-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '5555555555',
        authorizedRepresentativeName: 'Faisal Al-BIM',
        scaClassifications: ['Engineering Services', 'Design Services'],
        scaVerified: true
      },
      profile: {
        name: 'BIM Solutions Co',
        companyName: 'BIM Solutions Co',
        legalName: 'BIM Solutions Company',
        phone: '+966505678901',
        website: 'https://www.bimsolutions.com.sa',
        bio: 'Leading BIM coordination and modeling services provider for mega-projects. Specialized in clash detection, IFC coordination, and 4D scheduling integration.',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        skills: ['BIM Modeling', 'Clash Detection', 'IFC Coordination', '4D Scheduling'],
        experienceLevel: 'senior',
        certifications: [
          {
            name: 'Autodesk Certified Professional',
            issuer: 'Autodesk',
            issueDate: '2020-01-15',
            expiryDate: '2025-01-15',
            credentialId: 'ACP-BIM-001'
          },
          {
            name: 'BIM Level 2',
            issuer: 'UK BIM Alliance',
            issueDate: '2019-05-20',
            expiryDate: null,
            credentialId: 'BIM-L2-001'
          }
        ],
        availability: 'available',
        rateCard: {
          hourly: 500,
          daily: 4000,
          monthly: 80000,
          currency: 'SAR'
        },
        portfolio: [
          {
            id: 'bim_portfolio_1',
            title: 'NEOM Infrastructure BIM Coordination',
            description: 'Comprehensive BIM coordination for NEOM infrastructure project',
            completionDate: '2023-08-30',
            link: 'https://portfolio.bimsolutions.com/neom',
            value: 2000000
          },
          {
            id: 'bim_portfolio_2',
            title: 'Riyadh Metro BIM Modeling',
            description: 'Complete BIM modeling for Riyadh Metro stations',
            completionDate: '2022-12-15',
            link: 'https://portfolio.bimsolutions.com/metro',
            value: 1500000
          }
        ],
        yearsInBusiness: 7,
        employeeCount: '50-100',
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'bim_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'bim_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        professionalLicense: [
          {
            name: 'bim_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        additionalCerts: [
          {
            name: 'autodesk_cert.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2028-06-10'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        professionalLicense: {
          documentType: 'professionalLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Professional license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'BIM Solutions Co verified. Strong portfolio in BIM coordination. Authorized for service offers.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. BIM Solutions Co profile complete. Approved for service provider access.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        professionalDetails: true,
        skills: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 93,
      createdAt: baseDate.toISOString()
    });

    const qaProvider = createUserIfNotExists({
      email: 'qa@pmtwin.com',
      password: btoa('Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966506789012',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Quality Assurance Services',
        crNumber: 'CR-QA-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2015-08-15',
        crExpiryDate: '2025-08-15',
        taxNumber: 'VAT-QA-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '6666666666',
        authorizedRepresentativeName: 'Hassan Al-QA',
        scaClassifications: ['Quality Control', 'Inspection Services'],
        scaVerified: true
      },
      profile: {
        name: 'Quality Assurance Services',
        companyName: 'Quality Assurance Services',
        legalName: 'Quality Assurance Services Company',
        phone: '+966506789012',
        website: 'https://www.qaservices.com.sa',
        bio: 'Comprehensive QA/QC services for construction projects. Specialized in site inspection, quality control, NCR management, and testing & commissioning.',
        status: 'approved',
        location: {
          city: 'Dammam',
          region: 'Eastern Province',
          country: 'Saudi Arabia'
        },
        skills: ['Site Inspection', 'Quality Control', 'NCR Management', 'Testing & Commissioning'],
        experienceLevel: 'senior',
        certifications: [
          {
            name: 'ISO 9001 Lead Auditor',
            issuer: 'ISO',
            issueDate: '2021-03-10',
            expiryDate: '2026-03-10',
            credentialId: 'ISO-9001-LA-001'
          },
          {
            name: 'NCR Management Certified',
            issuer: 'Quality Management Institute',
            issueDate: '2020-06-20',
            expiryDate: '2025-06-20',
            credentialId: 'NCR-MGMT-001'
          }
        ],
        availability: 'available',
        rateCard: {
          hourly: 400,
          daily: 3200,
          monthly: 60000,
          currency: 'SAR'
        },
        portfolio: [
          {
            id: 'qa_portfolio_1',
            title: 'MEP Quality Control - NEOM Project',
            description: 'Comprehensive QA/QC services for MEP installation in NEOM project',
            completionDate: '2023-10-30',
            link: 'https://portfolio.qaservices.com/neom',
            value: 1200000
          },
          {
            id: 'qa_portfolio_2',
            title: 'Site Inspection - Riyadh Metro',
            description: 'Weekly site inspections and NCR management for Riyadh Metro',
            completionDate: '2023-02-28',
            link: 'https://portfolio.qaservices.com/metro',
            value: 800000
          }
        ],
        yearsInBusiness: 10,
        employeeCount: '50-100',
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'qa_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'qa_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        professionalLicense: [
          {
            name: 'qa_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        additionalCerts: [
          {
            name: 'iso_9001_cert.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2025-08-15'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        professionalLicense: {
          documentType: 'professionalLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Professional license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Quality Assurance Services verified. Strong expertise in QA/QC. Authorized for service offers.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Quality Assurance Services profile complete. Approved for service provider access.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        professionalDetails: true,
        skills: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 91,
      createdAt: baseDate.toISOString()
    });

    const schedulerProvider = createUserIfNotExists({
      email: 'scheduler@pmtwin.com',
      password: btoa('Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966507890123',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Project Planning Experts',
        crNumber: 'CR-SCHED-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2016-04-12',
        crExpiryDate: '2026-04-12',
        taxNumber: 'VAT-SCHED-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '7777777777',
        authorizedRepresentativeName: 'Yusuf Al-Scheduler',
        scaClassifications: ['Project Management', 'Planning Services'],
        scaVerified: true
      },
      profile: {
        name: 'Project Planning Experts',
        companyName: 'Project Planning Experts',
        legalName: 'Project Planning Experts Company',
        phone: '+966507890123',
        website: 'https://www.planningexperts.com.sa',
        bio: 'Expert project planning and scheduling services using Primavera P6. Specialized in critical path analysis, resource planning, and schedule optimization for mega-projects.',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        skills: ['Project Scheduling', 'Resource Planning', 'Critical Path Analysis', 'Primavera P6'],
        experienceLevel: 'senior',
        certifications: [
          {
            name: 'PMP',
            issuer: 'PMI',
            issueDate: '2020-05-15',
            expiryDate: '2026-05-15',
            credentialId: 'PMP-SCHED-001'
          },
          {
            name: 'Primavera P6 Certified',
            issuer: 'Oracle',
            issueDate: '2019-09-10',
            expiryDate: '2024-09-10',
            credentialId: 'P6-CERT-001'
          }
        ],
        availability: 'available',
        rateCard: {
          hourly: 450,
          daily: 3600,
          monthly: 70000,
          currency: 'SAR'
        },
        portfolio: [
          {
            id: 'sched_portfolio_1',
            title: 'Mega-Project Scheduling - NEOM Package',
            description: 'Comprehensive project planning and scheduling for NEOM mega-project',
            completionDate: '2023-11-30',
            link: 'https://portfolio.planningexperts.com/neom',
            value: 1500000
          },
          {
            id: 'sched_portfolio_2',
            title: 'Resource Planning - Infrastructure Project',
            description: 'Resource planning and critical path analysis for infrastructure project',
            completionDate: '2023-03-15',
            link: 'https://portfolio.planningexperts.com/infra',
            value: 900000
          }
        ],
        yearsInBusiness: 9,
        employeeCount: '50-100',
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'sched_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'sched_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        professionalLicense: [
          {
            name: 'sched_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        additionalCerts: [
          {
            name: 'pmp_cert.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2026-04-12'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        professionalLicense: {
          documentType: 'professionalLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Professional license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Project Planning Experts verified. Strong expertise in project scheduling. Authorized for service offers.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Project Planning Experts profile complete. Approved for service provider access.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        professionalDetails: true,
        skills: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 92,
      createdAt: baseDate.toISOString()
    });

    // 4. Consultant (1)
    const consultant = createUserIfNotExists({
      email: 'consultant@pmtwin.com',
      password: btoa('Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966508901234',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Green Building Consultants',
        crNumber: 'CR-CONS-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2014-09-20',
        crExpiryDate: '2024-09-20',
        taxNumber: 'VAT-CONS-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '8888888888',
        authorizedRepresentativeName: 'Nasser Al-Consultant',
        scaClassifications: ['Consulting Services', 'Advisory Services'],
        scaVerified: true
      },
      profile: {
        name: 'Green Building Consultants',
        companyName: 'Green Building Consultants',
        legalName: 'Green Building Consultants Company',
        phone: '+966508901234',
        website: 'https://www.greenbuildingconsultants.com.sa',
        bio: 'Leading sustainability and green building consultants specializing in LEED certification, environmental compliance, and energy efficiency solutions for construction projects.',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        expertiseAreas: ['Sustainability', 'LEED Certification', 'Environmental Compliance', 'Energy Efficiency'],
        experienceLevel: 'expert',
        certifications: [
          {
            name: 'LEED AP BD+C',
            issuer: 'USGBC',
            issueDate: '2019-03-15',
            expiryDate: '2025-03-15',
            credentialId: 'LEED-AP-001'
          },
          {
            name: 'Sustainability Consultant Certification',
            issuer: 'Green Building Council',
            issueDate: '2020-06-10',
            expiryDate: '2025-06-10',
            credentialId: 'SUS-CONS-001'
          }
        ],
        advisoryHistoryCount: 25,
        mentorshipTags: ['Sustainability', 'Green Building'],
        portfolio: [
          {
            id: 'cons_portfolio_1',
            title: 'LEED Certification - NEOM Project',
            description: 'Comprehensive LEED certification support for NEOM sustainable development',
            completionDate: '2023-12-31',
            link: 'https://portfolio.greenbuildingconsultants.com/neom',
            value: 3000000
          },
          {
            id: 'cons_portfolio_2',
            title: 'Sustainability Assessment - Mega Project',
            description: 'Complete sustainability assessment and compliance verification',
            completionDate: '2023-07-30',
            link: 'https://portfolio.greenbuildingconsultants.com/assessment',
            value: 2500000
          }
        ],
        yearsInBusiness: 11,
        employeeCount: '50-100',
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'cons_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'cons_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        professionalLicense: [
          {
            name: 'cons_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        additionalCerts: [
          {
            name: 'leed_cert.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2024-09-20'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        professionalLicense: {
          documentType: 'professionalLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Professional license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Green Building Consultants verified. Strong advisory history. Authorized for advisory contracts.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Green Building Consultants profile complete. Approved for consultant access including advisory contracts.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        professionalDetails: true,
        expertise: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 94,
      createdAt: baseDate.toISOString()
    });

    // 5. Sub-Contractors (2)
    const mepSub = createUserIfNotExists({
      email: 'mep.sub@pmtwin.com',
      password: btoa('SubContractor123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966509012345',
      mobileVerified: true,
      identity: {
        legalEntityName: 'MEP Specialists LLC',
        crNumber: 'CR-MEP-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2017-11-05',
        crExpiryDate: '2027-11-05',
        taxNumber: 'VAT-MEP-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '9999999999',
        authorizedRepresentativeName: 'Salem Al-MEP',
        scaClassifications: ['MEP Installation', 'HVAC Services'],
        scaVerified: true
      },
      profile: {
        name: 'MEP Specialists LLC',
        companyName: 'MEP Specialists LLC',
        legalName: 'MEP Specialists Limited Liability Company',
        phone: '+966509012345',
        website: 'https://www.mepspecialists.com.sa',
        companyDescription: 'Specialized MEP installation and services company. Expert in mechanical, electrical, and plumbing systems for large-scale construction projects.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'Industrial Area, Al Malaz',
            city: 'Riyadh',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        trade: 'MEP',
        parentVendorId: null, // Will be linked via contracts
        services: ['MEP Installation', 'HVAC Systems', 'Electrical Systems', 'Plumbing'],
        serviceDescriptions: {
          'MEP Installation': 'Complete MEP installation services',
          'HVAC Systems': 'HVAC design, installation, and commissioning',
          'Electrical Systems': 'Electrical distribution and systems',
          'Plumbing': 'Plumbing systems and fixtures'
        },
        yearsInBusiness: 8,
        employeeCount: '100-500',
        annualRevenueRange: '50M-100M',
        capacity: {
          maxProjectValue: 200000000,
          concurrentProjects: 8
        },
        keyProjects: [
          {
            id: 'mep_project_1',
            title: 'MEP Installation - NEOM Project',
            description: 'Complete MEP installation for NEOM infrastructure',
            completionDate: '2023-12-31',
            value: 50000000
          },
          {
            id: 'mep_project_2',
            title: 'HVAC Systems - Commercial Complex',
            description: 'HVAC design and installation for commercial complex',
            completionDate: '2023-05-30',
            value: 30000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'mep_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'mep_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        tradeLicense: [
          {
            name: 'mep_trade_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2027-11-05'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        tradeLicense: {
          documentType: 'tradeLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Trade license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'MEP Specialists LLC verified. Specialized in MEP installation. Authorized for sub-contractor work.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. MEP Specialists LLC profile complete. Approved for sub-contractor access.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        trade: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 90,
      createdAt: baseDate.toISOString()
    });

    const steelSub = createUserIfNotExists({
      email: 'steel.sub@pmtwin.com',
      password: btoa('SubContractor123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966500123456',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Steel Fabrication Co',
        crNumber: 'CR-STEEL-001',
        crVerified: true,
        crVerifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        crIssueDate: '2016-07-18',
        crExpiryDate: '2026-07-18',
        taxNumber: 'VAT-STEEL-001',
        taxNumberVerified: true,
        authorizedRepresentativeNID: '1010101010',
        authorizedRepresentativeName: 'Majed Al-Steel',
        scaClassifications: ['Steel Fabrication', 'Steel Erection'],
        scaVerified: true
      },
      profile: {
        name: 'Steel Fabrication Co',
        companyName: 'Steel Fabrication Co',
        legalName: 'Steel Fabrication Company',
        phone: '+966500123456',
        website: 'https://www.steelfabrication.com.sa',
        companyDescription: 'Leading steel fabrication and erection company. Specialized in structural steel fabrication, erection, and quality certification for construction projects.',
        status: 'approved',
        location: {
          headquarters: {
            address: 'Industrial City, Jubail',
            city: 'Jubail',
            region: 'Eastern Province',
            country: 'Saudi Arabia'
          }
        },
        trade: 'Steel Fabrication',
        parentVendorId: null, // Will be linked via contracts
        services: ['Steel Fabrication', 'Steel Erection', 'Quality Certification'],
        serviceDescriptions: {
          'Steel Fabrication': 'Structural steel fabrication and manufacturing',
          'Steel Erection': 'Steel structure erection and installation',
          'Quality Certification': 'Quality control and certification services'
        },
        yearsInBusiness: 9,
        employeeCount: '100-500',
        annualRevenueRange: '50M-100M',
        capacity: {
          maxProjectValue: 150000000,
          concurrentProjects: 6
        },
        keyProjects: [
          {
            id: 'steel_project_1',
            title: 'Steel Fabrication - NEOM Project',
            description: 'Steel fabrication and erection for NEOM infrastructure',
            completionDate: '2023-09-30',
            value: 30000000
          },
          {
            id: 'steel_project_2',
            title: 'Structural Steel - Commercial Building',
            description: 'Steel fabrication and erection for commercial building',
            completionDate: '2023-03-15',
            value: 20000000
          }
        ],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
      documents: {
        cr: [
          {
            name: 'steel_cr.pdf',
            size: 1024000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        vat: [
          {
            name: 'steel_vat.pdf',
            size: 896000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ],
        tradeLicense: [
          {
            name: 'steel_trade_license.pdf',
            size: 1536000,
            type: 'application/pdf',
            uploadedAt: baseDate.toISOString()
          }
        ]
      },
      documentVerifications: {
        cr: {
          documentType: 'cr',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'CR verified and valid until 2026-07-18'
        },
        vat: {
          documentType: 'vat',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'VAT certificate verified'
        },
        tradeLicense: {
          documentType: 'tradeLicense',
          verified: true,
          verifiedBy: 'system',
          verifiedByName: 'System Admin',
          verifiedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Trade license verified'
        }
      },
      vettingComments: [
        {
          id: 'comment_1',
          comment: 'Steel Fabrication Co verified. Specialized in steel fabrication. Authorized for sub-contractor work.',
          addedBy: 'system',
          addedByName: 'System Admin',
          addedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      review: {
        submittedAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        reviewedBy: 'system',
        status: 'approved',
        reviewNotes: 'All documents verified. Steel Fabrication Co profile complete. Approved for sub-contractor access.'
      },
      profileSections: {
        basicInfo: true,
        companyDetails: true,
        businessDetails: true,
        trade: true,
        documents: true,
        portfolio: true
      },
      onboardingProgress: 89,
      createdAt: baseDate.toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      users: {
        beneficiaryA,
        beneficiaryB,
        vendorAlpha,
        vendorBeta,
        bimProvider,
        qaProvider,
        schedulerProvider,
        consultant,
        mepSub,
        steelSub
      }
    };
  }

  // ============================================
  // B) Project Structure
  // ============================================
  // ============================================
  // Create Golden Opportunities (Unified Model)
  // ============================================
  function createGoldenOpportunities(forceReload = false) {
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Opportunities) {
      console.warn('Opportunities model not available');
      return { created: 0, skipped: 0 };
    }

    const opportunities = PMTwinData.Opportunities.getAll();
    const users = PMTwinData.Users.getAll();
    
    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const beneficiaryB = users.find(u => u.email === 'entity2@pmtwin.com');
    const serviceProviderA = users.find(u => u.email === 'bim@pmtwin.com');
    const serviceProviderB = users.find(u => u.email === 'legal@pmtwin.com');

    if (!beneficiaryA || !beneficiaryB) {
      console.warn('Beneficiaries not found, skipping opportunity creation');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    // Helper to create opportunity if not exists
    function createOpportunityIfNotExists(opportunityData) {
      const exists = opportunities.some(o => o.id === opportunityData.id);
      if (exists && !forceReload) {
        skipped.push(opportunityData.id);
        return null;
      }
      
      if (exists && forceReload) {
        PMTwinData.Opportunities.delete(opportunityData.id);
      }

      const opportunity = PMTwinData.Opportunities.create(opportunityData);
      if (opportunity) {
        created.push(opportunity.id);
      }
      return opportunity;
    }

    const now = new Date();
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // 1. REQUEST_SERVICE - Riyadh (Structural Engineering)
    createOpportunityIfNotExists({
      id: 'opp_request_riyadh_001',
      title: 'Structural Engineering Review for Riyadh Metro Station',
      description: 'Review and approve shop drawings for structural elements including foundations, columns, beams, and slabs. Provide structural calculations and ensure compliance with Saudi Building Code.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Structural Engineering', 'Foundation Design', 'Seismic Analysis', 'SBC Code'],
      serviceItems: [
        {
          id: 'item_1',
          name: 'Shop Drawing Review',
          description: 'Review structural shop drawings for compliance',
          unit: 'drawing',
          qty: 50,
          unitPriceRef: 500,
          totalRef: 25000,
          currency: 'SAR'
        },
        {
          id: 'item_2',
          name: 'Structural Calculations',
          description: 'Provide detailed structural calculations',
          unit: 'calculation',
          qty: 20,
          unitPriceRef: 1500,
          totalRef: 30000,
          currency: 'SAR'
        },
        {
          id: 'item_3',
          name: 'Code Compliance Report',
          description: 'SBC code compliance verification report',
          unit: 'report',
          qty: 1,
          unitPriceRef: 25000,
          totalRef: 25000,
          currency: 'SAR'
        }
      ],
      paymentTerms: {
        mode: 'CASH',
        barterRule: null,
        cashSettlement: 0,
        acknowledgedDifference: false
      },
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Al Olaya',
        address: 'King Fahd Road, Metro Station Site',
        geo: {
          lat: 24.7136,
          lng: 46.6753
        },
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
      attributes: {
        duration: 45,
        startDate: '2024-03-01',
        experienceLevel: 'Senior'
      }
    });

    // 2. REQUEST_SERVICE - Jeddah (MEP Design)
    createOpportunityIfNotExists({
      id: 'opp_request_jeddah_001',
      title: 'MEP Design Consultation for Luxury Residential Towers',
      description: 'Seeking MEP design consultation for luxury residential towers including HVAC, electrical, and plumbing systems optimization.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['MEP Design', 'HVAC Systems', 'Building Services', 'Electrical Design'],
      serviceItems: [
        {
          id: 'item_4',
          name: 'HVAC System Design',
          description: 'Complete HVAC system design and optimization',
          unit: 'system',
          qty: 2,
          unitPriceRef: 150000,
          totalRef: 300000,
          currency: 'SAR'
        },
        {
          id: 'item_5',
          name: 'Electrical System Design',
          description: 'Electrical distribution and lighting design',
          unit: 'system',
          qty: 2,
          unitPriceRef: 100000,
          totalRef: 200000,
          currency: 'SAR'
        }
      ],
      paymentTerms: {
        mode: 'CASH',
        barterRule: null,
        cashSettlement: 0,
        acknowledgedDifference: false
      },
      location: {
        country: 'Saudi Arabia',
        city: 'Jeddah',
        area: 'Corniche',
        address: 'Corniche Road, Marina Towers Site',
        geo: {
          lat: 21.5433,
          lng: 39.1728
        },
        isRemoteAllowed: false
      },
      createdBy: projectLeadB.id,
      createdAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      attributes: {
        duration: 60,
        startDate: '2024-04-01',
        experienceLevel: 'Expert'
      }
    });

    // 3. OFFER_SERVICE - Riyadh (BIM Services)
    if (serviceProviderA) {
      createOpportunityIfNotExists({
        id: 'opp_offer_riyadh_001',
        title: 'BIM Coordination Services',
        description: 'Professional BIM coordination services for construction projects. 3D modeling, clash detection, and coordination drawings.',
        intent: 'OFFER_SERVICE',
        model: '1',
        subModel: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        status: 'published',
        skills: ['BIM Coordination', '3D Modeling', 'Clash Detection', 'Revit'],
        serviceItems: [
          {
            id: 'item_6',
            name: 'BIM Model Creation',
            description: 'Create comprehensive BIM models',
            unit: 'model',
            qty: 1,
            unitPriceRef: 50000,
            totalRef: 50000,
            currency: 'SAR'
          },
          {
            id: 'item_7',
            name: 'Clash Detection',
            description: 'Perform clash detection and resolution',
            unit: 'session',
            qty: 5,
            unitPriceRef: 10000,
            totalRef: 50000,
            currency: 'SAR'
          }
        ],
        paymentTerms: {
          mode: 'CASH',
          barterRule: null,
          cashSettlement: 0,
          acknowledgedDifference: false
        },
        location: {
          country: 'Saudi Arabia',
          city: 'Riyadh',
          area: 'Al Malaz',
          address: null,
          geo: {
            lat: 24.6408,
            lng: 46.7728
          },
          isRemoteAllowed: true
        },
        createdBy: serviceProviderA.id,
        createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        attributes: {
          availability: 'Available immediately',
          responseTime: '24 hours'
        }
      });
    }

    // 4. OFFER_SERVICE - Remote (Legal Consultation)
    if (serviceProviderB) {
      createOpportunityIfNotExists({
        id: 'opp_offer_remote_001',
        title: 'Legal Consultation for Construction Contracts',
        description: 'Expert legal consultation services for construction contracts, procurement agreements, and regulatory compliance.',
        intent: 'OFFER_SERVICE',
        model: '1',
        subModel: '1.1',
        modelName: 'Task-Based Engagement',
        category: 'Project-Based Collaboration',
        status: 'published',
        skills: ['Legal Consultation', 'Contract Review', 'Construction Law', 'Regulatory Compliance'],
        serviceItems: [
          {
            id: 'item_8',
            name: 'Contract Review',
            description: 'Review and advise on construction contracts',
            unit: 'contract',
            qty: 1,
            unitPriceRef: 15000,
            totalRef: 15000,
            currency: 'SAR'
          },
          {
            id: 'item_9',
            name: 'Legal Consultation',
            description: 'Hourly legal consultation services',
            unit: 'hour',
            qty: 10,
            unitPriceRef: 2000,
            totalRef: 20000,
            currency: 'SAR'
          }
        ],
        paymentTerms: {
          mode: 'BARTER',
          barterRule: 'ALLOW_DIFFERENCE_CASH',
          cashSettlement: 0,
          acknowledgedDifference: false
        },
        location: {
          country: 'Saudi Arabia',
          city: 'Riyadh',
          area: null,
          address: null,
          geo: null,
          isRemoteAllowed: true
        },
        createdBy: serviceProviderB.id,
        createdAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        attributes: {
          availability: 'Available for remote consultation',
          responseTime: '48 hours'
        }
      });
    }

    // 5. MEGA PROJECT - SPV (NEOM Infrastructure)
    createOpportunityIfNotExists({
      id: 'opp_mega_spv_001',
      title: 'NEOM Infrastructure Development - SPV Structure',
      description: 'Comprehensive infrastructure development for NEOM including roads, utilities, and facilities. Structured as Special Purpose Vehicle (SPV) for risk isolation and financing.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.4',
      modelName: 'Special Purpose Vehicle (SPV)',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Infrastructure Development', 'Civil Engineering', 'Project Finance', 'SPV Structuring'],
      serviceItems: [
        {
          id: 'item_10',
          name: 'Road Infrastructure',
          description: 'Design and construction of road network',
          unit: 'km',
          qty: 50,
          unitPriceRef: 5000000,
          totalRef: 250000000,
          currency: 'SAR'
        },
        {
          id: 'item_11',
          name: 'Utilities Infrastructure',
          description: 'Water, sewer, and electrical utilities',
          unit: 'package',
          qty: 1,
          unitPriceRef: 150000000,
          totalRef: 150000000,
          currency: 'SAR'
        },
        {
          id: 'item_12',
          name: 'Facilities Development',
          description: 'Administrative and support facilities',
          unit: 'facility',
          qty: 5,
          unitPriceRef: 20000000,
          totalRef: 100000000,
          currency: 'SAR'
        }
      ],
      paymentTerms: {
        mode: 'CASH',
        barterRule: null,
        cashSettlement: 0,
        acknowledgedDifference: false
      },
      location: {
        country: 'Saudi Arabia',
        city: 'NEOM',
        area: 'Tabuk Province',
        address: 'NEOM Development Zone',
        geo: {
          lat: 28.0339,
          lng: 35.0000
        },
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
      attributes: {
        projectValue: 500000000,
        spvValue: 500000000,
        duration: 36,
        workPackages: [
          {
            packageId: 'wp_1',
            title: 'Road Infrastructure Package',
            assignedPartyId: null,
            value: 250000000
          },
          {
            packageId: 'wp_2',
            title: 'Utilities Infrastructure Package',
            assignedPartyId: null,
            value: 150000000
          },
          {
            packageId: 'wp_3',
            title: 'Facilities Development Package',
            assignedPartyId: null,
            value: 100000000
          }
        ]
      }
    });

    console.log(`✅ Created ${created.length} golden opportunities, skipped ${skipped.length}`);
    return { created: created.length, skipped: skipped.length };
  }

  // ============================================
  // Seed v2: New Opportunity Workflow (KSA Only)
  // ============================================
  function SeedNewOpportunityWorkflow(forceReload = false) {
    console.log('🌱 Seed v2: Loading KSA Opportunity Workflow Data...');
    
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return { created: 0, skipped: 0 };
    }

    // Step 1: Clear legacy keys explicitly
    if (typeof UnifiedStorage !== 'undefined') {
      UnifiedStorage.removeLegacyKeys();
    }

    const users = PMTwinData.Users.getAll();
    const opportunities = PMTwinData.Opportunities.getAll();
    const proposals = PMTwinData.Proposals.getAll();
    const contracts = PMTwinData.Contracts.getAll();

    const now = new Date();
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Tracking arrays for created/updated items
    const createdOpps = [];
    const updatedOpps = [];
    const createdProps = [];
    const updatedProps = [];
    const createdContracts = [];

    // Helper to create or get user
    function getOrCreateUser(userData) {
      let user = users.find(u => u.email === userData.email);
      if (!user || forceReload) {
        if (user && forceReload) {
          PMTwinData.Users.delete(user.id);
        }
        user = PMTwinData.Users.create(userData);
      }
      return user;
    }

    // Helper to create opportunity - always create if not exists, update if exists
    function createOpportunityIfNotExists(opportunityData) {
      // Refresh opportunities list to get latest
      const currentOpps = PMTwinData.Opportunities.getAll();
      const exists = currentOpps.some(o => o.id === opportunityData.id);
      
      if (exists && !forceReload) {
        // Update existing opportunity with latest data
        console.log(`[SeedData] Updating existing opportunity: ${opportunityData.id}`);
        const updated = PMTwinData.Opportunities.update(opportunityData.id, opportunityData);
        if (updated) {
          if (!updatedOpps.includes(opportunityData.id)) {
            updatedOpps.push(opportunityData.id);
          }
          
          // Also update in OpportunityStore if available
          if (typeof window.OpportunityStore !== 'undefined' && window.OpportunityStore.updateOpportunity) {
            try {
              const storeOppData = {
                title: updated.title,
                description: updated.description,
                intent: updated.intent || updated.intentType,
                status: updated.status,
                skillsTags: updated.skillsTags || updated.skills || [],
                serviceItems: updated.serviceItems || [],
                paymentTerms: updated.paymentTerms || updated.preferredPaymentTerms || { type: 'CASH' },
                location: updated.location || {}
              };
              window.OpportunityStore.updateOpportunity(opportunityData.id, storeOppData);
            } catch (e) {
              console.warn(`[SeedData] Could not update in OpportunityStore:`, e);
            }
          }
          
          return updated;
        }
        return currentOpps.find(o => o.id === opportunityData.id);
      }
      if (exists && forceReload) {
        PMTwinData.Opportunities.delete(opportunityData.id);
      }
      console.log(`[SeedData] Creating new opportunity: ${opportunityData.id}`);
      const created = PMTwinData.Opportunities.create(opportunityData);
      if (created) {
        if (!createdOpps.includes(created.id)) {
          createdOpps.push(created.id);
        }
        console.log(`[SeedData] ✅ Created opportunity: ${created.id} - ${created.title}`);
        
        // Also add to OpportunityStore if available (for backward compatibility)
        if (typeof window.OpportunityStore !== 'undefined' && window.OpportunityStore.createOpportunity) {
          try {
            // Convert PMTwinData format to OpportunityStore format
            const storeOppData = {
              id: created.id,
              title: created.title,
              description: created.description,
              intent: created.intent || created.intentType,
              model: created.model || created.modelId,
              subModel: created.subModel || created.modelId,
              skillsTags: created.skillsTags || created.skills || [],
              serviceItems: created.serviceItems || [],
              paymentTerms: created.paymentTerms || created.preferredPaymentTerms || { type: 'CASH' },
              location: created.location || {},
              status: created.status || 'PUBLISHED',
              createdByUserId: created.createdBy || created.creatorId,
              createdAt: created.createdAt
            };
            window.OpportunityStore.createOpportunity(storeOppData);
            console.log(`[SeedData] ✅ Also added to OpportunityStore: ${created.id}`);
          } catch (e) {
            console.warn(`[SeedData] Could not add to OpportunityStore:`, e);
          }
        }
      } else {
        console.error(`[SeedData] ❌ Failed to create opportunity: ${opportunityData.id}`);
      }
      return created;
    }

    // Helper to create proposal - always create if not exists, update if exists
    function createProposalIfNotExists(proposalData) {
      // Refresh proposals list to get latest
      const currentProps = PMTwinData.Proposals.getAll();
      const exists = currentProps.some(p => p.id === proposalData.id);
      
      if (exists && !forceReload) {
        // Update existing proposal with latest data
        const updated = PMTwinData.Proposals.update(proposalData.id, proposalData);
        if (updated) {
          if (!updatedProps.includes(proposalData.id)) {
            updatedProps.push(proposalData.id);
          }
          return updated;
        }
        return currentProps.find(p => p.id === proposalData.id);
      }
      if (exists && forceReload) {
        PMTwinData.Proposals.delete(proposalData.id);
      }
      const created = PMTwinData.Proposals.create(proposalData);
      if (created) {
        if (!createdProps.includes(created.id)) {
          createdProps.push(created.id);
        }
      }
      return created;
    }

    // Helper to create contract
    function createContractIfNotExists(contractData) {
      const exists = contracts.some(c => c.id === contractData.id);
      if (exists && !forceReload) {
        return null;
      }
      if (exists && forceReload) {
        PMTwinData.Contracts.delete(contractData.id);
      }
      return PMTwinData.Contracts.create(contractData);
    }

    // Step 2: Create/Update KSA Users (All 8 Roles)
    
    // 1. Platform Admin
    const platformAdmin = getOrCreateUser({
      id: 'user-platform-admin-001',
      email: 'platform.admin@pmtwin.com',
      password: btoa('Admin123'),
      role: 'platform_admin',
      userType: 'admin',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966500000000',
      mobileVerified: true,
      identity: {
        fullLegalName: 'Platform Administrator',
        nationalId: '0000000000',
        nationalIdVerified: true
      },
      profile: {
        name: 'Platform Administrator',
        status: 'approved',
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 2. Project Lead (was beneficiary)
    const projectLeadA = getOrCreateUser({
      email: 'project.lead.riyadh@pmtwin.com',
      password: btoa('ProjectLead123'),
      role: 'project_lead',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966501234567',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Riyadh Development Company',
        crNumber: 'CR-RDC-001',
        crVerified: true,
        authorizedRepresentativeName: 'Ahmed Al-Riyadh'
      },
      profile: {
        name: 'Riyadh Development Company',
        companyName: 'Riyadh Development Company',
        status: 'approved',
        location: {
          headquarters: {
            address: 'King Fahd Road',
            city: 'Riyadh',
            area: 'Olaya',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 3. Project Lead B (Jeddah)
    const projectLeadB = getOrCreateUser({
      email: 'project.lead.jeddah@pmtwin.com',
      password: btoa('ProjectLead123'),
      role: 'project_lead',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966502345678',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Jeddah Construction Group',
        crNumber: 'CR-JCG-002',
        crVerified: true,
        authorizedRepresentativeName: 'Mohammed Al-Jeddah'
      },
      profile: {
        name: 'Jeddah Construction Group',
        companyName: 'Jeddah Construction Group',
        status: 'approved',
        location: {
          headquarters: {
            address: 'Corniche Road',
            city: 'Jeddah',
            area: 'Al Hamra',
            region: 'Makkah Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const beneficiaryB = getOrCreateUser({
      email: 'beneficiary.jeddah@pmtwin.com',
      password: btoa('Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966502345678',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Jeddah Construction Group',
        crNumber: 'CR-JCG-002',
        crVerified: true,
        authorizedRepresentativeName: 'Mohammed Al-Jeddah'
      },
      profile: {
        name: 'Jeddah Construction Group',
        companyName: 'Jeddah Construction Group',
        status: 'approved',
        location: {
          headquarters: {
            address: 'Corniche Road',
            city: 'Jeddah',
            area: 'Al Hamra',
            region: 'Makkah Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Beneficiary A (Riyadh) - find existing or use projectLeadA as fallback
    let beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    if (!beneficiaryA) {
      // Use projectLeadA as beneficiaryA since they're both beneficiaries
      beneficiaryA = projectLeadA;
    }

    const providerCorp1 = getOrCreateUser({
      email: 'provider.riyadh@pmtwin.com',
      password: btoa('Provider123'),
      role: 'service_provider',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966503456789',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Riyadh Engineering Services',
        crNumber: 'CR-RES-003',
        crVerified: true,
        authorizedRepresentativeName: 'Khalid Al-Malaz'
      },
      profile: {
        name: 'Riyadh Engineering Services',
        companyName: 'Riyadh Engineering Services',
        status: 'approved',
        location: {
          headquarters: {
            city: 'Riyadh',
            area: 'Al Malaz',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const providerCorp2 = getOrCreateUser({
      email: 'provider.dammam@pmtwin.com',
      password: btoa('Provider123'),
      role: 'service_provider',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966504567890',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Dammam Surveying Co',
        crNumber: 'CR-DSC-004',
        crVerified: true,
        authorizedRepresentativeName: 'Omar Al-Dammam'
      },
      profile: {
        name: 'Dammam Surveying Co',
        companyName: 'Dammam Surveying Co',
        status: 'approved',
        location: {
          headquarters: {
            city: 'Dammam',
            area: 'Al Faisaliyah',
            region: 'Eastern Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const consultant1 = getOrCreateUser({
      email: 'consultant.jeddah@pmtwin.com',
      password: btoa('Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966505678901',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Jeddah Consulting Group',
        crNumber: 'CR-JCG-005',
        crVerified: true,
        authorizedRepresentativeName: 'Fatima Al-Rawdah'
      },
      profile: {
        name: 'Jeddah Consulting Group',
        companyName: 'Jeddah Consulting Group',
        status: 'approved',
        location: {
          headquarters: {
            city: 'Jeddah',
            area: 'Al Rawdah',
            region: 'Makkah Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 3. Supplier
    const supplier1 = getOrCreateUser({
      email: 'supplier.riyadh@pmtwin.com',
      password: btoa('Supplier123'),
      role: 'supplier',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966507890123',
      mobileVerified: true,
      identity: {
        legalEntityName: 'Riyadh Materials Supply Co',
        crNumber: 'CR-RMSC-006',
        crVerified: true,
        authorizedRepresentativeName: 'Fahad Al-Supplier'
      },
      profile: {
        name: 'Riyadh Materials Supply Co',
        companyName: 'Riyadh Materials Supply Co',
        status: 'approved',
        location: {
          headquarters: {
            city: 'Riyadh',
            area: 'Al Malaz',
            region: 'Riyadh Province',
            country: 'Saudi Arabia'
          }
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 4. Service Provider (already exists as providerCorp1, providerCorp2)
    
    // 5. Consultant (already exists as consultant1)
    
    // 6. Professional
    const professional1 = getOrCreateUser({
      email: 'professional.khobar@pmtwin.com',
      password: btoa('Professional123'),
      role: 'professional',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966506789012',
      mobileVerified: true,
      identity: {
        fullLegalName: 'Saeed Al-Khobar',
        nationalId: '1111111111',
        nationalIdVerified: true
      },
      profile: {
        name: 'Saeed Al-Khobar',
        status: 'approved',
        location: {
          city: 'Khobar',
          area: 'Al Ulaya',
          region: 'Eastern Province',
          country: 'Saudi Arabia'
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 7. Mentor
    const mentor1 = getOrCreateUser({
      email: 'mentor@pmtwin.com',
      password: btoa('Mentor123'),
      role: 'mentor',
      userType: 'mentor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966508901234',
      mobileVerified: true,
      identity: {
        fullLegalName: 'Mohammed Al-Rashid',
        nationalId: '2222222222',
        nationalIdVerified: true
      },
      profile: {
        name: 'Mohammed Al-Rashid',
        status: 'approved',
        location: {
          city: 'Riyadh',
          area: 'Al Olaya',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // 8. Auditor
    const auditor1 = getOrCreateUser({
      email: 'auditor@pmtwin.com',
      password: btoa('Auditor123'),
      role: 'auditor',
      userType: 'auditor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966509012345',
      mobileVerified: true,
      identity: {
        fullLegalName: 'Compliance Auditor',
        nationalId: '3333333333',
        nationalIdVerified: true
      },
      profile: {
        name: 'Compliance Auditor',
        status: 'approved',
        location: {
          city: 'Riyadh',
          area: 'Al Malaz',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        createdAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Step 3: Create 7+ Opportunities (ALL KSA)
    // Note: Tracking arrays (createdOpps, updatedOpps, etc.) are defined above with helper functions
    
    // 1. REQUEST_SERVICE - Riyadh, Olaya, not remote - HVAC/MEP
    const opp1 = createOpportunityIfNotExists({
      id: 'opp_ksa_001',
      title: 'HVAC and MEP System Design for Commercial Building',
      description: 'Require comprehensive HVAC and MEP system design for new commercial building in Riyadh. Must comply with Saudi Building Code and energy efficiency standards.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['HVAC', 'MEP', 'Building Services', 'Energy Efficiency'],
      serviceItems: [
        { id: 'item_1', name: 'HVAC Design', description: 'Complete HVAC system design', unit: 'system', qty: 1, unitPriceRef: 150000, totalRef: 150000, currency: 'SAR' },
        { id: 'item_2', name: 'MEP Coordination', description: 'MEP coordination drawings', unit: 'drawing', qty: 50, unitPriceRef: 500, totalRef: 25000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Olaya',
        address: 'King Fahd Road, Commercial District',
        geo: { lat: 24.7136, lng: 46.6753 },
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString()
    });
    // Note: opp1 is already tracked in createOpportunityIfNotExists

    // 2. REQUEST_SERVICE - Jeddah, Al Hamra, remote allowed - BIM/Design review
    const opp2 = createOpportunityIfNotExists({
      id: 'opp_ksa_002',
      title: 'BIM Coordination and Design Review Services',
      description: 'Seeking BIM coordination services and design review for residential tower project. Remote work acceptable for coordination tasks.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['BIM', 'Design Review', '3D Modeling', 'Clash Detection'],
      serviceItems: [
        { id: 'item_3', name: 'BIM Model Creation', description: 'Create comprehensive BIM models', unit: 'model', qty: 1, unitPriceRef: 80000, totalRef: 80000, currency: 'SAR' },
        { id: 'item_4', name: 'Design Review', description: 'Review architectural and structural designs', unit: 'review', qty: 1, unitPriceRef: 50000, totalRef: 50000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Jeddah',
        area: 'Al Hamra',
        address: 'Al Hamra District, Residential Tower Site',
        geo: { lat: 21.5433, lng: 39.1728 },
        isRemoteAllowed: true
      },
      createdBy: projectLeadB.id,
      createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 3. OFFER_SERVICE - Riyadh, Al Nakheel - Concrete supply
    const opp3 = createOpportunityIfNotExists({
      id: 'opp_ksa_003',
      title: 'Ready-Mix Concrete Supply Services',
      description: 'Professional ready-mix concrete supply for construction projects. High-quality concrete meeting Saudi standards with timely delivery.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Concrete Supply', 'Material Supply', 'Construction Materials'],
      serviceItems: [
        { id: 'item_5', name: 'Ready-Mix Concrete', description: 'High-quality ready-mix concrete', unit: 'cubic_meter', qty: 1000, unitPriceRef: 350, totalRef: 350000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Al Nakheel',
        address: 'Al Nakheel Industrial Area',
        geo: { lat: 24.6408, lng: 46.7728 },
        isRemoteAllowed: false
      },
      createdBy: providerCorp1.id,
      createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 4. OFFER_SERVICE - Dammam, Al Faisaliyah, remote allowed - Quantity surveying
    const opp4 = createOpportunityIfNotExists({
      id: 'opp_ksa_004',
      title: 'Quantity Surveying and Cost Estimation Services',
      description: 'Expert quantity surveying services including BOQ preparation, cost estimation, and project cost management. Remote work available.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Quantity Surveying', 'Cost Estimation', 'BOQ Preparation', 'Cost Management'],
      serviceItems: [
        { id: 'item_6', name: 'BOQ Preparation', description: 'Bill of Quantities preparation', unit: 'project', qty: 1, unitPriceRef: 45000, totalRef: 45000, currency: 'SAR' },
        { id: 'item_7', name: 'Cost Estimation', description: 'Detailed cost estimation', unit: 'estimation', qty: 1, unitPriceRef: 35000, totalRef: 35000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Dammam',
        area: 'Al Faisaliyah',
        address: 'Al Faisaliyah Business District',
        geo: { lat: 26.4207, lng: 50.0888 },
        isRemoteAllowed: true
      },
      createdBy: providerCorp2.id,
      createdAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 5. OFFER_SERVICE - Khobar, Al Ulaya, remote allowed - Sustainability consulting
    const opp5 = createOpportunityIfNotExists({
      id: 'opp_ksa_005',
      title: 'Sustainability and Green Building Consulting',
      description: 'Expert sustainability consulting services including LEED certification support, energy audits, and green building design. Remote consultations available.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Sustainability', 'Green Building', 'LEED Certification', 'Energy Audits'],
      serviceItems: [
        { id: 'item_8', name: 'Sustainability Assessment', description: 'Comprehensive sustainability assessment', unit: 'assessment', qty: 1, unitPriceRef: 60000, totalRef: 60000, currency: 'SAR' },
        { id: 'item_9', name: 'LEED Certification Support', description: 'LEED certification guidance and documentation', unit: 'project', qty: 1, unitPriceRef: 80000, totalRef: 80000, currency: 'SAR' }
      ],
      preferredPaymentTerms: { mode: 'HYBRID', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 20000, acknowledgedDifference: false },
      paymentTerms: { mode: 'HYBRID', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 20000, acknowledgedDifference: false }, // Backward compatibility
      location: {
        country: 'Saudi Arabia',
        city: 'Khobar',
        area: 'Al Ulaya',
        address: 'Al Ulaya Business Center',
        geo: { lat: 26.2172, lng: 50.1971 },
        isRemoteAllowed: true
      },
      createdBy: professional1.id,
      createdAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 6. REQUEST_SERVICE - Makkah, Al Aziziyah, not remote - Logistics
    const opp6 = createOpportunityIfNotExists({
      id: 'opp_ksa_006',
      title: 'Construction Logistics and Material Handling Services',
      description: 'Require professional logistics services for construction project including material transportation, storage management, and site logistics coordination.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Logistics', 'Material Handling', 'Transportation', 'Site Management'],
      serviceItems: [
        { id: 'item_10', name: 'Material Transportation', description: 'Transportation of construction materials', unit: 'trip', qty: 200, unitPriceRef: 500, totalRef: 100000, currency: 'SAR' },
        { id: 'item_11', name: 'Storage Management', description: 'On-site storage and inventory management', unit: 'month', qty: 12, unitPriceRef: 15000, totalRef: 180000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Makkah',
        area: 'Al Aziziyah',
        address: 'Al Aziziyah Development Site',
        geo: { lat: 21.3891, lng: 39.8579 },
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 7. MEGA - NEOM/Tabuk region, not remote - SPV with work packages
    const opp7 = createOpportunityIfNotExists({
      id: 'opp_ksa_007',
      title: 'NEOM Infrastructure Mega-Project - SPV Structure',
      description: 'Comprehensive infrastructure development for NEOM including design, procurement, and execution phases. Structured as Special Purpose Vehicle (SPV) for risk isolation.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.4',
      modelName: 'Special Purpose Vehicle (SPV)',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Infrastructure Development', 'Civil Engineering', 'Project Finance', 'SPV Structuring', 'Mega-Project Management'],
      serviceItems: [
        { id: 'item_12', name: 'Design Phase', description: 'Complete design and engineering', unit: 'phase', qty: 1, unitPriceRef: 100000000, totalRef: 100000000, currency: 'SAR' },
        { id: 'item_13', name: 'Procurement Phase', description: 'Procurement and supply chain management', unit: 'phase', qty: 1, unitPriceRef: 150000000, totalRef: 150000000, currency: 'SAR' },
        { id: 'item_14', name: 'Execution Phase', description: 'Construction and execution', unit: 'phase', qty: 1, unitPriceRef: 250000000, totalRef: 250000000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Tabuk (NEOM)',
        area: 'Tabuk Region',
        address: 'NEOM Development Zone',
        geo: { lat: 28.0339, lng: 35.0000 },
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
      attributes: {
        projectValue: 500000000,
        spvValue: 500000000,
        duration: 36,
        workPackages: [
          { packageId: 'wp_design', title: 'Design Package', assignedPartyId: null, value: 100000000 },
          { packageId: 'wp_procurement', title: 'Procurement Package', assignedPartyId: null, value: 150000000 },
          { packageId: 'wp_execution', title: 'Execution Package', assignedPartyId: null, value: 250000000 }
        ],
        jvStructure: '50-50',
        spvStructure: 'SPV'
      }
    });
    if (opp7) createdOpps.push(opp7.id);

    // 8. OFFER_SERVICE - United Arab Emirates, Dubai, remote allowed (cross-border example)
    const opp8 = createOpportunityIfNotExists({
      id: 'opp_uae_001',
      title: 'International Project Management Consulting Services',
      description: 'Expert project management consulting services for international projects. Remote collaboration available for cross-border engagements.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Project Management', 'International Projects', 'Cross-Border Consulting', 'PMO Setup'],
      serviceItems: [
        { id: 'item_15', name: 'PMO Setup', description: 'Project Management Office setup and governance', unit: 'project', qty: 1, unitPriceRef: 120000, totalRef: 120000, currency: 'SAR' },
        { id: 'item_16', name: 'Project Management Consulting', description: 'Expert project management consulting', unit: 'month', qty: 6, unitPriceRef: 25000, totalRef: 150000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'United Arab Emirates',
        city: 'Dubai',
        area: null,
        address: 'Dubai Marina, Business Bay',
        geo: { lat: 25.2048, lng: 55.2708 },
        isRemoteAllowed: true
      },
      createdBy: providerCorp2.id,
      createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // 9. REQUEST_SERVICE - Egypt, Cairo, not remote (cross-border example)
    const opp9 = createOpportunityIfNotExists({
      id: 'opp_egypt_001',
      title: 'Architectural Design Services for Commercial Complex',
      description: 'Seeking architectural design services for a large commercial complex in Cairo. On-site presence required for site visits and coordination.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Architectural Design', 'Commercial Architecture', '3D Visualization', 'Building Design'],
      serviceItems: [
        { id: 'item_17', name: 'Conceptual Design', description: 'Initial conceptual design and master planning', unit: 'phase', qty: 1, unitPriceRef: 180000, totalRef: 180000, currency: 'SAR' },
        { id: 'item_18', name: 'Detailed Design', description: 'Detailed architectural drawings and specifications', unit: 'drawing_set', qty: 1, unitPriceRef: 220000, totalRef: 220000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: null,
        address: 'New Cairo, Commercial District',
        geo: { lat: 30.0444, lng: 31.2357 },
        isRemoteAllowed: false
      },
      createdBy: projectLeadB.id,
      createdAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Note: Tracking handled by createOpportunityIfNotExists helper

    // Step 4: Create Proposals with Versioning
    
    // Proposal 1: Provider Corp1 → Opp1 (HVAC/MEP) - with versioning V1→V2→V3
    if (opp1 && providerCorp1) {
      const prop1_v1 = createProposalIfNotExists({
        id: 'prop_ksa_001_v1',
        proposalType: 'SERVICE_OFFER',
        opportunityId: opp1.id,
        initiatorId: providerCorp1.id,
        receiverId: projectLeadA.id,
        providerId: providerCorp1.id,
        bidderCompanyId: providerCorp1.id,
        ownerCompanyId: projectLeadA.id, // opp1 is owned by projectLeadA
        targetType: 'OPPORTUNITY',
        targetId: opp1.id,
        status: 'SUBMITTED',
        total: 175000,
        currency: 'SAR',
        serviceDescription: 'Initial proposal for HVAC and MEP design services',
        paymentTerms: { mode: 'HYBRID', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 50000, acknowledgedDifference: false },
        comment: 'Proposing hybrid payment with cash component for flexibility in service delivery',
        timeline: { startDate: '2024-03-01', duration: 60, endDate: '2024-04-30' },
        submittedAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
        versions: [{
          version: 1,
          paymentTerms: { mode: 'HYBRID', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 50000, acknowledgedDifference: false },
          comment: 'Proposing hybrid payment with cash component for flexibility in service delivery',
          proposalData: { total: 175000, serviceDescription: 'Initial proposal' },
          createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: providerCorp1.id,
          status: 'SUBMITTED'
        }],
        currentVersion: 1,
        acceptance: {
          ownerAcceptedVersion: null,
          otherPartyAcceptedVersion: null,
          mutuallyAcceptedVersion: null,
          finalAcceptedAt: null
        }
      });
      if (prop1_v1) {
        // Create V2 (after owner requests changes)
        const prop1_v2_data = {
          ...prop1_v1,
          total: 165000,
          paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
          serviceDescription: 'Updated to cash-only payment as requested',
          versions: [
            ...prop1_v1.versions,
            {
              version: 2,
              paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
              comment: 'Updated to cash-only payment as requested by opportunity owner',
              proposalData: { total: 165000, serviceDescription: 'Updated to cash-only payment as requested' },
              createdAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              createdBy: providerCorp1.id,
              status: 'CHANGES_REQUESTED'
            }
          ],
          currentVersion: 2,
          status: 'CHANGES_REQUESTED',
          updatedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
        };
        PMTwinData.Proposals.update(prop1_v1.id, prop1_v2_data);
        
        // Create V3 (final accepted - both parties accepted V2)
        const prop1_v3_data = {
          ...prop1_v2_data,
          total: 160000,
          serviceDescription: 'Final accepted proposal with cash payment',
          versions: [
            ...prop1_v2_data.versions,
            {
              version: 3,
              paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
              comment: 'Final accepted proposal with cash payment terms',
              proposalData: { total: 160000, serviceDescription: 'Final accepted proposal with cash payment' },
              createdAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
              createdBy: providerCorp1.id,
              status: 'FINAL_ACCEPTED'
            }
          ],
          currentVersion: 3,
          status: 'FINAL_ACCEPTED',
          acceptance: {
            ownerAcceptedVersion: 3,
            otherPartyAcceptedVersion: 3,
            mutuallyAcceptedVersion: 3,
            finalAcceptedAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
            providerAccepted: true, // Backward compatibility
            ownerAccepted: true, // Backward compatibility
            acceptedAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString() // Backward compatibility
          },
          updatedAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString()
        };
        PMTwinData.Proposals.update(prop1_v1.id, prop1_v3_data);
        createdProps.push(prop1_v1.id);
        
        // Auto-generate contract from FINAL_ACCEPTED proposal
        if (typeof PMTwinData.Contracts !== 'undefined') {
          const contractData = {
            proposalId: prop1_v1.id,
            opportunityId: opp1.id,
            generatedFromProposalVersionId: `${prop1_v1.id}_v3`
          };
          const autoContract = PMTwinData.Contracts.create(contractData);
          if (autoContract) {
            createdContracts.push(autoContract.id);
            console.log(`✅ Auto-generated contract ${autoContract.id} from FINAL_ACCEPTED proposal ${prop1_v1.id}`);
          }
        }
      }
    }

    // Proposal 2: Consultant1 → Opp2 (BIM) - with versioning V1→V2→V3
    if (opp2 && consultant1) {
      const prop2_v1 = createProposalIfNotExists({
        id: 'prop_ksa_002_v1',
        proposalType: 'SERVICE_OFFER',
        opportunityId: opp2.id,
        providerId: consultant1.id,
        bidderCompanyId: consultant1.id,
        ownerCompanyId: projectLeadB.id,
        targetType: 'OPPORTUNITY',
        targetId: opp2.id,
        status: 'SUBMITTED',
        total: 130000,
        currency: 'SAR',
        serviceDescription: 'BIM coordination and design review proposal',
        timeline: { startDate: '2024-04-01', duration: 45, endDate: '2024-05-15' },
        submittedAt: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString(),
        versions: [{
          version: 1,
          proposalData: { total: 130000 },
          createdAt: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'SUBMITTED'
        }],
        currentVersion: 1
      });
      if (prop2_v1) {
        // Create V2
        PMTwinData.Proposals.update(prop2_v1.id, {
          ...prop2_v1,
          total: 125000,
          versions: [
            ...prop2_v1.versions,
            {
              version: 2,
              proposalData: { total: 125000 },
              createdAt: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
              status: 'UNDER_REVIEW'
            }
          ],
          currentVersion: 2,
          status: 'UNDER_REVIEW',
          updatedAt: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString()
        });
        createdProps.push(prop2_v1.id);
      }
    }

    // Step 5: Create Contracts
    
    // Contract 1: Auto-generated from FINAL_ACCEPTED proposal (already created above)
    // Additional manual contract for demonstration
    if (opp1 && providerCorp1 && projectLeadA) {
      const contract1 = createContractIfNotExists({
        id: 'contract_ksa_001',
        contractType: 'SERVICE_CONTRACT',
        scopeType: 'OPPORTUNITY',
        scopeId: opp1.id,
        opportunityId: opp1.id,
        buyerPartyId: projectLeadA.id,
        buyerPartyType: 'BENEFICIARY',
        providerPartyId: providerCorp1.id,
        providerPartyType: 'VENDOR_CORPORATE',
        status: 'SIGNED',
        startDate: '2024-03-01',
        endDate: '2024-04-30',
        signedAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        signedBy: projectLeadA.id,
        sourceProposalId: 'prop_ksa_001_v1',
        termsJSON: {
          pricing: { amount: 160000, currency: 'SAR' },
          paymentTerms: 'milestone_based',
          deliverables: ['HVAC Design', 'MEP Coordination Drawings'],
          milestones: [
            { name: 'Design Phase Complete', percentage: 50 },
            { name: 'Final Deliverables', percentage: 50 }
          ]
        },
        createdAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (contract1) createdContracts.push(contract1.id);
    }

    // Contract 2: Mega work package contract
    if (opp7 && providerCorp1 && projectLeadA) {
      const contract2 = createContractIfNotExists({
        id: 'contract_ksa_002',
        contractType: 'MEGA_PROJECT_CONTRACT',
        scopeType: 'OPPORTUNITY',
        scopeId: opp7.id,
        opportunityId: opp7.id,
        buyerPartyId: beneficiaryA.id,
        buyerPartyType: 'BENEFICIARY',
        providerPartyId: providerCorp1.id,
        providerPartyType: 'VENDOR_CORPORATE',
        status: 'DRAFT',
        startDate: '2024-06-01',
        endDate: '2027-05-31',
        workPackageId: 'wp_design',
        termsJSON: {
          pricing: { amount: 100000000, currency: 'SAR' },
          paymentTerms: 'milestone_based',
          deliverables: ['Design Package Complete'],
          milestones: [
            { name: 'Concept Design', percentage: 30 },
            { name: 'Detailed Design', percentage: 50 },
            { name: 'Design Finalization', percentage: 20 }
          ]
        },
        createdAt: new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (contract2) createdContracts.push(contract2.id);
    }

    // Step 6: Add More Diverse Opportunities
    // Add opportunities with different payment modes, locations, and statuses
    
    // BARTER opportunity
    const oppBarter = createOpportunityIfNotExists({
      id: 'opp_ksa_010',
      title: 'Architectural Design Services - Barter Exchange',
      description: 'Seeking architectural design services. Open to barter exchange - can offer construction materials or equipment in return.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'published',
      skills: ['Architectural Design', '3D Visualization', 'Building Design'],
      serviceItems: [
        { id: 'item_19', name: 'Conceptual Design', description: 'Initial design concepts', unit: 'phase', qty: 1, unitPriceRef: 100000, totalRef: 100000, currency: 'SAR' },
        { id: 'item_20', name: 'Detailed Drawings', description: 'Complete architectural drawings', unit: 'drawing_set', qty: 1, unitPriceRef: 150000, totalRef: 150000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'BARTER', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Jeddah',
        area: 'Al Hamra',
        address: 'Al Hamra District',
        geo: { lat: 21.5433, lng: 39.1728 },
        isRemoteAllowed: true
      },
      createdBy: projectLeadB.id,
      createdAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 16 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (oppBarter) createdOpps.push(oppBarter.id);

    // DRAFT opportunity
    const oppDraft = createOpportunityIfNotExists({
      id: 'opp_ksa_011',
      title: 'Site Surveying Services - Draft',
      description: 'Draft opportunity for site surveying services. Not yet published.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'draft',
      skills: ['Surveying', 'Land Surveying', 'Topographic Survey'],
      serviceItems: [
        { id: 'item_21', name: 'Site Survey', description: 'Complete site survey', unit: 'survey', qty: 1, unitPriceRef: 30000, totalRef: 30000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Al Nakheel',
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (oppDraft) createdOpps.push(oppDraft.id);

    // CLOSED opportunity
    const oppClosed = createOpportunityIfNotExists({
      id: 'opp_ksa_012',
      title: 'Completed Project - Interior Design',
      description: 'Interior design project that has been completed. Closed opportunity.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      status: 'closed',
      skills: ['Interior Design', 'Space Planning', '3D Rendering'],
      serviceItems: [
        { id: 'item_22', name: 'Interior Design', description: 'Complete interior design', unit: 'project', qty: 1, unitPriceRef: 200000, totalRef: 200000, currency: 'SAR' }
      ],
      paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Olaya',
        isRemoteAllowed: false
      },
      createdBy: projectLeadA.id,
      createdAt: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      closedAt: new Date(baseDate.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
    });
    if (oppClosed) createdOpps.push(oppClosed.id);

    // Step 7: Add More Proposals with Various Statuses
    if (oppBarter && providerCorp1) {
      const propBarter = createProposalIfNotExists({
        id: 'prop_ksa_003',
        proposalType: 'SERVICE_OFFER',
        opportunityId: oppBarter.id,
        initiatorId: providerCorp1.id,
        receiverId: projectLeadB.id,
        providerId: providerCorp1.id,
        bidderCompanyId: providerCorp1.id,
        ownerCompanyId: projectLeadB.id,
        targetType: 'OPPORTUNITY',
        targetId: oppBarter.id,
        status: 'SUBMITTED',
        total: 250000,
        currency: 'SAR',
        serviceDescription: 'Barter proposal: Architectural design services in exchange for construction materials',
        paymentTerms: { mode: 'BARTER', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 50000, acknowledgedDifference: true },
        comment: 'Proposing barter exchange with small cash difference',
        timeline: { startDate: '2024-05-01', duration: 90, endDate: '2024-07-30' },
        submittedAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
        versions: [{
          version: 1,
          paymentTerms: { mode: 'BARTER', barterRule: 'ALLOW_DIFFERENCE_CASH', cashSettlement: 50000, acknowledgedDifference: true },
          comment: 'Proposing barter exchange with small cash difference',
          proposalData: { total: 250000, serviceDescription: 'Barter proposal' },
          createdAt: new Date(baseDate.getTime() + 17 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: providerCorp1.id,
          status: 'SUBMITTED'
        }],
        currentVersion: 1
      });
      // Note: Tracking handled by createProposalIfNotExists helper
    }

    if (opp2 && providerCorp2) {
      const propRejected = createProposalIfNotExists({
        id: 'prop_ksa_004',
        proposalType: 'SERVICE_OFFER',
        opportunityId: opp2.id,
        initiatorId: providerCorp2.id,
        receiverId: projectLeadB.id,
        providerId: providerCorp2.id,
        bidderCompanyId: providerCorp2.id,
        ownerCompanyId: projectLeadB.id,
        targetType: 'OPPORTUNITY',
        targetId: opp2.id,
        status: 'REJECTED',
        total: 150000,
        currency: 'SAR',
        serviceDescription: 'Proposal that was rejected',
        paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
        comment: 'This proposal was rejected',
        timeline: { startDate: '2024-04-01', duration: 45, endDate: '2024-05-15' },
        submittedAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        rejectedAt: new Date(baseDate.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        rejectedBy: projectLeadB.id,
        rejectionReason: 'Proposal does not meet requirements',
        versions: [{
          version: 1,
          paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
          comment: 'This proposal was rejected',
          proposalData: { total: 150000 },
          createdAt: new Date(baseDate.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: providerCorp2.id,
          status: 'REJECTED'
        }],
        currentVersion: 1
      });
      if (propRejected) createdProps.push(propRejected.id);
    }

    if (opp3 && consultant1) {
      const propUnderReview = createProposalIfNotExists({
        id: 'prop_ksa_005',
        proposalType: 'SERVICE_OFFER',
        opportunityId: opp3.id,
        initiatorId: consultant1.id,
        receiverId: providerCorp1.id,
        providerId: consultant1.id,
        bidderCompanyId: consultant1.id,
        ownerCompanyId: providerCorp1.id,
        targetType: 'OPPORTUNITY',
        targetId: opp3.id,
        status: 'UNDER_REVIEW',
        total: 340000,
        currency: 'SAR',
        serviceDescription: 'Proposal currently under review',
        paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
        comment: 'Awaiting review',
        timeline: { startDate: '2024-06-01', duration: 60, endDate: '2024-07-30' },
        submittedAt: new Date(baseDate.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString(),
        versions: [{
          version: 1,
          paymentTerms: { mode: 'CASH', barterRule: null, cashSettlement: 0, acknowledgedDifference: false },
          comment: 'Awaiting review',
          proposalData: { total: 340000 },
          createdAt: new Date(baseDate.getTime() + 19 * 24 * 60 * 60 * 1000).toISOString(),
          createdBy: consultant1.id,
          status: 'UNDER_REVIEW'
        }],
        currentVersion: 1
      });
      // Note: Tracking handled by createProposalIfNotExists helper
    }

    console.log(`✅ Seed v2 Complete:`);
    console.log(`   - Users: All 8 roles created (project_lead, supplier, service_provider, consultant, professional, mentor, platform_admin, auditor)`);
    console.log(`   - Opportunities: ${createdOpps.length} created, ${updatedOpps.length} updated (REQUEST_SERVICE, OFFER_SERVICE, MEGA, BARTER, DRAFT, CLOSED)`);
    console.log(`   - Proposals: ${createdProps.length} created, ${updatedProps.length} updated (with versioning V1→V2→V3, FINAL_ACCEPTED, REJECTED, UNDER_REVIEW, SUBMITTED)`);
    console.log(`   - Contracts: ${createdContracts.length} (auto-generated from FINAL_ACCEPTED proposals)`);
    console.log(`   - Locations: Config-driven (Saudi Arabia, UAE, Egypt)`);
    console.log(`   - RBAC: Sidebar items configured per role`);

    return {
      users: {
        project_lead: [projectLeadA.id, projectLeadB.id],
        supplier: [supplier1.id],
        service_provider: [providerCorp1.id, providerCorp2.id],
        consultant: [consultant1.id],
        professional: [professional1.id],
        mentor: [mentor1.id],
        platform_admin: [platformAdmin.id],
        auditor: [auditor1.id]
      },
      opportunities: { created: createdOpps.length, updated: updatedOpps.length, createdIds: createdOpps, updatedIds: updatedOpps },
      proposals: { created: createdProps.length, updated: updatedProps.length, createdIds: createdProps, updatedIds: updatedProps },
      contracts: { created: createdContracts.length, ids: createdContracts }
    };
  }

  // DEPRECATED: Use createGoldenOpportunities instead
  function createGoldenProjects_DEPRECATED(forceReload = false) {
    console.warn('⚠️ createGoldenProjects() is deprecated. Use createGoldenOpportunities() instead.');
    return { created: 0, skipped: 0 };
  }
  
  // Legacy wrapper
  function createGoldenProjects(forceReload = false) {
    return createGoldenProjects_DEPRECATED(forceReload);
  }
  
  // Original function disabled:
  function createGoldenProjects_ORIGINAL_DISABLED(forceReload = false) {
    const projects = PMTwinData.Projects.getAll();
    const users = PMTwinData.Users.getAll();
    
    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const beneficiaryB = users.find(u => u.email === 'entity2@pmtwin.com');

    if (!beneficiaryA || !beneficiaryB) {
      console.warn('Beneficiaries not found, skipping project creation');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    // Helper to create project if not exists
    function createProjectIfNotExists(projectData) {
      const exists = projects.some(p => p.id === projectData.id);
      if (exists && !forceReload) {
        skipped.push(projectData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = projects.filter(p => p.id !== projectData.id);
        localStorage.setItem('pmtwin_projects', JSON.stringify(filtered));
      }

      const project = PMTwinData.Projects.create(projectData);
      if (project) {
        created.push(project.id);
      }
      return project;
    }

    const now = new Date();
    const startDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // 1. MegaProject: "Mega Project - NEOM Package"
    const megaProject = createProjectIfNotExists({
      id: 'megaproject_neom_001',
      creatorId: beneficiaryA.id,
      ownerCompanyId: beneficiaryA.id, // Users represent companies
      title: 'Mega Project - NEOM Package',
      description: 'Comprehensive development package for NEOM including civil works and MEP infrastructure. This mega-project encompasses multiple sub-projects covering foundation, earthworks, structures, and complete MEP systems.',
      category: 'Infrastructure',
      projectType: 'mega',
      status: 'active',
      visibility: 'public',
      location: {
        city: 'NEOM',
        region: 'Tabuk Province',
        country: 'Saudi Arabia',
        coordinates: {
          lat: 28.5,
          lng: 35.0
        }
      },
      scope: {
        coreDescription: 'Mega-project package covering civil and MEP works for NEOM development',
        requiredServices: ['General Contracting', 'Civil Engineering', 'MEP Engineering', 'Project Management'],
        skillRequirements: ['MegaProject Management', 'Civil Engineering', 'MEP Engineering', 'Quality Control'],
        experienceLevel: 'senior',
        minimumExperience: 10
      },
      budget: {
        min: 450000000,
        max: 550000000,
        currency: 'SAR'
      },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 36,
        milestones: [
          { name: 'Design Phase Complete', date: '2024-09-30' },
          { name: 'Foundation Complete', date: '2025-06-30' },
          { name: 'Structure Complete', date: '2026-03-31' },
          { name: 'MEP Installation Complete', date: '2026-12-31' },
          { name: 'Final Handover', date: '2027-03-31' }
        ]
      },
      subProjects: [
        {
          id: 'subproject_civil_001',
          index: 0,
          title: 'Civil Works',
          description: 'Foundation, earthworks, and structural works including excavation, piling, and concrete structures',
          category: 'Civil Engineering',
          location: {
            city: 'NEOM',
            region: 'Tabuk Province',
            country: 'Saudi Arabia'
          },
          scope: {
            requiredServices: ['Civil Engineering', 'Foundation Works', 'Earthworks'],
            skillRequirements: ['Foundation Engineering', 'Structural Engineering', 'Earthworks Management']
          },
          budget: {
            min: 250000000,
            max: 300000000,
            currency: 'SAR'
          },
          timeline: {
            start_date: startDate.toISOString().split('T')[0],
            duration: 24,
            milestones: [
              { name: 'Excavation Complete', date: '2024-12-31' },
              { name: 'Foundation Complete', date: '2025-06-30' },
              { name: 'Structure Complete', date: '2026-03-31' }
            ]
          },
          status: 'active'
        },
        {
          id: 'subproject_mep_001',
          index: 1,
          title: 'MEP Works',
          description: 'Complete mechanical, electrical, and plumbing systems including HVAC, electrical distribution, and plumbing infrastructure',
          category: 'MEP Engineering',
          location: {
            city: 'NEOM',
            region: 'Tabuk Province',
            country: 'Saudi Arabia'
          },
          scope: {
            requiredServices: ['MEP Engineering', 'HVAC Installation', 'Electrical Systems', 'Plumbing'],
            skillRequirements: ['MEP Engineering', 'HVAC Design', 'Electrical Engineering', 'Plumbing Systems']
          },
          budget: {
            min: 200000000,
            max: 250000000,
            currency: 'SAR'
          },
          timeline: {
            start_date: new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 18,
            milestones: [
              { name: 'MEP Design Complete', date: '2025-09-30' },
              { name: 'MEP Installation 50%', date: '2026-06-30' },
              { name: 'MEP Installation Complete', date: '2026-12-31' }
            ]
          },
          status: 'active'
        }
      ],
      createdAt: new Date().toISOString()
    });

    // 2. Standalone Project: "Residential Tower - King Fahd District"
    const standaloneProject = createProjectIfNotExists({
      id: 'project_residential_001',
      creatorId: beneficiaryB.id,
      ownerCompanyId: beneficiaryB.id, // Users represent companies
      title: 'Residential Tower - King Fahd District',
      description: 'Modern residential tower development in King Fahd District, Riyadh. 30-story tower with luxury apartments, amenities, and parking facilities.',
      category: 'Residential',
      projectType: 'single',
      status: 'active',
      visibility: 'public',
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia',
        coordinates: {
          lat: 24.7136,
          lng: 46.6753
        }
      },
      scope: {
        coreDescription: 'Complete design and construction of 30-story residential tower',
        requiredServices: ['General Contracting', 'Architectural Design', 'Structural Engineering', 'MEP Engineering'],
        skillRequirements: ['High-Rise Construction', 'Residential Development', 'Project Management'],
        experienceLevel: 'senior',
        minimumExperience: 8
      },
      budget: {
        min: 140000000,
        max: 160000000,
        currency: 'SAR'
      },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 30,
        milestones: [
          { name: 'Design Phase Complete', date: '2024-08-31' },
          { name: 'Foundation Complete', date: '2025-03-31' },
          { name: 'Structure 50%', date: '2025-12-31' },
          { name: 'Structure Complete', date: '2026-06-30' },
          { name: 'MEP & Finishing Complete', date: '2026-12-31' },
          { name: 'Final Handover', date: '2027-02-28' }
        ]
      },
      createdAt: new Date().toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      projects: {
        megaProject,
        standaloneProject
      }
    };
  }

  // ============================================
  // C) Service Requests
  // ============================================
  function createGoldenServiceRequests(forceReload = false) {
    const requests = PMTwinData.ServiceRequests.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();

    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const vendorAlpha = users.find(u => u.email === 'vendor.alpha@pmtwin.com');
    const megaProject = projects.find(p => p.id === 'megaproject_neom_001');

    if (!beneficiaryA || !vendorAlpha || !megaProject) {
      console.warn('Required entities not found, skipping service requests');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createRequestIfNotExists(requestData) {
      const exists = requests.some(r => r.id === requestData.id);
      if (exists && !forceReload) {
        skipped.push(requestData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = requests.filter(r => r.id !== requestData.id);
        localStorage.setItem('pmtwin_service_requests', JSON.stringify(filtered));
      }

      const request = PMTwinData.ServiceRequests.create(requestData);
      if (request) {
        created.push(request.id);
      }
      return request;
    }

    const now = new Date();

    // SR1: BIM Coordination (by Beneficiary A)
    const sr1 = createRequestIfNotExists({
      id: 'sr_bim_001',
      requesterType: 'ENTITY',
      requesterId: beneficiaryA.id,
      ownerCompanyId: beneficiaryA.id, // Users represent companies
      title: 'BIM Coordination Services for NEOM Package - Civil Works',
      description: 'Require comprehensive BIM coordination services for the Civil Works sub-project including clash detection, IFC model coordination, and 4D scheduling integration.',
      requiredSkills: ['BIM Modeling', 'Clash Detection', 'IFC Coordination', '4D Scheduling'],
      status: 'APPROVED',
      budget: {
        min: 150000,
        max: 250000,
        currency: 'SAR'
      },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 6,
        requiredBy: new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_civil_001',
        projectId: megaProject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // SR2: QA/QC Site Inspections (by Beneficiary A)
    const sr2 = createRequestIfNotExists({
      id: 'sr_qa_001',
      requesterType: 'ENTITY',
      requesterId: beneficiaryA.id,
      ownerCompanyId: beneficiaryA.id, // Users represent companies
      title: 'QA/QC Site Inspection Services for MEP Works',
      description: 'Comprehensive quality assurance and quality control services including weekly site inspections, NCR management, and compliance verification for MEP installation.',
      requiredSkills: ['Site Inspection', 'Quality Control', 'NCR Management', 'Testing & Commissioning'],
      requestType: 'NORMAL',
      status: 'APPROVED',
      budget: {
        min: 80000,
        max: 120000,
        currency: 'SAR'
      },
      timeline: {
        startDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 12,
        requiredBy: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_mep_001',
        projectId: megaProject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // SR3: Planning Support (by Vendor Alpha)
    const sr3 = createRequestIfNotExists({
      id: 'sr_scheduler_001',
      requesterType: 'VENDOR',
      requesterId: vendorAlpha.id,
      ownerCompanyId: vendorAlpha.id, // Users represent companies
      title: 'Project Planning and Scheduling Support for NEOM Package',
      description: 'Expert project planning and scheduling services including critical path analysis, resource planning, and schedule optimization for the mega-project.',
      requiredSkills: ['Project Scheduling', 'Resource Planning', 'Critical Path Analysis', 'Primavera P6'],
      requestType: 'NORMAL',
      status: 'APPROVED',
      budget: {
        min: 100000,
        max: 150000,
        currency: 'SAR'
      },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 8,
        requiredBy: new Date(now.getTime() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'MEGA_PROJECT',
        scopeId: megaProject.id,
        projectId: megaProject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      requests: { sr1, sr2, sr3 }
    };
  }

  // ============================================
  // D) Proposals (Role-aware)
  // ============================================
  function createGoldenProposals(forceReload = false) {
    const proposals = PMTwinData.Proposals.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();
    const serviceRequests = PMTwinData.ServiceRequests.getAll();

    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const beneficiaryB = users.find(u => u.email === 'entity2@pmtwin.com');
    const vendorAlpha = users.find(u => u.email === 'vendor.alpha@pmtwin.com');
    const vendorBeta = users.find(u => u.email === 'vendor.beta@pmtwin.com');
    const bimProvider = users.find(u => u.email === 'bim@pmtwin.com');
    const qaProvider = users.find(u => u.email === 'qa@pmtwin.com');
    const consultant = users.find(u => u.email === 'consultant@pmtwin.com');

    const megaProject = projects.find(p => p.id === 'megaproject_neom_001');
    const standaloneProject = projects.find(p => p.id === 'project_residential_001');
    const sr1 = serviceRequests.find(r => r.id === 'sr_bim_001');
    const sr2 = serviceRequests.find(r => r.id === 'sr_qa_001');

    if (!beneficiaryA || !beneficiaryB || !vendorAlpha || !vendorBeta || !megaProject || !standaloneProject) {
      console.warn('Required entities not found, skipping proposals');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createProposalIfNotExists(proposalData) {
      const exists = proposals.some(p => p.id === proposalData.id);
      if (exists && !forceReload) {
        skipped.push(proposalData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = proposals.filter(p => p.id !== proposalData.id);
        localStorage.setItem('pmtwin_proposals', JSON.stringify(filtered));
      }

      const proposal = PMTwinData.Proposals.create(proposalData);
      if (proposal) {
        created.push(proposal.id);
      }
      return proposal;
    }

    const now = new Date();
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Proposal 1: Vendor Alpha → MegaProject (PROJECT_BID)
    const proposal1 = createProposalIfNotExists({
      id: 'proposal_vendor_alpha_mega',
      proposalType: 'PROJECT_BID',
      targetType: 'MEGA_PROJECT',
      targetId: megaProject.id,
      projectId: megaProject.id, // Backward compatibility
      bidderCompanyId: vendorAlpha.id,
      ownerCompanyId: beneficiaryA.id,
      providerId: vendorAlpha.id, // Backward compatibility
      status: 'SHORTLISTED',
      total: 480000000,
      currency: 'SAR',
      timeline: {
        startDate: megaProject.timeline.start_date,
        duration: 36,
        endDate: new Date(new Date(megaProject.timeline.start_date).getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      submittedAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Proposal 2: Vendor Beta → Standalone Project (PROJECT_BID)
    const proposal2 = createProposalIfNotExists({
      id: 'proposal_vendor_beta_project',
      proposalType: 'PROJECT_BID',
      targetType: 'PROJECT',
      targetId: standaloneProject.id,
      projectId: standaloneProject.id, // Backward compatibility
      bidderCompanyId: vendorBeta.id,
      ownerCompanyId: beneficiaryB.id,
      providerId: vendorBeta.id, // Backward compatibility
      status: 'UNDER_REVIEW',
      total: 150000000,
      currency: 'SAR',
      timeline: {
        startDate: standaloneProject.timeline.start_date,
        duration: 30,
        endDate: new Date(new Date(standaloneProject.timeline.start_date).getTime() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      submittedAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Proposal 3: Service Provider (BIM) → ServiceRequest (SERVICE_OFFER)
    if (bimProvider && sr1) {
      const proposal3 = createProposalIfNotExists({
        id: 'proposal_bim_sr1',
        proposalType: 'SERVICE_OFFER',
        targetType: 'SERVICE_REQUEST',
        targetId: sr1.id,
        bidderCompanyId: bimProvider.id,
        ownerCompanyId: beneficiaryA.id,
        providerId: bimProvider.id, // Backward compatibility
        status: 'AWARDED',
        total: 200000,
        currency: 'SAR',
        timeline: {
          startDate: sr1.timeline.startDate,
          duration: 6,
          endDate: sr1.timeline.requiredBy
        },
        submittedAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        awardedAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Proposal 4: Service Provider (QA) → ServiceRequest (SERVICE_OFFER)
    if (qaProvider && sr2) {
      const proposal4 = createProposalIfNotExists({
        id: 'proposal_qa_sr2',
        proposalType: 'SERVICE_OFFER',
        targetType: 'SERVICE_REQUEST',
        targetId: sr2.id,
        bidderCompanyId: qaProvider.id,
        ownerCompanyId: beneficiaryA.id,
        providerId: qaProvider.id, // Backward compatibility
        status: 'SUBMITTED',
        total: 100000,
        currency: 'SAR',
        timeline: {
          startDate: sr2.timeline.startDate,
          duration: 12,
          endDate: sr2.timeline.requiredBy
        },
        submittedAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    // Proposal 5: Consultant → Advisory ServiceRequest (ADVISORY_OFFER)
    const advisorySR = serviceRequests.find(r => r.id === 'sr_advisory_001' || r.requestType === 'ADVISORY');
    if (consultant && advisorySR) {
      const proposal5 = createProposalIfNotExists({
        id: 'proposal_consultant_advisory',
        proposalType: 'ADVISORY_OFFER',
        targetType: 'SERVICE_REQUEST',
        targetId: advisorySR.id,
        bidderCompanyId: consultant.id,
        ownerCompanyId: advisorySR.ownerCompanyId || advisorySR.requesterId,
        providerId: consultant.id, // Backward compatibility
        status: 'NEGOTIATION',
        total: 180000,
        currency: 'SAR',
        timeline: {
          startDate: advisorySR.timeline?.startDate || new Date().toISOString().split('T')[0],
          duration: 4,
          endDate: advisorySR.timeline?.requiredBy || new Date(new Date().getTime() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        submittedAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
      });
    }

    return {
      created: created.length,
      skipped: skipped.length
    };
  }

  // ============================================
  // E) Service Offers
  // ============================================
  // DEPRECATED: Use createGoldenOpportunities instead
  function createGoldenServiceOffers_DEPRECATED(forceReload = false) {
    console.warn('⚠️ createGoldenServiceOffers() is deprecated. Use createGoldenOpportunities() instead.');
    return { created: 0, skipped: 0 };
  }
  
  // Legacy wrapper
  function createGoldenServiceOffers(forceReload = false) {
    return createGoldenServiceOffers_DEPRECATED(forceReload);
  }
  
  // Original function disabled:
  function createGoldenServiceOffers_ORIGINAL_DISABLED(forceReload = false) {
    const offers = PMTwinData.ServiceOffers.getAll();
    const users = PMTwinData.Users.getAll();
    const requests = PMTwinData.ServiceRequests.getAll();

    const bimProvider = users.find(u => u.email === 'bim@pmtwin.com');
    const qaProvider = users.find(u => u.email === 'qa@pmtwin.com');
    const schedulerProvider = users.find(u => u.email === 'scheduler@pmtwin.com');
    const sr1 = requests.find(r => r.id === 'sr_bim_001');
    const sr2 = requests.find(r => r.id === 'sr_qa_001');
    const sr3 = requests.find(r => r.id === 'sr_scheduler_001');

    if (!bimProvider || !qaProvider || !schedulerProvider || !sr1 || !sr2 || !sr3) {
      console.warn('Required entities not found, skipping service offers');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createOfferIfNotExists(offerData) {
      const exists = offers.some(o => o.id === offerData.id);
      if (exists && !forceReload) {
        skipped.push(offerData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = offers.filter(o => o.id !== offerData.id);
        localStorage.setItem('pmtwin_service_offers', JSON.stringify(filtered));
      }

      const offer = PMTwinData.ServiceOffers.create(offerData);
      if (offer) {
        created.push(offer.id);
      }
      return offer;
    }

    const now = new Date();

    // Offer 1: BIM Provider for SR1
    const offer1 = createOfferIfNotExists({
      id: 'so_bim_001',
      serviceRequestId: sr1.id,
      serviceProviderUserId: bimProvider.id,
      status: 'ACCEPTED',
      proposedPricing: {
        amount: 200000,
        currency: 'SAR',
        paymentTerms: 'milestone_based'
      },
      proposedTimeline: {
        startDate: sr1.timeline.startDate,
        duration: 6,
        deliveryDate: sr1.timeline.requiredBy
      },
      message: 'We have extensive experience in BIM coordination for mega-projects. Our team will provide comprehensive clash detection and IFC model coordination services.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Offer 2: QA Provider for SR2
    const offer2 = createOfferIfNotExists({
      id: 'so_qa_001',
      serviceRequestId: sr2.id,
      serviceProviderUserId: qaProvider.id,
      status: 'ACCEPTED',
      proposedPricing: {
        amount: 100000,
        currency: 'SAR',
        paymentTerms: 'monthly'
      },
      proposedTimeline: {
        startDate: sr2.timeline.startDate,
        duration: 12,
        deliveryDate: sr2.timeline.requiredBy
      },
      message: 'Our QA/QC team specializes in MEP inspection services. We will provide weekly inspection reports and comprehensive NCR management.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Offer 3: Scheduler Provider for SR3
    const offer3 = createOfferIfNotExists({
      id: 'so_scheduler_001',
      serviceRequestId: sr3.id,
      serviceProviderUserId: schedulerProvider.id,
      status: 'ACCEPTED',
      proposedPricing: {
        amount: 125000,
        currency: 'SAR',
        paymentTerms: 'milestone_based'
      },
      proposedTimeline: {
        startDate: sr3.timeline.startDate,
        duration: 8,
        deliveryDate: sr3.timeline.requiredBy
      },
      message: 'We provide expert project planning and scheduling services using Primavera P6. Our team will develop comprehensive schedules and perform critical path analysis.',
      submittedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      offers: { offer1, offer2, offer3 }
    };
  }

  // ============================================
  // E) Contracts
  // ============================================
  function createGoldenContracts(forceReload = false) {
    const contracts = PMTwinData.Contracts.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();
    const serviceOffers = PMTwinData.ServiceOffers.getAll();

    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const beneficiaryB = users.find(u => u.email === 'entity2@pmtwin.com');
    const vendorAlpha = users.find(u => u.email === 'vendor.alpha@pmtwin.com');
    const vendorBeta = users.find(u => u.email === 'vendor.beta@pmtwin.com');
    const bimProvider = users.find(u => u.email === 'bim@pmtwin.com');
    const qaProvider = users.find(u => u.email === 'qa@pmtwin.com');
    const consultant = users.find(u => u.email === 'consultant@pmtwin.com');
    const mepSub = users.find(u => u.email === 'mep.sub@pmtwin.com');
    const steelSub = users.find(u => u.email === 'steel.sub@pmtwin.com');
    const megaProject = projects.find(p => p.id === 'megaproject_neom_001');
    const standaloneProject = projects.find(p => p.id === 'project_residential_001');
    let offer1 = serviceOffers.find(o => o.id === 'so_bim_001');
    let offer2 = serviceOffers.find(o => o.id === 'so_qa_001');

    if (!beneficiaryA || !beneficiaryB || !vendorAlpha || !vendorBeta || !bimProvider || !qaProvider || !consultant || !mepSub || !steelSub || !megaProject || !standaloneProject) {
      console.warn('Required entities not found, skipping contracts');
      return { created: 0, skipped: 0 };
    }
    
    if (!offer1 || !offer2) {
      console.warn('Required service offers not found, skipping service contracts');
      // Set to null to prevent access errors
      if (!offer1) offer1 = null;
      if (!offer2) offer2 = null;
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createContractIfNotExists(contractData) {
      const exists = contracts.some(c => c.id === contractData.id);
      if (exists && !forceReload) {
        skipped.push(contractData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = contracts.filter(c => c.id !== contractData.id);
        localStorage.setItem('pmtwin_contracts', JSON.stringify(filtered));
      }

      const contract = PMTwinData.Contracts.create(contractData);
      if (contract) {
        created.push(contract.id);
      }
      return contract;
    }

    const now = new Date();
    const signedDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    // 1. MEGA_PROJECT_CONTRACT: Beneficiary A ↔ Vendor Alpha
    const megaContract = createContractIfNotExists({
      id: 'contract_mega_001',
      contractType: 'MEGA_PROJECT_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: megaProject.id,
      buyerPartyId: beneficiaryA.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: vendorAlpha.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: beneficiaryA.id,
      termsJSON: {
        pricing: { amount: 500000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete Civil Works', 'Complete MEP Works', 'Project Management'],
        milestones: [
          { name: 'Design Phase Complete', percentage: 20 },
          { name: 'Foundation Complete', percentage: 25 },
          { name: 'Structure Complete', percentage: 30 },
          { name: 'MEP Installation Complete', percentage: 20 },
          { name: 'Final Handover', percentage: 5 }
        ]
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: beneficiaryA.id
    });

    // 2. SERVICE_CONTRACT 1: MegaProject/SubProject A ↔ BIM ServiceProvider
    const serviceContract1 = (hasOffer1 && offer1 && offer1.serviceRequestId) ? createContractIfNotExists({
      id: 'contract_service_bim_001',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: offer1.serviceRequestId,
      buyerPartyId: beneficiaryA.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: bimProvider.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: beneficiaryA.id,
      sourceServiceOfferId: offer1.id,
      termsJSON: {
        pricing: { amount: 200000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Clash Report v1', 'IFC Coordination Model', 'Final BIM Deliverable'],
        milestones: [
          { name: 'Clash Report v1', percentage: 30 },
          { name: 'IFC Coordination Model', percentage: 40 },
          { name: 'Final BIM Deliverable', percentage: 30 }
        ]
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: beneficiaryA.id
    }) : null;

    // 3. SERVICE_CONTRACT 2: SubProject B ↔ QA ServiceProvider
    const serviceContract2 = (hasOffer2 && offer2 && offer2.serviceRequestId) ? createContractIfNotExists({
      id: 'contract_service_qa_001',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: offer2.serviceRequestId,
      buyerPartyId: beneficiaryA.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: qaProvider.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: beneficiaryA.id,
      sourceServiceOfferId: offer2.id,
      termsJSON: {
        pricing: { amount: 100000, currency: 'SAR' },
        paymentTerms: 'monthly',
        deliverables: ['Weekly Inspection Reports', 'NCR Closure Summary', 'Final QA Report'],
        milestones: [
          { name: 'Monthly Reports (12 months)', percentage: 80 },
          { name: 'NCR Closure Summary', percentage: 10 },
          { name: 'Final QA Report', percentage: 10 }
        ]
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: beneficiaryA.id
    }) : null;

    // 4. ADVISORY_CONTRACT: MegaProject ↔ Sustainability Consultant
    const advisoryContract = createContractIfNotExists({
      id: 'contract_advisory_001',
      contractType: 'ADVISORY_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: megaProject.id,
      buyerPartyId: beneficiaryA.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: consultant.id,
      providerPartyType: 'CONSULTANT',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: beneficiaryA.id,
      termsJSON: {
        pricing: { amount: 300000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Sustainability Assessment Report', 'Compliance Checklist', 'LEED Certification Support'],
        milestones: [
          { name: 'Sustainability Assessment Report', percentage: 40 },
          { name: 'Compliance Checklist', percentage: 30 },
          { name: 'LEED Certification Support', percentage: 30 }
        ]
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: beneficiaryA.id
    });

    // 5. PROJECT_CONTRACT: Beneficiary B ↔ Vendor Beta
    const projectContract = createContractIfNotExists({
      id: 'contract_project_001',
      contractType: 'PROJECT_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: standaloneProject.id,
      buyerPartyId: beneficiaryB.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: vendorBeta.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: beneficiaryB.id,
      termsJSON: {
        pricing: { amount: 150000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete Residential Tower', 'All Amenities', 'Parking Facilities'],
        milestones: [
          { name: 'Design Phase Complete', percentage: 15 },
          { name: 'Foundation Complete', percentage: 20 },
          { name: 'Structure 50%', percentage: 25 },
          { name: 'Structure Complete', percentage: 20 },
          { name: 'MEP & Finishing Complete', percentage: 15 },
          { name: 'Final Handover', percentage: 5 }
        ]
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: beneficiaryB.id
    });

    // 6. SUB_CONTRACT 1: Vendor Alpha ↔ MEP SubContractor
    const subContract1 = createContractIfNotExists({
      id: 'contract_sub_mep_001',
      contractType: 'SUB_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: megaProject.id,
      buyerPartyId: vendorAlpha.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: mepSub.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: megaContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: vendorAlpha.id,
      termsJSON: {
        pricing: { amount: 50000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete MEP Installation', 'Testing & Commissioning'],
        milestones: [
          { name: 'MEP Design Complete', percentage: 20 },
          { name: 'MEP Installation 50%', percentage: 40 },
          { name: 'MEP Installation Complete', percentage: 30 },
          { name: 'Testing & Commissioning', percentage: 10 }
        ]
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: vendorAlpha.id
    });

    // 7. SUB_CONTRACT 2: Vendor Alpha ↔ Steel SubContractor
    const subContract2 = createContractIfNotExists({
      id: 'contract_sub_steel_001',
      contractType: 'SUB_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: megaProject.id,
      buyerPartyId: vendorAlpha.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: steelSub.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: megaContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: vendorAlpha.id,
      termsJSON: {
        pricing: { amount: 30000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Steel Fabrication', 'Steel Erection', 'Quality Certification'],
        milestones: [
          { name: 'Steel Fabrication 50%', percentage: 30 },
          { name: 'Steel Fabrication Complete', percentage: 30 },
          { name: 'Steel Erection Complete', percentage: 35 },
          { name: 'Quality Certification', percentage: 5 }
        ]
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: vendorAlpha.id
    });

    return {
      created: created.length,
      skipped: skipped.length,
      contracts: {
        megaContract,
        serviceContract1,
        serviceContract2,
        advisoryContract,
        projectContract,
        subContract1,
        subContract2
      }
    };
  }

  // ============================================
  // F) Engagements
  // ============================================
  function createGoldenEngagements(forceReload = false) {
    const engagements = PMTwinData.Engagements.getAll();
    const contracts = PMTwinData.Contracts.getAll();
    const projects = PMTwinData.Projects.getAll();

    const megaContract = contracts.find(c => c.id === 'contract_mega_001');
    const serviceContract1 = contracts.find(c => c.id === 'contract_service_bim_001');
    const serviceContract2 = contracts.find(c => c.id === 'contract_service_qa_001');
    const advisoryContract = contracts.find(c => c.id === 'contract_advisory_001');
    const subContract1 = contracts.find(c => c.id === 'contract_sub_mep_001');
    const subContract2 = contracts.find(c => c.id === 'contract_sub_steel_001');
    const megaProject = projects.find(p => p.id === 'megaproject_neom_001');

    if (!megaContract || !serviceContract1 || !serviceContract2 || !advisoryContract || !subContract1 || !subContract2 || !megaProject) {
      console.warn('Required contracts not found, skipping engagements');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createEngagementIfNotExists(engagementData) {
      const exists = engagements.some(e => e.id === engagementData.id);
      if (exists && !forceReload) {
        skipped.push(engagementData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = engagements.filter(e => e.id !== engagementData.id);
        localStorage.setItem('pmtwin_engagements', JSON.stringify(filtered));
      }

      const engagement = PMTwinData.Engagements.create(engagementData);
      if (engagement) {
        created.push(engagement.id);
      }
      return engagement;
    }

    const now = new Date();

    // 1. Mega Engagement: Vendor Alpha (MEGA_PROJECT_CONTRACT)
    const megaEngagement = createEngagementIfNotExists({
      id: 'eng_mega_001',
      contractId: megaContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: megaProject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 2. Service Engagement 1: BIM Provider (SERVICE_CONTRACT 1)
    const serviceEngagement1 = createEngagementIfNotExists({
      id: 'eng_service_bim_001',
      contractId: serviceContract1.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_civil_001',
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 3. Service Engagement 2: QA Provider (SERVICE_CONTRACT 2)
    const serviceEngagement2 = createEngagementIfNotExists({
      id: 'eng_service_qa_001',
      contractId: serviceContract2.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'PLANNED', // Will start later
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_mep_001',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 4. Advisory Engagement: Consultant (ADVISORY_CONTRACT)
    const advisoryEngagement = createEngagementIfNotExists({
      id: 'eng_advisory_001',
      contractId: advisoryContract.id,
      engagementType: 'ADVISORY',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: megaProject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 5. SubContract Engagement 1: MEP SubContractor (SUB_CONTRACT 1)
    const subEngagement1 = createEngagementIfNotExists({
      id: 'eng_sub_mep_001',
      contractId: subContract1.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'PLANNED', // Will start later
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_mep_001',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // 6. SubContract Engagement 2: Steel SubContractor (SUB_CONTRACT 2)
    const subEngagement2 = createEngagementIfNotExists({
      id: 'eng_sub_steel_001',
      contractId: subContract2.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_civil_001',
      startedAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      engagements: {
        megaEngagement,
        serviceEngagement1,
        serviceEngagement2,
        advisoryEngagement,
        subEngagement1,
        subEngagement2
      }
    };
  }

  // ============================================
  // G) Milestones/Deliverables
  // ============================================
  function createGoldenMilestones(forceReload = false) {
    const milestones = PMTwinData.Milestones.getAll();
    const engagements = PMTwinData.Engagements.getAll();
    const contracts = PMTwinData.Contracts.getAll();

    const serviceEngagement1 = engagements.find(e => e.id === 'eng_service_bim_001');
    const serviceEngagement2 = engagements.find(e => e.id === 'eng_service_qa_001');
    const advisoryEngagement = engagements.find(e => e.id === 'eng_advisory_001');
    const megaEngagement = engagements.find(e => e.id === 'eng_mega_001');
    const subEngagement1 = engagements.find(e => e.id === 'eng_sub_mep_001');
    const subEngagement2 = engagements.find(e => e.id === 'eng_sub_steel_001');

    if (!serviceEngagement1 || !serviceEngagement2 || !advisoryEngagement || !megaEngagement) {
      console.warn('Required engagements not found, skipping milestones');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createMilestoneIfNotExists(milestoneData) {
      const exists = milestones.some(m => m.id === milestoneData.id);
      if (exists && !forceReload) {
        skipped.push(milestoneData.id);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = milestones.filter(m => m.id !== milestoneData.id);
        localStorage.setItem('pmtwin_milestones', JSON.stringify(filtered));
      }

      const milestone = PMTwinData.Milestones.create(milestoneData);
      if (milestone) {
        created.push(milestone.id);
      }
      return milestone;
    }

    const now = new Date();

    // BIM Engagement Milestones
    createMilestoneIfNotExists({
      id: 'mil_bim_001',
      engagementId: serviceEngagement1.id,
      contractId: serviceEngagement1.contractId,
      title: 'Clash Report v1',
      description: 'Initial clash detection report identifying all conflicts in the BIM model',
      type: 'DELIVERABLE',
      status: 'IN_PROGRESS',
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    createMilestoneIfNotExists({
      id: 'mil_bim_002',
      engagementId: serviceEngagement1.id,
      contractId: serviceEngagement1.contractId,
      title: 'IFC Coordination Model',
      description: 'Complete IFC coordination model with all disciplines integrated',
      type: 'DELIVERABLE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    createMilestoneIfNotExists({
      id: 'mil_bim_003',
      engagementId: serviceEngagement1.id,
      contractId: serviceEngagement1.contractId,
      title: 'Final BIM Deliverable',
      description: 'Final BIM model with all coordination complete and documentation',
      type: 'DELIVERABLE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    // QA Engagement Milestones (Weekly reports)
    for (let i = 1; i <= 12; i++) {
      createMilestoneIfNotExists({
        id: `mil_qa_weekly_${String(i).padStart(2, '0')}`,
        engagementId: serviceEngagement2.id,
        contractId: serviceEngagement2.contractId,
        title: `Weekly Inspection Report #${i}`,
        description: `Weekly QA/QC inspection report for week ${i}`,
        type: 'DELIVERABLE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + (180 + i * 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    createMilestoneIfNotExists({
      id: 'mil_qa_ncr',
      engagementId: serviceEngagement2.id,
      contractId: serviceEngagement2.contractId,
      title: 'NCR Closure Summary',
      description: 'Summary report of all NCRs identified and closed during the inspection period',
      type: 'DELIVERABLE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    // Advisory Engagement Milestones
    createMilestoneIfNotExists({
      id: 'mil_adv_001',
      engagementId: advisoryEngagement.id,
      contractId: advisoryEngagement.contractId,
      title: 'Sustainability Assessment Report',
      description: 'Comprehensive sustainability assessment for the mega-project',
      type: 'DELIVERABLE',
      status: 'IN_PROGRESS',
      dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    createMilestoneIfNotExists({
      id: 'mil_adv_002',
      engagementId: advisoryEngagement.id,
      contractId: advisoryEngagement.contractId,
      title: 'Compliance Checklist',
      description: 'Complete compliance checklist for environmental and sustainability standards',
      type: 'DELIVERABLE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    // Vendor Engagement Milestones
    createMilestoneIfNotExists({
      id: 'mil_vendor_001',
      engagementId: megaEngagement.id,
      contractId: megaEngagement.contractId,
      title: 'Foundation Complete',
      description: 'All foundation works completed and approved',
      type: 'MILESTONE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    createMilestoneIfNotExists({
      id: 'mil_vendor_002',
      engagementId: megaEngagement.id,
      contractId: megaEngagement.contractId,
      title: 'Structure Complete',
      description: 'All structural works completed and approved',
      type: 'MILESTONE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 540 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    createMilestoneIfNotExists({
      id: 'mil_vendor_003',
      engagementId: megaEngagement.id,
      contractId: megaEngagement.contractId,
      title: 'MEP Installation Complete',
      description: 'All MEP installation works completed and commissioned',
      type: 'MILESTONE',
      status: 'PENDING',
      dueDate: new Date(now.getTime() + 720 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    });

    // SubContract Engagement 1 Milestones (MEP)
    if (subEngagement1) {
      createMilestoneIfNotExists({
        id: 'mil_sub_mep_001',
        engagementId: subEngagement1.id,
        contractId: subEngagement1.contractId,
        title: 'MEP Design Complete',
        description: 'Complete MEP design and shop drawings',
        type: 'MILESTONE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      createMilestoneIfNotExists({
        id: 'mil_sub_mep_002',
        engagementId: subEngagement1.id,
        contractId: subEngagement1.contractId,
        title: 'MEP Installation 50%',
        description: 'MEP installation 50% complete',
        type: 'MILESTONE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 360 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    // SubContract Engagement 2 Milestones (Steel)
    if (subEngagement2) {
      createMilestoneIfNotExists({
        id: 'mil_sub_steel_001',
        engagementId: subEngagement2.id,
        contractId: subEngagement2.contractId,
        title: 'Steel Fabrication 50%',
        description: 'Steel fabrication 50% complete',
        type: 'MILESTONE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });

      createMilestoneIfNotExists({
        id: 'mil_sub_steel_002',
        engagementId: subEngagement2.id,
        contractId: subEngagement2.contractId,
        title: 'Steel Erection Complete',
        description: 'All steel erection works completed',
        type: 'MILESTONE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 240 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    return {
      created: created.length,
      skipped: skipped.length
    };
  }

  // ============================================
  // H) Service Provider Profiles
  // ============================================
  function createGoldenServiceProviderProfiles(forceReload = false) {
    const profiles = PMTwinData.ServiceProviderProfiles.getAll();
    const users = PMTwinData.Users.getAll();

    const bimProvider = users.find(u => u.email === 'bim@pmtwin.com');
    const qaProvider = users.find(u => u.email === 'qa@pmtwin.com');
    const schedulerProvider = users.find(u => u.email === 'scheduler@pmtwin.com');

    if (!bimProvider || !qaProvider || !schedulerProvider) {
      console.warn('Service providers not found, skipping profiles');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createProfileIfNotExists(profileData) {
      const exists = profiles.some(p => p.userId === profileData.userId);
      if (exists && !forceReload) {
        skipped.push(profileData.userId);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = profiles.filter(p => p.userId !== profileData.userId);
        localStorage.setItem('pmtwin_service_provider_profiles', JSON.stringify(filtered));
      }

      const profile = PMTwinData.ServiceProviderProfiles.create(profileData);
      if (profile) {
        created.push(profile.id);
      }
      return profile;
    }

    // BIM Provider Profile
    createProfileIfNotExists({
      userId: bimProvider.id,
      providerType: 'company',
      name: 'BIM Solutions Co',
      companyName: 'BIM Solutions Co',
      description: 'Leading BIM coordination and modeling services for mega-projects',
      categories: ['BIM', 'Design', 'Coordination'],
      skills: ['BIM Modeling', 'Clash Detection', 'IFC Coordination', '4D Scheduling'],
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia'
      },
      serviceAreas: ['Riyadh', 'NEOM', 'Jeddah'],
      availability: 'available',
      responseTime: '24 hours',
      profileScore: 95,
      certifications: ['Autodesk Certified Professional', 'BIM Level 2'],
      establishedYear: 2018,
      contact: {
        email: 'bim@pmtwin.com',
        phone: '+966505678901'
      },
      status: 'active',
      createdAt: new Date().toISOString()
    });

    // QA Provider Profile
    createProfileIfNotExists({
      userId: qaProvider.id,
      providerType: 'company',
      name: 'Quality Assurance Services',
      companyName: 'Quality Assurance Services',
      description: 'Comprehensive QA/QC services for construction projects',
      categories: ['Quality Control', 'Inspection', 'Testing'],
      skills: ['Site Inspection', 'Quality Control', 'NCR Management', 'Testing & Commissioning'],
      location: {
        city: 'Dammam',
        region: 'Eastern Province',
        country: 'Saudi Arabia'
      },
      serviceAreas: ['Dammam', 'Jubail', 'Khobar', 'Riyadh'],
      availability: 'available',
      responseTime: '24 hours',
      profileScore: 92,
      certifications: ['ISO 9001 Lead Auditor', 'NCR Management Certified'],
      establishedYear: 2015,
      contact: {
        email: 'qa@pmtwin.com',
        phone: '+966506789012'
      },
      status: 'active',
      createdAt: new Date().toISOString()
    });

    // Scheduler Provider Profile
    createProfileIfNotExists({
      userId: schedulerProvider.id,
      providerType: 'company',
      name: 'Project Planning Experts',
      companyName: 'Project Planning Experts',
      description: 'Expert project planning and scheduling services',
      categories: ['Planning', 'Scheduling', 'Project Management'],
      skills: ['Project Scheduling', 'Resource Planning', 'Critical Path Analysis', 'Primavera P6'],
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia'
      },
      serviceAreas: ['Riyadh', 'NEOM', 'Jeddah', 'Dammam'],
      availability: 'available',
      responseTime: '48 hours',
      profileScore: 90,
      certifications: ['PMP', 'Primavera P6 Certified'],
      establishedYear: 2016,
      contact: {
        email: 'scheduler@pmtwin.com',
        phone: '+966507890123'
      },
      status: 'active',
      createdAt: new Date().toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length
    };
  }

  // ============================================
  // I) Beneficiaries Index
  // ============================================
  function createGoldenBeneficiaries(forceReload = false) {
    const beneficiaries = PMTwinData.Beneficiaries.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();

    const beneficiaryA = users.find(u => u.email === 'beneficiary@pmtwin.com');
    const beneficiaryB = users.find(u => u.email === 'entity2@pmtwin.com');
    const megaProject = projects.find(p => p.id === 'megaproject_neom_001');
    const standaloneProject = projects.find(p => p.id === 'project_residential_001');

    if (!beneficiaryA || !beneficiaryB) {
      console.warn('Beneficiaries not found, skipping beneficiaries index');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];

    function createBeneficiaryIfNotExists(beneficiaryData) {
      const exists = beneficiaries.some(b => b.userId === beneficiaryData.userId);
      if (exists && !forceReload) {
        skipped.push(beneficiaryData.userId);
        return null;
      }
      
      if (exists && forceReload) {
        const filtered = beneficiaries.filter(b => b.userId !== beneficiaryData.userId);
        localStorage.setItem('pmtwin_beneficiaries_index', JSON.stringify(filtered));
      }

      const beneficiary = PMTwinData.Beneficiaries.create(beneficiaryData);
      if (beneficiary) {
        created.push(beneficiary.id);
      }
      return beneficiary;
    }

    // Beneficiary A
    if (megaProject) {
      createBeneficiaryIfNotExists({
        userId: beneficiaryA.id,
        name: 'NEOM Development Authority',
        companyName: 'NEOM Development Authority',
        location: {
          city: 'NEOM',
          region: 'Tabuk Province',
          country: 'Saudi Arabia'
        },
        requiredServices: ['BIM Coordination', 'QA/QC', 'Advisory Services'],
        requiredSkills: ['BIM Modeling', 'Quality Control', 'Sustainability'],
        budgetRange: {
          min: 100000,
          max: 5000000,
          currency: 'SAR'
        },
        projectIds: [megaProject.id],
        preferences: {
          deliveryMode: ['On-site', 'Hybrid'],
          paymentTerms: ['milestone_based', 'monthly'],
          exchangeType: ['Cash']
        },
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    // Beneficiary B
    if (standaloneProject) {
      createBeneficiaryIfNotExists({
        userId: beneficiaryB.id,
        name: 'Saudi Real Estate Company',
        companyName: 'Saudi Real Estate Company',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        requiredServices: ['General Contracting', 'Project Management'],
        requiredSkills: ['High-Rise Construction', 'Residential Development'],
        budgetRange: {
          min: 100000000,
          max: 200000000,
          currency: 'SAR'
        },
        projectIds: [standaloneProject.id],
        preferences: {
          deliveryMode: ['On-site'],
          paymentTerms: ['milestone_based'],
          exchangeType: ['Cash']
        },
        status: 'active',
        createdAt: new Date().toISOString()
      });
    }

    return {
      created: created.length,
      skipped: skipped.length
    };
  }

  // ============================================
  // J) Collaboration Opportunities for All 13 Models
  // ============================================
  function createCollaborationOpportunitiesForAllModels(forceReload = false) {
    console.log('🌱 Creating collaboration opportunities for all 13 models...');
    
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationOpportunities) {
      console.warn('CollaborationOpportunities not available');
      return { created: 0, skipped: 0 };
    }

    const users = PMTwinData.Users.getAll();
    const opportunities = PMTwinData.CollaborationOpportunities.getAll();
    
    const projectLeadA = users.find(u => u.email === 'project.lead.riyadh@pmtwin.com') || users.find(u => u.role === 'project_lead');
    const projectLeadB = users.find(u => u.email === 'project.lead.jeddah@pmtwin.com') || users.find(u => u.email === 'entity2@pmtwin.com');
    const supplier1 = users.find(u => u.email === 'supplier.riyadh@pmtwin.com') || users.find(u => u.role === 'supplier');
    const serviceProvider1 = users.find(u => u.email === 'provider.riyadh@pmtwin.com') || users.find(u => u.role === 'service_provider');
    const consultant1 = users.find(u => u.email === 'consultant.jeddah@pmtwin.com') || users.find(u => u.role === 'consultant');
    const professional1 = users.find(u => u.email === 'professional.khobar@pmtwin.com') || users.find(u => u.role === 'professional');
    const mentor1 = users.find(u => u.email === 'mentor@pmtwin.com') || users.find(u => u.role === 'mentor');

    if (!projectLeadA) {
      console.warn('Project lead users not found, skipping collaboration opportunities');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];
    const now = new Date();
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    function createCollabOppIfNotExists(oppData) {
      const exists = opportunities.some(o => o.id === oppData.id);
      if (exists && !forceReload) {
        skipped.push(oppData.id);
        return null;
      }
      if (exists && forceReload) {
        PMTwinData.CollaborationOpportunities.delete(oppData.id);
      }
      const opp = PMTwinData.CollaborationOpportunities.create(oppData);
      if (opp) created.push(opp.id);
      return opp;
    }

    // Model 1.1: Task-Based Engagement (already exists in SeedNewOpportunityWorkflow, add more)
    createCollabOppIfNotExists({
      id: 'collab_1_1_001',
      modelId: '1.1',
      modelName: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      creatorId: projectLeadA.id,
      title: 'Structural Engineering Review for High-Rise Building',
      description: 'Seeking experienced structural engineer for comprehensive review of high-rise building design. Task includes analysis of load-bearing structures, seismic considerations, and compliance with Saudi Building Code.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Olaya',
        isRemoteAllowed: true
      },
      attributes: {
        taskTitle: 'Structural Engineering Review',
        taskType: 'Engineering Review',
        detailedScope: 'Comprehensive structural analysis and review',
        requiredSkills: ['Structural Engineering', 'Seismic Analysis', 'SBC Compliance'],
        budgetRange: { min: 50000, max: 100000, currency: 'SAR' },
        duration: 30,
        startDate: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      createdAt: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 1.2: Consortium
    createCollabOppIfNotExists({
      id: 'collab_1_2_001',
      modelId: '1.2',
      modelName: 'Consortium',
      category: 'Project-Based Collaboration',
      creatorId: projectLeadA.id,
      title: 'NEOM Infrastructure Development Consortium',
      description: 'Forming a temporary consortium for NEOM infrastructure development project. Seeking partners with expertise in civil engineering, MEP systems, and project management. Consortium will work together for the duration of this mega-project.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Tabuk (NEOM)',
        area: 'NEOM Development Zone',
        isRemoteAllowed: false
      },
      attributes: {
        projectTitle: 'NEOM Infrastructure Development',
        projectValue: 500000000,
        duration: 36,
        requiredPartners: ['Civil Engineering', 'MEP Systems', 'Project Management'],
        consortiumStructure: 'Equal partnership',
        budgetRange: { min: 100000000, max: 500000000, currency: 'SAR' }
      },
      createdAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 1.3: Project-Specific Joint Venture
    createCollabOppIfNotExists({
      id: 'collab_1_3_001',
      modelId: '1.3',
      modelName: 'Project-Specific Joint Venture',
      category: 'Project-Based Collaboration',
      creatorId: projectLeadA.id,
      title: 'Commercial Complex Development JV',
      description: 'Seeking partner for joint venture to develop a large commercial complex in Riyadh. Shared management and expertise required. JV will be formed specifically for this project.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'King Fahd Road',
        isRemoteAllowed: false
      },
      attributes: {
        projectTitle: 'Commercial Complex Development',
        projectValue: 200000000,
        duration: 24,
        jvStructure: '50-50 partnership',
        requiredExpertise: ['Commercial Development', 'Retail Management', 'Property Management'],
        budgetRange: { min: 100000000, max: 200000000, currency: 'SAR' }
      },
      createdAt: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 1.4: SPV (already exists, add another)
    createCollabOppIfNotExists({
      id: 'collab_1_4_002',
      modelId: '1.4',
      modelName: 'Special Purpose Vehicle (SPV)',
      category: 'Project-Based Collaboration',
      creatorId: projectLeadA.id,
      title: 'Red Sea Development SPV - Phase 2',
      description: 'Forming SPV for Phase 2 of Red Sea development project. Risk-isolated entity for mega-project exceeding 50M SAR. Seeking partners for design, procurement, and execution work packages.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Tabuk',
        area: 'Red Sea Coast',
        isRemoteAllowed: false
      },
      attributes: {
        projectTitle: 'Red Sea Development Phase 2',
        projectValue: 750000000,
        spvValue: 750000000,
        duration: 48,
        workPackages: [
          { packageId: 'wp_design_phase2', title: 'Design Package Phase 2', assignedPartyId: null, value: 150000000 },
          { packageId: 'wp_procurement_phase2', title: 'Procurement Package Phase 2', assignedPartyId: null, value: 250000000 },
          { packageId: 'wp_execution_phase2', title: 'Execution Package Phase 2', assignedPartyId: null, value: 350000000 }
        ],
        jvStructure: '60-40',
        spvStructure: 'SPV'
      },
      createdAt: new Date(baseDate.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 2.1: Strategic Joint Venture
    createCollabOppIfNotExists({
      id: 'collab_2_1_001',
      modelId: '2.1',
      modelName: 'Strategic Joint Venture',
      category: 'Strategic Partnerships',
      creatorId: projectLeadA.id,
      title: 'Long-Term Construction Services JV',
      description: 'Seeking strategic partner for long-term joint venture (10+ years) to establish permanent business entity for construction services in Saudi Arabia. Focus on sustainable development and green building projects.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Multiple locations',
        isRemoteAllowed: false
      },
      attributes: {
        partnershipDuration: 120, // 10 years in months
        partnershipType: 'Permanent Business Entity',
        focusAreas: ['Sustainable Development', 'Green Building', 'Infrastructure'],
        jvStructure: 'Equal partnership',
        investmentRequired: 50000000,
        budgetRange: { min: 50000000, max: 100000000, currency: 'SAR' }
      },
      createdAt: new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 2.2: Strategic Alliance
    createCollabOppIfNotExists({
      id: 'collab_2_2_001',
      modelId: '2.2',
      modelName: 'Strategic Alliance',
      category: 'Strategic Partnerships',
      creatorId: supplier1?.id || projectLeadA.id,
      title: 'Materials Supply Strategic Alliance',
      description: 'Forming strategic alliance for ongoing materials supply partnership. Long-term contractual relationship without forming new entity. Focus on bulk purchasing and supply chain optimization.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Multiple regions',
        isRemoteAllowed: false
      },
      attributes: {
        allianceDuration: 120, // 10 years in months
        allianceType: 'Supply Chain Partnership',
        focusAreas: ['Bulk Purchasing', 'Materials Supply', 'Supply Chain Optimization'],
        contractType: 'Long-term supply agreement',
        budgetRange: { min: 10000000, max: 50000000, currency: 'SAR' }
      },
      createdAt: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 2.3: Mentorship
    createCollabOppIfNotExists({
      id: 'collab_2_3_001',
      modelId: '2.3',
      modelName: 'Mentorship',
      category: 'Strategic Partnerships',
      creatorId: mentor1?.id || professional1?.id || projectLeadA.id,
      title: 'Construction Project Management Mentorship Program',
      description: 'Mentorship program for junior construction professionals. Experienced mentors will guide mentees through project management best practices, career development, and industry knowledge transfer.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Various',
        isRemoteAllowed: true
      },
      attributes: {
        mentorshipDuration: 12, // months
        mentorshipType: 'Professional Development',
        focusAreas: ['Project Management', 'Career Development', 'Industry Best Practices'],
        menteeLevel: 'junior',
        mentorRequirements: ['10+ years experience', 'PMP certification', 'Mentoring experience'],
        budgetRange: { min: 0, max: 0, currency: 'SAR' } // Usually no cost
      },
      createdAt: new Date(baseDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 3.1: Bulk Purchasing
    createCollabOppIfNotExists({
      id: 'collab_3_1_001',
      modelId: '3.1',
      modelName: 'Bulk Purchasing',
      category: 'Resource Pooling & Sharing',
      creatorId: supplier1?.id || projectLeadA.id,
      title: 'Steel Reinforcement Bulk Purchase Initiative',
      description: 'Group buying initiative for steel reinforcement materials. Multiple contractors joining together to achieve volume discounts. Minimum order quantity required for participation.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Industrial Area',
        isRemoteAllowed: false
      },
      attributes: {
        purchaseType: 'Group Buying',
        materialType: 'Steel Reinforcement',
        minimumQuantity: 1000, // tons
        targetDiscount: 15, // percentage
        estimatedSavings: 5000000,
        budgetRange: { min: 20000000, max: 50000000, currency: 'SAR' },
        deadline: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      createdAt: new Date(baseDate.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 3.2: Co-Ownership
    createCollabOppIfNotExists({
      id: 'collab_3_2_001',
      modelId: '3.2',
      modelName: 'Co-Ownership',
      category: 'Resource Pooling & Sharing',
      creatorId: projectLeadA.id,
      title: 'Heavy Machinery Co-Ownership - Tower Cranes',
      description: 'Seeking partners for joint ownership of high-value tower cranes. Multiple parties will share ownership and usage rights. Ideal for contractors with overlapping project timelines.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Multiple sites',
        isRemoteAllowed: false
      },
      attributes: {
        assetType: 'Tower Cranes',
        assetValue: 5000000,
        ownershipStructure: 'Equal shares',
        numberOfPartners: 3,
        usageAllocation: 'Time-shared',
        budgetRange: { min: 1500000, max: 2000000, currency: 'SAR' } // Per partner
      },
      createdAt: new Date(baseDate.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 3.3: Resource Exchange/Barter
    createCollabOppIfNotExists({
      id: 'collab_3_3_001',
      modelId: '3.3',
      modelName: 'Resource Exchange/Barter',
      category: 'Resource Pooling & Sharing',
      creatorId: supplier1?.id || projectLeadA.id,
      title: 'Surplus Materials Exchange Marketplace',
      description: 'Marketplace for trading surplus construction materials and equipment. Exchange services, materials, or equipment without cash transactions. Value equivalence calculated for fair trades.',
      status: 'active',
      intent: 'BOTH',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Various',
        isRemoteAllowed: false
      },
      attributes: {
        exchangeType: 'Materials & Equipment',
        barterRule: 'ALLOW_DIFFERENCE_CASH',
        itemsOffered: ['Surplus Steel', 'Excess Concrete', 'Used Equipment'],
        itemsRequested: ['Cement', 'Electrical Materials', 'Plumbing Supplies'],
        estimatedValue: 500000,
        budgetRange: { min: 0, max: 0, currency: 'SAR' } // Barter, no cash
      },
      createdAt: new Date(baseDate.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 4.1: Professional Hiring
    createCollabOppIfNotExists({
      id: 'collab_4_1_001',
      modelId: '4.1',
      modelName: 'Professional Hiring',
      category: 'Hiring a Resource',
      creatorId: projectLeadA.id,
      title: 'Senior Project Manager - Full-Time Position',
      description: 'Seeking experienced Senior Project Manager for full-time employment. Must have 10+ years experience in construction project management, PMP certification, and experience with mega-projects.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Head Office',
        isRemoteAllowed: false
      },
      attributes: {
        positionType: 'Full-Time',
        positionTitle: 'Senior Project Manager',
        requiredExperience: '10+ years',
        requiredSkills: ['Project Management', 'Mega-Projects', 'Team Leadership'],
        salaryRange: { min: 25000, max: 35000, currency: 'SAR' }, // Monthly
        benefits: ['Health Insurance', 'Transportation', 'Annual Bonus'],
        startDate: new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      createdAt: new Date(baseDate.getTime() + 11 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 4.2: Consultant Hiring
    createCollabOppIfNotExists({
      id: 'collab_4_2_001',
      modelId: '4.2',
      modelName: 'Consultant Hiring',
      category: 'Hiring a Resource',
      creatorId: projectLeadA.id,
      title: 'Sustainability Consultant - Advisory Services',
      description: 'Seeking expert sustainability consultant for advisory services on green building certification. Consultant will provide guidance on LEED certification, energy efficiency, and sustainable design practices.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Project Site',
        isRemoteAllowed: true
      },
      attributes: {
        consultantType: 'Advisory Services',
        expertiseArea: 'Sustainability & Green Building',
        requiredCertifications: ['LEED AP', 'Sustainability Expert'],
        projectDuration: 6, // months
        consultingFee: { min: 80000, max: 120000, currency: 'SAR' },
        deliverables: ['LEED Certification Support', 'Sustainability Assessment', 'Energy Audit Report']
      },
      createdAt: new Date(baseDate.getTime() + 12 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Model 5.1: Competition/RFP
    createCollabOppIfNotExists({
      id: 'collab_5_1_001',
      modelId: '5.1',
      modelName: 'Competition/RFP',
      category: 'Call for Competition',
      creatorId: projectLeadA.id,
      title: 'Innovative Building Design Competition',
      description: 'Open design competition for innovative commercial building design. Seeking creative and sustainable design solutions. Prize money for top 3 designs. Winning design may be selected for implementation.',
      status: 'active',
      intent: 'REQUEST_SERVICE',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'Design Competition',
        isRemoteAllowed: true
      },
      attributes: {
        competitionType: 'design',
        prizeAmount: 500000,
        submissionDeadline: new Date(baseDate.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
        evaluationCriteria: ['Innovation', 'Sustainability', 'Feasibility', 'Aesthetics'],
        numberOfWinners: 3,
        prizes: [
          { rank: 1, amount: 250000, currency: 'SAR' },
          { rank: 2, amount: 150000, currency: 'SAR' },
          { rank: 3, amount: 100000, currency: 'SAR' }
        ]
      },
      createdAt: new Date(baseDate.getTime() + 13 * 24 * 60 * 60 * 1000).toISOString()
    });

    console.log(`✅ Created ${created.length} collaboration opportunities, skipped ${skipped.length}`);
    return { created: created.length, skipped: skipped.length, ids: created };
  }

  // ============================================
  // K) Collaboration Applications
  // ============================================
  function createCollaborationApplications(forceReload = false) {
    console.log('🌱 Creating collaboration applications...');
    
    if (typeof PMTwinData === 'undefined' || !PMTwinData.CollaborationApplications) {
      console.warn('CollaborationApplications not available');
      return { created: 0, skipped: 0 };
    }

    const users = PMTwinData.Users.getAll();
    const opportunities = PMTwinData.CollaborationOpportunities.getAll();
    const applications = PMTwinData.CollaborationApplications.getAll();

    const projectLeadA = users.find(u => u.email === 'project.lead.riyadh@pmtwin.com') || users.find(u => u.role === 'project_lead');
    const serviceProvider1 = users.find(u => u.email === 'provider.riyadh@pmtwin.com') || users.find(u => u.role === 'service_provider');
    const consultant1 = users.find(u => u.email === 'consultant.jeddah@pmtwin.com') || users.find(u => u.role === 'consultant');
    const professional1 = users.find(u => u.email === 'professional.khobar@pmtwin.com') || users.find(u => u.role === 'professional');
    const supplier1 = users.find(u => u.email === 'supplier.riyadh@pmtwin.com') || users.find(u => u.role === 'supplier');

    if (!opportunities || opportunities.length === 0) {
      console.warn('No collaboration opportunities found, skipping applications');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    function createAppIfNotExists(appData) {
      const exists = applications.some(a => a.id === appData.id);
      if (exists && !forceReload) {
        skipped.push(appData.id);
        return null;
      }
      if (exists && forceReload) {
        PMTwinData.CollaborationApplications.delete(appData.id);
      }
      const app = PMTwinData.CollaborationApplications.create(appData);
      if (app) created.push(app.id);
      return app;
    }

    // Get collaboration opportunities
    const collabOpps = opportunities.filter(o => o.modelId && o.modelId !== '1.1'); // Exclude regular opportunities
    
    // Create applications for various opportunities
    collabOpps.forEach((opp, index) => {
      // Skip if creator is applying to their own opportunity
      const applicants = [serviceProvider1, consultant1, professional1, supplier1].filter(u => u && u.id !== opp.creatorId);
      
      if (applicants.length === 0) return;

      // Create 1-3 applications per opportunity
      const numApps = Math.min(applicants.length, Math.floor(Math.random() * 3) + 1);
      
      for (let i = 0; i < numApps; i++) {
        const applicant = applicants[i % applicants.length];
        if (!applicant) continue;

        const statuses = ['pending', 'under_review', 'approved', 'rejected'];
        const weights = [0.4, 0.3, 0.2, 0.1]; // More pending/reviewing than approved/rejected
        const rand = Math.random();
        let status = 'pending';
        let cumulative = 0;
        for (let j = 0; j < statuses.length; j++) {
          cumulative += weights[j];
          if (rand < cumulative) {
            status = statuses[j];
            break;
          }
        }

        const appId = `collab_app_${opp.id}_${applicant.id}_${i}`;
        createAppIfNotExists({
          id: appId,
          opportunityId: opp.id,
          applicantId: applicant.id,
          applicantType: applicant.userType === 'beneficiary' || applicant.userType === 'vendor_corporate' ? 'entity' : 'individual',
          status: status,
          applicationData: {
            proposal: `Application for ${opp.title}. We have extensive experience in this area and are excited about the opportunity to collaborate.`,
            qualifications: ['Relevant Experience', 'Certifications', 'Portfolio'],
            timeline: `${opp.attributes?.duration || 30} days`,
            budget: opp.attributes?.budgetRange || { min: 0, max: 0, currency: 'SAR' },
            deliverables: ['Quality deliverables', 'Timely completion', 'Professional service']
          },
          submittedAt: new Date(baseDate.getTime() + (index * 2 + i) * 24 * 60 * 60 * 1000).toISOString(),
          reviewedAt: status !== 'pending' ? new Date(baseDate.getTime() + (index * 2 + i + 1) * 24 * 60 * 60 * 1000).toISOString() : null,
          reviewedBy: status !== 'pending' ? opp.creatorId : null,
          reviewNotes: status === 'approved' ? 'Application approved. Looking forward to collaboration.' : status === 'rejected' ? 'Application does not meet requirements.' : null,
          rejectionReason: status === 'rejected' ? 'Does not meet minimum requirements' : null
        });
      }
    });

    console.log(`✅ Created ${created.length} collaboration applications, skipped ${skipped.length}`);
    return { created: created.length, skipped: skipped.length, ids: created };
  }

  // ============================================
  // L) Matching Results
  // ============================================
  function createMatchingResults(forceReload = false) {
    console.log('🌱 Creating matching results...');
    
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Matches) {
      console.warn('Matches service not available');
      return { created: 0, skipped: 0 };
    }

    const opportunities = PMTwinData.Opportunities.getAll();
    const users = PMTwinData.Users.getAll();
    const matches = PMTwinData.Matches.getAll();

    const serviceProvider1 = users.find(u => u.email === 'provider.riyadh@pmtwin.com') || users.find(u => u.role === 'service_provider');
    const consultant1 = users.find(u => u.email === 'consultant.jeddah@pmtwin.com') || users.find(u => u.role === 'consultant');
    const professional1 = users.find(u => u.email === 'professional.khobar@pmtwin.com') || users.find(u => u.role === 'professional');

    if (!opportunities || opportunities.length === 0) {
      console.warn('No opportunities found, skipping matches');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    function createMatchIfNotExists(matchData) {
      const exists = matches.some(m => m.id === matchData.id);
      if (exists && !forceReload) {
        skipped.push(matchData.id);
        return null;
      }
      if (exists && forceReload) {
        PMTwinData.Matches.delete(matchData.id);
      }
      const match = PMTwinData.Matches.create(matchData);
      if (match) created.push(match.id);
      return match;
    }

    // Create matches for REQUEST_SERVICE opportunities
    const requestOpps = opportunities.filter(o => o.intent === 'REQUEST_SERVICE' && o.status === 'published');
    const providers = [serviceProvider1, consultant1, professional1].filter(u => u);

    requestOpps.forEach((opp, index) => {
      providers.forEach((provider, pIndex) => {
        if (!provider || provider.id === opp.createdBy) return;

        // Generate match score >80% (threshold)
        const baseScore = 80 + Math.floor(Math.random() * 20); // 80-100%
        
        const matchId = `match_${opp.id}_${provider.id}`;
        createMatchIfNotExists({
          id: matchId,
          projectId: opp.id,
          opportunityId: opp.id,
          providerId: provider.id,
          score: baseScore,
          criteria: {
            categoryMatch: 90 + Math.floor(Math.random() * 10),
            skillsMatch: 85 + Math.floor(Math.random() * 15),
            experienceMatch: 80 + Math.floor(Math.random() * 20),
            locationMatch: opp.location?.isRemoteAllowed ? 100 : 70 + Math.floor(Math.random() * 30)
          },
          weights: {
            category: 0.30,
            skills: 0.40,
            experience: 0.20,
            location: 0.10
          },
          meetsThreshold: baseScore >= 80,
          notified: Math.random() > 0.5, // Some notified, some not
          createdAt: new Date(baseDate.getTime() + (index * 3 + pIndex) * 24 * 60 * 60 * 1000).toISOString()
        });
      });
    });

    console.log(`✅ Created ${created.length} matching results, skipped ${skipped.length}`);
    return { created: created.length, skipped: skipped.length, ids: created };
  }

  // ============================================
  // M) Notifications
  // ============================================
  function createNotifications(forceReload = false) {
    console.log('🌱 Creating notifications...');
    
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Notifications) {
      console.warn('Notifications service not available');
      return { created: 0, skipped: 0 };
    }

    const users = PMTwinData.Users.getAll();
    const opportunities = PMTwinData.Opportunities.getAll();
    const proposals = PMTwinData.Proposals.getAll();
    const matches = PMTwinData.Matches?.getAll() || [];
    const notifications = PMTwinData.Notifications.getAll();

    if (!users || users.length === 0) {
      console.warn('No users found, skipping notifications');
      return { created: 0, skipped: 0 };
    }

    const created = [];
    const skipped = [];
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    function createNotifIfNotExists(notifData) {
      const exists = notifications.some(n => n.id === notifData.id);
      if (exists && !forceReload) {
        skipped.push(notifData.id);
        return null;
      }
      if (exists && forceReload) {
        PMTwinData.Notifications.delete(notifData.id);
      }
      const notif = PMTwinData.Notifications.create(notifData);
      if (notif) created.push(notif.id);
      return notif;
    }

    // Create notifications for various events
    users.forEach((user, uIndex) => {
      // New opportunity matches
      matches.filter(m => m.providerId === user.id && m.meetsThreshold && !m.notified).forEach((match, mIndex) => {
        const opp = opportunities.find(o => o.id === match.opportunityId);
        if (opp) {
          createNotifIfNotExists({
            id: `notif_match_${user.id}_${match.id}`,
            userId: user.id,
            type: 'opportunity_match',
            title: 'New Opportunity Match',
            message: `You have a ${match.score}% match for opportunity: ${opp.title}`,
            relatedEntityType: 'opportunity',
            relatedEntityId: opp.id,
            read: false,
            createdAt: new Date(baseDate.getTime() + (uIndex * 10 + mIndex) * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      });

      // Proposal status updates
      proposals.filter(p => p.providerId === user.id || p.receiverId === user.id).forEach((proposal, pIndex) => {
        if (proposal.status === 'ACCEPTED' || proposal.status === 'FINAL_ACCEPTED') {
          createNotifIfNotExists({
            id: `notif_proposal_${user.id}_${proposal.id}`,
            userId: user.id,
            type: 'proposal_accepted',
            title: 'Proposal Accepted',
            message: `Your proposal has been accepted for opportunity: ${proposal.opportunityId}`,
            relatedEntityType: 'proposal',
            relatedEntityId: proposal.id,
            read: false,
            createdAt: new Date(baseDate.getTime() + (uIndex * 10 + pIndex + 5) * 24 * 60 * 60 * 1000).toISOString()
          });
        }
      });

      // New opportunities (for project leads)
      if (user.role === 'project_lead' || user.role === 'beneficiary') {
        opportunities.filter(o => o.createdBy === user.id && o.status === 'published').slice(0, 2).forEach((opp, oIndex) => {
          createNotifIfNotExists({
            id: `notif_opp_created_${user.id}_${opp.id}`,
            userId: user.id,
            type: 'opportunity_published',
            title: 'Opportunity Published',
            message: `Your opportunity "${opp.title}" has been published successfully`,
            relatedEntityType: 'opportunity',
            relatedEntityId: opp.id,
            read: false,
            createdAt: new Date(baseDate.getTime() + (uIndex * 10 + oIndex) * 24 * 60 * 60 * 1000).toISOString()
          });
        });
      }
    });

    console.log(`✅ Created ${created.length} notifications, skipped ${skipped.length}`);
    return { created: created.length, skipped: skipped.length, ids: created };
  }

  // ============================================
  // N) Admin Test Data
  // ============================================
  function createAdminTestData(forceReload = false) {
    console.log('🌱 Creating admin test data...');
    
    if (typeof PMTwinData === 'undefined') {
      console.warn('PMTwinData not available');
      return { created: 0, skipped: 0 };
    }

    const users = PMTwinData.Users.getAll();
    const opportunities = PMTwinData.Opportunities.getAll();
    const baseDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Create pending users for vetting
    const pendingUsers = [];
    const userRoles = ['project_lead', 'supplier', 'service_provider', 'consultant', 'professional'];
    
    userRoles.forEach((role, index) => {
      const pendingUser = PMTwinData.Users.create({
        email: `pending.${role}@pmtwin.com`,
        password: btoa('Pending123'),
        role: role,
        userType: role === 'project_lead' ? 'beneficiary' : role === 'professional' ? 'sub_contractor' : 'vendor_corporate',
        onboardingStage: 'pending',
        emailVerified: false,
        mobile: `+96650${1000000 + index}`,
        mobileVerified: false,
        identity: role === 'project_lead' ? {
          legalEntityName: `Pending ${role} Company`,
          crNumber: `CR-PENDING-${index}`,
          crVerified: false
        } : {
          fullLegalName: `Pending ${role} User`,
          nationalId: `${1000000000 + index}`,
          nationalIdVerified: false
        },
        profile: {
          name: `Pending ${role}`,
          status: 'pending',
          createdAt: new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString()
        },
        createdAt: new Date(baseDate.getTime() + index * 24 * 60 * 60 * 1000).toISOString()
      });
      if (pendingUser) pendingUsers.push(pendingUser.id);
    });

    // Create draft/pending opportunities for moderation
    const pendingOpps = [];
    const projectLeadA = users.find(u => u.email === 'project.lead.riyadh@pmtwin.com') || users.find(u => u.role === 'project_lead');
    
    if (projectLeadA) {
      ['draft', 'pending'].forEach((status, index) => {
        const opp = PMTwinData.Opportunities.create({
          id: `opp_pending_${status}_${index}`,
          title: `Pending Opportunity ${index + 1} - ${status}`,
          description: `This is a ${status} opportunity awaiting moderation`,
          intent: 'REQUEST_SERVICE',
          model: '1',
          subModel: '1.1',
          modelName: 'Task-Based Engagement',
          category: 'Project-Based Collaboration',
          status: status,
          skills: ['Test Skill'],
          location: {
            country: 'Saudi Arabia',
            city: 'Riyadh',
            isRemoteAllowed: false
          },
          createdBy: projectLeadA.id,
          createdAt: new Date(baseDate.getTime() + (10 + index) * 24 * 60 * 60 * 1000).toISOString()
        });
        if (opp) pendingOpps.push(opp.id);
      });
    }

    console.log(`✅ Created ${pendingUsers.length} pending users, ${pendingOpps.length} pending opportunities`);
    return { 
      created: pendingUsers.length + pendingOpps.length, 
      skipped: 0,
      pendingUsers: pendingUsers.length,
      pendingOpportunities: pendingOpps.length
    };
  }

  // Export
  if (typeof window !== 'undefined') {
    window.GoldenSeedData = {
      load: loadGoldenSeedData,
      createUsers: createGoldenUsers,
      createOpportunities: createGoldenOpportunities, // DEPRECATED - Use SeedNewOpportunityWorkflow instead
      SeedNewOpportunityWorkflow: SeedNewOpportunityWorkflow, // NEW: KSA-only comprehensive workflow
      // REMOVED: createProjects, createServiceRequests (legacy)
      createServiceOffers: createGoldenServiceOffers,
      createContracts: createGoldenContracts,
      createEngagements: createGoldenEngagements,
      createMilestones: createGoldenMilestones,
      createServiceProviderProfiles: createGoldenServiceProviderProfiles,
      createBeneficiaries: createGoldenBeneficiaries,
      createCollaborationOpportunities: createCollaborationOpportunitiesForAllModels,
      createCollaborationApplications: createCollaborationApplications,
      createMatchingResults: createMatchingResults,
      createNotifications: createNotifications,
      createAdminTestData: createAdminTestData
    };
  }

})();

