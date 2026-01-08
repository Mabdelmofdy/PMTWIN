# User Role Alignment Guide

## Overview

This document explains how to check and verify that all users have correct roles aligned with the golden seed dataset and PMTwin role system.

## Quick Check

### Browser Console

```javascript
// Load the check script (if not already loaded)
const script = document.createElement('script');
script.src = 'src/utils/check-user-roles.js';
document.head.appendChild(script);

// Wait for script to load, then run
setTimeout(() => {
  PMTwinCheckUserRoles.checkAll();
}, 500);
```

### Check Results

The script will display:
- ✅ **Aligned Users**: Users with correct role and userType
- ❌ **Misaligned Users**: Users with incorrect role or userType
- ⚠️ **Missing Users**: Golden seed users not found in system
- 📋 **Other Users**: Users not in golden seed dataset

## Expected Role Mappings

### Golden Seed Users

| Email | Role | UserType | Name |
|-------|------|----------|------|
| `admin@pmtwin.com` | `admin` | `admin` | Platform Administrator |
| `beneficiary@pmtwin.com` | `beneficiary` | `beneficiary` | NEOM Development Authority |
| `entity2@pmtwin.com` | `project_lead` | `beneficiary` | Saudi Real Estate Company |
| `vendor.alpha@pmtwin.com` | `vendor` | `vendor_corporate` | Alpha Construction Group |
| `vendor.beta@pmtwin.com` | `vendor` | `vendor_corporate` | Beta Infrastructure Ltd |
| `bim@pmtwin.com` | `skill_service_provider` | `service_provider` | BIM Solutions Co |
| `qa@pmtwin.com` | `skill_service_provider` | `service_provider` | Quality Assurance Services |
| `scheduler@pmtwin.com` | `skill_service_provider` | `service_provider` | Project Planning Experts |
| `consultant@pmtwin.com` | `consultant` | `consultant` | Green Building Consultants |
| `mep.sub@pmtwin.com` | `sub_contractor` | `sub_contractor` | MEP Specialists LLC |
| `steel.sub@pmtwin.com` | `sub_contractor` | `sub_contractor` | Steel Fabrication Co |

## Role to UserType Mapping

The system automatically maps roles to userTypes using this mapping:

```javascript
{
  'platform_admin': 'admin',
  'admin': 'admin',
  'project_lead': 'beneficiary',
  'entity': 'beneficiary',
  'beneficiary': 'beneficiary',
  'vendor': 'vendor_corporate',
  'supplier': 'vendor_corporate',
  'service_provider': 'vendor_corporate', // Legacy
  'skill_service_provider': 'service_provider',
  'sub_contractor': 'sub_contractor',
  'professional': 'sub_contractor', // Legacy
  'consultant': 'consultant',
  'mentor': 'consultant',
  'individual': 'consultant', // Legacy
  'auditor': 'admin'
}
```

## Fixing Misaligned Users

### Automatic Fix

```javascript
// Fix all misaligned golden seed users
PMTwinCheckUserRoles.fixMisaligned();
```

This will:
- Update role if incorrect
- Update userType if incorrect
- Preserve all other user data

### Manual Fix

```javascript
// Fix a specific user
const user = PMTwinData.Users.getByEmail('beneficiary@pmtwin.com');
if (user) {
  PMTwinData.Users.update(user.id, {
    role: 'beneficiary',
    userType: 'beneficiary'
  });
}
```

## Verification Checklist

- [ ] All 11 golden seed users exist
- [ ] All golden seed users have correct roles
- [ ] All golden seed users have correct userTypes
- [ ] Other users have roles that map to valid userTypes
- [ ] No orphaned users (users without valid roles)

## Common Issues

### Issue 1: Missing userType

**Symptom**: User has role but userType is undefined or null

**Fix**:
```javascript
const user = PMTwinData.Users.getByEmail('user@example.com');
if (user && !user.userType) {
  const userType = PMTwinData.mapRoleToUserType(user.role);
  PMTwinData.Users.update(user.id, { userType });
}
```

### Issue 2: Legacy role not mapped

**Symptom**: User has legacy role (e.g., 'entity' instead of 'beneficiary')

**Fix**: Update to new role:
```javascript
PMTwinData.Users.update(user.id, { role: 'beneficiary' });
```

### Issue 3: userType mismatch

**Symptom**: userType doesn't match role mapping

**Fix**: Recalculate userType:
```javascript
const userType = PMTwinData.mapRoleToUserType(user.role);
PMTwinData.Users.update(user.id, { userType });
```

## Role Validation Rules

1. **Beneficiary roles** must have `userType: 'beneficiary'`
   - Valid roles: `beneficiary`, `project_lead`, `entity`

2. **Vendor roles** must have `userType: 'vendor_corporate'` or `'vendor_individual'`
   - Valid roles: `vendor`, `supplier`

3. **Service Provider roles** must have `userType: 'service_provider'`
   - Valid roles: `skill_service_provider`
   - Note: Legacy `service_provider` role maps to `vendor_corporate`

4. **SubContractor roles** must have `userType: 'sub_contractor'`
   - Valid roles: `sub_contractor`

5. **Consultant roles** must have `userType: 'consultant'`
   - Valid roles: `consultant`, `mentor`

6. **Admin roles** must have `userType: 'admin'`
   - Valid roles: `admin`, `platform_admin`, `auditor`

## Testing

After fixing users, verify:

```javascript
// Re-check all users
PMTwinCheckUserRoles.checkAll();

// Verify specific user
const user = PMTwinData.Users.getByEmail('beneficiary@pmtwin.com');
console.log('Role:', user.role);
console.log('UserType:', user.userType);
console.log('Expected UserType:', PMTwinData.mapRoleToUserType(user.role));
```

## See Also

- `SEED_SCENARIOS.md` - Golden seed dataset scenarios
- `DEMO_USERS_QUICK_REFERENCE.md` - Quick reference for demo users
- `src/core/data/data.js` - Role mapping functions

