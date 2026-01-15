# Navigation Menu Cleanup - Legacy Models Removed

## Overview
Removed all legacy workflow menu items from navigation sidebar. Only new Opportunity workflow items are now visible.

## Changes Made

### Files Modified

1. **POC/src/services/dashboard/dashboard-service.js**
   - Removed from `coreMenuItems`:
     - "My Projects" (legacy)
     - "Projects" (legacy)
     - "Create Project" (legacy)
     - "Pipeline" (legacy)
     - "My Services" (legacy)
   - Added:
     - "Create Opportunity" (new workflow)
   - Kept:
     - Dashboard
     - Opportunities
     - Matches
     - Proposals

2. **POC/src/core/layout/navigation.js**
   - Removed from `allItems`:
     - "My Projects" (legacy)
     - "Create Project" (legacy)
     - "Pipeline" (legacy)
   - Added:
     - "Create Opportunity" (new workflow)
   - Kept:
     - Dashboard
     - Opportunities
     - Matches
     - Proposals
     - Collaboration (part of opportunity workflow)
     - Notifications
     - Admin items

3. **POC/src/services/dashboard/dashboard-service.js** (additionalMenuItems)
   - Removed legacy service-related items:
     - Service Marketplace
     - Service Evaluations
     - Service Provider Profile
     - Service Requests
     - Skills Search
     - Service Engagements
   - Kept:
     - Notifications
     - Admin items

## New Navigation Menu Structure

### Core Menu Items (Visible to All Users)
1. **Dashboard** - User dashboard
2. **Opportunities** - Browse all opportunities (REQUEST_SERVICE, OFFER_SERVICE, MEGA)
3. **Create Opportunity** - Create new opportunity (replaces "Create Project")
4. **Matches** - View matched opportunities
5. **Proposals** - Manage proposals (submitted and incoming)

### Additional Items (Role-Based)
- **Collaboration** - Collaboration models (part of opportunity workflow)
- **Notifications** - User notifications
- **Admin Dashboard** - Admin-only features

## Legacy Routes (Still Redirect)
The following routes still exist in `nav-routes.js` but redirect to opportunities:
- `projects` → `/pages/opportunities/index.html`
- `my-projects` → `/pages/opportunities/index.html`
- `create-project` → `/pages/opportunities/create/index.html`
- `project-view` → `/pages/opportunities/index.html`

These redirects ensure backward compatibility if any old links exist.

## Verification

After changes:
1. ✅ Sidebar shows only: Dashboard, Opportunities, Create Opportunity, Matches, Proposals
2. ✅ No "My Projects", "Projects", "Create Project", "Pipeline", "My Services" in menu
3. ✅ Legacy routes still redirect to opportunities (backward compatibility)
4. ✅ All menu items link to opportunity workflow pages

## Notes

- Legacy pages (`/pages/my-projects/`, `/pages/pipeline/`, `/pages/my-services/`) still exist but are not accessible via menu
- Users can still access these pages via direct URL, but they should use opportunities instead
- All new workflows use Opportunity model only
- Menu items are filtered by RBAC permissions (features)
