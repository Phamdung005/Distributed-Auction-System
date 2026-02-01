const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const walletController = require('../controllers/walletController');

/**
 * @route   GET /api/wallet/balance
 * @desc    Get wallet balance and frozen funds
 * @access  Private
 */
router.get('/balance', authMiddleware, walletController.getBalance);

/**
 * @route   POST /api/wallet/deposit
 * @desc    Deposit funds to wallet
 * @access  Private
 */
router.post('/deposit', authMiddleware, walletController.deposit);

/**
 * @route   POST /api/wallet/withdraw
 * @desc    Withdraw funds from wallet
 * @access  Private
 */
router.post('/withdraw', authMiddleware, walletController.withdraw);

/**
 * @route   POST /api/wallet/freeze
 * @desc    Freeze funds for auction deposit
 * @access  Private
 */
router.post('/freeze', authMiddleware, walletController.freezeFunds);

/**
 * @route   POST /api/wallet/unfreeze
 * @desc    Unfreeze funds (refund deposit)
 * @access  Private
 */
router.post('/unfreeze', authMiddleware, walletController.unfreezeFunds);

/**
 * @route   POST /api/wallet/pay-auction
 * @desc    Pay for won auction (final price - deposit)
 * @access  Private
 */
router.post('/pay-auction', authMiddleware, walletController.payAuction);

module.exports = router;
