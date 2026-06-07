const io = require('socket.io-client');

const BASE_URL = 'http://localhost:8080/api';
const SOCKET_URL = 'http://localhost:3003';

async function run() {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const sellerEmail = `seller${randomSuffix}@gmail.com`;
    const buyer1Email = `buyer1_${randomSuffix}@gmail.com`;
    const buyer2Email = `buyer2_${randomSuffix}@gmail.com`;
    const buyer3Email = `buyer3_${randomSuffix}@gmail.com`;
    const password = 'Password123';

    console.log(`\n=== 1. ĐĂNG KÝ CÁC TÀI KHOẢN THỬ NGHIỆM ===`);
    
    // Đăng ký Seller
    let res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: sellerEmail, password, fullName: 'Seller Test', phone: '0912345678', role: 'seller' })
    });
    let sellerData = await res.json();
    if (!sellerData.success) {
        console.error('Đăng ký Seller thất bại:', sellerData.message);
        return;
    }
    console.log(' Đăng ký Seller thành công!');

    // Đăng ký Bidder A
    res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyer1Email, password, fullName: 'Bidder A', phone: '0912345679', role: 'bidder' })
    });
    console.log(' Đăng ký Bidder A thành công!');

    // Đăng ký Bidder B
    res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyer2Email, password, fullName: 'Bidder B', phone: '0912345680', role: 'bidder' })
    });
    console.log(' Đăng ký Bidder B thành công!');

    // Đăng ký Bidder C
    res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: buyer3Email, password, fullName: 'Bidder C', phone: '0912345681', role: 'bidder' })
    });
    console.log(' Đăng ký Bidder C thành công!');

    // Đăng nhập cho tất cả
    console.log(`\n=== 2. ĐĂNG NHẬP ===`);
    const sellerToken = await login(sellerEmail, password);
    const b1Token = await login(buyer1Email, password);
    const b2Token = await login(buyer2Email, password);
    const b3Token = await login(buyer3Email, password);
    console.log(' Đăng nhập thành công cho tất cả tài khoản.');

    // Tạo phiên đấu giá mới
    console.log(`\n=== 3. SELLER TẠO PHIÊN ĐẤU GIÁ MỚI ===`);
    const now = new Date();
    const endTime = new Date(now.getTime() + 3600 * 1000); // 1 tiếng sau kết thúc
    
    res = await fetch(`${BASE_URL}/auctions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sellerToken}`
        },
        body: JSON.stringify({
            title: `Sản phẩm stress-test race condition ${randomSuffix}`,
            description: 'Sản phẩm demo concurrency cho môn bảo mật',
            category: 'electronics',
            startPrice: 100000,
            minBidIncrement: 10000,
            startTime: now.toISOString(),
            endTime: endTime.toISOString(),
            images: ['http://example.com/item.png']
        })
    });
    const auctionRes = await res.json();
    if (!auctionRes.success) {
        console.error('Tạo đấu giá thất bại:', auctionRes.message);
        return;
    }
    const auctionId = auctionRes.data._id;
    console.log(` Tạo đấu giá thành công! ID: ${auctionId}`);
    console.log(`Giá khởi điểm: 100.000 VND. Bước giá tối thiểu: 10.000 VND.`);

    // Kết nối các Socket Client
    console.log(`\n=== 4. KẾT NỐI SOCKET CLIENTS CHO CÁC BIDDER ===`);
    const socketA = await connectSocket(b1Token);
    const socketB = await connectSocket(b2Token);
    const socketC = await connectSocket(b3Token);
    console.log(' Cả 3 Bidder đã kết nối WebSocket thành công.');

    // Tham gia phòng đấu giá
    console.log(`\n=== 5. THAM GIA PHIÊN ĐẤU GIÁ ===`);
    await joinRoom(socketA, auctionId);
    await joinRoom(socketB, auctionId);
    await joinRoom(socketC, auctionId);
    console.log(' Tất cả Bidder đã join vào phòng đấu giá.');

    // Gửi yêu cầu đặt giá đồng thời
    const bidAmount = 110000; // Bằng giá khởi điểm (100k) + Bước giá (10k)
    console.log(`\n=== 6. GỬI ĐỒNG THỜI 3 LƯỢT ĐẶT GIÁ: ${bidAmount.toLocaleString('vi-VN')} VND ===`);
    console.log('Đang gửi đồng thời các sự kiện bid:place qua Socket...');

    const promises = [
        placeBid(socketA, auctionId, bidAmount, 'Bidder A'),
        placeBid(socketB, auctionId, bidAmount, 'Bidder B'),
        placeBid(socketC, auctionId, bidAmount, 'Bidder C')
    ];

    const results = await Promise.all(promises);

    console.log(`\n=== KẾT QUẢ ĐẤU GIÁ CONCURRENCY ===`);
    results.forEach(res => {
        if (res.success) {
            console.log(`\x1b[32m[${res.name}] ĐẶT GIÁ THÀNH CÔNG! Lượt bid được chấp nhận.\x1b[0m`);
        } else {
            console.log(`\x1b[31m[${res.name}] THẤT BẠI: ${res.message}\x1b[0m`);
        }
    });

    // Lấy lịch sử đặt giá
    console.log(`\n=== 7. LẤY LỊCH SỬ ĐẶT GIÁ TỪ REDIS/DATABASE ===`);
    const history = await getBidHistory(socketA, auctionId);
    console.log('Lịch sử đặt giá được ghi nhận:');
    history.forEach((bid, i) => {
        console.log(`Lượt #${i+1}: Bidder: ${bid.bidderName} - Số tiền: \x1b[33m${bid.amount.toLocaleString('vi-VN')} VND\x1b[0m`);
    });

    const totalSuccessful = results.filter(r => r.success).length;
    console.log(`\nTổng số lượt đặt giá thành công ở mức ${bidAmount.toLocaleString('vi-VN')} VND: ${totalSuccessful}/${results.length}`);
    
    if (totalSuccessful > 1) {
        console.log(`\x1b[31m CẢNH BÁO BẢO MẬT: Phát hiện Race Condition! Có ${totalSuccessful} lượt bid được chấp nhận ở cùng một mức giá, phá vỡ quy tắc bước nhảy của phiên đấu giá.\x1b[0m`);
    } else {
        console.log(`\x1b[32m HỆ THỐNG AN TOÀN: Chỉ có duy nhất 1 lượt bid thành công, các lượt còn lại gửi đồng thời bị chặn do không đạt khóa phân tán (Distributed Lock) hoặc bước nhảy giá.\x1b[0m`);
    }

    // Ngắt kết nối
    socketA.disconnect();
    socketB.disconnect();
    socketC.disconnect();
    process.exit(0);
}

