/**
 * Proposal Create Component - HTML trigger for ProposalService.createProposal()
 */

(function() {
  'use strict';

  async function init(params) {
    // Get projectId or opportunityId from params or query string
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId') || (params && params.projectId);
    const opportunityId = urlParams.get('opportunityId') || (params && params.opportunityId);
    
    // Check if this is an opportunity-based engagement request
    if (opportunityId) {
      await setupOpportunityEngagementRequest(opportunityId);
      return;
    }
    
    // Get current user role
    await setupRoleBasedUI();
    
    loadProjects(projectId);
    setupProposalTypeToggle();
    addPricingItem(); // Add initial pricing item
  }

  // ============================================
  // Setup Opportunity-Based Engagement Request
  // ============================================
  async function setupOpportunityEngagementRequest(opportunityId) {
    if (!opportunityId || typeof PMTwinData === 'undefined') {
      showMessage('Invalid opportunity ID', 'error');
      return;
    }

    const opportunity = PMTwinData.Opportunities?.getById(opportunityId);
    if (!opportunity) {
      showMessage('Opportunity not found', 'error');
      return;
    }

    // Hide project selection, show opportunity info and engagement request form
    const projectSelectGroup = document.querySelector('#proposalProjectId')?.closest('.form-group');
    if (projectSelectGroup) {
      projectSelectGroup.style.display = 'none';
    }

    // Show opportunity info
    const form = document.getElementById('proposalCreateForm');
    if (form) {
      const opportunityInfo = document.createElement('div');
      opportunityInfo.className = 'card';
      opportunityInfo.style.marginBottom = '1.5rem';
      opportunityInfo.innerHTML = `
        <div class="card-body">
          <h3 style="margin-bottom: 0.5rem;">${opportunity.title || 'Untitled Opportunity'}</h3>
          <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">${opportunity.description || ''}</p>
          <p style="font-size: 0.875rem; color: var(--text-secondary);">
            Preferred Payment: <strong>${opportunity.preferredPaymentTerms?.mode || opportunity.paymentTerms?.mode || 'CASH'}</strong>
          </p>
        </div>
      `;
      form.insertBefore(opportunityInfo, form.firstChild);

      // Add payment terms section
      const paymentSection = document.createElement('div');
      paymentSection.className = 'form-group';
      paymentSection.style.marginTop = '1.5rem';
      paymentSection.innerHTML = `
        <h3 class="section-title" style="margin-bottom: 1rem;">Proposed Payment Terms</h3>
        <div class="form-group">
          <label for="proposedPaymentMode" class="form-label">Payment Mode *</label>
          <select id="proposedPaymentMode" class="form-control" required>
            <option value="CASH">Cash</option>
            <option value="BARTER">Barter</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </div>
        <div id="barterRuleGroup" class="form-group" style="display: none;">
          <label for="proposedBarterRule" class="form-label">Barter Settlement Rule *</label>
          <select id="proposedBarterRule" class="form-control">
            <option value="EQUAL_ONLY">Equal Value Only</option>
            <option value="ALLOW_DIFFERENCE_CASH">Allow Difference with Cash</option>
            <option value="ACCEPT_AS_IS">Accept As-Is</option>
          </select>
        </div>
        <div id="cashSettlementGroup" class="form-group" style="display: none;">
          <label for="proposedCashSettlement" class="form-label">Cash Settlement Amount (SAR)</label>
          <input type="number" id="proposedCashSettlement" class="form-control" min="0" step="0.01" value="0">
        </div>
      `;
      
      // Insert before submit button
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        form.insertBefore(paymentSection, submitButton.parentElement);
      } else {
        form.appendChild(paymentSection);
      }

      // Add mandatory comment field
      const commentSection = document.createElement('div');
      commentSection.className = 'form-group';
      commentSection.style.marginTop = '1.5rem';
      commentSection.innerHTML = `
        <label for="engagementComment" class="form-label">Comment / Note *</label>
        <textarea id="engagementComment" class="form-control" rows="4" 
                  placeholder="Explain your engagement request and proposed payment terms" 
                  required minlength="10"></textarea>
        <small class="form-text">This comment is required and must be at least 10 characters long.</small>
      `;
      if (submitButton) {
        form.insertBefore(commentSection, submitButton.parentElement);
      } else {
        form.appendChild(commentSection);
      }

      // Setup payment mode change handler
      const paymentModeSelect = document.getElementById('proposedPaymentMode');
      if (paymentModeSelect) {
        paymentModeSelect.addEventListener('change', function() {
          const mode = this.value;
          const barterRuleGroup = document.getElementById('barterRuleGroup');
          const cashSettlementGroup = document.getElementById('cashSettlementGroup');
          
          if (mode === 'BARTER' || mode === 'HYBRID') {
            barterRuleGroup.style.display = 'block';
            if (mode === 'HYBRID' || document.getElementById('proposedBarterRule')?.value === 'ALLOW_DIFFERENCE_CASH') {
              cashSettlementGroup.style.display = 'block';
            } else {
              cashSettlementGroup.style.display = 'none';
            }
          } else {
            barterRuleGroup.style.display = 'none';
            cashSettlementGroup.style.display = 'none';
          }
        });

        // Setup barter rule change handler
        const barterRuleSelect = document.getElementById('proposedBarterRule');
        if (barterRuleSelect) {
          barterRuleSelect.addEventListener('change', function() {
            const cashSettlementGroup = document.getElementById('cashSettlementGroup');
            if (this.value === 'ALLOW_DIFFERENCE_CASH' || document.getElementById('proposedPaymentMode')?.value === 'HYBRID') {
              cashSettlementGroup.style.display = 'block';
            } else {
              cashSettlementGroup.style.display = 'none';
            }
          });
        }
      }
    }
  }

  // ============================================
  // Setup Role-Based UI
  // ============================================
  async function setupRoleBasedUI() {
    if (typeof PMTwinData === 'undefined' || typeof PMTwinRBAC === 'undefined') {
      return;
    }

    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) return;

    const userRole = await PMTwinRBAC.getCurrentUserRole();
    
    // Hide/show fields based on role
    const projectSelectGroup = document.querySelector('#proposalProjectId')?.closest('.form-group');
    const vendorSelectGroup = document.getElementById('vendorSelectGroup');
    
    if (userRole === 'sub_contractor') {
      // Sub_contractors submit to vendors, not entities
      if (projectSelectGroup) {
        projectSelectGroup.style.display = 'none';
      }
      
      // Show vendor selection
      if (!vendorSelectGroup) {
        createVendorSelectionUI();
      }
      
      // Add info message
      showRoleInfo('You can only submit proposals to vendors for minor scope work.');
    } else if (userRole === 'vendor' || userRole === 'service_provider') {
      // Vendors can bid on projects or subprojects
      if (projectSelectGroup) {
        projectSelectGroup.style.display = 'block';
      }
      
      // Add subproject selection if project has subprojects
      setupSubprojectSelection();
      
      // Add info message
      showRoleInfo('You can bid on full projects or complete subprojects only. Partial work is not allowed.');
    } else if (userRole === 'entity') {
      // Entities cannot submit proposals
      const form = document.getElementById('proposalCreateForm');
      if (form) {
        form.style.display = 'none';
        showRoleInfo('Entities cannot submit proposals. You can only receive and review proposals.', 'error');
      }
    }
  }

  // ============================================
  // Create Vendor Selection UI
  // ============================================
  function createVendorSelectionUI() {
    const projectSelectGroup = document.querySelector('#proposalProjectId')?.closest('.form-group');
    if (!projectSelectGroup) return;

    const vendorGroup = document.createElement('div');
    vendorGroup.id = 'vendorSelectGroup';
    vendorGroup.className = 'form-group';
    vendorGroup.innerHTML = `
      <label for="proposalVendorId" class="form-label">Vendor *</label>
      <select id="proposalVendorId" class="form-control" required>
        <option value="">Select Vendor</option>
        <!-- Vendors will be loaded dynamically -->
      </select>
      <small class="form-text text-muted">Sub_contractors can only submit proposals to vendors</small>
    `;
    
    projectSelectGroup.parentNode.insertBefore(vendorGroup, projectSelectGroup);
    loadVendors();
  }

  // ============================================
  // Load Vendors for Sub_Contractor Selection
  // ============================================
  async function loadVendors() {
    const select = document.getElementById('proposalVendorId');
    if (!select) return;

    try {
      const users = PMTwinData.Users.getAll();
      let userRole;
      
      // Filter vendors
      const vendors = users.filter(async (user) => {
        if (typeof PMTwinRBAC !== 'undefined') {
          userRole = await PMTwinRBAC.getUserRole(user.id, user.email);
        } else {
          userRole = user.role;
        }
        return userRole === 'vendor' || userRole === 'service_provider';
      });

      // Wait for all role checks
      const vendorPromises = users.map(async (user) => {
        let role;
        if (typeof PMTwinRBAC !== 'undefined') {
          role = await PMTwinRBAC.getUserRole(user.id, user.email);
        } else {
          role = user.role;
        }
        return { user, role };
      });

      const usersWithRoles = await Promise.all(vendorPromises);
      const vendorsList = usersWithRoles
        .filter(({ role }) => role === 'vendor' || role === 'service_provider')
        .map(({ user }) => user);

      vendorsList.forEach(vendor => {
        const option = document.createElement('option');
        option.value = vendor.id;
        option.textContent = vendor.name || vendor.profile?.companyName || vendor.email;
        select.appendChild(option);
      });
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  }

  // ============================================
  // Setup Subproject Selection for Vendors
  // ============================================
  function setupSubprojectSelection() {
    const projectSelect = document.getElementById('proposalProjectId');
    if (!projectSelect) return;

    projectSelect.addEventListener('change', async function() {
      const projectId = this.value;
      if (!projectId) {
        hideSubprojectSelection();
        return;
      }

      const project = PMTwinData.Projects.getById(projectId);
      if (!project) return;

      // Check if project has subprojects
      if (project.subProjects && project.subProjects.length > 0) {
        showSubprojectSelection(project.subProjects);
      } else {
        hideSubprojectSelection();
      }
    });
  }

  // ============================================
  // Show Subproject Selection
  // ============================================
  function showSubprojectSelection(subProjects) {
    let subprojectGroup = document.getElementById('subprojectSelectGroup');
    
    if (!subprojectGroup) {
      const projectSelectGroup = document.querySelector('#proposalProjectId')?.closest('.form-group');
      if (!projectSelectGroup) return;

      subprojectGroup = document.createElement('div');
      subprojectGroup.id = 'subprojectSelectGroup';
      subprojectGroup.className = 'form-group';
      projectSelectGroup.parentNode.insertBefore(subprojectGroup, projectSelectGroup.nextSibling);
    }

    subprojectGroup.innerHTML = `
      <label for="proposalSubprojectId" class="form-label">Scope *</label>
      <select id="proposalSubprojectId" class="form-control" required>
        <option value="">Select Scope</option>
        <option value="full_project">Full Project</option>
        ${subProjects.map((sp, index) => 
          `<option value="${sp.id}">Subproject ${index + 1}: ${sp.title || 'Untitled'}</option>`
        ).join('')}
      </select>
      <small class="form-text text-muted">Vendors can bid on full projects or complete subprojects only</small>
    `;
    
    subprojectGroup.style.display = 'block';
  }

  // ============================================
  // Hide Subproject Selection
  // ============================================
  function hideSubprojectSelection() {
    const subprojectGroup = document.getElementById('subprojectSelectGroup');
    if (subprojectGroup) {
      subprojectGroup.style.display = 'none';
    }
  }

  // ============================================
  // Show Role Info Message
  // ============================================
  function showRoleInfo(message, type = 'info') {
    let infoDiv = document.getElementById('roleInfoMessage');
    
    if (!infoDiv) {
      const form = document.getElementById('proposalCreateForm');
      if (!form) return;

      infoDiv = document.createElement('div');
      infoDiv.id = 'roleInfoMessage';
      infoDiv.className = `alert alert-${type}`;
      form.insertBefore(infoDiv, form.firstChild);
    }

    infoDiv.textContent = message;
    infoDiv.style.display = 'block';
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

  async function loadProjects(preSelectProjectId) {
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

      // Use pre-selected project ID if provided
      const projectId = preSelectProjectId;

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
      // Get current user role
      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      let userRole = currentUser?.role;
      if (typeof PMTwinRBAC !== 'undefined') {
        userRole = await PMTwinRBAC.getCurrentUserRole();
      }

      const proposalType = document.querySelector('input[name="proposalType"]:checked')?.value;
      const description = document.getElementById('proposalDescription').value;

      if (!proposalType || !description) {
        showMessage('Please fill in all required fields', 'error');
        return false;
      }

      let proposalData = {
        type: proposalType,
        serviceDescription: description
      };

      // Handle role-specific proposal data
      if (userRole === 'sub_contractor') {
        // Sub_contractors submit to vendors
        const vendorId = document.getElementById('proposalVendorId')?.value;
        if (!vendorId) {
          showMessage('Please select a vendor', 'error');
          return false;
        }
        proposalData.vendorId = vendorId;
      } else if (userRole === 'vendor' || userRole === 'service_provider') {
        // Vendors submit to entities (projects)
        const projectId = document.getElementById('proposalProjectId')?.value;
        if (!projectId) {
          showMessage('Please select a project', 'error');
          return false;
        }
        proposalData.projectId = projectId;

        // Check for subproject selection
        const subprojectId = document.getElementById('proposalSubprojectId')?.value;
        if (subprojectId && subprojectId !== 'full_project') {
          proposalData.subprojectId = subprojectId;
          proposalData.scopeType = 'subproject';
        } else {
          proposalData.scopeType = 'full_project';
        }
      } else {
        // Other roles (legacy support)
        const projectId = document.getElementById('proposalProjectId')?.value;
        if (!projectId) {
          showMessage('Please select a project', 'error');
          return false;
        }
        proposalData.projectId = projectId;
      }

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

      // Call service based on role
      let result;
      if (userRole === 'sub_contractor' && typeof ProposalService !== 'undefined') {
        // Sub_contractors use createSubContractorProposal
        result = await ProposalService.createSubContractorProposal(proposalData.vendorId, proposalData);
      } else if (typeof ProposalService !== 'undefined') {
        // Vendors and others use createProposal
        result = await ProposalService.createProposal(proposalData);
      } else {
        showMessage('Proposal service not available', 'error');
        return false;
      }

      if (result.success) {
        const successMessage = userRole === 'sub_contractor' 
          ? 'Proposal submitted to vendor successfully!'
          : 'Proposal created successfully!';
        showMessage(successMessage, 'success');
        setTimeout(() => {
          window.location.href = '../proposals/';
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

  // ============================================
  // Handle Opportunity-Based Engagement Request
  // ============================================
  async function handleOpportunityEngagementRequest(event, opportunityId) {
    event.preventDefault();
    
    const messageDiv = document.getElementById('proposalCreateMessage');
    if (messageDiv) {
      messageDiv.style.display = 'none';
      messageDiv.className = '';
    }

    try {
      // Collect payment terms
      const paymentMode = document.getElementById('proposedPaymentMode')?.value;
      const barterRule = document.getElementById('proposedBarterRule')?.value || null;
      const cashSettlement = parseFloat(document.getElementById('proposedCashSettlement')?.value) || 0;
      
      // Collect mandatory comment
      const comment = document.getElementById('engagementComment')?.value?.trim() || '';
      
      // Validation
      if (!paymentMode) {
        showMessage('Please select a payment mode', 'error');
        return false;
      }
      
      if (comment.length < 10) {
        showMessage('Comment is required and must be at least 10 characters long', 'error');
        return false;
      }
      
      if ((paymentMode === 'BARTER' || paymentMode === 'HYBRID') && !barterRule) {
        showMessage('Please select a barter settlement rule', 'error');
        return false;
      }

      const opportunity = PMTwinData.Opportunities?.getById(opportunityId);
      if (!opportunity) {
        showMessage('Opportunity not found', 'error');
        return false;
      }

      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      if (!currentUser) {
        showMessage('You must be logged in to send an engagement request', 'error');
        return false;
      }

      // Build payment terms object
      const paymentTerms = {
        mode: paymentMode,
        barterRule: barterRule,
        cashSettlement: cashSettlement,
        acknowledgedDifference: barterRule === 'ACCEPT_AS_IS'
      };

      // Create proposal data
      const proposalData = {
        opportunityId: opportunityId,
        initiatorId: currentUser.id,
        receiverId: opportunity.createdBy || opportunity.creatorId,
        paymentTerms: paymentTerms,
        comment: comment,
        status: 'SUBMITTED'
      };

      // Create proposal using Proposals.create
      if (typeof PMTwinData !== 'undefined' && PMTwinData.Proposals) {
        const proposal = PMTwinData.Proposals.create(proposalData);
        
        if (proposal) {
          showMessage('Engagement request submitted successfully!', 'success');
          setTimeout(() => {
            // Redirect to proposal view or opportunities list
            if (typeof window.NavRoutes !== 'undefined') {
              const viewUrl = window.NavRoutes.getRouteWithQuery('proposals/view', { id: proposal.id });
              window.location.href = viewUrl;
            } else {
              window.location.href = `/POC/pages/proposals/view/index.html?id=${proposal.id}`;
            }
          }, 1500);
          return false;
        } else {
          showMessage('Failed to create engagement request', 'error');
          return false;
        }
      } else {
        showMessage('Proposals service not available', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error creating engagement request:', error);
      showMessage('An error occurred while creating the engagement request', 'error');
      return false;
    }
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
    handleOpportunityEngagementRequest,
    addPricingItem,
    addServiceOffered,
    addServiceRequested
  };

  // Global reference for form onsubmit
  window.proposalCreateComponent = window.proposals['proposal-create'];

})();

