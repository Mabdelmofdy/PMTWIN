# RBAC JSON-Based Implementation Refactoring

## Overview

The RBAC system has been refactored to use JSON data files instead of hardcoded mappings. All role definitions, permissions, features, and available collaboration models are now stored in JSON files for easier maintenance and configuration.

## Changes Made

### 1. Updated `data/roles.json`

Added `availableModels` array to each role definition:

```json
{
  "roles": {
    "project_lead": {
      "id": "project_lead",
      "name": "Project Lead (Contractor)",
      "permissions": [...],
      "features": [...],
      "portals": ["user_portal"],
      "availableModels": ["1.1", "1.2", "1.3", "1.4", "2.1", "2.2", "3.1", "3.2", "3.3", "4.1", "4.2", "5.1"],
      "restrictions": [...]
    }
  }
}
```

**Available Models by Role:**
- **project_lead**: All models (1.1-5.1)
- **supplier**: 2.2, 3.1, 3.2, 3.3
- **service_provider**: 1.1, 2.2
- **professional**: 1.1, 1.2, 2.3, 4.1
- **consultant**: 1.1, 2.2, 4.2
- **mentor**: 2.3
- **platform_admin**: All models (1.1-5.1)
- **auditor**: All models (1.1-5.1) - read-only
- **guest**: No models

### 2. Updated `services/rbac/role-service.js`

**Before (Hardcoded):**
```javascript
function getAvailableModelsForRole(roleId) {
  const roleModelMap = {
    'project_lead': ['1.1', '1.2', ...],
    'supplier': ['2.2', '3.1', ...],
    // ... hardcoded mappings
  };
  return roleModelMap[roleId] || [];
}
```

**After (JSON-Based):**
```javascript
async function getAvailableModelsForRole(roleId) {
  const roleDef = await getRoleDefinition(roleId);
  if (!roleDef) return [];
  return roleDef.availableModels || [];
}
```

### 3. Updated Function Signatures

All model-related functions are now async to support JSON loading:

- `getAvailableModelsForRole(roleId)` → `async function`
- `canRoleAccessModel(roleId, modelId)` → `async function`
- `filterModelsByRole(models, roleId)` → Already async, now uses JSON

## Data File Structure

### `data/roles.json`

Contains all role definitions with:
- `id`: Role identifier
- `name`: Display name
- `description`: Role description
- `permissions`: Array of permission strings
- `features`: Array of feature strings
- `portals`: Array of accessible portals
- `availableModels`: Array of collaboration model IDs (NEW)
- `restrictions`: Array of restriction descriptions

### `data/user-roles.json`

Contains user-to-role assignments:
```json
{
  "userRoles": [
    {
      "userId": "user_001",
      "email": "user@example.com",
      "roleId": "project_lead",
      "assignedAt": "2024-01-01T00:00:00Z",
      "assignedBy": "system",
      "isActive": true
    }
  ],
  "defaultRole": "guest",
  "roleAssignmentRules": {
    "onRegistration": {...},
    "onApproval": {...}
  }
}
```

## Benefits

### 1. **Maintainability**
- All role configurations in one place (`roles.json`)
- Easy to add/modify roles without code changes
- Clear separation of data and logic

### 2. **Flexibility**
- Can update role permissions/features without redeploying code
- Easy to add new roles or modify existing ones
- Collaboration model access can be changed per role

### 3. **Consistency**
- Single source of truth for role definitions
- No hardcoded mappings scattered in code
- Easier to audit and review permissions

### 4. **Scalability**
- Easy to add new roles
- Can extend role definitions with new properties
- Supports future role management UI

## Usage Examples

### Get Available Models for a Role

```javascript
// Get models for a specific role
const models = await PMTwinRBAC.getAvailableModelsForRole('project_lead');
// Returns: ['1.1', '1.2', '1.3', '1.4', '2.1', '2.2', '3.1', '3.2', '3.3', '4.1', '4.2', '5.1']

// Get models for current user
const userModels = await PMTwinRBAC.getAvailableModelsForCurrentUser();
```

### Check Model Access

```javascript
// Check if role can access a model
const canAccess = await PMTwinRBAC.canRoleAccessModel('professional', '1.1');
// Returns: true

// Check if current user can access a model
const userCanAccess = await PMTwinRBAC.canCurrentUserAccessModel('1.1');
```

### Filter Models by Role

```javascript
// Filter collaboration models by role
const allModels = CollaborationModels.getAllModels();
const filtered = await PMTwinRBAC.filterModelsByRole(allModels, 'supplier');
// Returns only models available to supplier role
```

## Adding a New Role

1. **Add to `data/roles.json`**:
```json
{
  "roles": {
    "new_role": {
      "id": "new_role",
      "name": "New Role Name",
      "description": "Role description",
      "permissions": ["permission1", "permission2"],
      "features": ["feature1", "feature2"],
      "portals": ["user_portal"],
      "availableModels": ["1.1", "2.2"],
      "restrictions": []
    }
  }
}
```

2. **Add feature descriptions** (if new features):
```json
{
  "featureDescriptions": {
    "new_feature": "Description of new feature"
  }
}
```

3. **Assign to users in `data/user-roles.json`**:
```json
{
  "userRoles": [
    {
      "userId": "user_002",
      "email": "newuser@example.com",
      "roleId": "new_role",
      "assignedAt": "2024-01-01T00:00:00Z",
      "assignedBy": "admin",
      "isActive": true
    }
  ]
}
```

## Migration Notes

### Breaking Changes
- `getAvailableModelsForRole()` is now async
- `canRoleAccessModel()` is now async
- All callers must use `await` when calling these functions

### Backward Compatibility
- Legacy role mapping still works (admin → platform_admin, entity → project_lead, etc.)
- Existing user role assignments continue to work
- Default role fallback still works

## Testing

To test the new JSON-based implementation:

1. **Check role loading**:
```javascript
const role = await PMTwinRBAC.getRoleDefinition('project_lead');
console.log('Available models:', role.availableModels);
```

2. **Verify model access**:
```javascript
const canAccess = await PMTwinRBAC.canRoleAccessModel('professional', '1.1');
console.log('Can access model 1.1:', canAccess);
```

3. **Test filtering**:
```javascript
const allModels = CollaborationModels.getAllModels();
const filtered = await PMTwinRBAC.filterModelsByRole(allModels, 'supplier');
console.log('Filtered models:', filtered);
```

## Files Modified

1. **`data/roles.json`**
   - Added `availableModels` array to all role definitions

2. **`services/rbac/role-service.js`**
   - Replaced hardcoded `getAvailableModelsForRole()` with JSON-based implementation
   - Updated `canRoleAccessModel()` to be async
   - Updated `filterModelsByRole()` to use JSON data

3. **`data/user-roles.json`**
   - No changes (already in correct format)

## Future Enhancements

1. **Role Management UI**: Create admin interface to manage roles
2. **Dynamic Role Assignment**: Allow admins to assign roles via UI
3. **Role Templates**: Create role templates for common use cases
4. **Audit Logging**: Log role changes and assignments
5. **Role Inheritance**: Support role hierarchies and inheritance

## Summary

The RBAC system is now fully JSON-based, making it:
- ✅ Easier to maintain
- ✅ More flexible
- ✅ Better organized
- ✅ Ready for future enhancements

All role definitions, permissions, features, and model access are now stored in `data/roles.json`, and user role assignments are in `data/user-roles.json`.

