# ThachAI Multi-Platform Assistant Deployment Guide

## Platform Overview

The ThachAI Assistant supports four major platforms with comprehensive Vietnamese language optimization:

### 1. Google Assistant Integration
- **Language**: Python with Flask
- **Features**: Actions on Google, Dialogflow NLU, Vietnamese voice commands
- **Port**: 8001
- **Endpoint**: `/google-assistant/webhook`

### 2. Amazon Alexa Integration  
- **Language**: Python with Flask
- **Features**: Alexa Skills Kit, Voice User Interface, custom intents
- **Port**: 8002
- **Endpoint**: `/alexa/webhook`

### 3. Microsoft Bot Framework
- **Language**: JavaScript/Node.js
- **Features**: Teams integration, Cortana, Adaptive Cards, LUIS NLU
- **Port**: Embedded in 8003
- **Endpoint**: `/microsoft-bot`

### 4. Custom Platform Integration
- **Language**: Python with FastAPI
- **Features**: WebSocket support, REST API, custom capabilities, session management
- **Port**: 8000
- **Endpoint**: Multiple endpoints under `/`

### 5. Multi-Platform Manager
- **Language**: JavaScript/Node.js  
- **Features**: Platform orchestration, analytics, health monitoring, unified API
- **Port**: 8003
- **Endpoint**: `/ai/process` (universal endpoint)

## Quick Start Deployment

### Prerequisites
```bash
# Python 3.9+ and Node.js 18+
python --version  # 3.9+
node --version    # 18+
npm --version     # 9+
```

### Environment Configuration
Create `.env` file in `ai_integrations/` directory:
```bash
# Core API
API_BASE_URL=http://localhost:5000

# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Amazon Alexa
ALEXA_SKILL_ID=your-skill-id
ALEXA_CLIENT_ID=your-client-id
ALEXA_CLIENT_SECRET=your-client-secret

# Microsoft Bot Framework
MICROSOFT_APP_ID=your-app-id
MICROSOFT_APP_PASSWORD=your-app-password
LUIS_APP_ID=your-luis-app-id
LUIS_API_KEY=your-luis-key
LUIS_ENDPOINT=https://your-region.api.cognitive.microsoft.com

# Custom Platform
CUSTOM_PLATFORM_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

### Installation Steps

1. **Install Python Dependencies**
```bash
cd ai_integrations
pip install -r requirements.txt
```

2. **Install Node.js Dependencies** 
```bash
npm install
```

3. **Start All Services**
```bash
# Option 1: Start all platforms simultaneously
npm run start-all

# Option 2: Start individual platforms
python google_assistant_integration.py &
python alexa_integration.py &  
python custom_platform_integration.py &
node platform_manager.js
```

## Platform-Specific Setup

### Google Assistant Setup

1. **Create Google Cloud Project**
   - Enable Dialogflow API
   - Create service account and download JSON key
   - Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable

2. **Configure Dialogflow Agent**
   - Create new agent in Dialogflow Console
   - Import Vietnamese language pack
   - Set webhook URL: `https://your-domain.com/google-assistant`

3. **Test Integration**
```bash
curl -X POST http://localhost:8001/google-assistant/webhook \
  -H "Content-Type: application/json" \
  -d '{"queryResult":{"queryText":"Tạo video TikTok về công nghệ"}}'
```

### Amazon Alexa Setup

1. **Create Alexa Skill**
   - Go to Alexa Developer Console
   - Create Custom Skill with Vietnamese language
   - Configure interaction model with intents

2. **Sample Intent Schema**
```json
{
  "intents": [
    {
      "name": "CreateTikTokIntent",
      "slots": [
        {"name": "Topic", "type": "AMAZON.SearchQuery"}
      ],
      "samples": ["tạo video về {Topic}", "làm TikTok về {Topic}"]
    },
    {
      "name": "CheckShopeeIntent", 
      "slots": [
        {"name": "Product", "type": "AMAZON.SearchQuery"}
      ],
      "samples": ["kiểm tra giá {Product}", "xem giá {Product} trên Shopee"]
    }
  ]
}
```

3. **Set Webhook Endpoint**: `https://your-domain.com/alexa`

### Microsoft Bot Framework Setup

1. **Create Azure Bot Resource**
   - Register bot in Azure Portal
   - Get App ID and Password
   - Configure LUIS application

