const mongoose = require('mongoose');

/**
 * Schema cho Bid (Lượt đặt giá)
 * Lưu trữ tất cả lịch sử bidding, tách biệt khỏi Auction model
 */
const bidSchema = new mongoose.Schema({
    // Reference đến auction
    auction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: [true, 'Auction ID là bắt buộc'],
        index: true
    },

    // Reference đến người đặt giá
    bidder_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Bidder ID là bắt buộc'],
        index: true
    },

    // Số tiền đặt giá
    bidAmount: {
        type: Number,
        required: [true, 'Số tiền đặt giá là bắt buộc'],
        min: [0, 'Số tiền đặt giá phải lớn hơn 0']
    },

    // Thời gian đặt giá
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },

    // Bid này có đang là winning bid không?
    isWinning: {
        type: Boolean,
        default: false,
        index: true
    },

    // Bid có hợp lệ không? (có thể bị reject nếu vi phạm rules)
    isValid: {
        type: Boolean,
        default: true
    },

    // Metadata (optional - để tracking và security)
    metadata: {
        ipAddress: String,
        userAgent: String
    }
}, {
    timestamps: true // Tự động thêm createdAt và updatedAt
});

// Indexes để tối ưu query
bidSchema.index({ auction_id: 1, timestamp: -1 }); // Query bids của auction theo thời gian
bidSchema.index({ bidder_id: 1, timestamp: -1 }); // Query bids của user theo thời gian
bidSchema.index({ auction_id: 1, bidAmount: -1 }); // Tìm bid cao nhất của auction
bidSchema.index({ auction_id: 1, isWinning: 1 }); // Tìm winning bid

/**
 * Static Method: Lấy bid cao nhất của một auction
 * @param {string} auctionId - ID của auction
 * @returns {Promise<Bid|null>}
 */
bidSchema.statics.getHighestBid = function (auctionId) {
    return this.findOne({
        auction_id: auctionId,
        isValid: true
    })
        .sort({ bidAmount: -1 })
        .populate('bidder_id', 'username fullName');
};

/**
 * Static Method: Lấy tất cả bids của một auction
 * @param {string} auctionId - ID của auction
 * @param {number} limit - Số lượng bids cần lấy
 * @returns {Promise<Array>}
 */
bidSchema.statics.getAuctionBids = function (auctionId, limit = 50) {
    return this.find({
        auction_id: auctionId,
        isValid: true
    })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('bidder_id', 'username fullName');
};

/**
 * Static Method: Lấy tất cả bids của một user
 * @param {string} userId - ID của user
 * @param {number} limit - Số lượng bids cần lấy
 * @returns {Promise<Array>}
 */
bidSchema.statics.getUserBids = function (userId, limit = 50) {
    return this.find({
        bidder_id: userId,
        isValid: true
    })
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate('auction_id', 'title currentPrice status');
};

/**
 * Static Method: Đếm số lượng bids của một auction
 * @param {string} auctionId - ID của auction
 * @returns {Promise<number>}
 */
bidSchema.statics.countAuctionBids = function (auctionId) {
    return this.countDocuments({
        auction_id: auctionId,
        isValid: true
    });
};

/**
 * Static Method: Đếm số người tham gia đấu giá (unique bidders)
 * @param {string} auctionId - ID của auction
 * @returns {Promise<number>}
 */
bidSchema.statics.countUniqueBidders = async function (auctionId) {
    const result = await this.aggregate([
        {
            $match: {
                auction_id: new mongoose.Types.ObjectId(auctionId),
                isValid: true
            }
        },
        {
            $group: {
                _id: '$bidder_id'
            }
        },
        {
            $count: 'total'
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

/**
 * Method: Đánh dấu bid này là winning bid
 */
bidSchema.methods.markAsWinning = async function () {
    // Unmark tất cả bids khác của auction này
    await this.constructor.updateMany(
        {
            auction_id: this.auction_id,
            _id: { $ne: this._id }
        },
        { isWinning: false }
    );

    // Mark bid này là winning
    this.isWinning = true;
    await this.save();
};

const Bid = mongoose.model('Bid', bidSchema);

module.exports = Bid;
