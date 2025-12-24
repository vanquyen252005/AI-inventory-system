import cv2
import json
import os
import mimetypes
import sys
import time
from collections import Counter, defaultdict
from ultralytics import YOLO

# --- CẤU HÌNH TƯƠNG THÍCH HỆ THỐNG CŨ ---
MODEL_PATH = "run/ban2/best.pt"  
OUTPUT_DIR = "output_results" 
CLASSES_TO_COUNT = None 

# --- THÔNG SỐ LỌC CHAIR & TABLE (Cập nhật từ code mới của bạn) ---
CONF = 0.55
IOU = 0.55
CHAIR_MIN_H = 8
CHAIR_MIN_W = 8
CHAIR_MIN_AREA = 180
FRAME_STRIDE = 1

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def get_media_type(filepath):
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type and mime_type.startswith('image'):
        return 'image'
    elif mime_type and mime_type.startswith('video'):
        return 'video'
    return 'unknown'

def allowed(label: str) -> bool:
    return (CLASSES_TO_COUNT is None) or (label in CLASSES_TO_COUNT)

def _iou_xyxy(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
    inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, inter_x2 - inter_x1), max(0.0, inter_y2 - inter_y1)
    inter = iw * ih
    if inter <= 0: return 0.0
    area_a = (ax2 - ax1) * (ay2 - ay1)
    area_b = (bx2 - bx1) * (by2 - by1)
    return inter / (area_a + area_b - inter + 1e-9)

def _contain_ratio_xyxy(small, big):
    sx1, sy1, sx2, sy2 = small
    bx1, by1, bx2, by2 = big
    inter_x1, inter_y1 = max(sx1, bx1), max(sy1, by1)
    inter_x2, inter_y2 = min(sx2, bx2), min(sy2, by2)
    iw, ih = max(0.0, inter_x2 - inter_x1), max(0.0, inter_y2 - inter_y1)
    area_s = (sx2 - sx1) * (sy2 - sy1) + 1e-9
    return (iw * ih) / area_s

def process_logic_counting(results, names, W, H):
    """Hợp nhất logic lọc table trùng và chair nhỏ"""
    counts = Counter()
    objects = []
    if results.boxes is None or len(results.boxes) == 0:
        return counts, objects

    xyxys = results.boxes.xyxy.cpu().numpy()
    confs = results.boxes.conf.cpu().numpy()
    clss  = results.boxes.cls.cpu().numpy().astype(int)

    by_label = defaultdict(list)
    for xyxy, conf, cid in zip(xyxys, confs, clss):
        label = names.get(int(cid), str(int(cid)))
        if allowed(label):
            by_label[label].append((list(map(float, xyxy)), float(conf), int(cid)))

    # 1. Lọc chair-good quá nhỏ (Bẫy nhận diện nhầm viền ghế)
    if "chair-good" in by_label:
        filtered_chairs = []
        for box, conf, cid in by_label["chair-good"]:
            bw, bh = box[2] - box[0], box[3] - box[1]
            if bh >= CHAIR_MIN_H and bw >= CHAIR_MIN_W and (bw * bh) >= CHAIR_MIN_AREA:
                filtered_chairs.append((box, conf, cid))
        by_label["chair-good"] = filtered_chairs

    # 2. Lọc table-good trùng nhau (NMS nâng cao)
    if "table-good" in by_label:
        cand = sorted(by_label["table-good"], key=lambda x: x[1], reverse=True)
        kept_tables = []
        for box, conf, cid in cand:
            is_dup = False
            for kbox, kconf, kcid in kept_tables:
                iou = _iou_xyxy(box, kbox)
                contain = max(_contain_ratio_xyxy(box, kbox), _contain_ratio_xyxy(kbox, box))
                if iou > 0.25 or contain > 0.85: # Thông số IOU_DUP và CONTAIN_DUP
                    is_dup = True
                    break
            if not is_dup:
                kept_tables.append((box, conf, cid))
        by_label["table-good"] = kept_tables

    # Tổng hợp kết quả
    for label, items in by_label.items():
        for box, conf, cid in items:
            counts[label] += 1
            objects.append({
                "label": label, 
                "confidence": conf, 
                "bbox_xyxy": box,
                "bbox_normalized": [box[0]/W, box[1]/H, box[2]/W, box[3]/H]
            })
            
    return counts, objects

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing input path"}))
        return

    input_path = sys.argv[1]
    media_type = get_media_type(input_path)
    
    model = YOLO(MODEL_PATH)
    names = model.names
    cap = cv2.VideoCapture(input_path)
    
    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    base_name = os.path.splitext(os.path.basename(input_path))[0]
    
    best_frame_bgr = None
    max_objects = -1
    idx = 0

    # Duyệt video tìm best frame
    while cap.isOpened():
        ok, frame = cap.read()
        if not ok: break

        if idx % FRAME_STRIDE == 0:
            results = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
            # Đếm nhanh để chọn frame (có thể áp dụng lọc sơ bộ tại đây)
            current_count = len(results.boxes) if results.boxes is not None else 0
            
            if current_count > max_objects:
                max_objects = current_count
                best_frame_bgr = frame.copy()
        idx += 1

    cap.release()

    if best_frame_bgr is not None:
        # Chạy inference lần cuối trên best frame với đầy đủ logic lọc
        final_results = model.predict(best_frame_bgr, conf=CONF, iou=IOU, verbose=False)[0]
        final_counts, _ = process_logic_counting(final_results, names, W, H)
        
        # Xuất ảnh (Vẽ kết quả lên frame đã lọc)
        img_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.jpg")
        cv2.imwrite(img_out_path, final_results.plot())
        
        # Xuất JSON
        json_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_count.json")
        res_payload = dict(final_counts)
        with open(json_out_path, "w", encoding="utf-8") as f:
            json.dump(res_payload, f, ensure_ascii=False, indent=2)
        
        # Output cho Node.js
        print(json.dumps(res_payload))
    else:
        print(json.dumps({"error": "Processing failed"}))

if __name__ == "__main__":
    main()