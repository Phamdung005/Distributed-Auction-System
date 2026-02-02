const auctionService = require('../services/auction.service');

/**
 * Controller Layer cho Auction
 */
class AuctionController {

    /**
     * Tạo auction mới
     * POST /api/auctions
     */
    async createAuction(req, res, next) {
        try {
            const sellerId = req.user.userId;
            const auction = await auctionService.createAuction(req.body, sellerId);

            res.status(201).json({
                success: true,
                message: 'Tạo auction thành công',
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy danh sách auctions
     * GET /api/auctions
     */
    async getAuctions(req, res, next) {
        try {
            const result = await auctionService.getAuctions(req.query);

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy auctions đang active
     * GET /api/auctions/active
     */
    async getActiveAuctions(req, res, next) {
        try {
            const { page = 1, limit = 10, sort = '-createdAt' } = req.query;
            const result = await auctionService.getActiveAuctions({ page, limit, sort });

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy auction theo ID
     * GET /api/auctions/:id
     */
    async getAuctionById(req, res, next) {
        try {
            const auction = await auctionService.getAuctionById(req.params.id);

            res.status(200).json({
                success: true,
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Lấy auctions của user hiện tại
     * GET /api/auctions/my
     */
    async getMyAuctions(req, res, next) {
        try {
            const sellerId = req.user.userId;
            const { page = 1, limit = 10, sort = '-createdAt' } = req.query;

            const result = await auctionService.getMyAuctions(sellerId, { page, limit, sort });

            res.status(200).json({
                success: true,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật auction
     * PUT /api/auctions/:id
     */
    async updateAuction(req, res, next) {
        try {
            const sellerId = req.user.userId;
            const auction = await auctionService.updateAuction(
                req.params.id,
                sellerId,
                req.body
            );

            res.status(200).json({
                success: true,
                message: 'Cập nhật auction thành công',
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Xóa auction
     * DELETE /api/auctions/:id
     */
    async deleteAuction(req, res, next) {
        try {
            const sellerId = req.user.userId;
            await auctionService.deleteAuction(req.params.id, sellerId);

            res.status(200).json({
                success: true,
                message: 'Xóa auction thành công'
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Hủy auction
     * POST /api/auctions/:id/cancel
     */
    async cancelAuction(req, res, next) {
        try {
            const sellerId = req.user.userId;
            const auction = await auctionService.cancelAuction(req.params.id, sellerId);

            res.status(200).json({
                success: true,
                message: 'Hủy auction thành công',
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Cập nhật giá auction (Internal / Bidding Service)
     * PATCH /api/auctions/:id
     */
    async updatePrice(req, res, next) {
        try {
            const { currentPrice, totalBids, winner } = req.body;
            const auction = await auctionService.updatePrice(req.params.id, {
                currentPrice,
                totalBids: 1,
                winner
            });

            res.status(200).json({
                success: true,
                data: auction
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuctionController();
