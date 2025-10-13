import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
});

export const S3_BUCKET = config.aws.s3Bucket;
export const CLOUDFRONT_URL = config.aws.cloudFrontUrl;
