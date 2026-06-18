import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import {
    ShieldAlert, Play, CheckCircle2, XCircle, Info, Lock,
    RefreshCw, AlertTriangle, Code, Wallet, Gavel, History, Terminal
} from 'lucide-react';

const AUTH_BASE_URL = 'http://localhost:3001/api/auth';
const PAYMENT_BASE_URL = 'http://localhost:3006/api/wallet';
const AUCTION_BASE_URL = 'http://localhost:3002/api/auctions';
const SOCKET_URL = 'http://localhost:3003';

export default function SecurityDemo() {
    const [activeDemo, setActiveDemo] = useState('wallet'); // 'wallet' or 'bidding'
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const logContainerRef = useRef(null);

    // Wallet Demo State
    const [walletStep, setWalletStep] = useState(0); // 0: Idle, 1: Registering, 2: Depositing, 3: Executing Concurrency, 4: Finished
    const [walletUser, setWalletUser] = useState(null);
    const [walletBalance, setWalletBalance] = useState(0);
    const [withdrawalResults, setWithdrawalResults] = useState([]);
    const [finalDbBalance, setFinalDbBalance] = useState(null);

    // Bidding Demo State
    const [biddingStep, setBiddingStep] = useState(0); // 0: Idle, 1: Creating Accounts, 2: Creating Auction, 3: Connecting Sockets, 4: Executing Bids, 5: Finished
    const [auctionData, setAuctionData] = useState(null);
    const [bidResults, setBidResults] = useState([]);
    const [bidHistory, setBidHistory] = useState([]);

    // Code panel toggle
    const [showSolution, setShowSolution] = useState(false);

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(new Date().getMilliseconds()).padStart(3, '0');
        setLogs(prev => [...prev, { time, message, type }]);
    };

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const clearDemo = () => {
        setLogs([]);
        setWithdrawalResults([]);
        setBidResults([]);
        setBidHistory([]);
        setWalletStep(0);
        setBiddingStep(0);
        setIsRunning(false);
        setFinalDbBalance(null);
        setAuctionData(null);
    };

    // --- DEMO 1: WALLET RACE CONDITION ---
    const runWalletDemo = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setLogs([]);
        setWithdrawalResults([]);
        setWalletStep(1);
        addLog('=== BẮT ĐẦU THỬ NGHIỆM WALLET CONCURRENCY ===', 'warning');

        try {
            // Step 1: Register and login temporary user
            const randomSuffix = Math.floor(Math.random() * 100000);
            const email = `demo_wallet_${randomSuffix}@gmail.com`;
            const password = 'Password123';
            const fullName = `Demo Wallet User ${randomSuffix}`;

            addLog(`Đang đăng ký tài khoản bidder thử nghiệm: ${email}...`);
            const regRes = await axios.post(`${AUTH_BASE_URL}/register`, {
                email, password, fullName, phone: '0912345678', role: 'bidder'
            });

            if (!regRes.data.success) {
                throw new Error('Đăng ký tài khoản thất bại: ' + regRes.data.message);
            }
            addLog('✅ Đăng ký tài khoản thành công.', 'success');

            addLog('Đang đăng nhập để lấy JWT Token...');
            const loginRes = await axios.post(`${AUTH_BASE_URL}/login`, { email, password });
            const token = loginRes.data.data.accessToken;
            const authHeaders = {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            };
            addLog('✅ Đăng nhập thành công, đã lưu JWT token.', 'success');

            // Wait a moment for database sync between Auth and Payment DB
            addLog('Đang đồng bộ cơ sở dữ liệu Payment Service (chờ 1 giây)...');
            await new Promise(r => setTimeout(r, 1000));

            // Check balance
            const balRes = await axios.get(`${PAYMENT_BASE_URL}/balance`, authHeaders);
            const initialBalance = balRes.data.data.balance;
            addLog(`Số dư tài khoản ban đầu: ${initialBalance.toLocaleString('vi-VN')} VND`);

            // Step 2: Deposit 100,000 VND
            setWalletStep(2);
            const depositAmount = 100000;
            addLog(`Đang gửi yêu cầu nạp ${depositAmount.toLocaleString('vi-VN')} VND...`);
            const depRes = await axios.post(`${PAYMENT_BASE_URL}/deposit`, { amount: depositAmount }, authHeaders);
            const newBal = depRes.data.data.newBalance;
            addLog(`✅ Nạp tiền thành công. Số dư mới: ${newBal.toLocaleString('vi-VN')} VND`, 'success');
            setWalletBalance(newBal);

            // Step 3: Trigger 5 Concurrent Withdrawals of 80,000 VND
            setWalletStep(3);
            const withdrawAmount = 80000;
            const requestsCount = 5;
            addLog(`⚠️ Gửi đồng thời ${requestsCount} yêu cầu rút ${withdrawAmount.toLocaleString('vi-VN')} VND`, 'warning');
            addLog(`Tổng số tiền muốn rút: ${(withdrawAmount * requestsCount).toLocaleString('vi-VN')} VND (Số dư thực tế: ${newBal.toLocaleString('vi-VN')} VND)`);

            const promises = Array.from({ length: requestsCount }).map(async (_, index) => {
                const reqNum = index + 1;
                const sentTime = Date.now();
                const sentTimeStr = new Date(sentTime).toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(sentTime % 1000).padStart(3, '0');

                addLog(`[Request #${reqNum}] Đã gửi lên Gateway lúc ${sentTimeStr}...`);
                try {
                    const res = await axios.post(`${PAYMENT_BASE_URL}/withdraw`, { amount: withdrawAmount }, authHeaders);
                    const recvTime = Date.now();
                    const duration = recvTime - sentTime;

                    return {
                        reqNum,
                        sentTimeStr,
                        duration,
                        status: res.status,
                        success: res.data.success,
                        message: 'Rút tiền thành công!',
                        newBalance: res.data.data.newBalance
                    };
                } catch (err) {
                    const recvTime = Date.now();
                    const duration = recvTime - sentTime;
                    const resData = err.response?.data || {};

                    return {
                        reqNum,
                        sentTimeStr,
                        duration,
                        status: err.response?.status || 500,
                        success: false,
                        message: resData.message || 'Lỗi hệ thống hoặc Số dư không đủ',
                        newBalance: null
                    };
                }
            });

            const results = await Promise.all(promises);
            setWithdrawalResults(results);

            // Print summary in terminal logs
            results.forEach(res => {
                if (res.success) {
                    addLog(`[Request #${res.reqNum}] THÀNH CÔNG (${res.duration}ms): Đã rút ${withdrawAmount.toLocaleString('vi-VN')} VND. Số dư trả về: ${res.newBalance.toLocaleString('vi-VN')} VND`, 'success');
                } else {
                    addLog(`[Request #${res.reqNum}] THẤT BẠI (${res.duration}ms): ${res.message} (HTTP ${res.status})`, 'error');
                }
            });

            // Step 4: Verify Final Balance in DB
            setWalletStep(4);
            addLog('Đang truy vấn số dư ví cuối cùng trong Database để đối chứng...');
            const finalBalRes = await axios.get(`${PAYMENT_BASE_URL}/balance`, authHeaders);
            const actualDbBalance = finalBalRes.data.data.balance;
            setFinalDbBalance(actualDbBalance);

            addLog(`=== KẾT QUẢ ĐỐI CHIẾU ===`, 'warning');
            addLog(`Số dư thực tế trong DB: ${actualDbBalance.toLocaleString('vi-VN')} VND`);

            const totalSucceeded = results.filter(r => r.success).length;
            addLog(`Tổng số giao dịch thành công: ${totalSucceeded}/${requestsCount}`);

            if (totalSucceeded > 1) {
                addLog(`❌ CẢNH BÁO BẢO MẬT: Phát hiện Race Condition! Người dùng đã rút thành công ${totalSucceeded} lần (Tổng rút: ${(withdrawAmount * totalSucceeded).toLocaleString('vi-VN')} VND) vượt quá số dư thực tế ban đầu!`, 'error');
            } else {
                addLog(`✅ HỆ THỐNG AN TOÀN: Chỉ có duy nhất 1 giao dịch được phê duyệt thành công, các giao dịch song song khác bị chặn vì không đủ số dư.`, 'success');
            }

        } catch (error) {
            addLog(`Lỗi thực thi thử nghiệm: ${error.message}`, 'error');
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    };

    // --- DEMO 2: BIDDING RACE CONDITION ---
    const runBiddingDemo = async () => {
        if (isRunning) return;
        setIsRunning(true);
        setLogs([]);
        setBidResults([]);
        setBidHistory([]);
        setBiddingStep(1);
        addLog('=== BẮT ĐẦU THỬ NGHIỆM BIDDING REALTIME CONCURRENCY ===', 'warning');

        let sockets = [];

        try {
            // Step 1: Create accounts
            const randomSuffix = Math.floor(Math.random() * 100000);
            const sellerEmail = `demo_seller_${randomSuffix}@gmail.com`;
            const b1Email = `demo_b1_${randomSuffix}@gmail.com`;
            const b2Email = `demo_b2_${randomSuffix}@gmail.com`;
            const b3Email = `demo_b3_${randomSuffix}@gmail.com`;
            const password = 'Password123';

            addLog('Đang tạo tự động các tài khoản thử nghiệm...');
            const registerAccount = async (email, fullName, role) => {
                await axios.post(`${AUTH_BASE_URL}/register`, { email, password, fullName, phone: '0912345678', role });
                const loginRes = await axios.post(`${AUTH_BASE_URL}/login`, { email, password });
                return loginRes.data.data.accessToken;
            };

            const sellerToken = await registerAccount(sellerEmail, 'Demo Seller', 'seller');
            addLog('✅ Đã tạo tài khoản Seller.', 'success');

            const b1Token = await registerAccount(b1Email, 'Bidder A', 'bidder');
            const b2Token = await registerAccount(b2Email, 'Bidder B', 'bidder');
            const b3Token = await registerAccount(b3Email, 'Bidder C', 'bidder');
            addLog('✅ Đã tạo 3 tài khoản Bidder A, B, C.', 'success');

            // Wait a moment for database sync
            addLog('Đang đồng bộ cơ sở dữ liệu (chờ 1 giây)...');
            await new Promise(r => setTimeout(r, 1000));

            // Step 2: Create a Test Auction
            setBiddingStep(2);
            addLog('Seller đang tạo một phiên đấu giá mới...');
            const startTime = new Date(Date.now() + 2000).toISOString();
            const endTime = new Date(Date.now() + 3600 * 1000).toISOString();

            const auctionRes = await axios.post(
                `${AUCTION_BASE_URL}/`,
                {
                    title: `Sản phẩm stress-test race condition ${randomSuffix}`,
                    description: 'Sản phẩm demo concurrency cho môn bảo mật',
                    category: 'electronics',
                    startPrice: 100000,
                    minBidIncrement: 10000,
                    startTime,
                    endTime,
                    images: ['https://via.placeholder.com/150']
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sellerToken}`
                    }
                }
            );

            if (!auctionRes.data.success) {
                throw new Error('Tạo phiên đấu giá thất bại: ' + auctionRes.data.message);
            }

            const auction = auctionRes.data.data;
            const auctionId = auction.id || auction._id;
            setAuctionData(auction);
            addLog(`✅ Tạo phiên đấu giá thành công! ID: ${auctionId}`, 'success');
            addLog(`Giá khởi điểm: 100,000 VND. Bước nhảy giá: 10,000 VND.`);
            addLog('Chờ 3 giây để phiên đấu giá chính thức mở trạng thái ACTIVE...');
            await new Promise(r => setTimeout(r, 3000));

            // Step 3: Connect Sockets
            setBiddingStep(3);
            addLog('Khởi tạo 3 kết nối WebSocket song song đại diện cho 3 Bidder...');

            const connectSingleSocket = (token, bidderName) => {
                return new Promise((resolve, reject) => {
                    const socket = io(SOCKET_URL, {
                        transports: ['websocket'],
                        auth: { token }
                    });

                    socket.on('connect', () => {
                        addLog(`[${bidderName}] WebSocket Connected: ${socket.id}`, 'success');
                        resolve(socket);
                    });

                    socket.on('connect_error', (err) => {
                        reject(new Error(`[${bidderName}] Connection error: ${err.message}`));
                    });
                });
            };

            const sA = await connectSingleSocket(b1Token, 'Bidder A');
            const sB = await connectSingleSocket(b2Token, 'Bidder B');
            const sC = await connectSingleSocket(b3Token, 'Bidder C');
            sockets = [sA, sB, sC];

            addLog('Đang tham gia vào phòng đấu giá (Join Room)...');
            const joinRoom = (socket, name) => {
                return new Promise((resolve) => {
                    socket.emit('auction:join', { auctionId });
                    socket.once('auction:joined', (data) => {
                        addLog(`[${name}] Đã join room đấu giá thành công.`);
                        resolve(data);
                    });
                });
            };

            await Promise.all([
                joinRoom(sA, 'Bidder A'),
                joinRoom(sB, 'Bidder B'),
                joinRoom(sC, 'Bidder C')
            ]);

            // Step 4: Emit place bids concurrently
            setBiddingStep(4);
            const bidAmount = 110000; // Khởi điểm 100k + Increment 10k
            addLog(`⚠️ ĐANG PHÁT ĐỒNG THỜI 3 LƯỢT ĐẶT GIÁ: ${bidAmount.toLocaleString('vi-VN')} VND...`, 'warning');

            const placeBidSocket = (socket, name) => {
                return new Promise((resolve) => {
                    const sentTime = Date.now();
                    const sentTimeStr = new Date(sentTime).toLocaleTimeString('vi-VN', { hour12: false }) + '.' + String(sentTime % 1000).padStart(3, '0');

                    socket.emit('bid:place', { auctionId, amount: bidAmount });

                    const successHandler = (data) => {
                        const recvTime = Date.now();
                        socket.off('bid:success', successHandler);
                        socket.off('bid:error', errorHandler);
                        resolve({
                            name,
                            sentTimeStr,
                            duration: recvTime - sentTime,
                            success: true,
                            message: data.message || 'Đặt giá thành công'
                        });
                    };

                    const errorHandler = (data) => {
                        const recvTime = Date.now();
                        socket.off('bid:success', successHandler);
                        socket.off('bid:error', errorHandler);
                        resolve({
                            name,
                            sentTimeStr,
                            duration: recvTime - sentTime,
                            success: false,
                            message: data.message || 'Lỗi đặt giá'
                        });
                    };

                    socket.once('bid:success', successHandler);
                    socket.once('bid:error', errorHandler);
                });
            };

            const results = await Promise.all([
                placeBidSocket(sA, 'Bidder A'),
                placeBidSocket(sB, 'Bidder B'),
                placeBidSocket(sC, 'Bidder C')
            ]);
            setBidResults(results);

            results.forEach(r => {
                if (r.success) {
                    addLog(`[${r.name}] ĐẶT GIÁ THÀNH CÔNG (${r.duration}ms): Ghi nhận lượt bid.`, 'success');
                } else {
                    addLog(`[${r.name}] THẤT BẠI (${r.duration}ms): ${r.message}`, 'error');
                }
            });

            // Step 5: Read History from redis socket endpoint
            setBiddingStep(5);
            addLog('Đang lấy lịch sử đấu giá được ghi nhận từ Redis Sorted Set...');

            const getHistory = (socket) => {
                return new Promise((resolve) => {
                    socket.emit('bid:history', { auctionId, limit: 10 });
                    socket.once('bid:history:response', (data) => {
                        resolve(data.bids || []);
                    });
                });
            };

            const history = await getHistory(sA);
            setBidHistory(history);

            addLog('=== LỊCH SỬ ĐẤU GIÁ GHI NHẬN TRÊN REDIS ===', 'warning');
            history.forEach((bid, idx) => {
                addLog(`#${idx + 1}: Bidder: ${bid.bidderName} - Số tiền: ${bid.amount.toLocaleString('vi-VN')} VND - Lúc: ${new Date(bid.timestamp).toLocaleTimeString('vi-VN')}`);
            });

            const successCount = results.filter(r => r.success).length;
            addLog(`=== TỔNG KẾT ===`, 'warning');
            addLog(`Tổng số lượt đặt giá thành công ở mức ${bidAmount.toLocaleString('vi-VN')} VND: ${successCount}/3`);

            if (successCount > 1) {
                addLog(`❌ CẢNH BÁO BẢO MẬT: Phát hiện Race Condition! Có ${successCount} lượt đặt giá thành công ở cùng mức ${bidAmount.toLocaleString('vi-VN')} VND, phá vỡ bước giá tối thiểu!`, 'error');
            } else {
                addLog(`✅ HỆ THỐNG AN TOÀN: Chỉ có duy nhất 1 lượt bid thành công ở mức ${bidAmount.toLocaleString('vi-VN')} VND, các lượt khác bị chặn.`, 'success');
            }

        } catch (error) {
            addLog(`Lỗi thử nghiệm đấu giá: ${error.message}`, 'error');
            console.error(error);
        } finally {
            // Cleanup Sockets
            addLog('Ngắt toàn bộ kết nối WebSocket client thử nghiệm...');
            sockets.forEach(s => {
                if (s && s.connected) s.disconnect();
            });
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-screen text-slate-800 p-6 flex flex-col gap-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Bảng Mô Phỏng & Thử Nghiệm Concurrency</h1>
                        <p className="text-sm text-slate-500 mt-1">Mô phỏng lỗ hổng bảo mật Race Condition liên quan đến Giao dịch ví tiền và Đấu giá thời gian thực.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setActiveDemo('wallet'); clearDemo(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeDemo === 'wallet' ? 'bg-orange-500 text-white shadow-md shadow-orange-150' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        <Wallet size={16} />
                        Lỗ hổng Wallet
                    </button>
                    <button
                        onClick={() => { setActiveDemo('bidding'); clearDemo(); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${activeDemo === 'bidding' ? 'bg-orange-500 text-white shadow-md shadow-orange-150' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                    >
                        <Gavel size={16} />
                        Lỗ hổng Bidding
                    </button>
                </div>
            </div>

            {/* Main Interactive Board */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Control Panel & Visualization */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    {/* Active Demo Board */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between border-b border-slate-150 pb-4">
                            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                {activeDemo === 'wallet' ? <Wallet className="text-orange-500" /> : <Gavel className="text-orange-500" />}
                                {activeDemo === 'wallet' ? 'Mô phỏng lỗ hổng rút tiền (Double Spend)' : 'Mô phỏng đặt giá trùng lặp (Bidding Race)'}
                            </h2>
                            <button
                                onClick={activeDemo === 'wallet' ? runWalletDemo : runBiddingDemo}
                                disabled={isRunning}
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                                Kích hoạt mô phỏng
                            </button>
                        </div>

                        {/* Wallet Demo Status Steps */}
                        {activeDemo === 'wallet' && (
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-500 border border-slate-150">
                                <span className={walletStep >= 1 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {walletStep >= 1 ? '●' : '○'} 1. Đăng ký & Auth
                                </span>
                                <span>→</span>
                                <span className={walletStep >= 2 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {walletStep >= 2 ? '●' : '○'} 2. Nạp 100k
                                </span>
                                <span>→</span>
                                <span className={walletStep >= 3 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {walletStep >= 3 ? '●' : '○'} 3. Rút 5 x 80k
                                </span>
                                <span>→</span>
                                <span className={walletStep >= 4 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {walletStep >= 4 ? '●' : '○'} 4. Đối chiếu DB
                                </span>
                            </div>
                        )}

                        {/* Bidding Demo Status Steps */}
                        {activeDemo === 'bidding' && (
                            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl text-xs font-semibold text-slate-500 border border-slate-150">
                                <span className={biddingStep >= 1 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {biddingStep >= 1 ? '●' : '○'} 1. Tạo Users
                                </span>
                                <span>→</span>
                                <span className={biddingStep >= 2 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {biddingStep >= 2 ? '●' : '○'} 2. Tạo Đấu giá
                                </span>
                                <span>→</span>
                                <span className={biddingStep >= 3 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {biddingStep >= 3 ? '●' : '○'} 3. Mở Sockets
                                </span>
                                <span>→</span>
                                <span className={biddingStep >= 4 ? 'text-orange-600 flex items-center gap-1' : ''}>
                                    {biddingStep >= 4 ? '●' : '○'} 4. Bid Song song
                                </span>
                            </div>
                        )}

                        {/* Description */}
                        <div className="text-sm text-slate-600 leading-relaxed bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-start gap-3">
                            <Info className="text-orange-500 shrink-0 mt-0.5" size={18} />
                            <div>
                                {activeDemo === 'wallet' ? (
                                    <p>
                                        <strong>Mô tả kịch bản:</strong> Người dùng có số dư ban đầu 100,000 VND. Hệ thống sẽ bắn đồng thời 5 yêu cầu rút 80,000 VND bằng API. Nếu không được khóa an toàn (Concurrency control), hệ thống sẽ phê duyệt nhiều yêu cầu, khiến tài khoản rút quá số dư thực tế.
                                    </p>
                                ) : (
                                    <p>
                                        <strong>Mô tả kịch bản:</strong> 3 Bidder khác nhau cùng lúc gửi yêu cầu đấu giá ở mức 110,000 VND (bước giá tối thiểu) trên sản phẩm có giá hiện tại là 100,000 VND. Phiên đấu giá an toàn chỉ cho phép tối đa 1 người thắng ở mức giá này, người tiếp theo bắt buộc phải tăng lên mức tiếp theo (ít nhất 120,000 VND).
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Interactive Result Renderings */}
                        {activeDemo === 'wallet' && withdrawalResults.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-slate-900">Chi tiết kết quả các yêu cầu song song:</h3>
                                <div className="overflow-x-auto border border-slate-150 rounded-xl">
                                    <table className="w-full text-left border-collapse text-xs">
                                        <thead className="bg-slate-50 font-bold border-b border-slate-150 text-slate-700">
                                            <tr>
                                                <th className="p-3">Yêu cầu</th>
                                                <th className="p-3">Thời gian gửi</th>
                                                <th className="p-3">Độ trễ</th>
                                                <th className="p-3">HTTP Code</th>
                                                <th className="p-3">Trạng thái phản hồi</th>
                                                <th className="p-3">Số dư sau GD</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {withdrawalResults.map(res => (
                                                <tr key={res.reqNum} className="hover:bg-slate-50">
                                                    <td className="p-3 font-semibold">Request #{res.reqNum}</td>
                                                    <td className="p-3 font-mono">{res.sentTimeStr}</td>
                                                    <td className="p-3 text-slate-500">{res.duration}ms</td>
                                                    <td className="p-3 font-mono">{res.status}</td>
                                                    <td className="p-3">
                                                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${res.success ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
                                                            {res.success ? 'Thành công' : 'Thất bại'}
                                                        </span>
                                                        <span className="block text-[10px] text-slate-400 mt-0.5">{res.message}</span>
                                                    </td>
                                                    <td className="p-3 font-mono font-bold text-slate-700">
                                                        {res.newBalance !== null ? `${res.newBalance.toLocaleString()}đ` : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Comparison State */}
                                {finalDbBalance !== null && (
                                    <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${withdrawalResults.filter(r => r.success).length > 1 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                                        <div className="flex items-center gap-3">
                                            {withdrawalResults.filter(r => r.success).length > 1 ? <AlertTriangle className="text-rose-600 shrink-0" size={24} /> : <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />}
                                            <div>
                                                <h4 className="font-bold text-sm">
                                                    {withdrawalResults.filter(r => r.success).length > 1 ? '⚠️ PHÁT HIỆN LỖ HỔNG RACE CONDITION!' : '✅ HỆ THỐNG GIAO DỊCH AN TOÀN'}
                                                </h4>
                                                <p className="text-xs mt-1 text-slate-600">
                                                    {withdrawalResults.filter(r => r.success).length > 1
                                                        ? `Số dư ví chỉ nạp 100,000 VND nhưng bạn đã rút thành công ${withdrawalResults.filter(r => r.success).length} lần (Tổng rút: ${(withdrawalResults.filter(r => r.success).length * 80000).toLocaleString()} VND). Số dư cuối cùng trong DB thực tế bị âm hoặc sai lệch còn: ${finalDbBalance.toLocaleString('vi-VN')} VND.`
                                                        : `Gửi 5 request đồng thời nhưng chỉ có 1 request được hệ thống chấp nhận thành công. Các request còn lại bị từ chối chính xác vì tài khoản không đủ số dư. Số dư cuối cùng còn lại trong DB: ${finalDbBalance.toLocaleString('vi-VN')} VND.`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Bidding Demo Results */}
                        {activeDemo === 'bidding' && bidResults.length > 0 && (
                            <div className="flex flex-col gap-4">
                                <h3 className="text-sm font-bold text-slate-900 font-sans">Chi tiết đặt giá Realtime của 3 Bidder:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {bidResults.map((res, i) => (
                                        <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 ${res.success ? 'bg-green-50 border-green-200' : 'bg-rose-50 border-rose-200'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold text-xs uppercase text-slate-500">{res.name}</span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${res.success ? 'bg-green-200 text-green-800' : 'bg-rose-200 text-rose-800'}`}>
                                                    {res.success ? 'Đặt thành công' : 'Thất bại'}
                                                </span>
                                            </div>
                                            <div className="flex flex-col font-mono text-xs text-slate-600 mt-1">
                                                <span>Thời gian: {res.sentTimeStr}</span>
                                                <span>Phản hồi: {res.duration}ms</span>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-1">{res.message}</p>
                                        </div>
                                    ))}
                                </div>

                                {bidHistory.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-3">
                                        <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
                                            <History size={14} /> Lịch sử đặt giá được ghi nhận trên Redis cache:
                                        </h4>
                                        <div className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs border border-slate-800 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                            {bidHistory.map((bid, i) => (
                                                <div key={i} className="flex justify-between border-b border-slate-900 pb-1">
                                                    <span className="text-orange-400">#Lượt {bidHistory.length - i}: {bid.bidderName}</span>
                                                    <span className="text-emerald-400 font-bold">{bid.amount.toLocaleString()} VND</span>
                                                    <span className="text-slate-500 text-[10px]">{new Date(bid.timestamp).toLocaleTimeString()}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${bidResults.filter(r => r.success).length > 1 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                                            <div className="flex items-center gap-3">
                                                {bidResults.filter(r => r.success).length > 1 ? <AlertTriangle className="text-rose-600 shrink-0" size={24} /> : <CheckCircle2 className="text-emerald-600 shrink-0" size={24} />}
                                                <div>
                                                    <h4 className="font-bold text-sm">
                                                        {bidResults.filter(r => r.success).length > 1 ? '⚠️ PHÁT HIỆN LỖ HỔNG RACE CONDITION!' : '✅ PHIÊN ĐẤU GIÁ AN TOÀN'}
                                                    </h4>
                                                    <p className="text-xs mt-1 text-slate-600">
                                                        {bidResults.filter(r => r.success).length > 1
                                                            ? `Có ${bidResults.filter(r => r.success).length} người cùng thắng ở mức giá 110,000 VND. Điều này phá vỡ luật bước giá tối thiểu (đáng lẽ lượt bid thứ 2 phải ở mức tối thiểu 120,000 VND).`
                                                            : `Gửi 3 yêu cầu cùng lúc nhưng chỉ có duy nhất 1 lượt bid thành công ở mức 110,000 VND. Các lượt bid còn lại gửi song song đều bị chặn do không đạt được Distributed Lock.`
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Console Log box & Solutions Panel */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Live console terminal */}
                    <div className="bg-slate-900 rounded-2xl shadow-sm border border-slate-800 flex flex-col overflow-hidden">
                        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between text-slate-400">
                            <span className="text-xs font-bold font-mono flex items-center gap-2">
                                <Terminal size={14} className="text-green-500" />
                                CONSOLE SIMULATION LOGS
                            </span>
                            <button
                                onClick={() => setLogs([])}
                                className="text-[10px] bg-slate-850 hover:bg-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded"
                            >
                                Clear
                            </button>
                        </div>
                        <div
                            ref={logContainerRef}
                            className="p-4 font-mono text-xs h-60 overflow-y-auto flex flex-col gap-1 text-slate-300"
                        >
                            {logs.length === 0 ? (
                                <span className="text-slate-500 italic">Nhấn nút "Kích hoạt mô phỏng" để bắt đầu ghi logs mô phỏng từ Gateway...</span>
                            ) : (
                                logs.map((log, index) => {
                                    let color = 'text-slate-300';
                                    if (log.type === 'success') color = 'text-green-400';
                                    if (log.type === 'error') color = 'text-rose-400';
                                    if (log.type === 'warning') color = 'text-yellow-400';

                                    return (
                                        <div key={index} className="flex gap-2">
                                            <span className="text-slate-500 shrink-0 font-bold">[{log.time}]</span>
                                            <span className={color}>{log.message}</span>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Mitigation Info Box */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                                <Code size={16} className="text-orange-500" />
                                Giải pháp khắc phục lỗ hổng
                            </h3>
                            <button
                                onClick={() => setShowSolution(!showSolution)}
                                className="text-xs font-bold text-orange-500 hover:text-orange-600 underline"
                            >
                                {showSolution ? 'Thu gọn' : 'Xem chi tiết Code'}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Lỗ hổng xảy ra do mô hình đọc dữ liệu (Read), kiểm tra điều kiện rồi ghi dữ liệu (Write) không đồng bộ trên môi trường phân tán.
                        </p>

                        {showSolution && (
                            <div className="bg-slate-950 p-4 rounded-xl text-[10.5px] font-mono text-slate-300 border border-slate-800 max-h-60 overflow-y-auto flex flex-col gap-4">
                                {activeDemo === 'wallet' ? (
                                    <div>
                                        <span className="text-orange-400 block font-bold mb-1">// Wallet Solution: Sử dụng khóa phân tán Redis</span>
                                        <pre className="text-slate-400">
{`const lockKey = \`lock:wallet:\${userId}\`;
// SET key với NX (chỉ ghi khi chưa có) và PX (hết hạn sau 3s)
const acquired = await redis.set(lockKey, 'locked', {
    NX: true,
    PX: 3000
});

if (!acquired) {
    throw new Error('Giao dịch đang xử lý. Vui lòng đợi.');
}

try {
    const user = await User.findById(userId);
    if (user.balance < amount) {
        throw new Error('Số dư không đủ');
    }
    user.balance -= amount;
    await user.save();
} finally {
    // Giải phóng khóa sau khi giao dịch hoàn tất
    await redis.del(lockKey);
}`}
                                        </pre>
                                    </div>
                                ) : (
                                    <div>
                                        <span className="text-orange-400 block font-bold mb-1">// Bidding Solution: Sử dụng Distributed Lock Redis</span>
                                        <pre className="text-slate-400">
{`const lockKey = \`lock:auction:\${auctionId}\`;
const acquired = await redis.set(lockKey, 'locked', {
    NX: true,
    PX: 1000 // Khóa giữ tối đa 1 giây
});

if (!acquired) {
    throw new Error('Lượt đặt giá đang được xử lý, vui lòng thử lại');
}

try {
    // 1. Lấy giá hiện tại từ Redis Cache
    const currentPrice = await biddingRepository.getCurrentPrice(redis, auctionId);
    
    // 2. Validate mức giá mới đặt
    const minNextBid = currentPrice + auction.minBidIncrement;
    if (bidAmount < minNextBid) {
        throw new Error('Giá đặt chưa đạt bước giá tối thiểu');
    }

    // 3. Thực hiện ghi nhận lượt bid thành công...
} finally {
    // Giải phóng khóa phân tán
    await redis.del(lockKey);
}`}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
