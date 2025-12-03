import cv2
import json
import os
from ultralytics import solutions

VIDEO_IN = "Object3.mp4"
MODEL_PATH = "best.pt"
JSON_OUT = "object_counting_output.json"
VIDEO_OUT = "object_counting_output.mp4"  # gợi ý dùng .mp4 nếu fourcc = mp4v


cap = cv2.VideoCapture(VIDEO_IN)
assert cap.isOpened(), f"Error reading video file: {VIDEO_IN}"


region_points = [[1853, 44], [1879, 1024], [29, 1013], [13, 24]]



w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
fps = cap.get(cv2.CAP_PROP_FPS) or 30
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
video_writer = cv2.VideoWriter(VIDEO_OUT, fourcc, fps, (w, h))


counter = solutions.ObjectCounter(
    show=True,
    region=region_points,
    model=MODEL_PATH,
    # classes=[...],         # nếu muốn chỉ đếm một số lớp
    # tracker="botsort.yaml" # hoặc "bytetrack.yaml"
)


frames_json = []
frame_idx = 0

while cap.isOpened():
    ok, im0 = cap.read()
    if not ok:
        print("Video frame is empty or processing is complete.")
        break

    results = counter(im0)  # alias của process()


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


    frames_json.append({
        "frame_index": frame_idx,
        "timestamp_sec": round(frame_idx / float(fps), 3),
        "in_count": int(results.in_count),
        "out_count": int(results.out_count),
        "classwise_count": results.classwise_count,   # {"person": {"IN":x,"OUT":y}, ...}
        "total_tracks": int(results.total_tracks),
        "objects": objects
    })


    video_writer.write(results.plot_im)

    frame_idx += 1

simple_counts = {}

for label, counts in counter.classwise_count.items():
    in_cnt = counts.get("IN", 0)
    out_cnt = counts.get("OUT", 0)
    total = in_cnt + out_cnt
    simple_counts[label] = total


output = {
    "video": os.path.abspath(VIDEO_IN),
    "model": os.path.abspath(MODEL_PATH),
    "objects": simple_counts
}

with open(JSON_OUT, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, indent=2)

cap.release()
video_writer.release()
cv2.destroyAllWindows()
print(f"✅ JSON saved to {JSON_OUT}\n🎬 Video saved to {VIDEO_OUT}")