# Quick Test Guide - Service Offerings

## Quick Start

### 1. Generate Test Data
Open browser console (F12) and run:
```javascript
PMTwinData.loadServiceIndexTestData();
```

### 2. Check Test Data Status
```javascript
PMTwinData.getServiceTestDataStats();
```

### 3. View Service Marketplace
1. Navigate to "Service Marketplace" in sidebar
2. You should see 8+ service offerings

## Quick Test Scenarios

### Scenario 1: Create Service Offering
1. Go to "My Services"
2. Click "Create New Service"
3. Choose "I Want to Offer"
4. Fill form and submit
5. Click "Publish" to make it active

### Scenario 2: Browse Marketplace
1. Go to "Service Marketplace"
2. Use filters to search
3. Click "View Details" on any offering
4. See full details in popup

### Scenario 3: Test Barter Exchange
1. Filter by "Exchange Type: Barter"
2. View Barter offerings
3. See barter details (Accepts/Offers)

### Scenario 4: Test Needs Feature
1. Create service with "I Have a Need"
2. Enter needs in textarea
3. See live preview
4. View needs in marketplace

## Reset Test Data

To start fresh:
```javascript
localStorage.removeItem('pmtwin_service_providers');
location.reload();
```

## Verify Everything Works

Run this in console:
```javascript
const stats = PMTwinData.getServiceTestDataStats();
console.log('Test Data Status:', stats);
console.log('Active Offerings:', stats.activeOfferings);
console.log('Barter Offerings:', stats.barterOfferings);
```

Expected output:
- Providers: 2-3
- Offerings: 8+
- Active Offerings: 8+
- Barter Offerings: 2+


