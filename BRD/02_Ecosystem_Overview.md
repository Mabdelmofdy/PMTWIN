# PMTwin Ecosystem Overview

## Architecture: Four Touchpoints

PMTwin operates as a multi-tenant platform with four distinct touchpoints, each serving a specific layer of the construction and service ecosystem.

```
┌─────────────────────────────────────────────────────────────┐
│                    PMTwin Platform Core                      │
│  (Matching Engine | Data Layer | Authentication | Analytics) │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Public Portal│ │ User Portal  │ │ Admin Portal │ │ Mobile App   │
│ (Marketing)  │ │ (Execution)  │ │ (Governance) │ │ (Field Ops)  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## Touchpoint Details

### 1. Public Portal (The Window)
**Purpose:** Marketing, Transparency, & Discovery  
**Target Audience:** Unregistered visitors, Potential Leads  
**Key Functions:**
- Showcase active mega-projects (limited visibility)
- Interactive PMTwin Wizard for collaboration model selection
- Knowledge Hub with educational resources
- Entry point for registration (Individual/Entity)

### 2. User Portal (The Workplace)
**Purpose:** Execution, Collaboration, & Bidding  
**Target Audience:** Registered Entities & Professionals  
**Key Functions:**
- Role-adaptive dashboards (Entity vs Individual)
- Mega-project creation and management
- Matching algorithm integration
- Proposal suite (Cash & Barter)
- Service pipeline tracking

### 3. Admin Portal (The Command Center)
**Purpose:** Governance, Vetting, & Analytics  
**Target Audience:** Internal PMTwin Operators  
**Key Functions:**
- User credential vetting and verification
- Marketplace moderation
- Financial reporting and analytics
- Audit trail management
- Collaboration models management (all 5 models)
- System configuration and settings
- User management and role assignment
- Platform-wide analytics and insights

**Detailed Admin Portal Modules:**

#### 3.1 Admin Dashboard
- Platform overview statistics (users, projects, proposals, collaborations)
- Collaboration models activity dashboard
- Recent activity feed
- Quick actions for all models
- System health indicators
- Pending approvals queue
- Key performance metrics (KPIs)

#### 3.2 User Vetting Module
- Pending user verification queue
- User credential review interface
- Approve/reject/reject with clarification workflows
- Bulk approval operations
- User profile verification status tracking
- Credential document review
- Email verification status

#### 3.3 User Management Module
- Complete user list with advanced filters
- User profile management and editing
- Role assignment and permission management
- Account status management (active, suspended, banned)
- Bulk operations (approve, reject, suspend)
- User activity history and audit logs
- Credential verification status dashboard

#### 3.4 Project & Proposal Moderation
- Project moderation queue
- Flagged projects review
- Proposal moderation and quality control
- Content approval workflows
- Remove/flag inappropriate content
- Project status management

#### 3.5 Collaboration Models Management
**Model 1: Project-Based Collaboration**
- Task-Based engagements oversight
- Consortium formation monitoring
- Joint Venture management
- SPV creation and tracking (50M+ SAR threshold)

**Model 2: Strategic Partnerships**
- Strategic JV monitoring
- Strategic Alliance oversight
- Mentorship program management

**Model 3: Resource Pooling & Sharing**
- Bulk purchasing group management
- Co-ownership opportunity oversight
- Resource exchange/barter transaction monitoring

**Model 4: Hiring a Resource**
- Professional hiring postings review
- Consultant hiring engagement oversight
- Application management

**Model 5: Call for Competition**
- Competition/RFP management
- Submission review and evaluation oversight
- Winner selection monitoring

**Features:**
- View all collaboration opportunities across all models
- Filter by model type, status, date range
- View opportunity details and applications
- Approve/reject collaboration opportunities
- Monitor active collaborations
- View collaboration statistics per model
- Export collaboration data

#### 3.6 Analytics & Reporting Module
- User registration trends and demographics
- Project creation and completion rates
- Proposal statistics (cash vs barter breakdown)
- Collaboration model usage analytics
- Matching algorithm performance metrics
- Financial metrics (total project value, cost savings)
- Geographic distribution analysis
- Export capabilities (CSV, PDF, Excel)
- Custom date range reporting
- Real-time dashboard updates

#### 3.7 Audit Trail Management
- Complete platform activity logs
- Filter by user, action, date range, entity type
- Detailed action history with context
- Export audit logs
- Search and advanced filtering
- Compliance reporting

#### 3.8 System Settings Module
**Platform Configuration:**
- General platform settings
- Feature flags and toggles
- Maintenance mode controls

**Matching Algorithm Parameters:**
- Match threshold configuration (>80% default)
- Weight adjustments for matching criteria
- Algorithm tuning parameters

**Notification Settings:**
- Email notification templates
- SMS notification settings
- Push notification configuration
- Notification frequency controls

**Role & Permission Management:**
- Role definitions and permissions
- Custom role creation
- Permission matrix management

**Integration Settings:**
- API configuration
- Third-party service integrations
- Webhook settings

#### 3.9 Reports Module
- User Registration Report
- Project Activity Report
- Proposal Statistics Report
- Financial Summary Report
- Collaboration Models Usage Report
- Matching Performance Report
- Custom report generation
- Scheduled report delivery

### 4. Mobile App (The On-Site Companion)
**Purpose:** Real-time Updates & Site Verification  
**Target Audience:** Field Engineers, Logistics, On-site Teams  
**Key Functions:**
- Biometric approval for milestones
- Site log and media uploads
- Push notifications
- Offline mode with sync

## User Personas

### Persona 1: Entity (Company/Contractor/Supplier)
**Characteristics:**
- Represents a registered business entity
- Has Commercial Registration (CR) and VAT
- Engages in large-scale projects
- Seeks partners for JVs, consortia, or service providers
- Manages multiple tenders and proposals

**Needs:**
- Financial health visibility
- Multi-service tender management
- Access to incentivized deals
- Quality partner matching

**Portal Access:** User Portal (Entity Dashboard)

### Persona 2: Individual (Professional/Consultant)
**Characteristics:**
- Independent professional or consultant
- Has professional certifications/licenses
- Focuses on task-based opportunities
- Builds reputation through endorsements
- Seeks flexible engagement models

**Needs:**
- Skill-matched opportunities
- Profile visibility and endorsements
- Task-based project access
- Real-time matching notifications

**Portal Access:** User Portal (Individual Dashboard)

### Persona 3: Admin (PMTwin Operator)
**Characteristics:**
- Internal PMTwin staff
- Responsible for platform governance
- Verifies credentials against standards
- Monitors marketplace quality
- Generates reports and analytics
- Manages all collaboration models
- Configures system settings

**Needs:**
- Efficient vetting workflows
- Moderation tools
- Comprehensive reporting
- Audit trail access
- Collaboration models oversight
- Analytics and insights
- System configuration capabilities
- User management tools

**Portal Access:** Admin Portal

**Admin Portal Access Levels:**
- **Super Admin:** Full access to all modules including system settings
- **Admin:** Access to vetting, moderation, analytics, and reports
- **Moderator:** Limited access to moderation and basic analytics
- **Auditor:** Read-only access to audit trails and reports

### Persona 4: Field User (On-Site Professional)
**Characteristics:**
- Works on construction sites
- Needs mobile access
- Requires offline capabilities
- Verifies site conditions
- Approves milestones

**Needs:**
- Mobile-optimized interface
- Offline functionality
- Media capture and upload
- Real-time notifications

**Portal Access:** Mobile App

## Platform Relationships

```mermaid
graph TB
    Public[Public Portal] -->|Signup| Auth[Authentication System]
    Auth -->|Approved| User[User Portal]
    Auth -->|Pending| Admin[Admin Portal]
    User -->|Creates| Project[Mega-Projects]
    Project -->|Triggers| Match[Matching Algorithm]
    Match -->|Notifies| User
    User -->|Submits| Proposal[Proposals]
    Proposal -->|Tracked| Pipeline[Service Pipeline]
    Pipeline -->|Updates| Mobile[Mobile App]
    Mobile -->|Logs| Audit[Audit Trail]
    Admin -->|Monitors| Audit
    Admin -->|Vets| Auth
    Admin -->|Moderates| Project
