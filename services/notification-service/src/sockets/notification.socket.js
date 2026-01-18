const jwt = require('jsonwebtoken');

/**
 * Setup Socket.io for real-time notifications
 */
const setupNotificationSocket = (io) => {

    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId || decoded.id;
            socket.userRole = decoded.role;

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.userId} connected to notifications`);

        // Join user-specific room
        socket.join(`user:${socket.userId}`);

        // Handle mark as read
        socket.on('notification:mark-read', async (notificationId) => {
            try {
                // This would call the service to mark as read
                socket.emit('notification:marked-read', { notificationId });
            } catch (error) {
                socket.emit('error', { message: error.message });
            }
        });

        socket.on('disconnect', () => {
            console.log(`❌ User ${socket.userId} disconnected from notifications`);
        });
    });

    // Store io instance globally for use in other services
    global.notificationIO = io;
};

/**
 * Send notification to specific user via WebSocket
 */
const sendNotificationToUser = (userId, notification) => {
    if (global.notificationIO) {
        global.notificationIO.to(`user:${userId}`).emit('notification:new', notification);
    }
};

module.exports = setupNotificationSocket;
module.exports.sendNotificationToUser = sendNotificationToUser;
