# Admin Portal Login Fix Guide

## Quick Fix (Try This First!)

1. **Open Admin Portal** (`admin-portal.html`)
2. **Click "Fix Accounts" button** (on the login page)
3. **Wait for confirmation**
4. **Try logging in:**
   - Email: `admin@pmtwin.com`
   - Password: `Admin123`

## If That Doesn't Work

### Method 1: Browser Console (Recommended)

1. Open Admin Portal login page
2. Press **F12** to open browser console
3. Copy and paste this code:

```javascript
// Force create and fix admin account
PMTwinData.forceCreateTestAccounts();

// Verify account
const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
console.log('Admin account:', admin);

// Fix password if needed
if (admin) {
  PMTwinData.Users.update(admin.id, {
    password: btoa('Admin123'),
    profile: {
      ...admin.profile,
      status: 'approved'
    }
  });
  console.log('✅ Admin account fixed!');
}

// Test login
const result = PMTwinAuth.login('admin@pmtwin.com', 'Admin123');
console.log('Login test:', result);

if (result.success) {
  console.log('✅ Login works! Refresh the page.');
  window.location.reload();
} else {
  console.error('❌ Login failed:', result.error);
}
```

4. Press Enter
5. If login test succeeds, refresh the page

### Method 2: Use Debug Function

1. Open Admin Portal login page
2. Press **F12** (console)
3. Run: `debugAdminLogin()`
4. This will show detailed diagnostics
5. If issues found, run: `fixAdminLogin()`

### Method 3: Clear Everything and Start Fresh

1. Open browser console (F12)
2. Run:
```javascript
localStorage.clear();
location.reload();
```
3. Wait for page to reload (accounts will auto-create)
4. Try logging in

### Method 4: Use Fix Accounts Page

1. Open `fix-accounts.html` in your browser
2. Click "Fix Accounts Now" button
3. Return to admin portal and login

## Verify Account Exists

Run this in console to check:

```javascript
const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
if (admin) {
  console.log('✅ Account exists');
  console.log('Email:', admin.email);
  console.log('Role:', admin.role);
  console.log('Status:', admin.profile?.status);
  console.log('Password (decoded):', atob(admin.password));
} else {
  console.error('❌ Account not found!');
  console.log('Run: PMTwinData.forceCreateTestAccounts()');
}
```

## Common Issues

### Issue: "Invalid email or password"
**Solution:** 
- Make sure you're typing: `Admin123` (capital A, rest lowercase, no spaces)
- Run `PMTwinData.forceCreateTestAccounts()` in console
- Check account exists with code above

### Issue: "Account pending approval"
**Solution:**
```javascript
const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
PMTwinData.Users.update(admin.id, {
  profile: {
    ...admin.profile,
    status: 'approved',
    approvedAt: new Date().toISOString()
  }
});
location.reload();
```

### Issue: Login button does nothing
**Solution:**
- Check browser console for errors (F12)
- Try "Test Login" button instead
- Make sure JavaScript is enabled
- Try a different browser

### Issue: Page reloads but still shows login
**Solution:**
- Check if session was created:
```javascript
const session = PMTwinData.Sessions.getCurrentSession();
console.log('Session:', session);
```
- If no session, the login might have failed silently
- Try "Test Login" button to see detailed logs

## Expected Behavior

After successful login:
1. Page should reload
2. Login form should disappear
3. Admin dashboard should appear
4. Navigation bar should show admin menu items

## Still Not Working?

1. **Check Browser Console** (F12) for any red error messages
2. **Try "Debug" button** on login page
3. **Try "Test Login" button** - it shows detailed console output
4. **Clear browser cache** and try again
5. **Try a different browser** (Chrome, Firefox, Edge)

## Test Credentials

- **Email:** `admin@pmtwin.com`
- **Password:** `Admin123` (case-sensitive!)

---

**Note:** All passwords are case-sensitive. Make sure you type exactly: `Admin123`

