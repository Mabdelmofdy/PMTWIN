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
            <div class="card-header">
              <h3>Offers (${offers.length})</h3>
            </div>
            <div class="card-body">
              ${offers.map(offer => {
                const provider = PMTwinData?.Users?.getById?.(offer.serviceProviderUserId);
                return `
                  <div class="offer-item">
                    <div class="offer-header">
                      <strong>${provider?.profile?.name || provider?.email || 'Provider'}</strong>
                      <span class="status-badge ${offer.status.toLowerCase()}">${offer.status}</span>
                    </div>
                    <p>${offer.message || 'No message provided'}</p>
                    <div class="offer-pricing">
                      <strong>Pricing:</strong> ${offer.proposedPricing?.amount || 0} ${offer.proposedPricing?.currency || 'SAR'} (${offer.proposedPricing?.model || 'N/A'})
                    </div>
                    ${offer.status === 'SUBMITTED' && isRequester ? `
                      <div class="offer-actions">
                        <button class="btn btn-success btn-sm" onclick="ServiceRequestView.acceptOffer('${offer.id}')">Accept</button>
                        <button class="btn btn-danger btn-sm" onclick="ServiceRequestView.rejectOffer('${offer.id}')">Reject</button>
                      </div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      } else if (isServiceProvider && request.status === 'OPEN') {
        offersHtml = `
          <div class="card">
            <div class="card-header">
              <h3>Submit Offer</h3>
            </div>
            <div class="card-body">
              <form id="submitOfferForm">
                <div class="form-group">
                  <label for="offerMessage">Message</label>
                  <textarea id="offerMessage" name="message" rows="4"></textarea>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label for="pricingModel">Pricing Model *</label>
                    <select id="pricingModel" name="pricingModel" required>
                      <option value="HOURLY">Hourly</option>
                      <option value="FIXED">Fixed</option>
                      <option value="RETAINER">Retainer</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label for="pricingAmount">Amount (SAR) *</label>
                    <input type="number" id="pricingAmount" name="amount" min="0" step="0.01" required>
                  </div>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Submit Offer</button>
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
          <div class="card">
            <div class="card-header">
              <h3>Bid on This Request</h3>
              <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                As an Entity or Vendor, you can bid on this service request if you need these services.
              </p>
            </div>
            <div class="card-body">
              <form id="bidOnRequestForm">
                <div class="form-group">
                  <label for="bidMessage">Message *</label>
                  <textarea id="bidMessage" name="message" rows="4" placeholder="Explain why you need this service and how it will help your project..." required></textarea>
                </div>
                <div class="form-group">
                  <label for="bidRequirements">Your Requirements</label>
                  <textarea id="bidRequirements" name="requirements" rows="3" placeholder="Describe any specific requirements or preferences..."></textarea>
                </div>
                <div class="form-actions">
                  <button type="submit" class="btn btn-primary">Submit Bid</button>
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
            <div class="card-header">
              <h3>Bids from Entities/Vendors (${bids.length})</h3>
            </div>
            <div class="card-body">
              ${bids.map(bid => {
                const bidder = PMTwinData?.Users?.getById?.(bid.bidderId);
                return `
                  <div class="offer-item" style="border-left: 3px solid var(--color-primary); padding-left: 1rem; margin-bottom: 1rem;">
                    <div class="offer-header">
                      <strong>${bidder?.profile?.name || bidder?.email || 'Bidder'}</strong>
                      <span class="badge badge-info">Bid</span>
                    </div>
                    <p>${bid.message || 'No message provided'}</p>
                    ${bid.requirements ? `<div><strong>Requirements:</strong> ${bid.requirements}</div>` : ''}
                    <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.5rem;">
                      Submitted: ${new Date(bid.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      }

      contentEl.innerHTML = `
        <div class="card">
          <div class="card-header">
            <h2>${request.title}</h2>
            <span class="status-badge ${statusClass}">${request.status}</span>
          </div>
          <div class="card-body">
            <p>${request.description}</p>
            <div class="request-details">
              <div><strong>Required Skills:</strong> ${(request.requiredSkills || []).join(', ')}</div>
              <div><strong>Budget:</strong> ${request.budget?.min || 0} - ${request.budget?.max || 0} ${request.budget?.currency || 'SAR'}</div>
              <div><strong>Timeline:</strong> ${request.timeline?.startDate ? new Date(request.timeline.startDate).toLocaleDateString() : 'Not specified'} 
                ${request.timeline?.duration ? `(${request.timeline.duration} days)` : ''}</div>
              <div><strong>Created:</strong> ${new Date(request.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>
        ${biddingHtml}
        ${bidsHtml}
        ${offersHtml}
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

