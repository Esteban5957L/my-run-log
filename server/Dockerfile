# ---- Build ----
    FROM node:22-alpine AS builder

    WORKDIR /app
    
    COPY package.json package-lock.json ./
    RUN npm ci
    
    COPY prisma ./prisma/
    RUN npx prisma generate
    
    COPY tsconfig.json ./
    COPY src ./src/
    RUN npm run build
    
    # ---- Production ----
    FROM node:22-alpine AS runner
    
    WORKDIR /app
    
    ENV NODE_ENV=production
    
    COPY package.json package-lock.json ./
    RUN npm ci --omit=dev
    
    COPY prisma ./prisma/
    RUN npx prisma generate
    
    COPY --from=builder /app/dist ./dist
    
    # Script de inicio
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