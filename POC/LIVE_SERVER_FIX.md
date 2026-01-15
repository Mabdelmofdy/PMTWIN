# Fix for Live Server 404 and CSP Errors

## Problem
When using Live Server (VS Code extension), accessing `/admin/` results in:
1. **404 Error** - Live Server doesn't support URL rewriting
2. **CSP Error** - Chrome DevTools connection blocked

## Solutions

### Solution 1: Use Node.js Server (Recommended) ✅

The Node.js server (`server.js`) properly handles URL routing:

```bash
cd POC
node server.js
```

Then access: `http://localhost:3000/admin/`

**Benefits:**
- ✅ Proper URL routing (no 404 errors)
- ✅ Works exactly like production
- ✅ No CSP issues

### Solution 2: Access Direct File Path

Instead of `/admin/`, access the file directly:

**If Live Server root is `POC` folder:**
- `http://localhost:5503/pages/admin/index.html`

**If Live Server root is workspace root:**
- `http://localhost:5503/POC/pages/admin/index.html`

### Solution 3: Use Redirect File

A redirect file exists at `POC/admin/index.html` that should automatically redirect you. If it's not working:

1. **Check Live Server root**: Make sure Live Server is running from the `POC` folder
2. **Access redirect file directly**: `http://localhost:5503/admin/index.html`
3. **Hard refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac) to clear cache

### Solution 4: Fix CSP Error

The CSP error is usually caused by:
1. **Browser extensions** - Some security extensions inject restrictive CSPs
2. **Cached CSP** - Old CSP headers cached by browser
3. **404 page CSP** - The 404 error page itself might have a restrictive CSP

**To fix:**

1. **Hard refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)
2. **Disable browser extensions** temporarily
3. **Try incognito/private mode**
4. **Clear browser cache** completely
5. **Check DevTools Network tab** - Look at Response Headers for Content-Security-Policy

### Solution 5: Configure Live Server

Add this to `.vscode/settings.json`:

```json
{
  "liveServer.settings.root": "/POC",
  "liveServer.settings.port": 5503,
  "liveServer.settings.CustomBrowser": "chrome"
}
```

Then restart Live Server.

## Quick Test

1. **Test Node.js server:**
   ```bash
   cd POC
   node server.js
   ```
   Open: `http://localhost:3000/admin/`

2. **Test direct file access:**
   Open: `http://localhost:5503/pages/admin/index.html`

3. **Test redirect:**
   Open: `http://localhost:5503/admin/index.html`

## Why This Happens

- **Live Server** is a simple static file server - it doesn't support URL rewriting
- **URL rewriting** requires server-side configuration (Apache `.htaccess`, IIS `web.config`, or Node.js routing)
- **CSP errors** occur when the browser can't connect to Chrome DevTools due to restrictive security policies

## Best Practice

**For development, use the Node.js server** (`node server.js`) as it:
- Properly handles all routes
- Matches production behavior
- Avoids 404 and CSP issues
- Supports all features
