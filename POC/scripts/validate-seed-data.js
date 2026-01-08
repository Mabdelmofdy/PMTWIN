#!/usr/bin/env node

/**
 * PMTwin Seed Data Validation Script (Node.js)
 * Validates golden seed data constraints from localStorage dump or JSON export
 * 
 * Usage:
 *   node scripts/validate-seed-data.js [path-to-data.json]
 * 
 * If no path provided, expects localStorage dump in current directory
 */

const fs = require('fs');
const path = require('path');

// ============================================
// Load Data
// ============================================
function loadData(dataPath) {
  let data;

  if (dataPath) {
    // Load from provided JSON file
    if (!fs.existsSync(dataPath)) {
      console.error(`❌ Data file not found: ${dataPath}`);
      process.exit(1);
    }
    data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  } else {
    // Try to find localStorage dump
    const possiblePaths = [
      'localStorage-dump.json',
      'data-export.json',
      path.join(__dirname, '../localStorage-dump.json')
    ];

    let found = false;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        data = JSON.parse(fs.readFileSync(p, 'utf8'));
        found = true;
        console.log(`📦 Loaded data from: ${p}`);
        break;
      }
    }

    if (!found) {
      console.error('❌ No data file found. Provide path to JSON export or localStorage dump.');
      console.log('   Usage: node scripts/validate-seed-data.js [path-to-data.json]');
      process.exit(1);
    }
  }

  // Normalize data structure (handle different export formats)
  const normalized = {
    users: data.users || data.pmtwin_users || [],
    contracts: data.contracts || data.pmtwin_contracts || [],
    engagements: data.engagements || data.pmtwin_engagements || [],
    projects: data.projects || data.pmtwin_projects || [],
    proposals: data.proposals || data.pmtwin_proposals || [],
    serviceRequests: data.serviceRequests || data.pmtwin_service_requests || []
  };

  return normalized;
}

// ============================================
// Validation Functions
// ============================================
function validateSeedData(data) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    checks: {}
  };

  console.log('🔍 Validating Golden Seed Data...\n');

  // Check 1: No sub-contractor contracted by beneficiary
  const check1 = validateNoSubContractorWithBeneficiary(data);
  results.checks.check1 = check1;
  if (!check1.valid) {
    results.valid = false;
    results.errors.push(check1.message);
  }

  // Check 2: Every engagement references a signed/active contract
  const check2 = validateEngagementContracts(data);
  results.checks.check2 = check2;
  if (!check2.valid) {
    results.valid = false;
    results.errors.push(check2.message);
  }

  // Check 3: MegaProject has >= 3 contract types
  const check3 = validateMegaProjectContracts(data);
  results.checks.check3 = check3;
  if (!check3.valid) {
    results.valid = false;
    results.errors.push(check3.message);
  }

  // Check 4: All roles exist and are referenced
  const check4 = validateAllRolesUsed(data);
  results.checks.check4 = check4;
  if (!check4.valid) {
    results.warnings.push(check4.message);
  }

  // Check 5: SubContracts have valid parentContractId
  const check5 = validateSubContractParents(data);
  results.checks.check5 = check5;
  if (!check5.valid) {
    results.valid = false;
    results.errors.push(check5.message);
  }

  // Check 6: ServiceProviders have no project bidding
  const check6 = validateServiceProviderNoBidding(data);
  results.checks.check6 = check6;
  if (!check6.valid) {
    results.valid = false;
    results.errors.push(check6.message);
  }

  // Check 7: All contracts have proper party types
  const check7 = validateContractPartyTypes(data);
  results.checks.check7 = check7;
  if (!check7.valid) {
    results.valid = false;
    results.errors.push(check7.message);
  }

  // Check 8: SubContracts have correct parties
  const check8 = validateSubContractParties(data);
  results.checks.check8 = check8;
  if (!check8.valid) {
    results.valid = false;
    results.errors.push(check8.message);
  }

  return results;
}

