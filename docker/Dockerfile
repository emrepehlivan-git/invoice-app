# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Install dependencies
# ============================================
FROM oven/bun:1 AS deps

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Install dependencies
RUN bun install --frozen-lockfile

# ============================================
# Stage 2: Migrate (for database migrations)
# ============================================
FROM oven/bun:1 AS migrate

WORKDIR /app

# Copy dependencies and Prisma schema
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Generate Prisma Client (needed for migrate deploy)
RUN bunx prisma generate || (echo "Prisma generate failed" && exit 1)

# ============================================
# Stage 3: Build the application
# ============================================
FROM oven/bun:1 AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# Generate Prisma Client first (before copying other files)
RUN bunx prisma generate

# Verify Prisma Client was generated
RUN ls -la prisma/generated/prisma/ || (echo "Prisma generate failed" && exit 1)

# Copy rest of the application
COPY . .

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN bun run build

# ============================================
# Stage 4: Production runner
# ============================================
FROM oven/bun:1-slim AS runner

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs --shell /bin/false nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
RUN chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["bun", "server.js"]
