# Local Development Setup Guide

## Quick Fix for Live Server Users

If you're using **Live Server** (VS Code extension) and getting a 404 error for `/admin/`, you have two options:

### Option 1: Use the Redirect File (Easiest)
1. Access admin via: `http://127.0.0.1:5503/admin/index.html`
   - This will automatically redirect to the correct admin page

### Option 2: Use the Node.js Server (Recommended)
1. Open terminal in the `POC` directory
2. Run: `node server.js`
3. Access admin via: `http://localhost:3000/admin/`
   - This server handles all URL routing properly

## CSP Error Fix

The Content Security Policy (CSP) error for Chrome DevTools has been fixed in `pages/admin/index.html`. 

**If you still see the CSP error:**
1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check if any browser extensions are interfering

## Accessing Admin Pages

### With Live Server
- Direct access: `http://127.0.0.1:5503/pages/admin/index.html`
- Via redirect: `http://127.0.0.1:5503/admin/index.html`

### With Node.js Server (server.js)
- Admin: `http://localhost:3000/admin/`
- Dashboard: `http://localhost:3000/dashboard/`
- All routes work as expected!

### With Apache
- Admin: `http://localhost/admin/` (uses `.htaccess`)

### With IIS/Windows
- Admin: `http://localhost/admin/` (uses `web.config`)

## Troubleshooting

### Still getting 404?
- Make sure you're accessing the correct URL
- Check that the file exists at `POC/pages/admin/index.html`
- Try accessing directly: `http://127.0.0.1:5503/pages/admin/index.html`

### Still getting CSP errors?
- Hard refresh the browser (Ctrl+Shift+R)
- Check browser console for the exact CSP error
- Disable browser extensions temporarily
- Try incognito/private mode

### Node.js server not working?
- Make sure Node.js is installed: `node --version`
- Check if port 3000 is already in use
- Try a different port by editing `server.js`
