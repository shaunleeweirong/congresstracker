import { UserFollow } from '../models/UserFollow';
import { User } from '../models/User';
import { CongressionalMember } from '../models/CongressionalMember';

export interface CreateFollowData {
  userId: string;
  traderType: 'congressional' | 'corporate';
  traderId: string;
  billingStatus?: 'active' | 'suspended' | 'cancelled';
}

export interface FollowSummary {
  totalFollows: number;
  activeFollows: number;
  suspendedFollows: number;
  cancelledFollows: number;
  monthlyBill: number;
  nextBillingDate: Date | null;
  byTraderType: {
    congressional: number;
    corporate: number;
  };
}

export interface BillingCalculation {
  totalFollows: number;
  pricePerFollow: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  nextBillingDate: Date;
}

export interface FollowAnalytics {
  follow: UserFollow;
  trader: CongressionalMember;
  totalTrades: number;
  recentTrades: number;
  avgTradeValue: number;
  lastTradeDate: Date | null;
  performance: {
    totalValue: number;
    buyCount: number;
    sellCount: number;
    topStocks: Array<{ symbol: string; count: number; value: number }>;
  };
}

export class FollowService {
  private static readonly PRICE_PER_FOLLOW = 5.00; // $5 per politician per month
  private static readonly MAX_FOLLOWS_FREE = 3;
  private static readonly MAX_FOLLOWS_PREMIUM = 50;
  private static readonly BULK_DISCOUNT_THRESHOLD = 10;
  private static readonly BULK_DISCOUNT_RATE = 0.1; // 10% discount

