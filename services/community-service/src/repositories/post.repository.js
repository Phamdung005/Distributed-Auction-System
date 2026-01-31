const Post = require('../models/Post');

/**
 * Repository Layer cho Post
 */
class PostRepository {

    /**
     * Tạo post mới
     */
    async createPost(postData) {
        const post = new Post(postData);
        return await post.save();
    }

    /**
     * Lấy post theo ID
     */
    async getPostById(postId) {
        return await Post.findById(postId)
            .populate('author_id', 'username fullName')
            .populate('relatedAuction_id', 'title status');
    }

    /**
     * Lấy danh sách posts với pagination
     */
    async getPosts(filter = {}, page = 1, limit = 20) {
        const skip = (page - 1) * limit;

        const posts = await Post.find({ ...filter, status: 'active' })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author_id', 'username fullName')
            .populate('relatedAuction_id', 'title status');

        const total = await Post.countDocuments({ ...filter, status: 'active' });

        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Lấy posts của user
     */
    async getUserPosts(userId, page = 1, limit = 20) {
        return await this.getPosts({ author_id: userId }, page, limit);
    }

    /**
     * Lấy posts liên quan đến auction
     */
    async getAuctionPosts(auctionId, page = 1, limit = 20) {
        return await this.getPosts({ relatedAuction_id: auctionId }, page, limit);
    }

    /**
     * Tìm kiếm posts
     */
    async searchPosts(keyword, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const regex = new RegExp(keyword, 'i');

        const posts = await Post.find({
            status: 'active',
            $or: [
                { title: regex },
                { content: regex },
                { tags: regex }
            ]
        })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author_id', 'username fullName');

        const total = await Post.countDocuments({
            status: 'active',
            $or: [
                { title: regex },
                { content: regex },
                { tags: regex }
            ]
        });

        return {
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Cập nhật post
     */
    async updatePost(postId, updateData) {
        return await Post.findByIdAndUpdate(
            postId,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Xóa post (soft delete)
     */
    async deletePost(postId) {
        return await Post.findByIdAndUpdate(
            postId,
            { status: 'deleted' },
            { new: true }
        );
    }

    /**
     * Tăng view count
     */
    async incrementViewCount(postId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $inc: { viewCount: 1 } },
            { new: true }
        );
    }
}

module.exports = new PostRepository();
