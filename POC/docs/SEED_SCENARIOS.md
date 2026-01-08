# Golden Seed Data Scenarios

## Overview

This document describes the comprehensive "golden" seed dataset that demonstrates the complete PMTwin contract-driven workflow. The dataset covers all roles, contract types, and workflow paths to make the system visually and logically clear.

## Dataset Summary

The golden seed dataset includes:

- **10 Users** across all required roles
- **2 Projects** (1 MegaProject with 2 SubProjects, 1 standalone Project)
- **3 Service Requests** with matching Service Offers
- **7 Contracts** covering all contract types
- **6 Engagements** for active work execution
- **20+ Milestones/Deliverables** tracking progress

## User Accounts

### Beneficiaries (2)

1. **NEOM Development Authority**
   - Email: `beneficiary@pmtwin.com`
   - Password: `Beneficiary123`
   - Role: `beneficiary`
   - Creates MegaProject "NEOM Package"

2. **Saudi Real Estate Company**
   - Email: `entity2@pmtwin.com`
   - Password: `Entity123`
   - Role: `project_lead`
   - Creates standalone Project "Residential Tower"

### Vendors (2)

1. **Alpha Construction Group**
   - Email: `vendor.alpha@pmtwin.com`
   - Password: `Vendor123`
   - Role: `vendor`
   - Executes MegaProject contract, manages sub-contractors

2. **Beta Infrastructure Ltd**
   - Email: `vendor.beta@pmtwin.com`
   - Password: `Vendor123`
   - Role: `vendor`
   - Executes standalone Project contract

### Service Providers (3)

1. **BIM Solutions Co**
   - Email: `bim@pmtwin.com`
   - Password: `Service123`
   - Role: `skill_service_provider`
   - Provides BIM coordination services

2. **Quality Assurance Services**
   - Email: `qa@pmtwin.com`
   - Password: `Service123`
   - Role: `skill_service_provider`
   - Provides QA/QC inspection services

3. **Project Planning Experts**
   - Email: `scheduler@pmtwin.com`
   - Password: `Service123`
   - Role: `skill_service_provider`
   - Provides project planning and scheduling

### Consultant (1)

1. **Green Building Consultants**
   - Email: `consultant@pmtwin.com`
   - Password: `Consultant123`
   - Role: `consultant`
   - Provides sustainability advisory services

### Sub-Contractors (2)

1. **MEP Specialists LLC**
   - Email: `mep.sub@pmtwin.com`
   - Password: `SubContractor123`
   - Role: `sub_contractor`
   - Works under Vendor Alpha for MEP works

2. **Steel Fabrication Co**
   - Email: `steel.sub@pmtwin.com`
   - Password: `SubContractor123`
   - Role: `sub_contractor`
   - Works under Vendor Alpha for steel fabrication

## Project Scenarios

### Scenario 1: MegaProject - NEOM Package

**Project**: "Mega Project - NEOM Package"
- **Type**: MegaProject
- **Creator**: NEOM Development Authority
- **Location**: NEOM, Tabuk Province
- **Budget**: 450M - 550M SAR
- **Duration**: 36 months

**SubProjects**:
1. **Civil Works** (SubProject A)
   - Foundation, earthworks, structures
   - Budget: 250M - 300M SAR
   - Duration: 24 months

2. **MEP Works** (SubProject B)
   - Mechanical, electrical, plumbing systems
   - Budget: 200M - 250M SAR
   - Duration: 18 months

**Contracts**:
- **MEGA_PROJECT_CONTRACT**: Beneficiary A ↔ Vendor Alpha (500M SAR)
- **SERVICE_CONTRACT 1**: BIM Services for Civil Works (200K SAR)
- **SERVICE_CONTRACT 2**: QA/QC Services for MEP Works (100K SAR)
- **ADVISORY_CONTRACT**: Sustainability Advisory (300K SAR)
- **SUB_CONTRACT 1**: Vendor Alpha ↔ MEP SubContractor (50M SAR)
- **SUB_CONTRACT 2**: Vendor Alpha ↔ Steel SubContractor (30M SAR)

**Engagements**:
- Vendor Alpha executing the mega-project
- BIM Provider working on Civil Works
- QA Provider working on MEP Works (planned)
- Consultant providing advisory services
- MEP SubContractor working under Vendor Alpha (planned)
- Steel SubContractor working under Vendor Alpha

### Scenario 2: Standalone Project - Residential Tower

**Project**: "Residential Tower - King Fahd District"
- **Type**: Single Project
- **Creator**: Saudi Real Estate Company
- **Location**: Riyadh, King Fahd District
- **Budget**: 140M - 160M SAR
- **Duration**: 30 months

**Contracts**:
- **PROJECT_CONTRACT**: Beneficiary B ↔ Vendor Beta (150M SAR)

## Service Request Scenarios

### SR1: BIM Coordination
- **Requester**: NEOM Development Authority
- **Provider**: BIM Solutions Co
- **Scope**: Civil Works SubProject
- **Status**: Approved → Contract Signed
- **Budget**: 150K - 250K SAR

### SR2: QA/QC Site Inspections
- **Requester**: NEOM Development Authority
- **Provider**: Quality Assurance Services
- **Scope**: MEP Works SubProject
- **Status**: Approved → Contract Signed
- **Budget**: 80K - 120K SAR

