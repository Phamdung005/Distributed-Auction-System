# 🚀 Hướng Dẫn Chạy Toàn Bộ Hệ Thống

Hướng dẫn từng bước để khởi động toàn bộ hệ thống Đấu Giá Realtime.

---

## 📋 Yêu Cầu Hệ Thống

- **Node.js**: >= 18.x
- **npm**: >= 9.x
- **Docker & Docker Compose**: >= 20.x (nếu chạy bằng Docker)
- **MongoDB**: >= 7.0 (nếu không dùng Docker)
- **Redis**: >= 7.0 (nếu không dùng Docker)

---

## 🎯 Phương Pháp 1: Chạy Với Docker (Recommended)

### Bước 1: Cấu hình Environment Variables

Tạo file `.env` ở thư mục gốc:

```bash
# MongoDB
MONGODB_URI=mongodb://mongodb:27017/auction-system

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Services Ports
AUTH_SERVICE_PORT=3001
AUCTION_SERVICE_PORT=3002
BIDDING_SERVICE_PORT=3003

# Node Environment
NODE_ENV=development
```

### Bước 2: Build và chạy containers

```bash
# Chạy tất cả services
docker-compose up --build

# Hoặc chạy ở background
docker-compose up -d --build
```

### Bước 3: Kiểm tra services

```bash
# Xem logs
docker-compose logs -f

# Kiểm tra containers đang chạy
docker-compose ps
```

Services sẽ chạy ở:
- **Auth Service**: http://localhost:3001
- **Auction Service**: http://localhost:3002
- **Bidding Service**: http://localhost:3003
- **MongoDB**: localhost:27017
- **Redis**: localhost:6379

### Bước 4: Chạy Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:3000

### Bước 5: Tắt services

```bash
# Tắt và xóa containers
docker-compose down

# Tắt và xóa volumes (database)
docker-compose down -v
```

---

## 🔧 Phương Pháp 2: Chạy Thủ Công (Manual)

### Bước 1: Cài đặt MongoDB & Redis

#### MongoDB:
```bash
# Windows: Download từ mongodb.com
# Mac: brew install mongodb-community
# Linux: sudo apt-get install mongodb
```

#### Redis:
```bash
# Windows: Download từ github.com/microsoftarchive/redis
# Mac: brew install redis
# Linux: sudo apt-get install redis-server
```

### Bước 2: Khởi động MongoDB & Redis

```bash
# MongoDB
mongod --dbpath /path/to/data

# Redis
redis-server
```

### Bước 3: Cấu hình Environment Variables

Tạo file `.env` ở mỗi service:

**services/auth-service/.env**
```bash
PORT=3001
MONGODB_URI=mongodb://localhost:27017/auction-system
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=development
```

**services/auction-service/.env**
```bash
PORT=3002
MONGODB_URI=mongodb://localhost:27017/auction-system
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
AUTH_SERVICE_URL=http://localhost:3001
NODE_ENV=development
```

**services/bidding-service/.env**
```bash
PORT=3003
MONGODB_URI=mongodb://localhost:27017/auction-system
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-super-secret-jwt-key
AUTH_SERVICE_URL=http://localhost:3001
AUCTION_SERVICE_URL=http://localhost:3002
NODE_ENV=development
```

### Bước 4: Cài đặt dependencies cho mỗi service

```bash
# Auth Service
cd services/auth-service
npm install

# Auction Service
cd ../auction-service
npm install

# Bidding Service
cd ../bidding-service
npm install
```

### Bước 5: Chạy từng service (mở 3 terminals)

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm start
```

**Terminal 2 - Auction Service:**
```bash
cd services/auction-service
npm start
```

**Terminal 3 - Bidding Service:**
```bash
cd services/bidding-service
npm start
```

### Bước 6: Chạy Frontend (Terminal 4)

```bash
cd frontend
npm install
npm run dev
```

---

## ✅ Kiểm Tra Hệ Thống

### 1. Health Check APIs

```bash
# Auth Service
curl http://localhost:3001/health

# Auction Service
curl http://localhost:3002/health

