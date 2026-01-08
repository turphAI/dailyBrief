#!/bin/bash

# Create root public directory
rm -rf public
mkdir -p public/w1

# Copy landing page to root public
cp -r index/dist/* public/

# Copy w1 to public/w1
cp -r w1-resolution/frontend/dist/* public/w1/ 2>/dev/null || true

# Copy w1 API functions for Vercel
mkdir -p api/w1
cp -r w1-resolution/api/* api/w1/ 2>/dev/null || true

echo "✅ Build structure complete"
echo "   - Landing page in public/"
echo "   - w1 app in public/w1/"
echo "   - API functions in api/w1/"
