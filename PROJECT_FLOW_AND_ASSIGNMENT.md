# 📋 TỔNG QUAN DỰ ÁN & PHÂN CHIA CÔNG VIỆC

## 🎯 Mục tiêu Dự án
Xây dựng hệ thống đấu giá trực tuyến Realtime sử dụng kiến trúc Microservices với Socket.io, Redis, MongoDB.

---

## 👥 PHÂN CHIA CÔNG VIỆC CHO 3 NGƯỜI

### 🔵 **DŨNG - Auth & User Management Lead**
**Chịu trách nhiệm:** Authentication, Authorization, User Management

#### Backend Tasks:
- ✅ **Auth Service** 
  - [ ] Thêm Email Verification (gửi OTP qua email)
  - [ ] Implement Forgot Password & Reset Password
  - [ ] Thêm role-based permissions (Admin, Seller, Bidder)
  - [ ] Rate limiting cho login/register (chống spam)
  - [ ] Session management với Redis

#### Frontend Tasks:
- [ ] **Profile Management**
  - ✅ ProfilePage
  - [ ] Upload avatar (integrate với cloud storage)
  - [ ] Change password
  - [ ] Email verification UI
  - [ ] Two-factor authentication (optional)

- [ ] **Admin Dashboard** (P0 - Quan trọng)
  - [ ] AdminDashboard page (overview statistics)
  - [ ] AdminUsers page (quản lý users: ban, verify, role)
  - [ ] AdminAuctions page (duyệt/hủy phiên đấu giá)
  - [ ] AdminRoute component (protect admin routes)

#### Integration:
- [ ] Middleware `requireAdmin` cho admin endpoints
- [ ] JWT token refresh mechanism
- [ ] Audit log cho admin actions

---

### 🟢 **LINH - Auction Management Lead**
**Chịu trách nhiệm:** Auction Lifecycle, Product Management

#### Backend Tasks:
- ✅ **Auction Service**
  - [ ] **State Machine Implementation** (QUAN TRỌNG NHẤT)
    ```
    Draft → Scheduled → Active/Live → Pending Payment → Completed
                                   ↘ Canceled/Failed
    ```
  - [ ] Auction state transitions với validation
  - [ ] Scheduled auction auto-start (sử dụng Redis Key Expiration hoặc Cron Job)
  - [ ] Auto-end auction khi hết thời gian
  - [ ] Image upload cho auction items (integrate Cloudinary/AWS S3)
  - [ ] Search & Filter API (theo category, price range, status)
  - [ ] Seller dashboard API (my auctions stats)

#### Frontend Tasks:
- [ ] **Auction Management UI**
  - ✅ CreateAuctionPage (đã có cơ bản)
  - [ ] Image upload preview & multiple images
  - [ ] Datetime picker cho start/end time
  - [ ] Category selector
  - [ ] Draft save functionality
  
  - ✅ MyAuctionsPage (đã có)
  - [ ] Thêm tabs: Draft, Active, Ended, Canceled
  - [ ] Auction statistics (views, bids count)
  - [ ] Quick actions (Edit draft, Cancel, View results)

- [ ] **Discovery & Search**
  - ✅ HomePage (đã có danh sách cơ bản)
  - [ ] Filter sidebar (category, price, status)
  - [ ] Search bar với autocomplete
  - [ ] Sort options (Ending soon, Most bids, Newest)
  - [ ] Pagination hoặc Infinite scroll

#### Integration:
- [ ] Notification khi auction bắt đầu (cho followers)
- [ ] Automatic state transition background jobs
- [ ] Analytics tracking (page views, engagement)

---

### 🔴 **HÙNG - Bidding & Realtime Lead**
**Chịu trách nhiệm:** Realtime Bidding, WebSocket, Race Condition Prevention

