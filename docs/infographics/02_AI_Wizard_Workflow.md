# PMTwin AI Chatbot Wizard Workflow

## Overview

The AI Chatbot Wizard is the intelligent entry point that guides users through intent identification and model selection. It uses conversational AI to understand user needs and direct them to the appropriate collaboration model (1-5) and sub-model.

## Portal & Role Context

**Portals:** Public Portal (guest access), User Portal (authenticated users)  
**Roles:** All roles can access the wizard, but model availability varies by role  
**User Types:** 
- **B2B (Entity):** Full access to all 5 models and sub-models
- **B2P/P2P (Individual):** Limited access (Task-Based, Resource Exchange, Hiring applications, Competition participation)
- **Guest:** Can use wizard for education, but cannot create opportunities

**Model Access by Role:**
- **Entity:** All models (1.1-1.4, 2.1-2.3, 3.1-3.3, 4.1-4.2, 5.1)
- **Individual:** Models 1.1, 2.3 (as mentee), 3.3, 4.1-4.2 (apply), 5.1 (participate)
- **Guest:** View-only for educational purposes

## AI Wizard Decision Flow

```mermaid
flowchart TD
    Start([User Engages AI Wizard]) --> Welcome[Welcome Message:<br/>What is your primary goal?]
    
    Welcome --> Q1{Primary Goal?}
    
    Q1 -->|Complete specific task| A1[Option A:<br/>Task/Expert Advice]
    Q1 -->|Partner for tender| A2[Option B:<br/>Bid on Large Project]
    Q1 -->|Deep partnership| A3[Option C:<br/>Shared Management]
    Q1 -->|Isolate financial risk| A4[Option D:<br/>Mega-Project/PPP]
    Q1 -->|Long-term growth| A5[Option E:<br/>Strategic Alliance]
    Q1 -->|Optimize resources| A6[Option F:<br/>Cost Savings]
    Q1 -->|Hire talent| A7[Option G:<br/>Recruitment]
    Q1 -->|Compare solutions| A8[Option H:<br/>Competition/RFP]
    
    A1 --> Model1_1[Model 1.1:<br/>Task-Based Engagement]
    A2 --> Model1_2[Model 1.2:<br/>Consortium]
    A3 --> Model1_3[Model 1.3:<br/>Project-Specific JV]
    A4 --> Model1_4[Model 1.4:<br/>Special Purpose Vehicle]
    A5 --> Model2[Model 2:<br/>Strategic Partnerships]
    A6 --> Model3[Model 3:<br/>Resource Pooling]
    A7 --> Model4[Model 4:<br/>Hiring]
    A8 --> Model5[Model 5:<br/>Competition]
    
    Model1_1 --> Collect1[Collect Task Attributes]
    Model1_2 --> Collect2[Collect Consortium Attributes]
    Model1_3 --> Collect3[Collect JV Attributes]
    Model1_4 --> Collect4[Collect SPV Attributes]
    Model2 --> Collect5[Collect Strategic Attributes]
    Model3 --> Collect6[Collect Resource Attributes]
    Model4 --> Collect7[Collect Hiring Attributes]
    Model5 --> Collect8[Collect Competition Attributes]
    
    Collect1 --> Match[Matching Algorithm]
    Collect2 --> Match
    Collect3 --> Match
    Collect4 --> Match
    Collect5 --> Match
    Collect6 --> Match
    Collect7 --> Match
    Collect8 --> Match
    
    Match --> Results[Display Match Results]
    Results --> Next[Next Steps]
```

## Detailed Wizard Conversation Flow

```mermaid
sequenceDiagram
    participant User
    participant Wizard as AI Chatbot
    participant NLP as Intent Analyzer
    participant ModelSelector as Model Selector
    participant DataCollector as Data Collector
    participant MatchingEngine as Matching Engine
    
    User->>Wizard: Start Conversation
    Wizard->>User: "What is your primary goal?"
    User->>Wizard: "I need to complete a specific task"
    
    Wizard->>NLP: Analyze User Intent
    NLP->>NLP: Extract Keywords:<br/>- "specific task"<br/>- "complete"
    NLP-->>Wizard: Intent: Task-Based
    
    Wizard->>ModelSelector: Select Model Based on Intent
    ModelSelector-->>Wizard: Model 1.1: Task-Based Engagement
    
    Wizard->>User: "Great! Let's set up your Task-Based Engagement.<br/>What is the task you need completed?"
    User->>Wizard: "I need a BIM specialist for 3D modeling"
    
    Wizard->>DataCollector: Store: taskTitle
    Wizard->>User: "What type of work is this?"
    User->>Wizard: "Design"
    
    Wizard->>DataCollector: Store: taskType
    Wizard->>User: "Please describe the detailed scope"
    User->>Wizard: "Create 3D models for commercial building..."
    
    Wizard->>DataCollector: Store: detailedScope
    Wizard->>User: "What is your budget range?"
    User->>Wizard: "15,000 - 20,000 SAR"
    
    Wizard->>DataCollector: Store: budgetRange
    Wizard->>User: "How many days do you expect this to take?"
    User->>Wizard: "30 days"
    
    Wizard->>DataCollector: Store: duration
    Wizard->>DataCollector: Validate All Required Fields
    
    alt All Required Fields Collected
        Wizard->>User: "Perfect! I have all the information.<br/>Would you like me to find matching professionals?"
        User->>Wizard: "Yes, find matches"
        
        Wizard->>MatchingEngine: Trigger Matching with Collected Data
        MatchingEngine->>MatchingEngine: Calculate Skill Match Scores
        MatchingEngine-->>Wizard: Return Top Matches (>80%)
        
        Wizard->>User: "I found 5 professionals matching your requirements.<br/>Top match: 92% compatibility"
        Wizard->>User: Display Match Results
    else Missing Required Fields
        Wizard->>User: "I need a bit more information.<br/>[Ask for missing field]"
    end
```

