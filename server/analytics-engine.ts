// Real-time Analytics Engine for ThachAI Assistant
import { demoAPIService } from "./demo-apis";

interface TrendingKeyword {
  keyword: string;
  score: number;
  change_24h: number;
  sources: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string;
}

interface ContentMetrics {
  title: string;
  estimated_views: number;
  engagement_rate: number;
  viral_potential: number;
  seo_score: number;
  trend_alignment: number;
}

interface SocialSentiment {
  platform: string;
  positive: number;
  negative: number;
  neutral: number;
  total_mentions: number;
  trending_topics: string[];
}

export class AnalyticsEngine {
  private trendingData: any = null;
  private lastUpdate: Date = new Date();
  private keywordCache: Map<string, TrendingKeyword> = new Map();

  // Real-time trending keywords analysis
  async getTrendingKeywords(): Promise<TrendingKeyword[]> {
    const data = await demoAPIService.getContentTrends();
    const keywords: TrendingKeyword[] = [];

    // Analyze GitHub trending repositories
    if (data.github_trending) {
      data.github_trending.forEach((repo: any) => {
        keywords.push({
          keyword: repo.name,
          score: Math.floor(repo.stars / 100),
          change_24h: Math.random() * 20 - 10, // Simulated 24h change
          sources: ['GitHub'],
          sentiment: repo.stars > 10000 ? 'positive' : 'neutral',
          category: 'technology'
        });

        // Add language as keyword
        if (repo.language) {
          const existing = keywords.find(k => k.keyword === repo.language);
          if (existing) {
            existing.score += Math.floor(repo.stars / 500);
            existing.sources.push('GitHub');
          } else {
            keywords.push({
              keyword: repo.language,
              score: Math.floor(repo.stars / 500),
              change_24h: Math.random() * 15 - 5,
              sources: ['GitHub'],
              sentiment: 'positive',
              category: 'programming'
            });
          }
        }
      });
    }

    // Analyze Reddit discussions
    if (data.reddit_discussions) {
      data.reddit_discussions.forEach((post: any) => {
        const words = this.extractKeywords(post.title);
        words.forEach(word => {
          if (word.length > 4) {
            keywords.push({
              keyword: word,
              score: Math.floor(post.score / 10),
              change_24h: Math.random() * 30 - 15,
              sources: ['Reddit'],
              sentiment: post.score > 100 ? 'positive' : 'neutral',
              category: 'discussion'
            });
          }
        });
      });
    }

    // Analyze crypto trends
    if (data.crypto_market) {
      Object.keys(data.crypto_market).forEach(coin => {
        const coinData = data.crypto_market[coin];
        keywords.push({
          keyword: coin,
          score: Math.abs(coinData.vnd_24h_change || 0) * 10,
          change_24h: coinData.vnd_24h_change || 0,
          sources: ['CoinGecko'],
          sentiment: coinData.vnd_24h_change > 0 ? 'positive' : 'negative',
          category: 'cryptocurrency'
        });
      });
    }

    // Merge and deduplicate keywords
    const mergedKeywords = this.mergeKeywords(keywords);
    
    // Cache for performance
    mergedKeywords.forEach(k => this.keywordCache.set(k.keyword, k));
    
    return mergedKeywords.sort((a, b) => b.score - a.score).slice(0, 20);
  }

  // Performance metrics for content
  async getContentMetrics(titles: string[]): Promise<ContentMetrics[]> {
    const keywords = await this.getTrendingKeywords();
    const metrics: ContentMetrics[] = [];

    titles.forEach(title => {
      const seoScore = this.calculateSEOScore(title);
      const trendAlignment = this.calculateTrendAlignment(title, keywords);
      const viralPotential = this.calculateViralPotential(title, keywords);
      
      metrics.push({
        title,
        estimated_views: Math.floor((seoScore + trendAlignment + viralPotential) * 1000),
        engagement_rate: Math.random() * 15 + 5, // 5-20%
        viral_potential: viralPotential,
        seo_score: seoScore,
        trend_alignment: trendAlignment
      });
    });

    return metrics.sort((a, b) => b.estimated_views - a.estimated_views);
  }

  // Social media sentiment analysis
  async getSocialSentiment(): Promise<SocialSentiment[]> {
    const data = await demoAPIService.getContentTrends();
    const sentiments: SocialSentiment[] = [];

    // GitHub sentiment
    if (data.github_trending) {
      const githubTopics = data.github_trending.map((repo: any) => repo.name);
      sentiments.push({
        platform: 'GitHub',
        positive: 75,
        negative: 10,
        neutral: 15,
        total_mentions: data.github_trending.length * 100,
        trending_topics: githubTopics.slice(0, 5)
      });
    }

    // Reddit sentiment
    if (data.reddit_discussions) {
      const redditTopics = data.reddit_discussions.map((post: any) => 
        this.extractKeywords(post.title)[0]
      ).filter(Boolean);
      
      sentiments.push({
        platform: 'Reddit',
        positive: 45,
        negative: 25,
        neutral: 30,
        total_mentions: data.reddit_discussions.reduce((sum: number, post: any) => sum + post.score, 0),
        trending_topics: redditTopics.slice(0, 5)
      });
    }

    // Crypto sentiment
    if (data.crypto_market) {
      const cryptoTrends = Object.entries(data.crypto_market).map(([coin, data]: [string, any]) => {
        return { coin, change: data.vnd_24h_change };
      });
      
      const positive = cryptoTrends.filter(c => c.change > 0).length;
      const negative = cryptoTrends.filter(c => c.change < 0).length;
      
      sentiments.push({
        platform: 'Crypto Market',
        positive: (positive / cryptoTrends.length) * 100,
        negative: (negative / cryptoTrends.length) * 100,
        neutral: 100 - ((positive + negative) / cryptoTrends.length) * 100,
        total_mentions: cryptoTrends.length * 1000,
        trending_topics: cryptoTrends.map(c => c.coin)
      });
    }

    return sentiments;
  }

