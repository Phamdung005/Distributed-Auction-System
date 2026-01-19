const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');

// Wallet routes - TO BE IMPLEMENTED
router.get('/balance', authMiddleware, (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

router.get('/transactions', authMiddleware, (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;
