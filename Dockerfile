# Backend API - build desde raíz para que Railway use Docker
# ---- Build ----
FROM node:22-alpine AS builder

# Prisma necesita OpenSSL para su engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma/
RUN npm ci

RUN npx prisma generate

COPY server/tsconfig.json ./
COPY server/src ./src/
RUN npm run build

# ---- Production ----
FROM node:22-alpine AS runner

# Prisma en runtime también requiere OpenSSL
RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY server/package.json server/package-lock.json ./
COPY server/prisma ./prisma/
RUN npm ci --omit=dev

RUN npx prisma generate

COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/index.js"]
