# RABC Framework Documentation

## Overview

RABC (Roles & Responsibilities) model is used to clarify ownership and accountability across PMTwin workflows. This framework ensures clear assignment of responsibilities for each activity in the platform.

## RABC Definitions

| Role | Description |
|------|-------------|
| **R – Responsible** | Executes the activity |
| **A – Accountable** | Owns the outcome and decision |
| **B – Beneficiary** | Receives value from the outcome |
| **C – Consulted** | Provides input or validation |

## RABC Matrix

### High-Level Activities

| Activity | Platform Admin | Need Owner | Offer Owner | AI Engine | Legal/Compliance |
|----------|---------------|------------|-------------|-----------|------------------|
| User Registration | R | B | B | C | A |
| Profile Verification | R | B | B | C | A |
| Post Need / Offer | C | R/A | R/A | C | B |
| Select Collaboration Model | C | R | R | C | B |
| Matching & Scoring | C | B | B | R/A | C |
| Shortlisting | C | R | R | C | B |
| Negotiation | B | R/A | R/A | C | C |
| Agreement Creation | C | R | R | C | A |
| Review & Rating | R | R | R | C | B |

### Detailed Workflow Assignments

#### 1. User Registration Workflow

- **Responsible (R)**: Platform Admin
- **Accountable (A)**: Legal/Compliance
- **Beneficiary (B)**: Need Owner, Offer Owner
- **Consulted (C)**: AI Engine (for profile validation)

#### 2. Post Need/Offer Workflow

- **Responsible (R)**: Need Owner / Offer Owner
- **Accountable (A)**: Need Owner / Offer Owner
- **Beneficiary (B)**: Legal/Compliance (ensures compliance)
- **Consulted (C)**: Platform Admin, AI Engine

#### 3. Matching & Scoring Workflow

- **Responsible (R)**: AI Engine
- **Accountable (A)**: AI Engine
- **Beneficiary (B)**: Need Owner, Offer Owner
- **Consulted (C)**: Platform Admin, Legal/Compliance

#### 4. Negotiation Workflow

- **Responsible (R)**: Need Owner / Offer Owner
- **Accountable (A)**: Need Owner / Offer Owner
- **Beneficiary (B)**: Platform Admin (platform value)
- **Consulted (C)**: Legal/Compliance, AI Engine

#### 5. Agreement Creation Workflow

- **Responsible (R)**: Need Owner / Offer Owner
- **Accountable (A)**: Legal/Compliance
- **Beneficiary (B)**: Need Owner, Offer Owner
- **Consulted (C)**: Platform Admin, AI Engine

## Implementation

The RABC framework is implemented in `src/business-logic/rbac/rabc-service.js` and integrated into workflows throughout the platform.

## Usage

```javascript
// Check RABC assignment for an activity
const rabc = RABCService.getAssignment('user_registration');
// Returns: { R: 'Platform Admin', A: 'Legal/Compliance', B: ['Need Owner', 'Offer Owner'], C: ['AI Engine'] }

// Validate if user can perform action
const canPerform = RABCService.canPerform('post_need', userId, userRole);
// Returns: boolean
```

## Benefits

1. **Clear Accountability**: Each activity has a single accountable party
2. **Transparency**: All stakeholders know their roles
3. **Compliance**: Legal/Compliance is accountable for critical decisions
4. **Efficiency**: Reduces confusion about who does what
