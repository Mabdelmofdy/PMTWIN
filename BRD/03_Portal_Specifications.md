# Portal Specifications

## 1. Public Portal Specifications

### 1.1 Landing Page (`index.html`)

**Purpose:** First impression and entry point for all visitors

**Components:**
- **Hero Section**
  - Headline: "Digitize Construction Collaboration in MENA"
  - Subheadline: Value proposition statement
  - Primary CTA: "Get Started" → Signup flow
  - Secondary CTA: "Explore Projects" → Discovery Engine
  - Background: Professional construction imagery or gradient

- **Discovery Engine Preview**
  - Active projects count (e.g., "50+ Active Mega-Projects")
  - Trending categories display
  - "Sign up to see details" prompt
  - Visual project cards (limited info)

- **PMTwin Wizard Entry**
  - Interactive card: "Not sure where to start?"
  - "Help me choose" button
  - Brief description of wizard functionality

- **Knowledge Hub Links**
  - Quick links to key articles
  - "What is an SPV?" preview
  - "Barter Guide" preview
  - FAQ section link

- **Signup CTAs**
  - Two prominent buttons: "Join as Individual" / "Join as Entity"
  - Brief role descriptions
  - Benefits list for each type

**UI Requirements:**
- Responsive grid layout
- Modern, clean design
- Fast loading (<2s)
- Accessible (WCAG 2.1 AA)

### 1.2 Discovery Engine

**Purpose:** Showcase active projects to attract signups

**Features:**
- **Project Grid**
  - Cards showing: Title, Category, Location, Budget Range (hidden for guests)
  - "Sign up to see details" overlay on hover
  - Filter by: Category, Location, Project Size
  - Sort by: Newest, Largest Budget, Most Active

- **Limited Information Display**
  - Project title and category visible
  - Location (city/region) visible
  - Budget and detailed scope hidden
  - "Requested Facilities" count shown (not details)

**Interaction:**
- Click on project → Signup prompt modal
- Filter/Sort controls at top
- Pagination for large lists

### 1.3 PMTwin Wizard

**Purpose:** Guide users to appropriate collaboration model

**Flow:**
1. **Step 1: Intent**
   - Question: "What are you looking for?"
   - Options: Find Partners, Find Projects, Learn More, Other

2. **Step 2: Entity Type**
   - Question: "Are you representing a company or yourself?"
   - Options: Company/Entity, Individual Professional

3. **Step 3: Collaboration Model** (for Entities)
   - Question: "What type of collaboration interests you?"
   - Options: Joint Venture (JV), Consortium, Service Provider, Barter Exchange

4. **Step 4: Recommendation**
   - Display recommended path
   - Show benefits of chosen model
   - CTA: "Start Registration" → Signup flow

**UI Requirements:**
- Multi-step form with progress indicator
- Smooth transitions between steps
- Back/Next navigation
- Mobile-friendly touch interactions

### 1.4 Knowledge Hub

**Purpose:** Educational resources to build trust and understanding

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

**UI Requirements:**
- Clean article layout
- Table of contents for long articles
- Search functionality
- Related articles suggestions

### 1.5 Signup Flow

**Purpose:** Convert visitors to registered users

**Step 1: Role Selection**
- Two cards: "Individual" vs "Entity"
- Clear descriptions and use cases
- Visual icons
- "Continue" button

**Step 2: Basic Information**
- Name (Individual) or Company Name (Entity)
- Email address
- Password (with strength indicator)
- Confirm password
- Terms & Conditions checkbox
- Privacy Policy link

**Step 3: Credential Upload**
- **For Individuals:**
  - Professional license/certification upload
  - CV/Resume upload
  - Portfolio link (optional)

- **For Entities:**
  - Commercial Registration (CR) upload
  - VAT certificate upload
  - Company profile document
  - Additional licenses (if applicable)

- File upload UI with drag-and-drop
- File size limits displayed
- Preview of uploaded files
- "Remove" option for each file

**Step 4: Confirmation**
- Success message
- "Your account is pending verification"
- Expected review time (e.g., "2-3 business days")
- Link to check status
- Email confirmation notice

**Validation:**
- Email format validation
- Password strength requirements (min 8 chars, uppercase, number)
- Required file uploads
- Terms acceptance required

## 2. User Portal Specifications

