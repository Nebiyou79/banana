# Clean and Reinstall Script for Next.js
# Run this script from the frontend directory

Write-Host "🧹 Starting clean reinstall process..." -ForegroundColor Cyan

# Step 1: Remove node_modules
Write-Host "`n📦 Removing node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules
    Write-Host "✓ node_modules removed" -ForegroundColor Green
} else {
    Write-Host "✓ node_modules doesn't exist" -ForegroundColor Gray
}

# Step 2: Remove .next cache
Write-Host "`n🗑️  Removing .next cache..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Recurse -Force .next
    Write-Host "✓ .next cache removed" -ForegroundColor Green
} else {
    Write-Host "✓ .next doesn't exist" -ForegroundColor Gray
}

# Step 3: Remove package-lock.json
Write-Host "`n🔒 Removing package-lock.json..." -ForegroundColor Yellow
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json
    Write-Host "✓ package-lock.json removed" -ForegroundColor Green
} else {
    Write-Host "✓ package-lock.json doesn't exist" -ForegroundColor Gray
}

# Step 4: Clean npm cache (optional but recommended)
Write-Host "`n🧼 Cleaning npm cache..." -ForegroundColor Yellow
npm cache clean --force
Write-Host "✓ npm cache cleaned" -ForegroundColor Green

# Step 5: Install dependencies
Write-Host "`n📥 Installing dependencies..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
npm install

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Installation failed!" -ForegroundColor Red
    exit 1
}

# Step 6: Start dev server
Write-Host "`n🚀 Starting development server..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server`n" -ForegroundColor Gray
npm run dev
