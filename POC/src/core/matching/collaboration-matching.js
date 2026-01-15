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
    // Query past collaboration performance from completed collaborations
    const applications = PMTwinData.CollaborationApplications.getAll();
    const userApplications = applications.filter(app => 
      app.applicantId === userId && 
      app.status === 'completed' &&
      (app.modelType === modelType || !modelType)
    );
    
    if (userApplications.length === 0) {
      return 75; // Neutral score if no past performance
    }
    
    // Calculate average performance based on completed collaborations
    // In production, would consider ratings, on-time delivery, etc.
    const completedCount = userApplications.length;
    const approvedCount = applications.filter(app => 
      app.applicantId === userId && app.status === 'approved'
    ).length;
    
    // Base score on completion rate and approval rate
    const completionRate = (completedCount / Math.max(1, completedCount + approvedCount)) * 100;
    return Math.round(50 + (completionRate * 0.5)); // Scale to 50-100
  }

  function calculateStrategicAlignment(opportunityGoals, userProfile) {
    // Analyze alignment of goals and objectives
    const opportunityObjectives = opportunityGoals || [];
    const userServices = userProfile?.services || [];
    const userSkills = userProfile?.skills || [];
    const userCapabilities = [...userServices, ...userSkills];
    
    if (opportunityObjectives.length === 0) return 75; // Neutral if no goals specified
    
    // Simple keyword matching for POC - in production would use NLP
    const matched = opportunityObjectives.filter(goal => {
      const goalText = (goal.goal || goal).toLowerCase();
      return userCapabilities.some(cap => 
        cap.toLowerCase().includes(goalText) || 
        goalText.includes(cap.toLowerCase())
      );
    });
    
    return Math.round((matched.length / opportunityObjectives.length) * 100);
  }

  function calculateCulturalCompatibility(opportunityAttrs, userProfile) {
    // Assess organizational culture fit
    // In POC, simplified check based on company size, years in business, values
    const userYears = userProfile?.yearsInBusiness || 0;
    const oppYears = opportunityAttrs?.partnerYearsInBusiness || 0;
    
    // Size compatibility (simplified)
    const userSize = userProfile?.companySize || 'medium';
    const oppSize = opportunityAttrs?.preferredCompanySize || userSize;
    
    let score = 50; // Base score
    
    // Years in business alignment (within 5 years = good match)
    if (Math.abs(userYears - oppYears) <= 5) {
      score += 25;
    } else if (Math.abs(userYears - oppYears) <= 10) {
      score += 15;
    }
    
    // Size compatibility
    if (userSize === oppSize) {
      score += 25;
    }
    
    return Math.min(100, score);
  }

  function calculateBarterCompatibility(opportunityBarterPrefs, userBarterOffers) {
    // Evaluate barter exchange compatibility
    if (!opportunityBarterPrefs || opportunityBarterPrefs.length === 0) {
      return 100; // No barter requirement
    }
    
    if (!userBarterOffers || userBarterOffers.length === 0) {
      return 0; // User has no barter offers
    }
    
    // Match barter preferences with user's barter offers
    const matched = opportunityBarterPrefs.filter(pref => {
      const prefText = (pref.preference || pref).toLowerCase();
      return userBarterOffers.some(offer => {
        const offerText = (offer.offer || offer).toLowerCase();
        return offerText.includes(prefText) || prefText.includes(offerText);
      });
    });
    
    return Math.round((matched.length / opportunityBarterPrefs.length) * 100);
  }

  function calculateTimelineAlignment(opportunityTimeline, userAvailability) {
    // Match project timelines and availability
    if (!opportunityTimeline || !userAvailability) {
      return 75; // Neutral if not specified
    }
    
    const oppStart = new Date(opportunityTimeline.startDate || opportunityTimeline.start);
    const oppEnd = new Date(opportunityTimeline.endDate || opportunityTimeline.end);
    const userStart = new Date(userAvailability.startDate || userAvailability.start);
    const userEnd = new Date(userAvailability.endDate || userAvailability.end);
    
    // Check if timelines overlap
    if (userStart <= oppEnd && userEnd >= oppStart) {
      // Calculate overlap percentage
      const overlapStart = new Date(Math.max(oppStart, userStart));
      const overlapEnd = new Date(Math.min(oppEnd, userEnd));
      const overlapDuration = overlapEnd - overlapStart;
      const oppDuration = oppEnd - oppStart;
      
      if (oppDuration > 0) {
        const overlapPercentage = (overlapDuration / oppDuration) * 100;
        return Math.round(Math.min(100, overlapPercentage));
      }
    }
    
    return 0; // No overlap
  }

  function calculateInnovationScore(userId, modelType) {
    // Assess innovation capabilities and track record
    const user = PMTwinData.Users.getById(userId);
    if (!user) return 50;
    
    let score = 50; // Base score
    
    // Check for innovation-related certifications
    const certs = user.profile?.certifications || [];
    const innovationCerts = certs.filter(cert => {
      const certName = (cert.name || '').toLowerCase();
      return certName.includes('innovation') || 
             certName.includes('research') || 
             certName.includes('development');
    });
    if (innovationCerts.length > 0) score += 20;
    
    // Check for past competition wins
    const applications = PMTwinData.CollaborationApplications.getAll();
    const competitionWins = applications.filter(app => 
      app.applicantId === userId && 
      app.modelType === '5.1' && 
      app.status === 'approved'
    );
    if (competitionWins.length > 0) score += 30;
    
    // Check for innovation-related skills
    const skills = user.profile?.skills || [];
    const innovationSkills = skills.filter(skill => {
      const skillText = skill.toLowerCase();
      return skillText.includes('innovation') || 
             skillText.includes('research') || 
             skillText.includes('development') ||
             skillText.includes('design thinking');
    });
    if (innovationSkills.length > 0) score += 20;
    
    return Math.min(100, score);
  }

  function calculateFinancialCapacityScore(requiredAmount, userProfile) {
    // Calculate financial capacity score (0-100)
    if (!requiredAmount || requiredAmount === 0) return 100;
    
    const userRevenue = userProfile?.annualRevenueRange || '';
    const userRevenueNum = parseRevenueRange(userRevenue);
    
    if (userRevenueNum === 0) return 0;
    
    // Check if user can handle the required amount
    // Rule: user should have at least 10x the required amount in annual revenue
    const capacityRatio = userRevenueNum / requiredAmount;
    
    if (capacityRatio >= 10) return 100;
    if (capacityRatio >= 5) return 80;
    if (capacityRatio >= 2) return 60;
    if (capacityRatio >= 1) return 40;
    return 20;
  }

  function parseRevenueRange(revenueStr) {
    // Parse revenue range string to number (e.g., "10M-50M" -> 10000000)
    if (!revenueStr) return 0;
    
    const str = revenueStr.toString().toUpperCase();
    const match = str.match(/(\d+(?:\.\d+)?)\s*([MBK])/);
    if (!match) return 0;
    
    const num = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'B': return num * 1000000000;
      case 'M': return num * 1000000;
      case 'K': return num * 1000;
      default: return num;
    }
  }

  // ============================================
  // Model 1.1: Task-Based Engagement Matching
  // ============================================
  function matchTaskBasedEngagement(opportunity, user) {
    const attrs = opportunity.attributes || {};
    const scores = {};

    // Skill/Scope Match Score (Primary Metric)
    const requiredSkills = attrs.requiredSkills || [];
    const taskScope = attrs.detailedScope || '';
    const userSkills = user.profile?.skills || [];
    const userServices = user.profile?.services || [];
    const userCapabilities = [...userSkills, ...userServices];
    
    // Calculate skill match
    const skillMatch = calculateSkillMatchScore(requiredSkills, userSkills);
    
    // Calculate scope match (check if user capabilities match task scope)
    let scopeMatch = 50; // Base score
    if (taskScope) {
      const scopeKeywords = taskScope.toLowerCase().split(/\s+/);
      const matchedKeywords = scopeKeywords.filter(keyword => 
        keyword.length > 3 && userCapabilities.some(cap => 
          cap.toLowerCase().includes(keyword)
        )
      );
      scopeMatch = Math.min(100, 50 + (matchedKeywords.length * 5));
    }
    
    scores.skillScopeMatchScore = Math.round((skillMatch * 0.6 + scopeMatch * 0.4));

    // Financial Capacity (Primary Metric)
    const budgetMax = attrs.budgetRange?.max || attrs.budgetRange?.min || 0;
    scores.financialCapacity = calculateFinancialCapacityScore(budgetMax, user.profile);

    // Past Performance Score (Primary Metric)
    scores.pastPerformanceScore = getPastPerformanceScore(user.id, '1.1');

    // Calculate final score with specified weights
    const weights = { 
      skillScopeMatchScore: 0.50, 
      financialCapacity: 0.30, 
      pastPerformanceScore: 0.20 
    };
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

    // Skill/Scope Match Score (Primary Metric)
    const memberRoles = attrs.memberRoles || [];
    const projectScope = attrs.projectScope || attrs.projectDescription || '';
    const userServices = user.profile?.services || [];
    const userSkills = user.profile?.skills || [];
    const userCapabilities = [...userServices, ...userSkills];
    
    // Calculate role match
    const matchedRoles = memberRoles.filter(role => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((role.role || role).toLowerCase())
      )
    );
    const roleMatch = memberRoles.length > 0 
      ? Math.round((matchedRoles.length / memberRoles.length) * 100) 
      : 50;
    
    // Calculate scope match
    let scopeMatch = 50;
    if (projectScope) {
      const scopeKeywords = projectScope.toLowerCase().split(/\s+/);
      const matchedKeywords = scopeKeywords.filter(keyword => 
        keyword.length > 3 && userCapabilities.some(cap => 
          cap.toLowerCase().includes(keyword)
        )
      );
      scopeMatch = Math.min(100, 50 + (matchedKeywords.length * 3));
    }
    
    scores.skillScopeMatchScore = Math.round((roleMatch * 0.7 + scopeMatch * 0.3));

    // Financial Capacity (Primary Metric)
    const financialReq = attrs.minimumRequirements?.find(r => r.type === 'Financial');
    const requiredAmount = financialReq?.amount || financialReq?.value || 0;
    scores.financialCapacity = calculateFinancialCapacityScore(requiredAmount, user.profile);

    // Past Performance Score (Primary Metric)
    scores.pastPerformanceScore = getPastPerformanceScore(user.id, '1.2');

    // Calculate final score with specified weights
    const weights = { 
      skillScopeMatchScore: 0.50, 
      financialCapacity: 0.30, 
      pastPerformanceScore: 0.20 
    };
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

    // Skill/Scope Match Score (Primary Metric)
    const partnerRoles = attrs.partnerRoles || [];
    const projectScope = attrs.projectScope || attrs.projectDescription || '';
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    
    // Calculate role/contribution match
    const matchedCapabilities = partnerRoles.filter(role => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((role.contribution || role.role || role).toLowerCase())
      )
    );
    const roleMatch = partnerRoles.length > 0
      ? Math.round((matchedCapabilities.length / partnerRoles.length) * 100)
      : 50;
    
    // Calculate scope match
    let scopeMatch = 50;
    if (projectScope) {
      const scopeKeywords = projectScope.toLowerCase().split(/\s+/);
      const matchedKeywords = scopeKeywords.filter(keyword => 
        keyword.length > 3 && userCapabilities.some(cap => 
          cap.toLowerCase().includes(keyword)
        )
      );
      scopeMatch = Math.min(100, 50 + (matchedKeywords.length * 3));
    }
    
    scores.skillScopeMatchScore = Math.round((roleMatch * 0.7 + scopeMatch * 0.3));

    // Financial Capacity (Primary Metric)
    const capitalContribution = attrs.capitalContribution || attrs.equityContribution || 0;
    scores.financialCapacity = calculateFinancialCapacityScore(capitalContribution, user.profile);

    // Past Performance Score (Primary Metric)
    scores.pastPerformanceScore = getPastPerformanceScore(user.id, '1.3');

    // Calculate final score with specified weights
    const weights = { 
      skillScopeMatchScore: 0.50, 
      financialCapacity: 0.30, 
      pastPerformanceScore: 0.20 
    };
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

    // Skill/Scope Match Score (Primary Metric)
    const projectType = attrs.projectType || '';
    const projectScope = attrs.projectScope || attrs.projectDescription || '';
    const userServices = user.profile?.services || [];
    const userSkills = user.profile?.skills || [];
    const userCapabilities = [...userServices, ...userSkills];
    
    // Calculate sector/project type match
    const sectorMatch = userServices.some(s => 
      s.toLowerCase().includes(projectType.toLowerCase())
    ) ? 100 : 50;
    
    // Calculate scope match
    let scopeMatch = 50;
    if (projectScope) {
      const scopeKeywords = projectScope.toLowerCase().split(/\s+/);
      const matchedKeywords = scopeKeywords.filter(keyword => 
        keyword.length > 3 && userCapabilities.some(cap => 
          cap.toLowerCase().includes(keyword)
        )
      );
      scopeMatch = Math.min(100, 50 + (matchedKeywords.length * 3));
    }
    
    // Check for mega-project experience (>= 50M SAR)
    const keyProjects = user.profile?.keyProjects || [];
    const megaProjects = keyProjects.filter(p => (p.value || 0) >= 50000000);
    const experienceMatch = megaProjects.length > 0 ? 100 : 50;
    
    scores.skillScopeMatchScore = Math.round((sectorMatch * 0.4 + scopeMatch * 0.3 + experienceMatch * 0.3));

    // Financial Capacity (Primary Metric) - Critical for SPV
    const equityStructure = attrs.equityStructure || [];
    const totalEquity = equityStructure.reduce((sum, e) => sum + (e.amount || e.value || 0), 0);
    const projectValue = attrs.projectValue || attrs.totalProjectValue || totalEquity;
    scores.financialCapacity = calculateFinancialCapacityScore(projectValue, user.profile);

    // Past Performance Score (Primary Metric)
    scores.pastPerformanceScore = getPastPerformanceScore(user.id, '1.4');

    // Calculate final score with specified weights
    const weights = { 
      skillScopeMatchScore: 0.50, 
      financialCapacity: 0.30, 
      pastPerformanceScore: 0.20 
    };
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

    // Strategic Alignment (Primary Metric)
    const strategicGoals = attrs.strategicGoals || attrs.objectives || [];
    scores.strategicAlignment = calculateStrategicAlignment(strategicGoals, user.profile);

    // Complementary Strengths (Primary Metric)
    const partnerContributions = attrs.partnerContributions || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matched = partnerContributions.filter(contrib => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((contrib.contribution || contrib).toLowerCase())
      )
    );
    scores.complementaryStrengths = partnerContributions.length > 0
      ? Math.round((matched.length / partnerContributions.length) * 100)
      : 50;

    // Cultural Compatibility (Primary Metric)
    scores.culturalCompatibility = calculateCulturalCompatibility(attrs, user.profile);

    // Calculate final score with specified weights
    const weights = { 
      strategicAlignment: 0.40, 
      complementaryStrengths: 0.35, 
      culturalCompatibility: 0.25 
    };
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

    // Strategic Alignment (Primary Metric)
    const allianceGoals = attrs.allianceGoals || attrs.strategicObjectives || [];
    scores.strategicAlignment = calculateStrategicAlignment(allianceGoals, user.profile);

    // Complementary Strengths (Primary Metric)
    const partnerReqs = attrs.partnerRequirements || [];
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || [])
    ];
    const matched = partnerReqs.filter(req => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes((req.requirement || req).toLowerCase())
      )
    );
    scores.complementaryStrengths = partnerReqs.length > 0
      ? Math.round((matched.length / partnerReqs.length) * 100)
      : 50;

    // Cultural Compatibility (Primary Metric)
    scores.culturalCompatibility = calculateCulturalCompatibility(attrs, user.profile);

    // Calculate final score with specified weights
    const weights = { 
      strategicAlignment: 0.40, 
      complementaryStrengths: 0.35, 
      culturalCompatibility: 0.25 
    };
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

    // Strategic Alignment (Primary Metric) - Alignment of mentorship goals
    const mentorshipGoals = attrs.successMetrics || attrs.mentorshipObjectives || [];
    scores.strategicAlignment = calculateStrategicAlignment(mentorshipGoals, user.profile);

    // Complementary Strengths (Primary Metric) - Mentor's expertise vs mentee needs
    const targetSkills = attrs.targetSkills || [];
    const userSkills = user.profile?.skills || [];
    const userServices = user.profile?.services || [];
    const userCapabilities = [...userSkills, ...userServices];
    
    const matched = targetSkills.filter(skill => 
      userCapabilities.some(cap => 
        cap.toLowerCase().includes(skill.toLowerCase())
      )
    );
    scores.complementaryStrengths = targetSkills.length > 0
      ? Math.round((matched.length / targetSkills.length) * 100)
      : 50;

    // Cultural Compatibility (Primary Metric)
    scores.culturalCompatibility = calculateCulturalCompatibility(attrs, user.profile);

    // Calculate final score with specified weights
    const weights = { 
      strategicAlignment: 0.40, 
      complementaryStrengths: 0.35, 
      culturalCompatibility: 0.25 
    };
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

    // Timeline Alignment (Primary Metric)
    const opportunityTimeline = {
      startDate: attrs.requiredDeliveryDate || attrs.startDate,
      endDate: attrs.requiredDeliveryDate || attrs.endDate
    };
    const userAvailability = {
      startDate: user.profile?.availabilityStart || user.profile?.availableFrom,
      endDate: user.profile?.availabilityEnd || user.profile?.availableUntil
    };
    scores.timelineAlignment = calculateTimelineAlignment(opportunityTimeline, userAvailability);

    // Geographic Proximity (Primary Metric)
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.deliveryLocation || attrs.location },
      user.profile?.location
    );

    // Barter Compatibility Score (Primary Metric) - if barter transaction
    const isBarter = attrs.transactionType === 'Barter' || attrs.paymentMethod === 'Barter';
    if (isBarter) {
      const barterPrefs = attrs.barterPreferences || attrs.acceptedBarterTypes || [];
      const userBarterOffers = user.profile?.barterOffers || [];
      scores.barterCompatibility = calculateBarterCompatibility(barterPrefs, userBarterOffers);
    } else {
      scores.barterCompatibility = 100; // Not applicable for cash transactions
    }

    // Calculate final score with specified weights
    const weights = { 
      timelineAlignment: 0.40, 
      geographicProximity: 0.35, 
      barterCompatibility: 0.25 
    };
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

    // Timeline Alignment (Primary Metric)
    const opportunityTimeline = {
      startDate: attrs.ownershipStartDate || attrs.startDate,
      endDate: attrs.ownershipEndDate || attrs.endDate
    };
    const userAvailability = {
      startDate: user.profile?.availabilityStart || user.profile?.availableFrom,
      endDate: user.profile?.availabilityEnd || user.profile?.availableUntil
    };
    scores.timelineAlignment = calculateTimelineAlignment(opportunityTimeline, userAvailability);

    // Geographic Proximity (Primary Metric)
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.assetLocation || attrs.location },
      user.profile?.location
    );

    // Barter Compatibility Score (Primary Metric) - if barter transaction
    const isBarter = attrs.transactionType === 'Barter' || attrs.paymentMethod === 'Barter';
    if (isBarter) {
      const barterPrefs = attrs.barterPreferences || attrs.acceptedBarterTypes || [];
      const userBarterOffers = user.profile?.barterOffers || [];
      scores.barterCompatibility = calculateBarterCompatibility(barterPrefs, userBarterOffers);
    } else {
      scores.barterCompatibility = 100; // Not applicable for cash transactions
    }

    // Calculate final score with specified weights
    const weights = { 
      timelineAlignment: 0.40, 
      geographicProximity: 0.35, 
      barterCompatibility: 0.25 
    };
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

    // Timeline Alignment (Primary Metric)
    const opportunityTimeline = {
      startDate: attrs.exchangeStartDate || attrs.startDate,
      endDate: attrs.exchangeEndDate || attrs.endDate
    };
    const userAvailability = {
      startDate: user.profile?.availabilityStart || user.profile?.availableFrom,
      endDate: user.profile?.availabilityEnd || user.profile?.availableUntil
    };
    scores.timelineAlignment = calculateTimelineAlignment(opportunityTimeline, userAvailability);

    // Geographic Proximity (Primary Metric)
    scores.geographicProximity = calculateGeographicProximity(
      { city: attrs.location || attrs.exchangeLocation },
      user.profile?.location
    );

    // Barter Compatibility Score (Primary Metric) - Most resource exchanges are barter-based
    const isBarter = attrs.transactionType === 'Barter' || attrs.paymentMethod === 'Barter' || !attrs.price;
    if (isBarter) {
      const barterPrefs = attrs.barterPreferences || attrs.acceptedBarterTypes || attrs.wantedResources || [];
      const userBarterOffers = user.profile?.barterOffers || user.profile?.availableResources || [];
      scores.barterCompatibility = calculateBarterCompatibility(barterPrefs, userBarterOffers);
    } else {
      scores.barterCompatibility = 100; // Not applicable for cash transactions
    }

    // Calculate final score with specified weights
    const weights = { 
      timelineAlignment: 0.40, 
      geographicProximity: 0.35, 
      barterCompatibility: 0.25 
    };
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

    // Qualification/Skill Match (Primary Metric)
    const requiredQuals = attrs.requiredQualifications || [];
    const requiredSkills = attrs.requiredSkills || [];
    const userCerts = user.profile?.certifications || [];
    const userSkills = user.profile?.skills || [];
    
    // Calculate qualification match
    const matchedQuals = requiredQuals.filter(req => 
      userCerts.some(cert => 
        cert.name?.toLowerCase().includes(req.toLowerCase())
      )
    );
    const qualMatch = requiredQuals.length > 0
      ? Math.round((matchedQuals.length / requiredQuals.length) * 100)
      : 100;
    
    // Calculate skill match
    const skillMatch = calculateSkillMatchScore(requiredSkills, userSkills);
    
    // Combined qualification/skill match
    const totalReqs = requiredQuals.length + requiredSkills.length;
    if (totalReqs > 0) {
      scores.qualificationSkillMatch = Math.round(
        (qualMatch * (requiredQuals.length / totalReqs)) + 
        (skillMatch * (requiredSkills.length / totalReqs))
      );
    } else {
      scores.qualificationSkillMatch = 100;
    }

    // Availability (Primary Metric)
    const opportunityTimeline = {
      startDate: attrs.startDate || attrs.employmentStartDate,
      endDate: attrs.endDate || attrs.employmentEndDate
    };
    const userAvailability = {
      startDate: user.profile?.availabilityStart || user.profile?.availableFrom,
      endDate: user.profile?.availabilityEnd || user.profile?.availableUntil
    };
    scores.availability = calculateTimelineAlignment(opportunityTimeline, userAvailability);

    // Budget/Salary Compatibility (Primary Metric)
    const salaryRange = attrs.salaryRange || {};
    const userExpected = user.profile?.expectedSalary || 0;
    if (salaryRange.min && salaryRange.max) {
      // Check if user's expected salary is within range
      if (userExpected >= salaryRange.min && userExpected <= salaryRange.max) {
        scores.budgetSalaryCompatibility = 100;
      } else if (userExpected < salaryRange.min) {
        // User expects less - good for employer
        scores.budgetSalaryCompatibility = 90;
      } else {
        // User expects more - calculate compatibility
        const diff = userExpected - salaryRange.max;
        const rangeSize = salaryRange.max - salaryRange.min;
        scores.budgetSalaryCompatibility = Math.max(0, 100 - (diff / rangeSize) * 50);
      }
    } else {
      scores.budgetSalaryCompatibility = 75; // Neutral if not specified
    }

    // Calculate final score with specified weights
    const weights = { 
      qualificationSkillMatch: 0.50, 
      availability: 0.25, 
      budgetSalaryCompatibility: 0.25 
    };
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

    // Qualification/Skill Match (Primary Metric)
    const requiredExpertise = attrs.requiredExpertise || [];
    const requiredCerts = attrs.requiredCertifications || [];
    const userSkills = user.profile?.skills || [];
    const userCerts = user.profile?.certifications || [];
    
    // Calculate expertise/skill match
    const expertiseMatch = calculateSkillMatchScore(requiredExpertise, userSkills);
    
    // Calculate certification match
    const matchedCerts = requiredCerts.filter(req => 
      userCerts.some(cert => 
        cert.name?.toLowerCase().includes(req.toLowerCase())
      )
    );
    const certMatch = requiredCerts.length > 0
      ? Math.round((matchedCerts.length / requiredCerts.length) * 100)
      : 100;
    
    // Combined qualification/skill match
    const totalReqs = requiredExpertise.length + requiredCerts.length;
    if (totalReqs > 0) {
      scores.qualificationSkillMatch = Math.round(
        (expertiseMatch * (requiredExpertise.length / totalReqs)) + 
        (certMatch * (requiredCerts.length / totalReqs))
      );
    } else {
      scores.qualificationSkillMatch = 100;
    }

    // Availability (Primary Metric)
    const opportunityTimeline = {
      startDate: attrs.startDate || attrs.consultationStartDate,
      endDate: attrs.endDate || attrs.consultationEndDate || attrs.duration
    };
    const userAvailability = {
      startDate: user.profile?.availabilityStart || user.profile?.availableFrom,
      endDate: user.profile?.availabilityEnd || user.profile?.availableUntil
    };
    scores.availability = calculateTimelineAlignment(opportunityTimeline, userAvailability);

    // Budget/Salary Compatibility (Primary Metric)
    const budget = attrs.budget || {};
    const userRate = user.profile?.hourlyRate || user.profile?.dailyRate || 0;
    if (budget.min && budget.max) {
      if (userRate >= budget.min && userRate <= budget.max) {
        scores.budgetSalaryCompatibility = 100;
      } else if (userRate < budget.min) {
        scores.budgetSalaryCompatibility = 90; // User charges less - good for client
      } else {
        const diff = userRate - budget.max;
        const rangeSize = budget.max - budget.min;
        scores.budgetSalaryCompatibility = Math.max(0, 100 - (diff / rangeSize) * 50);
      }
    } else {
      scores.budgetSalaryCompatibility = 75; // Neutral if not specified
    }

    // Calculate final score with specified weights
    const weights = { 
      qualificationSkillMatch: 0.50, 
      availability: 0.25, 
      budgetSalaryCompatibility: 0.25 
    };
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

    // Technical (Primary Metric) - Technical capability and past performance
    const technicalReqs = attrs.technicalRequirements || attrs.submissionRequirements || [];
    const eligibilityCriteria = attrs.eligibilityCriteria || [];
    const allTechnicalReqs = [...technicalReqs, ...eligibilityCriteria];
    
    const userCapabilities = [
      ...(user.profile?.services || []),
      ...(user.profile?.skills || []),
      ...(user.profile?.certifications || []).map(c => c.name)
    ];
    
    const matchedTechnical = allTechnicalReqs.filter(req => {
      const reqText = (req.requirement || req.criterion || req).toLowerCase();
      return userCapabilities.some(cap => 
        cap.toLowerCase().includes(reqText) || reqText.includes(cap.toLowerCase())
      );
    });
    
    const technicalMatch = allTechnicalReqs.length > 0
      ? Math.round((matchedTechnical.length / allTechnicalReqs.length) * 100)
      : 50;
    
    // Past performance contributes to technical score
    const pastPerformance = getPastPerformanceScore(user.id, '5.1');
    scores.technical = Math.round((technicalMatch * 0.7 + pastPerformance * 0.3));

    // Price (Primary Metric) - Price competitiveness
    const budget = attrs.budget || attrs.maxBudget || {};
    const userRate = user.profile?.hourlyRate || user.profile?.dailyRate || user.profile?.projectRate || 0;
    
    if (budget.max || budget) {
      const maxBudget = budget.max || budget;
      if (userRate <= maxBudget) {
        // User's rate is within or below budget - calculate competitiveness
        const priceRatio = userRate / maxBudget;
        scores.price = Math.round(100 - (priceRatio * 30)); // Lower price = higher score (max 100)
      } else {
        // User's rate exceeds budget
        const excessRatio = (userRate - maxBudget) / maxBudget;
        scores.price = Math.max(0, 50 - (excessRatio * 50));
      }
    } else {
      scores.price = 75; // Neutral if no budget specified
    }

    // Innovation (Primary Metric) - Innovation track record and capabilities
    scores.innovation = calculateInnovationScore(user.id, '5.1');

    // Calculate final score with specified weights
    const weights = { 
      technical: 0.40, 
      price: 0.30, 
      innovation: 0.30 
    };
    const finalScore = Object.keys(scores).reduce((sum, key) => 
      sum + (scores[key] * (weights[key] || 0)), 0);

    return { scores, finalScore: Math.round(finalScore), meetsThreshold: finalScore >= 80 };
  }

  // ============================================
  // Intent-Based Matching Check
  // ============================================
  function checkIntentCompatibility(opportunity, user) {
    // If opportunity has intentType, check compatibility
    if (!opportunity.intentType) {
      return true; // Legacy opportunities without intentType are compatible
    }

    // For REQUEST_SERVICE: user should be able to OFFER_SERVICE
    if (opportunity.intentType === 'REQUEST_SERVICE') {
      // User can match if they can offer services
      // Check if user has service offerings or is a service provider
      const userRole = user.role || '';
      return ['service_provider', 'skill_service_provider', 'vendor', 'entity', 'individual'].includes(userRole);
    }

    // For OFFER_SERVICE: user should be able to REQUEST_SERVICE
    if (opportunity.intentType === 'OFFER_SERVICE') {
      // User can match if they can request services
      const userRole = user.role || '';
      return ['entity', 'beneficiary', 'vendor', 'project_lead'].includes(userRole);
    }

    // For BOTH: compatible with both requesters and offerers
    if (opportunity.intentType === 'BOTH') {
      return true; // Compatible with all
    }

    return true; // Default: compatible
  }

  // ============================================
  // Payment Mode Compatibility Check
  // ============================================
  function checkPaymentModeCompatibility(opportunityPaymentMode, userPaymentPreference) {
    if (!opportunityPaymentMode) {
      return true; // Legacy opportunities without paymentMode
    }

    // If user preference not specified, assume compatible
    if (!userPaymentPreference) {
      return true;
    }

    // Exact match
    if (opportunityPaymentMode === userPaymentPreference) {
      return true;
    }

    // Hybrid is compatible with Cash and Barter
    if (opportunityPaymentMode === 'Hybrid') {
      return ['Cash', 'Barter', 'Hybrid'].includes(userPaymentPreference);
    }

    if (userPaymentPreference === 'Hybrid') {
      return ['Cash', 'Barter', 'Hybrid'].includes(opportunityPaymentMode);
    }

    // Cash and Barter are not directly compatible (unless Hybrid)
    return false;
  }

  // ============================================
  // Barter Matching Logic
  // ============================================
  function calculateBarterCompatibility(opportunity, user) {
    if (opportunity.paymentMode !== 'Barter' && opportunity.paymentMode !== 'Hybrid') {
      return null; // Not applicable
    }

    const barterOffer = opportunity.attributes?.barterOffer || '';
    const userBarterPreferences = user.profile?.barterPreferences || user.profile?.barterOffers || [];

    if (!barterOffer && userBarterPreferences.length === 0) {
      return { score: 50, compatible: true }; // Neutral if not specified
    }

    // Simple keyword matching for barter compatibility
    const offerLower = barterOffer.toLowerCase();
    let matchCount = 0;
    let totalChecks = 0;

    userBarterPreferences.forEach(pref => {
      totalChecks++;
      const prefLower = pref.toLowerCase();
      if (offerLower.includes(prefLower) || prefLower.includes(offerLower)) {
        matchCount++;
      }
    });

    const score = totalChecks > 0 ? (matchCount / totalChecks) * 100 : 50;
    return {
      score: score,
      compatible: score >= 30, // Low threshold for barter matching
      matchedPreferences: userBarterPreferences.filter(pref => 
        offerLower.includes(pref.toLowerCase()) || pref.toLowerCase().includes(offerLower)
      )
    };
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

    // Check intent type compatibility
    if (!checkIntentCompatibility(opportunity, user)) {
      return null; // Intent types not compatible
    }

    // Check payment mode compatibility
    const userPaymentPreference = user.profile?.paymentPreference || user.profile?.preferredPaymentMode;
    if (!checkPaymentModeCompatibility(opportunity.paymentMode, userPaymentPreference)) {
      return null; // Payment modes not compatible
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

    // Add barter compatibility score if applicable
    if (opportunity.paymentMode === 'Barter' || opportunity.paymentMode === 'Hybrid') {
      const barterCompatibility = calculateBarterCompatibility(opportunity, user);
      if (barterCompatibility) {
        // Adjust final score based on barter compatibility
        matchResult.scores.barterCompatibility = barterCompatibility.score;
        // Reduce score if barter incompatible
        if (!barterCompatibility.compatible) {
          matchResult.finalScore = Math.max(0, matchResult.finalScore - 20);
        } else {
          // Boost score if barter highly compatible
          if (barterCompatibility.score >= 70) {
            matchResult.finalScore = Math.min(100, matchResult.finalScore + 5);
          }
        }
      }
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

