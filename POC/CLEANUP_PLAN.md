# PMTwin Project Cleanup Plan

## Analysis Summary

After migrating to a feature-based directory structure, we have:
- ✅ **New Structure**: Feature directories with `index.html` files (e.g., `home/index.html`, `discovery/index.html`)
- ❌ **Obsolete Files**: Old root-level HTML files that duplicate the new structure
- ❌ **Obsolete Portals**: Old SPA-style portal files no longer used
- ❌ **Empty Directories**: Empty feature subdirectories in `data/`
- ❌ **Test Files**: Temporary test/debug files

## Cleanup Strategy

### 1. Archive Obsolete HTML Files
**Location**: `POC/archive/obsolete-html/`
**Files to Archive**:
- `home.html` → Now `home/index.html`
- `discovery.html` → Now `discovery/index.html`
- `wizard.html` → Now `wizard/index.html`
- `knowledge.html` → Now `knowledge/index.html`
- `login.html` → Now `login/index.html`
- `signup.html` → Now `signup/index.html`
- `dashboard.html` → Now `dashboard/index.html`
- `projects.html` → Now `projects/index.html`
- `create-project.html` → Now `create-project/index.html`
- `project.html` → Now `project/index.html`
- `opportunities.html` → Now `opportunities/index.html`
- `matches.html` → Now `matches/index.html`
- `proposals.html` → Now `proposals/index.html`
- `create-proposal.html` → Now `create-proposal/index.html`
- `pipeline.html` → Now `pipeline/index.html`
- `collaboration.html` → Now `collaboration/index.html`
- `profile.html` → Now `profile/index.html`
- `onboarding.html` → Now `onboarding/index.html`
- `notifications.html` → Now `notifications/index.html`
- `admin.html` → Now `admin/index.html`
- `admin-vetting.html` → Now `admin-vetting/index.html`
- `admin-moderation.html` → Now `admin-moderation/index.html`
- `admin-audit.html` → Now `admin-audit/index.html`
- `admin-reports.html` → Now `admin-reports/index.html`

### 2. Archive Obsolete Portal Files
**Location**: `POC/archive/obsolete-portals/`
**Files to Archive**:
- `admin-portal.html` - Old SPA-style admin portal
- `user-portal.html` - Old SPA-style user portal
- `public-portal.html` - Old SPA-style public portal
- `mobile-app.html` - Old mobile app portal

### 3. Archive Obsolete JavaScript Files
**Location**: `POC/archive/obsolete-js/`
**Files to Archive**:
- `js/admin-portal.js` - Supporting JS for old admin portal
- `js/user-portal.js` - Supporting JS for old user portal
- `js/public-portal.js` - Supporting JS for old public portal
- `js/mobile-app.js` - Supporting JS for old mobile app
- `js/collaboration-matching.js` - If replaced by feature-based structure
- `js/collaboration-models.js` - If replaced by feature-based structure
- `js/collaboration-model-definitions.js` - If replaced by feature-based structure

### 4. Archive Test/Debug Files
**Location**: `POC/archive/test-files/`
**Files to Archive**:
- `test-notifications.html` - Test file
- `fix-accounts.html` - Debug file
- `reorganize.ps1` - Migration script (no longer needed)

### 5. Clean Up Data Directory
**Action**: Remove empty feature subdirectories in `data/`
**Keep**:
- `data/adminData.json` - Active data file
- `data/dashboardData.json` - Active data file
- `data/modelsData.json` - Active data file
- `data/siteData.json` - Active data file
- `data/notification.json` - Active data file
- `data/demo-users.json` - Active data file
- `data/roles.json` - Active data file
- `data/user-roles.json` - Active data file
- `data/data-loader.js` - Active loader script
- `data/adminData.js` - Legacy (can archive if JSON is used)
- `data/dashboardData.js` - Legacy (can archive if JSON is used)
- `data/modelsData.js` - Legacy (can archive if JSON is used)
- `data/siteData.js` - Legacy (can archive if JSON is used)

**Remove**: Empty subdirectories (admin/, admin-audit/, etc.)

### 6. Consolidate Documentation
**Action**: Create a single `ARCHITECTURE.md` file consolidating:
- Current structure
- Migration history
- File organization
- Best practices

**Archive**:
- `migrate-to-directories.md` - Migration guide (completed)
- `FEATURE_MIGRATION_GUIDE.md` - Migration guide (completed)
- `README_REFACTORING.md` - Can be consolidated
- `REFACTORING_SUMMARY.md` - Can be consolidated

**Keep**:
- `API_MIGRATION_GUIDE.md` - Active guide
- `QUICK_START_API.md` - Active guide
- `SETUP.md` - Active guide
- `FUNCTION_MAP.md` - Active reference
- `FEATURE_COMPLETE_LIST.md` - Active reference

## Final Structure

```
POC/
├── index.html                    # Entry point (redirects to home/)
├── archive/                      # Archived obsolete files
│   ├── obsolete-html/           # Old root-level HTML files
│   ├── obsolete-portals/        # Old portal files
│   ├── obsolete-js/             # Old portal JS files
│   └── test-files/               # Test/debug files
├── home/                         # Feature directories
│   └── index.html
├── discovery/
│   └── index.html
├── ... (all other features)
├── css/
│   └── main.css
├── js/                           # Core JavaScript
│   ├── config.js
│   ├── data.js
│   ├── auth.js
│   ├── router.js
│   └── api/                      # API layer
├── features/                     # Feature components
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   └── ...
├── services/                     # Service layer
│   └── ...
├── data/                         # Data files (cleaned)
│   ├── *.json                    # Active JSON files
│   └── data-loader.js
└── docs/                         # Consolidated documentation
    ├── ARCHITECTURE.md
    ├── API_MIGRATION_GUIDE.md
    ├── QUICK_START_API.md
    └── SETUP.md
```

## Benefits

1. **Clean Structure**: Only active files in root
2. **Clear History**: Archived files preserved for reference
3. **Better Organization**: Feature-based structure is clear
4. **Easier Maintenance**: Less clutter, easier to navigate
5. **Documentation**: Consolidated docs in one place



