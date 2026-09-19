# Pulse - live polling tool

Pulse is a live polling tool built for the GUVI developer task.

## Stack

- React + Vite frontend
- Go + Gin API
- MongoDB for users, polls, and durable vote records
- Redis for atomic vote counts, duplicate-voter keys, and Pub/Sub events
- Server-Sent Events (SSE) for refresh-free result updates

## Run locally

### Backend

Create `backend/.env` from the example below and use credentials from your own services:

```env
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/?retryWrites=true&w=majority
MONGODB_DATABASE=live_polling
REDIS_ADDR=localhost:6379
REDIS_PASSWORD=
JWT_SECRET=replace-with-a-long-random-secret
FRONTEND_URL=http://localhost:5173
PORT=8080
```

Then:

```powershell
cd backend
go mod tidy
go run main.go
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses `http://localhost:8080/api` by default. For deployment, set `VITE_API_URL` to the deployed API URL ending in `/api`.

## Product flow

1. Sign up or sign in. Only authenticated users can create a poll.
2. Add a question and 2-6 unique answer options.
3. Launch the poll. The browser URL becomes `/poll/<id>` and can be shared.
4. Audience members open the shared URL without an account and submit one vote per browser identity.
5. Redis increments the live count and publishes an event. Every open poll page receives the event over SSE and updates immediately.
6. MongoDB stores the poll, user, and vote for durable records.

## API surface

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/polls` (Bearer token required)
- `GET /api/polls/:id`
- `POST /api/polls/:id/vote`
- `GET /api/polls/:id/stream` (SSE)
- `GET /api/health`

## Deployment

Deploy the Go service to Render, Railway, Fly.io, or an equivalent Go host with MongoDB Atlas and Redis Cloud credentials. Deploy `frontend` to Vercel, Netlify, or equivalent static hosting with `VITE_API_URL` configured. The static host must support SPA fallback to `index.html` so shared `/poll/<id>` links load directly.

Before submission, rotate any database or Redis credentials that were used locally, publish the repository, verify the public frontend and API URLs, and record the required 3-5 minute walkthrough video. The video should explain the hardest technical challenge, the live Redis/SSE flow, and any AI tools used.

## Verification

```powershell
cd backend; go test ./...
cd ../frontend; npm run lint; npm run build
```
