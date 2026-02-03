import { io } from 'socket.io-client';

const ORDER_SOCKET_URL = 'http://localhost:3007';

let orderSocket = null;
let currentToken = null;

export const connectOrderSocket = (token) => {
    if (orderSocket && currentToken === token) {
        return orderSocket;
    }

    currentToken = token;

    if (orderSocket) {
        orderSocket.removeAllListeners();
        orderSocket.disconnect();
        orderSocket = null;
    }

    if (!token) return null;

    orderSocket = io(ORDER_SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
    });

    orderSocket.on('connect', () => {
        console.log('✅ Order socket connected');
    });

    return orderSocket;
};

export const disconnectOrderSocket = () => {
    if (orderSocket) {
        orderSocket.removeAllListeners();
        orderSocket.disconnect();
        orderSocket = null;
        console.log('🔌 Order socket disconnected');
    }
};

export default {
    connectOrderSocket,
    disconnectOrderSocket,
};
