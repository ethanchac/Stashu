#!/bin/bash

# Script to configure S3 bucket CORS for Stashu app
# Usage: ./configure-s3-cors.sh <bucket-name>

BUCKET_NAME="${1:-stashu-app-files}"

echo "Configuring CORS for S3 bucket: $BUCKET_NAME"

# Create CORS configuration file (matching the working Python project configuration)
cat > /tmp/cors-config.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag", "x-amz-meta-custom-header", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply CORS configuration to S3 bucket
aws s3api put-bucket-cors --bucket "$BUCKET_NAME" --cors-configuration file:///tmp/cors-config.json

if [ $? -eq 0 ]; then
  echo "✅ CORS configuration applied successfully!"
  echo ""
  echo "Verifying configuration..."
  aws s3api get-bucket-cors --bucket "$BUCKET_NAME"
else
  echo "❌ Failed to apply CORS configuration"
  echo "Make sure AWS CLI is installed and configured with proper credentials"
  exit 1
fi

# Clean up
rm /tmp/cors-config.json
