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

---

*These data models define the structure and relationships of all entities in the PMTwin platform.*

