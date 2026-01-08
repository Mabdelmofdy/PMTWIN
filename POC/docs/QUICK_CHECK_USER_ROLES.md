# Quick Check: User Role Alignment

## One-Command Check

Open browser console (F12) and run:

```javascript
PMTwinCheckUserRoles.quickCheck()
```

This displays a table showing all users with their roles, userTypes, and alignment status.

## Detailed Check

For comprehensive analysis:

```javascript
PMTwinCheckUserRoles.checkAll()
```

## Auto-Fix Misaligned Users

```javascript
PMTwinCheckUserRoles.fixMisaligned()
```

## Expected Results

All 11 golden seed users should show:
- ✅ Status: Aligned
- Type: Golden Seed
- Correct Role and UserType

## Quick Reference

| Role | Expected UserType |
|------|------------------|
| `admin` | `admin` |
| `beneficiary` | `beneficiary` |
| `project_lead` | `beneficiary` |
| `vendor` | `vendor_corporate` |
| `skill_service_provider` | `service_provider` |
| `consultant` | `consultant` |
| `sub_contractor` | `sub_contractor` |

## Troubleshooting

If users are misaligned:

1. **Check if golden seed data loaded**:
   ```javascript
   const users = PMTwinData.Users.getAll();
   console.log('Total users:', users.length);
   ```

2. **Reload golden seed data**:
   ```javascript
   PMTwinData.loadGoldenSeedData(true);
   ```

3. **Fix manually**:
   ```javascript
   PMTwinCheckUserRoles.fixMisaligned();
   ```