### 2.1 Role-Adaptive Dashboard

#### Entity Dashboard

**Layout:**
- **Top Section: Financial Health Overview**
  - Active JVs count and total value
  - Active tenders count
  - Pending proposals received
  - Total savings (bulk purchasing + barter)

- **Middle Section: Incentivized Deals**
  - Special offers and bulk purchasing opportunities
  - Savings percentage displayed
  - "View Details" CTAs

- **Bottom Section: Recent Activity**
  - Recent proposals received (last 5)
  - Project status updates
  - Matching notifications

**Quick Actions:**
- "Create Mega-Project" button (prominent)
- "View All Proposals" link
- "Browse Opportunities" link

#### Individual Dashboard

**Layout:**
- **Top Section: Task-Based Opportunities Feed**
  - Scrollable list of matched opportunities
  - Skill-match percentage shown
  - "Apply" button for each
  - Filter by: Match Score, Category, Location

- **Middle Section: Profile Endorsements**
  - Recent endorsements received
  - Endorsement count
  - "View Full Profile" link

- **Bottom Section: Active Proposals**
  - Proposals sent (status: Pending, In Review, Approved, Rejected)
  - Quick status overview
  - "View Details" links

**Quick Actions:**
- "Update Profile" button
- "Browse All Opportunities" link
- "View My Proposals" link

### 2.2 Mega-Project Creator

**Form Fields:**

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
- "Save as Draft" button
- "Publish Project" button (triggers matching algorithm)
- "Preview" button

**Validation:**
- All required fields must be filled
- Budget range validation (min < max)
- Date validation (start date in future)
- File size limits

### 2.3 Matching Algorithm Integration

**Display:**
- **Match Results Page**
  - List of matched providers
  - Match score percentage (prominent)
  - Provider name and type
  - Key matching criteria highlighted
  - "View Full Profile" link
  - "Send Inquiry" button

- **Auto-Inquiry System**
  - Notification when match score >80%
  - "You have a new match!" alert
  - Quick view of project details
  - "View Match" → Full details page

**Matching Criteria:**
- Service category alignment
- Skill requirements match
- Experience level compatibility
- Location proximity (if relevant)
- Past performance (if available)

### 2.4 Proposal Suite

#### Cash Proposal Form

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
- "Save Draft"
- "Submit Proposal"
- "Calculate Total" (auto-calculates)

#### Barter Proposal Form

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
- "Save Draft"
- "Submit Barter Proposal"
- "Calculate Equivalence" (auto-calculates)

### 2.5 Service Pipeline

**Visual Pipeline View (Kanban-style):**

**Columns:**
1. **In Review** (Proposals submitted, awaiting client review)
2. **Evaluation** (Client is evaluating proposals)
3. **Approved** (Proposal accepted, work in progress)
4. **Rejected** (Proposal declined)
5. **Completed** (Work finished, closed)

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

### 2.6 Profile Management

**For Individuals:**
- Personal Information:
  - Name, Email, Phone
  - Professional Title
  - Location
  - Bio/Summary
- Skills & Expertise:
  - Skill tags (add/remove)
  - Experience level per skill
  - Certifications (upload, display)
- Portfolio:
  - Past projects (add with descriptions)
  - Portfolio links
  - Case studies
- Endorsements:
  - Display received endorsements
  - Endorser name and comment
  - Date received

**For Entities:**
- Company Information:
  - Company Name, Email, Phone
  - Website
  - Location (HQ and branches)
  - Company Description
- Credentials:
  - CR Number (display)
  - VAT Number (display)
  - Licenses (upload, display)
- Services Offered:
  - Service categories (multi-select)
  - Service descriptions
  - Capacity/Scale indicators
- Financial Health (optional display):
  - Years in business
  - Annual revenue range
  - Key projects completed

**Actions:**
- "Edit Profile" button
- "Save Changes" button
- "Upload New Credential" button
- "Delete" for portfolio items/endorsements (if applicable)

## 3. Admin Portal Specifications

### 3.1 Vetting Module

**Pending Verifications Queue:**
- List of users awaiting verification
- Sort by: Submission Date, User Type, Priority
- Filter by: Individual, Entity, Date Range

**User Details View:**
- **User Information:**
  - Name/Company Name
  - Email, Phone
  - Registration Date
  - User Type (Individual/Entity)

