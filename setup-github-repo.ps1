# GitHub Repository Setup Script
Write-Host "🚀 Setting up GitHub repository for peppyr" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host ""

$repoUrl = "https://github.com/meetshah0637/peppyr"
$repoExists = $false

# Check if repo exists by trying to fetch
Write-Host "Checking if repository exists..." -ForegroundColor Yellow
try {
    git ls-remote $repoUrl 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $repoExists = $true
        Write-Host "✅ Repository already exists!" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️  Repository doesn't exist yet or not accessible" -ForegroundColor Yellow
}

if (-not $repoExists) {
    Write-Host ""
    Write-Host "Please create the repository on GitHub first:" -ForegroundColor White
    Write-Host "1. Go to: https://github.com/new" -ForegroundColor Cyan
    Write-Host "2. Repository name: peppyr" -ForegroundColor Cyan
    Write-Host "3. Choose Public or Private" -ForegroundColor Cyan
    Write-Host "4. DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
    Write-Host "5. Click 'Create repository'" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press Enter after you've created the repository..." -ForegroundColor White
    Read-Host
}

# Push to GitHub
Write-Host ""
Write-Host "Pushing code to GitHub..." -ForegroundColor Yellow
git push -u origin master

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Code successfully pushed to GitHub!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Next step: Deploy to Render.com" -ForegroundColor Yellow
    Write-Host "1. Go to: https://render.com" -ForegroundColor White
    Write-Host "2. Sign in with GitHub" -ForegroundColor White
    Write-Host "3. Click 'New +' → 'Blueprint'" -ForegroundColor White
    Write-Host "4. Select 'peppyr' repository" -ForegroundColor White
    Write-Host "5. Click 'Apply' to deploy" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "❌ Failed to push. Please ensure:" -ForegroundColor Red
    Write-Host "   - Repository exists on GitHub" -ForegroundColor Yellow
    Write-Host "   - You have push access" -ForegroundColor Yellow
    Write-Host "   - Your GitHub credentials are configured" -ForegroundColor Yellow
}

