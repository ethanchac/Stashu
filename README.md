# Stashu

A personal multi-channel storage and organization app that functions like your own private Discord. Create channels, store notes, links, files, and images across web and mobile devices with real-time synchronization.

## Overview

Stashu is a cross-platform app designed for personal use - allowing you to organize your digital life into separate channels or "chats" where you can store:

- Text notes and thoughts
- Links and bookmarks
- Files and documents
- Images and screenshots

Everything syncs in real-time across all your devices.

## Tech Stack

### Frontend
- **Web**: React + Vite + Tailwind CSS
- **Mobile**: React Native (coming soon)

### Backend
- **API**: Node.js + Express
- **Authentication & Database**: Firebase Authentication + Firestore
- **File Storage**: AWS S3 (presigned URLs) + CloudFront CDN (optional)

## Project Structure

```
stashu/
├── backend/          # Node.js/Express API server
├── web/              # React web app
├── mobile/           # React Native app (coming soon)
├── shared/           # Shared types/constants
├── firestore.rules   # Firestore security rules
└── firebase.json     # Firebase configuration
```

## Quick Start

### Prerequisites

- Node.js 20+
- Firebase project
- AWS S3 bucket
- npm or pnpm

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd stashu
npm install
```

### 2. Backend Setup

```bash
cd backend
cp .env.example .env
# Fill in your Firebase and AWS credentials in .env
npm install
npm run dev
```

Backend runs on http://localhost:3000

See [backend/README.md](backend/README.md) for detailed setup instructions.

### 3. Web Frontend Setup

```bash
cd web
cp .env.example .env
# Fill in your Firebase configuration in .env
npm install
npm run dev
```

Web app runs on http://localhost:5173

## Features

### MVP (In Progress)
- ✅ Backend API with Express
- ✅ Firebase authentication infrastructure
- ✅ Channel CRUD operations
- ✅ Message CRUD operations
- ✅ File upload with S3 presigned URLs
- ✅ Firestore real-time listeners
- ✅ React frontend with Tailwind CSS
- 🚧 Discord-style UI components
- 🚧 Authentication pages
- 🚧 File upload UI

### Coming Soon
- [ ] Complete MVP UI
- [ ] Google OAuth login
- [ ] Pin messages
- [ ] Tag messages
- [ ] Message search
- [ ] Rich link previews
- [ ] Dark/Light theme toggle
- [ ] Mobile app (React Native)
- [ ] Offline support
- [ ] Push notifications

## Architecture Highlights

### Real-time Sync
Uses Firestore's `onSnapshot` listeners for instant updates across all connected devices without polling.

### Secure File Upload
- Client requests presigned S3 URL from backend
- Client uploads directly to S3 (bypasses backend for large files)
- Backend validates file type/size before generating URL
- Files are stored under `users/{uid}/uploads/` for isolation

### Authentication
- Firebase handles auth (email/password + Google OAuth)
- Backend verifies JWT tokens on every API request
- Rate limiting prevents abuse (100 req/15min for API, 20 req/hour for uploads)

### Database Schema

```
firestore/
└── users/{uid}/
    ├── profile (user metadata)
    └── channels/{channelId}/
        ├── name, color, icon, messageCount
        └── messages/{messageId}/
            ├── content, type, fileRef
            ├── tags[], isPinned
            └── createdAt, deviceInfo
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/channels` | GET | List all channels |
| `/api/channels` | POST | Create channel |
| `/api/channels/:id` | PATCH | Update channel |
| `/api/channels/:id` | DELETE | Delete channel |
| `/api/channels/:id/messages` | GET | List messages (paginated) |
| `/api/channels/:id/messages` | POST | Create message |
| `/api/channels/:id/messages/:msgId` | DELETE | Delete message |
| `/api/channels/:id/messages/:msgId/pin` | PATCH | Toggle pin |
| `/api/upload-url` | POST | Generate presigned upload URL |
| `/api/download-url` | POST | Generate presigned download URL |

All API endpoints (except `/health`) require Firebase JWT token in `Authorization: Bearer <token>` header.

## Development

### Run Backend
```bash
cd backend
npm run dev
```

### Run Web Frontend
```bash
cd web
npm run dev
```

### Run Both Concurrently
```bash
# From project root
npm run dev:backend & npm run dev:web
```

## Security

- Firebase authentication with JWT token verification
- Firestore security rules (owner-only access)
- Short-lived presigned S3 URLs (15min upload, 1hr download)
- Rate limiting on all API endpoints
- Input validation with Zod schemas
- CORS restricted to specific origins

## License

MIT

---

Built with Claude Code ⚡
