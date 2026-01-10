import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auctionAPI } from '../../services/api';

const HomePage = () => {
  const [activeAuctions, setActiveAuctions] = useState([]);
  const [upcomingAuctions, setUpcomingAuctions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, upcomingRes] = await Promise.all([
          auctionAPI.getActiveAuctions({ page: 1, limit: 4 }),
          auctionAPI.getAuctions({ page: 1, limit: 3, status: 'pending' }) // Assuming 'pending' is the status for upcoming
        ]);

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

  return (
    <main className="w-full flex flex-col min-w-0">
      {/* Hero Section */}
      <div className="relative w-full overflow-hidden bg-[#1c130d] rounded-xl my-6">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10"></div>
        <div
          className="h-[480px] w-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB-AbqajDCQX7o5jQRIv_yp4wBxOOHlakS5HmUeWK4KRxInsyz9Z3jnhjNv2Ck3BnPDNUsmz-YBzNffUAse0c_a1sf9EpY5UvIZNBUH2kgdaJalof6LPeGXHcEXQtJLy_TwyWiPvAFvxeAyOxRZCxuEc2w2jiZaOI_90veWICVYLZ_saRJKg0YpvQweKV4sz_i2drzbPvXEwk5voxWZgp5qTvx8BP22zw4HuTOdJFvldHr_odtVfyfJUjXbXWx0YkQQUV_gFiEGfD2W')" }}
        ></div>
        <div className="absolute inset-0 z-20 flex flex-col justify-center items-start px-4 md:px-8 max-w-[1440px] mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/90 px-4 py-1.5 text-xs font-bold text-white mb-6 uppercase tracking-wide backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse"></span>
            Featured Auction
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-4 max-w-3xl drop-shadow-lg">
            Exclusive Antique Watch Collection
          </h1>
          <p className="text-gray-200 text-lg sm:text-xl mb-8 max-w-2xl font-medium drop-shadow-sm leading-relaxed">
            Rare 19th-century timepieces ending soon. Don't miss your chance to own a piece of history.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-5 py-3 rounded-xl border border-white/20">
              <span className="material-symbols-outlined text-orange-500 text-[24px]">timer</span>
              <div>
                <span className="text-xs uppercase text-gray-300 font-bold tracking-wider block">Time Left</span>
                <span className="font-mono text-xl font-bold">02:14:55</span>
              </div>
            </div>
            <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3.5 rounded-xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-orange-500/30 transform hover:-translate-y-0.5">
              Place Your Bid
            </button>
          </div>
        </div>
      </div>

      {/* Hot Products Section */}
      <section className="max-w-[1440px] mx-auto w-full py-8 md:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1c130d] flex items-center gap-3">
              Hot Products
              <span className="material-symbols-outlined text-red-500">local_fire_department</span>
            </h2>
            <p className="text-[#9c6c49] mt-2 text-lg">Most active auctions happening right now.</p>
          </div>
          <Link to="/auction-list" className="hidden sm:flex items-center text-orange-600 font-bold hover:underline gap-1">
            View All Live Auctions <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-gray-200 h-[380px] rounded-xl"></div>
            ))
          ) : activeAuctions.length > 0 ? (
            activeAuctions.map((auction) => (
              <div key={auction.id} className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1">LIVE</span>
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url('${auction.images?.[0] || 'https://via.placeholder.com/400x300'}')` }}
                  ></div>
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg leading-tight text-[#1c130d] line-clamp-1 mb-1">{auction.title}</h3>
                  <div className="flex items-center gap-2 text-xs text-[#9c6c49] mb-4">
                    <span>{auction.category || 'General'}</span> • <span>{auction.totalBids || 0} Bids</span>
                  </div>
                  <div className="mt-auto flex justify-between items-end">
                    <div>
                      <p className="text-xs text-gray-500 mb-0.5">Current Bid</p>
                      <p className="text-xl font-black text-orange-600">{(auction.currentPrice || auction.startingPrice)?.toLocaleString('vi-VN')} VND</p>
                    </div>
                  </div>
                  <Link to={`/auction/${auction.id}`} className="mt-4 block w-full bg-orange-100 hover:bg-orange-200 text-orange-700 text-center py-2 rounded-lg font-bold text-sm transition-colors">
                    Bid Now
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 text-center py-10 text-gray-500">No active auctions right now.</div>
          )}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link to="/auction-list" className="inline-flex items-center text-orange-600 font-bold hover:underline gap-1">
            View All Live Auctions <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="bg-white border-y border-[#e5e7eb] py-20">
        <div className="max-w-[1440px] mx-auto w-full">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-[#1c130d] mb-4">Why Choose BidMaster?</h2>
            <p className="text-gray-500">Experience the most secure, transparent, and exciting auction platform trusted by collectors worldwide.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="size-20 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-2">
                <span className="material-symbols-outlined text-[40px]">security</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c130d]">Secure Transactions</h3>
              <p className="text-gray-500 leading-relaxed">
                Every bid and transaction is protected by bank-grade security protocols. We ensure your funds and items are safe.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="size-20 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-2">
                <span className="material-symbols-outlined text-[40px]">verified</span>
              </div>
              <h3 className="text-xl font-bold text-[#1c130d]">Verified Sellers</h3>
              <p className="text-gray-500 leading-relaxed">
                We rigorously vet all sellers to guarantee the authenticity of items. Bid with confidence knowing who you're buying from.
              </p>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="size-20 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-2">
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
          <Link to="/upcoming" className="hidden sm:flex items-center text-orange-600 font-bold hover:underline gap-1">
            See Calendar <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingAuctions.length > 0 ? (
            upcomingAuctions.map(auction => (
              <div key={auction.id} className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">Upcoming</span>
                  </div>
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500"
                    style={{ backgroundImage: `url('${auction.images?.[0] || 'https://via.placeholder.com/400x300'}')` }}
                  ></div>
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
                </div>
                <div className="p-6">
                  <div className="text-sm text-orange-600 font-bold mb-2">{auction.category}</div>
                  <h3 className="font-bold text-xl text-[#1c130d] mb-2 leading-tight">{auction.title}</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{auction.description}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#f4ece7]">
                    <div className="text-sm font-medium text-gray-900">
                      Starting: <span className="font-bold">{auction.startingPrice?.toLocaleString('vi-VN')} VND</span>
                    </div>
                    <button className="text-sm font-bold text-orange-600 border border-orange-600/30 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                      Register Interest
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Static fallback for Upcoming if no data found
            <>
              <div className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">In 2 Days</span>
                  </div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC3lOhq_3Y6OrfAix1xjc_nb_LlR4TQDtxBQWydEaqI0T0ttRqz3C2fi6m7w3Vo3d8bGgxZKsGKUL09yr-qJdb1D5lPBNON3EbSNIj3Q6-J8NTdGK3m4bc-1iyG8kBDOa3S0zVKTmA-y0yszjlpwtiGwK65D1QCRwz_fUT2MGrx_eoDWlAUQlSEaY7kmWyOoIILUi8ROpGkxTeYNFgzXlMHVE7si1vpp4H-fCu2HvAPDpZnqm1UYA7YMjbkx_pphC1sJ0Yvz0njcCDA')" }}></div>
                </div>
                <div className="p-6">
                  <div className="text-sm text-orange-600 font-bold mb-2">Real Estate</div>
                  <h3 className="font-bold text-xl text-[#1c130d] mb-2 leading-tight">Sea View Villa, Da Nang Coastline</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">A breathtaking modern villa overlooking the pristine beaches of Da Nang. Perfect for vacation or investment.</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#f4ece7]">
                    <div className="text-sm font-medium text-gray-900">Starting: <span className="font-bold">15.0B VND</span></div>
                    <button className="text-sm font-bold text-orange-600 border border-orange-600/30 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                      Register Interest
                    </button>
                  </div>
                </div>
              </div>

              <div className="group bg-white rounded-xl overflow-hidden border border-[#e5e7eb] hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 flex flex-col">
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  <div className="absolute top-3 left-3 z-10 flex gap-2">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wide">In 5 Days</span>
                  </div>
                  <div className="w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAYZabLZnfmJbiK4M603mKJ3uZOqqhqvstvcX2YhOKAmIsnhKQkmItUORFEDLvFNbgkIlpsuAy23VePWl3L9Rdlh1m01ItB-W3lkHwb0N3aTUbvweVqarahORGpeHaX0yKkBUkOF5hFIZ_j2xnerq0NUruvNYuv3MIwB2tibR22TqXlWPqRXv356szzQi94eqU_E4z_LSv8qSOmiKKK0-UruU5pdbnAfWjzyZuo0uTUR3e5e2JwiMAPFZWeGycHifeIJ1uaO9axmhVi')" }}></div>
                </div>
                <div className="p-6">
                  <div className="text-sm text-orange-600 font-bold mb-2">Art & Antiques</div>
                  <h3 className="font-bold text-xl text-[#1c130d] mb-2 leading-tight">Modern Abstract Collection</h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">Featuring "Urban Chaos" and other contemporary masterpieces by emerging Asian artists.</p>
                  <div className="flex items-center justify-between pt-4 border-t border-[#f4ece7]">
                    <div className="text-sm font-medium text-gray-900">Starting: <span className="font-bold">45.5M VND</span></div>
                    <button className="text-sm font-bold text-orange-600 border border-orange-600/30 hover:bg-orange-600 hover:text-white px-4 py-2 rounded-lg transition-all">
                      Register Interest
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default HomePage;
