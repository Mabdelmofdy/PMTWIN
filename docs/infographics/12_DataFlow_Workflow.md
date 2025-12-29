# PMTwin Data Flow & Persistence Workflow

## Overview

This document details the complete data flow from user interaction to data storage, illustrating how user actions on the frontend result in data being processed and ultimately stored in the database and object storage layers.

## End-to-End Data Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant APIGateway
    participant Auth
    participant CloudRun
    participant CloudSQL
    participant GCS
    participant PubSub
    participant BigQuery
    
    Note over User,BigQuery: Scenario A: Form Submission (Structured Data)
    User->>Frontend: Fill Form (e.g., Create Project)
    Frontend->>Frontend: Validate Form Data
    Frontend->>APIGateway: POST /api/projects (HTTPS)
    
    APIGateway->>Auth: Verify Authentication Token
    Auth-->>APIGateway: Token Valid
    
    APIGateway->>CloudRun: Route to Project Service
    CloudRun->>CloudRun: Validate Payload
    CloudRun->>CloudSQL: INSERT INTO projects
    CloudSQL-->>CloudRun: Project Created (ID returned)
    
    CloudRun->>PubSub: Publish Event (project.created)
    CloudRun-->>APIGateway: 201 Created + Project Data
    APIGateway-->>Frontend: JSON Response
    Frontend->>User: Show Success Message
    
    Note over User,BigQuery: Scenario B: File Upload (Unstructured Data)
    User->>Frontend: Upload RFP PDF
    Frontend->>APIGateway: Request Signed URL
    APIGateway->>CloudRun: Generate Signed URL
    CloudRun->>GCS: Create Signed URL
    GCS-->>CloudRun: Signed URL (time-limited)
    CloudRun-->>APIGateway: Signed URL
    APIGateway-->>Frontend: Signed URL
    
    Frontend->>GCS: Upload File Directly (using Signed URL)
    GCS-->>Frontend: Upload Complete
    
    Frontend->>APIGateway: POST /api/projects/{id}/documents
    APIGateway->>CloudRun: Store Document Metadata
    CloudRun->>CloudSQL: INSERT INTO documents (GCS path)
    CloudSQL-->>CloudRun: Document Record Created
    CloudRun-->>APIGateway: Document Saved
    APIGateway-->>Frontend: Success
    Frontend->>User: File Uploaded Successfully
    
    Note over User,BigQuery: Scenario C: Analytics Pipeline
    PubSub->>Dataflow: Stream Events
    Dataflow->>Dataflow: Transform & Enrich Data
    Dataflow->>BigQuery: Load to Data Warehouse
    BigQuery->>LookerStudio: Query for Dashboards
```

## Data Flow Architecture

```mermaid
flowchart TD
    UserAction[User Action] --> FrontendValidation[Frontend Validation]
    FrontendValidation --> APIGateway[API Gateway]
    
    APIGateway --> AuthCheck[Authentication Check]
    AuthCheck -->|Valid| RouteRequest[Route Request]
    AuthCheck -->|Invalid| Reject[Reject Request]
    
    RouteRequest --> ServiceType{Request Type?}
    
    ServiceType -->|Structured Data| CloudRunService[Cloud Run Service]
    ServiceType -->|File Upload| SignedURL[Generate Signed URL]
    
    CloudRunService --> ValidateData[Validate Data]
    ValidateData --> DataType{Data Type?}
    
    DataType -->|Structured| CloudSQL[(Cloud SQL<br/>PostgreSQL)]
    DataType -->|Unstructured| GCS[(Cloud Storage<br/>GCS)]
    DataType -->|Events| PubSub[Pub/Sub<br/>Event Stream]
    
    SignedURL --> GCS
    GCS --> StoreMetadata[Store Metadata in Cloud SQL]
    
    CloudSQL --> EventTrigger[Trigger Event]
    PubSub --> EventTrigger
    
    EventTrigger --> Dataflow[Cloud Dataflow<br/>ETL Processing]
    Dataflow --> BigQuery[(BigQuery<br/>Data Warehouse)]
    BigQuery --> Analytics[Looker Studio<br/>Analytics]
```

## Structured Data Flow (Database)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant CloudSQL
    participant Cache
    
    User->>Frontend: Submit Form Data
    Frontend->>API: POST Request with JSON
    
    API->>Service: Invoke Cloud Run Service
    Service->>Service: Validate Payload Schema
    
    Service->>CloudSQL: Begin Transaction
    CloudSQL->>CloudSQL: INSERT/UPDATE Data
    CloudSQL-->>Service: Return Record ID
    
    Service->>Cache: Invalidate Cache (if applicable)
    Service->>Service: Commit Transaction
    
    Service-->>API: Success Response
    API-->>Frontend: 201 Created
    Frontend->>User: Show Success
```

## Unstructured Data Flow (Object Storage)

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant GCS
    participant CloudSQL
    
    User->>Frontend: Select File to Upload
    Frontend->>API: Request Signed URL
    API->>Service: Generate Signed URL
    
    Service->>GCS: Create Signed URL
    Note over Service,GCS: URL valid for 15 minutes<br/>Permissions: PUT only
    GCS-->>Service: Signed URL
    Service-->>API: Return Signed URL
    API-->>Frontend: Signed URL
    
    Frontend->>GCS: Upload File Directly
    Note over Frontend,GCS: Bypasses backend<br/>Direct to GCS
    GCS-->>Frontend: Upload Success
    
    Frontend->>API: POST Document Metadata
    API->>Service: Store Metadata
    Service->>CloudSQL: INSERT INTO documents
    Note over Service,CloudSQL: Store:<br/>- GCS path<br/>- File name<br/>- File size<br/>- MIME type<br/>- Upload timestamp
    CloudSQL-->>Service: Document Record ID
    Service-->>API: Success
    API-->>Frontend: Document Saved
    Frontend->>User: Upload Complete
