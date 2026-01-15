/**
 * Shared initialization script for collaboration model pages
 * Usage: Call initCollaborationPage(modelId) after DOMContentLoaded
 */

function initCollaborationPage(modelId) {
    let retries = 0;
    const maxRetries = 50;
    
    function initialize() {
        retries++;
        
        // Check dependencies
        if (typeof PMTwinData === 'undefined' || typeof PMTwinAuth === 'undefined' || 
            typeof window.CollaborationModels === 'undefined' || typeof window.CollaborationModelsUI === 'undefined') {
            if (retries < maxRetries) {
                setTimeout(initialize, 100);
            } else {
                const container = document.getElementById('collaborationFormContainer') || 
                                 document.getElementById('createCollaborationContent');
                if (container) {
                    container.innerHTML = '<div class="alert alert-error">Required services not loaded. Please refresh the page.</div>';
                }
            }
            return;
        }
        
        // All dependencies loaded
        (async function() {
            try {
                // Check authentication
                if (!PMTwinAuth.isAuthenticated()) {
                    // Use NAV_ROUTES if available, otherwise use full URL
                    let loginUrl = '/POC/pages/auth/login/index.html';
                    if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['login']) {
                        loginUrl = window.NavRoutes.getRoute('login', { useLiveServer: true });
                    } else {
                        // Fallback: normalize to full URL
                        loginUrl = 'http://127.0.0.1:5503/POC/pages/auth/login/index.html';
                    }
                    window.location.href = loginUrl;
                    return;
                }
                
                // Get current user
                const currentUser = PMTwinData.Sessions.getCurrentUser();
                if (!currentUser) {
                    // Use NAV_ROUTES if available, otherwise use full URL
                    let loginUrl = '/POC/pages/auth/login/index.html';
                    if (typeof window.NavRoutes !== 'undefined' && window.NavRoutes.NAV_ROUTES['login']) {
                        loginUrl = window.NavRoutes.getRoute('login', { useLiveServer: true });
                    } else {
                        // Fallback: normalize to full URL
                        loginUrl = 'http://127.0.0.1:5503/POC/pages/auth/login/index.html';
                    }
                    window.location.href = loginUrl;
                    return;
                }
                
                console.log(`[Collaboration] Initializing ${modelId} for user:`, currentUser.email);
                
                // Initialize collaboration models UI
                window.CollaborationModelsUI.init(currentUser);
                
                // Load the specific model form
                if (window.CollaborationModelsUI.selectModel) {
                    window.CollaborationModelsUI.selectModel(modelId);
                } else {
                    console.error('[Collaboration] selectModel function not available');
                    const container = document.getElementById('collaborationFormContainer') || 
                                     document.getElementById('createCollaborationContent');
                    if (container) {
                        container.innerHTML = '<div class="alert alert-error">Collaboration form builder not available. Please refresh.</div>';
                    }
                }
            } catch (error) {
                console.error('[Collaboration] Error initializing:', error);
                const container = document.getElementById('collaborationFormContainer') || 
                                 document.getElementById('createCollaborationContent');
                if (container) {
                    container.innerHTML = `<div class="alert alert-error">Error: ${error.message}</div>`;
                }
            }
        })();
    }
    
    initialize();
}

