/**
 * Matching Service
 * Handles matching algorithm and match-related operations
 */

(function() {
  'use strict';

  // Calculate skill match percentage between user skills and project requirements
  function calculateSkillMatch(userSkills, projectSkills) {
    if (!projectSkills || projectSkills.length === 0) {
      return 100; // No requirements = perfect match
    }
    
    if (!userSkills || userSkills.length === 0) {
      return 0; // No user skills = no match
    }
    
    // Normalize skills to lowercase for comparison
    const userSkillsLower = userSkills.map(s => s.toLowerCase().trim());
    const projectSkillsLower = projectSkills.map(s => s.toLowerCase().trim());
    
    // Calculate how many required skills the user has
    const matchedSkills = projectSkillsLower.filter(reqSkill => {
      return userSkillsLower.some(userSkill => {
        // Check for exact match or substring match
        return userSkill.includes(reqSkill) || reqSkill.includes(userSkill);
      });
    });
    
    const matchPercentage = (matchedSkills.length / projectSkillsLower.length) * 100;
    return Math.round(matchPercentage);
  }

  // Find projects matching user skills
  function findProjectsBySkills(userSkills, excludeCreatorId = null) {
    if (!userSkills || userSkills.length === 0) {
      return [];
    }
    
    // Get all active public projects (exclude projects created by the user)
    const allProjects = PMTwinData.Projects.getAll().filter(p => 
      p.status === 'active' && 
      p.visibility === 'public' &&
      (!excludeCreatorId || p.creatorId !== excludeCreatorId)
    );
    
    const skillMatches = [];
    
    allProjects.forEach(project => {
      // Check if it's a mega project
      const isMegaProject = project.projectType === 'mega' || project.subProjects;
      
      if (isMegaProject && project.subProjects) {
        // For mega projects, check each sub-project
        const subProjectMatches = [];
        
        project.subProjects.forEach((subProject, index) => {
          const subProjectSkills = subProject.scope?.skillRequirements || [];
          const matchPercentage = calculateSkillMatch(userSkills, subProjectSkills);
          
          if (matchPercentage > 0) {
            subProjectMatches.push({
              subProjectIndex: index,
              subProjectId: subProject.id,
              title: subProject.title || `Sub-Project ${index + 1}`,
              matchPercentage: matchPercentage,
              requiredSkills: subProjectSkills,
              matchedSkills: subProjectSkills.filter(reqSkill => {
                const reqSkillLower = reqSkill.toLowerCase().trim();
                return userSkills.some(userSkill => {
                  const userSkillLower = userSkill.toLowerCase().trim();
                  return userSkillLower.includes(reqSkillLower) || reqSkillLower.includes(userSkillLower);
                });
              })
            });
          }
        });
        
        if (subProjectMatches.length > 0) {
          // Calculate overall match for mega project (average of matching sub-projects)
          const avgMatch = Math.round(
            subProjectMatches.reduce((sum, sp) => sum + sp.matchPercentage, 0) / subProjectMatches.length
          );
          
          skillMatches.push({
            projectId: project.id,
            project: project,
            matchPercentage: avgMatch,
            isMegaProject: true,
            subProjectMatches: subProjectMatches,
            totalSubProjects: project.subProjects.length,
            matchingSubProjects: subProjectMatches.length
          });
        }
      } else {
        // Regular project - check main project skills
        const projectSkills = project.scope?.skillRequirements || [];
        const matchPercentage = calculateSkillMatch(userSkills, projectSkills);
        
        if (matchPercentage > 0) {
          skillMatches.push({
            projectId: project.id,
            project: project,
            matchPercentage: matchPercentage,
            isMegaProject: false,
            requiredSkills: projectSkills,
            matchedSkills: projectSkills.filter(reqSkill => {
              const reqSkillLower = reqSkill.toLowerCase().trim();
              return userSkills.some(userSkill => {
                const userSkillLower = userSkill.toLowerCase().trim();
                return userSkillLower.includes(reqSkillLower) || reqSkillLower.includes(userSkillLower);
              });
            })
          });
        }
      }
    });
    
    // Sort by match percentage descending
    skillMatches.sort((a, b) => b.matchPercentage - a.matchPercentage);
    
    return skillMatches;
  }

  async function getMatches(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserSeeFeature('matches_view');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to view matches' };
      }
    }
    
    // Get existing matches from database
    let matches = PMTwinData.Matches.getByProvider(currentUser.id);
    
    // Also find projects matching user's skills
    const userSkills = currentUser.profile?.skills || [];
    const skillBasedMatches = findProjectsBySkills(userSkills, currentUser.id);
    
    // Combine existing matches with skill-based matches
    // Create a map to avoid duplicates
    const matchesMap = new Map();
    
    // Add existing matches
    matches.forEach(match => {
      matchesMap.set(match.projectId, {
        id: match.id,
        projectId: match.projectId,
        score: match.score,
        criteria: match.criteria,
        viewed: match.viewed,
        notified: match.notified,
        isExistingMatch: true
      });
    });
    
    // Add skill-based matches (only if not already in existing matches)
    skillBasedMatches.forEach(skillMatch => {
      if (!matchesMap.has(skillMatch.projectId)) {
        matchesMap.set(skillMatch.projectId, {
          id: `skill_match_${skillMatch.projectId}`,
          projectId: skillMatch.projectId,
          score: skillMatch.matchPercentage,
          criteria: {
            skillsMatch: skillMatch.matchPercentage,
            categoryMatch: 0,
            experienceMatch: 0,
            locationMatch: 0
          },
          viewed: false,
          notified: false,
          isExistingMatch: false,
          isSkillBased: true,
          isMegaProject: skillMatch.isMegaProject,
          subProjectMatches: skillMatch.subProjectMatches,
          totalSubProjects: skillMatch.totalSubProjects,
          matchingSubProjects: skillMatch.matchingSubProjects,
          requiredSkills: skillMatch.requiredSkills,
          matchedSkills: skillMatch.matchedSkills
        });
      }
    });
    
    // Convert map to array
    matches = Array.from(matchesMap.values());
    
    // Apply filters
    if (filters.minScore) {
      matches = matches.filter(m => m.score >= filters.minScore);
    }
    if (filters.projectId) {
      matches = matches.filter(m => m.projectId === filters.projectId);
    }
    if (filters.notified !== undefined) {
      matches = matches.filter(m => m.notified === filters.notified);
    }
    
    // Sort by score descending
    matches.sort((a, b) => b.score - a.score);
    
    return { success: true, matches: matches };
  }

  async function getMatchById(matchId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const match = PMTwinData.Matches.getById(matchId);
    if (!match) {
      return { success: false, error: 'Match not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check if user owns this match
    if (match.providerId !== currentUser.id) {
      return { success: false, error: 'You do not have permission to view this match' };
    }
    
    return { success: true, match: match };
  }

  async function markMatchAsViewed(matchId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const match = PMTwinData.Matches.getById(matchId);
    if (!match) {
      return { success: false, error: 'Match not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser || match.providerId !== currentUser.id) {
      return { success: false, error: 'You do not have permission to view this match' };
    }
    
    const updated = PMTwinData.Matches.markAsViewed(matchId);
    if (updated) {
      return { success: true, match: updated };
    }
    
    return { success: false, error: 'Failed to update match' };
  }

  window.MatchingService = {
    getMatches,
    getMatchById,
    markMatchAsViewed
  };

})();


