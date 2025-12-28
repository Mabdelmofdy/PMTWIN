# PMTwin - Construction Collaboration Platform POC

## Overview

PMTwin is a comprehensive proof-of-concept (POC) platform designed to digitize the lifecycle of construction collaboration in the MENA region. The platform facilitates data-driven matching and flexible resource exchange through four distinct portals: Public Portal, User Portal, Admin Portal, and Mobile App.

## Project Structure

```
New_PMTWIN/
├── BRD/                          # Business Requirements Documentation
│   ├── 01_Project_Manifesto.md
│   ├── 02_Ecosystem_Overview.md
│   ├── 03_Portal_Specifications.md
│   ├── 04_User_Flows.md
│   ├── 05_Technical_Requirements.md
│   └── 06_Data_Models.md
├── POC/                          # Proof of Concept Application
│   ├── index.html                # Landing Page
│   ├── public-portal.html        # Public Portal
│   ├── user-portal.html          # User Portal
│   ├── admin-portal.html         # Admin Portal
│   ├── mobile-app.html           # Mobile App
│   ├── css/
│   │   └── main.css              # Centralized stylesheet
│   ├── js/
│   │   ├── auth.js               # Authentication & Authorization
│   │   ├── data.js                # localStorage data management
│   │   ├── matching.js            # Matching algorithm
│   │   ├── public-portal.js       # Public portal logic
│   │   ├── user-portal.js         # User portal logic
│   │   ├── admin-portal.js        # Admin portal logic
│   │   └── mobile-app.js          # Mobile app logic
│   └── assets/                    # Images and icons (if needed)
└── README.md
```

## Features

### Public Portal
- **Discovery Engine**: Browse active mega-projects (limited visibility for guests)
- **PMTwin Wizard**: Interactive guide to help users choose the right collaboration model
- **Knowledge Hub**: Educational resources about SPVs, barter systems, and FAQs
- **Signup Flow**: Multi-step registration for Individuals and Entities
- **Login**: Secure authentication system

### User Portal
- **Role-Adaptive Dashboard**: 
  - Entities: Financial health, active projects, proposals received
  - Individuals: Task-based opportunities, skill matches, active proposals
- **Mega-Project Creator**: Create and publish large-scale projects with detailed requirements
- **Matching Algorithm**: Automatic matching with >80% threshold
- **Proposal Suite**: Submit cash or barter proposals
- **Service Pipeline**: Kanban-style tracking of proposal statuses
- **Profile Management**: Update skills, services, and credentials

### Admin Portal
- **Vetting Module**: Review and approve/reject user registrations
- **Marketplace Moderation**: Flag and remove fraudulent or low-quality projects
- **Financial Reporting**: Platform volume, savings, barter transactions
- **Audit Trail**: Complete log of all platform actions

### Mobile App
- **Biometric Approval**: Simulated biometric verification for milestones
- **Site Log & Media**: Log activities, upload photos/videos, verify preliminaries
- **Push Notifications**: Real-time alerts for matches, proposals, and updates
- **Offline Mode**: Local data caching with sync-on-reconnect

## Setup Instructions

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge - latest 2 versions)
- No server or backend required (pure HTML/CSS/JavaScript)
- No build tools or package managers needed

### Installation

1. **Clone or download the project**
   ```bash
   # If using git
   git clone <repository-url>
   cd New_PMTWIN
   ```

2. **Open in browser**
   - Simply open `POC/index.html` in your web browser
   - Or use a local web server (recommended):
     ```bash
     # Using Python 3
     cd POC
     python -m http.server 8000
     
     # Using Node.js (http-server)
     npx http-server POC -p 8000
     
     # Using PHP
     php -S localhost:8000 -t POC
     ```
   - Navigate to `http://localhost:8000` in your browser

3. **Create Test Accounts (Quick Setup)**
   - **Option A: Automatic Setup (Recommended)**
     - Open any page (e.g., `index.html`) in browser
     - Open browser console (F12)
     - Load the setup script:
       ```javascript
       // Load setup script
       const script = document.createElement('script');
       script.src = 'js/setup-accounts.js';
       document.head.appendChild(script);
       ```
     - Or simply copy and paste the contents of `js/setup-accounts.js` into console
   
   - **Option B: Manual Setup**
     - Open browser console (F12)
     - Run the setup script manually (see setup-accounts.js for code)

