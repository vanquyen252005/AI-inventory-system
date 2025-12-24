import cv2
import os
import json
import time
from collections import Counter, defaultdict
from ultralytics import YOLO

# ======================
# CONFIG
# ======================
INPUT_PATH = "uet24.12.mp4"
MODEL_PATH = "run/ban2/best.pt"
OUTPUT_DIR = "output_results"

# Chỉ đếm các class này (None = đếm tất cả)
# CLASSES_TO_COUNT = ["chair-good", "table-good", "fan-good"]
CLASSES_TO_COUNT = None

CONF = 0.6
IOU = 0.55
SLOW_MS = 200
SAVE_VIDEO = True
PRINT_EVERY = 30

# Tăng tốc: chỉ xử lý 1 mỗi N frame
FRAME_STRIDE = 1

# ======================
# FIX DUP CHAIR (Cách 1)
# ======================
# Lọc bbox quá nhỏ cho chair-good (bắt nhầm phần tựa/viền => đếm dư)
CHAIR_MIN_H = 9      # tăng lên 30-40 nếu còn đếm dư
CHAIR_MIN_AREA = 180   # tăng lên 1200-2000 nếu còn đếm dư
CHAIR_MIN_W = 8       # optional: bbox quá hẹp

os.makedirs(OUTPUT_DIR, exist_ok=True)

def allowed(label: str) -> bool:
    return (CLASSES_TO_COUNT is None) or (label in CLASSES_TO_COUNT)

def _iou_xyxy(a, b):
    ax1, ay1, ax2, ay2 = a
    bx1, by1, bx2, by2 = b
    inter_x1 = max(ax1, bx1)
    inter_y1 = max(ay1, by1)
    inter_x2 = min(ax2, bx2)
    inter_y2 = min(ay2, by2)
    iw = max(0.0, inter_x2 - inter_x1)
    ih = max(0.0, inter_y2 - inter_y1)
    inter = iw * ih
    if inter <= 0:
        return 0.0
    area_a = max(0.0, ax2-ax1) * max(0.0, ay2-ay1)
    area_b = max(0.0, bx2-bx1) * max(0.0, by2-by1)
    return inter / (area_a + area_b - inter + 1e-9)

def _contain_ratio_xyxy(small, big):
    sx1, sy1, sx2, sy2 = small
    bx1, by1, bx2, by2 = big
    inter_x1 = max(sx1, bx1)
    inter_y1 = max(sy1, by1)
    inter_x2 = min(sx2, bx2)
    inter_y2 = min(sy2, by2)
    iw = max(0.0, inter_x2 - inter_x1)
    ih = max(0.0, inter_y2 - inter_y1)
    inter = iw * ih
    area_s = max(0.0, sx2-sx1) * max(0.0, sy2-sy1) + 1e-9
    return inter / area_s

def dets_to_json(r, names, W, H):
    objects = []
    counts = Counter()

    if r.boxes is None or len(r.boxes) == 0:
        return {"counts": {}, "objects": []}

    xyxys = r.boxes.xyxy.cpu().numpy()
    confs = r.boxes.conf.cpu().numpy()
    clss  = r.boxes.cls.cpu().numpy().astype(int)

    # --- gom candidate theo label ---
    by_label = defaultdict(list)
    for xyxy, conf, cid in zip(xyxys, confs, clss):
        label = names.get(int(cid), str(int(cid)))
        if not allowed(label):
            continue
        by_label[label].append((list(map(float, xyxy)), float(conf), int(cid)))

    # --- (NEW) lọc bbox quá nhỏ cho chair-good ---
    if "chair-good" in by_label:
        filtered = []
        for box, conf, cid in by_label["chair-good"]:
            x1, y1, x2, y2 = box
            bw = max(0.0, x2 - x1)
            bh = max(0.0, y2 - y1)
            area = bw * bh

            # lọc các bbox "ảo" (mỏng/thấp/diện tích nhỏ)
            if bh < CHAIR_MIN_H:
                continue
            if bw < CHAIR_MIN_W:
                continue
            if area < CHAIR_MIN_AREA:
                continue

            filtered.append((box, conf, cid))
        by_label["chair-good"] = filtered

    # --- lọc trùng riêng cho table-good ---
    IOU_DUP = 0.25
    CONTAIN_DUP = 0.85

    if "table-good" in by_label:
        cand = sorted(by_label["table-good"], key=lambda x: x[1], reverse=True)
        kept = []
        for box, conf, cid in cand:
            dup = False
            for kbox, kconf, kcid in kept:
                iou = _iou_xyxy(box, kbox)
                contain = max(_contain_ratio_xyxy(box, kbox), _contain_ratio_xyxy(kbox, box))
                if iou > IOU_DUP or contain > CONTAIN_DUP:
                    dup = True
                    break
            if not dup:
                kept.append((box, conf, cid))
        by_label["table-good"] = kept

    # --- build objects + counts ---
    for label, items in by_label.items():
        for box, conf, cid in items:
            x1, y1, x2, y2 = box
            cx = (x1 + x2) / 2.0
            cy = (y1 + y2) / 2.0

            counts[label] += 1
            objects.append({
                "label": label,
                "confidence": float(conf),
                "bbox_xyxy": [x1, y1, x2, y2],
                "center_xy": [cx, cy],
                "bbox_normalized": [x1/W, y1/H, x2/W, y2/H],
            })

    return {"counts": dict(counts), "objects": objects}

