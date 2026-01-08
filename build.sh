#!/bin/bash
echo "Building and arranging files..."

# Build index
cd index
npm install
npm run build
cd ..

# Build w1 backend (for API functions)
cd w1-resolution/backend
npm install
npm run build
cd ../..

# Build w1 frontend
cd w1-resolution/frontend
npm install
npm run build
cd ../..

# Arrange static files
mkdir -p public/w1

# Copy landing page
cp -r index/dist/* public/

# Copy w1 app
cp -r w1-resolution/frontend/dist/* public/w1/

# FIX: Update favicon path in w1 index.html to use /w1/ prefix
sed -i.bak 's|href="/vite.svg"|href="/w1/vite.svg"|g' public/w1/index.html
rm -f public/w1/index.html.bak

# Arrange API functions
mkdir -p api
cp -r w1-resolution/api/* api/ 2>/dev/null || true

echo "✅ Build complete"

echo ""
echo "=== DEPLOYMENT STRUCTURE ==="
echo "Static files:"
find public -type f | head -10
echo ""
echo "API functions:"
find api -type f | head -10
