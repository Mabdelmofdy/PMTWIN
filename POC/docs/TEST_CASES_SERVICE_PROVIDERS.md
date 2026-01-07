# Service Providers Test Cases

## Manual Testing Checklist

### 1. Service Provider Profile Management

#### Test Case 1.1: Create Service Provider Profile
- **Prerequisites**: User with `skill_service_provider` role
- **Steps**:
  1. Navigate to Service Provider Profile page
  2. Fill in profile form (provider type, skills, certifications, availability, pricing)
  3. Submit form
- **Expected**: Profile created successfully
- **Validation**: Profile appears in admin view

#### Test Case 1.2: Update Service Provider Profile
- **Prerequisites**: Existing service provider profile
- **Steps**:
  1. Navigate to Service Provider Profile page
  2. Update profile information
  3. Submit form
- **Expected**: Profile updated successfully

#### Test Case 1.3: Search Service Provider Skills
- **Prerequisites**: Multiple service providers with different skills
- **Steps**:
  1. As Vendor/Entity, search for providers by skills
  2. Verify results match search criteria
- **Expected**: Relevant providers returned with skill match scores

### 2. Service Request Management

#### Test Case 2.1: Create Service Request (Entity/Vendor)
- **Prerequisites**: User with `entity`, `beneficiary`, or `vendor` role
- **Steps**:
  1. Navigate to Create Service Request page
  2. Fill in request details (title, description, required skills, budget, timeline)
  3. Submit form
- **Expected**: Service request created with OPEN status

#### Test Case 2.2: View Service Requests (Service Provider)
- **Prerequisites**: Service Provider user, existing service requests
- **Steps**:
  1. Navigate to Service Requests page
  2. View list of available requests
- **Expected**: Only OPEN requests visible to service providers

#### Test Case 2.3: View Service Requests (Entity/Vendor)
- **Prerequisites**: Entity/Vendor user, created service requests
- **Steps**:
  1. Navigate to Service Requests page
  2. View list of own requests
- **Expected**: All own requests visible regardless of status

### 3. Service Offer Management

#### Test Case 3.1: Submit Service Offer
- **Prerequisites**: Service Provider user, OPEN service request
- **Steps**:
  1. Navigate to service request details
  2. Fill in offer form (message, pricing)
  3. Submit offer
- **Expected**: Offer created with SUBMITTED status

#### Test Case 3.2: Accept Service Offer
- **Prerequisites**: Entity/Vendor user, SUBMITTED offer
- **Steps**:
  1. Navigate to service request with offers
  2. Accept an offer
- **Expected**: Offer status changed to ACCEPTED, engagement created, request status changed to APPROVED

#### Test Case 3.3: Reject Service Offer
- **Prerequisites**: Entity/Vendor user, SUBMITTED offer
- **Steps**:
  1. Navigate to service request with offers
  2. Reject an offer with reason
- **Expected**: Offer status changed to REJECTED

### 4. Service Engagement Management

#### Test Case 4.1: View Service Engagements
- **Prerequisites**: User with active engagements
- **Steps**:
  1. Navigate to Service Engagements page
  2. View list of engagements
- **Expected**: All user's engagements displayed (as provider or requester)

#### Test Case 4.2: Complete Service Engagement
- **Prerequisites**: ACTIVE engagement
- **Steps**:
  1. Navigate to Service Engagements page
  2. Mark engagement as completed
- **Expected**: Engagement status changed to COMPLETED, completedAt timestamp set

#### Test Case 4.3: Link Engagement to Sub-Project
- **Prerequisites**: ACTIVE engagement, existing sub-project
- **Steps**:
  1. Link engagement to sub-project
- **Expected**: Engagement linked to sub-project (reference only, not project contract)

### 5. RBAC Enforcement Tests

#### Test Case 5.1: Service Provider Cannot Access Projects
- **Prerequisites**: User with `skill_service_provider` role
- **Steps**:
  1. Attempt to access project creation page
  2. Attempt to submit project proposal
- **Expected**: Access blocked, error message displayed

#### Test Case 5.2: Sub-Contractor Cannot Access Services
- **Prerequisites**: User with `sub_contractor` role
- **Steps**:
  1. Attempt to access service request pages
  2. Attempt to create service request
- **Expected**: Access blocked, error message displayed

#### Test Case 5.3: Entity/Vendor Can Create Service Requests
- **Prerequisites**: User with `entity`, `beneficiary`, or `vendor` role
- **Steps**:
  1. Navigate to Create Service Request page
  2. Create service request
- **Expected**: Service request created successfully

### 6. Matching Tests

#### Test Case 6.1: Service Provider Matching
- **Prerequisites**: Service request with required skills, multiple providers with varying skills
- **Steps**:
  1. Create service request
  2. View matched providers
- **Expected**: Providers ranked by skill match score, availability, and pricing

#### Test Case 6.2: Match Statistics
- **Prerequisites**: Service request with multiple provider matches
- **Steps**:
  1. View match statistics for a request
- **Expected**: Statistics show total matches, average score, top score, matches by score range

### 7. Track Separation Tests

#### Test Case 7.1: Service Provider Blocked from Project Bidding
- **Prerequisites**: User with `skill_service_provider` role
- **Steps**:
  1. Attempt to submit project proposal
- **Expected**: Validation error, proposal blocked

#### Test Case 7.2: Sub-Contractor Blocked from Service Endpoints
- **Prerequisites**: User with `sub_contractor` role
- **Steps**:
  1. Attempt to access service provider features
- **Expected**: Access blocked

#### Test Case 7.3: Independent Data Models
- **Prerequisites**: Service engagements and projects exist
- **Steps**:
  1. Verify service engagements can reference sub-projects
  2. Verify no project contracts created from services
- **Expected**: Linking is informational only, no cross-track dependencies

## Test Scenarios

### Scenario 1: Complete Service Request Flow
1. Entity creates service request
2. Service Provider views request and submits offer
3. Entity accepts offer
4. Engagement created automatically
5. Service Provider completes engagement
6. Engagement marked as completed

### Scenario 2: Vendor Uses Service Provider
1. Vendor creates service request
2. Service Provider submits offer
3. Vendor accepts offer
4. Engagement created
5. Vendor links engagement to sub-project (for support)
6. Service Provider delivers service
7. Engagement completed

### Scenario 3: Track Boundary Enforcement
1. Service Provider attempts to bid on project → Blocked
2. Sub-Contractor attempts to create service request → Blocked
3. Service Provider can only access service endpoints
4. Sub-Contractor can only access project endpoints (through vendors)

## Edge Cases

1. **Multiple offers for same request**: Only one can be accepted
2. **Service Provider withdraws offer**: Offer status changes to WITHDRAWN
3. **Request cancelled after offers**: Offers remain but cannot be accepted
4. **Engagement terminated**: Termination reason required
5. **Profile without hourly rate**: Valid if pricing model is not HOURLY

## Integration Test Scenarios

1. **Service Request → Matching → Offer → Engagement**: Complete flow
2. **Service Engagement → Sub-Project Linking**: Cross-domain reference
3. **RBAC Guards → Service Endpoints**: Access control enforcement
4. **Matching Engine → Service Providers**: Independent from project matching