```

## Data Flow

### Registration Flow
```
Public Portal → Signup Form → Credential Upload → 
Admin Queue → Vetting → Approval → User Portal Access
```

### Project Execution Flow
```
Entity Creates Project → Matching Algorithm → 
Auto-Inquiry to Matched Providers → Proposal Submission → 
Evaluation → Approval → Site Execution (Mobile App)
```

### Barter Transaction Flow
```
Provider Submits Barter Proposal → Client Reviews Services → 
Value Equivalence Calculation → Agreement → 
Service Exchange Tracking → Completion
```

## Technology Stack (POC)

### Frontend
- **HTML5:** Semantic markup, accessibility
- **CSS3:** Centralized stylesheet, responsive design, CSS Grid/Flexbox
- **JavaScript (ES6+):** Modular architecture, localStorage API

### Data Persistence
- **localStorage:** Client-side data storage
- **JSON:** Data serialization format
- **Versioning:** Data migration support

### Architecture Patterns
- **Modular JavaScript:** Separate files per portal/feature
- **Hash-based Routing:** Client-side navigation
- **Component-based CSS:** Reusable UI components
- **Role-based Access Control:** Authentication and authorization

## Integration Points (Future)

### Planned Integrations
- Government procurement systems
- Payment gateways
- Document management systems
- Email/SMS notification services
- Cloud storage for media files
- Analytics platforms

## Security Considerations

### Authentication
- Role-based access control (RBAC)
- Session management
- Password security (simulated hashing in POC)

### Data Protection
- Credential verification
- Audit trail for all actions
- Secure data storage (localStorage in POC, cloud in production)

### Compliance
- Saudi CR/VAT verification standards
- Professional license validation
- Legal contract tracking

## Scalability Considerations

### Current (POC)
- Client-side only
- localStorage limitations (~5-10MB)
- Single-user experience simulation

### Production (Future)
- Backend API integration
- Database (PostgreSQL/MongoDB)
- Cloud storage
- Real-time notifications (WebSockets)
- Multi-user concurrent access
- CDN for static assets

---

*This ecosystem overview provides the architectural foundation for PMTwin's multi-tenant platform.*

