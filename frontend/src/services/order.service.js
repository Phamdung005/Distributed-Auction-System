import api from './api';

const orderService = {
    getBuyingOrders: async (params) => {
        const response = await api.get('/auction/api/orders/buying', { params });
        return response.data;
    },

    getSellingOrders: async (params) => {
        const response = await api.get('/auction/api/orders/selling', { params });
        return response.data;
    },

    getOrderById: async (id) => {
        const response = await api.get(`/auction/api/orders/${id}`);
        return response.data;
    },

    sendMessage: async (id, content) => {
        const response = await api.post(`/auction/api/orders/${id}/messages`, { content });
        return response.data;
    },

    updateAddress: async (id, addressData) => {
        const response = await api.patch(`/auction/api/orders/${id}/address`, addressData);
        return response.data;
    }
};

export default orderService;
