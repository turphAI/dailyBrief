# Vercel Deployment - All-in-One Setup

## Decision: Host Everything on Vercel ✅

**Strategy:** Frontend + Backend both hosted on Vercel with Functions for API routes
- **Frontend:** Vercel Pages (React + Vite)
- **Backend:** Vercel Functions (Express.js routes)
- **Benefits:** Single dashboard, tight integration, automatic scaling, one build pipeline
- **Constraints:** Serverless environment, 12s execution timeout (standard functions)

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│       Your GitHub Repository        │
│   /w1-resolution (monorepo)         │
├─────────────────────────────────────┤
│  ├─ frontend/    (React + Vite)     │
│  ├─ backend/     (Express.js)       │
│  └─ docs/        (Documentation)    │
└─────────────────────────────────────┘
           ↓ Push to GitHub
┌─────────────────────────────────────┐
│         Vercel Dashboard            │
├─────────────────────────────────────┤
│  ├─ Pages: frontend/*               │
│  ├─ Functions: api/*                │
│  └─ Environment Variables           │
└─────────────────────────────────────┘
           ↓ Public URLs
┌─────────────────────────────────────┐
│  your-project.vercel.app            │
│  ├─ /              (React app)       │
│  ├─ /api/chat      (backend function)
│  └─ /api/...       (more functions)  │
└─────────────────────────────────────┘
```

---

## Phase 1: Prepare Project Structure

### Step 1.1: Create Vercel Functions Directory

The backend routes need to be in a special `api/` directory at the root of your project:

```bash
cd /Users/turphai/Projects/dailyBrief/w1-resolution
mkdir -p api/routes
```

### Step 1.2: Migrate Backend Routes to Vercel Functions

Create handler files that wrap Express routes as Vercel Functions:

**File:** `api/chat.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleChatMessage } from '../backend/src/services/chat'

// In-memory storage (reset on deployment)
const conversations = new Map()
const resolutions = new Map()

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body
      // ... chat logic
      res.status(200).json({ response: '...' })
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
```

### Step 1.3: Update Frontend API Calls

Update all API calls to use `/api` prefix:

```typescript
// frontend/src/components/ConversationalInterface.tsx
const API_BASE = '/api'

const response = await fetch(`${API_BASE}/chat`, {
  method: 'POST',
  // ...
})
```

---

## Phase 2: Vercel Dashboard Configuration

### Step 2.1: Set Root Directory

1. Go to **Vercel Dashboard** → Your Project → **Settings**
2. Find **Root Directory** setting
3. Set to: `./w1-resolution` (monorepo root, not frontend)
4. Save

**Why?** Vercel needs to see both `frontend/` and `api/` directories

### Step 2.2: Configure Build Settings

1. Go to **Settings** → **Build & Development Settings**
2. Set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Build Command** | `cd frontend && npm run build` |
| **Output Directory** | `frontend/dist` |
| **Install Command** | `npm install` |

### Step 2.3: Add Environment Variables

1. Go to **Settings** → **Environment Variables**
2. Add these variables:

```
ANTHROPIC_API_KEY = sk-ant-your-actual-key-here
```

**Production Environment:** Set to Production

**Note:** Frontend doesn't need `VITE_API_URL` since API is on same domain

---

## Phase 3: Update Backend Code for Vercel Functions

### Step 3.1: Refactor Services

Your existing `backend/src/services/chat.ts` needs to be reusable:

```typescript
// backend/src/services/chat.ts - Already good!
// Just ensure it exports functions that can be used by both Express and Vercel
export async function handleChatMessage(
  messages: any[],
  resolutions: Map<string, any>
): Promise<{ text: string; toolsUsed: string[] }>
```

### Step 3.2: Create Vercel API Routes

**File:** `api/chat.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { handleChatMessage } from '../backend/src/services/chat'

// Global state (resets on redeploy)
const conversations = new Map<string, any>()
const resolutions = new Map<string, any>()

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method === 'POST') {
    try {
      const { message, conversationId } = req.body
      
      let convId = conversationId || 'default'
      if (!conversations.has(convId)) {
        conversations.set(convId, { messages: [] })
      }

      const conversation = conversations.get(convId)!
      conversation.messages.push({ role: 'user', content: message })

      const response = await handleChatMessage(
        conversation.messages,
        resolutions
      )

      conversation.messages.push({ role: 'assistant', content: response.text })

      const allResolutions = Array.from(resolutions.values()).filter(
        (r) => r.status === 'active'
      )

      res.status(200).json({
        response: response.text,
        conversationId: convId,
        toolsUsed: response.toolsUsed,
        resolutions: allResolutions,
      })
    } catch (error) {
      console.error('Chat error:', error)
      res.status(500).json({ error: 'Failed to process message' })
    }
  }
}
```

**File:** `api/chat/resolutions/list/all.ts`
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node'

const resolutions = new Map<string, any>()

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const allResolutions = Array.from(resolutions.values()).filter(
    (r) => r.status === 'active'
  )
  
  res.status(200).json({ resolutions: allResolutions })
}
```

---

## Phase 4: Update Frontend Code

### Step 4.1: Remove Backend URL Logic

In `frontend/src/components/ConversationalInterface.tsx`:

```typescript
// BEFORE
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const response = await fetch(`${API_BASE}/api/chat`, { ... })

// AFTER
const response = await fetch('/api/chat', { ... })
```

### Step 4.2: Update All API Calls

Find all `fetch()` calls in:
- `frontend/src/components/ConversationalInterface.tsx`
- Any other API-calling files

Change from:
```typescript
`${API_BASE}/api/chat`
```

To:
```typescript
'/api/chat'
```

---

## Phase 5: Local Testing

### Step 5.1: Test Locally with Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# In your project root
cd /Users/turphai/Projects/dailyBrief/w1-resolution

# Run Vercel dev server locally
vercel dev
```

This will:
- Start frontend on `localhost:3000` (or next available)
- Start API functions on `/api/` routes
- Simulate Vercel production environment

### Step 5.2: Test API Calls

In browser console while running `vercel dev`:

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', conversationId: 'test' })
})
.then(r => r.json())
.then(console.log)
```

Should see successful response with chat data.

---

## Phase 6: Deploy to Vercel

### Step 6.1: Push to GitHub

```bash
cd /Users/turphai/Projects/dailyBrief/w1-resolution

# If not already committed
git add -A
git commit -m "feat: Migrate to Vercel Functions for backend API"

# Push
git push origin main
```

### Step 6.2: Verify Deployment

1. Go to **Vercel Dashboard**
2. Should see new deployment building automatically
3. Wait for build to complete
4. Check **Functions** tab to see deployed functions
5. Visit your production URL: `https://your-project.vercel.app`

### Step 6.3: Test Production

In browser console at production URL:

```javascript
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello', conversationId: 'prod' })
})
.then(r => r.json())
.then(console.log)
```

Should work exactly like local testing.

---

## Important Considerations

### ⚠️ State Management

**Vercel Functions are stateless!** This means:
- In-memory storage (Maps) will NOT persist between requests
- Each function invocation is independent
- State resets on deployment or during scaling

**Solution for Production:**
- Use a database (Vercel KV, MongoDB, PostgreSQL)
- Or Redis for session storage
- Or Upstash KV (serverless Redis)

### ⚠️ Function Timeout

- Standard Vercel functions: 12 second timeout
- Pro plan: Up to 60 seconds
- Keep API responses fast

### ⚠️ Cold Starts

- First request to a function is slower (cold start)
- Subsequent requests are faster
- Consider upgrading to Pro for lower latency

### ⚠️ Data Persistence

Current implementation uses in-memory storage. For production:

**Option A: Vercel KV (Recommended)**
```bash
vercel env add KV_URL
vercel env add KV_REST_API_URL
vercel env add KV_REST_API_TOKEN
```

**Option B: MongoDB Atlas**
- Free tier available
- Add connection string as env var
- Update services to use MongoDB instead of Maps

**Option C: Upstash KV**
- Serverless Redis
- Great for session/conversation storage

---

## Deployment Checklist

### Before Deploying

- [ ] Root directory set to `./w1-resolution`
- [ ] Build command: `cd frontend && npm run build`
- [ ] Output directory: `frontend/dist`
- [ ] `ANTHROPIC_API_KEY` environment variable added
- [ ] All API calls use `/api/*` paths
- [ ] Tested locally with `vercel dev`
- [ ] No hardcoded localhost URLs

### After Deploying

- [ ] Visit production URL
- [ ] Test chat functionality
- [ ] Check browser console for errors
- [ ] Check Vercel Functions tab for logs
- [ ] Verify resolutions are displaying
- [ ] Test on mobile if possible

---

## File Structure After Setup

```
/w1-resolution/
├─ api/                          ← NEW: Vercel Functions
│  ├─ chat.ts                    ← POST /api/chat handler
│  └─ chat/
│     └─ resolutions/
│        └─ list/
│           └─ all.ts            ← GET /api/chat/resolutions/list/all
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  └─ ConversationalInterface.tsx (updated: /api/*)
│  │  └─ ...
│  └─ dist/                       ← Built site here
├─ backend/
│  ├─ src/
│  │  ├─ services/
│  │  │  └─ chat.ts              ← Used by Vercel Functions
│  │  └─ ...
│  └─ ...
├─ docs/
└─ vercel.json                    ← NEW: Vercel config (optional)
```

---

## Optional: Create vercel.json

At project root to customize Vercel behavior:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/dist",
  "env": {
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  },
  "functions": {
    "api/**/*.ts": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## Troubleshooting

