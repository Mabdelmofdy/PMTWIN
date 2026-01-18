/**
 * Matches Component - HTML triggers for MatchingService functions
 */

(function() {
  'use strict';

  let currentFilters = {};

  // ============================================
  // Get Base Path Helper
  // ============================================
  function getBasePath() {
    // For local development: count all path segments to determine depth
    const currentPath = window.location.pathname;
    // Remove leading/trailing slashes and split, filter out empty strings and HTML files
    const segments = currentPath.split('/').filter(p => p && !p.endsWith('.html'));
    
    // Count how many directory levels deep we are
    const depth = segments.length;
    
    // Generate the appropriate number of ../ to reach POC root
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  async function init(params) {
    // Wait for MatchesService to be available
    if (typeof MatchesService === 'undefined') {
      // Wait a bit for services to load
      await new Promise(resolve => {
        if (typeof MatchesService !== 'undefined') {
          resolve();
          return;
        }
        
        const checkInterval = setInterval(() => {
          if (typeof MatchesService !== 'undefined') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
        
        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      });
    }
    
    loadMatches();
    setupEventListeners();
  }

  function setupEventListeners() {
    // Form submission is handled by applyFilters
  }

  // ============================================
  // HTML Triggers for MatchingService Functions
  // ============================================

  // Trigger: getMatchesForCurrentUser() - Load all matches
  async function loadMatches() {
    const container = document.getElementById('matchesList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading matches...</p>';

      let result;
      if (typeof MatchesService !== 'undefined') {
        result = await MatchesService.getMatchesForCurrentUser();
      } else {
        container.innerHTML = '<p class="alert alert-error">Matches service not available</p>';
        return;
      }

      if (result.success && result.matches) {
        // Apply filters
        let filteredMatches = result.matches;
        if (currentFilters.minScore) {
          filteredMatches = filteredMatches.filter(m => m.matchScore >= currentFilters.minScore);
        }
        if (currentFilters.projectId) {
          filteredMatches = filteredMatches.filter(m => m.targetId === currentFilters.projectId);
        }
        
        renderMatches(container, filteredMatches);
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
            <p style="color: var(--text-secondary); margin-top: 1rem;">
              Complete your profile with skills to see matching projects!
            </p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1.5rem;">';
    
    matches.forEach(match => {
      const target = match.target;
      const targetType = match.targetType;
      const targetId = match.targetId;
      const matchScore = match.matchScore;
      const matchedSkills = match.matchedSkills || [];
      const missingSkills = match.missingSkills || [];
      
      // Escape HTML to prevent XSS
      const escapeHtml = (text) => {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      };
      
      const title = target?.title || `Opportunity ${targetId}`;
      const description = target?.description || '';
      const isMegaProject = targetType === 'MEGA_PROJECT' || target?.projectType === 'mega';
      const isServiceRequest = targetType === 'SERVICE_REQUEST';
      
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                  <h3 style="margin: 0;">${escapeHtml(title)}</h3>
                  ${isMegaProject ? `
                    <span class="badge badge-info" title="Mega-Project">
                      <i class="ph ph-stack"></i> Mega-Project
                    </span>
                  ` : ''}
                  ${isServiceRequest ? `
                    <span class="badge badge-secondary" title="Service Request">
                      <i class="ph ph-wrench"></i> Service Request
                    </span>
                  ` : ''}
                </div>
                <p style="margin: 0; color: var(--text-secondary);">
                  ${target?.category || 'General'} • ${target?.location?.city || 'Location TBD'}
                </p>
              </div>
              <span class="badge badge-${matchScore >= 80 ? 'success' : matchScore >= 50 ? 'warning' : 'secondary'}" style="font-size: 1.1rem; padding: 0.5rem 1rem;">
                ${matchScore}% Match
              </span>
            </div>
            
            <div style="background: var(--color-info-light, #e3f2fd); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
              <p style="margin: 0 0 0.5rem 0; font-weight: var(--font-weight-semibold);">
                <i class="ph ph-lightning"></i> Match Score: ${matchScore}%
              </p>
              
              <!-- Skills Match Breakdown -->
              <div style="margin-bottom: 0.75rem;">
                <p style="margin: 0 0 0.25rem 0; font-size: 0.875rem; font-weight: var(--font-weight-semibold);">
                  Skills Match: ${match.skillsScore || matchScore}%
                </p>
                ${matchedSkills.length > 0 ? `
                  <p style="margin: 0 0 0.25rem 0; font-size: 0.85rem; color: var(--color-success);">
                    <i class="ph ph-check-circle"></i> Matched: ${matchedSkills.slice(0, 5).join(', ')}${matchedSkills.length > 5 ? ` +${matchedSkills.length - 5} more` : ''}
                  </p>
                ` : ''}
                ${missingSkills.length > 0 ? `
                  <p style="margin: 0; font-size: 0.85rem; color: var(--color-warning);">
                    <i class="ph ph-warning"></i> Missing: ${missingSkills.slice(0, 3).join(', ')}${missingSkills.length > 3 ? ` +${missingSkills.length - 3} more` : ''}
                  </p>
                ` : ''}
              </div>
              
              <!-- Location Match -->
              ${match.locationReason ? `
                <div style="margin-bottom: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(0,0,0,0.1);">
                  <p style="margin: 0 0 0.25rem 0; font-size: 0.875rem; font-weight: var(--font-weight-semibold);">
                    Location Compatibility: ${match.locationScore || 0}%
                  </p>
                  <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
                    <i class="ph ph-map-pin"></i> ${match.locationReason}
                  </p>
                </div>
              ` : ''}
              
              <!-- Payment Compatibility -->
              ${match.paymentCompatibility ? `
                <div style="padding-top: 0.75rem; border-top: 1px solid rgba(0,0,0,0.1);">
                  <p style="margin: 0 0 0.25rem 0; font-size: 0.875rem; font-weight: var(--font-weight-semibold);">
                    Payment Compatibility
                  </p>
                  <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">
                    <i class="ph ph-currency-circle-dollar"></i> ${match.paymentCompatibility}
                  </p>
                </div>
              ` : ''}
              
              ${matchedSkills.length > 0 ? `
                <p style="margin: 0 0 0.5rem 0; font-size: 0.9rem;">
                  <strong>Matched Skills:</strong>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem;">
                    ${matchedSkills.map(skill => `
                      <span class="badge badge-success" style="font-size: 0.85rem;">${escapeHtml(skill)}</span>
                    `).join('')}
                  </div>
                </p>
              ` : ''}
              ${missingSkills.length > 0 ? `
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                  <strong>Missing Skills:</strong>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem; margin-top: 0.25rem;">
                    ${missingSkills.map(skill => `
                      <span class="badge badge-secondary" style="font-size: 0.85rem;">${escapeHtml(skill)}</span>
                    `).join('')}
                  </div>
                </p>
              ` : ''}
            </div>
            
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              ${targetType === 'PROJECT' || targetType === 'MEGA_PROJECT' || targetType === 'OPPORTUNITY' ? `
                <a href="${getBasePath()}opportunities/view/?id=${targetId}" class="btn btn-primary btn-sm">
                  <i class="ph ph-eye"></i> View Opportunity
                </a>
                <a href="${getBasePath()}proposals/create/?opportunityId=${targetId}" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Send Engagement Request
                </a>
              ` : targetType === 'SERVICE_REQUEST' ? `
                <a href="${getBasePath()}opportunities/view/?id=${targetId}" class="btn btn-primary btn-sm">
                  <i class="ph ph-eye"></i> View Opportunity
                </a>
                <a href="${getBasePath()}proposals/create/?opportunityId=${targetId}" class="btn btn-success btn-sm">
                  <i class="ph ph-paper-plane-tilt"></i> Send Engagement Request
                </a>
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
    const isMegaProject = match.isMegaProject || project?.projectType === 'mega' || project?.subProjects;
    
    // Escape HTML to prevent XSS
    const escapeHtml = (text) => {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    };
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000;';
    
    let criteriaHtml = '';
    if (match.isSkillBased) {
      criteriaHtml = `
        <div style="background: var(--color-info-light, #e3f2fd); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1rem;">
          <h4 style="margin: 0 0 0.75rem 0;"><i class="ph ph-lightning"></i> Skills Match: ${match.score}%</h4>
          ${match.matchedSkills && match.matchedSkills.length > 0 ? `
            <p style="margin: 0 0 0.5rem 0;"><strong>Matched Skills:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.5rem;">
              ${match.matchedSkills.map(skill => `
                <span class="badge badge-success">${escapeHtml(skill)}</span>
              `).join('')}
            </div>
          ` : ''}
          ${match.requiredSkills && match.requiredSkills.length > 0 ? `
            <p style="margin: 0;"><strong>All Required Skills:</strong></p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.5rem;">
              ${match.requiredSkills.map(skill => {
                const isMatched = match.matchedSkills?.some(ms => ms.toLowerCase() === skill.toLowerCase());
                return `<span class="badge ${isMatched ? 'badge-success' : 'badge-secondary'}">${escapeHtml(skill)}</span>`;
              }).join('')}
            </div>
          ` : ''}
        </div>
      `;
    } else {
      criteriaHtml = `
        <div>
          <h4>Criteria Breakdown:</h4>
          <ul>
            <!-- BRD-Compliant Match Score Breakdown -->
            <li><strong>Attribute Overlap (40%):</strong> ${match.criteria?.attributeOverlap || match.criteria?.skillsMatch || 'N/A'}%</li>
            <li><strong>Budget/Value Fit (30%):</strong> ${match.criteria?.budgetValueFit || 'N/A'}%</li>
            <li><strong>Timeline Compatibility (15%):</strong> ${match.criteria?.timelineCompatibility || 'N/A'}%</li>
            <li><strong>Location Fit (10%):</strong> ${match.criteria?.locationFit || match.criteria?.locationMatch || 'N/A'}%</li>
            <li><strong>Reputation (5%):</strong> ${match.criteria?.reputation || 'N/A'}%</li>
          </ul>
        </div>
      `;
    }
    
    let megaProjectHtml = '';
    if (isMegaProject && match.subProjectMatches && match.subProjectMatches.length > 0) {
      megaProjectHtml = `
        <div style="background: var(--color-background-secondary, #f5f5f5); padding: 1rem; border-radius: var(--border-radius); margin-top: 1rem;">
          <h4 style="margin: 0 0 0.75rem 0;">
            <i class="ph ph-stack"></i> Matching Sub-Projects (${match.matchingSubProjects} of ${match.totalSubProjects})
          </h4>
          <div style="display: grid; gap: 0.75rem;">
            ${match.subProjectMatches.map(subMatch => `
              <div style="background: white; padding: 1rem; border-radius: var(--border-radius); border-left: 3px solid var(--color-primary);">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                  <strong>${escapeHtml(subMatch.title)}</strong>
                  <span class="badge badge-${subMatch.matchPercentage >= 80 ? 'success' : subMatch.matchPercentage >= 50 ? 'warning' : 'secondary'}">
                    ${subMatch.matchPercentage}% Match
                  </span>
                </div>
                ${subMatch.matchedSkills && subMatch.matchedSkills.length > 0 ? `
                  <p style="margin: 0.5rem 0 0.25rem 0; font-size: 0.9rem;"><strong>Matched Skills:</strong></p>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.25rem;">
                    ${subMatch.matchedSkills.map(skill => `
                      <span class="badge badge-success" style="font-size: 0.85rem;">${escapeHtml(skill)}</span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }
    
    modal.innerHTML = `
      <div class="card" style="max-width: 700px; width: 90%; max-height: 90vh; overflow-y: auto;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
            <h2 style="margin: 0;">Match Details</h2>
            <button onclick="this.closest('.modal').remove()" class="btn btn-secondary btn-sm">Close</button>
          </div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem;">
            <h3 style="margin: 0;">${escapeHtml(project?.title || 'Project ' + match.projectId)}</h3>
            ${isMegaProject ? `
              <span class="badge badge-info">
                <i class="ph ph-stack"></i> Mega-Project
              </span>
            ` : ''}
            ${match.isSkillBased ? `
              <span class="badge badge-secondary">
                <i class="ph ph-lightning"></i> Skills Match
              </span>
            ` : ''}
          </div>
          <p style="margin-bottom: 1rem;">
            <strong>Match Score:</strong> 
            <span class="badge badge-${match.score >= 80 ? 'success' : match.score >= 50 ? 'warning' : 'secondary'}" style="font-size: 1rem;">
              ${match.score}%
            </span>
          </p>
          ${criteriaHtml}
          ${megaProjectHtml}
          <div style="margin-top: 1.5rem; display: flex; gap: 1rem; flex-wrap: wrap;">
            <a href="${getBasePath()}project/?id=${match.projectId}" class="btn btn-primary">
              <i class="ph ph-eye"></i> View Full Project
            </a>
            <a href="${getBasePath()}proposals/create/?opportunityId=${match.targetId || match.projectId || match.opportunityId}" class="btn btn-success">
              <i class="ph ph-paper-plane-tilt"></i> Submit Proposal
            </a>
            ${match.isExistingMatch && !match.viewed ? `
              <button onclick="matchesComponent.markAsViewed('${match.id}'); this.closest('.modal').remove();" class="btn btn-secondary">
                <i class="ph ph-check"></i> Mark as Viewed
              </button>
            ` : ''}
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

