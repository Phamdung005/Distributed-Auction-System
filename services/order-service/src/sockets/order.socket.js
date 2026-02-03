const jwt = require('jsonwebtoken');

/**
 * Setup Socket.io for real-time order chat
 */
const setupOrderSocket = (io) => {
    // Middleware to authenticate socket connections
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication error'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.userId || decoded.id;

            next();
        } catch (error) {
            next(new Error('Authentication error'));
        }
    });

    io.on('connection', (socket) => {
        console.log(`✅ User ${socket.userId} connected to order chat`);

        // Join order-specific rooms
        socket.on('order:join', (orderId) => {
            socket.join(`order:${orderId}`);
            console.log(`User ${socket.userId} joined order room: ${orderId}`);
        });

        socket.on('order:leave', (orderId) => {
            socket.leave(`order:${orderId}`);
            console.log(`User ${socket.userId} left order room: ${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`❌ User ${socket.userId} disconnected from order chat`);
        });
    });

    // Store io instance globally
    global.orderIO = io;
};

/**
 * Notify room about new message
 */
const emitNewMessage = (orderId, message) => {
    if (global.orderIO) {
        console.log(`📡 Emitting message:new to room order:${orderId}`);
        global.orderIO.to(`order:${orderId}`).emit('message:new', message);
    }
};

module.exports = setupOrderSocket;
module.exports.emitNewMessage = emitNewMessage;
