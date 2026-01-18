# BRD Need/Offer Framework - Quick Reference Guide

## For Developers

### Using Equity Payment Mode

```javascript
// Create opportunity with Equity payment
const opportunity = PMTwinData.Opportunities.create({
  title: 'Need Equity Partner',
  intentType: 'REQUEST_SERVICE',
  paymentMode: 'EQUITY',
  equityDetails: {
    percentage: 25,
    valuation: 10000000,
    currency: 'SAR',
    vestingSchedule: {
      type: 'Gradual',
      vestingPeriod: 4,
      vestingPeriodUnit: 'Years',
      vestingFrequency: 'Quarterly'
    }
  }
});

// Validate equity details
const validation = EquityPayment.validate(opportunity.equityDetails);
if (validation.valid) {
  const equityValue = EquityPayment.calculateValue(opportunity.equityDetails);
  console.log('Equity Value:', equityValue.equityValue);
}
```

### Using Profit-Sharing Payment Mode

```javascript
// Create opportunity with Profit-Sharing payment
const opportunity = PMTwinData.Opportunities.create({
  title: 'Need Profit-Sharing Partner',
  intentType: 'REQUEST_SERVICE',
  paymentMode: 'PROFIT_SHARING',
  profitSharingDetails: {
    calculationMethod: 'Percentage',
    shares: [
      { partyId: 'user1', partyName: 'Partner A', percentage: 60 },
      { partyId: 'user2', partyName: 'Partner B', percentage: 40 }
    ],
    currency: 'SAR',
    distributionFrequency: 'Quarterly'
  }
});

// Calculate profit distribution
const distribution = ProfitSharingPayment.calculateDistribution(
  opportunity.profitSharingDetails,
  1000000 // Total profit
);
console.log('Distributions:', distribution.distributions);
```

### Using Deal Linking

```javascript
// Link offers to a need
const result = DealLinkingService.link(needId, [offerId1, offerId2, offerId3]);

if (result.success) {
  console.log('Linked offers:', result.linkedOffers);
}

// Get linked offers
const linkedOffers = DealLinkingService.getLinked(needId);

// Unlink an offer
DealLinkingService.unlink(needId, [offerId1]);
```

### Using Offer Register

```javascript
// Get compatible offers for a need
const compatibleOffers = OfferRegisterService.getCompatibleOffers(needId);

// Validate bidirectional match
const validation = OfferRegisterService.validateBidirectional(need, offer);
if (validation.valid) {
  console.log('Bidirectional match score:', validation.score);
}

// Calculate equivalence ratio
const equivalence = OfferRegisterService.calculateEquivalence(need, offer);
```

### Using Reputation Service

```javascript
// Calculate reputation score
const reputation = ReputationService.calculate(userId);
console.log('Reputation Score:', reputation.score);
console.log('Breakdown:', reputation.breakdown);

// Get reputation score (quick)
const score = ReputationService.getScore(userId);

// Update user reputation
ReputationService.update(userId);
```

### Using Semantic Mirroring

```javascript
// Apply all semantic mirroring rules
const mirror = SemanticMirroring.applyAll(need, offer);

console.log('Skills Match:', mirror.skills.score);
console.log('Budget Match:', mirror.budget.score);
console.log('Timeline Match:', mirror.timeline.score);
console.log('Location Match:', mirror.location.score);
console.log('Overall Compatible:', mirror.overallCompatible);
```

### Using Matching Models

```javascript
// Determine matching model for opportunity
const model = MatchingModels.determine(opportunity);
console.log('Matching Model:', model);

// Get model description
const description = MatchingModels.getDescription(model);
console.log('Description:', description.name);

// Get model indicator
const indicator = MatchingModels.getIndicator(model);
console.log('Indicator:', indicator); // →, ↔, 👥, 🔄
```

### Using RABC Service

```javascript
// Check if user can perform action
const canPerform = RABCService.canPerform('post_need', userId, 'entity');
if (canPerform) {
  // User is Responsible for this action
}

// Get RABC assignment
const assignment = RABCService.getAssignment('matching_scoring');
console.log('Responsible:', assignment.R);
console.log('Accountable:', assignment.A);
console.log('Beneficiaries:', assignment.B);
console.log('Consulted:', assignment.C);

// Get indicator for UI
const indicator = RABCService.getIndicator('post_need', 'entity');
console.log('RABC Indicator:', indicator); // R, A, B, or C
```

