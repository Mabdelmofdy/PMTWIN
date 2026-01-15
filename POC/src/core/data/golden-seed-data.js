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
    const seedResults = {
      users: createGoldenUsers(forceReload),
      projects: createGoldenProjects(forceReload),
      serviceRequests: createGoldenServiceRequests(forceReload),
      proposals: createGoldenProposals(forceReload),
      serviceOffers: createGoldenServiceOffers(forceReload),
      contracts: createGoldenContracts(forceReload),
      engagements: createGoldenEngagements(forceReload),
      milestones: createGoldenMilestones(forceReload),
      serviceProviderProfiles: createGoldenServiceProviderProfiles(forceReload),
      beneficiaries: createGoldenBeneficiaries(forceReload)
    };

    console.log('✅ Golden Seed Data Loaded:', seedResults);
    
    // Re-enable audit logs after seed data loading
    if (typeof PMTwinData !== 'undefined' && PMTwinData.setSkipAuditLogs) {
      PMTwinData.setSkipAuditLogs(false);
    }
    
    return seedResults;
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
  function createGoldenProjects(forceReload = false) {
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
  function createGoldenServiceOffers(forceReload = false) {
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

  // Export
  if (typeof window !== 'undefined') {
    window.GoldenSeedData = {
      load: loadGoldenSeedData,
      createUsers: createGoldenUsers,
      createProjects: createGoldenProjects,
      createServiceRequests: createGoldenServiceRequests,
      createServiceOffers: createGoldenServiceOffers,
      createContracts: createGoldenContracts,
      createEngagements: createGoldenEngagements,
      createMilestones: createGoldenMilestones,
      createServiceProviderProfiles: createGoldenServiceProviderProfiles,
      createBeneficiaries: createGoldenBeneficiaries
    };
  }

})();

