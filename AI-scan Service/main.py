import cv2
import json
import os
import time
import requests
import numpy as np # Thêm thư viện này
from ultralytics import solutions

# --- CẤU HÌNH KẾT NỐI SERVER ---
AUTH_SERVICE_URL = "http://localhost:4000"
INVENTORY_SERVICE_URL = "http://localhost:4001"

AUTH_EMAIL = "hung@123"          
AUTH_PASSWORD = "12345678"                   
DOWNLOAD_DIR = "temp_downloads"         

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

# --- BIẾN TOÀN CỤC CHO TOKEN ---
current_token = None

def login():
    """Đăng nhập để lấy Token"""
    global current_token
    try:
        print(f"🔐 Đang đăng nhập vào {AUTH_SERVICE_URL}...")
        response = requests.post(f"{AUTH_SERVICE_URL}/auth/login", json={
            "email": AUTH_EMAIL,
            "password": AUTH_PASSWORD
        })
        
        if response.status_code == 200:
            data = response.json()
            if "accessToken" in data:
                current_token = data["accessToken"]
            elif "tokens" in data and "access" in data["tokens"]:
                current_token = data["tokens"]["access"]["token"]
            
            print("✅ Đăng nhập thành công!")
            return True
        else:
            print(f"❌ Đăng nhập thất bại: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Lỗi kết nối Login: {e}")
        return False

def get_headers():
    if not current_token:
        login()
    return {"Authorization": f"Bearer {current_token}"}

def get_pending_scans():
    try:
        response = requests.get(f"{INVENTORY_SERVICE_URL}/scans", headers=get_headers())
        
        if response.status_code == 401:
            print("🔄 Token hết hạn, đăng nhập lại...")
            if login():
                return get_pending_scans()
            return []
            
        if response.status_code == 200:
            scans = response.json()
            if isinstance(scans, dict) and "scans" in scans: 
                scans = scans["scans"]
            return [s for s in scans if s.get("status") == "processing"]
        return []
    except Exception as e:
        print(f"⚠️ Lỗi lấy danh sách scan: {e}")
        return []

def process_scan(scan):
    scan_id = scan["id"]
    file_url = scan.get("image_url") or scan.get("imageUrl")
    
    print(f"⬇️ Đang tải file cho Scan ID: {scan_id}...")
    local_video_path = os.path.join(DOWNLOAD_DIR, f"{scan_id}.mp4")
    
    # URL tải file từ Inventory Service
    full_url = f"{INVENTORY_SERVICE_URL}/{file_url}".replace("\\", "/")
    
    try:
        with requests.get(full_url, stream=True) as r:
            r.raise_for_status()
            with open(local_video_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        if os.path.getsize(local_video_path) == 0:
            raise Exception("File tải về bị rỗng (0 bytes)")
            
    except Exception as e:
        print(f"❌ Không thể tải file: {e}")
        requests.put(f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", json={"status": "failed"}, headers=get_headers())
        return

    # --- CHẠY AI ---
    print(f"🧠 Đang chạy AI phân tích...")
    
    cap = cv2.VideoCapture(local_video_path)
    if not cap.isOpened():
        print("❌ Không mở được file (Lỗi Codec hoặc File hỏng).")
        requests.put(f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", json={"status": "failed"}, headers=get_headers())
        return

    # Lấy kích thước frame
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Nếu không lấy được kích thước (do file lỗi), gán mặc định để tránh crash
    if w == 0 or h == 0: 
        w, h = 640, 480

    region_points = [(0, h//2), (w, h//2), (w, h), (0, h)]

    try:
        # Khởi tạo bộ đếm
        counter = solutions.ObjectCounter(
            show=False, 
            region=region_points,
            model="runs\detect\train2\weights\best.pt",
        )

        unique_objects = {} 

        while cap.isOpened():
            ok, im0 = cap.read()
            if not ok:
                break
            
            # --- SỬA LỖI 4 KÊNH MÀU (RGBA) ---
            # Nếu ảnh có 4 kênh (PNG trong suốt), chuyển về 3 kênh (BGR)
            if im0.shape[2] == 4:
                im0 = cv2.cvtColor(im0, cv2.COLOR_BGRA2BGR)
            
            # Gọi trực tiếp object
            results = counter(im0) 
            
            if counter.boxes is not None:
                for box, tid, cls, conf in zip(counter.boxes, counter.track_ids, counter.clss, counter.confs):
                    if tid is None: continue 
                    tid = int(tid)
                    if tid not in unique_objects:
                        x1, y1, x2, y2 = map(float, box)
                        label = counter.names[int(cls)]
                        unique_objects[tid] = {
                            "class": label, 
                            "confidence": float(conf),
                            "box": [x1, y1, x2, y2],
                            "id": str(tid)
                        }

        cap.release()

        # Gửi kết quả
        final_results = list(unique_objects.values())
        print(f"⬆️ Đang gửi {len(final_results)} vật thể về Server...")
        
        res = requests.put(
            f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", 
            json={
                "status": "completed",
                "result_data": final_results 
            }, 
            headers=get_headers()
        )
        
        if res.status_code == 200:
            print(f"✅ Hoàn tất Scan ID: {scan_id}")
        else:
            print(f"⚠️ Lỗi cập nhật Server: {res.text}")

    except Exception as e:
        print(f"⚠️ Lỗi trong quá trình AI: {e}")
        requests.put(f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", json={"status": "failed"}, headers=get_headers())
    finally:
        # Dọn dẹp
        if os.path.exists(local_video_path):
            os.remove(local_video_path)

if __name__ == "__main__":
    print("🚀 AI Scan Service đang chạy...")
    if not login():
        print("Vui lòng kiểm tra Auth Service (Port 4000) đang chạy chưa.")
        exit(1)

    while True:
        try:
            pending = get_pending_scans()
            if pending:
                print(f"🔍 Tìm thấy {len(pending)} yêu cầu mới.")
                for scan in pending:
                    process_scan(scan)
            else:
                print(".", end="", flush=True)
            time.sleep(5)
        except KeyboardInterrupt:
            break
        except Exception as e:
            print(f"\n⚠️ Lỗi vòng lặp: {e}")
            time.sleep(5)