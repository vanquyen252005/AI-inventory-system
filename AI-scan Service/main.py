import cv2
import json
import os
import mimetypes
import time
import sys
from collections import Counter, defaultdict

import numpy as np
import torch
from ultralytics import YOLO

# ======================
# CONFIG (default fallback)
# ======================
INPUT_PATH = "uet24.12.mp4"          # sẽ bị override nếu có argv
MODEL_PATH = "run/ban5/best.pt"
OUTPUT_DIR = "output_results"

# ======================
# PARAMS
# ======================
CLASSES_TO_COUNT = None
CONF = 0.6
IOU = 0.55
FRAME_STRIDE = 2

CHAIR_MIN_H = 9
CHAIR_MIN_W = 8
CHAIR_MIN_AREA = 180

# Khi chạy từ backend nên để False để không treo process
SHOW_WINDOW = False

os.makedirs(OUTPUT_DIR, exist_ok=True)


def get_media_type(filepath: str) -> str:
    mime_type, _ = mimetypes.guess_type(filepath)
    if mime_type and mime_type.startswith("image"):
        return "image"
    elif mime_type and mime_type.startswith("video"):
        return "video"
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
    if inter <= 0:
        return 0.0
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
    """
    Lọc chair-good quá nhỏ và table-good trùng lặp.
    Đồng thời sửa results.boxes để plot() chỉ vẽ box giữ lại.
    """
    counts = Counter()

    if results.boxes is None or len(results.boxes) == 0:
        return counts, results

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

    # 1) chair-good lọc nhỏ
    if "chair-good" in by_label:
        for item in by_label["chair-good"]:
            box = item["box"]
            bw, bh = box[2] - box[0], box[3] - box[1]
            if bh >= CHAIR_MIN_H and bw >= CHAIR_MIN_W and (bw * bh) >= CHAIR_MIN_AREA:
                final_kept_indices.append(item["original_index"])
                counts["chair-good"] += 1

    # 2) table-good lọc trùng
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
                    is_dup = True
                    break
            if not is_dup:
                kept_tables.append(item)
                final_kept_indices.append(item["original_index"])
                counts["table-good"] += 1

    # 3) các class khác giữ hết
    for label, items in by_label.items():
        if label not in ["chair-good", "table-good"]:
            for item in items:
                final_kept_indices.append(item["original_index"])
                counts[label] += 1

    # Loại trùng index (để khỏi index lỗi / vẽ lặp)
    final_kept_indices = list(dict.fromkeys(final_kept_indices))

    # IMPORTANT: dùng torch tensor để index Boxes ổn định
    if final_kept_indices:
        keep = torch.tensor(final_kept_indices, dtype=torch.long)
        results.boxes = results.boxes[keep]
    else:
        empty = torch.empty((0,), dtype=torch.long)
        results.boxes = results.boxes[empty]

    return counts, results


def process_media():
    global INPUT_PATH

    # argv[1] là đường dẫn file backend truyền vào
    if len(sys.argv) > 1 and sys.argv[1]:
        INPUT_PATH = sys.argv[1]

    print(f"🚀 Bắt đầu xử lý: {INPUT_PATH}")

    # Nếu backend truyền path tương đối, normalize theo cwd hiện tại
    INPUT_PATH = os.path.abspath(INPUT_PATH)

    if not os.path.exists(INPUT_PATH):
        print(f"❌ File không tồn tại: {INPUT_PATH}")
        print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))
        return

    media_type = get_media_type(INPUT_PATH)
    if media_type == "unknown":
        print(f"❌ Không xác định được loại file: {INPUT_PATH}")
        print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))
        return

    print(f"📥 Đang load model: {MODEL_PATH}")
    try:
        model = YOLO(MODEL_PATH)
    except Exception as e:
        print(f"❌ Lỗi load model: {e}")
        print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))
        return

    names = model.names
    base_name = os.path.splitext(os.path.basename(INPUT_PATH))[0]

    best_frame_processed = None
    best_counts = {}
    max_objects = -1

    if media_type == "video":
        print("🎬 Quét video để tìm Best Frame...")
        cap = cv2.VideoCapture(INPUT_PATH)
        if not cap.isOpened():
            print(f"❌ Không mở được video: {INPUT_PATH}")
            print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))
            return

        idx = 0
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 0
        start_time = time.time()

        while cap.isOpened():
            ok, frame = cap.read()
            if not ok:
                break

            if idx % FRAME_STRIDE == 0:
                r = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
                raw_count = len(r.boxes) if r.boxes is not None else 0

                if raw_count > max_objects:
                    max_objects = raw_count
                    filtered_counts, filtered_results = process_logic_counting(r, names)
                    best_counts = dict(filtered_counts)
                    best_frame_processed = filtered_results.plot()

            idx += 1
            if total_frames and idx % 50 == 0:
                print(f"⏳ {idx}/{total_frames} frames...")

        cap.release()
        print(f"✅ Quét xong trong {time.time() - start_time:.2f}s")

    else:  # image
        print("📸 Xử lý ảnh...")
        frame = cv2.imread(INPUT_PATH)
        if frame is None:
            print("❌ Không đọc được ảnh.")
            print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))
            return

        r = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
        filtered_counts, filtered_results = process_logic_counting(r, names)
        best_counts = dict(filtered_counts)
        best_frame_processed = filtered_results.plot()

    # Lưu + in kết quả
    if best_frame_processed is not None:
        img_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_output.jpg")
        cv2.imwrite(img_out_path, best_frame_processed)

        json_out_path = os.path.join(OUTPUT_DIR, f"{base_name}_count.json")
        with open(json_out_path, "w", encoding="utf-8") as f:
            json.dump(best_counts, f, ensure_ascii=False, indent=2)

        print(f"📁 Ảnh: {img_out_path}")
        print(f"📁 JSON: {json_out_path}")
        print("📊 Counts:", json.dumps(best_counts, ensure_ascii=False))

        # Dòng này để NodeJS parse chắc chắn
        print("RESULT_JSON=" + json.dumps(best_counts, ensure_ascii=False))

        if SHOW_WINDOW:
            cv2.imshow("Ket qua (Best Frame)", cv2.resize(best_frame_processed, (1024, 768)))
            cv2.waitKey(0)
            cv2.destroyAllWindows()
    else:
        print("❌ Không tìm thấy đối tượng nào.")
        print("RESULT_JSON=" + json.dumps({}, ensure_ascii=False))


if __name__ == "__main__":
    process_media()
