# Demo Users Quick Reference

## All Available Demo Accounts

### 🔐 Admin
| Email | Password | Role |
|-------|----------|------|
| `admin@pmtwin.com` | `Admin123` | Admin |

---

### 🏢 Beneficiaries (2)
| Email | Password | Role | Scenario |
|-------|----------|------|----------|
| `beneficiary@pmtwin.com` | `Beneficiary123` | Beneficiary | MegaProject creator |
| `entity2@pmtwin.com` | `Entity123` | Project Lead | Standalone Project creator |

---

### 🏗️ Vendors (2)
| Email | Password | Role | Scenario |
|-------|----------|------|----------|
| `vendor.alpha@pmtwin.com` | `Vendor123` | Vendor | MegaProject executor, manages SubContractors |
| `vendor.beta@pmtwin.com` | `Vendor123` | Vendor | Standalone Project executor |

---

### 🔧 Service Providers (3)
| Email | Password | Role | Scenario |
|-------|----------|------|----------|
| `bim@pmtwin.com` | `Service123` | Service Provider | BIM coordination services |
| `qa@pmtwin.com` | `Service123` | Service Provider | QA/QC inspection services |
| `scheduler@pmtwin.com` | `Service123` | Service Provider | Project planning and scheduling |

---

### 💼 Consultant (1)
| Email | Password | Role | Scenario |
|-------|----------|------|----------|
| `consultant@pmtwin.com` | `Consultant123` | Consultant | Sustainability advisory services |

---

### 🔨 Sub-Contractors (2)
| Email | Password | Role | Scenario |
|-------|----------|------|----------|
| `mep.sub@pmtwin.com` | `SubContractor123` | SubContractor | MEP works under Vendor Alpha |
| `steel.sub@pmtwin.com` | `SubContractor123` | SubContractor | Steel fabrication under Vendor Alpha |

---

## Quick Login Commands

### Browser Console
```javascript
// Login as any user
PMTwinAuth.login('beneficiary@pmtwin.com', 'Beneficiary123');
PMTwinAuth.login('vendor.alpha@pmtwin.com', 'Vendor123');
PMTwinAuth.login('bim@pmtwin.com', 'Service123');
PMTwinAuth.login('mep.sub@pmtwin.com', 'SubContractor123');
```

### Check All Users
```javascript
// List all users
const users = PMTwinData.Users.getAll();
console.table(users.map(u => ({
  email: u.email,
  role: u.role,
  name: u.profile?.name
})));
```

---

## Workflow Scenarios

### Scenario 1: MegaProject with Multiple Contracts
1. Login as `beneficiary@pmtwin.com`
2. View MegaProject "NEOM Package"
3. See contracts: Vendor, Service (BIM), Service (QA), Advisory, SubContracts

### Scenario 2: ServiceRequest to ServiceContract
1. Login as `beneficiary@pmtwin.com`
2. View ServiceRequests
3. Login as `bim@pmtwin.com`
4. View ServiceOffers and active SERVICE_CONTRACT

### Scenario 3: Vendor-SubContractor Relationship
1. Login as `vendor.alpha@pmtwin.com`
2. View SubContracts with MEP and Steel SubContractors
3. Login as `mep.sub@pmtwin.com`
4. View SUB_CONTRACT (note: only with Vendor, not Beneficiary)

### Scenario 4: Standalone Project
1. Login as `entity2@pmtwin.com`
2. View Project "Residential Tower"
3. See PROJECT_CONTRACT with Vendor Beta

---

## Key Constraints Demonstrated

1. **SubContractor Isolation**: SubContractors can only see contracts with Vendors
   - Try: Login as `mep.sub@pmtwin.com` - you'll only see SUB_CONTRACT with Vendor Alpha

2. **ServiceProvider Isolation**: ServiceProviders cannot bid on Projects
   - Try: Login as `bim@pmtwin.com` - you'll see ServiceRequests but no Project bidding

3. **Contract Requirements**: All engagements require signed contracts
   - View: Engagements tab - all have SIGNED/ACTIVE contracts

4. **Multi-Contract Support**: MegaProject has multiple contract types
   - View: MegaProject contracts - Vendor + Service + Advisory

---

## Reset Data

```javascript
// Clear all data and reload golden seed
localStorage.clear();
location.reload();
```

Or force reload:

```javascript
// Force reload golden seed data
PMTwinData.loadGoldenSeedData(true);
```

---

## See Also

- `SEED_SCENARIOS.md` - Detailed scenario descriptions
- `SEED_DATA_DIAGRAM.md` - Visual workflow diagrams
- `data/demo-users.json` - Complete user definitions with metadata

