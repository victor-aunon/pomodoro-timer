# Multi-stage production build for React 19 + Vite+ SPA
FROM node:22-alpine AS builder
WORKDIR /app

# Enable pnpm via Corepack for deterministic package management
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Copy manifests and lockfile to leverage Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Install exact dependencies using pnpm frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy application source code and compile SPA bundle
COPY . .
RUN pnpm run build

# Stage 2: Serve static production assets with Nginx
FROM nginx:alpine AS runner
WORKDIR /usr/share/nginx/html

# Remove default Nginx welcome page
RUN rm -rf ./*

# Copy compiled SPA bundle from builder stage
COPY --from=builder /app/dist ./

# Configure Nginx for client-side SPA routing (HTML5 History API)
RUN printf 'server {\n\
    listen 80;\n\
    server_name localhost;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    error_page 500 502 503 504 /50x.html;\n\
    location = /50x.html {\n\
        root /usr/share/nginx/html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
