# 🏗️ Kiến Trúc Hệ Thống Đấu Giá Trực Tuyến Realtime

## 📊 Tổng Quan Kiến Trúc

Hệ thống sử dụng **Microservices Architecture** với các thành phần độc lập giao tiếp qua HTTP/REST và WebSocket.

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│                    (React Web Application)                        │
│                      http://localhost:5173                        │
└────────────────────────────┬────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 HTTP/REST         WebSocket
                    │                 │
┌───────────────────┴─────────────────┴──────────────────────────┐
│                    API GATEWAY / LOAD BALANCER                   │
│              (Frontend communicates with all services)           │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬─────────────────┬──────────────┐
        │           │           │                 │              │
    ┌───▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌────────▼──┐ ┌──────────▼──┐
    │AUTH     │ │AUCTION  │ │BIDDING  │ │PAYMENT   │ │NOTIFICATION│
    │SERVICE  │ │SERVICE  │ │SERVICE  │ │SERVICE   │ │SERVICE    │
    │PORT3001 │ │PORT3002 │ │PORT3003 │ │PORT3006  │ │PORT3004   │
    └───┬─────┘ └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘
        │            │           │           │             │
        │            │           ├──────────────────────────┼──────┐
        │            │           │                          │      │
        └────┬───────┴───────────┴──────────────┬───────────┘      │
             │                                  │                  │
        ┌────▼────────────────────────────┬─────▼──────────────┐   │
        │    MONGODB (Persistence)         │  REDIS (Cache)     │   │
        │    ├── Users                     │  ├── Locks         │   │
        │    ├── Auctions                  │  ├── Sessions      │   │
        │    ├── Bids                      │  └── Pub/Sub       │   │
        │    ├── Transactions              │                    │   │
        │    ├── Notifications             │ (Race Condition)  │   │
        │    └── ...                       └────────────────────┘   │
        │                                                           │
        └────────────────────────────────────────────────────────┘
        
        ┌──────────────────────────────────────────────────────┐
        │        COMMUNITY SERVICE (Port 3005)                │
        │     ├── Posts Management                            │
        │     └── Comments Management                         │
        └──────────────────────────────────────────────────────┘
```

---

## 🔧 Chi Tiết Các Microservices

### 1. **AUTH SERVICE** (Port 3001)
**Chức năng:** Quản lý xác thực người dùng

**Endpoints:**
- `POST /api/auth/register` - Đăng ký người dùng mới
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/refresh-token` - Làm mới token
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/logout` - Đăng xuất

**Dependencies:**
- MongoDB (lưu user info)
- Redis (cache sessions)

**Authentication:** JWT (JSON Web Tokens)

---

### 2. **AUCTION SERVICE** (Port 3002)
**Chức năng:** Quản lý vòng đời đấu giá

**Endpoints:**
- `GET /api/auctions` - Lấy danh sách đấu giá
- `POST /api/auctions` - Tạo đấu giá (Seller)
- `GET /api/auctions/:id` - Chi tiết đấu giá
- `PUT /api/auctions/:id` - Cập nhật đấu giá
- `DELETE /api/auctions/:id` - Xóa đấu giá
- `POST /api/auctions/:id/register` - Đăng ký tham gia
- `GET /api/auctions/:id/winner` - Lấy người thắng

**Trạng thái Auction:**
```
DRAFT → OPEN → CLOSING → CLOSED → COMPLETED
         ↓                           ↑
         └─────→ EXPIRED ──→ CANCELLED
```

**Dependencies:**
- Payment Service (xác nhận đặt cọc)
- MongoDB (lưu auction data)

---

### 3. **BIDDING SERVICE** (Port 3003)
**Chức năng:** Xử lý đấu giá realtime, chống race condition

**WebSocket Events:**
```
CLIENT → SERVER:
├── "join-auction" - Tham gia phòng đấu giá
├── "place-bid" - Đặt giá
├── "leave-auction" - Rời khỏi phòng
└── "get-bidding-history" - Lấy lịch sử

