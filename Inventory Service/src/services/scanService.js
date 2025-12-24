const scanRepository = require("../repositories/scanRepository");
const { spawn } = require('child_process');
const path = require('path');

class ScanService {
  async getAllScans(filters) {
    return await scanRepository.findAll(filters);
  }

  async getScanById(id) {
    const scan = await scanRepository.findById(id);
    if (!scan) throw new Error("Scan not found");
    return scan;
  }

  async createScanRecord(fileData) {
    // [FIX] Xử lý đường dẫn: Chỉ lấy phần tương đối (vd: uploads/file.mp4)
    // Nếu fileData.path là tuyệt đối (D:\...), ta cắt lấy từ 'uploads' trở đi
    let relativePath = fileData.path;
    if (relativePath.includes('uploads')) {
        // Lấy chuỗi bắt đầu từ chữ 'uploads'
        // Ví dụ: D:\Project\uploads\file.mp4 -> uploads\file.mp4
        relativePath = relativePath.substring(relativePath.lastIndexOf('uploads')); 
    }
    // Chuẩn hóa dấu gạch chéo cho web (chuyển \ thành /)
    relativePath = relativePath.replace(/\\/g, '/');

    const newScan = await scanRepository.create({
      scan_code: fileData.filename,
      image_url: relativePath, // <-- Lưu đường dẫn sạch vào DB
      status: 'processing',
      location: fileData.location 
    });

    // Truyền đường dẫn GỐC (tuyệt đối) cho AI xử lý (vì Python cần đường dẫn thật)
    this.triggerAIProcessing(newScan.id, fileData.path); 
    return newScan;
  }

  triggerAIProcessing(scanId, filePath) {
    console.log(`[AI] Bắt đầu xử lý Scan ID: ${scanId}...`);

    const aiServiceDir = path.resolve(__dirname, '../../../AI-scan Service');
    // Đảm bảo trỏ đúng file main.py
    const pythonScriptPath = path.join(aiServiceDir, 'main.py'); 
    const absoluteFilePath = path.resolve(filePath);

    const pythonProcess = spawn('python', [pythonScriptPath, absoluteFilePath], {
      cwd: aiServiceDir
    });

    let dataString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      console.error(`[AI Log]: ${data.toString()}`);
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          // --- LOGIC PARSE MỚI (Dùng Marker để cắt chuỗi chính xác) ---
          const startMarker = "RAW_JSON_START";
          const endMarker = "RAW_JSON_END";
          
          const startIndex = dataString.indexOf(startMarker);
          const endIndex = dataString.lastIndexOf(endMarker);

          if (startIndex !== -1 && endIndex !== -1) {
            // Cắt đúng đoạn JSON nằm giữa 2 marker
            let jsonStr = dataString.substring(startIndex + startMarker.length, endIndex);
            console.log("[AI Raw JSON Found]"); // Log ngắn gọn để debug
            
            const resultData = JSON.parse(jsonStr);
            const finalDetectionList = [];

            // 1. Format mới: Có mảng objects chứa tọa độ
            if (resultData.objects && Array.isArray(resultData.objects)) {
                resultData.objects.forEach(obj => {
                    finalDetectionList.push({
                        class: obj.label,
                        confidence: obj.confidence,
                        box: obj.bbox_normalized, // [x1, y1, x2, y2]
                        frameIndex: resultData.best_frame_index
                    });
                });
            } 
            // 2. Fallback Format cũ (chỉ đếm số lượng)
            else if (resultData.counts) {
                Object.keys(resultData.counts).forEach(cls => {
                    const count = resultData.counts[cls];
                    for(let i=0; i<count; i++) {
                        finalDetectionList.push({ 
                            class: cls, 
                            confidence: 0.9, 
                            box: null 
                        });
                    }
                });
            }

            // Lưu vào DB
            await scanRepository.updateResult(
              scanId, 
              'completed', 
              JSON.stringify(finalDetectionList), 
              finalDetectionList.length
            );
            console.log(`[AI] Hoàn tất. Tìm thấy ${finalDetectionList.length} vật thể.`);
          } else {
             console.error("[AI Error] Không tìm thấy JSON marker (RAW_JSON_START). Output có thể bị lỗi.");
             console.error("Raw Output:", dataString); // In ra để debug nếu cần
             throw new Error("Output format invalid");
          }
        } catch (err) {
          console.error("[AI Parse Error]", err.message);
          await scanRepository.updateResult(scanId, 'failed', null, 0);
        }
      } else {
        console.error(`[AI] Process thoát với mã lỗi ${code}`);
        await scanRepository.updateResult(scanId, 'failed', null, 0);
      }
    });
  }

  async updateScanResult(scanId, status, resultData, deviceCount) {
    return await scanRepository.updateResult(scanId, status, resultData, deviceCount);
  }
}

module.exports = new ScanService();