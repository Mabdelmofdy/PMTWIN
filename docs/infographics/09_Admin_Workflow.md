# Admin Portal Workflow

## Overview

The Admin Portal provides governance, vetting, moderation, and analytics capabilities for PMTwin platform operators. This document details all admin workflows including user vetting, marketplace moderation, reporting, and audit trail management.

## Portal & Role Context

**Portals:** Admin Portal (exclusive)  
**Roles:** Admin only (restricted access)  
**User Types:** N/A (Admin is platform operator, not a user type)

**Admin Capabilities:**
- Full access to all platform data
- User vetting and approval/rejection
- Marketplace moderation (projects, proposals)
- Analytics and reporting
- Audit trail management
- System settings configuration

**Restrictions:**
- Cannot create projects or submit proposals
- Cannot participate in collaborations
- View-only access to user features (for moderation)

## Admin Portal High-Level Flow

```mermaid
flowchart TD
    AdminLogin[Admin Login] --> Dashboard[Admin Dashboard]
    
    Dashboard --> Vetting[Vetting Module]
    Dashboard --> Moderation[Moderation Module]
    Dashboard --> Reports[Reports & Analytics]
    Dashboard --> Audit[Audit Trail]
    
    Vetting --> ReviewUsers[Review Pending Users]
    ReviewUsers --> Approve[Approve User]
    ReviewUsers --> Reject[Reject User]
    
    Moderation --> ReviewProjects[Review Flagged Projects]
    ReviewProjects --> ApproveProject[Approve Project]
    ReviewProjects --> RemoveProject[Remove Project]
    
    Reports --> GenerateReports[Generate Analytics Reports]
    GenerateReports --> ViewMetrics[View Platform Metrics]
    
    Audit --> ViewAudit[View Audit Logs]
    ViewAudit --> ExportAudit[Export Audit Data]
```

## User Vetting Workflow

```mermaid
sequenceDiagram
    participant User
    participant System
    participant VettingQueue
    participant Admin
    participant Storage
    participant Notification
    
    User->>System: Submit Registration
    System->>Storage: Save User (status: pending)
    System->>VettingQueue: Add to Vetting Queue
    
    Admin->>VettingQueue: View Pending Users
    VettingQueue->>Admin: Display User List
    
    Admin->>Admin: Select User to Review
    Admin->>System: View User Details
    
    System->>Admin: Display:<br/>- User Information<br/>- Uploaded Credentials<br/>- Registration Data
    
    Admin->>Admin: Review Credentials
    
    alt For Individual
        Admin->>Admin: Check:<br/>- Professional License<br/>- CV/Resume<br/>- Certifications
    else For Entity
        Admin->>Admin: Check:<br/>- Commercial Registration<br/>- VAT Certificate<br/>- Company Profile
    end
    
    Admin->>Admin: Verify Against Criteria
    
    alt Approved
        Admin->>System: Approve User
        System->>Storage: Update Status (approved)
        System->>Storage: Create Audit Log Entry
        System->>Notification: Send Approval Notification
        Notification->>User: Email/Portal Notification
        User->>System: Can Now Login
    else Rejected
        Admin->>System: Reject User
        Admin->>System: Enter Rejection Reason
        System->>Storage: Update Status (rejected)
        System->>Storage: Save Rejection Reason
        System->>Storage: Create Audit Log Entry
        System->>Notification: Send Rejection Notification
        Notification->>User: Email/Portal Notification (with reason)
    else Request More Info
        Admin->>System: Request Additional Information
        System->>Storage: Update Status (pending)
        System->>Notification: Send Info Request
        Notification->>User: Notification with Info Request
    end
```

## Marketplace Moderation Workflow