## Intent Identification Logic

```mermaid
flowchart LR
    UserInput[User Input Text] --> KeywordExtract[Extract Keywords]
    KeywordExtract --> IntentMatch{Match Intent Patterns}
    
    IntentMatch -->|task, specific, expert| TaskIntent[Task-Based Intent]
    IntentMatch -->|tender, bid, consortium| ConsortiumIntent[Consortium Intent]
    IntentMatch -->|partnership, joint venture| JVIntent[JV Intent]
    IntentMatch -->|mega-project, PPP, 50M+| SPVIntent[SPV Intent]
    IntentMatch -->|strategic, long-term, 10+ years| StrategicIntent[Strategic Intent]
    IntentMatch -->|bulk, purchase, share| ResourceIntent[Resource Intent]
    IntentMatch -->|hire, recruit, employment| HiringIntent[Hiring Intent]
    IntentMatch -->|competition, RFP, contest| CompetitionIntent[Competition Intent]
    
    TaskIntent --> Model1_1[Model 1.1]
    ConsortiumIntent --> Model1_2[Model 1.2]
    JVIntent --> Model1_3[Model 1.3]
    SPVIntent --> Model1_4[Model 1.4]
    StrategicIntent --> Model2[Model 2]
    ResourceIntent --> Model3[Model 3]
    HiringIntent --> Model4[Model 4]
    CompetitionIntent --> Model5[Model 5]
```

## Model Selection Decision Tree

```mermaid
graph TD
    Start[User Intent] --> Q1{Project Duration?}
    
    Q1 -->|Short-term < 1 year| Q2{Project Type?}
    Q1 -->|Long-term 10+ years| Strategic[Model 2: Strategic]
    
    Q2 -->|Single Task| Task[Model 1.1: Task-Based]
    Q2 -->|Multiple Partners| Q3{Legal Structure?}
    
    Q3 -->|Temporary Alliance| Consortium[Model 1.2: Consortium]
    Q3 -->|Shared Management| Q4{Project Value?}
    
    Q4 -->|Less than 50M SAR| JV[Model 1.3: Project JV]
    Q4 -->|50M+ SAR| SPV[Model 1.4: SPV]
    
    Start --> Q5{Resource Focus?}
    Q5 -->|Cost Optimization| Resource[Model 3: Resource Pooling]
    
    Start --> Q6{Talent Focus?}
    Q6 -->|Yes| Hiring[Model 4: Hiring]
    
    Start --> Q7{Competitive Sourcing?}
    Q7 -->|Yes| Competition[Model 5: Competition]
```

## Data Collection Workflow

```mermaid
flowchart TD
    ModelSelected[Model Selected] --> LoadAttributes[Load Model Attributes]
    LoadAttributes --> QuestionQueue[Initialize Question Queue]
    
    QuestionQueue --> AskQuestion[Ask Next Question]
    AskQuestion --> UserResponse[User Provides Response]
    
    UserResponse --> Validate[Validate Response]
    Validate -->|Invalid| ShowError[Show Error Message]
    ShowError --> AskQuestion
    
    Validate -->|Valid| StoreData[Store Attribute Value]
    StoreData --> CheckConditional[Check Conditional Fields]
    
    CheckConditional -->|Condition Met| AddConditional[Add Conditional Questions]
    CheckConditional -->|Condition Not Met| CheckComplete{All Required<br/>Fields Complete?}
    AddConditional --> CheckComplete
    
    CheckComplete -->|No| QuestionQueue
    CheckComplete -->|Yes| ReviewData[Review Collected Data]
    
    ReviewData --> UserConfirm{User Confirms?}
    UserConfirm -->|No| EditData[Edit Specific Fields]
    EditData --> QuestionQueue
    
    UserConfirm -->|Yes| SubmitData[Submit to Matching Engine]
    SubmitData --> GenerateListing[Generate Smart Listing]
```

