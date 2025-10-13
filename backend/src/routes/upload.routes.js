import express from 'express';
import { generateUploadUrl, generateDownloadUrl } from '../controllers/upload.controller.js';
import { verifyFirebaseToken } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.use(verifyFirebaseToken);
router.use(uploadLimiter);

router.post('/upload-url', generateUploadUrl);
router.post('/download-url', generateDownloadUrl);

export default router;
