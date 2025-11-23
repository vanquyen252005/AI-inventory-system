# Troubleshooting - Invalid or Expired Token

## Nguyên nhân phổ biến

### 1. JWT_ACCESS_SECRET không khớp

**Vấn đề:** Auth Service và Inventory Service dùng khác secret để sign/verify token.

**Giải pháp:**
1. Kiểm tra file `.env` của cả 2 services:
   ```env
   # Auth Service/.env
   JWT_ACCESS_SECRET=access_secret
   
   # Inventory Service/.env  
   JWT_ACCESS_SECRET=access_secret  # Phải GIỐNG HỆT
   ```

2. Restart cả 2 services sau khi sửa `.env`

3. Đăng nhập lại để lấy token mới

### 2. Token không được gửi

**Kiểm tra:**
1. Mở browser console (F12)
2. Chạy: `localStorage.getItem('accessToken')`
3. Nếu `null` → Cần đăng nhập lại

### 3. Token đã hết hạn

**Kiểm tra:**
- Access token mặc định hết hạn sau 15 phút
- Đăng nhập lại để lấy token mới

### 4. Token format không đúng

**Kiểm tra:**
- Token phải bắt đầu với `eyJ` (JWT format)
- Token phải có header `Authorization: Bearer <token>`

## Cách debug

### Bước 1: Kiểm tra token trong browser

```javascript
// Mở browser console (F12)
const token = localStorage.getItem('accessToken')
console.log('Token:', token ? token.substring(0, 20) + '...' : 'NOT FOUND')
```

### Bước 2: Kiểm tra request trong Network tab

1. Mở Network tab (F12)
2. Tìm request đến `/assets`
3. Xem Headers → Request Headers
4. Kiểm tra có `Authorization: Bearer ...` không

### Bước 3: Kiểm tra logs của Inventory Service

Xem console output của Inventory Service, sẽ thấy:
```
JWT verification error: <error message>
Token (first 20 chars): <token preview>
Using secret: ***<last 4 chars>
```

### Bước 4: Test token với Auth Service

```bash
# Test token với Auth Service (nếu có endpoint /auth/me)
curl -H "Authorization: Bearer <your-token>" http://localhost:4000/auth/me
```

## Quick Fix

1. **Đảm bảo cùng JWT_ACCESS_SECRET:**
   ```bash
   # Auth Service/.env
   JWT_ACCESS_SECRET=your_secret_here
   
   # Inventory Service/.env
   JWT_ACCESS_SECRET=your_secret_here  # CÙNG giá trị
   ```

2. **Restart services:**
   ```bash
   # Stop cả 2 services
   # Start lại
   cd "Auth Service" && npm run dev
   cd "Inventory Service" && npm run dev
   ```

3. **Đăng nhập lại:**
   - Logout
   - Login lại để lấy token mới

4. **Clear browser cache:**
   - Clear localStorage
   - Hoặc dùng Incognito mode

## Kiểm tra nhanh

Chạy script này trong browser console sau khi login:

```javascript
// Check token
const token = localStorage.getItem('accessToken')
if (!token) {
  console.error('❌ No token found! Please login.')
} else {
  console.log('✅ Token found:', token.substring(0, 20) + '...')
  
  // Test API call
  fetch('http://localhost:4001/assets', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(r => r.json())
  .then(data => {
    if (data.message && data.message.includes('token')) {
      console.error('❌ Token invalid:', data.message)
    } else {
      console.log('✅ API call successful!', data)
    }
  })
  .catch(err => console.error('❌ Error:', err))
}
```

