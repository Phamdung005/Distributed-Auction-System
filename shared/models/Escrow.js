const mongoose = require('mongoose');

/**
 * Schema cho Escrow (Ký quỹ/Đặt cọc)
 * Quản lý tiền đặt cọc khi tham gia đấu giá
 */
const escrowSchema = new mongoose.Schema({
    // User đặt cọc
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID là bắt buộc'],
        index: true
    },

    // Auction liên quan
    auction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: [true, 'Auction ID là bắt buộc'],
        index: true
    },

    // Số tiền đặt cọc
    amount: {
        type: Number,
        required: [true, 'Số tiền đặt cọc là bắt buộc'],
        min: [0, 'Số tiền đặt cọc phải lớn hơn 0']
    },

    // Trạng thái escrow
    status: {
        type: String,
        enum: ['frozen', 'released', 'refunded'],
        default: 'frozen',
        index: true
    },

    // Thời gian freeze
    frozenAt: {
        type: Date,
        default: Date.now
    },

    // Thời gian release/refund
    releasedAt: {
        type: Date,
        default: null
    },

    // Transaction liên quan (khi freeze funds)
    relatedTransaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: true
    },

    // Transaction khi release/refund
    releaseTransaction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },

    // Ghi chú
    notes: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Indexes để tối ưu query
escrowSchema.index({ user_id: 1, auction_id: 1 }); // Query escrow của user cho auction
escrowSchema.index({ auction_id: 1, status: 1 }); // Query escrows của auction theo status
escrowSchema.index({ status: 1, createdAt: -1 }); // Query theo status và thời gian

/**
 * Static Method: Lấy escrow của user cho auction
 * @param {string} userId - ID của user
 * @param {string} auctionId - ID của auction
 * @returns {Promise<Escrow|null>}
 */
escrowSchema.statics.findUserAuctionEscrow = function (userId, auctionId) {
    return this.findOne({
        user_id: userId,
        auction_id: auctionId,
        status: 'frozen'
    });
};

/**
 * Static Method: Lấy tất cả escrows đang frozen của auction
 * @param {string} auctionId - ID của auction
 * @returns {Promise<Array>}
 */
escrowSchema.statics.getFrozenEscrows = function (auctionId) {
    return this.find({
        auction_id: auctionId,
        status: 'frozen'
    }).populate('user_id', 'email fullName');
};

/**
 * Static Method: Tính tổng tiền đang frozen của user
 * @param {string} userId - ID của user
 * @returns {Promise<number>}
 */
escrowSchema.statics.getTotalFrozenAmount = async function (userId) {
    const result = await this.aggregate([
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                status: 'frozen'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);

    return result.length > 0 ? result[0].total : 0;
};

/**
 * Method: Release escrow (user thắng đấu giá)
 * @param {string} releaseTransactionId - ID của transaction release
 */
escrowSchema.methods.release = async function (releaseTransactionId) {
    if (this.status !== 'frozen') {
        throw new Error('Chỉ có thể release escrow đang frozen');
    }

    this.status = 'released';
    this.releasedAt = new Date();
    this.releaseTransaction_id = releaseTransactionId;
    await this.save();
};

/**
 * Method: Refund escrow (user thua đấu giá hoặc auction cancelled)
 * @param {string} refundTransactionId - ID của transaction refund
 */
escrowSchema.methods.refund = async function (refundTransactionId) {
    if (this.status !== 'frozen') {
        throw new Error('Chỉ có thể refund escrow đang frozen');
    }

    this.status = 'refunded';
    this.releasedAt = new Date();
    this.releaseTransaction_id = refundTransactionId;
    await this.save();
};

/**
 * Virtual: Kiểm tra escrow có đang active không
 */
escrowSchema.virtual('isActive').get(function () {
    return this.status === 'frozen';
});

/**
 * Virtual: Thời gian escrow đã frozen (giây)
 */
escrowSchema.virtual('frozenDuration').get(function () {
    if (this.status === 'frozen') {
        return Math.floor((new Date() - this.frozenAt) / 1000);
    }
    if (this.releasedAt) {
        return Math.floor((this.releasedAt - this.frozenAt) / 1000);
    }
    return 0;
});

const Escrow = mongoose.model('Escrow', escrowSchema);

module.exports = Escrow;
