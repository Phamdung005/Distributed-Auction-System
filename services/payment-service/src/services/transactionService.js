const transactionRepository = require('../repositories/transactionRepository');

/**
 * Service cho Transaction operations
 */
class TransactionService {
    /**
     * Lấy lịch sử giao dịch với filters và pagination
     * @param {string} userId - ID của user
     * @param {Object} filters - Filters (type, status, dateFrom, dateTo)
     * @param {Object} pagination - Pagination (page, limit)
     * @returns {Promise<Object>}
     */
    async getTransactionHistory(userId, filters = {}, pagination = {}) {
        try {
            const { page = 1, limit = 10 } = pagination;

            // Get transactions
            const transactions = await transactionRepository.getUserTransactions(
                userId,
                filters,
                pagination
            );

            // Get total count
            const total = await transactionRepository.countUserTransactions(userId, filters);

            // Calculate pagination info
            const totalPages = Math.ceil(total / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return {
                success: true,
                data: {
                    transactions: transactions,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: totalPages,
                        totalItems: total,
                        itemsPerPage: parseInt(limit),
                        hasNextPage: hasNextPage,
                        hasPrevPage: hasPrevPage
                    }
                }
            };
        } catch (error) {
            console.error('Error getting transaction history:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy lịch sử giao dịch'
            };
        }
    }

    /**
     * Lấy chi tiết transaction
     * @param {string} transactionId - ID của transaction
     * @param {string} userId - ID của user (để verify ownership)
     * @returns {Promise<Object>}
     */
    async getTransactionDetails(transactionId, userId) {
        try {
            const transaction = await transactionRepository.getTransactionById(transactionId);

            if (!transaction) {
                throw new Error('Transaction không tồn tại');
            }

            // Verify ownership
            if (transaction.user_id.toString() !== userId.toString()) {
                throw new Error('Bạn không có quyền xem transaction này');
            }

            return {
                success: true,
                data: transaction
            };
        } catch (error) {
            console.error('Error getting transaction details:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy chi tiết giao dịch'
            };
        }
    }

    /**
     * Lấy thống kê giao dịch
     * @param {string} userId - ID của user
     * @returns {Promise<Object>}
     */
    async getTransactionStats(userId) {
        try {
            let stats;
            if (userId === 'global') {
                stats = await transactionRepository.getGlobalTransactionStats();
            } else {
                stats = await transactionRepository.getTransactionStats(userId);
            }

            return {
                success: true,
                data: stats
            };
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy thống kê giao dịch'
            };
        }
    }

    /**
     * Format transaction type cho display
     * @param {string} type - Transaction type
     * @returns {string}
     */
    formatTransactionType(type) {
        const typeMap = {
            'deposit': 'Nạp tiền',
            'withdraw': 'Rút tiền',
            'bid_deposit': 'Đặt cọc đấu giá',
            'bid_refund': 'Hoàn cọc',
            'auction_payment': 'Thanh toán đấu giá',
            'seller_payout': 'Nhận tiền bán hàng',
            'platform_fee': 'Phí nền tảng'
        };

        return typeMap[type] || type;
    }

    /**
     * Format transaction status cho display
     * @param {string} status - Transaction status
     * @returns {Object}
     */
    formatTransactionStatus(status) {
        const statusMap = {
            'pending': { label: 'Đang xử lý', color: 'orange' },
            'completed': { label: 'Thành công', color: 'green' },
            'failed': { label: 'Thất bại', color: 'red' },
            'cancelled': { label: 'Đã hủy', color: 'gray' }
        };

        return statusMap[status] || { label: status, color: 'gray' };
    }
}

module.exports = new TransactionService();
