/**
 * Multi-Platform AI Assistant Integration for ThachAI
 * Seamless integration with Google Assistant, Alexa, Microsoft Bot Framework, and custom platforms
 */

import OpenAI from 'openai';
import { voiceProcessingEngine } from './voice-processing';
import { contentAutomationEngine } from './content-automation';
import { ecommerceEngine } from './ecommerce-integration';
import { analyticsEngine } from './analytics-engine';

export interface PlatformCapability {
  id: string;
  name: string;
  type: 'voice' | 'text' | 'multimodal';
  supported: boolean;
  features: string[];
  apiEndpoint?: string;
  authRequired: boolean;
}

export interface AISession {
  sessionId: string;
  platform: 'google_assistant' | 'alexa' | 'microsoft_bot' | 'custom' | 'web';
  userId: string;
  language: 'vi' | 'en';
  context: Record<string, any>;
  capabilities: string[];
  createdAt: Date;
  lastActivity: Date;
  conversationHistory: ConversationTurn[];
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  userInput: string;
  assistantResponse: string;
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  platform: string;
  executedActions: string[];
}

export interface GoogleAssistantPayload {
  queryResult: {
    queryText: string;
    languageCode: string;
    intent: {
      displayName: string;
    };
    parameters: Record<string, any>;
  };
  session: string;
}

export interface AlexaRequest {
  version: string;
  session: {
    sessionId: string;
    user: {
      userId: string;
    };
  };
  request: {
    type: string;
    intent?: {
      name: string;
      slots?: Record<string, any>;
    };
    locale: string;
  };
}

export interface MicrosoftBotActivity {
  type: string;
  id: string;
  from: {
    id: string;
    name: string;
  };
  conversation: {
    id: string;
  };
  text: string;
  locale: string;
  channelId: string;
}

export interface CustomPlatformRequest {
  platform: string;
  userId: string;
  input: string;
  inputType: 'text' | 'voice' | 'image';
  language: 'vi' | 'en';
  capabilities: string[];
  context?: Record<string, any>;
}

