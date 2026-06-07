const BASE_URL = 'http://localhost:8080/api';

async function run() {
    const randomSuffix = Math.floor(Math.random() * 100000);
    const email = `testuser${randomSuffix}@gmail.com`;
    const password = 'Password123';
    const fullName = 'Test Bidder';
    const phone = '0987654321';

    console.log(`\n=== 1. ĐĂNG KÝ TÀI KHOẢN THỬ NGHIỆM ===`);
    console.log(`Email: ${email}`);
    
    // Đăng ký user
    let response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, phone, role: 'bidder' })
    });
    let data = await response.json();
    if (!data.success) {
        console.error('Đăng ký thất bại:', data.message);
        return;
    }
    console.log('✅ Đăng ký tài khoản thành công!');

    // Đăng nhập để lấy token
    console.log(`\n=== 2. ĐĂNG NHẬP ===`);
    response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    data = await response.json();
    if (!data.success) {
        console.error('Đăng nhập thất bại:', data.message);
        return;
    }
    const token = data.data.accessToken;
    const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    console.log('Đăng nhập thành công, đã lấy JWT Token.');

    // Kiểm tra số dư ban đầu
    console.log(`\n=== 3. KIỂM TRA SỐ DƯ BAN ĐẦU ===`);
    response = await fetch(`${BASE_URL}/wallet/balance`, { headers: authHeaders });
    data = await response.json();
    console.log(`Số dư ban đầu: ${data.data.balance.toLocaleString('vi-VN')} VND`);

    // Nạp thử 100.000đ vào ví
    const depositAmount = 100000;
    console.log(`\n=== 4. NẠP TIỀN TEST (${depositAmount.toLocaleString('vi-VN')} VND) ===`);
    response = await fetch(`${BASE_URL}/wallet/deposit`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ amount: depositAmount })
    });
    data = await response.json();
    console.log(`Nạp tiền thành công! Số dư mới: ${data.data.newBalance.toLocaleString('vi-VN')} VND`);

    // Mô phỏng rút tiền đồng thời
    const withdrawAmount = 80000;
    const concurrentRequests = 5;
    console.log(`\n=== 5. GỬI ĐỒNG THỜI ${concurrentRequests} YÊU CẦU RÚT ${withdrawAmount.toLocaleString('vi-VN')} VND ===`);
    console.log(`(Tổng tiền rút yêu cầu: ${(withdrawAmount * concurrentRequests).toLocaleString('vi-VN')} VND, trong khi số dư chỉ có ${depositAmount.toLocaleString('vi-VN')} VND)`);
    console.log('Đang gửi các request đồng thời...');

    // Sử dụng Promise.all để bắn song song các request lên API Gateway
    const promises = Array.from({ length: concurrentRequests }).map((_, i) => {
        return fetch(`${BASE_URL}/wallet/withdraw`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ amount: withdrawAmount })
        })
        .then(async res => {
            const resData = await res.json();
            return {
                index: i + 1,
                status: res.status,
                success: resData.success,
                message: resData.message,
                data: resData.data
            };
        })
        .catch(err => {
            return {
                index: i + 1,
                success: false,
                message: err.message
            };
        });
    });

    const results = await Promise.all(promises);

    console.log(`\n=== KẾT QUẢ GIAO DỊCH CONCURRENCY ===`);
    results.forEach(res => {
        if (res.success) {
            console.log(`\x1b[32m[Request #${res.index}] THÀNH CÔNG: Đã rút ${withdrawAmount.toLocaleString('vi-VN')} VND. Số dư ví còn lại: ${res.data?.newBalance?.toLocaleString('vi-VN')} VND\x1b[0m`);
        } else {
            console.log(`\x1b[31m[Request #${res.index}] THẤT BẠI: ${res.message}\x1b[0m`);
        }
    });

    // Kiểm tra số dư cuối cùng trong DB
    console.log(`\n=== 6. KIỂM TRA SỐ DƯ CUỐI CÙNG TRONG DATABASE ===`);
    response = await fetch(`${BASE_URL}/wallet/balance`, { headers: authHeaders });
    data = await response.json();
    console.log(`Số dư thực tế còn lại trong DB: \x1b[33m${data.data.balance.toLocaleString('vi-VN')} VND\x1b[0m`);
    
    const totalSuccessful = results.filter(r => r.success).length;
    console.log(`\nTổng số giao dịch thành công: ${totalSuccessful}/${concurrentRequests}`);
    if (totalSuccessful > 1) {
        console.log(`\x1b[31m CẢNH BÁO BẢO MẬT: Phát hiện lỗ Race Condition! Người dùng đã rút thành công ${totalSuccessful} lần (Tổng rút: ${(withdrawAmount * totalSuccessful).toLocaleString('vi-VN')} VND) vượt quá số dư thực tế.\x1b[0m`);
    } else {
        console.log(`\x1b[32m HỆ THỐNG AN TOÀN: Chỉ có duy nhất 1 giao dịch được thực hiện thành công, các giao dịch đồng thời còn lại đều bị chặn.\x1b[0m`);
    }
}

run().catch(console.error);
