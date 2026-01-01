/**
 * Profile Component
 * Aligned with BRD requirements for Individual and Entity profiles
 * Full edit functionality included
 */

(function() {
  'use strict';

  let currentUser = null;
  let isEditMode = false;

  function init(params) {
    loadProfile();
  }

  function loadProfile() {
    const container = document.getElementById('profileContent');
    if (!container) return;

    try {
      currentUser = PMTwinData?.Sessions.getCurrentUser();
      if (!currentUser) {
        container.innerHTML = '<p class="alert alert-error">User not authenticated</p>';
        return;
      }

      renderProfile(container, currentUser);
    } catch (error) {
      console.error('Error loading profile:', error);
      container.innerHTML = '<p class="alert alert-error">Error loading profile. Please try again.</p>';
    }
  }

  function renderProfile(container, user) {
    const profile = user.profile || {};
    const userType = user.userType || (user.role === 'entity' || user.role === 'project_lead' || user.role === 'service_provider' ? 'company' : 'individual');
    const isEntity = userType === 'company' || userType === 'entity';

    let html = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1 style="margin: 0;">My Profile</h1>
        <div style="display: flex; gap: 1rem;">
          ${!isEditMode ? `
            <button onclick="profileComponent.editProfile()" class="btn btn-primary">
              <i class="ph ph-pencil"></i> Edit Profile
            </button>
          ` : `
            <button onclick="profileComponent.cancelEdit()" class="btn btn-secondary">
              <i class="ph ph-x"></i> Cancel
            </button>
            <button onclick="profileComponent.saveProfile()" class="btn btn-success">
              <i class="ph ph-check"></i> Save Changes
            </button>
          `}
          ${user.onboardingStage !== 'approved' ? `
            <a href="../onboarding/" class="btn btn-success">
              <i class="ph ph-clipboard-text"></i> Complete Profile
            </a>
          ` : ''}
        </div>
      </div>
    `;

    // Profile Status Card
    html += renderProfileStatusCard(user, profile);

    if (isEditMode) {
      // Render edit forms
      if (isEntity) {
        html += renderEntityEditForm(user, profile);
      } else {
        html += renderIndividualEditForm(user, profile);
      }
    } else {
      // Render view mode
      if (isEntity) {
        html += renderEntityProfile(user, profile);
      } else {
        html += renderIndividualProfile(user, profile);
      }
    }

    container.innerHTML = html;
  }

  function renderProfileStatusCard(user, profile) {
    const status = profile.status || user.onboardingStage || 'pending';
    const statusColors = {
      'approved': 'success',
      'pending': 'warning',
      'rejected': 'error',
      'registered': 'info'
    };
    const statusColor = statusColors[status] || 'warning';

    return `
      <div class="card" style="margin-bottom: 2rem; background: linear-gradient(135deg, var(--color-primary-light), var(--bg-primary));">
        <div class="card-body">
          <div style="display: flex; justify-content: space-between; align-items: start; flex-wrap: wrap; gap: 1rem;">
            <div style="flex: 1;">
              <h2 style="margin: 0 0 0.5rem 0;">${profile.name || profile.companyName || user.email}</h2>
              <p style="margin: 0; color: var(--text-secondary);">
                ${profile.professionalTitle || profile.companyDescription || 'No description provided'}
              </p>
              <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
                <span class="badge badge-${statusColor}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>
                <span class="badge badge-info">${user.role || 'N/A'}</span>
                ${user.profileCompletionScore ? `
                  <span class="badge badge-${user.profileCompletionScore >= 80 ? 'success' : user.profileCompletionScore >= 60 ? 'warning' : 'error'}">
                    Profile: ${user.profileCompletionScore}%
                  </span>
                ` : ''}
              </div>
            </div>
            <div style="text-align: right;">
              ${renderProfileScoreBreakdown(user)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================
  // Individual Profile Edit Form
  // ============================================
  function renderIndividualEditForm(user, profile) {
    const location = profile.location || {};
    
    return `
      <form id="profileEditForm" onsubmit="profileComponent.handleSaveProfile(event)">
        <!-- Personal Information -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-user"></i> Personal Information</h2>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              <div class="form-group">
                <label for="profileName" class="form-label">Full Name *</label>
                <input type="text" id="profileName" class="form-control" value="${escapeHtml(profile.name || '')}" required>
              </div>
              <div class="form-group">
                <label for="profileTitle" class="form-label">Professional Title</label>
                <input type="text" id="profileTitle" class="form-control" value="${escapeHtml(profile.professionalTitle || '')}" placeholder="e.g., Senior Civil Engineer">
              </div>
              <div class="form-group">
                <label for="profileEmail" class="form-label">Email</label>
                <input type="email" id="profileEmail" class="form-control" value="${escapeHtml(user.email || '')}" disabled>
                <small class="form-text">Email cannot be changed</small>
              </div>
              <div class="form-group">
                <label for="profilePhone" class="form-label">Phone</label>
                <input type="tel" id="profilePhone" class="form-control" value="${escapeHtml(profile.phone || user.mobile || '')}" placeholder="+966501234567">
              </div>
              <div class="form-group">
                <label for="profileCity" class="form-label">City</label>
                <input type="text" id="profileCity" class="form-control" value="${escapeHtml(location.city || '')}" placeholder="Riyadh">
              </div>
              <div class="form-group">
                <label for="profileRegion" class="form-label">Region</label>
                <input type="text" id="profileRegion" class="form-control" value="${escapeHtml(location.region || '')}" placeholder="Riyadh Province">
              </div>
              <div class="form-group">
                <label for="profileCountry" class="form-label">Country</label>
                <input type="text" id="profileCountry" class="form-control" value="${escapeHtml(location.country || 'Saudi Arabia')}" placeholder="Saudi Arabia">
              </div>
              <div class="form-group">
                <label for="profileExperienceLevel" class="form-label">Experience Level</label>
                <select id="profileExperienceLevel" class="form-control">
                  <option value="">Select level</option>
                  <option value="junior" ${profile.experienceLevel === 'junior' ? 'selected' : ''}>Junior</option>
                  <option value="intermediate" ${profile.experienceLevel === 'intermediate' ? 'selected' : ''}>Intermediate</option>
                  <option value="senior" ${profile.experienceLevel === 'senior' ? 'selected' : ''}>Senior</option>
                  <option value="expert" ${profile.experienceLevel === 'expert' ? 'selected' : ''}>Expert</option>
                </select>
              </div>
            </div>
            <div class="form-group" style="margin-top: 1.5rem;">
              <label for="profileBio" class="form-label">Bio/Summary</label>
              <textarea id="profileBio" class="form-control" rows="4" placeholder="Tell us about yourself...">${escapeHtml(profile.bio || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Skills & Expertise -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-star"></i> Skills & Expertise</h2>
            <button type="button" onclick="profileComponent.addSkill()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Skill
            </button>
          </div>
          <div class="card-body">
            <div id="skillsContainer">
              ${(profile.skills || []).map((skill, index) => `
                <div class="skill-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                  <input type="text" class="form-control skill-input" value="${escapeHtml(skill)}" data-index="${index}">
                  <button type="button" onclick="profileComponent.removeSkill(${index})" class="btn btn-sm btn-danger">
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div id="newSkillTemplate" style="display: none;">
              <div class="skill-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                <input type="text" class="form-control skill-input" placeholder="Enter skill name">
                <button type="button" onclick="profileComponent.removeSkill(this)" class="btn btn-sm btn-danger">
                  <i class="ph ph-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Certifications -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-certificate"></i> Certifications</h2>
            <button type="button" onclick="profileComponent.addCertification()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Certification
            </button>
          </div>
          <div class="card-body">
            <div id="certificationsContainer">
              ${(profile.certifications || []).map((cert, index) => renderCertificationForm(cert, index)).join('')}
            </div>
          </div>
        </div>

        <!-- Portfolio -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-folder-open"></i> Portfolio</h2>
            <button type="button" onclick="profileComponent.addPortfolioItem()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Project
            </button>
          </div>
          <div class="card-body">
            <div id="portfolioContainer">
              ${(profile.portfolio || []).map((item, index) => renderPortfolioForm(item, index)).join('')}
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div id="profileError" class="alert alert-error" style="display: none; margin-bottom: 2rem;"></div>

        <!-- Save Button -->
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem;">
          <button type="button" onclick="profileComponent.cancelEdit()" class="btn btn-secondary">
            <i class="ph ph-x"></i> Cancel
          </button>
          <button type="submit" class="btn btn-success">
            <i class="ph ph-check"></i> Save Changes
          </button>
        </div>
      </form>
    `;
  }

  // ============================================
  // Entity Profile Edit Form
  // ============================================
  function renderEntityEditForm(user, profile) {
    const location = profile.location || {};
    const hq = location.headquarters || {};
    const branches = location.branches || [];
    const commercialReg = profile.commercialRegistration || {};
    const vatNum = profile.vatNumber || {};
    
    return `
      <form id="profileEditForm" onsubmit="profileComponent.handleSaveProfile(event)">
        <!-- Company Information -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-buildings"></i> Company Information</h2>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              <div class="form-group">
                <label for="companyName" class="form-label">Company Name *</label>
                <input type="text" id="companyName" class="form-control" value="${escapeHtml(profile.companyName || '')}" required>
              </div>
              <div class="form-group">
                <label for="legalName" class="form-label">Legal Name</label>
                <input type="text" id="legalName" class="form-control" value="${escapeHtml(profile.legalName || '')}">
              </div>
              <div class="form-group">
                <label for="companyEmail" class="form-label">Email</label>
                <input type="email" id="companyEmail" class="form-control" value="${escapeHtml(user.email || '')}" disabled>
                <small class="form-text">Email cannot be changed</small>
              </div>
              <div class="form-group">
                <label for="companyPhone" class="form-label">Phone</label>
                <input type="tel" id="companyPhone" class="form-control" value="${escapeHtml(profile.phone || user.mobile || '')}" placeholder="+966112345678">
              </div>
              <div class="form-group">
                <label for="companyWebsite" class="form-label">Website</label>
                <input type="url" id="companyWebsite" class="form-control" value="${escapeHtml(profile.website || '')}" placeholder="https://www.example.com">
              </div>
              <div class="form-group">
                <label for="yearsInBusiness" class="form-label">Years in Business</label>
                <input type="number" id="yearsInBusiness" class="form-control" value="${profile.yearsInBusiness || ''}" min="0">
              </div>
              <div class="form-group">
                <label for="employeeCount" class="form-label">Employee Count</label>
                <input type="text" id="employeeCount" class="form-control" value="${escapeHtml(profile.employeeCount || '')}" placeholder="e.g., 500-1000">
              </div>
              <div class="form-group">
                <label for="annualRevenueRange" class="form-label">Annual Revenue Range (SAR)</label>
                <input type="text" id="annualRevenueRange" class="form-control" value="${escapeHtml(profile.annualRevenueRange || '')}" placeholder="e.g., 50M-100M">
              </div>
            </div>
            <div class="form-group" style="margin-top: 1.5rem;">
              <label for="companyDescription" class="form-label">Company Description</label>
              <textarea id="companyDescription" class="form-control" rows="4" placeholder="Describe your company...">${escapeHtml(profile.companyDescription || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- Headquarters -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-map-pin"></i> Headquarters</h2>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              <div class="form-group">
                <label for="hqAddress" class="form-label">Address</label>
                <input type="text" id="hqAddress" class="form-control" value="${escapeHtml(hq.address || '')}" placeholder="Street address">
              </div>
              <div class="form-group">
                <label for="hqCity" class="form-label">City</label>
                <input type="text" id="hqCity" class="form-control" value="${escapeHtml(hq.city || '')}" placeholder="Riyadh">
              </div>
              <div class="form-group">
                <label for="hqRegion" class="form-label">Region</label>
                <input type="text" id="hqRegion" class="form-control" value="${escapeHtml(hq.region || '')}" placeholder="Riyadh Province">
              </div>
              <div class="form-group">
                <label for="hqCountry" class="form-label">Country</label>
                <input type="text" id="hqCountry" class="form-control" value="${escapeHtml(hq.country || 'Saudi Arabia')}" placeholder="Saudi Arabia">
              </div>
            </div>
          </div>
        </div>

        <!-- Branches -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-buildings"></i> Branches</h2>
            <button type="button" onclick="profileComponent.addBranch()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Branch
            </button>
          </div>
          <div class="card-body">
            <div id="branchesContainer">
              ${branches.map((branch, index) => renderBranchForm(branch, index)).join('')}
            </div>
          </div>
        </div>

        <!-- Business Credentials -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-file-text"></i> Business Credentials</h2>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
              <div class="form-group">
                <label for="crNumber" class="form-label">Commercial Registration Number</label>
                <input type="text" id="crNumber" class="form-control" value="${escapeHtml(commercialReg.number || '')}" placeholder="CR-1234567890">
              </div>
              <div class="form-group">
                <label for="crIssueDate" class="form-label">CR Issue Date</label>
                <input type="date" id="crIssueDate" class="form-control" value="${commercialReg.issueDate ? commercialReg.issueDate.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="crExpiryDate" class="form-label">CR Expiry Date</label>
                <input type="date" id="crExpiryDate" class="form-control" value="${commercialReg.expiryDate ? commercialReg.expiryDate.split('T')[0] : ''}">
              </div>
              <div class="form-group">
                <label for="vatNumber" class="form-label">VAT Number</label>
                <input type="text" id="vatNumber" class="form-control" value="${escapeHtml(vatNum.number || '')}" placeholder="VAT-123456789012345">
              </div>
            </div>
          </div>
        </div>

        <!-- Services Offered -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-briefcase"></i> Services Offered</h2>
            <button type="button" onclick="profileComponent.addService()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Service
            </button>
          </div>
          <div class="card-body">
            <div id="servicesContainer">
              ${(profile.services || []).map((service, index) => `
                <div class="service-item" style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;">
                  <input type="text" class="form-control service-input" value="${escapeHtml(service)}" data-index="${index}" placeholder="Service name">
                  <button type="button" onclick="profileComponent.removeService(${index})" class="btn btn-sm btn-danger">
                    <i class="ph ph-trash"></i>
                  </button>
                </div>
              `).join('')}
            </div>
            <div style="margin-top: 1.5rem;">
              <label class="form-label">Service Descriptions</label>
              <div id="serviceDescriptionsContainer">
                ${Object.entries(profile.serviceDescriptions || {}).map(([service, desc], index) => `
                  <div class="form-group" style="margin-bottom: 1rem;">
                    <label class="form-label">${escapeHtml(service)}</label>
                    <textarea class="form-control service-desc-input" data-service="${escapeHtml(service)}" rows="2" placeholder="Describe this service...">${escapeHtml(desc)}</textarea>
                  </div>
                `).join('')}
              </div>
            </div>
            <div style="margin-top: 1.5rem;">
              <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">Capacity</h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
                <div class="form-group">
                  <label for="maxProjectValue" class="form-label">Max Project Value (SAR)</label>
                  <input type="number" id="maxProjectValue" class="form-control" value="${profile.capacity?.maxProjectValue || ''}" min="0" step="1000">
                </div>
                <div class="form-group">
                  <label for="concurrentProjects" class="form-label">Concurrent Projects</label>
                  <input type="number" id="concurrentProjects" class="form-control" value="${profile.capacity?.concurrentProjects || ''}" min="0">
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Key Projects -->
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
            <h2 style="margin: 0;"><i class="ph ph-folder-open"></i> Key Projects</h2>
            <button type="button" onclick="profileComponent.addKeyProject()" class="btn btn-sm btn-primary">
              <i class="ph ph-plus"></i> Add Project
            </button>
          </div>
          <div class="card-body">
            <div id="keyProjectsContainer">
              ${(profile.keyProjects || []).map((project, index) => renderKeyProjectForm(project, index)).join('')}
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div id="profileError" class="alert alert-error" style="display: none; margin-bottom: 2rem;"></div>

        <!-- Save Button -->
        <div style="display: flex; justify-content: flex-end; gap: 1rem; margin-bottom: 2rem;">
          <button type="button" onclick="profileComponent.cancelEdit()" class="btn btn-secondary">
            <i class="ph ph-x"></i> Cancel
          </button>
          <button type="submit" class="btn btn-success">
            <i class="ph ph-check"></i> Save Changes
          </button>
        </div>
      </form>
    `;
  }

  // ============================================
  // Form Helper Functions
  // ============================================
  function renderCertificationForm(cert, index) {
    return `
      <div class="certification-item" data-index="${index}" style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Certification Name *</label>
            <input type="text" class="form-control cert-name" value="${escapeHtml(cert.name || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Issuer</label>
            <input type="text" class="form-control cert-issuer" value="${escapeHtml(cert.issuer || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Credential ID</label>
            <input type="text" class="form-control cert-credential-id" value="${escapeHtml(cert.credentialId || '')}">
          </div>
          <div class="form-group">
            <label class="form-label">Issue Date</label>
            <input type="date" class="form-control cert-issue-date" value="${cert.issueDate ? cert.issueDate.split('T')[0] : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Expiry Date</label>
            <input type="date" class="form-control cert-expiry-date" value="${cert.expiryDate ? cert.expiryDate.split('T')[0] : ''}">
          </div>
        </div>
        <button type="button" onclick="profileComponent.removeCertification(${index})" class="btn btn-sm btn-danger" style="margin-top: 0.5rem;">
          <i class="ph ph-trash"></i> Remove
        </button>
      </div>
    `;
  }

  function renderPortfolioForm(item, index) {
    return `
      <div class="portfolio-item" data-index="${index}" style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Project Title *</label>
            <input type="text" class="form-control portfolio-title" value="${escapeHtml(item.title || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Completion Date</label>
            <input type="date" class="form-control portfolio-completion-date" value="${item.completionDate ? item.completionDate.split('T')[0] : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Project Link</label>
            <input type="url" class="form-control portfolio-link" value="${escapeHtml(item.link || '')}" placeholder="https://...">
          </div>
        </div>
        <div class="form-group" style="margin-top: 1rem;">
          <label class="form-label">Description</label>
          <textarea class="form-control portfolio-description" rows="3" placeholder="Project description...">${escapeHtml(item.description || '')}</textarea>
        </div>
        <button type="button" onclick="profileComponent.removePortfolioItem(${index})" class="btn btn-sm btn-danger" style="margin-top: 0.5rem;">
          <i class="ph ph-trash"></i> Remove
        </button>
      </div>
    `;
  }

  function renderBranchForm(branch, index) {
    return `
      <div class="branch-item" data-index="${index}" style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label class="form-label">City</label>
            <input type="text" class="form-control branch-city" value="${escapeHtml(branch.city || '')}" placeholder="Jeddah">
          </div>
          <div class="form-group">
            <label class="form-label">Region</label>
            <input type="text" class="form-control branch-region" value="${escapeHtml(branch.region || '')}" placeholder="Makkah Province">
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" class="form-control branch-country" value="${escapeHtml(branch.country || 'Saudi Arabia')}" placeholder="Saudi Arabia">
          </div>
        </div>
        <button type="button" onclick="profileComponent.removeBranch(${index})" class="btn btn-sm btn-danger" style="margin-top: 0.5rem;">
          <i class="ph ph-trash"></i> Remove
        </button>
      </div>
    `;
  }

  function renderKeyProjectForm(project, index) {
    return `
      <div class="key-project-item" data-index="${index}" style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); margin-bottom: 1rem;">
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
          <div class="form-group">
            <label class="form-label">Project Title *</label>
            <input type="text" class="form-control key-project-title" value="${escapeHtml(project.title || '')}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Project Value (SAR)</label>
            <input type="number" class="form-control key-project-value" value="${project.value || ''}" min="0" step="1000">
          </div>
          <div class="form-group">
            <label class="form-label">Completion Date</label>
            <input type="date" class="form-control key-project-completion-date" value="${project.completionDate ? project.completionDate.split('T')[0] : ''}">
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-control key-project-status">
              <option value="completed" ${project.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="in-progress" ${project.status === 'in-progress' ? 'selected' : ''}>In Progress</option>
              <option value="on-hold" ${project.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>
        </div>
        <button type="button" onclick="profileComponent.removeKeyProject(${index})" class="btn btn-sm btn-danger" style="margin-top: 0.5rem;">
          <i class="ph ph-trash"></i> Remove
        </button>
      </div>
    `;
  }

  // ============================================
  // Dynamic Item Management
  // ============================================
  function addSkill() {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    const template = document.getElementById('newSkillTemplate');
    if (!template) return;
    
    const newItem = template.cloneNode(true);
    newItem.style.display = 'block';
    newItem.id = '';
    newItem.querySelector('.skill-input').value = '';
    newItem.querySelector('.skill-input').removeAttribute('data-index');
    newItem.querySelector('button').onclick = function() {
      this.closest('.skill-item').remove();
    };
    
    container.appendChild(newItem);
  }

  function removeSkill(index) {
    const container = document.getElementById('skillsContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.skill-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  function addCertification() {
    const container = document.getElementById('certificationsContainer');
    if (!container) return;
    
    const newCert = {
      name: '',
      issuer: '',
      credentialId: '',
      issueDate: '',
      expiryDate: ''
    };
    
    const index = container.querySelectorAll('.certification-item').length;
    const html = renderCertificationForm(newCert, index);
    container.insertAdjacentHTML('beforeend', html);
  }

  function removeCertification(index) {
    const container = document.getElementById('certificationsContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.certification-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  function addPortfolioItem() {
    const container = document.getElementById('portfolioContainer');
    if (!container) return;
    
    const newItem = {
      title: '',
      description: '',
      completionDate: '',
      link: ''
    };
    
    const index = container.querySelectorAll('.portfolio-item').length;
    const html = renderPortfolioForm(newItem, index);
    container.insertAdjacentHTML('beforeend', html);
  }

  function removePortfolioItem(index) {
    const container = document.getElementById('portfolioContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.portfolio-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  function addBranch() {
    const container = document.getElementById('branchesContainer');
    if (!container) return;
    
    const newBranch = {
      city: '',
      region: '',
      country: 'Saudi Arabia'
    };
    
    const index = container.querySelectorAll('.branch-item').length;
    const html = renderBranchForm(newBranch, index);
    container.insertAdjacentHTML('beforeend', html);
  }

  function removeBranch(index) {
    const container = document.getElementById('branchesContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.branch-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  function addService() {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    const newItem = document.createElement('div');
    newItem.className = 'service-item';
    newItem.style.cssText = 'display: flex; gap: 0.5rem; margin-bottom: 0.5rem; align-items: center;';
    newItem.innerHTML = `
      <input type="text" class="form-control service-input" placeholder="Service name">
      <button type="button" onclick="this.closest('.service-item').remove()" class="btn btn-sm btn-danger">
        <i class="ph ph-trash"></i>
      </button>
    `;
    
    container.appendChild(newItem);
  }

  function removeService(index) {
    const container = document.getElementById('servicesContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.service-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  function addKeyProject() {
    const container = document.getElementById('keyProjectsContainer');
    if (!container) return;
    
    const newProject = {
      title: '',
      value: '',
      completionDate: '',
      status: 'completed'
    };
    
    const index = container.querySelectorAll('.key-project-item').length;
    const html = renderKeyProjectForm(newProject, index);
    container.insertAdjacentHTML('beforeend', html);
  }

  function removeKeyProject(index) {
    const container = document.getElementById('keyProjectsContainer');
    if (!container) return;
    
    const items = container.querySelectorAll('.key-project-item');
    if (items[index]) {
      items[index].remove();
    }
  }

  // ============================================
  // Save Profile Functionality
  // ============================================
  function handleSaveProfile(event) {
    event.preventDefault();
    
    if (!currentUser) {
      showError('User not authenticated');
      return false;
    }

    const userType = currentUser.userType || (currentUser.role === 'entity' || currentUser.role === 'project_lead' || currentUser.role === 'service_provider' ? 'company' : 'individual');
    const isEntity = userType === 'company' || userType === 'entity';

    try {
      let profileUpdates = {};

      if (isEntity) {
        profileUpdates = collectEntityProfileData();
      } else {
        profileUpdates = collectIndividualProfileData();
      }

      // Update user profile
      const updated = PMTwinData.Users.update(currentUser.id, {
        profile: {
          ...currentUser.profile,
          ...profileUpdates
        },
        mobile: profileUpdates.phone || currentUser.mobile || profileUpdates.phone
      });

      if (updated) {
        // Update session with new user data
        PMTwinData.Sessions.updateSession(currentUser.id, updated);
        currentUser = updated;
        
        // Show success message
        showSuccess('Profile updated successfully!');
        
        // Exit edit mode and reload
        setTimeout(() => {
          isEditMode = false;
          loadProfile();
        }, 1000);
      } else {
        showError('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showError('An error occurred while saving your profile: ' + error.message);
    }

    return false;
  }

  function collectIndividualProfileData() {
    const profile = {
      name: document.getElementById('profileName')?.value || '',
      professionalTitle: document.getElementById('profileTitle')?.value || '',
      phone: document.getElementById('profilePhone')?.value || '',
      bio: document.getElementById('profileBio')?.value || '',
      experienceLevel: document.getElementById('profileExperienceLevel')?.value || '',
      location: {
        city: document.getElementById('profileCity')?.value || '',
        region: document.getElementById('profileRegion')?.value || '',
        country: document.getElementById('profileCountry')?.value || 'Saudi Arabia'
      }
    };

    // Collect skills
    const skillInputs = document.querySelectorAll('.skill-input');
    profile.skills = Array.from(skillInputs)
      .map(input => input.value.trim())
      .filter(skill => skill.length > 0);

    // Collect certifications
    const certItems = document.querySelectorAll('.certification-item');
    profile.certifications = Array.from(certItems).map(item => {
      const name = item.querySelector('.cert-name')?.value.trim();
      if (!name) return null; // Skip empty certifications
      
      return {
        name: name,
        issuer: item.querySelector('.cert-issuer')?.value.trim() || '',
        credentialId: item.querySelector('.cert-credential-id')?.value.trim() || '',
        issueDate: item.querySelector('.cert-issue-date')?.value ? new Date(item.querySelector('.cert-issue-date').value).toISOString() : null,
        expiryDate: item.querySelector('.cert-expiry-date')?.value ? new Date(item.querySelector('.cert-expiry-date').value).toISOString() : null
      };
    }).filter(cert => cert !== null);

    // Collect portfolio
    const portfolioItems = document.querySelectorAll('.portfolio-item');
    profile.portfolio = Array.from(portfolioItems).map(item => {
      const title = item.querySelector('.portfolio-title')?.value.trim();
      if (!title) return null; // Skip empty portfolio items
      
      return {
        id: 'portfolio_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        description: item.querySelector('.portfolio-description')?.value.trim() || '',
        completionDate: item.querySelector('.portfolio-completion-date')?.value || null,
        link: item.querySelector('.portfolio-link')?.value.trim() || ''
      };
    }).filter(item => item !== null);

    return profile;
  }

  function collectEntityProfileData() {
    const profile = {
      companyName: document.getElementById('companyName')?.value || '',
      legalName: document.getElementById('legalName')?.value || '',
      phone: document.getElementById('companyPhone')?.value || '',
      website: document.getElementById('companyWebsite')?.value || '',
      companyDescription: document.getElementById('companyDescription')?.value || '',
      yearsInBusiness: parseInt(document.getElementById('yearsInBusiness')?.value) || null,
      employeeCount: document.getElementById('employeeCount')?.value || '',
      annualRevenueRange: document.getElementById('annualRevenueRange')?.value || '',
      location: {
        headquarters: {
          address: document.getElementById('hqAddress')?.value || '',
          city: document.getElementById('hqCity')?.value || '',
          region: document.getElementById('hqRegion')?.value || '',
          country: document.getElementById('hqCountry')?.value || 'Saudi Arabia'
        },
        branches: []
      },
      commercialRegistration: {
        number: document.getElementById('crNumber')?.value || '',
        issueDate: document.getElementById('crIssueDate')?.value || null,
        expiryDate: document.getElementById('crExpiryDate')?.value || null,
        verified: false // Will be verified by admin
      },
      vatNumber: {
        number: document.getElementById('vatNumber')?.value || '',
        verified: false // Will be verified by admin
      }
    };

    // Collect branches
    const branchItems = document.querySelectorAll('.branch-item');
    profile.location.branches = Array.from(branchItems).map(item => {
      const city = item.querySelector('.branch-city')?.value.trim();
      if (!city) return null; // Skip empty branches
      
      return {
        city: city,
        region: item.querySelector('.branch-region')?.value.trim() || '',
        country: item.querySelector('.branch-country')?.value.trim() || 'Saudi Arabia'
      };
    }).filter(branch => branch !== null);

    // Collect services
    const serviceInputs = document.querySelectorAll('.service-input');
    profile.services = Array.from(serviceInputs)
      .map(input => input.value.trim())
      .filter(service => service.length > 0);

    // Collect service descriptions
    const serviceDescInputs = document.querySelectorAll('.service-desc-input');
    profile.serviceDescriptions = {};
    serviceDescInputs.forEach(input => {
      const service = input.getAttribute('data-service');
      const description = input.value.trim();
      if (service && description) {
        profile.serviceDescriptions[service] = description;
      }
    });

    // Collect capacity
    const maxProjectValue = document.getElementById('maxProjectValue')?.value;
    const concurrentProjects = document.getElementById('concurrentProjects')?.value;
    if (maxProjectValue || concurrentProjects) {
      profile.capacity = {
        maxProjectValue: maxProjectValue ? parseInt(maxProjectValue) : null,
        concurrentProjects: concurrentProjects ? parseInt(concurrentProjects) : null
      };
    }

    // Collect key projects
    const keyProjectItems = document.querySelectorAll('.key-project-item');
    profile.keyProjects = Array.from(keyProjectItems).map(item => {
      const title = item.querySelector('.key-project-title')?.value.trim();
      if (!title) return null; // Skip empty projects
      
      return {
        id: 'key_project_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
        title: title,
        value: item.querySelector('.key-project-value')?.value ? parseInt(item.querySelector('.key-project-value').value) : null,
        completionDate: item.querySelector('.key-project-completion-date')?.value || null,
        status: item.querySelector('.key-project-status')?.value || 'completed'
      };
    }).filter(project => project !== null);

    return profile;
  }

  function showError(message) {
    const errorDiv = document.getElementById('profileError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.className = 'alert alert-error';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 5000);
    } else {
      alert('Error: ' + message);
    }
  }

  function showSuccess(message) {
    const errorDiv = document.getElementById('profileError');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      errorDiv.className = 'alert alert-success';
      setTimeout(() => {
        errorDiv.style.display = 'none';
      }, 3000);
    } else {
      alert(message);
    }
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================
  // View Mode Rendering (existing functions)
  // ============================================
  function renderIndividualProfile(user, profile) {
    let html = '';

    // Personal Information Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;"><i class="ph ph-user"></i> Personal Information</h2>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <div>
              <label class="form-label">Full Name</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.name || user.email || 'Not provided'}</p>
            </div>
            <div>
              <label class="form-label">Professional Title</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.professionalTitle || 'Not provided'}</p>
            </div>
            <div>
              <label class="form-label">Email</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${user.email || 'Not provided'}</p>
            </div>
            <div>
              <label class="form-label">Phone</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.phone || user.mobile || 'Not provided'}</p>
            </div>
            <div>
              <label class="form-label">Location</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">
                ${profile.location ? 
                  `${profile.location.city || ''}${profile.location.region ? ', ' + profile.location.region : ''}${profile.location.country ? ', ' + profile.location.country : ''}`.replace(/^,\s*|,\s*$/g, '') || 'Not provided' 
                  : 'Not provided'}
              </p>
            </div>
            <div>
              <label class="form-label">Experience Level</label>
              <p style="margin: 0.5rem 0 0 0;">
                ${profile.experienceLevel ? 
                  `<span class="badge badge-info">${profile.experienceLevel.charAt(0).toUpperCase() + profile.experienceLevel.slice(1)}</span>` 
                  : 'Not provided'}
              </p>
            </div>
          </div>
          ${profile.bio ? `
            <div style="margin-top: 1.5rem;">
              <label class="form-label">Bio/Summary</label>
              <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); line-height: 1.6;">${profile.bio}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Skills & Expertise Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-star"></i> Skills & Expertise</h2>
        </div>
        <div class="card-body">
          ${profile.skills && profile.skills.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
              ${profile.skills.map(skill => `
                <span class="badge badge-primary">${skill}</span>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No skills added yet</p>
          `}
        </div>
      </div>
    `;

    // Certifications Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;"><i class="ph ph-certificate"></i> Certifications</h2>
        </div>
        <div class="card-body">
          ${profile.certifications && profile.certifications.length > 0 ? `
            <div style="display: grid; gap: 1rem;">
              ${profile.certifications.map(cert => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 3px solid var(--color-primary);">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${cert.name || 'Unnamed Certification'}</h3>
                      <p style="margin: 0.25rem 0; color: var(--text-secondary);">
                        <strong>Issuer:</strong> ${cert.issuer || 'N/A'}
                      </p>
                      ${cert.credentialId ? `
                        <p style="margin: 0.25rem 0; color: var(--text-secondary);">
                          <strong>Credential ID:</strong> ${cert.credentialId}
                        </p>
                      ` : ''}
                      <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                        ${cert.issueDate ? `
                          <span style="font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="ph ph-calendar"></i> Issued: ${new Date(cert.issueDate).toLocaleDateString()}
                          </span>
                        ` : ''}
                        ${cert.expiryDate ? `
                          <span style="font-size: 0.9rem; color: ${new Date(cert.expiryDate) < new Date() ? 'var(--color-error)' : 'var(--text-secondary)'};">
                            <i class="ph ph-calendar-check"></i> Expires: ${new Date(cert.expiryDate).toLocaleDateString()}
                          </span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No certifications added yet</p>
          `}
        </div>
      </div>
    `;

    // Credentials Section
    html += renderCredentialsSection(profile.credentials || user.documents || []);

    // Portfolio Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;"><i class="ph ph-folder-open"></i> Portfolio</h2>
        </div>
        <div class="card-body">
          ${profile.portfolio && profile.portfolio.length > 0 ? `
            <div style="display: grid; gap: 1rem;">
              ${profile.portfolio.map(item => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${item.title || 'Untitled Project'}</h3>
                  ${item.description ? `
                    <p style="margin: 0.5rem 0; color: var(--text-secondary); line-height: 1.6;">${item.description}</p>
                  ` : ''}
                  <div style="display: flex; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap;">
                    ${item.completionDate ? `
                      <span style="font-size: 0.9rem; color: var(--text-secondary);">
                        <i class="ph ph-calendar"></i> Completed: ${new Date(item.completionDate).toLocaleDateString()}
                      </span>
                    ` : ''}
                    ${item.link ? `
                      <a href="${item.link}" target="_blank" style="font-size: 0.9rem; color: var(--color-primary); text-decoration: none;">
                        <i class="ph ph-link"></i> View Project
                      </a>
                    ` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No portfolio items added yet</p>
          `}
        </div>
      </div>
    `;

    // Endorsements Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-handshake"></i> Endorsements</h2>
        </div>
        <div class="card-body">
          ${profile.endorsements && profile.endorsements.length > 0 ? `
            <div style="display: grid; gap: 1rem;">
              ${profile.endorsements.map(endorsement => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md); border-left: 3px solid var(--color-success);">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${endorsement.endorserName || 'Anonymous'}</h3>
                      <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">${endorsement.comment || 'No comment'}</p>
                      ${endorsement.date ? `
                        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem; color: var(--text-secondary);">
                          <i class="ph ph-calendar"></i> ${new Date(endorsement.date).toLocaleDateString()}
                        </p>
                      ` : ''}
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No endorsements received yet</p>
          `}
        </div>
      </div>
    `;

    return html;
  }

  function renderEntityProfile(user, profile) {
    let html = '';

    // Company Information Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-buildings"></i> Company Information</h2>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            <div>
              <label class="form-label">Company Name</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.companyName || 'Not provided'}</p>
            </div>
            ${profile.legalName ? `
              <div>
                <label class="form-label">Legal Name</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.legalName}</p>
              </div>
            ` : ''}
            <div>
              <label class="form-label">Email</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${user.email || 'Not provided'}</p>
            </div>
            <div>
              <label class="form-label">Phone</label>
              <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.phone || user.mobile || 'Not provided'}</p>
            </div>
            ${profile.website ? `
              <div>
                <label class="form-label">Website</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">
                  <a href="${profile.website}" target="_blank" style="color: var(--color-primary);">${profile.website}</a>
                </p>
              </div>
            ` : ''}
            ${profile.yearsInBusiness ? `
              <div>
                <label class="form-label">Years in Business</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.yearsInBusiness} years</p>
              </div>
            ` : ''}
            ${profile.employeeCount ? `
              <div>
                <label class="form-label">Employee Count</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.employeeCount}</p>
              </div>
            ` : ''}
            ${profile.annualRevenueRange ? `
              <div>
                <label class="form-label">Annual Revenue Range</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.annualRevenueRange} SAR</p>
              </div>
            ` : ''}
          </div>
          ${profile.location ? `
            <div style="margin-top: 1.5rem;">
              <label class="form-label">Headquarters</label>
              <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">
                ${profile.location.headquarters ? 
                  `${profile.location.headquarters.address || ''}${profile.location.headquarters.city ? ', ' + profile.location.headquarters.city : ''}${profile.location.headquarters.region ? ', ' + profile.location.headquarters.region : ''}${profile.location.headquarters.country ? ', ' + profile.location.headquarters.country : ''}`.replace(/^,\s*|,\s*$/g, '') 
                  : 'Not provided'}
              </p>
            </div>
          ` : ''}
          ${profile.location && profile.location.branches && profile.location.branches.length > 0 ? `
            <div style="margin-top: 1.5rem;">
              <label class="form-label">Branches</label>
              <div style="margin-top: 0.5rem;">
                ${profile.location.branches.map(branch => `
                  <p style="margin: 0.5rem 0; color: var(--text-secondary);">
                    ${branch.city || ''}${branch.region ? ', ' + branch.region : ''}${branch.country ? ', ' + branch.country : ''}
                  </p>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${profile.companyDescription ? `
            <div style="margin-top: 1.5rem;">
              <label class="form-label">Company Description</label>
              <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary); line-height: 1.6;">${profile.companyDescription}</p>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Business Credentials Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-file-text"></i> Business Credentials</h2>
        </div>
        <div class="card-body">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
            ${profile.commercialRegistration ? `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                <label class="form-label">Commercial Registration</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem; font-weight: 600;">${profile.commercialRegistration.number || 'N/A'}</p>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                  ${profile.commercialRegistration.issueDate ? `
                    <span style="font-size: 0.9rem; color: var(--text-secondary);">
                      <i class="ph ph-calendar"></i> Issued: ${new Date(profile.commercialRegistration.issueDate).toLocaleDateString()}
                    </span>
                  ` : ''}
                  ${profile.commercialRegistration.expiryDate ? `
                    <span style="font-size: 0.9rem; color: ${new Date(profile.commercialRegistration.expiryDate) < new Date() ? 'var(--color-error)' : 'var(--text-secondary)'};">
                      <i class="ph ph-calendar-check"></i> Expires: ${new Date(profile.commercialRegistration.expiryDate).toLocaleDateString()}
                    </span>
                  ` : ''}
                  ${profile.commercialRegistration.verified ? `
                    <span class="badge badge-success">Verified</span>
                  ` : `
                    <span class="badge badge-warning">Pending Verification</span>
                  `}
                </div>
              </div>
            ` : ''}
            ${profile.vatNumber ? `
              <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                <label class="form-label">VAT Number</label>
                <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem; font-weight: 600;">${profile.vatNumber.number || 'N/A'}</p>
                <div style="margin-top: 0.5rem;">
                  ${profile.vatNumber.verified ? `
                    <span class="badge badge-success">Verified</span>
                  ` : `
                    <span class="badge badge-warning">Pending Verification</span>
                  `}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    // Services Offered Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-briefcase"></i> Services Offered</h2>
        </div>
        <div class="card-body">
          ${profile.services && profile.services.length > 0 ? `
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
              ${profile.services.map(service => `
                <span class="badge badge-primary">${service}</span>
              `).join('')}
            </div>
            ${profile.serviceDescriptions && Object.keys(profile.serviceDescriptions).length > 0 ? `
              <div style="display: grid; gap: 1rem;">
                ${Object.entries(profile.serviceDescriptions).map(([service, description]) => `
                  <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${service}</h3>
                    <p style="margin: 0; color: var(--text-secondary); line-height: 1.6;">${description}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            ${profile.capacity ? `
              <div style="margin-top: 1.5rem; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                <h3 style="margin: 0 0 1rem 0; font-size: 1.1rem;">Capacity</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  ${profile.capacity.maxProjectValue ? `
                    <div>
                      <label class="form-label">Max Project Value</label>
                      <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${formatCurrency(profile.capacity.maxProjectValue)}</p>
                    </div>
                  ` : ''}
                  ${profile.capacity.concurrentProjects ? `
                    <div>
                      <label class="form-label">Concurrent Projects</label>
                      <p style="margin: 0.5rem 0 0 0; font-size: 1.1rem;">${profile.capacity.concurrentProjects}</p>
                    </div>
                  ` : ''}
                </div>
              </div>
            ` : ''}
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No services added yet</p>
          `}
        </div>
      </div>
    `;

    // Credentials Section
    html += renderCredentialsSection(profile.credentials || user.documents || []);

    // Key Projects Section
    html += `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header">
          <h2 style="margin: 0;"><i class="ph ph-folder-open"></i> Key Projects</h2>
        </div>
        <div class="card-body">
          ${profile.keyProjects && profile.keyProjects.length > 0 ? `
            <div style="display: grid; gap: 1rem;">
              ${profile.keyProjects.map(project => `
                <div style="padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                      <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">${project.title || 'Untitled Project'}</h3>
                      <div style="display: flex; gap: 1rem; margin-top: 0.5rem; flex-wrap: wrap;">
                        ${project.value ? `
                          <span style="font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="ph ph-currency-circle-dollar"></i> ${formatCurrency(project.value)}
                          </span>
                        ` : ''}
                        ${project.completionDate ? `
                          <span style="font-size: 0.9rem; color: var(--text-secondary);">
                            <i class="ph ph-calendar"></i> Completed: ${new Date(project.completionDate).toLocaleDateString()}
                          </span>
                        ` : ''}
                        ${project.status ? `
                          <span class="badge badge-${project.status === 'completed' ? 'success' : 'info'}">${project.status}</span>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <p style="color: var(--text-secondary); font-style: italic;">No key projects added yet</p>
          `}
        </div>
      </div>
    `;

    // Financial Health Section (if available)
    if (profile.financialHealth) {
      html += `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-chart-line-up"></i> Financial Health</h2>
          </div>
          <div class="card-body">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
              ${profile.financialHealth.activeJVs !== undefined ? `
                <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <p style="margin: 0; font-size: 2rem; font-weight: 600; color: var(--color-primary);">${profile.financialHealth.activeJVs}</p>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Active JVs</p>
                </div>
              ` : ''}
              ${profile.financialHealth.activeTenders !== undefined ? `
                <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <p style="margin: 0; font-size: 2rem; font-weight: 600; color: var(--color-primary);">${profile.financialHealth.activeTenders}</p>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Active Tenders</p>
                </div>
              ` : ''}
              ${profile.financialHealth.totalJVValue !== undefined ? `
                <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <p style="margin: 0; font-size: 2rem; font-weight: 600; color: var(--color-primary);">${formatCurrency(profile.financialHealth.totalJVValue)}</p>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Total JV Value</p>
                </div>
              ` : ''}
              ${profile.financialHealth.totalSavings !== undefined ? `
                <div style="text-align: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <p style="margin: 0; font-size: 2rem; font-weight: 600; color: var(--color-success);">${formatCurrency(profile.financialHealth.totalSavings)}</p>
                  <p style="margin: 0.5rem 0 0 0; color: var(--text-secondary);">Total Savings</p>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    }

    return html;
  }

  function renderCredentialsSection(credentials) {
    if (!credentials || credentials.length === 0) {
      return `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <h2 style="margin: 0;"><i class="ph ph-file-text"></i> Credentials</h2>
          </div>
          <div class="card-body">
            <p style="color: var(--text-secondary); font-style: italic;">No credentials uploaded yet</p>
          </div>
        </div>
      `;
    }

    return `
      <div class="card" style="margin-bottom: 2rem;">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
          <h2 style="margin: 0;"><i class="ph ph-file-text"></i> Credentials</h2>
        </div>
        <div class="card-body">
          <div style="display: grid; gap: 1rem;">
            ${credentials.map(doc => {
              const typeLabels = {
                'cr': 'Commercial Registration',
                'vat': 'VAT Certificate',
                'license': 'Professional License',
                'cv': 'CV/Resume',
                'certification': 'Certification'
              };
              const typeLabel = typeLabels[doc.type] || doc.type || 'Document';
              
              return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--bg-secondary); border-radius: var(--radius-md);">
                  <div style="flex: 1;">
                    <p style="margin: 0; font-weight: 600;">${typeLabel}</p>
                    <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">
                      ${doc.fileName || 'N/A'} • ${doc.fileSize ? formatFileSize(doc.fileSize) : 'N/A'}
                    </p>
                    ${doc.uploadedAt ? `
                      <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.85rem;">
                        <i class="ph ph-calendar"></i> Uploaded: ${new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    ` : ''}
                  </div>
                  <div style="margin-left: 1rem;">
                    <span class="badge badge-${doc.verified ? 'success' : 'warning'}">
                      ${doc.verified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderProfileScoreBreakdown(user) {
    if (!user || !PMTwinData) return '';
    
    try {
      const scoreData = PMTwinData.calculateProfileCompletionScore(user);
      if (typeof scoreData !== 'object' || !scoreData) return '';
      
      const completionScore = scoreData.completionScore || 0;
      const verificationScore = scoreData.verificationScore || 0;
      const totalScore = scoreData.score || 0;
      
      return `
        <div style="min-width: 200px; padding: 1rem; background: rgba(255, 255, 255, 0.5); border-radius: var(--radius-md);">
          <div style="text-align: center; margin-bottom: 1rem;">
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Total Score</p>
            <p style="margin: 0.25rem 0 0 0; font-size: 2rem; font-weight: 600; color: ${totalScore >= 80 ? 'var(--color-success)' : totalScore >= 60 ? 'var(--color-warning)' : 'var(--color-error)'};">
              ${totalScore}%
            </p>
          </div>
          <div style="margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.85rem;">
              <span>Completion:</span>
              <strong>${completionScore}%</strong>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(0, 0, 0, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${completionScore}%; height: 100%; background: var(--color-primary); transition: width 0.3s;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem; font-size: 0.85rem;">
              <span>Verification:</span>
              <strong>${verificationScore}%</strong>
            </div>
            <div style="width: 100%; height: 6px; background: rgba(0, 0, 0, 0.1); border-radius: 3px; overflow: hidden;">
              <div style="width: ${verificationScore}%; height: 100%; background: var(--color-success); transition: width 0.3s;"></div>
            </div>
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Error rendering profile score breakdown:', error);
      return '';
    }
  }

  function formatCurrency(amount) {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-SA', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  function formatFileSize(bytes) {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function editProfile() {
    isEditMode = true;
    loadProfile();
  }

  function cancelEdit() {
    isEditMode = false;
    loadProfile();
  }

  function saveProfile() {
    const form = document.getElementById('profileEditForm');
    if (form) {
      form.dispatchEvent(new Event('submit'));
    }
  }

  // Export
  if (!window.profile) window.profile = {};
  window.profile.profile = {
    init,
    loadProfile,
    editProfile,
    cancelEdit,
    saveProfile,
    handleSaveProfile,
    addSkill,
    removeSkill,
    addCertification,
    removeCertification,
    addPortfolioItem,
    removePortfolioItem,
    addBranch,
    removeBranch,
    addService,
    removeService,
    addKeyProject,
    removeKeyProject
  };

  // Global reference for onclick handlers
  window.profileComponent = window.profile.profile;

})();
