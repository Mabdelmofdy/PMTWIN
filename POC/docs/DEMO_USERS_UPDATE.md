# Demo Users Update - All Roles

## Overview

Updated the demo credentials modal to include sample users for all 8 roles in the system, replacing the previous 3 users (admin, individual, entity).

## Changes Made

### 1. Updated `data/demo-users.json`

Added demo users for all roles:

| Role | Email | Password | Name | Description |
|------|-------|----------|------|-------------|
| **platform_admin** | admin@pmtwin.com | Admin123 | Platform Administrator | Full system access |
| **project_lead** | entity@pmtwin.com | Entity123 | ABC Construction Co. | General Contracting Company |
| **professional** | individual@pmtwin.com | User123 | John Doe | Senior Civil Engineer |
| **supplier** | supplier@pmtwin.com | Supplier123 | Global Materials Supply | Materials Supplier |
| **service_provider** | service@pmtwin.com | Service123 | Legal & Logistics Services | B2B Service Provider |
| **consultant** | consultant@pmtwin.com | Consultant123 | Dr. Sarah Ahmed | Construction Consultant |
| **mentor** | mentor@pmtwin.com | Mentor123 | Mohammed Al-Rashid | Senior Project Manager |
| **auditor** | auditor@pmtwin.com | Auditor123 | Compliance Auditor | Read-only access |

### 2. Updated `js/demo-credentials.js`

#### Portal Role Mapping
Updated `PORTAL_ROLE_MAP` to include all roles:

```javascript
const PORTAL_ROLE_MAP = {
  'admin': ['platform_admin', 'auditor'],
  'user': ['project_lead', 'professional', 'supplier', 'service_provider', 'consultant', 'mentor'],
  'mobile': ['project_lead', 'professional', 'supplier', 'service_provider', 'consultant', 'mentor'],
  'public': ['platform_admin', 'project_lead', 'professional', 'supplier', 'service_provider', 'consultant', 'mentor', 'auditor']
};
```

#### Role Badges
Added badge styling for all roles:

- **platform_admin**: Red badge (Admin)
- **project_lead**: Green badge (Project Lead)
- **professional**: Blue badge (Professional)
- **supplier**: Yellow badge (Supplier)
- **service_provider**: Primary badge (Service Provider)
- **consultant**: Secondary badge (Consultant)
- **mentor**: Purple badge (Mentor)
- **auditor**: Dark badge (Auditor)

### 3. Updated `css/main.css`

#### Added Badge Classes
Added new badge color classes:
- `.badge-secondary` - Gray secondary color
- `.badge-purple` - Purple color for mentors
- `.badge-dark` - Dark gray for auditors

#### Improved Modal Layout
Updated `.demo-credentials-list` to use grid layout:
```css
.demo-credentials-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: var(--spacing-4);
  max-height: 70vh;
  overflow-y: auto;
  padding: var(--spacing-2);
}
```

This provides:
- Responsive grid layout (auto-fills based on screen size)
- Scrollable content when many users
- Better visual organization
- Mobile-friendly (single column on small screens)

## User Details

### Platform Administrator
- **Email**: admin@pmtwin.com
- **Password**: Admin123
- **Access**: Full system access - Vetting, Moderation, Reports, Audit Trail, User Management
- **Use Case**: System administration and oversight

### Project Lead (Entity)
- **Email**: entity@pmtwin.com
- **Password**: Entity123
- **Access**: Project creation, tenders, consortia, SPVs, proposal management
- **Use Case**: General contracting companies creating mega-projects

### Professional (Individual)
- **Email**: individual@pmtwin.com
- **Password**: User123
- **Access**: Task-based opportunities, proposals, profile management, matches
- **Use Case**: Individual professionals seeking work opportunities

### Supplier
- **Email**: supplier@pmtwin.com
- **Password**: Supplier123
- **Access**: Bulk purchasing, inventory management, strategic alliances, resource marketplace
- **Use Case**: Materials suppliers participating in bulk purchasing and resource sharing

### Service Provider
- **Email**: service@pmtwin.com
- **Password**: Service123
- **Access**: Task-based engagements, strategic alliances, service portfolio management
- **Use Case**: B2B service providers offering specialized services

### Consultant
- **Email**: consultant@pmtwin.com
- **Password**: Consultant123
- **Access**: Advisory services, feasibility studies, expert reviews, strategic alliances
- **Use Case**: Construction consultants providing expert advice

### Mentor
- **Email**: mentor@pmtwin.com
- **Password**: Mentor123
- **Access**: Mentorship programs, guides junior professionals, tracks mentee progress
- **Use Case**: Senior professionals mentoring junior talent

### Auditor
- **Email**: auditor@pmtwin.com
- **Password**: Auditor123
- **Access**: Read-only access - Verify compliance, contract integrity, view audit trails, export data
- **Use Case**: Compliance and audit verification

## Portal Filtering

Users are filtered by portal type:

- **Admin Portal**: Shows platform_admin and auditor
- **User Portal**: Shows all user roles (project_lead, professional, supplier, service_provider, consultant, mentor)
- **Mobile Portal**: Shows all user roles
- **Public Portal**: Shows all roles (for registration/demo purposes)

## Visual Improvements

1. **Grid Layout**: Users displayed in responsive grid (2-3 columns on desktop, 1 column on mobile)
2. **Scrollable**: Modal content scrolls when there are many users
3. **Color-Coded Badges**: Each role has a distinct badge color for easy identification
4. **Hover Effects**: Cards have hover effects for better interactivity

## Testing

To test the updated demo credentials:

1. **Open any login page**
2. **Click "Demo Credentials" or similar button**
3. **Modal should display all 8 users in a grid layout**
4. **Each user card shows**:
   - Name
   - Role badge (color-coded)
   - Description
   - Email and password
   - "Use This Account" button
5. **Click "Use This Account"** to auto-fill credentials
6. **Test with different portal types** to see filtered users

## Files Modified

1. **`data/demo-users.json`** - Added 5 new demo users (total: 8 users)
2. **`js/demo-credentials.js`** - Updated role mapping and badge system
3. **`css/main.css`** - Added badge classes and improved modal layout

## Summary

The demo credentials modal now provides comprehensive coverage of all user roles in the system, making it easier to test different user experiences and permissions. Each role has a distinct visual identity through color-coded badges, and the improved grid layout makes it easy to browse and select demo users.

