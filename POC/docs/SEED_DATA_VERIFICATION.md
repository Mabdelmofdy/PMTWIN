# Seed Data Verification Guide

## Overview

This guide explains how to verify that the "My Projects vs Matches" implementation is working correctly with the golden seed data.

## Test Accounts

The seed data includes the following test accounts:

1. **Beneficiary A** (`beneficiary@pmtwin.com` / `Beneficiary123`)
   - Role: `beneficiary`
   - Owns: MegaProject (NEOM Package), ServiceRequests (BIM, QA/QC)

2. **Beneficiary B** (`entity2@pmtwin.com` / `Entity123`)
   - Role: `project_lead` (beneficiary)
   - Owns: Standalone Project (Residential Tower)

3. **Vendor Alpha** (`vendor.alpha@pmtwin.com` / `Vendor123`)
   - Role: `vendor`
   - Skills: MegaProject Management, Civil Engineering, MEP Engineering
   - Has proposal to MegaProject (SHORTLISTED)

4. **Vendor Beta** (`vendor.beta@pmtwin.com` / `Vendor123`)
   - Role: `vendor`
   - Skills: High-Rise Construction, Residential Development
   - Has proposal to Standalone Project (UNDER_REVIEW)

5. **Service Provider (BIM)** (`bim@pmtwin.com` / `BIM123`)
   - Role: `skill_service_provider`
   - Skills: BIM Modeling, Clash Detection, IFC Coordination
   - Has proposal to ServiceRequest (AWARDED)

6. **Service Provider (QA)** (`qa@pmtwin.com` / `QA123`)
   - Role: `skill_service_provider`
   - Skills: Site Inspection, Quality Control, NCR Management
   - Has proposal to ServiceRequest (SUBMITTED)

7. **Consultant** (`consultant@pmtwin.com` / `Consultant123`)
   - Role: `consultant`
   - Skills: Project Management, Risk Management, Stakeholder Management
   - Has proposal to Advisory ServiceRequest (NEGOTIATION)

## Verification Steps

### 1. Verify "My Projects" Shows Only Owned Items

**Test as Beneficiary A:**
1. Login as `beneficiary@pmtwin.com`
2. Navigate to "My Projects"
3. Verify you see:
   - **Projects tab**: Empty (no standalone projects)
   - **Mega Projects tab**: 1 item (NEOM Package)
   - **Service Requests tab**: 2 items (BIM Coordination, QA/QC Site Inspections)
4. Verify you do NOT see:
   - Residential Tower (owned by Beneficiary B)
   - ServiceRequests owned by Vendor Alpha

**Test as Vendor Alpha:**
1. Login as `vendor.alpha@pmtwin.com`
2. Navigate to "My Projects"
3. Verify you see:
   - **Service Requests tab**: 1 item (Planning Support)
