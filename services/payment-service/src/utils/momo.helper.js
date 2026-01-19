const crypto = require('crypto');

/**
 * MoMo Helper Functions
 * Xử lý signature và request cho MoMo payment gateway
 */

/**
 * Tạo HMAC SHA256 signature cho MoMo request
 * @param {Object} data - Dữ liệu cần sign
 * @param {string} secretKey - Secret key từ MoMo
 * @returns {string} Signature
 */
function generateSignature(data, secretKey) {
    // MoMo yêu cầu các fields theo thứ tự alphabet
    const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${data.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${data.partnerCode}&redirectUrl=${data.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;

    return crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');
}

/**
 * Verify signature từ MoMo callback
 * @param {Object} data - Dữ liệu từ MoMo
 * @param {string} signature - Signature cần verify
 * @param {string} secretKey - Secret key từ MoMo
 * @returns {boolean}
 */
function verifySignature(data, signature, secretKey) {
    const rawSignature = `accessKey=${data.accessKey}&amount=${data.amount}&extraData=${data.extraData}&message=${data.message}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&orderType=${data.orderType}&partnerCode=${data.partnerCode}&payType=${data.payType}&requestId=${data.requestId}&responseTime=${data.responseTime}&resultCode=${data.resultCode}&transId=${data.transId}`;

    const expectedSignature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    return signature === expectedSignature;
}

/**
 * Tạo unique request ID
 * @returns {string}
 */
function generateRequestId() {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Tạo unique order ID
 * @param {string} userId - ID của user
 * @returns {string}
 */
function generateOrderId(userId) {
    const timestamp = Date.now();
    const userIdShort = userId.substring(userId.length - 6);
    return `AUCTION_${userIdShort}_${timestamp}`;
}

/**
 * Parse MoMo result code
 * @param {number} resultCode - Result code từ MoMo
 * @returns {Object} { success: boolean, message: string }
 */
function parseMomoResultCode(resultCode) {
    const codes = {
        0: { success: true, message: 'Giao dịch thành công' },
        9000: { success: false, message: 'Giao dịch đã được xác nhận thành công' },
        8000: { success: false, message: 'Giao dịch đang được xử lý' },
        7000: { success: false, message: 'Giao dịch đang chờ thanh toán' },
        1000: { success: false, message: 'Giao dịch đã được khởi tạo, chờ người dùng xác nhận thanh toán' },
        11: { success: false, message: 'Truy cập bị từ chối' },
        12: { success: false, message: 'Phiên bản API không được hỗ trợ' },
        13: { success: false, message: 'Xác thực merchant thất bại' },
        20: { success: false, message: 'Số tiền không hợp lệ' },
        21: { success: false, message: 'Số tiền giao dịch vượt quá hạn mức' },
        40: { success: false, message: 'RequestId bị trùng' },
        41: { success: false, message: 'OrderId bị trùng' },
        42: { success: false, message: 'OrderId không hợp lệ hoặc không được tìm thấy' },
        43: { success: false, message: 'Request bị từ chối vì xung đột trong quá trình xử lý giao dịch' },
        1001: { success: false, message: 'Giao dịch thanh toán thất bại do tài khoản người dùng không đủ tiền' },
        1002: { success: false, message: 'Giao dịch bị từ chối do nhà phát hành tài khoản thanh toán' },
        1003: { success: false, message: 'Giao dịch bị hủy' },
        1004: { success: false, message: 'Giao dịch thất bại do số tiền thanh toán vượt quá hạn mức thanh toán của người dùng' },
        1005: { success: false, message: 'Giao dịch thất bại do url hoặc QR code đã hết hạn' },
        1006: { success: false, message: 'Giao dịch thất bại do người dùng đã từ chối xác nhận thanh toán' },
        1007: { success: false, message: 'Giao dịch bị từ chối vì tài khoản người dùng đang bị tạm khóa' },
        2001: { success: false, message: 'Giao dịch thất bại do sai thông tin liên kết' },
        3001: { success: false, message: 'Liên kết thanh toán không tồn tại hoặc đã hết hạn' },
        3002: { success: false, message: 'Số tiền thanh toán không hợp lệ' },
        3003: { success: false, message: 'Mã giao dịch không tồn tại' },
        3004: { success: false, message: 'Giao dịch đã được xử lý, không thể thực hiện lại' },
        4001: { success: false, message: 'Giao dịch bị hủy do hết thời gian thanh toán' },
        4010: { success: false, message: 'Merchant không được phép sử dụng phương thức thanh toán này' },
        4011: { success: false, message: 'Giao dịch vượt quá hạn mức thanh toán của merchant' },
        4015: { success: false, message: 'Giao dịch bị hủy do merchant từ chối thanh toán' },
        4100: { success: false, message: 'Giao dịch bị hủy do merchant không xác nhận thanh toán trong thời gian quy định' },
        10: { success: false, message: 'Hệ thống đang được bảo trì' },
        99: { success: false, message: 'Lỗi không xác định' }
    };

    return codes[resultCode] || { success: false, message: 'Lỗi không xác định' };
}

module.exports = {
    generateSignature,
    verifySignature,
    generateRequestId,
    generateOrderId,
    parseMomoResultCode
};
