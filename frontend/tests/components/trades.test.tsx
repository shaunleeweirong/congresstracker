import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock components for testing
const MockTradeFeed = ({ 
  trades = [], 
  loading = false, 
  error = null,
  onLoadMore = jest.fn(),
  hasMore = false
}: {
  trades?: any[];
  loading?: boolean;
  error?: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
}) => (
  <div data-testid="trade-feed">
    {loading && <div data-testid="trades-loading">Loading trades...</div>}
    {error && <div data-testid="trades-error">{error}</div>}
    <div data-testid="trades-list">
      {trades.map((trade) => (
        <div key={trade.id} data-testid={`trade-${trade.id}`} className="trade-item">
          <span data-testid="trader-name">{trade.trader?.name || 'Unknown'}</span>
          <span data-testid="stock-symbol">{trade.tickerSymbol}</span>
          <span data-testid="transaction-type">{trade.transactionType}</span>
          <span data-testid="transaction-date">{trade.transactionDate}</span>
          <span data-testid="estimated-value">${trade.estimatedValue?.toLocaleString() || 'N/A'}</span>
          <span data-testid="trader-type">{trade.traderType}</span>
        </div>
      ))}
    </div>
    {hasMore && (
      <button data-testid="load-more-button" onClick={onLoadMore}>
        Load More
      </button>
    )}
  </div>
);

const MockTradeFilters = ({
  onFilterChange = jest.fn()
}: {
  onFilterChange?: (filters: any) => void;
}) => {
  const [filters, setFilters] = React.useState({
    startDate: '',
    endDate: '',
    transactionType: '',
    minValue: '',
    maxValue: '',
    tickerSymbol: ''
  });

  const handleChange = (field: string, value: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div data-testid="trade-filters">
      <input
        type="date"
        data-testid="start-date-filter"
        value={filters.startDate}
        onChange={(e) => handleChange('startDate', e.target.value)}
        placeholder="Start Date"
      />
      <input
        type="date"
        data-testid="end-date-filter"
        value={filters.endDate}
        onChange={(e) => handleChange('endDate', e.target.value)}
        placeholder="End Date"
      />
      <select
        data-testid="transaction-type-filter"
        value={filters.transactionType}
        onChange={(e) => handleChange('transactionType', e.target.value)}
      >
        <option value="">All Types</option>
        <option value="buy">Buy</option>
        <option value="sell">Sell</option>
        <option value="exchange">Exchange</option>
      </select>
      <input
        type="number"
        data-testid="min-value-filter"
        value={filters.minValue}
        onChange={(e) => handleChange('minValue', e.target.value)}
        placeholder="Min Value"
      />
      <input
        type="number"
        data-testid="max-value-filter"
        value={filters.maxValue}
        onChange={(e) => handleChange('maxValue', e.target.value)}
        placeholder="Max Value"
      />
      <input
        type="text"
        data-testid="ticker-filter"
        value={filters.tickerSymbol}
        onChange={(e) => handleChange('tickerSymbol', e.target.value)}
        placeholder="Stock Symbol"
      />
    </div>
  );
};

const MockTradeCard = ({ trade }: { trade: any }) => (
  <div data-testid={`trade-card-${trade.id}`} className="trade-card">
    <div data-testid="trade-header">
      <span data-testid="trader-info">
        {trade.trader?.name} ({trade.trader?.position}) - {trade.trader?.stateCode}
      </span>
      <span data-testid="trade-date">{trade.transactionDate}</span>
    </div>
    <div data-testid="trade-details">
      <span data-testid="stock-info">
        {trade.tickerSymbol} - {trade.stock?.companyName}
      </span>
      <span data-testid="transaction-info">
        {trade.transactionType.toUpperCase()} - {trade.amountRange}
      </span>
    </div>
    <div data-testid="trade-values">
      <span data-testid="estimated-value">
        Est. Value: ${trade.estimatedValue?.toLocaleString() || 'N/A'}
      </span>
      <span data-testid="quantity">
        Quantity: {trade.quantity?.toLocaleString() || 'N/A'}
      </span>
    </div>
    {trade.filingDate && (
      <div data-testid="filing-info">
        Filed: {trade.filingDate}
      </div>
    )}
  </div>
);

