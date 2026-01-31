const mongoose = require('mongoose');
const AuctionRegistration = require('../models/AuctionRegistration');
const Auction = require('../models/Auction');
// Note: Escrow is in Payment Service, should use Payment Service API
const axios = require('axios');

const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3006';

class RegistrationController {
    /**
     * Đăng ký tham gia đấu giá
     * POST /api/auctions/:id/register
     */
    async register(req, res) {
        try {
            const { id: auctionId } = req.params;
            const userId = req.user.userId;

            // 1. Kiểm tra auction tồn tại
            const auction = await Auction.findById(auctionId);
            if (!auction) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy phiên đấu giá'
                });
            }

            // 2. Kiểm tra trạng thái auction
            if (auction.status !== 'pending' && auction.status !== 'active') {
                return res.status(400).json({
                    success: false,
                    message: 'Phiên đấu giá đã kết thúc hoặc chưa sẵn sàng'
                });
            }

            // 3. Kiểm tra đã đăng ký chưa
            const existingRegistration = await AuctionRegistration.findOne({
                auction_id: auctionId,
                bidder_id: userId
            });

            if (existingRegistration) {
                return res.status(400).json({
                    success: false,
                    message: 'Bạn đã đăng ký tham gia phiên đấu giá này rồi'
                });
            }

            // 4. Tính toán tiền cọc (10% của startPrice)
            const depositAmount = auction.minDeposit || (auction.startPrice * 0.1);

            // 5. Gọi Payment Service để freeze funds
            let freezeResult;
            try {
                const response = await axios.post(
                    `${PAYMENT_SERVICE_URL}/api/wallet/freeze`,
                    {
                        amount: depositAmount,
                        auctionId: auctionId
                    },
                    {
                        headers: {
                            'Authorization': req.headers.authorization
                        }
                    }
                );

                freezeResult = response.data;

                if (!freezeResult.success) {
                    return res.status(400).json({
                        success: false,
                        message: freezeResult.message || 'Không thể đặt cọc'
                    });
                }
            } catch (error) {
                console.error('Error calling payment service:', error);
                return res.status(400).json({
                    success: false,
                    message: error.response?.data?.message || 'Không thể đặt cọc. Vui lòng kiểm tra số dư.'
                });
            }

            // 6. Tạo AuctionRegistration với thông tin escrow
            const newRegistration = new AuctionRegistration({
                auction_id: auctionId,
                bidder_id: userId,
                depositAmount: depositAmount,
                status: 'approved', // Auto-approve
                depositPaid: true,
                depositEscrow_id: freezeResult.data.escrowId,
                depositTransaction_id: freezeResult.data.transactionId,
                approvedAt: new Date(),
                notes: 'Đăng ký và đặt cọc thành công'
            });

            await newRegistration.save();

            return res.status(201).json({
                success: true,
                message: 'Đăng ký tham gia đấu giá thành công',
                data: newRegistration
            });

        } catch (error) {
            console.error('Error in register auction:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi đăng ký tham gia đấu giá'
            });
        }
    }

    /**
     * Kiểm tra trạng thái đăng ký của user với auction
     * GET /api/auctions/:id/registration-status
     */
    async checkStatus(req, res) {
        try {
            const { id: auctionId } = req.params;
            const userId = req.user.userId;

            const registration = await AuctionRegistration.findOne({
                auction_id: auctionId,
                bidder_id: userId
            });

            if (!registration) {
                return res.json({
                    success: true,
                    isRegistered: false,
                    status: null
                });
            }

            return res.json({
                success: true,
                isRegistered: true,
                status: registration.status,
                registration
            });

        } catch (error) {
            console.error('Error checking registration status:', error);
            return res.status(500).json({
                success: false,
                message: 'Lỗi server khi kiểm tra trạng thái đăng ký'
            });
        }
    }
}

module.exports = new RegistrationController();
