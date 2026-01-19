import React from 'react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const AuctionCard = ({ auction }) => {
    const isLive = auction.status === 'active';
    const isUpcoming = auction.status === 'pending';
    const isEnded = auction.status === 'ended';

    const formatPrice = (price) => {
        return price?.toLocaleString('vi-VN') + ' đ';
    };

    const getTimeRemaining = () => {
        if (!isLive) return null;
        try {
            return formatDistanceToNow(new Date(auction.endTime), { locale: vi });
        } catch (e) {
            return 'N/A';
        }
    };

    return (
        <div className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-xl transition-all h-full">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                <div className={`absolute top-3 left-3 z-10 flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider shadow-sm ${isLive ? 'bg-emerald-500' : isEnded ? 'bg-gray-500' : 'bg-blue-500'
                    }`}>
                    {isLive ? (
                        <>
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            LIVE
                        </>
                    ) : isEnded ? 'ĐÃ KẾT THÚC' : 'SẮP DIỄN RA'}
                </div>

                <img
                    src={auction.images?.[0] || 'https://via.placeholder.com/400x300'}
                    alt={auction.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {isLive && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="flex items-center gap-2 text-white">
                            <span className="material-symbols-outlined text-xs">timer</span>
                            <span className="text-xs font-bold tabular-nums">
                                {getTimeRemaining()}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-1 flex-col p-4">
                <div className="mb-2">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest block mb-1 truncate">{auction.category}</span>
                    <h3 className="text-base font-bold leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors text-gray-900 min-h-[2.5em]" title={auction.title}>
                        {auction.title}
                    </h3>
                </div>

                <div className="mt-auto pt-3 border-t border-gray-100">
                    <div className="flex items-end justify-between mb-3">
                        <div className="flex-1 min-w-0 mr-2">
                            <p className="text-[10px] font-bold text-gray-500 uppercase truncate">{isLive ? 'Giá hiện tại' : 'Khởi điểm'}</p>
                            <p className="text-lg font-black text-orange-600 truncate" title={formatPrice(auction.currentPrice || auction.startingPrice)}>
                                {formatPrice(auction.currentPrice || auction.startingPrice)}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link
                            to={`/auction/${auction.id}`}
                            className={`flex-1 flex items-center justify-center rounded-lg py-2 text-sm font-bold transition-all border ${(isLive || isUpcoming)
                                    ? 'bg-white text-orange-600 border-orange-600 hover:bg-orange-50'
                                    : 'bg-orange-600 hover:bg-orange-700 text-white border-transparent w-full'
                                }`}
                        >
                            Xem chi tiết
                        </Link>

                        {(isLive || isUpcoming) && (
                            <Link
                                to={`/auction/${auction.id}`}
                                className="flex-1 flex items-center justify-center bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2 text-sm font-bold transition-all shadow-md shadow-orange-200"
                            >
                                Đăng ký phiên
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuctionCard;
