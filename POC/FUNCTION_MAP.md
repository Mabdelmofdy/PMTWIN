# PMTwin Project Function Map
## Complete Documentation of All Functions and Their Roles

**Last Updated:** 2024-02-11  
**Version:** 2.1.0

---

## Table of Contents

1. [Data Management Layer (`data.js`)](#data-management-layer)
2. [Authentication System (`auth.js`)](#authentication-system)
3. [Unified Renderer (`renderer.js`)](#unified-renderer)
4. [User Portal (`user-portal.js`)](#user-portal)
5. [Admin Portal (`admin-portal.js`)](#admin-portal)
6. [Public Portal (`public-portal.js`)](#public-portal)
7. [Collaboration Models (`collaboration-models.js`)](#collaboration-models)
8. [Collaboration Matching (`collaboration-matching.js`)](#collaboration-matching)
9. [Onboarding System (`onboarding.js`)](#onboarding-system)
10. [Matching Algorithm (`matching.js`)](#matching-algorithm)
11. [Mobile App (`mobile-app.js`)](#mobile-app)
12. [Utility Modules](#utility-modules)

---

## Data Management Layer

**File:** `POC/js/data.js`  
**Role:** Centralized data persistence and CRUD operations using localStorage

### Core Functions

#### Storage Management
- **`initStorage()`**  
  **Role:** Initialize localStorage structure, create empty arrays for all data types, auto-create test accounts, migrate existing users to new data model

- **`migrateUsersToOnboardingModel()`**  
  **Role:** Migrate legacy user data to new onboarding system with progressive stages, identity fields, and document storage

- **`autoCreateTestAccounts()`**  
  **Role:** Automatically create demo accounts (admin, entity, individual) if no users exist in the system

#### User Management (`Users` Module)
- **`Users.create(userData)`**  
  **Role:** Create new user account with onboarding fields, generate unique ID, set initial onboarding stage based on user type

- **`Users.getById(id)`**  
  **Role:** Retrieve user by unique identifier

- **`Users.getByEmail(email)`**  
  **Role:** Find user by email address (used for login)

- **`Users.getByStatus(status)`**  
  **Role:** Get all users with specific status (pending, active, etc.)

- **`Users.getAll()`**  
  **Role:** Retrieve all users from storage

- **`Users.update(id, updates)`**  
  **Role:** Update user data fields (supports partial updates)

- **`Users.delete(id)`**  
  **Role:** Remove user from system (soft delete or hard delete)

- **`calculateOnboardingProgress(userType, stage)`**  
  **Role:** Calculate completion percentage and next steps based on user type and current onboarding stage

- **`calculateProfileCompletionScore(user)`**  
  **Role:** Calculate profile completion percentage based on filled sections

- **`validateProfileSubmission(user)`**  
  **Role:** Validate that user has completed all required profile sections before submission

- **`submitProfileForReview(userId)`**  
  **Role:** Transition user from profile_in_progress to under_review stage, record submission timestamp

- **`uploadDocument(userId, documentType, fileData, fileName)`**  
  **Role:** Store document as base64 in user's documents array, validate file type and size

- **`approveUser(userId, reviewerId, notes)`**  
  **Role:** Approve user account, transition to approved/active stage, record approval metadata

- **`rejectUser(userId, reviewerId, reason, notes)`**  
  **Role:** Reject user account, transition to rejected stage, record rejection reason

- **`requestClarification(userId, reviewerId, questions)`**  
  **Role:** Request additional information from user, transition to clarification_requested stage

- **`checkFeatureAccess(user, feature)`**  
  **Role:** Determine if user can access specific feature based on onboarding stage and user type

#### Session Management (`Sessions` Module)
- **`Sessions.create(userId, role)`**  
  **Role:** Create new session token, store session data with expiration

- **`Sessions.getByToken(token)`**  
  **Role:** Retrieve session data by token

- **`Sessions.getByUserId(userId)`**  
  **Role:** Get all active sessions for a user

- **`Sessions.delete(token)`**  
  **Role:** Invalidate session (logout)

- **`Sessions.deleteAll(userId)`**  
  **Role:** Logout user from all devices

#### Project Management (`Projects` Module)
- **`Projects.create(projectData)`**  
  **Role:** Create new mega-project with validation, generate unique ID

- **`Projects.getById(id)`**  
  **Role:** Retrieve project by ID

- **`Projects.getByCreator(creatorId)`**  
  **Role:** Get all projects created by specific user

- **`Projects.getAll()`**  
  **Role:** Retrieve all projects

- **`Projects.update(id, updates)`**  
  **Role:** Update project data

- **`Projects.delete(id)`**  
  **Role:** Remove project from system

#### Proposal Management (`Proposals` Module)
- **`Proposals.create(proposalData)`**  
  **Role:** Create new proposal for a project, validate cash/barter structure

- **`Proposals.getById(id)`**  
  **Role:** Retrieve proposal by ID

- **`Proposals.getByProject(projectId)`**  
  **Role:** Get all proposals for a specific project

- **`Proposals.getByProvider(providerId)`**  
  **Role:** Get all proposals submitted by a user

- **`Proposals.getAll()`**  
  **Role:** Retrieve all proposals

- **`Proposals.update(id, updates)`**  
  **Role:** Update proposal status or data

- **`Proposals.delete(id)`**  
  **Role:** Remove proposal

#### Matching System (`Matches` Module)
- **`Matches.create(matchData)`**  
  **Role:** Create match record between project and provider, store match score

- **`Matches.getById(id)`**  
  **Role:** Retrieve match by ID

- **`Matches.getByProject(projectId)`**  
  **Role:** Get all matches for a project

- **`Matches.getByProvider(providerId)`**  
  **Role:** Get all matches for a provider

- **`Matches.getAll()`**  
  **Role:** Retrieve all matches

- **`Matches.delete(id)`**  
  **Role:** Remove match record

#### Collaboration Opportunities (`CollaborationOpportunities` Module)
- **`CollaborationOpportunities.create(opportunityData)`**  
  **Role:** Create new collaboration opportunity based on model type

- **`CollaborationOpportunities.getById(id)`**  
  **Role:** Retrieve opportunity by ID

- **`CollaborationOpportunities.getByCreator(creatorId)`**  
  **Role:** Get all opportunities created by user

- **`CollaborationOpportunities.getAll()`**  
  **Role:** Retrieve all opportunities

- **`CollaborationOpportunities.update(id, updates)`**  
  **Role:** Update opportunity data

- **`CollaborationOpportunities.delete(id)`**  
  **Role:** Remove opportunity

#### Collaboration Applications (`CollaborationApplications` Module)
- **`CollaborationApplications.create(applicationData)`**  
  **Role:** Create application for collaboration opportunity

- **`CollaborationApplications.getById(id)`**  
  **Role:** Retrieve application by ID

- **`CollaborationApplications.getByOpportunity(opportunityId)`**  
  **Role:** Get all applications for an opportunity

- **`CollaborationApplications.getByApplicant(applicantId)`**  
  **Role:** Get all applications submitted by user

- **`CollaborationApplications.getAll()`**  
  **Role:** Retrieve all applications

- **`CollaborationApplications.update(id, updates)`**  
  **Role:** Update application status

#### Audit Trail (`Audit` Module)
- **`Audit.log(action, userId, details)`**  
  **Role:** Record system action in audit trail with timestamp and user context

- **`Audit.getRecent(limit)`**  
  **Role:** Retrieve recent audit log entries

- **`Audit.getByUser(userId)`**  
  **Role:** Get all audit entries for a specific user

#### Notifications (`Notifications` Module)
- **`Notifications.create(notificationData)`**  
  **Role:** Create notification for user

- **`Notifications.getByUser(userId)`**  
  **Role:** Get all notifications for user

- **`Notifications.markAsRead(notificationId)`**  
  **Role:** Mark notification as read

- **`Notifications.delete(notificationId)`**  
  **Role:** Remove notification

---

## Authentication System

**File:** `POC/js/auth.js`  
**Role:** User authentication, registration, OTP verification, session management

### Core Functions

#### Password Management
- **`encodePassword(password)`**  
  **Role:** Encode password using Base64 (POC only - NOT secure for production)

- **`decodePassword(encoded)`**  
  **Role:** Decode Base64 encoded password

- **`validatePassword(password)`**  
  **Role:** Validate password strength (min 8 chars, uppercase, lowercase, number)

#### Email Validation
- **`validateEmail(email)`**  
  **Role:** Validate email format using regex

#### OTP System
- **`generateOTP()`**  
  **Role:** Generate 6-digit random OTP code

- **`sendOTP(contact, otpCode, type)`**  
  **Role:** Send OTP via email or mobile (simulated for POC, stores in sessionStorage for testing)

- **`verifyOTP(email, otpCode, type)`**  
  **Role:** Verify OTP code against stored OTP, check expiration, update user verification status

- **`requestOTP(email, type)`**  
  **Role:** Request new OTP for email or mobile, generate and send code

#### Registration
- **`register(userData)`**  
  **Role:** Register new user, validate data, generate email/mobile OTPs, create user account, return registration result

#### Login/Logout
- **`login(email, password)`**  
  **Role:** Authenticate user credentials, create session, return user data and session token

- **`logout(token)`**  
  **Role:** Invalidate session token, clear session data

#### Session Management
- **`getCurrentUser()`**  
  **Role:** Retrieve currently logged-in user from active session

- **`isAuthenticated()`**  
  **Role:** Check if user has valid active session

- **`requireAuth(requiredRole)`**  
  **Role:** Verify user is authenticated and has required role, redirect if not

---

## Unified Renderer

**File:** `POC/js/renderer.js`  
**Role:** Dynamically render all UI sections from data files (data-driven frontend)

### Utility Functions
- **`formatCurrency(amount, currency)`**  
  **Role:** Format number as currency string with proper locale formatting

- **`formatDate(dateString)`**  
  **Role:** Format date string to readable format (e.g., "Jan 15, 2024")

- **`getStatusBadge(status, type)`**  
  **Role:** Generate HTML badge with appropriate color based on status (active, pending, approved, etc.)

- **`getDaysRemaining(deadline)`**  
  **Role:** Calculate days remaining until deadline

### Rendering Functions

#### Models Rendering
- **`renderModels(categoryId)`**  
  **Role:** Render collaboration models list (all categories or specific category's sub-models), display cards with images and descriptions

- **`showModelDetails(modelId)`**  
  **Role:** Render detailed view of specific collaboration model with use cases, benefits, and process steps

#### Opportunities Rendering
- **`renderOpportunities(filters)`**  
  **Role:** Render opportunities list with filtering by status/type, display cards with budget, location, deadlines

#### Proposals Rendering
- **`renderProposals(status)`**  
  **Role:** Render proposals table with status filtering, display proposal details and action buttons

#### Service Pipeline Rendering
- **`renderServicePipeline()`**  
  **Role:** Render Kanban-style pipeline with stages (Discovery, Qualification, Proposal, Negotiation, Closed), show opportunity cards in each stage

#### Projects Rendering
- **`renderProjects(status)`**  
  **Role:** Render projects list with status filtering, display progress bars, budgets, milestones

#### Admin Dashboard Rendering
- **`renderAdminDashboard()`**  
  **Role:** Render admin dashboard with KPI cards, charts (model usage, revenue trends), recent activities table, upcoming deadlines

- **`renderAdminTables(section)`**  
  **Role:** Render admin data tables for opportunities, proposals, users with action buttons

#### User Dashboard Rendering
- **`renderUserDashboard()`**  
  **Role:** Render user dashboard with personalized KPIs, recent activity feed, quick stats

---

## User Portal

**File:** `POC/js/user-portal.js`  
**Role:** User portal routing, dashboard rendering, feature access control, collaboration management

### Initialization
- **`init()`**  
  **Role:** Initialize user portal, check authentication, set up routing, load initial route

- **`initRouting()`**  
  **Role:** Set up hash-based routing, handle route changes, show/hide sections

### Routing
- **`loadRoute(route)`**  
  **Role:** Load content for specific route, handle access control, show appropriate section

- **`updateActiveNav(route)`**  
  **Role:** Update navigation highlighting for active route

### Dashboard
- **`loadDashboard()`**  
  **Role:** Load user dashboard (entity or individual), use new renderer if available, fallback to legacy rendering

- **`loadEntityDashboard(container)`**  
  **Role:** Render dashboard for entity users (companies), show active projects, proposals, platform volume

- **`loadIndividualDashboard(container)`**  
  **Role:** Render dashboard for individual users, show matches, proposals, opportunities

### Access Control
- **`canAccessFeature(feature)`**  
  **Role:** Check if current user can access specific feature based on onboarding stage

- **`showAccessRestricted(feature)`**  
  **Role:** Display access restriction message with onboarding status banner

- **`renderOnboardingStatusBanner(user)`**  
  **Role:** Render banner showing onboarding progress and next steps

### Projects
- **`loadProjects()`**  
  **Role:** Load user's projects list

- **`loadCreateProject()`**  
  **Role:** Load project creation form

- **`handleCreateProject(event)`**  
  **Role:** Handle project creation form submission, validate data, create project

### Opportunities & Proposals
- **`loadOpportunities()`**  
  **Role:** Load opportunities list (legacy function, new renderer preferred)

- **`loadProposals()`**  
  **Role:** Load user's proposals list

- **`handleSubmitProposal(event)`**  
  **Role:** Handle proposal submission, validate cash/barter structure, create proposal

### Pipeline
- **`loadPipeline()`**  
  **Role:** Load service pipeline view (legacy function, new renderer preferred)

### Profile & Onboarding
- **`loadProfile()`**  
  **Role:** Load user profile editing interface

- **`loadOnboarding()`**  
  **Role:** Load onboarding/progressive profile completion page

### Collaboration Models
- **`loadCollaborationModels()`**  
  **Role:** Load collaboration models selection page

- **`loadCollaborationCategory(categoryId)`**  
  **Role:** Load category detail page showing sub-models

- **`loadCollaborationOpportunities()`**  
  **Role:** Load user's collaboration opportunities list

- **`loadMyCollaborations()`**  
  **Role:** Load user's active collaborations

- **`loadCollaborationApplications()`**  
  **Role:** Load user's collaboration applications

### Authentication
- **`handleLogin(event)`**  
  **Role:** Handle login form submission, authenticate user, redirect to dashboard

- **`logout()`**  
  **Role:** Logout user, clear session, redirect to login

### Utility
- **`showErrorInContainer(container, error)`**  
  **Role:** Display error message in container with user-friendly formatting

---

## Admin Portal

**File:** `POC/js/admin-portal.js`  
**Role:** Admin portal routing, user vetting, moderation, reporting, audit trail

### Initialization
- **`init()`**  
  **Role:** Initialize admin portal, check admin authentication, set up routing

- **`initRouting()`**  
  **Role:** Set up hash-based routing for admin portal

### Routing
- **`loadRoute(route)`**  
  **Role:** Load content for admin route (dashboard, vetting, moderation, reports, audit)

- **`updateActiveNav(route)`**  
  **Role:** Update navigation highlighting

### Dashboard
- **`loadDashboard()`**  
  **Role:** Load admin dashboard with platform statistics, use new renderer if available

### User Vetting
- **`loadVetting()`**  
  **Role:** Load user vetting queue, display pending users with review actions

- **`approveUser(userId)`**  
  **Role:** Approve user account, transition to active stage, record approval

- **`rejectUser(userId, reason)`**  
  **Role:** Reject user account, record rejection reason

- **`requestClarification(userId, questions)`**  
  **Role:** Request clarification from user, update status

- **`viewUserDetails(userId)`**  
  **Role:** Display full user details in modal for review

### Moderation
- **`loadModeration()`**  
  **Role:** Load marketplace moderation interface, show flagged projects

- **`flagProject(projectId, reason)`**  
  **Role:** Flag project for review, add to moderation queue

- **`removeProject(projectId, reason)`**  
  **Role:** Remove project from marketplace, record reason

### Reports
- **`loadReports()`**  
  **Role:** Load financial reports, platform volume, savings calculations

### Audit Trail
- **`loadAudit()`**  
  **Role:** Load audit trail log, display system actions with filters

### Authentication
- **`handleLogin(event)`**  
  **Role:** Handle admin login, verify admin credentials

- **`logout()`**  
  **Role:** Logout admin, clear session

- **`testLogin()`**  
  **Role:** Quick login for testing (uses demo credentials)

---

## Public Portal

**File:** `POC/js/public-portal.js`  
**Role:** Public-facing portal, discovery engine, signup wizard, knowledge hub

### Initialization
- **`init()`**  
  **Role:** Initialize public portal, set up routing, load initial content

### Routing
- **`loadRoute(route)`**  
  **Role:** Load public portal routes (discovery, wizard, knowledge, signup, login)

### Discovery Engine
- **`loadDiscovery()`**  
  **Role:** Load project discovery interface with filters

- **`filterProjects()`**  
  **Role:** Filter projects by category and location

### PMTwin Wizard
- **`loadWizard()`**  
  **Role:** Load interactive wizard for collaboration model selection

- **`handleWizardStep(step)`**  
  **Role:** Handle wizard step navigation and data collection

### Knowledge Hub
- **`loadKnowledge()`**  
  **Role:** Load knowledge hub content (SPVs, barter systems, FAQs)

### Signup Flow
- **`loadSignup()`**  
  **Role:** Load multi-step signup wizard

- **`handleSignupStep(step, data)`**  
  **Role:** Handle signup step progression, validate data, move to next step

- **`handleSignupSubmit(event)`**  
  **Role:** Complete registration, create account, redirect to verification

### Login
- **`handleLogin(event)`**  
  **Role:** Handle public portal login, redirect to appropriate portal

- **`detectUserType(email)`**  
  **Role:** Detect user type from email domain or existing account

---

## Collaboration Models

**File:** `POC/js/collaboration-models.js`  
**Role:** Collaboration models UI, form generation, opportunity creation

### Initialization
- **`init(user)`**  
  **Role:** Initialize collaboration models UI with current user context

### Model Selection
- **`renderModelSelection()`**  
  **Role:** Render main categories page with 5 collaboration model categories

- **`renderCategoryDetail(categoryId)`**  
  **Role:** Render category detail page showing all sub-models for a category

- **`selectModel(modelId)`**  
  **Role:** Handle model selection, render dynamic form for creating opportunity

### Form Generation
- **`generateForm(modelId, formData)`**  
  **Role:** Dynamically generate HTML form based on model definition attributes

- **`handleFormSubmit(event)`**  
  **Role:** Handle form submission, validate data, create collaboration opportunity

- **`handleArrayInput(event, fieldName)`**  
  **Role:** Handle dynamic array input fields (add/remove items)

- **`handleObjectInput(event, fieldName)`**  
  **Role:** Handle dynamic object input fields (nested structures)

- **`handleWizardNavigation(direction)`**  
  **Role:** Navigate between form wizard steps

- **`checkDependencies(fieldName)`**  
  **Role:** Check conditional field dependencies, show/hide fields

### Opportunities Management
- **`renderOpportunitiesList()`**  
  **Role:** Render list of user's collaboration opportunities

- **`renderOpportunityDetails(opportunityId)`**  
  **Role:** Render detailed view of collaboration opportunity

---

## Collaboration Matching

**File:** `POC/js/collaboration-matching.js`  
**Role:** Model-specific matching algorithms for collaboration opportunities

### Matching Functions (Model-Specific)
- **`matchTaskBasedEngagement(opportunity, provider)`**  
  **Role:** Calculate match score for Task-Based Engagement model based on skills, experience, availability, budget

- **`matchConsortium(opportunity, provider)`**  
  **Role:** Calculate match score for Consortium model based on capabilities, certifications, track record

- **`matchProjectJV(opportunity, provider)`**  
  **Role:** Calculate match score for Project-Specific Joint Venture based on financial capacity, expertise, compatibility

- **`matchSPV(opportunity, provider)`**  
  **Role:** Calculate match score for Special Purpose Vehicle based on investment capacity, project experience

- **`matchStrategicJV(opportunity, provider)`**  
  **Role:** Calculate match score for Strategic Joint Venture based on strategic alignment, market presence

- **`matchStrategicAlliance(opportunity, provider)`**  
  **Role:** Calculate match score for Strategic Alliance based on complementary capabilities

- **`matchMentorship(opportunity, provider)`**  
  **Role:** Calculate match score for Mentorship Program based on experience level, willingness to mentor

- **`matchBulkPurchasing(opportunity, provider)`**  
  **Role:** Calculate match score for Bulk Purchasing based on purchasing needs, volume capacity

- **`matchCoOwnership(opportunity, provider)`**  
  **Role:** Calculate match score for Co-Ownership Pooling based on asset needs, financial capacity

- **`matchResourceSharing(opportunity, provider)`**  
  **Role:** Calculate match score for Resource Sharing based on resource availability, compatibility

- **`matchProfessionalHiring(opportunity, provider)`**  
  **Role:** Calculate match score for Professional Hiring based on skills, experience, certifications

- **`matchConsultantHiring(opportunity, provider)`**  
  **Role:** Calculate match score for Consultant Hiring based on expertise, track record, availability

- **`matchCompetition(opportunity, provider)`**  
  **Role:** Calculate match score for Competition/RFP based on innovation, past competition wins

### Unified Matching
- **`calculateCollaborationMatchScore(opportunity, provider)`**  
  **Role:** Main matching function that dispatches to model-specific matcher based on opportunity type

---

## Onboarding System

**File:** `POC/js/onboarding.js`  
**Role:** Progressive profile completion, document upload, profile submission

### Dashboard
- **`renderOnboardingDashboard(user)`**  
  **Role:** Render onboarding dashboard with progress indicator and section status

### Profile Sections (Company)
- **`renderCompanyBasicInfo(user)`**  
  **Role:** Render company basic information form

- **`renderCompanyBranches(user)`**  
  **Role:** Render company branches management interface

- **`renderCompanyTeam(user)`**  
  **Role:** Render team members management interface

- **`renderCompanyPortfolio(user)`  
  **Role:** Render company portfolio/projects showcase

- **`renderCompanyProjects(user)`  
  **Role:** Render company projects list

- **`renderCompanyReferences(user)`  
  **Role:** Render company references management

- **`renderCompanyCertifications(user)`  
  **Role:** Render certifications upload and management

### Profile Sections (Individual)
- **`renderIndividualSkills(user)`  
  **Role:** Render skills management interface

- **`renderIndividualCertifications(user)`  
  **Role:** Render certifications management

- **`renderIndividualResume(user)`  
  **Role:** Render resume/CV upload interface

- **`renderIndividualExperience(user)`  
  **Role:** Render work experience management

- **`renderIndividualPortfolio(user)`  
  **Role:** Render individual portfolio showcase

- **`renderIndividualProjects(user)`  
  **Role:** Render individual projects list

- **`renderIndividualReferences(user)`  
  **Role:** Render references management

### Document Management
- **`handleDocumentUpload(event, documentType)`  
  **Role:** Handle document file upload, convert to base64, validate, store

- **`previewDocument(documentData, fileName)`  
  **Role:** Display document preview in modal

- **`deleteDocument(documentType)`  
  **Role:** Remove document from user profile

### Submission
- **`handleSubmitForReview()`  
  **Role:** Validate profile completion, submit profile for admin review, transition to under_review stage

---

## Matching Algorithm

**File:** `POC/js/matching.js`  
**Role:** Core matching algorithm for projects and providers (legacy system)

### Core Functions
- **`calculateMatchScore(project, provider)`  
  **Role:** Calculate compatibility score between project and provider based on skills, budget, location, timeline

- **`findMatches(projectId)`  
  **Role:** Find all matching providers for a project above threshold (80%)

- **`findProjectsForProvider(providerId)`  
  **Role:** Find all matching projects for a provider above threshold

- **`runMatching()`  
  **Role:** Run matching algorithm for all active projects, create match records

---

## Mobile App

**File:** `POC/js/mobile-app.js`  
**Role:** Mobile app interface, biometric approval, site logs, offline sync

### Initialization
- **`init()`  
  **Role:** Initialize mobile app, check authentication, load dashboard

### Biometric Approval
- **`requestBiometricApproval(milestoneId)`  
  **Role:** Request biometric verification for milestone approval (simulated)

- **`handleBiometricResult(result)`  
  **Role:** Process biometric verification result, update milestone status

### Site Logs
- **`createSiteLog(projectId, logData)`  
  **Role:** Create site log entry with photos/videos, location, timestamp

- **`uploadMedia(file, type)`  
  **Role:** Upload media file (photo/video) for site log

### Offline Mode
- **`syncOfflineData()`  
  **Role:** Sync locally cached data when connection restored

- **`cacheData(key, data)`  
  **Role:** Store data in local cache for offline access

---

## Utility Modules

### Demo Credentials (`demo-credentials.js`)
- **`showModal(portal, emailId, passwordId)`  
  **Role:** Display modal with demo credentials for testing

### Debug Login (`debug-login.js`)
- **`debugAdminLogin()`  
  **Role:** Debug function for admin login troubleshooting

### Setup Accounts (`setup-accounts.js`)
- **`setupTestAccounts()`  
  **Role:** Create test accounts for development and testing

### Main Landing Page (`main.js`)
- **`initLandingPage()`  
  **Role:** Initialize landing page, render all sections from siteData.js

- **`renderHero()`  
  **Role:** Render hero section with title, subtitle, CTA

- **`renderAbout()`  
  **Role:** Render about section

- **`renderServices()`  
  **Role:** Render services section

- **`renderPortfolio()`  
  **Role:** Render portfolio/gallery section

- **`renderTestimonials()`  
  **Role:** Render testimonials section

- **`renderTeam()`  
  **Role:** Render team section

- **`renderContact()`  
  **Role:** Render contact section

- **`renderFooter()`  
  **Role:** Render footer section

---

## Data Files

### Models Data (`data/modelsData.js`)
- **Exports:** `modelsData` object with all 5 categories and 13 sub-models including use cases, benefits, process steps, images

### Admin Data (`data/adminData.js`)
- **Exports:** `adminData` object with opportunities, proposals, pipeline, projects, users, approval flows

### Dashboard Data (`data/dashboardData.js`)
- **Exports:** `dashboardData` object with KPIs, charts data, recent activities, deadlines, top performers

### Site Data (`data/siteData.js`)
- **Exports:** `siteData` object with hero, about, services, portfolio, testimonials, team, contact, footer content

---

## Global Objects

### `window.PMTwinData`
- **Role:** Main data management API, provides access to all CRUD modules (Users, Projects, Proposals, Matches, etc.)

### `window.PMTwinAuth`
- **Role:** Authentication API, provides login, register, logout, OTP functions

### `window.Renderer`
- **Role:** Unified renderer API, provides all rendering functions for data-driven UI

### `window.CollaborationModels`
- **Role:** Collaboration models definitions and helper functions

### `window.CollaborationModelsUI`
- **Role:** Collaboration models UI controller

### `window.UserPortal`
- **Role:** User portal controller and routing

### `window.AdminPortal`
- **Role:** Admin portal controller and routing

### `window.PublicPortal`
- **Role:** Public portal controller and routing

---

## Function Categories Summary

### Data Operations (CRUD)
- Create, Read, Update, Delete operations for all entities
- Data validation and migration
- Storage initialization

### Authentication & Authorization
- User registration and login
- OTP generation and verification
- Session management
- Role-based access control

### UI Rendering
- Dynamic content rendering from data
- Form generation
- Dashboard rendering
- Status badges and formatting

### Business Logic
- Matching algorithms
- Onboarding workflows
- Proposal processing
- Collaboration management

### Routing & Navigation
- Hash-based routing
- Route loading and navigation
- Access control integration

### Utility Functions
- Date/currency formatting
- Validation functions
- Error handling
- Demo/testing utilities

---

**End of Function Map**


