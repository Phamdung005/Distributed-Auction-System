import axios from 'axios';

// Base URLs cho các services
const AUTH_BASE_URL = 'http://localhost:3001/api/auth';
const AUCTION_BASE_URL = 'http://localhost:3002/api/auctions';
const BIDDING_BASE_URL = 'http://localhost:3003/api/bidding';

// Tạo axios instance
const api = axios.create({
    timeout: 10000,
});

// Request interceptor - Thêm token vào header
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Xử lý lỗi
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu token hết hạn, thử refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (refreshToken) {
                    const response = await axios.post(`${AUTH_BASE_URL}/refresh`, {
                        refreshToken,
                    });

                    const { accessToken } = response.data.data;
                    localStorage.setItem('accessToken', accessToken);

                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Refresh thất bại, logout
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// ==================== AUTH SERVICE ====================

export const authAPI = {
    // Đăng ký
    register: (data) => api.post(`${AUTH_BASE_URL}/register`, data),

    // Đăng nhập
    login: (data) => api.post(`${AUTH_BASE_URL}/login`, data),

    // Lấy thông tin profile
    getProfile: () => api.get(`${AUTH_BASE_URL}/me`),

    // Cập nhật profile
    updateProfile: (data) => api.put(`${AUTH_BASE_URL}/me`, data),

    // Đổi mật khẩu
    changePassword: (data) => api.post(`${AUTH_BASE_URL}/change-password`, data),

    // Đăng xuất
    logout: (refreshToken) => api.post(`${AUTH_BASE_URL}/logout`, { refreshToken }),

    // Refresh token
    refreshToken: (refreshToken) => api.post(`${AUTH_BASE_URL}/refresh`, { refreshToken }),
};

// ==================== AUCTION SERVICE ====================

export const auctionAPI = {
    // Lấy danh sách auctions
    getAuctions: (params) => api.get(AUCTION_BASE_URL, { params }),

    // Lấy auctions đang active
    getActiveAuctions: (params) => api.get(`${AUCTION_BASE_URL}/active`, { params }),

    // Lấy auction theo ID
    getAuctionById: (id) => api.get(`${AUCTION_BASE_URL}/${id}`),

    // Lấy auctions của tôi
    getMyAuctions: (params) => api.get(`${AUCTION_BASE_URL}/my`, { params }),

    // Tạo auction mới
    createAuction: (data) => api.post(AUCTION_BASE_URL, data),

    // Cập nhật auction
    updateAuction: (id, data) => api.put(`${AUCTION_BASE_URL}/${id}`, data),

    // Xóa auction
    deleteAuction: (id) => api.delete(`${AUCTION_BASE_URL}/${id}`),

    // Hủy auction
    cancelAuction: (id) => api.post(`${AUCTION_BASE_URL}/${id}/cancel`),
};

// ==================== BIDDING SERVICE ====================

export const biddingAPI = {
    // Lấy thông tin auction
    getAuction: (auctionId) => api.get(`${BIDDING_BASE_URL}/auction/${auctionId}`),

    // Lấy bid history
    getBidHistory: (auctionId, limit = 20) =>
        api.get(`${BIDDING_BASE_URL}/auction/${auctionId}/history`, { params: { limit } }),

    // Kiểm tra có thể bid không
    canBid: (auctionId) => api.get(`${BIDDING_BASE_URL}/auction/${auctionId}/can-bid`),

    // Kết thúc auction
    endAuction: (auctionId) => api.post(`${BIDDING_BASE_URL}/auction/${auctionId}/end`),
};

export default api;
