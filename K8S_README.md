# Huong dan Trien khai Kubernetes (K8s) va Autoscaling

Tai lieu nay huong dan chi tiet cach trien khai he thong dau gia len Kubernetes, cau hinh tu dong mo rong (Autoscaling - HPA) va theo doi (Monitoring - Prometheus).

## Dieu kien tien quyet

1.  **Docker Desktop**: Da duoc cai dat tren may.
2.  **Enable Kubernetes**: Bat tinh nang Kubernetes trong Settings cua Docker Desktop.
3.  **Metrics Server**: Bat buoc phai co de HPA co the doc duoc chi so CPU.

### Cai dat Metrics Server
Chay lenh sau de cai dat:
```powershell
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**Luu y quan trong cho Docker Desktop**: Do Docker Desktop dung chung chung chi tu ky, bạn can patch Metrics Server de bo qua kiem tra TLS bang lenh sau:
```powershell
kubectl patch deployment metrics-server -n kube-system --type='json' -p='[{"op": "add", "path": "/spec/template/spec/containers/0/args/-", "value": "--kubelet-insecure-tls"}]'
```

## Cac buoc trien khai he thong

Dự án cấp sẵn một file script để tự động hóa quá trình triển khai:

```powershell
.\scripts\deploy-k8s.bat
```

Script này sẽ thực hiện lần lượt:
1. Triển khai Database và Redis (Mô hình Database per Service).
2. Triển khai các Microservices (Auth, Auction, Bidding, Payment, Notification, Community, Order).
3. Triển khai Prometheus để theo dõi.
4. Triển khai Nginx Gateway làm cổng vào.

## Truy cap he thong

Do tranh xung dot voi cac phan mem nhu Apache/XAMPP (thuong dung cong 80), he thong Kubernetes duoc cau hinh chay tren cong **8080**.

- **Backend API**: `http://localhost:8080/api/...`
- **Frontend (Chạy local)**: `npm run dev` (Truy cập tại `http://localhost:5173`)
- **Prometheus**: `http://localhost:30000`

## Kiem tra tinh nang Autoscaling (HPA)

He thong duoc thiet ke de tu dong tang so luong Pod khi tai cao.

### 1. Theo doi trang thai HPA
Mo mot terminal moi va chay lenh sau de theo doi realtime:
```powershell
kubectl get hpa -w
```
Ban se thay cot **TARGETS** hien thi ti le tieu thu CPU hien tai so voi nguong cho phep.

### 2. Chay Stress Test (Gia lap tai)
Dự án có sẵn script để tạo hàng trăm request đồng thời vào hệ thống:
```powershell
node scripts/load-generator.js
```

### 3. Quan sat ket qua
- Khi CPU vuot qua nguong (da duoc cau hinh nhay o muc 20% cho Auction Service), cot **REPLICAS** se tu dong tang tu 1 len 2, 3...
- Khi ban dung script test, CPU se giam xuong. Kubernetes se doi khoang 5 phut (Stabilization Window) de dam bao tai da thuc su on dinh truoc khi giảm so luong Pod ve 1.

## Luu y ve Database
He thong su dung mô hình **Database per Service**. Moi Microservice ket noi den mot thuc the MongoDB rieng biet trong cụm Kubernetes de dam bao tinh doc lap va bao mat du lieu.
