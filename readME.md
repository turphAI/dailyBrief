# AI Daily Brief - 10 Week Program
This project contains solutions for the 10-week course run by the AI Daily Brief. Learn more at https://aidbnewyear.com/program

## 📋 Project Structure

Each week has its own directory containing the complete project for that lesson:
```
dailyBrief/
├── w1-resolution/          # Week 1: Resolution Tracker
│   ├── frontend/           # React + Tailwind + shadcn/ui
│   ├── backend/            # Node.js + Express
│   ├── docs/               # Project documentation
│   └── config/             # Shared configuration
├── w2-*/                   # Week 2 (coming soon)
└── ...
```

## 🚀 Week 1: Resolution Tracker

A personal resolution tracker powered by Claude AI for intelligent feedback and progress monitoring.

### Features
- ✨ Set and manage resolutions with natural language
- 🤖 AI-powered analysis and feedback using Claude
- 📊 Track progress with sentiment analysis
- 🎯 Goal categorization and prioritization
- 🔄 Automated check-in prompts

### Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **UI Components**: shadcn/ui + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Express + TypeScript
- **AI Integration**: Claude API (Anthropic)

### Quick Start

#### Prerequisites
- Node.js 18+
- npm or yarn
- Claude API key from https://console.anthropic.com

#### Setup

1. **Clone and navigate to week 1:**
   ```bash
   cd w1-resolution
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env and add your ANTHROPIC_API_KEY
   npm run dev
   ```
   Server runs on http://localhost:3000

3. **Frontend Setup (in a new terminal):**
   ```bash
   cd w1-resolution/frontend
   npm install
   npm run dev
   ```
   App runs on http://localhost:5173

4. **Start building!**
   - Frontend code: `frontend/src/`
   - Backend code: `backend/src/`
   - API routes: `backend/src/routes/`
   - AI service: `backend/src/services/ai.ts`

### API Endpoints

- `GET /api/health` - Health check
- `GET /api/resolutions` - List all resolutions
- `POST /api/resolutions` - Create a new resolution
- `GET /api/resolutions/:id` - Get resolution details
- `POST /api/resolutions/:id/updates` - Add progress update

### Project Briefs

Each week includes a unique project brief describing the specific requirements and goals. See the `docs/projectBrief.md` file for each week's details.
