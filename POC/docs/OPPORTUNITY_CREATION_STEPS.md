# Opportunity Creation Steps

This document outlines the step-by-step process for creating a new opportunity in PMTwin.

## Overview

The opportunity creation process consists of **5 steps** in a wizard format:

1. **Intent** - Choose whether you're requesting or offering a service
2. **Details** - Enter basic information, location, service items, and skills
3. **Model** - Select the collaboration model and sub-model
4. **Payment** - Configure payment terms (Cash, Barter, Equity, Profit-Sharing, or Hybrid)
5. **Review** - Review all details before publishing

---

## Step 1: Intent Selection

**Purpose:** Define whether you want to request a service or offer a service.

### Options:

1. **Request Service**
   - Select this if you need someone to provide a service for you
   - Icon: Shopping Cart
   - Use case: "I need someone to provide a service for me"

2. **Offer Service**
   - Select this if you want to offer your services to others
   - Icon: Storefront
   - Use case: "I want to offer my services to others"

### Actions:
- Click on one of the two cards to select your intent
- The selected card will be highlighted with a blue border
- You can change your selection at any time before proceeding

---

## Step 2: Details

**Purpose:** Enter comprehensive information about your opportunity.

This step includes **4 main sections**:

### 2.1 Basic Information

**Required Fields:**
- **Opportunity Title** (Required)
  - Example: "Structural Engineering Review for Metro Station"
  - Enter a clear, descriptive title

- **Description** (Required)
  - Provide a detailed description of the opportunity
  - Explain what you're looking for or offering

### 2.2 Location

**Required Fields:**
- **Country** (Required)
  - Select from available countries (default: Saudi Arabia)

- **City** (Required)
  - Select from cities available in the selected country
  - Options depend on the selected country

**Optional Fields:**
- **Area** (Optional)
  - Select a specific area within the city
  - Examples: Olaya, Al Malaz, Al Nakheel (for Riyadh)

- **Address** (Optional)
  - Enter full address details

- **Remote work allowed** (Checkbox)
  - Check this if the work can be done remotely

### 2.3 Service Items

**Purpose:** Define the specific services you're requesting or offering.

**Required:** At least one service item is required.

**For each service item, you can specify:**
- Service name/description
- Quantity
- Unit of measurement
- Reference value (if applicable)

**Actions:**
- Click "Add Service Item" to add more services
- You can add multiple service items
- Each item can be edited or removed

### 2.4 Required Skills

**Purpose:** Specify the skills needed for this opportunity.

**Required:** At least one skill is required.

**How to add skills:**
- Enter skills in the input field
- Separate multiple skills with commas OR press Enter after each skill
- Click "Add Skill" button to add the current input
- Skills will appear as tags below the input field

**Example skills:**
- Structural Engineering
- BIM Coordination
- Project Management
- AutoCAD

**Actions:**
- Click the "X" on any skill tag to remove it
- You can add multiple skills

---

## Step 3: Model Selection

**Purpose:** Select the collaboration model that best fits your opportunity type.

### Process:

1. **Browse Available Sub-Models**
   - View all available collaboration models in a grid layout
   - Each model card shows:
     - Model name
     - Category
     - Description
     - Applicability tags
     - Supported payment modes

2. **Select a Model**
   - Click on a model card to select it
   - The selected model will be highlighted

3. **View Model Details**
   - Once selected, detailed information appears:
     - Full description
     - Applicability scenarios
     - Supported payment modes
     - Model-specific requirements

4. **Model-Specific Fields**
   - After selecting a model, additional fields may appear
   - These fields are specific to the chosen collaboration model
   - Fill in any required model-specific details

**Actions:**
- Click "Change Selection" to go back and choose a different model
- You can review model details before finalizing your selection

---

## Step 4: Payment Terms

**Purpose:** Configure how payment will be handled for this opportunity.

### Payment Mode Options:

1. **Cash** 💵
   - Traditional cash payment
   - No additional configuration required
   - Standard cash payment terms apply

2. **Barter** 🔄
   - Service-for-service exchange
   - Requires barter settlement rule configuration

3. **Equity** 📈
   - Equity stake with vesting
   - Requires equity details configuration