- **Credentials Display:**
  - For Individuals: Professional licenses, CV, certifications
  - For Entities: CR document, VAT certificate, company profile
  - File preview/download functionality

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

**Status Updates:**
- Upon approval: User receives notification, gains portal access
- Upon rejection: User receives notification with reason
- Audit trail entry created

### 3.2 Marketplace Moderation

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
- "Approve Project" (removes flag, keeps project)
- "Remove Project" (requires reason, notifies creator)
  - Options: Spam, Fraudulent, Low Quality, Other
- "Request Revision" (notifies creator to improve)
- Comments field (internal notes)

**Quality Metrics:**
- Average project quality score
- Flagged projects count
- Removed projects count
- Time to review (average)

### 3.3 Financial Reporting

**Dashboard KPIs:**
- **Total Platform Volume:**
  - Total value of all projects (current)
  - Total value of completed projects
  - Growth trend (chart)

- **Average Bulk Purchasing Savings:**
  - Average savings percentage
  - Total savings amount
  - Number of bulk deals

- **Barter Transaction Values:**
  - Total barter value exchanged
  - Number of barter transactions
  - Average barter transaction value

- **Active Projects Count:**
  - Currently active projects
  - Projects by status breakdown
  - Projects by category breakdown

**Charts/Visualizations:**
- Platform volume over time (line chart)
- Savings distribution (bar chart)
- Barter vs Cash proposals (pie chart)
- Project categories distribution (pie chart)
- Geographic distribution (map or bar chart)

**Filters:**
- Date range selector
- Project type filter
- Category filter

**Export:**
- "Export Report" button (simulated - generates JSON/CSV)
- Date range selection
- Format selection (JSON, CSV)

### 3.4 Audit Trail

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

### 3.5 Collaboration Models Management

**Purpose:** Comprehensive oversight and management of all 5 collaboration models

**Model 1: Project-Based Collaboration Management**
- **Task-Based Engagements:**
  - View all task-based opportunities
  - Monitor task completion rates
  - Review task quality and outcomes
  - Statistics: Active tasks, completed tasks, average duration

- **Consortium Management:**
  - View all consortium formations
  - Monitor consortium bidding activities
  - Track consortium success rates
  - Statistics: Active consortia, bids submitted, wins

- **Joint Venture (JV) Oversight:**
  - Monitor JV formations
  - Track JV project progress
  - Review JV performance metrics
  - Statistics: Active JVs, projects under JV

- **SPV Management:**
  - View SPV creations (50M+ SAR threshold)
  - Monitor SPV project status
  - Track SPV financial metrics
  - Statistics: Active SPVs, total SPV value

**Model 2: Strategic Partnerships Management**
- **Strategic JV Monitoring:**
  - View all strategic JV formations
  - Track long-term partnership progress
  - Monitor strategic objectives achievement
  - Statistics: Active strategic JVs, partnership duration

- **Strategic Alliance Oversight:**
  - Monitor alliance formations
  - Track alliance activities
  - Review alliance performance
  - Statistics: Active alliances, alliance value

- **Mentorship Program Management:**
  - View mentorship pairings
  - Monitor mentorship progress
  - Track knowledge transfer metrics
  - Statistics: Active mentorships, completion rates

**Model 3: Resource Pooling & Sharing Management**
- **Bulk Purchasing Oversight:**
  - View all bulk purchasing groups
  - Monitor purchasing activities
  - Track savings achieved
  - Statistics: Active groups, total savings, participants

- **Co-Ownership Management:**
  - Monitor co-ownership opportunities
  - Track asset ownership structures
  - Review co-ownership agreements
  - Statistics: Active co-ownerships, asset value

- **Resource Exchange/Barter Monitoring:**
  - View all barter transactions
  - Monitor exchange activities
  - Track barter value exchanged
  - Statistics: Active exchanges, total barter value

**Model 4: Hiring Management**
- **Professional Hiring Oversight:**
  - View all job postings
  - Monitor application rates
  - Track hiring success
  - Statistics: Active postings, applications, hires

- **Consultant Hiring Management:**
  - Monitor consultant engagements
  - Track engagement outcomes
  - Review consultant performance
  - Statistics: Active engagements, completion rates

