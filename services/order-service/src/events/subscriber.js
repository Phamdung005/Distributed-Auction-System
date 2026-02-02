const { createRedisClient } = require('shared/database/redis');
const orderService = require('../services/order.service');

const subscribeToEvents = async () => {
    try {
        const subscriber = await createRedisClient(process.env.REDIS_URL);

        await subscriber.subscribe('auction:ended', async (message) => {
            console.log('Received auction.ended event:', message);
            try {
                const auctionData = JSON.parse(message);
                await orderService.createOrderFromAuctionEvent(auctionData);
                console.log('Order creation processed.');
            } catch (error) {
                console.error('Error processing auction.ended event:', error);
            }
        });

        await subscriber.subscribe('payment:auction:paid', async (message) => {
            console.log('Received payment:auction:paid event:', message);
            try {
                const paymentData = JSON.parse(message);
                await orderService.markOrderAsPaid(paymentData.auctionId, paymentData);
                console.log('Order payment status updated.');
            } catch (error) {
                console.error('Error processing payment:auction:paid event:', error);
            }
        });

        console.log('Subscribed to Redis channels: auction:ended, payment:auction:paid');
    } catch (error) {
        console.error('Redis subscription failed:', error);
    }
};

module.exports = subscribeToEvents;
