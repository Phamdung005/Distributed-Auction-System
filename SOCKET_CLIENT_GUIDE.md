# Socket.io Client Example - Kết nối Bidding Service

## 📡 Kết nối WebSocket

```javascript
import io from 'socket.io-client';

// Kết nối đến bidding service với authentication
const socket = io('http://localhost:3003', {
  auth: {
    token: 'your-jwt-access-token'
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Connection events
socket.on('connect', () => {
  console.log('✅ Đã kết nối Socket.io:', socket.id);
});

socket.on('disconnect', (reason) => {
  console.log('❌ Ngắt kết nối:', reason);
});

socket.on('connect_error', (error) => {
  console.error('❌ Lỗi kết nối:', error.message);
});
```

## 🎯 Join/Leave Auction Room

```javascript
// Join auction room
socket.emit('auction:join', { auctionId: 'auction-id-here' });

// Lắng nghe khi join thành công
socket.on('auction:joined', (data) => {
  console.log('✅ Đã join auction:', data);
  /*
  data = {
    auctionId: '...',
    title: '...',
    currentPrice: 1000000,
    minBidIncrement: 10000,
    startTime: '...',
    endTime: '...',
    status: 'active',
    totalBids: 5,
    timeRemaining: 3600
  }
  */
});

// Leave auction room
socket.emit('auction:leave', { auctionId: 'auction-id-here' });
```

## 💰 Đặt giá (Place Bid)

```javascript
// Đặt giá
socket.emit('bid:place', {
  auctionId: 'auction-id-here',
  amount: 1500000
});

// Lắng nghe kết quả bid thành công
socket.on('bid:success', (data) => {
  console.log('✅ Đặt giá thành công:', data);
  /*
  data = {
    message: 'Đặt giá thành công',
    auctionId: '...',
    newPrice: 1500000,
    minNextBid: 1510000,
    totalBids: 6
  }
  */
});

// Lắng nghe lỗi khi đặt giá
socket.on('bid:error', (data) => {
  console.error('❌ Lỗi đặt giá:', data.message);
  // Ví dụ: "Giá đặt phải lớn hơn hoặc bằng 1,500,000 VND"
});
```

## 📊 Realtime Updates

```javascript
// Lắng nghe khi có người đặt giá mới (realtime update)
socket.on('bid:update', (data) => {
  console.log('🔔 Có bid mới:', data);
  /*
  data = {
    auctionId: '...',
    bidderId: '...',
    amount: 1600000,
    timestamp: '2025-12-22T10:30:00.000Z'
  }
  */
  
  // Cập nhật UI với giá mới
  updateAuctionPrice(data.amount);
});

// Lắng nghe khi có user join
socket.on('user:joined', (data) => {
  console.log('👤 User joined:', data);
  /*
  data = {
    userId: '...',
    totalParticipants: 15
  }
  */
});

// Lắng nghe khi có user leave
socket.on('user:left', (data) => {
  console.log('👋 User left:', data);
  /*
  data = {
    userId: '...',
    totalParticipants: 14
  }
  */
});
```

## 📜 Lấy Bid History

```javascript
// Lấy lịch sử bid
socket.emit('bid:history', {
  auctionId: 'auction-id-here',
  limit: 20
});

// Nhận bid history
socket.on('bid:history:response', (data) => {
  console.log('📜 Bid history:', data);
  /*
  data = {
    auctionId: '...',
    bids: [
      {
        bidderId: '...',
        amount: 1600000,
        timestamp: '2025-12-22T10:30:00.000Z'
      },
      // ...more bids
    ]
  }
  */
});
```

## ⚠️ Error Handling

```javascript
// Lắng nghe lỗi chung
socket.on('error', (data) => {
  console.error('❌ Error:', data.message);
});

// Xử lý reconnection
socket.on('reconnect', (attemptNumber) => {
  console.log('🔄 Đã reconnect sau', attemptNumber, 'lần thử');
  // Join lại các auction rooms
  rejoinAuctionRooms();
});

socket.on('reconnect_failed', () => {
  console.error('❌ Không thể reconnect');
  // Thông báo cho user
  showConnectionError();
});
```

## 🎨 React Hook Example

```javascript
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export const useAuctionSocket = (auctionId, token) => {
  const [socket, setSocket] = useState(null);
  const [auctionData, setAuctionData] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Khởi tạo socket
    const newSocket = io('http://localhost:3003', {
      auth: { token },
      transports: ['websocket']
    });

    // Connection events
    newSocket.on('connect', () => {
      setConnected(true);
      // Join auction room
      newSocket.emit('auction:join', { auctionId });
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Auction events
    newSocket.on('auction:joined', (data) => {
      setAuctionData(data);
    });

    newSocket.on('bid:update', (data) => {
      setAuctionData(prev => ({
        ...prev,
        currentPrice: data.amount,
        totalBids: prev.totalBids + 1
      }));
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.emit('auction:leave', { auctionId });
      newSocket.disconnect();
    };
  }, [auctionId, token]);

  // Helper function để đặt giá
  const placeBid = (amount) => {
    return new Promise((resolve, reject) => {
      socket.emit('bid:place', { auctionId, amount });
      
      socket.once('bid:success', resolve);
      socket.once('bid:error', reject);
    });
  };

  return {
    socket,
    connected,
    auctionData,
    placeBid
  };
};
```

## 💡 Usage trong Component

```javascript
import React from 'react';
import { useAuctionSocket } from './hooks/useAuctionSocket';

function AuctionPage({ auctionId, accessToken }) {
  const { connected, auctionData, placeBid } = useAuctionSocket(
    auctionId,
    accessToken
  );

  const handleBid = async () => {
    try {
      const bidAmount = auctionData.currentPrice + auctionData.minBidIncrement;
      await placeBid(bidAmount);
      alert('Đặt giá thành công!');
    } catch (error) {
      alert('Lỗi: ' + error.message);
    }
  };

  if (!connected) {
    return <div>Đang kết nối...</div>;
  }

  return (
    <div>
      <h1>{auctionData?.title}</h1>
      <p>Giá hiện tại: {auctionData?.currentPrice?.toLocaleString('vi-VN')} VND</p>
      <p>Tổng bids: {auctionData?.totalBids}</p>
      <button onClick={handleBid}>
        Đặt giá {(auctionData?.currentPrice + auctionData?.minBidIncrement)?.toLocaleString('vi-VN')} VND
      </button>
    </div>
  );
}

export default AuctionPage;
```

## 🔒 Security Notes

1. **Token Authentication**: Luôn gửi JWT token khi connect
2. **Token Expiration**: Xử lý khi token hết hạn
3. **Rate Limiting**: Server có rate limiting cho bid actions
4. **Validation**: Tất cả inputs đều được validate ở server

## 📚 Event Reference

| Event | Direction | Data | Description |
|-------|-----------|------|-------------|
| `auction:join` | Client → Server | `{ auctionId }` | Join auction room |
| `auction:leave` | Client → Server | `{ auctionId }` | Leave auction room |
| `bid:place` | Client → Server | `{ auctionId, amount }` | Đặt giá |
| `bid:history` | Client → Server | `{ auctionId, limit? }` | Lấy lịch sử bid |
| `auction:joined` | Server → Client | Auction details | Đã join thành công |
| `bid:success` | Server → Client | Bid result | Đặt giá thành công |
| `bid:error` | Server → Client | `{ message }` | Lỗi đặt giá |
| `bid:update` | Server → Client | Bid data | Realtime bid update |
| `user:joined` | Server → Client | `{ userId, total }` | User vào room |
| `user:left` | Server → Client | `{ userId, total }` | User rời room |