```

## Analytics Data Pipeline

```mermaid
flowchart LR
    UserAction[User Action] --> Event[Event Generated]
    Event --> PubSub[Pub/Sub Topic]
    
    PubSub --> Dataflow[Cloud Dataflow]
    Dataflow --> Transform[Transform & Enrich]
    Transform --> BigQuery[BigQuery Table]
    
    BigQuery --> Query[SQL Queries]
    Query --> LookerStudio[Looker Studio]
    LookerStudio --> Dashboard[Analytics Dashboard]
```

## Data Storage Strategy

### Structured Data (Cloud SQL)

```mermaid
erDiagram
    USERS ||--o{ PROJECTS : creates
    USERS ||--o{ PROPOSALS : submits
    PROJECTS ||--o{ PROPOSALS : receives
    PROJECTS ||--o{ MATCHES : generates
    USERS ||--o{ MATCHES : matched_in
    PROJECTS ||--o{ DOCUMENTS : has
    USERS ||--o{ AUDIT_LOGS : generates
    
    USERS {
        string id PK
        string email
        string role
        json profile
        string status
        timestamp created_at
    }
    
    PROJECTS {
        string id PK
        string creator_id FK
        string title
        json scope
        decimal budget_min
        decimal budget_max
        string status
        timestamp created_at
    }
    
    PROPOSALS {
        string id PK
        string project_id FK
        string provider_id FK
        string type
        json details
        string status
        timestamp submitted_at
    }
    
    MATCHES {
        string id PK
        string project_id FK
        string provider_id FK
        decimal score
        json criteria
        timestamp created_at
    }
```

### Unstructured Data (Cloud Storage)

```mermaid
flowchart TD
    GCSRoot[GCS Bucket: pmtwin-documents] --> Users[users/]
    GCSRoot --> Projects[projects/]
    GCSRoot --> Contracts[contracts/]
    GCSRoot --> Resources[resources/]
    
    Users --> UserDocs[user_id/credentials/]
    Users --> UserProfiles[user_id/profile/]
    
    Projects --> ProjectDocs[project_id/rfps/]
    Projects --> ProjectImages[project_id/images/]
    
    Contracts --> SignedContracts[contract_id/signed.pdf]
    
    Resources --> ResourceImages[resource_id/images/]
```

## Data Validation & Transformation

```mermaid
flowchart TD
    RawData[Raw Data from User] --> ValidateSchema[Validate Schema]
    ValidateSchema --> Invalid{Valid?}
    
    Invalid -->|No| Error[Return Validation Error]
    Invalid -->|Yes| Transform[Transform Data]
    
    Transform --> Normalize[Normalize Data]
    Normalize --> Enrich[Enrich with Metadata]
    
    Enrich --> Store[Store in Database]
    Store --> TriggerEvent[Trigger Event]
    TriggerEvent --> Analytics[Send to Analytics Pipeline]
```

## Data Retrieval Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Service
    participant CloudSQL
    participant GCS
    participant Cache
    
    User->>Frontend: Request Data
    Frontend->>Cache: Check Cache
    
    alt Cache Hit
        Cache-->>Frontend: Return Cached Data
    else Cache Miss
        Frontend->>API: GET Request
        API->>Service: Invoke Service
        
        Service->>CloudSQL: SELECT Query
        CloudSQL-->>Service: Return Data
        
        alt Data Includes File References
            Service->>GCS: Generate Signed URLs
            GCS-->>Service: Signed URLs
            Service->>Service: Attach URLs to Data
        end
        
        Service-->>API: Return Data
        API-->>Frontend: JSON Response
        Frontend->>Cache: Store in Cache
        Frontend->>User: Display Data
    end
```

## Key Data Flow Patterns

### Pattern 1: Create Operation
1. User submits form
2. Frontend validates
3. API Gateway routes request
4. Service validates payload
5. Cloud SQL stores data
6. Event published to Pub/Sub
7. Response returned to user

### Pattern 2: File Upload
1. User selects file
2. Frontend requests signed URL
3. Service generates signed URL from GCS
4. Frontend uploads directly to GCS
5. Frontend sends metadata to backend
6. Service stores metadata in Cloud SQL
7. Response returned to user

### Pattern 3: Read Operation
1. User requests data
2. Frontend checks cache
3. If cache miss, request to API
4. Service queries Cloud SQL
5. If files needed, generate signed URLs
6. Return data to frontend
7. Cache response

### Pattern 4: Analytics Pipeline
1. User action triggers event
2. Event published to Pub/Sub
3. Dataflow processes event
4. Data transformed and enriched
5. Loaded into BigQuery
6. Available for analytics queries
7. Displayed in Looker Studio

## Data Consistency & Integrity

```mermaid
flowchart TD
    Transaction[Transaction Start] --> Validate[Validate All Constraints]
    Validate --> Check{All Valid?}
    
    Check -->|No| Rollback[Rollback Transaction]
    Check -->|Yes| Execute[Execute Operations]
    
    Execute --> Commit[Commit Transaction]
    Commit --> Event[Publish Event]
    Event --> Analytics[Update Analytics]
    
    Rollback --> Error[Return Error]
```

## Outcomes

### Successful Data Flow
- Data validated and stored correctly
- Files uploaded to object storage
- Metadata linked in database
- Events published for analytics
- User receives confirmation

### Error Handling
- Validation errors returned immediately
- Transaction rollback on failure
- Error messages logged
- User notified of issues
- Retry mechanisms for transient failures

---

*This data flow architecture ensures reliable, scalable data processing from user interaction through storage and analytics.*

