FROM node:18-alpine

WORKDIR /app

# Copy shared models first
COPY shared /app/shared

# Copy package files
COPY services/notification-service/package*.json ./

# Install dependencies and create symlink for shared modules
RUN npm install --production && ln -s /app/shared /app/node_modules/shared

# Copy service code
COPY services/notification-service .

# Set NODE_PATH to allow module resolution from /app
ENV NODE_PATH=/app

EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3004/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/index.js"]
