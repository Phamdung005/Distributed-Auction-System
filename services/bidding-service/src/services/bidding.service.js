const biddingRepository = require('../repositories/bidding.repository');

/**
 * Service Layer - Business Logic cho Bidding
 */
class BiddingService {

    /**
     * Xử lý đặt giá với Race Condition handling sử dụng Redis SET NX
     * @param {Object} redis - Redis client
     * @param {string} auctionId
     * @param {string} bidderId
     * @param {number} bidAmount
     * @returns {Promise<Object>}
     */
    async placeBid(redis, auctionId, bidderId, bidAmount) {
        // Tạo lock key để đảm bảo atomic operation
        const lockKey = `auction:${auctionId}:lock`;
        const lockValue = `${bidderId}-${Date.now()}`;
        const lockTTL = 5; // 5 giây

        try {
            // Bước 1: Thử acquire lock bằng SET NX (SET if Not eXists)
            const lockAcquired = await redis.set(lockKey, lockValue, {
                NX: true, // Chỉ set nếu key chưa tồn tại
                EX: lockTTL // Expire sau 5 giây
            });

            if (!lockAcquired) {
                throw new Error('Đang có người khác đặt giá, vui lòng thử lại');
            }

            // Bước 2: Lấy thông tin auction
            const auction = await biddingRepository.getAuctionById(auctionId);

            if (!auction) {
                throw new Error('Auction không tồn tại');
            }

            // Bước 3: Validate auction status
            if (auction.status !== 'active') {
                throw new Error('Auction không còn hoạt động');
            }

            const now = new Date();
            if (auction.endTime <= now) {
                throw new Error('Auction đã kết thúc');
            }

            if (auction.startTime > now) {
                throw new Error('Auction chưa bắt đầu');
            }

            // Bước 4: Lấy giá hiện tại từ cache
            const currentPrice = await biddingRepository.getCurrentPrice(redis, auctionId);

            // Bước 5: Validate bid amount
            const minNextBid = currentPrice + auction.minBidIncrement;

            if (bidAmount < minNextBid) {
                throw new Error(`Giá đặt phải lớn hơn hoặc bằng ${minNextBid.toLocaleString('vi-VN')} VND`);
            }

            // Bước 6: Kiểm tra không tự bid vào auction của mình
            if (auction.seller.toString() === bidderId) {
                throw new Error('Không thể đặt giá vào auction của chính mình');
            }

            // Bước 7: Cập nhật giá trong MongoDB
            const updatedAuction = await biddingRepository.updateCurrentPrice(
                auctionId,
                bidAmount,
                bidderId
            );

            // Bước 8: Cập nhật cache trong Redis
            await biddingRepository.cachePrice(redis, auctionId, bidAmount);

            // Bước 9: Lưu bid history vào Redis sorted set (để tracking)
            await redis.zAdd(`auction:${auctionId}:bids`, {
                score: Date.now(),
                value: JSON.stringify({
                    bidderId,
                    amount: bidAmount,
                    timestamp: new Date().toISOString()
                })
            });

            // Bước 10: Publish event qua Redis Pub/Sub để thông báo cho các instances khác
            await redis.publish('auction:bid:placed', JSON.stringify({
                auctionId,
                bidderId,
                amount: bidAmount,
                timestamp: new Date().toISOString()
            }));

            return {
                success: true,
                auctionId,
                newPrice: bidAmount,
                minNextBid: bidAmount + auction.minBidIncrement,
                totalBids: updatedAuction.totalBids
            };

        } catch (error) {
            throw error;
        } finally {
            // Bước 11: Release lock (quan trọng!)
            // Chỉ xóa lock nếu lock value khớp (tránh xóa lock của người khác)
            const currentLock = await redis.get(lockKey);
            if (currentLock === lockValue) {
                await redis.del(lockKey);
            }
        }
    }

    /**
     * Lấy thông tin auction chi tiết
     * @param {string} auctionId
     * @returns {Promise<Object>}
     */
    async getAuctionDetails(auctionId) {
        const auction = await biddingRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        return {
            id: auction._id,
            title: auction.title,
            description: auction.description,
            currentPrice: auction.currentPrice,
            minBidIncrement: auction.minBidIncrement,
            startTime: auction.startTime,
            endTime: auction.endTime,
            status: auction.status,
            totalBids: auction.totalBids,
            timeRemaining: auction.timeRemaining,
            recentBids: auction.recentBids
        };
    }

    /**
     * Lấy bid history của auction
     * @param {Object} redis
     * @param {string} auctionId
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getBidHistory(redis, auctionId, limit = 20) {
        // Lấy từ Redis sorted set (sorted by timestamp)
        const bids = await redis.zRange(`auction:${auctionId}:bids`, 0, limit - 1, {
            REV: true // Reverse order (newest first)
        });

        return bids.map(bid => JSON.parse(bid));
    }

    /**
     * Kiểm tra user có thể bid không
     * @param {string} userId
     * @param {string} auctionId
     * @returns {Promise<Object>}
     */
    async canUserBid(userId, auctionId) {
        const auction = await biddingRepository.getAuctionById(auctionId);

        if (!auction) {
            return { canBid: false, reason: 'Auction không tồn tại' };
        }

        if (auction.seller.toString() === userId) {
            return { canBid: false, reason: 'Không thể bid vào auction của chính mình' };
        }

        if (auction.status !== 'active') {
            return { canBid: false, reason: 'Auction không còn hoạt động' };
        }

        const now = new Date();
        if (auction.endTime <= now) {
            return { canBid: false, reason: 'Auction đã kết thúc' };
        }

        if (auction.startTime > now) {
            return { canBid: false, reason: 'Auction chưa bắt đầu' };
        }

        return { canBid: true };
    }

    /**
     * Tự động kết thúc auction
     * @param {string} auctionId
     * @returns {Promise<Object>}
     */
    async endAuction(auctionId) {
        const auction = await biddingRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Xác định winner (người bid gần nhất với giá cao nhất)
        const winnerId = auction.recentBids.length > 0
            ? auction.recentBids[0].bidder
            : null;

        await auction.endAuction(winnerId);

        return {
            auctionId,
            winnerId,
            finalPrice: auction.currentPrice
        };
    }
}

module.exports = new BiddingService();
