# Quick Fix - Database Connection Error

## Lỗi: `ECONNREFUSED` khi kết nối database

Lỗi này xảy ra khi Inventory Service không thể kết nối đến database.

## Giải pháp

### Bước 1: Kiểm tra DATABASE_URL trong .env

Mở file `Inventory Service/.env` và đảm bảo có `DATABASE_URL`:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

### Bước 2: Sử dụng CÙNG DATABASE_URL với Auth Service

**Nếu dùng Neon DB:**

1. Lấy connection string từ Neon Console
2. Copy vào cả 2 file `.env`:

**Auth Service/.env:**
```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
```

**Inventory Service/.env:**
```env
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require
JWT_ACCESS_SECRET=super_access_secret_change_me
PORT=4001
UPLOAD_PATH=./uploads
```

**Nếu dùng PostgreSQL local:**

1. Đảm bảo PostgreSQL đang chạy
2. Tạo database nếu chưa có:
   ```bash
   createdb inventory_db
   ```
3. Cấu hình trong `.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/inventory_db
   ```

### Bước 3: Chạy Migration

Sau khi cấu hình DATABASE_URL đúng:

```bash
cd "Inventory Service"
npm run migrate
```

### Bước 4: Restart Service

```bash
# Stop service (Ctrl+C)
# Start lại
npm run dev
```

## Kiểm tra nhanh

1. **Kiểm tra DATABASE_URL có được set không:**
   ```bash
   # Trong terminal của Inventory Service
   echo $DATABASE_URL
   # Hoặc xem file .env
   ```

2. **Test kết nối database:**
   ```bash
   # Nếu dùng Neon DB
   psql "your_connection_string" -c "SELECT 1"
   
   # Nếu dùng local PostgreSQL
   psql -U postgres -d inventory_db -c "SELECT 1"
   ```

3. **Kiểm tra logs:**
   - Xem console output của Inventory Service
   - Sẽ thấy lỗi chi tiết nếu có

## Ví dụ .env file hoàn chỉnh

**Inventory Service/.env:**
```env
PORT=4001
DATABASE_URL=postgresql://neondb_owner:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
JWT_ACCESS_SECRET=super_access_secret_change_me
UPLOAD_PATH=./uploads
```

**Lưu ý:**
- Thay `password` bằng password thật từ Neon
- Thay `ep-xxx...` bằng connection string từ Neon Console
- `JWT_ACCESS_SECRET` phải GIỐNG với Auth Service

## Nếu vẫn lỗi

1. Kiểm tra connection string có đúng format không
2. Kiểm tra database có tồn tại không
3. Kiểm tra network/firewall có block không
4. Xem logs chi tiết trong console

