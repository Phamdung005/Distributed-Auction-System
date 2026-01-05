const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auction.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createAuctionValidation, updateAuctionValidation } = require('../middlewares/validator');

/**
 * @route   GET /api/auctions
 * @desc    Lấy danh sách auctions (với filter, search, pagination)
 * @access  Public
 */
router.get('/', auctionController.getAuctions);

/**
 * @route   GET /api/auctions/active
 * @desc    Lấy auctions đang active
 * @access  Public
 */
router.get('/active', auctionController.getActiveAuctions);

/**
 * @route   GET /api/auctions/my
 * @desc    Lấy auctions của user hiện tại
 * @access  Private
 */
router.get('/my', authenticate, authorize('seller'), auctionController.getMyAuctions);

/**
 * @route   GET /api/auctions/:id
 * @desc    Lấy auction theo ID
 * @access  Public
 */
router.get('/:id', auctionController.getAuctionById);

/**
 * @route   POST /api/auctions
 * @desc    Tạo auction mới
 * @access  Private (Seller)
 */
router.post('/', authenticate, authorize('seller'), createAuctionValidation, auctionController.createAuction);

/**
 * @route   PUT /api/auctions/:id
 * @desc    Cập nhật auction
 * @access  Private (Seller, Owner)
 */
router.put('/:id', authenticate, authorize('seller'), updateAuctionValidation, auctionController.updateAuction);

/**
 * @route   DELETE /api/auctions/:id
 * @desc    Xóa auction
 * @access  Private (Seller, Owner)
 */
router.delete('/:id', authenticate, authorize('seller'), auctionController.deleteAuction);

/**
 * @route   POST /api/auctions/:id/cancel
 * @desc    Hủy auction
 * @access  Private (Seller, Owner)
 */
router.post('/:id/cancel', authenticate, authorize('seller'), auctionController.cancelAuction);

module.exports = router;
