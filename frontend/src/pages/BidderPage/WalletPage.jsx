import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import walletApi from '../../services/walletApi';
import { toast } from 'react-toastify';

const WalletPage = () => {
    const { user } = useAuth();
    const [walletInfo, setWalletInfo] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const itemsPerPage = 10;

    // Filter state
    const [activeFilter, setActiveFilter] = useState('all');
    const [depositModalOpen, setDepositModalOpen] = useState(false);
    const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
    // Load wallet info
    useEffect(() => {
        loadWalletInfo();
    }, []);

    // Load transactions when filter or page changes
    useEffect(() => {
        loadTransactions();
    }, [activeFilter, currentPage]);

    const loadWalletInfo = async () => {
        try {
            setLoading(true);
            const response = await walletApi.getWalletBalance();
            if (response.success) {
                setWalletInfo(response.data);
            } else {
                setError(response.message);
                toast.error(response.message);
            }
        } catch (err) {
            setError('Không thể tải thông tin ví');
            toast.error('Không thể tải thông tin ví');
        } finally {
            setLoading(false);
        }
    };

    const loadTransactions = async () => {
        try {
            setTransactionsLoading(true);
            const filters = activeFilter !== 'all' ? { type: activeFilter } : {};
            const response = await walletApi.getTransactionHistory(filters, currentPage, itemsPerPage);

            if (response.success) {
                setTransactions(response.data.transactions);
                setTotalPages(response.data.pagination.totalPages);
                setTotalItems(response.data.pagination.totalItems);
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            toast.error('Không thể tải lịch sử giao dịch');
        } finally {
            setTransactionsLoading(false);
        }
    };

    const handleTestDeposit = async () => {
        try {
            setLoading(true);
            const amount = 1000000000; 
            const response = await walletApi.depositFunds(amount, 'wallet', { description: 'Test deposit 1 billion' });

            if (response.success) {
                toast.success('Đã nạp 1 tỷ VND vào tài khoản (Test)');
                await Promise.all([loadWalletInfo(), loadTransactions()]);
            } else {
                toast.error(response.message);
            }
        } catch (err) {
            console.error(err);
            toast.error('Lỗi khi nạp tiền test');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getTransactionTypeLabel = (type) => {
        const typeMap = {
            'deposit': 'Nạp tiền',
            'withdraw': 'Rút tiền',
            'bid_deposit': 'Đặt cọc đấu giá',
            'bid_refund': 'Hoàn cọc',
            'auction_payment': 'Thanh toán đấu giá',
            'seller_payout': 'Nhận tiền bán hàng',
            'platform_fee': 'Phí nền tảng'
        };
        return typeMap[type] || type;
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            'completed': { label: 'Thành công', className: 'bg-green-100 text-green-800' },
            'pending': { label: 'Đang xử lý', className: 'bg-orange-100 text-orange-800' },
            'failed': { label: 'Thất bại', className: 'bg-red-100 text-red-800' },
            'cancelled': { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800' }
        };
        const config = statusConfig[status] || statusConfig['pending'];
        return (
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
                {config.label}
            </span>
        );
    };

    const getAmountColor = (type, amount) => {
        const positiveTypes = ['deposit', 'bid_refund', 'seller_payout'];
        if (positiveTypes.includes(type)) {
            return 'text-green-600';
        }
        return 'text-gray-900';
    };

    const formatAmount = (type, amount) => {
        const positiveTypes = ['deposit', 'bid_refund', 'seller_payout'];
        const prefix = positiveTypes.includes(type) ? '+' : '-';
        return `${prefix}${formatCurrency(amount)}`;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Đang tải...</p>
                </div>
            </div>
        );
    }

    if (error && !walletInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={loadWalletInfo}
                        className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                        Thử lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#f8f7f5] text-[#1c130d] px-4 md:px-8 py-6">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm max-w-[1920px] mx-auto">
                <Link to="/" className="text-gray-500 hover:text-orange-600">Trang chủ</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-bold">Ví của tôi</span>
            </div>

            {/* Page Heading */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1920px] mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-gray-900">Ví của tôi</h1>
                    <p className="text-gray-500 text-base">Quản lý số dư và lịch sử giao dịch an toàn.</p>
                </div>
            </div>

            <div className="max-w-[1920px] mx-auto">
                {/* Stats & Actions Grid */}
                <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
                    {/* Balance Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-2 text-green-700">
                                <span className="material-symbols-outlined">account_balance</span>
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                Số dư khả dụng
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold tracking-tight text-gray-900">
                                {walletInfo ? formatCurrency(walletInfo.balance) : '0 ₫'}
                            </p>
                        </div>
                    </div>

                    {/* Frozen Funds Card */}
                    <div className="flex flex-col justify-between rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-orange-100 p-2 text-orange-700">
                                <span className="material-symbols-outlined">lock</span>
                            </div>
                            <p className="text-sm font-medium text-gray-600">
                                Số tiền tạm giữ
                            </p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold tracking-tight text-gray-900">
                                {walletInfo ? formatCurrency(walletInfo.frozenFunds) : '0 ₫'}
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                <span>Đang chờ kết quả đấu giá</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex flex-col justify-center gap-3 rounded-xl border border-gray-200 p-6 shadow-sm">
                        <button
                            onClick={handleTestDeposit}
                            className="flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 text-sm font-bold text-white shadow-md hover:bg-orange-700 transition-all active:scale-[0.98]"
                        >
                            <span className="material-symbols-outlined">add_card</span>
                            Nạp tiền ngay
                        </button>
                        <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-transparent py-3 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all active:scale-[0.98]">
                            <span className="material-symbols-outlined">payments</span>
                            Rút tiền
                        </button>
                    </div>
                </div>

                {/* Transaction History */}
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <h3 className="text-xl font-bold text-gray-900">
                            Lịch sử giao dịch
                        </h3>

                        {/* Filters */}
                        <div className="flex gap-2 rounded-lg bg-gray-100 p-1">
                            <button
                                onClick={() => handleFilterChange('all')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeFilter === 'all'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                                    }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => handleFilterChange('deposit')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeFilter === 'deposit'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                                    }`}
                            >
                                Nạp tiền
                            </button>
                            <button
                                onClick={() => handleFilterChange('auction_payment')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeFilter === 'auction_payment'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                                    }`}
                            >
                                Thanh toán
                            </button>
                            <button
                                onClick={() => handleFilterChange('bid_refund')}
                                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${activeFilter === 'bid_refund'
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-orange-600'
                                    }`}
                            >
                                Hoàn tiền
                            </button>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                        {transactionsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            </div>
                        ) : transactions.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-gray-600">Không có giao dịch nào</p>
                            </div>
                        ) : (
                            <table className="w-full min-w-[640px] text-left">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Mã giao dịch
                                        </th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Nội dung
                                        </th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Ngày giờ
                                        </th>
                                        <th className="p-4 text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Trạng thái
                                        </th>
                                        <th className="p-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-600">
                                            Số tiền
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {transactions.map((transaction) => (
                                        <tr
                                            key={transaction._id}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="whitespace-nowrap p-4 text-sm font-medium text-gray-900">
                                                {transaction._id.slice(-8).toUpperCase()}
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {getTransactionTypeLabel(transaction.type)}
                                                    </span>
                                                    {transaction.description && (
                                                        <span className="text-xs text-gray-600">
                                                            {transaction.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap p-4 text-sm text-gray-600">
                                                {formatDate(transaction.createdAt)}
                                            </td>
                                            <td className="p-4">
                                                {getStatusBadge(transaction.status)}
                                            </td>
                                            <td className={`whitespace-nowrap p-4 text-right text-sm font-bold ${getAmountColor(transaction.type, transaction.amount)}`}>
                                                {formatAmount(transaction.type, transaction.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Pagination */}
                    {!transactionsLoading && transactions.length > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                            <p className="text-sm text-gray-600">
                                Hiển thị{' '}
                                <span className="font-medium text-gray-900">
                                    {(currentPage - 1) * itemsPerPage + 1}
                                </span>{' '}
                                đến{' '}
                                <span className="font-medium text-gray-900">
                                    {Math.min(currentPage * itemsPerPage, totalItems)}
                                </span>{' '}
                                trong số{' '}
                                <span className="font-medium text-gray-900">
                                    {totalItems}
                                </span>{' '}
                                giao dịch
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Trước
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Links */}
                <div className="mt-8 flex justify-center gap-6 text-sm text-gray-600">
                    <a href="#" className="hover:underline">Chính sách bảo mật</a>
                    <a href="#" className="hover:underline">Điều khoản sử dụng</a>
                    <a href="#" className="hover:underline">Hỗ trợ khách hàng</a>
                </div>
            </div>
        </div>
    );
};

export default WalletPage;
