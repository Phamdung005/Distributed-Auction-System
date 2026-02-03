const auctionRepository = require('../repositories/auction.repository');

/**
 * Service Layer - Business Logic cho Auction
 */
class AuctionService {

    /**
     * Tạo auction mới
     * @param {Object} auctionData
     * @param {string} sellerId
     * @returns {Promise<Object>}
     */
    async createAuction(auctionData, sellerId) {
        // Validate thời gian
        const now = new Date();
        const startTime = new Date(auctionData.startTime);
        const endTime = new Date(auctionData.endTime);

        if (startTime < now) {
            throw new Error('Thời gian bắt đầu phải sau thời gian hiện tại');
        }

        if (endTime <= startTime) {
            throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
        }

        // Validate giá
        if (auctionData.buyNowPrice && auctionData.buyNowPrice <= auctionData.startPrice) {
            throw new Error('Giá mua ngay phải lớn hơn giá khởi điểm');
        }

        // Tạo auction
        const auction = await auctionRepository.createAuction({
            ...auctionData,
            seller: sellerId,
            status: startTime <= now ? 'active' : 'pending'
        });

        return {
            id: auction._id,
            title: auction.title,
            description: auction.description,
            startPrice: auction.startPrice,
            currentPrice: auction.currentPrice,
            minBidIncrement: auction.minBidIncrement,
            startTime: auction.startTime,
            endTime: auction.endTime,
            status: auction.status,
            category: auction.category
        };
    }

    /**
     * Lấy auction theo ID
     * @param {string} auctionId
     * @param {boolean} incrementView
     * @returns {Promise<Object>}
     */
    async getAuctionById(auctionId, incrementView = true) {
        const auction = await auctionRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Auto-update status based on time
        await this._updateAuctionStatus(auction);

        // Tăng view count
        if (incrementView) {
            await auctionRepository.incrementViewCount(auctionId);
        }

        return this._formatAuction(auction);
    }

    /**
     * Lấy danh sách auctions
     * @param {Object} query
     * @returns {Promise<Object>}
     */
    async getAuctions(query = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            status,
            category,
            keyword
        } = query;

        let result;

        if (keyword) {
            result = await auctionRepository.searchAuctions(keyword, { page, limit, sort });
        } else if (category) {
            result = await auctionRepository.getAuctionsByCategory(category, { page, limit, sort });
        } else {
            const filter = status ? { status } : {};
            result = await auctionRepository.getAuctions(filter, { page, limit, sort });
        }

