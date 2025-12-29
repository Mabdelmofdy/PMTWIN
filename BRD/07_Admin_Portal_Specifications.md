# Admin Portal Specifications

## Overview

The Admin Portal is the command center for PMTwin platform governance, providing comprehensive tools for user management, collaboration oversight, analytics, and system configuration. This document provides complete specifications for all admin portal features and modules.

## Portal Architecture

### Access Control
- **Super Admin:** Full access to all modules including system settings
- **Admin:** Access to vetting, moderation, analytics, and reports
- **Moderator:** Limited access to moderation and basic analytics
- **Auditor:** Read-only access to audit trails and reports

### Portal Structure
```
Admin Portal
├── Dashboard (Overview & KPIs)
├── User Management
│   ├── User Vetting
│   └── User Administration
├── Content Moderation
│   ├── Project Moderation
│   └── Proposal Moderation
├── Collaboration Models Management
│   ├── Model 1: Project-Based
│   ├── Model 2: Strategic Partnerships
│   ├── Model 3: Resource Pooling
│   ├── Model 4: Hiring
│   └── Model 5: Competition
├── Analytics & Reporting
│   ├── Analytics Dashboard
│   └── Report Generation
├── Audit Trail
└── System Settings
```

## Module 1: Admin Dashboard

### 1.1 Overview Statistics

**Key Performance Indicators (KPIs):**
- Total Users (with breakdown by type)
- Active Projects
- Total Proposals
- Active Collaborations
- Platform Volume (total project value)
- Total Savings (bulk purchasing + barter)
- Pending Approvals Count
- System Health Status

**Display Format:**
- Large metric cards with icons
- Trend indicators (up/down arrows)
- Percentage changes
- Color coding (green for good, red for alerts)

### 1.2 Collaboration Models Activity Dashboard

**Per-Model Statistics:**
- Active opportunities count
- Applications received
- Success rate
- Total value/volume
- Recent activity timeline

**Visualization:**
- Model cards with key metrics
- Activity timeline
- Quick access to model management

### 1.3 Recent Activity Feed

**Activity Types:**
- New user registrations
- Project publications
- Proposal submissions
- Collaboration opportunities created
- Admin actions
- System events

**Display:**
- Chronological list
- User avatars
- Action icons
- Timestamps
- Quick action buttons

### 1.4 Quick Actions Panel

**Actions:**
- Approve Pending Users (with count badge)
- Review Flagged Projects (with count badge)
- View Pending Collaborations (with count badge)
- Generate Report
- System Settings

### 1.5 System Health Indicators

**Metrics:**
- System uptime
- Data storage usage
- Active sessions
- Error rate
- Performance metrics

## Module 2: User Management

### 2.1 User Vetting Module

**Pending Verifications Queue:**
- List of users awaiting verification
- Sort by: Submission Date, User Type, Priority
- Filter by: Individual, Entity, Date Range, Status
- Search functionality

**User Details View:**
- **User Information:**
  - Name/Company Name
  - Email, Phone
  - Registration Date
  - User Type (Individual/Entity)
  - Onboarding Stage

- **Credentials Display:**
  - For Individuals: Professional licenses, CV, certifications
  - For Entities: CR document, VAT certificate, company profile
  - File preview/download functionality
  - Verification status per credential

- **Verification Criteria Checklist:**
  - CR Valid (for entities)
  - VAT Valid (for entities)
  - Professional License Valid (for individuals)
  - Documents Complete
  - Information Matches Documents
  - No Red Flags

- **Actions:**
  - "Approve" button (with confirmation)
  - "Reject" button (requires reason)
  - "Request More Information" button
  - Comments/Notes field (internal)
  - Bulk approve/reject

**Status Updates:**
- Upon approval: User receives notification, gains portal access
- Upon rejection: User receives notification with reason
- Audit trail entry created

### 2.2 User Administration Module

