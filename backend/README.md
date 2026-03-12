# Habit Tracker Backend

A Node.js + Express backend with SQLite database for the Habit Tracker app.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
The `.env` file is already set up with default values. For production, change the `JWT_SECRET`:
```
PORT=3000
JWT_SECRET=your_secret_key_change_this_in_production
NODE_ENV=development
DB_PATH=./habit_tracker.db
```

### 3. Start the server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on `http://localhost:3000`

## API Endpoints

### Authentication

**POST /api/auth/signup**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Returns: `{ userId, email, token }`

**POST /api/auth/login**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
Returns: `{ userId, email, token }`

### Habits

All habit endpoints require the `Authorization: Bearer <token>` header.

**POST /api/habits** - Create habit
```json
{
  "name": "Exercise",
  "color": "#3b82f6",
  "frequency": "daily",
  "scheduledDays": [1, 3, 5],
  "showInCalendar": true
}
```

**GET /api/habits** - Get all habits

**GET /api/habits/:id** - Get single habit

**PUT /api/habits/:id** - Update habit
```json
{
  "name": "Updated name",
  "color": "#ff5555",
  "frequency": "specific",
  "scheduledDays": [0, 2, 4, 6],
  "showInCalendar": false
}
```

**DELETE /api/habits/:id** - Delete habit

### Completions

All completion endpoints require the `Authorization: Bearer <token>` header.

**POST /api/completions/complete** - Mark habit as complete
```json
{
  "habitId": 1,
  "date": "2025-03-12"
}
```

**POST /api/completions/uncomplete** - Unmark habit
```json
{
  "habitId": 1,
  "date": "2025-03-12"
}
```

**GET /api/completions/date/:date** - Get completions for a date
Returns: `{ date, completedHabitIds: [1, 2, 3] }`

**GET /api/completions/range?startDate=2025-03-01&endDate=2025-03-31** - Get completions for date range

**GET /api/completions/history/summary** - Get 90-day history summary

## Database Schema

### users
- `id` (PK)
- `email` (UNIQUE)
- `password` (hashed)
- `created_at`

### habits
- `id` (PK)
- `user_id` (FK)
- `name`
- `color`
- `frequency` (once, daily, specific)
- `show_in_calendar`
- `created_at`

### habit_scheduled_days
- `id` (PK)
- `habit_id` (FK)
- `day_of_week` (0-6)

### habit_completions
- `id` (PK)
- `user_id` (FK)
- `habit_id` (FK)
- `completed_date`
- `created_at`

### daily_summaries
- `id` (PK)
- `user_id` (FK)
- `date`
- `total_habits`
- `completed_habits`

## Next Steps

1. Update your frontend to connect to this backend
2. Store the JWT token in localStorage
3. Include the token in Authorization headers for all API requests
4. Update data calls to use the API instead of localStorage
