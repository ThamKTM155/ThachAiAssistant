"""
Custom Platform Integration for ThachAI
Multi-language support with Python backend and JavaScript frontend
"""

import asyncio
import websockets
import json
import logging
from typing import Dict, Any, List, Optional, Callable
from dataclasses import dataclass, asdict
from datetime import datetime
import uuid
from enum import Enum
import threading
import queue
import time
from fastapi import FastAPI, WebSocket, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import requests

# Platform types and capabilities
class PlatformType(Enum):
    WEB = "web"
    MOBILE = "mobile"
    DESKTOP = "desktop"
    IOT = "iot"
    VOICE = "voice"
    CHAT = "chat"

class CapabilityType(Enum):
    TEXT_PROCESSING = "text_processing"
    VOICE_RECOGNITION = "voice_recognition"
    IMAGE_ANALYSIS = "image_analysis"
    DATA_ANALYSIS = "data_analysis"
    AUTOMATION = "automation"
    MESSAGING = "messaging"

@dataclass
class AICapability:
    id: str
    name: str
    type: CapabilityType
    enabled: bool
    config: Dict[str, Any]
    processing_function: Optional[Callable] = None

@dataclass
class PlatformSession:
    session_id: str
    platform_type: PlatformType
    user_id: str
    capabilities: List[str]
    context: Dict[str, Any]
    created_at: datetime
    last_activity: datetime

