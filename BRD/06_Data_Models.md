# Data Models Documentation

## 1. User Data Models

### 1.1 Individual User Model
```javascript
{
  id: "user_123",                      // UUID or sequential ID
  email: "professional@example.com",   // Unique, validated
  password: "encoded_password",         // Hashed/encoded (POC: basic encoding)
  role: "individual",
  
  profile: {
    // Personal Information
    name: "Ahmed Al-Saud",
    professionalTitle: "Senior Civil Engineer",
    phone: "+966501234567",
    location: {
      city: "Riyadh",
      region: "Riyadh Province",
      country: "Saudi Arabia"
    },
    bio: "Experienced civil engineer with 10+ years...",
    
    // Professional Details
    skills: [                           // Array of skill tags
      "Project Management",
      "Civil Engineering",
      "Construction Planning",
      "Quality Control"
    ],
    experienceLevel: "senior",          // junior | intermediate | senior | expert
    certifications: [                   // Array of certification objects
      {
        name: "PMP Certification",
        issuer: "PMI",
        issueDate: "2020-01-01",
        expiryDate: "2023-01-01",
        credentialId: "PMP-123456"
      }
    ],
    
    // Credentials
    credentials: [
      {
        type: "license",                // license | cv | certification
        fileName: "professional_license.pdf",
        fileSize: 2048000,              // bytes
        uploadedAt: "2024-01-01T00:00:00Z",
        verified: false                 // Admin verification status
      },
      {
        type: "cv",
        fileName: "ahmed_cv.pdf",
        fileSize: 1536000,
        uploadedAt: "2024-01-01T00:00:00Z",
        verified: false
      }
    ],
    
    // Portfolio
    portfolio: [
      {
        id: "portfolio_1",
        title: "Highway Infrastructure Project",
        description: "Led construction of 50km highway...",
        completionDate: "2023-06-01",
        link: "https://portfolio.example.com/project1"
      }
    ],
    
    // Endorsements
    endorsements: [
      {
        id: "endorsement_1",
        endorserId: "entity_456",
        endorserName: "ABC Construction Co.",
        comment: "Excellent project management skills...",
        date: "2024-01-01T00:00:00Z"
      }
    ],
    
    // Account Status
    status: "approved",                 // pending | approved | rejected
    createdAt: "2024-01-01T00:00:00Z",
    approvedAt: "2024-01-02T00:00:00Z",
    approvedBy: "admin_001",            // Admin user ID
    rejectedAt: null,
    rejectionReason: null
  },
  
  // Activity Tracking
  lastLoginAt: "2024-01-15T10:30:00Z",
  totalProposals: 5,
  activeProposals: 2,
  completedProjects: 3
}
```