2. **LUIS Configuration**
   - Create LUIS app with Vietnamese language
   - Train with Vietnamese intents and entities
   - Publish to production slot

3. **Teams Integration**
   - Add bot to Teams App Studio
   - Configure messaging endpoint
   - Deploy to Teams store

### Custom Platform Configuration

1. **API Capabilities**
   - Vietnamese NLP processing
   - Content generation (TikTok, YouTube)
   - E-commerce price monitoring
   - Multi-platform messaging
   - Business analytics

2. **WebSocket Support**
   - Real-time communication
   - Session management
   - Background processing

## Production Deployment

### Docker Configuration
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  thachai-platforms:
    build: .
    ports:
      - "8000-8003:8000-8003"
    environment:
      - NODE_ENV=production
      - PYTHON_ENV=production
    volumes:
      - ./config:/app/config
    depends_on:
      - redis
      - postgres

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: thachai
      POSTGRES_USER: thachai  
      POSTGRES_PASSWORD: secure_password
```

### Nginx Configuration
```nginx
upstream thachai_platforms {
    server localhost:8003;
}

server {
    listen 443 ssl;
    server_name api.thachai.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://thachai_platforms;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## API Usage Examples

### Universal AI Processing Endpoint
```javascript
const response = await fetch('http://localhost:8003/ai/process', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    platform: 'custom_platform',
    input: {
      text: 'Tạo nội dung TikTok về AI',
      capability: 'content_generation',
      data: {
        platform: 'tiktok',
        topic: 'artificial intelligence',
        style: 'viral'
      }
    },
    session_id: 'user-session-123'
  })
});
```

### Google Assistant Integration
```python
import requests

webhook_data = {
    "queryResult": {
        "queryText": "Kiểm tra giá iPhone trên Shopee",
        "intent": {"displayName": "CheckShopeeIntent"},
        "parameters": {"product": "iPhone"}
    }
}

response = requests.post(
    'http://localhost:8001/google-assistant/webhook',
    json=webhook_data
)
```

### WebSocket Real-time Communication
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/session-123');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'ai_request',
    capability_id: 'vietnamese_nlp',
    data: { text: 'Phân tích tình cảm của văn bản này' }
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('AI Response:', response);
};
```

## Monitoring and Analytics

### Health Check Endpoints
- Platform Manager: `GET http://localhost:8003/health`
- Google Assistant: `GET http://localhost:8001/google-assistant/health`
- Alexa: `GET http://localhost:8002/alexa/health`
- Custom Platform: `GET http://localhost:8000/`

### Analytics Dashboard
Access comprehensive analytics at `http://localhost:8003/analytics`:
- Request volume and response times
- Platform usage statistics
- Error rates and health metrics
- User session analytics

### Performance Metrics
- Average response time: <200ms
- Uptime target: 99.9%
- Concurrent users: 1000+
- Multi-language support: Vietnamese, English

## Troubleshooting

### Common Issues
1. **Platform Connection Errors**: Check network connectivity and API keys
2. **Vietnamese Text Processing**: Verify language models are properly loaded
3. **WebSocket Disconnections**: Implement reconnection logic in clients
4. **High Memory Usage**: Configure proper garbage collection for Node.js/Python

### Debug Mode
Enable debug logging:
```bash
DEBUG=true npm start
PYTHONDONTWRITEBYTECODE=1 python custom_platform_integration.py
```

### Log Locations
- Platform Manager: `logs/platform-manager.log`
- Python Services: `logs/python-services.log`
- Error Logs: `logs/errors.log`

## Security Considerations

### Authentication
- JWT tokens for API authentication
- OAuth 2.0 for platform integrations
- Rate limiting: 100 requests/minute per IP

### Data Protection
- HTTPS encryption for all endpoints
- Personal data anonymization
- GDPR compliance for EU users
- Vietnamese data protection compliance

### Network Security
- Firewall configuration for ports 8000-8003
- VPN access for administrative functions
- Regular security audits and updates

## Scaling Recommendations

### Horizontal Scaling
- Load balancer across multiple instances
- Redis cluster for session management
- Database read replicas
- CDN for static assets

### Performance Optimization
- Response caching for frequent requests
- Database query optimization
- WebSocket connection pooling
- Memory management tuning

This deployment guide provides comprehensive setup instructions for all platform integrations with production-ready configurations and Vietnamese market optimization.