# Service Offering Model Enhancement

## Overview

The Service Offering model has been enhanced to align with BRD (Business Requirements Document) specifications and follow the same patterns used throughout the PMTwin platform.

## Key Enhancements

### 1. Comprehensive Data Model

The enhanced model now includes:

#### Basic Information
- `title` - Service offering title (required, max 200 chars)
- `category` - Service category (legal, logistics, design, engineering, etc.)
- `subcategory` - Optional subcategory
- `description` - Full description (required, 50-5000 chars)
- `shortDescription` - Auto-generated short description (200 chars)

#### Skills & Expertise
- `skills` - Array of skills (required, max 20)
- `experienceLevel` - junior | intermediate | senior | expert
- `minimumExperience` - Years of experience
- `certifications` - Array of certifications
- `specializations` - Array of specializations

#### Service Details
- `serviceType` - general | specialized | consulting | legal | logistics | design
- `delivery_mode` - On-site | Remote | Hybrid
- `estimatedDuration` - Duration in days or "TBD"
- `deliverables` - Array of deliverables

#### Location & Coverage
- `location` - Comprehensive location object:
  - `city`, `region`, `country`
  - `coordinates` - GPS coordinates (for future features)
  - `radius` - Service radius in km
  - `serviceAreas` - Array of cities/regions covered

#### Pricing & Payment
- `pricing_type` - Fixed | Hourly | Daily | Project-based | Milestone-based
- `price_min` / `price_max` - Price range
- `currency` - Default: SAR
- `exchange_type` - Cash | Barter | Mixed
- `paymentTerms` - 30_days | 60_days | milestone_based | upfront
- `barterPreferences` - What they accept in barter

#### Availability & Capacity
- `availability` - Comprehensive availability object:
  - `start_date` / `end_date`
  - `capacity` - Number of concurrent engagements
  - `currentLoad` - Track current active engagements
  - `lead_time` - e.g., "2-4 weeks"
  - `responseTime` - e.g., "24-48 hours"
  - `workingHours` - e.g., "9 AM - 5 PM AST"

#### Portfolio & Credentials
- `portfolio_links` - Array of portfolio URLs
- `portfolioItems` - Array of portfolio objects
- `attachments` - Supporting documents
- `credentials` - Certifications, licenses
- `endorsements` - Client testimonials

#### Collaboration Model Support
- `supportedCollaborationModels` - Array of model IDs (e.g., ['1.1', '2.2'])
- `taskBasedEngagement` - Task-Based Engagement (1.1) configuration
- `strategicAlliance` - Strategic Alliances (2.2) configuration

#### Status & Visibility
- `status` - Draft | Active | Paused | Archived
- `visibility` - public | registered_only
- `featured` - Boolean for featured offerings
- `flagged` - Admin flagging
- `qualityScore` - Auto-calculated (0-100)

#### Statistics & Tracking
- `views` - View count
- `inquiries` - Inquiry count
- `matchesGenerated` - Match count
- `proposalsReceived` - Proposal count
- `proposalsAccepted` - Accepted proposal count
- `completedEngagements` - Completed engagement count
- `averageRating` - Average rating (0-5 stars)
- `totalRatings` - Total number of ratings

#### Timestamps
- `createdAt` / `created_at` - Creation timestamp
- `updatedAt` / `updated_at` - Last update timestamp
- `publishedAt` - Publication timestamp
- `lastViewedAt` - Last view timestamp

#### Admin Fields
- `approvedAt` / `approvedBy` - Approval tracking
- `rejectedAt` / `rejectedBy` / `rejectionReason` - Rejection tracking

### 2. Validation & Business Logic

#### Comprehensive Validation
- Required fields validation
- Field length validation
- Category/enum validation
- Pricing validation (min <= max)
- Skills array validation
- Status transition validation

