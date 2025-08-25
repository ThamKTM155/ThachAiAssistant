/**
 * Content Automation Suite for ThachAI
 * Automated content generation, scheduling, and cross-platform publishing
 */

import OpenAI from 'openai';

export interface ContentTemplate {
  id: string;
  name: string;
  type: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'blog';
  template: string;
  variables: string[];
  targetAudience: string;
  language: 'vi' | 'en';
}

export interface ContentRequest {
  topic: string;
  type: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'blog';
  language: 'vi' | 'en';
  tone: 'professional' | 'casual' | 'educational' | 'entertaining';
  length: 'short' | 'medium' | 'long';
  keywords?: string[];
  targetAudience?: string;
}

export interface ScheduledContent {
  id: string;
  title: string;
  content: string;
  platform: string;
  scheduledTime: Date;
  status: 'pending' | 'published' | 'failed';
  engagementMetrics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface ContentSeries {
  id: string;
  name: string;
  topic: string;
  platform: string[];
  frequency: 'daily' | 'weekly' | 'monthly';
  nextPublishDate: Date;
  episodeCount: number;
  templates: ContentTemplate[];
}

export class ContentAutomationEngine {
  private openai: OpenAI | null = null;
  private contentTemplates: Map<string, ContentTemplate> = new Map();
  private scheduledContent: Map<string, ScheduledContent> = new Map();
  private contentSeries: Map<string, ContentSeries> = new Map();

  constructor() {
    // Initialize OpenAI if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates() {
    const templates: ContentTemplate[] = [
      {
        id: 'youtube_tutorial_vi',
        name: 'YouTube Tutorial (Vietnamese)',
        type: 'youtube',
        template: `# {title}

## Giới thiệu
Xin chào các bạn! Hôm nay chúng ta sẽ tìm hiểu về {topic}.

## Nội dung chính
{main_content}

## Kết luận
{conclusion}

## Hashtags
{hashtags}`,
        variables: ['title', 'topic', 'main_content', 'conclusion', 'hashtags'],
        targetAudience: 'Vietnamese learners',
        language: 'vi'
      },
      {
        id: 'tiktok_trend_vi',
        name: 'TikTok Trending (Vietnamese)',
        type: 'tiktok',
        template: `🔥 {hook}

{content}

💡 {tip}

#{hashtag1} #{hashtag2} #{hashtag3}`,
        variables: ['hook', 'content', 'tip', 'hashtag1', 'hashtag2', 'hashtag3'],
        targetAudience: 'Vietnamese Gen Z',
        language: 'vi'
      },
      {
        id: 'blog_educational_vi',
        name: 'Educational Blog (Vietnamese)',
        type: 'blog',
        template: `# {title}

## Tổng quan
{overview}

## Chi tiết nội dung
{detailed_content}

## Ví dụ thực tế
{examples}

## Kết luận
{conclusion}

**Từ khóa:** {keywords}`,
        variables: ['title', 'overview', 'detailed_content', 'examples', 'conclusion', 'keywords'],
        targetAudience: 'Vietnamese professionals',
        language: 'vi'
      }
    ];

    templates.forEach(template => {
      this.contentTemplates.set(template.id, template);
    });
  }

  async generateContent(request: ContentRequest): Promise<{
    title: string;
    content: string;
    metadata: {
      wordCount: number;
      estimatedReadTime: number;
      seoScore: number;
      hashtags: string[];
      targetKeywords: string[];
    };
  }> {
    try {
      const template = this.getTemplateForRequest(request);
      
      if (this.openai) {
        return await this.generateWithAI(request, template);
      } else {
        return this.generateFallbackContent(request, template);
      }
    } catch (error) {
      console.error('Content generation error:', error);
      return this.generateFallbackContent(request);
    }
  }

  private async generateWithAI(request: ContentRequest, template?: ContentTemplate): Promise<any> {
    const prompt = this.buildAIPrompt(request, template);
    
    const response = await this.openai!.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a Vietnamese content creator expert. Generate high-quality, engaging content in ${request.language === 'vi' ? 'Vietnamese' : 'English'} for ${request.type} platform.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const generatedContent = response.choices[0].message.content || '';
    
    return this.processGeneratedContent(generatedContent, request);
  }

  private generateFallbackContent(request: ContentRequest, template?: ContentTemplate): any {
    const fallbackTitles = {
      youtube: {
        vi: `Hướng dẫn ${request.topic} - Tips và Tricks cho người mới bắt đầu`,
        en: `${request.topic} Tutorial - Tips and Tricks for Beginners`
      },
      tiktok: {
        vi: `🔥 ${request.topic} - Bí quyết thành công!`,
        en: `🔥 ${request.topic} - Success Secrets!`
      },
      blog: {
        vi: `Khám phá ${request.topic}: Hướng dẫn chi tiết từ A đến Z`,
        en: `Exploring ${request.topic}: Complete Guide from A to Z`
      }
    };

    const title = fallbackTitles[request.type]?.[request.language] || `${request.topic} Content`;
    
    const content = this.generatePlatformSpecificContent(request, template);
    
    return {
      title,
      content,
      metadata: {
        wordCount: content.split(' ').length,
        estimatedReadTime: Math.ceil(content.split(' ').length / 200),
        seoScore: this.calculateSEOScore(title, content, request.keywords || []),
        hashtags: this.generateHashtags(request.topic, request.language),
        targetKeywords: request.keywords || [request.topic]
      }
    };
  }

