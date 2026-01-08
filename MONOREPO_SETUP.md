# Monorepo URL Structure Setup - Option 2

## Objective
Convert from `daily-brief-nu.vercel.app` (single project) to:
- `daily-brief-nu.vercel.app/` (landing page)
- `daily-brief-nu.vercel.app/w1/` (w1-resolution)
- `daily-brief-nu.vercel.app/w2/` (w2-something) [future]
- `daily-brief-nu.vercel.app/w3/` (w3-whatever) [future]

## Architecture

### Root Level Changes

**1. Create Root Landing Page**
- New `index/` directory with a simple landing page
- Lists all weeks
- Links to each week's app
- Shows current/active week

**2. Update vercel.json**
- Rewrites `/w1/*` requests to `w1-resolution`
- Rewrites `/w2/*` requests to `w2-something` (when added)
- Root path `/` serves landing page
- Configure build for monorepo

**3. Update Root package.json**
- Manage all projects from root
- Build scripts for each week
- Shared dependencies

### Per-Project Changes

**Each week project needs to be aware of its basePath:**
- w1-resolution needs to know it's served at `/w1/`
- w2-something needs to know it's served at `/w2/`
- Frontend builds need to adjust asset paths

## Implementation Steps

### Phase 1: Create Infrastructure
1. Create root landing page (`index/` directory)
2. Create root `package.json`
3. Update `vercel.json` with rewrites
4. Update Vercel Dashboard settings

### Phase 2: Configure Each Project
1. w1-resolution: Configure for `/w1/` basePath
2. Update build commands
3. Test locally and in staging
4. Deploy to production

### Phase 3: Future Weeks
1. Create new week directory
2. Copy structure from w1
3. Add rewrite to vercel.json
4. Deploy

## Key Configuration Files

### vercel.json (Root)
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/w1/(.*)", "destination": "/w1-resolution/$1" },
    { "source": "/w2/(.*)", "destination": "/w2-something/$1" },
    { "source": "/w3/(.*)", "destination": "/w3-whatever/$1" }
  ]
}
```

### Root package.json
Manages:
- Root landing page build
- Each week's build
- Shared dependencies

### Vercel Dashboard Settings
- Root directory: `./ ` (project root)
- Build command: Custom script
- Output directory: `dist`

## Challenges & Solutions

### Challenge 1: Asset Paths
**Problem:** w1-resolution assets reference `/css` but should be `/w1/css`
**Solution:** 
- Use `basename` in Vite config for each project
- Frontend routes already use relative paths

### Challenge 2: Shared Dependencies
**Problem:** Duplicated node_modules across projects
**Solution:**
- Use Yarn workspaces or npm workspaces
- Or keep separate (simpler for weekly projects)

### Challenge 3: API Paths
**Problem:** API calls to `/api/chat` from `/w1/` subdirectory
**Solution:**
- Backend is at `daily-brief-nu.vercel.app/w1/api/*`
- Frontend needs to know its full path
- Use environment variables or base path detection

## Timeline

Phase 1: 30 minutes
- Create landing page
- Update vercel.json
- Configure Vercel

Phase 2: 20 minutes
- Test structure
- Debug any issues
- Deploy

Total: ~50 minutes

## Testing Checklist

- [ ] Landing page loads at `/`
- [ ] w1 loads at `/w1/`
- [ ] w1 API calls work from `/w1/`
- [ ] Static assets load correctly
- [ ] Links between pages work
- [ ] Future weeks ready for `/w2/`, `/w3/`

## Next Steps

1. Create root landing page (`index/`)
2. Set up new root `vercel.json`
3. Create new root `package.json`
4. Update w1-resolution for basePath
5. Test locally
6. Deploy to Vercel
7. Verify all URLs work
