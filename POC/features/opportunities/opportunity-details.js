/**
 * Opportunity Details Component
 * Handles display and actions for opportunity details page
 */

(function() {
  'use strict';

  let currentOpportunity = null;
  let currentUserId = null;
  let matches = [];

  /**
   * Initialize component
   */
  function init(opportunityId) {
    // Get current user
    try {
      const sessionStr = localStorage.getItem('pmtwin_current_user') || localStorage.getItem('pmtwin_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        currentUserId = session.userId || session.id;
      }
    } catch (e) {
      console.error('Error getting current user:', e);
    }

    // Load opportunity - try OpportunityStore first (used by My Opportunities / create flow), then PMTwinData
    console.log('[OpportunityDetails] Loading opportunity:', opportunityId);
    
    if (window.OpportunityStore) {
      currentOpportunity = window.OpportunityStore.getOpportunityById(opportunityId);
      if (currentOpportunity) {
        console.log('[OpportunityDetails] Found opportunity in OpportunityStore:', currentOpportunity.id);
      }
    }
    
    if (!currentOpportunity && typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      currentOpportunity = PMTwinData.Opportunities.getById(opportunityId);
      if (currentOpportunity) {
        console.log('[OpportunityDetails] Found opportunity in PMTwinData:', currentOpportunity.id);
      }
    }
    
    if (!currentOpportunity && typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      const allOpps = PMTwinData.Opportunities.getAll();
      if (Array.isArray(allOpps) && allOpps.length > 0) {
        currentOpportunity = allOpps.find(o => o.id === opportunityId) || null;
        if (currentOpportunity) {
          console.log('[OpportunityDetails] Found opportunity in PMTwinData.getAll():', currentOpportunity.id);
        }
      }
    }
    
    if (!currentOpportunity) {
      try {
        const stored = localStorage.getItem('pmtwin_opportunities');
        if (stored) {
          const parsed = JSON.parse(stored);
          const arr = Array.isArray(parsed) ? parsed : [];
          currentOpportunity = arr.find(o => o.id === opportunityId) || null;
          if (currentOpportunity) {
            console.log('[OpportunityDetails] Found in localStorage pmtwin_opportunities:', currentOpportunity.id);
          }
        }
      } catch (e) {
        console.error('[OpportunityDetails] Error checking localStorage:', e);
      }
    }
    
    if (!currentOpportunity) {
      console.error('[OpportunityDetails] Opportunity not found in either store. ID:', opportunityId);
      
      // Get available opportunity IDs for debugging
      let availableIds = [];
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
        const allOpps = PMTwinData.Opportunities.getAll();
        if (Array.isArray(allOpps)) availableIds = allOpps.slice(0, 10).map(o => o.id);
      }
      if (window.OpportunityStore) {
        const storeOpps = window.OpportunityStore.getAllOpportunities();
        availableIds = [...availableIds, ...(storeOpps || []).slice(0, 10).map(o => o.id)];
      }
      
      const container = document.getElementById('opportunityDetails');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-error">
            <p><strong>Opportunity not found.</strong></p>
            <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
              <strong>Requested ID:</strong> ${escapeHtml(opportunityId)}
            </p>
            ${availableIds.length > 0 ? `
              <p style="font-size: 0.9rem; margin-top: 0.5rem; color: var(--text-secondary);">
                <strong>Available opportunity IDs (sample):</strong><br>
                ${availableIds.slice(0, 5).map(id => `<code style="font-size: 0.85rem;">${escapeHtml(id)}</code>`).join('<br>')}
                ${availableIds.length > 5 ? `<br><em>... and ${availableIds.length - 5} more</em>` : ''}
              </p>
            ` : ''}
            <p style="font-size: 0.9rem; margin-top: 1rem;">
              <a href="../my/" class="btn btn-secondary">
                <i class="ph ph-arrow-left"></i> Back to My Opportunities
              </a>
            </p>
          </div>
        `;
      }
      return;
    }
    
    // Normalize so both OpportunityStore and PMTwinData shapes work
    currentOpportunity = normalizeOpportunity(currentOpportunity);
    console.log('[OpportunityDetails] Successfully loaded opportunity:', currentOpportunity.title || currentOpportunity.id);

    renderOpportunity();
    renderActions();
    renderProposals();
  }

  /**
   * Normalize opportunity from either OpportunityStore or PMTwinData so render works
   */
  function normalizeOpportunity(opp) {
    if (!opp) return opp;
    const status = (opp.status || '').toString().toUpperCase();
    return {
      ...opp,
      title: opp.title || opp.name || '',
      description: opp.description || '',
      createdByUserId: opp.createdByUserId || opp.createdBy || opp.creatorId,
      status: status === 'DRAFT' || status === 'PUBLISHED' || status === 'CLOSED' ? status : (opp.status || 'DRAFT'),
      intent: opp.intent || opp.intentType,
      skillsTags: Array.isArray(opp.skillsTags) ? opp.skillsTags : (Array.isArray(opp.skills) ? opp.skills : []),
      serviceItems: Array.isArray(opp.serviceItems) ? opp.serviceItems : [],
      location: opp.location && typeof opp.location === 'object' ? opp.location : {},
      paymentTerms: opp.paymentTerms || opp.preferredPaymentTerms || null
    };
  }

  /**
   * Render opportunity details
   */
  function renderOpportunity() {
    const container = document.getElementById('opportunityDetails');
    if (!container || !currentOpportunity) return;

    const opp = currentOpportunity;
    const isOwner = currentUserId === (opp.createdByUserId || opp.createdBy || opp.creatorId);

    // Status badge
    const statusBadge = document.getElementById('opportunityStatusBadge');
    if (statusBadge) {
      const statusColors = {
        'DRAFT': 'badge-warning',
        'PUBLISHED': 'badge-success',
        'CLOSED': 'badge-secondary'
      };
      const colorClass = statusColors[opp.status] || 'badge-secondary';
      statusBadge.innerHTML = `<span class="badge ${colorClass}">${opp.status}</span>`;
    }

    const title = (opp.title || opp.name || '').toString();
    const description = (opp.description || '').toString();

    // Render details
    container.innerHTML = `
      <div class="opportunity-details">
        <div style="margin-bottom: 2rem;">
          <h2 style="margin-bottom: 0.5rem;">${escapeHtml(title) || 'Untitled Opportunity'}</h2>
          <p style="color: var(--text-secondary); line-height: 1.6;">${description ? escapeHtml(description) : '<em style="color: var(--text-secondary);">No description provided.</em>'}</p>
        </div>
        
        <div class="content-grid-2" style="margin-bottom: 2rem; padding: 1.5rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Intent:</strong>
            <div style="margin-top: 0.25rem;">
              ${(opp.intent || opp.intentType) === 'REQUEST_SERVICE' ? '<span class="badge badge-info"><i class="ph ph-hand"></i> Request Service</span>' : '<span class="badge badge-success"><i class="ph ph-handshake"></i> Offer Service</span>'}
            </div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Status:</strong>
            <div style="margin-top: 0.25rem;">
              ${getStatusBadge(opp.status)}
            </div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Model:</strong>
            <div style="margin-top: 0.25rem;">${escapeHtml((opp.model || opp.modelId || 'N/A') + '.' + (opp.subModel || opp.modelId || ''))}</div>
          </div>
          <div>
            <strong style="color: var(--text-secondary); font-size: 0.875rem;">Created:</strong>
            <div style="margin-top: 0.25rem;">${formatDate(opp.createdAt)}</div>
          </div>
        </div>

        ${(opp.skillsTags || opp.skills || []).length > 0 ? `
        <div style="margin-bottom: 2rem;">
          <h3 style="margin-bottom: 1rem;">Required Skills</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
            ${(opp.skillsTags || opp.skills || []).map(skill => `<span class="badge badge-primary">${escapeHtml(skill)}</span>`).join('')}
          </div>
        </div>
        ` : ''}

        ${(opp.serviceItems || []).length > 0 ? `
        <div style="margin-bottom: 2rem;">
          <h3>Service Items</h3>
          <table class="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Price Reference</th>
              </tr>
            </thead>
            <tbody>
              ${(opp.serviceItems || []).map(item => `
                <tr>
                  <td>${escapeHtml(item.name)}</td>
                  <td>${item.qty || 'N/A'}</td>
                  <td>${escapeHtml(item.unit || 'N/A')}</td>
                  <td>${escapeHtml(item.priceRef || item.unitPriceRef || item.totalRef || 'N/A')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${opp.paymentTerms || opp.preferredPaymentTerms ? `
        <div style="margin-bottom: 2rem;">
          <h3>Payment Terms</h3>
          <p><strong>Type:</strong> ${(opp.paymentTerms || opp.preferredPaymentTerms || {}).mode || (opp.paymentTerms || opp.preferredPaymentTerms || {}).type || 'N/A'}</p>
          ${(opp.paymentTerms || opp.preferredPaymentTerms || {}).barterRule ? `<p><strong>Barter Rule:</strong> ${escapeHtml((opp.paymentTerms || opp.preferredPaymentTerms).barterRule)}</p>` : ''}
        </div>
        ` : ''}

        ${opp.location ? `
        <div style="margin-bottom: 2rem;">
          <h3>Location</h3>
          <p>
            ${opp.location.city || ''}, ${opp.location.country || ''}
            ${opp.location.area ? `, ${opp.location.area}` : ''}
          </p>
          <p><strong>Remote Allowed:</strong> ${opp.location.isRemoteAllowed ? 'Yes' : 'No'}</p>
        </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Render action buttons
   */
  function renderActions() {
    const container = document.getElementById('opportunityActions');
    if (!container || !currentOpportunity) return;

    const opp = currentOpportunity;
    // Support both createdByUserId (OpportunityStore) and createdBy/creatorId (PMTwinData)
    const oppCreatorId = opp.createdByUserId || opp.createdBy || opp.creatorId;
    const isOwner = currentUserId === oppCreatorId;
    const intentType = opp.intentType || opp.intent;
    const isNeed = intentType === 'REQUEST_SERVICE';

    let actionsHTML = '';

    // Edit button (if owner - can edit draft, published, or closed)
    if (isOwner) {
      actionsHTML += `
        <button class="btn btn-secondary" onclick="opportunityDetails.showEditModal()">
          <i class="ph ph-pencil-simple"></i> Edit
        </button>
      `;
    }

    // Publish button (if owner and draft)
    if (isOwner && opp.status === 'DRAFT') {
      actionsHTML += `
        <button class="btn btn-primary" onclick="opportunityDetails.publishOpportunity()">
          <i class="ph ph-paper-plane-tilt"></i> Publish
        </button>
      `;
    }

    // Find Matches button (if published)
    if (opp.status === 'PUBLISHED') {
      actionsHTML += `
        <button class="btn btn-secondary" onclick="opportunityDetails.findMatches()">
          <i class="ph ph-magnifying-glass"></i> Find Matches
        </button>
      `;
    }

    // Link Offers button (if need and owner)
    if (isOwner && isNeed && (opp.status === 'PUBLISHED' || opp.status === 'active')) {
      actionsHTML += `
        <button class="btn btn-outline" onclick="opportunityDetails.showLinkOffersModal()">
          <i class="ph ph-link"></i> Link Offers
        </button>
      `;
    }

    container.innerHTML = actionsHTML;
    
    // Render linked offers section if applicable
    if (isNeed && opp.linkedOffers && opp.linkedOffers.length > 0) {
      renderLinkedOffers();
    }
  }

  /**
   * Render linked offers section
   */
  function renderLinkedOffers() {
    let linkedOffersSection = document.getElementById('linkedOffersSection');
    if (!linkedOffersSection) {
      // Create section if it doesn't exist
      const detailsContainer = document.getElementById('opportunityDetails');
      if (detailsContainer) {
        linkedOffersSection = document.createElement('div');
        linkedOffersSection.id = 'linkedOffersSection';
        linkedOffersSection.className = 'card enhanced-card';
        linkedOffersSection.style.marginTop = '1.5rem';
        detailsContainer.appendChild(linkedOffersSection);
      } else {
        return;
      }
    }

    if (!currentOpportunity || !currentOpportunity.linkedOffers || currentOpportunity.linkedOffers.length === 0) {
      linkedOffersSection.style.display = 'none';
      return;
    }

    const linkedOffers = [];
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      currentOpportunity.linkedOffers.forEach(id => {
        const offer = PMTwinData.Opportunities.getById(id);
        if (offer) linkedOffers.push(offer);
      });
    }

    linkedOffersSection.innerHTML = `
      <div class="card-body">
        <h3 style="margin: 0 0 1rem 0;">
          <i class="ph ph-link"></i> Linked Offers (${linkedOffers.length})
        </h3>
        ${linkedOffers.length > 0 ? `
          <div style="display: grid; gap: 1rem;">
            ${linkedOffers.map(offer => `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 0.5rem 0;">${escapeHtml(offer.title || 'Untitled Offer')}</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                      ${escapeHtml(offer.description || '').substring(0, 150)}${offer.description && offer.description.length > 150 ? '...' : ''}
                    </p>
                  </div>
                  <button class="btn btn-sm btn-outline-danger" onclick="opportunityDetails.unlinkOffer('${offer.id}')" style="margin-left: 1rem;">
                    <i class="ph ph-x"></i> Unlink
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : '<p style="color: var(--text-secondary);">No linked offers.</p>'}
      </div>
    `;
    linkedOffersSection.style.display = 'block';
  }

  /**
   * Show link offers modal
   */
  function showLinkOffersModal() {
    if (!currentOpportunity) return;

    // Get all available offers
    let allOffers = [];
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      allOffers = PMTwinData.Opportunities.getAll().filter(opp => {
        const intent = opp.intentType || opp.intent;
        return intent === 'OFFER_SERVICE' && opp.status === 'PUBLISHED' || opp.status === 'active';
      });
    }

    // Filter out already linked offers
    const linkedIds = currentOpportunity.linkedOffers || [];
    const availableOffers = allOffers.filter(offer => !linkedIds.includes(offer.id));

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'linkOffersModal';
    modal.style.display = 'block';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h2>Link Offers to Need</h2>
          <button class="modal-close" onclick="document.getElementById('linkOffersModal').remove()">&times;</button>
        </div>
        <div class="modal-body">
          <p style="margin-bottom: 1rem; color: var(--text-secondary);">
            Select one or more offers to link to this need. Linked offers can form groups or circular exchanges.
          </p>
          ${availableOffers.length === 0 ? `
            <div class="alert alert-info">
              <p>No available offers found. All offers may already be linked.</p>
            </div>
          ` : `
            <div style="max-height: 400px; overflow-y: auto;">
              ${availableOffers.map(offer => `
                <label style="display: block; padding: 1rem; margin-bottom: 0.5rem; border: 1px solid var(--border-color); border-radius: var(--border-radius); cursor: pointer; transition: background 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'" 
                       onmouseout="this.style.background='transparent'">
                  <input type="checkbox" value="${offer.id}" class="offer-checkbox" style="margin-right: 0.75rem;">
                  <strong>${escapeHtml(offer.title || 'Untitled Offer')}</strong>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                    ${escapeHtml(offer.description || '').substring(0, 100)}${offer.description && offer.description.length > 100 ? '...' : ''}
                  </p>
                </label>
              `).join('')}
            </div>
          `}
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="document.getElementById('linkOffersModal').remove()">Cancel</button>
          ${availableOffers.length > 0 ? `
            <button class="btn btn-primary" onclick="opportunityDetails.linkSelectedOffers()">
              <i class="ph ph-link"></i> Link Selected Offers
            </button>
          ` : ''}
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  /**
   * Link selected offers
   */
  function linkSelectedOffers() {
    if (!currentOpportunity || typeof DealLinkingService === 'undefined') {
      alert('Deal linking service not available');
      return;
    }

    const checkboxes = document.querySelectorAll('.offer-checkbox:checked');
    const selectedIds = Array.from(checkboxes).map(cb => cb.value);

    if (selectedIds.length === 0) {
      alert('Please select at least one offer to link');
      return;
    }

    const result = DealLinkingService.link(currentOpportunity.id, selectedIds);
    
    if (result.success) {
      // Reload opportunity
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
        currentOpportunity = PMTwinData.Opportunities.getById(currentOpportunity.id);
      }
      
      // Close modal
      const modal = document.getElementById('linkOffersModal');
      if (modal) modal.remove();
      
      // Refresh UI
      renderActions();
      renderOpportunity();
      
      alert(`Successfully linked ${selectedIds.length} offer(s)!`);
    } else {
      alert('Failed to link offers: ' + result.errors.join(', '));
    }
  }

  /**
   * Unlink an offer
   */
  function unlinkOffer(offerId) {
    if (!currentOpportunity || typeof DealLinkingService === 'undefined') {
      return;
    }

    if (!confirm('Are you sure you want to unlink this offer?')) {
      return;
    }

    const result = DealLinkingService.unlink(currentOpportunity.id, [offerId]);
    
    if (result.success) {
      // Reload opportunity
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
        currentOpportunity = PMTwinData.Opportunities.getById(currentOpportunity.id);
      }
      
      // Refresh UI
      renderActions();
      renderOpportunity();
      
      alert('Offer unlinked successfully!');
    } else {
      alert('Failed to unlink offer: ' + result.errors.join(', '));
    }
  }

  /**
   * Publish opportunity
   */
  function publishOpportunity() {
    if (!currentOpportunity || !window.OpportunityStore) return;

    const updated = window.OpportunityStore.publishOpportunity(currentOpportunity.id);
    if (updated) {
      currentOpportunity = updated;
      renderOpportunity();
      renderActions();
      alert('Opportunity published successfully!');
    }
  }

  /**
   * Find matches
   */
  function findMatches() {
    if (!currentOpportunity || !window.OpportunityStore) return;

    matches = window.OpportunityStore.runMatching(currentOpportunity.id);
    renderMatches();
  }

  /**
   * Render matches
   */
  function renderMatches() {
    const section = document.getElementById('matchesSection');
    const container = document.getElementById('matchesList');
    if (!section || !container) return;

    if (matches.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-users"></i>
            </div>
            <p style="color: var(--text-secondary);">No compatible providers found matching the opportunity requirements.</p>
          </div>
        </div>
      `;
      section.style.display = 'block';
      return;
    }

    section.style.display = 'block';
    container.innerHTML = matches.map(match => {
      const provider = match.provider;
      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <h3 style="margin: 0 0 0.5rem 0;">${escapeHtml(provider.name)}</h3>
                <p style="margin: 0 0 0.75rem 0; color: var(--text-secondary);">
                  <i class="ph ph-envelope"></i> ${escapeHtml(provider.email)}
                  ${provider.phone ? `<br><i class="ph ph-phone"></i> ${escapeHtml(provider.phone)}` : ''}
                </p>
                <div style="margin-bottom: 0.75rem;">
                  <span class="badge badge-success" style="font-size: 1rem; padding: 0.5rem 0.75rem;">
                    <strong>${match.matchScore}%</strong> Match
                  </span>
                </div>
                <div style="margin-bottom: 0.75rem;">
                  <strong style="font-size: 0.875rem; color: var(--text-secondary);">Matched Skills:</strong>
                  <div style="margin-top: 0.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${match.matchedSkills.map(skill => `<span class="badge badge-primary">${escapeHtml(skill)}</span>`).join('')}
                  </div>
                </div>
                <div style="padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                  <strong style="font-size: 0.875rem; color: var(--text-secondary);">Match Details:</strong>
                  <ul style="margin: 0.5rem 0 0 0; padding-left: 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                    ${match.reasons.map(r => `<li>${escapeHtml(r)}</li>`).join('')}
                  </ul>
                </div>
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <button class="btn btn-primary" onclick="opportunityDetails.submitProposal('${provider.id}')">
                  <i class="ph ph-paper-plane-tilt"></i> Submit Proposal
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Submit proposal (redirect to submit page)
   */
  function submitProposal(providerId) {
    if (!currentOpportunity || !window.UrlHelper) return;

    const submitUrl = window.UrlHelper.buildUrlWithQuery('pages/proposals/submit.html', {
      opportunityId: currentOpportunity.id,
      providerId: providerId
    });
    window.location.href = submitUrl;
  }

  /**
   * Render proposals
   */
  function renderProposals() {
    const container = document.getElementById('proposalsList');
    if (!container || !currentOpportunity) return;

    // Try PMTwinData first, then OpportunityStore as fallback
    let proposals = [];
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Proposals) {
      proposals = PMTwinData.Proposals.getByOpportunityId(currentOpportunity.id) || [];
    }
    if (proposals.length === 0 && window.OpportunityStore) {
      proposals = window.OpportunityStore.getProposalsByOpportunityId(currentOpportunity.id) || [];
    }
    
    const oppCreatorId = currentOpportunity.createdByUserId || currentOpportunity.createdBy || currentOpportunity.creatorId;
    const isOwner = currentUserId === oppCreatorId;

    if (proposals.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: 2rem;">
            <div style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--text-secondary);">
              <i class="ph ph-file-text"></i>
            </div>
            <p style="color: var(--text-secondary);">No proposals have been submitted yet.</p>
            ${isOwner ? '<p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.5rem;">Use "Find Matches" to discover compatible providers.</p>' : ''}
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = proposals.map(proposal => {
      // Get provider name - support both OpportunityStore and PMTwinData
      let provider = null;
      let providerName = 'Unknown Provider';
      const providerId = proposal.providerUserId || proposal.providerId || proposal.initiatorId;
      
      if (window.OpportunityStore && proposal.providerUserId) {
        provider = window.OpportunityStore.getUserById(proposal.providerUserId);
      }
      if (!provider && typeof PMTwinData !== 'undefined' && PMTwinData.Users && providerId) {
        provider = PMTwinData.Users.getById(providerId);
      }
      
      if (provider) {
        providerName = provider.profile?.name || provider.profile?.companyName || provider.name || provider.email || 'Unknown Provider';
      }

      let actionsHTML = '';
      if (isOwner && proposal.status === 'SUBMITTED' || proposal.status === 'RESUBMITTED') {
        actionsHTML += `
          <button class="btn btn-outline" onclick="opportunityDetails.requestChanges('${proposal.id}')">
            Request Changes
          </button>
        `;
      }

      return `
        <div class="card enhanced-card" style="margin-bottom: 1rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; gap: 1.5rem;">
              <div style="flex: 1;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                  <h3 style="margin: 0; flex: 1;">${escapeHtml(providerName)}</h3>
                  ${getStatusBadge(proposal.status)}
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                  <div>
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Price:</strong>
                    <div style="font-size: 1.125rem; font-weight: 600; color: var(--color-primary);">
                      ${(proposal.priceTotal || proposal.total || 0).toLocaleString()} ${proposal.currency || 'SAR'}
                    </div>
                  </div>
                  <div>
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Timeline:</strong>
                    <div>${escapeHtml(proposal.deliveryTimeline || proposal.timeline?.duration + ' days' || 'N/A')}</div>
                  </div>
                </div>
                ${proposal.breakdown && proposal.breakdown.length > 0 ? `
                  <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; display: block;">Breakdown:</strong>
                    <ul style="margin: 0; padding-left: 1.5rem; list-style: disc;">
                      ${proposal.breakdown.map(item => `
                        <li style="margin-bottom: 0.25rem;">${escapeHtml(item.item)}: ${item.amount.toLocaleString()} ${proposal.currency}</li>
                      `).join('')}
                    </ul>
                  </div>
                ` : ''}
                ${proposal.notes ? `
                  <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius); margin-bottom: 1rem;">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary);">Notes:</strong>
                    <p style="margin: 0.5rem 0 0 0; line-height: 1.6;">${escapeHtml(proposal.notes)}</p>
                  </div>
                ` : ''}
                ${(proposal.messages || []).length > 0 ? `
                  <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <strong style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.75rem; display: block;">Messages:</strong>
                    ${(proposal.messages || []).map(msg => {
                      let msgUser = null;
                      const msgUserId = msg.fromUserId || msg.userId;
                      if (window.OpportunityStore && msg.fromUserId) {
                        msgUser = window.OpportunityStore.getUserById(msg.fromUserId);
                      }
                      if (!msgUser && typeof PMTwinData !== 'undefined' && PMTwinData.Users && msgUserId) {
                        msgUser = PMTwinData.Users.getById(msgUserId);
                      }
                      const msgUserName = msgUser ? (msgUser.profile?.name || msgUser.name || 'Unknown') : 'Unknown';
                      return `
                        <div style="margin-bottom: 0.75rem; padding: 0.75rem; background: var(--bg-secondary); border-radius: var(--border-radius); border-left: 3px solid var(--color-primary);">
                          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
                            <strong>${escapeHtml(msgUserName)}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(msg.at || msg.createdAt)}</span>
                          </div>
                          <p style="margin: 0; line-height: 1.6;">${escapeHtml(msg.text || msg.message || '')}</p>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : ''}
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem; min-width: 150px;">
                ${actionsHTML}
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Request changes on a proposal
   */
  function requestChanges(proposalId) {
    const message = prompt('Enter your message requesting changes:');
    if (!message || message.trim().length === 0) return;

    if (!window.OpportunityStore || !currentUserId) return;

    const updated = window.OpportunityStore.requestProposalChanges(proposalId, currentUserId, message.trim());
    if (updated) {
      renderProposals();
      alert('Changes requested successfully!');
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

  /**
   * Helper: Format date
   */
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return dateString;
    }
  }

  /**
   * Show edit modal for opportunity
   */
  function showEditModal() {
    if (!currentOpportunity) return;

    const opp = currentOpportunity;
    const skillsStr = (opp.skillsTags || opp.skills || []).join(', ');

    // Remove existing modal if any
    const existingModal = document.getElementById('editOpportunityModal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.className = 'edit-opportunity-overlay';
    modal.id = 'editOpportunityModal';
    modal.innerHTML = `
      <div class="edit-opportunity-modal">
        <div class="edit-modal-header">
          <h2><i class="ph ph-pencil-simple"></i> Edit Opportunity</h2>
          <button type="button" class="edit-modal-close" onclick="document.getElementById('editOpportunityModal').remove()" aria-label="Close">
            <i class="ph ph-x"></i>
          </button>
        </div>
        <div class="edit-modal-body">
          <form id="editOpportunityForm">
            <div class="edit-form-section">
              <div class="edit-form-section-title">Basic info</div>
              <div class="edit-form-group">
                <label class="edit-form-label required" for="editOppTitle">Title</label>
                <input type="text" id="editOppTitle" class="edit-form-control" value="${escapeHtml(opp.title || '')}" required placeholder="Opportunity title">
              </div>
              <div class="edit-form-group">
                <label class="edit-form-label required" for="editOppDescription">Description</label>
                <textarea id="editOppDescription" class="edit-form-control" rows="4" required placeholder="Describe the opportunity">${escapeHtml(opp.description || '')}</textarea>
              </div>
            </div>
            <div class="edit-form-section">
              <div class="edit-form-row">
                <div class="edit-form-group">
                  <label class="edit-form-label" for="editOppIntent">Intent</label>
                  <select id="editOppIntent" class="edit-form-control">
                    <option value="REQUEST_SERVICE" ${(opp.intent || opp.intentType) === 'REQUEST_SERVICE' ? 'selected' : ''}>Request Service</option>
                    <option value="OFFER_SERVICE" ${(opp.intent || opp.intentType) === 'OFFER_SERVICE' ? 'selected' : ''}>Offer Service</option>
                  </select>
                </div>
                <div class="edit-form-group">
                  <label class="edit-form-label" for="editOppStatus">Status</label>
                  <select id="editOppStatus" class="edit-form-control">
                    <option value="DRAFT" ${(opp.status || '').toUpperCase() === 'DRAFT' ? 'selected' : ''}>Draft</option>
                    <option value="PUBLISHED" ${(opp.status || '').toUpperCase() === 'PUBLISHED' ? 'selected' : ''}>Published</option>
                    <option value="CLOSED" ${(opp.status || '').toUpperCase() === 'CLOSED' ? 'selected' : ''}>Closed</option>
                  </select>
                </div>
              </div>
              <div class="edit-form-group">
                <label class="edit-form-label" for="editOppSkills">Skills</label>
                <input type="text" id="editOppSkills" class="edit-form-control" value="${escapeHtml(skillsStr)}" placeholder="e.g. civil, steel, hse, site-management">
              </div>
            </div>
            <div class="edit-form-section">
              <div class="edit-form-section-title">Location</div>
              <div class="edit-form-row">
                <div class="edit-form-group">
                  <label class="edit-form-label" for="editOppCountry">Country</label>
                  <input type="text" id="editOppCountry" class="edit-form-control" value="${escapeHtml(opp.location?.country || '')}" placeholder="Country">
                </div>
                <div class="edit-form-group">
                  <label class="edit-form-label" for="editOppCity">City</label>
                  <input type="text" id="editOppCity" class="edit-form-control" value="${escapeHtml(opp.location?.city || '')}" placeholder="City">
                </div>
              </div>
              <label class="edit-form-checkbox">
                <input type="checkbox" id="editOppRemote" ${opp.location?.isRemoteAllowed ? 'checked' : ''}>
                <span>Remote work allowed</span>
              </label>
            </div>
            <div class="edit-form-section">
              <div class="edit-form-section-title">Payment</div>
              <div class="edit-form-group">
                <label class="edit-form-label" for="editOppPaymentType">Payment type</label>
                <select id="editOppPaymentType" class="edit-form-control">
                  <option value="CASH" ${(opp.paymentTerms?.type || opp.paymentTerms?.mode || 'CASH') === 'CASH' ? 'selected' : ''}>Cash</option>
                  <option value="BARTER" ${(opp.paymentTerms?.type || opp.paymentTerms?.mode) === 'BARTER' ? 'selected' : ''}>Barter</option>
                  <option value="HYBRID" ${(opp.paymentTerms?.type || opp.paymentTerms?.mode) === 'HYBRID' ? 'selected' : ''}>Hybrid</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="edit-modal-footer">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('editOpportunityModal').remove()">Cancel</button>
          <button type="button" class="btn btn-primary" onclick="opportunityDetails.saveOpportunityChanges()">
            <i class="ph ph-check"></i> Save Changes
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
  }

  /**
   * Save opportunity changes from edit modal
   */
  function saveOpportunityChanges() {
    if (!currentOpportunity) return;

    const title = document.getElementById('editOppTitle')?.value?.trim();
    const description = document.getElementById('editOppDescription')?.value?.trim();
    const intent = document.getElementById('editOppIntent')?.value;
    const status = document.getElementById('editOppStatus')?.value;
    const country = document.getElementById('editOppCountry')?.value?.trim();
    const city = document.getElementById('editOppCity')?.value?.trim();
    const skillsStr = document.getElementById('editOppSkills')?.value?.trim();
    const paymentType = document.getElementById('editOppPaymentType')?.value;
    const isRemoteAllowed = document.getElementById('editOppRemote')?.checked || false;

    // Validation
    if (!title) {
      alert('Title is required');
      return;
    }
    if (!description) {
      alert('Description is required');
      return;
    }

    // Parse skills
    const skillsTags = skillsStr ? skillsStr.split(',').map(s => s.trim()).filter(s => s) : [];

    // Build updates object
    const updates = {
      title: title,
      description: description,
      intent: intent,
      intentType: intent,
      status: status,
      skillsTags: skillsTags,
      skills: skillsTags,
      location: {
        ...currentOpportunity.location,
        country: country,
        city: city,
        isRemoteAllowed: isRemoteAllowed
      },
      paymentTerms: {
        type: paymentType,
        mode: paymentType,
        barterRule: currentOpportunity.paymentTerms?.barterRule || null
      }
    };

    // Save to OpportunityStore
    let saved = false;
    if (window.OpportunityStore) {
      const updated = window.OpportunityStore.updateOpportunity(currentOpportunity.id, updates);
      if (updated) {
        saved = true;
        currentOpportunity = normalizeOpportunity(updated);
      }
    }

    // Also save to PMTwinData if available
    if (typeof PMTwinData !== 'undefined' && PMTwinData.Opportunities) {
      const updated = PMTwinData.Opportunities.update(currentOpportunity.id, updates);
      if (updated) {
        saved = true;
        currentOpportunity = normalizeOpportunity(updated);
      }
    }

    if (saved) {
      // Close modal
      const modal = document.getElementById('editOpportunityModal');
      if (modal) modal.remove();

      // Re-render the page
      renderOpportunity();
      renderActions();

      alert('Opportunity updated successfully!');
    } else {
      alert('Failed to save changes. Please try again.');
    }
  }

  // Export
  window.opportunityDetails = {
    init: init,
    publishOpportunity: publishOpportunity,
    findMatches: findMatches,
    submitProposal: submitProposal,
    requestChanges: requestChanges,
    showLinkOffersModal: showLinkOffersModal,
    linkSelectedOffers: linkSelectedOffers,
    unlinkOffer: unlinkOffer,
    showEditModal: showEditModal,
    saveOpportunityChanges: saveOpportunityChanges
  };

})();
