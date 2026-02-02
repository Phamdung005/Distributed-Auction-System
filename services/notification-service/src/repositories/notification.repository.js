const Notification = require('../models/Notification');

/**
 * Repository Layer for Notification
 */
class NotificationRepository {

    /**
     * Create a new notification
     */
    async createNotification(notificationData) {
        const notification = new Notification(notificationData);
        await notification.save();
        return notification;
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId, options = {}) {
        const {
            page = 1,
            limit = 20,
            isRead,
            type,
            userRole
        } = options;

        const skip = (page - 1) * limit;
        const filter = { userId };

        if (isRead !== undefined) {
            filter.isRead = isRead;
        }

        if (type) {
            filter.type = type;
        }

        if (userRole) {
            filter.userRole = userRole;
        }

        const [notifications, total] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter)
        ]);

        return {
            notifications,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: limit
            }
        };
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId) {
        return await Notification.countDocuments({
            userId,
            isRead: false
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, userId },
            { isRead: true },
            { new: true }
        );

        return notification;
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId) {
        const result = await Notification.updateMany(
            { userId, isRead: false },
            { isRead: true }
        );

        return result.modifiedCount;
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOneAndDelete({
            _id: notificationId,
            userId
        });

        return notification;
    }

    /**
     * Delete all notifications for a user
     */
    async deleteAllNotifications(userId) {
        const result = await Notification.deleteMany({ userId });
        return result.deletedCount;
    }

    /**
     * Get notifications by type
     */
    async getNotificationsByType(userId, type, limit = 10) {
        return await Notification.find({ userId, type })
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Batch create notifications
     */
    async createManyNotifications(notificationsData) {
        return await Notification.insertMany(notificationsData);
    }
}

module.exports = new NotificationRepository();
