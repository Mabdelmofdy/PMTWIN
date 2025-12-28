/**
 * Pipeline Component - Kanban-style proposal tracking
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

      let proposals = [];
      if (typeof ProposalService !== 'undefined') {
        const result = await ProposalService.getProposals();
        if (result.success) {
          proposals = result.proposals;
        }
      } else if (typeof PMTwinData !== 'undefined') {
        const currentUser = PMTwinData.Sessions.getCurrentUser();
        if (currentUser) {
          proposals = PMTwinData.Proposals.getByProvider(currentUser.id);
        }
      }

      renderPipeline(container, proposals);
    } catch (error) {
      console.error('Error loading pipeline:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading pipeline. Please try again.</p>';
    }
  }

  function renderPipeline(container, proposals) {
    const stages = [
      { id: 'in_review', label: 'In Review', color: 'warning' },
      { id: 'evaluation', label: 'Evaluation', color: 'info' },
      { id: 'approved', label: 'Approved', color: 'success' },
      { id: 'rejected', label: 'Rejected', color: 'error' },
      { id: 'completed', label: 'Completed', color: 'secondary' }
    ];

    let html = '';

    stages.forEach(stage => {
      const stageProposals = proposals.filter(p => p.status === stage.id);
      
      html += `
        <div class="card">
          <div class="card-body">
            <h3 style="margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.5rem;">
              <span class="badge badge-${stage.color}">${stageProposals.length}</span>
              ${stage.label}
            </h3>
            <div style="display: grid; gap: 1rem; min-height: 200px;">
      `;

      if (stageProposals.length === 0) {
        html += '<p style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No proposals</p>';
      } else {
        stageProposals.forEach(proposal => {
          const project = PMTwinData?.Projects.getById(proposal.projectId);
          html += `
            <div class="card" style="background: var(--bg-secondary); cursor: pointer;" onclick="window.location.hash='#proposal/${proposal.id}'">
              <div class="card-body" style="padding: 1rem;">
                <h4 style="margin: 0 0 0.5rem 0; font-size: 1rem;">${project?.title || 'Project ' + proposal.projectId}</h4>
                <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">
                  ${proposal.type || 'N/A'} • ${proposal.total ? proposal.total.toLocaleString() + ' ' + (proposal.currency || 'SAR') : 'N/A'}
                </p>
                <p style="margin: 0.5rem 0 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                  ${proposal.submittedAt ? new Date(proposal.submittedAt).toLocaleDateString() : ''}
                </p>
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

