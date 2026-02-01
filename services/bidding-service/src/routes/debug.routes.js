const express = require('express');
const router = express.Router();

/**
 * Debug endpoint to check active socket connections and rooms
 */
module.exports = (io) => {
    router.get('/debug/connections', (req, res) => {
        const connections = [];
        const rooms = {};

        // Get all connected sockets
        io.sockets.sockets.forEach((socket) => {
            connections.push({
                id: socket.id,
                userId: socket.user?.userId,
                connected: socket.connected,
                rooms: Array.from(socket.rooms).filter(r => r !== socket.id)
            });
        });

        // Get all rooms and their sizes
        io.sockets.adapter.rooms.forEach((value, key) => {
            if (!key.startsWith('auction:')) return;
            rooms[key] = {
                size: value.size,
                sockets: Array.from(value)
            };
        });

        res.json({
            totalConnections: connections.length,
            connections,
            auctionRooms: rooms
        });
    });

    return router;
};
