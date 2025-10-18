# Railway Deployment Guide

This guide walks you through deploying the Stashu backend to Railway.

## Prerequisites

- Railway account (Hobby plan or higher)
- GitHub account (recommended for automatic deployments)
- All environment variables ready (Firebase, AWS credentials)

## Step 1: Initial Deployment

### Option A: Deploy via GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Railway deployment"
   git push origin main
   ```

2. **Connect to Railway**
   - Go to [railway.app](https://railway.app)
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your Stashu repository
   - Set the root directory to `backend`

3. **Railway will automatically detect your Node.js app**

### Option B: Deploy via Railway CLI

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login and deploy**
   ```bash
   cd backend
   railway login
   railway init
   railway up
   ```

## Step 2: Configure Environment Variables

In your Railway project dashboard, go to "Variables" and add:

```bash
# Server
NODE_ENV=production
PORT=3000

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-actual-project-id
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nYOUR_ACTUAL_PRIVATE_KEY\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project-id.iam.gserviceaccount.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-actual-access-key
AWS_SECRET_ACCESS_KEY=your-actual-secret-key
AWS_S3_BUCKET=stashu-app-files
AWS_CLOUDFRONT_URL=https://your-cloudfront-domain.cloudfront.net

# CORS - UPDATE THIS AFTER DEPLOYMENT
CORS_ORIGINS=https://your-web-app.vercel.app,https://your-railway-url.up.railway.app
```

**Important Notes:**
- For `FIREBASE_PRIVATE_KEY`: Copy the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Use `\n` for newlines in the private key
- Don't use quotes around the values in Railway's UI

## Step 3: Get Your Railway URL

1. After deployment, Railway will provide a URL like: `https://stashu-backend-production.up.railway.app`
2. Click "Generate Domain" in your Railway dashboard if not auto-generated
3. Test your deployment:
   ```bash
   curl https://your-railway-url.up.railway.app/health
   ```
   Should return: `{"status":"ok","timestamp":"..."}`

## Step 4: Update CORS Origins

1. Go back to Railway Variables
2. Update `CORS_ORIGINS` to include:
   - Your Railway backend URL
   - Your web app URL (Vercel/Netlify)
   - Any other allowed origins

   Example:
   ```
   CORS_ORIGINS=https://stashu-web.vercel.app,https://stashu-backend.up.railway.app
   ```

## Step 5: Update Client Apps

### Web App
Update the API URL in your web app configuration:

```javascript
// web/.env.production or web/src/config.js
VITE_API_URL=https://your-railway-url.up.railway.app
```

### Mobile App
Update the API URL in your mobile app:

```javascript
// mobile/src/config.js or mobile/app.json
API_URL=https://your-railway-url.up.railway.app
```

## Step 6: Enable Automatic Deployments (GitHub)

If using GitHub:
1. Railway automatically deploys on every push to your main branch
2. You can configure deployment triggers in Settings > Deploys

## Monitoring & Logs

- **View Logs**: Railway Dashboard → Your Project → Logs
- **Monitor Health**: `GET https://your-url.up.railway.app/health`
- **Check Metrics**: Railway Dashboard shows CPU, Memory, Network usage

## Troubleshooting

### Deployment fails
- Check the build logs in Railway dashboard
- Ensure all environment variables are set correctly
- Verify `package.json` has correct start script: `"start": "node src/index.js"`

### CORS errors
- Verify `CORS_ORIGINS` includes your client app URLs
- Check that URLs don't have trailing slashes
- Ensure protocol (http/https) matches exactly

### Firebase errors
- Double-check `FIREBASE_PRIVATE_KEY` formatting
- Ensure newlines are represented as `\n`
- Verify Firebase project ID matches

### AWS S3 errors
- Confirm AWS credentials are valid
- Check S3 bucket name is correct
- Verify CORS is configured on your S3 bucket

## Scaling (Hobby Plan)

Railway Hobby plan includes:
- $5/month usage
- Auto-scaling based on traffic
- 512 MB memory (default)
- Can adjust resources in Settings → Resources

## Custom Domain (Optional)

1. Go to Settings → Domains
2. Click "Custom Domain"
3. Add your domain (e.g., `api.stashu.com`)
4. Update DNS records as instructed
5. Update `CORS_ORIGINS` with new domain

## Security Checklist

- [ ] All sensitive data in environment variables (not committed to git)
- [ ] `.env` file is in `.gitignore`
- [ ] CORS origins are restricted to your actual domains
- [ ] Rate limiting is enabled (already configured in code)
- [ ] Firebase and AWS credentials are valid and have minimum required permissions

## Useful Commands

```bash
# View logs
railway logs

# Run migrations or one-off commands
railway run node scripts/migrate.js

# Open Railway dashboard
railway open

# Check service status
railway status
```

## Next Steps

1. Deploy your web app to Vercel/Netlify
2. Update mobile app with Railway URL
3. Test all API endpoints
4. Set up monitoring/alerts (Railway provides basic monitoring)
5. Configure backup strategy for Firebase data

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create an issue in your repo
