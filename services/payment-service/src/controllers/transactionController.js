const transactionService = require('../services/transactionService');

/**
 * Controller cho Transaction endpoints
 */
class TransactionController {
    /**
     * GET /api/transactions
     * Lấy lịch sử giao dịch với filters và pagination
     * Query params: page, limit, type, status, dateFrom, dateTo
     */
    async getTransactionHistory(req, res) {
        try {
            const userId = req.user.userId;
            const { page = 1, limit = 10, type, status, dateFrom, dateTo } = req.query;

            // Build filters
            const filters = {};
            if (type) filters.type = type;
            if (status) filters.status = status;
            if (dateFrom) filters.dateFrom = dateFrom;
            if (dateTo) filters.dateTo = dateTo;

            // Build pagination
            const pagination = {
                page: parseInt(page),
                limit: parseInt(limit)
            };

            const result = await transactionService.getTransactionHistory(
                userId,
                filters,
                pagination
            );

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getTransactionHistory:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy lịch sử giao dịch'
            });
        }
    }

    /**
     * GET /api/transactions/:id
     * Lấy chi tiết transaction
     */
    async getTransactionDetails(req, res) {
        try {
            const userId = req.user.userId;
            const { id } = req.params;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'Transaction ID không hợp lệ'
                });
            }

            const result = await transactionService.getTransactionDetails(id, userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getTransactionDetails:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy chi tiết giao dịch'
            });
        }
    }

    /**
     * GET /api/transactions/stats
     * Lấy thống kê giao dịch
     */
    async getTransactionStats(req, res) {
        try {
            const userId = req.user.userId;

            const result = await transactionService.getTransactionStats(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getTransactionStats:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thống kê giao dịch'
            });
        }
    }
}

module.exports = new TransactionController();
