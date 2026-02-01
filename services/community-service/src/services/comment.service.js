const commentRepository = require('../repositories/comment.repository');
const postRepository = require('../repositories/post.repository');

/**
 * Service Layer cho Comment
 */
class CommentService {

    /**
     * Tạo comment mới
     */
    async createComment(userId, postId, commentData) {
        // Kiểm tra post có tồn tại không
        const post = await postRepository.getPostById(postId);
        if (!post) {
            throw new Error('Post không tồn tại');
        }

        // Nếu là reply, kiểm tra parent comment
        if (commentData.parentComment_id) {
            const parentComment = await commentRepository.getCommentById(commentData.parentComment_id);
            if (!parentComment) {
                throw new Error('Parent comment không tồn tại');
            }

            // Đảm bảo parent comment cùng post
            if (parentComment.post_id.toString() !== postId) {
                throw new Error('Parent comment không thuộc post này');
            }
        }

        const comment = await commentRepository.createComment({
            ...commentData,
            author_id: userId,
            post_id: postId
        });

        return comment;
    }

    /**
     * Lấy comment theo ID
     */
    async getCommentById(commentId) {
        const comment = await commentRepository.getCommentById(commentId);

        if (!comment) {
            throw new Error('Comment không tồn tại');
        }

        return comment;
    }

    /**
     * Lấy comments của post
     */
    async getPostComments(postId, page = 1, limit = 50) {
        // Kiểm tra post có tồn tại không
        const post = await postRepository.getPostById(postId);
        if (!post) {
            throw new Error('Post không tồn tại');
        }

        return await commentRepository.getPostComments(postId, page, limit);
    }

    /**
     * Lấy replies của comment
     */
    async getCommentReplies(commentId) {
        const comment = await commentRepository.getCommentById(commentId);

        if (!comment) {
            throw new Error('Comment không tồn tại');
        }

        return await commentRepository.getCommentReplies(commentId);
    }

    /**
     * Lấy comments của user
     */
    async getUserComments(userId, page = 1, limit = 50) {
        return await commentRepository.getUserComments(userId, page, limit);
    }

    /**
     * Cập nhật comment
     */
    async updateComment(commentId, userId, updateData) {
        const comment = await commentRepository.getCommentById(commentId);

        if (!comment) {
            throw new Error('Comment không tồn tại');
        }

        // Kiểm tra quyền sở hữu
        if (comment.author_id._id.toString() !== userId) {
            throw new Error('Bạn không có quyền cập nhật comment này');
        }

        // Chỉ cho phép update content
        return await commentRepository.updateComment(commentId, {
            content: updateData.content
        });
    }

    /**
     * Xóa comment
     */
    async deleteComment(commentId, userId) {
        const comment = await commentRepository.getCommentById(commentId);

        if (!comment) {
            throw new Error('Comment không tồn tại');
        }

        // Kiểm tra quyền sở hữu
        if (comment.author_id._id.toString() !== userId) {
            throw new Error('Bạn không có quyền xóa comment này');
        }

        return await commentRepository.deleteComment(commentId);
    }
}

module.exports = new CommentService();
