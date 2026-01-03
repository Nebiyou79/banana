# =========================
# BUILD STAGE
# =========================
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (better caching)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY . .

# Validate Next.js standalone config (supports .ts or .js)
RUN if [ -f next.config.ts ]; then \
      node -e "const c=require('./next.config.ts').default || require('./next.config.ts'); if(c.output!=='standalone'){console.error('❌ next.config.ts must use output: standalone'); process.exit(1)}"; \
    elif [ -f next.config.js ]; then \
      node -e "const c=require('./next.config.js'); if(c.output!=='standalone'){console.error('❌ next.config.js must use output: standalone'); process.exit(1)}"; \
    else \
      echo '❌ Missing next.config.ts or next.config.js'; exit 1; \
    fi

# Build Next.js
RUN npm run build


# =========================
# PRODUCTION STAGE
# =========================
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup -g 1001 -S nodejs \
 && adduser -S nextjs -u 1001

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
