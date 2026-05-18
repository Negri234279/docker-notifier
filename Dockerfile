FROM node:24-alpine AS base
WORKDIR /app

# ── Dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
ENV NODE_ENV="development"
ENV TZ="Europe/Madrid"
COPY package*.json ./
RUN npm install
CMD ["npx", "tsx", "watch", "src/main.ts"]

# ── Builder ───────────────────────────────────────────────────────────────────
FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Runner (prod, default) ────────────────────────────────────────────────────
FROM node:24-alpine AS runner
ARG VERSION="1.0.0"
ARG VCS_REF="unknown"
ARG BUILD_DATE="unknown"
LABEL \
    org.opencontainers.image.title="docker-notifier" \
    org.opencontainers.image.description="Listens to Docker socket and notifies Discord/Telegram when Watchtower updates a container" \
    org.opencontainers.image.version="${VERSION}" \
    org.opencontainers.image.revision="${VCS_REF}" \
    org.opencontainers.image.created="${BUILD_DATE}"
ENV NODE_ENV="production"
ENV TZ="Europe/Madrid"
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
