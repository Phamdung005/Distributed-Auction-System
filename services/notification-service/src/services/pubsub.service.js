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

        console.log('✅ Redis Pub/Sub subscriber initialized');
    }

    /**
     * Handle bid placed event
     */
    async handleBidPlaced(message) {
        try {
            const bidData = JSON.parse(message);
            console.log('📢 Bid placed event received:', bidData);

            // Create notifications
            const notifications = await notificationService.handleBidPlaced(bidData);

            // Send real-time notifications
            notifications.forEach(notification => {
                sendNotificationToUser(notification.userId, notification);
            });

        } catch (error) {
            console.error('Error handling bid placed:', error);
        }
    }

    /**
     * Handle auction ended event
     */
    async handleAuctionEnded(message) {
        try {
            const auctionData = JSON.parse(message);
            console.log('📢 Auction ended event received:', auctionData);

            // Create notifications
            const notifications = await notificationService.handleAuctionEnded(auctionData);

            // Send real-time notifications
            notifications.forEach(notification => {
                sendNotificationToUser(notification.userId, notification);
            });

        } catch (error) {
            console.error('Error handling auction ended:', error);
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
            const { auctionId, auctionTitle, sellerId } = JSON.parse(message);
            console.log('📢 Auction starting soon:', auctionTitle);

            if (sellerId) {
                const notification = await notificationService.createNotification({
                    userId: sellerId,
                    userRole: 'seller',
                    type: 'seller_auction_starting_soon',
                    notificationData: { auctionId, auctionTitle }
                });

                sendNotificationToUser(sellerId, notification);
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
}

module.exports = new PubSubService();
