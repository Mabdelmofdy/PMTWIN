# API Migration Guide

## Overview

This guide explains how the PMTwin frontend has been structured to work with a future Java backend API. The application now uses an abstraction layer that automatically falls back to localStorage when the API is not configured.

## Architecture

### Current Structure

```
┌─────────────────────────────────────┐
│     Application Code                │
│  (services, features, components)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│     API Service Layer                │
│  (api-service.js)                   │
└──────────────┬──────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────┐
│  API Client │  │ localStorage │
│ (api-client)│  │  (fallback)  │
└─────────────┘  └──────────────┘
       │
       ▼
┌─────────────┐
│ Java Backend│
│   (future)  │
└─────────────┘
```

## Configuration

### Setting Up API Endpoints

Edit `js/config.js` to configure your API:

```javascript
const CONFIG = {
  api: {
    // Set to your Java backend URL
    baseUrl: 'https://api.pmtwin.com', // or 'http://localhost:8080/api'
    version: 'v1',
    timeout: 30000
  }
};
```

### Development Mode (localStorage)

To use localStorage (current POC mode), set:

```javascript
api: {
  baseUrl: null, // Uses localStorage
}
```

## API Endpoints Expected

Your Java backend should implement these REST endpoints:

### Users
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{id}` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

### Sessions
- `GET /api/v1/sessions` - Get all sessions
- `POST /api/v1/sessions` - Create session (login)
- `DELETE /api/v1/sessions/{token}` - Delete session (logout)

### Projects
- `GET /api/v1/projects` - Get all projects
- `GET /api/v1/projects/{id}` - Get project by ID
- `POST /api/v1/projects` - Create project
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project

### Proposals
- `GET /api/v1/proposals` - Get all proposals
- `GET /api/v1/proposals/{id}` - Get proposal by ID
- `POST /api/v1/proposals` - Create proposal
- `PUT /api/v1/proposals/{id}` - Update proposal
- `DELETE /api/v1/proposals/{id}` - Delete proposal

### Notifications
- `GET /api/v1/notifications` - Get all notifications
- `GET /api/v1/notifications/{id}` - Get notification by ID
- `POST /api/v1/notifications` - Create notification
- `PUT /api/v1/notifications/{id}` - Update notification
- `DELETE /api/v1/notifications/{id}` - Delete notification

## Request/Response Format

### Request Headers

All requests include:
```
Content-Type: application/json
Authorization: Bearer {token}  // If authenticated
```

### Response Format

Success response:
```json
{
  "success": true,
  "data": { ... },
  "status": 200
}
```

Error response:
```json
{
  "success": false,
  "message": "Error message",
  "status": 400,
  "errors": [ ... ]
}
```

## Authentication

The API client automatically includes the authentication token from localStorage (`pmtwin_auth_token`).

### Login Flow

1. Frontend sends credentials to `POST /api/v1/sessions`
2. Backend returns session token
3. Frontend stores token: `localStorage.setItem('pmtwin_auth_token', token)`
4. All subsequent requests include: `Authorization: Bearer {token}`

### Logout Flow

1. Frontend calls `DELETE /api/v1/sessions/{token}`
2. Frontend clears token: `localStorage.removeItem('pmtwin_auth_token')`

## Error Handling

The API client includes automatic retry logic and error handling:

- **400 Bad Request**: Client error, no retry
- **401 Unauthorized**: Authentication required, no retry
- **403 Forbidden**: Permission denied, no retry
- **500 Server Error**: Retry up to 3 times
- **Network Error**: Retry up to 3 times

## Caching

GET requests are automatically cached for 5 minutes. Cache is invalidated on:
- POST/PUT/PATCH/DELETE requests
- Manual cache clear

## Migration Steps

### Step 1: Update HTML Files

Add the new scripts to your HTML files (before data.js):

```html
<!-- Configuration -->
<script src="js/config.js"></script>

<!-- API Client -->
<script src="js/api/api-client.js"></script>
<script src="js/api/api-service.js"></script>

<!-- Existing scripts -->
<script src="js/data.js"></script>
```

### Step 2: Configure API URL

When ready to connect to Java backend:

1. Edit `js/config.js`
2. Set `api.baseUrl` to your backend URL
3. Test connection

### Step 3: Update Backend

Implement the REST endpoints listed above in your Java backend.

### Step 4: Test

1. Start with `baseUrl: null` (localStorage mode)
2. Switch to `baseUrl: 'http://localhost:8080/api'`
3. Verify all features work with API

## Benefits

1. **Seamless Migration**: Switch between localStorage and API with one config change
2. **Automatic Fallback**: If API fails, automatically uses localStorage
3. **Error Handling**: Built-in retry logic and error handling
4. **Caching**: Automatic response caching for better performance
5. **Type Safety**: Consistent request/response format

## Testing

### Test API Connection

```javascript
// In browser console
const response = await ApiServices.users.getAll();
console.log('Users from API:', response);
```

### Test Fallback

```javascript
// Disable API
PMTwinConfig.set('api.baseUrl', null);

// Should use localStorage
const users = await ApiServices.users.getAll();
console.log('Users from localStorage:', users);
```

## Next Steps

1. Implement Java backend with REST endpoints
2. Add authentication/authorization
3. Add request validation
4. Add rate limiting
5. Add logging and monitoring

