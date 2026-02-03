import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI, auctionAPI } from '../../services/api';
import { toast } from 'react-toastify';
import {
    User,
    Lock,
    Camera,
    LogOut,
    ChevronRight,
    Wallet,
    Package,
    ShoppingBag
} from 'lucide-react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import walletApi from '../../services/walletApi';
import OrderListPage from '../OrderPage/OrderListPage';

const SellerProfilePage = () => {
    const { user, logout, refreshProfile } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'general');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        address: '',
        dob: ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [auctionStats, setAuctionStats] = useState({
        total: 0
    });

    const [walletInfo, setWalletInfo] = useState(null);
    const [walletTransactions, setWalletTransactions] = useState([]);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ''
            });
            fetchSellerStats();
        }
    }, [user]);

    useEffect(() => {
        if (activeTab === 'wallet') {
            fetchWalletInfo();
        }
    }, [activeTab]);

    const fetchWalletInfo = async () => {
        setLoadingWallet(true);
        try {
            const [balanceResponse, transactionsResponse] = await Promise.all([
                walletApi.getWalletBalance(),
                walletApi.getTransactionHistory({}, 1, 5)
            ]);

            if (balanceResponse.success) {
                setWalletInfo(balanceResponse.data);
            }
            if (transactionsResponse.success) {
                setWalletTransactions(transactionsResponse.data.transactions);
            }
        } catch (error) {
            console.error("Failed to fetch wallet info", error);
        } finally {
            setLoadingWallet(false);
        }
    };

    const fetchSellerStats = async () => {
        setLoadingStats(true);
        try {
            const response = await auctionAPI.getMyAuctions({ limit: 1 });
            setAuctionStats({
                total: response.data.data.pagination.totalItems || 0
            });
        } catch (error) {
            console.error("Failed to fetch seller stats", error);
        } finally {
            setLoadingStats(false);
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
            const { email, ...updatePayload } = formData;
            await authAPI.updateProfile(updatePayload);
            await refreshProfile();
            toast.success("Cập nhật thông tin thành công!");
        } catch (error) {
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
        setIsLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            toast.success("Đổi mật khẩu thành công!");
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return null;

    return (
        <div className="w-full min-h-screen bg-[#f8f7f5] text-[#1c130d] px-4 md:px-8 py-6">
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm max-w-[1920px] mx-auto">
                <Link to="/" className="text-gray-500 hover:text-orange-600">Trang chủ</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-bold">Hồ sơ Seller</span>
            </div>

            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1920px] mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-gray-900">Hồ sơ người bán</h1>
                    <p className="text-gray-500 text-base">Quản lý cửa hàng và thông tin cá nhân của bạn.</p>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
                        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm text-center">
                            <div className="relative inline-block group">
                                <div className="w-32 h-32 mx-auto rounded-full bg-orange-100 mb-4 flex items-center justify-center text-4xl font-bold text-orange-500 border-4 border-white shadow-md">
                                    {user.fullName?.charAt(0).toUpperCase() || 'S'}
                                </div>
                                <button className="absolute bottom-4 right-0 bg-orange-500 text-white p-2 rounded-full shadow-lg">
                                    <Camera size={18} />
                                </button>
                            </div>
                            <h2 className="text-xl font-bold">{user.fullName}</h2>
                            <p className="text-sm text-gray-500 mb-4">Seller Account</p>

                            <div className="border-t border-gray-100 pt-4 mt-4">
                                <div className="text-center">
                                    <span className="block text-2xl font-bold text-orange-600">
                                        {loadingStats ? '...' : auctionStats.total}
                                    </span>
                                    <span className="text-xs text-gray-500 uppercase tracking-wide font-bold">Sản phẩm đã tạo</span>
                                </div>
                            </div>
                        </div>

                        <nav className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-5 py-4 text-left ${activeTab === 'general' ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <User size={20} /> Thông tin chung
                            </button>
                            <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-5 py-4 text-left ${activeTab === 'security' ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Lock size={20} /> Bảo mật
                            </button>
                            <button onClick={() => setActiveTab('wallet')} className={`w-full flex items-center gap-3 px-5 py-4 text-left ${activeTab === 'wallet' ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <Wallet size={20} /> Ví của tôi
                            </button>
                            <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-5 py-4 text-left ${activeTab === 'orders' ? 'bg-orange-50 border-l-4 border-orange-500 text-orange-600 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>
                                <ShoppingBag size={20} /> Đơn hàng của tôi
                            </button>
                            <button onClick={() => navigate('/my-auctions')} className="w-full flex items-center gap-3 px-5 py-4 text-gray-600 hover:bg-gray-50 text-left">
                                <Package size={20} /> Quản lý sản phẩm
                            </button>
                            <button onClick={() => logout()} className="w-full flex items-center gap-3 px-5 py-4 text-red-600 hover:bg-red-50 text-left border-t border-gray-100 font-medium">
                                <LogOut size={20} /> Đăng xuất
                            </button>
                        </nav>
                    </aside>

                    <div className="lg:col-span-8 xl:col-span-9">
                        {activeTab === 'general' && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                                <h3 className="text-xl font-bold mb-6">Thông tin cá nhân</h3>
                                <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Họ và tên</label>
                                        <input name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-orange-500" type="text" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                        <input value={formData.email} disabled className="w-full rounded-lg border-gray-200 bg-gray-50 px-4 py-3 text-gray-500" type="email" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                                        <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-orange-500" type="tel" />
                                    </div>
                                    <div className="col-span-2 md:col-span-1">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Ngày sinh</label>
                                        <input name="dob" value={formData.dob} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-orange-500" type="date" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ cửa hàng/kho</label>
                                        <textarea name="address" value={formData.address} onChange={handleInputChange} className="w-full rounded-lg border-gray-200 px-4 py-3 focus:border-orange-500 focus:ring-orange-500" rows="3"></textarea>
                                    </div>
                                    <div className="col-span-2 flex justify-end">
                                        <button type="submit" disabled={isLoading} className="bg-orange-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-600 transition-all flex items-center gap-2">
                                            {isLoading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                                <h3 className="text-xl font-bold mb-6">Bảo mật tài khoản</h3>
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu hiện tại</label>
                                            <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className="w-full rounded-lg border-gray-200 px-4 py-3" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Mật khẩu mới</label>
                                            <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className="w-full rounded-lg border-gray-200 px-4 py-3" placeholder="••••••••" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2">Xác nhận mật khẩu</label>
                                            <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className="w-full rounded-lg border-gray-200 px-4 py-3" placeholder="••••••••" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end">
                                        <button onClick={handleChangePassword} className="border border-orange-500 text-orange-500 px-6 py-2 rounded-lg font-bold hover:bg-orange-50 transition-all">
                                            Đổi mật khẩu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'wallet' && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                                <h3 className="text-xl font-bold mb-6">Ví người bán</h3>
                                {loadingWallet ? (
                                    <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
                                ) : (
                                    <div className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                                                <p className="text-sm font-bold text-orange-600 mb-2 uppercase tracking-wider">Số dư khả dụng</p>
                                                <p className="text-3xl font-black text-gray-900">{walletInfo ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletInfo.balance) : '0 ₫'}</p>
                                            </div>
                                            <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                                                <p className="text-sm font-bold text-gray-600 mb-2 uppercase tracking-wider">Số tiền tạm giữ</p>
                                                <p className="text-3xl font-black text-gray-900">{walletInfo ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(walletInfo.frozenFunds) : '0 ₫'}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => navigate('/wallet')} className="w-full py-4 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all flex items-center justify-center gap-2">
                                            <Wallet size={20} /> Quản lý tài chính & Rút tiền
                                        </button>

                                        <div>
                                            <h4 className="font-bold mb-4">Giao dịch gần đây</h4>
                                            <div className="space-y-3">
                                                {walletTransactions.map(t => (
                                                    <div key={t._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <p className="font-bold text-sm">
                                                                {t.type === 'seller_payout' ? 'Nhận tiền từ đấu giá' : t.type === 'withdraw' ? 'Rút tiền' : 'Giao dịch'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">{new Date(t.createdAt).toLocaleString('vi-VN')}</p>
                                                        </div>
                                                        <p className={`font-bold ${['seller_payout'].includes(t.type) ? 'text-green-600' : 'text-gray-900'}`}>
                                                            {['seller_payout'].includes(t.type) ? '+' : '-'}{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(t.amount)}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 animate-fade-in">
                                <h3 className="text-xl font-bold mb-6">Đơn bán hàng</h3>
                                <OrderListPage isEmbedded={true} initialTab="selling" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SellerProfilePage;
