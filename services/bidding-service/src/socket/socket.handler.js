const biddingService = require('../services/bidding.service');
const { authenticateSocket } = require('../middlewares/socketAuth');

/**
 * Khởi tạo Socket.IO event handlers
 * @param {Server} io - Socket.IO server instance
 * @param {RedisClient} redis - Redis client
 */
const initializeSocketHandlers = (io, redis) => {

    // Middleware xác thực cho tất cả connections
    io.use(authenticateSocket);

    // Subscribe to Redis Pub/Sub để đồng bộ giữa các instances
    const subscriber = redis.duplicate();
    subscriber.connect().then(() => {
        subscriber.subscribe('auction:bid:placed', (message) => {
            const bidData = JSON.parse(message);
            // Broadcast đến tất cả clients trong room
            io.to(`auction:${bidData.auctionId}`).emit('bid:update', bidData);
        });
        console.log('✅ Subscribed to Redis Pub/Sub channel');
    });

    /**
     * Connection handler
     */
    io.on('connection', (socket) => {
        console.log(`✅ Client connected: ${socket.id}, User: ${socket.user.userId}`);

        // Track which auction rooms this socket has joined
        socket.joinedAuctions = new Set();

        /**
         * Event: Join auction room
         * Client gửi: { auctionId: string }
         */
        socket.on('auction:join', async (data) => {
            try {
                const { auctionId } = data;

                if (!auctionId) {
                    socket.emit('error', { message: 'AuctionId là bắt buộc' });
                    return;
                }

                // Join vào room của auction
                socket.join(`auction:${auctionId}`);
                socket.joinedAuctions.add(auctionId);

                // Track socket for this user (1 user có thể có nhiều socket)
                await redis.sAdd(
                    `auction:${auctionId}:user:${socket.user.userId}:sockets`,
                    socket.id
                );

                // Thêm user vào viewers SET - SADD trả về 1 nếu user MỚI, 0 nếu đã tồn tại
                const isNewViewer = await redis.sAdd(
                    `auction:${auctionId}:viewers`,
                    socket.user.userId
                );
                const viewerCount = await redis.sCard(`auction:${auctionId}:viewers`);

                // Lấy thông tin auction
                const auctionDetails = await biddingService.getAuctionDetails(auctionId);

                // Luôn gửi thông tin cho chính socket này
                socket.emit('auction:joined', {
                    auctionId,
                    ...auctionDetails,
                    totalParticipants: viewerCount
                });

                // CHỈ broadcast khi user THỰC SỰ MỚI (refresh không tăng count)
                if (isNewViewer === 1) {
                    io.to(`auction:${auctionId}`).emit('user:joined', {
                        userId: socket.user.userId,
                        totalParticipants: viewerCount
                    });
                    console.log(`✅ NEW viewer: User ${socket.user.userId} joined auction ${auctionId}, total viewers: ${viewerCount}`);
                } else {
                    console.log(`🔄 User ${socket.user.userId} reconnected to auction ${auctionId}, viewers unchanged: ${viewerCount}`);
                }

            } catch (error) {
                console.error('Error joining auction:', error);
                socket.emit('error', { message: error.message });
            }
        });

        /**
         * Event: Leave auction room
         * Client gửi: { auctionId: string }
         */
        socket.on('auction:leave', async (data) => {
            const { auctionId } = data;

            if (auctionId) {
                // Leave the room
                socket.leave(`auction:${auctionId}`);
                socket.joinedAuctions.delete(auctionId);

                // Remove socket from user's socket set
                await redis.sRem(
                    `auction:${auctionId}:user:${socket.user.userId}:sockets`,
                    socket.id
                );

                // Check if user has any other sockets in this auction
                const userSocketCount = await redis.sCard(
                    `auction:${auctionId}:user:${socket.user.userId}:sockets`
                );

                // CHỈ remove user khi socket CUỐI CÙNG rời đi
                if (userSocketCount === 0) {
                    await redis.sRem(`auction:${auctionId}:viewers`, socket.user.userId);
                    const viewerCount = await redis.sCard(`auction:${auctionId}:viewers`);

                    // Broadcast user left
                    io.to(`auction:${auctionId}`).emit('user:left', {
                        userId: socket.user.userId,
                        totalParticipants: viewerCount
                    });

                    console.log(`❌ User ${socket.user.userId} left auction ${auctionId}, viewers: ${viewerCount}`);
                } else {
                    console.log(`🔄 Socket ${socket.id} left but user ${socket.user.userId} still has ${userSocketCount} socket(s) in auction ${auctionId}`);
                }
            }
        });

        /**
         * Event: Place bid (Đặt giá)
         * Client gửi: { auctionId: string, amount: number }
         */
        socket.on('bid:place', async (data) => {
            try {
                const { auctionId, amount } = data;

                // Validate input
                if (!auctionId || !amount) {
                    socket.emit('bid:error', { message: 'AuctionId và amount là bắt buộc' });
                    return;
                }

                if (typeof amount !== 'number' || amount <= 0) {
                    socket.emit('bid:error', { message: 'Amount phải là số dương' });
                    return;
                }

                // Kiểm tra role trước (gửi lỗi nhanh)
                if (socket.user.role !== 'bidder') {
                    socket.emit('bid:error', { message: 'Chỉ bidder mới được đặt giá' });
                    return;
                }

                // Kiểm tra user có thể bid không
                const canBid = await biddingService.canUserBid(socket.user.userId, auctionId, socket.user.role);
                if (!canBid.canBid) {
                    socket.emit('bid:error', { message: canBid.reason });
                    return;
                }

                // Xử lý đặt giá (với race condition handling)
                const result = await biddingService.placeBid(
                    redis,
                    auctionId,
                    socket.user.userId,
                    amount,
                    socket.user.role
                );

                // Gửi confirmation cho người bid
                socket.emit('bid:success', {
                    message: 'Đặt giá thành công',
                    ...result
                });

                // Redis Pub/Sub sẽ tự động broadcast đến tất cả clients
                // (Xem phần subscriber ở trên)

                console.log(`User ${socket.user.userId} placed bid ${amount} on auction ${auctionId}`);

            } catch (error) {
                console.error('Error placing bid:', error);
                socket.emit('bid:error', {
                    message: error.message || 'Có lỗi xảy ra khi đặt giá'
                });
            }
        });

        /**
         * Event: Get bid history
         * Client gửi: { auctionId: string, limit?: number }
         */
        socket.on('bid:history', async (data) => {
            try {
                const { auctionId, limit = 20 } = data;

                if (!auctionId) {
                    socket.emit('error', { message: 'AuctionId là bắt buộc' });
                    return;
                }

                const history = await biddingService.getBidHistory(redis, auctionId, limit);

                socket.emit('bid:history:response', {
                    auctionId,
                    bids: history
                });

            } catch (error) {
                console.error('Error getting bid history:', error);
                socket.emit('error', { message: error.message });
            }
        });

        /**
         * Event: Disconnect
         * Cleanup socket and remove user only if it's their last socket
         */
        socket.on('disconnect', async (reason) => {
            console.log(`❌ Socket disconnected: ${socket.id}, User: ${socket.user?.userId}, Reason: ${reason}`);

            // Cleanup all joined auction rooms
            if (socket.joinedAuctions && socket.joinedAuctions.size > 0) {
                for (const auctionId of socket.joinedAuctions) {
                    // Leave room
                    socket.leave(`auction:${auctionId}`);

                    // Remove THIS socket from user's socket set
                    await redis.sRem(
                        `auction:${auctionId}:user:${socket.user.userId}:sockets`,
                        socket.id
                    );

                    // Check if user has any remaining sockets
                    const userSocketCount = await redis.sCard(
                        `auction:${auctionId}:user:${socket.user.userId}:sockets`
                    );

                    // CHỈ remove user khi đây là socket CUỐI CÙNG
                    if (userSocketCount === 0) {
                        await redis.sRem(`auction:${auctionId}:viewers`, socket.user.userId);
                        const viewerCount = await redis.sCard(`auction:${auctionId}:viewers`);

                        // Broadcast user left
                        io.to(`auction:${auctionId}`).emit('user:left', {
                            userId: socket.user.userId,
                            totalParticipants: viewerCount
                        });

                        console.log(`👋 User ${socket.user.userId} fully disconnected from auction ${auctionId}, viewers: ${viewerCount}`);
                    } else {
                        console.log(`🔄 Socket ${socket.id} disconnected but user ${socket.user.userId} still has ${userSocketCount} socket(s) in auction ${auctionId}`);
                    }
                }

                socket.joinedAuctions.clear();
            }
        });

        /**
         * Event: Error handler
         */
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    });

    console.log('✅ Socket.IO handlers đã được khởi tạo');
};

module.exports = { initializeSocketHandlers };
