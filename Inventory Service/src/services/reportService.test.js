const db = require("../config/db");
const reportService = require("./reportService");

jest.mock("../config/db");

describe("ReportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getSummary", () => {
    it("should return a summary of the system", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: "100" }] }) // Total scans
        .mockResolvedValueOnce({ rows: [{ total: "200" }] }) // Total assets
        .mockResolvedValueOnce({ rows: [{ total: "50" }] }) // Maintenance count
        .mockResolvedValueOnce({ rows: [{ total: "1000000" }] }); // Total value

      const result = await reportService.getSummary();

      expect(db.query).toHaveBeenCalledTimes(4);
      expect(result).toEqual({
        totalScans: 100,
        totalAssets: 200,
        maintenanceCount: 50,
        totalValue: 1000000,
      });
    });

    it("should handle null total value gracefully", async () => {
      db.query
        .mockResolvedValueOnce({ rows: [{ total: "100" }] })
        .mockResolvedValueOnce({ rows: [{ total: "200" }] })
        .mockResolvedValueOnce({ rows: [{ total: "50" }] })
        .mockResolvedValueOnce({ rows: [{ total: null }] });

      const result = await reportService.getSummary();

      expect(result.totalValue).toBe(0);
    });
  });

  describe("getTrends", () => {
    it("should return scan trends over the last 6 months", async () => {
      const mockTrends = [
        { month_name: "Jan", scans: "10" },
        { month_name: "Feb", scans: "20" },
      ];
      db.query.mockResolvedValue({ rows: mockTrends });

      const result = await reportService.getTrends();

      expect(db.query).toHaveBeenCalledWith(expect.stringMatching(/SELECT/));
      expect(result).toEqual([
        { month: "Jan", scans: 10 },
        { month: "Feb", scans: 20 },
      ]);
    });

    it("should handle empty results", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await reportService.getTrends();

      expect(result).toEqual([]);
    });
  });

  describe("getIssueDistribution", () => {
    it("should return the distribution of assets by category", async () => {
      const mockDistribution = [
        { category: "Category 1", value: "10" },
        { category: "Category 2", value: "20" },
      ];
      db.query.mockResolvedValue({ rows: mockDistribution });

      const result = await reportService.getIssueDistribution();

      expect(db.query).toHaveBeenCalledWith(expect.stringMatching(/SELECT/));
      expect(result).toEqual([
        { name: "Category 1", value: 10 },
        { name: "Category 2", value: 20 },
      ]);
    });

    it("should handle empty results", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await reportService.getIssueDistribution();

      expect(result).toEqual([]);
    });
  });
});