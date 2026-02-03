import { io } from 'socket.io-client';

const NOTIFICATION_SOCKET_URL = 'http://localhost:3014';

let notificationSocket = null;
let currentToken = null;

/**
 * Kết nối Socket.io cho Notifications
 * @param {string} token - JWT access token
 * @returns {Socket} socket instance
 */
export const connectNotificationSocket = (token) => {
    // Nếu socket đã tồn tại và token không đổi, không cần kết nối lại
    if (notificationSocket && currentToken === token) {
        return notificationSocket;
    }

    currentToken = token;

    if (notificationSocket) {
        notificationSocket.removeAllListeners();
        notificationSocket.disconnect();
        notificationSocket = null;
    }

    if (!token) return null;

    notificationSocket = io(NOTIFICATION_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
    });

    notificationSocket.on('connect', () => {
        console.log('✅ Notification socket connected');
    });

    notificationSocket.on('connect_error', (error) => {
        console.error('❌ Notification socket error:', error.message);

        // Nếu lỗi xác thực, thử lấy token mới nhất từ localStorage và kết nối lại
        if (error.message === 'Authentication error') {
            const newToken = localStorage.getItem('accessToken');
            if (newToken && newToken !== currentToken) {
                console.log('🔄 Retrying socket connection with new token...');
                currentToken = newToken;
                notificationSocket.auth.token = newToken;
                notificationSocket.connect();
            }
        }
    });

    return notificationSocket;
};

/**
 * Ngắt kết nối notification socket
 */
export const disconnectNotificationSocket = () => {
    if (notificationSocket) {
        notificationSocket.removeAllListeners();
        notificationSocket.disconnect();
        notificationSocket = null;
        console.log('🔌 Notification socket disconnected');
    }
};

export const getNotificationSocket = () => notificationSocket;

export default {
    connectNotificationSocket,
    disconnectNotificationSocket,
    getNotificationSocket
};
