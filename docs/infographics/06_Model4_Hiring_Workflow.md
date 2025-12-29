# Model 4: Hiring a Resource Workflow

## Overview

Model 4 focuses on recruiting professionals or consultants for employment or defined service engagements. It includes two sub-models: Professional Hiring (employment) and Consultant Hiring (expert advisory services).

## Portal & Role Context

**Portals:** User Portal (primary)  
**Roles & Access:**
- **Entity (B2B):** Full access to both sub-models (4.1, 4.2) - can create job postings
- **Individual (B2P/P2P):** Access to apply for jobs/consulting (4.1, 4.2)
- **Admin:** View-only access

**Sub-Model Access by Role:**
- **4.1 Professional Hiring:** Entity (create jobs), Individual (apply for jobs)
- **4.2 Consultant Hiring:** Entity (create engagements), Individual (apply as consultant)

## Model 4 High-Level Flow

```mermaid
flowchart TD
    Start([User Selects Model 4]) --> Type{Hiring Type?}
    
    Type -->|Employment| Professional[4.1 Professional Hiring]
    Type -->|Advisory| Consultant[4.2 Consultant Hiring]
    
    Professional --> ProfData[Collect Professional Hiring Attributes]
    Consultant --> ConsData[Collect Consultant Attributes]
    
    ProfData --> ProfMatch[Matching Algorithm]
    ConsData --> ConsMatch[Matching Algorithm]
    
    ProfMatch --> Results[Match Results]
    ConsMatch --> Results
    
    Results --> Review[Review Candidates]
    Review --> Interview[Interview Candidates]
    Interview --> Select[Select Candidate]
    Select --> Offer[Make Offer]
    Offer --> Accept{Offer Accepted?}
    Accept -->|Yes| Onboard[Onboard Employee]
    Accept -->|No| Results
    Onboard --> Complete[Hiring Complete]
```

## Sub-Model 4.1: Professional Hiring

### Workflow

```mermaid
sequenceDiagram
    participant Employer
    participant System
    participant Candidates
    participant Candidate
    participant HR
    
    Employer->>System: Create Job Posting
    System->>Employer: Job Title
    Employer->>System: "Senior BIM Specialist"
    
    System->>Employer: Job Description
    Employer->>System: "Lead BIM modeling for infrastructure projects..."
    
    System->>Employer: Required Qualifications
    Employer->>System: "BIM Certification, 5+ years experience"
    
    System->>Employer: Required Skills
    Employer->>System: "Revit, IFC, Navisworks"
    
    System->>Employer: Experience Level
    Employer->>System: "Senior (5-10 years)"
    
    System->>Employer: Location & Work Mode
    Employer->>System: "Riyadh, Hybrid"
    
    System->>Employer: Salary Range
    Employer->>System: "15,000 - 20,000 SAR/month"
    
    System->>Employer: Employment Type
    Employer->>System: "Full-time"
    
    System->>Employer: Start Date
    Employer->>System: "2024-03-01"
    
    System->>System: Publish Job Posting
    System->>Candidates: Match Qualified Candidates
    
    Candidates->>System: Submit Applications
    System->>Employer: Notify New Applications
    
    Employer->>System: Review Applications
    System->>Candidate: Request Interview
    
    Candidate->>Employer: Attend Interview
    Employer->>Employer: Evaluate Candidate
    
    Employer->>Candidate: Make Job Offer
    Candidate->>Employer: Accept Offer
    
    Employer->>HR: Initiate Onboarding
    HR->>Candidate: Onboarding Process
    Candidate->>System: Complete Onboarding
    System->>Employer: Employee Onboarded
```

### Key Attributes Collected

1. **Job Title:** Position name
2. **Job Description:** Detailed role description
3. **Required Qualifications:** Education, certifications
4. **Required Skills:** Technical and soft skills
5. **Experience Level:** Years of experience required
6. **Location:** Work location
7. **Work Mode:** Remote, On-Site, Hybrid
8. **Employment Type:** Full-time, Part-time, Contract
9. **Salary Range:** Minimum and maximum (SAR)
10. **Benefits:** Health insurance, etc.
11. **Start Date:** When position starts
12. **Application Deadline:** Last date to apply

