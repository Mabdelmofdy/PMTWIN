# Service Offerings Complete Workflow & Test Data Guide

## Overview

This document provides a complete workflow for testing the Service Offerings feature, including test data setup and step-by-step testing procedures.

## Test Data Setup

### Automatic Test Data Generation

Test data is automatically generated when you:
1. Load the application for the first time
2. Navigate to Service Marketplace
3. Call `PMTwinData.loadServiceIndexTestData()` in the console

### Manual Test Data Generation

To manually generate test data, open the browser console and run:

```javascript
// Generate all test data
PMTwinData.loadServiceIndexTestData();

// Or force reload (clears existing and recreates)
localStorage.removeItem('pmtwin_service_providers');
PMTwinData.loadServiceIndexTestData();
```

## Test Data Created

### Service Providers (2)
1. **Legal & Logistics Services** (Company)
   - Type: Company
   - Categories: Legal, Logistics
   - Location: Riyadh
   - Skills: Contract Review, Legal Consultation, Supply Chain Management, Procurement

2. **Ahmed Al-Saud** (Individual Consultant)
   - Type: Consultant
   - Categories: Engineering, Design
   - Location: Riyadh
   - Skills: Project Management, Civil Engineering, Construction Planning, Quality Control

3. **Sarah Al-Mansouri** (Individual)
   - Type: Individual
   - Categories: Consulting, Project Management
   - Location: Jeddah
   - Skills: Project Planning, Risk Management, Stakeholder Management, Agile Methodology

### Service Offerings (8+)

#### Cash-Based Offerings:
1. **Architectural Design Services**
   - Category: Design
   - Pricing: Fixed (50,000 - 500,000 SAR)
   - Delivery: Hybrid
   - Exchange: Cash
   - Status: Active

2. **Civil Engineering Consultation**
   - Category: Engineering
   - Pricing: Hourly (500 - 1,500 SAR/hour)
   - Delivery: Onsite
   - Exchange: Cash
   - Status: Active

3. **Legal Consultation Services**
   - Category: Legal
   - Pricing: Fixed (10,000 - 100,000 SAR)
   - Delivery: Remote
   - Exchange: Cash
   - Status: Active

4. **Project Management Services**
   - Category: Consulting
   - Pricing: Daily (2,000 - 5,000 SAR/day)
   - Delivery: Hybrid
   - Exchange: Cash
   - Status: Active

5. **Supply Chain & Logistics Management**
   - Category: Logistics
   - Pricing: Milestone (50,000 - 300,000 SAR)
   - Delivery: Onsite
   - Exchange: Cash
   - Status: Active

6. **Construction Quality Control Services**
   - Category: Construction
   - Pricing: Fixed (25,000 - 150,000 SAR)
   - Delivery: Onsite
   - Exchange: Cash
   - Status: Active

#### Barter-Based Offerings:
7. **Construction Materials Trading - Barter Exchange**
   - Category: Logistics
   - Exchange: Barter
   - Accepts: Construction Materials, Equipment Rental, Labor Services
   - Offers: Steel, Cement, Electrical Supplies
   - Status: Active

8. **Design Services for Equipment/Resources**
   - Category: Design
   - Exchange: Barter
   - Accepts: Construction Equipment, Office Space, Marketing Services
   - Offers: Architectural Design, 3D Modeling, Interior Design
   - Status: Active

### Beneficiaries
- Created from existing project leads/entities
- Linked to their projects
- Includes required services, skills, and budget ranges

### Service Evaluations
- Sample evaluation with 4.5 rating
- Includes performance metrics (on-time delivery, quality, communication, value)
- Linked to service offerings and beneficiaries

## Complete Workflow

### Workflow 1: Create Service Offering (Provider Perspective)

#### Step 1: Navigate to My Services
1. Log in as a service provider user (e.g., `consultant@pmtwin.com`)
2. Click "My Services" in the sidebar
3. You should see your existing service offerings (if any)

