#!/bin/bash
echo "Creating offline demo package..."

# Create temp directory
mkdir -p temp-package

# Copy all necessary files
cp -r docs/* temp-package/
# Remove web-specific files
rm temp-package/download/download.html

# Create zip
cd temp-package
zip -r ../docs/download/therapy-demo-offline.zip * -x "*.git*" "*.DS_Store*"
cd ..

# Cleanup
rm -rf temp-package

echo "Package created: docs/download/therapy-demo-offline.zip"
echo "File size: $(ls -lh docs/download/therapy-demo-offline.zip | awk '{print $5}')"