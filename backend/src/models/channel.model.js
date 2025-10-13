import { z } from 'zod';

export const channelSchema = z.object({
  name: z.string()
    .min(1, 'Channel name is required')
    .max(50, 'Channel name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Channel name contains invalid characters'),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format')
    .optional()
    .default('#6366f1'),
  icon: z.string()
    .max(4, 'Icon must be a single emoji')
    .optional()
    .default('💬')
});

export const updateChannelSchema = z.object({
  name: z.string()
    .min(1, 'Channel name is required')
    .max(50, 'Channel name must be 50 characters or less')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Channel name contains invalid characters')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color format')
    .optional(),
  icon: z.string()
    .max(4, 'Icon must be a single emoji')
    .optional()
});
