# Kien Truc He Thong Dau Gia Truc Tuyen Realtime

## Tong Quan Kien Truc

He thong su dung **Microservices Architecture** voi cac thanh phan doc lap giao tiep qua HTTP/REST va WebSocket. He thong dam bao tinh High Availability (HA) va Kha nang mo rong (Scalability) thong qua Kubernetes.

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
│              (Nginx Gateway - Port 8080 trên K8s)                │
└───────────────────┬─────────────────────────────────────────────┘
                     │
        ┌───────────┼───────────┬─────────────────┬──────────────┬───────────────┐
        │           │           │                 │              │               │
    ┌───▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌────────▼──┐ ┌──────────▼──┐ ┌──────────▼──┐
    │AUTH     │ │AUCTION  │ │BIDDING  │ │PAYMENT   │ │NOTIFICATION│ │ORDER       │
    │SERVICE  │ │SERVICE  │ │SERVICE  │ │SERVICE   │ │SERVICE    │ │SERVICE     │
    └───┬─────┘ └────┬────┘ └────┬────┘ └────┬─────┘ └─────┬──────┘ └─────┬──────┘
        │            │           │           │             │              │
    ┌───▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌──▼──────┐ ┌──▼──────┐ ┌──▼──────┐
    │auth_db  │ │auction_db││bidding_db││payment_db││notify_db ││order_db  │
    └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
        (MongoDB per Service - Độc lập hoàn toàn)

                    ┌────────────────────────────┐
                    │      REDIS (Shared)         │
                    │  ├── Locks (Distributed)    │
                    │  ├── Sessions (JWT)         │
                    │  └── Pub/Sub (Events)       │
                    └────────────────────────────┘
```

---

## Mo hinh Du lieu (Database per Service)

He thong ap dung kien truc **Database per Service** de dam bao moi microservice co the phat trien, trien khai va mo rong ma khong anh huong den cac service khac.

| Service | Database | Collections chinh |
|---------|----------|-------------------|
| **Auth** | `auth_db` | users |
| **Auction** | `auction_db` | auctions, auction_registrations |
| **Bidding** | `bidding_db` | bids |
| **Payment** | `payment_db` | transactions, escrows |
| **Notification** | `notification_db` | notifications |
| **Community** | `community_db` | posts, comments |
| **Order** | `order_db` | orders |

---

## Chi Tiet Cac Microservices

### 1. AUTH SERVICE (Port 3001)
Quan ly dinh danh va xac thuc nguoi dung su dung JWT.

### 2. AUCTION SERVICE (Port 3002)
Quan ly toan bo vong doi cua mot cuoc dau gia (Draft -> Open -> Closed). 
- **Luu y**: Khi mot cuoc dau gia ket thuc, service nay se phat su kien de Order Service tao don hang.

### 3. BIDDING SERVICE (Port 3003)
Xu ly cac luot dat gia realtime qua WebSocket. Su dung **Redis Distributed Lock** de ngan chan Race Condition.

### 4. PAYMENT SERVICE (Port 3006)
Quan ly vi tien, lich su giao dich va co che **Escrow** (Giu tien tam thoi) de dam bao an toan cho giao dich.

### 5. NOTIFICATION SERVICE (Port 3004)
He thong thong bao da kenh (Realtime qua Socket.io va luu tru lich su). Lang nghe cac su kien tu Redis Pub/Sub.

### 6. COMMUNITY SERVICE (Port 3005)
Cung cap cac tinh nang tuong tac nhu bai viet va binh luan cho nguoi dung.

### 7. ORDER SERVICE (Port 3007)
Tu dong tao don hang khi co nguoi thang dau gia va theo doi trang thai van chuyen.

---

## Co che Xu ly Realtime va Autoscaling

### 1. Tranh xung dot dat gia (Race Condition)
- Su dung Redis Lock de dam bao tai mot thoi diem chi co mot request dat gia cho mot san pham duoc xu ly.
- Optimistic Locking trong MongoDB de kiem tra version du lieu.

### 2. Tu dong mo rong (Horizontal Pod Autoscaler)
He thong Kubernetes tu dong theo doi CPU cua tung Service:
- **Nguong kich hoat**: 20% - 70% CPU (tuy cau hinh).
- **Hanh dong**: Tu dong tang so luong Pod tu 1 len toi da 5-10 Pods de gánh tai.
- **Metrics**: Metrics Server thu thap du lieu va cung cap cho HPA controller.

## Luu do Du lieu (Request Flow)

1. Client gui request qua **Nginx Gateway** (Port 8080).
2. Gateway dieu phoi request den service tuong ung (dua tren path `/api/...`).
3. Service thuc hien logic, ghi du lieu vao database rieng hoac cache vao Redis.
4. Neu co su kien can thong bao, service phat message vao Redis Pub/Sub.
5. Notification Service nhan message va broadcast toi client qua WebSocket.
