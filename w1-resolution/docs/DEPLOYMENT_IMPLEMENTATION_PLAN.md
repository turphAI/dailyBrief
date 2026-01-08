# Vercel Deployment Implementation Plan

## Decision: All-in-One Vercel ✅

**Objective:** Deploy frontend + backend to Vercel using Serverless Functions  
**Timeline:** 5-7 implementation phases  
**Outcome:** Production-ready URL at `https://your-project.vercel.app`

---

## Phase Breakdown

### Phase 1: Project Structure Setup (15 min)
**Goal:** Create Vercel Functions directory structure

**Tasks:**
- [ ] Create `/api` directory at monorepo root
- [ ] Create `/api/routes` for organized endpoints
- [ ] Install Vercel Node types: `npm install --save-dev @vercel/node`

**Commands:**
```bash
cd /Users/turphai/Projects/dailyBrief/w1-resolution
mkdir -p api/chat/resolutions/list
npm install --save-dev @vercel/node
```

**Files to Create:**
- `api/chat.ts` - Main chat endpoint
- `api/chat/resolutions/list/all.ts` - Get all resolutions

---

### Phase 2: Backend Services Refactoring (30 min)
**Goal:** Make backend services work with Vercel Functions

**Current State:**
- `backend/src/services/chat.ts` - Handles chat logic ✅ (already reusable)
- Uses in-memory Map storage ⚠️ (stateless, resets on deploy)
- Tools system in `backend/src/tools/` ✅ (good architecture)

**Tasks:**
- [ ] Verify `handleChatMessage()` is properly exported
- [ ] Check all imports in services are relative paths
- [ ] Ensure no Express.js dependencies in services
- [ ] Test imports work from `/api` directory

**Code to Update:**
```typescript
// backend/src/services/chat.ts
// Already good! Just ensure exports like:
export async function handleChatMessage(
  messages: any[],
  resolutions: Map<string, any>
): Promise<{ text: string; ... }>
```

---

### Phase 3: Create Vercel API Functions (45 min)
**Goal:** Create serverless function handlers

**File 1: `api/chat.ts`**
- POST handler for chat messages
- Include CORS setup
- Initialize in-memory storage
- Call `handleChatMessage()` from backend services

**File 2: `api/chat/resolutions/list/all.ts`**
- GET handler to list all resolutions
- Return active resolutions
- Include CORS headers

**Imports to Copy From Backend:**
- `handleChatMessage` from `backend/src/services/chat`
- Tool types from `backend/src/tools/types`
- Any utility functions

---

### Phase 4: Update Frontend API Calls (20 min)
**Goal:** Point all frontend requests to `/api/*` paths

**Files to Update:**
- [ ] `frontend/src/components/ConversationalInterface.tsx`
  - Change fetch URL from `http://localhost:3000` to `/api/chat`
  - Update resolutions list endpoint

**Search and Replace:**
```typescript
// FIND:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
fetch(`${API_BASE}/api/chat`, ...)

// REPLACE:
fetch('/api/chat', ...)
```

**Verification:**
- No hardcoded localhost URLs remain
- All API calls use `/api/*` paths
- Environment variables removed (not needed for Vercel)

---

### Phase 5: Local Testing with Vercel CLI (30 min)
**Goal:** Test full stack locally before production

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to project root
cd /Users/turphai/Projects/dailyBrief/w1-resolution

# Install project dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Start Vercel dev server
vercel dev
```

**Testing Checklist:**
- [ ] Frontend loads at http://localhost:3000
- [ ] Can type messages in conversational interface
- [ ] Messages send to `/api/chat` successfully
- [ ] Responses display correctly
- [ ] Resolutions update in structured interface
- [ ] No console errors
- [ ] CORS works (no 403 errors)

**Test Commands in Browser Console:**
```javascript
// Test API directly
fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    message: 'Test message', 
    conversationId: 'test-123' 
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

---

### Phase 6: Vercel Dashboard Configuration (15 min)
**Goal:** Configure Vercel for deployment

**Settings to Update:**

1. **Settings → General**
   - Root Directory: `./w1-resolution` ✅

2. **Settings → Build & Development Settings**
   - Framework Preset: `Vite`
   - Build Command: `cd frontend && npm run build`
   - Output Directory: `frontend/dist`
   - Install Command: `npm install`

3. **Settings → Environment Variables**
   - Add: `ANTHROPIC_API_KEY`
   - Value: `sk-ant-...` (your actual key)
   - Environment: Production

**Verification:**
- [ ] Settings saved successfully
- [ ] Environment variables visible in dashboard

---

### Phase 7: Deploy and Test Production (20 min)
**Goal:** Deploy to production and verify functionality

**Deployment:**
```bash
cd /Users/turphai/Projects/dailyBrief/w1-resolution

# Commit all changes
git add -A
git commit -m "feat: Migrate backend to Vercel Functions

- Create api/ directory for serverless functions
- Refactor chat endpoint as Vercel Function
- Update frontend API calls to use /api/* paths
- Add Vercel CLI integration for local testing
- Configure environment variables for production"

# Push to GitHub (triggers Vercel deployment)
git push origin main
```

**Post-Deployment Testing:**

1. **Visual Test:**
   - [ ] Visit `https://your-project.vercel.app`
   - [ ] Homepage loads
   - [ ] UI renders correctly

2. **Functionality Test:**
   - [ ] Type message in chat
   - [ ] Click send or press Enter
   - [ ] Message appears in interface
   - [ ] Get response from Claude AI
   - [ ] Resolutions display in structured panel

3. **Console Check:**
   - [ ] No red errors in browser console
   - [ ] Network tab shows `/api/chat` requests
   - [ ] Response status codes are 200-201

