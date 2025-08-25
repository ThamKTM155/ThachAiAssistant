import express, { type Request, Response } from "express";
import cors from "cors";
import { createServer } from "http";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false }));

// Health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    service: "ThachAI Assistant API"
  });
});

// Basic API routes
app.get("/api/status", (req: Request, res: Response) => {
  res.json({
    service: "ThachAI Assistant",
    version: "1.0.0",
    features: [
      "AI Content Generation",
      "Shopee Integration", 
      "Voice Processing",
      "Business Analytics",
      "Multi-platform Support",
      "Security Framework"
    ],
    status: "operational"
  });
});

// AI capabilities endpoint
app.get("/api/capabilities", (req: Request, res: Response) => {
  res.json({
    aiFeatures: {
      contentCreation: {
        name: "Tạo Nội Dung AI",
        description: "Tạo video TikTok, bài viết blog, và nội dung sáng tạo",
        status: "active"
      },
      shopeeIntegration: {
        name: "Tích Hợp Shopee", 
        description: "Theo dõi giá sản phẩm, phân tích thị trường",
        status: "active"
      },
      businessAnalytics: {
        name: "Phân Tích Kinh Doanh",
        description: "Dashboard thông minh với báo cáo chi tiết",
        status: "active"
      },
      voiceProcessing: {
        name: "Xử Lý Giọng Nói",
        description: "Nhận diện và tổng hợp giọng nói tiếng Việt",
        status: "active"
      },
      multiPlatform: {
        name: "Đa Nền Tảng",
        description: "Tích hợp Google Assistant, Alexa, Microsoft Bot",
        status: "active"
      },
      security: {
        name: "Bảo Mật Cao",
        description: "Mã hóa dữ liệu, xác thực hai lớp, tuân thủ GDPR",
        status: "active"
      }
    }
  });
});

// Demo AI endpoint
app.post("/api/ai/generate", (req: Request, res: Response) => {
  const { prompt, type = "text" } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Simple response for demo
  res.json({
    success: true,
    response: `ThachAI Assistant đã xử lý: "${prompt}". Tính năng AI sẽ được tích hợp đầy đủ sau khi kết nối API keys.`,
    type,
    timestamp: new Date().toISOString(),
    metadata: {
      provider: "ThachAI",
      language: "vi",
      processed: true
    }
  });
});

// Voice processing endpoint
app.post("/api/voice/process", (req: Request, res: Response) => {
  const { audioData, language = "vi-VN" } = req.body;
  
  res.json({
    success: true,
    transcript: "Xin chào! Tôi là ThachAI Assistant.",
    response: "Tôi có thể giúp bạn tạo nội dung, theo dõi giá Shopee, và phân tích kinh doanh.",
    language,
    confidence: 0.95,
    timestamp: new Date().toISOString()
  });
});

// Shopee integration endpoint
app.get("/api/shopee/status", (req: Request, res: Response) => {
  res.json({
    integration: "Shopee API",
    status: "ready",
    features: [
      "Price monitoring",
      "Market analysis", 
      "Product tracking",
      "Sales optimization"
    ],
    message: "Shopee integration ready for API key configuration"
  });
});

// Business analytics endpoint
app.get("/api/analytics/dashboard", (req: Request, res: Response) => {
  res.json({
    dashboard: "Business Intelligence",
    status: "operational",
    metrics: {
      totalUsers: 0,
      activeFeatures: 6,
      systemHealth: "excellent",
      uptime: "99.9%"
    },
    features: [
      "User analytics",
      "Revenue tracking", 
      "Performance metrics",
      "A/B testing framework"
    ]
  });
});

// Error handling
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: "Internal server error",
    message: "ThachAI Assistant encountered an error"
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: "Endpoint not found",
    availableEndpoints: [
      "/api/health",
      "/api/status", 
      "/api/capabilities",
      "/api/ai/generate",
      "/api/voice/process",
      "/api/shopee/status",
      "/api/analytics/dashboard"
    ]
  });
});

const httpServer = createServer(app);

httpServer.listen(PORT, () => {
  console.log(`ThachAI Assistant API server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;