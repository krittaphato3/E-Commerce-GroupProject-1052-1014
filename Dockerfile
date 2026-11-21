# Multi-stage Dockerfile for unified deployment (e.g., Cloud Run)
# Stage 1: Build frontend SPA
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/
RUN npm ci --workspace=frontend

COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

# Stage 2: Build backend service
FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN npm ci --workspace=backend

COPY backend ./backend
WORKDIR /app/backend
RUN npx prisma generate
RUN npm run build

# Stage 3: Production runtime
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package.json package-lock.json ./
COPY backend/package.json ./backend/
COPY backend/prisma ./backend/prisma/
RUN npm ci --workspace=backend

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=backend-builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "backend/dist/server.js"]
