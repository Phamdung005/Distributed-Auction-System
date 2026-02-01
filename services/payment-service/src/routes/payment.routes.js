const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');

// Payment routes - TO BE IMPLEMENTED
router.post('/deposit/momo', authMiddleware, (req, res) => {
    res.status(501).json({ success: false, message: 'MoMo integration - Not implemented yet' });
});

router.post('/momo/callback', (req, res) => {
    res.status(200).json({ success: true });
});

module.exports = router;
