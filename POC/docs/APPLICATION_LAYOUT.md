# Application Layout System

## Overview

The PMTwin application now uses a unified layout system that automatically includes the sidebar menu and navbar on all authenticated pages. You no longer need to implement the menu in each HTML page individually.

## How It Works

### Automatic Layout Initialization

When a user is authenticated and visits any page, the layout system automatically:

1. **Checks Authentication** - Verifies user is logged in
2. **Creates Sidebar** - Generates the sidebar menu with role-based items
3. **Creates Navbar** - Generates the top navigation bar
4. **Adjusts Layout** - Automatically adjusts main content margin for sidebar

### Files Involved

- **`js/layout.js`** - Layout management and margin adjustment
- **`js/app-init.js`** - Automatic initialization for all pages
- **`js/navigation.js`** - Sidebar and navbar rendering (existing)

## Usage

### For New Pages

Simply include the layout scripts in your HTML:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page - PMTwin</title>
    <link rel="stylesheet" href="../css/main.css">
</head>
<body>
    <!-- Your page content -->
    <main>
        <div class="container" style="padding: 2rem 0;">
            <h1>My Page</h1>
            <div id="pageContent">
                <!-- Your content here -->
            </div>
        </div>
    </main>

    <!-- Core Scripts (required) -->
    <script src="../js/config.js"></script>
    <script src="../js/api/api-client.js"></script>
    <script src="../js/api/api-service.js"></script>
    <script src="../js/data.js"></script>
    <script src="../js/auth.js"></script>
    <script src="../js/auth-check.js"></script>
    <script src="../js/demo-credentials.js"></script>
    <script src="../services/services-loader.js"></script>
    <script src="../data/data-loader.js"></script>
    
    <!-- Layout and Navigation (includes sidebar) -->
    <script src="../js/layout.js"></script>
    <script src="../js/navigation.js"></script>
    <script src="../js/app-init.js"></script>
    
    <!-- Your page scripts -->
    <script src="../features/my-feature/my-feature.js"></script>
    
    <!-- Initialize -->
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            const isAuth = await AuthCheck.checkAuth({ requireAuth: true });
            if (!isAuth) return;
            
            // Your page initialization
            if (window.myFeature) {
                window.myFeature.init();
            }
        });
    </script>
</body>
</html>
```

### Script Loading Order

**Important:** Scripts must be loaded in this order:

1. **Configuration** - `config.js`
2. **API Layer** - `api-client.js`, `api-service.js`
3. **Core Services** - `data.js`, `auth.js`, `auth-check.js`
4. **Data Loaders** - `services-loader.js`, `data-loader.js`
5. **Layout System** - `layout.js`, `navigation.js`, `app-init.js`
6. **Page Scripts** - Your feature-specific scripts

### What Gets Added Automatically

When `app-init.js` runs, it automatically:

1. ✅ Creates sidebar menu (if user is authenticated)
2. ✅ Creates top navbar
3. ✅ Filters menu items based on user role
4. ✅ Adjusts main content margin for sidebar
5. ✅ Handles responsive behavior (sidebar hidden on mobile)

## Sidebar Behavior

### Desktop (≥769px)
- Sidebar is **always visible** by default
- Main content has 280px left margin
- Sidebar can be toggled with hamburger menu button

### Mobile (<768px)
- Sidebar is **hidden by default**
- Main content has no left margin
- Sidebar opens when hamburger menu is clicked
- Overlay appears when sidebar is open

## Updating Existing Pages

To update existing pages to use the new layout system:

### Step 1: Remove Manual Navigation Code

Remove any manual sidebar/navbar creation code from your page initialization.

**Before:**
```javascript
// Remove this
if (typeof Navigation !== 'undefined') {
    await Navigation.init({ showSidebar: true });
}
```

### Step 2: Add Layout Scripts

Add these scripts before your page-specific scripts:

```html
<!-- Layout and Navigation -->
<script src="../js/layout.js"></script>
<script src="../js/navigation.js"></script>
<script src="../js/app-init.js"></script>
```

### Step 3: Ensure Main Element

Make sure your page has a `<main>` element:

```html
<main>
    <div class="container" style="padding: 2rem 0;">
        <!-- Your content -->
    </div>
</main>
```

The layout system will automatically adjust the margin of the `<main>` element.

## Manual Initialization

If you need to manually initialize the layout:

```javascript
// Wait for scripts to load
await new Promise(resolve => setTimeout(resolve, 300));

// Initialize layout
if (typeof AppLayout !== 'undefined') {
    await AppLayout.init({ 
        showSidebar: true, 
        sidebarAlwaysOpen: true 
    });
}
```

## Customization

### Disable Sidebar on Specific Page

```javascript
// In your page initialization
if (typeof Navigation !== 'undefined') {
    await Navigation.init({ showSidebar: false });
}
```

### Custom Sidebar Behavior

```javascript
// Sidebar always open
await AppLayout.init({ sidebarAlwaysOpen: true });

// Sidebar closed by default
await AppLayout.init({ sidebarAlwaysOpen: false });
```

## Troubleshooting

### Sidebar Not Showing

1. **Check Authentication:**
   ```javascript
   console.log('Authenticated:', PMTwinAuth.isAuthenticated());
   ```

2. **Check Scripts Loaded:**
   ```javascript
   console.log('Navigation:', typeof Navigation);
   console.log('AppLayout:', typeof AppLayout);
   ```

3. **Check Console Logs:**
   Look for `[AppInit]`, `[Layout]`, and `[Navigation]` logs

### Menu Items Not Showing

See `MENU_DEBUGGING.md` for detailed debugging steps.

### Layout Not Adjusting

```javascript
// Manually adjust margin
if (typeof AppLayout !== 'undefined') {
    AppLayout.adjustMainContentMargin();
}
```

## Benefits

✅ **Consistent Layout** - All pages have the same sidebar and navbar  
✅ **No Duplication** - Menu code in one place  
✅ **Automatic** - Works automatically for authenticated users  
✅ **Role-Based** - Menu items filtered by user role  
✅ **Responsive** - Works on desktop and mobile  
✅ **Easy to Maintain** - Update menu in one place, affects all pages  

## Example: Updated Dashboard Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - PMTwin</title>
    <link rel="stylesheet" href="../css/main.css">
</head>
<body>
    <main>
        <div class="container" style="padding: 2rem 0;">
            <div id="dashboardContent">
                <!-- Dashboard content -->
            </div>
        </div>
    </main>

    <!-- Core Scripts -->
    <script src="../js/config.js"></script>
    <script src="../js/api/api-client.js"></script>
    <script src="../js/api/api-service.js"></script>
    <script src="../js/data.js"></script>
    <script src="../js/auth.js"></script>
    <script src="../js/auth-check.js"></script>
    <script src="../js/demo-credentials.js"></script>
    <script src="../services/services-loader.js"></script>
    <script src="../data/data-loader.js"></script>
    
    <!-- Layout System (includes sidebar) -->
    <script src="../js/layout.js"></script>
    <script src="../js/navigation.js"></script>
    <script src="../js/app-init.js"></script>
    
    <!-- Dashboard Component -->
    <script src="../features/dashboard/dashboard.js"></script>
    
    <!-- Initialize -->
    <script>
        document.addEventListener('DOMContentLoaded', async function() {
            const isAuth = await AuthCheck.checkAuth({ requireAuth: true });
            if (!isAuth) return;
            
            // Dashboard initialization
            if (window.dashboard && window.dashboard.dashboard) {
                window.dashboard.dashboard.init();
            }
        });
    </script>
</body>
</html>
```

That's it! The sidebar and navbar are automatically included.

