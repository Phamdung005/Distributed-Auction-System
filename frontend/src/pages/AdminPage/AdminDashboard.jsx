import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    LayoutDashboard,
    Users,
    Gavel,
    Wallet,
    FileBarChart,
    Settings,
    LogOut,
    Calendar,
    Download,
    Bell
} from 'lucide-react';
import AdminService from '../../services/admin.service';
import { auctionAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import UserManagement from './UserManagement';
import AuctionManagement from './AuctionManagement';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', etc.
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        bidders: 0,
        sellers: 0,
        auctions: 0
    });
    const [activeAuctions, setActiveAuctions] = useState([]);
    const [pendingAuctions, setPendingAuctions] = useState([]); // Added state for pending auctions
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const statsData = await AdminService.getStats();
            setStats({
                totalUsers: Number(statsData.totalUsers) || 0,
                activeUsers: Number(statsData.activeUsers) || 0,
                bidders: Number(statsData.bidders) || 0,
                sellers: Number(statsData.sellers) || 0,
                auctions: Number(statsData.auctions) || 0
            });

            // Fetch Active Auctions and Users in parallel
            const [auctionsRes, usersRes] = await Promise.all([
                auctionAPI.getAuctions({ status: 'active', limit: 10, sort: '-createdAt' }),
                AdminService.getUsers()
            ]);

            // auctionsRes.data.data.auctions
            setActiveAuctions(auctionsRes.data?.data?.auctions || []);

            // Process users map
            const usersList = usersRes.data || usersRes || [];
            const actualUsers = Array.isArray(usersList) ? usersList : (usersList.data || []);
            const map = {};
            actualUsers.forEach(user => {
                map[user.id] = user;
            });
            setUsersMap(map);

            // Re-added pending auction logic
            const pendingRes = await AdminService.getPendingAuctions();
            setPendingAuctions(pendingRes.data?.auctions || []);


        } catch (error) {
            console.error("Dashboard load failed", error);
            toast.error("Failed to load dashboard data: " + (error.message || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        if (!window.confirm("Duyệt phiên đấu giá này?")) return;
        try {
            await auctionAPI.updateAuction(id, { status: 'active' });
            toast.success("Đã duyệt phiên đấu giá");
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi duyệt");
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Từ chối phiên đấu giá này?")) return;
        try {
            await AdminService.deleteAuction(id);
            toast.success("Đã từ chối phiên đấu giá");
            fetchData();
        } catch (e) {
            console.error(e);
            toast.error("Lỗi khi từ chối");
        }
    };

    const handleLogout = () => {
        if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
            logout();
        }
    };

    // Helper to format VND
    const formatVND = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50 text-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    // Chart Data Calculation
    const totalRoles = stats.bidders + stats.sellers;
    const bidderPercent = totalRoles > 0 ? (stats.bidders / totalRoles) * 100 : 0;
    const sellerPercent = totalRoles > 0 ? (stats.sellers / totalRoles) * 100 : 0;

    return (
        <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shrink-0">
                <div className="p-6 flex items-center gap-3 mb-6">
                    <div className="bg-orange-100 rounded-lg p-2">
                        <Gavel className="text-orange-600" size={24} />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold leading-tight">BidMaster</h1>
                        <p className="text-gray-400 text-xs font-medium">Admin Console</p>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                    <NavItem
                        icon={<LayoutDashboard size={20} />}
                        label="Tổng quan"
                        active={activeTab === 'overview'}
                        onClick={() => setActiveTab('overview')}
                    />
                    <NavItem
                        icon={<Users size={20} />}
                        label="Người dùng"
                        active={activeTab === 'users'}
                        onClick={() => setActiveTab('users')}
                    />
                    <NavItem
                        icon={<Gavel size={20} />}
                        label="Đấu giá"
                        active={activeTab === 'auctions'}
                        onClick={() => setActiveTab('auctions')}
                    />
                    <NavItem icon={<Wallet size={20} />} label="Tài chính" />
                    <NavItem icon={<FileBarChart size={20} />} label="Báo cáo" />

                    <div className="pt-6 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Cài đặt
                    </div>
                    <NavItem icon={<Settings size={20} />} label="Hệ thống" />
                    <NavItem icon={<Users size={20} />} label="Phân quyền" />
                </nav>

                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer" onClick={handleLogout}>
                        <img src="https://ui-avatars.com/api/?name=Admin&background=random" alt="Admin" className="w-10 h-10 rounded-full" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">Super Admin</p>
                        </div>
                        <LogOut size={18} className="text-gray-400" />
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                {/* Header */}
                <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 transition-shadow hover:shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Tổng quan</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Tổng quan hệ thống ngày <span className="text-orange-600 font-medium">{new Date().toLocaleDateString('vi-VN')}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Calendar size={16} />
                            30 ngày qua
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
                            <Download size={16} />
                            Xuất báo cáo
                        </button>
                    </div>
                </header>

                {activeTab === 'overview' && (
                    <div className="p-8 space-y-8">
                        {/* Stats Cards - Removed Mock Trends */}
                        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                title="Tổng người dùng"
                                value={stats.totalUsers.toString()}
                                icon={<Users size={24} className="text-blue-600" />}
                                bg="bg-blue-50"
                            />
                            <StatCard
                                title="Người dùng Active"
                                value={stats.activeUsers.toString()}
                                icon={<Users size={24} className="text-green-600" />}
                                bg="bg-green-50"
                            />
                            <StatCard
                                title="Tổng phiên đấu giá"
                                value={stats.auctions.toString()}
                                icon={<LayoutDashboard size={24} className="text-purple-600" />}
                                bg="bg-purple-50"
                            />
                        </section>

                        {/* Charts & Breakdown & Active Auctions */}
                        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* User Role Distribution Chart */}
                            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
                                <h3 className="text-lg font-bold text-gray-900 mb-6">Phân bố người dùng</h3>
                                <div className="flex-1 flex flex-col justify-center items-center relative">
                                    {/* Simple Donut Chart Representation using CSS/SVG */}
                                    <div className="relative w-48 h-48">
                                        <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                                            {/* Background Circle */}
                                            <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                                            {/* Seller Segment (Blue) */}
                                            <path className="text-blue-500" strokeDasharray={`${sellerPercent}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                                            {/* Bidder Segment (Orange) - offset by seller percent */}
                                            <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f97316" strokeWidth="3.8" strokeDasharray={`${bidderPercent} ${100 - bidderPercent}`} strokeDashoffset={-sellerPercent} />
                                        </svg>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                                            <span className="text-3xl font-bold text-gray-900">{totalRoles}</span>
                                            <span className="text-xs text-gray-500">Users</span>
                                        </div>
                                    </div>
                                    <div className="mt-6 w-full flex justify-between px-4">
                                        <div className="flex flex-col items-center">
                                            <span className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-orange-500"></span>Bidder</span>
                                            <span className="text-lg font-bold text-gray-900">{stats.bidders}</span>
                                            <span className="text-xs text-gray-400">{bidderPercent.toFixed(1)}%</span>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="flex items-center gap-2 text-sm text-gray-600"><span className="w-3 h-3 rounded-full bg-blue-500"></span>Seller</span>
                                            <span className="text-lg font-bold text-gray-900">{stats.sellers}</span>
                                            <span className="text-xs text-gray-400">{sellerPercent.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Active Auctions List */}
                            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                    <h3 className="text-lg font-bold text-gray-900">Các phiên đấu giá hiện có</h3>
                                    <button
                                        onClick={() => setActiveTab('auctions')}
                                        className="text-sm font-bold text-orange-600 hover:text-orange-700"
                                    >
                                        Xem tất cả
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead className="bg-[#F8F9FA]">
                                            <tr>
                                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Người bán</th>
                                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Giá hiện tại</th>
                                                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {activeAuctions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400">Không có phiên đấu giá nào đang diễn ra.</td>
                                                </tr>
                                            ) : (
                                                activeAuctions.map(auction => {
                                                    const seller = usersMap[auction.seller] || { fullName: 'Unknown', email: 'N/A' };
                                                    return (
                                                        <tr key={auction.id} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-10 w-10 rounded-lg bg-gray-100 bg-cover bg-center shrink-0 border border-gray-200"
                                                                        style={{ backgroundImage: `url('${auction.image || auction.images?.[0] || 'https://via.placeholder.com/150'}')` }}>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{auction.title}</p>
                                                                        <p className="text-xs text-gray-500">{auction.category || 'Chung'}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                                                                        {seller.fullName?.[0] || 'U'}
                                                                    </div>
                                                                    <span className="text-sm text-gray-600 font-medium">{seller.fullName}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="text-sm font-mono font-bold text-orange-600">{formatVND(auction.currentPrice || auction.startPrice)}</span>
                                                            </td>
                                                            <td className="px-6 py-4">
                                                                <span className="px-2 py-1 text-[10px] font-bold rounded-full uppercase bg-green-100 text-green-700">
                                                                    Active
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    )
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>


                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="p-8">
                        <UserManagement />
                    </div>
                )}

                {activeTab === 'auctions' && (
                    <div className="p-8">
                        <AuctionManagement />
                    </div>
                )}
            </main>
        </div >
    );
};

const NavItem = ({ icon, label, active = false, onClick }) => (
    <div
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-colors cursor-pointer ${active
            ? 'bg-orange-50 text-orange-600'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
    >
        {icon}
        <span>{label}</span>
    </div>
);

const StatCard = ({ title, value, icon, bg }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-black text-gray-900">{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${bg}`}>
                {icon}
            </div>
        </div>
        {/* Mock trends removed */}
    </div>
);

export default AdminDashboard;
