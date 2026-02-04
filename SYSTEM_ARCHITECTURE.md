# Kien Truc He Thong Dau Gia Truc Tuyen Realtime

## Tong Quan Kien Truc

He thong su dung **Microservices Architecture** voi cac thanh phan doc lap giao tiep qua HTTP/REST va WebSocket.

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
│                    (Nginx: Port 80/443)                          │
└───────────────────┬─────────────────────────────────────────────┘
                    │
        ┌───────────┼───────────┬─────────────────┬──────────────┬───────────────┐
        │           │           │                 │              │               │
    ┌───▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌────────▼──┐ ┌──────────▼──┐ ┌──────────▼──┐
    │AUTH     │ │AUCTION  │ │BIDDING  │ │PAYMENT   │ │NOTIFICATION│ │ORDER       │
    │SERVICE  │ │SERVICE  │ │SERVICE  │ │SERVICE   │ │SERVICE    │ │SERVICE     │
    │PORT3001 │ │PORT3002 │ │PORT3003 │ │PORT3006  │ │PORT3004   │ │PORT3007    │
    └───┬─────┘ └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘ └─────┬──────┘
        │            │           │           │             │              │
        │            │           ├──────────────────────────┼──────────────┤
        │            │           │                          │              │
        └────┬───────┴───────────┴──────────────┬───────────┴──────────────┘
             │                                  │
        ┌────▼────────────────────────────┬─────▼──────────────┐
        │    MONGODB (Persistence)         │  REDIS (Cache)     │
        │    ├── Users                     │  ├── Locks         │
        │    ├── Auctions                  │  ├── Sessions      │
        │    ├── Bids                      │  └── Pub/Sub       │
        │    ├── Transactions              │                    │
        │    ├── Notifications             │ (Race Condition)  │
        │    ├── Orders                    │                    │
        │    └── ...                       └────────────────────┘
        │
        └────────────────────────────────────────────────────────┘
        
        ┌──────────────────────────────────────────────────────┐
        │        COMMUNITY SERVICE (Port 3005)                │
        │     ├── Posts Management                            │
        │     └── Comments Management                         │
        └──────────────────────────────────────────────────────┘
```

---

## Chi Tiet Cac Microservices

### 1. **AUTH SERVICE** (Port 3001)
**Chuc nang:** Quan ly xac thuc nguoi dung

**Endpoints:**
- `POST /api/auth/register` - Dang ky nguoi dung moi
- `POST /api/auth/login` - Dang nhap
- `POST /api/auth/refresh-token` - Lam moi token
- `GET /api/auth/me` - Lay thong tin user hien tai
- `POST /api/auth/logout` - Dang xuat

**Dependencies:**
- MongoDB (luu user info)
- Redis (cache sessions)

**Authentication:** JWT (JSON Web Tokens)

---

### 2. **AUCTION SERVICE** (Port 3002)
**Chuc nang:** Quan ly vong doi dau gia

**Endpoints:**
- `GET /api/auctions` - Lay danh sach dau gia
- `POST /api/auctions` - Tao dau gia (Seller)
- `GET /api/auctions/:id` - Chi tiet dau gia
- `PUT /api/auctions/:id` - Cap nhat dau gia
- `DELETE /api/auctions/:id` - Xoa dau gia
- `POST /api/auctions/:id/register` - Dang ky tham gia
- `GET /api/auctions/:id/winner` - Lay nguoi thang

**Trang thai Auction:**
```
DRAFT -> OPEN -> CLOSING -> CLOSED -> COMPLETED
        |                          ^
        └─────-> EXPIRED -----> CANCELLED
```

**Dependencies:**
- Payment Service (xac nhan dat coc)
- MongoDB (luu auction data)

---

### 3. **BIDDING SERVICE** (Port 3003)
**Chuc nang:** Xu ly dau gia realtime, chong race condition

**WebSocket Events:**
```
CLIENT -> SERVER:
├── "join-auction" - Tham gia phong dau gia
├── "place-bid" - Dat gia
├── "leave-auction" - Roi khoi phong
└── "get-bidding-history" - Lay lich su

