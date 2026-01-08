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
mkdir -p public/w1

# Copy landing page
cp -r index/dist/* public/

# Copy w1 app
cp -r w1-resolution/frontend/dist/* public/w1/

# FIX: Update favicon path in w1 index.html to use /w1/ prefix
sed -i.bak 's|href="/vite.svg"|href="/w1/vite.svg"|g' public/w1/index.html
rm -f public/w1/index.html.bak

# Copy API functions to root api/ directory for Vercel
# Note: copy to api/chat/* not api/w1/chat/* so the path is /api/chat not /api/w1/chat
mkdir -p api/chat
cp api/w1/chat.ts api/chat.ts 2>/dev/null || true
cp -r api/w1/chat/* api/chat/ 2>/dev/null || true

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
echo "w1 index.html favicon line:"
grep "vite.svg" public/w1/index.html || echo "No vite.svg found"
echo ""
echo "API functions structure:"
find api -type f | sort || echo "ERROR: no api/ folder"
