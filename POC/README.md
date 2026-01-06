# PMTwin - Construction Collaboration Platform

## Quick Start

1. **Open the application**: Open `index.html` in your browser or use a local server:
   ```bash
   python -m http.server 8000
   # Visit http://localhost:8000
   ```

2. **Login with demo accounts**:
   - **Admin**: `admin@pmtwin.com` / `Admin123`
   - **Entity**: `entity@pmtwin.com` / `Entity123` (Creates and requests projects/megaprojects)
   - **Vendor**: `vendor@pmtwin.com` / `Vendor123` (Provides full projects/subprojects, manages sub_contractors)
   - **Sub_Contractor**: `subcontractor@pmtwin.com` / `SubContractor123` (Works under vendors for minor scope)

## Project Structure

This POC has been reorganized into a professional project structure. See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed documentation.

```
POC/
├── src/                    # Source code
│   ├── business-logic/    # Domain logic, models, validators
│   ├── components/         # Reusable UI components
│   ├── services/           # API services
│   ├── utils/             # Helpers and utilities
│   ├── config/             # Configuration
│   └── core/               # Core application logic
├── pages/                  # All HTML pages organized by feature
├── features/               # Feature-specific JS (page controllers)
├── data/                   # Static data files (JSON)
├── assets/                 # Static assets (CSS, images)
├── templates/              # HTML templates
├── docs/                   # Documentation
├── scripts/                # Build/deployment scripts
└── archive/                # Archived obsolete files
```

## Features

### Public Features
- **Home** (`/home/`) - Landing page
- **Discovery** (`/discovery/`) - Browse projects
- **Wizard** (`/wizard/`) - Find collaboration model
- **Knowledge** (`/knowledge/`) - Knowledge hub
- **Login** (`/login/`) - User login
- **Signup** (`/signup/`) - User registration

### User Features
- **Dashboard** (`/dashboard/`) - User dashboard
- **Projects** (`/projects/`) - Manage projects
- **Opportunities** (`/opportunities/`) - View opportunities
- **Matches** (`/matches/`) - View matches
- **Proposals** (`/proposals/`) - Manage proposals
- **Pipeline** (`/pipeline/`) - Service pipeline
- **Profile** (`/profile/`) - User profile
- **Notifications** (`/notifications/`) - Notifications

### Admin Features
- **Admin Dashboard** (`/admin/`) - Admin overview
- **User Vetting** (`/admin-vetting/`) - Review users
- **Project Moderation** (`/admin-moderation/`) - Moderate projects
- **Audit Trail** (`/admin-audit/`) - View audit logs
- **Reports** (`/admin-reports/`) - Generate reports

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** - Complete architecture documentation
- **[API_MIGRATION_GUIDE.md](API_MIGRATION_GUIDE.md)** - API integration guide
- **[QUICK_START_API.md](QUICK_START_API.md)** - Quick API setup
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[FUNCTION_MAP.md](FUNCTION_MAP.md)** - Function reference
- **[FEATURE_COMPLETE_LIST.md](FEATURE_COMPLETE_LIST.md)** - Feature list

## Architecture

PMTwin uses a **feature-based, multi-page architecture**:
- Each feature has its own directory with `index.html`
- Clean URLs: `/discovery/`, `/dashboard/`, etc.
- Component-based JavaScript in `features/`
- Service layer in `services/`
- API abstraction layer for backend integration

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for complete details.

## Development

### Adding a New Feature

1. Create feature directory: `POC/new-feature/`
2. Create `index.html` in the directory
3. Add component in `features/new-feature/`
4. Add service in `services/new-feature/`
5. Update navigation links
6. Update `js/router.js` for backward compatibility

### Configuration

Edit `js/config.js` to configure API endpoints:
```javascript
const CONFIG = {
  api: {
    baseUrl: 'http://localhost:8080/api',
    mock: true  // Set to false for real API
  }
};
```

## Data

- **JSON Files**: Sample data in `data/*.json`
- **Data Loader**: `data/data-loader.js` loads all JSON files
- **Storage**: Uses localStorage for POC phase
- **API Ready**: Can switch to real API via configuration

## Cleanup Status

✅ **Completed Cleanup**:
- Archived 24 obsolete HTML files
- Archived 4 obsolete portal files
- Archived 4 obsolete portal JS files
- Archived 3 test/debug files
- Removed 24 empty data subdirectories
- Consolidated documentation

All obsolete files are preserved in `archive/` for reference.

## License

This is a proof-of-concept (POC) project.



