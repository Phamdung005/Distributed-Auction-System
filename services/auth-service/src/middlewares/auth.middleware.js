const { verifyToken } = require('../utils/jwt');

/**
 * Middleware xác thực JWT token
 */
const authenticate = async (req, res, next) => {
    try {
        // Lấy token từ header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token không được cung cấp'
            });
        }

        const token = authHeader.substring(7); // Bỏ "Bearer "

        // Verify token
        const decoded = verifyToken(token);

        // Gắn thông tin user vào request
        req.user = {
            userId: decoded.userId,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
    }
};

/**
 * Middleware kiểm tra role
 * @param  {...string} roles - Các role được phép
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền truy cập'
            });
        }
        next();
    };
};

module.exports = { authenticate, authorize };
