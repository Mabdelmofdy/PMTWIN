# Manual Test Checklist

## Overview
This checklist covers manual testing of the unified Opportunity + Payment workflow implementation.

## Prerequisites
1. Clear browser localStorage
2. Load seed data: `SeedNewOpportunityWorkflow()`
3. Test with users from all 8 roles

---

## 1. Opportunity Creation Wizard

### Test: Step Order Verification
- [ ] **Step 0**: Intent selection (REQUEST_SERVICE | OFFER_SERVICE | BOTH)
- [ ] **Step 1**: Model selection (Collaboration Model)
- [ ] **Step 2**: Details (Basic Information + Location)
- [ ] **Step 3**: Payment (Preferred Payment Terms)
- [ ] **Step 4**: Review (Summary)

**Expected**: Steps appear in order: Intent → Model → Details → Payment → Review

### Test: Details Step Content
- [ ] Basic Information fields: Title, Description
- [ ] Location section:
  - [ ] Country dropdown (config-driven)
  - [ ] City (required)
  - [ ] isRemoteAllowed (required checkbox)
  - [ ] Area (optional)
  - [ ] Address (optional)
  - [ ] Geo coordinates (optional)

**Expected**: All fields present, required fields validated

### Test: Payment Step
- [ ] Payment mode: CASH | BARTER | HYBRID
- [ ] Barter rule (if BARTER/HYBRID)
- [ ] Cash settlement (if HYBRID)

**Expected**: Sets `preferredPaymentTerms` only (not final terms)

### Test: Review Step
- [ ] Shows location details
- [ ] Shows preferred payment terms
- [ ] Shows all opportunity details

**Expected**: Complete summary before publishing

---

## 2. Publish & Visibility

### Test: Draft → Published Transition
- [ ] Create opportunity as draft
- [ ] Publish opportunity
- [ ] Verify status changes to 'published'

**Expected**: Draft opportunities not visible in marketplace, published ones are

### Test: Marketplace Listing
- [ ] View Opportunities List page
- [ ] Verify published opportunities appear
- [ ] Verify draft opportunities do not appear

**Expected**: Only published opportunities visible

### Test: My Opportunities
- [ ] Login as project_lead
- [ ] View "My Opportunities"
- [ ] Verify shows opportunities created by user

**Expected**: Shows opportunities per creator role

---

## 3. Matching Algorithm

### Test: Match Reasons Display
- [ ] View Matches page
- [ ] Verify match cards show:
  - [ ] Skills match percentage
  - [ ] Location compatibility (with reason)
  - [ ] Payment compatibility

**Expected**: Match reasons include location + payment compatibility

### Test: Location Rules
- [ ] Create opportunity with `isRemoteAllowed: false`
- [ ] Create opportunity with `isRemoteAllowed: true`
- [ ] Verify matching:
  - [ ] Remote allowed reduces location penalty
  - [ ] Same city = 100% location score
  - [ ] Same country, different city, remote allowed = 70% location score
  - [ ] Different country, remote allowed = 20% location score
  - [ ] Different country, on-site required = 0% location score

**Expected**: Remote work reduces location penalty correctly

### Test: Payment Compatibility
- [ ] Create opportunity with CASH payment
- [ ] Create opportunity with BARTER payment
- [ ] Create opportunity with HYBRID payment
- [ ] Verify matching shows payment compatibility:
  - [ ] Perfect match message
  - [ ] Compatible message
  - [ ] Mismatch message

**Expected**: Payment compatibility displayed correctly

---

## 4. Proposal Negotiation

### Test: Send Engagement Request CTA
- [ ] View opportunity details page
- [ ] Verify "Send Engagement Request" button visible (if not owner)
- [ ] Click button
- [ ] Verify redirects to proposal creation with opportunityId pre-filled

**Expected**: CTA present and functional

### Test: Proposal Form
- [ ] Create proposal from opportunity
- [ ] Verify form includes:
  - [ ] Proposed payment terms (final terms)
  - [ ] Mandatory comment field (min 10 characters)
- [ ] Try to submit without comment
- [ ] Verify validation error

**Expected**: Mandatory comment enforced

### Test: Proposal Versioning
- [ ] Create proposal V1 with comment
- [ ] Owner requests changes (with comment)
- [ ] Provider updates to V2 (with comment)
- [ ] Owner requests changes again (with comment)
- [ ] Provider updates to V3 (with comment)
- [ ] Verify all versions have mandatory comments

**Expected**: All versions require comments (min 10 chars)

### Test: Owner Actions
- [ ] Owner accepts version (with comment)
- [ ] Owner requests changes (with comment)
- [ ] Owner rejects (with comment)
- [ ] Try actions without comment
- [ ] Verify validation error

**Expected**: All owner actions require comments

### Test: FINAL_ACCEPTED → Contract Generation
- [ ] Both parties accept same version
- [ ] Verify proposal status changes to FINAL_ACCEPTED
- [ ] Verify contract auto-generated
- [ ] Verify contract appears in Contracts page
- [ ] Verify `generatedFromProposalVersionId` set correctly

**Expected**: Contract auto-generated on FINAL_ACCEPTED

### Test: Reject Path
- [ ] Owner rejects proposal with reason
- [ ] Verify proposal status = REJECTED
- [ ] Verify rejection reason displayed
- [ ] Verify no contract generated

**Expected**: Rejected proposals do not generate contracts

---

## 5. RBAC Sidebar Navigation

### Test: project_lead Role
- [ ] Login as project_lead user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Opportunities
  - [ ] Create Opportunity
  - [ ] Matches
  - [ ] Proposals
  - [ ] Contracts
- [ ] Verify admin items NOT visible

