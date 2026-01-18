/**
 * PMTwin Collaboration Model Definitions
 * Defines all 5 main models and 13 sub-models with attributes, validation, and matching config
 */

(function() {
  'use strict';

  // ============================================
  // Model Definitions
  // ============================================

  const COLLABORATION_MODELS = {
    // Model 1: Project-Based Collaboration
    '1.1': {
      id: '1.1',
      name: 'Task-Based Engagement',
      category: 'Project-Based Collaboration',
      description: 'Short-term collaboration for executing specific tasks, deliverables, or providing expert consultation.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      supportedIntentTypes: ['REQUEST_SERVICE', 'OFFER_SERVICE', 'BOTH'],
      supportedPaymentModes: ['Cash', 'Equity', 'ProfitSharing', 'Barter', 'Hybrid'],
      attributes: [
        // Note: intentType removed - intent is already selected in Step 0 (Intent Selection)
        // Note: paymentMode, paymentTerms, barterOffer, barterSettlementRule removed - handled in Step 3 (Payment)
        // Note: locationRequirement removed - handled in Step 3.5 (Location)
        
        {
          name: 'taskTitle',
          type: 'String',
          maxLength: 100,
          required: false,
          question: 'Task Title (Optional)',
          placeholder: 'e.g., Review shop drawings for structural approval',
          description: 'A brief title for the task (optional - main title is captured separately)'
        },
        {
          name: 'taskType',
          type: 'Enum',
          required: false,
          question: 'What type of work is this?',
          options: ['Design', 'Engineering', 'Consultation', 'Review', 'Analysis', 'Construction', 'Management', 'Other'],
          placeholder: 'Select task type',
          description: 'Categorize the type of work involved'
        },
        {
          name: 'detailedScope',
          type: 'Text',
          maxLength: 2000,
          required: false,
          question: 'Detailed Scope and Deliverables (Optional)',
          placeholder: 'Provide full description of what needs to be delivered...',
          description: 'Additional details beyond the main description (optional - main description is captured separately)'
        },
        {
          name: 'expectedDuration',
          type: 'Integer',
          required: false,
          question: 'Expected Duration (Optional)',
          placeholder: 'Enter duration in days',
          min: 1,
          description: 'Estimated duration in days (optional - can be specified in service items)'
        },
        {
          name: 'experienceLevel',
          type: 'Enum',
          required: false,
          question: 'Required Experience Level (Optional)',
          options: ['Junior', 'Mid-Level', 'Senior', 'Expert'],
          placeholder: 'Select experience level',
          description: 'Preferred experience level for this engagement'
        },
        {
          name: 'startDate',
          type: 'Date',
          required: false,
          question: 'Preferred Start Date (Optional)',
          placeholder: 'Select start date',
          description: 'When you would like the work to begin'
        },
        {
          name: 'deliverableFormat',
          type: 'String',
          required: false,
          question: 'Deliverable Format (Optional)',
          placeholder: 'e.g., PDF report, CAD files, Excel spreadsheet',
          description: 'Specify the expected format of deliverables'
        },
        {
          name: 'specialRequirements',
          type: 'Text',
          maxLength: 1000,
          required: false,
          question: 'Special Requirements or Notes (Optional)',
          placeholder: 'Any special requirements, certifications, or notes...',
          description: 'Additional requirements or important notes for this engagement'
        }
      ],
      matchingMetrics: [
        { name: 'skillScopeMatchScore', weight: 0.50 },
        { name: 'financialCapacity', weight: 0.30 },
        { name: 'pastPerformanceScore', weight: 0.20 }
      ],
      threshold: 80
    },

    '1.2': {
      id: '1.2',
      name: 'Consortium',
      category: 'Project-Based Collaboration',
      description: 'A temporary contractual alliance among independent entities formed to pursue a specific opportunity.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'projectTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What is the project or tender you\'re pursuing?',
          placeholder: 'Enter project/tender title'
        },
        {
          name: 'projectType',
          type: 'Enum',
          required: true,
          question: 'What type of project is this?',
          options: ['Infrastructure', 'Building', 'Industrial', 'Energy', 'Other'],
          placeholder: 'Select project type'
        },
        {
          name: 'projectValue',
          type: 'Currency',
          required: true,
          question: 'What is the total project value?',
          placeholder: 'Enter total project value in SAR',
          currency: 'SAR'
        },
        {
          name: 'projectDuration',
          type: 'Integer',
          required: true,
          question: 'How long is the project expected to take?',
          placeholder: 'Enter duration in months',
          min: 1
        },
        {
          name: 'projectLocation',
          type: 'String',
          required: true,
          question: 'Where is the project located?',
          placeholder: 'Enter city/region'
        },
        {
          name: 'leadMember',
          type: 'Boolean',
          required: true,
          question: 'Will you be the lead member of this consortium?',
          placeholder: 'Yes/No'
        },
        {
          name: 'requiredMembers',
          type: 'Integer',
          required: true,
          question: 'How many consortium members do you need?',
          placeholder: 'Enter number of partners needed',
          min: 1
        },
        {
          name: 'memberRoles',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What roles/scopes do you need filled?',
          placeholder: 'Add roles (e.g., Civil Works, MEP, Finishes)',
          schema: {
            role: { type: 'String', required: true },
            description: { type: 'Text', required: false }
          }
        },
        {
          name: 'scopeDivision',
          type: 'Enum',
          required: true,
          question: 'How will the work be divided?',
          options: ['By Trade', 'By Phase', 'By Geography', 'Mixed'],
          placeholder: 'Select scope division method'
        },
        {
          name: 'liabilityStructure',
          type: 'Enum',
          required: true,
          question: 'What liability structure?',
          options: ['Individual', 'Joint & Several', 'Mixed'],
          placeholder: 'Select liability structure'
        },
        {
          name: 'clientType',
          type: 'Enum',
          required: true,
          question: 'Who is the client?',
          options: ['Government', 'Private', 'PPP', 'Other'],
          placeholder: 'Select client type'
        },
        {
          name: 'tenderDeadline',
          type: 'Date',
          required: false,
          conditional: { field: 'clientType', value: ['Government', 'PPP'] },
          question: 'When is the tender deadline?',
          placeholder: 'Select tender deadline'
        },
        {
          name: 'prequalificationRequired',
          type: 'Boolean',
          required: true,
          question: 'Do consortium members need to be prequalified?',
          placeholder: 'Yes/No'
        },
        {
          name: 'minimumRequirements',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What are the minimum requirements for members?',
          placeholder: 'Add requirements (Financial capacity, experience, certifications)',
          schema: {
            requirement: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Financial', 'Experience', 'Certification', 'Other'], required: true }
          }
        },
        {
          name: 'consortiumAgreement',
          type: 'Boolean',
          required: true,
          question: 'Will there be a formal consortium agreement?',
          placeholder: 'Yes/No'
        },
        {
          name: 'paymentDistribution',
          type: 'Enum',
          required: true,
          question: 'How will payments be distributed?',
          options: ['Per Scope', 'Proportional', 'Fixed Percentage'],
          placeholder: 'Select payment distribution method'
        }
      ],
      matchingMetrics: [
        { name: 'skillScopeMatchScore', weight: 0.50 },
        { name: 'financialCapacity', weight: 0.30 },
        { name: 'pastPerformanceScore', weight: 0.20 }
      ],
      threshold: 80
    },

    '1.3': {
      id: '1.3',
      name: 'Project-Specific Joint Venture',
      category: 'Project-Based Collaboration',
      description: 'A formal partnership between two or more parties to collaborate on a single, specific project.',
      applicability: ['B2B', 'B2P', 'P2B'],
      attributes: [
        {
          name: 'projectTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What is the project you want to collaborate on?',
          placeholder: 'Enter project title'
        },
        {
          name: 'projectType',
          type: 'Enum',
          required: true,
          question: 'What type of project is this?',
          options: ['Building', 'Infrastructure', 'Industrial', 'Energy', 'Real Estate Development', 'Other'],
          placeholder: 'Select project type'
        },
        {
          name: 'projectValue',
          type: 'Currency',
          required: true,
          question: 'What is the total project value?',
          placeholder: 'Enter total project value in SAR',
          currency: 'SAR'
        },
        {
          name: 'projectDuration',
          type: 'Integer',
          required: true,
          question: 'How long will this project take?',
          placeholder: 'Enter duration in months',
          min: 1
        },
        {
          name: 'projectLocation',
          type: 'String',
          required: true,
          question: 'Where is the project located?',
          placeholder: 'Enter city/region'
        },
        {
          name: 'jvStructure',
          type: 'Enum',
          required: true,
          question: 'What type of JV structure?',
          options: ['Contractual', 'Incorporated LLC', 'Incorporated Corporation'],
          placeholder: 'Select JV structure'
        },
        {
          name: 'equitySplit',
          type: 'Array',
          itemType: 'Decimal',
          required: true,
          question: 'How will ownership/equity be split?',
          placeholder: 'Enter percentages (e.g., 50, 50 for 50-50 split)',
          min: 0,
          max: 100,
          sum: 100
        },
        {
          name: 'capitalContribution',
          type: 'Currency',
          required: true,
          question: 'What is the total capital contribution required?',
          placeholder: 'Enter total capital needed in SAR',
          currency: 'SAR'
        },
        {
          name: 'partnerRoles',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What will each partner contribute?',
          placeholder: 'Add partner contributions',
          schema: {
            contribution: { type: 'Enum', options: ['Capital', 'Expertise', 'Equipment', 'Labor', 'Market Access'], required: true },
            description: { type: 'Text', required: false }
          }
        },
        {
          name: 'managementStructure',
          type: 'Enum',
          required: true,
          question: 'How will the JV be managed?',
          options: ['Equal Management', 'Lead Partner', 'Management Committee', 'Professional Manager'],
          placeholder: 'Select management structure'
        },
        {
          name: 'profitDistribution',
          type: 'Enum',
          required: true,
          question: 'How will profits be distributed?',
          options: ['Proportional to Equity', 'Fixed Percentage', 'Performance-Based'],
          placeholder: 'Select profit distribution method'
        },
        {
          name: 'riskAllocation',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'How will risks and liabilities be allocated?',
          placeholder: 'Describe risk allocation...'
        },
        {
          name: 'exitStrategy',
          type: 'Enum',
          required: true,
          question: 'What happens after project completion?',
          options: ['Dissolution', 'Asset Sale', 'Buyout Option', 'Conversion to Strategic JV'],
          placeholder: 'Select exit strategy'
        },
        {
          name: 'governance',
          type: 'Text',
          maxLength: 1000,
          required: false,
          conditional: { field: 'jvStructure', value: ['Incorporated LLC', 'Incorporated Corporation'] },
          question: 'What governance structure will the JV have?',
          placeholder: 'Describe board composition, voting rights, decision-making...'
        },
        {
          name: 'disputeResolution',
          type: 'Enum',
          required: true,
          question: 'How will disputes be resolved?',
          options: ['Arbitration', 'Mediation', 'Court', 'Other'],
          placeholder: 'Select dispute resolution method'
        },
        {
          name: 'partnerRequirements',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What qualifications do you need from partners?',
          placeholder: 'Add partner requirements',
          schema: {
            requirement: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Financial', 'Experience', 'License', 'Other'], required: true }
          }
        }
      ],
      matchingMetrics: [
        { name: 'skillScopeMatchScore', weight: 0.50 },
        { name: 'financialCapacity', weight: 0.30 },
        { name: 'pastPerformanceScore', weight: 0.20 }
      ],
      threshold: 80
    },

    '1.4': {
      id: '1.4',
      name: 'Special Purpose Vehicle (SPV)',
      category: 'Project-Based Collaboration',
      description: 'A separate legal entity created specifically to isolate financial risk for a single, large-scale, capital-intensive project.',
      applicability: ['B2B'],
      attributes: [
        {
          name: 'projectTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What is the project name?',
          placeholder: 'Enter project title'
        },
        {
          name: 'projectType',
          type: 'Enum',
          required: true,
          question: 'What type of project is this?',
          options: ['Infrastructure', 'Energy', 'Real Estate', 'PPP', 'Industrial', 'Other'],
          placeholder: 'Select project type'
        },
        {
          name: 'projectValue',
          type: 'Currency',
          required: true,
          question: 'What is the total project value?',
          placeholder: 'Enter total project value in SAR (Minimum 50M SAR)',
          currency: 'SAR',
          min: 50000000
        },
        {
          name: 'projectDuration',
          type: 'Integer',
          required: true,
          question: 'How long is the project lifecycle?',
          placeholder: 'Enter duration in years (Typically 20-30 years)',
          min: 1
        },
        {
          name: 'projectLocation',
          type: 'String',
          required: true,
          question: 'Where is the project located?',
          placeholder: 'Enter city/region'
        },
        {
          name: 'spvLegalForm',
          type: 'Enum',
          required: true,
          question: 'What legal form will the SPV take?',
          options: ['LLC', 'Limited Partnership', 'Corporation', 'Trust'],
          placeholder: 'Select legal form'
        },
        {
          name: 'sponsors',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'Who are the sponsors/parent companies?',
          placeholder: 'Add sponsor information',
          schema: {
            name: { type: 'String', required: true },
            equityPercentage: { type: 'Decimal', required: true }
          }
        },
        {
          name: 'equityStructure',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'How will equity be structured?',
          placeholder: 'Define equity breakdown',
          schema: {
            sponsorName: { type: 'String', required: true },
            percentage: { type: 'Decimal', required: true }
          }
        },
        {
          name: 'debtFinancing',
          type: 'Currency',
          required: true,
          question: 'How much debt financing is required?',
          placeholder: 'Enter debt amount in SAR',
          currency: 'SAR'
        },
        {
          name: 'debtType',
          type: 'Enum',
          required: true,
          question: 'What type of debt?',
          options: ['Non-Recourse', 'Limited Recourse', 'Recourse'],
          placeholder: 'Select debt type'
        },
        {
          name: 'lenders',
          type: 'Array',
          itemType: 'String',
          required: false,
          question: 'Who are the target lenders?',
          placeholder: 'Add lender names (Banks, IFC, ADB, etc.)'
        },
        {
          name: 'projectPhase',
          type: 'Enum',
          required: true,
          question: 'What phase is the project in?',
          options: ['Concept', 'Feasibility', 'Financing', 'Construction', 'Operation'],
          placeholder: 'Select project phase'
        },
        {
          name: 'revenueModel',
          type: 'Enum',
          required: true,
          question: 'What is the revenue model?',
          options: ['User Fees', 'Government Payments', 'Asset Sale', 'Lease', 'Other'],
          placeholder: 'Select revenue model'
        },
        {
          name: 'riskAllocation',
          type: 'Text',
          maxLength: 2000,
          required: true,
          question: 'How will risks be allocated among sponsors, lenders, and contractors?',
          placeholder: 'Describe risk allocation...'
        },
        {
          name: 'governanceStructure',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What is the SPV\'s governance structure?',
          placeholder: 'Describe board composition, management team...'
        },
        {
          name: 'regulatoryApprovals',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What regulatory approvals are needed?',
          placeholder: 'Add required permits/licenses'
        },
        {
          name: 'exitStrategy',
          type: 'Enum',
          required: true,
          question: 'What is the exit strategy?',
          options: ['Asset Transfer', 'Liquidation', 'Sale', 'Conversion to Permanent Entity'],
          placeholder: 'Select exit strategy'
        },
        {
          name: 'professionalServicesNeeded',
          type: 'Array',
          itemType: 'Enum',
          required: true,
          question: 'What professional services do you need?',
          options: ['Legal', 'Financial', 'Technical', 'Environmental', 'Other'],
          placeholder: 'Select required services'
        }
      ],
      matchingMetrics: [
        { name: 'skillScopeMatchScore', weight: 0.50 },
        { name: 'financialCapacity', weight: 0.30 },
        { name: 'pastPerformanceScore', weight: 0.20 }
      ],
      threshold: 80
    },

    // Model 2: Strategic Partnerships
    '2.1': {
      id: '2.1',
      name: 'Strategic Joint Venture',
      category: 'Strategic Partnerships',
      description: 'A long-term partnership between two or more parties that creates a new, ongoing business entity.',
      applicability: ['B2B', 'B2P', 'P2B'],
      attributes: [
        {
          name: 'jvName',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What will the JV be called?',
          placeholder: 'Enter JV name'
        },
        {
          name: 'strategicObjective',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What are the strategic objectives of this JV?',
          placeholder: 'Describe long-term goals (Market expansion, technology transfer, capability building, etc.)'
        },
        {
          name: 'businessScope',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What business activities will the JV pursue?',
          placeholder: 'Describe activities (Multiple projects, ongoing operations, manufacturing, services, etc.)'
        },
        {
          name: 'targetSectors',
          type: 'Array',
          itemType: 'Enum',
          required: true,
          question: 'What sectors will the JV operate in?',
          options: ['Construction', 'Energy', 'Real Estate', 'Manufacturing', 'Technology', 'Other'],
          placeholder: 'Select target sectors'
        },
        {
          name: 'geographicScope',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What geographic markets will the JV serve?',
          placeholder: 'Add markets (Saudi Arabia, GCC, MENA, Global)'
        },
        {
          name: 'duration',
          type: 'Enum',
          required: true,
          question: 'How long do you envision this JV lasting?',
          options: ['10-15 years', '15-20 years', 'Indefinite', 'Until specific milestone'],
          placeholder: 'Select expected duration'
        },
        {
          name: 'jvStructure',
          type: 'Enum',
          required: true,
          question: 'What legal structure?',
          options: ['Incorporated LLC', 'Incorporated Corporation', 'Limited Partnership'],
          placeholder: 'Select legal structure'
        },
        {
          name: 'equitySplit',
          type: 'Array',
          itemType: 'Decimal',
          required: true,
          question: 'How will ownership be split?',
          placeholder: 'Enter percentages (e.g., 50, 50 for 50-50 split)',
          min: 0,
          max: 100,
          sum: 100
        },
        {
          name: 'initialCapital',
          type: 'Currency',
          required: true,
          question: 'What is the initial capital contribution?',
          placeholder: 'Enter startup capital in SAR',
          currency: 'SAR'
        },
        {
          name: 'ongoingFunding',
          type: 'Enum',
          required: true,
          question: 'How will the JV be funded ongoing?',
          options: ['Partner Contributions', 'Retained Earnings', 'External Financing', 'Mixed'],
          placeholder: 'Select funding method'
        },
        {
          name: 'partnerContributions',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What will each partner contribute?',
          placeholder: 'Add partner contributions',
          schema: {
            contribution: { type: 'Enum', options: ['Capital', 'Technology', 'Market Access', 'Brand', 'Expertise', 'Assets'], required: true },
            description: { type: 'Text', required: false }
          }
        },
        {
          name: 'managementStructure',
          type: 'Enum',
          required: true,
          question: 'How will the JV be managed?',
          options: ['Equal Management', 'Lead Partner', 'Professional CEO', 'Management Committee'],
          placeholder: 'Select management structure'
        },
        {
          name: 'governance',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What is the governance structure?',
          placeholder: 'Describe board composition, voting rights, veto powers...'
        },
        {
          name: 'profitDistribution',
          type: 'Enum',
          required: true,
          question: 'How will profits be distributed?',
          options: ['Proportional to Equity', 'Reinvested', 'Performance-Based'],
          placeholder: 'Select profit distribution method'
        },
        {
          name: 'exitOptions',
          type: 'Array',
          itemType: 'Enum',
          required: true,
          question: 'What exit options are available?',
          options: ['Buyout', 'IPO', 'Sale to Third Party', 'Dissolution'],
          placeholder: 'Select exit options'
        },
        {
          name: 'nonCompete',
          type: 'Boolean',
          required: true,
          question: 'Will there be non-compete clauses for partners?',
          placeholder: 'Yes/No'
        },
        {
          name: 'technologyTransfer',
          type: 'Boolean',
          required: false,
          question: 'Does this JV involve technology or knowledge transfer?',
          placeholder: 'Yes/No'
        },
        {
          name: 'partnerRequirements',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What do you need from partners?',
          placeholder: 'Add partner requirements',
          schema: {
            requirement: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Financial', 'Expertise', 'Market Presence', 'Technology', 'Brand'], required: true }
          }
        }
      ],
      matchingMetrics: [
        { name: 'strategicAlignment', weight: 0.40 },
        { name: 'complementaryStrengths', weight: 0.35 },
        { name: 'culturalCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    '2.2': {
      id: '2.2',
      name: 'Long-Term Strategic Alliance',
      category: 'Strategic Partnerships',
      description: 'An ongoing partnership between two or more parties for mutual benefit without forming a new legal entity.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'allianceTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What is this strategic alliance for?',
          placeholder: 'Enter alliance title/description'
        },
        {
          name: 'allianceType',
          type: 'Enum',
          required: true,
          question: 'What type of alliance is this?',
          options: ['Preferred Supplier', 'Technology Licensing', 'Market Access', 'Knowledge Sharing', 'Joint Service Offering', 'Other'],
          placeholder: 'Select alliance type'
        },
        {
          name: 'strategicObjective',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What are the strategic objectives?',
          placeholder: 'Describe goals (Cost reduction, capability enhancement, market expansion, etc.)'
        },
        {
          name: 'scopeOfCollaboration',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What will you collaborate on?',
          placeholder: 'Describe collaboration (Supply of materials, technology access, joint bidding, knowledge transfer, etc.)'
        },
        {
          name: 'duration',
          type: 'Integer',
          required: true,
          question: 'How long will this alliance last?',
          placeholder: 'Enter duration in years (Minimum 3 years)',
          min: 3
        },
        {
          name: 'exclusivity',
          type: 'Boolean',
          required: true,
          question: 'Will this be an exclusive arrangement?',
          placeholder: 'Yes/No'
        },
        {
          name: 'geographicScope',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What geographic areas does this cover?',
          placeholder: 'Add geographic areas'
        },
        {
          name: 'financialTerms',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'What are the financial terms?',
          placeholder: 'Describe commercial arrangement (Pricing, discounts, revenue sharing, licensing fees, etc.)'
        },
        {
          name: 'performanceMetrics',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What are the key performance indicators?',
          placeholder: 'Add KPIs (Volume, quality, response time, cost savings, etc.)',
          schema: {
            metric: { type: 'String', required: true },
            target: { type: 'String', required: false }
          }
        },
        {
          name: 'governance',
          type: 'Text',
          maxLength: 500,
          required: true,
          question: 'How will this alliance be managed?',
          placeholder: 'Describe management (Regular meetings, joint steering committee, etc.)'
        },
        {
          name: 'terminationConditions',
          type: 'Text',
          maxLength: 500,
          required: true,
          question: 'Under what conditions can this alliance be terminated?',
          placeholder: 'Describe termination conditions...'
        },
        {
          name: 'partnerRequirements',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What do you need from your alliance partner?',
          placeholder: 'Add partner requirements',
          schema: {
            requirement: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Capability', 'Capacity', 'Certification', 'Geographic Presence'], required: true }
          }
        }
      ],
      matchingMetrics: [
        { name: 'strategicAlignment', weight: 0.40 },
        { name: 'complementaryStrengths', weight: 0.35 },
        { name: 'culturalCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    '2.3': {
      id: '2.3',
      name: 'Mentorship Program',
      category: 'Strategic Partnerships',
      description: 'A relationship where an experienced professional provides guidance, knowledge transfer, and career development support.',
      applicability: ['B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'mentorshipTitle',
          type: 'String',
          maxLength: 100,
          required: true,
          question: 'What type of mentorship are you seeking/offering?',
          placeholder: 'Enter mentorship title'
        },
        {
          name: 'mentorshipType',
          type: 'Enum',
          required: true,
          question: 'What area of mentorship?',
          options: ['Technical', 'Career Development', 'Business', 'Leadership', 'Project Management', 'Design', 'Other'],
          placeholder: 'Select mentorship area'
        },
        {
          name: 'experienceLevel',
          type: 'Enum',
          required: true,
          question: 'What is the mentee\'s experience level?',
          options: ['Entry-Level', 'Junior', 'Mid-Level', 'Senior transitioning to leadership'],
          placeholder: 'Select experience level'
        },
        {
          name: 'targetSkills',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What skills or knowledge should be developed?',
          placeholder: 'Add target skills'
        },
        {
          name: 'duration',
          type: 'Integer',
          required: true,
          question: 'How long should the mentorship last?',
          placeholder: 'Enter duration in months',
          min: 1
        },
        {
          name: 'frequency',
          type: 'Enum',
          required: true,
          question: 'How often will mentor and mentee meet?',
          options: ['Weekly', 'Bi-Weekly', 'Monthly', 'As Needed'],
          placeholder: 'Select meeting frequency'
        },
        {
          name: 'format',
          type: 'Enum',
          required: true,
          question: 'What format?',
          options: ['In-Person', 'Virtual', 'Hybrid', 'On-Site Shadowing'],
          placeholder: 'Select format'
        },
        {
          name: 'compensation',
          type: 'Enum',
          required: true,
          question: 'Will this be paid or unpaid?',
          options: ['Unpaid', 'Paid Hourly', 'Paid Monthly', 'Barter'],
          placeholder: 'Select compensation type'
        },
        {
          name: 'barterOffer',
          type: 'Text',
          maxLength: 500,
          required: false,
          conditional: { field: 'compensation', value: ['Barter'] },
          question: 'What is offered in exchange?',
          placeholder: 'Describe barter offer...'
        },
        {
          name: 'mentorRequirements',
          type: 'Array',
          itemType: 'Object',
          required: false,
          conditional: { field: 'seekingMentor', value: [true] },
          question: 'What qualifications should the mentor have?',
          placeholder: 'Add mentor requirements',
          schema: {
            requirement: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Years of Experience', 'Specific Expertise', 'Certification'], required: true }
          }
        },
        {
          name: 'menteeBackground',
          type: 'Text',
          maxLength: 500,
          required: false,
          conditional: { field: 'offeringMentorship', value: [true] },
          question: 'What is the mentee\'s background and goals?',
          placeholder: 'Describe mentee background...'
        },
        {
          name: 'successMetrics',
          type: 'Array',
          itemType: 'String',
          required: false,
          question: 'How will you measure success?',
          placeholder: 'Add success metrics (Skill development, project completion, career advancement, etc.)'
        }
      ],
      matchingMetrics: [
        { name: 'strategicAlignment', weight: 0.40 },
        { name: 'complementaryStrengths', weight: 0.35 },
        { name: 'culturalCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    // Model 3: Resource Pooling & Sharing
    '3.1': {
      id: '3.1',
      name: 'Bulk Purchasing',
      category: 'Resource Pooling & Sharing',
      description: 'Group buying where multiple parties pool their purchasing power to achieve volume discounts.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'productService',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What product or service do you want to buy in bulk?',
          placeholder: 'Enter product/service name'
        },
        {
          name: 'category',
          type: 'Enum',
          required: true,
          question: 'What category?',
          options: ['Materials', 'Equipment', 'Software', 'Services', 'Other'],
          placeholder: 'Select category'
        },
        {
          name: 'quantityNeeded',
          type: 'Integer',
          required: true,
          question: 'What total quantity do you need?',
          placeholder: 'Enter total quantity',
          min: 1
        },
        {
          name: 'unitOfMeasure',
          type: 'String',
          required: true,
          question: 'What is the unit of measure?',
          placeholder: 'e.g., Tons, Pieces, Licenses'
        },
        {
          name: 'targetPrice',
          type: 'Currency',
          required: true,
          question: 'What is your target price per unit?',
          placeholder: 'Enter target price per unit in SAR',
          currency: 'SAR'
        },
        {
          name: 'currentMarketPrice',
          type: 'Currency',
          required: false,
          question: 'What is the current market price?',
          placeholder: 'Enter current market price per unit',
          currency: 'SAR'
        },
        {
          name: 'expectedSavings',
          type: 'Percentage',
          required: false,
          question: 'What discount percentage are you targeting?',
          placeholder: 'Enter expected discount %',
          min: 0,
          max: 100
        },
        {
          name: 'deliveryTimeline',
          type: 'DateRange',
          required: true,
          question: 'When do you need delivery?',
          placeholder: 'Select delivery date range'
        },
        {
          name: 'deliveryLocation',
          type: 'String',
          required: true,
          question: 'Where should goods be delivered?',
          placeholder: 'Enter delivery location (Single location / Multiple locations)'
        },
        {
          name: 'paymentStructure',
          type: 'Enum',
          required: true,
          question: 'How will payment be structured?',
          options: ['Upfront Collection', 'Escrow', 'Pay on Delivery', 'Other'],
          placeholder: 'Select payment structure'
        },
        {
          name: 'participantsNeeded',
          type: 'Integer',
          required: true,
          question: 'How many participants do you need?',
          placeholder: 'Enter number of buyers',
          min: 1
        },
        {
          name: 'minimumOrder',
          type: 'Integer',
          required: false,
          question: 'What is the supplier\'s minimum order quantity?',
          placeholder: 'Enter minimum order quantity',
          min: 1
        },
        {
          name: 'leadOrganizer',
          type: 'Boolean',
          required: true,
          question: 'Will you organize this bulk purchase?',
          placeholder: 'Yes/No'
        },
        {
          name: 'supplier',
          type: 'String',
          required: false,
          question: 'Do you have a preferred supplier?',
          placeholder: 'Enter supplier name if available'
        },
        {
          name: 'distributionMethod',
          type: 'Enum',
          required: true,
          question: 'How will goods be distributed?',
          options: ['Centralized Pickup', 'Individual Delivery', 'Organizer Distributes'],
          placeholder: 'Select distribution method'
        }
      ],
      matchingMetrics: [
        { name: 'timelineAlignment', weight: 0.40 },
        { name: 'geographicProximity', weight: 0.35 },
        { name: 'barterCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    '3.2': {
      id: '3.2',
      name: 'Co-Ownership Pooling',
      category: 'Resource Pooling & Sharing',
      description: 'Multiple parties jointly purchase and co-own expensive equipment or assets, sharing costs and usage.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'assetDescription',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What asset do you want to co-own?',
          placeholder: 'Enter asset description'
        },
        {
          name: 'assetType',
          type: 'Enum',
          required: true,
          question: 'What type of asset?',
          options: ['Heavy Equipment', 'Vehicles', 'Tools', 'Technology', 'Facility', 'Other'],
          placeholder: 'Select asset type'
        },
        {
          name: 'purchasePrice',
          type: 'Currency',
          required: true,
          question: 'What is the purchase price?',
          placeholder: 'Enter total acquisition cost in SAR',
          currency: 'SAR'
        },
        {
          name: 'ownershipStructure',
          type: 'Enum',
          required: true,
          question: 'How will ownership be structured?',
          options: ['Equal Shares', 'Proportional to Investment', 'LLC', 'Partnership'],
          placeholder: 'Select ownership structure'
        },
        {
          name: 'numberOfCoOwners',
          type: 'Integer',
          required: true,
          question: 'How many co-owners?',
          placeholder: 'Enter total number of owners',
          min: 2
        },
        {
          name: 'equityPerOwner',
          type: 'Decimal',
          required: true,
          question: 'What percentage will each owner have?',
          placeholder: 'Enter ownership percentage per owner',
          min: 0,
          max: 100
        },
        {
          name: 'initialInvestment',
          type: 'Currency',
          required: true,
          question: 'What is the initial investment per owner?',
          placeholder: 'Enter upfront cost per owner in SAR',
          currency: 'SAR'
        },
        {
          name: 'ongoingCosts',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What are the ongoing costs?',
          placeholder: 'Add ongoing costs',
          schema: {
            costType: { type: 'Enum', options: ['Maintenance', 'Insurance', 'Storage', 'Operator'], required: true },
            amount: { type: 'Currency', required: false },
            frequency: { type: 'String', required: false }
          }
        },
        {
          name: 'costSharing',
          type: 'Enum',
          required: true,
          question: 'How will ongoing costs be shared?',
          options: ['Equally', 'Proportional to Usage', 'Proportional to Ownership %'],
          placeholder: 'Select cost sharing method'
        },
        {
          name: 'usageSchedule',
          type: 'Enum',
          required: true,
          question: 'How will usage be scheduled?',
          options: ['Rotation', 'Booking System', 'Priority by Ownership %'],
          placeholder: 'Select usage scheduling method'
        },
        {
          name: 'assetLocation',
          type: 'String',
          required: true,
          question: 'Where will the asset be located?',
          placeholder: 'Enter asset location'
        },
        {
          name: 'maintenanceResponsibility',
          type: 'Enum',
          required: true,
          question: 'Who is responsible for maintenance?',
          options: ['Shared', 'Designated Owner', 'Third-Party Service'],
          placeholder: 'Select maintenance responsibility'
        },
        {
          name: 'insurance',
          type: 'Boolean',
          required: true,
          question: 'Will the asset be insured?',
          placeholder: 'Yes/No'
        },
        {
          name: 'exitStrategy',
          type: 'Enum',
          required: true,
          question: 'How can an owner exit?',
          options: ['Sell Share to Other Owners', 'Sell to Third Party', 'Liquidate Asset'],
          placeholder: 'Select exit strategy'
        },
        {
          name: 'disputeResolution',
          type: 'Enum',
          required: true,
          question: 'How will disputes be resolved?',
          options: ['Arbitration', 'Mediation', 'Court'],
          placeholder: 'Select dispute resolution method'
        }
      ],
      matchingMetrics: [
        { name: 'timelineAlignment', weight: 0.40 },
        { name: 'geographicProximity', weight: 0.35 },
        { name: 'barterCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    '3.3': {
      id: '3.3',
      name: 'Resource Sharing & Exchange',
      category: 'Resource Pooling & Sharing',
      description: 'Marketplace for selling, buying, renting, or bartering excess materials, equipment, labor, or services.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'resourceTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What resource are you offering/seeking?',
          placeholder: 'Enter resource title'
        },
        {
          name: 'resourceType',
          type: 'Enum',
          required: true,
          question: 'What type of resource?',
          options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Other'],
          placeholder: 'Select resource type'
        },
        {
          name: 'transactionType',
          type: 'Enum',
          required: true,
          question: 'What type of transaction?',
          options: ['Sell', 'Buy', 'Rent', 'Barter', 'Donate'],
          placeholder: 'Select transaction type'
        },
        {
          name: 'detailedDescription',
          type: 'Text',
          maxLength: 1000,
          required: true,
          question: 'Provide detailed description',
          placeholder: 'Describe condition, specifications, quantity, etc.'
        },
        {
          name: 'quantity',
          type: 'Integer',
          required: true,
          question: 'What quantity?',
          placeholder: 'Enter quantity available/needed',
          min: 1
        },
        {
          name: 'unitOfMeasure',
          type: 'String',
          required: true,
          question: 'What is the unit?',
          placeholder: 'e.g., Pieces, Tons, Hours, Days'
        },
        {
          name: 'condition',
          type: 'Enum',
          required: false,
          conditional: { field: 'resourceType', value: ['Equipment', 'Materials'] },
          question: 'What condition?',
          options: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
          placeholder: 'Select condition'
        },
        {
          name: 'location',
          type: 'String',
          required: true,
          question: 'Where is the resource located?',
          placeholder: 'Enter location'
        },
        {
          name: 'availability',
          type: 'DateRange',
          required: true,
          question: 'When is this available?',
          placeholder: 'Select availability date range'
        },
        {
          name: 'price',
          type: 'Currency',
          required: false,
          conditional: { field: 'transactionType', value: ['Sell', 'Rent'] },
          question: 'What is your asking price?',
          placeholder: 'Enter price (Per unit, per day, total)',
          currency: 'SAR'
        },
        {
          name: 'barterOffer',
          type: 'Text',
          maxLength: 1000,
          required: false,
          conditional: { field: 'transactionType', value: ['Barter'] },
          question: 'What are you willing to accept in exchange?',
          placeholder: 'Describe what you want in exchange...'
        },
        {
          name: 'barterPreferences',
          type: 'Array',
          itemType: 'Enum',
          required: false,
          conditional: { field: 'transactionType', value: ['Barter'] },
          question: 'What types of resources are you interested in?',
          options: ['Materials', 'Equipment', 'Labor', 'Services', 'Knowledge', 'Certification', 'Other'],
          placeholder: 'Select preferred resource types'
        },
        {
          name: 'delivery',
          type: 'Enum',
          required: true,
          question: 'Who handles delivery?',
          options: ['Buyer Pickup', 'Seller Delivery', 'Negotiable'],
          placeholder: 'Select delivery method'
        },
        {
          name: 'paymentTerms',
          type: 'Enum',
          required: false,
          conditional: { field: 'transactionType', value: ['Sell', 'Rent', 'Buy'] },
          question: 'What are the payment terms?',
          options: ['Upfront', 'On Delivery', 'Installments'],
          placeholder: 'Select payment terms'
        },
        {
          name: 'urgency',
          type: 'Enum',
          required: true,
          question: 'How urgent is this?',
          options: ['Immediate', 'Within 1 Week', 'Within 1 Month', 'Flexible'],
          placeholder: 'Select urgency level'
        }
      ],
      matchingMetrics: [
        { name: 'timelineAlignment', weight: 0.40 },
        { name: 'geographicProximity', weight: 0.35 },
        { name: 'barterCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    // Model 4: Hiring a Resource
    '4.1': {
      id: '4.1',
      name: 'Professional Hiring',
      category: 'Hiring a Resource',
      description: 'Full-time, part-time, or contract employment of professionals for ongoing work.',
      applicability: ['B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'jobTitle',
          type: 'String',
          maxLength: 100,
          required: true,
          question: 'What is the job title?',
          placeholder: 'Enter job title'
        },
        {
          name: 'jobCategory',
          type: 'Enum',
          required: true,
          question: 'What category?',
          options: ['Engineering', 'Project Management', 'Architecture', 'Quantity Surveying', 'Site Supervision', 'Safety', 'Other'],
          placeholder: 'Select job category'
        },
        {
          name: 'employmentType',
          type: 'Enum',
          required: true,
          question: 'What type of employment?',
          options: ['Full-Time', 'Part-Time', 'Contract', 'Freelance', 'Temporary'],
          placeholder: 'Select employment type'
        },
        {
          name: 'contractDuration',
          type: 'Integer',
          required: false,
          conditional: { field: 'employmentType', value: ['Contract', 'Temporary'] },
          question: 'How long is the contract?',
          placeholder: 'Enter contract duration in months',
          min: 1
        },
        {
          name: 'jobDescription',
          type: 'Text',
          maxLength: 2000,
          required: true,
          question: 'Describe the role and responsibilities',
          placeholder: 'Provide detailed job description...'
        },
        {
          name: 'requiredQualifications',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What qualifications are required?',
          placeholder: 'Add qualifications (Degree, certifications, licenses)'
        },
        {
          name: 'requiredExperience',
          type: 'Integer',
          required: true,
          question: 'How many years of experience required?',
          placeholder: 'Enter years of experience',
          min: 0
        },
        {
          name: 'requiredSkills',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What skills are required?',
          placeholder: 'Add required skills'
        },
        {
          name: 'preferredSkills',
          type: 'Array',
          itemType: 'String',
          required: false,
          question: 'What skills are preferred but not required?',
          placeholder: 'Add preferred skills'
        },
        {
          name: 'location',
          type: 'String',
          required: true,
          question: 'Where is the job located?',
          placeholder: 'Enter work location'
        },
        {
          name: 'workMode',
          type: 'Enum',
          required: true,
          question: 'What is the work mode?',
          options: ['On-Site', 'Remote', 'Hybrid'],
          placeholder: 'Select work mode'
        },
        {
          name: 'salaryRange',
          type: 'CurrencyRange',
          required: true,
          question: 'What is the salary range?',
          placeholder: 'Enter salary range (Monthly or annual)',
          currency: 'SAR'
        },
        {
          name: 'benefits',
          type: 'Array',
          itemType: 'String',
          required: false,
          question: 'What benefits are offered?',
          placeholder: 'Add benefits (Health insurance, housing, transportation, etc.)'
        },
        {
          name: 'startDate',
          type: 'Date',
          required: true,
          question: 'When should the employee start?',
          placeholder: 'Select start date'
        },
        {
          name: 'reportingTo',
          type: 'String',
          required: false,
          question: 'Who will this person report to?',
          placeholder: 'Enter manager/supervisor name'
        },
        {
          name: 'teamSize',
          type: 'Integer',
          required: false,
          question: 'How large is the team?',
          placeholder: 'Enter team size',
          min: 1
        },
        {
          name: 'applicationDeadline',
          type: 'Date',
          required: false,
          question: 'What is the application deadline?',
          placeholder: 'Select application deadline'
        }
      ],
      matchingMetrics: [
        { name: 'qualificationSkillMatch', weight: 0.50 },
        { name: 'availability', weight: 0.25 },
        { name: 'budgetSalaryCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    '4.2': {
      id: '4.2',
      name: 'Consultant Hiring',
      category: 'Hiring a Resource',
      description: 'Engaging consultants for advisory services, expert opinions, specialized analysis, or short-term professional services.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'consultationTitle',
          type: 'String',
          maxLength: 100,
          required: true,
          question: 'What type of consultation do you need?',
          placeholder: 'Enter consultation title'
        },
        {
          name: 'consultationType',
          type: 'Enum',
          required: true,
          question: 'What area of consultation?',
          options: ['Legal', 'Financial', 'Technical', 'Sustainability', 'Safety', 'Design', 'Project Management', 'Other'],
          placeholder: 'Select consultation type'
        },
        {
          name: 'scopeOfWork',
          type: 'Text',
          maxLength: 2000,
          required: true,
          question: 'Describe the scope of work',
          placeholder: 'Provide detailed scope of work...'
        },
        {
          name: 'deliverables',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What deliverables do you expect?',
          placeholder: 'Add deliverables (Report, analysis, recommendations, training, etc.)'
        },
        {
          name: 'duration',
          type: 'Integer',
          required: true,
          question: 'How long will this consultation take?',
          placeholder: 'Enter duration in days/weeks',
          min: 1
        },
        {
          name: 'requiredExpertise',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What expertise is required?',
          placeholder: 'Add required expertise'
        },
        {
          name: 'requiredCertifications',
          type: 'Array',
          itemType: 'String',
          required: false,
          question: 'What certifications are required?',
          placeholder: 'Add certifications (e.g., LEED AP, PMP, etc.)'
        },
        {
          name: 'experienceLevel',
          type: 'Enum',
          required: true,
          question: 'What experience level?',
          options: ['Mid-Level', 'Senior', 'Expert'],
          placeholder: 'Select experience level'
        },
        {
          name: 'locationRequirement',
          type: 'Enum',
          required: true,
          question: 'Does this require on-site presence?',
          options: ['Remote', 'On-Site', 'Hybrid'],
          placeholder: 'Select location requirement'
        },
        {
          name: 'budget',
          type: 'CurrencyRange',
          required: true,
          question: 'What is your budget?',
          placeholder: 'Enter budget (Fixed fee, hourly rate, or range)',
          currency: 'SAR'
        },
        {
          name: 'paymentTerms',
          type: 'Enum',
          required: true,
          question: 'What are the payment terms?',
          options: ['Upfront', 'Milestone-Based', 'Upon Completion'],
          placeholder: 'Select payment terms'
        },
        {
          name: 'startDate',
          type: 'Date',
          required: true,
          question: 'When do you need this to start?',
          placeholder: 'Select start date'
        },
        {
          name: 'paymentMode',
          type: 'Enum',
          required: true,
          question: 'What payment mode will you use?',
          options: ['Cash', 'Barter', 'Hybrid'],
          placeholder: 'Select payment mode',
          default: 'Cash'
        },
        {
          name: 'barterOffer',
          type: 'Text',
          maxLength: 500,
          required: false,
          conditional: { field: 'paymentMode', value: ['Barter', 'Hybrid'] },
          question: 'What are you offering in exchange?',
          placeholder: 'Describe barter offer...'
        }
      ],
      matchingMetrics: [
        { name: 'qualificationSkillMatch', weight: 0.50 },
        { name: 'availability', weight: 0.25 },
        { name: 'budgetSalaryCompatibility', weight: 0.25 }
      ],
      threshold: 80
    },

    // Model 5: Call for Competition
    '5.1': {
      id: '5.1',
      name: 'Competition/RFP',
      category: 'Call for Competition',
      description: 'Open or invited competitions where multiple parties compete for contracts, projects, or recognition.',
      applicability: ['B2B', 'B2P', 'P2B', 'P2P'],
      attributes: [
        {
          name: 'competitionTitle',
          type: 'String',
          maxLength: 150,
          required: true,
          question: 'What is the competition title?',
          placeholder: 'Enter competition title'
        },
        {
          name: 'competitionType',
          type: 'Enum',
          required: true,
          question: 'What type of competition?',
          options: ['Design Competition', 'RFP', 'RFQ', 'Solution Challenge', 'Innovation Contest', 'Other'],
          placeholder: 'Select competition type'
        },
        {
          name: 'competitionScope',
          type: 'Text',
          maxLength: 2000,
          required: true,
          question: 'Describe the scope of the competition',
          placeholder: 'Describe what is being competed for...'
        },
        {
          name: 'participantType',
          type: 'Enum',
          required: true,
          question: 'Who can participate?',
          options: ['Companies Only', 'Professionals Only', 'Both'],
          placeholder: 'Select participant type'
        },
        {
          name: 'competitionFormat',
          type: 'Enum',
          required: true,
          question: 'What format?',
          options: ['Open to All', 'Invited Only', 'Prequalified Participants'],
          placeholder: 'Select competition format'
        },
        {
          name: 'eligibilityCriteria',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What are the eligibility criteria?',
          placeholder: 'Add eligibility criteria',
          schema: {
            criterion: { type: 'String', required: true },
            type: { type: 'Enum', options: ['Experience', 'Certification', 'Financial Capacity', 'Other'], required: true }
          }
        },
        {
          name: 'submissionRequirements',
          type: 'Array',
          itemType: 'String',
          required: true,
          question: 'What must participants submit?',
          placeholder: 'Add submission requirements (Proposal, design, technical solution, pricing, etc.)'
        },
        {
          name: 'evaluationCriteria',
          type: 'Array',
          itemType: 'Object',
          required: true,
          question: 'What are the evaluation criteria?',
          placeholder: 'Add evaluation criteria',
          schema: {
            criterion: { type: 'String', required: true },
            weight: { type: 'Decimal', required: false }
          }
        },
        {
          name: 'evaluationWeights',
          type: 'Array',
          itemType: 'Decimal',
          required: true,
          question: 'What is the weight of each criterion?',
          placeholder: 'Enter weights (must sum to 100%)',
          sum: 100
        },
        {
          name: 'prizeContractValue',
          type: 'Currency',
          required: true,
          question: 'What is the prize or contract value?',
          placeholder: 'Enter prize/contract value in SAR',
          currency: 'SAR'
        },
        {
          name: 'numberOfWinners',
          type: 'Integer',
          required: true,
          question: 'How many winners will be selected?',
          placeholder: 'Enter number of winners',
          min: 1
        },
        {
          name: 'submissionDeadline',
          type: 'Date',
          required: true,
          question: 'What is the submission deadline?',
          placeholder: 'Select submission deadline'
        },
        {
          name: 'announcementDate',
          type: 'Date',
          required: true,
          question: 'When will winners be announced?',
          placeholder: 'Select announcement date'
        },
        {
          name: 'competitionRules',
          type: 'Text',
          maxLength: 2000,
          required: true,
          question: 'What are the competition rules?',
          placeholder: 'Describe terms and conditions...'
        },
        {
          name: 'intellectualProperty',
          type: 'Enum',
          required: true,
          question: 'Who owns the IP of submissions?',
          options: ['Submitter Retains', 'Client Owns', 'Shared', 'Winner Transfers'],
          placeholder: 'Select IP ownership'
        },
        {
          name: 'submissionFee',
          type: 'Currency',
          required: false,
          question: 'Is there a submission fee?',
          placeholder: 'Enter submission fee if applicable',
          currency: 'SAR'
        }
      ],
      matchingMetrics: [
        { name: 'technical', weight: 0.40 },
        { name: 'price', weight: 0.30 },
        { name: 'innovation', weight: 0.30 }
      ],
      threshold: 80
    }
  };

  // ============================================
  // Model Categories
  // ============================================

  const MODEL_CATEGORIES = {
    '1': {
      id: '1',
      name: 'Project-Based Collaboration',
      description: 'Partnerships formed to deliver specific projects or defined objectives with a clear start and end point.',
      subModels: ['1.1', '1.2', '1.3', '1.4']
    },
    '2': {
      id: '2',
      name: 'Strategic Partnerships',
      description: 'Long-term alliances formed for ongoing collaboration, mutual growth, and strategic objectives.',
      subModels: ['2.1', '2.2', '2.3']
    },
    '3': {
      id: '3',
      name: 'Resource Pooling & Sharing',
      description: 'Collaboration focused on pooling financial resources, co-owning assets, or sharing/exchanging excess resources.',
      subModels: ['3.1', '3.2', '3.3']
    },
    '4': {
      id: '4',
      name: 'Hiring a Resource',
      description: 'Recruiting professionals or consultants for employment or service engagements.',
      subModels: ['4.1', '4.2']
    },
    '5': {
      id: '5',
      name: 'Call for Competition',
      description: 'Competitive sourcing of solutions, designs, or talent through open or invited competitions.',
      subModels: ['5.1']
    }
  };

  // ============================================
  // Model Enhancement: Add Product Vision Support
  // ============================================

  /**
   * Enhance model with intentType and paymentMode support
   * @param {Object} model - Model definition
   * @returns {Object} - Enhanced model
   */
  function enhanceModelWithProductVision(model) {
    if (!model) return model;

    // Add intentType support (default: BOTH for collaboration models)
    if (!model.supportedIntentTypes) {
      model.supportedIntentTypes = ['REQUEST_SERVICE', 'OFFER_SERVICE', 'BOTH'];
    }

    // Add paymentMode support (default: all modes)
    if (!model.supportedPaymentModes) {
      model.supportedPaymentModes = ['Cash', 'Equity', 'ProfitSharing', 'Barter', 'Hybrid'];
    }

    // Add intentType attribute if not present
    const hasIntentType = model.attributes && model.attributes.some(attr => attr.name === 'intentType');
    if (!hasIntentType) {
      model.attributes = model.attributes || [];
      model.attributes.unshift({
        name: 'intentType',
        type: 'Enum',
        required: true,
        question: 'What is your intent?',
        options: model.supportedIntentTypes,
        placeholder: 'Select intent type',
        default: 'BOTH'
      });
    }

    // Replace exchangeType with paymentMode if present, or add paymentMode
    const exchangeTypeIndex = model.attributes ? model.attributes.findIndex(attr => attr.name === 'exchangeType') : -1;
    if (exchangeTypeIndex >= 0) {
      // Replace exchangeType with paymentMode
      model.attributes[exchangeTypeIndex] = {
        name: 'paymentMode',
        type: 'Enum',
        required: true,
        question: 'What payment mode will you use?',
        options: model.supportedPaymentModes,
        placeholder: 'Select payment mode',
        default: 'Cash'
      };
    } else {
      // Add paymentMode if not present
      const hasPaymentMode = model.attributes && model.attributes.some(attr => attr.name === 'paymentMode');
      if (!hasPaymentMode) {
        const paymentModeAttr = {
          name: 'paymentMode',
          type: 'Enum',
          required: true,
          question: 'What payment mode will you use?',
          options: model.supportedPaymentModes,
          placeholder: 'Select payment mode',
          default: 'Cash'
        };
        // Insert after intentType or at beginning
        const intentTypeIndex = model.attributes ? model.attributes.findIndex(attr => attr.name === 'intentType') : -1;
        if (intentTypeIndex >= 0) {
          model.attributes.splice(intentTypeIndex + 1, 0, paymentModeAttr);
        } else {
          model.attributes = model.attributes || [];
          model.attributes.unshift(paymentModeAttr);
        }
      }
    }

    // Add barterSettlementRule for Barter/Hybrid models
    const supportsBarter = model.supportedPaymentModes.includes('Barter') || model.supportedPaymentModes.includes('Hybrid');
    if (supportsBarter) {
      const hasBarterRule = model.attributes && model.attributes.some(attr => attr.name === 'barterSettlementRule');
      if (!hasBarterRule) {
        // Find barterOffer or paymentMode field to add after
        const barterOfferIndex = model.attributes ? model.attributes.findIndex(attr => attr.name === 'barterOffer') : -1;
        const paymentModeIndex = model.attributes ? model.attributes.findIndex(attr => attr.name === 'paymentMode') : -1;
        
        const barterRuleAttr = {
          name: 'barterSettlementRule',
          type: 'Enum',
          required: false,
          conditional: { field: 'paymentMode', value: ['Barter', 'Hybrid'] },
          question: 'How should value differences be handled?',
          options: ['EQUAL_VALUE_ONLY', 'ALLOW_DIFFERENCE_WITH_CASH', 'ACCEPT_AS_IS'],
          placeholder: 'Select barter settlement rule',
          default: 'ALLOW_DIFFERENCE_WITH_CASH',
          description: 'EQUAL_VALUE_ONLY: Values must match exactly | ALLOW_DIFFERENCE_WITH_CASH: Cash component allowed | ACCEPT_AS_IS: Value difference waived'
        };

        if (barterOfferIndex >= 0) {
          model.attributes.splice(barterOfferIndex + 1, 0, barterRuleAttr);
        } else if (paymentModeIndex >= 0) {
          model.attributes.splice(paymentModeIndex + 1, 0, barterRuleAttr);
        } else {
          model.attributes = model.attributes || [];
          model.attributes.push(barterRuleAttr);
        }
      }
    }

    return model;
  }

  // Enhance all models
  Object.keys(COLLABORATION_MODELS).forEach(modelId => {
    COLLABORATION_MODELS[modelId] = enhanceModelWithProductVision(COLLABORATION_MODELS[modelId]);
  });

  // ============================================
  // Helper Functions
  // ============================================

  function getModel(modelId) {
    const model = COLLABORATION_MODELS[modelId] || null;
    return model ? enhanceModelWithProductVision(model) : null;
  }

  function getCategory(categoryId) {
    return MODEL_CATEGORIES[categoryId] || null;
  }

  function getAllModels() {
    return Object.values(COLLABORATION_MODELS);
  }

  function getAllCategories() {
    return Object.values(MODEL_CATEGORIES);
  }

  function getModelsByCategory(categoryId) {
    const category = getCategory(categoryId);
    if (!category) return [];
    return category.subModels.map(id => getModel(id)).filter(m => m !== null);
  }

  function getModelsByApplicability(relationshipType) {
    return getAllModels().filter(model => 
      model.applicability.includes(relationshipType)
    );
  }

  // ============================================
  // Export
  // ============================================

  window.CollaborationModels = {
    getModel,
    getCategory,
    getAllModels,
    getAllCategories,
    getModelsByCategory,
    getModelsByApplicability,
    MODELS: COLLABORATION_MODELS,
    CATEGORIES: MODEL_CATEGORIES
  };

})();

