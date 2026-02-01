const mongoose = require('mongoose');
const walletRepository = require('../repositories/walletRepository');
const transactionRepository = require('../repositories/transactionRepository');

/**
 * Service cho Wallet operations
 */
class WalletService {
    /**
     * Lấy thông tin wallet đầy đủ
     * @param {string} userId - ID của user
     * @returns {Promise<Object>}
     */
    async getWalletInfo(userId) {
        try {
            const walletInfo = await walletRepository.getWalletInfo(userId);
            return {
                success: true,
                data: walletInfo
            };
        } catch (error) {
            console.error('Error getting wallet info:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi lấy thông tin ví'
            };
        }
    }

    /**
     * Nạp tiền vào ví
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền nạp
     * @param {string} paymentMethod - Phương thức thanh toán (wallet, momo)
     * @param {Object} metadata - Metadata bổ sung
     * @returns {Promise<Object>}
     */
    /**
     * Nạp tiền vào ví
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền nạp
     * @param {string} paymentMethod - Phương thức thanh toán (wallet, momo)
     * @param {Object} metadata - Metadata bổ sung
     * @returns {Promise<Object>}
     */
    async deposit(userId, amount, paymentMethod = 'wallet', metadata = {}) {
        // Removed transaction for standalone MongoDB support
        try {
            // Validate amount
            if (amount <= 0) {
                throw new Error('Số tiền nạp phải lớn hơn 0');
            }

            // Get current balance
            const user = await walletRepository.getUserBalance(userId);
            const balanceBefore = user.balance;
            const balanceAfter = balanceBefore + amount;

            // Create transaction record
            const transactionData = {
                user_id: userId,
                type: 'deposit',
                amount: amount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                status: 'pending',
                paymentMethod: paymentMethod,
                description: `Nạp tiền vào ví qua ${paymentMethod === 'momo' ? 'MoMo' : 'Ví'}`,
                metadata: metadata
            };

            const transaction = await transactionRepository.createTransaction(transactionData);

            // Update user balance
            await walletRepository.updateBalance(userId, amount);

            // Mark transaction as completed
            await transactionRepository.updateTransactionStatus(
                transaction._id,
                'completed',
                { completedAt: new Date() }
            );

            return {
                success: true,
                message: 'Nạp tiền thành công',
                data: {
                    transactionId: transaction._id,
                    amount: amount,
                    newBalance: balanceAfter
                }
            };
        } catch (error) {
            console.error('Error depositing funds:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi nạp tiền'
            };
        }
    }

    /**
     * Rút tiền từ ví
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền rút
     * @param {Object} metadata - Metadata bổ sung
     * @returns {Promise<Object>}
     */
    async withdraw(userId, amount, metadata = {}) {
        // Removed transaction for standalone MongoDB support
        try {
            // Validate amount
            if (amount <= 0) {
                throw new Error('Số tiền rút phải lớn hơn 0');
            }

            // Get wallet info
            const walletInfo = await walletRepository.getWalletInfo(userId);

            // Check if user has enough available balance
            if (walletInfo.availableBalance < amount) {
                throw new Error('Số dư khả dụng không đủ');
            }

            const balanceBefore = walletInfo.balance;
            const balanceAfter = balanceBefore - amount;

            // Create transaction record
            const transactionData = {
                user_id: userId,
                type: 'withdraw',
                amount: amount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                status: 'pending',
                paymentMethod: 'wallet',
                description: 'Rút tiền từ ví',
                metadata: metadata
            };

            const transaction = await transactionRepository.createTransaction(transactionData);

            // Update user balance
            await walletRepository.updateBalance(userId, -amount);

            // Mark transaction as completed
            await transactionRepository.updateTransactionStatus(
                transaction._id,
                'completed',
                { completedAt: new Date() }
            );

            return {
                success: true,
                message: 'Rút tiền thành công',
                data: {
                    transactionId: transaction._id,
                    amount: amount,
                    newBalance: balanceAfter
                }
            };
        } catch (error) {
            console.error('Error withdrawing funds:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi rút tiền'
            };
        }
    }


    /**
     * Freeze funds (đặt cọc cho auction)
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền freeze
     * @param {string} auctionId - ID của auction
     * @returns {Promise<Object>}
     */
    async freezeFunds(userId, amount, auctionId) {
        // Removed transaction for standalone MongoDB support
        try {
            // Import Escrow model
            const Escrow = require('../models/Escrow');

            // Validate amount
            if (amount <= 0) {
                throw new Error('Số tiền đặt cọc phải lớn hơn 0');
            }

            // Check if user has enough balance
            const hasEnough = await walletRepository.hasEnoughBalance(userId, amount);
            if (!hasEnough) {
                throw new Error('Số dư không đủ để đặt cọc');
            }

            // Get current balance
            const user = await walletRepository.getUserBalance(userId);
            const balanceBefore = user.balance;
            const balanceAfter = balanceBefore; // Balance không thay đổi, chỉ freeze

            // Create transaction record
            const transactionData = {
                user_id: userId,
                type: 'bid_deposit',
                amount: amount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                status: 'completed',
                paymentMethod: 'wallet',
                relatedAuction_id: auctionId,
                description: 'Đặt cọc tham gia đấu giá',
                completedAt: new Date()
            };

            const transaction = await transactionRepository.createTransaction(transactionData);

            // Create Escrow record
            const escrowData = {
                user_id: userId,
                auction_id: auctionId,
                amount: amount,
                status: 'frozen',
                frozenAt: new Date(),
                relatedTransaction_id: transaction._id,
                notes: 'Đặt cọc tham gia đấu giá'
            };

            const escrow = await Escrow.create(escrowData);

            return {
                success: true,
                message: 'Đặt cọc thành công',
                data: {
                    transactionId: transaction._id,
                    escrowId: escrow._id,
                    amount: amount
                }
            };
        } catch (error) {
            console.error('Error freezing funds:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi đặt cọc'
            };
        }
    }

