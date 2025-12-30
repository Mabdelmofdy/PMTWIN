# Menu Visibility by Role

## Overview

This document outlines which menu items are visible to each role in the sidebar menu, based on their configured permissions in `roles.json`.

## Menu Items and Required Features

| Menu Item | Required Feature | Alternative Features |
|-----------|------------------|---------------------|
| Dashboard | `user_dashboard` | - |
| My Projects | `project_management` | `project_browsing` |
| Create Project | `project_creation` | - |
| Opportunities | `matches_view` | - |
| Matches | `matches_view` | - |
| Proposals | `proposal_management` | `proposal_creation`, `proposal_review` |
| Pipeline | `pipeline_management` | - |
| Collaboration | `collaboration_opportunities` | `collaboration_applications` |
| Profile | `profile_management` | - |
| Onboarding | `profile_management` | - |
| Notifications | `notifications` | - |
| Admin Dashboard | `admin_dashboard` | - |
| User Vetting | `user_vetting` | - |
| User Management | `user_management` | - |
| Project Moderation | `project_moderation` | - |
| Audit Trail | `audit_trail` | - |
| Reports | `reports` | - |

## Role-Based Menu Visibility

### Platform Admin (`platform_admin`)
**Sees:** ALL menu items (has `*` feature access)

- ✅ Dashboard
- ✅ My Projects
- ✅ Create Project
- ✅ Opportunities
- ✅ Matches
- ✅ Proposals
- ✅ Pipeline
- ✅ Collaboration (all models)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ✅ Admin Dashboard
- ✅ User Vetting
- ✅ User Management
- ✅ Project Moderation
- ✅ Audit Trail
- ✅ Reports

### Project Lead (`project_lead` / Entity)
**Sees:** Project management and collaboration features

- ✅ Dashboard
- ✅ My Projects (`project_management`)
- ✅ Create Project (`project_creation`)
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Proposals (`proposal_review`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (all models: 1.1-5.1)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Admin features

### Professional (`professional` / Individual)
**Sees:** Browsing, proposals, and collaboration applications

- ✅ Dashboard
- ✅ My Projects (`project_browsing` via alternative)
- ❌ Create Project (no `project_creation`)
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Proposals (`proposal_creation`, `proposal_management`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (models: 1.1, 1.2, 2.3, 4.1)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Admin features

### Supplier (`supplier`)
**Sees:** Bulk purchasing, resource marketplace, and strategic alliances

- ✅ Dashboard
- ✅ My Projects (`project_browsing` via alternative)
- ❌ Create Project
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Proposals (if has `proposal_creation` or `proposal_management`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (models: 2.2, 3.1, 3.2, 3.3)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Admin features

**Note:** Supplier role may need `proposal_creation` or `proposal_management` added if they should see Proposals menu.

### Service Provider (`service_provider`)
**Sees:** Task-based engagements and strategic alliances

- ✅ Dashboard
- ✅ My Projects (`project_browsing` via alternative)
- ❌ Create Project
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Proposals (`proposal_creation`, `proposal_management`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (models: 1.1, 2.2)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Admin features

### Consultant (`consultant`)
**Sees:** Task-based engagements, proposals, and strategic alliances

- ✅ Dashboard
- ✅ My Projects (`project_management`)
- ❌ Create Project
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Proposals (`proposal_creation`, `proposal_management`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (models: 1.1, 2.2, 4.2)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Admin features

### Mentor (`mentor`)
**Sees:** Mentorship management and basic features

- ✅ Dashboard
- ✅ My Projects (`project_browsing` via alternative)
- ❌ Create Project
- ✅ Opportunities (`matches_view`)
- ✅ Matches (`matches_view`)
- ✅ Pipeline (`pipeline_management`)
- ✅ Collaboration (model: 2.3)
- ✅ Profile
- ✅ Onboarding
- ✅ Notifications
- ❌ Proposals (unless added to features)
- ❌ Admin features

### Auditor (`auditor`)
**Sees:** Read-only admin features

- ✅ Dashboard (`user_dashboard`)
- ✅ My Projects (`project_browsing` via alternative)
- ❌ Create Project
- ✅ Admin Dashboard (`admin_dashboard`)
- ✅ Audit Trail (`audit_trail`)
- ✅ Reports (`reports`)
- ✅ Notifications
- ❌ User Vetting (read-only, no modify)
- ❌ User Management (read-only, no modify)
- ❌ Project Moderation (read-only, no modify)

## Feature Mapping Logic

The menu filtering uses the following logic:

1. **Primary Feature Check**: Check if user has the primary feature
2. **Alternative Features**: If primary not available, check alternative features
3. **Admin Feature Check**: Admin features (`admin_*`) only visible to `platform_admin`
4. **Separator Handling**: Separators always shown (for visual grouping)

## Adding New Menu Items

To add a new menu item:

1. **Add to `dashboard-service.js`** in `allMenuItems` array:
```javascript
{ 
  id: 'new-feature', 
  label: 'New Feature', 
  route: `${basePath}new-feature/`, 
  feature: 'new_feature_permission',
  alternativeFeatures: ['alternative_permission'], // Optional
  icon: '🆕' 
}
```

2. **Add feature to `roles.json`** for roles that should see it:
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
    "new_feature_permission": "Description of new feature"
  }
}
```

## Testing Menu Visibility

### Test Each Role

1. **Login as each role** using demo credentials
2. **Check sidebar menu** - should only show accessible modules
3. **Verify console logs** - check `[DashboardService]` logs for:
   - User role
   - Available features
   - Menu items before/after filtering

### Console Commands

```javascript
// Check current user's role
PMTwinRBAC.getCurrentUserRole().then(role => console.log('Role:', role));

// Check available features
PMTwinRBAC.getCurrentUserFeatures().then(features => console.log('Features:', features));

// Check menu items
DashboardService.getMenuItems().then(result => {
  console.log('Menu items:', result.items.map(i => ({ id: i.id, label: i.label, feature: i.feature })));
});
```

## Common Issues

### Menu Item Not Showing

1. **Check feature in role**: Verify role has the required feature in `roles.json`
2. **Check feature name**: Ensure feature name matches exactly (case-sensitive)
3. **Check console logs**: Look for filtering messages in browser console
4. **Check alternative features**: Verify if alternative features are configured

### Menu Item Showing When It Shouldn't

1. **Check feature requirement**: Ensure menu item has `feature` property
2. **Check admin features**: Verify `admin_*` features only for platform_admin
3. **Check filtering logic**: Review `filterMenuItemsByRole()` function

## Summary

Each role now sees only their accessible modules based on:
- ✅ Features defined in `roles.json`
- ✅ Menu item feature requirements
- ✅ Alternative feature support
- ✅ Admin feature restrictions
- ✅ RBAC filtering logic

The sidebar menu is now fully permission-based and each role will only see modules they have access to!

