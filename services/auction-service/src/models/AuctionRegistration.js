const mongoose = require('mongoose');

/**
 * Schema cho AuctionRegistration (Đăng ký tham gia đấu giá)
 * Bidder phải đăng ký và đặt cọc 10% trước khi bid
 * Updated for distributed architecture: bidder_id uses String
 */
const auctionRegistrationSchema = new mongoose.Schema({
    // Auction liên quan - Internal reference (same service)
    auction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: [true, 'Auction ID là bắt buộc'],
        index: true
    },

    // Bidder đăng ký - Changed to String for cross-service reference
    bidder_id: {
        type: String, // User ID from Auth Service
        required: [true, 'Bidder ID là bắt buộc'],
        index: true
    },

    // Trạng thái đăng ký
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'forfeited'],
        default: 'pending',
        index: true
    },

    // Thông tin đặt cọc (10% của startPrice)
    depositAmount: {
        type: Number,
        required: [true, 'Số tiền đặt cọc là bắt buộc'],
        min: [0, 'Số tiền đặt cọc phải lớn hơn 0']
    },

    depositPaid: {
        type: Boolean,
        default: false
    },

    // References đến Escrow và Transaction - Changed to String for cross-service
    depositEscrow_id: {
        type: String, // Escrow ID from Payment Service
        default: null
    },

    depositTransaction_id: {
        type: String, // Transaction ID from Payment Service
        default: null
    },

    // Timestamps cho các trạng thái
    registeredAt: {
        type: Date,
        default: Date.now
    },

    approvedAt: {
        type: Date,
        default: null
    },

    rejectedAt: {
        type: Date,
        default: null
    },

    forfeitedAt: {
        type: Date,
        default: null
    },

    // Lý do từ chối/mất cọc
    rejectionReason: {
        type: String,
        default: null
    },

    forfeitReason: {
        type: String,
        default: null
    },

    // Metadata
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Compound index để đảm bảo unique registration
auctionRegistrationSchema.index({ auction_id: 1, bidder_id: 1 }, { unique: true });

// Indexes để tối ưu query
auctionRegistrationSchema.index({ auction_id: 1, status: 1 });
auctionRegistrationSchema.index({ bidder_id: 1, status: 1 });
auctionRegistrationSchema.index({ status: 1, createdAt: -1 });

/**
 * Static Method: Kiểm tra bidder đã đăng ký chưa
 * @param {string} auctionId - ID của auction
 * @param {string} bidderId - ID của bidder
 * @returns {Promise<AuctionRegistration|null>}
 */
auctionRegistrationSchema.statics.findRegistration = function (auctionId, bidderId) {
    return this.findOne({
        auction_id: auctionId,
        bidder_id: bidderId
    });
};

/**
 * Static Method: Kiểm tra bidder có được phép bid không
 * @param {string} auctionId - ID của auction
 * @param {string} bidderId - ID của bidder
 * @returns {Promise<boolean>}
 */
auctionRegistrationSchema.statics.canBid = async function (auctionId, bidderId) {
    const registration = await this.findOne({
        auction_id: auctionId,
        bidder_id: bidderId,
        status: 'approved'
    });

    return !!registration;
};

/**
 * Static Method: Lấy tất cả registrations của auction
 * @param {string} auctionId - ID của auction
 * @param {string} status - Filter theo status (optional)
 * @returns {Promise<Array>}
 */
auctionRegistrationSchema.statics.getAuctionRegistrations = function (auctionId, status = null) {
    const query = { auction_id: auctionId };
    if (status) query.status = status;

    // Note: No populate for bidder_id since it's a String reference to Auth Service
    return this.find(query).sort({ createdAt: -1 });
};

/**
 * Static Method: Đếm số registrations của auction
 * @param {string} auctionId - ID của auction
 * @param {string} status - Filter theo status (optional)
 * @returns {Promise<number>}
 */
auctionRegistrationSchema.statics.countRegistrations = function (auctionId, status = null) {
    const query = { auction_id: auctionId };
    if (status) query.status = status;

    return this.countDocuments(query);
};

/**
 * Method: Approve registration
 */
auctionRegistrationSchema.methods.approve = async function () {
    if (this.status !== 'pending') {
        throw new Error('Chỉ có thể approve registration đang pending');
    }

    this.status = 'approved';
    this.approvedAt = new Date();
    await this.save();
};

/**
 * Method: Reject registration
 * @param {string} reason - Lý do từ chối
 */
auctionRegistrationSchema.methods.reject = async function (reason) {
    if (this.status !== 'pending') {
        throw new Error('Chỉ có thể reject registration đang pending');
    }

    this.status = 'rejected';
    this.rejectedAt = new Date();
    this.rejectionReason = reason;
    await this.save();
};

/**
 * Method: Forfeit registration (bidder thắng nhưng không lấy hàng)
 * @param {string} reason - Lý do mất cọc
 */
auctionRegistrationSchema.methods.forfeit = async function (reason) {
    if (this.status !== 'approved') {
        throw new Error('Chỉ có thể forfeit registration đã approved');
    }

    this.status = 'forfeited';
    this.forfeitedAt = new Date();
    this.forfeitReason = reason;
    await this.save();
};

/**
 * Virtual: Kiểm tra có được phép bid không
 */
auctionRegistrationSchema.virtual('isApproved').get(function () {
    return this.status === 'approved';
});

/**
 * Virtual: Kiểm tra có bị từ chối không
 */
auctionRegistrationSchema.virtual('isRejected').get(function () {
    return this.status === 'rejected';
});

/**
 * Virtual: Kiểm tra có bị mất cọc không
 */
auctionRegistrationSchema.virtual('isForfeited').get(function () {
    return this.status === 'forfeited';
});

const AuctionRegistration = mongoose.model('AuctionRegistration', auctionRegistrationSchema);

module.exports = AuctionRegistration;
