# Inventory Service

Backend service cho hệ thống quản lý kho hàng (Inventory Management System) với tích hợp AI scanning.

## Cấu trúc

```
Inventory Service/
├── src/
│   ├── config/
│   │   ├── db.js          # Database configuration
│   │   └── env.js         # Environment variables
│   ├── middleware/
│   │   ├── authGuard.js   # JWT authentication middleware
│   │   └── logger.js      # Request logging
│   ├── repositories/
│   │   ├── assetRepository.js    # Asset data access
│   │   ├── scanRepository.js     # Scan data access
│   │   └── detectionRepository.js # Detection data access
│   ├── routes/
│   │   ├── assetRoutes.js  # Asset endpoints
│   │   ├── scanRoutes.js   # Scan endpoints
│   │   └── reportRoutes.js # Report endpoints
│   ├── services/
│   │   ├── assetService.js  # Asset business logic
│   │   ├── scanService.js   # Scan business logic
│   │   └── reportService.js # Report business logic
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── migrations/
│   └── 001_create_tables.sql  # Database schema
├── package.json
└── README.md
```

## Cài đặt

1. Cài đặt dependencies:
```bash
npm install
```

2. Tạo file `.env`:
```env
PORT=4001
# Sử dụng CÙNG DATABASE_URL với Auth Service (database đã có bảng users, refresh_tokens)
DATABASE_URL=postgresql://user:password@localhost:5432/inventory_db
# Hoặc sử dụng Neon DB (cùng connection string với Auth Service):
# DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require

# QUAN TRỌNG: Phải dùng CÙNG JWT_ACCESS_SECRET với Auth Service
JWT_ACCESS_SECRET=access_secret
UPLOAD_PATH=./uploads
```

> **Lưu ý:** Inventory Service sử dụng **chung database** với Auth Service. Migration chỉ thêm các bảng mới (assets, scans, detections), không ảnh hưởng bảng cũ.

> **⚠️ QUAN TRỌNG:** `JWT_ACCESS_SECRET` phải **GIỐNG HỆT** với Auth Service. Nếu không, token sẽ không verify được!

3. Chạy migrations để thêm các bảng mới vào database:

**Cách 1: Sử dụng script (Khuyến nghị)**
```bash
npm run migrate
```

**Cách 2: Sử dụng psql**
```bash
psql $DATABASE_URL -f migrations/001_create_tables.sql
```

**Cách 3: Sử dụng Neon SQL Editor**
- Copy nội dung file `migrations/001_create_tables.sql`
- Paste vào Neon SQL Editor và chạy

> 📖 Xem chi tiết hướng dẫn setup Neon DB tại [NEON_SETUP.md](./NEON_SETUP.md)

4. Chạy service:
```bash
npm run dev  # Development mode với nodemon
# hoặc
npm start    # Production mode
```

## API Endpoints

### Assets

- `GET /assets` - Lấy danh sách assets (có search, filter, pagination)
- `GET /assets/:id` - Lấy chi tiết asset
- `POST /assets` - Tạo asset mới
- `PUT /assets/:id` - Cập nhật asset
- `DELETE /assets/:id` - Xóa asset

### Scans

- `GET /scans` - Lấy danh sách scans
- `GET /scans/:id` - Lấy chi tiết scan (bao gồm detections)
- `POST /scans` - Upload video và tạo scan mới (multipart/form-data)
- `PUT /scans/:id` - Cập nhật scan (status, accuracy, etc.)
- `DELETE /scans/:id` - Xóa scan
- `POST /scans/:id/detections` - Thêm detections cho scan

### Reports

- `GET /reports/summary` - Lấy thống kê tổng quan
- `GET /reports/trends?startDate=&endDate=` - Lấy dữ liệu xu hướng
- `GET /reports/issues` - Lấy phân bố issues

## Authentication

Tất cả endpoints (trừ health check) yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

Token được lấy từ Auth Service sau khi login.

**⚠️ Lưu ý:** Cả Auth Service và Inventory Service phải dùng **CÙNG** `JWT_ACCESS_SECRET` trong `.env` file!

## Database Schema

### assets
- id (VARCHAR, PK)
- name, category, location
- status (active/maintenance/inactive)
- value, condition (0-100)
- last_scanned, created_by, timestamps

### scans
- id (VARCHAR, PK)
- asset_id (FK)
- file_name, file_path, file_size
- status (processing/completed/failed)
- accuracy, detected_items
- uploaded_by, timestamps

### detections
- id (SERIAL, PK)
- scan_id (FK)
- name, confidence, location
- severity (low/medium/high)
- description

## File Upload

- Hỗ trợ video formats: MP4, MOV, AVI, MKV
- Max file size: 500MB
- Files được lưu trong thư mục `./uploads` (có thể config qua `UPLOAD_PATH`)

## Troubleshooting

### Lỗi "Invalid or expired token"

1. **Kiểm tra JWT_ACCESS_SECRET:**
   - Đảm bảo cả Auth Service và Inventory Service dùng **CÙNG** giá trị `JWT_ACCESS_SECRET`
   - Restart cả 2 services sau khi thay đổi `.env`

2. **Kiểm tra token:**
   - Mở browser console (F12)
   - Kiểm tra xem token có được lưu trong localStorage không: `localStorage.getItem('accessToken')`
   - Token phải bắt đầu với `eyJ` (JWT format)

3. **Kiểm tra request:**
   - Mở Network tab trong browser
   - Xem request có header `Authorization: Bearer <token>` không
   - Kiểm tra response status code

4. **Kiểm tra logs:**
   - Xem logs của Inventory Service để thấy lỗi chi tiết
   - Logs sẽ hiển thị lỗi JWT verification nếu có
