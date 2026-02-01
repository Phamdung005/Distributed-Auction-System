const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

/**
 * Repository cho Transaction operations
 */
class TransactionRepository {
    /**
     * Tạo transaction mới
     * @param {Object} transactionData - Dữ liệu transaction
     * @param {Object} session - MongoDB session cho transaction
     * @returns {Promise<Object>} - Transaction object
     */
    async createTransaction(transactionData, session = null) {
        const options = session ? { session } : {};
        const transaction = new Transaction(transactionData);
        await transaction.save(options);
        return transaction;
    }

    /**
     * Lấy danh sách transactions của user với filters và pagination
     * @param {string} userId - ID của user
     * @param {Object} filters - Filters (type, status, dateFrom, dateTo)
     * @param {Object} pagination - Pagination (page, limit)
     * @returns {Promise<Array>} - Danh sách transactions
     */
    async getUserTransactions(userId, filters = {}, pagination = {}) {
        const { type, status, dateFrom, dateTo } = filters;
        const { page = 1, limit = 10 } = pagination;
        const skip = (page - 1) * limit;

        // Build query
        const query = { user_id: userId };

        if (type && type !== 'all') {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }

        const transactions = await Transaction.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('relatedAuction_id', 'title status')
            .populate('relatedBid_id', 'bidAmount')
            .lean();

        return transactions;
    }

    /**
     * Đếm số lượng transactions của user
     * @param {string} userId - ID của user
     * @param {Object} filters - Filters (type, status, dateFrom, dateTo)
     * @returns {Promise<number>} - Số lượng transactions
     */
    async countUserTransactions(userId, filters = {}) {
        const { type, status, dateFrom, dateTo } = filters;

        const query = { user_id: userId };

        if (type && type !== 'all') {
            query.type = type;
        }

        if (status) {
            query.status = status;
        }

        if (dateFrom || dateTo) {
            query.createdAt = {};
            if (dateFrom) {
                query.createdAt.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                query.createdAt.$lte = new Date(dateTo);
            }
        }

        return await Transaction.countDocuments(query);
    }

    /**
     * Lấy transaction theo ID
     * @param {string} transactionId - ID của transaction
     * @returns {Promise<Object|null>} - Transaction object
     */
    async getTransactionById(transactionId) {
        return await Transaction.findById(transactionId)
            .populate('relatedAuction_id', 'title status')
            .populate('relatedBid_id', 'bidAmount')
            .lean();
    }

    /**
     * Lấy thống kê transactions của user
     * @param {string} userId - ID của user
     * @returns {Promise<Object>} - Statistics object
     */
    async getTransactionStats(userId) {
        const stats = await Transaction.aggregate([
            {
                $match: {
                    user_id: new mongoose.Types.ObjectId(userId),
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ]);

        // Format stats
        const formattedStats = {
            totalDeposit: 0,
            totalWithdraw: 0,
            totalBidDeposit: 0,
            totalBidRefund: 0,
            totalAuctionPayment: 0,
            totalSellerPayout: 0,
            totalPlatformFee: 0,
            transactionCount: 0
        };

        stats.forEach(stat => {
            formattedStats.transactionCount += stat.count;
            switch (stat._id) {
                case 'deposit':
                    formattedStats.totalDeposit = stat.total;
                    break;
                case 'withdraw':
                    formattedStats.totalWithdraw = stat.total;
                    break;
                case 'bid_deposit':
                    formattedStats.totalBidDeposit = stat.total;
                    break;
                case 'bid_refund':
                    formattedStats.totalBidRefund = stat.total;
                    break;
                case 'auction_payment':
                    formattedStats.totalAuctionPayment = stat.total;
                    break;
                case 'seller_payout':
                    formattedStats.totalSellerPayout = stat.total;
                    break;
                case 'platform_fee':
                    formattedStats.totalPlatformFee = stat.total;
                    break;
            }
        });

        return formattedStats;
    }

    /**
     * Update transaction status
     * @param {string} transactionId - ID của transaction
     * @param {string} status - Status mới
     * @param {Object} additionalData - Dữ liệu bổ sung
     * @returns {Promise<Object>} - Updated transaction
     */
    async updateTransactionStatus(transactionId, status, additionalData = {}) {
        const updateData = { status, ...additionalData };

        if (status === 'completed') {
            updateData.completedAt = new Date();
        } else if (status === 'failed') {
            updateData.failedAt = new Date();
        }

        return await Transaction.findByIdAndUpdate(
            transactionId,
            updateData,
            { new: true }
        );
    }
}

module.exports = new TransactionRepository();
