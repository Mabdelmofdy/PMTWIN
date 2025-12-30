# Centralized User Management

## Overview

All user authentication is now managed in one centralized place using `UserManager`. This ensures all demo users from `demo-users.json` are automatically created and synchronized with the authentication system.

## How It Works

### 1. Single Source of Truth: `data/demo-users.json`

All demo users are defined in one JSON file:

```json
{
  "users": [
    {
      "userId": "demo_platform_admin_001",
      "email": "admin@pmtwin.com",
      "password": "Admin123",
      "role": "platform_admin",
      "name": "Platform Administrator",
      "description": "..."
    },
    // ... all 8 demo users
  ]
}
```

### 2. UserManager (`js/user-manager.js`)

The `UserManager` module:
- Loads all users from `demo-users.json`
- Creates them in `PMTwinData.Users` storage
- Assigns roles via RBAC system
- Updates existing users if needed
- Runs automatically on page load

### 3. Role Assignment: `data/user-roles.json`

All user-to-role mappings are stored here:

```json
{
  "userRoles": [
    {
      "userId": "demo_platform_admin_001",
      "email": "admin@pmtwin.com",
      "roleId": "platform_admin",
      ...
    },
    // ... all 8 users
  ]
}
```

## Benefits

✅ **Single Source of Truth** - All users defined in `demo-users.json`  
✅ **Automatic Creation** - Users created automatically on app load  
✅ **Synchronized** - Users and roles always in sync  
✅ **Easy Updates** - Update one JSON file, affects entire system  
✅ **No Duplication** - User creation logic in one place  

## Usage

### Automatic Initialization

Users are automatically initialized when the app loads. Just include `user-manager.js`:

```html
<script src="../js/data.js"></script>
<script src="../js/user-manager.js"></script>
<script src="../js/auth.js"></script>
```

### Manual Initialization

```javascript
// Initialize all users
await UserManager.initializeAllUsers();

// Force reinitialize (recreates all users)
await UserManager.forceReinitializeUsers();

// Verify all users exist
const allExist = await UserManager.verifyAllUsersExist();
```

## Adding New Demo Users

1. **Add to `data/demo-users.json`:**
```json
{
  "userId": "demo_new_role_001",
  "email": "newuser@pmtwin.com",
  "password": "Password123",
  "role": "new_role",
  "name": "New User",
  "description": "Description here"
}
```

2. **Add to `data/user-roles.json`:**
```json
{
  "userId": "demo_new_role_001",
  "email": "newuser@pmtwin.com",
  "roleId": "new_role",
  "assignedAt": "2024-01-01T00:00:00Z",
  "assignedBy": "system",
  "isActive": true
}
```

3. **Add role to `data/roles.json`** (if new role)

4. **Refresh page** - User will be created automatically!

## Script Loading Order

**Important:** Scripts must load in this order:

1. `config.js` - Configuration
2. `data.js` - Data layer (PMTwinData)
3. `user-manager.js` - **User initialization (NEW)**
4. `auth.js` - Authentication
5. `auth-check.js` - Auth utilities
6. `services-loader.js` - Services (includes RBAC)

## Files Involved

- **`data/demo-users.json`** - All demo user definitions
- **`data/user-roles.json`** - User-to-role assignments
- **`js/user-manager.js`** - Centralized user management
- **`js/data.js`** - Updated to use UserManager

## Troubleshooting

### User Not Found Error

If login fails with "Invalid email or password":

1. **Check if user exists:**
```javascript
const user = PMTwinData.Users.getByEmail('service@pmtwin.com');
console.log('User:', user);
```

2. **Force reinitialize:**
```javascript
await UserManager.forceReinitializeUsers();
```

3. **Verify in console:**
```javascript
const allExist = await UserManager.verifyAllUsersExist();
console.log('All users exist:', allExist);
```

### User Created But Role Not Assigned

```javascript
// Check role
const role = await PMTwinRBAC.getUserRole(userId, email);
console.log('Current role:', role);

// Manually assign
await PMTwinRBAC.assignRoleToUser(userId, 'service_provider', 'system', email);
```

## Summary

All user authentication is now centralized:
- ✅ Users defined in `demo-users.json`
- ✅ Roles assigned in `user-roles.json`
- ✅ UserManager handles creation/updates
- ✅ Automatic initialization on app load
- ✅ Easy to add/update users

No more scattered user creation code - everything is in one place!

