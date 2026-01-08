/**
 * Contract Constraints Unit Tests
 * Tests all business rule constraints for contracts and engagements
 */

(function() {
  'use strict';

  // Test suite
  const ContractConstraintsTests = {
    tests: [],
    passed: 0,
    failed: 0,

    run() {
      console.log('🧪 Running Contract Constraints Tests...\n');

      this.testSubContractorCannotContractWithBeneficiary();
      this.testEngagementRequiresSignedContract();
      this.testServiceProviderCannotBidOnProjects();
      this.testMegaProjectMultipleContracts();
      this.testSubContractMustHaveParentVendorContract();

      this.printResults();
    },

    test(name, testFn) {
      this.tests.push({ name, testFn });
      try {
        const result = testFn();
        if (result === true) {
          this.passed++;
          console.log(`✅ ${name}`);
          return true;
        } else {
          this.failed++;
          console.error(`❌ ${name}: ${result}`);
          return false;
        }
      } catch (error) {
        this.failed++;
        console.error(`❌ ${name}: ${error.message}`);
        return false;
      }
    },

    testSubContractorCannotContractWithBeneficiary() {
      this.test('SubContractor cannot be contracted by Beneficiary', () => {
        if (typeof ContractValidator === 'undefined') {
          return 'ContractValidator not available';
        }

        // Create a mock contract where SubContractor tries to contract with Beneficiary
        const contractData = {
          contractType: 'SUB_CONTRACT',
          scopeType: 'PROJECT',
          scopeId: 'project_123',
          buyerPartyId: 'beneficiary_user_123', // Beneficiary
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: 'subcontractor_user_123',
          providerPartyType: 'SUB_CONTRACTOR',
          parentContractId: null // Missing parent
        };

        const validation = ContractValidator.validateSubContract(contractData);
        
        // Should fail because buyer is Beneficiary
        if (validation.valid) {
          return 'Validation should fail when SubContractor contracts with Beneficiary';
        }

        // Should also fail validation in createContract
        const createValidation = ContractValidator.validateContractCreation(contractData);
        if (createValidation.valid) {
          return 'Contract creation should fail when SubContractor contracts with Beneficiary';
        }

        return true;
      });
    },

    testEngagementRequiresSignedContract() {
      this.test('Engagement cannot exist without signed contract', () => {
        if (typeof EngagementValidator === 'undefined') {
          return 'EngagementValidator not available';
        }

        // Try to create engagement without contractId
        const engagementData1 = {
          engagementType: 'PROJECT_EXECUTION',
          status: 'ACTIVE'
        };

        const validation1 = EngagementValidator.validateEngagementCreation(engagementData1);
        if (validation1.valid) {
          return 'Engagement should require contractId';
        }

        // Try to create engagement with DRAFT contract
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Contracts) {
          // Create a DRAFT contract
          const draftContract = PMTwinData.Contracts.create({
            contractType: 'PROJECT_CONTRACT',
            scopeType: 'PROJECT',
            scopeId: 'project_123',
            buyerPartyId: 'buyer_123',
            buyerPartyType: 'BENEFICIARY',
            providerPartyId: 'provider_123',
            providerPartyType: 'VENDOR_CORPORATE',
            status: 'DRAFT'
          });

          if (draftContract) {
            const engagementData2 = {
              contractId: draftContract.id,
              engagementType: 'PROJECT_EXECUTION',
              status: 'ACTIVE'
            };

            const validation2 = EngagementValidator.validateEngagementCreation(engagementData2);
            if (validation2.valid) {
              return 'Engagement should not be allowed with DRAFT contract';
            }

            // Clean up
            PMTwinData.Contracts.delete(draftContract.id);
          }
        }

        return true;
      });
    },

    testServiceProviderCannotBidOnProjects() {
      this.test('ServiceProvider cannot bid on Projects/MegaProjects', () => {
        if (typeof ContractValidator === 'undefined') {
          return 'ContractValidator not available';
        }

        // Try to create PROJECT_CONTRACT with ServiceProvider
        const contractData = {
          contractType: 'PROJECT_CONTRACT',
          scopeType: 'PROJECT',
          scopeId: 'project_123',
          buyerPartyId: 'buyer_123',
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: 'service_provider_123',
          providerPartyType: 'SERVICE_PROVIDER'
        };

        const validation = ContractValidator.validateServiceProviderContract(contractData);
        
        // Should fail because ServiceProvider cannot contract for Projects
        if (validation.valid) {
          return 'ServiceProvider should not be able to contract for Projects';
        }

        // Try with MEGA_PROJECT
        contractData.scopeType = 'MEGA_PROJECT';
        const validation2 = ContractValidator.validateServiceProviderContract(contractData);
        if (validation2.valid) {
          return 'ServiceProvider should not be able to contract for MegaProjects';
        }

        return true;
      });
    },

    testMegaProjectMultipleContracts() {
      this.test('MegaProject can have multiple contracts simultaneously', () => {
        if (typeof PMTwinData === 'undefined' || !PMTwinData.Contracts) {
          return 'Contracts module not available';
        }

        const megaProjectId = 'megaproject_test_123';

        // Create multiple contracts for the same mega-project
        const contract1 = PMTwinData.Contracts.create({
          contractType: 'MEGA_PROJECT_CONTRACT',
          scopeType: 'MEGA_PROJECT',
          scopeId: megaProjectId,
          buyerPartyId: 'buyer_123',
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: 'vendor_123',
          providerPartyType: 'VENDOR_CORPORATE',
          status: 'SIGNED'
        });

        const contract2 = PMTwinData.Contracts.create({
          contractType: 'SERVICE_CONTRACT',
          scopeType: 'SERVICE_REQUEST',
          scopeId: 'service_request_123',
          buyerPartyId: 'buyer_123',
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: 'service_provider_123',
          providerPartyType: 'SERVICE_PROVIDER',
          status: 'SIGNED'
        });

        const contract3 = PMTwinData.Contracts.create({
          contractType: 'ADVISORY_CONTRACT',
          scopeType: 'MEGA_PROJECT',
          scopeId: megaProjectId,
          buyerPartyId: 'buyer_123',
          buyerPartyType: 'BENEFICIARY',
          providerPartyId: 'consultant_123',
          providerPartyType: 'CONSULTANT',
          status: 'SIGNED'
        });

        if (!contract1 || !contract2 || !contract3) {
          return 'Failed to create multiple contracts';
        }

        // Verify all contracts exist
        const contracts = PMTwinData.Contracts.getByScope('MEGA_PROJECT', megaProjectId);
        const megaProjectContracts = contracts.filter(c => c.scopeId === megaProjectId);
        
        // Clean up
        if (contract1) PMTwinData.Contracts.delete(contract1.id);
        if (contract2) PMTwinData.Contracts.delete(contract2.id);
        if (contract3) PMTwinData.Contracts.delete(contract3.id);

        if (megaProjectContracts.length < 2) {
          return 'MegaProject should support multiple contracts';
        }

        return true;
      });
    },

    testSubContractMustHaveParentVendorContract() {
      this.test('SubContract must have parent Vendor contract', () => {
        if (typeof ContractValidator === 'undefined') {
          return 'ContractValidator not available';
        }

        // Try to create SUB_CONTRACT without parentContractId
        const contractData1 = {
          contractType: 'SUB_CONTRACT',
          scopeType: 'PROJECT',
          scopeId: 'project_123',
          buyerPartyId: 'vendor_123',
          buyerPartyType: 'VENDOR_CORPORATE',
          providerPartyId: 'subcontractor_123',
          providerPartyType: 'SUB_CONTRACTOR',
          parentContractId: null // Missing parent
        };

        const validation1 = ContractValidator.validateSubContract(contractData1);
        if (validation1.valid) {
          return 'SubContract should require parentContractId';
        }

        // Try with invalid parent contract type
        if (typeof PMTwinData !== 'undefined' && PMTwinData.Contracts) {
          // Create a SERVICE_CONTRACT (invalid parent)
          const invalidParent = PMTwinData.Contracts.create({
            contractType: 'SERVICE_CONTRACT',
            scopeType: 'SERVICE_REQUEST',
            scopeId: 'service_request_123',
            buyerPartyId: 'buyer_123',
            buyerPartyType: 'BENEFICIARY',
            providerPartyId: 'service_provider_123',
            providerPartyType: 'SERVICE_PROVIDER',
            status: 'SIGNED'
          });

          if (invalidParent) {
            const contractData2 = {
              ...contractData1,
              parentContractId: invalidParent.id
            };

            const validation2 = ContractValidator.validateSubContract(contractData2);
            if (validation2.valid) {
              PMTwinData.Contracts.delete(invalidParent.id);
              return 'SubContract parent must be PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT';
            }

            PMTwinData.Contracts.delete(invalidParent.id);
          }
        }

        return true;
      });
    },

    printResults() {
      console.log('\n📊 Test Results:');
      console.log(`   ✅ Passed: ${this.passed}`);
      console.log(`   ❌ Failed: ${this.failed}`);
      console.log(`   📈 Total: ${this.tests.length}`);
      
      if (this.failed === 0) {
        console.log('\n🎉 All tests passed!');
      } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.');
      }
    }
  };

  // Export for use in browser console or test runner
  if (typeof window !== 'undefined') {
    window.ContractConstraintsTests = ContractConstraintsTests;
  }

  // Auto-run if in test environment
  if (typeof window !== 'undefined' && window.location.search.includes('test=contracts')) {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        ContractConstraintsTests.run();
      }, 1000); // Wait for modules to load
    });
  }

})();

