# 🔨 Hệ Thống Đấu Giá Trực Tuyến Thời Gian Thực (Realtime Web Auction)

Hệ thống sàn đấu giá trực tuyến xây dựng theo kiến trúc **Microservices** phân tán, hỗ trợ đấu giá thời gian thực với độ trễ thấp qua WebSocket, đồng thời xử lý triệt để bài toán tranh chấp dữ liệu (**Race Condition**) khi hàng nghìn người dùng cùng tham gia đặt giá hoặc thao tác ví điện tử đồng thời.

---

## 🌐 Đường Dẫn Triển Khai (Live Deployment)

| Dịch vụ | Nền tảng | Đường dẫn truy cập | Mô tả |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | Vercel | [https://ung-dung-phan-tan-web-auction.vercel.app](https://distributed-auction-system.vercel.app/) | Giao diện Web SPA cho Bidder, Seller và Admin |
| **API Health Check** | Render | [https://distributed-auction-system.onrender.com/health](https://distributed-auction-system.onrender.com/health) | Kiểm tra trạng thái hoạt động của hệ thống |
| **Database** | MongoDB Atlas | *Cloud Replica Set* | Cụm cơ sở dữ liệu phân tán đám mây |
| **In-Memory Cache & Pub/Sub** | Upstash Redis | *Cloud Redis Cluster* | Quản lý Distributed Lock và Event Pub/Sub |

---

## 🛠️ Ngăn Xếp Công Nghệ (Tech Stack)

- **Frontend**: React 18, Vite, Tailwind CSS, Socket.io-client, React Router v6, Axios, Lucide Icons, React Hook Form.
- **Backend**: Node.js (v20+), Express.js, Socket.io, Mongoose (MongoDB ODM), Redis Client, JWT Authentication, Bcrypt.
- **Kiến trúc**: Microservices (Database-per-Service pattern), Event-Driven Architecture (Redis Pub/Sub), API Gateway Pattern (Nginx Reverse Proxy).
- **Hạ tầng & Triển khai**: Docker, Docker Compose, Kubernetes (K8s, HPA Autoscaling), Nginx, Render Cloud, Vercel SPA.

---

## 🏛️ Kiến Trúc Dữ Liệu (Database per Service)

Hệ thống tuân thủ nghiêm ngặt nguyên lý **Database per Service**, mỗi microservice hoàn toàn độc lập về mặt dữ liệu và chỉ giao tiếp với nhau qua REST API hoặc Message Pub/Sub:

| Microservice | Port nội bộ | Cơ sở dữ liệu | Collections chính | Vai trò & Trách nhiệm |
| :--- | :---: | :---: | :--- | :--- |
| **API Gateway (Nginx)** | `8080` / `10000` | - | - | Điểm tiếp nhận duy nhất, định tuyến request và kết nối WebSocket |
| **Auth Service** | `3001` | `auth_db` | `users` | Xác thực người dùng, cấp phát JWT (Access & Refresh tokens), phân quyền |
| **Auction Service** | `3002` | `auction_db` | `auctions`, `auction_registrations` | Quản lý toàn bộ vòng đời phiên đấu giá, đăng ký tham gia, tự động hoàn cọc |
| **Bidding Service** | `3003` | `bidding_db` | `bids` | Xử lý trả giá thời gian thực qua WebSocket, phòng chống xung đột giá |
| **Notification Service** | `3004` | `notification_db` | `notifications` | Nhận sự kiện qua Redis Pub/Sub, broadcast thông báo realtime cho người dùng |
| **Community Service** | `3005` | `community_db` | `posts`, `comments` | Diễn đàn trao đổi, bình luận, tương tác cộng đồng |
| **Payment Service** | `3006` | `payment_db` | `users`, `transactions`, `escrows` | Ví điện tử, nạp/rút tiền, cơ chế ký quỹ (Escrow) phong tỏa và giải phóng cọc |
| **Order Service** | `3007` | `order_db` | `orders` | Tự động tạo đơn hàng cho người thắng phiên đấu giá, theo dõi vận chuyển |

---

## 🔒 Cơ Chế Phòng Chống Lỗ Hổng Concurrency (Race Condition)

Dự án chú trọng giải quyết bài toán cốt lõi trong các hệ thống phân tán chịu tải cao:

1. **Bidding Concurrency (Đua đặt giá đồng thời)**:
   - Sử dụng **Redis Distributed Lock** (`redlock` / `SETNX` với TTL tự giải phóng) để tuần tự hóa các yêu cầu đặt giá cho cùng một phiên đấu giá.
   - Kiểm tra số dư khả dụng (Available Balance) của người dùng trước khi chấp nhận lệnh đặt giá.
   - Đảm bảo tính toán toàn vẹn: Không bao giờ xảy ra tình trạng 2 người cùng đặt thành công ở cùng một mức giá hoặc giá mới thấp hơn giá hiện tại.

2. **Wallet Balance Race (Đua nạp/rút số dư ví)**:
   - Áp dụng kỹ thuật **Atomic Condition Updates** (`$inc` kèm điều kiện `$gte: amount`) trực tiếp ở tầng MongoDB.
   - Ngăn chặn triệt để hành vi rút tiền lặp (Double Spending) khi gửi nhiều request rút tiền cùng một mili-giây.

3. **Tự động hoàn cọc (Escrow Auto-Refund)**:
   - Khi một phiên đấu giá bị hủy bởi Admin hoặc người bán, Auction Service tự động kích hoạt tiến trình hoàn cọc hàng loạt trong Payment Service.
   - Toàn bộ số tiền cọc đang bị phong tỏa (frozen escrows) sẽ được hoàn trả đầy đủ vào ví của bidder và phát thông báo qua Notification Service.

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
ung-dung-phan-tan-web-auction/
├── frontend/                    # Ứng dụng Web React SPA (Vite, Tailwind CSS)
├── nginx/                       # Cấu hình Nginx API Gateway chạy môi trường local
├── services/                    # 7 Microservices độc lập
│   ├── auction-service/         # Quản lý phiên đấu giá
│   ├── auth-service/            # Xác thực & phân quyền
│   ├── bidding-service/         # Đặt giá & WebSocket realtime
│   ├── community-service/       # Bài viết & bình luận
│   ├── notification-service/    # Thông báo đa kênh (Socket + PubSub)
│   ├── order-service/           # Đơn hàng sau khi thắng đấu giá
│   └── payment-service/         # Ví điện tử & Ký quỹ (Escrow)
├── shared/                      # Module dùng chung (Redis client, logger, helper)
├── k8s/                         # File cấu hình triển khai Kubernetes & HPA
├── scripts/                     # Kịch bản kiểm thử và triển khai
│   ├── demo-concurrency/        # Kịch bản kiểm thử Race Condition (Bidding & Wallet)
│   ├── render/                  # Script khởi động đa dịch vụ trên Render
│   ├── deploy-k8s.bat           # File batch triển khai Kubernetes nhanh
│   └── load-generator.js        # Script sinh tải kiểm thử hiệu năng
├── Dockerfile                   # Dockerfile đóng gói phục vụ Cloud Container
├── docker-compose.yml           # Khởi chạy toàn bộ hệ thống bằng Docker Compose
└── testing_concurrency_guide.md # Hướng dẫn chi tiết chạy thử nghiệm Concurrency
```

---

## 🚀 Hướng Dẫn Khởi Chạy Hệ Thống

### Cách 1: Khởi chạy bằng Docker Compose (Khuyên dùng cho Local Dev)

Yêu cầu máy đã cài đặt **Docker** và **Docker Compose**.

1. **Khởi động toàn bộ cơ sở dữ liệu và 7 Microservices:**
   ```bash
   docker-compose up -d
   ```

2. **Truy cập ứng dụng:**
   - **Frontend (Giao diện người dùng)**: `http://localhost:5173`
   - **Nginx API Gateway**: `http://localhost:8080`
   - **Kiểm tra API**: `http://localhost:8080/health` hoặc `http://localhost:8080/api/auctions`

3. **Dừng hệ thống:**
   ```bash
   docker-compose down
   ```

---

## 🧪 Kiểm Thử Xung Đột Concurrency & Tải Cao

Dự án cung cấp sẵn bộ kịch bản kiểm thử tự động để chứng minh khả năng xử lý bất đồng bộ và chống Race Condition:

1. **Cài đặt dependencies cho công cụ kiểm thử:**
   ```bash
   cd scripts/demo-concurrency
   npm install
   ```

2. **Chạy kịch bản kiểm thử Ví điện tử (Wallet Race Condition):**
   ```bash
   node demo-wallet-race.js
   ```

3. **Chạy kịch bản kiểm thử Đặt giá đồng thời (Bidding Race Condition):**
   ```bash
   node demo-bidding-race.js
   ```

> 📖 Xem hướng dẫn chi tiết từng bước kiểm thử trên cả hai trạng thái an toàn (`master`) và lỗ hổng (`vulnerable-race-condition`) tại: **[testing_concurrency_guide.md](testing_concurrency_guide.md)**.

---

## 📚 Tài Liệu Tham Khảo

- **[testing_concurrency_guide.md](testing_concurrency_guide.md)**: Hướng dẫn chi tiết quy trình kiểm thử Concurrency & Race Condition.
- **[nginx/README.md](nginx/README.md)**: Hướng dẫn cấu hình và danh sách Route của Nginx API Gateway.
- **[frontend/README.md](frontend/README.md)**: Chi tiết cấu trúc mã nguồn, components và trạng thái của Frontend.