function validateNoSubContractorWithBeneficiary(data) {
  const { users, contracts } = data;

  const beneficiaries = users.filter(u => 
    ['beneficiary', 'project_lead', 'entity'].includes(u.role) || 
    u.userType === 'beneficiary'
  ).map(u => u.id);

  const violations = contracts.filter(c => 
    c.providerPartyType === 'SUB_CONTRACTOR' &&
    beneficiaries.includes(c.buyerPartyId)
  );

  return {
    name: 'No SubContractor with Beneficiary',
    valid: violations.length === 0,
    message: violations.length === 0 
      ? '✅ No sub-contractors contracted directly by beneficiaries'
      : `❌ Found ${violations.length} sub-contract(s) where beneficiary is buyer`,
    violations: violations.map(v => v.id)
  };
}

function validateEngagementContracts(data) {
  const { contracts, engagements } = data;

  const contractMap = new Map(contracts.map(c => [c.id, c]));
  const validStatuses = ['SIGNED', 'ACTIVE'];

  const violations = engagements.filter(e => {
    const contract = contractMap.get(e.contractId);
    return !contract || !validStatuses.includes(contract.status);
  });

  return {
    name: 'Engagements have valid contracts',
    valid: violations.length === 0,
    message: violations.length === 0
      ? '✅ All engagements reference signed/active contracts'
      : `❌ Found ${violations.length} engagement(s) with invalid contracts`,
    violations: violations.map(v => v.id)
  };
}

function validateMegaProjectContracts(data) {
  const { contracts, projects } = data;

  const megaProject = projects.find(p => p.projectType === 'mega' || p.id === 'megaproject_neom_001');
  if (!megaProject) {
    return {
      name: 'MegaProject contracts',
      valid: false,
      message: '❌ MegaProject not found',
      violations: []
    };
  }

  const megaContracts = contracts.filter(c => 
    c.scopeType === 'MEGA_PROJECT' && c.scopeId === megaProject.id
  );

  const contractTypes = new Set(megaContracts.map(c => c.contractType));
  const hasVendor = megaContracts.some(c => 
    ['MEGA_PROJECT_CONTRACT', 'PROJECT_CONTRACT'].includes(c.contractType)
  );
  const hasService = megaContracts.some(c => c.contractType === 'SERVICE_CONTRACT');
  const hasAdvisory = megaContracts.some(c => c.contractType === 'ADVISORY_CONTRACT');

  const valid = contractTypes.size >= 3 && hasVendor && hasService && hasAdvisory;

  return {
    name: 'MegaProject has multiple contract types',
    valid: valid,
    message: valid
      ? `✅ MegaProject has ${contractTypes.size} contract types (vendor, service, advisory)`
      : `❌ MegaProject should have vendor + service + advisory contracts (found: ${Array.from(contractTypes).join(', ')})`,
    contractTypes: Array.from(contractTypes),
    hasVendor,
    hasService,
    hasAdvisory
  };
}

function validateAllRolesUsed(data) {
  const { users, contracts, serviceRequests } = data;

  const requiredRoles = [
    { role: 'beneficiary', userType: 'beneficiary', name: 'Beneficiary' },
    { role: 'vendor', userType: 'vendor_corporate', name: 'Vendor' },
    { role: 'sub_contractor', userType: 'sub_contractor', name: 'SubContractor' },
    { role: 'skill_service_provider', userType: 'service_provider', name: 'ServiceProvider' },
    { role: 'consultant', userType: 'consultant', name: 'Consultant' }
  ];

  const unusedRoles = [];

  requiredRoles.forEach(required => {
    const exists = users.some(u => 
      u.role === required.role || u.userType === required.userType
    );

    if (!exists) {
      unusedRoles.push(required.name);
    } else {
      const userIds = users
        .filter(u => u.role === required.role || u.userType === required.userType)
        .map(u => u.id);

      const usedInContracts = contracts.some(c => 
        userIds.includes(c.buyerPartyId) || userIds.includes(c.providerPartyId)
      );
      const usedInRequests = serviceRequests.some(sr => 
        userIds.includes(sr.requesterId)
      );

      if (!usedInContracts && !usedInRequests) {
        unusedRoles.push(required.name + ' (not used in workflow)');
      }
    }
  });

  return {
    name: 'All roles exist and used',
    valid: unusedRoles.length === 0,
    message: unusedRoles.length === 0
      ? '✅ All required roles exist and are used in workflow'
      : `⚠️  Some roles missing or unused: ${unusedRoles.join(', ')}`,
    unusedRoles
  };
}

