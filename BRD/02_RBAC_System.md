# Role-Based Access Control (RBAC) System

## Overview

PMTwin operates on a multi-role registration system where a single account may have different permissions based on its classification. The platform supports 8 distinct roles organized into three categories: Entities, Individuals, and Governance.

## User Types and Roles

### Entities

#### 1. Project Lead (Contractor)
- **Role ID:** `project_lead`
- **Primary Responsibilities:**
  - Posts tenders and project opportunities
  - Forms consortia for large projects
  - Hires resources (professionals and consultants)
  - Initiates Special Purpose Vehicles (SPVs)
  - Manages project lifecycle from initiation to completion
- **Access Level:** Full Entity Admin
- **Available Collaboration Models:**
  - All Project-Based Collaboration models (1.1-1.4)
  - Strategic Partnerships (2.1-2.2)
  - Resource Pooling & Sharing (3.1-3.3)
  - Resource Acquisition (4.1-4.2)
  - Call for Competition (5.1)
- **Key Permissions:**
  - Create and manage projects
  - Post tenders
  - Form consortia and SPVs
  - Review and approve proposals
  - Manage collaboration opportunities
  - Access full project management features

#### 2. Supplier
- **Role ID:** `supplier`
- **Primary Responsibilities:**
  - Participates in bulk purchasing initiatives
  - Lists surplus materials and equipment
  - Joins strategic alliances
  - Manages inventory and resource sharing
- **Access Level:** Inventory & Sales
- **Available Collaboration Models:**
  - Resource Pooling & Sharing (3.1-3.3)
  - Strategic Alliances (2.2)
- **Key Permissions:**
  - Create bulk purchasing opportunities
  - List surplus materials
  - Join strategic alliances
  - Manage inventory listings
  - View resource marketplace

#### 3. Service Provider
- **Role ID:** `service_provider`
- **Primary Responsibilities:**
  - Offers specialized B2B services (Legal, Logistics, Design)
  - Participates in Task-Based engagements
  - Joins Strategic Alliances
- **Access Level:** Service Admin
- **Available Collaboration Models:**
  - Task-Based Engagement (1.1)
  - Strategic Alliances (2.2)
- **Key Permissions:**
  - Create service offerings
  - Apply to task-based engagements
  - Join strategic alliances
  - Manage service portfolio

### Individuals

#### 4. Professional / Expert
- **Role ID:** `professional`
- **Primary Responsibilities:**
  - Accepts task-based engagements
  - Joins consortia as a member
  - Seeks full-time hiring opportunities
  - Participates in mentorship programs
- **Access Level:** Personal Profile
- **Available Collaboration Models:**
  - Task-Based Engagement (1.1)
  - Consortium (1.2)
  - Mentorship Program (2.3)
  - Professional Hiring (4.1)
- **Key Permissions:**
  - Apply to task-based opportunities
  - Join consortia
  - Apply for full-time positions
  - Participate in mentorship (as mentee)
  - Manage personal profile and portfolio

#### 5. Consultant
- **Role ID:** `consultant`
- **Primary Responsibilities:**
  - Provides advisory services
  - Conducts feasibility studies
  - Performs expert reviews
  - Offers high-level consultation
- **Access Level:** Consultant Profile
- **Available Collaboration Models:**
  - Task-Based Engagement (1.1)
  - Consultant Hiring (4.2)
  - Strategic Alliances (2.2)
- **Key Permissions:**
  - Create consultation opportunities
  - Apply to consultant hiring positions
  - Join strategic alliances
  - Manage consultant profile and credentials

#### 6. Mentor
- **Role ID:** `mentor`
- **Primary Responsibilities:**
  - Guides junior professionals through Mentorship Program
  - Provides knowledge transfer
  - Supports professional development
- **Access Level:** Mentor Dashboard
- **Available Collaboration Models:**
  - Mentorship Program (2.3)
- **Key Permissions:**
  - Create mentorship opportunities
  - Manage mentorship programs
  - Track mentee progress
  - Access mentor-specific analytics

### Governance

#### 7. Platform Admin
- **Role ID:** `platform_admin`
- **Primary Responsibilities:**
  - Manages user verification
  - Handles dispute resolution
  - Monitors platform analytics
  - Manages system-wide settings
- **Access Level:** System Wide
- **Available Collaboration Models:**
  - All models (read-only access for monitoring)
- **Key Permissions:**
  - Full system access
  - User vetting and approval
  - Project moderation
  - Dispute resolution
  - Analytics and reporting
  - System configuration
  - Role management

#### 8. Auditor
- **Role ID:** `auditor`
- **Primary Responsibilities:**
  - Verifies compliance
  - Reviews contract integrity
  - Monitors audit trails
- **Access Level:** Read-Only
- **Available Collaboration Models:**
  - All models (read-only access)
- **Key Permissions:**
  - View all projects and proposals
  - Access audit trails
  - View compliance reports
  - Read-only access to all data
  - Cannot modify or approve/reject

## Role-to-Model Mapping

### Project-Based Collaboration (Model 1)
- **1.1 Task-Based Engagement:** Project Lead, Service Provider, Professional, Consultant
- **1.2 Consortium:** Project Lead, Professional
- **1.3 Project-Specific JV:** Project Lead
- **1.4 Special Purpose Vehicle (SPV):** Project Lead

