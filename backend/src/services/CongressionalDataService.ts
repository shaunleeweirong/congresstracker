import { FMPClient, getFMPClient, FMPSenateTradeResponse, FMPHouseTradeResponse, FMPInsiderTradingResponse } from './FMPClient';
import { StockTrade, CreateStockTradeData } from '../models/StockTrade';
import { CongressionalMember } from '../models/CongressionalMember';
import { StockTicker } from '../models/StockTicker';
import { db } from '../config/database';

export interface SyncResult {
  success: boolean;
  processedCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  errors: string[];
  duration: number;
}

export interface SyncOptions {
  limit?: number; // Max records to fetch per API call (default: 250)
  maxPages?: number; // Maximum number of pages to fetch (default: 10 for YTD coverage)
  forceUpdate?: boolean; // Update existing records even if they haven't changed
  syncInsiders?: boolean; // Whether to sync insider trading data
  onProgress?: (progress: { current: number; total: number; type: string }) => void;
}

export class CongressionalDataService {
  private fmpClient: FMPClient;

  constructor(fmpClient?: FMPClient) {
    this.fmpClient = fmpClient || getFMPClient();
  }

  /**
   * Sync all congressional trading data (Senate + House)
   */
  async syncAllCongressionalData(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let totalProcessed = 0;
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    const allErrors: string[] = [];

    try {
      // Sync Senate data
      const senateResult = await this.syncSenateTrades(options);
      totalProcessed += senateResult.processedCount;
      totalCreated += senateResult.createdCount;
      totalUpdated += senateResult.updatedCount;
      totalSkipped += senateResult.skippedCount;
      allErrors.push(...senateResult.errors);

      // Sync House data
      const houseResult = await this.syncHouseTrades(options);
      totalProcessed += houseResult.processedCount;
      totalCreated += houseResult.createdCount;
      totalUpdated += houseResult.updatedCount;
      totalSkipped += houseResult.skippedCount;
      allErrors.push(...houseResult.errors);

      // Sync insider data if requested
      if (options.syncInsiders) {
        const insiderResult = await this.syncInsiderTrades(options);
        totalProcessed += insiderResult.processedCount;
        totalCreated += insiderResult.createdCount;
        totalUpdated += insiderResult.updatedCount;
        totalSkipped += insiderResult.skippedCount;
        allErrors.push(...insiderResult.errors);
      }

      const duration = Date.now() - startTime;

      return {
        success: allErrors.length === 0,
        processedCount: totalProcessed,
        createdCount: totalCreated,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        errors: allErrors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error('Congressional data sync failed:', error);
      
      return {
        success: false,
        processedCount: totalProcessed,
        createdCount: totalCreated,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duration
      };
    }
  }

  /**
   * Sync Senate trading data
   */
  async syncSenateTrades(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    try {
      console.log('Starting Senate trades sync...');

      const maxPages = options.maxPages || 10;
      const limit = options.limit || 250;

      console.log(`Fetching up to ${maxPages} pages of Senate trades (${limit} per page)...`);
      const senateTrades = await this.fmpClient.getAllSenateTrades(maxPages, limit);

      if (!Array.isArray(senateTrades) || senateTrades.length === 0) {
        console.log('No Senate trades found from FMP API');
        return {
          success: true,
          processedCount: 0,
          createdCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      console.log(`Processing ${senateTrades.length} Senate trades from ${maxPages} pages...`);

      for (let i = 0; i < senateTrades.length; i++) {
        const trade = senateTrades[i];
        
        try {
          const result = await this.processSenateTradeRecord(trade, options.forceUpdate);
          
          if (result.action === 'created') createdCount++;
          else if (result.action === 'updated') updatedCount++;
          else if (result.action === 'skipped') skippedCount++;
          
          processedCount++;

          // Report progress
          if (options.onProgress) {
            options.onProgress({
              current: i + 1,
              total: senateTrades.length,
              type: 'Senate'
            });
          }
        } catch (error) {
          const errorMsg = `Error processing Senate trade ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Senate sync completed: ${processedCount} processed, ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped in ${duration}ms`);

      return {
        success: errors.length === 0,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Senate sync failed:', errorMsg);
      
      return {
        success: false,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors: [errorMsg],
        duration
      };
    }
  }

  /**
   * Sync House trading data
   */
  async syncHouseTrades(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    try {
      console.log('Starting House trades sync...');

      const maxPages = options.maxPages || 10;
      const limit = options.limit || 250;

      console.log(`Fetching up to ${maxPages} pages of House trades (${limit} per page)...`);
      const houseTrades = await this.fmpClient.getAllHouseTrades(maxPages, limit);

      if (!Array.isArray(houseTrades) || houseTrades.length === 0) {
        console.log('No House trades found from FMP API');
        return {
          success: true,
          processedCount: 0,
          createdCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      console.log(`Processing ${houseTrades.length} House trades from ${maxPages} pages...`);

      for (let i = 0; i < houseTrades.length; i++) {
        const trade = houseTrades[i];
        
        try {
          const result = await this.processHouseTradeRecord(trade, options.forceUpdate);
          
          if (result.action === 'created') createdCount++;
          else if (result.action === 'updated') updatedCount++;
          else if (result.action === 'skipped') skippedCount++;
          
          processedCount++;

          // Report progress
          if (options.onProgress) {
            options.onProgress({
              current: i + 1,
              total: houseTrades.length,
              type: 'House'
            });
          }
        } catch (error) {
          const errorMsg = `Error processing House trade ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`House sync completed: ${processedCount} processed, ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped in ${duration}ms`);

      return {
        success: errors.length === 0,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('House sync failed:', errorMsg);
      
      return {
        success: false,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors: [errorMsg],
        duration
      };
    }
  }

  /**
   * Sync insider trading data
   */
  async syncInsiderTrades(options: SyncOptions = {}): Promise<SyncResult> {
    const startTime = Date.now();
    let processedCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    try {
      console.log('Starting insider trades sync...');
      
      const insiderTrades = await this.fmpClient.getLatestInsiderTrades(options.limit);
      
      if (!Array.isArray(insiderTrades) || insiderTrades.length === 0) {
        console.log('No insider trades found from FMP API');
        return {
          success: true,
          processedCount: 0,
          createdCount: 0,
          updatedCount: 0,
          skippedCount: 0,
          errors: [],
          duration: Date.now() - startTime
        };
      }

      console.log(`Processing ${insiderTrades.length} insider trades...`);

      for (let i = 0; i < insiderTrades.length; i++) {
        const trade = insiderTrades[i];
        
        try {
          const result = await this.processInsiderTradeRecord(trade, options.forceUpdate);
          
          if (result.action === 'created') createdCount++;
          else if (result.action === 'updated') updatedCount++;
          else if (result.action === 'skipped') skippedCount++;
          
          processedCount++;

          // Report progress
          if (options.onProgress) {
            options.onProgress({
              current: i + 1,
              total: insiderTrades.length,
              type: 'Insider'
            });
          }
        } catch (error) {
          const errorMsg = `Error processing insider trade ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Insider sync completed: ${processedCount} processed, ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped in ${duration}ms`);

      return {
        success: errors.length === 0,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors,
        duration
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Insider sync failed:', errorMsg);
      
      return {
        success: false,
        processedCount,
        createdCount,
        updatedCount,
        skippedCount,
        errors: [errorMsg],
        duration
      };
    }
  }

  /**
   * Process a single Senate trade record
   */
  private async processSenateTradeRecord(
    trade: FMPSenateTradeResponse,
    forceUpdate = false
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; trade?: StockTrade }> {
    try {
      // Find or create the congressional member
      // Use office (full name) as the fullName parameter
      const member = await this.findOrCreateCongressionalMember(
        trade.office,
        trade.firstName,
        trade.lastName,
        'senator',
        trade.office,
        trade.district
      );

      // Ensure the stock ticker exists
      const ticker = await this.findOrCreateStockTicker(trade.symbol, trade.assetDescription);

      // Parse dates
      const transactionDate = new Date(trade.transactionDate);
      const filingDate = trade.disclosureDate ? new Date(trade.disclosureDate) : undefined;

      // Parse transaction type
      const transactionType = this.parseTransactionType(trade.type);

      // Parse estimated value from amount range
      const estimatedValue = this.parseAmountRange(trade.amount);

      // Check if this trade already exists
      const existingTrade = await this.findExistingTrade(
        'congressional',
        member.id!,
        trade.symbol,
        transactionDate,
        transactionType
      );

      if (existingTrade && !forceUpdate) {
        return { action: 'skipped', trade: existingTrade };
      }

      const tradeData: CreateStockTradeData = {
        traderType: 'congressional',
        traderId: member.id!,
        tickerSymbol: trade.symbol,
        transactionDate,
        transactionType,
        amountRange: trade.amount,
        estimatedValue,
        filingDate,
        sourceData: {
          source: 'FMP',
          originalData: trade,
          syncedAt: new Date().toISOString()
        }
      };

      if (existingTrade && forceUpdate) {
        await existingTrade.update(tradeData);
        return { action: 'updated', trade: existingTrade };
      } else {
        const newTrade = await StockTrade.create(tradeData);
        return { action: 'created', trade: newTrade };
      }
    } catch (error) {
      console.error('Error processing Senate trade:', error);
      throw error;
    }
  }

  /**
   * Process a single House trade record
   */
  private async processHouseTradeRecord(
    trade: FMPHouseTradeResponse,
    forceUpdate = false
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; trade?: StockTrade }> {
    try {
      // Find or create the congressional member
      // Use office (full name) as the fullName parameter
      const member = await this.findOrCreateCongressionalMember(
        trade.office,
        trade.firstName,
        trade.lastName,
        'representative',
        trade.office,
        trade.district
      );

      // Ensure the stock ticker exists
      const ticker = await this.findOrCreateStockTicker(trade.symbol, trade.assetDescription);

      // Parse dates
      const transactionDate = new Date(trade.transactionDate);
      const filingDate = trade.disclosureDate ? new Date(trade.disclosureDate) : undefined;

      // Parse transaction type
      const transactionType = this.parseTransactionType(trade.type);

      // Parse estimated value from amount range
      const estimatedValue = this.parseAmountRange(trade.amount);

      // Check if this trade already exists
      const existingTrade = await this.findExistingTrade(
        'congressional',
        member.id!,
        trade.symbol,
        transactionDate,
        transactionType
      );

      if (existingTrade && !forceUpdate) {
        return { action: 'skipped', trade: existingTrade };
      }

      const tradeData: CreateStockTradeData = {
        traderType: 'congressional',
        traderId: member.id!,
        tickerSymbol: trade.symbol,
        transactionDate,
        transactionType,
        amountRange: trade.amount,
        estimatedValue,
        filingDate,
        sourceData: {
          source: 'FMP',
          originalData: trade,
          syncedAt: new Date().toISOString()
        }
      };

      if (existingTrade && forceUpdate) {
        await existingTrade.update(tradeData);
        return { action: 'updated', trade: existingTrade };
      } else {
        const newTrade = await StockTrade.create(tradeData);
        return { action: 'created', trade: newTrade };
      }
    } catch (error) {
      console.error('Error processing House trade:', error);
      throw error;
    }
  }

  /**
   * Process a single insider trade record
   */
  private async processInsiderTradeRecord(
    trade: FMPInsiderTradingResponse,
    forceUpdate = false
  ): Promise<{ action: 'created' | 'updated' | 'skipped'; trade?: StockTrade }> {
    try {
      // Find or create the corporate insider
      const insider = await this.findOrCreateCorporateInsider(
        trade.reportingName,
        trade.symbol,
        trade.typeOfOwner
      );

      // Ensure the stock ticker exists
      const ticker = await this.findOrCreateStockTicker(trade.symbol, trade.securityName);

      // Parse dates
      const transactionDate = new Date(trade.transactionDate);
      const filingDate = new Date(trade.filingDate);

      // Parse transaction type from acquired/disposed code
      const transactionType = this.parseInsiderTransactionType(trade.acquiredDisposedCode);

      // Calculate estimated value
      const estimatedValue = trade.amountOfShares * trade.pricePerShare;

      // Check if this trade already exists
      const existingTrade = await this.findExistingTrade(
        'corporate',
        insider.id!,
        trade.symbol,
        transactionDate,
        transactionType
      );

      if (existingTrade && !forceUpdate) {
        return { action: 'skipped', trade: existingTrade };
      }

      const tradeData: CreateStockTradeData = {
        traderType: 'corporate',
        traderId: insider.id!,
        tickerSymbol: trade.symbol,
        transactionDate,
        transactionType,
        estimatedValue,
        quantity: trade.amountOfShares,
        filingDate,
        sourceData: {
          source: 'FMP',
          originalData: trade,
          syncedAt: new Date().toISOString()
        }
      };

      if (existingTrade && forceUpdate) {
        await existingTrade.update(tradeData);
        return { action: 'updated', trade: existingTrade };
      } else {
        const newTrade = await StockTrade.create(tradeData);
        return { action: 'created', trade: newTrade };
      }
    } catch (error) {
      console.error('Error processing insider trade:', error);
      throw error;
    }
  }

  /**
   * Find or create a congressional member
   */
  private async findOrCreateCongressionalMember(
    fullName: string,
    firstName: string,
    lastName: string,
    position: 'senator' | 'representative',
    office: string,
    districtField: string
  ): Promise<CongressionalMember> {
    // Try to find existing member by name
    const existing = await CongressionalMember.findByName(fullName);
    if (existing) {
      return existing;
    }

    // Extract state code and district from FMP's district field
    // For senators: district = "OK" (just state code)
    // For representatives: district = "FL02" (state + district number)
    let stateCode: string;
    let district: number | undefined;

    if (position === 'senator') {
      // Senators: district field contains just the state code
      stateCode = districtField;
    } else {
      // Representatives: extract state (first 2 chars) and district number (remaining chars)
      stateCode = districtField.substring(0, 2);
      const districtNumber = districtField.substring(2);
      district = districtNumber ? parseInt(districtNumber, 10) : undefined;
    }

    // Create new member
    return CongressionalMember.create({
      name: fullName,
      position,
      stateCode,
      district
    });
  }

  /**
   * Find or create a corporate insider
   */
  private async findOrCreateCorporateInsider(
    name: string,
    companySymbol: string,
    position: string
  ): Promise<any> {
    // Get company name from stock ticker
    const ticker = await StockTicker.findBySymbol(companySymbol);
    const companyName = ticker ? ticker.companyName : `Company (${companySymbol})`;

    const client = await db.connect();
    try {
      // Try to find existing insider
      const existingResult = await client.query(
        'SELECT * FROM corporate_insiders WHERE name = $1 AND ticker_symbol = $2',
        [name, companySymbol]
      );

      if (existingResult.rows.length > 0) {
        return {
          id: existingResult.rows[0].id,
          name: existingResult.rows[0].name,
          companyName: existingResult.rows[0].company_name,
          position: existingResult.rows[0].position,
          tickerSymbol: existingResult.rows[0].ticker_symbol
        };
      }

      // Create new insider
      const insertResult = await client.query(
        `INSERT INTO corporate_insiders (name, company_name, position, ticker_symbol)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, companyName, position, companySymbol]
      );

      const insider = insertResult.rows[0];
      return {
        id: insider.id,
        name: insider.name,
        companyName: insider.company_name,
        position: insider.position,
        tickerSymbol: insider.ticker_symbol
      };
    } finally {
      client.release();
    }
  }

  /**
   * Find or create a stock ticker
   */
  private async findOrCreateStockTicker(symbol: string, companyName: string): Promise<StockTicker> {
    const existing = await StockTicker.findBySymbol(symbol);
    if (existing) {
      return existing;
    }

    return StockTicker.create({
      symbol: symbol.toUpperCase(),
      companyName: companyName || `Company (${symbol})`
    });
  }

  /**
   * Find existing trade to avoid duplicates
   */
  private async findExistingTrade(
    traderType: 'congressional' | 'corporate',
    traderId: string,
    tickerSymbol: string,
    transactionDate: Date,
    transactionType: 'buy' | 'sell' | 'exchange'
  ): Promise<StockTrade | null> {
    const client = await db.connect();
    try {
      const result = await client.query(
        `SELECT * FROM stock_trades 
         WHERE trader_type = $1 AND trader_id = $2 AND ticker_symbol = $3 
         AND transaction_date = $4 AND transaction_type = $5`,
        [traderType, traderId, tickerSymbol.toUpperCase(), transactionDate, transactionType]
      );

      if (result.rows.length > 0) {
        const row = result.rows[0];
        return new StockTrade({
          id: row.id,
          traderType: row.trader_type,
          traderId: row.trader_id,
          tickerSymbol: row.ticker_symbol,
          transactionDate: row.transaction_date,
          transactionType: row.transaction_type,
          amountRange: row.amount_range,
          estimatedValue: row.estimated_value,
          quantity: row.quantity,
          filingDate: row.filing_date,
          sourceData: row.source_data,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        });
      }

      return null;
    } finally {
      client.release();
    }
  }

  /**
   * Parse transaction type from FMP data
   */
  private parseTransactionType(type: string): 'buy' | 'sell' | 'exchange' {
    const normalized = type.toLowerCase().trim();
    
    if (normalized.includes('purchase') || normalized.includes('buy')) {
      return 'buy';
    } else if (normalized.includes('sale') || normalized.includes('sell')) {
      return 'sell';
    } else {
      return 'exchange';
    }
  }

  /**
   * Parse transaction type from insider acquired/disposed code
   */
  private parseInsiderTransactionType(code: string): 'buy' | 'sell' | 'exchange' {
    const normalized = code.toLowerCase().trim();
    
    if (normalized === 'a' || normalized === 'acquired') {
      return 'buy';
    } else if (normalized === 'd' || normalized === 'disposed') {
      return 'sell';
    } else {
      return 'exchange';
    }
  }

  /**
   * Parse amount range and return estimated value
   */
  private parseAmountRange(amount: string): number | undefined {
    if (!amount) return undefined;

    // Try to extract numbers from amount string
    const numbers = amount.match(/\$?([\d,]+)/g);
    if (!numbers) return undefined;

    const values = numbers.map(n => parseInt(n.replace(/[$,]/g, '')));
    
    if (values.length === 1) {
      return values[0];
    } else if (values.length === 2) {
      // Return midpoint of range
      return (values[0] + values[1]) / 2;
    }

    return undefined;
  }

  /**
   * Test the service with a small batch
   */
  async testSync(limit = 5): Promise<SyncResult> {
    console.log(`Testing congressional data sync with limit ${limit}...`);
    
    return this.syncAllCongressionalData({
      limit,
      forceUpdate: false,
      syncInsiders: false
    });
  }
}

export default CongressionalDataService;