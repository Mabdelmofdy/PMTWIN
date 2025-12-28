# Quick Start: Using the API Layer

## Current Setup (POC Mode)

The application currently uses **localStorage** for all data storage. No backend is required.

## Switching to Java Backend

### Step 1: Configure API URL

Edit `js/config.js`:

```javascript
const CONFIG = {
  api: {
    baseUrl: 'http://localhost:8080/api', // Your Java backend URL
    version: 'v1',
    timeout: 30000
  }
};
```

### Step 2: Test Connection

Open browser console and run:

```javascript
// Test API connection
const response = await ApiServices.users.getAll();
console.log('Response:', response);
```

### Step 3: Verify Fallback

If API fails, it automatically falls back to localStorage. Check console for warnings.

## Using API Services

### Get All Users

```javascript
const users = await ApiServices.users.getAll();
```

### Get User by ID

```javascript
const user = await ApiServices.users.getById('user_123');
```

### Create User

```javascript
const newUser = await ApiServices.users.create({
  email: 'test@example.com',
  name: 'Test User',
  role: 'individual'
});
```

### Update User

```javascript
const updated = await ApiServices.users.update('user_123', {
  name: 'Updated Name'
});
```

### Delete User

```javascript
await ApiServices.users.delete('user_123');
```

## Available Services

- `ApiServices.users` - User management
- `ApiServices.sessions` - Session management
- `ApiServices.projects` - Project management
- `ApiServices.proposals` - Proposal management
- `ApiServices.matches` - Match management
- `ApiServices.notifications` - Notification management
- `ApiServices.audit` - Audit log management
- `ApiServices.collaborationOpportunities` - Collaboration opportunities
- `ApiServices.collaborationApplications` - Collaboration applications

## Error Handling

All API calls automatically handle errors and fall back to localStorage:

```javascript
try {
  const users = await ApiServices.users.getAll();
  // Use users
} catch (error) {
  console.error('Error:', error);
  // Already handled by API service, falls back to localStorage
}
```

## Configuration Options

### Disable Caching

```javascript
const users = await ApiServices.users.getAll({ useCache: false });
```

### Custom Headers

```javascript
const response = await ApiClient.post('endpoint', data, {
  headers: { 'X-Custom-Header': 'value' }
});
```

### Change Timeout

```javascript
PMTwinConfig.set('api.timeout', 60000); // 60 seconds
```

## Testing

### Test in Development

1. Keep `baseUrl: null` in config.js
2. Application uses localStorage
3. All features work as before

### Test with Backend

1. Set `baseUrl: 'http://localhost:8080/api'`
2. Start Java backend
3. Application automatically uses API
4. Falls back to localStorage if API unavailable

## Troubleshooting

### API Not Working

- Check browser console for errors
- Verify API URL is correct
- Check CORS settings on backend
- Verify authentication token is set

### Still Using localStorage

- Check `config.js` - is `baseUrl` set?
- Check console for API errors
- API service automatically falls back to localStorage on error

### CORS Errors

Add CORS headers to your Java backend:

```java
@CrossOrigin(origins = "*")
@RestController
public class UserController {
    // ...
}
```

## Next Steps

1. Implement Java backend endpoints (see API_MIGRATION_GUIDE.md)
2. Test each endpoint
3. Update production config with real API URL
4. Monitor API usage and errors

