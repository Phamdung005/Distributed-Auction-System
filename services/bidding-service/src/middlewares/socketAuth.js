const jwt = require('jsonwebtoken');

/**
 * Xác thực Socket.IO connection với JWT token
 * Cho phép anonymous viewers (không bắt buộc token)
 * @param {Socket} socket
 * @param {Function} next
 */
const authenticateSocket = (socket, next) => {
    try {
        const token = socket.handshake.auth.token || socket.handshake.headers.token;

        if (!token) {
            // Cho phép anonymous viewers với guest ID
            socket.user = {
                userId: `guest_${socket.id}`,
                role: 'guest',
                isAnonymous: true
            };
            return next();
        }

        // Verify JWT token cho authenticated users
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

        // Lưu authenticated user info
        socket.user = {
            userId: decoded.userId,
            role: decoded.role,
            fullName: decoded.fullName || 'Người dùng',
            isAnonymous: false
        };

        next();
    } catch (error) {
        // Nếu token invalid, vẫn cho phép vào như guest
        socket.user = {
            userId: `guest_${socket.id}`,
            role: 'guest',
            isAnonymous: true
        };
        next();
    }
};

module.exports = { authenticateSocket };
