/**
 * Matching Service
 * Handles matching algorithm and match-related operations
 */

(function() {
  'use strict';

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
    
    let matches = PMTwinData.Matches.getByProvider(currentUser.id);
    
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


