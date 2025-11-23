# Hướng dẫn Setup Database trên Neon DB

> **Lưu ý:** Inventory Service sử dụng **chung database** với Auth Service. Migration này chỉ **thêm các bảng mới** (assets, scans, detections) vào database hiện có, không ảnh hưởng đến các bảng của Auth Service.

## Bước 1: Tạo Neon Database (nếu chưa có)

1. Truy cập [Neon Console](https://console.neon.tech/)
2. Đăng nhập hoặc tạo tài khoản
3. Tạo project mới:
   - Click "Create Project"
   - Đặt tên project (ví dụ: `ai-inventory-system`)
   - Chọn region gần nhất
   - Click "Create Project"

4. Lấy Connection String:
   - Vào project vừa tạo
   - Vào tab "Connection Details"
   - Copy **Connection string** (có dạng: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`)

## Bước 2: Cấu hình Environment Variables

Tạo file `.env` trong thư mục `Inventory Service`:

```env
PORT=4001
# Sử dụng CÙNG DATABASE_URL với Auth Service
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
JWT_ACCESS_SECRET=access_secret
UPLOAD_PATH=./uploads
```

**Lưu ý:** 
- Sử dụng **cùng `DATABASE_URL`** với Auth Service (database đã có bảng `users` và `refresh_tokens`)
- Migration sẽ chỉ thêm các bảng mới: `assets`, `scans`, `detections`

## Bước 3: Chạy Migration

Migration sẽ thêm các bảng mới vào database hiện có (an toàn, không ảnh hưởng bảng cũ).

### Cách 1: Sử dụng script (Khuyến nghị)

```bash
cd "Inventory Service"
npm install
npm run migrate
# hoặc
node scripts/migrate.js
```

### Cách 2: Sử dụng Neon SQL Editor

1. Vào Neon Console → Project của bạn
2. Click vào "SQL Editor"
3. Copy toàn bộ nội dung file `migrations/001_create_tables.sql`
4. Paste vào SQL Editor
5. Click "Run" để execute

### Cách 3: Sử dụng psql command line

```bash
# Cài đặt psql nếu chưa có
# Windows: Download từ https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql-client

psql "postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require" -f migrations/001_create_tables.sql
```

## Bước 4: Verify Database

Sau khi chạy migration, kiểm tra xem tables đã được tạo chưa:

```sql
-- Kiểm tra tất cả tables trong database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Bạn sẽ thấy:
- **Auth Service tables:** `users`, `refresh_tokens`
- **Inventory Service tables:** `assets`, `scans`, `detections`

## Bước 5: Chạy Service

```bash
npm run dev
```

Service sẽ kết nối với Neon DB và sẵn sàng nhận requests.

## Troubleshooting

### Lỗi SSL Connection

Nếu gặp lỗi SSL, đảm bảo connection string có `?sslmode=require` hoặc cấu hình SSL trong `db.js`:

```javascript
ssl: {
  rejectUnauthorized: false
}
```

### Lỗi Authentication

- Kiểm tra lại username và password trong connection string
- Đảm bảo IP của bạn không bị block (Neon cho phép tất cả IPs mặc định)

### Lỗi Migration

- Kiểm tra xem tables đã tồn tại chưa (migration dùng `IF NOT EXISTS` nên an toàn)
- Xem logs trong Neon Console để biết lỗi chi tiết

## Neon DB Features hữu ích

1. **Branching**: Tạo database branches để test
2. **Time Travel**: Restore database về thời điểm trước đó
3. **Connection Pooling**: Neon tự động quản lý connection pooling
4. **Monitoring**: Xem metrics và logs trong dashboard

## Connection String Format

Neon connection string có format:
```
postgresql://[user]:[password]@[hostname]/[dbname]?sslmode=require
```

Ví dụ:
```
postgresql://neondb_owner:npg_xxx@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## Lưu ý bảo mật

- **KHÔNG** commit file `.env` lên Git
- Sử dụng environment variables trên production
- Rotate password định kỳ
- Sử dụng connection pooling để tối ưu performance

