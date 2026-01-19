const mongoose = require('mongoose');

/**
 * Schema cho Auction (Phiên đấu giá)
 */
const auctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Tiêu đề đấu giá là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },
    description: {
        type: String,
        required: [true, 'Mô tả là bắt buộc'],
        maxlength: [2000, 'Mô tả không được vượt quá 2000 ký tự']
    },
    images: [{
        type: String,
        required: true
    }],
    category: {
        type: String,
        required: [true, 'Danh mục là bắt buộc'],
        enum: ['electronics', 'fashion', 'art', 'collectibles', 'vehicles', 'real-estate', 'other']
    },
    // Thông tin giá
    startPrice: {
        type: Number,
        required: [true, 'Giá khởi điểm là bắt buộc'],
        min: [0, 'Giá khởi điểm phải lớn hơn 0']
    },
    currentPrice: {
        type: Number,
        default: function () {
            return this.startPrice;
        }
    },
    minBidIncrement: {
        type: Number,
        required: [true, 'Bước giá là bắt buộc'],
        min: [1, 'Bước giá phải lớn hơn 0'],
        default: 10000 // 10,000 VND
    },
    buyNowPrice: {
        type: Number,
        default: null,
        validate: {
            validator: function (value) {
                return !value || value > this.startPrice;
            },
            message: 'Giá mua ngay phải lớn hơn giá khởi điểm'
        }
    },
    // Thời gian
    startTime: {
        type: Date,
        required: [true, 'Thời gian bắt đầu là bắt buộc']
    },
    endTime: {
        type: Date,
        required: [true, 'Thời gian kết thúc là bắt buộc'],
        validate: {
            validator: function (value) {
                return value > this.startTime;
            },
            message: 'Thời gian kết thúc phải sau thời gian bắt đầu'
        }
    },
    // Trạng thái
    status: {
        type: String,
        enum: ['pending', 'active', 'ended', 'cancelled'],
        default: 'pending'
    },
    // Người tham gia
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Người bán là bắt buộc']
    },
    winner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Thống kê
    totalBids: {
        type: Number,
        default: 0
    },
    totalParticipants: {
        type: Number,
        default: 0
    },
    viewCount: {
        type: Number,
        default: 0
    },
    // Điều kiện tham gia
    minDeposit: {
        type: Number,
        default: 0,
        min: [0, 'Tiền đặt cọc không thể âm']
    },
    // Metadata
    metadata: {
        condition: {
            type: String,
            enum: ['new', 'like-new', 'used', 'refurbished'],
            default: 'used'
        },
        location: String,
        shippingAvailable: {
            type: Boolean,
            default: false
        }
    }
}, {
    timestamps: true
});

// Index để tối ưu query
auctionSchema.index({ status: 1, endTime: 1 });
auctionSchema.index({ seller: 1 });
auctionSchema.index({ category: 1, status: 1 });
auctionSchema.index({ startTime: 1, endTime: 1 });

/**
 * Virtual: Kiểm tra đấu giá đang diễn ra
 */
auctionSchema.virtual('isActive').get(function () {
    const now = new Date();
    return this.status === 'active' &&
        this.startTime <= now &&
        this.endTime > now;
});

/**
 * Virtual: Thời gian còn lại (giây)
 */
auctionSchema.virtual('timeRemaining').get(function () {
    if (this.status !== 'active') return 0;
    const now = new Date();
    const remaining = Math.max(0, Math.floor((this.endTime - now) / 1000));
    return remaining;
});

/**
 * Method: Cập nhật giá hiện tại
 * @param {number} newPrice - Giá mới
 * @param {string} bidderId - ID người đặt giá
 * Note: Bid history is now stored in separate Bid model
 */
auctionSchema.methods.updateCurrentPrice = async function (newPrice, bidderId) {
    this.currentPrice = newPrice;
    this.totalBids += 1;

    // Update winner to latest bidder
    this.winner = bidderId;

    await this.save();
};

/**
 * Method: Kết thúc đấu giá
 * @param {string} winnerId - ID người thắng
 */
auctionSchema.methods.endAuction = async function (winnerId = null) {
    this.status = 'ended';
    this.winner = winnerId;
    await this.save();
};

/**
 * Static Method: Tìm các đấu giá đang active
 */
auctionSchema.statics.findActiveAuctions = function () {
    const now = new Date();
    return this.find({
        status: 'active',
        startTime: { $lte: now },
        endTime: { $gt: now }
    });
};

// Middleware: Tự động cập nhật status
auctionSchema.pre('save', function (next) {
    const now = new Date();

    if (this.startTime > now && this.status === 'pending') {
        // Chưa bắt đầu
        this.status = 'pending';
    } else if (this.startTime <= now && this.endTime > now && this.status === 'pending') {
        // Đang diễn ra
        this.status = 'active';
    } else if (this.endTime <= now && this.status === 'active') {
        // Đã kết thúc
        this.status = 'ended';
    }

    next();
});

const Auction = mongoose.model('Auction', auctionSchema);

module.exports = Auction;
