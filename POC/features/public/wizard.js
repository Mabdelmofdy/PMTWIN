/**
 * PMTwin Wizard Component - Guide users to collaboration models
 */

(function() {
  'use strict';

  let currentStep = 0;
  let answers = {};
  const totalSteps = 4;
  
  // Step definitions based on BRD
  function getSteps() {
    const steps = [
      {
        id: 1,
        question: "What are you looking for?",
        options: [
          { value: "find_partners", label: "Find Partners", icon: "ph-handshake", description: "Looking for companies or professionals to collaborate with" },
          { value: "find_projects", label: "Find Projects", icon: "ph-buildings", description: "Seeking project opportunities to work on" },
          { value: "learn_more", label: "Learn More", icon: "ph-book", description: "Want to understand how PMTwin works" },
          { value: "other", label: "Other", icon: "ph-question", description: "Have a different goal in mind" }
        ]
      },
      {
        id: 2,
        question: "Are you representing a company or yourself?",
        options: [
          { value: "entity", label: "Company/Entity", icon: "ph-buildings", description: "I represent a company, organization, or entity" },
          { value: "individual", label: "Individual Professional", icon: "ph-user", description: "I am an individual professional or consultant" }
        ]
      },
      {
        id: 3,
        question: "What type of collaboration interests you?",
        options: [
          { value: "joint_venture", label: "Joint Venture (JV)", icon: "ph-handshake", description: "Form a joint venture for a specific project" },
          { value: "consortium", label: "Consortium", icon: "ph-users-three", description: "Join a consortium for large projects" },
          { value: "service_provider", label: "Service Provider", icon: "ph-briefcase", description: "Offer services to project owners" },
          { value: "barter", label: "Barter Exchange", icon: "ph-arrows-clockwise", description: "Exchange services without cash payment" }
        ],
        condition: () => answers.step1 === 'entity' // Only show for entities
      },
      {
        id: 4,
        question: "Recommendation",
        isResult: true
      }
    ];
    
    // Filter steps based on conditions
    return steps.filter(step => {
      if (step.condition && !step.condition()) {
        return false;
      }
      return true;
    });
  }

  function getRecommendation() {
    const intent = answers.step0;
    const entityType = answers.step1;
    const collaborationType = answers.step2;
    
    // Determine recommendation based on answers
    if (intent === 'learn_more') {
      return {
        model: "Knowledge Hub",
        description: "Start by exploring our Knowledge Hub to learn about collaboration models, SPVs, barter systems, and best practices.",
        benefits: [
          "Comprehensive guides and articles",
          "Real-world examples and case studies",
          "FAQ section for common questions"
        ],
        link: "../knowledge/",
        cta: "Explore Knowledge Hub"
      };
    }
    
    if (entityType === 'individual') {
      if (intent === 'find_projects') {
        return {
          model: "Task-Based Opportunities",
          description: "As an individual professional, you can browse task-based opportunities and submit proposals for projects that match your skills.",
          benefits: [
            "Browse available project opportunities",
            "Submit proposals for matching projects",
            "Build your professional profile",
            "Access collaboration opportunities"
          ],
          link: "../auth/signup/?type=individual",
          cta: "Sign Up as Individual"
        };
      } else {
        return {
          model: "Professional Services",
          description: "Join as an individual professional to offer your expertise, find project opportunities, and collaborate with entities.",
          benefits: [
            "Create professional profile",
            "Browse and apply to opportunities",
            "Submit proposals",
            "Build your portfolio"
          ],
          link: "../auth/signup/?type=individual",
          cta: "Sign Up as Individual"
        };
      }
    }
    
    // Entity recommendations
    if (collaborationType === 'joint_venture') {
      return {
        model: "Joint Venture (JV)",
        description: "Form a joint venture with partners to share investment, risk, and profits for a specific project. Ideal for large-scale projects requiring combined expertise and resources.",
        benefits: [
          "Shared investment and risk",
          "Combined expertise and resources",
          "Clear profit-sharing structure",
          "Legal framework for collaboration"
        ],
        link: "../collaboration/joint-venture/",
        cta: "Explore Joint Ventures"
      };
    } else if (collaborationType === 'consortium') {
      return {
        model: "Consortium",
        description: "Join or form a consortium with multiple partners to bid on and execute large-scale projects. Perfect for mega-projects requiring diverse capabilities.",
        benefits: [
          "Pool resources with multiple partners",
          "Bid on larger projects together",
          "Share risks and rewards",
          "Access to diverse expertise"
        ],
        link: "../collaboration/consortium/",
        cta: "Explore Consortia"
      };
    } else if (collaborationType === 'service_provider') {
      return {
        model: "Service Provider",
        description: "Register as a service provider to offer your services to project owners. Browse service requests and submit proposals.",
        benefits: [
          "Browse service requests",
          "Submit service proposals",
          "Manage service engagements",
          "Build service provider profile"
        ],
        link: "../auth/signup/?type=entity",
        cta: "Sign Up as Service Provider"
      };
    } else if (collaborationType === 'barter') {
      return {
        model: "Barter Exchange",
        description: "Exchange services with other entities without cash transactions. Perfect for companies looking to optimize resources and reduce cash flow requirements.",
        benefits: [
          "Exchange services without cash",
          "Optimize resource utilization",
          "Reduce cash flow requirements",
          "Build strategic partnerships"
        ],
        link: "../collaboration/resource-exchange/",
        cta: "Explore Barter Exchange"
      };
    }
    
    // Default recommendation
    return {
      model: "Project-Based Collaboration",
      description: "Create mega-projects and find partners through our intelligent matching system. Choose from various collaboration models based on your needs.",
      benefits: [
        "Create and publish projects",
        "AI-powered partner matching",
        "Multiple collaboration models",
        "Flexible payment options"
      ],
      link: "../auth/signup/?type=entity",
      cta: "Sign Up as Entity"
    };
  }

  function init(params) {
    currentStep = 0;
    answers = {};
    renderStep();
  }

  function renderStep() {
    const container = document.getElementById('wizardSteps');
    if (!container) return;

    const steps = getSteps();
    let step;
    
    // Map currentStep to actual step
    if (currentStep === 0) {
      step = steps[0]; // Step 1: Intent
    } else if (currentStep === 1) {
      step = steps[1]; // Step 2: Entity Type
    } else if (currentStep === 2) {
      // Step 3: Collaboration Model (only for entities)
      if (answers.step1 === 'entity') {
        step = steps[2];
      } else {
        // Skip to results for individuals
        showResults();
        return;
      }
    } else {
      showResults();
      return;
    }
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');
    const resultsDiv = document.getElementById('wizardResults');

    if (prevBtn) prevBtn.style.display = currentStep > 0 ? 'block' : 'none';
    if (nextBtn) {
      const isLastStep = currentStep === totalSteps - 1 || (step.id === 3 && answers.step1 === 'individual');
      nextBtn.textContent = isLastStep ? 'Get Recommendation' : 'Next';
      nextBtn.disabled = !answers[`step${currentStep}`];
    }
    if (resultsDiv) resultsDiv.style.display = 'none';

    // Calculate progress
    const progress = ((currentStep + 1) / totalSteps) * 100;

    let html = `
      <div class="card" style="max-width: 700px; margin: 0 auto;">
        <div class="card-body" style="padding: 3rem;">
          <!-- Progress Indicator -->
          <div style="text-align: center; margin-bottom: 3rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; position: relative;">
              ${Array.from({length: totalSteps}, (_, i) => {
                const stepNum = i + 1;
                const isActive = stepNum <= currentStep + 1;
                const isCurrent = stepNum === currentStep + 1;
                return `
                  <div style="display: flex; flex-direction: column; align-items: center; flex: 1; position: relative; z-index: 2;">
                    <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isActive ? 'var(--color-primary, #2563eb)' : 'var(--bg-secondary, #f3f4f6)'}; color: ${isActive ? 'white' : 'var(--text-secondary)'}; display: flex; align-items: center; justify-content: center; font-weight: 600; border: 3px solid ${isCurrent ? 'var(--color-primary, #2563eb)' : 'transparent'}; box-shadow: ${isCurrent ? '0 0 0 4px rgba(37, 99, 235, 0.2)' : 'none'}; transition: all 0.3s ease;">
                      ${isActive && stepNum < currentStep + 1 ? '<i class="ph ph-check"></i>' : stepNum}
                    </div>
                    ${i < totalSteps - 1 ? `
                      <div style="position: absolute; top: 20px; left: 50%; width: 100%; height: 3px; background: ${stepNum <= currentStep ? 'var(--color-primary, #2563eb)' : 'var(--bg-secondary, #f3f4f6)'}; z-index: 1; transform: translateX(20px);"></div>
                    ` : ''}
                  </div>
                `;
              }).join('')}
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem;">Step ${currentStep + 1} of ${totalSteps}</p>
          </div>
          
          <h2 style="text-align: center; margin-bottom: 3rem; font-size: 1.75rem; font-weight: 600;">${step.question}</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem;">
    `;

    step.options.forEach(option => {
      const isSelected = answers[`step${currentStep}`] === option.value;
      html += `
        <label style="display: block; cursor: pointer; padding: 1.5rem; border: 2px solid ${isSelected ? 'var(--color-primary, #2563eb)' : 'var(--border-color, #e5e7eb)'}; border-radius: 12px; transition: all 0.3s ease; background: ${isSelected ? 'rgba(37, 99, 235, 0.05)' : 'var(--bg-primary, white)'};" 
               onmouseover="this.style.borderColor='var(--color-primary)'; this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)';" 
               onmouseout="this.style.borderColor='${isSelected ? 'var(--color-primary)' : 'var(--border-color)'}'; this.style.transform=''; this.style.boxShadow='';">
          <input type="radio" name="wizardStep${currentStep}" value="${option.value}" 
                 ${isSelected ? 'checked' : ''} 
                 onchange="wizardComponent.selectOption(${currentStep}, '${option.value}')"
                 style="display: none;">
          <div style="text-align: center;">
            <i class="ph ${option.icon || 'ph-circle'}" style="font-size: 2.5rem; color: ${isSelected ? 'var(--color-primary)' : 'var(--text-secondary)'}; margin-bottom: 1rem;"></i>
            <div style="font-weight: 600; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--text-primary);">${option.label}</div>
            ${option.description ? `<div style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${option.description}</div>` : ''}
          </div>
        </label>
      `;
    });

    html += `
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  }

  function selectOption(step, value) {
    answers[`step${step}`] = value;
    
    // Auto-advance for step 1 if individual is selected (skip step 3)
    if (step === 1 && value === 'individual') {
      // Skip step 3 (collaboration model) for individuals
      const nextBtn = document.getElementById('wizardNextBtn');
      if (nextBtn) nextBtn.disabled = false;
    }
    
    renderStep();
  }

  function nextStep() {
    if (!answers[`step${currentStep}`]) {
      alert('Please select an option to continue');
      return;
    }

    // Skip step 3 if individual is selected
    if (currentStep === 1 && answers.step1 === 'individual') {
      currentStep = 2; // Mark as done, will show results
      showResults();
      return;
    }

    // Check if we should show step 3 (collaboration model) or go to results
    if (currentStep === 1 && answers.step1 === 'entity') {
      currentStep = 2; // Go to step 3 (collaboration model)
      renderStep();
    } else if (currentStep === 2) {
      // Step 3 complete, show results
      showResults();
    } else {
      currentStep++;
      renderStep();
    }
  }

  function previousStep() {
    if (currentStep > 0) {
      currentStep--;
      renderStep();
    }
  }

  function showResults() {
    const container = document.getElementById('wizardSteps');
    const navDiv = document.getElementById('wizardNavigation');
    const resultsDiv = document.getElementById('wizardResults');

    if (navDiv) navDiv.style.display = 'none';
    if (container) container.style.display = 'none';

    const recommendation = getRecommendation();

    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div class="card" style="max-width: 800px; margin: 0 auto;">
          <div class="card-body" style="padding: 3rem;">
            <div style="text-align: center; margin-bottom: 3rem;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, var(--color-primary, #2563eb), var(--color-primary-light, #60a5fa)); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; box-shadow: 0 8px 24px rgba(37, 99, 235, 0.3);">
                <i class="ph ph-check-circle" style="font-size: 3rem; color: white;"></i>
              </div>
              <h2 style="margin-bottom: 1rem; font-size: 2rem; font-weight: 700;">Your Recommended Path</h2>
              <h3 style="color: var(--color-primary, #2563eb); margin-bottom: 1.5rem; font-size: 1.5rem; font-weight: 600;">${recommendation.model}</h3>
              <p style="margin-bottom: 2rem; color: var(--text-secondary); font-size: 1.1rem; line-height: 1.6; max-width: 600px; margin-left: auto; margin-right: auto;">
                ${recommendation.description}
              </p>
            </div>
            
            ${recommendation.benefits && recommendation.benefits.length > 0 ? `
              <div style="background: var(--bg-secondary, #f9fafb); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1.5rem; font-size: 1.2rem; font-weight: 600;">Benefits of this path:</h4>
                <ul style="list-style: none; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                  ${recommendation.benefits.map(benefit => `
                    <li style="display: flex; align-items: start; gap: 0.75rem;">
                      <i class="ph ph-check-circle" style="color: var(--color-success, #10b981); font-size: 1.25rem; flex-shrink: 0; margin-top: 0.125rem;"></i>
                      <span style="color: var(--text-primary); line-height: 1.5;">${benefit}</span>
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <a href="${recommendation.link}" class="btn btn-primary btn-lg" style="text-decoration: none; padding: 1rem 2rem; font-size: 1.1rem; font-weight: 600;">
                <i class="ph ph-arrow-right"></i> ${recommendation.cta || 'Get Started'}
              </a>
              <button onclick="wizardComponent.restart()" class="btn btn-secondary btn-lg" style="padding: 1rem 2rem; font-size: 1.1rem;">
                <i class="ph ph-arrow-clockwise"></i> Start Over
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  function restart() {
    currentStep = 0;
    answers = {};
    const navDiv = document.getElementById('wizardNavigation');
    const resultsDiv = document.getElementById('wizardResults');
    const container = document.getElementById('wizardSteps');

    if (navDiv) navDiv.style.display = 'flex';
    if (resultsDiv) resultsDiv.style.display = 'none';
    if (container) container.style.display = 'block';
    renderStep();
  }

  // Export
  if (!window.public) window.public = {};
  window.public.wizard = {
    init,
    selectOption,
    nextStep,
    previousStep,
    restart
  };

  // Global reference for onclick handlers
  window.wizardComponent = window.public.wizard;

})();

