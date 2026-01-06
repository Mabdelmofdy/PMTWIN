/**
 * Footer Component
 * Renders footer on public portal pages
 */

(function() {
  'use strict';

  /**
   * Render Footer
   * @param {Object} data - Footer data from siteData
   */
  function renderFooter(data) {
    const container = document.getElementById('publicFooter');
    if (!container || !data) return;

    // Determine base path for relative URLs
    const currentPath = window.location.pathname;
    const depth = (currentPath.match(/\//g) || []).length - 1; // Subtract 1 for root
    const basePath = depth > 1 ? '../' : './';

    const linksHTML = data.links ? data.links.map(category => `
      <div>
        <h4 style="margin-bottom: var(--spacing-3); color: var(--text-inverse);">${category.category || ''}</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${category.items ? category.items.map(item => {
            // Convert relative URLs to proper paths
            let url = item.url || '#';
            if (url.startsWith('../')) {
              // Already relative, use as is
            } else if (url.startsWith('./')) {
              url = basePath + url.substring(2);
            } else if (!url.startsWith('http') && !url.startsWith('#') && !url.startsWith('/')) {
              url = basePath + url;
            }
            return `
            <li style="margin-bottom: var(--spacing-2);">
              <a href="${url}" style="color: rgba(255,255,255,0.8); text-decoration: none; transition: color 0.3s ease;" onmouseover="this.style.color='var(--text-inverse)'" onmouseout="this.style.color='rgba(255,255,255,0.8)'">${item.text || ''}</a>
            </li>
          `;
          }).join('') : ''}
        </ul>
      </div>
    `).join('') : '';

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-8) var(--container-padding);">
        <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-6" style="margin-bottom: var(--spacing-6);">
          ${linksHTML}
        </div>
        <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: var(--spacing-6); text-align: center;">
          <p style="color: rgba(255,255,255,0.8); margin-bottom: var(--spacing-2);">${data.copyright || ''}</p>
          ${data.additionalInfo ? `<p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">${data.additionalInfo}</p>` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Initialize Footer
   */
  function initFooter() {
    // Wait for siteData to be available
    if (typeof siteData !== 'undefined' && siteData.footer) {
      renderFooter(siteData.footer);
    } else {
      // Wait for data to be loaded
      window.addEventListener('pmtwinDataLoaded', function() {
        if (typeof siteData !== 'undefined' && siteData.footer) {
          renderFooter(siteData.footer);
        }
      }, { once: true });
      
      // Fallback: try after a short delay
      setTimeout(() => {
        if (typeof siteData !== 'undefined' && siteData.footer) {
          renderFooter(siteData.footer);
        }
      }, 500);
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFooter);
  } else {
    initFooter();
  }

  // Export for manual initialization if needed
  window.PublicFooter = {
    render: renderFooter,
    init: initFooter
  };

})();