  /**
   * Follow a politician or trader
   */
  static async createFollow(followData: CreateFollowData): Promise<UserFollow | null> {
    try {
      // Validate user exists and has appropriate subscription
      const user = await User.findById(followData.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check follow limits
      const currentFollows = await UserFollow.countByUser(followData.userId, 'active');
      const maxFollows = user.subscriptionStatus === 'active' 
        ? this.MAX_FOLLOWS_PREMIUM 
        : this.MAX_FOLLOWS_FREE;

      if (currentFollows >= maxFollows) {
        throw new Error(`Follow limit reached. Maximum ${maxFollows} follows allowed.`);
      }

      // Validate trader exists
      if (followData.traderType === 'congressional') {
        const politician = await CongressionalMember.findById(followData.traderId);
        if (!politician) {
          throw new Error('Politician not found');
        }
      }

      // Check for existing follow
      const existingFollow = await UserFollow.findByUserAndTrader(
        followData.userId,
        followData.traderId,
        followData.traderType
      );

      if (existingFollow) {
        // If follow exists but is cancelled, reactivate it
        if (existingFollow.billingStatus === 'cancelled') {
          return await existingFollow.reactivate();
        } else {
          throw new Error('Already following this trader');
        }
      }

      // Set billing status based on user subscription
      const billingStatus = user.subscriptionStatus === 'active' ? 'active' : 'suspended';

      // Create follow
      const follow = await UserFollow.create({
        ...followData,
        billingStatus
      });

      // Update billing if user has active subscription
      if (user.subscriptionStatus === 'active') {
        await this.updateUserBilling(followData.userId);
      }

      return follow;
    } catch (error) {
      console.error('Create follow error:', error);
      throw error;
    }
  }

  /**
   * Unfollow a trader
   */
  static async removeFollow(userId: string, followId: string): Promise<boolean> {
    try {
      const follow = await UserFollow.findById(followId);
      if (!follow) {
        throw new Error('Follow not found');
      }

      // Verify ownership
      if (follow.userId !== userId) {
        throw new Error('Access denied');
      }

      // Cancel follow
      const cancelled = await follow.cancel();
      
      if (cancelled) {
        // Update billing
        await this.updateUserBilling(userId);
      }

      return cancelled;
    } catch (error) {
      console.error('Remove follow error:', error);
      throw error;
    }
  }

  /**
   * Get user's follows
   */
  static async getUserFollows(
    userId: string,
    filters: {
      traderType?: 'congressional' | 'corporate';
      billingStatus?: 'active' | 'suspended' | 'cancelled';
      includeAnalytics?: boolean;
    } = {}
  ): Promise<UserFollow[] | FollowAnalytics[]> {
    try {
      const follows = await UserFollow.findByUser(userId, {
        traderType: filters.traderType,
        billingStatus: filters.billingStatus || 'active'
      });

      if (filters.includeAnalytics) {
        // Get analytics for each follow
        const analyticsPromises = follows.map(follow => 
          this.getFollowAnalytics(follow)
        );
        return await Promise.all(analyticsPromises);
      }

      return follows;
    } catch (error) {
      console.error('Get user follows error:', error);
      return [];
    }
  }

  /**
   * Get follow summary for a user
   */
  static async getFollowSummary(userId: string): Promise<FollowSummary> {
    try {
      const allFollows = await UserFollow.findAllByUser(userId);
      
      const summary: FollowSummary = {
        totalFollows: allFollows.length,
        activeFollows: allFollows.filter(f => f.billingStatus === 'active').length,
        suspendedFollows: allFollows.filter(f => f.billingStatus === 'suspended').length,
        cancelledFollows: allFollows.filter(f => f.billingStatus === 'cancelled').length,
        monthlyBill: 0,
        nextBillingDate: null,
        byTraderType: {
          congressional: allFollows.filter(f => f.traderType === 'congressional').length,
          corporate: allFollows.filter(f => f.traderType === 'corporate').length
        }
      };

      // Calculate billing
      const billingCalc = await this.calculateBilling(userId);
      summary.monthlyBill = billingCalc.total;
      summary.nextBillingDate = billingCalc.nextBillingDate;

      return summary;
    } catch (error) {
      console.error('Get follow summary error:', error);
      return {
        totalFollows: 0,
        activeFollows: 0,
        suspendedFollows: 0,
        cancelledFollows: 0,
        monthlyBill: 0,
        nextBillingDate: null,
        byTraderType: { congressional: 0, corporate: 0 }
      };
    }
  }

  /**
   * Calculate billing for a user
   */
  static async calculateBilling(userId: string): Promise<BillingCalculation> {
    try {
      const activeFollows = await UserFollow.findByUser(userId, { billingStatus: 'active' });
      const totalFollows = activeFollows.length;
      
      const subtotal = totalFollows * this.PRICE_PER_FOLLOW;
      
      // Apply bulk discount
      const discount = totalFollows >= this.BULK_DISCOUNT_THRESHOLD 
        ? subtotal * this.BULK_DISCOUNT_RATE 
        : 0;
      
      // Calculate tax (this would be based on user location in real app)
      const tax = (subtotal - discount) * 0.08; // 8% tax rate
      
      const total = subtotal - discount + tax;
      
      // Next billing date (first of next month)
      const nextBillingDate = new Date();
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      nextBillingDate.setDate(1);
      nextBillingDate.setHours(0, 0, 0, 0);

      return {
        totalFollows,
        pricePerFollow: this.PRICE_PER_FOLLOW,
        subtotal,
        discount,
        tax,
        total,
        nextBillingDate
      };
    } catch (error) {
      console.error('Calculate billing error:', error);
      return {
        totalFollows: 0,
        pricePerFollow: this.PRICE_PER_FOLLOW,
        subtotal: 0,
        discount: 0,
        tax: 0,
        total: 0,
        nextBillingDate: new Date()
      };
    }
  }

  /**
   * Process monthly billing for all users
   */
  static async processMonthlyBilling(): Promise<{ processed: number; failed: number }> {
    let processed = 0;
    let failed = 0;

    try {
      // Get all users with active follows
      const usersWithFollows = await UserFollow.getUsersWithActiveFollows();

      for (const userId of usersWithFollows) {
        try {
          const user = await User.findById(userId);
          if (!user || user.subscriptionStatus !== 'active') {
            continue;
          }

          const billing = await this.calculateBilling(userId);
          
          if (billing.total > 0) {
            // Process payment (integrate with payment processor)
            const paymentResult = await this.processPayment(user, billing);
            
            if (paymentResult.success) {
              // Update billing records
              await this.recordBillingTransaction(userId, billing);
              processed++;
            } else {
              // Suspend follows due to payment failure
              await this.suspendUserFollows(userId, 'payment_failed');
              failed++;
            }
          }
        } catch (error) {
          console.error(`Billing error for user ${userId}:`, error);
          failed++;
        }
      }

      return { processed, failed };
    } catch (error) {
      console.error('Process monthly billing error:', error);
      return { processed, failed };
    }
  }

  /**
   * Suspend user follows
   */
  static async suspendUserFollows(userId: string, reason: string): Promise<number> {
    try {
      const activeFollows = await UserFollow.findByUser(userId, { billingStatus: 'active' });
      let suspendedCount = 0;

      for (const follow of activeFollows) {
        const suspended = await follow.suspend(reason);
        if (suspended) suspendedCount++;
      }

      return suspendedCount;
    } catch (error) {
      console.error('Suspend user follows error:', error);
      return 0;
    }
  }

  /**
   * Reactivate user follows
   */
  static async reactivateUserFollows(userId: string): Promise<number> {
    try {
      const suspendedFollows = await UserFollow.findByUser(userId, { billingStatus: 'suspended' });
      let reactivatedCount = 0;

      for (const follow of suspendedFollows) {
        const reactivated = await follow.reactivate();
        if (reactivated) reactivatedCount++;
      }

      if (reactivatedCount > 0) {
        await this.updateUserBilling(userId);
      }

      return reactivatedCount;
    } catch (error) {
      console.error('Reactivate user follows error:', error);
      return 0;
    }
  }

  /**
   * Get analytics for a specific follow
   */
  static async getFollowAnalytics(follow: UserFollow): Promise<FollowAnalytics> {
    try {
      // Get trader information
      let trader: CongressionalMember | null = null;
      if (follow.traderType === 'congressional') {
        trader = await CongressionalMember.findById(follow.traderId);
      }

      if (!trader) {
        throw new Error('Trader not found');
      }

      // Get trade statistics
      const tradeStats = await this.getTraderStatistics(follow.traderId, follow.traderType);

      return {
        follow,
        trader,
        totalTrades: tradeStats.totalTrades,
        recentTrades: tradeStats.recentTrades,
        avgTradeValue: tradeStats.avgTradeValue,
        lastTradeDate: tradeStats.lastTradeDate,
        performance: tradeStats.performance
      };
    } catch (error) {
      console.error('Get follow analytics error:', error);
      // Return default analytics on error
      return {
        follow,
        trader: {} as CongressionalMember,
        totalTrades: 0,
        recentTrades: 0,
        avgTradeValue: 0,
        lastTradeDate: null,
        performance: {
          totalValue: 0,
          buyCount: 0,
          sellCount: 0,
          topStocks: []
        }
      };
    }
  }

  /**
   * Get popular politicians to follow
   */
  static async getPopularFollows(limit: number = 20): Promise<Array<{
    politician: CongressionalMember;
    followCount: number;
    recentTradeCount: number;
    avgTradeValue: number;
  }>> {
    try {
      return await UserFollow.getPopularTraders('congressional', limit);
    } catch (error) {
      console.error('Get popular follows error:', error);
      return [];
    }
  }

  /**
   * Update user billing after follow changes
   */
  private static async updateUserBilling(userId: string): Promise<void> {
    try {
      const user = await User.findById(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return;
      }

      const billing = await this.calculateBilling(userId);
      
      // Update user's next billing amount
      // This would typically update a billing record in the database
      console.log(`Updated billing for user ${userId}: $${billing.total.toFixed(2)}`);
    } catch (error) {
      console.error('Update user billing error:', error);
    }
  }

  /**
   * Process payment (integration point for payment processor)
   */
  private static async processPayment(
    user: User, 
    billing: BillingCalculation
  ): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // This would integrate with Stripe, PayPal, etc.
      // For now, simulate payment processing
      
      if (billing.total <= 0) {
        return { success: true };
      }

      // Simulate payment processing
      console.log(`Processing payment for ${user.email}: $${billing.total.toFixed(2)}`);
      
      // In real implementation, you would:
      // 1. Get user's payment method
      // 2. Create charge with payment processor
      // 3. Handle payment result
      
      return { 
        success: true, 
        transactionId: `txn_${Date.now()}_${user.id}` 
      };
    } catch (error) {
      console.error('Process payment error:', error);
      return { 
        success: false, 
        error: 'Payment processing failed' 
      };
    }
  }

  /**
   * Record billing transaction
   */
  private static async recordBillingTransaction(
    userId: string, 
    billing: BillingCalculation
  ): Promise<void> {
    try {
      // This would typically create a billing transaction record
      // For now, just log the transaction
      console.log(`Billing transaction recorded for user ${userId}:`, {
        amount: billing.total,
        follows: billing.totalFollows,
        date: new Date().toISOString()
      });
    } catch (error) {
      console.error('Record billing transaction error:', error);
    }
  }

  /**
   * Get trader statistics
   */
  private static async getTraderStatistics(
    traderId: string, 
    traderType: string
  ): Promise<any> {
    try {
      // This would query the StockTrade model for statistics
      // For now, return mock data
      return {
        totalTrades: 0,
        recentTrades: 0,
        avgTradeValue: 0,
        lastTradeDate: null,
        performance: {
          totalValue: 0,
          buyCount: 0,
          sellCount: 0,
          topStocks: []
        }
      };
    } catch (error) {
      console.error('Get trader statistics error:', error);
      return {
        totalTrades: 0,
        recentTrades: 0,
        avgTradeValue: 0,
        lastTradeDate: null,
        performance: {
          totalValue: 0,
          buyCount: 0,
          sellCount: 0,
          topStocks: []
        }
      };
    }
  }
}

export default FollowService;