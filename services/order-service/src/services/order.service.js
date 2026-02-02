const orderRepository = require('../repositories/order.repository');

class OrderService {
    /**
     * Create order automatically when auction ends (Event Handler)
     * @param {Object} auctionData - Payload from Redis event
     */
    async createOrderFromAuctionEvent(auctionData) {
        // Check if order already exists
        const existingOrder = await orderRepository.getOrderByAuctionId(auctionData._id);
        if (existingOrder) {
            console.log(`Order already exists for auction ${auctionData._id}`);
            return existingOrder;
        }

        if (!auctionData.winner) {
            console.log(`No winner for auction ${auctionData._id}, skipping order creation`);
            return null;
        }

        const orderData = {
            auctionId: auctionData._id,
            sellerId: auctionData.seller, // Assuming string ID
            buyerId: auctionData.winner,
            finalPrice: auctionData.currentPrice,
            status: 'pending_payment',
            messages: [],
            // Snapshot details
            auctionDetails: {
                title: auctionData.title,
                image: auctionData.images && auctionData.images.length > 0 ? auctionData.images[0] : null,
                endTime: auctionData.endTime
            }
        };

        console.log('Creating order with data:', orderData);
        return await orderRepository.createOrder(orderData);
    }

    async getOrderById(orderId, userId) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        // Check permission
        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new Error('Unauthorized access to order');
        }

        return order;
    }

    async getMyBuyingOrders(userId, options) {
        return await orderRepository.getOrdersByBuyer(userId, options);
    }

    async getMySellingOrders(userId, options) {
        return await orderRepository.getOrdersBySeller(userId, options);
    }

    async sendMessage(orderId, userId, content) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        if (order.buyerId !== userId && order.sellerId !== userId) {
            throw new Error('Unauthorized to send message in this order');
        }

        return await orderRepository.addMessage(orderId, userId, content);
    }

    async updateShippingAddress(orderId, userId, addressData) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        if (order.buyerId !== userId) {
            throw new Error('Only buyer can update shipping address');
        }

        if (order.status !== 'pending_payment' && order.status !== 'paid') {
            throw new Error('Cannot update address at this stage');
        }

        return await orderRepository.updateOrder(orderId, { shippingAddress: addressData });
    }

    async updateStatus(orderId, userId, status) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        // This logic can be expanded
        return await orderRepository.updateOrder(orderId, { status });
    }
}

module.exports = new OrderService();