SERVER → CLIENT:
├── "bid-placed" - Có người đặt giá
├── "auction-closing" - Sắp kết thúc
├── "auction-closed" - Kết thúc
├── "bid-rejected" - Giá bị từ chối
└── "active-bidders" - Số người đang đặt giá
```

**Race Condition Prevention:**
- Redis Locks (Distributed locks)
- Optimistic locking với version field
- Sequence validation

**Algorithm:**
```
1. Client gửi "place-bid" event
2. Server yêu cầu Redis lock trên auctionId
3. Validate: giá > current bid, auction còn open, user có balance
4. Cập nhật bid trong MongoDB (atomic operation)
5. Release lock
6. Broadcast "bid-placed" event tới clients
```

**Dependencies:**
- MongoDB (lưu bids)
- Redis (distributed locks)
- Socket.io (realtime communication)

---

### 4. **PAYMENT SERVICE** (Port 3006)
**Chức năng:** Quản lý ví, thanh toán, escrow

**Endpoints:**
- `GET /api/wallet` - Lấy balance ví
- `POST /api/wallet/deposit` - Nạp tiền
- `POST /api/wallet/withdraw` - Rút tiền
- `POST /api/transactions` - Tạo giao dịch
- `GET /api/transactions` - Lịch sử giao dịch
- `GET /api/escrows/:auctionId` - Xem escrow
- `POST /api/escrows/:auctionId/release` - Giải phóng escrow

**Escrow Workflow:**
```
1. Bidder thắng → Lock 10% deposit
2. Seller xác nhận nhận hàng → Giải phóng 90%
3. Bidder xác nhận nhận hàng → Giải phóng 100% cho seller
4. Nếu dispute → Manual admin review
```

**Dependencies:**
- MongoDB (lưu transactions, wallets)
- Redis (cache balances)

---

### 5. **NOTIFICATION SERVICE** (Port 3004)
**Chức năng:** Gửi thông báo realtime

**18 Loại Thông Báo:**
1. **Auction Events:**
   - Auction created/updated/closed
   - Your bid was outbid
   - You won the auction

2. **Payment Events:**
   - Payment confirmed
   - Escrow released
   - Refund processed

3. **Community Events:**
   - New comment on your auction
   - Someone liked your post

4. **Admin Events:**
   - Auction removed
   - Account suspended

**WebSocket Connection:**
```
CLIENT → NOTIFICATION SERVICE (Socket.io)
         ↓
      Subscribe to user channels
         ↓
Redis Pub/Sub receives events from other services
         ↓
Broadcast to connected clients
```

**Dependencies:**
- MongoDB (lưu notification history)
- Redis (Pub/Sub for events)
- Socket.io

---

### 6. **COMMUNITY SERVICE** (Port 3005)
**Chức năng:** Quản lý bài viết, bình luận

**Endpoints:**
- `GET /api/posts` - Lấy danh sách bài
- `POST /api/posts` - Tạo bài viết mới
- `PUT /api/posts/:id` - Cập nhật bài
- `DELETE /api/posts/:id` - Xóa bài
- `GET /api/posts/:id/comments` - Lấy bình luận
- `POST /api/posts/:id/comments` - Thêm bình luận
- `DELETE /api/comments/:id` - Xóa bình luận

**Dependencies:**
- MongoDB (lưu posts, comments)

---

## 🗄️ Database Schema

### **MongoDB Collections:**

```javascript
// Users
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  role: "seller" | "bidder" | "admin",
  wallet: Number,
  createdAt: Date,
  updatedAt: Date
}

// Auctions
{
  _id: ObjectId,
  title: String,
  description: String,
  seller: ObjectId (ref: Users),
  startPrice: Number,
  currentBid: Number,
  highestBidder: ObjectId (ref: Users),
  status: String,
  startTime: Date,
  endTime: Date,
  version: Number // For optimistic locking
}

// Bids
{
  _id: ObjectId,
  auction: ObjectId (ref: Auctions),
  bidder: ObjectId (ref: Users),
  amount: Number,
  timestamp: Date
}

// Transactions
{
  _id: ObjectId,
  from: ObjectId (ref: Users),
  to: ObjectId (ref: Users),
  amount: Number,
  type: "deposit" | "withdraw" | "payment",
  status: "pending" | "completed" | "failed",
  createdAt: Date
}

// Escrows
{
  _id: ObjectId,
  auction: ObjectId (ref: Auctions),
  buyer: ObjectId (ref: Users),
  seller: ObjectId (ref: Users),
  amount: Number,
  status: "locked" | "released" | "refunded",
  createdAt: Date,
  releasedAt: Date
}