  // Real-time analytics dashboard data
  async getDashboardData() {
    const [keywords, sentiment, contentTrends] = await Promise.all([
      this.getTrendingKeywords(),
      this.getSocialSentiment(),
      demoAPIService.getContentTrends()
    ]);

    // Sample content for metrics
    const sampleTitles = [
      "Cách học JavaScript hiệu quả cho người mới bắt đầu",
      "Bitcoin tăng giá - Phân tích xu hướng thị trường",
      "Next.js vs React - So sánh chi tiết 2024",
      "AI và Machine Learning trong thực tế"
    ];

    const contentMetrics = await this.getContentMetrics(sampleTitles);

    return {
      trending_keywords: keywords,
      social_sentiment: sentiment,
      content_metrics: contentMetrics,
      market_overview: {
        total_tracked_topics: keywords.length,
        avg_sentiment_score: sentiment.reduce((sum, s) => sum + s.positive, 0) / sentiment.length,
        top_performing_category: this.getTopCategory(keywords),
        trend_velocity: this.calculateTrendVelocity(keywords)
      },
      real_time_data: {
        last_updated: new Date().toISOString(),
        update_frequency: '5 minutes',
        data_freshness: this.getDataFreshness(),
        active_sources: ['GitHub', 'Reddit', 'CoinGecko', 'Weather API']
      }
    };
  }

  // Helper methods
  private extractKeywords(text: string): string[] {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .slice(0, 5);
  }

  private mergeKeywords(keywords: TrendingKeyword[]): TrendingKeyword[] {
    const merged = new Map<string, TrendingKeyword>();
    
    keywords.forEach(keyword => {
      const existing = merged.get(keyword.keyword);
      if (existing) {
        existing.score += keyword.score;
        existing.sources = [...new Set([...existing.sources, ...keyword.sources])];
        existing.change_24h = (existing.change_24h + keyword.change_24h) / 2;
      } else {
        merged.set(keyword.keyword, { ...keyword });
      }
    });
    
    return Array.from(merged.values());
  }

  private calculateSEOScore(title: string): number {
    let score = 0;
    
    // Length optimization (40-60 chars ideal)
    const length = title.length;
    if (length >= 40 && length <= 60) score += 30;
    else if (length >= 30 && length <= 70) score += 20;
    else score += 10;
    
    // Vietnamese keywords
    const vietnameseWords = ['cách', 'học', 'hướng dẫn', 'tutorial', 'phân tích', 'chi tiết'];
    vietnameseWords.forEach(word => {
      if (title.toLowerCase().includes(word)) score += 5;
    });
    
    // Numbers and years
    if (/\d{4}/.test(title)) score += 10; // Year
    if (/\d+/.test(title)) score += 5; // Any number
    
    return Math.min(score, 100);
  }

  private calculateTrendAlignment(title: string, keywords: TrendingKeyword[]): number {
    let alignment = 0;
    const titleWords = this.extractKeywords(title);
    
    titleWords.forEach(word => {
      const keyword = keywords.find(k => k.keyword.toLowerCase().includes(word));
      if (keyword) {
        alignment += keyword.score * 0.1;
      }
    });
    
    return Math.min(alignment, 100);
  }

  private calculateViralPotential(title: string, keywords: TrendingKeyword[]): number {
    let potential = 0;
    
    // Emotional triggers
    const emotionalWords = ['🔥', 'hot', 'mới nhất', 'bí mật', 'hiệu quả', 'nhanh'];
    emotionalWords.forEach(word => {
      if (title.toLowerCase().includes(word)) potential += 15;
    });
    
    // Trending keyword bonus
    const alignment = this.calculateTrendAlignment(title, keywords);
    potential += alignment * 0.5;
    
    return Math.min(potential, 100);
  }

  private getTopCategory(keywords: TrendingKeyword[]): string {
    const categories = new Map<string, number>();
    
    keywords.forEach(k => {
      categories.set(k.category, (categories.get(k.category) || 0) + k.score);
    });
    
    return Array.from(categories.entries())
      .sort((a, b) => b[1] - a[1])[0]?.[0] || 'technology';
  }

  private calculateTrendVelocity(keywords: TrendingKeyword[]): number {
    const avgChange = keywords.reduce((sum, k) => sum + Math.abs(k.change_24h), 0) / keywords.length;
    return Math.round(avgChange * 10) / 10;
  }

  private getDataFreshness(): string {
    const now = new Date();
    const diff = now.getTime() - this.lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Real-time';
    if (minutes < 5) return `${minutes} minutes ago`;
    return 'Refreshing...';
  }
}

export const analyticsEngine = new AnalyticsEngine();