# Bidding Service
curl http://localhost:3003/health
```

### 2. Test API với Postman/Thunder Client

Import collection từ: `docs/API_TESTING_GUIDE.md`

### 3. Test Frontend

Truy cập: http://localhost:3000

---

## 🧪 Test Flow Hoàn Chỉnh

### 1. Đăng ký tài khoản

```
Vào: http://localhost:3000/register
Điền form và submit
```

### 2. Đăng nhập

```
Vào: http://localhost:3000/login
Login với tài khoản vừa tạo
```

### 3. Tạo đấu giá mới

```
Click "Tạo đấu giá" trên navbar
Điền thông tin sản phẩm
Submit form
```

### 4. Xem chi tiết đấu giá

```
Vào trang chủ
Click vào một đấu giá
```

### 5. Test Realtime Bidding

```
Mở 2 browser khác nhau (hoặc 2 incognito tabs)
Login 2 tài khoản khác nhau
Vào cùng 1 đấu giá
User 1 đặt giá => User 2 thấy giá update realtime
User 2 đặt giá => User 1 thấy giá update realtime
```

---

## 🐛 Troubleshooting

### Lỗi: "Cannot connect to MongoDB"

```bash
# Kiểm tra MongoDB đang chạy
mongosh

# Hoặc với Docker
docker-compose logs mongodb
```

### Lỗi: "Cannot connect to Redis"

```bash
# Kiểm tra Redis đang chạy
redis-cli ping

# Hoặc với Docker
docker-compose logs redis
```

### Lỗi: "Port already in use"

```bash
# Windows: Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

### Lỗi: "JWT token invalid"

```
- Kiểm tra JWT_SECRET phải giống nhau ở tất cả services
- Xóa localStorage và login lại
```

### Lỗi: "Socket connection failed"

```
- Kiểm tra bidding-service đang chạy
- Kiểm tra VITE_SOCKET_URL ở frontend
- Check CORS settings ở backend
```

### Lỗi: "CORS policy"

```javascript
// Thêm vào mỗi service:
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

## 📊 Monitoring

### View Logs

**Docker:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f bidding-service
```

**Manual:**
```
Check terminal output của từng service
```

### MongoDB Logs

```bash
# Docker
docker-compose exec mongodb mongosh

# Manual
mongosh

# List databases
show dbs

# Use database
use auction-system

# Show collections
show collections

# Query users
db.users.find()

# Query auctions
db.auctions.find()
```

### Redis Logs

```bash
# Docker
docker-compose exec redis redis-cli

# Manual
redis-cli

# Monitor commands
MONITOR

# List keys
KEYS *

# Get lock
GET lock:auction:*
```

---

## 🔄 Reset Database

### Docker:

```bash
# Xóa volumes
docker-compose down -v

# Restart
docker-compose up -d
```

### Manual:

```bash
# MongoDB
mongosh
use auction-system
db.dropDatabase()

# Redis
redis-cli
FLUSHALL
```

---

## 📈 Performance Tips

### 1. Tăng Worker Processes

```javascript
// services/bidding-service/server.js
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
} else {
  // Start server
}
```

### 2. Bật Redis Persistence

```bash
# redis.conf
save 900 1
save 300 10
save 60 10000
appendonly yes
```

### 3. MongoDB Indexing

```javascript
// Tạo indexes
db.auctions.createIndex({ status: 1, startTime: -1 })
db.auctions.createIndex({ sellerId: 1 })
db.users.createIndex({ email: 1 }, { unique: true })
```

---

## 🎯 Next Steps

1. ✅ Chạy toàn bộ hệ thống
2. ✅ Test các tính năng cơ bản
3. ✅ Test realtime bidding với multiple users
4. 📚 Đọc thêm tài liệu:
   - [API Testing Guide](./docs/API_TESTING_GUIDE.md)
   - [Socket Client Guide](./docs/SOCKET_CLIENT_GUIDE.md)
   - [Race Condition Explained](./docs/RACE_CONDITION_EXPLAINED.md)
   - [Architecture Overview](./docs/ARCHITECTURE.md)

---

## 🆘 Support

Nếu gặp vấn đề:

1. Check logs của service bị lỗi
2. Verify environment variables
3. Kiểm tra MongoDB/Redis connections
4. Đọc phần Troubleshooting ở trên
5. Check documentation trong folder `docs/`

---

**Happy Coding! 🎉**