### 1.2 Entity User Model
```javascript
{
  id: "entity_456",
  email: "company@example.com",
  password: "encoded_password",
  role: "entity",
  
  profile: {
    // Company Information
    companyName: "ABC Construction Co.",
    legalName: "ABC Construction Company Ltd.",
    phone: "+966112345678",
    website: "https://www.abcconstruction.com",
    location: {
      headquarters: {
        city: "Riyadh",
        region: "Riyadh Province",
        country: "Saudi Arabia",
        address: "King Fahd Road, Building 123"
      },
      branches: [                       // Array of branch locations
        {
          city: "Jeddah",
          region: "Makkah Province",
          country: "Saudi Arabia"
        }
      ]
    },
    companyDescription: "Leading construction company...",
    
    // Business Details
    commercialRegistration: {
      number: "CR-1234567890",
      issueDate: "2010-01-01",
      expiryDate: "2025-01-01",
      verified: true
    },
    vatNumber: {
      number: "VAT-123456789012345",
      verified: true
    },
    yearsInBusiness: 15,
    annualRevenueRange: "50M-100M",    // SAR
    employeeCount: "500-1000",
    
    // Services Offered
    services: [                         // Array of service categories
      "General Contracting",
      "Infrastructure Development",
      "Project Management",
      "Engineering Services"
    ],
    serviceDescriptions: {
      "General Contracting": "Full-service construction...",
      "Infrastructure Development": "Roads, bridges, utilities..."
    },
    capacity: {
      maxProjectValue: 100000000,       // SAR
      concurrentProjects: 10
    },
    
    // Credentials
    credentials: [
      {
        type: "cr",                     // cr | vat | license | profile
        fileName: "commercial_registration.pdf",
        fileSize: 1024000,
        uploadedAt: "2024-01-01T00:00:00Z",
        verified: true
      },
      {
        type: "vat",
        fileName: "vat_certificate.pdf",
        fileSize: 512000,
        uploadedAt: "2024-01-01T00:00:00Z",
        verified: true
      }
    ],
    
    // Key Projects
    keyProjects: [
      {
        id: "key_project_1",
        title: "Mega Infrastructure Project",
        value: 50000000,
        completionDate: "2023-12-01",
        status: "completed"
      }
    ],
    
    // Financial Health (for dashboard)
    financialHealth: {
      activeJVs: 3,
      activeTenders: 5,
      totalJVValue: 150000000,
      totalSavings: 5000000             // From bulk purchasing + barter
    },
    
    // Account Status
    status: "approved",
    createdAt: "2024-01-01T00:00:00Z",
    approvedAt: "2024-01-02T00:00:00Z",
    approvedBy: "admin_001",
    rejectedAt: null,
    rejectionReason: null
  },
  
  // Activity Tracking
  lastLoginAt: "2024-01-15T14:20:00Z",
  totalProjectsCreated: 10,
  activeProjects: 3,
  totalProposalsReceived: 25
}
```

### 1.3 Admin User Model
```javascript
{
  id: "admin_001",
  email: "admin@pmtwin.com",
  password: "encoded_password",
  role: "admin",
  
  profile: {
    name: "Admin User",
    department: "Operations",
    permissions: [                      // Array of permission strings
      "vet_users",
      "moderate_projects",
      "view_reports",
      "manage_audit_trail"
    ],
    createdAt: "2024-01-01T00:00:00Z"
  },
  
  // Activity Tracking
  lastLoginAt: "2024-01-15T16:00:00Z",
  totalUsersVetted: 150,
  totalProjectsModerated: 50
}
```

## 2. Project/Mega-Project Models

