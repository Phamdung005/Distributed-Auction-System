const Order = require('../models/Order');

class OrderRepository {
    async createOrder(orderData) {
        const order = new Order(orderData);
        return await order.save();
    }

    async getOrderById(orderId) {
        return await Order.findById(orderId);
    }

    async getOrderByAuctionId(auctionId) {
        return await Order.findOne({ auctionId });
    }

    async getOrdersByBuyer(buyerId, options = {}) {
        const { limit = 20, page = 1, sort = '-createdAt', status } = options;
        const skip = (page - 1) * limit;

        const query = { buyerId };
        if (status) {
            query.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async getOrdersBySeller(sellerId, options = {}) {
        const { limit = 20, page = 1, sort = '-createdAt', status } = options;
        const skip = (page - 1) * limit;

        const query = { sellerId };
        if (status) {
            query.status = status;
        }

        const [orders, total] = await Promise.all([
            Order.find(query)
                .sort(sort)
                .skip(skip)
                .limit(limit),
            Order.countDocuments(query)
        ]);

        return {
            orders,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    async updateOrder(orderId, updateData) {
        return await Order.findByIdAndUpdate(orderId, updateData, { new: true });
    }

    async addMessage(orderId, senderId, content) {
        return await Order.findByIdAndUpdate(
            orderId,
            {
                $push: {
                    messages: {
                        senderId,
                        content,
                        timestamp: new Date()
                    }
                }
            },
            { new: true }
        );
    }
}

module.exports = new OrderRepository();
