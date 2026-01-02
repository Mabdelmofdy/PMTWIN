# PMTwin Architecture Documentation

## Project Structure

PMTwin uses a **feature-based, multi-page architecture** where each feature has its own directory containing an `index.html` file.

### Directory Structure

```
POC/
├── index.html                    # Entry point (redirects to home/)
│
├── [feature]/                    # Feature directories (24 total)
│   └── index.html                # Feature page
│
├── css/
│   └── main.css                  # Centralized stylesheet
│
├── js/                           # Core JavaScript
│   ├── config.js                 # Configuration
│   ├── data.js                   # Data layer (localStorage)
│   ├── auth.js                   # Authentication
│   ├── router.js                 # Router (backward compatibility)
│   ├── auth-check.js             # Auth utilities
│   ├── demo-credentials.js       # Demo accounts
│   └── api/                      # API layer
│       ├── api-client.js         # HTTP client
│       └── api-service.js        # API services
│
├── features/                     # Feature components
│   ├── auth/                     # Authentication components
│   ├── dashboard/               # Dashboard components
│   ├── projects/                # Project management
│   ├── proposals/               # Proposal management
│   ├── matching/                # Matching engine
│   ├── collaboration/           # Collaboration models
│   ├── pipeline/               # Service pipeline
│   ├── profile/                # User profile
│   ├── onboarding/            # Onboarding flow
│   ├── notifications/          # Notifications
│   ├── admin/                  # Admin features
│   └── public/                 # Public features
│
├── services/                    # Service layer
│   ├── auth/
│   ├── projects/
│   ├── proposals/
│   ├── matching/
│   ├── notifications/
│   ├── admin/
│   ├── dashboard/
│   ├── collaboration/
│   ├── onboarding/
│   ├── rbac/
│   └── services-loader.js      # Service loader
│
├── data/                        # Data files
│   ├── *.json                   # JSON data files
│   └── data-loader.js          # Data loader
│
└── archive/                     # Archived obsolete files
    ├── obsolete-html/          # Old HTML files
    ├── obsolete-portals/       # Old portal files
    ├── obsolete-js/            # Old JS files
    └── test-files/             # Test/debug files
```

## Feature Directories

### Public Features
- `home/` - Landing page
- `discovery/` - Project discovery
- `wizard/` - PMTwin wizard
- `knowledge/` - Knowledge hub
- `login/` - Login page
- `signup/` - Signup page

### User Features
- `dashboard/` - User dashboard
- `projects/` - Projects list
- `create-project/` - Create project
- `project/` - Project details
- `opportunities/` - Opportunities
- `matches/` - Matches
- `proposals/` - Proposals list
- `create-proposal/` - Create proposal
- `pipeline/` - Service pipeline
- `collaboration/` - Collaboration models
- `profile/` - User profile
- `onboarding/` - Onboarding flow
- `notifications/` - Notifications

### Admin Features
- `admin/` - Admin dashboard
- `admin-vetting/` - User vetting
- `admin-moderation/` - Project moderation
- `admin-audit/` - Audit trail
- `admin-reports/` - Reports

## Architecture Principles

### 1. Feature-Based Organization
Each feature is self-contained in its own directory with:
- `index.html` - Feature page
- Component code in `features/[feature-name]/`
- Service code in `services/[feature-name]/`

### 2. Multi-Page Application (MPA)
- Each route is a separate HTML file
- Clean URLs: `/discovery/`, `/dashboard/`, etc.
- No hash-based routing (backward compatibility only)

### 3. Separation of Concerns
- **Presentation**: HTML in feature directories
- **Components**: JavaScript in `features/`
- **Business Logic**: Services in `services/`
- **Data**: JSON files in `data/`
- **Core**: Shared utilities in `js/`

### 4. API Layer
- Abstracted API client in `js/api/`
- Can switch between localStorage (mock) and real API
- Configuration in `js/config.js`

### 5. Progressive Enhancement
- Works without JavaScript (basic functionality)
- Enhanced with JavaScript (full functionality)
- Graceful degradation

## Data Flow

```
User Action
    ↓
Component (features/)
    ↓
Service (services/)
    ↓
API Service (js/api/)
    ↓
Data Layer (js/data.js) or Real API
    ↓
localStorage or Backend
```

## Navigation

### URL Structure
- Public: `/home/`, `/discovery/`, `/wizard/`, etc.
- User: `/dashboard/`, `/projects/`, `/proposals/`, etc.
- Admin: `/admin/`, `/admin-vetting/`, etc.

### Navigation Links
All navigation uses relative paths:
- Same level: `../feature-name/`
- From root: `/feature-name/`

## Authentication & Authorization

### Auth Check
- `js/auth-check.js` - Shared auth utilities
- Checks authentication status
- Validates user roles
- Redirects if unauthorized

### RBAC
- Role-Based Access Control in `services/rbac/`
- Defines permissions per role
- Controls portal access

## Migration History

### Phase 1: Initial Structure
- Single-page portals (admin-portal.html, user-portal.html)
- Hash-based routing
- All features in one file

### Phase 2: Feature Extraction
- Extracted features to `features/` directory
- Created service layer in `services/`
- Separated data to JSON files

### Phase 3: Multi-Page Migration
- Created feature directories with `index.html`
- Migrated from hash routing to direct file access
- Updated all navigation links

### Phase 4: Cleanup
- Archived obsolete files
- Removed empty directories
- Consolidated documentation

## Best Practices

### Adding New Features
1. Create feature directory: `POC/new-feature/`
2. Create `index.html` in feature directory
3. Add component in `features/new-feature/`
4. Add service in `services/new-feature/`
5. Update navigation links
6. Update router.js for backward compatibility

### File Naming
- Feature directories: lowercase, hyphenated (`create-project/`)
- Component files: lowercase, hyphenated (`project-create.js`)
- Service files: lowercase, hyphenated (`project-service.js`)

### Path References
- CSS: `../css/main.css`
- JS: `../js/...`
- Features: `../features/...`
- Services: `../services/...`
- Data: `../data/...`

## Configuration

### API Configuration
Edit `js/config.js`:
```javascript
const CONFIG = {
  api: {
    baseUrl: 'http://localhost:8080/api',
    mock: true  // Set to false for real API
  }
};
```

### Demo Accounts
Defined in `js/demo-credentials.js`:
- Admin: `admin@pmtwin.com` / `Admin123`
- Individual: `individual@pmtwin.com` / `User123`
- Entity: `entity@pmtwin.com` / `Entity123`

## Development Workflow

1. **Local Development**: Open `index.html` directly or use local server
2. **Testing**: Use demo accounts for testing
3. **Data**: Edit JSON files in `data/` for sample data
4. **Components**: Edit files in `features/`
5. **Services**: Edit files in `services/`

## Future Enhancements

1. **Backend Integration**: Switch `CONFIG.api.mock` to `false`
2. **Build Process**: Add bundling/minification
3. **Testing**: Add unit tests
4. **Documentation**: Expand API documentation
5. **Performance**: Add lazy loading for features


