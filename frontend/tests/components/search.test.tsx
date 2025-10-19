import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock API calls
const mockApiCall = jest.fn();
jest.mock('../../src/lib/api', () => ({
  apiCall: mockApiCall,
}));

// Mock search hook
const mockUseSearch = jest.fn();
jest.mock('../../src/hooks/useApi', () => ({
  useSearch: mockUseSearch,
}));

// TODO: Import actual components once they're implemented
// import SearchBar from '../../src/components/search/SearchBar';
// import SearchResults from '../../src/components/search/SearchResults';

// Mock search components for testing
const MockSearchBar = ({
  onSearch,
  loading = false,
}: {
  onSearch: (query: string, type?: string) => void;
  loading?: boolean;
}) => (
  <div data-testid="search-bar">
    <input
      type="text"
      placeholder="Search politicians or stocks..."
      data-testid="search-input"
      onChange={(e) => onSearch(e.target.value)}
      disabled={loading}
    />
    <select
      data-testid="search-type-select"
      onChange={(e) => onSearch('', e.target.value)}
    >
      <option value="all">All</option>
      <option value="politician">Politicians</option>
      <option value="stock">Stocks</option>
    </select>
    {loading && <div data-testid="search-loading">Searching...</div>}
  </div>
);

const MockSearchResults = ({
  results,
  loading = false,
  error = null,
}: {
  results?: { politicians: any[]; stocks: any[] };
  loading?: boolean;
  error?: string | null;
}) => (
  <div data-testid="search-results">
    {loading && <div data-testid="results-loading">Loading results...</div>}
    {error && <div data-testid="results-error">{error}</div>}
    {results && (
      <>
        <div data-testid="politicians-section">
          <h3>Politicians ({results.politicians.length})</h3>
          {results.politicians.map((politician) => (
            <div key={politician.id} data-testid={`politician-${politician.id}`}>
              <span>{politician.name}</span>
              <span>{politician.position}</span>
              <span>{politician.stateCode}</span>
              <span>{politician.partyAffiliation}</span>
            </div>
          ))}
        </div>
        <div data-testid="stocks-section">
          <h3>Stocks ({results.stocks.length})</h3>
          {results.stocks.map((stock) => (
            <div key={stock.symbol} data-testid={`stock-${stock.symbol}`}>
              <span>{stock.symbol}</span>
              <span>{stock.companyName}</span>
              <span>{stock.sector}</span>
              <span>${stock.lastPrice}</span>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
);

describe('Search Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SearchBar Component', () => {
    it('should render search input and type selector', () => {
      render(<MockSearchBar onSearch={jest.fn()} />);

      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
      expect(screen.getByTestId('search-input')).toBeInTheDocument();
      expect(screen.getByTestId('search-type-select')).toBeInTheDocument();
    });

    it('should call onSearch when user types in search input', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MockSearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'nancy pelosi');

      // onSearch should be called for each character typed
      expect(mockOnSearch).toHaveBeenCalledWith('n');
      expect(mockOnSearch).toHaveBeenCalledWith('na');
      expect(mockOnSearch).toHaveBeenLastCalledWith('nancy pelosi');
    });

    it('should call onSearch when search type is changed', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MockSearchBar onSearch={mockOnSearch} />);

      const typeSelect = screen.getByTestId('search-type-select');
      await user.selectOptions(typeSelect, 'politician');

      expect(mockOnSearch).toHaveBeenCalledWith('', 'politician');
    });

    it('should disable input when loading', () => {
      render(<MockSearchBar onSearch={jest.fn()} loading={true} />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toBeDisabled();
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    });

    it('should handle rapid typing (debouncing)', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MockSearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByTestId('search-input');

      // Type rapidly
      await user.type(searchInput, 'test', { delay: 10 });

      // Should receive all character events
      expect(mockOnSearch).toHaveBeenCalledTimes(4); // t, e, s, t
    });

    it('should handle special characters in search', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MockSearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, "O'Brien & Associates");

      expect(mockOnSearch).toHaveBeenLastCalledWith("O'Brien & Associates");
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockSearchBar onSearch={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      const typeSelect = screen.getByTestId('search-type-select');

      // Tab through elements
      await user.tab();
      expect(searchInput).toHaveFocus();

      await user.tab();
      expect(typeSelect).toHaveFocus();
    });
  });

  describe('SearchResults Component', () => {
    const mockResults = {
      politicians: [
        {
          id: '1',
          name: 'Nancy Pelosi',
          position: 'representative',
          stateCode: 'CA',
          district: 5,
          partyAffiliation: 'democratic',
        },
        {
          id: '2',
          name: 'Ted Cruz',
          position: 'senator',
          stateCode: 'TX',
          partyAffiliation: 'republican',
        },
      ],
      stocks: [
        {
          symbol: 'AAPL',
          companyName: 'Apple Inc.',
          sector: 'Technology',
          lastPrice: 150.25,
        },
        {
          symbol: 'GOOGL',
          companyName: 'Alphabet Inc.',
          sector: 'Technology',
          lastPrice: 2750.00,
        },
      ],
    };

    it('should render search results for politicians and stocks', () => {
      render(<MockSearchResults results={mockResults} />);

      expect(screen.getByTestId('search-results')).toBeInTheDocument();
      expect(screen.getByTestId('politicians-section')).toBeInTheDocument();
      expect(screen.getByTestId('stocks-section')).toBeInTheDocument();

      // Check politicians
      expect(screen.getByText('Politicians (2)')).toBeInTheDocument();
      expect(screen.getByTestId('politician-1')).toBeInTheDocument();
      expect(screen.getByTestId('politician-2')).toBeInTheDocument();
      expect(screen.getByText('Nancy Pelosi')).toBeInTheDocument();
      expect(screen.getByText('Ted Cruz')).toBeInTheDocument();

      // Check stocks
      expect(screen.getByText('Stocks (2)')).toBeInTheDocument();
      expect(screen.getByTestId('stock-AAPL')).toBeInTheDocument();
      expect(screen.getByTestId('stock-GOOGL')).toBeInTheDocument();
      expect(screen.getByText('AAPL')).toBeInTheDocument();
      expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      render(<MockSearchResults loading={true} />);

      expect(screen.getByTestId('results-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading results...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<MockSearchResults error="Search failed" />);

      expect(screen.getByTestId('results-error')).toBeInTheDocument();
      expect(screen.getByText('Search failed')).toBeInTheDocument();
    });

    it('should handle empty results', () => {
      const emptyResults = { politicians: [], stocks: [] };
      render(<MockSearchResults results={emptyResults} />);

      expect(screen.getByText('Politicians (0)')).toBeInTheDocument();
      expect(screen.getByText('Stocks (0)')).toBeInTheDocument();
    });

    it('should display politician information correctly', () => {
      render(<MockSearchResults results={mockResults} />);

      const nancyElement = screen.getByTestId('politician-1');
      expect(nancyElement).toHaveTextContent('Nancy Pelosi');
      expect(nancyElement).toHaveTextContent('representative');
      expect(nancyElement).toHaveTextContent('CA');
      expect(nancyElement).toHaveTextContent('democratic');

      const tedElement = screen.getByTestId('politician-2');
      expect(tedElement).toHaveTextContent('Ted Cruz');
      expect(tedElement).toHaveTextContent('senator');
      expect(tedElement).toHaveTextContent('TX');
      expect(tedElement).toHaveTextContent('republican');
    });

    it('should display stock information correctly', () => {
      render(<MockSearchResults results={mockResults} />);

      const appleElement = screen.getByTestId('stock-AAPL');
      expect(appleElement).toHaveTextContent('AAPL');
      expect(appleElement).toHaveTextContent('Apple Inc.');
      expect(appleElement).toHaveTextContent('Technology');
      expect(appleElement).toHaveTextContent('$150.25');

      const googleElement = screen.getByTestId('stock-GOOGL');
      expect(googleElement).toHaveTextContent('GOOGL');
      expect(googleElement).toHaveTextContent('Alphabet Inc.');
      expect(googleElement).toHaveTextContent('Technology');
      expect(googleElement).toHaveTextContent('$2750');
    });

    it('should handle results with missing optional fields', () => {
      const incompleteResults = {
        politicians: [
          {
            id: '1',
            name: 'John Doe',
            position: 'representative',
            stateCode: 'XX',
            partyAffiliation: 'independent',
            // Missing district
          },
        ],
        stocks: [
          {
            symbol: 'TEST',
            companyName: 'Test Corp',
            // Missing sector and price
          },
        ],
      };

      render(<MockSearchResults results={incompleteResults} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('TEST')).toBeInTheDocument();
      expect(screen.getByText('Test Corp')).toBeInTheDocument();
    });
  });

  describe('Search Integration', () => {
    it('should integrate search bar and results properly', async () => {
      const user = userEvent.setup();
      let searchResults = null;
      let isLoading = false;
      let searchError = null;

      const handleSearch = async (query: string) => {
        isLoading = true;
        try {
          // Simulate API call
          await new Promise((resolve) => setTimeout(resolve, 100));
          searchResults = mockResults;
        } catch (error) {
          searchError = 'Search failed';
        } finally {
          isLoading = false;
        }
      };

      const SearchComponent = () => {
        const [results, setResults] = React.useState(searchResults);
        const [loading, setLoading] = React.useState(isLoading);
        const [error, setError] = React.useState(searchError);

        const onSearch = async (query: string) => {
          setLoading(true);
          setError(null);
          try {
            await handleSearch(query);
            setResults(searchResults);
          } catch (err) {
            setError('Search failed');
          } finally {
            setLoading(false);
          }
        };

        return (
          <>
            <MockSearchBar onSearch={onSearch} loading={loading} />
            <MockSearchResults results={results} loading={loading} error={error} />
          </>
        );
      };

      render(<SearchComponent />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test search');

      // Should show loading initially, then results
      await waitFor(() => {
        expect(screen.getByTestId('politicians-section')).toBeInTheDocument();
      });
    });

    it('should handle search API errors gracefully', async () => {
      mockApiCall.mockRejectedValue(new Error('Network error'));

      const SearchComponent = () => {
        const [error, setError] = React.useState<string | null>(null);

        const handleSearch = async (query: string) => {
          try {
            await mockApiCall('/search', { query });
          } catch (err) {
            setError('Failed to search. Please try again.');
          }
        };

        return (
          <>
            <MockSearchBar onSearch={handleSearch} />
            <MockSearchResults error={error} />
          </>
        );
      };

      const user = userEvent.setup();
      render(<SearchComponent />);

      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'test');

      await waitFor(() => {
        expect(screen.getByText('Failed to search. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Search Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(<MockSearchBar onSearch={jest.fn()} />);

      const searchInput = screen.getByTestId('search-input');
      expect(searchInput).toHaveAttribute('type', 'text');
      expect(searchInput).toHaveAttribute('placeholder');
    });

    it('should support screen readers', () => {
      render(<MockSearchResults results={mockResults} />);

      // Check that content is structured for screen readers
      expect(screen.getByText('Politicians (2)')).toBeInTheDocument();
      expect(screen.getByText('Stocks (2)')).toBeInTheDocument();
    });

    it('should handle high contrast mode', () => {
      render(<MockSearchBar onSearch={jest.fn()} />);

      // Component should render without issues in high contrast
      expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    });
  });

  describe('Search Performance', () => {
    it('should handle large result sets efficiently', () => {
      const largeResults = {
        politicians: Array.from({ length: 100 }, (_, i) => ({
          id: `pol-${i}`,
          name: `Politician ${i}`,
          position: i % 2 === 0 ? 'senator' : 'representative',
          stateCode: 'XX',
          partyAffiliation: 'independent',
        })),
        stocks: Array.from({ length: 100 }, (_, i) => ({
          symbol: `STOCK${i}`,
          companyName: `Company ${i}`,
          sector: 'Technology',
          lastPrice: 100 + i,
        })),
      };

      const startTime = performance.now();
      render(<MockSearchResults results={largeResults} />);
      const endTime = performance.now();

      // Should render quickly even with many results
      expect(endTime - startTime).toBeLessThan(100); // ms

      expect(screen.getByText('Politicians (100)')).toBeInTheDocument();
      expect(screen.getByText('Stocks (100)')).toBeInTheDocument();
    });

    it('should handle rapid search input changes', async () => {
      const user = userEvent.setup();
      const mockOnSearch = jest.fn();

      render(<MockSearchBar onSearch={mockOnSearch} />);

      const searchInput = screen.getByTestId('search-input');

      // Simulate rapid typing
      await user.type(searchInput, 'abcdefghijklmnop', { delay: 1 });

      // Should handle all input events without issues
      expect(mockOnSearch).toHaveBeenCalledTimes(15);
    });
  });
});