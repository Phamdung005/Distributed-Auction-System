const formatPrice = (price) => {
    if (!price) return '0 ₫';
    return price.toLocaleString('vi-VN') + ' ₫';
};

const NOTIFICATION_TEMPLATES = {
    // ============ BIDDER NOTIFICATIONS ============
    BID_PLACED: {
        title: 'Đặt giá thành công',
        message: (data) => `Bạn đã đặt giá ${formatPrice(data.amount)} cho "${data.auctionTitle}"`,
        priority: 'low'
    },

    OUTBID: {
        title: 'Bạn đã bị vượt giá',
        message: (data) => `Giá đặt của bạn cho "${data.auctionTitle}" đã bị vượt. Giá hiện tại: ${formatPrice(data.amount)}`,
        priority: 'high'
    },

    WINNING: {
        title: 'Bạn đang dẫn đầu',
        message: (data) => `Bạn đang dẫn đầu đấu giá "${data.auctionTitle}" với giá ${formatPrice(data.amount)}`,
        priority: 'medium'
    },

    REGISTRATION_APPROVED: {
        title: 'Đăng ký tham gia thành công',
        message: (data) => `Bạn đã đăng ký thành công phiên đấu giá "${data.auctionTitle}". Tiền cọc: ${formatPrice(data.amount)}`,
        priority: 'high'
    },

    AUCTION_STARTING_SOON: {
        title: 'Đấu giá sắp bắt đầu',
        message: (data) => `"${data.auctionTitle}" sẽ bắt đầu trong 15 phút`,
        priority: 'medium'
    },

    DEPOSIT_REFUNDED: {
        title: 'Hoàn trả tiền cọc',
        message: (data) => `Tiền cọc ${formatPrice(data.amount)} cho "${data.auctionTitle}" đã được hoàn trả vào ví của bạn`,
        priority: 'medium'
    },

    AUCTION_STARTED: {
        title: 'Đấu giá đã bắt đầu',
        message: (data) => `"${data.auctionTitle}" đã bắt đầu. Tham gia ngay!`,
        priority: 'medium'
    },

    AUCTION_ENDING_SOON: {
        title: 'Đấu giá sắp kết thúc',
        message: (data) => `"${data.auctionTitle}" sẽ kết thúc trong 5 phút`,
        priority: 'high'
    },

    WON_AUCTION: {
        title: '🎉 Chúc mừng! Bạn đã thắng',
        message: (data) => `Bạn đã thắng đấu giá "${data.auctionTitle}" với giá ${formatPrice(data.amount)}`,
        priority: 'high'
    },

    LOST_AUCTION: {
        title: 'Đấu giá đã kết thúc',
        message: (data) => `"${data.auctionTitle}" đã kết thúc. Bạn không thắng lần này.`,
        priority: 'low'
    },

    WALLET_DEPOSIT: {
        title: 'Nạp tiền thành công',
        message: (data) => `Bạn đã nạp thành công ${formatPrice(data.amount)} vào ví.`,
        priority: 'high'
    },

    AUCTION_PAYMENT_SUCCESSFUL: {
        title: 'Thanh toán thành công',
        message: (data) => `Bạn đã thanh toán thành công ${formatPrice(data.amount)} cho "${data.auctionTitle}".`,
        priority: 'high'
    },

    // ============ SELLER NOTIFICATIONS ============
    SELLER_NEW_BID: {
        title: 'Có người đặt giá vào auction của bạn',
        message: (data) => `${data.bidderName} đã đặt giá ${formatPrice(data.amount)} cho "${data.auctionTitle}"`,
        priority: 'medium'
    },

    SELLER_FIRST_BID: {
        title: 'Bid đầu tiên!',
        message: (data) => `"${data.auctionTitle}" đã nhận được bid đầu tiên: ${formatPrice(data.amount)}`,
        priority: 'high'
    },

    SELLER_AUCTION_STARTING_SOON: {
        title: 'Auction của bạn sắp bắt đầu',
        message: (data) => `"${data.auctionTitle}" sẽ bắt đầu trong 15 phút`,
        priority: 'medium'
    },

    SELLER_AUCTION_STARTED: {
        title: 'Auction của bạn đã bắt đầu',
        message: (data) => `"${data.auctionTitle}" đã bắt đầu nhận bids`,
        priority: 'medium'
    },

    SELLER_AUCTION_ENDING_SOON: {
        title: 'Auction của bạn sắp kết thúc',
        message: (data) => `"${data.auctionTitle}" sẽ kết thúc trong 5 phút. Giá hiện tại: ${formatPrice(data.amount)}`,
        priority: 'high'
    },

    SELLER_AUCTION_SOLD: {
        title: 'Auction đã bán thành công!',
        message: (data) => `"${data.auctionTitle}" đã bán với giá ${formatPrice(data.amount)} cho ${data.bidderName}`,
        priority: 'high'
    },

    SELLER_AUCTION_NO_SALE: {
        title: 'Auction đã kết thúc',
        message: (data) => `"${data.auctionTitle}" đã kết thúc nhưng không có người mua${data.totalBids > 0 ? ` (${data.totalBids} bids)` : ''}`,
        priority: 'medium'
    },

    SELLER_AUCTION_CREATED: {
        title: 'Tạo đấu giá thành công',
        message: (data) => `Bạn đã tạo thành công đấu giá "${data.auctionTitle}"`,
        priority: 'low'
    },

    SELLER_AUCTION_UPDATED: {
        title: 'Cập nhật đấu giá thành công',
        message: (data) => `Thông tin đấu giá "${data.auctionTitle}" đã được cập nhật`,
        priority: 'low'
    },

    SELLER_AUCTION_DELETED: {
        title: 'Xóa đấu giá thành công',
        message: (data) => `Đấu giá "${data.auctionTitle}" đã được xóa khỏi hệ thống`,
        priority: 'medium'
    },

    SELLER_PAYOUT_RECEIVED: {
        title: 'Bạn đã nhận được tiền!',
        message: (data) => `Bạn đã nhận được ${formatPrice(data.amount)} vào ví từ đấu giá "${data.auctionTitle}"`,
        priority: 'high'
    }
};

module.exports = NOTIFICATION_TEMPLATES;
