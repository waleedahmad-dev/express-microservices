# Payment Service Dockerfile
FROM node:20-alpine AS base
RUN apk add --no-cache dumb-init
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM base AS build
COPY package*.json ./
RUN npm ci
COPY . .

FROM base AS production

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

RUN mkdir -p logs && chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3004

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
