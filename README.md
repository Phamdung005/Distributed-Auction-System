# He Thong Dau Gia Truc Tuyen Realtime

## Tong quan

He thong dau gia truc tuyen su dung kien truc **Microservices**, xu ly dau gia realtime voi kha nang chong race condition khi nhieu nguoi dat gia dong thoi. He thong cung cap kha nang tu dong mo rong (Autoscaling) tren moi truong Kubernetes.

## Cong nghe su dung

- **Backend**: Node.js, Express, MongoDB, Redis, Socket.io
- **Frontend**: React, Vite, Tailwind CSS
- **DevOps**: Docker, Docker Compose, Kubernetes (K8s)
- **Monitoring**: Prometheus, Metrics Server

## Kien truc Du lieu (Database per Service)

He thong ap dung mo hinh **Database per Service** de dam bao tinh doc lap va kha nang mo rong cho tung dich vu:

- **Auth Service**: `auth_db` (users)
- **Auction Service**: `auction_db` (auctions, auction_registrations)
- **Bidding Service**: `bidding_db` (bids)
- **Payment Service**: `payment_db` (transactions, escrows)
- **Notification Service**: `notification_db` (notifications)
- **Community Service**: `community_db` (posts, comments)
- **Order Service**: `order_db` (orders)

Tat ca cac database deu chay tren MongoDB, moi dich vu chi co the truy cap vao database rieng cua minh.

## Cau truc du an

```
ung-dung-phan-tan-web-auction/
├── frontend/                    # Ung dung Web React (Port 5173)
├── services/                    # Cac Microservices
├── k8s/                         # Cau hinh trien khai Kubernetes
├── scripts/                     # Script tien ich (Deploy, Load test)
└── docker-compose.yml
```

## Cac chuc nang chinh

- Xac thuc & JWT
- Quan ly dau gia & vong doi san pham
- Dau gia realtime voi WebSocket
- Xu ly xung dot dat gia voi Redis locks
- Dang ky tham gia va dat coc (Escrow)
- He thong vi dien tu & thanh toan
- Thong bao realtime da kenh
- Cong dong (Bai viet & Binh luan)
- Quan ly don hang & trang thai giao hang

## Huong dan khoi chay

### Cach 1: Chay bang Docker Compose (Phu hop de phat trien)
```bash
docker-compose up -d
```
Truy cap: `http://localhost:5173`

### Cach 2: Chay bang Kubernetes (Phu hop de test Autoscaling)
Yeu cau: Da cai dat Metrics Server.
```powershell
.\scripts\deploy-k8s.bat
```
Truy cap: `http://localhost:8080`

Xem chi tiet tai [K8S_README.md](K8S_README.md).

## Tai lieu tham khao

- [SYSTEM_ARCHITECTURE.md](SYSTEM_ARCHITECTURE.md) - Chi tiet kien truc he thong
- [K8S_README.md](K8S_README.md) - Huong dan Kubernetes & Autoscaling
- [RACE_CONDITION_EXPLAINED.md](RACE_CONDITION_EXPLAINED.md) - Co che xu ly dat gia dong thoi
