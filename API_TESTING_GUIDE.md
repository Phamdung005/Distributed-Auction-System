# API Testing Guide - Postman/Thunder Client

## 🔐 1. Authentication Flow

### 1.1 Đăng ký User
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "Test123",
  "fullName": "Nguyen Van Test",
  "phone": "0123456789"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "user": {
      "id": "...",
      "username": "testuser",
      "email": "test@example.com",
      "fullName": "Nguyen Van Test",
      "role": "user"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 1.2 Đăng nhập
```http
POST http://localhost:3001/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "Test123"
}
```

### 1.3 Lấy thông tin User
```http
GET http://localhost:3001/api/auth/me
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 1.4 Refresh Token
```http
POST http://localhost:3001/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "YOUR_REFRESH_TOKEN"
}
```

## 🏷️ 2. Auction Management

### 2.1 Tạo Auction mới
```http
POST http://localhost:3002/api/auctions
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max 256GB",
  "description": "iPhone 15 Pro Max màu xanh titan, fullbox, bảo hành 12 tháng",
  "images": [
    "https://example.com/iphone1.jpg",
    "https://example.com/iphone2.jpg"
  ],
  "category": "electronics",
  "startPrice": 25000000,
  "minBidIncrement": 100000,
  "buyNowPrice": 30000000,
  "startTime": "2025-12-23T09:00:00.000Z",
  "endTime": "2025-12-25T18:00:00.000Z",
  "minDeposit": 1000000,
  "metadata": {
    "condition": "like-new",
    "location": "Hà Nội",
    "shippingAvailable": true
  }
}
```

### 2.2 Lấy danh sách Auctions
```http
GET http://localhost:3002/api/auctions?page=1&limit=10&sort=-createdAt
```

### 2.3 Lấy Auctions đang active
```http
GET http://localhost:3002/api/auctions/active?page=1&limit=10
```

### 2.4 Tìm kiếm Auctions
```http
GET http://localhost:3002/api/auctions?keyword=iphone&page=1&limit=10
```

### 2.5 Lọc theo Category
```http
GET http://localhost:3002/api/auctions?category=electronics&page=1
```

### 2.6 Lấy Auctions của tôi
```http
GET http://localhost:3002/api/auctions/my
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 2.7 Lấy chi tiết Auction
```http
GET http://localhost:3002/api/auctions/{AUCTION_ID}
```

### 2.8 Cập nhật Auction
```http
PUT http://localhost:3002/api/auctions/{AUCTION_ID}
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json

{
  "title": "iPhone 15 Pro Max 256GB - Giá tốt",
  "description": "Mô tả cập nhật"
}
```

### 2.9 Xóa Auction
```http
DELETE http://localhost:3002/api/auctions/{AUCTION_ID}
Authorization: Bearer YOUR_ACCESS_TOKEN
```

### 2.10 Hủy Auction
```http
POST http://localhost:3002/api/auctions/{AUCTION_ID}/cancel
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 💰 3. Bidding Operations (REST API)

### 3.1 Lấy thông tin Auction để bid
```http
GET http://localhost:3003/api/bidding/auction/{AUCTION_ID}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "iPhone 15 Pro Max 256GB",
    "currentPrice": 25000000,
    "minBidIncrement": 100000,
    "startTime": "...",
    "endTime": "...",
    "status": "active",
    "totalBids": 5,
    "timeRemaining": 3600,
    "recentBids": [...]
  }
}
```

### 3.2 Lấy lịch sử Bid
```http
GET http://localhost:3003/api/bidding/auction/{AUCTION_ID}/history?limit=20
```

### 3.3 Kiểm tra có thể Bid
```http
GET http://localhost:3003/api/bidding/auction/{AUCTION_ID}/can-bid
Authorization: Bearer YOUR_ACCESS_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "canBid": true
  }
}
```

hoặc

```json
{
  "success": true,
  "data": {
    "canBid": false,
    "reason": "Auction đã kết thúc"
  }
}
```

### 3.4 Kết thúc Auction (Admin)
```http
POST http://localhost:3003/api/bidding/auction/{AUCTION_ID}/end
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🔄 4. Testing Flow - Complete Scenario