#### Backend Tasks:
- ✅ **Bidding Service** 
  - [ ] **Atomic Bid Processing** (QUAN TRỌNG NHẤT - Tránh race condition)
    - [ ] Redis WATCH/MULTI/EXEC cho atomic updates
    - [ ] Lock mechanism (distributed lock với Redis)
    - [ ] Bid validation: current_price + min_increment
    - [ ] Auto-bid functionality (người dùng set max price, hệ thống tự bid)

  - [ ] **Socket.io Room Management**
    - [ ] Join/Leave auction room
    - [ ] Broadcast bid updates realtime (`new_bid` event)
    - [ ] User presence tracking (số người đang xem)
    - [ ] Disconnect handling (cleanup)

  - [ ] **Countdown Timer Logic**
    - [ ] Redis-based timer synchronization
    - [ ] Extend time nếu bid trong 30s cuối (anti-snipe)
    - [ ] End auction trigger

  - [ ] **Bid History & Stats**
    - [ ] Lưu lịch sử bid vào MongoDB
    - [ ] Top bidders ranking
    - [ ] User bid statistics

#### Frontend Tasks:
- [ ] **Realtime Bidding UI** (QUAN TRỌNG NHẤT)
  - ✅ AuctionDetailPage 
  - [ ] **Countdown Timer Component**
    - [ ] Realtime sync với server
    - [ ] Visual warning khi < 1 phút
    - [ ] End animation
  
  - [ ] **Bid Interface**
    - [ ] Quick bid buttons (+10k, +50k, +100k)
    - [ ] Custom amount input với validation
    - [ ] Bid confirmation modal
    - [ ] Loading state khi đang process bid
  
  - [ ] **Live Updates Panel**
    - [ ] Current highest bid (highlight nếu là của user)
    - [ ] Bid history list (auto-scroll mới nhất)
    - [ ] User presence indicator (X người đang xem)
    - [ ] Toast notifications cho bid events

  - [ ] **Auto-bid Setup Modal**
    - [ ] Set maximum bid amount
    - [ ] Enable/Disable toggle
    - [ ] Show auto-bid status

#### Integration:
- [ ] Socket.io error handling & reconnection logic
- [ ] Optimistic UI updates (show bid immediately, rollback nếu fail)
- [ ] Network status indicator
- [ ] Notification Service integration (winner announcement)

---

## 📊 STATE MACHINE - VÒNG ĐỜI PHIÊN ĐẤU GIÁ

```
┌─────────────┐
│   DRAFT     │  Seller đang soạn thảo
└──────┬──────┘
       │ publish()
       ↓
┌─────────────┐
│  SCHEDULED  │  Đã duyệt, chờ thời gian bắt đầu
└──────┬──────┘
       │ auto-start (Redis/Cron)
       ↓
┌─────────────┐
│ ACTIVE/LIVE │  ← Đang nhận bid (Socket.io hoạt động)
└──────┬──────┘
       │ timer expires
       ↓
┌──────────────┐
│PENDING PAYMENT│ Chờ người thắng thanh toán
└──────┬───────┘
       │ payment confirmed
       ↓
┌─────────────┐
│  COMPLETED  │  Giao dịch thành công
└─────────────┘

       ↓ (nếu không có bid hoặc bùng kèo)
┌─────────────┐
│CANCELED/FAIL│
└─────────────┘
```

### Trạng thái và Actions:

| Trạng thái | Mô tả | Actions cho phép | Người có quyền |
|-----------|-------|------------------|----------------|
| **Draft** | Đang soạn thảo | Edit, Delete, Publish | Seller |
| **Scheduled** | Chờ bắt đầu | Cancel (trước giờ G) | Seller, Admin |
| **Active** | Đang đấu giá | Place Bid, View | All Users |
| **Pending Payment** | Chờ thanh toán | Confirm Payment, Report | Winner, Admin |
| **Completed** | Hoàn thành | Review, View History | Winner, Seller |
| **Canceled** | Đã hủy | View Reason | All |

---

## 🔄 USER FLOWS CHI TIẾT

### 1️⃣ **BIDDER FLOW** (Người Mua)

```
[Vào trang chủ] 
    ↓
[Xem danh sách Live Auctions] ← LINH: Filter/Search UI
    ↓
[Click vào sản phẩm]
    ↓
[WebSocket connect to Room] ← HÙNG: Socket.io room join
    ↓
[Xem giá hiện tại + Countdown] ← HÙNG: Realtime sync
    ↓
[Nhập giá + Click "Đặt giá"]
    ↓
[Backend: Validate + Atomic Update] ← HÙNG: Redis WATCH/EXEC
    ↓
├─ [Thành công] → Broadcast "new_bid" → All users nhận update
│   ↓
│   [Nhận thông báo "Bạn đang dẫn đầu"]
│
└─ [Thất bại] → "Giá không hợp lệ" → Quay lại bước nhập giá
    ↓
[Có người bid cao hơn] ← HÙNG: Socket emit
    ↓
[Nhận Toast "Bạn bị vượt mặt"] → Quay lại bid
    ↓
[Timer = 0] → Auto end auction
    ↓
├─ [Bạn thắng] → Chuyển trang Payment
└─ [Bạn thua] → Show "Đấu giá đã kết thúc"
```

