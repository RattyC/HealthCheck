# --- Build stage ---
FROM node:20-alpine AS builder
WORKDIR /app

# Ensure corepack is available for npm/pnpm/yarn management
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

# Install dependencies with caching optimization
COPY package.json package-lock.json ./
RUN npm ci

# Copy rest of source code
COPY . .

# Generate Prisma client required during build
RUN npx prisma generate

# Build Next.js application
RUN npm run build

# Remove dev dependencies to minimize final image size
RUN npm prune --omit=dev

# --- Run stage ---
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Add non-root user for security
RUN adduser -D nextjs
USER nextjs

# Copy compiled application and node_modules from builder
COPY --chown=nextjs:nextjs --from=builder /app .

EXPOSE 3000

# Start the Next.js server (environment configured via docker compose)
CMD ["npm", "run", "start"]
