/**
 * PMTwin Unified Renderer
 * Dynamically renders all sections from data files
 */

(function() {
  'use strict';

  // ============================================
  // Utility Functions (using Formatters from utils)
  // ============================================

  // Use Formatters utility if available, otherwise define locally for backward compatibility
  const formatCurrency = (typeof Formatters !== 'undefined' && Formatters.formatCurrency) 
    ? Formatters.formatCurrency 
    : function(amount, currency = 'SAR') {
    if (!amount) return 'N/A';
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
      };

  const formatDate = (typeof Formatters !== 'undefined' && Formatters.formatDate)
    ? Formatters.formatDate
    : function(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      };

  const getStatusBadge = (typeof Formatters !== 'undefined' && Formatters.getStatusBadge)
    ? Formatters.getStatusBadge
    : function(status, type = 'default') {
    const statusColors = {
      active: { bg: '#10b981', text: '#fff' },
      pending: { bg: '#f59e0b', text: '#fff' },
      under_review: { bg: '#3b82f6', text: '#fff' },
      approved: { bg: '#10b981', text: '#fff' },
      rejected: { bg: '#ef4444', text: '#fff' },
      closed: { bg: '#6b7280', text: '#fff' },
      draft: { bg: '#9ca3af', text: '#fff' },
      completed: { bg: '#10b981', text: '#fff' },
      in_progress: { bg: '#3b82f6', text: '#fff' },
      verified: { bg: '#10b981', text: '#fff' }
    };
    const color = statusColors[status] || { bg: '#6b7280', text: '#fff' };
    return `<span class="badge" style="background: ${color.bg}; color: ${color.text}; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${status.replace('_', ' ').toUpperCase()}</span>`;
      };

  const getDaysRemaining = (typeof Formatters !== 'undefined' && Formatters.getDaysRemaining)
    ? Formatters.getDaysRemaining
    : function(deadline) {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
      };

  // ============================================
  // Models Rendering
  // ============================================

  /**
   * Render Models List (all categories or specific category)
   */
  function renderModels(categoryId = null) {
    const container = document.getElementById('models');
    if (!container || typeof modelsData === 'undefined') return;

    const data = modelsData.categories;
    if (!data || data.length === 0) {
      container.innerHTML = '<p>No models available.</p>';
      return;
    }

    // If categoryId provided, show only that category's sub-models
    if (categoryId) {
      const category = data.find(cat => cat.id === categoryId);
      if (!category) return;

      const subModelsHTML = category.subModels.map(subModel => `
        <div class="card" style="margin-bottom: var(--spacing-4); cursor: pointer;" onclick="Renderer.showModelDetails('${subModel.id}')">
          <div style="display: grid; grid-template-columns: 200px 1fr; gap: var(--spacing-4);">
            ${subModel.image ? `<img src="${subModel.image}" alt="${subModel.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--radius);">` : ''}
            <div>
              <h3 class="card-title">${subModel.title}</h3>
              <p class="card-text">${subModel.shortDescription}</p>
              <div style="margin-top: var(--spacing-3);">
                <span class="badge badge-primary" style="margin-right: var(--spacing-2);">${subModel.category}</span>
                ${subModel.applicability ? subModel.applicability.map(app => `<span class="badge badge-outline" style="margin-right: var(--spacing-1);">${app}</span>`).join('') : ''}
              </div>
              <a href="#" class="btn btn-outline" style="margin-top: var(--spacing-3);" onclick="event.stopPropagation(); Renderer.showModelDetails('${subModel.id}'); return false;">View Details</a>
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
          <button class="btn btn-outline" onclick="Renderer.renderModels()" style="margin-bottom: var(--spacing-4);">← Back to Categories</button>
          <h2 style="margin-bottom: var(--spacing-6);">${category.name}</h2>
          <p style="margin-bottom: var(--spacing-6); color: var(--text-secondary);">${category.description}</p>
          ${subModelsHTML}
        </div>
      `;
      return;
    }

    // Render all categories
    const categoriesHTML = data.map(category => `
      <div class="card" style="margin-bottom: var(--spacing-6);">
        <div class="card-body">
          <h2 class="card-title" style="margin-bottom: var(--spacing-3);">${category.name}</h2>
          <p class="card-text" style="margin-bottom: var(--spacing-4);">${category.description}</p>
          <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-${Math.min(category.subModels.length, 4)} gap-4">
            ${category.subModels.map(subModel => `
              <div class="card" style="cursor: pointer; height: 100%;" onclick="Renderer.showModelDetails('${subModel.id}')">
                <div class="card-body">
                  ${subModel.image ? `<img src="${subModel.image}" alt="${subModel.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: var(--radius); margin-bottom: var(--spacing-3);">` : ''}
                  <h4 style="margin-bottom: var(--spacing-2);">${subModel.title}</h4>
                  <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: var(--spacing-3);">${subModel.shortDescription}</p>
                  <a href="#" class="btn btn-outline btn-sm" onclick="event.stopPropagation(); Renderer.showModelDetails('${subModel.id}'); return false;">Learn More</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <h1 style="text-align: center; margin-bottom: var(--spacing-8);">Collaboration Models</h1>
        ${categoriesHTML}
      </div>
    `;
  }

  /**
   * Render Model Details
   */
  function showModelDetails(modelId) {
    const container = document.getElementById('models');
    if (!container || typeof modelsData === 'undefined') return;

    // Find the model
    let model = null;
    for (const category of modelsData.categories) {
      model = category.subModels.find(m => m.id === modelId);
      if (model) break;
    }

    if (!model) {
      container.innerHTML = '<p>Model not found.</p>';
      return;
    }

    const useCasesHTML = model.useCases ? model.useCases.map(useCase => `<li>${useCase}</li>`).join('') : '';
    const benefitsHTML = model.benefits ? model.benefits.map(benefit => `<li>${benefit}</li>`).join('') : '';
    const processStepsHTML = model.processSteps ? model.processSteps.map(step => `
      <div style="margin-bottom: var(--spacing-4); padding: var(--spacing-4); background: var(--bg-secondary); border-radius: var(--radius); border-left: 4px solid var(--color-primary);">
        <div style="display: flex; align-items: center; margin-bottom: var(--spacing-2);">
          <span style="background: var(--color-primary); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: var(--spacing-3);">${step.step}</span>
          <h4 style="margin: 0;">${step.title}</h4>
        </div>
        <p style="margin: 0; color: var(--text-secondary);">${step.description}</p>
      </div>
    `).join('') : '';

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <button class="btn btn-outline" onclick="Renderer.renderModels()" style="margin-bottom: var(--spacing-4);">← Back to Models</button>
        
        <div style="display: grid; grid-template-columns: 1fr 400px; gap: var(--spacing-6); margin-bottom: var(--spacing-6);">
          <div>
            <h1 style="margin-bottom: var(--spacing-4);">${model.title}</h1>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary); margin-bottom: var(--spacing-4);">${model.detailedDescription}</p>
            <div style="margin-bottom: var(--spacing-4);">
              <span class="badge badge-primary" style="margin-right: var(--spacing-2);">${model.category}</span>
              ${model.applicability ? model.applicability.map(app => `<span class="badge badge-outline" style="margin-right: var(--spacing-1);">${app}</span>`).join('') : ''}
            </div>
          </div>
          ${model.image ? `<div><img src="${model.image}" alt="${model.title}" style="width: 100%; border-radius: var(--radius-lg); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>` : ''}
        </div>

        ${useCasesHTML ? `
          <div class="card" style="margin-bottom: var(--spacing-6);">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Use Cases</h3>
              <ul style="line-height: 1.8; color: var(--text-secondary);">
                ${useCasesHTML}
              </ul>
            </div>
          </div>
        ` : ''}

        ${benefitsHTML ? `
          <div class="card" style="margin-bottom: var(--spacing-6);">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Key Benefits</h3>
              <ul style="line-height: 1.8; color: var(--text-secondary);">
                ${benefitsHTML}
              </ul>
            </div>
          </div>
        ` : ''}

        ${processStepsHTML ? `
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Process Steps</h3>
              ${processStepsHTML}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ============================================
  // Opportunities Rendering
  // ============================================

  /**
   * Render Opportunities List
   */
  function renderOpportunities(filters = {}) {
    const container = document.getElementById('opportunities');
    if (!container || typeof adminData === 'undefined') return;

    let opportunities = adminData.opportunities || [];
    
    // Apply filters
    if (filters.status) {
      opportunities = opportunities.filter(opp => opp.status === filters.status);
    }
    if (filters.type) {
      opportunities = opportunities.filter(opp => opp.type === filters.type);
    }

    if (opportunities.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No opportunities found.</p></div>';
      return;
    }

    const opportunitiesHTML = opportunities.map(opp => {
      const daysRemaining = getDaysRemaining(opp.deadline);
      const budgetText = opp.budget ? `${formatCurrency(opp.budget.min, opp.budget.currency)} - ${formatCurrency(opp.budget.max, opp.budget.currency)}` : 'Not specified';
      
      return `
        <div class="card" style="margin-bottom: var(--spacing-4);">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-3);">
              <div style="flex: 1;">
                <h3 class="card-title" style="margin-bottom: var(--spacing-2);">${opp.title}</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--spacing-2);">${opp.description || 'No description available.'}</p>
                <div style="display: flex; gap: var(--spacing-4); flex-wrap: wrap; margin-top: var(--spacing-3);">
                  <span style="color: var(--text-secondary);"><strong>Type:</strong> ${opp.type}</span>
                  <span style="color: var(--text-secondary);"><strong>Location:</strong> ${opp.location?.city || 'N/A'}, ${opp.location?.country || 'Not specified'}</span>
                  ${opp.location?.isRemoteAllowed ? '<span class="badge badge-success" style="margin-left: 0.5rem;"><i class="ph ph-globe"></i> Remote</span>' : ''}
                  <span style="color: var(--text-secondary);"><strong>Budget:</strong> ${budgetText}</span>
                  ${daysRemaining !== null ? `<span style="color: ${daysRemaining < 7 ? '#ef4444' : daysRemaining < 30 ? '#f59e0b' : '#10b981'};"><strong>Deadline:</strong> ${daysRemaining} days remaining</span>` : ''}
                </div>
              </div>
              <div style="text-align: right;">
                ${getStatusBadge(opp.status)}
                <div style="margin-top: var(--spacing-2); font-size: 0.85rem; color: var(--text-secondary);">
                  <div>${opp.applicants || 0} applicants</div>
                  <div>${opp.views || 0} views</div>
                </div>
              </div>
            </div>
            <div style="display: flex; gap: var(--spacing-2); margin-top: var(--spacing-3);">
              <button class="btn btn-primary btn-sm">View Details</button>
              <button class="btn btn-outline btn-sm">Apply</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <h1>Opportunities</h1>
          <div style="display: flex; gap: var(--spacing-2);">
            <select class="form-control" style="width: auto;" onchange="Renderer.renderOpportunities({status: this.value})">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="draft">Draft</option>
            </select>
            <button class="btn btn-primary">Create Opportunity</button>
          </div>
        </div>
        ${opportunitiesHTML}
      </div>
    `;
  }

  // ============================================
  // Proposals Rendering
  // ============================================

  /**
   * Render Proposals List
   */
  function renderProposals(status = null) {
    const container = document.getElementById('proposals');
    if (!container || typeof adminData === 'undefined') return;

    let proposals = adminData.proposals || [];
    
    if (status) {
      proposals = proposals.filter(prop => prop.status === status);
    }

    if (proposals.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No proposals found.</p></div>';
      return;
    }

    const proposalsHTML = proposals.map(prop => {
      const budgetText = prop.budget ? formatCurrency(prop.budget.amount, prop.budget.currency) : 'Not specified';
      
      return `
        <tr>
          <td><strong>${prop.id}</strong></td>
          <td>${prop.opportunityTitle || 'N/A'}</td>
          <td>${prop.submittedBy}</td>
          <td>${getStatusBadge(prop.status)}</td>
          <td>${budgetText}</td>
          <td>${formatDate(prop.submittedAt)}</td>
          <td>
            <div style="display: flex; gap: var(--spacing-2);">
              <button class="btn btn-sm btn-outline">View</button>
              ${prop.status === 'pending' ? `
                <button class="btn btn-sm btn-primary">Approve</button>
                <button class="btn btn-sm" style="background: #ef4444; color: white;">Reject</button>
              ` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <h1>Proposals</h1>
          <select class="form-control" style="width: auto;" onchange="Renderer.renderProposals(this.value || null)">
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div class="card">
          <div class="card-body" style="padding: 0;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th>Proposal ID</th>
                  <th>Opportunity</th>
                  <th>Submitted By</th>
                  <th>Status</th>
                  <th>Budget</th>
                  <th>Submitted Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${proposalsHTML}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Service Pipeline Rendering
  // ============================================

  /**
   * Render Service Pipeline
   */
  function renderServicePipeline() {
    const container = document.getElementById('servicePipeline');
    if (!container || typeof adminData === 'undefined') return;

    const pipeline = adminData.servicePipeline;
    if (!pipeline || !pipeline.stages) {
      container.innerHTML = '<p>Pipeline data not available.</p>';
      return;
    }

    const stagesHTML = pipeline.stages.map(stage => {
      const opportunitiesHTML = stage.opportunities ? stage.opportunities.map(opp => `
        <div class="card" style="margin-bottom: var(--spacing-2); cursor: move;" draggable="true">
          <div class="card-body" style="padding: var(--spacing-3);">
            <h5 style="margin: 0 0 var(--spacing-1) 0; font-size: 0.9rem;">${opp.title}</h5>
            <p style="margin: 0; font-size: 0.8rem; color: var(--text-secondary);">${opp.createdBy}</p>
          </div>
        </div>
      `).join('') : '';

      return `
        <div style="flex: 1; min-width: 250px;">
          <div style="background: ${stage.color}; color: white; padding: var(--spacing-3); border-radius: var(--radius) var(--radius) 0 0; text-align: center;">
            <h3 style="margin: 0; font-size: 1.1rem;">${stage.name}</h3>
            <span style="background: rgba(255,255,255,0.2); padding: 2px 8px; border-radius: 12px; font-size: 0.85rem; margin-top: var(--spacing-2); display: inline-block;">${stage.count}</span>
          </div>
          <div style="background: var(--bg-secondary); padding: var(--spacing-3); border-radius: 0 0 var(--radius) var(--radius); min-height: 400px;">
            ${opportunitiesHTML || '<p style="text-align: center; color: var(--text-secondary); padding: var(--spacing-4);">No opportunities</p>'}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <h1 style="margin-bottom: var(--spacing-6);">Service Pipeline</h1>
        <div style="display: flex; gap: var(--spacing-4); overflow-x: auto; padding-bottom: var(--spacing-4);">
          ${stagesHTML}
        </div>
      </div>
    `;
  }

  // ============================================
  // Projects Rendering
  // ============================================

  /**
   * Render Projects List
   */
  function renderProjects(status = null) {
    const container = document.getElementById('projects');
    if (!container || typeof adminData === 'undefined') return;

    let projects = adminData.projects || [];
    
    if (status) {
      projects = projects.filter(proj => proj.status === status);
    }

    if (projects.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No projects found.</p></div>';
      return;
    }

    const projectsHTML = projects.map(proj => {
      const budgetSpent = proj.budget ? `${formatCurrency(proj.budget.spent, proj.budget.currency)} / ${formatCurrency(proj.budget.total, proj.budget.currency)}` : 'N/A';
      const progressBarWidth = proj.progress || 0;

      return `
        <div class="card" style="margin-bottom: var(--spacing-4);">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--spacing-3);">
              <div style="flex: 1;">
                <h3 class="card-title" style="margin-bottom: var(--spacing-2);">${proj.title}</h3>
                <div style="display: flex; gap: var(--spacing-4); flex-wrap: wrap; margin-bottom: var(--spacing-3);">
                  <span style="color: var(--text-secondary);"><strong>Owner:</strong> ${proj.owner}</span>
                  <span style="color: var(--text-secondary);"><strong>Start:</strong> ${formatDate(proj.startDate)}</span>
                  <span style="color: var(--text-secondary);"><strong>End:</strong> ${formatDate(proj.endDate)}</span>
                  <span style="color: var(--text-secondary);"><strong>Budget:</strong> ${budgetSpent}</span>
                </div>
                <div style="margin-bottom: var(--spacing-3);">
                  <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                    <span style="font-weight: 600;">Progress</span>
                    <span>${proj.progress}%</span>
                  </div>
                  <div style="background: var(--bg-secondary); border-radius: var(--radius); height: 8px; overflow: hidden;">
                    <div style="background: var(--color-primary); height: 100%; width: ${progressBarWidth}%; transition: width 0.3s ease;"></div>
                  </div>
                </div>
              </div>
              <div style="text-align: right;">
                ${getStatusBadge(proj.status)}
              </div>
            </div>
            <div style="display: flex; gap: var(--spacing-2);">
              <button class="btn btn-primary btn-sm">View Details</button>
              <button class="btn btn-outline btn-sm">Update Progress</button>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <h1>Projects</h1>
          <select class="form-control" style="width: auto;" onchange="Renderer.renderProjects(this.value || null)">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="planning">Planning</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        ${projectsHTML}
      </div>
    `;
  }

  // ============================================
  // Admin Dashboard Rendering
  // ============================================

  /**
   * Render Admin Dashboard
   */
  function renderAdminDashboard() {
    const container = document.getElementById('adminDashboard');
    if (!container || typeof dashboardData === 'undefined' || typeof adminData === 'undefined') return;

    const kpis = dashboardData.kpis;
    const charts = dashboardData.charts;
    const activities = dashboardData.recentActivities || [];
    const deadlines = dashboardData.upcomingDeadlines || [];

    // KPI Cards
    const kpiCardsHTML = `
      <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-4" style="margin-bottom: var(--spacing-6);">
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📊</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${kpis.totalOpportunities}</h3>
            <p style="color: var(--text-secondary); margin: 0;">Total Opportunities</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">🏗️</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${kpis.activeProjects}</h3>
            <p style="color: var(--text-secondary); margin: 0;">Active Projects</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📝</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${kpis.pendingProposals}</h3>
            <p style="color: var(--text-secondary); margin: 0;">Pending Proposals</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">💰</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${formatCurrency(kpis.revenuePipeline / 1000000)}M</h3>
            <p style="color: var(--text-secondary); margin: 0;">Revenue Pipeline</p>
          </div>
        </div>
      </div>
    `;

    // Charts (simple bar representation)
    const chartsHTML = `
      <div class="grid grid-cols-1 grid-cols-md-2 gap-6" style="margin-bottom: var(--spacing-6);">
        <div class="card">
          <div class="card-body">
            <h3 style="margin-bottom: var(--spacing-4);">Model Usage Distribution</h3>
            <div style="display: flex; flex-direction: column; gap: var(--spacing-2);">
              ${charts.modelUsage.labels.map((label, index) => {
                const value = charts.modelUsage.values[index];
                const percentage = (value / charts.modelUsage.values.reduce((a, b) => a + b, 0)) * 100;
                return `
                  <div>
                    <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                      <span style="font-size: 0.9rem;">${label}</span>
                      <span style="font-weight: 600;">${value}%</span>
                    </div>
                    <div style="background: var(--bg-secondary); border-radius: var(--radius); height: 8px; overflow: hidden;">
                      <div style="background: var(--color-primary); height: 100%; width: ${percentage}%;"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <h3 style="margin-bottom: var(--spacing-4);">Revenue Trend (Last 7 Months)</h3>
            <div style="display: flex; align-items: end; gap: var(--spacing-2); height: 200px;">
              ${charts.revenueTrend.values.map((value, index) => {
                const maxValue = Math.max(...charts.revenueTrend.values);
                const height = (value / maxValue) * 100;
                return `
                  <div style="flex: 1; display: flex; flex-direction: column; align-items: center;">
                    <div style="background: var(--color-primary); width: 100%; height: ${height}%; border-radius: var(--radius) var(--radius) 0 0; margin-bottom: var(--spacing-2);"></div>
                    <span style="font-size: 0.75rem; color: var(--text-secondary); writing-mode: vertical-rl; text-orientation: mixed;">${charts.revenueTrend.labels[index]}</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    // Recent Activities
    const activitiesHTML = activities.slice(0, 10).map(act => `
      <tr>
        <td style="font-size: 1.5rem;">${act.icon || '📌'}</td>
        <td>
          <div style="font-weight: 600;">${act.user}</div>
          <div style="font-size: 0.85rem; color: var(--text-secondary);">${act.action} - ${act.entity}</div>
        </td>
        <td style="color: var(--text-secondary); font-size: 0.9rem;">${formatDate(act.timestamp)}</td>
        <td><button class="btn btn-sm btn-outline">View</button></td>
      </tr>
    `).join('');

    // Upcoming Deadlines
    const deadlinesHTML = deadlines.slice(0, 5).map(deadline => {
      const daysRemaining = deadline.daysRemaining;
      const priorityColor = deadline.priority === 'high' ? '#ef4444' : deadline.priority === 'medium' ? '#f59e0b' : '#10b981';
      
      return `
        <div class="card" style="margin-bottom: var(--spacing-2); border-left: 4px solid ${priorityColor};">
          <div class="card-body" style="padding: var(--spacing-3);">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div>
                <h5 style="margin: 0 0 var(--spacing-1) 0; font-size: 0.95rem;">${deadline.title}</h5>
                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${formatDate(deadline.deadline)}</p>
              </div>
              <span style="background: ${priorityColor}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 0.85rem; font-weight: 600;">${daysRemaining} days</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <h1 style="margin-bottom: var(--spacing-6);">Admin Dashboard</h1>
        
        ${kpiCardsHTML}
        
        ${chartsHTML}
        
        <div class="grid grid-cols-1 grid-cols-md-2 gap-6" style="margin-bottom: var(--spacing-6);">
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Recent Activities</h3>
              <div style="max-height: 400px; overflow-y: auto;">
                <table class="table" style="width: 100%;">
                  <thead>
                    <tr>
                      <th style="width: 40px;"></th>
                      <th>Activity</th>
                      <th>Date</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activitiesHTML}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Upcoming Deadlines</h3>
              ${deadlinesHTML}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Admin Tables Rendering
  // ============================================

  /**
   * Render Admin Tables (Opportunities, Proposals, Projects, Users)
   */
  function renderAdminTables(section) {
    const container = document.getElementById('adminTables');
    if (!container || typeof adminData === 'undefined') return;

    let tableHTML = '';

    if (section === 'opportunities') {
      const opportunities = adminData.opportunities || [];
      const rowsHTML = opportunities.map(opp => {
        const budgetText = opp.budget ? `${formatCurrency(opp.budget.min, opp.budget.currency)} - ${formatCurrency(opp.budget.max, opp.budget.currency)}` : 'N/A';
        return `
          <tr>
            <td><strong>${opp.id}</strong></td>
            <td>${opp.title}</td>
            <td>${opp.type}</td>
            <td>${getStatusBadge(opp.status)}</td>
            <td>${opp.createdBy}</td>
            <td>${formatDate(opp.createdAt)}</td>
            <td>${budgetText}</td>
            <td>${opp.applicants || 0}</td>
            <td>
              <button class="btn btn-sm btn-outline">View</button>
              <button class="btn btn-sm" style="background: #ef4444; color: white;">Close</button>
            </td>
          </tr>
        `;
      }).join('');

      tableHTML = `
        <div class="card">
          <div class="card-body" style="padding: 0;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Created Date</th>
                  <th>Budget</th>
                  <th>Applicants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (section === 'users') {
      const users = adminData.users || [];
      const rowsHTML = users.map(user => `
        <tr>
          <td><strong>${user.id}</strong></td>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td><span class="badge">${user.userType || user.role}</span></td>
          <td>${getStatusBadge(user.status)}</td>
          <td>${formatDate(user.registeredAt)}</td>
          <td>${user.profileCompletion}%</td>
          <td>${getStatusBadge(user.verificationStatus)}</td>
          <td>
            <button class="btn btn-sm btn-outline">View</button>
            ${user.status === 'pending' ? `<button class="btn btn-sm btn-primary">Approve</button>` : ''}
          </td>
        </tr>
      `).join('');

      tableHTML = `
        <div class="card">
          <div class="card-body" style="padding: 0;">
            <table class="table" style="width: 100%;">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Profile</th>
                  <th>Verification</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHTML}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <h1 style="margin-bottom: var(--spacing-6);">${section.charAt(0).toUpperCase() + section.slice(1)} Management</h1>
        ${tableHTML}
      </div>
    `;
  }

  // ============================================
  // User Dashboard Rendering
  // ============================================

  /**
   * Render User Dashboard
   */
  function renderUserDashboard() {
    const container = document.getElementById('userDashboard');
    if (!container || typeof dashboardData === 'undefined') return;

    const userKpis = dashboardData.userDashboard;
    const activities = dashboardData.recentActivities || [];

    const kpiCardsHTML = `
      <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-4" style="margin-bottom: var(--spacing-6);">
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📋</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${userKpis.myOpportunities}</h3>
            <p style="color: var(--text-secondary); margin: 0;">My Opportunities</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">📝</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${userKpis.myProposals}</h3>
            <p style="color: var(--text-secondary); margin: 0;">My Proposals</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">🔗</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${userKpis.activeMatches}</h3>
            <p style="color: var(--text-secondary); margin: 0;">Active Matches</p>
          </div>
        </div>
        <div class="card">
          <div class="card-body">
            <div style="font-size: 2rem; margin-bottom: var(--spacing-2);">✅</div>
            <h3 style="font-size: 2rem; margin-bottom: var(--spacing-1);">${userKpis.completedProjects}</h3>
            <p style="color: var(--text-secondary); margin: 0;">Completed Projects</p>
          </div>
        </div>
      </div>
    `;

    const activitiesHTML = activities.slice(0, 8).map(act => `
      <div class="card" style="margin-bottom: var(--spacing-2);">
        <div class="card-body" style="padding: var(--spacing-3);">
          <div style="display: flex; align-items: start; gap: var(--spacing-3);">
            <div style="font-size: 1.5rem;">${act.icon || '📌'}</div>
            <div style="flex: 1;">
              <div style="font-weight: 600; margin-bottom: var(--spacing-1);">${act.action} - ${act.entity}</div>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">${formatDate(act.timestamp)}</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <h1 style="margin-bottom: var(--spacing-6);">My Dashboard</h1>
        
        ${kpiCardsHTML}
        
        <div class="grid grid-cols-1 grid-cols-md-2 gap-6">
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Recent Activity</h3>
              <div style="max-height: 400px; overflow-y: auto;">
                ${activitiesHTML}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom: var(--spacing-4);">Quick Stats</h3>
              <div style="display: flex; flex-direction: column; gap: var(--spacing-3);">
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                    <span>Profile Views</span>
                    <strong>${userKpis.profileViews}</strong>
                  </div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                    <span>Endorsements</span>
                    <strong>${userKpis.endorsementCount}</strong>
                  </div>
                </div>
                <div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: var(--spacing-1);">
                    <span>Pending Reviews</span>
                    <strong>${userKpis.pendingReviews}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Public API
  // ============================================

  window.Renderer = {
    renderModels,
    showModelDetails,
    renderOpportunities,
    renderProposals,
    renderServicePipeline,
    renderProjects,
    renderAdminDashboard,
    renderAdminTables,
    renderUserDashboard
  };

})();

