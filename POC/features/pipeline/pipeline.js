/**
 * Pipeline Component - Role-aware Kanban-style tracking
 */

(function() {
  'use strict';

  function init(params) {
    loadPipeline();
  }

  async function loadPipeline() {
    const container = document.getElementById('pipelineBoard');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading pipeline...</p>';

      if (typeof PMTwinData === 'undefined') {
        container.innerHTML = '<p class="alert alert-error">Data service not available</p>';
        return;
      }

      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
        return;
      }

      const userRole = currentUser.role || currentUser.userType;
      const companyId = currentUser.id; // Users represent companies

      // Get proposals, contracts, and engagements
      let proposals = [];
      let contracts = [];
      let engagements = [];

      if (typeof ProposalService !== 'undefined') {
        // Get proposals based on role
        if (userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead') {
          const result = await ProposalService.getIncomingProposals(companyId);
          if (result.success) proposals = result.proposals;
        } else {
          const result = await ProposalService.getMyProposals(companyId);
          if (result.success) proposals = result.proposals;
        }
      } else {
        // Fallback
        if (userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead') {
          proposals = PMTwinData.Proposals.getByOwnerCompany(companyId);
        } else {
          proposals = PMTwinData.Proposals.getByBidderCompany(companyId);
        }
      }

      // Get contracts (contracts use buyerPartyId and providerPartyId)
      const allContracts = PMTwinData.Contracts.getAll();
      if (userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead') {
        contracts = allContracts.filter(c => (c.buyerPartyId || c.buyerPartyCompanyId) === companyId);
      } else {
        contracts = allContracts.filter(c => (c.providerPartyId || c.providerPartyCompanyId) === companyId);
      }

      // Get engagements
      const allEngagements = PMTwinData.Engagements.getAll();
      engagements = allEngagements.filter(e => {
        const contract = PMTwinData.Contracts.getById(e.contractId);
        if (!contract) return false;
        const buyerPartyId = contract.buyerPartyId || contract.buyerPartyCompanyId;
        const providerPartyId = contract.providerPartyId || contract.providerPartyCompanyId;
        if (userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead') {
          return buyerPartyId === companyId;
        } else {
          return providerPartyId === companyId;
        }
      });

      renderPipeline(container, proposals, contracts, engagements, userRole);
    } catch (error) {
      console.error('Error loading pipeline:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading pipeline. Please try again.</p>';
    }
  }

  function renderPipeline(container, proposals, contracts, engagements, userRole) {
    // Define stages based on role
    let stages = [];

    if (userRole === 'vendor' || userRole === 'vendor_corporate' || userRole === 'vendor_individual') {
      stages = [
        { id: 'MATCHED', label: 'Matched', color: 'info', statuses: [] },
        { id: 'DRAFT', label: 'Draft', color: 'secondary', statuses: ['DRAFT'] },
        { id: 'SUBMITTED', label: 'Submitted', color: 'info', statuses: ['SUBMITTED'] },
        { id: 'UNDER_REVIEW', label: 'Under Review', color: 'warning', statuses: ['UNDER_REVIEW'] },
        { id: 'SHORTLISTED', label: 'Shortlisted', color: 'info', statuses: ['SHORTLISTED'] },
        { id: 'NEGOTIATION', label: 'Negotiation', color: 'warning', statuses: ['NEGOTIATION'] },
        { id: 'AWARDED', label: 'Awarded', color: 'success', statuses: ['AWARDED'] },
        { id: 'CONTRACT_SIGNED', label: 'Contract Signed', color: 'success', statuses: [] },
        { id: 'ENGAGEMENT_ACTIVE', label: 'Engagement Active', color: 'success', statuses: [] },
        { id: 'COMPLETED', label: 'Completed', color: 'secondary', statuses: ['COMPLETED'] }
      ];
    } else if (userRole === 'service_provider' || userRole === 'skill_service_provider') {
      stages = [
        { id: 'MATCHED_SR', label: 'Matched SR', color: 'info', statuses: [] },
        { id: 'DRAFT', label: 'Draft Offer', color: 'secondary', statuses: ['DRAFT'] },
        { id: 'SUBMITTED', label: 'Submitted', color: 'info', statuses: ['SUBMITTED'] },
        { id: 'APPROVED', label: 'Approved', color: 'success', statuses: ['AWARDED'] },
        { id: 'CONTRACT_SIGNED', label: 'Contract Signed', color: 'success', statuses: [] },
        { id: 'ENGAGEMENT_ACTIVE', label: 'Engagement Active', color: 'success', statuses: [] },
        { id: 'DELIVERED', label: 'Delivered', color: 'secondary', statuses: ['COMPLETED'] }
      ];
    } else if (userRole === 'beneficiary' || userRole === 'entity' || userRole === 'project_lead') {
      stages = [
        { id: 'INCOMING', label: 'Incoming', color: 'info', statuses: ['SUBMITTED'] },
        { id: 'UNDER_REVIEW', label: 'Under Review', color: 'warning', statuses: ['UNDER_REVIEW'] },
        { id: 'SHORTLIST', label: 'Shortlist', color: 'info', statuses: ['SHORTLISTED'] },
        { id: 'NEGOTIATION', label: 'Negotiation', color: 'warning', statuses: ['NEGOTIATION'] },
        { id: 'AWARD', label: 'Award', color: 'success', statuses: ['AWARDED'] },
        { id: 'CONTRACTS_ACTIVE', label: 'Contracts Active', color: 'success', statuses: [] },
        { id: 'ENGAGEMENTS_ACTIVE', label: 'Engagements Active', color: 'success', statuses: [] },
        { id: 'COMPLETED', label: 'Completed', color: 'secondary', statuses: ['COMPLETED'] }
      ];
    } else {
      // Default stages
      stages = [
        { id: 'DRAFT', label: 'Draft', color: 'secondary', statuses: ['DRAFT'] },
        { id: 'SUBMITTED', label: 'Submitted', color: 'info', statuses: ['SUBMITTED'] },
        { id: 'UNDER_REVIEW', label: 'Under Review', color: 'warning', statuses: ['UNDER_REVIEW'] },
        { id: 'AWARDED', label: 'Awarded', color: 'success', statuses: ['AWARDED'] },
        { id: 'REJECTED', label: 'Rejected', color: 'error', statuses: ['REJECTED'] }
      ];
    }

    let html = '';

    stages.forEach(stage => {
      let items = [];

      // Get items for this stage
      if (stage.statuses.length > 0) {
        // Stage based on proposal status
        items = proposals.filter(p => stage.statuses.includes(p.status));
      } else if (stage.id === 'CONTRACT_SIGNED' || stage.id === 'CONTRACTS_ACTIVE') {
        // Stage based on contract status
        items = contracts.filter(c => c.status === 'SIGNED' || c.status === 'ACTIVE');
      } else if (stage.id === 'ENGAGEMENT_ACTIVE' || stage.id === 'ENGAGEMENTS_ACTIVE') {
        // Stage based on engagement status
        items = engagements.filter(e => e.status === 'ACTIVE');
      } else if (stage.id === 'MATCHED' || stage.id === 'MATCHED_SR') {
        // Matched opportunities (could be computed from matches)
        // For now, show proposals in DRAFT status as matched
        items = proposals.filter(p => p.status === 'DRAFT');
      } else if (stage.id === 'COMPLETED' || stage.id === 'DELIVERED') {
        // Completed engagements
        items = engagements.filter(e => e.status === 'COMPLETED');
      }

      html += `
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge badge-${stage.color}">${items.length}</span>
              ${stage.label}
            </h3>
            <div style="display: grid; gap: 1rem; min-height: 200px;">
      `;

      if (items.length === 0) {
        html += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No items</p>';
      } else {
        items.forEach(item => {
          // Determine item type and get details
          let title = 'Unknown';
          let subtitle = '';
          let link = '#';
          let itemId = item.id;

          if (item.proposalType || item.targetId) {
            // It's a proposal
            let target = null;
            if (item.targetType === 'PROJECT' || item.targetType === 'MEGA_PROJECT') {
              target = PMTwinData?.Projects.getById(item.targetId || item.projectId);
            } else if (item.targetType === 'SERVICE_REQUEST') {
              target = PMTwinData?.ServiceRequests.getById(item.targetId);
            }
            title = target?.title || `${item.targetType} ${item.targetId || item.projectId}`;
            subtitle = `${item.proposalType || 'Proposal'} • ${item.total ? item.total.toLocaleString() + ' ' + (item.currency || 'SAR') : 'N/A'}`;
            link = `../proposals/?id=${item.id}`;
          } else if (item.contractType) {
            // It's a contract
            title = `${item.contractType.replace('_', ' ')}`;
            subtitle = `Status: ${item.status}`;
            link = `../admin/contracts/?id=${item.id}`;
          } else if (item.engagementType) {
            // It's an engagement
            const contract = PMTwinData?.Contracts.getById(item.contractId);
            title = `${item.engagementType.replace('_', ' ')} Engagement`;
            subtitle = `Status: ${item.status}`;
            link = `../service-engagements/?id=${item.id}`;
          }

          html += `
            <div class="card" style="background: var(--bg-secondary); cursor: pointer;" onclick="window.location.href='${link}'">
              <div class="card-body" style="padding: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${title}</h4>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                  ${subtitle}
                </p>
                ${item.submittedAt ? `
                  <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                    ${new Date(item.submittedAt).toLocaleDateString()}
                  </p>
                ` : ''}
              </div>
            </div>
          `;
        });
      }

      html += `
            </div>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  // Export
  if (!window.pipeline) window.pipeline = {};
  window.pipeline.pipeline = {
    init,
    loadPipeline
  };

})();