### 2.1 Project Model
```javascript
{
  id: "project_789",
  creatorId: "entity_456",             // Entity user ID
  
  // Basic Information
  title: "Mega Infrastructure Development Project",
  description: "Comprehensive infrastructure development...", // Rich text
  category: "Infrastructure",           // Infrastructure | Residential | Commercial | Industrial
  location: {
    city: "Riyadh",
    region: "Riyadh Province",
    country: "Saudi Arabia",
    coordinates: {                      // Optional, for future GPS features
      lat: 24.7136,
      lng: 46.6753
    }
  },
  projectType: "jv",                   // jv | consortium | service_provider | mixed
  
  // Scope & Requirements
  scope: {
    coreDescription: "Development of 100km highway with bridges...",
    requiredServices: [                 // Array of service categories
      "Engineering Services",
      "Construction Services",
      "Logistics & Transportation",
      "Quality Control"
    ],
    skillRequirements: [                 // Array of skill tags
      "Highway Engineering",
      "Bridge Construction",
      "Project Management",
      "Environmental Compliance"
    ],
    experienceLevel: "senior",          // intermediate | senior | expert
    minimumExperience: 5,               // years
    certificationsRequired: [            // Optional
      "PMP",
      "Professional Engineering License"
    ]
  },
  
  // Requested Facilities
  facilities: {
    offices: {
      quantity: 2,
      size: "200 sqm each",
      location: "Site office",
      requirements: "Air-conditioned, internet connectivity"
    },
    vehicles: [
      {
        type: "SUV",
        quantity: 3,
        specifications: "4WD, suitable for off-road"
      },
      {
        type: "Truck",
        quantity: 2,
        specifications: "Heavy-duty, 10-ton capacity"
      }
    ],
    equipment: [
      {
        name: "Cranes",
        quantity: 2,
        specifications: "Mobile crane, 50-ton capacity"
      },
      {
        name: "Excavators",
        quantity: 3,
        specifications: "Heavy-duty excavator"
      }
    ],
    other: "Temporary site facilities, security services"
  },
  
  // Financial Details
  budget: {
    min: 10000000,                      // SAR
    max: 50000000,                      // SAR
    currency: "SAR",
    paymentSchedule: "milestone_based"  // upfront | milestone_based | completion
  },
  paymentTerms: "30_days",              // 30_days | 60_days | milestone_based
  barterAvailable: true,                // Whether barter proposals accepted
  
  // Timeline
  timeline: {
    startDate: "2024-03-01",
    expectedDuration: 18,               // months
    milestones: [
      {
        id: "milestone_1",
        name: "Site Preparation",
        date: "2024-04-01",
        description: "Clear site, establish facilities"
      },
      {
        id: "milestone_2",
        name: "Foundation Work",
        date: "2024-06-01",
        description: "Complete foundation for all structures"
      },
      {
        id: "milestone_3",
        name: "Infrastructure Completion",
        date: "2024-12-01",
        description: "Complete all infrastructure components"
      }
    ]
  },
  
  // Additional Information
  specialRequirements: "Must comply with Saudi building codes...",
  attachments: [                        // Array of file metadata
    {
      fileName: "project_specifications.pdf",
      fileSize: 5120000,
      uploadedAt: "2024-01-01T00:00:00Z"
    }
  ],
  
  // Status & Visibility
  status: "active",                     // draft | active | in_progress | completed | cancelled
  visibility: "public",                 // public | registered_only
  flagged: false,
  flagReason: null,
  qualityScore: 95,                     // Auto-calculated (0-100)
  
  // Timestamps
  createdAt: "2024-01-01T00:00:00Z",
  publishedAt: "2024-01-01T12:00:00Z",
  updatedAt: "2024-01-15T10:00:00Z",
  
  // Statistics
  views: 45,
  matchesGenerated: 12,
  proposalsReceived: 5,
  proposalsApproved: 1
}
```

## 3. Proposal Models

### 3.1 Cash Proposal Model
```javascript
{
  id: "proposal_101",
  projectId: "project_789",
  providerId: "provider_321",           // Individual or Entity user ID
  type: "cash",
  
  // Service Description
  serviceDescription: "Comprehensive engineering services including...", // Rich text
  
  // Pricing Breakdown
  pricing: [
    {
      id: "item_1",
      item: "Engineering Design Services",
      description: "Complete design and engineering...",
      quantity: 1,
      unit: "project",
      unitPrice: 2000000,               // SAR
      total: 2000000
    },
    {
      id: "item_2",
      item: "Project Management",
      description: "Full project management services...",
      quantity: 18,
      unit: "months",
      unitPrice: 50000,
      total: 900000
    },
    {
      id: "item_3",
      item: "Quality Control Services",
      description: "Ongoing quality control and inspection...",
      quantity: 1,
      unit: "project",
      unitPrice: 300000,
      total: 300000
    }
  ],
  subtotal: 3200000,
  taxes: {
    vat: 480000,                        // 15% VAT (Saudi Arabia)
    other: 0
  },
  total: 3680000,
  currency: "SAR",
  
  // Timeline
  timeline: {
    startDate: "2024-03-01",
    completionDate: "2025-08-01",
    duration: 18,                       // months
    milestones: [
      {
        name: "Design Phase Complete",
        date: "2024-06-01",
        paymentPercentage: 30
      },
      {
        name: "Construction Phase Complete",
        date: "2025-03-01",
        paymentPercentage: 50
      },
      {
        name: "Final Handover",
        date: "2025-08-01",
        paymentPercentage: 20
      }
    ]
  },
  
  // Terms & Conditions
  terms: {
    paymentSchedule: "Milestone-based payments as outlined above",
    deliverables: [
      "Complete engineering designs",
      "Project management reports",
      "Quality control documentation"
    ],
    warranties: "12-month warranty on all designs",
    penalties: "5% penalty for delays exceeding 30 days",
    other: "Additional terms as per standard contract..."
  },
  
  // Attachments
  attachments: [
    {
      fileName: "technical_proposal.pdf",
      fileSize: 2048000,
      uploadedAt: "2024-01-01T00:00:00Z"
    },
    {
      fileName: "company_profile.pdf",
      fileSize: 1536000,
      uploadedAt: "2024-01-01T00:00:00Z"
    }
  ],
  
  // Status
  status: "in_review",                  // in_review | evaluation | approved | rejected | completed
  submittedAt: "2024-01-01T00:00:00Z",
  evaluatedAt: null,
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  completedAt: null,
  
  // Contract
  contractAccepted: false,
  contractAcceptedAt: null,
  contractDocument: null                // Link to contract document
}
```

