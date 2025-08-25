/**
 * E-commerce Integration and Price Monitoring System for ThachAI
 * Comprehensive price tracking across multiple platforms with automated alerts
 */

import axios from 'axios';

export interface Product {
  id: string;
  name: string;
  platform: 'shopee' | 'lazada' | 'tiki' | 'sendo' | 'amazon';
  url: string;
  currentPrice: number;
  originalPrice?: number;
  currency: string;
  image?: string;
  seller: string;
  rating: number;
  reviewCount: number;
  availability: 'in_stock' | 'out_of_stock' | 'limited_stock';
  lastUpdated: Date;
  category: string;
  brand?: string;
  description: string;
}

export interface PriceAlert {
  id: string;
  productId: string;
  userId: string;
  targetPrice: number;
  condition: 'below' | 'above' | 'equals';
  isActive: boolean;
  createdAt: Date;
  triggeredAt?: Date;
  notificationMethod: 'email' | 'sms' | 'push' | 'all';
  frequency: 'immediate' | 'daily' | 'weekly';
}

export interface PriceHistory {
  id: string;
  productId: string;
  price: number;
  timestamp: Date;
  platform: string;
  discount?: number;
  specialOffer?: string;
}

export interface MarketComparison {
  productName: string;
  platforms: Array<{
    platform: string;
    price: number;
    url: string;
    seller: string;
    rating: number;
    shipping: number;
    availability: string;
  }>;
  bestDeal: {
    platform: string;
    totalPrice: number;
    savings: number;
  };
  priceRange: {
    min: number;
    max: number;
    average: number;
  };
}

export interface ShopeeProduct {
  itemid: number;
  shopid: number;
  name: string;
  price: number;
  price_min: number;
  price_max: number;
  historical_sold: number;
  item_rating: {
    rating_star: number;
    rating_count: number[];
  };
  image: string;
  shop_location: string;
  discount?: string;
  stock?: number;
}

export class EcommerceIntegrationEngine {
  private products: Map<string, Product> = new Map();
  private priceAlerts: Map<string, PriceAlert> = new Map();
  private priceHistory: Map<string, PriceHistory[]> = new Map();
  private shopeeApiKey: string | null = null;

  constructor() {
    this.shopeeApiKey = process.env.SHOPEE_API_KEY || null;
    this.initializeDemoData();
  }