#### Step 2: Create New Service Offering
1. Click "Create New Service" button
2. **Choose Type:**
   - Click "I Want to Offer" (to showcase skills)
   - OR click "I Have a Need" (to express needs)

#### Step 3: Fill Service Offering Form
**For "I Want to Offer":**
1. **Basic Information:**
   - Title: e.g., "Architectural Design Services"
   - Category: Select from dropdown (e.g., Design)
   - Description: Detailed description of your service

2. **What I Offer Section:**
   - Select skills from your profile
   - Skills are pre-populated from your profile

3. **What I Need Section (Optional):**
   - Enter services, skills, or resources you need
   - Comma-separated list
   - Live preview shows badges

4. **Pricing & Delivery:**
   - Delivery Mode: Onsite, Remote, or Hybrid
   - Pricing Type: Fixed, Hourly, Daily, or Milestone
   - Min/Max Price: Enter price range
   - Exchange Type: Cash, Barter, or Mixed

5. **Barter Details (if Barter/Mixed):**
   - What I Accept: Items/services you'll accept
   - What I Offer: Items/services you're offering
   - Valuation Method: Market Value, Hourly Rate Equivalent, etc.

6. **Location:**
   - City: e.g., Riyadh
   - Country: e.g., Saudi Arabia
   - Service Radius: e.g., 500 km

7. **Collaboration Models:**
   - Task-Based Engagement: Check if supported
   - Strategic Alliance: Check if supported

8. **Status:**
   - Draft: Not yet published
   - Active: Published and visible

9. Click "Create Service Offering"

#### Step 4: Publish Offering
1. After creation, offering is in "Draft" status
2. Click "Publish" button to make it active
3. Active offerings appear in Service Marketplace

### Workflow 2: Browse Service Marketplace (Beneficiary Perspective)

#### Step 1: Navigate to Marketplace
1. Log in as any user
2. Click "Service Marketplace" in the sidebar
3. You should see all Active service offerings

#### Step 2: Filter Offerings
1. **Search:** Enter keywords (title, description, category)
2. **Category:** Select specific category
3. **Location:** Enter city or country
4. **Delivery Mode:** Filter by Onsite, Remote, or Hybrid
5. **Exchange Type:** Filter by Cash, Barter, or Mixed
6. **Price Range:** Set min/max price
7. Click "Apply Filters"

#### Step 3: View Offering Details
1. Click "View Details" on any offering card
2. Popup modal shows:
   - Full description
   - Skills offered
   - Pricing details
   - Location and service radius
   - Statistics (views, inquiries, matches, proposals)
   - Average rating
   - Quality score
   - Barter details (if applicable)
   - Needs (if provider expressed needs)
   - Provider information

#### Step 4: Contact Provider
1. In the offering details popup
2. Click "Contact Provider" button
3. This creates an inquiry (tracked in statistics)

### Workflow 3: Matching & Proposals

#### Step 1: Create Project (Entity/Project Lead)
1. Log in as project lead/entity
2. Create a new project with:
   - Required services
   - Required skills
   - Budget range
   - Location

#### Step 2: Automatic Matching
1. System automatically runs matching algorithm
2. Matches service providers based on:
   - Service category alignment
   - Skills match
   - Experience level
   - Location proximity
   - Budget compatibility

#### Step 3: View Matches
1. Navigate to "Matches" section
2. See all matched service providers
3. Match score displayed (e.g., "85% Match")
4. Click "View Details" to see match breakdown

#### Step 4: Create Proposal from Service Offering
1. In Service Marketplace, find a relevant offering
2. Click "View Details"
3. Click "Create Proposal" (if available)
4. Fill proposal form:
   - Project selection
   - Proposal type (Cash/Barter)
   - Pricing details
   - Timeline
   - Terms & conditions
5. Submit proposal

#### Step 5: Review Proposals
1. Project lead navigates to "Proposals"
2. See all proposals for their projects
3. Review proposal details
4. Approve or reject proposals

### Workflow 4: Service Evaluation

#### Step 1: Complete Service Delivery
1. After service is completed
2. Project lead can evaluate the service

