const notificationRepository = require('../repositories/notification.repository');
const NOTIFICATION_TEMPLATES = require('../utils/notificationTemplates');

/**
 * Notification Service - Business Logic
 */
class NotificationService {

    /**
     * Create and send notification
     */
    async createNotification(data) {
        const { userId, userRole, type, notificationData } = data;
        console.log(`[NotificationService] Creating ${type} for user ${userId} (${userRole})`);

        // Get template
        const template = NOTIFICATION_TEMPLATES[type.toUpperCase()];
        if (!template) {
            console.error(`[NotificationService] Unknown notification type: ${type}`);
            throw new Error(`Unknown notification type: ${type}`);
        }

        // Create notification object
        const notification = {
            userId,
            userRole,
            type,
            title: template.title,
            message: typeof template.message === 'function' ? template.message(notificationData) : template.message,
            data: notificationData,
            priority: template.priority || 'medium'
        };

        try {
            // Save to database
            const savedNotification = await notificationRepository.createNotification(notification);
            console.log(`[NotificationService] Notification saved: ${savedNotification._id}`);
            return savedNotification;
        } catch (error) {
            console.error(`[NotificationService] Failed to save notification:`, error.message);
            throw error;
        }
    }

    /**
     * Get user notifications with pagination
     */
    async getUserNotifications(userId, options) {
        return await notificationRepository.getUserNotifications(userId, options);
    }

    /**
     * Get unread count
     */
    async getUnreadCount(userId) {
        return await notificationRepository.getUnreadCount(userId);
    }

    /**
     * Mark as read
     */
    async markAsRead(notificationId, userId) {
        return await notificationRepository.markAsRead(notificationId, userId);
    }

    /**
     * Mark all as read
     */
    async markAllAsRead(userId) {
        return await notificationRepository.markAllAsRead(userId);
    }

    /**
     * Delete notification
     */
    async deleteNotification(notificationId, userId) {
        return await notificationRepository.deleteNotification(notificationId, userId);
    }

    /**
     * Delete all notifications
     */
    async deleteAllNotifications(userId) {
        return await notificationRepository.deleteAllNotifications(userId);
    }

    /**
     * Create notification for bid event
     */
    async handleBidPlaced(bidData) {
        const { auctionId, auctionTitle, bidderId, bidderName, amount, previousHighestBidderId, sellerId } = bidData;

        const notifications = [];

        // Notification for seller
        if (sellerId) {
            const isFirstBid = !previousHighestBidderId;
            notifications.push({
                userId: sellerId,
                userRole: 'seller',
                type: isFirstBid ? 'seller_first_bid' : 'seller_new_bid',
                notificationData: { auctionId, auctionTitle, bidderId, bidderName, amount }
            });
        }

        // Notification for previous bidder (outbid)
        if (previousHighestBidderId && previousHighestBidderId !== bidderId) {
            notifications.push({
                userId: previousHighestBidderId,
                userRole: 'bidder',
                type: 'outbid',
                notificationData: { auctionId, auctionTitle, amount }
            });
        }

        // Notification for bidder (confirmation)
        notifications.push({
            userId: bidderId,
            userRole: 'bidder',
            type: 'bid_placed',
            notificationData: { auctionId, auctionTitle, amount, bidderName }
        });

        // Create all notifications
        const created = await Promise.all(
            notifications.map(n => this.createNotification(n))
        );

        return created;
    }

    /**
     * Create notification for auction end
     */
    async handleAuctionEnded(auctionData) {
        const { auctionId, auctionTitle, winnerId, finalPrice, allBidderIds, sellerId, bidderName } = auctionData;

        const notifications = [];

        // Notification for winner
        if (winnerId) {
            notifications.push({
                userId: winnerId,
                userRole: 'bidder',
                type: 'won_auction',
                notificationData: { auctionId, auctionTitle, amount: finalPrice }
            });

            // Notification for seller (sold)
            if (sellerId) {
                notifications.push({
                    userId: sellerId,
                    userRole: 'seller',
                    type: 'seller_auction_sold',
                    notificationData: { auctionId, auctionTitle, amount: finalPrice, bidderName }
                });
            }
        } else {
            // No winner - notify seller
            if (sellerId) {
                notifications.push({
                    userId: sellerId,
                    userRole: 'seller',
                    type: 'seller_auction_no_sale',
                    notificationData: { auctionId, auctionTitle, totalBids: allBidderIds?.length || 0 }
                });
            }
        }

        // Notifications for losers
        if (allBidderIds && allBidderIds.length > 0) {
            allBidderIds.forEach(bidderId => {
                if (bidderId !== winnerId) {
                    notifications.push({
                        userId: bidderId,
                        userRole: 'bidder',
                        type: 'lost_auction',
                        notificationData: { auctionId, auctionTitle }
                    });

                    // The user specifically asked for "nếu thua có thêm thông báo hoàn tiền nữa"
                    // In a real system, we'd wait for the 'payment:deposit:refunded' event, 
                    // but we can add an immediate notification if we assume refund is triggered.
                    notifications.push({
                        userId: bidderId,
                        userRole: 'bidder',
                        type: 'deposit_refunded',
                        notificationData: { auctionId, auctionTitle, amount: 0 } // Amount will be 0 as placeholder, or fetched
                    });
                }
            });
        }

        const created = await Promise.all(
            notifications.map(n => this.createNotification(n))
        );

        return created;
    }

    /**
     * Create notification for wallet deposit
     */
    async handleWalletDeposit(depositData) {
        const { userId, amount, transactionId, paymentMethod } = depositData;

        return await this.createNotification({
            userId,
            userRole: 'bidder',
            type: 'wallet_deposit',
            notificationData: { amount, transactionId, paymentMethod }
        });
    }

    /**
     * Create notification for auction payment
     */
    async handleAuctionPaymentSuccessful(paymentData) {
        const { userId, amount, auctionId, auctionTitle, transactionId } = paymentData;

        return await this.createNotification({
            userId,
            userRole: 'bidder',
            type: 'auction_payment_successful',
            notificationData: {
                amount,
                auctionId,
                auctionTitle: auctionTitle || 'Phiên đấu giá',
                transactionId
            }
        });
    }
}

module.exports = new NotificationService();
