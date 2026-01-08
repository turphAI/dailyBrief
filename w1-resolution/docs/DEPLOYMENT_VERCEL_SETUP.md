# Vercel Deployment Setup Guide

## Overview

You have a monorepo with:
- **Frontend**: React + Vite (in `/frontend`)
- **Backend**: Express.js (in `/backend`)

Vercel can host both with proper configuration.

## Deployment Strategy Options

### Option 1: Deploy Frontend + Backend Together (Recommended for Vercel)
- Deploy frontend to Vercel (main domain)
- Deploy backend as Vercel Functions OR separate service
- **Pro**: Everything in one place
- **Con**: Backend needs to work within Vercel constraints

### Option 2: Deploy Frontend Only to Vercel
- Deploy React frontend to Vercel
- Keep backend on separate service (Railway, Render, Heroku, etc.)
- **Pro**: More flexibility for backend
- **Con**: Multiple services to manage

### Option 3: Deploy Backend to Vercel Functions
- Use Vercel Functions for API routes
- Serves `/api/*` endpoints
- **Pro**: Seamless integration
- **Con**: Serverless constraints

---

## RECOMMENDED: Frontend + Backend Separate Services

For your current setup, I recommend:
- **Frontend → Vercel** (what you're configuring now)
- **Backend → Railway/Render** (free tier available)

This gives you the most flexibility.

---

## Vercel Configuration for Frontend

### Step 1: Framework Preset

**Setting:** Framework Preset
**Current Value:** Other
**Recommended:** Vite (or Other)
**Note:** Vite is available in newer Vercel; if not, use "Other"

### Step 2: Root Directory

**Setting:** Root Directory  
**Current Value:** ./
**Change to:** `./w1-resolution/frontend`

This tells Vercel where your frontend code is in the monorepo.

### Step 3: Build and Output Settings

Click "Build and Output Settings" to expand:

#### Build Command
```
npm run build
```

#### Output Directory
```
dist
```

**Why?** Your `vite.config.ts` outputs to `dist/`

#### Install Command
```
npm install
```

### Step 4: Environment Variables

You'll need to set environment variables for your frontend to communicate with the backend.

**Variables to Add:**

```
VITE_API_URL = https://your-backend-url.com
```

**Or if backend is on same domain:**
```
VITE_API_URL = /api
```

---

## Environment Variables Configuration

In Vercel dashboard, go to **Settings → Environment Variables**

### For Frontend (.env.production)

```env
# API Communication
VITE_API_URL=https://your-backend-api.vercel.app
# or for relative URLs:
# VITE_API_URL=/api

# Optional: API Key if needed
VITE_API_KEY=your_key_here
```

### In Your Code

Update `ConversationalInterface.tsx` and other API calls:

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const response = await fetch(`${API_BASE}/api/chat`, {
  method: 'POST',
  // ...
})
```

---

## Backend Deployment Options

### Option A: Railway (Recommended)

1. Create account at railway.app
2. Connect GitHub repo
3. Railway auto-detects Node.js project
4. Set root directory to `./w1-resolution/backend`
5. Add environment variables:
   - `NODE_ENV=production`
   - `ANTHROPIC_API_KEY=your_key`
6. Railway generates domain automatically

### Option B: Render

1. Create account at render.com
2. Connect GitHub repo
3. Create Web Service
4. Settings:
   - Root directory: `./w1-resolution/backend`
   - Build command: `npm run build`
   - Start command: `npm run start` (update package.json)
   - Environment: Node 18+

### Option C: Vercel Functions (Advanced)

Create `api/` directory structure for backend routes:

```
frontend/
  public/
  src/
api/
  chat.ts
  resolutions.ts
```

---

## Current File Setup

### Frontend package.json

Located: `w1-resolution/frontend/package.json`

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

✅ Good! Vercel will use `npm run build`

### Backend package.json

Located: `w1-resolution/backend/package.json`

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

✅ Good! Vercel can run both build and start

---

## Step-by-Step Vercel Configuration

### For Frontend Deployment:

1. **In Vercel Dashboard**:
   - Project connected? ✓
   - Click "Settings"

2. **General Settings**:
   - Framework Preset: `Vite`
   - Root Directory: `./w1-resolution/frontend`

3. **Build & Output**:
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

4. **Environment Variables** (Settings → Environment Variables):
   - Key: `VITE_API_URL`
   - Value: `https://your-backend-domain.com` (or will update later)
   - Environments: Production, Preview, Development

5. **Domains**:
   - Vercel auto-assigns: `your-project.vercel.app`
   - Optional: Add custom domain

### For Backend (Choose one):

**If deploying to Railway:**
- Root: `./w1-resolution/backend`
- Node version: 18+
- Add `ANTHROPIC_API_KEY` env var
- Get auto-generated domain

**If deploying to Render:**
- Root: `./w1-resolution/backend`
- Build: `npm run build`
- Start: `npm start`
- Add environment variables
- Get auto-generated domain

---

## Post-Deployment Steps

### 1. Update API URL

Once backend is deployed, update frontend environment variable:

```
VITE_API_URL=https://your-backend.railway.app
```

### 2. CORS Configuration

Update backend `server.ts`:

```typescript
app.use(cors({
  origin: [
    'https://your-frontend.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true
}))
```

### 3. Test Deployment

In browser dev tools:
- Check Network tab for `/api/chat` calls
- Verify responses are coming from correct domain
- Check console for CORS errors

### 4. Environment Variables Summary

**Frontend (Vercel):**
```
VITE_API_URL=https://your-backend.railway.app
```

**Backend (Railway/Render):**
```
NODE_ENV=production
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Troubleshooting

### Issue: Build Fails

**Check:**
- ✓ Root directory correct? `./w1-resolution/frontend`
- ✓ package.json has `build` script?
- ✓ All dependencies installed? (`package-lock.json` present)

**Fix:**
- Run locally: `cd w1-resolution/frontend && npm run build`
- Fix errors before redeploying

### Issue: Frontend Can't Connect to Backend

**Check:**
- ✓ `VITE_API_URL` environment variable set?
- ✓ Backend is deployed and running?
- ✓ CORS enabled on backend?

**Fix:**
- Verify backend domain is correct
- Check browser console for network errors
- Check backend logs for CORS rejection

### Issue: Environment Variables Not Working

**Check:**
- ✓ Env var name matches code: `VITE_API_URL`
- ✓ Prefix is `VITE_` (only exposed vars)?
- ✓ Redeployed after adding var?

**Fix:**
- Redeploy: Vercel → Deployments → Redeploy
- Or: Push new commit to trigger rebuild

---

## Quick Reference

### Vercel Configuration

```
Framework Preset:      Vite (or Other)
Root Directory:        ./w1-resolution/frontend
Build Command:         npm run build
Output Directory:      dist
Install Command:       npm ci
Environment Variable:  VITE_API_URL = [your-backend-url]
```

### Files Modified (None needed for basic deployment!)

The current setup is already deployment-ready. Just need:

1. Environment variable configuration in Vercel
2. Backend deployed separately (Railway/Render)
3. CORS configuration in backend

---

## Next Steps

1. ✅ Frontend root directory: `./w1-resolution/frontend`
2. ✅ Confirm Build/Output settings
3. ⏭️ Deploy frontend to Vercel
4. ⏭️ Deploy backend to Railway/Render
5. ⏭️ Set environment variables
6. ⏭️ Update CORS settings
7. ⏭️ Test deployment

---

**Ready to proceed?** Let me know which option you prefer and I'll walk you through the next steps!
