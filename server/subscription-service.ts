import { db } from './db';
import { subscriptions, payments, apiUsage, customerData } from '@shared/schema';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import crypto from 'crypto';

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
  apiLimit: number;
  description: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'basic',
    name: 'Gói Cơ Bản',
    priceMonthly: 299000,
    apiLimit: 1000,
    features: [
      '5 tính năng AI cơ bản',
      '1,000 API calls/tháng',
      'Email support',
      'TikTok content generator',
      'Shopee price monitoring'
    ],
    description: 'Phù hợp cho cá nhân và freelancer'
  },
  {
    id: 'pro',
    name: 'Gói Chuyên Nghiệp',
    priceMonthly: 599000,
    apiLimit: 10000,
    features: [
      'Tất cả 12 tính năng AI',
      '10,000 API calls/tháng',
      'Priority support 24/7',
      'Custom integrations',
      'Advanced analytics',
      'Voice control',
      'Multi-platform management'
    ],
    description: 'Dành cho doanh nghiệp nhỏ và content creator'
  },
  {
    id: 'enterprise',
    name: 'Gói Doanh Nghiệp',
    priceMonthly: 1299000,
    apiLimit: 100000,
    features: [
      'Unlimited API calls',
      'White-label solution',
      'Dedicated account manager',
      'Custom AI training',
      'API access',
      'SLA guarantee',
      'Advanced security'
    ],
    description: 'Giải pháp toàn diện cho doanh nghiệp lớn'
  }
];

export class SubscriptionService {
  async createSubscription(userId: string, planId: string) {
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) {
      throw new Error('Invalid subscription plan');
    }

    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + 7); // 7 days trial

    const subscriptionId = crypto.randomUUID();

    const [subscription] = await db.insert(subscriptions).values({
      id: subscriptionId,
      userId,
      plan: planId,
      status: 'active',
      priceMonthly: plan.priceMonthly.toString(),
      currency: 'VND',
      startDate: now,
      endDate,
      trialEndsAt,
      autoRenew: true
    }).returning();

    return subscription;
  }

  async getUserSubscription(userId: string) {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));

    return subscription;
  }

  async createPayment(subscriptionId: string, userId: string, amount: number, paymentMethod: string) {
    const paymentId = crypto.randomUUID();

    const [payment] = await db.insert(payments).values({
      id: paymentId,
      subscriptionId,
      userId,
      amount: amount.toString(),
      currency: 'VND',
      status: 'pending',
      paymentMethod,
      description: `ThachAI Assistant subscription payment`,
      createdAt: new Date()
    }).returning();

    return payment;
  }

  async trackApiUsage(userId: string, endpoint: string, features: string[] = []) {
    const now = new Date();
    const month = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Check if usage record exists for today
    const [existingUsage] = await db
      .select()
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          eq(apiUsage.endpoint, endpoint),
          gte(apiUsage.date, today)
        )
      );

    if (existingUsage) {
      // Increment existing usage
      await db
        .update(apiUsage)
        .set({
          requestCount: existingUsage.requestCount + 1,
          features: Array.from(new Set([...existingUsage.features, ...features]))
        })
        .where(eq(apiUsage.id, existingUsage.id));
    } else {
      // Create new usage record
      await db.insert(apiUsage).values({
        id: crypto.randomUUID(),
        userId,
        endpoint,
        requestCount: 1,
        date: now,
        month,
        features
      });
    }
  }

  async getApiUsageStats(userId: string, month?: string) {
    const currentMonth = month || `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`;

    const usage = await db
      .select()
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          eq(apiUsage.month, currentMonth)
        )
      );

    const totalRequests = usage.reduce((sum, record) => sum + record.requestCount, 0);
    const endpointStats = usage.reduce((acc, record) => {
      acc[record.endpoint] = (acc[record.endpoint] || 0) + record.requestCount;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalRequests,
      endpointStats,
      month: currentMonth
    };
  }

  async checkApiLimit(userId: string): Promise<{ allowed: boolean; usage: number; limit: number }> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) {
      return { allowed: false, usage: 0, limit: 0 };
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === subscription.plan);
    if (!plan) {
      return { allowed: false, usage: 0, limit: 0 };
    }

    const usageStats = await this.getApiUsageStats(userId);
    const allowed = usageStats.totalRequests < plan.apiLimit;

    return {
      allowed,
      usage: usageStats.totalRequests,
      limit: plan.apiLimit
    };
  }

  async updateCustomerData(userId: string, data: Partial<typeof customerData.$inferInsert>) {
    const existingCustomer = await db
      .select()
      .from(customerData)
      .where(eq(customerData.userId, userId));

    if (existingCustomer.length > 0) {
      await db
        .update(customerData)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(customerData.userId, userId));
    } else {
      await db.insert(customerData).values({
        id: crypto.randomUUID(),
        userId,
        ...data
      });
    }
  }

  async getDashboardAnalytics(userId: string) {
    const subscription = await this.getUserSubscription(userId);
    const usageStats = await this.getApiUsageStats(userId);
    const limitCheck = await this.checkApiLimit(userId);

    const [customer] = await db
      .select()
      .from(customerData)
      .where(eq(customerData.userId, userId));

    return {
      subscription: {
        plan: subscription?.plan || 'none',
        status: subscription?.status || 'inactive',
        trialEndsAt: subscription?.trialEndsAt,
        endDate: subscription?.endDate,
        autoRenew: subscription?.autoRenew || false
      },
      usage: {
        current: limitCheck.usage,
        limit: limitCheck.limit,
        percentage: limitCheck.limit > 0 ? (limitCheck.usage / limitCheck.limit) * 100 : 0,
        endpointStats: usageStats.endpointStats
      },
      customer: customer || null
    };
  }

  async getBusinessMetrics() {
    // Get total active subscriptions
    const activeSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = activeSubscriptions.reduce((sum, sub) => {
      return sum + parseFloat(sub.priceMonthly);
    }, 0);

    // Get customer breakdown by plan
    const planBreakdown = activeSubscriptions.reduce((acc, sub) => {
      acc[sub.plan] = (acc[sub.plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Get payment stats
    const recentPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'completed'))
      .orderBy(desc(payments.createdAt))
      .limit(100);

    return {
      totalCustomers: activeSubscriptions.length,
      mrr,
      planBreakdown,
      recentPayments: recentPayments.length,
      averageRevenue: activeSubscriptions.length > 0 ? mrr / activeSubscriptions.length : 0
    };
  }
}

export const subscriptionService = new SubscriptionService();