import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3003';

let socket = null;

// Global tracking of joined auctions to prevent duplicates
const joinedAuctions = new Set();

/**
 * Kết nối Socket.io
 * @param {string|null} token - JWT access token (optional for anonymous viewing)
 * @returns {Socket} socket instance
 */
export const connectSocket = (token) => {
    // If socket already exists and is connected, return it
    if (socket?.connected) {
        console.log('Socket already connected, reusing existing connection');
        return socket;
    }

    // If socket exists but disconnected, disconnect it fully first
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
    }

    // Create new socket connection
    // Only pass token if it exists (allow anonymous connections)
    const socketConfig = {
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
    };

    // Add auth token only if provided
    if (token) {
        socketConfig.auth = { token };
    }

    socket = io(SOCKET_URL, socketConfig);

    // Connection events
    socket.on('connect', () => {
        console.log('✅ Socket connected:', socket.id, token ? '(authenticated)' : '(anonymous)');
    });

    socket.on('disconnect', (reason) => {
        console.log('❌ Socket disconnected:', reason);
        // Clear joined auctions on disconnect
        joinedAuctions.clear();
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
    if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
        joinedAuctions.clear();
        console.log('🔌 Socket disconnected and cleaned up');
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
 * @returns {boolean} - true if joined, false if already joined
 */
export const joinAuction = (auctionId, onJoined) => {
    if (!socket?.connected) {
        console.error('Socket not connected');
        return false;
    }

    // Check if already joined this auction
    if (joinedAuctions.has(auctionId)) {
        console.log(`Already joined auction ${auctionId}, skipping duplicate join`);
        return false;
    }

    socket.emit('auction:join', { auctionId });

    socket.once('auction:joined', (data) => {
        console.log('✅ Joined auction:', data);
        joinedAuctions.add(auctionId);
        if (onJoined) onJoined(data);
    });

    socket.on('error', (data) => {
        console.error('❌ Error:', data.message);
    });

    return true;
};

/**
 * Leave auction room
 * @param {string} auctionId
 */
export const leaveAuction = (auctionId) => {
    if (!socket?.connected) return;

    socket.emit('auction:leave', { auctionId });
    joinedAuctions.delete(auctionId);
    console.log(`Left auction ${auctionId}`);
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
