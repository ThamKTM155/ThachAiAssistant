/**
 * Microsoft Bot Framework Integration for ThachAI
 * Supports Azure Bot Service, Teams, and Cortana
 */

const { ActivityHandler, MessageFactory, CardFactory, ActionTypes } = require('botbuilder');
const { LuisRecognizer } = require('botbuilder-ai');
const axios = require('axios');

class ThachAIBot extends ActivityHandler {
    constructor() {
        super();
        
        // LUIS recognizer for natural language understanding
        this.luisRecognizer = new LuisRecognizer({
            applicationId: process.env.LUIS_APP_ID,
            endpointKey: process.env.LUIS_API_KEY,
            endpoint: process.env.LUIS_ENDPOINT
        });
        
        this.apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
        
        // Handle message activities
        this.onMessage(async (context, next) => {
            const userMessage = context.activity.text;
            
            try {
                // Recognize intent using LUIS
                const luisResult = await this.luisRecognizer.recognize(context);
                const intent = LuisRecognizer.topIntent(luisResult);
                const entities = luisResult.entities;
                
                let responseText = '';
                let adaptiveCard = null;
                
                switch (intent) {
                    case 'CreateTikTokContent':
                        const response = await this.handleTikTokCreation(entities);
                        responseText = response.text;
                        adaptiveCard = response.card;
                        break;
                        
                    case 'CheckShopeePrice':
                        const shopeeResponse = await this.handleShopeeCheck(entities);
                        responseText = shopeeResponse.text;
                        adaptiveCard = shopeeResponse.card;
                        break;
                        
                    case 'SendMessage':
                        responseText = await this.handleSendMessage(entities);
                        break;
                        
                    case 'GetWeather':
                        responseText = await this.handleWeatherRequest();
                        break;
                        
                    case 'GetNews':
                        const newsResponse = await this.handleNewsRequest();
                        responseText = newsResponse.text;
                        adaptiveCard = newsResponse.card;
                        break;
                        
                    case 'Help':
                        responseText = this.getHelpMessage();
                        adaptiveCard = this.getHelpCard();
                        break;
                        
                    default:
                        responseText = await this.handleGeneralQuery(userMessage);
                        break;
                }
                
                // Send response
                if (adaptiveCard) {
                    await context.sendActivity(MessageFactory.attachment(adaptiveCard));
                }
                
                await context.sendActivity(MessageFactory.text(responseText));
                
            } catch (error) {
                console.error('Bot error:', error);
                await context.sendActivity(MessageFactory.text('Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.'));
            }
            
            await next();
        });
        
        // Handle members added
        this.onMembersAdded(async (context, next) => {
            const membersAdded = context.activity.membersAdded;
            const welcomeText = 'Chào mừng đến với Thạch AI! Tôi có thể giúp bạn tạo nội dung TikTok, theo dõi giá Shopee, gửi tin nhắn và nhiều việc khác. Hãy nói "trợ giúp" để xem các tính năng.';
            
            for (let cnt = 0; cnt < membersAdded.length; ++cnt) {
                if (membersAdded[cnt].id !== context.activity.recipient.id) {
                    await context.sendActivity(MessageFactory.text(welcomeText));
                    await context.sendActivity(MessageFactory.attachment(this.getWelcomeCard()));
                }
            }
            
            await next();
        });
    }
    
    async handleTikTokCreation(entities) {
        try {
            const topic = this.extractEntity(entities, 'topic') || 'xu hướng hiện tại';
            const audience = this.extractEntity(entities, 'audience') || 'gen-z';
            
            const response = await axios.post(`${this.apiBaseUrl}/api/tiktok/generate-content`, {
                topic: topic,
                category: 'general',
                duration: 30,
                audience: audience,
                style: 'viral'
            });
            
            if (response.status === 200) {
                const data = response.data;
                const text = `✅ Script TikTok viral đã tạo thành công!\n\n**Chủ đề:** ${topic}\n**Viral Score:** ${data.viral_score}/100\n**Dự kiến views:** ${data.estimated_views}\n\n**Script preview:** ${data.script.substring(0, 200)}...`;
                
                const card = this.createTikTokCard(data, topic);
                
                return { text, card };
            } else {
                return { text: 'Không thể tạo script TikTok lúc này. Vui lòng thử lại sau.' };
            }
        } catch (error) {
            console.error('TikTok creation error:', error);
            return { text: 'Dịch vụ TikTok Creator tạm thời không khả dụng.' };
        }
    }
    
