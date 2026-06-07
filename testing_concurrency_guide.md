# Hướng Dẫn Chạy Thử Nghiệm Dự Án & Lỗi Hổng Concurrency (Race Condition)

Tài liệu này hướng dẫn từng bước chi tiết từ khâu khởi dựng hệ thống đến cách chạy các kịch bản thử nghiệm Race Condition cho Ví điện tử (Wallet) và Đặt giá (Bidding) trên cả hai nhánh: **Bảo mật (master)** và **Lỗ hổng (vulnerable-race-condition)**.

---

## I. Yêu Cầu Cài Đặt Ban Đầu (Prerequisites)
Hãy đảm bảo máy tính đã cài đặt các công cụ sau:
1. **Node.js** (Phiên bản v18 trở lên)
2. **Docker & Docker Compose** (Để chạy toàn bộ hệ thống Microservices)
3. **Git**

---

## II. Chuẩn Bị Môi Trường Thử Nghiệm

### Bước 1: Khởi động hệ thống Microservices bằng Docker
Mở terminal tại thư mục gốc của dự án và chạy lệnh:
```bash
# Khởi động cơ sở dữ liệu và các services dưới nền
docker-compose up -d
```
> *Lưu ý: Đợi khoảng 1 - 2 phút cho các dịch vụ khởi tạo kết nối hoàn toàn với Database và Redis.*

### Bước 2: Cài đặt thư viện cho các script test
Mở một cửa sổ Terminal mới, di chuyển vào thư mục chứa mã nguồn kiểm thử và cài đặt các thư viện cần thiết:
```bash
cd scripts/demo-concurrency
npm install
```

---

## III. Kịch Bản 1: Thử Nghiệm Trạng Thái Bảo Mật (Nhánh `master`)

Đây là trạng thái hệ thống hoạt động an toàn, đã được vá lỗi concurrency bằng **Atomic Database Updates** và **Redis Distributed Lock**.

### Bước 1: Chuyển sang nhánh `master`
```bash
git checkout master
```

### Bước 2: Khởi động lại các container để nhận code bảo mật
```bash
docker-compose restart payment-service bidding-service
```

### Bước 3: Chạy script kiểm thử

#### 1. Kiểm tra Ví điện tử (Wallet Concurrency)
Chạy script:
```bash
node scripts/demo-concurrency/demo-wallet-race.js
```
* **Kỳ vọng kết quả**:
  * Tài khoản được nạp 100k, sau đó gửi đồng thời 5 request rút 80k.
  * Chỉ duy nhất **1/5** giao dịch thành công. 4 giao dịch còn lại báo thất bại do không đủ số dư.
  * Số dư cuối cùng trong DB là `20.000 VND`. Hệ thống in thông báo màu xanh: `HỆ THỐNG AN TOÀN`.

#### 2. Kiểm tra Đặt giá (Bidding Concurrency)
Chạy script:
```bash
node scripts/demo-concurrency/demo-bidding-race.js
```
* **Kỳ vọng kết quả**:
  * 3 Bidder gửi đồng thời lượt đặt giá 110k (giá khởi điểm 100k + bước giá 10k).
  * Chỉ duy nhất **1/3** lượt đặt giá được chấp nhận.
  * Hệ thống in thông báo màu xanh: `HỆ THỐNG AN TOÀN`.

---

## IV. Kịch Bản 2: Thử Nghiệm Trạng Thái Có Lỗ Hổng (Nhánh `vulnerable-race-condition`)

Đây là trạng thái hệ thống bị cố ý gỡ bỏ cơ chế bảo vệ để trình diễn lỗ hổng bảo mật.

### Bước 1: Chuyển sang nhánh Lỗ hổng
```bash
git checkout vulnerable-race-condition
```

### Bước 2: Khởi động lại các container để nhận code lỗi
```bash
docker-compose restart payment-service bidding-service
```

### Bước 3: Chạy script kiểm thử

#### 1. Kiểm tra Ví điện tử (Wallet Concurrency)
Chạy script:
```bash
node scripts/demo-concurrency/demo-wallet-race.js
```
* **Kỳ vọng kết quả**:
  * Cả **5/5** giao dịch rút 80k đều thành công (Tổng rút 400k trong khi ví ban đầu chỉ có 100k!).
  * Số dư cuối cùng trong DB vẫn là `20.000 VND` (bị mất mát cập nhật - Lost Update).
  * Hệ thống in cảnh báo màu đỏ: `CẢNH BÁO BẢO MẬT: Phát hiện lỗ Race Condition!`.

#### 2. Kiểm tra Đặt giá (Bidding Concurrency)
Chạy script:
```bash
node scripts/demo-concurrency/demo-bidding-race.js
```
* **Kỳ vọng kết quả**:
  * Cả **3/3** Bidder đều đặt giá thành công ở mức giá `110.000 VND` tại cùng một thời điểm.
  * Lịch sử ghi nhận 3 lượt đặt giá trùng nhau phá vỡ quy tắc bước giá tối thiểu.
  * Hệ thống in cảnh báo màu đỏ: `CẢNH BÁO BẢO MẬT: Phát hiện Race Condition!`.

---

## V. Khắc Phục Lỗi Nếu Gặp Sự Cố (Troubleshooting)

1. **Lỗi treo script hoặc `Timeout`**:
   * Do các container Docker chưa sẵn sàng hoặc kết nối mạng Docker bị nghẽn. Hãy thử chạy lại lệnh `docker-compose restart`.
2. **Lỗi `Port is already allocated`**:
   * Do máy bạn đang chạy dịch vụ khác trên các port như `8080`, `3003`, hoặc `6379`. Hãy tắt các dịch vụ trùng port đó trước khi chạy `docker-compose up`.
3. **Xem logs thời gian thực của hệ thống**:
   ```bash
   # Xem log của bidding-service
   docker-compose logs -f bidding-service
   
   # Xem log của payment-service
   docker-compose logs -f payment-service
   ```
