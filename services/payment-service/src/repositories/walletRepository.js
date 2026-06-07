const Escrow = require('../models/Escrow');
const User = require('../models/User');
const axios = require('axios');

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

// Note: User operations should ideally use Auth Service API
// For now, we'll need to add User model or use API calls

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
        let user = await User.findById(userId).select('balance fullName email');

        // If user doesn't exist in payment DB, try to fetch from auth service and create
        if (!user) {
            try {
                console.log(`User ${userId} not found in payment DB, fetching from auth service...`);
                const response = await axios.get(
                    `${AUTH_SERVICE_URL}/api/auth/profile/${userId}`,
                    { timeout: 5000 }
                );

                if (response.data && response.data.success) {
                    const authUser = response.data.data;
                    // Create user in payment DB
                    user = await User.create({
                        _id: userId,
                        email: authUser.email,
                        fullName: authUser.fullName,
                        phone: authUser.phone,
                        role: authUser.role || 'bidder',
                        isActive: true,
                        balance: 0
                    });
                    console.log(`✅ Created user ${userId} in payment DB`);
                } else {
                    throw new Error('User không tồn tại');
                }
            } catch (error) {
                console.error('Error fetching user from auth service:', error.message);
                throw new Error('User không tồn tại');
            }
        }

        return user;
    }

    /**
     * Tính tổng số tiền đang bị frozen (escrow)
     * @param {string} userId - ID của user
     * @returns {Promise<number>} - Tổng số tiền frozen
     */
    async getUserFrozenFunds(userId) {
        // user_id is now String, not ObjectId
        const result = await Escrow.aggregate([
            {
                $match: {
                    user_id: userId, // String comparison
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
        let user;

        // Trường hợp RÚT TIỀN hoặc THANH TOÁN (amount âm)
        if (amount < 0) {
            // Chuyển amount sang số dương để so sánh
            const positiveAmount = Math.abs(amount);

            // Lệnh cập nhật nguyên tử (Atomic Update) trực tiếp dưới Database
            user = await User.findOneAndUpdate(
                {
                    _id: userId,
                    balance: { $gte: positiveAmount } // CHỈ thực hiện nếu số dư hiện tại trong DB >= số tiền rút
                },
                {
                    $inc: { balance: amount } // Thực hiện trừ tiền bằng toán tử $inc nguyên tử
                },
                {
                    new: true, // Trả về tài liệu sau khi cập nhật
                    session
                }
            );

            // Nếu DB trả về null, nghĩa là không tìm thấy User hoặc số dư không đủ thỏa mãn điều kiện lọc
            if (!user) {
                throw new Error('Số dư khả dụng không đủ hoặc người dùng không tồn tại');
            }
        }
        // Trường hợp NẠP TIỀN (amount dương)
        else {
            user = await User.findOneAndUpdate(
                { _id: userId },
                { $inc: { balance: amount } }, // Cộng tiền nguyên tử
                { new: true, session }
            );

            if (!user) {
                throw new Error('Người dùng không tồn tại');
            }
        }

        return user;
    }


    /**
     * Kiểm tra user có đủ balance không (tính cả frozen funds)
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền cần kiểm tra
     * @returns {Promise<boolean>}
     */
    async hasEnoughBalance(userId, amount) {
        const walletInfo = await this.getWalletInfo(userId);
        // Check available balance (balance - frozen funds)
        return walletInfo.availableBalance >= amount;
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
