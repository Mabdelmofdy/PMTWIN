/**
 * Proposal Create Component - HTML trigger for ProposalService.createProposal()
 */

(function() {
  'use strict';

  function init(params) {
    loadProjects();
    setupProposalTypeToggle();
    addPricingItem(); // Add initial pricing item
  }

  function setupProposalTypeToggle() {
    const typeRadios = document.querySelectorAll('input[name="proposalType"]');
    const cashFields = document.getElementById('cashProposalFields');
    const barterFields = document.getElementById('barterProposalFields');

    typeRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.value === 'cash') {
          cashFields.style.display = 'block';
          barterFields.style.display = 'none';
        } else {
          cashFields.style.display = 'none';
          barterFields.style.display = 'block';
        }
      });
    });
  }

  async function loadProjects() {
    const select = document.getElementById('proposalProjectId');
    if (!select) return;

    try {
      let projects = [];
      if (typeof ProjectService !== 'undefined') {
        const result = await ProjectService.getProjects();
        if (result.success) {
          projects = result.projects.filter(p => p.status === 'active');
        }
      } else if (typeof PMTwinData !== 'undefined') {
        projects = PMTwinData.Projects.getActive();
      }

      // Check for projectId in URL params
      const urlParams = new URLSearchParams(window.location.search);
      const projectIdParam = urlParams.get('projectId');
      const hashMatch = window.location.hash.match(/projectId=([^&]+)/);
      const projectId = projectIdParam || (hashMatch ? hashMatch[1] : null);

      projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.title || 'Untitled Project';
        if (projectId && project.id === projectId) {
          option.selected = true;
        }
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  }

  // ============================================
  // HTML Trigger for ProposalService.createProposal()
  // ============================================

  // Trigger: createProposal(proposalData) - Create proposal
  async function handleSubmit(event) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('proposalCreateMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
      messageDiv.className = '';
    }

    try {
      const projectId = document.getElementById('proposalProjectId').value;
      const proposalType = document.querySelector('input[name="proposalType"]:checked')?.value;
      const description = document.getElementById('proposalDescription').value;

      if (!projectId || !proposalType || !description) {
        showMessage('Please fill in all required fields', 'error');
        return false;
      }

      let proposalData = {
        projectId: projectId,
        type: proposalType,
        serviceDescription: description
      };

      if (proposalType === 'cash') {
        // Collect pricing items
        const pricingItems = [];
        const pricingRows = document.querySelectorAll('.pricing-item');
        pricingRows.forEach(row => {
          const item = row.querySelector('.pricing-item-name')?.value;
          const quantity = parseFloat(row.querySelector('.pricing-item-quantity')?.value) || 1;
          const unitPrice = parseFloat(row.querySelector('.pricing-item-unit-price')?.value) || 0;
          
          if (item && unitPrice > 0) {
            pricingItems.push({
              item: item,
              quantity: quantity,
              unit: row.querySelector('.pricing-item-unit')?.value || 'unit',
              unitPrice: unitPrice,
              total: quantity * unitPrice
            });
          }
        });

        if (pricingItems.length === 0) {
          showMessage('Please add at least one pricing item', 'error');
          return false;
        }

        const subtotal = pricingItems.reduce((sum, item) => sum + item.total, 0);
        const vat = subtotal * 0.15; // 15% VAT

        proposalData.pricing = pricingItems;
        proposalData.subtotal = subtotal;
        proposalData.taxes = { vat: vat };
        proposalData.total = subtotal + vat;
        proposalData.currency = 'SAR';
      } else {
        // Barter proposal
        const servicesOffered = [];
        const servicesRequested = [];

        // Collect services offered
        const offeredRows = document.querySelectorAll('.service-offered');
        offeredRows.forEach(row => {
          const desc = row.querySelector('.service-desc')?.value;
          const value = parseFloat(row.querySelector('.service-value')?.value) || 0;
          if (desc && value > 0) {
            servicesOffered.push({
              description: desc,
              value: value
            });
          }
        });

        // Collect services requested
        const requestedRows = document.querySelectorAll('.service-requested');
        requestedRows.forEach(row => {
          const desc = row.querySelector('.service-desc')?.value;
          const value = parseFloat(row.querySelector('.service-value')?.value) || 0;
          if (desc && value > 0) {
            servicesRequested.push({
              description: desc,
              value: value
            });
          }
        });

        if (servicesOffered.length === 0 || servicesRequested.length === 0) {
          showMessage('Please add at least one service offered and one service requested', 'error');
          return false;
        }

        proposalData.servicesOffered = servicesOffered;
        proposalData.servicesRequested = servicesRequested;
        proposalData.totalOffered = servicesOffered.reduce((sum, s) => sum + s.value, 0);
        proposalData.totalRequested = servicesRequested.reduce((sum, s) => sum + s.value, 0);
      }

      // Call service
      let result;
      if (typeof ProposalService !== 'undefined') {
        result = await ProposalService.createProposal(proposalData);
      } else {
        showMessage('Proposal service not available', 'error');
        return false;
      }

      if (result.success) {
        showMessage('Proposal created successfully!', 'success');
        setTimeout(() => {
          window.location.hash = '#proposals';
        }, 1500);
      } else {
        showMessage(result.error || 'Failed to create proposal', 'error');
      }
    } catch (error) {
      console.error('Error creating proposal:', error);
      showMessage('An error occurred while creating the proposal', 'error');
    }

    return false;
  }

  function addPricingItem() {
    const container = document.getElementById('pricingItems');
    if (!container) return;

    const index = container.children.length;
    const itemDiv = document.createElement('div');
    itemDiv.className = 'pricing-item';
    itemDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    
    itemDiv.innerHTML = `
      <input type="text" class="pricing-item-name form-control" placeholder="Item name" required>
      <input type="number" class="pricing-item-quantity form-control" placeholder="Qty" value="1" min="1" required>
      <input type="text" class="pricing-item-unit form-control" placeholder="Unit" value="unit">
      <input type="number" class="pricing-item-unit-price form-control" placeholder="Unit Price (SAR)" min="0" step="0.01" required>
      <button type="button" onclick="this.closest('.pricing-item').remove()" class="btn btn-danger btn-sm">Remove</button>
    `;
    
    container.appendChild(itemDiv);
  }

  function addServiceOffered() {
    const container = document.getElementById('servicesOffered');
    if (!container) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'service-offered';
    itemDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    
    itemDiv.innerHTML = `
      <textarea class="service-desc form-control" placeholder="Service description" rows="2" required></textarea>
      <input type="number" class="service-value form-control" placeholder="Value (SAR)" min="0" step="0.01" required>
      <button type="button" onclick="this.closest('.service-offered').remove()" class="btn btn-danger btn-sm">Remove</button>
    `;
    
    container.appendChild(itemDiv);
  }

  function addServiceRequested() {
    const container = document.getElementById('servicesRequested');
    if (!container) return;

    const itemDiv = document.createElement('div');
    itemDiv.className = 'service-requested';
    itemDiv.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr auto; gap: 0.5rem; margin-bottom: 0.5rem; align-items: end;';
    
    itemDiv.innerHTML = `
      <textarea class="service-desc form-control" placeholder="Service description" rows="2" required></textarea>
      <input type="number" class="service-value form-control" placeholder="Value (SAR)" min="0" step="0.01" required>
      <button type="button" onclick="this.closest('.service-requested').remove()" class="btn btn-danger btn-sm">Remove</button>
    `;
    
    container.appendChild(itemDiv);
  }

  function showMessage(message, type) {
    const messageDiv = document.getElementById('proposalCreateMessage');
    if (messageDiv) {
      messageDiv.textContent = message;
      messageDiv.className = `alert alert-${type === 'error' ? 'error' : 'success'}`;
      messageDiv.style.display = 'block';
    }
  }

  // Export
  if (!window.proposals) window.proposals = {};
  window.proposals['proposal-create'] = {
    init,
    handleSubmit,
    addPricingItem,
    addServiceOffered,
    addServiceRequested
  };

  // Global reference for form onsubmit
  window.proposalCreateComponent = window.proposals['proposal-create'];

})();

