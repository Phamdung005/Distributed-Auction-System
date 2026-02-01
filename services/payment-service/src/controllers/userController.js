const userService = require('../services/userService');

/**
 * Controller cho User sync operations
 */
class UserController {
    /**
     * Sync user từ Auth Service
     * POST /api/users/sync
     */
    async syncUser(req, res) {
        try {
            const userData = req.body;

            if (!userData._id || !userData.email) {
                return res.status(400).json({
                    success: false,
                    message: 'Thiếu thông tin user (_id và email là bắt buộc)'
                });
            }

            const user = await userService.syncUser(userData);

            res.status(200).json({
                success: true,
                message: 'Sync user thành công',
                data: user
            });
        } catch (error) {
            console.error('Error in syncUser controller:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Lỗi khi sync user'
            });
        }
    }
}

module.exports = new UserController();
