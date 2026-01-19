const mongoose = require('mongoose');

/**
 * Schema cho Comment (Bình luận)
 * Comments trên các posts trong community
 */
const commentSchema = new mongoose.Schema({
    // Reference đến post
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
        required: [true, 'Post ID là bắt buộc'],
        index: true
    },

    // Tác giả của comment
    author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author ID là bắt buộc'],
        index: true
    },

    // Nội dung comment
    content: {
        type: String,
        required: [true, 'Nội dung comment là bắt buộc'],
        maxlength: [1000, 'Comment không được vượt quá 1000 ký tự']
    },

    // Trạng thái
    status: {
        type: String,
        enum: ['active', 'hidden', 'deleted'],
        default: 'active'
    },

    // Parent comment (để support nested comments/replies)
    parentComment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },

    // Số lượng replies (nếu có nested comments)
    replyCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Indexes để tối ưu query
commentSchema.index({ post_id: 1, createdAt: -1 }); // Query comments của post
commentSchema.index({ author_id: 1, createdAt: -1 }); // Query comments của user
commentSchema.index({ parentComment_id: 1, createdAt: 1 }); // Query replies
commentSchema.index({ status: 1 });

/**
 * Virtual: Kiểm tra user có phải là author không
 */
commentSchema.virtual('isAuthor').get(function () {
    return function (userId) {
        return this.author_id.toString() === userId.toString();
    };
});

/**
 * Static Method: Lấy comments của một post
 * @param {string} postId - ID của post
 * @param {number} limit - Số lượng comments
 * @param {number} skip - Số comments bỏ qua (pagination)
 * @returns {Promise<Array>}
 */
commentSchema.statics.getPostComments = function (postId, limit = 50, skip = 0) {
    return this.find({
        post_id: postId,
        status: 'active',
        parentComment_id: null // Chỉ lấy top-level comments
    })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author_id', 'username fullName');
};

/**
 * Static Method: Lấy replies của một comment
 * @param {string} commentId - ID của parent comment
 * @returns {Promise<Array>}
 */
commentSchema.statics.getCommentReplies = function (commentId) {
    return this.find({
        parentComment_id: commentId,
        status: 'active'
    })
        .sort({ createdAt: 1 })
        .populate('author_id', 'username fullName');
};

/**
 * Static Method: Lấy comments của một user
 * @param {string} userId - ID của user
 * @param {number} limit - Số lượng comments
 * @returns {Promise<Array>}
 */
commentSchema.statics.getUserComments = function (userId, limit = 50) {
    return this.find({
        author_id: userId,
        status: { $ne: 'deleted' }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('post_id', 'title');
};

/**
 * Static Method: Đếm số comments của một post
 * @param {string} postId - ID của post
 * @returns {Promise<number>}
 */
commentSchema.statics.countPostComments = function (postId) {
    return this.countDocuments({
        post_id: postId,
        status: 'active'
    });
};

/**
 * Method: Tăng reply count
 */
commentSchema.methods.incrementReplyCount = async function () {
    this.replyCount += 1;
    await this.save();
};

/**
 * Method: Giảm reply count
 */
commentSchema.methods.decrementReplyCount = async function () {
    this.replyCount = Math.max(0, this.replyCount - 1);
    await this.save();
};

/**
 * Method: Soft delete comment
 */
commentSchema.methods.softDelete = async function () {
    this.status = 'deleted';
    await this.save();
};

/**
 * Middleware: Cập nhật comment count của post khi tạo comment mới
 */
commentSchema.post('save', async function (doc) {
    if (doc.status === 'active' && !doc.parentComment_id) {
        // Chỉ update post count cho top-level comments
        const Post = mongoose.model('Post');
        await Post.findByIdAndUpdate(
            doc.post_id,
            { $inc: { commentCount: 1 } }
        );
    }

    // Nếu là reply, update parent comment reply count
    if (doc.parentComment_id && doc.status === 'active') {
        await this.constructor.findByIdAndUpdate(
            doc.parentComment_id,
            { $inc: { replyCount: 1 } }
        );
    }
});

/**
 * Middleware: Cập nhật comment count khi xóa comment
 */
commentSchema.pre('findOneAndUpdate', async function () {
    const update = this.getUpdate();

    // Nếu đang soft delete
    if (update.$set && update.$set.status === 'deleted') {
        const doc = await this.model.findOne(this.getQuery());

        if (doc && doc.status === 'active') {
            // Giảm comment count của post
            if (!doc.parentComment_id) {
                const Post = mongoose.model('Post');
                await Post.findByIdAndUpdate(
                    doc.post_id,
                    { $inc: { commentCount: -1 } }
                );
            }

            // Giảm reply count của parent comment
            if (doc.parentComment_id) {
                await this.model.findByIdAndUpdate(
                    doc.parentComment_id,
                    { $inc: { replyCount: -1 } }
                );
            }
        }
    }
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
