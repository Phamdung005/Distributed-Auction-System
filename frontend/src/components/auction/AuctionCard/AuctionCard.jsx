import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import './AuctionCard.css';

const AuctionCard = ({ auction }) => {
    const getStatusBadge = (status) => {
        const badges = {
            active: { text: 'Đang đấu giá', className: 'badge-success' },
            pending: { text: 'Sắp bắt đầu', className: 'badge-warning' },
            ended: { text: 'Đã kết thúc', className: 'badge-secondary' },
            cancelled: { text: 'Đã hủy', className: 'badge-danger' },
        };
        return badges[status] || badges.pending;
    };

    const badge = getStatusBadge(auction.status);

    const timeRemaining = auction.timeRemaining > 0
        ? formatDistanceToNow(new Date(auction.endTime), { addSuffix: true, locale: vi })
        : 'Đã kết thúc';

    return (
        <div className="auction-card">
            <div className="auction-card-image">
                <img
                    src={auction.images?.[0] || 'https://via.placeholder.com/300x200'}
                    alt={auction.title}
                />
                <span className={`auction-badge ${badge.className}`}>
                    {badge.text}
                </span>
            </div>

            <div className="auction-card-content">
                <h3 className="auction-card-title">{auction.title}</h3>

                <div className="auction-card-info">
                    <div className="auction-price">
                        <span className="price-label">Giá hiện tại:</span>
                        <span className="price-value">
                            {auction.currentPrice?.toLocaleString('vi-VN')} VND
                        </span>
                    </div>

                    <div className="auction-stats">
                        <span>👥 {auction.totalBids} lượt đặt</span>
                        <span>👁️ {auction.viewCount} lượt xem</span>
                    </div>

                    {auction.status === 'active' && (
                        <div className="auction-time">
                            ⏰ {timeRemaining}
                        </div>
                    )}
                </div>

                <Link to={`/auction/${auction.id}`} className="btn btn-primary btn-block">
                    Xem chi tiết
                </Link>
            </div>
        </div>
    );
};

export default AuctionCard;
