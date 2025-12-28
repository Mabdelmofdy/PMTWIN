/**
 * PMTwin Wizard Component - Guide users to collaboration models
 */

(function() {
  'use strict';

  let currentStep = 0;
  let answers = {};
  const steps = [
    {
      question: "What is your primary goal?",
      options: [
        { value: "resource_sharing", label: "Share resources (equipment, facilities, vehicles)" },
        { value: "joint_venture", label: "Form a joint venture for a specific project" },
        { value: "barter", label: "Exchange services without cash payment" },
        { value: "consortium", label: "Join a consortium for large projects" }
      ]
    },
    {
      question: "What is your role?",
      options: [
        { value: "entity", label: "Company/Entity (Project Owner)" },
        { value: "individual", label: "Individual Professional/Consultant" },
        { value: "both", label: "Both" }
      ]
    },
    {
      question: "What is your project timeline?",
      options: [
        { value: "short", label: "Short-term (less than 6 months)" },
        { value: "medium", label: "Medium-term (6-18 months)" },
        { value: "long", label: "Long-term (18+ months)" }
      ]
    },
    {
      question: "What is your budget preference?",
      options: [
        { value: "cash", label: "Cash-based transactions" },
        { value: "barter", label: "Barter/exchange-based" },
        { value: "mixed", label: "Mixed (cash + barter)" }
      ]
    }
  ];

  const recommendations = {
    resource_sharing_entity_medium_mixed: {
      model: "Resource Sharing Agreement",
      description: "Perfect for sharing equipment, facilities, and vehicles on a medium-term basis with flexible payment options.",
      link: "#collaboration?model=resource_sharing"
    },
    joint_venture_entity_long_cash: {
      model: "Joint Venture (JV)",
      description: "Ideal for long-term projects requiring shared investment and risk. Cash-based structure provides clarity.",
      link: "#collaboration?model=joint_venture"
    },
    barter_individual_short_barter: {
      model: "Barter Exchange",
      description: "Exchange services directly without cash. Great for short-term collaborations between professionals.",
      link: "#collaboration?model=barter"
    },
    consortium_entity_long_mixed: {
      model: "Consortium",
      description: "Join forces with multiple partners for large-scale projects. Mixed payment structure offers flexibility.",
      link: "#collaboration?model=consortium"
    }
  };

  function init(params) {
    currentStep = 0;
    answers = {};
    renderStep();
  }

  function renderStep() {
    const container = document.getElementById('wizardSteps');
    if (!container) return;

    if (currentStep >= steps.length) {
      showResults();
      return;
    }

    const step = steps[currentStep];
    const prevBtn = document.getElementById('wizardPrevBtn');
    const nextBtn = document.getElementById('wizardNextBtn');
    const resultsDiv = document.getElementById('wizardResults');

    if (prevBtn) prevBtn.style.display = currentStep > 0 ? 'block' : 'none';
    if (nextBtn) nextBtn.textContent = currentStep === steps.length - 1 ? 'Get Recommendation' : 'Next';
    if (resultsDiv) resultsDiv.style.display = 'none';

    let html = `
      <div class="card">
        <div class="card-body">
          <div style="text-align: center; margin-bottom: 2rem;">
            <p style="color: var(--text-secondary);">Step ${currentStep + 1} of ${steps.length}</p>
            <div style="display: flex; justify-content: center; gap: 0.5rem; margin-top: 1rem;">
              ${steps.map((_, i) => `
                <div style="width: 30px; height: 4px; background: ${i <= currentStep ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 2px;"></div>
              `).join('')}
            </div>
          </div>
          <h2 style="text-align: center; margin-bottom: 2rem;">${step.question}</h2>
          <div style="display: grid; gap: 1rem;">
    `;

    step.options.forEach(option => {
      const isSelected = answers[`step${currentStep}`] === option.value;
      html += `
        <label style="display: block; cursor: pointer; padding: 1rem; border: 2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}; border-radius: 8px; transition: all 0.2s;">
          <input type="radio" name="wizardStep${currentStep}" value="${option.value}" 
                 ${isSelected ? 'checked' : ''} 
                 onchange="wizardComponent.selectOption(${currentStep}, '${option.value}')"
                 style="margin-right: 0.5rem;">
          ${option.label}
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
    renderStep();
  }

  function nextStep() {
    if (!answers[`step${currentStep}`]) {
      alert('Please select an option');
      return;
    }

    if (currentStep < steps.length - 1) {
      currentStep++;
      renderStep();
    } else {
      showResults();
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

    // Generate recommendation key
    const key = `${answers.step0}_${answers.step1}_${answers.step2}_${answers.step3}`;
    const recommendation = recommendations[key] || {
      model: "General Collaboration",
      description: "Based on your answers, we recommend exploring our collaboration models to find the best fit for your needs.",
      link: "#collaboration"
    };

    if (resultsDiv) {
      resultsDiv.style.display = 'block';
      resultsDiv.innerHTML = `
        <div class="card">
          <div class="card-body" style="text-align: center;">
            <h2 style="margin-bottom: 1rem;">Your Recommended Model</h2>
            <h3 style="color: var(--primary); margin-bottom: 1rem;">${recommendation.model}</h3>
            <p style="margin-bottom: 2rem; color: var(--text-secondary);">${recommendation.description}</p>
            <div style="display: flex; gap: 1rem; justify-content: center;">
              <a href="${recommendation.link}" class="btn btn-primary btn-lg">Explore This Model</a>
              <button onclick="wizardComponent.restart()" class="btn btn-secondary btn-lg">Start Over</button>
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

