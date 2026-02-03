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
        await this.subscriber.subscribe('payment:deposit:completed', this.handleWalletDeposit.bind(this));
        await this.subscriber.subscribe('payment:auction:paid', this.handleAuctionPaid.bind(this));
        await this.subscriber.subscribe('auction:created', this.handleAuctionLifecycleEvent.bind(this, 'seller_auction_created'));
        await this.subscriber.subscribe('auction:updated', this.handleAuctionLifecycleEvent.bind(this, 'seller_auction_updated'));
        await this.subscriber.subscribe('auction:deleted', this.handleAuctionLifecycleEvent.bind(this, 'seller_auction_deleted'));

        console.log('Redis Pub/Sub subscriber initialized');
        console.log('Subscribed to channels: auction:bid:placed, auction:ended, payment:deposit:refunded, payment:auction:paid, etc.');
    }

    // ... (intermediate code) ...

    /**
     * Handle bid placed event
     */
    async handleBidPlaced(message) {
        try {
            const data = JSON.parse(message);
            const notifications = await notificationService.handleBidPlaced(data);

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
            const notifications = await notificationService.handleAuctionEnded(data);

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
            const data = JSON.parse(message);
            // Implement notification logic if needed
            console.log('Auction started:', data.auctionId);
        } catch (error) {
            console.error('Error handling auction started event:', error);
        }
    }

    /**
     * Handle auction starting soon event
     */
    async handleAuctionStartingSoon(message) {
        try {
            const data = JSON.parse(message);
            // Implement notification logic if needed
            console.log('Auction starting soon:', data.auctionId);
        } catch (error) {
            console.error('Error handling auction starting soon event:', error);
        }
    }

    /**
     * Handle auction ending soon event
     */
    async handleAuctionEndingSoon(message) {
        try {
            const data = JSON.parse(message);
            // Implement notification logic if needed
            console.log('Auction ending soon:', data.auctionId);
        } catch (error) {
            console.error('Error handling auction ending soon event:', error);
        }
    }

    /**
     * Handle registration approved event
     */
    async handleRegistrationApproved(message) {
        try {
            const data = JSON.parse(message);
            // Implement notification logic if needed
            console.log('Registration approved:', data.auctionId);
        } catch (error) {
            console.error('Error handling registration approved event:', error);
        }
    }

    /**
     * Handle deposit refunded event
     */
    async handleDepositRefunded(message) {
        try {
            const data = JSON.parse(message);
            // Implement notification logic if needed
            console.log('Deposit refunded:', data.auctionId);
        } catch (error) {
            console.error('Error handling deposit refunded event:', error);
        }
    }

    /**
     * Handle auction payment successful event
     */
    async handleAuctionPaid(message) {
        try {
            const data = JSON.parse(message);
            console.log('Auction paid event received:', JSON.stringify(data));

            const notification = await notificationService.handleAuctionPaymentSuccessful(data);
            console.log('Notification created for payment:', notification?._id);

            if (notification) {
                sendNotificationToUser(data.userId, notification);
            }

        } catch (error) {
            console.error('Error handling auction payment:', error);
        }
    }

    /**
     * Handle wallet deposit event
     */
    async handleWalletDeposit(message) {
        try {
            const data = JSON.parse(message);
            console.log('Wallet deposit event received:', JSON.stringify(data));

            const notification = await notificationService.handleWalletDeposit(data);
            console.log('Notification created for deposit:', notification?._id);

            if (notification) {
                console.log(`Broadcasting to user ${data.userId}`);
                sendNotificationToUser(data.userId, notification);
            }

        } catch (error) {
            console.error('Error handling wallet deposit:', error);
        }
    }
    /**
     * Handle auction lifecycle events (created, updated, deleted)
     */
    async handleAuctionLifecycleEvent(type, message) {
        try {
            const data = JSON.parse(message);
            console.log(` Auction lifecycle event (${type}) received. AuctionID: ${data.id || data._id}`);
            console.log(` Seller ID from data: "${data.seller.id || data.seller}"`);

            const notification = await notificationService.createNotification({
                userId: data.seller.id || data.seller, // Handle both object and string ID
                userRole: 'seller',
                type: type,
                notificationData: {
                    auctionId: data.id || data._id,
                    auctionTitle: data.title
                }
            });

            if (notification) {
                console.log(`[PubSub] Created notification ${notification._id}, now emitting to user ${data.seller.id || data.seller}`);
                sendNotificationToUser(data.seller.id || data.seller, notification);
            }
        } catch (error) {
            console.error(`[PubSub] Error handling lifecycle event (${type}):`, error);
        }
    }
}

module.exports = new PubSubService();
