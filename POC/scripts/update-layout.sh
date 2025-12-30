#!/bin/bash
# Script to update all HTML pages with layout system
# This script adds layout scripts to authenticated pages

echo "Updating HTML pages with layout system..."

# List of pages that need layout (authenticated pages)
PAGES=(
    "notifications/index.html"
    "onboarding/index.html"
    "project/index.html"
    "create-proposal/index.html"
    "admin/index.html"
    "admin-vetting/index.html"
    "admin-reports/index.html"
    "admin-moderation/index.html"
    "admin-audit/index.html"
    "admin/users-management/index.html"
    "admin/settings/index.html"
    "admin/models-management/index.html"
    "admin/analytics/index.html"
)

for page in "${PAGES[@]}"; do
    if [ -f "$page" ]; then
        echo "Processing $page..."
        # This is a placeholder - actual updates done via search_replace
    fi
done

echo "Done!"