## Step-by-Step Breakdown

### Stage 1: Intent Identification (Entry Point)

**Chatbot Question:** "What is the primary goal of your collaboration?"

**User Options:**
- **A:** "I need to complete a specific task or get expert advice." → Sub-Model 1.1
- **B:** "I want to partner with others to bid on a large tender or project." → Sub-Model 1.2
- **C:** "I want to form a deep, shared-management partnership for a specific project." → Sub-Model 1.3
- **D:** "I need to isolate financial risk for a multi-million dollar mega-project/PPP." → Sub-Model 1.4
- **E:** "I want to form a long-term strategic alliance (10+ years)." → Model 2
- **F:** "I want to optimize costs through bulk purchasing or resource sharing." → Model 3
- **G:** "I need to hire professionals or consultants." → Model 4
- **H:** "I want to launch a competition or RFP." → Model 5

### Stage 2: Sub-Model Logic Branches

Once the sub-model is identified, the chatbot triggers specific data-collection questions:

#### Branch 1.1: Task-Based Engagement
1. **Task Details:** "What is the task you need completed?"
2. **Scope:** "Please describe the detailed scope and deliverables."
3. **Logistics:** "What is your budget range and expected completion time (days)?"
4. **Requirements:** "Does this work require on-site presence or can it be remote?"
5. **Compensation:** "How will you compensate? (Cash, Barter, or Mixed)"

#### Branch 1.2: Consortium
1. **Project Identity:** "What is the project or tender you're pursuing?"
2. **Scale:** "What is the total project value and expected duration in months?"
3. **Role:** "Will you be the lead member of this consortium?"
4. **Needs:** "How many members do you need and what roles should they fill?"
5. **Legal/Risk:** "What liability structure will be used?"

#### Branch 1.3: Project-Specific JV
1. **Structure:** "What type of JV structure? (Contractual vs. Incorporated)"
2. **Ownership:** "How will equity and profits be split among partners?"
3. **Management:** "How will the JV be managed?"
4. **Risk:** "How will risks and liabilities be allocated?"
5. **Exit:** "What is the exit strategy after project completion?"

#### Branch 1.4: Special Purpose Vehicle
1. **Financial Threshold:** "Is the total project value at least 50M SAR?"
2. **Funding:** "How much debt financing is required and what is the debt type?"
3. **Revenue:** "What is the revenue model?"
4. **Governance:** "What board composition and management team do you envision?"

### Stage 3: Matching & Closing

After gathering attributes:
1. **Metric Calculation:** System runs algorithms (Skill Match Score, Financial Capacity, etc.)
2. **Smart Contract Prep:** "Would you like me to generate a draft Smart Contract?"
3. **Educational Support:** For SPVs, attach guides and regulatory checklists

## Key Attributes Collected by Model

### Model 1.1: Task-Based
- Task Title
- Task Type (Design, Engineering, Consultation, etc.)
- Detailed Scope
- Duration (days)
- Budget Range
- Required Skills
- Location Requirement (Remote/On-Site)
- Compensation Type (Cash/Barter/Mixed)

### Model 1.2: Consortium
- Project Title
- Project Value
- Tender Deadline
- Lead Member Role
- Required Member Roles
- Scope Division Method
- Liability Structure
- Payment Distribution

### Model 1.3: Project JV
- Project Details
- JV Structure (Contractual/Incorporated)
- Equity Split
- Capital Contribution
- Management Structure
- Profit Distribution
- Risk Allocation
- Exit Strategy

### Model 1.4: SPV
- Project Value (must be 50M+ SAR)
- Debt Financing Requirements
- Revenue Model
- Governance Structure
- Regulatory Approvals Needed

## Matching Metrics

The wizard informs users about matching criteria:

| Sub-Model | Primary Matching Metric | Calculation Logic |
|-----------|------------------------|-------------------|
| Task-Based | Skill Match Score | Weighted average of skills, experience, location |
| Consortium | Scope Match Score | Alignment of required roles and capabilities |
| JV | Complementary Capabilities | What each partner brings to the partnership |
| SPV | Financial Capacity | Equity contribution ability and sector expertise |
| Strategic | Strategic Alignment | Long-term goal compatibility |
| Resource Pooling | Timeline Alignment | Delivery/usage schedule overlap |
| Hiring | Qualification Match | Skills, experience, certifications |
| Competition | Eligibility Match | Meets participant requirements |

## Outcomes

### Successful Wizard Completion
- User data collected and validated
- Appropriate model selected
- Smart listing generated
- Matching algorithm triggered
- User notified of next steps

### Incomplete Wizard
- Data saved as draft
- User can resume later
- Progress indicator shown

### Educational Support
- Model-specific guides provided
- Regulatory checklists (for SPVs)
- Best practices documentation
- FAQ links

---

*The AI Wizard provides intelligent, conversational guidance to help users find the right collaboration model for their needs.*

