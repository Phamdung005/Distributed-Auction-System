const userRepository = require('../repositories/userRepository');

/**
 * Service cho User operations
 */
class UserService {
    /**
     * Sync user từ Auth Service
     * @param {Object} userData - Thông tin user từ Auth Service
     * @returns {Promise&lt;Object&gt;}
     */
    async syncUser(userData) {
        try {
            const user = await userRepository.upsertUser(userData);
            return user;
        } catch (error) {
            console.error('Error syncing user:', error);
            throw error;
        }
    }

    /**
     * Lấy thông tin user
     * @param {string} userId
     * @returns {Promise&lt;Object&gt;}
     */
    async getUserById(userId) {
        const user = await userRepository.findById(userId);
        if (!user) {
            throw new Error('User không tồn tại');
        }
        return user;
    }
}

module.exports = new UserService();
