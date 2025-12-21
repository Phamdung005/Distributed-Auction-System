# Hệ Thống Đấu Giá Realtime - Microservices Architecture

## 📋 Tổng quan
Hệ thống đấu giá realtime sử dụng kiến trúc Microservices với khả năng xử lý đồng thời nhiều người đấu giá.

## 🏗️ Kiến trúc
```
├── frontend/                    # ReactJS Web Application
├── services/
│   ├── auth-service/           # Xác thực người dùng
│   ├── auction-service/        # Quản lý đấu giá
│   └── bidding-service/        # Xử lý bid realtime
├── shared/                     # Code dùng chung
└── docker-compose.yml          # Docker orchestration
```

## 🚀 Tech Stack
- **Frontend**: ReactJS + Vite (Single Page Web Application)
- **Backend**: Node.js + Express
- **Database**: MongoDB (Primary), Redis (Cache & Pub/Sub)
- **Communication**: REST API + WebSocket (Socket.io)
- **Container**: Docker

## 🔥 Tính năng chính
- ✅ Authentication với JWT
- ✅ Quản lý đấu giá (CRUD)
- ✅ Đấu giá realtime với WebSocket
- ✅ Xử lý Race Condition với Redis
- ✅ Caching với Redis
- ✅ Pub/Sub cho multi-instance scaling

## 🏃 Chạy Project
```bash
# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Dừng services
docker-compose down
```

## 📦 Services
- **auth-service**: `http://localhost:3001`
- **auction-service**: `http://localhost:3002`
- **bidding-service**: `http://localhost:3003` (WebSocket)
- **MongoDB**: `localhost:27017`
- **Redis**: `localhost:6379`

## 🔐 Environment Variables
Mỗi service cần file `.env` riêng. Xem `.env.example` trong mỗi service folder.
