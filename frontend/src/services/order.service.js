import api from './api';

const ORDER_BASE_URL = 'http://localhost:3007/api/orders';

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
    }
};

export default orderService;
