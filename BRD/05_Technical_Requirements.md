# Technical Requirements

## 1. POC Technology Constraints

### 1.1 Technology Stack
- **HTML5:** Semantic markup, form validation, accessibility features
- **CSS3:** Centralized stylesheet, responsive design, CSS Grid, Flexbox, Custom Properties
- **JavaScript (ES6+):** Modular architecture, localStorage API, Fetch API (for future), async/await

### 1.2 Excluded Technologies (POC Phase)
- No backend/server-side code
- No databases (using localStorage instead)
- No build tools or bundlers (vanilla JS)
- No frameworks (React, Vue, Angular)
- No CSS frameworks (Bootstrap, Tailwind) - custom CSS only
- No external APIs (except localStorage)
- No package managers (npm, yarn) - pure browser implementation

### 1.3 Future Production Considerations
- Backend API (Node.js, Python, or similar)
- Database (PostgreSQL, MongoDB)
- Authentication service (JWT, OAuth)
- File storage (AWS S3, Azure Blob)
- Real-time notifications (WebSockets)
- Email service (SendGrid, AWS SES)
- CDN for static assets

## 2. localStorage Schema

### 2.1 Data Structure

#### Users (`pmtwin_users`)
```javascript
[
  {
    id: "user_123",                    // Unique identifier
    email: "user@example.com",          // Login email
    password: "encoded_password",       // Basic encoding (not secure, POC only)
    role: "individual" | "entity" | "admin",
    profile: {
      name: "User Name",                // Individual name or Company name
      company: "Company Name",          // For entities only
      phone: "+966501234567",
      location: "Riyadh, Saudi Arabia",
      credentials: [                    // Array of credential objects
        {
          type: "cr" | "vat" | "license" | "cv",
          fileName: "cr_document.pdf",
          fileSize: 1024000,
          uploadedAt: "2024-01-01T00:00:00Z"
        }
      ],
      status: "pending" | "approved" | "rejected",
      skills: ["Construction", "Engineering"], // For individuals
      services: ["General Contracting"],       // For entities
      createdAt: "2024-01-01T00:00:00Z",
      approvedAt: null,                 // Set when approved
      rejectedAt: null,                 // Set when rejected
      rejectionReason: null            // If rejected
    }
  }
]
```

#### Sessions (`pmtwin_sessions`)
```javascript
[
  {
    userId: "user_123",
    token: "session_token_abc123",      // Simple token (POC)
    role: "individual" | "entity" | "admin",
    createdAt: "2024-01-01T00:00:00Z",
    expiresAt: "2024-01-02T00:00:00Z"  // 24 hours from creation
  }
]
```

#### Projects (`pmtwin_projects`)
```javascript
[
  {
    id: "project_456",
    creatorId: "entity_123",
    title: "Mega Infrastructure Project",
    description: "Full project description...",
    category: "Infrastructure" | "Residential" | "Commercial" | "Industrial",
    location: {
      city: "Riyadh",
      region: "Riyadh Province",
      country: "Saudi Arabia"
    },
    projectType: "jv" | "consortium" | "service_provider" | "mixed",
    scope: {
      coreDescription: "Core scope details...",
      requiredServices: ["Engineering", "Construction", "Logistics"],
      skillRequirements: ["Project Management", "Civil Engineering"],
      experienceLevel: "intermediate" | "senior" | "expert"
    },
    facilities: {
      offices: {
        quantity: 2,
        size: "200 sqm each",
        location: "Site office"
      },
      vehicles: [
        { type: "SUV", quantity: 3 },
        { type: "Truck", quantity: 2 }
      ],
      equipment: ["Cranes", "Excavators"]
    },
    budget: {
      min: 1000000,
      max: 5000000,
      currency: "SAR"
    },
    paymentTerms: "30_days" | "60_days" | "milestone_based",
    barterAvailable: true,
    timeline: {
      startDate: "2024-02-01",
      duration: 12,                    // months
      milestones: [
        { name: "Site Preparation", date: "2024-03-01" },
        { name: "Foundation", date: "2024-05-01" }
      ]
    },
    specialRequirements: "Special requirements text...",
    attachments: [],                    // Array of file metadata
    status: "draft" | "active" | "in_progress" | "completed" | "cancelled",
    visibility: "public" | "registered_only",
    createdAt: "2024-01-01T00:00:00Z",
    publishedAt: null,                  // Set when published
    flagged: false,
    flagReason: null
  }
]
```

