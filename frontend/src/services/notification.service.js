import api from './api';

const NOTIFICATION_BASE_URL = 'http://localhost:3014/api/notifications';

export const notificationAPI = {
    // Get notifications
    getNotifications: (params) => api.get(NOTIFICATION_BASE_URL, { params }),

    // Get unread count
    getUnreadCount: () => api.get(`${NOTIFICATION_BASE_URL}/unread`),

    // Mark all as read
    markAllAsRead: () => api.patch(`${NOTIFICATION_BASE_URL}/read-all`),

    // Mark specific notification as read
    markAsRead: (id) => api.patch(`${NOTIFICATION_BASE_URL}/${id}/read`),

    // Delete notification
    deleteNotification: (id) => api.delete(`${NOTIFICATION_BASE_URL}/${id}`),

    // Delete all notifications
    deleteAllNotifications: () => api.delete(`${NOTIFICATION_BASE_URL}/all`),
};
