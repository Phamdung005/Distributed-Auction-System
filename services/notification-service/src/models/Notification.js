const mongoose = require('mongoose');

/**
 * Notification Schema
 */
const notificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    userRole: {
        type: String,
        enum: ['bidder', 'seller'],
        required: true
    },
    type: {
        type: String,
        enum: [
            'bid_placed',
            'outbid',
            'winning',
            'seller_new_bid',
            'seller_first_bid',
            'auction_starting_soon',
            'auction_started',
            'auction_ending_soon',
            'auction_ended',
            'won_auction',
            'lost_auction',
            'seller_auction_sold',
            'seller_auction_no_sale'
        ],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: {
        auctionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Auction'
        },
        auctionTitle: String,
        amount: Number,
        bidderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        bidderName: String,
        sellerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        totalBids: Number
    },
    isRead: {
        type: Boolean,
        default: false,
        index: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        index: { expires: 0 } // TTL index
    }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, userRole: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
