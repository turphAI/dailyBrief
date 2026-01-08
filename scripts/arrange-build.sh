#!/bin/bash

echo "Arranging build output for Vercel..."

# Clean and create public directory
rm -rf public
mkdir -p public/w1

# Copy landing page to root of public
echo "Copying landing page..."
cp -r index/dist/* public/ 2>/dev/null || true

# Copy w1 app to public/w1
echo "Copying w1 app..."
cp -r w1-resolution/frontend/dist/* public/w1/ 2>/dev/null || true

# Verify structure
echo ""
echo "✅ Build structure created:"
echo "   public/index.html (landing page)"
echo "   public/w1/index.html (w1 app)"
echo ""
ls -la public/ | grep -E "^d|index.html" || true
echo ""
ls -la public/w1/ | head -5 || true
echo ""
echo "✅ Ready for Vercel deployment"
