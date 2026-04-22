/**
 * server.test.js
 * Unit tests for the Signup API — all DynamoDB calls are mocked.
 * Mirrors the Hangman project's server.test.js pattern.
 */

// ── Silence console output during tests ──────────────────────────────────────
beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

// ── Mock the entire AWS SDK so no real DynamoDB is needed ─────────────────────
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-dynamodb", () => ({
  DynamoDBClient: jest.fn().mockImplementation(() => ({ send: mockSend })),
  CreateTableCommand: jest.fn(),
  DescribeTableCommand: jest.fn(),
}));

jest.mock("@aws-sdk/lib-dynamodb", () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({ send: mockSend }),
  },
  PutCommand: jest.fn(),
  ScanCommand: jest.fn(),
  QueryCommand: jest.fn(),
  GetCommand: jest.fn(),
  DeleteCommand: jest.fn(),
}));

// ── Speed up the artificial POST delay ───────────────────────────────────────
process.env.POST_DELAY_MS = "0";
process.env.AWS_REGION = "us-east-1";
process.env.AWS_ACCESS_KEY_ID = "local";
process.env.AWS_SECRET_ACCESS_KEY = "local";
process.env.DYNAMO_ENDPOINT = "http://localhost:8000";

// ── Import app after mocks are in place ──────────────────────────────────────
const request = require("supertest");

// server.js calls start() on import which tries DynamoDB — mock that out
mockSend.mockResolvedValue({}); // DescribeTableCommand succeeds → no create needed

const app = require("./server");

// ── Sample data ───────────────────────────────────────────────────────────────
const sampleSignup = {
  id: "test-id-123",
  name: "Ada Lovelace",
  email: "ada@example.com",
  phone: "4045550101",
  category: "Colors",
  createdAt: "2024-06-01T12:00:00.000Z",
};

// Reset mocks between tests
beforeEach(() => mockSend.mockReset());

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signups
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/signups", () => {
  test("200 — returns all signups sorted newest first", async () => {
    const older = { ...sampleSignup, id: "1", createdAt: "2024-01-01T00:00:00Z" };
    const newer = { ...sampleSignup, id: "2", createdAt: "2024-12-01T00:00:00Z" };
    mockSend.mockResolvedValueOnce({ Items: [older, newer] });

    const res = await request(app).get("/api/signups");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].id).toBe("2"); // newest first
  });

  test("200 — returns empty array when table is empty", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const res = await request(app).get("/api/signups");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("500 — returns error when DynamoDB scan fails", async () => {
    mockSend.mockRejectedValueOnce(new Error("DynamoDB unavailable"));

    const res = await request(app).get("/api/signups");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signups/category/:category  (GSI query)
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/signups/category/:category", () => {
  test("200 — returns items matching category via GSI", async () => {
    const colorItems = [
      { ...sampleSignup, id: "c1" },
      { ...sampleSignup, id: "c2" },
    ];
    mockSend.mockResolvedValueOnce({ Items: colorItems });

    const res = await request(app).get("/api/signups/category/Colors");

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].category).toBe("Colors");
  });

  test("200 — returns empty array when no items in category", async () => {
    mockSend.mockResolvedValueOnce({ Items: [] });

    const res = await request(app).get("/api/signups/category/UnknownCategory");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test("500 — returns error on DynamoDB query failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("GSI query failed"));

    const res = await request(app).get("/api/signups/category/Colors");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/signups/:id
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/signups/:id", () => {
  test("200 — returns signup when found", async () => {
    mockSend.mockResolvedValueOnce({ Item: sampleSignup });

    const res = await request(app).get("/api/signups/test-id-123");

    expect(res.status).toBe(200);
    expect(res.body.id).toBe("test-id-123");
    expect(res.body.name).toBe("Ada Lovelace");
  });

  test("404 — returns not found when item does not exist", async () => {
    mockSend.mockResolvedValueOnce({ Item: undefined });

    const res = await request(app).get("/api/signups/nonexistent-id");

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  test("500 — returns error on DynamoDB failure", async () => {
    mockSend.mockRejectedValueOnce(new Error("DB read error"));

    const res = await request(app).get("/api/signups/test-id-123");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/signups
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/signups", () => {
  const validBody = {
    name: "Grace Hopper",
    email: "grace@navy.mil",
    phone: "2025550199",
    category: "Colors",
    favoriteColor: "Navy Blue",
  };

  test("201 — creates and returns new signup", async () => {
    mockSend.mockResolvedValueOnce({}); // PutCommand succeeds

    const res = await request(app).post("/api/signups").send(validBody);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      name: "Grace Hopper",
      email: "grace@navy.mil",
      phone: "2025550199",
      category: "Colors",
      favoriteColor: "Navy Blue",
    });
    expect(res.body.id).toBeDefined();
    expect(res.body.createdAt).toBeDefined();
  });

  test("400 — rejects invalid category", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ name: "Test", email: "t@t.com", phone: "1234567890", category: "NFL Teams" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("400 — rejects when follow-up field is missing for category", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ name: "Test", email: "t@t.com", phone: "1234567890", category: "Colors" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("400 — rejects when name is missing", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ email: "x@x.com", phone: "1234567890", category: "Colors" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  test("400 — rejects when email is missing", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ name: "Test", phone: "1234567890", category: "Colors" });

    expect(res.status).toBe(400);
  });

  test("400 — rejects when phone is missing", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ name: "Test", email: "t@t.com", category: "Colors" });

    expect(res.status).toBe(400);
  });

  test("400 — rejects when category is missing", async () => {
    const res = await request(app)
      .post("/api/signups")
      .send({ name: "Test", email: "t@t.com", phone: "1234567890" });

    expect(res.status).toBe(400);
  });

  test("400 — rejects empty body", async () => {
    const res = await request(app).post("/api/signups").send({});

    expect(res.status).toBe(400);
  });

  test("500 — returns error when DynamoDB put fails", async () => {
    mockSend.mockRejectedValueOnce(new Error("Write failed"));

    const res = await request(app).post("/api/signups").send(validBody); // validBody has all required fields incl. favoriteColor

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/signups/:id
// ─────────────────────────────────────────────────────────────────────────────
describe("DELETE /api/signups/:id", () => {
  test("200 — returns success message on delete", async () => {
    mockSend.mockResolvedValueOnce({});

    const res = await request(app).delete("/api/signups/test-id-123");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  test("500 — returns error when DynamoDB delete fails", async () => {
    mockSend.mockRejectedValueOnce(new Error("Delete failed"));

    const res = await request(app).delete("/api/signups/test-id-123");

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /health
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /health", () => {
  test("200 — returns ok status", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});