### Strategic Partnerships (Model 2)
- **2.1 Strategic JV:** Project Lead
- **2.2 Strategic Alliance:** Project Lead, Supplier, Service Provider, Consultant
- **2.3 Mentorship Program:** Professional, Mentor

### Resource Pooling & Sharing (Model 3)
- **3.1 Bulk Purchasing:** Project Lead, Supplier
- **3.2 Co-Ownership:** Project Lead, Supplier
- **3.3 Resource Marketplace:** Project Lead, Supplier

### Resource Acquisition (Model 4)
- **4.1 Professional Hiring:** Project Lead, Professional
- **4.2 Consultant Hiring:** Project Lead, Consultant

### Call for Competition (Model 5)
- **5.1 RFP/Design Competitions:** Project Lead

## Profile Score Calculation

The Profile Score is a dynamic progress indicator (0-100%) that incentivizes users to complete their profiles and upload required documents.

### Calculation Methodology

**Profile Score = (Completion Score × 0.6) + (Verification Score × 0.4)**

#### Completion Score (60% weight)
Tracks the percentage of profile sections completed:
- Basic Information: 15%
- Professional Details: 20%
- Portfolio/Experience: 25%
- Certifications: 15%
- References: 10%
- Additional Information: 15%

#### Verification Score (40% weight)
Tracks the percentage of required documents uploaded and verified:
- Identity Verification: 30% (National ID for individuals, CR for entities)
- Professional Certifications: 30% (Relevant licenses and certifications)
- Portfolio Documents: 20% (Project portfolios, case studies)
- Safety Certifications: 20% (Safety compliance documents)

### Score Display
- **0-30%:** Incomplete profile - prompts user to complete
- **31-60%:** Basic profile - shows progress indicators
- **61-80%:** Good profile - eligible for most opportunities
- **81-100%:** Complete profile - eligible for all opportunities and priority matching

## Verification Workflows

### Entity Verification

#### Commercial Registration (CR) Verification
1. User uploads CR document during onboarding
2. System extracts key information (CR number, company name, classification)
3. Automated validation against government databases (when available)
4. Platform Admin reviews and approves/rejects
5. Status updated in user profile

#### SCA Classifications
1. User selects applicable SCA classification(s)
2. Uploads supporting documentation
3. Platform Admin verifies classification eligibility
4. Classification added to verified profile

### Individual Verification

#### National ID Verification (KSA - Absher Integration)
1. User provides National ID number
2. System integrates with Absher API (when available) for validation
3. Alternative: Manual upload and admin verification
4. Platform Admin reviews and approves
5. Identity verified status updated

#### Professional Certifications
1. User uploads certification documents (PMP, LEED, etc.)
2. System extracts certification details (issuer, number, expiry)
3. Validation against certification body databases (when available)
4. Platform Admin reviews and approves
5. Certifications added to verified profile

### Profile Submission Workflow

1. **Profile Building:** User completes profile sections
2. **Document Upload:** User uploads required documents
3. **Profile Score Calculation:** System calculates current score
4. **Submission:** User submits profile for review
5. **Admin Review:** Platform Admin reviews profile and documents
6. **Approval/Rejection:** Admin approves or requests clarification
7. **Activation:** Approved profile becomes active and searchable

## Permission Matrix

| Permission | Project Lead | Supplier | Service Provider | Professional | Consultant | Mentor | Platform Admin | Auditor |
|------------|-------------|----------|------------------|--------------|------------|--------|----------------|---------|
| Create Projects | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Post Tenders | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Form Consortia | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Create SPVs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Bulk Purchasing | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| List Surplus | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| Task-Based Engagement | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ | ✅ | 👁️ |
| Strategic Alliances | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | 👁️ |
| Mentorship Program | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | ✅ | 👁️ |
| Professional Hiring | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | 👁️ |
| Consultant Hiring | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ | 👁️ |
| Review Proposals | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| User Vetting | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| Dispute Resolution | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |
| View Analytics | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | 👁️ |

Legend: ✅ = Full Access, 👁️ = Read-Only, ❌ = No Access

## Role Assignment Rules

### On Registration
- User selects user type (Entity/Individual)
- System assigns default role based on selection:
  - Entity → Project Lead (can be changed to Supplier or Service Provider)
  - Individual → Professional (can be changed to Consultant or Mentor)
- User can request role change during onboarding

### On Approval
- Platform Admin reviews user profile
- Can assign specific role based on:
  - User's stated responsibilities
  - Uploaded documents
  - Business needs
- Role can be changed later by Platform Admin

### Multi-Role Support
- A single account can have multiple roles (future enhancement)
- Primary role determines default portal and features
- Secondary roles provide additional permissions

## Portal Access

- **User Portal:** Project Lead, Supplier, Service Provider, Professional, Consultant, Mentor
- **Admin Portal:** Platform Admin, Auditor
- **Public Portal:** All users (for discovery and registration)

## Migration from Legacy Roles

Existing users are migrated as follows:
- `admin` → `platform_admin`
- `entity` → `project_lead` (default, can be changed)
- `individual` → `professional` (default, can be changed)
- `consultant` → `consultant` (unchanged)

---

*This document defines the complete RBAC system for PMTwin. All role assignments, permissions, and access controls are based on this specification.*


