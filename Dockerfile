FROM node:24-alpine AS base
WORKDIR /app

# ── Dev ──────────────────────────────────────────────────────────────────────
FROM base AS dev
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
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/main.js"]
