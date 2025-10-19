import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock alert components for testing
const MockAlertManager = ({
  alerts = [],
  loading = false,
  error = null,
  onCreateAlert = jest.fn(),
  onUpdateAlert = jest.fn(),
  onDeleteAlert = jest.fn()
}: {
  alerts?: any[];
  loading?: boolean;
  error?: string | null;
  onCreateAlert?: (alert: any) => void;
  onUpdateAlert?: (id: string, updates: any) => void;
  onDeleteAlert?: (id: string) => void;
}) => (
  <div data-testid="alert-manager">
    {loading && <div data-testid="alerts-loading">Loading alerts...</div>}
    {error && <div data-testid="alerts-error">{error}</div>}
    
    <div data-testid="alerts-list">
      {alerts.map((alert) => (
        <div key={alert.id} data-testid={`alert-${alert.id}`} className="alert-item">
          <span data-testid="alert-type">{alert.alertType}</span>
          <span data-testid="alert-status">{alert.alertStatus}</span>
          
          {alert.alertType === 'politician' && alert.politicianId && (
            <span data-testid="politician-info">Politician: {alert.politicianId}</span>
          )}
          
          {alert.alertType === 'stock' && alert.tickerSymbol && (
            <span data-testid="stock-info">Stock: {alert.tickerSymbol}</span>
          )}
          
          {alert.alertType === 'pattern' && alert.patternConfig && (
            <span data-testid="pattern-info">
              Pattern: {JSON.stringify(alert.patternConfig)}
            </span>
          )}
          
          <div data-testid="alert-actions">
            <button
              data-testid={`pause-alert-${alert.id}`}
              onClick={() => onUpdateAlert(alert.id, { 
                alertStatus: alert.alertStatus === 'active' ? 'paused' : 'active' 
              })}
            >
              {alert.alertStatus === 'active' ? 'Pause' : 'Resume'}
            </button>
            <button
              data-testid={`delete-alert-${alert.id}`}
              onClick={() => onDeleteAlert(alert.id)}
            >
              Delete
            </button>
          </div>
          
          {alert.lastTriggeredAt && (
            <div data-testid="last-triggered">
              Last triggered: {alert.lastTriggeredAt}
            </div>
          )}
        </div>
      ))}
    </div>

    <button data-testid="add-alert-button" onClick={() => onCreateAlert({})}>
      Add New Alert
    </button>
  </div>
);