export class MultiPlatformAIEngine {
  private openai: OpenAI | null = null;
  private activeSessions: Map<string, AISession> = new Map();
  private platformCapabilities: Map<string, PlatformCapability> = new Map();
  private conversationHistory: Map<string, ConversationTurn[]> = new Map();

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    this.initializePlatformCapabilities();
  }

  private initializePlatformCapabilities() {
    const capabilities: PlatformCapability[] = [
      {
        id: 'google_assistant',
        name: 'Google Assistant',
        type: 'voice',
        supported: true,
        features: ['voice_recognition', 'text_to_speech', 'smart_home', 'actions_on_google'],
        apiEndpoint: 'https://dialogflow.googleapis.com/v2',
        authRequired: true
      },
      {
        id: 'alexa',
        name: 'Amazon Alexa',
        type: 'voice',
        supported: true,
        features: ['voice_recognition', 'text_to_speech', 'skills_kit', 'smart_home'],
        apiEndpoint: 'https://api.amazonalexa.com',
        authRequired: true
      },
      {
        id: 'microsoft_bot',
        name: 'Microsoft Bot Framework',
        type: 'multimodal',
        supported: true,
        features: ['text_chat', 'voice_recognition', 'teams_integration', 'adaptive_cards'],
        apiEndpoint: 'https://api.botframework.com',
        authRequired: true
      },
      {
        id: 'facebook_messenger',
        name: 'Facebook Messenger',
        type: 'text',
        supported: true,
        features: ['text_chat', 'quick_replies', 'persistent_menu', 'webview'],
        apiEndpoint: 'https://graph.facebook.com/v18.0',
        authRequired: true
      },
      {
        id: 'telegram',
        name: 'Telegram Bot',
        type: 'text',
        supported: true,
        features: ['text_chat', 'inline_keyboards', 'file_sharing', 'commands'],
        apiEndpoint: 'https://api.telegram.org/bot',
        authRequired: true
      },
      {
        id: 'web_interface',
        name: 'Web Interface',
        type: 'multimodal',
        supported: true,
        features: ['text_chat', 'voice_recognition', 'file_upload', 'real_time'],
        authRequired: false
      }
    ];

    capabilities.forEach(cap => {
      this.platformCapabilities.set(cap.id, cap);
    });
  }

  async createSession(
    platform: string, 
    userId: string, 
    language: 'vi' | 'en' = 'vi',
    capabilities: string[] = []
  ): Promise<{ sessionId: string; capabilities: string[] }> {
    const sessionId = `session_${platform}_${Date.now()}`;
    
    const session: AISession = {
      sessionId,
      platform: platform as any,
      userId,
      language,
      context: {},
      capabilities,
      createdAt: new Date(),
      lastActivity: new Date(),
      conversationHistory: []
    };

    this.activeSessions.set(sessionId, session);
    
    return {
      sessionId,
      capabilities: this.getPlatformCapabilities(platform)
    };
  }

  async processGoogleAssistantRequest(payload: GoogleAssistantPayload): Promise<{
    fulfillmentText: string;
    fulfillmentMessages: any[];
    source: string;
  }> {
    try {
      const sessionId = this.extractSessionId(payload.session);
      const userInput = payload.queryResult.queryText;
      const intent = payload.queryResult.intent.displayName;
      const language = payload.queryResult.languageCode.startsWith('vi') ? 'vi' : 'en';

      // Create or get session
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        const result = await this.createSession('google_assistant', 'google_user', language);
        session = this.activeSessions.get(result.sessionId)!;
      }

      // Process the request
      const response = await this.processAIRequest({
        sessionId: session.sessionId,
        userInput,
        intent,
        entities: payload.queryResult.parameters,
        platform: 'google_assistant',
        language
      });

      // Update session
      session.lastActivity = new Date();
      session.conversationHistory.push({
        id: `turn_${Date.now()}`,
        timestamp: new Date(),
        userInput,
        assistantResponse: response.text,
        intent,
        entities: payload.queryResult.parameters,
        confidence: response.confidence,
        platform: 'google_assistant',
        executedActions: response.actions || []
      });

      return {
        fulfillmentText: response.text,
        fulfillmentMessages: [
          {
            text: {
              text: [response.text]
            }
          }
        ],
        source: 'ThachAI'
      };
    } catch (error) {
      console.error('Google Assistant processing error:', error);
      return {
        fulfillmentText: language === 'vi' 
          ? 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn.'
          : 'Sorry, I encountered an issue processing your request.',
        fulfillmentMessages: [],
        source: 'ThachAI'
      };
    }
  }

  async processAlexaRequest(request: AlexaRequest): Promise<{
    version: string;
    response: {
      outputSpeech: {
        type: string;
        text: string;
      };
      card?: {
        type: string;
        title: string;
        content: string;
      };
      shouldEndSession: boolean;
    };
  }> {
    try {
      const sessionId = request.session.sessionId;
      const userId = request.session.user.userId;
      const language = request.request.locale.startsWith('vi') ? 'vi' : 'en';

      let userInput = '';
      let intent = '';

      if (request.request.type === 'IntentRequest' && request.request.intent) {
        intent = request.request.intent.name;
        userInput = this.extractUserInputFromIntent(intent, request.request.intent.slots);
      } else if (request.request.type === 'LaunchRequest') {
        intent = 'LaunchIntent';
        userInput = language === 'vi' ? 'Chào ThachAI' : 'Hello ThachAI';
      }

      // Create or get session
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        const result = await this.createSession('alexa', userId, language);
        session = this.activeSessions.get(result.sessionId)!;
      }

      // Process the request
      const response = await this.processAIRequest({
        sessionId: session.sessionId,
        userInput,
        intent,
        entities: request.request.intent?.slots || {},
        platform: 'alexa',
        language
      });

      // Update session
      session.lastActivity = new Date();
      session.conversationHistory.push({
        id: `turn_${Date.now()}`,
        timestamp: new Date(),
        userInput,
        assistantResponse: response.text,
        intent,
        entities: request.request.intent?.slots || {},
        confidence: response.confidence,
        platform: 'alexa',
        executedActions: response.actions || []
      });

      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: response.text
          },
          card: {
            type: 'Simple',
            title: 'ThachAI Assistant',
            content: response.text
          },
          shouldEndSession: intent === 'AMAZON.StopIntent' || intent === 'AMAZON.CancelIntent'
        }
      };
    } catch (error) {
      console.error('Alexa processing error:', error);
      return {
        version: '1.0',
        response: {
          outputSpeech: {
            type: 'PlainText',
            text: language === 'vi' 
              ? 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn.'
              : 'Sorry, I encountered an issue processing your request.'
          },
          shouldEndSession: true
        }
      };
    }
  }

  async processMicrosoftBotActivity(activity: MicrosoftBotActivity): Promise<{
    type: string;
    text: string;
    attachments?: any[];
    suggestedActions?: {
      actions: Array<{
        type: string;
        title: string;
        value: string;
      }>;
    };
  }> {
    try {
      const sessionId = activity.conversation.id;
      const userId = activity.from.id;
      const userInput = activity.text;
      const language = activity.locale?.startsWith('vi') ? 'vi' : 'en';

      // Create or get session
      let session = this.activeSessions.get(sessionId);
      if (!session) {
        const result = await this.createSession('microsoft_bot', userId, language);
        session = this.activeSessions.get(result.sessionId)!;
      }

      // Process the request
      const response = await this.processAIRequest({
        sessionId: session.sessionId,
        userInput,
        intent: 'GeneralIntent',
        entities: {},
        platform: 'microsoft_bot',
        language
      });

      // Update session
      session.lastActivity = new Date();
      session.conversationHistory.push({
        id: `turn_${Date.now()}`,
        timestamp: new Date(),
        userInput,
        assistantResponse: response.text,
        intent: 'GeneralIntent',
        entities: {},
        confidence: response.confidence,
        platform: 'microsoft_bot',
        executedActions: response.actions || []
      });

      // Generate suggested actions based on response
      const suggestedActions = this.generateSuggestedActions(response, language);

      return {
        type: 'message',
        text: response.text,
        suggestedActions
      };
    } catch (error) {
      console.error('Microsoft Bot processing error:', error);
      return {
        type: 'message',
        text: language === 'vi' 
          ? 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn.'
          : 'Sorry, I encountered an issue processing your request.'
      };
    }
  }

  async processCustomPlatformRequest(request: CustomPlatformRequest): Promise<{
    response: string;
    actions?: Array<{
      type: string;
      data: any;
    }>;
    metadata: {
      sessionId: string;
      confidence: number;
      processingTime: number;
      platform: string;
    };
  }> {
    const startTime = Date.now();

    try {
      // Create session for custom platform
      const sessionResult = await this.createSession(
        request.platform,
        request.userId,
        request.language,
        request.capabilities
      );

      // Process the request
      const response = await this.processAIRequest({
        sessionId: sessionResult.sessionId,
        userInput: request.input,
        intent: 'CustomIntent',
        entities: request.context || {},
        platform: request.platform,
        language: request.language
      });

      const processingTime = Date.now() - startTime;

      return {
        response: response.text,
        actions: response.actions?.map(action => ({
          type: action,
          data: response.actionData || {}
        })),
        metadata: {
          sessionId: sessionResult.sessionId,
          confidence: response.confidence,
          processingTime,
          platform: request.platform
        }
      };
    } catch (error) {
      console.error('Custom platform processing error:', error);
      return {
        response: request.language === 'vi' 
          ? 'Xin lỗi, tôi gặp sự cố khi xử lý yêu cầu của bạn.'
          : 'Sorry, I encountered an issue processing your request.',
        metadata: {
          sessionId: 'error_session',
          confidence: 0,
          processingTime: Date.now() - startTime,
          platform: request.platform
        }
      };
    }
  }

  private async processAIRequest(params: {
    sessionId: string;
    userInput: string;
    intent: string;
    entities: Record<string, any>;
    platform: string;
    language: 'vi' | 'en';
  }): Promise<{
    text: string;
    confidence: number;
    actions?: string[];
    actionData?: any;
  }> {
    const { userInput, intent, entities, platform, language } = params;

    // Determine the appropriate response based on intent and entities
    if (intent.toLowerCase().includes('content') || userInput.toLowerCase().includes('tạo nội dung')) {
      return await this.handleContentCreation(userInput, entities, language);
    }

    if (intent.toLowerCase().includes('price') || userInput.toLowerCase().includes('giá')) {
      return await this.handlePriceInquiry(userInput, entities, language);
    }

    if (intent.toLowerCase().includes('analytics') || userInput.toLowerCase().includes('thống kê')) {
      return await this.handleAnalyticsRequest(userInput, entities, language);
    }

    if (intent.toLowerCase().includes('voice') || userInput.toLowerCase().includes('giọng nói')) {
      return await this.handleVoiceRequest(userInput, entities, language);
    }

    // Default to general conversation
    return await this.handleGeneralConversation(userInput, language, platform);
  }

  private async handleContentCreation(input: string, entities: any, language: 'vi' | 'en'): Promise<any> {
    try {
      // Extract topic from input or entities
      const topic = entities.topic || this.extractTopicFromInput(input);
      const platform = entities.platform || 'youtube';

      // Generate content using the content automation engine
      const contentRequest = {
        topic,
        type: platform,
        language,
        tone: 'educational' as const,
        length: 'medium' as const
      };

      const generatedContent = await contentAutomationEngine.generateContent(contentRequest);

      return {
        text: language === 'vi' 
          ? `Đã tạo nội dung về "${topic}" cho ${platform}. Tiêu đề: "${generatedContent.title}". Nội dung có ${generatedContent.metadata.wordCount} từ với điểm SEO ${generatedContent.metadata.seoScore}/100.`
          : `Created content about "${topic}" for ${platform}. Title: "${generatedContent.title}". Content has ${generatedContent.metadata.wordCount} words with SEO score ${generatedContent.metadata.seoScore}/100.`,
        confidence: 0.9,
        actions: ['content_created'],
        actionData: {
          content: generatedContent,
          redirectUrl: '/content-automation'
        }
      };
    } catch (error) {
      return {
        text: language === 'vi' 
          ? 'Không thể tạo nội dung. Vui lòng thử lại.'
          : 'Unable to create content. Please try again.',
        confidence: 0.3
      };
    }
  }

  private async handlePriceInquiry(input: string, entities: any, language: 'vi' | 'en'): Promise<any> {
    try {
      // Extract product name from input or entities
      const productName = entities.product || this.extractProductFromInput(input);

      // Search for products
      const products = await ecommerceEngine.searchProducts(productName, undefined, 3);

      if (products.length > 0) {
        const product = products[0];
        const formattedPrice = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(product.currentPrice);

        return {
          text: language === 'vi' 
            ? `Tìm thấy "${product.name}" với giá ${formattedPrice} trên ${product.platform}. Đánh giá ${product.rating}/5 với ${product.reviewCount} đánh giá. Tình trạng: ${product.availability === 'in_stock' ? 'Còn hàng' : 'Hết hàng'}.`
            : `Found "${product.name}" for ${formattedPrice} on ${product.platform}. Rating ${product.rating}/5 with ${product.reviewCount} reviews. Status: ${product.availability === 'in_stock' ? 'In stock' : 'Out of stock'}.`,
          confidence: 0.9,
          actions: ['product_found'],
          actionData: {
            product,
            redirectUrl: '/ecommerce-hub'
          }
        };
      } else {
        return {
          text: language === 'vi' 
            ? `Không tìm thấy sản phẩm "${productName}". Vui lòng thử với từ khóa khác.`
            : `Product "${productName}" not found. Please try with different keywords.`,
          confidence: 0.6
        };
      }
    } catch (error) {
      return {
        text: language === 'vi' 
          ? 'Không thể kiểm tra giá. Vui lòng thử lại.'
          : 'Unable to check price. Please try again.',
        confidence: 0.3
      };
    }
  }

  private async handleAnalyticsRequest(input: string, entities: any, language: 'vi' | 'en'): Promise<any> {
    try {
      const dashboardData = await analyticsEngine.getDashboardData();

      return {
        text: language === 'vi' 
          ? `Dữ liệu analytics hiện tại: ${dashboardData.trending_keywords.length} từ khóa đang trending, xu hướng ${dashboardData.trend_velocity > 0 ? 'tăng' : 'giảm'} ${Math.abs(dashboardData.trend_velocity).toFixed(1)}%. Danh mục hàng đầu: ${dashboardData.top_category}. Dữ liệu được cập nhật ${dashboardData.data_freshness}.`
          : `Current analytics data: ${dashboardData.trending_keywords.length} trending keywords, trend ${dashboardData.trend_velocity > 0 ? 'increasing' : 'decreasing'} ${Math.abs(dashboardData.trend_velocity).toFixed(1)}%. Top category: ${dashboardData.top_category}. Data updated ${dashboardData.data_freshness}.`,
        confidence: 0.9,
        actions: ['analytics_retrieved'],
        actionData: {
          dashboardData,
          redirectUrl: '/analytics-dashboard'
        }
      };
    } catch (error) {
      return {
        text: language === 'vi' 
          ? 'Không thể lấy dữ liệu analytics. Vui lòng thử lại.'
          : 'Unable to retrieve analytics data. Please try again.',
        confidence: 0.3
      };
    }
  }

  private async handleVoiceRequest(input: string, entities: any, language: 'vi' | 'en'): Promise<any> {
    try {
      const analytics = await voiceProcessingEngine.getVoiceAnalytics();

      return {
        text: language === 'vi' 
          ? `Thống kê điều khiển giọng nói: ${analytics.totalCommands} lệnh đã xử lý, ${analytics.successfulRecognitions} thành công (${(analytics.successfulRecognitions/analytics.totalCommands*100).toFixed(1)}%). Độ tin cậy trung bình: ${(analytics.averageConfidence*100).toFixed(1)}%. Thời gian phản hồi trung bình: ${analytics.responseTime.average}s.`
          : `Voice control statistics: ${analytics.totalCommands} commands processed, ${analytics.successfulRecognitions} successful (${(analytics.successfulRecognitions/analytics.totalCommands*100).toFixed(1)}%). Average confidence: ${(analytics.averageConfidence*100).toFixed(1)}%. Average response time: ${analytics.responseTime.average}s.`,
        confidence: 0.9,
        actions: ['voice_analytics_retrieved'],
        actionData: {
          analytics,
          redirectUrl: '/voice-control-enhanced'
        }
      };
    } catch (error) {
      return {
        text: language === 'vi' 
          ? 'Không thể lấy thống kê giọng nói. Vui lòng thử lại.'
          : 'Unable to retrieve voice statistics. Please try again.',
        confidence: 0.3
      };
    }
  }

  private async handleGeneralConversation(input: string, language: 'vi' | 'en', platform: string): Promise<any> {
    if (this.openai) {
      try {
        const response = await this.openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: language === 'vi' 
                ? 'Bạn là ThachAI, trợ lý AI thông minh cho người Việt. Hãy trả lời ngắn gọn, hữu ích và thân thiện bằng tiếng Việt.'
                : 'You are ThachAI, an intelligent AI assistant. Provide concise, helpful, and friendly responses in English.'
            },
            {
              role: 'user',
              content: input
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        });

        return {
          text: response.choices[0].message.content || (
            language === 'vi' 
              ? 'Tôi hiểu. Bạn có cần hỗ trợ gì khác không?'
              : 'I understand. Is there anything else I can help you with?'
          ),
          confidence: 0.8
        };
      } catch (error) {
        console.error('OpenAI conversation error:', error);
      }
    }

    // Fallback responses
    const responses = {
      vi: [
        'Tôi hiểu rồi. Bạn có cần hỗ trợ tạo nội dung, kiểm tra giá, hoặc xem thống kê không?',
        'Cảm ơn bạn! Tôi có thể giúp bạn với việc tạo nội dung, theo dõi giá cả, hoặc phân tích dữ liệu.',
        'Được rồi. Tôi có thể hỗ trợ bạn tạo nội dung video, kiểm tra giá sản phẩm, hoặc xem báo cáo analytics.',
        'Tôi đã hiểu. Bạn muốn tôi giúp gì? Tạo nội dung, theo dõi giá, hay xem thống kê?'
      ],
      en: [
        'I understand. Do you need help with content creation, price checking, or analytics?',
        'Thank you! I can help you with content generation, price monitoring, or data analysis.',
        'Got it. I can assist you with creating video content, checking product prices, or viewing analytics reports.',
        'I understand. How can I help? Content creation, price tracking, or statistics?'
      ]
    };

    const responseList = responses[language];
    const randomResponse = responseList[Math.floor(Math.random() * responseList.length)];

    return {
      text: randomResponse,
      confidence: 0.7
    };
  }

  private extractSessionId(sessionPath: string): string {
    const parts = sessionPath.split('/');
    return parts[parts.length - 1];
  }

  private extractUserInputFromIntent(intentName: string, slots: any): string {
    // Convert intent and slots back to natural language
    if (intentName === 'CreateContentIntent') {
      const topic = slots?.topic?.value || 'nội dung mới';
      return `Tạo nội dung về ${topic}`;
    }
    if (intentName === 'CheckPriceIntent') {
      const product = slots?.product?.value || 'sản phẩm';
      return `Kiểm tra giá ${product}`;
    }
    return intentName.replace(/Intent$/, '').replace(/([A-Z])/g, ' $1').toLowerCase();
  }

  private extractTopicFromInput(input: string): string {
    const topics = input.match(/về\s+([^,.!?]+)|about\s+([^,.!?]+)/i);
    return topics ? (topics[1] || topics[2]).trim() : 'chủ đề chung';
  }

  private extractProductFromInput(input: string): string {
    const products = input.match(/giá\s+([^,.!?]+)|price\s+of\s+([^,.!?]+)/i);
    return products ? (products[1] || products[2]).trim() : 'sản phẩm';
  }

  private generateSuggestedActions(response: any, language: 'vi' | 'en'): any {
    const actions = {
      vi: [
        { type: 'imBack', title: 'Tạo nội dung', value: 'Tạo nội dung mới' },
        { type: 'imBack', title: 'Kiểm tra giá', value: 'Kiểm tra giá sản phẩm' },
        { type: 'imBack', title: 'Xem thống kê', value: 'Xem báo cáo analytics' },
        { type: 'imBack', title: 'Trợ giúp', value: 'Tôi cần trợ giúp' }
      ],
      en: [
        { type: 'imBack', title: 'Create Content', value: 'Create new content' },
        { type: 'imBack', title: 'Check Price', value: 'Check product price' },
        { type: 'imBack', title: 'View Analytics', value: 'View analytics report' },
        { type: 'imBack', title: 'Help', value: 'I need help' }
      ]
    };

    return {
      actions: actions[language]
    };
  }

  private getPlatformCapabilities(platform: string): string[] {
    const capability = this.platformCapabilities.get(platform);
    return capability ? capability.features : [];
  }

  async getActiveSessions(): Promise<AISession[]> {
    return Array.from(this.activeSessions.values())
      .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime());
  }

  async getSessionHistory(sessionId: string): Promise<ConversationTurn[]> {
    const session = this.activeSessions.get(sessionId);
    return session ? session.conversationHistory : [];
  }

  async getPlatformCapabilities(): Promise<PlatformCapability[]> {
    return Array.from(this.platformCapabilities.values());
  }

  async getIntegrationAnalytics(): Promise<{
    totalSessions: number;
    activeSessions: number;
    platformDistribution: Record<string, number>;
    averageSessionDuration: number;
    topIntents: Array<{ intent: string; count: number }>;
    successRate: number;
  }> {
    const sessions = Array.from(this.activeSessions.values());
    const now = new Date();
    const activeSessions = sessions.filter(s => 
      now.getTime() - s.lastActivity.getTime() < 30 * 60 * 1000 // Active in last 30 minutes
    );

    // Platform distribution
    const platformDistribution: Record<string, number> = {};
    sessions.forEach(session => {
      platformDistribution[session.platform] = (platformDistribution[session.platform] || 0) + 1;
    });

    // Calculate average session duration
    const durations = sessions.map(s => s.lastActivity.getTime() - s.createdAt.getTime());
    const averageSessionDuration = durations.length > 0 
      ? durations.reduce((a, b) => a + b, 0) / durations.length / 1000 / 60 // Convert to minutes
      : 0;

    // Top intents
    const intentCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.conversationHistory.forEach(turn => {
        intentCounts[turn.intent] = (intentCounts[turn.intent] || 0) + 1;
      });
    });

    const topIntents = Object.entries(intentCounts)
      .map(([intent, count]) => ({ intent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Success rate (based on confidence scores)
    const allTurns = sessions.flatMap(s => s.conversationHistory);
    const successRate = allTurns.length > 0
      ? allTurns.reduce((sum, turn) => sum + turn.confidence, 0) / allTurns.length
      : 0;

    return {
      totalSessions: sessions.length,
      activeSessions: activeSessions.length,
      platformDistribution,
      averageSessionDuration,
      topIntents,
      successRate
    };
  }

  async clearSession(sessionId: string): Promise<{ success: boolean }> {
    const deleted = this.activeSessions.delete(sessionId);
    this.conversationHistory.delete(sessionId);
    return { success: deleted };
  }
}

export const multiPlatformAI = new MultiPlatformAIEngine();