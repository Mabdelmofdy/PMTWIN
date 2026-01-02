// Script to generate all collaboration model pages
const models = [
  { id: '1.3', path: 'joint-venture', name: 'Project-Specific Joint Venture', desc: 'Shared management partnership for a single project' },
  { id: '1.4', path: 'spv', name: 'Special Purpose Vehicle (SPV)', desc: 'Risk-isolated entity for mega-projects (50M+ SAR)' },
  { id: '2.1', path: 'strategic-jv', name: 'Strategic Joint Venture', desc: 'Long-term JV for ongoing business' },
  { id: '2.2', path: 'strategic-alliance', name: 'Long-Term Strategic Alliance', desc: 'Ongoing partnership without new legal entity' },
  { id: '2.3', path: 'mentorship', name: 'Mentorship Program', desc: 'Guidance and knowledge transfer relationship' },
  { id: '3.1', path: 'bulk-purchasing', name: 'Bulk Purchasing', desc: 'Group buying for volume discounts' },
  { id: '3.2', path: 'co-ownership', name: 'Co-Ownership Pooling', desc: 'Joint purchase and co-ownership of assets' },
  { id: '3.3', path: 'resource-exchange', name: 'Resource Sharing & Exchange', desc: 'Marketplace for resources (sell/buy/rent/barter)' },
  { id: '4.1', path: 'professional-hiring', name: 'Professional Hiring', desc: 'Full-time, part-time, or contract employment' },
  { id: '4.2', path: 'consultant-hiring', name: 'Consultant Hiring', desc: 'Engaging consultants for advisory services' },
  { id: '5.1', path: 'competition', name: 'Competition/RFP', desc: 'Open or invited competitions' }
];

const template = (model) => `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${model.name} - PMTwin</title>
    <link rel="stylesheet" href="../../css/main.css">
</head>
<body>
    <main>
        <div class="container" style="padding: 2rem 0;">
            <div style="margin-bottom: 2rem;">
                <a href="../../collaboration/" class="btn btn-secondary" style="margin-bottom: 1rem;">
                    <i class="ph ph-arrow-left"></i> Back to Collaboration
                </a>
                <h1>${model.name}</h1>
                <p style="color: var(--text-secondary); margin-top: 1rem;">
                    ${model.desc}
                </p>
            </div>

            <div id="collaborationFormContainer">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading form...</p>
                </div>
            </div>
        </div>
    </main>

    <script src="../../js/config.js"></script>
    <script src="../../js/api/api-client.js"></script>
    <script src="../../js/api/api-service.js"></script>
    <script src="../../js/data.js"></script>
    <script src="../../js/auth.js"></script>
    <script src="../../js/auth-check.js"></script>
    <script src="../../js/demo-credentials.js"></script>
    <script src="../../services/services-loader.js"></script>
    <script src="../../data/data-loader.js"></script>
    <script src="../../js/layout.js"></script>
    <script src="../../js/navigation.js"></script>
    <script src="../../js/app-init.js"></script>
    <script src="../../js/collaboration-model-definitions.js"></script>
    <script src="../../js/collaboration-models.js"></script>
    
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            const isAuth = await AuthCheck.checkAuth({ requireAuth: true });
            if (!isAuth) return;
            
            const currentUser = Auth.getCurrentUser();
            if (!currentUser) return;
            
            if (typeof window.CollaborationModelsUI !== 'undefined') {
                window.CollaborationModelsUI.init(currentUser);
                if (window.CollaborationModelsUI.selectModel) {
                    window.CollaborationModelsUI.selectModel('${model.id}');
                }
            }
        });
    </script>
</body>
</html>`;

// This is a reference file - actual pages will be created individually

