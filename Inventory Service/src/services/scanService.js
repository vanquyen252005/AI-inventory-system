// src/services/scanService.js
const scanRepository = require("../repositories/scanRepository");
const detectionRepository = require("../repositories/detectionRepository");
const assetRepository = require("../repositories/assetRepository");

async function getAllScans(filters = {}) {
  const scans = await scanRepository.findAll(filters);
  const total = await scanRepository.count(filters);

  return {
    scans,
    total,
    page: filters.page || 1,
    limit: filters.limit || 10,
  };
}

async function getScanById(id) {
  const scan = await scanRepository.findById(id);
  if (!scan) {
    throw new Error("Scan not found");
  }

  // Get detections for this scan
  const detections = await detectionRepository.findByScanId(id);
  scan.detections = detections;

  return scan;
}

async function createScan(scanData) {
  // Verify asset exists
  const asset = await assetRepository.findById(scanData.assetId);
  if (!asset) {
    throw new Error("Asset not found");
  }

  // Generate scan ID if not provided
  if (!scanData.id) {
    const count = await scanRepository.count();
    scanData.id = `SCN-${String(count + 1).padStart(3, "0")}`;
  }

  const scan = await scanRepository.create(scanData);

  // Update asset's last_scanned
  await assetRepository.update(scanData.assetId, {
    last_scanned: new Date().toISOString().split("T")[0],
  });

  return scan;
}

async function updateScan(id, scanData) {
  const existing = await scanRepository.findById(id);
  if (!existing) {
    throw new Error("Scan not found");
  }

  return await scanRepository.update(id, scanData);
}

async function deleteScan(id) {
  const existing = await scanRepository.findById(id);
  if (!existing) {
    throw new Error("Scan not found");
  }

  // Delete associated detections
  await detectionRepository.removeByScanId(id);

  return await scanRepository.remove(id);
}

async function addDetections(scanId, detections) {
  const scan = await scanRepository.findById(scanId);
  if (!scan) {
    throw new Error("Scan not found");
  }

  const detectionsWithScanId = detections.map((d) => ({ ...d, scanId }));
  return await detectionRepository.createMany(detectionsWithScanId);
}

module.exports = {
  getAllScans,
  getScanById,
  createScan,
  updateScan,
  deleteScan,
  addDetections,
};