    /**
     * Unfreeze funds (hoàn cọc)
     * @param {string} userId - ID của user
     * @param {number} amount - Số tiền unfreeze
     * @param {string} auctionId - ID của auction
     * @returns {Promise<Object>}
     */
    async unfreezeFunds(userId, amount, auctionId) {
        // Removed transaction for standalone MongoDB support
        try {
            // Import Escrow model
            const Escrow = require('../models/Escrow');

            // Find the frozen escrow
            const escrow = await Escrow.findUserAuctionEscrow(userId, auctionId);
            if (!escrow) {
                throw new Error('Không tìm thấy escrow để hoàn cọc');
            }

            // Get current balance
            const user = await walletRepository.getUserBalance(userId);
            const balanceBefore = user.balance;
            const balanceAfter = balanceBefore; // Balance không thay đổi khi unfreeze

            // Create transaction record
            const transactionData = {
                user_id: userId,
                type: 'bid_refund',
                amount: amount,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                status: 'completed',
                paymentMethod: 'wallet',
                relatedAuction_id: auctionId,
                description: 'Hoàn cọc đấu giá',
                completedAt: new Date()
            };

            const transaction = await transactionRepository.createTransaction(transactionData);

            // Update escrow status to refunded
            await escrow.refund(transaction._id);

            return {
                success: true,
                message: 'Hoàn cọc thành công',
                data: {
                    transactionId: transaction._id,
                    escrowId: escrow._id,
                    amount: amount
                }
            };
        } catch (error) {
            console.error('Error unfreezing funds:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi hoàn cọc'
            };
        }
    }

    /**
     * Thanh toán cho người thắng đấu giá
     * @param {string} userId - ID của user
     * @param {string} auctionId - ID của auction
     * @param {number} finalPrice - Giá cuối cùng của auction
     * @returns {Promise<Object>}
     */
    async payAuctionWinner(userId, auctionId, finalPrice) {
        try {
            // Import Escrow model
            const Escrow = require('../models/Escrow');

            // 1. Find deposit escrow
            const escrow = await Escrow.findUserAuctionEscrow(userId, auctionId);
            if (!escrow) {
                throw new Error('Không tìm thấy tiền cọc');
            }

            // 2. Calculate remaining payment
            const depositAmount = escrow.amount;
            const remainingPayment = finalPrice - depositAmount;

            if (remainingPayment < 0) {
                throw new Error('Giá cuối cùng không thể nhỏ hơn tiền cọc');
            }

            // 3. Check available balance for remaining payment
            const walletInfo = await walletRepository.getWalletInfo(userId);
            if (walletInfo.availableBalance < remainingPayment) {
                throw new Error(`Số dư khả dụng không đủ. Cần: ${remainingPayment.toLocaleString('vi-VN')} VND, Có: ${walletInfo.availableBalance.toLocaleString('vi-VN')} VND`);
            }

            // 4. Deduct remaining payment from balance
            const user = await walletRepository.getUserBalance(userId);
            const balanceBefore = user.balance;
            const balanceAfter = balanceBefore - remainingPayment;

            await walletRepository.updateBalance(userId, -remainingPayment);

            // 5. Create transaction for full payment
            const transactionData = {
                user_id: userId,
                type: 'auction_payment',
                amount: finalPrice,
                balanceBefore: balanceBefore,
                balanceAfter: balanceAfter,
                status: 'completed',
                paymentMethod: 'wallet',
                relatedAuction_id: auctionId,
                description: `Thanh toán đấu giá (Tổng: ${finalPrice.toLocaleString('vi-VN')}, Cọc: ${depositAmount.toLocaleString('vi-VN')}, Thanh toán thêm: ${remainingPayment.toLocaleString('vi-VN')})`,
                completedAt: new Date(),
                metadata: {
                    depositAmount: depositAmount,
                    additionalPayment: remainingPayment
                }
            };

            const transaction = await transactionRepository.createTransaction(transactionData);

            // 6. Release escrow (mark as used for payment)
            await escrow.release(transaction._id);

            return {
                success: true,
                message: 'Thanh toán thành công',
                data: {
                    finalPrice: finalPrice,
                    depositUsed: depositAmount,
                    additionalPayment: remainingPayment,
                    transactionId: transaction._id,
                    escrowId: escrow._id,
                    newBalance: balanceAfter
                }
            };
        } catch (error) {
            console.error('Error paying auction winner:', error);
            return {
                success: false,
                message: error.message || 'Lỗi khi thanh toán đấu giá'
            };
        }
    }
}

module.exports = new WalletService();