SERVER -> CLIENT:
├── "bid-placed" - Co nguoi dat gia
├── "auction-closing" - Sap ket thuc
├── "auction-closed" - Ket thuc
├── "bid-rejected" - Gia bi tu choi
└── "active-bidders" - So nguoi dang dat gia
```

**Race Condition Prevention:**
- Redis Locks (Distributed locks)
- Optimistic locking voi version field
- Sequence validation

**Algorithm:**
```
1. Client gui "place-bid" event
2. Server yeu cau Redis lock tren auctionId
3. Validate: gia > current bid, auction con open, user co balance
4. Cap nhat bid trong MongoDB (atomic operation)
5. Release lock
6. Broadcast "bid-placed" event toi clients
```

**Dependencies:**
- MongoDB (luu bids)
- Redis (distributed locks)
- Socket.io (realtime communication)

---

### 4. **PAYMENT SERVICE** (Port 3006)
**Chuc nang:** Quan ly vi, thanh toan, escrow

**Endpoints:**
- `GET /api/wallet` - Lay balance vi
- `POST /api/wallet/deposit` - Nap tien
- `POST /api/wallet/withdraw` - Rut tien
- `POST /api/transactions` - Tao giao dich
- `GET /api/transactions` - Lich su giao dich
- `GET /api/escrows/:auctionId` - Xem escrow
- `POST /api/escrows/:auctionId/release` - Giai phong escrow

**Escrow Workflow:**
```
1. Bidder thang -> Lock 10% deposit
2. Seller xac nhan nhan hang -> Giai phong 90%
3. Bidder xac nhan nhan hang -> Giai phong 100% cho seller
4. Neu dispute -> Manual admin review
```

**Dependencies:**
- MongoDB (luu transactions, wallets)
- Redis (cache balances)

---

### 5. **NOTIFICATION SERVICE** (Port 3004)
**Chuc nang:** Gui thong bao realtime

**18 Loai Thong Bao:**
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
   
5. **Order Events:**
    - Order shipped
    - Order completed

**WebSocket Connection:**
```
CLIENT -> NOTIFICATION SERVICE (Socket.io)
         |
      Subscribe to user channels
         |
Redis Pub/Sub receives events from other services
         |
Broadcast to connected clients
```

**Dependencies:**
- MongoDB (luu notification history)
- Redis (Pub/Sub for events)
- Socket.io

---

### 6. **COMMUNITY SERVICE** (Port 3005)
**Chuc nang:** Quan ly bai viet, binh luan

**Endpoints:**
- `GET /api/posts` - Lay danh sach bai
- `POST /api/posts` - Tao bai viet moi
- `PUT /api/posts/:id` - Cap nhat bai
- `DELETE /api/posts/:id` - Xoa bai
- `GET /api/posts/:id/comments` - Lay binh luan
- `POST /api/posts/:id/comments` - Them binh luan
- `DELETE /api/comments/:id` - Xoa binh luan

**Dependencies:**
- MongoDB (luu posts, comments)

---

### 7. **ORDER SERVICE** (Port 3007)
**Chuc nang:** Quan ly don hang va giao van

**Endpoints:**
- `POST /api/orders` - Tao don hang moi (tu auction winner)
- `GET /api/orders/:id` - Lay thong tin don hang
- `PUT /api/orders/:id/status` - Cap nhat trang thai don hang
- `GET /api/orders/user/me` - Lay danh sach don hang cua user

**Trang thai Don Hang:**
```
PENDING -> SHIPPING -> COMPLETED
   |          |
   └-----> CANCELLED
```

**Dependencies:**
- MongoDB (luu orders)
- Notification Service (gui thong bao trang thai)

---

## Database Schema

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

// Orders
{
  _id: ObjectId,
  auction: ObjectId (ref: Auctions),
  seller: ObjectId (ref: Users),
  buyer: ObjectId (ref: Users),
  shippingAddress: String,
  status: "pending" | "shipping" | "completed" | "cancelled",
  createdAt: Date,
  updatedAt: Date
}
```

### **Redis Keys:**

```
// Sessions
session:{sessionId} -> user data (TTL: varies)

// Locks (Race condition prevention)
lock:auction:{auctionId} -> lock owner (TTL: 5s)
lock:wallet:{userId} -> lock owner (TTL: 5s)

// Cache
auction:{auctionId} -> auction data (TTL: 5m)
user:{userId}:balance -> wallet balance (TTL: 1m)
active-bidders:{auctionId} -> [bidderIds]
```

---

## Communication Patterns

### **Synchronous (HTTP/REST):**
```
Frontend/Service A
        | (REST API call)
Service B
        | (response)
Return to Service A
```

**Used for:**
- CRUD operations
- Authentication checks
- Payment verification

### **Asynchronous (Redis Pub/Sub):**
```
Service A publishes event
        |
Redis Pub/Sub
        |
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
Client A <-> Socket.io <-> Bidding Service
Client B ^
Client C
         All connected clients receive
         "bid-placed" event simultaneously
```

**Used for:**
- Live bidding updates
- Notifications
- Active bidders count

---

## Race Condition Prevention

**Scenario:** 2 bidders dat gia dong thoi tren cung 1 dau gia

