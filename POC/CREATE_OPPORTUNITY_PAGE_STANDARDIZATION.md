# Create Opportunity Page Standardization

## Overview
Updated the Create Opportunity page to match the standard page layout and styling used across all pages in the PMTwin application.

## Changes Made

### 1. **Container Standardization**
- ✅ Changed from `container-xl` to standard `container` class
- ✅ Removed custom max-width constraints
- ✅ Now uses standard container width (max-width: 1200px)

### 2. **Layout Structure**
- ✅ Maintained standard `.page-wrapper` structure
- ✅ Standard `.page-header` with `.page-header-content`
- ✅ Standard `.content-section` spacing
- ✅ Standard `.card.enhanced-card` styling

### 3. **Wizard Content Styling**
- ✅ Removed custom background and padding from `.wizard-content`
- ✅ Content now inherits card styling properly
- ✅ Wizard container uses full width within card
- ✅ Removed redundant box-shadow (card provides it)

### 4. **Wizard Actions**
- ✅ Updated to use CSS variables for spacing (`var(--spacing-4)`, `var(--spacing-6)`)
- ✅ Standardized border color using CSS variable
- ✅ Improved spacing consistency
- ✅ Button styling now matches standard button classes

### 5. **Responsive Design**
- ✅ Maintained responsive breakpoints
- ✅ Mobile-friendly wizard steps
- ✅ Touch-friendly buttons

## Standard Page Structure

The page now follows the standard structure:

```html
<main class="page-wrapper">
    <div class="container">
        <div class="page-header">
            <div class="page-header-content">
                <div>
                    <h1>Page Title</h1>
                    <p>Page description</p>
                </div>
            </div>
        </div>
        
        <div class="content-section">
            <div class="card enhanced-card">
                <div class="card-body">
                    <!-- Content -->
                </div>
            </div>
        </div>
    </div>
</main>
```

## Benefits

1. **Consistency**: Page now matches all other pages in the application
2. **Maintainability**: Uses standard CSS classes and variables
3. **Responsive**: Proper responsive behavior across all devices
4. **Accessibility**: Follows standard accessibility patterns
5. **Performance**: Reduced custom CSS, uses optimized standard styles

## Files Modified

- `POC/pages/opportunities/create/index.html`
  - Updated container class
  - Adjusted wizard content styling
  - Standardized wizard actions styling
  - Improved CSS variable usage

## Visual Consistency

The page now has:
- ✅ Same header styling as other pages
- ✅ Same card styling and shadows
- ✅ Same spacing and margins
- ✅ Same button styles
- ✅ Same responsive behavior
