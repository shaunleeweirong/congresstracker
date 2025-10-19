import { StockTrade } from '../models/StockTrade';
import { CongressionalMember } from '../models/CongressionalMember';
import { StockTicker } from '../models/StockTicker';

export interface PortfolioConcentration {
  traderId: string;
  traderName: string;
  traderType: 'congressional' | 'corporate';
  totalPositions: number;
  totalValue: number;
  concentrationScore: number; // 0-100, higher = more concentrated
  topHoldings: Array<{
    symbol: string;
    companyName: string;
    value: number;
    percentage: number;
    positionCount: number;
    sector: string;
  }>;
  sectorDistribution: Array<{
    sector: string;
    value: number;
    percentage: number;
    positionCount: number;
  }>;
  riskMetrics: {
    diversificationRatio: number;
    herfindahlIndex: number;
    largestPosition: number;
    top5Concentration: number;
  };
}

export interface TradingPatterns {
  traderId: string;
  timeframe: 'month' | 'quarter' | 'year';
  patterns: {
    buyVsSellRatio: number;
    avgTradeSize: number;
    tradingFrequency: number; // trades per month
    preferredSectors: Array<{ sector: string; percentage: number }>;
    seasonality: Array<{ month: number; tradeCount: number; avgValue: number }>;
    consistencyScore: number; // 0-100, higher = more consistent
  };
  performance: {
    totalValue: number;
    avgReturn: number; // estimated based on price changes
    winRate: number; // percentage of profitable trades
    bestPerformingStock: { symbol: string; return: number };
    worstPerformingStock: { symbol: string; return: number };
  };
}

export interface MarketTrends {
  timeframe: 'day' | 'week' | 'month' | 'quarter';
  totalTrades: number;
  totalValue: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  topSectors: Array<{
    sector: string;
    tradeCount: number;
    totalValue: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }>;
  topStocks: Array<{
    symbol: string;
    companyName: string;
    tradeCount: number;
    totalValue: number;
    uniqueTraders: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }>;
  mostActiveTraders: Array<{
    traderId: string;
    traderName: string;
    tradeCount: number;
    totalValue: number;
  }>;
}

export interface ComparisonAnalysis {
  traderA: {
    id: string;
    name: string;
    metrics: any;
  };
  traderB: {
    id: string;
    name: string;
    metrics: any;
  };
  comparison: {
    diversification: 'A' | 'B' | 'equal';
    activity: 'A' | 'B' | 'equal';
    performance: 'A' | 'B' | 'equal';
    riskLevel: 'A' | 'B' | 'equal';
  };
  insights: string[];
}

export class AnalyticsService {
  private static readonly CACHE_TTL = 3600; // 1 hour cache
  private static readonly HIGH_CONCENTRATION_THRESHOLD = 70;
  private static readonly DIVERSIFICATION_THRESHOLD = 10; // minimum positions for good diversification

  /**
   * Calculate portfolio concentration for a trader
   */
  static async getPortfolioConcentration(
    traderId: string,
    timeframe: 'month' | 'quarter' | 'year' | 'all' = 'year'
  ): Promise<PortfolioConcentration | null> {
    try {
      // Get trader information
      const trader = await CongressionalMember.findById(traderId);
      if (!trader) {
        throw new Error('Trader not found');
      }

      // Get trades for the specified timeframe
      const trades = await this.getTraderTrades(traderId, timeframe);
      if (trades.length === 0) {
        return null;
      }

      // Calculate current positions (net holdings)
      const positions = this.calculateNetPositions(trades);
      const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
      const totalAbsoluteValue = positions.reduce((sum, pos) => sum + Math.abs(pos.value), 0);

      // Calculate top holdings
      const topHoldings = await this.enrichHoldings(
        positions.slice(0, 20).map(pos => ({
          symbol: pos.symbol,
          companyName: pos.companyName || pos.symbol,
          value: pos.value,
          percentage: totalAbsoluteValue > 0 ? (Math.abs(pos.value) / totalAbsoluteValue) * 100 : 0,
          positionCount: pos.transactionCount,
          sector: pos.sector || 'Unknown',
          latestTransactionDate: pos.latestTransactionDate
        }))
      );

      // Calculate sector distribution
      const sectorDistribution = this.calculateSectorDistribution(positions, totalValue);

      // Calculate concentration metrics
      const concentrationScore = this.calculateConcentrationScore(positions);
      const riskMetrics = this.calculateRiskMetrics(positions, totalValue);

      return {
        traderId,
        traderName: trader.name,
        traderType: 'congressional',
        totalPositions: positions.length,
        totalValue,
        concentrationScore,
        topHoldings,
        sectorDistribution,
        riskMetrics
      };
    } catch (error) {
      console.error('Get portfolio concentration error:', error);
      return null;
    }
  }

