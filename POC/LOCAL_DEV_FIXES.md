# Local Development Fixes

## Issues Fixed

### 1. CSP (Content Security Policy) Error
**Error**: `Connecting to 'http://127.0.0.1:5503/.well-known/appspecific/com.chrome.devtools.json' violates the following Content Security Policy directive: "default-src 'none'"`

**Solution**: Updated the CSP in `POC/pages/admin/index.html` to explicitly allow:
- Chrome DevTools connections via `.well-known` path
- WebSocket connections (ws:// and wss://) for DevTools
- Local development servers (127.0.0.1:* and localhost:*)
- External resources (Google Fonts, Phosphor Icons)
- Inline scripts and styles (needed for local development)

**Updated CSP includes**:
- `connect-src` with explicit `.well-known/*` paths for Chrome DevTools
- WebSocket support (ws:// and wss://) for DevTools debugging
- More permissive settings for local development

### 2. "admin/:1" 404 Error
**Error**: `admin/:1 Failed to load resource: the server responded with a status of 404 (Not Found)`

**Explanation**: This is typically a harmless browser request for a source map file (`.map` files). Browsers automatically try to load source maps for debugging. Since we don't have source maps, this 404 is expected and can be safely ignored.

**Note**: This doesn't affect functionality - it's just the browser trying to load debugging information that doesn't exist.

**If you're getting a 404 when accessing `/admin/`**:
- **Live Server**: 
  - Option 1: Use redirect file at `http://127.0.0.1:5503/admin/index.html` (automatically redirects)
  - Option 2: Access directly via `http://127.0.0.1:5503/pages/admin/index.html`
  - Option 3: Use the Node.js server (`node server.js`) for proper routing
- **Apache**: The `.htaccess` file will handle routing automatically
- **IIS/Windows**: The `web.config` file will handle routing automatically
- **Node.js Server**: Run `node server.js` in the POC directory, then access `http://localhost:3000/admin/`

## Files Modified

- `POC/pages/admin/index.html` - Updated CSP meta tag with explicit Chrome DevTools support
- `POC/.htaccess` - Added Apache rewrite rules for admin routes
- `POC/web.config` - Added IIS rewrite rules for admin routes

## Testing

After these fixes:
1. The CSP error should no longer appear in the console
2. Chrome DevTools should work correctly without CSP violations
3. The "admin/:1" 404 can be ignored (it's harmless)
4. Admin routes should work if using Apache or IIS

## Accessing Admin Pages

### Using Live Server (VS Code Extension)
- Direct file access: `http://127.0.0.1:5503/pages/admin/index.html`
- Or navigate from the root: `http://127.0.0.1:5503/` → click admin link

### Using Apache
- Access via: `http://localhost/admin/` (routing handled by `.htaccess`)

### Using IIS/Windows Server
- Access via: `http://localhost/admin/` (routing handled by `web.config`)

## For Production

When deploying to production (e.g., Vercel), you may want to:
1. Tighten the CSP policy for better security
2. Remove `'unsafe-inline'` and `'unsafe-eval'` if possible
3. Use nonces or hashes for inline scripts/styles
4. Remove `.well-known` paths if not needed
5. The `vercel.json` file handles routing for Vercel deployments

For now, the permissive CSP is appropriate for local development.
