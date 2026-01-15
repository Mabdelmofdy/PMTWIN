# RBAC Sidebar Matrix

## Overview
This document shows which sidebar menu items are visible to each of the 8 roles in the PMTwin system.

## Role-Based Sidebar Visibility

| Role | Dashboard | Opportunities | Create Opportunity | Matches | Proposals | Contracts | Admin | Audit |
|------|-----------|---------------|-------------------|---------|-----------|-----------|-------|-------|
| **project_lead** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **supplier** | ✅ | ✅ (Offer only) | ✅ (Create Offer) | ❌ | ✅ | ✅ (Own only) | ❌ | ❌ |
| **service_provider** | ✅ | ✅ (Offer) | ✅ (Create Offer) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **consultant** | ✅ | ✅ (Offer) | ✅ (Create Offer) | ❌ | ✅ | ✅ | ❌ | ❌ |
| **professional** | ✅ | ✅ (Browse/Apply) | ❌ | ❌ | ✅ (Conditional) | ✅ (Own only) | ❌ | ❌ |
| **mentor** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **platform_admin** | ✅ | ✅ (Monitor) | ❌ | ❌ | ✅ (Monitor) | ✅ (Monitor) | ✅ | ✅ |
| **auditor** | ✅ | ✅ (Read-only) | ❌ | ❌ | ✅ (Read-only) | ✅ (Read-only) | ❌ | ✅ (Read-only) |

## Detailed Menu Items Per Role

### project_lead
- Dashboard
- Opportunities (all intents)
- Create Opportunity
- Matches
- Proposals
- Contracts

### supplier
- Dashboard
- Opportunities (OFFER_SERVICE only)
- Create Offer
- Proposals
- Contracts (own contracts only)

### service_provider
- Dashboard
- Opportunities (OFFER_SERVICE)
- Create Offer
- Proposals
- Contracts

### consultant
- Dashboard
- Opportunities (OFFER_SERVICE)
- Create Offer
- Proposals
- Contracts

### professional
- Dashboard
- Opportunities (browse/apply)
- Proposals (if allowed)
- Contracts (own contracts only)

### mentor
- Dashboard
- Mentorship area only
- Contracts hidden (unless specified)

### platform_admin
- Dashboard
- Admin Dashboard
- Opportunities (monitoring view)
- Proposals (monitoring view)
- Contracts (monitoring view)
- User Vetting
- User Management
- Project Moderation
- Audit Trail
- Reports

### auditor
- Dashboard
- Audit Dashboard (read-only)
- Opportunities (read-only)
- Proposals (read-only)
- Contracts (read-only)

## Route Access Control

Routes are protected by route guards (`POC/src/core/rbac/route-guards.js`):

- **Admin routes** (`/admin/*`): Only `platform_admin`, `auditor`, `admin`
- **Create Opportunity** (`/opportunities/create`): `project_lead`, `supplier`, `service_provider`, `consultant`
- **Contracts** (`/contracts/*`): `project_lead`, `supplier`, `service_provider`, `consultant`, `professional`, `platform_admin`, `auditor`
- **Mentor restrictions**: Only mentorship-related routes

## Implementation Files

- **RBAC Navigation Config**: `POC/src/core/rbac/nav.config.js`
- **Route Guards**: `POC/src/core/rbac/route-guards.js`
- **Dashboard Service**: `POC/src/services/dashboard/dashboard-service.js`
- **Roles Definition**: `POC/data/roles.json`
