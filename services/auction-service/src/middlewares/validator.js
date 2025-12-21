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
 * Validation rules cho tạo auction
 */
const createAuctionValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề là bắt buộc')
        .isLength({ max: 200 })
        .withMessage('Tiêu đề không được vượt quá 200 ký tự'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Mô tả là bắt buộc')
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    body('category')
        .notEmpty()
        .withMessage('Danh mục là bắt buộc')
        .isIn(['electronics', 'fashion', 'art', 'collectibles', 'vehicles', 'real-estate', 'other'])
        .withMessage('Danh mục không hợp lệ'),

    body('startPrice')
        .isFloat({ min: 0 })
        .withMessage('Giá khởi điểm phải là số dương'),

    body('minBidIncrement')
        .isFloat({ min: 1 })
        .withMessage('Bước giá phải lớn hơn 0'),

    body('startTime')
        .isISO8601()
        .withMessage('Thời gian bắt đầu không hợp lệ'),

    body('endTime')
        .isISO8601()
        .withMessage('Thời gian kết thúc không hợp lệ'),

    body('images')
        .isArray({ min: 1 })
        .withMessage('Phải có ít nhất 1 ảnh'),

    validate
];

/**
 * Validation rules cho cập nhật auction
 */
const updateAuctionValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Tiêu đề không được vượt quá 200 ký tự'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Mô tả không được vượt quá 2000 ký tự'),

    validate
];

module.exports = {
    createAuctionValidation,
    updateAuctionValidation
};
