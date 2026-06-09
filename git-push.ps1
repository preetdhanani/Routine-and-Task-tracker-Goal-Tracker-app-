param (
    [Parameter(Mandatory=$true, HelpMessage="The remote Git repository URL (e.g., https://github.com/user/repo.git)")]
    [string]$RepoLink,

    [Parameter(Mandatory=$true, HelpMessage="The target branch name (e.g., main)")]
    [string]$BranchName
)

# Enable error action preference to stop script execution on failures
$ErrorActionPreference = "Stop"

try {
    Write-Host "[1/3] Staging all files..." -ForegroundColor Cyan
    git add .

    Write-Host "[2/3] Committing changes..." -ForegroundColor Cyan
    git commit -m "Automated push via git-push script"

    Write-Host "[3/3] Pushing changes to $BranchName on $RepoLink..." -ForegroundColor Cyan
    git push $RepoLink $BranchName

    Write-Host "Success: Code staged, committed, and pushed successfully!" -ForegroundColor Green
} catch {
    Write-Host "Error: Push operation failed. Details: $_" -ForegroundColor Red
    exit 1
}
