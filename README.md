# He Thong Dau Gia Truc Tuyen Realtime

## Tong quan

He thong dau gia truc tuyen su dung kien truc **Microservices**, xu ly dau gia realtime voi kha nang chong race condition khi nhieu nguoi dat gia dong thoi.

## Cong nghe su dung

**Backend**: Node.js, Express, MongoDB, Redis, Socket.io
**Frontend**: React, Vite, Tailwind CSS
**DevOps**: Docker, Docker Compose

## Cau truc du an

```
ung-dung-phan-tan-web-auction/
├── frontend/                    # Ung dung Web React (Port 5173)
├── services/                    # Cac Microservices
│   ├── auth-service/           # Xac thuc (Port 3001)
│   ├── auction-service/        # Quan ly dau gia (Port 3002)
│   ├── bidding-service/        # Dau gia Realtime (Port 3003)
│   ├── notification-service/   # Thong bao (Port 3004)
│   ├── payment-service/        # Vi & Thanh toan (Port 3006)
│   ├── community-service/      # Bai viet & Binh luan (Port 3005)
│   └── order-service/          # Don hang & Giao van (Port 3007)
└── docker-compose.yml
```

## So do ERD

![Database ERD](image/erd.png)

**10 Bang**: users, auctions, bids, auction_registrations, transactions, escrows, notifications, posts, comments, orders

## Cac chuc nang da hoan thanh

- Xac thuc & JWT
- Quan ly dau gia (CRUD) & vong doi auction
- Dau gia realtime voi WebSocket
- Xu ly race condition (Redis locks)
- Dang ky tham gia dau gia voi dat coc 10%
- He thong vi & thanh toan
- Thong bao realtime (18 loai)
- Bai viet & binh luan cong dong
- Quan ly don hang & trang thai shipping

## Cac chuc nang chua hoan thanh

- Xac thuc email & dat lai mat khau
- Tim kiem nang cao & bo loc
- Tu dong dau gia
- Trang quan tri admin
- Nhieu phuong thuc thanh toan
- Phan tich & bao cao

## Ke hoach tuong lai

### Tach rieng Database
Tach database rieng cho moi service voi kien truc huong su kien va Saga pattern

### Tinh nang nang cao
- **Dashboard realtime cho seller**: Thong ke dau gia (luot xem, luot dat gia, du doan doanh thu)
- **Phan tich cho bidder**: Ty le thang/thua, theo doi chi tieu
- Goi y dua tren AI
- Ung dung di dong (React Native)

### Kha nang mo rong
- Trien khai Kubernetes
- Tu dong mo rong & can bang tai
- Phan manh database & read replicas
- Giam sat (Prometheus, Grafana)

### Tinh nang kinh doanh
- Nhieu loai dau gia (silent, dutch, sealed-bid)
- Tinh nang cao cap & huy hieu xac minh
- Tich hop van chuyen & thanh toan

## Khoi chay

Xem chi tiet tai [QUICK_START.md](QUICK_START.md)

```bash
docker-compose up -d
```

**Frontend**: http://localhost:5173

## Tai lieu

- [QUICK_START.md](QUICK_START.md) - Huong dan khoi dong
- [STRUCTURE.md](STRUCTURE.md) - Cau truc chi tiet
- [RACE_CONDITION_EXPLAINED.md](RACE_CONDITION_EXPLAINED.md) - Xu ly race condition
- [PROJECT_FLOW_AND_ASSIGNMENT.md](PROJECT_FLOW_AND_ASSIGNMENT.md) - Flow nguoi dung va phan cong cong viec
