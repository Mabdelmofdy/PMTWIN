/**
 * Service Request View Feature
 * Displays service request details and offers
 */

(function() {
  'use strict';

  const ServiceRequestView = {
    async init() {
      // Get request ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const requestId = urlParams.get('id');

      if (!requestId) {
        document.getElementById('serviceRequestViewContent').innerHTML = 
          '<div class="alert alert-error">Service request ID is required.</div>';
        return;
      }

      await this.loadRequest(requestId);
    },

    async loadRequest(requestId) {
      const contentEl = document.getElementById('serviceRequestViewContent');
      if (!contentEl) return;

      let request = null;
      if (typeof ServiceRequestService !== 'undefined') {
        request = ServiceRequestService.getServiceRequest(requestId);
      }

      if (!request) {
        contentEl.innerHTML = '<div class="alert alert-error">Service request not found.</div>';
        return;
      }

      // Get offers
      let offers = [];
      if (typeof ServiceOfferService !== 'undefined') {
        offers = ServiceOfferService.getOffersForRequest(requestId);
      }

      this.renderRequest(request, offers);
    },

    renderRequest(request, offers) {
      const contentEl = document.getElementById('serviceRequestViewContent');
      if (!contentEl) return;

      const currentUser = PMTwinData?.Sessions?.getCurrentUser();
      const isRequester = currentUser && currentUser.id === request.requesterId;
      const isServiceProvider = currentUser && currentUser.role === 'skill_service_provider';
      
      // Check if user can bid (Entity/Vendor but not requester)
      const canBid = currentUser && !isRequester && !isServiceProvider && 
                     typeof TrackGuards !== 'undefined' && TrackGuards.requireEntityOrVendor();
      
      // Get bids (stored in request.bids or separate data structure)
      const bids = request.bids || [];

      const statusClass = {
        'OPEN': 'status-open',
        'OFFERED': 'status-offered',
        'APPROVED': 'status-approved',
        'IN_PROGRESS': 'status-progress',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
      }[request.status] || '';

      let offersHtml = '';
      if (isRequester && offers.length > 0) {
        offersHtml = `
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; font-size: 1.25rem;">
                <i class="ph ph-handshake"></i> Service Offers (${offers.length})
              </h3>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <div style="display: grid; gap: 1.5rem;">
                ${offers.map(offer => {
                  const provider = PMTwinData?.Users?.getById?.(offer.serviceProviderUserId);
                  const offerStatusClass = {
                    'SUBMITTED': 'badge-info',
                    'ACCEPTED': 'badge-success',
                    'REJECTED': 'badge-danger',
                    'WITHDRAWN': 'badge-secondary'
                  }[offer.status] || 'badge-secondary';
                  
                  return `
                    <div class="card" style="border-left: 3px solid var(--color-primary); background: var(--bg-secondary, #f5f7fa);">
                      <div class="card-body" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                          <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                              <i class="ph ph-user" style="color: var(--color-primary); font-size: 1.25rem;"></i>
                              <strong style="font-size: 1.125rem; color: var(--text-primary);">${provider?.profile?.name || provider?.email || 'Provider'}</strong>
                            </div>
                            <span class="badge ${offerStatusClass}" style="font-size: 0.8125rem;">
                              ${offer.status}
                            </span>
                          </div>
                        </div>
                        ${offer.message ? `
                          <div style="margin-bottom: 1rem; padding: 0.875rem; background: white; border-radius: var(--radius, 6px); border-left: 3px solid var(--color-primary);">
                            <p style="margin: 0; line-height: 1.6; color: var(--text-primary);">${offer.message}</p>
                          </div>
                        ` : ''}
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
                          <div style="padding: 0.75rem; background: white; border-radius: var(--radius, 6px);">
                            <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Pricing Model</div>
                            <div style="font-weight: 600; color: var(--text-primary);">${offer.proposedPricing?.model || 'N/A'}</div>
                          </div>
                          <div style="padding: 0.75rem; background: white; border-radius: var(--radius, 6px);">
                            <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Amount</div>
                            <div style="font-weight: 600; color: var(--text-primary); font-size: 1.125rem;">
                              ${(offer.proposedPricing?.amount || 0).toLocaleString()} ${offer.proposedPricing?.currency || 'SAR'}
                            </div>
                          </div>
                        </div>
                        ${offer.status === 'SUBMITTED' && isRequester ? `
                          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
                            <button class="btn btn-success btn-sm" onclick="ServiceRequestView.acceptOffer('${offer.id}')" style="flex: 1; min-width: 120px;">
                              <i class="ph ph-check"></i> Accept Offer
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="ServiceRequestView.rejectOffer('${offer.id}')" style="flex: 1; min-width: 120px;">
                              <i class="ph ph-x"></i> Reject
                            </button>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      } else if (isServiceProvider && request.status === 'OPEN') {
        offersHtml = `
          <div class="card" style="border-left: 4px solid var(--color-success, #28a745);">
            <div class="card-header" style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="ph ph-paper-plane-tilt" style="color: var(--color-success); font-size: 1.5rem;"></i>
              <h3 style="margin: 0; font-size: 1.25rem;">Submit Service Offer</h3>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <p style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.6;">
                Submit your offer for this service request. Include your pricing and a message explaining your approach.
              </p>
              <form id="submitOfferForm">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label for="offerMessage" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-message-text"></i>
                    <span>Message</span>
                  </label>
                  <textarea id="offerMessage" name="message" rows="5" placeholder="Describe your approach, experience, and why you're the best fit for this service request..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius, 6px); font-family: inherit; resize: vertical;"></textarea>
                </div>
                <div class="form-row" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem;">
                  <div class="form-group">
                    <label for="pricingModel" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <i class="ph ph-currency-circle-dollar"></i>
                      <span>Pricing Model *</span>
                    </label>
                    <select id="pricingModel" name="pricingModel" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius, 6px);">
                      <option value="">Select pricing model...</option>
                      <option value="HOURLY">Hourly Rate</option>
                      <option value="FIXED">Fixed Price</option>
                      <option value="RETAINER">Retainer</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="pricingAmount" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                      <i class="ph ph-money"></i>
                      <span>Amount (SAR) *</span>
                    </label>
                    <input type="number" id="pricingAmount" name="amount" min="0" step="0.01" required placeholder="0.00" style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius, 6px);">
                  </div>
                </div>
                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
                  <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
                  <button type="submit" class="btn btn-primary" style="min-width: 150px;">
                    <i class="ph ph-paper-plane-tilt"></i> Submit Offer
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
      }
      
      // Add bidding section for entities/vendors
      let biddingHtml = '';
      if (canBid && request.status === 'OPEN') {
        biddingHtml = `
          <div class="card" style="border-left: 4px solid var(--color-info, #17a2b8);">
            <div class="card-header" style="display: flex; align-items: center; gap: 0.75rem;">
              <i class="ph ph-gavel" style="color: var(--color-info); font-size: 1.5rem;"></i>
              <h3 style="margin: 0; font-size: 1.25rem;">Bid on This Request</h3>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <p style="margin-bottom: 1.5rem; color: var(--text-secondary); line-height: 1.6;">
                As an Entity or Vendor, you can bid on this service request if you need these services for your project.
              </p>
              <form id="bidOnRequestForm">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label for="bidMessage" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-message-text"></i>
                    <span>Message *</span>
                  </label>
                  <textarea id="bidMessage" name="message" rows="5" placeholder="Explain why you need this service and how it will help your project..." required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius, 6px); font-family: inherit; resize: vertical;"></textarea>
                </div>
                <div class="form-group" style="margin-bottom: 1.5rem;">
                  <label for="bidRequirements" style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-list-checks"></i>
                    <span>Your Requirements</span>
                  </label>
                  <textarea id="bidRequirements" name="requirements" rows="4" placeholder="Describe any specific requirements or preferences..." style="width: 100%; padding: 0.75rem; border: 1px solid var(--border-color, #ddd); border-radius: var(--radius, 6px); font-family: inherit; resize: vertical;"></textarea>
                  <small style="display: block; margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;">
                    Optional: Specify any particular requirements or preferences you have for this service.
                  </small>
                </div>
                <div class="form-actions" style="display: flex; gap: 1rem; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border-color, #e0e0e0);">
                  <button type="button" class="btn btn-secondary" onclick="window.history.back()">Cancel</button>
                  <button type="submit" class="btn btn-primary" style="min-width: 150px;">
                    <i class="ph ph-gavel"></i> Submit Bid
                  </button>
                </div>
              </form>
            </div>
          </div>
        `;
      }
      
      // Display existing bids if requester
      let bidsHtml = '';
      if (isRequester && bids.length > 0) {
        bidsHtml = `
          <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <h3 style="margin: 0; font-size: 1.25rem;">
                <i class="ph ph-gavel"></i> Bids from Entities/Vendors (${bids.length})
              </h3>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <div style="display: grid; gap: 1.5rem;">
                ${bids.map(bid => {
                  const bidder = PMTwinData?.Users?.getById?.(bid.bidderId);
                  return `
                    <div class="card" style="border-left: 3px solid var(--color-info, #17a2b8); background: var(--bg-secondary, #f5f7fa);">
                      <div class="card-body" style="padding: 1.25rem;">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
                          <div style="flex: 1;">
                            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                              <i class="ph ph-buildings" style="color: var(--color-info); font-size: 1.25rem;"></i>
                              <strong style="font-size: 1.125rem; color: var(--text-primary);">${bidder?.profile?.name || bidder?.email || 'Bidder'}</strong>
                            </div>
                            <span class="badge badge-info" style="font-size: 0.8125rem;">
                              <i class="ph ph-gavel"></i> Bid
                            </span>
                          </div>
                          <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            <i class="ph ph-calendar"></i> ${new Date(bid.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                        ${bid.message ? `
                          <div style="margin-bottom: 1rem; padding: 0.875rem; background: white; border-radius: var(--radius, 6px);">
                            <p style="margin: 0; line-height: 1.6; color: var(--text-primary);">${bid.message}</p>
                          </div>
                        ` : ''}
                        ${bid.requirements ? `
                          <div style="padding: 0.875rem; background: white; border-radius: var(--radius, 6px); border-left: 3px solid var(--color-warning, #ffc107);">
                            <div style="font-size: 0.8125rem; color: var(--text-secondary); margin-bottom: 0.5rem; font-weight: 600;">
                              <i class="ph ph-list-checks"></i> Requirements
                            </div>
                            <p style="margin: 0; line-height: 1.6; color: var(--text-primary);">${bid.requirements}</p>
                          </div>
                        ` : ''}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        `;
      }

      contentEl.innerHTML = `
        <div style="display: grid; gap: 1.5rem;">
          <!-- Main Service Request Card -->
          <div class="card" style="border-left: 4px solid var(--color-primary, #0066cc);">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
              <div style="flex: 1; min-width: 250px;">
                <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.75rem;">${request.title}</h2>
                <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                  <span class="status-badge ${statusClass}" style="font-size: 0.875rem; padding: 0.375rem 0.75rem;">
                    <i class="ph ph-circle-fill" style="font-size: 0.5rem; vertical-align: middle; margin-right: 0.25rem;"></i>
                    ${request.status}
                  </span>
                  <span style="color: var(--text-secondary); font-size: 0.875rem;">
                    <i class="ph ph-calendar"></i> Created ${new Date(request.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
            <div class="card-body" style="padding: 1.5rem;">
              <!-- Description -->
              <div style="margin-bottom: 2rem;">
                <h3 style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px;">Description</h3>
                <p style="margin: 0; line-height: 1.7; color: var(--text-primary); font-size: 1rem;">${request.description}</p>
              </div>

              <!-- Details Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-bottom: 1.5rem;">
                <!-- Required Skills -->
                <div style="padding: 1rem; background: var(--bg-secondary, #f5f7fa); border-radius: var(--radius, 8px);">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-wrench" style="color: var(--color-primary); font-size: 1.25rem;"></i>
                    <strong style="color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px;">Required Skills</strong>
                  </div>
                  <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${(request.requiredSkills || []).map(skill => `
                      <span class="badge badge-secondary" style="font-size: 0.8125rem; padding: 0.375rem 0.625rem;">
                        ${skill.trim()}
                      </span>
                    `).join('')}
                  </div>
                </div>

                <!-- Budget -->
                <div style="padding: 1rem; background: var(--bg-secondary, #f5f7fa); border-radius: var(--radius, 8px);">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-currency-circle-dollar" style="color: var(--color-primary); font-size: 1.25rem;"></i>
                    <strong style="color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px;">Budget</strong>
                  </div>
                  <div style="font-size: 1.125rem; font-weight: 600; color: var(--text-primary);">
                    ${(request.budget?.min || 0).toLocaleString()} - ${(request.budget?.max || 0).toLocaleString()} ${request.budget?.currency || 'SAR'}
                  </div>
                </div>

                <!-- Timeline -->
                <div style="padding: 1rem; background: var(--bg-secondary, #f5f7fa); border-radius: var(--radius, 8px);">
                  <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <i class="ph ph-clock" style="color: var(--color-primary); font-size: 1.25rem;"></i>
                    <strong style="color: var(--text-secondary); font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.5px;">Timeline</strong>
                  </div>
                  <div style="font-size: 1rem; color: var(--text-primary);">
                    ${request.timeline?.startDate ? `
                      <div><i class="ph ph-calendar-check"></i> ${new Date(request.timeline.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                      ${request.timeline?.duration ? `<div style="margin-top: 0.25rem; font-size: 0.875rem; color: var(--text-secondary);"><i class="ph ph-hourglass"></i> ${request.timeline.duration} days</div>` : ''}
                    ` : '<span style="color: var(--text-secondary);">Not specified</span>'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bidding Section -->
          ${biddingHtml}

          <!-- Bids Section -->
          ${bidsHtml}

          <!-- Offers Section -->
          ${offersHtml}
        </div>
      `;

      // Setup offer form if present
      const offerForm = document.getElementById('submitOfferForm');
      if (offerForm) {
        offerForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleSubmitOffer(request.id);
        });
      }
      
      // Setup bid form if present
      const bidForm = document.getElementById('bidOnRequestForm');
      if (bidForm) {
        bidForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          await this.handleBidOnRequest(request.id);
        });
      }
    },

    async handleSubmitOffer(requestId) {
      const form = document.getElementById('submitOfferForm');
      if (!form) return;

      const formData = new FormData(form);
      const offerData = {
        proposedPricing: {
          model: formData.get('pricingModel'),
          amount: parseFloat(formData.get('amount')),
          currency: 'SAR'
        },
        message: formData.get('message') || ''
      };

      if (typeof ServiceOfferService !== 'undefined') {
        const result = ServiceOfferService.submitOffer(requestId, offerData);
        if (result.success) {
          alert('Offer submitted successfully!');
          await this.loadRequest(requestId);
        } else {
          alert('Error: ' + (result.error || result.errors?.join(', ') || 'Failed to submit offer'));
        }
      }
    },

    async acceptOffer(offerId) {
      if (!confirm('Are you sure you want to accept this offer?')) return;

      if (typeof ServiceOfferService !== 'undefined') {
        const result = ServiceOfferService.acceptOffer(offerId);
        if (result.success) {
          alert('Offer accepted! Service engagement created.');
          const urlParams = new URLSearchParams(window.location.search);
          await this.loadRequest(urlParams.get('id'));
        } else {
          alert('Error: ' + (result.error || result.errors?.join(', ') || 'Failed to accept offer'));
        }
      }
    },

    async rejectOffer(offerId) {
      const reason = prompt('Please provide a reason for rejection:');
      if (!reason) return;

      if (typeof ServiceOfferService !== 'undefined') {
        const result = ServiceOfferService.rejectOffer(offerId, reason);
        if (result.success) {
          alert('Offer rejected.');
          const urlParams = new URLSearchParams(window.location.search);
          await this.loadRequest(urlParams.get('id'));
        } else {
          alert('Error: ' + (result.error || 'Failed to reject offer'));
        }
      }
    },

    async handleBidOnRequest(requestId) {
      const form = document.getElementById('bidOnRequestForm');
      if (!form) return;

      const formData = new FormData(form);
      const bidData = {
        message: formData.get('message') || '',
        requirements: formData.get('requirements') || ''
      };

      if (typeof ServiceRequestService !== 'undefined') {
        const result = ServiceRequestService.bidOnServiceRequest(requestId, bidData);
        if (result.success) {
          alert('Bid submitted successfully!');
          await this.loadRequest(requestId);
        } else {
          alert('Error: ' + (result.error || 'Failed to submit bid'));
        }
      }
    }
  };

  window.ServiceRequestView = ServiceRequestView;

})();

