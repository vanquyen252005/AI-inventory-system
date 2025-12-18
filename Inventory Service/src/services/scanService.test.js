const scanRepository = require("../repositories/scanRepository");
const ScanService = require("./scanService");
const { spawn } = require("child_process");

jest.mock("../repositories/scanRepository");
jest.mock("child_process", () => ({
  spawn: jest.fn(),
}));

describe("ScanService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllScans", () => {
    it("should return all scans with filters", async () => {
      const mockScans = [
        { id: 1, scan_code: "SCAN001" },
        { id: 2, scan_code: "SCAN002" },
      ];
      scanRepository.findAll.mockResolvedValue(mockScans);

      const result = await ScanService.getAllScans({ search: "Room" });

      expect(scanRepository.findAll).toHaveBeenCalledWith({ search: "Room" });
      expect(result).toEqual(mockScans);
    });
  });

  describe("getScanById", () => {
    it("should return a scan by ID", async () => {
      const mockScan = { id: 1, scan_code: "SCAN001" };
      scanRepository.findById.mockResolvedValue(mockScan);

      const result = await ScanService.getScanById(1);

      expect(scanRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockScan);
    });

    it("should throw an error if scan is not found", async () => {
      scanRepository.findById.mockResolvedValue(null);

      await expect(ScanService.getScanById(999)).rejects.toThrow("Scan not found");
    });
  });

  describe("createScanRecord", () => {
    it("should create a new scan record and trigger AI processing", async () => {
      const mockScan = { id: 1, scan_code: "SCAN001" };
      scanRepository.create.mockResolvedValue(mockScan);
      const mockTriggerAIProcessing = jest.spyOn(ScanService, "triggerAIProcessing").mockImplementation();

      const result = await ScanService.createScanRecord({ filename: "SCAN001", path: "/path/to/file" });

      expect(scanRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ scan_code: "SCAN001", image_url: "/path/to/file" })
      );
      expect(mockTriggerAIProcessing).toHaveBeenCalledWith(1, "/path/to/file");
      expect(result).toEqual(mockScan);
    });
  });

  describe("triggerAIProcessing", () => {
    it("should handle successful AI processing", (done) => {
      const mockPythonProcess = {
        stdout: { on: jest.fn((event, callback) => event === "data" && callback('{"chair": 5}')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => event === "close" && callback(0)),
      };
      spawn.mockReturnValue(mockPythonProcess);
      scanRepository.updateResult.mockResolvedValue();

      ScanService.triggerAIProcessing(1, "/path/to/file");

      setImmediate(() => {
        expect(spawn).toHaveBeenCalledWith(
          "python",
          expect.any(Array),
          expect.objectContaining({ cwd: expect.any(String) })
        );
        expect(scanRepository.updateResult).toHaveBeenCalledWith(
          1,
          "completed",
          expect.any(String),
          5
        );
        done();
      });
    });

    it("should handle AI processing failure", (done) => {
      const mockPythonProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event, callback) => event === "data" && callback("Error")) },
        on: jest.fn((event, callback) => event === "close" && callback(1)),
      };
      spawn.mockReturnValue(mockPythonProcess);
      scanRepository.updateResult.mockResolvedValue();

      ScanService.triggerAIProcessing(1, "/path/to/file");

      setImmediate(() => {
        expect(scanRepository.updateResult).toHaveBeenCalledWith(1, "failed", null, 0);
        done();
      });
    });
  });

  describe("updateScanResult", () => {
    it("should update the scan result", async () => {
      const mockResult = { id: 1, status: "completed" };
      scanRepository.updateResult.mockResolvedValue(mockResult);

      const result = await ScanService.updateScanResult(1, "completed", "{}", 5);

      expect(scanRepository.updateResult).toHaveBeenCalledWith(1, "completed", "{}", 5);
      expect(result).toEqual(mockResult);
    });
  });
});