#### Quality Score Calculation
Automatic quality score (0-100) based on:
- Basic information completeness (30 points)
- Skills & expertise (25 points)
- Pricing information (15 points)
- Location details (10 points)
- Portfolio & credentials (15 points)
- Availability information (5 points)

### 3. Enhanced Service Methods

#### New Methods
- `publishOffering(offeringId)` - Publish draft offering (with quality check)
- `incrementViews(offeringId)` - Track view statistics
- `getOfferingsByCollaborationModel(modelId)` - Filter by collaboration model
- `getProviderStatistics(userId)` - Get provider statistics
- `validateOfferingData(offeringData, isUpdate)` - Validate offering data
- `calculateQualityScore(offering)` - Calculate quality score

#### Enhanced Methods
- `createOffering()` - Now includes comprehensive validation and BRD-compliant structure
- `updateOffering()` - Enhanced with change tracking and quality score recalculation
- `toggleStatus()` - Now supports Archived status

### 4. RBAC Integration

All methods properly check:
- `create_service_offerings` - Create permission
- `edit_own_service_offerings` - Edit permission
- `service_offering:delete` - Delete permission
- `service_offering:view` - View permission

### 5. Audit Trail Integration

All create/update/delete operations log to audit trail:
- `service_offering_creation` - Creation events
- `service_offering_update` - Update events with change tracking
- `service_offering_deletion` - Deletion events

## BRD Alignment

### Collaboration Models Support

The enhanced model supports:
- **Model 1.1: Task-Based Engagement**
  - `taskBasedEngagement.supported` - Boolean
  - `taskBasedEngagement.taskTypes` - Array of supported task types
  - `taskBasedEngagement.preferredEngagementTypes` - Preferences

- **Model 2.2: Strategic Alliances**
  - `strategicAlliance.supported` - Boolean
  - `strategicAlliance.allianceTypes` - Array of alliance types
  - `strategicAlliance.targetSectors` - Target sectors

### Data Model Patterns

Follows BRD patterns:
- Similar structure to Project and Proposal models
- Comprehensive status management
- Statistics and tracking fields
- Admin approval workflow
- Timestamp management
- Metadata support

## Usage Examples

### Create Enhanced Offering

```javascript
const result = await ServiceOfferingService.createOffering({
  title: "Legal Consultation Services",
  category: "legal",
  description: "Comprehensive legal consultation for construction projects...",
  skills: ["Contract Review", "Legal Consultation", "JV Agreements"],
  experienceLevel: "senior",
  pricing_type: "Hourly",
  price_min: 500,
  price_max: 1500,
  currency: "SAR",
  delivery_mode: "Hybrid",
  location: {
    city: "Riyadh",
    country: "Saudi Arabia",
    radius: 100
  },
  supportedCollaborationModels: ["1.1", "2.2"],
  taskBasedEngagement: {
    supported: true,
    taskTypes: ["Consultation", "Review"]
  }
});
```

### Publish Offering

```javascript
const result = await ServiceOfferingService.publishOffering(offeringId);
if (!result.success && result.qualityScore) {
  console.log(`Quality score too low: ${result.qualityScore}`);
}
```

### Get Statistics

```javascript
const stats = await ServiceOfferingService.getProviderStatistics(userId);
console.log(`Total views: ${stats.statistics.totalViews}`);
console.log(`Average rating: ${stats.statistics.averageRating}`);
```

## Migration Notes

### Backward Compatibility

The enhanced model maintains backward compatibility:
- Old field names still supported (`created_at`, `updated_at`)
- Existing offerings will work with new structure
- Quality score calculated on first update

### Required Updates

UI components should be updated to:
1. Use new validation methods
2. Display quality score
3. Support new collaboration model fields
4. Use new statistics methods
5. Handle new status values (Archived)

## Next Steps

1. Update UI components to use enhanced model
2. Add quality score display in UI
3. Implement collaboration model filtering
4. Add statistics dashboard
5. Implement rating system
6. Add GPS-based location features

