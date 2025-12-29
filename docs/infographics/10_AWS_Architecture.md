# PMTwin AWS Technology Architecture

## Overview

This document details the complete AWS serverless architecture for the PMTwin platform, designed to support the complex data demands of 5 collaboration models, AI-guided user experience, and real-time algorithmic matching.

## AWS Architecture Diagram

```mermaid
flowchart TB
    subgraph Client["Layer 1: Frontend & User Experience"]
        WebApp[Web Application<br/>React SPA]
        MobileApp[Mobile App<br/>iOS/Android]
    end
    
    subgraph CDN["Content Delivery"]
        CloudFront[Amazon CloudFront<br/>CDN]
        S3Static[S3 Bucket<br/>Static Assets]
    end
    
    subgraph Auth["Authentication"]
        Cognito[Amazon Cognito<br/>User Authentication<br/>& Authorization]
    end
    
    subgraph API["Layer 2: API & Intelligent Routing"]
        APIGateway[API Gateway<br/>RESTful & WebSocket]
        WAF[AWS WAF<br/>Web Application Firewall]
        Lex[Amazon Lex<br/>AI Chatbot Wizard]
    end
    
    subgraph Compute["Layer 3: Backend Compute & Matching Engine"]
        Lambda1[Lambda: Model 1 Service<br/>Projects, Consortia, SPV]
        Lambda2[Lambda: Model 2 Service<br/>Strategic JVs, Mentorship]
        Lambda3[Lambda: Model 3 Service<br/>Resource Pooling, Barter]
        Lambda4[Lambda: Model 4 & 5 Services<br/>Hiring, Competition]
        MatchingEngine[Lambda: Matching Engine<br/>Algorithmic Matching]
        ContractGen[Lambda: Smart Contract Generator<br/>Agreement Automation]
        StepFunctions[AWS Step Functions<br/>Workflow Orchestration]
    end
    
    subgraph Storage["Layer 4: Data Storage & Analytics"]
        Aurora[Amazon Aurora Serverless<br/>PostgreSQL Database]
        S3Docs[S3: Document Storage<br/>Contracts, RFPs, Images]
        Kinesis[Amazon Kinesis<br/>Data Streams]
        Glue[AWS Glue<br/>ETL Processing]
        Athena[Amazon Athena<br/>Query Service]
        QuickSight[Amazon QuickSight<br/>Analytics Dashboards]
    end
    
    WebApp --> CloudFront
    MobileApp --> CloudFront
    CloudFront --> S3Static
    CloudFront --> APIGateway
    
    WebApp --> Cognito
    MobileApp --> Cognito
    
    APIGateway --> WAF
    WAF --> Lex
    WAF --> Lambda1
    WAF --> Lambda2
    WAF --> Lambda3
    WAF --> Lambda4
    WAF --> MatchingEngine
    WAF --> ContractGen
    
    Lambda1 --> StepFunctions
    Lambda2 --> StepFunctions
    Lambda3 --> StepFunctions
    Lambda4 --> StepFunctions
    MatchingEngine --> StepFunctions
    
    Lambda1 --> Aurora
    Lambda2 --> Aurora
    Lambda3 --> Aurora
    Lambda4 --> Aurora
    MatchingEngine --> Aurora
    ContractGen --> Aurora
    
    Lambda1 --> S3Docs
    Lambda2 --> S3Docs
    Lambda3 --> S3Docs
    Lambda4 --> S3Docs
    ContractGen --> S3Docs
    
    Lambda1 --> Kinesis
    Lambda2 --> Kinesis
    Lambda3 --> Kinesis
    Lambda4 --> Kinesis
    
    Kinesis --> Glue
    Glue --> Athena
    Athena --> QuickSight
```

## Layer-by-Layer Breakdown

### Layer 1: Frontend & User Experience

```mermaid
flowchart LR
    subgraph Frontend["Frontend Layer"]
        React[React SPA<br/>Single Page Application]
        Mobile[Mobile App<br/>React Native]
    end
    
    subgraph CDNLayer["CDN Layer"]
        CloudFrontCDN[CloudFront<br/>Global CDN]
        S3Bucket[S3 Bucket<br/>Static Hosting]
    end
    
    subgraph AuthLayer["Auth Layer"]
        CognitoAuth[Cognito<br/>Authentication]
    end
    
    React --> CloudFrontCDN
    Mobile --> CloudFrontCDN
    CloudFrontCDN --> S3Bucket
    React --> CognitoAuth
    Mobile --> CognitoAuth
```

**Components:**
- **Web Application (SPA):** React-based single-page application
- **Mobile App:** iOS/Android applications
- **CloudFront:** Global content delivery network
- **S3:** Static asset hosting
- **Cognito:** User authentication and authorization

### Layer 2: API & Intelligent Routing

```mermaid
flowchart TD
    Request[Incoming Request] --> WAF[AWS WAF<br/>Security Filtering]
    WAF --> APIGateway[API Gateway<br/>Request Routing]
    
    APIGateway --> LexRoute{AI Request?}
    LexRoute -->|Yes| Lex[Amazon Lex<br/>Chatbot Wizard]
    LexRoute -->|No| BackendRoute[Backend Services]
    
    Lex --> IntentAnalysis[Intent Analysis]
    IntentAnalysis --> ModelSelection[Model Selection]
    ModelSelection --> BackendRoute
    
    BackendRoute --> LambdaServices[Lambda Services]
```

