import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { auctionAPI } from '../../services/api';
import './MyAuctionsPage.css';

const MyAuctionsPage = () => {
    const [auctions, setAuctions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAuctions();
    }, []);

    const fetchMyAuctions = async () => {
        try {
            const response = await auctionAPI.getMyAuctions({ page: 1, limit: 20 });
            setAuctions(response.data.data.auctions);
        } catch (error) {
            toast.error('Không thể tải danh sách đấu giá');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAuction = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa đấu giá này?')) {
            return;
        }

        try {
            await auctionAPI.deleteAuction(id);
            toast.success('Xóa đấu giá thành công');
            fetchMyAuctions();
        } catch (error) {
            toast.error('Xóa đấu giá thất bại');
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ minHeight: '50vh' }}>
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="my-auctions-page">
            <div className="page-header">
                <h1 className="page-title">📦 Đấu Giá Của Tôi</h1>
                <Link to="/create-auction" className="btn btn-success">
                    ➕ Tạo đấu giá mới
                </Link>
            </div>

            {auctions.length === 0 ? (
                <div className="empty-state">
                    <p>😔 Bạn chưa tạo đấu giá nào</p>
                    <Link to="/create-auction" className="btn btn-primary">
                        Tạo đấu giá đầu tiên
                    </Link>
                </div>
            ) : (
                <div className="auctions-table-container">
                    <table className="auctions-table">
                        <thead>
                            <tr>
                                <th>Hình ảnh</th>
                                <th>Tiêu đề</th>
                                <th>Trạng thái</th>
                                <th>Giá khởi điểm</th>
                                <th>Giá hiện tại</th>
                                <th>Lượt đặt</th>
                                <th>Thời gian kết thúc</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auctions.map(auction => (
                                <tr key={auction.id}>
                                    <td>
                                        <img
                                            src={auction.images?.[0] || 'https://via.placeholder.com/100'}
                                            alt={auction.title}
                                            className="auction-thumbnail"
                                        />
                                    </td>
                                    <td>
                                        <Link to={`/auction/${auction.id}`} className="auction-link">
                                            {auction.title}
                                        </Link>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${auction.status}`}>
                                            {auction.status === 'active' && '🟢 Đang đấu giá'}
                                            {auction.status === 'pending' && '🟡 Sắp bắt đầu'}
                                            {auction.status === 'ended' && '⚫ Đã kết thúc'}
                                        </span>
                                    </td>
                                    <td>{auction.startPrice.toLocaleString('vi-VN')} ₫</td>
                                    <td>
                                        <strong>{auction.currentPrice.toLocaleString('vi-VN')} ₫</strong>
                                    </td>
                                    <td>{auction.totalBids}</td>
                                    <td>
                                        {format(new Date(auction.endTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <Link
                                                to={`/auction/${auction.id}`}
                                                className="btn btn-sm btn-primary"
                                            >
                                                👁️ Xem
                                            </Link>
                                            {auction.status === 'pending' && (
                                                <>
                                                    <Link
                                                        to={`/edit-auction/${auction.id}`}
                                                        className="btn btn-sm btn-secondary"
                                                    >
                                                        ✏️ Sửa
                                                    </Link>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDeleteAuction(auction.id)}
                                                    >
                                                        🗑️ Xóa
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MyAuctionsPage;
