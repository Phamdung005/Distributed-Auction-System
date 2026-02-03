import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { Gavel, Bell, PlusCircle, List, LogOut, Package } from 'lucide-react';
import { notificationAPI } from '../../../services/notification.service';

const NavLink = ({ to, children, icon: Icon }) => (
    <Link
        to={to}
        className="flex items-center gap-2 px-4 py-2 text-gray-700 text-sm font-semibold rounded-full hover:text-[#f26c0d] hover:bg-orange-50 transition-all duration-200"
    >
        {Icon && <Icon size={16} />}
        {children}
    </Link>
);

const NavbarSeller = () => {
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (isAuthenticated) {
            setupSocket();
            fetchUnreadCount();
        }
    }, [isAuthenticated]);

    const fetchUnreadCount = async () => {
        try {
            const response = await notificationAPI.getUnreadCount();
            if (response.data.success) {
                setUnreadCount(response.data.data.count);
            }
        } catch (error) {
            console.error('Failed to fetch unread count:', error);
        }
    };

    const setupSocket = async () => {
        try {
            const { connectNotificationSocket } = await import('../../../services/notificationSocket');
            const token = localStorage.getItem('accessToken');
            const socket = connectNotificationSocket(token);

            if (socket) {
                socket.on('notification:new', () => {
                    fetchUnreadCount(); // Fetch fresh count
                });
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="w-full font-sans">
            <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/90 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-6 flex-1">
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        <div className="bg-[#f26c0d] p-2 rounded-xl group-hover:rotate-12 transition-transform duration-300">
                            <Gavel className="text-white" size={20} />
                        </div>
                        <span className="text-xl font-black tracking-tighter text-gray-800">
                            BidMaster
                        </span>
                    </Link>

                    {/* Optional: Add search if needed, or keep it clean for seller */}
                </div>

                <nav className="hidden xl:flex items-center mx-6 bg-gray-50/80 px-2 py-1 rounded-full border border-gray-100">
                    <NavLink to="/">Trang chủ</NavLink>
                    <NavLink to="/create-auction" icon={PlusCircle}>Tạo đấu giá</NavLink>
                    <NavLink to="/my-auctions" icon={List}>Đấu giá của tôi</NavLink>
                    <NavLink to="/auction-list" icon={Package}>Marketplace</NavLink>
                </nav>

                <div className="flex items-center gap-2 lg:gap-4">
                    {/* Notifications */}
                    <Link to="/notifications" className="p-2.5 bg-[#f5f0eb] text-gray-600 hover:text-[#f26c0d] hover:bg-orange-50 rounded-xl transition-all relative">
                        <Bell size={22} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </Link>

                    <div className="h-8 w-[1px] bg-gray-200 mx-1 hidden sm:block"></div>

                    {/* User Profile */}
                    <Link to="/profile" className="flex items-center gap-2 pl-1 pr-3 py-1 hover:bg-gray-50 rounded-full border border-transparent hover:border-gray-100 transition-all group">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-500 to-orange-400 text-white flex items-center justify-center font-bold text-sm shadow-sm group-hover:scale-105 transition-transform border-2 border-white">
                            {user?.fullName?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="hidden lg:flex flex-col items-start">
                            <span className="text-sm font-bold text-gray-800 leading-none">{user?.fullName}</span>
                            <span className="text-xs text-[#f26c0d] font-semibold mt-0.5">
                                {user?.balance?.toLocaleString('vi-VN')} VND
                            </span>
                        </div>
                    </Link>
                </div>
            </header>
        </div>
    );
};

export default NavbarSeller;
