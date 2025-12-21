# Giải Thích Chi Tiết: Xử Lý Race Condition trong Bidding

## ❓ Race Condition là gì?

Race Condition xảy ra khi **nhiều tiến trình/request cùng đọc và ghi dữ liệu cùng lúc**, dẫn đến kết quả không mong muốn.

### Ví dụ trong Đấu giá:

**Tình huống:**
- Giá hiện tại: **1,000,000 VND**
- Bước giá: **100,000 VND**
- User A và User B cùng đặt giá **1,100,000 VND** trong cùng 1 thời điểm

**Không có Race Condition handling:**
```
Time    User A                  User B                  Database
t0      Đọc: 1,000,000         Đọc: 1,000,000          1,000,000
t1      Validate: OK           Validate: OK            1,000,000
t2      Ghi: 1,100,000         -                       1,100,000
t3      -                      Ghi: 1,100,000          1,100,000 ❌
```
**Vấn đề:** Cả 2 user đều bid thành công với cùng giá!

## 🛡️ Giải Pháp: Redis Lock với SET NX

### Cách hoạt động:

```javascript
// 1. Thử acquire lock
const lockKey = `auction:${auctionId}:lock`;
const lockValue = `${userId}-${timestamp}`;
const lockAcquired = await redis.set(lockKey, lockValue, {
  NX: true,  // Only set if NOT exists
  EX: 5      // Expire after 5 seconds
});

if (!lockAcquired) {
  // Có người khác đang bid, từ chối
  throw new Error('Đang có người khác đặt giá');
}

// 2. Thực hiện bid logic (đọc, validate, ghi)
// ...

// 3. Release lock
await redis.del(lockKey);
```

### Flow với Lock:

```
Time    User A                          User B                      Redis Lock
t0      Acquire lock ✅                 -                          A owns
t1      Đọc: 1,000,000                 Try acquire lock ❌         A owns
t2      Validate: OK                   Error: "Có người khác"      A owns
t3      Ghi: 1,100,000                 -                          A owns
t4      Release lock                   -                          Released
t5      -                              Acquire lock ✅             B owns
t6      -                              Đọc: 1,100,000             B owns
t7      -                              Validate: Must >= 1,200K   B owns
```

**Kết quả:** User B phải đặt ít nhất 1,200,000 VND

## 🔐 Tính năng quan trọng của Redis SET NX

### 1. Atomic Operation
```javascript
// Atomic = Không thể bị gián đoạn
// Hoặc là thành công hoàn toàn, hoặc thất bại hoàn toàn
const result = await redis.set('key', 'value', { NX: true });
// result = true (thành công) hoặc false (key đã tồn tại)
```

### 2. TTL (Time To Live)
```javascript
// Lock tự động expire sau 5 giây
const result = await redis.set(lockKey, value, {
  NX: true,
  EX: 5  // seconds
});
```

**Lý do cần TTL:**
- Tránh deadlock nếu process bị crash
- Tự động release lock nếu có lỗi

### 3. Unique Lock Value
```javascript
const lockValue = `${userId}-${Date.now()}`;
```

**Lý do:**
- Đảm bảo chỉ owner mới xóa được lock của mình
- Tránh xóa lock của người khác

## 📊 So sánh các giải pháp

| Giải pháp | Ưu điểm | Nhược điểm | Độ tin cậy |
|-----------|---------|------------|------------|
| Không xử lý | Đơn giản, nhanh | Race condition | ❌ Thấp |
| Database Lock | Dễ implement | Chậm, blocking | ⚠️ Trung bình |
| Redis Lock | Nhanh, atomic | Cần Redis | ✅ Cao |
| Redis + Lua Script | Nhanh nhất, atomic | Phức tạp | ✅ Rất cao |

## 🚀 Implementation trong Code

### File: bidding.service.js

