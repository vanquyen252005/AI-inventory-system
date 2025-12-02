const scanRepository = require("../repositories/scanRepository");

class ScanService {
  async getAllScans(filters) {
    // Code mới: Trả về trực tiếp danh sách từ repo
    // (Bạn có thể thêm logic đếm total nếu cần, tạm thời trả về list)
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
    // Map dữ liệu từ Controller xuống Repository
    return await scanRepository.create({
      scan_code: fileData.filename,
      image_url: fileData.path,
      status: 'processing',
      location: fileData.location 
    });
  }

  async updateScanResult(scanId, status, resultData, deviceCount) {
    return await scanRepository.updateResult(
        scanId, 
        status, 
        resultData, 
        deviceCount
    );
  }
}

module.exports = new ScanService();