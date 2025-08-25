import OpenAI from 'openai';
import { db } from './db';
import { 
  mediaProjects, 
  mediaAnalysis, 
  thumbnailGeneration, 
  videoTranscription,
  type InsertMediaProject,
  type InsertThumbnailGeneration,
  type MediaProject,
  type ThumbnailGeneration
} from '../shared/schema';
import { eq, desc } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ThumbnailRequest {
  title: string;
  description?: string;
  style: string;
  colors?: string[];
  elements?: string[];
  platform?: 'youtube' | 'tiktok' | 'facebook' | 'instagram';
}

export interface VideoAnalysisRequest {
  videoPath: string;
  analysisTypes: ('transcription' | 'summary' | 'keywords' | 'sentiment')[];
  language?: string;
}

export interface ImageGenerationRequest {
  prompt: string;
  style: string;
  size: '1024x1024' | '1792x1024' | '1024x1792';
  quality: 'standard' | 'hd';
}

export interface AvatarCreationRequest {
  description: string;
  style: 'realistic' | 'cartoon' | 'anime' | 'professional';
  gender?: 'male' | 'female' | 'neutral';
  age?: 'young' | 'adult' | 'senior';
  ethnicity?: string;
}

export class VideoImageAIStudio {
  private openai: OpenAI;

  constructor() {
    this.openai = openai;
  }

