import { Request, Response } from 'express';
import { SearchService, SearchOptions, PoliticianSearchFilters, StockSearchFilters } from '../services/SearchService';

export class SearchController {
  /**
   * Unified search across politicians and stocks
   */
  static async searchAll(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, type, limit, offset } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const searchOptions: SearchOptions = {
        query: query.trim(),
        type: type as 'politician' | 'stock' | 'all' || 'all',
        limit: limit ? parseInt(limit as string) : 20,
        offset: offset ? parseInt(offset as string) : 0
      };

      // Validate type parameter
      if (searchOptions.type && !['politician', 'stock', 'all'].includes(searchOptions.type)) {
        res.status(400).json({
          success: false,
          error: 'Type must be "politician", "stock", or "all"'
        });
        return;
      }

      // Validate limit and offset
      if (searchOptions.limit && (searchOptions.limit < 1 || searchOptions.limit > 100)) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100'
        });
        return;
      }

      if (searchOptions.offset && searchOptions.offset < 0) {
        res.status(400).json({
          success: false,
          error: 'Offset must be non-negative'
        });
        return;
      }

      const result = await SearchService.searchAll(searchOptions);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during search'
      });
    }
  }

  /**
   * Search politicians with filters
   */
  static async searchPoliticians(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, state, position, party, active, limit, offset } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const filters: PoliticianSearchFilters = {};
      
      if (state) filters.state = state as string;
      if (position) {
        if (!['senator', 'representative'].includes(position as string)) {
          res.status(400).json({
            success: false,
            error: 'Position must be "senator" or "representative"'
          });
          return;
        }
        filters.position = position as 'senator' | 'representative';
      }
      if (party) {
        if (!['democratic', 'republican', 'independent', 'other'].includes(party as string)) {
          res.status(400).json({
            success: false,
            error: 'Party must be "democratic", "republican", "independent", or "other"'
          });
          return;
        }
        filters.party = party as 'democratic' | 'republican' | 'independent' | 'other';
      }
      if (active !== undefined) {
        filters.active = active === 'true';
      }

      const searchLimit = limit ? parseInt(limit as string) : undefined;
      const searchOffset = offset ? parseInt(offset as string) : undefined;

      if (searchLimit && (searchLimit < 1 || searchLimit > 100)) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100'
        });
        return;
      }

      if (searchOffset && searchOffset < 0) {
        res.status(400).json({
          success: false,
          error: 'Offset must be non-negative'
        });
        return;
      }

      const searchOptions: SearchOptions = {
        query: query.trim()
      };
      if (searchLimit !== undefined) searchOptions.limit = searchLimit;
      if (searchOffset !== undefined) searchOptions.offset = searchOffset;

      const result = await SearchService.searchPoliticians(
        searchOptions,
        filters
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search politicians controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during politician search'
      });
    }
  }

  /**
   * Search stocks with filters
   */
  static async searchStocks(req: Request, res: Response): Promise<void> {
    try {
      const { 
        q: query, 
        sector, 
        industry, 
        minMarketCap, 
        maxMarketCap,
        minPrice,
        maxPrice,
        limit, 
        offset 
      } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      const filters: StockSearchFilters = {};
      
      if (sector) filters.sector = sector as string;
      if (industry) filters.industry = industry as string;
      
      if (minMarketCap) {
        const min = parseFloat(minMarketCap as string);
        if (isNaN(min) || min < 0) {
          res.status(400).json({
            success: false,
            error: 'minMarketCap must be a non-negative number'
          });
          return;
        }
        filters.minMarketCap = min;
      }

      if (maxMarketCap) {
        const max = parseFloat(maxMarketCap as string);
        if (isNaN(max) || max < 0) {
          res.status(400).json({
            success: false,
            error: 'maxMarketCap must be a non-negative number'
          });
          return;
        }
        filters.maxMarketCap = max;
      }

      if (minPrice) {
        const min = parseFloat(minPrice as string);
        if (isNaN(min) || min < 0) {
          res.status(400).json({
            success: false,
            error: 'minPrice must be a non-negative number'
          });
          return;
        }
        filters.minPrice = min;
      }

      if (maxPrice) {
        const max = parseFloat(maxPrice as string);
        if (isNaN(max) || max < 0) {
          res.status(400).json({
            success: false,
            error: 'maxPrice must be a non-negative number'
          });
          return;
        }
        filters.maxPrice = max;
      }

      // Validate min/max relationships
      if (filters.minMarketCap && filters.maxMarketCap && filters.minMarketCap > filters.maxMarketCap) {
        res.status(400).json({
          success: false,
          error: 'minMarketCap cannot be greater than maxMarketCap'
        });
        return;
      }

      if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
        res.status(400).json({
          success: false,
          error: 'minPrice cannot be greater than maxPrice'
        });
        return;
      }

      const searchLimit = limit ? parseInt(limit as string) : undefined;
      const searchOffset = offset ? parseInt(offset as string) : undefined;

      if (searchLimit && (searchLimit < 1 || searchLimit > 100)) {
        res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100'
        });
        return;
      }

      if (searchOffset && searchOffset < 0) {
        res.status(400).json({
          success: false,
          error: 'Offset must be non-negative'
        });
        return;
      }

      const searchOptions: SearchOptions = {
        query: query.trim()
      };
      if (searchLimit !== undefined) searchOptions.limit = searchLimit;
      if (searchOffset !== undefined) searchOptions.offset = searchOffset;

      const result = await SearchService.searchStocks(
        searchOptions,
        filters
      );

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error('Search stocks controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during stock search'
      });
    }
  }

  /**
   * Get search suggestions for autocomplete
   */
  static async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const { q: query, type } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({
          success: false,
          error: 'Search query is required'
        });
        return;
      }

      if (query.trim().length < 2) {
        res.status(400).json({
          success: false,
          error: 'Query must be at least 2 characters long'
        });
        return;
      }

      const searchType = type as 'politician' | 'stock' | 'all' || 'all';

      if (!['politician', 'stock', 'all'].includes(searchType)) {
        res.status(400).json({
          success: false,
          error: 'Type must be "politician", "stock", or "all"'
        });
        return;
      }

      const suggestions = await SearchService.getSearchSuggestions(query.trim(), searchType);

      res.status(200).json({
        success: true,
        data: suggestions
      });
    } catch (error) {
      console.error('Search suggestions controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during suggestions fetch'
      });
    }
  }

  /**
   * Get popular searches
   */
  static async getPopularSearches(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.query;
      const searchType = type as 'politician' | 'stock' | 'all' || 'all';

      if (!['politician', 'stock', 'all'].includes(searchType)) {
        res.status(400).json({
          success: false,
          error: 'Type must be "politician", "stock", or "all"'
        });
        return;
      }

      const popularSearches = await SearchService.getPopularSearches(searchType);

      res.status(200).json({
        success: true,
        data: popularSearches
      });
    } catch (error) {
      console.error('Popular searches controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during popular searches fetch'
      });
    }
  }

  /**
   * Get advanced search filters metadata
   */
  static async getSearchFilters(req: Request, res: Response): Promise<void> {
    try {
      // Return mock filters for now
      const filters = {
        sectors: ['Technology', 'Healthcare', 'Finance', 'Energy'],
        states: ['CA', 'NY', 'TX', 'FL'],
        parties: ['democratic', 'republican', 'independent'],
        positions: ['senator', 'representative']
      };

      res.status(200).json({
        success: true,
        data: filters
      });
    } catch (error) {
      console.error('Search filters controller error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error during search filters fetch'
      });
    }
  }
}

export default SearchController;