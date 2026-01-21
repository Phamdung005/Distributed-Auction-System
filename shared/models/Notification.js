const mongoose = require('mongoose');

/**
 * Schema cho Notification (Thông báo)
 * Lưu trữ tất cả thông báo cho bidders và sellers
 */
const notificationSchema = new mongoose.Schema({
    // User nhận thông báo
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID là bắt buộc'],
        index: true
    },

    // Vai trò của user (để filter notifications)
    userRole: {
        type: String,
        enum: ['bidder', 'seller'],
        required: [true, 'User role là bắt buộc']
    },

    // Loại thông báo
    type: {
        type: String,
        enum: [
            'bid_placed',              // Bidder: Bạn đã đặt giá thành công
            'outbid',                  // Bidder: Bạn bị vượt mặt
            'winning',                 // Bidder: Bạn đang dẫn đầu
            'seller_new_bid',          // Seller: Có người đặt giá mới
            'seller_first_bid',        // Seller: Có bid đầu tiên
            'auction_starting_soon',   // Cả hai: Đấu giá sắp bắt đầu (15 phút)
            'auction_started',         // Cả hai: Đấu giá đã bắt đầu
            'auction_ending_soon',     // Cả hai: Đấu giá sắp kết thúc (5 phút)
            'auction_ended',           // Cả hai: Đấu giá đã kết thúc
            'won_auction',             // Bidder: Bạn đã thắng
            'lost_auction',            // Bidder: Bạn đã thua
            'seller_auction_sold',     // Seller: Đấu giá thành công
            'seller_auction_no_sale',  // Seller: Đấu giá không có người mua
            'registration_approved',   // Bidder: Đăng ký tham gia được duyệt
            'registration_rejected',   // Bidder: Đăng ký tham gia bị từ chối
            'payment_required',        // Winner: Cần thanh toán
            'payment_received',        // Seller: Đã nhận thanh toán
            'deposit_refunded'         // Bidder: Tiền cọc đã được hoàn
        ],
        required: [true, 'Loại thông báo là bắt buộc']
    },

    // Tiêu đề thông báo
    title: {
        type: String,
        required: [true, 'Tiêu đề là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },

    // Nội dung chi tiết
    message: {
        type: String,
        required: [true, 'Nội dung là bắt buộc'],
        trim: true,
        maxlength: [1000, 'Nội dung không được vượt quá 1000 ký tự']
    },

    // Dữ liệu bổ sung (metadata)
    data: {
        auctionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auction'
        },
        auctionTitle: String,
        amount: Number,
        bidderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bidderName: String,
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        totalBids: Number,
        // Thêm các fields khác nếu cần
        registrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AuctionRegistration'
        },
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Transaction'
        }
    },

    // Trạng thái đã đọc
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },

    // Độ ưu tiên
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },

    // Thời gian hết hạn (TTL - tự động xóa sau 30 ngày)
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        index: { expires: 0 } // TTL index
    }
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

// Compound indexes để tối ưu query
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, userRole: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1, createdAt: -1 });

/**
 * Static Method: Đếm số notifications chưa đọc
 * @param {string} userId - ID của user
 * @returns {Promise<number>}
 */
notificationSchema.statics.getUnreadCount = function (userId) {
    return this.countDocuments({
        userId: userId,
        isRead: false
    });
};

/**
 * Static Method: Lấy danh sách notifications của user
 * @param {string} userId - ID của user
 * @param {Object} options - Options cho query
 * @param {number} options.limit - Số lượng notifications cần lấy
 * @param {number} options.skip - Số lượng notifications cần bỏ qua
 * @param {boolean} options.unreadOnly - Chỉ lấy notifications chưa đọc
 * @param {string} options.type - Filter theo loại notification
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getUserNotifications = function (userId, options = {}) {
    const {
        limit = 20,
        skip = 0,
        unreadOnly = false,
        type = null
    } = options;

    const query = { userId: userId };

    if (unreadOnly) {
        query.isRead = false;
    }

    if (type) {
        query.type = type;
    }

    return this.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip)
        .populate('data.auctionId', 'title status')
        .populate('data.bidderId', 'fullName')
        .populate('data.sellerId', 'fullName');
};

/**
 * Static Method: Đánh dấu một notification là đã đọc
 * @param {string} notificationId - ID của notification
 * @returns {Promise<Notification>}
 */
notificationSchema.statics.markAsRead = function (notificationId) {
    return this.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
    );
};

/**
 * Static Method: Đánh dấu tất cả notifications của user là đã đọc
 * @param {string} userId - ID của user
 * @returns {Promise<Object>}
 */
notificationSchema.statics.markAllAsRead = function (userId) {
    return this.updateMany(
        { userId: userId, isRead: false },
        { isRead: true }
    );
};

/**
 * Static Method: Xóa notifications đã hết hạn (manual cleanup nếu cần)
 * @returns {Promise<Object>}
 */
notificationSchema.statics.deleteExpired = function () {
    return this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
};

/**
 * Static Method: Lấy notifications theo auction
 * @param {string} auctionId - ID của auction
 * @param {number} limit - Số lượng notifications cần lấy
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getAuctionNotifications = function (auctionId, limit = 50) {
    return this.find({
        'data.auctionId': auctionId
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'fullName email');
};

/**
 * Method: Kiểm tra notification có thuộc về user không
 * @param {string} userId - ID của user
 * @returns {boolean}
 */
notificationSchema.methods.belongsToUser = function (userId) {
    return this.userId.toString() === userId.toString();
};

/**
 * Virtual: Kiểm tra notification đã hết hạn chưa
 */
notificationSchema.virtual('isExpired').get(function () {
    return this.expiresAt < new Date();
});

/**
 * Virtual: Thời gian còn lại trước khi hết hạn (giây)
 */
notificationSchema.virtual('timeUntilExpiry').get(function () {
    const now = new Date();
    const remaining = Math.max(0, Math.floor((this.expiresAt - now) / 1000));
    return remaining;
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
