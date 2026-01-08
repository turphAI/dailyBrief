#!/bin/bash
set -e

echo "🔨 Building Daily Brief monorepo..."
echo ""

# Build landing page
echo "📍 Building landing page..."
cd index
npm install
npm run build
cd ..

# Build w1 frontend
echo "📍 Building w1 frontend..."
cd w1-resolution/frontend
npm install
npm run build
cd ../..

# Arrange files
echo "📍 Arranging files..."
rm -rf public
mkdir -p public/w1

cp -r index/dist/* public/
cp -r w1-resolution/frontend/dist/* public/w1/

echo ""
echo "✅ Build complete!"
echo "   public/ ready for deployment"
# Deployment trigger: Thu Jan  8 09:37:43 EST 2026
