/**
 * Reputation Scoring Service
 * Calculates user reputation scores based on multiple factors
 * Returns 0-100 score for matching algorithm (5% weight)
 */

(function() {
  'use strict';

  /**
   * Calculate reputation score for a user
   * @param {string} userId - User ID
   * @returns {Object} - Reputation score and breakdown { score: number, breakdown: Object }
   */
  function calculateReputationScore(userId) {
    if (!userId || typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
      return { score: 50, breakdown: {} }; // Default neutral score
    }

    const user = PMTwinData.Users.getById(userId);
    if (!user) {
      return { score: 50, breakdown: {} };
    }

    const breakdown = {
      completedProjects: 0,
      ratings: 0,
      onTimeDelivery: 0,
      disputeResolution: 0,
      profileCompleteness: 0
    };

    // 1. Completed Projects/Engagements (0-25 points)
    breakdown.completedProjects = calculateCompletedProjectsScore(userId);

    // 2. User Ratings and Reviews (0-25 points)
    breakdown.ratings = calculateRatingsScore(userId);

    // 3. On-Time Delivery Rate (0-20 points)
    breakdown.onTimeDelivery = calculateOnTimeDeliveryScore(userId);

    // 4. Dispute Resolution History (0-15 points)
    breakdown.disputeResolution = calculateDisputeResolutionScore(userId);

    // 5. Profile Completeness (0-15 points)
    breakdown.profileCompleteness = calculateProfileCompletenessScore(user);

    // Total score (0-100)
    const totalScore = Math.round(
      breakdown.completedProjects +
      breakdown.ratings +
      breakdown.onTimeDelivery +
      breakdown.disputeResolution +
      breakdown.profileCompleteness
    );

    return {
      score: Math.min(100, Math.max(0, totalScore)),
      breakdown: breakdown
    };
  }

  /**
   * Calculate score based on completed projects/engagements
   * @param {string} userId - User ID
   * @returns {number} - Score 0-25
   */
  function calculateCompletedProjectsScore(userId) {
    let completedCount = 0;
    let totalCount = 0;

    // Check contracts
    if (PMTwinData.Contracts) {
      const contracts = PMTwinData.Contracts.getAll();
      const userContracts = contracts.filter(c => 
        c.parties && c.parties.some(p => p.partyId === userId)
      );
      totalCount += userContracts.length;
      completedCount += userContracts.filter(c => c.status === 'completed').length;
    }

    // Check engagements
    if (PMTwinData.Engagements) {
      const engagements = PMTwinData.Engagements.getAll();
      const userEngagements = engagements.filter(e => 
        e.providerId === userId || e.clientId === userId
      );
      totalCount += userEngagements.length;
      completedCount += userEngagements.filter(e => e.status === 'completed').length;
    }

    if (totalCount === 0) {
      return 5; // Base score for new users
    }

    const completionRate = completedCount / totalCount;
    return Math.round(completionRate * 25);
  }

  /**
   * Calculate score based on ratings and reviews
   * @param {string} userId - User ID
   * @returns {number} - Score 0-25
   */
  function calculateRatingsScore(userId) {
    let totalRating = 0;
    let ratingCount = 0;

    // Check user profile for ratings
    if (PMTwinData.Users) {
      const user = PMTwinData.Users.getById(userId);
      if (user && user.profile) {
        // Check for ratings in profile
        if (user.profile.ratings && Array.isArray(user.profile.ratings)) {
          user.profile.ratings.forEach(rating => {
            totalRating += rating.value || 0;
            ratingCount++;
          });
        }

        // Check for average rating
        if (user.profile.averageRating) {
          totalRating += user.profile.averageRating * (ratingCount || 1);
          ratingCount = ratingCount || 1;
        }
      }
    }

    // Check service evaluations
    if (PMTwinData.ServiceEvaluations && typeof PMTwinData.ServiceEvaluations.getAll === 'function') {
      try {
        const evaluations = PMTwinData.ServiceEvaluations.getAll();
        if (Array.isArray(evaluations)) {
          const userEvaluations = evaluations.filter(e => e.providerId === userId);
          userEvaluations.forEach(eval => {
            if (eval.rating) {
              totalRating += eval.rating;
              ratingCount++;
            }
          });
        }
      } catch (error) {
        console.warn('[ReputationService] Error getting service evaluations:', error);
      }
    }

    if (ratingCount === 0) {
      return 10; // Base score for users without ratings
    }

    const averageRating = totalRating / ratingCount;
    // Convert 0-5 scale to 0-25 points (assuming 5-star rating system)
    return Math.round((averageRating / 5) * 25);
  }

  /**
   * Calculate score based on on-time delivery rate
   * @param {string} userId - User ID
   * @returns {number} - Score 0-20
   */
  function calculateOnTimeDeliveryScore(userId) {
    let onTimeCount = 0;
    let totalDeliveries = 0;

    // Check contracts with milestones
    if (PMTwinData.Contracts && PMTwinData.Milestones) {
      const contracts = PMTwinData.Contracts.getAll();
      const userContracts = contracts.filter(c => 
        c.parties && c.parties.some(p => p.partyId === userId)
      );

      userContracts.forEach(contract => {
        const milestones = PMTwinData.Milestones.getByContractId(contract.id);
        milestones.forEach(milestone => {
          if (milestone.status === 'completed') {
            totalDeliveries++;
            const dueDate = new Date(milestone.dueDate);
            const completedDate = new Date(milestone.completedAt);
            if (completedDate <= dueDate) {
              onTimeCount++;
            }
          }
        });
      });
    }

    if (totalDeliveries === 0) {
      return 8; // Base score for users without delivery history
    }

    const onTimeRate = onTimeCount / totalDeliveries;
    return Math.round(onTimeRate * 20);
  }

  /**
   * Calculate score based on dispute resolution history
   * @param {string} userId - User ID
   * @returns {number} - Score 0-15
   */
  function calculateDisputeResolutionScore(userId) {
    let resolvedCount = 0;
    let totalDisputes = 0;

    // Check contracts for disputes
    if (PMTwinData.Contracts) {
      const contracts = PMTwinData.Contracts.getAll();
      const userContracts = contracts.filter(c => 
        c.parties && c.parties.some(p => p.partyId === userId)
      );

      userContracts.forEach(contract => {
        if (contract.disputes && Array.isArray(contract.disputes)) {
          contract.disputes.forEach(dispute => {
            totalDisputes++;
            if (dispute.status === 'resolved' || dispute.status === 'closed') {
              resolvedCount++;
            }
          });
        }
      });
    }

    if (totalDisputes === 0) {
      return 12; // High score for users with no disputes
    }

    const resolutionRate = resolvedCount / totalDisputes;
    return Math.round(resolutionRate * 15);
  }

  /**
   * Calculate score based on profile completeness
   * @param {Object} user - User object
   * @returns {number} - Score 0-15
   */
  function calculateProfileCompletenessScore(user) {
    if (!user || !user.profile) {
      return 0;
    }

    let completeness = 0;
    const maxCompleteness = 15;

    // Check required fields
    if (user.profile.name) completeness += 1;
    if (user.profile.phone || user.mobile) completeness += 1;
    if (user.profile.location) completeness += 1;
    if (user.profile.skills && user.profile.skills.length > 0) completeness += 2;
    if (user.profile.experienceLevel) completeness += 1;
    if (user.profile.bio || user.profile.description) completeness += 1;
    if (user.profile.certifications && user.profile.certifications.length > 0) completeness += 2;
    if (user.profile.portfolio && user.profile.portfolio.length > 0) completeness += 2;
    if (user.profile.endorsements && user.profile.endorsements.length > 0) completeness += 2;
    if (user.profile.yearsInBusiness || user.profile.experienceYears) completeness += 1;
    if (user.profile.companyName || user.profile.legalName) completeness += 1;

    return Math.min(maxCompleteness, completeness);
  }

  /**
   * Get reputation score for a user (cached)
   * @param {string} userId - User ID
   * @returns {number} - Reputation score 0-100
   */
  function getReputationScore(userId) {
    const result = calculateReputationScore(userId);
    return result.score;
  }

  /**
   * Update user profile with reputation score
   * @param {string} userId - User ID
   * @returns {Object} - Updated reputation score
   */
  function updateUserReputation(userId) {
    const result = calculateReputationScore(userId);
    
    if (PMTwinData && PMTwinData.Users) {
      const user = PMTwinData.Users.getById(userId);
      if (user) {
        if (!user.profile) {
          user.profile = {};
        }
        user.profile.reputationScore = result.score;
        user.profile.reputationBreakdown = result.breakdown;
        PMTwinData.Users.update(userId, { profile: user.profile });
      }
    }

    return result;
  }

  /**
   * Batch update reputation scores for multiple users
   * @param {string[]} userIds - Array of user IDs
   * @returns {Object} - Map of userId to reputation score
   */
  function batchUpdateReputation(userIds) {
    const results = {};
    userIds.forEach(userId => {
      results[userId] = updateUserReputation(userId);
    });
    return results;
  }

  // ============================================
  // Export
  // ============================================

  window.ReputationService = {
    calculate: calculateReputationScore,
    getScore: getReputationScore,
    update: updateUserReputation,
    batchUpdate: batchUpdateReputation
  };

})();
