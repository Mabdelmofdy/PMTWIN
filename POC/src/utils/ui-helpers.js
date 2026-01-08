/**
 * UI Helpers
 * Provides utilities for loading states, empty states, and accessibility
 */

(function() {
  'use strict';

  /**
   * Show loading state
   */
  function showLoading(container, message = 'Loading...') {
    if (!container) return;
    
    container.innerHTML = `
      <div class="loading" role="status" aria-live="polite" aria-busy="true">
        <div class="loading-spinner" aria-hidden="true"></div>
        <span class="loading-text">${message}</span>
      </div>
    `;
  }

  /**
   * Show empty state
   */
  function showEmptyState(container, options = {}) {
    if (!container) return;
    
    const {
      icon = 'ph-folder-open',
      title = 'No items found',
      message = 'There are no items to display at this time.',
      actionLabel = null,
      actionCallback = null
    } = options;
    
    let actionHtml = '';
    if (actionLabel && actionCallback) {
      actionHtml = `
        <div class="empty-state-action">
          <button class="btn btn-primary" onclick="${actionCallback}">
            ${actionLabel}
          </button>
        </div>
      `;
    }
    
    container.innerHTML = `
      <div class="empty-state" role="status" aria-live="polite">
        <div class="empty-state-icon">
          <i class="ph ${icon}" aria-hidden="true"></i>
        </div>
        <h3 class="empty-state-title">${title}</h3>
        <p class="empty-state-text">${message}</p>
        ${actionHtml}
      </div>
    `;
  }

  /**
   * Show skeleton loading
   */
  function showSkeleton(container, count = 3) {
    if (!container) return;
    
    let html = '<div style="display: grid; gap: 1rem;">';
    for (let i = 0; i < count; i++) {
      html += `
        <div class="skeleton-card">
          <div class="skeleton-title loading-skeleton"></div>
          <div class="skeleton-text loading-skeleton"></div>
          <div class="skeleton-text loading-skeleton"></div>
          <div class="skeleton-text loading-skeleton" style="width: 60%;"></div>
        </div>
      `;
    }
    html += '</div>';
    container.innerHTML = html;
  }

  /**
   * Add skip to main content link
   */
  function addSkipToMain() {
    if (document.getElementById('skip-to-main')) return;
    
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.className = 'skip-to-main';
    skipLink.textContent = 'Skip to main content';
    skipLink.id = 'skip-to-main';
    skipLink.setAttribute('aria-label', 'Skip to main content');
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Add id to main if it doesn't exist
    const main = document.querySelector('main');
    if (main && !main.id) {
      main.id = 'main-content';
      main.setAttribute('tabindex', '-1');
    }
  }

  /**
   * Trap focus within a modal
   */
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    function handleTab(e) {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
    
    element.addEventListener('keydown', handleTab);
    firstElement?.focus();
    
    return () => {
      element.removeEventListener('keydown', handleTab);
    };
  }

  /**
   * Announce to screen readers
   */
  function announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Initialize accessibility features
   */
  function initAccessibility() {
    // Add skip to main content
    addSkipToMain();
    
    // Add keyboard navigation class to body
    document.body.classList.add('keyboard-nav');
    
    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
      // Tab key indicates keyboard navigation
      if (e.key === 'Tab') {
        document.body.classList.add('keyboard-nav');
      }
    });
    
    // Remove keyboard nav class on mouse use
    document.addEventListener('mousedown', function() {
      document.body.classList.remove('keyboard-nav');
    });
  }

  /**
   * Make table responsive with data labels
   */
  function makeTableResponsive(table) {
    if (!table || window.innerWidth > 768) return;
    
    const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      cells.forEach((cell, index) => {
        if (headers[index]) {
          cell.setAttribute('data-label', headers[index]);
        }
      });
    });
  }

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccessibility);
  } else {
    initAccessibility();
  }

  // Export
  window.UIHelpers = {
    showLoading,
    showEmptyState,
    showSkeleton,
    addSkipToMain,
    trapFocus,
    announce,
    initAccessibility,
    makeTableResponsive
  };

})();

