# syntax=docker/dockerfile:1

# ================================================================
# Stage 1: Dependencies - Install all dependencies
# ================================================================
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies needed for node-gyp
RUN apk add --no-cache libc6-compat python3 make g++

# Copy package files
COPY backend/package*.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# ================================================================
# Stage 2: Builder - Build the application
# ================================================================
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source code
COPY backend/package*.json ./
COPY backend/tsconfig.json ./
COPY backend/src ./src

# Copy shared types
COPY shared ../shared

# Install dev dependencies for building
RUN npm install --only=development

# Build TypeScript
RUN npm run build

# ================================================================
# Stage 3: Production - Create minimal production image
# ================================================================
FROM node:20-alpine AS production
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy production dependencies
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy package.json for metadata
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Copy shared types
COPY --chown=nodejs:nodejs shared ../shared

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
