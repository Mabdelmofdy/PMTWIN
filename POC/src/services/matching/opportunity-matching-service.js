/**
 * Opportunity Matching Service
 * Handles role-aware matching of opportunities based on company skills
 */

(function() {
  'use strict';

  // ============================================
  // Calculate Location Score (Config-Driven)
  // ============================================
  function calculateLocationScore(opportunity, providerLocation) {
    if (!opportunity.location || !providerLocation) {
      return { score: 1.0, reason: 'No location data available' }; // No location data = no penalty
    }
    
    const oppLocation = opportunity.location;
    const isRemoteAllowed = oppLocation.isRemoteAllowed === true;
    
    // Get countries (normalize to lowercase for comparison)
    const oppCountry = (oppLocation.country || '').trim();
    const providerCountry = (providerLocation.country || providerLocation.headquarters?.country || '').trim();
    
    // Validate opportunity country is allowed
    if (oppCountry && typeof window.LocationConfig !== 'undefined') {
      if (!window.LocationConfig.isCountryAllowed(oppCountry)) {
        return { score: 0.0, reason: `Opportunity country "${oppCountry}" is not allowed` };
      }
    }
    
    // Extract cities
    const providerCity = (providerLocation.city || providerLocation.headquarters?.city || '').trim();
    const oppCity = (oppLocation.city || '').trim();
    
    // Same country
    if (oppCountry && providerCountry && oppCountry.toLowerCase() === providerCountry.toLowerCase()) {
      // Same city
      if (oppCity && providerCity && oppCity.toLowerCase() === providerCity.toLowerCase()) {
        return { score: 1.0, reason: `Same city: ${oppCity}, ${oppCountry}` };
      }
      
      // Same country, different city
      if (isRemoteAllowed) {
        return { score: 0.7, reason: `Same country (${oppCountry}), remote allowed` };
      } else {
        return { score: 0.4, reason: `Same country (${oppCountry}), different city, on-site required` };
      }
    }
    
    // Different country
    if (isRemoteAllowed) {
      return { score: 0.2, reason: `Different country (${oppCountry} vs ${providerCountry}), remote allowed` };
    } else {
      return { score: 0.0, reason: `Different country (${oppCountry} vs ${providerCountry}), on-site required` };
    }
  }

  // ============================================
  // Calculate Match Score (with Location)
  // ============================================
  function calculateMatchScore(opportunity, companyId, providerLocation = null) {
    if (typeof PMTwinData === 'undefined') {
      return { score: 0, matchedSkills: [], missingSkills: [], locationScore: 0 };
    }

    // Get company skills (users represent companies)
    const companySkills = PMTwinData.getCompanySkills ? PMTwinData.getCompanySkills(companyId) : [];
    if (!Array.isArray(companySkills) || companySkills.length === 0) {
      return { score: 0, matchedSkills: [], missingSkills: [], locationScore: 0 };
    }

    // Get required skills from opportunity
    let requiredSkills = [];
    if (opportunity.skills && Array.isArray(opportunity.skills)) {
      requiredSkills = opportunity.skills;
    } else if (opportunity.scope && opportunity.scope.skillRequirements) {
      requiredSkills = opportunity.scope.skillRequirements;
    } else if (opportunity.requiredSkills) {
      requiredSkills = opportunity.requiredSkills;
    } else if (opportunity.attributes && opportunity.attributes.requiredSkills) {
      requiredSkills = opportunity.attributes.requiredSkills;
    } else if (opportunity.scope && Array.isArray(opportunity.scope)) {
      // For mega-projects with sub-projects, aggregate skills
      opportunity.scope.forEach(subProject => {
        if (subProject.skillRequirements) {
          requiredSkills = [...requiredSkills, ...subProject.skillRequirements];
        }
      });
      // Remove duplicates
      requiredSkills = [...new Set(requiredSkills)];
    }

    // Calculate skills score
    let skillsScore = 100;
    const matchedSkills = [];
    const missingSkills = [];

    if (Array.isArray(requiredSkills) && requiredSkills.length > 0) {
      // Normalize skills to lowercase for comparison
      const normalizedCompanySkills = companySkills.map(s => s.toLowerCase().trim());
      const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

      normalizedRequiredSkills.forEach(requiredSkill => {
        // Check for exact match
        if (normalizedCompanySkills.includes(requiredSkill)) {
          matchedSkills.push(requiredSkill);
        } else {
          // Check for partial match (contains)
          const hasPartialMatch = normalizedCompanySkills.some(companySkill =>
            companySkill.includes(requiredSkill) || requiredSkill.includes(companySkill)
          );
          if (hasPartialMatch) {
            matchedSkills.push(requiredSkill); // Count partial as match
          } else {
            missingSkills.push(requiredSkill);
          }
        }
      });

      // Calculate skills score: (#matched / #required) * 100
      skillsScore = Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100);
    }

    // Calculate location score
    let locationScore = 1.0;
    let locationReason = 'No location data';
    if (providerLocation) {
      const locationResult = calculateLocationScore(opportunity, providerLocation);
      locationScore = locationResult.score;
      locationReason = locationResult.reason;
    } else {
      // Try to get provider location from user profile
      const user = PMTwinData.Users.getById(companyId);
      if (user && user.profile && user.profile.location) {
        const userLocation = {
          city: user.profile.location.city || user.profile.location.headquarters?.city,
          country: user.profile.location.country || user.profile.location.headquarters?.country
        };
        const locationResult = calculateLocationScore(opportunity, userLocation);
        locationScore = locationResult.score;
        locationReason = locationResult.reason;
      }
    }

    // Calculate payment compatibility
    let paymentCompatibility = null;
    const oppPaymentMode = opportunity.preferredPaymentTerms?.mode || opportunity.paymentTerms?.mode || opportunity.paymentMode || 'CASH';
    
    // Get provider payment preferences (if available)
    const user = PMTwinData.Users.getById(companyId);
    const providerPaymentPreference = user?.profile?.paymentPreferences?.mode || 'CASH';
    
    // Payment compatibility check
    if (oppPaymentMode === providerPaymentPreference) {
      paymentCompatibility = `Perfect match: Both prefer ${oppPaymentMode}`;
    } else if (oppPaymentMode === 'HYBRID' || providerPaymentPreference === 'HYBRID') {
      paymentCompatibility = `Compatible: ${oppPaymentMode} and ${providerPaymentPreference} can be negotiated`;
    } else if ((oppPaymentMode === 'CASH' && providerPaymentPreference === 'BARTER') ||
               (oppPaymentMode === 'BARTER' && providerPaymentPreference === 'CASH')) {
      paymentCompatibility = `Mismatch: Opportunity prefers ${oppPaymentMode}, provider prefers ${providerPaymentPreference}`;
    } else {
      paymentCompatibility = `Opportunity prefers ${oppPaymentMode}`;
    }

    // Combined score: 60% skills, 25% location, 15% payment compatibility
    // Payment compatibility: perfect match = 1.0, compatible = 0.8, mismatch = 0.5
    let paymentScore = 1.0;
    if (paymentCompatibility.includes('Perfect match')) {
      paymentScore = 1.0;
    } else if (paymentCompatibility.includes('Compatible')) {
      paymentScore = 0.8;
    } else if (paymentCompatibility.includes('Mismatch')) {
      paymentScore = 0.5;
    }
    
    const finalScore = Math.round(skillsScore * 0.6 + (locationScore * 100) * 0.25 + (paymentScore * 100) * 0.15);

    return {
      score: finalScore,
      skillsScore: skillsScore,
      locationScore: Math.round(locationScore * 100),
      locationReason: locationReason,
      paymentCompatibility: paymentCompatibility,
      paymentScore: Math.round(paymentScore * 100),
      matchedSkills: matchedSkills,
      missingSkills: missingSkills
    };
  }

  // ============================================
  // Find Matches for Company
  // ============================================
  function findMatchesForCompany(companyId, role, providerLocation = null) {
    if (typeof PMTwinData === 'undefined') {
      return [];
    }

    const matches = [];
    
    // Get provider location if not provided
    if (!providerLocation) {
      const user = PMTwinData.Users.getById(companyId);
      if (user && user.profile && user.profile.location) {
        providerLocation = {
          city: user.profile.location.city || user.profile.location.headquarters?.city,
          country: user.profile.location.country || user.profile.location.headquarters?.country
        };
      }
    }

    // Use unified Opportunities model
    let allOpportunities = [];
    if (PMTwinData.Opportunities) {
      allOpportunities = PMTwinData.Opportunities.getAll().filter(opp => {
        const createdBy = opp.createdBy || opp.creatorId;
        return createdBy !== companyId && 
               (opp.status === 'published' || opp.status === 'active');
      });
    }

    // Fallback to legacy models for backward compatibility
    if (allOpportunities.length === 0) {
      const allProjects = PMTwinData.Projects ? PMTwinData.Projects.getAll().filter(p => 
        p.ownerCompanyId !== companyId && 
        p.status === 'active' && 
        p.visibility === 'public'
      ) : [];

      const allServiceRequests = PMTwinData.ServiceRequests ? PMTwinData.ServiceRequests.getAll().filter(sr =>
        sr.ownerCompanyId !== companyId &&
        sr.status === 'OPEN'
      ) : [];

      // Convert Projects to opportunity format
      allProjects.forEach(project => {
        allOpportunities.push({
          id: project.id,
          intent: 'REQUEST_SERVICE',
          skills: project.scope?.skillRequirements || [],
          location: project.location || {},
          ...project
        });
      });

      // Convert ServiceRequests to opportunity format
      allServiceRequests.forEach(request => {
        allOpportunities.push({
          id: request.id,
          intent: 'REQUEST_SERVICE',
          skills: request.requiredSkills || [],
          location: request.location || {},
          ...request
        });
      });
    }

    // Filter by role and intent
    let filteredOpportunities = allOpportunities;
    
    if (role === 'vendor' || role === 'vendor_corporate' || role === 'vendor_individual') {
      // Vendor: REQUEST_SERVICE opportunities (projects)
      filteredOpportunities = allOpportunities.filter(opp => 
        opp.intent === 'REQUEST_SERVICE' || opp.intent === 'BOTH' ||
        !opp.intent // Legacy: assume REQUEST_SERVICE
      );
    } else if (role === 'service_provider' || role === 'skill_service_provider') {
      // Service Provider: REQUEST_SERVICE opportunities (not ADVISORY)
      filteredOpportunities = allOpportunities.filter(opp => 
        (opp.intent === 'REQUEST_SERVICE' || opp.intent === 'BOTH' || !opp.intent) &&
        opp.requestType !== 'ADVISORY'
      );
    } else if (role === 'consultant') {
      // Consultant: REQUEST_SERVICE opportunities (ADVISORY only)
      filteredOpportunities = allOpportunities.filter(opp => 
        opp.requestType === 'ADVISORY'
      );
    }

    // Calculate match scores
    filteredOpportunities.forEach(opportunity => {
      const matchResult = calculateMatchScore(opportunity, companyId, providerLocation);
      if (matchResult.score > 0) {
        matches.push({
          targetType: 'OPPORTUNITY',
          targetId: opportunity.id,
          target: opportunity,
          matchScore: matchResult.score,
          skillsScore: matchResult.skillsScore,
          locationScore: matchResult.locationScore,
          locationReason: matchResult.locationReason,
          paymentCompatibility: matchResult.paymentCompatibility,
          paymentScore: matchResult.paymentScore,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills
        });
      }
    });

    // Sort by match score descending
    matches.sort((a, b) => b.matchScore - a.matchScore);

    return matches;
  }

  // ============================================
  // Public API
  // ============================================
  window.OpportunityMatchingService = {
    calculateMatchScore,
    findMatchesForCompany
  };

})();
