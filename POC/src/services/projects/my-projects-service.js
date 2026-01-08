/**
 * My Projects Service
 * Handles retrieval of projects owned by the current company
 */

(function() {
  'use strict';

  // ============================================
  // Get My Projects
  // ============================================
  async function getMyProjects(companyId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    if (!companyId) {
      const currentUser = PMTwinData.Sessions.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'User not authenticated' };
      }
      companyId = currentUser.id; // Users represent companies
    }

    try {
      // Get all projects where ownerCompanyId === companyId
      const allProjects = PMTwinData.Projects.getAll();
      const myProjects = allProjects.filter(p => p.ownerCompanyId === companyId);
      
      // Get all service requests where ownerCompanyId === companyId
      const allServiceRequests = PMTwinData.ServiceRequests.getAll();
      const myServiceRequests = allServiceRequests.filter(sr => sr.ownerCompanyId === companyId);

      // Separate projects and mega-projects
      const projects = myProjects.filter(p => p.projectType !== 'mega');
      const megaProjects = myProjects.filter(p => p.projectType === 'mega');

      // Calculate counts by status
      const projectCounts = {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        draft: projects.filter(p => p.status === 'draft').length,
        completed: projects.filter(p => p.status === 'completed').length
      };

      const megaProjectCounts = {
        total: megaProjects.length,
        active: megaProjects.filter(p => p.status === 'active').length,
        draft: megaProjects.filter(p => p.status === 'draft').length,
        completed: megaProjects.filter(p => p.status === 'completed').length
      };

      const serviceRequestCounts = {
        total: myServiceRequests.length,
        open: myServiceRequests.filter(sr => sr.status === 'OPEN').length,
        offered: myServiceRequests.filter(sr => sr.status === 'OFFERED').length,
        approved: myServiceRequests.filter(sr => sr.status === 'APPROVED').length,
        in_progress: myServiceRequests.filter(sr => sr.status === 'IN_PROGRESS').length,
        completed: myServiceRequests.filter(sr => sr.status === 'COMPLETED').length
      };

      return {
        success: true,
        data: {
          projects: projects,
          megaProjects: megaProjects,
          serviceRequests: myServiceRequests,
          counts: {
            projects: projectCounts,
            megaProjects: megaProjectCounts,
            serviceRequests: serviceRequestCounts,
            total: projects.length + megaProjects.length + myServiceRequests.length
          }
        }
      };
    } catch (error) {
      console.error('Error getting my projects:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // Public API
  // ============================================
  window.MyProjectsService = {
    getMyProjects
  };

})();
