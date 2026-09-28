FROM node:20-alpine

RUN apk add --no-cache nginx gettext bash

WORKDIR /app

# Copy shared modules
COPY shared ./shared

# Copy each service package.json and install dependencies
COPY services/auth-service/package*.json ./services/auth-service/
RUN cd services/auth-service && npm install --omit=dev

COPY services/auction-service/package*.json ./services/auction-service/
RUN cd services/auction-service && npm install --omit=dev

COPY services/bidding-service/package*.json ./services/bidding-service/
RUN cd services/bidding-service && npm install --omit=dev

COPY services/notification-service/package*.json ./services/notification-service/
RUN cd services/notification-service && npm install --omit=dev

COPY services/community-service/package*.json ./services/community-service/
RUN cd services/community-service && npm install --omit=dev

COPY services/payment-service/package*.json ./services/payment-service/
RUN cd services/payment-service && npm install --omit=dev

COPY services/order-service/package*.json ./services/order-service/
RUN cd services/order-service && npm install --omit=dev

# Copy all source code
COPY . .

# Copy nginx config template and entrypoint
COPY scripts/render/nginx.conf.template /etc/nginx/nginx.conf.template
COPY scripts/render/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 10000

ENV PORT=10000
ENV NODE_ENV=production

CMD ["/bin/bash", "/app/entrypoint.sh"]
