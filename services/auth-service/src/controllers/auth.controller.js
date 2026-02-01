const authService = require('../services/auth.service');

/**
 * Controller Layer - Xử lý HTTP requests
 */
class AuthController {

    /**
     * Đăng ký user mới
     * POST /api/auth/register
     */
    async register(req, res, next) {
        try {
            const result = await authService.register(req.body);

            res.status(201).json({
                success: true,
                message: 'Đăng ký thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng nhập
     * POST /api/auth/login
     */
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);

            res.status(200).json({
                success: true,
                message: 'Đăng nhập thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Refresh access token
     * POST /api/auth/refresh
     */
    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;

            if (!refreshToken) {
                return res.status(400).json({
                    success: false,
                    message: 'Refresh token là bắt buộc'
                });
            }

            const result = await authService.refreshAccessToken(refreshToken);

            res.status(200).json({
                success: true,
                message: 'Refresh token thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng xuất
     * POST /api/auth/logout
     */
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const userId = req.user.userId;

            await authService.logout(userId, refreshToken);

            res.status(200).json({
                success: true,
                message: 'Đăng xuất thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đăng xuất tất cả thiết bị
     * POST /api/auth/logout-all
     */
    async logoutAll(req, res, next) {
        try {
            const userId = req.user.userId;
            await authService.logoutAll(userId);

            res.status(200).json({
                success: true,
                message: 'Đã đăng xuất tất cả thiết bị'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy thông tin user hiện tại
     * GET /api/auth/me
     */
    async getProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const profile = await authService.getUserProfile(userId);

            res.status(200).json({
                success: true,
                data: profile
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Verify token (Dùng cho internal service calls)
     * POST /api/auth/verify
     */
    async verifyToken(req, res, next) {
        try {
            const { token } = req.body;

            if (!token) {
                return res.status(400).json({
                    success: false,
                    message: 'Token là bắt buộc'
                });
            }

            const result = await authService.verifyUserToken(token);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật thông tin profile
     * PUT /api/auth/me
     */
    async updateProfile(req, res, next) {
        try {
            const userId = req.user.userId;
            const updateData = req.body;

            const result = await authService.updateUserProfile(userId, updateData);

            res.status(200).json({
                success: true,
                message: 'Cập nhật thông tin thành công',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Đổi mật khẩu
     * POST /api/auth/change-password
     */
    async changePassword(req, res, next) {
        try {
            const userId = req.user.userId;
            const { currentPassword, newPassword } = req.body;

            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Vui lòng điền đầy đủ thông tin'
                });
            }

            await authService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({
                success: true,
                message: 'Đổi mật khẩu thành công'
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
