import admin from 'firebase-admin';
import { config } from './env.js';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: config.firebase.projectId,
    privateKey: config.firebase.privateKey,
    clientEmail: config.firebase.clientEmail
  })
});

// Export Firestore instance
export const db = admin.firestore();

// Export admin for auth verification
export default admin;
