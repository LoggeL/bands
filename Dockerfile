FROM node:20-bookworm-slim AS base
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --build-from-source

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 --gid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ship one-shot maintenance scripts (bulk import, etc.) + bands.json so they
# can be run via `docker exec <container> node scripts/<file>.js`.
COPY --from=builder --chown=nextjs:nodejs /app/scripts/bulk-import-bands.js ./scripts/bulk-import-bands.js
COPY --from=builder --chown=nextjs:nodejs /app/bands.json ./bands.json

# Persistent storage. /data → SQLite DB, public/avatars → user uploads,
# public/previews → downloaded Deezer mp3 snippets (their URLs expire).
# All three should be mounted as volumes at runtime so they survive redeploys.
RUN mkdir -p /data /app/public/avatars /app/public/previews && \
    chown -R nextjs:nodejs /data /app/public/avatars /app/public/previews /app
VOLUME ["/data", "/app/public/avatars", "/app/public/previews"]

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATA_DIR=/data

CMD ["node", "server.js"]
