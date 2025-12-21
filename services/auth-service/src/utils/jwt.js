const jwt = require('jsonwebtoken');

/**
 * Tạo Access Token
 * @param {Object} payload - Data cần mã hóa
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '15m' } // Token hết hạn sau 15 phút
    );
};

/**
 * Tạo Refresh Token
 * @param {Object} payload - Data cần mã hóa
 * @returns {string} JWT token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' } // Token hết hạn sau 7 ngày
    );
};

/**
 * Verify JWT Token
 * @param {string} token - JWT token cần verify
 * @returns {Object} Decoded payload
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        throw new Error('Token không hợp lệ');
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyToken
};
