# API Gateway

API Gateway cho hệ thống AI Inventory System. Gateway này đóng vai trò là điểm vào duy nhất cho tất cả các microservices.

## Tính năng

- ✅ **Routing**: Định tuyến requests đến các services phù hợp
- ✅ **Authentication**: Validate JWT tokens trước khi forward requests
- ✅ **CORS**: Hỗ trợ Cross-Origin Resource Sharing
- ✅ **Security**: Sử dụng Helmet để bảo mật headers
- ✅ **Logging**: Ghi log tất cả requests
- ✅ **Error Handling**: Xử lý lỗi tập trung
- ✅ **File Upload**: Hỗ trợ upload files (cho scan service)

## Cấu trúc

```
API Gateway/
├── src/
│   ├── config/
│   │   └── env.js          # Cấu hình môi trường
│   ├── middleware/
│   │   ├── authGuard.js    # JWT validation middleware
│   │   ├── logger.js       # Request logging
│   │   └── proxy.js        # HTTP proxy middleware
│   ├── routes/
│   │   └── index.js        # Route definitions
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── .env.example            # Example environment variables
├── package.json
└── README.md
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env` từ `.env.example`:
```bash
cp .env.example .env
```

3. Cấu hình các biến môi trường trong `.env`:
```env
PORT=3000
JWT_ACCESS_SECRET=access_secret
AUTH_SERVICE_URL=http://localhost:4000
INVENTORY_SERVICE_URL=http://localhost:4001
AI_SCAN_SERVICE_URL=http://localhost:5000
```

## Chạy

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

## API Endpoints

### Health Check
```
GET /health
```

### Auth Service
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET  /api/auth/me
```

### Inventory Service
```
GET    /api/inventory/assets
GET    /api/inventory/assets/:id
POST   /api/inventory/assets
PUT    /api/inventory/assets/:id
DELETE /api/inventory/assets/:id

GET    /api/inventory/scans
GET    /api/inventory/scans/:id
POST   /api/inventory/scans
PUT    /api/inventory/scans/:id
DELETE /api/inventory/scans/:id

GET    /api/inventory/reports/summary
GET    /api/inventory/reports/trends
GET    /api/inventory/reports/issues
```

### Backward Compatibility Routes
Gateway cũng hỗ trợ các routes cũ để tương thích ngược:
```
/api/v1/*
/api/v2/*
/assets/*
/scans/*
/reports/*
```

## Authentication

Hầu hết các endpoints (trừ auth endpoints) yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

Token được validate bởi API Gateway trước khi forward request đến backend service.

## Service URLs

Gateway forward requests đến các services sau:

- **Auth Service**: `http://localhost:4000`
- **Inventory Service**: `http://localhost:4001`
- **AI Scan Service**: `http://localhost:5000`

Các URLs này có thể được cấu hình trong file `.env`.

## Lưu ý

1. **JWT Secret**: Phải khớp với JWT secret được sử dụng bởi Auth Service và Inventory Service
2. **Service URLs**: Đảm bảo các services đang chạy trước khi start gateway
3. **CORS**: Cấu hình CORS_ORIGIN phù hợp với frontend URL trong production

## Troubleshooting

### Service unavailable (502)
- Kiểm tra xem backend service có đang chạy không
- Kiểm tra service URL trong `.env`

### Invalid token (401)
- Kiểm tra JWT_ACCESS_SECRET có khớp với các services không
- Đảm bảo token chưa hết hạn

### CORS errors
- Cấu hình CORS_ORIGIN trong `.env`
- Kiểm tra frontend URL

