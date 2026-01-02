FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Ensure next.config.js exists with standalone output
RUN if [ ! -f next.config.js ] && [ ! -f next.config.ts ]; then \
    echo 'Creating next.config.js...'; \
    echo 'module.exports = { output: "standalone", images: { unoptimized: true } }' > next.config.js; \
fi

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Check if standalone output exists and copy accordingly
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Always copy static files
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set proper permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Start the server
CMD ["node", "server.js"]