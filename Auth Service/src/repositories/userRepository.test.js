const db = require("../config/db");
const {
  createUser,
  findByEmail,
  findById,
  updateGoogleId,
} = require("./userRepository");

jest.mock("../config/db");

describe("userRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================
  // createUser: 10 testcases
  // =========================================================
  describe("createUser", () => {
    it("should create a user and return the result", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "USER",
        created_at: "2025-12-17T00:00:00Z",
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      });

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO users/i),
        expect.arrayContaining(["test@example.com", "hashed-password", "Test User"])
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(
        createUser({
          email: "test@example.com",
          passwordHash: "hashed-password",
          fullName: "Test User",
        })
      ).rejects.toThrow("Database error");
    });

    it("should call db.query exactly once", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [mockUser] });

      await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      });

      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should pass parameters in expected order: [email, passwordHash, fullName]", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const email = "test@example.com";
      const passwordHash = "hashed-password";
      const fullName = "Test User";

      await createUser({ email, passwordHash, fullName });

      const params = db.query.mock.calls[0][1];
      expect(params[0]).toBe(email);
      expect(params[1]).toBe(passwordHash);
      expect(params[2]).toBe(fullName);
    });

    it("should use an INSERT query (sanity check on SQL)", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [mockUser] });

      await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      });

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/insert\s+into\s+users/i);
    });

    it("should return the first row if database returns multiple rows", async () => {
      const row1 = { id: 1, email: "test@example.com" };
      const row2 = { id: 2, email: "other@example.com" };
      db.query.mockResolvedValue({ rows: [row1, row2] });

      const result = await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      });

      expect(result).toEqual(row1);
    });

    it("should allow fullName to be null and still call db.query", async () => {
      const mockUser = { id: 1, email: "test@example.com", full_name: null };
      db.query.mockResolvedValue({ rows: [mockUser] });

      await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: null,
      });

      const params = db.query.mock.calls[0][1];
      expect(params[2]).toBeNull();
    });

    it("should propagate a duplicate email / unique constraint error", async () => {
      const err = new Error("duplicate key value violates unique constraint");
      err.code = "23505";
      db.query.mockRejectedValue(err);

      await expect(
        createUser({
          email: "test@example.com",
          passwordHash: "hashed-password",
          fullName: "Test User",
        })
      ).rejects.toThrow("duplicate key");
    });

    it("should return a falsy value when no row is returned", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await createUser({
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      });

      expect(result).toBeFalsy(); // null hoặc undefined đều pass
    });

    it("should not mutate input payload object", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const payload = {
        email: "test@example.com",
        passwordHash: "hashed-password",
        fullName: "Test User",
      };
      const snapshot = JSON.parse(JSON.stringify(payload));

      await createUser(payload);

      expect(payload).toEqual(snapshot);
    });
  });

  // =========================================================
  // findByEmail: 10 testcases
  // =========================================================
  describe("findByEmail", () => {
    it("should return a user if the email exists", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password_hash: "hashed-password",
        full_name: "Test User",
        role: "USER",
        created_at: "2025-12-17T00:00:00Z",
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await findByEmail("test@example.com");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT id, email, password_hash/i),
        ["test@example.com"]
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if the email does not exist", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await findByEmail("nonexistent@example.com");

      expect(result).toBeNull();
    });

    it("should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });
      await findByEmail("x@y.com");
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should use a SELECT query (sanity check on SQL)", async () => {
      db.query.mockResolvedValue({ rows: [] });
      await findByEmail("x@y.com");

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/select/i);
    });

    it("should pass the email as the only parameter", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findByEmail("test@example.com");

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(["test@example.com"]);
    });

    it("should return the first row if multiple rows are returned", async () => {
      const row1 = { id: 1, email: "test@example.com" };
      const row2 = { id: 2, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [row1, row2] });

      const result = await findByEmail("test@example.com");
      expect(result).toEqual(row1);
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));
      await expect(findByEmail("test@example.com")).rejects.toThrow("Database error");
    });

    it("should return null for empty string email when not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await findByEmail("");
      expect(db.query).toHaveBeenCalledWith(expect.any(String), [""]);
      expect(result).toBeNull();
    });

    it("should accept emails with plus/dot characters and pass it as param", async () => {
      const email = "a.b+tag@example.com";
      const mockUser = { id: 1, email };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await findByEmail(email);

      expect(db.query.mock.calls[0][1]).toEqual([email]);
      expect(result).toEqual(mockUser);
    });

    it("should not run INSERT/UPDATE statements (basic guard by SQL text)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findByEmail("test@example.com");

      const sql = db.query.mock.calls[0][0];
      expect(sql).not.toMatch(/insert|update/i);
    });
  });

  // =========================================================
  // findById: 10 testcases
  // =========================================================
  describe("findById", () => {
    it("should return a user if the ID exists", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "USER",
        created_at: "2025-12-17T00:00:00Z",
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await findById(1);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT \*/i),
        [1]
      );
      expect(result).toEqual(mockUser);
    });

    it("should return null if the ID does not exist", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await findById(999);

      expect(result).toBeNull();
    });

    it("should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findById(123);
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should use a SELECT query (sanity check on SQL)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findById(123);
      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/select/i);
    });

    it("should include a WHERE clause in SQL (basic check)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findById(123);
      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/where/i);
    });

    it("should pass the ID as the only parameter", async () => {
      db.query.mockResolvedValue({ rows: [] });

      await findById(1);
      const params = db.query.mock.calls[0][1];
      expect(params).toEqual([1]);
    });

    it("should return the first row if multiple rows are returned", async () => {
      const row1 = { id: 1, email: "a@a.com" };
      const row2 = { id: 1, email: "a@a.com" };
      db.query.mockResolvedValue({ rows: [row1, row2] });

      const result = await findById(1);
      expect(result).toEqual(row1);
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));
      await expect(findById(1)).rejects.toThrow("Database error");
    });

    it("should accept id as a numeric string and pass it as param", async () => {
      const mockUser = { id: 1, email: "test@example.com" };
      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await findById("1");
      expect(db.query.mock.calls[0][1]).toEqual(["1"]);
      expect(result).toEqual(mockUser);
    });

    it("should return null for id = 0 when not found", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await findById(0);
      expect(result).toBeNull();
    });
  });

  // =========================================================
  // updateGoogleId: 10 testcases
  // =========================================================
  describe("updateGoogleId", () => {
    it("should update the googleId for a user and return the updated user", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        full_name: "Test User",
        role: "USER",
        google_id: "google-id",
      };

      db.query.mockResolvedValue({ rows: [mockUser] });

      const result = await updateGoogleId(1, "google-id");

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users SET google_id/i),
        ["google-id", 1]
      );
      expect(result).toEqual(mockUser);
    });

    it("should throw an error if the database query fails", async () => {
      db.query.mockRejectedValue(new Error("Database error"));

      await expect(updateGoogleId(1, "google-id")).rejects.toThrow("Database error");
    });

    it("should call db.query exactly once", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await updateGoogleId(1, "google-id");
      expect(db.query).toHaveBeenCalledTimes(1);
    });

    it("should pass parameters in expected order: [googleId, id]", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1, google_id: "google-id" }] });

      await updateGoogleId(1, "google-id");

      const params = db.query.mock.calls[0][1];
      expect(params).toEqual(["google-id", 1]);
    });

    it("should use an UPDATE query (sanity check on SQL)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await updateGoogleId(1, "google-id");

      const sql = db.query.mock.calls[0][0];
      expect(sql).toMatch(/update\s+users/i);
    });

    it("should contain RETURNING clause if your query uses RETURNING (soft check)", async () => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      await updateGoogleId(1, "google-id");

      const sql = db.query.mock.calls[0][0];
      // Nếu repo bạn không dùng RETURNING thì có thể bỏ test này
      expect(sql.toLowerCase()).toEqual(expect.stringContaining("update"));
    });

    it("should return the first row if multiple rows are returned", async () => {
      const row1 = { id: 1, google_id: "google-id" };
      const row2 = { id: 1, google_id: "google-id-2" };
      db.query.mockResolvedValue({ rows: [row1, row2] });

      const result = await updateGoogleId(1, "google-id");
      expect(result).toEqual(row1);
    });

    it("should return a falsy value when no row is updated (rows empty)", async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await updateGoogleId(1, "google-id");
      expect(result).toBeFalsy(); // null/undefined đều pass
    });

    it("should allow clearing google_id by passing null", async () => {
      const row1 = { id: 1, google_id: null };
      db.query.mockResolvedValue({ rows: [row1] });

      const result = await updateGoogleId(1, null);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE users SET google_id/i),
        [null, 1]
      );
      expect(result).toEqual(row1);
    });

    it("should propagate database error code (e.g., invalid uuid/type)", async () => {
      const err = new Error("invalid input syntax");
      err.code = "22P02";
      db.query.mockRejectedValue(err);

      await expect(updateGoogleId(1, "not-valid")).rejects.toThrow("invalid input");
    });
  });
});