### 2️⃣ **SELLER FLOW** (Người Bán)

```
[Đăng nhập] ← DŨNG: Auth Service
    ↓
[Xác minh tài khoản] ← DŨNG: Email verification
    ↓
[Tạo Auction mới] ← LINH: CreateAuctionPage
    ↓
[Upload ảnh, nhập thông tin]
    ↓
[Set: Giá khởi điểm, Bước giá, Thời gian]
    ↓
[Save as Draft] → State: DRAFT
    ↓
[Preview & Publish] → State: SCHEDULED
    ↓
[Auction tự động bắt đầu] ← LINH: Auto-start job
    ↓ State: ACTIVE
[Theo dõi Dashboard Realtime] ← LINH: Seller stats
    ↓
[Xem số lượt bid, người xem]
    ↓
[Auction kết thúc] → State: PENDING_PAYMENT
    ↓
[Nhận thông tin Winner] ← Notification
    ↓
[Xác nhận giao hàng] → State: COMPLETED
```

### 3️⃣ **SYSTEM FLOW** (Background Processing)

```
[User places bid]
    ↓
[Bidding Service nhận request] ← HÙNG
    ↓
[Redis: WATCH current_price] ← Atomic operation
    ↓
[Check: new_bid > current + increment]
    ↓
├─ Valid → MULTI/EXEC update
│   ↓
│   [Update Redis + MongoDB]
│   ↓
│   [Emit "new_bid" via Socket.io] → All clients update UI
│   ↓
│   [Save bid history]
│
└─ Invalid → Return error

[Background Timer Job] ← LINH: Auction Service
    ↓
[Redis Key Expiration / Cron]
    ↓
[Detect auction end time]
    ↓
[Lock auction (no more bids)]
    ↓
[Calculate winner]
    ↓
[Update state → PENDING_PAYMENT]
    ↓
[Trigger Notification Service]
    ↓
[Send Email/Push to Winner & Seller]
```

---

## 🛠️ TECHNICAL REQUIREMENTS

### Công nghệ chung (3 người đều cần biết):
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), Redis, Socket.io
- **Frontend**: React, React Router, Socket.io-client, React Hook Form
- **DevOps**: Docker, Docker Compose
- **Tools**: Git, Postman (API testing), VS Code

### Yêu cầu đặc biệt:

#### DŨNG:
- JWT token handling (access + refresh token)
- bcrypt password hashing
- Email service (Nodemailer)
- Admin middleware & role checking

#### LINH:
- Cron jobs / Task scheduling (node-cron hoặc agenda)
- Redis Key Expiration events
- Image upload (Multer + Cloud storage)
- Search optimization (MongoDB indexes)

#### HÙNG:
- Socket.io rooms & namespaces
- Redis WATCH/MULTI/EXEC (atomic operations)
- Distributed locks (redlock)
- Race condition prevention
- Performance optimization (caching, debouncing)

---

## 📅 TIMELINE ĐĂNG KÝ

### Phase 1: Foundation (Week 1) - Tất cả 3 người
- [x] Setup Docker environment ✅
- [x] Basic CRUD cho 3 services ✅
- [x] Socket.io cơ bản ✅
- [ ] Database schema finalization
- [ ] API documentation (Postman Collection)

### Phase 2: Core Features (Week 2-3)
**DŨNG:**
- [ ] Admin Dashboard (Week 2)
- [ ] Email verification & Password reset (Week 3)

**LINH:**
- [ ] Auction State Machine (Week 2) ← CRITICAL
- [ ] Auto-start/end jobs (Week 3)

**HÙNG:**
- [ ] Atomic bid processing (Week 2) ← CRITICAL
- [ ] Realtime UI polish (Week 3)

