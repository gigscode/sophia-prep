# Fix PowerShell Execution Policy
# Run this script as Administrator

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Fix PowerShell Execution Policy" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "To run as Administrator:" -ForegroundColor Yellow
    Write-Host "1. Right-click on this file" -ForegroundColor Yellow
    Write-Host "2. Select 'Run with PowerShell as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

Write-Host "Current Execution Policy:" -ForegroundColor Yellow
Get-ExecutionPolicy -List
Write-Host ""

Write-Host "Setting execution policy to RemoteSigned for CurrentUser..." -ForegroundColor Green
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "SUCCESS! Execution policy updated." -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set execution policy." -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "New Execution Policy:" -ForegroundColor Yellow
Get-ExecutionPolicy -List
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Policy Fixed Successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You can now run npm and npx commands." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Open a new PowerShell window" -ForegroundColor Yellow
Write-Host "2. Navigate to the project directory" -ForegroundColor Yellow
Write-Host "3. Run: npm run dev" -ForegroundColor Yellow
Write-Host ""

pause