### 3.2 Barter Proposal Model
```javascript
{
  id: "proposal_102",
  projectId: "project_789",
  providerId: "provider_321",
  type: "barter",
  
  // Services Offered
  servicesOffered: [
    {
      id: "service_offered_1",
      description: "Engineering Design Services",
      value: 2000000,                    // SAR
      timeline: "6 months",
      deliverables: [
        "Complete design documentation",
        "Technical specifications",
        "Construction drawings"
      ]
    },
    {
      id: "service_offered_2",
      description: "Project Management Services",
      value: 900000,
      timeline: "12 months",
      deliverables: [
        "Monthly progress reports",
        "Risk management plans",
        "Stakeholder coordination"
      ]
    }
  ],
  totalOffered: 2900000,
  
  // Services Requested in Exchange
  servicesRequested: [
    {
      id: "service_requested_1",
      description: "Construction Services",
      value: 2500000,
      timeline: "12 months",
      requirements: [
        "Site preparation",
        "Foundation work",
        "Structural construction"
      ]
    },
    {
      id: "service_requested_2",
      description: "Logistics & Transportation",
      value: 400000,
      timeline: "Ongoing",
      requirements: [
        "Material transportation",
        "Equipment delivery",
        "Waste removal"
      ]
    }
  ],
  totalRequested: 2900000,
  
  // Value Equivalence
  equivalence: {
    balance: 0,                          // Difference (offered - requested)
    cashComponent: 0,                   // If imbalance, cash to balance
    exchangeRate: 1.0                   // If different currencies (future)
  },
  
  // Barter Terms
  terms: {
    exchangeSchedule: "Services to be exchanged concurrently",
    qualityStandards: "All services must meet project specifications",
    disputeResolution: "Disputes to be resolved through PMTwin mediation",
    cancellation: "Either party may cancel with 30 days notice",
    other: "Additional barter-specific terms..."
  },
  
  // Attachments
  attachments: [
    {
      fileName: "barter_proposal.pdf",
      fileSize: 1024000,
      uploadedAt: "2024-01-01T00:00:00Z"
    }
  ],
  
  // Status
  status: "in_review",
  submittedAt: "2024-01-01T00:00:00Z",
  evaluatedAt: null,
  approvedAt: null,
  rejectedAt: null,
  rejectionReason: null,
  completedAt: null,
  
  // Contract
  contractAccepted: false,
  contractAcceptedAt: null,
  contractDocument: null
}
```

## 4. Matching Algorithm Data Structures

