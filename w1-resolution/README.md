# Week 1: Resolution Tracker

## Overview
A personal resolution tracker powered by Claude AI that helps you set, monitor, and achieve your goals throughout the year using natural language processing and intelligent feedback.

## Project Structure

```
w1-resolution/
├── frontend/                 # React + Vite application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── utils/           # Utility functions
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   ├── postcss.config.js    # PostCSS configuration
│   ├── tsconfig.json        # TypeScript configuration
│   ├── package.json         # Dependencies
│   └── index.html           # HTML template
│
├── backend/                  # Node.js + Express server
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── services/        # Business logic & AI integration
│   │   ├── middleware/      # Express middleware
│   │   └── server.ts        # Express app setup
│   ├── tsconfig.json        # TypeScript configuration
│   ├── package.json         # Dependencies
│   └── .env.example         # Environment template
│
├── docs/
│   └── projectBrief.md      # Project brief & requirements
│
└── README.md                # This file
```

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Claude API key from https://console.anthropic.com/api/keys

### Installation

1. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Configuration

1. **Backend setup:**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit `.env` and add your `ANTHROPIC_API_KEY`

2. **Frontend setup:**
   ```bash
   cd frontend
   cp .env.example .env
   ```
   The default API URL should work for local development.

### Running the Project

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Server will run on http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
App will run on http://localhost:5173

Open http://localhost:5173 in your browser to start using the tracker!

## Development Guide

### Adding Features

#### Frontend Components
- Place reusable components in `frontend/src/components/`
- Use Lucide icons for UI elements
- Follow shadcn/ui patterns for consistency

#### Backend Routes
- Add new routes in `backend/src/routes/`
- Use the AI service in `backend/src/services/ai.ts` for Claude integration
- All responses should follow REST conventions

#### AI Integration
- Claude API calls are handled in `backend/src/services/ai.ts`
- Modify prompts there to change AI behavior
- Model: `claude-3-5-sonnet-20241022`

## API Reference

### Resolutions

**List all resolutions**
```
GET /api/resolutions
```

**Create a new resolution**
```
POST /api/resolutions
Content-Type: application/json

{
  "title": "Read one book per month"
}
```

**Get resolution details**
```
GET /api/resolutions/:id
```

**Add a progress update**
```
POST /api/resolutions/:id/updates
Content-Type: application/json

{
  "content": "Finished reading chapter 3 this week"
}
```

## Design System

The project uses a modern color palette with:
- **Primary**: Purple (`#9333ea` / `#a855f7`)
- **Background**: Slate dark (`#1e293b`)
- **Accents**: Pink, Blue gradients
- **Typography**: System fonts with anti-aliasing

Tailwind CSS provides utility-first styling with custom theme variables.

## Building for Production

**Frontend:**
```bash
cd frontend
npm run build
```
Output goes to `frontend/dist/`

**Backend:**
```bash
cd backend
npm run build
npm start
```
Compiled JavaScript goes to `backend/dist/`

## Troubleshooting

**API connection issues?**
- Ensure backend is running on port 3000
- Check `VITE_API_BASE_URL` in frontend `.env`
- Verify CORS is enabled in backend

**Claude API errors?**
- Verify API key is correct in `.env`
- Check API quota at https://console.anthropic.com
- Review API error messages in browser console

**Port already in use?**
- Backend: `PORT=3001 npm run dev`
- Frontend: `PORT=5174 npm run dev`

## Next Steps

1. ✅ Explore the current dashboard
2. 🎨 Customize the color scheme (frontend/tailwind.config.js)
3. 🤖 Adjust Claude prompts (backend/src/services/ai.ts)
4. 📦 Add database persistence (replace in-memory storage)
5. 🔐 Add user authentication
6. 📈 Build analytics dashboard
7. 📱 Make it responsive mobile-first

## Resources

- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Claude API Docs](https://docs.anthropic.com)
- [Express.js Guide](https://expressjs.com)

## Questions or Issues?

Refer to the project brief in `docs/projectBrief.md` for requirements and tips.

