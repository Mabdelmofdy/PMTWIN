/**
 * PMTwin Collaboration Matching Algorithm
 * Model-specific matching functions for all collaboration models
 */

(function() {
  'use strict';

  // Ensure dependencies are loaded
  if (typeof window.CollaborationModels === 'undefined') {
    console.error('CollaborationModels not loaded!');
    return;
  }

  if (typeof window.PMTwinData === 'undefined') {
    console.error('PMTwinData not loaded!');
    return;
  }

  // ============================================
  // Helper Functions
  // ============================================

  function calculateSkillMatchScore(requiredSkills, providerSkills) {
    if (!requiredSkills || requiredSkills.length === 0) return 100;
    if (!providerSkills || providerSkills.length === 0) return 0;

    const matched = requiredSkills.filter(req => 
      providerSkills.some(prov => 
        prov.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(prov.toLowerCase())
      )
    );

    return Math.round((matched.length / requiredSkills.length) * 100);
  }

  function calculateExperienceLevelMatch(required, provider) {
    const levels = { 'Junior': 1, 'Mid-Level': 2, 'Senior': 3, 'Expert': 4 };
    const reqLevel = levels[required] || 2;
    const provLevel = levels[provider] || 2;
    
    if (provLevel >= reqLevel) return 100;
    return Math.max(0, 100 - ((reqLevel - provLevel) * 30));
  }

  function calculateGeographicProximity(projectLocation, providerLocation) {
    if (!projectLocation || !providerLocation) return 50;

    // Simple string matching for POC
    const projCity = (projectLocation.city || '').toLowerCase();
    const provCity = (providerLocation.city || '').toLowerCase();
    const projRegion = (projectLocation.region || '').toLowerCase();
    const provRegion = (providerLocation.region || '').toLowerCase();

    if (projCity && provCity && projCity === provCity) return 100;
    if (projRegion && provRegion && projRegion === provRegion) return 70;
    return 50; // Same country or unknown
  }

  function checkFinancialCapacity(required, provider) {
    if (!required) return true;
    
    const providerRevenue = provider.profile?.annualRevenueRange || '';
    // Simple check - in production would parse ranges properly
    if (providerRevenue.includes('M') || providerRevenue.includes('B')) {
      return true; // Has significant revenue
    }
    return false;
  }

  function getPastPerformanceScore(userId, modelType) {
    // In POC, return neutral score. In production, would query past collaborations
    return 75; // Neutral score
  }

  // ============================================
  // Model 1.1: Task-Based Engagement Matching
  // ============================================
  function matchTaskBasedEngagement(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Skill Match Score
    scores.skillMatchScore = calculateSkillMatchScore(
      attrs.requiredSkills || [],
      user.profile?.skills || []
    );

    // Experience Match
    scores.experienceMatch = calculateExperienceLevelMatch(
      attrs.experienceLevel || 'Mid-Level',
      user.profile?.experienceLevel || 'Mid-Level'
    );

    // Availability Match (simplified - check if user is available)
    scores.availabilityMatch = 100; // Assume available for POC

    // Budget Compatibility
    const userRate = user.profile?.hourlyRate || user.profile?.dailyRate || 0;
    const budgetMin = attrs.budgetRange?.min || 0;
    const budgetMax = attrs.budgetRange?.max || Infinity;
    scores.budgetCompatibility = (userRate >= budgetMin && userRate <= budgetMax) ? 100 : 50;

    // Location Compatibility
    scores.locationCompatibility = calculateGeographicProximity(
      { city: attrs.locationRequirement },
      user.profile?.location
    );

    // Calculate final score
    const weights = { skillMatchScore: 0.30, experienceMatch: 0.25, availabilityMatch: 0.20, 
                      budgetCompatibility: 0.15, locationCompatibility: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 1.2: Consortium Matching
  // ============================================
  function matchConsortium(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Scope Match Score
    const memberRoles = attrs.memberRoles || [];
    const userServices = user.profile?.services || [];
    const matchedRoles = memberRoles.filter(role => 
      userServices.some(service => 
        service.toLowerCase().includes((role.role || '').toLowerCase())
      )
    );
    scores.scopeMatchScore = memberRoles.length > 0 
      ? Math.round((matchedRoles.length / memberRoles.length) * 100) 
      : 50;

    // Financial Capacity
    scores.financialCapacity = checkFinancialCapacity(
      attrs.minimumRequirements?.find(r => r.type === 'Financial'),
      user
    ) ? 100 : 0;

    // Experience Match
    scores.experienceMatch = user.profile?.yearsInBusiness >= 5 ? 100 : 50;

    // Geographic Proximity
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.projectLocation },
      user.profile?.location
    );

    // Prequalification Status
    scores.prequalificationStatus = attrs.prequalificationRequired 
      ? (user.profile?.credentials?.some(c => c.verified) ? 100 : 0)
      : 100;

    // Past Collaboration Score
    scores.pastCollaborationScore = getPastPerformanceScore(user.id, '1.2');

    // Calculate final score
    const weights = { scopeMatchScore: 0.25, financialCapacity: 0.20, experienceMatch: 0.20,
                      geographicProximity: 0.15, prequalificationStatus: 0.10, pastCollaborationScore: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 1.3: Project-Specific JV Matching
  // ============================================
  function matchProjectJV(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Complementary Capabilities
    const partnerRoles = attrs.partnerRoles || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matchedCapabilities = partnerRoles.filter(role => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((role.contribution || '').toLowerCase())
      )
    );
    scores.complementaryCapabilities = partnerRoles.length > 0
      ? Math.round((matchedCapabilities.length / partnerRoles.length) * 100)
      : 50;

    // Financial Capacity
    scores.financialCapacity = checkFinancialCapacity(
      attrs.capitalContribution,
      user
    ) ? 100 : 0;

    // Strategic Fit (simplified)
    scores.strategicFit = 75; // Neutral for POC

    // Experience Match
    scores.experienceMatch = user.profile?.yearsInBusiness >= 5 ? 100 : 50;

    // Risk Tolerance (simplified)
    scores.riskTolerance = 75; // Neutral for POC

    // Past JV Performance
    scores.pastJVPerformance = getPastPerformanceScore(user.id, '1.3');

    // Equity Alignment (simplified - assumes compatible)
    scores.equityAlignment = 100;

    // Calculate final score
    const weights = { complementaryCapabilities: 0.25, financialCapacity: 0.20, strategicFit: 0.15,
                      experienceMatch: 0.15, riskTolerance: 0.10, pastJVPerformance: 0.10, equityAlignment: 0.05 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 1.4: SPV Matching
  // ============================================
  function matchSPV(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Financial Capacity (critical for SPV)
    const requiredEquity = attrs.equityStructure?.reduce((sum, e) => sum + (e.percentage || 0), 0) || 0;
    scores.financialCapacity = checkFinancialCapacity(requiredEquity, user) ? 100 : 0;

    // Project Experience (mega-projects >= 50M)
    const keyProjects = user.profile?.keyProjects || [];
    const megaProjects = keyProjects.filter(p => (p.value || 0) >= 50000000);
    scores.projectExperience = megaProjects.length > 0 ? 100 : 0;

    // Sector Expertise
    const projectType = attrs.projectType || '';
    const userServices = user.profile?.services || [];
    scores.sectorExpertise = userServices.some(s => 
      s.toLowerCase().includes(projectType.toLowerCase())
    ) ? 100 : 50;

    // Risk Profile Alignment
    scores.riskProfileAlignment = 75; // Neutral for POC

    // Geographic Presence
    scores.geographicPresence = calculateGeographicProximity(
      { city: attrs.projectLocation },
      user.profile?.location
    );

    // Lender Relationships (simplified)
    scores.lenderRelationships = 75; // Neutral for POC

    // Calculate final score
    const weights = { financialCapacity: 0.25, projectExperience: 0.20, sectorExpertise: 0.20,
                      riskProfileAlignment: 0.15, geographicPresence: 0.10, lenderRelationships: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 2.1: Strategic JV Matching
  // ============================================
  function matchStrategicJV(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Strategic Alignment (simplified)
    scores.strategicAlignment = 75; // Would require deeper analysis

    // Complementary Strengths
    const partnerContributions = attrs.partnerContributions || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matched = partnerContributions.filter(contrib => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((contrib.contribution || '').toLowerCase())
      )
    );
    scores.complementaryStrengths = partnerContributions.length > 0
      ? Math.round((matched.length / partnerContributions.length) * 100)
      : 50;

    // Financial Capacity
    scores.financialCapacity = checkFinancialCapacity(attrs.initialCapital, user) ? 100 : 0;

    // Market Presence
    const geographicScope = attrs.geographicScope || [];
    const userLocation = user.profile?.location?.region || '';
    scores.marketPresence = geographicScope.some(scope => 
      scope.toLowerCase().includes(userLocation.toLowerCase())
    ) ? 100 : 50;

    // Technology Fit
    scores.technologyFit = 75; // Neutral for POC

    // Cultural Compatibility
    scores.culturalCompatibility = 75; // Neutral for POC

    // Calculate final score
    const weights = { strategicAlignment: 0.25, complementaryStrengths: 0.25, financialCapacity: 0.20,
                      marketPresence: 0.15, technologyFit: 0.10, culturalCompatibility: 0.05 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 2.2: Strategic Alliance Matching
  // ============================================
  function matchStrategicAlliance(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Capability Match
    const partnerReqs = attrs.partnerRequirements || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matched = partnerReqs.filter(req => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((req.requirement || '').toLowerCase())
      )
    );
    scores.capabilityMatch = partnerReqs.length > 0
      ? Math.round((matched.length / partnerReqs.length) * 100)
      : 50;

    // Geographic Coverage
    const geographicScope = attrs.geographicScope || [];
    const userLocation = user.profile?.location?.region || '';
    scores.geographicCoverage = geographicScope.some(scope => 
      scope.toLowerCase().includes(userLocation.toLowerCase())
    ) ? 100 : 50;

    // Capacity Match
    scores.capacityMatch = user.profile?.capacity?.concurrentProjects > 0 ? 100 : 50;

    // Quality Standards
    scores.qualityStandards = user.profile?.credentials?.some(c => c.verified) ? 100 : 50;

    // Financial Stability
    scores.financialStability = checkFinancialCapacity(null, user) ? 100 : 50;

    // Past Alliance Performance
    scores.pastAlliancePerformance = getPastPerformanceScore(user.id, '2.2');

    // Calculate final score
    const weights = { capabilityMatch: 0.25, geographicCoverage: 0.20, capacityMatch: 0.20,
                      qualityStandards: 0.15, financialStability: 0.10, pastAlliancePerformance: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 2.3: Mentorship Matching
  // ============================================
  function matchMentorship(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Expertise Match
    const targetSkills = attrs.targetSkills || [];
    const userSkills = user.profile?.skills || [];
    scores.expertiseMatch = calculateSkillMatchScore(targetSkills, userSkills);

    // Experience Gap (mentor should have 5+ years more experience)
    const menteeLevel = attrs.experienceLevel || 'Junior';
    const mentorLevel = user.profile?.experienceLevel || 'Mid-Level';
    const levelHierarchy = { 'Entry-Level': 1, 'Junior': 2, 'Mid-Level': 3, 'Senior': 4 };
    const gap = (levelHierarchy[mentorLevel] || 2) - (levelHierarchy[menteeLevel] || 1);
    scores.experienceGap = gap >= 2 ? 100 : (gap >= 1 ? 75 : 0);

    // Availability Match
    scores.availabilityMatch = 100; // Assume available for POC

    // Industry Match
    const mentorshipType = attrs.mentorshipType || '';
    const userServices = user.profile?.services || [];
    scores.industryMatch = userServices.some(s => 
      s.toLowerCase().includes(mentorshipType.toLowerCase())
    ) ? 100 : 50;

    // Geographic Proximity (if in-person)
    if (attrs.format === 'In-Person' || attrs.format === 'Hybrid') {
      scores.geographicProximity = calculateGeographicProximity(
        { city: attrs.location },
        user.profile?.location
      );
    } else {
      scores.geographicProximity = 100; // Remote doesn't need proximity
    }

    // Calculate final score
    const weights = { expertiseMatch: 0.30, experienceGap: 0.25, availabilityMatch: 0.20,
                      industryMatch: 0.15, geographicProximity: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 3.1: Bulk Purchasing Matching
  // ============================================
  function matchBulkPurchasing(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Quantity Alignment (simplified)
    scores.quantityAlignment = 75; // Neutral for POC

    // Timeline Alignment
    scores.timelineAlignment = 100; // Assume compatible for POC

    // Geographic Proximity
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.deliveryLocation },
      user.profile?.location
    );

    // Payment Capacity
    scores.paymentCapacity = checkFinancialCapacity(attrs.targetPrice, user) ? 100 : 50;

    // Reliability Score
    scores.reliabilityScore = getPastPerformanceScore(user.id, '3.1');

    // Calculate final score
    const weights = { quantityAlignment: 0.25, timelineAlignment: 0.25, geographicProximity: 0.20,
                      paymentCapacity: 0.15, reliabilityScore: 0.15 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 3.2: Co-Ownership Matching
  // ============================================
  function matchCoOwnership(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Financial Capacity
    scores.financialCapacity = checkFinancialCapacity(attrs.initialInvestment, user) ? 100 : 0;

    // Usage Needs (simplified)
    scores.usageNeeds = 75; // Neutral for POC

    // Geographic Proximity
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.assetLocation },
      user.profile?.location
    );

    // Reliability Score
    scores.reliabilityScore = getPastPerformanceScore(user.id, '3.2');

    // Maintenance Capability
    scores.maintenanceCapability = user.profile?.services?.some(s => 
      s.toLowerCase().includes('maintenance') || s.toLowerCase().includes('service')
    ) ? 100 : 50;

    // Calculate final score
    const weights = { financialCapacity: 0.30, usageNeeds: 0.25, geographicProximity: 0.20,
                      reliabilityScore: 0.15, maintenanceCapability: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 3.3: Resource Exchange Matching
  // ============================================
  function matchResourceExchange(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Resource Match
    const resourceType = attrs.resourceType || '';
    const userServices = user.profile?.services || [];
    const userSkills = user.profile?.skills || [];
    const allUserResources = [...userServices, ...userSkills];
    scores.resourceMatch = allUserResources.some(r => 
      r.toLowerCase().includes(resourceType.toLowerCase())
    ) ? 100 : 50;

    // Barter Compatibility (if barter transaction)
    if (attrs.transactionType === 'Barter') {
      const barterPrefs = attrs.barterPreferences || [];
      scores.barterCompatibility = barterPrefs.length > 0 ? 75 : 50;
    } else {
      scores.barterCompatibility = 100;
    }

    // Geographic Proximity
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.location },
      user.profile?.location
    );

    // Timeline Alignment
    scores.timelineAlignment = 100; // Assume compatible for POC

    // Price Compatibility
    if (attrs.price) {
      scores.priceCompatibility = 75; // Neutral for POC
    } else {
      scores.priceCompatibility = 100;
    }

    // Condition Match (if applicable)
    if (attrs.condition) {
      scores.conditionMatch = 100; // Assume acceptable for POC
    } else {
      scores.conditionMatch = 100;
    }

    // Calculate final score
    const weights = { resourceMatch: 0.30, barterCompatibility: 0.20, geographicProximity: 0.20,
                      timelineAlignment: 0.15, priceCompatibility: 0.10, conditionMatch: 0.05 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 4.1: Professional Hiring Matching
  // ============================================
  function matchProfessionalHiring(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Qualification Match
    const requiredQuals = attrs.requiredQualifications || [];
    const userCerts = user.profile?.certifications || [];
    const matchedQuals = requiredQuals.filter(req => 
      userCerts.some(cert => 
        cert.name?.toLowerCase().includes(req.toLowerCase())
      )
    );
    scores.qualificationMatch = requiredQuals.length > 0
      ? Math.round((matchedQuals.length / requiredQuals.length) * 100)
      : 100;

    // Experience Match
    const requiredExp = attrs.requiredExperience || 0;
    const userExp = user.profile?.yearsInBusiness || 0;
    scores.experienceMatch = userExp >= requiredExp ? 100 : Math.round((userExp / requiredExp) * 100);

    // Skill Match Score
    scores.skillMatchScore = calculateSkillMatchScore(
      attrs.requiredSkills || [],
      user.profile?.skills || []
    );

    // Location Compatibility
    scores.locationCompatibility = calculateGeographicProximity(
      { city: attrs.location },
      user.profile?.location
    );

    // Salary Compatibility
    const salaryRange = attrs.salaryRange || {};
    const userExpected = user.profile?.expectedSalary || 0;
    scores.salaryCompatibility = (userExpected >= salaryRange.min && userExpected <= salaryRange.max) 
      ? 100 : 50;

    // Availability Match
    scores.availabilityMatch = 100; // Assume available for POC

    // Calculate final score
    const weights = { qualificationMatch: 0.20, experienceMatch: 0.20, skillMatchScore: 0.30,
                      locationCompatibility: 0.15, salaryCompatibility: 0.10, availabilityMatch: 0.05 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 4.2: Consultant Hiring Matching
  // ============================================
  function matchConsultantHiring(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Expertise Match
    const requiredExpertise = attrs.requiredExpertise || [];
    const userSkills = user.profile?.skills || [];
    scores.expertiseMatch = calculateSkillMatchScore(requiredExpertise, userSkills);

    // Experience Match
    const expLevel = attrs.experienceLevel || 'Mid-Level';
    const userLevel = user.profile?.experienceLevel || 'Mid-Level';
    scores.experienceMatch = calculateExperienceLevelMatch(expLevel, userLevel);

    // Certification Match
    const requiredCerts = attrs.requiredCertifications || [];
    const userCerts = user.profile?.certifications || [];
    const matchedCerts = requiredCerts.filter(req => 
      userCerts.some(cert => 
        cert.name?.toLowerCase().includes(req.toLowerCase())
      )
    );
    scores.certificationMatch = requiredCerts.length > 0
      ? Math.round((matchedCerts.length / requiredCerts.length) * 100)
      : 100;

    // Availability Match
    scores.availabilityMatch = 100; // Assume available for POC

    // Budget Compatibility
    const budget = attrs.budget || {};
    const userRate = user.profile?.hourlyRate || user.profile?.dailyRate || 0;
    scores.budgetCompatibility = (userRate >= budget.min && userRate <= budget.max) ? 100 : 50;

    // Location Compatibility
    scores.locationCompatibility = calculateGeographicProximity(
      { city: attrs.locationRequirement },
      user.profile?.location
    );

    // Calculate final score
    const weights = { expertiseMatch: 0.30, experienceMatch: 0.20, certificationMatch: 0.15,
                      availabilityMatch: 0.15, budgetCompatibility: 0.10, locationCompatibility: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Model 5.1: Competition/RFP Matching
  // ============================================
  function matchCompetition(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Eligibility Match
    const eligibilityCriteria = attrs.eligibilityCriteria || [];
    const userQuals = [
      ...(user.profile?.certifications || []).map(c => c.name),
      ...(user.profile?.skills || []),
      ...(user.profile?.services || [])
    ];
    const matched = eligibilityCriteria.filter(crit => 
      userQuals.some(qual => 
        qual.toLowerCase().includes((crit.criterion || '').toLowerCase())
      )
    );
    scores.eligibilityMatch = eligibilityCriteria.length > 0
      ? Math.round((matched.length / eligibilityCriteria.length) * 100)
      : 100;

    // Capability Match
    const submissionReqs = attrs.submissionRequirements || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matchedCaps = submissionReqs.filter(req => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes(req.toLowerCase())
      )
    );
    scores.capabilityMatch = submissionReqs.length > 0
      ? Math.round((matchedCaps.length / submissionReqs.length) * 100)
      : 50;

    // Past Performance
    scores.pastPerformance = getPastPerformanceScore(user.id, '5.1');

    // Financial Capacity
    scores.financialCapacity = checkFinancialCapacity(null, user) ? 100 : 50;

    // Geographic Proximity
    scores.geographicProximity = 75; // Neutral for competitions

    // Calculate final score
    const weights = { eligibilityMatch: 0.30, capabilityMatch: 0.25, pastPerformance: 0.20,
                      financialCapacity: 0.15, geographicProximity: 0.10 };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Unified Matching Function
  // ============================================
  function matchCollaborationOpportunity(opportunityId, userId) {
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    const user = PMTwinData.Users.getById(userId);

    if (!opportunity || !user) {
      return null;
    }

    // Check relationship type compatibility
    const model = CollaborationModels.getModel(opportunity.modelType);
    if (!model || !model.applicability.includes(opportunity.relationshipType)) {
      return null;
    }

    // Route to appropriate matching function
    let matchResult;
    switch (opportunity.modelType) {
      case '1.1':
        matchResult = matchTaskBasedEngagement(opportunity, user);
        break;
      case '1.2':
        matchResult = matchConsortium(opportunity, user);
        break;
      case '1.3':
        matchResult = matchProjectJV(opportunity, user);
        break;
      case '1.4':
        matchResult = matchSPV(opportunity, user);
        break;
      case '2.1':
        matchResult = matchStrategicJV(opportunity, user);
        break;
      case '2.2':
        matchResult = matchStrategicAlliance(opportunity, user);
        break;
      case '2.3':
        matchResult = matchMentorship(opportunity, user);
        break;
      case '3.1':
        matchResult = matchBulkPurchasing(opportunity, user);
        break;
      case '3.2':
        matchResult = matchCoOwnership(opportunity, user);
        break;
      case '3.3':
        matchResult = matchResourceExchange(opportunity, user);
        break;
      case '4.1':
        matchResult = matchProfessionalHiring(opportunity, user);
        break;
      case '4.2':
        matchResult = matchConsultantHiring(opportunity, user);
        break;
      case '5.1':
        matchResult = matchCompetition(opportunity, user);
        break;
      default:
        return null;
    }

    if (!matchResult) {
      return null;
    }

    // Create match record if meets threshold
    if (matchResult.meetsThreshold) {
      // Use projectId field for compatibility, but store opportunityId in metadata
      const match = PMTwinData.Matches.create({
        projectId: opportunityId, // Reuse projectId field for compatibility
        providerId: userId,
        score: matchResult.finalScore,
        criteria: matchResult.scores,
        weights: {}, // Will be populated by model-specific weights
        // Store collaboration-specific data
        opportunityId: opportunityId,
        modelType: opportunity.modelType,
        opportunityType: 'collaboration'
      });

      if (match) {
        // Create notification
        PMTwinData.Notifications.create({
          userId: userId,
          type: 'collaboration_match_found',
          title: 'New Collaboration Match!',
          message: `You have a ${matchResult.finalScore}% match for "${opportunity.modelName || opportunity.modelType}"`,
          relatedEntityType: 'collaboration_match',
          relatedEntityId: match.id,
          actionUrl: `#/user-portal/collaboration-opportunities/${opportunityId}`,
          actionLabel: 'View Opportunity'
        });

        PMTwinData.Matches.markAsNotified(match.id);
      }

      return match;
    }

    return null;
  }

  // ============================================
  // Find Matches for Opportunity
  // ============================================
  function findMatchesForOpportunity(opportunityId) {
    const opportunity = PMTwinData.CollaborationOpportunities.getById(opportunityId);
    if (!opportunity || opportunity.status !== 'active') {
      return [];
    }

    // Get eligible users based on relationship type
    let eligibleUsers = [];
    if (opportunity.relationshipType === 'B2B' || opportunity.relationshipType === 'B2P') {
      eligibleUsers = PMTwinData.Users.getByRole('entity')
        .filter(u => u.profile?.status === 'approved');
    }
    if (opportunity.relationshipType === 'P2B' || opportunity.relationshipType === 'P2P') {
      const individuals = PMTwinData.Users.getByRole('individual')
        .filter(u => u.profile?.status === 'approved');
      eligibleUsers = [...eligibleUsers, ...individuals];
    }

    const matches = [];
    eligibleUsers.forEach(user => {
      // Skip if user is the creator
      if (user.id === opportunity.creatorId) {
        return;
      }

      const match = matchCollaborationOpportunity(opportunityId, user.id);
      if (match) {
        matches.push(match);
      }
    });

    // Update opportunity match count
    if (matches.length > 0) {
      PMTwinData.CollaborationOpportunities.update(opportunityId, {
        matchesGenerated: (opportunity.matchesGenerated || 0) + matches.length
      });
    }

    return matches;
  }

  // ============================================
  // Trigger Matching for New Opportunity
  // ============================================
  function triggerCollaborationMatching(opportunityId) {
    setTimeout(() => {
      const matches = findMatchesForOpportunity(opportunityId);
      console.log(`Collaboration matching completed: ${matches.length} matches found for opportunity ${opportunityId}`);
      return matches;
    }, 100);
  }

  // ============================================
  // Public API
  // ============================================
  window.CollaborationMatching = {
    matchCollaborationOpportunity,
    findMatchesForOpportunity,
    triggerCollaborationMatching,
    // Individual matching functions (for testing/debugging)
    matchTaskBasedEngagement,
    matchConsortium,
    matchProjectJV,
    matchSPV,
    matchStrategicJV,
    matchStrategicAlliance,
    matchMentorship,
    matchBulkPurchasing,
    matchCoOwnership,
    matchResourceExchange,
    matchProfessionalHiring,
    matchConsultantHiring,
    matchCompetition
  };

})();