4. **Vercel Dashboard Check:**
   - [ ] Functions tab shows deployed functions
   - [ ] Click function → see logs
   - [ ] No error logs in functions

---

## Detailed Implementation Tasks

### Task 1: Create API File Structure

**Location:** `/Users/turphai/Projects/dailyBrief/w1-resolution/`

**Create these files:**

```
api/
├── chat.ts
└── chat/
    └── resolutions/
        └── list/
            └── all.ts
```

**Quick Create:**
```bash
mkdir -p api/chat/resolutions/list/
touch api/chat.ts
touch api/chat/resolutions/list/all.ts
```

---

### Task 2: Fill in api/chat.ts

**Template provided above in DEPLOYMENT_VERCEL_SETUP.md**

**Key Points:**
- Use `VercelRequest` and `VercelResponse` types
- Import `handleChatMessage` from `../backend/src/services/chat`
- Set CORS headers
- Handle OPTIONS requests
- Initialize in-memory storage (will reset on redeploy)
- Return same JSON structure as current backend

---

### Task 3: Fill in api/chat/resolutions/list/all.ts

**Template provided above**

**Key Points:**
- GET request handler
- Access same in-memory resolutions
- Filter for active resolutions
- Return JSON array

---

### Task 4: Update ConversationalInterface.tsx

**File:** `frontend/src/components/ConversationalInterface.tsx`

**Changes Needed:**

1. Remove or update this line:
```typescript
// REMOVE or CHANGE:
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000'
```

2. Find all fetch calls like:
```typescript
// BEFORE:
fetch(`${API_BASE}/api/chat`, {

// AFTER:
fetch('/api/chat', {
```

3. Find the resolutions endpoint:
```typescript
// BEFORE:
fetch(`${API_BASE}/api/chat/resolutions/list/all`, {

// AFTER:
fetch('/api/chat/resolutions/list/all', {
```

---

### Task 5: Install Dependencies

```bash
cd /Users/turphai/Projects/dailyBrief/w1-resolution/frontend
npm install

cd ../backend
npm install

cd ..
npm install --save-dev @vercel/node
```

---

### Task 6: Test Locally

```bash
# Navigate to root
cd /Users/turphai/Projects/dailyBrief/w1-resolution

# Start Vercel dev environment
vercel dev

# Should show:
# ▲ [17:12:03] Ready! Available at http://localhost:3000
# ▲ [17:12:03] API endpoint ready at http://localhost:3000/api
```

---

### Task 7: Commit and Push

```bash
git add -A
git commit -m "feat: Migrate to Vercel Functions for full-stack deployment"
git push origin main
```

---

## Environment Variables

### What Needs to Be Set

**In Vercel Dashboard → Settings → Environment Variables:**

```
ANTHROPIC_API_KEY = sk-ant-...your-key...
```

### What You DON'T Need

```
❌ VITE_API_URL (remove if exists)
❌ VITE_API_KEY (remove if exists)
```

These were for separate deployments. Now everything is on Vercel.

---

## Common Issues & Solutions

### Issue: Build Fails
```
Error: Cannot find module 'backend/src/services/chat'
```

**Solution:**
- Check import paths in `/api/*.ts` files
- Imports should work from api folder to backend folder
- Use relative paths: `../backend/src/services/chat`

---

### Issue: 404 on API Calls
```
GET /api/chat 404 Not Found
```

**Solution:**
- File must be at `api/chat.ts` (not `api/routes/chat.ts`)
- Check Vercel Functions tab for deployed functions
- Function name should appear there

---

### Issue: CORS Errors
```
Access to fetch at '/api/chat' blocked by CORS policy
```

**Solution:**
- Add CORS headers to all functions:
```typescript
res.setHeader('Access-Control-Allow-Origin', '*')
res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
```
- Handle OPTIONS method for preflight requests

---

### Issue: Environment Variable Not Found
```
Error: process.env.ANTHROPIC_API_KEY is undefined
```

**Solution:**
- Added env var in Vercel dashboard?
- Did you redeploy after adding it?
- Try manual redeploy: Vercel Dashboard → Deployments → Redeploy

---

## Rollback Plan

If something breaks in production:

**Option 1: Revert Last Commit**
```bash
git revert HEAD
git push origin main
# Vercel auto-deploys the reverted version
```

**Option 2: Deploy Previous Version**
- Vercel Dashboard → Deployments
- Find previous working deployment
- Click "..." → "Redeploy"

**Option 3: Quick Fix**
- Fix code locally
- Commit
- Push (auto-deploys)

---

## Success Criteria

### Phase Complete When:

✅ Backend services work with Vercel Functions  
✅ Frontend API calls use `/api/*` paths  
✅ Local testing with `vercel dev` succeeds  
✅ Vercel dashboard configured correctly  
✅ Production deployment is successful  
✅ Chat works end-to-end in production  
✅ No console errors in browser  
✅ API functions visible in Vercel dashboard  

---

## Timeline Estimate

- Phase 1 (Setup): 15 min
- Phase 2 (Refactor): 30 min
- Phase 3 (Functions): 45 min
- Phase 4 (Frontend): 20 min
- Phase 5 (Local Test): 30 min
- Phase 6 (Dashboard): 15 min
- Phase 7 (Deploy): 20 min

**Total: ~2.5 hours**

---

## Next Steps

1. Ready? Let's start with **Phase 1: Project Structure Setup**
2. I can guide you through each phase
3. We'll test locally before going to production
4. Then deploy to Vercel with confidence

---

**Document Status:** Ready for Implementation  
**Last Updated:** January 2026
