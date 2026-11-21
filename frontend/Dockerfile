# Stage 1: Build the Vite SPA
FROM node:22-alpine AS build

WORKDIR /app

# Copy root workspace manifests
COPY package.json package-lock.json ./
COPY frontend/package.json ./frontend/

# Install workspace dependencies for frontend
RUN npm ci --workspace=frontend

# Copy frontend source
COPY frontend ./frontend

WORKDIR /app/frontend

# Build the Vite SPA into dist/
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

COPY --from=build /app/frontend/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
