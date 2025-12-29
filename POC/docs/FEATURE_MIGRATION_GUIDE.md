# Feature-Based Structure Migration Guide

## New Structure

```
POC/
├── index.html                    # Single entry point/router
├── js/
│   ├── router.js                 # Application router
│   ├── data.js                   # Core data layer (keep)
│   ├── auth.js                   # Core auth (keep)
│   └── ...                       # Other core utilities
├── features/                     # Feature-based modules
│   ├── auth/
│   │   ├── login.html
│   │   ├── login.js
│   │   ├── signup.html
│   │   └── signup.js
│   ├── dashboard/
│   │   ├── dashboard.html
│   │   └── dashboard.js
│   ├── projects/
│   │   ├── projects-list.html
│   │   ├── projects-list.js
│   │   ├── project-create.html
│   │   ├── project-create.js
│   │   ├── project-view.html
│   │   └── project-view.js
│   ├── proposals/
│   │   ├── proposals-list.html
│   │   ├── proposals-list.js
│   │   ├── proposal-create.html
│   │   └── proposal-create.js
│   ├── matching/
│   │   ├── opportunities.html
│   │   ├── opportunities.js
│   │   ├── matches.html
│   │   └── matches.js
│   ├── collaboration/
│   │   ├── collaboration-models.html
│   │   └── collaboration-models.js
│   ├── pipeline/
│   │   ├── pipeline.html
│   │   └── pipeline.js
│   ├── profile/
│   │   ├── profile.html
│   │   └── profile.js
│   ├── onboarding/
│   │   ├── onboarding.html
│   │   └── onboarding.js
│   ├── notifications/
│   │   ├── notifications.html
│   │   └── notifications.js
│   ├── admin/
│   │   ├── admin-dashboard.html
│   │   ├── admin-dashboard.js
│   │   ├── admin-vetting.html
│   │   ├── admin-vetting.js
│   │   ├── admin-moderation.html
│   │   ├── admin-moderation.js
│   │   ├── admin-audit.html
│   │   ├── admin-audit.js
│   │   ├── admin-reports.html
│   │   └── admin-reports.js
│   └── public/
│       ├── home.html
│       ├── home.js
│       ├── discovery.html
│       ├── discovery.js
│       ├── wizard.html
│       ├── wizard.js
│       ├── knowledge.html
│       └── knowledge.js
└── services/                      # Service layer (already organized)
    └── ...
```

## Migration Steps

### 1. Extract HTML from Existing Files

For each feature, extract the relevant HTML sections from:
- `user-portal.html` → User features
- `admin-portal.html` → Admin features  
- `public-portal.html` → Public features
- `index.html` → Home page

### 2. Extract JavaScript Logic

For each feature, extract the relevant JavaScript from:
- `js/user-portal.js` → User feature logic
- `js/admin-portal.js` → Admin feature logic
- `js/public-portal.js` → Public feature logic
- `js/main.js` → Home page logic

### 3. Component Structure

Each feature component should follow this pattern:

```javascript
// features/[feature]/[component].js
(function() {
  'use strict';

  function init(params) {
    // Initialize component
    // params may contain route parameters
  }

  // Component-specific functions
  function loadData() { }
  function render() { }
  function handleEvents() { }

  // Export
  if (!window[featureName]) window[featureName] = {};
  window[featureName][componentName] = { init };
})();
```

### 4. HTML Structure

Each feature HTML should be self-contained:

```html
<!-- features/[feature]/[component].html -->
<div class="container" style="padding: 2rem 0;">
    <h1>Feature Title</h1>
    <div id="featureContent">
        <!-- Feature content -->
    </div>
</div>
```

## Features to Migrate

### Auth Features
- [x] Login (created)
- [ ] Signup
- [ ] Password Reset

### Dashboard
- [x] Dashboard (created)
- [ ] Admin Dashboard

### Projects
- [x] Projects List (created)
- [ ] Project Create
- [ ] Project View
- [ ] Project Edit

### Proposals
- [ ] Proposals List
- [ ] Proposal Create
- [ ] Proposal View

### Matching
- [ ] Opportunities
- [ ] Matches List

### Collaboration
- [ ] Collaboration Models
- [ ] Collaboration Opportunities
- [ ] Collaboration Applications

### Pipeline
- [ ] Pipeline View

### Profile
- [ ] Profile View
- [ ] Profile Edit

### Onboarding
- [ ] Onboarding Flow

### Notifications
- [ ] Notifications List

### Admin
- [ ] Admin Dashboard
- [ ] User Vetting
- [ ] Project Moderation
- [ ] Audit Trail
- [ ] Reports

### Public
- [x] Home (created)
- [ ] Discovery
- [ ] Wizard
- [ ] Knowledge Hub

## Router Configuration

Routes are defined in `js/router.js`. To add a new route:

```javascript
routes = {
  'route-name': {
    feature: 'feature-name',
    component: 'component-name',
    requiresAuth: true/false,
    requiresRole: 'role-name', // optional
    title: 'Page Title'
  }
};
```

## Benefits

1. **Modularity**: Each feature is self-contained
2. **Maintainability**: Easy to find and update feature code
3. **Scalability**: Easy to add new features
4. **Reusability**: Components can be reused
5. **Single Entry Point**: One index.html for the entire app
6. **Lazy Loading**: Features load only when needed

## Next Steps

1. Continue migrating remaining features
2. Update all internal links to use hash routes (#feature)
3. Test all routes and navigation
4. Update documentation


