# 🎨 Frontend - Hệ Thống Đấu Giá Realtime

Web application được xây dựng với **ReactJS**, **Vite**, **Socket.io Client** - một Single Page Application (SPA) hiện đại với giao diện responsive và kết nối realtime với backend.

---

## 📋 Mục Lục

- [Công nghệ sử dụng](#công-nghệ-sử-dụng)
- [Cài đặt](#cài-đặt)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Tính năng](#tính-năng)
- [Pages](#pages)
- [Components](#components)
- [Services](#services)
- [Context](#context)

---

## 🛠️ Công Nghệ Sử Dụng

| Công nghệ | Version | Mục đích |
|-----------|---------|----------|
| **React** | 18.2.0 | UI Library cho Web SPA |
| **Vite** | 5.0.8 | Build tool (nhanh hơn Webpack) |
| **React Router** | 6.20.0 | Client-side routing |
| **Axios** | 1.6.2 | HTTP Client với interceptors |
| **Socket.io Client** | 4.6.1 | WebSocket realtime bidding |
| **React Hook Form** | 7.48.2 | Form validation |
| **React Toastify** | 9.1.3 | Toast notifications |
| **date-fns** | 2.30.0 | Date formatting (tiếng Việt) |

---

## 📦 Cài Đặt

### 1. Cài đặt dependencies

```bash
cd frontend
npm install
```

### 2. Cấu hình environment (tùy chọn)

Tạo file `.env` nếu muốn thay đổi API URL:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3003
```

### 3. Chạy development server

```bash
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:3000**

### 4. Build production

```bash
npm run build
```

Build output sẽ ở folder `dist/`

---

## 📁 Cấu Trúc Thư Mục

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── components/         # Reusable components
│   │   ├── Navbar.jsx
│   │   ├── AuctionCard.jsx
│   │   └── PrivateRoute.jsx
│   │
│   ├── contexts/           # React Context
│   │   └── AuthContext.jsx
│   │
│   ├── pages/              # Page components
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── AuctionDetailPage.jsx
│   │   ├── CreateAuctionPage.jsx
│   │   ├── MyAuctionsPage.jsx
│   │   └── ProfilePage.jsx
│   │
│   ├── services/           # API & Socket services
│   │   ├── api.js          # Axios HTTP client
│   │   └── socket.js       # Socket.io client
│   │
│   ├── App.jsx             # Root component với routes
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
│
├── package.json
├── vite.config.js
└── index.html
```

---

## 🎯 Tính Năng

### 🔐 Authentication
- ✅ Đăng ký tài khoản
- ✅ Đăng nhập/Đăng xuất
- ✅ Tự động refresh token
- ✅ Protected routes

### 🏠 Trang chủ
- ✅ Danh sách đấu giá
- ✅ Tìm kiếm theo keyword
- ✅ Lọc theo danh mục
- ✅ Filter: Tất cả / Đang đấu giá

### 💰 Chi tiết đấu giá
- ✅ Hiển thị thông tin chi tiết
- ✅ **Realtime bidding** qua Socket.io
- ✅ Đếm số người đang xem
- ✅ Lịch sử bid gần đây
- ✅ Quick bid buttons

### 📝 Quản lý đấu giá
- ✅ Tạo đấu giá mới
- ✅ Danh sách đấu giá của tôi
- ✅ Sửa/Xóa đấu giá (pending)

### 👤 Profile
- ✅ Xem thông tin cá nhân
- ✅ Cập nhật profile
- ✅ Đổi mật khẩu
- ✅ Hiển thị số dư, số đấu giá

---

## 📄 Pages

### 1. **LoginPage.jsx**
```jsx
// Trang đăng nhập
- Form validation với react-hook-form
- Gọi AuthContext.login()
- Redirect về trang chủ sau login
```

### 2. **RegisterPage.jsx**
```jsx
// Trang đăng ký
- Form validation đầy đủ (username, email, password...)
- Xác nhận mật khẩu
- Gọi AuthContext.register()
```

### 3. **HomePage.jsx**
```jsx
// Trang chủ - Danh sách đấu giá
- Search + Filter (category, status)
- Grid layout với AuctionCard
- Gọi auctionAPI.getAuctions()
```

### 4. **AuctionDetailPage.jsx** ⭐
```jsx
// Trang chi tiết đấu giá - Tính năng chính
- Kết nối Socket.io realtime
- Nhận bid updates realtime
- Form đặt giá với validation
- Quick bid buttons (+increment)
- Đếm số người online
- Lịch sử bid
```

### 5. **CreateAuctionPage.jsx**
```jsx
// Tạo đấu giá mới
- Form với validation
- Hỗ trợ multiple images (URL)
- DateTime picker
- Category select
```

### 6. **MyAuctionsPage.jsx**
```jsx
// Danh sách đấu giá của tôi
- Table view với actions
- Xem/Sửa/Xóa
- Filter theo status
```

### 7. **ProfilePage.jsx**
```jsx
// Trang cá nhân
- Tab: Profile / Đổi mật khẩu
- Hiển thị avatar, balance, stats
- Form update profile
- Form change password
```

---

## 🧩 Components

### **Navbar.jsx**
```jsx
// Navigation bar
- Logo + Menu items
- User info (khi đã login)
- Balance display
- Logout button
```

### **AuctionCard.jsx**
```jsx
// Card hiển thị auction item
- Thumbnail image
- Title, price, status badge
- Time remaining
- Link to detail page
```

### **PrivateRoute.jsx**
```jsx
// Protected route wrapper
- Check authentication
- Redirect to /login nếu chưa login
```

---

## 🌐 Services

### **api.js**
```javascript
// Axios HTTP client với interceptors

// Request interceptor: Attach JWT token
axios.interceptors.request.use((config) => {
  const token = getAccessToken();
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Auto refresh token on 401
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
    }
    return Promise.reject(error);
  }
);

// Exported APIs:
- authAPI.register(data)
- authAPI.login(data)
- authAPI.refreshToken(refreshToken)
- authAPI.getProfile()
- authAPI.updateProfile(data)
- authAPI.changePassword(data)

- auctionAPI.createAuction(data)
- auctionAPI.getAuctions(params)
- auctionAPI.getAuctionById(id)
- auctionAPI.getMyAuctions(params)
- auctionAPI.updateAuction(id, data)
- auctionAPI.deleteAuction(id)

- biddingAPI.placeBid(auctionId, amount)
- biddingAPI.getBiddingHistory(auctionId)
```

### **socket.js**
```javascript
// Socket.io client wrapper

// Connect với token
connectSocket(token)

// Disconnect
disconnectSocket()

// Join auction room
joinAuction(auctionId, callback)

// Leave auction room
leaveAuction(auctionId)

// Place bid (emit event)
placeBid(auctionId, amount) => Promise

// Listen events
onBidUpdate(callback)      // Lắng nghe bid mới
onUserJoined(callback)     // User vào room
onUserLeft(callback)       // User rời room
onAuctionEnded(callback)   // Auction kết thúc

// Remove listeners
removeListeners()
```

---

## 🎭 Context

### **AuthContext.jsx**
```jsx
// Global authentication state

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto load user from localStorage
    loadUserFromStorage();
  }, []);

  const register = async (userData) => {
    // Gọi API register
    // Save token vào localStorage
    // Set user state
  };

  const login = async (credentials) => {
    // Tương tự register
  };

  const logout = () => {
    // Clear localStorage
    // Clear user state
    // Disconnect socket
  };

  const getAccessToken = () => {
    return localStorage.getItem('accessToken');
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      loading,
      register,
      login,
      logout,
      getAccessToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => useContext(AuthContext);
```

---

## 🔌 Realtime Flow (Socket.io)

### **Kết nối Socket**

```javascript
// 1. User login => Lấy access token
const token = getAccessToken();

// 2. Connect socket với token
const socket = connectSocket(token);

// 3. Server xác thực token => emit 'authenticated'
socket.on('authenticated', (data) => {
  console.log('Connected:', data.userId);
});
```

### **Join Auction Room**

```javascript
// User vào trang auction detail
joinAuction(auctionId, (data) => {
  console.log('Joined auction:', data);
  // data = { currentPrice, totalBids, participants }
});
```

### **Place Bid**

```javascript
// User click đặt giá
await placeBid(auctionId, amount);

// Server xử lý => Broadcast to room
socket.on('bid:update', (data) => {
  // data = { auctionId, amount, bidder, timestamp }
  setCurrentPrice(data.amount);
  toast.info(`New bid: ${data.amount}`);
});
```

### **Leave Room**

```javascript
// User rời trang
leaveAuction(auctionId);
disconnectSocket();
```

---

## 🎨 Styling

### Global Styles (index.css)

```css
/* Reset + Base styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
  color: #333;
}

/* Container */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-primary { background: #007bff; color: white; }
.btn-success { background: #28a745; color: white; }
.btn-danger { background: #dc3545; color: white; }
.btn-secondary { background: #6c757d; color: white; }

/* Card */
.card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

/* Form */
.form-group { margin-bottom: 20px; }
.form-label { display: block; margin-bottom: 5px; font-weight: 500; }
.form-input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
.form-error { color: #dc3545; font-size: 14px; margin-top: 5px; }

/* Status badges */
.status-active { background: #d4edda; color: #155724; }
.status-pending { background: #fff3cd; color: #856404; }
.status-ended { background: #f8d7da; color: #721c24; }

/* Spinner */
.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

---

## 🚀 Deployment

### Build cho Production

```bash
npm run build
```

### Preview build

```bash
npm run preview
```

### Deploy lên Vercel/Netlify

1. Connect GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Set environment variables:
   - `VITE_API_URL=https://your-backend-api.com`
   - `VITE_SOCKET_URL=https://your-socket-server.com`

---

## 📝 Ghi Chú

### **Lưu ý quan trọng:**

1. **Token Refresh**: Axios interceptor tự động refresh token khi hết hạn
2. **Socket Cleanup**: Luôn disconnect socket khi unmount component
3. **Form Validation**: Sử dụng react-hook-form cho tất cả forms
4. **Toast Notifications**: Luôn show toast sau mỗi action (success/error)
5. **Date Format**: Sử dụng date-fns với locale `vi` (tiếng Việt)

### **Best Practices:**

- ✅ Sử dụng functional components + hooks
- ✅ Extract reusable logic vào custom hooks
- ✅ Lazy load routes nếu app lớn
- ✅ Optimize re-renders với React.memo
- ✅ Handle loading/error states

---

## 🐛 Troubleshooting

### Lỗi CORS

```javascript
// Backend phải enable CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

### Socket không kết nối

```javascript
// Check token có hợp lệ không
// Check backend socket server đang chạy
// Check VITE_SOCKET_URL đúng chưa
```

### Token expired

```javascript
// Axios interceptor sẽ tự động refresh
// Nếu refresh token cũng hết hạn => redirect /login
```

---

## 📚 Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [React Router v6](https://reactrouter.com/)
- [Socket.io Client](https://socket.io/docs/v4/client-api/)
- [React Hook Form](https://react-hook-form.com/)
- [React Toastify](https://fkhadra.github.io/react-toastify/)

---

**Chúc bạn code vui vẻ! 🎉**
