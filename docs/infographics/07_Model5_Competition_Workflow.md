# Model 5: Call for Competition Workflow

## Overview

Model 5 focuses on competitive sourcing of solutions, designs, or talent through transparent evaluation processes. It includes RFP (Request for Proposal), design competitions, innovation challenges, and material supply competitions.

## Portal & Role Context

**Portals:** User Portal (primary)  
**Roles & Access:**
- **Entity (B2B):** Full access - can create competitions and participate
- **Individual (B2P/P2P):** Can participate in competitions, cannot create
- **Admin:** View-only access for moderation

**Sub-Model Access by Role:**
- **5.1 Competition/RFP:** Entity (create & participate), Individual (participate only)

## Model 5 High-Level Flow

```mermaid
flowchart TD
    Start([User Selects Model 5]) --> Type{Competition Type?}
    
    Type -->|Design| DesignComp[Design Competition]
    Type -->|Project Contract| RFP[RFP/RFQ]
    Type -->|Innovation| Innovation[Innovation Challenge]
    Type -->|Materials| MaterialRFQ[RFQ for Materials]
    
    DesignComp --> Setup[Setup Competition]
    RFP --> Setup
    Innovation --> Setup
    MaterialRFQ --> Setup
    
    Setup --> Criteria[Define Evaluation Criteria]
    Criteria --> Weights[Assign Evaluation Weights]
    Weights --> Eligibility[Set Participant Eligibility]
    Eligibility --> Publish[Publish Competition]
    
    Publish --> Submissions[Receive Submissions]
    Submissions --> Evaluate[Evaluate Submissions]
    Evaluate --> Score[Calculate Weighted Scores]
    Score --> Rank[Rank Participants]
    Rank --> Select[Select Winner(s)]
    Select --> Announce[Announce Results]
    Announce --> Award[Award Prize/Contract]
    Award --> Complete([Competition Complete])
```

## Competition Setup Workflow

```mermaid
sequenceDiagram
    participant Organizer
    participant System
    participant Participants
    participant Evaluators
    participant Winners
    
    Organizer->>System: Create Competition
    System->>Organizer: Competition Title
    Organizer->>System: "Sustainable Building Design Competition"
    
    System->>Organizer: Competition Type
    Organizer->>System: "Design Competition"
    
    System->>Organizer: Competition Scope
    Organizer->>System: "Design eco-friendly commercial building..."
    
    System->>Organizer: Participant Type
    Organizer->>System: "Companies and Professionals"
    
    System->>Organizer: Eligibility Requirements
    Organizer->>System: "5+ years experience, LEED certification"
    
    System->>Organizer: Submission Requirements
    Organizer->>System: "Design drawings, 3D model, cost estimate"
    
    System->>Organizer: Evaluation Criteria
    Organizer->>System: "Technical Quality, Innovation, Sustainability"
    
    System->>Organizer: Evaluation Weights
    Organizer->>System: "Technical 40%, Innovation 30%, Cost 30%"
    
    System->>Organizer: IP Rights
    Organizer->>System: "Winner transfers IP to client"
    
    System->>Organizer: Prize/Contract Value
    Organizer->>System: "500,000 SAR"
    
    System->>Organizer: Submission Deadline
    Organizer->>System: "2024-06-01"
    
    System->>Organizer: Announcement Date
    Organizer->>System: "2024-06-15"
    
    System->>System: Publish Competition
    System->>Participants: Notify Eligible Participants
    
    Participants->>System: Submit Proposals
    System->>Organizer: Track Submissions
    
    System->>Organizer: Submission Deadline Reached
    Organizer->>Evaluators: Begin Evaluation
    
    Evaluators->>System: Evaluate Each Submission
    System->>System: Calculate Weighted Scores
    
    System->>System: Rank All Submissions
    System->>Organizer: Display Rankings
    
    Organizer->>Winners: Select Winner(s)
    System->>Winners: Announce Results
    
    System->>Winners: Award Prize/Contract
    Winners->>System: Accept Award
    System->>Organizer: Competition Complete
```

