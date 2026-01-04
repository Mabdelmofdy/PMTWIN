/**
 * Knowledge Hub Component
 */

(function() {
  'use strict';

  const categories = [
    {
      id: 'spv',
      title: 'Special Purpose Vehicles (SPV)',
      icon: '<i class="ph ph-buildings"></i>',
      description: 'Learn about SPVs and how they work'
    },
    {
      id: 'barter',
      title: 'Barter Systems',
      icon: '<i class="ph ph-arrow-clockwise"></i>',
      description: 'Understanding barter exchanges'
    },
    {
      id: 'collaboration',
      title: 'Collaboration Models',
      icon: '<i class="ph ph-handshake"></i>',
      description: 'Different ways to collaborate'
    },
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      icon: '<i class="ph ph-question"></i>',
      description: 'Common questions and answers'
    }
  ];

  const articles = {
    spv: [
      {
        id: 'spv-1',
        title: 'What is a Special Purpose Vehicle (SPV)?',
        content: 'A Special Purpose Vehicle (SPV) is a legal entity created for a specific project or purpose. In construction, SPVs allow multiple parties to collaborate on a project while maintaining separate legal and financial structures.',
        tags: ['SPV', 'Legal', 'Basics']
      },
      {
        id: 'spv-2',
        title: 'Benefits of Using SPVs in Construction',
        content: 'SPVs provide risk isolation, clear ownership structures, and flexible financing options. They allow companies to collaborate on large projects without merging their entire operations.',
        tags: ['SPV', 'Benefits', 'Risk Management']
      }
    ],
    barter: [
      {
        id: 'barter-1',
        title: 'Introduction to Barter Systems',
        content: 'Barter systems allow companies to exchange services and resources without cash transactions. This can help optimize resource utilization and reduce cash flow requirements.',
        tags: ['Barter', 'Basics', 'Exchange']
      },
      {
        id: 'barter-2',
        title: 'How to Structure a Barter Agreement',
        content: 'A good barter agreement should clearly define the services being exchanged, their values, timelines, and quality standards. Both parties should agree on the equivalence of the exchange.',
        tags: ['Barter', 'Agreements', 'Legal']
      }
    ],
    collaboration: [
      {
        id: 'collab-1',
        title: 'Types of Collaboration Models',
        content: 'PMTwin supports various collaboration models including Joint Ventures, SPVs, Barter Exchanges, and Resource Sharing Agreements. Each model suits different project needs and partnership structures.',
        tags: ['Collaboration', 'Models', 'Overview']
      },
      {
        id: 'collab-2',
        title: 'Choosing the Right Collaboration Model',
        content: 'Consider factors like project duration, budget structure, risk sharing, and partner relationships when choosing a collaboration model. Use the PMTwin Wizard to find the best fit.',
        tags: ['Collaboration', 'Selection', 'Guidance']
      }
    ],
    faq: [
      {
        id: 'faq-1',
        title: 'How do I get started on PMTwin?',
        content: 'Sign up for an account, complete your profile, and verify your credentials. Once approved, you can browse projects, submit proposals, or create your own projects.',
        tags: ['Getting Started', 'Account', 'Onboarding']
      },
      {
        id: 'faq-2',
        title: 'What documents do I need to register?',
        content: 'Companies need Commercial Registration (CR) and VAT certificates. Individual professionals need professional licenses and CVs. All documents are verified by our admin team.',
        tags: ['Registration', 'Documents', 'Verification']
      },
      {
        id: 'faq-3',
        title: 'How does the matching algorithm work?',
        content: 'Our algorithm matches projects with providers based on category, skills, experience, and location. Matches above 80% are automatically notified to relevant providers.',
        tags: ['Matching', 'Algorithm', 'How It Works']
      }
    ]
  };

  let currentCategory = null;
  let searchQuery = '';

  function init(params) {
    renderCategories();
    renderAllArticles();
  }

  function renderCategories() {
    const container = document.getElementById('knowledgeCategories');
    if (!container) return;

    let html = '';
    categories.forEach(category => {
      html += `
        <div class="card enhanced-card" style="cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;" 
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='';"
             onclick="knowledgeComponent.filterByCategory('${category.id}')">
          <div class="card-body" style="text-align: center; padding: var(--spacing-6);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-4); color: var(--color-primary);">${category.icon}</div>
            <h3 style="margin: 0 0 var(--spacing-3) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${category.title}</h3>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.5;">${category.description}</p>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  function renderAllArticles() {
    const container = document.getElementById('knowledgeArticles');
    if (!container) return;

    let allArticles = [];
    Object.keys(articles).forEach(categoryId => {
      articles[categoryId].forEach(article => {
        allArticles.push({ ...article, category: categoryId });
      });
    });

    renderArticlesList(container, allArticles);
  }

  function filterByCategory(categoryId) {
    currentCategory = categoryId;
    const container = document.getElementById('knowledgeArticles');
    if (!container) return;

    const categoryArticles = articles[categoryId] || [];
    renderArticlesList(container, categoryArticles.map(a => ({ ...a, category: categoryId })));
  }

  function search(event) {
    event.preventDefault();
    const query = document.getElementById('knowledgeSearch')?.value.toLowerCase() || '';
    searchQuery = query;

    const container = document.getElementById('knowledgeArticles');
    if (!container) return;

    let allArticles = [];
    Object.keys(articles).forEach(categoryId => {
      articles[categoryId].forEach(article => {
        if (!query || 
            article.title.toLowerCase().includes(query) || 
            article.content.toLowerCase().includes(query) ||
            article.tags.some(tag => tag.toLowerCase().includes(query))) {
          allArticles.push({ ...article, category: categoryId });
        }
      });
    });

    renderArticlesList(container, allArticles);
  }

  function renderArticlesList(container, articlesList) {
    if (articlesList.length === 0) {
      container.innerHTML = `
        <div class="card enhanced-card">
          <div class="card-body" style="text-align: center; padding: var(--spacing-8);">
            <i class="ph ph-magnifying-glass" style="font-size: 3rem; color: var(--text-secondary); margin-bottom: var(--spacing-4);"></i>
            <p style="font-size: var(--font-size-lg); color: var(--text-secondary); margin-bottom: var(--spacing-4);">No articles found.</p>
            <button onclick="knowledgeComponent.clearFilters()" class="btn btn-primary">Show All Articles</button>
          </div>
        </div>
      `;
      return;
    }

    // Add section title if filtered
    let sectionTitle = '';
    if (currentCategory) {
      const category = categories.find(c => c.id === currentCategory);
      sectionTitle = `<h2 class="section-title spacing-section">${category?.title || 'Articles'}</h2>`;
    } else if (searchQuery) {
      sectionTitle = `<h2 class="section-title spacing-section">Search Results for "${searchQuery}"</h2>`;
    } else {
      sectionTitle = `<h2 class="section-title spacing-section">All Articles</h2>`;
    }

    let html = sectionTitle + '<div style="display: grid; gap: var(--spacing-5);">';
    
    articlesList.forEach(article => {
      const category = categories.find(c => c.id === article.category);
      html += `
        <div class="card enhanced-card">
          <div class="card-body">
            <div style="display: flex; align-items: start; gap: var(--spacing-5);">
              <div style="font-size: 2.5rem; color: var(--color-primary); flex-shrink: 0;">${category?.icon || '<i class="ph ph-file-text"></i>'}</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 var(--spacing-3) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary);">${article.title}</h3>
                <p style="margin: 0 0 var(--spacing-4) 0; color: var(--text-secondary); line-height: 1.6;">${article.content}</p>
                <div style="display: flex; gap: var(--spacing-2); flex-wrap: wrap;">
                  ${article.tags.map(tag => `
                    <span class="badge badge-secondary" style="font-size: var(--font-size-sm);">${tag}</span>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function clearFilters() {
    currentCategory = null;
    searchQuery = '';
    document.getElementById('knowledgeSearchForm')?.reset();
    renderAllArticles();
  }

  // Export
  if (!window.public) window.public = {};
  window.public.knowledge = {
    init,
    filterByCategory,
    search,
    clearFilters
  };

  // Global reference for onclick handlers
  window.knowledgeComponent = window.public.knowledge;

})();