### Matching Metrics

- **Qualification Match:** Education and certifications (Boolean)
- **Skill Match Score:** Required skills vs. candidate skills (0-100)
- **Experience Match:** Years of experience alignment (Boolean)
- **Availability Match:** Start date compatibility (Boolean)
- **Salary Compatibility:** Candidate expectations vs. range (Boolean)
- **Location Match:** Geographic preference alignment

## Sub-Model 4.2: Consultant Hiring

### Workflow

```mermaid
flowchart TD
    Start([Create Consultant Engagement]) --> Scope[Define Consultation Scope:<br/>- Type (Legal, Technical, etc.)<br/>- Specific Deliverables<br/>- Consultation Format]
    
    Scope --> Requirements[Define Requirements:<br/>- Required Certifications<br/>- Expert Level<br/>- Specialized Knowledge]
    
    Requirements --> Logistics[Define Logistics:<br/>- Duration<br/>- Meeting Frequency<br/>- Delivery Format]
    
    Logistics --> Budget[Define Budget:<br/>- Total Budget<br/>- Payment Terms<br/>- Milestone Payments]
    
    Budget --> Publish[Publish Consultant Opportunity]
    Publish --> Matching[Matching Algorithm]
    
    Matching --> FindConsultants[Find Qualified Consultants]
    FindConsultants --> Review[Review Consultant Profiles]
    
    Review --> Select[Select Consultant]
    Select --> Agreement[Generate Consultant Agreement]
    
    Agreement --> Execute[Execute Consultation]
    Execute --> Deliverables[Receive Deliverables]
    
    Deliverables --> ReviewDeliverables{Deliverables<br/>Accepted?}
    ReviewDeliverables -->|Yes| Payment[Process Payment]
    ReviewDeliverables -->|No| Revise[Request Revisions]
    Revise --> Execute
    
    Payment --> Complete([Consultation Complete])
```

### Key Attributes Collected

1. **Consultation Type:** Legal, Technical, Sustainability, etc.
2. **Consultation Title:** Name of engagement
3. **Detailed Scope:** What consultant will do
4. **Deliverables:** Expected outputs (reports, analysis, etc.)
5. **Required Certifications:** LEED AP, PMP, etc.
6. **Expert Level:** Senior, Expert, Specialist
7. **Duration:** How long consultation lasts
8. **Meeting Frequency:** Weekly, monthly, as needed
9. **Delivery Format:** Reports, presentations, etc.
10. **Budget:** Total budget (SAR)
11. **Payment Terms:** Upfront, milestone, completion
12. **Timeline:** Start and end dates

### Matching Metrics

- **Certification Match:** Required certifications held (Boolean)
- **Expertise Match:** Relevant experience in consultation type
- **Availability Match:** Consultant available for duration
- **Budget Compatibility:** Consultant rates within budget
- **Past Performance:** Previous consultation ratings

## Complete Model 4 Data Flow

```mermaid
sequenceDiagram
    participant Employer
    participant Wizard
    participant DataCollector
    participant MatchingEngine
    participant Candidates
    participant HRSystem
    participant Storage
    
    Employer->>Wizard: Select Model 4
    Wizard->>Employer: Hiring Type?
    Employer->>Wizard: Professional or Consultant
    
    Wizard->>DataCollector: Start Data Collection
    loop For Each Attribute
        Wizard->>Employer: Ask Hiring Question
        Employer->>Wizard: Provide Answer
        Wizard->>DataCollector: Store Attribute
    end
    
    DataCollector->>DataCollector: Validate Hiring Attributes
    DataCollector->>MatchingEngine: Trigger Candidate Matching
    
    MatchingEngine->>MatchingEngine: Filter by Qualifications
    MatchingEngine->>MatchingEngine: Calculate Skill Match Scores
    MatchingEngine->>MatchingEngine: Check Availability
    MatchingEngine->>MatchingEngine: Verify Budget Compatibility
    
    MatchingEngine->>Candidates: Notify Qualified Candidates
    Candidates->>Employer: Submit Applications
    
    Employer->>Employer: Review Applications
    Employer->>Candidates: Request Interviews
    
    Candidates->>Employer: Attend Interviews
    Employer->>Employer: Evaluate Candidates
    
    Employer->>Candidates: Select Candidate
    Employer->>HRSystem: Initiate Offer Process
    
    alt Professional Hiring
        HRSystem->>Candidates: Make Job Offer
        Candidates->>Employer: Accept Offer
        HRSystem->>HRSystem: Generate Employment Contract
        HRSystem->>Storage: Store Employment Record
    else Consultant Hiring
        HRSystem->>Candidates: Make Consultant Offer
        Candidates->>Employer: Accept Offer
        HRSystem->>HRSystem: Generate Consultant Agreement
        HRSystem->>Storage: Store Consultant Engagement
    end
    
    Storage->>Employer: Hiring Process Complete
```

