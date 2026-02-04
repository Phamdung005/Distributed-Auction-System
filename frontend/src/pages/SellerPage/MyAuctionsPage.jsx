import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { auctionAPI } from '../../services/api';
import { Plus, Search, Calendar, DollarSign, Eye, Edit, Trash2, Clock, Filter, AlertCircle } from 'lucide-react';

const MyAuctionsPage = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        fetchMyAuctions();
    }, []);

    const fetchMyAuctions = async () => {
        try {
            const response = await auctionAPI.getMyAuctions({ page: 1, limit: 100 }); // Increase limit or implement pagination
            setAuctions(response.data.data.auctions);
        } catch (error) {
            toast.error('Không thể tải danh sách đấu giá');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAuction = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đấu giá này?')) return;
        try {
            await auctionAPI.deleteAuction(id);
            // toast.success('Xóa đấu giá thành công'); // Removed as notification system handles this
            fetchMyAuctions();
        } catch (error) {
            toast.error('Xóa đấu giá thất bại');
        }
    };

    const filteredAuctions = auctions.filter(auction => {
        const matchesSearch = auction.title.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || auction.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-700 border-green-200';
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'ended': return 'bg-gray-100 text-gray-700 border-gray-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'active': return 'Đang diễn ra';
            case 'pending': return 'Sắp bắt đầu';
            case 'ended': return 'Đã kết thúc';
            default: return status;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans py-8 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-[95%] lg:max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Quản lý Đấu Giá</h1>
                        <p className="text-gray-500 mt-1">
                            {auctions.length} sản phẩm đã đăng
                        </p>
                    </div>
                    <Link
                        to="/create-auction"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#f26c0d] hover:bg-[#e05d00] text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} />
                        Tạo đấu giá mới
                    </Link>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên sản phẩm..."
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-400 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                        <Filter size={18} className="text-gray-400 shrink-0" />
                        {['all', 'pending', 'active', 'ended'].map(status => (
                            <button
                                key={status}
                                onClick={() => setFilterStatus(status)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filterStatus === status
                                    ? 'bg-orange-100 text-orange-700'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                    }`}
                            >
                                {status === 'all' ? 'Tất cả' : getStatusLabel(status)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content */}
                {filteredAuctions.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
                        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle size={40} className="text-orange-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Không tìm thấy đấu giá nào</h3>
                        <p className="text-gray-500 mb-6">Bạn chưa tạo đấu giá nào hoặc không có kết quả phù hợp.</p>
                        {searchTerm || filterStatus !== 'all' ? (
                            <button
                                onClick={() => { setSearchTerm(''); setFilterStatus('all'); }}
                                className="text-[#f26c0d] font-semibold hover:underline"
                            >
                                Xóa bộ lọc
                            </button>
                        ) : (
                            <Link to="/create-auction" className="btn-primary">
                                Tạo đấu giá ngay
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredAuctions.map(auction => (
                            <div key={auction.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
                                {/* Image */}
                                <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                                    <img
                                        src={auction.images?.[0] || 'https://via.placeholder.com/300'}
                                        alt={auction.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute top-3 right-3">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusColor(auction.status)}`}>
                                            {getStatusLabel(auction.status)}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-bold text-gray-800 line-clamp-1 mb-1" title={auction.title}>
                                        {auction.title}
                                    </h3>

                                    <div className="space-y-2 mt-2 text-sm text-gray-600 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-1.5"><DollarSign size={14} /> Khởi điểm:</span>
                                            <span className="font-semibold">{auction.startPrice.toLocaleString('vi-VN')} ₫</span>
                                        </div>
                                        <div className="flex items-center justify-between text-orange-600">
                                            <span className="flex items-center gap-1.5"><DollarSign size={14} /> Hiện tại:</span>
                                            <span className="font-bold">{auction.currentPrice.toLocaleString('vi-VN')} ₫</span>
                                        </div>
                                        <div className="flex items-center justify-between text-gray-500 text-xs mt-2 pt-2 border-t border-gray-50">
                                            <span className="flex items-center gap-1"><Clock size={12} /> Kết thúc:</span>
                                            <span>{format(new Date(auction.endTime), 'dd/MM/yyyy HH:mm', { locale: vi })}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-50">
                                        <Link
                                            to={`/auction/${auction.id}`}
                                            className="col-span-2 flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-50 text-[#f26c0d] font-semibold hover:bg-orange-100 transition-colors text-sm"
                                        >
                                            <Eye size={16} /> Chi tiết
                                        </Link>

                                        {auction.status === 'pending' && (
                                            <>
                                                <Link
                                                    to={`/edit-auction/${auction.id}`}
                                                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-xs"
                                                >
                                                    <Edit size={14} /> Sửa
                                                </Link>
                                                <button
                                                    onClick={() => handleDeleteAuction(auction.id)}
                                                    className="flex items-center justify-center gap-1 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs"
                                                >
                                                    <Trash2 size={14} /> Xóa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyAuctionsPage;
