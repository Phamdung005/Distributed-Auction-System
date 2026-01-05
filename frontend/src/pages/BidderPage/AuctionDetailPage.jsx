import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { auctionAPI, biddingAPI } from '../../services/api';
import {
  connectSocket,
  disconnectSocket,
  joinAuction,
  leaveAuction,
  placeBid,
  onBidUpdate,
  onUserJoined,
  onUserLeft,
  removeListeners
} from '../../services/socket';

import './AuctionDetailPage.css';

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, getAccessToken } = useAuth();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    fetchAuctionDetails();

    // Connect socket nếu user đã login
    if (isAuthenticated) {
      const token = getAccessToken();
      const socket = connectSocket(token);

      if (socket) {
        socket.on('connect', () => {
          setConnected(true);
          joinAuction(id, (data) => {
            setAuction(prev => ({ ...prev, ...data }));
            setBidAmount(data.currentPrice + data.minBidIncrement);
          });
        });

        // Lắng nghe bid updates
        onBidUpdate((data) => {
          if (data.auctionId === id) {
            setAuction(prev => ({
              ...prev,
              currentPrice: data.amount,
              totalBids: prev.totalBids + 1
            }));
            toast.info(`💰 Có bid mới: ${data.amount.toLocaleString('vi-VN')} VND`);
          }
        });

        // Lắng nghe user joined/left
        onUserJoined((data) => {
          setParticipants(data.totalParticipants);
        });

        onUserLeft((data) => {
          setParticipants(data.totalParticipants);
        });
      }
    }

    return () => {
      if (isAuthenticated) {
        leaveAuction(id);
        removeListeners();
        disconnectSocket();
      }
    };
  }, [id, isAuthenticated]);

  const fetchAuctionDetails = async () => {
    try {
      const response = await auctionAPI.getAuctionById(id);
      const data = response.data.data;
      setAuction(data);
      setBidAmount(data.currentPrice + data.minBidIncrement);
    } catch (error) {
      toast.error('Không thể tải thông tin đấu giá');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đặt giá');
      navigate('/login');
      return;
    }

    if (!connected) {
      toast.error('Chưa kết nối đến server');
      return;
    }

    const amount = parseInt(bidAmount);
    const minBid = auction.currentPrice + auction.minBidIncrement;

    if (amount < minBid) {
      toast.error(`Giá đặt phải >= ${minBid.toLocaleString('vi-VN')} VND`);
      return;
    }

    setBidding(true);
    try {
      await placeBid(id, amount);
      toast.success('Đặt giá thành công! 🎉');
      setBidAmount(amount + auction.minBidIncrement);
    } catch (error) {
      toast.error(error.message || 'Đặt giá thất bại');
    } finally {
      setBidding(false);
    }
  };

  const quickBid = (increment) => {
    setBidAmount(auction.currentPrice + increment);
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!auction) return null;

  const isActive = auction.status === 'active';
  const timeRemaining = auction.timeRemaining > 0
    ? Math.floor(auction.timeRemaining / 60) + ' phút'
    : 'Đã kết thúc';

  return (
    <div className="auction-detail-page">
      <div className="auction-detail-container">
        {/* Left: Images */}
        <div className="auction-images">
          <div className="main-image">
            <img src={auction.images?.[0] || 'https://via.placeholder.com/600x400'} alt={auction.title} />
          </div>
          {auction.images?.length > 1 && (
            <div className="thumbnail-images">
              {auction.images.slice(1, 5).map((img, idx) => (
                <img key={idx} src={img} alt={`${auction.title} ${idx + 2}`} />
              ))}
            </div>
          )}
        </div>

        {/* Right: Info & Bidding */}
        <div className="auction-info-section">
          <div className="auction-header">
            <h1 className="auction-title">{auction.title}</h1>
            <span className={`status-badge status-${auction.status}`}>
              {auction.status === 'active' && '🟢 Đang đấu giá'}
              {auction.status === 'pending' && '🟡 Sắp bắt đầu'}
              {auction.status === 'ended' && '⚫ Đã kết thúc'}
            </span>
          </div>

          {/* Current Price */}
          <div className="price-section">
            <div className="current-price">
              <span className="price-label">Giá hiện tại</span>
              <span className="price-value">
                {auction.currentPrice.toLocaleString('vi-VN')} VND
              </span>
            </div>
            {isActive && (
              <div className="time-remaining">
                ⏰ Còn lại: <strong>{timeRemaining}</strong>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="auction-stats">
            <div className="stat-item">
              <span className="stat-label">Lượt đặt</span>
              <span className="stat-value">{auction.totalBids}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Lượt xem</span>
              <span className="stat-value">{auction.viewCount}</span>
            </div>
            {connected && (
              <div className="stat-item">
                <span className="stat-label">Đang xem</span>
                <span className="stat-value">{participants}</span>
              </div>
            )}
          </div>

          {/* Bidding Form */}
          {isActive && (
            <div className="bidding-section">
              <form onSubmit={handlePlaceBid}>
                <div className="bid-input-group">
                  <input
                    type="number"
                    className="bid-input"
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    placeholder="Nhập giá đặt"
                    min={auction.currentPrice + auction.minBidIncrement}
                    step={auction.minBidIncrement}
                  />
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={bidding || !connected}
                  >
                    {bidding ? 'Đang đặt...' : '💰 Đặt giá'}
                  </button>
                </div>
              </form>

              <div className="quick-bid-buttons">
                <button
                  className="btn btn-secondary"
                  onClick={() => quickBid(auction.minBidIncrement)}
                >
                  +{auction.minBidIncrement.toLocaleString('vi-VN')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => quickBid(auction.minBidIncrement * 5)}
                >
                  +{(auction.minBidIncrement * 5).toLocaleString('vi-VN')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => quickBid(auction.minBidIncrement * 10)}
                >
                  +{(auction.minBidIncrement * 10).toLocaleString('vi-VN')}
                </button>
              </div>

              {!connected && isAuthenticated && (
                <p className="warning-text">⚠️ Đang kết nối đến server...</p>
              )}
            </div>
          )}

          {/* Auction Info */}
          <div className="auction-meta">
            <div className="meta-item">
              <strong>Người bán:</strong> {auction.seller?.fullName}
            </div>
            <div className="meta-item">
              <strong>Giá khởi điểm:</strong> {auction.startPrice.toLocaleString('vi-VN')} VND
            </div>
            <div className="meta-item">
              <strong>Bước giá:</strong> {auction.minBidIncrement.toLocaleString('vi-VN')} VND
            </div>
            <div className="meta-item">
              <strong>Bắt đầu:</strong> {format(new Date(auction.startTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </div>
            <div className="meta-item">
              <strong>Kết thúc:</strong> {format(new Date(auction.endTime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="card mt-3">
        <h2>Mô tả</h2>
        <p className="auction-description">{auction.description}</p>
      </div>

      {/* Recent Bids */}
      {auction.recentBids?.length > 0 && (
        <div className="card mt-3">
          <h2>Lịch sử đặt giá gần đây</h2>
          <div className="bids-list">
            {auction.recentBids.map((bid, idx) => (
              <div key={idx} className="bid-item">
                <span className="bid-user">👤 {bid.bidder?.username || 'Anonymous'}</span>
                <span className="bid-amount">{bid.amount.toLocaleString('vi-VN')} VND</span>
                <span className="bid-time">
                  {format(new Date(bid.timestamp), 'dd/MM HH:mm', { locale: vi })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AuctionDetailPage;