## Candidate Matching Algorithm

### For Professional Hiring (4.1)
```
Professional Match Score = 
  (Qualification Match × 0.30) +
  (Skill Match × 0.40) +
  (Experience Match × 0.20) +
  (Availability Match × 0.10)

Qualification Match: Boolean (all required qualifications met)
Skill Match: Percentage of required skills possessed
Experience Match: Boolean (meets minimum experience)
Availability Match: Boolean (available for start date)

Threshold: Score >= 80% for top candidate recommendation
```

### For Consultant Hiring (4.2)
```
Consultant Match Score = 
  (Certification Match × 0.30) +
  (Expertise Match × 0.35) +
  (Past Performance × 0.20) +
  (Availability Match × 0.15)

Certification Match: Boolean (all required certifications held)
Expertise Match: Relevant experience in consultation type
Past Performance: Average rating from previous consultations
Availability Match: Boolean (available for engagement duration)

Threshold: Score >= 75% for consultant recommendation
```

## Candidate Evaluation Process

```mermaid
flowchart TD
    Application[Application Received] --> InitialScreen[Initial Screening:<br/>- Qualifications Check<br/>- Skill Match<br/>- Experience Verification]
    
    InitialScreen --> Qualified{Meets Minimum<br/>Requirements?}
    Qualified -->|No| Reject[Reject Application]
    Qualified -->|Yes| Shortlist[Add to Shortlist]
    
    Shortlist --> Review[Detailed Review:<br/>- Resume Analysis<br/>- Portfolio Review<br/>- Reference Check]
    
    Review --> Interview[Schedule Interview]
    Interview --> Evaluate[Evaluate Interview:<br/>- Technical Skills<br/>- Communication<br/>- Cultural Fit]
    
    Evaluate --> Decision{Hiring Decision}
    Decision -->|Select| Offer[Make Offer]
    Decision -->|Reject| Reject
    Decision -->|Maybe| AdditionalReview[Additional Review]
    AdditionalReview --> Decision
    
    Offer --> Response{Offer Response}
    Response -->|Accept| Onboard[Onboard Candidate]
    Response -->|Reject| Shortlist
    Response -->|Negotiate| Negotiate[Salary Negotiation]
    Negotiate --> Response
    
    Onboard --> Complete([Hiring Complete])
```

## Key Requirements by Role Type

### For Professional Hiring
- **Saudi Council of Engineers (SCE) Registration:** Required for engineering roles
- **Professional License:** Valid professional license
- **Work Authorization:** Right to work in Saudi Arabia
- **Background Check:** May be required for sensitive positions
- **Medical Clearance:** For on-site construction roles

### For Consultant Hiring
- **Expert Certifications:** LEED AP, PMP, etc. as specified
- **Portfolio:** Past project examples
- **References:** Professional references
- **Availability:** Confirmed availability for engagement period
- **NDA Compliance:** For confidential projects

## Outcomes

### Successful Professional Hiring
- Qualified candidate selected
- Employment contract generated
- Onboarding process initiated
- Employee integrated into team
- Performance tracking begins

### Successful Consultant Hiring
- Expert consultant selected
- Consultant agreement generated
- Consultation engagement begins
- Deliverables received and reviewed
- Payment processed upon completion

---

*Model 4 streamlines the hiring process for both employment and consulting engagements, ensuring qualified candidates are matched with appropriate opportunities.*

