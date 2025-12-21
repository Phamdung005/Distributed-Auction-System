import React, { useState, useEffect } from 'react';
import { auctionAPI } from '../../services/api';
import AuctionCard from '../../components/auction/AuctionCard';
import './HomePage.css';

const HomePage = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [category, setCategory] = useState('');

  const categories = [
    { value: '', label: 'Tất cả' },
    { value: 'electronics', label: 'Điện tử' },
    { value: 'fashion', label: 'Thời trang' },
    { value: 'art', label: 'Nghệ thuật' },
    { value: 'collectibles', label: 'Sưu tầm' },
    { value: 'vehicles', label: 'Xe cộ' },
    { value: 'real-estate', label: 'Bất động sản' },
    { value: 'other', label: 'Khác' },
  ];

  useEffect(() => {
    fetchAuctions();
  }, [filter, category]);

  const fetchAuctions = async () => {
    setLoading(true);
    try {
      let response;
      const params = { page: 1, limit: 12 };

      if (filter === 'active') {
        response = await auctionAPI.getActiveAuctions(params);
      } else {
        if (searchKeyword) {
          params.keyword = searchKeyword;
        }
        if (category) {
          params.category = category;
        }
        response = await auctionAPI.getAuctions(params);
      }

      setAuctions(response.data.data.auctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAuctions();
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <h1 className="hero-title">🔨 Hệ Thống Đấu Giá Realtime</h1>
        <p className="hero-subtitle">
          Tham gia đấu giá trực tuyến với hàng nghìn sản phẩm chất lượng
        </p>
      </div>

      <div className="filter-section">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm đấu giá..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            🔍 Tìm kiếm
          </button>
        </form>

        <div className="filter-controls">
          <select
            className="filter-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Đang đấu giá
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex-center" style={{ minHeight: '300px' }}>
          <div className="spinner"></div>
        </div>
      ) : auctions.length > 0 ? (
        <div className="auctions-grid">
          {auctions.map(auction => (
            <AuctionCard key={auction.id} auction={auction} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>😔 Không tìm thấy đấu giá nào</p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
