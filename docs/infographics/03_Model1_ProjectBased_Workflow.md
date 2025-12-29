# Model 1: Project-Based Collaboration Workflow

## Overview

Model 1 encompasses partnerships formed to deliver specific projects with clear start and end points. It includes four sub-models: Task-Based Engagement, Consortium, Project-Specific Joint Venture, and Special Purpose Vehicle (SPV).

## Portal & Role Context

**Portals:** User Portal (primary), Mobile App (execution tracking)  
**Roles & Access:**
- **Entity (B2B):** Full access to all 4 sub-models (1.1, 1.2, 1.3, 1.4)
- **Individual (B2P/P2P):** Access to 1.1 (Task-Based) only, can join 1.2 (Consortium) as member
- **Admin:** View-only access for moderation

**Sub-Model Access by Role:**
- **1.1 Task-Based:** Entity (create & hire), Individual (apply & execute)
- **1.2 Consortium:** Entity (create & join), Individual (join as member)
- **1.3 Project JV:** Entity (create & partner), Individual (limited partnership)
- **1.4 SPV:** Entity only (50M+ SAR projects), Individual (cannot create)

## Model 1 High-Level Flow

```mermaid
flowchart TD
    Start([User Selects Model 1]) --> SubModel{Which Sub-Model?}
    
    SubModel -->|Short-term task| Task[1.1 Task-Based]
    SubModel -->|Bid on tender| Consortium[1.2 Consortium]
    SubModel -->|Deep partnership| JV[1.3 Project JV]
    SubModel -->|Mega-project 50M+| SPV[1.4 SPV]
    
    Task --> TaskData[Collect Task Attributes]
    Consortium --> ConsData[Collect Consortium Attributes]
    JV --> JVData[Collect JV Attributes]
    SPV --> SPVData[Collect SPV Attributes]
    
    TaskData --> TaskMatch[Matching Algorithm]
    ConsData --> ConsMatch[Matching Algorithm]
    JVData --> JVMatch[Matching Algorithm]
    SPVData --> SPVMatch[Matching Algorithm]
    
    TaskMatch --> Results[Match Results]
    ConsMatch --> Results
    JVMatch --> Results
    SPVMatch --> Results
    
    Results --> Select[Select Partner]
    Select --> Contract[Generate Agreement]
    Contract --> Execute[Execute Project]
    Execute --> Complete[Project Complete]
```

## Sub-Model 1.1: Task-Based Engagement

### Workflow

```mermaid
sequenceDiagram
    participant User
    participant Wizard
    participant Form
    participant Matching
    participant Professionals
    participant Contract
    
    User->>Wizard: Select Task-Based Engagement
    Wizard->>User: Ask: Task Title
    User->>Wizard: "BIM Specialist for 3D Modeling"
    
    Wizard->>User: Ask: Task Type
    User->>Wizard: "Design"
    
    Wizard->>User: Ask: Detailed Scope
    User->>Wizard: "Create 3D models for commercial building..."
    
    Wizard->>User: Ask: Duration
    User->>Wizard: "30 days"
    
    Wizard->>User: Ask: Budget Range
    User->>Wizard: "15,000 - 20,000 SAR"
    
    Wizard->>User: Ask: Required Skills
    User->>Wizard: "BIM, Revit, IFC formats"
    
    Wizard->>User: Ask: Location Requirement
    User->>Wizard: "Remote"
    
    Wizard->>User: Ask: Compensation Type
    User->>Wizard: "Fixed Price"
    
    Wizard->>Form: Submit Task Data
    Form->>Matching: Trigger Matching Algorithm
    
    Matching->>Matching: Calculate Skill Match Scores
    Matching->>Matching: Filter by Budget Compatibility
    Matching->>Matching: Check Availability
    
    Matching->>Professionals: Notify Matched Professionals (>80%)
    Professionals->>User: Submit Proposals
    
    User->>User: Review Proposals
    User->>Contract: Select Professional
    Contract->>Contract: Generate Task Agreement
    Contract->>User: Agreement Ready
```

### Key Attributes Collected

1. **Task Title:** Name of the task
2. **Task Type:** Design, Engineering, Consultation, Review, Analysis
3. **Detailed Scope:** Full description of deliverables
4. **Duration:** Expected completion time in days
5. **Budget Range:** Minimum and maximum budget (SAR)
6. **Required Skills:** List of required skills/certifications
7. **Experience Level:** Junior, Intermediate, Senior, Expert
8. **Location Requirement:** Remote, On-Site, Hybrid
9. **Compensation Type:** Fixed Price, Hourly Rate, Barter, Mixed
10. **Deliverable Format:** PDF, CAD files, Excel, etc.

### Matching Metrics

- **Skill Match Score:** Weighted average (0-100)
  - Required skills match: 40%
  - Experience level: 20%
  - Certifications: 20%
  - Past performance: 20%
- **Budget Compatibility:** Boolean (within range)
- **Availability Match:** Boolean (available for duration)

