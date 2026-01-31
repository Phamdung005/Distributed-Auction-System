const Bid = require('../models/Bid');

/**
 * Repository Layer cho Bidding
 * Note: Auction data should be fetched via Auction Service API, not direct DB access
 */
class BiddingRepository {

    /**
     * Tạo bid mới
     * @param {Object} bidData
     * @returns {Promise<Bid>}
     */
    async createBid(bidData) {
        const bid = new Bid(bidData);
        await bid.save();
        return bid;
    }

    /**
     * Lấy bid cao nhất của auction
     * @param {string} auctionId
     * @returns {Promise<Bid|null>}
     */
    async getHighestBid(auctionId) {
        return await Bid.getHighestBid(auctionId);
    }

    /**
     * Lấy tất cả bids của một auction
     * @param {string} auctionId
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getAuctionBids(auctionId, limit = 50) {
        return await Bid.getAuctionBids(auctionId, limit);
    }

    /**
     * Lấy tất cả bids của một user
     * @param {string} userId
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    async getUserBids(userId, limit = 50) {
        return await Bid.getUserBids(userId, limit);
    }

    /**
     * Đếm số lượng bids của auction
     * @param {string} auctionId
     * @returns {Promise<number>}
     */
    async countAuctionBids(auctionId) {
        return await Bid.countAuctionBids(auctionId);
    }

    /**
     * Đếm số người tham gia đấu giá
     * @param {string} auctionId
     * @returns {Promise<number>}
     */
    async countUniqueBidders(auctionId) {
        return await Bid.countUniqueBidders(auctionId);
    }

    /**
     * Đánh dấu bid là winning
     * @param {string} bidId
     * @returns {Promise<Bid>}
     */
    async markBidAsWinning(bidId) {
        const bid = await Bid.findById(bidId);
        if (!bid) {
            throw new Error('Bid không tồn tại');
        }
        await bid.markAsWinning();
        return bid;
    }

    /**
     * Lưu giá vào Redis cache
     * @param {Object} redis
     * @param {string} auctionId
     * @param {number} price
     */
    async cachePrice(redis, auctionId, price) {
        await redis.set(`auction:${auctionId}:price`, price, {
            EX: 3600
        });
    }

    /**
     * Lấy giá từ Redis cache
     * @param {Object} redis
     * @param {string} auctionId
     * @returns {Promise<number|null>}
     */
    async getCachedPrice(redis, auctionId) {
        const cachedPrice = await redis.get(`auction:${auctionId}:price`);
        return cachedPrice ? parseFloat(cachedPrice) : null;
    }
}

module.exports = new BiddingRepository();
