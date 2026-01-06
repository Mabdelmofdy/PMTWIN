/**
 * PMTwin Login Debug Helper
 * Run this in console to diagnose login issues
 */

(function() {
  'use strict';

  function debugAdminLogin() {
    console.log('=== Admin Login Debug ===\n');
    
    // 1. Check if PMTwinData is loaded
    if (typeof PMTwinData === 'undefined') {
      console.error('❌ PMTwinData not loaded!');
      return;
    }
    console.log('✅ PMTwinData loaded');
    
    // 2. Check if PMTwinAuth is loaded
    if (typeof PMTwinAuth === 'undefined') {
      console.error('❌ PMTwinAuth not loaded!');
      return;
    }
    console.log('✅ PMTwinAuth loaded');
    
    // 3. Check if admin account exists
    const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    if (!admin) {
      console.warn('⚠️ Admin account not found! Creating...');
      PMTwinData.forceCreateTestAccounts();
      const newAdmin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
      if (newAdmin) {
        console.log('✅ Admin account created');
      } else {
        console.error('❌ Failed to create admin account');
        return;
      }
    } else {
      console.log('✅ Admin account exists');
    }
    
    // 4. Check account details
    const user = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    console.log('\nAccount Details:');
    console.log('  Email:', user.email);
    console.log('  Role:', user.role);
    console.log('  Status:', user.profile?.status);
    console.log('  Password (encoded):', user.password);
    
    // 5. Test password decoding
    try {
      const decoded = atob(user.password);
      console.log('  Password (decoded):', decoded);
      console.log('  Expected: Admin123');
      console.log('  Match:', decoded === 'Admin123' ? '✅ YES' : '❌ NO');
      
      if (decoded !== 'Admin123') {
        console.warn('⚠️ Password mismatch! Fixing...');
        // Fix password
        PMTwinData.Users.update(user.id, {
          password: btoa('Admin123')
        });
        console.log('✅ Password fixed');
      }
    } catch (e) {
      console.error('❌ Password decode error:', e);
    }
    
    // 6. Test login
    console.log('\nTesting login...');
    const result = PMTwinAuth.login('admin@pmtwin.com', 'Admin123');
    console.log('Login result:', result);
    
    if (result.success) {
      console.log('✅ Login successful!');
      console.log('  User:', result.user.email);
      console.log('  Role:', result.user.role);
      console.log('  Session:', result.session ? 'Created' : 'Failed');
      
      // Check session
      const session = PMTwinData.Sessions.getCurrentSession();
      console.log('  Current session:', session);
      
      if (session) {
        console.log('\n✅ Everything works! You should be able to login now.');
        console.log('Try refreshing the page or clicking login again.');
      } else {
        console.error('❌ Session not created properly');
      }
    } else {
      console.error('❌ Login failed:', result.error);
    }
    
    return result;
  }

  // Auto-fix function
  function fixAdminLogin() {
    console.log('🔧 Fixing admin login...\n');
    
    // Force create accounts
    if (typeof PMTwinData !== 'undefined' && PMTwinData.forceCreateTestAccounts) {
      PMTwinData.forceCreateTestAccounts();
    }
    
    // Verify admin account
    const admin = PMTwinData.Users.getByEmail('admin@pmtwin.com');
    if (!admin) {
      console.error('❌ Failed to create admin account');
      return false;
    }
    
    // Ensure password is correct
    const decoded = atob(admin.password);
    if (decoded !== 'Admin123') {
      console.log('Fixing password...');
      PMTwinData.Users.update(admin.id, {
        password: btoa('Admin123'),
        profile: {
          ...admin.profile,
          status: 'approved'
        }
      });
    }
    
    // Ensure status is approved
    if (admin.profile?.status !== 'approved') {
      console.log('Fixing status...');
      PMTwinData.Users.update(admin.id, {
        profile: {
          ...admin.profile,
          status: 'approved',
          approvedAt: new Date().toISOString()
        }
      });
    }
    
    console.log('✅ Admin account fixed!');
    console.log('Try logging in with: admin@pmtwin.com / Admin123');
    
    return true;
  }

  // Export to window
  window.debugAdminLogin = debugAdminLogin;
  window.fixAdminLogin = fixAdminLogin;
  
  console.log('🔧 Debug helpers loaded!');
  console.log('Run debugAdminLogin() to diagnose login issues');
  console.log('Run fixAdminLogin() to automatically fix admin account');

})();