## Test Account Credentials

After running the setup script, you can login to any portal using these credentials:

### Admin Portal
- **Email:** `admin@pmtwin.com`
- **Password:** `Admin123`
- **Role:** Admin
- **Access:** Full admin access (vetting, moderation, reports, audit trail)

### User Portal - Individual
- **Email:** `individual@pmtwin.com`
- **Password:** `User123`
- **Role:** Individual (Professional/Consultant)
- **Access:** Task-based opportunities, skill matching, proposals, profile management

### User Portal - Entity
- **Email:** `entity@pmtwin.com`
- **Password:** `Entity123`
- **Role:** Entity (Company/Contractor)
- **Access:** Project creation, matching, proposals, financial overview

### Mobile App
- **Use Individual or Entity credentials above**
- **Email:** `individual@pmtwin.com` or `entity@pmtwin.com`
- **Password:** `User123` or `Entity123`
- **Access:** Biometric approval, site logging, notifications, offline mode

### Quick Reference Table

| Portal | Email | Password | Role | Features |
|--------|-------|----------|------|----------|
| **Admin Portal** | admin@pmtwin.com | Admin123 | admin | Vetting, Moderation, Reports |
| **User Portal** | individual@pmtwin.com | User123 | individual | Opportunities, Proposals, Profile |
| **User Portal** | entity@pmtwin.com | Entity123 | entity | Projects, Matching, Proposals |
| **Mobile App** | individual@pmtwin.com | User123 | individual | Site Log, Approvals, Notifications |
| **Mobile App** | entity@pmtwin.com | Entity123 | entity | Site Log, Approvals, Notifications |

> **Note:** All test accounts are pre-approved and ready to use immediately after running the setup script.

## User Guide

### For New Users

1. **Visit the Landing Page** (`index.html`)
   - Browse active projects preview
   - Use PMTwin Wizard to understand collaboration models
   - Read Knowledge Hub articles

2. **Sign Up**
   - Click "Sign Up" or "Get Started"
   - Choose: Individual (Professional/Consultant) or Entity (Company)
   - Fill basic information (name, email, password)
   - Upload required credentials:
     - **Individuals**: Professional license, CV
     - **Entities**: Commercial Registration (CR), VAT certificate, company profile
   - Submit and wait for admin approval (2-3 business days)

3. **After Approval**
   - Login with your credentials
   - Access User Portal with role-appropriate features

### For Entities

1. **Create a Mega-Project**
   - Navigate to "Create Project"
   - Fill project details:
     - Basic info (title, description, category, location)
     - Scope & requirements (services needed, skills required)
     - Requested facilities (offices, vehicles, equipment)
     - Financial details (budget range, payment terms)
     - Timeline (start date, duration, milestones)
   - Save as draft or publish immediately
   - Publishing triggers matching algorithm

2. **Review Matches**
   - View matched providers in "Opportunities"
   - See match scores and criteria breakdown
   - Review provider profiles

3. **Manage Proposals**
   - View proposals received in "Proposals" or "Pipeline"
   - Review cash and barter proposals
   - Approve or reject proposals
   - Track status through pipeline

### For Individuals

1. **Complete Profile**
   - Add skills and expertise
   - Upload certifications
   - Build portfolio

2. **Find Opportunities**
   - View "Opportunities" for matched projects (>80% match)
   - See match scores and project details
   - Submit proposals (cash or barter)

3. **Track Proposals**
   - Monitor proposal status in "Pipeline"
   - View approval/rejection notifications
   - Update profile based on feedback

### For Admins

1. **Vetting Users**
   - Navigate to "Vetting" module
   - Review pending user registrations
   - Check credentials against verification criteria
   - Approve or reject with comments

2. **Moderate Projects**
   - Review flagged projects
   - Check project quality scores
   - Approve or remove projects

3. **View Reports**
   - Check platform volume and statistics
   - Export reports (JSON/CSV)
   - Monitor audit trail

### Mobile App Usage

1. **Access Mobile App**
   - Open `mobile-app.html` on mobile device or browser
   - Login with your credentials

