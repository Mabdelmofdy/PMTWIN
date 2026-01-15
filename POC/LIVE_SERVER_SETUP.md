# Live Server Setup Guide

## Quick Fix for `/admin/` 404 Error

### Option 1: Access via Redirect File (Easiest)
Access: `http://127.0.0.1:5503/admin/index.html`
- This will automatically redirect to the correct admin page
- Works immediately, no configuration needed

### Option 2: Configure Live Server Root (Recommended)

1. **Create VS Code settings** (already created in `.vscode/settings.json`):
   ```json
   {
     "liveServer.settings.root": "/POC",
     "liveServer.settings.port": 5503
   }
   ```

2. **Restart Live Server**:
   - Stop Live Server
   - Right-click on `POC` folder → "Open with Live Server"
   - Or use Command Palette: "Live Server: Open with Live Server" (select POC folder)

3. **Access admin**:
   - `http://127.0.0.1:5503/admin/index.html` (redirects automatically)
   - `http://127.0.0.1:5503/pages/admin/index.html` (direct access)

### Option 3: Use Node.js Server (Best for Development)

1. Open terminal in `POC` directory
2. Run: `node server.js`
3. Access: `http://localhost:3000/admin/`
   - All routes work perfectly!
   - No 404 errors
   - Proper URL routing

## CSP Error Fix

The Content Security Policy error has been fixed in:
- `POC/pages/admin/index.html` ✅
- `POC/admin/index.html` ✅ (redirect file)

**If you still see CSP errors:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Clear browser cache
3. Check browser extensions (some extensions set restrictive CSP)
4. Try incognito/private mode

## Troubleshooting

### Still getting 404?
- Make sure Live Server is running from the `POC` directory
- Check the URL: should be `http://127.0.0.1:5503/admin/index.html`
- Or use direct path: `http://127.0.0.1:5503/pages/admin/index.html`

### Still getting CSP errors?
- The CSP is already configured correctly
- Try hard refresh (Ctrl+Shift+R)
- Disable browser extensions temporarily
- Check if Chrome DevTools is actually blocked (it might just be a warning)

### Live Server not respecting settings?
- Close and reopen VS Code
- Restart Live Server
- Make sure `.vscode/settings.json` exists in the `POC` directory

## Recommended Setup

**For best experience, use the Node.js server:**
```bash
cd POC
node server.js
```

Then access: `http://localhost:3000/admin/`

This gives you:
- ✅ Proper URL routing (no 404s)
- ✅ All routes work correctly
- ✅ No CSP issues
- ✅ Better development experience