```mermaid
flowchart TD
    Start([Moderation Dashboard]) --> Flagged[View Flagged Items]
    
    Flagged --> Projects[Flagged Projects]
    Flagged --> Proposals[Flagged Proposals]
    Flagged --> Users[Flagged Users]
    
    Projects --> ReviewProject[Review Project Details]
    ReviewProject --> CheckProject{Project Valid?}
    
    CheckProject -->|Yes| ApproveProject[Approve Project]
    CheckProject -->|No| RemoveProject[Remove Project]
    CheckProject -->|Unclear| RequestInfo[Request More Information]
    
    ApproveProject --> UpdateStatus[Update Project Status]
    RemoveProject --> NotifyUser[Notify User of Removal]
    RequestInfo --> WaitResponse[Wait for User Response]
    
    Proposals --> ReviewProposal[Review Proposal]
    ReviewProposal --> CheckProposal{Proposal Valid?}
    
    CheckProposal -->|Yes| ApproveProposal[Approve Proposal]
    CheckProposal -->|No| RemoveProposal[Remove Proposal]
    
    Users --> ReviewUser[Review User Behavior]
    ReviewUser --> Action{Action Required?}
    
    Action -->|Warning| IssueWarning[Issue Warning]
    Action -->|Suspend| SuspendUser[Suspend User Account]
    Action -->|Ban| BanUser[Ban User Account]
    
    UpdateStatus --> AuditLog[Create Audit Log Entry]
    NotifyUser --> AuditLog
    ApproveProposal --> AuditLog
    RemoveProposal --> AuditLog
    IssueWarning --> AuditLog
    SuspendUser --> AuditLog
    BanUser --> AuditLog
```

## Reporting & Analytics Workflow

```mermaid
sequenceDiagram
    participant Admin
    participant Dashboard
    participant AnalyticsEngine
    participant DataWarehouse
    participant Reports
    
    Admin->>Dashboard: Access Reports Module
    Dashboard->>AnalyticsEngine: Request Platform Metrics
    
    AnalyticsEngine->>DataWarehouse: Query User Data
    DataWarehouse-->>AnalyticsEngine: User Statistics
    
    AnalyticsEngine->>DataWarehouse: Query Project Data
    DataWarehouse-->>AnalyticsEngine: Project Statistics
    
    AnalyticsEngine->>DataWarehouse: Query Transaction Data
    DataWarehouse-->>AnalyticsEngine: Transaction Statistics
    
    AnalyticsEngine->>AnalyticsEngine: Calculate Metrics:<br/>- Total Users<br/>- Active Projects<br/>- Platform Volume<br/>- Match Success Rate<br/>- Cost Savings
    
    AnalyticsEngine->>Reports: Generate Report
    Reports->>Dashboard: Display Metrics
    
    Dashboard->>Admin: Show Dashboard with:<br/>- User Growth Chart<br/>- Project Volume Chart<br/>- Revenue Metrics<br/>- Performance Indicators
    
    Admin->>Reports: Request Detailed Report
    Reports->>AnalyticsEngine: Generate Detailed Report
    AnalyticsEngine->>Reports: Return Report Data
    Reports->>Admin: Display/Export Report
```

## Audit Trail Management

```mermaid
flowchart TD
    Start([Audit Trail Module]) --> Filter[Filter Audit Logs]
    
    Filter --> ByUser[Filter by User]
    Filter --> ByAction[Filter by Action Type]
    Filter --> ByDate[Filter by Date Range]
    Filter --> ByEntity[Filter by Entity Type]
    
    ByUser --> DisplayLogs[Display Filtered Logs]
    ByAction --> DisplayLogs
    ByDate --> DisplayLogs
    ByEntity --> DisplayLogs
    
    DisplayLogs --> ViewDetails[View Log Details]
    ViewDetails --> LogInfo[Log Information:<br/>- Timestamp<br/>- User<br/>- Action<br/>- Entity<br/>- Changes<br/>- Context]
    
    LogInfo --> Export[Export Audit Data]
    Export --> CSV[Export to CSV]
    Export --> PDF[Export to PDF]
    Export --> JSON[Export to JSON]
```

## Admin Operations Flow

