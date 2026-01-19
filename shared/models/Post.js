const mongoose = require('mongoose');

/**
 * Schema cho Post (Bài viết cộng đồng)
 * Cho phép users tạo discussions, reviews, hoặc chia sẻ về auctions
 */
const postSchema = new mongoose.Schema({
    // Tác giả của post
    author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author ID là bắt buộc'],
        index: true
    },

    // Tiêu đề bài viết
    title: {
        type: String,
        required: [true, 'Tiêu đề là bắt buộc'],
        trim: true,
        maxlength: [200, 'Tiêu đề không được vượt quá 200 ký tự']
    },

    // Nội dung bài viết
    content: {
        type: String,
        required: [true, 'Nội dung là bắt buộc'],
        maxlength: [5000, 'Nội dung không được vượt quá 5000 ký tự']
    },

    // Reference đến auction (optional - nếu post liên quan đến auction cụ thể)
    relatedAuction_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        default: null,
        index: true
    },

    // Thống kê
    viewCount: {
        type: Number,
        default: 0
    },

    commentCount: {
        type: Number,
        default: 0
    },

    // Tags để phân loại
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],

    // Trạng thái
    status: {
        type: String,
        enum: ['active', 'hidden', 'deleted'],
        default: 'active'
    }
}, {
    timestamps: true
});

// Indexes để tối ưu query
postSchema.index({ author_id: 1, createdAt: -1 }); // Query posts của user
postSchema.index({ relatedAuction_id: 1, createdAt: -1 }); // Query posts liên quan đến auction
postSchema.index({ createdAt: -1 }); // Query posts mới nhất
postSchema.index({ tags: 1 }); // Query posts theo tags
postSchema.index({ status: 1, createdAt: -1 }); // Query active posts

/**
 * Virtual: Kiểm tra user có phải là author không
 */
postSchema.virtual('isAuthor').get(function () {
    return function (userId) {
        return this.author_id.toString() === userId.toString();
    };
});

/**
 * Static Method: Lấy posts mới nhất
 * @param {number} limit - Số lượng posts
 * @param {number} skip - Số posts bỏ qua (pagination)
 * @returns {Promise<Array>}
 */
postSchema.statics.getRecentPosts = function (limit = 20, skip = 0) {
    return this.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author_id', 'username fullName')
        .populate('relatedAuction_id', 'title status');
};

/**
 * Static Method: Lấy posts của một user
 * @param {string} userId - ID của user
 * @param {number} limit - Số lượng posts
 * @returns {Promise<Array>}
 */
postSchema.statics.getUserPosts = function (userId, limit = 20) {
    return this.find({
        author_id: userId,
        status: { $ne: 'deleted' }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('relatedAuction_id', 'title status');
};

/**
 * Static Method: Lấy posts liên quan đến auction
 * @param {string} auctionId - ID của auction
 * @param {number} limit - Số lượng posts
 * @returns {Promise<Array>}
 */
postSchema.statics.getAuctionPosts = function (auctionId, limit = 20) {
    return this.find({
        relatedAuction_id: auctionId,
        status: 'active'
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author_id', 'username fullName');
};

/**
 * Static Method: Tìm kiếm posts theo keyword
 * @param {string} keyword - Từ khóa tìm kiếm
 * @param {number} limit - Số lượng posts
 * @returns {Promise<Array>}
 */
postSchema.statics.searchPosts = function (keyword, limit = 20) {
    const regex = new RegExp(keyword, 'i');
    return this.find({
        status: 'active',
        $or: [
            { title: regex },
            { content: regex },
            { tags: regex }
        ]
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('author_id', 'username fullName');
};

/**
 * Method: Tăng view count
 */
postSchema.methods.incrementViewCount = async function () {
    this.viewCount += 1;
    await this.save();
};

/**
 * Method: Tăng comment count
 */
postSchema.methods.incrementCommentCount = async function () {
    this.commentCount += 1;
    await this.save();
};

/**
 * Method: Giảm comment count
 */
postSchema.methods.decrementCommentCount = async function () {
    this.commentCount = Math.max(0, this.commentCount - 1);
    await this.save();
};

/**
 * Method: Soft delete post
 */
postSchema.methods.softDelete = async function () {
    this.status = 'deleted';
    await this.save();
};

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
