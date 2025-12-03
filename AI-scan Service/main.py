import cv2
import json
import os
import mimetypes
from ultralytics import solutions

# --- CẤU HÌNH ---
INPUT_PATH = "ul10.mp4"  
MODEL_PATH = "best.pt"  
OUTPUT_DIR = "output_results" 

# Chọn class muốn đếm.
# Để None nghĩa là đếm TẤT CẢ các class mà model nhận diện được.
CLASSES_TO_COUNT = None 

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_media_type(filepath):
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type and mime_type.startswith('image'):
        return 'image'
    elif mime_type and mime_type.startswith('video'):
        return 'video'
    return 'unknown'

def process_media():
    media_type = get_media_type(INPUT_PATH)
    if media_type == 'unknown':
        print(f"❌ Không xác định được loại file: {INPUT_PATH}")
        return

    base_name = os.path.splitext(os.path.basename(INPUT_PATH))[0]
    json_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_count.json")
    
    cap = cv2.VideoCapture(INPUT_PATH)
    assert cap.isOpened(), f"Error reading file: {INPUT_PATH}"
    
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    # Tạo vùng đếm dynamic (cách lề 20px)
    margin = 20
    region_points = [(margin, margin), (w-margin, margin), (w-margin, h-margin), (margin, h-margin)]

    video_writer = None
    if media_type == 'video':
        video_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.mp4")
        video_writer = cv2.VideoWriter(video_out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))
        print(f"🎬 Đang xử lý Video...")
    else:
        print(f"📸 Đang xử lý Ảnh...")
        img_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.jpg")

    # Khởi tạo bộ đếm
    counter = solutions.ObjectCounter(
        show=True,
        region=region_points,
        model=MODEL_PATH,
        classes=CLASSES_TO_COUNT # Khi để None, nó sẽ đếm tất cả
    )

    frame_idx = 0
    final_image = None
    
    # Biến lưu danh sách vật thể hiện tại (chỉ dùng cho ảnh tĩnh)
    current_frame_objects_labels = [] 

    while cap.isOpened():
        ok, im0 = cap.read()
        if not ok: break

        # Xử lý frame
        results = counter(im0)
        
        # Nếu là ảnh, ta cần lấy danh sách label ngay tại frame này
        if media_type == 'image':
            names = counter.names if hasattr(counter, 'names') else {}
            current_frame_objects_labels = [] # Reset
            if hasattr(counter, 'boxes') and counter.boxes is not None:
                for cls in counter.clss:
                    label = names.get(int(cls), str(int(cls)))
                    current_frame_objects_labels.append(label)

        if media_type == 'video':
            video_writer.write(results.plot_im)
            cv2.imshow("YOLOv11 Counter", results.plot_im)
            if cv2.waitKey(1) & 0xFF == ord('q'): break
        else:
            final_image = results.plot_im

        frame_idx += 1

    # --- TÍNH TỔNG KẾT QUẢ ---
    final_summary = {}

    if media_type == 'image':
        # Với ẢNH: Đếm trực tiếp số lượng label xuất hiện
        for lbl in current_frame_objects_labels:
            final_summary[lbl] = final_summary.get(lbl, 0) + 1
    else:
        # Với VIDEO: Đếm tổng IN + OUT
        for label, counts in counter.classwise_count.items():
            total = counts.get("IN", 0) + counts.get("OUT", 0)
            final_summary[label] = final_summary.get(label, 0) + total

    # --- LƯU FILE JSON (CHỈ LƯU SỐ LƯỢNG) ---
    # Kết quả sẽ dạng: {"chair": 10, "table": 5, "fan": 2...}
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(final_summary, f, ensure_ascii=False, indent=2)

    cap.release()
    if video_writer: video_writer.release()
    if media_type == 'image' and final_image is not None:
        cv2.imwrite(img_out_path, final_image)
        cv2.imshow("Ket qua Anh", final_image)
        cv2.waitKey(0)
    
    cv2.destroyAllWindows()
    
    print("\n" + "="*30)
    print(f"✅ Đã lưu file đếm tại: {json_out_path}")
    print("Nội dung file JSON:")
    print(json.dumps(final_summary, ensure_ascii=False, indent=2))
    print("="*30)

if __name__ == "__main__":
    process_media()