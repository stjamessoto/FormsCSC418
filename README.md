# Signup App — CS418

A full-stack signup form with real-time validation, DynamoDB persistence, and Docker.

---

## Prerequisites

Before you start, make sure you have these installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
- [Git](https://git-scm.com/)
- A code editor like [VS Code](https://code.visualstudio.com/)

---

## Step 1 — Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/stjamessoto/FormsCSC418.git
```

Then navigate into the project folder:

```bash
cd FormsCSC418
```

---

## Step 2 — Open in VS Code

```bash
code .
```

Your project structure should look like this:

```
FormsCSC418/
├── backend/
│   ├── server.js
│   ├── server.test.js
│   ├── package.json
│   └── Dockerfile
├── src/
│   ├── api/
│   │   └── api.jsx
│   ├── components/
│   │   ├── SignupForm.jsx
│   │   └── SignupList.jsx
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
├── index.html
├── vite.config.js
└── package.json
```

---

## Step 3 — Install Backend Dependencies

In the VS Code terminal, navigate into the backend folder and install:

```bash
cd backend
npm install
```

Then go back to the project root:

```bash
cd ..
```

> **This step is required to run tests locally.** Docker handles dependencies inside its containers, so you must install them separately on your machine for `npm test` to work.

---

## Step 4 — Install Frontend Dependencies

From the project root, install the frontend packages:

```bash
npm install
```

---

## Step 5 — Make Sure Docker Desktop is Running

Open Docker Desktop and wait until it says **"Engine running"** in the bottom left corner before moving on.

---

## Step 6 — Build and Start All Containers

From the project root, run:

```bash
docker-compose up --build
```

This will spin up 4 containers:

| Container | What it does |
|---|---|
| `signup_dynamo` | Local DynamoDB database |
| `signup_dynamo_admin` | Visual database browser |
| `signup_backend` | Express API server |
| `signup_ui` | React frontend served by nginx |

> **First run will take a few minutes** — Docker needs to download the base images.
>
> The `signup_dynamo_admin` container installs its package on first start, so `http://localhost:8001` may take an extra 15–30 seconds to become available after the other containers are ready.

---

## Step 7 — Confirm Everything is Running

Watch the terminal output. You should see:

```
signup_backend  | Table "Signups" already exists.
signup_backend  | 🚀 Signup API running on http://localhost:3001
```

Once you see that, everything is up.

---

## Step 8 — Open the App

Open your browser and go to:

| What | URL |
|---|---|
| The App | http://localhost:5173 |
| DynamoDB Admin | http://localhost:8001 |
| API health check | http://localhost:3001/health |
| API (raw) | http://localhost:3001/api/signups |

> **Note:** Visiting `http://localhost:3001` directly shows "Cannot GET /" — this is expected. The backend has no root page; use `/health` or `/api/signups` to test it directly.

---

## Step 9 — Run the Unit Tests

Open a **second terminal** in VS Code (click the `+` button in the terminal panel), then run:

```bash
cd backend
npm test
```

You should see all 21 tests pass:

```
PASS  server.test.js

  GET /api/signups
    ✓ 200 — returns all signups sorted newest first
    ✓ 200 — returns empty array when table is empty
    ✓ 500 — returns error when DynamoDB scan fails

  GET /api/signups/category/:category
    ✓ 200 — returns items matching category via GSI
    ✓ 200 — returns empty array when no items in category
    ✓ 500 — returns error on DynamoDB query failure

  GET /api/signups/:id
    ✓ 200 — returns signup when found
    ✓ 404 — returns not found when item does not exist
    ✓ 500 — returns error on DynamoDB failure

  POST /api/signups
    ✓ 201 — creates and returns new signup
    ✓ 400 — rejects invalid category
    ✓ 400 — rejects when follow-up field is missing for category
    ✓ 400 — rejects when name is missing
    ✓ 400 — rejects when email is missing
    ✓ 400 — rejects when phone is missing
    ✓ 400 — rejects when category is missing
    ✓ 400 — rejects empty body
    ✓ 500 — returns error when DynamoDB put fails

  DELETE /api/signups/:id
    ✓ 200 — returns success message on delete
    ✓ 500 — returns error when DynamoDB delete fails

  GET /health
    ✓ 200 — returns ok status

Tests: 21 passed, 21 total
```

---

## Stopping the App

When you're done, go back to the first terminal and press `Ctrl + C`, then run:

```bash
docker-compose down
```

To also wipe the database and start completely fresh next time:

```bash
docker-compose down -v
```

---

## Useful Commands

```bash
# Start everything (after first build)
docker-compose up

# Rebuild after making code changes
docker-compose up --build

# View logs from all containers
docker-compose logs -f

# View logs from just the backend
docker-compose logs -f backend

# View logs from just the UI
docker-compose logs -f ui

# View logs from the database admin panel
docker-compose logs -f dynamo-admin
```

---

## How the App Works

**Filling out the form:**
- Fill in your name, email, and phone number, then select a category
- Each category shows different follow-up questions:

| Category | Follow-up questions |
|---|---|
| Sports Teams | Favorite Sport, Favorite Sports Team |
| Colors | Favorite Color |
| Pizza Toppings | Favorite Pizza Topping |
| Video Games | Favorite Video Game Genre, Favorite Video Game |

- All fields are required — the Submit button stays disabled until every visible field is valid
- Errors appear in red in real time as you type (after you leave a field)
- Submitting triggers a 5-second save (intentional delay to show the loading state)
- The form only clears after a successful save

**Filtering the list:**
- Use the "Filter by Category" dropdown to filter entries
- Filtered results are fetched directly from DynamoDB using a Global Secondary Index (GSI)

**Viewing the database:**
- Go to http://localhost:8001 to browse the Signups table and see all records
- The database is in-memory — data resets every time you run `docker-compose down`
