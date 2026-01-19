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

# Build w2 frontend
echo "📦 Building w2 frontend..."
cd w2-resolution/frontend
npm install
npm run build
cd ../..

# Build w3 frontend (if exists)
if [ -d "w3-resolution/frontend" ] && [ -f "w3-resolution/frontend/package.json" ]; then
  echo "📦 Building w3 frontend..."
  cd w3-resolution/frontend
  npm install
  npm run build
  cd ../..
else
  echo "⏭️  Skipping w3 frontend (not ready yet)"
fi

# Arrange static files
echo "📁 Arranging static files..."
rm -rf public
mkdir -p public/w1 public/w2 public/w3

# Copy landing page to root
cp -r index/dist/* public/

# Copy w1 app
cp -r w1-resolution/frontend/dist/* public/w1/

# Copy w2 app
cp -r w2-resolution/frontend/dist/* public/w2/

# Copy w3 app (if exists)
if [ -d "w3-resolution/frontend/dist" ]; then
  cp -r w3-resolution/frontend/dist/* public/w3/
fi

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
echo "   public/w2/         - Model Mapper app"
echo "   public/w3/         - Deep Research app"
echo "   api/             - Serverless API functions"
echo ""
echo "📡 API endpoints:"
echo "   POST /api/chat                      - Chat with Claude"
echo "   GET  /api/chat/resolutions/list/all - List resolutions"
echo "   POST /api/compare                   - Compare AI models"
echo "   POST /api/research                  - Deep research queries"
echo "   GET  /api/health                    - Health check"
