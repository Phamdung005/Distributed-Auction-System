const notificationService = require('./notification.service');
const { sendNotificationToUser } = require('../sockets/notification.socket');

/**
 * Redis Pub/Sub Service
 * Subscribe to events from other services
 */
class PubSubService {

    constructor() {
        this.subscriber = null;
        this.io = null;
    }

    /**
     * Initialize Pub/Sub subscriber
     */
    async initialize(redisSubscriber, io) {
        this.subscriber = redisSubscriber;
        this.io = io;

        // Subscribe to channels
        await this.subscriber.subscribe('auction:bid:placed', this.handleBidPlaced.bind(this));
        await this.subscriber.subscribe('auction:ended', this.handleAuctionEnded.bind(this));
        await this.subscriber.subscribe('auction:started', this.handleAuctionStarted.bind(this));
        await this.subscriber.subscribe('auction:starting-soon', this.handleAuctionStartingSoon.bind(this));
        await this.subscriber.subscribe('auction:ending-soon', this.handleAuctionEndingSoon.bind(this));
        await this.subscriber.subscribe('auction:registration:approved', this.handleRegistrationApproved.bind(this));
        await this.subscriber.subscribe('payment:deposit:refunded', this.handleDepositRefunded.bind(this));

        console.log('✅ Redis Pub/Sub subscriber initialized');
        console.log('📡 Subscribed to channels: auction:bid:placed, auction:ended, auction:registration:approved, payment:deposit:refunded, etc.');
    }

    /**
     * Handle incoming messages
     */
    async handleBidPlaced(message) {
        try {
            const data = JSON.parse(message);
            console.log('📢 Received auction:bid:placed:', data.auctionTitle, 'amount:', data.amount);

            // Create notifications
            const notifications = await notificationService.handleBidPlaced(data);

            // Send real-time notifications
            if (notifications && notifications.length > 0) {
                notifications.forEach(notification => {
                    sendNotificationToUser(notification.userId, notification);
                });
            }
        } catch (error) {
            console.error('Error handling bid placed event:', error);
        }
    }

    /**
     * Handle auction ended event
     */
    async handleAuctionEnded(message) {
        try {
            const data = JSON.parse(message);
            console.log('📢 Received auction:ended:', data.title || data.auctionTitle);

            // Format data if needed (auction-service publishes full auction object)
            const auctionData = {
                auctionId: data.id || data._id,
                auctionTitle: data.title,
                winnerId: data.winner?.id || data.winner?._id || data.winner,
                finalPrice: data.currentPrice,
                allBidderIds: data.bidderIds || [], // Assuming added by auction-service or notification.service handles it
                sellerId: data.seller?.id || data.seller?._id || data.seller,
                bidderName: data.winner?.fullName || data.winnerName || 'Người mua'
            };

            const notifications = await notificationService.handleAuctionEnded(auctionData);

            // Send real-time notifications
            if (notifications && notifications.length > 0) {
                notifications.forEach(notification => {
                    sendNotificationToUser(notification.userId, notification);
                });
            }
        } catch (error) {
            console.error('Error handling auction ended event:', error);
        }
    }

    /**
     * Handle auction started event
     */
    async handleAuctionStarted(message) {
        try {
            const auctionData = JSON.parse(message);
            console.log('📢 Auction started event received:', auctionData);

            // Create notifications for watchers/bidders
            // Implementation can be added later

        } catch (error) {
            console.error('Error handling auction started:', error);
        }
    }

    /**
     * Handle auction starting soon event (from auction-service scheduler)
     */
    async handleAuctionStartingSoon(message) {
        try {
            const { auctionId, auctionTitle, sellerId, bidderIds } = JSON.parse(message);
            console.log('📢 Auction starting soon:', auctionTitle);

            // Notify seller
            if (sellerId) {
                const notification = await notificationService.createNotification({
                    userId: sellerId,
                    userRole: 'seller',
                    type: 'seller_auction_starting_soon',
                    notificationData: { auctionId, auctionTitle }
                });

                sendNotificationToUser(sellerId, notification);
            }

            // Notify registered bidders
            if (bidderIds && bidderIds.length > 0) {
                for (const bidderId of bidderIds) {
                    const notification = await notificationService.createNotification({
                        userId: bidderId,
                        userRole: 'bidder',
                        type: 'auction_starting_soon',
                        notificationData: { auctionId, auctionTitle }
                    });
                    sendNotificationToUser(bidderId, notification);
                }
            }

        } catch (error) {
            console.error('Error handling auction starting soon:', error);
        }
    }

    /**
     * Handle auction ending soon event (from auction-service scheduler)
     */
    async handleAuctionEndingSoon(message) {
        try {
            const { auctionId, auctionTitle, sellerId, bidderIds, currentPrice } = JSON.parse(message);
            console.log('📢 Auction ending soon:', auctionTitle);

            const notifications = [];

            // Notify seller
            if (sellerId) {
                notifications.push({
                    userId: sellerId,
                    userRole: 'seller',
                    type: 'seller_auction_ending_soon',
                    notificationData: { auctionId, auctionTitle, amount: currentPrice }
                });
            }

            // Notify bidders
            if (bidderIds && bidderIds.length > 0) {
                bidderIds.forEach(bidderId => {
                    notifications.push({
                        userId: bidderId,
                        userRole: 'bidder',
                        type: 'auction_ending_soon',
                        notificationData: { auctionId, auctionTitle }
                    });
                });
            }

            // Create and send all notifications
            for (const notifData of notifications) {
                const notification = await notificationService.createNotification(notifData);
                sendNotificationToUser(notifData.userId, notification);
            }

        } catch (error) {
            console.error('Error handling auction ending soon:', error);
        }
    }


    /**
     * Handle registration approved event
     */
    async handleRegistrationApproved(message) {
        try {
            const { userId, auctionId, auctionTitle, registrationId, depositAmount } = JSON.parse(message);
            console.log('📢 Registration approved event received for user:', userId);

            const notification = await notificationService.createNotification({
                userId: userId,
                userRole: 'bidder',
                type: 'registration_approved',
                notificationData: {
                    auctionId,
                    auctionTitle,
                    registrationId,
                    amount: depositAmount
                }
            });

            sendNotificationToUser(userId, notification);

        } catch (error) {
            console.error('Error handling registration approved:', error);
        }
    }

    /**
     * Handle deposit refunded event
     */
    async handleDepositRefunded(message) {
        try {
            const { userId, auctionId, amount, auctionTitle } = JSON.parse(message);
            console.log('📢 Deposit refunded event received for user:', userId);

            const notification = await notificationService.createNotification({
                userId: userId,
                userRole: 'bidder',
                type: 'deposit_refunded',
                notificationData: {
                    auctionId,
                    auctionTitle: auctionTitle || 'Phiên đấu giá',
                    amount
                }
            });

            sendNotificationToUser(userId, notification);

        } catch (error) {
            console.error('Error handling deposit refunded:', error);
        }
    }
}

module.exports = new PubSubService();
