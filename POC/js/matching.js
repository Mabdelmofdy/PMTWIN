/**
 * PMTwin Matching Algorithm
 * Calculates skill-match scores and triggers auto-inquiry system
 */

(function() {
  'use strict';

  // Matching weights (must sum to 1.0)
  const WEIGHTS = {
    category: 0.30,
    skills: 0.40,
    experience: 0.20,
    location: 0.10
  };

  const MATCH_THRESHOLD = 80; // Minimum score to trigger auto-inquiry

  // ============================================
  // Category Matching
  // ============================================
  function calculateCategoryMatch(project, provider) {
    const projectCategory = project.category;
    const providerServices = provider.profile?.services || [];

    // Check if provider offers services in the project category
    if (providerServices.length === 0) {
      return 0;
    }

    // Simple category matching (can be enhanced with category hierarchy)
    const categoryKeywords = {
      'Infrastructure': ['Infrastructure', 'Infrastructure Development', 'Civil Engineering', 'Construction'],
      'Residential': ['Residential', 'Housing', 'Real Estate Development'],
      'Commercial': ['Commercial', 'Commercial Development', 'Retail'],
      'Industrial': ['Industrial', 'Manufacturing', 'Warehouse']
    };

    const keywords = categoryKeywords[projectCategory] || [projectCategory];
    const hasMatch = providerServices.some(service => 
      keywords.some(keyword => 
        service.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    return hasMatch ? 100 : 0;
  }

  // ============================================
  // Skills Matching
  // ============================================
  function calculateSkillsMatch(project, provider) {
    const requiredSkills = project.scope?.skillRequirements || [];
    const providerSkills = provider.profile?.skills || [];

    if (requiredSkills.length === 0) {
      return 100; // No requirements = perfect match
    }

    if (providerSkills.length === 0) {
      return 0;
    }

    // Calculate how many required skills the provider has
    const matchedSkills = requiredSkills.filter(reqSkill => 
      providerSkills.some(provSkill => 
        provSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
        reqSkill.toLowerCase().includes(provSkill.toLowerCase())
      )
    );

    const matchPercentage = (matchedSkills.length / requiredSkills.length) * 100;
    return Math.round(matchPercentage);
  }

  // ============================================
  // Experience Matching
  // ============================================
  function calculateExperienceMatch(project, provider) {
    const requiredLevel = project.scope?.experienceLevel || 'intermediate';
    const requiredYears = project.scope?.minimumExperience || 0;
    const providerLevel = provider.profile?.experienceLevel || 'intermediate';
    const providerYears = provider.profile?.yearsInBusiness || 
                         (provider.role === 'individual' ? 5 : 0);

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
  // Location Matching
  // ============================================
  function calculateLocationMatch(project, provider) {
    const projectLocation = project.location;
    const providerLocation = provider.profile?.location;

    if (!projectLocation || !providerLocation) {
      return 50; // Neutral score if location not specified
    }

    // Exact match (same city)
    if (projectLocation.city && providerLocation.city) {
      if (projectLocation.city.toLowerCase() === providerLocation.city.toLowerCase()) {
        return 100;
      }
    }

    // Region match
    if (projectLocation.region && providerLocation.region) {
      if (projectLocation.region.toLowerCase() === providerLocation.region.toLowerCase()) {
        return 70;
      }
    }

    // Country match
    if (projectLocation.country && providerLocation.country) {
      if (projectLocation.country.toLowerCase() === providerLocation.country.toLowerCase()) {
        return 50;
      }
    }

    return 0;
  }

  // ============================================
  // Calculate Final Match Score
  // ============================================
  function calculateMatchScore(project, provider) {
    const categoryScore = calculateCategoryMatch(project, provider);
    const skillsScore = calculateSkillsMatch(project, provider);
    const experienceScore = calculateExperienceMatch(project, provider);
    const locationScore = calculateLocationMatch(project, provider);

    // Weighted average
    const finalScore = Math.round(
      (categoryScore * WEIGHTS.category) +
      (skillsScore * WEIGHTS.skills) +
      (experienceScore * WEIGHTS.experience) +
      (locationScore * WEIGHTS.location)
    );

    return {
      finalScore: finalScore,
      criteria: {
        categoryMatch: categoryScore,
        skillsMatch: skillsScore,
        experienceMatch: experienceScore,
        locationMatch: locationScore
      },
      weights: WEIGHTS,
      meetsThreshold: finalScore >= MATCH_THRESHOLD
    };
  }

  // ============================================
  // Find Matches for a Project
  // ============================================
  function findMatchesForProject(projectId) {
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
      const matchResult = calculateMatchScore(project, provider);
      
      if (matchResult.meetsThreshold) {
        // Check if match already exists
        const existing = PMTwinData.Matches.getAll().find(
          m => m.projectId === projectId && m.providerId === provider.id
        );

        if (!existing) {
          const match = PMTwinData.Matches.create({
            projectId: projectId,
            providerId: provider.id,
            score: matchResult.finalScore,
            criteria: matchResult.criteria,
            weights: matchResult.weights
          });

          if (match) {
            matches.push(match);
            
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
        }
      }
    });

    return matches;
  }

  // ============================================
  // Find Matches for a Provider
  // ============================================
  function findMatchesForProvider(providerId) {
    const provider = PMTwinData.Users.getById(providerId);
    if (!provider || provider.profile?.status !== 'approved') {
      return [];
    }

    // Get all active projects
    const projects = PMTwinData.Projects.getActive();
    const matches = [];

    projects.forEach(project => {
      // Skip projects created by the same provider
      if (project.creatorId === providerId) {
        return;
      }

      const matchResult = calculateMatchScore(project, provider);
      
      if (matchResult.meetsThreshold) {
        // Check if match already exists
        const existing = PMTwinData.Matches.getAll().find(
          m => m.projectId === project.id && m.providerId === providerId
        );

        if (!existing) {
          const match = PMTwinData.Matches.create({
            projectId: project.id,
            providerId: providerId,
            score: matchResult.finalScore,
            criteria: matchResult.criteria,
            weights: matchResult.weights
          });

          if (match) {
            matches.push(match);
          }
        }
      }
    });

    return matches;
  }

  // ============================================
  // Trigger Matching for New Project
  // ============================================
  function triggerMatching(projectId) {
    // Small delay to ensure project is saved
    setTimeout(() => {
      const matches = findMatchesForProject(projectId);
      console.log(`Matching completed: ${matches.length} matches found for project ${projectId}`);
      return matches;
    }, 100);
  }

  // ============================================
  // Get Match Details
  // ============================================
  function getMatchDetails(matchId) {
    const match = PMTwinData.Matches.getById(matchId);
    if (!match) {
      return null;
    }

    const project = PMTwinData.Projects.getById(match.projectId);
    const provider = PMTwinData.Users.getById(match.providerId);

    return {
      match: match,
      project: project,
      provider: provider,
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
      }
    };
  }

  // ============================================
  // Public API
  // ============================================
  window.PMTwinMatching = {
    calculateMatchScore,
    findMatchesForProject,
    findMatchesForProvider,
    triggerMatching,
    getMatchDetails,
    MATCH_THRESHOLD,
    WEIGHTS
  };

})();