#### Proposals (`pmtwin_proposals`)
```javascript
[
  {
    id: "proposal_789",
    projectId: "project_456",
    providerId: "provider_321",
    type: "cash" | "barter",
    status: "in_review" | "evaluation" | "approved" | "rejected" | "completed",
    cashDetails: {                      // If type is "cash"
      serviceDescription: "Service description...",
      pricing: [
        {
          item: "Engineering Services",
          quantity: 1,
          unitPrice: 50000,
          total: 50000
        }
      ],
      subtotal: 50000,
      taxes: 7500,
      total: 57500,
      currency: "SAR"
    },
    barterDetails: {                   // If type is "barter"
      servicesOffered: [
        {
          description: "Construction Services",
          value: 100000,
          timeline: "6 months"
        }
      ],
      servicesRequested: [
        {
          description: "Engineering Services",
          value: 100000,
          timeline: "6 months"
        }
      ],
      totalOffered: 100000,
      totalRequested: 100000,
      balance: 0,
      cashComponent: 0                  // If imbalance
    },
    timeline: {
      startDate: "2024-02-01",
      completionDate: "2024-08-01",
      milestones: [
        { name: "Phase 1", date: "2024-04-01" }
      ]
    },
    terms: "Terms and conditions text...",
    attachments: [],                    // Array of file metadata
    submittedAt: "2024-01-01T00:00:00Z",
    evaluatedAt: null,
    approvedAt: null,
    rejectedAt: null,
    rejectionReason: null,
    completedAt: null
  }
]
```

#### Matches (`pmtwin_matches`)
```javascript
[
  {
    id: "match_101",
    projectId: "project_456",
    providerId: "provider_321",
    score: 85,                          // Percentage (0-100)
    criteria: {
      categoryMatch: 100,               // Percentage
      skillsMatch: 90,
      experienceMatch: 80,
      locationMatch: 70
    },
    weights: {
      category: 0.3,
      skills: 0.4,
      experience: 0.2,
      location: 0.1
    },
    notified: false,
    viewed: false,
    proposalSubmitted: false,
    createdAt: "2024-01-01T00:00:00Z",
    notifiedAt: null,
    viewedAt: null
  }
]
```

#### Audit Trail (`pmtwin_audit`)
```javascript
[
  {
    id: "audit_202",
    timestamp: "2024-01-01T00:00:00Z",
    userId: "user_123",
    userRole: "individual" | "entity" | "admin",
    action: "user_registration" | "project_creation" | "proposal_submission" | 
            "vetting_approval" | "vetting_rejection" | "proposal_approval" | 
            "proposal_rejection" | "contract_acceptance" | "status_change" |
            "profile_update" | "admin_action",
    entityType: "user" | "project" | "proposal" | "match" | "contract",
    entityId: "user_123",
    details: {
      description: "Human-readable description",
      changes: {},                      // Object with before/after if applicable
      ipAddress: null,                  // Future: capture IP
      userAgent: null                   // Future: capture browser
    }
  }
]
```

### 2.2 Data Versioning
```javascript
{
  version: "1.0.0",                     // Schema version
  data: { /* actual data */ }
}
```

### 2.3 localStorage Limitations
- **Storage Limit:** ~5-10MB per domain (browser-dependent)
- **Data Type:** Only strings (JSON.stringify/parse required)
- **Persistence:** Cleared when user clears browser data
- **Scope:** Per domain, not shared across domains
- **Synchronous:** Blocking operations (consider performance)

### 2.4 Data Migration Strategy (Future)
- Version check on app load
- Migration functions for schema changes
- Backup before migration
- Rollback capability

## 3. Browser Compatibility

### 3.1 Supported Browsers (POC)
- **Chrome:** Latest 2 versions
- **Firefox:** Latest 2 versions
- **Safari:** Latest 2 versions
- **Edge:** Latest 2 versions

### 3.2 Required Features
- **localStorage API:** All modern browsers support
- **ES6+ JavaScript:** Arrow functions, async/await, destructuring, template literals
- **CSS Grid:** All modern browsers support
- **CSS Flexbox:** All modern browsers support
- **CSS Custom Properties:** All modern browsers support
- **Hash-based Routing:** Window.location.hash API

### 3.3 Polyfills (If Needed)
- None required for POC (target modern browsers only)
- Future: Consider polyfills for older browser support

## 4. Responsive Breakpoints

### 4.1 Breakpoint Definitions
```css
/* Mobile First Approach */
/* Mobile: Default (< 768px) */
/* Tablet: 768px and up */
/* Desktop: 1024px and up */
/* Large Desktop: 1440px and up */
```

### 4.2 Breakpoint Values
- **Mobile:** 0px - 767px (single column, touch-optimized)
- **Tablet:** 768px - 1023px (two columns, hybrid)
- **Desktop:** 1024px - 1439px (multi-column, full features)
- **Large Desktop:** 1440px+ (optimized for large screens)

