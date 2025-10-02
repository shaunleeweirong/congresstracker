# Development Guide

Welcome to the Congressional Trading Transparency Platform development guide. This document provides comprehensive information for developers contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Coding Standards](#coding-standards)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Git Workflow](#git-workflow)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Getting Started

### Prerequisites

- **Node.js**: v20+ (LTS recommended)
- **Docker Desktop**: Latest version
- **Git**: Latest version
- **Code Editor**: VS Code recommended with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Docker
  - GitLens

### Initial Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/congresstracker.git
   cd congresstracker
   ```

2. **Install dependencies**:
   ```bash
   # Backend
   cd backend && npm install && cd ..

   # Frontend
   cd frontend && npm install && cd ..
   ```

3. **Start services** (choose one):
   ```bash
   # Option A: Docker (recommended for full stack)
   ./scripts/setup-local.sh

   # Option B: Manual (databases only)
   docker compose up -d postgres redis
   cd backend && npm run dev  # Terminal 1
   cd frontend && npm run dev # Terminal 2
   ```

## Project Structure

```
congresstracker/
├── backend/                    # Express.js backend
│   ├── src/
│   │   ├── models/            # Database models
│   │   ├── services/          # Business logic
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── routes/            # API routes
│   │   ├── config/            # Configuration files
│   │   ├── app.ts             # Express app setup
│   │   └── server.ts          # Server entry point
│   ├── tests/
│   │   ├── contracts/         # API contract tests
│   │   ├── integration/       # Integration tests
│   │   └── unit/              # Unit tests
│   ├── migrations/            # Database migrations
│   └── seeds/                 # Test data seeds
├── frontend/                  # Next.js frontend
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   ├── components/       # React components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── layout/      # Layout components
│   │   │   ├── auth/        # Authentication components
│   │   │   ├── trades/      # Trading components
│   │   │   └── ...          # Feature-specific components
│   │   ├── contexts/        # React contexts
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Utilities and API client
│   └── tests/               # Frontend tests
├── shared/                   # Shared TypeScript types
│   └── types/
│       ├── api.ts           # API types
│       └── database.ts      # Database types
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── specs/                   # Feature specifications
└── docker-compose.yml       # Docker services config
```

## Tech Stack

### Backend
- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: express-validator
- **Testing**: Jest, Supertest
- **ORM**: Custom models with pg library

### Frontend
- **Framework**: Next.js 15
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Authentication**: NextAuth.js v5
- **HTTP Client**: Axios
- **Data Fetching**: SWR
- **Forms**: React Hook Form + Zod
- **Testing**: Jest, React Testing Library

### Infrastructure
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions (planned)
- **Deployment**: Vercel (frontend), Railway (backend)
- **Monitoring**: Sentry

## Coding Standards

### TypeScript

#### Type Safety
- **Always use explicit types** for function parameters and return values
- **Avoid `any` type** - use `unknown` if type is truly unknown
- **Use interfaces** for object shapes, **types** for unions/intersections
- **Leverage type inference** for simple variable assignments

```typescript
// Good
function getUserById(id: string): Promise<User | null> {
  return userService.findById(id);
}

// Bad
function getUserById(id: any): any {
  return userService.findById(id);
}
```

#### Naming Conventions
- **PascalCase**: Classes, interfaces, types, React components
- **camelCase**: Functions, variables, methods
- **UPPER_CASE**: Constants, environment variables
- **kebab-case**: File names (except components)

```typescript
// Interfaces and Types
interface UserProfile {
  id: string;
  email: string;
}

type UserRole = 'admin' | 'user';

// Constants
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = process.env.API_URL;

// Functions and variables
const currentUser = getCurrentUser();
function processPayment(amount: number): Promise<void> {}
```

### Code Organization

#### File Structure
- **One component per file**
- **Group related files** in directories
- **Index files** for clean exports
- **Colocate tests** with source files when possible

```typescript
// Good structure
components/
  auth/
    LoginForm.tsx
    RegisterForm.tsx
    ProtectedRoute.tsx
    index.ts

// Bad structure
components/
  AllAuthComponents.tsx  // Multiple components in one file
```

#### Import Order
1. External packages
2. Internal absolute imports
3. Relative imports
4. Type imports (if not inlined)

```typescript
// External
import { useState, useEffect } from 'react';
import axios from 'axios';

// Internal absolute
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

// Relative
import { Button } from './ui/button';
import styles from './LoginForm.module.css';

// Types
import type { User } from '@/types';
```

### React/Next.js

#### Component Patterns
- **Use functional components** with hooks
- **Extract custom hooks** for reusable logic
- **Keep components small** and focused (< 200 lines)
- **Use composition** over inheritance

```typescript
// Good: Small, focused component
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`btn btn-${variant}`}
    >
      {children}
    </button>
  );
}

