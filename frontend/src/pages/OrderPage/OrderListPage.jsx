import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import orderService from '../../services/order.service';

const OrderListPage = ({ isEmbedded = false }) => {
    const [activeTab, setActiveTab] = useState('buying'); // 'buying' or 'selling'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const result = activeTab === 'buying'
                ? await orderService.getBuyingOrders()
                : await orderService.getSellingOrders();
            setOrders(result.data.orders);
            setPagination(result.data.pagination);
        } catch (error) {
            console.error('Failed to fetch orders', error);
        } finally {
            setLoading(false);
        }
    };

    const statusColors = {
        pending_payment: 'bg-yellow-100 text-yellow-800',
        paid: 'bg-blue-100 text-blue-800',
        shipping: 'bg-indigo-100 text-indigo-800',
        completed: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
        refunded: 'bg-gray-100 text-gray-800'
    };

    const statusLabels = {
        pending_payment: 'Chờ thanh toán',
        paid: 'Đã thanh toán',
        shipping: 'Đang giao hàng',
        completed: 'Hoàn tất',
        cancelled: 'Đã hủy',
        refunded: 'Hoàn tiền'
    };

    return (
        <div className={isEmbedded ? "w-full" : "container mx-auto px-4 py-8"}>
            {!isEmbedded && <h1 className="text-3xl font-bold mb-8">Đơn Hàng Của Tôi</h1>}

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'buying' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('buying')}
                >
                    Đơn Mua (Dành cho Bidder)
                    {activeTab === 'buying' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
                    )}
                </button>
                <button
                    className={`pb-4 px-6 font-medium text-sm transition-colors relative ${activeTab === 'selling' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
                    onClick={() => setActiveTab('selling')}
                >
                    Đơn Bán (Dành cho Seller)
                    {activeTab === 'selling' && (
                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-600 rounded-t-full"></span>
                    )}
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            ) : orders.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500 text-lg">Chưa có đơn hàng nào.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div key={order._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 transition hover:shadow-md">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">

                                {/* Auction Info */}
                                <div className="flex gap-4 items-center">
                                    <div className="h-16 w-16 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                                        {order.auctionId && order.auctionId.images && order.auctionId.images[0] ? (
                                            <img src={order.auctionId.images[0]} alt={order.auctionId.title} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center text-gray-400 text-xs">No Img</div>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900">
                                            {order.auctionId ? order.auctionId.title : 'Auction Deleted'}
                                        </h3>
                                        <p className="text-sm text-gray-500">Mã đơn: #{order._id.slice(-6).toUpperCase()}</p>
                                        <p className="text-sm text-gray-500">
                                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                                        </p>
                                    </div>
                                </div>

                                {/* Status & Price */}
                                <div className="flex flex-col items-end gap-2">
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status] || 'bg-gray-100'}`}>
                                        {statusLabels[order.status] || order.status}
                                    </span>
                                    <p className="text-indigo-600 font-bold text-xl">
                                        {order.finalPrice.toLocaleString('vi-VN')} đ
                                    </p>
                                    <Link
                                        to={`/orders/${order._id}`}
                                        className="inline-flex items-center text-indigo-600 hover:text-indigo-800 font-medium text-sm mt-1"
                                    >
                                        Xem chi tiết &rarr;
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderListPage;
