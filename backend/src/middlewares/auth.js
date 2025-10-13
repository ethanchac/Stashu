import admin from '../config/firebase.js';

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.split('Bearer ')[1];

    // Verify token with Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Attach user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified
    };

    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({
      error: 'Invalid or expired token'
    });
  }
};
