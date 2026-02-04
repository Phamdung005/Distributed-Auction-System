const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const connectDB = require('shared/database/mongodb');
const { createRedisClient } = require('shared/database/redis');
const auctionRoutes = require('./routes/auction.routes');
const registrationRoutes = require('./routes/registration.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 3002;

let redisClient;

/**
 * Khởi tạo ứng dụng
 */
const initializeApp = async () => {
    try {
        await connectDB(process.env.MONGODB_URI);

        // Import local models after DB connection
        require('./models/Auction');
        require('./models/AuctionRegistration');

        redisClient = await createRedisClient(process.env.REDIS_URL);
        app.locals.redis = redisClient;

        // Periodic check for ended auctions (every minute)
        setInterval(async () => {
            try {
                const Auction = require('./models/Auction');
                const auctionService = require('./services/auction.service');
                const now = new Date();

                // Find active auctions that should have ended
                const auctionsToEnd = await Auction.find({
                    status: 'active',
                    endTime: { $lte: now }
                });

                if (auctionsToEnd.length > 0) {
                    console.log(`🕒 Cron: Found ${auctionsToEnd.length} auctions to end`);
                    for (const auction of auctionsToEnd) {
                        await auctionService.getAuctionById(auction._id, false); // This triggers _updateAuctionStatus
                    }
                }
            } catch (cronError) {
                console.error('❌ Error in auction end cron:', cronError);
            }
        }, 60000);

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
        service: 'auction-service',
        timestamp: new Date().toISOString()
    });
});

// Routes
app.use('/api/auctions', registrationRoutes); // Mount registration routes (/:id/register)
app.use('/api/auctions', auctionRoutes);

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
        console.log(`🚀 Auction Service đang chạy tại port ${PORT}`);
    });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    if (redisClient) await redisClient.quit();
    process.exit(0);
});

module.exports = app;
