# Local Development Setup

## Quick Start

### Terminal 1: Run the Backend
```bash
cd /Users/turphai/Projects/tdmDaily/w1-resolution/backend
export $(cat .env | xargs)
npm install
npm run dev
```

The backend will start on `http://localhost:3000`

### Terminal 2: Run the Frontend
```bash
cd /Users/turphai/Projects/tdmDaily/w1-resolution/frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## How It Works

- The **frontend** (`localhost:5173`) automatically detects when running locally
- When on `localhost:5173`, it uses the **backend** at `http://localhost:3000`
- When deployed on Vercel, it uses the relative `/api/` paths

## Testing

1. Open http://localhost:5173/w1/ in your browser
2. Type a message in the chat
3. The message should be sent to the backend and you should get a Claude AI response
4. Check the browser console for any errors

## API Endpoints

### GET /api/chat/resolutions/list/all
Returns all active resolutions

### POST /api/chat
Sends a message to Claude and gets a response

## Troubleshooting

If the chat doesn't work:
1. Check that backend is running on port 3000
2. Check browser console for errors
3. Check backend console for logs
4. Make sure `.env` file is loaded (`export $(cat .env | xargs)`)
