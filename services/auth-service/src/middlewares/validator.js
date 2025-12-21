const { body, validationResult } = require('express-validator');

/**
 * Middleware kiểm tra validation errors
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }

    next();
};

/**
 * Validation rules cho đăng ký
 */
const registerValidation = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .withMessage('Username phải có từ 3-50 ký tự')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('Username chỉ chứa chữ cái, số và dấu gạch dưới'),

    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),

    body('password')
        .isLength({ min: 6 })
        .withMessage('Password phải có ít nhất 6 ký tự')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'),

    body('fullName')
        .trim()
        .notEmpty()
        .withMessage('Họ tên là bắt buộc')
        .isLength({ max: 100 })
        .withMessage('Họ tên không được vượt quá 100 ký tự'),

    body('phone')
        .optional()
        .matches(/^[0-9]{10,11}$/)
        .withMessage('Số điện thoại không hợp lệ'),

    validate
];

/**
 * Validation rules cho đăng nhập
 */
const loginValidation = [
    body('email')
        .trim()
        .isEmail()
        .withMessage('Email không hợp lệ')
        .normalizeEmail(),

    body('password')
        .notEmpty()
        .withMessage('Password là bắt buộc'),

    validate
];

module.exports = {
    registerValidation,
    loginValidation
};
