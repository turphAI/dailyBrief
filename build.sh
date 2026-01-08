#!/bin/bash
set -e

echo "🏗️  Building Daily Brief..."
echo ""

# Install root dependencies (needed for Vercel serverless functions)
echo "📦 Installing root dependencies..."
npm install

# Build index landing page
echo "📦 Building landing page..."
cd index
npm install
npm run build
cd ..

# Build w1 frontend
echo "📦 Building w1 frontend..."
cd w1-resolution/frontend
npm install
npm run build
cd ../..

# Arrange static files
echo "📁 Arranging static files..."
rm -rf public
mkdir -p public/w1

# Copy landing page to root
cp -r index/dist/* public/

# Copy w1 app
cp -r w1-resolution/frontend/dist/* public/w1/

# Remove favicon link if vite.svg doesn't exist
if [ ! -f "public/w1/vite.svg" ]; then
  sed -i.bak '/<link rel="icon"/d' public/w1/index.html 2>/dev/null || true
  rm -f public/w1/index.html.bak
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "📂 Structure:"
echo "   public/          - Static files"
echo "   public/index.html  - Landing page"
echo "   public/w1/         - Resolution tracker app"
echo "   api/             - Serverless API functions"
echo ""
echo "📡 API endpoints:"
echo "   POST /api/chat                      - Chat with Claude"
echo "   GET  /api/chat/resolutions/list/all - List resolutions"
echo "   GET  /api/health                    - Health check"