const MockCreateAlertForm = ({
  onSubmit = jest.fn(),
  onCancel = jest.fn(),
  loading = false
}: {
  onSubmit?: (alertData: any) => void;
  onCancel?: () => void;
  loading?: boolean;
}) => {
  const [alertType, setAlertType] = React.useState('politician');
  const [politicianId, setPoliticianId] = React.useState('');
  const [tickerSymbol, setTickerSymbol] = React.useState('');
  const [patternConfig, setPatternConfig] = React.useState({
    minValue: '',
    maxValue: '',
    transactionType: '',
    timeFrame: '24h'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const alertData: any = { alertType };

    switch (alertType) {
      case 'politician':
        alertData.politicianId = politicianId;
        break;
      case 'stock':
        alertData.tickerSymbol = tickerSymbol;
        break;
      case 'pattern':
        alertData.patternConfig = patternConfig;
        break;
    }

    onSubmit(alertData);
  };

  return (
    <form data-testid="create-alert-form" onSubmit={handleSubmit}>
      <div data-testid="alert-type-section">
        <label>Alert Type:</label>
        <select
          data-testid="alert-type-select"
          value={alertType}
          onChange={(e) => setAlertType(e.target.value)}
          required
        >
          <option value="politician">Politician</option>
          <option value="stock">Stock</option>
          <option value="pattern">Pattern</option>
        </select>
      </div>

      {alertType === 'politician' && (
        <div data-testid="politician-section">
          <label>Politician:</label>
          <input
            type="text"
            data-testid="politician-input"
            value={politicianId}
            onChange={(e) => setPoliticianId(e.target.value)}
            placeholder="Select politician"
            required
          />
        </div>
      )}

      {alertType === 'stock' && (
        <div data-testid="stock-section">
          <label>Stock Symbol:</label>
          <input
            type="text"
            data-testid="stock-input"
            value={tickerSymbol}
            onChange={(e) => setTickerSymbol(e.target.value)}
            placeholder="e.g., AAPL"
            required
          />
        </div>
      )}

      {alertType === 'pattern' && (
        <div data-testid="pattern-section">
          <label>Minimum Value:</label>
          <input
            type="number"
            data-testid="min-value-input"
            value={patternConfig.minValue}
            onChange={(e) => setPatternConfig({
              ...patternConfig,
              minValue: e.target.value
            })}
            placeholder="Minimum transaction value"
          />
          
          <label>Maximum Value:</label>
          <input
            type="number"
            data-testid="max-value-input"
            value={patternConfig.maxValue}
            onChange={(e) => setPatternConfig({
              ...patternConfig,
              maxValue: e.target.value
            })}
            placeholder="Maximum transaction value"
          />
          
          <label>Transaction Type:</label>
          <select
            data-testid="transaction-type-select"
            value={patternConfig.transactionType}
            onChange={(e) => setPatternConfig({
              ...patternConfig,
              transactionType: e.target.value
            })}
          >
            <option value="">Any</option>
            <option value="buy">Buy</option>
            <option value="sell">Sell</option>
            <option value="exchange">Exchange</option>
          </select>
          
          <label>Time Frame:</label>
          <select
            data-testid="time-frame-select"
            value={patternConfig.timeFrame}
            onChange={(e) => setPatternConfig({
              ...patternConfig,
              timeFrame: e.target.value
            })}
          >
            <option value="1h">1 Hour</option>
            <option value="24h">24 Hours</option>
            <option value="7d">7 Days</option>
            <option value="30d">30 Days</option>
          </select>
        </div>
      )}

      <div data-testid="form-actions">
        <button
          type="submit"
          data-testid="submit-alert-button"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Alert'}
        </button>
        <button
          type="button"
          data-testid="cancel-alert-button"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const MockAlertNotifications = ({
  notifications = [],
  onMarkAsRead = jest.fn(),
  onClearAll = jest.fn()
}: {
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}) => (
  <div data-testid="alert-notifications">
    <div data-testid="notifications-header">
      <h3>Notifications ({notifications.length})</h3>
      {notifications.length > 0 && (
        <button data-testid="clear-all-button" onClick={onClearAll}>
          Clear All
        </button>
      )}
    </div>
    
    <div data-testid="notifications-list">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          data-testid={`notification-${notification.id}`}
          className={`notification ${notification.readAt ? 'read' : 'unread'}`}
        >
          <div data-testid="notification-message">{notification.message}</div>
          <div data-testid="notification-time">{notification.deliveredAt}</div>
          {!notification.readAt && (
            <button
              data-testid={`mark-read-${notification.id}`}
              onClick={() => onMarkAsRead(notification.id)}
            >
              Mark as Read
            </button>
          )}
        </div>
      ))}
    </div>
  </div>
);

