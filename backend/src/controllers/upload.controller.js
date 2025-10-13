import { generatePresignedUploadUrl, generatePresignedDownloadUrl } from '../services/s3.service.js';
import { uploadRequestSchema, ALLOWED_FILE_TYPES_MAP } from '../models/message.model.js';
import { v4 as uuidv4 } from 'uuid';

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