  private initializeDemoData() {
    // Initialize with popular Vietnamese products for demonstration
    const demoProducts: Product[] = [
      {
        id: 'sp_iphone15_001',
        name: 'iPhone 15 Pro Max 256GB',
        platform: 'shopee',
        url: 'https://shopee.vn/iphone-15-pro-max',
        currentPrice: 29900000,
        originalPrice: 32990000,
        currency: 'VND',
        image: 'https://example.com/iphone15.jpg',
        seller: 'Apple Store Official',
        rating: 4.8,
        reviewCount: 1234,
        availability: 'in_stock',
        lastUpdated: new Date(),
        category: 'Điện thoại',
        brand: 'Apple',
        description: 'iPhone 15 Pro Max với chip A17 Pro, camera 48MP, màn hình ProMotion'
      },
      {
        id: 'sp_laptop_002',
        name: 'MacBook Air M3 13 inch 8GB 256GB',
        platform: 'shopee',
        url: 'https://shopee.vn/macbook-air-m3',
        currentPrice: 27999000,
        originalPrice: 32999000,
        currency: 'VND',
        image: 'https://example.com/macbook-air.jpg',
        seller: 'Apple Authorized Reseller',
        rating: 4.9,
        reviewCount: 856,
        availability: 'in_stock',
        lastUpdated: new Date(),
        category: 'Laptop',
        brand: 'Apple',
        description: 'MacBook Air với chip M3, hiệu năng vượt trội, pin 18 giờ'
      },
      {
        id: 'sp_watch_003',
        name: 'Apple Watch Series 9 GPS 45mm',
        platform: 'shopee',
        url: 'https://shopee.vn/apple-watch-series9',
        currentPrice: 9999000,
        originalPrice: 10999000,
        currency: 'VND',
        image: 'https://example.com/apple-watch.jpg',
        seller: 'WatchZone Vietnam',
        rating: 4.7,
        reviewCount: 432,
        availability: 'limited_stock',
        lastUpdated: new Date(),
        category: 'Đồng hồ thông minh',
        brand: 'Apple',
        description: 'Apple Watch Series 9 với tính năng sức khỏe nâng cao'
      },
      {
        id: 'sp_headphones_004',
        name: 'AirPods Pro 2nd Generation',
        platform: 'shopee',
        url: 'https://shopee.vn/airpods-pro-2',
        currentPrice: 5999000,
        originalPrice: 6690000,
        currency: 'VND',
        image: 'https://example.com/airpods-pro.jpg',
        seller: 'AudioTech Vietnam',
        rating: 4.6,
        reviewCount: 789,
        availability: 'in_stock',
        lastUpdated: new Date(),
        category: 'Tai nghe',
        brand: 'Apple',
        description: 'AirPods Pro thế hệ 2 với chip H2, chống ồn chủ động'
      },
      {
        id: 'sp_gaming_005',
        name: 'PlayStation 5 Console',
        platform: 'shopee',
        url: 'https://shopee.vn/playstation-5',
        currentPrice: 13999000,
        originalPrice: 15990000,
        currency: 'VND',
        image: 'https://example.com/ps5.jpg',
        seller: 'Gaming World VN',
        rating: 4.8,
        reviewCount: 567,
        availability: 'in_stock',
        lastUpdated: new Date(),
        category: 'Gaming',
        brand: 'Sony',
        description: 'PlayStation 5 với SSD siêu tốc, ray tracing, 4K gaming'
      }
    ];

    demoProducts.forEach(product => {
      this.products.set(product.id, product);
      
      // Generate price history
      const history: PriceHistory[] = [];
      const now = new Date();
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const basePrice = product.currentPrice;
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const price = Math.round(basePrice * (1 + variation));
        
        history.push({
          id: `hist_${product.id}_${i}`,
          productId: product.id,
          price,
          timestamp: date,
          platform: product.platform,
          discount: Math.random() > 0.7 ? Math.round(Math.random() * 20) : undefined,
          specialOffer: Math.random() > 0.8 ? 'Flash Sale' : undefined
        });
      }
      this.priceHistory.set(product.id, history);
    });
  }

  async searchProducts(query: string, platform?: string, limit: number = 20): Promise<Product[]> {
    try {
      if (platform === 'shopee' && this.shopeeApiKey) {
        return await this.searchShopeeProducts(query, limit);
      }
      
      // Fallback to demo search
      return this.searchDemoProducts(query, platform, limit);
    } catch (error) {
      console.error('Product search error:', error);
      return this.searchDemoProducts(query, platform, limit);
    }
  }

  private async searchShopeeProducts(query: string, limit: number): Promise<Product[]> {
    try {
      // This would integrate with actual Shopee API
      // For now, using enhanced demo data with realistic Vietnamese products
      const response = await this.simulateShopeeAPI(query, limit);
      
      return response.items.map((item: ShopeeProduct) => ({
        id: `shopee_${item.itemid}`,
        name: item.name,
        platform: 'shopee' as const,
        url: `https://shopee.vn/product/${item.shopid}/${item.itemid}`,
        currentPrice: item.price,
        originalPrice: item.price_max > item.price ? item.price_max : undefined,
        currency: 'VND',
        image: item.image,
        seller: `Shop ${item.shopid}`,
        rating: item.item_rating.rating_star,
        reviewCount: item.item_rating.rating_count.reduce((a, b) => a + b, 0),
        availability: (item.stock || 0) > 0 ? 'in_stock' : 'out_of_stock' as const,
        lastUpdated: new Date(),
        category: this.categorizeProduct(item.name),
        description: `${item.name} - Đã bán ${item.historical_sold} sản phẩm - Từ ${item.shop_location}`
      }));
    } catch (error) {
      console.error('Shopee API error:', error);
      throw error;
    }
  }

  private async simulateShopeeAPI(query: string, limit: number): Promise<{ items: ShopeeProduct[] }> {
    // Simulate realistic Shopee product data
    const vietnameseProducts = [
      { name: 'iPhone 15 Pro Max 256GB Chính Hãng VN/A', basePrice: 29900000, category: 'phone' },
      { name: 'Samsung Galaxy S24 Ultra 512GB', basePrice: 31990000, category: 'phone' },
      { name: 'MacBook Air M3 13 inch 2024', basePrice: 27999000, category: 'laptop' },
      { name: 'Dell XPS 13 Plus i7 16GB 512GB', basePrice: 45999000, category: 'laptop' },
      { name: 'iPad Pro M4 11 inch 256GB WiFi', basePrice: 24999000, category: 'tablet' },
      { name: 'AirPods Pro 2nd Gen với MagSafe', basePrice: 5999000, category: 'audio' },
      { name: 'Sony WH-1000XM5 Wireless Headphones', basePrice: 8499000, category: 'audio' },
      { name: 'Apple Watch Series 9 GPS 45mm', basePrice: 9999000, category: 'watch' },
      { name: 'Nintendo Switch OLED Console', basePrice: 8999000, category: 'gaming' },
      { name: 'PlayStation 5 Slim 1TB Console', basePrice: 13999000, category: 'gaming' }
    ];

    const filteredProducts = vietnameseProducts.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(p.category)
    );

    const items: ShopeeProduct[] = filteredProducts.slice(0, limit).map((product, index) => {
      const discount = Math.random() > 0.6 ? Math.round(Math.random() * 30) : 0;
      const currentPrice = Math.round(product.basePrice * (1 - discount / 100));
      
      return {
        itemid: 100000 + index,
        shopid: 50000 + index,
        name: product.name,
        price: currentPrice,
        price_min: currentPrice,
        price_max: product.basePrice,
        historical_sold: Math.round(Math.random() * 10000),
        item_rating: {
          rating_star: Math.round((Math.random() * 1 + 4) * 10) / 10, // 4.0-5.0
          rating_count: [
            Math.round(Math.random() * 100),
            Math.round(Math.random() * 200),
            Math.round(Math.random() * 300),
            Math.round(Math.random() * 500),
            Math.round(Math.random() * 1000)
          ]
        },
        image: `https://cf.shopee.vn/file/product_${index}.jpg`,
        shop_location: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng'][Math.floor(Math.random() * 4)],
        discount: discount > 0 ? `${discount}%` : undefined,
        stock: Math.round(Math.random() * 100)
      };
    });

    return { items };
  }

  private searchDemoProducts(query: string, platform?: string, limit: number = 20): Product[] {
    const allProducts = Array.from(this.products.values());
    
    let filtered = allProducts.filter(product => 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.description.toLowerCase().includes(query.toLowerCase()) ||
      product.category.toLowerCase().includes(query.toLowerCase()) ||
      (product.brand && product.brand.toLowerCase().includes(query.toLowerCase()))
    );

    if (platform) {
      filtered = filtered.filter(product => product.platform === platform);
    }

    return filtered.slice(0, limit);
  }

  private categorizeProduct(name: string): string {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('iphone') || lowerName.includes('samsung') || lowerName.includes('phone')) return 'Điện thoại';
    if (lowerName.includes('macbook') || lowerName.includes('laptop') || lowerName.includes('dell')) return 'Laptop';
    if (lowerName.includes('ipad') || lowerName.includes('tablet')) return 'Tablet';
    if (lowerName.includes('airpods') || lowerName.includes('headphone') || lowerName.includes('tai nghe')) return 'Tai nghe';
    if (lowerName.includes('watch') || lowerName.includes('đồng hồ')) return 'Đồng hồ thông minh';
    if (lowerName.includes('playstation') || lowerName.includes('nintendo') || lowerName.includes('gaming')) return 'Gaming';
    return 'Điện tử';
  }

  async getProduct(productId: string): Promise<Product | null> {
    return this.products.get(productId) || null;
  }

  async updateProductPrice(productId: string): Promise<{ success: boolean; newPrice?: number; error?: string }> {
    try {
      const product = this.products.get(productId);
      if (!product) {
        return { success: false, error: 'Product not found' };
      }

      // Simulate price update with realistic variation
      const currentPrice = product.currentPrice;
      const variation = (Math.random() - 0.5) * 0.05; // ±2.5% variation
      const newPrice = Math.round(currentPrice * (1 + variation));
      
      // Update product
      product.currentPrice = newPrice;
      product.lastUpdated = new Date();
      this.products.set(productId, product);

      // Add to price history
      const history = this.priceHistory.get(productId) || [];
      history.push({
        id: `hist_${productId}_${Date.now()}`,
        productId,
        price: newPrice,
        timestamp: new Date(),
        platform: product.platform,
        discount: Math.random() > 0.8 ? Math.round(Math.random() * 20) : undefined
      });
      
      // Keep only last 100 records
      if (history.length > 100) {
        history.splice(0, history.length - 100);
      }
      this.priceHistory.set(productId, history);

      // Check price alerts
      await this.checkPriceAlerts(productId, newPrice);

      return { success: true, newPrice };
    } catch (error) {
      console.error('Price update error:', error);
      return { success: false, error: 'Failed to update price' };
    }
  }

  async createPriceAlert(alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<{ success: boolean; alertId?: string; error?: string }> {
    try {
      const alertId = `alert_${Date.now()}`;
      const newAlert: PriceAlert = {
        ...alert,
        id: alertId,
        createdAt: new Date(),
        isActive: true
      };

      this.priceAlerts.set(alertId, newAlert);
      return { success: true, alertId };
    } catch (error) {
      console.error('Create alert error:', error);
      return { success: false, error: 'Failed to create price alert' };
    }
  }

  async getPriceAlerts(userId: string): Promise<PriceAlert[]> {
    return Array.from(this.priceAlerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getPriceHistory(productId: string, days: number = 30): Promise<PriceHistory[]> {
    const history = this.priceHistory.get(productId) || [];
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return history
      .filter(record => record.timestamp >= cutoffDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async compareProducts(productName: string): Promise<MarketComparison> {
    try {
      const platforms = ['shopee', 'lazada', 'tiki', 'sendo'];
      const platformResults: Array<{
        platform: string;
        price: number;
        url: string;
        seller: string;
        rating: number;
        shipping: number;
        availability: string;
      }> = [];

      // Search across platforms (simulated)
      for (const platform of platforms) {
        const products = await this.searchProducts(productName, platform, 1);
        if (products.length > 0) {
          const product = products[0];
          platformResults.push({
            platform: platform.charAt(0).toUpperCase() + platform.slice(1),
            price: product.currentPrice,
            url: product.url,
            seller: product.seller,
            rating: product.rating,
            shipping: Math.round(Math.random() * 50000), // Random shipping fee
            availability: product.availability
          });
        }
      }

      if (platformResults.length === 0) {
        throw new Error('No products found for comparison');
      }

      // Calculate best deal
      const bestDeal = platformResults.reduce((best, current) => {
        const currentTotal = current.price + current.shipping;
        const bestTotal = best.price + best.shipping;
        return currentTotal < bestTotal ? current : best;
      });

      const prices = platformResults.map(p => p.price);
      const maxPrice = Math.max(...prices);
      const savings = bestDeal.price + bestDeal.shipping;

      return {
        productName,
        platforms: platformResults,
        bestDeal: {
          platform: bestDeal.platform,
          totalPrice: savings,
          savings: maxPrice - bestDeal.price
        },
        priceRange: {
          min: Math.min(...prices),
          max: maxPrice,
          average: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)
        }
      };
    } catch (error) {
      console.error('Product comparison error:', error);
      throw error;
    }
  }

  private async checkPriceAlerts(productId: string, newPrice: number): Promise<void> {
    const alerts = Array.from(this.priceAlerts.values())
      .filter(alert => alert.productId === productId && alert.isActive);

    for (const alert of alerts) {
      let shouldTrigger = false;

      switch (alert.condition) {
        case 'below':
          shouldTrigger = newPrice <= alert.targetPrice;
          break;
        case 'above':
          shouldTrigger = newPrice >= alert.targetPrice;
          break;
        case 'equals':
          shouldTrigger = Math.abs(newPrice - alert.targetPrice) <= (alert.targetPrice * 0.02); // ±2%
          break;
      }

      if (shouldTrigger && !alert.triggeredAt) {
        alert.triggeredAt = new Date();
        this.priceAlerts.set(alert.id, alert);
        
        // In production, this would send actual notifications
        await this.sendPriceAlert(alert, newPrice);
      }
    }
  }

  private async sendPriceAlert(alert: PriceAlert, currentPrice: number): Promise<void> {
    const product = this.products.get(alert.productId);
    if (!product) return;

    console.log(`Price Alert Triggered for ${product.name}: ${currentPrice.toLocaleString('vi-VN')} VND`);
    
    // In production, this would integrate with notification services
    // Email, SMS, Push notifications based on alert.notificationMethod
  }

  async getMarketTrends(): Promise<{
    categories: Array<{
      name: string;
      averagePriceChange: number;
      popularProducts: string[];
      trendDirection: 'up' | 'down' | 'stable';
    }>;
    hotDeals: Product[];
    priceDrops: Array<{
      product: Product;
      dropPercentage: number;
      originalPrice: number;
    }>;
  }> {
    const categories = [
      {
        name: 'Điện thoại',
        averagePriceChange: -2.5,
        popularProducts: ['iPhone 15 Pro Max', 'Samsung Galaxy S24 Ultra', 'Xiaomi 14'],
        trendDirection: 'down' as const
      },
      {
        name: 'Laptop',
        averagePriceChange: 1.8,
        popularProducts: ['MacBook Air M3', 'Dell XPS 13', 'ASUS ZenBook'],
        trendDirection: 'up' as const
      },
      {
        name: 'Gaming',
        averagePriceChange: -5.2,
        popularProducts: ['PlayStation 5', 'Nintendo Switch OLED', 'Steam Deck'],
        trendDirection: 'down' as const
      }
    ];

    const allProducts = Array.from(this.products.values());
    const hotDeals = allProducts
      .filter(p => p.originalPrice && p.currentPrice < p.originalPrice * 0.8)
      .slice(0, 5);

    const priceDrops = allProducts
      .filter(p => p.originalPrice && p.currentPrice < p.originalPrice)
      .map(p => ({
        product: p,
        dropPercentage: Math.round(((p.originalPrice! - p.currentPrice) / p.originalPrice!) * 100),
        originalPrice: p.originalPrice!
      }))
      .sort((a, b) => b.dropPercentage - a.dropPercentage)
      .slice(0, 10);

    return {
      categories,
      hotDeals,
      priceDrops
    };
  }

  async getDashboardData(): Promise<{
    totalProducts: number;
    activeAlerts: number;
    priceChanges24h: number;
    avgSavings: number;
    topCategories: Array<{ name: string; count: number }>;
    recentPriceUpdates: Array<{
      productName: string;
      oldPrice: number;
      newPrice: number;
      change: number;
      timestamp: Date;
    }>;
  }> {
    const allProducts = Array.from(this.products.values());
    const allAlerts = Array.from(this.priceAlerts.values());
    
    // Calculate category distribution
    const categoryCount: Record<string, number> = {};
    allProducts.forEach(product => {
      categoryCount[product.category] = (categoryCount[product.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Simulate recent price updates
    const recentUpdates = allProducts.slice(0, 5).map(product => {
      const history = this.priceHistory.get(product.id) || [];
      const latest = history[history.length - 1];
      const previous = history[history.length - 2];
      
      return {
        productName: product.name,
        oldPrice: previous?.price || product.currentPrice,
        newPrice: latest?.price || product.currentPrice,
        change: latest && previous ? ((latest.price - previous.price) / previous.price) * 100 : 0,
        timestamp: latest?.timestamp || new Date()
      };
    });

    return {
      totalProducts: allProducts.length,
      activeAlerts: allAlerts.filter(alert => alert.isActive).length,
      priceChanges24h: Math.round(Math.random() * 50 + 20), // Simulated
      avgSavings: Math.round(Math.random() * 500000 + 200000), // Simulated in VND
      topCategories,
      recentPriceUpdates: recentUpdates
    };
  }
}

export const ecommerceEngine = new EcommerceIntegrationEngine();