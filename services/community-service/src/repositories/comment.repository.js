const Comment = require('../models/Comment');

/**
 * Repository Layer cho Comment
 */
class CommentRepository {

    /**
     * Tạo comment mới
     */
    async createComment(commentData) {
        const comment = new Comment(commentData);
        return await comment.save();
    }

    /**
     * Lấy comment theo ID
     */
    async getCommentById(commentId) {
        return await Comment.findById(commentId)
            .populate('author_id', 'username fullName');
    }

    /**
     * Lấy comments của post
     */
    async getPostComments(postId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const comments = await Comment.find({
            post_id: postId,
            status: 'active',
            parentComment_id: null // Top-level comments only
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author_id', 'username fullName');

        const total = await Comment.countDocuments({
            post_id: postId,
            status: 'active',
            parentComment_id: null
        });

        return {
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Lấy replies của comment
     */
    async getCommentReplies(commentId) {
        return await Comment.find({
            parentComment_id: commentId,
            status: 'active'
        })
            .sort({ createdAt: 1 })
            .populate('author_id', 'username fullName');
    }

    /**
     * Lấy comments của user
     */
    async getUserComments(userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;

        const comments = await Comment.find({
            author_id: userId,
            status: { $ne: 'deleted' }
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('post_id', 'title');

        const total = await Comment.countDocuments({
            author_id: userId,
            status: { $ne: 'deleted' }
        });

        return {
            comments,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Cập nhật comment
     */
    async updateComment(commentId, updateData) {
        return await Comment.findByIdAndUpdate(
            commentId,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa comment (soft delete)
     */
    async deleteComment(commentId) {
        return await Comment.findByIdAndUpdate(
            commentId,
            { status: 'deleted' },
            { new: true }
        );
    }

    /**
     * Đếm comments của post
     */
    async countPostComments(postId) {
        return await Comment.countDocuments({
            post_id: postId,
            status: 'active'
        });
    }
}

module.exports = new CommentRepository();
