const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

console.log('--- Registering Order Routes ---');
router.post('/:id/ship', (req, res, next) => {
    console.log(`[OrderRoutes] POST /${req.params.id}/ship hit`);
    orderController.confirmShipping(req, res, next);
});
router.post('/:id/receive', (req, res, next) => {
    console.log(`[OrderRoutes] POST /${req.params.id}/receive hit`);
    orderController.confirmReceipt(req, res, next);
});
router.get('/buying', orderController.getMyBuyingOrders);
router.get('/selling', orderController.getMySellingOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/address', orderController.updateShippingAddress);
router.post('/:id/messages', orderController.sendMessage);

module.exports = router;