## Evaluation Criteria & Weighting

### Example Evaluation Framework

```mermaid
flowchart TD
    Submission[Submission Received] --> TechEval[Technical Quality Evaluation<br/>Weight: 40%]
    Submission --> CostEval[Price Evaluation<br/>Weight: 30%]
    Submission --> ExpEval[Past Experience Evaluation<br/>Weight: 20%]
    Submission --> InnovEval[Innovation/Sustainability Evaluation<br/>Weight: 10%]
    
    TechEval --> TechScore[Technical Score: 0-100]
    CostEval --> CostScore[Cost Score: 0-100<br/>Lower is Better]
    ExpEval --> ExpScore[Experience Score: 0-100]
    InnovEval --> InnovScore[Innovation Score: 0-100]
    
    TechScore --> WeightedCalc[Calculate Weighted Score]
    CostScore --> WeightedCalc
    ExpScore --> WeightedCalc
    InnovScore --> WeightedCalc
    
    WeightedCalc --> FinalScore[Final Score =<br/>Tech×0.40 + Cost×0.30 +<br/>Exp×0.20 + Innov×0.10]
    
    FinalScore --> Ranking[Rank All Submissions]
    Ranking --> Winner[Select Winner]
```

## Key Attributes Collected

1. **Competition Title:** Name of competition
2. **Competition Type:** Design, RFP, Innovation Challenge, RFQ
3. **Competition Scope:** Detailed description of what's being competed for
4. **Participant Type:** Companies, Professionals, or Both
5. **Eligibility Requirements:**
   - Minimum qualifications
   - Required certifications
   - Financial capacity
   - Past experience
6. **Submission Requirements:** What participants must submit
7. **Evaluation Criteria:** List of criteria (Technical, Price, Experience, Innovation)
8. **Evaluation Weights:** Percentage for each criterion (must total 100%)
9. **IP Rights:** Who owns submitted solutions
10. **Prize/Contract Value:** Total value (SAR)
11. **Number of Winners:** How many winners selected
12. **Submission Deadline:** Last date to submit
13. **Announcement Date:** When winners announced
14. **Format:** Open to All or Invited Only

## Transparent Evaluation Process

```mermaid
sequenceDiagram
    participant System
    participant Evaluator
    participant Participants
    participant Audit
    
    System->>Evaluator: Submission Received
    System->>Evaluator: Begin Evaluation
    
    loop For Each Criterion
        Evaluator->>System: Score Criterion (0-100)
        System->>Audit: Log Evaluation Score
    end
    
    System->>System: Calculate Weighted Score
    System->>System: Formula:<br/>Score = Σ(Criterion Score × Weight)
    
    System->>Audit: Log Final Score
    System->>System: Rank All Submissions
    
    System->>Participants: Display Rankings (Transparent)
    Participants->>System: View Own Score & Ranking
    
    System->>Evaluator: Review Rankings
    Evaluator->>System: Select Winner(s)
    
    System->>Audit: Log Winner Selection
    System->>Participants: Announce Results
```

## Matching & Participation Logic

### Eligibility Matching

```mermaid
flowchart TD
    Participant[Participant Applies] --> CheckCert{Certifications<br/>Match?}
    CheckCert -->|No| Reject[Not Eligible]
    CheckCert -->|Yes| CheckFinancial{Financial Capacity<br/>Meets Minimum?}
    
    CheckFinancial -->|No| Reject
    CheckFinancial -->|Yes| CheckExperience{Past Experience<br/>Meets Requirement?}
    
    CheckExperience -->|No| Reject
    CheckExperience -->|Yes| CheckSector{Sector Expertise<br/>Matches?}
    
    CheckSector -->|No| Reject
    CheckSector -->|Yes| Eligible[Eligible to Participate]
    
    Eligible --> Invite[Send Invitation]
    Invite --> Submit[Participant Submits]
```

### Evaluation Metrics

