const express = require("express");
const cors = require("cors");
const {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
} = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  QueryCommand,
  GetCommand,
  DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { v4: uuidv4 } = require("uuid");

// ── App & Config ─────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 3001;
const TABLE_NAME = "Signups";

app.use(cors());
app.use(express.json());

// ── DynamoDB Client ───────────────────────────────────────────────────────────
const rawClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMO_ENDPOINT || "http://localhost:8000",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "local",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "local",
  },
});
const client = DynamoDBDocumentClient.from(rawClient);

// ── Helpers ───────────────────────────────────────────────────────────────────
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ── Table Bootstrap ───────────────────────────────────────────────────────────
async function createTableIfNotExists() {
  try {
    await rawClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`Table "${TABLE_NAME}" already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`Creating table "${TABLE_NAME}"...`);
      await rawClient.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          AttributeDefinitions: [
            { AttributeName: "id", AttributeType: "S" },
            // GSI keys
            { AttributeName: "category", AttributeType: "S" },
            { AttributeName: "createdAt", AttributeType: "S" },
          ],
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          // GSI: query signups by category, sorted by createdAt
          GlobalSecondaryIndexes: [
            {
              IndexName: "CategoryIndex",
              KeySchema: [
                { AttributeName: "category", KeyType: "HASH" },
                { AttributeName: "createdAt", KeyType: "RANGE" },
              ],
              Projection: { ProjectionType: "ALL" },
              ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
              },
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        })
      );
      console.log(`Table "${TABLE_NAME}" created with CategoryIndex GSI.`);
    } else {
      throw err;
    }
  }
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORY_FOLLOWUP = {
  "Sports Teams": ["favoriteSport", "sportsTeam"],
  "Colors": ["favoriteColor"],
  "Pizza Toppings": ["favoritePizzaTopping"],
  "Video Games": ["favoriteVideoGameGenre", "favoriteVideoGame"],
};

// ── Routes ────────────────────────────────────────────────────────────────────

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

// GET /api/signups — all signups (newest first)
app.get("/api/signups", async (req, res) => {
  try {
    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME }));
    const items = (result.Items || []).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
    res.json(items);
  } catch (err) {
    console.error("GET /api/signups error:", err);
    res.status(500).json({ error: "Failed to fetch signups" });
  }
});

// GET /api/signups/category/:category — query via GSI (requirement #5)
app.get("/api/signups/category/:category", async (req, res) => {
  const { category } = req.params;
  try {
    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "CategoryIndex",
        KeyConditionExpression: "category = :cat",
        ExpressionAttributeValues: { ":cat": category },
        ScanIndexForward: false, // newest first via sort key
      })
    );
    res.json(result.Items || []);
  } catch (err) {
    console.error("GET /api/signups/category error:", err);
    res.status(500).json({ error: "Failed to query by category" });
  }
});

// GET /api/signups/:id — single signup
app.get("/api/signups/:id", async (req, res) => {
  try {
    const result = await client.send(
      new GetCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );
    if (!result.Item) return res.status(404).json({ error: "Not found" });
    res.json(result.Item);
  } catch (err) {
    console.error("GET /api/signups/:id error:", err);
    res.status(500).json({ error: "Failed to fetch signup" });
  }
});

// POST /api/signups — create signup with 5-sec delay (requirement #4)
app.post("/api/signups", async (req, res) => {
  const { name, email, phone, category } = req.body;

  if (!name || !email || !phone || !category) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const followupKeys = CATEGORY_FOLLOWUP[category];
  if (!followupKeys) {
    return res.status(400).json({ error: "Invalid category" });
  }

  const missingFollowup = followupKeys.filter((key) => !req.body[key]);
  if (missingFollowup.length > 0) {
    return res.status(400).json({ error: "All fields are required" });
  }

  // Artificial delay to demonstrate SAVING state in the UI
  const delayMs =
    process.env.POST_DELAY_MS !== undefined
      ? parseInt(process.env.POST_DELAY_MS)
      : 5000;
  await delay(delayMs);

  const item = {
    id: uuidv4(),
    name,
    email,
    phone,
    category,
    createdAt: new Date().toISOString(),
  };
  followupKeys.forEach((key) => { item[key] = req.body[key]; });

  try {
    await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    res.status(201).json(item);
  } catch (err) {
    console.error("POST /api/signups error:", err);
    res.status(500).json({ error: "Failed to save signup" });
  }
});

// DELETE /api/signups/:id
app.delete("/api/signups/:id", async (req, res) => {
  try {
    await client.send(
      new DeleteCommand({ TableName: TABLE_NAME, Key: { id: req.params.id } })
    );
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE /api/signups/:id error:", err);
    res.status(500).json({ error: "Failed to delete signup" });
  }
});

// ── Server Start ──────────────────────────────────────────────────────────────
async function start() {
  let retries = 10;
  while (retries > 0) {
    try {
      await createTableIfNotExists();
      break;
    } catch (err) {
      console.log(`DynamoDB not ready, retrying... (${retries} attempts left)`);
      retries--;
      await delay(2000);
    }
  }
  app.listen(PORT, () => {
    console.log(`🚀 Signup API running on http://localhost:${PORT}`);
  });
}

start();

module.exports = app; // exported for tests