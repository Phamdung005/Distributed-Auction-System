const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('shared/database/mongodb');
const { createRedisClient } = require('shared/database/redis');

// Import local models to register schemas
require('./models/Transaction');
require('./models/Escrow');

const walletRoutes = require('./routes/wallet.routes');
const paymentRoutes = require('./routes/payment.routes');
const transactionRoutes = require('./routes/transaction.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3006;

let redisClient;

/**
 * Khởi tạo ứng dụng
 */
const initializeApp = async () => {
    try {
        await connectDB(process.env.MONGODB_URI);

        redisClient = await createRedisClient(process.env.REDIS_URL);
        app.locals.redis = redisClient;

        console.log('✅ Tất cả kết nối đã được thiết lập');
    } catch (error) {
        console.error('❌ Lỗi khởi tạo:', error);
        process.exit(1);
    }
};

// Middlewares
app.use(helmet());
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        service: 'payment-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/wallet', walletRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/transactions', transactionRoutes);

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
        console.log(`🚀 Payment Service đang chạy tại port ${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (redisClient) await redisClient.quit();
    process.exit(0);
});

module.exports = app;
