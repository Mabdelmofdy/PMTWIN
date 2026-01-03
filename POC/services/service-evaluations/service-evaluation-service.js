/**
 * Service Evaluation Service
 * Handles service evaluation-related operations with role-based access control
 */

(function() {
  'use strict';

  // ============================================
  // Create Evaluation
  // ============================================
  async function createEvaluation(evaluationData) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate required fields
    if (!evaluationData.serviceOfferingId || !evaluationData.providerId || !evaluationData.rating) {
      return { success: false, error: 'Missing required fields: serviceOfferingId, providerId, and rating are required' };
    }

    // Validate rating range
    if (evaluationData.rating < 1 || evaluationData.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Check if user has permission (beneficiaries can create evaluations)
    if (typeof PMTwinRBAC !== 'undefined') {
      const hasPermission = await PMTwinRBAC.canCurrentUserAccess('create_evaluations');
      if (!hasPermission) {
        return { success: false, error: 'You do not have permission to create evaluations' };
      }
    }

    // Set beneficiary ID from current user
    evaluationData.beneficiaryId = currentUser.id;

    const evaluation = PMTwinData.ServiceEvaluations.create(evaluationData);
    
    if (evaluation) {
      return { success: true, evaluation: evaluation };
    }
    
    return { success: false, error: 'Failed to create evaluation' };
  }

  // ============================================
  // Get Evaluations
  // ============================================
  async function getEvaluations(filters = {}) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    let evaluations = PMTwinData.ServiceEvaluations.getAll();

    // Apply filters
    if (filters.providerId) {
      evaluations = evaluations.filter(e => e.providerId === filters.providerId);
    }

    if (filters.serviceOfferingId) {
      evaluations = evaluations.filter(e => e.serviceOfferingId === filters.serviceOfferingId);
    }

    if (filters.beneficiaryId) {
      evaluations = evaluations.filter(e => e.beneficiaryId === filters.beneficiaryId);
    }

    if (filters.projectId) {
      evaluations = evaluations.filter(e => e.projectId === filters.projectId);
    }

    if (filters.minRating !== undefined) {
      evaluations = evaluations.filter(e => e.rating >= filters.minRating);
    }

    if (filters.maxRating !== undefined) {
      evaluations = evaluations.filter(e => e.rating <= filters.maxRating);
    }

    // Sort by created date (most recent first)
    evaluations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return { success: true, evaluations: evaluations };
  }

  // ============================================
  // Get Evaluation by ID
  // ============================================
  async function getEvaluationById(evaluationId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const evaluation = PMTwinData.ServiceEvaluations.getById(evaluationId);
    
    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' };
    }

    return { success: true, evaluation: evaluation };
  }

  // ============================================
  // Get Evaluations by Provider
  // ============================================
  async function getEvaluationsByProvider(providerId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const evaluations = PMTwinData.ServiceEvaluations.getByProvider(providerId);
    const aggregate = PMTwinData.ServiceEvaluations.getAggregateRating(providerId);

    return { 
      success: true, 
      evaluations: evaluations,
      aggregate: aggregate
    };
  }

  // ============================================
  // Get Evaluations by Offering
  // ============================================
  async function getEvaluationsByOffering(offeringId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const evaluations = PMTwinData.ServiceEvaluations.getByOffering(offeringId);
    const aggregate = PMTwinData.ServiceEvaluations.getAggregateRatingByOffering(offeringId);

    return { 
      success: true, 
      evaluations: evaluations,
      aggregate: aggregate
    };
  }

  // ============================================
  // Get Aggregate Rating
  // ============================================
  async function getAggregateRating(providerId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const aggregate = PMTwinData.ServiceEvaluations.getAggregateRating(providerId);

    return { success: true, aggregate: aggregate };
  }

  // ============================================
  // Get Aggregate Rating by Offering
  // ============================================
  async function getAggregateRatingByOffering(offeringId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }

    const aggregate = PMTwinData.ServiceEvaluations.getAggregateRatingByOffering(offeringId);

    return { success: true, aggregate: aggregate };
  }

  // ============================================
  // Update Evaluation
  // ============================================
  async function updateEvaluation(evaluationId, updates) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const evaluation = PMTwinData.ServiceEvaluations.getById(evaluationId);
    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' };
    }

    // Check if user owns this evaluation
    if (evaluation.beneficiaryId !== currentUser.id) {
      // Check admin permission
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_evaluations');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to update this evaluation' };
        }
      } else {
        return { success: false, error: 'You do not have permission to update this evaluation' };
      }
    }

    // Validate rating if provided
    if (updates.rating !== undefined && (updates.rating < 1 || updates.rating > 5)) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    const updated = PMTwinData.ServiceEvaluations.update(evaluationId, updates);
    
    if (updated) {
      return { success: true, evaluation: updated };
    }
    
    return { success: false, error: 'Failed to update evaluation' };
  }

  // ============================================
  // Delete Evaluation
  // ============================================
  async function deleteEvaluation(evaluationId) {
    if (typeof PMTwinData === 'undefined') {
      return { success: false, error: 'Data service not available' };
    }
    
    const currentUser = PMTwinData.Sessions.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'User not authenticated' };
    }

    const evaluation = PMTwinData.ServiceEvaluations.getById(evaluationId);
    if (!evaluation) {
      return { success: false, error: 'Evaluation not found' };
    }

    // Check if user owns this evaluation
    if (evaluation.beneficiaryId !== currentUser.id) {
      // Check admin permission
      if (typeof PMTwinRBAC !== 'undefined') {
        const hasPermission = await PMTwinRBAC.canCurrentUserAccess('manage_evaluations');
        if (!hasPermission) {
          return { success: false, error: 'You do not have permission to delete this evaluation' };
        }
      } else {
        return { success: false, error: 'You do not have permission to delete this evaluation' };
      }
    }

    const deleted = PMTwinData.ServiceEvaluations.delete(evaluationId);
    
    if (deleted) {
      return { success: true, message: 'Evaluation deleted successfully' };
    }
    
    return { success: false, error: 'Failed to delete evaluation' };
  }

  // ============================================
  // Public API
  // ============================================
  window.ServiceEvaluationService = {
    createEvaluation,
    getEvaluations,
    getEvaluationById,
    getEvaluationsByProvider,
    getEvaluationsByOffering,
    getAggregateRating,
    getAggregateRatingByOffering,
    updateEvaluation,
    deleteEvaluation
  };

})();

