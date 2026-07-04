# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/

RUN pnpm install

COPY . .
RUN pnpm --filter dashboard build

# Serve stage
FROM nginx:alpine

# Copy built assets to NGINX HTML directory
COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html
# Copy custom NGINX configuration
COPY infra/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
