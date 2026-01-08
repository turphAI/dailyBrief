# Development Setup Guide

## Environment Variables

This project requires environment variables for API access. They are **never committed to git** for security.

### Local Development Setup

#### Backend

1. Create `backend/.env` file:
```bash
touch backend/.env
```

2. Add your environment variables:
```
NODE_ENV=development
PORT=3000
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

3. Get your ANTHROPIC_API_KEY from: https://console.anthropic.com/account/keys

#### Frontend (Optional)

If you need environment variables for the frontend:

1. Create `frontend/.env` file:
```bash
touch frontend/.env
```

2. Add variables (prefixed with `VITE_` to be exposed to browser):
```
VITE_API_URL=http://localhost:3000
```

### Production (Vercel)

Environment variables are configured directly in Vercel Dashboard:

1. Go to: https://vercel.com/dashboard/project-name/settings/environment-variables
2. Add `ANTHROPIC_API_KEY` with your production key
3. Set environment: Production

**Important:** Never put secrets in code or `.env.example` files!

## Local Development

### Install Dependencies

```bash
# Install all dependencies
npm install
cd frontend && npm install && cd ..
cd backend && npm install && cd ..
```

### Run Development Server

```bash
# Start Vercel dev environment (frontend + API functions)
npm run dev
# or manually:
vercel dev --yes
```

This will start:
- Frontend: http://localhost:5174 (or next available port)
- API Functions: /api/* routes
- Hot reload enabled

### Environment Variable Requirements

For the app to work locally:
- `backend/.env` must have `ANTHROPIC_API_KEY` set
- The app will use this to call Claude API

## Troubleshooting

### "ANTHROPIC_API_KEY is not defined"
- Make sure `backend/.env` exists
- Make sure `ANTHROPIC_API_KEY=sk-ant-...` is in the file
- Restart dev server after creating/updating .env

### "Cannot find module"
- Run `npm install` in the directory where you get the error
- Example: `cd backend && npm install`

### Port already in use
- Vercel automatically finds the next available port
- Check the output to see which port it's using
- Or kill the process: `lsof -ti:3000 | xargs kill -9`

## Security Best Practices

✅ **DO:**
- Keep `.env` files in `.gitignore`
- Rotate API keys if they're ever exposed
- Use environment variables for all secrets
- Use Vercel Dashboard for production secrets

❌ **DON'T:**
- Commit `.env` files to git
- Put secrets in code
- Use `.env.example` with real keys
- Share your API keys

## Files to Know

- `backend/.env` - Local backend secrets (git-ignored)
- `frontend/.env` - Local frontend secrets (git-ignored)
- `.gitignore` - Prevents accidental commits of secret files
- `vercel.json` - Vercel deployment configuration
- `package.json` (root) - Monorepo setup for Vercel
