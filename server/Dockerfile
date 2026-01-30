# ---- Build ----
# Contexto: raíz del repo (Railway usa root + -f server/Dockerfile)
FROM node:22-alpine AS builder

# Prisma necesita OpenSSL para el schema/query engine
RUN apk add --no-cache openssl

WORKDIR /app

# Copiar prisma antes de npm ci para que postinstall (prisma generate) encuentre el schema
COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma/
RUN npm ci

RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src/
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS runner

# Prisma necesita OpenSSL para migrate deploy y el cliente en runtime
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

# Copiar prisma antes de npm ci para que postinstall (prisma generate) encuentre el schema
COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Usuario no root
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Migraciones y luego arrancar la app (sin script intermedio para evitar "not found")
CMD ["sh", "-c", "npx prisma migrate deploy && exec node dist/index.js"]