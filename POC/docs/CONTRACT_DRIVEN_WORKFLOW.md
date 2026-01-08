# Contract-Driven Workflow

## Overview

The PMTwin platform uses a contract-driven workflow where all collaboration and execution flows through Contracts and Engagements. This ensures proper governance, traceability, and enforcement of business rules.

## Workflow Diagram

```mermaid
graph TB
    Beneficiary[Beneficiary/Entity]
    
    subgraph "Project Creation"
        Project[Single Project]
        MegaProject[Mega Project]
        SubProject[Sub Project]
    end
    
    subgraph "Contract Types"
        VendorContract[Vendor Contract<br/>PROJECT_CONTRACT / MEGA_PROJECT_CONTRACT]
        ServiceContract[Service Provider Contract<br/>SERVICE_CONTRACT]
        AdvisoryContract[Consultant Contract<br/>ADVISORY_CONTRACT]
        SubContract[Sub-Contract<br/>SUB_CONTRACT]
    end
    
    subgraph "Engagements"
        ProjectEngagement[Project Execution Engagement]
        ServiceEngagement[Service Delivery Engagement]
        AdvisoryEngagement[Advisory Engagement]
    end
    
    subgraph "Deliverables"
        Milestones[Milestones/Deliverables]
    end
    
    Beneficiary -->|Creates| Project
    Beneficiary -->|Creates| MegaProject
    MegaProject -->|Contains| SubProject
    
    Project -->|Awards| VendorContract
    MegaProject -->|Awards| VendorContract
    MegaProject -->|Awards| ServiceContract
    MegaProject -->|Awards| AdvisoryContract
    
    VendorContract -->|Can Create| SubContract
    SubContract -.->|Provider: SubContractor<br/>Buyer: Vendor| VendorContract
    
    VendorContract -->|Executes| ProjectEngagement
    ServiceContract -->|Executes| ServiceEngagement
    AdvisoryContract -->|Executes| AdvisoryEngagement
    
    ProjectEngagement -->|Tracks| Milestones
    ServiceEngagement -->|Tracks| Milestones
    AdvisoryEngagement -->|Tracks| Milestones
    
    ProjectEngagement -.->|Assigned To| SubProject
    ServiceEngagement -.->|Assigned To| SubProject
    
    style Beneficiary fill:#e1f5ff
    style VendorContract fill:#fff4e1
    style ServiceContract fill:#e8f5e9
    style AdvisoryContract fill:#f3e5f5
    style SubContract fill:#ffebee
    style ProjectEngagement fill:#e3f2fd
    style ServiceEngagement fill:#e8f5e9
    style AdvisoryEngagement fill:#f3e5f5
```

## Contract Types

### 1. PROJECT_CONTRACT
- **Buyer**: Beneficiary
- **Provider**: Vendor (Corporate or Individual)
- **Scope**: Single Project
- **Engagement Type**: PROJECT_EXECUTION

### 2. MEGA_PROJECT_CONTRACT
- **Buyer**: Beneficiary
- **Provider**: Vendor (Corporate or Individual)
- **Scope**: Mega Project
- **Engagement Type**: PROJECT_EXECUTION
- **Note**: Mega Projects can have multiple parallel contracts

### 3. SERVICE_CONTRACT
- **Buyer**: Beneficiary or Vendor
- **Provider**: Service Provider
- **Scope**: Service Request
- **Engagement Type**: SERVICE_DELIVERY
- **Restriction**: Service Providers cannot bid on Projects/MegaProjects directly

### 4. ADVISORY_CONTRACT
- **Buyer**: Beneficiary or Vendor
- **Provider**: Consultant
- **Scope**: Project, Mega Project, or Service Request
- **Engagement Type**: ADVISORY

### 5. SUB_CONTRACT
- **Buyer**: Vendor (must be VENDOR_CORPORATE or VENDOR_INDIVIDUAL)
- **Provider**: SubContractor
- **Scope**: Same as parent contract (PROJECT, MEGA_PROJECT, or SUB_PROJECT)
- **Parent Contract**: Must reference a PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT
- **Engagement Type**: PROJECT_EXECUTION
- **Restriction**: SubContractors cannot contract directly with Beneficiaries

## Business Rules

### SubContract Rules
1. ✅ Provider must be SUB_CONTRACTOR
2. ✅ Buyer must be VENDOR (Corporate or Individual)
3. ✅ Must have parentContractId pointing to Vendor contract
4. ✅ Parent contract must be PROJECT_CONTRACT or MEGA_PROJECT_CONTRACT
5. ✅ SubContractor cannot have direct contract with Beneficiary

### Service Provider Rules
1. ✅ Cannot bid on Projects/MegaProjects directly
2. ✅ Can only be engaged via ServiceRequest → Match → SERVICE_CONTRACT
3. ✅ Must use SERVICE_CONTRACT type
4. ✅ Scope must be SERVICE_REQUEST

