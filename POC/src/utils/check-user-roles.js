/**
 * PMTwin User Role Alignment Checker
 * Validates all users have correct roles aligned with golden seed dataset
 * 
 * Usage: Copy and paste into browser console, or call:
 *   PMTwinCheckUserRoles.checkAll()
 */

(function() {
  'use strict';

  // Expected role mappings from golden seed dataset
  const EXPECTED_ROLES = {
    'admin@pmtwin.com': { role: 'admin', userType: 'admin', name: 'Platform Administrator' },
    'beneficiary@pmtwin.com': { role: 'beneficiary', userType: 'beneficiary', name: 'NEOM Development Authority' },
    'entity2@pmtwin.com': { role: 'project_lead', userType: 'beneficiary', name: 'Saudi Real Estate Company' },
    'vendor.alpha@pmtwin.com': { role: 'vendor', userType: 'vendor_corporate', name: 'Alpha Construction Group' },
    'vendor.beta@pmtwin.com': { role: 'vendor', userType: 'vendor_corporate', name: 'Beta Infrastructure Ltd' },
    'bim@pmtwin.com': { role: 'skill_service_provider', userType: 'service_provider', name: 'BIM Solutions Co' },
    'qa@pmtwin.com': { role: 'skill_service_provider', userType: 'service_provider', name: 'Quality Assurance Services' },
    'scheduler@pmtwin.com': { role: 'skill_service_provider', userType: 'service_provider', name: 'Project Planning Experts' },
    'consultant@pmtwin.com': { role: 'consultant', userType: 'consultant', name: 'Green Building Consultants' },
    'mep.sub@pmtwin.com': { role: 'sub_contractor', userType: 'sub_contractor', name: 'MEP Specialists LLC' },
    'steel.sub@pmtwin.com': { role: 'sub_contractor', userType: 'sub_contractor', name: 'Steel Fabrication Co' }
  };

  // Role to UserType mapping (from data.js)
  const ROLE_TO_USERTYPE_MAP = {
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
  };

  // ============================================
  // Check All Users
  // ============================================
  function checkAllUsers() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return { valid: false, error: 'PMTwinData not available' };
    }

    const users = PMTwinData.Users.getAll();
    const results = {
      totalUsers: users.length,
      goldenSeedUsers: [],
      otherUsers: [],
      misaligned: [],
      missing: [],
      valid: true,
      summary: {}
    };

    console.log('🔍 Checking User Role Alignment...\n');
    console.log(`Total users in system: ${users.length}\n`);

    // Check each expected golden seed user
    Object.keys(EXPECTED_ROLES).forEach(email => {
      const expected = EXPECTED_ROLES[email];
      const user = users.find(u => u.email === email);

      if (!user) {
        results.missing.push({
          email,
          expected: expected,
          status: 'MISSING'
        });
        results.valid = false;
      } else {
        const actualRole = user.role;
        const actualUserType = user.userType || PMTwinData.mapRoleToUserType?.(user.role);
        const expectedUserType = expected.userType;

        const roleMatches = actualRole === expected.role;
        const userTypeMatches = actualUserType === expectedUserType;

        const userCheck = {
          email,
          name: user.profile?.name || user.name || 'N/A',
          expectedRole: expected.role,
          actualRole: actualRole,
          expectedUserType: expectedUserType,
          actualUserType: actualUserType,
          roleMatches,
          userTypeMatches,
          status: roleMatches && userTypeMatches ? '✅ ALIGNED' : '❌ MISALIGNED'
        };

        if (roleMatches && userTypeMatches) {
          results.goldenSeedUsers.push(userCheck);
        } else {
          results.misaligned.push(userCheck);
          results.valid = false;
        }
      }
    });

    // Check other users (not in golden seed)
    users.forEach(user => {
      if (!EXPECTED_ROLES[user.email]) {
        const userType = user.userType || PMTwinData.mapRoleToUserType?.(user.role);
        const expectedUserType = ROLE_TO_USERTYPE_MAP[user.role] || 'unknown';

        results.otherUsers.push({
          email: user.email,
          name: user.profile?.name || user.name || 'N/A',
          role: user.role,
          userType: userType,
          expectedUserType: expectedUserType,
          userTypeMatches: userType === expectedUserType,
          status: userType === expectedUserType ? '✅ ALIGNED' : '⚠️ CHECK'
        });
      }
    });

    // Generate summary
    results.summary = {
      goldenSeedTotal: Object.keys(EXPECTED_ROLES).length,
      goldenSeedFound: results.goldenSeedUsers.length,
      goldenSeedMissing: results.missing.length,
      goldenSeedMisaligned: results.misaligned.length,
      otherUsers: results.otherUsers.length,
      otherUsersAligned: results.otherUsers.filter(u => u.userTypeMatches).length,
      otherUsersCheck: results.otherUsers.filter(u => !u.userTypeMatches).length
    };

    // Print results
    printResults(results);

    return results;
  }

  // ============================================
  // Print Results
  // ============================================
  function printResults(results) {
    console.log('\n📊 User Role Alignment Results:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Overall Status: ${results.valid ? '✅ ALL ALIGNED' : '❌ ISSUES FOUND'}`);
    console.log(`Total Users: ${results.totalUsers}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Summary
    console.log('📋 Summary:');
    console.log(`  Golden Seed Users: ${results.summary.goldenSeedFound}/${results.summary.goldenSeedTotal} found and aligned`);
    if (results.summary.goldenSeedMissing > 0) {
      console.log(`  ⚠️  Missing: ${results.summary.goldenSeedMissing}`);
    }
    if (results.summary.goldenSeedMisaligned > 0) {
      console.log(`  ❌ Misaligned: ${results.summary.goldenSeedMisaligned}`);
    }
    console.log(`  Other Users: ${results.summary.otherUsers} (${results.summary.otherUsersAligned} aligned, ${results.summary.otherUsersCheck} need check)`);
    console.log('');

    // Golden Seed Users
    if (results.goldenSeedUsers.length > 0) {
      console.log('✅ Golden Seed Users (Aligned):');
      results.goldenSeedUsers.forEach(user => {
        console.log(`  ${user.status} ${user.name} (${user.email})`);
        console.log(`     Role: ${user.actualRole} | UserType: ${user.actualUserType}`);
      });
      console.log('');
    }

    // Missing Users
    if (results.missing.length > 0) {
      console.log('❌ Missing Golden Seed Users:');
      results.missing.forEach(user => {
        console.log(`  ${user.email} - Expected: ${user.expected.role} / ${user.expected.userType}`);
      });
      console.log('');
    }

    // Misaligned Users
    if (results.misaligned.length > 0) {
      console.log('❌ Misaligned Golden Seed Users:');
      results.misaligned.forEach(user => {
        console.log(`  ${user.name} (${user.email})`);
        console.log(`     Expected: Role=${user.expectedRole}, UserType=${user.expectedUserType}`);
        console.log(`     Actual:   Role=${user.actualRole}, UserType=${user.actualUserType}`);
        if (!user.roleMatches) {
          console.log(`     ⚠️  Role mismatch: expected "${user.expectedRole}" but got "${user.actualRole}"`);
        }
        if (!user.userTypeMatches) {
          console.log(`     ⚠️  UserType mismatch: expected "${user.expectedUserType}" but got "${user.actualUserType}"`);
        }
      });
      console.log('');
    }

    // Other Users
    if (results.otherUsers.length > 0) {
      console.log('📋 Other Users (Not in Golden Seed):');
      const aligned = results.otherUsers.filter(u => u.userTypeMatches);
      const check = results.otherUsers.filter(u => !u.userTypeMatches);

      if (aligned.length > 0) {
        console.log('  ✅ Aligned:');
        aligned.forEach(user => {
          console.log(`     ${user.name} (${user.email}) - Role: ${user.role}, UserType: ${user.userType}`);
        });
      }

      if (check.length > 0) {
        console.log('  ⚠️  Need Check:');
        check.forEach(user => {
          console.log(`     ${user.name} (${user.email})`);
          console.log(`        Role: ${user.role}`);
          console.log(`        UserType: ${user.userType} (expected: ${user.expectedUserType})`);
        });
      }
      console.log('');
    }

    // Detailed Table
    console.log('📊 Detailed User List:');
    console.table(results.goldenSeedUsers.concat(results.misaligned).concat(results.otherUsers).map(u => ({
      Email: u.email,
      Name: u.name,
      Role: u.actualRole || u.role,
      UserType: u.actualUserType || u.userType,
      Status: u.status
    })));
  }

  // ============================================
  // Fix Misaligned Users
  // ============================================
  function fixMisalignedUsers() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return { success: false, error: 'PMTwinData not available' };
    }

    const users = PMTwinData.Users.getAll();
    const fixed = [];
    const errors = [];

    console.log('🔧 Fixing Misaligned Users...\n');

    Object.keys(EXPECTED_ROLES).forEach(email => {
      const expected = EXPECTED_ROLES[email];
      const user = users.find(u => u.email === email);

      if (!user) {
        console.warn(`⚠️  User not found: ${email}`);
        return;
      }

      const needsFix = user.role !== expected.role || user.userType !== expected.userType;

      if (needsFix) {
        try {
          const updates = {};
          if (user.role !== expected.role) {
            updates.role = expected.role;
          }
          if (user.userType !== expected.userType) {
            updates.userType = expected.userType;
          }

          const updated = PMTwinData.Users.update(user.id, updates);
          if (updated) {
            fixed.push({
              email,
              name: user.profile?.name || user.name,
              changes: updates
            });
            console.log(`✅ Fixed: ${email} - Updated: ${JSON.stringify(updates)}`);
          } else {
            errors.push({ email, error: 'Update failed' });
            console.error(`❌ Failed to fix: ${email}`);
          }
        } catch (error) {
          errors.push({ email, error: error.message });
          console.error(`❌ Error fixing ${email}:`, error);
        }
      }
    });

    console.log(`\n✅ Fixed ${fixed.length} user(s)`);
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} error(s) occurred`);
    }

    return { success: true, fixed, errors };
  }

  // ============================================
  // Quick Check (Simple Table View)
  // ============================================
  function quickCheck() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return;
    }

    const users = PMTwinData.Users.getAll();
    console.log(`\n📊 Quick User Role Check (${users.length} users)\n`);

    const tableData = users.map(user => {
      const expected = EXPECTED_ROLES[user.email];
      const userType = user.userType || PMTwinData.mapRoleToUserType?.(user.role) || 'N/A';
      const expectedUserType = expected ? expected.userType : (ROLE_TO_USERTYPE_MAP[user.role] || 'N/A');
      const isAligned = expected ? 
        (user.role === expected.role && userType === expected.userType) :
        (userType === expectedUserType);

      return {
        Email: user.email,
        Name: user.profile?.name || user.name || 'N/A',
        Role: user.role,
        UserType: userType,
        Expected: expected ? `${expected.role}/${expected.userType}` : `${user.role}/${expectedUserType}`,
        Status: isAligned ? '✅' : '❌',
        Type: expected ? 'Golden Seed' : 'Other'
      };
    });

    console.table(tableData);

    // Summary
    const goldenSeed = users.filter(u => EXPECTED_ROLES[u.email]);
    const aligned = tableData.filter(u => u.Status === '✅').length;
    const misaligned = tableData.filter(u => u.Status === '❌').length;

    console.log(`\n📋 Summary:`);
    console.log(`  Total Users: ${users.length}`);
    console.log(`  Golden Seed Users: ${goldenSeed.length}/${Object.keys(EXPECTED_ROLES).length}`);
    console.log(`  ✅ Aligned: ${aligned}`);
    console.log(`  ❌ Misaligned: ${misaligned}`);

    return tableData;
  }

  // ============================================
  // Export
  // ============================================
  if (typeof window !== 'undefined') {
    window.PMTwinCheckUserRoles = {
      checkAll: checkAllUsers,
      quickCheck: quickCheck,
      fixMisaligned: fixMisalignedUsers,
      EXPECTED_ROLES,
      ROLE_TO_USERTYPE_MAP
    };

    // Auto-run quick check if in console
    if (window.console && typeof window.console.table === 'function') {
      console.log('💡 Tip: Run PMTwinCheckUserRoles.quickCheck() for a quick table view');
      console.log('💡 Tip: Run PMTwinCheckUserRoles.checkAll() for detailed analysis');
    }
  }

})();

