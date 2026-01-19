const User = require('shared/models/User');
const Escrow = require('shared/models/Escrow');

/**
 * Repository cho Wallet operations
 */
class WalletRepository {
    /**
     * Lấy thông tin balance của user
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} - User object với balance
     */
    async getUserBalance(userId) {
        const user = await User.findById(userId).select('balance fullName email');
        if (!user) {
            throw new Error('User không tồn tại');
        }
        return user;
    }

    /**
     * Tính tổng số tiền đang bị frozen (escrow)
     * @param {string} userId - ID của user
     * @returns {Promise<number>} - Tổng số tiền frozen
     */
    async getUserFrozenFunds(userId) {
        const result = await Escrow.aggregate([
            {
                $match: {
                    user_id: userId,
                    status: 'frozen' // Chỉ tính escrow đang frozen
                }
            },
            {
                $group: {
                    _id: null,
                    totalFrozen: { $sum: '$amount' }
                }
            }
        ]);

        return result.length > 0 ? result[0].totalFrozen : 0;
    }

    /**
     * Update balance của user (dùng trong transaction)
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền thay đổi (có thể âm hoặc dương)
     * @param {Object} session - MongoDB session cho transaction
     * @returns {Promise<Object>} - User object sau khi update
     */
    async updateBalance(userId, amount, session = null) {
        const options = session ? { session, new: true } : { new: true };

        const user = await User.findById(userId).session(session);
        if (!user) {
            throw new Error('User không tồn tại');
        }

        const newBalance = user.balance + amount;
        if (newBalance < 0) {
            throw new Error('Số dư không đủ');
        }

        user.balance = newBalance;
        await user.save(options);

        return user;
    }

    /**
     * Kiểm tra user có đủ balance không
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền cần kiểm tra
     * @returns {Promise<boolean>}
     */
    async hasEnoughBalance(userId, amount) {
        const user = await User.findById(userId).select('balance');
        if (!user) {
            throw new Error('User không tồn tại');
        }
        return user.balance >= amount;
    }

    /**
     * Lấy thông tin wallet đầy đủ (balance + frozen funds)
     * @param {string} userId - ID của user
     * @returns {Promise<Object>}
     */
    async getWalletInfo(userId) {
        const user = await this.getUserBalance(userId);
        const frozenFunds = await this.getUserFrozenFunds(userId);

        return {
            userId: user._id,
            fullName: user.fullName,
            email: user.email,
            balance: user.balance,
            frozenFunds: frozenFunds,
            availableBalance: user.balance - frozenFunds
        };
    }
}

module.exports = new WalletRepository();