## Sub-Model 1.2: Consortium

### Workflow

```mermaid
flowchart TD
    Start([Create Consortium]) --> ProjectInfo[Project Information:<br/>- Title<br/>- Value<br/>- Tender Deadline]
    
    ProjectInfo --> Structure[Define Structure:<br/>- Lead Member Role<br/>- Required Members<br/>- Member Roles]
    
    Structure --> Operational[Operational Rules:<br/>- Scope Division<br/>- Liability Structure<br/>- Payment Distribution]
    
    Operational --> Requirements[Member Requirements:<br/>- Minimum Qualifications<br/>- Prequalification Status]
    
    Requirements --> Publish[Publish Consortium Opportunity]
    Publish --> Matching[Matching Algorithm]
    
    Matching --> FindMembers[Find Consortium Members]
    FindMembers --> Evaluate[Evaluate Member Applications]
    
    Evaluate --> SelectMembers[Select Members]
    SelectMembers --> Agreement[Generate Consortium Agreement]
    
    Agreement --> Submit[Submit Tender Bid]
    Submit --> Result{Tender Result?}
    
    Result -->|Won| Execute[Execute Project]
    Result -->|Lost| End([End Consortium])
    
    Execute --> Complete[Project Complete]
    Complete --> Dissolve[Dissolve Consortium]
```

### Key Attributes Collected

1. **Project Title:** Name of project/tender
2. **Project Value:** Total project value (SAR)
3. **Tender Deadline:** Submission deadline date
4. **Lead Member:** Will you be the lead? (Yes/No)
5. **Required Members:** Number of members needed
6. **Member Roles:** Civil, MEP, Structural, etc.
7. **Scope Division:** By Trade, Phase, or Geography
8. **Liability Structure:** Individual vs. Joint & Several
9. **Payment Distribution:** Per Scope, Proportional, Fixed Fee
10. **Prequalification Required:** Yes/No

### Matching Metrics

- **Scope Match Score:** Alignment of member capabilities with required roles
- **Financial Capacity:** Ability to handle project value
- **Past Collaboration Score:** History of successful consortia
- **Geographic Proximity:** Location relevance

## Sub-Model 1.3: Project-Specific Joint Venture

### Workflow

```mermaid
sequenceDiagram
    participant User
    participant System
    participant Partners
    participant Legal
    participant JVEntity
    
    User->>System: Create Project JV
    System->>User: Collect Project Details
    User->>System: Define JV Structure (Contractual/Incorporated)
    
    System->>User: Define Equity Split
    User->>System: "60% - 40%"
    
    System->>User: Define Capital Contribution
    User->>System: "Each partner contributes 50%"
    
    System->>User: Define Management Structure
    User->>System: "Management Committee with 3 members"
    
    System->>User: Define Profit Distribution
    User->>System: "Proportional to equity"
    
    System->>User: Define Risk Allocation
    User->>System: "Shared proportionally"
    
    System->>User: Define Exit Strategy
    User->>System: "Dissolution upon completion"
    
    System->>System: Publish JV Opportunity
    System->>Partners: Match Potential Partners
    
    Partners->>User: Submit Interest
    User->>User: Evaluate Partners
    
    User->>Partners: Select Partner
    System->>Legal: Generate JV Agreement
    
    alt Incorporated JV
        Legal->>JVEntity: Create Legal Entity (LLC/Corp)
        JVEntity->>System: Entity Created
    else Contractual JV
        Legal->>System: Contractual Agreement Ready
    end
    
    System->>User: Agreement Ready for Signing
    User->>System: Execute Project
    System->>System: Track Progress
    
    System->>System: Project Complete
    System->>System: Execute Exit Strategy
```

### Key Attributes Collected

1. **Project Details:** Title, value, duration
2. **JV Structure:** Contractual or Incorporated (LLC/Corp)
3. **Equity Split:** Percentage per partner
4. **Capital Contribution:** Amount per partner
5. **Management Structure:** Lead Partner, Committee, etc.
6. **Profit Distribution:** Method and percentages
7. **Risk Allocation:** How risks are shared
8. **Exit Strategy:** Dissolution, Buyout, etc.
9. **Dispute Resolution:** Arbitration, Mediation, etc.

### Matching Metrics

- **Complementary Capabilities:** What each partner brings
- **Financial Capacity:** Equity contribution ability
- **Risk Tolerance:** Alignment of risk preferences
- **Management Compatibility:** Management style fit

## Sub-Model 1.4: Special Purpose Vehicle (SPV)

### Workflow

