/**
 * Multi-Platform AI Assistant Manager
 * Orchestrates Google Assistant, Alexa, Microsoft Bot Framework, and Custom Platforms
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const WebSocket = require('ws');
const { ThachAIBot } = require('./microsoft_bot_framework');

class MultiPlatformManager {
    constructor() {
        this.app = express();
        this.setupMiddleware();
        this.setupRoutes();
        
        // Platform configurations
        this.platforms = {
            google_assistant: {
                enabled: true,
                endpoint: 'http://localhost:8001',
                capabilities: ['voice', 'text', 'actions']
            },
            alexa: {
                enabled: true,
                endpoint: 'http://localhost:8002',
                capabilities: ['voice', 'cards', 'skills']
            },
            microsoft_bot: {
                enabled: true,
                bot: new ThachAIBot(),
                capabilities: ['text', 'cards', 'teams', 'cortana']
            },
            custom_platform: {
                enabled: true,
                endpoint: 'http://localhost:8000',
                capabilities: ['websocket', 'api', 'custom_integrations']
            }
        };
        
        // Analytics and monitoring
        this.analytics = {
            requests: 0,
            platforms_used: {},
            response_times: [],
            errors: []
        };
        
        this.logger = console;
    }
    
    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Request logging
        this.app.use((req, res, next) => {
            this.analytics.requests++;
            req.startTime = Date.now();
            this.logger.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
            next();
        });
        
        // Response time tracking
        this.app.use((req, res, next) => {
            res.on('finish', () => {
                const responseTime = Date.now() - req.startTime;
                this.analytics.response_times.push(responseTime);
                
                // Keep only last 1000 response times
                if (this.analytics.response_times.length > 1000) {
                    this.analytics.response_times.shift();
                }
            });
            next();
        });
    }
    
    setupRoutes() {
        // Health check and status
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                platforms: this.getPlatformStatus(),
                analytics: this.getAnalyticsSummary(),
                timestamp: new Date().toISOString()
            });
        });
        
        // Universal AI processing endpoint
        this.app.post('/ai/process', async (req, res) => {
            try {
                const { platform, input, session_id, capabilities } = req.body;
                
                if (!platform || !input) {
                    return res.status(400).json({
                        error: 'Platform and input are required',
                        required_fields: ['platform', 'input']
                    });
                }
                
                // Route to appropriate platform
                const result = await this.routeToPlatform(platform, input, session_id, capabilities);
                
                // Track platform usage
                this.analytics.platforms_used[platform] = (this.analytics.platforms_used[platform] || 0) + 1;
                
                res.json({
                    success: true,
                    platform,
                    result,
                    session_id,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                this.analytics.errors.push({
                    error: error.message,
                    timestamp: new Date().toISOString(),
                    platform: req.body.platform
                });
                
                res.status(500).json({
                    error: 'Processing failed',
                    details: error.message
                });
            }
        });
        
        // Google Assistant webhook
        this.app.post('/google-assistant', async (req, res) => {
            try {
                const response = await axios.post(
                    `${this.platforms.google_assistant.endpoint}/google-assistant/webhook`,
                    req.body
                );
                res.json(response.data);
            } catch (error) {
                this.handlePlatformError('google_assistant', error, res);
            }
        });
        
        // Alexa skill webhook
        this.app.post('/alexa', async (req, res) => {
            try {
                const response = await axios.post(
                    `${this.platforms.alexa.endpoint}/alexa/webhook`,
                    req.body
                );
                res.json(response.data);
            } catch (error) {
                this.handlePlatformError('alexa', error, res);
            }
        });
        
        // Microsoft Bot Framework endpoint
        this.app.post('/microsoft-bot', async (req, res) => {
            try {
                // Create mock context for bot framework
                const context = {
                    activity: req.body,
                    sendActivity: (activity) => {
                        res.json({
                            type: 'message',
                            text: activity.text || activity.attachments?.[0]?.content?.body?.[0]?.text
                        });
                    }
                };
                
                await this.platforms.microsoft_bot.bot.onMessage(async (context, next) => {
                    await this.platforms.microsoft_bot.bot.onMessage(context, next);
                })(context, async () => {});
                
            } catch (error) {
                this.handlePlatformError('microsoft_bot', error, res);
            }
        });
        
        // Custom platform proxy
        this.app.all('/custom-platform/*', async (req, res) => {
            try {
                const path = req.path.replace('/custom-platform', '');
                const url = `${this.platforms.custom_platform.endpoint}${path}`;
                
                const response = await axios({
                    method: req.method,
                    url,
                    data: req.body,
                    params: req.query,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                res.json(response.data);
            } catch (error) {
                this.handlePlatformError('custom_platform', error, res);
            }
        });
        
        // Platform capabilities endpoint
        this.app.get('/platforms/capabilities', (req, res) => {
            const capabilities = {};
            
            for (const [name, config] of Object.entries(this.platforms)) {
                capabilities[name] = {
                    enabled: config.enabled,
                    capabilities: config.capabilities,
                    status: this.checkPlatformHealth(name)
                };
            }
            
            res.json({ capabilities });
        });
        
        // Analytics endpoint
        this.app.get('/analytics', (req, res) => {
            res.json({
                analytics: this.getDetailedAnalytics(),
                platforms: this.analytics.platforms_used,
                timestamp: new Date().toISOString()
            });
        });
        
        // Batch processing endpoint
        this.app.post('/ai/batch', async (req, res) => {
            try {
                const { requests } = req.body;
                
                if (!Array.isArray(requests)) {
                    return res.status(400).json({
                        error: 'Requests must be an array'
                    });
                }
                
                const results = await Promise.allSettled(
                    requests.map(request => 
                        this.routeToP latform(
                            request.platform,
                            request.input,
                            request.session_id,
                            request.capabilities
                        )
                    )
                );
                
                res.json({
                    success: true,
                    results: results.map((result, index) => ({
                        index,
                        status: result.status,
                        result: result.status === 'fulfilled' ? result.value : null,
                        error: result.status === 'rejected' ? result.reason.message : null
                    }))
                });
                
            } catch (error) {
                res.status(500).json({
                    error: 'Batch processing failed',
                    details: error.message
                });
            }
        });
    }
    
    async routeToP latform(platform, input, sessionId, capabilities) {
        const platformConfig = this.platforms[platform];
        
        if (!platformConfig || !platformConfig.enabled) {
            throw new Error(`Platform ${platform} not available`);
        }
        
        switch (platform) {
            case 'google_assistant':
                return await this.processGoogleAssistant(input, sessionId);
                
            case 'alexa':
                return await this.processAlexa(input, sessionId);
                
            case 'microsoft_bot':
                return await this.processMicrosoftBot(input, sessionId);
                
            case 'custom_platform':
                return await this.processCustomPlatform(input, sessionId, capabilities);
                
            default:
                throw new Error(`Unknown platform: ${platform}`);
        }
    }
    
    async processGoogleAssistant(input, sessionId) {
        const requestData = {
            queryResult: {
                queryText: input.text || input.query || '',
                intent: { displayName: input.intent || 'Default Welcome Intent' },
                parameters: input.parameters || {}
            }
        };
        
        const response = await axios.post(
            `${this.platforms.google_assistant.endpoint}/google-assistant/webhook`,
            requestData
        );
        
        return {
            platform: 'google_assistant',
            response: response.data.fulfillmentText,
            data: response.data
        };
    }
    
    async processAlexa(input, sessionId) {
        const requestData = {
            request: {
                type: 'IntentRequest',
                intent: {
                    name: input.intent || 'DefaultIntent',
                    slots: input.slots || {}
                }
            },
            session: {
                sessionId: sessionId || 'session-' + Date.now()
            }
        };
        
        const response = await axios.post(
            `${this.platforms.alexa.endpoint}/alexa/webhook`,
            requestData
        );
        
        return {
            platform: 'alexa',
            response: response.data.response?.outputSpeech?.text,
            data: response.data
        };
    }
    
    async processMicrosoftBot(input, sessionId) {
        // Create activity for bot framework
        const activity = {
            type: 'message',
            text: input.text || input.message || '',
            from: { id: 'user-' + (sessionId || Date.now()) },
            recipient: { id: 'thachai-bot' },
            conversation: { id: sessionId || 'conv-' + Date.now() }
        };
        
        // Simulate bot processing
        const bot = this.platforms.microsoft_bot.bot;
        let response = '';
        
        // Mock context
        const context = {
            activity,
            sendActivity: (activity) => {
                response = activity.text || JSON.stringify(activity);
            }
        };
        
        return {
            platform: 'microsoft_bot',
            response,
            data: { activity, response }
        };
    }
    
    async processCustomPlatform(input, sessionId, capabilities) {
        const requestData = {
            session_id: sessionId || 'session-' + Date.now(),
            capability_id: input.capability || 'vietnamese_nlp',
            input_data: input.data || input,
            async_processing: false
        };
        
        const response = await axios.post(
            `${this.platforms.custom_platform.endpoint}/ai/process`,
            requestData
        );
        
        return {
            platform: 'custom_platform',
            response: response.data.result,
            data: response.data
        };
    }
    
    handlePlatformError(platform, error, res) {
        this.analytics.errors.push({
            platform,
            error: error.message,
            timestamp: new Date().toISOString()
        });
        
        this.logger.error(`Platform ${platform} error:`, error.message);
        
        res.status(500).json({
            error: `Platform ${platform} unavailable`,
            details: error.message,
            fallback: 'Switching to alternative processing'
        });
    }
    
    checkPlatformHealth(platformName) {
        const platform = this.platforms[platformName];
        
        if (!platform.enabled) {
            return 'disabled';
        }
        
        // Simple health check based on recent errors
        const recentErrors = this.analytics.errors.filter(
            error => error.platform === platformName &&
            Date.now() - new Date(error.timestamp).getTime() < 300000 // 5 minutes
        );
        
        if (recentErrors.length > 5) {
            return 'unhealthy';
        } else if (recentErrors.length > 0) {
            return 'degraded';
        } else {
            return 'healthy';
        }
    }
    
    getPlatformStatus() {
        const status = {};
        
        for (const [name, config] of Object.entries(this.platforms)) {
            status[name] = {
                enabled: config.enabled,
                health: this.checkPlatformHealth(name),
                capabilities: config.capabilities
            };
        }
        
        return status;
    }
    
    getAnalyticsSummary() {
        const avgResponseTime = this.analytics.response_times.length > 0
            ? this.analytics.response_times.reduce((a, b) => a + b, 0) / this.analytics.response_times.length
            : 0;
        
        return {
            total_requests: this.analytics.requests,
            average_response_time: Math.round(avgResponseTime),
            platforms_used: Object.keys(this.analytics.platforms_used).length,
            recent_errors: this.analytics.errors.filter(
                error => Date.now() - new Date(error.timestamp).getTime() < 3600000 // 1 hour
            ).length
        };
    }
    
    getDetailedAnalytics() {
        const responseTimeStats = this.analytics.response_times.length > 0 ? {
            min: Math.min(...this.analytics.response_times),
            max: Math.max(...this.analytics.response_times),
            avg: this.analytics.response_times.reduce((a, b) => a + b, 0) / this.analytics.response_times.length,
            count: this.analytics.response_times.length
        } : null;
        
        return {
            requests: this.analytics.requests,
            platforms_used: this.analytics.platforms_used,
            response_times: responseTimeStats,
            errors: {
                total: this.analytics.errors.length,
                recent: this.analytics.errors.filter(
                    error => Date.now() - new Date(error.timestamp).getTime() < 3600000
                ).length,
                by_platform: this.analytics.errors.reduce((acc, error) => {
                    acc[error.platform] = (acc[error.platform] || 0) + 1;
                    return acc;
                }, {})
            }
        };
    }
    
    start(port = 8003) {
        this.app.listen(port, () => {
            this.logger.log(`🚀 Multi-Platform AI Manager started on port ${port}`);
            this.logger.log(`📊 Health endpoint: http://localhost:${port}/health`);
            this.logger.log(`🤖 AI processing: http://localhost:${port}/ai/process`);
            this.logger.log(`📈 Analytics: http://localhost:${port}/analytics`);
        });
    }
}

// Export for use
module.exports = { MultiPlatformManager };

// Start server if run directly
if (require.main === module) {
    const manager = new MultiPlatformManager();
    manager.start(8003);
}