#### Step 2: Create Evaluation
1. Navigate to service offering
2. Click "Rate Service" or "Add Review"
3. Fill evaluation form:
   - Rating (1-5 stars)
   - Review text
   - Performance metrics:
     - On-time delivery
     - Quality score
     - Communication score
     - Value score
4. Submit evaluation

#### Step 3: View Evaluations
1. Evaluations appear on:
   - Service offering details
   - Service provider profile
   - Service Providers Directory

## Testing Checklist

### Service Creation
- [ ] Create service offering with "I Want to Offer"
- [ ] Create service offering with "I Have a Need"
- [ ] Create service with Cash exchange type
- [ ] Create service with Barter exchange type
- [ ] Create service with Mixed exchange type
- [ ] Add needs to service offering
- [ ] Add barter details
- [ ] Publish service offering
- [ ] Edit existing service offering
- [ ] Pause/Activate service offering
- [ ] Archive service offering
- [ ] Delete service offering

### Marketplace Browsing
- [ ] View all active offerings
- [ ] Search offerings by keyword
- [ ] Filter by category
- [ ] Filter by location
- [ ] Filter by delivery mode
- [ ] Filter by exchange type
- [ ] Filter by price range
- [ ] Clear all filters
- [ ] View offering details popup
- [ ] Contact provider from marketplace

### Matching & Proposals
- [ ] Create project with service requirements
- [ ] View automatic matches
- [ ] View match details and score breakdown
- [ ] Create proposal from service offering
- [ ] Create cash proposal
- [ ] Create barter proposal
- [ ] Review proposals as project lead
- [ ] Approve proposal
- [ ] Reject proposal

### Statistics & Analytics
- [ ] View offering statistics (views, inquiries, matches, proposals)
- [ ] View average rating
- [ ] View quality score
- [ ] Statistics update when actions are performed

### Service Evaluations
- [ ] Create service evaluation
- [ ] View evaluations on offering
- [ ] View evaluations on provider profile
- [ ] Average rating calculation

## Console Commands for Testing

```javascript
// Generate test data
PMTwinData.loadServiceIndexTestData();

// View all service offerings
const data = JSON.parse(localStorage.getItem('pmtwin_service_providers'));
console.log('Service Offerings:', data.serviceOfferings);

// View service providers
console.log('Service Providers:', PMTwinData.ServiceProviders.getAll());

// View beneficiaries
console.log('Beneficiaries:', PMTwinData.Beneficiaries.getAll());

// View evaluations
console.log('Evaluations:', PMTwinData.ServiceEvaluations.getAll());

// Clear all service data (for fresh start)
localStorage.removeItem('pmtwin_service_providers');
location.reload();

// Force create test offerings
// (This is called automatically, but you can trigger it)
PMTwinData.loadServiceIndexTestData();
```

## Troubleshooting

### No Offerings Showing in Marketplace

1. **Check if test data exists:**
   ```javascript
   const data = JSON.parse(localStorage.getItem('pmtwin_service_providers'));
   console.log('Offerings count:', data?.serviceOfferings?.length || 0);
   ```

2. **Regenerate test data:**
   ```javascript
   localStorage.removeItem('pmtwin_service_providers');
   PMTwinData.loadServiceIndexTestData();
   location.reload();
   ```

3. **Check offering status:**
   - Only "Active" offerings show in marketplace
   - Draft/Paused/Archived offerings are hidden

4. **Check filters:**
   - Clear all filters
   - Check if filters are too restrictive

### Offerings Not Creating

1. **Check console for errors**
2. **Verify user is logged in**
3. **Check required fields are filled**
4. **Verify service provider profile exists**

### Matching Not Working

1. **Ensure project has required services/skills**
2. **Check service providers have matching skills**
3. **Verify matching algorithm is running**
4. **Check match score threshold (default: 80%)**

## Next Steps

After completing the workflow:
1. Test edge cases (empty data, invalid inputs)
2. Test performance with large datasets
3. Test concurrent user actions
4. Test data persistence across sessions
5. Test error handling and validation


