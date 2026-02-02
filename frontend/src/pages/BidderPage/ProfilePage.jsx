import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, auctionAPI } from '../../services/api'; // Assuming auctionAPI has getMyAuctions
import { toast } from 'react-toastify';
import {
    User,
    Lock,
    History,
    LogOut,
    Camera,
    Gavel,
    Trophy,
    X,
    Clock,
    ChevronRight,
    Wallet
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import walletApi from '../../services/walletApi';
import OrderListPage from '../OrderPage/OrderListPage';
import { ShoppingBag } from 'lucide-react';

const ProfilePage = () => {
    const { user, logout, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // State for tabs
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'general'); // general, security, history, wallet

    // State for form data
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '', // Note: User model might not have address yet, we'll handle gracefully
        dob: ''
    });

    // State for password change
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // State for auctions
    const [myAuctions, setMyAuctions] = useState([]);
    const [loadingAuctions, setLoadingAuctions] = useState(false);

    // State for wallet
    const [walletInfo, setWalletInfo] = useState(null);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [loadingWallet, setLoadingWallet] = useState(false);

    // State for UI
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false); // For future use if we want read-only mode first

    // Initialize data
    useEffect(() => {
        if (user) {

            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
            });
        }
    }, [user]);

    // Fetch auctions when tab changes to history
    useEffect(() => {
        if (activeTab === 'history') {
            fetchMyAuctions();
        }
        if (activeTab === 'wallet') {
            fetchWalletInfo();
        }
    }, [activeTab]);

    const fetchMyAuctions = async () => {
        setLoadingAuctions(true);
        try {
            // Adjust API call based on your actual API service
            // This is a guess based on standard patterns, verification needed
            const response = await auctionAPI.getMyAuctions();
            setMyAuctions(response.data.data || []);
        } catch (error) {
            console.error("Failed to fetch auctions", error);
            // Optionally toast.error("Không thể tải lịch sử đấu giá");
        } finally {
            setLoadingAuctions(false);
        }
    };

    const fetchWalletInfo = async () => {
        setLoadingWallet(true);
        try {

            const [balanceResponse, transactionsResponse] = await Promise.all([
                walletApi.getWalletBalance(),
                walletApi.getTransactionHistory({}, 1, 5)
            ]);



            if (balanceResponse.success) {
                setWalletInfo(balanceResponse.data);
            } else {
                console.error('❌ Balance fetch failed:', balanceResponse.message);
                toast.error(balanceResponse.message || 'Không thể tải số dư ví');
            }
            if (transactionsResponse.success) {
                setWalletTransactions(transactionsResponse.data.transactions);
            } else {
                console.error('❌ Transactions fetch failed:', transactionsResponse.message);
            }
        } catch (error) {
            console.error("❌ Failed to fetch wallet info", error);
            console.error("Error response:", error.response?.data);
            console.error("Error status:", error.response?.status);
            toast.error(error.response?.data?.message || error.message || 'Không thể tải thông tin ví');
        } finally {
            setLoadingWallet(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);


        try {
            // Exclude email/username if they are immutable in backend
            const { email, ...updatePayload } = formData;


            const response = await authAPI.updateProfile(updatePayload);


            // Refresh user data in context
            await refreshProfile();

            toast.success("Cập nhật thông tin thành công!");
            // Optionally refresh user data here
        } catch (error) {
            console.error("❌ Update error:", error);
            toast.error(error.response?.data?.message || "Cập nhật thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("Mật khẩu mới không khớp!");
            return;
        }
        if (passwordData.newPassword.length < 6) {
            toast.error("Mật khẩu phải có ít nhất 6 ký tự");
            return;
        }

        setIsLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Đổi mật khẩu thành công!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    if (!user) return null; // Or loading spinner

    return (
        <div className="w-full min-h-screen bg-[#f8f7f5] text-[#1c130d] px-4 md:px-8 py-6">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm max-w-[1920px] mx-auto">
                <Link to="/" className="text-gray-500 hover:text-orange-600">Trang chủ</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-bold">Hồ sơ của bạn</span>
            </div>

            {/* Page Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1920px] mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-gray-900">Hồ sơ của bạn</h1>
                    <p className="text-gray-500 text-base">Quản lý thông tin cá nhân, bảo mật và xem lại lịch sử đấu giá.</p>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Sidebar */}
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center relative overflow-hidden">
                            <div className="relative inline-block group">
                                <div className="w-32 h-32 mx-auto rounded-full bg-gray-100 mb-4 bg-cover bg-center border-4 border-white shadow-md flex items-center justify-center text-4xl font-bold text-gray-400">
                                    {/* Placeholder Avatar if no image */}
                                    {user.username?.charAt(0).toUpperCase()}
                                </div>
                                <button className="absolute bottom-4 right-0 bg-[#f26c0d] hover:bg-[#d55a0b] text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105" title="Thay đổi ảnh đại diện">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900">{user.fullName || user.username}</h2>
                            <p className="text-sm text-gray-500 mb-4">Thành viên từ {new Date().getFullYear()} • Việt Nam</p>

                            {/* Mini Stats */}
                            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 mt-4">
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-slate-900">{user.auctionsParticipated || 0}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Đấu giá</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-lg font-bold text-[#f26c0d]">{user.auctionsWon || 0}</span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide">Thắng</span>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Links */}
                        <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="flex flex-col">
                                <button
                                    onClick={() => setActiveTab('general')}
                                    className={`flex items-center gap-3 px-5 py-4 transition-colors text-left ${activeTab === 'general' ? 'bg-[#f26c0d]/10 border-l-4 border-[#f26c0d] text-[#f26c0d] font-medium' : 'text-slate-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <User size={20} />
                                    Thông tin chung
                                </button>
                                <button
                                    onClick={() => setActiveTab('security')}
                                    className={`flex items-center gap-3 px-5 py-4 transition-colors text-left ${activeTab === 'security' ? 'bg-[#f26c0d]/10 border-l-4 border-[#f26c0d] text-[#f26c0d] font-medium' : 'text-slate-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <Lock size={20} />
                                    Bảo mật & Mật khẩu
                                </button>
                                <button
                                    onClick={() => setActiveTab('wallet')}
                                    className={`flex items-center gap-3 px-5 py-4 transition-colors text-left ${activeTab === 'wallet' ? 'bg-[#f26c0d]/10 border-l-4 border-[#f26c0d] text-[#f26c0d] font-medium' : 'text-slate-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <Wallet size={20} />
                                    Ví của tôi
                                </button>
                                <button
                                    onClick={() => setActiveTab('orders')}
                                    className={`flex items-center gap-3 px-5 py-4 transition-colors text-left ${activeTab === 'orders' ? 'bg-[#f26c0d]/10 border-l-4 border-[#f26c0d] text-[#f26c0d] font-medium' : 'text-slate-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
                                >
                                    <ShoppingBag size={20} />
                                    Đơn hàng của tôi
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-3 px-5 py-4 text-slate-600 hover:bg-gray-50 border-l-4 border-transparent transition-colors border-t border-gray-100 w-full text-left"
                                >
                                    <LogOut size={20} />
                                    Đăng xuất
                                </button>
                            </div>
                        </nav>
                    </aside>

                    {/* Right Content Area */}
                    <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                        {/* Section 1: General Info */}
                        {activeTab === 'general' && (
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Thông tin cá nhân
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
                                            <div className="relative">
                                                <input
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] text-slate-900 shadow-sm px-4 py-3"
                                                    type="text"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                                            <div className="relative">
                                                <input
                                                    name="email" // Read-only usually
                                                    value={formData.email}
                                                    disabled
                                                    className="w-full rounded-lg border-gray-200 bg-gray-50 text-slate-500 shadow-sm px-4 py-3 cursor-not-allowed"
                                                    type="email"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
                                            <div className="relative">
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] text-slate-900 shadow-sm px-4 py-3"
                                                    type="tel"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Ngày sinh</label>
                                            <div className="relative">
                                                <input
                                                    name="dob"
                                                    value={formData.dob}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] text-slate-900 shadow-sm px-4 py-3"
                                                    type="date"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ nhận hàng</label>
                                            <div className="relative">
                                                <textarea
                                                    name="address"
                                                    value={formData.address}
                                                    onChange={handleInputChange}
                                                    className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] text-slate-900 shadow-sm resize-none px-4 py-3"
                                                    rows="2"
                                                ></textarea>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex justify-end gap-3 mt-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    fullName: user.fullName || '',
                                                    email: user.email || '',
                                                    phone: user.phone || '',
                                                    address: user.address || '',
                                                    dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
                                                })}
                                                className="px-4 py-2 text-sm font-medium text-slate-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                            >
                                                Hủy
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className="px-6 py-2 text-sm font-medium text-white bg-[#f26c0d] hover:bg-[#d55a0b] rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-70 flex items-center gap-2"
                                            >
                                                {isLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                                                Lưu thay đổi
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </section>
                        )}

                        {/* Section 2: Security */}
                        {activeTab === 'security' && (
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Bảo mật
                                    </h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {/* Password Change */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-gray-100">
                                        <div className="col-span-2">
                                            <h4 className="text-base font-semibold text-slate-900 mb-1">Đổi mật khẩu</h4>
                                            <p className="text-sm text-gray-500">Nên sử dụng mật khẩu mạnh để bảo vệ tài khoản.</p>
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                                            <input
                                                type="password"
                                                name="currentPassword"
                                                value={passwordData.currentPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] shadow-sm py-3 px-4"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                                            <input
                                                type="password"
                                                name="newPassword"
                                                value={passwordData.newPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] shadow-sm py-3 px-4"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="col-span-2 md:col-span-1">
                                            <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu</label>
                                            <input
                                                type="password"
                                                name="confirmPassword"
                                                value={passwordData.confirmPassword}
                                                onChange={handlePasswordChange}
                                                className="w-full rounded-lg border-gray-200 focus:border-[#f26c0d] focus:ring-[#f26c0d] shadow-sm py-3 px-4"
                                                placeholder="••••••••"
                                            />
                                        </div>
                                        <div className="col-span-2 flex justify-end">
                                            <button
                                                onClick={handleChangePassword}
                                                disabled={isLoading}
                                                className="px-4 py-2 text-sm font-medium text-[#f26c0d] border border-[#f26c0d] hover:bg-[#f26c0d]/5 rounded-lg transition-colors disabled:opacity-50"
                                            >
                                                {isLoading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* 2FA (Mockup mostly) */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 opacity-70 pointer-events-none">
                                        <div>
                                            <h4 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                                                Xác thực 2 bước (2FA)
                                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">Sắp ra mắt</span>
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">Tăng cường bảo mật bằng mã xác nhận qua tin nhắn hoặc ứng dụng.</p>
                                        </div>
                                        {/* Toggle Switch */}
                                        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                            <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer border-[#f26c0d] checked:border-[#f26c0d] transition-all duration-300" />
                                            <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-[#f26c0d]/30 cursor-pointer transition-colors duration-300"></label>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Section 3: Wallet */}
                        {activeTab === 'wallet' && (
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Ví của tôi
                                    </h3>
                                </div>
                                <div className="p-6 space-y-6">
                                    {loadingWallet ? (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f26c0d]"></div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Balance Cards */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-green-100 rounded-lg">
                                                            <Wallet className="text-green-600" size={20} />
                                                        </div>
                                                        <span className="text-sm font-medium text-green-900">Số dư khả dụng</span>
                                                    </div>
                                                    <p className="text-3xl font-bold text-green-900">
                                                        {walletInfo ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletInfo.balance) : '0 ₫'}
                                                    </p>
                                                </div>
                                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-100">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="p-2 bg-orange-100 rounded-lg">
                                                            <Lock className="text-orange-600" size={20} />
                                                        </div>
                                                        <span className="text-sm font-medium text-orange-900">Số tiền tạm giữ</span>
                                                    </div>
                                                    <p className="text-3xl font-bold text-orange-900">
                                                        {walletInfo ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletInfo.frozenFunds) : '0 ₫'}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Quick Actions */}
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => navigate('/wallet')}
                                                    className="flex-1 px-4 py-3 bg-[#f26c0d] hover:bg-[#d55a0b] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Wallet size={18} />
                                                    Xem chi tiết ví
                                                </button>
                                            </div>

                                            {/* Recent Transactions */}
                                            <div>
                                                <h4 className="text-base font-semibold text-slate-900 mb-3">Giao dịch gần đây</h4>
                                                {walletTransactions.length === 0 ? (
                                                    <p className="text-center text-gray-500 py-8">Chưa có giao dịch nào</p>
                                                ) : (
                                                    <div className="space-y-2">
                                                        {walletTransactions.map((transaction) => {
                                                            const isPositive = ['deposit', 'bid_refund', 'seller_payout'].includes(transaction.type);
                                                            return (
                                                                <div key={transaction._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-100' : 'bg-gray-200'}`}>
                                                                            <Wallet className={isPositive ? 'text-green-600' : 'text-gray-600'} size={16} />
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-medium text-slate-900">
                                                                                {transaction.type === 'deposit' ? 'Nạp tiền' :
                                                                                    transaction.type === 'withdraw' ? 'Rút tiền' :
                                                                                        transaction.type === 'bid_deposit' ? 'Đặt cọc' :
                                                                                            transaction.type === 'bid_refund' ? 'Hoàn cọc' :
                                                                                                transaction.type === 'auction_payment' ? 'Thanh toán' : 'Giao dịch'}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500">
                                                                                {new Date(transaction.createdAt).toLocaleString('vi-VN')}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                    <p className={`text-sm font-bold ${isPositive ? 'text-green-600' : 'text-gray-900'}`}>
                                                                        {isPositive ? '+' : '-'}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount)}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>
                        )}

                        {/* Section 5: Orders */}
                        {activeTab === 'orders' && (
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Đơn hàng của tôi
                                    </h3>
                                </div>
                                <div className="p-6">
                                    <OrderListPage isEmbedded={true} />
                                </div>
                            </section>
                        )}

                        {/* Section 4: Auction History */}
                        {activeTab === 'history' && (
                            <section className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in">
                                <div className="p-6 border-b border-gray-100 flex flex-wrap justify-between items-center gap-4">
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Lịch sử đấu giá
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <select className="text-sm border-gray-200 rounded-lg focus:ring-[#f26c0d] focus:border-[#f26c0d] py-1.5">
                                            <option>Tất cả trạng thái</option>
                                            <option>Chiến thắng</option>
                                            <option>Thất bại</option>
                                            <option>Đang diễn ra</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 font-medium">Sản phẩm</th>
                                                <th scope="col" className="px-6 py-3 font-medium">Ngày đấu</th>
                                                <th scope="col" className="px-6 py-3 font-medium">Giá chốt</th>
                                                <th scope="col" className="px-6 py-3 font-medium text-center">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {loadingAuctions ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Đang tải...</td>
                                                </tr>
                                            ) : myAuctions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Chưa có lịch sử đấu giá nào</td>
                                                </tr>
                                            ) : (
                                                myAuctions.map(item => (
                                                    <tr key={item._id} className="bg-white hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden">
                                                                    {item.image ? (
                                                                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400">
                                                                            <Gavel size={16} />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="font-semibold text-slate-900 line-clamp-1">{item.title || "Sản phẩm ẩn"}</p>
                                                                    <p className="text-xs text-gray-500">Mã: #{item._id.slice(-6).toUpperCase()}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-gray-600">
                                                            {new Date(item.createdAt).toLocaleDateString('vi-VN')}
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-slate-900">
                                                            {item.finalPrice?.toLocaleString('vi-VN') || 0} đ
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'won' ? 'bg-green-100 text-green-800' :
                                                                item.status === 'lost' ? 'bg-gray-100 text-gray-600' :
                                                                    'bg-orange-100 text-orange-800 border border-orange-200'
                                                                }`}>
                                                                {item.status === 'won' && <Trophy size={14} />}
                                                                {item.status === 'lost' && <X size={14} />}
                                                                {item.status === 'active' && <Gavel size={14} className="animate-pulse" />}

                                                                {item.status === 'won' ? 'Thắng' :
                                                                    item.status === 'lost' ? 'Thua' : 'Đang đấu'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-center">
                                    <button className="text-sm font-medium text-[#f26c0d] hover:text-[#d55a0b] transition-colors flex items-center gap-1">
                                        Xem tất cả lịch sử
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;