**User List:**
- Complete user list with pagination (50 per page)
- Advanced filters:
  - User type (Individual, Entity, Admin)
  - Status (Pending, Approved, Rejected, Suspended, Banned)
  - Role
  - Registration date range
  - Verification status
  - Activity status (active, inactive)
- Sort options (name, email, registration date, last login)
- Search functionality (name, email, company)

**User Profile Management:**
- View complete user profile
- Edit user information
- Update user credentials
- Manage user roles
- Account status management
- Profile verification status
- Activity history

**Bulk Operations:**
- Bulk approve users
- Bulk reject users
- Bulk suspend users
- Bulk role assignment
- Bulk export user data

**User Activity History:**
- Login history
- Action history
- Project activity
- Proposal activity
- Collaboration activity
- Audit trail for user

## Module 3: Content Moderation

### 3.1 Project Moderation

**Flagged Projects List:**
- Projects reported by users
- Auto-flagged projects (low quality, suspicious)
- Sort by: Flag Date, Severity, Project Type
- Filter by: Category, Status, Date Range

**Project Review Interface:**
- Full project details display
- Flag reason(s) shown
- Reporter information (if applicable)
- Project creator information
- Quality Score (auto-calculated):
  - Completeness
  - Clarity
  - Realistic budget
  - Appropriate category

**Actions:**
- "Approve Project" (removes flag, keeps project)
- "Remove Project" (requires reason, notifies creator)
  - Options: Spam, Fraudulent, Low Quality, Other
- "Request Revision" (notifies creator to improve)
- Comments field (internal notes)

### 3.2 Proposal Moderation

**Proposal Review:**
- View all proposals or flagged proposals
- Filter by type (cash, barter), status, date
- Review proposal quality
- Approve/reject proposals
- Request revisions

## Module 4: Collaboration Models Management

### 4.1 Unified Models Dashboard

**Features:**
- Model selector (tabs or dropdown)
- Overview statistics for all models
- Recent activity across all models
- Quick filters (status, date range)
- Export all models data

### 4.2 Model 1: Project-Based Collaboration Management

#### 4.2.1 Task-Based Engagement Oversight
- View all task-based opportunities
- Filter by status, date range, creator
- Monitor task completion rates
- Review task quality and outcomes
- Approve/reject opportunities
- Statistics: Active tasks, completed tasks, average duration

#### 4.2.2 Consortium Management
- View all consortium formations
- Monitor consortium bidding activities
- Track consortium success rates
- Review consortium member compositions
- Statistics: Active consortia, bids submitted, wins

#### 4.2.3 Joint Venture (JV) Oversight
- Monitor JV formations
- Track JV project progress
- Review JV performance metrics
- Statistics: Active JVs, projects under JV

#### 4.2.4 SPV Management
- View SPV creations (50M+ SAR threshold)
- Monitor SPV project status
- Track SPV financial metrics
- Statistics: Active SPVs, total SPV value

### 4.3 Model 2: Strategic Partnerships Management

#### 4.3.1 Strategic JV Monitoring
- View all strategic JV formations
- Track long-term partnership progress
- Monitor strategic objectives achievement
- Statistics: Active strategic JVs, partnership duration

#### 4.3.2 Strategic Alliance Oversight
- Monitor alliance formations
- Track alliance activities
- Review alliance performance
- Statistics: Active alliances, alliance value

#### 4.3.3 Mentorship Program Management
- View mentorship pairings
- Monitor mentorship progress
- Track knowledge transfer metrics
- Statistics: Active mentorships, completion rates

### 4.4 Model 3: Resource Pooling & Sharing Management

#### 4.4.1 Bulk Purchasing Oversight
- View all bulk purchasing groups
- Monitor purchasing activities
- Track savings achieved
- Statistics: Active groups, total savings, participants

#### 4.4.2 Co-Ownership Management
- Monitor co-ownership opportunities
- Track asset ownership structures
- Review co-ownership agreements
- Statistics: Active co-ownerships, asset value

