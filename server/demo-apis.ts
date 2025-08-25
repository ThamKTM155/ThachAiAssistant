// Legitimate free API integrations for ThachAI Assistant demo
import axios from 'axios';

export class DemoAPIService {
  
  // Free GitHub API for tech trends
  async getGitHubTrending() {
    try {
      const response = await axios.get('https://api.github.com/search/repositories?q=language:javascript+stars:>1000&sort=updated&order=desc&per_page=10');
      return response.data.items.map(item => ({
        name: item.name,
        description: item.description,
        stars: item.stargazers_count,
        language: item.language,
        updated: item.updated_at,
        url: item.html_url
      }));
    } catch (error) {
      console.error('GitHub API error:', error);
      return [];
    }
  }

  // Free CoinGecko API for cryptocurrency data
  async getCryptocurrencyData() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,binancecoin&vs_currencies=vnd&include_24hr_change=true');
      return response.data;
    } catch (error) {
      console.error('CoinGecko API error:', error);
      return null;
    }
  }

  // Free Reddit API for tech discussions
  async getRedditTechTrends() {
    try {
      const response = await axios.get('https://www.reddit.com/r/technology.json?limit=10');
      return response.data.data.children.map(post => ({
        title: post.data.title,
        score: post.data.score,
        comments: post.data.num_comments,
        created: new Date(post.data.created_utc * 1000).toISOString(),
        url: `https://reddit.com${post.data.permalink}`
      }));
    } catch (error) {
      console.error('Reddit API error:', error);
      return [];
    }
  }

  // Free weather API
  async getWeatherData(city = 'Ho Chi Minh City') {
    try {
      const response = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      return {
        location: city,
        temperature: response.data.current_condition[0].temp_C,
        description: response.data.current_condition[0].weatherDesc[0].value,
        humidity: response.data.current_condition[0].humidity
      };
    } catch (error) {
      console.error('Weather API error:', error);
      return null;
    }
  }

  // Free quotes API
  async getQuote() {
    try {
      const response = await axios.get('https://api.quotable.io/random?tags=inspirational');
      return response.data;
    } catch (error) {
      return {
        content: "Thành công đến từ sự kiên trì và không ngừng học hỏi.",
        author: "ThachAI"
      };
    }
  }

  // Aggregated trending data for content creation
  async getContentTrends() {
    const [github, reddit, crypto, weather, quote] = await Promise.all([
      this.getGitHubTrending(),
      this.getRedditTechTrends(),
      this.getCryptocurrencyData(),
      this.getWeatherData(),
      this.getQuote()
    ]);

    return {
      github_trending: github,
      reddit_discussions: reddit,
      crypto_market: crypto,
      weather_context: weather,
      daily_inspiration: quote,
      fetched_at: new Date().toISOString(),
      data_sources: ['GitHub API', 'Reddit API', 'CoinGecko API', 'wttr.in', 'Quotable API']
    };
  }

  // Generate YouTube-style content suggestions based on real trends
  generateContentSuggestions(trendsData: any) {
    const suggestions = [];
    
    // GitHub trending projects
    if (trendsData.github_trending?.length > 0) {
      trendsData.github_trending.slice(0, 3).forEach(repo => {
        suggestions.push({
          type: 'tutorial',
          title: `🔥 ${repo.name} - Hướng dẫn từ A-Z cho người Việt`,
          description: `Tutorial chi tiết về ${repo.name} với ${repo.stars} stars trên GitHub`,
          keywords: [repo.language, 'tutorial', 'vietnamese', 'programming'],
          estimated_views: Math.floor(repo.stars / 100),
          trending_score: repo.stars
        });
      });
    }

    // Reddit hot topics
    if (trendsData.reddit_discussions?.length > 0) {
      trendsData.reddit_discussions.slice(0, 2).forEach(post => {
        suggestions.push({
          type: 'discussion',
          title: `💭 ${post.title} - Phân tích và thảo luận`,
          description: `Thảo luận về topic hot với ${post.score} upvotes và ${post.comments} comments`,
          keywords: ['technology', 'discussion', 'trending', 'vietnamese'],
          estimated_views: post.score * 10,
          trending_score: post.score
        });
      });
    }

    return suggestions.sort((a, b) => b.trending_score - a.trending_score);
  }

  // Generate market insights based on crypto data
  generateMarketInsights(cryptoData: any) {
    const insights = [];
    
    if (cryptoData) {
      Object.entries(cryptoData).forEach(([coin, data]: [string, any]) => {
        insights.push({
          asset: coin,
          price_vnd: data.vnd,
          change_24h: data.vnd_24h_change,
          market_sentiment: data.vnd_24h_change > 0 ? 'bullish' : 'bearish',
          content_angle: data.vnd_24h_change > 5 ? 'price_surge' : data.vnd_24h_change < -5 ? 'market_dip' : 'stable_analysis'
        });
      });
    }

    return insights;
  }
}

export const demoAPIService = new DemoAPIService();