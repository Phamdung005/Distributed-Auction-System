const { createRedisClient } = require('shared/database/redis');
const Escrow = require('../models/Escrow');
const walletService = require('../services/walletService');

const subscribeToEvents = async () => {
    try {
        const subscriber = await createRedisClient(process.env.REDIS_URL);

        await subscriber.subscribe('auction:ended', async (message) => {
            console.log('Received auction:ended event in Payment Service:', message);
            try {
                const auctionData = JSON.parse(message);
                await processAuctionEndRefunds(auctionData);
            } catch (error) {
                console.error('Error processing auction:ended event:', error);
            }
        });

        console.log('✅ Payment Service subscribed to Redis channels: auction:ended');
    } catch (error) {
        console.error('❌ Redis subscription failed:', error);
    }
};

/**
 * Process refunds when auction ends
 * @param {Object} auctionData 
 */
const processAuctionEndRefunds = async (auctionData) => {
    const auctionId = auctionData._id || auctionData.id;
    const winnerId = auctionData.winner ? (typeof auctionData.winner === 'object' ? auctionData.winner.id || auctionData.winner._id : auctionData.winner) : null;

    console.log(`Processing refunds for auction ${auctionId}. Winner: ${winnerId}`);

    try {
        // 1. Get all frozen escrows for this auction
        const frozenEscrows = await Escrow.getFrozenEscrows(auctionId);

        if (frozenEscrows.length === 0) {
            console.log(`No frozen escrows found for auction ${auctionId}`);
            return;
        }

        console.log(`Found ${frozenEscrows.length} frozen escrows.`);

        // 2. Loop through and refund losers
        for (const escrow of frozenEscrows) {
            // Check if this user is the winner
            if (winnerId && escrow.user_id === winnerId) {
                console.log(`Skipping refund for winner: ${escrow.user_id}`);
                continue;
            }

            console.log(`Refunding deposit for loser/participant: ${escrow.user_id}, Amount: ${escrow.amount}`);

            try {
                await walletService.unfreezeFunds(escrow.user_id, escrow.amount, auctionId);
                console.log(`✅ Refund successful for user ${escrow.user_id}`);
            } catch (refundError) {
                console.error(`❌ Failed to refund user ${escrow.user_id}:`, refundError.message);
            }
        }

    } catch (error) {
        console.error('Error in processAuctionEndRefunds:', error);
    }
};

module.exports = subscribeToEvents;
