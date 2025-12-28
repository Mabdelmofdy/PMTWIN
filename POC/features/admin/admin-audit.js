/**
 * Admin Audit Component - HTML triggers for AdminService.getAuditTrail
 */

(function() {
  'use strict';

  let currentFilters = {};

  function init(params) {
    loadAuditLogs();
  }

  // ============================================
  // HTML Triggers for AdminService Functions
  // ============================================

  // Trigger: getAuditTrail(filters) - Load audit logs
  async function loadAuditLogs() {
    const container = document.getElementById('auditLogsList');
    if (!container) return;

    try {
      container.innerHTML = '<p>Loading audit logs...</p>';

      let result;
      if (typeof AdminService !== 'undefined') {
        result = await AdminService.getAuditTrail(currentFilters);
      } else {
        container.innerHTML = '<p class="alert alert-error">Admin service not available</p>';
        return;
      }

      if (result.success && result.logs) {
        renderAuditLogs(container, result.logs);
      } else {
        container.innerHTML = `<p class="alert alert-error">${result.error || 'Failed to load audit logs'}</p>`;
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading audit logs. Please try again.</p>';
    }
  }

  // Trigger: getAuditTrail(filters) - Apply filters
  async function applyFilters(event) {
    event.preventDefault();
    
    const filters = {};
    
    const action = document.getElementById('auditActionFilter')?.value;
    if (action) filters.action = action;
    
    const userId = document.getElementById('auditUserIdFilter')?.value;
    if (userId) filters.userId = userId;
    
    const entityType = document.getElementById('auditEntityTypeFilter')?.value;
    if (entityType) filters.entityType = entityType;
    
    const limit = document.getElementById('auditLimitFilter')?.value;
    if (limit) filters.limit = parseInt(limit);
    
    currentFilters = filters;
    await loadAuditLogs();
  }

  function clearFilters() {
    currentFilters = {};
    document.getElementById('auditFiltersForm')?.reset();
    document.getElementById('auditLimitFilter').value = 100;
    loadAuditLogs();
  }

  function exportAuditLogs() {
    // Get current logs and export as JSON
    if (typeof PMTwinData === 'undefined' || !PMTwinData.Audit) {
      alert('Audit data not available');
      return;
    }

    const logs = PMTwinData.Audit.getAll();
    const dataStr = JSON.stringify(logs, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ============================================
  // Rendering Functions
  // ============================================

  function renderAuditLogs(container, logs) {
    if (logs.length === 0) {
      container.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center; padding: 3rem;">
            <p>No audit logs found.</p>
          </div>
        </div>
      `;
      return;
    }

    let html = '<div style="display: grid; gap: 1rem;">';
    
    logs.forEach(log => {
      html += `
        <div class="card">
          <div class="card-body">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
              <div>
                <strong>${log.action || 'Unknown Action'}</strong>
                <span class="badge badge-secondary" style="margin-left: 0.5rem;">${log.actionCategory || 'N/A'}</span>
              </div>
              <span style="color: var(--text-secondary); font-size: 0.9rem;">
                ${new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            
            <p style="margin: 0.5rem 0;"><strong>User:</strong> ${log.userName || log.userEmail || 'System'}</p>
            <p style="margin: 0.5rem 0;"><strong>Description:</strong> ${log.description || 'N/A'}</p>
            ${log.entityType ? `<p style="margin: 0.5rem 0;"><strong>Entity:</strong> ${log.entityType} (${log.entityId || 'N/A'})</p>` : ''}
            
            ${log.changes ? `
              <details style="margin-top: 0.5rem;">
                <summary style="cursor: pointer; color: var(--primary);">View Changes</summary>
                <pre style="background: var(--bg-secondary); padding: 1rem; margin-top: 0.5rem; border-radius: 4px; overflow-x: auto; font-size: 0.85rem;">${JSON.stringify(log.changes, null, 2)}</pre>
              </details>
            ` : ''}
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  // Export
  if (!window.admin) window.admin = {};
  window.admin['admin-audit'] = {
    init,
    loadAuditLogs,
    applyFilters,
    clearFilters,
    exportAuditLogs
  };

  // Global reference for onclick handlers
  window.adminAuditComponent = window.admin['admin-audit'];

})();

