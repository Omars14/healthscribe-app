# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS base
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable

FROM base AS deps
COPY package.json package-lock.json* pnpm-lock.yaml* yarn.lock* ./
RUN --mount=type=cache,target=/root/.npm \
    if [ -f package-lock.json ]; then npm ci --omit=optional; \
    elif [ -f pnpm-lock.yaml ]; then npm i -g pnpm && pnpm i --frozen-lockfile; \
    elif [ -f yarn.lock ]; then npm i -g yarn && yarn --frozen-lockfile; \
    else npm i; fi

FROM base AS builder
# Build-time public args (these get baked into client JS)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_N8N_URL
ARG NEXT_PUBLIC_N8N_WEBHOOK_URL
ARG NEXT_PUBLIC_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL

# Expose to Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_PUBLIC_N8N_URL=${NEXT_PUBLIC_N8N_URL}
ENV NEXT_PUBLIC_N8N_WEBHOOK_URL=${NEXT_PUBLIC_N8N_WEBHOOK_URL}
ENV NEXT_PUBLIC_URL=${NEXT_PUBLIC_URL}
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Log that we have the build args (for debugging)
RUN echo "✓ Build args injected: NEXT_PUBLIC_N8N_URL=${NEXT_PUBLIC_N8N_URL}"

RUN --mount=type=cache,target=/root/.npm \
    npm run build

FROM base AS runner
# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy standalone output from builder
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

# Create a startup wrapper that forces 0.0.0.0 binding (do this as root before USER nextjs)
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'exec node -e "process.env.HOSTNAME=\"0.0.0.0\"; const fs=require(\"fs\"); eval(fs.readFileSync(\"./server.js\",\"utf8\"));"' >> /app/start.sh && \
    chmod +x /app/start.sh

USER nextjs
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD wget -qO- http://127.0.0.1:3000 || exit 1

# Use the wrapper script instead of node directly
CMD ["/app/start.sh"]
