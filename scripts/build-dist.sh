#!/bin/bash

# Create root dist directory
rm -rf dist
mkdir -p dist

# Copy landing page to root
cp -r index/dist/* dist/

# Copy w1 to w1 subdirectory
mkdir -p dist/w1
cp -r w1-resolution/frontend/dist/* dist/w1/

# Copy API functions
mkdir -p dist/w1/api
cp -r w1-resolution/api/* dist/w1/api/ 2>/dev/null || true

# Create root index.html that redirects to landing
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Daily Brief</title>
</head>
<body>
  <script>window.location.href = '/';</script>
</body>
</html>
EOF

echo "✅ Distribution build complete"
