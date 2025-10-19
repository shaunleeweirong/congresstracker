# Congressional Trading Tracker - Frontend

Modern Next.js frontend for tracking congressional and insider stock trades with real-time data visualization.

## 🏗 Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern component library
- **Axios** - HTTP client with interceptors
- **NextAuth.js** - Authentication (configured)

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Dashboard (homepage)
│   │   ├── trades/            # Trading activity page
│   │   ├── politicians/       # Politicians listing
│   │   ├── politician/[id]/   # Individual politician page
│   │   ├── stocks/            # Stocks listing
│   │   └── stock/[symbol]/    # Individual stock page
│   ├── components/
│   │   ├── layout/            # Layout components (Layout, Sidebar, Header)
│   │   ├── search/            # SearchBar with real-time API
│   │   ├── trades/            # TradeFeed with pagination
│   │   ├── ui/                # shadcn/ui components
│   │   └── theme/             # Dark mode toggle
│   ├── lib/
│   │   ├── api.ts             # API client with axios
│   │   └── utils.ts           # Utility functions
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
└── package.json
```

## ✨ Key Features

### 🔍 Smart Search
- **Real-time API calls** - No mock data, queries backend directly
- **Type filtering** - Search politicians, stocks, or both
- **Debounced queries** - Optimized for performance
- **Keyboard navigation** - Arrow keys and enter support

### 📊 Trading Feed
- **Pagination** - 50 trades per page with "Load More" functionality
- **Sorting** - Sort by date, value, or trader name
- **Filtering** - Date ranges, transaction types, stock symbols
- **Historical data** - Access 3,542 trades from 2022-2025

### 🎨 Dark Mode
- **Theme toggle** - Seamless light/dark mode switching
- **Persistent preference** - Saved to localStorage
- **System detection** - Respects OS theme preference

### 📱 Responsive Design
- **Mobile-first** - Optimized for all screen sizes
- **Tailwind CSS** - Utility-first responsive design
- **shadcn/ui** - Accessible, beautiful components

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (LTS)
- Backend API running on `http://localhost:3001`

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local

# Edit environment variables
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Start development server
npm run dev
```

Application will be available at **http://localhost:3000**

### Docker

```bash
# Start with Docker Compose (from project root)
docker compose --profile dev up

# Frontend will be available at http://localhost:3000
```

## 🔧 Development Commands

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Lint code with ESLint
npm run type-check   # TypeScript type checking
```

## 📚 Component Documentation

### SearchBar
**Location:** `src/components/search/SearchBar.tsx`

Real-time search component with API integration:

```typescript
<SearchBar
  onSearch={(query, type) => console.log(query, type)}
  onSelectPolitician={(politician) => router.push(`/politician/${politician.id}`)}
  onSelectStock={(stock) => router.push(`/stock/${stock.symbol}`)}
  placeholder="Search politicians or stocks..."
  showFilters={true}
/>
```

**Features:**
- Debounced API calls (prevents excessive requests)
- Type filtering (politicians, stocks, all)
- Keyboard navigation
- Loading states

### TradeFeed
**Location:** `src/components/trades/TradeFeed.tsx`

Paginated trading activity feed:

```typescript
<TradeFeed
  onPoliticianClick={(politician) => router.push(`/politician/${politician.id}`)}
  onStockClick={(stock) => router.push(`/stock/${stock.symbol}`)}
  showFilters={true}
  pageSize={50}
/>
```

**Features:**
- 50 trades per page (configurable)
- "Load More" button for pagination
- Date range filtering
- Transaction type filtering
- Sort by date, value, or trader

### ThemeToggle
**Location:** `src/components/theme/ThemeToggle.tsx`

Dark mode toggle with persistence:

```typescript
<ThemeToggle />
```

**Features:**
- Light/dark mode switching
- Persisted to localStorage
- System preference detection

## 🔌 API Integration

### API Client
**Location:** `src/lib/api.ts`

Centralized API client with axios:

```typescript
import { api } from '@/lib/api'

// Search
const results = await api.search.search({ q: 'Nancy Pelosi', type: 'politician' })

// Get trades
const trades = await api.trades.getTrades({ limit: 50, offset: 0 })

// Get politician
const politician = await api.politicians.getPoliticianById('uuid')

// Get stock
const stock = await api.stocks.getStockBySymbol('AAPL')
```

**Features:**
- Automatic authentication with NextAuth
- Request/response interceptors
- Error handling with custom error classes
- TypeScript types for all endpoints

### API Endpoints

```typescript
// Available API methods
api.auth.login(credentials)
api.auth.register(userData)
api.search.search({ q, type })
api.trades.getTrades(filters)
api.trades.getRecentTrades(limit)
api.politicians.getPoliticianById(id)
api.stocks.getStockBySymbol(symbol)
api.alerts.getAlerts()
api.follows.getFollows()
api.analytics.getPortfolioConcentration(traderId)
```

## 🎨 Styling

### Tailwind CSS
Utility-first CSS framework configured in `tailwind.config.ts`:

```typescript
// Custom theme colors
colors: {
  border: "hsl(var(--border))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",
  // ... more colors
}
```

### shadcn/ui Components
Pre-built accessible components in `src/components/ui/`:

- Button, Card, Badge
- Input, Dropdown, Dialog
- Breadcrumb, Sidebar, Navigation
- And more...

Install new components:
```bash
npx shadcn@latest add [component-name]
```

## 🐛 Common Issues

### API Connection Failed
**Problem:** Frontend can't reach backend API

**Solution:**
```bash
# Check .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# Ensure backend is running
cd ../backend && npm run dev

# Check backend health
curl http://localhost:3001/health
```

### Search Not Working
**Problem:** Search returns no results

**Solution:**
- Ensure backend has synced data (run sync job)
- Check browser console for API errors
- Verify SearchBar is using correct API endpoint

### Dark Mode Not Persisting
**Problem:** Theme resets on page reload

**Solution:**
- Check localStorage for `theme` key
- Ensure ThemeProvider wraps entire app in `app/layout.tsx`

## 📊 Performance Optimization

- **Code splitting** - Automatic with Next.js App Router
- **Image optimization** - Next.js Image component
- **API debouncing** - SearchBar debounces queries
- **Lazy loading** - Components loaded on demand
- **Pagination** - TradeFeed loads 50 trades at a time

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run E2E tests with Playwright
npm run test:e2e
```

## 📝 TypeScript

All components are fully typed with TypeScript. Shared types are in `../shared/types/api.ts`:

```typescript
import {
  CongressionalMember,
  StockTicker,
  StockTrade,
  SearchResponse
} from '@/types/api'
```

## 🚢 Deployment

### Build for Production

```bash
# Build optimized production bundle
npm run build

# Test production build locally
npm run start
```

### Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
NEXT_PUBLIC_API_URL=https://your-backend-api.com/api/v1
```

## 🔗 Related Documentation

- [Main Project README](../README.md)
- [Backend Documentation](../backend/README.md)
- [API Documentation](../docs/api.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