#### 4.4.3 Resource Exchange/Barter Monitoring
- View all barter transactions
- Monitor exchange activities
- Track barter value exchanged
- Statistics: Active exchanges, total barter value

### 4.5 Model 4: Hiring Management

#### 4.5.1 Professional Hiring Oversight
- View all job postings
- Monitor application rates
- Track hiring success
- Statistics: Active postings, applications, hires

#### 4.5.2 Consultant Hiring Management
- Monitor consultant engagements
- Track engagement outcomes
- Review consultant performance
- Statistics: Active engagements, completion rates

### 4.6 Model 5: Competition Management

#### 4.6.1 Competition/RFP Oversight
- View all competitions
- Monitor submission rates
- Track evaluation progress
- Review winner selections
- Statistics: Active competitions, submissions, winners

### 4.7 Collaboration Models Management Features

**Common Features Across All Models:**
- Opportunities table with filters
- Opportunity detail modal
- Application review interface
- Approve/reject collaboration opportunities
- Statistics cards per model
- Export functionality (CSV, PDF)
- Real-time activity monitoring
- Bulk operations

## Module 5: Analytics & Reporting

### 5.1 Analytics Dashboard

**User Analytics:**
- Registration trends (line chart)
- User growth by type (bar chart)
- Geographic distribution (map/table)
- User activity metrics
- Profile completion rates
- Verification status breakdown

**Project Analytics:**
- Project creation trends
- Project completion rates
- Projects by category
- Projects by status
- Average project value
- Project duration analysis

**Proposal Analytics:**
- Proposal submission trends
- Cash vs Barter breakdown (pie chart)
- Proposal approval rates
- Average proposal value
- Proposal response times

**Collaboration Models Analytics:**
- Model usage distribution (pie chart)
- Model success rates
- Model activity trends
- Model-specific metrics
- Cross-model comparisons

**Matching Analytics:**
- Matching algorithm performance
- Match success rates
- Average match scores
- Match-to-proposal conversion
- Matching trends over time

**Financial Analytics:**
- Total platform volume
- Cost savings (bulk purchasing, barter)
- Average transaction values
- Revenue trends
- Financial projections

### 5.2 Analytics Features

**Interactive Components:**
- Chart library integration (Chart.js or similar)
- Date range picker
- Metric cards with key indicators
- Trend graphs
- Export buttons (CSV, PDF, Excel)
- Filter controls (date, category, model, etc.)
- Real-time data updates
- Custom report generation

### 5.3 Report Generation

**Report Types:**
- User Registration Report
- Project Activity Report
- Proposal Statistics Report
- Financial Summary Report
- Collaboration Models Usage Report
- Matching Performance Report
- Custom report generation

**Report Features:**
- Configurable date ranges
- Multiple filter options
- Export formats (CSV, PDF, Excel)
- Scheduled report delivery (future)
- Report templates
- Email delivery (future)

## Module 6: Audit Trail Management

### 6.1 Audit Log Viewer

**Features:**
- Comprehensive list of all platform actions
- Sort by: Date, User, Action Type, Entity
- Filter by: Date Range, User, Action Type, Portal, Entity Type
- Search functionality
- Pagination (100 entries per page)

### 6.2 Action Types Tracked

**User Actions:**
- User Registration
- User Login/Logout
- Credential Upload
- Profile Updates

**Project Actions:**
- Project Creation
- Project Publication
- Project Updates
- Project Cancellation

**Proposal Actions:**
- Proposal Submission
- Proposal Updates
- Proposal Approval/Rejection
- Proposal Withdrawal

**Collaboration Actions:**
- Collaboration Opportunity Creation
- Application Submission
- Opportunity Approval/Rejection
- Collaboration Status Changes

**Matching Actions:**
- Match Generation
- Match Notification
- Match Viewing

**Contract Actions:**
- Contract Acceptance ("Click-to-Accept")
- Contract Rejection

**Admin Actions:**
- Vetting Approval/Rejection
- Project Moderation
- Project Removal
- User Suspension
- Settings Changes
- Role Assignments

