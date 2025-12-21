const redis = require('redis');

/**
 * Tạo và kết nối Redis client
 * @param {string} url - Redis connection URL
 * @returns {Promise<RedisClient>}
 */
const createRedisClient = async (url) => {
    try {
        const client = redis.createClient({
            url: url,
            socket: {
                reconnectStrategy: (retries) => {
                    if (retries > 10) {
                        return new Error('Redis reconnect limit exceeded');
                    }
                    return retries * 500; // Tăng thời gian chờ giữa các lần thử
                }
            }
        });

        // Lắng nghe events
        client.on('error', (err) => console.error('❌ Redis Client Error:', err));
        client.on('connect', () => console.log('🔄 Đang kết nối Redis...'));
        client.on('ready', () => console.log('✅ Redis đã sẵn sàng'));
        client.on('reconnecting', () => console.log('🔄 Đang kết nối lại Redis...'));

        await client.connect();
        return client;

    } catch (error) {
        console.error('❌ Lỗi kết nối Redis:', error.message);
        throw error;
    }
};

module.exports = { createRedisClient };
