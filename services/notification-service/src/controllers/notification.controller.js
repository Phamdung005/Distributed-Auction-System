const notificationService = require('../services/notification.service');

/**
 * Notification Controller
 */
class NotificationController {

    /**
     * Get user's notifications
     * GET /api/notifications
     */
    async getNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const { page = 1, limit = 20, isRead, type, userRole } = req.query;

            const result = await notificationService.getUserNotifications(userId, {
                page: parseInt(page),
                limit: parseInt(limit),
                isRead: isRead === 'true' ? true : isRead === 'false' ? false : undefined,
                type,
                userRole
            });

            res.json(result);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Get unread count
     * GET /api/notifications/unread
     */
    async getUnreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService.getUnreadCount(userId);

            res.json({ count });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark notification as read
     * PATCH /api/notifications/:id/read
     */
    async markAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const notification = await notificationService.markAsRead(id, userId);

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.json(notification);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Mark all notifications as read
     * PATCH /api/notifications/read-all
     */
    async markAllAsRead(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService.markAllAsRead(userId);

            res.json({ message: 'All notifications marked as read', count });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete notification
     * DELETE /api/notifications/:id
     */
    async deleteNotification(req, res, next) {
        try {
            const userId = req.user.id;
            const { id } = req.params;

            const notification = await notificationService.deleteNotification(id, userId);

            if (!notification) {
                return res.status(404).json({ error: 'Notification not found' });
            }

            res.json({ message: 'Notification deleted' });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Delete all notifications
     * DELETE /api/notifications
     */
    async deleteAllNotifications(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService.deleteAllNotifications(userId);

            res.json({ message: 'All notifications deleted', count });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new NotificationController();