### 4.3 Responsive Considerations
- **Navigation:** Top nav (desktop) → Hamburger menu (mobile)
- **Tables:** Horizontal scroll (mobile) → Full table (desktop)
- **Forms:** Single column (mobile) → Multi-column (desktop)
- **Cards:** Stacked (mobile) → Grid (desktop)
- **Modals:** Full screen (mobile) → Centered (desktop)

## 5. Performance Requirements

### 5.1 Loading Performance
- **Initial Load:** < 2 seconds (target)
- **Page Navigation:** < 500ms (hash routing)
- **Data Operations:** < 100ms (localStorage read/write)

### 5.2 Optimization Strategies
- **CSS:** Single file, minified (for production)
- **JavaScript:** Modular loading, lazy initialization
- **Images:** Optimized, appropriate formats (WebP, SVG)
- **localStorage:** Efficient data structure, minimal reads/writes
- **DOM:** Minimal DOM manipulation, use document fragments

### 5.3 Resource Limits
- **CSS File:** < 100KB (uncompressed)
- **JavaScript Files:** < 50KB each (uncompressed)
- **Total JS:** < 300KB (all files combined)
- **Images:** Optimized, < 200KB each

## 6. Security Considerations (POC Limitations)

### 6.1 POC Limitations
- **Password Storage:** Basic encoding only (NOT secure, POC only)
- **No HTTPS:** Local development only
- **No CSRF Protection:** Not applicable (no server)
- **No XSS Protection:** Developer responsibility (sanitize inputs)
- **Session Security:** Basic token (NOT secure, POC only)

### 6.2 Security Best Practices (POC)
- Sanitize user inputs (prevent XSS)
- Validate all form inputs
- Escape HTML in user-generated content
- Use HTTPS in production (future)
- Implement proper password hashing (future)
- Use secure session tokens (future)

### 6.3 Production Security Requirements (Future)
- HTTPS mandatory
- Password hashing (bcrypt, Argon2)
- JWT tokens for sessions
- CSRF protection
- XSS protection (Content Security Policy)
- Input validation and sanitization
- Rate limiting
- Secure file uploads

## 7. Accessibility Requirements

### 7.1 WCAG 2.1 Compliance
- **Target Level:** AA (minimum)
- **Key Requirements:**
  - Keyboard navigation support
  - Screen reader compatibility
  - Color contrast ratios (4.5:1 for text)
  - Alt text for images
  - Form labels and error messages
  - Focus indicators

### 7.2 Implementation
- Semantic HTML5 elements
- ARIA labels where needed
- Keyboard shortcuts for common actions
- Skip navigation links
- Focus management in modals
- Error announcements for screen readers

## 8. Code Organization

### 8.1 File Structure
```
POC/
├── index.html
├── public-portal.html
├── user-portal.html
├── admin-portal.html
├── mobile-app.html
├── css/
│   └── main.css
├── js/
│   ├── auth.js
│   ├── data.js
│   ├── public-portal.js
│   ├── user-portal.js
│   ├── admin-portal.js
│   ├── mobile-app.js
│   └── matching.js
└── assets/
    └── (images, icons)
```

### 8.2 JavaScript Module Pattern
- Each JS file is a module (IIFE or ES6 modules if supported)
- Global namespace pollution prevention
- Clear dependencies between modules
- Consistent naming conventions

### 8.3 CSS Organization
- CSS Custom Properties (variables) at top
- Base styles (reset, typography)
- Component styles (buttons, cards, forms)
- Layout styles (grid, flexbox)
- Portal-specific styles (sections)
- Responsive styles (media queries)

## 9. Testing Requirements

### 9.1 Manual Testing (POC)
- All user flows tested
- Cross-browser testing
- Responsive design testing (various screen sizes)
- localStorage data persistence
- Authentication flows
- Role-based access

### 9.2 Test Scenarios
- Registration flow (Individual and Entity)
- Login/Logout
- Project creation
- Matching algorithm
- Proposal submission (Cash and Barter)
- Admin vetting
- Service pipeline updates
- Mobile app features
- Offline mode (simulated)

### 9.3 Future Testing (Production)
- Unit tests (Jest, Mocha)
- Integration tests
- E2E tests (Cypress, Playwright)
- Performance tests
- Security tests
- Accessibility tests

## 10. Deployment Considerations (Future)

### 10.1 Hosting
- Static file hosting (Netlify, Vercel, AWS S3)
- CDN for global distribution
- Custom domain setup

### 10.2 Environment Configuration
- Development environment
- Staging environment
- Production environment
- Environment variables for configuration

### 10.3 Monitoring (Future)
- Error tracking (Sentry)
- Analytics (Google Analytics, custom)
- Performance monitoring
- User behavior tracking

---

*These technical requirements define the constraints and standards for the PMTwin POC implementation.*