### Phase 3: Integration & Testing (Week 4)
- [ ] Integration testing (3 người cùng làm)
- [ ] Fix bugs & Race condition testing
- [ ] Performance testing (stress test với nhiều users)
- [ ] Security audit

### Phase 4: Polish & Deployment (Week 5)
- [ ] UI/UX improvements
- [ ] Error handling & logging
- [ ] Documentation
- [ ] Deploy to production

---

## 🚨 CRITICAL POINTS - PHẢI LÀM ĐÚNG

### 1. Race Condition Prevention (HÙNG)
```javascript
// ❌ SAI - Race condition
const auction = await Auction.findById(id);
if (bidAmount > auction.currentPrice) {
  auction.currentPrice = bidAmount; // ← 2 người cùng bid = VỠ!
  await auction.save();
}

// ✅ ĐÚNG - Atomic operation với Redis
const result = await redis.watch('auction:' + id);
const currentPrice = await redis.get('auction:' + id);
if (bidAmount > parseFloat(currentPrice)) {
  await redis
    .multi()
    .set('auction:' + id, bidAmount)
    .exec();
}
```

### 2. State Transition Validation (LINH)
```javascript
// Chỉ cho phép transition hợp lệ
const validTransitions = {
  DRAFT: ['SCHEDULED'],
  SCHEDULED: ['ACTIVE', 'CANCELED'],
  ACTIVE: ['PENDING_PAYMENT', 'FAILED'],
  PENDING_PAYMENT: ['COMPLETED', 'FAILED'],
};

// Validate trước khi update
if (!validTransitions[currentState].includes(newState)) {
  throw new Error('Invalid state transition');
}
```

### 3. JWT Security (DŨNG)
```javascript
// Luôn verify token ở mọi protected route
// Implement token refresh để UX tốt hơn
// Rate limit cho sensitive endpoints (login, register)
```

---

## 📞 COMMUNICATION & COLLABORATION

### Daily Standup (Mỗi ngày 15 phút):
- Tôi đã làm gì hôm qua?
- Tôi sẽ làm gì hôm nay?
- Có vấn đề gì cần support không?

### Code Review Rules:
- Mỗi Pull Request cần ít nhất 1 người review
- Test trước khi merge vào main branch
- Document API changes trong Postman Collection

### Git Workflow:
```bash
main (production)
  ↓
dev (testing)
  ↓
feature/dung-admin-dashboard
feature/linh-state-machine
feature/hung-atomic-bidding
```

---

## 📚 TÀI LIỆU THAM KHẢO

### DŨNG:
- JWT Best Practices: https://jwt.io/
- Node.js Email: https://nodemailer.com/
- Role-based Access Control: https://auth0.com/docs/manage-users/access-control/rbac

### LINH:
- Node-cron: https://www.npmjs.com/package/node-cron
- MongoDB Indexes: https://docs.mongodb.com/manual/indexes/
- Image Upload: https://cloudinary.com/documentation

### HÙNG:
- Socket.io Rooms: https://socket.io/docs/v4/rooms/
- Redis Transactions: https://redis.io/topics/transactions
- Redlock: https://github.com/mike-marcacci/node-redlock

---

## ✅ DEFINITION OF DONE

### Một task được coi là hoàn thành khi:
1. ✅ Code được commit và push lên Git
2. ✅ Unit test pass (nếu có)
3. ✅ API đã test bằng Postman và hoạt động đúng
4. ✅ Frontend UI hoạt động trên browser
5. ✅ Không có error trong console
6. ✅ Code review đã được approve
7. ✅ Documentation đã update (nếu cần)

---

## 🎯 SUCCESS CRITERIA

Dự án thành công khi:
- ✅ Người dùng có thể tạo phiên đấu giá
- ✅ Nhiều người có thể bid realtime không bị race condition
- ✅ Timer countdown chính xác và đồng bộ
- ✅ Hệ thống tự động kết thúc auction và thông báo người thắng
- ✅ Admin có thể quản lý users và auctions
- ✅ Không có security vulnerabilities
- ✅ Performance tốt với 50+ concurrent users

---

**Lưu ý cuối cùng:** Đây là dự án nhóm, communication là chìa khóa thành công. Hãy support lẫn nhau, đặc biệt là ở các điểm integration giữa 3 services! 💪
