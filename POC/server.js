/**
 * Simple Node.js server for local development
 * Handles URL routing that Live Server doesn't support
 * 
 * Usage: node server.js
 * Then access: http://localhost:3000/admin/
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const BASE_DIR = __dirname;

// Route mapping (from vercel.json - comprehensive list)
const routes = {
    // Root and home
    '/': 'pages/home/index.html',
    '/home': 'pages/home/index.html',
    '/home/': 'pages/home/index.html',
    
    // Auth routes
    '/login': 'pages/auth/login/index.html',
    '/login/': 'pages/auth/login/index.html',
    '/auth/login': 'pages/auth/login/index.html',
    '/auth/login/': 'pages/auth/login/index.html',
    '/signup': 'pages/auth/signup/index.html',
    '/signup/': 'pages/auth/signup/index.html',
    '/auth/signup': 'pages/auth/signup/index.html',
    '/auth/signup/': 'pages/auth/signup/index.html',
    
    // Admin routes
    '/admin': 'pages/admin/index.html',
    '/admin/': 'pages/admin/index.html',
    '/admin-vetting': 'pages/admin-vetting/index.html',
    '/admin-vetting/': 'pages/admin-vetting/index.html',
    '/admin-moderation': 'pages/admin-moderation/index.html',
    '/admin-moderation/': 'pages/admin-moderation/index.html',
    '/admin-audit': 'pages/admin-audit/index.html',
    '/admin-audit/': 'pages/admin-audit/index.html',
    '/admin-reports': 'pages/admin-reports/index.html',
    '/admin-reports/': 'pages/admin-reports/index.html',
    
    // Main app routes
    '/dashboard': 'pages/dashboard/index.html',
    '/dashboard/': 'pages/dashboard/index.html',
    '/projects': 'pages/projects/index.html',
    '/projects/': 'pages/projects/index.html',
    '/my-projects': 'pages/my-projects/index.html',
    '/my-projects/': 'pages/my-projects/index.html',
    '/create-project': 'pages/projects/create/index.html',
    '/create-project/': 'pages/projects/create/index.html',
    '/project': 'pages/projects/view/index.html',
    '/project/': 'pages/projects/view/index.html',
    
    // Discovery and matching
    '/discovery': 'pages/discovery/index.html',
    '/discovery/': 'pages/discovery/index.html',
    '/wizard': 'pages/wizard/index.html',
    '/wizard/': 'pages/wizard/index.html',
    '/knowledge': 'pages/knowledge/index.html',
    '/knowledge/': 'pages/knowledge/index.html',
    '/opportunities': 'pages/opportunities/index.html',
    '/opportunities/': 'pages/opportunities/index.html',
    '/opportunities/create': 'pages/opportunities/create/index.html',
    '/opportunities/create/': 'pages/opportunities/create/index.html',
    '/matches': 'pages/matches/index.html',
    '/matches/': 'pages/matches/index.html',
    
    // Proposals and pipeline
    '/proposals': 'pages/proposals/index.html',
    '/proposals/': 'pages/proposals/index.html',
    '/create-proposal': 'pages/proposals/create/index.html',
    '/create-proposal/': 'pages/proposals/create/index.html',
    '/pipeline': 'pages/pipeline/index.html',
    '/pipeline/': 'pages/pipeline/index.html',
    
    // Collaboration routes
    '/collaboration': 'pages/collaboration/index.html',
    '/collaboration/': 'pages/collaboration/index.html',
    '/collab-task-based': 'pages/collaboration/task-based/index.html',
    '/collab-task-based/': 'pages/collaboration/task-based/index.html',
    '/collab-consortium': 'pages/collaboration/consortium/index.html',
    '/collab-consortium/': 'pages/collaboration/consortium/index.html',
    '/collab-jv': 'pages/collaboration/joint-venture/index.html',
    '/collab-jv/': 'pages/collaboration/joint-venture/index.html',
    '/collab-spv': 'pages/collaboration/spv/index.html',
    '/collab-spv/': 'pages/collaboration/spv/index.html',
    '/collab-strategic-jv': 'pages/collaboration/strategic-jv/index.html',
    '/collab-strategic-jv/': 'pages/collaboration/strategic-jv/index.html',
    '/collab-strategic-alliance': 'pages/collaboration/strategic-alliance/index.html',
    '/collab-strategic-alliance/': 'pages/collaboration/strategic-alliance/index.html',
    '/collab-mentorship': 'pages/collaboration/mentorship/index.html',
    '/collab-mentorship/': 'pages/collaboration/mentorship/index.html',
    '/collab-bulk-purchasing': 'pages/collaboration/bulk-purchasing/index.html',
    '/collab-bulk-purchasing/': 'pages/collaboration/bulk-purchasing/index.html',
    '/collab-co-ownership': 'pages/collaboration/co-ownership/index.html',
    '/collab-co-ownership/': 'pages/collaboration/co-ownership/index.html',
    '/collab-resource-exchange': 'pages/collaboration/resource-exchange/index.html',
    '/collab-resource-exchange/': 'pages/collaboration/resource-exchange/index.html',
    '/collab-professional-hiring': 'pages/collaboration/professional-hiring/index.html',
    '/collab-professional-hiring/': 'pages/collaboration/professional-hiring/index.html',
    '/collab-consultant-hiring': 'pages/collaboration/consultant-hiring/index.html',
    '/collab-consultant-hiring/': 'pages/collaboration/consultant-hiring/index.html',
    '/collab-competition': 'pages/collaboration/competition/index.html',
    '/collab-competition/': 'pages/collaboration/competition/index.html',
    
    // User routes
    '/profile': 'pages/profile/index.html',
    '/profile/': 'pages/profile/index.html',
    '/onboarding': 'pages/onboarding/index.html',
    '/onboarding/': 'pages/onboarding/index.html',
    '/notifications': 'pages/notifications/index.html',
    '/notifications/': 'pages/notifications/index.html',
    
    // Service routes
    '/service-providers': 'pages/service-providers/index.html',
    '/service-providers/': 'pages/service-providers/index.html',
    '/service-requests': 'pages/service-requests/index.html',
    '/service-requests/': 'pages/service-requests/index.html',
    '/service-requests/view': 'pages/service-requests/view/index.html',
    '/service-requests/view/': 'pages/service-requests/view/index.html',
    '/services-marketplace': 'pages/services-marketplace/index.html',
    '/services-marketplace/': 'pages/services-marketplace/index.html',
    '/my-services': 'pages/my-services/index.html',
    '/my-services/': 'pages/my-services/index.html',
    '/service-engagements': 'pages/service-engagements/index.html',
    '/service-engagements/': 'pages/service-engagements/index.html',
    
    // Other routes
    '/merchant-portal': 'pages/merchant-portal/index.html',
    '/merchant-portal/': 'pages/merchant-portal/index.html',
    '/settings': 'pages/settings/index.html',
    '/settings/': 'pages/settings/index.html',
};

// MIME types
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // Remove trailing slash for consistency (except root)
    if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    // Check if route exists in mapping
    let filePath;
    if (routes[pathname] || routes[pathname + '/']) {
        filePath = routes[pathname] || routes[pathname + '/'];
    } else {
        // Try to serve file directly
        filePath = pathname === '/' ? 'index.html' : pathname;
    }

    // Resolve full file path
    const fullPath = path.join(BASE_DIR, filePath);

    // Get file extension for MIME type
    const ext = path.extname(fullPath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    // Check if file exists
    fs.access(fullPath, fs.constants.F_OK, (err) => {
        if (err) {
            // File not found
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`
                <!DOCTYPE html>
                <html>
                <head><title>404 Not Found</title></head>
                <body>
                    <h1>404 - File Not Found</h1>
                    <p>The requested path "${pathname}" was not found.</p>
                    <p>File path attempted: ${filePath}</p>
                    <p><a href="/">Go to Home</a></p>
                </body>
                </html>
            `);
            return;
        }

        // Read and serve file
        fs.readFile(fullPath, (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/html' });
                res.end('<h1>500 - Internal Server Error</h1>');
                return;
            }

            // Set headers
            const headers = {
                'Content-Type': contentType,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            };

            res.writeHead(200, headers);
            res.end(data);
        });
    });
});

server.listen(PORT, () => {
    console.log(`\n🚀 Local development server running at http://localhost:${PORT}`);
    console.log(`📁 Serving files from: ${BASE_DIR}`);
    console.log(`\n✨ Routes configured:`);
    Object.keys(routes).slice(0, 10).forEach(route => {
        console.log(`   ${route} → ${routes[route]}`);
    });
    console.log(`   ... and more\n`);
    console.log(`💡 Access admin dashboard at: http://localhost:${PORT}/admin/`);
    console.log(`\nPress Ctrl+C to stop the server\n`);
});