### 4.1 Match Score Calculation
```javascript
{
  projectId: "project_789",
  providerId: "provider_321",
  
  // Individual Criteria Scores (0-100)
  criteria: {
    categoryMatch: 100,                 // Provider's services match project category
    skillsMatch: 90,                    // Provider's skills match required skills
    experienceMatch: 80,                // Provider's experience level matches
    locationMatch: 70,                  // Provider's location proximity
    pastPerformance: 85                 // If available (future)
  },
  
  // Weights (must sum to 1.0)
  weights: {
    category: 0.30,
    skills: 0.40,
    experience: 0.20,
    location: 0.10,
    pastPerformance: 0.00               // Not used in POC
  },
  
  // Final Score Calculation
  // score = (categoryMatch × 0.30) + (skillsMatch × 0.40) + 
  //         (experienceMatch × 0.20) + (locationMatch × 0.10)
  finalScore: 88,                       // Weighted average
  
  // Match Details
  matchingDetails: {
    matchedServices: [
      "Engineering Services",
      "Project Management"
    ],
    matchedSkills: [
      "Highway Engineering",
      "Project Management",
      "Quality Control"
    ],
    experienceGap: 0,                   // Years difference (positive = provider has more)
    locationDistance: 50                // km (if available)
  },
  
  // Threshold
  meetsThreshold: true,                 // finalScore >= 80
  notified: false,
  viewed: false,
  proposalSubmitted: false
}
```

### 4.2 Matching Criteria Details
```javascript
{
  // Category Matching
  categoryMatch: {
    projectCategories: ["Infrastructure"],
    providerServices: ["Infrastructure Development", "General Contracting"],
    matchPercentage: 100,               // Perfect match
    explanation: "Provider offers services in Infrastructure category"
  },
  
  // Skills Matching
  skillsMatch: {
    requiredSkills: [
      "Highway Engineering",
      "Bridge Construction",
      "Project Management"
    ],
    providerSkills: [
      "Highway Engineering",
      "Project Management",
      "Quality Control",
      "Civil Engineering"
    ],
    matchedSkills: [
      "Highway Engineering",
      "Project Management"
    ],
    unmatchedSkills: ["Bridge Construction"],
    matchPercentage: 66.67,             // 2 out of 3 matched
    explanation: "2 out of 3 required skills match"
  },
  
  // Experience Matching
  experienceMatch: {
    requiredLevel: "senior",
    requiredYears: 5,
    providerLevel: "senior",
    providerYears: 8,
    matchPercentage: 100,
    explanation: "Provider meets senior level requirement with 8 years experience"
  },
  
  // Location Matching
  locationMatch: {
    projectLocation: {
      city: "Riyadh",
      region: "Riyadh Province"
    },
    providerLocation: {
      city: "Riyadh",
      region: "Riyadh Province"
    },
    distance: 0,                        // Same city
    matchPercentage: 100,
    explanation: "Provider located in same city as project"
  }
}
```

## 5. Audit Trail Data Model

### 5.1 Audit Log Entry
```javascript
{
  id: "audit_303",
  timestamp: "2024-01-15T10:30:00Z",
  
  // User Information
  userId: "user_123",
  userRole: "individual",              // individual | entity | admin
  userEmail: "user@example.com",
  userName: "Ahmed Al-Saud",
  
  // Action Details
  action: "proposal_submission",        // Action type (see action types below)
  actionCategory: "proposal",           // user | project | proposal | match | contract | admin
  entityType: "proposal",                // Type of entity affected
  entityId: "proposal_101",
  
  // Action Description
  description: "User submitted cash proposal for project 'Mega Infrastructure Project'",
  
  // Changes (if applicable)
  changes: {
    before: {
      status: null                       // Proposal didn't exist
    },
    after: {
      status: "in_review",
      type: "cash",
      total: 3680000
    }
  },
  
  // Context
  context: {
    projectId: "project_789",
    projectTitle: "Mega Infrastructure Development Project",
    ipAddress: null,                     // Future: capture IP
    userAgent: null,                     // Future: capture browser
    portal: "user_portal"                // Portal where action occurred
  },
  
  // Additional Metadata
  metadata: {
    proposalType: "cash",
    proposalValue: 3680000,
    currency: "SAR"
  }
}
```

