#!/bin/bash
echo "Building and arranging files..."

# Build index
cd index
npm install
npm run build
cd ..

# Build w1
cd w1-resolution/frontend
npm install
npm run build
cd ../..

# Arrange output
rm -rf public
mkdir -p public/w1

# Copy landing page
cp -r index/dist/* public/

# Copy w1 app
cp -r w1-resolution/frontend/dist/* public/w1/

# Create _redirects file for Vercel routing
cat > public/_redirects << 'EOF'
/w1/* /w1/index.html 200
/* /index.html 200
EOF

echo "✅ Build complete"
