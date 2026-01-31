const User = require('../models/User');

/**
 * Repository Layer - Xử lý tương tác với Database
 */
class AuthRepository {

    /**
     * Tạo user mới
     * @param {Object} userData - Thông tin user
     * @returns {Promise<User>}
     */
    async createUser(userData) {
        const user = new User(userData);
        await user.save();
        return user;
    }

    /**
     * Tìm user theo email
     * @param {string} email
     * @returns {Promise<User|null>}
     */
    async findByEmail(email) {
        return await User.findOne({ email }).select('+password');
    }



    /**
     * Tìm user theo ID
     * @param {string} userId
     * @returns {Promise<User|null>}
     */
    async findById(userId) {
        return await User.findById(userId);
    }

    /**
     * Tìm user theo ID (bao gồm password)
     * @param {string} userId
     * @returns {Promise<User|null>}
     */
    async findByIdWithPassword(userId) {
        return await User.findById(userId).select('+password');
    }

    /**
     * Cập nhật user
     * @param {string} userId
     * @param {Object} updateData
     * @returns {Promise<User|null>}
     */
    async updateUser(userId, updateData) {
        return await User.findByIdAndUpdate(
            userId,
            updateData,
            { new: true, runValidators: true }
        );
    }

    /**
     * Thêm refresh token vào user
     * @param {string} userId
     * @param {string} refreshToken
     * @returns {Promise<void>}
     */
    async addRefreshToken(userId, refreshToken) {
        await User.findByIdAndUpdate(userId, {
            $push: {
                refreshTokens: {
                    token: refreshToken,
                    createdAt: new Date()
                }
            }
        });
    }

    /**
     * Xóa refresh token
     * @param {string} userId
     * @param {string} refreshToken
     * @returns {Promise<void>}
     */
    async removeRefreshToken(userId, refreshToken) {
        await User.findByIdAndUpdate(userId, {
            $pull: {
                refreshTokens: { token: refreshToken }
            }
        });
    }

    /**
     * Xóa tất cả refresh tokens của user
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async removeAllRefreshTokens(userId) {
        await User.findByIdAndUpdate(userId, {
            $set: { refreshTokens: [] }
        });
    }
}

module.exports = new AuthRepository();
