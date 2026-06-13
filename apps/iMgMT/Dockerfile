FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
RUN npm ci

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Full dev deps for migrate/seed only (isolated from Next standalone)
COPY --from=deps /app/node_modules /app/prisma-cli/node_modules
COPY --from=deps /app/package.json /app/prisma-cli/package.json

RUN mkdir -p /var/app-data/files /app/logs /app/prisma-cli \
    && chown -R nextjs:nodejs /var/app-data/files /app/logs /app/prisma-cli

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV FILE_STORAGE_ROOT="/var/app-data/files"

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
