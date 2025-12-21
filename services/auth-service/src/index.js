const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('shared/database/mongodb');
const { createRedisClient } = require('shared/database/redis');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

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

        // Lưu redis client vào app locals để sử dụng trong các routes
        app.locals.redis = redisClient;

        console.log('✅ Tất cả kết nối đã được thiết lập');

    } catch (error) {
        console.error('❌ Lỗi khởi tạo:', error);
        process.exit(1);
    }
};

// Middlewares
app.use(helmet()); // Bảo mật HTTP headers
app.use(cors()); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded body

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'auth-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auth', authRoutes);

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
    app.listen(PORT, () => {
        console.log(`🚀 Auth Service đang chạy tại port ${PORT}`);
    });
});

// Xử lý graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (redisClient) await redisClient.quit();
    process.exit(0);
});

module.exports = app;
