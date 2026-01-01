# Hệ Thống Đấu Giá Realtime - Cấu Trúc Project

## 📁 Cấu trúc thư mục chi tiết

```
Ung-dung-phan-tan/
│
├── docker-compose.yml              # Orchestration cho tất cả services
├── README.md                       # Documentation chính
│
├── shared/                         # Code dùng chung giữa các services
│   ├── database/
│   │   ├── mongodb.js             # MongoDB connection helper
│   │   └── redis.js               # Redis connection helper
│   └── models/
│       ├── User.js                # User schema
│       └── Auction.js             # Auction schema
│
├── services/                       # Microservices
│   │
│   ├── auth-service/              # Service xác thực
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.js           # Entry point
│   │       ├── controllers/
│   │       │   └── auth.controller.js
│   │       ├── services/
│   │       │   └── auth.service.js
│   │       ├── repositories/
│   │       │   └── auth.repository.js
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.js
│   │       │   ├── validator.js
│   │       │   └── errorHandler.js
│   │       ├── routes/
│   │       │   └── auth.routes.js
│   │       └── utils/
│   │           └── jwt.js
│   │
│   ├── auction-service/           # Service quản lý đấu giá
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── .env.example
│   │   └── src/
│   │       ├── index.js
│   │       ├── controllers/
│   │       │   └── auction.controller.js
│   │       ├── services/
│   │       │   └── auction.service.js
│   │       ├── repositories/
│   │       │   └── auction.repository.js
│   │       ├── middlewares/
│   │       │   ├── auth.middleware.js
│   │       │   ├── validator.js
│   │       │   └── errorHandler.js
│   │       └── routes/
│   │           └── auction.routes.js
│   │
│   └── bidding-service/           # Service đấu giá realtime
│       ├── Dockerfile
│       ├── package.json
│       ├── .env.example
│       └── src/
│           ├── index.js
│           ├── controllers/
│           │   └── bidding.controller.js
│           ├── services/
│           │   └── bidding.service.js
│           ├── repositories/
│           │   └── bidding.repository.js
│           ├── middlewares/
│           │   ├── auth.middleware.js
│           │   ├── socketAuth.js
│           │   └── errorHandler.js
│           ├── routes/
│           │   └── bidding.routes.js
│           └── socket/
│               └── socket.handler.js    # WebSocket logic
│
└── frontend/                       # ReactJS Application (Chạy local)
    └── (Sẽ được tạo riêng)
```

## 🏗️ Kiến trúc Clean Code

Mỗi service tuân theo pattern:

```
Controller → Service → Repository → Model
```

- **Controller**: Xử lý HTTP requests/responses
- **Service**: Business logic
- **Repository**: Tương tác với database
- **Model**: Schema definitions

## 🔑 Các tính năng chính

### 1. Auth Service (Port 3001)
- ✅ Đăng ký/Đăng nhập
- ✅ JWT Authentication (Access + Refresh Token)
- ✅ Token validation cho các services khác
- ✅ User profile management

### 2. Auction Service (Port 3002)
- ✅ CRUD operations cho auctions
- ✅ Filter, search, pagination
- ✅ Category management
- ✅ View tracking
- ✅ Owner permissions

### 3. Bidding Service (Port 3003)
- ✅ Realtime bidding với Socket.io
- ✅ Race condition handling với Redis SET NX
- ✅ Redis Pub/Sub cho multi-instance
- ✅ Bid history tracking
- ✅ Atomic operations

## 🔥 Xử lý Race Condition

**Vấn đề**: Nhiều người cùng đặt giá một lúc

**Giải pháp**:
1. **Redis Lock** với SET NX (Set if Not eXists)
2. **Atomic Operations** 
3. **TTL** cho lock (5 giây) để tránh deadlock
4. **Lock Value** unique để đảm bảo chỉ owner mới xóa được lock

```javascript
// Pseudo code
const lockKey = `auction:${auctionId}:lock`;
const lockAcquired = await redis.set(lockKey, uniqueValue, { NX: true, EX: 5 });

if (!lockAcquired) {
  throw new Error('Đang có người khác đặt giá');
}

// ... Xử lý đặt giá ...

// Release lock
await redis.del(lockKey);
```

