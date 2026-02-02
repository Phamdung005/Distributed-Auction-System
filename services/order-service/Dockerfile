FROM node:18-alpine

WORKDIR /app

COPY services/order-service/package*.json ./
RUN npm install && ln -s /app/shared /app/node_modules/shared

# Copy shared source code
COPY shared /app/shared

# Copy service source code
COPY services/order-service/src ./src

ENV NODE_PATH=/app

EXPOSE 3007

CMD ["npm", "start"]
