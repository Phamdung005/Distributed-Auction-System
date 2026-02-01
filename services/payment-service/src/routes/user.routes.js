const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

/**
 * POST /api/users/sync
 * Sync user từ Auth Service
 */
router.post('/sync', userController.syncUser.bind(userController));

module.exports = router;
