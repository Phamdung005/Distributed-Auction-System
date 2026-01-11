const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { registerValidation, loginValidation } = require('../middlewares/validator');
const { authenticate } = require('../middlewares/auth.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Đăng ký user mới
 * @access  Public
 */
router.post('/register', registerValidation, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Đăng nhập
 * @access  Public
 */
router.post('/login', loginValidation, authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Đăng xuất
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   POST /api/auth/logout-all
 * @desc    Đăng xuất tất cả thiết bị
 * @access  Private
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @route   GET /api/auth/me
 * @desc    Lấy thông tin user hiện tại
 * @access  Private
 */
router.get('/me', authenticate, authController.getProfile);

/**
 * @route   PUT /api/auth/me
 * @desc    Cập nhật thông tin user hiện tại
 * @access  Private
 */
router.put('/me', authenticate, authController.updateProfile);

/**
 * @route   POST /api/auth/change-password
 * @desc    Đổi mật khẩu
 * @access  Private
 */
router.post('/change-password', authenticate, authController.changePassword);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify token (Internal use)
 * @access  Public (Internal)
 */
router.post('/verify', authController.verifyToken);

module.exports = router;
