import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, S3_BUCKET, CLOUDFRONT_URL } from '../config/aws.js';
import { config } from '../config/env.js';

/**
 * Generate presigned URL for uploading a file to S3
 * @param {string} s3Key - S3 object key (path)
 * @param {string} contentType - MIME type
 * @param {number} expiresIn - URL expiration in seconds (default: 900 = 15 min)
 * @returns {Promise<string>} Presigned upload URL
 */
export const generatePresignedUploadUrl = async (s3Key, contentType, expiresIn = 900) => {
  // Don't include ContentType in the command to avoid CORS preflight issues
  // The client will send Content-Type header, which will trigger a preflight
  // but we need to ensure CORS is handled properly by not signing the header
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key
  });

  // Generate presigned URL with unhoistable headers to avoid CORS issues
  // The unhoistableHeaders prevents these headers from being included in the signature
  // which allows clients to send them without signature mismatch errors
  // See: https://github.com/aws/aws-sdk-js-v3/issues/2006
  const presignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn,
    unhoistableHeaders: new Set([
      'x-amz-checksum-sha256',
      'x-amz-content-sha256',
      'content-type'  // Allow client to set Content-Type without signature mismatch
    ])
  });
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

  // Since the bucket is public, return direct S3 URL (no expiration)
  const region = config.aws.region;
  return `https://${S3_BUCKET}.s3.${region}.amazonaws.com/${s3Key}`;
};

/**
 * Upload a file directly to S3 from backend
 * @param {string} s3Key - S3 object key (path)
 * @param {Buffer} fileBuffer - File data buffer
 * @param {string} contentType - MIME type
 */
export const uploadFileToS3 = async (s3Key, fileBuffer, contentType) => {
  const command = new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: fileBuffer,
    ContentType: contentType
    // Note: ACL not used - bucket policy makes objects public
  });

  await s3Client.send(command);
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
