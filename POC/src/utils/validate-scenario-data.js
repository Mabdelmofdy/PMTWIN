/**
 * PMTwin Scenario Seed Data Validation Script
 * Validates all 5 scenarios against business constraints
 * 
 * Usage: Copy and paste this entire file into browser console, or call:
 *   PMTwinValidateScenarioData.validate()
 */

(function() {
  'use strict';

  // ============================================
  // Main Validation Function
  // ============================================
  function validateScenarioData() {
    if (typeof PMTwinData === 'undefined') {
      console.error('PMTwinData not available');
      return { valid: false, error: 'PMTwinData not available' };
    }

    const results = {
      valid: true,
      errors: [],
      warnings: [],
      checks: {}
    };

    console.log('🔍 Validating Scenario Seed Data for 5 scenarios...\n');

    // Check 1: No direct sub-contractor contracts with beneficiary
    const check1 = validateNoSubContractorWithBeneficiary();
    results.checks.check1 = check1;
    if (!check1.valid) {
      results.valid = false;
      results.errors.push(check1.message);
    }

    // Check 2: Every engagement references a signed/active contract
    const check2 = validateEngagementContracts();
    results.checks.check2 = check2;
    if (!check2.valid) {
      results.valid = false;
      results.errors.push(check2.message);
    }

    // Check 3: Mega projects have multiple parallel contracts
    const check3 = validateMegaProjectContracts();
    results.checks.check3 = check3;
    if (!check3.valid) {
      results.valid = false;
      results.errors.push(check3.message);
    }

    // Check 4: SubContracts have valid parent
    const check4 = validateSubContractParents();
    results.checks.check4 = check4;
    if (!check4.valid) {
      results.valid = false;
      results.errors.push(check4.message);
    }

    // Check 5: Service Providers don't bid on projects
    const check5 = validateServiceProviderNoBidding();
    results.checks.check5 = check5;
    if (!check5.valid) {
      results.valid = false;
      results.errors.push(check5.message);
    }

    // Check 6: Contract party types are valid
    const check6 = validateContractPartyTypes();
    results.checks.check6 = check6;
    if (!check6.valid) {
      results.valid = false;
      results.errors.push(check6.message);
    }

    // Check 7: Scenario-specific validations
    const check7 = validateScenarioSpecifics();
    results.checks.check7 = check7;
    if (!check7.valid) {
      results.valid = false;
      results.errors.push(check7.message);
    }

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

    return results;
  }

  // ============================================
  // Check 1: No sub-contractor contracted by beneficiary
  // ============================================
  function validateNoSubContractorWithBeneficiary() {
    const contracts = PMTwinData.Contracts.getAll();
    const users = PMTwinData.Users.getAll();

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
        ? '✅ No sub-contractors have direct contracts with beneficiaries'
        : `❌ Found ${violations.length} sub-contractor(s) with direct beneficiary contracts (violations: ${violations.map(v => v.id).join(', ')})`,
      violations: violations
    };
  }

  // ============================================
  // Check 2: Every engagement references a signed/active contract
  // ============================================
  function validateEngagementContracts() {
    const engagements = PMTwinData.Engagements.getAll();
    const contracts = PMTwinData.Contracts.getAll();

    const contractMap = new Map(contracts.map(c => [c.id, c]));

    const violations = engagements.filter(e => {
      if (!e.contractId) {
        return true; // Missing contractId
      }
      const contract = contractMap.get(e.contractId);
      if (!contract) {
        return true; // Contract not found
      }
      // Contract must be SIGNED or ACTIVE
      return !['SIGNED', 'ACTIVE'].includes(contract.status);
    });

    return {
      name: 'Engagements require signed contract',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ All engagements reference signed/active contracts'
        : `❌ Found ${violations.length} engagement(s) without signed/active contracts (violations: ${violations.map(v => v.id).join(', ')})`,
      violations: violations
    };
  }

  // ============================================
  // Check 3: Mega projects have multiple parallel contracts
  // ============================================
  function validateMegaProjectContracts() {
    const contracts = PMTwinData.Contracts.getAll();
    const projects = PMTwinData.Projects.getAll();

    const megaProjects = projects.filter(p => p.projectType === 'mega');
    const violations = [];

    megaProjects.forEach(mp => {
      const projectContracts = contracts.filter(c => 
        c.scopeType === 'MEGA_PROJECT' && c.scopeId === mp.id
      );

      // Count distinct contract types
      const contractTypes = new Set(projectContracts.map(c => c.contractType));
      
      // Mega projects should have at least 3 different contract types (vendor + service + advisory minimum)
      const hasVendor = contractTypes.has('MEGA_PROJECT_CONTRACT');
      const hasService = contractTypes.has('SERVICE_CONTRACT');
      const hasAdvisory = contractTypes.has('ADVISORY_CONTRACT');

      if (!hasVendor || !hasService || !hasAdvisory || contractTypes.size < 3) {
        violations.push({
          projectId: mp.id,
          projectTitle: mp.title,
          contractTypes: Array.from(contractTypes),
          contracts: projectContracts.length,
          missing: {
            vendor: !hasVendor,
            service: !hasService,
            advisory: !hasAdvisory
          }
        });
      }
    });

    return {
      name: 'Mega projects have multiple parallel contracts',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ All mega projects have multiple parallel contracts (vendor + service + advisory)'
        : `❌ Found ${violations.length} mega project(s) without required contract types: ${violations.map(v => `${v.projectTitle} (${v.contractTypes.join(', ')})`).join('; ')}`,
      violations: violations
    };
  }

  // ============================================
  // Check 4: SubContracts have valid parentContractId
  // ============================================
  function validateSubContractParents() {
    const contracts = PMTwinData.Contracts.getAll();
    const users = PMTwinData.Users.getAll();

    const subContracts = contracts.filter(c => c.contractType === 'SUB_CONTRACT');
    const contractMap = new Map(contracts.map(c => [c.id, c]));

    const vendors = users.filter(u => 
      u.role === 'vendor' || u.userType === 'vendor_corporate' || u.userType === 'vendor_individual'
    ).map(u => u.id);

    const violations = subContracts.filter(sc => {
      if (!sc.parentContractId) {
        return true; // Missing parentContractId
      }
      const parent = contractMap.get(sc.parentContractId);
      if (!parent) {
        return true; // Parent contract not found
      }
      // Parent must be PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT
      if (!['PROJECT_CONTRACT', 'MEGA_PROJECT_CONTRACT'].includes(parent.contractType)) {
        return true;
      }
      // Parent contract buyer must be a vendor
      if (!vendors.includes(parent.buyerPartyId)) {
        return true;
      }
      // SubContract buyer must be the same as parent buyer (vendor)
      if (sc.buyerPartyId !== parent.buyerPartyId) {
        return true;
      }
      return false;
    });

    return {
      name: 'SubContracts have valid parents',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ All sub-contracts have valid parent contracts'
        : `❌ Found ${violations.length} sub-contract(s) with invalid parent (violations: ${violations.map(v => v.id).join(', ')})`,
      violations: violations
    };
  }

  // ============================================
  // Check 5: Service Providers don't bid on projects
  // ============================================
  function validateServiceProviderNoBidding() {
    const users = PMTwinData.Users.getAll();
    const proposals = PMTwinData.Proposals.getAll();

    const serviceProviders = users.filter(u => 
      u.role === 'skill_service_provider' || u.userType === 'service_provider'
    ).map(u => u.id);

    const violations = proposals.filter(p => 
      serviceProviders.includes(p.userId) && 
      (p.projectId || p.megaProjectId) // Proposal on a project
    );

    return {
      name: 'ServiceProviders do not bid on projects',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ No service providers have project bidding records'
        : `❌ Found ${violations.length} service provider(s) with project proposals (violations: ${violations.map(v => v.id).join(', ')})`,
      violations: violations
    };
  }

  // ============================================
  // Check 6: Contract party types are valid
  // ============================================
  function validateContractPartyTypes() {
    const contracts = PMTwinData.Contracts.getAll();

    const violations = contracts.filter(c => {
      // SUB_CONTRACT: buyer must be VENDOR, provider must be SUB_CONTRACTOR
      if (c.contractType === 'SUB_CONTRACT') {
        if (c.buyerPartyType !== 'VENDOR_CORPORATE' && c.buyerPartyType !== 'VENDOR_INDIVIDUAL') {
          return true;
        }
        if (c.providerPartyType !== 'SUB_CONTRACTOR') {
          return true;
        }
      }
      
      // SERVICE_CONTRACT: provider must be SERVICE_PROVIDER
      if (c.contractType === 'SERVICE_CONTRACT') {
        if (c.providerPartyType !== 'SERVICE_PROVIDER') {
          return true;
        }
      }

      // ADVISORY_CONTRACT: provider must be CONSULTANT
      if (c.contractType === 'ADVISORY_CONTRACT') {
        if (c.providerPartyType !== 'CONSULTANT') {
          return true;
        }
      }

      // PROJECT_CONTRACT / MEGA_PROJECT_CONTRACT: provider must be VENDOR
      if (c.contractType === 'PROJECT_CONTRACT' || c.contractType === 'MEGA_PROJECT_CONTRACT') {
        if (c.providerPartyType !== 'VENDOR_CORPORATE' && c.providerPartyType !== 'VENDOR_INDIVIDUAL') {
          return true;
        }
        if (c.buyerPartyType !== 'BENEFICIARY') {
          return true;
        }
      }

      return false;
    });

    return {
      name: 'Contract party types are valid',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ All contracts have valid party types'
        : `❌ Found ${violations.length} contract(s) with invalid party types (violations: ${violations.map(v => `${v.id} (${v.contractType})`).join(', ')})`,
      violations: violations
    };
  }

  // ============================================
  // Check 7: Scenario-specific validations
  // ============================================
  function validateScenarioSpecifics() {
    const contracts = PMTwinData.Contracts.getAll();
    const projects = PMTwinData.Projects.getAll();
    const violations = [];
    const warnings = [];

    // Scenario 1: NEOM Logistics Hub - should have vendor+2 services+advisory+2 subcontracts
    const s1_megaproject = projects.find(p => p.id === 'megaproject_s1_logistics');
    if (s1_megaproject) {
      const s1_contracts = contracts.filter(c => 
        (c.scopeType === 'MEGA_PROJECT' && c.scopeId === s1_megaproject.id) ||
        (c.scopeType === 'SERVICE_REQUEST' && contracts.find(c2 => c2.scopeType === 'MEGA_PROJECT' && c2.scopeId === s1_megaproject.id))
      );
      const s1_vendor = s1_contracts.filter(c => c.contractType === 'MEGA_PROJECT_CONTRACT').length;
      const s1_services = s1_contracts.filter(c => c.contractType === 'SERVICE_CONTRACT').length;
      const s1_advisory = s1_contracts.filter(c => c.contractType === 'ADVISORY_CONTRACT').length;
      const s1_subs = s1_contracts.filter(c => c.contractType === 'SUB_CONTRACT').length;

      if (s1_vendor !== 1 || s1_services !== 2 || s1_advisory !== 1 || s1_subs !== 2) {
        violations.push({
          scenario: 'Scenario 1: NEOM Logistics Hub',
          expected: 'vendor(1)+services(2)+advisory(1)+subcontracts(2)',
          actual: `vendor(${s1_vendor})+services(${s1_services})+advisory(${s1_advisory})+subcontracts(${s1_subs})`
        });
      }
    } else {
      warnings.push('Scenario 1 mega project not found');
    }

    // Scenario 2: Residential Tower - should have vendor+planning service+finishing subcontract
    const s2_project = projects.find(p => p.id === 'project_s2_residential');
    if (s2_project) {
      const s2_contracts = contracts.filter(c => 
        (c.scopeType === 'PROJECT' && c.scopeId === s2_project.id) ||
        (c.scopeType === 'SERVICE_REQUEST' && contracts.find(c2 => c2.scopeType === 'PROJECT' && c2.scopeId === s2_project.id))
      );
      const s2_vendor = s2_contracts.filter(c => c.contractType === 'PROJECT_CONTRACT').length;
      const s2_services = s2_contracts.filter(c => c.contractType === 'SERVICE_CONTRACT').length;
      const s2_subs = s2_contracts.filter(c => c.contractType === 'SUB_CONTRACT').length;

      if (s2_vendor !== 1 || s2_services !== 1 || s2_subs !== 1) {
        violations.push({
          scenario: 'Scenario 2: Residential Tower',
          expected: 'vendor(1)+service(1)+subcontract(1)',
          actual: `vendor(${s2_vendor})+service(${s2_services})+subcontract(${s2_subs})`
        });
      }
    } else {
      warnings.push('Scenario 2 project not found');
    }

    // Scenario 3: Hospital Expansion - should have advisory legal+service cost(+optional vendor)
    const s3_project = projects.find(p => p.id === 'project_s3_hospital');
    if (s3_project) {
      const s3_contracts = contracts.filter(c => 
        (c.scopeType === 'PROJECT' && c.scopeId === s3_project.id) ||
        (c.scopeType === 'SERVICE_REQUEST' && contracts.find(c2 => c2.scopeType === 'PROJECT' && c2.scopeId === s3_project.id))
      );
      const s3_advisory = s3_contracts.filter(c => c.contractType === 'ADVISORY_CONTRACT').length;
      const s3_services = s3_contracts.filter(c => c.contractType === 'SERVICE_CONTRACT').length;
      const s3_vendor = s3_contracts.filter(c => c.contractType === 'PROJECT_CONTRACT').length;

      if (s3_advisory !== 1 || s3_services !== 1 || s3_vendor < 0 || s3_vendor > 1) {
        violations.push({
          scenario: 'Scenario 3: Hospital Expansion',
          expected: 'advisory(1)+service(1)+vendor(0-1)',
          actual: `advisory(${s3_advisory})+service(${s3_services})+vendor(${s3_vendor})`
        });
      }
    } else {
      warnings.push('Scenario 3 project not found');
    }

    // Scenario 4: Airport Refurbishment - should have vendor+2 services+advisory+subcontract
    const s4_megaproject = projects.find(p => p.id === 'megaproject_s4_airport');
    if (s4_megaproject) {
      const s4_contracts = contracts.filter(c => 
        (c.scopeType === 'MEGA_PROJECT' && c.scopeId === s4_megaproject.id) ||
        (c.scopeType === 'SERVICE_REQUEST' && contracts.find(c2 => c2.scopeType === 'MEGA_PROJECT' && c2.scopeId === s4_megaproject.id))
      );
      const s4_vendor = s4_contracts.filter(c => c.contractType === 'MEGA_PROJECT_CONTRACT').length;
      const s4_services = s4_contracts.filter(c => c.contractType === 'SERVICE_CONTRACT').length;
      const s4_advisory = s4_contracts.filter(c => c.contractType === 'ADVISORY_CONTRACT').length;
      const s4_subs = s4_contracts.filter(c => c.contractType === 'SUB_CONTRACT').length;

      if (s4_vendor !== 1 || s4_services !== 2 || s4_advisory !== 1 || s4_subs !== 1) {
        violations.push({
          scenario: 'Scenario 4: Airport Refurbishment',
          expected: 'vendor(1)+services(2)+advisory(1)+subcontract(1)',
          actual: `vendor(${s4_vendor})+services(${s4_services})+advisory(${s4_advisory})+subcontract(${s4_subs})`
        });
      }
    } else {
      warnings.push('Scenario 4 mega project not found');
    }

    // Scenario 5: Industrial Safety Compliance - should have advisory+2 services, NO vendor
    const s5_project = projects.find(p => p.id === 'project_s5_safety');
    if (s5_project) {
      const s5_contracts = contracts.filter(c => 
        (c.scopeType === 'PROJECT' && c.scopeId === s5_project.id) ||
        (c.scopeType === 'SERVICE_REQUEST' && contracts.find(c2 => c2.scopeType === 'PROJECT' && c2.scopeId === s5_project.id))
      );
      const s5_advisory = s5_contracts.filter(c => c.contractType === 'ADVISORY_CONTRACT').length;
      const s5_services = s5_contracts.filter(c => c.contractType === 'SERVICE_CONTRACT').length;
      const s5_vendor = s5_contracts.filter(c => c.contractType === 'PROJECT_CONTRACT').length;

      if (s5_advisory !== 1 || s5_services !== 2 || s5_vendor !== 0) {
        violations.push({
          scenario: 'Scenario 5: Industrial Safety Compliance',
          expected: 'advisory(1)+services(2)+vendor(0)',
          actual: `advisory(${s5_advisory})+services(${s5_services})+vendor(${s5_vendor})`
        });
      }
    } else {
      warnings.push('Scenario 5 project not found');
    }

    return {
      name: 'Scenario-specific validations',
      valid: violations.length === 0,
      message: violations.length === 0
        ? '✅ All scenarios have correct contract structure'
        : `❌ Found ${violations.length} scenario(s) with incorrect contract structure: ${violations.map(v => `${v.scenario}: expected ${v.expected}, got ${v.actual}`).join('; ')}`,
      violations: violations,
      warnings: warnings
    };
  }

  // Export
  if (typeof window !== 'undefined') {
    window.PMTwinValidateScenarioData = {
      validate: validateScenarioData,
      validateNoSubContractorWithBeneficiary: validateNoSubContractorWithBeneficiary,
      validateEngagementContracts: validateEngagementContracts,
      validateMegaProjectContracts: validateMegaProjectContracts,
      validateSubContractParents: validateSubContractParents,
      validateServiceProviderNoBidding: validateServiceProviderNoBidding,
      validateContractPartyTypes: validateContractPartyTypes,
      validateScenarioSpecifics: validateScenarioSpecifics
    };
  }

})();