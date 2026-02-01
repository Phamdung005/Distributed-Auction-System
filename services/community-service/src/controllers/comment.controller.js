const commentService = require('../services/comment.service');

/**
 * Controller cho Comment
 */
class CommentController {

    /**
     * Tạo comment mới
     * POST /api/posts/:postId/comments
     */
    async createComment(req, res, next) {
        try {
            const { postId } = req.params;
            const { content, parentComment_id } = req.body;
            const userId = req.user.userId;

            const comment = await commentService.createComment(userId, postId, {
                content,
                parentComment_id
            });

            res.status(201).json({
                success: true,
                message: 'Comment đã được tạo thành công',
                data: comment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy comments của post
     * GET /api/posts/:postId/comments
     */
    async getPostComments(req, res, next) {
        try {
            const { postId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await commentService.getPostComments(postId, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy replies của comment
     * GET /api/comments/:commentId/replies
     */
    async getCommentReplies(req, res, next) {
        try {
            const { commentId } = req.params;

            const replies = await commentService.getCommentReplies(commentId);

            res.status(200).json({
                success: true,
                data: replies
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy comments của user
     * GET /api/comments/user/:userId
     */
    async getUserComments(req, res, next) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;

            const result = await commentService.getUserComments(userId, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật comment
     * PUT /api/comments/:id
     */
    async updateComment(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const { content } = req.body;

            const comment = await commentService.updateComment(id, userId, { content });

            res.status(200).json({
                success: true,
                message: 'Comment đã được cập nhật',
                data: comment
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa comment
     * DELETE /api/comments/:id
     */
    async deleteComment(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            await commentService.deleteComment(id, userId);

            res.status(200).json({
                success: true,
                message: 'Comment đã được xóa'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CommentController();
