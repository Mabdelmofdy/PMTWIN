# Test Data Verification Guide

## Overview
This document provides a guide for verifying that all test data appears correctly on pages according to user roles.

## Test Data Added

### 1. Collaboration Opportunities (13 Models)
All 13 collaboration sub-models now have test opportunities:
- **Model 1.1**: Task-Based Engagement (2 opportunities)
- **Model 1.2**: Consortium (1 opportunity)
- **Model 1.3**: Project-Specific Joint Venture (1 opportunity)
- **Model 1.4**: Special Purpose Vehicle (SPV) (2 opportunities)
- **Model 2.1**: Strategic Joint Venture (1 opportunity)
- **Model 2.2**: Strategic Alliance (1 opportunity)
- **Model 2.3**: Mentorship (1 opportunity)
- **Model 3.1**: Bulk Purchasing (1 opportunity)
- **Model 3.2**: Co-Ownership (1 opportunity)
- **Model 3.3**: Resource Exchange/Barter (1 opportunity)
- **Model 4.1**: Professional Hiring (1 opportunity)
- **Model 4.2**: Consultant Hiring (1 opportunity)
- **Model 5.1**: Competition/RFP (1 opportunity)

### 2. Collaboration Applications
- Multiple applications created for collaboration opportunities
- Various statuses: pending, under_review, approved, rejected
- Linked to appropriate users and opportunities

### 3. Expanded Opportunities
- **12+ opportunities** with diverse:
  - Intents: REQUEST_SERVICE, OFFER_SERVICE
  - Payment modes: CASH, BARTER, HYBRID
  - Statuses: published, draft, closed
  - Locations: Riyadh, Jeddah, Dammam, Khobar, NEOM, UAE, Egypt

### 4. Additional Proposals
- **5+ proposals** with various statuses:
  - SUBMITTED
  - UNDER_REVIEW
  - FINAL_ACCEPTED (with versioning V1→V2→V3)
  - REJECTED
  - BARTER proposals

### 5. Matching Results
- Match records for REQUEST_SERVICE opportunities
- Scores >80% threshold
- Linked to providers and opportunities

### 6. Notifications
- Opportunity match notifications
- Proposal status updates
- Opportunity published notifications
- Linked to appropriate users

### 7. Admin Test Data
- **5 pending users** for vetting (one per role: project_lead, supplier, service_provider, consultant, professional)
- **2 pending/draft opportunities** for moderation

## Verification Checklist

### User Portal Pages

#### Dashboard (`/pages/dashboard/index.html`)
**Test with all 8 roles:**
- [ ] Platform Admin: Shows platform statistics, all data
- [ ] Project Lead: Shows own opportunities, proposals received, contracts
- [ ] Supplier: Shows bulk purchasing opportunities, resource exchange
- [ ] Service Provider: Shows service opportunities, own proposals
- [ ] Consultant: Shows advisory opportunities, consultant hiring
- [ ] Professional: Shows task-based opportunities, professional hiring
- [ ] Mentor: Shows mentorship opportunities
- [ ] Auditor: Shows read-only access to all data

**Expected Data:**
- Role-appropriate statistics
- Recent activity feed
- Quick actions based on role

#### Opportunities (`/pages/opportunities/index.html`)
**Test with different roles:**
- [ ] Project Lead: Sees own opportunities + public opportunities
- [ ] Service Provider: Sees REQUEST_SERVICE opportunities matching their skills
- [ ] All roles: Can filter by intent, payment mode, location, model
- [ ] All roles: Can see opportunities with status: published, draft (own), closed

**Expected Data:**
- 12+ opportunities visible
- Filtering works correctly
- Role-based filtering applied

#### My Opportunities (`/pages/opportunities/my/index.html`)
**Test with Project Lead:**
- [ ] Shows only opportunities created by logged-in user
- [ ] Shows proposal counts per opportunity
- [ ] Filtering by intent and status works

