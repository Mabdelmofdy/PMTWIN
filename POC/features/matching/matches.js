/**
 * Matches Component - HTML triggers for MatchingService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadMatches();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Form submission is handled by applyFilters
  }

  // ============================================
  // HTML Triggers for MatchingService Functions
  // ============================================

  // Trigger: getMatches() - Load all matches
  async function loadMatches() {
    const container = document.getElementById('matchesList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading matches...</p>';

      let result;
      if (typeof MatchingService !== 'undefined') {
        result = await MatchingService.getMatches(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Matching service not available</p>';
        return;
      }

      if (result.success && result.matches) {
        renderMatches(container, result.matches);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load matches'}</p>`;
      }
    } catch (error) {
      console.error('Error loading matches:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading matches. Please try again.</p>';
    }
  }

  // Trigger: getMatches(filters) - Filter matches
  async function filterMatches(filters) {
    currentFilters = { ...currentFilters, ...filters };
    await loadMatches();
  }

  // Trigger: getMatches(filters) - Apply filters from form
  async function applyFilters(event) {
    event.preventDefault();
    
    const form = event.target;
    const filters = {};
    
    const minScore = document.getElementById('minScoreFilter')?.value;
    if (minScore) filters.minScore = parseInt(minScore);
    
    const projectId = document.getElementById('projectIdFilter')?.value;
    if (projectId) filters.projectId = projectId;
    
    const notified = document.getElementById('notifiedFilter')?.value;
    if (notified !== '') filters.notified = notified === 'true';
    
    currentFilters = filters;
    await loadMatches();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('matchFiltersForm')?.reset();
    loadMatches();
  }

  // Trigger: getMatchById(matchId) - View match details
  async function viewMatch(matchId) {
    try {
      if (typeof MatchingService === 'undefined') {
        alert('Matching service not available');
        return;
      }

      const result = await MatchingService.getMatchById(matchId);
      
      if (result.success && result.match) {
        showMatchDetails(result.match);
      } else {
        alert(result.error || 'Failed to load match details');
      }
    } catch (error) {
      console.error('Error viewing match:', error);
      alert('Error loading match details');
    }
  }

  // Trigger: markMatchAsViewed(matchId) - Mark match as viewed
  async function markAsViewed(matchId) {
    try {
      if (typeof MatchingService === 'undefined') {
        alert('Matching service not available');
        return;
      }

      const result = await MatchingService.markMatchAsViewed(matchId);
      
      if (result.success) {
        // Reload matches to update UI
        await loadMatches();
        alert('Match marked as viewed');
      } else {
        alert(result.error || 'Failed to mark match as viewed');
      }
    } catch (error) {
      console.error('Error marking match as viewed:', error);
      alert('Error updating match');
    }
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderMatches(container, matches) {
    if (matches.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No matches found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    matches.forEach(match => {
      const project = PMTwinData?.Projects.getById(match.projectId);
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h3 style="margin: 0 0 0.5rem 0;">${project?.title || 'Project ' + match.projectId}</h3>
                <p style="margin: 0; color: var(--text-secondary);">
                  Match Score: <strong>${match.score}%</strong>
                </p>
              </div>
              <span class="badge badge-${match.score >= 80 ? 'success' : 'warning'}">
                ${match.score}% Match
              </span>
            </div>
            
            <div style="margin-bottom: 1rem;">
              <p><strong>Category Match:</strong> ${match.criteria?.categoryMatch || 'N/A'}%</p>
              <p><strong>Skills Match:</strong> ${match.criteria?.skillsMatch || 'N/A'}%</p>
              <p><strong>Experience Match:</strong> ${match.criteria?.experienceMatch || 'N/A'}%</p>
              <p><strong>Location Match:</strong> ${match.criteria?.locationMatch || 'N/A'}%</p>
            </div>
            
            <div style="display: flex; gap: 1rem;">
              <button onclick="matchesComponent.viewMatch('${match.id}')" class="btn btn-primary btn-sm">
                View Details
              </button>
              ${!match.viewed ? `
                <button onclick="matchesComponent.markAsViewed('${match.id}')" class="btn btn-secondary btn-sm">
                  Mark as Viewed
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function showMatchDetails(match) {
    const project = PMTwinData?.Projects.getById(match.projectId);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    modal.innerHTML = `
      <div class="card" style="max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2>Match Details</h2>
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary btn-sm">Close</button>
          </div>
          <h3>${project?.title || 'Project ' + match.projectId}</h3>
          <p><strong>Match Score:</strong> ${match.score}%</p>
          <div>
            <h4>Criteria Breakdown:</h4>
            <ul>
              <li>Category Match: ${match.criteria?.categoryMatch || 'N/A'}%</li>
              <li>Skills Match: ${match.criteria?.skillsMatch || 'N/A'}%</li>
              <li>Experience Match: ${match.criteria?.experienceMatch || 'N/A'}%</li>
              <li>Location Match: ${match.criteria?.locationMatch || 'N/A'}%</li>
            </ul>
          </div>
          <div style="margin-top: 1rem;">
            <button onclick="window.location.hash='#create-proposal?projectId=${match.projectId}'" class="btn btn-primary">
              Submit Proposal
            </button>
            <button onclick="matchesComponent.markAsViewed('${match.id}'); this.closest('.modal').remove();" class="btn btn-secondary">
              Mark as Viewed
            </button>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.addEventListener('click', function(e) {
      if (e.target === modal) modal.remove();
    });
  }

  // Export
  if (!window.matching) window.matching = {};
  window.matching.matches = { 
    init,
    loadMatches,
    filterMatches,
    applyFilters,
    clearFilters,
    viewMatch,
    markAsViewed
  };

  // Global reference for onclick handlers
  window.matchesComponent = window.matching.matches;

})();

