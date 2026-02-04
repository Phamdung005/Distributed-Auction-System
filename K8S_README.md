# Hướng dẫn Triển khai Kubernetes (K8s) cho Dự án Đấu giá

Tài liệu này hướng dẫn chi tiết cách triển khai hệ thống lên Kubernetes (Docker Desktop Dashboard) từ con số 0.

## 1. Yêu cầu (Prerequisites)

- **Docker Desktop**: Đã cài đặt và bật **Kubernetes** trong phần Settings.
- **Cấu hình máy**: RAM tối thiểu 8GB (khuyên dùng 16GB nếu chạy Full Services).
- **Công cụ**: `kubectl` (đi kèm Docker Desktop), `Node.js` (để chạy load test).

## 2. Các bước Triển khai (Deployment Steps)

### Bước 1: Triển khai Cơ sở hạ tầng (Infrastructure)

Mở Terminal tại thư mục gốc dự án:

```powershell
# Triển khai Redis (Cache)
kubectl apply -f k8s/infrastructure/redis.yaml

# Triển khai MongoDB (Database)
# Lựa chọn 1: Chạy cơ bản (Tiết kiệm RAM - Khuyên dùng cho Dev)
kubectl apply -f k8s/infrastructure/mongodb.yaml
```

**[NÂNG CAO] Lựa chọn 2: Chạy Database Scaling (Chỉ dùng khi máy mạnh >16GB RAM)**
Nếu bạn muốn thử nghiệm tính năng Scale Database, hãy dùng 1 trong 2 lệnh sau Thay cho lệnh mongodb.yaml ở trên:

**Option A: Replication (High Availability)**
```powershell
kubectl apply -f k8s/infrastructure/mongodb-replicaset.yaml
```
*Lưu ý: Sau khi chạy, cần cập nhật Connection String trong các service thành:*
`mongodb://mongodb-replicaset-0.mongodb-replicaset:27017,mongodb-replicaset-1.mongodb-replicaset:27017,mongodb-replicaset-2.mongodb-replicaset:27017/TEN_DB?replicaSet=rs0`

**Option B: Sharding (Big Data)**
```powershell
kubectl apply -f k8s/infrastructure/mongodb-sharded.yaml
```
*Lưu ý: Sau khi chạy, cần cập nhật Connection String trong các service thành:*
`mongodb://mongo-router:27017/TEN_DB`

### Bước 2: Cài đặt Metrics Server (Bắt buộc cho Autoscaling)

Để tính năng HPA (Tự động mở rộng) hoạt động, bạn cần cài Metrics Server đã được patch lỗi TLS cho Docker Desktop:

```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
# Patch lỗi TLS (quan trọng)
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

### Bước 3: Triển khai Microservices

```powershell
# Triển khai toàn bộ services (nhớ build docker image trước nếu chưa có)
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/auction-service.yaml
kubectl apply -f k8s/services/bidding-service.yaml
kubectl apply -f k8s/services/payment-service.yaml
kubectl apply -f k8s/services/notification-service.yaml
kubectl apply -f k8s/services/community-service.yaml
kubectl apply -f k8s/services/order-service.yaml
```

### Bước 4: Triển khai Gateway (Ingress)

Chúng ta sử dụng Nginx làm Gateway chính tại cổng **8080**:

```powershell
kubectl apply -f k8s/ingress/nginx-gateway.yaml
```

**Kiểm tra:** Truy cập `http://localhost:8080/api/auctions` trên trình duyệt.

---

## 3. Kiểm thử Autoscaling (HPA)

Hệ thống đã được cấu hình để tự động Scale `auction-service` khi CPU vượt quá 20%.

### Bước 1: Theo dõi trạng thái HPA

Mở một tab terminal mới và chạy lệnh này để xem real-time:
```powershell
kubectl get hpa -w
```

### Bước 2: Chạy công cụ tạo tải giả lập

Mở một tab terminal khác:
```powershell
cd scripts
node load-generator.js
```
Script này sẽ giả lập 200 người dùng truy cập liên tục vào hệ thống.

### Bước 3: Quan sát kết quả

1.  Tại màn hình `kubectl get hpa -w`, bạn sẽ thấy cột `TARGETS` tăng từ `1%/20%` lên `100%/20%`.
2.  Cột `REPLICAS` sẽ tự động tăng từ `1` -> `2` -> `4`...
3.  Khi tắt script load test, sau vài phút, số lượng Pod sẽ giảm dần về 1.

---

## 4. Troubleshooting (Xử lý lỗi)

- **Lỗi ImagePullBackOff**: Chạy `docker-compose build` để build lại image mới nhất.
- **Lỗi HPA targets <unknown>**: Kiểm tra lại bước cài đặt Metrics Server.
- **Frontend không kết nối được**: Đảm bảo Frontend trỏ đúng vào `http://localhost:8080`.
