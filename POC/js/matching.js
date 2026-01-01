/**
 * PMTwin Matching Algorithm
 * Calculates skill-match scores and triggers auto-inquiry system
 */

(function() {
  'use strict';

  // Matching weights (must sum to 1.0)
  // Updated for service offerings: skills weighted higher since offerings are explicit
  const WEIGHTS = {
    category: 0.30,
    skills: 0.45,  // Increased from 0.40 - offerings have explicit skills
    experience: 0.15,  // Decreased from 0.20 - provider-level
    location: 0.10
  };

  const MATCH_THRESHOLD = 80; // Minimum score to trigger auto-inquiry

  // ============================================
  // Category Matching (for offerings)
  // ============================================
  function calculateCategoryMatch(project, offering) {
    const projectCategory = project.category;
    const offeringCategory = offering.category;

    if (!offeringCategory) {
      return 0;
    }

    // Map project categories to service offering categories
    const categoryMapping = {
      'Infrastructure': ['engineering', 'design', 'logistics', 'safety'],
      'Residential': ['design', 'engineering', 'legal', 'financial'],
      'Commercial': ['design', 'engineering', 'legal', 'financial'],
      'Industrial': ['engineering', 'logistics', 'safety', 'environmental']
    };

    const mappedCategories = categoryMapping[projectCategory] || [];
    
    // Direct match
    if (offeringCategory.toLowerCase() === projectCategory.toLowerCase()) {
      return 100;
    }
    
    // Check if offering category matches any mapped categories
    if (mappedCategories.some(cat => cat.toLowerCase() === offeringCategory.toLowerCase())) {
      return 100;
    }

    return 0;
  }

  // ============================================
  // Skills Matching (for offerings)
  // ============================================
  function calculateSkillsMatch(project, offering) {
    const requiredSkills = project.scope?.skillRequirements || [];
    const offeringSkills = offering.skills || [];

    if (requiredSkills.length === 0) {
      return 100; // No requirements = perfect match
    }

    if (offeringSkills.length === 0) {
      return 0;
    }

    // Calculate how many required skills the offering has
    const matchedSkills = requiredSkills.filter(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      return offeringSkills.some(offSkill => {
        const offSkillLower = offSkill.toLowerCase();
        return offSkillLower.includes(reqSkillLower) || reqSkillLower.includes(offSkillLower);
      });
    });

    const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;
    return Math.round(matchPercentage);
  }

  // ============================================
  // Experience Matching (provider-level, not offering-level)
  // ============================================
  function calculateExperienceMatch(project, offering, provider) {
    const requiredLevel = project.scope?.experienceLevel || 'intermediate';
    const requiredYears = project.scope?.minimumExperience || 0;
    const providerLevel = provider?.profile?.experienceLevel || 'intermediate';
    const providerYears = provider?.profile?.yearsInBusiness || 
                         (provider?.role === 'individual' ? 5 : 0);

    // Level matching
    const levelHierarchy = {
      'junior': 1,
      'intermediate': 2,
      'senior': 3,
      'expert': 4
    };

    const requiredLevelNum = levelHierarchy[requiredLevel] || 2;
    const providerLevelNum = levelHierarchy[providerLevel] || 2;

    let levelScore = 0;
    if (providerLevelNum >= requiredLevelNum) {
      levelScore = 100;
    } else {
      // Partial credit for close levels
      const diff = requiredLevelNum - providerLevelNum;
      levelScore = Math.max(0, 100 - (diff * 30));
    }

    // Years matching
    let yearsScore = 0;
    if (providerYears >= requiredYears) {
      yearsScore = 100;
    } else {
      // Partial credit based on how close
      yearsScore = Math.max(0, (providerYears / requiredYears) * 100);
    }

    // Average of level and years
    return Math.round((levelScore + yearsScore) / 2);
  }

  // ============================================
  // Location Matching (for offerings)
  // ============================================
  function calculateLocationMatch(project, offering) {
    const projectLocation = project.location;
    const offeringLocation = offering.location;

    if (!projectLocation || !offeringLocation) {
      return 50; // Neutral score if location not specified
    }

    // Exact match (same city)
    if (projectLocation.city && offeringLocation.city) {
      if (projectLocation.city.toLowerCase() === offeringLocation.city.toLowerCase()) {
        return 100;
      }
    }

    // Check radius if available
    if (offeringLocation.radius && offeringLocation.radius > 0) {
      // If offering has a service radius, consider it a match if cities are in same country
      if (projectLocation.country && offeringLocation.country) {
        if (projectLocation.country.toLowerCase() === offeringLocation.country.toLowerCase()) {
          return 80; // Good match within country
        }
      }
    }

    // Region match (if project has region)
    if (projectLocation.region && offeringLocation.city) {
      // Could enhance with region mapping, for now use country
      if (projectLocation.country && offeringLocation.country) {
        if (projectLocation.country.toLowerCase() === offeringLocation.country.toLowerCase()) {
          return 70;
        }
      }
    }

    // Country match
    if (projectLocation.country && offeringLocation.country) {
      if (projectLocation.country.toLowerCase() === offeringLocation.country.toLowerCase()) {
        return 50;
      }
    }

    return 0;
  }

  // ============================================
  // Calculate Final Match Score (for offerings)
  // ============================================
  function calculateMatchScore(project, offering, provider) {
    const categoryScore = calculateCategoryMatch(project, offering);
    const skillsScore = calculateSkillsMatch(project, offering);
    const experienceScore = calculateExperienceMatch(project, offering, provider);
    const locationScore = calculateLocationMatch(project, offering);

    // Weighted average
    const finalScore = Math.round(
      (categoryScore * WEIGHTS.category) +
      (skillsScore * WEIGHTS.skills) +
      (experienceScore * WEIGHTS.experience) +
      (locationScore * WEIGHTS.location)
    );

    // Get matched and unmatched skills for explanation
    const requiredSkills = project.scope?.skillRequirements || [];
    const offeringSkills = offering.skills || [];
    const matchedSkills = requiredSkills.filter(reqSkill => {
      const reqSkillLower = reqSkill.toLowerCase();
      return offeringSkills.some(offSkill => {
        const offSkillLower = offSkill.toLowerCase();
        return offSkillLower.includes(reqSkillLower) || reqSkillLower.includes(offSkillLower);
      });
    });
    const unmatchedSkills = requiredSkills.filter(skill => !matchedSkills.includes(skill));

    return {
      finalScore: finalScore,
      best_offering_id: offering.id,
      criteria: {
        categoryMatch: categoryScore,
        skillsMatch: skillsScore,
        experienceMatch: experienceScore,
        locationMatch: locationScore
      },
      weights: WEIGHTS,
      meetsThreshold: finalScore >= MATCH_THRESHOLD,
      explain: {
        matchedSkills: matchedSkills,
        unmatchedSkills: unmatchedSkills,
        topMatchedSkills: matchedSkills.slice(0, 3)
      }
    };
  }

  // ============================================
  // Find Best Offering for Project per Provider
  // ============================================
  async function findBestOfferingForProject(projectId, providerUserId) {
    if (typeof ServiceOfferingService === 'undefined') {
      return null;
    }

    // Get all active offerings for this provider
    const result = await ServiceOfferingService.getOfferings({ 
      includeAll: true 
    });
    
    if (!result.success) {
      return null;
    }

    const providerOfferings = result.offerings.filter(o => 
      o.provider_user_id === providerUserId && o.status === 'Active'
    );

    if (providerOfferings.length === 0) {
      return null;
    }

    const project = PMTwinData.Projects.getById(projectId);
    if (!project) {
      return null;
    }

    const provider = PMTwinData.Users.getById(providerUserId);
    if (!provider) {
      return null;
    }

    // Score each offering and return the best one
    let bestOffering = null;
    let bestScore = 0;

    providerOfferings.forEach(offering => {
      const matchResult = calculateMatchScore(project, offering, provider);
      if (matchResult.finalScore > bestScore) {
        bestScore = matchResult.finalScore;
        bestOffering = {
          offering: offering,
          matchResult: matchResult
        };
      }
    });

    return bestOffering;
  }

  // ============================================
  // Find Matches for a Project (using service offerings)
  // ============================================
  async function findMatchesForProject(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project || project.status !== 'active') {
      return [];
    }

    // Get all active service offerings (strict mode - require offerings)
    if (typeof ServiceOfferingService === 'undefined') {
      console.warn('ServiceOfferingService not available, falling back to provider matching');
      return findMatchesForProjectLegacy(projectId);
    }

    const offeringsResult = await ServiceOfferingService.getOfferings({ 
      includeAll: false  // Only active offerings
    });

    if (!offeringsResult.success || !offeringsResult.offerings.length) {
      return [];
    }

    const activeOfferings = offeringsResult.offerings.filter(o => o.status === 'Active');
    const matches = [];
    const processedProviders = new Set(); // Track providers we've already matched

    for (const offering of activeOfferings) {
      // Skip if we've already matched this provider
      if (processedProviders.has(offering.provider_user_id)) {
        continue;
      }

      // Get provider user
      const provider = PMTwinData.Users.getById(offering.provider_user_id);
      if (!provider || provider.profile?.status !== 'approved') {
        continue;
      }

      // Skip if provider created this project
      if (project.creatorId === provider.id) {
        continue;
      }

      // Calculate match score
      const matchResult = calculateMatchScore(project, offering, provider);
      
      if (matchResult.meetsThreshold) {
        // Check if match already exists
        const existing = PMTwinData.Matches.getAll().find(
          m => m.projectId === projectId && m.providerId === provider.id
        );

        if (!existing) {
          const match = PMTwinData.Matches.create({
            projectId: projectId,
            providerId: provider.id,
            offeringId: offering.id,  // Store best offering ID
            score: matchResult.finalScore,
            criteria: matchResult.criteria,
            weights: matchResult.weights,
            best_offering_id: matchResult.best_offering_id,
            explain: matchResult.explain
          });

          if (match) {
            matches.push(match);
            processedProviders.add(offering.provider_user_id);
            
            // Create notification for provider
            PMTwinData.Notifications.create({
              userId: provider.id,
              type: 'match_found',
              title: 'New Match Found!',
              message: `You have a ${matchResult.finalScore}% match for "${project.title}"`,
              relatedEntityType: 'match',
              relatedEntityId: match.id,
              actionUrl: `#/user-portal/matches/${match.id}`,
              actionLabel: 'View Match'
            });

            // Mark as notified
            PMTwinData.Matches.markAsNotified(match.id);
          }
        } else {
          processedProviders.add(offering.provider_user_id);
        }
      }
    }

    return matches;
  }

  // ============================================
  // Legacy Matching (fallback if offerings not available)
  // ============================================
  function findMatchesForProjectLegacy(projectId) {
    const project = PMTwinData.Projects.getById(projectId);
    if (!project || project.status !== 'active') {
      return [];
    }

    // Get all approved providers (individuals and entities)
    const individuals = PMTwinData.Users.getByRole('individual')
      .filter(u => u.profile?.status === 'approved');
    const entities = PMTwinData.Users.getByRole('entity')
      .filter(u => u.profile?.status === 'approved');
    const providers = [...individuals, ...entities];

    const matches = [];

    providers.forEach(provider => {
      // Legacy matching - would need old calculateMatchScore signature
      // For now, skip if no offerings available (strict mode)
      return;
    });

    return matches;
  }

  // ============================================
  // Find Matches for a Provider (using service offerings)
  // ============================================
  async function findMatchesForProvider(providerId) {
    const provider = PMTwinData.Users.getById(providerId);
    if (!provider || provider.profile?.status !== 'approved') {
      return [];
    }

    // Get provider's active offerings (strict mode)
    if (typeof ServiceOfferingService === 'undefined') {
      return [];
    }

    const offeringsResult = await ServiceOfferingService.getMyOfferings();
    if (!offeringsResult.success) {
      return [];
    }

    const activeOfferings = offeringsResult.offerings.filter(o => 
      o.provider_user_id === providerId && o.status === 'Active'
    );

    if (activeOfferings.length === 0) {
      return []; // No active offerings - strict mode
    }

    // Get all active projects
    const projects = PMTwinData.Projects.getActive();
    const matches = [];

    for (const project of projects) {
      // Skip projects created by the same provider
      if (project.creatorId === providerId) {
        continue;
      }

      // Find best offering for this project
      let bestMatch = null;
      let bestScore = 0;

      for (const offering of activeOfferings) {
        const matchResult = calculateMatchScore(project, offering, provider);
        
        if (matchResult.meetsThreshold && matchResult.finalScore > bestScore) {
          bestScore = matchResult.finalScore;
          bestMatch = {
            project: project,
            offering: offering,
            matchResult: matchResult
          };
        }
      }

      if (bestMatch) {
        // Check if match already exists
        const existing = PMTwinData.Matches.getAll().find(
          m => m.projectId === project.id && m.providerId === providerId
        );

        if (!existing) {
          const match = PMTwinData.Matches.create({
            projectId: project.id,
            providerId: providerId,
            offeringId: bestMatch.offering.id,
            score: bestMatch.matchResult.finalScore,
            criteria: bestMatch.matchResult.criteria,
            weights: bestMatch.matchResult.weights,
            best_offering_id: bestMatch.matchResult.best_offering_id,
            explain: bestMatch.matchResult.explain
          });

          if (match) {
            matches.push(match);
          }
        }
      }
    }

    return matches;
  }

  // ============================================
  // Trigger Matching for New Project
  // ============================================
  async function triggerMatching(projectId) {
    // Small delay to ensure project is saved
    return new Promise((resolve) => {
      setTimeout(async () => {
        const matches = await findMatchesForProject(projectId);
        console.log(`Matching completed: ${matches.length} matches found for project ${projectId}`);
        resolve(matches);
      }, 100);
    });
  }

  // ============================================
  // Get Match Details
  // ============================================
  async function getMatchDetails(matchId) {
    const match = PMTwinData.Matches.getById(matchId);
    if (!match) {
      return null;
    }

    const project = PMTwinData.Projects.getById(match.projectId);
    const provider = PMTwinData.Users.getById(match.providerId);
    
    // Get offering if available
    let offering = null;
    if (match.best_offering_id && typeof ServiceOfferingService !== 'undefined') {
      const offeringResult = await ServiceOfferingService.getOfferingById(match.best_offering_id);
      if (offeringResult.success) {
        offering = offeringResult.offering;
      }
    }

    return {
      match: match,
      project: project,
      provider: provider,
      offering: offering,
      breakdown: {
        category: {
          score: match.criteria.categoryMatch,
          weight: match.weights.category,
          contribution: Math.round(match.criteria.categoryMatch * match.weights.category)
        },
        skills: {
          score: match.criteria.skillsMatch,
          weight: match.weights.skills,
          contribution: Math.round(match.criteria.skillsMatch * match.weights.skills)
        },
        experience: {
          score: match.criteria.experienceMatch,
          weight: match.weights.experience,
          contribution: Math.round(match.criteria.experienceMatch * match.weights.experience)
        },
        location: {
          score: match.criteria.locationMatch,
          weight: match.weights.location,
          contribution: Math.round(match.criteria.locationMatch * match.weights.location)
        }
      },
      explain: match.explain || null
    };
  }

  // ============================================
  // Public API
  // ============================================
  window.PMTwinMatching = {
    calculateMatchScore,
    findMatchesForProject,
    findMatchesForProvider,
    findBestOfferingForProject,
    triggerMatching,
    getMatchDetails,
    MATCH_THRESHOLD,
    WEIGHTS
  };

})();

