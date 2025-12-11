const scanRepository = require("../repositories/scanRepository");
const { spawn } = require('child_process');
const path = require('path');

class ScanService {
  async getAllScans(filters) {
    return await scanRepository.findAll(filters);
  }

  async getScanById(id) {
    const scan = await scanRepository.findById(id);
    if (!scan) {
      throw new Error("Scan not found");
    }
    return scan;
  }

  async createScanRecord(fileData) {
    const newScan = await scanRepository.create({
      scan_code: fileData.filename,
      image_url: fileData.path,
      status: 'processing',
      location: fileData.location 
    });

    this.triggerAIProcessing(newScan.id, fileData.path);
    return newScan;
  }

  // --- HÀM GỌI PYTHON (ĐÃ NÂNG CẤP) ---
  triggerAIProcessing(scanId, filePath) {
    console.log(`[AI] Bắt đầu xử lý Scan ID: ${scanId}...`);

    const aiServiceDir = path.resolve(__dirname, '../../../AI-scan Service');
    const pythonScriptPath = path.join(aiServiceDir, 'main.py');
    const absoluteFilePath = path.resolve(filePath);

    // Chạy Python với cwd là thư mục AI-scan Service để nhận diện file best.pt
    const pythonProcess = spawn('python', [pythonScriptPath, absoluteFilePath], {
      cwd: aiServiceDir
    });

    let dataString = '';

    // Thu thập toàn bộ log
    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    // Log lỗi nếu có
    pythonProcess.stderr.on('data', (data) => {
      // Bỏ qua các log thông báo của YOLO (không phải lỗi process)
      const msg = data.toString();
      if (!msg.includes("Speed:") && !msg.includes("frames")) {
          console.error(`[AI Log]: ${msg}`);
      }
    });

    pythonProcess.on('close', async (code) => {
      if (code === 0) {
        try {
          // 1. Tìm JSON nằm ở CUỐI CÙNG của output (tránh log rác ban đầu)
          const jsonStartIndex = dataString.lastIndexOf('{');
          const jsonEndIndex = dataString.lastIndexOf('}');
          
          if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
            let jsonStr = dataString.substring(jsonStartIndex, jsonEndIndex + 1);

            // [FIX QUAN TRỌNG] Tự động thay thế Single Quote (') thành Double Quote (")
            // Để xử lý trường hợp Python in ra Dictionary: {'chair': 5} -> {"chair": 5}
            if (jsonStr.includes("'")) {
                jsonStr = jsonStr.replace(/'/g, '"');
            }

            console.log("[AI Raw JSON]:", jsonStr); // Debug xem chuỗi cuối cùng là gì

            const resultData = JSON.parse(jsonStr);
            
            // 2. Map dữ liệu sang format FE cần (List detection objects)
            const finalDetectionList = [];
            Object.keys(resultData).forEach(cls => {
                const count = parseInt(resultData[cls]);
                for(let i=0; i < count; i++) {
                    finalDetectionList.push({
                        class: cls, // Ví dụ: "chair-good"
                        confidence: 0.99, 
                        box: [0,0,0,0]
                    });
                }
            });

            // 3. Cập nhật vào DB
            await scanRepository.updateResult(
              scanId, 
              'completed', 
              JSON.stringify(finalDetectionList), 
              finalDetectionList.length
            );
            console.log(`[AI] Thành công! Đã lưu ${finalDetectionList.length} vật thể.`);
          } else {
             console.error("[AI Error] Output không chứa JSON hợp lệ. Raw data:\n", dataString);
             throw new Error("Không tìm thấy JSON output từ Python");
          }
        } catch (err) {
          console.error("[AI Parse Error]", err.message);
          await scanRepository.updateResult(scanId, 'failed', null, 0);
        }
      } else {
        console.error(`[AI] Python process thoát với mã lỗi ${code}`);
        await scanRepository.updateResult(scanId, 'failed', null, 0);
      }
    });
  }

  async updateScanResult(scanId, status, resultData, deviceCount) {
    return await scanRepository.updateResult(scanId, status, resultData, deviceCount);
  }
}

module.exports = new ScanService();