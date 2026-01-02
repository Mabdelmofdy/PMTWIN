/**
 * PMTwin Project Templates
 * Data structures and sample data for all 5 core collaboration models (13 sub-models)
 */

const projectTemplates = {
  // ============================================
  // Model 1: Project-Based Collaboration
  // ============================================
  
  // 1.1 Task-Based Engagement
  taskBasedEngagement: {
    modelId: '1.1',
    modelName: 'Task-Based Engagement',
    template: {
      id: null, // Generated on creation
      creatorId: null,
      modelType: 'task_based_engagement',
      modelId: '1.1',
      
      // Basic Information
      title: '',
      description: '',
      taskTitle: '',
      taskType: '', // Design, Engineering, Consultation, Review, Analysis, Other
      detailedScope: '',
      
      // Requirements
      requiredSkills: [],
      experienceLevel: '', // intermediate, senior, expert
      minimumExperience: 0, // years
      certificationsRequired: [],
      
      // Timeline & Budget
      duration: 0, // days
      durationUnit: 'days', // days, weeks, months
      budgetRange: {
        min: 0,
        max: 0,
        currency: 'SAR'
      },
      paymentTerms: '', // 30_days, 60_days, milestone_based
      barterAvailable: false,
      
      // Location
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia',
        remoteAllowed: false
      },
      
      // Status
      status: 'draft', // draft, active, in_progress, completed, cancelled
      visibility: 'public', // public, registered_only
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-task-001',
      creatorId: 'user_entity_001',
      modelType: 'task_based_engagement',
      modelId: '1.1',
      title: 'Structural Engineering Review for High-Rise Building',
      description: 'Need expert structural engineering review for shop drawings before submission to authorities',
      taskTitle: 'Review shop drawings for structural approval',
      taskType: 'Review',
      detailedScope: 'Review structural shop drawings for 50-story residential building. Verify compliance with Saudi Building Code and provide recommendations.',
      requiredSkills: ['Structural Engineering', 'Building Code Compliance', 'Shop Drawing Review'],
      experienceLevel: 'senior',
      minimumExperience: 10,
      certificationsRequired: ['Professional Engineering License'],
      duration: 14,
      durationUnit: 'days',
      budgetRange: {
        min: 50000,
        max: 80000,
        currency: 'SAR'
      },
      paymentTerms: 'milestone_based',
      barterAvailable: true,
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia',
        remoteAllowed: true
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-15T00:00:00Z',
      publishedAt: '2024-01-15T00:00:00Z'
    }
  },

  // 1.2 Consortium
  consortium: {
    modelId: '1.2',
    modelName: 'Consortium',
    template: {
      id: null,
      creatorId: null,
      modelType: 'consortium',
      modelId: '1.2',
      
      title: '',
      description: '',
      projectTitle: '',
      projectValue: 0,
      currency: 'SAR',
      
      // Required Partners
      requiredPartnerRoles: [], // e.g., ['MEP', 'Civil', 'Architectural']
      requiredCapabilities: [],
      minimumExperience: 0,
      certificationsRequired: [],
      
      // Consortium Structure
      consortiumAgreement: {
        scopeDistribution: {},
        paymentDistribution: {},
        liabilityDistribution: {},
        decisionMakingProcess: ''
      },
      
      // Timeline
      timeline: {
        startDate: '',
        duration: 0, // months
        milestones: []
      },
      
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia'
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-consortium-001',
      creatorId: 'user_entity_001',
      modelType: 'consortium',
      modelId: '1.2',
      title: 'Mega Infrastructure Project - Consortium Formation',
      description: 'Forming consortium for 100km highway development project',
      projectTitle: 'Riyadh-Dammam Highway Extension',
      projectValue: 500000000,
      currency: 'SAR',
      requiredPartnerRoles: ['MEP', 'Civil Engineering', 'Environmental', 'Quality Control'],
      requiredCapabilities: ['Highway Construction', 'Bridge Engineering', 'Environmental Compliance'],
      minimumExperience: 15,
      certificationsRequired: ['SCA Classification Grade 1'],
      consortiumAgreement: {
        scopeDistribution: {
          'Lead': '40%',
          'MEP Partner': '25%',
          'Civil Partner': '25%',
          'Environmental Partner': '10%'
        },
        paymentDistribution: {
          'Lead': '40%',
          'MEP Partner': '25%',
          'Civil Partner': '25%',
          'Environmental Partner': '10%'
        },
        liabilityDistribution: {
          'Lead': '40%',
          'Partners': '60% (proportional)'
        },
        decisionMakingProcess: 'Majority vote with lead partner having final say on critical decisions'
      },
      timeline: {
        startDate: '2024-06-01',
        duration: 36,
        milestones: [
          { name: 'Design Phase', date: '2024-12-31' },
          { name: 'Foundation Work', date: '2025-06-30' },
          { name: 'Structure Complete', date: '2026-12-31' }
        ]
      },
      location: {
        city: 'Riyadh',
        region: 'Eastern Province',
        country: 'Saudi Arabia'
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-20T00:00:00Z',
      publishedAt: '2024-01-20T00:00:00Z'
    }
  },

  // 1.3 Project-Specific JV
  projectJV: {
    modelId: '1.3',
    modelName: 'Project-Specific Joint Venture',
    template: {
      id: null,
      creatorId: null,
      modelType: 'project_jv',
      modelId: '1.3',
      
      title: '',
      description: '',
      projectTitle: '',
      projectValue: 0,
      currency: 'SAR',
      
      // JV Structure
      jvType: '', // contractual, incorporated
      equityDistribution: {},
      managementStructure: '',
      profitSharing: {},
      
      // Requirements
      requiredPartnerProfile: {
        financialCapacity: 0,
        experience: '',
        certifications: []
      },
      
      timeline: {
        startDate: '',
        duration: 0,
        milestones: []
      },
      
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia'
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-jv-001',
      creatorId: 'user_entity_001',
      modelType: 'project_jv',
      modelId: '1.3',
      title: 'Mixed-Use Development Project - Joint Venture',
      description: 'Seeking JV partner for large-scale mixed-use development',
      projectTitle: 'Downtown Riyadh Mixed-Use Complex',
      projectValue: 2000000000,
      currency: 'SAR',
      jvType: 'incorporated',
      equityDistribution: {
        'Lead Partner': '60%',
        'JV Partner': '40%'
      },
      managementStructure: 'Joint management with lead partner as managing partner',
      profitSharing: {
        'Lead Partner': '60%',
        'JV Partner': '40%'
      },
      requiredPartnerProfile: {
        financialCapacity: 800000000,
        experience: '15+ years in mixed-use development',
        certifications: ['SCA Classification Grade 1', 'Real Estate Development License']
      },
      timeline: {
        startDate: '2024-09-01',
        duration: 48,
        milestones: [
          { name: 'Design Approval', date: '2025-03-31' },
          { name: 'Foundation Complete', date: '2025-12-31' },
          { name: 'Structure Complete', date: '2027-06-30' },
          { name: 'Handover', date: '2028-08-31' }
        ]
      },
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia'
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-02-01T00:00:00Z',
      publishedAt: '2024-02-01T00:00:00Z'
    }
  },

  // 1.4 Special Purpose Vehicle (SPV)
  spv: {
    modelId: '1.4',
    modelName: 'Special Purpose Vehicle (SPV)',
    template: {
      id: null,
      creatorId: null,
      modelType: 'spv',
      modelId: '1.4',
      
      title: '',
      description: '',
      projectTitle: '',
      projectValue: 0,
      currency: 'SAR',
      
      // SPV Structure
      spvName: '',
      legalStructure: '', // LLC, Joint Stock Company
      investmentRequired: 0,
      equityOffering: {},
      managementStructure: '',
      
      // Requirements
      investorProfile: {
        minimumInvestment: 0,
        financialCapacity: 0,
        experience: ''
      },
      
      timeline: {
        startDate: '',
        duration: 0,
        milestones: []
      },
      
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia'
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-spv-001',
      creatorId: 'user_entity_001',
      modelType: 'spv',
      modelId: '1.4',
      title: 'NEOM Infrastructure SPV - Investment Opportunity',
      description: 'Forming SPV for mega infrastructure project in NEOM',
      projectTitle: 'NEOM Transportation Hub Development',
      projectValue: 5000000000,
      currency: 'SAR',
      spvName: 'NEOM Transport Infrastructure SPV Ltd.',
      legalStructure: 'Joint Stock Company',
      investmentRequired: 2000000000,
      equityOffering: {
        'Lead Sponsor': '40%',
        'Strategic Investors': '35%',
        'Financial Investors': '25%'
      },
      managementStructure: 'Board of Directors with lead sponsor as Chairman',
      investorProfile: {
        minimumInvestment: 50000000,
        financialCapacity: 200000000,
        experience: 'Infrastructure development or investment experience'
      },
      timeline: {
        startDate: '2024-12-01',
        duration: 60,
        milestones: [
          { name: 'SPV Formation', date: '2025-03-31' },
          { name: 'Financial Close', date: '2025-06-30' },
          { name: 'Construction Start', date: '2025-09-01' },
          { name: 'Phase 1 Complete', date: '2027-12-31' }
        ]
      },
      location: {
        city: 'NEOM',
        region: 'Tabuk Province',
        country: 'Saudi Arabia'
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-03-01T00:00:00Z',
      publishedAt: '2024-03-01T00:00:00Z'
    }
  },

  // ============================================
  // Model 2: Strategic Partnerships
  // ============================================
  
  // 2.1 Strategic JV
  strategicJV: {
    modelId: '2.1',
    modelName: 'Strategic Joint Venture',
    template: {
      id: null,
      creatorId: null,
      modelType: 'strategic_jv',
      modelId: '2.1',
      
      title: '',
      description: '',
      partnershipDuration: 0, // years (typically 10+)
      strategicObjectives: [],
      
      // JV Structure
      equityDistribution: {},
      managementStructure: '',
      decisionMakingProcess: '',
      
      // Requirements
      partnerProfile: {
        capabilities: [],
        marketPresence: '',
        financialCapacity: 0
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-strategic-jv-001',
      creatorId: 'user_entity_001',
      modelType: 'strategic_jv',
      modelId: '2.1',
      title: 'Long-Term Strategic Joint Venture for MENA Expansion',
      description: 'Seeking strategic JV partner for 15-year MENA market expansion',
      partnershipDuration: 15,
      strategicObjectives: [
        'Expand market presence in GCC countries',
        'Share technology and expertise',
        'Joint bidding on mega-projects',
        'Resource and knowledge sharing'
      ],
      equityDistribution: {
        'Partner 1': '50%',
        'Partner 2': '50%'
      },
      managementStructure: 'Equal representation on board, rotating CEO every 3 years',
      decisionMakingProcess: 'Unanimous consent for major decisions, majority for operational',
      partnerProfile: {
        capabilities: ['Infrastructure Development', 'Project Management', 'Technology Integration'],
        marketPresence: 'Established presence in at least 3 GCC countries',
        financialCapacity: 1000000000
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-10T00:00:00Z',
      publishedAt: '2024-01-10T00:00:00Z'
    }
  },

  // 2.2 Strategic Alliance
  strategicAlliance: {
    modelId: '2.2',
    modelName: 'Strategic Alliance',
    template: {
      id: null,
      creatorId: null,
      modelType: 'strategic_alliance',
      modelId: '2.2',
      
      title: '',
      description: '',
      allianceType: '', // preferred_supplier, technology_partner, service_partner
      agreementDuration: 0, // years
      
      // Alliance Terms
      terms: {
        exclusivity: false,
        preferredPricing: false,
        jointMarketing: false,
        knowledgeSharing: false
      },
      
      // Requirements
      partnerProfile: {
        capabilities: [],
        certifications: [],
        trackRecord: ''
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-alliance-001',
      creatorId: 'user_entity_001',
      modelType: 'strategic_alliance',
      modelId: '2.2',
      title: 'Preferred Supplier Strategic Alliance',
      description: 'Seeking strategic alliance with material suppliers for long-term partnership',
      allianceType: 'preferred_supplier',
      agreementDuration: 5,
      terms: {
        exclusivity: false,
        preferredPricing: true,
        jointMarketing: true,
        knowledgeSharing: true
      },
      partnerProfile: {
        capabilities: ['Steel Supply', 'Cement Supply', 'Construction Materials'],
        certifications: ['ISO 9001', 'Quality Assurance Certification'],
        trackRecord: '10+ years in construction materials supply'
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-01-25T00:00:00Z',
      publishedAt: '2024-01-25T00:00:00Z'
    }
  },

  // 2.3 Mentorship Program
  mentorship: {
    modelId: '2.3',
    modelName: 'Mentorship Program',
    template: {
      id: null,
      creatorId: null,
      modelType: 'mentorship',
      modelId: '2.3',
      
      title: '',
      description: '',
      programDuration: 0, // months
      programStructure: '',
      
      // Mentorship Details
      mentorRequirements: {
        experienceLevel: '',
        certifications: [],
        specialization: ''
      },
      menteeRequirements: {
        experienceLevel: '',
        currentRole: '',
        careerGoals: ''
      },
      
      // Program Benefits
      benefits: [],
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-mentorship-001',
      creatorId: 'user_mentor_001',
      modelType: 'mentorship',
      modelId: '2.3',
      title: 'Senior Project Management Mentorship Program',
      description: 'Mentorship program for junior project managers seeking career advancement',
      programDuration: 12,
      programStructure: 'Monthly one-on-one sessions, quarterly group workshops, ongoing support',
      mentorRequirements: {
        experienceLevel: '15+ years',
        certifications: ['PMP', 'Senior Management Certification'],
        specialization: 'Mega-Project Management'
      },
      menteeRequirements: {
        experienceLevel: '2-5 years',
        currentRole: 'Junior Project Manager or Assistant PM',
        careerGoals: 'Advance to Senior PM or Project Director role'
      },
      benefits: [
        'Personalized career guidance',
        'Access to professional network',
        'Skill development workshops',
        'Project management best practices',
        'Certification preparation support'
      ],
      status: 'active',
      visibility: 'public',
      createdAt: '2024-02-15T00:00:00Z',
      publishedAt: '2024-02-15T00:00:00Z'
    }
  },

  // ============================================
  // Model 3: Resource Pooling & Sharing
  // ============================================
  
  // 3.1 Bulk Purchasing
  bulkPurchasing: {
    modelId: '3.1',
    modelName: 'Bulk Purchasing',
    template: {
      id: null,
      creatorId: null,
      modelType: 'bulk_purchasing',
      modelId: '3.1',
      
      title: '',
      description: '',
      materialType: '', // cement, steel, software, equipment
      totalQuantity: 0,
      unit: '',
      
      // Purchasing Details
      targetPrice: 0,
      currency: 'SAR',
      minimumCommitment: 0,
      paymentTerms: '',
      
      // Timeline
      orderDate: '',
      deliveryDate: '',
      deliveryLocation: '',
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-bulk-001',
      creatorId: 'user_entity_001',
      modelType: 'bulk_purchasing',
      modelId: '3.1',
      title: 'Bulk Cement Purchase - Volume Discount Opportunity',
      description: 'Pooling orders for cement to achieve volume discounts',
      materialType: 'cement',
      totalQuantity: 10000,
      unit: 'tons',
      targetPrice: 250,
      currency: 'SAR',
      minimumCommitment: 500,
      paymentTerms: '30_days',
      orderDate: '2024-04-01',
      deliveryDate: '2024-05-15',
      deliveryLocation: 'Riyadh, Saudi Arabia',
      status: 'active',
      visibility: 'public',
      createdAt: '2024-03-10T00:00:00Z',
      publishedAt: '2024-03-10T00:00:00Z'
    }
  },

  // 3.2 Co-Ownership
  coOwnership: {
    modelId: '3.2',
    modelName: 'Co-Ownership',
    template: {
      id: null,
      creatorId: null,
      modelType: 'co_ownership',
      modelId: '3.2',
      
      title: '',
      description: '',
      assetType: '', // tower_crane, batching_plant, heavy_equipment
      assetValue: 0,
      currency: 'SAR',
      
      // Ownership Structure
      ownershipShares: {},
      managementStructure: '',
      usageAllocation: '',
      
      // Financial Terms
      investmentRequired: 0,
      paymentTerms: '',
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-co-own-001',
      creatorId: 'user_entity_001',
      modelType: 'co_ownership',
      modelId: '3.2',
      title: 'Tower Crane Co-Ownership Pool',
      description: 'Co-ownership opportunity for 500-ton tower crane',
      assetType: 'tower_crane',
      assetValue: 5000000,
      currency: 'SAR',
      ownershipShares: {
        'Partner 1': '40%',
        'Partner 2': '30%',
        'Partner 3': '30%'
      },
      managementStructure: 'Rotating management responsibility, shared maintenance costs',
      usageAllocation: 'Proportional to ownership share, with scheduling coordination',
      investmentRequired: 2000000,
      paymentTerms: '50% upfront, 50% on delivery',
      status: 'active',
      visibility: 'public',
      createdAt: '2024-03-20T00:00:00Z',
      publishedAt: '2024-03-20T00:00:00Z'
    }
  },

  // 3.3 Resource Marketplace
  resourceMarketplace: {
    modelId: '3.3',
    modelName: 'Resource Marketplace',
    template: {
      id: null,
      creatorId: null,
      modelType: 'resource_marketplace',
      modelId: '3.3',
      
      title: '',
      description: '',
      resourceType: '', // materials, equipment, labor, knowledge
      quantity: 0,
      unit: '',
      
      // Exchange Type
      exchangeType: '', // cash, barter, mixed
      cashPrice: 0,
      barterPreferences: [],
      
      // Location & Availability
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia'
      },
      availabilityDate: '',
      condition: '', // new, used, excellent, good
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-marketplace-001',
      creatorId: 'user_entity_001',
      modelType: 'resource_marketplace',
      modelId: '3.3',
      title: 'Surplus Steel Inventory - 50 Tons Available',
      description: 'Excess steel inventory from completed project, available for sale or barter',
      resourceType: 'materials',
      quantity: 50,
      unit: 'tons',
      exchangeType: 'mixed',
      cashPrice: 300000,
      barterPreferences: [
        'Construction equipment rental',
        'Professional services (engineering, design)',
        'Software licenses'
      ],
      location: {
        city: 'Jeddah',
        region: 'Makkah Province',
        country: 'Saudi Arabia'
      },
      availabilityDate: '2024-04-01',
      condition: 'excellent',
      status: 'active',
      visibility: 'public',
      createdAt: '2024-03-25T00:00:00Z',
      publishedAt: '2024-03-25T00:00:00Z'
    }
  },

  // ============================================
  // Model 4: Resource Acquisition
  // ============================================
  
  // 4.1 Professional Hiring
  professionalHiring: {
    modelId: '4.1',
    modelName: 'Professional Hiring',
    template: {
      id: null,
      creatorId: null,
      modelType: 'professional_hiring',
      modelId: '4.1',
      
      title: '',
      description: '',
      position: '',
      employmentType: '', // full_time, contract, part_time
      
      // Requirements
      requiredSkills: [],
      experienceLevel: '',
      minimumExperience: 0,
      certificationsRequired: [],
      educationRequired: '',
      
      // Compensation
      salaryRange: {
        min: 0,
        max: 0,
        currency: 'SAR'
      },
      benefits: [],
      
      // Location
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia',
        remoteAllowed: false
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-hiring-001',
      creatorId: 'user_entity_001',
      modelType: 'professional_hiring',
      modelId: '4.1',
      title: 'Senior Project Manager - Full-Time Position',
      description: 'Seeking experienced project manager for mega infrastructure project',
      position: 'Senior Project Manager',
      employmentType: 'full_time',
      requiredSkills: [
        'Project Management',
        'Mega-Project Experience',
        'Team Leadership',
        'Risk Management'
      ],
      experienceLevel: 'senior',
      minimumExperience: 10,
      certificationsRequired: ['PMP', 'Professional Engineering License'],
      educationRequired: 'Bachelor\'s in Engineering or related field',
      salaryRange: {
        min: 25000,
        max: 35000,
        currency: 'SAR'
      },
      benefits: [
        'Health Insurance',
        'Annual Leave',
        'Professional Development',
        'Performance Bonus'
      ],
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia',
        remoteAllowed: false
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-02-10T00:00:00Z',
      publishedAt: '2024-02-10T00:00:00Z'
    }
  },

  // 4.2 Consultant Hiring
  consultantHiring: {
    modelId: '4.2',
    modelName: 'Consultant Hiring',
    template: {
      id: null,
      creatorId: null,
      modelType: 'consultant_hiring',
      modelId: '4.2',
      
      title: '',
      description: '',
      consultantType: '', // advisory, feasibility, expert_review, strategic
      engagementDuration: 0, // months
      
      // Requirements
      requiredExpertise: [],
      experienceLevel: '',
      minimumExperience: 0,
      certificationsRequired: [],
      trackRecord: '',
      
      // Compensation
      feeStructure: '', // fixed, hourly, daily, milestone_based
      feeRange: {
        min: 0,
        max: 0,
        currency: 'SAR'
      },
      
      // Deliverables
      expectedDeliverables: [],
      
      // Location
      location: {
        city: '',
        region: '',
        country: 'Saudi Arabia',
        remoteAllowed: false
      },
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-consultant-001',
      creatorId: 'user_entity_001',
      modelType: 'consultant_hiring',
      modelId: '4.2',
      title: 'Feasibility Study Consultant - Infrastructure Project',
      description: 'Seeking consultant for comprehensive feasibility study',
      consultantType: 'feasibility',
      engagementDuration: 6,
      requiredExpertise: [
        'Feasibility Studies',
        'Infrastructure Planning',
        'Financial Analysis',
        'Risk Assessment'
      ],
      experienceLevel: 'expert',
      minimumExperience: 15,
      certificationsRequired: ['Professional Engineering License', 'Financial Analysis Certification'],
      trackRecord: 'Completed 20+ feasibility studies for mega-projects',
      feeStructure: 'fixed',
      feeRange: {
        min: 500000,
        max: 800000,
        currency: 'SAR'
      },
      expectedDeliverables: [
        'Feasibility Study Report',
        'Financial Analysis',
        'Risk Assessment',
        'Recommendations'
      ],
      location: {
        city: 'Riyadh',
        region: 'Riyadh Province',
        country: 'Saudi Arabia',
        remoteAllowed: true
      },
      status: 'active',
      visibility: 'public',
      createdAt: '2024-02-20T00:00:00Z',
      publishedAt: '2024-02-20T00:00:00Z'
    }
  },

  // ============================================
  // Model 5: Call for Competition
  // ============================================
  
  // 5.1 RFP/Design Competition
  competition: {
    modelId: '5.1',
    modelName: 'RFP/Design Competition',
    template: {
      id: null,
      creatorId: null,
      modelType: 'competition',
      modelId: '5.1',
      
      title: '',
      description: '',
      competitionType: '', // design, technical_solution, innovation
      competitionFormat: '', // open, invited, two_stage
      
      // Competition Details
      prizeStructure: {
        firstPlace: 0,
        secondPlace: 0,
        thirdPlace: 0,
        currency: 'SAR'
      },
      evaluationCriteria: [],
      
      // Requirements
      participantRequirements: {
        qualifications: [],
        experience: '',
        teamSize: 0
      },
      
      // Timeline
      submissionDeadline: '',
      evaluationPeriod: 0, // days
      announcementDate: '',
      
      // Deliverables
      requiredDeliverables: [],
      
      status: 'draft',
      visibility: 'public',
      createdAt: null,
      publishedAt: null
    },
    sample: {
      id: 'proj-competition-001',
      creatorId: 'user_entity_001',
      modelType: 'competition',
      modelId: '5.1',
      title: 'Sustainable Building Design Competition',
      description: 'Open competition for innovative sustainable building design',
      competitionType: 'design',
      competitionFormat: 'open',
      prizeStructure: {
        firstPlace: 500000,
        secondPlace: 250000,
        thirdPlace: 100000,
        currency: 'SAR'
      },
      evaluationCriteria: [
        'Innovation and Creativity',
        'Sustainability and Environmental Impact',
        'Feasibility and Constructability',
        'Cost Effectiveness',
        'Aesthetic Appeal'
      ],
      participantRequirements: {
        qualifications: ['Architectural License', 'LEED Certification'],
        experience: '5+ years in sustainable design',
        teamSize: '2-5 members'
      },
      submissionDeadline: '2024-06-30',
      evaluationPeriod: 30,
      announcementDate: '2024-08-01',
      requiredDeliverables: [
        'Design Concept',
        'Technical Drawings',
        'Sustainability Analysis',
        'Cost Estimate',
        'Presentation Materials'
      ],
      status: 'active',
      visibility: 'public',
      createdAt: '2024-04-01T00:00:00Z',
      publishedAt: '2024-04-01T00:00:00Z'
    }
  }
};

// Helper functions
function getTemplateByModelId(modelId) {
  const modelMap = {
    '1.1': projectTemplates.taskBasedEngagement,
    '1.2': projectTemplates.consortium,
    '1.3': projectTemplates.projectJV,
    '1.4': projectTemplates.spv,
    '2.1': projectTemplates.strategicJV,
    '2.2': projectTemplates.strategicAlliance,
    '2.3': projectTemplates.mentorship,
    '3.1': projectTemplates.bulkPurchasing,
    '3.2': projectTemplates.coOwnership,
    '3.3': projectTemplates.resourceMarketplace,
    '4.1': projectTemplates.professionalHiring,
    '4.2': projectTemplates.consultantHiring,
    '5.1': projectTemplates.competition
  };
  return modelMap[modelId] || null;
}

function getAllTemplates() {
  return Object.values(projectTemplates).filter(t => t.template);
}

function getAllSamples() {
  return Object.values(projectTemplates).filter(t => t.sample).map(t => t.sample);
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    projectTemplates,
    getTemplateByModelId,
    getAllTemplates,
    getAllSamples
  };
} else {
  window.ProjectTemplates = {
    projectTemplates,
    getTemplateByModelId,
    getAllTemplates,
    getAllSamples
  };
}


