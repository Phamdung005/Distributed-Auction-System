const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('shared/database/mongodb');
const { createRedisClient } = require('shared/database/redis');
const { initializeSocketHandlers } = require('./socket/socket.handler');
const biddingRoutes = require('./routes/bidding.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);

// Cấu hình Socket.IO với CORS
const io = new Server(server, {
    cors: {
        origin: '*', // Trong production nên cấu hình cụ thể
        methods: ['GET', 'POST']
    }
});

const PORT = process.env.PORT || 3003;

// Global Redis Client
let redisClient;

/**
 * Khởi tạo ứng dụng
 */
const initializeApp = async () => {
    try {
        // Kết nối Database
        await connectDB(process.env.MONGODB_URI);

        // Kết nối Redis
        redisClient = await createRedisClient(process.env.REDIS_URL);

        // Lưu redis client vào app locals
        app.locals.redis = redisClient;
        io.redis = redisClient; // Để sử dụng trong socket handlers

        // Khởi tạo Socket.IO handlers
        initializeSocketHandlers(io, redisClient);

        console.log('✅ Tất cả kết nối đã được thiết lập');

    } catch (error) {
        console.error('❌ Lỗi khởi tạo:', error);
        process.exit(1);
    }
};

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'bidding-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/bidding', biddingRoutes);

// Debug routes (load after io is initialized)
setTimeout(() => {
    const debugRoutes = require('./routes/debug.routes')(io);
    app.use('/api', debugRoutes);
}, 1000);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route không tồn tại'
    });
});

// Error Handler
app.use(errorHandler);

// Khởi động server
initializeApp().then(() => {
    server.listen(PORT, () => {
        console.log(`🚀 Bidding Service đang chạy tại port ${PORT}`);
        console.log(`🔌 WebSocket server đã sẵn sàng`);
    });
});

// Xử lý graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (redisClient) await redisClient.quit();
    io.close();
    process.exit(0);
});

// Ví dụ logic xử lý đặt giá an toàn với Redis
async function placeBid(auctionId, userId, bidAmount) {
    const key = `auction:${auctionId}:current_price`;

    // Sử dụng Lua Script để đảm bảo tính nguyên tử (Atomic)
    const luaScript = `
    local currentPrice = redis.call('get', KEYS[1])
    if not currentPrice or tonumber(ARGV[1]) > tonumber(currentPrice) then
      redis.call('set', KEYS[1], ARGV[1])
      return 1
    else
      return 0
    end
  `;

    const result = await redis.eval(luaScript, 1, key, bidAmount);
    if (result === 1) {
        // Phát tín hiệu cho các server khác qua Redis Pub/Sub
        io.emit('priceUpdated', { auctionId, bidAmount, userId });
        return { success: true };
    }
    return { success: false, message: "Giá của bạn phải cao hơn giá hiện tại!" };
}

module.exports = { app, io };
