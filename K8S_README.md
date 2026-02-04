# Hướng dẫn Triển khai Kubernetes (K8s) & Autoscaling

Tài liệu này hướng dẫn cách triển khai hệ thống đấu giá lên Kubernetes với tính năng Autoscaling (HPA) và Monitoring (Prometheus).

## Điều kiện tiên quyết

1.  **Docker Desktop** đã được cài đặt.
2.  Enable **Kubernetes** trong Docker Desktop (Settings -> Kubernetes -> [x] Enable Kubernetes).
3.  Cài đặt **Metrics Server** (Bắt buộc để HPA hoạt động):
    ```bash
    kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
    ```
    *Lưu ý: Nếu chạy trên Docker Desktop local, bạn có thể cần thêm flag `--kubelet-insecure-tls` vào deployment của metrics-server nếu gặp lỗi.*

## 🤔 Docker Compose vs Kubernetes: Khi nào dùng cái nào?

Dự án hiện tại hỗ trợ **cả hai** cách chạy:

1.  **Chạy bằng Docker Compose** (Cũ):
    *   **Thích hợp**: Phát triển tính năng (Dev), chạy nhanh, đơn giản.
    *   **Hạn chế**: Không có Autoscaling, không có Zero-downtime update.
    *   **Lệnh**: `docker-compose up -d`

2.  **Chạy bằng Kubernetes** (Mới - Để test Autoscaling):
    *   **Thích hợp**: Test Autoscaling, mô phỏng môi trường Production, High Availability.
    *   **Yêu cầu**: Cài đặt K8s, tốn nhiều RAM hơn.
    *   **Lệnh**: `.\scripts\deploy-k8s.bat`

**Quan trọng**: Để test tính năng Autoscaling mà bạn yêu cầu, bạn **BẮT BUỘC** phải chạy kiểu Kubernetes.

## Cấu trúc thư mục K8s

```
k8s/
├── infrastructure/    # Database (MongoDB, Redis)
├── services/          # Apps (Auth, Auction, Bidding, ...)
├── monitoring/        # Prometheus
└── ingress/           # Nginx Gateway
```

## Các bước triển khai

### 1. Build Docker Images
Vì K8s local cần image có sẵn, bạn cần build các image trước (hoặc cấu hình để nó pull từ registry).
```bash
docker-compose build
```
*Lưu ý: Đảm bảo image policy trong cái file yaml là `imagePullPolicy: IfNotPresent` hoặc `Never` nếu dùng image local.*

### 2. Deploy Infrastructure (Database & Redis)
```bash
kubectl apply -f k8s/infrastructure/redis.yaml
kubectl apply -f k8s/infrastructure/mongodb.yaml
```

### 3. Deploy Services (Backend Apps)
```bash
kubectl apply -f k8s/services/auth-service.yaml
kubectl apply -f k8s/services/auction-service.yaml
kubectl apply -f k8s/services/bidding-service.yaml
kubectl apply -f k8s/services/payment-service.yaml
kubectl apply -f k8s/services/notification-service.yaml
kubectl apply -f k8s/services/community-service.yaml
kubectl apply -f k8s/services/order-service.yaml
```
Mỗi service sẽ tự động tạo một **HPA** (Horizontal Pod Autoscaler) để theo dõi CPU.

### 4. Deploy Monitoring (Prometheus)
```bash
kubectl apply -f k8s/monitoring/prometheus.yaml
```
Truy cập Prometheus tại: `http://localhost:30000` (hoặc port NodePort được gán).

### 5. Deploy Gateway (Nginx)
```bash
kubectl apply -f k8s/ingress/nginx-gateway.yaml
```
Sau bước này, bạn có thể truy cập API qua `http://localhost`.

### 6. Chạy Frontend (React)
Vì chưa có Dockerfile cho Frontend, bạn sẽ chạy nó ở môi trường local (Host):
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại `http://localhost:5173`.
Do Nginx Gateway (K8s) đã hứng port `80` localhost, Frontend sẽ gọi API qua `http://localhost/api/...` thành công.

## Kiểm tra Autoscaling

1.  **Xem trạng thái HPA**:
    ```bash
    kubectl get hpa
    ```
    Bạn sẽ thấy cột `TARGETS` (ví dụ: `0%/70%`) và `REPLICAS` (số lượng pod hiện tại).

2.  **Test Stress (Tạo tải giả)**:
    Sử dụng tool như `k6` hoặc `wrk` hoặc tạo vòng lặp curl để gọi API liên tục.
    Khi CPU > 70%, K8s sẽ tự động tăng số lượng Pod từ 1 lên tối đa 5.

3.  **Xem Pod scale up**:
    ```bash
    kubectl get pods -w
    ```