4. **Profit-Sharing** 📊
   - Share of profits
   - Requires profit-sharing details configuration

5. **Hybrid** 🤝
   - Combination of barter and cash
   - Requires barter rule and cash settlement configuration

### Configuration by Payment Mode:

#### For Barter or Hybrid:

**Barter Settlement Rule** (Required):
- **Equal Value Only**
  - Services must be of equal value
  - No cash component allowed

- **Allow Difference with Cash**
  - Cash component allowed for value imbalance
  - Requires cash settlement amount

- **Accept As-Is**
  - Accept value difference without compensation
  - Requires acknowledgment checkbox

**Cash Settlement Amount** (If applicable):
- Enter amount in SAR
- Used to balance value differences

#### For Equity:

**Equity Details:**
- **Equity Percentage** (%) - Required
- **Company Valuation** (SAR) - Optional
- **Vesting Schedule:**
  - Immediate
  - Cliff
  - Gradual
  - Milestone-Based

#### For Profit-Sharing:

**Profit-Sharing Details:**
- **Calculation Method:**
  - Percentage
  - Fixed Amount
  - Tiered
  - Performance-Based
- **Distribution Frequency:**
  - Monthly
  - Quarterly
  - Annually

---

## Step 5: Review

**Purpose:** Review all entered information before publishing the opportunity.

### What to Review:

1. **Intent**
   - Verify whether you're requesting or offering a service

2. **Basic Information**
   - Title
   - Description

3. **Location**
   - Country, City, Area, Address
   - Remote work allowance

4. **Service Items**
   - List of all service items
   - Quantities and values

5. **Required Skills**
   - All selected skills displayed as tags

6. **Collaboration Model**
   - Selected model name and category
   - Model description

7. **Payment Terms**
   - Selected payment mode
   - Payment configuration details
   - Barter rules (if applicable)
   - Equity/Profit-sharing details (if applicable)

### Actions:

- **Edit any section:**
  - Click on any section to go back and edit
  - Use the step navigation tabs at the top
  - Or use "Previous" button to go back step by step

- **Submit Opportunity:**
  - Click "Publish Opportunity" button
  - The opportunity will be created and saved
  - You'll be redirected to view your opportunity

---

## Navigation

### Progress Indicator:
- Progress bar at the top shows completion percentage
- Step indicator shows "Step X of 5"
- Visual progress from 0% to 100%

### Step Navigation Tabs:
- Click on any completed step tab to go back
- Future steps are disabled until previous steps are completed
- Completed steps show a checkmark

### Navigation Buttons:
- **Previous** - Go back to the previous step
- **Next** - Proceed to the next step (after validation)
- **Publish Opportunity** - Final step to submit (only on Review step)

---

## Validation

Each step has validation requirements:

- **Step 1 (Intent):** Must select either Request Service or Offer Service
- **Step 2 (Details):**
  - Title is required
  - Description is required
  - Country is required
  - City is required
  - At least one service item is required
  - At least one skill is required
- **Step 3 (Model):** Must select a collaboration model
- **Step 4 (Payment):**
  - Payment mode is required
  - Additional fields required based on selected payment mode
- **Step 5 (Review):** All previous validations must pass

---

## Tips

1. **Save Progress:** Your progress is saved as you navigate between steps
2. **Go Back:** You can always go back to edit previous steps
3. **Review Carefully:** Take time in the Review step to ensure all information is correct
4. **Service Items:** Be specific about what services you need or offer
5. **Skills:** Include all relevant skills to attract the right providers/beneficiaries
6. **Payment Terms:** Choose payment mode that best fits your needs and preferences

---

## After Publishing

Once you publish your opportunity:

1. The opportunity is created with status "PUBLISHED"
2. It becomes visible to other users in the system
3. You can view it in "My Opportunities"
4. Other users can submit proposals for your opportunity
5. You can edit or close the opportunity later if needed

---

## Support

If you encounter any issues during opportunity creation:

1. Check that all required fields are filled
2. Verify your selections in the Review step
3. Use the step navigation to go back and correct any errors
4. Contact support if technical issues persist

---

**Last Updated:** Based on opportunity-create.js component
**Version:** Current implementation as of latest codebase review
