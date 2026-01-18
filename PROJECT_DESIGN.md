# PMTwin Project Design Document

**Version:** 1.0  
**Date:** 2024  
**Status:** Proof of Concept (POC)  
**Platform:** Construction Collaboration Platform for MENA Region

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Portal Structure](#portal-structure)
5. [User Roles & RBAC](#user-roles--rbac)
6. [Collaboration Models](#collaboration-models)
7. [Data Models](#data-models)
8. [Features & Functionality](#features--functionality)
9. [Technology Stack](#technology-stack)
10. [File Structure](#file-structure)
11. [Workflows](#workflows)
12. [Security & Compliance](#security--compliance)
13. [Future Enhancements](#future-enhancements)

---

## Executive Summary

PMTwin is a comprehensive construction collaboration platform designed to digitize the lifecycle of construction collaboration in the MENA region. The platform facilitates data-driven matching and flexible resource exchange through four distinct portals: Public Portal, User Portal, Admin Portal, and Mobile App.

**Key Capabilities:**
- 5 Collaboration Models with 13 sub-models
- Intelligent matching algorithm (>80% threshold)
- Multi-portal architecture (Public, User, Admin, Mobile)
- Role-based access control (RBAC)
- Barter system for service exchange
- Comprehensive admin governance

**Current Status:** POC Complete - Feature-based multi-page architecture with localStorage backend, ready for production backend integration.

---

## Project Overview

### Vision
To digitize the lifecycle of construction collaboration in the MENA region through data-driven matching and flexible resource exchange.

### Mission
PMTwin revolutionizes how construction entities, professionals, and service providers connect, collaborate, and execute mega-projects. By combining intelligent matching algorithms with innovative barter systems and transparent project management, we create a sustainable ecosystem that reduces costs, accelerates timelines, and fosters strategic partnerships.

### Target Market
**Primary Focus:** MENA (Middle East and North Africa) Region
- Saudi Arabia (Primary market)
- UAE, Qatar, Kuwait, Egypt, Jordan (Secondary markets)

### Value Proposition

**For Entities:**
- Cost optimization through bulk purchasing and barter
- AI-powered matching for partners
- Transparency in project opportunities
- Risk mitigation through vetted partners

**For Individuals:**
- Task-based opportunity discovery
- Flexible cash/barter proposals
- Professional growth through endorsements
- Real-time matching notifications

**For Administrators:**
- Quality control through vetting
- Market insights and analytics
- Compliance through audit trails
- Marketplace moderation tools

---

## Architecture

### Architecture Pattern
**Feature-Based Multi-Page Application (MPA)**

The application follows a modular, feature-based architecture where each feature has its own directory containing an `index.html` file and associated JavaScript components.

### Architecture Flow

```
User Request
    ↓
Feature Directory (e.g., /dashboard/)
    ↓
index.html (Feature Page)
    ↓
Feature Component (features/dashboard/dashboard.js)
    ↓
Service Layer (services/dashboard/dashboard-service.js)
    ↓
API Service (src/core/api/api-service.js)
    ↓
Data Layer (src/core/data/data-service.js)
    ↓
localStorage OR Backend Database
```

### Core Components

1. **Feature Layer** (`features/`)
   - UI components organized by feature
   - Each feature is self-contained
   - 24 features implemented

2. **Service Layer** (`src/services/`)
   - Business logic abstraction
   - RBAC enforcement
   - API-ready interfaces
   - 9 service modules

3. **Core Layer** (`src/core/`)
   - Authentication (`auth/`)
   - Data management (`data/`)
   - Routing (`routes/`)
   - API client (`api/`)
   - Layout management (`layout/`)

4. **Business Logic** (`src/business-logic/`)
   - Domain models
   - Validators
   - Business rules
   - Payment processing

5. **Components** (`src/components/`)
   - Reusable UI components
   - Cards, filters, layout components
   - Notifications system

### Data Persistence

**Current (POC):**
- localStorage API for client-side storage
- JSON serialization
- Data versioning support

**Storage Keys:**
- `pmtwin_users` - User accounts
- `pmtwin_sessions` - Active sessions
- `pmtwin_projects` - Projects/opportunities
- `pmtwin_proposals` - Proposals (cash/barter)
- `pmtwin_matches` - Matching results
- `pmtwin_audit` - Audit trail logs
- `pmtwin_notifications` - User notifications
- `pmtwin_collaboration_opportunities` - Collaboration opportunities
- `pmtwin_collaboration_applications` - Collaboration applications
- `pmtwin_system_settings` - System configuration

**Future (Production):**
- Backend API integration
- Database (PostgreSQL/MongoDB)
- Cloud storage for files
- Real-time synchronization

---

## Portal Structure

PMTwin operates as a multi-tenant platform with four distinct touchpoints:

### 1. Public Portal (The Window)

**Purpose:** Marketing, Transparency, & Discovery  
**Target Audience:** Unregistered visitors, Potential Leads

**Features:**
- Landing page with hero section
- Discovery Engine (limited project visibility)
- PMTwin Wizard (interactive model selection)
- Knowledge Hub (educational resources)
- Signup flow (Individual/Entity)
- Login functionality

**Key Pages:**
- `/pages/home/index.html` - Landing page
- `/pages/discovery/index.html` - Project discovery
- `/pages/wizard/index.html` - Collaboration model wizard
- `/pages/knowledge/index.html` - Knowledge hub
- `/pages/auth/signup/index.html` - Registration
- `/pages/auth/login/index.html` - Login

### 2. User Portal (The Workplace)

**Purpose:** Execution, Collaboration, & Bidding  
**Target Audience:** Registered Entities & Professionals

**Features:**
- Role-adaptive dashboards (Entity vs Individual)
- Opportunity creation and management
- Matching algorithm integration
- Proposal suite (Cash & Barter)
- Service pipeline tracking (Kanban)
- Profile management
- Collaboration models access
- Notifications center

**Key Pages:**
- `/pages/dashboard/index.html` - Role-adaptive dashboard
- `/pages/opportunities/` - Opportunity management
- `/pages/proposals/` - Proposal management
- `/pages/pipeline/index.html` - Service pipeline
- `/pages/matches/index.html` - Matching results
- `/pages/collaboration/` - Collaboration models
- `/pages/profile/index.html` - Profile management
- `/pages/notifications/index.html` - Notifications

**Dashboard Variations:**

**Entity Dashboard:**
- Financial health overview
- Active projects and proposals
- Incentivized deals
- Recent activity feed

**Individual Dashboard:**
- Task-based opportunities feed
- Profile endorsements
- Active proposals status
- Skill matches

### 3. Admin Portal (The Command Center)

**Purpose:** Governance, Vetting, & Analytics  
**Target Audience:** Internal PMTwin Operators

**Features:**
- Admin dashboard with platform statistics
- User vetting and verification
- Project/proposal moderation
- Collaboration models management (all 5 models)
- Analytics and reporting
- Audit trail management
- System settings
- User management

**Key Pages:**
- `/pages/admin/index.html` - Admin dashboard
- `/pages/admin-vetting/index.html` - User vetting
- `/pages/admin-moderation/index.html` - Content moderation
- `/pages/admin-audit/index.html` - Audit trail
- `/pages/admin-reports/index.html` - Reports & analytics
- `/pages/admin/users-management/index.html` - User management

**Admin Modules:**

1. **Dashboard**
   - Platform overview statistics
   - Collaboration models activity
   - Recent activity feed
   - Pending approvals queue

2. **User Vetting**
   - Pending verification queue
   - Credential review interface
   - Approve/reject workflows
   - Bulk operations

3. **User Management**
   - Complete user list
   - Profile management
   - Role assignment
   - Account status management

4. **Moderation**
   - Project moderation queue
   - Flagged content review
   - Quality control

5. **Collaboration Models Management**
   - View all collaboration opportunities
   - Filter by model type
   - Approve/reject opportunities
   - Monitor active collaborations

6. **Analytics & Reporting**
   - User analytics
   - Project analytics
   - Proposal statistics
   - Financial metrics
   - Matching performance

7. **Audit Trail**
   - Complete activity logs
   - Filter and search
   - Export functionality

8. **System Settings**
   - Platform configuration
   - Matching algorithm parameters
   - Notification settings
   - Role & permission management

### 4. Mobile App (The On-Site Companion)

**Purpose:** Real-time Updates & Site Verification  
**Target Audience:** Field Engineers, Logistics, On-site Teams

**Features:**
- Biometric approval for milestones
- Site log and media uploads
- Push notifications
- Offline mode with sync
- Location capture
- Progress tracking

**Key Pages:**
- `/pages/mobile-app/index.html` - Mobile dashboard
- Site logging interface
- Biometric approval interface
- Notifications center

---

## User Roles & RBAC

### Role Categories

PMTwin supports 8 distinct roles organized into three categories:

### Entities

1. **Project Lead (Contractor)**
   - Role ID: `project_lead`
   - Posts tenders, forms consortia, initiates SPVs
   - Full Entity Admin access
   - All collaboration models available

2. **Supplier**
   - Role ID: `supplier`
   - Participates in bulk purchasing
   - Lists surplus materials
   - Inventory & Sales access

3. **Service Provider**
   - Role ID: `service_provider`
   - Offers specialized B2B services
   - Task-based engagements
   - Service Admin access

### Individuals

4. **Professional / Expert**
   - Role ID: `professional`
   - Task-based engagements
   - Joins consortia
   - Personal Profile access

5. **Consultant**
   - Role ID: `consultant`
   - Advisory services
   - Feasibility studies
   - Consultant Profile access

6. **Mentor**
   - Role ID: `mentor`
   - Guides junior professionals
   - Mentorship Program
   - Mentor Dashboard access

### Governance

7. **Platform Admin**
   - Role ID: `admin`
   - System-wide access
   - Vetting, moderation, analytics
   - Sub-types: Super Admin, Admin, Moderator, Auditor

8. **Auditor**
   - Role ID: `auditor`
   - Read-only access
   - Compliance verification

### RBAC Implementation

**Permission Matrix:**
- Role-based route protection
- Feature-level access control
- Service-level authorization
- UI element visibility control

**Access Levels:**
- Full Entity Admin
- Inventory & Sales
- Service Admin
- Personal Profile
- Consultant Profile
- Mentor Dashboard
- System Wide
- Read-Only

---

## Collaboration Models

PMTwin supports five main collaboration models with 13 sub-models:

### Model 1: Project-Based Collaboration

**Purpose:** Deliver defined projects with clear start and end points

**Sub-Models:**

1. **1.1 Task-Based Engagement**
   - Short-term collaboration for specific tasks
   - Use cases: Design review, engineering consultation, quality control

2. **1.2 Consortium**
   - Temporary alliance for specific projects
   - Use cases: Large infrastructure projects requiring multiple specialties

3. **1.3 Project-Specific Joint Venture (JV)**
   - Shared management partnership for single project
   - Use cases: Complex projects needing shared expertise

4. **1.4 Special Purpose Vehicle (SPV)**
   - Risk-isolated entity for mega-projects (50M+ SAR)
   - Use cases: Mega-projects requiring legal and financial isolation

### Model 2: Strategic Partnerships

**Purpose:** Form long-term alliances for ongoing collaboration (10+ years)

**Sub-Models:**

5. **2.1 Strategic Joint Venture**
   - Permanent business entity for long-term market presence
   - Use cases: Entering new markets, technology transfer

6. **2.2 Strategic Alliance**
   - Ongoing contractual relationship without new entity
   - Use cases: Ongoing supply chain partnerships

7. **2.3 Mentorship**
   - Knowledge transfer relationship
   - Use cases: Skill development, market entry support

### Model 3: Resource Pooling & Sharing

**Purpose:** Optimize costs through sharing, co-ownership, or barter

**Sub-Models:**

8. **3.1 Bulk Purchasing**
   - Group buying for volume discounts
   - Use cases: Materials procurement, equipment rental

9. **3.2 Co-Ownership**
   - Joint ownership of high-value assets
   - Use cases: Heavy machinery, specialized equipment

10. **3.3 Resource Exchange/Barter**
    - Marketplace for trading services, materials, equipment
    - Use cases: Surplus materials, excess capacity, service-for-service trades

### Model 4: Hiring a Resource

**Purpose:** Recruit professionals or consultants

**Sub-Models:**

11. **4.1 Professional Hiring**
    - Full-time or part-time employment contracts
    - Use cases: Project managers, engineers, site supervisors

12. **4.2 Consultant Hiring**
    - Expert advisory services
    - Use cases: Feasibility studies, expert reviews

### Model 5: Call for Competition

**Purpose:** Competitive sourcing through open or invited competitions

**Sub-Models:**

13. **5.1 Competition/RFP**
    - Open or invited competitions for designs, solutions
    - Use cases: Design competitions, innovation challenges, RFQ for materials

---

## Data Models

### User Models

#### Individual User
```javascript
{
  id: "user_123",
  email: "professional@example.com",
  password: "encoded_password",
  role: "individual",
  profile: {
    name: "Ahmed Al-Saud",
    professionalTitle: "Senior Civil Engineer",
    phone: "+966501234567",
    location: { city, region, country },
    skills: ["Project Management", "Civil Engineering"],
    experienceLevel: "senior",
    certifications: [...],
    credentials: [...],
    portfolio: [...],
    endorsements: [...],
    status: "approved" | "pending" | "rejected"
  }
}
```

#### Entity User
```javascript
{
  id: "entity_456",
  email: "company@example.com",
  password: "encoded_password",
  role: "entity",
  profile: {
    companyName: "ABC Construction Co.",
    commercialRegistration: { number, verified },
    vatNumber: { number, verified },
    services: ["General Contracting"],
    financialHealth: { activeJVs, activeTenders, totalSavings },
    status: "approved" | "pending" | "rejected"
  }
}
```

### Project/Opportunity Model
```javascript
{
  id: "project_789",
  creatorId: "entity_456",
  title: "Mega Infrastructure Development Project",
  description: "...",
  category: "Infrastructure",
  location: { city, region, country },
  projectType: "jv" | "consortium" | "service_provider",
  scope: {
    coreDescription: "...",
    requiredServices: [...],
    skillRequirements: [...],
    experienceLevel: "senior"
  },
  facilities: { offices, vehicles, equipment },
  budget: { min, max, currency },
  paymentTerms: "30_days",
  barterAvailable: true,
  timeline: { startDate, duration, milestones },
  status: "active" | "draft" | "completed"
}
```

### Proposal Models

#### Cash Proposal
```javascript
{
  id: "proposal_101",
  projectId: "project_789",
  providerId: "provider_321",
  type: "cash",
  cashDetails: {
    serviceDescription: "...",
    pricing: [...],
    subtotal: 3200000,
    taxes: { vat: 480000 },
    total: 3680000,
    currency: "SAR"
  },
  timeline: { startDate, completionDate, milestones },
  status: "in_review" | "approved" | "rejected"
}
```

#### Barter Proposal
```javascript
{
  id: "proposal_102",
  projectId: "project_789",
  providerId: "provider_321",
  type: "barter",
  barterDetails: {
    servicesOffered: [...],
    servicesRequested: [...],
    totalOffered: 2900000,
    totalRequested: 2900000,
    balance: 0
  },
  status: "in_review" | "approved" | "rejected"
}
```

### Matching Model
```javascript
{
  id: "match_101",
  projectId: "project_789",
  providerId: "provider_321",
  score: 85,
  criteria: {
    categoryMatch: 100,
    skillsMatch: 90,
    experienceMatch: 80,
    locationMatch: 70
  },
  weights: {
    category: 0.30,
    skills: 0.40,
    experience: 0.20,
    location: 0.10
  },
  meetsThreshold: true,
  notified: false
}
```

### Collaboration Opportunity Model
```javascript
{
  id: "opp_123",
  modelId: "1.1" | "1.2" | ... | "5.1",
  modelName: "Task-Based Engagement",
  category: "Project-Based Collaboration",
  creatorId: "user_123",
  title: "Opportunity Title",
  description: "...",
  status: "pending" | "active" | "closed",
  attributes: {
    // Model-specific attributes
  },
  applications: ["app_1", "app_2"]
}
```

### Audit Trail Model
```javascript
{
  id: "audit_303",
  timestamp: "2024-01-15T10:30:00Z",
  userId: "user_123",
  userRole: "individual",
  action: "proposal_submission",
  entityType: "proposal",
  entityId: "proposal_101",
  description: "User submitted cash proposal...",
  changes: { before: {...}, after: {...} },
  context: { projectId, portal: "user_portal" }
}
```

---

## Features & Functionality

### Feature Count: 24 Features

#### Public Portal Features (6)
1. Home/Landing Page
2. Project Discovery
3. PMTwin Wizard
4. Knowledge Hub
5. Login/Authentication
6. Signup/Registration

#### User Portal Features (13)
7. Dashboard (Role-adaptive)
8. Opportunity Creation
9. Opportunity List/View
10. Opportunity Edit/Delete
11. Proposal Creation
12. Proposal List/View
13. Proposal Review/Approve
14. Matches View
15. Collaboration Models (All 5 models)
16. Pipeline Management
17. Profile Management
18. Onboarding
19. Notifications

#### Admin Portal Features (5)
20. Admin Dashboard
21. User Vetting
22. Project Moderation
23. Audit Trail
24. Reports & Analytics

### Key Functionality

**Matching Algorithm:**
- Threshold: 80% minimum match score
- Weights:
  - Category Match: 30%
  - Skills Match: 40%
  - Experience Match: 20%
  - Location Match: 10%
- Auto-inquiry for matches >80%

**Proposal System:**
- Cash proposals with detailed pricing
- Barter proposals with value equivalence
- Proposal status tracking
- Approval/rejection workflows

**Service Pipeline:**
- Kanban-style board
- Status columns: In Review, Evaluation, Approved, Rejected, Completed
- Drag-and-drop functionality
- Filter and search capabilities

**Collaboration Models:**
- All 5 models accessible
- Model-specific forms and workflows
- Application management
- Status tracking

---

## Technology Stack

### Frontend (POC)

**Core Technologies:**
- HTML5 - Semantic markup, accessibility
- CSS3 - Centralized stylesheet, responsive design, CSS Grid/Flexbox
- JavaScript (ES6+) - Modular architecture, localStorage API

**Architecture Patterns:**
- Modular JavaScript (IIFE pattern)
- Hash-based client-side routing
- Component-based CSS
- Role-based access control

**Data Storage:**
- localStorage API (POC)
- JSON serialization
- Data versioning support

### Excluded Technologies (POC Phase)
- No backend/server-side code
- No databases (using localStorage)
- No build tools or bundlers
- No frameworks (React, Vue, Angular)
- No CSS frameworks (Bootstrap, Tailwind)
- No external APIs (except localStorage)
- No package managers

### Future Production Stack

**Backend:**
- Backend API (Node.js, Python, or Java)
- Database (PostgreSQL/MongoDB)
- Authentication service (JWT, OAuth)

**Infrastructure:**
- File storage (AWS S3, Azure Blob)
- Real-time notifications (WebSockets)
- Email service (SendGrid, AWS SES)
- CDN for static assets

**Security:**
- HTTPS mandatory
- Password hashing (bcrypt, Argon2)
- CSRF protection
- XSS protection (Content Security Policy)
- Rate limiting

---

## File Structure

### Root Structure
```
New_PMTWIN/
├── BRD/                          # Business Requirements Documentation
│   ├── 01_Project_Manifesto.md
│   ├── 02_Ecosystem_Overview.md
│   ├── 02_RBAC_System.md
│   ├── 03_Portal_Specifications.md
│   ├── 04_User_Flows.md
│   ├── 05_Technical_Requirements.md
│   ├── 06_Data_Models.md
│   └── 07_Admin_Portal_Specifications.md
├── docs/                         # Additional documentation
│   └── infographics/             # Workflow diagrams
├── POC/                          # Proof of Concept Application
│   ├── index.html                # Entry point
│   ├── pages/                    # Feature pages
│   ├── features/                 # Feature components
│   ├── src/                      # Source code
│   │   ├── core/                 # Core application logic
│   │   ├── services/             # Service layer
│   │   ├── components/           # UI components
│   │   ├── business-logic/       # Domain logic
│   │   └── utils/                # Utilities
│   ├── css/                      # Stylesheets
│   ├── data/                     # JSON data files
│   └── templates/                # HTML templates
└── README.md
```

### POC Structure Details

**Pages Directory:**
```
pages/
├── admin/                        # Admin portal pages
├── auth/                         # Authentication pages
├── collaboration/                # Collaboration model pages
├── contracts/                    # Contract pages
├── dashboard/                    # Dashboard pages
├── opportunities/                # Opportunity pages
├── proposals/                    # Proposal pages
├── profile/                      # Profile pages
└── ...
```

**Features Directory:**
```
features/
├── admin/                        # Admin feature components
├── auth/                         # Auth components
├── collaboration/                # Collaboration components
├── dashboard/                    # Dashboard components
├── matching/                     # Matching components
├── opportunities/                # Opportunity components
├── proposals/                    # Proposal components
└── ...
```

**Services Directory:**
```
src/services/
├── admin/                        # Admin services
├── auth/                         # Auth services
├── collaboration/                # Collaboration services
├── dashboard/                    # Dashboard services
├── matching/                     # Matching services
├── proposals/                    # Proposal services
└── ...
```

---

## Workflows

### Onboarding & Vetting Workflow

1. User visits Public Portal
2. User clicks "Sign Up"
3. User selects role (Individual/Entity)
4. User fills basic information
5. User uploads credentials
6. System creates user record (status: pending)
7. Admin reviews credentials
8. Admin approves/rejects
9. User receives notification
10. Approved users gain portal access

### Opportunity & Execution Workflow

1. Entity creates opportunity/project
2. Matching algorithm finds providers (>80% match)
3. Providers receive auto-inquiry notifications
4. Providers submit proposals (cash/barter)
5. Entity reviews and approves/rejects
6. Approved proposals move to execution
7. Mobile app used for site verification
8. Milestones approved via biometric
9. Project completion tracked

### Barter Transaction Workflow

1. Provider submits barter proposal
2. Client reviews services offered/requested
3. Value equivalence calculated
4. Agreement reached
5. Service exchange tracked
6. Completion verified

### Collaboration Model Workflow

1. User selects collaboration model
2. User creates collaboration opportunity
3. Opportunity reviewed by admin (if required)
4. Opportunity published
5. Applicants submit applications
6. Creator reviews applications
7. Applications approved/rejected
8. Collaboration initiated
9. Progress tracked

---

## Security & Compliance

### Authentication & Authorization

**Current (POC):**
- Role-based access control (RBAC)
- Session management (24-hour expiry)
- Basic password encoding (NOT secure, POC only)
- Route protection

**Future (Production):**
- JWT tokens for sessions
- Password hashing (bcrypt, Argon2)
- OAuth integration
- Multi-factor authentication

### Data Protection

**Current (POC):**
- Credential verification
- Audit trail for all actions
- localStorage storage (per-domain)

**Future (Production):**
- Cloud storage with encryption
- Database encryption at rest
- Secure file uploads
- Data backup and recovery

### Compliance

- Saudi CR/VAT verification standards
- Professional license validation
- Legal contract tracking
- Audit trail for compliance

### Security Considerations

**POC Limitations:**
- Basic password encoding (NOT secure)
- No HTTPS (local development)
- No CSRF protection
- No XSS protection (developer responsibility)
- Basic session tokens (NOT secure)

**Production Requirements:**
- HTTPS mandatory
- Proper password hashing
- CSRF protection
- XSS protection (Content Security Policy)
- Rate limiting
- Secure file uploads

---

## Future Enhancements

### Backend Integration
- Backend API implementation
- Database migration from localStorage
- Real-time synchronization
- File storage integration

### Advanced Features
- Real-time notifications (WebSockets)
- Email/SMS notifications
- Advanced analytics and reporting
- Mobile native apps (iOS/Android)
- Payment gateway integration
- Document management system

### Scalability
- Multi-user concurrent access
- Cloud infrastructure
- CDN for static assets
- Load balancing
- Database optimization

### Integration Points
- Government procurement systems
- Payment gateways
- Document management systems
- Email/SMS services
- Cloud storage
- Analytics platforms

---

## Conclusion

PMTwin is a comprehensive construction collaboration platform designed for the MENA region. The POC demonstrates a feature-rich, multi-portal application with:

- **24 Features** across 4 portals
- **5 Collaboration Models** with 13 sub-models
- **8 User Roles** with granular RBAC
- **Feature-based architecture** ready for backend integration
- **Comprehensive documentation** for development teams

The platform is currently in POC phase with localStorage backend, ready for production backend integration. The architecture is designed to be scalable, maintainable, and extensible for future enhancements.

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** PMTwin Development Team
