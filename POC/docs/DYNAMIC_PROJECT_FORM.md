# Dynamic Project Creation Form

## Overview

The project creation form has been enhanced with a dynamic, category-based system that allows for extensible project details. The system is focused on construction projects but is designed to be adaptable to any project type.

## Architecture

### 1. Category Configuration (`data/project-categories.json`)

This JSON file defines:
- **Categories**: Infrastructure, Residential, Commercial, Industrial
- **Detail Sections**: Category-specific sections (e.g., Site Preparation, Foundation, Utilities for Infrastructure)
- **Fields**: Field definitions with types (text, textarea, number, date, select, file, checkbox)
- **Common Fields**: Shared across all categories (Timeline, Facilities, Attachments)

### 2. Form Builder (`js/project-form-builder.js`)

A JavaScript module that:
- Loads category configurations
- Dynamically renders form sections based on selected category
- Handles dynamic list items (add/remove)
- Manages checkbox subfields
- Collects form data into structured format

### 3. Project Create Component (`features/projects/project-create.js`)

Enhanced to:
- Initialize the form builder
- Handle category change events
- Collect data from dynamic fields
- Submit complete project data including details

## Features

### Dynamic Category-Based Fields

When a user selects a project category, the form automatically displays relevant detail sections:

**Infrastructure Projects:**
- Site Preparation
- Foundation & Structure
- Utilities & Services
- Road Works
- Bridge Works
- Environmental & Compliance
- Quality Control & Testing

**Residential Projects:**
- Building Specifications
- Amenities & Facilities
- Finishes & Materials

**Commercial Projects:**
- Building Type & Use
- Commercial Features

**Industrial Projects:**
- Facility Type
- Industrial Systems
- Safety & Compliance

### Dynamic List Items

Users can add multiple items dynamically:
- **Milestones**: Add project milestones with dates
- **Vehicles**: Add multiple vehicle requirements
- **Equipment**: Add multiple equipment items

Each list item can be removed individually, and items are automatically re-indexed.

### Checkbox Subfields

Some fields have conditional subfields:
- **Site Office**: When checked, shows office size and requirements fields
- Other checkbox fields can be extended similarly

### Common Fields

Available for all project types:
- **Timeline**: Start date, duration, milestones
- **Facilities**: Site office, vehicles, equipment
- **Attachments**: Technical drawings, specifications, other documents

## Usage

### For Users

1. Fill in basic project information (title, description, category, location)
2. Select a category from the dropdown
3. Category-specific detail sections appear automatically
4. Fill in relevant details for each section
5. Add dynamic items (milestones, vehicles, equipment) as needed
6. Fill in timeline and facilities information
7. Upload project documents
8. Submit the form

### For Developers

#### Adding a New Category

1. Edit `data/project-categories.json`
2. Add a new category object with:
   - `id`, `name`, `icon`, `description`
   - `detailSections` array with sections and fields

Example:
```json
{
  "Healthcare": {
    "id": "Healthcare",
    "name": "Healthcare",
    "icon": "ph-hospital",
    "description": "Hospitals, clinics, medical facilities",
    "detailSections": [
      {
        "id": "medical_facilities",
        "label": "Medical Facilities",
        "fields": [
          {
            "id": "bed_capacity",
            "label": "Bed Capacity",
            "type": "number"
          }
        ]
      }
    ]
  }
}
```

#### Adding Fields to Existing Category

1. Edit `data/project-categories.json`
2. Find the category's `detailSections`
3. Add a new field to the appropriate section:

```json
{
  "id": "new_field",
  "label": "New Field Label",
  "type": "text|textarea|number|date|select|file",
  "placeholder": "Optional placeholder text",
  "options": ["Option 1", "Option 2"] // For select type
}
```

#### Field Types

- **text**: Single-line text input
- **textarea**: Multi-line text input
- **number**: Numeric input
- **date**: Date picker
- **select**: Dropdown with options
- **file**: File upload (with accept and multiple attributes)
- **checkbox**: Checkbox with optional subfields
- **dynamic_list**: List of items that can be added/removed

## Data Structure

The collected form data is structured as:

```javascript
{
  basic: {
    title: "Project Title",
    description: "Project description",
    category: "Infrastructure",
    city: "Riyadh",
    region: "Riyadh Province"
  },
  scope: {
    requiredServices: ["Engineering", "Construction"],
    skillRequirements: ["Project Management"]
  },
  budget: {
    min: 1000000,
    max: 5000000,
    currency: "SAR"
  },
  details: {
    site_preparation: {
      land_clearing: "Remove structures",
      excavation: "Earthwork operations"
    },
    foundation: {
      foundation_type: "Deep Foundation",
      foundation_details: "Specifications..."
    }
  },
  timeline: {
    start_date: "2024-01-01",
    duration: 12,
    milestones: [
      { name: "Phase 1", date: "2024-03-01" }
    ]
  },
  facilities: {
    site_office: true,
    vehicles: [
      { type: "SUV", quantity: 3 }
    ],
    equipment: [
      { name: "Crane", specifications: "50 ton" }
    ]
  },
  attachments: {
    // File metadata (files handled separately)
  }
}
```

## Technical Details

### Form Builder API

```javascript
// Load configuration
await ProjectFormBuilder.loadCategoryConfig();

// Render category-specific details
ProjectFormBuilder.renderCategoryDetails('containerId', 'Infrastructure');

// Render common fields
ProjectFormBuilder.renderCommonFields('containerId');

// Collect form data
const formData = ProjectFormBuilder.collectFormData();
```

### Event Handling

- **Category Change**: Automatically triggers form section rendering
- **Add List Item**: Dynamically adds new items to lists
- **Remove List Item**: Removes items and re-indexes
- **Toggle Subfields**: Shows/hides conditional fields

## Styling

CSS classes for styling:
- `.category-detail-section`: Container for category-specific sections
- `.common-field-section`: Container for common fields
- `.dynamic-list-group`: Container for dynamic lists
- `.dynamic-list-item`: Individual list item
- `.checkbox-with-subfields`: Checkbox with conditional fields
- `.subfields-container`: Container for subfields

## Future Enhancements

1. **File Upload Handling**: Integrate with file storage service
2. **Form Validation**: Add client-side validation for required fields
3. **Save Draft**: Allow saving incomplete forms
4. **Template System**: Pre-fill forms from templates
5. **Field Dependencies**: Show/hide fields based on other field values
6. **Multi-language Support**: Support for Arabic and other languages
7. **Rich Text Editor**: For description and detailed fields
8. **Image Upload**: For project photos and renderings

## Notes

- The system is extensible - new categories and fields can be added via JSON configuration
- Construction focus is evident in Infrastructure category details
- Other categories (Residential, Commercial, Industrial) have their own relevant fields
- Dynamic lists allow flexible data entry
- Checkbox subfields provide conditional field display
- All form data is collected into a structured format for easy backend processing

