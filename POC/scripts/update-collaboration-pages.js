/**
 * Script to update all collaboration sub-pages to use unified layout
 * Run this in Node.js or use as reference for manual updates
 */

const fs = require('fs');
const path = require('path');

const collaborationPages = [
    { file: 'collaboration/consortium/index.html', title: 'Consortium', description: 'A temporary contractual alliance among independent entities formed to pursue a specific opportunity.', modelId: '1.2' },
    { file: 'collaboration/joint-venture/index.html', title: 'Project-Specific Joint Venture', description: 'Shared management partnership for a single project', modelId: '1.3' },
    { file: 'collaboration/spv/index.html', title: 'Special Purpose Vehicle (SPV)', description: 'Risk-isolated entity for mega-projects (50M+ SAR)', modelId: '1.4' },
    { file: 'collaboration/strategic-jv/index.html', title: 'Strategic Joint Venture', description: 'Long-term strategic partnership', modelId: '2.1' },
    { file: 'collaboration/strategic-alliance/index.html', title: 'Strategic Alliance', description: 'Long-term collaboration without shared entity', modelId: '2.2' },
    { file: 'collaboration/mentorship/index.html', title: 'Mentorship', description: 'Knowledge transfer and guidance partnership', modelId: '2.3' },
    { file: 'collaboration/bulk-purchasing/index.html', title: 'Bulk Purchasing', description: 'Collective purchasing for cost savings', modelId: '3.1' },
    { file: 'collaboration/co-ownership/index.html', title: 'Co-Ownership', description: 'Shared ownership of assets or resources', modelId: '3.2' },
    { file: 'collaboration/resource-exchange/index.html', title: 'Resource Exchange', description: 'Mutual exchange of resources and capabilities', modelId: '3.3' },
    { file: 'collaboration/professional-hiring/index.html', title: 'Professional Hiring', description: 'Hire professionals for specific roles', modelId: '4.1' },
    { file: 'collaboration/consultant-hiring/index.html', title: 'Consultant Hiring', description: 'Engage consultants for expertise', modelId: '4.2' },
    { file: 'collaboration/competition/index.html', title: 'Call for Competition', description: 'Open competition for project participation', modelId: '5.1' }
];

const template = (title, description) => `    <main class="page-wrapper">
        <div class="container">
            <!-- Page Header -->
            <div class="page-header">
                <div class="page-header-content">
                    <div>
                        <a href="../../collaboration/" class="btn btn-secondary btn-sm" style="margin-bottom: 1rem;">
                            <i class="ph ph-arrow-left"></i> Back to Collaboration
                        </a>
                        <h1>${title}</h1>
                        <p>${description}</p>
                    </div>
                </div>
            </div>

            <!-- Collaboration Form Container -->
            <div class="content-section">
                <div id="collaborationFormContainer">
                    <div class="loading">
                        <div class="spinner"></div>
                        <p>Loading form...</p>
                    </div>
                </div>
                
                <!-- Alternative container ID for compatibility -->
                <div id="createCollaborationContent" style="display: none;"></div>
            </div>
        </div>
    </main>`;

console.log('Template created. Use this to update collaboration pages manually.');