def main():
    model = YOLO(MODEL_PATH)
    names = model.names

    cap = cv2.VideoCapture(INPUT_PATH)
    assert cap.isOpened(), f"Error reading file: {INPUT_PATH}"

    W = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    H = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30

    base = os.path.splitext(os.path.basename(INPUT_PATH))[0]
    json_out = os.path.join(OUTPUT_DIR, f"{base}_bestframe_objects.json")
    video_out = os.path.join(OUTPUT_DIR, f"{base}_output_easy.mp4")

    writer = None
    if SAVE_VIDEO:
        writer = cv2.VideoWriter(video_out, cv2.VideoWriter_fourcc(*"mp4v"), fps, (W, H))

    best_frame_idx = -1
    best_total = -1
    best_frame_bgr = None

    idx = 0
    processed = 0

    while True:
        ok, frame = cap.read()
        if not ok:
            break

        if idx % FRAME_STRIDE != 0:
            if writer is not None:
                writer.write(frame)
            idx += 1
            continue

        r = model.predict(frame, conf=CONF, iou=IOU, verbose=False)[0]
        time.sleep(SLOW_MS / 1000.0)

        # đếm nhanh object trong frame (CHƯA áp dụng lọc chair nhỏ ở đây)
        frame_count = 0
        if r.boxes is not None and len(r.boxes) > 0:
            cls_ids = r.boxes.cls.cpu().numpy().astype(int)
            for cid in cls_ids:
                label = names.get(int(cid), str(int(cid)))
                if allowed(label):
                    frame_count += 1

        if frame_count > best_total:
            best_total = frame_count
            best_frame_idx = idx
            best_frame_bgr = frame.copy()

        if writer is not None:
            writer.write(r.plot())

        if processed % max(1, (PRINT_EVERY // max(1, FRAME_STRIDE))) == 0:
            print(f"{idx}: total_objects_in_frame={frame_count}")

        idx += 1
        processed += 1

    cap.release()
    if writer:
        writer.release()

    if best_frame_bgr is None:
        payload = {"error": "No frames processed / best frame not found", "input": INPUT_PATH}
        with open(json_out, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return

    best_r = model.predict(best_frame_bgr, conf=CONF, iou=IOU, verbose=False)[0]
    det_json = dets_to_json(best_r, names, W, H)

    payload = {
        "input": INPUT_PATH,
        "model": MODEL_PATH,
        "frame_size": {"width": W, "height": H},
        "best_frame_index": best_frame_idx,
        "params": {
            "CONF": CONF,
            "IOU": IOU,
            "FRAME_STRIDE": FRAME_STRIDE,
            "CLASSES_TO_COUNT": CLASSES_TO_COUNT,
            "CHAIR_MIN_H": CHAIR_MIN_H,
            "CHAIR_MIN_W": CHAIR_MIN_W,
            "CHAIR_MIN_AREA": CHAIR_MIN_AREA,
        },
        "counts": det_json["counts"],
        "objects": det_json["objects"]
    }

    with open(json_out, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print("\n" + "=" * 30)
    print(f"✅ Saved JSON: {json_out}")
    print("✅ JSON content:")
    print(json.dumps(payload, ensure_ascii=False, indent=2))
    if SAVE_VIDEO:
        print(f"✅ Saved output video: {video_out}")
    print("=" * 30)

if __name__ == "__main__":
    main()
