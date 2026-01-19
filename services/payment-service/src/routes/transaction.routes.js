const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth.middleware');

// Transaction routes - TO BE IMPLEMENTED
router.get('/', authMiddleware, (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

router.get('/:id', authMiddleware, (req, res) => {
    res.status(501).json({ success: false, message: 'Not implemented yet' });
});

module.exports = router;
