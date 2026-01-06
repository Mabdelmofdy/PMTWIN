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
                    window.location.href = '../../auth/login/';
                    return;
                }
                
                // Get current user
                const currentUser = PMTwinData.Sessions.getCurrentUser();
                if (!currentUser) {
                    window.location.href = '../../auth/login/';
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