**Model 5: Competition Management**
- **Competition/RFP Oversight:**
  - View all competitions
  - Monitor submission rates
  - Track evaluation progress
  - Review winner selections
  - Statistics: Active competitions, submissions, winners

**Collaboration Models Management Features:**
- Unified dashboard showing all models
- Model selector (tabs or dropdown)
- Opportunities table with filters (model, status, date range)
- Opportunity detail modal with full information
- Application review interface
- Approve/reject collaboration opportunities
- Statistics cards per model
- Export functionality (CSV, PDF)
- Real-time activity monitoring

### 3.6 Analytics Dashboard

**Purpose:** Comprehensive platform analytics and insights

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

**Analytics Features:**
- Interactive charts (Chart.js or similar)
- Date range picker
- Metric cards with key indicators
- Trend graphs
- Export buttons (CSV, PDF, Excel)
- Filter controls (date, category, model, etc.)
- Real-time data updates
- Custom report generation

### 3.7 System Settings

**Purpose:** Platform configuration and system management

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

**Settings Features:**
- Tabbed settings interface
- Form validation
- Save/cancel actions
- Settings categories sidebar
- Preview/test functionality
- Settings history/audit
- Import/export settings

### 3.8 Enhanced User Management

**Purpose:** Comprehensive user administration

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

## 4. Mobile App Specifications

### 4.1 Biometric Approval

**Interface:**
- Full-screen approval form
- Project/Milestone information display
- Approval type selector:
  - Milestone Sign-off
  - Work Order Approval
  - Material Receipt
  - Quality Check

**Biometric Capture:**
- Simulated fingerprint/face ID interface
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

### 4.2 Site Log & Media

**Photo/Video Upload:**
- Camera interface (simulated)
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

### 4.3 Push Alert System

**Notification Center:**
- List of all notifications
- Group by: Today, Yesterday, This Week, Older
- Mark as read/unread
- Clear all notifications

**Notification Types:**
- **Bid Updates:**
  - New proposal received
  - Proposal status changed
  - Client message

- **RFI Alerts:**
  - New RFI (Request for Information)
  - RFI response received
  - Urgent RFI

- **Matching Opportunities:**
  - New match found (>80% score)
  - Match nearby (location-based)
  - Match in your category

- **System Notifications:**
  - Account approved/rejected
  - Profile update required
  - Maintenance notices

**Notification Display:**
- Icon (type indicator)
- Title
- Message preview
- Timestamp
- Action button (if applicable): "View", "Respond", "Dismiss"

**Settings:**
- Enable/disable notification types
- Quiet hours setting
- Sound/vibration preferences

### 4.4 Offline Mode

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

## 5. UI/UX Requirements (All Portals)

### 5.1 Design Principles
- **Consistency:** Single CSS source ensures visual consistency
- **Accessibility:** WCAG 2.1 AA compliance
- **Responsiveness:** Mobile-first approach
- **Performance:** Fast loading, smooth interactions
- **Clarity:** Clear navigation, intuitive interfaces

### 5.2 Responsive Breakpoints
- **Mobile:** < 768px (single column, touch-optimized)
- **Tablet:** 768px - 1024px (two columns, hybrid)
- **Desktop:** > 1024px (multi-column, full features)

### 5.3 Component Library
- Buttons (primary, secondary, danger, ghost)
- Cards (project, proposal, user)
- Forms (inputs, selects, textareas, file uploads)
- Modals (confirmation, details, forms)
- Navigation (top nav, sidebar, bottom nav for mobile)
- Tables (sortable, filterable)
- Badges (status, count, type)
- Alerts (success, error, warning, info)
- Loading states (spinners, skeletons)
- Empty states (no data messages)

### 5.4 Color Palette
- Primary: Professional blue (#0066CC)
- Secondary: Construction orange (#FF6600)
- Success: Green (#00AA44)
- Error: Red (#CC0000)
- Warning: Amber (#FFAA00)
- Neutral: Grays (#333333, #666666, #999999, #CCCCCC, #F5F5F5)

### 5.5 Typography
- Headings: Bold, clear hierarchy (H1-H6)
- Body: Readable sans-serif (system fonts)
- Code/Data: Monospace font
- Sizes: Responsive scale (rem units)

---

*These specifications define the functional and UI requirements for all PMTwin portals.*

