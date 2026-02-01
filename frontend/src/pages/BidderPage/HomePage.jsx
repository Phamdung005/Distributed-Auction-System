import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionAPI } from '../../services/api';

const HomePage = () => {
  const [hotAuctions, setHotAuctions] = useState([]);
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [heroAuction, setHeroAuction] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hotRes, activeRes, upcomingRes] = await Promise.all([
          auctionAPI.getAuctions({ page: 1, limit: 4, sort: '-viewCount', status: 'active' }),
          auctionAPI.getActiveAuctions({ page: 1, limit: 8, sort: '-createdAt' }),
          auctionAPI.getAuctions({ page: 1, limit: 3, sort: 'startTime', status: 'pending' })
        ]);

        const hot = hotRes.data?.data?.auctions || [];
        setHotAuctions(hot);
        if (hot.length > 0) {
          // Use the most viewed auction as Hero, or fallback.
          setHeroAuction(hot[0]);
        }

        setActiveAuctions(activeRes.data?.data?.auctions || []);

        if (upcomingRes.data?.data?.auctions) {
          setUpcomingAuctions(upcomingRes.data.data.auctions);
        }
      } catch (error) {
        console.error('Error fetching homepage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Calculate time remaining (simple version for display)
  const getTimeRemaining = (endTime) => {
    const total = Date.parse(endTime) - Date.parse(new Date());
    if (total <= 0) return "Finished";
    const hours = Math.floor((total / (1000 * 60 * 60)));
    const minutes = Math.floor((total / 1000 / 60) % 60);
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#f26c0d]"></div>
      </div>
    );
  }

  return (
    <main className="w-full flex flex-col min-w-0">
      {/* Hero Section - displaying the #1 Hot Auction */}
      {heroAuction && (
        <div className="relative w-full overflow-hidden bg-[#1c130d] rounded-xl my-6 group">
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-transparent z-10"></div>
          <div
            className="h-[480px] w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${heroAuction.images?.[0] || 'https://via.placeholder.com/1200x600'}')` }}
          ></div>
          <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-4 md:px-12 max-w-[1440px] mx-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-4 py-1.5 text-xs font-bold text-white mb-6 uppercase tracking-wide backdrop-blur-sm shadow-lg shadow-orange-500/20">
              <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
              Featured Auction
            </span>
            <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4 max-w-3xl drop-shadow-2xl line-clamp-2">
              {heroAuction.title}
            </h1>
            <p className="text-gray-200 text-lg sm:text-xl mb-8 max-w-2xl font-medium drop-shadow-md leading-relaxed line-clamp-2">
              {heroAuction.description}
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl border border-white/20 shadow-xl">
                <span className="material-symbols-outlined text-orange-500 text-[28px]">timer</span>
                <div>
                  <span className="text-xs uppercase text-gray-300 font-bold tracking-wider block mb-0.5">Time Left</span>
                  <span className="font-mono text-xl font-bold">{getTimeRemaining(heroAuction.endTime)}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md text-white px-6 py-3.5 rounded-2xl border border-white/20 shadow-xl">
                <span className="material-symbols-outlined text-green-500 text-[28px]">payments</span>
                <div>
                  <span className="text-xs uppercase text-gray-300 font-bold tracking-wider block mb-0.5">Current Bid</span>
                  <span className="font-mono text-xl font-bold">{formatCurrency(heroAuction.currentPrice || heroAuction.startPrice)}</span>
                </div>
              </div>
            </div>
            <div className="mt-8">
              <Link to={`/auction/${heroAuction._id}`} className="bg-[#f26c0d] hover:bg-orange-600 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-1 inline-block">
                Place Your Bid
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Hot Auctions Section - Most Viewed */}
      <section className="max-w-[1440px] mx-auto w-full py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1c130d] flex items-center gap-3">
              Hot Auctions
              <span className="material-symbols-outlined text-red-500 animate-bounce">local_fire_department</span>
            </h2>
            <p className="text-[#9c6c49] mt-2 text-lg">Most viewed auctions right now.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {hotAuctions.length > 0 ? (
            hotAuctions.map((auction) => (
              <div key={auction._id} className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full transform hover:-translate-y-1">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">visibility</span> {auction.viewCount}
                    </span>
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url('${auction.images?.[0] || 'https://via.placeholder.com/400x300'}')` }}
                  ></div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <div className="text-xs font-bold text-orange-600 mb-2 uppercase tracking-wide">{auction.category}</div>
                  <h3 className="font-bold text-lg leading-tight text-[#1c130d] line-clamp-2 mb-3 h-[48px]">{auction.title}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current Price</p>
                      <p className="font-bold text-[#1c130d]">{formatCurrency(auction.currentPrice || auction.startPrice)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Time Left</p>
                      <p className="font-bold text-orange-600">{getTimeRemaining(auction.endTime)}</p>
                    </div>
                  </div>

                  <Link to={`/auction/${auction._id}`} className="mt-auto block w-full bg-gray-50 hover:bg-[#1c130d] hover:text-white text-[#1c130d] text-center py-3 rounded-lg font-bold text-sm transition-all duration-300 border border-gray-200 hover:border-transparent">
                    View Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">sentiment_dissatisfied</span>
              <p className="text-gray-500 text-lg">No hot auctions found.</p>
            </div>
          )}
        </div>
      </section>

      {/* Live Auctions Section */}
      <section className="max-w-[1440px] mx-auto w-full py-12 border-t border-gray-100">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1c130d] flex items-center gap-3">
              Live Auctions
              <span className="material-symbols-outlined text-green-500">sensors</span>
            </h2>
            <p className="text-[#9c6c49] mt-2 text-lg">Happening right now. Bid before it's too late!</p>
          </div>
          <Link to="/auction-list" className="hidden sm:flex items-center text-orange-600 font-bold hover:underline gap-1 group">
            View All Live Auctions
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeAuctions.length > 0 ? (
            activeAuctions.map((auction) => (
              <div key={auction._id} className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1 animate-pulse">LIVE</span>
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url('${auction.images?.[0] || 'https://via.placeholder.com/400x300'}')` }}
                  ></div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg leading-tight text-[#1c130d] line-clamp-1 mb-1">{auction.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#9c6c49] mb-4">
                    <span>{auction.category}</span> • <span>{auction.totalBids || 0} Bids</span>
                  </div>
                  <div className="mt-auto flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current Bid</p>
                      <p className="text-xl font-black text-orange-600">{formatCurrency(auction.currentPrice || auction.startPrice)}</p>
                    </div>
                  </div>
                  <Link to={`/auction/${auction._id}`} className="mt-4 block w-full bg-orange-50 hover:bg-orange-100 text-orange-600 text-center py-2.5 rounded-lg font-bold text-sm transition-colors border border-orange-100">
                    Bid Now
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-12 text-gray-500">No active auctions right now.</div>
          )}
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-[#f8f7f5] py-20 my-8 rounded-3xl mx-4 lg:mx-0">
        <div className="max-w-[1440px] mx-auto w-full px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#1c130d] mb-4">Why Choose BidMaster?</h2>
            <p className="text-gray-500">Experience the most secure, transparent, and exciting auction platform trusted by collectors worldwide.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-2 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[40px]">security</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c130d]">Secure Transactions</h3>
              <p className="text-gray-500 leading-relaxed">
                Every bid and transaction is protected by bank-grade security protocols. We ensure your funds and items are safe.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-2 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[40px]">verified</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c130d]">Verified Sellers</h3>
              <p className="text-gray-500 leading-relaxed">
                We rigorously vet all sellers to guarantee the authenticity of items. Bid with confidence knowing who you're buying from.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="size-20 bg-white rounded-2xl flex items-center justify-center text-orange-600 mb-2 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <span className="material-symbols-outlined text-[40px]">gavel</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c130d]">Fair Bidding System</h3>
              <p className="text-gray-500 leading-relaxed">
                Our anti-sniping technology and transparent bidding history ensure a fair chance for every participant to win.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Auctions */}
      <section className="max-w-[1440px] mx-auto w-full py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1c130d] flex items-center gap-3">
              Upcoming Auctions
              <span className="material-symbols-outlined text-blue-500">calendar_month</span>
            </h2>
            <p className="text-[#9c6c49] mt-2 text-lg">Preview and register for future events.</p>
          </div>
          <Link to="/upcoming" className="hidden sm:flex items-center text-orange-600 font-bold hover:underline gap-1 group">
            See Calendar <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAuctions.length > 0 ? (
            upcomingAuctions.map(auction => (
              <div key={auction._id} className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col h-full">
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">
                      {new Date(auction.startTime).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url('${auction.images?.[0] || 'https://via.placeholder.com/400x300'}')` }}
                  ></div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="text-sm text-orange-600 font-bold mb-2 uppercase tracking-wide">{auction.category}</div>
                  <h3 className="font-bold text-xl text-[#1c130d] mb-2 leading-tight line-clamp-2">{auction.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{auction.description}</p>
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-[#f4ece7]">
                    <div className="text-sm font-medium text-gray-900">
                      Starting: <span className="font-bold">{formatCurrency(auction.startPrice)}</span>
                    </div>
                    <Link to={`/auction/${auction._id}`} className="text-sm font-bold text-orange-600 border border-orange-600/30 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-300">
              <span className="material-symbols-outlined text-gray-400 text-6xl mb-4">event_busy</span>
              <p className="text-gray-500 text-lg">No upcoming auctions scheduled.</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/upcoming" className="inline-flex items-center text-orange-600 font-bold hover:underline gap-1">
            See Calendar <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
