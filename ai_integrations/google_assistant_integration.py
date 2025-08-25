"""
Google Assistant Integration for ThachAI
Supports Actions on Google and Google Assistant SDK
"""

import json
import logging
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from google.cloud import dialogflow
from google.protobuf.json_format import MessageToDict
import requests
import os

class GoogleAssistantHandler:
    def __init__(self, project_id: str, language_code: str = "vi"):
        self.project_id = project_id
        self.language_code = language_code
        self.session_client = dialogflow.SessionsClient()
        self.logger = logging.getLogger(__name__)
        
    def create_session_path(self, session_id: str) -> str:
        """Create session path for Dialogflow"""
        return self.session_client.session_path(self.project_id, session_id)
    
    def detect_intent(self, session_id: str, text_input: str) -> Dict[str, Any]:
        """Detect intent from user input using Dialogflow"""
        try:
            session = self.create_session_path(session_id)
            text_input_obj = dialogflow.TextInput(text=text_input, language_code=self.language_code)
            query_input = dialogflow.QueryInput(text=text_input_obj)
            
            response = self.session_client.detect_intent(
                request={"session": session, "query_input": query_input}
            )
            
            return {
                "query_text": response.query_result.query_text,
                "intent_name": response.query_result.intent.display_name,
                "confidence": response.query_result.intent_detection_confidence,
                "fulfillment_text": response.query_result.fulfillment_text,
                "parameters": MessageToDict(response.query_result.parameters),
                "language_code": response.query_result.language_code
            }
        except Exception as e:
            self.logger.error(f"Intent detection error: {str(e)}")
            return {"error": str(e)}
    
    def handle_webhook(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Google Assistant webhook requests"""
        try:
            intent_name = request_data.get("queryResult", {}).get("intent", {}).get("displayName", "")
            query_text = request_data.get("queryResult", {}).get("queryText", "")
            parameters = request_data.get("queryResult", {}).get("parameters", {})
            
            # Process different intents
            if "tiktok" in intent_name.lower() or "video" in query_text.lower():
                response_text = self.handle_tiktok_intent(parameters)
            elif "shopee" in intent_name.lower() or "giá" in query_text.lower():
                response_text = self.handle_shopee_intent(parameters)
            elif "tin nhắn" in query_text.lower() or "gửi" in query_text.lower():
                response_text = self.handle_messaging_intent(parameters)
            elif "thời tiết" in query_text.lower():
                response_text = self.handle_weather_intent(parameters)
            else:
                response_text = self.handle_general_intent(query_text, parameters)
            
            return {
                "fulfillmentText": response_text,
                "fulfillmentMessages": [
                    {
                        "text": {
                            "text": [response_text]
                        }
                    }
                ],
                "source": "ThachAI-GoogleAssistant"
            }
        except Exception as e:
            self.logger.error(f"Webhook handling error: {str(e)}")
            return {
                "fulfillmentText": "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.",
                "source": "ThachAI-GoogleAssistant"
            }
    
    def handle_tiktok_intent(self, parameters: Dict[str, Any]) -> str:
        """Handle TikTok content creation requests"""
        topic = parameters.get("topic", "trending")
        audience = parameters.get("audience", "gen-z")
        
        try:
            # Call TikTok Creator API
            response = requests.post("http://localhost:5000/api/tiktok/generate-content", 
                json={
                    "topic": topic,
                    "category": "general",
                    "duration": 30,
                    "audience": audience,
                    "style": "viral"
                })
            
            if response.status_code == 200:
                data = response.json()
                return f"Tôi đã tạo script TikTok viral cho chủ đề '{topic}' với điểm viral {data.get('viral_score', 0)}/100. Script: {data.get('script', '')[:150]}..."
            else:
                return "Tôi sẽ giúp bạn tạo nội dung TikTok viral. Hãy mở ứng dụng để xem chi tiết."
        except:
            return "Tôi sẽ hỗ trợ tạo nội dung TikTok cho bạn. Vui lòng truy cập TikTok Creator Studio."
    
    def handle_shopee_intent(self, parameters: Dict[str, Any]) -> str:
        """Handle Shopee price monitoring requests"""
        product = parameters.get("product", "")
        
        try:
            # Call Shopee Monitor API
            response = requests.get("http://localhost:5000/api/shopee/monitored-products")
            
            if response.status_code == 200:
                data = response.json()
                products_count = len(data.get("products", []))
                return f"Hiện tại đang theo dõi {products_count} sản phẩm trên Shopee. Có {data.get('active_alerts', 0)} cảnh báo giá đang hoạt động."
            else:
                return "Tôi sẽ giúp bạn theo dõi giá sản phẩm trên Shopee."
        except:
            return "Shopee Price Monitor đang sẵn sàng giúp bạn theo dõi giá cả sản phẩm."
    
    def handle_messaging_intent(self, parameters: Dict[str, Any]) -> str:
        """Handle messaging requests"""
        platform = parameters.get("platform", "email")
        return f"Tôi có thể giúp bạn gửi tin nhắn qua {platform}. Bạn muốn gửi tin nhắn gì?"
    
    def handle_weather_intent(self, parameters: Dict[str, Any]) -> str:
        """Handle weather requests"""
        try:
            response = requests.get("http://localhost:5000/api/data/latest")
            if response.status_code == 200:
                data = response.json()
                weather = data.get("weather", {})
                return f"Thời tiết TP.HCM: {weather.get('temperature', 'N/A')}°C, độ ẩm {weather.get('humidity', 'N/A')}%, gió {weather.get('windSpeed', 'N/A')} km/h."
            else:
                return "Hiện tại không thể lấy thông tin thời tiết. Vui lòng thử lại sau."
        except:
            return "Dịch vụ thời tiết tạm thời không khả dụng."
    
    def handle_general_intent(self, query_text: str, parameters: Dict[str, Any]) -> str:
        """Handle general queries"""
        try:
            # Call AI processing API
            response = requests.post("http://localhost:5000/api/ai/voice-command",
                json={
                    "transcript": query_text,
                    "confidence": 0.9,
                    "language": "vi"
                })
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "Tôi đã hiểu yêu cầu của bạn.")
            else:
                return "Tôi là Thạch AI, trợ lý thông minh của bạn. Tôi có thể giúp tạo nội dung TikTok, theo dõi giá Shopee, gửi tin nhắn và nhiều việc khác."
        except:
            return "Xin chào! Tôi là Thạch AI, sẵn sàng hỗ trợ bạn với các tác vụ sáng tạo và kinh doanh."

# Flask app for Google Assistant webhook
app = Flask(__name__)
google_handler = GoogleAssistantHandler(
    project_id=os.getenv("GOOGLE_CLOUD_PROJECT_ID", "thachai-assistant")
)

@app.route("/google-assistant/webhook", methods=["POST"])
def google_webhook():
    """Google Assistant webhook endpoint"""
    request_data = request.get_json()
    response = google_handler.handle_webhook(request_data)
    return jsonify(response)

@app.route("/google-assistant/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "google-assistant"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8001, debug=True)