```mermaid
flowchart TD
    Start([Create SPV]) --> Validate{Project Value<br/>>= 50M SAR?}
    
    Validate -->|No| Error[SPV Not Applicable<br/>Use JV Instead]
    Validate -->|Yes| ProjectDetails[Project Details:<br/>- Title<br/>- Value<br/>- Duration]
    
    ProjectDetails --> Financial[Financial Structuring:<br/>- Equity Structure<br/>- Debt Financing<br/>- Debt Type]
    
    Financial --> Governance[Governance Structure:<br/>- Board Composition<br/>- Management Team<br/>- Decision Making]
    
    Governance --> Revenue[Revenue Model:<br/>- User Fees<br/>- Government Payments<br/>- Other]
    
    Revenue --> Regulatory[Regulatory Requirements:<br/>- Approvals Needed<br/>- Compliance Checks]
    
    Regulatory --> Matching[Matching Algorithm:<br/>- Find Sponsors<br/>- Financial Capacity<br/>- Sector Expertise]
    
    Matching --> SelectSponsors[Select Sponsors]
    SelectSponsors --> Legal[Legal Structure:<br/>- LLC<br/>- Simplified Joint Stock]
    
    Legal --> Bankability[Bankability Studies]
    Bankability --> Agreement[SPV Agreement]
    Agreement --> Execute[Execute Mega-Project]
    Execute --> Complete[Project Complete]
```

### Key Attributes Collected

1. **Project Value:** Must be 50M+ SAR
2. **Project Duration:** Long-term (typically 10+ years)
3. **Equity Structure:** Percentage per sponsor
4. **Debt Financing:** Amount and type (Non-Recourse, etc.)
5. **Revenue Model:** How revenue is generated
6. **Governance Structure:** Board composition, management
7. **Risk Allocation:** How risks are isolated
8. **Regulatory Approvals:** Required approvals checklist

### Matching Metrics

- **Financial Capacity:** Equity contribution ability (must meet threshold)
- **Sector Expertise:** Relevant project experience
- **Creditworthiness:** For debt financing
- **Regulatory Compliance:** Approval history

## Complete Model 1 Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Wizard
    participant DataCollector
    participant MatchingEngine
    participant Partners
    participant ContractGen
    participant Storage
    
    User->>Wizard: Select Model 1
    Wizard->>User: Identify Sub-Model
    User->>Wizard: Select Sub-Model
    
    Wizard->>DataCollector: Start Data Collection
    loop For Each Attribute
        Wizard->>User: Ask Question
        User->>Wizard: Provide Answer
        Wizard->>DataCollector: Store Attribute
    end
    
    DataCollector->>DataCollector: Validate All Required Fields
    DataCollector->>MatchingEngine: Trigger Matching
    
    MatchingEngine->>MatchingEngine: Calculate Match Scores
    MatchingEngine->>Partners: Notify Matched Partners (>80%)
    
    Partners->>User: Submit Interest/Proposals
    User->>User: Evaluate Partners
    
    User->>Partners: Select Partner(s)
    User->>ContractGen: Request Agreement Generation
    
    ContractGen->>Storage: Retrieve Template
    ContractGen->>ContractGen: Populate with Data
    ContractGen->>User: Generate Agreement
    
    User->>User: Review & Sign Agreement
    User->>Storage: Store Signed Agreement
    User->>Storage: Create Project Record
    
    Storage->>User: Project Created Successfully
```

## Matching Algorithm Details

### For Task-Based (1.1)
```
Skill Match Score = 
  (Skills Match × 0.40) +
  (Experience Match × 0.20) +
  (Certifications Match × 0.20) +
  (Past Performance × 0.20)

Threshold: Score >= 80% for auto-notification
```

### For Consortium (1.2)
```
Scope Match Score = 
  (Role Alignment × 0.50) +
  (Financial Capacity × 0.30) +
  (Past Collaboration × 0.20)

Threshold: Score >= 80% for invitation
```

### For JV (1.3)
```
JV Compatibility Score = 
  (Complementary Capabilities × 0.40) +
  (Financial Capacity × 0.30) +
  (Risk Tolerance Alignment × 0.20) +
  (Management Compatibility × 0.10)

Threshold: Score >= 75% for recommendation
```

### For SPV (1.4)
```
SPV Match Score = 
  (Financial Capacity × 0.50) +
  (Sector Expertise × 0.30) +
  (Creditworthiness × 0.20)

Threshold: Score >= 80% AND Financial Capacity >= Threshold
```

## Outcomes

### Successful Task-Based Engagement
- Professional matched and selected
- Task agreement generated
- Project initiated
- Deliverables tracked
- Payment processed upon completion

### Successful Consortium
- Consortium members selected
- Consortium agreement generated
- Tender bid submitted
- Project execution (if won)
- Consortium dissolved upon completion

### Successful Project JV
- Partner selected
- JV agreement/entity created
- Project execution begins
- Shared management operational
- Exit strategy executed upon completion

### Successful SPV
- Sponsors selected
- SPV entity created
- Bankability studies completed
- Regulatory approvals obtained
- Mega-project execution begins
- Long-term operation and revenue generation

---

*Model 1 provides flexible collaboration structures for projects of all scales, from simple tasks to mega-projects requiring risk isolation.*