  /**
   * Analyze trading patterns for a trader
   */
  static async getTradingPatterns(
    traderId: string,
    timeframe: 'month' | 'quarter' | 'year' = 'year'
  ): Promise<TradingPatterns | null> {
    try {
      const trader = await CongressionalMember.findById(traderId);
      if (!trader) {
        throw new Error('Trader not found');
      }

      const trades = await this.getTraderTrades(traderId, timeframe);
      if (trades.length === 0) {
        return null;
      }

      // Calculate trading patterns
      const patterns = this.analyzeTradingPatterns(trades, timeframe);
      const performance = await this.calculateTraderPerformance(trades);

      return {
        traderId,
        timeframe,
        patterns,
        performance
      };
    } catch (error) {
      console.error('Get trading patterns error:', error);
      return null;
    }
  }

  /**
   * Get market trends analysis
   */
  static async getMarketTrends(
    timeframe: 'day' | 'week' | 'month' | 'quarter' = 'month'
  ): Promise<MarketTrends> {
    try {
      const startDate = this.getTimeframeStartDate(timeframe);
      const trades = await StockTrade.findByDateRange(startDate, new Date());

      const totalTrades = trades.length;
      const totalValue = trades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0);

      // Calculate market sentiment
      const buyTrades = trades.filter(t => t.transactionType === 'buy').length;
      const sellTrades = trades.filter(t => t.transactionType === 'sell').length;
      const marketSentiment = this.calculateMarketSentiment(buyTrades, sellTrades);

      // Calculate top sectors
      const topSectors = await this.getTopSectors(trades);

      // Calculate top stocks
      const topStocks = await this.getTopStocks(trades);

      // Get most active traders
      const mostActiveTraders = await this.getMostActiveTraders(trades);

      return {
        timeframe,
        totalTrades,
        totalValue,
        marketSentiment,
        topSectors,
        topStocks,
        mostActiveTraders
      };
    } catch (error) {
      console.error('Get market trends error:', error);
      return {
        timeframe,
        totalTrades: 0,
        totalValue: 0,
        marketSentiment: 'neutral',
        topSectors: [],
        topStocks: [],
        mostActiveTraders: []
      };
    }
  }

  /**
   * Compare two traders
   */
  static async compareTraders(
    traderAId: string,
    traderBId: string,
    timeframe: 'month' | 'quarter' | 'year' = 'year'
  ): Promise<ComparisonAnalysis | null> {
    try {
      // Get analytics for both traders
      const [concentrationA, concentrationB, patternsA, patternsB] = await Promise.all([
        this.getPortfolioConcentration(traderAId, timeframe),
        this.getPortfolioConcentration(traderBId, timeframe),
        this.getTradingPatterns(traderAId, timeframe),
        this.getTradingPatterns(traderBId, timeframe)
      ]);

      if (!concentrationA || !concentrationB || !patternsA || !patternsB) {
        return null;
      }

      // Perform comparison
      const comparison = {
        diversification: this.compareDiversification(concentrationA, concentrationB),
        activity: this.compareActivity(patternsA, patternsB),
        performance: this.comparePerformance(patternsA, patternsB),
        riskLevel: this.compareRiskLevel(concentrationA, concentrationB)
      };

      const insights = this.generateComparisonInsights(
        concentrationA,
        concentrationB,
        patternsA,
        patternsB,
        comparison
      );

      return {
        traderA: {
          id: traderAId,
          name: concentrationA.traderName,
          metrics: { concentration: concentrationA, patterns: patternsA }
        },
        traderB: {
          id: traderBId,
          name: concentrationB.traderName,
          metrics: { concentration: concentrationB, patterns: patternsB }
        },
        comparison,
        insights
      };
    } catch (error) {
      console.error('Compare traders error:', error);
      return null;
    }
  }

  /**
   * Get performance benchmarks
   */
  static async getPerformanceBenchmarks(
    timeframe: 'month' | 'quarter' | 'year' = 'year'
  ): Promise<{
    avgPortfolioSize: number;
    avgConcentration: number;
    avgTradingFrequency: number;
    topPerformers: Array<{ traderId: string; traderName: string; score: number }>;
    mostDiversified: Array<{ traderId: string; traderName: string; score: number }>;
    mostActive: Array<{ traderId: string; traderName: string; tradeCount: number }>;
  }> {
    try {
      // This would calculate benchmarks across all traders
      // For now, return mock data structure
      return {
        avgPortfolioSize: 0,
        avgConcentration: 0,
        avgTradingFrequency: 0,
        topPerformers: [],
        mostDiversified: [],
        mostActive: []
      };
    } catch (error) {
      console.error('Get performance benchmarks error:', error);
      return {
        avgPortfolioSize: 0,
        avgConcentration: 0,
        avgTradingFrequency: 0,
        topPerformers: [],
        mostDiversified: [],
        mostActive: []
      };
    }
  }

  /**
   * Get trader trades for a timeframe
   */
  private static async getTraderTrades(
    traderId: string,
    timeframe: string
  ): Promise<StockTrade[]> {
    const startDate = timeframe === 'all' ? null : this.getTimeframeStartDate(timeframe);

    if (startDate) {
      return await StockTrade.findByTraderAndDateRange(traderId, startDate, new Date());
    } else {
      // Fetch all trades for this congressional member
      const { trades } = await StockTrade.findWithFilters(
        { traderId, traderType: 'congressional' },
        10000, // high limit to get all trades
        0
      );
      return trades;
    }
  }

  /**
   * Calculate net positions from trades
   */
  private static calculateNetPositions(trades: StockTrade[]): Array<{
    symbol: string;
    companyName?: string;
    sector?: string;
    value: number;
    shares: number;
    transactionCount: number;
    latestTransactionDate?: string;
  }> {
    const positions = new Map();

    for (const trade of trades) {
      const key = trade.tickerSymbol;
      const existing = positions.get(key) || {
        symbol: trade.tickerSymbol,
        value: 0,
        shares: 0,
        transactionCount: 0,
        latestTransactionDate: trade.transactionDate
      };

      // Handle different transaction types
      let multiplier = 0;
      if (trade.transactionType === 'buy' || trade.transactionType === 'purchase') {
        multiplier = 1;  // Add to position
      } else if (trade.transactionType === 'sell' || trade.transactionType === 'sale') {
        multiplier = -1; // Subtract from position
      } else if (trade.transactionType === 'exchange') {
        multiplier = 0;  // Neutral - don't count exchanges as buys or sells
      }

      existing.value += (parseFloat(trade.estimatedValue as any) || 0) * multiplier;
      existing.shares += (trade.quantity || 0) * multiplier;
      existing.transactionCount += 1;

      // Track latest transaction date
      if (trade.transactionDate > existing.latestTransactionDate) {
        existing.latestTransactionDate = trade.transactionDate;
      }

      positions.set(key, existing);
    }

    return Array.from(positions.values())
      .filter(pos => Math.abs(pos.value) > 0) // Only positions with value
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }

  /**
   * Enrich holdings with company and sector data
   */
  private static async enrichHoldings(holdings: any[]): Promise<any[]> {
    const enriched = [];

    for (const holding of holdings) {
      try {
        const stock = await StockTicker.findBySymbol(holding.symbol);
        enriched.push({
          ...holding,
          companyName: stock?.companyName || holding.symbol,
          sector: stock?.sector || 'Unknown'
        });
      } catch (error) {
        enriched.push(holding);
      }
    }

    return enriched;
  }

  /**
   * Calculate sector distribution
   */
  private static calculateSectorDistribution(positions: any[], totalValue: number): any[] {
    const sectorMap = new Map();

    for (const position of positions) {
      const sector = position.sector || 'Unknown';
      const existing = sectorMap.get(sector) || { value: 0, positionCount: 0 };
      
      existing.value += Math.abs(position.value);
      existing.positionCount += 1;
      
      sectorMap.set(sector, existing);
    }

    return Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        value: data.value,
        percentage: (data.value / totalValue) * 100,
        positionCount: data.positionCount
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Calculate concentration score
   */
  private static calculateConcentrationScore(positions: any[]): number {
    if (positions.length === 0) return 0;

    const totalValue = positions.reduce((sum, pos) => sum + Math.abs(pos.value), 0);
    const topPosition = Math.abs(positions[0]?.value || 0);
    const top5Value = positions.slice(0, 5).reduce((sum, pos) => sum + Math.abs(pos.value), 0);

    const top5Percentage = (top5Value / totalValue) * 100;
    const topPositionPercentage = (topPosition / totalValue) * 100;

    // Score based on concentration (0-100, higher = more concentrated)
    return Math.min(100, Math.max(0, topPositionPercentage + (top5Percentage / 2)));
  }

  /**
   * Calculate risk metrics
   */
  private static calculateRiskMetrics(positions: any[], totalValue: number): any {
    if (positions.length === 0) {
      return {
        diversificationRatio: 0,
        herfindahlIndex: 1,
        largestPosition: 0,
        top5Concentration: 0
      };
    }

    const largestPosition = (Math.abs(positions[0]?.value || 0) / totalValue) * 100;
    const top5Concentration = positions.slice(0, 5)
      .reduce((sum, pos) => sum + Math.abs(pos.value), 0) / totalValue * 100;

    // Herfindahl Index (0-1, higher = more concentrated)
    const herfindahlIndex = positions.reduce((sum, pos) => {
      const weight = Math.abs(pos.value) / totalValue;
      return sum + (weight * weight);
    }, 0);

    // Diversification ratio (inverse of concentration)
    const diversificationRatio = Math.max(0, 100 - (herfindahlIndex * 100));

    return {
      diversificationRatio,
      herfindahlIndex,
      largestPosition,
      top5Concentration
    };
  }

  /**
   * Analyze trading patterns
   */
  private static analyzeTradingPatterns(trades: StockTrade[], timeframe: string): any {
    const buyTrades = trades.filter(t => t.transactionType === 'buy');
    const sellTrades = trades.filter(t => t.transactionType === 'sell');

    const buyVsSellRatio = sellTrades.length > 0 ? buyTrades.length / sellTrades.length : buyTrades.length;
    const avgTradeSize = trades.reduce((sum, t) => sum + (t.estimatedValue || 0), 0) / trades.length;

    // Calculate trading frequency (trades per month)
    const months = timeframe === 'month' ? 1 : timeframe === 'quarter' ? 3 : 12;
    const tradingFrequency = trades.length / months;

    return {
      buyVsSellRatio,
      avgTradeSize,
      tradingFrequency,
      preferredSectors: [],
      seasonality: [],
      consistencyScore: 50 // Placeholder
    };
  }

  /**
   * Calculate trader performance
   */
  private static async calculateTraderPerformance(trades: StockTrade[]): Promise<any> {
    const totalValue = trades.reduce((sum, trade) => sum + (trade.estimatedValue || 0), 0);

    return {
      totalValue,
      avgReturn: 0, // Would require price data
      winRate: 50, // Would require performance tracking
      bestPerformingStock: { symbol: 'N/A', return: 0 },
      worstPerformingStock: { symbol: 'N/A', return: 0 }
    };
  }

  /**
   * Calculate market sentiment
   */
  private static calculateMarketSentiment(buyTrades: number, sellTrades: number): 'bullish' | 'bearish' | 'neutral' {
    const ratio = buyTrades / (buyTrades + sellTrades);
    
    if (ratio > 0.6) return 'bullish';
    if (ratio < 0.4) return 'bearish';
    return 'neutral';
  }

  /**
   * Get top sectors from trades
   */
  private static async getTopSectors(trades: StockTrade[]): Promise<any[]> {
    // This would aggregate trades by sector
    // For now, return empty array
    return [];
  }

  /**
   * Get top stocks from trades
   */
  private static async getTopStocks(trades: StockTrade[]): Promise<any[]> {
    // This would aggregate trades by stock
    // For now, return empty array
    return [];
  }

  /**
   * Get most active traders
   */
  private static async getMostActiveTraders(trades: StockTrade[]): Promise<any[]> {
    // This would aggregate trades by trader
    // For now, return empty array
    return [];
  }

  /**
   * Comparison helper methods
   */
  private static compareDiversification(a: PortfolioConcentration, b: PortfolioConcentration): 'A' | 'B' | 'equal' {
    if (Math.abs(a.concentrationScore - b.concentrationScore) < 5) return 'equal';
    return a.concentrationScore < b.concentrationScore ? 'A' : 'B'; // Lower concentration = better diversification
  }

  private static compareActivity(a: TradingPatterns, b: TradingPatterns): 'A' | 'B' | 'equal' {
    if (Math.abs(a.patterns.tradingFrequency - b.patterns.tradingFrequency) < 1) return 'equal';
    return a.patterns.tradingFrequency > b.patterns.tradingFrequency ? 'A' : 'B';
  }

  private static comparePerformance(a: TradingPatterns, b: TradingPatterns): 'A' | 'B' | 'equal' {
    if (Math.abs(a.performance.avgReturn - b.performance.avgReturn) < 1) return 'equal';
    return a.performance.avgReturn > b.performance.avgReturn ? 'A' : 'B';
  }

  private static compareRiskLevel(a: PortfolioConcentration, b: PortfolioConcentration): 'A' | 'B' | 'equal' {
    if (Math.abs(a.concentrationScore - b.concentrationScore) < 5) return 'equal';
    return a.concentrationScore < b.concentrationScore ? 'A' : 'B'; // Lower concentration = lower risk
  }

  /**
   * Generate comparison insights
   */
  private static generateComparisonInsights(
    concentrationA: PortfolioConcentration,
    concentrationB: PortfolioConcentration,
    patternsA: TradingPatterns,
    patternsB: TradingPatterns,
    comparison: any
  ): string[] {
    const insights: string[] = [];

    if (comparison.diversification === 'A') {
      insights.push(`${concentrationA.traderName} has a more diversified portfolio with ${concentrationA.totalPositions} positions vs ${concentrationB.totalPositions}`);
    } else if (comparison.diversification === 'B') {
      insights.push(`${concentrationB.traderName} has a more diversified portfolio with ${concentrationB.totalPositions} positions vs ${concentrationA.totalPositions}`);
    }

    if (comparison.activity === 'A') {
      insights.push(`${concentrationA.traderName} trades more frequently (${patternsA.patterns.tradingFrequency.toFixed(1)} trades/month vs ${patternsB.patterns.tradingFrequency.toFixed(1)})`);
    } else if (comparison.activity === 'B') {
      insights.push(`${concentrationB.traderName} trades more frequently (${patternsB.patterns.tradingFrequency.toFixed(1)} trades/month vs ${patternsA.patterns.tradingFrequency.toFixed(1)})`);
    }

    return insights;
  }

  /**
   * Get start date for timeframe
   */
  private static getTimeframeStartDate(timeframe: string): Date {
    const now = new Date();
    const startDate = new Date(now);

    switch (timeframe) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return startDate;
  }
}

export default AnalyticsService;