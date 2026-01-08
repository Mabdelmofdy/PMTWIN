/**
 * PMTwin Scenario Seed Data
 * Comprehensive seed/test data for 5 distinct project scenarios
 * 
 * Scenarios:
 * 1. NEOM Logistics Hub (MegaProject: vendor+2 services+advisory+2 subcontracts)
 * 2. Residential Tower (Standalone: vendor+planning service+finishing subcontract)
 * 3. Hospital Expansion (advisory legal+service cost+optional vendor)
 * 4. Airport Refurbishment (MegaProject: vendor+2 services+advisory+subcontract)
 * 5. Industrial Safety Compliance Program (advisory+2 services, no vendor)
 */

(function() {
  'use strict';

  // ============================================
  // Main Scenario Seed Data Loader
  // ============================================
  function loadScenarioSeedData(forceReload = false) {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return;
    }

    console.log('🌱 Loading Scenario Seed Data for 5 scenarios...');

    // Check if scenario data already exists
    const existingUsers = PMTwinData.Users.getAll();
    const scenarioUserExists = existingUsers.some(u => 
      u.email === 'scenario1.beneficiary@pmtwin.com' || 
      u.email === 'scenario2.beneficiary@pmtwin.com'
    );

    if (scenarioUserExists && !forceReload) {
      console.log('✅ Scenario seed data already exists. Use forceReload=true to regenerate.');
      return;
    }

    // Create data in correct order (dependencies first)
    const seedResults = {
      users: createScenarioUsers(forceReload),
      projects: createScenarioProjects(forceReload),
      serviceRequests: createScenarioServiceRequests(forceReload),
      serviceOffers: createScenarioServiceOffers(forceReload),
      contracts: createScenarioContracts(forceReload),
      engagements: createScenarioEngagements(forceReload),
      milestones: createScenarioMilestones(forceReload)
    };

    console.log('✅ Scenario Seed Data Loaded:', seedResults);
    return seedResults;
  }

  // ============================================
  // A) Users for All 5 Scenarios
  // ============================================
  function createScenarioUsers(forceReload = false) {
    const users = PMTwinData.Users.getAll();
    const created = [];
    const skipped = [];

    function createUserIfNotExists(userData) {
      const exists = users.some(u => u.email === userData.email);
      if (exists && !forceReload) {
        skipped.push(userData.email);
        return null;
      }
      
      if (exists && forceReload) {
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
    const baseDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Scenario 1: NEOM Logistics Hub Users
    const s1_beneficiary = createUserIfNotExists({
      id: 'user_s1_beneficiary',
      email: 'scenario1.beneficiary@pmtwin.com',
      password: btoa('S1Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111111',
      mobileVerified: true,
      profile: {
        name: 'NEOM Logistics Authority',
        companyName: 'NEOM Logistics Authority',
        status: 'approved',
        location: { city: 'NEOM', region: 'Tabuk Province', country: 'Saudi Arabia' },
        commercialRegistration: { number: 'CR-S1-NEOM-001', verified: true },
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_vendor = createUserIfNotExists({
      id: 'user_s1_vendor',
      email: 'scenario1.vendor@pmtwin.com',
      password: btoa('S1Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111112',
      mobileVerified: true,
      profile: {
        name: 'Logistics Builders Co',
        companyName: 'Logistics Builders Co',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        registrationNo: 'CR-S1-VENDOR-001',
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_service1 = createUserIfNotExists({
      id: 'user_s1_service1',
      email: 'scenario1.service1@pmtwin.com',
      password: btoa('S1Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111113',
      mobileVerified: true,
      profile: {
        name: 'Warehouse Design Services',
        companyName: 'Warehouse Design Services',
        status: 'approved',
        location: { city: 'Jeddah', region: 'Makkah Province', country: 'Saudi Arabia' },
        skills: ['Warehouse Design', 'Layout Planning', 'Storage Systems'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_service2 = createUserIfNotExists({
      id: 'user_s1_service2',
      email: 'scenario1.service2@pmtwin.com',
      password: btoa('S1Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111114',
      mobileVerified: true,
      profile: {
        name: 'Transportation Planning Co',
        companyName: 'Transportation Planning Co',
        status: 'approved',
        location: { city: 'Dammam', region: 'Eastern Province', country: 'Saudi Arabia' },
        skills: ['Transportation Planning', 'Traffic Analysis', 'Logistics'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_consultant = createUserIfNotExists({
      id: 'user_s1_consultant',
      email: 'scenario1.consultant@pmtwin.com',
      password: btoa('S1Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111115',
      mobileVerified: true,
      profile: {
        name: 'Logistics Advisory Group',
        companyName: 'Logistics Advisory Group',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Logistics Strategy', 'Supply Chain', 'Operations'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_sub1 = createUserIfNotExists({
      id: 'user_s1_sub1',
      email: 'scenario1.sub1@pmtwin.com',
      password: btoa('S1Sub123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111116',
      mobileVerified: true,
      profile: {
        name: 'Steel Frame Specialists',
        companyName: 'Steel Frame Specialists',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Steel Fabrication', 'Steel Erection'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s1_sub2 = createUserIfNotExists({
      id: 'user_s1_sub2',
      email: 'scenario1.sub2@pmtwin.com',
      password: btoa('S1Sub123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966511111117',
      mobileVerified: true,
      profile: {
        name: 'Roofing Contractors LLC',
        companyName: 'Roofing Contractors LLC',
        status: 'approved',
        location: { city: 'Jeddah', region: 'Makkah Province', country: 'Saudi Arabia' },
        skills: ['Roofing', 'Waterproofing'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Scenario 2: Residential Tower Users
    const s2_beneficiary = createUserIfNotExists({
      id: 'user_s2_beneficiary',
      email: 'scenario2.beneficiary@pmtwin.com',
      password: btoa('S2Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966522222221',
      mobileVerified: true,
      profile: {
        name: 'Residential Developers SA',
        companyName: 'Residential Developers SA',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        commercialRegistration: { number: 'CR-S2-RES-001', verified: true },
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s2_vendor = createUserIfNotExists({
      id: 'user_s2_vendor',
      email: 'scenario2.vendor@pmtwin.com',
      password: btoa('S2Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966522222222',
      mobileVerified: true,
      profile: {
        name: 'Tower Construction Ltd',
        companyName: 'Tower Construction Ltd',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        registrationNo: 'CR-S2-VENDOR-001',
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s2_service = createUserIfNotExists({
      id: 'user_s2_service',
      email: 'scenario2.service@pmtwin.com',
      password: btoa('S2Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966522222223',
      mobileVerified: true,
      profile: {
        name: 'Project Planning Experts',
        companyName: 'Project Planning Experts',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Project Planning', 'Scheduling', 'Primavera P6'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s2_sub = createUserIfNotExists({
      id: 'user_s2_sub',
      email: 'scenario2.sub@pmtwin.com',
      password: btoa('S2Sub123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966522222224',
      mobileVerified: true,
      profile: {
        name: 'Finishing Works Co',
        companyName: 'Finishing Works Co',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Interior Finishing', 'Painting', 'Tiling'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Scenario 3: Hospital Expansion Users
    const s3_beneficiary = createUserIfNotExists({
      id: 'user_s3_beneficiary',
      email: 'scenario3.beneficiary@pmtwin.com',
      password: btoa('S3Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966533333331',
      mobileVerified: true,
      profile: {
        name: 'King Faisal Hospital',
        companyName: 'King Faisal Hospital',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        commercialRegistration: { number: 'CR-S3-HOSP-001', verified: true },
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s3_consultant = createUserIfNotExists({
      id: 'user_s3_consultant',
      email: 'scenario3.consultant@pmtwin.com',
      password: btoa('S3Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966533333332',
      mobileVerified: true,
      profile: {
        name: 'Legal Advisory Services',
        companyName: 'Legal Advisory Services',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Legal Review', 'Contract Law', 'Healthcare Regulations'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s3_service = createUserIfNotExists({
      id: 'user_s3_service',
      email: 'scenario3.service@pmtwin.com',
      password: btoa('S3Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966533333333',
      mobileVerified: true,
      profile: {
        name: 'Cost Estimation Experts',
        companyName: 'Cost Estimation Experts',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Cost Estimation', 'Quantity Surveying', 'Budget Analysis'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s3_vendor = createUserIfNotExists({
      id: 'user_s3_vendor',
      email: 'scenario3.vendor@pmtwin.com',
      password: btoa('S3Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966533333334',
      mobileVerified: true,
      profile: {
        name: 'Healthcare Construction Group',
        companyName: 'Healthcare Construction Group',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        registrationNo: 'CR-S3-VENDOR-001',
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Scenario 4: Airport Refurbishment Users
    const s4_beneficiary = createUserIfNotExists({
      id: 'user_s4_beneficiary',
      email: 'scenario4.beneficiary@pmtwin.com',
      password: btoa('S4Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444441',
      mobileVerified: true,
      profile: {
        name: 'King Khalid International Airport',
        companyName: 'King Khalid International Airport Authority',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        commercialRegistration: { number: 'CR-S4-AIR-001', verified: true },
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s4_vendor = createUserIfNotExists({
      id: 'user_s4_vendor',
      email: 'scenario4.vendor@pmtwin.com',
      password: btoa('S4Vendor123'),
      role: 'vendor',
      userType: 'vendor_corporate',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444442',
      mobileVerified: true,
      profile: {
        name: 'Airport Construction Specialists',
        companyName: 'Airport Construction Specialists',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        registrationNo: 'CR-S4-VENDOR-001',
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s4_service1 = createUserIfNotExists({
      id: 'user_s4_service1',
      email: 'scenario4.service1@pmtwin.com',
      password: btoa('S4Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444443',
      mobileVerified: true,
      profile: {
        name: 'Terminal Design Services',
        companyName: 'Terminal Design Services',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Terminal Design', 'Interior Architecture', 'Space Planning'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s4_service2 = createUserIfNotExists({
      id: 'user_s4_service2',
      email: 'scenario4.service2@pmtwin.com',
      password: btoa('S4Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444444',
      mobileVerified: true,
      profile: {
        name: 'Runway Engineering Co',
        companyName: 'Runway Engineering Co',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Runway Engineering', 'Pavement Design', 'Airfield Construction'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s4_consultant = createUserIfNotExists({
      id: 'user_s4_consultant',
      email: 'scenario4.consultant@pmtwin.com',
      password: btoa('S4Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444445',
      mobileVerified: true,
      profile: {
        name: 'Aviation Infrastructure Consultants',
        companyName: 'Aviation Infrastructure Consultants',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Aviation Planning', 'Infrastructure Advisory', 'Regulatory Compliance'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s4_sub = createUserIfNotExists({
      id: 'user_s4_sub',
      email: 'scenario4.sub@pmtwin.com',
      password: btoa('S4Sub123'),
      role: 'sub_contractor',
      userType: 'sub_contractor',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966544444446',
      mobileVerified: true,
      profile: {
        name: 'HVAC Specialists',
        companyName: 'HVAC Specialists',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['HVAC Installation', 'Air Conditioning', 'Ventilation Systems'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    // Scenario 5: Industrial Safety Compliance Users
    const s5_beneficiary = createUserIfNotExists({
      id: 'user_s5_beneficiary',
      email: 'scenario5.beneficiary@pmtwin.com',
      password: btoa('S5Beneficiary123'),
      role: 'beneficiary',
      userType: 'beneficiary',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966555555551',
      mobileVerified: true,
      profile: {
        name: 'Industrial Safety Authority',
        companyName: 'Industrial Safety Authority',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        commercialRegistration: { number: 'CR-S5-ISA-001', verified: true },
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s5_consultant = createUserIfNotExists({
      id: 'user_s5_consultant',
      email: 'scenario5.consultant@pmtwin.com',
      password: btoa('S5Consultant123'),
      role: 'consultant',
      userType: 'consultant',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966555555552',
      mobileVerified: true,
      profile: {
        name: 'Safety Compliance Advisors',
        companyName: 'Safety Compliance Advisors',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Safety Compliance', 'Risk Assessment', 'Regulatory Advisory'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s5_service1 = createUserIfNotExists({
      id: 'user_s5_service1',
      email: 'scenario5.service1@pmtwin.com',
      password: btoa('S5Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966555555553',
      mobileVerified: true,
      profile: {
        name: 'Safety Audit Services',
        companyName: 'Safety Audit Services',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Safety Auditing', 'Inspection', 'Compliance Verification'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    const s5_service2 = createUserIfNotExists({
      id: 'user_s5_service2',
      email: 'scenario5.service2@pmtwin.com',
      password: btoa('S5Service123'),
      role: 'skill_service_provider',
      userType: 'service_provider',
      onboardingStage: 'approved',
      emailVerified: true,
      mobile: '+966555555554',
      mobileVerified: true,
      profile: {
        name: 'Training & Certification Co',
        companyName: 'Training & Certification Co',
        status: 'approved',
        location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
        skills: ['Safety Training', 'Certification Programs', 'Workplace Safety'],
        createdAt: baseDate.toISOString(),
        approvedAt: baseDate.toISOString()
      },
      createdAt: baseDate.toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      users: {
        s1: { beneficiary: s1_beneficiary, vendor: s1_vendor, service1: s1_service1, service2: s1_service2, consultant: s1_consultant, sub1: s1_sub1, sub2: s1_sub2 },
        s2: { beneficiary: s2_beneficiary, vendor: s2_vendor, service: s2_service, sub: s2_sub },
        s3: { beneficiary: s3_beneficiary, consultant: s3_consultant, service: s3_service, vendor: s3_vendor },
        s4: { beneficiary: s4_beneficiary, vendor: s4_vendor, service1: s4_service1, service2: s4_service2, consultant: s4_consultant, sub: s4_sub },
        s5: { beneficiary: s5_beneficiary, consultant: s5_consultant, service1: s5_service1, service2: s5_service2 }
      }
    };
  }

  // ============================================
  // B) Projects for All 5 Scenarios
  // ============================================
  function createScenarioProjects(forceReload = false) {
    const projects = PMTwinData.Projects.getAll();
    const users = PMTwinData.Users.getAll();
    const created = [];
    const skipped = [];

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
    const startDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Scenario 1: NEOM Logistics Hub (MegaProject)
    const s1_beneficiary = users.find(u => u.email === 'scenario1.beneficiary@pmtwin.com');
    if (!s1_beneficiary) {
      console.warn('Scenario 1 beneficiary not found');
      return { created: 0, skipped: 0 };
    }

    const s1_megaproject = createProjectIfNotExists({
      id: 'megaproject_s1_logistics',
      creatorId: s1_beneficiary.id,
      title: 'NEOM Logistics Hub',
      description: 'Comprehensive logistics hub development including warehouse complexes and transportation infrastructure for NEOM region.',
      category: 'Infrastructure',
      projectType: 'mega',
      status: 'active',
      location: { city: 'NEOM', region: 'Tabuk Province', country: 'Saudi Arabia' },
      scope: {
        coreDescription: 'Mega-project for logistics hub with warehouse and transportation facilities',
        requiredServices: ['General Contracting', 'Warehouse Construction', 'Transportation Infrastructure'],
        skillRequirements: ['Logistics Infrastructure', 'Warehouse Design', 'Transportation Planning'],
        experienceLevel: 'senior',
        minimumExperience: 10
      },
      budget: { min: 600000000, max: 750000000, currency: 'SAR' },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 42,
        milestones: [
          { name: 'Design Phase Complete', date: '2024-10-31' },
          { name: 'Warehouse Foundation Complete', date: '2025-07-31' },
          { name: 'Transportation Hub Complete', date: '2026-06-30' },
          { name: 'Final Handover', date: '2027-04-30' }
        ]
      },
      subProjects: [
        {
          id: 'subproject_s1_warehouse',
          index: 0,
          title: 'Warehouse Complex',
          description: 'Large-scale warehouse facility with storage systems and distribution centers',
          category: 'Warehouse Construction',
          location: { city: 'NEOM', region: 'Tabuk Province', country: 'Saudi Arabia' },
          scope: {
            requiredServices: ['Warehouse Construction', 'Storage Systems'],
            skillRequirements: ['Warehouse Design', 'Storage Systems']
          },
          budget: { min: 350000000, max: 450000000, currency: 'SAR' },
          timeline: {
            start_date: startDate.toISOString().split('T')[0],
            duration: 30,
            milestones: [
              { name: 'Foundation Complete', date: '2025-07-31' },
              { name: 'Structure Complete', date: '2026-03-31' },
              { name: 'Storage Systems Complete', date: '2026-12-31' }
            ]
          },
          status: 'active'
        },
        {
          id: 'subproject_s1_transportation',
          index: 1,
          title: 'Transportation Hub',
          description: 'Transportation hub with loading docks, truck terminals, and logistics facilities',
          category: 'Transportation Infrastructure',
          location: { city: 'NEOM', region: 'Tabuk Province', country: 'Saudi Arabia' },
          scope: {
            requiredServices: ['Transportation Infrastructure', 'Road Construction'],
            skillRequirements: ['Transportation Planning', 'Road Engineering']
          },
          budget: { min: 250000000, max: 300000000, currency: 'SAR' },
          timeline: {
            start_date: new Date(startDate.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 24,
            milestones: [
              { name: 'Design Complete', date: '2025-09-30' },
              { name: 'Roads Complete', date: '2026-06-30' },
              { name: 'Terminals Complete', date: '2026-12-31' }
            ]
          },
          status: 'active'
        }
      ],
      createdAt: new Date().toISOString()
    });

    // Scenario 2: Residential Tower (Standalone Project)
    const s2_beneficiary = users.find(u => u.email === 'scenario2.beneficiary@pmtwin.com');
    if (!s2_beneficiary) {
      console.warn('Scenario 2 beneficiary not found');
      return { created: 0, skipped: 0 };
    }

    const s2_project = createProjectIfNotExists({
      id: 'project_s2_residential',
      creatorId: s2_beneficiary.id,
      title: 'Residential Tower - Downtown',
      description: 'Modern 25-story residential tower with luxury apartments and amenities in downtown area.',
      category: 'Residential',
      projectType: 'single',
      status: 'active',
      location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
      scope: {
        coreDescription: 'Complete design and construction of 25-story residential tower',
        requiredServices: ['General Contracting', 'Residential Construction', 'Finishing Works'],
        skillRequirements: ['High-Rise Construction', 'Residential Development'],
        experienceLevel: 'senior',
        minimumExperience: 8
      },
      budget: { min: 180000000, max: 220000000, currency: 'SAR' },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 36,
        milestones: [
          { name: 'Design Complete', date: '2024-09-30' },
          { name: 'Foundation Complete', date: '2025-04-30' },
          { name: 'Structure Complete', date: '2026-03-31' },
          { name: 'Finishing Complete', date: '2026-12-31' },
          { name: 'Final Handover', date: '2027-03-31' }
        ]
      },
      createdAt: new Date().toISOString()
    });

    // Scenario 3: Hospital Expansion (Project)
    const s3_beneficiary = users.find(u => u.email === 'scenario3.beneficiary@pmtwin.com');
    if (!s3_beneficiary) {
      console.warn('Scenario 3 beneficiary not found');
      return { created: 0, skipped: 0 };
    }

    const s3_project = createProjectIfNotExists({
      id: 'project_s3_hospital',
      creatorId: s3_beneficiary.id,
      title: 'Hospital Expansion - New Wing',
      description: 'Expansion of existing hospital with new wing including additional patient rooms, operating theaters, and support facilities.',
      category: 'Healthcare',
      projectType: 'single',
      status: 'active',
      location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
      scope: {
        coreDescription: 'Hospital expansion project with new wing construction',
        requiredServices: ['Healthcare Construction', 'Medical Facilities', 'Legal Review'],
        skillRequirements: ['Healthcare Construction', 'Medical Facilities Planning'],
        experienceLevel: 'senior',
        minimumExperience: 10
      },
      budget: { min: 250000000, max: 300000000, currency: 'SAR' },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 30,
        milestones: [
          { name: 'Legal Review Complete', date: '2024-09-30' },
          { name: 'Cost Estimation Complete', date: '2024-10-31' },
          { name: 'Design Complete', date: '2025-02-28' },
          { name: 'Construction Complete', date: '2026-08-31' },
          { name: 'Final Handover', date: '2026-12-31' }
        ]
      },
      createdAt: new Date().toISOString()
    });

    // Scenario 4: Airport Refurbishment (MegaProject)
    const s4_beneficiary = users.find(u => u.email === 'scenario4.beneficiary@pmtwin.com');
    if (!s4_beneficiary) {
      console.warn('Scenario 4 beneficiary not found');
      return { created: 0, skipped: 0 };
    }

    const s4_megaproject = createProjectIfNotExists({
      id: 'megaproject_s4_airport',
      creatorId: s4_beneficiary.id,
      title: 'Airport Refurbishment - Terminal & Runway',
      description: 'Comprehensive airport refurbishment including terminal renovation and runway upgrade for enhanced capacity and modern facilities.',
      category: 'Infrastructure',
      projectType: 'mega',
      status: 'active',
      location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
      scope: {
        coreDescription: 'Airport refurbishment mega-project with terminal and runway components',
        requiredServices: ['Terminal Renovation', 'Runway Engineering', 'Aviation Infrastructure'],
        skillRequirements: ['Aviation Infrastructure', 'Terminal Design', 'Runway Engineering'],
        experienceLevel: 'senior',
        minimumExperience: 12
      },
      budget: { min: 800000000, max: 1000000000, currency: 'SAR' },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 48,
        milestones: [
          { name: 'Design Phase Complete', date: '2024-12-31' },
          { name: 'Terminal Renovation 50%', date: '2026-03-31' },
          { name: 'Runway Upgrade Complete', date: '2026-12-31' },
          { name: 'Terminal Complete', date: '2027-09-30' },
          { name: 'Final Handover', date: '2028-01-31' }
        ]
      },
      subProjects: [
        {
          id: 'subproject_s4_terminal',
          index: 0,
          title: 'Terminal Renovation',
          description: 'Complete renovation of airport terminal with modern facilities and improved passenger flow',
          category: 'Terminal Renovation',
          location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
          scope: {
            requiredServices: ['Terminal Design', 'Interior Architecture', 'HVAC Systems'],
            skillRequirements: ['Terminal Design', 'Interior Architecture']
          },
          budget: { min: 500000000, max: 650000000, currency: 'SAR' },
          timeline: {
            start_date: startDate.toISOString().split('T')[0],
            duration: 36,
            milestones: [
              { name: 'Design Complete', date: '2024-12-31' },
              { name: 'Renovation 50%', date: '2026-03-31' },
              { name: 'Renovation Complete', date: '2027-09-30' }
            ]
          },
          status: 'active'
        },
        {
          id: 'subproject_s4_runway',
          index: 1,
          title: 'Runway Upgrade',
          description: 'Runway upgrade and extension to accommodate larger aircraft and increased traffic',
          category: 'Runway Engineering',
          location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
          scope: {
            requiredServices: ['Runway Engineering', 'Pavement Design', 'Airfield Construction'],
            skillRequirements: ['Runway Engineering', 'Pavement Design']
          },
          budget: { min: 300000000, max: 350000000, currency: 'SAR' },
          timeline: {
            start_date: new Date(startDate.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            duration: 24,
            milestones: [
              { name: 'Design Complete', date: '2025-12-31' },
              { name: 'Construction 50%', date: '2026-06-30' },
              { name: 'Runway Complete', date: '2026-12-31' }
            ]
          },
          status: 'active'
        }
      ],
      createdAt: new Date().toISOString()
    });

    // Scenario 5: Industrial Safety Compliance Program (Project - no vendor)
    const s5_beneficiary = users.find(u => u.email === 'scenario5.beneficiary@pmtwin.com');
    if (!s5_beneficiary) {
      console.warn('Scenario 5 beneficiary not found');
      return { created: 0, skipped: 0 };
    }

    const s5_project = createProjectIfNotExists({
      id: 'project_s5_safety',
      creatorId: s5_beneficiary.id,
      title: 'Industrial Safety Compliance Program',
      description: 'Comprehensive safety compliance program including advisory services, safety audits, and training programs for industrial facilities.',
      category: 'Compliance',
      projectType: 'single',
      status: 'active',
      location: { city: 'Riyadh', region: 'Riyadh Province', country: 'Saudi Arabia' },
      scope: {
        coreDescription: 'Safety compliance program with advisory, audit, and training services',
        requiredServices: ['Safety Advisory', 'Safety Auditing', 'Training & Certification'],
        skillRequirements: ['Safety Compliance', 'Risk Assessment', 'Safety Training'],
        experienceLevel: 'senior',
        minimumExperience: 8
      },
      budget: { min: 5000000, max: 8000000, currency: 'SAR' },
      timeline: {
        start_date: startDate.toISOString().split('T')[0],
        duration: 18,
        milestones: [
          { name: 'Advisory Plan Complete', date: '2024-10-31' },
          { name: 'Safety Audits Complete', date: '2025-06-30' },
          { name: 'Training Programs Complete', date: '2025-12-31' },
          { name: 'Final Report', date: '2026-03-31' }
        ]
      },
      createdAt: new Date().toISOString()
    });

    return {
      created: created.length,
      skipped: skipped.length,
      projects: {
        s1: s1_megaproject,
        s2: s2_project,
        s3: s3_project,
        s4: s4_megaproject,
        s5: s5_project
      }
    };
  }

  // Continue with Service Requests, Service Offers, Contracts, Engagements, and Milestones...
  // Due to length, I'll create these in separate function calls

  // ============================================
  // C) Service Requests
  // ============================================
  function createScenarioServiceRequests(forceReload = false) {
    const requests = PMTwinData.ServiceRequests.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();
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
    const s1_beneficiary = users.find(u => u.email === 'scenario1.beneficiary@pmtwin.com');
    const s1_vendor = users.find(u => u.email === 'scenario1.vendor@pmtwin.com');
    const s1_megaproject = projects.find(p => p.id === 'megaproject_s1_logistics');
    const s2_beneficiary = users.find(u => u.email === 'scenario2.beneficiary@pmtwin.com');
    const s2_project = projects.find(p => p.id === 'project_s2_residential');
    const s3_beneficiary = users.find(u => u.email === 'scenario3.beneficiary@pmtwin.com');
    const s3_project = projects.find(p => p.id === 'project_s3_hospital');
    const s4_beneficiary = users.find(u => u.email === 'scenario4.beneficiary@pmtwin.com');
    const s4_megaproject = projects.find(p => p.id === 'megaproject_s4_airport');
    const s5_beneficiary = users.find(u => u.email === 'scenario5.beneficiary@pmtwin.com');
    const s5_project = projects.find(p => p.id === 'project_s5_safety');

    if (!s1_beneficiary || !s1_vendor || !s1_megaproject) {
      console.warn('Required entities not found for scenario 1');
    }

    // Scenario 1 Service Requests
    const s1_sr1 = s1_beneficiary && s1_megaproject ? createRequestIfNotExists({
      id: 'sr_s1_warehouse_design',
      requesterType: 'ENTITY',
      requesterId: s1_beneficiary.id,
      title: 'Warehouse Design Services for Logistics Hub',
      description: 'Comprehensive warehouse design services including layout planning and storage systems design.',
      requiredSkills: ['Warehouse Design', 'Layout Planning', 'Storage Systems'],
      status: 'APPROVED',
      budget: { min: 200000, max: 300000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 6,
        requiredBy: new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_s1_warehouse',
        projectId: s1_megaproject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_sr2 = s1_beneficiary && s1_megaproject ? createRequestIfNotExists({
      id: 'sr_s1_transportation_planning',
      requesterType: 'ENTITY',
      requesterId: s1_beneficiary.id,
      title: 'Transportation Planning Services for Hub',
      description: 'Transportation planning and traffic analysis services for the logistics hub.',
      requiredSkills: ['Transportation Planning', 'Traffic Analysis', 'Logistics'],
      status: 'APPROVED',
      budget: { min: 150000, max: 250000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 8,
        requiredBy: new Date(now.getTime() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_s1_transportation',
        projectId: s1_megaproject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 2 Service Request
    const s2_sr1 = s2_beneficiary && s2_project ? createRequestIfNotExists({
      id: 'sr_s2_planning',
      requesterType: 'ENTITY',
      requesterId: s2_beneficiary.id,
      title: 'Project Planning Services for Residential Tower',
      description: 'Project planning and scheduling services for the residential tower project.',
      requiredSkills: ['Project Planning', 'Scheduling', 'Primavera P6'],
      status: 'APPROVED',
      budget: { min: 120000, max: 180000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 9,
        requiredBy: new Date(now.getTime() + 9 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'PROJECT',
        scopeId: s2_project.id,
        projectId: s2_project.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 3 Service Request
    const s3_sr1 = s3_beneficiary && s3_project ? createRequestIfNotExists({
      id: 'sr_s3_cost_estimation',
      requesterType: 'ENTITY',
      requesterId: s3_beneficiary.id,
      title: 'Cost Estimation Services for Hospital Expansion',
      description: 'Comprehensive cost estimation and quantity surveying services for the hospital expansion project.',
      requiredSkills: ['Cost Estimation', 'Quantity Surveying', 'Budget Analysis'],
      status: 'APPROVED',
      budget: { min: 180000, max: 250000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 4,
        requiredBy: new Date(now.getTime() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'PROJECT',
        scopeId: s3_project.id,
        projectId: s3_project.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 4 Service Requests
    const s4_sr1 = s4_beneficiary && s4_megaproject ? createRequestIfNotExists({
      id: 'sr_s4_terminal_design',
      requesterType: 'ENTITY',
      requesterId: s4_beneficiary.id,
      title: 'Terminal Design Services for Airport Refurbishment',
      description: 'Terminal design and interior architecture services for airport terminal renovation.',
      requiredSkills: ['Terminal Design', 'Interior Architecture', 'Space Planning'],
      status: 'APPROVED',
      budget: { min: 350000, max: 450000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 12,
        requiredBy: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_s4_terminal',
        projectId: s4_megaproject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_sr2 = s4_beneficiary && s4_megaproject ? createRequestIfNotExists({
      id: 'sr_s4_runway_engineering',
      requesterType: 'ENTITY',
      requesterId: s4_beneficiary.id,
      title: 'Runway Engineering Services',
      description: 'Runway engineering and pavement design services for runway upgrade.',
      requiredSkills: ['Runway Engineering', 'Pavement Design', 'Airfield Construction'],
      status: 'APPROVED',
      budget: { min: 280000, max: 350000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 10,
        requiredBy: new Date(now.getTime() + 22 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'SUB_PROJECT',
        scopeId: 'subproject_s4_runway',
        projectId: s4_megaproject.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 5 Service Requests
    const s5_sr1 = s5_beneficiary && s5_project ? createRequestIfNotExists({
      id: 'sr_s5_safety_audit',
      requesterType: 'ENTITY',
      requesterId: s5_beneficiary.id,
      title: 'Safety Audit Services for Compliance Program',
      description: 'Comprehensive safety auditing and inspection services for industrial facilities.',
      requiredSkills: ['Safety Auditing', 'Inspection', 'Compliance Verification'],
      status: 'APPROVED',
      budget: { min: 250000, max: 350000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 8,
        requiredBy: new Date(now.getTime() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'PROJECT',
        scopeId: s5_project.id,
        projectId: s5_project.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s5_sr2 = s5_beneficiary && s5_project ? createRequestIfNotExists({
      id: 'sr_s5_training',
      requesterType: 'ENTITY',
      requesterId: s5_beneficiary.id,
      title: 'Training & Certification Services',
      description: 'Safety training and certification programs for industrial workers.',
      requiredSkills: ['Safety Training', 'Certification Programs', 'Workplace Safety'],
      status: 'APPROVED',
      budget: { min: 200000, max: 300000, currency: 'SAR' },
      timeline: {
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        duration: 12,
        requiredBy: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      scope: {
        scopeType: 'PROJECT',
        scopeId: s5_project.id,
        projectId: s5_project.id
      },
      bids: [],
      createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    return {
      created: created.length,
      skipped: skipped.length,
      requests: {
        s1: { sr1: s1_sr1, sr2: s1_sr2 },
        s2: { sr1: s2_sr1 },
        s3: { sr1: s3_sr1 },
        s4: { sr1: s4_sr1, sr2: s4_sr2 },
        s5: { sr1: s5_sr1, sr2: s5_sr2 }
      }
    };
  }

  // ============================================
  // D) Service Offers
  // ============================================
  function createScenarioServiceOffers(forceReload = false) {
    const offers = PMTwinData.ServiceOffers.getAll();
    const users = PMTwinData.Users.getAll();
    const requests = PMTwinData.ServiceRequests.getAll();
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
    const s1_service1 = users.find(u => u.email === 'scenario1.service1@pmtwin.com');
    const s1_service2 = users.find(u => u.email === 'scenario1.service2@pmtwin.com');
    const s2_service = users.find(u => u.email === 'scenario2.service@pmtwin.com');
    const s3_service = users.find(u => u.email === 'scenario3.service@pmtwin.com');
    const s4_service1 = users.find(u => u.email === 'scenario4.service1@pmtwin.com');
    const s4_service2 = users.find(u => u.email === 'scenario4.service2@pmtwin.com');
    const s5_service1 = users.find(u => u.email === 'scenario5.service1@pmtwin.com');
    const s5_service2 = users.find(u => u.email === 'scenario5.service2@pmtwin.com');

    const s1_sr1 = requests.find(r => r.id === 'sr_s1_warehouse_design');
    const s1_sr2 = requests.find(r => r.id === 'sr_s1_transportation_planning');
    const s2_sr1 = requests.find(r => r.id === 'sr_s2_planning');
    const s3_sr1 = requests.find(r => r.id === 'sr_s3_cost_estimation');
    const s4_sr1 = requests.find(r => r.id === 'sr_s4_terminal_design');
    const s4_sr2 = requests.find(r => r.id === 'sr_s4_runway_engineering');
    const s5_sr1 = requests.find(r => r.id === 'sr_s5_safety_audit');
    const s5_sr2 = requests.find(r => r.id === 'sr_s5_training');

    // Scenario 1 Offers
    const s1_offer1 = s1_service1 && s1_sr1 ? createOfferIfNotExists({
      id: 'so_s1_warehouse',
      serviceRequestId: s1_sr1.id,
      serviceProviderUserId: s1_service1.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 250000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s1_sr1.timeline.startDate, duration: 6, deliveryDate: s1_sr1.timeline.requiredBy },
      message: 'We specialize in warehouse design and layout planning for large-scale logistics facilities.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_offer2 = s1_service2 && s1_sr2 ? createOfferIfNotExists({
      id: 'so_s1_transportation',
      serviceRequestId: s1_sr2.id,
      serviceProviderUserId: s1_service2.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 200000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s1_sr2.timeline.startDate, duration: 8, deliveryDate: s1_sr2.timeline.requiredBy },
      message: 'Expert transportation planning and traffic analysis services for logistics hubs.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 2 Offer
    const s2_offer1 = s2_service && s2_sr1 ? createOfferIfNotExists({
      id: 'so_s2_planning',
      serviceRequestId: s2_sr1.id,
      serviceProviderUserId: s2_service.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 150000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s2_sr1.timeline.startDate, duration: 9, deliveryDate: s2_sr1.timeline.requiredBy },
      message: 'Professional project planning and scheduling services using Primavera P6.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 3 Offer
    const s3_offer1 = s3_service && s3_sr1 ? createOfferIfNotExists({
      id: 'so_s3_cost',
      serviceRequestId: s3_sr1.id,
      serviceProviderUserId: s3_service.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 220000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s3_sr1.timeline.startDate, duration: 4, deliveryDate: s3_sr1.timeline.requiredBy },
      message: 'Comprehensive cost estimation and quantity surveying services for healthcare projects.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 4 Offers
    const s4_offer1 = s4_service1 && s4_sr1 ? createOfferIfNotExists({
      id: 'so_s4_terminal',
      serviceRequestId: s4_sr1.id,
      serviceProviderUserId: s4_service1.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 400000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s4_sr1.timeline.startDate, duration: 12, deliveryDate: s4_sr1.timeline.requiredBy },
      message: 'Specialized terminal design and interior architecture for airport facilities.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_offer2 = s4_service2 && s4_sr2 ? createOfferIfNotExists({
      id: 'so_s4_runway',
      serviceRequestId: s4_sr2.id,
      serviceProviderUserId: s4_service2.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 320000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s4_sr2.timeline.startDate, duration: 10, deliveryDate: s4_sr2.timeline.requiredBy },
      message: 'Expert runway engineering and pavement design services for airport infrastructure.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 5 Offers
    const s5_offer1 = s5_service1 && s5_sr1 ? createOfferIfNotExists({
      id: 'so_s5_audit',
      serviceRequestId: s5_sr1.id,
      serviceProviderUserId: s5_service1.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 300000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s5_sr1.timeline.startDate, duration: 8, deliveryDate: s5_sr1.timeline.requiredBy },
      message: 'Comprehensive safety auditing and compliance verification services.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s5_offer2 = s5_service2 && s5_sr2 ? createOfferIfNotExists({
      id: 'so_s5_training',
      serviceRequestId: s5_sr2.id,
      serviceProviderUserId: s5_service2.id,
      status: 'ACCEPTED',
      proposedPricing: { amount: 250000, currency: 'SAR', paymentTerms: 'milestone_based' },
      proposedTimeline: { startDate: s5_sr2.timeline.startDate, duration: 12, deliveryDate: s5_sr2.timeline.requiredBy },
      message: 'Professional safety training and certification programs for industrial workers.',
      submittedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      acceptedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    return {
      created: created.length,
      skipped: skipped.length,
      offers: {
        s1: { offer1: s1_offer1, offer2: s1_offer2 },
        s2: { offer1: s2_offer1 },
        s3: { offer1: s3_offer1 },
        s4: { offer1: s4_offer1, offer2: s4_offer2 },
        s5: { offer1: s5_offer1, offer2: s5_offer2 }
      }
    };
  }

  // ============================================
  // E) Contracts
  // ============================================
  function createScenarioContracts(forceReload = false) {
    const contracts = PMTwinData.Contracts.getAll();
    const users = PMTwinData.Users.getAll();
    const projects = PMTwinData.Projects.getAll();
    const serviceOffers = PMTwinData.ServiceOffers.getAll();
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

    // Get all users and entities
    const s1_beneficiary = users.find(u => u.email === 'scenario1.beneficiary@pmtwin.com');
    const s1_vendor = users.find(u => u.email === 'scenario1.vendor@pmtwin.com');
    const s1_service1 = users.find(u => u.email === 'scenario1.service1@pmtwin.com');
    const s1_service2 = users.find(u => u.email === 'scenario1.service2@pmtwin.com');
    const s1_consultant = users.find(u => u.email === 'scenario1.consultant@pmtwin.com');
    const s1_sub1 = users.find(u => u.email === 'scenario1.sub1@pmtwin.com');
    const s1_sub2 = users.find(u => u.email === 'scenario1.sub2@pmtwin.com');

    const s2_beneficiary = users.find(u => u.email === 'scenario2.beneficiary@pmtwin.com');
    const s2_vendor = users.find(u => u.email === 'scenario2.vendor@pmtwin.com');
    const s2_service = users.find(u => u.email === 'scenario2.service@pmtwin.com');
    const s2_sub = users.find(u => u.email === 'scenario2.sub@pmtwin.com');

    const s3_beneficiary = users.find(u => u.email === 'scenario3.beneficiary@pmtwin.com');
    const s3_consultant = users.find(u => u.email === 'scenario3.consultant@pmtwin.com');
    const s3_service = users.find(u => u.email === 'scenario3.service@pmtwin.com');
    const s3_vendor = users.find(u => u.email === 'scenario3.vendor@pmtwin.com');

    const s4_beneficiary = users.find(u => u.email === 'scenario4.beneficiary@pmtwin.com');
    const s4_vendor = users.find(u => u.email === 'scenario4.vendor@pmtwin.com');
    const s4_service1 = users.find(u => u.email === 'scenario4.service1@pmtwin.com');
    const s4_service2 = users.find(u => u.email === 'scenario4.service2@pmtwin.com');
    const s4_consultant = users.find(u => u.email === 'scenario4.consultant@pmtwin.com');
    const s4_sub = users.find(u => u.email === 'scenario4.sub@pmtwin.com');

    const s5_beneficiary = users.find(u => u.email === 'scenario5.beneficiary@pmtwin.com');
    const s5_consultant = users.find(u => u.email === 'scenario5.consultant@pmtwin.com');
    const s5_service1 = users.find(u => u.email === 'scenario5.service1@pmtwin.com');
    const s5_service2 = users.find(u => u.email === 'scenario5.service2@pmtwin.com');

    const s1_megaproject = projects.find(p => p.id === 'megaproject_s1_logistics');
    const s2_project = projects.find(p => p.id === 'project_s2_residential');
    const s3_project = projects.find(p => p.id === 'project_s3_hospital');
    const s4_megaproject = projects.find(p => p.id === 'megaproject_s4_airport');
    const s5_project = projects.find(p => p.id === 'project_s5_safety');

    const s1_offer1 = serviceOffers.find(o => o.id === 'so_s1_warehouse');
    const s1_offer2 = serviceOffers.find(o => o.id === 'so_s1_transportation');
    const s2_offer1 = serviceOffers.find(o => o.id === 'so_s2_planning');
    const s3_offer1 = serviceOffers.find(o => o.id === 'so_s3_cost');
    const s4_offer1 = serviceOffers.find(o => o.id === 'so_s4_terminal');
    const s4_offer2 = serviceOffers.find(o => o.id === 'so_s4_runway');
    const s5_offer1 = serviceOffers.find(o => o.id === 'so_s5_audit');
    const s5_offer2 = serviceOffers.find(o => o.id === 'so_s5_training');

    // SCENARIO 1 CONTRACTS: MegaProject with vendor+2 services+advisory+2 subcontracts
    const s1_vendorContract = s1_beneficiary && s1_vendor && s1_megaproject ? createContractIfNotExists({
      id: 'contract_s1_vendor',
      contractType: 'MEGA_PROJECT_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s1_megaproject.id,
      buyerPartyId: s1_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s1_vendor.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 42 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_beneficiary.id,
      termsJSON: {
        pricing: { amount: 650000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete Warehouse Complex', 'Complete Transportation Hub'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_beneficiary.id
    }) : null;

    const s1_serviceContract1 = s1_beneficiary && s1_service1 && s1_offer1 ? createContractIfNotExists({
      id: 'contract_s1_service1',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s1_offer1.serviceRequestId,
      buyerPartyId: s1_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s1_service1.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_beneficiary.id,
      sourceServiceOfferId: s1_offer1.id,
      termsJSON: {
        pricing: { amount: 250000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Warehouse Design', 'Layout Plans', 'Storage Systems Design'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_beneficiary.id
    }) : null;

    const s1_serviceContract2 = s1_beneficiary && s1_service2 && s1_offer2 ? createContractIfNotExists({
      id: 'contract_s1_service2',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s1_offer2.serviceRequestId,
      buyerPartyId: s1_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s1_service2.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_beneficiary.id,
      sourceServiceOfferId: s1_offer2.id,
      termsJSON: {
        pricing: { amount: 200000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Transportation Plan', 'Traffic Analysis Report', 'Logistics Design'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_beneficiary.id
    }) : null;

    const s1_advisoryContract = s1_beneficiary && s1_consultant && s1_megaproject ? createContractIfNotExists({
      id: 'contract_s1_advisory',
      contractType: 'ADVISORY_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s1_megaproject.id,
      buyerPartyId: s1_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s1_consultant.id,
      providerPartyType: 'CONSULTANT',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 42 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_beneficiary.id,
      termsJSON: {
        pricing: { amount: 400000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Logistics Strategy Report', 'Operations Plan', 'Compliance Review'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_beneficiary.id
    }) : null;

    const s1_subContract1 = s1_vendor && s1_sub1 && s1_vendorContract ? createContractIfNotExists({
      id: 'contract_s1_sub1',
      contractType: 'SUB_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s1_megaproject.id,
      buyerPartyId: s1_vendor.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: s1_sub1.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: s1_vendorContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_vendor.id,
      termsJSON: {
        pricing: { amount: 35000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Steel Fabrication', 'Steel Erection'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_vendor.id
    }) : null;

    const s1_subContract2 = s1_vendor && s1_sub2 && s1_vendorContract ? createContractIfNotExists({
      id: 'contract_s1_sub2',
      contractType: 'SUB_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s1_megaproject.id,
      buyerPartyId: s1_vendor.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: s1_sub2.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: s1_vendorContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s1_vendor.id,
      termsJSON: {
        pricing: { amount: 25000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Roofing Installation', 'Waterproofing'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s1_vendor.id
    }) : null;

    // SCENARIO 2 CONTRACTS: Standalone Project with vendor+planning service+finishing subcontract
    const s2_vendorContract = s2_beneficiary && s2_vendor && s2_project ? createContractIfNotExists({
      id: 'contract_s2_vendor',
      contractType: 'PROJECT_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: s2_project.id,
      buyerPartyId: s2_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s2_vendor.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s2_beneficiary.id,
      termsJSON: {
        pricing: { amount: 200000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete Residential Tower'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s2_beneficiary.id
    }) : null;

    const s2_serviceContract = s2_beneficiary && s2_service && s2_offer1 ? createContractIfNotExists({
      id: 'contract_s2_service',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s2_offer1.serviceRequestId,
      buyerPartyId: s2_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s2_service.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 9 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s2_beneficiary.id,
      sourceServiceOfferId: s2_offer1.id,
      termsJSON: {
        pricing: { amount: 150000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Project Schedule', 'Resource Plan', 'Critical Path Analysis'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s2_beneficiary.id
    }) : null;

    const s2_subContract = s2_vendor && s2_sub && s2_vendorContract ? createContractIfNotExists({
      id: 'contract_s2_sub',
      contractType: 'SUB_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: s2_project.id,
      buyerPartyId: s2_vendor.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: s2_sub.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: s2_vendorContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 36 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s2_vendor.id,
      termsJSON: {
        pricing: { amount: 28000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Interior Finishing', 'Painting', 'Tiling'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s2_vendor.id
    }) : null;

    // SCENARIO 3 CONTRACTS: Hospital Expansion with advisory legal+service cost+optional vendor
    const s3_advisoryContract = s3_beneficiary && s3_consultant && s3_project ? createContractIfNotExists({
      id: 'contract_s3_advisory',
      contractType: 'ADVISORY_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: s3_project.id,
      buyerPartyId: s3_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s3_consultant.id,
      providerPartyType: 'CONSULTANT',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s3_beneficiary.id,
      termsJSON: {
        pricing: { amount: 350000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Legal Review Report', 'Contract Analysis', 'Regulatory Compliance'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s3_beneficiary.id
    }) : null;

    const s3_serviceContract = s3_beneficiary && s3_service && s3_offer1 ? createContractIfNotExists({
      id: 'contract_s3_service',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s3_offer1.serviceRequestId,
      buyerPartyId: s3_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s3_service.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 4 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s3_beneficiary.id,
      sourceServiceOfferId: s3_offer1.id,
      termsJSON: {
        pricing: { amount: 220000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Cost Estimation Report', 'Quantity Survey', 'Budget Analysis'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s3_beneficiary.id
    }) : null;

    const s3_vendorContract = s3_beneficiary && s3_vendor && s3_project ? createContractIfNotExists({
      id: 'contract_s3_vendor',
      contractType: 'PROJECT_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: s3_project.id,
      buyerPartyId: s3_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s3_vendor.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 30 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s3_beneficiary.id,
      termsJSON: {
        pricing: { amount: 275000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Complete Hospital Wing'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s3_beneficiary.id
    }) : null;

    // SCENARIO 4 CONTRACTS: Airport Refurbishment MegaProject with vendor+2 services+advisory+subcontract
    const s4_vendorContract = s4_beneficiary && s4_vendor && s4_megaproject ? createContractIfNotExists({
      id: 'contract_s4_vendor',
      contractType: 'MEGA_PROJECT_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s4_megaproject.id,
      buyerPartyId: s4_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s4_vendor.id,
      providerPartyType: 'VENDOR_CORPORATE',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 48 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s4_beneficiary.id,
      termsJSON: {
        pricing: { amount: 900000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Terminal Renovation', 'Runway Upgrade'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s4_beneficiary.id
    }) : null;

    const s4_serviceContract1 = s4_beneficiary && s4_service1 && s4_offer1 ? createContractIfNotExists({
      id: 'contract_s4_service1',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s4_offer1.serviceRequestId,
      buyerPartyId: s4_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s4_service1.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s4_beneficiary.id,
      sourceServiceOfferId: s4_offer1.id,
      termsJSON: {
        pricing: { amount: 400000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Terminal Design', 'Interior Architecture Plans', 'Space Planning'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s4_beneficiary.id
    }) : null;

    const s4_serviceContract2 = s4_beneficiary && s4_service2 && s4_offer2 ? createContractIfNotExists({
      id: 'contract_s4_service2',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s4_offer2.serviceRequestId,
      buyerPartyId: s4_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s4_service2.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 22 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s4_beneficiary.id,
      sourceServiceOfferId: s4_offer2.id,
      termsJSON: {
        pricing: { amount: 320000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Runway Engineering Design', 'Pavement Design', 'Construction Plans'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s4_beneficiary.id
    }) : null;

    const s4_advisoryContract = s4_beneficiary && s4_consultant && s4_megaproject ? createContractIfNotExists({
      id: 'contract_s4_advisory',
      contractType: 'ADVISORY_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s4_megaproject.id,
      buyerPartyId: s4_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s4_consultant.id,
      providerPartyType: 'CONSULTANT',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 48 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s4_beneficiary.id,
      termsJSON: {
        pricing: { amount: 500000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Aviation Planning Report', 'Infrastructure Advisory', 'Regulatory Compliance'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s4_beneficiary.id
    }) : null;

    const s4_subContract = s4_vendor && s4_sub && s4_vendorContract ? createContractIfNotExists({
      id: 'contract_s4_sub',
      contractType: 'SUB_CONTRACT',
      scopeType: 'MEGA_PROJECT',
      scopeId: s4_megaproject.id,
      buyerPartyId: s4_vendor.id,
      buyerPartyType: 'VENDOR_CORPORATE',
      providerPartyId: s4_sub.id,
      providerPartyType: 'SUB_CONTRACTOR',
      parentContractId: s4_vendorContract.id,
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 24 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s4_vendor.id,
      termsJSON: {
        pricing: { amount: 45000000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['HVAC Installation', 'Air Conditioning Systems', 'Ventilation'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s4_vendor.id
    }) : null;

    // SCENARIO 5 CONTRACTS: Industrial Safety Compliance with advisory+2 services, NO vendor
    const s5_advisoryContract = s5_beneficiary && s5_consultant && s5_project ? createContractIfNotExists({
      id: 'contract_s5_advisory',
      contractType: 'ADVISORY_CONTRACT',
      scopeType: 'PROJECT',
      scopeId: s5_project.id,
      buyerPartyId: s5_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s5_consultant.id,
      providerPartyType: 'CONSULTANT',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 18 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s5_beneficiary.id,
      termsJSON: {
        pricing: { amount: 1200000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Safety Compliance Plan', 'Risk Assessment Report', 'Regulatory Advisory'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s5_beneficiary.id
    }) : null;

    const s5_serviceContract1 = s5_beneficiary && s5_service1 && s5_offer1 ? createContractIfNotExists({
      id: 'contract_s5_service1',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s5_offer1.serviceRequestId,
      buyerPartyId: s5_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s5_service1.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 8 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s5_beneficiary.id,
      sourceServiceOfferId: s5_offer1.id,
      termsJSON: {
        pricing: { amount: 300000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Safety Audit Reports', 'Inspection Reports', 'Compliance Verification'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s5_beneficiary.id
    }) : null;

    const s5_serviceContract2 = s5_beneficiary && s5_service2 && s5_offer2 ? createContractIfNotExists({
      id: 'contract_s5_service2',
      contractType: 'SERVICE_CONTRACT',
      scopeType: 'SERVICE_REQUEST',
      scopeId: s5_offer2.serviceRequestId,
      buyerPartyId: s5_beneficiary.id,
      buyerPartyType: 'BENEFICIARY',
      providerPartyId: s5_service2.id,
      providerPartyType: 'SERVICE_PROVIDER',
      status: 'SIGNED',
      startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: new Date(now.getTime() + 12 * 30 * 24 * 60 * 60 * 1000).toISOString(),
      signedAt: signedDate.toISOString(),
      signedBy: s5_beneficiary.id,
      sourceServiceOfferId: s5_offer2.id,
      termsJSON: {
        pricing: { amount: 250000, currency: 'SAR' },
        paymentTerms: 'milestone_based',
        deliverables: ['Training Programs', 'Certification Documents', 'Workplace Safety Manuals'],
        milestones: []
      },
      createdAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      createdBy: s5_beneficiary.id
    }) : null;

    return {
      created: created.length,
      skipped: skipped.length,
      contracts: {
        s1: { vendor: s1_vendorContract, service1: s1_serviceContract1, service2: s1_serviceContract2, advisory: s1_advisoryContract, sub1: s1_subContract1, sub2: s1_subContract2 },
        s2: { vendor: s2_vendorContract, service: s2_serviceContract, sub: s2_subContract },
        s3: { advisory: s3_advisoryContract, service: s3_serviceContract, vendor: s3_vendorContract },
        s4: { vendor: s4_vendorContract, service1: s4_serviceContract1, service2: s4_serviceContract2, advisory: s4_advisoryContract, sub: s4_subContract },
        s5: { advisory: s5_advisoryContract, service1: s5_serviceContract1, service2: s5_serviceContract2 }
      }
    };
  }

  // ============================================
  // F) Engagements
  // ============================================
  function createScenarioEngagements(forceReload = false) {
    const engagements = PMTwinData.Engagements.getAll();
    const contracts = PMTwinData.Contracts.getAll();
    const projects = PMTwinData.Projects.getAll();
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

    // Get all contracts
    const s1_vendorContract = contracts.find(c => c.id === 'contract_s1_vendor');
    const s1_serviceContract1 = contracts.find(c => c.id === 'contract_s1_service1');
    const s1_serviceContract2 = contracts.find(c => c.id === 'contract_s1_service2');
    const s1_advisoryContract = contracts.find(c => c.id === 'contract_s1_advisory');
    const s1_subContract1 = contracts.find(c => c.id === 'contract_s1_sub1');
    const s1_subContract2 = contracts.find(c => c.id === 'contract_s1_sub2');

    const s2_vendorContract = contracts.find(c => c.id === 'contract_s2_vendor');
    const s2_serviceContract = contracts.find(c => c.id === 'contract_s2_service');
    const s2_subContract = contracts.find(c => c.id === 'contract_s2_sub');

    const s3_advisoryContract = contracts.find(c => c.id === 'contract_s3_advisory');
    const s3_serviceContract = contracts.find(c => c.id === 'contract_s3_service');
    const s3_vendorContract = contracts.find(c => c.id === 'contract_s3_vendor');

    const s4_vendorContract = contracts.find(c => c.id === 'contract_s4_vendor');
    const s4_serviceContract1 = contracts.find(c => c.id === 'contract_s4_service1');
    const s4_serviceContract2 = contracts.find(c => c.id === 'contract_s4_service2');
    const s4_advisoryContract = contracts.find(c => c.id === 'contract_s4_advisory');
    const s4_subContract = contracts.find(c => c.id === 'contract_s4_sub');

    const s5_advisoryContract = contracts.find(c => c.id === 'contract_s5_advisory');
    const s5_serviceContract1 = contracts.find(c => c.id === 'contract_s5_service1');
    const s5_serviceContract2 = contracts.find(c => c.id === 'contract_s5_service2');

    const s1_megaproject = projects.find(p => p.id === 'megaproject_s1_logistics');
    const s2_project = projects.find(p => p.id === 'project_s2_residential');
    const s3_project = projects.find(p => p.id === 'project_s3_hospital');
    const s4_megaproject = projects.find(p => p.id === 'megaproject_s4_airport');
    const s5_project = projects.find(p => p.id === 'project_s5_safety');

    // Scenario 1 Engagements
    const s1_eng_vendor = s1_vendorContract && s1_megaproject ? createEngagementIfNotExists({
      id: 'eng_s1_vendor',
      contractId: s1_vendorContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: s1_megaproject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_eng_service1 = s1_serviceContract1 ? createEngagementIfNotExists({
      id: 'eng_s1_service1',
      contractId: s1_serviceContract1.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s1_warehouse',
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_eng_service2 = s1_serviceContract2 ? createEngagementIfNotExists({
      id: 'eng_s1_service2',
      contractId: s1_serviceContract2.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'PLANNED',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s1_transportation',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_eng_advisory = s1_advisoryContract && s1_megaproject ? createEngagementIfNotExists({
      id: 'eng_s1_advisory',
      contractId: s1_advisoryContract.id,
      engagementType: 'ADVISORY',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: s1_megaproject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_eng_sub1 = s1_subContract1 ? createEngagementIfNotExists({
      id: 'eng_s1_sub1',
      contractId: s1_subContract1.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'PLANNED',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s1_warehouse',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s1_eng_sub2 = s1_subContract2 ? createEngagementIfNotExists({
      id: 'eng_s1_sub2',
      contractId: s1_subContract2.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s1_warehouse',
      startedAt: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 2 Engagements
    const s2_eng_vendor = s2_vendorContract && s2_project ? createEngagementIfNotExists({
      id: 'eng_s2_vendor',
      contractId: s2_vendorContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s2_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s2_eng_service = s2_serviceContract ? createEngagementIfNotExists({
      id: 'eng_s2_service',
      contractId: s2_serviceContract.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s2_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s2_eng_sub = s2_subContract ? createEngagementIfNotExists({
      id: 'eng_s2_sub',
      contractId: s2_subContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'PLANNED',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s2_project.id,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 3 Engagements
    const s3_eng_advisory = s3_advisoryContract && s3_project ? createEngagementIfNotExists({
      id: 'eng_s3_advisory',
      contractId: s3_advisoryContract.id,
      engagementType: 'ADVISORY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s3_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s3_eng_service = s3_serviceContract ? createEngagementIfNotExists({
      id: 'eng_s3_service',
      contractId: s3_serviceContract.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s3_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s3_eng_vendor = s3_vendorContract && s3_project ? createEngagementIfNotExists({
      id: 'eng_s3_vendor',
      contractId: s3_vendorContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s3_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 4 Engagements
    const s4_eng_vendor = s4_vendorContract && s4_megaproject ? createEngagementIfNotExists({
      id: 'eng_s4_vendor',
      contractId: s4_vendorContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: s4_megaproject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_eng_service1 = s4_serviceContract1 ? createEngagementIfNotExists({
      id: 'eng_s4_service1',
      contractId: s4_serviceContract1.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s4_terminal',
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_eng_service2 = s4_serviceContract2 ? createEngagementIfNotExists({
      id: 'eng_s4_service2',
      contractId: s4_serviceContract2.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'PLANNED',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s4_runway',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_eng_advisory = s4_advisoryContract && s4_megaproject ? createEngagementIfNotExists({
      id: 'eng_s4_advisory',
      contractId: s4_advisoryContract.id,
      engagementType: 'ADVISORY',
      status: 'ACTIVE',
      assignedToScopeType: 'MEGA_PROJECT',
      assignedToScopeId: s4_megaproject.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s4_eng_sub = s4_subContract ? createEngagementIfNotExists({
      id: 'eng_s4_sub',
      contractId: s4_subContract.id,
      engagementType: 'PROJECT_EXECUTION',
      status: 'PLANNED',
      assignedToScopeType: 'SUB_PROJECT',
      assignedToScopeId: 'subproject_s4_terminal',
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    // Scenario 5 Engagements
    const s5_eng_advisory = s5_advisoryContract && s5_project ? createEngagementIfNotExists({
      id: 'eng_s5_advisory',
      contractId: s5_advisoryContract.id,
      engagementType: 'ADVISORY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s5_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s5_eng_service1 = s5_serviceContract1 ? createEngagementIfNotExists({
      id: 'eng_s5_service1',
      contractId: s5_serviceContract1.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s5_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    const s5_eng_service2 = s5_serviceContract2 ? createEngagementIfNotExists({
      id: 'eng_s5_service2',
      contractId: s5_serviceContract2.id,
      engagementType: 'SERVICE_DELIVERY',
      status: 'ACTIVE',
      assignedToScopeType: 'PROJECT',
      assignedToScopeId: s5_project.id,
      startedAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }) : null;

    return {
      created: created.length,
      skipped: skipped.length,
      engagements: {
        s1: { vendor: s1_eng_vendor, service1: s1_eng_service1, service2: s1_eng_service2, advisory: s1_eng_advisory, sub1: s1_eng_sub1, sub2: s1_eng_sub2 },
        s2: { vendor: s2_eng_vendor, service: s2_eng_service, sub: s2_eng_sub },
        s3: { advisory: s3_eng_advisory, service: s3_eng_service, vendor: s3_eng_vendor },
        s4: { vendor: s4_eng_vendor, service1: s4_eng_service1, service2: s4_eng_service2, advisory: s4_eng_advisory, sub: s4_eng_sub },
        s5: { advisory: s5_eng_advisory, service1: s5_eng_service1, service2: s5_eng_service2 }
      }
    };
  }

  // ============================================
  // G) Milestones
  // ============================================
  function createScenarioMilestones(forceReload = false) {
    const milestones = PMTwinData.Milestones.getAll();
    const engagements = PMTwinData.Engagements.getAll();
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

    // Get engagements
    const s1_eng_vendor = engagements.find(e => e.id === 'eng_s1_vendor');
    const s1_eng_service1 = engagements.find(e => e.id === 'eng_s1_service1');
    const s1_eng_service2 = engagements.find(e => e.id === 'eng_s1_service2');
    const s1_eng_advisory = engagements.find(e => e.id === 'eng_s1_advisory');
    const s1_eng_sub1 = engagements.find(e => e.id === 'eng_s1_sub1');
    const s1_eng_sub2 = engagements.find(e => e.id === 'eng_s1_sub2');

    const s2_eng_vendor = engagements.find(e => e.id === 'eng_s2_vendor');
    const s2_eng_service = engagements.find(e => e.id === 'eng_s2_service');
    const s2_eng_sub = engagements.find(e => e.id === 'eng_s2_sub');

    const s3_eng_advisory = engagements.find(e => e.id === 'eng_s3_advisory');
    const s3_eng_service = engagements.find(e => e.id === 'eng_s3_service');
    const s3_eng_vendor = engagements.find(e => e.id === 'eng_s3_vendor');

    const s4_eng_vendor = engagements.find(e => e.id === 'eng_s4_vendor');
    const s4_eng_service1 = engagements.find(e => e.id === 'eng_s4_service1');
    const s4_eng_service2 = engagements.find(e => e.id === 'eng_s4_service2');
    const s4_eng_advisory = engagements.find(e => e.id === 'eng_s4_advisory');
    const s4_eng_sub = engagements.find(e => e.id === 'eng_s4_sub');

    const s5_eng_advisory = engagements.find(e => e.id === 'eng_s5_advisory');
    const s5_eng_service1 = engagements.find(e => e.id === 'eng_s5_service1');
    const s5_eng_service2 = engagements.find(e => e.id === 'eng_s5_service2');

    // Scenario 1 Milestones
    if (s1_eng_service1) {
      createMilestoneIfNotExists({
        id: 'mil_s1_service1_1',
        engagementId: s1_eng_service1.id,
        contractId: s1_eng_service1.contractId,
        title: 'Warehouse Layout Design',
        description: 'Initial warehouse layout and space planning design',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
      createMilestoneIfNotExists({
        id: 'mil_s1_service1_2',
        engagementId: s1_eng_service1.id,
        contractId: s1_eng_service1.contractId,
        title: 'Storage Systems Design',
        description: 'Complete storage systems design and specifications',
        type: 'DELIVERABLE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s1_eng_advisory) {
      createMilestoneIfNotExists({
        id: 'mil_s1_advisory_1',
        engagementId: s1_eng_advisory.id,
        contractId: s1_eng_advisory.contractId,
        title: 'Logistics Strategy Report',
        description: 'Comprehensive logistics strategy and operations plan',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s1_eng_vendor) {
      createMilestoneIfNotExists({
        id: 'mil_s1_vendor_1',
        engagementId: s1_eng_vendor.id,
        contractId: s1_eng_vendor.contractId,
        title: 'Warehouse Foundation Complete',
        description: 'All warehouse foundation works completed',
        type: 'MILESTONE',
        status: 'PENDING',
        dueDate: new Date(now.getTime() + 210 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    // Scenario 2 Milestones
    if (s2_eng_service) {
      createMilestoneIfNotExists({
        id: 'mil_s2_service_1',
        engagementId: s2_eng_service.id,
        contractId: s2_eng_service.contractId,
        title: 'Project Schedule',
        description: 'Complete project schedule with critical path',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    // Scenario 3 Milestones
    if (s3_eng_advisory) {
      createMilestoneIfNotExists({
        id: 'mil_s3_advisory_1',
        engagementId: s3_eng_advisory.id,
        contractId: s3_eng_advisory.contractId,
        title: 'Legal Review Report',
        description: 'Complete legal review and contract analysis',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s3_eng_service) {
      createMilestoneIfNotExists({
        id: 'mil_s3_service_1',
        engagementId: s3_eng_service.id,
        contractId: s3_eng_service.contractId,
        title: 'Cost Estimation Report',
        description: 'Comprehensive cost estimation and budget analysis',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    // Scenario 4 Milestones
    if (s4_eng_service1) {
      createMilestoneIfNotExists({
        id: 'mil_s4_service1_1',
        engagementId: s4_eng_service1.id,
        contractId: s4_eng_service1.contractId,
        title: 'Terminal Design Concept',
        description: 'Initial terminal design concept and layout',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s4_eng_advisory) {
      createMilestoneIfNotExists({
        id: 'mil_s4_advisory_1',
        engagementId: s4_eng_advisory.id,
        contractId: s4_eng_advisory.contractId,
        title: 'Aviation Planning Report',
        description: 'Comprehensive aviation infrastructure planning report',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    // Scenario 5 Milestones
    if (s5_eng_advisory) {
      createMilestoneIfNotExists({
        id: 'mil_s5_advisory_1',
        engagementId: s5_eng_advisory.id,
        contractId: s5_eng_advisory.contractId,
        title: 'Safety Compliance Plan',
        description: 'Comprehensive safety compliance plan and risk assessment',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s5_eng_service1) {
      createMilestoneIfNotExists({
        id: 'mil_s5_service1_1',
        engagementId: s5_eng_service1.id,
        contractId: s5_eng_service1.contractId,
        title: 'Safety Audit Report #1',
        description: 'First comprehensive safety audit report',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      });
    }

    if (s5_eng_service2) {
      createMilestoneIfNotExists({
        id: 'mil_s5_service2_1',
        engagementId: s5_eng_service2.id,
        contractId: s5_eng_service2.contractId,
        title: 'Training Program Design',
        description: 'Safety training program design and curriculum',
        type: 'DELIVERABLE',
        status: 'IN_PROGRESS',
        dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
    window.ScenarioSeedData = {
      load: loadScenarioSeedData,
      createUsers: createScenarioUsers,
      createProjects: createScenarioProjects,
      createServiceRequests: createScenarioServiceRequests,
      createServiceOffers: createScenarioServiceOffers,
      createContracts: createScenarioContracts,
      createEngagements: createScenarioEngagements,
      createMilestones: createScenarioMilestones
    };
  }

})();
