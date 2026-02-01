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
        maxPrice: 100000000000, // 100 tỷ VNĐ
        sortBy: 'ending_soon',
        page: 1,
        limit: 12
    });
    const [totalAuctions, setTotalAuctions] = useState(0);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
    const [dynamicMaxPrice, setDynamicMaxPrice] = useState(100000000000); // Dynamic based on data

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

    // Sync maxPrice filter with dynamicMaxPrice khi có data mới
    useEffect(() => {
        if (filters.maxPrice === 100000000000 || filters.maxPrice > dynamicMaxPrice) {
            setFilters(prev => ({ ...prev, maxPrice: dynamicMaxPrice }));
        }
    }, [dynamicMaxPrice]);

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

            // Send multiple statuses as comma-separated string or array
            if (filters.status.length > 0 && filters.status.length < 3) {
                params.status = filters.status.join(',');
            }

            // Add price range
            if (filters.minPrice > 0) {
                params.minPrice = filters.minPrice;
            }
            if (filters.maxPrice < dynamicMaxPrice) {
                params.maxPrice = filters.maxPrice;
            }

            // Add sort
            if (filters.sortBy) {
                params.sortBy = filters.sortBy;
            }

            const response = await auctionAPI.getAuctions(params);
            let fetchedAuctions = response.data?.data?.auctions || [];

            // Calculate dynamic max price từ TOÀN BỘ auctions (trước khi filter)
            if (fetchedAuctions.length > 0) {
                const maxPriceInData = Math.max(
                    ...fetchedAuctions.map(a => a.currentPrice || a.startPrice || 0)
                );
                // Round up to nearest 10 million for cleaner slider
                const roundedMax = Math.ceil(maxPriceInData / 10000000) * 10000000;
                setDynamicMaxPrice(Math.max(roundedMax, 100000000)); // Minimum 100M
            }

            // Client-side filtering for status if multiple selected
            if (filters.status.length > 0 && filters.status.length < 3) {
                fetchedAuctions = fetchedAuctions.filter(auction =>
                    filters.status.includes(auction.status)
                );
            }

            // Client-side price filtering
            fetchedAuctions = fetchedAuctions.filter(auction => {
                const price = auction.currentPrice || auction.startPrice;
                return price >= filters.minPrice && price <= filters.maxPrice;
            });

            // Client-side sorting
            if (filters.sortBy === 'price_asc') {
                fetchedAuctions.sort((a, b) => (a.currentPrice || a.startPrice) - (b.currentPrice || b.startPrice));
            } else if (filters.sortBy === 'price_desc') {
                fetchedAuctions.sort((a, b) => (b.currentPrice || b.startPrice) - (a.currentPrice || a.startPrice));
            } else if (filters.sortBy === 'ending_soon') {
                fetchedAuctions.sort((a, b) => new Date(a.endTime) - new Date(b.endTime));
            } else if (filters.sortBy === 'newest') {
                fetchedAuctions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            }

            setAuctions(fetchedAuctions);
            setTotalAuctions(response.data?.data?.total || fetchedAuctions.length);

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
                                            max={dynamicMaxPrice}
                                            step="10000000"
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

                                <button
                                    onClick={() => setFilters({ status: ['active', 'pending'], category: 'all', minPrice: 0, maxPrice: dynamicMaxPrice, sortBy: 'ending_soon', page: 1, limit: 12 })}
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
                            Hiển thị <span className="font-bold">{Math.min((filters.page - 1) * filters.limit + 1, totalAuctions)}-{Math.min(filters.page * filters.limit, totalAuctions)}</span> trên <span className="font-bold">{totalAuctions}</span> sản phẩm
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
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">grid_view</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-100 text-gray-500'}`}
                                >
                                    <span className="material-symbols-outlined text-lg">format_list_bulleted</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid/List */}
                    <div className={viewMode === 'grid'
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                        : "flex flex-col gap-4"
                    }>
                        {loading ? (
                            [1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="animate-pulse bg-gray-200 h-[380px] rounded-xl"></div>
                            ))
                        ) : auctions.length > 0 ? (
                            viewMode === 'grid' ? (
                                auctions.map(auction => (
                                    <AuctionCard key={auction.id} auction={auction} />
                                ))
                            ) : (
                                auctions.map(auction => (
                                    <Link
                                        key={auction.id}
                                        to={`/auction/${auction.id}`}
                                        className="flex gap-4 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all p-4"
                                    >
                                        {/* Image - Left */}
                                        <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                                src={auction.images?.[0] || 'https://via.placeholder.com/300x200'}
                                                alt={auction.title}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>

                                        {/* Content - Right */}
                                        <div className="flex-1 flex flex-col justify-between min-w-0">
                                            <div>
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1">{auction.title}</h3>
                                                    <span className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${auction.status === 'active' ? 'bg-green-100 text-green-700' :
                                                        auction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {auction.status === 'active' ? 'Đang diễn ra' :
                                                            auction.status === 'pending' ? 'Sắp bắt đầu' : 'Đã kết thúc'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{auction.description}</p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Giá hiện tại</p>
                                                    <p className="text-2xl font-black text-orange-600">
                                                        {(auction.currentPrice || auction.startPrice)?.toLocaleString('vi-VN')} ₫
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Lượt đặt giá</p>
                                                        <p className="text-sm font-bold text-gray-900">{auction.totalBids || 0}</p>
                                                    </div>
                                                    <button className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg transition-all">
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))
                            )
                        ) : (
                            <div className="col-span-full py-20 bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center text-center">
                                <span className="material-symbols-outlined text-6xl text-gray-300">search_off</span>
                                <p className="mt-4 text-gray-500 font-medium">Không tìm thấy sản phẩm nào</p>
                                <button
                                    onClick={() => setFilters({ status: ['active', 'pending'], category: 'all', minPrice: 0, maxPrice: 100000000000, sortBy: 'ending_soon', page: 1, limit: 12 })}
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
