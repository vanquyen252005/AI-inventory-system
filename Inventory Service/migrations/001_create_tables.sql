-- 1. Xóa bảng theo thứ tự (Xóa thằng phụ thuộc trước)
DROP TABLE IF EXISTS detections; -- Xóa bảng gây lỗi 2BP01
DROP TABLE IF EXISTS scans;
DROP TABLE IF EXISTS assets;

-- 2. Tạo bảng Assets (Tài sản)
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    location VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
    value DECIMAL(12, 2) DEFAULT 0,
    condition INTEGER DEFAULT 100 CHECK (condition >= 0 AND condition <= 100),
    description TEXT,
    last_scanned TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo bảng Scans (Lưu cả kết quả AI vào đây luôn cho gọn)
CREATE TABLE scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_code VARCHAR(100), -- Tên file ảnh/video
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    image_url TEXT,         -- Đường dẫn file upload
    status VARCHAR(50) DEFAULT 'processing', -- processing, completed, failed
    result_data JSONB,      -- QUAN TRỌNG: Lưu danh sách thiết bị AI tìm thấy vào đây
    device_cnt INTEGER DEFAULT 0 -- Tổng số thiết bị tìm thấy
);

-- 4. DỮ LIỆU MẪU (SEED DATA) CHO UET
-- Giảng đường GD2
INSERT INTO assets (name, category, location, status, value, condition, description) VALUES 
('Máy chiếu Sony VPL-DX221', 'Thiết bị giảng dạy', 'GD2 - 201', 'active', 12000000, 95, 'Máy chiếu chính, hoạt động tốt'),
('Micro không dây Shure', 'Âm thanh', 'GD2 - 201', 'active', 2500000, 80, 'Pin hơi chai, cần thay pin thường xuyên'),
('Điều hòa Daikin Inverter', 'Điện lạnh', 'GD2 - 201', 'active', 15000000, 90, 'Vừa bảo dưỡng tháng trước'),
('Máy chiếu Panasonic PT-LB385', 'Thiết bị giảng dạy', 'GD2 - 302', 'maintenance', 11500000, 40, 'Bóng hình mờ, đang chờ thay thế');

-- Giảng đường GD3
INSERT INTO assets (name, category, location, status, value, condition, description) VALUES 
('Hệ thống Loa JBL Control', 'Âm thanh', 'GD3 - 105', 'active', 8000000, 85, 'Âm thanh hội trường'),
('Màn chiếu điện Dalite 150 inch', 'Thiết bị giảng dạy', 'GD3 - 105', 'active', 3500000, 92, 'Điều khiển tốt');

-- Giảng đường G2
INSERT INTO assets (name, category, location, status, value, condition, description) VALUES 
('PC Giáo viên Dell Optiplex', 'Máy tính', 'G2 - 205', 'active', 9500000, 88, 'Cấu hình i5, RAM 8GB'),
('Bàn ghế giáo viên Hòa Phát', 'Nội thất', 'G2 - 205', 'active', 1200000, 70, 'Gỗ công nghiệp, hơi xước mặt bàn');

-- Giảng đường GD4 (Tòa E)
INSERT INTO assets (name, category, location, status, value, condition, description) VALUES 
('Server Dell PowerEdge (Lab)', 'Thiết bị PTN', 'GD4 - 401', 'active', 45000000, 98, 'Dùng cho môn Mạng máy tính'),
('Switch Cisco Catalyst 2960', 'Mạng', 'GD4 - 401', 'active', 5500000, 95, 'Switch chia mạng phòng máy');