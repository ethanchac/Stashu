import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, CLOUDFRONT_URL } from '../config/aws.js';

/**
 * Generate presigned URL for uploading a file to S3
 * @param {string} s3Key - S3 object key (path)
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiration in seconds (default: 900 = 15 min)
 * @returns {Promise<string>} Presigned upload URL
 */
export const generatePresignedUploadUrl = async (s3Key, contentType, expiresIn = 900) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    ContentType: contentType,
    Metadata: {
      uploadedAt: new Date().toISOString()
    }
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
};

/**
 * Generate presigned URL for downloading a file from S3
 * @param {string} s3Key - S3 object key (path)
 * @param {number} expiresIn - URL expiration in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} Presigned download URL or CloudFront URL
 */
export const generatePresignedDownloadUrl = async (s3Key, expiresIn = 3600) => {
  // If CloudFront is configured, return CloudFront URL
  if (CLOUDFRONT_URL) {
    return `${CLOUDFRONT_URL}/${s3Key}`;
  }

  // Otherwise, generate S3 presigned URL
  const command = new GetObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key
  });

  const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
  return presignedUrl;
};

/**
 * Delete a file from S3
 * @param {string} s3Key - S3 object key (path)
 */
export const deleteS3Object = async (s3Key) => {
  const command = new DeleteObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key
  });

  await s3Client.send(command);
};