  private generatePlatformSpecificContent(request: ContentRequest, template?: ContentTemplate): string {
    const vietnameseContent = {
      youtube: `Xin chào các bạn! Hôm nay chúng ta sẽ tìm hiểu về ${request.topic}.

## Giới thiệu
${request.topic} là một chủ đề rất quan trọng và hữu ích trong thời đại số hiện nay. Trong video này, tôi sẽ chia sẻ với các bạn những kiến thức cơ bản và nâng cao về ${request.topic}.

## Nội dung chính
1. Khái niệm cơ bản về ${request.topic}
2. Tại sao ${request.topic} lại quan trọng?
3. Hướng dẫn thực hành từng bước
4. Tips và tricks hữu ích
5. Những lỗi thường gặp và cách khắc phục

## Kết luận
Qua video này, tôi hy vọng các bạn đã hiểu rõ hơn về ${request.topic}. Đừng quên like, share và subscribe để ủng hộ kênh nhé!`,
      
      tiktok: `🔥 Bí quyết ${request.topic} mà không ai nói với bạn!

✨ Tip 1: Bắt đầu từ những điều cơ bản
📚 Tip 2: Thực hành mỗi ngày
🚀 Tip 3: Học hỏi từ người có kinh nghiệm

💡 Save video này để xem lại sau nhé!

#${request.topic.replace(/\s+/g, '')} #Tips #VietnameseTech #LearnTogether`,
      
      blog: `# Khám phá ${request.topic}: Hướng dẫn toàn diện

## Tổng quan
${request.topic} đang trở thành một xu hướng quan trọng trong thời đại công nghệ 4.0. Bài viết này sẽ cung cấp cho bạn cái nhìn tổng quan và hướng dẫn chi tiết về ${request.topic}.

## Lợi ích của ${request.topic}
- Tăng hiệu quả công việc
- Tiết kiệm thời gian và chi phí
- Cải thiện chất lượng cuộc sống
- Mở ra nhiều cơ hội mới

## Hướng dẫn từng bước
1. **Bước 1**: Chuẩn bị kiến thức nền tảng
2. **Bước 2**: Lựa chọn công cụ phù hợp
3. **Bước 3**: Thực hành và áp dụng
4. **Bước 4**: Đánh giá và cải thiện

## Kết luận
Hy vọng bài viết này đã cung cấp cho bạn những thông tin hữu ích về ${request.topic}. Hãy bắt đầu áp dụng ngay hôm nay!`
    };

    const englishContent = {
      youtube: `Hello everyone! Today we're going to explore ${request.topic}.

## Introduction
${request.topic} is a crucial topic in today's digital age. In this video, I'll share with you both basic and advanced knowledge about ${request.topic}.

## Main Content
1. Basic concepts of ${request.topic}
2. Why is ${request.topic} important?
3. Step-by-step practical guide
4. Useful tips and tricks
5. Common mistakes and how to avoid them

## Conclusion
Through this video, I hope you've gained a better understanding of ${request.topic}. Don't forget to like, share, and subscribe!`,
      
      tiktok: `🔥 ${request.topic} secrets no one tells you!

✨ Tip 1: Start with the basics
📚 Tip 2: Practice daily
🚀 Tip 3: Learn from experts

💡 Save this video for later!

#${request.topic.replace(/\s+/g, '')} #Tips #Tech #Learning`,
      
      blog: `# Exploring ${request.topic}: Complete Guide

## Overview
${request.topic} is becoming an important trend in the Industry 4.0 era. This article will provide you with a comprehensive overview and detailed guide about ${request.topic}.

## Benefits of ${request.topic}
- Increased work efficiency
- Time and cost savings
- Improved quality of life
- Opens up new opportunities

## Step-by-step Guide
1. **Step 1**: Prepare foundational knowledge
2. **Step 2**: Choose appropriate tools
3. **Step 3**: Practice and apply
4. **Step 4**: Evaluate and improve

## Conclusion
Hope this article has provided you with useful information about ${request.topic}. Start applying it today!`
    };

    const contentMap = request.language === 'vi' ? vietnameseContent : englishContent;
    return contentMap[request.type] || contentMap.blog;
  }

  private buildAIPrompt(request: ContentRequest, template?: ContentTemplate): string {
    return `Create ${request.type} content about "${request.topic}" with the following requirements:
- Language: ${request.language === 'vi' ? 'Vietnamese' : 'English'}
- Tone: ${request.tone}
- Length: ${request.length}
- Target audience: ${request.targetAudience || 'General audience'}
${request.keywords ? `- Include keywords: ${request.keywords.join(', ')}` : ''}

Please generate engaging, informative, and platform-optimized content.`;
  }

