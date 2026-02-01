const postService = require('../services/post.service');

/**
 * Controller cho Post
 */
class PostController {

    /**
     * Tạo post mới
     * POST /api/posts
     */
    async createPost(req, res, next) {
        try {
            const { title, content, relatedAuction_id, tags } = req.body;
            const userId = req.user.userId;

            const post = await postService.createPost(userId, {
                title,
                content,
                relatedAuction_id,
                tags
            });

            res.status(201).json({
                success: true,
                message: 'Post đã được tạo thành công',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách posts
     * GET /api/posts
     */
    async getPosts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await postService.getPosts(page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy post theo ID
     * GET /api/posts/:id
     */
    async getPostById(req, res, next) {
        try {
            const { id } = req.params;

            const post = await postService.getPostById(id);

            res.status(200).json({
                success: true,
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy posts của user
     * GET /api/posts/user/:userId
     */
    async getUserPosts(req, res, next) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await postService.getUserPosts(userId, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy posts liên quan đến auction
     * GET /api/posts/auction/:auctionId
     */
    async getAuctionPosts(req, res, next) {
        try {
            const { auctionId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await postService.getAuctionPosts(auctionId, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Tìm kiếm posts
     * GET /api/posts/search?q=keyword
     */
    async searchPosts(req, res, next) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await postService.searchPosts(q, page, limit);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật post
     * PUT /api/posts/:id
     */
    async updatePost(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;
            const updateData = req.body;

            const post = await postService.updatePost(id, userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Post đã được cập nhật',
                data: post
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa post
     * DELETE /api/posts/:id
     */
    async deletePost(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.userId;

            await postService.deletePost(id, userId);

            res.status(200).json({
                success: true,
                message: 'Post đã được xóa'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new PostController();