describe('Alert Management Components', () => {
  const mockAlerts = [
    {
      id: 'alert-1',
      alertType: 'politician',
      alertStatus: 'active',
      politicianId: 'pol-1',
      createdAt: '2024-01-15T10:00:00Z',
      lastTriggeredAt: '2024-01-20T15:30:00Z'
    },
    {
      id: 'alert-2',
      alertType: 'stock',
      alertStatus: 'paused',
      tickerSymbol: 'AAPL',
      createdAt: '2024-01-10T09:00:00Z',
      lastTriggeredAt: null
    },
    {
      id: 'alert-3',
      alertType: 'pattern',
      alertStatus: 'active',
      patternConfig: {
        minValue: 50000,
        transactionType: 'buy',
        timeFrame: '24h'
      },
      createdAt: '2024-01-05T14:20:00Z',
      lastTriggeredAt: '2024-01-18T11:45:00Z'
    }
  ];

  const mockNotifications = [
    {
      id: 'notif-1',
      message: 'Nancy Pelosi bought AAPL worth $45,000',
      deliveredAt: '2024-01-20T15:30:00Z',
      readAt: null
    },
    {
      id: 'notif-2',
      message: 'Large buy transaction detected: GOOGL $150,000',
      deliveredAt: '2024-01-18T11:45:00Z',
      readAt: '2024-01-18T12:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AlertManager Component', () => {
    it('should render list of alerts', () => {
      render(<MockAlertManager alerts={mockAlerts} />);

      expect(screen.getByTestId('alert-manager')).toBeInTheDocument();
      expect(screen.getByTestId('alerts-list')).toBeInTheDocument();
      expect(screen.getByTestId('alert-alert-1')).toBeInTheDocument();
      expect(screen.getByTestId('alert-alert-2')).toBeInTheDocument();
      expect(screen.getByTestId('alert-alert-3')).toBeInTheDocument();
    });

    it('should display different alert types correctly', () => {
      render(<MockAlertManager alerts={mockAlerts} />);

      // Politician alert
      const politicianAlert = screen.getByTestId('alert-alert-1');
      expect(politicianAlert).toHaveTextContent('politician');
      expect(politicianAlert).toHaveTextContent('Politician: pol-1');

      // Stock alert
      const stockAlert = screen.getByTestId('alert-alert-2');
      expect(stockAlert).toHaveTextContent('stock');
      expect(stockAlert).toHaveTextContent('Stock: AAPL');

      // Pattern alert
      const patternAlert = screen.getByTestId('alert-alert-3');
      expect(patternAlert).toHaveTextContent('pattern');
      expect(patternAlert).toHaveTextContent('Pattern:');
    });

    it('should show alert statuses correctly', () => {
      render(<MockAlertManager alerts={mockAlerts} />);

      const activeAlert = screen.getByTestId('alert-alert-1');
      expect(activeAlert).toHaveTextContent('active');

      const pausedAlert = screen.getByTestId('alert-alert-2');
      expect(pausedAlert).toHaveTextContent('paused');
    });

    it('should show last triggered information when available', () => {
      render(<MockAlertManager alerts={mockAlerts} />);

      const triggeredAlert = screen.getByTestId('alert-alert-1');
      expect(triggeredAlert).toHaveTextContent('Last triggered: 2024-01-20T15:30:00Z');

      const notTriggeredAlert = screen.getByTestId('alert-alert-2');
      expect(notTriggeredAlert).not.toHaveTextContent('Last triggered');
    });

    it('should handle pause/resume alert functionality', async () => {
      const user = userEvent.setup();
      const mockUpdateAlert = jest.fn();

      render(<MockAlertManager alerts={mockAlerts} onUpdateAlert={mockUpdateAlert} />);

      // Test pausing an active alert
      const pauseButton = screen.getByTestId('pause-alert-alert-1');
      expect(pauseButton).toHaveTextContent('Pause');
      await user.click(pauseButton);

      expect(mockUpdateAlert).toHaveBeenCalledWith('alert-1', { alertStatus: 'paused' });

      // Test resuming a paused alert
      const resumeButton = screen.getByTestId('pause-alert-alert-2');
      expect(resumeButton).toHaveTextContent('Resume');
      await user.click(resumeButton);

      expect(mockUpdateAlert).toHaveBeenCalledWith('alert-2', { alertStatus: 'active' });
    });

    it('should handle delete alert functionality', async () => {
      const user = userEvent.setup();
      const mockDeleteAlert = jest.fn();

      render(<MockAlertManager alerts={mockAlerts} onDeleteAlert={mockDeleteAlert} />);

      const deleteButton = screen.getByTestId('delete-alert-alert-1');
      await user.click(deleteButton);

      expect(mockDeleteAlert).toHaveBeenCalledWith('alert-1');
    });

    it('should handle add new alert functionality', async () => {
      const user = userEvent.setup();
      const mockCreateAlert = jest.fn();

      render(<MockAlertManager alerts={mockAlerts} onCreateAlert={mockCreateAlert} />);

      const addButton = screen.getByTestId('add-alert-button');
      await user.click(addButton);

      expect(mockCreateAlert).toHaveBeenCalledWith({});
    });

    it('should show loading state', () => {
      render(<MockAlertManager loading={true} />);

      expect(screen.getByTestId('alerts-loading')).toBeInTheDocument();
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<MockAlertManager error="Failed to load alerts" />);

      expect(screen.getByTestId('alerts-error')).toBeInTheDocument();
      expect(screen.getByText('Failed to load alerts')).toBeInTheDocument();
    });

    it('should handle empty alerts list', () => {
      render(<MockAlertManager alerts={[]} />);

      const alertsList = screen.getByTestId('alerts-list');
      expect(alertsList.children).toHaveLength(0);
    });
  });

  describe('CreateAlertForm Component', () => {
    it('should render form with alert type selector', () => {
      render(<MockCreateAlertForm />);

      expect(screen.getByTestId('create-alert-form')).toBeInTheDocument();
      expect(screen.getByTestId('alert-type-select')).toBeInTheDocument();
      expect(screen.getByTestId('submit-alert-button')).toBeInTheDocument();
      expect(screen.getByTestId('cancel-alert-button')).toBeInTheDocument();
    });

    it('should show politician section when politician type is selected', async () => {
      const user = userEvent.setup();
      render(<MockCreateAlertForm />);

      const typeSelect = screen.getByTestId('alert-type-select');
      await user.selectOptions(typeSelect, 'politician');

      expect(screen.getByTestId('politician-section')).toBeInTheDocument();
      expect(screen.getByTestId('politician-input')).toBeInTheDocument();
    });

    it('should show stock section when stock type is selected', async () => {
      const user = userEvent.setup();
      render(<MockCreateAlertForm />);

      const typeSelect = screen.getByTestId('alert-type-select');
      await user.selectOptions(typeSelect, 'stock');

      expect(screen.getByTestId('stock-section')).toBeInTheDocument();
      expect(screen.getByTestId('stock-input')).toBeInTheDocument();
    });

    it('should show pattern section when pattern type is selected', async () => {
      const user = userEvent.setup();
      render(<MockCreateAlertForm />);

      const typeSelect = screen.getByTestId('alert-type-select');
      await user.selectOptions(typeSelect, 'pattern');

      expect(screen.getByTestId('pattern-section')).toBeInTheDocument();
      expect(screen.getByTestId('min-value-input')).toBeInTheDocument();
      expect(screen.getByTestId('max-value-input')).toBeInTheDocument();
      expect(screen.getByTestId('transaction-type-select')).toBeInTheDocument();
      expect(screen.getByTestId('time-frame-select')).toBeInTheDocument();
    });

    it('should submit politician alert correctly', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<MockCreateAlertForm onSubmit={mockOnSubmit} />);

      const typeSelect = screen.getByTestId('alert-type-select');
      const politicianInput = screen.getByTestId('politician-input');
      const submitButton = screen.getByTestId('submit-alert-button');

      await user.selectOptions(typeSelect, 'politician');
      await user.type(politicianInput, 'pol-123');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        alertType: 'politician',
        politicianId: 'pol-123'
      });
    });

    it('should submit stock alert correctly', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<MockCreateAlertForm onSubmit={mockOnSubmit} />);

      const typeSelect = screen.getByTestId('alert-type-select');
      const stockInput = screen.getByTestId('stock-input');
      const submitButton = screen.getByTestId('submit-alert-button');

      await user.selectOptions(typeSelect, 'stock');
      await user.type(stockInput, 'AAPL');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        alertType: 'stock',
        tickerSymbol: 'AAPL'
      });
    });

    it('should submit pattern alert correctly', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<MockCreateAlertForm onSubmit={mockOnSubmit} />);

      const typeSelect = screen.getByTestId('alert-type-select');
      const minValueInput = screen.getByTestId('min-value-input');
      const maxValueInput = screen.getByTestId('max-value-input');
      const transactionTypeSelect = screen.getByTestId('transaction-type-select');
      const timeFrameSelect = screen.getByTestId('time-frame-select');
      const submitButton = screen.getByTestId('submit-alert-button');

      await user.selectOptions(typeSelect, 'pattern');
      await user.type(minValueInput, '10000');
      await user.type(maxValueInput, '100000');
      await user.selectOptions(transactionTypeSelect, 'buy');
      await user.selectOptions(timeFrameSelect, '7d');
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith({
        alertType: 'pattern',
        patternConfig: {
          minValue: '10000',
          maxValue: '100000',
          transactionType: 'buy',
          timeFrame: '7d'
        }
      });
    });

    it('should handle cancel functionality', async () => {
      const user = userEvent.setup();
      const mockOnCancel = jest.fn();

      render(<MockCreateAlertForm onCancel={mockOnCancel} />);

      const cancelButton = screen.getByTestId('cancel-alert-button');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should disable submit button when loading', () => {
      render(<MockCreateAlertForm loading={true} />);

      const submitButton = screen.getByTestId('submit-alert-button');
      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Creating...');
    });

    it('should validate required fields', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = jest.fn();

      render(<MockCreateAlertForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByTestId('submit-alert-button');

      // Try to submit without filling required politician field
      await user.click(submitButton);

      // HTML5 validation should prevent submission
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('AlertNotifications Component', () => {
    it('should render notifications list', () => {
      render(<MockAlertNotifications notifications={mockNotifications} />);

      expect(screen.getByTestId('alert-notifications')).toBeInTheDocument();
      expect(screen.getByTestId('notifications-list')).toBeInTheDocument();
      expect(screen.getByText('Notifications (2)')).toBeInTheDocument();
    });

    it('should display notification information correctly', () => {
      render(<MockAlertNotifications notifications={mockNotifications} />);

      const notification1 = screen.getByTestId('notification-notif-1');
      expect(notification1).toHaveTextContent('Nancy Pelosi bought AAPL worth $45,000');
      expect(notification1).toHaveTextContent('2024-01-20T15:30:00Z');
      expect(notification1).toHaveClass('unread');

      const notification2 = screen.getByTestId('notification-notif-2');
      expect(notification2).toHaveTextContent('Large buy transaction detected');
      expect(notification2).toHaveClass('read');
    });

    it('should show mark as read button for unread notifications', () => {
      render(<MockAlertNotifications notifications={mockNotifications} />);

      // Unread notification should have mark as read button
      expect(screen.getByTestId('mark-read-notif-1')).toBeInTheDocument();

      // Read notification should not have mark as read button
      expect(screen.queryByTestId('mark-read-notif-2')).not.toBeInTheDocument();
    });

    it('should handle mark as read functionality', async () => {
      const user = userEvent.setup();
      const mockMarkAsRead = jest.fn();

      render(<MockAlertNotifications notifications={mockNotifications} onMarkAsRead={mockMarkAsRead} />);

      const markReadButton = screen.getByTestId('mark-read-notif-1');
      await user.click(markReadButton);

      expect(mockMarkAsRead).toHaveBeenCalledWith('notif-1');
    });

    it('should handle clear all functionality', async () => {
      const user = userEvent.setup();
      const mockClearAll = jest.fn();

      render(<MockAlertNotifications notifications={mockNotifications} onClearAll={mockClearAll} />);

      const clearAllButton = screen.getByTestId('clear-all-button');
      await user.click(clearAllButton);

      expect(mockClearAll).toHaveBeenCalled();
    });

    it('should handle empty notifications list', () => {
      render(<MockAlertNotifications notifications={[]} />);

      expect(screen.getByText('Notifications (0)')).toBeInTheDocument();
      expect(screen.queryByTestId('clear-all-button')).not.toBeInTheDocument();
    });
  });

  describe('Alert Management Integration', () => {
    it('should integrate alert creation with alert list', async () => {
      const user = userEvent.setup();
      
      const AlertIntegrationComponent = () => {
        const [alerts, setAlerts] = React.useState(mockAlerts);
        const [showCreateForm, setShowCreateForm] = React.useState(false);

        const handleCreateAlert = (alertData: any) => {
          const newAlert = {
            ...alertData,
            id: `alert-${Date.now()}`,
            alertStatus: 'active',
            createdAt: new Date().toISOString()
          };
          setAlerts([...alerts, newAlert]);
          setShowCreateForm(false);
        };

        const handleDeleteAlert = (id: string) => {
          setAlerts(alerts.filter(alert => alert.id !== id));
        };

        return (
          <>
            <MockAlertManager
              alerts={alerts}
              onCreateAlert={() => setShowCreateForm(true)}
              onDeleteAlert={handleDeleteAlert}
            />
            {showCreateForm && (
              <MockCreateAlertForm
                onSubmit={handleCreateAlert}
                onCancel={() => setShowCreateForm(false)}
              />
            )}
          </>
        );
      };

      render(<AlertIntegrationComponent />);

      // Initial alerts should be shown
      expect(screen.getByTestId('alert-alert-1')).toBeInTheDocument();

      // Open create form
      const addButton = screen.getByTestId('add-alert-button');
      await user.click(addButton);

      expect(screen.getByTestId('create-alert-form')).toBeInTheDocument();

      // Create new stock alert
      const typeSelect = screen.getByTestId('alert-type-select');
      const stockInput = screen.getByTestId('stock-input');
      const submitButton = screen.getByTestId('submit-alert-button');

      await user.selectOptions(typeSelect, 'stock');
      await user.type(stockInput, 'TSLA');
      await user.click(submitButton);

      // Form should close and new alert should appear
      expect(screen.queryByTestId('create-alert-form')).not.toBeInTheDocument();
      
      // Check that new alert was added
      const allAlerts = screen.getAllByTestId(/^alert-alert-/);
      expect(allAlerts).toHaveLength(4); // 3 original + 1 new
    });

    it('should handle alert status updates', async () => {
      const user = userEvent.setup();

      const AlertStatusComponent = () => {
        const [alerts, setAlerts] = React.useState(mockAlerts);

        const handleUpdateAlert = (id: string, updates: any) => {
          setAlerts(alerts.map(alert => 
            alert.id === id ? { ...alert, ...updates } : alert
          ));
        };

        return (
          <MockAlertManager
            alerts={alerts}
            onUpdateAlert={handleUpdateAlert}
          />
        );
      };

      render(<AlertStatusComponent />);

      // Check initial status
      const alert1 = screen.getByTestId('alert-alert-1');
      expect(alert1).toHaveTextContent('active');

      // Pause the alert
      const pauseButton = screen.getByTestId('pause-alert-alert-1');
      await user.click(pauseButton);

      // Status should be updated
      await waitFor(() => {
        expect(alert1).toHaveTextContent('paused');
      });
    });
  });

  describe('Alert Management Accessibility', () => {
    it('should have proper form labels', () => {
      render(<MockCreateAlertForm />);

      expect(screen.getByLabelText('Alert Type:')).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<MockCreateAlertForm />);

      const typeSelect = screen.getByTestId('alert-type-select');
      const submitButton = screen.getByTestId('submit-alert-button');
      const cancelButton = screen.getByTestId('cancel-alert-button');

      // Tab through form elements
      await user.tab();
      expect(typeSelect).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();

      await user.tab();
      expect(cancelButton).toHaveFocus();
    });

    it('should have semantic structure for alerts list', () => {
      render(<MockAlertManager alerts={mockAlerts} />);

      const alertItems = screen.getAllByTestId(/^alert-alert-/);
      expect(alertItems).toHaveLength(3);

      alertItems.forEach(item => {
        expect(item).toHaveClass('alert-item');
      });
    });
  });

  describe('Alert Management Performance', () => {
    it('should handle large numbers of alerts efficiently', () => {
      const largeAlerts = Array.from({ length: 100 }, (_, i) => ({
        id: `alert-${i}`,
        alertType: 'stock',
        alertStatus: 'active',
        tickerSymbol: `STOCK${i}`,
        createdAt: new Date().toISOString()
      }));

      const startTime = performance.now();
      render(<MockAlertManager alerts={largeAlerts} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(200); // ms

      const alertItems = screen.getAllByTestId(/^alert-alert-/);
      expect(alertItems).toHaveLength(100);
    });
  });
});