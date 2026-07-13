FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
ENV CONTENT_DIR=/data/content
ENV CONTENT_HISTORY_DIR=/data/content/.history
ENV MEDIA_DIR=/data/media
ENV MEDIA_HISTORY_DIR=/data/media/.history

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
RUN mkdir -p /data/content/.history /data/media/.history && chown -R nextjs:nodejs /data

COPY --from=builder /app/public ./public
COPY --from=builder /app/content/shows.json /seed-content/shows.json
COPY --from=builder /app/content/merch.json /seed-content/merch.json
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
VOLUME ["/data/content", "/data/media"]
CMD ["sh", "-c", "test -f /data/content/shows.json || cp /seed-content/shows.json /data/content/shows.json; test -f /data/content/merch.json || cp /seed-content/merch.json /data/content/merch.json; test -f /data/content/admin-audit.json || printf '[]\\n' > /data/content/admin-audit.json; exec node server.js"]
