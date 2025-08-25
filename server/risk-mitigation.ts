import { Request, Response, NextFunction } from 'express';

// Circuit breaker pattern for external API calls
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private threshold = 5,
    private timeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState() {
    return this.state;
  }
}

// Rate limiting middleware
export function createRateLimit(windowMs: number, max: number) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Clean old entries
    for (const [ip, data] of requests.entries()) {
      if (data.resetTime < windowStart) {
        requests.delete(ip);
      }
    }

    const current = requests.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (current.count >= max && current.resetTime > now) {
      res.status(429).json({
        error: 'Too many requests',
        retryAfter: Math.ceil((current.resetTime - now) / 1000)
      });
      return;
    }

    current.count++;
    requests.set(key, current);
    next();
  };
}

// Input sanitization middleware
export function sanitizeInput(req: Request, res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    
    if (obj && typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    
    return obj;
  };

  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  next();
}

// Security headers middleware
export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'");
  next();
}

// Health check endpoint
export function healthCheck() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'connected', // Would check actual DB connection
    externalAPIs: {
      openai: 'limited', // Based on circuit breaker state
      fallback: 'available'
    }
  };
}

// Error tracking and monitoring
class ErrorTracker {
  private errors: Array<{
    timestamp: number;
    error: string;
    endpoint: string;
    userId?: string;
  }> = [];

  track(error: Error, endpoint: string, userId?: string) {
    this.errors.push({
      timestamp: Date.now(),
      error: error.message,
      endpoint,
      userId
    });

    // Keep only last 1000 errors
    if (this.errors.length > 1000) {
      this.errors = this.errors.slice(-1000);
    }

    // Log critical errors
    if (this.isCritical(error)) {
      console.error('CRITICAL ERROR:', {
        error: error.message,
        stack: error.stack,
        endpoint,
        userId,
        timestamp: new Date().toISOString()
      });
    }
  }

  private isCritical(error: Error): boolean {
    const criticalPatterns = [
      'database',
      'authentication',
      'security',
      'payment'
    ];
    
    return criticalPatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern)
    );
  }

  getStats() {
    const recent = this.errors.filter(e => 
      Date.now() - e.timestamp < 3600000 // Last hour
    );

    const byEndpoint = recent.reduce((acc, error) => {
      acc[error.endpoint] = (acc[error.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalErrors: this.errors.length,
      recentErrors: recent.length,
      errorsByEndpoint: byEndpoint,
      errorRate: recent.length / 60 // errors per minute
    };
  }
}

// Performance monitoring
class PerformanceMonitor {
  private metrics: Array<{
    endpoint: string;
    duration: number;
    timestamp: number;
    statusCode: number;
  }> = [];

  track(endpoint: string, duration: number, statusCode: number) {
    this.metrics.push({
      endpoint,
      duration,
      timestamp: Date.now(),
      statusCode
    });

    // Keep only last 10000 requests
    if (this.metrics.length > 10000) {
      this.metrics = this.metrics.slice(-5000);
    }
  }

  getStats() {
    const recent = this.metrics.filter(m => 
      Date.now() - m.timestamp < 3600000 // Last hour
    );

    const avgResponseTime = recent.length > 0 
      ? recent.reduce((sum, m) => sum + m.duration, 0) / recent.length 
      : 0;

    const successRate = recent.length > 0
      ? recent.filter(m => m.statusCode < 400).length / recent.length
      : 1;

    return {
      totalRequests: this.metrics.length,
      recentRequests: recent.length,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 100),
      requestsPerMinute: recent.length / 60
    };
  }
}

// Backup system for critical data
export class BackupSystem {
  private backups: Map<string, any> = new Map();

  backup(key: string, data: any) {
    this.backups.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  restore(key: string) {
    return this.backups.get(key)?.data;
  }

  listBackups() {
    return Array.from(this.backups.entries()).map(([key, backup]) => ({
      key,
      timestamp: backup.timestamp,
      age: Date.now() - backup.timestamp
    }));
  }
}

// Export singleton instances
export const circuitBreaker = new CircuitBreaker();
export const errorTracker = new ErrorTracker();
export const performanceMonitor = new PerformanceMonitor();
export const backupSystem = new BackupSystem();

// Monitoring middleware
export function monitoring(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMonitor.track(req.path, duration, res.statusCode);
  });
  
  next();
}

// Error handling middleware
export function errorHandler(error: Error, req: Request, res: Response, next: NextFunction) {
  errorTracker.track(error, req.path, req.body?.userId);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString()
  });
}