// Good: Custom hook for reusable logic
export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Fetch logic here
  }, [url]);

  return { data, loading, error };
}
```

#### State Management
- **Local state**: `useState` for component-specific state
- **Global state**: React Context for app-wide state
- **Server state**: SWR for API data
- **Forms**: React Hook Form

```typescript
// Local state
const [count, setCount] = useState(0);

// Context for global state
const { user, login, logout } = useAuth();

// SWR for server state
const { data: trades } = useSWR('/api/trades', fetcher);

// Forms
const { register, handleSubmit } = useForm<FormData>();
```

### Backend

#### API Design
- **RESTful conventions**: Use proper HTTP methods
- **Consistent responses**: Always use ApiResponse wrapper
- **Error handling**: Use custom error classes
- **Validation**: Validate all inputs
- **Authentication**: Protect routes with middleware

```typescript
// Good API endpoint
router.post(
  '/trades',
  authenticate,
  validate(createTradeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const trade = await tradeService.create(req.body);
      res.status(201).json({
        success: true,
        data: trade
      });
    } catch (error) {
      next(error);
    }
  }
);
```

#### Error Handling
- **Use custom error classes** for different error types
- **Always call `next(error)`** in async handlers
- **Provide meaningful error messages**
- **Don't expose sensitive information**

```typescript
// Custom error classes
export class ValidationError extends ApiError {
  constructor(message: string, errors: ValidationErrorDetail[]) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

// Usage in controller
if (!user) {
  throw new NotFoundError('User not found');
}
```

### Testing

#### Test Structure
- **Arrange-Act-Assert** pattern
- **One assertion per test** when possible
- **Descriptive test names**
- **Test edge cases**

```typescript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw ValidationError for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123',
        name: 'Test User'
      };

      await expect(userService.createUser(userData))
        .rejects.toThrow(ValidationError);
    });
  });
});
```

## Development Workflow

### Feature Development

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Write failing tests** (TDD):
   ```bash
   npm test -- --watch
   ```

3. **Implement feature**:
   - Write minimal code to make tests pass
   - Refactor for clarity and performance
   - Update types and interfaces

4. **Run linting and type checking**:
   ```bash
   npm run lint
   npm run type-check
   ```

5. **Commit changes**:
   ```bash
   git add .
   git commit -m "feat: add user authentication"
   ```

6. **Push and create PR**:
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body

footer
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(auth): add JWT token refresh endpoint
fix(trades): correct date filtering in trade query
docs(api): update authentication documentation
test(users): add unit tests for user service
```

## Testing

### Running Tests

