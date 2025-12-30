# Menu Debugging Guide

## Issue: Empty Sidebar Menu

If you're seeing an empty sidebar menu, follow these debugging steps:

## Step 1: Check Browser Console

Open browser console (F12) and look for these log messages:

### Expected Logs:
```
[RBAC] Getting role for user: entity@pmtwin.com
[RBAC] Resolved role: project_lead
[RBAC] Available features: [...]
[DashboardService] User role: project_lead
[DashboardService] Available features: [...]
[DashboardService] Total menu items before filter: 15
[DashboardService] Filtered menu items: 12
[Navigation] Loaded 12 menu items for current user
[Navigation] Rendering sidebar with 12 menu items
```

### If You See Errors:
- `[RBAC] No current user` → User not logged in properly
- `[RBAC] Resolved role: guest` → Role not assigned correctly
- `[DashboardService] Available features: []` → Features not loaded
- `[DashboardService] Filtered menu items: 0` → All items filtered out

## Step 2: Verify User Role Assignment

Run in browser console:
```javascript
// Check current user
const user = PMTwinData.Sessions.getCurrentUser();
console.log('Current user:', user);

// Check user role
PMTwinRBAC.getCurrentUserRole().then(role => {
  console.log('User role:', role);
});

// Check available features
PMTwinRBAC.getCurrentUserFeatures().then(features => {
  console.log('Available features:', features);
  console.log('Feature count:', features.length);
});
```

## Step 3: Check Menu Items

Run in browser console:
```javascript
// Get menu items
DashboardService.getMenuItems().then(result => {
  console.log('Menu result:', result);
  console.log('Menu items:', result.items);
  console.log('Item count:', result.items.length);
  
  // Show what's being filtered
  result.items.forEach(item => {
    console.log(`- ${item.label} (${item.id}): ${item.feature}`);
  });
});
```

## Step 4: Verify Role Configuration

Check if user's role is in `data/user-roles.json`:
```javascript
// Check user role assignment
PMTwinRBAC.loadUserRolesData().then(data => {
  console.log('User roles data:', data);
  const userRole = data.userRoles.find(ur => 
    ur.email === 'entity@pmtwin.com' || ur.userId === 'user_entity_001'
  );
  console.log('User role assignment:', userRole);
});
```

## Step 5: Check Role Features

Verify role has features in `data/roles.json`:
```javascript
// Check role definition
PMTwinRBAC.getRoleDefinition('project_lead').then(role => {
  console.log('Role definition:', role);
  console.log('Features:', role.features);
});
```

## Common Issues and Fixes

### Issue 1: Role Not Assigned
**Symptom:** Role resolves to 'guest'
**Fix:** 
```javascript
// Manually assign role
PMTwinRBAC.assignRoleToUser('user_entity_001', 'project_lead', 'system', 'entity@pmtwin.com');
```

### Issue 2: Features Not Loading
**Symptom:** Available features is empty array
**Fix:**
```javascript
// Reload roles data
PMTwinRBAC.loadRolesData().then(() => {
  console.log('Roles data reloaded');
  // Refresh menu
  Navigation.refreshMenuItems();
});
```

### Issue 3: All Items Filtered Out
**Symptom:** Filtered menu items: 0
**Fix:** Check if role has required features. Add missing features to `roles.json`.

### Issue 4: Sidebar Not Created
**Symptom:** Sidebar container not found
**Fix:** Sidebar is created automatically, but you can manually create:
```javascript
Navigation.init({ showSidebar: true });
```

## Quick Fix Script

Run this in browser console to diagnose and fix:

```javascript
(async function() {
  console.log('=== Menu Debugging ===');
  
  // 1. Check user
  const user = PMTwinData.Sessions.getCurrentUser();
  console.log('1. Current user:', user?.email, user?.role);
  
  // 2. Check role
  const role = await PMTwinRBAC.getCurrentUserRole();
  console.log('2. User role:', role);
  
  // 3. Check features
  const features = await PMTwinRBAC.getCurrentUserFeatures();
  console.log('3. Available features:', features);
  console.log('   Feature count:', features.length);
  
  // 4. Check menu items
  const menuResult = await DashboardService.getMenuItems();
  console.log('4. Menu items:', menuResult.items.length);
  console.log('   Items:', menuResult.items.map(i => i.label));
  
  // 5. Auto-fix if needed
  if (role === 'guest' && user) {
    console.log('5. Auto-assigning role...');
    const roleMap = {
      'admin': 'platform_admin',
      'entity': 'project_lead',
      'individual': 'professional'
    };
    const mappedRole = roleMap[user.role] || 'professional';
    await PMTwinRBAC.assignRoleToUser(user.id, mappedRole, 'system', user.email);
    console.log('   Assigned role:', mappedRole);
    
    // Refresh menu
    await Navigation.refreshMenuItems();
    console.log('   Menu refreshed!');
  }
  
  console.log('=== End Debugging ===');
})();
```

## Expected Menu Items by Role

### Entity (project_lead)
Should see:
- Dashboard
- My Projects
- Create Project
- Opportunities
- Matches
- Proposals
- Pipeline
- Collaboration
- Profile
- Onboarding
- Notifications

### Individual (professional)
Should see:
- Dashboard
- My Projects (browse only)
- Opportunities
- Matches
- Proposals
- Pipeline
- Collaboration
- Profile
- Onboarding
- Notifications

## Still Not Working?

1. **Clear browser cache and localStorage:**
```javascript
localStorage.clear();
location.reload();
```

2. **Check script loading order** - Ensure scripts load in this order:
   - config.js
   - data.js
   - auth.js
   - services-loader.js (includes RBAC)
   - navigation.js

3. **Check for JavaScript errors** - Look for red errors in console

4. **Verify files exist:**
   - `data/roles.json`
   - `data/user-roles.json`
   - `services/rbac/role-service.js`
   - `services/dashboard/dashboard-service.js`

