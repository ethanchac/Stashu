import { generatePresignedUploadUrl, generatePresignedDownloadUrl, uploadFileToS3 } from '../services/s3.service.js';
import { uploadRequestSchema, ALLOWED_FILE_TYPES_MAP } from '../models/message.model.js';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export const uploadMiddleware = upload.single('file');

export const generateUploadUrl = async (req, res, next) => {
  try {
    const { fileName, fileType, fileSize } = req.body;
    const uid = req.user.uid;

    // Validate input
    const validated = uploadRequestSchema.parse({ fileName, fileType, fileSize });

    // Generate unique S3 key
    const fileExtension = ALLOWED_FILE_TYPES_MAP[validated.fileType];
    const uniqueId = uuidv4();
    const s3Key = `users/${uid}/uploads/${uniqueId}${fileExtension}`;

    // Generate presigned URL (expires in 15 minutes)
    const presignedUrl = await generatePresignedUploadUrl(s3Key, validated.fileType);

    res.json({
      uploadUrl: presignedUrl,
      s3Key,
      expiresIn: 900 // 15 minutes
    });
  } catch (error) {
    next(error);
  }
};

export const uploadFileDirect = async (req, res, next) => {
  try {
    const uid = req.user.uid;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    // Generate unique S3 key
    const fileExtension = ALLOWED_FILE_TYPES_MAP[file.mimetype];
    if (!fileExtension) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const uniqueId = uuidv4();
    const s3Key = `users/${uid}/uploads/${uniqueId}${fileExtension}`;

    // Upload file directly to S3 from backend
    await uploadFileToS3(s3Key, file.buffer, file.mimetype);

    // Generate download URL
    const downloadUrl = await generatePresignedDownloadUrl(s3Key);

    res.json({
      s3Key,
      fileMetadata: {
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype
      },
      downloadUrl
    });
  } catch (error) {
    next(error);
  }
};

export const generateDownloadUrl = async (req, res, next) => {
  try {
    const { s3Key } = req.body;
    const uid = req.user.uid;

    if (!s3Key) {
      return res.status(400).json({ error: 'S3 key is required' });
    }

    // Verify user owns the file
    if (!s3Key.startsWith(`users/${uid}/`)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate presigned download URL (expires in 1 hour)
    const downloadUrl = await generatePresignedDownloadUrl(s3Key);

    res.json({
      downloadUrl,
      expiresIn: 3600 // 1 hour
    });
  } catch (error) {
    next(error);
  }
};