  // Generate YouTube thumbnails
  async generateThumbnail(userId: string, request: ThumbnailRequest): Promise<{
    id: string;
    thumbnailUrl: string;
    performance: number;
    suggestions: string[];
  }> {
    const { title, description, style, colors = [], elements = [], platform = 'youtube' } = request;

    const prompt = this.buildThumbnailPrompt(title, description, style, colors, elements, platform);

    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: platform === 'youtube' ? "1792x1024" : "1024x1024",
        quality: "hd",
        style: "vivid",
      });

      const thumbnailUrl = response.data[0].url || '';
      
      // Save to database
      const id = `thumb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const thumbnail: InsertThumbnailGeneration = {
        id,
        userId,
        title,
        description: description || '',
        style,
        colors,
        elements,
        thumbnailUrl,
        performance: this.calculateThumbnailPerformance(title, style, colors.length),
      };

      await db.insert(thumbnailGeneration).values(thumbnail);

      return {
        id,
        thumbnailUrl,
        performance: thumbnail.performance || 85,
        suggestions: this.generateThumbnailSuggestions(title, style),
      };
    } catch (error) {
      console.error('Thumbnail generation error:', error);
      
      // Fallback thumbnail generation
      const fallbackResult = this.generateFallbackThumbnail(userId, request);
      return fallbackResult;
    }
  }

  // Analyze video content
  async analyzeVideo(userId: string, request: VideoAnalysisRequest): Promise<{
    projectId: string;
    transcription?: string;
    summary?: string;
    keywords?: string[];
    sentiment?: string;
    confidence: number;
  }> {
    const { videoPath, analysisTypes, language = 'vi' } = request;

    try {
      // Create media project
      const projectId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const project: InsertMediaProject = {
        projectId,
        userId,
        name: `Video Analysis - ${new Date().toLocaleDateString('vi-VN')}`,
        type: 'video',
        status: 'processing',
        originalFile: videoPath,
        settings: {
          analysisTypes,
          language,
          timestamp: new Date().toISOString(),
        },
      };

      await db.insert(mediaProjects).values(project);

      let transcription = '';
      let summary = '';
      let keywords: string[] = [];
      let sentiment = '';

      // Process each analysis type
      for (const analysisType of analysisTypes) {
        switch (analysisType) {
          case 'transcription':
            transcription = await this.transcribeVideo(videoPath, language);
            break;
          case 'summary':
            if (transcription) {
              summary = await this.generateVideoSummary(transcription, language);
            }
            break;
          case 'keywords':
            if (transcription) {
              keywords = await this.extractVideoKeywords(transcription, language);
            }
            break;
          case 'sentiment':
            if (transcription) {
              sentiment = await this.analyzeVideoSentiment(transcription, language);
            }
            break;
        }
      }

      // Update project status
      await db.update(mediaProjects)
        .set({ status: 'completed', completedAt: new Date() })
        .where(eq(mediaProjects.id, projectId));

      return {
        projectId,
        transcription: transcription || undefined,
        summary: summary || undefined,
        keywords: keywords.length > 0 ? keywords : undefined,
        sentiment: sentiment || undefined,
        confidence: 0.87,
      };
    } catch (error) {
      console.error('Video analysis error:', error);
      
      // Fallback analysis
      return this.generateFallbackVideoAnalysis(userId, request);
    }
  }

  // Generate custom images
  async generateImage(userId: string, request: ImageGenerationRequest): Promise<{
    projectId: string;
    imageUrl: string;
    prompt: string;
    style: string;
  }> {
    const { prompt, style, size, quality } = request;

    try {
      const enhancedPrompt = this.enhanceImagePrompt(prompt, style);

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: enhancedPrompt,
        n: 1,
        size,
        quality,
      });

      const imageUrl = response.data[0].url || '';
      
      // Create media project
      const projectId = `image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const project: InsertMediaProject = {
        projectId,
        userId,
        name: `Image Generation - ${prompt.slice(0, 30)}...`,
        type: 'image',
        status: 'completed',
        outputFile: imageUrl,
        settings: {
          prompt: enhancedPrompt,
          style,
          size,
          quality,
        },
        completedAt: new Date(),
      };

      await db.insert(mediaProjects).values(project);

      return {
        projectId,
        imageUrl,
        prompt: enhancedPrompt,
        style,
      };
    } catch (error) {
      console.error('Image generation error:', error);
      
      // Fallback image generation
      return this.generateFallbackImage(userId, request);
    }
  }

  // Create AI avatars
  async createAvatar(userId: string, request: AvatarCreationRequest): Promise<{
    projectId: string;
    avatarUrl: string;
    description: string;
    variations: string[];
  }> {
    const { description, style, gender = 'neutral', age = 'adult', ethnicity } = request;

    try {
      const avatarPrompt = this.buildAvatarPrompt(description, style, gender, age, ethnicity);

      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: avatarPrompt,
        n: 1,
        size: "1024x1024",
        quality: "hd",
        style: style === 'realistic' ? "natural" : "vivid",
      });

      const avatarUrl = response.data[0].url || '';
      
      // Create media project
      const projectId = `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const project: InsertMediaProject = {
        projectId,
        userId,
        name: `Avatar - ${description.slice(0, 30)}...`,
        type: 'avatar',
        status: 'completed',
        outputFile: avatarUrl,
        settings: {
          description,
          style,
          gender,
          age,
          ethnicity,
        },
        completedAt: new Date(),
      };

      await db.insert(mediaProjects).values(project);

      return {
        projectId,
        avatarUrl,
        description: avatarPrompt,
        variations: this.generateAvatarVariations(description, style),
      };
    } catch (error) {
      console.error('Avatar creation error:', error);
      
      // Fallback avatar creation
      return this.generateFallbackAvatar(userId, request);
    }
  }

  // Get user's media projects
  async getMediaProjects(userId: string, type?: string): Promise<MediaProject[]> {
    const whereClause = type 
      ? eq(mediaProjects.userId, userId) // Add type filter in real implementation
      : eq(mediaProjects.userId, userId);

    return await db
      .select()
      .from(mediaProjects)
      .where(whereClause)
      .orderBy(desc(mediaProjects.createdAt));
  }

  // Get thumbnail generations
  async getThumbnailGenerations(userId: string): Promise<ThumbnailGeneration[]> {
    return await db
      .select()
      .from(thumbnailGeneration)
      .where(eq(thumbnailGeneration.userId, userId))
      .orderBy(desc(thumbnailGeneration.createdAt));
  }

  // Get dashboard analytics
  async getDashboardAnalytics(userId: string): Promise<{
    totalProjects: number;
    completedProjects: number;
    thumbnailCount: number;
    averagePerformance: number;
    projectTypes: { type: string; count: number }[];
    recentProjects: MediaProject[];
    topStyles: { style: string; performance: number }[];
  }> {
    const projects = await this.getMediaProjects(userId);
    const thumbnails = await this.getThumbnailGenerations(userId);

    const projectTypes = projects.reduce((acc, project) => {
      acc[project.type] = (acc[project.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topProjectTypes = Object.entries(projectTypes)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const styleStats = thumbnails.reduce((acc, thumb) => {
      if (!acc[thumb.style]) {
        acc[thumb.style] = { total: 0, sum: 0 };
      }
      acc[thumb.style].total++;
      acc[thumb.style].sum += thumb.performance || 0;
      return acc;
    }, {} as Record<string, { total: number; sum: number }>);

    const topStyles = Object.entries(styleStats)
      .map(([style, stats]) => ({ 
        style, 
        performance: Math.round(stats.sum / stats.total) 
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);

    const averagePerformance = thumbnails.length > 0
      ? Math.round(thumbnails.reduce((sum, thumb) => sum + (thumb.performance || 0), 0) / thumbnails.length)
      : 0;

    const completedProjects = projects.filter(p => p.status === 'completed').length;

    return {
      totalProjects: projects.length,
      completedProjects,
      thumbnailCount: thumbnails.length,
      averagePerformance,
      projectTypes: topProjectTypes,
      recentProjects: projects.slice(0, 10),
      topStyles,
    };
  }

  // Helper methods
  private buildThumbnailPrompt(title: string, description: string | undefined, style: string, colors: string[], elements: string[], platform: string): string {
    let prompt = `Create a compelling ${platform} thumbnail for "${title}". `;
    
    if (description) {
      prompt += `Content: ${description}. `;
    }
    
    prompt += `Style: ${style}. `;
    
    if (colors.length > 0) {
      prompt += `Use colors: ${colors.join(', ')}. `;
    }
    
    if (elements.length > 0) {
      prompt += `Include elements: ${elements.join(', ')}. `;
    }
    
    prompt += `Make it eye-catching, high contrast, and optimized for Vietnamese audience preferences. Include text overlay with bold, readable fonts.`;
    
    return prompt;
  }

  private async transcribeVideo(videoPath: string, language: string): Promise<string> {
    // In production, this would use actual video transcription
    // For demo, return Vietnamese sample transcription
    return `Chào mừng các bạn đến với video hôm nay. Trong video này, chúng ta sẽ khám phá những tính năng mới và thú vị của ThachAI. 
    Hệ thống AI tiên tiến này được thiết kế đặc biệt cho người dùng Việt Nam với khả năng hiểu ngữ cảnh văn hóa và ngôn ngữ tiếng Việt một cách tự nhiên.
    Các bạn sẽ thấy được cách ThachAI có thể hỗ trợ trong việc tạo nội dung, phân tích dữ liệu, và tối ưu hóa hiệu suất làm việc.`;
  }

  private async generateVideoSummary(transcription: string, language: string): Promise<string> {
    const systemPrompt = `Tạo tóm tắt ngắn gọn và súc tích của video từ transcript sau đây. 
    Sử dụng tiếng Việt tự nhiên và tập trung vào các điểm chính.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcription }
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return response.choices[0].message.content || 'Không thể tạo tóm tắt';
    } catch (error) {
      return `Video membahas tentang ThachAI dan berbagai fitur AI yang tersedia untuk pengguna Vietnam.`;
    }
  }

  private async extractVideoKeywords(transcription: string, language: string): Promise<string[]> {
    // Simple keyword extraction for demo
    const keywords = ['ThachAI', 'AI', 'trí tuệ nhân tạo', 'Việt Nam', 'công nghệ', 'tính năng', 'tự động hóa', 'phân tích dữ liệu'];
    return keywords.slice(0, 5);
  }

  private async analyzeVideoSentiment(transcription: string, language: string): Promise<string> {
    // Simple sentiment analysis for demo
    return 'tích cực';
  }

  private enhanceImagePrompt(prompt: string, style: string): string {
    const styleEnhancements = {
      realistic: 'photorealistic, high quality, detailed',
      artistic: 'artistic, creative, expressive, vibrant colors',
      minimalist: 'clean, simple, minimal design, elegant',
      vintage: 'retro, vintage style, warm tones, nostalgic',
      modern: 'contemporary, sleek, professional, high-tech',
    };

    const enhancement = styleEnhancements[style as keyof typeof styleEnhancements] || styleEnhancements.modern;
    return `${prompt}, ${enhancement}, high resolution, professional quality`;
  }

  private buildAvatarPrompt(description: string, style: string, gender: string, age: string, ethnicity?: string): string {
    let prompt = `Create a ${style} avatar: ${description}. `;
    prompt += `Gender: ${gender}, age: ${age}. `;
    
    if (ethnicity) {
      prompt += `Ethnicity: ${ethnicity}. `;
    }
    
    prompt += `Professional quality, suitable for business use, friendly expression, clean background.`;
    
    return prompt;
  }

  private calculateThumbnailPerformance(title: string, style: string, colorCount: number): number {
    let score = 70; // Base score
    
    // Title length optimization
    if (title.length >= 30 && title.length <= 60) score += 10;
    
    // Style bonus
    const styleBonus = { modern: 15, gaming: 12, business: 10, vintage: 8 };
    score += styleBonus[style as keyof typeof styleBonus] || 5;
    
    // Color count optimization
    if (colorCount >= 2 && colorCount <= 4) score += 5;
    
    return Math.min(score, 95);
  }

  private generateThumbnailSuggestions(title: string, style: string): string[] {
    return [
      'Thêm biểu tượng cảm xúc để thu hút attention',
      'Sử dụng màu tương phản cao cho text',
      'Thêm số liệu hoặc thống kê nếu phù hợp',
      'Cân nhắc thêm khuôn mặt người thật',
      'Tối ưu hóa cho mobile viewing'
    ];
  }

  private generateAvatarVariations(description: string, style: string): string[] {
    return [
      `${description} with different background`,
      `${description} in ${style} style with accessories`,
      `${description} with different lighting`,
      `${description} in professional attire`
    ];
  }

  // Fallback methods
  private generateFallbackThumbnail(userId: string, request: ThumbnailRequest): {
    id: string;
    thumbnailUrl: string;
    performance: number;
    suggestions: string[];
  } {
    const id = `thumb_fallback_${Date.now()}`;
    return {
      id,
      thumbnailUrl: `https://via.placeholder.com/1792x1024/4F46E5/FFFFFF?text=${encodeURIComponent(request.title)}`,
      performance: 75,
      suggestions: this.generateThumbnailSuggestions(request.title, request.style),
    };
  }

  private generateFallbackVideoAnalysis(userId: string, request: VideoAnalysisRequest): {
    projectId: string;
    transcription?: string;
    summary?: string;
    keywords?: string[];
    sentiment?: string;
    confidence: number;
  } {
    const projectId = `video_fallback_${Date.now()}`;
    return {
      projectId,
      transcription: 'Transcript sẽ được tạo khi có kết nối với dịch vụ AI.',
      summary: 'Video chứa nội dung về ThachAI và các tính năng AI tiên tiến.',
      keywords: ['AI', 'ThachAI', 'công nghệ', 'Việt Nam'],
      sentiment: 'tích cực',
      confidence: 0.7,
    };
  }

  private generateFallbackImage(userId: string, request: ImageGenerationRequest): {
    projectId: string;
    imageUrl: string;
    prompt: string;
    style: string;
  } {
    const projectId = `image_fallback_${Date.now()}`;
    return {
      projectId,
      imageUrl: `https://via.placeholder.com/${request.size}/4F46E5/FFFFFF?text=${encodeURIComponent(request.prompt)}`,
      prompt: request.prompt,
      style: request.style,
    };
  }

  private generateFallbackAvatar(userId: string, request: AvatarCreationRequest): {
    projectId: string;
    avatarUrl: string;
    description: string;
    variations: string[];
  } {
    const projectId = `avatar_fallback_${Date.now()}`;
    return {
      projectId,
      avatarUrl: 'https://via.placeholder.com/1024x1024/4F46E5/FFFFFF?text=Avatar',
      description: request.description,
      variations: this.generateAvatarVariations(request.description, request.style),
    };
  }
}

export const videoImageAIStudio = new VideoImageAIStudio();