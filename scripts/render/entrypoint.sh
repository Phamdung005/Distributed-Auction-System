#!/bin/bash
export PORT=${PORT:-10000}

# Substitute $PORT into Nginx config
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Set environment variables for local inter-service communication
export AUTH_SERVICE_URL="http://127.0.0.1:3001"
export AUCTION_SERVICE_URL="http://127.0.0.1:3002"
export BIDDING_SERVICE_URL="http://127.0.0.1:3003"
export NOTIFICATION_SERVICE_URL="http://127.0.0.1:3004"
export COMMUNITY_SERVICE_URL="http://127.0.0.1:3005"
export PAYMENT_SERVICE_URL="http://127.0.0.1:3006"
export ORDER_SERVICE_URL="http://127.0.0.1:3007"
export NODE_OPTIONS="--max-old-space-size=64"

echo "=== Starting all microservices ==="
node services/auth-service/src/index.js &
node services/auction-service/src/index.js &
node services/bidding-service/src/index.js &
node services/notification-service/src/index.js &
node services/community-service/src/index.js &
node services/payment-service/src/index.js &
node services/order-service/src/index.js &

# Wait for services to bind ports
sleep 3

echo "=== Starting Nginx Gateway on port $PORT ==="
nginx -g "daemon off;"
