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

## 📋 Login Credentials

### 🔐 Admin Portal
**URL:** `admin-portal.html`

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

---

### 👤 User Portal - Individual
**URL:** `user-portal.html`

| Field | Value |
|-------|-------|
| Email | `individual@pmtwin.com` |
| Password | `User123` |
| Role | Individual (Professional) |
| Features | Opportunities, Proposals, Profile, Pipeline |

**What you can do:**
- View task-based opportunities matched to your skills
- Submit proposals (cash or barter)
- Manage your profile and endorsements
- Track proposal status in pipeline

---

### 🏢 User Portal - Entity
**URL:** `user-portal.html`

| Field | Value |
|-------|-------|
| Email | `entity@pmtwin.com` |
| Password | `Entity123` |
| Role | Entity (Company) |
| Features | Project Creation, Matching, Proposals, Financial Overview |

**What you can do:**
- Create and publish mega-projects
- View matched service providers
- Review and approve/reject proposals
- Track financial health and active projects

---

### 📱 Mobile App
**URL:** `mobile-app.html`

| Field | Value |
|-------|-------|
| Email | `individual@pmtwin.com` or `entity@pmtwin.com` |
| Password | `User123` or `Entity123` |
| Role | Individual or Entity |
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

2. **As Entity:**
   - Login to User Portal (entity@pmtwin.com)
   - Create a new mega-project
   - Publish the project (triggers matching)
   - View matched providers in Opportunities
   - Review proposals received

3. **As Individual:**
   - Login to User Portal (individual@pmtwin.com)
   - View matched opportunities
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

