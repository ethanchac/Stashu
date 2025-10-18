import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  },
  // Disable checksums to avoid CORS issues
  requestChecksumCalculation: 'WHEN_REQUIRED',
  // Force virtual-hosted-style URLs for better CORS compatibility
  forcePathStyle: false
});

export const S3_BUCKET = config.aws.s3Bucket;
export const CLOUDFRONT_URL = config.aws.cloudFrontUrl;
