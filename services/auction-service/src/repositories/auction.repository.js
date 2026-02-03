const Auction = require('../models/Auction');
const AuctionRegistration = require('../models/AuctionRegistration');

/**
 * Repository Layer cho Auction
 */
class AuctionRepository {

    /**
     * Tạo auction mới
     * @param {Object} auctionData
     * @returns {Promise<Auction>}
     */
    async createAuction(auctionData) {
        const auction = new Auction(auctionData);
        await auction.save();
        return auction;
    }

    /**
     * Lấy auction theo ID
     * @param {string} auctionId
     * @returns {Promise<Auction|null>}
     */
    async getAuctionById(auctionId) {
        // No populate - seller and winner are String IDs from Auth Service
        return await Auction.findById(auctionId);
    }

    /**
     * Lấy danh sách auctions với filter và pagination
     * @param {Object} filter
     * @param {Object} options - {page, limit, sort}
     * @returns {Promise<Object>}
     */
    async getAuctions(filter = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt'
        } = options;

        const skip = (page - 1) * limit;

        // Add time-based filtering based on status to prevent expired auctions from showing
        const now = new Date();
        const enhancedFilter = { ...filter };

        // Handle comma-separated statuses for $in query
        if (filter.status && typeof filter.status === 'string' && filter.status.includes(',')) {
            const statuses = filter.status.split(',');
            delete enhancedFilter.status; // Remove pure string match

            // Build $or query for time-based validity of each status
            const statusConditions = [];

            if (statuses.includes('active')) {
                statusConditions.push({
                    status: 'active',
                    startTime: { $lte: now },
                    endTime: { $gt: now }
                });
            }
            if (statuses.includes('pending')) {
                statusConditions.push({
                    status: 'pending',
                    startTime: { $gt: now }
                });
            }
            if (statuses.includes('ended')) {
                statusConditions.push({
                    status: 'ended', // Ended auctions might not strictly need endTime check if purely updated by status, but good to be safe or just trust status
                });
            }

            if (statusConditions.length > 0) {
                enhancedFilter.$or = statusConditions;
            } else {
                enhancedFilter.status = { $in: statuses };
            }

        } else if (filter.status === 'active') {
            // For active auctions, ensure they haven't expired
            enhancedFilter.startTime = { $lte: now };
            enhancedFilter.endTime = { $gt: now };
        } else if (filter.status === 'pending') {
            // For pending auctions, ensure they haven't started yet
            enhancedFilter.startTime = { $gt: now };
        } else if (filter.status === 'ended') {
            // For ended auctions, ensure they have actually ended
            enhancedFilter.endTime = { $lte: now };
        }

        const [auctions, total] = await Promise.all([
            Auction.find(enhancedFilter)
                // No populate - seller is String ID from Auth Service
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Auction.countDocuments(enhancedFilter)
        ]);

        return {
            auctions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        };
    }

    /**
     * Cập nhật auction
     * @param {string} auctionId
     * @param {Object} updateData
     * @returns {Promise<Auction|null>}
     */
    async updateAuction(auctionId, updateData) {
        return await Auction.findByIdAndUpdate(
            auctionId,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa auction
     * @param {string} auctionId
     * @returns {Promise<Auction|null>}
     */
    async deleteAuction(auctionId) {
        return await Auction.findByIdAndDelete(auctionId);
    }

    /**
     * Lấy auctions của seller
     * @param {string} sellerId
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getAuctionsBySeller(sellerId, options = {}) {
        return await this.getAuctions({ seller: sellerId }, options);
    }

    /**
     * Tìm kiếm auctions
     * @param {string} keyword
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async searchAuctions(keyword, options = {}) {
        const filter = {
            $or: [
                { title: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ]
        };
        return await this.getAuctions(filter, options);
    }

    /**
     * Lấy auctions theo category
     * @param {string} category
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getAuctionsByCategory(category, options = {}) {
        return await this.getAuctions({ category }, options);
    }

    /**
     * Lấy auctions đang active
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async getActiveAuctions(options = {}) {
        const now = new Date();
        const filter = {
            status: 'active',
            startTime: { $lte: now },
            endTime: { $gt: now }
        };
        return await this.getAuctions(filter, options);
    }

    /**
     * Tăng view count
     * @param {string} auctionId
     */
    async incrementViewCount(auctionId) {
        await Auction.findByIdAndUpdate(auctionId, {
            $inc: { viewCount: 1 }
        });
    }
}

module.exports = new AuctionRepository();
