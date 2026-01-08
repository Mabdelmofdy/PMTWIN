# Golden Seed Data - Visual Diagrams

## Overview

This document provides visual Mermaid diagrams showing the complete golden seed dataset structure, relationships, and workflow paths.

## User Roles and Relationships

```mermaid
graph TB
    subgraph "Beneficiaries"
        BA[NEOM Development Authority<br/>beneficiary@pmtwin.com]
        BB[Saudi Real Estate Company<br/>entity2@pmtwin.com]
    end
    
    subgraph "Vendors"
        VA[Alpha Construction Group<br/>vendor.alpha@pmtwin.com]
        VB[Beta Infrastructure Ltd<br/>vendor.beta@pmtwin.com]
    end
    
    subgraph "Service Providers"
        SP1[BIM Solutions Co<br/>bim@pmtwin.com]
        SP2[Quality Assurance Services<br/>qa@pmtwin.com]
        SP3[Project Planning Experts<br/>scheduler@pmtwin.com]
    end
    
    subgraph "Consultant"
        C1[Green Building Consultants<br/>consultant@pmtwin.com]
    end
    
    subgraph "Sub-Contractors"
        SC1[MEP Specialists LLC<br/>mep.sub@pmtwin.com]
        SC2[Steel Fabrication Co<br/>steel.sub@pmtwin.com]
    end
    
    BA -->|Creates| MP[MegaProject: NEOM Package]
    BB -->|Creates| P1[Project: Residential Tower]
    
    style BA fill:#e1f5ff
    style BB fill:#e1f5ff
    style VA fill:#fff4e1
    style VB fill:#fff4e1
    style SP1 fill:#e8f5e9
    style SP2 fill:#e8f5e9
    style SP3 fill:#e8f5e9
    style C1 fill:#f3e5f5
    style SC1 fill:#ffebee
    style SC2 fill:#ffebee
```

## Project Structure

```mermaid
graph TB
    MP[MegaProject: NEOM Package<br/>450M-550M SAR<br/>36 months]
    
    subgraph "SubProjects"
        SP1[SubProject A: Civil Works<br/>250M-300M SAR<br/>24 months]
        SP2[SubProject B: MEP Works<br/>200M-250M SAR<br/>18 months]
    end
    
    P1[Project: Residential Tower<br/>140M-160M SAR<br/>30 months]
    
    MP --> SP1
    MP --> SP2
    
    style MP fill:#e3f2fd
    style SP1 fill:#bbdefb
    style SP2 fill:#bbdefb
    style P1 fill:#e3f2fd
```

## Contract Relationships

```mermaid
graph TB
    subgraph "MegaProject Contracts"
        MP[MegaProject: NEOM Package]
        
        MC1[MEGA_PROJECT_CONTRACT<br/>Beneficiary A ↔ Vendor Alpha<br/>500M SAR<br/>SIGNED]
        
        SC1[SERVICE_CONTRACT 1<br/>Beneficiary A ↔ BIM Provider<br/>200K SAR<br/>SIGNED]
        
        SC2[SERVICE_CONTRACT 2<br/>Beneficiary A ↔ QA Provider<br/>100K SAR<br/>SIGNED]
        
        AC1[ADVISORY_CONTRACT<br/>Beneficiary A ↔ Consultant<br/>300K SAR<br/>SIGNED]
        
        SUB1[SUB_CONTRACT 1<br/>Vendor Alpha ↔ MEP Sub<br/>50M SAR<br/>SIGNED]
        
        SUB2[SUB_CONTRACT 2<br/>Vendor Alpha ↔ Steel Sub<br/>30M SAR<br/>SIGNED]
    end
    
    subgraph "Standalone Project Contracts"
        P1[Project: Residential Tower]
        
        PC1[PROJECT_CONTRACT<br/>Beneficiary B ↔ Vendor Beta<br/>150M SAR<br/>SIGNED]
    end
    
    MP --> MC1
    MP --> SC1
    MP --> SC2
    MP --> AC1
    
    MC1 --> SUB1
    MC1 --> SUB2
    
    P1 --> PC1
    
    style MC1 fill:#fff4e1
    style SC1 fill:#e8f5e9
    style SC2 fill:#e8f5e9
    style AC1 fill:#f3e5f5
    style SUB1 fill:#ffebee
    style SUB2 fill:#ffebee
    style PC1 fill:#fff4e1
```

