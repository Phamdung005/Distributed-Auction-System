const { createRedisClient } = require('shared/database/redis');
const orderService = require('../services/order.service');

const subscribeToEvents = async () => {
    try {
        const subscriber = await createRedisClient(process.env.REDIS_URL);

        await subscriber.subscribe('auction.ended', async (message) => {
            console.log('Received auction.ended event:', message);
            try {
                const auctionData = JSON.parse(message);
                await orderService.createOrderFromAuctionEvent(auctionData);
                console.log('Order creation processed.');
            } catch (error) {
                console.error('Error processing auction.ended event:', error);
            }
        });

        console.log('Subscribed to Redis channels: auction.ended');
    } catch (error) {
        console.error('Redis subscription failed:', error);
    }
};

module.exports = subscribeToEvents;