```bash
# Backend
cd backend

# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test file
npm test -- auth.test.ts

# Frontend
cd frontend

# All tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Test Types

#### Contract Tests
Validate API endpoint contracts against OpenAPI schema.

```typescript
// backend/tests/contracts/auth.test.ts
describe('POST /auth/register', () => {
  it('should match OpenAPI schema', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(validUserData);

    expect(response.status).toBe(201);
    expect(response.body).toMatchSchema(registerResponseSchema);
  });
});
```

#### Integration Tests
Test complete user flows and feature integration.

```typescript
// backend/tests/integration/auth.integration.test.ts
describe('User Registration and Login Flow', () => {
  it('should allow user to register and login', async () => {
    // Register
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send(userData);

    expect(registerRes.status).toBe(201);
    const { token } = registerRes.body.data;

    // Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: userData.email, password: userData.password });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.token).toBeDefined();
  });
});
```

#### Unit Tests
Test individual functions and methods.

```typescript
// backend/tests/unit/UserService.test.ts
describe('UserService.hashPassword', () => {
  it('should hash password with bcrypt', async () => {
    const password = 'password123';
    const hashed = await userService.hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
  });
});
```

#### Component Tests
Test React components.

```typescript
// frontend/tests/components/Button.test.tsx
describe('Button', () => {
  it('should call onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

## Git Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch (if using)
- `feature/*`: New features
- `fix/*`: Bug fixes
- `hotfix/*`: Critical production fixes
- `docs/*`: Documentation updates

### Pull Request Process

1. **Create PR** with descriptive title and body
2. **Link related issues**
3. **Request reviews** from team members
4. **Address feedback**
5. **Ensure CI passes**
6. **Squash and merge** when approved

## Common Tasks

### Adding a New API Endpoint

1. **Define route** in `backend/src/routes/`:
   ```typescript
   router.get('/endpoint', authenticate, controller.handler);
   ```

2. **Create controller** in `backend/src/controllers/`:
   ```typescript
   export async function handler(req: Request, res: Response) {
     const data = await service.getData();
     res.json({ data });
   }
   ```

3. **Add service logic** in `backend/src/services/`:
   ```typescript
   export async function getData() {
     return await db.query('SELECT * FROM table');
   }
   ```

4. **Write tests** in `backend/tests/contracts/`:
   ```typescript
   it('should return data', async () => {
     const res = await request(app).get('/api/v1/endpoint');
     expect(res.status).toBe(200);
   });
   ```

### Adding a New React Component

1. **Create component file**:
   ```typescript
   // frontend/src/components/MyComponent.tsx
   interface MyComponentProps {
     title: string;
   }

   export function MyComponent({ title }: MyComponentProps) {
     return <div>{title}</div>;
   }
   ```

2. **Add to index** (if in a directory):
   ```typescript
   // frontend/src/components/index.ts
   export { MyComponent } from './MyComponent';
   ```

3. **Write tests**:
   ```typescript
   // frontend/tests/components/MyComponent.test.tsx
   it('should render title', () => {
     render(<MyComponent title="Test" />);
     expect(screen.getByText('Test')).toBeInTheDocument();
   });
   ```

### Adding Database Migration

1. **Create migration file**:
   ```sql
   -- backend/migrations/002_add_table.sql
   CREATE TABLE IF NOT EXISTS new_table (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     name VARCHAR(255) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW()
   );
   ```

2. **Run migration**:
   ```bash
   docker compose exec postgres psql -U postgres -d congresstracker -f /docker-entrypoint-initdb.d/migrations/002_add_table.sql
   ```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000 or 3001
lsof -ti:3000
lsof -ti:3001

# Kill process
kill -9 <PID>
```

#### Docker Issues
```bash
# Reset Docker environment
docker compose down -v
docker system prune -a

# Rebuild containers
docker compose build --no-cache
docker compose up
```

#### Node Modules Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

#### Database Connection Errors
```bash
# Check if Postgres is running
docker compose ps postgres

# View Postgres logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d postgres
```

## Best Practices

### Security
- ✅ Never commit secrets or API keys
- ✅ Use environment variables for configuration
- ✅ Validate and sanitize all user inputs
- ✅ Use parameterized queries to prevent SQL injection
- ✅ Implement rate limiting on API endpoints
- ✅ Use HTTPS in production
- ✅ Keep dependencies updated

### Performance
- ✅ Use database indexes for frequently queried fields
- ✅ Implement caching with Redis
- ✅ Optimize images and assets
- ✅ Use pagination for large datasets
- ✅ Minimize bundle size (code splitting)
- ✅ Use React.memo for expensive components
- ✅ Implement proper error boundaries

### Code Quality
- ✅ Write tests for all new code
- ✅ Keep functions small and focused
- ✅ Use meaningful variable and function names
- ✅ Add comments for complex logic
- ✅ Remove dead code and unused imports
- ✅ Run linter before committing
- ✅ Review your own code before requesting review

### Documentation
- ✅ Update API documentation when adding endpoints
- ✅ Document complex algorithms and business logic
- ✅ Keep README up to date
- ✅ Add JSDoc comments for exported functions
- ✅ Include examples in documentation

## Resources

### Documentation
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### Tools
- [shadcn/ui Components](https://ui.shadcn.com)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Internal Resources
- [API Documentation](./api.md)
- [README](../README.md)
- [Feature Specs](../specs/)

---

**Need Help?**
- Check existing issues on GitHub
- Ask in team chat
- Review similar implementations in the codebase
- Consult the API documentation

**Last Updated**: January 2025