### Scenario: Đấu giá một sản phẩm

#### Bước 1: Tạo 2 users (User A - Seller, User B - Bidder)

**User A - Seller:**
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "seller1",
  "email": "seller@example.com",
  "password": "Seller123",
  "fullName": "Nguyen Van Seller",
  "phone": "0123456789"
}
```
→ Lưu `accessToken` của User A

**User B - Bidder:**
```http
POST http://localhost:3001/api/auth/register
Content-Type: application/json

{
  "username": "bidder1",
  "email": "bidder@example.com",
  "password": "Bidder123",
  "fullName": "Tran Thi Bidder",
  "phone": "0987654321"
}
```
→ Lưu `accessToken` của User B

#### Bước 2: User A tạo Auction
```http
POST http://localhost:3002/api/auctions
Authorization: Bearer {USER_A_TOKEN}
Content-Type: application/json

{
  "title": "MacBook Pro M3 2024",
  "description": "MacBook Pro chip M3, RAM 16GB, SSD 512GB, fullbox",
  "images": ["https://example.com/macbook.jpg"],
  "category": "electronics",
  "startPrice": 30000000,
  "minBidIncrement": 500000,
  "startTime": "2025-12-22T10:00:00.000Z",
  "endTime": "2025-12-24T18:00:00.000Z"
}
```
→ Lưu `AUCTION_ID`

#### Bước 3: User B kiểm tra có thể bid
```http
GET http://localhost:3003/api/bidding/auction/{AUCTION_ID}/can-bid
Authorization: Bearer {USER_B_TOKEN}
```

#### Bước 4: User B đặt giá qua WebSocket
(Xem SOCKET_CLIENT_GUIDE.md để biết cách connect và bid qua WebSocket)

```javascript
// Connect WebSocket
const socket = io('http://localhost:3003', {
  auth: { token: USER_B_TOKEN }
});

// Join auction
socket.emit('auction:join', { auctionId: AUCTION_ID });

// Place bid
socket.emit('bid:place', {
  auctionId: AUCTION_ID,
  amount: 30500000
});
```

#### Bước 5: Kiểm tra bid history
```http
GET http://localhost:3003/api/bidding/auction/{AUCTION_ID}/history
```

## 📊 5. Query Parameters Reference

### Pagination
```
?page=1&limit=10
```

### Sorting
```
?sort=-createdAt  (Mới nhất)
?sort=createdAt   (Cũ nhất)
?sort=-currentPrice  (Giá cao nhất)
?sort=currentPrice   (Giá thấp nhất)
```

### Filters
```
?status=active
?category=electronics
?keyword=iphone
```

## ⚠️ 6. Common Errors

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token không hợp lệ hoặc đã hết hạn"
}
```
→ Refresh token hoặc login lại

### 400 Bad Request
```json
{
  "success": false,
  "message": "Dữ liệu không hợp lệ",
  "errors": [
    {
      "field": "email",
      "message": "Email không hợp lệ"
    }
  ]
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Bạn không có quyền truy cập"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Auction không tồn tại"
}
```

## 🛠️ 7. Postman Collection

Tạo Postman Collection với các biến:
- `BASE_URL_AUTH`: http://localhost:3001
- `BASE_URL_AUCTION`: http://localhost:3002
- `BASE_URL_BIDDING`: http://localhost:3003
- `ACCESS_TOKEN`: (set tự động sau khi login)
- `REFRESH_TOKEN`: (set tự động sau khi login)
- `AUCTION_ID`: (set tự động sau khi tạo auction)

## 📝 Notes

1. **Token Expiration**: Access token hết hạn sau 15 phút, refresh token sau 7 ngày
2. **Race Condition**: Bidding service xử lý tự động khi nhiều người bid cùng lúc
3. **Realtime Updates**: Sử dụng WebSocket để nhận updates realtime
4. **Validation**: Tất cả inputs đều được validate ở cả client và server
