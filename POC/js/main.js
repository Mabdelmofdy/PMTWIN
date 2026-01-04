/**
 * PMTwin Landing Page Renderer
 * Dynamically renders all sections from siteData.json
 */

(function() {
  'use strict';

  // Wait for DOM and siteData to be available
  function initLandingPage() {
    // Check if siteData is available
    if (typeof siteData === 'undefined') {
      // Wait for data to be loaded via event
      window.addEventListener('pmtwinDataLoaded', function() {
        if (typeof siteData !== 'undefined') {
          renderAllSections();
        }
      }, { once: true });
      
      // Also try after a short delay as fallback
      setTimeout(() => {
        if (typeof siteData !== 'undefined') {
          renderAllSections();
        }
      }, 500);
      return;
    }

    renderAllSections();
  }

  function renderAllSections() {
    if (typeof siteData === 'undefined') {
      console.warn('siteData is not available yet');
      return;
    }

    // Render all sections
    renderHero(siteData.hero);
    renderAbout(siteData.about);
    renderServices(siteData.services);
    renderPortfolio(siteData.portfolio);
    renderTestimonials(siteData.testimonials);
    renderTeam(siteData.team);
    renderContact(siteData.contact);
    renderFooter(siteData.footer);
  }

  /**
   * Render Hero Section
   */
  function renderHero(data) {
    const container = document.getElementById('hero');
    if (!container || !data) return;

    // Set background image on container if provided
    if (data.backgroundImage) {
      container.style.backgroundImage = `url('${data.backgroundImage}')`;
      container.style.backgroundSize = 'cover';
      container.style.backgroundPosition = 'center';
      container.style.position = 'relative';
      // Add overlay for better text readability
      container.style.setProperty('--overlay', 'rgba(0,0,0,0.4)');
    }

    container.innerHTML = `
      <div class="container" style="position: relative; z-index: 2;">
        <h1 class="hero-title">${data.title || ''}</h1>
        <p class="hero-subtitle">${data.subtitle || ''}</p>
        <div class="hero-cta">
          <a href="${data.ctaLink || '#'}" class="btn btn-primary btn-lg">${data.ctaText || 'Get Started'}</a>
          <a href="${data.secondaryCtaLink || '#'}" class="btn btn-outline btn-lg" style="background: rgba(255,255,255,0.2); border-color: white; color: white;">${data.secondaryCtaText || 'Explore'}</a>
        </div>
      </div>
      ${data.backgroundImage ? `<div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); z-index: 1;"></div>` : ''}
    `;
  }

  /**
   * Render About Section
   */
  function renderAbout(data) {
    const container = document.getElementById('about');
    if (!container || !data) return;

    const featuresHTML = data.features ? data.features.map(feature => `
      <div class="card" style="height: 100%;">
        <div class="card-body">
          <h3 class="card-title">${feature.title || ''}</h3>
          <p class="card-text">${feature.description || ''}</p>
        </div>
      </div>
    `).join('') : '';

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-8); align-items: center; margin-bottom: var(--spacing-12);">
          <div>
            <h2 style="margin-bottom: var(--spacing-4); font-size: 2.5rem;">${data.heading || ''}</h2>
            <p style="font-size: 1.1rem; line-height: 1.8; color: var(--text-secondary);">${data.description || ''}</p>
          </div>
          ${data.image ? `<div><img src="${data.image}" alt="${data.heading || 'About PMTwin'}" style="width: 100%; border-radius: var(--radius-lg); box-shadow: 0 4px 6px rgba(0,0,0,0.1);"></div>` : ''}
        </div>
        <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-6">
          ${featuresHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render Services Section
   */
  function renderServices(data) {
    const container = document.getElementById('services');
    if (!container || !data || !Array.isArray(data)) return;

    const servicesHTML = data.map((service, index) => `
      <div class="card" style="text-align: center; height: 100%; transition: transform 0.3s ease;">
        <div class="card-body">
          ${service.icon ? `<img src="${service.icon}" alt="${service.title || ''}" style="width: 80px; height: 80px; margin: 0 auto var(--spacing-4); border-radius: var(--radius);">` : ''}
          <h3 class="card-title">${service.title || ''}</h3>
          <p class="card-text">${service.description || ''}</p>
          <button onclick="showServiceDetails(${index})" class="btn btn-outline" style="margin-top: var(--spacing-4);">Learn More</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding); background: var(--bg-secondary);">
        <h2 style="text-align: center; margin-bottom: var(--spacing-8); font-size: 2.5rem;">Our Services</h2>
        <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
          ${servicesHTML}
        </div>
      </div>
    `;
    
    // Store services data globally for modal access
    window.servicesData = data;
  }

  /**
   * Show Service Details Modal
   */
  function showServiceDetails(serviceIndex) {
    if (!window.servicesData || !window.servicesData[serviceIndex]) {
      console.error('Service data not available');
      return;
    }

    const service = window.servicesData[serviceIndex];
    const details = service.details || {};

    // Remove existing modal if present
    const existingModal = document.querySelector('.service-details-modal-backdrop');
    if (existingModal) {
      existingModal.remove();
    }

    // Create modal backdrop
    const modalBackdrop = document.createElement('div');
    modalBackdrop.className = 'modal-backdrop show service-details-modal-backdrop';
    modalBackdrop.onclick = function(e) {
      if (e.target === modalBackdrop) {
        modalBackdrop.remove();
      }
    };

    // Build features HTML
    const featuresHTML = details.features && details.features.length > 0 ? `
      <div style="margin-top: var(--spacing-6);">
        <h4 style="margin-bottom: var(--spacing-3); color: var(--color-primary);">
          <i class="ph ph-check-circle"></i> Key Features
        </h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${details.features.map(feature => `
            <li style="padding: var(--spacing-2) 0; padding-left: var(--spacing-5); position: relative;">
              <i class="ph ph-check" style="position: absolute; left: 0; color: var(--color-success);"></i>
              ${feature}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';

    // Build benefits HTML
    const benefitsHTML = details.benefits && details.benefits.length > 0 ? `
      <div style="margin-top: var(--spacing-6);">
        <h4 style="margin-bottom: var(--spacing-3); color: var(--color-success);">
          <i class="ph ph-star"></i> Benefits
        </h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${details.benefits.map(benefit => `
            <li style="padding: var(--spacing-2) 0; padding-left: var(--spacing-5); position: relative;">
              <i class="ph ph-arrow-right" style="position: absolute; left: 0; color: var(--color-success);"></i>
              ${benefit}
            </li>
          `).join('')}
        </ul>
      </div>
    ` : '';

    // Build use cases HTML
    const useCasesHTML = details.useCases && details.useCases.length > 0 ? `
      <div style="margin-top: var(--spacing-6);">
        <h4 style="margin-bottom: var(--spacing-3); color: var(--color-info);">
          <i class="ph ph-lightbulb"></i> Use Cases
        </h4>
        <div style="display: grid; gap: var(--spacing-3);">
          ${details.useCases.map(useCase => `
            <div style="padding: var(--spacing-3); background: var(--bg-secondary); border-radius: var(--radius); border-left: 3px solid var(--color-info);">
              <p style="margin: 0;">${useCase}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : '';

    // Create modal content
    modalBackdrop.innerHTML = `
      <div class="modal show" style="max-width: 800px; max-height: 90vh; overflow-y: auto;" onclick="event.stopPropagation()">
        <div class="modal-header" style="display: flex; align-items: center; gap: var(--spacing-4);">
          ${service.icon ? `<img src="${service.icon}" alt="${service.title || ''}" style="width: 60px; height: 60px; border-radius: var(--radius);">` : ''}
          <h2 class="modal-title" style="flex: 1; margin: 0;">${service.title || 'Service Details'}</h2>
          <button class="modal-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: var(--text-secondary);">&times;</button>
        </div>
        <div class="modal-body" style="padding: var(--spacing-6);">
          ${details.overview ? `
            <div style="margin-bottom: var(--spacing-6);">
              <h3 style="margin-bottom: var(--spacing-3);">Overview</h3>
              <p style="line-height: 1.8; color: var(--text-secondary); font-size: 1.05rem;">${details.overview}</p>
            </div>
          ` : ''}
          
          ${featuresHTML}
          ${benefitsHTML}
          ${useCasesHTML}
          
          ${!details.overview && !details.features && !details.benefits && !details.useCases ? `
            <p style="color: var(--text-secondary);">${service.description || 'No additional details available.'}</p>
          ` : ''}
        </div>
        <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center; padding: var(--spacing-4) var(--spacing-6); border-top: 1px solid var(--border-color);">
          <button class="btn btn-outline">Close</button>
          ${service.link ? `<a href="${service.link}" class="btn btn-primary">Get Started</a>` : ''}
        </div>
      </div>
    `;

    document.body.appendChild(modalBackdrop);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    // Function to close modal and restore scrolling
    const closeModal = () => {
      if (modalBackdrop && modalBackdrop.parentNode) {
        modalBackdrop.remove();
      }
      // Restore body scroll
      document.body.style.overflow = '';
    };
    
    // Set up close button handlers after modal is added to DOM
    setTimeout(() => {
      // Close button (X)
      const closeBtn = modalBackdrop.querySelector('.modal-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        });
      }
      
      // Close button in footer
      const footerCloseBtn = modalBackdrop.querySelector('.modal-footer .btn-outline');
      if (footerCloseBtn) {
        footerCloseBtn.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          closeModal();
        });
      }
      
      // Get Started button (if exists)
      const getStartedBtn = modalBackdrop.querySelector('.modal-footer .btn-primary');
      if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
          // Allow navigation but close modal first
          closeModal();
          // Navigation will proceed normally
        });
      }
    }, 0);
    
    // Close when clicking outside modal
    modalBackdrop.addEventListener('click', function(e) {
      if (e.target === modalBackdrop) {
        closeModal();
      }
    });
    
    // Close on escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleEscape);
      }
    };
    document.addEventListener('keydown', handleEscape);
  }

  // Export function globally
  window.showServiceDetails = showServiceDetails;

  /**
   * Render Portfolio Section
   */
  function renderPortfolio(data) {
    const container = document.getElementById('portfolio');
    if (!container || !data || !Array.isArray(data)) return;

    const portfolioHTML = data.map(item => `
      <div class="card project-card" style="position: relative; overflow: hidden;">
        ${item.image ? `<img src="${item.image}" alt="${item.title || ''}" style="width: 100%; height: 200px; object-fit: cover;">` : ''}
        <div class="card-body">
          <span class="badge badge-primary" style="margin-bottom: var(--spacing-2);">${item.category || ''}</span>
          <h3 class="card-title">${item.title || ''}</h3>
          <p class="card-text">${item.description || ''}</p>
          ${item.link ? `<a href="${item.link}" class="btn btn-outline" style="margin-top: var(--spacing-4);">View Details</a>` : ''}
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding);">
        <h2 style="text-align: center; margin-bottom: var(--spacing-8); font-size: 2.5rem;">Featured Projects</h2>
        <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-3 gap-6">
          ${portfolioHTML}
        </div>
        <div style="text-align: center; margin-top: var(--spacing-8);">
          <a href="../discovery/" class="btn btn-primary btn-lg">View All Projects</a>
        </div>
      </div>
    `;
  }

  /**
   * Render Testimonials Section
   */
  function renderTestimonials(data) {
    const container = document.getElementById('testimonials');
    if (!container || !data || !Array.isArray(data)) return;

    const testimonialsHTML = data.map(testimonial => `
      <div class="card" style="height: 100%;">
        <div class="card-body">
          <div style="display: flex; align-items: center; margin-bottom: var(--spacing-4);">
            ${testimonial.avatar ? `<img src="${testimonial.avatar}" alt="${testimonial.name || ''}" style="width: 60px; height: 60px; border-radius: 50%; margin-right: var(--spacing-3); object-fit: cover;">` : ''}
            <div>
              <h4 style="margin: 0; font-size: 1.1rem;">${testimonial.name || ''}</h4>
              <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${testimonial.role || ''}${testimonial.company ? `, ${testimonial.company}` : ''}</p>
            </div>
          </div>
          <blockquote style="margin: 0; font-style: italic; color: var(--text-secondary); line-height: 1.6;">
            "${testimonial.comment || ''}"
          </blockquote>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding); background: var(--bg-secondary);">
        <h2 style="text-align: center; margin-bottom: var(--spacing-8); font-size: 2.5rem;">What Our Partners Say</h2>
        <div class="grid grid-cols-1 grid-cols-md-2 gap-6">
          ${testimonialsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render Team Section
   */
  function renderTeam(data) {
    const container = document.getElementById('team');
    if (!container || !data || !Array.isArray(data)) return;

    const teamHTML = data.map(member => {
      const socialLinksHTML = member.socialLinks ? Object.entries(member.socialLinks).map(([platform, url]) => `
        <a href="${url}" target="_blank" rel="noopener noreferrer" style="margin: 0 var(--spacing-2); color: var(--color-primary); text-decoration: none;" aria-label="${platform}">
          ${platform === 'linkedin' ? 'LinkedIn' : platform === 'twitter' ? 'Twitter' : platform === 'github' ? 'GitHub' : platform}
        </a>
      `).join('') : '';

      return `
        <div class="card" style="text-align: center; height: 100%;">
          <div class="card-body">
            ${member.photo ? `<img src="${member.photo}" alt="${member.name || ''}" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; margin: 0 auto var(--spacing-4); border: 4px solid var(--color-primary);">` : ''}
            <h3 class="card-title">${member.name || ''}</h3>
            <p style="color: var(--color-primary); font-weight: 600; margin-bottom: var(--spacing-2);">${member.position || ''}</p>
            <p class="card-text" style="font-size: 0.9rem;">${member.bio || ''}</p>
            ${socialLinksHTML ? `<div style="margin-top: var(--spacing-4);">${socialLinksHTML}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding);">
        <h2 style="text-align: center; margin-bottom: var(--spacing-8); font-size: 2.5rem;">Our Team</h2>
        <div class="grid grid-cols-1 grid-cols-md-2 grid-cols-lg-4 gap-6">
          ${teamHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render Contact Section
   */
  function renderContact(data) {
    const container = document.getElementById('contact');
    if (!container || !data) return;

    const socialLinksHTML = data.socialLinks ? Object.entries(data.socialLinks).map(([platform, url]) => `
      <a href="${url}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="margin: var(--spacing-2);">
        ${platform.charAt(0).toUpperCase() + platform.slice(1)}
      </a>
    `).join('') : '';

    container.innerHTML = `
      <div class="container" style="padding: var(--spacing-16) var(--container-padding); background: var(--bg-secondary);">
        <h2 style="text-align: center; margin-bottom: var(--spacing-8); font-size: 2.5rem;">Get in Touch</h2>
        <div style="max-width: 800px; margin: 0 auto;">
          <div class="grid grid-cols-1 grid-cols-md-3 gap-6" style="margin-bottom: var(--spacing-8);">
            ${data.address ? `
              <div class="card" style="text-align: center;">
                <div class="card-body">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-3);"><i class="ph ph-map-pin"></i></div>
                  <h4>Address</h4>
                  <p style="color: var(--text-secondary);">${data.address.full || data.address.street || ''}</p>
                  ${data.address.city ? `<p style="color: var(--text-secondary);">${data.address.city}${data.address.country ? `, ${data.address.country}` : ''}</p>` : ''}
                </div>
              </div>
            ` : ''}
            ${data.phone ? `
              <div class="card" style="text-align: center;">
                <div class="card-body">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-3);">📞</div>
                  <h4>Phone</h4>
                  <p style="color: var(--text-secondary);"><a href="tel:${data.phone.replace(/\s/g, '')}" style="color: var(--color-primary); text-decoration: none;">${data.phone}</a></p>
                </div>
              </div>
            ` : ''}
            ${data.email ? `
              <div class="card" style="text-align: center;">
                <div class="card-body">
                  <div style="font-size: 2rem; margin-bottom: var(--spacing-3);">✉️</div>
                  <h4>Email</h4>
                  <p style="color: var(--text-secondary);"><a href="mailto:${data.email}" style="color: var(--color-primary); text-decoration: none;">${data.email}</a></p>
                </div>
              </div>
            ` : ''}
          </div>
          ${socialLinksHTML ? `
            <div style="text-align: center;">
              <h3 style="margin-bottom: var(--spacing-4);">Follow Us</h3>
              <div>
                ${socialLinksHTML}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Render Footer Section
   */
  function renderFooter(data) {
    const container = document.getElementById('footer');
    if (!container || !data) return;

    const linksHTML = data.links ? data.links.map(category => `
      <div>
        <h4 style="margin-bottom: var(--spacing-3); color: var(--text-inverse);">${category.category || ''}</h4>
        <ul style="list-style: none; padding: 0; margin: 0;">
          ${category.items ? category.items.map(item => `
            <li style="margin-bottom: var(--spacing-2);">
              <a href="${item.url || '#'}" style="color: rgba(255,255,255,0.8); text-decoration: none; transition: color 0.3s ease;">${item.text || ''}</a>
            </li>
          `).join('') : ''}
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

  // Initialize when DOM is ready and data is loaded
  function initialize() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        // Wait a bit for data-loader to finish
        setTimeout(initLandingPage, 100);
      });
    } else {
      // DOM already ready, wait a bit for data-loader
      setTimeout(initLandingPage, 100);
    }
  }

  // Also listen for data loaded event
  window.addEventListener('pmtwinDataLoaded', function() {
    if (document.readyState !== 'loading') {
      initLandingPage();
    }
  });

  // Start initialization
  initialize();

})();

