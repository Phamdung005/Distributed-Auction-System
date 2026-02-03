import axios from 'axios';
import api, { auctionAPI, authAPI, biddingAPI } from './api';
import walletApi from './walletApi';

const AUCTION_URL = 'http://localhost:3001/api/auctions'; // Define AUCTION_URL

const AdminService = {
    // Get All Auctions (for management)
    getAuctions: async (params) => {
        return await auctionAPI.getAuctions(params);
    },

    // Update Auction (Admin override)
    updateAuction: async (id, data) => {
        return await auctionAPI.updateAuction(id, data);
    },

    // Cancel Auction
    cancelAuction: async (id) => {
        return await api.post(`${AUCTION_URL}/${id}/cancel`);
    },

    // Stats
    getStats: async () => {
        try {
            // Parallel fetch for dashboard stats using allSettled to prevent one failure from breaking everything
            const results = await Promise.allSettled([
                walletApi.getTransactionStats(),
                api.get('http://localhost:3001/api/auth/users'),
                auctionAPI.getAuctions({ limit: 1 }), // Total
                auctionAPI.getAuctions({ status: 'pending', limit: 1 }),
                auctionAPI.getAuctions({ status: 'active', limit: 1 }),
                auctionAPI.getAuctions({ status: 'ended', limit: 1 })
            ]);

            const [walletRes, usersRes, totalAuctionsRes, pendingRes, activeRes, endedRes] = results;

            // Log errors if any
            if (walletRes.status === 'rejected') console.error('Wallet stats failed:', walletRes.reason);
            if (usersRes.status === 'rejected') console.error('Users stats failed:', usersRes.reason);
            if (totalAuctionsRes.status === 'rejected') console.error('Auctions stats failed:', totalAuctionsRes.reason);

            // Extract data handling failures gracefully
            const walletStats = walletRes.status === 'fulfilled' ? walletRes.value : { revenue: 0 }; // Adjust based on actual wallet structure

            const userList = (usersRes.status === 'fulfilled' && usersRes.value.data?.data)
                ? usersRes.value.data.data
                : [];

            const totalUsers = userList.length;
            const activeUsers = userList.filter(u => u.isActive).length;
            const bidders = userList.filter(u => u.role === 'bidder').length;
            const sellers = userList.filter(u => u.role === 'seller').length;

            // Correct path: auctionsRes.value.data.data.pagination
            const auctionsData = (totalAuctionsRes.status === 'fulfilled' && totalAuctionsRes.value.data)
                ? totalAuctionsRes.value.data
                : {};

            // Check for both nested data structure (standard API) or direct (if structure differs)
            const totalAuctions = auctionsData.data?.pagination?.totalItems || auctionsData.pagination?.totalItems || 0;

            // Auction Counts Helper
            const getCount = (res) => {
                const responseData = res.status === 'fulfilled' ? res.value?.data : null;
                if (responseData && responseData.data) {
                    const pagination = responseData.data.pagination || responseData.pagination;
                    return pagination?.totalItems || 0;
                }
                return 0;
            };

            const pendingAuctions = getCount(pendingRes);
            const activeAuctionsCount = getCount(activeRes);
            const endedAuctions = getCount(endedRes);

            // Mocked pending approvals for now if no API exists
            return {
                revenue: 0, // Wallet stats structure needs verification, putting dummy 0 safely
                totalUsers,
                activeUsers,
                bidders,
                sellers,
                auctions: totalAuctions,
                pendingAuctions,
                activeAuctions: activeAuctionsCount,
                endedAuctions,
                pendingApprovals: 0
            };
        } catch (error) {
            console.error("Failed to fetch admin stats", error);
            throw error; // Let component handle global failure if needed
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
    },

    // User Management API
    createUser: async (userData) => {
        return await api.post('http://localhost:3001/api/auth/users', userData);
    },

    updateUser: async (userId, userData) => {
        return await api.put(`http://localhost:3001/api/auth/users/${userId}`, userData);
    },

    deleteUser: async (userId) => {
        return await api.delete(`http://localhost:3001/api/auth/users/${userId}`);
    }
};

export default AdminService;
