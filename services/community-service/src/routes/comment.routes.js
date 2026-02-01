const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const commentController = require('../controllers/comment.controller');
const { authMiddleware, optionalAuth } = require('../middlewares/auth.middleware');

// Validation middleware
const validateComment = [
    body('content')
        .trim()
        .notEmpty().withMessage('Nội dung comment là bắt buộc')
        .isLength({ max: 1000 }).withMessage('Comment không được vượt quá 1000 ký tự'),
    body('parentComment_id')
        .optional()
        .isMongoId().withMessage('Parent comment ID không hợp lệ')
];

const validateCommentUpdate = [
    body('content')
        .trim()
        .notEmpty().withMessage('Nội dung comment là bắt buộc')
        .isLength({ max: 1000 }).withMessage('Comment không được vượt quá 1000 ký tự')
];

// Routes for comments
// Note: Post-specific comment routes are defined here with /posts/:postId prefix
router.post('/posts/:postId/comments', authMiddleware, validateComment, commentController.createComment);
router.get('/posts/:postId/comments', optionalAuth, commentController.getPostComments);

// Comment-specific routes
router.get('/:commentId/replies', optionalAuth, commentController.getCommentReplies);
router.get('/user/:userId', optionalAuth, commentController.getUserComments);
router.put('/:id', authMiddleware, validateCommentUpdate, commentController.updateComment);
router.delete('/:id', authMiddleware, commentController.deleteComment);

module.exports = router;