  private processGeneratedContent(content: string, request: ContentRequest): any {
    const lines = content.split('\n');
    const title = lines.find(line => line.startsWith('#'))?.replace('#', '').trim() || 
                  `${request.topic} - ${request.type} content`;
    
    return {
      title,
      content,
      metadata: {
        wordCount: content.split(' ').length,
        estimatedReadTime: Math.ceil(content.split(' ').length / 200),
        seoScore: this.calculateSEOScore(title, content, request.keywords || []),
        hashtags: this.generateHashtags(request.topic, request.language),
        targetKeywords: request.keywords || [request.topic]
      }
    };
  }

  private calculateSEOScore(title: string, content: string, keywords: string[]): number {
    let score = 0;
    
    // Title length check
    if (title.length >= 30 && title.length <= 60) score += 20;
    
    // Keyword presence
    keywords.forEach(keyword => {
      if (title.toLowerCase().includes(keyword.toLowerCase())) score += 15;
      if (content.toLowerCase().includes(keyword.toLowerCase())) score += 10;
    });
    
    // Content length
    const wordCount = content.split(' ').length;
    if (wordCount >= 300) score += 25;
    
    // Structure (headers)
    const headerCount = (content.match(/^#/gm) || []).length;
    if (headerCount >= 2) score += 15;
    
    return Math.min(score, 100);
  }

  private generateHashtags(topic: string, language: 'vi' | 'en'): string[] {
    const baseHashtags = {
      vi: ['#HọcTập', '#KiếnThức', '#Công Nghệ', '#Vietnam', '#Tips'],
      en: ['#Learning', '#Knowledge', '#Technology', '#Tips', '#Education']
    };
    
    const topicHashtag = `#${topic.replace(/\s+/g, '')}`;
    
    return [topicHashtag, ...baseHashtags[language]];
  }

  private getTemplateForRequest(request: ContentRequest): ContentTemplate | undefined {
    const templateKey = `${request.type}_${request.tone}_${request.language}`;
    return this.contentTemplates.get(templateKey) || 
           Array.from(this.contentTemplates.values()).find(t => 
             t.type === request.type && t.language === request.language
           );
  }

  async scheduleContent(content: ScheduledContent): Promise<{ success: boolean; message: string }> {
    try {
      this.scheduledContent.set(content.id, content);
      
      // In a real implementation, this would integrate with platform APIs
      // For now, we simulate scheduling
      
      return {
        success: true,
        message: `Content scheduled for ${content.platform} at ${content.scheduledTime.toISOString()}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to schedule content: ${error}`
      };
    }
  }

  async getScheduledContent(): Promise<ScheduledContent[]> {
    return Array.from(this.scheduledContent.values())
      .sort((a, b) => a.scheduledTime.getTime() - b.scheduledTime.getTime());
  }

  async createContentSeries(series: ContentSeries): Promise<{ success: boolean; seriesId: string }> {
    const seriesId = `series_${Date.now()}`;
    this.contentSeries.set(seriesId, { ...series, id: seriesId });
    
    return {
      success: true,
      seriesId
    };
  }

  async getContentSeries(): Promise<ContentSeries[]> {
    return Array.from(this.contentSeries.values());
  }

  async generateSeriesEpisode(seriesId: string): Promise<{
    title: string;
    content: string;
    episodeNumber: number;
  } | null> {
    const series = this.contentSeries.get(seriesId);
    if (!series) return null;

    const episodeNumber = series.episodeCount + 1;
    const template = series.templates[0]; // Use first template
    
    const request: ContentRequest = {
      topic: `${series.topic} - Episode ${episodeNumber}`,
      type: series.platform[0] as any,
      language: template?.language || 'vi', // Default to Vietnamese if no template
      tone: 'educational',
      length: 'medium'
    };

    const generatedContent = await this.generateContent(request);
    
    // Update series episode count
    series.episodeCount = episodeNumber;
    this.contentSeries.set(seriesId, series);
    
    return {
      title: generatedContent.title,
      content: generatedContent.content,
      episodeNumber
    };
  }

  getAnalytics(): {
    totalScheduled: number;
    totalPublished: number;
    activeSeries: number;
    topPerformingContent: ScheduledContent[];
  } {
    const scheduled = Array.from(this.scheduledContent.values());
    
    return {
      totalScheduled: scheduled.filter(c => c.status === 'pending').length,
      totalPublished: scheduled.filter(c => c.status === 'published').length,
      activeSeries: this.contentSeries.size,
      topPerformingContent: scheduled
        .filter(c => c.engagementMetrics)
        .sort((a, b) => (b.engagementMetrics?.views || 0) - (a.engagementMetrics?.views || 0))
        .slice(0, 5)
    };
  }
}

export const contentAutomationEngine = new ContentAutomationEngine();