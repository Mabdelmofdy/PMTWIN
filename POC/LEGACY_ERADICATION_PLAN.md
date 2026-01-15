# Legacy Eradication Plan

## STEP 0: Legacy Artifacts Audit

### A) Legacy Model Names/Fields Found:
- `Projects` model (113 references)
- `ServiceRequests` model (87 references)
- `ServiceOffers` model (48 references)
- `projectType` field (154 references)
- `requestType` / `offerType` fields
- Legacy status enums

### B) Legacy Storage Keys Found:
- `pmtwin_projects` (STORAGE_KEYS.PROJECTS)
- `pmtwin_service_requests` (STORAGE_KEYS.SERVICE_REQUESTS)
- `pmtwin_service_offers` (STORAGE_KEYS.SERVICE_OFFERS)

### C) Legacy Routes/Paths Found:
- `/pages/projects/*` routes
- `create-project` route
- `project-view` route
- Legacy project pages

### D) Legacy Seed/Demo Injection Points:
- `createGoldenProjects()` in golden-seed-data.js
- `loadSampleProjects()` in data.js
- `createGoldenServiceRequests()` in golden-seed-data.js
- `createGoldenServiceOffers()` in golden-seed-data.js

### E) Legacy UI Bindings Found:
- `project.type`, `project.projectType`
- `requestType`, `offerType`
- Old status enums
- Legacy filters and cards

## STEP 1: What Will Be Removed:
1. **Storage Keys**: `pmtwin_projects`, `pmtwin_service_requests`, `pmtwin_service_offers`
2. **Models**: `Projects`, `ServiceRequests`, `ServiceOffers` CRUD objects
3. **Routes**: Legacy project routes (redirected to opportunities)
4. **Seed Functions**: All legacy seed generators
5. **UI Components**: Legacy project/service request/offer pages

## STEP 2: What Will Be Replaced With:
1. **Storage**: Unified `pmtwin_opportunities` (via COLLABORATION_OPPORTUNITIES key)
2. **Model**: `Opportunities` model only
3. **Routes**: All redirect to opportunities pages
4. **Seed**: Single `createGoldenOpportunities()` function
5. **UI**: Opportunities list/create/view components

## Implementation Steps:
1. Create unified storage adapter
2. Migrate all data references
3. Update seed data
4. Redirect legacy routes
5. Update UI bindings
6. Remove legacy code
