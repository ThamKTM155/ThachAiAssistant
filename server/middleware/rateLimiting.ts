import rateLimit from 'express-rate-limit';

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: 15 * 60 // 15 minutes in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/api/health';
  }
});

// Strict rate limiting for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 login attempts per windowMs
  message: {
    error: 'Too many login attempts, please try again later.',
    retryAfter: 15 * 60
  },
  skipSuccessfulRequests: true,
});

// AI endpoint rate limiting (more restrictive)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit AI requests to 10 per minute
  message: {
    error: 'AI request rate limit exceeded. Please wait before making more requests.',
    retryAfter: 60
  },
});

// File upload rate limiting
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit uploads to 5 per minute
  message: {
    error: 'Upload rate limit exceeded. Please wait before uploading more files.',
    retryAfter: 60
  },
});

// CRM operations rate limiting
export const crmLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit CRM operations to 30 per minute
  message: {
    error: 'CRM operation rate limit exceeded. Please slow down.',
    retryAfter: 60
  },
});