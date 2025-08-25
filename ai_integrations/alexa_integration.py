"""
Amazon Alexa Integration for ThachAI
Supports Alexa Skills Kit and Voice User Interface
"""

import json
import logging
from typing import Dict, Any, Optional
from flask import Flask, request, jsonify
from flask_ask import Ask, statement, question, session
import requests
import os
from datetime import datetime

class AlexaSkillHandler:
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.api_base_url = "http://localhost:5000"
        
    def create_response(self, output_speech: str, card_title: str = None, card_content: str = None, 
                       reprompt_text: str = None, should_end_session: bool = True) -> Dict[str, Any]:
        """Create Alexa response format"""
        response = {
            "version": "1.0",
            "response": {
                "outputSpeech": {
                    "type": "PlainText",
                    "text": output_speech
                },
                "shouldEndSession": should_end_session
            }
        }
        
        if card_title and card_content:
            response["response"]["card"] = {
                "type": "Simple",
                "title": card_title,
                "content": card_content
            }
            
        if reprompt_text:
            response["response"]["reprompt"] = {
                "outputSpeech": {
                    "type": "PlainText",
                    "text": reprompt_text
                }
            }
            
        return response
    
    def handle_launch_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Alexa skill launch"""
        welcome_text = ("Chào mừng đến với Thạch AI! Tôi có thể giúp bạn tạo nội dung TikTok viral, "
                       "theo dõi giá Shopee, gửi tin nhắn, và nhiều việc khác. Bạn cần giúp gì?")
        
        return self.create_response(
            output_speech=welcome_text,
            card_title="Thạch AI Assistant",
            card_content="Trợ lý AI thông minh cho content creator và doanh nhân",
            reprompt_text="Bạn có thể nói 'tạo video TikTok', 'kiểm tra giá Shopee', hoặc 'gửi tin nhắn'",
            should_end_session=False
        )
    
    def handle_intent_request(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle Alexa intent requests"""
        intent = request_data.get("request", {}).get("intent", {})
        intent_name = intent.get("name", "")
        slots = intent.get("slots", {})
        
        # Extract slot values
        topic = slots.get("Topic", {}).get("value", "")
        product = slots.get("Product", {}).get("value", "")
        platform = slots.get("Platform", {}).get("value", "")
        message_content = slots.get("MessageContent", {}).get("value", "")
        
        try:
            if intent_name == "CreateTikTokIntent":
                return self.handle_tiktok_creation(topic)
            elif intent_name == "CheckShopeeIntent":
                return self.handle_shopee_check(product)
            elif intent_name == "SendMessageIntent":
                return self.handle_send_message(platform, message_content)
            elif intent_name == "GetWeatherIntent":
                return self.handle_weather_request()
            elif intent_name == "GetNewsIntent":
                return self.handle_news_request()
            elif intent_name == "AMAZON.HelpIntent":
                return self.handle_help_intent()
            elif intent_name == "AMAZON.StopIntent" or intent_name == "AMAZON.CancelIntent":
                return self.handle_stop_intent()
            else:
                return self.handle_fallback_intent()
        except Exception as e:
            self.logger.error(f"Intent handling error: {str(e)}")
            return self.create_response("Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.")
    
    def handle_tiktok_creation(self, topic: str) -> Dict[str, Any]:
        """Handle TikTok content creation request"""
        if not topic:
            topic = "xu hướng hiện tại"
            
        try:
            response = requests.post(f"{self.api_base_url}/api/tiktok/generate-content", 
                json={
                    "topic": topic,
                    "category": "general",
                    "duration": 30,
                    "audience": "gen-z",
                    "style": "viral"
                }, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                viral_score = data.get("viral_score", 0)
                estimated_views = data.get("estimated_views", "N/A")
                
                output_text = (f"Đã tạo thành công script TikTok cho chủ đề '{topic}'. "
                              f"Điểm viral: {viral_score}/100, dự kiến {estimated_views} lượt xem. "
                              f"Script đã được lưu trong ứng dụng.")
                
                card_content = f"Chủ đề: {topic}\nViral Score: {viral_score}/100\nDự kiến views: {estimated_views}"
                
                return self.create_response(
                    output_speech=output_text,
                    card_title="TikTok Script Created",
                    card_content=card_content
                )
            else:
                return self.create_response("Không thể tạo script TikTok lúc này. Vui lòng thử lại sau.")
                
        except requests.RequestException:
            return self.create_response("Kết nối đến dịch vụ TikTok Creator gặp sự cố. Vui lòng thử lại.")
    
    def handle_shopee_check(self, product: str) -> Dict[str, Any]:
        """Handle Shopee price checking request"""
        try:
            response = requests.get(f"{self.api_base_url}/api/shopee/monitored-products", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                products = data.get("products", [])
                active_alerts = data.get("active_alerts", 0)
                
                if products:
                    latest_product = products[0]
                    output_text = (f"Đang theo dõi {len(products)} sản phẩm trên Shopee. "
                                  f"Sản phẩm mới nhất: {latest_product.get('name', 'N/A')} "
                                  f"giá {latest_product.get('price', 0):,}đ. "
                                  f"Có {active_alerts} cảnh báo giá đang hoạt động.")
                else:
                    output_text = "Chưa có sản phẩm nào được theo dõi. Bạn có thể thêm sản phẩm trong ứng dụng."
                
                return self.create_response(
                    output_speech=output_text,
                    card_title="Shopee Price Monitor",
                    card_content=f"Monitoring: {len(products)} products\nActive alerts: {active_alerts}"
                )
            else:
                return self.create_response("Không thể truy cập dữ liệu Shopee lúc này.")
                
        except requests.RequestException:
            return self.create_response("Dịch vụ Shopee Monitor tạm thời không khả dụng.")
    
    def handle_send_message(self, platform: str, content: str) -> Dict[str, Any]:
        """Handle message sending request"""
        if not platform:
            return self.create_response(
                "Bạn muốn gửi tin nhắn qua nền tảng nào? Email, SMS, Telegram, hay Zalo?",
                should_end_session=False
            )
        
        if not content:
            return self.create_response(
                f"Bạn muốn gửi nội dung gì qua {platform}?",
                should_end_session=False
            )
        
        # Simulate message sending
        platforms = {
            "email": "Email",
            "sms": "SMS", 
            "telegram": "Telegram",
            "zalo": "Zalo"
        }
        
        platform_name = platforms.get(platform.lower(), platform)
        output_text = f"Tin nhắn đã được chuẩn bị gửi qua {platform_name}. Vui lòng xác nhận trong ứng dụng."
        
        return self.create_response(
            output_speech=output_text,
            card_title="Message Ready",
            card_content=f"Platform: {platform_name}\nContent: {content[:100]}..."
        )
    
    def handle_weather_request(self) -> Dict[str, Any]:
        """Handle weather information request"""
        try:
            response = requests.get(f"{self.api_base_url}/api/data/latest", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                weather = data.get("weather", {})
                
                temp = weather.get("temperature", "N/A")
                humidity = weather.get("humidity", "N/A")
                wind_speed = weather.get("windSpeed", "N/A")
                
                output_text = (f"Thời tiết TP Hồ Chí Minh: {temp} độ C, "
                              f"độ ẩm {humidity}%, gió {wind_speed} km/h.")
                
                return self.create_response(
                    output_speech=output_text,
                    card_title="Weather Update",
                    card_content=f"Temperature: {temp}°C\nHumidity: {humidity}%\nWind: {wind_speed} km/h"
                )
            else:
                return self.create_response("Không thể lấy thông tin thời tiết lúc này.")
                
        except requests.RequestException:
            return self.create_response("Dịch vụ thời tiết tạm thời không khả dụng.")
    
    def handle_news_request(self) -> Dict[str, Any]:
        """Handle news request"""
        try:
            response = requests.get(f"{self.api_base_url}/api/data/latest", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                news_items = data.get("news", [])
                
                if news_items:
                    latest_news = news_items[0]
                    output_text = f"Tin tức mới nhất: {latest_news.get('title', '')}. {latest_news.get('description', '')[:100]}..."
                    
                    return self.create_response(
                        output_speech=output_text,
                        card_title="Latest News",
                        card_content=latest_news.get('title', '')
                    )
                else:
                    return self.create_response("Hiện tại chưa có tin tức mới.")
            else:
                return self.create_response("Không thể truy cập tin tức lúc này.")
                
        except requests.RequestException:
            return self.create_response("Dịch vụ tin tức tạm thời không khả dụng.")
    
    def handle_help_intent(self) -> Dict[str, Any]:
        """Handle help request"""
        help_text = ("Tôi có thể giúp bạn: Tạo nội dung TikTok viral, theo dõi giá Shopee, "
                    "gửi tin nhắn đa nền tảng, kiểm tra thời tiết và tin tức. "
                    "Hãy nói 'tạo video về công nghệ' hoặc 'kiểm tra giá điện thoại'.")
        
        return self.create_response(
            output_speech=help_text,
            card_title="Thạch AI Help",
            card_content="Available commands:\n- Create TikTok content\n- Check Shopee prices\n- Send messages\n- Get weather\n- Get news",
            reprompt_text="Bạn muốn tôi giúp gì?",
            should_end_session=False
        )
    
    def handle_stop_intent(self) -> Dict[str, Any]:
        """Handle stop/cancel request"""
        return self.create_response("Tạm biệt! Hẹn gặp lại bạn.")
    
    def handle_fallback_intent(self) -> Dict[str, Any]:
        """Handle unrecognized intents"""
        fallback_text = ("Tôi chưa hiểu yêu cầu của bạn. Bạn có thể nói 'tạo video TikTok', "
                        "'kiểm tra giá Shopee', 'gửi tin nhắn', hoặc 'trợ giúp'.")
        
        return self.create_response(
            output_speech=fallback_text,
            reprompt_text="Bạn cần tôi giúp gì?",
            should_end_session=False
        )

# Flask app for Alexa skill
app = Flask(__name__)
alexa_handler = AlexaSkillHandler()

@app.route("/alexa/webhook", methods=["POST"])
def alexa_webhook():
    """Alexa skill webhook endpoint"""
    request_data = request.get_json()
    request_type = request_data.get("request", {}).get("type", "")
    
    if request_type == "LaunchRequest":
        response = alexa_handler.handle_launch_request(request_data)
    elif request_type == "IntentRequest":
        response = alexa_handler.handle_intent_request(request_data)
    elif request_type == "SessionEndedRequest":
        response = alexa_handler.create_response("Tạm biệt!")
    else:
        response = alexa_handler.handle_fallback_intent()
    
    return jsonify(response)

@app.route("/alexa/health", methods=["GET"])
def alexa_health():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "alexa-skill"})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8002, debug=True)