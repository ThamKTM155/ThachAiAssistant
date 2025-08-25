import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Security headers configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://api.google.com"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Request sanitization middleware
export const sanitizeHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-cluster-client-ip'];
  
  // Validate Content-Type for POST requests
  if (req.method === 'POST' && req.path.startsWith('/api/')) {
    const contentType = req.get('Content-Type');
    if (!contentType || (!contentType.includes('application/json') && !contentType.includes('multipart/form-data'))) {
      return res.status(400).json({ error: 'Invalid Content-Type header' });
    }
  }
  
  next();
};

// IP whitelist/blacklist middleware
const blockedIPs = new Set<string>();
const suspiciousIPs = new Map<string, { count: number, lastAttempt: number }>();

export const ipSecurity = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || '';
  
  // Check if IP is blocked
  if (blockedIPs.has(clientIP)) {
    return res.status(403).json({ error: 'Access denied from this IP address' });
  }
  
  // Track suspicious activity
  const now = Date.now();
  const suspicious = suspiciousIPs.get(clientIP);
  
  if (suspicious) {
    // Reset counter if last attempt was more than 1 hour ago
    if (now - suspicious.lastAttempt > 60 * 60 * 1000) {
      suspiciousIPs.delete(clientIP);
    } else if (suspicious.count > 50) {
      // Block IP after 50 suspicious requests in 1 hour
      blockedIPs.add(clientIP);
      console.warn(`Blocked IP ${clientIP} due to suspicious activity`);
      return res.status(403).json({ error: 'IP blocked due to suspicious activity' });
    }
  }
  
  next();
};

// Request size limiting
export const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = parseInt(req.get('Content-Length') || '0');
  const maxSize = req.path.includes('/upload') ? 50 * 1024 * 1024 : 1024 * 1024; // 50MB for uploads, 1MB for others
  
  if (contentLength > maxSize) {
    return res.status(413).json({ error: 'Request entity too large' });
  }
  
  next();
};

// Mark suspicious IP activity
export const markSuspiciousActivity = (ip: string) => {
  const now = Date.now();
  const existing = suspiciousIPs.get(ip);
  
  if (existing) {
    suspiciousIPs.set(ip, { count: existing.count + 1, lastAttempt: now });
  } else {
    suspiciousIPs.set(ip, { count: 1, lastAttempt: now });
  }
};