
import axios from 'axios';
import api, { auctionAPI, authAPI, biddingAPI } from './api';
import walletApi from './walletApi';

const AdminService = {
    // Stats
    getStats: async () => {
        try {
            // Parallel fetch for dashboard stats
            const [walletStats, users, auctions] = await Promise.all([
                walletApi.getTransactionStats(),
                api.get('http://localhost:3001/api/auth/users'),
                auctionAPI.getAuctions({ limit: 1 }) // Just to get count from pagination if possible, or use specific stats API if added
            ]);

            // Calculate totals
            const userList = users.data?.data || [];
            const totalUsers = userList.length;
            const activeUsers = userList.filter(u => u.isActive).length;
            const bidders = userList.filter(u => u.role === 'bidder').length;
            const sellers = userList.filter(u => u.role === 'seller').length;

            const totalAuctions = auctions.data?.pagination?.totalItems || 0;

            return {
                revenue: totalRevenue,
                totalUsers,
                activeUsers,
                bidders,
                sellers,
                auctions: totalAuctions,
                pendingApprovals: 0
            };
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
            throw error;
        }
    },

    // Get Users List
    getUsers: async () => {
        const response = await api.get('http://localhost:3001/api/auth/users');
        return response.data;
    },

    // Get Pending Auctions
    getPendingAuctions: async () => {
        const response = await auctionAPI.getAuctions({ status: 'pending', limit: 5 });
        return response.data;
    },

    // Get Recent Transactions
    getRecentTransactions: async () => {
        // Admin likely wants to see all types
        return await walletApi.getTransactionHistory({ type: 'all' }, 1, 5);
    },

    // Delete Auction
    deleteAuction: async (id) => {
        return await auctionAPI.deleteAuction(id);
    }
};

export default AdminService;
