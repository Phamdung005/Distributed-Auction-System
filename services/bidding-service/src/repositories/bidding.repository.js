const Auction = require('shared/models/Auction');

/**
 * Repository Layer cho Bidding
 */
class BiddingRepository {

    /**
     * Lấy thông tin auction theo ID
     * @param {string} auctionId
     * @returns {Promise<Auction|null>}
     */
    async getAuctionById(auctionId) {
        return await Auction.findById(auctionId);
    }

    /**
     * Lấy giá hiện tại của auction từ Redis hoặc MongoDB
     * @param {Object} redis - Redis client
     * @param {string} auctionId
     * @returns {Promise<number>}
     */
    async getCurrentPrice(redis, auctionId) {
        // Thử lấy từ Redis cache trước
        const cachedPrice = await redis.get(`auction:${auctionId}:price`);

        if (cachedPrice) {
            return parseFloat(cachedPrice);
        }

        // Nếu không có trong Redis, lấy từ MongoDB
        const auction = await Auction.findById(auctionId);
        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Cache vào Redis
        await redis.set(`auction:${auctionId}:price`, auction.currentPrice, {
            EX: 3600 // Expire sau 1 giờ
        });

        return auction.currentPrice;
    }

    /**
     * Cập nhật giá hiện tại (trong MongoDB)
     * @param {string} auctionId
     * @param {number} newPrice
     * @param {string} bidderId
     * @returns {Promise<Auction>}
     */
    async updateCurrentPrice(auctionId, newPrice, bidderId) {
        const auction = await Auction.findById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        await auction.updateCurrentPrice(newPrice, bidderId);
        return auction;
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
     * Lấy tất cả bids của một auction
     * @param {string} auctionId
     * @returns {Promise<Array>}
     */
    async getAuctionBids(auctionId) {
        const auction = await Auction.findById(auctionId)
            .select('recentBids')
            .populate('recentBids.bidder', 'username fullName');

        return auction ? auction.recentBids : [];
    }

    /**
     * Lấy danh sách auctions đang active
     * @returns {Promise<Array>}
     */
    async getActiveAuctions() {
        return await Auction.findActiveAuctions();
    }
}

module.exports = new BiddingRepository();
