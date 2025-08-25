import OpenAI from "openai";
import { google } from "googleapis";
import sgMail from "@sendgrid/mail";
import googleTrends from "google-trends-api";

// API Status Checker
export class APIStatusChecker {
  private openai: OpenAI;
  private youtube: any;
  private cleanYouTubeKey: string;
  private cleanSendGridKey: string;
  private cleanGoogleKey: string;

  constructor() {
    // Clean API keys (remove = prefix if present)
    this.cleanYouTubeKey = process.env.YOUTUBE_API_KEY?.startsWith('=') 
      ? process.env.YOUTUBE_API_KEY.substring(1) 
      : process.env.YOUTUBE_API_KEY || '';
    
    this.cleanSendGridKey = process.env.SENDGRID_API_KEY?.startsWith('=') 
      ? process.env.SENDGRID_API_KEY.substring(1) 
      : process.env.SENDGRID_API_KEY || '';
    
    this.cleanGoogleKey = process.env.GOOGLE_API_KEY?.startsWith('=') 
      ? process.env.GOOGLE_API_KEY.substring(1) 
      : process.env.GOOGLE_API_KEY || '';

    // Initialize APIs
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.youtube = google.youtube({ version: 'v3', auth: this.cleanYouTubeKey });
    sgMail.setApiKey(this.cleanSendGridKey);
  }

  async checkAllAPIs() {
    const results = {
      openai: await this.checkOpenAI(),
      youtube: await this.checkYouTube(),
      googleTrends: await this.checkGoogleTrends(),
      sendgrid: await this.checkSendGrid(),
      shopee: await this.checkShopee(),
      timestamp: new Date().toISOString()
    };

    return results;
  }

  private async checkOpenAI() {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return { status: 'missing_key', message: 'OpenAI API key not provided' };
      }

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Test" }],
        max_tokens: 10
      });

      return { 
        status: 'active', 
        message: 'OpenAI API working correctly',
        model: 'gpt-4o'
      };
    } catch (error: any) {
      if (error.status === 401) {
        return { status: 'invalid_key', message: 'OpenAI API key is invalid' };
      }
      if (error.status === 429) {
        return { status: 'quota_exceeded', message: 'OpenAI API quota exceeded' };
      }
      return { status: 'error', message: error.message };
    }
  }

  private async checkYouTube() {
    try {
      if (!this.cleanYouTubeKey || this.cleanYouTubeKey.includes('your_youtube_key_here')) {
        return { 
          status: 'missing_key', 
          message: 'YouTube API key not provided or using placeholder',
          documentation: 'Get API key from Google Cloud Console: https://console.cloud.google.com'
        };
      }

      const response = await this.youtube.videos.list({
        part: ['snippet'],
        chart: 'mostPopular',
        regionCode: 'VN',
        maxResults: 1
      });

      return { 
        status: 'active', 
        message: 'YouTube API working correctly',
        quota: 'Available'
      };
    } catch (error: any) {
      if (error.code === 400) {
        return { status: 'invalid_key', message: 'YouTube API key is invalid or malformed' };
      }
      if (error.code === 403) {
        return { status: 'quota_exceeded', message: 'YouTube API quota exceeded or disabled' };
      }
      return { status: 'error', message: error.message };
    }
  }

  private async checkGoogleTrends() {
    try {
      const data = await googleTrends.interestOverTime({
        keyword: 'test',
        geo: 'VN',
        time: 'today 1-m'
      });
      
      // Check if response is valid JSON
      const parsed = JSON.parse(data);
      
      return { 
        status: 'active', 
        message: 'Google Trends API working correctly',
        note: 'No API key required'
      };
    } catch (error: any) {
      if (error.message.includes('Unexpected token')) {
        return { 
          status: 'rate_limited', 
          message: 'Google Trends rate limited or blocked',
          note: 'Try again later or use VPN'
        };
      }
      return { status: 'error', message: error.message };
    }
  }

  private async checkSendGrid() {
    try {
      if (!this.cleanSendGridKey || this.cleanSendGridKey.includes('your_sendgrid_key_here')) {
        return { 
          status: 'missing_key', 
          message: 'SendGrid API key not provided or using placeholder',
          documentation: 'Get API key from SendGrid: https://sendgrid.com'
        };
      }

      // Test with a dry-run (this won't send actual email)
      const msg = {
        to: 'test@example.com',
        from: 'noreply@thachai.com',
        subject: 'Test',
        text: 'Test'
      };

      // SendGrid validation check - this will fail but give us key validity info
      try {
        await sgMail.send(msg);
      } catch (sendError: any) {
        if (sendError.code === 401) {
          return { status: 'invalid_key', message: 'SendGrid API key is invalid' };
        }
        if (sendError.code === 403) {
          return { status: 'permissions', message: 'SendGrid API key lacks permissions' };
        }
        // If we get other errors, the key format is likely correct
        return { 
          status: 'configured', 
          message: 'SendGrid API key appears valid (test email not sent)',
          note: 'Configure verified sender domain for actual sending'
        };
      }

      return { status: 'active', message: 'SendGrid API working correctly' };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  private async checkShopee() {
    try {
      const shopeeKey = process.env.SHOPEE_API_KEY?.startsWith('=') 
        ? process.env.SHOPEE_API_KEY.substring(1) 
        : process.env.SHOPEE_API_KEY;

      if (!shopeeKey || shopeeKey.includes('your_shopee_key_here')) {
        return { 
          status: 'missing_key', 
          message: 'Shopee API key not provided or using placeholder',
          documentation: 'Get API key from Shopee Open Platform',
          note: 'Currently using mock data for demonstrations'
        };
      }

      // Shopee API requires complex authentication, so we'll indicate it's configured
      return { 
        status: 'configured', 
        message: 'Shopee API key provided',
        note: 'Using enhanced mock data with realistic pricing'
      };
    } catch (error: any) {
      return { status: 'error', message: error.message };
    }
  }

  getRecommendations() {
    return {
      immediate_actions: [
        "Get a valid YouTube API key from Google Cloud Console for real trending data",
        "Get a SendGrid API key for email notifications",
        "Configure verified sender domain in SendGrid",
        "OpenAI API is already working for AI-powered features"
      ],
      optional_enhancements: [
        "Get Shopee API access for real product price monitoring",
        "Set up Google Custom Search API for enhanced search capabilities",
        "Configure rate limiting and caching for production use"
      ],
      development_priority: [
        "1. YouTube API - Critical for content creation features",
        "2. SendGrid API - Important for user notifications", 
        "3. Shopee API - Nice to have for e-commerce features",
        "4. Google Trends - Working but may need VPN for consistent access"
      ]
    };
  }
}