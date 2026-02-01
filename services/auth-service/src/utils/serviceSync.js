const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3006';

/**
 * Sync user to Payment Service
 * @param {Object} user - User object from Auth Service
 */
async function syncUserToPaymentService(user) {
    try {
        const response = await axios.post(
            `${PAYMENT_SERVICE_URL}/api/users/sync`,
            {
                _id: user._id,
                email: user.email,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                isActive: user.isActive
            },
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            }
        );

        console.log('✅ User synced to Payment Service:', user.email);
        return response.data;
    } catch (error) {
        console.error('❌ Error syncing user to Payment Service:', error.message);
        // Don't throw error - registration should succeed even if sync fails
        // The user will be created on first wallet access
    }
}

module.exports = {
    syncUserToPaymentService
};
