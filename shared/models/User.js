const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Schema cho User
 */
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username là bắt buộc'],
        unique: true,
        trim: true,
        minlength: [3, 'Username phải có ít nhất 3 ký tự'],
        maxlength: [50, 'Username không được vượt quá 50 ký tự']
    },
    email: {
        type: String,
        required: [true, 'Email là bắt buộc'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    password: {
        type: String,
        required: [true, 'Password là bắt buộc'],
        minlength: [6, 'Password phải có ít nhất 6 ký tự'],
        select: false // Không trả về password khi query
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
    },
    avatar: {
        type: String,
        default: null
    },
    // Thông tin bảo mật
    refreshTokens: [{
        token: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
}, {
    timestamps: true // Tự động tạo createdAt và updatedAt
});

// Index để tối ưu query
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

/**
 * Middleware: Hash password trước khi lưu
 */
userSchema.pre('save', async function (next) {
    // Chỉ hash nếu password được thay đổi
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

/**
 * Method: So sánh password
 * @param {string} candidatePassword - Password cần kiểm tra
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method: Kiểm tra password có bị thay đổi sau khi token được issue
 * @param {number} JWTTimestamp - Timestamp của JWT
 * @returns {boolean}
 */
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

/**
 * Method: Ẩn thông tin nhạy cảm khi trả về JSON
 */
userSchema.methods.toJSON = function () {
    const user = this.toObject();
    delete user.password;
    delete user.refreshTokens;
    delete user.passwordResetToken;
    delete user.passwordResetExpires;
    return user;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
