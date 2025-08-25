import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { 
  createRateLimit, 
  sanitizeInput, 
  securityHeaders, 
  monitoring, 
  errorHandler,
  healthCheck,
  performanceMonitor,
  errorTracker
} from "./risk-mitigation";

const app = express();

// Security and risk mitigation middleware
app.use(securityHeaders);
app.use(sanitizeInput);

// Rate limiting for API protection
app.use('/api', createRateLimit(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
app.use('/api/ai', createRateLimit(5 * 60 * 1000, 20)); // 20 AI requests per 5 minutes

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Performance monitoring
app.use(monitoring);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Health check and monitoring endpoints
app.get('/health', (req, res) => {
  res.json(healthCheck());
});

app.get('/api/system/metrics', (req, res) => {
  res.json({
    performance: performanceMonitor.getStats(),
    errors: errorTracker.getStats(),
    health: healthCheck()
  });
});

(async () => {
  const server = await registerRoutes(app);

  // Enhanced error handling with tracking
  app.use(errorHandler);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
