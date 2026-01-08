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

echo ""
echo "=== FINAL PUBLIC DIRECTORY CONTENTS ==="
ls -la public/ || echo "ERROR: public/ does not exist!"
echo ""
echo "w1 directory:"
ls -la public/w1/ || echo "ERROR: public/w1 does not exist!"
echo ""
echo "_redirects file:"
cat public/_redirects || echo "ERROR: _redirects does not exist!"
