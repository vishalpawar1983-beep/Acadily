# ── Stage 1: Build Backend (Node 22) ──
# Frontend is pre-built into frontend-build/ — no Stage 1 needed.
FROM node:22-alpine AS backend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# ── Stage 2: Production Image ──
FROM node:22-alpine
RUN npm install -g pm2
WORKDIR /app

# Backend
COPY --from=backend-builder /app/dist ./dist
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./

# Frontend — use the pre-built output committed to frontend-build/
COPY frontend-build ./frontend-build

# Static assets + PM2 config
COPY public/ ./public/
COPY docker/ecosystem.config.cjs ./
COPY docker/entrypoint.sh ./entrypoint.sh

# Ensure upload directories exist and can be written by the runtime user
RUN apk add --no-cache su-exec && \
    addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup && \
    mkdir -p /app/uploads /app/images && \
    chown -R appuser:appgroup /app/uploads /app/images && \
    chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]
USER root

EXPOSE 3001 3002

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3001)+'/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1) })"

CMD ["pm2-runtime", "ecosystem.config.cjs"]
