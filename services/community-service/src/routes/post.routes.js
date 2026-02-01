const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const postController = require('../controllers/post.controller');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');

// Validation middleware
const validatePost = [
    body('title')
        .trim()
        .notEmpty().withMessage('Tiêu đề là bắt buộc')
        .isLength({ max: 200 }).withMessage('Tiêu đề không được vượt quá 200 ký tự'),
    body('content')
        .trim()
        .notEmpty().withMessage('Nội dung là bắt buộc')
        .isLength({ max: 5000 }).withMessage('Nội dung không được vượt quá 5000 ký tự'),
    body('relatedAuction_id')
        .optional()
        .isMongoId().withMessage('Auction ID không hợp lệ'),
    body('tags')
        .optional()
        .isArray().withMessage('Tags phải là array')
];

const validatePostUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Tiêu đề không được vượt quá 200 ký tự'),
    body('content')
        .optional()
        .trim()
        .isLength({ max: 5000 }).withMessage('Nội dung không được vượt quá 5000 ký tự'),
    body('relatedAuction_id')
        .optional()
        .isMongoId().withMessage('Auction ID không hợp lệ'),
    body('tags')
        .optional()
        .isArray().withMessage('Tags phải là array')
];

// Routes
router.post('/', authMiddleware, validatePost, postController.createPost);
router.get('/', optionalAuth, postController.getPosts);
router.get('/search', optionalAuth, postController.searchPosts);
router.get('/user/:userId', optionalAuth, postController.getUserPosts);
router.get('/auction/:auctionId', optionalAuth, postController.getAuctionPosts);
router.get('/:id', optionalAuth, postController.getPostById);
router.put('/:id', authMiddleware, validatePostUpdate, postController.updatePost);
router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;
