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

    if (goldenUserExists && !forceReload) {
      console.log('✅ Golden seed data already exists. Use forceReload=true to regenerate.');
      return;
    }

    // Create data in correct order (dependencies first)
    const seedResults = {
      users: createGoldenUsers(forceReload),
      projects: createGoldenProjects(forceReload),
      serviceRequests: createGoldenServiceRequests(forceReload),
      serviceOffers: createGoldenServiceOffers(forceReload),
      contracts: createGoldenContracts(forceReload),
      engagements: createGoldenEngagements(forceReload),
      milestones: createGoldenMilestones(forceReload),
      serviceProviderProfiles: createGoldenServiceProviderProfiles(forceReload),
      beneficiaries: createGoldenBeneficiaries(forceReload)
    };

    console.log('✅ Golden Seed Data Loaded:', seedResults);
    return seedResults;
  }

  // ============================================
  // A) Users + Profiles
  // ============================================
  function createGoldenUsers(forceReload = false) {
    const users = PMTwinData.Users.getAll();
    const created = [];
    const skipped = [];

    // Helper to create user if not exists
    function createUserIfNotExists(userData) {
      const exists = users.some(u => u.email === userData.email);
      if (exists && !forceReload) {
        skipped.push(userData.email);
        return null;
      }
      
      if (exists && forceReload) {
        // Remove existing user
        const existingUser = users.find(u => u.email === userData.email);
        if (existingUser) {
          PMTwinData.Users.delete(existingUser.id);
        }
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
      profile: {
        name: 'Platform Administrator',
        status: 'approved',
        department: 'Operations',
        permissions: ['vet_users', 'moderate_projects', 'view_reports', 'manage_audit_trail', 'manage_users', 'system_settings'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString(),
        approvedBy: 'system'
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
      profile: {
        name: 'NEOM Development Authority',
        companyName: 'NEOM Development Authority',
        status: 'approved',
        location: {
          city: 'NEOM',
          region: 'Tabuk Province',
          country: 'Saudi Arabia'
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
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Saudi Real Estate Company',
        companyName: 'Saudi Real Estate Company',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
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
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Alpha Construction Group',
        companyName: 'Alpha Construction Group',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        registrationNo: 'CR-ALPHA-001',
        capacityScore: 95,
        categories: ['General Contracting', 'Infrastructure', 'MegaProjects'],
        insurance: {
          policyNumber: 'INS-ALPHA-001',
          coverage: 1000000000,
          expiryDate: '2025-12-31'
        },
        liability: {
          coverage: 500000000,
          expiryDate: '2025-12-31'
        },
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Beta Infrastructure Ltd',
        companyName: 'Beta Infrastructure Ltd',
        status: 'approved',
        location: {
          city: 'Jeddah',
          region: 'Makkah Province',
          country: 'Saudi Arabia'
        },
        registrationNo: 'CR-BETA-001',
        capacityScore: 88,
        categories: ['Infrastructure', 'Residential', 'Commercial'],
        insurance: {
          policyNumber: 'INS-BETA-001',
          coverage: 500000000,
          expiryDate: '2025-12-31'
        },
        liability: {
          coverage: 250000000,
          expiryDate: '2025-12-31'
        },
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'BIM Solutions Co',
        companyName: 'BIM Solutions Co',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        skills: ['BIM Modeling', 'Clash Detection', 'IFC Coordination', '4D Scheduling'],
        certifications: ['Autodesk Certified Professional', 'BIM Level 2'],
        availability: 'available',
        rateCard: {
          hourly: 500,
          daily: 4000,
          monthly: 80000,
          currency: 'SAR'
        },
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Quality Assurance Services',
        companyName: 'Quality Assurance Services',
        status: 'approved',
        location: {
          city: 'Dammam',
          region: 'Eastern Province',
          country: 'Saudi Arabia'
        },
        skills: ['Site Inspection', 'Quality Control', 'NCR Management', 'Testing & Commissioning'],
        certifications: ['ISO 9001 Lead Auditor', 'NCR Management Certified'],
        availability: 'available',
        rateCard: {
          hourly: 400,
          daily: 3200,
          monthly: 60000,
          currency: 'SAR'
        },
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Project Planning Experts',
        companyName: 'Project Planning Experts',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        skills: ['Project Scheduling', 'Resource Planning', 'Critical Path Analysis', 'Primavera P6'],
        certifications: ['PMP', 'Primavera P6 Certified'],
        availability: 'available',
        rateCard: {
          hourly: 450,
          daily: 3600,
          monthly: 70000,
          currency: 'SAR'
        },
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Green Building Consultants',
        companyName: 'Green Building Consultants',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        expertiseAreas: ['Sustainability', 'LEED Certification', 'Environmental Compliance', 'Energy Efficiency'],
        advisoryHistoryCount: 25,
        mentorshipTags: ['Sustainability', 'Green Building'],
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'MEP Specialists LLC',
        companyName: 'MEP Specialists LLC',
        status: 'approved',
        location: {
          city: 'Riyadh',
          region: 'Riyadh Province',
          country: 'Saudi Arabia'
        },
        trade: 'MEP',
        parentVendorId: null, // Will be linked via contracts
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      profile: {
        name: 'Steel Fabrication Co',
        companyName: 'Steel Fabrication Co',
        status: 'approved',
        location: {
          city: 'Jubail',
          region: 'Eastern Province',
          country: 'Saudi Arabia'
        },
        trade: 'Steel Fabrication',
        parentVendorId: null, // Will be linked via contracts
        createdAt: baseDate.toISOString(),
        approvedAt: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        approvedBy: 'system'
      },
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
      title: 'Mega Project - NEOM Package',
      description: 'Comprehensive development package for NEOM including civil works and MEP infrastructure. This mega-project encompasses multiple sub-projects covering foundation, earthworks, structures, and complete MEP systems.',
      category: 'Infrastructure',
      projectType: 'mega',
      status: 'active',
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
      title: 'Residential Tower - King Fahd District',
      description: 'Modern residential tower development in King Fahd District, Riyadh. 30-story tower with luxury apartments, amenities, and parking facilities.',
      category: 'Residential',
      projectType: 'single',
      status: 'active',
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
      title: 'QA/QC Site Inspection Services for MEP Works',
      description: 'Comprehensive quality assurance and quality control services including weekly site inspections, NCR management, and compliance verification for MEP installation.',
      requiredSkills: ['Site Inspection', 'Quality Control', 'NCR Management', 'Testing & Commissioning'],
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
      title: 'Project Planning and Scheduling Support for NEOM Package',
      description: 'Expert project planning and scheduling services including critical path analysis, resource planning, and schedule optimization for the mega-project.',
      requiredSkills: ['Project Scheduling', 'Resource Planning', 'Critical Path Analysis', 'Primavera P6'],
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
  // D) Service Offers
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
    const offer1 = serviceOffers.find(o => o.id === 'so_bim_001');
    const offer2 = serviceOffers.find(o => o.id === 'so_qa_001');

    if (!beneficiaryA || !beneficiaryB || !vendorAlpha || !vendorBeta || !bimProvider || !qaProvider || !consultant || !mepSub || !steelSub || !megaProject || !standaloneProject) {
      console.warn('Required entities not found, skipping contracts');
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
    const serviceContract1 = createContractIfNotExists({
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
    });

    // 3. SERVICE_CONTRACT 2: SubProject B ↔ QA ServiceProvider
    const serviceContract2 = createContractIfNotExists({
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
    });

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