| Metric | Purpose | Logic |
|--------|---------|-------|
| **Eligibility Match** | Filter participants | Boolean: Meets all required qualifications |
| **Sector Expertise** | Targeted invitations | Boolean: Has completed similar projects |
| **Capacity Match** | Ensure delivery | Boolean: Has manpower/equipment for contract value |
| **Technical Quality** | Evaluate solution | Score 0-100 based on technical merit |
| **Price Competitiveness** | Cost evaluation | Score 0-100 (lower price = higher score) |
| **Past Experience** | Track record | Score 0-100 based on relevant experience |
| **Innovation** | Creativity/sustainability | Score 0-100 based on innovation level |

## Complete Model 5 Data Flow

```mermaid
sequenceDiagram
    participant Organizer
    participant Wizard
    participant DataCollector
    participant MatchingEngine
    participant Participants
    participant EvaluationSystem
    participant Storage
    
    Organizer->>Wizard: Select Model 5
    Wizard->>Organizer: Competition Type?
    Organizer->>Wizard: Select Type (RFP, Design, etc.)
    
    Wizard->>DataCollector: Start Data Collection
    loop For Each Attribute
        Wizard->>Organizer: Ask Competition Question
        Organizer->>Wizard: Provide Answer
        Wizard->>DataCollector: Store Attribute
    end
    
    DataCollector->>DataCollector: Validate Competition Attributes
    DataCollector->>DataCollector: Verify Weights Total 100%
    
    DataCollector->>MatchingEngine: Publish Competition
    MatchingEngine->>MatchingEngine: Identify Eligible Participants
    
    MatchingEngine->>Participants: Notify Eligible Participants
    Participants->>Organizer: Submit Proposals
    
    Organizer->>EvaluationSystem: Begin Evaluation
    EvaluationSystem->>EvaluationSystem: Evaluate Each Submission
    
    loop For Each Submission
        EvaluationSystem->>EvaluationSystem: Score Each Criterion
        EvaluationSystem->>EvaluationSystem: Calculate Weighted Score
    end
    
    EvaluationSystem->>EvaluationSystem: Rank All Submissions
    EvaluationSystem->>Organizer: Display Rankings
    
    Organizer->>Participants: Select Winner(s)
    EvaluationSystem->>Storage: Store Evaluation Results
    EvaluationSystem->>Participants: Announce Results
    
    Storage->>Organizer: Competition Complete
```

## Evaluation Weight Examples

### Example 1: Technical Focus
- Technical Quality: 50%
- Price: 25%
- Past Experience: 15%
- Innovation: 10%
- **Total: 100%**

### Example 2: Cost Focus
- Price: 40%
- Technical Quality: 30%
- Past Experience: 20%
- Innovation: 10%
- **Total: 100%**

### Example 3: Innovation Focus
- Innovation/Sustainability: 40%
- Technical Quality: 30%
- Price: 20%
- Past Experience: 10%
- **Total: 100%**

## IP Rights Scenarios

### Scenario 1: Submitter Retains IP
- Participants keep ownership of their designs
- Client gets license to use winning design
- Non-winners can use their designs elsewhere

### Scenario 2: Client Owns IP
- Winner transfers all IP rights to client
- Client has full ownership and can modify
- Common for commissioned work

### Scenario 3: Winner Transfers IP
- Only winner transfers IP to client
- Non-winners retain their IP
- Client can use only winning solution

## Outcomes

### Successful Competition
- Competition published and visible
- Eligible participants notified
- Multiple submissions received
- Transparent evaluation completed
- Winner(s) selected and announced
- Prize/contract awarded
- Evaluation results logged for audit

### Competition Metrics Tracked
- Number of participants
- Number of submissions
- Average evaluation scores
- Time to complete evaluation
- Winner acceptance rate
- Contract execution rate

---

*Model 5 enables transparent, competitive sourcing through well-defined evaluation criteria and weighted scoring, ensuring fair selection of the best solutions.*

