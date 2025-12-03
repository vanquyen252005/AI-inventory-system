import cv2
import json
import os
import time
import requests
import numpy as np
from ultralytics import solutions

# --- CẤU HÌNH KẾT NỐI SERVER ---
AUTH_SERVICE_URL = "http://localhost:4000"
INVENTORY_SERVICE_URL = "http://localhost:4001"

AUTH_EMAIL = "hung@123"          
AUTH_PASSWORD = "12345678"                   
DOWNLOAD_DIR = "temp_downloads"         

# Đường dẫn model (SỬA LẠI DÙNG DẤU /)
MODEL_PATH = "runs/detect/train2/weights/best.pt" 
# Hoặc nếu file chưa tồn tại thì dùng tạm: MODEL_PATH = "yolov8n.pt"

if not os.path.exists(DOWNLOAD_DIR):
    os.makedirs(DOWNLOAD_DIR)

current_token = None

def login():
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
            if login(): return get_pending_scans()
            return []
        if response.status_code == 200:
            scans = response.json()
            if isinstance(scans, dict) and "scans" in scans: scans = scans["scans"]
            return [s for s in scans if s.get("status") == "processing"]
        return []
    except:
        return []

def process_scan(scan):
    scan_id = scan["id"]
    file_url = scan.get("image_url") or scan.get("imageUrl")
    
    print(f"⬇️ Đang tải file cho Scan ID: {scan_id}...")
    local_video_path = os.path.join(DOWNLOAD_DIR, f"{scan_id}.mp4")
    full_url = f"{INVENTORY_SERVICE_URL}/{file_url}".replace("\\", "/")
    
    cap = None # Khai báo biến cap ở ngoài để finally có thể gọi

    try:
        # 1. Tải file
        with requests.get(full_url, stream=True) as r:
            r.raise_for_status()
            with open(local_video_path, 'wb') as f:
                for chunk in r.iter_content(chunk_size=8192):
                    f.write(chunk)
        
        if os.path.getsize(local_video_path) == 0:
            raise Exception("File tải về bị rỗng")

        # 2. Xử lý AI
        print(f"🧠 Đang chạy AI phân tích với model: {MODEL_PATH}...")
        
        cap = cv2.VideoCapture(local_video_path)
        if not cap.isOpened():
            raise Exception("Không mở được file video")

        w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        if w == 0 or h == 0: w, h = 640, 480

        # Cấu hình vùng đếm (Nửa dưới màn hình)
        region_points = [(0, h//2), (w, h//2), (w, h), (0, h)]

        counter = solutions.ObjectCounter(
            show=False, 
            region=region_points,
            model=MODEL_PATH, # Sử dụng đường dẫn đã sửa
        )

        unique_objects = {} 

        while cap.isOpened():
            ok, im0 = cap.read()
            if not ok: break
            
            # Fix lỗi ảnh 4 kênh (PNG)
            if im0.shape[2] == 4:
                im0 = cv2.cvtColor(im0, cv2.COLOR_BGRA2BGR)
            
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

        # 3. Gửi kết quả
        final_results = list(unique_objects.values())
        print(f"⬆️ Đang gửi {len(final_results)} vật thể về Server...")
        
        requests.put(
            f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", 
            json={"status": "completed", "result_data": final_results}, 
            headers=get_headers()
        )
        print(f"✅ Hoàn tất Scan ID: {scan_id}")

    except Exception as e:
        print(f"❌ Lỗi xử lý: {e}")
        # Báo lỗi lên server
        try:
            requests.put(f"{INVENTORY_SERVICE_URL}/scans/{scan_id}", json={"status": "failed"}, headers=get_headers())
        except: pass
    finally:
        # QUAN TRỌNG: Giải phóng file trước khi xóa
        if cap is not None:
            cap.release()
        
        # Đợi một chút cho hệ điều hành nhả file
        time.sleep(0.5)
        
        if os.path.exists(local_video_path):
            try:
                os.remove(local_video_path)
            except Exception as e:
                print(f"⚠️ Không thể xóa file tạm (không ảnh hưởng): {e}")

if __name__ == "__main__":
    print("🚀 AI Scan Service đang chạy...")
    if not login():
        print("Vui lòng kiểm tra Auth Service (Port 4000).")
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