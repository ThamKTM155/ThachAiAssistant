// Free API integrations for ThachAI Assistant demo
import axios from 'axios';

export class FreeAPIService {
  
  // Reddit public API for tech trends
  async getTechNews() {
    try {
      const response = await axios.get('https://www.reddit.com/r/technology.json?limit=10');
      return response.data.data.children.map(post => ({
        title: post.data.title,
        source: 'Reddit Technology',
        category: 'technology',
        score: post.data.score,
        created: new Date(post.data.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.data.permalink}`
      }));
    } catch (error) {
      console.error('Reddit API error:', error);
      return [];
    }
  }

  // Free cryptocurrency API for trending topics
  async getCryptoPrices() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=vnd&include_24hr_change=true');
      return response.data;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  }

  // Free weather API for context
  async getWeatherData(city = 'Ho Chi Minh City') {
    try {
      // Using free weather service
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      return response.data;
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }

  // Free tech trends from GitHub
  async getTechTrends() {
    try {
      const response = await axios.get('https://api.github.com/search/repositories?q=language:javascript+stars:>1000&sort=updated&order=desc&per_page=10');
      return response.data.items.map(item => ({
        name: item.name,
        description: item.description,
        stars: item.stargazers_count,
        language: item.language,
        updated: item.updated_at
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      return [];
    }
  }

  // Free quotes API for inspiration
  async getInspirationQuote() {
    try {
      const response = await axios.get('https://api.quotable.io/random?tags=inspirational|motivational');
      return response.data;
    } catch (error) {
      return {
        content: "Thành công đến từ sự kiên trì và không ngừng học hỏi.",
        author: "ThachAI"
      };
    }
  }

  // Get real trending content using free APIs
  async getRealTrendingContent() {
    const [techTrends, techNews, crypto] = await Promise.all([
      this.getTechTrends(),
      this.getTechNews(), 
      this.getCryptoPrices()
    ]);
    
    return {
      github_trends: techTrends,
      reddit_tech: techNews,
      crypto_prices: crypto,
      inspiration: await this.getInspirationQuote(),
      weather: await this.getWeatherData(),
      fetchedAt: new Date().toISOString(),
      source: 'authenticated_free_apis'
    };
  }

  // Enhanced Shopee price simulation using real market data
  async getEnhancedShopeeData() {
    const crypto = await this.getCryptoPrices();
    
    return {
      products: this.generateRealisticProducts(crypto),
      alerts: this.generatePriceAlerts(),
      market_trends: crypto,
      last_updated: new Date().toISOString()
    };
  }

  private parseRSSFeed(rssData: string) {
    // Simple RSS parser for news headlines
    const items = [];
    const titleRegex = /<title><!\[CDATA\[(.*?)\]\]><\/title>/g;
    let match;
    
    while ((match = titleRegex.exec(rssData)) !== null && items.length < 10) {
      items.push({
        title: match[1],
        source: 'VnExpress',
        category: 'news'
      });
    }
    
    return items;
  }

  private getBackupNews() {
    return [
      { title: "AI và Machine Learning đang thay đổi thị trường Việt Nam", source: "Tech News", category: "technology" },
      { title: "Startup Việt Nam nhận đầu tư triệu USD", source: "Business", category: "business" },
      { title: "E-commerce Việt Nam tăng trưởng mạnh", source: "Economy", category: "economy" }
    ];
  }

  private generateYouTubeTitles(techTrends: any[], news: any[]) {
    const titles = [];
    
    // Generate titles based on tech trends
    techTrends.slice(0, 5).forEach(trend => {
      titles.push({
        id: `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `🔥 ${trend.name} - Công nghệ HOT nhất 2024! Tutorial từ A-Z`,
        channelTitle: "ThachAI Channel",
        viewCount: Math.floor(Math.random() * 500000) + 50000,
        likeCount: Math.floor(Math.random() * 10000) + 1000,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        tags: [trend.language, 'tutorial', 'vietnamese', 'programming'],
        trending_score: trend.stars / 1000
      });
    });

    // Generate titles based on news
    news.slice(0, 3).forEach(newsItem => {
      titles.push({
        id: `yt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `📺 ${newsItem.title} - Phân tích chi tiết!`,
        channelTitle: "ThachAI News",
        viewCount: Math.floor(Math.random() * 200000) + 20000,
        likeCount: Math.floor(Math.random() * 5000) + 500,
        publishedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ['tin tức', 'phân tích', 'vietnamese'],
        trending_score: Math.random() * 10
      });
    });

    return titles.sort((a, b) => b.trending_score - a.trending_score);
  }

  private generateRealisticProducts(cryptoData: any) {
    const basePrice = cryptoData?.bitcoin?.vnd || 1500000000;
    const ethPrice = cryptoData?.ethereum?.vnd || 80000000;
    
    return [
      {
        id: "sp_001",
        name: "iPhone 15 Pro Max 256GB",
        current_price: Math.floor(basePrice * 0.00002) + Math.floor(Math.random() * 1000000),
        original_price: Math.floor(basePrice * 0.000022),
        discount: Math.floor(Math.random() * 20) + 5,
        rating: 4.8,
        sold: Math.floor(Math.random() * 500) + 100,
        shop_name: "Apple Store Official",
        location: "TP. Hồ Chí Minh",
        trending: true
      },
      {
        id: "sp_002", 
        name: "Laptop Gaming ROG Strix G15",
        current_price: Math.floor(ethPrice * 0.0002) + Math.floor(Math.random() * 5000000),
        original_price: Math.floor(ethPrice * 0.00025),
        discount: Math.floor(Math.random() * 15) + 10,
        rating: 4.6,
        sold: Math.floor(Math.random() * 200) + 50,
        shop_name: "ASUS Official Store",
        location: "Hà Nội",
        trending: true
      }
    ];
  }

  private generatePriceAlerts() {
    return [
      {
        id: "alert_001",
        productName: "AirPods Pro Gen 2",
        targetPrice: 5500000,
        currentPrice: 5800000,
        status: "monitoring",
        created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: "alert_002",
        productName: "MacBook Air M2",
        targetPrice: 25000000,
        currentPrice: 24500000,
        status: "triggered",
        created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

// Export singleton instance
export const freeAPIService = new FreeAPIService();