import cv2
import json
import os
import mimetypes
import sys
from ultralytics import solutions

# --- CẤU HÌNH ---
MODEL_PATH = "best.pt"  
OUTPUT_DIR = "output_results" 
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
    # 1. Nhận đường dẫn file từ Node.js (command line args)
    if len(sys.argv) < 2:
        # In JSON lỗi để Node.js đọc được
        print(json.dumps({"error": "Missing input path"}))
        return

    input_path = sys.argv[1]

    # 2. Kiểm tra loại file
    media_type = get_media_type(input_path)
    if media_type == 'unknown':
        print(json.dumps({"error": f"Unknown file type: {input_path}"}))
        return

    # 3. Tạo đường dẫn output (SỬA LỖI NameError TẠI ĐÂY)
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    json_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_count.json")
    
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        print(json.dumps({"error": f"Cannot open file: {input_path}"}))
        return
    
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    
    margin = 20
    region_points = [(margin, margin), (w-margin, margin), (w-margin, h-margin), (margin, h-margin)]

    video_writer = None
    # Nếu cần lưu video output thì bỏ comment dòng dưới, nhưng cẩn thận nặng server
    # if media_type == 'video':
    #     video_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.mp4")
    #     video_writer = cv2.VideoWriter(video_out_path, cv2.VideoWriter_fourcc(*"mp4v"), fps, (w, h))

    img_out_path = None
    if media_type == 'image':
        img_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.jpg")

    # Tắt cửa sổ popup (show=False)
    counter = solutions.ObjectCounter(
        show=False, 
        region=region_points,
        model=MODEL_PATH,
        classes=CLASSES_TO_COUNT
    )

    current_frame_objects_labels = []
    final_image = None

    while cap.isOpened():
        ok, im0 = cap.read()
        if not ok: break

        results = counter(im0)
        
        # Logic lấy label cho ảnh
        if media_type == 'image':
            names = counter.names if hasattr(counter, 'names') else {}
            current_frame_objects_labels = []
            if hasattr(counter, 'boxes') and getattr(counter, 'boxes') is not None:
                # Lưu ý: ultralytics trả về boxes.cls là tensor
                for cls in results.boxes.cls:
                    label = names.get(int(cls), str(int(cls)))
                    current_frame_objects_labels.append(label)

        if video_writer: 
            video_writer.write(results.plot_im)
        else:
            final_image = results.plot_im # Lưu frame cuối để lưu ảnh

    # --- TÍNH TỔNG KẾT QUẢ ---
    final_summary = {}

    if media_type == 'image':
        for lbl in current_frame_objects_labels:
            final_summary[lbl] = final_summary.get(lbl, 0) + 1
    else:
        # Với Video, lấy tổng IN + OUT
        for label, counts in counter.classwise_count.items():
            total = counts.get("IN", 0) + counts.get("OUT", 0)
            final_summary[label] = final_summary.get(label, 0) + total

    # --- LƯU FILE JSON ---
    with open(json_out_path, "w", encoding="utf-8") as f:
        json.dump(final_summary, f, ensure_ascii=False, indent=2)

    # Lưu ảnh nếu là image
    if media_type == 'image' and final_image is not None and img_out_path:
        cv2.imwrite(img_out_path, final_image)

    cap.release()
    if video_writer: video_writer.release()
    cv2.destroyAllWindows()
    
    # [QUAN TRỌNG] In JSON ra stdout để Node.js đọc
    print(json.dumps(final_summary))

if __name__ == "__main__":
    process_media()