# FitTrack AI — Backend API

> An AI-powered fitness tracking platform built with Node.js, Express, MongoDB, and Google Gemini AI.

---

## 📋 Project Overview

FitTrack AI is a production-ready RESTful API that allows users to:

- Register and authenticate securely with JWT
- Log and manage workouts (full CRUD)
- Search and filter workout history
- View comprehensive workout statistics (via MongoDB aggregation)
- Get AI-powered workout recommendations tailored to age, fitness goal, and experience
- Receive AI-generated fitness insights based on their tracked progress

All data is persisted in **MongoDB** using **Mongoose**. AI features are powered by **Google Gemini**.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | HTTP framework & routing |
| MongoDB | Primary database |
| Mongoose | MongoDB ODM & schema validation |
| JWT (jsonwebtoken) | Authentication tokens |
| bcryptjs | Password hashing |
| dotenv | Environment variable management |
| Google Gemini (`@google/genai`) | AI recommendations & insights |
| cors | Cross-origin resource sharing |
| morgan | HTTP request logging |
| nodemon | Development auto-restart |

---

## ✅ Requirements

- **Node.js** v18 or higher
- **MongoDB** running locally (v6+)
- **Google Gemini API key** (optional — AI endpoints gracefully degrade without it)

---

## 🚀 Installation

### 1. Clone / navigate to the project

```bash
cd fittrack
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/aifittrack
JWT_SECRET=your_long_random_secret_here
JWT_EXPIRES_IN=7d
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
```

> **Never commit `.env` to version control.** It is already included in `.gitignore`.

---

## 🍃 MongoDB Setup

### Option A — MongoDB Community Server (Local)

