const orderRepository = require('../repositories/order.repository');

const axios = require('axios');
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

class OrderService {
    /**
     * Create order automatically when auction ends (Event Handler)
     * @param {Object} auctionData - Payload from Redis event
     */
    async createOrderFromAuctionEvent(auctionData) {
        const auctionId = auctionData._id || auctionData.id;

        // Check if order already exists
        const existingOrder = await orderRepository.getOrderByAuctionId(auctionId);
        if (existingOrder) {
            console.log(`Order already exists for auction ${auctionId}`);
            return existingOrder;
        }

        if (!auctionData.winner) {
            console.log(`No winner for auction ${auctionData._id}, skipping order creation`);
            return null;
        }

        // Fetch buyer details from Auth Service
        let shippingAddress = {
            fullName: '',
            phoneNumber: '',
            address: '',
            city: '',
            note: ''
        };

        try {
            console.log(`Fetching user details for winner: ${auctionData.winner}`);
            const response = await axios.get(`${AUTH_SERVICE_URL}/api/auth/profile/${auctionData.winner}`);

            if (response.data && response.data.success) {
                const user = response.data.data;
                console.log('User details fetched successfully:', user.email);

                shippingAddress = {
                    fullName: user.fullName || '',
                    phoneNumber: user.phone || '',
                    address: user.address ? `${user.address}${user.district ? ', ' + user.district : ''}` : '',
                    city: user.city || '',
                    note: ''
                };
            }
        } catch (error) {
            console.error('Failed to fetch user details for order creation:', error.message);
            // Continue order creation even if fetching user fails, shippingAddress will be empty
        }

        const orderData = {
            auctionId: auctionId,
            sellerId: auctionData.seller, // Assuming string ID
            buyerId: auctionData.winner,
            finalPrice: auctionData.currentPrice,
            status: 'pending_payment',
            shippingAddress: shippingAddress,
            messages: [],
            // Snapshot details
            auctionDetails: {
                title: auctionData.title,
                image: auctionData.images && auctionData.images.length > 0 ? auctionData.images[0] : null,
                endTime: auctionData.endTime ? new Date(auctionData.endTime) : new Date()
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

        const updatedOrder = await orderRepository.addMessage(orderId, userId, content);

        // Emit socket event for real-time chat
        try {
            const { emitNewMessage } = require('../sockets/order.socket');
            const newMessage = updatedOrder.messages[updatedOrder.messages.length - 1];
            emitNewMessage(orderId, newMessage);
        } catch (socketError) {
            console.error('Failed to emit message via socket:', socketError);
        }

        return updatedOrder;
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

    async confirmShipping(orderId, userId) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        if (order.sellerId !== userId) {
            throw new Error('Only seller can confirm shipping');
        }

        if (order.status !== 'paid') {
            throw new Error(`Cannot confirm shipping for order in ${order.status} status`);
        }

        return await orderRepository.updateOrder(orderId, { status: 'shipping' });
    }

    async confirmReceipt(orderId, userId) {
        const order = await orderRepository.getOrderById(orderId);
        if (!order) throw new Error('Order not found');

        if (order.buyerId !== userId) {
            throw new Error('Only bidder can confirm receipt');
        }

        if (order.status !== 'shipping') {
            throw new Error(`Cannot confirm receipt for order in ${order.status} status`);
        }

        return await orderRepository.updateOrder(orderId, { status: 'completed' });
    }

    async markOrderAsPaid(auctionId, paymentData) {
        const order = await orderRepository.getOrderByAuctionId(auctionId);
        if (!order) {
            console.error(`Order not found for auction ${auctionId} to mark as paid`);
            return null;
        }

        const updateData = {
            status: 'paid',
            paymentStatus: 'paid',
            paymentMethod: paymentData.paymentMethod || 'wallet'
        };

        console.log(`Marking order ${order._id} as paid`);
        return await orderRepository.updateOrder(order._id, updateData);
    }
}

module.exports = new OrderService();
