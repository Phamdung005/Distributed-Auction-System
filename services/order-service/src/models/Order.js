const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    auctionId: {
        type: String, // Changed to String as it might not refer to local model in microservice
        required: true,
        unique: true
    },
    sellerId: {
        type: String,
        required: true,
        index: true
    },
    buyerId: {
        type: String,
        required: true,
        index: true
    },
    finalPrice: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending_payment', 'paid', 'shipping', 'completed', 'cancelled', 'refunded'],
        default: 'pending_payment'
    },
    shippingAddress: {
        fullName: String,
        phoneNumber: String,
        address: String,
        city: String,
        note: String
    },
    messages: [{
        senderId: {
            type: String,
            required: true
        },
        content: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    paymentMethod: {
        type: String,
        enum: ['wallet', 'momo', 'cod'],
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['unpaid', 'paid', 'failed'],
        default: 'unpaid'
    },
    // Auction details snapshot (since we can't populate cross-db easily)
    auctionDetails: {
        title: String,
        image: String,
        endTime: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

orderSchema.index({ buyerId: 1, status: 1 });
orderSchema.index({ sellerId: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
