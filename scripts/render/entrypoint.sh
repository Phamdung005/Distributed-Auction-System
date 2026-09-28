#!/bin/bash
export PORT=${PORT:-10000}

# Substitute $PORT into Nginx config
envsubst '${PORT}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Read Cloud Credentials exclusively from Environment Variables configured in Render
if [ -z "$MONGODB_URI" ]; then
  echo "WARNING: MONGODB_URI environment variable is not set."
fi

if [ -z "$REDIS_URL" ]; then
  echo "WARNING: REDIS_URL environment variable is not set."
fi

# Extract base URI from MONGODB_URI (handles both standard and SRV URIs)
# e.g., mongodb+srv://user:pass@cluster.mongodb.net/dbname?opts -> base without dbname
MONGO_BASE=$(echo "$MONGODB_URI" | sed -E 's|/[^/?]+(\?.*)?$||')
MONGO_OPTS=$(echo "$MONGODB_URI" | grep -o '\?.*' | sed 's/^\?//')
if [ -z "$MONGO_OPTS" ]; then
  MONGO_OPTS="retryWrites=true&w=majority"
fi
export JWT_SECRET="${JWT_SECRET:-your-super-secret-jwt-key-change-in-production}"
export JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET:-your-super-secret-refresh-key-change-in-production}"

# Internal inter-service URLs
export AUTH_SERVICE_URL="http://127.0.0.1:3001"
export AUCTION_SERVICE_URL="http://127.0.0.1:3002"
export BIDDING_SERVICE_URL="http://127.0.0.1:3003"
export NOTIFICATION_SERVICE_URL="http://127.0.0.1:3004"
export COMMUNITY_SERVICE_URL="http://127.0.0.1:3005"
export PAYMENT_SERVICE_URL="http://127.0.0.1:3006"
export ORDER_SERVICE_URL="http://127.0.0.1:3007"
export NODE_OPTIONS="--max-old-space-size=64"

# Link shared module for each service
for dir in /app/services/*; do
  if [ -d "$dir" ]; then
    mkdir -p "$dir/node_modules"
    ln -sf /app/shared "$dir/node_modules/shared"
  fi
done
mkdir -p /app/node_modules
ln -sf /app/shared /app/node_modules/shared

echo "=== Starting 1. auth-service (Port 3001) ==="
(cd /app/services/auth-service && export PORT=3001 && export MONGODB_URI="${AUTH_MONGODB_URI:-${MONGO_BASE}/auth_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 2. auction-service (Port 3002) ==="
(cd /app/services/auction-service && export PORT=3002 && export MONGODB_URI="${AUCTION_MONGODB_URI:-${MONGO_BASE}/auction_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 3. bidding-service (Port 3003) ==="
(cd /app/services/bidding-service && export PORT=3003 && export MONGODB_URI="${BIDDING_MONGODB_URI:-${MONGO_BASE}/bidding_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 4. notification-service (Port 3004) ==="
(cd /app/services/notification-service && export PORT=3004 && export MONGODB_URI="${NOTIFICATION_MONGODB_URI:-${MONGO_BASE}/notification_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 5. community-service (Port 3005) ==="
(cd /app/services/community-service && export PORT=3005 && export MONGODB_URI="${COMMUNITY_MONGODB_URI:-${MONGO_BASE}/community_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 6. payment-service (Port 3006) ==="
(cd /app/services/payment-service && export PORT=3006 && export MONGODB_URI="${PAYMENT_MONGODB_URI:-${MONGO_BASE}/payment_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

echo "=== Starting 7. order-service (Port 3007) ==="
(cd /app/services/order-service && export PORT=3007 && export MONGODB_URI="${ORDER_MONGODB_URI:-${MONGO_BASE}/order_db?${MONGO_OPTS}}" && export NODE_PATH=/app:./node_modules && node src/index.js) &

# Give services time to bind ports
sleep 4

echo "=== Starting Nginx Gateway on port $PORT ==="
nginx -g "daemon off;"