1. Download MongoDB from [mongodb.com/try/download/community](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. Verify it is running:

```bash
mongosh
```

The `aifittrack` database will be **automatically created** by Mongoose when the first document is inserted.

### Option B — Check if MongoDB is already running

```bash
# Windows
Get-Service -Name MongoDB

# Check connection
mongosh --eval "db.adminCommand('ping')"
```

---

## ▶️ Start the Server

### Development (with auto-restart)

```bash
npm run dev
```

Expected output:

```
MongoDB connected successfully: 127.0.0.1
Server running on port 5000
Environment: development
API URL: http://localhost:5000
```

### Production

```bash
npm start
```

---

## 🌐 API Endpoints

### Base URL

```
http://localhost:5000
```

---

### Health

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | Public | API info |
| GET | `/api/health` | Public | Health check |

---

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get token |
| GET | `/api/auth/profile` | 🔒 Bearer | Get user profile |
| PUT | `/api/auth/profile` | 🔒 Bearer | Update profile |

**Register / Login request body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123"
}
```

**Login response:**

```json
{
  "success": true,
  "message": "Login successful",
  "token": "<JWT>",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

---

### Workouts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/workouts` | 🔒 Bearer | Create workout |
| GET | `/api/workouts` | 🔒 Bearer | List workouts (paginated) |
| GET | `/api/workouts/stats` | 🔒 Bearer | Workout statistics |
| GET | `/api/workouts/search` | 🔒 Bearer | Search workouts |
| GET | `/api/workouts/:id` | 🔒 Bearer | Get single workout |
| PUT | `/api/workouts/:id` | 🔒 Bearer | Update workout |
| DELETE | `/api/workouts/:id` | 🔒 Bearer | Delete workout |

**Create/Update workout body:**

```json
{
  "workoutName": "Morning Run",
  "category": "Cardio",
  "duration": 30,
  "caloriesBurned": 300,
  "workoutDate": "2026-09-28"
}
```

**Supported categories:** `Strength`, `Cardio`, `Flexibility`, `HIIT`, `Yoga`, `Sports`, `Running`, `Cycling`, `Walking`, `Other`

**Pagination:**

```
GET /api/workouts?page=1&limit=20
```

**Search parameters:**

```
GET /api/workouts/search?name=running
GET /api/workouts/search?category=Cardio
GET /api/workouts/search?date=2026-09-28
GET /api/workouts/search?from=2026-09-01&to=2026-09-28
```

---

### AI Features

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/recommendation` | 🔒 Bearer | AI workout plan |
| POST | `/api/ai/insights` | 🔒 Bearer | AI fitness insights |

**AI Recommendation body:**

```json
{
  "age": 25,
  "fitnessGoal": "Build muscle",
  "experienceLevel": "Beginner"
}
```

Fitness goals: `Weight Loss`, `Build Muscle`, `Improve Endurance`, `General Fitness`, `Strength`, `Flexibility`

Experience levels: `Beginner`, `Intermediate`, `Advanced`

**AI Insights body:**

```json
{
  "totalWorkouts": 20,
  "averageWorkoutDuration": 35,
  "totalCaloriesBurned": 5000
}
```

---

## 🔐 Authentication

All protected routes require an `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

Tokens are returned on registration and login. Tokens expire after **7 days** (configurable via `JWT_EXPIRES_IN`).

---

## 🤖 AI Setup (Google Gemini)

1. Go to [aistudio.google.com](https://aistudio.google.com/)
2. Create a new API key
3. Add it to `.env`:

```env
GEMINI_API_KEY=your_api_key_here
```

> **If `GEMINI_API_KEY` is missing**, the server still starts normally. AI endpoints return a `503` response explaining the key is not configured — they do NOT crash the server.

---

## 📮 Postman Collection

Import the collection from:

```
postman/FitTrack_AI.postman_collection.json
```

**Collection variables auto-configured:**
- `baseUrl` = `http://localhost:5000`
- `token` — automatically saved after login or register
- `workoutId` — automatically saved after creating a workout

---

## 🏗️ Project Structure

```
fittrack/
├── src/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js  # Register, login, profile
│   │   ├── workoutController.js # Full CRUD + search + stats
│   │   └── aiController.js    # Gemini recommendation & insights
│   ├── middleware/
│   │   ├── auth.js            # JWT protect middleware
│   │   └── errorHandler.js    # Centralized error handling
│   ├── models/
│   │   ├── User.js            # User Mongoose schema
│   │   └── Workout.js         # Workout Mongoose schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── workoutRoutes.js
│   │   ├── aiRoutes.js
│   │   └── index.js
│   ├── services/
│   │   └── geminiService.js   # Google Gemini API integration
│   ├── utils/
│   │   ├── generateToken.js   # JWT generation utility
│   │   └── apiResponse.js     # Consistent response helpers
│   ├── app.js                 # Express app config
│   └── server.js              # Server entry point
├── postman/
│   └── FitTrack_AI.postman_collection.json
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (10 rounds)
- Password field has `select: false` — never returned in queries
- JWT authentication on all protected routes
- User can only access their **own** workouts (ownership enforced server-side)
- User field stripped from update requests (cannot change ownership)
- `.env` excluded from git
- No secrets in API responses
- Proper HTTP status codes (401, 403, 404, 409, etc.)

---

## 🐛 Troubleshooting

### MongoDB connection failed

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Fix:** Ensure MongoDB is running locally.

```powershell
# Windows — start MongoDB service
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

---

### Port already in use

```
Error: listen EADDRINUSE :::5000
```

**Fix:** Kill the process using port 5000:

```powershell
# Find PID
netstat -ano | findstr :5000
# Kill it
taskkill /PID <pid> /F
```

Or change `PORT` in `.env`.

---

### Invalid JWT / 401 Unauthorized

- Make sure you include `Authorization: Bearer <token>` in the header
- Token may have expired — login again to get a fresh token
- Verify `JWT_SECRET` in `.env` is consistent

---

### Gemini API not configured

```json
{ "success": false, "message": "Gemini API is not configured..." }
```

**Fix:** Add your `GEMINI_API_KEY` to `.env`. Get one free at [aistudio.google.com](https://aistudio.google.com/).

---

### Module not found

```
Error: Cannot find module '...'
```

**Fix:**

```bash
npm install
```

---

### Validation errors

```json
{ "success": false, "message": "Duration must be at least 1 minute" }
```

Check your request body for invalid values (negative duration, invalid category, missing required fields).
