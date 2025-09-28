import { CongressionalMember } from '../models/CongressionalMember';
import { StockTicker } from '../models/StockTicker';

export interface SearchOptions {
  query: string;
  type?: 'politician' | 'stock' | 'all';
  limit?: number;
  offset?: number;
}

export interface PoliticianSearchFilters {
  state?: string;
  position?: 'senator' | 'representative';
  party?: 'democratic' | 'republican' | 'independent' | 'other';
  active?: boolean;
}

export interface StockSearchFilters {
  sector?: string;
  industry?: string;
  minMarketCap?: number;
  maxMarketCap?: number;
  minPrice?: number;
  maxPrice?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
  query: string;
  type: string;
}

export interface UnifiedSearchResult {
  politicians: SearchResult<CongressionalMember>;
  stocks: SearchResult<StockTicker>;
  total: number;
  query: string;
}

export class SearchService {
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Unified search across politicians and stocks
   */
  static async searchAll(options: SearchOptions): Promise<UnifiedSearchResult> {
    const { query, limit = this.DEFAULT_LIMIT, offset = 0 } = options;
    
    // Validate inputs
    const validatedLimit = Math.min(limit, this.MAX_LIMIT);
    const validatedOffset = Math.max(offset, 0);

    try {
      // Search both politicians and stocks in parallel
      const [politicianResults, stockResults] = await Promise.all([
        this.searchPoliticians({
          query,
          limit: validatedLimit,
          offset: validatedOffset
        }),
        this.searchStocks({
          query,
          limit: validatedLimit,
          offset: validatedOffset
        })
      ]);

      return {
        politicians: politicianResults,
        stocks: stockResults,
        total: politicianResults.total + stockResults.total,
        query
      };
    } catch (error) {
      console.error('Unified search error:', error);
      return {
        politicians: { items: [], total: 0, hasMore: false, query, type: 'politician' },
        stocks: { items: [], total: 0, hasMore: false, query, type: 'stock' },
        total: 0,
        query
      };
    }
  }

  /**
   * Search politicians with optional filters
   */
  static async searchPoliticians(
    options: SearchOptions,
    filters?: PoliticianSearchFilters
  ): Promise<SearchResult<CongressionalMember>> {
    const { query, limit = this.DEFAULT_LIMIT, offset = 0 } = options;
    
    // Validate inputs
    const validatedLimit = Math.min(limit, this.MAX_LIMIT);
    const validatedOffset = Math.max(offset, 0);

    try {
      // Build search criteria
      const searchCriteria: any = {};

      // Add text search
      if (query && query.trim()) {
        searchCriteria.query = query.trim();
      }

      // Add filters
      if (filters) {
        if (filters.state) {
          searchCriteria.stateCode = filters.state.toUpperCase();
        }
        if (filters.position) {
          searchCriteria.position = filters.position;
        }
        if (filters.party) {
          searchCriteria.partyAffiliation = filters.party;
        }
        if (filters.active !== undefined) {
          // Filter for active members (no end date or end date in future)
          searchCriteria.active = filters.active;
        }
      }

      // Search politicians
      const politicians = await CongressionalMember.search(
        query,
        validatedLimit
      );

      return {
        items: politicians,
        total: politicians.length,
        hasMore: politicians.length === validatedLimit,
        query,
        type: 'politician'
      };
    } catch (error) {
      console.error('Politician search error:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
        query,
        type: 'politician'
      };
    }
  }

  /**
   * Search stocks with optional filters
   */
  static async searchStocks(
    options: SearchOptions,
    filters?: StockSearchFilters
  ): Promise<SearchResult<StockTicker>> {
    const { query, limit = this.DEFAULT_LIMIT, offset = 0 } = options;
    
    // Validate inputs
    const validatedLimit = Math.min(limit, this.MAX_LIMIT);
    const validatedOffset = Math.max(offset, 0);

    try {
      // Build search criteria
      const searchCriteria: any = {};

      // Add text search
      if (query && query.trim()) {
        searchCriteria.query = query.trim();
      }

      // Add filters
      if (filters) {
        if (filters.sector) {
          searchCriteria.sector = filters.sector;
        }
        if (filters.industry) {
          searchCriteria.industry = filters.industry;
        }
        if (filters.minMarketCap !== undefined) {
          searchCriteria.minMarketCap = filters.minMarketCap;
        }
        if (filters.maxMarketCap !== undefined) {
          searchCriteria.maxMarketCap = filters.maxMarketCap;
        }
        if (filters.minPrice !== undefined) {
          searchCriteria.minPrice = filters.minPrice;
        }
        if (filters.maxPrice !== undefined) {
          searchCriteria.maxPrice = filters.maxPrice;
        }
      }

      // Search stocks
      const stocks = await StockTicker.search(
        query,
        validatedLimit
      );

      return {
        items: stocks,
        total: stocks.length,
        hasMore: stocks.length === validatedLimit,
        query,
        type: 'stock'
      };
    } catch (error) {
      console.error('Stock search error:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
        query,
        type: 'stock'
      };
    }
  }

