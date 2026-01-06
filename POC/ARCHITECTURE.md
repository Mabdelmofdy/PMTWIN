# PMTwin POC Architecture

## Directory Structure

This POC has been reorganized into a professional project structure that serves as a guide for development teams.

```
POC/
├── src/                          # Source code
│   ├── business-logic/          # Domain logic, models, validators, business rules
│   │   ├── models/              # Data models and definitions
│   │   ├── validators/          # Validation logic
│   │   └── rules/               # Business rules and algorithms
│   ├── components/              # Reusable UI components (JS)
│   │   ├── cards/              # Card components
│   │   ├── filters/            # Filter components
│   │   └── layout/             # Layout components
│   ├── services/                # API services
│   │   ├── admin/              # Admin services
│   │   ├── auth/               # Authentication services
│   │   ├── collaboration/      # Collaboration services
│   │   └── ...                 # Other feature services
│   ├── utils/                   # Helpers and utilities
│   │   ├── formatters.js      # Date, currency formatting
│   │   ├── validators.js      # Input validation
│   │   ├── storage.js         # localStorage helpers
│   │   ├── dom-helpers.js     # DOM manipulation
│   │   └── error-handler.js   # Error handling
│   ├── config/                  # Configuration files
│   │   └── config.js           # Main configuration
│   └── core/                    # Core application logic
│       ├── api/                # API client and service
│       ├── auth/               # Authentication core
│       ├── data/               # Data management layer
│       ├── router/             # Routing logic
│       ├── layout/             # Layout and navigation
│       ├── renderer/            # UI rendering
│       ├── matching/           # Matching algorithms
│       ├── onboarding/         # Onboarding flow
│       └── init/               # Application initialization
├── pages/                       # All HTML pages organized by feature
│   ├── admin/                  # Admin pages
│   ├── auth/                   # Authentication pages
│   ├── collaboration/          # Collaboration pages
│   ├── dashboard/              # Dashboard
│   └── ...                     # Other feature pages
├── features/                    # Feature-specific JS (page controllers)
│   ├── admin/                  # Admin feature controllers
│   ├── auth/                   # Auth feature controllers
│   └── ...                     # Other feature controllers
├── data/                        # Static data files (JSON, JS)
├── assets/                      # Static assets
│   └── css/                    # Stylesheets
├── templates/                   # HTML templates
├── docs/                        # Documentation
├── scripts/                     # Build/deployment scripts
└── archive/                     # Archived/obsolete files
```

## Key Principles

### Separation of Concerns

1. **Business Logic** (`src/business-logic/`)
   - Domain models and definitions
   - Business rules and validation
   - Matching algorithms

2. **Components** (`src/components/`)
   - Reusable UI components
   - Self-contained, reusable across pages

3. **Services** (`src/services/`)
   - API interaction layer
   - Feature-specific service logic
   - Data transformation

4. **Utilities** (`src/utils/`)
   - Pure utility functions
   - No business logic
   - Reusable across the application

5. **Core** (`src/core/`)
   - Application foundation
   - Critical system components
   - Shared infrastructure

### File Organization

- **Pages** (`pages/`): All HTML files organized by feature/domain
- **Features** (`features/`): Page-specific JavaScript controllers
- **Data** (`data/`): Static data files (JSON, configuration data)
- **Assets** (`assets/`): Static assets (CSS, images, etc.)

## Path References

### From Pages to Source Files

Pages are located in `pages/` subdirectories. To reference source files:

- **Depth 1** (e.g., `pages/home/index.html`): Use `../../src/...`
- **Depth 2** (e.g., `pages/auth/login/index.html`): Use `../../../src/...`
- **Depth 3** (e.g., `pages/admin/users-management/index.html`): Use `../../../../src/...`

### Example Paths

From `pages/home/index.html`:
```html
<script src="../../src/config/config.js"></script>
<script src="../../src/core/data/data.js"></script>
<link rel="stylesheet" href="../../assets/css/main.css">
```

From `pages/auth/login/index.html`:
```html
<script src="../../../src/config/config.js"></script>
<script src="../../../src/core/auth/auth.js"></script>
<link rel="stylesheet" href="../../../assets/css/main.css">
```

## Loading Order

When loading scripts in HTML files, follow this order:

1. **Utils** (formatters, validators, etc.)
2. **Config** (configuration)
3. **API Layer** (api-client, api-service)
4. **Core Data** (data.js)
5. **Core Auth** (auth.js, auth-check.js, user-manager.js)
6. **Services** (services-loader.js)
7. **Data Loader** (data-loader.js)
8. **Layout** (layout.js, navigation.js)
9. **Renderer** (renderer.js)
10. **App Init** (app-init.js)
11. **Feature Controllers** (feature-specific JS)

## Development Guidelines

### Adding New Features

1. **HTML Page**: Add to `pages/{feature}/`
2. **Feature Controller**: Add to `features/{feature}/`
3. **Service**: Add to `src/services/{feature}/`
4. **Business Logic**: Add to `src/business-logic/` if needed
5. **Components**: Add to `src/components/` if reusable

### Adding New Utilities

1. Create file in `src/utils/`
2. Export functions via `window.{UtilityName}`
3. Load before core scripts in HTML files

### Adding New Components

1. Create file in `src/components/` (or subdirectory)
2. Make it self-contained and reusable
3. Export via `window.{ComponentName}` if needed

## Migration Notes

This structure was migrated from a flat directory structure. Key changes:

- All JavaScript moved from `js/` to `src/` with logical organization
- All HTML pages moved from root to `pages/` organized by feature
- CSS moved from `css/` to `assets/css/`
- Services moved from `services/` to `src/services/`
- Utilities extracted and organized in `src/utils/`

## Maintenance

- Keep the structure consistent
- Update path references when moving files
- Use the `scripts/update-html-paths.js` script to update HTML file paths if needed
- Document new patterns and conventions

