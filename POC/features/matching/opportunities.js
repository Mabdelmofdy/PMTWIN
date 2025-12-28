/**
 * Opportunities Component - Shows matched projects/opportunities
 */

(function() {
  'use strict';

  function init(params) {
    loadOpportunities();
  }

  async function loadOpportunities() {
    const container = document.getElementById('opportunitiesList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading opportunities...</p>';

      // Load matches using MatchingService
      let matches = [];
      if (typeof MatchingService !== 'undefined') {
        const result = await MatchingService.getMatches({ minScore: 80 });
        if (result.success) {
          matches = result.matches;
        }
      } else if (typeof PMTwinData !== 'undefined') {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          matches = PMTwinData.Matches.getByProvider(currentUser.id).filter(m => m.score >= 80);
        }
      }

      if (matches.length === 0) {
        container.innerHTML = `
          <div class="card">
            <div class="card-body" style="text-align: center; padding: 3rem;">
              <p>No opportunities found at the moment.</p>
              <p style="color: var(--text-secondary); margin-top: 1rem;">
                Complete your profile to get better matches!
              </p>
              <a href="profile.html" class="btn btn-primary" style="margin-top: 1rem;">Update Profile</a>
            </div>
          </div>
        `;
        return;
      }

      // Group matches by project
      const projectMatches = {};
      matches.forEach(match => {
        if (!projectMatches[match.projectId]) {
          projectMatches[match.projectId] = [];
        }
        projectMatches[match.projectId].push(match);
      });

      let html = '<div style="display: grid; gap: 1.5rem;">';
      
      Object.keys(projectMatches).forEach(projectId => {
        const projectMatchesList = projectMatches[projectId];
        const bestMatch = projectMatchesList.sort((a, b) => b.score - a.score)[0];
        const project = PMTwinData?.Projects.getById(projectId);
        
        if (!project) return;

        html += `
          <div class="card">
            <div class="card-body">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                <div>
                  <h3 style="margin: 0 0 0.5rem 0;">${project.title || 'Untitled Project'}</h3>
                  <p style="margin: 0; color: var(--text-secondary);">
                    ${project.category || 'General'} • ${project.location?.city || 'Location TBD'}
                  </p>
                </div>
                <span class="badge badge-success">
                  ${bestMatch.score}% Match
                </span>
              </div>
              
              <p style="margin-bottom: 1rem;">${(project.description || '').substring(0, 200)}...</p>
              
              <div style="margin-bottom: 1rem;">
                <p><strong>Match Details:</strong></p>
                <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
                  <li>Category Match: ${bestMatch.criteria?.categoryMatch || 'N/A'}%</li>
                  <li>Skills Match: ${bestMatch.criteria?.skillsMatch || 'N/A'}%</li>
                  <li>Experience Match: ${bestMatch.criteria?.experienceMatch || 'N/A'}%</li>
                  <li>Location Match: ${bestMatch.criteria?.locationMatch || 'N/A'}%</li>
                </ul>
              </div>
              
              <div style="display: flex; gap: 1rem;">
                <a href="#project/${project.id}" class="btn btn-primary btn-sm">View Project</a>
                <a href="#create-proposal?projectId=${project.id}" class="btn btn-success btn-sm">Submit Proposal</a>
                <a href="#matches" class="btn btn-secondary btn-sm">View All Matches</a>
              </div>
            </div>
          </div>
        `;
      });
      
      html += '</div>';
      container.innerHTML = html;
    } catch (error) {
      console.error('Error loading opportunities:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading opportunities. Please try again.</p>';
    }
  }

  // Export
  if (!window.matching) window.matching = {};
  window.matching.opportunities = {
    init,
    loadOpportunities
  };

})();

