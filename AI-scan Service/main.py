import cv2
import json
import os
from ultralytics import solutions

VIDEO_IN = "Object3.mp4"
MODEL_PATH = "runs/detect/train2/weights/best.pt"
JSON_OUT = "object_counting_output.json"
VIDEO_OUT = "object_counting_output.mp4"  # gợi ý dùng .mp4 nếu fourcc = mp4v

# --- Open video ---
cap = cv2.VideoCapture(VIDEO_IN)
assert cap.isOpened(), f"Error reading video file: {VIDEO_IN}"

# Định nghĩa vùng (line hoặc polygon). Ở đây là polygon 4 đỉnh:
region_points = [[1853, 44], [1879, 1024], [29, 1013], [13, 24]]
# (XÓA dòng list thừa trước đó nếu có)

# --- Video writer ---
w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
video_writer = cv2.VideoWriter(VIDEO_OUT, fourcc, fps, (w, h))

# --- ObjectCounter ---
counter = solutions.ObjectCounter(
    show=True,
    region=region_points,
    model=MODEL_PATH,
    # classes=[...],         # nếu muốn chỉ đếm một số lớp
    # tracker="botsort.yaml" # hoặc "bytetrack.yaml"
)

# --- Thu thập JSON theo từng frame ---
frames_json = []
frame_idx = 0

while cap.isOpened():
    ok, im0 = cap.read()
    if not ok:
        print("Video frame is empty or processing is complete.")
        break

    # Gọi counter -> trả SolutionResults (plot_im + các số liệu count)
    results = counter(im0)  # alias của process()

    # Lấy danh sách đối tượng ở frame hiện tại từ counter.*
    # (counter.boxes, counter.track_ids, counter.clss, counter.confs được set trong process)
    objects = []
    names = getattr(counter, "names", None) or {}
    for box, tid, cls, conf in zip(counter.boxes, counter.track_ids, counter.clss, counter.confs):
        x1, y1, x2, y2 = map(float, box)  # xyxy
        cls_id = int(cls)
        label = names.get(cls_id, str(cls_id))
        objects.append({
            "track_id": int(tid),
            "class_id": cls_id,
            "label": label,
            "confidence": float(conf),
            "bbox": {"x1": x1, "y1": y1, "x2": x2, "y2": y2}
        })

    # Ghi JSON cho frame hiện tại
    frames_json.append({
        "frame_index": frame_idx,
        "timestamp_sec": round(frame_idx / float(fps), 3),
        "in_count": int(results.in_count),
        "out_count": int(results.out_count),
        "classwise_count": results.classwise_count,   # {"person": {"IN":x,"OUT":y}, ...}
        "total_tracks": int(results.total_tracks),
        "objects": objects
    })

    # Ghi video frame đã vẽ bbox/region
    video_writer.write(results.plot_im)

    frame_idx += 1

# --- Kết thúc: tổng hợp & lưu JSON ---
summary = {
    "final_in_count": int(counter.in_count),
    "final_out_count": int(counter.out_count),
    "final_classwise_count": counter.classwise_count  # dict(str -> {"IN":..,"OUT":..})
}

output = {
    "video": {"path": os.path.abspath(VIDEO_IN), "width": w, "height": h, "fps": fps},
    "model": os.path.abspath(MODEL_PATH),
    "region": region_points,
    "frames": frames_json,
    "summary": summary
}

with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

cap.release()
video_writer.release()
cv2.destroyAllWindows()
print(f"✅ JSON saved to {JSON_OUT}\n🎬 Video saved to {VIDEO_OUT}")