  /**
   * Get search suggestions for auto-complete
   */
  static async getSearchSuggestions(
    query: string,
    type: 'politician' | 'stock' | 'all' = 'all',
    limit: number = 10
  ): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const cleanQuery = query.trim();
    const validatedLimit = Math.min(limit, 20);

    try {
      const suggestions: string[] = [];

      if (type === 'politician' || type === 'all') {
        // Get politician name suggestions
        const politicianSuggestions = await CongressionalMember.getSuggestions(
          cleanQuery,
          validatedLimit
        );
        suggestions.push(...politicianSuggestions);
      }

      if (type === 'stock' || type === 'all') {
        // Get stock ticker and company name suggestions
        const stockSuggestions = await StockTicker.getSuggestions(
          cleanQuery,
          validatedLimit
        );
        suggestions.push(...stockSuggestions);
      }

      // Remove duplicates and limit results
      return [...new Set(suggestions)].slice(0, validatedLimit);
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Get popular search terms
   */
  static async getPopularSearches(
    type: 'politician' | 'stock' | 'all' = 'all',
    limit: number = 10
  ): Promise<string[]> {
    const validatedLimit = Math.min(limit, 20);

    try {
      const popularSearches: string[] = [];

      if (type === 'politician' || type === 'all') {
        // Get most active politicians (those with recent trades)
        const popularPoliticians = await CongressionalMember.getPopular(validatedLimit);
        popularSearches.push(...popularPoliticians.map(p => p.name));
      }

      if (type === 'stock' || type === 'all') {
        // Get most traded stocks
        const popularStocks = await StockTicker.getPopular(validatedLimit);
        popularSearches.push(...popularStocks.map(s => s.symbol));
      }

      return popularSearches.slice(0, validatedLimit);
    } catch (error) {
      console.error('Popular searches error:', error);
      return [];
    }
  }

  /**
   * Search politicians by state
   */
  static async searchPoliticiansByState(
    stateCode: string,
    options: Omit<SearchOptions, 'query'> = {}
  ): Promise<SearchResult<CongressionalMember>> {
    const { limit = this.DEFAULT_LIMIT, offset = 0 } = options;
    
    // Validate state code
    if (!stateCode || stateCode.length !== 2) {
      return {
        items: [],
        total: 0,
        hasMore: false,
        query: stateCode,
        type: 'politician'
      };
    }

    try {
      const politicians = await CongressionalMember.findByState(
        stateCode.toUpperCase()
      );

      return {
        items: politicians,
        total: politicians.length, // Note: This should be improved to get actual total count
        hasMore: politicians.length === limit,
        query: stateCode,
        type: 'politician'
      };
    } catch (error) {
      console.error('State search error:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
        query: stateCode,
        type: 'politician'
      };
    }
  }

  /**
   * Search stocks by sector
   */
  static async searchStocksBySector(
    sector: string,
    options: Omit<SearchOptions, 'query'> = {}
  ): Promise<SearchResult<StockTicker>> {
    const { limit = this.DEFAULT_LIMIT, offset = 0 } = options;

    try {
      const stocks = await StockTicker.findBySector(
        sector,
        limit
      );

      return {
        items: stocks,
        total: stocks.length,
        hasMore: stocks.length === limit,
        query: sector,
        type: 'stock'
      };
    } catch (error) {
      console.error('Sector search error:', error);
      return {
        items: [],
        total: 0,
        hasMore: false,
        query: sector,
        type: 'stock'
      };
    }
  }

  /**
   * Get all available sectors for filtering
   */
  static async getAvailableSectors(): Promise<string[]> {
    try {
      return await StockTicker.getDistinctSectors();
    } catch (error) {
      console.error('Get sectors error:', error);
      return [];
    }
  }

  /**
   * Get all available industries for filtering
   */
  static async getAvailableIndustries(sector?: string): Promise<string[]> {
    try {
      return await StockTicker.getDistinctIndustries();
    } catch (error) {
      console.error('Get industries error:', error);
      return [];
    }
  }

  /**
   * Get all available states for politician filtering
   */
  static async getAvailableStates(): Promise<Array<{ code: string; name: string; count: number }>> {
    try {
      const stateStats = await CongressionalMember.getStateStatistics();
      return stateStats.map(stat => ({
        code: stat.state,
        name: stat.state, // For now, using state code as name too
        count: stat.count
      }));
    } catch (error) {
      console.error('Get states error:', error);
      return [];
    }
  }

  /**
   * Validate search query
   */
  static validateSearchQuery(query: string): { isValid: boolean; error?: string } {
    if (!query) {
      return {
        isValid: false,
        error: 'Search query is required'
      };
    }

    if (query.trim().length < 1) {
      return {
        isValid: false,
        error: 'Search query must be at least 1 character long'
      };
    }

    if (query.length > 100) {
      return {
        isValid: false,
        error: 'Search query must be less than 100 characters'
      };
    }

    return { isValid: true };
  }
}

export default SearchService;