import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Clock,
  Eye,
  Users,
  MapPin,
  CheckCircle,
  Shield,
  Gavel,
  ChevronRight
} from 'lucide-react';

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

const AuctionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, getAccessToken, user } = useAuth();

  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [connected, setConnected] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedImage, setSelectedImage] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [recentBids, setRecentBids] = useState([]);

  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  // Track if we've already joined this auction to prevent duplicates
  const hasJoinedRef = useRef(false);

  // Update current time every second for live countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAuctionDetails();
    if (isAuthenticated) {
      checkRegistration();
    } else {
      setCheckingRegistration(false);
    }

    // Setup socket for ALL users (authenticated AND anonymous)
    // Anonymous users can view, but cannot bid
    const token = isAuthenticated ? getAccessToken() : null;
    const socket = connectSocket(token);

    if (socket) {
      // Handle connect event (for reconnections)
      const handleConnect = () => {
        console.log('Socket connected, joining auction:', id);
        setConnected(true);

        // Join auction room
        joinAuction(id, (data) => {
          console.log('Joined auction:', data);
          if (data.totalParticipants !== undefined) {
            setParticipants(data.totalParticipants);
          }
        });

        hasJoinedRef.current = true;
      };

      const handleDisconnect = () => {
        console.log('Socket disconnected');
        setConnected(false);
      };

      // If already connected, join immediately
      if (socket.connected) {
        handleConnect();
      } else {
        // Otherwise, wait for connect event
        socket.on('connect', handleConnect);
      }

      socket.on('disconnect', handleDisconnect);

      const handleBidUpdate = (data) => {
        if (data.auctionId === id) {
          setAuction(prev => ({
            ...prev,
            currentPrice: data.amount,
            totalBids: prev.totalBids + 1
          }));

          // Update recent bids list
          const newBid = {
            bidderId: data.bidderId,
            bidderName: data.bidderName,
            amount: data.amount,
            timestamp: data.timestamp || new Date().toISOString()
          };

          setRecentBids(prev => {
            // Avoid duplicates
            if (prev.some(b => b.amount === newBid.amount && b.bidderId === newBid.bidderId)) {
              return prev;
            }
            return [newBid, ...prev].slice(0, 10);
          });
        }
      };

      const handleUserJoined = (data) => {
        setParticipants(data.totalParticipants);
      };

      const handleUserLeft = (data) => {
        setParticipants(data.totalParticipants);
      };

      onBidUpdate(handleBidUpdate);
      onUserJoined(handleUserJoined);
      onUserLeft(handleUserLeft);

      // Cleanup function
      return () => {
        // Remove connect handler
        socket.off('connect', handleConnect);
        socket.off('disconnect', handleDisconnect);

        // Leave auction if joined
        if (hasJoinedRef.current) {
          leaveAuction(id);
          hasJoinedRef.current = false;
        }

        // Remove all other listeners
        removeListeners();
      };
    }
  }, [id, isAuthenticated]);

  // Handle automatic status update based on time
  useEffect(() => {
    if (!auction) return;

    const now = new Date();

    // Auto-switch from Pending to Active
    if (auction.status === 'pending' && new Date(auction.startTime) <= now) {
      setAuction(prev => ({ ...prev, status: 'active' }));
      fetchAuctionDetails();
    }

    // Auto-switch from Active to Ended (optional, but good for UI consistency)
    if (auction.status === 'active' && new Date(auction.endTime) <= now) {
      setAuction(prev => ({ ...prev, status: 'ended' }));
      fetchAuctionDetails();
    }
  }, [currentTime, auction]);

  const fetchAuctionDetails = async () => {
    try {
      const response = await auctionAPI.getAuctionById(id);
      const data = response.data.data;
      setAuction(data);
      if (data) {
        setBidAmount(data.currentPrice + data.minBidIncrement);
      }

      // Fetch bid history from bidding service
      try {
        const historyRes = await biddingAPI.getBidHistory(id, 10);
        if (historyRes.data.success) {
          setRecentBids(historyRes.data.data.bids);
        }
      } catch (historyErr) {
        console.error('Error fetching bid history:', historyErr);
      }
    } catch (error) {
      toast.error('Không thể tải thông tin đấu giá');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = async () => {
    try {
      const response = await auctionAPI.checkRegistrationStatus(id);
      setIsRegistered(response.data.isRegistered);
    } catch (error) {
      console.error('Error checking registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleShowDepositModal = () => {
    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đăng ký');
      navigate('/login');
      return;
    }
    setShowDepositModal(true);
  };

  const handleRegister = async () => {
    try {
      setBidding(true);
      setShowDepositModal(false);
      await auctionAPI.registerForAuction(id);
      // toast.success('Đăng ký tham gia thành công! Bạn có thể bắt đầu đặt giá.');
      setIsRegistered(true);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Đăng ký thất bại');
    } finally {
      setBidding(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.warning('Vui lòng đăng nhập để đặt giá');
      navigate('/login');
      return;
    }

    if (!isRegistered) {
      toast.error('Bạn cần đăng ký tham gia phiên đấu giá này trước');
      return;
    }

    if (!connected) {
      toast.error('Chưa kết nối đến server');
      return;
    }

    const amount = parseInt(bidAmount);
    const minBid = auction.currentPrice + auction.minBidIncrement;

    if (amount < minBid) {
      toast.error(`Giá đặt phải >= ${minBid.toLocaleString('vi-VN')} ₫`);
      return;
    }

    setBidding(true);
    try {
      await placeBid(id, amount);
      // toast.success('Đặt giá thành công! 🎉');
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
      <div className="w-full min-h-screen bg-[#f8f7f5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f26c0d]"></div>
      </div>
    );
  }

  if (!auction) return null;

  const isActive = auction.status === 'active';
  const isPending = auction.status === 'pending';
  const isEnded = auction.status === 'ended';

  // Calculate time display based on status
  let timeRemaining = 'Đã kết thúc';
  let timeLabel = 'Thời gian còn lại';

  if (isPending) {
    // For pending auctions, show time until start
    const startTime = new Date(auction.startTime);
    const diffMs = startTime - currentTime;

    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      timeRemaining = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      timeLabel = 'Sắp diễn ra sau';
    } else {
      timeRemaining = 'Đang bắt đầu...';
      timeLabel = 'Trạng thái';
    }
  } else if (isActive) {
    // For active auctions, calculate remaining time from endTime
    const endTime = new Date(auction.endTime);
    const diffMs = endTime - currentTime;

    if (diffMs > 0) {
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      timeRemaining = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
      timeLabel = 'Thời gian còn lại';
    }
  }

  const images = auction.images && auction.images.length > 0
    ? auction.images
    : ['https://via.placeholder.com/600x400'];

  return (
    <div className="w-full min-h-screen bg-[#f8f7f5] text-[#1c130d] px-4 md:px-8 py-6">
      <div className="max-w-[1440px] mx-auto">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap gap-2 py-4 mb-4">
          <button onClick={() => navigate('/')} className="text-[#9c6c49] text-sm font-medium hover:underline">
            Trang chủ
          </button>
          <ChevronRight className="text-[#9c6c49]" size={16} />
          <button onClick={() => navigate('/auction-list')} className="text-[#9c6c49] text-sm font-medium hover:underline">
            Đấu giá
          </button>
          <ChevronRight className="text-[#9c6c49]" size={16} />
          <span className="text-[#1c130d] text-sm font-medium truncate max-w-xs">{auction.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* LEFT COLUMN: Product Details */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            {/* Main Gallery */}
            <div className="flex flex-col gap-4">
              <div className="w-full aspect-[4/3] bg-white rounded-xl overflow-hidden shadow-sm border border-[#e5ded9] relative group">
                {auction.status === 'active' && (
                  <div className="absolute top-4 left-4 bg-[#f26c0d] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-lg">
                    Đang đấu giá
                  </div>
                )}
                {auction.status === 'pending' && (
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-lg">
                    Sắp diễn ra
                  </div>
                )}
                {auction.status === 'ended' && (
                  <div className="absolute top-4 left-4 bg-gray-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-lg">
                    Đã kết thúc
                  </div>
                )}
                <img
                  src={images[selectedImage]}
                  alt={auction.title}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
              </div>

              {images.length > 1 && (
                <div className="grid grid-cols-4 gap-3">
                  {images.slice(0, 4).map((img, idx) => (
                    <div
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`cursor-pointer aspect-square rounded-lg border-2 overflow-hidden relative ${selectedImage === idx
                        ? 'border-[#f26c0d]'
                        : 'border-[#e5ded9] opacity-70 hover:opacity-100 hover:border-[#f26c0d]'
                        } transition-all`}
                    >
                      <img src={img} alt={`${auction.title} ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Title & Basic Info */}
            <div className="flex flex-col gap-4 border-b border-[#e5ded9] pb-8">
              <h1 className="text-[#1c130d] text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                {auction.title}
              </h1>
              <p className="text-[#9c6c49] text-lg font-normal leading-normal">
                {auction.description?.substring(0, 150)}...
              </p>
              <div className="flex gap-3 flex-wrap">
                <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f4ece7] px-3">
                  <CheckCircle className="text-[#1c130d]" size={20} />
                  <p className="text-[#1c130d] text-sm font-medium">Người bán uy tín</p>
                </div>
                <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f4ece7] px-3">
                  <Shield className="text-[#1c130d]" size={20} />
                  <p className="text-[#1c130d] text-sm font-medium">Đảm bảo chính hãng</p>
                </div>
                <div className="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-[#f4ece7] px-3">
                  <MapPin className="text-[#1c130d]" size={20} />
                  <p className="text-[#1c130d] text-sm font-medium">Việt Nam</p>
                </div>
              </div>
            </div>

            {/* Product Details Tabs */}
            <div>
              <div className="flex border-b border-[#e5ded9] mb-6">
                <button
                  onClick={() => setActiveTab('description')}
                  className={`px-6 py-3 font-bold text-sm transition-colors ${activeTab === 'description'
                    ? 'text-[#f26c0d] border-b-2 border-[#f26c0d]'
                    : 'text-[#9c6c49] hover:text-[#1c130d]'
                    }`}
                >
                  Mô tả
                </button>
                <button
                  onClick={() => setActiveTab('specifications')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'specifications'
                    ? 'text-[#f26c0d] border-b-2 border-[#f26c0d]'
                    : 'text-[#9c6c49] hover:text-[#1c130d]'
                    }`}
                >
                  Thông số
                </button>
                <button
                  onClick={() => setActiveTab('shipping')}
                  className={`px-6 py-3 font-medium text-sm transition-colors ${activeTab === 'shipping'
                    ? 'text-[#f26c0d] border-b-2 border-[#f26c0d]'
                    : 'text-[#9c6c49] hover:text-[#1c130d]'
                    }`}
                >
                  Vận chuyển
                </button>
              </div>

              <div className="prose max-w-none text-[#1c130d]">
                {activeTab === 'description' && (
                  <div>
                    <p className="mb-4">{auction.description}</p>
                    <div className="mt-6 space-y-2">
                      <p><strong>Người bán:</strong> {auction.seller?.fullName}</p>
                      <p><strong>Giá khởi điểm:</strong> {auction.startPrice?.toLocaleString('vi-VN')} ₫</p>
                      <p><strong>Bước giá:</strong> {auction.minBidIncrement?.toLocaleString('vi-VN')} ₫</p>
                      <p><strong>Bắt đầu:</strong> {format(new Date(auction.startTime), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                      <p><strong>Kết thúc:</strong> {format(new Date(auction.endTime), 'dd/MM/yyyy HH:mm', { locale: vi })}</p>
                    </div>
                  </div>
                )}
                {activeTab === 'specifications' && (
                  <p className="text-[#9c6c49]">Thông tin chi tiết sẽ được cập nhật sớm.</p>
                )}
                {activeTab === 'shipping' && (
                  <p className="text-[#9c6c49]">Miễn phí vận chuyển toàn quốc. Giao hàng trong 3-5 ngày làm việc.</p>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Action Zone (Sticky) */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="sticky top-24 flex flex-col gap-6">
              {/* Bidding Card */}
              <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#e5ded9] overflow-hidden">
                {/* Timer Header */}
                <div className="bg-[#1c130d] text-white p-4 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Clock className="animate-pulse text-red-500" size={20} />
                    <span className="font-medium text-sm text-gray-300 uppercase tracking-wide">{timeLabel}</span>
                  </div>
                  <div className="font-mono text-2xl font-bold tracking-widest text-[#f26c0d]">
                    {timeRemaining}
                  </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                  {/* Price & Views */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-[#9c6c49] font-medium mb-1">Giá hiện tại</p>
                      <h3 className="text-4xl font-black text-[#f26c0d] tracking-tight">
                        {auction.currentPrice?.toLocaleString('vi-VN')} ₫
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#9c6c49] bg-[#f4ece7] px-2 py-1 rounded text-xs font-medium">
                      <Eye size={16} />
                      <span>{participants || auction.viewCount || 0} đang xem</span>
                    </div>
                  </div>

                  {/* Deposit Policy Modal */}
                  {showDepositModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                      <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-[#1c130d] mb-4">Chính sách đặt cọc</h3>
                        <div className="space-y-3 text-sm text-[#5c4536] mb-6">
                          <p>Để tham gia đấu giá, bạn cần đặt cọc:</p>
                          <ul className="list-disc list-inside space-y-2 ml-2">
                            <li>Số tiền cọc: <strong>{auction.minDeposit ? auction.minDeposit.toLocaleString('vi-VN') : (auction.startPrice * 0.1).toLocaleString('vi-VN')} ₫</strong> (10% giá khởi điểm)</li>
                            <li>Tiền cọc sẽ được <strong>tạm giữ</strong> trong ví của bạn</li>
                            <li>Nếu <strong>thắng đấu giá</strong>: Tiền cọc sẽ được trừ vào tổng thanh toán</li>
                            <li>Nếu <strong>không thắng</strong>: Tiền cọc sẽ được hoàn trả đầy đủ</li>
                            <li>Nếu <strong>vi phạm</strong> (đặt giá rồi không thanh toán): Tiền cọc sẽ bị tịch thu</li>
                          </ul>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowDepositModal(false)}
                            className="flex-1 h-12 border-2 border-[#e5ded9] text-[#5c4536] font-semibold rounded-lg hover:bg-gray-50 transition-all"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleRegister}
                            disabled={bidding}
                            className="flex-1 h-12 bg-[#f26c0d] hover:bg-[#d95d08] disabled:opacity-50 text-white font-bold rounded-lg transition-all"
                          >
                            {bidding ? 'Đang xử lý...' : 'Đồng ý & Đăng ký'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Controls */}
                  {(isActive || isPending) && (
                    <div className="flex flex-col gap-3">
                      {!isAuthenticated ? (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={() => navigate('/login')}
                            className="w-full h-12 bg-white border-2 border-[#f26c0d] text-[#f26c0d] font-bold rounded-lg hover:bg-orange-50 transition-all"
                          >
                            Đăng nhập để tham gia đấu giá
                          </button>
                        </div>
                      ) : checkingRegistration ? (
                        <div className="text-center text-[#9c6c49] py-4">Đang kiểm tra trạng thái...</div>
                      ) : !isRegistered ? (
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleShowDepositModal}
                            disabled={bidding}
                            className="w-full h-14 bg-[#f26c0d] hover:bg-[#d95d08] active:scale-[0.99] disabled:opacity-50 text-white text-lg font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <span>{bidding ? 'Đang xử lý...' : 'Đăng ký tham gia đấu giá'}</span>
                            <CheckCircle size={20} />
                          </button>
                          <p className="text-center text-xs text-[#9c6c49]">
                            {isPending ? 'Đăng ký sớm để sẵn sàng khi đấu giá bắt đầu' : 'Bạn cần đăng ký trước khi có thể đặt giá'}
                          </p>
                        </div>
                      ) : isActive ? (
                        <form onSubmit={handlePlaceBid} className="flex flex-col gap-3">
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9c6c49] font-semibold">₫</span>
                            <input
                              className="w-full h-12 rounded-lg border border-[#e5ded9] bg-[#fcfaf8] pl-8 pr-4 text-lg font-bold text-[#1c130d] focus:ring-2 focus:ring-[#f26c0d] focus:border-[#f26c0d] transition-all placeholder:font-normal"
                              placeholder="Nhập số tiền đặt giá"
                              type="number"
                              value={bidAmount}
                              onChange={(e) => setBidAmount(e.target.value)}
                              min={auction.currentPrice + auction.minBidIncrement}
                              step={auction.minBidIncrement}
                            />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            <button
                              type="button"
                              onClick={() => quickBid(auction.minBidIncrement)}
                              className="h-10 rounded border border-[#e5ded9] hover:border-[#f26c0d] hover:text-[#f26c0d] hover:bg-[#f26c0d]/5 text-sm font-semibold text-[#5c4536] transition-all"
                            >
                              +{(auction.minBidIncrement / 1000).toFixed(0)}k
                            </button>
                            <button
                              type="button"
                              onClick={() => quickBid(auction.minBidIncrement * 5)}
                              className="h-10 rounded border border-[#e5ded9] hover:border-[#f26c0d] hover:text-[#f26c0d] hover:bg-[#f26c0d]/5 text-sm font-semibold text-[#5c4536] transition-all"
                            >
                              +{(auction.minBidIncrement * 5 / 1000).toFixed(0)}k
                            </button>
                            <button
                              type="button"
                              onClick={() => quickBid(auction.minBidIncrement * 10)}
                              className="h-10 rounded border border-[#e5ded9] hover:border-[#f26c0d] hover:text-[#f26c0d] hover:bg-[#f26c0d]/5 text-sm font-semibold text-[#5c4536] transition-all"
                            >
                              +{(auction.minBidIncrement * 10 / 1000).toFixed(0)}k
                            </button>
                          </div>

                          <button
                            type="submit"
                            disabled={bidding || !connected}
                            className="w-full h-14 bg-[#f26c0d] hover:bg-[#d95d08] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-lg shadow-lg shadow-orange-500/30 transition-all flex items-center justify-center gap-2"
                          >
                            <span>{bidding ? 'Đang đặt giá...' : 'Đặt giá'}</span>
                            <Gavel size={20} />
                          </button>
                        </form>
                      ) : (
                        <div className="text-center py-4">
                          <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-lg">
                            <CheckCircle size={20} />
                            <span className="font-semibold">Đã đăng ký thành công</span>
                          </div>
                          <p className="text-sm text-[#9c6c49] mt-2">
                            Bạn sẽ có thể đặt giá khi phiên đấu giá bắt đầu
                          </p>
                        </div>
                      )}

                      {!connected && isAuthenticated && isRegistered && (
                        <p className="text-center text-xs text-[#9c6c49]">⚠️ Đang kết nối đến server...</p>
                      )}

                      <p className="text-center text-xs text-[#9c6c49]">
                        Bằng việc đặt giá, bạn đồng ý với <button className="underline hover:text-[#f26c0d]">Điều khoản sử dụng</button>.
                      </p>
                    </div>
                  )}

                  {!isActive && !isPending && (
                    <div className="text-center py-4">
                      <p className="text-lg font-bold text-[#9c6c49]">Phiên đấu giá đã kết thúc</p>
                    </div>
                  )}

                  {/* Bid History Footer */}
                  <div className="bg-[#f8f7f5] border-t border-[#e5ded9] -mx-6 -mb-6">
                    <div className="p-4 border-b border-[#e5ded9] flex justify-between items-center">
                      <h4 className="font-bold text-[#1c130d] text-sm">Lịch sử đặt giá</h4>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {recentBids && recentBids.length > 0 ? (
                        <table className="w-full text-sm text-left">
                          <tbody className="divide-y divide-[#e5ded9]">
                            {recentBids.slice(0, 10).map((bid, idx) => {
                              // Check if this bid is from the current user
                              const bidderId = bid.bidderId || (bid.bidder && (bid.bidder._id || bid.bidder.id));
                              const isCurrentUserBid = user && bidderId && (bidderId === user.id || bidderId === user._id);

                              return (
                                <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-[#9c6c49] font-mono text-xs">
                                    {format(new Date(bid.timestamp), 'HH:mm:ss', { locale: vi })}
                                  </td>
                                  <td className="px-4 py-3 font-medium text-[#1c130d]">
                                    {isCurrentUserBid ? (
                                      <span className="font-bold text-[#f26c0d]">Bạn</span>
                                    ) : (
                                      bid.bidderName || (bid.bidder && bid.bidder.fullName) || 'Người dùng'
                                    )}
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-[#1c130d]">
                                    {bid.amount?.toLocaleString('vi-VN') || bid.bidAmount?.toLocaleString('vi-VN')} ₫
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-8 text-center text-[#9c6c49] text-sm italic">
                          Chưa có lượt đặt giá nào. Hãy là người đầu tiên!
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Safety Card */}
              <div className="bg-[#f4ece7] p-4 rounded-xl border border-[#e5ded9] flex gap-3">
                <Shield className="text-[#9c6c49] flex-shrink-0" size={24} />
                <div>
                  <h4 className="text-sm font-bold text-[#1c130d] mb-1">Bảo vệ người mua</h4>
                  <p className="text-xs text-[#9c6c49]">
                    Giao dịch của bạn được bảo vệ. Nếu sản phẩm không đúng mô tả, chúng tôi sẽ hoàn tiền.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuctionDetailPage;
