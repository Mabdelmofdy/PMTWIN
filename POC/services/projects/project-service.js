/**
 * Project Service
 * Handles project-related operations with role-based access control
 */

(function() {
  'use strict';

  async function createProject(projectData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_projects');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create projects' };
      }
    }
    
    projectData.creatorId = currentUser.id;
    const project = PMTwinData.Projects.create(projectData);
    
    if (project) {
      return { success: true, project: project };
    }
    
    return { success: false, error: 'Failed to create project' };
  }

  async function getProjects(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    
    let projects = [];
    
    if (currentUser) {
      // Check what projects user can view
      if (typeof PMTwinRBAC !== 'undefined') {
        const canViewAll = await PMTwinRBAC.canCurrentUserAccess('view_all_projects');
        const canViewOwn = await PMTwinRBAC.canCurrentUserAccess('view_own_projects');
        const canViewPublic = await PMTwinRBAC.canCurrentUserAccess('view_public_projects');
        
        if (canViewAll) {
          projects = PMTwinData.Projects.getAll();
        } else if (canViewOwn) {
          projects = PMTwinData.Projects.getByCreator(currentUser.id);
          // Also include public projects
          if (canViewPublic) {
            const publicProjects = PMTwinData.Projects.getAll().filter(p => 
              p.visibility === 'public' && p.creatorId !== currentUser.id
            );
            projects = [...projects, ...publicProjects];
          }
        } else if (canViewPublic) {
          projects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public');
        }
      } else {
        // Fallback to legacy behavior
        if (currentUser.role === 'entity') {
          projects = PMTwinData.Projects.getByCreator(currentUser.id);
        } else {
          projects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public');
        }
      }
    } else {
      // Guest user - only public projects
      projects = PMTwinData.Projects.getAll().filter(p => p.visibility === 'public');
    }
    
    // Apply filters
    if (filters.status) {
      projects = projects.filter(p => p.status === filters.status);
    }
    if (filters.category) {
      projects = projects.filter(p => p.category === filters.category);
    }
    
    return { success: true, projects: projects };
  }

  async function getProjectById(projectId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    
    // Check access
    if (typeof PMTwinRBAC !== 'undefined') {
      const canViewAll = await PMTwinRBAC.canCurrentUserAccess('view_all_projects');
      const canViewOwn = currentUser && await PMTwinRBAC.canCurrentUserAccess('view_own_projects');
      const canViewPublic = await PMTwinRBAC.canCurrentUserAccess('view_public_projects');
      
      if (!canViewAll) {
        if (project.creatorId === currentUser?.id && !canViewOwn) {
          return { success: false, error: 'You do not have permission to view this project' };
        }
        if (project.visibility !== 'public' && !canViewOwn) {
          return { success: false, error: 'You do not have permission to view this project' };
        }
        if (project.visibility === 'public' && !canViewPublic) {
          return { success: false, error: 'You do not have permission to view public projects' };
        }
      }
    }
    
    return { success: true, project: project };
  }

  async function updateProject(projectId, updates) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    const canEditAll = typeof PMTwinRBAC !== 'undefined' && 
                       await PMTwinRBAC.canCurrentUserAccess('moderate_projects');
    const canEditOwn = typeof PMTwinRBAC !== 'undefined' && 
                       await PMTwinRBAC.canCurrentUserAccess('edit_own_projects');
    
    if (!canEditAll && (project.creatorId !== currentUser.id || !canEditOwn)) {
      return { success: false, error: 'You do not have permission to edit this project' };
    }
    
    const updated = PMTwinData.Projects.update(projectId, updates);
    if (updated) {
      return { success: true, project: updated };
    }
    
    return { success: false, error: 'Failed to update project' };
  }

  async function deleteProject(projectId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const project = PMTwinData.Projects.getById(projectId);
    if (!project) {
      return { success: false, error: 'Project not found' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }
    
    // Check permission
    const canDeleteAll = typeof PMTwinRBAC !== 'undefined' && 
                         await PMTwinRBAC.canCurrentUserAccess('remove_projects');
    const canDeleteOwn = typeof PMTwinRBAC !== 'undefined' && 
                         await PMTwinRBAC.canCurrentUserAccess('delete_own_projects');
    
    if (!canDeleteAll && (project.creatorId !== currentUser.id || !canDeleteOwn)) {
      return { success: false, error: 'You do not have permission to delete this project' };
    }
    
    const deleted = PMTwinData.Projects.delete(projectId);
    if (deleted) {
      return { success: true };
    }
    
    return { success: false, error: 'Failed to delete project' };
  }

  window.ProjectService = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject
  };

})();


