# PowerShell script to prepare Firebase Service Account JSON for Vercel environment variable
# This converts the service-account.json file to a single-line JSON string

$serviceAccountPath = Join-Path $PSScriptRoot "..\server\service-account.json"

if (-not (Test-Path $serviceAccountPath)) {
    Write-Host "❌ Error: service-account.json not found at $serviceAccountPath" -ForegroundColor Red
    Write-Host "Please ensure the file exists before running this script." -ForegroundColor Yellow
    exit 1
}

Write-Host "📄 Reading service-account.json..." -ForegroundColor Cyan

try {
    # Read and parse the JSON file
    $jsonContent = Get-Content $serviceAccountPath -Raw | ConvertFrom-Json
    
    # Convert back to JSON with compression (single line, no formatting)
    $compressedJson = $jsonContent | ConvertTo-Json -Compress -Depth 10
    
    Write-Host ""
    Write-Host "✅ Firebase Service Account JSON (ready for Vercel):" -ForegroundColor Green
    Write-Host ""
    Write-Host $compressedJson -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Instructions:" -ForegroundColor Cyan
    Write-Host "1. Copy the JSON above (the entire single line)" -ForegroundColor Yellow
    Write-Host "2. Go to Vercel Dashboard → Your Project → Settings → Environment Variables" -ForegroundColor Yellow
    Write-Host "3. Add new variable:" -ForegroundColor Yellow
    Write-Host "   Key: FIREBASE_SERVICE_ACCOUNT" -ForegroundColor White
    Write-Host "   Value: [Paste the JSON above]" -ForegroundColor White
    Write-Host "4. Select all environments (Production, Preview, Development)" -ForegroundColor Yellow
    Write-Host "5. Save and redeploy" -ForegroundColor Yellow
    Write-Host ""
    
    # Also save to a file for easy copying
    $outputPath = Join-Path $PSScriptRoot "..\vercel-env-firebase.txt"
    $compressedJson | Out-File -FilePath $outputPath -Encoding utf8 -NoNewline
    Write-Host "💾 Also saved to: $outputPath" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error processing JSON: $_" -ForegroundColor Red
    exit 1
}

