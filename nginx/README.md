# Nginx API Gateway

Nginx được cấu hình làm API Gateway cho hệ thống microservices.

## Cổng truy cập

- **Nginx Gateway**: `http://localhost:8080`

## API Routes

Tất cả requests đều đi qua Nginx gateway tại port `8080`:

### Auth Service
- `http://localhost:8080/api/auth/*` → `auth-service:3001`

### Auction Service
- `http://localhost:8080/api/auctions/*` → `auction-service:3002`

### Bidding Service
- `http://localhost:8080/api/bids/*` → `bidding-service:3003`

### Payment Service
- `http://localhost:8080/api/wallet/*` → `payment-service:3006`
- `http://localhost:8080/api/payment/*` → `payment-service:3006`
- `http://localhost:8080/api/transactions/*` → `payment-service:3006`

### Notification Service
- `http://localhost:8080/api/notifications/*` → `notification-service:3004`
  - Hỗ trợ WebSocket

### Community Service
- `http://localhost:8080/api/posts/*` → `community-service:3005`
- `http://localhost:8080/api/comments/*` → `community-service:3005`

### Health Check
- `http://localhost:8080/health` → Nginx health status

## Ví dụ sử dụng

```bash
# Đăng ký user (qua Nginx)
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"123456"}'

# Lấy danh sách auctions (qua Nginx)
curl http://localhost:8080/api/auctions

# Đặt giá (qua Nginx)
curl -X POST http://localhost:8080/api/bids \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"auctionId":"xxx","amount":1000000}'
```

## Lợi ích

✅ **Single Entry Point**: Chỉ cần expose 1 port (8080) thay vì 6 ports  
✅ **Load Balancing**: Có thể scale services và Nginx sẽ distribute requests  
✅ **SSL Termination**: Dễ dàng thêm HTTPS sau này  
✅ **Rate Limiting**: Có thể thêm rate limiting cho từng route  
✅ **Logging**: Centralized logging cho tất cả requests  

## Cấu hình

File cấu hình: `nginx/nginx.conf`

Để thay đổi cấu hình:
1. Sửa file `nginx/nginx.conf`
2. Restart Nginx container:
   ```bash
   docker-compose restart nginx
   ```

## Monitoring

Xem logs của Nginx:
```bash
docker-compose logs -f nginx
```
