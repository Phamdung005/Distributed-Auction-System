const biddingService = require('../services/bidding.service');

/**
 * REST API Controller cho Bidding (ngoài WebSocket)
 */
class BiddingController {

    /**
     * Lấy thông tin auction
     * GET /api/bidding/auction/:auctionId
     */
    async getAuction(req, res, next) {
        try {
            const { auctionId } = req.params;
            const auction = await biddingService.getAuctionDetails(auctionId);

            res.status(200).json({
                success: true,
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy bid history
     * GET /api/bidding/auction/:auctionId/history
     */
    async getBidHistory(req, res, next) {
        try {
            const { auctionId } = req.params;
            const limit = parseInt(req.query.limit) || 20;

            const redis = req.app.locals.redis;
            const history = await biddingService.getBidHistory(redis, auctionId, limit);

            res.status(200).json({
                success: true,
                data: {
                    auctionId,
                    bids: history,
                    total: history.length
                }
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Kiểm tra user có thể bid không
     * GET /api/bidding/auction/:auctionId/can-bid
     */
    async canBid(req, res, next) {
        try {
            const { auctionId } = req.params;
            const userId = req.user.userId; // Từ auth middleware
            const role = req.user.role;

            const result = await biddingService.canUserBid(userId, auctionId, role);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Kết thúc auction (Admin only hoặc automated job)
     * POST /api/bidding/auction/:auctionId/end
     */
    async endAuction(req, res, next) {
        try {
            const { auctionId } = req.params;
            const result = await biddingService.endAuction(auctionId);

            res.status(200).json({
                success: true,
                message: 'Auction đã kết thúc',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new BiddingController();
