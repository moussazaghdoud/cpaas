FROM node:20-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
RUN cd apps/web && npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY content ./content
WORKDIR /app/apps/web
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone output (preserves directory structure)
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy static files and public assets
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Copy content for search API
COPY --from=builder /app/content ./content

USER nextjs
EXPOSE 3000

CMD ["node", "apps/web/server.js"]
