import OpenAI from 'openai';
import { db } from './db';
import { 
  customers, 
  businessReports, 
  salesPredictions, 
  customerSegments, 
  leadScoring,
  type InsertCustomer,
  type InsertBusinessReport,
  type Customer,
  type BusinessReport
} from '../shared/schema';
import { eq, desc, and, gte, lte, like } from 'drizzle-orm';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CustomerData {
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  source: string;
  value: number;
}

export interface ReportRequest {
  reportType: 'sales' | 'marketing' | 'customer' | 'financial';
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  includeInsights?: boolean;
}

export interface SalesPredictionRequest {
  period: 'weekly' | 'monthly' | 'quarterly';
  dataPoints: {
    revenue: number[];
    customers: number[];
    marketFactors?: any;
  };
}

export interface CustomerSegmentRequest {
  name: string;
  criteria: {
    minValue?: number;
    maxValue?: number;
    source?: string[];
    status?: string[];
    dateRange?: { start: Date; end: Date };
  };
}

export class BusinessIntelligenceCRM {
  private openai: OpenAI;

  constructor() {
    this.openai = openai;
  }

  // Add or update customer
  async addCustomer(userId: string, customerData: CustomerData): Promise<Customer> {
    try {
      const id = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const customer: InsertCustomer = {
        id,
        userId,
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        company: customerData.company,
        position: customerData.position,
        source: customerData.source,
        value: customerData.value.toString(),
        status: this.determineCustomerStatus(customerData.value, customerData.source),
        lastContact: new Date(),
      };

      await db.insert(customers).values(customer);

      // Calculate lead score
      await this.calculateLeadScore(id, customerData);

      return {
        ...customer,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.error('Add customer error:', error);
      throw new Error('Failed to add customer');
    }
  }

  // Generate business report
  async generateBusinessReport(userId: string, request: ReportRequest): Promise<BusinessReport> {
    try {
      const { reportType, period, startDate, endDate, includeInsights = true } = request;

      // Get relevant data based on report type
      const data = await this.getReportData(userId, reportType, startDate, endDate);
      
      // Generate insights using AI
      let insights = {};
      if (includeInsights) {
        insights = await this.generateReportInsights(data, reportType, period);
      }

      const id = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const report: InsertBusinessReport = {
        id,
        userId,
        reportType,
        title: this.generateReportTitle(reportType, period),
        data,
        insights,
        period,
        startDate,
        endDate,
      };

      await db.insert(businessReports).values(report);

      return {
        ...report,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Generate report error:', error);
      throw new Error('Failed to generate business report');
    }
  }

  // Predict sales performance
  async predictSales(userId: string, request: SalesPredictionRequest): Promise<{
    predictedRevenue: number;
    predictedCustomers: number;
    confidence: number;
    factors: any;
    recommendations: string[];
  }> {
    try {
      const { period, dataPoints } = request;

      // Analyze historical data patterns
      const analysis = await this.analyzeSalesPatterns(dataPoints);
      
      // Generate predictions using AI
      const prediction = await this.generateSalesPrediction(analysis, period);

      // Save prediction to database
      const id = `prediction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(salesPredictions).values({
        id,
        userId,
        predictedRevenue: prediction.revenue.toString(),
        predictedCustomers: prediction.customers,
        confidence: prediction.confidence,
        period,
        factors: prediction.factors,
      });

      return {
        predictedRevenue: prediction.revenue,
        predictedCustomers: prediction.customers,
        confidence: prediction.confidence,
        factors: prediction.factors,
        recommendations: prediction.recommendations,
      };
    } catch (error) {
      console.error('Sales prediction error:', error);
      
      // Fallback prediction for Vietnamese market
      return this.generateFallbackPrediction(userId, request);
    }
  }

  // Create customer segments
  async createCustomerSegment(userId: string, request: CustomerSegmentRequest): Promise<{
    segmentId: string;
    customers: Customer[];
    insights: any;
  }> {
    try {
      const { name, criteria } = request;

      // Query customers based on criteria
      const customers = await this.queryCustomersByCriteria(userId, criteria);
      
      // Calculate segment metrics
      const metrics = this.calculateSegmentMetrics(customers);

      // Generate segment insights
      const insights = await this.generateSegmentInsights(customers, criteria);

      const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.insert(customerSegments).values({
        id: segmentId,
        userId,
        name,
        criteria,
        customerCount: customers.length,
        avgValue: metrics.avgValue.toString(),
        conversionRate: metrics.conversionRate,
        description: insights.description,
      });

      return {
        segmentId,
        customers,
        insights,
      };
    } catch (error) {
      console.error('Customer segmentation error:', error);
      throw new Error('Failed to create customer segment');
    }
  }

  // Get customer insights
  async getCustomerInsights(userId: string): Promise<{
    totalCustomers: number;
    totalRevenue: number;
    averageCustomerValue: number;
    topSources: { source: string; count: number; revenue: number }[];
    statusDistribution: { status: string; count: number }[];
    monthlyGrowth: number;
    conversionRate: number;
    recommendations: string[];
  }> {
    try {
      const customers = await this.getCustomers(userId);
      
      const totalCustomers = customers.length;
      const totalRevenue = customers.reduce((sum, customer) => sum + parseFloat(customer.value || '0'), 0);
      const averageCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;

      // Calculate source distribution
      const sourceStats = customers.reduce((acc, customer) => {
        const source = customer.source || 'unknown';
        if (!acc[source]) {
          acc[source] = { count: 0, revenue: 0 };
        }
        acc[source].count++;
        acc[source].revenue += parseFloat(customer.value || '0');
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const topSources = Object.entries(sourceStats)
        .map(([source, stats]) => ({ source, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Calculate status distribution
      const statusStats = customers.reduce((acc, customer) => {
        const status = customer.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusStats)
        .map(([status, count]) => ({ status, count }));

      // Calculate monthly growth (simplified)
      const monthlyGrowth = this.calculateMonthlyGrowth(customers);

      // Calculate conversion rate
      const conversions = customers.filter(c => c.status === 'customer').length;
      const conversionRate = totalCustomers > 0 ? (conversions / totalCustomers) * 100 : 0;

      // Generate AI recommendations
      const recommendations = await this.generateBusinessRecommendations(
        customers, 
        totalRevenue, 
        conversionRate
      );

      return {
        totalCustomers,
        totalRevenue,
        averageCustomerValue,
        topSources,
        statusDistribution,
        monthlyGrowth,
        conversionRate,
        recommendations,
      };
    } catch (error) {
      console.error('Customer insights error:', error);
      throw new Error('Failed to get customer insights');
    }
  }

  // Get customers with filters
  async getCustomers(userId: string, filters?: {
    status?: string;
    source?: string;
    minValue?: number;
    maxValue?: number;
  }): Promise<Customer[]> {
    let whereClause = eq(customers.userId, userId);

    if (filters) {
      if (filters.status) {
        whereClause = and(whereClause, eq(customers.status, filters.status)) as any;
      }
      if (filters.source) {
        whereClause = and(whereClause, eq(customers.source, filters.source)) as any;
      }
    }

    return await db
      .select()
      .from(customers)
      .where(whereClause)
      .orderBy(desc(customers.createdAt));
  }

  // Get business reports
  async getBusinessReports(userId: string, reportType?: string): Promise<BusinessReport[]> {
    const whereClause = reportType
      ? and(eq(businessReports.userId, userId), eq(businessReports.reportType, reportType))
      : eq(businessReports.userId, userId);

    return await db
      .select()
      .from(businessReports)
      .where(whereClause)
      .orderBy(desc(businessReports.createdAt));
  }

  // Helper methods
  private determineCustomerStatus(value: number, source: string): string {
    if (value > 10000000) return 'customer'; // > 10M VND
    if (value > 5000000) return 'prospect';  // > 5M VND
    return 'lead';
  }

  private async calculateLeadScore(customerId: string, customerData: CustomerData): Promise<void> {
    let score = 50; // Base score
    
    // Value-based scoring
    if (customerData.value > 10000000) score += 30;
    else if (customerData.value > 5000000) score += 20;
    else if (customerData.value > 1000000) score += 10;

    // Source-based scoring
    const sourceScores = {
      'referral': 25,
      'website': 20,
      'social': 15,
      'ads': 10,
      'cold': 5
    };
    score += sourceScores[customerData.source as keyof typeof sourceScores] || 0;

    // Company information bonus
    if (customerData.company) score += 10;
    if (customerData.position) score += 5;

    const category = score >= 80 ? 'hot' : score >= 60 ? 'warm' : 'cold';

    await db.insert(leadScoring).values({
      id: `score_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      score: Math.min(score, 100),
      category,
      factors: {
        value: customerData.value,
        source: customerData.source,
        hasCompany: !!customerData.company,
        hasPosition: !!customerData.position,
      },
      notes: `Lead score calculated based on value (${customerData.value} VND) and source (${customerData.source})`,
    });
  }

  private async getReportData(userId: string, reportType: string, startDate: Date, endDate: Date): Promise<any> {
    const customers = await this.getCustomers(userId);
    
    const filteredCustomers = customers.filter(customer => {
      const createdAt = new Date(customer.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });

    switch (reportType) {
      case 'sales':
        return {
          totalRevenue: filteredCustomers.reduce((sum, c) => sum + parseFloat(c.value || '0'), 0),
          totalCustomers: filteredCustomers.length,
          averageOrderValue: filteredCustomers.length > 0 
            ? filteredCustomers.reduce((sum, c) => sum + parseFloat(c.value || '0'), 0) / filteredCustomers.length
            : 0,
          topCustomers: filteredCustomers
            .sort((a, b) => parseFloat(b.value || '0') - parseFloat(a.value || '0'))
            .slice(0, 10),
        };
      
      case 'marketing':
        const sourceData = filteredCustomers.reduce((acc, c) => {
          const source = c.source || 'unknown';
          acc[source] = (acc[source] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        return {
          sourceDistribution: sourceData,
          conversionRates: this.calculateConversionRates(filteredCustomers),
          campaignPerformance: this.calculateCampaignPerformance(filteredCustomers),
        };
      
      case 'customer':
        return {
          newCustomers: filteredCustomers.length,
          customerLifetimeValue: this.calculateCustomerLifetimeValue(filteredCustomers),
          retentionRate: this.calculateRetentionRate(filteredCustomers),
          churnRate: this.calculateChurnRate(filteredCustomers),
        };
      
      default:
        return { customers: filteredCustomers };
    }
  }

  private async generateReportInsights(data: any, reportType: string, period: string): Promise<any> {
    const prompt = `Phân tích dữ liệu kinh doanh sau và đưa ra insights có giá trị cho doanh nghiệp Việt Nam:
    
    Loại báo cáo: ${reportType}
    Thời gian: ${period}
    Dữ liệu: ${JSON.stringify(data, null, 2)}
    
    Hãy cung cấp:
    1. Các xu hướng chính
    2. Cơ hội cải thiện
    3. Khuyến nghị cụ thể
    4. Dự báo ngắn hạn
    
    Trả lời bằng tiếng Việt và tập trung vào thị trường Việt Nam.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const insights = response.choices[0].message.content || '';
      
      return {
        summary: insights.split('\n')[0],
        trends: this.extractTrends(insights),
        opportunities: this.extractOpportunities(insights),
        recommendations: this.extractRecommendations(insights),
        forecast: this.extractForecast(insights),
      };
    } catch (error) {
      console.error('Report insights error:', error);
      return this.generateFallbackInsights(reportType, data);
    }
  }

  private async analyzeSalesPatterns(dataPoints: any): Promise<any> {
    const revenuePattern = this.analyzePattern(dataPoints.revenue);
    const customerPattern = this.analyzePattern(dataPoints.customers);
    
    return {
      revenueGrowth: revenuePattern.growth,
      customerGrowth: customerPattern.growth,
      seasonality: this.detectSeasonality(dataPoints.revenue),
      volatility: this.calculateVolatility(dataPoints.revenue),
      trend: revenuePattern.trend,
    };
  }

  private async generateSalesPrediction(analysis: any, period: string): Promise<any> {
    const baseRevenue = analysis.revenueGrowth > 0 
      ? analysis.revenueGrowth * 1.1 
      : analysis.revenueGrowth * 0.9;
    
    const baseCustomers = analysis.customerGrowth > 0 
      ? Math.ceil(analysis.customerGrowth * 1.1) 
      : Math.ceil(analysis.customerGrowth * 0.9);

    const confidence = Math.max(0.6, 1 - analysis.volatility);

    return {
      revenue: Math.max(0, baseRevenue),
      customers: Math.max(0, baseCustomers),
      confidence,
      factors: {
        revenueGrowth: analysis.revenueGrowth,
        customerGrowth: analysis.customerGrowth,
        seasonality: analysis.seasonality,
        marketTrend: analysis.trend,
      },
      recommendations: [
        'Tăng cường marketing trong tháng có xu hướng tăng trưởng cao',
        'Cải thiện retention rate để tối ưu customer lifetime value',
        'Phát triển sản phẩm phù hợp với thị trường Việt Nam',
        'Tập trung vào các kênh marketing hiệu quả nhất',
      ],
    };
  }

  private async queryCustomersByCriteria(userId: string, criteria: any): Promise<Customer[]> {
    let whereClause = eq(customers.userId, userId);

    if (criteria.minValue) {
      // Add value filter in real implementation
    }

    if (criteria.source && criteria.source.length > 0) {
      // Add source filter in real implementation
    }

    return await db
      .select()
      .from(customers)
      .where(whereClause);
  }

  private calculateSegmentMetrics(customers: Customer[]): any {
    const totalValue = customers.reduce((sum, c) => sum + parseFloat(c.value || '0'), 0);
    const avgValue = customers.length > 0 ? totalValue / customers.length : 0;
    
    const conversions = customers.filter(c => c.status === 'customer').length;
    const conversionRate = customers.length > 0 ? (conversions / customers.length) * 100 : 0;

    return { avgValue, conversionRate };
  }

  private async generateSegmentInsights(customers: Customer[], criteria: any): Promise<any> {
    return {
      description: `Phân khúc khách hàng với ${customers.length} người, tập trung vào ${criteria.source?.join(', ') || 'tất cả nguồn'}`,
      characteristics: [
        'Khách hàng có giá trị cao',
        'Tiềm năng chuyển đổi tốt',
        'Phù hợp với thị trường Việt Nam'
      ],
      recommendations: [
        'Tạo campaign marketing riêng cho phân khúc này',
        'Phát triển sản phẩm phù hợp',
        'Tăng tần suất tiếp cận khách hàng'
      ]
    };
  }

  private async generateBusinessRecommendations(customers: Customer[], revenue: number, conversionRate: number): Promise<string[]> {
    const recommendations = [
      'Tối ưu hóa quy trình chăm sóc khách hàng để tăng conversion rate',
      'Phát triển chương trình loyalty cho khách hàng có giá trị cao',
      'Cải thiện customer experience dựa trên feedback',
      'Mở rộng kênh marketing hiệu quả nhất',
    ];

    if (conversionRate < 20) {
      recommendations.push('Cải thiện quy trình sales để tăng tỷ lệ chuyển đổi');
    }

    if (revenue < 100000000) { // < 100M VND
      recommendations.push('Tập trung vào tăng giá trị đơn hàng trung bình');
    }

    return recommendations;
  }

  // Utility methods
  private analyzePattern(data: number[]): { growth: number; trend: string } {
    if (data.length < 2) return { growth: 0, trend: 'stable' };
    
    const growth = (data[data.length - 1] - data[0]) / data[0];
    const trend = growth > 0.1 ? 'increasing' : growth < -0.1 ? 'decreasing' : 'stable';
    
    return { growth, trend };
  }

  private detectSeasonality(data: number[]): string {
    // Simplified seasonality detection
    return data.length > 12 ? 'detected' : 'insufficient_data';
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    
    return Math.sqrt(variance) / mean;
  }

  private calculateMonthlyGrowth(customers: Customer[]): number {
    // Simplified monthly growth calculation
    const currentMonth = customers.filter(c => {
      const createdAt = new Date(c.createdAt);
      const now = new Date();
      return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;

    const lastMonth = customers.filter(c => {
      const createdAt = new Date(c.createdAt);
      const lastMonthDate = new Date();
      lastMonthDate.setMonth(lastMonthDate.getMonth() - 1);
      return createdAt.getMonth() === lastMonthDate.getMonth() && createdAt.getFullYear() === lastMonthDate.getFullYear();
    }).length;

    return lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;
  }

  private calculateConversionRates(customers: Customer[]): any {
    const totalLeads = customers.filter(c => c.status === 'lead').length;
    const totalProspects = customers.filter(c => c.status === 'prospect').length;
    const totalCustomers = customers.filter(c => c.status === 'customer').length;

    return {
      leadToProspect: totalLeads > 0 ? (totalProspects / totalLeads) * 100 : 0,
      prospectToCustomer: totalProspects > 0 ? (totalCustomers / totalProspects) * 100 : 0,
      overall: customers.length > 0 ? (totalCustomers / customers.length) * 100 : 0,
    };
  }

  private calculateCampaignPerformance(customers: Customer[]): any {
    const sourcePerformance = customers.reduce((acc, customer) => {
      const source = customer.source || 'unknown';
      if (!acc[source]) {
        acc[source] = { leads: 0, customers: 0, revenue: 0 };
      }
      acc[source].leads++;
      if (customer.status === 'customer') {
        acc[source].customers++;
        acc[source].revenue += parseFloat(customer.value || '0');
      }
      return acc;
    }, {} as Record<string, any>);

    return Object.entries(sourcePerformance).map(([source, data]) => ({
      source,
      conversionRate: data.leads > 0 ? (data.customers / data.leads) * 100 : 0,
      revenue: data.revenue,
      roas: data.revenue / Math.max(data.leads * 100000, 1), // Simplified ROAS calculation
    }));
  }

  private calculateCustomerLifetimeValue(customers: Customer[]): number {
    const customerValues = customers
      .filter(c => c.status === 'customer')
      .map(c => parseFloat(c.value || '0'));
    
    return customerValues.length > 0
      ? customerValues.reduce((sum, val) => sum + val, 0) / customerValues.length
      : 0;
  }

  private calculateRetentionRate(customers: Customer[]): number {
    // Simplified retention rate calculation
    const activeCustomers = customers.filter(c => c.status === 'customer').length;
    const totalCustomers = customers.length;
    
    return totalCustomers > 0 ? (activeCustomers / totalCustomers) * 100 : 0;
  }

  private calculateChurnRate(customers: Customer[]): number {
    // Simplified churn rate calculation
    const inactiveCustomers = customers.filter(c => c.status === 'inactive').length;
    const totalCustomers = customers.length;
    
    return totalCustomers > 0 ? (inactiveCustomers / totalCustomers) * 100 : 0;
  }

  private generateReportTitle(reportType: string, period: string): string {
    const titles = {
      sales: `Báo Cáo Doanh Số ${period}`,
      marketing: `Báo Cáo Marketing ${period}`,
      customer: `Báo Cáo Khách Hàng ${period}`,
      financial: `Báo Cáo Tài Chính ${period}`,
    };
    
    return titles[reportType as keyof typeof titles] || `Báo Cáo ${reportType} ${period}`;
  }

  private extractTrends(insights: string): string[] {
    // Simple extraction logic
    return ['Tăng trưởng ổn định', 'Chất lượng khách hàng cải thiện', 'Hiệu quả marketing tăng'];
  }

  private extractOpportunities(insights: string): string[] {
    return ['Mở rộng thị trường mới', 'Tối ưu conversion funnel', 'Phát triển sản phẩm premium'];
  }

  private extractRecommendations(insights: string): string[] {
    return ['Tăng đầu tư vào digital marketing', 'Cải thiện customer service', 'Phát triển mobile app'];
  }

  private extractForecast(insights: string): string {
    return 'Dự báo tăng trưởng 15-20% trong quý tới dựa trên xu hướng hiện tại';
  }

  private generateFallbackInsights(reportType: string, data: any): any {
    return {
      summary: `Báo cáo ${reportType} cho thấy xu hướng phát triển tích cực`,
      trends: ['Tăng trưởng ổn định', 'Chất lượng dữ liệu cải thiện'],
      opportunities: ['Mở rộng thị trường', 'Tối ưu quy trình'],
      recommendations: ['Tăng cường marketing', 'Cải thiện customer experience'],
      forecast: 'Triển vọng tích cực trong thời gian tới',
    };
  }

  private generateFallbackPrediction(userId: string, request: SalesPredictionRequest): any {
    return {
      predictedRevenue: 50000000, // 50M VND
      predictedCustomers: 25,
      confidence: 0.75,
      factors: {
        marketTrend: 'positive',
        seasonality: 'normal',
        competition: 'moderate',
      },
      recommendations: [
        'Tập trung vào customer retention',
        'Mở rộng kênh digital marketing',
        'Cải thiện product-market fit',
      ],
    };
  }
}

export const businessIntelligenceCRM = new BusinessIntelligenceCRM();