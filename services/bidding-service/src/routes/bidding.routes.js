const express = require('express');
const router = express.Router();
const biddingController = require('../controllers/bidding.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @route   GET /api/bidding/auction/:auctionId
 * @desc    Lấy thông tin auction
 * @access  Public
 */
router.get('/auction/:auctionId', biddingController.getAuction);

/**
 * @route   GET /api/bidding/auction/:auctionId/history
 * @desc    Lấy bid history
 * @access  Public
 */
router.get('/auction/:auctionId/history', biddingController.getBidHistory);

/**
 * @route   GET /api/bidding/auction/:auctionId/can-bid
 * @desc    Kiểm tra user có thể bid không
 * @access  Private
 */
router.get('/auction/:auctionId/can-bid', authenticate, biddingController.canBid);

/**
 * @route   POST /api/bidding/auction/:auctionId/end
 * @desc    Kết thúc auction
 * @access  Private (Admin)
 */
router.post('/auction/:auctionId/end', authenticate, authorize('admin'), biddingController.endAuction);

module.exports = router;
