import cv2
import json
import os
import mimetypes
import sys
from collections import Counter, defaultdict
import torch
from ultralytics import YOLO

# ======================
# CẤU HÌNH & THAM SỐ
# ======================
INPUT_PATH = "uet24.12.mp4"       
MODEL_PATH = "run/ban5/best.pt"   
OUTPUT_DIR = "output_results"

# Các tham số lọc nhiễu
CLASSES_TO_COUNT = None
CONF = 0.6
IOU = 0.55
FRAME_STRIDE = 2 

# Kích thước tối thiểu để tính là ghế
CHAIR_MIN_H = 9
CHAIR_MIN_W = 8
CHAIR_MIN_AREA = 180

os.makedirs(OUTPUT_DIR, exist_ok=True)

def get_media_type(filepath: str) -> str:
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type and mime_type.startswith("image"): return "image"
    if mime_type and mime_type.startswith("video"): return "video"
    return "unknown"

def allowed(label: str) -> bool:
    return (CLASSES_TO_COUNT is None) or (label in CLASSES_TO_COUNT)

def _iou_xyxy(a, b) -> float:
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1, inter_y1 = max(ax1, bx1), max(ay1, by1)
    inter_x2, inter_y2 = min(ax2, bx2), min(ay2, by2)
    iw, ih = max(0.0, inter_x2 - inter_x1), max(0.0, inter_y2 - inter_y1)
    inter = iw * ih
    if inter <= 0: return 0.0
    area_a = max(0.0, ax2 - ax1) * max(0.0, ay2 - ay1)
    area_b = max(0.0, bx2 - bx1) * max(0.0, by2 - by1)
    return inter / (area_a + area_b - inter + 1e-9)

def _contain_ratio_xyxy(small, big) -> float:
    sx1, sy1, sx2, sy2 = small
    bx1, by1, bx2, by2 = big
    inter_x1, inter_y1 = max(sx1, bx1), max(sy1, by1)
    inter_x2, inter_y2 = min(sx2, bx2), min(sy2, by2)
    iw, ih = max(0.0, inter_x2 - inter_x1), max(0.0, inter_y2 - inter_y1)
    area_s = max(0.0, sx2 - sx1) * max(0.0, sy2 - sy1) + 1e-9
    return (iw * ih) / area_s

def process_logic_counting(results, names):
    counts = Counter()
    if results.boxes is None or len(results.boxes) == 0:
        return counts, []

    xyxys = results.boxes.xyxy.cpu().numpy()
    confs = results.boxes.conf.cpu().numpy()
    clss = results.boxes.cls.cpu().numpy().astype(int)

    by_label = defaultdict(list)
    for i, (xyxy, conf, cid) in enumerate(zip(xyxys, confs, clss)):
        label = names.get(int(cid), str(int(cid)))
        if allowed(label):
            by_label[label].append({
                "box": list(map(float, xyxy)),
                "conf": float(conf),
                "cid": int(cid),
                "original_index": i
            })

    final_kept_indices = []

    # 1. Lọc chair-good
    if "chair-good" in by_label:
        for item in by_label["chair-good"]:
            box = item["box"]
            bw, bh = box[2] - box[0], box[3] - box[1]
            if bh >= CHAIR_MIN_H and bw >= CHAIR_MIN_W and (bw * bh) >= CHAIR_MIN_AREA:
                final_kept_indices.append(item["original_index"])
                counts["chair-good"] += 1

    # 2. Lọc table-good
    if "table-good" in by_label:
        candidates = sorted(by_label["table-good"], key=lambda x: x["conf"], reverse=True)
        kept_tables = []
        for item in candidates:
            box = item["box"]
            is_dup = False
            for k_item in kept_tables:
                kbox = k_item["box"]
                iou = _iou_xyxy(box, kbox)
                contain = max(_contain_ratio_xyxy(box, kbox), _contain_ratio_xyxy(kbox, box))
                if iou > 0.25 or contain > 0.85:
                    is_dup = True; break
            if not is_dup:
                kept_tables.append(item)
                final_kept_indices.append(item["original_index"])
                counts["table-good"] += 1

    # 3. Các class khác
    for label, items in by_label.items():
        if label not in ["chair-good", "table-good"]:
            for item in items:
                final_kept_indices.append(item["original_index"])
                counts[label] += 1

    return counts, list(dict.fromkeys(final_kept_indices))

