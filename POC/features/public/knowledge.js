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
        type: 'full-article',
        content: `
          <h2>Introduction</h2>
          <p>A Special Purpose Vehicle (SPV), also known as a Special Purpose Entity (SPE), is a legal entity created for a specific project or purpose. In the construction industry, SPVs have become an essential tool for managing large-scale projects, particularly mega-projects with budgets exceeding 50 million SAR.</p>
          
          <h2>Definition and Purpose</h2>
          <p>An SPV is a separate legal entity established specifically to undertake a particular project. Unlike a regular company, an SPV is created with a single, well-defined purpose and typically has a limited lifespan tied to the project's duration.</p>
          
          <h2>Use Cases in Construction</h2>
          <p>SPVs are commonly used in construction for:</p>
          <ul>
            <li><strong>Mega-Projects:</strong> Large infrastructure projects requiring significant capital investment</li>
            <li><strong>Risk Isolation:</strong> Separating project risks from parent companies' balance sheets</li>
            <li><strong>Multi-Party Collaboration:</strong> Allowing multiple companies to collaborate without merging operations</li>
            <li><strong>Financing:</strong> Facilitating project-specific financing and investment structures</li>
            <li><strong>Legal Protection:</strong> Providing legal separation between project and parent entities</li>
          </ul>
          
          <h2>Benefits of SPVs</h2>
          <h3>Risk Management</h3>
          <p>One of the primary benefits of SPVs is risk isolation. If a project faces financial difficulties, the parent companies' other operations remain protected. This is particularly important for large construction companies managing multiple projects simultaneously.</p>
          
          <h3>Clear Ownership Structure</h3>
          <p>SPVs provide a transparent ownership structure where each partner's stake is clearly defined. This clarity helps in decision-making, profit-sharing, and dispute resolution.</p>
          
          <h3>Flexible Financing</h3>
          <p>SPVs can be structured to attract specific types of financing, including project finance, equity investments, and debt instruments tailored to the project's needs.</p>
          
          <h3>Tax Efficiency</h3>
          <p>In many jurisdictions, SPVs can offer tax advantages, allowing partners to optimize their tax obligations related to the specific project.</p>
          
          <h2>Considerations and Challenges</h2>
          <h3>Setup Complexity</h3>
          <p>Establishing an SPV requires legal expertise and can involve significant setup costs. It's important to work with experienced legal and financial advisors.</p>
          
          <h3>Regulatory Compliance</h3>
          <p>SPVs must comply with all relevant regulations, including corporate law, tax regulations, and industry-specific requirements.</p>
          
          <h3>Ongoing Management</h3>
          <p>SPVs require proper governance and management structures. Partners must agree on decision-making processes, reporting requirements, and operational procedures.</p>
          
          <h2>When to Use an SPV</h2>
          <p>On PMTwin, SPVs are automatically suggested for projects with budgets exceeding 50 million SAR. However, you may also consider an SPV for:</p>
          <ul>
            <li>Projects with multiple partners requiring clear ownership structures</li>
            <li>High-risk projects where risk isolation is important</li>
            <li>Projects requiring specialized financing arrangements</li>
            <li>Long-term projects with complex partnership structures</li>
          </ul>
          
          <h2>How PMTwin Facilitates SPV Creation</h2>
          <p>PMTwin's platform includes tools and guidance for SPV creation:</p>
          <ul>
            <li>Automatic SPV recommendations for qualifying projects</li>
            <li>Templates and checklists for SPV setup</li>
            <li>Integration with legal and financial service providers</li>
            <li>Document management for SPV-related paperwork</li>
          </ul>
          
          <h2>Conclusion</h2>
          <p>SPVs are powerful tools for managing large construction projects, offering risk isolation, clear ownership, and flexible financing. While they require careful setup and management, they can be invaluable for mega-projects and complex collaborations.</p>
        `,
        tags: ['SPV', 'Legal', 'Basics', 'Mega-Projects'],
        tableOfContents: [
          'Introduction',
          'Definition and Purpose',
          'Use Cases in Construction',
          'Benefits of SPVs',
          'Considerations and Challenges',
          'When to Use an SPV',
          'How PMTwin Facilitates SPV Creation',
          'Conclusion'
        ]
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
        title: 'Barter Guide for Construction',
        type: 'full-article',
        content: `
          <h2>Introduction to Barter in Construction</h2>
          <p>Barter exchange is an ancient practice that has found modern applications in the construction industry. On PMTwin, barter allows companies to exchange services, equipment, and resources without cash transactions, optimizing resource utilization and reducing cash flow requirements.</p>
          
          <h2>How PMTwin's Barter System Works</h2>
          <h3>Service Exchange</h3>
          <p>Companies can offer services they provide in exchange for services they need. For example, a construction company might offer excavation services in exchange for architectural design services.</p>
          
          <h3>Resource Exchange</h3>
          <p>Beyond services, companies can exchange physical resources such as:</p>
          <ul>
            <li>Construction equipment (cranes, excavators, etc.)</li>
            <li>Vehicles (trucks, SUVs for site management)</li>
            <li>Office facilities and space</li>
            <li>Materials and supplies</li>
          </ul>
          
          <h2>Value Equivalence Calculation</h2>
          <p>PMTwin uses a sophisticated system to calculate value equivalence:</p>
          <h3>Market-Based Valuation</h3>
          <p>Services and resources are valued based on current market rates. The platform maintains a database of standard rates for common construction services and resources.</p>
          
          <h3>Time-Based Valuation</h3>
          <p>For services, value is calculated based on:</p>
          <ul>
            <li>Professional hourly/daily rates</li>
            <li>Duration of service provision</li>
            <li>Complexity and expertise required</li>
            <li>Market demand for the service</li>
          </ul>
          
          <h3>Resource Valuation</h3>
          <p>Physical resources are valued based on:</p>
          <ul>
            <li>Rental market rates</li>
            <li>Depreciation and condition</li>
            <li>Duration of use</li>
            <li>Replacement or maintenance costs</li>
          </ul>
          
          <h3>Balance Calculation</h3>
          <p>When services or resources don't match exactly in value, PMTwin calculates the balance. Options include:</p>
          <ul>
            <li>Adding a cash component to balance the exchange</li>
            <li>Extending the exchange period</li>
            <li>Including additional services or resources</li>
            <li>Carrying forward the balance to future exchanges</li>
          </ul>
          
          <h2>Success Stories and Examples</h2>
          <h3>Example 1: Equipment Exchange</h3>
          <p><strong>Scenario:</strong> Company A needs a crane for 3 months. Company B needs excavation services for 2 months.</p>
          <p><strong>Solution:</strong> Company A provides excavation services worth 200,000 SAR. Company B provides crane rental worth 180,000 SAR. Company A adds 20,000 SAR cash to balance.</p>
          
          <h3>Example 2: Service Exchange</h3>
          <p><strong>Scenario:</strong> An architectural firm needs construction services. A construction company needs design services.</p>
          <p><strong>Solution:</strong> The architectural firm provides design services for a new project. The construction company provides construction services for the architect's office renovation. Both services valued at 150,000 SAR - perfect match!</p>
          
          <h2>Best Practices for Barter Transactions</h2>
          <h3>Clear Documentation</h3>
          <p>Always document barter agreements clearly, including:</p>
          <ul>
            <li>Detailed description of services/resources exchanged</li>
            <li>Valuation methodology and agreed values</li>
            <li>Timeline and delivery schedules</li>
            <li>Quality standards and acceptance criteria</li>
            <li>Dispute resolution procedures</li>
          </ul>
          
          <h3>Quality Standards</h3>
          <p>Establish clear quality standards upfront. Both parties should agree on what constitutes acceptable delivery of services or condition of resources.</p>
          
          <h3>Timeline Management</h3>
          <p>Coordinate timelines carefully. Ensure that services or resources are available when needed and that delivery schedules are realistic.</p>
          
          <h3>Communication</h3>
          <p>Maintain open communication throughout the exchange. Regular check-ins help ensure both parties are satisfied and any issues are addressed promptly.</p>
          
          <h2>Advantages of Barter in Construction</h2>
          <ul>
            <li><strong>Cash Flow Optimization:</strong> Reduce immediate cash requirements</li>
            <li><strong>Resource Utilization:</strong> Make better use of idle resources</li>
            <li><strong>Cost Savings:</strong> Avoid cash transactions and associated fees</li>
            <li><strong>Partnership Building:</strong> Strengthen relationships with partners</li>
            <li><strong>Flexibility:</strong> Create custom exchange arrangements</li>
          </ul>
          
          <h2>Challenges and How to Overcome Them</h2>
          <h3>Valuation Disputes</h3>
          <p><strong>Challenge:</strong> Parties may disagree on the value of services or resources.</p>
          <p><strong>Solution:</strong> Use PMTwin's market-based valuation system and involve neutral third-party appraisers if needed.</p>
          
          <h3>Timing Mismatches</h3>
          <p><strong>Challenge:</strong> Services or resources may not be needed at the same time.</p>
          <p><strong>Solution:</strong> Use PMTwin's balance tracking system to carry forward credits for future exchanges.</p>
          
          <h3>Quality Issues</h3>
          <p><strong>Challenge:</strong> Disputes over service quality or resource condition.</p>
          <p><strong>Solution:</strong> Establish clear quality standards upfront and use PMTwin's dispute resolution system.</p>
          
          <h2>Getting Started with Barter on PMTwin</h2>
          <ol>
            <li>Complete your profile and list services/resources you can offer</li>
            <li>Browse available barter opportunities</li>
            <li>Submit barter proposals with your exchange offer</li>
            <li>Negotiate terms and finalize the agreement</li>
            <li>Execute the exchange and track progress</li>
            <li>Complete the exchange and provide feedback</li>
          </ol>
          
          <h2>Conclusion</h2>
          <p>Barter exchange offers construction companies a flexible way to optimize resources, reduce cash flow requirements, and build strategic partnerships. With PMTwin's structured approach and valuation system, barter transactions become reliable and beneficial for all parties involved.</p>
        `,
        tags: ['Barter', 'Exchange', 'Resources', 'Best Practices'],
        tableOfContents: [
          'Introduction to Barter in Construction',
          'How PMTwin\'s Barter System Works',
          'Value Equivalence Calculation',
          'Success Stories and Examples',
          'Best Practices for Barter Transactions',
          'Advantages of Barter in Construction',
          'Challenges and How to Overcome Them',
          'Getting Started with Barter on PMTwin',
          'Conclusion'
        ]
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
        content: 'Sign up for an account, complete your profile, and verify your credentials. Once approved, you can browse projects, submit proposals, or create your own projects. Use our PMTwin Wizard to find the best collaboration model for your needs.',
        tags: ['Getting Started', 'Account', 'Onboarding']
      },
      {
        id: 'faq-2',
        title: 'What documents do I need to register?',
        content: 'Companies need Commercial Registration (CR) and VAT certificates. Individual professionals need professional licenses and CVs. All documents are verified by our admin team within 2-3 business days.',
        tags: ['Registration', 'Documents', 'Verification']
      },
      {
        id: 'faq-3',
        title: 'How does the matching algorithm work?',
        content: 'Our AI-powered algorithm matches projects with providers based on category, skills, experience, location, and past performance. Matches above 80% are automatically highlighted and providers receive notifications.',
        tags: ['Matching', 'Algorithm', 'How It Works']
      },
      {
        id: 'faq-4',
        title: 'What is an SPV and when is it used?',
        content: 'A Special Purpose Vehicle (SPV) is a separate legal entity created for a specific project. On PMTwin, SPVs are automatically suggested for projects with budgets exceeding 50 million SAR to manage risk and provide legal separation.',
        tags: ['SPV', 'Legal', 'Mega-Projects']
      },
      {
        id: 'faq-5',
        title: 'How does barter exchange work?',
        content: 'Barter allows companies to exchange services or resources without cash. PMTwin calculates value equivalence based on market rates. If values don\'t match exactly, you can add a cash component or extend the exchange period.',
        tags: ['Barter', 'Exchange', 'Resources']
      },
      {
        id: 'faq-6',
        title: 'What collaboration models are available?',
        content: 'PMTwin offers 5 main collaboration models: Project-Based (Task-Based, Consortium, JV, SPV), Strategic Partnerships (Strategic JV, Alliance, Mentorship), Resource Pooling (Bulk Purchasing, Co-Ownership, Barter), Hiring (Professional, Consultant), and Competition/RFP.',
        tags: ['Collaboration', 'Models', 'Overview']
      },
      {
        id: 'faq-7',
        title: 'How long does account approval take?',
        content: 'Account approval typically takes 2-3 business days after you submit all required documents. You\'ll receive email notifications when your account status changes.',
        tags: ['Account', 'Approval', 'Verification']
      },
      {
        id: 'faq-8',
        title: 'Can I create projects as an individual?',
        content: 'Individual professionals can browse projects and submit proposals, but cannot create mega-projects. To create projects, you need to register as a Company/Entity.',
        tags: ['Projects', 'Individual', 'Entity']
      },
      {
        id: 'faq-9',
        title: 'How do I submit a proposal?',
        content: 'Browse available projects, click "Submit Proposal", choose between cash or barter proposal, fill in the details including pricing/terms, and submit. Project owners will review and respond.',
        tags: ['Proposals', 'How To', 'Submitting']
      },
      {
        id: 'faq-10',
        title: 'What happens if my proposal is rejected?',
        content: 'If your proposal is rejected, you\'ll receive a notification with the reason (if provided). You can view the feedback, improve your proposal, and submit again if the project is still open.',
        tags: ['Proposals', 'Rejection', 'Feedback']
      },
      {
        id: 'faq-11',
        title: 'How secure is my data on PMTwin?',
        content: 'PMTwin uses industry-standard security measures including encryption, secure authentication, and regular security audits. Your data is protected and only shared as necessary for platform functionality.',
        tags: ['Security', 'Privacy', 'Data Protection']
      },
      {
        id: 'faq-12',
        title: 'Can I change my account type after registration?',
        content: 'Account type changes require admin approval. Contact support if you need to change from Individual to Entity or vice versa. You may need to provide additional documentation.',
        tags: ['Account', 'Changes', 'Support']
      }
    ]
  };

  let currentCategory = null;
  let searchQuery = '';

  function init(params) {
    renderCategories();
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    const section = urlParams.get('section');
    
    const container = document.getElementById('knowledgeArticles');
    if (!container) return;
    
    if (articleId) {
      // Find and render the article
      let foundArticle = null;
      Object.keys(articles).forEach(categoryId => {
        const article = articles[categoryId].find(a => a.id === articleId);
        if (article) {
          foundArticle = { ...article, category: categoryId };
        }
      });
      
      if (foundArticle) {
        currentCategory = foundArticle.category;
        renderCategories();
        renderFullArticle(container, foundArticle);
        return;
      }
    }
    
    if (section === 'faq') {
      filterByCategory('faq');
      return;
    }
    
    // Don't show articles initially - wait for category selection
    container.innerHTML = `
      <div style="text-align: center; padding: var(--spacing-8); color: var(--text-secondary);">
        <i class="ph ph-hand-pointing" style="font-size: 3rem; margin-bottom: var(--spacing-4); color: var(--color-primary);"></i>
        <p style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-2);">Select a category above to view articles</p>
        <p style="font-size: var(--font-size-sm);">Choose from SPV, Barter Systems, Collaboration Models, or FAQs</p>
      </div>
    `;
  }

  function renderCategories() {
    const container = document.getElementById('knowledgeCategories');
    if (!container) return;

    let html = '';
    categories.forEach(category => {
      const isSelected = currentCategory === category.id;
      html += `
        <div class="card enhanced-card" 
             data-category-id="${category.id}"
             style="cursor: pointer; transition: all 0.3s ease; ${isSelected ? 'border: 2px solid var(--color-primary); background: var(--color-primary-light, #e3f2fd);' : ''}" 
             onmouseover="if (!this.classList.contains('selected')) { this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)'; }" 
             onmouseout="if (!this.classList.contains('selected')) { this.style.transform=''; this.style.boxShadow=''; }"
             onclick="knowledgeComponent.filterByCategory('${category.id}')">
          <div class="card-body" style="text-align: center; padding: var(--spacing-6);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-4); color: ${isSelected ? 'var(--color-primary)' : 'var(--color-primary)'};">${category.icon}</div>
            <h3 style="margin: 0 0 var(--spacing-3) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${category.title}</h3>
            <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.5;">${category.description}</p>
            ${isSelected ? '<div style="margin-top: var(--spacing-3);"><span class="badge badge-primary">Selected</span></div>' : ''}
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
    // Toggle: if same category clicked, clear selection
    if (currentCategory === categoryId) {
      currentCategory = null;
      renderCategories();
      const container = document.getElementById('knowledgeArticles');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: var(--spacing-8); color: var(--text-secondary);">
            <i class="ph ph-hand-pointing" style="font-size: 3rem; margin-bottom: var(--spacing-4); color: var(--color-primary);"></i>
            <p style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-2);">Select a category above to view articles</p>
            <p style="font-size: var(--font-size-sm);">Choose from SPV, Barter Systems, Collaboration Models, or FAQs</p>
          </div>
        `;
      }
      return;
    }

    currentCategory = categoryId;
    searchQuery = ''; // Clear search when filtering by category
    const searchInput = document.getElementById('knowledgeSearch');
    if (searchInput) {
      searchInput.value = '';
    }

    // Update category visual state
    renderCategories();

    // Get articles for selected category
    const container = document.getElementById('knowledgeArticles');
    if (!container) return;

    const categoryArticles = articles[categoryId] || [];
    renderArticlesList(container, categoryArticles.map(a => ({ ...a, category: categoryId })));

    // Scroll to articles section smoothly
    setTimeout(() => {
      const articlesSection = document.getElementById('knowledgeArticles');
      if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  function search(event) {
    event.preventDefault();
    const query = document.getElementById('knowledgeSearch')?.value.toLowerCase() || '';
    searchQuery = query;
    
    // Clear category filter when searching
    if (query && currentCategory) {
      currentCategory = null;
      renderCategories();
    }

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
    
    // Scroll to articles section
    setTimeout(() => {
      const articlesSection = document.getElementById('knowledgeArticles');
      if (articlesSection) {
        articlesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
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

    // Check if URL has article parameter
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('article');
    const section = urlParams.get('section');
    
    if (articleId) {
      const article = articlesList.find(a => a.id === articleId);
      if (article) {
        renderFullArticle(container, article);
        return;
      }
    }
    
    if (section === 'faq') {
      filterByCategory('faq');
      return;
    }

    // Add section title with clear filter option if filtered
    let sectionTitle = '';
    if (currentCategory) {
      const category = categories.find(c => c.id === currentCategory);
      sectionTitle = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <h2 class="section-title" style="margin: 0;">${category?.title || 'Articles'}</h2>
          <button onclick="knowledgeComponent.clearFilters()" class="btn btn-secondary btn-sm">
            <i class="ph ph-x"></i> Clear Filter
          </button>
        </div>
      `;
    } else if (searchQuery) {
      sectionTitle = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-6);">
          <h2 class="section-title" style="margin: 0;">Search Results for "${searchQuery}"</h2>
          <button onclick="knowledgeComponent.clearFilters()" class="btn btn-secondary btn-sm">
            <i class="ph ph-x"></i> Clear Search
          </button>
        </div>
      `;
    } else {
      sectionTitle = `<h2 class="section-title spacing-section">All Articles</h2>`;
    }

    let html = sectionTitle + '<div style="display: grid; gap: var(--spacing-5);">';
    
    articlesList.forEach(article => {
      const category = categories.find(c => c.id === article.category);
      const isFullArticle = article.type === 'full-article';
      const preview = isFullArticle ? 
        (article.content.match(/<p>(.*?)<\/p>/)?.[1] || article.content.substring(0, 200)) + '...' :
        article.content;
      
      html += `
        <div class="card enhanced-card" style="transition: transform 0.3s ease, box-shadow 0.3s ease;" 
             onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 16px rgba(0,0,0,0.1)';" 
             onmouseout="this.style.transform=''; this.style.boxShadow='';">
          <div class="card-body">
            <div style="display: flex; align-items: start; gap: var(--spacing-5);">
              <div style="font-size: 2.5rem; color: var(--color-primary); flex-shrink: 0;">${category?.icon || '<i class="ph ph-file-text"></i>'}</div>
              <div style="flex: 1;">
                <h3 style="margin: 0 0 var(--spacing-3) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold); color: var(--text-primary);">
                  ${article.title}
                </h3>
                <div style="margin: 0 0 var(--spacing-4) 0; color: var(--text-secondary); line-height: 1.6;">
                  ${isFullArticle ? preview.replace(/<[^>]*>/g, '') : preview}
                </div>
                <div style="display: flex; gap: var(--spacing-2); flex-wrap: wrap; margin-bottom: var(--spacing-3);">
                  ${article.tags.map(tag => `
                    <span class="badge badge-secondary" style="font-size: var(--font-size-sm);">${tag}</span>
                  `).join('')}
                </div>
                ${isFullArticle ? `
                  <a href="?article=${article.id}" class="btn btn-primary btn-sm" style="text-decoration: none; display: inline-block;">
                    Read Full Article <i class="ph ph-arrow-right"></i>
                  </a>
                ` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    container.innerHTML = html;
  }

  function renderFullArticle(container, article) {
    const category = categories.find(c => c.id === article.category);
    const relatedArticles = getRelatedArticles(article);
    
    let html = `
      <div style="max-width: 900px; margin: 0 auto;">
        <div style="margin-bottom: var(--spacing-6);">
          <a href="javascript:void(0)" onclick="knowledgeComponent.clearFilters(); window.history.pushState({}, '', '../knowledge/');" 
             class="btn btn-secondary btn-sm" style="text-decoration: none; display: inline-flex; align-items: center; gap: 0.5rem; margin-bottom: var(--spacing-4);">
            <i class="ph ph-arrow-left"></i> Back to Articles
          </a>
          <div style="display: flex; align-items: center; gap: var(--spacing-3); margin-bottom: var(--spacing-4);">
            <div style="font-size: 2rem; color: var(--color-primary);">${category?.icon || '<i class="ph ph-file-text"></i>'}</div>
            <div>
              <div style="color: var(--text-secondary); font-size: var(--font-size-sm); margin-bottom: 0.25rem;">${category?.title || 'Article'}</div>
              <h1 style="margin: 0; font-size: 2rem; font-weight: 700;">${article.title}</h1>
            </div>
          </div>
          <div style="display: flex; gap: var(--spacing-2); flex-wrap: wrap; margin-bottom: var(--spacing-6);">
            ${article.tags.map(tag => `
              <span class="badge badge-secondary">${tag}</span>
            `).join('')}
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 200px 1fr; gap: var(--spacing-8);">
          ${article.tableOfContents && article.tableOfContents.length > 0 ? `
            <div style="position: sticky; top: 2rem; align-self: start;">
              <div class="card" style="padding: var(--spacing-4);">
                <h3 style="font-size: var(--font-size-sm); font-weight: 600; margin-bottom: var(--spacing-3); text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-secondary);">Table of Contents</h3>
                <nav style="display: flex; flex-direction: column; gap: var(--spacing-2);">
                  ${article.tableOfContents.map((item, index) => `
                    <a href="#section-${index}" style="font-size: var(--font-size-sm); color: var(--text-secondary); text-decoration: none; padding: var(--spacing-2); border-radius: 4px; transition: all 0.2s;" 
                       onmouseover="this.style.background='var(--bg-secondary)'; this.style.color='var(--color-primary)';" 
                       onmouseout="this.style.background='transparent'; this.style.color='var(--text-secondary)';">
                      ${item}
                    </a>
                  `).join('')}
                </nav>
              </div>
            </div>
          ` : ''}
          
          <div class="article-content" style="line-height: 1.8; color: var(--text-primary);">
            ${article.content}
          </div>
        </div>
        
        ${relatedArticles.length > 0 ? `
          <div style="margin-top: var(--spacing-12); padding-top: var(--spacing-8); border-top: 2px solid var(--border-color);">
            <h2 style="margin-bottom: var(--spacing-6);">Related Articles</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: var(--spacing-5);">
              ${relatedArticles.map(related => {
                const relatedCategory = categories.find(c => c.id === related.category);
                return `
                  <div class="card enhanced-card" style="cursor: pointer; transition: transform 0.3s ease;" 
                       onmouseover="this.style.transform='translateY(-4px)';" 
                       onmouseout="this.style.transform='';"
                       onclick="window.location.href='?article=${related.id}'">
                    <div class="card-body">
                      <div style="font-size: 2rem; color: var(--color-primary); margin-bottom: var(--spacing-3);">${relatedCategory?.icon || '<i class="ph ph-file-text"></i>'}</div>
                      <h3 style="margin: 0 0 var(--spacing-2) 0; font-size: var(--font-size-lg); font-weight: var(--font-weight-semibold);">${related.title}</h3>
                      <p style="margin: 0; color: var(--text-secondary); font-size: var(--font-size-sm); line-height: 1.5;">
                        ${related.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                      </p>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
    
    container.innerHTML = html;
    
    // Add smooth scroll for table of contents links
    document.querySelectorAll('a[href^="#section-"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  function getRelatedArticles(article) {
    // Find related articles based on tags and category
    let related = [];
    const maxRelated = 3;
    
    Object.keys(articles).forEach(categoryId => {
      articles[categoryId].forEach(a => {
        if (a.id !== article.id) {
          // Check for common tags
          const commonTags = a.tags.filter(tag => article.tags.includes(tag));
          if (commonTags.length > 0 || a.category === article.category) {
            related.push({ ...a, category: categoryId, relevance: commonTags.length });
          }
        }
      });
    });
    
    // Sort by relevance and return top results
    return related.sort((a, b) => b.relevance - a.relevance).slice(0, maxRelated);
  }

  function clearFilters() {
    currentCategory = null;
    searchQuery = '';
    const searchForm = document.getElementById('knowledgeSearchForm');
    if (searchForm) {
      searchForm.reset();
    }
    renderCategories(); // Update category visual state
    
    // Show placeholder message instead of all articles
    const container = document.getElementById('knowledgeArticles');
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: var(--spacing-8); color: var(--text-secondary);">
          <i class="ph ph-hand-pointing" style="font-size: 3rem; margin-bottom: var(--spacing-4); color: var(--color-primary);"></i>
          <p style="font-size: var(--font-size-lg); margin-bottom: var(--spacing-2);">Select a category above to view articles</p>
          <p style="font-size: var(--font-size-sm);">Choose from SPV, Barter Systems, Collaboration Models, or FAQs</p>
        </div>
      `;
    }
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