## Service Request Flow

```mermaid
sequenceDiagram
    participant BA as Beneficiary A
    participant SR1 as ServiceRequest 1<br/>BIM Coordination
    participant SP1 as BIM Provider
    participant SO1 as ServiceOffer 1
    participant SC1 as SERVICE_CONTRACT 1
    participant E1 as BIM Engagement
    
    BA->>SR1: Create ServiceRequest<br/>for Civil Works
    SP1->>SR1: Submit ServiceOffer
    BA->>SO1: Accept Offer
    SO1->>SC1: Create Contract
    SC1->>SC1: Sign Contract
    SC1->>E1: Create Engagement
    E1->>E1: Execute Work
    E1->>E1: Deliver Milestones
```

## Engagement and Milestone Tracking

```mermaid
graph TB
    subgraph "MegaProject Engagements"
        E1[Mega Engagement<br/>Vendor Alpha<br/>ACTIVE]
        E2[BIM Engagement<br/>BIM Provider<br/>ACTIVE]
        E3[QA Engagement<br/>QA Provider<br/>PLANNED]
        E4[Advisory Engagement<br/>Consultant<br/>ACTIVE]
        E5[MEP Sub Engagement<br/>MEP SubContractor<br/>PLANNED]
        E6[Steel Sub Engagement<br/>Steel SubContractor<br/>ACTIVE]
    end
    
    subgraph "BIM Milestones"
        M1[Clash Report v1<br/>IN_PROGRESS]
        M2[IFC Coordination Model<br/>PENDING]
        M3[Final BIM Deliverable<br/>PENDING]
    end
    
    subgraph "QA Milestones"
        M4[Weekly Report #1-12<br/>PENDING]
        M5[NCR Closure Summary<br/>PENDING]
    end
    
    subgraph "Advisory Milestones"
        M6[Sustainability Report<br/>IN_PROGRESS]
        M7[Compliance Checklist<br/>PENDING]
    end
    
    subgraph "Vendor Milestones"
        M8[Foundation Complete<br/>PENDING]
        M9[Structure Complete<br/>PENDING]
        M10[MEP Installation Complete<br/>PENDING]
    end
    
    E2 --> M1
    E2 --> M2
    E2 --> M3
    
    E3 --> M4
    E3 --> M5
    
    E4 --> M6
    E4 --> M7
    
    E1 --> M8
    E1 --> M9
    E1 --> M10
    
    style E1 fill:#e3f2fd
    style E2 fill:#e8f5e9
    style E3 fill:#e8f5e9
    style E4 fill:#f3e5f5
    style E5 fill:#ffebee
    style E6 fill:#ffebee
```

## Complete Workflow: MegaProject with All Contract Types

```mermaid
graph TB
    BA[Beneficiary A<br/>NEOM Development Authority]
    
    MP[MegaProject<br/>NEOM Package]
    
    subgraph "Contract Layer"
        VC[MEGA_PROJECT_CONTRACT<br/>Vendor Alpha]
        SC1[SERVICE_CONTRACT<br/>BIM Provider]
        SC2[SERVICE_CONTRACT<br/>QA Provider]
        AC[ADVISORY_CONTRACT<br/>Consultant]
        SUB1[SUB_CONTRACT<br/>MEP Sub]
        SUB2[SUB_CONTRACT<br/>Steel Sub]
    end
    
    subgraph "Engagement Layer"
        VE[Vendor Engagement<br/>ACTIVE]
        SE1[BIM Engagement<br/>ACTIVE]
        SE2[QA Engagement<br/>PLANNED]
        AE[Advisory Engagement<br/>ACTIVE]
        SUBE1[MEP Sub Engagement<br/>PLANNED]
        SUBE2[Steel Sub Engagement<br/>ACTIVE]
    end
    
    subgraph "Milestone Layer"
        VM[Vendor Milestones<br/>Foundation, Structure, MEP]
        SM1[BIM Milestones<br/>Clash Report, IFC Model]
        SM2[QA Milestones<br/>Weekly Reports, NCR Summary]
        AM[Advisory Milestones<br/>Sustainability Report]
    end
    
    BA -->|Creates| MP
    MP --> VC
    MP --> SC1
    MP --> SC2
    MP --> AC
    
    VC --> SUB1
    VC --> SUB2
    
    VC --> VE
    SC1 --> SE1
    SC2 --> SE2
    AC --> AE
    SUB1 --> SUBE1
    SUB2 --> SUBE2
    
    VE --> VM
    SE1 --> SM1
    SE2 --> SM2
    AE --> AM
    
    style BA fill:#e1f5ff
    style MP fill:#e3f2fd
    style VC fill:#fff4e1
    style SC1 fill:#e8f5e9
    style SC2 fill:#e8f5e9
    style AC fill:#f3e5f5
    style SUB1 fill:#ffebee
    style SUB2 fill:#ffebee
```

