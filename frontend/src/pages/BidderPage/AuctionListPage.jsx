import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionAPI } from '../../services/api';
import AuctionCard from '../../components/auction/AuctionCard/AuctionCard';

const AuctionListPage = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: ['active', 'pending', 'ended'],
        category: 'all',
        minPrice: 0,
        maxPrice: 10000000000,
        sortBy: 'ending_soon',
        page: 1,
        limit: 12
    });
    const [totalAuctions, setTotalAuctions] = useState(0);

    const categories = [
        { id: 'all', label: 'Tất cả sản phẩm', icon: 'grid_view' },
        { id: 'electronics', label: 'Đồ điện tử', icon: 'devices' },
        { id: 'real-estate', label: 'Bất động sản', icon: 'house' },
        { id: 'vehicles', label: 'Phương tiện', icon: 'directions_car' },
        { id: 'art', label: 'Trang sức & Art', icon: 'diamond' },
    ];

    useEffect(() => {
        fetchAuctions();
    }, [filters]);

    const fetchAuctions = async () => {
        setLoading(true);
        try {
            const params = {
                page: filters.page,
                limit: filters.limit,
            };

            if (filters.category !== 'all') {
                params.category = filters.category;
            }

            if (filters.status.length === 1) {
                params.status = filters.status[0];
            }

            const response = await auctionAPI.getAuctions(params);
            setAuctions(response.data?.data?.auctions || []);
            setTotalAuctions(response.data?.data?.total || 0);

        } catch (error) {
            console.error('Error fetching auctions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (status) => {
        setFilters(prev => {
            const newStatuses = prev.status.includes(status)
                ? prev.status.filter(s => s !== status)
                : [...prev.status, status];
            return { ...prev, status: newStatuses, page: 1 };
        });
    };

    const handleCategoryChange = (catId) => {
        setFilters(prev => ({ ...prev, category: catId, page: 1 }));
    };

    const handleSortChange = (e) => {
        setFilters(prev => ({ ...prev, sortBy: e.target.value, page: 1 }));
    };

    const handlePriceChange = (e) => {
        setFilters(prev => ({ ...prev, maxPrice: Number(e.target.value), page: 1 }));
    };

    const formatPrice = (price) => {
        return price?.toLocaleString('vi-VN') + ' đ';
    };

    return (
        <div className="w-full min-h-screen bg-[#f8f7f5] text-[#1c130d] px-4 md:px-8 py-6">
            {/* Breadcrumbs */}
            <div className="flex flex-wrap items-center gap-2 mb-4 text-sm max-w-[1920px] mx-auto">
                <Link to="/" className="text-gray-500 hover:text-orange-600">Trang chủ</Link>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-bold">Tất cả sản phẩm đấu giá</span>
            </div>

            {/* Page Heading */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 max-w-[1920px] mx-auto">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-black leading-tight tracking-tight text-gray-900">Danh Sách Sản Phẩm</h1>
                    <p className="text-gray-500 text-base">Khám phá và tham gia đấu giá các sản phẩm đang diễn ra và sắp tới.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 max-w-[1920px] mx-auto">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 shrink-0">
                    <div className="sticky top-24 flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                        <div>
                            <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-gray-900">
                                <span className="material-symbols-outlined">filter_list</span>
                                Bộ lọc nâng cao
                            </h3>
                            <div className="space-y-6">
                                {/* Status Filter */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Trạng thái</p>
                                    <div className="flex flex-col gap-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-5 w-5"
                                                checked={filters.status.includes('active')}
                                                onChange={() => handleStatusChange('active')}
                                            />
                                            <span className="text-sm group-hover:text-orange-600 text-gray-700">Đang diễn ra</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-5 w-5"
                                                checked={filters.status.includes('pending')}
                                                onChange={() => handleStatusChange('pending')}
                                            />
                                            <span className="text-sm group-hover:text-orange-600 text-gray-700">Sắp bắt đầu</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="rounded border-gray-300 text-orange-600 focus:ring-orange-600 h-5 w-5"
                                                checked={filters.status.includes('ended')}
                                                onChange={() => handleStatusChange('ended')}
                                            />
                                            <span className="text-sm group-hover:text-orange-600 text-gray-700">Đã kết thúc</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Categories Filter */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Danh mục</p>
                                    <div className="flex flex-col gap-1">
                                        {categories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => handleCategoryChange(cat.id)}
                                                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors w-full text-left ${filters.category === cat.id
                                                    ? 'bg-orange-50 text-orange-600 font-bold'
                                                    : 'hover:bg-gray-100 text-gray-700'
                                                    }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">{cat.icon}</span>
                                                {cat.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Price Range */}
                                <div className="space-y-3">
                                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Khoảng giá (VNĐ)</p>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10000000000"
                                            step="1000000"
                                            value={filters.maxPrice}
                                            onChange={handlePriceChange}
                                            className="w-full accent-orange-600"
                                        />
                                        <div className="flex justify-between text-xs font-medium text-gray-700">
                                            <span>0</span>
                                            <span>{formatPrice(filters.maxPrice)}</span>
                                        </div>
                                    </div>
                                </div>

                                <button className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-all shadow-md shadow-orange-200">
                                    Áp dụng bộ lọc
                                </button>
                                <button
                                    onClick={() => setFilters({ status: ['active', 'pending'], category: 'all', minPrice: 0, maxPrice: 1000000000, sortBy: 'ending_soon', page: 1, limit: 12 })}
                                    className="w-full py-2 text-sm font-medium text-gray-500 hover:text-orange-600 transition-colors"
                                >
                                    Xóa tất cả bộ lọc
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Product Grid Area */}
                <div className="flex-1 min-w-0"> {/* min-w-0 is crucial for grid/flex containment */}
                    {/* Grid Header / Sorting */}
                    <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-sm font-medium text-gray-700">
                            Hiển thị <span className="font-bold">{auctions.length}</span> trên <span className="font-bold">{totalAuctions}</span> sản phẩm
                        </p>
                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                <span className="hidden sm:inline">Sắp xếp theo:</span>
                                <select
                                    className="rounded-lg border-gray-200 bg-white text-sm focus:ring-orange-600 py-1.5 pr-8 text-gray-700"
                                    value={filters.sortBy}
                                    onChange={handleSortChange}
                                >
                                    <option value="ending_soon">Kết thúc sớm nhất</option>
                                    <option value="price_asc">Giá: Thấp đến Cao</option>
                                    <option value="price_desc">Giá: Cao đến Thấp</option>
                                    <option value="newest">Mới nhất</option>
                                </select>
                            </label>
                            <div className="flex gap-1 border-l border-gray-200 pl-4">
                                <button className="p-1.5 rounded bg-orange-50 text-orange-600">
                                    <span className="material-symbols-outlined text-lg">grid_view</span>
                                </button>
                                <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500">
                                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
                        {loading ? (
                            [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="animate-pulse bg-gray-200 h-[380px] rounded-xl"></div>
                            ))
                        ) : auctions.length > 0 ? (
                            auctions.map(auction => (
                                <AuctionCard key={auction.id} auction={auction} />
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
                                <p className="mt-4 text-gray-500 font-medium">Không tìm thấy sản phẩm nào</p>
                                <button
                                    onClick={() => setFilters({ status: ['active', 'pending'], category: 'all', minPrice: 0, maxPrice: 1000000000, sortBy: 'ending_soon', page: 1, limit: 12 })}
                                    className="mt-4 text-orange-600 font-bold hover:underline"
                                >
                                    Xóa bộ lọc
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalAuctions > filters.limit && (
                        <div className="mt-12 flex items-center justify-center gap-2">
                            <button
                                onClick={() => setFilters(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                                disabled={filters.page === 1}
                                className="flex items-center justify-center rounded-lg h-10 w-10 border border-gray-200 hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50 text-gray-600"
                            >
                                <span className="material-symbols-outlined">chevron_left</span>
                            </button>

                            {/* Simplified pagination logic for visual */}
                            <span className="text-gray-600 font-bold">Page {filters.page}</span>

                            <button
                                onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))}
                                disabled={filters.page >= Math.ceil(totalAuctions / filters.limit)}
                                className="flex items-center justify-center rounded-lg h-10 w-10 border border-gray-200 hover:bg-orange-600 hover:text-white transition-colors disabled:opacity-50 text-gray-600"
                            >
                                <span className="material-symbols-outlined">chevron_right</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuctionListPage;