**Components:**
- **API Gateway:** Central API management
- **WAF:** Web application firewall protection
- **Lex:** AI chatbot wizard for intent identification

### Layer 3: Backend Compute & Matching Engine

```mermaid
flowchart TB
    subgraph ModelServices["Model Services"]
        M1[Model 1 Service<br/>Project-Based]
        M2[Model 2 Service<br/>Strategic]
        M3[Model 3 Service<br/>Resource Pooling]
        M4[Model 4 & 5 Service<br/>Hiring & Competition]
    end
    
    subgraph CoreServices["Core Services"]
        Matching[Matching Engine<br/>Algorithmic Matching]
        Contracts[Contract Generator<br/>Smart Contracts]
    end
    
    subgraph Orchestration["Orchestration"]
        StepFunc[Step Functions<br/>Workflow Management]
    end
    
    M1 --> Matching
    M2 --> Matching
    M3 --> Matching
    M4 --> Matching
    
    Matching --> Contracts
    Contracts --> StepFunc
    
    M1 --> StepFunc
    M2 --> StepFunc
    M3 --> StepFunc
    M4 --> StepFunc
```

**Components:**
- **Lambda Functions:** Serverless microservices for each model
- **Matching Engine:** High-performance matching algorithm
- **Smart Contract Generator:** Automated agreement creation
- **Step Functions:** Complex workflow orchestration

### Layer 4: Data Storage & Analytics

```mermaid
flowchart TB
    subgraph StructuredData["Structured Data"]
        AuroraDB[Aurora Serverless<br/>PostgreSQL<br/>User Profiles<br/>Projects<br/>Matches]
    end
    
    subgraph UnstructuredData["Unstructured Data"]
        S3Storage[S3 Buckets<br/>Documents<br/>Images<br/>Contracts]
    end
    
    subgraph AnalyticsPipeline["Analytics Pipeline"]
        KinesisStream[Kinesis Data Streams<br/>Real-time Events]
        GlueETL[Glue ETL<br/>Data Processing]
        AthenaQuery[Athena<br/>Query Service]
        QuickSightDash[QuickSight<br/>Dashboards]
    end
    
    LambdaServices[Lambda Services] --> AuroraDB
    LambdaServices --> S3Storage
    LambdaServices --> KinesisStream
    
    KinesisStream --> GlueETL
    GlueETL --> AthenaQuery
    AthenaQuery --> QuickSightDash
```

**Components:**
- **Aurora Serverless:** Relational database (PostgreSQL)
- **S3:** Object storage for documents and media
- **Kinesis:** Real-time data streaming
- **Glue:** ETL processing
- **Athena:** Serverless query service
- **QuickSight:** Business intelligence dashboards

## Service Interactions

```mermaid
sequenceDiagram
    participant User
    participant CloudFront
    participant APIGateway
    participant Cognito
    participant Lambda
    participant Aurora
    participant S3
    participant StepFunctions
    
    User->>CloudFront: Request
    CloudFront->>APIGateway: Route Request
    
    APIGateway->>Cognito: Authenticate
    Cognito-->>APIGateway: Token Valid
    
    APIGateway->>Lambda: Invoke Service
    Lambda->>Aurora: Query Database
    Aurora-->>Lambda: Return Data
    
    Lambda->>S3: Store/Retrieve Documents
    S3-->>Lambda: Document Data
    
    Lambda->>StepFunctions: Orchestrate Workflow
    StepFunctions->>Lambda: Execute Steps
    
    Lambda-->>APIGateway: Response
    APIGateway-->>CloudFront: Response
    CloudFront-->>User: Response
```

## Data Flow Architecture

```mermaid
flowchart LR
    UserAction[User Action] --> API[API Gateway]
    API --> Lambda[Lambda Function]
    
    Lambda --> Structured{Data Type?}
    
    Structured -->|Structured| Aurora[(Aurora Database)]
    Structured -->|Unstructured| S3[(S3 Storage)]
    Structured -->|Events| Kinesis[Kinesis Streams]
    
    Kinesis --> Glue[Glue ETL]
    Glue --> DataLake[(Data Lake S3)]
    DataLake --> Athena[Athena Queries]
    Athena --> QuickSight[QuickSight Dashboards]
```

## Key Architectural Benefits

### Scalability
- **Serverless Design:** Lambda and Aurora Serverless scale automatically
- **No Idle Costs:** Pay only for actual usage
- **Traffic Spikes:** Handles large competitions without infrastructure changes

### Agility
- **Microservices:** Independent updates to specific models
- **Rapid Deployment:** CI/CD pipeline for quick releases
- **A/B Testing:** Easy to test new features

### Intelligence
- **Amazon Lex Integration:** Advanced conversational AI
- **Matching Algorithms:** Purpose-built compute for matching
- **Analytics:** Real-time insights from data streams

### Security
- **WAF Protection:** Web application firewall
- **Cognito:** Secure authentication
- **IAM:** Fine-grained access control
- **Encryption:** Data encryption at rest and in transit

## Cost Optimization

- **Aurora Serverless:** Scales to zero when not in use
- **Lambda:** Pay per invocation
- **S3:** Tiered storage for cost efficiency
- **CloudFront:** Reduced data transfer costs
- **Reserved Capacity:** For predictable workloads

---

*This AWS architecture provides a scalable, serverless foundation for the PMTwin platform, enabling efficient operation and growth.*

