# PowerShell script to reorganize HTML files into feature directories
# This script moves HTML files from root to feature directories

$features = @(
    @{file="home.html"; dir="home"},
    @{file="discovery.html"; dir="discovery"},
    @{file="wizard.html"; dir="wizard"},
    @{file="knowledge.html"; dir="knowledge"},
    @{file="login.html"; dir="login"},
    @{file="signup.html"; dir="signup"},
    @{file="dashboard.html"; dir="dashboard"},
    @{file="projects.html"; dir="projects"},
    @{file="create-project.html"; dir="create-project"},
    @{file="project.html"; dir="project"},
    @{file="opportunities.html"; dir="opportunities"},
    @{file="matches.html"; dir="matches"},
    @{file="proposals.html"; dir="proposals"},
    @{file="create-proposal.html"; dir="create-proposal"},
    @{file="pipeline.html"; dir="pipeline"},
    @{file="collaboration.html"; dir="collaboration"},
    @{file="profile.html"; dir="profile"},
    @{file="onboarding.html"; dir="onboarding"},
    @{file="notifications.html"; dir="notifications"},
    @{file="admin.html"; dir="admin"},
    @{file="admin-vetting.html"; dir="admin-vetting"},
    @{file="admin-moderation.html"; dir="admin-moderation"},
    @{file="admin-audit.html"; dir="admin-audit"},
    @{file="admin-reports.html"; dir="admin-reports"}
)

foreach ($feature in $features) {
    $sourceFile = "POC\$($feature.file)"
    $targetDir = "POC\$($feature.dir)"
    $targetFile = "$targetDir\index.html"
    
    if (Test-Path $sourceFile) {
        # Create directory if it doesn't exist
        if (-not (Test-Path $targetDir)) {
            New-Item -ItemType Directory -Path $targetDir | Out-Null
        }
        
        # Move file
        Move-Item -Path $sourceFile -Destination $targetFile -Force
        Write-Host "Moved $($feature.file) -> $($feature.dir)/index.html"
    }
}

Write-Host "Reorganization complete!"


