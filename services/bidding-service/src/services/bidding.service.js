const biddingRepository = require('../repositories/bidding.repository');

/**
 * Service Layer - Business Logic cho Bidding
 */
class BiddingService {

    /**
     * Xử lý đặt giá (không có Race Condition handling trên nhánh này)
     * @param {Object} redis
     * @param {string} auctionId
     * @param {string} bidderId
     * @param {number} bidAmount
     * @param {string} role - Role của user (phải là 'bidder')
     * @param {string} bidderName
     * @returns {Promise<Object>}
     */
    async placeBid(redis, auctionId, bidderId, bidAmount, role, bidderName) {
        // Chắn chắn chỉ bidder mới được đặt giá
        if (role !== 'bidder') {
            throw new Error('Chỉ bidder mới được đặt giá');
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

        // Bước 7: Lưu bid vào MongoDB (Bid model)
        const Bid = require('../models/Bid');

        // Mark previous winning bid as not winning
        await Bid.updateMany(
            {
                auction_id: auctionId,
                isWinning: true
            },
            { isWinning: false }
        );

        // Create new bid document
        const newBid = await Bid.create({
            auction_id: auctionId,
            bidder_id: bidderId,
            bidAmount: bidAmount,
            timestamp: new Date(),
            isWinning: true,
            isValid: true
        });

        // Bước 8: Cập nhật giá trong MongoDB
        const updatedAuction = await biddingRepository.updateCurrentPrice(
            auctionId,
            bidAmount,
            bidderId
        );

        // Bước 9: Cập nhật cache trong Redis
        await biddingRepository.cachePrice(redis, auctionId, bidAmount);

        // Bước 10: Lưu bid history vào Redis sorted set (để tracking)
        await redis.zAdd(`auction:${auctionId}:bids`, {
            score: Date.now(),
            value: JSON.stringify({
                bidderId,
                bidderName: bidderName || 'Người dùng',
                amount: bidAmount,
                timestamp: new Date().toISOString()
            })
        });

        // Bước 11: Publish event qua Redis Pub/Sub để thông báo cho các instances khác
        await redis.publish('auction:bid:placed', JSON.stringify({
            auctionId,
            bidderId,
            bidderName: bidderName || 'Người dùng',
            amount: bidAmount,
            auctionTitle: auction.title, // Add auction title for notification service
            timestamp: new Date().toISOString()
        }));

        return {
            success: true,
            auctionId,
            newPrice: bidAmount,
            minNextBid: bidAmount + auction.minBidIncrement,
            totalBids: updatedAuction.totalBids
        };
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
    async canUserBid(userId, auctionId, role) {
        // Chỉ 'bidder' mới được phép đặt giá
        if (role !== 'bidder') {
            return { canBid: false, reason: 'Chỉ bidder mới được đặt giá' };
        }

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
