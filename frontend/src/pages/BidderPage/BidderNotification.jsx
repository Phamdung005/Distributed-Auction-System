import React, { useState, useEffect } from 'react';
import {
    Bell,
    Trash2,
    CheckCheck,
    Info,
    Gavel,
    Trophy,
    XCircle,
    DollarSign,
    AlertCircle,
    ShoppingBag,
    PlusCircle,
    Edit
} from 'lucide-react';
import { notificationAPI } from '../../services/notification.service';
import { format } from 'date-fns';
import { toast } from 'react-toastify';

const BidderNotification = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        fetchNotifications();
        fetchUnreadCount();

        // Listen for real-time notifications
        const setupSocket = async () => {
            const { connectNotificationSocket } = await import('../../services/notificationSocket');
            const token = localStorage.getItem('accessToken');
            const socket = connectNotificationSocket(token);

            if (socket) {
                socket.on('notification:new', (newNotif) => {
                    setNotifications(prev => [newNotif, ...prev]);
                    setUnreadCount(prev => prev + 1);
                    toast.info(`Thông báo mới: ${newNotif.title}`);
                });
            }
        };

        setupSocket();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationAPI.getNotifications({ limit: 50 });
            if (response.data.success) {
                setNotifications(response.data.data.notifications || response.data.data);
            }
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            setLoading(false);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            if (response.data.success) {
                setUnreadCount(response.data.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation(); // Prevent triggering mark as read
        try {
            await notificationAPI.deleteNotification(id);
            setNotifications(prev => prev.filter(n => n._id !== id));
            toast.success('Đã xóa thông báo');
            fetchUnreadCount();
        } catch (error) {
            console.error('Failed to delete notification:', error);
            toast.error('Không thể xóa thông báo');
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('Bạn có chắc muốn xóa tất cả thông báo?')) return;

        try {
            await notificationAPI.deleteAllNotifications();
            setNotifications([]);
            setUnreadCount(0);
            toast.success('Đã xóa tất cả thông báo');
        } catch (error) {
            console.error('Failed to delete all notifications:', error);
            toast.error('Không thể xóa tất cả thông báo');
        }
    };

    const handleMarkAsRead = async (notification) => {
        if (notification.isRead) return;

        try {
            await notificationAPI.markAsRead(notification._id);
            setNotifications(prev => prev.map(n =>
                n._id === notification._id ? { ...n, isRead: true } : n
            ));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await notificationAPI.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
            toast.success('Đã đánh dấu tất cả là đã đọc');
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'won_auction':
                return <Trophy className="w-6 h-6 text-yellow-500" />;
            case 'lost_auction':
                return <XCircle className="w-6 h-6 text-red-500" />;
            case 'bid_placed':
                return <Gavel className="w-6 h-6 text-blue-500" />;
            case 'outbid':
                return <AlertCircle className="w-6 h-6 text-orange-500" />;
            case 'deposit_refunded':
            case 'seller_auction_sold':
                return <DollarSign className="w-6 h-6 text-green-500" />;
            case 'registration_approved':
                return <CheckCheck className="w-6 h-6 text-green-600" />;
            case 'auction_starting_soon':
            case 'auction_started':
            case 'seller_new_bid':
            case 'seller_first_bid':
                return <Bell className="w-6 h-6 text-purple-500" />;
            case 'payment_required':
            case 'seller_auction_no_sale':
                return <ShoppingBag className="w-6 h-6 text-red-500" />;
            case 'seller_auction_created':
                return <PlusCircle className="w-6 h-6 text-green-500" />;
            case 'seller_auction_updated':
                return <Edit className="w-6 h-6 text-blue-500" />;
            case 'seller_auction_deleted':
                return <Trash2 className="w-6 h-6 text-red-500" />;
            default:
                return <Info className="w-6 h-6 text-gray-500" />;
        }
    };

    return (
        <div className="w-full px-4 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Bell className="w-8 h-8" />
                    Thông báo
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            {unreadCount}
                        </span>
                    )}
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={handleMarkAllAsRead}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        disabled={notifications.length === 0 || unreadCount === 0}
                    >
                        <CheckCheck className="w-4 h-4" />
                        Đánh dấu đã đọc
                    </button>
                    <button
                        onClick={handleDeleteAll}
                        className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        disabled={notifications.length === 0}
                    >
                        <Trash2 className="w-4 h-4" />
                        Xóa tất cả
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-xl">
                    <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Bạn chưa có thông báo nào</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {notifications.map((notification) => (
                        <div
                            key={notification._id}
                            onClick={() => handleMarkAsRead(notification)}
                            className={`
                                relative flex gap-4 p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md
                                ${notification.isRead
                                    ? 'bg-white border-gray-200'
                                    : 'bg-blue-50 border-blue-200 shadow-sm'
                                }
                            `}
                        >
                            <div className="flex-shrink-0 mt-1">
                                {getIcon(notification.type)}
                            </div>

                            <div className="flex-grow">
                                <h3 className={`font-semibold mb-1 ${notification.isRead ? 'text-gray-800' : 'text-blue-800'}`}>
                                    {notification.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-2">
                                    {notification.message}
                                </p>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(notification.createdAt), 'HH:mm dd/MM/yyyy')}
                                </span>
                            </div>

                            <button
                                onClick={(e) => handleDelete(notification._id, e)}
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                title="Xóa thông báo"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BidderNotification;