    async handleShopeeCheck(entities) {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/api/shopee/monitored-products`);
            
            if (response.status === 200) {
                const data = response.data;
                const products = data.products || [];
                const activeAlerts = data.active_alerts || 0;
                
                let text = `📊 **Shopee Price Monitor**\n\n`;
                text += `🔍 Đang theo dõi: **${products.length}** sản phẩm\n`;
                text += `🚨 Cảnh báo hoạt động: **${activeAlerts}** alerts\n\n`;
                
                if (products.length > 0) {
                    text += `**Sản phẩm gần nhất:**\n`;
                    const latest = products[0];
                    text += `• ${latest.name}\n`;
                    text += `• Giá: ${latest.price.toLocaleString('vi-VN')}đ\n`;
                    text += `• Giảm giá: ${latest.discount}%`;
                }
                
                const card = this.createShopeeCard(products, activeAlerts);
                
                return { text, card };
            } else {
                return { text: 'Không thể truy cập dữ liệu Shopee lúc này.' };
            }
        } catch (error) {
            console.error('Shopee check error:', error);
            return { text: 'Dịch vụ Shopee Monitor tạm thời không khả dụng.' };
        }
    }
    
    async handleSendMessage(entities) {
        const platform = this.extractEntity(entities, 'platform') || 'email';
        const content = this.extractEntity(entities, 'messageContent');
        
        if (!content) {
            return `Bạn muốn gửi nội dung gì qua ${platform}? Vui lòng cung cấp nội dung tin nhắn.`;
        }
        
        const platformNames = {
            'email': 'Email',
            'sms': 'SMS',
            'telegram': 'Telegram',
            'zalo': 'Zalo'
        };
        
        const platformName = platformNames[platform.toLowerCase()] || platform;
        return `📧 Tin nhắn đã được chuẩn bị gửi qua ${platformName}. Vui lòng xác nhận trong ứng dụng để hoàn tất gửi tin nhắn.`;
    }
    
    async handleWeatherRequest() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/api/data/latest`);
            
