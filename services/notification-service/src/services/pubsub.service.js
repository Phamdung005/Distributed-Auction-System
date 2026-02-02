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

        console.log('✅ Redis Pub/Sub subscriber initialized');
        console.log('📡 Subscribed to channels: auction:bid:placed, auction:ended, payment:deposit:refunded, payment:auction:paid, etc.');
    }

    // ... (intermediate code) ...

    /**
     * Handle auction payment successful event
     */
    async handleAuctionPaid(message) {
        try {
            const data = JSON.parse(message);
            console.log('📢 Auction paid event received:', JSON.stringify(data));

            const notification = await notificationService.handleAuctionPaymentSuccessful(data);
            console.log('✅ Notification created for payment:', notification?._id);

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
}

module.exports = new PubSubService();
