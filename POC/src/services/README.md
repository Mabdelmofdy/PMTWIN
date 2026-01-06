# PMTwin Services Directory

This directory contains all service modules organized by feature/functionality. Each service implements role-based access control and provides a clean API for feature-specific operations.

## Directory Structure

```
services/
├── rbac/                    # Role-Based Access Control
│   └── role-service.js      # Core RBAC service for roles, permissions, and features
├── auth/                    # Authentication Services
│   └── auth-service.js      # Authentication operations with role integration
├── dashboard/               # Dashboard Services
│   └── dashboard-service.js # Role-based dashboard data and menu filtering
├── projects/                # Project Management Services
│   └── project-service.js   # Project CRUD with permission checks
├── proposals/               # Proposal Services
│   └── proposal-service.js  # Proposal management with role-based access
├── matching/                # Matching Algorithm Services
│   └── matching-service.js  # Match viewing and management
├── collaboration/           # Collaboration Services
│   └── collaboration-service.js # Collaboration opportunities and applications
├── notifications/           # Notification Services
│   └── notification-service.js # User notifications
├── admin/                   # Admin Services
│   └── admin-service.js     # Administrative operations (vetting, moderation, audit)
├── services-loader.js       # Service loader that initializes all services
└── README.md                # This file
```

## Role-Based Access Control

### Roles Configuration

Roles are defined in `data/roles.json` with the following structure:

```json
{
  "roles": {
    "roleId": {
      "id": "roleId",
      "name": "Role Name",
      "description": "Role description",
      "permissions": ["permission1", "permission2"],
      "features": ["feature1", "feature2"],
      "portals": ["portal1"],
      "restrictions": ["restriction1"]
    }
  }
}
```

### User-Role Assignment

User-to-role assignments are stored in `data/user-roles.json`:

```json
{
  "userRoles": [
    {
      "userId": "user_id",
      "email": "user@example.com",
      "roleId": "roleId",
      "assignedAt": "2024-01-01T00:00:00Z",
      "assignedBy": "system",
      "isActive": true
    }
  ]
}
```

## Service Usage

### Loading Services

Include the services loader in your HTML after `data.js` and `auth.js`:

```html
<script src="js/data.js"></script>
<script src="js/auth.js"></script>
<script src="services/services-loader.js"></script>
```

### Using Services

All services are available as global objects:

```javascript
// Check permissions
const canCreate = await PMTwinRBAC.canCurrentUserAccess('create_projects');

// Use project service
const result = await ProjectService.createProject(projectData);

// Get dashboard data
const dashboard = await DashboardService.getDashboardData();

// Get filtered menu items
const menu = await DashboardService.getMenuItems();
```

## Available Services

### PMTwinRBAC (Role Service)

- `getUserRole(userId, email)` - Get user's role
- `hasPermission(userId, permission, email)` - Check permission
- `hasFeatureAccess(userId, feature, email)` - Check feature access
- `getAvailableFeatures(userId, email)` - Get all available features
- `canCurrentUserAccess(permission)` - Check current user's permission
- `canCurrentUserSeeFeature(feature)` - Check if current user can see feature
- `filterMenuItemsByRole(menuItems, userId, email)` - Filter menu by role

### AuthService

- `login(email, password)` - Login with role assignment
- `logout()` - Logout
- `register(userData)` - Register with role assignment
- `canAccessRoute(route, userId)` - Check route access

### ProjectService

- `createProject(projectData)` - Create project (checks permission)
- `getProjects(filters)` - Get projects (filtered by role)
- `getProjectById(projectId)` - Get project (checks access)
- `updateProject(projectId, updates)` - Update project (checks permission)
- `deleteProject(projectId)` - Delete project (checks permission)

### ProposalService

- `createProposal(proposalData)` - Create proposal (checks permission)
- `getProposals(filters)` - Get proposals (filtered by role)
- `updateProposalStatus(proposalId, status, reason)` - Update status (checks permission)

### DashboardService

- `getDashboardData()` - Get role-based dashboard data
- `getMenuItems()` - Get filtered menu items based on role

### MatchingService

- `getMatches(filters)` - Get matches (checks permission)
- `getMatchById(matchId)` - Get match (checks access)
- `markMatchAsViewed(matchId)` - Mark as viewed

### CollaborationService

- `createCollaborationOpportunity(opportunityData)` - Create opportunity (checks permission)
- `getCollaborationOpportunities(filters)` - Get opportunities (filtered by role)
- `applyToCollaboration(opportunityId, applicationData)` - Apply (checks permission)
- `getCollaborationApplications(filters)` - Get applications (filtered by role)

### NotificationService

- `getNotifications(filters)` - Get notifications (checks permission)
- `markAsRead(notificationId)` - Mark notification as read
- `markAllAsRead()` - Mark all as read

### AdminService

- `getUsersForVetting(filters)` - Get users for vetting (admin only)
- `approveUser(userId, notes)` - Approve user (admin only)
- `rejectUser(userId, reason, notes)` - Reject user (admin only)
- `getAuditTrail(filters)` - Get audit trail (admin only)

## Features and Permissions

### Features

Features represent UI components or functional areas that users can access:
- `admin_dashboard` - Admin dashboard
- `user_dashboard` - User dashboard
- `project_creation` - Create projects
- `project_management` - Manage own projects
- `project_browsing` - Browse projects
- `proposal_creation` - Create proposals
- `matches_view` - View matches
- `collaboration_opportunities` - Collaboration features
- `notifications` - Notifications
- And more...

### Permissions

Permissions represent actions users can perform:
- `create_projects` - Create new projects
- `edit_own_projects` - Edit own projects
- `view_own_projects` - View own projects
- `view_all_projects` - View all projects (admin)
- `create_proposals` - Create proposals
- `approve_proposals` - Approve proposals
- `vet_users` - Vet users (admin)
- And more...

## Adding New Services

1. Create a new directory under `services/` for your feature
2. Create a service file (e.g., `my-feature-service.js`)
3. Implement the service following the pattern of existing services
4. Add role-based permission checks using `PMTwinRBAC`
5. Add the service path to `services-loader.js`
6. Document the service in this README

## Best Practices

1. **Always check permissions** - Use `PMTwinRBAC` to verify user permissions before operations
2. **Filter data by role** - Services should filter data based on user's role and permissions
3. **Return consistent results** - All service methods return `{ success: boolean, ... }`
4. **Handle errors gracefully** - Return error messages in the result object
5. **Use async/await** - Services are async to support role checking
6. **Document features** - Add new features to `roles.json` with descriptions