### SR3: Planning Support
- **Requester**: Vendor Alpha
- **Provider**: Project Planning Experts
- **Scope**: MegaProject
- **Status**: Approved → Contract Signed
- **Budget**: 100K - 150K SAR

## Navigation Guide

### To View MegaProject Scenario:

1. **Login as Beneficiary** (`beneficiary@pmtwin.com`)
2. Navigate to **Projects** → View "Mega Project - NEOM Package"
3. View **Contracts** tab to see all contract types
4. View **Engagements** tab to see active work
5. View **SubProjects** to see Civil Works and MEP Works

### To View Service Provider Workflow:

1. **Login as BIM Provider** (`bim@pmtwin.com`)
2. Navigate to **Service Engagements** → View active BIM engagement
3. View **Milestones** to see deliverables (Clash Report, IFC Model, etc.)
4. Navigate to **Service Requests** to see available opportunities

### To View Vendor-SubContractor Relationship:

1. **Login as Vendor Alpha** (`vendor.alpha@pmtwin.com`)
2. Navigate to **Contracts** → View SubContracts
3. See MEP and Steel SubContracts with parent contract reference
4. View **Engagements** to see sub-contractor work

### To View SubContractor Perspective:

1. **Login as MEP SubContractor** (`mep.sub@pmtwin.com`)
2. Navigate to **Contracts** → View SubContract
3. Note: SubContractor can only see contracts with Vendors (not Beneficiaries)
4. View **Engagements** to see assigned work

### To View Admin Dashboard:

1. **Login as Admin** (`admin@pmtwin.com`)
2. Navigate to **Admin Dashboard**
3. View **Analytics** to see all contracts, engagements, projects
4. View **Users Management** to see all roles
5. View **Contracts** to see all contract types grouped

## Data Relationships

### Contract Hierarchy

```
MegaProject (NEOM Package)
├── MEGA_PROJECT_CONTRACT (Beneficiary A ↔ Vendor Alpha)
│   ├── SUB_CONTRACT 1 (Vendor Alpha ↔ MEP SubContractor)
│   └── SUB_CONTRACT 2 (Vendor Alpha ↔ Steel SubContractor)
├── SERVICE_CONTRACT 1 (Beneficiary A ↔ BIM Provider)
└── ADVISORY_CONTRACT (Beneficiary A ↔ Consultant)
```

### Engagement Assignments

- **Mega Engagement**: Assigned to MegaProject (covers all SubProjects)
- **BIM Engagement**: Assigned to Civil Works SubProject
- **QA Engagement**: Assigned to MEP Works SubProject
- **Advisory Engagement**: Assigned to MegaProject
- **SubContract Engagements**: Assigned to respective SubProjects

## Validation

### Running Validation

**Browser Console**:
```javascript
// Load validation script first
// Then run:
PMTwinValidateSeedData.validate()
```

**Node.js**:
```bash
node scripts/validate-seed-data.js [path-to-data.json]
```

### Validation Checks

1. ✅ No sub-contractor contracted by beneficiary
2. ✅ Every engagement references a signed/active contract
3. ✅ MegaProject has >= 3 contract types (vendor + service + advisory)
4. ✅ All roles exist and are referenced in workflow
5. ✅ SubContracts have valid parentContractId
6. ✅ ServiceProviders have no project bidding records
7. ✅ All contracts have proper buyerParty/providerParty types
8. ✅ SubContracts have Vendor as buyer and SubContractor as provider

## Reset Instructions

### Clear and Reload Golden Data

**Browser Console**:
```javascript
// Clear all data
localStorage.clear();

// Reload page to trigger golden seed data creation
location.reload();
```

**Or use force reload**:
```javascript
// Force reload golden seed data
if (typeof GoldenSeedData !== 'undefined') {
  GoldenSeedData.load(true); // forceReload = true
}
```

### Verify Data Loaded

```javascript
// Check users
console.log('Users:', PMTwinData.Users.getAll().length);

// Check contracts
console.log('Contracts:', PMTwinData.Contracts.getAll().length);

// Check engagements
console.log('Engagements:', PMTwinData.Engagements.getAll().length);

// Check projects
console.log('Projects:', PMTwinData.Projects.getAll().length);
```

## Key Constraints Demonstrated

1. **SubContractor Isolation**: SubContractors can only contract with Vendors, never directly with Beneficiaries
2. **Service Provider Isolation**: Service Providers cannot bid on Projects/MegaProjects; only via ServiceRequests
3. **Contract Requirement**: All engagements require a signed contract
4. **Multi-Contract Support**: MegaProjects support multiple parallel contracts across provider types
5. **Parent Contract Validation**: SubContracts must have valid parent Vendor contracts

## Troubleshooting

### Data Not Loading

1. Check browser console for errors
2. Verify `golden-seed-data.js` is loaded before `data.js`
3. Check that `PMTwinData` is available
4. Try clearing localStorage and reloading

### Missing Entities

1. Run validation script to identify missing entities
2. Check that all users were created successfully
3. Verify project creation completed
4. Check contract creation logs

### Validation Failures

1. Review validation error messages
2. Check contract relationships
3. Verify engagement-contract links
4. Ensure all required roles exist

## Additional Resources

- See `SEED_DATA_DIAGRAM.md` for visual workflow diagrams
- See `CONTRACT_DRIVEN_WORKFLOW.md` for workflow documentation
- See validation scripts in `src/utils/validate-seed-data.js` and `scripts/validate-seed-data.js`

