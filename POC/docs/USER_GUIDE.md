# PMTwin User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Public Portal Features](#public-portal-features)
5. [User Portal Features](#user-portal-features)
6. [Collaboration Models](#collaboration-models)
7. [Admin Portal Features](#admin-portal-features)
8. [Mobile App Features](#mobile-app-features)
9. [Best Practices](#best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is PMTwin?

PMTwin is a digital platform designed to revolutionize construction collaboration in the MENA (Middle East and North Africa) region. The platform connects construction entities, professionals, and service providers through intelligent matching algorithms, flexible resource exchange, and transparent project management.

### Key Benefits

- **Cost Optimization**: Access bulk purchasing discounts and barter opportunities
- **Intelligent Matching**: AI-powered matching to find the right partners (>80% match threshold)
- **Transparency**: Clear visibility into project opportunities and collaboration models
- **Risk Mitigation**: Vetted partners and verified credentials reduce project risks
- **Flexible Collaboration**: Support for multiple collaboration models (JV, Consortium, Barter, Cash)
- **Compliance**: Robust vetting and credential verification aligned with local regulations

### Target Users

- **Entities**: Contractors, suppliers, service providers
- **Individuals**: Professionals, consultants, experts
- **Administrators**: Platform administrators and auditors

---

## Getting Started

### Registration

#### Step 1: Access the Signup Page

1. Navigate to the PMTwin homepage
2. Click on **"Sign Up"** in the navigation menu or click the **"Get Started"** button

#### Step 2: Select Your User Type

Choose between two account types:

- **Individual**: For professionals, consultants, and experts
- **Entity**: For companies, contractors, suppliers, and service providers

#### Step 3: Provide Basic Information

**For Individuals:**
- Full Name
- Email Address
- Password (minimum 8 characters, must include uppercase and number)
- Confirm Password
- Accept Terms & Conditions

**For Entities:**
- Company Name
- Email Address
- Password (minimum 8 characters, must include uppercase and number)
- Confirm Password
- Accept Terms & Conditions

#### Step 4: Upload Credentials

**For Individuals:**
- Professional License/Certification (PDF, JPG, PNG - max 10MB)
- CV/Resume (PDF, DOC, DOCX - max 10MB)
- Portfolio Link (optional)

**For Entities:**
- Commercial Registration (CR) Document (PDF, JPG, PNG - max 10MB)
- VAT Certificate (PDF, JPG, PNG - max 10MB)
- Company Profile Document (PDF, DOC, DOCX - max 10MB)
- Additional Licenses (if applicable)

#### Step 5: Confirmation

After submission:
- You will receive a confirmation message
- Your account will be pending verification
- Expected review time: 2-3 business days
- You will receive an email notification once your account is approved

### Login

1. Navigate to the **Login** page
2. Enter your registered email address
3. Enter your password
4. Click **"Sign In"**

**Demo Accounts (for testing):**
- **Admin**: `admin@pmtwin.com` / `Admin123`
- **Individual**: `individual@pmtwin.com` / `User123`
- **Entity**: `entity@pmtwin.com` / `Entity123`

### Onboarding

After your account is approved, you'll be guided through an onboarding process:

1. **Profile Completion**: Complete your profile with additional information
2. **Role Selection**: Confirm or select your specific role (if applicable)
3. **Preferences**: Set your notification preferences and collaboration interests
4. **Tutorial**: Take a quick tour of the platform features

---

## User Roles and Permissions

PMTwin operates on a role-based access control (RBAC) system with 8 distinct roles:

### Entity Roles

#### 1. Project Lead (Contractor)
- **Primary Functions**: Post tenders, form consortia, hire resources, initiate SPVs
- **Access Level**: Full Entity Admin
- **Available Models**: All collaboration models (1.1-5.1)
- **Key Permissions**:
  - Create and manage projects
  - Review and approve proposals
  - Form consortia and SPVs
  - Manage collaboration opportunities

#### 2. Supplier
- **Primary Functions**: Participate in bulk purchasing, list surplus materials, join strategic alliances
- **Access Level**: Inventory & Sales
- **Available Models**: Resource Pooling (3.1-3.3), Strategic Alliances (2.2)
- **Key Permissions**:
  - Create bulk purchasing opportunities
  - List surplus materials
  - Join strategic alliances
  - Manage inventory listings

#### 3. Service Provider
- **Primary Functions**: Offer specialized B2B services (Legal, Logistics, Design)
- **Access Level**: Service Admin
- **Available Models**: Task-Based Engagement (1.1), Strategic Alliances (2.2)
- **Key Permissions**:
  - Create service offerings
  - Apply to task-based engagements
  - Join strategic alliances
  - Manage service portfolio

### Individual Roles

#### 4. Professional / Expert
- **Primary Functions**: Accept task-based engagements, join consortia, seek hiring opportunities
- **Access Level**: Personal Profile
- **Available Models**: Task-Based (1.1), Consortium (1.2), Mentorship (2.3), Professional Hiring (4.1)
- **Key Permissions**:
  - Apply to task-based opportunities
  - Join consortia
  - Apply for full-time positions
  - Manage personal profile and portfolio

#### 5. Consultant
- **Primary Functions**: Provide advisory services, feasibility studies, expert reviews
- **Access Level**: Consultant Profile
- **Available Models**: Task-Based (1.1), Consultant Hiring (4.2), Strategic Alliances (2.2)
- **Key Permissions**:
  - Create consultation opportunities
  - Apply to consultant hiring positions
  - Join strategic alliances
  - Manage consultant profile and credentials

#### 6. Mentor
- **Primary Functions**: Guide junior professionals through mentorship programs
- **Access Level**: Mentor Dashboard
- **Available Models**: Mentorship Program (2.3)
- **Key Permissions**:
  - Create mentorship opportunities
  - Manage mentorship programs
  - Track mentee progress
  - Access mentor-specific analytics

### Governance Roles

#### 7. Platform Admin
- **Primary Functions**: Manage verification, dispute resolution, platform analytics
- **Access Level**: System Wide
- **Available Models**: All models (read-only access for monitoring)
- **Key Permissions**:
  - Full system access
  - User vetting and approval
  - Project moderation
  - Analytics and reporting
  - System configuration

#### 8. Auditor
- **Primary Functions**: Verify compliance, review contract integrity
- **Access Level**: Read-Only
- **Available Models**: All models (read-only access)
- **Key Permissions**:
  - View all projects and proposals
  - Access audit trails
  - View compliance reports
  - Read-only access to all data

---

## Public Portal Features

The Public Portal is accessible to all visitors, including non-registered users.

### Home Page

The landing page provides:
- **Hero Section**: Platform introduction and value proposition
- **Discovery Engine Preview**: Active projects count and trending categories
- **PMTwin Wizard Entry**: Interactive guide to help choose collaboration models
- **Knowledge Hub Links**: Quick access to educational resources
- **Signup CTAs**: Prominent buttons for Individual and Entity registration

### Discovery Engine

Browse available projects without registration:

**Features:**
- **Project Grid**: View project cards with:
  - Project Title
  - Category
  - Location (city/region)
  - Budget Range (hidden for guests - requires signup)
- **Filters**: Filter by:
  - Category (Infrastructure, Residential, Commercial, Industrial)
  - Location
  - Project Size
- **Sort Options**: Sort by:
  - Newest
  - Largest Budget
  - Most Active

**Limitations for Guests:**
- Detailed project scope is hidden
- Budget details require registration
- Cannot submit proposals
- Cannot view full project details

**Interaction:**
- Click on a project card → Signup prompt modal
- Use filters and sort options to find relevant projects
- Sign up to unlock full project details

### PMTwin Wizard

An interactive guide to help you choose the right collaboration model:

**Step 1: Intent**
- Question: "What are you looking for?"
- Options: Find Partners, Find Projects, Learn More, Other

**Step 2: Entity Type**
- Question: "Are you representing a company or yourself?"
- Options: Company/Entity, Individual Professional

**Step 3: Collaboration Model** (for Entities)
- Question: "What type of collaboration interests you?"
- Options: Joint Venture (JV), Consortium, Service Provider, Barter Exchange

**Step 4: Recommendation**
- Display recommended path
- Show benefits of chosen model
- CTA: "Start Registration" → Signup flow

### Knowledge Hub

Educational resources to build understanding:

**Content Sections:**

1. **"What is an SPV?" Article**
   - Definition and purpose
   - Use cases in construction
   - Benefits and considerations
   - Related resources

2. **"Barter Guide for Construction" Article**
   - Introduction to barter in construction
   - How PMTwin's barter system works
   - Value equivalence calculation
   - Success stories/examples
   - Best practices

3. **FAQ Section**
   - Common questions about platform
   - Registration process
   - Matching algorithm
   - Proposal types
   - Security and compliance

**Features:**
- Clean article layout
- Table of contents for long articles
- Search functionality
- Related articles suggestions

---

## User Portal Features

After login, users access role-adaptive features based on their account type.

### Dashboard

#### Entity Dashboard

**Top Section: Financial Health Overview**
- Active JVs count and total value
- Active tenders count
- Pending proposals received
- Total savings (bulk purchasing + barter)

**Middle Section: Incentivized Deals**
- Special offers and bulk purchasing opportunities
- Savings percentage displayed
- "View Details" CTAs

**Bottom Section: Recent Activity**
- Recent proposals received (last 5)
- Project status updates
- Matching notifications

**Quick Actions:**
- "Create Mega-Project" button (prominent)
- "View All Proposals" link
- "Browse Opportunities" link

#### Individual Dashboard

**Top Section: Task-Based Opportunities Feed**
- Scrollable list of matched opportunities
- Skill-match percentage shown
- "Apply" button for each
- Filter by: Match Score, Category, Location

**Middle Section: Profile Endorsements**
- Recent endorsements received
- Endorsement count
- "View Full Profile" link

**Bottom Section: Active Proposals**
- Proposals sent (status: Pending, In Review, Approved, Rejected)
- Quick status overview
- "View Details" links

**Quick Actions:**
- "Update Profile" button
- "Browse All Opportunities" link
- "View My Proposals" link

### Project Management

#### Create Project

**Form Sections:**

1. **Basic Information**
   - Project Title (required)
   - Description (required, rich text editor)
   - Category (dropdown: Infrastructure, Residential, Commercial, Industrial, etc.)
   - Location (city, region, country)
   - Project Type (dropdown: JV, Consortium, Service Provider, Mixed)

2. **Scope & Requirements**
   - Core Scope Description
   - Required Services (multi-select checklist)
   - Skill Requirements (tags/keywords)
   - Experience Level Required (dropdown)

3. **Requested Facilities**
   - Offices (number, size, location requirements)
   - Vehicles (SUVs, trucks, etc. - quantity and specifications)
   - Equipment (list with specifications)
   - Other Facilities (free text)

4. **Financial Details**
   - Budget Range (min-max)
   - Currency (dropdown)
   - Payment Terms (dropdown)
   - Barter Options Available (checkbox)

5. **Timeline**
   - Start Date (date picker)
   - Expected Duration (months)
   - Key Milestones (add multiple)

6. **Additional Information**
   - Special Requirements (free text)
   - Documents/Attachments (file upload)
   - Visibility Settings (Public, Registered Users Only)

**Actions:**
- "Save as Draft" - Save without publishing
- "Publish Project" - Publish and trigger matching algorithm
- "Preview" - Preview before publishing

#### View Projects

**Project List View:**
- Grid or list view of all your projects
- Filter by: Status, Category, Date Range
- Sort by: Date, Budget, Status
- Quick actions: Edit, Delete, View Details

**Project Detail View:**
- Full project information
- Matching results (if published)
- Proposals received
- Status and timeline
- Actions: Edit, Publish, Delete, View Proposals

### Matching System

#### How Matching Works

The platform uses an intelligent matching algorithm that:
- Analyzes project requirements against provider profiles
- Calculates match scores based on:
  - Service category alignment
  - Skill requirements match
  - Experience level compatibility
  - Location proximity (if relevant)
  - Past performance (if available)
- Only shows matches with >80% match score

#### View Matches

**Match Results Page:**
- List of matched providers
- Match score percentage (prominent)
- Provider name and type
- Key matching criteria highlighted
- "View Full Profile" link
- "Send Inquiry" button

**Auto-Inquiry System:**
- Notification when match score >80%
- "You have a new match!" alert
- Quick view of project details
- "View Match" → Full details page

#### Opportunities View

View all opportunities that match your profile:
- Filter by: Match Score, Category, Location, Type
- Sort by: Match Score, Date, Budget
- Apply to opportunities directly
- Save opportunities for later

### Proposal Management

#### Create Proposal

**Cash Proposal Form:**

**Fields:**
- Project Reference (auto-filled)
- Service Description (required, rich text)
- Pricing Breakdown:
  - Itemized list (add multiple items)
  - Description, Quantity, Unit Price, Total
  - Subtotal, Taxes, Total Amount
- Timeline:
  - Start Date
  - Completion Date
  - Key Milestones with dates
- Terms & Conditions:
  - Payment schedule
  - Deliverables
  - Warranties
  - Penalties (if any)
- Attachments (optional):
  - Technical proposals
  - Certifications
  - Portfolio samples

**Actions:**
- "Save Draft" - Save without submitting
- "Submit Proposal" - Submit for review
- "Calculate Total" - Auto-calculates totals

**Barter Proposal Form:**

**Fields:**
- Project Reference (auto-filled)
- Services Offered (required):
  - Service description
  - Estimated value
  - Timeline for delivery
- Services Requested in Exchange (required):
  - Service description
  - Estimated value
  - Timeline needed
- Value Equivalence:
  - Total value offered (auto-calculated)
  - Total value requested (auto-calculated)
  - Balance (difference shown)
  - Option to add cash component if imbalance
- Barter Terms:
  - Exchange schedule
  - Quality standards
  - Dispute resolution
- Attachments (optional)

**Actions:**
- "Save Draft" - Save without submitting
- "Submit Barter Proposal" - Submit for review
- "Calculate Equivalence" - Auto-calculates values

#### View Proposals

**Proposals List:**
- All proposals (sent and received)
- Filter by: Status, Type (Cash/Barter), Date Range
- Sort by: Date, Status, Value
- Status badges: Pending, In Review, Approved, Rejected

**Proposal Detail View:**
- Full proposal information
- Pricing breakdown (for cash proposals)
- Barter details (for barter proposals)
- Timeline and milestones
- Attachments
- Actions: Approve, Reject, Request Revision, View Project

### Pipeline Management

Visual Kanban-style board showing proposals by status:

**Columns:**
1. **In Review** - Proposals submitted, awaiting client review
2. **Evaluation** - Client is evaluating proposals
3. **Approved** - Proposal accepted, work in progress
4. **Rejected** - Proposal declined
5. **Completed** - Work finished, closed

**Card Information:**
- Project title
- Proposal type (Cash/Barter)
- Status badge
- Last updated date
- Quick actions (View Details, Withdraw)

**Filters:**
- By Status
- By Type (Cash/Barter)
- By Date Range
- By Project

**Actions:**
- Click card → Full proposal details modal
- Drag-and-drop to change status (if allowed)
- "View All" → Detailed list view

### Profile Management

#### Individual Profile

**Personal Information:**
- Name, Email, Phone
- Professional Title
- Location
- Bio/Summary

**Skills & Expertise:**
- Skill tags (add/remove)
- Experience level per skill
- Certifications (upload, display)

**Portfolio:**
- Past projects (add with descriptions)
- Portfolio links
- Case studies

**Endorsements:**
- Display received endorsements
- Endorser name and comment
- Date received

**Actions:**
- "Edit Profile" - Update information
- "Upload New Credential" - Add certifications
- "Add Portfolio Item" - Add past projects

#### Entity Profile

**Company Information:**
- Company Name, Email, Phone
- Website
- Location (HQ and branches)
- Company Description

**Credentials:**
- CR Number (display)
- VAT Number (display)
- Licenses (upload, display)

**Services Offered:**
- Service categories (multi-select)
- Service descriptions
- Capacity/Scale indicators

**Financial Health (optional display):**
- Years in business
- Annual revenue range
- Key projects completed

**Actions:**
- "Edit Profile" - Update information
- "Upload New Credential" - Add licenses
- "Update Services" - Modify service offerings

### Notifications

**Notification Center:**
- List of all notifications
- Group by: Today, Yesterday, This Week, Older
- Mark as read/unread
- Clear all notifications

**Notification Types:**
- **Bid Updates**: New proposal received, Proposal status changed, Client message
- **RFI Alerts**: New RFI, RFI response received, Urgent RFI
- **Matching Opportunities**: New match found (>80% score), Match nearby, Match in your category
- **System Notifications**: Account approved/rejected, Profile update required, Maintenance notices

**Notification Display:**
- Icon (type indicator)
- Title
- Message preview
- Timestamp
- Action button (if applicable): "View", "Respond", "Dismiss"

**Settings:**
- Enable/disable notification types
- Quiet hours setting
- Email/SMS preferences

---

## Collaboration Models

PMTwin supports 5 main collaboration models with 13 sub-models:

### Model 1: Project-Based Collaboration

**Purpose:** Deliver defined projects with clear start and end points

#### 1.1 Task-Based Engagement
- **Description**: Short-term collaboration for specific tasks, deliverables, or expert consultation
- **Use Cases**: Design review, engineering consultation, quality control
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Task title, task type, detailed scope, duration, budget range

#### 1.2 Consortium
- **Description**: Temporary alliance formed to bid on and execute specific projects
- **Use Cases**: Large infrastructure projects requiring multiple specialties
- **Applicability**: B2B, B2P
- **Key Attributes**: Project scope, consortium structure, member requirements, budget allocation

#### 1.3 Project-Specific Joint Venture (JV)
- **Description**: Shared management partnership for a single project
- **Use Cases**: Complex projects needing shared expertise and resources
- **Applicability**: B2B
- **Key Attributes**: Project scope, equity structure, management structure, profit sharing

#### 1.4 Special Purpose Vehicle (SPV)
- **Description**: Risk-isolated entity for mega-projects (50M+ SAR)
- **Use Cases**: Mega-projects requiring legal and financial isolation
- **Applicability**: B2B
- **Key Attributes**: Project value (50M+ SAR), legal structure, equity/debt financing, liability structure

### Model 2: Strategic Partnerships

**Purpose:** Form long-term alliances for ongoing collaboration and mutual growth (10+ years)

#### 2.1 Strategic Joint Venture
- **Description**: New permanent business entity for long-term market presence
- **Use Cases**: Entering new markets, technology transfer, capacity building
- **Applicability**: B2B
- **Key Attributes**: Strategic objectives, target sectors, equity structure, technology transfer needs

#### 2.2 Strategic Alliance
- **Description**: Ongoing contractual relationship without new entity formation
- **Use Cases**: Ongoing supply chain partnerships, technology sharing
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Alliance objectives, duration, collaboration areas, mutual benefits

#### 2.3 Mentorship Program
- **Description**: Knowledge transfer relationship between experienced and emerging entities/professionals
- **Use Cases**: Knowledge transfer, skill development, market entry support
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Mentorship objectives, skills to develop, duration, knowledge areas

### Model 3: Resource Pooling & Sharing

**Purpose:** Optimize costs through sharing, co-ownership, or barter of resources

#### 3.1 Bulk Purchasing
- **Description**: Group buying for volume discounts on materials and equipment
- **Use Cases**: Materials procurement, equipment rental, service contracts
- **Applicability**: B2B
- **Key Attributes**: Quantity, target price, material/equipment type, timeline

#### 3.2 Co-Ownership
- **Description**: Joint ownership of high-value assets (machinery, equipment, facilities)
- **Use Cases**: Heavy machinery, specialized equipment, shared facilities
- **Applicability**: B2B
- **Key Attributes**: Asset description, ownership percentage, usage schedule, maintenance responsibilities

#### 3.3 Resource Exchange/Barter
- **Description**: Marketplace for trading services, materials, or equipment
- **Use Cases**: Surplus materials, excess capacity, service-for-service trades
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Resources offered, resources requested, value equivalence, exchange terms

### Model 4: Hiring a Resource

**Purpose:** Recruit professionals or consultants for employment or service engagements

#### 4.1 Professional Hiring
- **Description**: Full-time or part-time employment contracts
- **Use Cases**: Project managers, engineers, site supervisors
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Job title, job description, required skills, salary range, employment type

#### 4.2 Consultant Hiring
- **Description**: Expert advisory services and consulting engagements
- **Use Cases**: Feasibility studies, expert reviews, advisory services
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Consultation type, scope of work, deliverables, budget, timeline

### Model 5: Call for Competition

**Purpose:** Competitive sourcing of solutions, designs, or talent through open or invited competitions

#### 5.1 Competition/RFP
- **Description**: Open or invited competitions for designs, solutions, or proposals
- **Use Cases**: Design competitions, innovation challenges, RFQ for materials
- **Applicability**: B2B, B2P, P2B, P2P
- **Key Attributes**: Competition type, evaluation criteria, prizes/awards, submission deadline

### Creating Collaboration Opportunities

1. Navigate to **Collaboration** → **Create Opportunity**
2. Select the collaboration model category
3. Choose the specific sub-model
4. Fill in the required attributes (form is dynamically generated based on model)
5. Review and publish
6. Applications will be received and can be reviewed

### Applying to Collaboration Opportunities

1. Browse **Collaboration** → **Opportunities**
2. Filter by model, category, location
3. View opportunity details
4. Click **"Apply"** button
5. Fill in application form (model-specific)
6. Submit application
7. Track application status in **My Collaborations**

---

## Admin Portal Features

The Admin Portal is accessible only to Platform Admins and Auditors.

### Admin Dashboard

**Platform Statistics:**
- Total Platform Volume (current and completed projects)
- Active Users (by type)
- Pending Verifications
- Active Projects Count
- Proposals Statistics
- Matching Statistics

**Quick Actions:**
- Review Pending Verifications
- Moderate Flagged Projects
- View Audit Trail
- Generate Reports

**Charts/Visualizations:**
- Platform volume over time
- User growth trends
- Project categories distribution
- Geographic distribution

### User Vetting

**Pending Verifications Queue:**
- List of users awaiting verification
- Sort by: Submission Date, User Type, Priority
- Filter by: Individual, Entity, Date Range

**User Details View:**
- User Information (Name, Email, Phone, Registration Date, User Type)
- Credentials Display:
  - For Individuals: Professional licenses, CV, certifications
  - For Entities: CR document, VAT certificate, company profile
- File preview/download functionality

**Verification Criteria Checklist:**
- CR Valid (for entities)
- VAT Valid (for entities)
- Professional License Valid (for individuals)
- Documents Complete
- Information Matches Documents
- No Red Flags

**Actions:**
- "Approve" - Approve user (with confirmation)
- "Reject" - Reject user (requires reason)
- "Request More Information" - Request additional documents
- Comments/Notes field (internal)

**Status Updates:**
- Upon approval: User receives notification, gains portal access
- Upon rejection: User receives notification with reason
- Audit trail entry created

### Project Moderation

**Flagged Projects List:**
- Projects reported by users
- Auto-flagged projects (low quality, suspicious)
- Sort by: Flag Date, Severity, Project Type

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
- "Approve Project" - Remove flag, keep project
- "Remove Project" - Remove project (requires reason, notifies creator)
  - Options: Spam, Fraudulent, Low Quality, Other
- "Request Revision" - Notify creator to improve
- Comments field (internal notes)

**Quality Metrics:**
- Average project quality score
- Flagged projects count
- Removed projects count
- Time to review (average)

### Collaboration Models Management

Comprehensive oversight and management of all 5 collaboration models:

**Model 1: Project-Based Collaboration Management**
- Task-Based Engagements: View all, monitor completion rates, review quality
- Consortium Management: View formations, monitor bidding, track success rates
- Joint Venture Oversight: Monitor formations, track progress, review performance
- SPV Management: View creations (50M+ SAR), monitor status, track financial metrics

**Model 2: Strategic Partnerships Management**
- Strategic JV Monitoring: View formations, track progress, monitor objectives
- Strategic Alliance Oversight: Monitor formations, track activities, review performance
- Mentorship Program Management: View pairings, monitor progress, track metrics

**Model 3: Resource Pooling & Sharing Management**
- Bulk Purchasing Oversight: View groups, monitor activities, track savings
- Co-Ownership Management: Monitor opportunities, track structures, review agreements
- Resource Exchange Monitoring: View transactions, monitor activities, track barter value

**Model 4: Hiring Management**
- Professional Hiring Oversight: View postings, monitor applications, track success
- Consultant Hiring Management: Monitor engagements, track outcomes, review performance

**Model 5: Competition Management**
- Competition/RFP Oversight: View competitions, monitor submissions, track evaluation, review winners

**Features:**
- Unified dashboard showing all models
- Model selector (tabs or dropdown)
- Opportunities table with filters
- Opportunity detail modal
- Application review interface
- Approve/reject collaboration opportunities
- Statistics cards per model
- Export functionality (CSV, PDF)

### Audit Trail

**Log Viewer:**
- Comprehensive list of all platform actions
- Sort by: Date, User, Action Type, Entity
- Filter by: Date Range, User, Action Type, Portal

**Action Types Tracked:**
- User Registration
- Credential Upload
- Vetting Approval/Rejection
- Project Creation
- Proposal Submission
- Proposal Approval/Rejection
- Contract Acceptance ("Click-to-Accept")
- Status Changes
- Profile Updates
- Admin Actions

**Log Entry Display:**
- Timestamp
- User (name, email, role)
- Action Type
- Entity Affected (project, proposal, user)
- Details/Description
- IP Address (if available)
- Browser/Device (if available)

**Contract Tracking:**
- "Click-to-Accept" contracts list
- Contract details
- Parties involved
- Acceptance timestamp
- Contract status
- Download/view contract

**Export Functionality:**
- "Export Logs" button
- Date range selection
- Filter selection
- Format (JSON, CSV)

### Analytics & Reporting

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

**Features:**
- Interactive charts
- Date range picker
- Metric cards with key indicators
- Trend graphs
- Export buttons (CSV, PDF, Excel)
- Filter controls
- Real-time data updates
- Custom report generation

### System Settings

**Platform Configuration:**
- General settings (platform name, logo, contact info)
- Maintenance mode toggle
- Feature flags (enable/disable features)
- Platform status indicators

**Matching Algorithm Settings:**
- Match threshold configuration (>80% default)
- Weight adjustments for matching criteria:
  - Skill match weight
  - Location proximity weight
  - Experience level weight
  - Financial capacity weight
- Algorithm tuning parameters
- Matching sensitivity controls

**Notification Settings:**
- Email notification templates
- SMS notification configuration
- Push notification settings
- Notification frequency controls
- Notification channel preferences

**Role & Permission Management:**
- Role definitions and permissions
- Custom role creation
- Permission matrix management
- Role assignment rules
- Permission inheritance settings

**Integration Settings:**
- API configuration
- Third-party service integrations
- Webhook settings
- External system connections

### User Management

**User List:**
- Complete user list with pagination
- Advanced filters:
  - User type (Individual, Entity, Admin)
  - Status (Pending, Approved, Rejected, Suspended)
  - Role
  - Registration date range
  - Verification status
  - Activity status
- Sort options (name, email, registration date, last login)
- Search functionality

**User Profile Management:**
- View complete user profile
- Edit user information
- Update user credentials
- Manage user roles
- Account status management
- Profile verification status

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

**Credential Verification:**
- Verification status dashboard
- Pending verifications queue
- Verified credentials list
- Expired credentials alerts
- Credential renewal tracking

---

## Mobile App Features

The PMTwin mobile app extends platform functionality to field operations.

### Mobile Dashboard

- Quick access to active projects
- Recent notifications
- Pending approvals
- Site activity summary
- Offline status indicator

### Biometric Approval

**Interface:**
- Full-screen approval form
- Project/Milestone information display
- Approval type selector:
  - Milestone Sign-off
  - Work Order Approval
  - Material Receipt
  - Quality Check

**Biometric Capture:**
- Fingerprint/face ID interface
- "Capture Biometric" button
- Visual feedback (success animation)
- Alternative: Digital signature pad

**Form Fields:**
- Approval comments (optional)
- Photos (attach from gallery or camera)
- Location (auto-capture or manual)
- Timestamp (auto-filled)

**Actions:**
- "Approve" button
- "Reject" button (requires reason)
- "Save Draft" button

### Site Log & Media

**Photo/Video Upload:**
- Camera interface
- Gallery picker
- Multiple file selection
- Preview before upload
- File size indicator

**Preliminaries Verification:**
- Checklist interface:
  - Site Office Ready
  - Utilities Connected
  - Access Roads Clear
  - Safety Measures in Place
  - Equipment Delivered
  - (Add custom items)
- Each item: Checkbox + Photo upload option
- "Mark Complete" button per item
- Overall progress indicator

**Progress Logging:**
- Date selector
- Activity description (free text)
- Category selector (Construction, Logistics, Safety, Other)
- Location (GPS or manual)
- Weather conditions (optional)
- Team members present (optional)
- Photos/videos attached

**Actions:**
- "Save Log Entry"
- "Submit for Review"
- "View Previous Logs"

### Push Notifications

**Notification Center:**
- List of all notifications
- Group by: Today, Yesterday, This Week, Older
- Mark as read/unread
- Clear all notifications

**Notification Types:**
- **Bid Updates**: New proposal received, Proposal status changed, Client message
- **RFI Alerts**: New RFI, RFI response received, Urgent RFI
- **Matching Opportunities**: New match found (>80% score), Match nearby, Match in your category
- **System Notifications**: Account approved/rejected, Profile update required, Maintenance notices

**Settings:**
- Enable/disable notification types
- Quiet hours setting
- Sound/vibration preferences

### Offline Mode

**Offline Indicator:**
- Status bar showing connection state
- "Offline" badge when disconnected
- Sync status indicator

**Local Data Caching:**
- Recent projects cached
- Recent proposals cached
- Pending uploads queued
- Log entries saved locally

**Pending Uploads Queue:**
- List of items waiting to sync
- File size and type
- Upload date/time
- Retry button
- Remove from queue option

**Manual Sync:**
- "Sync Now" button
- Progress indicator
- Success/failure feedback
- Items synced count

**Offline Functionality:**
- View cached projects
- Create log entries (saved locally)
- Capture photos/videos (saved locally)
- Approve milestones (saved locally)
- All sync when connection restored

---

## Best Practices

### For Project Creators

1. **Complete Project Details**: Provide comprehensive project information to improve matching accuracy
2. **Set Realistic Budgets**: Accurate budget ranges help attract appropriate partners
3. **Define Clear Scope**: Detailed scope descriptions reduce misunderstandings
4. **Respond Promptly**: Quick responses to proposals improve collaboration success
5. **Use Appropriate Models**: Choose the right collaboration model for your needs

### For Service Providers

1. **Complete Your Profile**: Full profiles with skills and experience improve match scores
2. **Upload Credentials**: Verified credentials increase trust and opportunities
3. **Respond to Matches**: Act quickly on high-score matches (>80%)
4. **Provide Detailed Proposals**: Comprehensive proposals increase approval chances
5. **Maintain Portfolio**: Keep your portfolio updated with recent work

### For Entities

1. **Verify Credentials**: Ensure all company documents are up-to-date
2. **Define Services Clearly**: Clear service descriptions improve matching
3. **Monitor Opportunities**: Regularly check for new collaboration opportunities
4. **Engage in Bulk Purchasing**: Take advantage of volume discounts
5. **Build Strategic Alliances**: Long-term partnerships provide stability

### For Individuals

1. **Keep Skills Updated**: Regularly update your skills and certifications
2. **Build Your Portfolio**: Showcase your best work
3. **Seek Endorsements**: Request endorsements from past clients
4. **Apply to Multiple Opportunities**: Increase your chances of success
5. **Participate in Mentorship**: Learn from experienced professionals

### General Best Practices

1. **Regular Profile Updates**: Keep your profile information current
2. **Professional Communication**: Maintain professional tone in all interactions
3. **Timely Responses**: Respond to inquiries and proposals promptly
4. **Document Everything**: Keep records of important communications and agreements
5. **Use Notifications**: Enable notifications to stay informed
6. **Review Audit Trails**: Regularly review your activity for accuracy
7. **Security**: Use strong passwords and keep credentials secure
8. **Support**: Contact support for any issues or questions

---

## Troubleshooting

### Common Issues

#### Login Problems

**Issue: Cannot log in**
- **Solution**: Verify email and password are correct
- Check if account is approved (check email for approval notification)
- Try password reset if forgotten
- Contact support if account is locked

**Issue: Account pending verification**
- **Solution**: Wait for admin review (2-3 business days)
- Check email for status updates
- Ensure all required documents are uploaded
- Contact support if verification is delayed

#### Profile Issues

**Issue: Cannot update profile**
- **Solution**: Ensure all required fields are filled
- Check file size limits for uploads (max 10MB)
- Verify file formats are supported (PDF, JPG, PNG, DOC, DOCX)
- Clear browser cache and try again

**Issue: Profile not showing in matches**
- **Solution**: Complete all required profile sections
- Ensure skills and services are properly tagged
- Verify profile is published (not draft)
- Check matching criteria alignment

#### Project Issues

**Issue: Project not appearing in discovery**
- **Solution**: Verify project is published (not draft)
- Check visibility settings (Public vs Registered Users Only)
- Ensure all required fields are completed
- Wait a few minutes for indexing

**Issue: No matches found for project**
- **Solution**: Review project requirements (may be too specific)
- Check if matching threshold is too high
- Verify there are active providers in your category
- Consider adjusting project scope or requirements

#### Proposal Issues

**Issue: Cannot submit proposal**
- **Solution**: Ensure all required fields are completed
- Verify proposal type (Cash/Barter) is selected
- Check file size limits for attachments
- Ensure project is still accepting proposals

**Issue: Proposal status not updating**
- **Solution**: Wait for client review (may take time)
- Check notifications for status updates
- Contact project creator if delayed
- Review proposal for any issues

#### Matching Issues

**Issue: Not receiving matches**
- **Solution**: Complete your profile with all relevant information
- Ensure skills and services match project requirements
- Check if match score threshold is met (>80%)
- Verify profile is active and verified

**Issue: Match scores seem incorrect**
- **Solution**: Review your profile completeness
- Ensure skills and experience are accurately listed
- Check if location or other criteria are affecting scores
- Contact support for algorithm review

#### Technical Issues

**Issue: Page not loading**
- **Solution**: Check internet connection
- Clear browser cache and cookies
- Try a different browser
- Disable browser extensions
- Contact support if issue persists

**Issue: File upload failing**
- **Solution**: Check file size (max 10MB)
- Verify file format is supported
- Ensure stable internet connection
- Try compressing large files
- Use supported browsers (Chrome, Firefox, Safari, Edge)

**Issue: Notifications not appearing**
- **Solution**: Check notification settings in profile
- Verify email notifications are enabled
- Check spam/junk folder
- Ensure browser notifications are allowed
- Review notification preferences

### Getting Help

**Support Channels:**
- **Email**: support@pmtwin.com
- **Help Center**: Access Knowledge Hub for FAQs
- **In-App Support**: Use support chat (if available)
- **Documentation**: Refer to this user guide and other documentation

**When Contacting Support:**
- Provide your account email
- Describe the issue in detail
- Include screenshots if possible
- Mention any error messages
- Specify what you were trying to do

---

## Appendix

### Keyboard Shortcuts

- **Ctrl/Cmd + K**: Quick search
- **Ctrl/Cmd + /** : Open help
- **Esc**: Close modals/dialogs
- **Tab**: Navigate form fields
- **Enter**: Submit forms

### File Format Requirements

**Supported Formats:**
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG
- **Maximum Size**: 10MB per file

### Browser Compatibility

**Supported Browsers:**
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

**Minimum Requirements:**
- JavaScript enabled
- Cookies enabled
- Modern browser with HTML5 support

### Glossary

- **SPV**: Special Purpose Vehicle - A separate legal entity for mega-projects
- **JV**: Joint Venture - A business partnership for a specific project
- **Consortium**: A temporary alliance for bidding on projects
- **Barter**: Service-for-service exchange without cash
- **RFI**: Request for Information
- **RFP**: Request for Proposal
- **Match Score**: Percentage indicating compatibility (0-100%)
- **CR**: Commercial Registration
- **VAT**: Value Added Tax

---

**Last Updated**: Current  
**Version**: 1.0  
**Document Status**: Complete User Guide

For the latest updates and additional resources, visit the PMTwin Knowledge Hub.