describe('Trading Data Display Components', () => {
  const mockTrades = [
    {
      id: '1',
      traderType: 'congressional',
      traderId: 'pol-1',
      tickerSymbol: 'AAPL',
      transactionDate: '2024-01-15',
      transactionType: 'buy',
      amountRange: '$15,001 - $50,000',
      estimatedValue: 30000,
      quantity: 200,
      filingDate: '2024-01-20',
      trader: {
        id: 'pol-1',
        name: 'Nancy Pelosi',
        position: 'representative',
        stateCode: 'CA',
        partyAffiliation: 'democratic'
      },
      stock: {
        symbol: 'AAPL',
        companyName: 'Apple Inc.',
        sector: 'Technology'
      }
    },
    {
      id: '2',
      traderType: 'corporate',
      traderId: 'corp-1',
      tickerSymbol: 'GOOGL',
      transactionDate: '2024-01-10',
      transactionType: 'sell',
      amountRange: '$100,001 - $250,000',
      estimatedValue: 150000,
      quantity: 50,
      filingDate: '2024-01-15',
      trader: {
        id: 'corp-1',
        name: 'John Smith',
        companyName: 'Google LLC',
        position: 'CEO'
      },
      stock: {
        symbol: 'GOOGL',
        companyName: 'Alphabet Inc.',
        sector: 'Technology'
      }
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TradeFeed Component', () => {
    it('should render list of trades', () => {
      render(<MockTradeFeed trades={mockTrades} />);

      expect(screen.getByTestId('trade-feed')).toBeInTheDocument();
      expect(screen.getByTestId('trades-list')).toBeInTheDocument();
      expect(screen.getByTestId('trade-1')).toBeInTheDocument();
      expect(screen.getByTestId('trade-2')).toBeInTheDocument();
    });

    it('should display trade information correctly', () => {
      render(<MockTradeFeed trades={mockTrades} />);

      // Check first trade
      const trade1 = screen.getByTestId('trade-1');
      expect(trade1).toHaveTextContent('Nancy Pelosi');
      expect(trade1).toHaveTextContent('AAPL');
      expect(trade1).toHaveTextContent('buy');
      expect(trade1).toHaveTextContent('2024-01-15');
      expect(trade1).toHaveTextContent('$30,000');

      // Check second trade
      const trade2 = screen.getByTestId('trade-2');
      expect(trade2).toHaveTextContent('John Smith');
      expect(trade2).toHaveTextContent('GOOGL');
      expect(trade2).toHaveTextContent('sell');
      expect(trade2).toHaveTextContent('$150,000');
    });

    it('should show loading state', () => {
      render(<MockTradeFeed loading={true} />);

      expect(screen.getByTestId('trades-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading trades...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<MockTradeFeed error="Failed to load trades" />);

      expect(screen.getByTestId('trades-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load trades')).toBeInTheDocument();
    });

    it('should handle empty trades list', () => {
      render(<MockTradeFeed trades={[]} />);

      const tradesList = screen.getByTestId('trades-list');
      expect(tradesList).toBeInTheDocument();
      expect(tradesList.children).toHaveLength(0);
    });

    it('should show load more button when hasMore is true', () => {
      const mockLoadMore = jest.fn();
      render(<MockTradeFeed trades={mockTrades} hasMore={true} onLoadMore={mockLoadMore} />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      expect(loadMoreButton).toBeInTheDocument();
      expect(loadMoreButton).toHaveTextContent('Load More');
    });

    it('should call onLoadMore when load more button is clicked', async () => {
      const user = userEvent.setup();
      const mockLoadMore = jest.fn();
      render(<MockTradeFeed trades={mockTrades} hasMore={true} onLoadMore={mockLoadMore} />);

      const loadMoreButton = screen.getByTestId('load-more-button');
      await user.click(loadMoreButton);

      expect(mockLoadMore).toHaveBeenCalledTimes(1);
    });

    it('should handle trades with missing optional data', () => {
      const incompleteTradeData = [
        {
          id: '3',
          traderType: 'congressional',
          traderId: 'pol-2',
          tickerSymbol: 'MSFT',
          transactionDate: '2024-01-05',
          transactionType: 'buy',
          amountRange: '$1,001 - $15,000',
          // Missing estimatedValue, quantity, filingDate
          trader: {
            id: 'pol-2',
            name: 'Unknown Politician'
            // Missing other trader details
          }
          // Missing stock details
        }
      ];

      render(<MockTradeFeed trades={incompleteTradeData} />);

      const trade = screen.getByTestId('trade-3');
      expect(trade).toHaveTextContent('Unknown Politician');
      expect(trade).toHaveTextContent('MSFT');
      expect(trade).toHaveTextContent('buy');
      expect(trade).toHaveTextContent('N/A'); // For missing estimated value
    });
  });

  describe('TradeFilters Component', () => {
    it('should render all filter inputs', () => {
      render(<MockTradeFilters />);

      expect(screen.getByTestId('trade-filters')).toBeInTheDocument();
      expect(screen.getByTestId('start-date-filter')).toBeInTheDocument();
      expect(screen.getByTestId('end-date-filter')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-type-filter')).toBeInTheDocument();
      expect(screen.getByTestId('min-value-filter')).toBeInTheDocument();
      expect(screen.getByTestId('max-value-filter')).toBeInTheDocument();
      expect(screen.getByTestId('ticker-filter')).toBeInTheDocument();
    });

    it('should call onFilterChange when date filters are changed', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const startDateFilter = screen.getByTestId('start-date-filter');
      await user.type(startDateFilter, '2024-01-01');

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01'
        })
      );
    });

    it('should call onFilterChange when transaction type is changed', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const typeFilter = screen.getByTestId('transaction-type-filter');
      await user.selectOptions(typeFilter, 'buy');

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'buy'
        })
      );
    });

    it('should call onFilterChange when value filters are changed', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const minValueFilter = screen.getByTestId('min-value-filter');
      const maxValueFilter = screen.getByTestId('max-value-filter');

      await user.type(minValueFilter, '10000');
      await user.type(maxValueFilter, '100000');

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          minValue: '10000',
          maxValue: '100000'
        })
      );
    });

    it('should call onFilterChange when ticker symbol is changed', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const tickerFilter = screen.getByTestId('ticker-filter');
      await user.type(tickerFilter, 'AAPL');

      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          tickerSymbol: 'AAPL'
        })
      );
    });

    it('should handle multiple filter changes', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const startDateFilter = screen.getByTestId('start-date-filter');
      const typeFilter = screen.getByTestId('transaction-type-filter');
      const tickerFilter = screen.getByTestId('ticker-filter');

      await user.type(startDateFilter, '2024-01-01');
      await user.selectOptions(typeFilter, 'buy');
      await user.type(tickerFilter, 'AAPL');

      // Should have been called multiple times with cumulative changes
      expect(mockFilterChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          startDate: '2024-01-01',
          transactionType: 'buy',
          tickerSymbol: 'AAPL'
        })
      );
    });
  });

  describe('TradeCard Component', () => {
    it('should display detailed trade information', () => {
      const trade = mockTrades[0];
      render(<MockTradeCard trade={trade} />);

      expect(screen.getByTestId(`trade-card-${trade.id}`)).toBeInTheDocument();
      
      // Check trader information
      const traderInfo = screen.getByTestId('trader-info');
      expect(traderInfo).toHaveTextContent('Nancy Pelosi (representative) - CA');

      // Check stock information
      const stockInfo = screen.getByTestId('stock-info');
      expect(stockInfo).toHaveTextContent('AAPL - Apple Inc.');

      // Check transaction information
      const transactionInfo = screen.getByTestId('transaction-info');
      expect(transactionInfo).toHaveTextContent('BUY - $15,001 - $50,000');

      // Check values
      const estimatedValue = screen.getByTestId('estimated-value');
      expect(estimatedValue).toHaveTextContent('Est. Value: $30,000');

      const quantity = screen.getByTestId('quantity');
      expect(quantity).toHaveTextContent('Quantity: 200');

      // Check filing information
      const filingInfo = screen.getByTestId('filing-info');
      expect(filingInfo).toHaveTextContent('Filed: 2024-01-20');
    });

    it('should handle corporate insider trades', () => {
      const trade = mockTrades[1];
      render(<MockTradeCard trade={trade} />);

      const traderInfo = screen.getByTestId('trader-info');
      expect(traderInfo).toHaveTextContent('John Smith (CEO)');
    });

    it('should handle trades without filing date', () => {
      const tradeWithoutFiling = {
        ...mockTrades[0],
        filingDate: null
      };

      render(<MockTradeCard trade={tradeWithoutFiling} />);

      expect(screen.queryByTestId('filing-info')).not.toBeInTheDocument();
    });

    it('should handle trades with missing values', () => {
      const incompleteTradeData = {
        ...mockTrades[0],
        estimatedValue: null,
        quantity: null
      };

      render(<MockTradeCard trade={incompleteTradeData} />);

      const estimatedValue = screen.getByTestId('estimated-value');
      expect(estimatedValue).toHaveTextContent('Est. Value: N/A');

      const quantity = screen.getByTestId('quantity');
      expect(quantity).toHaveTextContent('Quantity: N/A');
    });

    it('should format large numbers correctly', () => {
      const tradeWithLargeValues = {
        ...mockTrades[0],
        estimatedValue: 1500000,
        quantity: 15000
      };

      render(<MockTradeCard trade={tradeWithLargeValues} />);

      const estimatedValue = screen.getByTestId('estimated-value');
      expect(estimatedValue).toHaveTextContent('Est. Value: $1,500,000');

      const quantity = screen.getByTestId('quantity');
      expect(quantity).toHaveTextContent('Quantity: 15,000');
    });
  });

  describe('Trade Display Integration', () => {
    it('should integrate filters with trade feed', async () => {
      const user = userEvent.setup();
      let filteredTrades = mockTrades;

      const TradeDisplayComponent = () => {
        const [trades, setTrades] = React.useState(mockTrades);
        const [loading, setLoading] = React.useState(false);

        const handleFilterChange = async (filters: any) => {
          setLoading(true);
          // Simulate filtering
          let filtered = mockTrades;
          
          if (filters.transactionType) {
            filtered = filtered.filter(trade => trade.transactionType === filters.transactionType);
          }
          
          if (filters.tickerSymbol) {
            filtered = filtered.filter(trade => 
              trade.tickerSymbol.toLowerCase().includes(filters.tickerSymbol.toLowerCase())
            );
          }

          setTrades(filtered);
          setLoading(false);
        };

        return (
          <>
            <MockTradeFilters onFilterChange={handleFilterChange} />
            <MockTradeFeed trades={trades} loading={loading} />
          </>
        );
      };

      render(<TradeDisplayComponent />);

      // Initially should show all trades
      expect(screen.getByTestId('trade-1')).toBeInTheDocument();
      expect(screen.getByTestId('trade-2')).toBeInTheDocument();

      // Filter by transaction type
      const typeFilter = screen.getByTestId('transaction-type-filter');
      await user.selectOptions(typeFilter, 'buy');

      await waitFor(() => {
        expect(screen.getByTestId('trade-1')).toBeInTheDocument(); // buy trade
        expect(screen.queryByTestId('trade-2')).not.toBeInTheDocument(); // sell trade
      });
    });

    it('should handle filter validation', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const minValueFilter = screen.getByTestId('min-value-filter');
      const maxValueFilter = screen.getByTestId('max-value-filter');

      // Test invalid range (min > max)
      await user.type(minValueFilter, '100000');
      await user.type(maxValueFilter, '50000');

      // Component should still call filter change, validation can be handled by parent
      expect(mockFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          minValue: '100000',
          maxValue: '50000'
        })
      );
    });
  });

  describe('Trade Display Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<MockTradeFeed trades={mockTrades} />);

      const tradeItems = screen.getAllByTestId(/^trade-\d+$/);
      expect(tradeItems).toHaveLength(2);

      tradeItems.forEach(item => {
        expect(item).toHaveClass('trade-item');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockTradeFilters />);

      const filters = [
        screen.getByTestId('start-date-filter'),
        screen.getByTestId('end-date-filter'),
        screen.getByTestId('transaction-type-filter'),
        screen.getByTestId('min-value-filter'),
        screen.getByTestId('max-value-filter'),
        screen.getByTestId('ticker-filter')
      ];

      // Tab through all filter elements
      for (let i = 0; i < filters.length; i++) {
        await user.tab();
        expect(filters[i]).toHaveFocus();
      }
    });

    it('should have accessible form labels', () => {
      render(<MockTradeFilters />);

      // Check that form elements have proper attributes
      const startDateFilter = screen.getByTestId('start-date-filter');
      const typeFilter = screen.getByTestId('transaction-type-filter');

      expect(startDateFilter).toHaveAttribute('type', 'date');
      expect(startDateFilter).toHaveAttribute('placeholder', 'Start Date');
      expect(typeFilter.tagName).toBe('SELECT');
    });
  });

  describe('Trade Display Performance', () => {
    it('should handle large numbers of trades efficiently', () => {
      const largeTrades = Array.from({ length: 1000 }, (_, i) => ({
        id: `trade-${i}`,
        traderType: 'congressional',
        traderId: `pol-${i}`,
        tickerSymbol: 'AAPL',
        transactionDate: '2024-01-15',
        transactionType: i % 2 === 0 ? 'buy' : 'sell',
        estimatedValue: 10000 + i,
        trader: { name: `Politician ${i}` }
      }));

      const startTime = performance.now();
      render(<MockTradeFeed trades={largeTrades} />);
      const endTime = performance.now();

      // Should render efficiently
      expect(endTime - startTime).toBeLessThan(500); // ms

      // Check that all trades are rendered
      const tradeItems = screen.getAllByTestId(/^trade-trade-\d+$/);
      expect(tradeItems).toHaveLength(1000);
    });

    it('should handle rapid filter changes', async () => {
      const user = userEvent.setup();
      const mockFilterChange = jest.fn();

      render(<MockTradeFilters onFilterChange={mockFilterChange} />);

      const tickerFilter = screen.getByTestId('ticker-filter');

      // Simulate rapid typing
      await user.type(tickerFilter, 'AAPL', { delay: 1 });

      // Should handle all changes
      expect(mockFilterChange).toHaveBeenCalledTimes(4); // A, A, P, L
    });
  });
});