### 6.3 Log Entry Display

**Information Shown:**
- Timestamp
- User (name, email, role)
- Action Type
- Entity Affected (project, proposal, user, collaboration)
- Details/Description
- Changes (before/after if applicable)
- IP Address (if available)
- Browser/Device (if available)
- Portal where action occurred

### 6.4 Export Functionality

**Features:**
- "Export Logs" button
- Date range selection
- Filter selection
- Format (JSON, CSV, Excel)
- Compliance reporting

## Module 7: System Settings

### 7.1 Platform Configuration

**Settings:**
- Platform name
- Logo upload
- Contact information (email, phone)
- Maintenance mode toggle
- Maintenance message
- Feature flags (enable/disable features)
- Platform status indicators

### 7.2 Matching Algorithm Parameters

**Configurable Parameters:**
- Match threshold (>80% default)
- Weight adjustments for matching criteria:
  - Skill match weight
  - Location proximity weight
  - Experience level weight
  - Financial capacity weight
- Algorithm tuning parameters
- Matching sensitivity controls
- Auto-matching enable/disable
- Matching frequency (realtime, hourly, daily)

### 7.3 Notification Settings

**Configuration:**
- Email notification templates
- SMS notification configuration
- Push notification settings
- Notification frequency controls
- Notification channel preferences
- Template editor

### 7.4 Role & Permission Management

**Features:**
- Role definitions and permissions
- Custom role creation
- Permission matrix management
- Role assignment rules
- Permission inheritance settings
- Role templates

### 7.5 Integration Settings

**Configuration:**
- API configuration
- Third-party service integrations
- Webhook settings
- External system connections
- API keys management
- Integration status monitoring

### 7.6 Settings Features

**UI Components:**
- Tabbed settings interface
- Form validation
- Save/cancel actions
- Settings categories sidebar
- Preview/test functionality
- Settings history/audit
- Import/export settings
- Settings backup/restore

## UI/UX Requirements

### Design Principles
- Clean, professional interface
- Consistent navigation
- Clear visual hierarchy
- Responsive design (desktop-first, tablet/mobile optimized)
- Accessibility (WCAG 2.1 AA compliance)
- Fast loading times (<2 seconds for dashboard)

### Navigation Structure
- Sidebar navigation with collapsible sections
- Breadcrumb navigation
- Quick action buttons
- Search functionality
- User profile menu
- Logout button

### Data Display
- Tables with sorting and filtering
- Pagination for large datasets
- Modal dialogs for details
- Cards for statistics
- Charts and graphs for analytics
- Export buttons prominently placed

### Responsive Breakpoints
- Desktop: 1200px+ (full feature set)
- Tablet: 768px - 1199px (optimized layout)
- Mobile: <768px (essential features only)

## Performance Requirements

### Load Times
- Dashboard: < 2 seconds
- Analytics: < 3 seconds (with charts)
- User list: < 1 second (paginated)
- Settings: < 1 second
- Models management: < 2 seconds

### Data Handling
- Pagination for large lists (50 items per page)
- Lazy loading for charts
- Cached analytics data (refresh every 5 minutes)
- Optimized localStorage queries
- Efficient filtering and sorting

## Security Requirements

### Access Control
- Role-based access (admin, moderator, auditor)
- Session validation on every action
- Audit trail for all admin actions
- IP address logging (if available)
- Two-factor authentication (future)

### Data Protection
- Sensitive data masking in logs
- Secure credential viewing
- Export data sanitization
- Settings change validation
- Password policy enforcement

## Integration Points

### Current (POC)
- localStorage for data persistence
- Client-side only operations
- Simulated API calls

### Future (Production)
- Backend API integration
- Database connections
- Real-time notifications
- Email/SMS services
- File storage services
- Analytics platforms

---

*This specification document provides complete details for all admin portal features and serves as the implementation guide for the Admin Portal development.*

