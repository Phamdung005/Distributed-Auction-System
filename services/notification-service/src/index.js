require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

// Shared database connections
const connectDB = require('../../shared/database/mongodb');
const { createRedisClient } = require('../../shared/database/redis');

// Routes
const notificationRoutes = require('./routes/notification.routes');

// Socket handlers
const setupNotificationSocket = require('./sockets/notification.socket');

// Services
const pubsubService = require('./services/pubsub.service');
const schedulerService = require('./services/scheduler.service');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'notification-service' });
});

// API Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error'
    });
});

// Initialize server
const PORT = process.env.PORT || 3004;

const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB(process.env.MONGODB_URI);

        // Connect to Redis (need 2 clients: one for operations, one for Pub/Sub)
        const redisClient = await createRedisClient(process.env.REDIS_URL);
        const redisSubscriber = await createRedisClient(process.env.REDIS_URL);

        // Store redis clients globally
        global.redisClient = redisClient;
        global.redisSubscriber = redisSubscriber;

        // Setup Socket.io
        setupNotificationSocket(io);

        // Start Redis Pub/Sub subscriber
        await pubsubService.initialize(redisSubscriber, io);

        // Start scheduler for auction notifications
        schedulerService.start();

        // Start server
        server.listen(PORT, () => {
            console.log(`🚀 Notification Service running on port ${PORT}`);
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

startServer();

module.exports = { app, io };
