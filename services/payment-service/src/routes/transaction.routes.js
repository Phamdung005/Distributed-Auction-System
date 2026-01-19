const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');
const transactionController = require('../controllers/transactionController');

/**
 * @route   GET /api/transactions/stats
 * @desc    Get transaction statistics
 * @access  Private
 */
router.get('/stats', authMiddleware, transactionController.getTransactionStats);

/**
 * @route   GET /api/transactions
 * @desc    Get transaction history with filters and pagination
 * @access  Private
 */
router.get('/', authMiddleware, transactionController.getTransactionHistory);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get transaction details
 * @access  Private
 */
router.get('/:id', authMiddleware, transactionController.getTransactionDetails);

module.exports = router;
