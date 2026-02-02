import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import orderService from '../../services/order.service';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetailPage = () => {
    const { id } = useParams();
    const { user: currentUser } = useAuth();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [msgContent, setMsgContent] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchOrderDetails();

        // Simple polling for new messages every 10 seconds
        const interval = setInterval(fetchOrderDetails, 10000);
        return () => clearInterval(interval);
    }, [id]);

    useEffect(() => {
        scrollToBottom();
    }, [order?.messages]);

    const fetchOrderDetails = async () => {
        try {
            const result = await orderService.getOrderById(id);
            setOrder(result.data);
            setLoading(false);
        } catch (error) {
            console.error('Failed to fetch order details', error);
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!msgContent.trim()) return;

        try {
            await orderService.sendMessage(id, msgContent);
            setMsgContent('');
            fetchOrderDetails(); // Refresh immediately
        } catch (error) {
            console.error('Failed to send message', error);
            alert('Gửi tin nhắn thất bại');
        }
    };

    if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>;
    if (!order) return <div className="text-center p-10">Đơn hàng không tồn tại</div>;

    const isBuyer = currentUser && currentUser.id === order.buyerId;
    const otherPartyName = isBuyer ? 'Người bán' : 'Người mua';

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6">
                <Link to="/orders" className="text-indigo-600 hover:text-indigo-800 font-medium">&larr; Quay lại danh sách</Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Order Info & Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Thông tin đơn hàng</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Mã đơn:</span>
                                <span className="font-mono font-medium">#{order._id.slice(-6).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Trạng thái:</span>
                                <span className="font-medium capitalize">{order.status.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Ngày tạo:</span>
                                <span>{new Date(order.createdAt).toLocaleString('vi-VN')}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-gray-800 font-semibold">Tổng tiền:</span>
                                <span className="text-xl font-bold text-indigo-600">{order.finalPrice.toLocaleString('vi-VN')} đ</span>
                            </div>
                        </div>

                        {/* Action Buttons Placeholder */}
                        {isBuyer && order.status === 'pending_payment' && (
                            <button className="w-full mt-6 bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 font-medium transition">
                                Thanh Toán Ngay
                            </button>
                        )}
                        {!isBuyer && order.status === 'paid' && (
                            <button className="w-full mt-6 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 font-medium transition">
                                Xác nhận giao hàng
                            </button>
                        )}
                    </div>

                    {/* Auction Snippet */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h3 className="font-semibold mb-3 text-gray-800">Sản phẩm đấu giá</h3>
                        <div className="flex gap-3">
                            <div className="h-20 w-20 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                                {order.auctionId?.images?.[0] && (
                                    <img src={order.auctionId.images[0]} alt="" className="w-full h-full object-cover" />
                                )}
                            </div>
                            <div>
                                <Link to={`/auctions/${order.auctionId?._id}`} className="text-indigo-600 hover:underline font-medium line-clamp-2">
                                    {order.auctionId?.title || 'Unknown Product'}
                                </Link>
                                <p className="text-xs text-gray-500 mt-1">Kết thúc: {new Date(order.auctionId?.endTime).toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Chat */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-[600px] flex flex-col">
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center rounded-t-lg">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                    {otherPartyName[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">{otherPartyName}</h3>
                                    <p className="text-xs text-green-600 flex items-center gap-1">
                                        <span className="block h-2 w-2 rounded-full bg-green-500"></span> Online
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                            {order.messages.map((msg, index) => {
                                const isMe = msg.senderId === currentUser?.id;
                                return (
                                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                            ? 'bg-indigo-600 text-white rounded-br-none'
                                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                                            }`}>
                                            <p>{msg.content}</p>
                                            <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-indigo-200' : 'text-gray-400'}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            {order.messages.length === 0 && (
                                <div className="text-center text-gray-400 mt-10">
                                    Bắt đầu cuộc trò chuyện với {otherPartyName}...
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Chat Input */}
                        <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <input
                                    type="text"
                                    value={msgContent}
                                    onChange={(e) => setMsgContent(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    disabled={!msgContent.trim()}
                                    className="bg-indigo-600 text-white rounded-full p-2 px-6 font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    Gửi
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default OrderDetailPage;
