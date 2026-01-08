/**
 * Opportunity Matching Service
 * Handles role-aware matching of opportunities based on company skills
 */

(function() {
  'use strict';

  // ============================================
  // Calculate Match Score
  // ============================================
  function calculateMatchScore(opportunity, companyId) {
    if (typeof PMTwinData === 'undefined') {
      return { score: 0, matchedSkills: [], missingSkills: [] };
    }

    // Get company skills (users represent companies)
    const companySkills = PMTwinData.getCompanySkills ? PMTwinData.getCompanySkills(companyId) : [];
    if (!Array.isArray(companySkills) || companySkills.length === 0) {
      return { score: 0, matchedSkills: [], missingSkills: [] };
    }

    // Get required skills from opportunity
    let requiredSkills = [];
    if (opportunity.scope && opportunity.scope.skillRequirements) {
      requiredSkills = opportunity.scope.skillRequirements;
    } else if (opportunity.requiredSkills) {
      requiredSkills = opportunity.requiredSkills;
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

    if (!Array.isArray(requiredSkills) || requiredSkills.length === 0) {
      // No requirements = perfect match
      return { score: 100, matchedSkills: [], missingSkills: [] };
    }

    // Normalize skills to lowercase for comparison
    const normalizedCompanySkills = companySkills.map(s => s.toLowerCase().trim());
    const normalizedRequiredSkills = requiredSkills.map(s => s.toLowerCase().trim());

    // Find matched and missing skills
    const matchedSkills = [];
    const missingSkills = [];

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

    // Calculate score: (#matched / #required) * 100
    const score = Math.round((matchedSkills.length / normalizedRequiredSkills.length) * 100);

    return {
      score: score,
      matchedSkills: matchedSkills,
      missingSkills: missingSkills
    };
  }

  // ============================================
  // Find Matches for Company
  // ============================================
  function findMatchesForCompany(companyId, role) {
    if (typeof PMTwinData === 'undefined') {
      return [];
    }

    const matches = [];

    // Get all opportunities where ownerCompanyId !== companyId
    const allProjects = PMTwinData.Projects.getAll().filter(p => 
      p.ownerCompanyId !== companyId && 
      p.status === 'active' && 
      p.visibility === 'public'
    );

    const allServiceRequests = PMTwinData.ServiceRequests.getAll().filter(sr =>
      sr.ownerCompanyId !== companyId &&
      sr.status === 'OPEN'
    );

    // Filter by role
    if (role === 'vendor' || role === 'vendor_corporate' || role === 'vendor_individual') {
      // Vendor: Projects + MegaProjects
      allProjects.forEach(project => {
        const matchResult = calculateMatchScore(project, companyId);
        if (matchResult.score > 0) {
          matches.push({
            targetType: project.projectType === 'mega' ? 'MEGA_PROJECT' : 'PROJECT',
            targetId: project.id,
            target: project,
            matchScore: matchResult.score,
            matchedSkills: matchResult.matchedSkills,
            missingSkills: matchResult.missingSkills
          });
        }
      });
    } else if (role === 'service_provider' || role === 'skill_service_provider') {
      // Service Provider: ServiceRequests (requestType !== ADVISORY)
      allServiceRequests.forEach(request => {
        if (request.requestType !== 'ADVISORY') {
          const matchResult = calculateMatchScore(request, companyId);
          if (matchResult.score > 0) {
            matches.push({
              targetType: 'SERVICE_REQUEST',
              targetId: request.id,
              target: request,
              matchScore: matchResult.score,
              matchedSkills: matchResult.matchedSkills,
              missingSkills: matchResult.missingSkills
            });
          }
        }
      });
    } else if (role === 'consultant') {
      // Consultant: ServiceRequests (requestType === ADVISORY) or Advisory requests
      allServiceRequests.forEach(request => {
        if (request.requestType === 'ADVISORY') {
          const matchResult = calculateMatchScore(request, companyId);
          if (matchResult.score > 0) {
            matches.push({
              targetType: 'SERVICE_REQUEST', // Could be ADVISORY_REQUEST if we add that type
              targetId: request.id,
              target: request,
              matchScore: matchResult.score,
              matchedSkills: matchResult.matchedSkills,
              missingSkills: matchResult.missingSkills
            });
          }
        }
      });
    }

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