## 🚀 Chạy Project

### 1. Clone và Setup
```bash
cd Ung-dung-phan-tan
```

### 2. Copy environment files
```bash
# Cho mỗi service
cp services/auth-service/.env.example services/auth-service/.env
cp services/auction-service/.env.example services/auction-service/.env
cp services/bidding-service/.env.example services/bidding-service/.env
```

### 3. Khởi động với Docker
```bash
docker-compose up -d
```

### 4. Kiểm tra logs
```bash
docker-compose logs -f
```

## 📡 API Endpoints

### Auth Service (http://localhost:3001)
```
POST   /api/auth/register      - Đăng ký
POST   /api/auth/login         - Đăng nhập
POST   /api/auth/refresh       - Refresh token
POST   /api/auth/logout        - Đăng xuất
GET    /api/auth/me            - Lấy profile
POST   /api/auth/verify        - Verify token (Internal)
```

### Auction Service (http://localhost:3002)
```
GET    /api/auctions           - Lấy danh sách auctions
GET    /api/auctions/active    - Lấy auctions đang active
GET    /api/auctions/my        - Lấy auctions của user
GET    /api/auctions/:id       - Lấy auction theo ID
POST   /api/auctions           - Tạo auction mới
PUT    /api/auctions/:id       - Cập nhật auction
DELETE /api/auctions/:id       - Xóa auction
POST   /api/auctions/:id/cancel - Hủy auction
```

### Bidding Service (http://localhost:3003)
**REST API:**
```
GET    /api/bidding/auction/:id              - Lấy thông tin auction
GET    /api/bidding/auction/:id/history      - Lấy bid history
GET    /api/bidding/auction/:id/can-bid      - Kiểm tra có thể bid
POST   /api/bidding/auction/:id/end          - Kết thúc auction
```

**WebSocket Events:**
```
Client → Server:
  - auction:join      { auctionId }
  - auction:leave     { auctionId }
  - bid:place         { auctionId, amount }
  - bid:history       { auctionId, limit }

Server → Client:
  - auction:joined    { auctionId, ...auctionDetails }
  - bid:success       { message, auctionId, newPrice }
  - bid:error         { message }
  - bid:update        { auctionId, bidderId, amount, timestamp }
  - user:joined       { userId, totalParticipants }
  - user:left         { userId, totalParticipants }
```

## 🔐 Authentication

Tất cả protected endpoints yêu cầu JWT token trong header:
```
Authorization: Bearer <access_token>
```

WebSocket connection yêu cầu token trong auth:
```javascript
const socket = io('http://localhost:3003', {
  auth: {
    token: '<access_token>'
  }
});
```

## 🗄️ Database Schema

### User
- username, email, password (hashed)
- fullName, phone, avatar
- balance (số dư)
- role (user/admin)
- refreshTokens[]

### Auction
- title, description, images[]
- category, status
- startPrice, currentPrice, minBidIncrement, buyNowPrice
- startTime, endTime
- seller (ref User)
- winner (ref User)
- totalBids, viewCount
- recentBids[] (top 10 bids gần nhất)

## 💾 Redis Usage

1. **Caching**: Cache giá hiện tại của auction
2. **Locking**: Xử lý race condition
3. **Pub/Sub**: Đồng bộ giữa các instances
4. **Sorted Sets**: Lưu bid history

## 🔧 Development

### Chạy service riêng lẻ (không dùng Docker)
```bash
cd services/auth-service
npm install
npm run dev
```

### Xem MongoDB
```bash
# Connect với MongoDB Compass
mongodb://admin:admin123@localhost:27018
```

### Xem Redis
```bash
# Connect với Redis CLI
docker exec -it auction-redis redis-cli -a redis123
```

## 📝 Notes

- Tất cả comments trong code đều bằng tiếng Việt
- Sử dụng Clean Code architecture
- Environment variables cho sensitive data
- Error handling đầy đủ
- Validation cho tất cả inputs
- Race condition được xử lý bằng Redis Lock