function validateSubContractParents(data) {
  const { contracts } = data;

  const subContracts = contracts.filter(c => c.contractType === 'SUB_CONTRACT');
  const contractMap = new Map(contracts.map(c => [c.id, c]));

  const violations = subContracts.filter(sc => {
    if (!sc.parentContractId) {
      return true;
    }
    const parent = contractMap.get(sc.parentContractId);
    if (!parent) {
      return true;
    }
    return !['PROJECT_CONTRACT', 'MEGA_PROJECT_CONTRACT'].includes(parent.contractType);
  });

  return {
    name: 'SubContracts have valid parents',
    valid: violations.length === 0,
    message: violations.length === 0
      ? '✅ All sub-contracts have valid parent contracts'
      : `❌ Found ${violations.length} sub-contract(s) with invalid parent`,
    violations: violations.map(v => v.id)
  };
}

function validateServiceProviderNoBidding(data) {
  const { users, proposals } = data;

  const serviceProviders = users.filter(u => 
    u.role === 'skill_service_provider' || u.userType === 'service_provider'
  ).map(u => u.id);

  const violations = proposals.filter(p => 
    serviceProviders.includes(p.userId) && 
    (p.projectId || p.megaProjectId)
  );

  return {
    name: 'ServiceProviders do not bid on projects',
    valid: violations.length === 0,
    message: violations.length === 0
      ? '✅ No service providers have project bidding records'
      : `❌ Found ${violations.length} service provider(s) with project proposals`,
    violations: violations.map(v => v.id)
  };
}

function validateContractPartyTypes(data) {
  const { contracts } = data;

  const validBuyerTypes = ['BENEFICIARY', 'VENDOR_CORPORATE', 'VENDOR_INDIVIDUAL'];
  const validProviderTypes = ['VENDOR_CORPORATE', 'VENDOR_INDIVIDUAL', 'SERVICE_PROVIDER', 'CONSULTANT', 'SUB_CONTRACTOR'];

  const violations = contracts.filter(c => 
    !validBuyerTypes.includes(c.buyerPartyType) || 
    !validProviderTypes.includes(c.providerPartyType)
  );

  return {
    name: 'Contracts have valid party types',
    valid: violations.length === 0,
    message: violations.length === 0
      ? '✅ All contracts have valid buyer/provider party types'
      : `❌ Found ${violations.length} contract(s) with invalid party types`,
    violations: violations.map(v => v.id)
  };
}

function validateSubContractParties(data) {
  const { contracts } = data;

  const subContracts = contracts.filter(c => c.contractType === 'SUB_CONTRACT');

  const violations = subContracts.filter(sc => {
    const buyerValid = ['VENDOR_CORPORATE', 'VENDOR_INDIVIDUAL'].includes(sc.buyerPartyType);
    const providerValid = sc.providerPartyType === 'SUB_CONTRACTOR';
    return !buyerValid || !providerValid;
  });

  return {
    name: 'SubContracts have correct parties',
    valid: violations.length === 0,
    message: violations.length === 0
      ? '✅ All sub-contracts have Vendor as buyer and SubContractor as provider'
      : `❌ Found ${violations.length} sub-contract(s) with incorrect parties`,
    violations: violations.map(v => v.id)
  };
}

// ============================================
// Main
// ============================================
function main() {
  const dataPath = process.argv[2];
  const data = loadData(dataPath);
  
  const results = validateSeedData(data);

  // Print results
  console.log('\n📊 Validation Results:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Overall Status: ${results.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log(`Errors: ${results.errors.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (results.errors.length > 0) {
    console.log('❌ ERRORS:');
    results.errors.forEach((error, i) => {
      console.log(`  ${i + 1}. ${error}`);
    });
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    results.warnings.forEach((warning, i) => {
      console.log(`  ${i + 1}. ${warning}`);
    });
    console.log('');
  }

  console.log('📋 Detailed Check Results:');
  Object.keys(results.checks).forEach(key => {
    const check = results.checks[key];
    console.log(`  ${check.valid ? '✅' : '❌'} ${check.name}: ${check.message}`);
  });

  // Output JSON report
  const reportPath = path.join(__dirname, '../validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 JSON report saved to: ${reportPath}`);

  // Exit with appropriate code
  process.exit(results.valid ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = {
  validateSeedData,
  loadData
};

