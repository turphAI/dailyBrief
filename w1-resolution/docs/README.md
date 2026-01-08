# Resolution Tracker Documentation

## Table of Contents

### Project Overview
- [**projectBrief.md**](projectBrief.md) - Project goals, scope, and context
- [**experienceBrief.md**](experienceBrief.md) - User experience strategy and design

### Architecture & Design
- [**ARCHITECTURE_TOOLS_OVERVIEW.md**](ARCHITECTURE_TOOLS_OVERVIEW.md) - Backend tool system architecture
- [**ARCHITECTURE_DATA_SYNC.md**](ARCHITECTURE_DATA_SYNC.md) - Frontend/backend data synchronization strategy

### Features & Implementation
- [**FEATURES_STRUCTURED_INTERFACE.md**](FEATURES_STRUCTURED_INTERFACE.md) - Resolution visualization and detail view
- [**FEATURES_AUTO_SCROLL.md**](FEATURES_AUTO_SCROLL.md) - Auto-scroll message thread implementation
- [**FEATURES_CHART_FIX.md**](FEATURES_CHART_FIX.md) - Radar chart rendering and fixes

### Deployment & Operations
- [**DEPLOYMENT_VERCEL_SETUP.md**](DEPLOYMENT_VERCEL_SETUP.md) - Vercel frontend deployment configuration
- [**DEPLOYMENT_BUILD_STATUS.md**](DEPLOYMENT_BUILD_STATUS.md) - Build verification and status

---

## Quick Links

### Getting Started
1. Read [**projectBrief.md**](projectBrief.md) for project context
2. Review [**experienceBrief.md**](experienceBrief.md) for UX/design approach
3. Check [**DEPLOYMENT_VERCEL_SETUP.md**](DEPLOYMENT_VERCEL_SETUP.md) for deployment

### Understanding the System
- **Backend**: [ARCHITECTURE_TOOLS_OVERVIEW.md](ARCHITECTURE_TOOLS_OVERVIEW.md)
- **Frontend**: [FEATURES_STRUCTURED_INTERFACE.md](FEATURES_STRUCTURED_INTERFACE.md)
- **Data Flow**: [ARCHITECTURE_DATA_SYNC.md](ARCHITECTURE_DATA_SYNC.md)

### Troubleshooting
- Chart rendering issues? → [FEATURES_CHART_FIX.md](FEATURES_CHART_FIX.md)
- Build problems? → [DEPLOYMENT_BUILD_STATUS.md](DEPLOYMENT_BUILD_STATUS.md)
- Deployment questions? → [DEPLOYMENT_VERCEL_SETUP.md](DEPLOYMENT_VERCEL_SETUP.md)

---

## File Organization

```
docs/
├── README.md (this file)
├── projectBrief.md
├── experienceBrief.md
├── ARCHITECTURE_TOOLS_OVERVIEW.md
├── ARCHITECTURE_DATA_SYNC.md
├── FEATURES_STRUCTURED_INTERFACE.md
├── FEATURES_AUTO_SCROLL.md
├── FEATURES_CHART_FIX.md
├── DEPLOYMENT_VERCEL_SETUP.md
└── DEPLOYMENT_BUILD_STATUS.md
```

---

## Documentation Naming Convention

Files are organized by category:

- **ARCHITECTURE_** → System design and data flow
- **FEATURES_** → Implementation details and how-to guides
- **DEPLOYMENT_** → Deployment, build, and operations

---

## Contributing

When adding new documentation:
1. Place files in `/docs`
2. Use naming convention: `CATEGORY_DESCRIPTION.md`
3. Update this README with link and brief description
4. Keep files focused and modular

---

## Project Structure

```
w1-resolution/
├── docs/ ← All documentation here
├── backend/
│   ├── src/
│   │   ├── server.ts
│   │   ├── services/
│   │   ├── routes/
│   │   ├── tools/
│   │   └── prompts/
│   └── dist/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── utils/
│   │   └── App.tsx
│   └── dist/
├── README.md (project root readme)
└── package.json (monorepo if applicable)
```

---

**Last Updated:** January 2026
**Status:** Active Development
