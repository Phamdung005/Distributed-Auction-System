import axios from 'axios';

const PAYMENT_SERVICE_URL = import.meta.env.VITE_PAYMENT_SERVICE_URL || 'http://localhost:3006';

/**
 * API service cho Wallet operations
 */
class WalletApi {
    /**
     * Get authorization header
     */
    getAuthHeader() {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.warn('⚠️ No access token found in localStorage');
        }
        return {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
    }

    /**
     * Lấy thông tin wallet (balance + frozen funds)
     * @returns {Promise<Object>}
     */
    async getWalletBalance() {
        try {
            const response = await axios.get(
                `${PAYMENT_SERVICE_URL}/api/wallet/balance`,
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error getting wallet balance:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi lấy thông tin ví' };
        }
    }

    /**
     * Lấy lịch sử giao dịch
     * @param {Object} filters - Filters (type, status, dateFrom, dateTo)
     * @param {number} page - Page number
     * @param {number} limit - Items per page
     * @returns {Promise<Object>}
     */
    async getTransactionHistory(filters = {}, page = 1, limit = 10) {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            if (filters.type && filters.type !== 'all') {
                params.append('type', filters.type);
            }
            if (filters.status) {
                params.append('status', filters.status);
            }
            if (filters.dateFrom) {
                params.append('dateFrom', filters.dateFrom);
            }
            if (filters.dateTo) {
                params.append('dateTo', filters.dateTo);
            }

            const response = await axios.get(
                `${PAYMENT_SERVICE_URL}/api/transactions?${params.toString()}`,
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error getting transaction history:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi lấy lịch sử giao dịch' };
        }
    }

    /**
     * Lấy chi tiết transaction
     * @param {string} transactionId - Transaction ID
     * @returns {Promise<Object>}
     */
    async getTransactionDetails(transactionId) {
        try {
            const response = await axios.get(
                `${PAYMENT_SERVICE_URL}/api/transactions/${transactionId}`,
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error getting transaction details:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi lấy chi tiết giao dịch' };
        }
    }

    /**
     * Lấy thống kê giao dịch
     * @returns {Promise<Object>}
     */
    async getTransactionStats() {
        try {
            const response = await axios.get(
                `${PAYMENT_SERVICE_URL}/api/transactions/stats`,
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error getting transaction stats:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi lấy thống kê giao dịch' };
        }
    }

    /**
     * Nạp tiền vào ví
     * @param {number} amount - Số tiền nạp
     * @param {string} paymentMethod - Phương thức thanh toán
     * @param {Object} metadata - Metadata bổ sung
     * @returns {Promise<Object>}
     */
    async depositFunds(amount, paymentMethod = 'wallet', metadata = {}) {
        try {
            const response = await axios.post(
                `${PAYMENT_SERVICE_URL}/api/wallet/deposit`,
                { amount, paymentMethod, metadata },
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error depositing funds:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi nạp tiền' };
        }
    }

    /**
     * Rút tiền từ ví
     * @param {number} amount - Số tiền rút
     * @param {Object} metadata - Metadata bổ sung
     * @returns {Promise<Object>}
     */
    async withdrawFunds(amount, metadata = {}) {
        try {
            const response = await axios.post(
                `${PAYMENT_SERVICE_URL}/api/wallet/withdraw`,
                { amount, metadata },
                this.getAuthHeader()
            );
            return response.data;
        } catch (error) {
            console.error('Error withdrawing funds:', error);
            throw error.response?.data || { success: false, message: 'Lỗi khi rút tiền' };
        }
    }
}

export default new WalletApi();