**Without Protection:**
```
Time | Bidder A (Client)    | Bidder B (Client)    | Server
-----+----------------------+----------------------+-------------
 1   | place-bid: $100      |                      |
 2   |                      | place-bid: $105      |
 3   |                      |                      | Check A: OK
 4   |                      |                      | Check B: OK  x WRONG!
 5   |                      |                      | Update: $100
 6   |                      |                      | Update: $105 v But lost A's bid!
```

**With Redis Locks:**
```
Time | Bidder A (Server)    | Bidder B (Server)    | Redis
-----+----------------------+----------------------+------------
 1   | Request lock         | Request lock         |
 2   | v Lock acquired      | x Lock waiting       | Locked
 3   | Validate & Update    | (waiting...)         | Locked
 4   | Release lock         |                      |
 5   | Broadcast event      | v Lock acquired      |
 6   |                      | Validate & Update    | Locked
 7   |                      | Release lock         | Unlocked
 8   |                      | Broadcast event      |
```

---

## Frontend Architecture

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
│   ├── OrderPage/
│   │   └── OrderDetailPage.jsx
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
    |
React Component / Hook
    |
Service (api.js / socket.js)
    |
Backend API / WebSocket
    |
Response received
    |
Update Context / State
    |
Component re-render
    |
Update UI
```

---

## Deployment & Scaling

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
├── Order Service (2 replicas)
├── MongoDB (Replica Set)
├── Redis (Sentinel + Replication)
└── Load Balancer (Nginx / HAProxy)
```

---

## Security Considerations

1. **Authentication:** JWT tokens voi expiration
2. **Authorization:** Role-based access control (RBAC)
3. **Data Validation:** Input sanitization tren tat ca endpoints
4. **Database:** Password hashing (bcrypt)
5. **API Security:** CORS, Rate limiting
6. **Payment:** Escrow mechanism de bao ve ca 2 ben
7. **Race Condition:** Redis distributed locks

---

## Performance Optimization

1. **Caching:** Redis cache cho auctions, user data
2. **Indexing:** MongoDB indexes tren frequently queried fields
3. **Connection Pooling:** Reuse database connections
4. **Load Balancing:** Services co the scale horizontally
5. **Compression:** gzip compression cho HTTP responses
6. **WebSocket:** Efficient binary protocol for real-time updates

---

## Request Flow - Vi du: Dat Gia Moi

```
1. FRONTEND (React)
   User clicks "Bid Now" -> enters amount

2. FRONTEND -> BIDDING SERVICE (WebSocket)
   Event: "place-bid" { auctionId, amount }

3. BIDDING SERVICE
   |- Acquire Redis lock on auctionId
   |- Validate:
   |  |- User is registered for this auction
   |  |- User has enough balance
   |  |- Amount > currentBid
   |  |- Auction still OPEN
   |  L- Auction hasn't ended
   |- Update MongoDB:
   |  |- auctions.currentBid = amount
   |  |- auctions.highestBidder = userId
   |  |- auctions.version++ (for optimistic locking)
   |  L- bids.insert new bid record
   |- Release Redis lock
   L- Publish Redis event "bid:placed"

4. NOTIFICATION SERVICE (listening to Redis Pub/Sub)
   |- Receives "bid:placed" event
   |- Creates notifications for:
   |  |- Previous highest bidder (outbid)
   |  L- Auction watchers
   L- Sends via WebSocket to connected clients

5. BIDDING SERVICE (WebSocket broadcast)
   |- Broadcast "bid-placed" to all clients in auction room
   L- Includes:
      |- Current bid amount
      |- Highest bidder
      L- Time remaining

6. FRONTEND (All connected clients)
   |- Receive "bid-placed" event
   |- Update UI with new bid
   |- Show notifications
   L- Update leaderboard in real-time
```

---

## Monitoring & Logging

**Can them:**
- Winston / Morgan logging
- Error tracking (Sentry)
- Performance monitoring (APM)
- Docker health checks
- Service health endpoints

---

## Summary

| Thanh Phan | Cong Nghe | Chuc Nang |
|-----------|-----------|---------|
| **Frontend** | React + Vite | UI nguoi dung |
| **Auth** | Node.js + JWT | Xac thuc & authorization |
| **Auction** | Node.js + MongoDB | CRUD dau gia |
| **Bidding** | Node.js + WebSocket + Redis | Dau gia realtime |
| **Payment** | Node.js + Escrow | Thanh toan & vi |
| **Notification** | Node.js + Socket.io + Redis Pub/Sub | Thong bao realtime |
| **Community** | Node.js + MongoDB | Posts & comments |
| **Order** | Node.js + MongoDB | Quan ly don hang & giao van |
| **Database** | MongoDB | Data persistence |
| **Cache** | Redis | Locks & sessions |
| **Orchestration** | Docker Compose | Container management |
