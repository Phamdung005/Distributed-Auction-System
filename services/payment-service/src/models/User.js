const mongoose = require('mongoose');

/**
 * Schema cho User trong Payment Service
 * Chỉ chứa thông tin cần thiết cho wallet operations
 */
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    fullName: {
        type: String,
        required: [true, 'Họ tên là bắt buộc'],
        trim: true
    },
    phone: {
        type: String,
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
    },
    balance: {
        type: Number,
        default: 0,
        min: [0, 'Số dư không thể âm']
    },
    role: {
        type: String,
        enum: ['seller', 'bidder', 'admin'],
        default: 'bidder'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

/**
 * Method: Ẩn thông tin nhạy cảm khi trả về JSON
 */
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
