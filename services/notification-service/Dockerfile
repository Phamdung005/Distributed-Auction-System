FROM node:18-alpine

WORKDIR /app

# Copy shared models first
COPY shared /app/shared

# Copy package files
COPY services/notification-service/package*.json ./

# Install dependencies
RUN npm install --production

# Copy service code
COPY services/notification-service .

EXPOSE 3004

CMD ["node", "src/index.js"]
