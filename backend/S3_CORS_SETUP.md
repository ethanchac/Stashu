# S3 CORS Configuration for Stashu

## The Issue
Browser uploads to S3 are being blocked because the S3 bucket doesn't have proper CORS configuration. You'll see an error like:
```
Access to XMLHttpRequest at 'https://stashu-app-files.s3.us-east-1.amazonaws.com/...'
from origin 'http://localhost:5173' has been blocked by CORS policy
```

## Solution: Configure S3 Bucket CORS

### Option 1: Using AWS Console (Recommended)

1. **Go to AWS S3 Console**: https://s3.console.aws.amazon.com/s3/buckets/stashu-app-files

2. **Navigate to Permissions tab**
   - Click on your bucket `stashu-app-files`
   - Click on the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"

3. **Click "Edit"** and paste this configuration:

```json
[
  {
    "AllowedOrigins": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-custom-header",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

**Note:** Using `"*"` for `AllowedOrigins` allows all origins (useful for development). For production, replace with specific domains like:
```json
"AllowedOrigins": [
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

4. **Click "Save changes"**

5. **Wait 1-2 minutes** for the changes to propagate

6. **Refresh your browser** and try uploading again

### Option 2: Using AWS CLI

If you have AWS CLI installed and configured:

```bash
cd backend/scripts
./configure-s3-cors.sh stashu-app-files
```

### Option 3: Using AWS CLI Manually

```bash
# Create a file named cors.json with the configuration above
aws s3api put-bucket-cors --bucket stashu-app-files --cors-configuration file://cors.json
```

## Verify CORS Configuration

After applying the configuration, verify it worked:

```bash
aws s3api get-bucket-cors --bucket stashu-app-files
```

Or check in AWS Console under Permissions → CORS.

## Testing

1. Open your web app at http://localhost:5173
2. Try uploading an image or file
3. Check browser DevTools → Network tab
   - Look for the PUT request to S3
   - It should now succeed with status 200

## Adding Production Domain

When you deploy to production, add your production domain to the `AllowedOrigins` array:

```json
"AllowedOrigins": [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://yourdomain.com",
  "https://www.yourdomain.com"
]
```

## Important Notes

- **CORS changes can take 1-2 minutes to propagate** - be patient!
- **Clear your browser cache** if uploads still fail after configuration
- The `AllowedHeaders: ["*"]` allows all headers, which is fine for development
- For production, you might want to restrict `AllowedOrigins` to specific domains only

## Troubleshooting

If uploads still fail after configuring CORS:

1. **Check S3 bucket permissions**: Ensure your IAM user has `s3:PutObject` permission
2. **Verify presigned URL**: Check that the URL in the error message is correct
3. **Check bucket policy**: Make sure there's no bucket policy blocking uploads
4. **Wait longer**: Sometimes AWS takes a few minutes to propagate CORS changes
5. **Hard refresh browser**: Press Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
