# Signup App — CS418 Assignment

Controlled form with real-time validation, DynamoDB persistence, and Docker containerization.

## Project Structure

```
signup-app/
├── backend/                 ← Express API (mirrors Hangman's backend/)
│   ├── server.js            ← Main server (all routes in one file like Hangman)
│   ├── server.test.js       ← Unit tests (requirement #6)
│   ├── package.json
│   └── Dockerfile
├── src/                     ← Vite React frontend (mirrors Hangman's src/)
│   ├── api/
│   │   └── api.jsx          ← API service layer
│   ├── components/
│   │   ├── SignupForm.jsx   ← Controlled form + validation (req #1, #2, #3)
│   │   └── SignupList.jsx   ← List + category filter (req #5)
│   ├── App.jsx              ← useEffect fetch + _saveStatus (req #4)
│   ├── index.css
│   └── main.jsx
├── docker-compose.yml       ← 4 containers: dynamo, dynamo-admin, backend, ui
├── Dockerfile               ← UI container (nginx)
├── nginx.conf
├── index.html
├── vite.config.js
└── package.json
```

## Running with Docker

```bash
docker-compose up --build
```

| Service       | URL                        |
|---------------|----------------------------|
| UI            | http://localhost:5173       |
| API           | http://localhost:3001       |
| DynamoDB      | http://localhost:8000       |
| Dynamo Admin  | http://localhost:8001       |

## Local Development (without Docker)

**Terminal 1 — DynamoDB Local:**
```bash
docker-compose up dynamo dynamo-admin
```

**Terminal 2 — Backend:**
```bash
cd backend
npm install
npm run dev
```

**Terminal 3 — Frontend:**
```bash
npm install
npm run dev
# Open http://localhost:5173
```

## Running Tests

```bash
cd backend
npm install
npm test
```

## Requirements Met

| # | Requirement | Implementation |
|---|---|---|
| 1 | Controlled form with `fields` state object | `SignupForm.jsx` — `useState(INITIAL_FIELDS)` with name, email, phone, category |
| 2 | Real-time `fieldErrors` validation in red | `validateField()` called on every `onChange` + `onBlur`, errors shown in `.error-msg` |
| 3 | Submit disabled until form valid | `validate()` function gates the button; `disabled={!isFormValid}` |
| 4 | `useEffect` fetch on mount + `_saveStatus` | `App.jsx` useEffect + `SAVE_STATUS` (READY/SAVING/SUCCESS/ERROR); 5s POST delay |
| 5 | Filter by Category using GSI | `GET /api/signups/category/:category` queries `CategoryIndex` GSI; dropdown in `SignupList` |
| 6 | Unit tests for API | `backend/server.test.js` — 16 tests covering all routes with DynamoDB mocked |

## 5 Categories

- Colors
- NFL Teams  
- College Teams
- Pizza Toppings
- Video Game Genres

## DynamoDB GSI

The `Signups` table has a **Global Secondary Index** named `CategoryIndex`:
- **Partition key**: `category` (String)
- **Sort key**: `createdAt` (String, ISO format — sorts newest first with `ScanIndexForward: false`)
- **Projection**: ALL

This enables efficient category filtering without a full table scan.
