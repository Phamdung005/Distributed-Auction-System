const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const { authenticate } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticate);

router.get('/buying', orderController.getMyBuyingOrders);
router.get('/selling', orderController.getMySellingOrders);
router.get('/:id', orderController.getOrderById);
router.patch('/:id/address', orderController.updateShippingAddress);
router.post('/:id/messages', orderController.sendMessage);

module.exports = router;
