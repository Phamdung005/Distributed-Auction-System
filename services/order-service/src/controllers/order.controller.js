const orderService = require('../services/order.service');

class OrderController {

    async getMyBuyingOrders(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await orderService.getMyBuyingOrders(userId, req.query);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getMySellingOrders(req, res, next) {
        try {
            const userId = req.user.userId;
            const result = await orderService.getMySellingOrders(userId, req.query);
            res.status(200).json({ success: true, data: result });
        } catch (error) {
            next(error);
        }
    }

    async getOrderById(req, res, next) {
        try {
            const userId = req.user.userId;
            const order = await orderService.getOrderById(req.params.id, userId);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    async updateShippingAddress(req, res, next) {
        try {
            const userId = req.user.userId;
            const order = await orderService.updateShippingAddress(req.params.id, userId, req.body);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    async sendMessage(req, res, next) {
        try {
            const userId = req.user.userId;
            const { content } = req.body;
            const order = await orderService.sendMessage(req.params.id, userId, content);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }
    async confirmShipping(req, res, next) {
        try {
            const userId = req.user.userId;
            const order = await orderService.confirmShipping(req.params.id, userId);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }

    async confirmReceipt(req, res, next) {
        try {
            const userId = req.user.userId;
            const order = await orderService.confirmReceipt(req.params.id, userId);
            res.status(200).json({ success: true, data: order });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrderController();
