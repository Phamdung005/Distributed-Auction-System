import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { toast } from 'react-toastify';

export const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // Khởi tạo: Kiểm tra token và load user
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem('accessToken');
            // const savedUser = localStorage.getItem('user'); // No longer used directly for optimistic set

            if (token) {
                try {
                    // Chờ verify profile thành công (bao gồm cả việc refresh token tự động ở interceptor nếu cần)
                    // trước khi set isAuthenticated = true
                    const response = await authAPI.getProfile();
                    const userData = response.data.data;

                    setUser(userData);
                    setIsAuthenticated(true);
                    localStorage.setItem('user', JSON.stringify(userData));
                } catch (error) {
                    console.error('Initial auth failed:', error);
                    // Nếu lỗi 401 (không thể refresh) thì logout
                    logout();
                }
            }
            setLoading(false);
        };

        initAuth();
    }, []);

    // Đăng ký
    const register = async (userData) => {
        try {
            const response = await authAPI.register(userData);
            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            setIsAuthenticated(true);

            toast.success('Đăng ký thành công!');
            return { success: true };
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng ký thất bại';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Đăng nhập
    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const { user, accessToken, refreshToken } = response.data.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
            localStorage.setItem('user', JSON.stringify(user));

            setUser(user);
            setIsAuthenticated(true);

            toast.success('Đăng nhập thành công!');
            return { success: true, user };
        } catch (error) {
            const message = error.response?.data?.message || 'Đăng nhập thất bại';
            toast.error(message);
            return { success: false, error: message };
        }
    };

    // Đăng xuất
    const logout = async () => {
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
                await authAPI.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
            toast.info('Đã đăng xuất');
        }
    };

    // Lấy access token
    const getAccessToken = () => {
        return localStorage.getItem('accessToken');
    };

    // Refresh user profile
    const refreshProfile = async () => {
        try {
            const response = await authAPI.getProfile();
            const userData = response.data.data;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            return userData;
        } catch (error) {
            console.error('Failed to refresh profile:', error);
            throw error;
        }
    };

    const value = {
        user,
        isAuthenticated,
        loading,
        register,
        login,
        logout,
        getAccessToken,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
