const jwt = require('jsonwebtoken');

/**
 * Xác thực Socket.IO connection với JWT token
 * @param {Socket} socket
 * @param {Function} next
 */
const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;

        if (!token) {
            return next(new Error('Token không được cung cấp'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

        // Lưu user info vào socket
        socket.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        return next(new Error('Token không hợp lệ'));
    }
};

module.exports = { authenticateSocket };
