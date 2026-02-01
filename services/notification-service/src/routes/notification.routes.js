const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authMiddleware);

// Get notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread', notificationController.getUnreadCount);

// Mark all as read
router.patch('/read-all', notificationController.markAllAsRead);

// Mark specific notification as read
router.patch('/:id/read', notificationController.markAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
