# Quick Fix for Admin 404 Error

## Immediate Solution

**Access admin via redirect file:**
```
http://127.0.0.1:5503/admin/index.html
```

This will automatically redirect to the correct admin page.

## Why This Happens

Live Server doesn't support URL rewriting like Apache or Node.js servers. When you access `/admin/`, Live Server looks for:
- `/admin/index.html` ✅ (exists - redirects correctly)
- `/admin/` ❌ (doesn't exist as a directory)

## Solutions

### Solution 1: Use Redirect File (Easiest)
Always access: `http://127.0.0.1:5503/admin/index.html`
- Works immediately
- No configuration needed

### Solution 2: Use Node.js Server (Recommended)
```bash
cd POC
node server.js
```
Then access: `http://localhost:3000/admin/`
- All routes work perfectly
- No 404 errors
- Better development experience

### Solution 3: Configure Live Server
1. Make sure `.vscode/settings.json` exists (already created)
2. Right-click on `POC` folder → "Open with Live Server"
3. Access: `http://127.0.0.1:5503/admin/index.html`

## CSP Error

The CSP error shows `default-src 'none'` which is very restrictive. This can happen if:
- A browser extension is injecting a restrictive CSP
- Multiple CSP headers are being merged (most restrictive wins)
- The 404 error page itself has a restrictive CSP

**Solutions:**

1. **Hard refresh the page** (Ctrl+Shift+R or Cmd+Shift+R)
   - Clears cached CSP headers
   - Reloads the page with correct CSP

2. **Check browser extensions**
   - Some security extensions inject restrictive CSPs
   - Try disabling extensions temporarily
   - Try incognito/private mode

3. **Verify CSP is loaded**
   - Open DevTools → Network tab
   - Reload page
   - Check Response Headers for Content-Security-Policy
   - Should show our permissive CSP, not `default-src 'none'`

4. **If error persists**
   - The CSP has been updated to explicitly allow DevTools paths
   - Including specific port 5503 path for Live Server
   - Try accessing via Node.js server instead: `node server.js` → `http://localhost:3000/admin/`

**Note:** Chrome DevTools will still function even if you see the CSP error - it's often just a warning.

## Summary

✅ **Fixed**: Redirect file at `admin/index.html` with proper CSP
✅ **Fixed**: CSP updated in `pages/admin/index.html`
✅ **Created**: VS Code settings for Live Server
✅ **Created**: Node.js server with full routing support

**Best Practice**: Use `node server.js` for development - it handles all routes correctly!
