# Stashu Backend API

Node.js/Express backend for the Stashu personal multi-channel storage app.

## Stack

- **Runtime**: Node.js 20+
- **Framework**: Express
- **Auth & Database**: Firebase Admin SDK (Firestore)
- **File Storage**: AWS S3 (presigned URLs)
- **Validation**: Zod
- **Rate Limiting**: express-rate-limit

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your credentials:

```env
# Server
PORT=3000
NODE_ENV=development

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=stashu-uploads
AWS_CLOUDFRONT_URL=https://your-cdn.cloudfront.net

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database
3. Enable Authentication (Email/Password + Google)
4. Generate a service account key:
   - Project Settings → Service Accounts → Generate New Private Key
5. Copy the credentials to `.env`

### 4. AWS S3 Setup

1. Create an S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Configure CORS on the bucket (required for browser uploads):

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "https://your-domain.com"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

**Important**: The backend disables AWS SDK checksums to prevent CORS issues during browser uploads. This is configured in `src/config/aws.js` and `src/services/s3.service.js`.

4. Add credentials to `.env`

### 5. Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Channels
- `POST /api/channels` - Create channel
- `GET /api/channels` - List all channels
- `GET /api/channels/:channelId` - Get single channel
- `PATCH /api/channels/:channelId` - Update channel
- `DELETE /api/channels/:channelId` - Delete channel

### Messages
- `POST /api/channels/:channelId/messages` - Create message
- `GET /api/channels/:channelId/messages` - List messages (paginated)
- `DELETE /api/channels/:channelId/messages/:messageId` - Delete message
- `PATCH /api/channels/:channelId/messages/:messageId/pin` - Toggle pin

### File Upload
- `POST /api/upload-url` - Generate presigned upload URL
- `POST /api/download-url` - Generate presigned download URL

## Authentication

All API endpoints (except `/health`) require Firebase JWT token:

```
Authorization: Bearer <firebase-id-token>
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Uploads: 20 requests per hour
- Auth: 5 requests per 15 minutes

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration (Firebase, AWS, env)
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, error handling, rate limiting
│   ├── models/          # Validation schemas (Zod)
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic (S3, Firestore)
│   └── index.js         # Express app entry point
├── .env.example
├── package.json
└── README.md
```

## Deployment

### Railway

```bash
railway login
railway link
railway up
```

### Render

Connect your GitHub repo and set environment variables in Render dashboard.

### AWS Lambda (Serverless)

Use `serverless-http` wrapper - see deployment guide in main README.

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm start` - Start production server
- `npm test` - Run tests (not yet implemented)
