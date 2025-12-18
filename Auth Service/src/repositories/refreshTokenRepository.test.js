const db = require("../config/db");
const {
  createRefreshToken,
  findByToken,
  revokeToken,
  revokeAllForUser,
} = require("./refreshTokenRepository");

jest.mock("../config/db");

describe("refreshTokenRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createRefreshToken", () => {
    it("should insert a new refresh token and return it", async () => {
      const mockToken = {
        id: 1,
        user_id: 1,
        token: "test-token",
        created_at: "2025-12-17T00:00:00Z",
        revoked: false,
      };

      db.query.mockResolvedValue({ rows: [mockToken] });

      const result = await createRefreshToken({ userId: 1, token: "test-token" });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO refresh_tokens/),
        [1, "test-token"]
      );
      expect(result).toEqual(mockToken);
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(createRefreshToken({ userId: 1, token: "test-token" })).rejects.toThrow("Database error");
    });

    it("should handle null userId gracefully", async () => {
      await expect(createRefreshToken({ userId: null, token: "test-token" })).rejects.toThrow();
    });

    it("should handle null token gracefully", async () => {
      await expect(createRefreshToken({ userId: 1, token: null })).rejects.toThrow();
    });

    it("should handle empty token string", async () => {
      await expect(createRefreshToken({ userId: 1, token: "" })).rejects.toThrow();
    });

    it("should handle database connection issues", async () => {
      db.query.mockRejectedValue(new Error("Connection error"));
      await expect(createRefreshToken({ userId: 1, token: "test-token" })).rejects.toThrow("Connection error");
    });

    it("should return the correct structure for the created token", async () => {
      const mockToken = {
        id: 1,
        user_id: 1,
        token: "test-token",
        created_at: "2025-12-17T00:00:00Z",
        revoked: false,
      };
      db.query.mockResolvedValue({ rows: [mockToken] });
      const result = await createRefreshToken({ userId: 1, token: "test-token" });
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("user_id");
      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("created_at");
      expect(result).toHaveProperty("revoked");
    });
  });

  describe("findByToken", () => {
    it("should return a token if it exists", async () => {
      const mockToken = {
        id: 1,
        user_id: 1,
        token: "test-token",
        created_at: "2025-12-17T00:00:00Z",
        revoked: false,
      };

      db.query.mockResolvedValue({ rows: [mockToken] });

      const result = await findByToken("test-token");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id, user_id, token/),
        ["test-token"]
      );
      expect(result).toEqual(mockToken);
    });

    it("should return null if the token does not exist", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await findByToken("non-existent-token");

      expect(result).toBeNull();
    });

    it("should handle null token gracefully", async () => {
      await expect(findByToken(null)).rejects.toThrow();
    });

    it("should handle empty token string", async () => {
      await expect(findByToken("")).rejects.toThrow();
    });

    it("should handle database connection issues", async () => {
      db.query.mockRejectedValue(new Error("Connection error"));
      await expect(findByToken("test-token")).rejects.toThrow("Connection error");
    });

    it("should return null for revoked tokens", async () => {
      db.query.mockResolvedValue({ rows: [{ revoked: true }] });
      const result = await findByToken("revoked-token");
      expect(result).toBeNull();
    });
  });

  describe("revokeToken", () => {
    it("should mark a token as revoked", async () => {
      db.query.mockResolvedValue({});

      await revokeToken("test-token");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE refresh_tokens SET revoked/),
        ["test-token"]
      );
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(revokeToken("test-token")).rejects.toThrow("Database error");
    });

    it("should handle null token gracefully", async () => {
      await expect(revokeToken(null)).rejects.toThrow();
    });

    it("should handle empty token string", async () => {
      await expect(revokeToken("")).rejects.toThrow();
    });
  });

  describe("revokeAllForUser", () => {
    it("should revoke all tokens for a user", async () => {
      db.query.mockResolvedValue({});

      await revokeAllForUser(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE refresh_tokens SET revoked/),
        [1]
      );
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(revokeAllForUser(1)).rejects.toThrow("Database error");
    });

    it("should handle null userId gracefully", async () => {
      await expect(revokeAllForUser(null)).rejects.toThrow();
    });

    it("should handle invalid userId types", async () => {
      await expect(revokeAllForUser("invalid-id")).rejects.toThrow();
    });
  });
});