## SubContractor Isolation Constraint

```mermaid
graph LR
    subgraph "Allowed Relationships"
        V[Vendor Alpha] -->|SUB_CONTRACT| SC[SubContractor]
        BA[Beneficiary A] -->|MEGA_PROJECT_CONTRACT| V
    end
    
    subgraph "Forbidden Relationships"
        BA -.->|❌ NOT ALLOWED| SC
    end
    
    style V fill:#fff4e1
    style SC fill:#ffebee
    style BA fill:#e1f5ff
```

## Service Provider Isolation Constraint

```mermaid
graph LR
    subgraph "Allowed Path"
        BA[Beneficiary A] -->|Creates| SR[ServiceRequest]
        SR -->|Matching| SP[ServiceProvider]
        SP -->|Submits| SO[ServiceOffer]
        SO -->|Accepted| SC[SERVICE_CONTRACT]
    end
    
    subgraph "Forbidden Path"
        MP[MegaProject] -.->|❌ NO DIRECT BIDDING| SP
    end
    
    style BA fill:#e1f5ff
    style SR fill:#e3f2fd
    style SP fill:#e8f5e9
    style SO fill:#c8e6c9
    style SC fill:#a5d6a7
    style MP fill:#e3f2fd
```

## Data Flow: Contract to Engagement to Milestone

```mermaid
sequenceDiagram
    participant C as Contract<br/>SIGNED
    participant E as Engagement<br/>ACTIVE
    participant M1 as Milestone 1
    participant M2 as Milestone 2
    participant M3 as Milestone 3
    
    C->>E: Create Engagement
    E->>E: Start Work
    E->>M1: Create Milestone 1
    M1->>M1: Complete
    E->>M2: Create Milestone 2
    M2->>M2: Complete
    E->>M3: Create Milestone 3
    M3->>M3: Complete
    E->>E: Complete Engagement
    C->>C: Complete Contract
```

## Role Usage Matrix

```mermaid
graph TB
    subgraph "Roles in Workflow"
        B[Beneficiary<br/>✅ Creates Projects<br/>✅ Creates ServiceRequests<br/>✅ Signs Contracts]
        V[Vendor<br/>✅ Executes Projects<br/>✅ Creates SubContracts<br/>✅ Manages SubContractors]
        SP[ServiceProvider<br/>✅ Responds to ServiceRequests<br/>✅ Provides Services<br/>❌ No Project Bidding]
        C[Consultant<br/>✅ Provides Advisory<br/>✅ Signs Advisory Contracts]
        SC[SubContractor<br/>✅ Works under Vendors<br/>❌ No Direct Beneficiary Contracts]
    end
    
    style B fill:#e1f5ff
    style V fill:#fff4e1
    style SP fill:#e8f5e9
    style C fill:#f3e5f5
    style SC fill:#ffebee
```

## Summary Statistics

The golden seed dataset demonstrates:

- **10 Users** across 5 role types
- **2 Projects** (1 MegaProject, 1 standalone)
- **2 SubProjects** within the MegaProject
- **3 ServiceRequests** with complete workflow
- **7 Contracts** covering all contract types
- **6 Engagements** for active execution
- **20+ Milestones** tracking deliverables

All constraints are enforced and validated through the validation scripts.

