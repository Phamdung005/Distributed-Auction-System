const walletService = require('../services/walletService');

/**
 * Controller cho Wallet endpoints
 */
class WalletController {
    /**
     * GET /api/wallet/balance
     * Lấy thông tin wallet (balance + frozen funds)
     */
    async getBalance(req, res) {
        try {
            const userId = req.user.userId;

            const result = await walletService.getWalletInfo(userId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in getBalance:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi lấy thông tin ví'
            });
        }
    }

    /**
     * POST /api/wallet/deposit
     * Nạp tiền vào ví
     * Body: { amount, paymentMethod, metadata }
     */
    async deposit(req, res) {
        try {
            const userId = req.user.userId;
            const { amount, paymentMethod = 'wallet', metadata = {} } = req.body;

            // Validate input
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền nạp không hợp lệ'
                });
            }

            const result = await walletService.deposit(userId, amount, paymentMethod, metadata);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in deposit:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi nạp tiền'
            });
        }
    }

    /**
     * POST /api/wallet/withdraw
     * Rút tiền từ ví
     * Body: { amount, metadata }
     */
    async withdraw(req, res) {
        try {
            const userId = req.user.userId;
            const { amount, metadata = {} } = req.body;

            // Validate input
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền rút không hợp lệ'
                });
            }

            const result = await walletService.withdraw(userId, amount, metadata);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in withdraw:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi rút tiền'
            });
        }
    }

    /**
     * POST /api/wallet/freeze
     * Freeze funds for auction deposit
     * Body: { amount, auctionId }
     */
    async freezeFunds(req, res) {
        try {
            const userId = req.user.userId;
            const { amount, auctionId } = req.body;

            // Validate input
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền đặt cọc không hợp lệ'
                });
            }

            if (!auctionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Auction ID là bắt buộc'
                });
            }

            const result = await walletService.freezeFunds(userId, amount, auctionId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in freezeFunds:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi đặt cọc'
            });
        }
    }

    /**
     * POST /api/wallet/unfreeze
     * Unfreeze funds (refund deposit)
     * Body: { amount, auctionId }
     */
    async unfreezeFunds(req, res) {
        try {
            const userId = req.user.userId;
            const { amount, auctionId } = req.body;

            // Validate input
            if (!amount || amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Số tiền hoàn cọc không hợp lệ'
                });
            }

            if (!auctionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Auction ID là bắt buộc'
                });
            }

            const result = await walletService.unfreezeFunds(userId, amount, auctionId);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in unfreezeFunds:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi hoàn cọc'
            });
        }
    }

    /**
     * POST /api/wallet/pay-auction
     * Thanh toán cho người thắng đấu giá
     * Body: { auctionId, finalPrice }
     */
    async payAuction(req, res) {
        try {
            const userId = req.user.userId;
            const { auctionId, finalPrice, auctionTitle } = req.body;

            // Validate input
            if (!auctionId) {
                return res.status(400).json({
                    success: false,
                    message: 'Auction ID là bắt buộc'
                });
            }

            if (!finalPrice || finalPrice <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Giá cuối cùng không hợp lệ'
                });
            }

            const result = await walletService.payAuctionWinner(userId, auctionId, finalPrice, auctionTitle);

            if (!result.success) {
                return res.status(400).json(result);
            }

            return res.status(200).json(result);
        } catch (error) {
            console.error('Error in payAuction:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi thanh toán đấu giá'
            });
        }
    }
}

module.exports = new WalletController();