2. **Biometric Approval**
   - Select project from approved proposals
   - Choose approval type (milestone, work order, etc.)
   - Capture biometric (simulated)
   - Submit approval

3. **Site Logging**
   - Verify preliminaries checklist
   - Log daily progress with photos/videos
   - Categorize activities

4. **Notifications**
   - View all notifications
   - Mark as read
   - Respond to alerts

5. **Offline Mode**
   - App works offline
   - Data cached locally
   - Auto-sync when connection restored

## Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Storage**: localStorage API
- **Architecture**: Modular JavaScript (IIFE pattern)
- **Routing**: Hash-based client-side routing
- **Styling**: Single centralized CSS file with CSS Custom Properties

### Data Persistence
All data is stored in browser's localStorage with the following keys:
- `pmtwin_users`: User accounts
- `pmtwin_sessions`: Active sessions
- `pmtwin_projects`: Mega-projects
- `pmtwin_proposals`: Proposals (cash/barter)
- `pmtwin_matches`: Matching algorithm results
- `pmtwin_audit`: Audit trail logs
- `pmtwin_notifications`: User notifications

### Authentication & Authorization
- **Roles**: `guest`, `individual`, `entity`, `admin`
- **Session Management**: 24-hour expiry
- **Route Protection**: Role-based access control
- **Password Security**: Basic encoding (POC only - NOT secure for production)

### Matching Algorithm
- **Threshold**: 80% minimum match score
- **Weights**:
  - Category Match: 30%
  - Skills Match: 40%
  - Experience Match: 20%
  - Location Match: 10%
- **Auto-Inquiry**: Automatic notifications for matches >80%

## Key Workflows

### Onboarding & Vetting
1. User signs up on Public Portal
2. Uploads credentials (CR/VAT/licenses)
3. Admin reviews in Admin Portal
4. Admin approves/rejects
5. User receives notification
6. Approved users gain portal access

### Opportunity & Execution
1. Entity creates mega-project
2. Matching algorithm finds providers (>80% match)
3. Providers receive auto-inquiry notifications
4. Providers submit proposals (cash/barter)
5. Entity reviews and approves/rejects
6. Approved proposals move to execution
7. Mobile app used for site verification
8. Milestones approved via biometric
9. Project completion tracked

## Browser Compatibility

- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Limitations (POC)

- **Storage**: localStorage limited to ~5-10MB per domain
- **Security**: Basic password encoding (NOT secure)
- **File Uploads**: Simulated (metadata only, no actual file storage)
- **Offline**: Simulated offline detection
- **Biometric**: Simulated biometric capture
- **Real-time**: No WebSocket support (polling would be needed)
- **Multi-user**: Single browser instance (localStorage is per-domain)

## Future Enhancements

- Backend API integration
- Database (PostgreSQL/MongoDB)
- Real file upload and storage
- Secure authentication (JWT, OAuth)
- Real-time notifications (WebSockets)
- Email/SMS notifications
- Advanced analytics and reporting
- Mobile native apps (iOS/Android)
- Payment gateway integration
- Document management system

## Troubleshooting

### Data Not Persisting
- Check browser localStorage support
- Clear browser cache and reload
- Check browser console for errors

### Login Issues
- Verify account is approved (check Admin Portal)
- Check email/password are correct
- Clear localStorage and re-register

### Matching Not Working
- Ensure project is published (status: 'active')
- Verify provider profile is complete
- Check match threshold (80%)

### Mobile App Not Loading
- Ensure you're logged in
- Check browser supports localStorage
- Try desktop browser first to verify functionality

## Development Notes

### Adding New Features
1. Update data models in `data.js`
2. Add UI in respective HTML file
3. Add logic in corresponding JS file
4. Update CSS in `main.css` if needed
5. Test across all portals

### Debugging
- Use browser DevTools (F12)
- Check Console for errors
- Inspect localStorage in Application tab
- Use Network tab for debugging (if using server)

## License

This is a proof-of-concept project. All rights reserved.

## Contact

For questions or issues, refer to the BRD documentation in the `BRD/` folder.

---

**Note**: This is a POC (Proof of Concept) implementation. For production use, significant security, scalability, and infrastructure enhancements would be required.

