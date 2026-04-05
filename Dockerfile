# ---- build stage ----
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig.json ./
COPY src ./src

RUN npx prisma generate
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts \
  && npm install prisma@^7.6.0 --no-save --ignore-scripts

COPY --from=builder /app/build ./build
COPY --from=builder /app/src/generated/prisma ./src/generated/prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node build/server.js"]