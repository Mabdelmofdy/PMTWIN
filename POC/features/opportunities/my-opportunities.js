/**
 * My Opportunities Component
 * Shows opportunities created by the current user
 */

(function() {
  'use strict';

  let currentUserId = null;
  let currentFilters = {
    scope: 'mine', // all | mine | matches (default: mine - show user's own opportunities)
    intent: null,
    status: null
  };

  /**
   * Initialize component
   */
  function init() {
    // Get current user
    try {
      const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        currentUserId = session.userId || session.id;
      }
      
      // Fallback methods
      if (!currentUserId && typeof window.currentUser !== 'undefined' && window.currentUser) {
        currentUserId = window.currentUser.userId || window.currentUser.id;
      }
      if (!currentUserId && typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          currentUserId = currentUser.id;
        }
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }

    const draftEl = document.getElementById('myOpportunitiesDraftList');
    const publishedEl = document.getElementById('myOpportunitiesPublishedList');
    const errMsg = '<p class="alert alert-error">Unable to identify current user. Please log in.</p>';
    if (!currentUserId) {
      if (draftEl) draftEl.innerHTML = errMsg;
      if (publishedEl) publishedEl.innerHTML = '';
      return;
    }
    
    loadOpportunities();
  }

  /**
   * Load opportunities
   */
  function loadOpportunities() {
    const draftContainer = document.getElementById('myOpportunitiesDraftList');
    const publishedContainer = document.getElementById('myOpportunitiesPublishedList');
    if (!draftContainer || !publishedContainer || !window.OpportunityStore) {
      console.error('Containers or OpportunityStore not available');
      return;
    }

    const userSkills = getCurrentUserSkills();

    // Default: show opportunities created by current user
    let opportunities = [];
    if (currentFilters.scope === 'mine') {
      opportunities = window.OpportunityStore.getOpportunitiesByCreator(currentUserId);
    } else {
      opportunities = window.OpportunityStore.getAllOpportunities();
    }

    // Attach match info
    opportunities = opportunities.map(opp => {
      const match = computeSkillMatch(opp, userSkills);
      return { ...opp, __matchScore: match.score, __matchSkills: match.matchedSkills };
    });

    if (currentFilters.scope === 'matches') {
      opportunities = opportunities.filter(o => o.__matchScore > 0);
    }

    // Apply intent filter
    if (currentFilters.intent) {
      opportunities = opportunities.filter(opp => opp.intent === currentFilters.intent);
    }

    // Split into draft and published (published includes PUBLISHED + CLOSED)
    const statusNorm = s => (s || '').toUpperCase();
    let drafts = opportunities.filter(opp => statusNorm(opp.status) === 'DRAFT');
    let published = opportunities.filter(opp =>
      statusNorm(opp.status) === 'PUBLISHED' || statusNorm(opp.status) === 'CLOSED'
    );

    // Apply status filter: if user selected a specific status, show only that section's list
    if (currentFilters.status) {
      const want = statusNorm(currentFilters.status);
      if (want === 'DRAFT') {
        published = [];
      } else if (want === 'PUBLISHED' || want === 'CLOSED') {
        drafts = [];
        if (want === 'PUBLISHED') published = published.filter(o => statusNorm(o.status) === 'PUBLISHED');
        else if (want === 'CLOSED') published = published.filter(o => statusNorm(o.status) === 'CLOSED');
      }
    }

    // Sort: newest first
    const sortByNewest = (a, b) => {
      const aTime = Date.parse(a.createdAt || '') || 0;
      const bTime = Date.parse(b.createdAt || '') || 0;
      return bTime - aTime;
    };
    drafts.sort(sortByNewest);
    published.sort(sortByNewest);

    const emptyDraftHtml = `
      <div class="card enhanced-card">
        <div class="card-body" style="text-align: center; padding: 2rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-secondary);">
            <i class="ph ph-file-dashed"></i>
          </div>
          <p style="color: var(--text-secondary); margin-bottom: 1rem;">No draft opportunities.</p>
          <a href="../create/" class="btn btn-primary"><i class="ph ph-plus"></i> Create Opportunity</a>
        </div>
      </div>
    `;
    const emptyPublishedHtml = `
      <div class="card enhanced-card">
        <div class="card-body" style="text-align: center; padding: 2rem;">
          <div style="font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-secondary);">
            <i class="ph ph-paper-plane-tilt"></i>
          </div>
          <p style="color: var(--text-secondary);">No published opportunities yet. Publish a draft to see it here.</p>
        </div>
      </div>
    `;

    draftContainer.innerHTML = drafts.length === 0 ? emptyDraftHtml : drafts.map(opp => renderOpportunityCard(opp)).join('');
    publishedContainer.innerHTML = published.length === 0 ? emptyPublishedHtml : published.map(opp => renderOpportunityCard(opp)).join('');
  }

  /**
   * Render a single opportunity card (shared by draft and published sections)
   */
  function renderOpportunityCard(opp) {
    const proposals = window.OpportunityStore.getProposalsByOpportunityId(opp.id);
    const proposalCounts = {
      SUBMITTED: proposals.filter(p => p.status === 'SUBMITTED').length,
      CHANGES_REQUESTED: proposals.filter(p => p.status === 'CHANGES_REQUESTED').length,
      RESUBMITTED: proposals.filter(p => p.status === 'RESUBMITTED').length,
      ACCEPTED: proposals.filter(p => p.status === 'ACCEPTED').length
    };
    const totalProposals = proposals.length;
    const isDraft = (opp.status || '').toUpperCase() === 'DRAFT';

    const intentBadge = opp.intent === 'REQUEST_SERVICE' ?
      '<span class="badge badge-info"><i class="ph ph-hand"></i> Request Service</span>' :
      '<span class="badge badge-success"><i class="ph ph-handshake"></i> Offer Service</span>';

    const detailsUrl = window.UrlHelper ?
      window.UrlHelper.buildUrlWithQuery('pages/opportunities/details.html', { id: opp.id }) :
      `../details.html?id=${opp.id}`;

    const matchBadge = opp.__matchScore > 0 ? `
      <span class="badge badge-primary" title="Matched skills: ${(opp.__matchSkills || []).join(', ')}">
        <i class="ph ph-star"></i> Match: ${opp.__matchScore}
      </span>
    ` : '';

    const mineBadge = (opp.createdByUserId === currentUserId || opp.createdBy === currentUserId) ? `
      <span class="badge badge-secondary"><i class="ph ph-user"></i> Mine</span>
    ` : '';

    return `
      <div class="card enhanced-card" style="margin-bottom: 1.5rem;">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem; margin-bottom: 1rem;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                <h3 style="margin: 0; flex: 1;">
                  <a href="${detailsUrl}" style="text-decoration: none; color: inherit;">${escapeHtml(opp.title)}</a>
                </h3>
                ${getStatusBadge(opp.status)}
              </div>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 0.75rem;">
                ${intentBadge}
                ${mineBadge}
                ${matchBadge}
                ${opp.location && opp.location.city && opp.location.country ?
                  `<span class="badge badge-secondary"><i class="ph ph-map-pin"></i> ${escapeHtml(opp.location.city)}, ${escapeHtml(opp.location.country)}</span>` : ''}
              </div>
              <p style="margin: 0 0 1rem 0; color: var(--text-secondary); line-height: 1.6;">
                ${escapeHtml((opp.description || '').substring(0, 200))}${(opp.description || '').length > 200 ? '...' : ''}
              </p>
            </div>
          </div>

          ${!isDraft ? `
          <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 1rem;">
            <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: block;">Proposal Statistics:</strong>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 0.75rem;">
              <div>
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-primary);">${totalProposals}</div>
                <div style="font-size: 0.875rem; color: var(--text-secondary);">Total</div>
              </div>
              ${proposalCounts.SUBMITTED > 0 ? `
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-info);">${proposalCounts.SUBMITTED}</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">Submitted</div>
                </div>
              ` : ''}
              ${proposalCounts.RESUBMITTED > 0 ? `
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${proposalCounts.RESUBMITTED}</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">Resubmitted</div>
                </div>
              ` : ''}
              ${proposalCounts.CHANGES_REQUESTED > 0 ? `
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-warning);">${proposalCounts.CHANGES_REQUESTED}</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">Changes Req.</div>
                </div>
              ` : ''}
              ${proposalCounts.ACCEPTED > 0 ? `
                <div>
                  <div style="font-size: 1.5rem; font-weight: 700; color: var(--color-success);">${proposalCounts.ACCEPTED}</div>
                  <div style="font-size: 0.875rem; color: var(--text-secondary);">Accepted</div>
                </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          <div style="display: flex; gap: 0.75rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
            ${(opp.status || '').toUpperCase() === 'DRAFT' ? `
              <button class="btn btn-success" onclick="myOpportunities.publishOpportunity('${opp.id}')">
                <i class="ph ph-paper-plane-tilt"></i> Publish
              </button>
            ` : ''}
            <a href="${detailsUrl}" class="btn btn-primary">
              <i class="ph ph-eye"></i> View Details
            </a>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Update filter
   */
  function updateFilter(filterName, value) {
    if (filterName === 'scope') {
      currentFilters.scope = value || 'all';
    } else {
      currentFilters[filterName] = value || null;
    }
    loadOpportunities();
  }

  /**
   * Clear filters
   */
  function clearFilters() {
    currentFilters = {
      scope: 'mine', // Default back to showing user's own opportunities
      intent: null,
      status: null
    };
    const scopeEl = document.getElementById('filterScope');
    if (scopeEl) scopeEl.value = 'mine';
    document.getElementById('filterIntent').value = '';
    document.getElementById('filterStatus').value = '';
    loadOpportunities();
  }

  /**
   * Publish opportunity
   */
  function publishOpportunity(opportunityId) {
    if (!window.OpportunityStore) return;

    const updated = window.OpportunityStore.publishOpportunity(opportunityId);
    if (updated) {
      alert('Opportunity published successfully!');
      loadOpportunities();
    } else {
      alert('Failed to publish opportunity');
    }
  }

  /**
   * Get status badge with consistent styling
   */
  function getStatusBadge(status) {
    if (!status) return '';
    const statusUpper = status.toUpperCase();
    const statusColors = {
      'DRAFT': 'badge-warning',
      'PUBLISHED': 'badge-success',
      'CLOSED': 'badge-secondary',
      'SUBMITTED': 'badge-info',
      'CHANGES_REQUESTED': 'badge-warning',
      'RESUBMITTED': 'badge-success',
      'ACCEPTED': 'badge-success',
      'REJECTED': 'badge-error'
    };
    const colorClass = statusColors[statusUpper] || 'badge-secondary';
    return `<span class="badge ${colorClass}">${status}</span>`;
  }

  /**
   * Helper: Escape HTML
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // Matching helpers (skills)
  // ============================================
  function getCurrentUserSkills() {
    try {
      // Prefer PMTwinData current user profile skills
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Sessions) {
        const u = PMTwinData.Sessions.getCurrentUser();
        const skills = u?.profile?.skills || u?.skills || [];
        if (Array.isArray(skills) && skills.length > 0) return skills;
      }
      // Fallback: OpportunityStore users list (some demo users use u.skills)
      if (window.OpportunityStore && window.OpportunityStore.getUserById) {
        const u = window.OpportunityStore.getUserById(currentUserId);
        const skills = u?.skills || [];
        if (Array.isArray(skills) && skills.length > 0) return skills;
      }
    } catch (e) {
      console.warn('[MyOpportunities] Failed to read user skills:', e);
    }
    return [];
  }

  function normalizeSkill(skill) {
    if (!skill) return '';
    return String(skill)
      .trim()
      .toLowerCase()
      .replace(/[_\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-');
  }

  function computeSkillMatch(opportunity, userSkills) {
    const oppSkillsRaw = opportunity?.skillsTags || opportunity?.skills || [];
    const oppSkills = Array.isArray(oppSkillsRaw) ? oppSkillsRaw : [];
    const user = Array.isArray(userSkills) ? userSkills : [];

    const oppSet = new Set(oppSkills.map(normalizeSkill).filter(Boolean));
    if (oppSet.size === 0 || user.length === 0) return { score: 0, matchedSkills: [] };

    const matched = [];
    for (const us of user) {
      const n = normalizeSkill(us);
      if (!n) continue;
      if (oppSet.has(n)) matched.push(n);
      // Also try matching individual tokens for phrase skills (e.g., "Project Management" -> "project-management")
      const token = n.includes('-') ? n : n;
      if (token && oppSet.has(token) && !matched.includes(token)) matched.push(token);
    }

    // De-dup and return
    const unique = [...new Set(matched)];
    return { score: unique.length, matchedSkills: unique.slice(0, 8) };
  }

  // Export
  window.myOpportunities = {
    init: init,
    updateFilter: updateFilter,
    clearFilters: clearFilters,
    publishOpportunity: publishOpportunity
  };

})();
