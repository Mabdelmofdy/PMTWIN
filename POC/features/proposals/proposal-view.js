/**
 * Proposal View Component - Shows proposal details with version history
 * Supports version diff view and creating new versions
 */

(function() {
  'use strict';

  let currentProposal = null;
  let selectedVersion = null;

  // ============================================
  // Initialize Component
  // ============================================
  function init(params) {
    const urlParams = new URLSearchParams(window.location.search);
    const proposalId = urlParams.get('id') || (params && params.id);
    
    if (proposalId) {
      loadProposal(proposalId);
    } else {
      showError('Proposal ID not provided');
    }
  }

  // ============================================
  // Load Proposal
  // ============================================
  function loadProposal(proposalId) {
    const container = document.getElementById('proposalViewContainer');
    if (!container) return;

    if (typeof PMTwinData === 'undefined' || !PMTwinData.Proposals) {
      showError('Proposals service not available');
      return;
    }

    const proposal = PMTwinData.Proposals.getById(proposalId);
    if (!proposal) {
      showError('Proposal not found');
      return;
    }

    currentProposal = proposal;
    selectedVersion = proposal.currentVersion || proposal.version || 1;
    
    renderProposal();
  }

  // ============================================
  // Render Proposal
  // ============================================
  function renderProposal() {
    const container = document.getElementById('proposalViewContainer');
    if (!container || !currentProposal) return;

    const currentVersionData = getCurrentVersionData();
    const acceptance = currentProposal.acceptance || {};
    
    const html = `
      <div class="proposal-view">
        <!-- Header -->
        <div class="card enhanced-card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
              <div>
                <h1 style="margin: 0 0 0.5rem 0;">Proposal #${currentProposal.id}</h1>
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                  <span class="badge badge-${getStatusBadgeClass(currentProposal.status)}">${currentProposal.status}</span>
                  <span class="badge badge-info">Version ${selectedVersion}</span>
                  ${acceptance.mutuallyAcceptedVersion ? `<span class="badge badge-success">Mutually Accepted (v${acceptance.mutuallyAcceptedVersion})</span>` : ''}
                </div>
              </div>
              <div style="display: flex; gap: 0.5rem;">
                ${canCreateNewVersion() ? `
                  <button type="button" class="btn btn-primary" onclick="proposalView.createNewVersion()">
                    <i class="ph ph-plus"></i> Create New Version
                  </button>
                ` : ''}
                ${canAcceptProposal() ? `
                  <button type="button" class="btn btn-success" onclick="proposalView.acceptProposal()">
                    <i class="ph ph-check"></i> Accept Proposal
                  </button>
                ` : ''}
              </div>
            </div>
            
            <!-- Acceptance Status -->
            ${renderAcceptanceStatus()}
          </div>
        </div>

        <!-- Version History -->
        <div class="card enhanced-card" style="margin-bottom: 2rem;">
          <div class="card-body">
            <h2 class="section-title spacing-section">Version History</h2>
            <div id="versionHistory">
              ${renderVersionHistory()}
            </div>
          </div>
        </div>

        <!-- Current Version Details -->
        <div class="card enhanced-card">
          <div class="card-body">
            <h2 class="section-title spacing-section">Version ${selectedVersion} Details</h2>
            ${renderVersionDetails(currentVersionData)}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  // ============================================
  // Render Acceptance Status
  // ============================================
  function renderAcceptanceStatus() {
    const acceptance = currentProposal.acceptance || {};
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    const isOwner = currentUser && (currentProposal.ownerCompanyId === currentUser.id || currentProposal.ownerCompanyId === currentUser.id);
    const isProvider = currentUser && (currentProposal.providerId === currentUser.id || currentProposal.bidderCompanyId === currentUser.id);

    return `
      <div class="acceptance-status" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
        <div>
          <strong>Provider Accepted:</strong>
          <span class="badge ${acceptance.providerAccepted ? 'badge-success' : 'badge-secondary'}">
            ${acceptance.providerAccepted ? 'Yes' : 'No'}
          </span>
          ${isProvider && !acceptance.providerAccepted ? `
            <button type="button" class="btn btn-sm btn-success" onclick="proposalView.toggleAcceptance('provider', true)" style="margin-left: 0.5rem;">
              Accept
            </button>
          ` : ''}
        </div>
        <div>
          <strong>Owner Accepted:</strong>
          <span class="badge ${acceptance.ownerAccepted ? 'badge-success' : 'badge-secondary'}">
            ${acceptance.ownerAccepted ? 'Yes' : 'No'}
          </span>
          ${isOwner && !acceptance.ownerAccepted ? `
            <button type="button" class="btn btn-sm btn-success" onclick="proposalView.toggleAcceptance('owner', true)" style="margin-left: 0.5rem;">
              Accept
            </button>
          ` : ''}
        </div>
        ${acceptance.mutuallyAcceptedVersion ? `
          <div>
            <strong>Mutually Accepted Version:</strong>
            <span class="badge badge-success">v${acceptance.mutuallyAcceptedVersion}</span>
            <br><small style="color: var(--text-secondary);">Accepted on: ${formatDate(acceptance.acceptedAt)}</small>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ============================================
  // Render Version History
  // ============================================
  function renderVersionHistory() {
    if (!currentProposal.versions || currentProposal.versions.length === 0) {
      return '<p>No version history available</p>';
    }

    let html = '<div style="display: flex; flex-direction: column; gap: 1rem;">';
    
    currentProposal.versions.forEach((version, index) => {
      const isSelected = version.version === selectedVersion;
      const isMutuallyAccepted = currentProposal.acceptance?.mutuallyAcceptedVersion === version.version;
      
      html += `
        <div class="version-item ${isSelected ? 'selected' : ''}" 
             style="border: 2px solid ${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}; 
                    padding: 1rem; border-radius: var(--border-radius); 
                    cursor: pointer; background: ${isSelected ? 'var(--bg-secondary)' : 'var(--bg-primary)'};"
             onclick="proposalView.selectVersion(${version.version})">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
              <h4 style="margin: 0 0 0.5rem 0;">
                Version ${version.version}
                ${isMutuallyAccepted ? '<span class="badge badge-success">Mutually Accepted</span>' : ''}
                ${version.version === currentProposal.currentVersion ? '<span class="badge badge-info">Current</span>' : ''}
              </h4>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.875rem;">
                Created: ${formatDate(version.createdAt)} by ${version.createdBy || 'Unknown'}
              </p>
              <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); font-size: 0.875rem;">
                Status: <span class="badge badge-${getStatusBadgeClass(version.status)}">${version.status}</span>
              </p>
              ${version.changes && version.changes.length > 0 ? `
                <div style="margin-top: 0.5rem;">
                  <strong>Changes:</strong>
                  <ul style="margin: 0.25rem 0 0 1rem; padding: 0;">
                    ${version.changes.map(change => `<li>${change}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
            <div style="display: flex; gap: 0.5rem;">
              ${index > 0 ? `
                <button type="button" class="btn btn-sm btn-secondary" 
                        onclick="event.stopPropagation(); proposalView.showDiff(${currentProposal.versions[index - 1].version}, ${version.version})">
                  <i class="ph ph-git-diff"></i> Compare
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    return html;
  }

  // ============================================
  // Render Version Details
  // ============================================
  function renderVersionDetails(versionData) {
    if (!versionData) {
      return '<p>Version data not available</p>';
    }

    const proposalData = versionData.proposalData || versionData;
    const totalValue = proposalData.serviceItems && Array.isArray(proposalData.serviceItems)
      ? proposalData.serviceItems.reduce((sum, item) => sum + (item.totalRef || 0), 0)
      : (proposalData.total || proposalData.cashDetails?.total || 0);

    return `
      <div class="version-details">
        <div class="content-grid-2" style="margin-bottom: 2rem;">
          <div>
            <h3>Proposal Information</h3>
            <p><strong>Total Value:</strong> ${totalValue.toLocaleString()} ${proposalData.currency || 'SAR'}</p>
            <p><strong>Status:</strong> <span class="badge badge-${getStatusBadgeClass(versionData.status)}">${versionData.status}</span></p>
            ${proposalData.timeline ? `
              <p><strong>Start Date:</strong> ${proposalData.timeline.startDate || 'TBD'}</p>
              <p><strong>End Date:</strong> ${proposalData.timeline.endDate || proposalData.timeline.completionDate || 'TBD'}</p>
            ` : ''}
          </div>
          <div>
            <h3>Payment Terms</h3>
            ${proposalData.paymentTerms ? `
              <p><strong>Mode:</strong> ${proposalData.paymentTerms.mode}</p>
              ${proposalData.paymentTerms.barterRule ? `<p><strong>Barter Rule:</strong> ${proposalData.paymentTerms.barterRule}</p>` : ''}
            ` : '<p>Payment terms not specified</p>'}
          </div>
        </div>

        ${proposalData.serviceItems && proposalData.serviceItems.length > 0 ? `
          <div style="margin-bottom: 2rem;">
            <h3>Service Items</h3>
            <table class="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${proposalData.serviceItems.map(item => `
                  <tr>
                    <td>${item.name || item.serviceName || ''}</td>
                    <td>${item.description || ''}</td>
                    <td>${item.qty || item.quantity || 1}</td>
                    <td>${(item.unitPriceRef || item.unitPrice || 0).toLocaleString()} SAR</td>
                    <td>${(item.totalRef || item.total || 0).toLocaleString()} SAR</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="4"><strong>Total</strong></td>
                  <td><strong>${totalValue.toLocaleString()} SAR</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ` : ''}

        ${proposalData.terms || proposalData.message ? `
          <div style="margin-bottom: 2rem;">
            <h3>Terms & Notes</h3>
            <p>${proposalData.terms || proposalData.message || ''}</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ============================================
  // Show Diff Between Versions
  // ============================================
  function showDiff(version1, version2) {
    const v1Data = PMTwinData.Proposals.getVersion(currentProposal.id, version1);
    const v2Data = PMTwinData.Proposals.getVersion(currentProposal.id, version2);

    if (!v1Data || !v2Data) {
      alert('Version data not found');
      return;
    }

    const diffHtml = `
      <div class="diff-view" style="max-width: 1000px; margin: 0 auto;">
        <h2>Version Comparison: v${version1} vs v${version2}</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <h3>Version ${version1}</h3>
            ${renderVersionSummary(v1Data.proposalData)}
          </div>
          <div>
            <h3>Version ${version2}</h3>
            ${renderVersionSummary(v2Data.proposalData)}
          </div>
        </div>
        <div style="margin-top: 2rem;">
          <h3>Changes</h3>
          ${v2Data.changes && v2Data.changes.length > 0 ? `
            <ul>
              ${v2Data.changes.map(change => `<li>${change}</li>`).join('')}
            </ul>
          ` : '<p>No specific changes tracked</p>'}
        </div>
      </div>
    `;

    // Show in modal or dedicated section
    const container = document.getElementById('diffViewContainer');
    if (container) {
      container.innerHTML = diffHtml;
      container.style.display = 'block';
    } else {
      // Create modal
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.style.display = 'block';
      modal.innerHTML = `
        <div class="modal-content" style="max-width: 1200px;">
          <div class="modal-header">
            <h2>Version Comparison</h2>
            <button type="button" class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            ${diffHtml}
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }
  }

  // ============================================
  // Render Version Summary
  // ============================================
  function renderVersionSummary(proposalData) {
    const total = proposalData.serviceItems && Array.isArray(proposalData.serviceItems)
      ? proposalData.serviceItems.reduce((sum, item) => sum + (item.totalRef || 0), 0)
      : (proposalData.total || 0);

    return `
      <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--border-radius);">
        <p><strong>Total:</strong> ${total.toLocaleString()} ${proposalData.currency || 'SAR'}</p>
        <p><strong>Service Items:</strong> ${proposalData.serviceItems?.length || 0}</p>
        ${proposalData.timeline ? `
          <p><strong>Timeline:</strong> ${proposalData.timeline.startDate || 'TBD'} - ${proposalData.timeline.endDate || 'TBD'}</p>
        ` : ''}
      </div>
    `;
  }

  // ============================================
  // Select Version
  // ============================================
  function selectVersion(version) {
    selectedVersion = version;
    renderProposal();
  }

  // ============================================
  // Create New Version
  // ============================================
  function createNewVersion() {
    if (!currentProposal) return;

    // Show form to edit proposal data
    const updates = prompt('Enter updates as JSON (or cancel to use form):');
    
    if (updates === null) {
      // Redirect to proposal edit/create page with current proposal data
      const editUrl = `/POC/pages/proposals/create/index.html?proposalId=${currentProposal.id}&createVersion=true`;
      window.location.href = editUrl;
      return;
    }

    try {
      const updateData = JSON.parse(updates);
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      
      if (PMTwinData.Proposals.createVersion) {
        const result = PMTwinData.Proposals.createVersion(
          currentProposal.id,
          updateData,
          currentUser?.id || 'system'
        );
        
        if (result) {
          alert('New version created successfully!');
          loadProposal(currentProposal.id);
        } else {
          alert('Failed to create new version');
        }
      } else {
        alert('Version creation not available. Please use the proposal edit form.');
      }
    } catch (e) {
      alert('Invalid JSON. Redirecting to edit form...');
      const editUrl = `/POC/pages/proposals/create/index.html?proposalId=${currentProposal.id}&createVersion=true`;
      window.location.href = editUrl;
    }
  }

  // ============================================
  // Toggle Acceptance
  // ============================================
  function toggleAcceptance(party, accept) {
    if (!currentProposal) return;

    const updates = {
      acceptance: {
        ...currentProposal.acceptance,
        [party === 'provider' ? 'providerAccepted' : 'ownerAccepted']: accept
      }
    };

    // Check if both parties accepted
    if (updates.acceptance.providerAccepted && updates.acceptance.ownerAccepted) {
      updates.acceptance.mutuallyAcceptedVersion = selectedVersion;
      updates.acceptance.acceptedAt = new Date().toISOString();
    }

    const updated = PMTwinData.Proposals.update(currentProposal.id, updates);
    if (updated) {
      loadProposal(currentProposal.id);
    }
  }

  // ============================================
  // Accept Proposal
  // ============================================
  function acceptProposal() {
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return;

    const isOwner = currentProposal.ownerCompanyId === currentUser.id;
    const isProvider = currentProposal.providerCompanyId === currentUser.id || currentProposal.providerId === currentUser.id;

    if (isOwner) {
      toggleAcceptance('owner', true);
    } else if (isProvider) {
      toggleAcceptance('provider', true);
    }
  }

  // ============================================
  // Helper: Get Current Version Data
  // ============================================
  function getCurrentVersionData() {
    if (!currentProposal.versions || currentProposal.versions.length === 0) {
      return currentProposal;
    }

    const version = currentProposal.versions.find(v => v.version === selectedVersion);
    return version || currentProposal.versions[currentProposal.versions.length - 1];
  }

  // ============================================
  // Helper: Can Create New Version
  // ============================================
  function canCreateNewVersion() {
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return false;

    // Provider can create new versions
    return currentProposal.providerId === currentUser.id || 
           currentProposal.bidderCompanyId === currentUser.id;
  }

  // ============================================
  // Helper: Can Accept Proposal
  // ============================================
  function canAcceptProposal() {
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return false;

    const acceptance = currentProposal.acceptance || {};
    const isOwner = currentProposal.ownerCompanyId === currentUser.id;
    const isProvider = currentProposal.providerId === currentUser.id || currentProposal.bidderCompanyId === currentUser.id;

    return (isOwner && !acceptance.ownerAccepted) || (isProvider && !acceptance.providerAccepted);
  }

  // ============================================
  // Helper: Get Status Badge Class
  // ============================================
  function getStatusBadgeClass(status) {
    const statusMap = {
      'DRAFT': 'secondary',
      'SUBMITTED': 'info',
      'UNDER_REVIEW': 'warning',
      'SHORTLISTED': 'primary',
      'NEGOTIATION': 'warning',
      'AWARDED': 'success',
      'REJECTED': 'error',
      'WITHDRAWN': 'secondary'
    };
    return statusMap[status] || 'secondary';
  }

  // ============================================
  // Helper: Format Date
  // ============================================
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString();
    } catch (e) {
      return dateString;
    }
  }

  // ============================================
  // Helper: Show Error
  // ============================================
  function showError(message) {
    const container = document.getElementById('proposalViewContainer');
    if (container) {
      container.innerHTML = `<p class="alert alert-error">${message}</p>`;
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.proposalView = {
    init,
    loadProposal,
    selectVersion,
    createNewVersion,
    toggleAcceptance,
    acceptProposal,
    showDiff
  };

})();
