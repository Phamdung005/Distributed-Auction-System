
const mongoose = require('mongoose');

/**
 * Schema cho Transaction (Giao dịch tài chính)
 * Lưu trữ tất cả lịch sử giao dịch cho audit trail và reconciliation
 */
const transactionSchema = new mongoose.Schema({
    // User thực hiện giao dịch
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID là bắt buộc'],
        index: true
    },

    // Loại giao dịch
    type: {
        type: String,
        enum: [
            'deposit',          // Nạp tiền vào ví
            'withdraw',         // Rút tiền từ ví
            'bid_deposit',      // Đặt cọc khi bid
            'bid_refund',       // Hoàn cọc khi thua
            'auction_payment',  // Thanh toán khi thắng đấu giá
            'seller_payout',    // Seller nhận tiền
            'platform_fee'      // Phí nền tảng
        ],
        required: [true, 'Loại giao dịch là bắt buộc'],
        index: true
    },

    // Số tiền giao dịch
    amount: {
        type: Number,
        required: [true, 'Số tiền là bắt buộc'],
        min: [0, 'Số tiền phải lớn hơn 0']
    },

    // Số dư trước và sau giao dịch (để reconciliation)
    balanceBefore: {
        type: Number,
        required: true
    },

    balanceAfter: {
        type: Number,
        required: true
    },

    // Trạng thái giao dịch
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending',
        index: true
    },

    // References đến các entities liên quan
    relatedAuction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        default: null,
        index: true
    },

    relatedBid_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bid',
        default: null
    },

    // Phương thức thanh toán
    paymentMethod: {
        type: String,
        enum: ['wallet', 'momo'],
        default: 'wallet'
    },

    // MoMo transaction details
    momoTransactionId: {
        type: String,
        default: null,
        index: true
    },

    momoOrderId: {
        type: String,
        default: null,
        index: true
    },

    momoResultCode: {
        type: Number,
        default: null
    },

    // Mô tả giao dịch
    description: {
        type: String,
        default: ''
    },

    // Metadata bổ sung
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },

    // Thời gian hoàn thành/thất bại
    completedAt: {
        type: Date,
        default: null
    },

    failedAt: {
        type: Date,
        default: null
    },

    failureReason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Indexes để tối ưu query
transactionSchema.index({ user_id: 1, createdAt: -1 }); // Query transactions của user
transactionSchema.index({ type: 1, status: 1 }); // Query theo type và status
transactionSchema.index({ momoOrderId: 1 }, { sparse: true }); // Query MoMo transactions
transactionSchema.index({ createdAt: -1 }); // Query theo thời gian

/**
 * Static Method: Lấy transaction history của user
 * @param {string} userId - ID của user
 * @param {number} limit - Số lượng transactions
 * @param {number} skip - Số transactions bỏ qua
 * @returns {Promise<Array>}
 */
transactionSchema.statics.getUserTransactions = function (userId, limit = 50, skip = 0) {
    return this.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('relatedAuction_id', 'title status')
        .populate('relatedBid_id', 'bidAmount');
};

/**
 * Static Method: Tính tổng tiền theo type
 * @param {string} userId - ID của user
 * @param {string} type - Loại giao dịch
 * @param {string} status - Trạng thái (optional)
 * @returns {Promise<number>}
 */
transactionSchema.statics.getTotalByType = async function (userId, type, status = 'completed') {
    const result = await this.aggregate([
        {
            $match: {
                user_id: new mongoose.Types.ObjectId(userId),
                type: type,
                status: status
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
 * Static Method: Lấy transaction theo MoMo order ID
 * @param {string} orderId - MoMo order ID
 * @returns {Promise<Transaction|null>}
 */
transactionSchema.statics.findByMomoOrderId = function (orderId) {
    return this.findOne({ momoOrderId: orderId });
};

/**
 * Method: Đánh dấu transaction hoàn thành
 */
transactionSchema.methods.markCompleted = async function () {
    this.status = 'completed';
    this.completedAt = new Date();
    await this.save();
};

/**
 * Method: Đánh dấu transaction thất bại
 * @param {string} reason - Lý do thất bại
 */
transactionSchema.methods.markFailed = async function (reason) {
    this.status = 'failed';
    this.failedAt = new Date();
    this.failureReason = reason;
    await this.save();
};

/**
 * Method: Hủy transaction
 */
transactionSchema.methods.cancel = async function () {
    if (this.status !== 'pending') {
        throw new Error('Chỉ có thể hủy transaction đang pending');
    }
    this.status = 'cancelled';
    await this.save();
};

/**
 * Virtual: Kiểm tra transaction có thành công không
 */
transactionSchema.virtual('isSuccessful').get(function () {
    return this.status === 'completed';
});

/**
 * Virtual: Kiểm tra có phải MoMo transaction không
 */
transactionSchema.virtual('isMomoTransaction').get(function () {
    return this.paymentMethod === 'momo' && this.momoOrderId !== null;
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
