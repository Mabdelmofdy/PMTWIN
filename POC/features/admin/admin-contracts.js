/**
 * Admin Contracts Management
 * Manages contract viewing, filtering, and details
 */

(function() {
  'use strict';

  const AdminContracts = {
    contracts: [],
    filteredContracts: [],
    filters: {
      search: '',
      contractType: '',
      scopeType: '',
      status: '',
      providerType: ''
    },

    init() {
      this.loadContracts();
      this.setupEventListeners();
      this.updateStatistics();
    },

    async loadContracts() {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
        console.error('Contracts module not available');
        return;
      }

      this.contracts = PMTwinData.Contracts.getAll();
      this.filteredContracts = [...this.contracts];
      this.renderContracts();
      this.updateCount();
    },

    setupEventListeners() {
      // Search input
      const searchInput = document.getElementById('contractSearch');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.filters.search = e.target.value.toLowerCase();
          this.applyFilters();
        });
      }

      // Filter selects
      const filterSelects = ['contractTypeFilter', 'scopeTypeFilter', 'statusFilter', 'providerTypeFilter'];
      filterSelects.forEach(filterId => {
        const select = document.getElementById(filterId);
        if (select) {
          select.addEventListener('change', (e) => {
            const filterKey = filterId.replace('Filter', '').replace(/([A-Z])/g, '_$1').toUpperCase();
            this.filters[filterKey] = e.target.value;
            this.applyFilters();
          });
        }
      });

      // Apply and Clear buttons
      const applyBtn = document.getElementById('applyFilters');
      if (applyBtn) {
        applyBtn.addEventListener('click', () => this.applyFilters());
      }

      const clearBtn = document.getElementById('clearFilters');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => this.clearFilters());
      }
    },

    applyFilters() {
      this.filteredContracts = this.contracts.filter(contract => {
        // Search filter
        if (this.filters.search) {
          const searchLower = this.filters.search.toLowerCase();
          const matchesSearch = 
            contract.id.toLowerCase().includes(searchLower) ||
            contract.scopeId.toLowerCase().includes(searchLower) ||
            contract.buyerPartyId.toLowerCase().includes(searchLower) ||
            contract.providerPartyId.toLowerCase().includes(searchLower);
          if (!matchesSearch) return false;
        }

        // Contract type filter
        if (this.filters.CONTRACT_TYPE && contract.contractType !== this.filters.CONTRACT_TYPE) {
          return false;
        }

        // Scope type filter
        if (this.filters.SCOPE_TYPE && contract.scopeType !== this.filters.SCOPE_TYPE) {
          return false;
        }

        // Status filter
        if (this.filters.STATUS && contract.status !== this.filters.STATUS) {
          return false;
        }

        // Provider type filter
        if (this.filters.PROVIDER_TYPE && contract.providerPartyType !== this.filters.PROVIDER_TYPE) {
          return false;
        }

        return true;
      });

      this.renderContracts();
      this.updateCount();
    },

    clearFilters() {
      this.filters = {
        search: '',
        contractType: '',
        scopeType: '',
        status: '',
        providerType: ''
      };

      // Reset form inputs
      document.getElementById('contractSearch').value = '';
      document.getElementById('contractTypeFilter').value = '';
      document.getElementById('scopeTypeFilter').value = '';
      document.getElementById('statusFilter').value = '';
      document.getElementById('providerTypeFilter').value = '';

      this.filteredContracts = [...this.contracts];
      this.renderContracts();
      this.updateCount();
    },

    renderContracts() {
      const container = document.getElementById('contractsList');
      if (!container) return;

      if (this.filteredContracts.length === 0) {
        container.innerHTML = '<p class="text-secondary">No contracts found.</p>';
        return;
      }

      container.innerHTML = this.filteredContracts.map(contract => {
        const buyerName = this.getPartyName(contract.buyerPartyId);
        const providerName = this.getPartyName(contract.providerPartyId);
        const scopeName = this.getScopeName(contract.scopeType, contract.scopeId);
        const statusBadge = this.getStatusBadge(contract.status);
        const contractTypeLabel = this.getContractTypeLabel(contract.contractType);

        return `
          <div class="card" style="margin-bottom: var(--spacing-4);">
            <div class="card-body">
              <div class="flex justify-between align-start">
                <div style="flex: 1;">
                  <div class="flex align-center gap-2" style="margin-bottom: var(--spacing-2);">
                    <h3 style="margin: 0;">${contractTypeLabel}</h3>
                    ${statusBadge}
                    ${contract.contractType === 'SUB_CONTRACT' ? '<span class="badge badge-secondary">Sub-Contract</span>' : ''}
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-3); margin-top: var(--spacing-3);">
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Contract ID</div>
                      <div style="font-weight: 500;">${contract.id}</div>
                    </div>
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Scope</div>
                      <div style="font-weight: 500;">${contract.scopeType}: ${scopeName}</div>
                    </div>
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Buyer</div>
                      <div style="font-weight: 500;">${buyerName}</div>
                    </div>
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Provider</div>
                      <div style="font-weight: 500;">${providerName}</div>
                    </div>
                    ${contract.startDate ? `
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Start Date</div>
                      <div style="font-weight: 500;">${new Date(contract.startDate).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                    ${contract.endDate ? `
                    <div>
                      <div class="text-secondary" style="font-size: 0.875rem;">End Date</div>
                      <div style="font-weight: 500;">${new Date(contract.endDate).toLocaleDateString()}</div>
                    </div>
                    ` : ''}
                  </div>
                  ${contract.parentContractId ? `
                    <div style="margin-top: var(--spacing-3); padding-top: var(--spacing-3); border-top: 1px solid var(--border-color);">
                      <div class="text-secondary" style="font-size: 0.875rem;">Parent Contract</div>
                      <a href="#" onclick="window.admin['admin-contracts'].viewContractDetails('${contract.parentContractId}'); return false;" style="color: var(--color-primary);">
                        ${contract.parentContractId}
                      </a>
                    </div>
                  ` : ''}
                </div>
                <div style="display: flex; gap: var(--spacing-2);">
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.admin['admin-contracts'].viewContractDetails('${contract.id}')">
                    <i class="ph ph-eye"></i> View
                  </button>
                  ${contract.contractType === 'PROJECT_CONTRACT' || contract.contractType === 'MEGA_PROJECT_CONTRACT' ? `
                  <button type="button" class="btn btn-outline btn-sm" onclick="window.admin['admin-contracts'].viewSubContracts('${contract.id}')">
                    <i class="ph ph-list"></i> Sub-Contracts
                  </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    async viewContractDetails(contractId) {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
        return;
      }

      const contract = PMTwinData.Contracts.getById(contractId);
      if (!contract) {
        alert('Contract not found');
        return;
      }

      const buyerName = this.getPartyName(contract.buyerPartyId);
      const providerName = this.getPartyName(contract.providerPartyId);
      const scopeName = this.getScopeName(contract.scopeType, contract.scopeId);
      
      // Get engagements
      const engagements = PMTwinData.Engagements ? PMTwinData.Engagements.getByContract(contractId) : [];
      
      // Get sub-contracts if applicable
      const subContracts = contract.contractType === 'PROJECT_CONTRACT' || contract.contractType === 'MEGA_PROJECT_CONTRACT'
        ? PMTwinData.Contracts.getSubContracts(contractId)
        : [];

      const modal = document.getElementById('contractDetailsModal');
      const content = document.getElementById('contractDetailsContent');

      content.innerHTML = `
        <div style="display: grid; gap: var(--spacing-4);">
          <div>
            <h3>Contract Information</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: var(--spacing-3);">
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Contract ID</div>
                <div style="font-weight: 500;">${contract.id}</div>
              </div>
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Contract Type</div>
                <div style="font-weight: 500;">${this.getContractTypeLabel(contract.contractType)}</div>
              </div>
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Status</div>
                <div>${this.getStatusBadge(contract.status)}</div>
              </div>
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Scope</div>
                <div style="font-weight: 500;">${contract.scopeType}: ${scopeName}</div>
              </div>
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Buyer</div>
                <div style="font-weight: 500;">${buyerName}</div>
              </div>
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Provider</div>
                <div style="font-weight: 500;">${providerName}</div>
              </div>
              ${contract.startDate ? `
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Start Date</div>
                <div style="font-weight: 500;">${new Date(contract.startDate).toLocaleDateString()}</div>
              </div>
              ` : ''}
              ${contract.endDate ? `
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">End Date</div>
                <div style="font-weight: 500;">${new Date(contract.endDate).toLocaleDateString()}</div>
              </div>
              ` : ''}
              ${contract.signedAt ? `
              <div>
                <div class="text-secondary" style="font-size: 0.875rem;">Signed At</div>
                <div style="font-weight: 500;">${new Date(contract.signedAt).toLocaleDateString()}</div>
              </div>
              ` : ''}
            </div>
          </div>

          ${contract.termsJSON ? `
          <div>
            <h3>Terms</h3>
            <div style="background: var(--bg-secondary); padding: var(--spacing-4); border-radius: var(--radius-md);">
              <pre style="margin: 0; white-space: pre-wrap; font-family: inherit;">${JSON.stringify(contract.termsJSON, null, 2)}</pre>
            </div>
          </div>
          ` : ''}

          ${engagements.length > 0 ? `
          <div>
            <h3>Engagements (${engagements.length})</h3>
            <div style="display: grid; gap: var(--spacing-2);">
              ${engagements.map(eng => `
                <div style="padding: var(--spacing-3); background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div class="flex justify-between align-center">
                    <div>
                      <div style="font-weight: 500;">${eng.engagementType}</div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Status: ${eng.status}</div>
                    </div>
                    ${this.getStatusBadge(eng.status)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}

          ${subContracts.length > 0 ? `
          <div>
            <h3>Sub-Contracts (${subContracts.length})</h3>
            <div style="display: grid; gap: var(--spacing-2);">
              ${subContracts.map(sub => `
                <div style="padding: var(--spacing-3); background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div class="flex justify-between align-center">
                    <div>
                      <div style="font-weight: 500;">${sub.id}</div>
                      <div class="text-secondary" style="font-size: 0.875rem;">Provider: ${this.getPartyName(sub.providerPartyId)}</div>
                    </div>
                    ${this.getStatusBadge(sub.status)}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
        </div>
      `;

      modal.style.display = 'block';
    },

    viewSubContracts(contractId) {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
        return;
      }

      const subContracts = PMTwinData.Contracts.getSubContracts(contractId);
      if (subContracts.length === 0) {
        alert('No sub-contracts found for this contract');
        return;
      }

      // Filter to show only sub-contracts
      this.filters.CONTRACT_TYPE = 'SUB_CONTRACT';
      // Note: This is a simplified filter - in a real implementation, you'd want a parentContractId filter
      this.filteredContracts = subContracts;
      this.renderContracts();
      this.updateCount();
    },

    updateStatistics() {
      const container = document.getElementById('contractsStatistics');
      if (!container) return;

      const stats = {
        total: this.contracts.length,
        byType: {},
        byStatus: {},
        active: 0,
        signed: 0
      };

      this.contracts.forEach(contract => {
        stats.byType[contract.contractType] = (stats.byType[contract.contractType] || 0) + 1;
        stats.byStatus[contract.status] = (stats.byStatus[contract.status] || 0) + 1;
        if (contract.status === 'ACTIVE') stats.active++;
        if (contract.status === 'SIGNED' || contract.status === 'ACTIVE') stats.signed++;
      });

      container.innerHTML = `
        <div class="stat-card">
          <div class="stat-value">${stats.total}</div>
          <div class="stat-label">Total Contracts</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.active}</div>
          <div class="stat-label">Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.signed}</div>
          <div class="stat-label">Signed/Active</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${stats.byType.SUB_CONTRACT || 0}</div>
          <div class="stat-label">Sub-Contracts</div>
        </div>
      `;
    },

    updateCount() {
      const countEl = document.getElementById('contractsCount');
      if (countEl) {
        countEl.textContent = `Showing ${this.filteredContracts.length} of ${this.contracts.length} contracts`;
      }
    },

    getPartyName(partyId) {
      if (typeof PMTwinData === 'undefined' || !PMTwinData.Users) {
        return partyId;
      }
      const user = PMTwinData.Users.getById(partyId);
      if (user) {
        return user.profile?.name || user.profile?.companyName || user.email || partyId;
      }
      return partyId;
    },

    getScopeName(scopeType, scopeId) {
      if (scopeType === 'PROJECT' || scopeType === 'MEGA_PROJECT') {
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Projects) {
          const project = PMTwinData.Projects.getById(scopeId);
          if (project) {
            return project.title || scopeId;
          }
        }
      } else if (scopeType === 'SERVICE_REQUEST') {
        if (typeof PMTwinData !== 'undefined' && PMTwinData.ServiceRequests) {
          const request = PMTwinData.ServiceRequests.getById(scopeId);
          if (request) {
            return request.title || scopeId;
          }
        }
      }
      return scopeId;
    },

    getStatusBadge(status) {
      const badges = {
        'DRAFT': '<span class="badge badge-secondary">Draft</span>',
        'SENT': '<span class="badge badge-info">Sent</span>',
        'SIGNED': '<span class="badge badge-success">Signed</span>',
        'ACTIVE': '<span class="badge badge-primary">Active</span>',
        'COMPLETED': '<span class="badge badge-success">Completed</span>',
        'TERMINATED': '<span class="badge badge-danger">Terminated</span>',
        'PLANNED': '<span class="badge badge-secondary">Planned</span>',
        'PAUSED': '<span class="badge badge-warning">Paused</span>',
        'CANCELED': '<span class="badge badge-danger">Canceled</span>'
      };
      return badges[status] || `<span class="badge">${status}</span>`;
    },

    getContractTypeLabel(type) {
      const labels = {
        'PROJECT_CONTRACT': 'Project Contract',
        'MEGA_PROJECT_CONTRACT': 'Mega Project Contract',
        'SERVICE_CONTRACT': 'Service Contract',
        'ADVISORY_CONTRACT': 'Advisory Contract',
        'SUB_CONTRACT': 'Sub-Contract'
      };
      return labels[type] || type;
    }
  };

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-contracts'] = AdminContracts;

})();

