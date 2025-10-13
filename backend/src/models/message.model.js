import { z } from 'zod';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_FILE_TYPES = ['application/pdf', 'text/plain', 'application/zip', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const messageSchema = z.object({
  content: z.string().min(1).max(5000, 'Message content must be 5000 characters or less'),
  type: z.enum(['text', 'image', 'file', 'link'], {
    errorMap: () => ({ message: 'Type must be one of: text, image, file, link' })
  }),
  fileRef: z.string().nullable().optional(),
  fileMetadata: z.object({
    fileName: z.string(),
    fileSize: z.number().max(MAX_FILE_SIZE, 'File size exceeds 50MB limit'),
    mimeType: z.string().refine(
      (type) => [...ALLOWED_IMAGE_TYPES, ...ALLOWED_FILE_TYPES].includes(type),
      'Unsupported file type'
    )
  }).nullable().optional(),
  tags: z.array(z.string()).optional().default([])
});

export const uploadRequestSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileType: z.string().refine(
    (type) => [...ALLOWED_IMAGE_TYPES, ...ALLOWED_FILE_TYPES].includes(type),
    'Unsupported file type'
  ),
  fileSize: z.number().max(MAX_FILE_SIZE, 'File size exceeds 50MB limit')
});

export const ALLOWED_FILE_TYPES_MAP = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
  'text/plain': '.txt',
  'application/zip': '.zip',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
};