### 5.2 Action Types
```javascript
// User Actions
"user_registration"
"user_login"
"user_logout"
"profile_update"
"credential_upload"

// Project Actions
"project_creation"
"project_publication"
"project_update"
"project_cancellation"

// Proposal Actions
"proposal_submission"
"proposal_update"
"proposal_withdrawal"
"proposal_approval"
"proposal_rejection"

// Matching Actions
"match_generated"
"match_notified"
"match_viewed"

// Contract Actions
"contract_acceptance"
"contract_rejection"

// Admin Actions
"vetting_approval"
"vetting_rejection"
"project_moderation"
"project_removal"
"user_suspension"
```

## 6. Notification Data Model

### 6.1 Notification Entry
```javascript
{
  id: "notification_404",
  userId: "user_123",                    // Recipient user ID
  type: "match_found",                   // Notification type
  title: "New Match Found!",
  message: "You have an 88% match for 'Mega Infrastructure Project'",
  
  // Related Entity
  relatedEntityType: "match",            // match | proposal | project | user
  relatedEntityId: "match_101",
  
  // Action
  actionUrl: "#/user-portal/matches/match_101",
  actionLabel: "View Match",
  
  // Status
  read: false,
  readAt: null,
  
  // Timestamps
  createdAt: "2024-01-15T10:30:00Z",
  expiresAt: null                        // Optional expiration
}
```

### 6.2 Notification Types
```javascript
"match_found"                           // New match >80%
"proposal_received"                     // New proposal on your project
"proposal_approved"                     // Your proposal was approved
"proposal_rejected"                     // Your proposal was rejected
"account_approved"                      // Your account was approved
"account_rejected"                      // Your account was rejected
"project_status_change"                 // Project status updated
"rfi_received"                          // Request for Information
"milestone_reminder"                    // Milestone deadline approaching
```

## 7. Collaboration Models Data Models

### 7.1 Collaboration Opportunity Model (All Models)

**Base Structure:**
```javascript
{
  id: "opp_123",
  modelId: "1.1" | "1.2" | "1.3" | "1.4" | "2.1" | "2.2" | "2.3" | "3.1" | "3.2" | "3.3" | "4.1" | "4.2" | "5.1",
  modelName: "Task-Based Engagement",
  category: "Project-Based Collaboration" | "Strategic Partnerships" | "Resource Pooling & Sharing" | "Hiring a Resource" | "Call for Competition",
  creatorId: "user_123",
  creatorType: "entity" | "individual",
  title: "Opportunity Title",
  description: "Full description of the opportunity...",
  status: "draft" | "pending" | "active" | "closed" | "rejected" | "cancelled",
  
  // Model-specific attributes (varies by model)
  attributes: {
    // Model 1.1: Task-Based
    taskTitle: "Review shop drawings",
    taskType: "Design" | "Engineering" | "Consultation" | "Review" | "Analysis",
    detailedScope: "...",
    duration: 30, // days
    budgetRange: { min: 50000, max: 100000, currency: "SAR" },
    
    // Model 1.2: Consortium
    projectValue: 50000000,
    consortiumSize: 3,
    requiredSpecialties: ["Engineering", "Construction"],
    
    // Model 1.3: JV
    jvStructure: "50-50" | "60-40" | "70-30",
    managementStructure: "shared" | "lead",
    
    // Model 1.4: SPV
    spvValue: 100000000, // Must be 50M+ SAR
    riskIsolation: true,
    
    // Model 2.1, 2.2: Strategic
    strategicObjectives: [...],
    targetSectors: [...],
    duration: 120, // months (10+ years)
    
    // Model 2.3: Mentorship
    mentorshipType: "entity-to-entity" | "entity-to-individual" | "individual-to-individual",
    knowledgeAreas: [...],
    
    // Model 3.1: Bulk Purchasing
    materialType: "...",
    quantity: 1000,
    targetPrice: 50000,
    
    // Model 3.2: Co-Ownership
    assetDescription: "...",
    assetValue: 2000000,
    ownershipSplit: "50-50",
    
    // Model 3.3: Resource Exchange
    barterOffer: "...",
    barterValue: 100000,
    barterPreferences: [...],
    
    // Model 4.1, 4.2: Hiring
    jobTitle: "...",
    requiredSkills: [...],
    experienceLevel: "junior" | "intermediate" | "senior" | "expert",
    salaryRange: { min: 10000, max: 20000 },
    
    // Model 5.1: Competition
    competitionType: "design" | "innovation" | "rfp" | "rfq",
    prizeAmount: 500000,
    submissionDeadline: "2024-02-01T00:00:00Z"
  },
  
  // Applications
  applications: ["app_1", "app_2"],
  applicationsReceived: 5,
  applicationsApproved: 2,
  
  // Timestamps
  createdAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  publishedAt: null,
  closedAt: null,
  
  // Admin fields
  approvedAt: null,
  approvedBy: null,
  rejectedAt: null,
  rejectedBy: null,
  rejectionReason: null
}
```

