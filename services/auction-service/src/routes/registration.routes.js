const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/auctions/:id/register
 * @desc    Đăng ký tham gia đấu giá
 * @access  Private
 */
router.post('/:id/register', authenticate, registrationController.register);

/**
 * @route   GET /api/auctions/:id/registration-status
 * @desc    Kiểm tra trạng thái đăng ký
 * @access  Private
 */
router.get('/:id/registration-status', authenticate, registrationController.checkStatus);

module.exports = router;