```javascript
async placeBid(redis, auctionId, bidderId, bidAmount) {
  const lockKey = `auction:${auctionId}:lock`;
  const lockValue = `${bidderId}-${Date.now()}`;
  const lockTTL = 5;

  try {
    // ===== BƯỚC 1: Acquire Lock =====
    const lockAcquired = await redis.set(lockKey, lockValue, {
      NX: true,  // Chỉ set nếu chưa tồn tại
      EX: lockTTL
    });

    if (!lockAcquired) {
      // Lock đã được người khác giữ
      throw new Error('Đang có người khác đặt giá, vui lòng thử lại');
    }

    // ===== BƯỚC 2: Critical Section - Xử lý Bid =====
    // Đọc giá hiện tại
    const currentPrice = await biddingRepository.getCurrentPrice(redis, auctionId);
    
    // Validate
    const minNextBid = currentPrice + auction.minBidIncrement;
    if (bidAmount < minNextBid) {
      throw new Error(`Giá đặt phải >= ${minNextBid}`);
    }

    // Ghi vào database
    await biddingRepository.updateCurrentPrice(auctionId, bidAmount, bidderId);
    
    // Cache vào Redis
    await biddingRepository.cachePrice(redis, auctionId, bidAmount);

    // Publish event
    await redis.publish('auction:bid:placed', JSON.stringify({
      auctionId,
      bidderId,
      amount: bidAmount
    }));

    return { success: true, newPrice: bidAmount };

  } finally {
    // ===== BƯỚC 3: Release Lock =====
    // Chỉ xóa nếu lock value khớp
    const currentLock = await redis.get(lockKey);
    if (currentLock === lockValue) {
      await redis.del(lockKey);
    }
  }
}
```

## 🧪 Testing Race Condition

### Test Script (Node.js)

```javascript
const axios = require('axios');
const io = require('socket.io-client');

async function testRaceCondition() {
  const auctionId = 'YOUR_AUCTION_ID';
  const token1 = 'USER_1_TOKEN';
  const token2 = 'USER_2_TOKEN';

  // Connect 2 sockets
  const socket1 = io('http://localhost:3003', { auth: { token: token1 } });
  const socket2 = io('http://localhost:3003', { auth: { token: token2 } });

  // Join auction
  socket1.emit('auction:join', { auctionId });
  socket2.emit('auction:join', { auctionId });

  // Đặt giá cùng lúc
  const bidAmount = 1000000;
  
  Promise.all([
    new Promise((resolve) => {
      socket1.emit('bid:place', { auctionId, amount: bidAmount });
      socket1.on('bid:success', resolve);
      socket1.on('bid:error', resolve);
    }),
    new Promise((resolve) => {
      socket2.emit('bid:place', { auctionId, amount: bidAmount });
      socket2.on('bid:success', resolve);
      socket2.on('bid:error', resolve);
    })
  ]).then(results => {
    console.log('Result 1:', results[0]);
    console.log('Result 2:', results[1]);
    // Chỉ 1 trong 2 sẽ thành công
  });
}

testRaceCondition();
```

### Kết quả mong đợi:

```
Result 1: { success: true, newPrice: 1000000 } ✅
Result 2: { message: "Đang có người khác đặt giá" } ❌
```

## 📈 Performance Considerations

### 1. Lock Timeout
- **5 giây** là hợp lý cho 1 bid operation
- Quá ngắn: Risk của deadlock nếu operation chậm
- Quá dài: User phải chờ lâu nếu có lỗi

### 2. Redis Performance
- Redis SET NX rất nhanh: **< 1ms**
- Đọc/Ghi Redis: **< 1ms**
- MongoDB operation: **10-50ms**

### 3. Throughput
- **Với Lock**: ~200 bids/second/auction
- **Không Lock**: Unlimited nhưng incorrect data

## 🔧 Alternative: Redis Lua Script (Advanced)

```lua
-- acquire_lock.lua
local lockKey = KEYS[1]
local lockValue = ARGV[1]
local ttl = tonumber(ARGV[2])

local result = redis.call('SET', lockKey, lockValue, 'NX', 'EX', ttl)
if result then
  return 1
else
  return 0
end
```

**Ưu điểm:**
- Atomic hơn
- Giảm round-trip với Redis

## 💡 Best Practices

1. ✅ **Luôn sử dụng finally block** để release lock
2. ✅ **Set TTL** để tránh deadlock
3. ✅ **Unique lock value** để tránh xóa lock của người khác
4. ✅ **Log errors** để debug
5. ✅ **Retry mechanism** cho user experience tốt hơn

## 🐛 Common Pitfalls

### ❌ Không set TTL
```javascript
// BAD - Nếu crash, lock không bao giờ được release
await redis.set(lockKey, value, { NX: true });
```

### ❌ Không check lock value trước khi delete
```javascript
// BAD - Có thể xóa lock của người khác
await redis.del(lockKey);

// GOOD
const currentLock = await redis.get(lockKey);
if (currentLock === myLockValue) {
  await redis.del(lockKey);
}
```

### ❌ Lock quá nhiều operations
```javascript
// BAD - Lock trong quá lâu
await redis.set(lockKey, value, { NX: true, EX: 60 });
// ... nhiều operations phức tạp ...
```

## 📚 References

- [Redis SET command](https://redis.io/commands/set)
- [Distributed Locks with Redis](https://redis.io/topics/distlock)
- [Redlock Algorithm](https://redis.io/topics/distlock#the-redlock-algorithm)