            if (response.status === 200) {
                const weather = response.data.weather || {};
                return `🌤️ **Thời tiết TP.HCM:**\n• Nhiệt độ: ${weather.temperature}°C\n• Độ ẩm: ${weather.humidity}%\n• Gió: ${weather.windSpeed} km/h\n• Tình trạng: ${weather.condition}`;
            } else {
                return 'Không thể lấy thông tin thời tiết lúc này.';
            }
        } catch (error) {
            console.error('Weather request error:', error);
            return 'Dịch vụ thời tiết tạm thời không khả dụng.';
        }
    }
    
    async handleNewsRequest() {
        try {
            const response = await axios.get(`${this.apiBaseUrl}/api/data/latest`);
            
            if (response.status === 200) {
                const news = response.data.news || [];
                
                if (news.length > 0) {
                    const latest = news[0];
                    const text = `📰 **Tin tức mới nhất:**\n\n**${latest.title}**\n\n${latest.description}\n\n*Nguồn: ${latest.source}*`;
                    
                    const card = this.createNewsCard(news);
                    
                    return { text, card };
                } else {
                    return { text: 'Hiện tại chưa có tin tức mới.' };
                }
            } else {
                return { text: 'Không thể truy cập tin tức lúc này.' };
            }
        } catch (error) {
            console.error('News request error:', error);
            return { text: 'Dịch vụ tin tức tạm thời không khả dụng.' };
        }
    }
    
    async handleGeneralQuery(message) {
        try {
            const response = await axios.post(`${this.apiBaseUrl}/api/ai/voice-command`, {
                transcript: message,
                confidence: 0.9,
                language: 'vi'
            });
            
            if (response.status === 200) {
                return response.data.response;
            } else {
                return 'Tôi là Thạch AI, trợ lý thông minh của bạn. Tôi có thể giúp tạo nội dung TikTok, theo dõi giá Shopee, gửi tin nhắn và nhiều việc khác.';
            }
        } catch (error) {
            console.error('General query error:', error);
            return 'Xin chào! Tôi là Thạch AI, sẵn sàng hỗ trợ bạn với các tác vụ sáng tạo và kinh doanh.';
        }
    }
    
    getHelpMessage() {
        return `🤖 **Thạch AI - Trợ lý thông minh**\n\n**Tôi có thể giúp bạn:**\n\n🎬 Tạo nội dung TikTok viral\n🛒 Theo dõi giá sản phẩm Shopee\n📱 Gửi tin nhắn đa nền tảng\n🌤️ Kiểm tra thời tiết\n📰 Đọc tin tức mới nhất\n\n**Ví dụ lệnh:**\n• "Tạo video về công nghệ"\n• "Kiểm tra giá iPhone"\n• "Gửi email"\n• "Thời tiết hôm nay"`;
    }
    
    // Adaptive Card creators
    createTikTokCard(data, topic) {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "🎬 TikTok Script Created",
                    "weight": "Bolder",
                    "size": "Medium"
                },
                {
                    "type": "FactSet",
                    "facts": [
                        {
                            "title": "Topic:",
                            "value": topic
                        },
                        {
                            "title": "Viral Score:",
                            "value": `${data.viral_score}/100`
                        },
                        {
                            "title": "Estimated Views:",
                            "value": data.estimated_views
                        }
                    ]
                }
            ],
            "actions": [
                {
                    "type": "Action.OpenUrl",
                    "title": "Open TikTok Creator",
                    "url": `${this.apiBaseUrl}/tiktok`
                }
            ]
        });
    }
    
    createShopeeCard(products, activeAlerts) {
        const facts = [
            {
                "title": "Products Monitored:",
                "value": products.length.toString()
            },
            {
                "title": "Active Alerts:",
                "value": activeAlerts.toString()
            }
        ];
        
        if (products.length > 0) {
            const latest = products[0];
            facts.push({
                "title": "Latest Product:",
                "value": latest.name
            });
            facts.push({
                "title": "Price:",
                "value": `${latest.price.toLocaleString('vi-VN')}đ`
            });
        }
        
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "🛒 Shopee Price Monitor",
                    "weight": "Bolder",
                    "size": "Medium"
                },
                {
                    "type": "FactSet",
                    "facts": facts
                }
            ],
            "actions": [
                {
                    "type": "Action.OpenUrl",
                    "title": "Open Shopee Monitor",
                    "url": `${this.apiBaseUrl}/shopee`
                }
            ]
        });
    }
    
    createNewsCard(news) {
        const columns = news.slice(0, 3).map(item => ({
            "type": "Column",
            "width": "stretch",
            "items": [
                {
                    "type": "TextBlock",
                    "text": item.title,
                    "weight": "Bolder",
                    "size": "Small",
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "text": item.source,
                    "size": "Small",
                    "color": "Accent"
                }
            ]
        }));
        
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "📰 Latest News",
                    "weight": "Bolder",
                    "size": "Medium"
                },
                {
                    "type": "ColumnSet",
                    "columns": columns
                }
            ]
        });
    }
    
    getWelcomeCard() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "🤖 Thạch AI Assistant",
                    "weight": "Bolder",
                    "size": "Large"
                },
                {
                    "type": "TextBlock",
                    "text": "Trợ lý AI thông minh cho content creator và doanh nhân",
                    "wrap": true
                },
                {
                    "type": "TextBlock",
                    "text": "✨ **Main Features:**",
                    "weight": "Bolder"
                },
                {
                    "type": "TextBlock",
                    "text": "• TikTok viral content creation\n• Shopee price monitoring\n• Multi-platform messaging\n• Weather & news updates",
                    "wrap": true
                }
            ],
            "actions": [
                {
                    "type": "Action.Submit",
                    "title": "Create TikTok Content",
                    "data": {
                        "action": "create_tiktok"
                    }
                },
                {
                    "type": "Action.Submit",
                    "title": "Check Shopee Prices",
                    "data": {
                        "action": "check_shopee"
                    }
                }
            ]
        });
    }
    
    getHelpCard() {
        return CardFactory.adaptiveCard({
            "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
            "type": "AdaptiveCard",
            "version": "1.2",
            "body": [
                {
                    "type": "TextBlock",
                    "text": "🆘 How to Use Thạch AI",
                    "weight": "Bolder",
                    "size": "Medium"
                },
                {
                    "type": "TextBlock",
                    "text": "**Example Commands:**",
                    "weight": "Bolder"
                },
                {
                    "type": "TextBlock",
                    "text": "• \"Tạo video về công nghệ\"\n• \"Kiểm tra giá iPhone\"\n• \"Gửi email cho khách hàng\"\n• \"Thời tiết hôm nay\"\n• \"Tin tức mới nhất\"",
                    "wrap": true
                }
            ]
        });
    }
    
    extractEntity(entities, entityName) {
        const entity = entities[entityName];
        if (entity && entity.length > 0) {
            return entity[0];
        }
        return null;
    }
}

module.exports.ThachAIBot = ThachAIBot;