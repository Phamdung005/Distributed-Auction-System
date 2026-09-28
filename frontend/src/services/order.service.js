import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '';
const ORDER_BASE_URL = `${BASE_URL}/api/orders`;

const orderService = {
    getBuyingOrders: async (params) => {
        const response = await api.get(`${ORDER_BASE_URL}/buying`, { params });

        return response.data;
    },

    getSellingOrders: async (params) => {
        const response = await api.get(`${ORDER_BASE_URL}/selling`, { params });

        return response.data;
    },

    getOrderById: async (id) => {
        const response = await api.get(`${ORDER_BASE_URL}/${id}`);

        return response.data;
    },

    sendMessage: async (id, content) => {
        const response = await api.post(`${ORDER_BASE_URL}/${id}/messages`, { content });

        return response.data;
    },

    updateAddress: async (id, addressData) => {
        const response = await api.patch(`${ORDER_BASE_URL}/${id}/address`, addressData);

        return response.data;
    },

    confirmShipping: async (id) => {
        const response = await api.post(`${ORDER_BASE_URL}/${id}/ship`);

        return response.data;
    },

    confirmReceipt: async (id) => {
        const response = await api.post(`${ORDER_BASE_URL}/${id}/receive`);

        return response.data;
    }
};

export default orderService;