4. Verify you do NOT see:
   - Any projects or mega-projects (vendors don't create these in seed data)

### 2. Verify "Matches" Shows Only Other Companies' Items

**Test as Vendor Alpha:**
1. Login as `vendor.alpha@pmtwin.com`
2. Navigate to "Matches"
3. Verify you see:
   - MegaProject (NEOM Package) - owned by Beneficiary A
   - Standalone Project (Residential Tower) - owned by Beneficiary B
   - Match scores displayed (based on skills overlap)
4. Verify you do NOT see:
   - Your own ServiceRequest (Planning Support)

**Test as Service Provider (BIM):**
1. Login as `bim@pmtwin.com`
2. Navigate to "Matches"
3. Verify you see:
   - ServiceRequests owned by others (QA/QC, Planning Support, Advisory)
   - Match scores based on skills
4. Verify you do NOT see:
   - Your own ServiceRequest (if any)
   - Projects or MegaProjects (Service Providers can't bid on these)

**Test as Consultant:**
1. Login as `consultant@pmtwin.com`
2. Navigate to "Matches"
3. Verify you see:
   - Advisory ServiceRequest (Project Management Advisory)
4. Verify you do NOT see:
   - Regular ServiceRequests (requestType !== ADVISORY)
   - Projects or MegaProjects

### 3. Verify Role-Based Proposal Constraints

**Test as Service Provider:**
1. Login as `bim@pmtwin.com`
2. Try to create a proposal for a Project/MegaProject
3. Verify: Error message "Service Providers can only submit proposals to Service Requests"

**Test as Vendor:**
1. Login as `vendor.alpha@pmtwin.com`
2. Try to create a proposal for a ServiceRequest
3. Verify: Error message "Vendors can only submit proposals to Projects or Mega-Projects"

**Test as Consultant:**
1. Login as `consultant@pmtwin.com`
2. Try to create a proposal for a regular ServiceRequest (not ADVISORY)
3. Verify: Error message "Consultants can only submit proposals to Advisory requests"

### 4. Verify Proposals Page

**Test as Beneficiary A:**
1. Login as `beneficiary@pmtwin.com`
2. Navigate to "Proposals"
3. Verify "Incoming" tab shows:
   - Proposal from Vendor Alpha (MegaProject) - SHORTLISTED
   - Proposal from Service Provider BIM (ServiceRequest) - AWARDED
   - Proposal from Service Provider QA (ServiceRequest) - SUBMITTED
   - Proposal from Consultant (Advisory) - NEGOTIATION
4. Verify you can:
   - Shortlist proposals
   - Move to Negotiation
   - Award proposals (creates Contract + Engagement)
   - Reject proposals

**Test as Vendor Alpha:**
1. Login as `vendor.alpha@pmtwin.com`
2. Navigate to "Proposals"
3. Verify "My Submitted" tab shows:
   - Proposal to MegaProject - SHORTLISTED
4. Verify you can:
   - View proposal details
   - Withdraw proposal (if status allows)

### 5. Verify Pipeline Shows Correct Stages Per Role

**Test as Vendor:**
1. Login as `vendor.alpha@pmtwin.com`
2. Navigate to "Pipeline"
3. Verify columns:
   - Matched
   - Draft
   - Submitted
   - Under Review
   - Shortlisted (should have 1 proposal)
   - Negotiation
   - Awarded
   - Contract Signed
   - Engagement Active
   - Completed

**Test as Service Provider:**
1. Login as `bim@pmtwin.com`
2. Navigate to "Pipeline"
3. Verify columns:
   - Matched SR
   - Draft Offer
   - Submitted
   - Approved (should have 1 proposal - AWARDED)
   - Contract Signed
   - Engagement Active
   - Delivered

**Test as Beneficiary:**
1. Login as `beneficiary@pmtwin.com`
2. Navigate to "Pipeline"
3. Verify columns:
   - Incoming (should have proposals)
   - Under Review
   - Shortlist (should have 1 proposal)
   - Negotiation (should have 1 proposal)
   - Award
   - Contracts Active
   - Engagements Active
   - Completed

### 6. Verify Awarding Proposal Creates Contract + Engagement

**Test as Beneficiary A:**
1. Login as `beneficiary@pmtwin.com`
2. Navigate to "Proposals" → "Incoming"
3. Find a SHORTLISTED or NEGOTIATION proposal
4. Click "Award"
5. Verify:
   - Proposal status changes to AWARDED
   - Contract is created (check Contracts page)
   - Engagement is created (check Engagements page)
   - Engagement has `contractId` pointing to the contract
   - Contract status is DRAFT or SENT
   - Engagement status is PLANNED

### 7. Verify Validation Rules

Run the validation script:
1. Open browser console
2. Run: `WorkflowValidator.validate()`
3. Verify:
   - No errors about `bidderCompanyId === ownerCompanyId`
   - No errors about service providers bidding on projects
   - No errors about sub-contractors with direct beneficiary contracts
   - All engagements have valid contracts
   - All awarded proposals have contracts

## Expected Seed Data Summary

- **Projects**: 2 (1 MegaProject, 1 Standalone)
- **ServiceRequests**: 4 (3 NORMAL, 1 ADVISORY)
- **Proposals**: 5+
  - Vendor → MegaProject (SHORTLISTED)
  - Vendor → Project (UNDER_REVIEW)
  - Service Provider → ServiceRequest (AWARDED)
  - Service Provider → ServiceRequest (SUBMITTED)
  - Consultant → Advisory ServiceRequest (NEGOTIATION)
- **Contracts**: Created when proposals are awarded
- **Engagements**: Created with contracts

## Troubleshooting

If "My Projects" shows items from other companies:
- Check that `ownerCompanyId` is set correctly
- Run migration: `migrateCreatorIdToOwnerCompanyId()` in console

If "Matches" shows owned items:
- Check that matching service filters by `ownerCompanyId !== currentCompanyId`
- Verify user role is correct

If proposals don't show correct status:
- Check that proposal migration ran: `migrateProposalsToNewModel()`
- Verify status enum values match new model

If pipeline columns are wrong:
- Check user role
- Verify pipeline component detects role correctly
