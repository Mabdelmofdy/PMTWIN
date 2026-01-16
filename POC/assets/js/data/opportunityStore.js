/**
 * Unified Opportunity Store
 * In-memory data store for Opportunities and Proposals
 * Implements the unified Opportunity/Proposal workflow
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

    // Create demo users
    const nourBeneficiary = {
      id: 'user_nour',
      name: 'Nour Beneficiary',
      email: 'nour@beneficiary.com',
      role: 'beneficiary',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        isRemoteAllowed: false
      },
      skills: []
    };

    const deltaContracting = {
      id: 'user_delta',
      name: 'Delta Contracting',
      email: 'contact@deltacontracting.com',
      role: 'provider',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        isRemoteAllowed: false
      },
      skills: ['civil', 'steel', 'hse', 'site-management'],
      paymentPreferences: {
        type: 'HYBRID',
        acceptsBarter: true
      }
    };

    const greenBuildSustainability = {
      id: 'user_greenbuild',
      name: 'GreenBuild Sustainability',
      email: 'info@greenbuild.com',
      role: 'provider',
      location: {
        country: 'Egypt',
        city: 'Cairo',
        isRemoteAllowed: true
      },
      skills: ['hse', 'site-management', 'sustainability'],
      paymentPreferences: {
        type: 'CASH',
        acceptsBarter: false
      }
    };

    users.push(nourBeneficiary, deltaContracting, greenBuildSustainability);

    // Create REQUEST_SERVICE opportunity by Nour
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
        area: null,
        address: null,
        geo: null,
        isRemoteAllowed: false
      },
      status: 'PUBLISHED',
      createdByUserId: nourBeneficiary.id,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    });

    // Create OFFER_SERVICE opportunity by GreenBuild
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
        area: null,
        address: null,
        geo: null,
        isRemoteAllowed: true
      },
      status: 'PUBLISHED',
      createdByUserId: greenBuildSustainability.id,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days ago
    });

    // Pre-seed one proposal example (Delta to Nour's request)
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
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() // 3 days ago
    });

    console.log('[OpportunityStore] Demo data seeded:', {
      users: users.length,
      opportunities: opportunities.length,
      proposals: proposals.length
    });
  }

  // ============================================
  // Initialize
  // ============================================
  // Seed demo data on load
  seedDemoData();
  
  // Log initialization
  console.log('[OpportunityStore] Initialized with', opportunities.length, 'opportunities,', proposals.length, 'proposals,', users.length, 'users');

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