```mermaid
sequenceDiagram
    participant Admin
    participant AdminPortal
    participant VettingService
    participant ModerationService
    participant AnalyticsService
    participant AuditService
    participant Storage
    
    Admin->>AdminPortal: Login to Admin Portal
    AdminPortal->>Admin: Display Admin Dashboard
    
    alt Vetting Operation
        Admin->>AdminPortal: Navigate to Vetting
        AdminPortal->>VettingService: Get Pending Users
        VettingService->>Storage: Query Pending Users
        Storage-->>VettingService: Return User List
        VettingService-->>AdminPortal: Display Users
        
        Admin->>AdminPortal: Review User
        Admin->>AdminPortal: Approve/Reject Decision
        AdminPortal->>VettingService: Process Decision
        VettingService->>Storage: Update User Status
        VettingService->>AuditService: Log Action
    end
    
    alt Moderation Operation
        Admin->>AdminPortal: Navigate to Moderation
        AdminPortal->>ModerationService: Get Flagged Items
        ModerationService->>Storage: Query Flagged Items
        Storage-->>ModerationService: Return Items
        ModerationService-->>AdminPortal: Display Items
        
        Admin->>AdminPortal: Review Item
        Admin->>AdminPortal: Approve/Remove Decision
        AdminPortal->>ModerationService: Process Decision
        ModerationService->>Storage: Update Item Status
        ModerationService->>AuditService: Log Action
    end
    
    alt Analytics Operation
        Admin->>AdminPortal: Navigate to Reports
        AdminPortal->>AnalyticsService: Request Metrics
        AnalyticsService->>Storage: Aggregate Data
        Storage-->>AnalyticsService: Return Aggregated Data
        AnalyticsService->>AnalyticsService: Calculate Metrics
        AnalyticsService-->>AdminPortal: Return Metrics
        AdminPortal->>Admin: Display Analytics Dashboard
    end
    
    alt Audit Trail Operation
        Admin->>AdminPortal: Navigate to Audit Trail
        AdminPortal->>AuditService: Query Audit Logs
        AuditService->>Storage: Query Audit Data
        Storage-->>AuditService: Return Logs
        AuditService-->>AdminPortal: Display Audit Logs
        Admin->>AdminPortal: Export Audit Data
        AdminPortal->>AuditService: Generate Export
        AuditService-->>AdminPortal: Return Export File
    end
```

## Vetting Criteria

### For Individual Users
- **Professional License:** Valid and current
- **CV/Resume:** Complete and accurate
- **Certifications:** Verified credentials
- **Information Match:** Registration data matches documents
- **No Red Flags:** No suspicious activity

### For Entity Users
- **Commercial Registration (CR):** Valid and current
- **VAT Certificate:** Valid tax registration
- **Company Profile:** Complete business information
- **Financial Capacity:** Meets minimum requirements
- **No Red Flags:** No suspicious activity

## Moderation Actions

### Project Moderation
- **Approve:** Project meets platform standards
- **Remove:** Project violates terms or is inappropriate
- **Request Revision:** Project needs clarification
- **Flag for Review:** Requires additional review

### User Moderation
- **Warning:** Issue warning for minor violations
- **Suspend:** Temporarily suspend account
- **Ban:** Permanently ban account
- **Restore:** Restore previously suspended account

## Analytics Metrics

### User Metrics
- Total registered users
- Pending approvals
- Approved users
- Rejected users
- Active users (last 30 days)
- User growth trend

### Project Metrics
- Total projects created
- Active projects
- Completed projects
- Projects by model type
- Average project value
- Platform volume (total SAR)

### Matching Metrics
- Total matches generated
- Match success rate
- Average match score
- Matches by model type
- Conversion rate (match to contract)

### Financial Metrics
- Total transaction value
- Cost savings from bulk purchasing
- Barter transaction value
- Average savings per transaction

## Audit Log Entry Structure

```javascript
{
  id: "audit_123",
  timestamp: "2024-01-15T10:30:00Z",
  adminId: "admin_001",
  adminName: "Admin User",
  action: "vetting_approval",
  actionCategory: "user",
  entityType: "user",
  entityId: "user_456",
  description: "Approved user registration for Ahmed Al-Saud",
  changes: {
    before: { status: "pending" },
    after: { status: "approved" }
  },
  context: {
    userId: "user_456",
    userEmail: "ahmed@example.com",
    userRole: "individual"
  }
}
```

## Outcomes

### Successful Vetting
- User credentials verified
- Account approved
- User notified
- Access granted to portal
- Audit log created

### Successful Moderation
- Content reviewed
- Appropriate action taken
- User notified (if applicable)
- Platform quality maintained
- Audit log created

### Successful Reporting
- Metrics calculated
- Reports generated
- Insights provided
- Data exported (if requested)
- Trends identified

### Successful Audit
- Logs retrieved
- Actions traced
- Compliance verified
- Data exported
- History preserved

---

*The Admin Portal provides comprehensive governance tools to maintain platform quality, ensure compliance, and track platform performance.*

