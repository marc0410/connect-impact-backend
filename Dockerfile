# ─── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl && \
    npm install -g pnpm --no-update-notifier

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN npx prisma generate && pnpm build

# ─── Stage 2: Production ─────────────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

RUN apk add --no-cache openssl && \
    npm install -g pnpm --no-update-notifier

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Installer toutes les deps (prisma CLI en devDep requis pour generate),
# générer le client Prisma, puis supprimer les devDependencies
RUN pnpm install --frozen-lockfile && \
    npx prisma generate && \
    pnpm prune --prod && \
    pnpm store prune

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