async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    return data.data.accessToken;
}

function connectSocket(token) {
    return new Promise((resolve) => {
        const socket = io(SOCKET_URL, {
            transports: ['websocket'],
            auth: { token }
        });
        socket.on('connect', () => {
            resolve(socket);
        });
    });
}

function joinRoom(socket, auctionId) {
    return new Promise((resolve) => {
        socket.emit('auction:join', { auctionId });
        socket.once('auction:joined', (data) => {
            resolve(data);
        });
    });
}

function placeBid(socket, auctionId, amount, name) {
    return new Promise((resolve) => {
        socket.emit('bid:place', { auctionId, amount });
        
        const successHandler = (data) => {
            socket.off('bid:success', successHandler);
            socket.off('bid:error', errorHandler);
            resolve({ success: true, name, data });
        };

        const errorHandler = (data) => {
            socket.off('bid:success', successHandler);
            socket.off('bid:error', errorHandler);
            resolve({ success: false, name, message: data.message });
        };

        socket.once('bid:success', successHandler);
        socket.once('bid:error', errorHandler);
    });
}

function getBidHistory(socket, auctionId) {
    return new Promise((resolve) => {
        socket.emit('bid:history', { auctionId, limit: 10 });
        socket.once('bid:history:response', (data) => {
            resolve(data.bids || []);
        });
    });
}

run().catch(console.error);