### 7.2 Collaboration Application Model

```javascript
{
  id: "app_123",
  opportunityId: "opp_123",
  applicantId: "user_456",
  applicantType: "entity" | "individual",
  status: "pending" | "under_review" | "approved" | "rejected" | "withdrawn",
  
  // Application data
  applicationData: {
    proposal: "Full proposal text...",
    qualifications: ["Qualification 1", "Qualification 2"],
    timeline: "30 days",
    budget: { amount: 100000, currency: "SAR" },
    deliverables: [...],
    // Model-specific application fields
  },
  
  // Review
  reviewedAt: null,
  reviewedBy: null,
  reviewNotes: null,
  rejectionReason: null,
  
  // Timestamps
  submittedAt: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z",
  approvedAt: null,
  rejectedAt: null
}
```

## 8. Admin Data Models

### 8.1 Admin User Model (Enhanced)

```javascript
{
  id: "admin_001",
  email: "admin@pmtwin.com",
  password: "encoded_password",
  role: "admin",
  adminType: "super_admin" | "admin" | "moderator" | "auditor",
  
  profile: {
    name: "Admin User",
    phone: "+966501234567",
    department: "Operations" | "Vetting" | "Moderation" | "Analytics",
    permissions: [
      "user_vetting",
      "project_moderation",
      "collaboration_management",
      "analytics_view",
      "settings_manage",
      "audit_view",
      "reports_generate"
    ]
  },
  
  // Activity tracking
  lastLoginAt: "2024-01-15T10:30:00Z",
  totalActions: 1500,
  actionsToday: 25,
  
  // Status
  status: "active" | "suspended",
  createdAt: "2024-01-01T00:00:00Z"
}
```

### 8.2 System Settings Model

```javascript
{
  id: "settings_001",
  
  // Platform Configuration
  platform: {
    name: "PMTwin",
    logo: "url_to_logo",
    contactEmail: "contact@pmtwin.com",
    contactPhone: "+966501234567",
    maintenanceMode: false,
    maintenanceMessage: null
  },
  
  // Matching Algorithm
  matching: {
    threshold: 80,              // Minimum match score percentage
    skillWeight: 0.4,           // Weight for skill matching
    locationWeight: 0.2,        // Weight for location proximity
    experienceWeight: 0.3,      // Weight for experience level
    financialWeight: 0.1,       // Weight for financial capacity
    enableAutoMatching: true,
    matchingFrequency: "realtime" | "hourly" | "daily"
  },
  
  // Notifications
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    emailTemplates: {
      welcome: "...",
      approval: "...",
      rejection: "...",
      matchFound: "..."
    },
    notificationFrequency: "immediate" | "daily_digest" | "weekly_digest"
  },
  
  // Feature Flags
  features: {
    barterEnabled: true,
    bulkPurchasingEnabled: true,
    mentorshipEnabled: true,
    spvEnabled: true,
    competitionEnabled: true,
    mobileAppEnabled: true
  },
  
  // Roles & Permissions
  roles: {
    // Role definitions with permissions
    admin: { permissions: [...] },
    moderator: { permissions: [...] },
    auditor: { permissions: [...] }
  },
  
  // Timestamps
  updatedAt: "2024-01-15T10:30:00Z",
  updatedBy: "admin_001"
}
```