## For Users

### Creating a Need with Equity

1. Go to Create Opportunity
2. Select "Need" (Request Service)
3. Choose collaboration model
4. Select "Equity" payment mode
5. Enter:
   - Equity percentage (e.g., 25%)
   - Company valuation (e.g., 10,000,000 SAR)
   - Vesting schedule (Immediate, Cliff, Gradual, or Milestone)
6. Submit opportunity

### Creating a Need with Profit-Sharing

1. Go to Create Opportunity
2. Select "Need" (Request Service)
3. Choose collaboration model
4. Select "Profit-Sharing" payment mode
5. Enter:
   - Calculation method (Percentage, Fixed, Tiered, Performance)
   - Distribution frequency (Monthly, Quarterly, Annually)
6. Submit opportunity
7. Configure profit shares during negotiation

### Using Offer Register (Barter)

1. Create a Need with Barter payment mode
2. After creation, confirm to open Offer Register
3. View compatible offers
4. See bidirectional match scores
5. Link offers to your need
6. Review equivalence ratios

### Linking Multiple Offers

1. Go to Opportunity Details
2. Click "Link Offers" button
3. Select multiple compatible offers
4. System validates compatibility
5. Offers are linked
6. Matching model automatically updates (Group Formation)

## API Reference

### EquityPayment

- `validate(details)` - Validate equity details
- `calculateValue(details)` - Calculate equity value
- `calculateVested(details, targetDate, startDate)` - Calculate vested equity
- `generateAgreement(details)` - Generate equity agreement
- `format(details)` - Format for display

### ProfitSharingPayment

- `validate(details)` - Validate profit-sharing details
- `calculateDistribution(details, totalProfit)` - Calculate profit distribution
- `generateAgreement(details)` - Generate profit-sharing agreement
- `format(details)` - Format for display

### DealLinkingService

- `link(needId, offerIds)` - Link offers to need
- `unlink(needId, offerIds)` - Unlink offers from need
- `getLinked(needId)` - Get linked offers
- `isLinked(needId, offerId)` - Check if linked
- `validate(need, offer)` - Validate compatibility

### OfferRegisterService

- `getAvailableOffers(filters)` - Get available offers
- `validateBidirectional(need, offer)` - Validate bidirectional match
- `calculateEquivalence(need, offer)` - Calculate equivalence ratio
- `linkOffer(needId, offerId)` - Link offer to need
- `getCompatibleOffers(needId)` - Get compatible offers

### ReputationService

- `calculate(userId)` - Calculate reputation score with breakdown
- `getScore(userId)` - Get reputation score (quick)
- `update(userId)` - Update user reputation
- `batchUpdate(userIds)` - Batch update reputation

### SemanticMirroring

- `mirrorSkills(need, offer)` - Mirror skills to available skills
- `mirrorBudget(need, offer)` - Mirror budget to rate
- `mirrorTimeline(need, offer)` - Mirror timeline to availability
- `mirrorLocation(need, offer)` - Mirror location to preferred location
- `applyAll(need, offer)` - Apply all mirroring rules

### MatchingModels

- `determine(opportunity)` - Determine matching model
- `getDescription(modelType)` - Get model description
- `validate(need, offer, model)` - Validate compatibility
- `getIndicator(modelType)` - Get UI indicator
- `hasCircularDependencies(opportunity)` - Check for circular dependencies

### RABCService

- `getAssignment(activity)` - Get RABC assignment
- `canPerform(activity, userId, userRole)` - Check if user can perform
- `isAccountable(activity, userRole)` - Check if accountable
- `isBeneficiary(activity, userRole)` - Check if beneficiary
- `shouldBeConsulted(activity, userRole)` - Check if should be consulted
- `getIndicator(activity, userRole)` - Get RABC indicator
- `getActivitiesForRole(userRole)` - Get all activities for role

---

**Last Updated:** 2024
