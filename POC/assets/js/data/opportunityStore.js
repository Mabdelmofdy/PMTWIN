/**
 * Unified Opportunity Store
 * In-memory data store for Opportunities and Proposals
 * Implements the unified Opportunity/Proposal workflow
 * 
 * Version: 2.0 - Added 8 new users (3 beneficiaries, 5 providers) - Total: 14 users
 * Last Updated: 2024
 */

(function() {
  'use strict';

  // ============================================
  // Data Storage (in-memory)
  // ============================================
  let opportunities = [];
  let proposals = [];
  let users = [];

  // ============================================
  // ID Generation
  // ============================================
  function generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================
  // Opportunity CRUD
  // ============================================
  const OpportunityStore = {
    /**
     * Create a new opportunity (DRAFT status)
     */
    createOpportunity(data) {
      const opportunity = {
        id: data.id || generateId('opp'),
        title: data.title || '',
        description: data.description || '',
        intent: data.intent || 'REQUEST_SERVICE', // REQUEST_SERVICE | OFFER_SERVICE
        model: data.model || '1',
        subModel: data.subModel || '1.1',
        skillsTags: Array.isArray(data.skillsTags) ? data.skillsTags : (Array.isArray(data.skills) ? data.skills : []),
        serviceItems: Array.isArray(data.serviceItems) ? data.serviceItems : [],
        paymentTerms: {
          type: data.paymentTerms?.type || 'CASH', // CASH | BARTER | HYBRID
          barterRule: data.paymentTerms?.barterRule || null
        },
        location: {
          country: data.location?.country || '',
          city: data.location?.city || '',
          area: data.location?.area || null,
          address: data.location?.address || null,
          geo: data.location?.geo || null,
          isRemoteAllowed: data.location?.isRemoteAllowed || false
        },
        status: 'DRAFT', // DRAFT | PUBLISHED | CLOSED
        createdByUserId: data.createdByUserId || null,
        createdAt: data.createdAt || new Date().toISOString()
      };

      opportunities.push(opportunity);
      return opportunity;
    },

    /**
     * Publish an opportunity (change status to PUBLISHED)
     */
    publishOpportunity(id) {
      const opportunity = this.getOpportunityById(id);
      if (!opportunity) {
        console.error('Opportunity not found:', id);
        return null;
      }
      if (opportunity.status !== 'DRAFT') {
        console.warn('Opportunity is not in DRAFT status:', opportunity.status);
        return opportunity;
      }
      opportunity.status = 'PUBLISHED';
      return opportunity;
    },

    /**
     * Get opportunity by ID
     */
    getOpportunityById(id) {
      return opportunities.find(o => o.id === id) || null;
    },

    /**
     * Get all opportunities
     */
    getAllOpportunities() {
      return [...opportunities];
    },

    /**
     * Update opportunity
     */
    updateOpportunity(id, updates) {
      const opportunity = this.getOpportunityById(id);
      if (!opportunity) return null;
      Object.assign(opportunity, updates);
      return opportunity;
    },

    /**
     * Get opportunities by creator
     */
    getOpportunitiesByCreator(userId) {
      return opportunities.filter(o => o.createdByUserId === userId);
    },

    /**
     * Get opportunities by status
     */
    getOpportunitiesByStatus(status) {
      return opportunities.filter(o => o.status === status);
    },

    /**
     * Get opportunities by intent
     */
    getOpportunitiesByIntent(intent) {
      return opportunities.filter(o => o.intent === intent);
    }
  };

  // ============================================
  // Proposal CRUD
  // ============================================
  const ProposalStore = {
    /**
     * Submit a new proposal (SUBMITTED status)
     */
    submitProposal(data) {
      const proposal = {
        id: data.id || generateId('prop'),
        opportunityId: data.opportunityId,
        providerUserId: data.providerUserId,
        priceTotal: data.priceTotal || 0,
        currency: data.currency || 'EGP',
        breakdown: Array.isArray(data.breakdown) ? data.breakdown : [],
        deliveryTimeline: data.deliveryTimeline || '',
        notes: data.notes || '',
        status: 'SUBMITTED', // SUBMITTED | CHANGES_REQUESTED | RESUBMITTED | ACCEPTED | REJECTED
        messages: [],
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      proposals.push(proposal);
      return proposal;
    },

    /**
     * Request changes on a proposal
     */
    requestProposalChanges(proposalId, fromUserId, message) {
      const proposal = this.getProposalById(proposalId);
      if (!proposal) {
        console.error('Proposal not found:', proposalId);
        return null;
      }
      proposal.status = 'CHANGES_REQUESTED';
      proposal.messages.push({
        fromUserId: fromUserId,
        text: message,
        at: new Date().toISOString()
      });
      proposal.updatedAt = new Date().toISOString();
      return proposal;
    },

    /**
     * Resubmit a proposal with updates
     */
    resubmitProposal(proposalId, updates) {
      const proposal = this.getProposalById(proposalId);
      if (!proposal) {
        console.error('Proposal not found:', proposalId);
        return null;
      }
      if (proposal.status !== 'CHANGES_REQUESTED') {
        console.warn('Proposal is not in CHANGES_REQUESTED status:', proposal.status);
        return proposal;
      }

      // Update proposal fields
      if (updates.priceTotal !== undefined) proposal.priceTotal = updates.priceTotal;
      if (updates.currency !== undefined) proposal.currency = updates.currency;
      if (updates.breakdown !== undefined) proposal.breakdown = updates.breakdown;
      if (updates.deliveryTimeline !== undefined) proposal.deliveryTimeline = updates.deliveryTimeline;
      if (updates.notes !== undefined) proposal.notes = updates.notes;

      proposal.status = 'RESUBMITTED';
      if (updates.message) {
        proposal.messages.push({
          fromUserId: proposal.providerUserId,
          text: updates.message,
          at: new Date().toISOString()
        });
      }
      proposal.updatedAt = new Date().toISOString();
      return proposal;
    },

    /**
     * Get proposal by ID
     */
    getProposalById(id) {
      return proposals.find(p => p.id === id) || null;
    },

    /**
     * Get all proposals
     */
    getAllProposals() {
      return [...proposals];
    },

    /**
     * Get proposals by opportunity ID
     */
    getProposalsByOpportunityId(opportunityId) {
      return proposals.filter(p => p.opportunityId === opportunityId);
    },

    /**
     * Get proposals by provider user ID
     */
    getProposalsByProviderId(providerId) {
      return proposals.filter(p => p.providerUserId === providerId);
    },

    /**
     * Update proposal status
     */
    updateProposalStatus(proposalId, status) {
      const proposal = this.getProposalById(proposalId);
      if (!proposal) return null;
      proposal.status = status;
      proposal.updatedAt = new Date().toISOString();
      return proposal;
    }
  };

  // ============================================
  // Matching Engine
  // ============================================
  const MatchingEngine = {
    /**
     * Run matching for an opportunity
     * Returns providers sorted by matchScore desc
     */
    runMatching(opportunityId) {
      const opportunity = OpportunityStore.getOpportunityById(opportunityId);
      if (!opportunity) {
        console.error('Opportunity not found:', opportunityId);
        return [];
      }

      if (opportunity.status !== 'PUBLISHED') {
        console.warn('Opportunity is not PUBLISHED, cannot match:', opportunity.status);
        return [];
      }

      const matches = [];
      const opportunitySkills = opportunity.skillsTags || [];
      const opportunityPayment = opportunity.paymentTerms?.type || 'CASH';
      const opportunityLocation = opportunity.location || {};

      // Get all provider users
      const providers = users.filter(u => {
        // Provider should have skills and not be the opportunity creator
        return u.skills && u.skills.length > 0 && u.id !== opportunity.createdByUserId;
      });

      providers.forEach(provider => {
        const providerSkills = provider.skills || [];
        const providerLocation = provider.location || {};
        const providerPayment = provider.paymentPreferences?.type || 'CASH';

        // Calculate match score
        let matchScore = 0;
        const reasons = [];

        // 1. Skills matching (>=1 common tag)
        const commonSkills = opportunitySkills.filter(skill => 
          providerSkills.some(ps => ps.toLowerCase() === skill.toLowerCase())
        );
        if (commonSkills.length > 0) {
          const skillsScore = (commonSkills.length / Math.max(opportunitySkills.length, 1)) * 100;
          matchScore += skillsScore * 0.6; // 60% weight
          reasons.push(`${commonSkills.length} matching skills: ${commonSkills.join(', ')}`);
        } else {
          // No skills match = no match
          return;
        }

        // 2. Payment compatibility
        let paymentScore = 0;
        if (opportunityPayment === 'CASH') {
          if (providerPayment === 'CASH' || providerPayment === 'HYBRID') {
            paymentScore = 100;
            reasons.push('Payment compatible: CASH');
          }
        } else if (opportunityPayment === 'BARTER') {
          if (providerPayment === 'BARTER' || providerPayment === 'HYBRID') {
            // Check barterRule if present
            if (opportunity.paymentTerms?.barterRule && provider.paymentPreferences?.acceptsBarter) {
              paymentScore = 100;
              reasons.push('Payment compatible: BARTER');
            } else if (!opportunity.paymentTerms?.barterRule) {
              paymentScore = 100;
              reasons.push('Payment compatible: BARTER');
            }
          }
        } else if (opportunityPayment === 'HYBRID') {
          paymentScore = 100;
          reasons.push('Payment compatible: HYBRID matches all');
        }
        matchScore += paymentScore * 0.15; // 15% weight

        // 3. Location matching
        let locationScore = 0;
        const oppCountry = (opportunityLocation.country || '').toLowerCase();
        const oppCity = (opportunityLocation.city || '').toLowerCase();
        const provCountry = (providerLocation.country || '').toLowerCase();
        const provCity = (providerLocation.city || '').toLowerCase();
        const oppRemoteAllowed = opportunityLocation.isRemoteAllowed || false;
        const provRemoteAllowed = providerLocation.isRemoteAllowed || false;

        if (oppCountry && provCountry) {
          if (oppCountry === provCountry) {
            if (oppCity && provCity && oppCity === provCity) {
              locationScore = 100;
              reasons.push(`Same city: ${opportunityLocation.city}`);
            } else if (oppRemoteAllowed || provRemoteAllowed) {
              locationScore = 70;
              reasons.push(`Same country, remote allowed`);
            } else {
              locationScore = 40;
              reasons.push(`Same country, different city, on-site required`);
            }
          } else {
            if (oppRemoteAllowed || provRemoteAllowed) {
              locationScore = 20;
              reasons.push(`Different country, remote allowed`);
            } else {
              locationScore = 0;
              reasons.push(`Different country, on-site required`);
            }
          }
        } else {
          locationScore = 50; // No location data = neutral
          reasons.push('No location data');
        }
        matchScore += locationScore * 0.25; // 25% weight

        matches.push({
          provider: provider,
          matchScore: Math.round(matchScore),
          reasons: reasons,
          matchedSkills: commonSkills
        });
      });

      // Sort by matchScore descending
      matches.sort((a, b) => b.matchScore - a.matchScore);

      return matches;
    }
  };

  // ============================================
  // User Management
  // ============================================
  const UserStore = {
    /**
     * Add user
     */
    addUser(user) {
      users.push(user);
      return user;
    },

    /**
     * Get user by ID
     */
    getUserById(id) {
      return users.find(u => u.id === id) || null;
    },

    /**
     * Get all users
     */
    getAllUsers() {
      return [...users];
    }
  };

  // ============================================
  // Seed Demo Data
  // ============================================
  function seedDemoData() {
    // Clear existing data
    opportunities = [];
    proposals = [];
    users = [];

    // Create demo users with complete profiles
    const nourBeneficiary = {
      id: 'user_nour',
      name: 'Nour Beneficiary',
      email: 'nour@beneficiary.com',
      phone: '+20 100 123 4567',
      role: 'beneficiary',
      userType: 'beneficiary',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'New Cairo',
        address: '123 Business District, New Cairo',
        isRemoteAllowed: false
      },
      skills: [],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Experienced project owner and developer with over 15 years in the construction industry. Specializing in large-scale infrastructure and residential projects across Egypt.',
      companyInfo: {
        name: 'Nour Development Group',
        description: 'Leading real estate development company in Egypt',
        type: 'Entity'
      }
    };

    const deltaContracting = {
      id: 'user_delta',
      name: 'Delta Contracting',
      email: 'contact@deltacontracting.com',
      phone: '+20 100 234 5678',
      role: 'provider',
      userType: 'vendor_corporate',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Heliopolis',
        address: '456 Industrial Zone, Heliopolis',
        isRemoteAllowed: false
      },
      skills: ['civil', 'steel', 'hse', 'site-management', 'structural', 'mep', 'project-management'],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Delta Contracting is a leading construction company in Egypt with over 20 years of experience. We specialize in large-scale infrastructure projects, commercial buildings, and industrial facilities.',
      companyInfo: {
        name: 'Delta Contracting LLC',
        description: 'Full-service construction contractor specializing in infrastructure and commercial projects',
        type: 'Corporate',
        certifications: ['ISO 9001:2015', 'OHSAS 18001', 'ISO 14001'],
        establishedYear: 2003,
        employees: 500
      }
    };

    const greenBuildSustainability = {
      id: 'user_greenbuild',
      name: 'GreenBuild Sustainability',
      email: 'info@greenbuild.com',
      phone: '+20 100 345 6789',
      role: 'provider',
      userType: 'service_provider',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Zamalek',
        address: '789 Green Building, Zamalek',
        isRemoteAllowed: true
      },
      skills: ['hse', 'site-management', 'sustainability', 'certification', 'consulting', 'green-building'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'GreenBuild Sustainability is Egypt\'s premier green building consultancy firm. We help projects achieve LEED, BREEAM, and local green building certifications while implementing sustainable construction practices.',
      companyInfo: {
        name: 'GreenBuild Sustainability Consultants',
        description: 'Specialized sustainability and green building certification consultants',
        type: 'Consultancy',
        certifications: ['LEED AP', 'BREEAM Assessor', 'Green Star'],
        establishedYear: 2015,
        employees: 25
      }
    };

    // Additional demo users
    const cairoEngineeringGroup = {
      id: 'user_cairo_eng',
      name: 'Cairo Engineering Group',
      email: 'info@cairoengineering.com',
      phone: '+20 100 456 7890',
      role: 'provider',
      userType: 'vendor_corporate',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Maadi',
        address: '321 Engineering Tower, Maadi',
        isRemoteAllowed: true
      },
      skills: ['structural', 'civil', 'mep', 'architectural', 'project-management', 'hvac', 'electrical'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'Cairo Engineering Group is one of Egypt\'s largest engineering firms, providing comprehensive design and engineering services for infrastructure, commercial, and residential projects.',
      companyInfo: {
        name: 'Cairo Engineering Group',
        description: 'Multi-disciplinary engineering consultancy',
        type: 'Engineering Firm',
        certifications: ['ISO 9001', 'ISO 14001'],
        establishedYear: 1998,
        employees: 300
      }
    };

    const alexandriaMEPSolutions = {
      id: 'user_alex_mep',
      name: 'Alexandria MEP Solutions',
      email: 'contact@alexmep.com',
      phone: '+20 100 567 8901',
      role: 'provider',
      userType: 'service_provider',
      location: {
        country: 'Egypt',
        city: 'Alexandria',
        area: 'Smouha',
        address: '654 MEP Center, Smouha',
        isRemoteAllowed: true
      },
      skills: ['mep', 'hvac', 'electrical', 'plumbing', 'fire-safety', 'building-automation'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'Alexandria MEP Solutions specializes in mechanical, electrical, and plumbing design and installation for commercial and residential buildings across Egypt.',
      companyInfo: {
        name: 'Alexandria MEP Solutions',
        description: 'Specialized MEP design and installation contractor',
        type: 'MEP Contractor',
        certifications: ['HVAC Certified', 'Electrical License'],
        establishedYear: 2010,
        employees: 150
      }
    };

    const egyptianArchitectsCollective = {
      id: 'user_architects',
      name: 'Egyptian Architects Collective',
      email: 'hello@egyptianarchitects.com',
      phone: '+20 100 678 9012',
      role: 'provider',
      userType: 'consultant',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Garden City',
        address: '987 Design Studio, Garden City',
        isRemoteAllowed: true
      },
      skills: ['architectural', 'interior-design', 'urban-planning', '3d-visualization', 'landscape-design'],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Egyptian Architects Collective is a design-focused architecture firm creating innovative and sustainable architectural solutions for residential, commercial, and cultural projects.',
      companyInfo: {
        name: 'Egyptian Architects Collective',
        description: 'Award-winning architecture and design studio',
        type: 'Architecture Firm',
        certifications: ['RIBA Registered', 'Architectural License'],
        establishedYear: 2012,
        employees: 40
      }
    };

    // Additional Beneficiaries
    const neomDevelopmentAuthority = {
      id: 'user_neom',
      name: 'NEOM Development Authority',
      email: 'beneficiary@pmtwin.com',
      phone: '+966 11 123 4567',
      role: 'beneficiary',
      userType: 'beneficiary',
      location: {
        country: 'Saudi Arabia',
        city: 'NEOM',
        area: 'NEOM City',
        address: 'NEOM Development Authority Headquarters',
        isRemoteAllowed: false
      },
      skills: [],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'NEOM Development Authority is responsible for developing one of the world\'s most ambitious megaprojects. We create opportunities for large-scale infrastructure projects, sustainable development, and innovative construction solutions.',
      companyInfo: {
        name: 'NEOM Development Authority',
        description: 'Government authority managing NEOM megaproject development',
        type: 'Government Entity',
        establishedYear: 2017,
        employees: 5000
      }
    };

    const saudiRealEstateCompany = {
      id: 'user_saudi_realestate',
      name: 'Saudi Real Estate Company',
      email: 'entity2@pmtwin.com',
      phone: '+966 11 234 5678',
      role: 'beneficiary',
      userType: 'beneficiary',
      location: {
        country: 'Saudi Arabia',
        city: 'Riyadh',
        area: 'King Fahd District',
        address: '789 Business Tower, King Fahd District',
        isRemoteAllowed: true
      },
      skills: [],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Saudi Real Estate Company is a leading developer specializing in residential and commercial projects across Saudi Arabia. We manage standalone projects and collaborate with contractors and service providers.',
      companyInfo: {
        name: 'Saudi Real Estate Company',
        description: 'Leading real estate development company in Saudi Arabia',
        type: 'Entity',
        certifications: ['Saudi Contractors Authority License'],
        establishedYear: 2005,
        employees: 800
      }
    };

    const egyptianInfrastructureAuthority = {
      id: 'user_egypt_infra',
      name: 'Egyptian Infrastructure Authority',
      email: 'infra@egypt.gov.eg',
      phone: '+20 3 456 7890',
      role: 'beneficiary',
      userType: 'beneficiary',
      location: {
        country: 'Egypt',
        city: 'Alexandria',
        area: 'Downtown',
        address: 'Government Complex, Alexandria',
        isRemoteAllowed: false
      },
      skills: [],
      paymentPreferences: {
        type: 'BARTER',
        acceptsBarter: true
      },
      bio: 'Egyptian Infrastructure Authority manages public infrastructure projects across Egypt. We focus on transportation, utilities, and public works, often utilizing barter arrangements and collaborative partnerships.',
      companyInfo: {
        name: 'Egyptian Infrastructure Authority',
        description: 'Government authority for public infrastructure development',
        type: 'Government Entity',
        establishedYear: 1990,
        employees: 2000
      }
    };

    // Additional Diverse Providers
    const bimSolutionsCo = {
      id: 'user_bim',
      name: 'BIM Solutions Co',
      email: 'bim@pmtwin.com',
      phone: '+20 100 789 0123',
      role: 'provider',
      userType: 'service_provider',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Nasr City',
        address: '111 BIM Center, Nasr City',
        isRemoteAllowed: true
      },
      skills: ['bim', 'coordination', '3d-modeling', 'clash-detection', 'project-management', 'revit', 'navisworks'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'BIM Solutions Co provides comprehensive Building Information Modeling services including 3D modeling, clash detection, coordination, and BIM project management for construction projects.',
      companyInfo: {
        name: 'BIM Solutions Co',
        description: 'Specialized BIM coordination and modeling services',
        type: 'Service Provider',
        certifications: ['Autodesk Certified', 'BIM Level 2 Certified'],
        establishedYear: 2018,
        employees: 60
      }
    };

    const qualityAssuranceServices = {
      id: 'user_qa',
      name: 'Quality Assurance Services',
      email: 'qa@pmtwin.com',
      phone: '+20 100 890 1234',
      role: 'provider',
      userType: 'service_provider',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: '6th October City',
        address: '222 QA Lab, 6th October City',
        isRemoteAllowed: false
      },
      skills: ['qa-qc', 'inspection', 'testing', 'quality-control', 'compliance', 'material-testing', 'non-destructive-testing'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'Quality Assurance Services provides comprehensive QA/QC inspection and testing services for construction projects. We ensure compliance with international standards and local regulations.',
      companyInfo: {
        name: 'Quality Assurance Services',
        description: 'Specialized QA/QC inspection and testing services',
        type: 'Service Provider',
        certifications: ['ISO 17025', 'NABL Accredited', 'ACI Certified'],
        establishedYear: 2012,
        employees: 45
      }
    };

    const projectPlanningExperts = {
      id: 'user_planner',
      name: 'Project Planning Experts',
      email: 'scheduler@pmtwin.com',
      phone: '+20 3 567 8901',
      role: 'provider',
      userType: 'service_provider',
      location: {
        country: 'Egypt',
        city: 'Alexandria',
        area: 'Sidi Bishr',
        address: '333 Planning Office, Sidi Bishr',
        isRemoteAllowed: true
      },
      skills: ['scheduling', 'planning', 'project-management', 'primavera', 'ms-project', 'risk-management', 'resource-planning'],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Project Planning Experts specialize in project scheduling, planning, and management using advanced tools like Primavera P6 and MS Project. We help projects stay on track and within budget.',
      companyInfo: {
        name: 'Project Planning Experts',
        description: 'Specialized project planning and scheduling services',
        type: 'Service Provider',
        certifications: ['PMP Certified', 'Primavera Certified'],
        establishedYear: 2014,
        employees: 30
      }
    };

    const greenBuildingConsultants = {
      id: 'user_green_consultant',
      name: 'Green Building Consultants',
      email: 'consultant@pmtwin.com',
      phone: '+20 100 901 2345',
      role: 'provider',
      userType: 'consultant',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Maadi',
        address: '444 Green Building, Maadi',
        isRemoteAllowed: true
      },
      skills: ['sustainability', 'consulting', 'advisory', 'green-building', 'certification', 'energy-efficiency', 'leed'],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      },
      bio: 'Green Building Consultants provides sustainability advisory services, green building certification support, and energy efficiency consulting for construction projects seeking LEED, BREEAM, and local certifications.',
      companyInfo: {
        name: 'Green Building Consultants',
        description: 'Sustainability and green building certification consultants',
        type: 'Consultancy',
        certifications: ['LEED AP', 'BREEAM Assessor', 'Green Star'],
        establishedYear: 2016,
        employees: 20
      }
    };

    const materialsSupplierCo = {
      id: 'user_supplier',
      name: 'Materials Supplier Co',
      email: 'supplier@pmtwin.com',
      phone: '+20 100 012 3456',
      role: 'provider',
      userType: 'supplier',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: '10th Ramadan City',
        address: '555 Materials Warehouse, 10th Ramadan City',
        isRemoteAllowed: false
      },
      skills: ['materials-supply', 'logistics', 'procurement', 'inventory-management', 'steel-supply', 'cement-supply', 'aggregates'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      },
      bio: 'Materials Supplier Co is a leading supplier of construction materials including steel, cement, aggregates, and building supplies. We provide bulk purchasing solutions and logistics services for construction projects.',
      companyInfo: {
        name: 'Materials Supplier Co',
        description: 'Construction materials supplier and logistics provider',
        type: 'Supplier',
        certifications: ['ISO 9001', 'Trade License'],
        establishedYear: 2008,
        employees: 200
      }
    };

    users.push(
      nourBeneficiary, 
      deltaContracting, 
      greenBuildSustainability,
      cairoEngineeringGroup,
      alexandriaMEPSolutions,
      egyptianArchitectsCollective,
      // New Beneficiaries
      neomDevelopmentAuthority,
      saudiRealEstateCompany,
      egyptianInfrastructureAuthority,
      // New Providers
      bimSolutionsCo,
      qualityAssuranceServices,
      projectPlanningExperts,
      greenBuildingConsultants,
      materialsSupplierCo
    );

    // Template 1: Large Infrastructure Project (REQUEST_SERVICE) - PUBLISHED
    const opp1_metro = OpportunityStore.createOpportunity({
      title: 'Cairo Metro Extension - Phase 3 Construction',
      description: 'Major infrastructure project for Cairo Metro Line 3 extension. Seeking experienced contractors for civil works, structural engineering, MEP systems, project management, and HSE compliance. Project includes 5 new stations and 8km of tunnel construction.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['civil', 'structural', 'mep', 'project-management', 'hse'],
      serviceItems: [
        { name: 'Civil Works - Tunnel Construction', qty: 8, unit: 'km', priceRef: 'per_km' },
        { name: 'Structural Engineering', qty: 5, unit: 'stations', priceRef: 'per_station' },
        { name: 'MEP Systems Installation', qty: 5, unit: 'stations', priceRef: 'per_station' },
        { name: 'Project Management', qty: 24, unit: 'months', priceRef: 'monthly_rate' },
        { name: 'HSE Compliance & Monitoring', qty: 24, unit: 'months', priceRef: 'monthly_rate' }
      ],
      paymentTerms: {
        type: 'CASH',
        barterRule: null
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Heliopolis',
        address: 'Metro Line 3 Extension Route',
        isRemoteAllowed: false
      },
      status: 'PUBLISHED',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // 10 days ago
    });

    // Template 2: Residential Complex (REQUEST_SERVICE) - PUBLISHED
    const opp2_residential = OpportunityStore.createOpportunity({
      title: 'Luxury Residential Tower - Design & Build',
      description: 'Premium residential tower project in Alexandria. Seeking architectural design, structural engineering, MEP design, and interior design services. Project includes 200 luxury apartments, retail spaces, and amenities.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['architectural', 'structural', 'mep', 'interior-design'],
      serviceItems: [
        { name: 'Architectural Design', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Structural Engineering', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'MEP Design', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Interior Design - Common Areas', qty: 5000, unit: 'sqm', priceRef: 'per_sqm' }
      ],
      paymentTerms: {
        type: 'HYBRID',
        barterRule: 'barter allowed up to 30% of total value'
      },
      location: {
        country: 'Egypt',
        city: 'Alexandria',
        area: 'Stanley',
        address: 'Coastal Road, Stanley',
        isRemoteAllowed: true
      },
      status: 'PUBLISHED',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() // 8 days ago
    });

    // Template 3: MEP Services Offer (OFFER_SERVICE) - PUBLISHED
    const opp3_mep = OpportunityStore.createOpportunity({
      title: 'MEP Design & Installation Services',
      description: 'Comprehensive MEP services including HVAC design and installation, electrical systems, plumbing, fire safety systems, and building automation. Available for commercial and residential projects.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['mep', 'hvac', 'electrical', 'plumbing'],
      serviceItems: [
        { name: 'MEP Design Services', qty: 1, unit: 'project', priceRef: 'per_sqm_design' },
        { name: 'HVAC Installation', qty: 1, unit: 'project', priceRef: 'per_sqm' },
        { name: 'Electrical Installation', qty: 1, unit: 'project', priceRef: 'per_sqm' }
      ],
      paymentTerms: {
        type: 'CASH',
        barterRule: null
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Maadi',
        address: 'Service area: Greater Cairo',
        isRemoteAllowed: true
      },
      status: 'PUBLISHED',
      createdByUserId: alexandriaMEPSolutions.id,
      createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() // 6 days ago
    });

    // Template 4: Sustainability Consulting (OFFER_SERVICE) - PUBLISHED
    const opp4_sustainability = OpportunityStore.createOpportunity({
      title: 'Green Building Certification & Consulting',
      description: 'Expert green building certification services including LEED, BREEAM, and local green building standards. We provide sustainability consulting, energy audits, and certification support throughout the project lifecycle.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['sustainability', 'hse', 'certification', 'consulting'],
      serviceItems: [
        { name: 'Green Building Certification', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Sustainability Consulting', qty: 1, unit: 'project', priceRef: 'monthly_rate' }
      ],
      paymentTerms: {
        type: 'HYBRID',
        barterRule: 'flexible payment terms available'
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Zamalek',
        address: 'Nationwide service',
        isRemoteAllowed: true
      },
      status: 'PUBLISHED',
      createdByUserId: greenBuildSustainability.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    });

    // Template 5: Draft Opportunity (REQUEST_SERVICE) - DRAFT
    const opp5_draft = OpportunityStore.createOpportunity({
      title: 'Warehouse Facility - Structural Design',
      description: 'New warehouse facility requiring structural design and civil engineering services. Facility will be 10,000 sqm with high-bay storage areas and office spaces.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['structural', 'civil', 'site-management'],
      serviceItems: [
        { name: 'Structural Design', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Civil Works Design', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Site Management', qty: 12, unit: 'months', priceRef: 'monthly_rate' }
      ],
      paymentTerms: {
        type: 'BARTER',
        barterRule: 'open to barter arrangements'
      },
      location: {
        country: 'Egypt',
        city: 'Giza',
        area: '6th October City',
        address: 'Industrial Zone, 6th October',
        isRemoteAllowed: false
      },
      status: 'DRAFT',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
    });

    // Template 6: Closed Opportunity (REQUEST_SERVICE) - CLOSED
    const opp6_closed = OpportunityStore.createOpportunity({
      title: 'Office Building Renovation - Completed',
      description: 'Complete renovation of 15-story office building including interior design, MEP upgrades, and facade renovation. Project completed successfully.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['renovation', 'interior-design', 'mep'],
      serviceItems: [
        { name: 'Interior Design', qty: 15000, unit: 'sqm', priceRef: 'per_sqm' },
        { name: 'MEP Upgrades', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Facade Renovation', qty: 5000, unit: 'sqm', priceRef: 'per_sqm' },
        { name: 'Project Management', qty: 18, unit: 'months', priceRef: 'monthly_rate' }
      ],
      paymentTerms: {
        type: 'CASH',
        barterRule: null
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Downtown',
        address: 'Talaat Harb Street',
        isRemoteAllowed: false
      },
      status: 'CLOSED',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString() // 180 days ago
    });

    // Template 7: Original Request (keep for compatibility)
    const nourRequest = OpportunityStore.createOpportunity({
      title: 'Construction Project - Site Management & HSE Services',
      description: 'We are seeking experienced contractors for a major construction project in Cairo. Required services include site management, HSE compliance, civil works, and steel structure installation.',
      intent: 'REQUEST_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['civil', 'steel', 'hse', 'site-management'],
      serviceItems: [
        { name: 'Site Management', qty: 1, unit: 'project', priceRef: 'negotiable' },
        { name: 'HSE Compliance', qty: 6, unit: 'months', priceRef: 'monthly_rate' },
        { name: 'Civil Works', qty: 1000, unit: 'sqm', priceRef: 'per_sqm' },
        { name: 'Steel Structure Installation', qty: 500, unit: 'tons', priceRef: 'per_ton' }
      ],
      paymentTerms: {
        type: 'HYBRID',
        barterRule: 'barter allowed up to 30% of total'
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'New Cairo',
        address: null,
        geo: null,
        isRemoteAllowed: false
      },
      status: 'PUBLISHED',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    });

    // Template 8: Original Offer (keep for compatibility)
    const greenBuildOffer = OpportunityStore.createOpportunity({
      title: 'HSE & Site Management Services Available',
      description: 'GreenBuild Sustainability offers comprehensive HSE and site management services for construction projects. We specialize in sustainable construction practices and safety compliance.',
      intent: 'OFFER_SERVICE',
      model: '1',
      subModel: '1.1',
      skillsTags: ['hse', 'site-management'],
      serviceItems: [
        { name: 'HSE Consulting', qty: 1, unit: 'project', priceRef: 'fixed_price' },
        { name: 'Site Management', qty: 1, unit: 'project', priceRef: 'monthly_rate' }
      ],
      paymentTerms: {
        type: 'CASH',
        barterRule: null
      },
      location: {
        country: 'Egypt',
        city: 'Cairo',
        area: 'Zamalek',
        address: null,
        geo: null,
        isRemoteAllowed: true
      },
      status: 'PUBLISHED',
      createdByUserId: greenBuildSustainability.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    });

    // Create proposals for Template 1 (Metro Extension) - 3 proposals
    const prop1_delta = ProposalStore.submitProposal({
      opportunityId: opp1_metro.id,
      providerUserId: deltaContracting.id,
      priceTotal: 45000000,
      currency: 'EGP',
      breakdown: [
        { item: 'Civil Works - Tunnel Construction (8km)', amount: 20000000 },
        { item: 'Structural Engineering (5 stations)', amount: 10000000 },
        { item: 'MEP Systems Installation (5 stations)', amount: 8000000 },
        { item: 'Project Management (24 months)', amount: 5000000 },
        { item: 'HSE Compliance (24 months)', amount: 2000000 }
      ],
      deliveryTimeline: '24 months',
      notes: 'Delta Contracting has extensive experience in metro projects. We have completed similar projects in the region and can mobilize immediately.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    });

    const prop1_greenbuild = ProposalStore.submitProposal({
      opportunityId: opp1_metro.id,
      providerUserId: greenBuildSustainability.id,
      priceTotal: 48000000,
      currency: 'EGP',
      breakdown: [
        { item: 'HSE Compliance & Monitoring', amount: 3000000 },
        { item: 'Sustainability Consulting', amount: 2000000 },
        { item: 'Green Building Certification Support', amount: 1000000 }
      ],
      deliveryTimeline: '24 months',
      notes: 'We specialize in HSE compliance for large infrastructure projects. Our team includes certified HSE professionals and sustainability experts.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    const prop1_cairo = ProposalStore.submitProposal({
      opportunityId: opp1_metro.id,
      providerUserId: cairoEngineeringGroup.id,
      priceTotal: 42000000,
      currency: 'EGP',
      breakdown: [
        { item: 'Structural Engineering (5 stations)', amount: 12000000 },
        { item: 'MEP Design & Engineering', amount: 15000000 },
        { item: 'Project Management', amount: 15000000 }
      ],
      deliveryTimeline: '22 months',
      notes: 'Cairo Engineering Group has designed multiple metro stations. We can provide comprehensive engineering services.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Request changes on Cairo's proposal
    ProposalStore.requestProposalChanges(prop1_cairo.id, nourBeneficiary.id, 'Please provide more details on MEP systems and update timeline to match project requirements.');

    // Create proposals for Template 2 (Residential) - 2 proposals
    const prop2_delta = ProposalStore.submitProposal({
      opportunityId: opp2_residential.id,
      providerUserId: deltaContracting.id,
      priceTotal: 15000000,
      currency: 'EGP',
      breakdown: [
        { item: 'Structural Engineering', amount: 5000000 },
        { item: 'MEP Design', amount: 4000000 },
        { item: 'Project Management', amount: 6000000 }
      ],
      deliveryTimeline: '18 months',
      notes: 'Initial proposal for structural and MEP services.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Request changes
    ProposalStore.requestProposalChanges(prop2_delta.id, nourBeneficiary.id, 'Please include architectural design services and update pricing structure.');
    // Resubmit
    ProposalStore.resubmitProposal(prop2_delta.id, {
      priceTotal: 18000000,
      breakdown: [
        { item: 'Architectural Design', amount: 6000000 },
        { item: 'Structural Engineering', amount: 5000000 },
        { item: 'MEP Design', amount: 4000000 },
        { item: 'Project Management', amount: 3000000 }
      ],
      message: 'Updated proposal includes architectural design services as requested.'
    });

    const prop2_architects = ProposalStore.submitProposal({
      opportunityId: opp2_residential.id,
      providerUserId: egyptianArchitectsCollective.id,
      priceTotal: 12000000,
      currency: 'EGP',
      breakdown: [
        { item: 'Architectural Design', amount: 7000000 },
        { item: 'Interior Design - Common Areas', amount: 5000000 }
      ],
      deliveryTimeline: '12 months',
      notes: 'Egyptian Architects Collective specializes in luxury residential design. We have won multiple design awards.',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Accept this proposal
    ProposalStore.updateProposalStatus(prop2_architects.id, 'ACCEPTED');

    // Create proposal for Template 3 (MEP Offer) - 1 proposal
    const prop3_nour = ProposalStore.submitProposal({
      opportunityId: opp3_mep.id,
      providerUserId: nourBeneficiary.id,
      priceTotal: 8000000,
      currency: 'EGP',
      breakdown: [
        { item: 'MEP Design Services', amount: 2000000 },
        { item: 'HVAC Installation', amount: 4000000 },
        { item: 'Electrical Installation', amount: 2000000 }
      ],
      deliveryTimeline: '8 months',
      notes: 'Interested in your MEP services for our upcoming residential project.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Create proposals for Template 4 (Sustainability) - 2 proposals
    const prop4_nour = ProposalStore.submitProposal({
      opportunityId: opp4_sustainability.id,
      providerUserId: nourBeneficiary.id,
      priceTotal: 1500000,
      currency: 'EGP',
      breakdown: [
        { item: 'Green Building Certification', amount: 1000000 },
        { item: 'Sustainability Consulting (12 months)', amount: 500000 }
      ],
      deliveryTimeline: '12 months',
      notes: 'We are planning a LEED-certified building and need your expertise.',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    });

    const prop4_delta = ProposalStore.submitProposal({
      opportunityId: opp4_sustainability.id,
      providerUserId: deltaContracting.id,
      priceTotal: 1200000,
      currency: 'EGP',
      breakdown: [
        { item: 'Sustainability Consulting', amount: 1200000 }
      ],
      deliveryTimeline: '6 months',
      notes: 'Interested in sustainability consulting for our projects.',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    });
    // Reject this proposal
    ProposalStore.updateProposalStatus(prop4_delta.id, 'REJECTED');

    // Create proposal for Template 6 (Closed) - 1 historical proposal
    const prop6_delta = ProposalStore.submitProposal({
      opportunityId: opp6_closed.id,
      providerUserId: deltaContracting.id,
      priceTotal: 25000000,
      currency: 'EGP',
      breakdown: [
        { item: 'Interior Design', amount: 8000000 },
        { item: 'MEP Upgrades', amount: 10000000 },
        { item: 'Facade Renovation', amount: 5000000 },
        { item: 'Project Management', amount: 2000000 }
      ],
      deliveryTimeline: '18 months',
      notes: 'Completed successfully. Project delivered on time and within budget.',
      createdAt: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
    });
    ProposalStore.updateProposalStatus(prop6_delta.id, 'ACCEPTED');

    // Original proposal (keep for compatibility)
    ProposalStore.submitProposal({
      opportunityId: nourRequest.id,
      providerUserId: deltaContracting.id,
      priceTotal: 2500000,
      currency: 'EGP',
      breakdown: [
        { item: 'Site Management', amount: 500000 },
        { item: 'HSE Compliance (6 months)', amount: 300000 },
        { item: 'Civil Works (1000 sqm)', amount: 1200000 },
        { item: 'Steel Structure Installation (500 tons)', amount: 500000 }
      ],
      deliveryTimeline: '6 months',
      notes: 'We have extensive experience in similar projects. Can start immediately upon contract signing.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    });

    console.log('[OpportunityStore] Demo data seeded:', {
      users: users.length,
      opportunities: opportunities.length,
      proposals: proposals.length
    });
    console.log('[OpportunityStore] User list:', users.map(u => ({ id: u.id, name: u.name, role: u.role })));
  }

  // ============================================
  // Initialize
  // ============================================
  // Seed demo data on load
  seedDemoData();
  
  // Log initialization
  console.log('[OpportunityStore] Initialized with', opportunities.length, 'opportunities,', proposals.length, 'proposals,', users.length, 'users');
  if (users.length !== 14) {
    console.warn('[OpportunityStore] WARNING: Expected 14 users but found', users.length, 'users!');
    console.log('[OpportunityStore] User IDs:', users.map(u => u.id));
  }

  // ============================================
  // Public API
  // ============================================
  window.OpportunityStore = {
    // Opportunity operations
    createOpportunity: OpportunityStore.createOpportunity.bind(OpportunityStore),
    publishOpportunity: OpportunityStore.publishOpportunity.bind(OpportunityStore),
    getOpportunityById: OpportunityStore.getOpportunityById.bind(OpportunityStore),
    getAllOpportunities: OpportunityStore.getAllOpportunities.bind(OpportunityStore),
    updateOpportunity: OpportunityStore.updateOpportunity.bind(OpportunityStore),
    getOpportunitiesByCreator: OpportunityStore.getOpportunitiesByCreator.bind(OpportunityStore),
    getOpportunitiesByStatus: OpportunityStore.getOpportunitiesByStatus.bind(OpportunityStore),
    getOpportunitiesByIntent: OpportunityStore.getOpportunitiesByIntent.bind(OpportunityStore),

    // Proposal operations
    submitProposal: ProposalStore.submitProposal.bind(ProposalStore),
    requestProposalChanges: ProposalStore.requestProposalChanges.bind(ProposalStore),
    resubmitProposal: ProposalStore.resubmitProposal.bind(ProposalStore),
    getProposalById: ProposalStore.getProposalById.bind(ProposalStore),
    getAllProposals: ProposalStore.getAllProposals.bind(ProposalStore),
    getProposalsByOpportunityId: ProposalStore.getProposalsByOpportunityId.bind(ProposalStore),
    getProposalsByProviderId: ProposalStore.getProposalsByProviderId.bind(ProposalStore),
    updateProposalStatus: ProposalStore.updateProposalStatus.bind(ProposalStore),

    // Matching
    runMatching: MatchingEngine.runMatching.bind(MatchingEngine),

    // User operations
    getUserById: UserStore.getUserById.bind(UserStore),
    getAllUsers: UserStore.getAllUsers.bind(UserStore),

    // Data access (for debugging)
    _getRawData: () => ({
      opportunities: opportunities,
      proposals: proposals,
      users: users
    }),

    // Re-seed data (for testing)
    reseed: seedDemoData
  };

})();
