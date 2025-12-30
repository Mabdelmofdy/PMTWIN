# Sidebar Menu RBAC Implementation

## Overview

The sidebar menu now properly filters menu items based on user permissions configured in the RBAC system. Each user will only see menu items for features they have access to based on their assigned role.

## Implementation Details

### 1. Menu Items Definition

Menu items are defined in `services/dashboard/dashboard-service.js` in the `getMenuItems()` function. Each menu item includes:

- `id`: Unique identifier
- `label`: Display text
- `route`: Path to the feature (using directory structure, e.g., `../dashboard/`)
- `feature`: Feature name that maps to permissions in `roles.json`
- `icon`: Emoji icon for the menu item
- `isSeparator`: Optional flag for visual separators

### 2. Feature Mapping

Each menu item is mapped to a feature in `data/roles.json`. The feature names used include:

**User Features:**
- `user_dashboard` - Dashboard access
- `project_creation` - Create projects
- `project_management` - Manage own projects
- `project_browsing` - Browse available projects
- `matches_view` - View matches and opportunities
- `proposal_management` - Manage proposals
- `proposal_creation` - Create proposals
- `proposal_review` - Review proposals (for project owners)
- `pipeline_management` - Service pipeline
- `collaboration_opportunities` - Collaboration features
- `profile_management` - Profile and onboarding
- `notifications` - Notifications

**Admin Features:**
- `admin_dashboard` - Admin dashboard
- `user_vetting` - User vetting
- `user_management` - User management
- `project_moderation` - Project moderation
- `audit_trail` - Audit trail
- `reports` - Reports

### 3. Permission Filtering Flow

```
User Login
    ↓
Get User Role (from user-roles.json)
    ↓
Get Role Definition (from roles.json)
    ↓
Extract Available Features
    ↓
Filter Menu Items by Features
    ↓
Render Sidebar with Filtered Items
```

### 4. Filtering Logic

The filtering happens in two places:

#### A. Dashboard Service (`dashboard-service.js`)

```javascript
// Get user's role and available features
const userRoleId = await PMTwinRBAC.getCurrentUserRole();
const availableFeatures = await PMTwinRBAC.getCurrentUserFeatures();

// Filter menu items
const filtered = allMenuItems.filter(item => {
  if (item.isSeparator) return true; // Always show separators
  if (!item.feature) return false; // Hide items without feature requirements
  
  // Check if user has access to this feature
  const hasAccess = availableFeatures.includes(item.feature);
  
  // Special handling for admin features
  if (item.feature.startsWith('admin_') && userRoleId !== 'platform_admin') {
    return false;
  }
  
  return hasAccess;
});
```

#### B. RBAC Service (`services/rbac/role-service.js`)

The `filterMenuItemsByRole()` function provides additional filtering:

```javascript
async function filterMenuItemsByRole(menuItems, userId, email) {
  const availableFeatures = await getAvailableFeatures(userId, email);
  const roleId = await getUserRole(userId, email);
  
  return menuItems.filter(item => {
    if (item.isSeparator) return true;
    if (!item.feature) return false;
    
    const hasFeatureAccess = availableFeatures.includes(item.feature);
    
    // Admin features only for platform_admin
    if (item.feature.startsWith('admin_')) {
      return roleId === 'platform_admin' && hasFeatureAccess;
    }
    
    return hasFeatureAccess;
  });
}
```

### 5. Role-Based Menu Visibility

#### Platform Admin (`platform_admin`)
- ✅ All user features
- ✅ All admin features
- ✅ All collaboration models

#### Project Lead (`project_lead` / Entity)
- ✅ Dashboard
- ✅ Create Project
- ✅ My Projects
- ✅ Matches
- ✅ Opportunities
- ✅ Proposals (Review)
- ✅ Pipeline
- ✅ Collaboration
- ✅ Profile
- ✅ Notifications
- ❌ Admin features

#### Professional (`professional` / Individual)
- ✅ Dashboard
- ✅ My Projects (browse)
- ✅ Matches
- ✅ Opportunities
- ✅ Proposals (Create/Manage)
- ✅ Pipeline
- ✅ Collaboration
- ✅ Profile
- ✅ Notifications
- ❌ Create Project
- ❌ Admin features

#### Other Roles
- Supplier, Service Provider, Consultant, Mentor: See their specific features based on `roles.json`

### 6. Route Structure

Menu items now use directory-based routes instead of hash routes:

```javascript
// Before (hash routes)
route: '#/dashboard'

// After (directory routes)
route: '../dashboard/'
```

This ensures proper navigation in the multi-page architecture.

### 7. Adding New Menu Items

To add a new menu item:

1. **Add to `dashboard-service.js`** in the `allMenuItems` array:
```javascript
{ 
  id: 'new-feature', 
  label: 'New Feature', 
  route: `${basePath}new-feature/`, 
  feature: 'new_feature_permission', 
  icon: '🆕' 
}
```

2. **Add feature to `roles.json`**:
```json
{
  "roles": {
    "project_lead": {
      "features": [
        "new_feature_permission"
      ]
    }
  }
}
```

3. **Add feature description** in `roles.json`:
```json
{
  "featureDescriptions": {
    "new_feature_permission": "Description of the new feature"
  }
}
```

### 8. Testing

To test the menu filtering:

1. **Login as Admin** (`admin@pmtwin.com` / `Admin123`)
   - Should see all menu items including admin section

2. **Login as Entity** (`entity@pmtwin.com` / `Entity123`)
   - Should see user features + project creation
   - Should NOT see admin features

3. **Login as Individual** (`individual@pmtwin.com` / `User123`)
   - Should see user features (no project creation)
   - Should NOT see admin features

### 9. Debugging

The dashboard service includes console logging for debugging:

```javascript
console.log('[DashboardService] User role:', userRoleId);
console.log('[DashboardService] Available features:', availableFeatures);
console.log('[DashboardService] Total menu items before filter:', allMenuItems.length);
console.log('[DashboardService] Filtered menu items:', filtered.length);
console.log('[DashboardService] Menu items:', filtered.map(i => ({ id: i.id, label: i.label, feature: i.feature })));
```

Check browser console to see:
- User's role
- Available features
- Menu items before and after filtering

### 10. Files Modified

1. **`services/dashboard/dashboard-service.js`**
   - Updated `getMenuItems()` function
   - Added proper feature mappings
   - Fixed route paths
   - Added opportunities and pipeline menu items
   - Enhanced filtering logic

2. **`services/rbac/role-service.js`**
   - Enhanced `filterMenuItemsByRole()` function
   - Added admin feature special handling
   - Updated feature mapping for opportunities and matches

## Summary

The sidebar menu now properly respects user permissions:
- ✅ Each menu item has a feature requirement
- ✅ Menu items are filtered based on user's role and available features
- ✅ Admin features are only visible to platform_admin
- ✅ Routes use directory structure for proper navigation
- ✅ Console logging available for debugging

Users will only see menu items for features they have permission to access based on their configured role in the RBAC system.

