const User = require('../models/User');

/**
 * Repository cho User operations trong Payment Service
 */
class UserRepository {
    /**
     * Tạo hoặc cập nhật user (dùng cho sync từ Auth Service)
     * @param {Object} userData - Thông tin user
     * @returns {Promise&lt;Object&gt;}
     */
    async upsertUser(userData) {
        const { _id, email, fullName, phone, role, isActive } = userData;

        const user = await User.findOneAndUpdate(
            { _id },
            {
                _id,
                email,
                fullName,
                phone,
                role,
                isActive
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }
        );

        return user;
    }

    /**
     * Tìm user theo ID
     * @param {string} userId
     * @returns {Promise&lt;Object&gt;}
     */
    async findById(userId) {
        return await User.findById(userId);
    }

    /**
     * Tìm user theo email
     * @param {string} email
     * @returns {Promise&lt;Object&gt;}
     */
    async findByEmail(email) {
        return await User.findOne({ email });
    }
}

module.exports = new UserRepository();