        return {
            auctions: result.auctions.map(a => this._formatAuction(a)),
            pagination: result.pagination
        };
    }

    /**
     * Lấy auctions đang active
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getActiveAuctions(options = {}) {
        const result = await auctionRepository.getActiveAuctions(options);
        return {
            auctions: result.auctions.map(a => this._formatAuction(a)),
            pagination: result.pagination
        };
    }

    /**
     * Lấy auctions của seller
     * @param {string} sellerId
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getMyAuctions(sellerId, options = {}) {
        const result = await auctionRepository.getAuctionsBySeller(sellerId, options);
        return {
            auctions: result.auctions.map(a => this._formatAuction(a)),
            pagination: result.pagination
        };
    }

    /**
     * Cập nhật auction
     * @param {string} auctionId
     * @param {string} sellerId
     * @param {Object} updateData
     * @param {string} userRole
     * @returns {Promise<Object>}
     */
    async updateAuction(auctionId, sellerId, updateData, userRole) {
        const auction = await auctionRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Kiểm tra quyền sở hữu (Admin bypass)
        if (userRole !== 'admin' && auction.seller._id.toString() !== sellerId) {
            throw new Error('Bạn không có quyền chỉnh sửa auction này');
        }

        // Không cho phép update nếu đã có người bid (trừ khi admin cần can thiệp gấp - nhưng logic business nên giữ chặt)
        // Let's allow admin to update even if bids exist? No, that breaks integrity. 
        // Admin should cancelling if logic is broken.
        // Keeping integrity check for now even for admin unless explicitly requested otherwise.
        if (auction.totalBids > 0) {
            throw new Error('Không thể chỉnh sửa auction đã có người đặt giá');
        }

        // Không cho phép update nếu đã kết thúc
        if (auction.status === 'ended') {
            throw new Error('Không thể chỉnh sửa auction đã kết thúc');
        }

        const updated = await auctionRepository.updateAuction(auctionId, updateData);
        return this._formatAuction(updated);
    }

    /**
     * Cập nhật giá auction (Internal)
     * @param {string} auctionId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    async updatePrice(auctionId, updateData) {
        const auction = await auctionRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Construct MongoDB update operation
        const updateOp = {};

        if (updateData.currentPrice !== undefined) {
            updateOp.$set = { currentPrice: updateData.currentPrice };
        }

        if (updateData.totalBids !== undefined) {
            updateOp.$inc = { totalBids: updateData.totalBids };
        }

        if (updateData.winner !== undefined) {
            updateOp.$set.winner = updateData.winner;
        }

        // We pass the raw update operator to repository which passes it to findByIdAndUpdate
        const updated = await auctionRepository.updateAuction(auctionId, updateOp);
        return this._formatAuction(updated);
    }

    /**
     * Xóa auction
     * @param {string} auctionId
     * @param {string} sellerId
     * @returns {Promise<void>}
     */
    async deleteAuction(auctionId, sellerId, userRole) {
        const auction = await auctionRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        // Nếu không phải admin thì phải check owner
        if (userRole !== 'admin' && auction.seller._id.toString() !== sellerId) {
            throw new Error('Bạn không có quyền xóa auction này');
        }

        if (auction.totalBids > 0) {
            throw new Error('Không thể xóa auction đã có người đặt giá');
        }

        await auctionRepository.deleteAuction(auctionId);
    }

    /**
     * Hủy auction
     * @param {string} auctionId
     * @param {string} sellerId
     * @param {string} userRole
     * @returns {Promise<Object>}
     */
    async cancelAuction(auctionId, sellerId, userRole) {
        const auction = await auctionRepository.getAuctionById(auctionId);

        if (!auction) {
            throw new Error('Auction không tồn tại');
        }

        if (userRole !== 'admin' && auction.seller._id.toString() !== sellerId) {
            throw new Error('Bạn không có quyền hủy auction này');
        }

        if (auction.status === 'ended') {
            throw new Error('Không thể hủy auction đã kết thúc');
        }

        const updated = await auctionRepository.updateAuction(auctionId, {
            status: 'cancelled'
        });

        return this._formatAuction(updated);
    }

    async _updateAuctionStatus(auction) {
        const now = new Date();
        const startTime = new Date(auction.startTime);
        const endTime = new Date(auction.endTime);
        let newStatus = auction.status;

        // Check if pending auction should become active
        if (auction.status === 'pending' && now >= startTime) {
            newStatus = 'active';
        }

        // Check if active auction should end
        if (auction.status === 'active' && now >= endTime) {
            newStatus = 'ended';
        }

        // Update status if changed
        if (newStatus !== auction.status) {
            // Use findByIdAndUpdate to ensure atomic update
            await auctionRepository.updateAuction(auction._id, { status: newStatus });
            auction.status = newStatus;

            // If auction ended, publish event for downstream services (Order, Payment)
            if (newStatus === 'ended') {
                try {
                    const { createRedisClient } = require('shared/database/redis');
                    const redisPublisher = await createRedisClient(process.env.REDIS_URL);

                    const payload = JSON.stringify(auction);
                    await redisPublisher.publish('auction:ended', payload);
                    console.log(`📡 Published auction.ended event for auction ${auction._id} (Winner: ${auction.winner ? auction.winner : 'None'})`);

                    await redisPublisher.quit();
                } catch (error) {
                    console.error('❌ Failed to publish auction.ended event:', error);
                }
            }
        }
    }

    /**
     * Format auction object
     * @private
     */
    _formatAuction(auction) {
        return {
            id: auction._id,
            title: auction.title,
            description: auction.description,
            images: auction.images,
            category: auction.category,
            startPrice: auction.startPrice,
            currentPrice: auction.currentPrice,
            minBidIncrement: auction.minBidIncrement,
            buyNowPrice: auction.buyNowPrice,
            startTime: auction.startTime,
            endTime: auction.endTime,
            status: auction.status,
            seller: auction.seller ? {
                id: auction.seller._id,
                username: auction.seller.username,
                fullName: auction.seller.fullName
            } : null,
            winner: auction.winner ? {
                id: auction.winner._id,
                username: auction.winner.username,
                fullName: auction.winner.fullName
            } : null,
            totalBids: auction.totalBids,
            totalParticipants: auction.totalParticipants,
            viewCount: auction.viewCount,
            recentBids: auction.recentBids,
            metadata: auction.metadata,
            timeRemaining: auction.timeRemaining,
            createdAt: auction.createdAt,
            updatedAt: auction.updatedAt
        };
    }
}

module.exports = new AuctionService();
