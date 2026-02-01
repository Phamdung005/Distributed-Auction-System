const Bid = require('../models/Bid');
const axios = require('axios');

// Auction Service URL from environment or default
const AUCTION_SERVICE_URL = process.env.AUCTION_SERVICE_URL || 'http://auction-service:3002';

/**
 * Repository Layer cho Bidding
 * Note: Auction data should be fetched via Auction Service API, not direct DB access
 */
class BiddingRepository {

    /**
     * Lấy auction từ Auction Service
     * @param {string} auctionId
     * @returns {Promise<Object|null>}
     */
    async getAuctionById(auctionId) {
        try {
            const response = await axios.get(`${AUCTION_SERVICE_URL}/api/auctions/${auctionId}`);
            return response.data?.data || null;
        } catch (error) {
            console.error(`Error fetching auction ${auctionId}:`, error.message);
            return null;
        }
    }

    /**
     * Cập nhật giá hiện tại của auction
     * @param {string} auctionId
     * @param {number} newPrice
     * @param {string} bidderId
     * @returns {Promise<Object>}
     */
    async updateCurrentPrice(auctionId, newPrice, bidderId) {
        try {
            const response = await axios.patch(
                `${AUCTION_SERVICE_URL}/api/auctions/${auctionId}`,
                { currentPrice: newPrice, totalBids: 1 }
            );
            return response.data?.data || {};
        } catch (error) {
            console.error('Error updating auction price:', error.message);
            throw error;
        }
    }

    /**
     * Lấy giá hiện tại của auction (từ cache hoặc API)
     * @param {Object} redis
     * @param {string} auctionId
     * @returns {Promise<number>}
     */
    async getCurrentPrice(redis, auctionId) {
        // Try cache first
        const cachedPrice = await this.getCachedPrice(redis, auctionId);
        if (cachedPrice !== null) {
            return cachedPrice;
        }

        // Fallback to API
        const auction = await this.getAuctionById(auctionId);
        return auction?.currentPrice || auction?.startPrice || 0;
    }

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
