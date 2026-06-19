FROM node:22-alpine AS builder
WORKDIR /app
# Prefer IPv4 — avoids ENETUNREACH when the build host has no working IPv6 route
ENV NODE_OPTIONS=--dns-result-order=ipv4first
RUN npm install -g corepack@latest && corepack enable && corepack prepare pnpm@11.8.0 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm exec ng build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