**Expected**: Correct items visible per role

### Test: supplier Role
- [ ] Login as supplier user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Opportunities (Offer views only)
  - [ ] Create Offer
  - [ ] Proposals
  - [ ] Contracts (own only)
- [ ] Verify "Create Opportunity" shows as "Create Offer"

**Expected**: Supplier-specific menu items

### Test: service_provider Role
- [ ] Login as service_provider user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Opportunities (Offer)
  - [ ] Create Offer
  - [ ] Proposals
  - [ ] Contracts

**Expected**: Service provider menu items

### Test: consultant Role
- [ ] Login as consultant user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Opportunities (Offer)
  - [ ] Create Offer
  - [ ] Proposals
  - [ ] Contracts

**Expected**: Consultant menu items

### Test: professional Role
- [ ] Login as professional user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Opportunities (browse/apply)
  - [ ] Proposals (if allowed)
  - [ ] Contracts (own only)
- [ ] Verify "Create Opportunity" NOT visible

**Expected**: Professional menu items (limited)

### Test: mentor Role
- [ ] Login as mentor user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Mentorship area only
- [ ] Verify Contracts NOT visible (unless specified)

**Expected**: Mentor menu items (limited to mentorship)

### Test: platform_admin Role
- [ ] Login as platform_admin user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Admin Dashboard
  - [ ] Opportunities (monitoring)
  - [ ] Proposals (monitoring)
  - [ ] Contracts (monitoring)
  - [ ] User Vetting
  - [ ] User Management
  - [ ] Project Moderation
  - [ ] Audit Trail
  - [ ] Reports

**Expected**: All admin items visible

### Test: auditor Role
- [ ] Login as auditor user
- [ ] Verify sidebar shows:
  - [ ] Dashboard
  - [ ] Audit Dashboard (read-only)
  - [ ] Opportunities (read-only)
  - [ ] Proposals (read-only)
  - [ ] Contracts (read-only)
- [ ] Verify admin actions NOT available

**Expected**: Read-only access only

---

## 6. Route Guards

### Test: Unauthorized Access Blocking
- [ ] Login as professional user
- [ ] Try to access `/opportunities/create`
- [ ] Verify access denied message
- [ ] Verify redirect to dashboard

**Expected**: Route guards block unauthorized access

### Test: Admin Route Protection
- [ ] Login as professional user
- [ ] Try to access `/admin`
- [ ] Verify access denied message

**Expected**: Admin routes protected

### Test: Mentor Restrictions
- [ ] Login as mentor user
- [ ] Try to access `/opportunities`
- [ ] Verify access denied or limited access

**Expected**: Mentor restrictions enforced

---

## 7. Seed Data Verification

### Test: All 8 Roles Created
- [ ] Check users created:
  - [ ] project_lead (2 users)
  - [ ] supplier (1 user)
  - [ ] service_provider (2 users)
  - [ ] consultant (1 user)
  - [ ] professional (1 user)
  - [ ] mentor (1 user)
  - [ ] platform_admin (1 user)
  - [ ] auditor (1 user)

**Expected**: All 8 roles represented

### Test: Opportunities Coverage
- [ ] Verify opportunities include:
  - [ ] REQUEST_SERVICE opportunities
  - [ ] OFFER_SERVICE opportunities
  - [ ] MEGA project (SPV)

**Expected**: All intent types covered

### Test: Proposal Versioning Examples
- [ ] Verify at least 2 proposals with versions:
  - [ ] V1 → V2 → V3
  - [ ] Mandatory comments on all versions
- [ ] Verify at least 1 FINAL_ACCEPTED proposal
- [ ] Verify at least 1 REJECTED proposal with reason

**Expected**: Proposal versioning demonstrated

### Test: Contract Generation
- [ ] Verify contracts auto-generated from FINAL_ACCEPTED proposals
- [ ] Verify `generatedFromProposalVersionId` set correctly

**Expected**: Contracts generated automatically

---

## 8. Legacy Data Cleanup

### Test: Legacy Keys Removed
- [ ] Check localStorage
- [ ] Verify legacy keys removed:
  - [ ] `pmtwin_projects` ❌
  - [ ] `pmtwin_tasks` ❌
  - [ ] `pmtwin_requests` ❌
  - [ ] `pmtwin_offers` ❌
  - [ ] `pmtwin_matches` ❌
  - [ ] `pmtwin_pipeline` ❌
- [ ] Verify allowed keys present:
  - [ ] `pmtwin_opportunities` ✅
  - [ ] `pmtwin_proposals` ✅
  - [ ] `pmtwin_contracts` ✅
  - [ ] `pmtwin_users` ✅

**Expected**: Only unified keys present

---

## 9. Integration Tests

### Test: Complete Workflow
1. [ ] Login as project_lead
2. [ ] Create opportunity (verify step order)
3. [ ] Publish opportunity
4. [ ] Login as service_provider
5. [ ] View matches (verify location + payment reasons)
6. [ ] Send engagement request
7. [ ] Create proposal with comment
8. [ ] Login as project_lead
9. [ ] Request changes (with comment)
10. [ ] Login as service_provider
11. [ ] Update proposal V2 (with comment)
12. [ ] Login as project_lead
13. [ ] Accept V2 (with comment)
14. [ ] Login as service_provider
15. [ ] Accept V2 (with comment)
16. [ ] Verify contract auto-generated
17. [ ] Verify contract visible in Contracts page

**Expected**: Complete workflow functions end-to-end

---

## Test Results Template

```
Date: ___________
Tester: ___________

[ ] All tests passed
[ ] Some tests failed (see notes below)

Notes:
_________________________________________________
_________________________________________________
_________________________________________________
```