### Engagement Rules
1. ✅ Must have contractId (required)
2. ✅ Contract must be SIGNED or ACTIVE
3. ✅ Engagement type must match contract type
4. ✅ Can be assigned to SubProjects, Phases, or Work Packages

### MegaProject Rules
1. ✅ Can have multiple parallel contracts simultaneously
2. ✅ Supports Vendor, Service Provider, and Consultant contracts
3. ✅ Sub-Contracts can be created under Vendor contracts

## Contract Lifecycle

```mermaid
stateDiagram-v2
    [*] --> DRAFT: Create Contract
    DRAFT --> SENT: Send for Review
    SENT --> SIGNED: Sign Contract
    SENT --> DRAFT: Revise
    SIGNED --> ACTIVE: Start Execution
    ACTIVE --> COMPLETED: Complete
    ACTIVE --> TERMINATED: Terminate
    SIGNED --> TERMINATED: Terminate
    DRAFT --> TERMINATED: Cancel
    COMPLETED --> [*]
    TERMINATED --> [*]
```

## Engagement Lifecycle

```mermaid
stateDiagram-v2
    [*] --> PLANNED: Create Engagement
    PLANNED --> ACTIVE: Start Work
    ACTIVE --> PAUSED: Pause
    PAUSED --> ACTIVE: Resume
    ACTIVE --> COMPLETED: Complete
    ACTIVE --> CANCELED: Cancel
    PLANNED --> CANCELED: Cancel
    COMPLETED --> [*]
    CANCELED --> [*]
```

## Data Flow Example: Mega Project with Multiple Contracts

```mermaid
sequenceDiagram
    participant B as Beneficiary
    participant MP as MegaProject
    participant VC as Vendor Contract
    participant SC as Service Contract
    participant AC as Advisory Contract
    participant VE as Vendor Engagement
    participant SE as Service Engagement
    participant AE as Advisory Engagement
    participant M as Milestones

    B->>MP: Create MegaProject
    B->>VC: Award Vendor Contract
    B->>SC: Create Service Contract
    B->>AC: Create Advisory Contract
    
    VC->>VC: Sign Contract
    SC->>SC: Sign Contract
    AC->>AC: Sign Contract
    
    VC->>VE: Create Project Execution Engagement
    SC->>SE: Create Service Delivery Engagement
    AC->>AE: Create Advisory Engagement
    
    VE->>M: Track Milestones
    SE->>M: Track Milestones
    AE->>M: Track Milestones
    
    VE->>VE: Complete Engagement
    SE->>SE: Complete Engagement
    AE->>AE: Complete Engagement
    
    VC->>VC: Complete Contract
    SC->>SC: Complete Contract
    AC->>AC: Complete Contract
```

## SubContract Flow

```mermaid
sequenceDiagram
    participant B as Beneficiary
    participant V as Vendor
    participant VC as Vendor Contract
    participant SC as SubContract
    participant SubC as SubContractor
    participant E as Engagement

    B->>VC: Award Vendor Contract
    VC->>VC: Sign Contract
    V->>SC: Create SubContract
    SC->>SC: Sign Contract
    SC->>E: Create Engagement
    E->>E: Execute Work
    E->>E: Complete
    SC->>SC: Complete Contract
```

## Key Constraints

1. **SubContractor Isolation**: SubContractors can only contract with Vendors, never directly with Beneficiaries
2. **Service Provider Isolation**: Service Providers cannot bid on Projects/MegaProjects; only via ServiceRequests
3. **Contract Requirement**: All engagements require a signed contract
4. **Multi-Contract Support**: MegaProjects support multiple parallel contracts across provider types
5. **Parent Contract Validation**: SubContracts must have valid parent Vendor contracts

## Migration Path

The system includes migration functions to convert existing data:

1. **Approved Proposals** → PROJECT_CONTRACT/MEGA_PROJECT_CONTRACT + Engagements
2. **Service Engagements** → SERVICE_CONTRACT + Engagements
3. **Vendor-SubContractor Relationships** → SUB_CONTRACT entities

## API Endpoints

### Contracts
- `POST /api/v1/contracts` - Create contract
- `POST /api/v1/contracts/:id/sign` - Sign contract
- `GET /api/v1/contracts/:id` - Get contract
- `GET /api/v1/mega-projects/:id/contracts` - Get all contracts for mega-project
- `GET /api/v1/projects/:id/contracts` - Get all contracts for project
- `GET /api/v1/contracts/:id/sub-contracts` - Get sub-contracts

### Engagements
- `POST /api/v1/engagements` - Create engagement
- `GET /api/v1/engagements/:id` - Get engagement
- `GET /api/v1/contracts/:id/engagements` - Get engagements for contract
- `POST /api/v1/engagements/:id/assign-scope` - Assign to scope
- `POST /api/v1/engagements/:id/complete` - Complete engagement