class CustomAIPlatform:
    def __init__(self):
        self.app = FastAPI(title="ThachAI Custom Platform", version="1.0.0")
        self.setup_cors()
        self.setup_routes()
        
        # Session management
        self.active_sessions: Dict[str, PlatformSession] = {}
        self.capabilities: Dict[str, AICapability] = {}
        self.message_queue = queue.Queue()
        
        # WebSocket connections
        self.websocket_connections: Dict[str, WebSocket] = {}
        
        # Background processing
        self.is_running = False
        self.background_thread = None
        
        # Initialize built-in capabilities
        self.register_capabilities()
        self.logger = logging.getLogger(__name__)
    
    def setup_cors(self):
        """Setup CORS middleware"""
        self.app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )
    
    def register_capabilities(self):
        """Register built-in AI capabilities"""
        capabilities = [
            AICapability(
                id="vietnamese_nlp",
                name="Vietnamese Natural Language Processing",
                type=CapabilityType.TEXT_PROCESSING,
                enabled=True,
                config={"language": "vi", "model": "custom"},
                processing_function=self.process_vietnamese_text
            ),
            AICapability(
                id="content_generation",
                name="Content Generation",
                type=CapabilityType.TEXT_PROCESSING,
                enabled=True,
                config={"platforms": ["tiktok", "youtube", "facebook"]},
                processing_function=self.generate_content
            ),
            AICapability(
                id="price_monitoring",
                name="E-commerce Price Monitoring",
                type=CapabilityType.DATA_ANALYSIS,
                enabled=True,
                config={"platforms": ["shopee", "tiki", "lazada"]},
                processing_function=self.monitor_prices
            ),
            AICapability(
                id="voice_command",
                name="Voice Command Processing",
                type=CapabilityType.VOICE_RECOGNITION,
                enabled=True,
                config={"languages": ["vi", "en"], "confidence_threshold": 0.8},
                processing_function=self.process_voice_command
            ),
            AICapability(
                id="multi_messaging",
                name="Multi-Platform Messaging",
                type=CapabilityType.MESSAGING,
                enabled=True,
                config={"platforms": ["email", "sms", "telegram", "zalo"]},
                processing_function=self.send_multi_platform_message
            ),
            AICapability(
                id="business_analytics",
                name="Business Intelligence Analytics",
                type=CapabilityType.DATA_ANALYSIS,
                enabled=True,
                config={"sources": ["shopee", "social_media", "news", "weather"]},
                processing_function=self.analyze_business_data
            )
        ]
        
        for capability in capabilities:
            self.capabilities[capability.id] = capability
    
    def setup_routes(self):
        """Setup FastAPI routes"""
        
        @self.app.get("/")
        async def root():
            return {
                "service": "ThachAI Custom Platform",
                "version": "1.0.0",
                "status": "running",
                "capabilities": len(self.capabilities),
                "active_sessions": len(self.active_sessions)
            }
        
        @self.app.post("/session/create")
        async def create_session(request: CreateSessionRequest):
            session_id = str(uuid.uuid4())
            session = PlatformSession(
                session_id=session_id,
                platform_type=PlatformType(request.platform_type),
                user_id=request.user_id,
                capabilities=request.capabilities,
                context=request.context or {},
                created_at=datetime.now(),
                last_activity=datetime.now()
            )
            
            self.active_sessions[session_id] = session
            
            return {
                "session_id": session_id,
                "status": "created",
                "available_capabilities": list(self.capabilities.keys()),
                "platform_type": request.platform_type
            }
        
        @self.app.post("/ai/process")
        async def process_ai_request(request: AIProcessRequest, background_tasks: BackgroundTasks):
            if request.session_id not in self.active_sessions:
                raise HTTPException(status_code=404, detail="Session not found")
            
            session = self.active_sessions[request.session_id]
            session.last_activity = datetime.now()
            
            # Process the request
            result = await self.process_ai_capability(
                capability_id=request.capability_id,
                input_data=request.input_data,
                session=session
            )
            
            # Queue for background processing if needed
            if request.async_processing:
                background_tasks.add_task(
                    self.background_process_task,
                    request.capability_id,
                    request.input_data,
                    session
                )
            
            return result
        
        @self.app.websocket("/ws/{session_id}")
        async def websocket_endpoint(websocket: WebSocket, session_id: str):
            await websocket.accept()
            self.websocket_connections[session_id] = websocket
            
            try:
                while True:
                    data = await websocket.receive_text()
                    message = json.loads(data)
                    
                    # Process WebSocket message
                    response = await self.handle_websocket_message(session_id, message)
                    await websocket.send_text(json.dumps(response))
                    
            except Exception as e:
                self.logger.error(f"WebSocket error: {str(e)}")
            finally:
                if session_id in self.websocket_connections:
                    del self.websocket_connections[session_id]
        
        @self.app.get("/capabilities")
        async def get_capabilities():
            return {
                "capabilities": [
                    {
                        "id": cap.id,
                        "name": cap.name,
                        "type": cap.type.value,
                        "enabled": cap.enabled,
                        "config": cap.config
                    }
                    for cap in self.capabilities.values()
                ]
            }
        
        @self.app.get("/sessions")
        async def get_active_sessions():
            return {
                "active_sessions": len(self.active_sessions),
                "sessions": [
                    {
                        "session_id": session.session_id,
                        "platform_type": session.platform_type.value,
                        "user_id": session.user_id,
                        "created_at": session.created_at.isoformat(),
                        "last_activity": session.last_activity.isoformat()
                    }
                    for session in self.active_sessions.values()
                ]
            }
    
    async def process_ai_capability(self, capability_id: str, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Process AI capability request"""
        if capability_id not in self.capabilities:
            raise HTTPException(status_code=404, detail="Capability not found")
        
        capability = self.capabilities[capability_id]
        
        if not capability.enabled:
            raise HTTPException(status_code=403, detail="Capability disabled")
        
        try:
            # Call the processing function
            if capability.processing_function:
                result = await capability.processing_function(input_data, session)
            else:
                result = await self.default_processor(capability_id, input_data, session)
            
            return {
                "success": True,
                "capability_id": capability_id,
                "result": result,
                "session_id": session.session_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Capability processing error: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "capability_id": capability_id,
                "session_id": session.session_id
            }
    
    async def handle_websocket_message(self, session_id: str, message: Dict[str, Any]) -> Dict[str, Any]:
        """Handle WebSocket messages"""
        if session_id not in self.active_sessions:
            return {"error": "Session not found"}
        
        session = self.active_sessions[session_id]
        message_type = message.get("type", "")
        
        if message_type == "ai_request":
            return await self.process_ai_capability(
                capability_id=message.get("capability_id"),
                input_data=message.get("data", {}),
                session=session
            )
        elif message_type == "ping":
            return {"type": "pong", "timestamp": datetime.now().isoformat()}
        else:
            return {"error": "Unknown message type"}
    
    # AI Processing Functions
    async def process_vietnamese_text(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Process Vietnamese text with NLP"""
        text = input_data.get("text", "")
        task = input_data.get("task", "intent")
        
        try:
            # Call existing NLP API
            response = requests.post("http://localhost:5000/api/ai/voice-command", 
                json={
                    "transcript": text,
                    "confidence": 0.9,
                    "language": "vi"
                })
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "intent": data.get("intent", "unknown"),
                    "response": data.get("response", ""),
                    "actions": data.get("actions", []),
                    "processing_time": data.get("processing_time", 0)
                }
            else:
                return {"error": "NLP service unavailable"}
                
        except Exception as e:
            return {"error": f"NLP processing failed: {str(e)}"}
    
    async def generate_content(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Generate content for various platforms"""
        platform = input_data.get("platform", "tiktok")
        topic = input_data.get("topic", "")
        style = input_data.get("style", "viral")
        
        if platform == "tiktok":
            try:
                response = requests.post("http://localhost:5000/api/tiktok/generate-content",
                    json={
                        "topic": topic,
                        "category": "general",
                        "duration": 30,
                        "audience": "gen-z",
                        "style": style
                    })
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": "Content generation failed"}
                    
            except Exception as e:
                return {"error": f"Content generation error: {str(e)}"}
        
        return {"error": "Platform not supported"}
    
    async def monitor_prices(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Monitor e-commerce prices"""
        platform = input_data.get("platform", "shopee")
        product_url = input_data.get("product_url", "")
        
        if platform == "shopee":
            try:
                response = requests.get("http://localhost:5000/api/shopee/monitored-products")
                
                if response.status_code == 200:
                    return response.json()
                else:
                    return {"error": "Price monitoring service unavailable"}
                    
            except Exception as e:
                return {"error": f"Price monitoring error: {str(e)}"}
        
        return {"error": "Platform not supported"}
    
    async def process_voice_command(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Process voice commands"""
        audio_data = input_data.get("audio", "")
        transcript = input_data.get("transcript", "")
        
        if transcript:
            return await self.process_vietnamese_text({"text": transcript, "task": "intent"}, session)
        else:
            return {"error": "No transcript provided"}
    
    async def send_multi_platform_message(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Send messages across multiple platforms"""
        platform = input_data.get("platform", "email")
        content = input_data.get("content", "")
        recipient = input_data.get("recipient", "")
        
        try:
            if platform == "email":
                response = requests.post("http://localhost:5000/api/messaging/send-email",
                    json={
                        "to": recipient,
                        "subject": input_data.get("subject", "Message from ThachAI"),
                        "content": content
                    })
            elif platform == "sms":
                response = requests.post("http://localhost:5000/api/messaging/send-sms",
                    json={
                        "phone": recipient,
                        "content": content
                    })
            elif platform == "telegram":
                response = requests.post("http://localhost:5000/api/messaging/send-telegram",
                    json={
                        "chatId": recipient,
                        "content": content
                    })
            elif platform == "zalo":
                response = requests.post("http://localhost:5000/api/messaging/send-zalo",
                    json={
                        "userId": recipient,
                        "content": content
                    })
            else:
                return {"error": "Platform not supported"}
            
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": "Message sending failed"}
                
        except Exception as e:
            return {"error": f"Messaging error: {str(e)}"}
    
    async def analyze_business_data(self, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Analyze business intelligence data"""
        data_source = input_data.get("source", "all")
        
        try:
            response = requests.get("http://localhost:5000/api/data/latest")
            
            if response.status_code == 200:
                data = response.json()
                
                analysis = {
                    "news_insights": self.analyze_news_sentiment(data.get("news", [])),
                    "market_trends": self.analyze_stock_trends(data.get("stocks", [])),
                    "social_engagement": self.analyze_social_media(data.get("social", [])),
                    "weather_impact": data.get("weather", {}),
                    "timestamp": datetime.now().isoformat()
                }
                
                return analysis
            else:
                return {"error": "Data source unavailable"}
                
        except Exception as e:
            return {"error": f"Business analysis error: {str(e)}"}
    
    def analyze_news_sentiment(self, news: List[Dict]) -> Dict[str, Any]:
        """Analyze sentiment of news articles"""
        if not news:
            return {"sentiment": "neutral", "articles": 0}
        
        positive_keywords = ["tăng", "phát triển", "thành công", "tích cực", "cải thiện"]
        negative_keywords = ["giảm", "khó khăn", "thất bại", "tiêu cực", "khủng hoảng"]
        
        sentiment_score = 0
        for article in news:
            title = article.get("title", "").lower()
            description = article.get("description", "").lower()
            
            for keyword in positive_keywords:
                if keyword in title or keyword in description:
                    sentiment_score += 1
            
            for keyword in negative_keywords:
                if keyword in title or keyword in description:
                    sentiment_score -= 1
        
        if sentiment_score > 0:
            sentiment = "positive"
        elif sentiment_score < 0:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": sentiment_score,
            "articles": len(news),
            "confidence": min(abs(sentiment_score) / len(news), 1.0) if news else 0
        }
    
    def analyze_stock_trends(self, stocks: List[Dict]) -> Dict[str, Any]:
        """Analyze stock market trends"""
        if not stocks:
            return {"trend": "neutral", "stocks": 0}
        
        positive_changes = sum(1 for stock in stocks if stock.get("change", 0) > 0)
        negative_changes = sum(1 for stock in stocks if stock.get("change", 0) < 0)
        
        if positive_changes > negative_changes:
            trend = "bullish"
        elif negative_changes > positive_changes:
            trend = "bearish"
        else:
            trend = "neutral"
        
        avg_change = sum(stock.get("change", 0) for stock in stocks) / len(stocks) if stocks else 0
        
        return {
            "trend": trend,
            "average_change": round(avg_change, 2),
            "positive_stocks": positive_changes,
            "negative_stocks": negative_changes,
            "total_stocks": len(stocks)
        }
    
    def analyze_social_media(self, social: List[Dict]) -> Dict[str, Any]:
        """Analyze social media engagement"""
        if not social:
            return {"engagement": "low", "posts": 0}
        
        total_engagement = sum(post.get("engagement", 0) for post in social)
        avg_engagement = total_engagement / len(social) if social else 0
        
        if avg_engagement > 1000:
            engagement_level = "high"
        elif avg_engagement > 500:
            engagement_level = "medium"
        else:
            engagement_level = "low"
        
        return {
            "engagement": engagement_level,
            "total_engagement": total_engagement,
            "average_engagement": round(avg_engagement, 0),
            "posts": len(social)
        }
    
    async def default_processor(self, capability_id: str, input_data: Dict[str, Any], session: PlatformSession) -> Dict[str, Any]:
        """Default processor for capabilities without specific functions"""
        return {
            "message": f"Capability {capability_id} processed successfully",
            "input_data": input_data,
            "session_id": session.session_id
        }
    
    async def background_process_task(self, capability_id: str, input_data: Dict[str, Any], session: PlatformSession):
        """Background processing task"""
        await asyncio.sleep(1)  # Simulate processing time
        result = await self.process_ai_capability(capability_id, input_data, session)
        
        # Send result via WebSocket if connected
        if session.session_id in self.websocket_connections:
            websocket = self.websocket_connections[session.session_id]
            await websocket.send_text(json.dumps({
                "type": "background_result",
                "result": result
            }))
    
    def start_server(self, host: str = "0.0.0.0", port: int = 8000):
        """Start the custom platform server"""
        self.is_running = True
        uvicorn.run(self.app, host=host, port=port)
    
    def stop_server(self):
        """Stop the custom platform server"""
        self.is_running = False

# Pydantic models for API requests
class CreateSessionRequest(BaseModel):
    platform_type: str
    user_id: str
    capabilities: List[str]
    context: Optional[Dict[str, Any]] = None

class AIProcessRequest(BaseModel):
    session_id: str
    capability_id: str
    input_data: Dict[str, Any]
    async_processing: bool = False

# Main execution
if __name__ == "__main__":
    platform = CustomAIPlatform()
    platform.start_server(host="0.0.0.0", port=8000)