### Build Fails: "Cannot find module"

**Cause:** Import paths may be wrong in Vercel environment

**Fix:**
```bash
vercel dev
# Check console for exact error
# Fix imports in api/*.ts files
```

### API Returns 404

**Cause:** Function file not in correct path

**File structure must be:**
```
api/
├─ chat.ts          → /api/chat
├─ chat/
│  └─ resolutions/
│     └─ list/
│        └─ all.ts  → /api/chat/resolutions/list/all
```

### Frontend Can't Reach API

**Check:**
- Using `/api/*` paths? (not `http://localhost:3000/api/*`)
- CORS headers present in function?
- Function deployed and visible in Vercel dashboard?

---

## Next Steps

1. **Phase 1:** Create `api/` directory structure
2. **Phase 2:** Configure Vercel dashboard
3. **Phase 3:** Update backend code for Functions
4. **Phase 4:** Update frontend API calls
5. **Phase 5:** Test locally with `vercel dev`
6. **Phase 6:** Deploy to Vercel
7. **Phase 7:** Consider database for persistent storage

---

## Resources

- [Vercel Functions Documentation](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Vercel KV Storage](https://vercel.com/docs/storage/vercel-kv)
- [Vercel CLI Reference](https://vercel.com/docs/cli)

---

**Last Updated:** January 2026  
**Decision:** All-in-One Vercel Deployment ✅  
**Status:** Ready for Implementation
