#!/bin/bash
# Clean and Reinstall Script for Next.js
# Run this script from the frontend directory

echo "🧹 Starting clean reinstall process..."
echo ""

# Step 1: Remove node_modules
echo "📦 Removing node_modules..."
if [ -d "node_modules" ]; then
    rm -rf node_modules
    echo "✓ node_modules removed"
else
    echo "✓ node_modules doesn't exist"
fi
echo ""

# Step 2: Remove .next cache
echo "🗑️  Removing .next cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✓ .next cache removed"
else
    echo "✓ .next doesn't exist"
fi
echo ""

# Step 3: Remove package-lock.json
echo "🔒 Removing package-lock.json..."
if [ -f "package-lock.json" ]; then
    rm -f package-lock.json
    echo "✓ package-lock.json removed"
else
    echo "✓ package-lock.json doesn't exist"
fi
echo ""

# Step 4: Clean npm cache
echo "🧼 Cleaning npm cache..."
npm cache clean --force
echo "✓ npm cache cleaned"
echo ""

# Step 5: Install dependencies
echo "📥 Installing dependencies..."
echo "This may take a few minutes..."
npm install

if [ $? -eq 0 ]; then
    echo "✓ Dependencies installed successfully"
else
    echo "✗ Installation failed!"
    exit 1
fi
echo ""

# Step 6: Start dev server
echo "🚀 Starting development server..."
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
