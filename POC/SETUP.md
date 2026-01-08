# PMTwin Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Open the Application
1. Navigate to the `POC` folder
2. Open `index.html` in your web browser
3. Or use a local server:
   ```bash
   cd POC
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

### Step 2: Create Test Accounts
Open browser console (F12) and run:

```javascript
// Load and run setup script
const script = document.createElement('script');
script.src = 'js/setup-accounts.js';
script.onload = function() {
  if (window.setupPMTwinAccounts) {
    window.setupPMTwinAccounts();
  }
};
document.head.appendChild(script);
```

Or manually copy/paste the setup code from `js/setup-accounts.js` into the console.

### Step 3: Login to Portals

Use these credentials to test all portals:

## 📋 Login Credentials - Golden Seed Dataset

### 🔐 Admin Portal
**URL:** `pages/admin/` or `admin-portal.html`

| Field | Value |
|-------|-------|
| Email | `admin@pmtwin.com` |
| Password | `Admin123` |
| Role | Admin |
| Features | Vetting, Moderation, Financial Reports, Audit Trail |

**What you can do:**
- Review and approve/reject user registrations
- Moderate marketplace projects
- View financial reports and analytics
- Access complete audit trail
- View all contracts, engagements, and projects

---

### 🏢 Beneficiaries (Project Creators)

#### NEOM Development Authority
| Field | Value |
|-------|-------|
| Email | `beneficiary@pmtwin.com` |
| Password | `Beneficiary123` |
| Role | Beneficiary |
| Scenario | Creates MegaProject "NEOM Package" with multiple contract types |

**What you can do:**
- View MegaProject "NEOM Package" with 2 SubProjects
- See all contracts: Vendor, Service, Advisory, SubContracts
- View active engagements and milestones
- Create and manage ServiceRequests

#### Saudi Real Estate Company
| Field | Value |
|-------|-------|
| Email | `entity2@pmtwin.com` |
| Password | `Entity123` |
| Role | Project Lead |
| Scenario | Creates standalone Project "Residential Tower" |

**What you can do:**
- View standalone Project "Residential Tower"
- See PROJECT_CONTRACT with Vendor Beta
- Manage project lifecycle

---

### 🏗️ Vendors (Contractors)

#### Alpha Construction Group
| Field | Value |
|-------|-------|
| Email | `vendor.alpha@pmtwin.com` |
| Password | `Vendor123` |
| Role | Vendor |
| Scenario | Executes MegaProject, manages SubContractors |

**What you can do:**
- View MEGA_PROJECT_CONTRACT for NEOM Package
- Manage SubContracts with MEP and Steel SubContractors
- View active engagements and milestones
- Create ServiceRequests for planning support

#### Beta Infrastructure Ltd
| Field | Value |
|-------|-------|
| Email | `vendor.beta@pmtwin.com` |
| Password | `Vendor123` |
| Role | Vendor |
| Scenario | Executes standalone Project |

**What you can do:**
- View PROJECT_CONTRACT for Residential Tower
- Manage project execution

---

### 🔧 Service Providers (Skill-Based Services)

#### BIM Solutions Co
| Field | Value |
|-------|-------|
| Email | `bim@pmtwin.com` |
| Password | `Service123` |
| Role | Service Provider |
| Scenario | Provides BIM coordination services |

**What you can do:**
- View SERVICE_CONTRACT for BIM services
- See active BIM Engagement with milestones
- Respond to ServiceRequests (never bids on Projects)

#### Quality Assurance Services
| Field | Value |
|-------|-------|
| Email | `qa@pmtwin.com` |
| Password | `Service123` |
| Role | Service Provider |
| Scenario | Provides QA/QC inspection services |

**What you can do:**
- View SERVICE_CONTRACT for QA services
- See planned QA Engagement
- Manage weekly inspection milestones

#### Project Planning Experts
| Field | Value |
|-------|-------|
| Email | `scheduler@pmtwin.com` |
| Password | `Service123` |
| Role | Service Provider |
| Scenario | Provides project planning and scheduling |

**What you can do:**
- Respond to ServiceRequests from Vendors
- Provide scheduling services

---

### 💼 Consultant

#### Green Building Consultants
| Field | Value |
|-------|-------|
| Email | `consultant@pmtwin.com` |
| Password | `Consultant123` |
| Role | Consultant |
| Scenario | Provides sustainability advisory services |

**What you can do:**
- View ADVISORY_CONTRACT for MegaProject
- See active Advisory Engagement
- Track sustainability milestones

---

### 🔨 Sub-Contractors

#### MEP Specialists LLC
| Field | Value |
|-------|-------|
| Email | `mep.sub@pmtwin.com` |
| Password | `SubContractor123` |
| Role | SubContractor |
| Scenario | Works under Vendor Alpha for MEP works |

**What you can do:**
- View SUB_CONTRACT with Vendor Alpha (NOT with Beneficiary)
- See planned MEP Sub Engagement
- Track MEP installation milestones

#### Steel Fabrication Co
| Field | Value |
|-------|-------|
| Email | `steel.sub@pmtwin.com` |
| Password | `SubContractor123` |
| Role | SubContractor |
| Scenario | Works under Vendor Alpha for steel fabrication |

**What you can do:**
- View SUB_CONTRACT with Vendor Alpha (NOT with Beneficiary)
- See active Steel Sub Engagement
- Track steel fabrication milestones

---

### 📱 Mobile App
**URL:** `mobile-app.html`

| Field | Value |
|-------|-------|
| Email | Any user email above |
| Password | Corresponding password |
| Role | Any role |
| Features | Biometric Approval, Site Logging, Notifications, Offline Mode |

**What you can do:**
- Approve milestones with biometric verification
- Log site activities with photos/videos
- Verify preliminaries checklist
- View notifications and sync status

---

## 🎯 Testing Workflow

### Complete User Journey Test

1. **As Admin:**
   - Login to Admin Portal
   - Go to Vetting → See pending users (if any)
   - Go to Reports → View platform statistics
   - Go to Audit Trail → View activity logs

2. **As Beneficiary (NEOM Development Authority):**
   - Login to User Portal (beneficiary@pmtwin.com)
   - View MegaProject "NEOM Package" with SubProjects
   - See all contract types: Vendor, Service, Advisory, SubContracts
   - View active engagements and milestones
   - Create ServiceRequests for additional services

3. **As Vendor (Alpha Construction Group):**
   - Login to User Portal (vendor.alpha@pmtwin.com)
   - View MEGA_PROJECT_CONTRACT
   - See SubContracts with MEP and Steel SubContractors
   - Manage engagements and track milestones
   - Create ServiceRequests for planning support

4. **As Service Provider (BIM Solutions Co):**
   - Login to User Portal (bim@pmtwin.com)
   - View SERVICE_CONTRACT and active engagement
   - Track BIM milestones (Clash Report, IFC Model)
   - Browse ServiceRequests (never see Project bidding)

5. **As SubContractor (MEP Specialists):**
   - Login to User Portal (mep.sub@pmtwin.com)
   - View SUB_CONTRACT with Vendor Alpha only
   - Note: Cannot see contracts with Beneficiaries
   - Track MEP installation milestones
   - Submit a proposal on a project
   - Track proposal status in Pipeline

4. **As Mobile User:**
   - Login to Mobile App
   - Approve a milestone (biometric)
   - Log site activity with photos
   - Check notifications

---

## 🔧 Troubleshooting

### Accounts Not Created?
- Make sure `data.js` is loaded first
- Check browser console for errors
- Try running `PMTwinData.init()` first
- Clear localStorage and try again

### Can't Login?
- Verify account was created (check console output)
- Ensure account status is 'approved'
- Check email/password are correct (case-sensitive)
- Try clearing browser cache

### Wrong Portal Access?
- Admin Portal: Only accepts `admin` role
- User Portal: Only accepts `individual` or `entity` roles
- Mobile App: Only accepts `individual` or `entity` roles

---

## 📝 Manual Account Creation

If the setup script doesn't work, create accounts manually:

### Admin Account
```javascript
PMTwinData.Users.create({
  email: 'admin@pmtwin.com',
  password: btoa('Admin123'),
  role: 'admin',
  profile: {
    name: 'Admin User',
    status: 'approved',
    approvedAt: new Date().toISOString()
  }
});
```

### Individual Account
```javascript
PMTwinData.Users.create({
  email: 'individual@pmtwin.com',
  password: btoa('User123'),
  role: 'individual',
  profile: {
    name: 'John Doe',
    status: 'approved',
    skills: ['Project Management', 'Engineering'],
    approvedAt: new Date().toISOString()
  }
});
```

### Entity Account
```javascript
PMTwinData.Users.create({
  email: 'entity@pmtwin.com',
  password: btoa('Entity123'),
  role: 'entity',
  profile: {
    name: 'ABC Construction Co.',
    companyName: 'ABC Construction Company',
    status: 'approved',
    services: ['General Contracting'],
    approvedAt: new Date().toISOString()
  }
});
```

---

## ✅ Verification

After setup, verify accounts exist:

```javascript
// Check all users
const users = PMTwinData.Users.getAll();
console.table(users.map(u => ({
  email: u.email,
  role: u.role,
  status: u.profile?.status
})));
```

You should see 3 users:
- admin@pmtwin.com (admin, approved)
- individual@pmtwin.com (individual, approved)
- entity@pmtwin.com (entity, approved)

---

## 🎉 Ready to Test!

All portals are now ready for testing. Start with the Admin Portal to see the full system in action!

**Next Steps:**
1. Login to Admin Portal → Review system
2. Login to User Portal (Entity) → Create a project
3. Login to User Portal (Individual) → Submit a proposal
4. Login to Mobile App → Test field features

Happy Testing! 🚀