### 8.3 Analytics Data Model

```javascript
{
  id: "analytics_001",
  period: "2024-01",            // Year-Month or custom range
  generatedAt: "2024-01-15T10:30:00Z",
  
  // User Analytics
  users: {
    total: 1000,
    byType: {
      individual: 600,
      entity: 400
    },
    byStatus: {
      approved: 950,
      pending: 50,
      rejected: 0
    },
    registrationTrend: [
      { date: "2024-01-01", count: 10 },
      { date: "2024-01-02", count: 15 },
      // ...
    ],
    geographicDistribution: {
      "Riyadh": 400,
      "Jeddah": 300,
      "Dammam": 200,
      // ...
    },
    profileCompletionRate: 0.85
  },
  
  // Project Analytics
  projects: {
    total: 500,
    active: 200,
    completed: 250,
    cancelled: 50,
    byCategory: {
      "Infrastructure": 200,
      "Residential": 150,
      "Commercial": 100,
      "Industrial": 50
    },
    averageValue: 5000000,
    totalValue: 2500000000,
    completionRate: 0.75,
    averageDuration: 180 // days
  },
  
  // Proposal Analytics
  proposals: {
    total: 2000,
    cash: 1200,
    barter: 800,
    approved: 1500,
    rejected: 300,
    pending: 200,
    approvalRate: 0.75,
    averageValue: 500000,
    totalValue: 1000000000
  },
  
  // Collaboration Models Analytics
  collaborations: {
    byModel: {
      "1.1": { count: 100, active: 50, completed: 40, value: 5000000 },
      "1.2": { count: 30, active: 15, completed: 10, value: 15000000 },
      "1.3": { count: 20, active: 10, completed: 8, value: 10000000 },
      "1.4": { count: 5, active: 3, completed: 1, value: 50000000 },
      "2.1": { count: 10, active: 8, completed: 2, value: 20000000 },
      "2.2": { count: 15, active: 12, completed: 3, value: 15000000 },
      "2.3": { count: 25, active: 20, completed: 5, value: 0 },
      "3.1": { count: 50, active: 30, completed: 15, savings: 5000000 },
      "3.2": { count: 20, active: 15, completed: 5, value: 40000000 },
      "3.3": { count: 100, active: 60, completed: 30, value: 10000000 },
      "4.1": { count: 80, active: 50, completed: 20, hires: 20 },
      "4.2": { count: 40, active: 30, completed: 10, engagements: 10 },
      "5.1": { count: 30, active: 20, completed: 8, submissions: 150 }
    },
    totalValue: 200000000,
    totalSavings: 10000000,
    successRate: 0.80,
    averageDuration: 90 // days
  },
  
  // Matching Analytics
  matching: {
    totalMatches: 5000,
    averageScore: 85,
    conversionRate: 0.60,      // Matches that led to proposals
    performance: {
      accuracy: 0.90,
      responseTime: 2.5,        // seconds
      userSatisfaction: 0.85
    },
    byCategory: {
      "Infrastructure": 2000,
      "Residential": 1500,
      // ...
    }
  },
  
  // Financial Analytics
  financial: {
    platformVolume: 500000000,
    totalSavings: 50000000,
    averageTransactionValue: 1000000,
    barterValue: 100000000,
    cashTransactions: 400000000,
    growthRate: 0.15            // 15% month-over-month
  }
}
```

---

*These data models define the structure and relationships of all entities in the PMTwin platform, including comprehensive admin and collaboration models data structures.*

