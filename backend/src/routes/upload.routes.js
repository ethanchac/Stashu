import express from 'express';
import { generateUploadUrl, generateDownloadUrl, uploadFileDirect, uploadMiddleware } from '../controllers/upload.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Handle OPTIONS preflight for CORS (must come before auth middleware)
router.options('/upload-url', (req, res) => {
  res.sendStatus(204);
});
router.options('/upload', (req, res) => {
  res.sendStatus(204);
});
router.options('/download-url', (req, res) => {
  res.sendStatus(204);
});

router.use(verifyFirebaseToken);
router.use(uploadLimiter);

router.post('/upload-url', generateUploadUrl);
router.post('/upload', uploadMiddleware, uploadFileDirect); // Direct upload through backend
router.post('/download-url', generateDownloadUrl);

export default router;
