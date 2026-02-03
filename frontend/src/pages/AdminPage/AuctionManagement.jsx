import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
    Search,
    Edit,
    Trash2,
    X,
    Gavel,
    Ban,
    ExternalLink
} from 'lucide-react';
import AdminService from '../../services/admin.service';

const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const AuctionManagement = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [currentAuction, setCurrentAuction] = useState(null);
    const [usersMap, setUsersMap] = useState({});
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startPrice: 0,
        startTime: '',
        endTime: '',
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch auctions and users in parallel to resolve seller names
                const [auctionsRes, usersRes] = await Promise.all([
                    AdminService.getAuctions({ limit: 100 }),
                    AdminService.getUsers() // Assuming this returns { data: [...] } or array
                ]);

                const fetchedAuctions = auctionsRes.data?.data?.auctions || auctionsRes.data?.auctions || auctionsRes.auctions || [];
                setAuctions(fetchedAuctions);

                // Create user map { id: user }
                const usersList = usersRes.data || usersRes || [];
                // Handle different response structures for users
                const actualUsers = Array.isArray(usersList) ? usersList : (usersList.data || []);

                const map = {};
                actualUsers.forEach(user => {
                    // Ensure ID matching handles both string/objectID formats
                    map[String(user.id)] = user;
                    if (user._id) map[String(user._id)] = user;
                });
                setUsersMap(map);

            } catch (error) {
                console.error(error);
                toast.error("Lỗi khi tải dữ liệu");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchAuctions = async () => {
        try {
            setLoading(true);
            const res = await AdminService.getAuctions({ limit: 100 });
            const fetchedAuctions = res.data?.data?.auctions || res.data?.auctions || res.auctions || [];
            setAuctions(fetchedAuctions);
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi tải danh sách đấu giá");
        } finally {
            setLoading(false);
        }
    };

    // Calculate display status to handle stale DB data
    const getDisplayStatus = (auction) => {
        const now = new Date();
        const start = new Date(auction.startTime);
        const end = new Date(auction.endTime);

        if (auction.status === 'cancelled') return 'cancelled';
        if (auction.status === 'completed') return 'completed';

        // Time-based overrides
        if (now > end) return 'ended';
        if (now >= start && now <= end) return 'active';
        if (now < start) return 'pending';

        return auction.status; // Fallback
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const filteredAuctions = auctions.filter(auction => {
        let sellerIdString = '';
        if (auction.seller && typeof auction.seller === 'object') {
            sellerIdString = String(auction.seller.id || auction.seller._id);
        } else {
            sellerIdString = String(auction.seller);
        }
        const sellerName = usersMap[sellerIdString]?.fullName || 'Unknown';
        return auction.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sellerName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleShowEdit = (auction) => {
        setCurrentAuction(auction);
        setFormData({
            title: auction.title || '',
            description: auction.description || '',
            startPrice: auction.startPrice || 0,
            startTime: auction.startTime ? new Date(auction.startTime).toISOString().slice(0, 16) : '',
            endTime: auction.endTime ? new Date(auction.endTime).toISOString().slice(0, 16) : '',
        });
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await AdminService.updateAuction(currentAuction.id, formData);
            toast.success("Cập nhật đấu giá thành công");
            setShowModal(false);
            fetchAuctions();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Có lỗi xảy ra");
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa phiên đấu giá này? Hành động này không thể hoàn tác.")) return;
        try {
            await AdminService.deleteAuction(id);
            toast.success("Xóa đấu giá thành công");
            fetchAuctions();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi xóa đấu giá");
        }
    };

    const handleCancel = async (id) => {
        if (!window.confirm("Bạn có chắc chắn muốn hủy phiên đấu giá này?")) return;
        try {
            await AdminService.cancelAuction(id);
            toast.success("Hủy đấu giá thành công");
            fetchAuctions();
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi hủy đấu giá");
        }
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <div className="relative w-64">
                    <input
                        type="text"
                        placeholder="Tìm kiếm auction, seller..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                </div>
                {/* Create Auction usually done by Seller, accessible here? Maybe unrelated for now */}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm flex-1 flex flex-col min-h-0">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left border-collapse relative">
                        <thead className="bg-[#F8F9FA] sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Price / Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredAuctions.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                                        Không tìm thấy phiên đấu giá nào.
                                    </td>
                                </tr>
                            ) : (
                                filteredAuctions.map(auction => {
                                    // Robust Seller Extraction
                                    let sellerInfo = { fullName: 'Unknown', email: 'N/A' };
                                    let sellerId = 'N/A';

                                    if (auction.seller) {
                                        if (typeof auction.seller === 'object') {
                                            if (auction.seller.fullName) {
                                                sellerInfo = auction.seller;
                                            } else {
                                                const rawId = auction.seller.id || auction.seller._id;
                                                if (rawId) {
                                                    const id = String(rawId);
                                                    sellerId = id;
                                                    if (usersMap[id]) sellerInfo = usersMap[id];
                                                }
                                            }
                                        } else {
                                            const id = String(auction.seller);
                                            sellerId = id;
                                            if (usersMap[id]) sellerInfo = usersMap[id];
                                        }
                                    }

                                    // Fallback display
                                    if (sellerInfo.fullName === 'Unknown' && sellerId !== 'N/A') {
                                        sellerInfo.fullName = `Không tồn tại (ID: ${sellerId.substring(0, 6)}...)`;
                                    }

                                    const displayStatus = getDisplayStatus(auction);

                                    return (
                                        <tr key={auction.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-lg bg-gray-100 bg-center bg-cover border border-gray-200"
                                                        style={{ backgroundImage: `url('${auction.image || 'https://via.placeholder.com/150'}')` }}>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 line-clamp-1" title={auction.title}>{auction.title}</p>
                                                        <span className="text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{auction.category || 'General'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="font-bold text-gray-900">{sellerInfo.fullName}</p>
                                                    <p className="text-xs text-gray-500">{sellerInfo.email}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-orange-600">{formatVND(auction.currentPrice || auction.startPrice)}</span>
                                                    <span className={`text-[10px] font-bold uppercase w-fit px-2 py-0.5 rounded-full mt-1 ${displayStatus === 'active' ? 'bg-green-100 text-green-700' :
                                                        displayStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            displayStatus === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                        }`}>
                                                        {displayStatus}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-500">
                                                    <p>Start: {new Date(auction.startTime).toLocaleDateString()}</p>
                                                    <p>End: {new Date(auction.endTime).toLocaleDateString()}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a
                                                        href={`/auction/${auction.id}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Xem chi tiết"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleShowEdit(auction)}
                                                        className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    {(displayStatus === 'active' || displayStatus === 'pending') && (
                                                        <button
                                                            onClick={() => handleCancel(auction.id)}
                                                            className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Hủy đấu giá"
                                                        >
                                                            <Ban size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(auction.id)}
                                                        className="p-2 text-gray-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa vĩnh viễn"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl animate-scale-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa đấu giá</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Giá khởi điểm</label>
                                    <input
                                        type="number"
                                        required
                                        disabled={currentAuction?.totalBids > 0}
                                        value={formData.startPrice}
                                        onChange={(e) => setFormData({ ...formData, startPrice: Number(e.target.value) })}
                                        className={`w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none ${currentAuction?.totalBids > 0 ? 'bg-gray-100 text-gray-500' : ''}`}
                                    />
                                    {currentAuction?.totalBids > 0 && <span className="text-xs text-red-500">Đã có bid, không thể sửa giá</span>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Bắt đầu</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kết thúc</label>
                                    <input
                                        type="datetime-local"
                                        required
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                <textarea
                                    rows="3"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg transition-colors shadow-sm mt-4"
                            >
                                Lưu thay đổi
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuctionManagement;
