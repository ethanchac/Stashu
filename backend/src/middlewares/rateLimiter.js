import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later'
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 upload requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many upload requests, please try again later'
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many authentication attempts, please try again later'
});
