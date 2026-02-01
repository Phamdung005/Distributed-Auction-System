const postRepository = require('../repositories/post.repository');

/**
 * Service Layer cho Post
 */
class PostService {

    /**
     * Tạo post mới
     */
    async createPost(userId, postData) {
        const post = await postRepository.createPost({
            ...postData,
            author_id: userId
        });

        return post;
    }

    /**
     * Lấy post theo ID và tăng view count
     */
    async getPostById(postId, incrementView = true) {
        const post = await postRepository.getPostById(postId);

        if (!post) {
            throw new Error('Post không tồn tại');
        }

        if (incrementView) {
            await postRepository.incrementViewCount(postId);
        }

        return post;
    }

    /**
     * Lấy danh sách posts
     */
    async getPosts(page = 1, limit = 20) {
        return await postRepository.getPosts({}, page, limit);
    }

    /**
     * Lấy posts của user
     */
    async getUserPosts(userId, page = 1, limit = 20) {
        return await postRepository.getUserPosts(userId, page, limit);
    }

    /**
     * Lấy posts liên quan đến auction
     */
    async getAuctionPosts(auctionId, page = 1, limit = 20) {
        return await postRepository.getAuctionPosts(auctionId, page, limit);
    }

    /**
     * Tìm kiếm posts
     */
    async searchPosts(keyword, page = 1, limit = 20) {
        if (!keyword || keyword.trim().length === 0) {
            throw new Error('Keyword không được để trống');
        }

        return await postRepository.searchPosts(keyword, page, limit);
    }

    /**
     * Cập nhật post
     */
    async updatePost(postId, userId, updateData) {
        const post = await postRepository.getPostById(postId);

        if (!post) {
            throw new Error('Post không tồn tại');
        }

        // Kiểm tra quyền sở hữu
        if (post.author_id._id.toString() !== userId) {
            throw new Error('Bạn không có quyền cập nhật post này');
        }

        // Chỉ cho phép update một số fields
        const allowedUpdates = ['title', 'content', 'tags', 'relatedAuction_id'];
        const filteredUpdates = {};

        for (const key of allowedUpdates) {
            if (updateData[key] !== undefined) {
                filteredUpdates[key] = updateData[key];
            }
        }

        return await postRepository.updatePost(postId, filteredUpdates);
    }

    /**
     * Xóa post
     */
    async deletePost(postId, userId) {
        const post = await postRepository.getPostById(postId);

        if (!post) {
            throw new Error('Post không tồn tại');
        }

        // Kiểm tra quyền sở hữu
        if (post.author_id._id.toString() !== userId) {
            throw new Error('Bạn không có quyền xóa post này');
        }

        return await postRepository.deletePost(postId);
    }
}

module.exports = new PostService();