def process_media():
    global INPUT_PATH
    if len(sys.argv) > 1 and sys.argv[1]: INPUT_PATH = sys.argv[1]

    INPUT_PATH = os.path.abspath(INPUT_PATH)
    
    if not os.path.exists(INPUT_PATH):
        print(f"RAW_JSON_START{{}}RAW_JSON_END")
        return

    try:
        model = YOLO(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        print(f"RAW_JSON_START{{}}RAW_JSON_END")
        return

    names = model.names
    media_type = get_media_type(INPUT_PATH)
    
    best_frame_clean = None
    best_counts = {}
    best_objects_list = [] 
    max_objects = -1
    best_frame_idx = 0

    # ==========================
    # QUÉT VIDEO / ẢNH
    # ==========================
    if media_type == "video":
        cap = cv2.VideoCapture(INPUT_PATH)
        idx = 0
        while cap.isOpened():
            ok, frame = cap.read()
            if not ok: break

            if idx % FRAME_STRIDE == 0:
                r = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
                raw_count = len(r.boxes) if r.boxes else 0

                if raw_count > max_objects:
                    filtered_counts, kept_indices = process_logic_counting(r, names)
                    
                    max_objects = raw_count
                    best_counts = dict(filtered_counts)
                    best_frame_idx = idx
                    best_frame_clean = frame.copy()
                    
                    best_objects_list = []
                    H, W = frame.shape[:2]
                    
                    if r.boxes is not None:
                         xyxys = r.boxes.xyxy.cpu().numpy()
                         confs = r.boxes.conf.cpu().numpy()
                         clss = r.boxes.cls.cpu().numpy().astype(int)

                         for i in kept_indices:
                             box = xyxys[i]  
                             conf = float(confs[i])
                             cls_id = int(clss[i])
                             label = names.get(cls_id, str(cls_id))
                             
                             # SỬA LỖI Ở ĐÂY: Ép kiểu float() cho từng phép tính
                             best_objects_list.append({
                                 "label": label,
                                 "confidence": conf,
                                 "bbox_xyxy": [float(x) for x in box], # Chuyển numpy array sang list float
                                 "bbox_normalized": [
                                     float(box[0]/W), 
                                     float(box[1]/H), 
                                     float(box[2]/W), 
                                     float(box[3]/H)
                                 ]
                             })

            idx += 1
        cap.release()
    else:
        # Xử lý Ảnh tĩnh
        frame = cv2.imread(INPUT_PATH)
        if frame is not None:
            r = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
            filtered_counts, kept_indices = process_logic_counting(r, names)
            best_counts = dict(filtered_counts)
            best_frame_clean = frame.copy()
            
            H, W = frame.shape[:2]
            xyxys = r.boxes.xyxy.cpu().numpy()
            confs = r.boxes.conf.cpu().numpy()
            clss = r.boxes.cls.cpu().numpy().astype(int)

            for i in kept_indices:
                box = xyxys[i]
                # SỬA LỖI Ở ĐÂY: Ép kiểu float()
                best_objects_list.append({
                    "label": names.get(int(clss[i]), str(int(clss[i]))),
                    "confidence": float(confs[i]),
                    "bbox_normalized": [
                         float(box[0]/W), 
                         float(box[1]/H), 
                         float(box[2]/W), 
                         float(box[3]/H)
                    ]
                })

    # ==========================
    # KẾT THÚC & TRẢ VỀ JSON
    # ==========================
    base_name = os.path.splitext(os.path.basename(INPUT_PATH))[0]
    
    if best_frame_clean is not None:
        img_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.jpg")
        cv2.imwrite(img_out_path, best_frame_clean)

        final_payload = {
            "counts": best_counts,
            "objects": best_objects_list, 
            "best_frame_index": best_frame_idx,
            "input": INPUT_PATH,
            "image_output": img_out_path
        }
        
        json_str = json.dumps(final_payload, ensure_ascii=False)
        print(f"RAW_JSON_START{json_str}RAW_JSON_END")

    else:
        print(f"RAW_JSON_START{{}}RAW_JSON_END")

if __name__ == "__main__":
    process_media()