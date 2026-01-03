# Service Index Test Data Documentation

## Overview

Test data is automatically loaded for the new service index models (ServiceProviders, Beneficiaries, ServiceEvaluations) when the application initializes.

## Test Data Created

### Service Providers
- **Legal & Logistics Services** (Company)
  - Type: Company
  - Categories: Legal, Logistics
  - Location: Riyadh
  - Skills: Contract Review, Legal Consultation, Supply Chain Management, Procurement

- **Ahmed Al-Saud** (Individual Consultant)
  - Type: Consultant
  - Categories: Engineering, Design
  - Location: Riyadh
  - Skills: Project Management, Civil Engineering, Construction Planning, Quality Control

- **Sarah Al-Mansouri** (Individual)
  - Type: Individual
  - Categories: Consulting, Project Management
  - Location: Jeddah
  - Skills: Project Planning, Risk Management, Stakeholder Management, Agile Methodology

### Beneficiaries
- Created from existing project leads/entities
- Linked to their projects
- Includes required services, skills, and budget ranges

### Service Evaluations
- Sample evaluation with 4.5 rating
- Includes performance metrics (on-time delivery, quality, communication, value)
- Linked to service offerings and beneficiaries

## Button Functionality

All buttons in service pages follow the same pattern as project pages:

### My Services Page (`my-services/index.html`)

**Buttons:**
- `+ Create New Service Offering` → `myServicesComponent.showCreateForm()`
- `Edit` → `myServicesComponent.editOffering(offeringId)`
- `Publish` → `myServicesComponent.publishOffering(offeringId)`
- `Pause` → `myServicesComponent.toggleStatus(offeringId, 'Paused')`
- `Activate` → `myServicesComponent.toggleStatus(offeringId, 'Active')`
- `Archive` → `myServicesComponent.toggleStatus(offeringId, 'Archived')`
- `Unarchive` → `myServicesComponent.toggleStatus(offeringId, 'Draft')`
- `Delete` → `myServicesComponent.deleteOffering(offeringId)`
- `Clear Filters` → `myServicesComponent.clearFilters()`

### Services Marketplace Page (`services-marketplace/index.html`)

**Buttons:**
- `Apply Filters` → Form submit → `marketplaceComponent.applyFilters(event)`
- `Clear` → `marketplaceComponent.clearFilters()`
- `View Details` → `marketplaceComponent.viewOffering(offeringId)`
- `Invite` → `marketplaceComponent.inviteToProposal(offeringId)`

## Testing

To test the buttons:

1. **Navigate to My Services page**
   - Click "My Services" in sidebar
   - Verify all buttons are visible and functional
   - Test Create, Edit, Publish, Pause, Archive, Delete buttons

2. **Navigate to Services Marketplace page**
   - Click "Service Marketplace" in sidebar
   - Verify filter buttons work
   - Test View Details and Invite buttons

3. **Verify Test Data**
   - Open browser console
   - Run: `PMTwinData.ServiceProviders.getAll()` - Should show test providers
   - Run: `PMTwinData.Beneficiaries.getAll()` - Should show test beneficiaries
   - Run: `PMTwinData.ServiceEvaluations.getAll()` - Should show test evaluations

## Manual Test Data Loading

To manually reload test data:

```javascript
PMTwinData.loadServiceIndexTestData();
```

This will create test data if it doesn't already exist.

## Button Pattern Consistency

All buttons follow the project page pattern:
- Use `onclick` handlers with component references
- Format: `onclick="componentName.methodName('param')"`
- Components exported globally: `window.componentName`
- Consistent button styling: `btn btn-primary`, `btn btn-success`, etc.

