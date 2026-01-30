# ---- Build ----
# Contexto: raíz del repo (Railway usa root + -f server/Dockerfile)
FROM node:22-alpine AS builder

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

WORKDIR /app

ENV NODE_ENV=production

# Copiar prisma antes de npm ci para que postinstall (prisma generate) encuentre el schema
COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma/
RUN npm ci --omit=dev
RUN npx prisma generate

COPY --from=builder /app/dist ./dist

# Script de inicio (migraciones + app)
RUN echo '#!/bin/sh\n\
set -e\n\
echo "Running migrations..."\n\
npx prisma migrate deploy\n\
echo "Starting app..."\n\
exec node dist/index.js' > start.sh && chmod +x start.sh

# Usuario no root
RUN addgroup -g 1001 nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

CMD ["./start.sh"]