// Notifications
{
  _id: ObjectId,
  user: ObjectId (ref: Users),
  type: String,
  message: String,
  read: Boolean,
  createdAt: Date
}

// Posts & Comments
{
  _id: ObjectId,
  author: ObjectId (ref: Users),
  title: String,
  content: String,
  createdAt: Date,
  comments: [{ author, content, createdAt }]
}
```

### **Redis Keys:**

```
// Sessions
session:{sessionId} → user data (TTL: varies)

// Locks (Race condition prevention)
lock:auction:{auctionId} → lock owner (TTL: 5s)
lock:wallet:{userId} → lock owner (TTL: 5s)

// Cache
auction:{auctionId} → auction data (TTL: 5m)
user:{userId}:balance → wallet balance (TTL: 1m)
active-bidders:{auctionId} → [bidderIds]
```

---

## 🔄 Communication Patterns

### **Synchronous (HTTP/REST):**
```
Frontend/Service A
        ↓ (REST API call)
Service B
        ↓ (response)
Return to Service A
```

**Used for:**
- CRUD operations
- Authentication checks
- Payment verification

### **Asynchronous (Redis Pub/Sub):**
```
Service A publishes event
        ↓
Redis Pub/Sub
        ↓
Service B subscribes & receives event
Service C subscribes & receives event
Service D subscribes & receives event
```

**Used for:**
- Notifications broadcast
- Event-driven architecture
- Decoupled services

### **Real-time (WebSocket):**
```
Client A ←→ Socket.io ←→ Bidding Service
Client B ↕
Client C
         All connected clients receive
         "bid-placed" event simultaneously
```

**Used for:**
- Live bidding updates
- Notifications
- Active bidders count

---

## 🛡️ Race Condition Prevention

**Scenario:** 2 bidders đặt giá đồng thời trên cùng 1 đấu giá

**Without Protection:**
```
Time │ Bidder A (Client)    │ Bidder B (Client)    │ Server
─────┼──────────────────────┼──────────────────────┼─────────────
 1   │ place-bid: $100      │                      │
 2   │                      │ place-bid: $105      │
 3   │                      │                      │ Check A: OK
 4   │                      │                      │ Check B: OK  ✗ WRONG!
 5   │                      │                      │ Update: $100
 6   │                      │                      │ Update: $105 ✓ But lost A's bid!
```

**With Redis Locks:**
```
Time │ Bidder A (Server)    │ Bidder B (Server)    │ Redis
─────┼──────────────────────┼──────────────────────┼────────────
 1   │ Request lock         │ Request lock         │
 2   │ ✓ Lock acquired      │ ✗ Lock waiting       │ Locked
 3   │ Validate & Update    │ (waiting...)         │ Locked
 4   │ Release lock         │                      │
 5   │ Broadcast event      │ ✓ Lock acquired      │
 6   │                      │ Validate & Update    │ Locked
 7   │                      │ Release lock         │ Unlocked
 8   │                      │ Broadcast event      │
```

---

## 📱 Frontend Architecture

### **Component Structure:**
```
src/
├── components/
│   ├── auction/
│   │   └── AuctionCard.jsx
│   ├── auth/
│   │   └── PrivateRoute.jsx
│   ├── layout/
│   │   └── Navbar.jsx
│   └── support/
│       └── supportPage.jsx
├── pages/
│   ├── AuthPage/
│   │   ├── LoginPage.jsx
│   │   └── RegisterPage.jsx
│   ├── BidderPage/
│   │   ├── AuctionListPage.jsx
│   │   ├── AuctionDetailPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── WalletPage.jsx
│   ├── SellerPage/
│   │   └── CreateAuctionPage.jsx
│   └── AdminPage/
│       └── AdminDashboard.jsx
├── contexts/
│   └── AuthContext.jsx
├── services/
│   ├── api.js (REST calls)
│   ├── socket.js (WebSocket)
│   └── walletApi.js
└── App.jsx
```

### **Data Flow:**
```
User Action (Click, Form Submit)
    ↓
React Component / Hook
    ↓
Service (api.js / socket.js)
    ↓