**Expected Data:**
- Opportunities created by the user
- Proposal statistics

#### Collaboration Models (`/pages/collaboration/`)
**Test all 13 model pages:**
- [ ] Model 1.1 (Task-Based): `/pages/collaboration/task-based/index.html`
- [ ] Model 1.2 (Consortium): `/pages/collaboration/consortium/index.html`
- [ ] Model 1.3 (Project JV): `/pages/collaboration/joint-venture/index.html`
- [ ] Model 1.4 (SPV): `/pages/collaboration/spv/index.html`
- [ ] Model 2.1 (Strategic JV): `/pages/collaboration/strategic-jv/index.html`
- [ ] Model 2.2 (Strategic Alliance): `/pages/collaboration/strategic-alliance/index.html`
- [ ] Model 2.3 (Mentorship): `/pages/collaboration/mentorship/index.html`
- [ ] Model 3.1 (Bulk Purchasing): `/pages/collaboration/bulk-purchasing/index.html`
- [ ] Model 3.2 (Co-Ownership): `/pages/collaboration/co-ownership/index.html`
- [ ] Model 3.3 (Resource Exchange): `/pages/collaboration/resource-exchange/index.html`
- [ ] Model 4.1 (Professional Hiring): `/pages/collaboration/professional-hiring/index.html`
- [ ] Model 4.2 (Consultant Hiring): `/pages/collaboration/consultant-hiring/index.html`
- [ ] Model 5.1 (Competition): `/pages/collaboration/competition/index.html`

**Expected Data:**
- Each page shows at least 1 collaboration opportunity for that model
- Opportunities are filterable by status
- Can view opportunity details

#### Collaboration Opportunities (`/pages/collaboration/opportunities/index.html`)
**Test with all roles:**
- [ ] Shows all active collaboration opportunities
- [ ] Can filter by model type, status, category
- [ ] Shows application counts
- [ ] Can apply to opportunities (if permitted by role)

**Expected Data:**
- 13+ collaboration opportunities visible
- Filtering works correctly

#### Proposals (`/pages/proposals/index.html`)
**Test with different roles:**
- [ ] Project Lead: Sees proposals received for their opportunities
- [ ] Service Provider: Sees own proposals submitted
- [ ] All roles: Can filter by status
- [ ] Shows proposal versioning (V1→V2→V3)

**Expected Data:**
- 5+ proposals visible
- Various statuses displayed
- Version history visible

#### Pipeline (`/pages/pipeline/index.html`)
**Test with Project Lead:**
- [ ] Shows service engagements in Kanban board
- [ ] Status columns: In Review, Evaluation, Approved, Rejected, Completed
- [ ] Can filter and search

**Expected Data:**
- Service engagements displayed
- Milestones visible

#### Matches (`/pages/matches/index.html`)
**Test with Service Provider:**
- [ ] Shows matching results for opportunities
- [ ] Match scores >80% displayed
- [ ] Can view opportunity details from matches

**Expected Data:**
- Multiple match records visible
- Scores displayed correctly

#### Notifications (`/pages/notifications/index.html`)
**Test with all roles:**
- [ ] Shows notifications for logged-in user
- [ ] Different notification types visible
- [ ] Can mark as read/unread

**Expected Data:**
- Notifications for various events
- Role-appropriate notifications

### Admin Portal Pages

#### Admin Dashboard (`/pages/admin/index.html`)
**Test with Platform Admin:**
- [ ] Shows platform statistics
- [ ] Shows collaboration models activity
- [ ] Shows recent activity feed
- [ ] Shows pending approvals queue

**Expected Data:**
- Platform-wide statistics
- Activity metrics
- Pending items count

#### User Vetting (`/pages/admin-vetting/index.html`)
**Test with Platform Admin:**
- [ ] Shows pending users for vetting
- [ ] Shows users with status: pending, under_review, rejected
- [ ] Can filter by onboarding stage, user type
- [ ] Can approve/reject users

