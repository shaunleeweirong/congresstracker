import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';

export class AnalyticsController {
  /**
   * Get portfolio concentration analysis for a trader
   */
  static async getPortfolioConcentration(req: Request, res: Response): Promise<void> {
    try {
      const { traderId } = req.params;
      const { timeframe } = req.query;

      if (!traderId) {
        res.status(400).json({
          success: false,
          error: 'traderId is required'
        });
        return;
      }

      const validTimeframes = ['month', 'quarter', 'year', 'all'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", "year", or "all"'
        });
        return;
      }

      const concentration = await AnalyticsService.getPortfolioConcentration(
        traderId,
        tf as 'month' | 'quarter' | 'year' | 'all'
      );

      if (!concentration) {
        res.status(404).json({
          success: false,
          error: 'Trader not found or no trading data available'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: concentration
      });
    } catch (error) {
      console.error('Get portfolio concentration controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during portfolio concentration analysis'
      });
    }
  }

  /**
   * Get trading patterns analysis for a trader
   */
  static async getTradingPatterns(req: Request, res: Response): Promise<void> {
    try {
      const { traderId } = req.params;
      const { timeframe } = req.query;

      if (!traderId) {
        res.status(400).json({
          success: false,
          error: 'traderId is required'
        });
        return;
      }

      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      const patterns = await AnalyticsService.getTradingPatterns(
        traderId,
        tf as 'month' | 'quarter' | 'year'
      );

      if (!patterns) {
        res.status(404).json({
          success: false,
          error: 'Trader not found or no trading data available'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: patterns
      });
    } catch (error) {
      console.error('Get trading patterns controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trading patterns analysis'
      });
    }
  }

  /**
   * Get market trends analysis
   */
  static async getMarketTrends(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe } = req.query;

      const validTimeframes = ['day', 'week', 'month', 'quarter'];
      const tf = (timeframe as string) || 'month';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "day", "week", "month", or "quarter"'
        });
        return;
      }

      const trends = await AnalyticsService.getMarketTrends(
        tf as 'day' | 'week' | 'month' | 'quarter'
      );

      res.status(200).json({
        success: true,
        data: trends
      });
    } catch (error) {
      console.error('Get market trends controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during market trends analysis'
      });
    }
  }

  /**
   * Compare two traders
   */
  static async compareTraders(req: Request, res: Response): Promise<void> {
    try {
      const { traderAId, traderBId } = req.params;
      const { timeframe } = req.query;

      if (!traderAId || !traderBId) {
        res.status(400).json({
          success: false,
          error: 'Both traderAId and traderBId are required'
        });
        return;
      }

      if (traderAId === traderBId) {
        res.status(400).json({
          success: false,
          error: 'Cannot compare a trader with themselves'
        });
        return;
      }

      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      const comparison = await AnalyticsService.compareTraders(
        traderAId,
        traderBId,
        tf as 'month' | 'quarter' | 'year'
      );

      if (!comparison) {
        res.status(404).json({
          success: false,
          error: 'One or both traders not found or insufficient trading data'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: comparison
      });
    } catch (error) {
      console.error('Compare traders controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trader comparison'
      });
    }
  }

  /**
   * Get performance benchmarks
   */
  static async getPerformanceBenchmarks(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe } = req.query;

      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      const benchmarks = await AnalyticsService.getPerformanceBenchmarks(
        tf as 'month' | 'quarter' | 'year'
      );

      res.status(200).json({
        success: true,
        data: benchmarks
      });
    } catch (error) {
      console.error('Get performance benchmarks controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during performance benchmarks fetch'
      });
    }
  }

  /**
   * Get trader ranking based on various metrics
   */
  static async getTraderRankings(req: Request, res: Response): Promise<void> {
    try {
      const { 
        metric,
        timeframe,
        traderType,
        limit,
        offset
      } = req.query;

      // Validate metric
      const validMetrics = [
        'portfolio_value',
        'diversification',
        'trading_frequency',
        'performance',
        'concentration_score'
      ];
      const metricValue = (metric as string) || 'portfolio_value';
      
      if (!validMetrics.includes(metricValue)) {
        res.status(400).json({
          success: false,
          error: 'metric must be "portfolio_value", "diversification", "trading_frequency", "performance", or "concentration_score"'
        });
        return;
      }

      // Validate timeframe
      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      // Validate trader type
      if (traderType && !['congressional', 'corporate'].includes(traderType as string)) {
        res.status(400).json({
          success: false,
          error: 'traderType must be "congressional" or "corporate"'
        });
        return;
      }

      // Validate pagination
      let limitNum = 20;
      if (limit) {
        limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          res.status(400).json({
            success: false,
            error: 'limit must be between 1 and 100'
          });
          return;
        }
      }

      let offsetNum = 0;
      if (offset) {
        offsetNum = parseInt(offset as string);
        if (isNaN(offsetNum) || offsetNum < 0) {
          res.status(400).json({
            success: false,
            error: 'offset must be non-negative'
          });
          return;
        }
      }

      // For now, return empty rankings as this would require complex implementation
      res.status(200).json({
        success: true,
        data: {
          rankings: [],
          total: 0,
          metric: metricValue,
          timeframe: tf,
          traderType: traderType || 'all',
          pagination: {
            limit: limitNum,
            offset: offsetNum,
            hasMore: false
          }
        }
      });
    } catch (error) {
      console.error('Get trader rankings controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during trader rankings fetch'
      });
    }
  }

  /**
   * Get sector performance analysis
   */
  static async getSectorAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { timeframe, sector } = req.query;

      const validTimeframes = ['day', 'week', 'month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'month';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "day", "week", "month", "quarter", or "year"'
        });
        return;
      }

      // For now, return basic sector analysis structure
      res.status(200).json({
        success: true,
        data: {
          timeframe: tf,
          sector: sector || 'all',
          metrics: {
            totalTrades: 0,
            totalValue: 0,
            avgTradeSize: 0,
            uniqueTraders: 0,
            sentiment: 'neutral' as const
          },
          topStocks: [],
          topTraders: [],
          performanceComparison: []
        }
      });
    } catch (error) {
      console.error('Get sector analysis controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during sector analysis'
      });
    }
  }

  /**
   * Get correlation analysis between traders or sectors
   */
  static async getCorrelationAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { 
        analysisType,
        entityIds,
        timeframe
      } = req.query;

      // Validate analysis type
      if (!analysisType || !['trader', 'sector'].includes(analysisType as string)) {
        res.status(400).json({
          success: false,
          error: 'analysisType must be "trader" or "sector"'
        });
        return;
      }

      // Validate entity IDs
      if (!entityIds) {
        res.status(400).json({
          success: false,
          error: 'entityIds are required'
        });
        return;
      }

      let entityIdArray: string[] = [];
      if (typeof entityIds === 'string') {
        entityIdArray = entityIds.split(',');
      } else if (Array.isArray(entityIds)) {
        entityIdArray = entityIds as string[];
      }

      if (entityIdArray.length < 2) {
        res.status(400).json({
          success: false,
          error: 'At least 2 entities are required for correlation analysis'
        });
        return;
      }

      if (entityIdArray.length > 10) {
        res.status(400).json({
          success: false,
          error: 'Maximum 10 entities allowed for correlation analysis'
        });
        return;
      }

      // Validate timeframe
      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      // For now, return basic correlation analysis structure
      res.status(200).json({
        success: true,
        data: {
          analysisType,
          timeframe: tf,
          entities: entityIdArray,
          correlationMatrix: [],
          insights: [],
          methodology: 'Pearson correlation coefficient',
          significanceLevel: 0.05
        }
      });
    } catch (error) {
      console.error('Get correlation analysis controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during correlation analysis'
      });
    }
  }

  /**
   * Get risk assessment for a trader
   */
  static async getRiskAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { traderId } = req.params;
      const { timeframe } = req.query;

      if (!traderId) {
        res.status(400).json({
          success: false,
          error: 'traderId is required'
        });
        return;
      }

      const validTimeframes = ['month', 'quarter', 'year'];
      const tf = (timeframe as string) || 'year';
      
      if (!validTimeframes.includes(tf)) {
        res.status(400).json({
          success: false,
          error: 'timeframe must be "month", "quarter", or "year"'
        });
        return;
      }

      // Get portfolio concentration which includes risk metrics
      const concentration = await AnalyticsService.getPortfolioConcentration(
        traderId,
        tf as 'month' | 'quarter' | 'year'
      );

      if (!concentration) {
        res.status(404).json({
          success: false,
          error: 'Trader not found or no trading data available'
        });
        return;
      }

      // Extract and enhance risk metrics
      const riskAssessment = {
        traderId,
        traderName: concentration.traderName,
        timeframe: tf,
        riskScore: Math.round(concentration.concentrationScore), // 0-100, higher = more risky
        riskLevel: concentration.concentrationScore > 70 ? 'High' : 
                  concentration.concentrationScore > 40 ? 'Medium' : 'Low',
        metrics: concentration.riskMetrics,
        portfolioMetrics: {
          totalPositions: concentration.totalPositions,
          totalValue: concentration.totalValue,
          concentrationScore: concentration.concentrationScore
        },
        recommendations: [
          concentration.concentrationScore > 70 ? 'Consider diversifying portfolio across more positions' : null,
          concentration.riskMetrics.largestPosition > 25 ? 'Largest position represents significant portfolio risk' : null,
          concentration.totalPositions < 10 ? 'Portfolio may benefit from additional diversification' : null
        ].filter(Boolean)
      };

      res.status(200).json({
        success: true,
        data: riskAssessment
      });
    } catch (error) {
      console.error('Get risk assessment controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during risk assessment'
      });
    }
  }
}

export default AnalyticsController;