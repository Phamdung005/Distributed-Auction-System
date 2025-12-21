# Sử dụng Node.js LTS
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy shared folder trước để có sẵn các dependencies
COPY shared /app/shared

# Copy package files và cài đặt tất cả dependencies
COPY services/auction-service/package*.json ./
RUN npm install --production && ln -s /app/shared /app/node_modules/shared

# Copy source code
COPY services/auction-service/src ./src

# Set NODE_PATH to allow module resolution from /app
ENV NODE_PATH=/app

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3002/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Chạy ứng dụng
CMD ["node", "src/index.js"]