Backend API / WebSocket
    ↓
Response received
    ↓
Update Context / State
    ↓
Component re-render
    ↓
Update UI
```

---

## 🚀 Deployment & Scaling

### **Current Setup (Docker Compose):**
```
Single Machine:
├── MongoDB (1 instance)
├── Redis (1 instance)
└── Services (Each 1 container)
```

### **Future Scaling (Kubernetes):**
```
Kubernetes Cluster:
├── Auth Service (3 replicas)
├── Auction Service (3 replicas)
├── Bidding Service (5 replicas)
├── Payment Service (2 replicas)
├── Notification Service (3 replicas)
├── Community Service (2 replicas)
├── MongoDB (Replica Set)
├── Redis (Sentinel + Replication)
└── Load Balancer (Nginx / HAProxy)
```

---

## 🔐 Security Considerations

1. **Authentication:** JWT tokens với expiration
2. **Authorization:** Role-based access control (RBAC)
3. **Data Validation:** Input sanitization trên tất cả endpoints
4. **Database:** Password hashing (bcrypt)
5. **API Security:** CORS, Rate limiting
6. **Payment:** Escrow mechanism để bảo vệ cả 2 bên
7. **Race Condition:** Redis distributed locks

---

## 📊 Performance Optimization

1. **Caching:** Redis cache cho auctions, user data
2. **Indexing:** MongoDB indexes trên frequently queried fields
3. **Connection Pooling:** Reuse database connections
4. **Load Balancing:** Services có thể scale horizontally
5. **Compression:** gzip compression cho HTTP responses
6. **WebSocket:** Efficient binary protocol for real-time updates

---

## 🎯 Request Flow - Ví dụ: Đặt Giá Mới

```
1. FRONTEND (React)
   User clicks "Bid Now" → enters amount

2. FRONTEND → BIDDING SERVICE (WebSocket)
   Event: "place-bid" { auctionId, amount }

3. BIDDING SERVICE
   ├─ Acquire Redis lock on auctionId
   ├─ Validate:
   │  ├─ User is registered for this auction
   │  ├─ User has enough balance
   │  ├─ Amount > currentBid
   │  ├─ Auction still OPEN
   │  └─ Auction hasn't ended
   ├─ Update MongoDB:
   │  ├─ auctions.currentBid = amount
   │  ├─ auctions.highestBidder = userId
   │  ├─ auctions.version++ (for optimistic locking)
   │  └─ bids.insert new bid record
   ├─ Release Redis lock
   └─ Publish Redis event "bid:placed"

4. NOTIFICATION SERVICE (listening to Redis Pub/Sub)
   ├─ Receives "bid:placed" event
   ├─ Creates notifications for:
   │  ├─ Previous highest bidder (outbid)
   │  └─ Auction watchers
   └─ Sends via WebSocket to connected clients

5. BIDDING SERVICE (WebSocket broadcast)
   ├─ Broadcast "bid-placed" to all clients in auction room
   └─ Includes:
      ├─ Current bid amount
      ├─ Highest bidder
      └─ Time remaining

6. FRONTEND (All connected clients)
   ├─ Receive "bid-placed" event
   ├─ Update UI with new bid
   ├─ Show notifications
   └─ Update leaderboard in real-time
```

---

## 🔍 Monitoring & Logging

**Cần thêm:**
- Winston / Morgan logging
- Error tracking (Sentry)
- Performance monitoring (APM)
- Docker health checks
- Service health endpoints

---

## 📝 Summary

| Thành Phần | Công Nghệ | Chức Năng |
|-----------|-----------|---------|
| **Frontend** | React + Vite | UI người dùng |
| **Auth** | Node.js + JWT | Xác thực & authorization |
| **Auction** | Node.js + MongoDB | CRUD đấu giá |
| **Bidding** | Node.js + WebSocket + Redis | Đấu giá realtime |
| **Payment** | Node.js + Escrow | Thanh toán & ví |
| **Notification** | Node.js + Socket.io + Redis Pub/Sub | Thông báo realtime |
| **Community** | Node.js + MongoDB | Posts & comments |
| **Database** | MongoDB | Data persistence |
| **Cache** | Redis | Locks & sessions |
| **Orchestration** | Docker Compose | Container management |

