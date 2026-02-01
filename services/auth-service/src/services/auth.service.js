const authRepository = require('../repositories/auth.repository');
const { generateAccessToken, generateRefreshToken, verifyToken } = require('../utils/jwt');
const { syncUserToPaymentService } = require('../utils/serviceSync');

/**
 * Service Layer - Business Logic
 */
class AuthService {

    /**
     * Đăng ký user mới
     * @param {Object} userData - Thông tin đăng ký
     * @returns {Promise<Object>}
     */
    async register(userData) {
        const { email, password, fullName, phone, role } = userData;

        // Kiểm tra email đã tồn tại
        const existingEmail = await authRepository.findByEmail(email);
        if (existingEmail) {
            throw new Error('Email đã được sử dụng');
        }



        // Tạo user mới
        const user = await authRepository.createUser({

            email,
            password,
            fullName,
            phone,
            role
        });

        // Sync user to Payment Service (non-blocking)
        syncUserToPaymentService(user).catch(err => {
            console.error('Failed to sync user to payment service:', err);
        });

        // Tạo tokens
        const accessToken = generateAccessToken({
            userId: user._id,
            role: user.role
        });
        const refreshToken = generateRefreshToken({
            userId: user._id
        });

        // Lưu refresh token
        await authRepository.addRefreshToken(user._id, refreshToken);

        return {
            user: {
                id: user._id,

                email: user.email,
                fullName: user.fullName,
                role: user.role
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Đăng nhập
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    async login(email, password) {
        // Tìm user
        const user = await authRepository.findByEmail(email);
        if (!user) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // Kiểm tra account active
        if (!user.isActive) {
            throw new Error('Tài khoản đã bị vô hiệu hóa');
        }

        // So sánh password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            throw new Error('Email hoặc mật khẩu không đúng');
        }

        // Tạo tokens
        const accessToken = generateAccessToken({
            userId: user._id,
            role: user.role
        });
        const refreshToken = generateRefreshToken({
            userId: user._id
        });

        // Lưu refresh token
        await authRepository.addRefreshToken(user._id, refreshToken);

        return {
            user: {
                id: user._id,

                email: user.email,
                fullName: user.fullName,
                role: user.role,
                balance: user.balance
            },
            accessToken,
            refreshToken
        };
    }

    /**
     * Refresh access token
     * @param {string} refreshToken
     * @returns {Promise<Object>}
     */
    async refreshAccessToken(refreshToken) {
        try {
            // Verify refresh token
            const decoded = verifyToken(refreshToken);

            // Tìm user
            const user = await authRepository.findById(decoded.userId);
            if (!user) {
                throw new Error('User không tồn tại');
            }

            // Kiểm tra refresh token có trong database
            const tokenExists = user.refreshTokens.some(
                (t) => t.token === refreshToken
            );
            if (!tokenExists) {
                throw new Error('Refresh token không hợp lệ');
            }

            // Tạo access token mới
            const newAccessToken = generateAccessToken({
                userId: user._id,
                role: user.role
            });

            return {
                accessToken: newAccessToken
            };
        } catch (error) {
            throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
        }
    }

    /**
     * Đăng xuất
     * @param {string} userId
     * @param {string} refreshToken
     * @returns {Promise<void>}
     */
    async logout(userId, refreshToken) {
        await authRepository.removeRefreshToken(userId, refreshToken);
    }

    /**
     * Đăng xuất tất cả thiết bị
     * @param {string} userId
     * @returns {Promise<void>}
     */
    async logoutAll(userId) {
        await authRepository.removeAllRefreshTokens(userId);
    }

    /**
     * Lấy thông tin user
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    async getUserProfile(userId) {
        const user = await authRepository.findById(userId);
        if (!user) {
            throw new Error('User không tồn tại');
        }

        return {
            id: user._id,

            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            balance: user.balance,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt
        };
    }

    /**
     * Verify token (dùng cho các service khác)
     * @param {string} token
     * @returns {Promise<Object>}
     */
    async verifyUserToken(token) {
        try {
            const decoded = verifyToken(token);
            const user = await authRepository.findById(decoded.userId);

            if (!user || !user.isActive) {
                throw new Error('User không hợp lệ');
            }

            return {
                userId: user._id,
                role: user.role,
                email: user.email
            };
        } catch (error) {
            throw new Error('Token không hợp lệ');
        }
    }

    /**
     * Cập nhật thông tin profile
     * @param {string} userId
     * @param {Object} updateData
     * @returns {Promise<Object>}
     */
    async updateUserProfile(userId, updateData) {
        // Không cho phép update email, password, role qua API này
        delete updateData.email;
        delete updateData.password;
        delete updateData.role;
        delete updateData.balance;

        const user = await authRepository.updateUser(userId, updateData);
        if (!user) {
            throw new Error('User không tồn tại');
        }

        return {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            balance: user.balance,
            role: user.role,
            avatar: user.avatar,
            createdAt: user.createdAt,
            city: user.city,
            district: user.district,
            address: user.address,
            dob: user.dob
        };
    }

    /**
     * Đổi mật khẩu
     * @param {string} userId
     * @param {string} currentPassword
     * @param {string} newPassword
     * @returns {Promise<void>}
     */
    async changePassword(userId, currentPassword, newPassword) {
        const user = await authRepository.findByIdWithPassword(userId);
        if (!user) {
            throw new Error('User không tồn tại');
        }

        const isPasswordValid = await user.comparePassword(currentPassword);
        if (!isPasswordValid) {
            throw new Error('Mật khẩu hiện tại không đúng');
        }

        user.password = newPassword;
        await user.save();
    }
}

module.exports = new AuthService();
