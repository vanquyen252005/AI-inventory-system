const { query } = require("./db");
const { Pool } = require("pg");

jest.mock("pg", () => {
  const mockPool = {
    query: jest.fn(),
  };
  return { Pool: jest.fn(() => mockPool) };
});

describe("query function", () => {
  let mockPool;

  beforeEach(() => {
    mockPool = new Pool();
    jest.clearAllMocks();
  });

  it("should execute a query and log the duration", async () => {
    const mockResult = { rows: [{ id: 1, name: "Test" }] };
    mockPool.query.mockResolvedValue(mockResult);

    const consoleSpy = jest.spyOn(console, "log").mockImplementation();

    const sql = "SELECT * FROM users";
    const result = await query(sql);

    expect(mockPool.query).toHaveBeenCalledWith(sql, undefined);
    expect(result).toEqual(mockResult);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/\[DB\] SELECT \* FROM users \(\d+ms\)/));

    consoleSpy.mockRestore();
  });

  it("should execute a query with parameters", async () => {
    const mockResult = { rows: [{ id: 1, name: "Test" }] };
    mockPool.query.mockResolvedValue(mockResult);

    const sql = "SELECT * FROM users WHERE id = $1";
    const params = [1];
    const result = await query(sql, params);

    expect(mockPool.query).toHaveBeenCalledWith(sql, params);
    expect(result).toEqual(mockResult);
  });

  it("should throw an error if the query fails", async () => {
    const mockError = new Error("Database error");
    mockPool.query.mockRejectedValue(mockError);

    const sql = "SELECT * FROM users";

    await expect(query(sql)).rejects.toThrow("Database error");
    expect(mockPool.query).toHaveBeenCalledWith(sql, undefined);
  });
});