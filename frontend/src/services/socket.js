import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3003';

let socket = null;

/**
 * Kết nối Socket.io
 * @param {string} token - JWT access token
 * @returns {Socket} socket instance
 */
export const connectSocket = (token) => {
    if (!token) {
        console.error('Token is required to connect socket');
        return null;
    }

    // Ngắt kết nối cũ nếu có
    if (socket?.connected) {
        socket.disconnect();
    }

    socket = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    });

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id);
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
    });

    return socket;
};

/**
 * Ngắt kết nối socket
 */
export const disconnectSocket = () => {
    if (socket?.connected) {
        socket.disconnect();
        socket = null;
    }
};

/**
 * Lấy socket instance hiện tại
 * @returns {Socket|null}
 */
export const getSocket = () => socket;

/**
 * Join auction room
 * @param {string} auctionId
 * @param {Function} onJoined - Callback khi join thành công
 */
export const joinAuction = (auctionId, onJoined) => {
    if (!socket?.connected) {
        console.error('Socket not connected');
        return;
    }

    socket.emit('auction:join', { auctionId });

    socket.once('auction:joined', (data) => {
        console.log('✅ Joined auction:', data);
        if (onJoined) onJoined(data);
    });

    socket.on('error', (data) => {
        console.error('❌ Error:', data.message);
    });
};

/**
 * Leave auction room
 * @param {string} auctionId
 */
export const leaveAuction = (auctionId) => {
    if (!socket?.connected) return;
    socket.emit('auction:leave', { auctionId });
};

/**
 * Đặt giá
 * @param {string} auctionId
 * @param {number} amount
 * @returns {Promise}
 */
export const placeBid = (auctionId, amount) => {
    return new Promise((resolve, reject) => {
        if (!socket?.connected) {
            reject(new Error('Socket not connected'));
            return;
        }

        socket.emit('bid:place', { auctionId, amount });

        const successHandler = (data) => {
            socket.off('bid:success', successHandler);
            socket.off('bid:error', errorHandler);
            resolve(data);
        };

        const errorHandler = (data) => {
            socket.off('bid:success', successHandler);
            socket.off('bid:error', errorHandler);
            reject(new Error(data.message));
        };

        socket.once('bid:success', successHandler);
        socket.once('bid:error', errorHandler);
    });
};

/**
 * Lắng nghe bid updates
 * @param {Function} callback
 */
export const onBidUpdate = (callback) => {
    if (!socket) return;
    socket.on('bid:update', callback);
};

/**
 * Lắng nghe user joined
 * @param {Function} callback
 */
export const onUserJoined = (callback) => {
    if (!socket) return;
    socket.on('user:joined', callback);
};

/**
 * Lắng nghe user left
 * @param {Function} callback
 */
export const onUserLeft = (callback) => {
    if (!socket) return;
    socket.on('user:left', callback);
};

/**
 * Lấy bid history
 * @param {string} auctionId
 * @param {number} limit
 * @returns {Promise}
 */
export const getBidHistory = (auctionId, limit = 20) => {
    return new Promise((resolve, reject) => {
        if (!socket?.connected) {
            reject(new Error('Socket not connected'));
            return;
        }

        socket.emit('bid:history', { auctionId, limit });

        socket.once('bid:history:response', (data) => {
            resolve(data);
        });

        setTimeout(() => {
            reject(new Error('Timeout'));
        }, 5000);
    });
};

/**
 * Remove listeners
 */
export const removeListeners = () => {
    if (!socket) return;
    socket.off('bid:update');
    socket.off('user:joined');
    socket.off('user:left');
};

export default {
    connectSocket,
    disconnectSocket,
    getSocket,
    joinAuction,
    leaveAuction,
    placeBid,
    onBidUpdate,
    onUserJoined,
    onUserLeft,
    getBidHistory,
    removeListeners,
};