**Expected Data:**
- 5+ pending users visible
- Users with various onboarding stages
- Filtering works correctly

#### Moderation (`/pages/admin-moderation/index.html`)
**Test with Platform Admin:**
- [ ] Shows pending/draft opportunities for moderation
- [ ] Can approve/reject opportunities
- [ ] Shows flagged content

**Expected Data:**
- 2+ pending opportunities visible
- Draft opportunities visible

#### Reports (`/pages/admin-reports/index.html`)
**Test with Platform Admin:**
- [ ] Shows user analytics
- [ ] Shows project/opportunity analytics
- [ ] Shows proposal statistics
- [ ] Shows matching performance

**Expected Data:**
- Analytics data displayed
- Charts and graphs populated

#### Audit Trail (`/pages/admin-audit/index.html`)
**Test with Platform Admin:**
- [ ] Shows audit logs
- [ ] Can filter by action, user, entity type
- [ ] Shows recent activity

**Expected Data:**
- Audit logs visible
- Filtering works correctly

### Public Portal Pages

#### Discovery (`/pages/discovery/index.html`)
**Test as guest (not logged in):**
- [ ] Shows public opportunities
- [ ] Can filter by location, category
- [ ] Cannot see draft or private opportunities

**Expected Data:**
- Public opportunities visible
- Filtering works correctly

## Test Accounts

Use these test accounts to verify role-based data display:

### Platform Admin
- Email: `platform.admin@pmtwin.com`
- Password: `Admin123`
- Should see: All data, admin features

### Project Lead
- Email: `project.lead.riyadh@pmtwin.com`
- Password: `ProjectLead123`
- Should see: Own opportunities, proposals received, contracts

### Supplier
- Email: `supplier.riyadh@pmtwin.com`
- Password: `Supplier123`
- Should see: Bulk purchasing opportunities, resource exchange

### Service Provider
- Email: `provider.riyadh@pmtwin.com`
- Password: `Provider123`
- Should see: Service opportunities, own proposals, matches

### Consultant
- Email: `consultant.jeddah@pmtwin.com`
- Password: `Consultant123`
- Should see: Advisory opportunities, consultant hiring

### Professional
- Email: `professional.khobar@pmtwin.com`
- Password: `Professional123`
- Should see: Task-based opportunities, professional hiring

### Mentor
- Email: `mentor@pmtwin.com`
- Password: `Mentor123`
- Should see: Mentorship opportunities

### Auditor
- Email: `auditor@pmtwin.com`
- Password: `Auditor123`
- Should see: Read-only access to all data

## Data Loading

Test data is automatically loaded when:
1. Application initializes
2. `golden-seed-data.js` is loaded
3. `loadGoldenSeedData()` is called

Check browser console for:
- `🌱 Loading Golden Seed Data...`
- `✅ Golden Seed Data Loaded:`
- `✅ Created X collaboration opportunities`
- `✅ Created X collaboration applications`
- `✅ Created X matching results`
- `✅ Created X notifications`
- `✅ Created X pending users`

## Troubleshooting

### If data doesn't appear:
1. Check browser console for errors
2. Verify `PMTwinData` is available
3. Check localStorage for data keys:
   - `pmtwin_opportunities`
   - `pmtwin_collaboration_opportunities`
   - `pmtwin_collaboration_applications`
   - `pmtwin_matches`
   - `pmtwin_notifications`
   - `pmtwin_users`
4. Clear localStorage and reload if needed
5. Check that seed data functions are being called

### If role-based filtering doesn't work:
1. Verify user is logged in
2. Check user role in session
3. Verify RBAC permissions
4. Check service layer filtering logic

## Notes

- All test data uses realistic Saudi Arabia locations and contexts
- Data is created with timestamps spread over the last 30 days
- Statuses are distributed realistically (more pending/reviewing than approved/rejected)
- Collaboration opportunities use status: 'active' (which is compatible with getActive() method)
- Regular opportunities use status: 'published' (for public visibility)
