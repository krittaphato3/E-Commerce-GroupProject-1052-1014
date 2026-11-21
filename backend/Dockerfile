FROM node:22-alpine

WORKDIR /app

# Copy root workspace manifests for deterministic npm ci
COPY package.json package-lock.json ./
COPY backend/package.json ./backend/

# Copy prisma schema so postinstall `prisma generate` succeeds during npm ci
COPY backend/prisma ./backend/prisma/

# Install workspace dependencies for backend
RUN npm ci --workspace=backend

# Copy backend source, tests, and configs
COPY backend ./backend

WORKDIR /app/backend

# Explicitly ensure Prisma client is generated
RUN npx prisma generate

# Compile TypeScript
RUN npm run build

# Ensure entrypoint is executable and normalize line endings for Linux
RUN sed -i 's/\r$//' ./docker-entrypoint.sh && chmod +x ./docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
